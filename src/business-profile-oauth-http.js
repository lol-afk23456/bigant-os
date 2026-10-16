import {AppError} from './store.js';

// Fixed Google endpoints from the OpenID discovery document. Transport injection
// is reserved for offline tests; callers cannot supply endpoints or redirects.
export function createBusinessProfileOAuthHTTP({fetchImpl=globalThis.fetch,timeoutMs=25000}={}){
 async function request(url,options,guard){
  guard();let response;
  try{response=await fetchImpl(url,{...options,redirect:'error',signal:AbortSignal.timeout(Math.min(Math.max(timeoutMs,1),25000))});}catch{guard();throw new AppError('Google Business Profile non raggiungibile. Riprova il collegamento.',502);}
  guard();let result;
  try{let size=0;const chunks=[];for await(const chunk of response.body){guard();size+=chunk.length;if(size>65536)throw Error();chunks.push(chunk);}result=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!result||typeof result!=='object'||Array.isArray(result))throw Error();}
  catch{guard();throw new AppError('Risposta Google Business Profile non valida.',502);}
  guard();
  if(!response.ok){const error=new AppError('Google Business Profile non ha accettato l’autorizzazione. Ripeti il collegamento.',502);if(result.error==='invalid_grant')error.invalidGrant=true;throw error;}
  return result;
 }
 return {
  token:(body,guard)=>request('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)},guard),
  identity:(token,guard)=>request('https://openidconnect.googleapis.com/v1/userinfo',{method:'GET',headers:{Authorization:'Bearer '+token}},guard)
 };
}
