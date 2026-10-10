import test from 'node:test';
import assert from 'node:assert/strict';
import {createMetaOAuthHttp} from '../src/meta-oauth-http.js';

const appId='123456789',appSecret='app-secret-fixture',redirectUri='https://bigant.example/auth/meta/callback';
const config={appId,appSecret,redirectUri,allow:()=>true};
const scopes=['public_profile','pages_show_list','pages_read_engagement','read_insights','instagram_basic','instagram_manage_insights'];
const state='state_fixture_'.padEnd(43,'x');
const token={access_token:'token-fixture',token_type:'bearer',expires_in:5183944};
const debug={data:{app_id:appId,type:'USER',user_id:'987654',is_valid:true,scopes,expires_at:1900000000,data_access_expires_at:1900100000,granular_scopes:[{scope:'pages_show_list',target_ids:['123','456']}]}};
const json=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
function fixture(payloads,options={}){
 const calls=[],queue=[...payloads],http=createMetaOAuthHttp({...config,...options,fetchImpl:async(url,init)=>{
  calls.push({url:new URL(url),init});assert.ok(queue.length,'Unexpected request or retry');const response=queue.shift();return typeof response==='function'?response(url,init):response instanceof Response?response:json(response);
 }});return {http,calls};
}
const safeError=e=>e instanceof Error&&!/app-secret-fixture|token-fixture|secret-code-fixture|graph\.facebook\.com|provider-secret/.test(e.stack)&&!Object.hasOwn(e,'cause');

test('OAuth Meta chiuso per default; solo il contratto pubblico concordato',async()=>{
 let calls=0;const http=createMetaOAuthHttp({...config,allow:undefined,fetchImpl:()=>{calls++;}});
 assert.throws(()=>http.authorizationUrl({state,scopes}),e=>e.status===409);
 for(const action of [()=>http.exchangeCode({code:'fixture'}),()=>http.extendToken({accessToken:'fixture'}),()=>http.inspectToken({accessToken:'fixture'}),()=>http.identity({accessToken:'fixture'})])await assert.rejects(action(),e=>e.status===409);
 assert.equal(calls,0);assert.deepEqual(Object.keys(http).sort(),['authorizationUrl','exchangeCode','extendToken','identity','inspectToken']);
});

test('dialog ufficiale v26 con callback esatta, state e soli permessi di lettura',()=>{
 const f=fixture([]),url=new URL(f.http.authorizationUrl({state,scopes}));
 assert.equal(url.origin,'https://www.facebook.com');assert.equal(url.pathname,'/v26.0/dialog/oauth');assert.equal(url.searchParams.get('client_id'),appId);assert.equal(url.searchParams.get('redirect_uri'),redirectUri);assert.equal(url.searchParams.get('state'),state);assert.equal(url.searchParams.get('scope'),scopes.join(','));assert.equal(url.searchParams.get('response_type'),'code');
 assert.deepEqual([...url.searchParams.keys()].sort(),['client_id','redirect_uri','response_type','scope','state']);assert.ok(!url.href.includes(appSecret));assert.equal(f.calls.length,0);
 for(const invalidScopes of [[],['email'],['ads_management'],['pages_manage_posts'],['instagram_content_publish'],[...scopes,'public_profile'],'pages_show_list'])assert.throws(()=>f.http.authorizationUrl({state,scopes:invalidScopes}),e=>e.status===400);
 for(const invalidState of ['', 'short',state+'\n','x'.repeat(257)])assert.throws(()=>f.http.authorizationUrl({state:invalidState,scopes}),e=>e.status===400);
});

test('scambi GET documentati normalizzati, nessun parametro o URL arbitrario',async()=>{
 const f=fixture([{...token,token_type:'BEARER',refresh_token:'not-part-of-contract',other:'private'},token]);
 assert.deepEqual(await f.http.exchangeCode({code:'secret-code-fixture'}),{accessToken:'token-fixture',expiresIn:5183944,tokenType:'bearer'});
 assert.deepEqual(await f.http.extendToken({accessToken:'short-token-fixture'}),{accessToken:'token-fixture',expiresIn:5183944,tokenType:'bearer'});
 assert.deepEqual(Object.fromEntries(f.calls[0].url.searchParams),{client_id:appId,redirect_uri:redirectUri,client_secret:appSecret,code:'secret-code-fixture'});
 assert.deepEqual(Object.fromEntries(f.calls[1].url.searchParams),{grant_type:'fb_exchange_token',client_id:appId,client_secret:appSecret,fb_exchange_token:'short-token-fixture'});
 for(const {url,init} of f.calls){assert.equal(url.origin,'https://graph.facebook.com');assert.equal(url.pathname,'/v26.0/oauth/access_token');assert.equal(init.method,'GET');assert.equal(init.redirect,'error');assert.ok(init.signal instanceof AbortSignal);assert.equal(init.body,undefined);}
});

