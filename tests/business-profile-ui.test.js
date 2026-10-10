import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

const response=value=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>value});
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
const fd=values=>{const result=new FormData();for(const [key,value] of Object.entries(values))result.set(key,String(value));return result;};
const date=(day)=>({year:2026,month:9,day});
const cache=()=>({source:'Google Business Profile',sourceUrl:'https://maps.google.com/?cid=123',fetchedAt:'2026-10-10T08:00:00.000Z',expiresAt:'2099-10-11T08:00:00.000Z',from:'2026-09-09',to:'2026-10-06',location:{name:'locations/fixture',title:'Bottega DEMO',storefrontAddress:{addressLines:['Via DEMO 1'],postalCode:'00000',locality:'Città DEMO'},websiteUri:'https://bottega.example/',phoneNumbers:{primaryPhone:'0000000000'}},reviews:{reviews:[{reviewId:'review-fixture',reviewer:{displayName:'Autore DEMO'},starRating:'FOUR',comment:'Recensione inventata',updateTime:'2026-10-01T08:00:00Z',reviewReply:{comment:'Risposta già esistente'}}],averageRating:4,totalReviewCount:53,nextPageToken:'next-reviews'},performance:{multiDailyMetricTimeSeries:[{dailyMetricTimeSeries:[{dailyMetric:'WEBSITE_CLICKS',timeSeries:{datedValues:[{date:date(9),value:'12'},{date:date(10)},{date:date(11),value:'0'},{date:date(12),value:null}]}}]}]}});
const state=extra=>({available:true,configured:false,version:0,status:'Da collegare',checked:false,enabled:false,daily:false,lastSync:null,error:null,canManage:true,data:null,note:'Configura la lettura della scheda.',...extra});
const profiles=()=>({clientId:'demo-bottega',canEdit:true,items:[['instagram','Instagram'],['facebook','Facebook'],['linkedin','LinkedIn aziendale'],['tiktok','TikTok'],['google-business','Google Business Profile'],['website','Sito web']].map(([id,name])=>({id,name,status:'Da collegare',lastSync:null,metrics:null,reviews:null,link:null})),businessProfile:state()});
const auth=()=>({available:true,configured:true,connected:false,version:4,connectionVersion:7,email:'socio@demo.example',lastCheck:null,authorizedBy:'owner-fixture'});
async function fixture(){
 const nodes=new Map(),calls=[],redirects=[],history=[],timers=[];
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',open:false,addEventListener(){},replaceChildren(){this.innerHTML='';},showModal(){this.open=true;},close(){this.open=false;},focus(){}});return nodes.get(selector);};
 const context=vm.createContext({URL,URLSearchParams,Date,Intl,FormData,crypto:{randomUUID},setInterval:()=>0,setTimeout:(callback,delay)=>{timers.push({callback,delay});return timers.length;},clearTimeout(){},window:{},history:{replaceState:(_a,_b,path)=>history.push(path)},location:{origin:'http://127.0.0.1:4330',pathname:'/',hash:'',search:'',assign:url=>redirects.push(url)},document:{querySelector:node,addEventListener(){},hidden:false},fetch:async()=>response({user:null,demo:true,profiles:[]})});
 for(const file of ['app.js','ufficio.js','cliente.js','workspace.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),context,{filename:file});await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S'),actions=run('ACTIONS');S.session={user:{id:'owner-fixture',role:'owner',name:'Socio DEMO'},demo:false,csrf:'csrf-fixture'};S.view='profiles';S.section='google-business';S.clientId='demo-bottega';S.overview={clients:[{id:'demo-bottega',name:'Bottega DEMO'}],currentClient:{id:'demo-bottega'},navigation:{landing:'profiles',items:[['profiles','Profili'],['connections','Collegamenti']]}};S.module=profiles();
 let serve=call=>{throw Error('Richiesta inattesa '+call.path);};context.fetch=async(url,options={})=>{const u=new URL(url),call={path:u.pathname,clientId:u.searchParams.get('clientId'),method:options.method||'GET',body:options.body===undefined?undefined:JSON.parse(options.body),csrf:options.headers?.['X-CSRF-Token']};calls.push(call);return response(await serve(call));};
 return {S,actions,calls,redirects,history,timers,context,run,node,serve:fn=>{serve=fn;},html:()=>node('#dialog-content').innerHTML,page:()=>node('#app').innerHTML,view:()=>run('workspaceProfilesView()'),submit:values=>run('formHandler')(fd(values)),oauth:()=>{S.view='connections';S.section='gbp';S.module={vaultReady:true,items:[{id:'gbp',name:'Google Business Profile',status:'Da collegare',fields:[],authorization:auth(),configured:true,version:7}]};}};
}
const accounts={items:[{name:'accounts/fixture',label:'Account DEMO'}],nextPageToken:'account-next'};
const locations={items:[{name:'locations/fixture',title:'Bottega DEMO',address:'Via DEMO 1',selectionToken:'selection-fixture'}],nextPageToken:'location-next'};

test('GBP: conserva sei link pubblici, cache assente distinta da ultima sincronizzazione storica',async()=>{
 const f=await fixture();f.S.module.businessProfile.lastSync='2026-10-09T08:00:00Z';f.S.section='';assert.equal([...f.view().matchAll(/data-view="profiles:/g)].length,6);f.S.section='google-business';const html=f.view();assert.match(html,/profile-edit/);assert.match(html,/Ultima lettura registrata/);assert.match(html,/Non ancora disponibili/);assert.doesNotMatch(html,/Totale dichiarato|Valutazione media|0 recensioni/);assert.equal(f.calls.length,0);
 f.S.section='instagram';assert.match(f.view(),/Ultima sincronizzazione/);assert.doesNotMatch(f.view(),/business-profile-choose|Google Maps/);
});

test('GBP: mostra soltanto dati forniti, fonte/data/scadenza, prima pagina recensioni e nessuna immagine remota',async()=>{
 const f=await fixture();f.S.module.businessProfile=state({configured:true,checked:true,data:cache(),lastSync:'2026-10-10T08:00:00Z'});const html=f.view();assert.match(html,/Dati letti da Google/);assert.match(html,/Google Business Profile/);assert.match(html,/Copia temporanea disponibile fino a/);assert.match(html,/maps.google.com/);assert.match(html,/target="_blank" rel="noopener noreferrer"/);assert.match(html,/53/);assert.match(html,/ulteriori recensioni/);assert.match(html,/Risposta già pubblicata su Google/);assert.match(html,/0 \(valore omesso da Google\)/);assert.match(html,/>0<\/td>/);assert.match(html,/Non fornito/);assert.match(html,/Non ancora disponibili/);assert.doesNotMatch(html,/<img|business-profile-reply|Somma|Totale clic/);assert.equal(f.calls.length,0);
});

test('GBP: zero omesso solo per punto datato ricevuto; null, giorno e serie assenti non diventano zero',async()=>{
 const f=await fixture();const html=f.run('businessProfilePerformance({multiDailyMetricTimeSeries:[{dailyMetricTimeSeries:[{dailyMetric:"CALL_CLICKS",timeSeries:{datedValues:[{date:{year:2026,month:9,day:10}},{date:{year:2026,month:9,day:11},value:null},{}]}}]}]})');assert.equal([...html.matchAll(/0 \(valore omesso da Google\)/g)].length,1);assert.equal([...html.matchAll(/Non fornito<\/td>/g)].length,2);assert.equal([...html.matchAll(/Non ancora disponibili/g)].length,2);assert.doesNotMatch(html,/12\/09\/2026/);
});

test('GBP: escape di scheda, recensioni, risposte e URL; nessun caricamento di foto',async()=>{
 const f=await fixture(),data=cache();data.location.title='<script>titolo';data.location.websiteUri='javascript:alert(1)';data.sourceUrl='javascript:alert(2)';data.reviews.reviews[0].reviewer={displayName:'<img>',profilePhotoUrl:'https://foto.example/private'};data.reviews.reviews[0].comment='<iframe>';data.reviews.reviews[0].reviewReply.comment='<svg>';f.S.module.businessProfile=state({configured:true,checked:true,data});const html=f.view();assert.match(html,/&lt;script&gt;|&lt;img&gt;|&lt;iframe&gt;|&lt;svg&gt;/);assert.doesNotMatch(html,/<script>|<img|<iframe|<svg>|href="javascript:|foto.example/);
});

test('GBP: risultati fuori dal registro pubblico del cliente; nessun ruolo non socio gestisce',async()=>{
 const f=await fixture();f.S.module.businessProfile=state({checked:true,configured:true,enabled:false,data:cache()});f.S.session.user.role='client';assert.doesNotMatch(f.view(),/Recensione inventata|business-profile-choose|business-profile-activate|business-profile-check/);f.S.module.businessProfile.enabled=true;assert.doesNotMatch(f.view(),/Recensione inventata/);assert.throws(()=>f.actions['business-profile-check'](),/come socio/);f.S.session.user.role='collaborator';assert.doesNotMatch(f.view(),/Recensione inventata/);assert.equal(f.calls.length,0);
});

test('GBP: cache scaduta assente e attivazione nascosta anche con vecchio controllo positivo',async()=>{
 const f=await fixture(),data=cache();data.expiresAt='2000-01-01T00:00:00Z';f.S.module.businessProfile=state({configured:true,checked:true,data});const html=f.view();assert.doesNotMatch(html,/Recensione inventata|business-profile-activate/);assert.match(html,/copia temporanea è assente, scaduta/);assert.throws(()=>f.actions['business-profile-activate'](),/dati correnti/);
});

test('GBP: la pagina aperta elimina la copia alla scadenza senza richieste, senza toccare un’altra attività',async()=>{
 const f=await fixture();f.S.module.businessProfile=state({configured:true,checked:true,data:cache()});f.view();const timer=f.timers.at(-1);assert.ok(timer.delay>0&&timer.delay<=86400000);timer.callback();assert.equal(f.S.module.businessProfile.data,null);assert.doesNotMatch(f.page(),/Recensione inventata/);assert.match(f.page(),/Non ancora disponibili/);assert.equal(f.calls.length,0);
 f.S.module.businessProfile=state({data:cache()});f.view();const old=f.timers.at(-1);f.S.module=profiles();const current=f.S.module;old.callback();assert.equal(f.S.module,current);
});

test('GBP: account e schede richiedono letture esplicite, token scelto e conferma prima della configurazione',async()=>{
 const f=await fixture();f.serve(call=>call.path.endsWith('/accounts')?accounts:call.path.endsWith('/locations')?locations:state({configured:true,version:1}));await f.actions['business-profile-choose']();assert.equal(f.calls.length,1);assert.deepEqual(f.calls[0].body,{});assert.match(f.html(),/Account DEMO/);await assert.rejects(f.submit({accountName:'accounts/estraneo'}),/presente nell’elenco/);assert.equal(f.calls.length,1);
 await f.submit({accountName:'accounts/fixture'});assert.equal(f.calls.length,2);assert.deepEqual(f.calls[1].body,{accountName:'accounts/fixture'});assert.match(f.html(),/selection-fixture/);await assert.rejects(f.submit({selectionToken:'arbitrario'}),/presente nell’elenco/);
 await f.submit({selectionToken:'selection-fixture'});assert.equal(f.calls.length,2);assert.match(f.html(),/Conferma la corrispondenza/);assert.match(f.html(),/Bottega DEMO/);assert.doesNotMatch(f.html(),/name="confirmedBusiness" checked/);await assert.rejects(f.submit({}),/Conferma la corrispondenza/);await f.submit({confirmedBusiness:'on'});assert.equal(f.calls.length,3);assert.equal(f.calls[2].path,'/api/business-profile/configure');assert.deepEqual(f.calls[2].body,{version:0,selectionToken:'selection-fixture',confirmedBusiness:true});assert.ok(f.calls.every(call=>call.clientId==='demo-bottega'));assert.equal(f.S.module.businessProfile.configured,true);
});

test('GBP: pagine successive di account e schede richieste soltanto dal pulsante dedicato',async()=>{
 const f=await fixture();f.serve(call=>call.path.endsWith('/accounts')?accounts:locations);await f.actions['business-profile-choose']();assert.equal(f.calls.length,1);await f.actions['business-profile-more-accounts']();assert.deepEqual(f.calls[1].body,{pageToken:'account-next'});await f.submit({accountName:'accounts/fixture'});assert.equal(f.calls.length,3);await f.actions['business-profile-more-locations']();assert.deepEqual(f.calls[3].body,{accountName:'accounts/fixture',pageToken:'location-next'});
});

test('GBP: verifica non attiva; attivazione e aggiornamento giornaliero richiedono consenso esplicito',async()=>{
 const f=await fixture();f.S.module.businessProfile=state({configured:true,version:2});f.serve(()=>state({configured:true,checked:true,version:2,data:cache()}));f.actions['business-profile-check']();assert.equal(f.calls.length,0);await f.submit({});assert.equal(f.calls[0].path,'/api/business-profile/check');assert.deepEqual(f.calls[0].body,{version:2});assert.equal(f.S.module.businessProfile.enabled,false);
 f.actions['business-profile-activate']();assert.match(f.html(),/nessuna risposta alle recensioni o modifica/);assert.doesNotMatch(f.html(),/name="(?:daily|confirmed)" checked/);await assert.rejects(f.submit({daily:'on'}),/Conferma il confronto/);assert.equal(f.calls.length,1);await f.submit({confirmed:'on'});assert.deepEqual(f.calls[1].body,{version:2,enabled:true,daily:false,confirmed:true});
 f.actions['business-profile-activate']();await f.submit({confirmed:'on',daily:'on'});assert.deepEqual(f.calls[2].body,{version:2,enabled:true,daily:true,confirmed:true});
});

test('GBP: aggiornamento manuale e sospensione separati, nessuna modifica remota',async()=>{
 const f=await fixture();f.S.module.businessProfile=state({configured:true,checked:true,enabled:true,daily:true,version:2,data:cache()});f.serve(()=>state({configured:true,version:2}));f.actions['business-profile-refresh']();assert.equal(f.calls.length,0);await f.submit({});assert.equal(f.calls[0].path,'/api/business-profile/refresh');assert.deepEqual(f.calls[0].body,{version:2});f.actions['business-profile-pause']();await assert.rejects(f.submit({}),/Conferma la sospensione/);await f.submit({confirmed:'on'});assert.deepEqual(f.calls[1].body,{version:2,enabled:false,daily:false,confirmed:true});assert.equal(f.calls[1].path,'/api/business-profile/activate');
});

test('GBP: cambio attività/sessione/versione/dialogo prima del submit blocca le richieste',async()=>{
 const changes=[f=>{f.S.clientId='altro';},f=>{f.S.session={...f.S.session};},f=>{f.S.session.user.role='client';},f=>{f.S.session.csrf='nuovo';},f=>{f.S.navigation++;},f=>{f.S.module.businessProfile.version++;},f=>{f.S.module.businessProfile.canManage=false;},f=>{f.node('#dialog').close();},f=>{f.run('dialog("Altro","Testo")');}];
 for(const change of changes){const f=await fixture();f.actions['business-profile-check']();change(f);await assert.rejects(f.submit({}),/pagina o accesso cambiati/);assert.equal(f.calls.length,0);}
});

test('GBP: risultati ed errori tardivi non riaprono altra vista né contaminano nuovi dialoghi',async()=>{
 for(const fails of [false,true])for(const change of [f=>{f.S.clientId='altro';f.S.module=profiles();},f=>{f.S.session={...f.S.session};},f=>{f.run('dialog("Altro","Da conservare")');}]){
  const f=await fixture(),wait=deferred();f.serve(()=>wait.promise);f.actions['business-profile-check']();const pending=f.submit({});change(f);const before=f.S.module,html=f.html();if(fails)wait.reject(Error('Vecchio errore'));else wait.resolve(state({checked:true,data:cache()}));await assert.doesNotReject(pending);assert.equal(f.S.module,before);assert.equal(f.html(),html);assert.equal(f.node('#toast').textContent,'');
 }
});

test('GBP OAuth: consenso separato, revisione delle chiavi corretta e nessun checkbox preselezionato',async()=>{
 const f=await fixture();f.oauth();const html=f.run('protectedConnectionsView()');assert.match(html,/Autorizzazione Google Business/);assert.match(html,/Consenso separato da Gmail e Calendar/);f.actions['business-profile-oauth-start']();assert.equal(f.calls.length,0);assert.doesNotMatch(f.html(),/name="acknowledged" checked|name="calendar"/);assert.match(f.html(),/permesso di gestione ampio/);await assert.rejects(f.submit({email:'socio@demo.example'}),/Conferma i permessi/);f.serve(()=>({url:'https://accounts.google.com/o/oauth2/v2/auth?state=fixture'}));await f.submit({email:'socio@demo.example',acknowledged:'on'});assert.equal(f.calls[0].path,'/api/connections/gbp/oauth/start');assert.equal(f.calls[0].clientId,null);assert.deepEqual(f.calls[0].body,{version:7,email:'socio@demo.example',acknowledged:true});assert.equal(f.redirects.length,1);
});

test('GBP OAuth: flag spento blocca consenso; disconnessione locale usa versione autorizzazione e conferma',async()=>{
 const f=await fixture();f.oauth();const a=f.S.module.items[0].authorization;a.available=false;a.connected=true;assert.throws(()=>f.actions['business-profile-oauth-start'](),/Configura e abilita/);f.actions['business-profile-oauth-disconnect']();assert.match(f.html(),/revocare anche il consenso Google/);await assert.rejects(f.submit({}),/Conferma la disconnessione/);f.serve(()=>({...auth(),available:false,connected:false,version:5}));await f.submit({confirmed:'on'});assert.equal(f.calls[0].path,'/api/connections/gbp/oauth/disconnect');assert.deepEqual(f.calls[0].body,{version:4});assert.equal(f.S.module.items[0].authorization.connected,false);
});

test('GBP OAuth: rifiuta URL estranei e non ridirige dopo cambio pagina durante il consenso',async()=>{
 const f=await fixture();f.oauth();f.actions['business-profile-oauth-start']();f.serve(()=>({url:'https://estraneo.example/o/oauth2/v2/auth'}));await assert.rejects(f.submit({email:'socio@demo.example',acknowledged:'on'}),/Indirizzo Google non valido/);assert.equal(f.redirects.length,0);const wait=deferred();f.serve(()=>wait.promise);const pending=f.submit({email:'socio@demo.example',acknowledged:'on'});f.S.navigation++;wait.resolve({url:'https://accounts.google.com/o/oauth2/v2/auth'});await pending;assert.equal(f.redirects.length,0);
});

test('GBP callback: rimuove query prima delle letture, verifica sessione e usa il CSRF senza ambito cliente',async()=>{
 const f=await fixture();f.context.location.pathname='/auth/google-business/callback';f.context.location.search='?state=state-fixture&code=code-fixture&scope=ignored';f.serve(call=>{assert.deepEqual(f.history,['/auth/google-business/callback']);return call.path==='/api/session'?{user:{id:'owner-fixture',role:'owner'},csrf:'callback-csrf'}:{...auth(),connected:true,email:'socio+<test>@demo.example'};});await f.run('publicPage()');assert.deepEqual(f.calls.map(call=>call.path),['/api/session','/api/connections/gbp/oauth/finish']);assert.deepEqual(f.calls[1].body,{state:'state-fixture',code:'code-fixture',error:null});assert.equal(f.calls[1].csrf,'callback-csrf');assert.ok(f.calls.every(call=>call.clientId===null));assert.match(f.page(),/Google Business autorizzato/);assert.match(f.page(),/socio\+&lt;test&gt;@demo.example/);assert.doesNotMatch(f.page(),/ESPERIENZA DEMO|code-fixture|state-fixture/);
});

test('GBP callback: cliente o sessione assente non scambia il codice; errore non presenta successo o DEMO',async()=>{
 for(const session of [{user:null},{user:{role:'client'}},{user:{role:'owner',mustChangePassword:true}}]){const f=await fixture();f.context.location.pathname='/auth/google-business/callback';f.serve(()=>session);await f.run('publicPage()');assert.equal(f.calls.length,1);assert.match(f.page(),/da ripetere/);assert.doesNotMatch(f.page(),/ESPERIENZA DEMO/);}
 const f=await fixture();f.context.location.pathname='/auth/google-business/callback';f.serve(call=>{if(call.path==='/api/session')return f.S.session;throw Error('Consenso scaduto');});await f.run('publicPage()');assert.match(f.page(),/non confermata/);assert.doesNotMatch(f.page(),/Google Business autorizzato|ESPERIENZA DEMO/);
});

test('GBP callback: risposta o errore tardivo non sovrascrive nuova sessione o navigazione',async()=>{
 for(const fail of [false,true]){const f=await fixture(),wait=deferred();f.context.location.pathname='/auth/google-business/callback';f.serve(call=>call.path==='/api/session'?f.S.session:wait.promise);const pending=f.run('publicPage()');await new Promise(setImmediate);f.S.session={...f.S.session};f.node('#app').innerHTML='Nuova pagina';if(fail)wait.reject(Error('Vecchio errore'));else wait.resolve({...auth(),connected:true});await pending;assert.equal(f.page(),'Nuova pagina');}
});
