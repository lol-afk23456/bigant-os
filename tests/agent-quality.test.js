import test from 'node:test';
import assert from 'node:assert/strict';
import {socialReply} from './helpers/agent-work-fixture.js';
import {qualityWorkFixture as fixture,qualityOutput} from './helpers/agent-quality-fixture.js';
import {qualityAssessment} from '../src/agent-quality.js';

test('Qualità richiede una propria prova e autorizzazione; pacchetto esatto e minimo',async t=>{
 const f=await fixture(t,{activate:false});assert.equal(f.app.agentConfig.entry('quality').operationalStatus,'AI pronta');assert.throws(()=>f.preview(),/non attivo/);
 f.app.agentWork.authorize(f.owner,'quality',f.authorization());const p=f.preview();assert.equal(p.context.draft.id,f.draft.id);assert.equal(p.context.draft.version,1);assert.equal(p.context.memory.length,1);assert.equal(f.calls,0);
 assert.doesNotMatch(JSON.stringify(p),/NON INVIARE|ECONOMIA RISERVATA|chiave-finta-operativa|password-fixture/);
 assert.throws(()=>f.app.agentWork.preview(f.owner,'fixture-blue','quality','Controlla',{contentId:f.draft.id}),/brief|Bozza non trovata/);
 assert.throws(()=>f.app.agentWork.preview(f.owner,'fixture-orange','quality','Controlla',{}),/Scegli una bozza/);
});

test('Qualità salva un parere immutabile e non approva, modifica o programma la bozza',async t=>{
 for(const provider of ['openai','api'])await t.test(provider,async t=>{
  const f=await fixture(t,{provider}),before=f.s.one('SELECT * FROM os_contents WHERE id=?',f.draft.id),approval=f.s.one('SELECT * FROM os_approvals WHERE entity_id=?',f.draft.id),b=f.body(),r=await f.run(b);
  assert.equal(r.status,'done',r.error);assert.equal(r.result.review.verdict,'da_correggere');assert.equal(r.result.review.current,true);assert.equal(r.costCents,40);assert.equal(r.costStatus,'charged');
  assert.deepEqual(f.s.one('SELECT * FROM os_contents WHERE id=?',f.draft.id),before);assert.deepEqual(f.s.one('SELECT * FROM os_approvals WHERE entity_id=?',f.draft.id),approval);
  assert.equal(f.s.one("SELECT count(*) n FROM os_approvals WHERE client_id='fixture-orange'").n,1);assert.equal(f.s.one('SELECT count(*) n FROM os_schedules WHERE enabled=1').n,0);
  assert.match(f.lastRequest.body.input||f.lastRequest.body.messages[0].content,/REVISIONE INTERNA/);assert.doesNotMatch(JSON.stringify(f.lastRequest.body),/NON INVIARE|ECONOMIA RISERVATA/);assert.equal(f.lastRequest.body.tools,undefined);
  assert.deepEqual(await f.run(b),r);assert.equal(f.calls,1);assert.equal(f.review().current,true);assert.equal(f.app.sciame.ufficio(f.owner).motore.id,'ai-manuale');
  assert.throws(()=>f.s.run("UPDATE os_agent_work SET raw_output='{}' WHERE job_id=?",r.id),/immutabile/);
 });
});

test('Qualità: il controllo automatico legge la bozza e prevale sul parere positivo',async t=>{
 const positive={esito:'approvabile',sintesi:'Nessuna criticità individuata.',rilievi:[]};const f=await fixture(t,{fetchImpl:()=>socialReply(positive)});
 f.s.run('UPDATE os_contents SET body=? WHERE id=?','Risultati garantiti al 100%',f.draft.id);const r=await f.run();assert.equal(r.status,'done',r.error);assert.equal(r.result.review.verdict,'bloccato');assert.ok(r.quality.some(x=>x.esito==='bloccante'));
 const quoted=qualityOutput();quoted.rilievi[0].problema='Evitare frasi come risultati garantiti al 100%.';
 const assessment=qualityAssessment(quoted,{draft:{id:'fake',title:'Laboratorio',body:'Un testo prudente.',version:1}});assert.ok(assessment.automatic.every(x=>x.esito!=='bloccante'));
});

test('Qualità: schema e contraddizioni rifiutati senza risultati parziali',async t=>{
 for(const out of [{bad:true},{esito:'da_correggere',sintesi:'Mancano rilievi',rilievi:[]},{...qualityOutput(),esito:'approvabile'},{...qualityOutput(),rilievi:[{...qualityOutput().rilievi[0],correzione:''}]}]){
  const f=await fixture(t,{fetchImpl:()=>socialReply(out)}),r=await f.run();assert.equal(r.status,'failed');assert.match(r.error,/incompleta|incoerente/);assert.equal(f.review(),null);assert.equal(r.costStatus,'charged');assert.equal(f.s.one('SELECT state FROM os_contents WHERE id=?',f.draft.id).state,'DA APPROVARE');
 }
});

test('Qualità: modifiche a testo, versione, fonte o decisione invalidano il consenso prima del trasporto',async t=>{
 for(const change of ['body','version','source','state','service']){const f=await fixture(t),b=f.body();f.s.run('UPDATE os_contents SET '+change+'=? WHERE id=?',({body:'Nuovo testo',version:2,source:'Nuova fonte',state:'APPROVATO',service:'website'})[change],f.draft.id);await assert.rejects(f.run(b));assert.equal(f.calls,0);assert.equal(f.s.one("SELECT count(*) n FROM os_jobs WHERE agent='quality' AND status='done'").n,0);}
});

