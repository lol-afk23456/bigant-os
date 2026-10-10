import {confirmFixtureBudget} from './helpers/budget-fixture.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore,seedCore} from '../src/store.js';
import {createConnections} from '../src/connections.js';
import {createGrowthModule} from '../src/growth.js';
import {createApp} from '../server.js';

function setup(t,{externalEnabled=true,provider='openai',overrideFetch,control={}}={}) {
 const store=openStore();seedCore(store);confirmFixtureBudget(store);t.after(()=>store.close());const owner=store.one("SELECT * FROM os_users WHERE id='demo-owner'");
 const env={BIGANT_SECRET_KEY:Buffer.alloc(32,7).toString('base64')},connections=createConnections({store,env}),calls=[];
 for(const id of ['brave','openai','anthropic'])connections.save(owner,id,{version:0,fields:{apiKey:'chiave-inventata-'+id,...(id==='brave'?{}:{model:'modello-inventato'})}});
 const response=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
 const fetchImpl=async(url,options)=>{calls.push({url:String(url),options});if(control.fail)throw Error('Guasto simulato');if(control.beforeResponse)await control.beforeResponse(url,options);if(overrideFetch)return overrideFetch(url,options,response);if(String(url).includes('brave'))return response({web:{results:[{title:'Azienda inventata',url:'https://azienda.example/',description:'Risultato per il test'}]}});
  const body=JSON.parse(options.body),schema=body.text?.format.schema||body.output_config.format.schema,output=schema.properties.score?{score:75,summary:'Fatto: testo di prova. Ipotesi: interesse da verificare.',service:'Video',reason:'Discussione con un socio'}:{subject:'Una proposta da rivedere',body:'Possiamo confrontarci sui tuoi obiettivi?',action:'reply',reason:'Richiede approvazione'};
  return response(String(url).includes('anthropic')?{stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(output)}]}:{status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(output)}]}]});
 };
 const growth=createGrowthModule({store,realMode:true,origin:'https://os.example',connections,externalEnabled,providerOptions:{fetchImpl,readWebsite:async url=>({url,text:'Azienda di prova: produce video.',retrievedAt:'2026-10-10T12:00:00.000Z',bytes:32,simulation:false})}});
 const call=async(method,path,body={},user=owner,w='demo-bigant')=>(await growth.handle({method,path,body,user,clientId:w})).data;
 const state=()=>growth.state('demo-bigant',owner);
 const configure=()=>call('POST','/runtime/config',{version:state().runtime.version,provider,searchCents:5,aiCents:25});
 const check=phase=>call('POST','/runtime/check',{phase,version:state().runtime.version,query:'Azienda di prova'});
 const activate=(phase,enabled=true)=>call('POST','/runtime/activate',{phase,enabled,version:state().runtime.version});
 async function enableAll(){await configure();for(const phase of ['research','analysis','drafts']){await check(phase);await activate(phase);}await call('POST','/settings',{paused:false});}
 async function job(type,input={}){const queued=await call('POST','/jobs',{type,...input});const result=await call('POST','/jobs/run');return {queued,result};}
 return {store,owner,connections,growth,calls,call,state,configure,check,activate,enableAll,job};
}
test('reale: configurazione senza attivazione, gate server e ruoli impediscono rete e costi',async t=>{
 const f=setup(t,{externalEnabled:false});await f.configure();assert.equal(f.state().simulation,false);assert.equal(f.state().leads.length,0);assert.equal(f.state().runtime.available,false);
 await assert.rejects(f.check('research'),/non abilitate/);await assert.rejects(f.activate('research'),/non abilitate/);await assert.rejects(f.call('POST','/jobs',{type:'research'}),/non abilitate/);
 for(const id of ['demo-client','demo-collaborator'])await assert.rejects(f.call('POST','/runtime/config',{},f.store.one('SELECT * FROM os_users WHERE id=?',id)),e=>e.status===403);
 assert.equal(f.calls.length,0);assert.equal(f.store.one('SELECT COUNT(*) n FROM os_costs').n,0);
});
test('ricerca → fonte → analisi → bozza nel flusso reale con trasporto finto e budget centrale',async t=>{
 const f=setup(t);await f.enableAll();const research=await f.job('research',{query:'Aziende di prova'});assert.equal(research.result.job.status,'done');
 let state=f.state();assert.equal(state.leads.length,1);assert.equal(state.sources.length,1);assert.equal(state.sources[0].kind,'search');assert.ok(!state.leads[0].company.includes('DEMO'));assert.equal(state.leads[0].owner,'Soci BigAnt');
 await f.call('POST','/jobs/run');state=f.state();assert.equal(state.leads[0].score,75);assert.equal(state.sources.length,2);assert.equal(state.sources.find(row=>row.kind==='website').retrieved_at,'2026-10-10T12:00:00.000Z');
 const draft=await f.job('draft',{leadId:state.leads[0].id});assert.equal(draft.result.job.status,'done');state=f.state();assert.equal(state.messages[0].status,'draft');assert.ok(!state.messages[0].body.includes('DEMO'));assert.equal(state.messages[0].booking_token,null);assert.equal(state.messages[0].externalDelivery,false);
 assert.equal(f.store.one("SELECT status FROM os_approvals WHERE entity_id=?",state.messages[0].id).status,'pending');
 assert.equal(f.store.one("SELECT SUM(cents) n FROM os_costs WHERE status='charged'").n,110);
 const returned=JSON.stringify(state),audit=JSON.stringify(f.store.query('SELECT * FROM os_audit'));assert.ok(!returned.includes('chiave-inventata'));assert.ok(!audit.includes('chiave-inventata'));
 assert.throws(()=>f.store.run("UPDATE gr_sources SET url='https://changed.example'"),/immutabile/);
 for(const path of ['/simulate/messages/'+state.messages[0].id+'/send','/booking-link','/public/inquiry'])await assert.rejects(f.call('POST',path,{leadId:state.leads[0].id}),/fase successiva/);
});
test('Anthropic è selezionabile per lo stesso percorso senza scegliere un fornitore al posto del socio',async t=>{
 const f=setup(t,{provider:'anthropic'});assert.equal(f.state().runtime.provider,null);await f.enableAll();await f.job('research');await f.call('POST','/jobs/run');assert.equal(f.state().leads[0].score,75);assert.ok(f.calls.some(row=>row.url.includes('anthropic')));assert.ok(f.calls.every(row=>!row.url.includes('openai')));
});
test('chiavi ruotate invalidano prove e lavori accodati senza un’altra chiamata',async t=>{
 const f=setup(t);await f.enableAll();const queued=await f.call('POST','/jobs',{type:'research'});const before=f.calls.length;
 f.connections.save(f.owner,'brave',{version:1,fields:{apiKey:'seconda-chiave-inventata'}});
 assert.equal(f.state().runtime.phases.research.checked,false);assert.equal(f.state().runtime.phases.drafts.enabled,false);
 const result=await f.call('POST','/jobs/run');assert.equal(result.job.status,'failed');assert.equal(f.calls.length,before);
 await assert.rejects(f.call('POST',`/jobs/${queued.id}/retry`),/non attivata/);
});
test('revoca della fase o del socio, pausa e worker impediscono esecuzioni non autorizzate',async t=>{
 const f=setup(t);await f.enableAll();await f.call('POST','/jobs',{type:'research'});const before=f.calls.length;
 assert.equal((await f.growth.engine.tick()).processed,0);assert.equal(f.state().jobs[0].status,'queued');assert.equal(f.calls.length,before);
 await f.activate('research',false);assert.equal(f.state().runtime.phases.analysis.enabled,false);await assert.rejects(f.call('POST','/jobs',{type:'draft'}),/Azienda/);
 await f.activate('research');await f.call('POST','/settings',{paused:true});await assert.rejects(f.call('POST','/jobs/run'),/pausa/);
 f.store.run("UPDATE os_users SET active=0 WHERE id=?",f.owner.id);await assert.rejects(f.call('POST','/runtime/check',{phase:'research',version:1,query:'Prova'}),/non più autorizzato/);assert.equal(f.calls.length,before);
});
test('modifica durante la risposta: costo conservato ma nessun risultato pubblicato o prova valida',async t=>{
 let release,entered;const inFetch=new Promise(r=>entered=r);let f;
 f=setup(t,{overrideFetch:async(url,opts,json)=>{entered();await new Promise(r=>release=r);return json({web:{results:[{title:'Prova',url:'https://azienda.example',description:'Dati'}]}});}});
 await f.configure();const pending=f.check('research');await inFetch;
 f.connections.save(f.owner,'brave',{version:1,fields:{apiKey:'rotazione-inventata'}});release();await assert.rejects(pending,/cambiati/);
 assert.equal(f.state().runtime.phases.research.checked,false);assert.equal(f.state().leads.length,0);assert.equal(f.store.one("SELECT SUM(cents) n FROM os_costs WHERE status='charged'").n,5);
});
test('modalità DEMO e reale non riusano registrazioni di prova presenti',t=>{
 const f=setup(t);const demo=createGrowthModule({store:f.store});demo.seed();
 const lead=demo.state('demo-bigant',f.owner).leads[0];f.store.run("INSERT INTO gr_messages(id,workspace,lead_id,direction,subject,body,status,created) VALUES(?,?,?,?,?,?,?,?)",'demo-sending','demo-bigant',lead.id,'out','Prova','Dati inventati','sending','2026-10-10T12:00:00Z');
 createGrowthModule({store:f.store,realMode:true,connections:f.connections});assert.equal(f.store.one("SELECT status FROM gr_messages WHERE id='demo-sending'").status,'sending');
 assert.throws(()=>f.state(),/non possono essere mescolati/);
});
test('server reale costruisce Growth chiuso anche con chiave del vault; nessun fornitore viene chiamato',async t=>{
 const app=createApp({origin:'https://os.example',env:{BIGANT_MODALITA:'reale',BIGANT_SOCIO_EMAIL:'owner@test.example',BIGANT_SOCIO_PASSWORD_INIZIALE:'password-inventata-lunga',BIGANT_SECRET_KEY:Buffer.alloc(32,2).toString('base64')},growthProviderOptions:{fetchImpl:()=>{throw Error('Rete vietata');}}});t.after(()=>app.close());
 const client=app.store.one('SELECT id FROM os_clients');
 assert.throws(()=>app.growth.state(client.id,app.store.one("SELECT * FROM os_users WHERE id='os-orchestrator'")),e=>e.status===403);
 app.store.run("UPDATE os_users SET must_change_password=0 WHERE email='owner@test.example'");
 const owner=app.store.one("SELECT * FROM os_users WHERE email='owner@test.example'");const state=app.growth.state(client.id,owner);assert.equal(state.runtime.available,false);assert.equal(state.simulation,false);assert.equal(state.leads.length,0);assert.equal(state.calendar.enabled,false);
});

