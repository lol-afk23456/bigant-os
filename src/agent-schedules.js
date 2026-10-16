import {createHash,randomUUID} from 'node:crypto';
import {AppError,requireOwner,requireClient} from './store.js';
import {nextRun} from './orchestrator.js';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const cadences=['daily','weekly-monday','weekly-friday','monthly'];
const duration=30*24*60*60*1000;

export function createAgentSchedules({store:s,work,clock=()=>new Date(),enabled=()=>false}){
 s.db.exec(`CREATE TABLE IF NOT EXISTS os_ai_schedules (
  id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES os_clients(id),agent TEXT NOT NULL,
  authorized_by TEXT NOT NULL REFERENCES os_users(id),brief TEXT NOT NULL,packet_json TEXT NOT NULL,
  fingerprint TEXT NOT NULL,cadence TEXT NOT NULL,expires_at TEXT NOT NULL,next_at TEXT NOT NULL,
  enabled INTEGER NOT NULL,version INTEGER NOT NULL,reason TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
  UNIQUE(client_id,agent));
 CREATE TABLE IF NOT EXISTS os_ai_schedule_versions (
  schedule_id TEXT NOT NULL REFERENCES os_ai_schedules(id),version INTEGER NOT NULL,snapshot_json TEXT NOT NULL,
  PRIMARY KEY(schedule_id,version));
 CREATE TABLE IF NOT EXISTS os_ai_schedule_runs (
  schedule_id TEXT NOT NULL REFERENCES os_ai_schedules(id),due_at TEXT NOT NULL,job_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,reason TEXT,created_at TEXT NOT NULL,finished_at TEXT,
  PRIMARY KEY(schedule_id,due_at));
 CREATE TRIGGER IF NOT EXISTS os_ai_schedule_versions_no_update BEFORE UPDATE ON os_ai_schedule_versions BEGIN SELECT RAISE(ABORT,'Storico pianificazioni immutabile'); END;
 CREATE TRIGGER IF NOT EXISTS os_ai_schedule_versions_no_delete BEFORE DELETE ON os_ai_schedule_versions BEGIN SELECT RAISE(ABORT,'Storico pianificazioni immutabile'); END;
 CREATE TRIGGER IF NOT EXISTS os_ai_schedule_runs_final BEFORE UPDATE ON os_ai_schedule_runs WHEN OLD.status<>'running' BEGIN SELECT RAISE(ABORT,'Occorrenza conclusa immutabile'); END;
 CREATE TRIGGER IF NOT EXISTS os_ai_schedule_runs_no_delete BEFORE DELETE ON os_ai_schedule_runs BEGIN SELECT RAISE(ABORT,'Storico occorrenze immutabile'); END;`);
 const instant=()=>clock().toISOString();let active=null;
 const rowFor=(clientId,agent)=>s.one('SELECT * FROM os_ai_schedules WHERE client_id=? AND agent=?',clientId,agent);
 function actor(user,clientId){requireOwner(user);const current=s.one("SELECT * FROM os_users WHERE id=? AND role='owner' AND active=1 AND must_change_password=0 AND id<>'os-orchestrator'",user.id);if(!current)throw new AppError('Socio non più autorizzato.',403);if(user.session_id&&!s.one('SELECT 1 FROM os_sessions WHERE id=? AND user_id=? AND expires_at>?',user.session_id,user.id,clock().getTime()))throw new AppError('Sessione scaduta.',401);requireClient(s,current,clientId);return current;}
 function snapshot(row){s.run('INSERT INTO os_ai_schedule_versions VALUES(?,?,?)',row.id,row.version,JSON.stringify(row));}
 function suspend(row,reason){return s.transaction(()=>{const changed=s.run('UPDATE os_ai_schedules SET enabled=0,version=version+1,reason=?,updated_at=? WHERE id=? AND version=? AND enabled=1',reason,instant(),row.id,row.version).changes;if(changed){const updated=s.one('SELECT * FROM os_ai_schedules WHERE id=?',row.id);snapshot(updated);s.audit({id:row.authorized_by},row.client_id,'Pianificazione AI sospesa',row.id,{agent:row.agent,reason},'admin');}return changed;});}
 // A claimed run is never replayed after a restart, even if no work row was
 // written yet. Its cost, if any, remains subject to reconciliation.
 s.transaction(()=>{for(const row of s.query("SELECT DISTINCT p.* FROM os_ai_schedules p JOIN os_ai_schedule_runs r ON r.schedule_id=p.id WHERE r.status='running'"))suspend(row,'Lavoro interrotto: verifica storico e costi prima di riprendere.');s.run("UPDATE os_ai_schedule_runs SET status='interrupted',reason='Riavvio: nessun nuovo tentativo automatico.',finished_at=? WHERE status='running'",instant());});
 function state(user,clientId,agent){actor(user,clientId);const row=rowFor(clientId,agent);return {supported:agent==='social',available:enabled(),entry:row?{id:row.id,brief:row.brief,cadence:row.cadence,nextAt:row.next_at,expiresAt:row.expires_at,enabled:!!row.enabled,version:row.version,reason:row.reason,updatedAt:row.updated_at}:null,history:row?s.query('SELECT due_at dueAt,job_id jobId,status,reason,finished_at finishedAt FROM os_ai_schedule_runs WHERE schedule_id=? ORDER BY due_at DESC LIMIT 20',row.id):[]};}
 function preview(user,clientId,agent,b){actor(user,clientId);if(agent!=='social')throw new AppError('Questo agente mantiene l’avvio manuale.',409);if(!enabled())throw new AppError('Pianificazioni AI spente sul server.',409);
  if(typeof b.brief!=='string'||b.brief.length>1800)throw new AppError('Descrivi l’incarico ricorrente in massimo 1800 caratteri.');
  const packet=work.preview(user,clientId,agent,b.brief);if(!cadences.includes(packet.configuration.cadence))throw new AppError('Scegli Quando lavora nella configurazione, poi completa prova e autorizzazione dell’agente.',409);
  const current=rowFor(clientId,agent),now=clock(),validUntil=new Date(now.getTime()+10*60*1000).toISOString(),expiresAt=new Date(now.getTime()+duration).toISOString();
  const plan={clientId,agent,version:current?.version||0,packet,cadence:packet.configuration.cadence,nextAt:nextRun(packet.configuration.cadence,now),expiresAt,validUntil};
  if(plan.nextAt>=expiresAt)throw new AppError('La prossima scadenza supera i 30 giorni di consenso. Conferma la pianificazione più vicino alla data.',409);
  return {...plan,planHash:hash(plan)};
 }
 function save(user,clientId,agent,b){actor(user,clientId);const current=rowFor(clientId,agent);
  if(b.version!==(current?.version||0))throw new AppError('Pianificazione cambiata. Ricarica.',409);
  if(b.enabled===false){if(!current)throw new AppError('Pianificazione non trovata.',404);suspend(current,'Sospesa dal socio.');return state(user,clientId,agent);}
  if(b.enabled!==true||b.confirmed!==true||!b.plan)throw new AppError('Conferma incarico, fonti, frequenza e costo della pianificazione.');
  const p=b.plan,packet=work.preview(user,clientId,agent,p.packet?.context?.brief),now=clock().getTime();
  if(packet.context.brief.length>1800||agent!=='social'||!enabled()||!cadences.includes(packet.configuration.cadence)||p.agent!==agent||p.clientId!==clientId||p.version!==b.version||p.packet?.fingerprint!==packet.fingerprint||p.cadence!==packet.configuration.cadence
   ||!Number.isFinite(Date.parse(p.validUntil))||Date.parse(p.validUntil)<=now||Date.parse(p.validUntil)>now+10*60*1000
   ||Date.parse(p.expiresAt)!==Date.parse(p.validUntil)-10*60*1000+duration||Date.parse(p.nextAt)>=Date.parse(p.expiresAt)||Date.parse(p.nextAt)<=now||p.nextAt!==nextRun(p.cadence,new Date(Date.parse(p.validUntil)-10*60*1000)))throw new AppError('Anteprima cambiata o scaduta. Rileggi la pianificazione.',409);
  const {planHash,...unsigned}=p;if(planHash!==hash(unsigned)||hash({...unsigned,packet})!==planHash)throw new AppError('Pacchetto della pianificazione non valido.',409);
  const id=current?.id||randomUUID(),at=instant();
  s.transaction(()=>{s.run(`INSERT INTO os_ai_schedules VALUES(?,?,?,?,?,?,?,?,?,?,1,1,NULL,?,?) ON CONFLICT(client_id,agent) DO UPDATE SET authorized_by=excluded.authorized_by,brief=excluded.brief,packet_json=excluded.packet_json,fingerprint=excluded.fingerprint,cadence=excluded.cadence,expires_at=excluded.expires_at,next_at=excluded.next_at,enabled=1,version=os_ai_schedules.version+1,reason=NULL,updated_at=excluded.updated_at`,id,clientId,agent,user.id,packet.context.brief,JSON.stringify(packet),packet.fingerprint,p.cadence,p.expiresAt,p.nextAt,at,at);snapshot(rowFor(clientId,agent));s.audit(user,clientId,'Pianificazione AI autorizzata',id,{agent,cadence:p.cadence,expiresAt:p.expiresAt,estimatedCents:packet.estimatedCents},'admin');});
  return state(user,clientId,agent);
 }
 function check(row){
  const current=s.one('SELECT * FROM os_ai_schedules WHERE id=?',row.id);
  if(!enabled()||!current?.enabled||current.version!==row.version||Date.parse(current.expires_at)<=clock().getTime())throw new AppError('Pianificazione revocata, scaduta o disabilitata.',409);
  const user=actor({id:row.authorized_by,role:'owner'},row.client_id),packet=work.preview(user,row.client_id,row.agent,row.brief);
  if(packet.fingerprint!==row.fingerprint)throw new AppError('Fonti o autorizzazioni cambiate. Serve un nuovo consenso.',409);return user;
 }
 async function execute(){
  const rows=s.query('SELECT * FROM os_ai_schedules WHERE enabled=1 ORDER BY next_at');
  // Revalidate even before the next occurrence, so a revoked global switch,
  // expired consent or changed configuration cannot silently resume later.
  for(const row of rows){try{check(row);}catch(error){suspend(row,error instanceof AppError?error.message:'Pianificazione da verificare.');}}
  const row=s.one('SELECT * FROM os_ai_schedules WHERE enabled=1 AND next_at<=? ORDER BY next_at LIMIT 1',instant());if(!row)return {processed:0};
  const user=check(row),jobId=randomUUID(),due=row.next_at,brief=row.brief+'\n\nData dell’incarico pianificato: '+new Intl.DateTimeFormat('it-IT',{timeZone:'Europe/Rome',dateStyle:'full'}).format(new Date(due));
  const claimed=s.transaction(()=>{const ok=s.run('UPDATE os_ai_schedules SET next_at=?,updated_at=? WHERE id=? AND version=? AND enabled=1 AND next_at=?',nextRun(row.cadence,clock()),instant(),row.id,row.version,due).changes;if(!ok)return false;s.run("INSERT INTO os_ai_schedule_runs VALUES(?,?,?,'running',NULL,?,NULL)",row.id,due,jobId,instant());return true;});if(!claimed)return {processed:0};
  let status='failed',reason=null;
  try{const packet=work.preview(user,row.client_id,row.agent,brief);const result=await work.run(user,row.client_id,row.agent,{brief,fingerprint:packet.fingerprint,requestId:jobId,confirmed:true},{guard:()=>check(row)});status=result.status==='done'&&!result.result?.prerequisite?'done':'failed';reason=status==='done'?null:result.error||'Rilievi bloccanti: verifica il risultato prima di riprendere.';}
  catch(error){reason=error instanceof AppError?error.message:'Lavoro non riuscito. Verifica storico e costi.';}
  s.transaction(()=>{s.run("UPDATE os_ai_schedule_runs SET status=?,reason=?,finished_at=? WHERE schedule_id=? AND due_at=? AND status='running'",status,reason,instant(),row.id,due);if(status!=='done')suspend(row,reason);});return {processed:1,jobId,status};
 }
 function tick(){if(active)return active;active=execute().finally(()=>{active=null;});return active;}
 return {state,preview,save,tick,close:()=>active||Promise.resolve()};
}
