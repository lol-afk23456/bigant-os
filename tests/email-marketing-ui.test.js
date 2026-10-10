import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

async function fixture(){
 const nodes=new Map(),node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',open:false,addEventListener(){},focus(){},close(){this.open=false;},showModal(){this.open=true;}});return nodes.get(selector);};
 const context=vm.createContext({URL,Date,Intl,crypto:{randomUUID},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},window:{},history:{replaceState(){}},location:{origin:'http://127.0.0.1:4330',pathname:'/',hash:'',search:''},document:{querySelector:node,addEventListener(){}},fetch:async()=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>({user:null,demo:true,profiles:[]})})});
 for(const name of ['app.js','ufficio.js','cliente.js','workspace.js','client-results.js','email-marketing.js'])vm.runInContext(readFileSync(new URL('../public/'+name,import.meta.url),'utf8'),context,{filename:name});await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S');S.session={user:{id:'demo-owner',role:'owner',name:'Socio DEMO'},csrf:'fake'};S.clientId='demo-bottega';S.view='clients';S.section='email-marketing';
 S.overview={clients:[{id:S.clientId,name:'Attività inventata'}],currentClient:{id:S.clientId},navigation:{landing:'home',items:[['clients','Clienti']]},registry:{services:[{id:'email-marketing',name:'Email marketing'}]}};
 const data={clientId:S.clientId,clientName:'Attività <b>inventata</b>',canManage:true,q:'',page:1,pages:2,total:51,counts:{total:51,granted:50,withdrawn:1},source:'Registro dell’attività',asOf:'2026-10-10T10:00:00Z',items:[{id:'contact-fixture',name:'Nome <script>',email:'contact@example.com',status:'granted',version:1,updated_at:'2026-10-10T10:00:00Z'}]};
 S.module=data;return {context,run,S,data};
}
test('Email marketing UI: contatti solo nel servizio, fonti leggibili e testo escapato',async()=>{
 const f=await fixture(),html=f.run('emailMarketingView()');assert.match(html,/Aggiungi contatto/);assert.match(html,/Consenso registrato/);assert.match(html,/Invii|invii/);assert.match(html,/Nome &lt;script&gt;/);assert.doesNotMatch(html,/<script>|<b>inventata/);assert.match(html,/Successivi/);
 f.S.module={client:{id:f.S.clientId,name:'Attività'},services:['email-marketing'],contracts:[],memory:[],credentials:[],onboarding:{}};f.S.section='services';assert.match(f.run('clientRecordsView()'),/Contatti e consensi/);
 f.S.module.services=['social'];assert.doesNotMatch(f.run('clientRecordsView()'),/Contatti e consensi/);
});
test('Email marketing UI: cliente modifica i propri contatti, anteprima socio e collaboratore leggono',async()=>{
 const f=await fixture();f.S.view='client';f.S.section='service/email-marketing';f.S.module={emailMarketing:f.data};
 assert.doesNotMatch(f.run('emailContactsPanel(emailData())'),/Aggiungi contatto/);
 f.S.session.user.role='client';assert.match(f.run('emailContactsPanel(emailData())'),/Aggiungi contatto/);
 f.S.view='clients';f.S.session.user.role='collaborator';f.data.canManage=false;assert.doesNotMatch(f.run('emailContactsPanel(emailData())'),/Aggiungi contatto/);
});
test('Email marketing UI: dialogo obsoleto non salva in un’altra attività',async()=>{
 const f=await fixture();f.run('form=(title,fields,callback)=>{globalThis.formCallback=callback;};api=async()=>{globalThis.sent=true;};');
 f.run("ACTIONS['email-add']()");f.S.clientId='demo-studio';
 await assert.rejects(f.context.formCallback({}, {has:()=>true}),/pagina o i permessi/);assert.equal(f.context.sent,undefined);
});
test('Email marketing UI: risposta di ricerca tardiva non sostituisce la nuova pagina',async()=>{
 const f=await fixture();f.run('api=()=>new Promise(resolve=>{globalThis.resolveEmail=resolve;});render=()=>{globalThis.rendered=true;};');
 const pending=f.run('emailRefresh(emailContext(),{q:"cerca",page:1})');f.S.navigation++;f.S.module={different:true};f.context.resolveEmail({...f.data,q:'cerca'});await pending;
 assert.equal(f.S.module.different,true);assert.equal(f.context.rendered,undefined);
});
test('Email marketing UI: storico in anteprima privo di comandi di revoca e prove escapate',async()=>{
 const f=await fixture();f.S.view='client';f.S.section='service/email-marketing';f.S.module={emailMarketing:f.data};
 f.context.historyFixture={contact:{id:'contact-fixture',email:'contact@example.com',version:1,status:'granted'},events:[{status:'granted',consent_date:'2026-10-09',source:'Prova <img src=x>',privacy_version:'v1',recorded_at:'2026-10-10T10:00:00Z'}]};
 f.run('api=async()=>historyFixture;form=(title,fields,callback,options)=>{globalThis.historyForm={fields,callback,options};};');await f.run("ACTIONS['email-history']('contact-fixture')");
 assert.equal(f.context.historyForm.fields.length,0);assert.equal(f.context.historyForm.options.submit,'Chiudi');assert.match(f.context.historyForm.options.extra,/&lt;img src=x&gt;/);
});
test('Email marketing UI: ricarica conserva l’attività nella rotta del registro',async()=>{
 const f=await fixture();f.run("setViewRoute('clients:email-marketing/latest/demo-studio')");assert.equal(f.S.clientId,'demo-studio');assert.equal(f.S.view,'clients');
});

test('Email marketing UI: prova obbligatoria e salvataggio chiudono il modulo soltanto dopo il successo',async()=>{
 const f=await fixture();assert.match(f.run('fieldsHTML(emailProofFields())'),/type="checkbox"[^>]*required/);
 f.run("$('#dialog').open=true;api=async()=>{throw Error('Errore di rete');};");
 await assert.rejects(f.run("emailSave(emailContext(),'',{})"),/Errore di rete/);assert.equal(f.run("$('#dialog').open"),true);
 f.run('api=async()=>({});emailRefresh=async()=>{};');await f.run("emailSave(emailContext(),'',{})");assert.equal(f.run("$('#dialog').open"),false);
});
