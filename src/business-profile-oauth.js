import {randomBytes,createHash} from 'node:crypto';
import {AppError,requireOwner} from './store.js';
import {createVault} from './vault.js';
import {createBusinessProfileOAuthHTTP} from './business-profile-oauth-http.js';

export const BUSINESS_PROFILE_SCOPES=Object.freeze(['openid','https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/business.manage']);
const digest=value=>createHash('sha256').update(value).digest('hex');
const secret=value=>typeof value==='string'&&/^[\x21-\x7e]{1,16000}$/.test(value);
function body(value,allowed){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!allowed.includes(key)))throw new AppError('Richiesta GBP non valida.');}
function email(value){if(typeof value!=='string'||value.length>254||!/^[^\s<>@,;:]+@[^\s<>@,;:]+\.[^\s<>@,;:]+$/.test(value))throw new AppError('Indica l’email Google da autorizzare.');return value.toLowerCase();}
function scopes(value){const granted=typeof value==='string'?value.split(/\s+/):[];return BUSINESS_PROFILE_SCOPES.every(scope=>granted.includes(scope)||(scope.endsWith('/userinfo.email')&&granted.includes('email')));}
function tokenResult(value,{refresh=false}={}){if(!secret(value.access_token)||typeof value.token_type!=='string'||value.token_type.toLowerCase()!=='bearer'||!Number.isSafeInteger(value.expires_in)||value.expires_in<1||value.expires_in>86400||(!refresh&&!secret(value.refresh_token))||(value.refresh_token!==undefined&&!secret(value.refresh_token))||((!refresh||value.scope!==undefined)&&!scopes(value.scope)))throw new AppError('Google non ha concesso tutti i permessi o un’autorizzazione valida. Ripeti il collegamento.',409);return value;}

