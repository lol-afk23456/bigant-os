import {AppError} from './store.js';

// Official Facebook Login manual flow / long-lived tokens, updated 2026-06-30.
// Meta documents GET token exchanges and GET debug_token. Their secret-bearing
// URLs stay inside this server transport: never return, log or copy them into
// errors. Only the public authorization dialog URL is returned to the browser.
const GRAPH='https://graph.facebook.com/v26.0/';
const DIALOG='https://www.facebook.com/v26.0/dialog/oauth';
const READ_SCOPES=Object.freeze(['public_profile','pages_show_list','pages_read_engagement','read_insights','instagram_basic','instagram_manage_insights']);
const denied=()=>new AppError('Autorizzazione Meta non disponibile.',409);
const invalid=()=>new AppError('Richiesta di autorizzazione Meta non valida.',400);
const malformed=()=>new AppError('Risposta di autorizzazione Meta non valida.',502);
const failed=()=>new AppError('Autorizzazione Meta non riuscita.',502);
const object=value=>{if(!value||typeof value!=='object'||Array.isArray(value))throw malformed();return value;};
const secret=(value,max=16000)=>typeof value==='string'&&value.length>0&&value.length<=max&&/^[\x21-\x7e]+$/.test(value);
const numericId=(value,error=malformed)=>{if(typeof value!=='string'||!/^\d{1,64}$/.test(value))throw error();return value;};
const text=(value,max=500)=>{if(typeof value!=='string'||value.length>max||/[\p{Cc}\p{Cf}]/u.test(value))throw malformed();return value;};
const timestamp=value=>{if(!Number.isSafeInteger(value)||value<0||value>8640000000000)throw malformed();return value;};
function list(value,max){if(!Array.isArray(value)||value.length>max)throw malformed();return value;}
function grantedScopes(value){const seen=new Set();return list(value,200).map(raw=>{const scope=text(raw,100);if(!/^[a-z][a-z0-9_]*$/.test(scope)||seen.has(scope))throw malformed();seen.add(scope);return scope;});}
function requestedScopes(value){
 if(!Array.isArray(value)||!value.length||value.length>READ_SCOPES.length||new Set(value).size!==value.length||value.some(scope=>!READ_SCOPES.includes(scope)))throw invalid();return value.join(',');
}
function redirect(value){
 if(typeof value!=='string'||value.length>2048||/[\s\p{Cc}\p{Cf}\\]/u.test(value))throw invalid();
 let parsed;try{parsed=new URL(value);}catch{throw invalid();}
 if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.port||parsed.search||parsed.hash||parsed.pathname!=='/auth/meta/callback'||!parsed.hostname||parsed.href!==value)throw invalid();
 return parsed.href;
}
function tokenResult(value){
 const src=object(value);
 if(!secret(src.access_token)||typeof src.token_type!=='string'||src.token_type.toLowerCase()!=='bearer'||!Number.isSafeInteger(src.expires_in)||src.expires_in<=0||src.expires_in>8640000000000)throw malformed();
 return {accessToken:src.access_token,expiresIn:src.expires_in,tokenType:'bearer'};
}
function inspection(value,expectedAppId){
 const src=object(value.data);if(typeof src.is_valid!=='boolean')throw malformed();
 // Invalid tokens need not include identity or expiry. Do not invent either.
 if(!src.is_valid)return {isValid:false};
 const appId=numericId(Number.isSafeInteger(src.app_id)&&src.app_id>0?String(src.app_id):src.app_id),type=text(src.type,32);
 if(appId!==expectedAppId||!/^[A-Z][A-Z_]*$/.test(type))throw denied();
 const out={appId,type,isValid:true,scopes:grantedScopes(src.scopes),expiresAt:timestamp(src.expires_at),dataAccessExpiresAt:timestamp(src.data_access_expires_at)};
 if(src.user_id!==undefined)out.userId=numericId(src.user_id);
 if(type==='USER'&&!out.userId)throw malformed();
 if(src.granular_scopes!==undefined){
  const seen=new Set();out.granularScopes=list(src.granular_scopes,200).map(raw=>{
   const item=object(raw),scope=grantedScopes([item.scope])[0];if(seen.has(scope)||!out.scopes.includes(scope))throw malformed();seen.add(scope);const normalized={scope};
   if(item.target_ids!==undefined){const ids=new Set();normalized.targetIds=list(item.target_ids,1000).map(value=>{const id=numericId(value);if(ids.has(id))throw malformed();ids.add(id);return id;});}
   return normalized;
  });
 }
 return out;
}