test('ripetere un collaudo sospende le fasi dipendenti; un errore non conserva la vecchia attestazione',async t=>{
 const control={},f=setup(t,{control});await f.enableAll();await f.call('POST','/jobs',{type:'research'});control.fail=true;
 await assert.rejects(f.check('research'),/non raggiungibile/);
 for(const phase of Object.values(f.state().runtime.phases)){assert.equal(phase.checked,false);assert.equal(phase.enabled,false);}
 control.fail=false;await f.check('research');await f.activate('research');
 const before=f.calls.length,result=await f.call('POST','/jobs/run');assert.equal(result.job.status,'failed');assert.match(result.job.error,/superati/);assert.equal(f.calls.length,before);
});
test('collaudi concorrenti e configurazioni obsolete sono rifiutati prima di un’altra chiamata',async t=>{
 const control={},f=setup(t,{control});await f.configure();let enter,release;const entered=new Promise(r=>enter=r);
 control.beforeResponse=async()=>{enter();await new Promise(r=>release=r);};
 const pending=f.check('research');await entered;const before=f.calls.length;
 await assert.rejects(f.check('research'),/già in corso/);
 await assert.rejects(f.call('POST','/runtime/config',{version:0,provider:'anthropic',searchCents:1,aiCents:1}),/cambiata/);
 assert.equal(f.calls.length,before);release();await pending;
 assert.equal(f.state().runtime.phases.research.checked,true);assert.equal(f.state().runtime.phases.research.enabled,false);
});
test('decisione sul fornitore rinviabile; ordine delle fasi e automazioni reali non aggirabili',async t=>{
 const f=setup(t,{provider:''});await f.configure();await assert.rejects(f.activate('research'),/Collauda/);await f.check('research');await f.activate('research');
 await assert.rejects(f.check('analysis'),/Scegli AI/);
 for(const setting of [{autoResearch:true},{publicFormEnabled:true,privacyUrl:'https://privacy.example'},{researchLimit:11}])await assert.rejects(f.call('POST','/settings',setting),/ricerche manuali/);
 await assert.rejects(f.growth.engine.handlers.send('demo-bigant',{messageId:'absent'}),/fase successiva/);
 assert.equal(f.state().runtime.provider,null);
});
test('una scheda modificata durante la bozza non viene soppressa né aggiornata dall’AI',async t=>{
 const control={},f=setup(t,{control});await f.enableAll();const lead=await f.call('POST','/leads',{company:'Azienda test',source:'Segnalazione del socio',website:'https://azienda.example'});
 control.beforeResponse=async url=>{if(String(url).includes('openai'))await f.call('PATCH','/leads/'+lead.id,{notes:'Aggiornamento durante la richiesta'});};
 const result=await f.job('draft',{leadId:lead.id});assert.equal(result.result.job.status,'failed');assert.match(result.result.job.error,/cambiate/);assert.equal(f.state().messages.length,0);assert.equal(f.state().leads[0].notes,'Aggiornamento durante la richiesta');
 assert.throws(()=>f.growth.store.source('demo-bigant',lead.id,'website',{url:'javascript:alert(1)',retrievedAt:'oggi'}),/non valida/);
 assert.equal(f.state().sources.length,0);
});

test('budget centrale esaurito blocca il lavoro reale prima del trasporto',async t=>{
 const f=setup(t);await f.enableAll();const used=f.store.one("SELECT sum(cents) n FROM os_costs WHERE status='charged'").n;
 f.store.setSetting('budget_cents',3500+used);const calls=f.calls.length;
 const result=await f.job('research');assert.equal(result.result.job.status,'failed');assert.match(result.result.job.error,/Budget globale/);assert.equal(f.calls.length,calls);assert.equal(f.state().leads.length,0);
 assert.equal(f.store.one("SELECT count(*) n FROM os_costs WHERE status='reserved'").n,0);
});
