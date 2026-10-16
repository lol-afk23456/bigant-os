import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

async function fixture(){
 const nodes=new Map(),handlers={},requests=[],routes=[];
 const node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',open:false,hidden:true,addEventListener(){},focus(){},close(){this.open=false;},showModal(){this.open=true;}});return nodes.get(key);};
 const context=vm.createContext({URL,Date,Intl,crypto:{randomUUID},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},window:{},history:{replaceState(a,b,route){routes.push(route);}},location:{origin:'http://127.0.0.1',pathname:'/',hash:'',search:''},document:{querySelector:node,addEventListener(name,fn){(handlers[name]||=[]).push(fn);}},fetch:async()=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>({user:null,demo:true,profiles:[]})})});
 for(const name of ['app.js','ufficio.js','cliente.js','workspace.js'])vm.runInContext(readFileSync(new URL('../public/'+name,import.meta.url),'utf8'),context,{filename:name});await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S');S.session={user:{id:'owner',role:'owner'},csrf:'inventato'};S.clientId='client-b';
 context.fetch=async url=>{const u=new URL(url);requests.push(u);const id=u.searchParams.get('clientId');return {ok:true,headers:{get:()=> 'application/json'},json:async()=>u.pathname==='/api/overview'?{clients:[{id:'client-a'},{id:'client-b'}],currentClient:{id},navigation:{landing:'home',items:[['clients'],['client'],['service'],['profiles'],['fidelity'],['growth'],['agents'],['catalog']]},registry:{services:[]}}:{client:{id},clientId:id}};};
 run('render=()=>{};');return {S,run,context,node,handlers,requests,routes};
}

test('navigazione: scheda e anteprima conservano attività e sottopagina dopo la ricarica',async()=>{
 for(const route of ['clients:sections','clients:brief/master','clients:contract','client:service/social','client:documenti','profiles:website','fidelity:cards','agents:list','catalog:plan','growth:leads']){
  const f=await fixture();await f.run(`go(${JSON.stringify(route)})`);const hash=f.routes.at(-1);assert.equal(hash,'#'+route+'?clientId=client-b');
  f.S.clientId='';f.run(`setViewRoute(${JSON.stringify(hash.slice(1))})`);await f.run('load()');
  assert.equal(f.S.clientId,'client-b',route);assert.equal(f.S.section,route.split(':')[1],route);
  for(const req of f.requests.filter(u=>u.pathname==='/api/overview'))assert.equal(req.searchParams.get('clientId'),'client-b',route);
  if(route==='clients:brief/master')assert.ok(f.requests.some(u=>u.pathname==='/api/client-record/state'&&u.searchParams.get('clientId')==='client-b'));
 }
});

test('navigazione: report nuovi e indirizzi precedenti mantengono cliente e mese senza conflitti',async()=>{
 const f=await fixture();await f.run("go('clients:client-results/2026-10')");assert.equal(f.routes.at(-1),'#clients:client-results/2026-10?clientId=client-b');
 assert.ok(f.requests.some(u=>u.pathname==='/api/client-results'&&u.searchParams.get('period')==='2026-10'&&u.searchParams.get('clientId')==='client-b'));
 for(const name of ['client-results','email-marketing']){
  await f.run(`go('clients:${name}/2026-10/client-a')`);assert.equal(f.S.clientId,'client-a');assert.equal(f.S.section,`${name}/2026-10/client-a`);
  assert.throws(()=>f.run(`setViewRoute('clients:${name}/2026-10/client-a?clientId=client-b')`),/due attività/);
 }
});

test('navigazione: un collegamento malformato non cambia cliente o avvia richieste',async()=>{
 const f=await fixture();
 for(const route of ['clients:brief?clientId=','clients:brief?clientId=../../','clients:brief?clientId=client-a&clientId=client-b','clients:brief?clientId=%ZZ','home?clientId=client-a']){
  assert.throws(()=>f.run(`setViewRoute(${JSON.stringify(route)})`),/collegamento|pagina/i);assert.equal(f.S.clientId,'client-b');
 }
 assert.equal(f.requests.length,0);
});

test('navigazione: un cambio attività chiude moduli e dettagli e invalida il vecchio contesto',async()=>{
 for(const [route,expected] of [['clients:brief/master','clients:sections'],['clients:client-results/2026-10/client-b','clients:sections'],['client:service/social/report/S01','client'],['profiles:website','profiles'],['fidelity:cards','fidelity']]){
  const f=await fixture();f.run(`setViewRoute(${JSON.stringify(route)})`);f.node('#dialog').open=true;const nav=f.S.navigation;
  for(const handler of f.handlers.change)await handler({target:{id:'client-picker',value:'client-a'}});
  assert.equal(f.node('#dialog').open,false);assert.ok(f.S.navigation>nav);assert.equal(f.routes.at(-1),'#'+expected+'?clientId=client-a');assert.equal(f.S.clientId,'client-a');
 }
});

test('navigazione: rifiuto server del cliente richiesto non ripiega su un’altra attività',async()=>{
 const f=await fixture();let rendered=0;f.context.renderTest=()=>{rendered++;};f.run('render=renderTest;');
 f.context.fetch=async url=>{f.requests.push(new URL(url));return {ok:false,headers:{get:()=> 'application/json'},json:async()=>({error:'Attività non autorizzata.'})};};
 f.run("setViewRoute('clients:brief/master?clientId=non-assegnato')");await f.run('load()');assert.equal(f.S.clientId,'non-assegnato');assert.equal(rendered,0);assert.equal(f.requests.length,1);assert.match(f.node('#app').innerHTML,/Attività non autorizzata/);
});
