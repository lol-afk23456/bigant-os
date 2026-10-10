import {createHash} from 'node:crypto';
import {AppError,requireOwner,requireClient} from './store.js';
import {createAgentProvider} from './sciame/ai-provider.js';
import {schemi,valida} from './sciame/schemi.js';
import {controlliAutomatici} from './sciame/qualita.js';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;

// Manual internal drafts only. The legacy DEMO queue must never execute these jobs.
export function createAgentWork({store:s,connections,trials,configFor,orchestrator,production,enabled=()=>false,clock=()=>new Date(),providerOptions={}}){
 s.db.exec(`CREATE TABLE IF NOT EXISTS os_agent_authorizations(id INTEGER PRIMARY KEY AUTOINCREMENT,agent TEXT NOT NULL,config_version INTEGER NOT NULL,connection_version INTEGER NOT NULL,trial_id TEXT NOT NULL,enabled INTEGER NOT NULL,authorized_by TEXT NOT NULL REFERENCES os_users(id),created_at TEXT NOT NULL);
 CREATE TRIGGER IF NOT EXISTS os_agent_authorizations_no_update BEFORE UPDATE ON os_agent_authorizations BEGIN SELECT RAISE(ABORT,'Autorizzazione immutabile'); END;
 CREATE TRIGGER IF NOT EXISTS os_agent_authorizations_no_delete BEFORE DELETE ON os_agent_authorizations BEGIN SELECT RAISE(ABORT,'Autorizzazione immutabile'); END;
 CREATE TABLE IF NOT EXISTS os_agent_work(job_id TEXT PRIMARY KEY REFERENCES os_jobs(id),requested_by TEXT NOT NULL REFERENCES os_users(id),fingerprint TEXT NOT NULL,packet_json TEXT NOT NULL,cost_id TEXT,raw_output TEXT,quality_json TEXT);
 CREATE TRIGGER IF NOT EXISTS os_agent_work_packet_immutable BEFORE UPDATE ON os_agent_work WHEN NEW.packet_json<>OLD.packet_json OR NEW.fingerprint<>OLD.fingerprint OR NEW.requested_by<>OLD.requested_by BEGIN SELECT RAISE(ABORT,'Pacchetto autorizzato immutabile'); END;
 CREATE TRIGGER IF NOT EXISTS os_agent_work_final BEFORE UPDATE ON os_agent_work WHEN (SELECT status FROM os_jobs WHERE id=OLD.job_id)<>'running' BEGIN SELECT RAISE(ABORT,'Elaborazione conclusa immutabile'); END;
 CREATE TRIGGER IF NOT EXISTS os_agent_work_no_delete BEFORE DELETE ON os_agent_work BEGIN SELECT RAISE(ABORT,'Registro elaborazioni immutabile'); END;
 CREATE INDEX IF NOT EXISTS os_agent_authorizations_agent ON os_agent_authorizations(agent,id DESC);`);
 s.run("UPDATE os_jobs SET status='failed',error='Elaborazione interrotta: verifica il costo prenotato prima di un nuovo incarico.',finished_at=? WHERE status='running' AND id IN(SELECT job_id FROM os_agent_work)",clock().toISOString());
 const provider=createAgentProvider(providerOptions),active=new Map(),instant=()=>clock().toISOString();
 const freshOwner=id=>s.one("SELECT * FROM os_users WHERE id=? AND role='owner' AND active=1 AND must_change_password=0 AND id<>'os-orchestrator'",id);
 function actor(user){requireOwner(user);if(!freshOwner(user.id))throw new AppError('Socio non più autorizzato.',403);if(user.session_id&&!s.one('SELECT 1 FROM os_sessions WHERE id=? AND user_id=? AND expires_at>?',user.session_id,user.id,clock().getTime()))throw new AppError('Sessione scaduta.',401);}
 function state(id,c){const trial=trials.stateForAgent(id,c),a=s.one('SELECT * FROM os_agent_authorizations WHERE agent=? ORDER BY id DESC LIMIT 1',id),supported=id==='social',ready=supported&&enabled()&&trial.passed;
  const valid=!!a&&a.config_version===c.version&&a.connection_version===trial.connectionVersion&&a.trial_id===trial.latest?.id&&!!freshOwner(a.authorized_by);
  return {supported,available:enabled(),ready,active:!!(ready&&valid&&a.enabled),authorizationVersion:a?.id||0,trialId:trial.latest?.id||null,connectionVersion:trial.connectionVersion,provider:c.provider==='api'?'anthropic':c.provider,automatic:false,note:supported?'Solo bozze social manuali; approvazione umana prima di qualsiasi uscita.':'Percorso operativo ancora da predisporre.'};
 }
 function authorize(user,id,b){actor(user);const c=configFor(id),current=state(id,c);
  if(typeof b.enabled!=='boolean')throw new AppError('Indica se autorizzare o sospendere l’agente.');
  if(b.authorizationVersion!==current.authorizationVersion)throw new AppError('Autorizzazione cambiata. Ricarica.',409);
  if(b.enabled!==false){if(!current.ready||b.confirmed!==true||b.version!==c.version||b.connectionVersion!==current.connectionVersion||b.trialId!==current.trialId)throw new AppError('Serve una prova corrente e la conferma sulla stessa configurazione e collegamento.',409);}
  else if(!current.supported)throw new AppError('Percorso operativo non disponibile.',409);
  s.transaction(()=>{s.run('INSERT INTO os_agent_authorizations(agent,config_version,connection_version,trial_id,enabled,authorized_by,created_at) VALUES(?,?,?,?,?,?,?)',id,c.version,current.connectionVersion,current.trialId||'',b.enabled===false?0:1,user.id,instant());s.audit(user,null,b.enabled===false?'Agente operativo sospeso':'Agente autorizzato per bozze manuali',id,{version:c.version,trialId:current.trialId},'admin');});
  return state(id,c);
 }
 function packet(user,clientId,id,brief){actor(user);requireClient(s,user,clientId);const c=configFor(id),operational=state(id,c);
  if(!operational.active)throw new AppError('Agente non attivo per questo percorso operativo.',409);
  if(s.getSetting('paused')==='true')throw new AppError('Regia in pausa.',409);
  const client=s.one('SELECT id,name,services_json FROM os_clients WHERE id=? AND active=1',clientId);
  if(!client||!JSON.parse(client.services_json).includes('social'))throw new AppError('Servizio social non attivo per questa attività.',403);
  if(typeof brief!=='string'||!brief.trim()||brief.length>2000)throw new AppError('Descrivi l’incarico in massimo 2000 caratteri.');
  if(!Number.isSafeInteger(c.estimated_cents)||c.estimated_cents<1||c.estimated_cents>5000)throw new AppError('Stima di costo non valida.',409);
  const memory=s.query("SELECT kind,content,version,source FROM os_memory WHERE client_id=? AND visibility IN('internal','client') AND kind IN('master','dna','strategy','feedback','agent-feedback:social') ORDER BY kind",clientId);
  if(!memory.some(row=>['master','dna'].includes(row.kind)&&row.content.trim())||memory.some(row=>!row.source.trim()))throw new AppError('Completa brief o DNA e la fonte di ogni informazione prima di inviarli.',409);
  const context={client:{id:client.id,name:client.name},service:'social',brief:brief.trim(),memory};
  const data={agent:id,configuration:c,provider:operational.provider,connectionVersion:operational.connectionVersion,authorizationVersion:operational.authorizationVersion,trialId:operational.trialId,context};
  if(Buffer.byteLength(JSON.stringify(data))>100000)throw new AppError('Pacchetto troppo grande: sintetizza le informazioni prima del consenso.',409);
  return {...data,fingerprint:hash(data),estimatedCents:c.estimated_cents};
 }
 function result(user,clientId,id){actor(user);requireClient(s,user,clientId);const row=s.one('SELECT j.*,w.raw_output,w.quality_json,w.cost_id FROM os_jobs j JOIN os_agent_work w ON w.job_id=j.id WHERE j.id=? AND j.client_id=?',id,clientId);if(!row)throw new AppError('Elaborazione non trovata per questa attività.',404);const cost=row.cost_id?s.one('SELECT cents,status FROM os_costs WHERE id=?',row.cost_id):null;
  return {id:row.id,agent:row.agent,clientId,status:row.status,error:row.error,result:row.result?JSON.parse(row.result):null,rawOutput:row.raw_output?JSON.parse(row.raw_output):null,quality:row.quality_json?JSON.parse(row.quality_json):[],costCents:cost?.cents??null,costStatus:cost?.status??null,createdAt:row.created_at,finishedAt:row.finished_at};
 }
 async function run(user,clientId,id,b){actor(user);requireClient(s,user,clientId);
  if(!uuid.test(b.requestId||'')||b.confirmed!==true||typeof b.fingerprint!=='string')throw new AppError('Conferma i dati e il costo della singola elaborazione.');
  const previous=s.one('SELECT j.client_id,j.agent,j.status,w.requested_by,w.fingerprint FROM os_agent_work w JOIN os_jobs j ON j.id=w.job_id WHERE j.id=?',b.requestId);
  if(previous){if(previous.client_id!==clientId||previous.agent!==id||previous.requested_by!==user.id||previous.fingerprint!==b.fingerprint)throw new AppError('Identificativo già utilizzato.',409);if(previous.status==='running')throw new AppError('Elaborazione già in corso.',409);return result(user,clientId,b.requestId);}
  const p=packet(user,clientId,id,b.brief);if(b.fingerprint!==p.fingerprint)throw new AppError('Dati o autorizzazioni cambiati. Leggi una nuova anteprima.',409);
  const key=id+':'+clientId;if(active.has(key))throw new AppError('Elaborazione già in corso per questa attività.',409);
  const guard=()=>{if(packet(user,clientId,id,b.brief).fingerprint!==p.fingerprint)throw new AppError('Dati o autorizzazioni cambiati durante il lavoro.',409);};
  const attempt=(async()=>{let costId,submitted=false;
   s.transaction(()=>{s.run("INSERT INTO os_jobs(id,client_id,agent,input,status,attempts,available_at,created_at) VALUES(?,?,?,?,'running',1,?,?)",b.requestId,clientId,id,JSON.stringify({requestedBy:user.id,mode:'AI',brief:b.brief}),instant(),instant());s.run('INSERT INTO os_agent_work VALUES(?,?,?,?,NULL,NULL,NULL)',b.requestId,user.id,p.fingerprint,JSON.stringify(p));});
   try{
    const credentials=connections.readForRuntime(user,p.provider,p.connectionVersion);
    costId=s.transaction(()=>{const cost=orchestrator.reserve(clientId,id,p.estimatedCents,{paid:true});s.run('UPDATE os_agent_work SET cost_id=? WHERE job_id=?',cost,b.requestId);return cost;});
    const output=await provider.run({provider:p.provider,credentials,instructions:p.configuration.instructions,task:p.configuration.task,sources:p.configuration.sources,quality:p.configuration.quality,schema:schemi.social,workContext:p.context,beforeDispatch:()=>{guard();orchestrator.assertPaidReservation(costId);submitted=true;}});
    guard();if(valida(schemi.social,output).length||!output.sintesi.trim()||output.post.length<1||output.post.length>10||output.post.some(post=>!post.titolo.trim()||post.titolo.length>180||!post.testo.trim()||post.testo.length>18000||[post.testo,post.cta].filter(Boolean).join('\n\n').length>20000))throw new AppError('Risposta social incompleta o fuori contratto.',502);
    const quality=controlliAutomatici('social',output,p.context),blocked=quality.some(row=>row.esito==='bloccante');
    s.transaction(()=>{
     s.run('UPDATE os_agent_work SET raw_output=?,quality_json=? WHERE job_id=?',JSON.stringify(output),JSON.stringify(quality),b.requestId);
     const sources=p.context.memory.map(row=>`Memoria ${row.kind} v${row.version} · ${row.source}`),links=[];
     if(!blocked)for(const [index,post] of output.post.entries()){
      const contentId='ai-content-'+b.requestId+'-'+index,body=[post.testo,post.cta].filter(Boolean).join('\n\n');
      s.run('INSERT INTO os_contents VALUES(?,?,?,?,?,?,?,?,?,?)',contentId,clientId,'social',post.titolo,body,'DA APPROVARE',null,1,`Agente social AI · ${b.requestId}; `+sources.join('; '),instant());
      const approval=production.requestApproval(user,s.one('SELECT * FROM os_contents WHERE id=?',contentId));production.tagApproval(approval.id,'Specialista social · AI','Controlli automatici eseguiti; revisione umana necessaria');links.push({contentId,approvalId:approval.id,title:post.titolo});
     }
     const saved={title:'Bozze social AI',body:output.sintesi,service:'social',sources,mode:'AI',revisionInModule:true,quality,prerequisite:blocked,links:{view:'work',...links[0],contents:links},sop:{path:'docs/SOP-AGENTE-SOCIAL.md',version:1},note:blocked?'Rilievi bloccanti: nessuna bozza in approvazione.':'Bozze da verificare; nessuna pubblicazione o pianificazione.'};
     const context={...p.context,asOf:instant(),input:{brief:p.context.brief,configurationVersion:p.configuration.version,connectionVersion:p.connectionVersion,authorizationVersion:p.authorizationVersion,fingerprint:p.fingerprint},tasks:[],contents:[]};
     const record=orchestrator.outputs.save({id:b.requestId,agent:id,client_id:clientId},saved,context,user);saved.outputId=record.outputId;
     s.run("UPDATE os_jobs SET status='done',result=?,finished_at=? WHERE id=?",JSON.stringify(saved),instant(),b.requestId);s.audit(user,clientId,'Bozze AI preparate',b.requestId,{agent:id,blocked,contents:links.length,costCents:p.estimatedCents},'internal');
    });
   }catch(error){s.run("UPDATE os_jobs SET status='failed',error=?,finished_at=? WHERE id=?",error instanceof AppError?error.message:'Elaborazione non riuscita. Verifica il registro e i costi prima di un nuovo incarico.',instant(),b.requestId);s.audit(user,clientId,'Elaborazione AI da verificare',b.requestId,{agent:id},'admin');}
   finally{if(costId)s.run('UPDATE os_costs SET status=? WHERE id=?',submitted?'charged':'released',costId);}
   return result(user,clientId,b.requestId);
  })();active.set(key,attempt);try{return await attempt;}finally{active.delete(key);}
 }
 return {state,authorize,preview:packet,run,result,close:()=>Promise.allSettled(active.values())};
}
