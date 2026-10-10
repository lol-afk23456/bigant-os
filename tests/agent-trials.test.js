import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {createApp} from '../server.js';
import {createAgentTrials} from '../src/agent-trials.js';
import {createTrialProvider} from '../src/sciame/trial-provider.js';
import {confirmFixtureBudget} from './helpers/budget-fixture.js';
import {schemi} from '../src/sciame/schemi.js';
const output={esito:'da_correggere',sintesi:'Scheda inventata: verificare le fonti prima del lavoro reale.',rilievi:[]};
const reply=(provider='openai',value=output)=>new Response(JSON.stringify(provider==='openai'?{status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]}:{stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(value)}]}));
function fixture(t,{provider='openai',fetchImpl,real=false,budget=true}={}){
 const env={BIGANT_SECRET_KEY:Buffer.alloc(32,8).toString('base64'),...(real?{BIGANT_MODALITA:'reale',BIGANT_SOCIO_EMAIL:'socio@example.test',BIGANT_SOCIO_PASSWORD_INIZIALE:'password-finta-lunga-123',BIGANT_SCIAME_AI_TRIALS_ENABLED:'true'}:{})};let calls=0,request,enabled=true;
 const fetcher=async(url,options)=>{calls++;request={url,...options,body:JSON.parse(options.body)};return fetchImpl?fetchImpl(url,options):reply(provider);};
 const app=createApp({env,...(real?{origin:'https://example.test'}:{}),agentTrialProviderOptions:{fetchImpl:fetcher}}),s=app.store;
 const owner=s.one("SELECT * FROM os_users WHERE role='owner' AND id<>'os-orchestrator' LIMIT 1");s.run('UPDATE os_users SET must_change_password=0 WHERE id=?',owner.id);owner.must_change_password=0;
 app.connections.save(owner,provider,{version:0,fields:{apiKey:'chiave-finta-non-trascrivere',model:'modello-finto'}});
 const cfg=app.agentConfig;function save(extra={}){const c=cfg.entry('quality').config;return cfg.save(owner,'quality',{...c,version:c.version,provider:provider==='anthropic'?'api':'openai',estimatedCents:40,enabled:false,authorized:false,...extra});}save();
 const control=budget?confirmFixtureBudget(s,{owner}):app.costControl;
 const options={store:s,connections:app.connections,costControl:control,reserve:app.orchestrator.reserve,configFor:id=>cfg.entry(id).config,enabled:()=>enabled,providerOptions:{fetchImpl:fetcher}};
 const trials=real?app.agentTrials:createAgentTrials(options);t.after(async()=>{await trials.close();await app.close();});
 const body=()=>({version:cfg.entry('quality').config.version,connectionVersion:app.connections.runtimeMetadata(provider).version,requestId:randomUUID(),confirmed:true});
 return {app,s,env,owner,cfg,control,trials,options,body,save,get calls(){return calls;},get request(){return request;},disable:()=>{enabled=false;env.BIGANT_SCIAME_AI_TRIALS_ENABLED='false';},run:b=>trials.check(owner,'quality',b||body())};
}
for(const provider of ['openai','anthropic'])test(provider+': versione salvata, dati inventati, trasporto fisso e nessuna attivazione',async t=>{
 const f=fixture(t,{provider}),b=f.body(),r=await f.run(b);assert.equal(r.status,'passed');assert.equal(r.current,true);assert.deepEqual(r.output,output);assert.equal(r.costStatus,'charged');assert.equal(r.costCents,40);assert.equal(r.configuration.version,1);
 assert.equal(f.request.redirect,'error');assert.equal(f.request.body.model,'modello-finto');assert.equal(f.request.body.tools,undefined);assert.match(JSON.stringify(f.request.body),/Laboratorio Arancio DEMO/);assert.doesNotMatch(JSON.stringify(f.request.body),/chiave-finta-non-trascrivere/);
 assert.equal(f.request.url,provider==='openai'?'https://api.openai.com/v1/responses':'https://api.anthropic.com/v1/messages');if(provider==='openai')assert.equal(f.request.body.store,false);
 assert.equal(f.trials.stateForAgent('quality',f.cfg.entry('quality').config).passed,true);assert.equal(f.cfg.entry('quality').operationalStatus,'Base');assert.equal(f.cfg.entry('quality').config.enabled,0);
 assert.deepEqual(await f.run(b),r);assert.equal(f.calls,1);assert.equal(f.s.one('SELECT COUNT(*) n FROM os_jobs').n,0);assert.equal(f.s.one('SELECT COUNT(*) n FROM os_agent_trials').n,1);
 assert.throws(()=>f.s.run("UPDATE os_agent_trials SET output_json='{}' WHERE id=?",r.id),/immutabile/);assert.throws(()=>f.s.run('DELETE FROM os_agent_trials WHERE id=?',r.id),/immutabile/);
});
test('flag, consenso, versione, identità richiesta e contratto bloccano prima della rete',async t=>{
 const f=fixture(t);for(const b of [{...f.body(),confirmed:false},{...f.body(),connectionVersion:0},{...f.body(),version:0},{...f.body(),requestId:'-'.repeat(36)}])await assert.rejects(f.run(b));
 await assert.rejects(f.trials.check(f.owner,'non-esiste',f.body()),/non trovato/);f.disable();await assert.rejects(f.run(),/non abilitate/);assert.equal(f.calls,0);assert.equal(f.s.one('SELECT COUNT(*) n FROM os_costs').n,0);
});
test('costi: totale ignoto, limite interno e soglia globale non inviano richieste',async t=>{
 for(const kind of ['unknown','internal','threshold','invalid']){const f=fixture(t);if(kind==='unknown')f.s.run('UPDATE os_users SET must_change_password=1 WHERE id=?',f.owner.id);if(kind==='internal')f.s.setSetting('fixed_cents',4990);if(kind==='threshold')f.control.confirm(f.owner,{...f.control.state(f.owner),externalCents:3970,confirmed:true});if(kind==='invalid')f.s.run('UPDATE os_agent_config SET estimated_cents=0 WHERE agent=?','quality');
 if(['unknown','invalid'].includes(kind))await assert.rejects(f.run());else {const r=await f.run();assert.equal(r.status,'failed');assert.equal(r.costCents,null);}assert.equal(f.calls,0);assert.equal(f.s.one('SELECT COUNT(*) n FROM os_costs').n,0);}
});
test('budget mai verificato: prova registrata come fallita senza costi',async t=>{
 const f=fixture(t,{budget:false}),r=await f.run();assert.equal(r.status,'failed');assert.match(r.error,/Verifica i consumi/);assert.equal(r.costCents,null);assert.equal(f.calls,0);assert.equal(f.s.one('SELECT COUNT(*) n FROM os_costs').n,0);
});
test('prova singola in corso: idempotenza e concorrenza senza doppia spesa',async t=>{
 let finish;const pending=new Promise(r=>finish=r),f=fixture(t,{fetchImpl:()=>pending}),b=f.body(),run=f.run(b);
 await assert.rejects(f.run(b),/già in corso/);await assert.rejects(f.run(),/già in corso/);assert.equal(f.calls,1);assert.equal(f.s.one('SELECT SUM(cents) n FROM os_costs').n,40);finish(reply());await run;
});
test('istruzioni e chiavi nuove invalidano la prova, storico conserva quelle usate',async t=>{
 const f=fixture(t),b=f.body(),old=await f.run(b);f.save({instructions:'Istruzioni nuove inventate'});assert.equal(f.trials.stateForAgent('quality',f.cfg.entry('quality').config).passed,false);assert.equal(f.trials.result(f.owner,old.id).current,false);assert.notEqual(f.trials.history(f.owner,'quality')[0].configuration.instructions,'Istruzioni nuove inventate');await assert.rejects(f.run({...b,version:2}),/già utilizzato/);
 await f.run();f.app.connections.save(f.owner,'openai',{version:1,fields:{apiKey:'chiave-finta-2'}});assert.equal(f.trials.stateForAgent('quality',f.cfg.entry('quality').config).passed,false);
});
test('cambi durante la risposta: niente prova valida; stima già partita conservata',async t=>{
 for(const change of ['config','connection','pause','flag','revocation','session']){
  let finish;const f=fixture(t,{fetchImpl:()=>new Promise(r=>finish=r)});if(change==='session'){f.s.run('INSERT INTO os_sessions VALUES(?,?,?,?)','session-test',f.owner.id,'csrf',Date.now()+100000);f.owner.session_id='session-test';}
  const run=f.run();if(change==='config')f.save({instructions:'Versione nuova'});if(change==='connection')f.app.connections.save(f.owner,'openai',{version:1,fields:{model:'altro-modello'}});if(change==='pause')f.s.setSetting('paused','true');if(change==='flag')f.disable();if(change==='revocation')f.s.run('UPDATE os_users SET active=0 WHERE id=?',f.owner.id);if(change==='session')f.s.run('DELETE FROM os_sessions WHERE id=?','session-test');finish(reply());
  if(['revocation','session'].includes(change))await assert.rejects(run);else assert.equal((await run).status,'failed');assert.equal(f.s.one('SELECT status FROM os_agent_trials').status,'failed');assert.equal(f.s.one('SELECT status FROM os_costs').status,'charged');assert.equal(f.calls,1);
 }
});
test('timeout e risultato fuori contratto: errore leggibile, stima conservata, nessun retry',async t=>{
 for(const fetchImpl of [()=>{throw Error('chiave-finta-non-trascrivere');},()=>reply('openai',{...output,sintesi:''}),()=>reply('openai',{...output,extra:'non ammesso'})]){
 const f=fixture(t,{fetchImpl}),b=f.body(),r=await f.run(b);assert.equal(r.status,'failed');assert.equal(r.output,null);assert.equal(r.costStatus,'charged');assert.doesNotMatch(JSON.stringify(r),/chiave-finta-non-trascrivere/);await f.run(b);assert.equal(f.calls,1);}
});
test('revoca e sessione: configurazione e risultati richiedono ancora un socio autorizzato',async t=>{
 const f=fixture(t),r=await f.run();for(const id of ['demo-client','demo-collaborator','os-orchestrator']){const u=f.s.one('SELECT * FROM os_users WHERE id=?',id);assert.throws(()=>f.trials.result(u,r.id));assert.throws(()=>f.trials.history(u,'quality'));assert.throws(()=>f.cfg.state(u));}
 f.s.run('UPDATE os_users SET active=0 WHERE id=?',f.owner.id);assert.throws(()=>f.trials.result(f.owner,r.id),/autorizzato/);assert.throws(()=>f.save(),/autorizzato/);assert.equal(f.trials.stateForAgent('quality',f.cfg.entry('quality').config).passed,false);
});
test('riavvio: nessuna ripetizione automatica e prenotazione conservata',async t=>{
 const f=fixture(t),b=f.body(),c=f.cfg.entry('quality').config;f.s.run('INSERT INTO os_agent_trials VALUES(?,?,?,?,?,?,?,?,?,NULL,NULL,?,?,NULL)',b.requestId,'quality',1,1,'openai','impronta-fixture',f.owner.id,JSON.stringify(c),'running',f.app.orchestrator.reserve('demo-bigant','sciame:qualita',40,{paid:true}),new Date().toISOString());
 const reopened=createAgentTrials(f.options);await reopened.close();assert.equal(f.s.one('SELECT status FROM os_agent_trials').status,'failed');assert.equal(f.s.one('SELECT status FROM os_costs').status,'reserved');assert.equal(f.calls,0);
});
test('HTTP reale: schema salvato, fornitore da Collegamenti, consenso, CSRF, risultati owner-only',async t=>{
 const f=fixture(t,{real:true}),handler=f.app.server.listeners('request')[0];f.s.run('INSERT INTO os_sessions VALUES(?,?,?,?)',createHash('sha256').update('cookie-fixture').digest('hex'),f.owner.id,'csrf',Date.now()+3600000);
 async function request(method,path,body,csrf='csrf',cookie=true){const req={method,url:path,headers:{host:'example.test',origin:'https://example.test','x-csrf-token':csrf,'content-type':'application/json',...(cookie?{cookie:'bigant_os=cookie-fixture'}:{})},socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){if(body)yield Buffer.from(JSON.stringify(body));}};const res={status:200,setHeader(){},writeHead(n){this.status=n;},end(b){this.body=JSON.parse(String(b));}};await handler(req,res);return res;}
 const state=await request('GET','/api/agent-config/state');assert.equal(state.status,200);assert.equal(state.body.items.find(x=>x.id==='quality').technicalTrial.available,true);assert.equal(state.body.providers.find(x=>x.id==='openai').configured,true);
 const b=f.body(),path='/api/agent-config/quality/check';assert.equal((await request('POST',path,b,'bad')).status,403);assert.equal((await request('POST',path,b,'csrf',false)).status,401);const result=await request('POST',path,b);assert.equal(result.status,200);assert.equal(result.body.status,'passed');assert.equal((await request('GET','/api/agent-trials/'+b.requestId)).body.id,b.requestId);assert.equal((await request('GET','/api/agent-config/quality/trials')).body.length,1);
 f.s.run("UPDATE os_users SET role='collaborator' WHERE id=?",f.owner.id);assert.equal((await request('GET','/api/agent-trials/'+b.requestId)).status,403);assert.equal((await request('POST',path,f.body())).status,403);assert.equal(f.calls,1);
});
test('fornitore: rifiuti, troncamenti, corpo eccessivo e dati non JSON sono respinti',async()=>{
 const bad=[new Response('x'.repeat(1000001)),new Response('null'),new Response('non JSON'),new Response(JSON.stringify({status:'incomplete',output:[]})),new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'refusal'}]}]})),reply('openai',{sintesi:'x'.repeat(100001)}),new Response('secret',{status:401})];
 for(const response of bad){const p=createTrialProvider({fetchImpl:async()=>response});await assert.rejects(p.run({provider:'openai',credentials:{apiKey:'fake',model:'fake'},instructions:'test',task:'test',sources:'test',quality:'test',schema:schemi.qualita,beforeDispatch(){}}));}
 let calls=0;const p=createTrialProvider({fetchImpl:()=>{calls++;}});await assert.rejects(p.run({provider:'openai',credentials:{apiKey:'fake'},schema:schemi.qualita,beforeDispatch(){throw Error('revoked');}}),/revoked/);assert.equal(calls,0);
});
