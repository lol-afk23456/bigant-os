import {AppError,requireClient,uid} from './store.js';
import {services} from './registry.js';
import {isISODate} from './date-validation.js';

const excluded=new Set(['growth','marketplace','apple-leasing']);
function str(value,label,max,required=true){
 if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim()))throw new AppError(`${label}: testo non valido.`);
 return value.trim();
}
function number(value){
 if(value===null||value===undefined||value==='')return null;
 if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>1e12)throw new AppError('Misura non valida.');
 return value;
}
function sourceUrl(value){
 if(!value)return null;
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.href.length>2000||[...u.searchParams.keys()].some(k=>/token|password|secret|api.?key|^code$/i.test(k)))throw Error();return u.href;}
 catch{throw new AppError('La fonte deve essere un indirizzo HTTPS senza credenziali.');}
}

export function createClientResults({store:s,clock=()=>new Date()}){
 s.db.exec(`CREATE TABLE IF NOT EXISTS os_client_reports(id TEXT PRIMARY KEY,client_id TEXT NOT NULL,period TEXT NOT NULL,UNIQUE(client_id,period));
 CREATE TABLE IF NOT EXISTS os_client_report_versions(report_id TEXT NOT NULL,version INTEGER NOT NULL,body_json TEXT NOT NULL,created_by TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(report_id,version));
 CREATE TABLE IF NOT EXISTS os_client_report_events(id INTEGER PRIMARY KEY AUTOINCREMENT,report_id TEXT NOT NULL,version INTEGER NOT NULL,action TEXT NOT NULL CHECK(action IN('publish','hide')),services_json TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS os_client_report_events_report ON os_client_report_events(report_id,id);`);
 for(const table of ['os_client_reports','os_client_report_versions','os_client_report_events'])s.db.exec(`CREATE TRIGGER IF NOT EXISTS ${table}_immutable_update BEFORE UPDATE ON ${table} BEGIN SELECT RAISE(ABORT,'Storico risultati immutabile'); END; CREATE TRIGGER IF NOT EXISTS ${table}_immutable_delete BEFORE DELETE ON ${table} BEGIN SELECT RAISE(ABORT,'Storico risultati immutabile'); END;`);
 for(const [table,condition]of [
  ['os_client_reports','id=NEW.id OR (client_id=NEW.client_id AND period=NEW.period)'],
  ['os_client_report_versions','report_id=NEW.report_id AND version=NEW.version'],
  ['os_client_report_events','id=NEW.id']
 ])s.db.exec(`CREATE TRIGGER IF NOT EXISTS ${table}_immutable_replace BEFORE INSERT ON ${table} WHEN EXISTS(SELECT 1 FROM ${table} WHERE ${condition}) BEGIN SELECT RAISE(ABORT,'Storico risultati immutabile'); END;`);
 // Persist revocation: removing and re-adding a service must not republish old reports.
 s.db.exec(`CREATE TRIGGER IF NOT EXISTS os_client_reports_revoke_services AFTER UPDATE OF services_json,active ON os_clients WHEN OLD.services_json!=NEW.services_json OR OLD.active!=NEW.active BEGIN
 INSERT INTO os_client_report_events(report_id,version,action,services_json,actor,created_at)
 SELECT r.id,v.version,'hide','[]','system:client-change',strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM os_client_reports r JOIN os_client_report_versions v ON v.report_id=r.id WHERE r.client_id=NEW.id AND v.version=(SELECT MAX(version) FROM os_client_report_versions WHERE report_id=r.id); END;
 CREATE TRIGGER IF NOT EXISTS os_client_reports_revoke_publisher AFTER UPDATE OF role,active,must_change_password ON os_users WHEN OLD.role!=NEW.role OR OLD.active!=NEW.active OR OLD.must_change_password!=NEW.must_change_password BEGIN
 INSERT INTO os_client_report_events(report_id,version,action,services_json,actor,created_at)
 SELECT e.report_id,e.version,'hide','[]','system:publisher-change',strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM os_client_report_events e WHERE e.actor=NEW.id AND e.action='publish' AND e.id=(SELECT MAX(id) FROM os_client_report_events WHERE report_id=e.report_id); END;`);
 function identity(user,owner=false){
  const current=user?.id?s.one('SELECT * FROM os_users WHERE id=?',user.id):null;
  if(!current?.active||current.must_change_password||current.id==='os-orchestrator'||!(owner?['owner']:['owner','client']).includes(current.role))throw new AppError('Risultati non accessibili.',403);
  if(user.session_id&&!s.one('SELECT 1 FROM os_sessions WHERE id=? AND user_id=? AND expires_at>?',user.session_id,current.id,clock().getTime()))throw new AppError('Sessione scaduta.',401);
  return current;
 }
 function scope(user,clientId,owner=false){
  const current=identity(user,owner);requireClient(s,current,clientId);
  if(clientId==='demo-bigant')throw new AppError('I risultati sono riservati alle attività clienti.',403);
  const client=s.one('SELECT id,name,services_json FROM os_clients WHERE id=?',clientId);
  const active=services.filter(row=>JSON.parse(client.services_json).includes(row.id)&&!excluded.has(row.id)).map(({id,name})=>({id,name}));
  return {user:current,client,services:active};
 }
 function period(value){if(typeof value!=='string'||!/^\d{4}-\d{2}$/.test(value)||!isISODate(value+'-01')||value>clock().toISOString().slice(0,7))throw new AppError('Scegli un mese valido, non futuro.');return value;}
 function entries(rows,c,month){
  if(!Array.isArray(rows)||rows.length>40)throw new AppError('Massimo 40 voci per report.');
  return rows.map(row=>{
   if(!row||!['goal','work','result'].includes(row.kind)||!c.services.some(service=>service.id===row.serviceId))throw new AppError('Tipo di voce o servizio non valido.');
   if(!isISODate(row.date)||!row.date.startsWith(month)||row.date>clock().toISOString().slice(0,10))throw new AppError('La data della voce deve appartenere al mese ed essere già trascorsa.');
   const value=number(row.value),target=number(row.target);
   if(row.kind==='work'&&value!==null)throw new AppError('Inserisci le misure in una voce Risultato o Obiettivo.');
   if(row.kind!=='goal'&&target!==null)throw new AppError('Il valore obiettivo è previsto solo per gli obiettivi.');
   const unit=str(row.unit??'','Unità',40,false);if((value!==null||target!==null)&&!unit)throw new AppError('Indica l’unità della misura.');
   return {kind:row.kind,serviceId:row.serviceId,title:str(row.title,'Titolo voce',160),detail:str(row.detail??'','Descrizione',1200,false),value,target,unit,date:row.date,source:str(row.source,'Fonte',300),url:sourceUrl(row.url)};
  });
 }
 const head=report=>s.one('SELECT * FROM os_client_report_versions WHERE report_id=? ORDER BY version DESC LIMIT 1',report.id);
 const lastEvent=report=>s.one('SELECT * FROM os_client_report_events WHERE report_id=? ORDER BY id DESC LIMIT 1',report.id);
 const serviceStamp=c=>JSON.stringify(c.services.map(row=>row.id).sort());
 function projection(report,c,internal=false){
  const row=head(report),event=lastEvent(report),body=JSON.parse(row.body_json);
  const publisher=event?s.one('SELECT role,active,must_change_password FROM os_users WHERE id=?',event.actor):null;
  const available=body.entries.every(entry=>c.services.some(service=>service.id===entry.serviceId));
  const published=available&&event?.action==='publish'&&event.version===row.version&&event.services_json===serviceStamp(c)&&publisher?.active===1&&publisher.role==='owner'&&!publisher.must_change_password;
  if(!internal&&!published)return null;
  return {id:report.id,period:report.period,version:row.version,...body,published,publishedAt:published?event.created_at:null,
   ...(internal?{updatedAt:row.created_at,canPublish:available&&body.entries.length>0,status:published?'Visibile al cliente':event?.action==='publish'?'Da verificare di nuovo':'Bozza interna'}:{})};
 }
 const reportsFor=id=>s.query('SELECT * FROM os_client_reports WHERE client_id=? ORDER BY period DESC',id);
 function published(user,clientId){
  const c=scope(user,clientId);return {clientId,clientName:c.client.name,reports:reportsFor(clientId).map(r=>projection(r,c)).filter(Boolean)};
 }
 function state(user,clientId,selected){
  const c=scope(user,clientId,true),reports=reportsFor(clientId).map(r=>projection(r,c,true));
  const month=selected?period(selected):reports[0]?.period||clock().toISOString().slice(0,7);
  const report=reports.find(r=>r.period===month)||null;
  return {clientId,clientName:c.client.name,services:c.services,period:month,report,reports:reports.map(({id,period,version,status,published})=>({id,period,version,status,published})),
   history:report?s.query('SELECT version,created_at FROM os_client_report_versions WHERE report_id=? ORDER BY version DESC',report.id):[],
   events:report?s.query('SELECT version,action,created_at FROM os_client_report_events WHERE report_id=? ORDER BY id DESC',report.id):[]};
 }
 function index(user){identity(user,true);return {items:s.query("SELECT id FROM os_clients WHERE active=1 AND id!='demo-bigant' ORDER BY name").map(({id})=>{const c=scope(user,id,true),report=reportsFor(id)[0];return {clientId:id,clientName:c.client.name,latest:report?projection(report,c,true):null};})};}
 function save(user,clientId,input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new AppError('Report non valido.');
  const c=scope(user,clientId,true),month=period(input.period),body={summary:str(input.summary,'Sintesi',2000),nextSteps:str(input.nextSteps??'','Prossimi passi',1500,false),entries:entries(input.entries,c,month)};
  if(!Number.isInteger(input.version)||input.version<0)throw new AppError('Versione non valida.');
  s.transaction(()=>{
   let report=s.one('SELECT * FROM os_client_reports WHERE client_id=? AND period=?',clientId,month),previous=report?head(report):null;
   if((previous?.version||0)!==input.version)throw new AppError('Il report è cambiato. Ricarica prima di salvare.',409);
   if(previous?.body_json===JSON.stringify(body))return;
   if(!report){report={id:uid(),client_id:clientId,period:month};s.run('INSERT INTO os_client_reports VALUES(?,?,?)',report.id,clientId,month);}
   s.run('INSERT INTO os_client_report_versions VALUES(?,?,?,?,?)',report.id,input.version+1,JSON.stringify(body),c.user.id,clock().toISOString());
   s.audit(c.user,clientId,'Report cliente salvato',report.id,{version:input.version+1},'admin');
  });return state(user,clientId,month);
 }
 function decide(user,clientId,input,action){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new AppError('Decisione non valida.');
  const c=scope(user,clientId,true),report=s.one('SELECT * FROM os_client_reports WHERE id=? AND client_id=?',input.id,clientId);
  if(!report)throw new AppError('Report non trovato.',404);
  s.transaction(()=>{
   const current=projection(report,c,true);if(current.version!==input.version)throw new AppError('La versione da verificare è cambiata.',409);
   if(action==='publish'&&(input.confirmed!==true||!current.canPublish))throw new AppError('Verifica fonti, contenuti e servizi della versione corrente prima di confermare.');
   if((action==='publish'&&current.published)||(action==='hide'&&lastEvent(report)?.action==='hide'))return;
   s.run('INSERT INTO os_client_report_events(report_id,version,action,services_json,actor,created_at) VALUES(?,?,?,?,?,?)',report.id,current.version,action,serviceStamp(c),c.user.id,clock().toISOString());
   s.audit(c.user,clientId,action==='publish'?'Report visibile al cliente':'Report nascosto al cliente',report.id,{version:current.version},'admin');
  });return state(user,clientId,report.period);
 }
 return {index,state,save,published,publish:(u,c,b)=>decide(u,c,b,'publish'),hide:(u,c,b)=>decide(u,c,b,'hide')};
}
