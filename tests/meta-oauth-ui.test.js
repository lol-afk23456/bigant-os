import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

const response=value=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>value});
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
const fd=values=>{const result=new FormData();for(const [key,value] of Object.entries(values))result.set(key,String(value));return result;};
const state=extra=>({available:true,configured:false,version:0,status:'Da collegare',checked:false,enabled:false,daily:false,lastSync:null,error:null,canManage:true,data:null,note:'Configura la lettura della scheda.',...extra});
const profiles=()=>({clientId:'demo-bottega',canEdit:true,items:[['instagram','Instagram'],['facebook','Facebook'],['linkedin','LinkedIn aziendale'],['tiktok','TikTok'],['google-business','Google Business Profile'],['website','Sito web']].map(([id,name])=>({id,name,status:'Da collegare',lastSync:null,metrics:null,reviews:null,link:null})),businessProfile:state()});
async function fixture(){
 const nodes=new Map(),calls=[],redirects=[],history=[],timers=[];
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',open:false,addEventListener(){},replaceChildren(){this.innerHTML='';},showModal(){this.open=true;},close(){this.open=false;},focus(){}});return nodes.get(selector);};
 const context=vm.createContext({URL,URLSearchParams,Date,Intl,FormData,crypto:{randomUUID},setInterval:()=>0,setTimeout:(callback,delay)=>{timers.push({callback,delay});return timers.length;},clearTimeout(){},window:{},history:{replaceState:(_a,_b,path)=>history.push(path)},location:{origin:'http://127.0.0.1:4330',pathname:'/',hash:'',search:'',assign:url=>redirects.push(url)},document:{querySelector:node,addEventListener(){},hidden:false},fetch:async()=>response({user:null,demo:true,profiles:[]})});
 for(const file of ['app.js','ufficio.js','cliente.js','workspace.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),context,{filename:file});await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S'),actions=run('ACTIONS');S.session={user:{id:'owner-fixture',role:'owner',name:'Socio DEMO'},demo:false,csrf:'csrf-fixture'};S.view='profiles';S.section='instagram';S.clientId='demo-bottega';S.overview={clients:[{id:'demo-bottega',name:'Bottega DEMO'}],currentClient:{id:'demo-bottega'},navigation:{landing:'profiles',items:[['profiles','Profili'],['connections','Collegamenti']]}};S.module=profiles();S.module.metaProfiles={...state(),channels:[]};
 let serve=call=>{throw Error('Richiesta inattesa '+call.path);};context.fetch=async(url,options={})=>{const u=new URL(url),call={path:u.pathname,clientId:u.searchParams.get('clientId'),method:options.method||'GET',body:options.body===undefined?undefined:JSON.parse(options.body),csrf:options.headers?.['X-CSRF-Token']};calls.push(call);return response(await serve(call));};
 return {S,actions,calls,redirects,history,timers,context,run,node,serve:fn=>{serve=fn;},html:()=>node('#dialog-content').innerHTML,page:()=>node('#app').innerHTML,view:()=>run('workspaceProfilesView()'),submit:values=>run('formHandler')(fd(values))};
}
const authorization=extra=>({mode:'oauth',available:true,configured:true,connected:false,version:2,accountName:null,expiresAt:null,...extra});
async function oauthFixture(extra={}){const f=await fixture();f.S.view='connections';f.S.section='meta';f.S.module={vaultReady:true,items:[{id:'meta',name:'Meta',fields:[{id:'accessToken'}],configured:true,version:2,status:'Da collegare',authorization:authorization(extra)}]};return f;}
test('Meta OAuth UI: configurazione guidata senza token manuale, consenso e canali vuoti',async()=>{
 const f=await oauthFixture(),html=f.run('protectedConnectionsView()');assert.match(html,/Configura|Aggiorna app Meta/);assert.doesNotMatch(html,/data-action="connection-save"/);f.actions['meta-oauth-start']();assert.doesNotMatch(f.html(),/ checked/);await assert.rejects(f.submit({}),/canale/);assert.equal(f.calls.length,0);
 f.serve(()=>({url:'https://www.facebook.com/v26.0/dialog/oauth?state=fake'}));await f.submit({facebook:'on',acknowledged:'on'});assert.deepEqual(f.calls[0].body,{version:2,channels:['facebook'],acknowledged:true});assert.equal(f.calls[0].clientId,null);assert.equal(f.redirects.length,1);
});
test('Meta OAuth UI: flag spento, redirect estraneo e risposta tardiva non portano a Facebook',async()=>{
 const off=await oauthFixture({available:false});assert.throws(()=>off.actions['meta-oauth-start'](),/abilita/);assert.doesNotMatch(off.run('protectedConnectionsView()'),/data-action="meta-oauth-start"/);
 for(const change of ['foreign','page','dialog','session']){const f=await oauthFixture(),wait=deferred();f.serve(()=>wait.promise);f.actions['meta-oauth-start']();const p=f.submit({facebook:'on',acknowledged:'on'});await new Promise(setImmediate);if(change==='page')f.S.section='gbp';if(change==='dialog')f.node('#dialog').close();if(change==='session')f.S.session={...f.S.session};wait.resolve({url:change==='foreign'?'https://evil.example/':'https://www.facebook.com/v26.0/dialog/oauth?state=fake'});if(change==='foreign')await assert.rejects(p,/non valido/);else await p;assert.equal(f.redirects.length,0);}
});
test('Meta OAuth UI: disconnessione richiede conferma e aggiorna la versione',async()=>{
 const f=await oauthFixture({connected:true});f.serve(()=>authorization({version:3}));f.actions['meta-oauth-disconnect']();await assert.rejects(f.submit({}),/Conferma/);await f.submit({confirmed:'on'});assert.equal(f.calls[0].body.version,2);assert.equal(f.S.module.items[0].version,3);assert.equal(f.S.module.items[0].authorization.connected,false);
});
test('Meta callback: elimina query prima di API, sessione socio e output privo di codice/token',async()=>{
 const f=await oauthFixture();f.context.location.pathname='/auth/meta/callback';f.context.location.search='?state=state-fixture&code=code-fixture';f.serve(call=>{assert.deepEqual(f.history,['/auth/meta/callback']);return call.path==='/api/session'?{user:{id:'owner-fixture',role:'owner'},csrf:'callback-csrf'}:authorization({connected:true,accountName:'Socio <test>'});});await f.run('publicPage()');assert.deepEqual(f.calls.map(c=>c.path),['/api/session','/api/connections/meta/oauth/finish']);assert.equal(f.calls[1].csrf,'callback-csrf');assert.equal(f.calls[1].clientId,null);assert.match(f.page(),/Meta autorizzato/);assert.match(f.page(),/Socio &lt;test&gt;/);assert.doesNotMatch(f.page(),/code-fixture|state-fixture|ESPERIENZA DEMO/);
});
test('Meta callback: ruolo cliente o risposta dopo navigazione non completano la schermata',async()=>{
 const f=await oauthFixture();f.context.location.pathname='/auth/meta/callback';f.serve(()=>({user:{role:'client'}}));await f.run('publicPage()');assert.equal(f.calls.length,1);assert.match(f.page(),/da ripetere/);
 const g=await oauthFixture(),wait=deferred();g.context.location.pathname='/auth/meta/callback';g.serve(call=>call.path==='/api/session'?g.S.session:wait.promise);const work=g.run('publicPage()');await new Promise(setImmediate);g.context.location.pathname='/';wait.resolve(authorization({connected:true,accountName:'Vecchio'}));await work;assert.doesNotMatch(g.page(),/Vecchio|Meta autorizzato/);
});
