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
const data=()=>({from:'2026-09-10',to:'2026-10-07',fetchedAt:'2026-10-10T12:00:00Z',expiresAt:'2099-10-11T12:00:00Z',instagram:{profile:{id:'456',name:'Profilo <b>DEMO</b>',username:'demo_fixture',followers:120},metrics:[{name:'views',kind:'total',value:0},{name:'reach',kind:'total'}]},facebook:{profile:{id:'123',name:'Pagina DEMO'},metrics:[{name:'page_total_media_view_unique',kind:'series',points:[{date:'2026-09-10',value:5},{date:'2026-09-11',value:5}]}]}});
test('Meta UI: distingue vuoti da zero, escape, periodo, follower correnti e nessuna somma di reach',async()=>{
 const f=await fixture();Object.assign(f.S.module.metaProfiles,{configured:true,checked:true,channels:['facebook','instagram'],data:data()});let html=f.view();assert.match(html,/Profilo &lt;b&gt;DEMO&lt;\/b&gt;/);assert.match(html,/kpi-val">0/);assert.match(html,/Non disponibile/);assert.match(html,/crescita dei follower Instagram non è ancora disponibile/);assert.match(html,/meta-profiles-activate/);assert.doesNotMatch(html,/Risultati Facebook|href="https:\/\/graph/);
 f.S.section='facebook';html=f.view();assert.match(html,/valori non vengono sommati/);assert.match(html,/2026-09-10/);assert.doesNotMatch(html,/Somma|kpi-val">10/);
 f.S.module.metaProfiles.data.expiresAt='2000-01-01';assert.doesNotMatch(f.view(),/Pagina DEMO|meta-profiles-activate/);
});
test('Meta UI: selezione con consenso e canali non preselezionati; URL vincolato al cliente',async()=>{
 const f=await fixture();f.serve(call=>{if(call.path.endsWith('/pages'))return {items:[{id:'123',name:'Pagina DEMO',instagramId:'456',selectionToken:'selection'}]};if(call.path.endsWith('/configure'))return {...state(),version:1,configured:true,channels:['instagram']};throw Error('Unexpected');});
 f.actions['meta-profiles-select']();assert.doesNotMatch(f.html(),/ checked/);await assert.rejects(f.submit({}),/Conferma/);assert.equal(f.calls.length,0);await f.submit({confirmed:'on'});await f.submit({selectionToken:'selection'});assert.match(f.html(),/name="instagram"/);assert.doesNotMatch(f.html(),/ checked/);await assert.rejects(f.submit({confirmedBusiness:'on'}),/almeno un canale/);await f.submit({instagram:'on',confirmedBusiness:'on'});
 assert.equal(f.calls.length,2);assert.deepEqual(f.calls[1].body.channels,['instagram']);assert.ok(f.calls.every(c=>c.clientId==='demo-bottega'&&c.csrf==='csrf-fixture'));assert.equal(f.S.module.metaProfiles.version,1);
});
test('Meta UI: risposta tardiva non cambia cliente, pagina o dialogo chiuso',async()=>{
 for(const change of ['client','page','dialog']){const f=await fixture(),wait=deferred();Object.assign(f.S.module.metaProfiles,{configured:true,version:1});f.serve(()=>wait.promise);f.actions['meta-profiles-check']();const run=f.submit({});await new Promise(setImmediate);if(change==='client')f.S.clientId='another';if(change==='page')f.S.section='facebook';if(change==='dialog')f.node('#dialog').close();const root=f.S.module;wait.resolve({...state(),version:1,checked:true,data:data()});await run;assert.equal(f.S.module,root);assert.equal(root.metaProfiles.data,null);}
});
test('Meta UI: anteprima cliente senza controlli; scadenza rimuove dati prima di ricaricare',async()=>{
 const f=await fixture();f.S.view='client';f.S.section='service/social/instagram';f.S.module={clientId:f.S.clientId,service:{id:'social',nome:'Social media'},reports:[],meta:data()};let html=f.run('clienteDashboardView()');assert.match(html,/Risultati Instagram/);assert.doesNotMatch(html,/meta-profiles-(check|select|activate)/);
 f.S.module.meta.expiresAt='2000-01-01';html=f.run('clienteDashboardView()');assert.doesNotMatch(html,/Profilo &lt;b&gt;DEMO/);
 f.S.module.meta=data();f.run('clienteDashboardView()');f.S.module.meta.expiresAt='2000-01-01';let loaded=0;f.context.reloadFixture=()=>{loaded++;assert.doesNotMatch(f.run('clienteDashboardView()'),/Profilo &lt;b&gt;DEMO/);};f.run('load=reloadFixture');f.timers.at(-1).callback();assert.equal(loaded,1);
});
test('Meta UI: timer vecchia pagina non tocca una nuova vista',async()=>{
 const f=await fixture();Object.assign(f.S.module.metaProfiles,{configured:true,channels:['instagram'],data:data()});f.view();const oldTimer=f.timers.at(-1);f.S.module={...f.S.module,metaProfiles:{...f.S.module.metaProfiles,data:data()}};const root=f.S.module;oldTimer.callback();assert.equal(f.S.module,root);assert.ok(root.metaProfiles.data);
});