test('debug token lega app, identità, permessi granulari e scadenze senza campi grezzi',async()=>{
 const f=fixture([{...debug,data:{...debug.data,application:'ignored',metadata:{secret:'provider-secret'}}}]);
 const result=await f.http.inspectToken({accessToken:'token-fixture'});
 assert.deepEqual(result,{appId,type:'USER',userId:'987654',isValid:true,scopes,expiresAt:1900000000,dataAccessExpiresAt:1900100000,granularScopes:[{scope:'pages_show_list',targetIds:['123','456']}]});
 assert.equal(f.calls[0].url.pathname,'/v26.0/debug_token');assert.deepEqual(Object.fromEntries(f.calls[0].url.searchParams),{input_token:'token-fixture',access_token:appId+'|'+appSecret});assert.ok(!JSON.stringify(result).includes('secret'));
 const invalid=fixture([{data:{is_valid:false,error:{message:'provider-secret'}}}]);assert.deepEqual(await invalid.http.inspectToken({accessToken:'token-fixture'}),{isValid:false});
 const otherApp=fixture([{data:{...debug.data,app_id:'999'}}]);await assert.rejects(otherApp.http.inspectToken({accessToken:'token-fixture'}),e=>e.status===409&&safeError(e));
});

test('identità richiede solo id e nome con token Authorization e scarta dati aggiuntivi',async()=>{
 const f=fixture([{id:'987654',name:'Persona inventata',email:'ignored@example.test',access_token:'provider-secret'}]);
 assert.deepEqual(await f.http.identity({accessToken:'token-fixture'}),{id:'987654',name:'Persona inventata'});
 assert.equal(f.calls[0].url.href,'https://graph.facebook.com/v26.0/me?fields=id%2Cname');assert.equal(f.calls[0].init.headers.Authorization,'Bearer token-fixture');assert.equal(f.calls[0].init.method,'GET');assert.equal(f.calls[0].init.redirect,'error');assert.equal(f.calls[0].url.searchParams.get('access_token'),null);
});

test('callback e segreti malformati non raggiungono il trasporto',async()=>{
 for(const callback of ['http://bigant.example/auth/meta/callback','https://u:p@bigant.example/auth/meta/callback','https://bigant.example:8443/auth/meta/callback','https://bigant.example/auth/meta/callback?token=x','https://bigant.example/auth/meta/callback#x','https://bigant.example/other','https://bigant.example/a/../auth/meta/callback','https://bigant.example/auth/meta/callback\n']){
  const f=fixture([],{redirectUri:callback});assert.throws(()=>f.http.authorizationUrl({state,scopes}),e=>e.status===400);await assert.rejects(f.http.exchangeCode({code:'fixture'}),e=>e.status===400);assert.equal(f.calls.length,0);
 }
 for(const options of [{appId:'123/../me'},{appId:123},{appSecret:'bad\nsecret'},{appSecret:'id|secret'}]){const f=fixture([],options);await assert.rejects(f.http.identity({accessToken:'token-fixture'}),e=>e.status===400);assert.equal(f.calls.length,0);}
 const f=fixture([]);for(const value of [null,'','x\ny','x'.repeat(16001)]){
  await assert.rejects(f.http.exchangeCode({code:value}),e=>e.status===400);await assert.rejects(f.http.extendToken({accessToken:value}),e=>e.status===400);await assert.rejects(f.http.inspectToken({accessToken:value}),e=>e.status===400);await assert.rejects(f.http.identity({accessToken:value}),e=>e.status===400);
 }assert.equal(f.calls.length,0);
});

test('guard sync e async richiedono true e rendono generici anche errori di revoca',async()=>{
 for(const allow of [()=>false,()=>undefined,()=>{throw Error('provider-secret');},async()=>false,async()=>{throw Error('provider-secret');}]){
  const f=fixture([],{allow});await assert.rejects(f.http.identity({accessToken:'token-fixture'}),e=>e.status===409&&safeError(e));assert.equal(f.calls.length,0);
 }
 const allowed=fixture([{id:'123',name:'Fixture'}],{allow:async()=>true});assert.equal((await allowed.http.identity({accessToken:'token-fixture'})).id,'123');
 const asyncDialog=fixture([],{allow:async()=>true});assert.throws(()=>asyncDialog.http.authorizationUrl({state,scopes}),e=>e.status===409);
 let checks=0;const revoke=fixture([],{allow:()=>++checks<2});assert.throws(()=>revoke.http.authorizationUrl({state,scopes}),e=>e.status===409);
});