export function createMetaOAuthHttp({appId,appSecret,redirectUri,allow=()=>false,fetchImpl=globalThis.fetch}={}){
 function config(){numericId(appId,invalid);if(!secret(appSecret,4096)||appSecret.includes('|'))throw invalid();return redirect(redirectUri);}
 function syncGate(){
  let result;try{result=allow();}catch{throw denied();}
  // authorizationUrl is synchronous. An asynchronous guard cannot grant it.
  if(result&&typeof result.then==='function')Promise.resolve(result).catch(()=>{});
  if(result!==true)throw denied();
 }
 async function gate(){let result;try{result=await allow();}catch{throw denied();}if(result!==true)throw denied();}
 async function get(path,params,normalize,bearer){
  await gate();config();const request=new URL(GRAPH+path);request.search=new URLSearchParams(params);
  const headers={Accept:'application/json'};if(bearer!==undefined)headers.Authorization='Bearer '+bearer;
  let response;
  try{response=await fetchImpl(request,{method:'GET',headers,redirect:'error',signal:AbortSignal.timeout(25000)});}
  catch{await gate();throw failed();}
  try{
   await gate();if(!response?.ok||response.redirected)throw failed();
   const length=response.headers?.get('content-length');if(length!==null&&length!==undefined&&(!/^\d+$/.test(length)||Number(length)>65536))throw malformed();
   if(!response.body)throw malformed();let size=0;const chunks=[];
   for await(const chunk of response.body){await gate();if(!(chunk instanceof Uint8Array))throw malformed();size+=chunk.byteLength;if(size>65536)throw malformed();chunks.push(chunk);await gate();}
   await gate();let parsed;try{parsed=object(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{throw malformed();}
   if(Object.hasOwn(parsed,'error'))throw failed();const result=normalize(parsed);await gate();return result;
  }catch(error){
   try{await response?.body?.cancel();}catch{}
   await gate();if(error instanceof AppError)throw error;throw malformed();
  }
 }
 return {
  authorizationUrl({state,scopes}={}){
   syncGate();const callback=config();if(typeof state!=='string'||!/^[A-Za-z0-9_-]{32,256}$/.test(state))throw invalid();
   const url=new URL(DIALOG);url.search=new URLSearchParams({client_id:appId,redirect_uri:callback,response_type:'code',state,scope:requestedScopes(scopes)});syncGate();return url.href;
  },
  async exchangeCode({code}={}){
   await gate();const callback=config();if(!secret(code,4096))throw invalid();
   return get('oauth/access_token',{client_id:appId,redirect_uri:callback,client_secret:appSecret,code},tokenResult);
  },
  async extendToken({accessToken}={}){
   await gate();config();if(!secret(accessToken))throw invalid();
   return get('oauth/access_token',{grant_type:'fb_exchange_token',client_id:appId,client_secret:appSecret,fb_exchange_token:accessToken},tokenResult);
  },
  async inspectToken({accessToken}={}){
   await gate();config();if(!secret(accessToken))throw invalid();
   // Both parameters follow Meta's documented GET debug_token example.
   return get('debug_token',{input_token:accessToken,access_token:appId+'|'+appSecret},value=>inspection(value,appId));
  },
  async identity({accessToken}={}){
   await gate();config();if(!secret(accessToken))throw invalid();
   return get('me',{fields:'id,name'},value=>({id:numericId(value.id),name:text(value.name)}),accessToken);
  }
 };
}
