import {randomBytes} from 'node:crypto';
import {AppError} from './store.js';
import {createBusinessProfileProvider,businessProfileName,businessProfilePageToken} from './business-profile-provider.js';

const DAY=86400000,SELECTION_TTL=600000,MAX_CACHE_BYTES=8*1024*1024,MAX_CACHE_CLIENTS=64;
const localServices=new Set(['local','presence','multisite','reputation']);
const nonce=()=>randomBytes(32).toString('hex');
const body=(value,keys)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k)))throw new AppError('Richiesta Google Business Profile non valida.');return value;};
const version=value=>{if(!Number.isSafeInteger(value)||value<0)throw new AppError('Versione della scheda non valida.');return value;};
const conflict=()=>new AppError('Configurazione o autorizzazione cambiata. Riapri la scheda e ripeti il controllo.',409);

export function createBusinessProfile({store,auth,enabled=false,clock=()=>new Date(),providerOptions={}}){
 store.db.exec(`CREATE TABLE IF NOT EXISTS os_gbp_config(
 client_id TEXT PRIMARY KEY REFERENCES os_clients(id),version INTEGER NOT NULL,account_name TEXT NOT NULL,location_name TEXT NOT NULL,
 auth_version INTEGER NOT NULL,connection_version INTEGER NOT NULL,authorized_by TEXT NOT NULL,configured_by TEXT NOT NULL,
 config_key TEXT NOT NULL,configured_at TEXT NOT NULL,checked_at TEXT,checked_by TEXT,enabled INTEGER NOT NULL DEFAULT 0,daily INTEGER NOT NULL DEFAULT 0,
 activated_by TEXT,activated_at TEXT,last_sync TEXT,last_attempt TEXT,error TEXT);`);
 const cache=new Map(),selections=new Map(),discoveries=new Map(),inflight=new Set();let cacheBytes=0,closed=false,ticking=false;
 const time=()=>clock().toISOString(),now=()=>clock().getTime();
 const flag=()=>!closed&&(typeof enabled==='function'?enabled():enabled)===true;
 const paused=()=>store.getSetting('paused')==='true';
 const row=id=>store.one('SELECT * FROM os_gbp_config WHERE client_id=?',id);
 function human(id){const u=typeof id==='string'&&id!=='os-orchestrator'&&store.one('SELECT id,role,tenant_id,active,must_change_password FROM os_users WHERE id=?',id);return u?.active&&!u.must_change_password&&u.role==='owner'?u:null;}
 function actor(user,owner=false){
  if(!user||user.active===false||user.active===0||user.id==='os-orchestrator')throw new AppError('Accesso Google Business Profile non autorizzato.',403);
  const u=store.one('SELECT id,role,tenant_id,active,must_change_password FROM os_users WHERE id=?',user.id||'');
  if(!u?.active||u.must_change_password||!['owner','client'].includes(u.role)||owner&&u.role!=='owner')throw new AppError('Accesso Google Business Profile non autorizzato.',403);
  if(user.session_id&&!store.one('SELECT id FROM os_sessions WHERE id=? AND user_id=? AND expires_at>?',user.session_id,u.id,now()))throw new AppError('Sessione scaduta. Accedi nuovamente.',403);
  return {...u,...(user.session_id?{session_id:user.session_id}:{})};
 }
 function client(user,id,{owner=false,allowMissingService=false}={}){
  const u=actor(user,owner);if(typeof id!=='string'||!id||id.length>160)throw new AppError('Attività non accessibile.',403);
  const c=store.one('SELECT id,active,services_json FROM os_clients WHERE id=?',id);
  if(!c?.active||u.role==='client'&&u.tenant_id!==id)throw new AppError('Attività non accessibile.',403);
  let services;try{services=JSON.parse(c.services_json);}catch{services=[];}const service=Array.isArray(services)&&services.some(s=>localServices.has(s));
  if(!service&&!(allowMissingService&&u.role==='owner'))throw new AppError('Servizio locale non attivo per questa attività.',403);
  return {user:u,service};
 }
 function metadata(){return auth?.metadata?.()||{};}
 function authorized(m){return m.available===true&&m.configured===true&&m.connected===true&&Number.isSafeInteger(m.version)&&Number.isSafeInteger(m.connectionVersion)&&!!human(m.authorizedBy);}
 function configured(r,m){return !!r&&authorized(m)&&r.auth_version===m.version&&r.connection_version===m.connectionVersion&&r.authorized_by===m.authorizedBy&&!!human(r.configured_by);}
 function checked(r,m){return configured(r,m)&&!!r.checked_at&&Number.isFinite(Date.parse(r.checked_at))&&Date.parse(r.checked_at)<=now()&&!!human(r.checked_by);}
 function activated(r,m){return checked(r,m)&&r.enabled===1&&!!r.activated_at&&!!human(r.activated_by);}
 function drop(id){const item=cache.get(id);if(item){clearTimeout(item.timer);cacheBytes-=item.bytes;cache.delete(id);}}
 function sweep(){const n=now();for(const [id,item]of cache)if(item.until<=n)drop(id);for(const [id,s]of selections)if(s.until<=n)selections.delete(id);for(const [id,d]of discoveries)if(d.until<=n)discoveries.delete(id);}
 function cached(r){sweep();const item=r&&cache.get(r.client_id);if(!item||item.key!==r.config_key)return null;return item.data;}
 function remember(r,data){
  const bytes=Buffer.byteLength(JSON.stringify(data));if(bytes>MAX_CACHE_BYTES)throw new AppError('Dati Google troppo grandi per la conservazione temporanea.',502);
  sweep();drop(r.client_id);while(cache.size>=MAX_CACHE_CLIENTS||cacheBytes+bytes>MAX_CACHE_BYTES)drop(cache.keys().next().value);
  const item={key:r.config_key,data,bytes,until:Date.parse(data.expiresAt),timer:null};item.timer=setTimeout(()=>{if(cache.get(r.client_id)===item)drop(r.client_id);},Math.max(1,item.until-now()));item.timer.unref?.();cache.set(r.client_id,item);cacheBytes+=bytes;
 }
 function availability(){return flag()&&!paused()&&metadata().available===true;}
 function view(user,id,copyData=true){
  const access=client(user,id,{allowMissingService:true}),r=row(id),m=metadata(),available=access.service&&flag()&&!paused()&&m.available===true,ready=available&&configured(r,m),proof=ready&&checked(r,m),active=ready&&activated(r,m),data=ready&&(access.user.role==='owner'||active)?cached(r):null;
  if(!ready)drop(id);
  const error=ready?r?.error||null:null;
  return {available,configured:!!r,version:r?.version||0,status:error?'Errore':active?'Collegato':'Da collegare',checked:!!proof,enabled:!!active,daily:!!(active&&r.daily),lastSync:r?.last_sync||null,error,canManage:access.service&&access.user.role==='owner',data:data?(copyData?structuredClone(data):true):null,
   note:!access.service?'Il servizio locale non è attivo per questa attività.':!flag()?'Google Business Profile non è abilitato su questo server.':paused()?'Google Business Profile è in pausa con le attività automatiche.':!authorized(m)?'Autorizza un account Google Business Profile nei Collegamenti.':!r?'Scegli la scheda e conferma che appartenga a questa attività.':!ready?'Configurazione o autorizzazioni cambiate: scegli nuovamente la scheda e ripeti il collaudo.':error?'L’ultima lettura non è riuscita. Nessun nuovo tentativo immediato automatico.':!data?'Nessun dato temporaneo disponibile: esegui una nuova lettura. L’ultima sincronizzazione è solo una data storica.':!active?'Prova consultabile dal socio: confronta i dati con Google prima di attivare.':'Fonte Google Business Profile. Dati temporanei, conservati per massimo 24 ore.'};
 }
 const state=(user,id)=>view(user,id);
 function snapshot(user,id,{needConfig=false,needActive=false}={}){
  const u=client(user,id,{owner:true}).user,m=metadata(),r=row(id);
  if(!flag())throw new AppError('Google Business Profile non abilitato sul server.',409);if(paused())throw new AppError('Attività automatiche in pausa.',409);if(!authorized(m))throw new AppError('Account Google Business Profile da autorizzare.',409);
  if(needConfig&&!configured(r,m)||needActive&&!activated(r,m))throw conflict();
  return {user:u,id,revision:r?.version||0,key:r?.config_key||null,authVersion:m.version,connectionVersion:m.connectionVersion,authorizedBy:m.authorizedBy,needConfig,needActive};
 }
 function guard(s){const current=snapshot(s.user,s.id,s);if(current.revision!==s.revision||current.key!==s.key||current.authVersion!==s.authVersion||current.connectionVersion!==s.connectionVersion||current.authorizedBy!==s.authorizedBy)throw conflict();return true;}
 function provider(s){return createBusinessProfileProvider({...providerOptions,allow:()=>guard(s),accessToken:()=>{guard(s);return auth.accessToken(s.user,s.authVersion);}});}
 const identity=s=>JSON.stringify([s.user.id,s.user.session_id||null,s.id,s.revision,s.key,s.authVersion,s.connectionVersion,s.authorizedBy]);
 function discovery(s,create=false){sweep();const key=identity(s);let d=discoveries.get(key);if(!d&&create){while(discoveries.size>=128)discoveries.delete(discoveries.keys().next().value);d={until:now()+SELECTION_TTL,accounts:new Set(),accountPages:new Set(),locationPages:new Map()};discoveries.set(key,d);}return d;}
 async function accounts(user,id,value={}){
  const b=body(value,['pageToken']),s=snapshot(user,id),token=businessProfilePageToken(b.pageToken),d=discovery(s,true);if(token&&!d.accountPages.has(token))throw conflict();
  const result=await provider(s).accounts({pageToken:token});guard(s);if(d.until<=now())throw conflict();for(const item of result.items){if(d.accounts.size>=200&&!d.accounts.has(item.name))throw new AppError('Troppe schede nella sessione: scegli un account prima di continuare.',409);d.accounts.add(item.name);}if(result.nextPageToken){if(d.accountPages.size>=20)throw new AppError('Limite di pagine raggiunto.',409);d.accountPages.add(result.nextPageToken);}return result;
 }
 async function locations(user,id,value){
  const b=body(value,['accountName','pageToken']),s=snapshot(user,id),account=businessProfileName(b.accountName,'account'),token=businessProfilePageToken(b.pageToken),d=discovery(s);
  if(!d?.accounts.has(account)||token&&!d.locationPages.get(account)?.has(token))throw new AppError('Scegli un account appena restituito da Google.',409);
  const result=await provider(s).locations({accountName:account,pageToken:token});guard(s);if(d.until<=now())throw conflict();if(result.nextPageToken){const pages=d.locationPages.get(account)||new Set();if(pages.size>=20)throw new AppError('Limite di pagine raggiunto.',409);pages.add(result.nextPageToken);d.locationPages.set(account,pages);}
  return {...result,items:result.items.map(item=>{while(selections.size>=500)selections.delete(selections.keys().next().value);const selectionToken=nonce();selections.set(selectionToken,{identity:identity(s),account,location:item.name,until:now()+SELECTION_TTL});return {name:item.name,title:item.title,address:item.storefrontAddress||null,selectionToken};})};
 }
 function configure(user,id,value){
  const b=body(value,['version','selectionToken','confirmedBusiness']);version(b.version);if(b.confirmedBusiness!==true||typeof b.selectionToken!=='string'||! /^[a-f0-9]{64}$/.test(b.selectionToken))throw new AppError('Conferma la scheda dell’attività scelta.');
  const s=snapshot(user,id),selected=selections.get(b.selectionToken);if(s.revision!==b.version||!selected||selected.until<=now()||selected.identity!==identity(s))throw conflict();
  return store.transaction(()=>{guard(s);selections.delete(b.selectionToken);store.run(`INSERT INTO os_gbp_config(client_id,version,account_name,location_name,auth_version,connection_version,authorized_by,configured_by,config_key,configured_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(client_id) DO UPDATE SET version=excluded.version,account_name=excluded.account_name,location_name=excluded.location_name,auth_version=excluded.auth_version,connection_version=excluded.connection_version,authorized_by=excluded.authorized_by,configured_by=excluded.configured_by,config_key=excluded.config_key,configured_at=excluded.configured_at,checked_at=NULL,checked_by=NULL,enabled=0,daily=0,activated_by=NULL,activated_at=NULL,last_sync=NULL,last_attempt=NULL,error=NULL`,id,s.revision+1,selected.account,selected.location,s.authVersion,s.connectionVersion,s.authorizedBy,s.user.id,nonce(),time());store.audit(s.user,id,'Scheda Google Business Profile scelta',id,{version:s.revision+1,authorizationVersion:s.authVersion},'admin');drop(id);return state(s.user,id);});
 }
 async function read(user,id,value,{check=false,claimed=false}={}){
  const b=body(value,['version']);version(b.version);const s=snapshot(user,id,{needConfig:true,needActive:!check});if(b.version!==s.revision)throw conflict();if(inflight.has(id))throw new AppError('Una lettura Google è già in corso per questa attività.',409);
  const selected=row(id),p=provider(s),startedAt=now(),toDate=new Date(startedAt);toDate.setUTCDate(toDate.getUTCDate()-3);const to=toDate.toISOString().slice(0,10),from=new Date(Date.parse(to)-27*DAY).toISOString().slice(0,10);
  inflight.add(id);drop(id);if(!claimed)store.run('UPDATE os_gbp_config SET last_attempt=? WHERE client_id=? AND version=?',time(),id,s.revision);
  try{
   const location=await p.location({locationName:selected.location_name});guard(s);
   const reviews=await p.reviews({accountName:selected.account_name,locationName:selected.location_name});guard(s);
   const performance=await p.performance({locationName:selected.location_name,from,to});guard(s);
   const fetchedAt=time(),data={location,reviews,performance,from,to,fetchedAt,expiresAt:new Date(startedAt+DAY).toISOString(),source:'Google Business Profile',sourceUrl:location.metadata?.mapsUri||null};
   if(now()>=startedAt+DAY)throw new AppError('Lettura Google scaduta: esegui un nuovo controllo.',409);
   store.transaction(()=>{guard(s);store.run('UPDATE os_gbp_config SET last_sync=?,error=NULL,checked_at=CASE WHEN ? THEN ? ELSE checked_at END,checked_by=CASE WHEN ? THEN ? ELSE checked_by END WHERE client_id=? AND version=?',fetchedAt,check?1:0,fetchedAt,check?1:0,s.user.id,id,s.revision);store.audit(s.user,id,check?'Lettura Google Business Profile collaudata':'Google Business Profile aggiornato',id,{version:s.revision,authorizationVersion:s.authVersion},'admin');});
   remember(row(id),data);return state(s.user,id);
  }catch(error){drop(id);try{guard(s);store.run('UPDATE os_gbp_config SET error=? WHERE client_id=? AND version=?','Lettura Google non riuscita. Verifica collegamento, quote e scheda.',id,s.revision);}catch{}if(error instanceof AppError)throw error;throw new AppError('Lettura Google Business Profile non riuscita.',502);
  }finally{inflight.delete(id);}
 }
 function activate(user,id,value){
  const b=body(value,['version','enabled','daily','confirmed']);version(b.version);const u=client(user,id,{owner:true}).user,r=row(id);if(b.confirmed!==true||typeof b.enabled!=='boolean'||typeof b.daily!=='boolean'||!b.enabled&&b.daily)throw new AppError('Conferma attivazione e frequenza di aggiornamento.');if(!r||r.version!==b.version)throw conflict();
  let s;if(b.enabled){s=snapshot(user,id,{needConfig:true});if(!checked(r,metadata())||r.error||!cached(r))throw new AppError('Completa e confronta una lettura corrente prima di attivare.',409);}
  return store.transaction(()=>{client(user,id,{owner:true});if(row(id).version!==b.version)throw conflict();if(s)guard(s);store.run('UPDATE os_gbp_config SET version=version+1,enabled=?,daily=?,activated_by=?,activated_at=? WHERE client_id=? AND version=?',b.enabled?1:0,b.daily?1:0,b.enabled?u.id:null,b.enabled?time():null,id,b.version);store.audit(u,id,b.enabled?'Google Business Profile attivato':'Google Business Profile sospeso',id,{version:b.version+1,daily:b.daily},'admin');if(!b.enabled)drop(id);return state(u,id);});
 }
 async function tick(){
  if(ticking||!availability())return {attempted:0,succeeded:0,failed:0};ticking=true;const counts={attempted:0,succeeded:0,failed:0};
  try{for(const r of store.query('SELECT * FROM os_gbp_config WHERE enabled=1 AND daily=1')){
   // Bound one scheduler pass. Claimed dates let following passes move to the
   // remaining clients without retrying a failed call in the same day.
   if(counts.attempted>=5||!availability())break;if(inflight.has(r.client_id)||r.last_attempt&&now()-Date.parse(r.last_attempt)<DAY)continue;
   try{const user=human(r.activated_by);if(!user)continue;const s=snapshot(user,r.client_id,{needConfig:true,needActive:true});if(s.revision!==r.version)continue;
    const claimed=store.transaction(()=>{guard(s);const current=row(r.client_id);if(current.last_attempt&&now()-Date.parse(current.last_attempt)<DAY)return false;return !!store.run('UPDATE os_gbp_config SET last_attempt=? WHERE client_id=? AND version=?',time(),r.client_id,r.version).changes;});if(!claimed)continue;
    counts.attempted++;try{await read(user,r.client_id,{version:r.version},{claimed:true});counts.succeeded++;}catch{counts.failed++;}
   }catch{/* Revoked, inactive or changed entries are skipped, never retried. */}
  }return counts;}finally{ticking=false;}
 }
 function progress(user){
  actor(user,true);const result={available:availability(),configuredCount:0,checkedCount:0,enabledCount:0,dailyCount:0,cachedCount:0,lastSync:null};
  for(const r of store.query('SELECT * FROM os_gbp_config')){let v;try{v=view(user,r.client_id,false);}catch(error){if(error.status===403)continue;throw error;}if(!v.canManage)continue;result.configuredCount++;if(v.checked)result.checkedCount++;if(v.enabled)result.enabledCount++;if(v.daily)result.dailyCount++;if(v.data)result.cachedCount++;if(v.lastSync&&(!result.lastSync||v.lastSync>result.lastSync))result.lastSync=v.lastSync;}return result;
 }
 function close(){closed=true;for(const id of cache.keys())drop(id);selections.clear();discoveries.clear();}
 return {state,accounts,locations,configure,check:(u,id,b)=>read(u,id,b,{check:true}),activate,refresh:(u,id,b)=>read(u,id,b),tick,progress,close};
}
