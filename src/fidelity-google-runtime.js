import {randomUUID} from 'node:crypto';
import {AppError,requireOwner,requireClient} from './store.js';
import {googleWalletConfig,createGoogleWalletProvider} from './fidelity-google.js';
import {googlePassIds} from './fidelity-wallet.js';

export function createGoogleWalletRuntime({store:s,env,origin,values,clock=()=>new Date(),providerOptions={}}){
 const busy=new Set(),time=()=>clock().toISOString();
 s.db.exec(`CREATE TABLE IF NOT EXISTS fi_google_config(tenant_id TEXT PRIMARY KEY REFERENCES os_clients(id),version INTEGER NOT NULL DEFAULT 0,fingerprint TEXT,checked_at TEXT,test_member_id TEXT,enabled_by TEXT,enabled_at TEXT);
 CREATE TABLE IF NOT EXISTS fi_google_objects(member_id TEXT PRIMARY KEY REFERENCES fi_members(id),tenant_id TEXT NOT NULL REFERENCES os_clients(id),object_id TEXT NOT NULL UNIQUE,class_id TEXT NOT NULL,kind TEXT NOT NULL,fingerprint TEXT NOT NULL,desired_seq INTEGER NOT NULL,synced_seq INTEGER,status TEXT NOT NULL,error TEXT,updated_at TEXT NOT NULL);`);
 s.run("UPDATE fi_jobs SET status='queued',error='Ripresa aggiornamento dopo il riavvio',available_at=? WHERE status='running' AND type IN ('wallet_update','wallet_revoke') AND member_id IN(SELECT member_id FROM fi_google_objects)",time());
 const readSettings=t=>s.one('SELECT * FROM fi_google_config WHERE tenant_id=?',t)||{version:0,fingerprint:null,checked_at:null,enabled_by:null};
 const settings=t=>{s.run('INSERT OR IGNORE INTO fi_google_config(tenant_id) VALUES(?)',t);return readSettings(t);};
 const enabledServer=()=>env.BIGANT_GOOGLE_WALLET_ENABLED==='true';
 function owner(user,t){requireOwner(user);const live=s.one("SELECT * FROM os_users WHERE id=? AND role='owner' AND active=1",user.id);if(!live)throw new AppError('Socio non più autorizzato.',403);requireClient(s,live,t);return live;}
 function configuration(){return googleWalletConfig(env,origin);}
 function snapshot(t){
  const row=readSettings(t);let c;try{c=configuration();}catch{}
  const checked=!!c&&row.fingerprint===c.fingerprint&&!!row.checked_at,by=!!row.enabled_by&&!!s.one("SELECT id FROM os_users WHERE id=? AND role='owner' AND active=1",row.enabled_by);
  const enabled=enabledServer()&&checked&&by;
  return {configured:!!c,available:enabledServer(),checked,enabled,version:row.version,lastCheck:row.checked_at,status:enabled?'enabled':checked?'checked':'disconnected',missing:c?[]:['Issuer e account di servizio da predisporre nelle variabili protette del server.'],note:!enabledServer()?'Google Wallet è disabilitato sul server.':!c?'Configurazione protetta da completare.':enabled?'Emissione e aggiornamento delle tessere abilitati. Le campagne restano disabilitate.':'Collauda una carta e verifica saldo e aggiornamento su Android prima di attivare.'};
 }
 function state(t){settings(t);return snapshot(t);}
 function progress(){
  const base=snapshot(null),states=s.query("SELECT id FROM os_clients WHERE active=1 AND EXISTS(SELECT 1 FROM json_each(services_json) WHERE value='fidelity')").map(row=>snapshot(row.id));
  const checked=states.filter(row=>row.checked),dates=checked.map(row=>row.lastCheck).filter(value=>Number.isFinite(Date.parse(value))).sort((a,b)=>Date.parse(b)-Date.parse(a));
  return {available:base.available,configured:base.configured,checkedCount:checked.length,enabledCount:states.filter(row=>row.enabled).length,lastCheck:dates[0]||null};
 }
 function permitted(t,{probe=false,user,version,fingerprint,revoke=false}={}){
  if(!enabledServer())throw new AppError('Google Wallet non abilitato sul server.',409);
  const c=configuration(),row=settings(t);
  if(version!==undefined&&row.version!==version||fingerprint&&c.fingerprint!==fingerprint)throw new AppError('Configurazione Wallet cambiata. Ripeti il collaudo.',409);
  if(probe)owner(user,t);else if(!state(t).enabled)throw new AppError('Google Wallet sospeso o da collaudare.',409);
  const tenant=s.one('SELECT active,services_json FROM os_clients WHERE id=?',t);
  if(!tenant||!revoke&&(!tenant.active||!JSON.parse(tenant.services_json).includes('fidelity')))throw new AppError('Servizio Fidelity non attivo per questa attività.',409);
  return {c,row};
 }
 function enqueue(t,id,jobId,type='wallet_update',hold=false){
  if(!['wallet_update','wallet_revoke'].includes(type))return;
  const m=s.one('SELECT * FROM fi_members WHERE id=? AND tenant_id=?',id,t),object=s.one('SELECT member_id FROM fi_google_objects WHERE member_id=? AND tenant_id=?',id,t);
  if(!m||!object&&!m.google_issued)return;
  const value=values(m);if(value.member.voided||value.program.expiresAt&&Date.parse(value.program.expiresAt)<=clock().getTime())type='wallet_revoke';
  let ready=false;try{permitted(t,{revoke:type==='wallet_revoke'});ready=true;}catch{}
  if(hold)ready=false;
  const payload=JSON.stringify({sequence:m.update_seq,channel:'google'});
  if(jobId)s.run('UPDATE fi_jobs SET type=?,status=?,payload_json=?,error=? WHERE id=? AND tenant_id=?',type,ready?'queued':'blocked',payload,ready?null:'Google Wallet sospeso o da collaudare.',jobId,t);
  else if(!s.one("SELECT id FROM fi_jobs WHERE member_id=? AND type=? AND status IN ('queued','running')",id,type))s.run('INSERT INTO fi_jobs(id,tenant_id,member_id,type,payload_json,status,error,available_at,created_at) VALUES(?,?,?,?,?,?,?,?,?)',randomUUID(),t,id,type,payload,ready?'queued':'blocked',ready?null:'Google Wallet sospeso o da collaudare.',time(),time());
 }
 async function synchronize(t,id,{probe=false,user}={}){
  if(busy.has(id))throw Object.assign(new AppError('Aggiornamento della tessera già in corso.',409),{retryable:true});
  const m=s.one('SELECT * FROM fi_members WHERE id=? AND tenant_id=?',id,t);if(!m)throw new AppError('Tessera non trovata.',404);
  const program=s.one('SELECT simulation FROM fi_programs WHERE id=? AND tenant_id=?',m.program_id,t);if(!program||program.simulation)throw new AppError('Le tessere DEMO non possono essere emesse su Google Wallet.',409);
  const input=values(m),revoke=input.member.voided||!!input.program.expiresAt&&Date.parse(input.program.expiresAt)<=clock().getTime();
  const {c,row}=permitted(t,{probe,user,revoke});
  if(probe&&revoke)throw new AppError('Usa una tessera attiva per il collaudo.',409);
  const ids=googlePassIds(c.issuer,input.member,input.program),kind=input.program.type==='coupon'?'offer':'loyalty',previous=s.one('SELECT * FROM fi_google_objects WHERE member_id=?',id);
  if(previous&&previous.object_id!==ids.objectId)throw new AppError('Issuer cambiato: occorre migrare le tessere esistenti prima di procedere.',409);
  if(revoke&&!previous)return {revoked:true};
  s.run("INSERT INTO fi_google_objects(member_id,tenant_id,object_id,class_id,kind,fingerprint,desired_seq,status,updated_at) VALUES(?,?,?,?,?,?,?,'pending',?) ON CONFLICT(member_id) DO UPDATE SET fingerprint=excluded.fingerprint,desired_seq=excluded.desired_seq,status='pending',error=NULL,updated_at=excluded.updated_at",id,t,ids.objectId,ids.classId,kind,c.fingerprint,m.update_seq,time());
  busy.add(id);
  const allow=operation=>{
   permitted(t,{probe,user,version:row.version,fingerprint:c.fingerprint,revoke});
   const live=s.one('SELECT * FROM fi_members WHERE id=? AND tenant_id=?',id,t);
   if(!live||JSON.stringify(values(live))!==JSON.stringify(input)||live.update_seq!==m.update_seq)throw Object.assign(new AppError('Tessera aggiornata durante la richiesta. È necessario sincronizzare il nuovo saldo.',409),{retryable:true});
   if(operation!== (revoke?'revoke':probe?'probe':'issue'))throw new AppError('Operazione Wallet non autorizzata.',409);
   return true;
  };
  try{
   const provider=createGoogleWalletProvider({...providerOptions,config:c,allow,clock});
   let result;
   if(revoke){await provider.revoke(ids.objectId,kind);result={revoked:true};}else result=await provider.issue(input.member,input.program,{operation:probe?'probe':'issue'});
   allow(revoke?'revoke':probe?'probe':'issue');
   s.transaction(()=>{
    s.run('UPDATE fi_google_objects SET synced_seq=?,status=?,error=NULL,updated_at=? WHERE member_id=?',m.update_seq,revoke?'revoked':'ready',time(),id);
    s.run('UPDATE fi_members SET google_issued=? WHERE id=?',revoke?0:1,id);
    s.run("UPDATE fi_jobs SET status='done',error=NULL WHERE member_id=? AND type IN ('wallet_update','wallet_revoke') AND status IN ('queued','blocked') AND CAST(json_extract(payload_json,'$.sequence') AS INTEGER)<=?",id,m.update_seq);
    s.audit(user||{id:'wallet-worker',role:'agent'},t,revoke?'fidelity.google.revoked':'fidelity.google.updated',id,{sequence:m.update_seq},'client');
   });
   return result;
  }catch(error){
   const message=error instanceof AppError?error.message:'Esito Google Wallet da verificare.';
   s.run("UPDATE fi_google_objects SET status='uncertain',error=?,updated_at=? WHERE member_id=?",message,time(),id);
   if([401,403].includes(error.providerStatus))s.run('UPDATE fi_google_config SET version=version+1,fingerprint=NULL,checked_at=NULL,enabled_by=NULL,enabled_at=NULL WHERE tenant_id=?',t);
   const latest=s.one('SELECT status FROM fi_members WHERE id=?',id);enqueue(t,id,null,latest?.status==='deleted'?'wallet_revoke':'wallet_update',!error.retryable);throw error;
  }finally{busy.delete(id);}
 }
 async function check(user,t,b){
  owner(user,t);if(b.acknowledged!==true)throw new AppError('Conferma l’invio dei dati della tessera di prova a Google.');const row=settings(t);if(b.version!==row.version)throw new AppError('Configurazione Wallet cambiata. Ricarica.',409);
  const {c}=permitted(t,{probe:true,user});if(typeof b.memberId!=='string')throw new AppError('Scegli una tessera di prova.');
  const version=row.version+1;s.run('UPDATE fi_google_config SET version=?,fingerprint=NULL,checked_at=NULL,test_member_id=NULL,enabled_by=NULL,enabled_at=NULL WHERE tenant_id=?',version,t);
  const result=await synchronize(t,b.memberId,{probe:true,user});permitted(t,{probe:true,user,version,fingerprint:c.fingerprint});
  s.run('UPDATE fi_google_config SET fingerprint=?,checked_at=?,test_member_id=? WHERE tenant_id=?',c.fingerprint,time(),b.memberId,t);
  s.audit(user,t,'fidelity.google.probe',b.memberId,{version},'admin');return {wallet:state(t),url:result.url};
 }
 function activate(user,t,b){
  owner(user,t);const row=settings(t);if(row.version!==b.version||typeof b.enabled!=='boolean')throw new AppError('Configurazione Wallet cambiata o richiesta non valida.',409);
  if(b.enabled){permitted(t,{probe:true,user});if(!state(t).checked||b.deviceVerified!==true)throw new AppError('Completa il collaudo e conferma la prova su Android.',409);}
  s.run('UPDATE fi_google_config SET version=version+1,enabled_by=?,enabled_at=? WHERE tenant_id=?',b.enabled?user.id:null,b.enabled?time():null,t);
  s.audit(user,t,b.enabled?'fidelity.google.enabled':'fidelity.google.paused',t,{deviceVerified:b.enabled},'admin');
  if(b.enabled)for(const m of s.query('SELECT member_id FROM fi_google_objects WHERE tenant_id=?',t))enqueue(t,m.member_id);
  return state(t);
 }
 async function issue(publicMember){permitted(publicMember.tenant_id);return synchronize(publicMember.tenant_id,publicMember.id);}
 async function runJobs(t=null){
  if(!enabledServer())return {processed:0};let processed=0;
  for(const row of s.query("SELECT tenant_id,member_id FROM fi_google_objects WHERE status='pending' AND (? IS NULL OR tenant_id=?)",t,t))enqueue(row.tenant_id,row.member_id);
  for(const row of s.query("SELECT o.tenant_id,o.member_id FROM fi_google_objects o JOIN fi_members m ON m.id=o.member_id JOIN fi_programs p ON p.id=m.program_id JOIN os_clients c ON c.id=m.tenant_id WHERE o.status<>'revoked' AND (m.status='deleted' OR p.active=0 OR (p.expires_at IS NOT NULL AND p.expires_at<=?) OR c.active=0 OR NOT EXISTS(SELECT 1 FROM json_each(c.services_json) WHERE value='fidelity')) AND (? IS NULL OR o.tenant_id=?)",time(),t,t))enqueue(row.tenant_id,row.member_id,null,'wallet_revoke');
  // One pending operation per member: a newer balance must not bypass an older retry's delay.
  const rows=s.query("SELECT j.* FROM fi_jobs j WHERE j.status='queued' AND EXISTS(SELECT 1 FROM fi_google_objects o WHERE o.member_id=j.member_id AND o.tenant_id=j.tenant_id) AND j.type IN ('wallet_update','wallet_revoke') AND j.available_at<=? AND (? IS NULL OR j.tenant_id=?) AND NOT EXISTS(SELECT 1 FROM fi_jobs older WHERE older.member_id=j.member_id AND older.status='queued' AND older.type IN ('wallet_update','wallet_revoke') AND older.rowid<j.rowid) ORDER BY j.rowid LIMIT 5",time(),t,t);
  for(const job of rows){if(busy.has(job.member_id))continue;if(!s.run("UPDATE fi_jobs SET status='running',attempts=attempts+1 WHERE id=? AND status='queued'",job.id).changes)continue;
   try{await synchronize(job.tenant_id,job.member_id);s.run("UPDATE fi_jobs SET status='done',error=NULL WHERE id=?",job.id);}
   catch(error){const retry=error.retryable&&job.attempts<7,status=retry?'queued':error.status===409?'blocked':'failed';s.run('UPDATE fi_jobs SET status=?,error=?,available_at=? WHERE id=?',status,error instanceof AppError?error.message:'Aggiornamento Google Wallet da verificare.',new Date(clock().getTime()+Math.min(300000,5000*2**job.attempts)).toISOString(),job.id);if(!retry)s.run("UPDATE fi_jobs SET status='blocked',error='Aggiornamento da verificare prima di riprovare.' WHERE member_id=? AND type IN ('wallet_update','wallet_revoke') AND status='queued'",job.member_id);}
   processed++;
  }
  return {processed};
 }
 function retry(user,t,id){owner(user,t);if(typeof id!=='string'||!id)throw new AppError('Scegli un aggiornamento da riprovare.');permitted(t,{revoke:true});const job=s.one("SELECT * FROM fi_jobs WHERE id=? AND tenant_id=? AND EXISTS(SELECT 1 FROM fi_google_objects o WHERE o.member_id=fi_jobs.member_id AND o.tenant_id=fi_jobs.tenant_id) AND type IN ('wallet_update','wallet_revoke') AND status IN ('blocked','failed')",id,t);if(!job)throw new AppError('Aggiornamento non disponibile.',404);s.run("UPDATE fi_jobs SET status='queued',attempts=0,error=NULL,available_at=? WHERE id=?",time(),id);s.audit(user,t,'fidelity.google.retry',id,{},'admin');return {ok:true};}
 return {state,progress,check,activate,issue,enqueue,runJobs,retry};
}
