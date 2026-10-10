// Fixed Google Wallet/OAuth endpoints; transport injected only by local tests.
import {createPrivateKey,createPublicKey,createHash,sign} from 'node:crypto';
import {AppError} from './store.js';
import {buildGooglePayloads} from './fidelity-wallet.js';
const TOKEN='https://oauth2.googleapis.com/token';
const API='https://walletobjects.googleapis.com/walletobjects/v1/';
const SCOPE='https://www.googleapis.com/auth/wallet_object.issuer';
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const configError=()=>new AppError('Configurazione Google Wallet incompleta o non valida. Verifica le variabili protette del server.',409);
export function googleWalletConfig(env,origin){
 try{
  const base=new URL(origin),issuer=env.GOOGLE_ISSUER_ID,account=JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON||'null');
  if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash||!/^\d{1,30}$/.test(issuer||'')||account?.type!=='service_account'||!/^[-.\w]+@[-.\w]+\.gserviceaccount\.com$/.test(account.client_email||'')||typeof account.private_key!=='string'||account.private_key.length>20000||typeof account.private_key_id!=='string'||!/^[\w-]{1,200}$/.test(account.private_key_id))throw Error();
  const key=createPrivateKey(account.private_key);if(key.asymmetricKeyType!=='rsa'||key.asymmetricKeyDetails.modulusLength<2048)throw Error();
  const publicKey=createPublicKey(key).export({type:'spki',format:'der'}).toString('base64');
  const fingerprint=createHash('sha256').update(JSON.stringify({issuer,email:account.client_email,kid:account.private_key_id,publicKey,origin:base.origin})).digest('hex');
  return {issuer,email:account.client_email,kid:account.private_key_id,key,origin:base.origin,fingerprint};
 }catch{throw configError();}
}
function jwt(config,claims){const data=encode({alg:'RS256',typ:'JWT',kid:config.kid})+'.'+encode(claims);return data+'.'+sign('RSA-SHA256',Buffer.from(data),config.key).toString('base64url');}
export function googleSaveJwt(config,id,kind,clock=()=>new Date()){
 if(!['loyalty','offer'].includes(kind)||!id.startsWith(config.issuer+'.')||!/^[\w.-]+$/.test(id))throw configError();
 const iat=Math.floor(clock().getTime()/1000);return jwt(config,{iss:config.email,aud:'google',typ:'savetowallet',iat,origins:[config.origin],payload:{[kind+'Objects']:[{id}]}});
}
export function createGoogleWalletProvider({config,allow=()=>false,fetchImpl=globalThis.fetch,clock=()=>new Date()}){
 let cachedToken=null;
 async function gate(operation){if(await allow(operation)!==true)throw new AppError('Operazione Google Wallet non autorizzata.',409);}
 async function json(url,options){
  let response;try{response=await fetchImpl(url,{...options,redirect:'error',signal:AbortSignal.timeout(12000)});}catch{throw Object.assign(new AppError('Google Wallet non raggiungibile: esito da verificare.',503),{retryable:true});}
  if(!response.ok){try{await response.body?.cancel();}catch{}const status=response.status;throw Object.assign(new AppError([401,403].includes(status)?'Accesso Google Wallet rifiutato. Verifica account, issuer e autorizzazioni.':status===429?'Limite Google Wallet raggiunto. Aggiornamento rinviato.':`Google Wallet ha rifiutato la richiesta (${status}).`,status===429||status>=500?503:502),{providerStatus:status,retryable:status===429||status>=500});}
  try{let size=0;const chunks=[];for await(const chunk of response.body){size+=chunk.length;if(size>1_000_000)throw Error();chunks.push(chunk);}const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}catch{throw Object.assign(new AppError('Risposta Google Wallet incompleta o non leggibile.',502),{retryable:true});}
 }
 async function access(operation){
  await gate(operation);if(cachedToken&&cachedToken.expires>clock().getTime()+60000)return cachedToken.value;
  const iat=Math.floor(clock().getTime()/1000),assertion=jwt(config,{iss:config.email,scope:SCOPE,aud:TOKEN,iat,exp:iat+3600});
  const token=await json(TOKEN,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
  if(typeof token.access_token!=='string'||!token.access_token||token.access_token.length>16000||token.token_type?.toLowerCase()!=='bearer'||!Number.isFinite(token.expires_in)||token.expires_in<1||token.expires_in>3600)throw new AppError('Risposta di autorizzazione Google non valida.',502);
  await gate(operation);cachedToken={value:token.access_token,expires:clock().getTime()+token.expires_in*1000};return cachedToken.value;
 }
 async function request(operation,method,path,body){const token=await access(operation);await gate(operation);const result=await json(API+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});await gate(operation);return result;}
 async function upsert(operation,resource,body){
  const path=resource+'/'+encodeURIComponent(body.id);let existing;
  try{existing=await request(operation,'GET',path);}catch(error){if(error.providerStatus!==404)throw error;
   try{const created=await request(operation,'POST',resource,body);if(created.id!==body.id)throw new AppError('Google Wallet non ha confermato la risorsa richiesta.',502);return created;}catch(insertError){if(insertError.providerStatus!==409)throw insertError;}
  }
  if(existing&&existing.id!==body.id)throw new AppError('Risorsa Google Wallet non coerente.',502);
  const patch={...body};if(resource.endsWith('Class')){delete patch.reviewStatus;if(!body.merchantLocations)patch.merchantLocations=[];}else if(!body.validTimeInterval)patch.validTimeInterval=null;
  const updated=await request(operation,'PATCH',path,patch);if(updated.id!==body.id)throw new AppError('Google Wallet non ha confermato l’aggiornamento.',502);return updated;
 }
 async function issue(member,program,{operation='issue'}={}){
  await gate(operation);const payload=buildGooglePayloads(member,program,config.issuer,config.origin);
  await upsert(operation,payload.kind+'Class',payload.classPayload);await upsert(operation,payload.kind+'Object',payload.objectPayload);
  await gate(operation);return {objectId:payload.objectPayload.id,classId:payload.classPayload.id,kind:payload.kind,url:'https://pay.google.com/gp/v/save/'+googleSaveJwt(config,payload.objectPayload.id,payload.kind,clock)};
 }
 async function revoke(id,kind){
  if(!['loyalty','offer'].includes(kind)||!id.startsWith(config.issuer+'.')||!/^[\w.-]+$/.test(id))throw configError();
  const patch={state:'INACTIVE',barcode:null,linksModuleData:null,textModulesData:[],...(kind==='loyalty'?{accountName:'',accountId:'',loyaltyPoints:{balance:{int:0}},secondaryLoyaltyPoints:{balance:{int:0}}}:{})};
  try{const result=await request('revoke','PATCH',kind+'Object/'+encodeURIComponent(id),patch);if(result.id!==id||result.state!=='INACTIVE')throw new AppError('Revoca Google Wallet non confermata.',502);}catch(error){if(error.providerStatus!==404)throw error;}
 }
 return {issue,revoke};
}