test('revoca durante trasporto o chunk impedisce di restituire token o identità',async()=>{
 let allowed=true,cancelled=false;const f=fixture([()=>{allowed=false;return json(token);} ],{allow:()=>allowed});await assert.rejects(f.http.exchangeCode({code:'secret-code-fixture'}),e=>e.status===409&&safeError(e));assert.equal(f.calls.length,1);
 allowed=true;const response={ok:true,headers:new Headers(),body:{async *[Symbol.asyncIterator](){yield Buffer.from('{"id":"123",');allowed=false;yield Buffer.from('"name":"Fixture"}');},async cancel(){cancelled=true;}}};
 const stream=fixture([()=>response],{allow:()=>allowed});await assert.rejects(stream.http.identity({accessToken:'token-fixture'}),e=>e.status===409&&safeError(e));assert.equal(cancelled,true);
 allowed=true;const tail={ok:true,headers:new Headers(),body:{async *[Symbol.asyncIterator](){yield Buffer.from(JSON.stringify(token));allowed=false;},async cancel(){}}};
 const complete=fixture([()=>tail],{allow:()=>allowed});await assert.rejects(complete.http.extendToken({accessToken:'token-fixture'}),e=>e.status===409&&safeError(e));
});

test('errori rete, redirect e risposte provider non espongono URL o credenziali e non riprovano',async()=>{
 for(const response of [()=>{throw Error('https://graph.facebook.com/?client_secret=app-secret-fixture&code=secret-code-fixture');},()=>{throw new DOMException('provider-secret','TimeoutError');},new Response('provider-secret',{status:403}),new Response('provider-secret',{status:302,headers:{Location:'https://evil.invalid'}}),()=>({ok:true,redirected:true,body:{cancel:async()=>{}}}),json({error:{message:'provider-secret',access_token:'token-fixture'}}),new Response('provider-secret'),json([])]){
  const f=fixture([response]);await assert.rejects(f.http.exchangeCode({code:'secret-code-fixture'}),e=>e.status===502&&safeError(e));assert.equal(f.calls.length,1);
 }
});

test('cap 64 KB effettivo su header e flusso anche senza Content-Length',async()=>{
 for(const response of [new Response('{}',{headers:{'content-length':'65537'}}),new Response('{}',{headers:{'content-length':'invalid'}}),json({...token,padding:'x'.repeat(65536)})]){
  const f=fixture([response]);await assert.rejects(f.http.extendToken({accessToken:'token-fixture'}),e=>e.status===502&&safeError(e));assert.equal(f.calls.length,1);
 }
 const exact={...token,padding:''};exact.padding='x'.repeat(65536-Buffer.byteLength(JSON.stringify(exact)));assert.equal(Buffer.byteLength(JSON.stringify(exact)),65536);
 const f=fixture([exact]);assert.equal((await f.http.extendToken({accessToken:'token-fixture'})).expiresIn,5183944);
});

test('validazione stretta di token, scadenze, identità e permessi senza zeri inventati',async()=>{
 for(const result of [{...token,access_token:''},{...token,token_type:'mac'},{...token,expires_in:0},{...token,expires_in:'60'},{...token,expires_in:-1},{...token,expires_in:1.5},{access_token:'token-fixture',token_type:'bearer'}]){
  const f=fixture([result]);await assert.rejects(f.http.exchangeCode({code:'fixture'}),e=>e.status===502&&safeError(e));
 }
 const invalidDebug=[{...debug.data,is_valid:'true'},{...debug.data,user_id:123},{...debug.data,user_id:undefined},{...debug.data,expires_at:-1},{...debug.data,data_access_expires_at:undefined},{...debug.data,scopes:['pages_show_list','pages_show_list']},{...debug.data,granular_scopes:[{scope:'pages_show_list',target_ids:['123','123']}]},{...debug.data,granular_scopes:[{scope:'pages_show_list',target_ids:['123/path']}]},{...debug.data,granular_scopes:[{scope:'unknown_permission'}]}];
 for(const data of invalidDebug){const f=fixture([{data}]);await assert.rejects(f.http.inspectToken({accessToken:'token-fixture'}),e=>e.status===502&&safeError(e));}
 for(const profile of [{id:'123',name:'bad\u0000name'},{id:'123/path',name:'Fixture'},{id:123,name:'Fixture'},{id:'123'}]){const f=fixture([profile]);await assert.rejects(f.http.identity({accessToken:'token-fixture'}),e=>e.status===502&&safeError(e));}
 const zero=fixture([{data:{...debug.data,expires_at:0,data_access_expires_at:0}}]);const result=await zero.http.inspectToken({accessToken:'token-fixture'});assert.equal(result.expiresAt,0);assert.equal(result.dataAccessExpiresAt,0);
});

test('app_id numerico documentato accettato solo se intero rappresentabile senza perdita',async()=>{
 const f=fixture([{data:{...debug.data,app_id:Number(appId)}}]);assert.equal((await f.http.inspectToken({accessToken:'token-fixture'})).appId,appId);
 for(const value of [1.2,Number.MAX_SAFE_INTEGER+1,0,-1]){const bad=fixture([{data:{...debug.data,app_id:value}}]);await assert.rejects(bad.http.inspectToken({accessToken:'token-fixture'}));}
});
