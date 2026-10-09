import { AppError, requireClient, requireOwner, uid, now, text, integer } from './store.js';
import { services } from './registry.js';
const states=['IDEA','IN PRODUZIONE','DA APPROVARE','APPROVATO','PROGRAMMATO','PUBBLICATO','RIUTILIZZABILE'];
export function createProduction({store:s}) {
  s.db.exec(`CREATE TABLE IF NOT EXISTS os_approval_origins (approval_id TEXT PRIMARY KEY REFERENCES os_approvals(id),agent TEXT NOT NULL,quality TEXT NOT NULL);
    CREATE TRIGGER IF NOT EXISTS os_approval_origins_no_update BEFORE UPDATE ON os_approval_origins BEGIN SELECT RAISE(ABORT,'Provenienza della versione immutabile'); END;`);
  function tagApproval(id,agent,quality) { s.run('INSERT OR IGNORE INTO os_approval_origins VALUES(?,?,?)',id,text(agent,200),text(quality,200)||'Da verificare'); }

  function writable(user,clientId) { requireClient(s,user,clientId); if(user.role==='client')throw new AppError('Il cliente approva e richiede modifiche; la produzione è del team.',403); }
  function serviceAllowed(clientId,service) {const c=s.one('SELECT services_json FROM os_clients WHERE id=?',clientId);if(!services.some(x=>x.id===service)||!JSON.parse(c.services_json).includes(service))throw new AppError('Servizio non attivo per questa attività.',403);}
  function saveMemory(user,clientId,kind,content,source='Modifica manuale DEMO') {
    writable(user,clientId);if(!['master','dna','strategy','feedback','report'].includes(kind))throw new AppError('Tipo di memoria non disponibile.');
    if(s.one("SELECT 1 FROM os_memory WHERE client_id=? AND kind=? AND visibility='admin'",clientId,kind))requireOwner(user);
    if(!text(content))throw new AppError('La memoria non può essere vuota.');
    s.run('INSERT INTO os_memory VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(client_id,kind) DO UPDATE SET visibility=CASE WHEN os_memory.visibility=\'admin\' THEN \'admin\' ELSE \'internal\' END,content=excluded.content,version=os_memory.version+1,source=excluded.source,updated_at=excluded.updated_at',uid(),clientId,kind,text(content,20000),'internal',1,text(source,500),now());
    s.audit(user,clientId,'Memoria aggiornata',kind,{source});return s.one('SELECT * FROM os_memory WHERE client_id=? AND kind=?',clientId,kind);
  }
  function feedback(clientId,message,user) {
    const previous=s.one("SELECT content FROM os_memory WHERE client_id=? AND kind='feedback'",clientId)?.content||'# Feedback DEMO\n';
    s.run('INSERT INTO os_memory VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(client_id,kind) DO UPDATE SET content=excluded.content,version=os_memory.version+1,updated_at=excluded.updated_at',uid(),clientId,'feedback',`${previous}\n- ${now()} · ${user.name}: ${text(message,1500)}`,'internal',1,'Decisione registrata in approvazione',now());
  }
  function requestApproval(user,content) {
    if(content.state!=='DA APPROVARE')throw new AppError('Porta prima il contenuto in revisione.',409);
    const id=uid();s.run('INSERT OR IGNORE INTO os_approvals(id,client_id,kind,entity_id,version,title,body,status,requested_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',id,content.client_id,'content',content.id,content.version,content.title,content.body,'pending',user.id,now());
    return s.one("SELECT * FROM os_approvals WHERE kind='content' AND entity_id=? AND version=?",content.id,content.version);
  }
  async function handle({method,path,body={},user,clientId}) {
    requireClient(s,user,clientId);
    const purchased=JSON.parse(s.one('SELECT services_json FROM os_clients WHERE id=?',clientId).services_json);
    const visible=row=>user.role!=='client'||purchased.includes(row.service)||row.service==='account';
    if(method==='GET'&&path==='/state') return {data:{contents:s.query('SELECT * FROM os_contents WHERE client_id=?',clientId).filter(visible),tasks:s.query('SELECT * FROM os_tasks WHERE client_id=?',clientId).filter(visible),states,scheduling:'PROGRAMMATO significa pianificato nel calendario DEMO; nessun canale esterno aggiornato.',externalPublished:false}};
    if(method==='POST'&&path==='/contents') {
      writable(user,clientId);serviceAllowed(clientId,body.service);if(!text(body.title)||!text(body.body))throw new AppError('Titolo e testo sono obbligatori.');
      const id=uid();s.run('INSERT INTO os_contents VALUES(?,?,?,?,?,?,?,?,?,?)',id,clientId,body.service,text(body.title,180),text(body.body,20000),'IDEA',null,1,text(body.source,500)||'Bozza manuale DEMO',now());s.audit(user,clientId,'Contenuto creato',id);return {data:s.one('SELECT * FROM os_contents WHERE id=?',id),status:201};
    }
    let m=path.match(/^\/contents\/([^/]+)$/);
    if(m&&method==='PATCH') {
      writable(user,clientId);const c=s.one('SELECT * FROM os_contents WHERE id=? AND client_id=?',m[1],clientId);if(!c)throw new AppError('Contenuto non trovato.',404);if(body.version!==c.version)throw new AppError('La bozza è cambiata. Ricaricala prima di modificarla.',409);
      return {data:s.transaction(()=>{
        const edited=body.body!==undefined||body.title!==undefined;
        if(edited) {const t=text(body.title??c.title,180),b=text(body.body??c.body,20000);if(!t||!b)throw new AppError('Titolo e testo sono obbligatori.');s.run("UPDATE os_contents SET title=?,body=?,version=version+1,state='IN PRODUZIONE',scheduled_at=NULL,updated_at=? WHERE id=?",t,b,now(),c.id);s.run("UPDATE os_approvals SET status='obsolete' WHERE entity_id=? AND kind='content' AND status IN('pending','approved')",c.id);}
        else {
          const next=body.state;
          const transitions={'IDEA':['IN PRODUZIONE'],'IN PRODUZIONE':['DA APPROVARE'],'DA APPROVARE':['IN PRODUZIONE'],'APPROVATO':['PROGRAMMATO'],'PROGRAMMATO':['APPROVATO'],'PUBBLICATO':['RIUTILIZZABILE'],'RIUTILIZZABILE':[]};
          if(next==='PUBBLICATO')throw new AppError('Pubblicazione esterna disabilitata: non registriamo una pubblicazione inesistente.',409);
          if(!transitions[c.state]?.includes(next))throw new AppError('Passaggio di stato non consentito.',409);
          let schedule=null;
          if(next==='PROGRAMMATO') {if(!s.one("SELECT 1 FROM os_approvals WHERE entity_id=? AND version=? AND status='approved'",c.id,c.version))throw new AppError('Serve approvare questa versione.',409);if(!Number.isFinite(Date.parse(body.scheduled_at))||Date.parse(body.scheduled_at)<=Date.now())throw new AppError('Scegli una data futura.');schedule=new Date(body.scheduled_at).toISOString();}
          s.run('UPDATE os_contents SET state=?,scheduled_at=?,updated_at=? WHERE id=?',next,schedule,now(),c.id);
          if(next==='DA APPROVARE')requestApproval(user,{...c,state:next});
        }
        s.audit(user,clientId,'Contenuto aggiornato',c.id,{state:s.one('SELECT state FROM os_contents WHERE id=?',c.id).state});return s.one('SELECT * FROM os_contents WHERE id=?',c.id);
      })};
    }
    m=path.match(/^\/approvals\/([^/]+)$/);
    if(m&&method==='POST') {
      if(user.role==='client')throw new AppError('La decisione spetta al team BigAnt.',403);
      const a=s.one('SELECT * FROM os_approvals WHERE id=? AND client_id=?',m[1],clientId);if(!a)throw new AppError('Approvazione non trovata.',404);
      if(a.kind!=='content') {requireOwner(user);throw new AppError('Usa il modulo responsabile per questa decisione.',409);}
      const c=s.one('SELECT * FROM os_contents WHERE id=? AND client_id=?',a.entity_id,clientId);
      if(user.role==='collaborator'&&c?.service!=='social')requireOwner(user);
      if(c)serviceAllowed(clientId,c.service);
      if(!c||a.status!=='pending'||c.version!==a.version||c.state!=='DA APPROVARE')throw new AppError('Richiesta già decisa o versione superata.',409);
      if(!['approved','rejected','changes'].includes(body.decision))throw new AppError('Decisione non valida.');if(body.decision!=='approved'&&!text(body.reason))throw new AppError('Indica il motivo: tornerà nel feedback al team.');
      return {data:s.transaction(()=>{
        s.run('UPDATE os_approvals SET status=?,decision_by=?,decision_at=?,reason=? WHERE id=?',body.decision,user.id,now(),text(body.reason,1500),a.id);
        s.run('UPDATE os_contents SET state=?,updated_at=? WHERE id=?',body.decision==='approved'?'APPROVATO':'IN PRODUZIONE',now(),c.id);
        if(body.decision!=='approved') {feedback(clientId,body.reason,user);s.run('UPDATE os_contents SET version=version+1 WHERE id=?',c.id);}
        s.audit(user,clientId,'Decisione sul contenuto',a.id,{decision:body.decision,version:a.version,reason:text(body.reason,1500)},'client');return {ok:true};
      })};
    }
    if(method==='POST'&&path==='/tasks') {writable(user,clientId);if(!text(body.title))throw new AppError('Indica il lavoro.');serviceAllowed(clientId,body.service);if(body.due&&!Number.isFinite(Date.parse(body.due)))throw new AppError('Scadenza non valida.');const id=uid();s.run('INSERT INTO os_tasks VALUES(?,?,?,?,?,?,?,?,?,?,?)',id,clientId,text(body.title,180),body.service,text(body.assignee,100),body.due?new Date(body.due).toISOString():null,'todo',integer(Number(body.estimate_minutes||0)),0,'Attività manuale DEMO',now());s.audit(user,clientId,'Lavoro creato',id);return {data:{id},status:201};}
    m=path.match(/^\/tasks\/([^/]+)$/);if(method==='PATCH'&&m) {writable(user,clientId);const t=s.one('SELECT * FROM os_tasks WHERE id=? AND client_id=?',m[1],clientId);if(!t)throw new AppError('Lavoro non trovato.',404);const status=body.status??t.status;if(!['todo','doing','done','blocked'].includes(status))throw new AppError('Stato non valido.');const minutes=body.actual_minutes===undefined?t.actual_minutes:integer(body.actual_minutes);s.run('UPDATE os_tasks SET status=?,actual_minutes=? WHERE id=?',status,minutes,t.id);s.audit(user,clientId,'Lavoro aggiornato',t.id,{status,minutes});return {data:{ok:true}};}
    if(method==='POST'&&path==='/memory')return {data:saveMemory(user,clientId,body.kind,body.content,body.source)};
    if(method==='GET'&&path==='/memory') {if(user.role==='client')throw new AppError('Memoria operativa riservata al team.',403);return {data:s.query("SELECT * FROM os_memory WHERE client_id=? AND visibility!='admin'",clientId)};}
    if(method==='GET'&&path==='/memory/history') {if(user.role==='client')throw new AppError('Memoria operativa riservata al team.',403);return {data:s.query("SELECT v.* FROM os_memory_versions v JOIN os_memory m ON m.client_id=v.client_id AND m.kind=v.kind WHERE v.client_id=? AND v.visibility!='admin' AND m.visibility!='admin' ORDER BY v.kind,v.version DESC",clientId)};}
    if(method==='GET'&&path==='/memory/export') {if(user.role==='client')throw new AppError('Memoria operativa riservata al team.',403);return {contentType:'text/markdown; charset=utf-8',data:s.query("SELECT * FROM os_memory WHERE client_id=? AND visibility!='admin'",clientId).map(m=>`# ${m.kind} · v${m.version}\nFonte: ${m.source}\n\n${m.content}`).join('\n\n---\n\n')};}
    if(method==='POST'&&path==='/ask') {
      const question=text(body.question,2000);if(!question)throw new AppError('Scrivi la domanda.');
      const tasks=s.query('SELECT title,status,due,service FROM os_tasks WHERE client_id=?',clientId).filter(visible),contents=s.query('SELECT title,state,service FROM os_contents WHERE client_id=?',clientId).filter(visible);
      const response=`DEMO, riepilogo basato solo sui dati di questa attività: ${tasks.length} lavori registrati, ${tasks.filter(t=>t.status==='done').length} completati; ${contents.length} contenuti, ${contents.filter(c=>c.state==='DA APPROVARE').length} da approvare. Le fonti marketing esterne non sono collegate: non posso indicare risultati o metriche reali.`;
      let taskId=null;if(body.createTask===true) {taskId=uid();s.run('INSERT INTO os_tasks VALUES(?,?,?,?,?,?,?,?,?,?,?)',taskId,clientId,'Richiesta cliente: '+question.slice(0,140),'account','',null,'todo',0,0,'Domanda DEMO del cliente',now());s.audit(user,clientId,'Richiesta del cliente registrata',taskId,{},'client');}
      return {data:{answer:response,sources:['Lavori di questa attività','Contenuti di questa attività'],taskId,simulation:true}};
    }
    return null;
  }
  return {handle,saveMemory,requestApproval,tagApproval,states};
}