test('Qualità: modifica durante il lavoro, sospensione e revoca fermano il salvataggio',async t=>{
 for(const change of ['draft','memory','authorization','service']){let finish;const f=await fixture(t,{fetchImpl:()=>new Promise(r=>finish=r)}),b=f.body(),run=f.run(b);
  await assert.rejects(f.run(b),/in corso/);
  if(change==='draft')f.s.run("UPDATE os_contents SET body='Testo nuovo' WHERE id=?",f.draft.id);
  if(change==='memory')f.app.production.saveMemory(f.owner,'fixture-orange','master','Brief rivisto','Fonte nuova');
  if(change==='authorization')f.app.agentWork.authorize(f.owner,'quality',{...f.authorization(),enabled:false});
  if(change==='service')f.s.run("UPDATE os_clients SET services_json='[]' WHERE id='fixture-orange'");
  finish(socialReply(qualityOutput()));const r=await run;assert.equal(r.status,'failed');assert.equal(r.costStatus,'charged');assert.equal(f.calls,1);assert.equal(f.s.one("SELECT count(*) n FROM os_jobs WHERE agent='quality' AND status='done'").n,0);
 }
});

test('Qualità: parere superato dopo modifica del testo o delle fonti, storico conservato',async t=>{
 for(const change of ['draft','memory','new-memory','visibility']){const f=await fixture(t),r=await f.run();
  if(change==='draft')f.s.run('UPDATE os_contents SET body=? WHERE id=?','Modifica senza incremento versione',f.draft.id);
  if(change==='memory')f.app.production.saveMemory(f.owner,'fixture-orange','master','Brief rivisto','Fonte nuova');
  if(change==='new-memory')f.app.production.saveMemory(f.owner,'fixture-orange','dna','Tono rivisto','Fonte nuova');
  if(change==='visibility')f.s.run("UPDATE os_memory SET visibility='admin' WHERE client_id='fixture-orange' AND kind='master'");
  assert.equal(f.review().current,false);assert.equal(f.app.agentWork.result(f.owner,'fixture-orange',r.id).result.review.current,false);assert.equal(f.s.one('SELECT status FROM os_jobs WHERE id=?',r.id).status,'done');
 }
});

test('Qualità HTTP: consenso, CSRF e ruoli; il collaboratore vede solo il parere del proprio cliente',async t=>{
 const f=await fixture(t),path='/api/agent-work/quality/preview?clientId=fixture-orange',input={brief:'Verifica',contentId:f.draft.id};
 for(const id of [null,'fixture-collaborator','fixture-client'])assert.ok([401,403].includes((await f.request('POST',path,input,{id})).status));
 assert.equal((await f.request('POST',path,input,{csrf:'bad'})).status,403);
 const p=(await f.request('POST',path,input)).body,b=f.body(p);b.brief=input.brief;
 assert.equal((await f.request('POST','/api/agent-work/quality/run?clientId=fixture-orange',{...b,confirmed:false})).status,400);
 const r=await f.request('POST','/api/agent-work/quality/run?clientId=fixture-orange',b);assert.equal(r.body.status,'done',r.body.error);
 const reviewPath='/api/agent-work/quality/review?clientId=fixture-orange&contentId='+f.draft.id;
 const team=await f.request('GET',reviewPath,undefined,{id:'fixture-collaborator'});assert.equal(team.status,200);assert.equal(team.body.current,true);assert.doesNotMatch(JSON.stringify(team.body),/instructions|costCents|apiKey|packet_json|PRIVATE/);
 const approvals=await f.request('GET','/api/workspace/approvals',undefined,{id:'fixture-collaborator'});assert.equal(approvals.body.items.find(a=>a.entity_id===f.draft.id).qualityReview.id,r.body.id);assert.match(approvals.body.items.find(a=>a.entity_id===f.draft.id).quality,/Parere AI: da correggere/);
 assert.equal((await f.request('GET',reviewPath,undefined,{id:'fixture-client'})).status,403);
 assert.equal((await f.request('GET',reviewPath.replace('fixture-orange','fixture-blue'))).status,404);
 f.s.run("DELETE FROM os_assignments WHERE user_id='fixture-collaborator'");assert.equal((await f.request('GET',reviewPath,undefined,{id:'fixture-collaborator'})).status,403);
 assert.equal(f.calls,1);
});

test('Qualità: budget esaurito non chiama il modello; errore di rete non viene ritentato',async t=>{
 for(const mode of ['budget','transport']){const f=await fixture(t,{fetchImpl:()=>{throw Error('SEGRETO non da mostrare');}});if(mode==='budget')f.app.costControl.confirm(f.owner,{...f.app.costControl.state(f.owner),externalCents:3960,confirmed:true});const b=f.body(),r=await f.run(b);assert.equal(r.status,'failed');assert.doesNotMatch(JSON.stringify(r),/SEGRETO/);await f.run(b);assert.equal(f.calls,mode==='budget'?0:1);assert.equal(f.review(),null);}
});
