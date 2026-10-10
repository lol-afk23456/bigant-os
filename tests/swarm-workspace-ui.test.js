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
