import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

async function fixture(){
 const nodes=new Map(),node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',open:false,addEventListener(){},focus(){},close(){this.open=false;},showModal(){this.open=true;}});return nodes.get(selector);};
 const context=vm.createContext({URL,Date,Intl,crypto:{randomUUID},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},window:{},history:{replaceState(){}},location:{origin:'http://127.0.0.1:4330',pathname:'/',hash:'',search:''},document:{querySelector:node,addEventListener(){}},fetch:async()=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>({user:null,demo:true,profiles:[]})})});
 for(const name of ['app.js','ufficio.js','cliente.js','workspace.js','client-results.js'])vm.runInContext(readFileSync(new URL('../public/'+name,import.meta.url),'utf8'),context,{filename:name});await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S');S.session={user:{id:'demo-owner',role:'owner',name:'Socio DEMO'},csrf:'fake'};S.clientId='demo-bottega';S.view='clients';S.section='client-results';S.overview={clients:[{id:S.clientId,name:'Attività inventata'}],currentClient:{id:S.clientId},navigation:{landing:'home',items:[['clients','Clienti']]},registry:{services:[{id:'social',name:'Social media'}]}};
 const report={id:'report-fixture',version:2,period:'2026-10',summary:'Sintesi <script>',nextSteps:'Prossimo <b>passo</b>',published:false,canPublish:true,status:'Bozza interna',entries:[{kind:'goal',serviceId:'social',title:'Contatti',detail:'',value:0,target:10,unit:'contatti',date:'2026-10-01',source:'Archivio inventato',url:'https://example.com/report'},{kind:'result',serviceId:'social',title:'Copertura',detail:'',value:null,target:null,unit:'persone',date:'2026-10-01',source:'Fonte ancora da misurare',url:null}]};
 S.module={clientId:S.clientId,clientName:'Attività inventata',services:[{id:'social',name:'Social media'}],period:report.period,report,reports:[report],history:[],events:[]};return {run,S,context,node,report};
}
test('risultati UI: riepilogo e report distinguono bozze, fonti, zero e misure mancanti',async()=>{
 const f=await fixture();let html=f.run('resultsEditorView()');assert.match(html,/Bozza interna/);assert.match(html,/Verifica e mostra al cliente/);assert.match(html,/0 contatti/);assert.match(html,/Non disponibile/);assert.match(html,/Fonte: Archivio inventato/);assert.match(html,/Sintesi &lt;script&gt;/);assert.doesNotMatch(html,/<script>|<b>passo<\/b>/);
 f.S.section='results';f.S.module={items:[{clientId:'demo-bottega',clientName:'Attività inventata',latest:f.report}]};html=f.run('clientRecordsView()');assert.match(html,/Apri risultati/);assert.match(html,/Sintesi &lt;script&gt;/);assert.doesNotMatch(html,/obiettivo di fatturato/i);
});
test('risultati UI: anteprima completa prima della conferma e modifica tardiva respinta',async()=>{
 const f=await fixture();f.run('ACTIONS["results-preview"]()');const html=f.node('#dialog-content').innerHTML;assert.match(html,/Versione 2/);assert.match(html,/Ho controllato questa versione/);assert.match(html,/Archivio inventato/);assert.match(html,/Obiettivo: 10 contatti/);
 let calls=0;f.context.mutateFake=async()=>{calls++;};f.run('mutate=mutateFake');f.S.clientId='demo-studio';await assert.rejects(f.run('formHandler(new Map([["confirmed","on"]]))'),/pagina è cambiata/);assert.equal(calls,0);
});
test('risultati UI: Aggiungi voce funziona senza identificativo ed entra nel salvataggio versionato',async()=>{
 const f=await fixture();let saved;
 f.context.capture=async(_,body)=>{saved=body;f.S.clientId='altra';return {};};f.run('mutate=capture;ACTIONS["results-entry"]()');assert.match(f.node('#dialog-content').innerHTML,/Aggiungi una voce/);
 f.context.fields=new Map([['kind','result'],['serviceId','social'],['title','Nuova misura'],['detail',''],['value','0'],['target',''],['unit','contatti'],['date','2026-10-01'],['source','Fonte inventata'],['url','']]);await f.run('formHandler(fields)');
 assert.equal(saved.version,2);assert.equal(saved.entries.length,3);assert.equal(saved.entries[2].value,0);assert.equal(saved.entries[2].target,null);
});
test('risultati UI: ricaricare un report conserva attività e mese senza usare il cliente zero',async()=>{
 const f=await fixture();f.S.clientId='';f.run('setViewRoute("clients:client-results/2026-10/demo-bottega")');assert.equal(f.S.clientId,'demo-bottega');assert.equal(f.S.section,'client-results/2026-10/demo-bottega');
 const urls=[];f.context.recordApi=async path=>{urls.push(path);return path==='/api/overview'?f.S.overview:f.S.module;};f.context.noRender=()=>{};f.run('api=recordApi;render=noRender');await f.run('load()');assert.deepEqual(urls,['/api/overview','/api/client-results?period=2026-10']);
});
test('risultati UI: cliente legge la proiezione pubblicata senza comandi di modifica',async()=>{
 const f=await fixture();f.S.session.user.role='client';f.S.view='client';f.S.section='results';f.S.module={clientId:f.S.clientId,clientName:'Attività inventata',reports:[{...f.report,published:true,publishedAt:'2026-10-01T12:00:00Z'}]};
 let html=f.run('clienteDashboardView()');assert.match(html,/I tuoi risultati/);assert.match(html,/Archivio inventato/);assert.doesNotMatch(html,/results-entry|results-publish|results-hide|Modifica le voci|Versioni e visibilità/);
 f.S.module.clientId='altra';assert.doesNotMatch(f.run('clienteDashboardView()'),/Archivio inventato/);
});
test('risultati UI: la card compare solo con un report pubblicato e la bozza non esce dal servizio',async()=>{
 const f=await fixture();f.S.session.user.role='client';f.S.view='client';f.S.section='';f.S.module={clientId:f.S.clientId,clientName:'Attività inventata',sezioni:[{id:'home',servicesCount:1,contractsCount:0}]};assert.doesNotMatch(f.run('clienteDashboardView()'),/client:results/);
 f.S.module.sezioni.push({id:'results'});assert.match(f.run('clienteDashboardView()'),/client:results/);
 f.S.section='service/social';f.S.module={clientId:f.S.clientId,service:{id:'social',nome:'Social media'},reports:[],publishedReports:[f.report]};assert.match(f.run('clienteDashboardView()'),/Report verificato/);
});
