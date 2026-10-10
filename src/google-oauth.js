import {randomBytes,createHash} from 'node:crypto';
import {AppError,requireOwner} from './store.js';
import {createVault} from './vault.js';
import {createGrowthLiveProviders} from './growth-live-providers.js';
export const GMAIL_SCOPES=['https://www.googleapis.com/auth/gmail.send','https://www.googleapis.com/auth/gmail.readonly'];
export const CALENDAR_SCOPES=['https://www.googleapis.com/auth/calendar.events.owned','https://www.googleapis.com/auth/calendar.freebusy'];
const digest=value=>createHash('sha256').update(value).digest('hex');
const address=value=>{if(typeof value!=='string'||value.length>254||!/^[^\s<>@,;:]+@[^\s<>@,;:]+\.[^\s<>@,;:]+$/.test(value))throw new AppError('Indica la casella Google da collegare.');return value.toLowerCase();};
export function createGoogleOAuth({store:s,connections,env={},origin,enabled=false,calendarEnabled=false,clock=()=>new Date(),providerOptions={}}){
 const vault=createVault(env),time=()=>clock().toISOString(),calendarAvailable=()=>enabled&&(typeof calendarEnabled==='function'?calendarEnabled()===true:calendarEnabled===true);
 s.db.exec(`CREATE TABLE IF NOT EXISTS os_google_oauth_states(hash TEXT PRIMARY KEY,session_id TEXT NOT NULL,user_id TEXT NOT NULL,version INTEGER NOT NULL,expected_email TEXT NOT NULL,verifier TEXT NOT NULL,expires INTEGER NOT NULL,consumed INTEGER NOT NULL DEFAULT 0,requested_scopes_json TEXT);
 CREATE TABLE IF NOT EXISTS os_google_authorization(id INTEGER PRIMARY KEY CHECK(id=1),version INTEGER,pending_hash TEXT,email TEXT,scopes_json TEXT NOT NULL DEFAULT '[]',authorized_by TEXT,checked_at TEXT,status TEXT NOT NULL DEFAULT 'disconnected');
 INSERT OR IGNORE INTO os_google_authorization(id) VALUES(1);`);
 if(!s.query('PRAGMA table_info(os_google_oauth_states)').some(column=>column.name==='requested_scopes_json'))s.db.exec('ALTER TABLE os_google_oauth_states ADD COLUMN requested_scopes_json TEXT');
 function requestedScopes(row){
  if(row.requested_scopes_json===null||row.requested_scopes_json===undefined)return [...GMAIL_SCOPES];
  let scopes;try{scopes=JSON.parse(row.requested_scopes_json);}catch{throw new AppError('Permessi Google della richiesta non validi. Ripeti il collegamento.',409);}
  const calendar=Array.isArray(scopes)&&CALENDAR_SCOPES.some(scope=>scopes.includes(scope)),expected=calendar?[...GMAIL_SCOPES,...CALENDAR_SCOPES]:GMAIL_SCOPES;
  if(!Array.isArray(scopes)||scopes.length!==expected.length||new Set(scopes).size!==expected.length||!expected.every(scope=>scopes.includes(scope)))throw new AppError('Permessi Google della richiesta non validi. Ripeti il collegamento.',409);
  return [...expected];
 }
 function owner(user,session=false){requireOwner(user);const live=s.one("SELECT * FROM os_users WHERE id=? AND role='owner' AND active=1 AND must_change_password=0",user.id);if(!live)throw new AppError('Socio non più autorizzato.',403);if(session&&(!user.session_id||!s.one('SELECT id FROM os_sessions WHERE id=? AND user_id=? AND expires_at>?',user.session_id,user.id,clock().getTime())))throw new AppError('Riapri il collegamento dalla tua sessione BigAnt OS.',403);return live;}
 function metadata(version){const row=s.one('SELECT * FROM os_google_authorization WHERE id=1'),scopes=JSON.parse(row.scopes_json),connected=enabled&&row.status==='connected'&&row.version===version&&!!s.one("SELECT id FROM os_users WHERE id=? AND active=1 AND role='owner'",row.authorized_by);return {available:enabled,connected,calendarAvailable:calendarAvailable(),calendarConnected:connected&&calendarAvailable()&&Array.isArray(scopes)&&CALENDAR_SCOPES.every(scope=>scopes.includes(scope)),email:row.email||null,lastCheck:row.checked_at,scopes,note:!enabled?'Autorizzazione Google disabilitata sul server.':'L’autorizzazione della casella non attiva gli invii Growth.'};}
 connections.setGoogleMetadata(metadata);
 function state(user){owner(user);const meta=connections.runtimeMetadata('google');return {...metadata(meta.version),configured:meta.configured,version:meta.version};}

 function permitted(user,{session=false,version}={}){owner(user,session);if(!enabled)throw new AppError('Autorizzazione Google non abilitata sul server.',409);if(!vault.ready)throw new AppError('Archivio protetto da configurare.',409);const url=new URL(origin);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new AppError('Origine HTTPS non valida.',409);const meta=connections.runtimeMetadata('google');if(!meta.configured||version!==undefined&&meta.version!==version)throw new AppError('Accessi Google cambiati o da configurare.',409);return meta;}
 function start(user,b){
  if(!Number.isSafeInteger(b.version)||b.version<1)throw new AppError('Ricarica la configurazione Google.',409);
  const meta=permitted(user,{session:true,version:b.version}),email=address(b.email);if(b.acknowledged!==true)throw new AppError('Conferma la casella e i permessi richiesti.');
  if(b.calendar===true&&!calendarAvailable())throw new AppError('Autorizzazione Calendar non abilitata sul server.',409);
  const scopes=b.calendar===true?[...GMAIL_SCOPES,...CALENDAR_SCOPES]:[...GMAIL_SCOPES];
  const values=connections.readForRuntime(user,'google',meta.version);if(!values.clientId||!values.clientSecret)throw new AppError('Accessi Google incompleti.',409);
  const nonce=randomBytes(32).toString('base64url'),hash=digest(nonce),verifier=randomBytes(48).toString('base64url'),challenge=createHash('sha256').update(verifier).digest('base64url');
  s.transaction(()=>{s.run('DELETE FROM os_google_oauth_states WHERE expires<?',clock().getTime());s.run('INSERT INTO os_google_oauth_states(hash,session_id,user_id,version,expected_email,verifier,expires,requested_scopes_json) VALUES(?,?,?,?,?,?,?,?)',hash,user.session_id,user.id,meta.version,email,vault.seal({verifier},'google-oauth:'+hash),clock().getTime()+600000,JSON.stringify(scopes));s.run("UPDATE os_google_authorization SET pending_hash=?,status='pending' WHERE id=1",hash);});
  const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');url.search=new URLSearchParams({client_id:values.clientId,redirect_uri:new URL('/auth/google/callback',origin).href,response_type:'code',scope:scopes.join(' '),access_type:'offline',include_granted_scopes:'false',prompt:'consent select_account',login_hint:email,state:nonce,code_challenge:challenge,code_challenge_method:'S256'});
  s.audit(user,null,'Autorizzazione Google avviata','google',{},'admin');return {url:url.href};
 }
 async function finish(user,b){
  permitted(user,{session:true});if(typeof b.state!=='string'||b.state.length>200)throw new AppError('Richiesta Google non valida.',409);
  const hash=digest(b.state),row=s.one('SELECT * FROM os_google_oauth_states WHERE hash=? AND session_id=? AND user_id=? AND consumed=0 AND expires>?',hash,user.session_id,user.id,clock().getTime());
  if(!row)throw new AppError('Autorizzazione scaduta o già utilizzata. Ripeti il collegamento.',409);
  const requested=requestedScopes(row),calendar=requested.some(scope=>CALENDAR_SCOPES.includes(scope));
  const fresh=()=>{permitted(user,{session:true,version:row.version});if(calendar&&!calendarAvailable())throw new AppError('Autorizzazione Calendar non abilitata sul server.',409);if(user.id!==row.user_id||user.session_id!==row.session_id)throw new AppError('Riapri il collegamento dalla tua sessione BigAnt OS.',403);if(row.expires<=clock().getTime())throw new AppError('Autorizzazione scaduta. Ripeti il collegamento.',409);const authorization=s.one('SELECT pending_hash,status FROM os_google_authorization WHERE id=1');if(authorization.pending_hash!==hash)throw new AppError('È stato avviato un nuovo collegamento Google.',409);if(authorization.status!=='pending')throw new AppError('Autorizzazione Google revocata. Ripeti il collegamento.',409);};fresh();
  if(!s.run('UPDATE os_google_oauth_states SET consumed=1 WHERE hash=? AND consumed=0',hash).changes)throw new AppError('Richiesta già utilizzata.',409);
  try{
   if(b.error)throw new AppError('Autorizzazione Google non concessa. Nessun invio attivato.',409);
   const {verifier}=vault.open(row.verifier,'google-oauth:'+hash);
   const provider=createGrowthLiveProviders({...providerOptions,origin,credentials:()=>{fresh();return connections.readForRuntime(user,'google',row.version);},allow:(_w,operation)=>{fresh();return ['google-oauth','google-profile'].includes(operation);}});
   const tokens=await provider.exchange('oauth',b.code,{codeVerifier:verifier});fresh();const granted=typeof tokens.scope==='string'?tokens.scope.split(/\s+/):[];
   if(!requested.every(scope=>granted.includes(scope))||typeof tokens.refresh_token!=='string'||!tokens.refresh_token||tokens.refresh_token.length>16000||tokens.token_type?.toLowerCase()!=='bearer')throw new AppError('Google non ha concesso tutti i permessi o l’accesso continuativo. Ripeti il collegamento.',409);
   // A broader provider response never expands the permission selected in BigAnt OS.
   const scopes=requested;
   const profile=await provider.authorizedProfile('oauth',tokens.access_token);fresh();const actual=address(profile.emailAddress);if(actual!==row.expected_email)throw new AppError('La casella autorizzata è diversa da quella scelta. Ripeti il collegamento.',409);
   s.transaction(()=>{fresh();const version=connections.completeGoogle(user,row.version,{refreshToken:tokens.refresh_token,scopes,email:actual});s.run("UPDATE os_google_authorization SET version=?,pending_hash=NULL,email=?,scopes_json=?,authorized_by=?,checked_at=?,status='connected' WHERE id=1",version,actual,JSON.stringify(scopes),user.id,time());});return state(user);
  }finally{s.run("UPDATE os_google_oauth_states SET verifier='' WHERE hash=?",hash);}
 }
 function credentials(user,version,{calendar=false}={}){permitted(user,{version});const info=state(user);if(!info.connected)throw new AppError('Casella Google da autorizzare nuovamente.',409);if(calendar&&!info.calendarConnected)throw new AppError('Calendar da autorizzare esplicitamente prima dell’uso.',409);return connections.readForRuntime(user,'google',version);}
 function invalidate(){s.run("UPDATE os_google_authorization SET status='error' WHERE id=1");}
 return {state,start,finish,credentials,invalidate};
}
