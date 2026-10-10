import {AsyncLocalStorage} from 'node:async_hooks';
import {randomUUID} from 'node:crypto';
import {AppError,requireOwner,now} from './store.js';
import {createGrowthLiveProviders} from './growth-live-providers.js';

const phases=['research','analysis','drafts'];
const jobPhase={research:'research',analyze:'analysis',draft:'drafts'};
const prerequisites={research:[],analysis:['research'],drafts:['research','analysis']};
const analysisTask='Valuta la pertinenza commerciale, non la capacità economica. Separa fatti e ipotesi. Non inventare contatti o servizi mancanti.';
export function createGrowthRuntime({store:root,growthStore:s,connections,getActor,externalEnabled=false,providerOptions={}}) {
 const context=new AsyncLocalStorage(),checking=new Set();
 root.db.exec(`CREATE TABLE IF NOT EXISTS gr_runtime(workspace TEXT PRIMARY KEY REFERENCES gr_workspaces(id),provider TEXT NOT NULL DEFAULT '',search_cents INTEGER NOT NULL DEFAULT 0,ai_cents INTEGER NOT NULL DEFAULT 0,version INTEGER NOT NULL DEFAULT 0,checks_json TEXT NOT NULL DEFAULT '{}',enabled_json TEXT NOT NULL DEFAULT '{}',updated_at TEXT,updated_by TEXT);`);
 const readConfig=w=>root.one('SELECT * FROM gr_runtime WHERE workspace=?',w)||{workspace:w,provider:'',search_cents:0,ai_cents:0,version:0,checks_json:'{}',enabled_json:'{}'};
 const config=w=>{s.workspace(w);root.run('INSERT OR IGNORE INTO gr_runtime(workspace) VALUES(?)',w);return readConfig(w);};
 function currentOwner(user=getActor()) {requireOwner(user);const fresh=root.one('SELECT * FROM os_users WHERE id=? AND role=? AND active=1',user.id,'owner');if(!fresh)throw new AppError('Socio non più autorizzato.',403);return fresh;}
 const versions=(c,phase)=>Object.fromEntries(['brave',...(phase==='research'?[]:[c.provider])].filter(Boolean).map(id=>[id,connections.runtimeMetadata(id).version]));
 const fingerprint=(c,phase)=>JSON.stringify({version:c.version,provider:c.provider,versions:versions(c,phase)});
 const executionFingerprint=(c,phase)=>JSON.stringify({config:fingerprint(c,phase),proofs:[...prerequisites[phase],phase].map(id=>JSON.parse(c.checks_json)[id]?.id||null)});
 function phaseState(c) {
  const checks=JSON.parse(c.checks_json),enabled=JSON.parse(c.enabled_json),out={};
  for(const phase of phases){const checked=checks[phase]?.fingerprint===fingerprint(c,phase)&&prerequisites[phase].every(id=>out[id].checked),authorizedBy=enabled[phase]?.by;
   const ownerValid=!!authorizedBy&&!!root.one("SELECT 1 FROM os_users WHERE id=? AND role='owner' AND active=1",authorizedBy);
   out[phase]={checked,lastCheck:checks[phase]?.at||null,enabled:externalEnabled&&checked&&ownerValid&&prerequisites[phase].every(id=>out[id].enabled),authorizedBy:ownerValid?authorizedBy:null};
  }
  return out;
 }
 function state(user,w) {currentOwner(user);const c=config(w);return {available:externalEnabled,provider:c.provider||null,searchCents:c.search_cents,aiCents:c.ai_cents,version:c.version,phases:phaseState(c),note:externalEnabled?'Ogni fase richiede un collaudo e l’attivazione esplicita di un socio.':'Le operazioni esterne sono disabilitate sul server. Puoi preparare la configurazione.',deliveryEnabled:false,calendarEnabled:false};}
 function configured(c,phase) {
  if(c.search_cents<1)throw new AppError('Configura la stima per la ricerca.',409);
  if(phase!=='research'&&(!c.provider||c.ai_cents<1))throw new AppError('Scegli AI e stima per chiamata prima del collaudo.',409);
  for(const id of Object.keys(versions(c,phase)))if(!connections.runtimeMetadata(id).configured)throw new AppError('Accessi dei fornitori da inserire in Collegamenti.',409);
 }
 // Progress must not initialize a workspace/configuration or use provider credentials.
 function progress(user,w) {
  currentOwner(user);const c=readConfig(w),status=phaseState(c),workspace=root.one('SELECT simulation FROM gr_workspaces WHERE id=?',w),paused=!!s.settings(w).paused;
  const usable=!!workspace&&!workspace.simulation&&s.active(w)&&connections.state(user).vaultReady;
  const result={paused,simulation:!!workspace?.simulation};
  for(const phase of phases){let ready=false;try{configured(c,phase);ready=true;}catch{}
   const checked=!!status[phase].checked;
   result[phase]={available:externalEnabled,checked,enabled:!!(usable&&!paused&&ready&&status[phase].enabled&&prerequisites[phase].every(id=>result[id].enabled)),lastCheck:checked?status[phase].lastCheck:null};
  }
  return result;
 }
 function deliveryContext(user,w,{readOnly=false}={}) {
  currentOwner(user);const c=readOnly?readConfig(w):config(w);
  return {fingerprint:executionFingerprint(c,'drafts'),ready:readOnly?progress(user,w).drafts.enabled:externalEnabled&&phaseState(c).drafts.enabled&&s.active(w)};
 }
 function permitted(w,phase,{probe=false}={}) {
  const user=currentOwner();if(!externalEnabled)throw new AppError('Operazioni esterne non abilitate sul server.',409);
  if(!s.active(w))throw new AppError('Attività non disponibile.',409);
  const c=config(w);configured(c,phase);const status=phaseState(c);
  if(probe){if(!prerequisites[phase].every(id=>status[id].checked))throw new AppError('Collauda prima le fasi precedenti.',409);}
  else if(s.settings(w).paused||!status[phase]?.enabled)throw new AppError('Fase Growth in pausa, da collaudare o non attivata.',409);
  return {user,c};
 }
 function assertPermit(w,operation) {
  const permit=context.getStore();
  if(!permit||permit.workspace!==w||!['search','website','ai'].includes(operation)||operation==='search'&&permit.phase!=='research'||operation==='ai'&&permit.phase==='research')throw new AppError('Operazione Growth non autorizzata in questa fase.',409);
  const {user,c}=permitted(w,permit.phase,permit);
  const currentFingerprint=permit.probe?fingerprint(c,permit.phase):executionFingerprint(c,permit.phase);
  if(user.id!==permit.userId||currentFingerprint!==permit.fingerprint)throw new AppError('Configurazione o accessi cambiati: operazione interrotta.',409);
  return {user,c,permit};
 }
 function providers() {
  const read=(w,provider)=>{const {user,c,permit}=assertPermit(w,provider==='brave'?'search':'ai');const expected=versions(c,permit.phase)[provider];if(!expected)throw new AppError('Fornitore non autorizzato.',409);return connections.readForRuntime(user,provider,expected);};
  const call=async(name,w,...args)=>{
   const {c}=assertPermit(w,name==='website'?'website':name==='search'?'search':'ai');
   const p=createGrowthLiveProviders({...providerOptions,credentials:read,allow:async(workspace,operation)=>{assertPermit(workspace,operation);return true;},budget:{reserve:s.reserve,settle:s.settle},settings:s.settings,aiProvider:c.provider,estimatedCents:{search:c.search_cents,ai:c.ai_cents}});
   const result=await p[name](w,...args);assertPermit(w,name==='website'?'website':name==='search'?'search':'ai');return result;
  };
  const blocked=async()=>{throw new AppError('Invii, posta e calendario richiedono una fase di attivazione successiva.',409);};
  return {search:(w,...args)=>call('search',w,...args),website:(w,...args)=>call('website',w,...args),ai:(w,...args)=>call('ai',w,...args),send:blocked,findSent:blocked,thread:blocked,busy:blocked,book:blocked,event:blocked,cancelEvent:blocked};
 }
 const p=providers();
 function save(user,w,b) {
  currentOwner(user);const c=config(w);if(b.version!==c.version)throw new AppError('Configurazione Growth cambiata. Ricarica.',409);
  const provider=b.provider||'';if(!['','openai','anthropic'].includes(provider))throw new AppError('Fornitore AI non valido.');
  for(const value of [b.searchCents,b.aiCents])if(!Number.isSafeInteger(value)||value<0||value>5000)throw new AppError('Stima non valida: usa centesimi interi da 0 a 5000.');
  root.run("UPDATE gr_runtime SET provider=?,search_cents=?,ai_cents=?,version=version+1,checks_json='{}',enabled_json='{}',updated_at=?,updated_by=? WHERE workspace=?",provider,b.searchCents,b.aiCents,now(),user.id,w);
  root.audit(user,w,'Configurazione Growth preparata',w,{provider,version:c.version+1},'admin');return state(user,w);
 }
 async function check(user,w,b) {
  currentOwner(user);const phase=b.phase;if(!phases.includes(phase))throw new AppError('Fase non valida.');const c=config(w);if(b.version!==c.version)throw new AppError('Configurazione Growth cambiata. Ricarica.',409);
  if(checking.has(w))throw new AppError('Un collaudo Growth è già in corso. Attendi il risultato.',409);
  permitted(w,phase,{probe:true});const permit={workspace:w,phase,probe:true,userId:user.id,fingerprint:fingerprint(c,phase)};
  const checks=JSON.parse(c.checks_json),enabled=JSON.parse(c.enabled_json);
  for(const id of phases.filter(id=>id===phase||prerequisites[id].includes(phase))){delete checks[id];enabled[id]=null;}
  root.run('UPDATE gr_runtime SET checks_json=?,enabled_json=?,updated_at=? WHERE workspace=?',JSON.stringify(checks),JSON.stringify(enabled),now(),w);
  checking.add(w);
  try{return await context.run(permit,async()=>{
   let preview;
   if(phase==='research'){
    const found=await p.search(w,b.query,1);if(!found.length)throw new AppError('Nessun risultato per il collaudo. Prova una ricerca diversa.',409);
    const page=await p.website(w,found[0].url);if(!page.text.trim())throw new AppError('La pagina di prova non contiene testo utilizzabile.',409);
    preview={company:found[0].title,source:page.url,sourceDate:page.retrievedAt,websiteText:page.text};
   }else{
    const input=checks.research.preview;const task=phase==='analysis'?analysisTask:'Scrivi una breve bozza commerciale da sottoporre a un socio. Non inviare nulla.';
    const result=await p.ai(w,task,{...input,offer:s.settings(w).offer,description:s.settings(w).description});preview={source:input.source,sourceDate:input.sourceDate,result};
   }
   assertPermit(w,phase==='research'?'website':'ai');const latest=config(w),next=JSON.parse(latest.checks_json);next[phase]={id:randomUUID(),fingerprint:permit.fingerprint,at:now(),preview};
   root.run('UPDATE gr_runtime SET checks_json=?,updated_at=? WHERE workspace=?',JSON.stringify(next),now(),w);
   root.audit(user,w,'Collaudo Growth completato',phase,{source:preview.source,version:c.version},'admin');
   return {runtime:state(user,w),preview:phase==='research'?{company:preview.company,source:preview.source,sourceDate:preview.sourceDate}:preview};
  });}finally{checking.delete(w);}
 }
 function activate(user,w,b) {
  currentOwner(user);if(!phases.includes(b.phase)||typeof b.enabled!=='boolean')throw new AppError('Attivazione non valida.');const c=config(w);if(c.version!==b.version)throw new AppError('Configurazione Growth cambiata. Ricarica.',409);
  if(b.enabled){permitted(w,b.phase,{probe:true});const status=phaseState(c);if(!status[b.phase].checked||!prerequisites[b.phase].every(id=>status[id].enabled))throw new AppError('Collauda questa fase e attiva prima le precedenti.',409);}
  const enabled=JSON.parse(c.enabled_json);enabled[b.phase]=b.enabled?{by:user.id,at:now()}:null;
  if(!b.enabled)for(const phase of phases.filter(id=>prerequisites[id].includes(b.phase)))enabled[phase]=null;
  root.run('UPDATE gr_runtime SET enabled_json=?,updated_at=? WHERE workspace=?',JSON.stringify(enabled),now(),w);root.audit(user,w,b.enabled?'Fase Growth attivata':'Fase Growth sospesa',b.phase,{},'admin');return state(user,w);
 }
 function decorate(w,type,input={}) {const phase=jobPhase[type];if(!phase)throw new AppError('Attività non disponibile nelle fasi Growth attuali.',409);const {user,c}=permitted(w,phase);return {...input,_runtime:{phase,fingerprint:executionFingerprint(c,phase),requestedBy:user.id}};}
 async function run(w,job,operation) {
  const phase=jobPhase[job.type],input=JSON.parse(job.input),stamp=input._runtime;if(!phase||!stamp||stamp.phase!==phase)throw new AppError('Attività precedente al collaudo: crea una nuova richiesta.',409);
  const {user,c}=permitted(w,phase);if(stamp.fingerprint!==executionFingerprint(c,phase))throw new AppError('Attività preparata con accessi o configurazione superati.',409);
  return context.run({workspace:w,phase,userId:user.id,fingerprint:stamp.fingerprint,probe:false},operation);
 }
 function canQueue(w,type) {try{decorate(w,type);return true;}catch{return false;}}
 return {state,progress,save,check,activate,decorate,run,canQueue,providers:p,deliveryContext};
}
