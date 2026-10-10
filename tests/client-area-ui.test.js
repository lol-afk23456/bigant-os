import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

async function fixture(){
 const nodes=new Map(),timers=[];const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',open:false,addEventListener(){},focus(){},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(selector);};
 const context=vm.createContext({URL,Date,Intl,crypto:{randomUUID},setInterval:()=>0,setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout(){},window:{},history:{replaceState(){}},location:{origin:'http://127.0.0.1:4330',pathname:'/',hash:'',search:''},document:{querySelector:node,addEventListener(){},hidden:false},fetch:async()=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>({user:null,demo:true,profiles:[]})})});
 for(const file of ['app.js','ufficio.js','cliente.js','workspace.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),context,{filename:file});await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S');S.session={user:{id:'client-fixture',role:'client',name:'Cliente DEMO'},demo:true,csrf:'fixture'};S.view='client';S.section='';S.clientId='demo-bottega';S.loading=1;S.navigation=1;
 S.overview={clients:[{id:S.clientId,name:'Bottega DEMO'}],currentClient:{id:S.clientId},currentClientServices:['social'],registry:{services:[]},navigation:{landing:'client',items:[['client','La tua attività'],['catalog','I tuoi servizi']]}};
 S.module={demo:true,clientId:S.clientId,clientName:'Bottega DEMO',servizi:['social'],sezioni:[{id:'home',servicesCount:1,contractsCount:0},{id:'servizi',attivi:[{id:'social',nome:'Social media'}]},{id:'documenti',contratti:[]}]};
 return {S,run,node,context,timers};
}
test('UI cliente: home a card, una sezione alla volta, sezioni tolte irraggiungibili',async()=>{
 const f=await fixture();let html=f.run('clienteDashboardView()');assert.match(html,/data-view="client:servizi"/);assert.match(html,/data-view="client:documenti"/);assert.doesNotMatch(html,/Chiedi all|Servizi consigliati|Approvazioni e calendario|Report mensili|Il tuo profilo|Contratto<\/th>/);
 f.S.section='servizi';html=f.run('clienteDashboardView()');assert.match(html,/client:service\/social/);assert.doesNotMatch(html,/I tuoi contratti|client:documenti/);assert.match(html,/Indietro/);
 f.S.section='documenti';html=f.run('clienteDashboardView()');assert.match(html,/I tuoi contratti/);assert.doesNotMatch(html,/client:service\/social|Aggiungi contratto/);
 for(const section of ['chiedi','report','profilo','approvazioni','risultati']){f.S.section=section;html=f.run('clienteDashboardView()');assert.match(html,/Sezione non disponibile/);assert.doesNotMatch(html,/<form|ask-question/);}
});
test('UI cliente: il primo accesso carica la home e il cambio profilo azzera la sezione precedente',async()=>{
 const f=await fixture(),overview=f.S.overview,dashboard=f.S.module,session=f.S.session,paths=[];let rendered=0;
 f.context.fakeMutate=async()=>session;
 f.context.fakeApi=async path=>{paths.push(path);if(path==='/api/overview')return overview;if(path==='/api/cliente/dashboard')return dashboard;throw Error('Percorso inatteso: '+path);};
 f.context.fakeRender=()=>{rendered++;assert.match(f.run('clienteDashboardView()'),/client:servizi/);};
 f.run('mutate=fakeMutate;api=fakeApi;render=fakeRender');
 delete f.S.section;await f.run('load()');assert.equal(rendered,1);
 for(const previous of [undefined,'service/local','approvals']){
  f.S.section=previous;f.S.serviceId='local';await f.run('ACTIONS.login("client-fixture")');
  assert.equal(f.S.section,'');assert.equal(f.S.serviceId,'');assert.equal(f.S.view,'client');
 }
 assert.equal(rendered,4);assert.ok(paths.every(path=>['/api/overview','/api/cliente/dashboard'].includes(path)));
});
test('UI cliente: report nel servizio, fonte/data e valori mancanti senza zero inventato',async()=>{
 const f=await fixture();f.S.section='service/social';f.S.module={clientId:f.S.clientId,clientName:'Bottega DEMO',service:{id:'social',nome:'Social media'},note:'Fonte da collegare',reports:[{id:'S01',nome:'Report social',metriche:[{nome:'Copertura',valore:null,fonte:'Meta',aggiornato:null,stato:'Da collegare',url:'javascript:alert(1)'},{nome:'Prova <script>',valore:0,fonte:'Fonte inventata',aggiornato:'2026-10-10T12:00:00Z',stato:'DEMO',url:'https://example.com/report'}]}]};
 const html=f.run('clienteDashboardView()');assert.match(html,/client:servizi/);assert.match(html,/Aggiornamento non disponibile/);assert.match(html,/Aggiornato/);assert.match(html,/Apri la fonte/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/href="javascript:|<script>/);assert.match(html,/class="muted">—/);assert.match(html,/kpi-val">0/);
 f.S.session.user.role='owner';assert.match(f.run('clienteDashboardView()'),/sola lettura/);assert.doesNotMatch(f.run('clienteDashboardView()'),/Aggiorna ora|Collega|data-action=".*(?:save|edit)/);
});
test('UI cliente: il catalogo usa gli stessi servizi e un vecchio indirizzo apre il report',async()=>{
 const f=await fixture();f.S.view='catalog';assert.match(f.run('servicePlanView()'),/client:service\/social/);assert.doesNotMatch(f.run('servicePlanView()'),/Specialisti|approvazioni|task/);
 f.S.view='service';f.S.module={clientId:f.S.clientId,service:{id:'social',nome:'Social media'},reports:[]};assert.match(f.run('serviceWorkspaceView()'),/I tuoi servizi/);assert.doesNotMatch(f.run('serviceWorkspaceView()'),/workspace|Specialisti/);
});
test('UI cliente: cache Google scaduta e risposta da un’altra attività non mostrate',async()=>{
 const f=await fixture();f.S.section='service/local';f.S.module={clientId:f.S.clientId,service:{id:'local',nome:'Google Business Profile'},reports:[],google:{expiresAt:'2000-01-01T00:00:00Z',reviews:{reviews:[{comment:'DATI GOOGLE SCADUTI'}]}}};assert.doesNotMatch(f.run('clienteDashboardView()'),/DATI GOOGLE SCADUTI/);
 f.S.module.clientId='another';assert.match(f.run('clienteDashboardView()'),/Report non disponibile/);
});
test('UI cliente: cache Google attiva con fonte e periodo; nessun rinnovo tardivo della pagina',async()=>{
 const f=await fixture();f.S.section='service/local';f.S.module={clientId:f.S.clientId,service:{id:'local',nome:'Google Business Profile'},reports:[],google:{source:'Google Business Profile',sourceUrl:'https://www.google.com/maps?cid=123',fetchedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+60000).toISOString(),from:'2026-09-10',to:'2026-10-07',reviews:{averageRating:4,totalReviewCount:1,reviews:[{reviewer:{displayName:'Utente inventato'},comment:'Recensione <b>inventata</b>',starRating:'FOUR',updateTime:'2026-10-10T12:00:00Z'}]},performance:{}}};
 let loads=0;f.context.newLoad=()=>{loads++;};f.run('load=newLoad');const html=f.run('clienteDashboardView()');assert.match(html,/Apri la fonte/);assert.match(html,/giorni assenti non valgono zero/);assert.match(html,/Recensione &lt;b&gt;inventata&lt;\/b&gt;/);assert.match(html,/elenco può essere parziale/);
 const timer=f.timers.at(-1);assert.ok(timer.ms>0);f.S.clientId='changed';timer.fn();assert.equal(loads,0);
});
test('UI cliente: Google non nasconde indicatori non coperti e alla scadenza sparisce anche senza rete',async()=>{
 const f=await fixture();f.S.section='service/local';f.S.module={clientId:f.S.clientId,service:{id:'local',nome:'Google Business Profile'},reports:[{id:'S07',nome:'Presenza',metriche:[{nome:'Directory coerenti',valore:null,fonte:'Fonte del servizio da collegare',aggiornato:null,stato:'Da collegare'}]}],google:{source:'Fonte Google di prova',expiresAt:new Date(Date.now()+60000).toISOString(),reviews:{reviews:[{comment:'COMMENTO CACHE TEMPORANEO'}]},performance:{}}};
 let loads=0,html=f.run('clienteDashboardView()');assert.match(html,/Directory coerenti/);assert.match(html,/Da collegare/);assert.match(html,/COMMENTO CACHE TEMPORANEO/);
 f.context.pendingLoad=()=>{loads++;return new Promise(()=>{});};f.context.renderCurrent=()=>{html=f.run('clienteDashboardView()');};f.run('load=pendingLoad;render=renderCurrent');
 const timer=f.timers.at(-1);f.S.module.google.expiresAt='2000-01-01T00:00:00Z';timer.fn();
 assert.equal(loads,1);assert.doesNotMatch(html,/COMMENTO CACHE TEMPORANEO|Fonte Google di prova/);assert.match(html,/Directory coerenti/);
});

