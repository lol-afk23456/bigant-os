import {AppError,requireOwner,requireClient,uid,text,now} from '../store.js';

export function createAgentOutputs({store:s,production}) {
 s.db.exec(`CREATE TABLE IF NOT EXISTS os_agent_outputs(id TEXT PRIMARY KEY,job_id TEXT NOT NULL UNIQUE,client_id TEXT NOT NULL REFERENCES os_clients(id),agent TEXT NOT NULL,service TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,version INTEGER NOT NULL,status TEXT NOT NULL,visibility TEXT NOT NULL,payload TEXT NOT NULL,source_snapshot TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS os_agent_output_versions(output_id TEXT NOT NULL,version INTEGER NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(output_id,version));
 CREATE TRIGGER IF NOT EXISTS os_agent_output_history_no_update BEFORE UPDATE ON os_agent_output_versions BEGIN SELECT RAISE(ABORT,'Storico output immutabile'); END;
 CREATE TRIGGER IF NOT EXISTS os_agent_output_history_no_delete BEFORE DELETE ON os_agent_output_versions BEGIN SELECT RAISE(ABORT,'Storico output immutabile'); END;`);
 const current=id=>s.one('SELECT * FROM os_agent_outputs WHERE id=?',id);
 function approval(row,user) {
  const id=uid();s.run('INSERT OR IGNORE INTO os_approvals(id,client_id,kind,entity_id,version,title,body,status,requested_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',id,row.client_id,'agent_output',row.id,row.version,row.title,row.body,'pending',user.id,now());
  return s.one("SELECT id FROM os_approvals WHERE kind='agent_output' AND entity_id=? AND version=?",row.id,row.version).id;
 }
 function snapshot(row) {s.run('INSERT OR IGNORE INTO os_agent_output_versions VALUES(?,?,?,?,?,?)',row.id,row.version,row.title,row.body,row.payload,now());}
 function save(job,result,context,user) {
  const previous=s.one('SELECT * FROM os_agent_outputs WHERE job_id=?',job.id);if(previous)return get(user,previous.id);
  const id='output-'+job.id,definition=job.agent==='administration'?'admin':'internal';
  s.run('INSERT INTO os_agent_outputs VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',id,job.id,job.client_id,job.agent,result.service||'account',result.title||'Risultato DEMO',result.body||result.summary||'Controllo DEMO',1,'pending',definition,JSON.stringify(result),JSON.stringify({clientId:job.client_id,asOf:context.asOf,input:context.input,memory:context.memory.map(m=>({kind:m.kind,version:m.version,source:m.source})),tasks:context.tasks.map(t=>({id:t.id,status:t.status})),contents:context.contents.map(c=>({id:c.id,version:c.version})),sop:result.sop||null}),now(),now());
  const row=current(id);snapshot(row);if(!result.revisionInModule&&!result.prerequisite)approval(row,user);return get(user,id);
 }
 function authorize(user,row) {
  if(!row)throw new AppError('Risultato non trovato.',404);requireClient(s,user,row.client_id);
  if(user.role!=='owner'){
   if(row.visibility!=='client')throw new AppError('Risultato riservato ai soci.',403);
   const services=JSON.parse(s.one('SELECT services_json FROM os_clients WHERE id=?',row.client_id).services_json);
   if(!services.includes(row.service))throw new AppError('Servizio non incluso per questa attività.',403);
  }
 }
 function get(user,id) {
  const row=current(id);authorize(user,row);const payload=JSON.parse(row.payload),a=payload.revisionInModule?s.one('SELECT id,status FROM os_approvals WHERE id=? AND client_id=?',payload.links?.approvalId||null,row.client_id):s.one("SELECT id,status FROM os_approvals WHERE kind='agent_output' AND entity_id=? AND version=?",id,row.version);
  return {...payload,id:row.id,outputId:row.id,clientId:row.client_id,agent:row.agent,title:row.title,body:row.body,version:row.version,status:payload.prerequisite?'needs_input':a?.status||row.status,visibility:row.visibility,approvalId:a?.id,approvalStatus:a?.status,sourceSnapshot:user.role==='owner'?JSON.parse(row.source_snapshot):undefined};
 }
 function revise(user,id,body) {
  requireOwner(user);const row=current(id);authorize(user,row);if(row.version!==body.version)throw new AppError('Versione superata: ricarica il risultato.',409);
  if(JSON.parse(row.payload).prerequisite)throw new AppError('Completa i prerequisiti e rilancia l’agente prima della revisione.',409);
  if(JSON.parse(row.payload).revisionInModule)throw new AppError('Modifica la bozza nel modulo collegato: conserva lì versioni e approvazione.',409);
  const title=text(body.title??row.title,180),content=text(body.body,40000);if(!content||!title)throw new AppError('Titolo e testo sono obbligatori.');
  return s.transaction(()=>{
   s.run("UPDATE os_approvals SET status='obsolete' WHERE kind='agent_output' AND entity_id=? AND status IN('pending','approved')",id);
   const p={...JSON.parse(row.payload),title,body:content,sections:[],editedBy:user.id,edited:true};
   s.run("UPDATE os_agent_outputs SET title=?,body=?,version=version+1,status='pending',payload=?,updated_at=? WHERE id=?",title,content,JSON.stringify(p),now(),id);
   const next=current(id);snapshot(next);approval(next,user);s.audit(user,row.client_id,'Risultato agente revisionato',id,{version:next.version},row.visibility==='admin'?'admin':'internal');return get(user,id);
  });
 }
 function decide(user,a,body) {
  const row=current(a.entity_id);authorize(user,row);if(user.role==='collaborator')throw new AppError('La decisione spetta al cliente o al socio.',403);
  if(a.kind!=='agent_output'||a.status!=='pending'||a.version!==row.version||row.status!=='pending')throw new AppError('Decisione già registrata o versione superata.',409);
  if(!['approved','rejected','changes'].includes(body.decision))throw new AppError('Decisione non valida.');if(body.decision!=='approved'&&!text(body.reason))throw new AppError('Indica il motivo: sarà conservato nel feedback.');
  return s.transaction(()=>{
   if(!s.run("UPDATE os_approvals SET status=?,decision_by=?,decision_at=?,reason=? WHERE id=? AND status='pending'",body.decision,user.id,now(),text(body.reason,1500),a.id).changes)throw new AppError('Decisione già registrata.',409);
   s.run('UPDATE os_agent_outputs SET status=?,updated_at=? WHERE id=?',body.decision,now(),row.id);
   if(body.decision!=='approved') {
    const kind='agent-feedback:'+row.agent,visibility=row.visibility==='admin'?'admin':'internal',prev=s.one('SELECT content FROM os_memory WHERE client_id=? AND kind=?',row.client_id,kind)?.content||'# Feedback agente · DEMO';
    s.run('INSERT INTO os_memory VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(client_id,kind) DO UPDATE SET content=excluded.content,version=os_memory.version+1,source=excluded.source,updated_at=excluded.updated_at',uid(),row.client_id,kind,(prev+'\n'+now()+' · '+text(body.reason,1500)).slice(-20000),visibility,1,'Decisione '+a.id,now());
   }
   s.audit(user,row.client_id,'Decisione sul risultato agente',row.id,{decision:body.decision,version:a.version},row.visibility==='admin'?'admin':'internal');return {ok:true,externalActions:false,output:get(user,row.id)};
  });
 }
 return {save,get,revise,decide};
}