export function createBusinessProfileOAuth({store:s,connections,env={},origin,enabled=false,clock=()=>new Date(),providerOptions={}}){
 const vault=createVault(env),http=createBusinessProfileOAuthHTTP(providerOptions),inflight=new Map(),now=()=>clock().getTime(),time=()=>clock().toISOString();
 const available=()=>typeof enabled==='function'?enabled()===true:enabled===true;
 s.db.exec(`CREATE TABLE IF NOT EXISTS os_gbp_oauth_states(hash TEXT PRIMARY KEY,session_id TEXT NOT NULL,user_id TEXT NOT NULL,connection_version INTEGER NOT NULL,authorization_version INTEGER NOT NULL,expected_email TEXT NOT NULL,verifier TEXT NOT NULL,expires INTEGER NOT NULL,consumed INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS os_gbp_authorization(id INTEGER PRIMARY KEY CHECK(id=1),version INTEGER NOT NULL DEFAULT 0,connection_version INTEGER NOT NULL DEFAULT 0,pending_hash TEXT,email TEXT,subject TEXT,sealed TEXT,authorized_by TEXT,checked_at TEXT,status TEXT NOT NULL DEFAULT 'disconnected');
 INSERT OR IGNORE INTO os_gbp_authorization(id) VALUES(1);`);
 const authorization=()=>s.one('SELECT * FROM os_gbp_authorization WHERE id=1');
 const connection=()=>s.one("SELECT version FROM os_connections WHERE id='gbp'");
 const human=id=>!!s.one("SELECT id FROM os_users WHERE id=? AND active=1 AND role='owner' AND must_change_password=0 AND id<>'os-orchestrator'",id||'');
 function owner(user,session=false){requireOwner(user);if(!human(user.id))throw new AppError('Socio non più autorizzato.',403);if(session&&(!user.session_id||!s.one('SELECT id FROM os_sessions WHERE id=? AND user_id=? AND expires_at>?',user.session_id,user.id,now())))throw new AppError('Riapri il collegamento dalla tua sessione BigAnt OS.',403);}
 function metadata(){const row=authorization(),keys=connection(),connected=available()&&vault.ready&&row.status==='connected'&&!!row.sealed&&row.connection_version===keys?.version&&human(row.authorized_by);return {available:available(),configured:!!keys,connected,version:row.version,connectionVersion:keys?.version||0,email:row.email||null,lastCheck:row.checked_at||null,authorizedBy:row.authorized_by||null};}
 connections.setBusinessProfileMetadata(metadata);
 function state(user){owner(user);return metadata();}
 function permitted(user,{session=false,connectionVersion}={}){
  owner(user,session);if(!available())throw new AppError('Google Business Profile non abilitato sul server.',409);if(!vault.ready)throw new AppError('Archivio protetto da configurare.',409);
  let url;try{url=new URL(origin);}catch{throw new AppError('Origine HTTPS non valida.',409);}if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new AppError('Origine HTTPS non valida.',409);
  const keys=connection();if(!keys||(connectionVersion!==undefined&&keys.version!==connectionVersion))throw new AppError('Accessi GBP cambiati o da configurare.',409);return keys;
 }
 function credentials(user,version){const value=connections.readForRuntime(user,'gbp',version);if(!secret(value.clientId)||!secret(value.clientSecret))throw new AppError('Accessi GBP incompleti.',409);return value;}
 function start(user,b={}){
  body(b,['version','email','acknowledged']);
  if(!Number.isSafeInteger(b.version)||b.version<1)throw new AppError('Ricarica la configurazione GBP.',409);
  const keys=permitted(user,{session:true,connectionVersion:b.version}),expected=email(b.email);if(b.acknowledged!==true)throw new AppError('Conferma l’account e i permessi richiesti.');
  const values=credentials(user,keys.version),nonce=randomBytes(32).toString('base64url'),hash=digest(nonce),verifier=randomBytes(48).toString('base64url'),challenge=createHash('sha256').update(verifier).digest('base64url');
  s.transaction(()=>{permitted(user,{session:true,connectionVersion:keys.version});const version=authorization().version+1;s.run('DELETE FROM os_gbp_oauth_states WHERE expires<=?',now());s.run("UPDATE os_gbp_oauth_states SET consumed=1,verifier='' WHERE consumed=0");s.run('INSERT INTO os_gbp_oauth_states(hash,session_id,user_id,connection_version,authorization_version,expected_email,verifier,expires) VALUES(?,?,?,?,?,?,?,?)',hash,user.session_id,user.id,keys.version,version,expected,vault.seal({verifier},'gbp-oauth:'+hash),now()+600000);s.run("UPDATE os_gbp_authorization SET version=?,connection_version=?,pending_hash=?,email=NULL,subject=NULL,sealed=NULL,authorized_by=NULL,checked_at=NULL,status='pending' WHERE id=1",version,keys.version,hash);s.audit(user,null,'Autorizzazione GBP avviata','gbp',{version},'admin');});
  const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');url.search=new URLSearchParams({client_id:values.clientId,redirect_uri:new URL('/auth/google-business/callback',origin).href,response_type:'code',scope:BUSINESS_PROFILE_SCOPES.join(' '),access_type:'offline',include_granted_scopes:'false',prompt:'consent select_account',login_hint:expected,state:nonce,code_challenge:challenge,code_challenge_method:'S256'});return {url:url.href};
 }
 async function finish(user,b={}){
  permitted(user,{session:true});body(b,['state','code','error']);if(typeof b.state!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(b.state))throw new AppError('Richiesta GBP non valida.',409);
  const hash=digest(b.state),row=s.one('SELECT * FROM os_gbp_oauth_states WHERE hash=? AND session_id=? AND user_id=? AND consumed=0 AND expires>?',hash,user.session_id,user.id,now());if(!row)throw new AppError('Autorizzazione scaduta o già utilizzata. Ripeti il collegamento.',409);
  const fresh=()=>{permitted(user,{session:true,connectionVersion:row.connection_version});const current=authorization();if(row.user_id!==user.id||row.session_id!==user.session_id||row.expires<=now()||current.version!==row.authorization_version||current.pending_hash!==hash||current.status!=='pending')throw new AppError('Autorizzazione GBP cambiata o scaduta. Ripeti il collegamento.',409);};fresh();
  if(!s.run('UPDATE os_gbp_oauth_states SET consumed=1 WHERE hash=? AND consumed=0',hash).changes)throw new AppError('Richiesta già utilizzata.',409);
  try{
   if(b.error)throw new AppError('Autorizzazione Google Business Profile non concessa.',409);
   if(typeof b.code!=='string'||!b.code||b.code.length>4096||/[\x00-\x20\x7f]/.test(b.code))throw new AppError('Codice GBP non valido. Ripeti il collegamento.',409);
   const {verifier}=vault.open(row.verifier,'gbp-oauth:'+hash),keys=credentials(user,row.connection_version);
   const tokens=tokenResult(await http.token({client_id:keys.clientId,client_secret:keys.clientSecret,grant_type:'authorization_code',code:b.code,code_verifier:verifier,redirect_uri:new URL('/auth/google-business/callback',origin).href},fresh));fresh();
   const identity=await http.identity(tokens.access_token,fresh);fresh();
   if(identity.email_verified!==true||typeof identity.sub!=='string'||!/^[A-Za-z0-9_-]{1,255}$/.test(identity.sub)||email(identity.email)!==row.expected_email)throw new AppError('L’identità Google non corrisponde all’email verificata richiesta.',409);
   s.transaction(()=>{fresh();s.run("UPDATE os_gbp_authorization SET pending_hash=NULL,email=?,subject=?,sealed=?,authorized_by=?,checked_at=?,status='connected' WHERE id=1",row.expected_email,identity.sub,vault.seal({refreshToken:tokens.refresh_token},'gbp-authorization:'+row.authorization_version),user.id,time());s.audit(user,null,'Account Google Business Profile autorizzato','gbp',{version:row.authorization_version,connectionVersion:row.connection_version},'admin');});return state(user);
  }catch(error){s.run("UPDATE os_gbp_authorization SET status='error',pending_hash=NULL,sealed=NULL WHERE id=1 AND version=? AND pending_hash=? AND status='pending'",row.authorization_version,hash);throw error;}
  finally{s.run("UPDATE os_gbp_oauth_states SET verifier='' WHERE hash=?",hash);}
 }
 function usable(user,version){const row=authorization();permitted(user,{connectionVersion:row.connection_version});if(!Number.isSafeInteger(version)||version!==row.version||!metadata().connected)throw new AppError('Autorizzazione GBP cambiata o da ripetere.',409);return row;}
 async function accessToken(user,version){
  const row=usable(user,version),key=version+':'+row.connection_version;
  if(inflight.has(key)){const token=await inflight.get(key);usable(user,version);return token;}
  const work=(async()=>{const fresh=()=>{const current=usable(user,version);if(current.connection_version!==row.connection_version||current.authorized_by!==row.authorized_by)throw new AppError('Autorizzazione GBP cambiata.',409);};
   try{const keys=credentials(user,row.connection_version),stored=vault.open(row.sealed,'gbp-authorization:'+version);if(!secret(stored.refreshToken))throw new AppError('Autorizzazione GBP da ripetere.',409);
    const tokens=tokenResult(await http.token({client_id:keys.clientId,client_secret:keys.clientSecret,grant_type:'refresh_token',refresh_token:stored.refreshToken},fresh),{refresh:true});fresh();
    if(tokens.refresh_token)s.transaction(()=>{fresh();s.run('UPDATE os_gbp_authorization SET sealed=? WHERE id=1 AND version=?',vault.seal({refreshToken:tokens.refresh_token},'gbp-authorization:'+version),version);});return tokens.access_token;
   }catch(error){if(error.invalidGrant)s.transaction(()=>{const current=authorization();if(current.version===version&&current.status==='connected'){s.run("UPDATE os_gbp_authorization SET version=version+1,sealed=NULL,status='error' WHERE id=1");s.audit(null,null,'Autorizzazione GBP da ripetere','gbp',{version:version+1},'admin');}});throw error;}
  })();inflight.set(key,work);try{const token=await work;usable(user,version);return token;}finally{if(inflight.get(key)===work)inflight.delete(key);}
 }
 function disconnect(user,b={}){owner(user,true);body(b,['version']);if(!Number.isSafeInteger(b.version)||b.version!==authorization().version)throw new AppError('Autorizzazione GBP cambiata. Ricarica la pagina.',409);s.transaction(()=>{owner(user,true);s.run("UPDATE os_gbp_authorization SET version=version+1,pending_hash=NULL,email=NULL,subject=NULL,sealed=NULL,authorized_by=NULL,checked_at=NULL,status='disconnected' WHERE id=1");s.run("UPDATE os_gbp_oauth_states SET consumed=1,verifier='' WHERE consumed=0");s.audit(user,null,'Google Business Profile disconnesso nell’OS','gbp',{version:b.version+1},'admin');});return state(user);}
 return {state,metadata,start,finish,accessToken,disconnect};
}
