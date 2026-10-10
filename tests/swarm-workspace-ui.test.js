import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
const response=value=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>value});
async function fixture() {
 const nodes=new Map(),calls=[];
 function node(selector){if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',open:false,addEventListener(){},replaceChildren(){this.innerHTML='';},showModal(){this.open=true;},close(){this.open=false;},focus(){}});return nodes.get(selector);}
 let content='';Object.defineProperty(node('#dialog-content'),'innerHTML',{get:()=>content,set:value=>{content=value;node('#dialog-title').textContent=value.match(/id="dialog-title">([^<]*)/)?.[1]||'';}});
 const context=vm.createContext({URL,Date,Intl,crypto:{randomUUID},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},window:{},history:{replaceState(){}},location:{origin:'http://127.0.0.1:4330',pathname:'/',hash:'',search:''},document:{querySelector:node,addEventListener(){},hidden:false,activeElement:null},fetch:async()=>response({user:null,demo:true,profiles:[]})});
 for(const file of ['app.js','ufficio.js','workspace.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),context,{filename:file});
 await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S'),actions=run('ACTIONS');
 S.session={user:{id:'owner-fixture',role:'owner',name:'Socio DEMO'},csrf:'csrf-fixture',demo:true};S.view='agents';S.section='office';S.clientId='demo-bottega';S.loading=1;S.navigation=1;
 S.overview={clients:[{id:'demo-bigant',name:'BigAnt DEMO'},{id:'demo-bottega',name:'Bottega DEMO'}],currentClient:{id:S.clientId},contents:[],approvals:[],agency:{approvals:[]},registry:{services:[]},navigation:{landing:'home',items:[['home','Home'],['agents','Sciame']]}};
 S.module={stanze:[],feed:[],giri:[],azioniBloccate:[]};
 let serve=path=>{throw Error('Richiesta inattesa '+path);};
 context.fetch=async(url,options={})=>{const u=new URL(url),call={path:u.pathname,clientId:u.searchParams.get('clientId'),method:options.method||'GET',body:options.body?JSON.parse(options.body):null};calls.push(call);return response(await serve(call));};
 return {S,actions,calls,run,node,serve:fn=>{serve=fn;},context};
}

test('Ufficio: una risposta precedente non sovrascrive pagina, sessione o caricamento nuovi',async t=>{
 for(const change of ['section','view','session','user','csrf','load','leave-and-return'])await t.test(change,async()=>{
  const f=await fixture(),pending=deferred();f.serve(()=>pending.promise);const request=f.run('aggiornaUfficio()');
  if(change==='section')f.S.section='list';if(change==='view')f.S.view='clients';
  if(change==='session')f.S.session={...f.S.session};if(change==='user')f.S.session.user.id='other-user';if(change==='csrf')f.S.session.csrf='new-session';if(change==='load')f.S.loading++;
  if(change==='leave-and-return'){f.run("setViewRoute('agents:list');setViewRoute('agents:office')");}
  const current={configuration:{items:[{id:'director'}]}};f.S.module=current;f.node('#ufficio-root').innerHTML='Pagina nuova';
  pending.resolve({stanze:[{nome:'Vecchio ufficio'}]});await request;
  assert.equal(f.S.module,current);assert.equal(f.node('#ufficio-root').innerHTML,'Pagina nuova');
 });
});

test('Ufficio: aggiorna normalmente feed e stanze senza perdere il divieto di auto-approvare contenuti',async()=>{
 const f=await fixture();f.serve(()=>({stanze:[],feed:[],giri:[],azioniBloccate:[],autoApprovazioneDemo:true}));
 await f.run('aggiornaUfficio()');const html=f.node('#ufficio-root').innerHTML;
 assert.match(html,/In tempo reale/);assert.match(html,/I contenuti restano sempre in attesa della decisione di una persona/);assert.ok(f.S.lastRefresh);
 assert.deepEqual(f.calls.map(x=>x.method),['GET']);
});

test('Diretta: un dettaglio tardivo non riapre la finestra dopo il cambio di pagina',async()=>{
 const f=await fixture(),pending=deferred();f.serve(()=>pending.promise);
 const request=f.actions['ufficio-postazione']('passo-fixture');f.run("setViewRoute('agents:structure')");f.node('#dialog').close();
 pending.resolve({compito:'Vecchio compito',stato:'al_lavoro'});await request;assert.equal(f.node('#dialog').open,false);
});

test('Giro: una risposta tardiva non riapre il dettaglio dopo cambio pagina o sessione',async()=>{
 for(const change of ['page','session']) {
  const f=await fixture(),pending=deferred();f.serve(()=>pending.promise);
  const request=f.actions['ufficio-giro']('giro-fixture');
  if(change==='page')f.run("setViewRoute('agents:list')");else f.S.session={...f.S.session,csrf:'nuova-sessione'};
  f.node('#dialog').close();f.node('#dialog-content').innerHTML='Vista successiva';
  pending.resolve({richiesta:'Giro precedente',motore:'demo',stato:'completato',passi:[]});await request;
  assert.equal(f.node('#dialog').open,false);assert.equal(f.node('#dialog-content').innerHTML,'Vista successiva');
 }
});

test('Diretta: il passo corrente aggiorna il testo e mostra il risultato quando termina',async()=>{
 const f=await fixture(),step={id:'passo-fixture',compito:'Prepara proposta DEMO',stato:'al_lavoro',motoreEtichetta:'DEMO',created_at:'2026-10-10T10:00:00Z',diretta_fase:'scrittura',diretta:'Prime parole'};
 const select=f.context.document.querySelector;
 f.context.document.querySelector=selector=>selector==='.live-transcript'&&!f.node('#dialog-content').innerHTML.includes('class="live-transcript"')?null:select(selector);
 let current=step;f.serve(call=>{assert.equal(call.path,'/api/sciame/passi/passo-fixture');return current;});
 await f.actions['ufficio-postazione'](step.id);assert.match(f.node('#dialog-content').innerHTML,/Prime parole/);
 current={...step,diretta:'Testo in avanzamento'};await f.run('aggiornaDiretta()');
 assert.match(f.node('#dialog-content').innerHTML,/Testo in avanzamento/);assert.doesNotMatch(f.node('#dialog-content').innerHTML,/Prime parole/);
 current={...step,stato:'completato',output:{sintesi:'Proposta finale DEMO'}};await f.run('aggiornaDiretta()');
 const html=f.node('#dialog-content').innerHTML;assert.match(html,/Proposta finale DEMO/);assert.match(html,/Completato/);assert.doesNotMatch(html,/class="live-transcript"|Testo in avanzamento/);
 assert.equal(f.node('#dialog').open,true);assert.equal(f.S.passoAperto,step.id);assert.deepEqual(f.calls.map(call=>call.method),['GET','GET','GET']);
});

test('Sciame: sei schede, cabina conservata, priorità ed esplorazione in Ufficio',async()=>{
 const f=await fixture();f.S.section='sections';const grid=f.run('agentsUnifiedView()');
 assert.deepEqual([...grid.matchAll(/data-view="agents:([^"]+)"/g)].map(x=>x[1]),['office','list','approvals','history','budget','structure']);
 f.S.section='office';const office=f.run('agentsUnifiedView()');assert.match(office,/class="hero workspace-hero"/);assert.match(office,/data-id="agents:list"/);assert.match(office,/data-action="director-priorities"/);assert.match(office,/id="ufficio-root"/);
});

test('Struttura: dal reparto a ruoli e procedure, senza mostrare tutti i reparti insieme né lanciare agenti',async()=>{
 const f=await fixture();f.S.module={departments:[{id:'production',name:'Produzione',trigger:'Dopo il brief',owner:'Responsabile DEMO',agents:['social']},{id:'sales',name:'Commerciale',agents:['research']}],agents:[{id:'social',name:'Social <script>',purpose:'Prepara le bozze',outputs:['Testo <img src=x>'],execution:{mode:'DEMO offline'},sop:{version:'1',validation:'Da validare'},gate:'Una persona decide'},{id:'research',name:'Ricerca clienti'}]};
 f.S.section='structure';const grid=f.run('agentsUnifiedView()');assert.match(grid,/data-view="agents:structure\/production"/);assert.doesNotMatch(grid,/Testo &lt;img/);
 f.S.section='structure/production';const detail=f.run('agentsUnifiedView()');assert.match(detail,/Dopo il brief/);assert.match(detail,/Responsabile DEMO/);assert.match(detail,/Testo &lt;img src=x&gt;/);assert.match(detail,/Social &lt;script&gt;/);assert.doesNotMatch(detail,/<script>|Ricerca clienti/);assert.match(detail,/data-action="agent-config" data-id="social"/);
 assert.equal(f.calls.length,0);
 f.serve(call=>{assert.equal(call.path,'/api/agent-config/state');return {items:[{id:'social',name:'Social DEMO',config:{task:'Bozze',version:1,cadence:'manual'},activationBlock:'Da collaudare'}]};});
 await f.actions['agent-config']('social');assert.match(f.node('#dialog-content').innerHTML,/Configura · Social DEMO/);assert.deepEqual(f.calls.map(x=>x.method),['GET']);
});

test('Priorità: legge soltanto l’agenzia, conserva cliente selezionato, testo corrente ed escaping',async()=>{
 const f=await fixture();const current={id:'output-fixture',kind:'procedure',title:'Proposte <script>',body:'Testo corrente <img src=x>',items:[],updatedAt:'2026-10-10T10:00:00Z',version:2,mode:'Procedura DEMO',source:'Fonte <b>',approvalStatus:'needs_review',notice:'Proposte da verificare <script>',available:true};
 f.serve(call=>{assert.equal(call.path,'/api/workspace/priorities');assert.equal(call.clientId,null);return {clientId:'demo-bigant',current};});
 await f.actions['director-priorities']();const html=f.node('#dialog-content').innerHTML;
 assert.match(html,/Testo corrente &lt;img src=x&gt;/);assert.match(html,/Fonte &lt;b&gt;/);assert.match(html,/Procedura DEMO/);assert.match(html,/Da verificare/);assert.doesNotMatch(html,/<script>|<img/);assert.equal(f.S.clientId,'demo-bottega');assert.deepEqual(f.calls.map(x=>x.method),['GET']);
 f.serve(call=>{assert.equal(call.path,'/api/agents/outputs/output-fixture');assert.equal(call.clientId,'demo-bigant');return {id:'output-fixture',title:'Origine',body:'Versione corrente',sources:[],status:'pending'};});
 await f.actions['director-source']();assert.match(f.node('#dialog-content').innerHTML,/Versione corrente/);assert.equal(f.S.clientId,'demo-bottega');
});

test('Priorità: risultato assente o incoerente non ripropone suggerimenti vecchi; decisione tecnica distinta',async()=>{
 const f=await fixture();f.serve(()=>({current:null}));await f.actions['director-priorities']();assert.match(f.node('#dialog-content').innerHTML,/Nessuna priorità registrata/);
 f.serve(()=>({current:{id:'passo-fixture',kind:'sciame',mode:'Motore DEMO',items:[{title:'Proposta',reason:'Motivo',next:'Prossimo passo'}],source:'Registro',approvalStatus:'simulated',available:true}}));
 await f.actions['director-priorities']();assert.match(f.node('#dialog-content').innerHTML,/Passaggio interno DEMO/);assert.match(f.node('#dialog-content').innerHTML,/Prossimo passo/);
 f.serve(()=>({current:{id:'passo-fixture',kind:'sciame',mode:'Motore DEMO',body:'Testo da non mostrare',items:[{title:'Vecchia priorità'}],approvalStatus:'needs_review',available:false,notice:'Risultato incoerente'}}));
 await f.actions['director-priorities']();const html=f.node('#dialog-content').innerHTML;assert.match(html,/Risultato incoerente/);assert.doesNotMatch(html,/Vecchia priorità|Testo da non mostrare|data-action="director-source"/);
});

test('Priorità: una richiesta tardiva non riapre la finestra chiusa né cambia una pagina successiva',async()=>{
 const f=await fixture(),pending=deferred();f.serve(()=>pending.promise);const request=f.actions['director-priorities']();
 f.node('#dialog').close();f.run("setViewRoute('agents:list')");pending.resolve({current:{title:'Non più richiesto',items:[]}});await request;
 assert.equal(f.node('#dialog').open,false);assert.equal(f.S.directorPriority,null);
});

test('Priorità: errore di lettura visibile e ritentabile, senza mostrare una vecchia proposta',async()=>{
 const f=await fixture();f.S.directorPriority={body:'Proposta precedente'};f.serve(()=>{throw Error('Servizio temporaneamente non disponibile');});
 await assert.rejects(f.actions['director-priorities'](),/temporaneamente/);
 const html=f.node('#dialog-content').innerHTML;assert.match(html,/Servizio temporaneamente non disponibile/);assert.match(html,/data-action="director-priorities"/);assert.doesNotMatch(html,/Proposta precedente|Sto leggendo/);assert.equal(f.S.directorPriority,null);
});

test('Elaborato social: il collegamento apre la bozza effettiva nello Sciame, anche dopo la decisione',async()=>{
 for(const state of ['DA APPROVARE','APPROVATO']) {
  const f=await fixture(),c={id:'content-fixture',client_id:'demo-bottega',title:'Bozza collegata',body:'Versione del testo',version:1,state,source:'Fixture DEMO'};
  f.S.agentOutput={client_id:'demo-bottega',links:{view:'work',contentId:c.id}};
  f.context.links=f.S.agentOutput.links;const button=f.run("agentRelatedLinks(links,'social')");assert.match(button,/data-action="agent-content" data-id="content-fixture"/);
  f.serve(call=>{if(call.path==='/api/overview')return {...f.S.overview,contents:[c]};if(call.path==='/api/workspace/approvals')return {items:[]};throw Error('Rotta inattesa '+call.path);});
  await f.actions['agent-content'](c.id);assert.equal(f.S.view,'agents');assert.equal(f.S.section,'approvals');assert.match(f.node('#dialog-content').innerHTML,/Bozza collegata/);assert.match(f.node('#dialog-content').innerHTML,/Versione del testo/);assert.match(f.node('#dialog-content').innerHTML,/data-action="edit-content"/);assert.ok(f.calls.every(x=>x.method==='GET'));
 }
});

const unknownBudget=()=>({month:'2026-10',version:0,verified:false,externalCents:null,osCents:0,previousReservedCents:0,totalCents:null,capCents:5000,stopCents:4000,availableCents:0,blocked:true,reason:'Verifica i consumi e gli impegni esterni del mese prima di autorizzare spese.',confirmedBy:null,confirmedAt:null});
async function budgetFixture(){const f=await fixture();f.S.section='budget';f.S.module={budget:{capCents:5000,fixedCents:3500,usedCents:0,availableCents:0,simulation:false,costControl:unknownBudget()},configuration:{costs:{rows:[],otherCents:0}}};return f;}
test('Budget: il totale ignoto non viene rappresentato come zero e la prova DEMO è riconoscibile',async()=>{
 const f=await budgetFixture(),html=f.run('agentsUnifiedView()');assert.match(html,/Totale da verificare/);assert.match(html,/Non verificato/);assert.match(html,/40,00/);assert.match(html,/DEMO: i dati/);assert.match(html,/Verifica consumi esterni/);
});
test('Budget: verifica esplicita, centesimi esatti e versione del mese; nessuna attivazione implicita',async()=>{
 const f=await budgetFixture();f.actions['cost-control-confirm']();const html=f.node('#dialog-content').innerHTML;
 assert.match(html,/non sommarli di nuovo/);assert.ok(!/name="confirmed"[^>]*checked/.test(html));
 const fd=new FormData();fd.set('externalEuros','20.01');await assert.rejects(f.run('formHandler')(fd),/Conferma la verifica/);assert.equal(f.calls.length,0);
 fd.set('confirmed','on');f.serve(call=>({...unknownBudget(),verified:true,blocked:false,reason:null,externalCents:2001,totalCents:2001,availableCents:1998,version:1,confirmedName:'Socio DEMO'}));
 await f.run('formHandler')(fd);assert.deepEqual(f.calls[0].body,{month:'2026-10',version:0,externalCents:2001,confirmed:true});assert.equal(f.calls[0].path,'/api/agents/cost-control');assert.equal(f.calls.length,1);
 assert.equal(f.S.module.budget.availableCents,1500);assert.equal(f.S.module.budget.costControl.version,1);assert.equal(f.node('#dialog').open,false);
});
test('Budget: ruolo e pagina errati non aprono la conferma',async()=>{
 const f=await budgetFixture();f.S.session.user.role='collaborator';assert.throws(()=>f.actions['cost-control-confirm'](),/socio/);f.S.session.user.role='owner';f.S.section='office';assert.throws(()=>f.actions['cost-control-confirm'](),/Budget/);assert.equal(f.calls.length,0);
});
test('Budget: invio obsoleto e risposta tardiva non modificano un’altra pagina o sessione',async()=>{
 const f=await budgetFixture();f.actions['cost-control-confirm']();const handler=f.run('formHandler'),fd=new FormData();fd.set('externalEuros','20');fd.set('confirmed','on');f.run("setViewRoute('agents:list')");await assert.rejects(handler(fd),/Pagina o accesso/);assert.equal(f.calls.length,0);
 for(const change of ['navigation','session']){const f=await budgetFixture(),pending=deferred();f.serve(()=>pending.promise);f.actions['cost-control-confirm']();const request=f.run('formHandler')(fd);
  if(change==='navigation')f.run("setViewRoute('agents:list')");else f.S.session={...f.S.session};
  const newer={budget:{costControl:{version:99}}};f.S.module=newer;f.node('#dialog-content').innerHTML='Nuova pagina';
  pending.resolve({...unknownBudget(),verified:true,version:1});await request;assert.equal(f.S.module,newer);assert.equal(f.node('#dialog-content').innerHTML,'Nuova pagina');
 }
});

const trialAgent=()=>({id:'quality',name:'Qualità DEMO',technicalTrial:{available:true,supported:true,configured:true,connectionVersion:7},config:{version:3,provider:'openai',estimated_cents:40,task:'Prova <script>',instructions:'Istruzioni inventate',sources:'Fonti inventate',quality:'Verifica <img>'}});
const trialResult=()=>({id:'prova-fixture',agent:'quality',status:'passed',current:true,provider:'openai',configVersion:3,connectionVersion:1,createdAt:'2026-10-10T10:00:00Z',costCents:40,costStatus:'charged',note:'COLLAUDO TECNICO · dati inventati; nessuna attivazione o pubblicazione.',output:{sintesi:'Prova <script>'}});
test('Prova AI: consenso vuoto, testi visibili, idempotenza e singola chiamata esplicita',async()=>{
 const f=await fixture();f.S.section='list';f.serve(call=>call.method==='GET'?{items:[trialAgent()]}:trialResult());await f.actions['agent-trial']('quality');
 const html=f.node('#dialog-content').innerHTML;assert.match(html,/Laboratorio Arancio DEMO/);assert.match(html,/Prova &lt;script&gt;/);assert.doesNotMatch(html,/<script>|name="confirmed"[^>]*checked/);
 const handler=f.run('formHandler'),fd=new FormData();await assert.rejects(handler(fd),/Conferma la prova/);assert.equal(f.calls.length,1);fd.set('confirmed','on');await handler(fd);
 assert.equal(f.calls[1].path,'/api/agent-config/quality/check');assert.equal(f.calls[1].clientId,null);assert.equal(f.calls[1].body.version,3);assert.equal(f.calls[1].body.connectionVersion,7);assert.equal(f.calls[1].body.confirmed,true);assert.match(f.calls[1].body.requestId,/^[a-f0-9-]{36}$/);
 assert.match(f.node('#dialog-content').innerHTML,/Prova tecnica riuscita/);assert.match(f.node('#dialog-content').innerHTML,/da riconciliare/);assert.match(f.node('#dialog-content').innerHTML,/nessuna attivazione/);assert.doesNotMatch(f.node('#dialog-content').innerHTML,/<script>/);
});
test('Prova AI: flag spento, collegamento o salvataggio mancante non offrono un invio',async()=>{
 for(const kind of ['flag','connection','version']){const f=await fixture(),agent=trialAgent();if(kind==='flag')agent.technicalTrial.available=false;if(kind==='connection')agent.technicalTrial.configured=false;if(kind==='version')agent.config.version=0;f.serve(()=>({items:[agent]}));await f.actions['agent-trial']('quality');assert.doesNotMatch(f.node('#dialog-content').innerHTML,/Avvia prova tecnica/);assert.equal(f.calls.length,1);assert.equal(f.calls[0].method,'GET');}
});
test('Prova AI: niente invio obsoleto, doppio clic o risultato tardivo su finestra diversa',async()=>{
 const f=await fixture();f.serve(()=>({items:[trialAgent()]}));await f.actions['agent-trial']('quality');const old=f.run('formHandler'),fd=new FormData();fd.set('confirmed','on');f.S.session={...f.S.session};await assert.rejects(old(fd),/Pagina o accesso/);assert.equal(f.calls.length,1);
 for(const change of ['page','session','dialog']){const f=await fixture(),pending=deferred();f.serve(call=>call.method==='GET'?{items:[trialAgent()]}:pending.promise);await f.actions['agent-trial']('quality');const handler=f.run('formHandler'),run=handler(fd);await assert.rejects(handler(fd),/già in corso/);if(change==='page')f.run("setViewRoute('agents:budget')");if(change==='session')f.S.session={...f.S.session};f.node('#dialog-content').innerHTML='Finestra successiva';pending.resolve(trialResult());await run;assert.equal(f.node('#dialog-content').innerHTML,'Finestra successiva');assert.equal(f.calls.filter(x=>x.method==='POST').length,1);}
});
test('Storico AI: sola lettura, prova superata riconoscibile, nessun invio o HTML eseguibile',async()=>{
 const f=await fixture();f.serve(()=>[{...trialResult(),current:false,configuration:{instructions:'Testo <img>'}}]);await f.actions['agent-trial-history']('quality');const html=f.node('#dialog-content').innerHTML;assert.match(html,/Prova superata: ripetere/);assert.match(html,/Istruzioni usate/);assert.doesNotMatch(html,/<img>|<script>/);assert.equal(f.calls[0].path,'/api/agent-config/quality/trials');assert.equal(f.calls[0].method,'GET');
 f.S.session.user.role='collaborator';await assert.rejects(f.actions['agent-trial-history']('quality'),/soci/);await assert.rejects(f.actions['agent-trial']('quality'),/soci/);
});
test('Configurazione agente: un form rimasto aperto non salva dopo cambio sessione',async()=>{
 const f=await fixture();f.serve(()=>({items:[trialAgent()]}));await f.actions['agent-config']('quality');const handler=f.run('formHandler');f.S.session={...f.S.session};await assert.rejects(handler(new FormData()),/Pagina o accesso/);assert.equal(f.calls.length,1);
});

const workPreview=()=>({fingerprint:'impronta-fixture',provider:'openai',estimatedCents:40,configuration:{task:'Bozze',instructions:'Istruzioni <script>',sources:'Fonte inventata',quality:'Verifica'},context:{client:{id:'demo-bottega',name:'Bottega DEMO'},brief:'Un post inventato',memory:[{kind:'master',content:'Brief <img>',version:1,source:'Fixture'}]}});
const workResult=()=>({id:'work-fixture',clientId:'demo-bottega',status:'done',createdAt:'2026-10-10T10:00:00Z',costCents:40,costStatus:'charged',result:{note:'Bozze da approvare',links:{contents:[{title:'Prima bozza',contentId:'content-fixture'}]}},rawOutput:{sintesi:'Risultato <script>'},quality:[]});
test('Incarico AI: prima anteprima, poi dati e costo confermati; bozza collegata al cliente esatto',async()=>{
 const f=await fixture();f.serve(call=>call.path.endsWith('/preview')?workPreview():workResult());f.actions['agent-work-start']('social');let fd=new FormData();fd.set('brief','Un post inventato');await f.run('formHandler')(fd);assert.equal(f.calls.length,1);assert.equal(f.calls[0].path,'/api/agent-work/social/preview');assert.equal(f.calls[0].clientId,'demo-bottega');
 const html=f.node('#dialog-content').innerHTML;assert.match(html,/Istruzioni &lt;script&gt;/);assert.match(html,/Brief &lt;img&gt;/);assert.doesNotMatch(html,/<script>|<img>|name="confirmed"[^>]*checked/);
 fd=new FormData();await assert.rejects(f.run('formHandler')(fd),/Conferma i dati/);assert.equal(f.calls.length,1);fd.set('confirmed','on');await f.run('formHandler')(fd);assert.equal(f.calls[1].path,'/api/agent-work/social/run');assert.equal(f.calls[1].body.fingerprint,'impronta-fixture');assert.equal(f.calls[1].body.confirmed,true);assert.equal(f.calls[1].clientId,'demo-bottega');assert.equal(f.S.agentOutput.client_id,'demo-bottega');assert.match(f.node('#dialog-content').innerHTML,/data-action="agent-content" data-id="content-fixture"/);assert.doesNotMatch(f.node('#dialog-content').innerHTML,/<script>/);
});
test('Incarico AI: cambio cliente impedisce invio obsoleto e risultato tardivo',async()=>{
 const f=await fixture();f.serve(()=>workPreview());f.actions['agent-work-start']('social');const first=f.run('formHandler'),fd=new FormData();fd.set('brief','Prova');f.S.clientId='demo-bigant';await assert.rejects(first(fd),/Pagina o accesso/);assert.equal(f.calls.length,0);
 for(const stage of ['preview','run']){const f=await fixture(),pending=deferred();f.serve(call=>(stage==='preview'||call.path.endsWith('/run'))?pending.promise:workPreview());f.actions['agent-work-start']('social');let request=f.run('formHandler')(fd);if(stage==='run'){await request;const yes=new FormData();yes.set('confirmed','on');request=f.run('formHandler')(yes);await assert.rejects(f.run('formHandler')(yes),/già in corso/);}f.S.clientId='demo-bigant';f.node('#dialog-content').innerHTML='Cliente diverso';pending.resolve(stage==='preview'?workPreview():workResult());await request;assert.equal(f.node('#dialog-content').innerHTML,'Cliente diverso');}
});
test('Autorizzazione operativa: checkbox richiesta e legame a prova, istruzioni e collegamento',async()=>{
 const f=await fixture(),agent={...trialAgent(),id:'social',operational:{supported:true,ready:true,active:false,authorizationVersion:2,connectionVersion:7,trialId:'prova-esatta',note:'Solo bozze manuali'}};f.serve(()=>({items:[agent]}));await f.actions['agent-work-authorize']('social');assert.doesNotMatch(f.node('#dialog-content').innerHTML,/name="confirmed"[^>]*checked/);const fd=new FormData();await assert.rejects(f.run('formHandler')(fd),/Conferma l’autorizzazione/);fd.set('confirmed','on');f.serve(call=>{f.S.module={};return {active:true};});await f.run('formHandler')(fd);assert.deepEqual(f.calls[1].body,{enabled:true,confirmed:true,authorizationVersion:2,version:3,connectionVersion:7,trialId:'prova-esatta'});assert.equal(f.calls[1].path,'/api/agent-work/social/authorize');assert.equal(f.calls[1].clientId,null);
});
test('Elaborazione AI: recupero in sola lettura con attività dello storico e protezione della finestra',async()=>{
 const f=await fixture();f.S.module.jobs=[{id:'work-fixture',client_id:'demo-bottega'}];f.S.clientId='demo-bigant';f.serve(()=>workResult());await f.actions['agent-work-result']('work-fixture');assert.equal(f.calls[0].method,'GET');assert.equal(f.calls[0].clientId,'demo-bottega');assert.match(f.node('#dialog-content').innerHTML,/Bozze da approvare/);
 const pending=deferred();f.serve(()=>pending.promise);const run=f.actions['agent-work-result']('work-fixture');f.S.session={...f.S.session};f.node('#dialog-content').innerHTML='Altra sessione';pending.resolve(workResult());await run;assert.equal(f.node('#dialog-content').innerHTML,'Altra sessione');
});

test('Ufficio: incarico AI etichettato correttamente, costo in euro e risultato apribile',async()=>{
 const f=await fixture(),row={id:'social',nome:'Social',stato:'in_attesa_approvazione',compito:'Da approvare',sciame:true,costoMeseCents:40,costoMeseUsdMicro:0,ultimoOutput:{jobId:'work-fixture',clientId:'demo-bottega',motoreEtichetta:'AI · bozze manuali',sintesi:'Bozza',quando:'2026-10-10T10:00:00Z'}};f.context.deskFixture=row;const html=f.run('scrivania(deskFixture)');assert.match(html,/data-action="agent-work-office"/);assert.match(html,/0,40/);assert.doesNotMatch(html,/0 USD|Procedura DEMO/);f.S.module.stanze=[{agenti:[row]}];f.serve(()=>workResult());await f.actions['agent-work-office']('work-fixture');assert.equal(f.calls[0].clientId,'demo-bottega');assert.match(f.node('#dialog-content').innerHTML,/Bozze da approvare/);
});

test('Qualità: sceglie una sola bozza propria e mostra versione, testo e consenso prima del trasporto',async()=>{
 const f=await fixture();f.actions['agent-work-start']('quality');assert.match(f.node('#dialog-content').innerHTML,/Nessuna bozza/);assert.equal(f.calls.length,0);
 const draft={id:'draft-quality',client_id:'demo-bottega',service:'social',state:'DA APPROVARE',title:'Bozza <script>',body:'Testo <img src=x>',source:'Fonte inventata',version:2};
 f.S.overview.contents=[draft,{...draft,id:'other',client_id:'demo-bigant',title:'ALTRA ATTIVITÀ'},{...draft,id:'approved',state:'APPROVATO',title:'GIÀ APPROVATO'}];
 const preview=workPreview();preview.context.draft=draft;const result={...workResult(),agent:'quality'};result.result.review={version:2,verdict:'da_correggere',summary:'Rilievi <script>',findings:[{gravita:'importante',regola:'Fonti',dove:'Introduzione',problema:'Testo <img>',correzione:'Verifica'}],automatic:[],current:true};
 f.serve(call=>call.path.endsWith('/preview')?preview:result);f.actions['agent-work-start']('quality');assert.match(f.node('#dialog-content').innerHTML,/Bozza &lt;script&gt; · v2/);assert.doesNotMatch(f.node('#dialog-content').innerHTML,/ALTRA ATTIVITÀ|GIÀ APPROVATO/);
 const fd=new FormData();fd.set('contentId',draft.id);fd.set('brief','Controlla le fonti');await f.run('formHandler')(fd);assert.equal(f.calls[0].body.contentId,draft.id);assert.equal(f.calls[0].clientId,'demo-bottega');assert.match(f.node('#dialog-content').innerHTML,/Bozza da controllare · versione 2/);assert.match(f.node('#dialog-content').innerHTML,/Testo &lt;img src=x&gt;/);assert.doesNotMatch(f.node('#dialog-content').innerHTML,/<script>|<img|name="confirmed"[^>]*checked/);
 await assert.rejects(f.run('formHandler')(new FormData()),/Conferma i dati/);const yes=new FormData();yes.set('confirmed','on');await f.run('formHandler')(yes);assert.equal(f.calls[1].body.contentId,draft.id);assert.equal(f.calls[1].path,'/api/agent-work/quality/run');assert.match(f.node('#dialog-content').innerHTML,/Rilievi &lt;script&gt;/);assert.doesNotMatch(f.node('#dialog-content').innerHTML,/data-action="approval"/);
});

test('Qualità: collaboratore legge il parere, vede quello superato e una risposta tardiva non cambia la sessione',async()=>{
 const f=await fixture();f.S.session.user.role='collaborator';const draft={id:'draft-quality',client_id:'demo-bottega',service:'social',title:'Bozza',body:'Testo',version:2,state:'DA APPROVARE'};f.S.overview.contents=[draft];
 const review={version:1,current:false,verdict:'approvabile',summary:'Parere vecchio <script>',findings:[],automatic:[]};f.serve(()=>review);await f.actions['quality-review'](draft.id);assert.equal(f.calls[0].method,'GET');assert.equal(f.calls[0].clientId,draft.client_id);assert.match(f.node('#dialog-content').innerHTML,/Revisione superata/);assert.doesNotMatch(f.node('#dialog-content').innerHTML,/<script>|data-action="approval"/);
 const pending=deferred();f.serve(()=>pending.promise);const read=f.actions['quality-review'](draft.id);f.S.session={...f.S.session};f.node('#dialog-content').innerHTML='Altra sessione';pending.resolve(review);await read;assert.equal(f.node('#dialog-content').innerHTML,'Altra sessione');
 f.S.session.user.role='client';await assert.rejects(f.actions['quality-review'](draft.id),/riservata/);
});
