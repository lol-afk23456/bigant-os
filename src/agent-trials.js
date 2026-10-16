import {createHash} from 'node:crypto';
import {AppError,requireOwner} from './store.js';
import {perRegistro} from './sciame/agenti.js';
import {schemi,valida} from './sciame/schemi.js';
import {createTrialProvider} from './sciame/trial-provider.js';

export function createAgentTrials({store:s,connections,costControl,reserve,configFor,enabled=()=>false,clock=()=>new Date(),providerOptions={}}) {
  s.db.exec(`CREATE TABLE IF NOT EXISTS os_agent_trials (
    id TEXT PRIMARY KEY, agent TEXT NOT NULL, config_version INTEGER NOT NULL, connection_version INTEGER NOT NULL,
    provider TEXT NOT NULL, fingerprint TEXT NOT NULL, requested_by TEXT NOT NULL REFERENCES os_users(id),
    config_json TEXT NOT NULL, status TEXT NOT NULL, output_json TEXT, error TEXT, cost_id TEXT, created_at TEXT NOT NULL, finished_at TEXT
  );
  CREATE TRIGGER IF NOT EXISTS os_agent_trials_final BEFORE UPDATE ON os_agent_trials WHEN OLD.status<>'running' BEGIN SELECT RAISE(ABORT,'Prova conclusa immutabile'); END;
  CREATE TRIGGER IF NOT EXISTS os_agent_trials_no_delete BEFORE DELETE ON os_agent_trials BEGIN SELECT RAISE(ABORT,'Storico prove immutabile'); END;`);
  s.run("UPDATE os_agent_trials SET status='failed',error='Prova interrotta dal riavvio. Eventuali costi prenotati restano da verificare.',finished_at=? WHERE status='running'",clock().toISOString());
  const provider=createTrialProvider(providerOptions),active=new Map();
  const providerId=c=>c.provider==='api'?'anthropic':c.provider==='openai'?'openai':null;
  function actor(user){requireOwner(user);const fresh=s.one("SELECT * FROM os_users WHERE id=? AND role='owner' AND active=1 AND must_change_password=0 AND id<>'os-orchestrator'",user.id);if(!fresh)throw new AppError('Socio non più autorizzato.',403);if(user.session_id&&!s.one('SELECT 1 FROM os_sessions WHERE id=? AND user_id=? AND expires_at>?',user.session_id,user.id,clock().getTime()))throw new AppError('Sessione scaduta. Accedi di nuovo.',401);return fresh;}
  function stamp(id,c){const p=providerId(c),connection=p?connections.runtimeMetadata(p):null;return {provider:p,connectionVersion:connection?.version||0,configured:!!connection?.configured,fingerprint:createHash('sha256').update(JSON.stringify({agent:id,config:c,provider:p,connectionVersion:connection?.version||0,schema:schemi[perRegistro[id]],format:1})).digest('hex')};}
  function stateForAgent(id,c){const current=stamp(id,c),row=s.one('SELECT * FROM os_agent_trials WHERE agent=? ORDER BY created_at DESC,rowid DESC LIMIT 1',id),valid=!!row&&row.status==='passed'&&row.fingerprint===current.fingerprint&&!!s.one("SELECT 1 FROM os_users WHERE id=? AND role='owner' AND active=1 AND must_change_password=0",row.requested_by);
    return {available:enabled(),supported:!!schemi[perRegistro[id]],configured:current.configured,connectionVersion:current.connectionVersion,running:active.has(id),passed:valid,latest:row?{id:row.id,status:row.status,at:row.finished_at||row.created_at,current:valid,error:row.error}:null,note:'Prova tecnica su dati inventati. L’agente resta non attivo finché manca il collaudo del percorso reale.'};}
  function result(user,id){actor(user);const row=s.one('SELECT * FROM os_agent_trials WHERE id=?',id);if(!row)throw new AppError('Prova non trovata.',404);return {id:row.id,agent:row.agent,status:row.status,current:row.status==='passed'&&row.fingerprint===stamp(row.agent,configFor(row.agent)).fingerprint&&!!s.one("SELECT 1 FROM os_users WHERE id=? AND role='owner' AND active=1 AND must_change_password=0",row.requested_by),output:row.output_json?JSON.parse(row.output_json):null,error:row.error,configVersion:row.config_version,connectionVersion:row.connection_version,provider:row.provider,configuration:JSON.parse(row.config_json),createdAt:row.created_at,finishedAt:row.finished_at,costStatus:row.cost_id?s.one('SELECT status FROM os_costs WHERE id=?',row.cost_id)?.status:null,costCents:row.cost_id?s.one('SELECT cents FROM os_costs WHERE id=?',row.cost_id)?.cents:null,note:'COLLAUDO TECNICO · dati inventati; nessuna attivazione o pubblicazione.'};}
  function guard(user,id,expected){actor(user);if(!enabled())throw new AppError('Prove AI non abilitate sul server.',409);if(s.getSetting('paused')==='true')throw new AppError('Regia in pausa.',409);const c=configFor(id),current=stamp(id,c);if(current.fingerprint!==expected.fingerprint)throw new AppError('Configurazione o collegamento cambiati: ripeti la prova.',409);return c;}
  async function check(user,id,b){actor(user);const c=configFor(id),current=stamp(id,c),aiId=perRegistro[id];
    if(!schemi[aiId])throw new AppError('Questo agente richiede prima un contratto AI specifico.',409);
    if(!c.version||b.version!==c.version)throw new AppError('Salva la configurazione corrente prima della prova.',409);
    if(b.connectionVersion!==current.connectionVersion)throw new AppError('Collegamento cambiato: riapri la conferma della prova.',409);
    if(b.confirmed!==true||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(b.requestId||''))throw new AppError('Conferma la prova tecnica e il costo stimato.');
    if(!current.provider||!current.configured||![c.task,c.instructions,c.sources,c.quality].every(value=>typeof value==='string'&&value.trim()))throw new AppError('Completa istruzioni, fornitore e Collegamenti prima della prova.',409);
    if(!Number.isSafeInteger(c.estimated_cents)||c.estimated_cents<1||c.estimated_cents>5000)throw new AppError('Stima di costo non valida.',409);
    const previous=s.one('SELECT * FROM os_agent_trials WHERE id=?',b.requestId);
    if(previous){if(previous.agent!==id||previous.requested_by!==user.id||previous.fingerprint!==current.fingerprint)throw new AppError('Identificativo della prova già utilizzato.',409);if(previous.status==='running')throw new AppError('Prova già in corso.',409);return result(user,previous.id);}
    if(active.has(id))throw new AppError('Una prova di questo agente è già in corso.',409);
    guard(user,id,current);
    const attempt=(async()=>{
      let costId,submitted=false;
      s.run('INSERT INTO os_agent_trials VALUES(?,?,?,?,?,?,?,?,?,NULL,NULL,NULL,?,NULL)',b.requestId,id,c.version,current.connectionVersion,current.provider,current.fingerprint,user.id,JSON.stringify(c),'running',clock().toISOString());
      try{
        const credentials=connections.readForRuntime(user,current.provider,current.connectionVersion);
        if(!credentials.apiKey||!credentials.model)throw new AppError('Collegamento AI incompleto.',409);
        costId=s.transaction(()=>{const cost=reserve('demo-bigant','sciame:'+aiId,c.estimated_cents,{paid:true});s.run('UPDATE os_agent_trials SET cost_id=? WHERE id=?',cost,b.requestId);return cost;});
        const output=await provider.run({provider:current.provider,credentials,instructions:c.instructions,task:c.task,sources:c.sources,quality:c.quality,schema:schemi[aiId],beforeDispatch:()=>{guard(user,id,current);costControl.assertReserved(costId);submitted=true;}});
        guard(user,id,current);
        if(valida(schemi[aiId],output).length||typeof output.sintesi!=='string'||!output.sintesi.trim())throw new AppError('La risposta non rispetta il contratto dell’agente.',502);
        s.transaction(()=>{s.run("UPDATE os_agent_trials SET status='passed',output_json=?,finished_at=? WHERE id=?",JSON.stringify(output),clock().toISOString(),b.requestId);
        s.audit(user,null,'Prova tecnica agente completata',b.requestId,{agent:id,version:c.version,provider:current.provider},'admin');});
      }catch(error){const message=error instanceof AppError?error.message:'Prova tecnica non riuscita. Verifica configurazione e collegamento.';s.run("UPDATE os_agent_trials SET status='failed',error=?,finished_at=? WHERE id=?",message,clock().toISOString(),b.requestId);s.audit(user,null,'Prova tecnica agente non riuscita',b.requestId,{agent:id,version:c.version},'admin');}
      finally{if(costId)s.run('UPDATE os_costs SET status=? WHERE id=?',submitted?'charged':'released',costId);}
      return result(user,b.requestId);
    })();
    active.set(id,attempt);try{return await attempt;}finally{active.delete(id);}
  }
  function history(user,id){actor(user);configFor(id);return s.query('SELECT id FROM os_agent_trials WHERE agent=? ORDER BY created_at DESC,rowid DESC LIMIT 20',id).map(row=>result(user,row.id));}
  return {stateForAgent,result,history,check,close:()=>Promise.allSettled(active.values())};
}
