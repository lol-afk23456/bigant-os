import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

const channels=[['instagram','Instagram'],['facebook','Facebook'],['linkedin','LinkedIn aziendale'],['tiktok','TikTok'],['google-business','Google Business Profile'],['website','Sito web']];
const data=(clientId='demo-bottega')=>({clientId,canEdit:true,items:channels.map(([id,name])=>({id,name,status:'Da collegare',lastSync:null,metrics:null,reviews:null,link:null}))});
const link=(extra={})=>({url:'https://www.instagram.com/bottega_demo/',sourceUrl:'https://bottega.example/contatti',version:3,updatedAt:'2026-10-13T08:00:00.000Z',confirmation:'owner',...extra});
const values=(extra={})=>({url:'https://www.instagram.com/bottega_demo/',sourceUrl:'https://bottega.example/contatti',confirmedBusiness:'on',...extra});
const response=value=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>value});
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
const fd=values=>{const result=new FormData();for(const [key,value] of Object.entries(values))result.set(key,String(value));return result;};

async function fixture(){
 const nodes=new Map(),calls=[];
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',open:false,addEventListener(){},replaceChildren(){this.innerHTML='';},showModal(){this.open=true;},close(){this.open=false;},focus(){}});return nodes.get(selector);};
 const context=vm.createContext({URL,URLSearchParams,Date,Intl,FormData,crypto:{randomUUID},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},window:{},history:{replaceState(){}},location:{origin:'http://127.0.0.1:4330',pathname:'/',hash:'',search:''},document:{querySelector:node,addEventListener(){},hidden:false},fetch:async()=>response({user:null,demo:true,profiles:[]})});
 for(const file of ['app.js','ufficio.js','cliente.js','workspace.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),context,{filename:file});
 await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S'),actions=run('ACTIONS');
 S.session={user:{id:'owner-fixture',role:'owner',name:'Socio DEMO'},demo:false,csrf:'csrf-fixture'};S.view='profiles';S.section='';S.clientId='demo-bottega';
 S.overview={clients:[{id:'demo-bottega',name:'Bottega DEMO'},{id:'demo-bigant',name:'Agenzia DEMO'}],currentClient:{id:'demo-bottega',name:'Bottega DEMO'},navigation:{landing:'home',items:[['home','Home','grid','Lavoro'],['profiles','Profili','globe','Lavoro']]}};
 S.module=data();let serve=call=>{throw Error('Richiesta inattesa '+call.path);};
 context.fetch=async(url,options={})=>{const u=new URL(url),call={path:u.pathname,clientId:u.searchParams.get('clientId'),method:options.method||'GET',body:options.body===undefined?undefined:JSON.parse(options.body)};calls.push(call);return response(await serve(call));};
 return {S,actions,calls,run,node,serve:fn=>{serve=fn;},html:()=>node('#dialog-content').innerHTML,page:()=>node('#app').innerHTML,view:()=>run('workspaceProfilesView()'),submit:values=>run('formHandler')(fd(values))};
}

test('Profili: griglia compatta di sei canali senza aprire dettagli né richieste esterne',async()=>{
 const f=await fixture();f.S.module.items[0].link=link();const html=f.view();assert.deepEqual([...html.matchAll(/data-view="([^"]+)"/g)].map(m=>m[1]),channels.map(([id])=>'profiles:'+id));
 assert.match(html,/Indirizzo registrato/);assert.match(html,/Account: Da collegare/);assert.match(html,/LinkedIn aziendale/);assert.doesNotMatch(html,/href="https:|Ultima sincronizzazione|Fonte dell’indirizzo|data-action="profile-edit"/);assert.equal(f.calls.length,0);
});

test('Profili: un canale per volta, Indietro, dati mancanti e recensioni Google senza numeri inventati',async()=>{
 const f=await fixture();f.S.section='instagram';let html=f.view();assert.match(html,/data-action="goto" data-id="profiles"/);assert.match(html,/Indirizzo da aggiungere/);assert.match(html,/Non ancora disponibili/);assert.match(html,/Non ancora effettuata/);assert.doesNotMatch(html,/Recensioni|LinkedIn|Facebook|data-view=/);
 f.S.section='google-business';html=f.view();assert.match(html,/<h3>Recensioni<\/h3>/);assert.match(html,/Non ancora disponibili/);assert.doesNotMatch(html,/0 recensioni|Media|class="stat/);
 f.S.section='linkedin';html=f.view();assert.match(html,/soltanto pagine LinkedIn aziendali/);assert.doesNotMatch(html,/data-view=|Recensioni/);assert.equal(f.calls.length,0);
});

test('Profili: link e fonte distinti, escaped, finestra isolata e data manuale diversa dalla sincronizzazione',async()=>{
 const f=await fixture();f.S.section='instagram';f.S.module.items[0].name='Instagram <img>';f.S.module.items[0].link=link({sourceUrl:'https://fonte.example/scheda?a=uno&b=%22test%22'});const html=f.view();
 assert.match(html,/Instagram &lt;img&gt;/);assert.doesNotMatch(html,/<img|onerror=/);assert.match(html,/Fonte dell’indirizzo/);assert.match(html,/https:\/\/fonte.example\/scheda\?a=uno&amp;b=%22test%22/);
 assert.equal([...html.matchAll(/target="_blank" rel="noopener noreferrer"/g)].length,2);assert.match(html,/aria-label="Apri il profilo pubblico"/);assert.match(html,/aria-label="Apri la fonte"/);assert.match(html,/Corrispondenza confermata manualmente da un socio/);assert.match(html,/verifica indipendente/);assert.match(html,/datetime="2026-10-13T08:00:00.000Z"/);assert.match(html,/Roma/);assert.match(html,/Non ancora effettuata/);assert.match(html,/Account e dati della piattaforma/);assert.match(html,/Da collegare/);
});

test('Profili: URL eseguibili o personali LinkedIn non diventano collegamenti esterni',async()=>{
 const f=await fixture();f.S.section='linkedin';const row=f.S.module.items[2];
 for(const url of ['javascript:alert(1)','data:text/html,<script>','http://www.linkedin.com/company/demo','https://www.linkedin.com/in/persona/','https://altro.example/company/demo/','https://user:pass@www.linkedin.com/company/demo/']){row.link=link({url,sourceUrl:'javascript:alert(2)'});assert.doesNotMatch(f.view(),/<a href=|target="_blank"/);}
 row.link=link({url:'https://www.linkedin.com/company/bottega-demo/'});assert.match(f.view(),/href="https:\/\/www.linkedin.com\/company\/bottega-demo\/"/);
});

test('Profili: assenze, cliente errato e canale sconosciuto non riusano dettagli vecchi o stati operativi',async()=>{
 const f=await fixture();f.S.section='sconosciuto';assert.match(f.view(),/Canale non disponibile/);assert.doesNotMatch(f.view(),/data-view=|profile-edit/);
 f.S.section='instagram';f.S.module.items[0].status='Connesso';assert.match(f.view(),/Stato non disponibile/);assert.doesNotMatch(f.view(),/>Connesso</);
 f.S.module.clientId='altra-attivita';assert.match(f.view(),/Profili non disponibili/);assert.doesNotMatch(f.view(),/profile-edit|Indirizzo da aggiungere/);f.S.module=null;assert.match(f.view(),/Profili non disponibili/);
});

test('Profili: sola lettura per cliente e collaboratore anche con canEdit incoerente; socio richiede canEdit',async()=>{
 const f=await fixture();f.S.section='instagram';f.S.module.items[0].link=link();
 for(const role of ['client','collaborator']){f.S.session.user.role=role;const html=f.view();assert.match(html,/href="https:\/\/www.instagram.com/);assert.doesNotMatch(html,/data-action="profile-edit"/);assert.throws(()=>f.actions['profile-edit']('instagram'),/Solo un socio/);}
 f.S.session.user.role='owner';f.S.module.canEdit=false;assert.doesNotMatch(f.view(),/data-action="profile-edit"/);assert.throws(()=>f.actions['profile-edit']('instagram'),/Solo un socio/);assert.equal(f.calls.length,0);
});

test('Profili: conferma dell’attività obbligatoria, URL/fonte validi, primo salvataggio versione zero',async()=>{
 const f=await fixture();f.S.section='instagram';f.actions['profile-edit']('instagram');assert.match(f.html(),/name="confirmedBusiness" required/);assert.doesNotMatch(f.html(),/name="confirmedBusiness"[^>]*checked/);assert.match(f.html(),/appartiene a Bottega DEMO/);assert.match(f.html(),/name="sourceUrl" type="url"/);assert.equal(f.calls.length,0);
 await assert.rejects(f.submit({url:values().url,sourceUrl:values().sourceUrl}),/Conferma che il profilo/);
 for(const extra of [{url:'javascript:alert(1)'},{sourceUrl:''},{sourceUrl:'https://user:password@fonte.example/'},{sourceUrl:'https://fonte.example:8443/'}])await assert.rejects(f.submit(values(extra)),/HTTPS validi/);
 assert.equal(f.calls.length,0);const updated=data();updated.items[0].link=link({version:1});f.serve(()=>updated);await f.submit(values());
 assert.deepEqual(f.calls,[{path:'/api/workspace/profiles/instagram',clientId:'demo-bottega',method:'PATCH',body:{version:0,url:values().url,sourceUrl:values().sourceUrl,confirmedBusiness:true}}]);assert.equal(f.S.module,updated);assert.equal(f.node('#dialog').open,false);assert.match(f.page(),/Fonte dell’indirizzo/);assert.match(f.page(),/Da collegare/);assert.match(f.node('#toast').textContent,/Account ancora da collegare/);
});

test('Profili: modifica conserva URL, fonte e versione; LinkedIn limita l’inserimento alle aziende',async()=>{
 const f=await fixture();f.S.section='linkedin';f.S.module.items[2].link=link({url:'https://www.linkedin.com/company/demo/'});f.actions['profile-edit']('linkedin');assert.match(f.html(),/value="https:\/\/www.linkedin.com\/company\/demo\/"/);assert.match(f.html(),/value="https:\/\/bottega.example\/contatti"/);
 await assert.rejects(f.submit(values({url:'https://www.linkedin.com/in/persona/'})),/pagina LinkedIn aziendale/);assert.equal(f.calls.length,0);f.serve(()=>data());await f.submit(values({url:'https://www.linkedin.com/company/nuova-demo/'}));assert.equal(f.calls[0].path,'/api/workspace/profiles/linkedin');assert.equal(f.calls[0].body.version,3);assert.equal(f.calls[0].body.url,'https://www.linkedin.com/company/nuova-demo/');
});

test('Profili: cambio contesto o permessi prima del salvataggio impedisce qualsiasi PATCH',async()=>{
 const changes=[f=>{f.S.clientId='demo-bigant';},f=>{f.S.view='home';},f=>{f.S.section='facebook';},f=>{f.S.navigation++;},f=>{f.S.session={...f.S.session};},f=>{f.S.session.user.id='owner-altro';},f=>{f.S.session.csrf='csrf-altro';},f=>{f.S.session.user.role='client';},f=>{f.S.module.canEdit=false;},f=>{f.S.module=data();},f=>{f.S.loading++;},f=>{f.S.module.items[0].link=link();},f=>{f.node('#dialog').close();},f=>{f.run('dialog("Altro dettaglio","Testo")');}];
 for(const change of changes){const f=await fixture();f.S.section='instagram';f.actions['profile-edit']('instagram');change(f);await assert.rejects(f.submit(values()),/Attività, pagina o accesso cambiati/);assert.equal(f.calls.length,0);}
});

test('Profili: risposta tardiva non modifica altra attività, sessione o dialogo',async()=>{
 for(const change of [f=>{f.S.clientId='demo-bigant';f.S.module=data('demo-bigant');},f=>{f.S.session={...f.S.session};},f=>{f.S.navigation++;},f=>{f.run('dialog("Altro dettaglio","Da conservare")');}]){
  const f=await fixture(),wait=deferred();f.S.section='instagram';f.actions['profile-edit']('instagram');f.serve(()=>wait.promise);const pending=f.submit(values());assert.equal(f.calls.length,1);change(f);const module=f.S.module,dialog=f.html();wait.resolve(data());await pending;assert.equal(f.S.module,module);assert.equal(f.html(),dialog);assert.equal(f.node('#toast').textContent,'');assert.equal(f.calls[0].clientId,'demo-bottega');
 }
});

test('Profili: richieste duplicate bloccate in attesa e conflitto di versione richiede rilettura senza sovrascrivere',async()=>{
 const f=await fixture(),wait=deferred();f.S.section='instagram';f.S.module.items[0].link=link();f.actions['profile-edit']('instagram');f.serve(()=>wait.promise);const pending=f.submit(values());await assert.rejects(f.submit(values()),/Salvataggio già in corso/);assert.equal(f.calls.length,1);wait.resolve(data());await pending;
 f.S.module.items[0].link=link();f.actions['profile-edit']('instagram');f.serve(()=>{throw Error('Versione superata. Riapri la scheda.');});const before=f.S.module;await assert.rejects(f.submit(values()),/Versione superata/);assert.equal(f.S.module,before);assert.equal(f.node('#dialog').open,true);assert.match(f.html(),/Rileggi scheda/);assert.equal(f.calls.at(-1).body.version,3);assert.equal(f.calls.length,2);
});

test('Profili: errore tardivo non riporta il vecchio salvataggio nel dialogo o nella pagina nuova',async()=>{
 for(const change of [f=>{f.S.clientId='demo-bigant';f.S.module=data('demo-bigant');},f=>{f.S.navigation++;},f=>{f.run('dialog("Altro dettaglio","Da conservare")');}]){
  const f=await fixture(),wait=deferred();f.S.section='instagram';f.actions['profile-edit']('instagram');f.serve(()=>wait.promise);const pending=f.submit(values());change(f);const markup=f.html(),before=f.S.module;wait.reject(Error('Vecchio errore da ignorare'));await assert.doesNotReject(pending);assert.equal(f.S.module,before);assert.equal(f.html(),markup);assert.equal(f.node('#toast').textContent,'');
 }
});

test('Profili: risposte di altro cliente o prive del contratto non vengono mostrate come salvate',async()=>{
 for(const result of [data('altra-attivita'),{clientId:'demo-bottega'}]){const f=await fixture();f.S.section='instagram';const before=f.S.module;f.actions['profile-edit']('instagram');f.serve(()=>result);await assert.rejects(f.submit(values()),/Risposta del profilo non verificabile/);assert.equal(f.S.module,before);assert.equal(f.node('#dialog').open,true);assert.equal(f.node('#toast').textContent,'');}
});

test('Profili: nomi e URL precompilati non creano markup nel modulo',async()=>{
 const f=await fixture();f.S.overview.clients[0].name='Attività <script>';f.S.module.items[0].name='Canale <img>';f.S.module.items[0].link=link({url:'https://www.instagram.com/demo/" onfocus="bad',sourceUrl:'https://fonte.example/<svg>'});f.actions['profile-edit']('instagram');assert.match(f.html(),/Attività &lt;script&gt;/);assert.match(f.html(),/Canale &lt;img&gt;/);assert.match(f.html(),/onfocus=&quot;bad/);assert.doesNotMatch(f.html(),/<script>|<img|<svg>| onfocus="/);assert.equal(f.calls.length,0);
});

test('Profili: navigazione e aggiornamento leggono il cliente corrente senza alterare il menu ricevuto dal server',async()=>{
 const f=await fixture();let current=data();f.serve(call=>call.path==='/api/overview'?f.S.overview:current);await f.actions.goto('profiles:instagram');assert.match(f.page(),/Indirizzo da aggiungere/);assert.equal(f.S.section,'instagram');assert.deepEqual(f.calls.map(call=>call.path),['/api/overview','/api/workspace/profiles']);assert.ok(f.calls.every(call=>call.method==='GET'&&call.clientId==='demo-bottega'));
 current=data();current.items[0].link=link();await f.actions.refresh();assert.match(f.page(),/Fonte dell’indirizzo/);assert.match(f.page(),/www.instagram.com/);assert.equal(f.calls.length,4);
 f.S.session.user.role='client';f.S.overview.navigation.items=[['client','La tua attività','eye','Lavoro']];assert.doesNotMatch(f.run('navigationMarkup()'),/data-view="profiles"/);
});
