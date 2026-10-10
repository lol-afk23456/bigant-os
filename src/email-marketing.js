import {AppError,requireClient,uid} from './store.js';
import {isISODate} from './date-validation.js';

export function createEmailMarketing({store:s,clock=()=>new Date()}){
 s.db.exec(`CREATE TABLE IF NOT EXISTS em_contacts (
  id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES os_clients(id),email TEXT NOT NULL COLLATE NOCASE,
  name TEXT NOT NULL,version INTEGER NOT NULL,status TEXT NOT NULL CHECK(status IN('granted','withdrawn')),
  created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(client_id,email));
 CREATE TABLE IF NOT EXISTS em_consents (
  contact_id TEXT NOT NULL REFERENCES em_contacts(id),version INTEGER NOT NULL,status TEXT NOT NULL CHECK(status IN('granted','withdrawn')),
  consent_date TEXT NOT NULL,source TEXT NOT NULL,privacy_version TEXT NOT NULL,actor TEXT NOT NULL,recorded_at TEXT NOT NULL,
  PRIMARY KEY(contact_id,version));
 CREATE TRIGGER IF NOT EXISTS em_consents_no_update BEFORE UPDATE ON em_consents BEGIN SELECT RAISE(ABORT,'Storico consensi immutabile'); END;
 CREATE TRIGGER IF NOT EXISTS em_consents_no_delete BEFORE DELETE ON em_consents BEGIN SELECT RAISE(ABORT,'Storico consensi immutabile'); END;
 CREATE TRIGGER IF NOT EXISTS em_consents_no_replace BEFORE INSERT ON em_consents WHEN EXISTS(SELECT 1 FROM em_consents WHERE contact_id=NEW.contact_id AND version=NEW.version) BEGIN SELECT RAISE(ABORT,'Storico consensi immutabile'); END;`);
 const field=(value,max,required=true)=>{if(typeof value!=='string'||value.trim().length>max||(required&&!value.trim())||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw new AppError('Completa i campi richiesti e rispetta la lunghezza indicata.');return value.trim();};
 function scope(user,clientId,write=false){
  const current=user?.id?s.one('SELECT * FROM os_users WHERE id=?',user.id):null;
  if(!current?.active||current.must_change_password||current.id==='os-orchestrator'||!['owner','client','collaborator'].includes(current.role))throw new AppError('Accesso non consentito.',403);
  if(user.session_id&&!s.one('SELECT 1 FROM os_sessions WHERE id=? AND user_id=? AND expires_at>?',user.session_id,current.id,clock().getTime()))throw new AppError('Sessione scaduta.',401);
  requireClient(s,current,clientId);
  const client=s.one('SELECT id,name,services_json FROM os_clients WHERE id=? AND active=1',clientId);
  if(!client||!JSON.parse(client.services_json).includes('email-marketing'))throw new AppError('Email marketing non attivo per questa attività.',403);
  if(write&&current.role==='collaborator')throw new AppError('I contatti vengono aggiornati dal socio o dal titolare dell’attività.',403);
  return {current,client};
 }
 function contact(clientId,id){const row=s.one('SELECT * FROM em_contacts WHERE id=? AND client_id=?',id,clientId);if(!row)throw new AppError('Contatto non disponibile.',404);return row;}
 function inputObject(input){if(!input||typeof input!=='object'||Array.isArray(input))throw new AppError('Dati non validi.');}
 function evidence(input){
  inputObject(input);
  if(input.confirmed!==true)throw new AppError('Conferma di avere controllato la prova del consenso.');
  if(!isISODate(input.consentDate)||input.consentDate>clock().toISOString().slice(0,10))throw new AppError('Indica una data di consenso valida, non futura.');
  return {date:input.consentDate,source:field(input.source,800),privacy:field(input.privacyVersion,160)};
 }
 function state(user,clientId,{q='',page=1}={}){
  const {current,client}=scope(user,clientId),query=field(q,120,false).toLowerCase(),pageNumber=Number(page);
  if(!Number.isSafeInteger(pageNumber)||pageNumber<1||pageNumber>100000)throw new AppError('Pagina non valida.');
  const filter='client_id=? AND (instr(lower(email),?)>0 OR instr(lower(name),?)>0)',params=[clientId,query,query];
  const total=s.one(`SELECT COUNT(*) n FROM em_contacts WHERE ${filter}`,...params).n;
  const pages=Math.max(1,Math.ceil(total/50)),selected=Math.min(pageNumber,pages);
  const items=s.query(`SELECT id,email,name,status,version,created_at,updated_at FROM em_contacts WHERE ${filter} ORDER BY email,id LIMIT 50 OFFSET ?`,...params,(selected-1)*50);
  const counts=s.one("SELECT COUNT(*) total,COALESCE(SUM(status='granted'),0) granted,COALESCE(SUM(status='withdrawn'),0) withdrawn FROM em_contacts WHERE client_id=?",clientId);
  return {clientId,clientName:client.name,canManage:current.role!=='collaborator',items,counts,q:query,page:selected,pages,total,source:'Registro contatti Email marketing di questa attività',asOf:clock().toISOString(),sendingEnabled:false};
 }
 function history(user,clientId,id){scope(user,clientId);const row=contact(clientId,id);return {contact:row,events:s.query('SELECT version,status,consent_date,source,privacy_version,recorded_at FROM em_consents WHERE contact_id=? ORDER BY version DESC',id)};}
 function add(user,clientId,input){
  const {current}=scope(user,clientId,true),proof=evidence(input),email=field(input.email,254).toLowerCase(),name=field(input.name??'',140,false);
  if(!/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/i.test(email)||email.split('@')[0].length>64||email.includes('..')||!email.split('@')[1].split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))throw new AppError('Inserisci un indirizzo email valido.');
  return s.transaction(()=>{
   if(s.one('SELECT 1 FROM em_contacts WHERE client_id=? AND email=?',clientId,email))throw new AppError('Il contatto esiste già. Apri il suo storico per controllare il consenso.',409);
   const id=uid(),time=clock().toISOString();
   s.run('INSERT INTO em_contacts VALUES(?,?,?,?,?,?,?,?)',id,clientId,email,name,1,'granted',time,time);
   s.run('INSERT INTO em_consents VALUES(?,?,?,?,?,?,?,?)',id,1,'granted',proof.date,proof.source,proof.privacy,current.id,time);
   s.audit(current,clientId,'Contatto Email marketing registrato',id,{version:1});
   return {id,version:1};
  });
 }
 function consent(user,clientId,id,input){
  const {current}=scope(user,clientId,true);inputObject(input);
  if(!['granted','withdrawn'].includes(input.status)||!Number.isSafeInteger(input.version))throw new AppError('Decisione non valida.');
  const time=clock().toISOString(),proof=input.status==='granted'?evidence(input):{date:time.slice(0,10),source:field(input.source,800),privacy:''};
  return s.transaction(()=>{
   const row=contact(clientId,id);
   if(row.version!==input.version)throw new AppError('Il contatto è cambiato. Riapri lo storico.',409);
   if(row.status===input.status)throw new AppError('Il contatto ha già questo stato.',409);
   const previous=s.one('SELECT * FROM em_consents WHERE contact_id=? AND version=?',id,row.version);
   if(input.status==='granted'&&(proof.date<previous.consent_date||s.one("SELECT 1 FROM em_consents WHERE contact_id=? AND status='granted' AND source=? AND consent_date=? AND privacy_version=?",id,proof.source,proof.date,proof.privacy)))throw new AppError('Serve una nuova prova del consenso, successiva alla revoca.');
   const version=row.version+1;
   s.run('UPDATE em_contacts SET status=?,version=?,updated_at=? WHERE id=?',input.status,version,time,id);
   s.run('INSERT INTO em_consents VALUES(?,?,?,?,?,?,?,?)',id,version,input.status,proof.date,proof.source,proof.privacy,current.id,time);
   s.audit(current,clientId,'Consenso Email marketing aggiornato',id,{version,status:input.status});
   return {id,version};
  });
 }
 async function handle({method,path,user,clientId,body}){
  const url=new URL(path,'http://local.invalid'),p=url.pathname;
  if(p==='/contacts'&&method==='GET')return {data:state(user,clientId,{q:url.searchParams.get('q')||'',page:url.searchParams.get('page')||1})};
  if(p==='/contacts'&&method==='POST')return {data:add(user,clientId,body),status:201};
  const match=p.match(/^\/contacts\/([a-f0-9-]+)\/(history|consent)$/);
  if(match&&method==='GET'&&match[2]==='history')return {data:history(user,clientId,match[1])};
  if(match&&method==='POST'&&match[2]==='consent')return {data:consent(user,clientId,match[1],body)};
  return null;
 }
 return {state,add,history,consent,handle};
}
