import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

async function fixture(){
 const nodes=new Map(),node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',open:false,addEventListener(){},close(){this.open=false;},showModal(){this.open=true;}});return nodes.get(key);};
 const context=vm.createContext({URL,Date,Intl,crypto:{randomUUID},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},window:{},history:{replaceState(){}},location:{origin:'http://127.0.0.1',pathname:'/',hash:'',search:''},document:{querySelector:node,addEventListener(){}},fetch:async()=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>({user:null,demo:true,profiles:[]})})});
 for(const name of ['app.js','cliente.js','workspace.js'])vm.runInContext(readFileSync(new URL('../public/'+name,import.meta.url),'utf8'),context,{filename:name});await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S');S.session={user:{id:'owner',role:'owner'},csrf:'fake'};S.view='growth';S.section='';S.clientId='client-a';S.overview={currentClient:{id:'client-a',name:'Cliente inventato'},clients:[]};S.module={simulation:false,migration:{required:true,version:'v1',counts:{gr_leads:2,gr_messages:3},archive:null}};
 const calls=[];context.testApi=async(path,options)=>{calls.push({path,options});return {simulation:false,migration:{required:false}};};run('api=testApi;render=()=>{};');
 return {run,S,node,calls,context,submit:entries=>run('formHandler')(new Map(Object.entries(entries)))};
}
test('Growth legacy: pagina dedicata espone solo conteggi e azione esplicita, senza fingere contatti reali',async()=>{
 const f=await fixture(),html=f.run('growthSectionsView()');assert.match(html,/Aziende|Messaggi/);assert.match(html,/growth-demo-archive/);assert.doesNotMatch(html,/new-lead|growth-run|research-form/);
});
test('Growth archivio: conferma, contesto e socio richiesti prima di scrivere',async()=>{
 for(const change of [f=>{f.S.clientId='client-b';},f=>{f.S.session=null;},f=>{f.S.navigation++;},f=>{f.run('dialog("Altro","Conservare")');}]){
  const f=await fixture();f.run("ACTIONS['growth-demo-archive']()");change(f);await assert.rejects(f.submit({confirmed:'on'}),/cambiati/);assert.equal(f.calls.length,0);
 }
 const f=await fixture();f.run("ACTIONS['growth-demo-archive']()");await assert.rejects(f.submit({}),/Conferma/);assert.equal(f.calls.length,0);
 f.S.session.user.role='collaborator';assert.throws(()=>f.run("ACTIONS['growth-demo-archive']()"),/Aggiorna/);
});
test('Growth archivio: cliente e versione fissati, doppio clic escluso e risposta tardiva ignorata',async()=>{
 const f=await fixture();let resolve;f.context.testApi=(path,options)=>{f.calls.push({path,options});return new Promise(r=>resolve=r);};f.run('api=testApi;');f.run("ACTIONS['growth-demo-archive']()");
 const first=f.submit({confirmed:'on'});await f.submit({confirmed:'on'});assert.equal(f.calls.length,1);assert.equal(f.calls[0].path,'/api/growth/demo-archive?clientId=client-a');assert.equal(f.calls[0].options.scoped,false);assert.equal(f.calls[0].options.body.version,'v1');assert.equal(f.calls[0].options.body.confirmed,true);
 const old=f.S.module;f.S.navigation++;resolve({migration:{required:false}});await first;assert.equal(f.S.module,old);
});
test('Growth archivio: il ripristino richiede spazio ancora vuoto',async()=>{
 const f=await fixture();f.S.module.migration={required:false,version:'v2',archive:{canRestore:false}};assert.throws(()=>f.run("ACTIONS['growth-demo-restore']()"),/Aggiorna/);
 f.S.module.migration.archive.canRestore=true;f.run("ACTIONS['growth-demo-restore']()");await f.submit({confirmed:'on'});assert.equal(f.calls[0].path,'/api/growth/demo-restore?clientId=client-a');
});