test('UI profili cliente: home, sola lettura anche in anteprima e report nel servizio',async()=>{
 const f=await fixture();assert.match(f.run('clienteDashboardView()'),/data-view="profiles"/);
 f.S.session.user.role='owner';assert.match(f.run('clienteDashboardView()'),/data-view="client:profiles"/);
 f.S.module={clientId:f.S.clientId,clientName:'Attività <inventata>',canEdit:false,items:[{id:'website',name:'Sito web',link:{url:'https://cliente.example/',sourceUrl:'https://fonte.example/',updatedAt:'2026-10-10T10:00:00Z'},reportService:'website'}]};
 f.S.section='profiles';let html=f.run('clienteDashboardView()');assert.match(html,/client:profiles\/website/);assert.doesNotMatch(html,/profile-edit|Modifica|Aggiorna ora/);
 f.S.section='profiles/website';html=f.run('clienteDashboardView()');assert.match(html,/Fonte:/);assert.match(html,/Aggiornato/);assert.match(html,/client:service\/website/);assert.match(html,/Attività &lt;inventata&gt;/);assert.doesNotMatch(html,/profile-edit|business-profile-choose|business-profile-activate/);
 f.S.session.user.role='client';f.S.view='profiles';f.S.section='website';assert.match(f.run('workspaceProfilesView()'),/Apri il profilo pubblico/);
 f.S.module.items[0].link.url='javascript:alert(1)';assert.doesNotMatch(f.run('workspaceProfilesView()'),/href="javascript/);
 f.S.module.clientId='demo-studio';assert.match(f.run('workspaceProfilesView()'),/Profili non disponibili/);
});

test('UI profili cliente: menu e anteprima caricano la medesima API senza configurazione interna',async()=>{
 const f=await fixture(),seen=[];f.S.overview.navigation.items.push(['profiles','I tuoi profili']);f.context.fakeApi=async path=>{seen.push(path);return path==='/api/overview'?f.S.overview:{clientId:f.S.clientId,items:[]};};
 f.run('api=fakeApi;render=()=>{};');f.S.view='profiles';await f.run('load()');assert.ok(seen.includes('/api/cliente/profiles'));assert.ok(!seen.includes('/api/workspace/profiles'));
 seen.length=0;f.S.session.user.role='owner';f.S.view='client';f.S.section='profiles/website';await f.run('load()');assert.ok(seen.includes('/api/cliente/profiles'));assert.ok(!seen.includes('/api/workspace/profiles'));
});

test('UI fonte Fidelity: dettaglio leggibile e limitato al servizio, HTML non eseguibile',async()=>{
 const f=await fixture();f.S.section='service/fidelity';f.S.module={clientId:f.S.clientId,service:{id:'fidelity',nome:'Fidelity'},reports:[{nome:'Iscrizioni Fidelity',metriche:[{nome:'Iscrizioni attive',valore:1,fonte:'Fidelity',sourceAction:'fidelity'}]}]};assert.match(f.run('clientServiceReportView()'),/data-action="client-fidelity-source"/);
 f.context.sourceApi=async(path,options)=>{assert.equal(path,'/api/cliente/services/fidelity/source?clientId=demo-bottega');assert.equal(options.scoped,false);return {clientId:f.S.clientId,clientName:'Attività <test>',source:'Archivio Fidelity',readAt:'2026-10-10T10:00:00Z',definition:'Tessere attive',totals:{inscriptions:1,marketing:0},programs:[{name:'Carta <script>',active:false,inscriptions:1,marketing:0}]};};f.run('api=sourceApi');await f.run("ACTIONS['client-fidelity-source']()");const html=f.node('#dialog-content').innerHTML;assert.match(html,/Carta &lt;script&gt; · Sospeso/);assert.match(html,/Totale/);assert.match(html,/Letto il/);assert.doesNotMatch(html,/<script>|undefined|NaN/);
 f.S.module.service.id='social';assert.doesNotMatch(f.run('clientServiceReportView()'),/data-action="client-fidelity-source"/);await assert.rejects(f.run("ACTIONS['client-fidelity-source']()"),/Apri il servizio/);
});
test('UI fonte Fidelity: risposte obsolete non riaprono il dettaglio né cambiano cliente',async()=>{
 for(const change of ['client','session','dialog','module']){const f=await fixture();f.S.module={clientId:f.S.clientId,service:{id:'fidelity'}};let finish;f.context.pendingApi=()=>new Promise(resolve=>finish=resolve);f.run('api=pendingApi');const task=f.run("ACTIONS['client-fidelity-source']()");if(change==='client')f.S.clientId='demo-studio';if(change==='session')f.S.session={...f.S.session};if(change==='dialog')f.node('#dialog').close();if(change==='module')f.S.module={...f.S.module};f.node('#dialog-content').innerHTML='Vista nuova';finish({clientId:'demo-bottega'});await task;assert.equal(f.node('#dialog-content').innerHTML,'Vista nuova');}
});
