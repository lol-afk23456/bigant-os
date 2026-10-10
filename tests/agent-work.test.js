import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {agentWorkFixture,socialOutput,socialReply} from './helpers/agent-work-fixture.js';
import {createAgentWork} from '../src/agent-work.js';

test('stati: prova e percorso pronti non sono autorizzazione; modifica o sospensione invalidano',async t=>{
 const f=await agentWorkFixture(t,{activate:false});assert.equal(f.app.agentConfig.entry('social').operationalStatus,'AI pronta');assert.equal(f.app.agentConfig.entry('quality').operationalStatus,'Base');assert.throws(()=>f.preview(),/non attivo/);
 const a=f.authorization();assert.throws(()=>f.app.agentWork.authorize(f.owner,'social',{...a,confirmed:false}),/conferma/);assert.throws(()=>f.app.agentWork.authorize(f.owner,'social',{...a,connectionVersion:99}),/stessa/);
 f.app.agentWork.authorize(f.owner,'social',a);assert.equal(f.app.agentConfig.entry('social').operationalStatus,'Attivo');assert.throws(()=>f.app.agentWork.authorize(f.owner,'social',a),/cambiata/);
 f.app.agentWork.authorize(f.owner,'social',{...f.authorization(),enabled:false});assert.equal(f.app.agentConfig.entry('social').operationalStatus,'AI pronta');assert.throws(()=>f.preview(),/non attivo/);assert.equal(f.calls,0);
});
test('pacchetto minimo: un solo cliente, fonti e versioni, niente contabilità o accessi',async t=>{
 const f=await agentWorkFixture(t),p=f.preview();assert.equal(p.context.client.id,'fixture-orange');assert.equal(p.context.memory.length,1);assert.equal(p.context.memory[0].version,1);assert.equal(p.context.memory[0].source,'Brief inventato');assert.doesNotMatch(JSON.stringify(p),/NON INVIARE|ECONOMIA RISERVATA|chiave-finta-operativa|password-fixture/);assert.equal(f.calls,0);
 const b=f.body(p);f.app.production.saveMemory(f.owner,'fixture-orange','master','Brief modificato','Nuova fonte');await assert.rejects(f.run(b),/nuova anteprima/);assert.equal(f.calls,0);assert.equal(f.s.one('SELECT COUNT(*) n FROM os_agent_work').n,0);
});
test('elaborazione reale predisposta: bozze pending, fonte e qualità, costo una volta e nessuna pianificazione',async t=>{
 const f=await agentWorkFixture(t),b=f.body(),r=await f.run(b);assert.equal(r.status,'done',r.error);assert.equal(r.costStatus,'charged');assert.equal(r.costCents,40);assert.equal(r.result.mode,'AI');assert.equal(r.result.links.contents.length,1);
 const content=f.s.one('SELECT * FROM os_contents WHERE id=?',r.result.links.contentId);assert.equal(content.client_id,'fixture-orange');assert.equal(content.state,'DA APPROVARE');assert.equal(content.scheduled_at,null);assert.match(content.source,/Memoria master v1/);
 const a=f.s.one('SELECT * FROM os_approvals WHERE id=?',r.result.links.approvalId);assert.equal(a.status,'pending');assert.equal(a.decision_by,null);assert.ok(f.s.one('SELECT * FROM os_approval_origins WHERE approval_id=?',a.id));
 assert.equal(f.lastRequest.url,'https://api.openai.com/v1/responses');assert.equal(f.lastRequest.body.tools,undefined);assert.match(f.lastRequest.body.input,/Laboratorio Arancio DEMO/);assert.doesNotMatch(f.lastRequest.body.input,/NON INVIARE|ECONOMIA RISERVATA/);
 const office=f.app.sciame.ufficio(f.owner),desk=office.stanze.flatMap(room=>room.agenti).find(a=>a.id==='social');assert.equal(desk.ultimoOutput.jobId,r.id);assert.equal(desk.stato,'in_attesa_approvazione');assert.equal(desk.costoMeseCents,40);assert.equal(office.motore.id,'ai-manuale');
 assert.deepEqual(await f.run(b),r);assert.equal(f.calls,1);assert.equal(f.s.one('SELECT COUNT(*) n FROM os_agent_work').n,1);assert.equal(f.s.one('SELECT COUNT(*) n FROM os_schedules WHERE enabled=1').n,0);
 assert.throws(()=>f.s.run("UPDATE os_agent_work SET raw_output='{}' WHERE job_id=?",r.id),/immutabile/);assert.throws(()=>f.s.run('DELETE FROM os_agent_work WHERE job_id=?',r.id),/immutabile/);
});
test('bozza AI: socio e collaboratore assegnato decidono sulla versione esatta',async t=>{
 const f=await agentWorkFixture(t),r=await f.run(),a=r.result.links.approvalId,c=r.result.links.contentId,collab=f.s.one("SELECT * FROM os_users WHERE id='fixture-collaborator'");
 await f.app.production.handle({method:'POST',path:'/approvals/'+a,user:collab,clientId:'fixture-orange',body:{decision:'approved'}});assert.equal(f.s.one('SELECT state FROM os_contents WHERE id=?',c).state,'APPROVATO');
 await f.app.production.handle({method:'PATCH',path:'/contents/'+c,user:collab,clientId:'fixture-orange',body:{version:1,title:'Titolo modificato',body:'Testo revisionato'}});await assert.rejects(f.app.production.handle({method:'POST',path:'/approvals/'+a,user:collab,clientId:'fixture-orange',body:{decision:'approved'}}),/superata|decisa/);
 assert.equal(f.s.one('SELECT state FROM os_contents WHERE id=?',c).state,'IN PRODUZIONE');
});
test('servizio e memoria: senza fonti, brief, servizio o attività attiva non si invia',async t=>{
 for(const mode of ['service','client','source','brief']){const f=await agentWorkFixture(t);if(mode==='service')f.s.run("UPDATE os_clients SET services_json='[]' WHERE id='fixture-orange'");if(mode==='client')f.s.run("UPDATE os_clients SET active=0 WHERE id='fixture-orange'");if(mode==='source')f.s.run("UPDATE os_memory SET source='' WHERE client_id='fixture-orange' AND kind='master'");if(mode==='brief')f.s.run("UPDATE os_memory SET visibility='admin' WHERE client_id='fixture-orange' AND kind='master'");assert.throws(()=>f.preview());assert.equal(f.calls,0);}
});
test('lavori concorrenti e consenso: nessun doppio trasporto o retry automatico',async t=>{
 let finish;const f=await agentWorkFixture(t,{fetchImpl:()=>new Promise(r=>finish=r)}),b=f.body();await assert.rejects(f.run({...b,confirmed:false}),/Conferma/);const run=f.run(b);await assert.rejects(f.run(b),/in corso/);await assert.rejects(f.run(),/in corso/);await f.app.orchestrator.tick();assert.equal(f.calls,1);finish(socialReply());assert.equal((await run).status,'done');
});
test('dati o autorità cambiati durante la chiamata non producono bozze; costo conservato',async t=>{
 for(const mode of ['memory','keys','authorization','service','owner','pause','flag','session']){let finish;const f=await agentWorkFixture(t,{fetchImpl:()=>new Promise(r=>finish=r)});if(mode==='session'){f.s.run('INSERT INTO os_sessions VALUES(?,?,?,?)','live-session',f.owner.id,'csrf',Date.now()+100000);f.owner.session_id='live-session';}const run=f.run();
 if(mode==='memory')f.app.production.saveMemory(f.owner,'fixture-orange','master','Nuovo brief','Fonte nuova');if(mode==='keys')f.app.connections.save(f.owner,'openai',{version:1,fields:{model:'altro-modello'}});if(mode==='authorization')f.app.agentWork.authorize(f.owner,'social',{...f.authorization(),enabled:false});if(mode==='service')f.s.run("UPDATE os_clients SET services_json='[]' WHERE id='fixture-orange'");if(mode==='owner')f.s.run('UPDATE os_users SET active=0 WHERE id=?',f.owner.id);if(mode==='pause')f.s.setSetting('paused','true');if(mode==='flag')f.env.BIGANT_SCIAME_AI_ENABLED='false';if(mode==='session')f.s.run("DELETE FROM os_sessions WHERE id='live-session'");finish(socialReply());
 if(['owner','session'].includes(mode))await assert.rejects(run);else assert.equal((await run).status,'failed');assert.equal(f.s.one("SELECT COUNT(*) n FROM os_contents WHERE client_id='fixture-orange'").n,0);assert.equal(f.s.one("SELECT c.status FROM os_costs c JOIN os_agent_work w ON c.id=w.cost_id").status,'charged');assert.equal(f.calls,1);}
});
test('qualità bloccante conserva il risultato, senza renderlo approvabile',async t=>{
 const out=socialOutput();out.post[0].testo='Risultati garantiti al 100%';const f=await agentWorkFixture(t,{fetchImpl:()=>socialReply(out)}),r=await f.run();assert.equal(r.status,'done');assert.equal(r.result.prerequisite,true);assert.equal(r.result.links.contents.length,0);assert.ok(r.quality.some(x=>x.esito==='bloccante'));assert.equal(f.s.one("SELECT COUNT(*) n FROM os_approvals WHERE client_id='fixture-orange'").n,0);
});
test('contratto, budget e errori: nessuna bozza parziale, costo prudenziale e nessun retry',async t=>{
 for(const mode of ['schema','timeout','budget']){const f=await agentWorkFixture(t,{fetchImpl:()=>{if(mode==='timeout')throw Error('chiave-finta-operativa');return socialReply({bad:true});}});if(mode==='budget')f.app.costControl.confirm(f.owner,{...f.app.costControl.state(f.owner),externalCents:3960,confirmed:true});const b=f.body(),r=await f.run(b);assert.equal(r.status,'failed');assert.doesNotMatch(JSON.stringify(r),/chiave-finta-operativa/);assert.equal(f.calls,mode==='budget'?0:1);assert.equal(r.costStatus,mode==='budget'?null:'charged');assert.equal(f.s.one("SELECT COUNT(*) n FROM os_contents WHERE client_id='fixture-orange'").n,0);await f.run(b);assert.equal(f.calls,mode==='budget'?0:1);}
});
test('HTTP: owner-only, CSRF, cliente esatto, prova/consenso e percorsi DEMO chiusi',async t=>{
 const f=await agentWorkFixture(t),path='/api/agent-work/social/preview?clientId=fixture-orange';for(const id of [null,'fixture-collaborator','fixture-client'])assert.ok([401,403].includes((await f.request('POST',path,{brief:'Prova'},{id})).status));assert.equal((await f.request('POST',path,{brief:'Prova'},{csrf:'bad'})).status,403);
 const p=(await f.request('POST',path,{brief:'Prova'})).body,b=f.body(p),r=await f.request('POST','/api/agent-work/social/run?clientId=fixture-orange',b);assert.equal(r.status,200);assert.equal(r.body.status,'done',r.body.error);
 assert.equal((await f.request('GET','/api/agent-work/results/'+b.requestId+'?clientId=fixture-blue')).status,404);assert.equal((await f.request('GET','/api/agent-work/results/'+b.requestId+'?clientId=fixture-orange',{},{id:'fixture-client'})).status,403);
 for(const path of ['/api/agents/run','/api/agents/schedules','/api/agents/jobs/'+b.requestId+'/retry'])assert.equal((await f.request('POST',path+'?clientId=fixture-orange',{agent:'social',trigger:'daily',enabled:true})).status,409);assert.equal(f.calls,1);
});
test('riavvio non ripete un lavoro AI e mantiene il costo prenotato',async t=>{
 const f=await agentWorkFixture(t),id=randomUUID(),p=f.preview(),cost=f.app.orchestrator.reserve('fixture-orange','social',40,{paid:true});f.s.run("INSERT INTO os_jobs(id,client_id,agent,input,status,available_at,created_at) VALUES(?,'fixture-orange','social','{}','running',?,?)",id,new Date().toISOString(),new Date().toISOString());f.s.run('INSERT INTO os_agent_work VALUES(?,?,?,?,?,NULL,NULL)',id,f.owner.id,p.fingerprint,JSON.stringify(p),cost);
 const reopened=createAgentWork({store:f.s,connections:f.app.connections,trials:f.app.agentTrials,configFor:id=>f.app.agentConfig.entry(id).config,orchestrator:f.app.orchestrator,production:f.app.production});await reopened.close();await f.app.orchestrator.tick();assert.equal(f.s.one('SELECT status FROM os_jobs WHERE id=?',id).status,'failed');assert.equal(f.s.one('SELECT status FROM os_costs WHERE id=?',cost).status,'reserved');assert.equal(f.calls,0);
});
