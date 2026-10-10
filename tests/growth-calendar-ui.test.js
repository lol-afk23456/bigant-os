import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

const start='2026-10-13T08:00:00.000Z',later='2026-10-13T09:00:00.000Z',end='2026-10-13T08:30:00.000Z';
const response=value=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>value});
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
const fd=values=>{const result=new FormData();for(const [key,value] of Object.entries(values))result.set(key,String(value));return result;};
const preview=(extra={})=>({version:'calendar-v2',hash:'preview-v2',to:'socio@demo.example',company:'Bottega DEMO',summary:'Prova con BigAnt',description:'Confronto sull’attività',start,end,slots:[start,later],notice:'Google potrà inviare una notifica.',...extra});
const publicData=(extra={})=>({company:'Bottega DEMO',maskedTo:'b***@demo.example',minutes:30,slots:[start,later],simulation:false,summary:'Confronto con BigAnt',description:'Appuntamento autorizzato',notice:'Rivedi e conferma prima di prenotare.',...extra});

async function fixture(){
 const nodes=new Map(),calls=[],redirects=[],copied=[];
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',value:'',open:false,addEventListener(){},replaceChildren(){this.innerHTML='';},showModal(){this.open=true;},close(){this.open=false;},focus(){},select(){}});return nodes.get(selector);};
 const context=vm.createContext({URL,URLSearchParams,Date,Intl,FormData,crypto:{randomUUID},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},window:{},history:{replaceState(){}},navigator:{clipboard:{writeText:async value=>copied.push(value)}},location:{origin:'http://127.0.0.1:4330',pathname:'/',hash:'',search:'',assign:url=>redirects.push(url)},document:{querySelector:node,addEventListener(){},hidden:false},fetch:async()=>response({user:null,demo:true,profiles:[]})});
 for(const file of ['app.js','ufficio.js','workspace.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),context,{filename:file});
 await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S'),actions=run('ACTIONS');
 S.session={user:{id:'owner-fixture',role:'owner',name:'Socio'},demo:false,csrf:'csrf-fixture'};S.view='growth';S.section='connections';S.clientId='demo-bottega';
 S.overview={clients:[{id:'demo-bottega',name:'Bottega DEMO'}],currentClient:{id:'demo-bottega'},navigation:{landing:'home',items:[['home','Home'],['growth','Growth'],['connections','Collegamenti']]}};
 S.module={simulation:false,settings:{paused:false,region:'Zona DEMO',sector:'Servizi',offer:'Offerta DEMO',senderName:'Socio DEMO',senderEmail:'socio@demo.example',description:'Descrizione',signature:'Firma',researchLimit:3,dailyLimit:10,meetingMinutes:30,startHour:9,endHour:18,followupDays:2,maxFollowups:1},calendar:{available:true,configured:true,version:'calendar-v2',checked:true,lastCheck:'2026-10-12T07:00:00.000Z',enabled:false,canReconcile:true,calendarId:'primary',meetingMinutes:30,startHour:9,endHour:18,timezone:'Europe/Rome',email:'socio@demo.example',probe:null,note:'Conferma ogni operazione.'},meetings:[],leads:[],sources:[],messages:[],jobs:[],costs:[]};
 run('saved=async message=>{S.savedMessage=message;$("#dialog").close();};');
 let serve=call=>{throw Error('Richiesta inattesa '+call.path);};
 context.fetch=async(url,options={})=>{const u=new URL(url),call={path:u.pathname,clientId:u.searchParams.get('clientId'),method:options.method||'GET',body:options.body===undefined?undefined:JSON.parse(options.body)};calls.push(call);return response(await serve(call));};
 return {S,actions,calls,redirects,copied,context,run,node,serve:fn=>{serve=fn;},html:()=>node('#dialog-content').innerHTML,page:()=>node('#app').innerHTML,submit:values=>run('formHandler')(fd(values)),publicSubmit:values=>run('submitPublicBooking')(values,fd(values)),publicOpen:async data=>{context.location.pathname='/growth/book/token-fixture';serve=()=>data;await run('publicPage()');}};
}

test('Google: Calendar facoltativo, mai preselezionato, Gmail predefinito anche dopo precedente consenso Calendar',async()=>{
 const f=await fixture();f.S.module={items:[{id:'google',configured:true,version:'google-v1',authorization:{available:true,calendarAvailable:true,calendarConnected:true,email:'socio@demo.example'}}]};
 f.actions['google-oauth-start']();assert.equal(f.calls.length,0);assert.match(f.html(),/name="calendar"/);assert.doesNotMatch(f.html(),/name="calendar" checked/);
 await assert.rejects(f.submit({email:'socio@demo.example',calendar:'on'}),/Conferma i permessi/);assert.equal(f.calls.length,0);
 f.serve(()=>({url:'https://accounts.google.com/o/oauth2/v2/auth?state=fixture'}));
 await f.submit({email:'socio@demo.example',acknowledged:'on'});
 assert.deepEqual(f.calls[0].body,{email:'socio@demo.example',acknowledged:true,calendar:false,version:'google-v1'});
 f.actions['google-oauth-start']();await f.submit({email:'socio@demo.example',acknowledged:'on',calendar:'on'});assert.equal(f.calls[1].body.calendar,true);assert.equal(f.redirects.length,2);
 f.S.module.items[0].authorization.calendarAvailable=false;f.actions['google-oauth-start']();assert.doesNotMatch(f.html(),/name="calendar"/);
 await f.submit({email:'socio@demo.example',acknowledged:'on',calendar:'on'});assert.equal(f.calls[2].body.calendar,false);
});

test('Calendar: pannello passivo, attivazione solo dopo ricezione verificata e nessuna seconda prova pendente',async()=>{
 const f=await fixture(),c=f.S.module.calendar;
 let html=f.run('growthCalendarPanel(S.module)');assert.match(html,/growth-calendar-probe-preview/);assert.doesNotMatch(html,/growth-calendar-enable/);
 for(const status of ['preparing','dispatching','booked','uncertain','cancelling','cancel_uncertain']){c.probe={id:'probe',status,verified:false};html=f.run('growthCalendarPanel(S.module)');assert.doesNotMatch(html,/growth-calendar-probe-preview|growth-calendar-enable/);if(status==='booked')assert.match(html,/growth-calendar-probe-verify/);}
 for(const status of ['safe_failed','cancelled']){c.probe={id:'probe',status,verified:false};assert.match(f.run('growthCalendarPanel(S.module)'),/growth-calendar-probe-preview/);}
 c.probe={id:'probe',status:'booked',verified:true};html=f.run('growthCalendarPanel(S.module)');assert.match(html,/growth-calendar-enable/);assert.doesNotMatch(html,/growth-calendar-probe-preview|growth-calendar-probe-verify/);
 f.S.module.settings.paused=true;assert.doesNotMatch(f.run('growthCalendarPanel(S.module)'),/growth-calendar-enable|growth-calendar-check|growth-calendar-probe-preview/);
 c.available=false;assert.doesNotMatch(f.run('growthCalendarPanel(S.module)'),/growth-calendar-config|growth-calendar-enable/);
 delete f.S.module.calendar;assert.match(f.run('growthCalendarPanel(S.module)'),/non disponibile/);assert.equal(f.calls.length,0);
});

test('Calendar: configurazione separata, ore intere fra 8 e 20 e payload con versione',async()=>{
 const f=await fixture();f.actions['growth-calendar-config']();assert.match(f.html(),/name="startHour"[^>]*min="8"[^>]*max="19"/);assert.match(f.html(),/name="endHour"[^>]*min="9"[^>]*max="20"/);
 for(const [startHour,endHour] of [[7,18],[9,21],[18,18],[19,18],[8.5,18]])await assert.rejects(f.submit({calendarId:'primary',meetingMinutes:'30',startHour,endHour}),/orari interi/);
 assert.equal(f.calls.length,0);f.serve(()=>({}));await f.submit({calendarId:'primary',meetingMinutes:'45',startHour:'8',endHour:'20'});
 assert.deepEqual(f.calls,[{path:'/api/growth/calendar/config',clientId:'demo-bottega',method:'POST',body:{version:'calendar-v2',calendarId:'primary',meetingMinutes:45,startHour:8,endHour:20}}]);
});

test('Growth: impostazioni reali non modificano Calendar; campi calendario rimangono nella DEMO',async()=>{
 const f=await fixture();f.actions['growth-settings']();assert.match(f.html(),/growth:connections/);assert.doesNotMatch(f.html(),/name="(?:calendarId|meetingMinutes|startHour|endHour|timezone)"/);
 f.serve(()=>({}));await f.submit({region:'Zona DEMO',dailyLimit:'10',researchLimit:'3'});const body=f.calls[0].body;
 assert.deepEqual(body,{region:'Zona DEMO',dailyLimit:10,researchLimit:3,autoDraft:false});
 f.S.module.simulation=true;f.actions['growth-settings']();for(const name of ['meetingMinutes','startHour','endHour'])assert.ok(f.html().includes(`name="${name}"`));
});

test('Calendar: disponibilità, ricezione e attivazione sono operazioni distinte e richiedono conferma',async()=>{
 const f=await fixture();f.serve(()=>({}));f.actions['growth-calendar-check']();assert.equal(f.calls.length,0);assert.match(f.html(),/Non crea appuntamenti/);await f.submit({});assert.deepEqual(f.calls.at(-1).body,{version:'calendar-v2'});assert.equal(f.calls.at(-1).path,'/api/growth/calendar/check');
 f.S.module.calendar.probe={id:'probe-fixture',status:'booked',verified:false};f.actions['growth-calendar-probe-verify']();assert.doesNotMatch(f.html(),/name="received" checked/);await assert.rejects(f.submit({}),/Controlla l’invito/);assert.equal(f.calls.length,1);
 await f.submit({received:'on'});assert.deepEqual(f.calls.at(-1).body,{id:'probe-fixture',received:true});assert.equal(f.calls.at(-1).path,'/api/growth/calendar/probe-verify');
 assert.throws(()=>f.actions['growth-calendar-enable'](),/Completa prima/);f.S.module.calendar.probe.verified=true;f.actions['growth-calendar-enable']();await assert.rejects(f.submit({}),/Conferma l’attivazione/);assert.equal(f.calls.length,2);
 await f.submit({confirmed:'on'});assert.deepEqual(f.calls.at(-1).body,{version:'calendar-v2',enabled:true});assert.equal(f.calls.at(-1).path,'/api/growth/calendar/activate');
 await f.actions['growth-calendar-disable']();assert.deepEqual(f.calls.at(-1).body,{version:'calendar-v2',enabled:false});
});

test('Calendar: prova in due anteprime, poi consenso esplicito sul contenuto e hash correnti',async()=>{
 const f=await fixture();f.serve(call=>call.path.endsWith('probe-preview')?preview(call.body.start?{hash:'final-hash',start:later,end:'2026-10-13T09:30:00.000Z',company:'DEMO <script>',summary:'Titolo <img>',description:'Testo <svg>',to:'socio+<test>@demo.example',notice:'Nota <iframe>'}:{}):{});
 await f.actions['growth-calendar-probe-preview']();assert.equal(f.calls.length,1);assert.deepEqual(f.calls[0].body,{});assert.match(f.html(),/Scegli l’orario/);assert.doesNotMatch(f.html(),/name="confirmed"/);
 await f.submit({start:later});assert.equal(f.calls.length,2);assert.deepEqual(f.calls[1].body,{start:later});assert.match(f.html(),/Conferma invito di prova/);assert.match(f.html(),/11:00/);assert.match(f.html(),/Roma/);assert.doesNotMatch(f.html(),/<script>|<img|<svg>|<iframe>|name="confirmed" checked/);assert.match(f.html(),/DEMO &lt;script&gt;/);
 await assert.rejects(f.submit({}),/Conferma l’invito/);assert.equal(f.calls.length,2);await f.submit({confirmed:'on'});
 assert.equal(f.calls.at(-1).path,'/api/growth/calendar/probe');assert.deepEqual(f.calls.at(-1).body,{version:'calendar-v2',hash:'final-hash',start:later,confirmed:true});
});

test('Calendar: nessuna disponibilità non offre creazione di prova',async()=>{
 const f=await fixture();f.serve(()=>preview({slots:[]}));await f.actions['growth-calendar-probe-preview']();assert.match(f.html(),/Nessuna disponibilità/);assert.doesNotMatch(f.html(),/<form/);assert.equal(f.calls.length,1);
});

test('Calendar: anteprime tardive non riaprono dialoghi dopo navigazione, cambio sessione o chiusura',async()=>{
 for(const change of [f=>{f.S.navigation++;},f=>{f.S.session={...f.S.session};},f=>{f.node('#dialog').close();}]){
  const f=await fixture(),wait=deferred();f.run('dialog("Attesa","Anteprima precedente")');f.serve(()=>wait.promise);const pending=f.actions['growth-calendar-invite-preview']('lead-fixture');change(f);wait.resolve(preview({leadId:'lead-fixture',expiresInDays:7}));await pending;assert.doesNotMatch(f.html(),/Rivedi invito appuntamento/);assert.equal(f.calls.length,1);
 }
});

test('Calendar: invito singolo autorizzato crea soltanto un link manuale e ne controlla l’origine',async()=>{
 const f=await fixture();f.serve(call=>call.method==='GET'?preview({leadId:'lead-fixture',expiresInDays:7}):{url:'/growth/book/token-fixture',expiresAt:'2026-10-20T08:00:00.000Z',simulation:false});
 await f.actions['growth-calendar-invite-preview']('lead-fixture');assert.equal(f.calls[0].path,'/api/growth/leads/lead-fixture/invite-preview');assert.equal(f.calls[0].method,'GET');assert.match(f.html(),/socio@demo.example/);assert.match(f.html(),/Link valido per 7 giorni/);
 await assert.rejects(f.submit({}),/Conferma il destinatario/);assert.equal(f.calls.length,1);await f.submit({confirmed:'on'});
 assert.equal(f.calls[1].path,'/api/growth/calendar/invite');assert.deepEqual(f.calls[1].body,{leadId:'lead-fixture',version:'calendar-v2',hash:'preview-v2',confirmed:true});assert.match(f.html(),/Link pronto da condividere/);assert.match(f.html(),/Nessuna email o invito è stato inviato/);assert.match(f.html(),/http:\/\/127.0.0.1:4330\/growth\/book\/token-fixture/);
 assert.equal(f.copied.length,0);f.node('#calendar-invitation-link').value='http://127.0.0.1:4330/growth/book/token-fixture';await f.actions['growth-calendar-copy-link']();assert.equal(f.copied.length,1);assert.equal(f.calls.length,2);
 for(const url of ['https://altro.example/growth/book/token','/growth/book/token?mail=x','/growth/book/token#x','javascript:alert(1)']){
  f.serve(call=>call.method==='GET'?preview({leadId:'lead-fixture',expiresInDays:7}):{url,simulation:false});await f.actions['growth-calendar-invite-preview']('lead-fixture');await assert.rejects(f.submit({confirmed:'on'}),/link di prenotazione non è valido/);assert.doesNotMatch(f.html(),/Link pronto da condividere/);
 }
});

test('Calendar: elenco appuntamenti usa i permessi server, distingue registrazione e ricezione',async()=>{
 const f=await fixture();f.S.module.meetings=[{id:'held',company:'DEMO <script>',start,end,status:'booked',kind:'booking',externalInvitation:true,canCancel:false,canReconcile:false},{id:'pending',company:'Prova DEMO',start,end,status:'uncertain',kind:'probe',canCancel:true,canReconcile:true}];
 const html=f.run('growthCalendarMeetings(S.module)');assert.match(html,/Registrato in Google non significa invito ricevuto o accettato/);assert.match(html,/DEMO &lt;script&gt;/);assert.doesNotMatch(html,/data-id="held"/);assert.match(html,/data-action="growth-calendar-reconcile" data-id="pending"/);assert.match(html,/data-action="growth-calendar-cancel-preview" data-id="pending"/);assert.equal(f.calls.length,0);
 f.S.module.simulation=true;f.S.module.meetings=[{id:'demo',company:'DEMO',start,status:'simulated_booked'}];const demo=f.run('growthCalendarMeetings(S.module)');assert.match(demo,/data-action="cancel-meeting"/);assert.doesNotMatch(demo,/growth-calendar-cancel-preview/);
});

test('Calendar: annullamento ha anteprima, consenso alla notifica e hash; riconciliazione non reinvia',async()=>{
 const f=await fixture();f.serve(call=>call.method==='GET'?preview({id:'meeting-fixture',hash:'cancel-hash'}):{status:'cancelled',found:true});
 await f.actions['growth-calendar-cancel-preview']('meeting-fixture');assert.equal(f.calls[0].path,'/api/growth/meetings/meeting-fixture/cancel-preview');assert.match(f.html(),/notifica Google agli invitati/);await assert.rejects(f.submit({}),/Conferma evento/);assert.equal(f.calls.length,1);
 await f.submit({confirmed:'on'});assert.equal(f.calls[1].path,'/api/growth/meetings/meeting-fixture/cancel');assert.deepEqual(f.calls[1].body,{hash:'cancel-hash',confirmed:true});
 await f.actions['growth-calendar-reconcile']('meeting-fixture');assert.equal(f.calls[2].path,'/api/growth/meetings/meeting-fixture/reconcile');assert.deepEqual(f.calls[2].body,{});
});

test('Calendar: errore dopo conferma non propone un nuovo invio o annullamento',async()=>{
 const f=await fixture();f.serve(call=>{if(call.method==='GET')return preview({id:'meeting-fixture'});throw Error('Esito remoto incerto');});
 await f.actions['growth-calendar-cancel-preview']('meeting-fixture');await f.submit({confirmed:'on'});assert.match(f.html(),/Operazione non confermata/);assert.match(f.html(),/non ripetere l’invio/);assert.match(f.html(),/growth:meetings/);assert.doesNotMatch(f.html(),/<form|type="submit"/);assert.equal(f.calls.length,2);
});

test('Calendar pubblico reale: selezione, riepilogo destinatario e consenso prima di ogni prenotazione',async()=>{
 const f=await fixture();await f.publicOpen(publicData({company:'DEMO <script>',description:'Corpo <img>'}));assert.equal(f.calls[0].clientId,null);assert.match(f.page(),/b\*\*\*@demo.example/);assert.doesNotMatch(f.page(),/ESPERIENZA DEMO|<script>/);
 await f.publicSubmit({start});assert.equal(f.calls.length,1);assert.match(f.page(),/Rivedi il tuo appuntamento/);assert.match(f.page(),/10:00/);assert.match(f.page(),/10:30/);assert.match(f.page(),/Non autorizza comunicazioni marketing/);assert.match(f.page(),/Corpo &lt;img&gt;/);assert.doesNotMatch(f.page(),/name="confirmed" checked/);
 await assert.rejects(f.publicSubmit({start}),/Conferma i dettagli/);await assert.rejects(f.publicSubmit({start:later,confirmed:'on'}),/L’orario è cambiato/);assert.equal(f.calls.length,1);
 f.serve(()=>({start,end,status:'booked',simulation:false,externalInvitation:true}));await f.publicSubmit({start,confirmed:'on'});assert.deepEqual(f.calls[1],{path:'/api/growth/public/book/token-fixture',clientId:null,method:'POST',body:{start,confirmed:true}});assert.match(f.page(),/Appuntamento registrato/);assert.match(f.page(),/consegna del messaggio non è verificata/);assert.doesNotMatch(f.page(),/<form|ESPERIENZA DEMO/);
 await assert.rejects(f.publicSubmit({start,confirmed:'on'}),/Richiesta già inviata/);assert.equal(f.calls.length,2);
});

test('Calendar pubblico: cambiare orario impone un nuovo riepilogo e non prenota',async()=>{
 const f=await fixture();await f.publicOpen(publicData());await assert.rejects(f.publicSubmit({start:'2030-01-01T10:00:00Z'}),/Scegli una disponibilità/);await f.publicSubmit({start});f.actions['public-booking-change']();assert.match(f.page(),/Scegli una disponibilità/);assert.doesNotMatch(f.page(),/name="confirmed"/);await f.publicSubmit({start:later});assert.match(f.page(),/11:00/);assert.equal(f.calls.length,1);
});

test('Calendar pubblico: timeout impedisce ripetizioni e non annuncia riuscita',async()=>{
 const f=await fixture();await f.publicOpen(publicData());await f.publicSubmit({start});f.serve(()=>{throw Error('Esito da verificare');});await f.publicSubmit({start,confirmed:'on'});assert.match(f.page(),/Prenotazione non confermata/);assert.match(f.page(),/Non ripetere la richiesta/);assert.doesNotMatch(f.page(),/<form|Appuntamento registrato|ESPERIENZA DEMO/);await assert.rejects(f.publicSubmit({start,confirmed:'on'}),/Richiesta già inviata/);assert.equal(f.calls.length,2);
});

test('Calendar pubblico: risposta incoerente non diventa appuntamento riuscito',async()=>{
 for(const result of [{simulation:true,status:'booked',externalInvitation:true},{simulation:false,status:'uncertain',externalInvitation:true},{simulation:false,status:'booked',externalInvitation:false}]){
  const f=await fixture();await f.publicOpen(publicData());await f.publicSubmit({start});f.serve(()=>result);await f.publicSubmit({start,confirmed:'on'});assert.match(f.page(),/Esito da verificare/);assert.doesNotMatch(f.page(),/<form|Appuntamento registrato|ESPERIENZA DEMO/);
 }
});

test('Calendar pubblico: DEMO conserva il flusso locale e non attribuisce un invito reale',async()=>{
 const f=await fixture();await f.publicOpen(publicData({simulation:true}));assert.match(f.page(),/ESPERIENZA DEMO/);assert.match(f.page(),/Conferma appuntamento DEMO/);f.serve(()=>({start,end,status:'simulated_booked',simulation:true,externalInvitation:false}));await f.publicSubmit({start});assert.deepEqual(f.calls[1].body,{start});assert.equal(f.calls[1].clientId,null);assert.match(f.page(),/Appuntamento DEMO registrato/);assert.match(f.page(),/Nessun invito esterno è stato inviato/);
});

test('Calendar: date esplicite di Roma, disponibilità assenti e modalità sconosciuta senza finte conferme',async()=>{
 const f=await fixture();assert.match(f.run('calendarDate("2026-01-13T08:00:00.000Z")'),/09:00 · Roma/);assert.match(f.run('calendarDate("2026-07-13T08:00:00.000Z")'),/10:00 · Roma/);assert.equal(f.run('calendarDate("inventata")'),'Data non disponibile');
 await f.publicOpen(publicData({slots:[]}));assert.match(f.page(),/Nessuna disponibilità/);assert.doesNotMatch(f.page(),/<form/);await assert.rejects(f.publicOpen(publicData({simulation:undefined})),/modalità di prenotazione non è verificabile/);
});
