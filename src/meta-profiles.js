import {randomBytes} from 'node:crypto';
import {AppError} from './store.js';
import {createMetaProfileProvider} from './meta-profile-provider.js';

const DAY=86400000,TTL=600000,MAX_BYTES=8*1024*1024;
const nonce=()=>randomBytes(32).toString('hex');
const conflict=()=>new AppError('Configurazione o autorizzazioni cambiate. Riapri la scheda e ripeti la verifica.',409);
const body=(b,keys)=>{if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!keys.includes(k)))throw new AppError('Richiesta Meta non valida.');return b;};
const version=v=>{if(!Number.isSafeInteger(v)||v<0)throw new AppError('Versione non valida.');};

export function createMetaProfiles({store,connections,enabled=false,clock=()=>new Date(),providerOptions={}}){
 store.db.exec(`CREATE TABLE IF NOT EXISTS os_meta_profiles(
  client_id TEXT PRIMARY KEY REFERENCES os_clients(id),version INTEGER NOT NULL,page_id TEXT,instagram_id TEXT,channels_json TEXT NOT NULL DEFAULT '[]',
  connection_version INTEGER,authorized_by TEXT,configured_by TEXT,config_key TEXT,configured_at TEXT,checked_at TEXT,checked_by TEXT,
  enabled INTEGER NOT NULL DEFAULT 0,daily INTEGER NOT NULL DEFAULT 0,activated_by TEXT,activated_at TEXT,last_attempt TEXT,last_sync TEXT,error TEXT);
  CREATE UNIQUE INDEX IF NOT EXISTS os_meta_profiles_page ON os_meta_profiles(page_id) WHERE page_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS os_meta_profiles_instagram ON os_meta_profiles(instagram_id) WHERE instagram_id IS NOT NULL;`);
 const cache=new Map(),selections=new Map(),discoveries=new Map(),pending=new Set(),inflight=new Set();let bytes=0,closed=false,ticking=false;
 const now=()=>clock().getTime(),time=()=>clock().toISOString(),flag=()=>!closed&&(typeof enabled==='function'?enabled():enabled)===true;
 const paused=()=>store.getSetting('paused')==='true',row=id=>store.one('SELECT * FROM os_meta_profiles WHERE client_id=?',id);
 const human=id=>typeof id==='string'&&id!=='os-orchestrator'?store.one("SELECT id,role,tenant_id,active,must_change_password FROM os_users WHERE id=? AND role='owner' AND active=1 AND must_change_password=0",id):null;
 function actor(user,owner=false){
  const u=user?.id&&store.one('SELECT id,role,tenant_id,active,must_change_password FROM os_users WHERE id=?',user.id);
  if(user?.active===false||user?.active===0||!u?.active||u.must_change_password||u.id==='os-orchestrator'||!['owner','client'].includes(u.role)||owner&&u.role!=='owner')throw new AppError('Accesso ai profili non autorizzato.',403);
  if(user.session_id&&!store.one('SELECT id FROM os_sessions WHERE id=? AND user_id=? AND expires_at>?',user.session_id,u.id,now()))throw new AppError('Sessione scaduta.',403);
  return {...u,...(user.session_id?{session_id:user.session_id}:{})};
 }
 function client(user,id,{owner=false,allowMissing=false}={}){
  const u=actor(user,owner),c=typeof id==='string'&&id.length<=160&&store.one('SELECT id,active,services_json FROM os_clients WHERE id=?',id);
  if(!c?.active||u.role==='client'&&u.tenant_id!==id)throw new AppError('Attività non accessibile.',403);
  let services;try{services=JSON.parse(c.services_json);}catch{services=[];}const service=Array.isArray(services)&&services.includes('social');
  if(!service&&!(allowMissing&&u.role==='owner'))throw new AppError('Servizio Social non attivo per questa attività.',403);
  return {user:u,service};
 }
 function metadata(){const r=store.one("SELECT version,updated_by FROM os_connections WHERE id='meta'");return {version:r?.version||0,by:r?.updated_by||null,ready:!!r&&!!human(r.updated_by)&&connections.state(human(r.updated_by)).vaultReady===true};}
 const configured=(r,m)=>!!r?.page_id&&m.ready&&r.connection_version===m.version&&r.authorized_by===m.by&&!!human(r.configured_by);
 const checked=(r,m)=>configured(r,m)&&!!r.checked_at&&Date.parse(r.checked_at)<=now()&&!!human(r.checked_by);
 const active=(r,m)=>checked(r,m)&&r.enabled===1&&!!r.activated_at&&!!human(r.activated_by);
 function drop(id){const item=cache.get(id);if(item){clearTimeout(item.timer);bytes-=item.bytes;cache.delete(id);}}
 function sweep(){for(const [id,item]of cache)if(item.until<=now())drop(id);for(const [id,item]of selections)if(item.until<=now())selections.delete(id);for(const [id,item]of discoveries)if(item.until<=now())discoveries.delete(id);}
 function cached(r){sweep();const item=r&&cache.get(r.client_id);return item&&item.key===r.config_key?item.data:null;}
 function remember(r,data){
  const size=Buffer.byteLength(JSON.stringify(data));if(size>MAX_BYTES)throw new AppError('Risposta Meta troppo grande.',502);sweep();drop(r.client_id);
  while(cache.size>=64||bytes+size>MAX_BYTES)drop(cache.keys().next().value);
  const item={key:r.config_key,data,bytes:size,until:Date.parse(data.expiresAt)};item.timer=setTimeout(()=>{if(cache.get(r.client_id)===item)drop(r.client_id);},Math.max(1,item.until-now()));item.timer.unref?.();cache.set(r.client_id,item);bytes+=size;
 }
 function view(user,id,withData=true){
  const a=client(user,id,{allowMissing:true}),r=row(id),m=metadata(),available=a.service&&flag()&&!paused(),ready=available&&configured(r,m),proof=ready&&checked(r,m),enabled=ready&&active(r,m);
  // A revoked verifier/activator invalidates the copy, even for another owner.
  if(!ready||r?.checked_at&&!proof||r?.enabled&&!enabled)drop(id);
  const data=ready&&!r.error&&(a.user.role==='owner'||enabled)?cached(r):null,error=ready?r.error:null;
  return {available,configured:!!r?.page_id,version:r?.version||0,status:error?'Errore':enabled?'Collegato':'Da collegare',checked:!!proof,enabled:!!enabled,daily:!!(enabled&&r.daily),channels:ready?JSON.parse(r.channels_json):[],lastSync:r?.last_sync||null,error:error||null,canManage:a.user.role==='owner',data:data?(withData?structuredClone(data):true):null,
   note:!a.service?'Il servizio Social non è attivo per questa attività.':!flag()?'La lettura Meta non è abilitata su questo server.':paused()?'La lettura Meta è in pausa con le attività automatiche.':!m.ready?'Configura il token utente Meta nei Collegamenti.':!r?.page_id?'Scegli la pagina e conferma che appartiene a questa attività.':!ready?'Autorizzazioni cambiate: seleziona nuovamente la pagina e ripeti la prova.':error?'Lettura non riuscita. Verifica permessi e account prima di riprovare.':!data?'Dati temporanei non disponibili. Esegui una nuova lettura.':!enabled?'Prova visibile solo ai soci. Confrontala con Meta prima di attivare.':'Dati Meta conservati temporaneamente per massimo 24 ore.'};
 }
 const state=(u,id)=>view(u,id);
 function snapshot(user,id,{needConfig=false,needActive=false}={}){
  const u=client(user,id,{owner:true}).user,m=metadata(),r=row(id);
  if(!flag()||paused())throw new AppError('Lettura Meta disabilitata o in pausa.',409);if(!m.ready)throw new AppError('Accesso Meta da configurare.',409);
  if(needConfig&&!configured(r,m)||needActive&&!active(r,m))throw conflict();
  return {user:u,id,version:r?.version||0,key:r?.config_key||null,connectionVersion:m.version,authorizedBy:m.by,needConfig,needActive};
 }
 function guard(s){const c=snapshot(s.user,s.id,s);if(c.version!==s.version||c.key!==s.key||c.connectionVersion!==s.connectionVersion||c.authorizedBy!==s.authorizedBy)throw conflict();return true;}
 function provider(s){return createMetaProfileProvider({...providerOptions,allow:()=>guard(s),accessToken:()=>{guard(s);const value=connections.readForRuntime(s.user,'meta',s.connectionVersion)?.accessToken;guard(s);return value;}});}
 const identity=s=>JSON.stringify([s.user.id,s.user.session_id||null,s.id,s.version,s.key,s.connectionVersion,s.authorizedBy]);
 async function pages(user,id,value={}){
  const b=body(value,['after','confirmed']);if(b.confirmed!==true)throw new AppError('Conferma la lettura delle pagine autorizzate.');
  const s=snapshot(user,id);sweep();const key=identity(s);let d=discoveries.get(key);
  if(b.after&&(!d||!d.cursors.has(b.after)))throw conflict();
  if(!d){while(discoveries.size>=128)discoveries.delete(discoveries.keys().next().value);d={until:now()+TTL,cursors:new Set()};discoveries.set(key,d);}
  const result=await provider(s).pages({after:b.after});guard(s);if(d.until<=now())throw conflict();
  if(result.after){if(d.cursors.size>=20)throw new AppError('Limite di pagine raggiunto. Scegli una pagina dalla lista.',409);d.cursors.add(result.after);}
  return {...result,items:result.items.map(item=>{while(selections.size>=500)selections.delete(selections.keys().next().value);const selectionToken=nonce();selections.set(selectionToken,{identity:key,pageId:item.id,instagramId:item.instagramId,until:now()+TTL});return {...item,selectionToken};})};
 }
 function configure(user,id,value){
  const b=body(value,['version','selectionToken','channels','confirmedBusiness']);version(b.version);
  if(b.confirmedBusiness!==true||typeof b.selectionToken!=='string'||!Array.isArray(b.channels)||!b.channels.length||b.channels.length>2||new Set(b.channels).size!==b.channels.length||b.channels.some(c=>!['facebook','instagram'].includes(c)))throw new AppError('Conferma la pagina e scegli i canali da leggere.');
  const s=snapshot(user,id),selected=selections.get(b.selectionToken);if(s.version!==b.version||!selected||selected.until<=now()||selected.identity!==identity(s))throw conflict();
  if(b.channels.includes('instagram')&&!selected.instagramId)throw new AppError('Questa pagina non ha un profilo Instagram professionale collegato.');
  return store.transaction(()=>{guard(s);if(store.one('SELECT client_id FROM os_meta_profiles WHERE page_id=? AND client_id<>?',selected.pageId,id))throw new AppError('Pagina già associata a un’altra attività. Scollegala prima di assegnarla nuovamente.',409);
   const instagramId=b.channels.includes('instagram')?selected.instagramId:null;
   if(instagramId&&store.one('SELECT client_id FROM os_meta_profiles WHERE instagram_id=? AND client_id<>?',instagramId,id))throw new AppError('Profilo Instagram già associato a un’altra attività. Scollegalo prima di assegnarlo nuovamente.',409);
   store.run(`INSERT INTO os_meta_profiles(client_id,version,page_id,instagram_id,channels_json,connection_version,authorized_by,configured_by,config_key,configured_at) VALUES(?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(client_id) DO UPDATE SET version=excluded.version,page_id=excluded.page_id,instagram_id=excluded.instagram_id,channels_json=excluded.channels_json,connection_version=excluded.connection_version,authorized_by=excluded.authorized_by,configured_by=excluded.configured_by,config_key=excluded.config_key,configured_at=excluded.configured_at,checked_at=NULL,checked_by=NULL,enabled=0,daily=0,activated_by=NULL,activated_at=NULL,last_attempt=NULL,last_sync=NULL,error=NULL`,id,s.version+1,selected.pageId,instagramId,JSON.stringify(b.channels),s.connectionVersion,s.authorizedBy,s.user.id,nonce(),time());
   selections.delete(b.selectionToken);drop(id);store.audit(s.user,id,'Pagina Meta selezionata',id,{version:s.version+1,channels:b.channels},'admin');return state(s.user,id);
  });
 }
 async function read(user,id,value,{check=false,claimed=false}={}){
  const b=body(value,['version']);version(b.version);const s=snapshot(user,id,{needConfig:true,needActive:!check});if(s.version!==b.version)throw conflict();
  if(inflight.has(id))throw new AppError('Una lettura Meta è già in corso.',409);
  const selected=row(id),started=now();if(!claimed&&selected.last_attempt&&started-Date.parse(selected.last_attempt)<60000)throw new AppError('Attendi un minuto prima di un’altra lettura Meta.',429);
  const to=new Date(started-3*DAY).toISOString().slice(0,10),from=new Date(Date.parse(to)-27*DAY).toISOString().slice(0,10),p=provider(s);
  inflight.add(id);drop(id);if(!claimed)store.run('UPDATE os_meta_profiles SET last_attempt=? WHERE client_id=? AND version=?',time(),id,s.version);
  try{
   const reports={};for(const channel of JSON.parse(selected.channels_json)){reports[channel]=await p.report({pageId:selected.page_id,instagramId:selected.instagram_id,channel,from,to});guard(s);}
   if(now()>=started+DAY)throw conflict();const data={...reports,from,to,fetchedAt:time(),expiresAt:new Date(started+DAY).toISOString()};
   store.transaction(()=>{guard(s);if(check)store.run('UPDATE os_meta_profiles SET enabled=0,daily=0,activated_by=NULL,activated_at=NULL WHERE client_id=? AND version=?',id,s.version);store.run('UPDATE os_meta_profiles SET last_sync=?,error=NULL,checked_at=CASE WHEN ? THEN ? ELSE checked_at END,checked_by=CASE WHEN ? THEN ? ELSE checked_by END WHERE client_id=? AND version=?',data.fetchedAt,check?1:0,data.fetchedAt,check?1:0,s.user.id,id,s.version);store.audit(s.user,id,check?'Lettura Meta collaudata':'Dati Meta aggiornati',id,{version:s.version,channels:JSON.parse(selected.channels_json)},'admin');});
   remember(row(id),data);return state(s.user,id);
  }catch(error){drop(id);try{guard(s);store.run('UPDATE os_meta_profiles SET error=? WHERE client_id=? AND version=?','Lettura Meta non riuscita. Verifica permessi, quote e pagina selezionata.',id,s.version);}catch{}if(error instanceof AppError)throw error;throw new AppError('Lettura Meta non riuscita.',502);}
  finally{inflight.delete(id);}
 }
 function activate(user,id,value){
  const b=body(value,['version','enabled','daily','confirmed']);version(b.version);const u=client(user,id,{owner:true,allowMissing:true}).user,r=row(id);
  if(b.confirmed!==true||typeof b.enabled!=='boolean'||typeof b.daily!=='boolean'||!b.enabled&&b.daily)throw new AppError('Conferma attivazione e aggiornamento giornaliero.');if(!r?.page_id||r.version!==b.version)throw conflict();
  let s;if(b.enabled){s=snapshot(user,id,{needConfig:true});if(!checked(r,metadata())||r.error||!cached(r))throw new AppError('Confronta prima una prova corrente con Meta.',409);}
  return store.transaction(()=>{client(user,id,{owner:true,allowMissing:true});if(row(id).version!==b.version)throw conflict();if(s)guard(s);store.run('UPDATE os_meta_profiles SET version=version+1,enabled=?,daily=?,activated_by=?,activated_at=? WHERE client_id=? AND version=?',b.enabled?1:0,b.daily?1:0,b.enabled?u.id:null,b.enabled?time():null,id,b.version);if(!b.enabled)drop(id);store.audit(u,id,b.enabled?'Lettura Meta attivata':'Lettura Meta sospesa',id,{version:b.version+1,daily:b.daily},'admin');return state(u,id);});
 }
 function disconnect(user,id,value){
  const b=body(value,['version','confirmed']);version(b.version);const u=client(user,id,{owner:true,allowMissing:true}).user,r=row(id);if(b.confirmed!==true)throw new AppError('Conferma la disconnessione locale.');if(!r?.page_id||r.version!==b.version)throw conflict();
  return store.transaction(()=>{store.run("UPDATE os_meta_profiles SET version=version+1,page_id=NULL,instagram_id=NULL,channels_json='[]',connection_version=NULL,authorized_by=NULL,configured_by=NULL,config_key=NULL,checked_at=NULL,checked_by=NULL,enabled=0,daily=0,activated_by=NULL,activated_at=NULL,last_attempt=NULL,last_sync=NULL,error=NULL WHERE client_id=? AND version=?",id,b.version);drop(id);store.audit(u,id,'Pagina Meta scollegata nell’OS',id,{version:b.version+1},'admin');return state(u,id);});
 }
 async function tick(){
  const counts={attempted:0,succeeded:0,failed:0};if(ticking||!flag()||paused()||!metadata().ready)return counts;ticking=true;
  try{for(const r of store.query('SELECT * FROM os_meta_profiles WHERE enabled=1 AND daily=1')){
   if(counts.attempted>=5||!flag()||paused())break;if(inflight.has(r.client_id)||r.last_attempt&&now()-Date.parse(r.last_attempt)<DAY)continue;
   try{const s=snapshot(human(r.activated_by),r.client_id,{needConfig:true,needActive:true});if(s.version!==r.version)continue;
    guard(s);store.run('UPDATE os_meta_profiles SET last_attempt=? WHERE client_id=? AND version=?',time(),r.client_id,r.version);counts.attempted++;
    try{await read(s.user,r.client_id,{version:r.version},{claimed:true});counts.succeeded++;}catch{counts.failed++;}
   }catch{/* Revoked scopes are skipped, never restored implicitly. */}
  }return counts;}finally{ticking=false;}
 }
 function progress(user){actor(user,true);const result={available:flag()&&!paused()&&metadata().ready,configuredCount:0,checkedCount:0,enabledCount:0,dailyCount:0,cachedCount:0,lastSync:null};for(const r of store.query('SELECT * FROM os_meta_profiles WHERE page_id IS NOT NULL')){let v;try{v=view(user,r.client_id,false);}catch(error){if(error.status===403)continue;throw error;}result.configuredCount++;if(v.checked)result.checkedCount++;if(v.enabled)result.enabledCount++;if(v.daily)result.dailyCount++;if(v.data)result.cachedCount++;if(v.lastSync&&(!result.lastSync||v.lastSync>result.lastSync))result.lastSync=v.lastSync;}return result;}
 function track(fn){return(...args)=>{const promise=fn(...args);pending.add(promise);promise.then(()=>pending.delete(promise),()=>pending.delete(promise));return promise;};}
 async function close(){closed=true;for(const id of cache.keys())drop(id);selections.clear();discoveries.clear();await Promise.allSettled([...pending]);}
 return {state,pages:track(pages),configure,check:track((u,id,b)=>read(u,id,b,{check:true})),activate,disconnect,refresh:track(read),tick:track(tick),progress,close};
}
