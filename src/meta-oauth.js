import {randomBytes,createHash} from 'node:crypto';
import {AppError,requireOwner} from './store.js';
import {createVault} from './vault.js';
import {createMetaOAuthHttp} from './meta-oauth-http.js';

export const META_READ_SCOPES=Object.freeze(['public_profile','pages_show_list','pages_read_engagement','read_insights','instagram_basic','instagram_manage_insights']);
const hash=value=>createHash('sha256').update(value).digest('hex');
const secret=value=>typeof value==='string'&&/^[\x21-\x7e]{1,16000}$/.test(value);
const invalid=()=>new AppError('Autorizzazione Meta cambiata, scaduta o incompleta. Ripeti il collegamento.',409);
function body(b,keys){if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!keys.includes(k)))throw new AppError('Richiesta Meta non valida.');}

export function createMetaOAuth({store:s,connections,env={},origin,enabled=false,clock=()=>new Date(),providerOptions={}}){
 const vault=createVault(env),pending=new Map(),work=new Set();let closed=false;
 const now=()=>clock().getTime(),time=()=>clock().toISOString(),available=()=>!closed&&(typeof enabled==='function'?enabled():enabled)===true;
 const row=()=>s.one("SELECT * FROM os_connections WHERE id='meta'");
 const human=id=>!!s.one("SELECT id FROM os_users WHERE id=? AND role='owner' AND active=1 AND must_change_password=0 AND id<>'os-orchestrator'",id||'');
 function owner(user,session=false){requireOwner(user);if(!human(user.id))throw new AppError('Socio non più autorizzato.',403);if(session&&(!user.session_id||!s.one('SELECT id FROM os_sessions WHERE id=? AND user_id=? AND expires_at>?',user.session_id,user.id,now())))throw new AppError('Riapri Meta dalla tua sessione BigAnt OS.',403);}
 function values(r=row()){return r?vault.open(r.sealed,'connection:meta'):{};}
 function metadata(){
  const r=row();let v={},readable=false;try{v=values(r);readable=!!r;}catch{/* Unreadable credentials never fall back to the manual path. */}
  const mode=v.mode==='oauth'?'oauth':'manual',configured=mode==='oauth'&&!!v.appId&&!!v.appSecret,connected=available()&&vault.ready&&configured&&secret(v.accessToken)&&Number.isSafeInteger(v.expiresAt)&&v.expiresAt>now()&&human(r?.updated_by);
  return {mode,readable,available:available(),configured,connected,version:r?.version||0,accountName:connected?v.accountName:null,expiresAt:mode==='oauth'&&Number.isSafeInteger(v.expiresAt)?new Date(v.expiresAt).toISOString():null,authorizedBy:connected?r.updated_by:null,channels:connected?v.channels:[]};
 }
 connections.setMetaMetadata(metadata);
 function state(user){owner(user);return metadata();}
 function current(user,version,{session=true,external=false}={}){
  owner(user,session);if(closed||!vault.ready)throw invalid();const r=row();if(!Number.isSafeInteger(version)||version<0||version!==(r?.version||0))throw invalid();
  if(external){if(!available())throw new AppError('Accesso Meta non abilitato sul server.',409);let u;try{u=new URL(origin);}catch{throw invalid();}if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw invalid();}
  return r;
 }
 function write(user,version,v,action){
  return s.transaction(()=>{current(user,version);s.run("INSERT INTO os_connections(id,sealed,version,updated_at,updated_by) VALUES('meta',?,?,?,?) ON CONFLICT(id) DO UPDATE SET sealed=excluded.sealed,version=excluded.version,updated_at=excluded.updated_at,updated_by=excluded.updated_by,last_checked=NULL,check_status='Da collegare',check_note=''",vault.seal(v,'connection:meta'),version+1,time(),user.id);s.audit(user,null,action,'meta',{version:version+1},'admin');return version+1;});
 }
 function keys(v){return {mode:'oauth',appId:v.appId,appSecret:v.appSecret};}
 function configure(user,b={}){
  body(b,['version','appId','appSecret']);const r=current(user,b.version),previous=values(r);
  if(b.appId!==undefined&&typeof b.appId!=='string'||b.appSecret!==undefined&&typeof b.appSecret!=='string')throw new AppError('Accessi app Meta non validi.');
  const appId=b.appId?.trim()||previous.appId,appSecret=b.appSecret?.trim()||previous.appSecret;
  if(!/^\d{1,40}$/.test(appId||'')||!secret(appSecret)||appSecret.length>512||previous.appId&&appId!==previous.appId&&!b.appSecret?.trim())throw new AppError('Inserisci ID e chiave segreta dell’app Meta. Se cambi ID, reinserisci anche la chiave.');
  write(user,b.version,{mode:'oauth',appId,appSecret},'Configurazione app Meta salvata');pending.clear();return state(user);
 }
 function start(user,b={}){
  body(b,['version','channels','acknowledged']);const r=current(user,b.version,{external:true}),v=values(r);
  if(v.mode!=='oauth'||!v.appId||!v.appSecret)throw new AppError('Configura prima l’app Meta.',409);
  if(b.acknowledged!==true||!Array.isArray(b.channels)||!b.channels.length||b.channels.length>2||new Set(b.channels).size!==b.channels.length||b.channels.some(c=>!['facebook','instagram'].includes(c)))throw new AppError('Scegli i canali e conferma i permessi di lettura.');
  const scopes=['public_profile','pages_show_list','pages_read_engagement',...(b.channels.includes('facebook')?['read_insights']:[]),...(b.channels.includes('instagram')?['instagram_basic','instagram_manage_insights']:[])];
  const nonce=randomBytes(32).toString('base64url'),until=now()+600000;
  const http=createMetaOAuthHttp({...providerOptions,...keys(v),redirectUri:new URL('/auth/meta/callback',origin).href,allow:()=>{current(user,b.version,{external:true});return true;}});
  const url=http.authorizationUrl({state:nonce,scopes});
  const version=write(user,b.version,keys(v),'Autorizzazione Meta avviata');pending.clear();pending.set(hash(nonce),{version,userId:user.id,sessionId:user.session_id,until,scopes,channels:[...b.channels]});return {url};
 }
 async function finishWork(user,b={}){
  owner(user,true);body(b,['state','code','error']);if(typeof b.state!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(b.state))throw invalid();
  const key=hash(b.state),p=pending.get(key);if(!p||p.userId!==user.id||p.sessionId!==user.session_id||p.until<=now())throw invalid();
  const fresh=()=>{current(user,p.version,{external:true});if(p.until<=now())throw invalid();return true;};fresh();pending.delete(key);
  if(b.error)throw new AppError('Autorizzazione Meta non concessa.',409);if(!secret(b.code)||b.code.length>4096)throw invalid();
  const v=values(),http=createMetaOAuthHttp({...providerOptions,...keys(v),redirectUri:new URL('/auth/meta/callback',origin).href,allow:fresh});
  const started=now(),first=await http.exchangeCode({code:b.code});fresh();
  const token=await http.extendToken({accessToken:first.accessToken});fresh();
  const info=await http.inspectToken({accessToken:token.accessToken});fresh();
  const identity=await http.identity({accessToken:token.accessToken});fresh();
  if(info.isValid!==true||info.type!=='USER'||String(info.appId)!==v.appId||info.userId!==identity.id||!/^\d{1,40}$/.test(identity.id||'')||typeof identity.name!=='string'||!identity.name.trim()||identity.name.length>200||/[\x00-\x1f\x7f]/.test(identity.name)||!Array.isArray(info.scopes)||!p.scopes.every(scope=>info.scopes.includes(scope))||info.scopes.some(scope=>!META_READ_SCOPES.includes(scope))||!secret(token.accessToken)||String(token.tokenType).toLowerCase()!=='bearer'||!Number.isSafeInteger(token.expiresIn)||token.expiresIn<1||token.expiresIn>366*86400||!Number.isSafeInteger(info.expiresAt)||info.expiresAt*1000<=now()||!Number.isSafeInteger(info.dataAccessExpiresAt)||info.dataAccessExpiresAt<0)throw invalid();
  const expiresAt=Math.min(started+token.expiresIn*1000,info.expiresAt*1000,info.dataAccessExpiresAt===0?Infinity:info.dataAccessExpiresAt*1000);if(expiresAt<=now())throw invalid();
  fresh();write(user,p.version,{...keys(v),accessToken:token.accessToken,subject:identity.id,accountName:identity.name,scopes:[...info.scopes],channels:p.channels,expiresAt},'Account Meta autorizzato');return state(user);
 }
 function finish(user,b){const promise=finishWork(user,b);work.add(promise);promise.then(()=>work.delete(promise),()=>work.delete(promise));return promise;}
 function disconnect(user,b={}){body(b,['version']);const r=current(user,b.version),v=values(r);write(user,b.version,v.mode==='oauth'?keys(v):{mode:'oauth'},'Meta disconnesso nell’OS');pending.clear();return state(user);}
 async function close(){closed=true;pending.clear();await Promise.allSettled([...work]);}
 return {metadata,state,configure,start,finish,disconnect,close};
}
