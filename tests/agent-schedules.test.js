import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {agentWorkFixture,socialReply,socialOutput} from './helpers/agent-work-fixture.js';
import {createAgentSchedules} from '../src/agent-schedules.js';
const cid='fixture-orange';
async function fixture(t,options={}){
 let time=new Date('2026-10-10T10:00:00.000Z');const clock=()=>time;
 const f=await agentWorkFixture(t,{clock,cadence:'daily',...options}),a=f.app.agentSchedules;f.env.BIGANT_SCIAME_SCHEDULES_ENABLED='true';
 const preview=()=>a.preview(f.owner,cid,'social',{brief:'Prepara una bozza del laboratorio inventato.'});
 const save=(p=preview())=>a.save(f.owner,cid,'social',{enabled:true,confirmed:true,version:p.version,plan:p});
 const state=()=>a.state(f.owner,cid,'social');
 return {...f,f,a,clock,preview,save,state,setTime:value=>{time=new Date(value);},due:()=>{time=new Date(state().entry.nextAt);}};
}
test('pianificazione: consenso distinto, nessun invio al salvataggio e un solo cliente',async t=>{
 const x=await fixture(t),p=x.preview();assert.equal(p.nextAt,'2026-10-11T07:00:00.000Z');assert.equal(p.expiresAt,'2026-11-09T10:00:00.000Z');assert.doesNotMatch(JSON.stringify(p),/NON INVIARE|ECONOMIA RISERVATA|chiave-finta/);
 for(const b of [{},{enabled:true,plan:p,version:0},{enabled:true,confirmed:true,version:0,plan:{...p,expiresAt:'2027-01-01T00:00:00Z'}}])assert.throws(()=>x.a.save(x.owner,cid,'social',b));
 assert.throws(()=>x.a.save(x.owner,'fixture-blue','social',{enabled:true,confirmed:true,version:0,plan:p}));assert.throws(()=>x.a.preview(x.owner,cid,'quality',{brief:'Prova'}),/manuale/);assert.throws(()=>x.a.preview(x.owner,cid,'social',{brief:'a'.repeat(1801)}),/1800/);
 x.save(p);assert.equal(x.f.calls,0);assert.equal((await x.a.tick()).processed,0);assert.equal(x.state().entry.enabled,true);assert.throws(()=>x.save(p),/cambiata/);
 const newer=x.preview();newer.packet.context.memory[0].content='Manomesso';assert.throws(()=>x.save(newer),/valido/);assert.equal(x.state().entry.version,1);
});
test('occorrenze: una chiamata, approvazione umana, fuso Roma, nessuna raffica di recuperi',async t=>{
 const x=await fixture(t);x.save();x.due();const [one,two]=await Promise.all([x.a.tick(),x.a.tick()]);assert.equal(one.jobId,two.jobId);assert.equal(one.status,'done');assert.equal(x.f.calls,1);assert.equal((await x.a.tick()).processed,0);
 assert.match(x.f.lastRequest.body.input,/Data dell’incarico pianificato: domenica 11 ottobre 2026/);assert.equal(x.state().entry.nextAt,'2026-10-12T07:00:00.000Z');const content=x.s.one('SELECT * FROM os_contents WHERE client_id=?',cid);assert.equal(content.state,'DA APPROVARE');assert.equal(content.scheduled_at,null);
 assert.throws(()=>x.s.run("UPDATE os_ai_schedule_runs SET status='running'"),/immutabile/);assert.throws(()=>x.s.run('DELETE FROM os_ai_schedule_versions'),/immutabile/);
 x.setTime('2026-10-26T10:00:00Z');assert.equal((await x.a.tick()).processed,1);assert.equal(x.state().entry.nextAt,'2026-10-27T08:00:00.000Z');assert.equal((await x.a.tick()).processed,0);assert.equal(x.f.calls,2);
});
test('autorizzazioni, fonti e interruttori: sospensione prima della scadenza senza invio',async t=>{
 for(const mode of ['owner','service','memory','keys','authorization','config','pause','flag','expiry']){
  const x=await fixture(t);x.save();
  if(mode==='owner')x.s.run('UPDATE os_users SET active=0 WHERE id=?',x.owner.id);
  if(mode==='service')x.s.run("UPDATE os_clients SET services_json='[]' WHERE id=?",cid);
  if(mode==='memory')x.app.production.saveMemory(x.owner,cid,'master','Testo diverso','Nuova fonte');
  if(mode==='keys')x.app.connections.save(x.owner,'openai',{version:1,fields:{model:'nuovo-modello'}});
  if(mode==='authorization')x.app.agentWork.authorize(x.owner,'social',{...x.authorization(),enabled:false});
  if(mode==='config'){const c=x.app.agentConfig.entry('social').config;x.app.agentConfig.save(x.owner,'social',{...c,estimatedCents:40,cadence:'weekly-monday'});}
  if(mode==='pause')x.s.setSetting('paused','true');if(mode==='flag')x.env.BIGANT_SCIAME_SCHEDULES_ENABLED='false';if(mode==='expiry')x.setTime('2026-11-09T10:00:00Z');
  assert.equal((await x.a.tick()).processed,0,mode);assert.equal(x.s.one('SELECT enabled FROM os_ai_schedules').enabled,0,mode);assert.equal(x.f.calls,0,mode);
 }
});
test('revoca o sostituzione durante il trasporto: nessuna bozza, costo conservato',async t=>{
 for(const mode of ['revoke','replace','flag','expiry']){
  let finish;const x=await fixture(t,{fetchImpl:()=>new Promise(r=>finish=r)});x.save();x.due();const work=x.a.tick();assert.equal(x.f.calls,1);
  if(mode==='revoke')x.a.save(x.owner,cid,'social',{enabled:false,version:1});if(mode==='replace')x.save();if(mode==='flag')x.env.BIGANT_SCIAME_SCHEDULES_ENABLED='false';if(mode==='expiry')x.setTime('2026-11-09T10:00:00Z');finish(socialReply());assert.equal((await work).status,'failed');assert.equal(x.s.one('SELECT COUNT(*) n FROM os_contents WHERE client_id=?',cid).n,0);assert.equal(x.s.one('SELECT c.status FROM os_costs c JOIN os_agent_work w ON w.cost_id=c.id').status,'charged');assert.equal(x.state().entry.enabled,mode==='replace');
 }
});
test('budget, errore, rilievo e mese non riconciliato sospendono senza nuovi tentativi',async t=>{
 for(const mode of ['budget','error','quality','month']){
  const x=await fixture(t,{fetchImpl:()=>{if(mode==='error')throw Error('segreto-finto');const o=socialOutput();if(mode==='quality')o.post[0].testo='Risultati garantiti al 100%';return socialReply(o);}});x.save();x.due();if(mode==='budget')x.app.costControl.confirm(x.owner,{...x.app.costControl.state(x.owner),externalCents:3960,confirmed:true});if(mode==='month')x.setTime('2026-11-01T10:00:00Z');assert.equal((await x.a.tick()).status,'failed',mode);assert.equal(x.state().entry.enabled,false);assert.doesNotMatch(JSON.stringify(x.state()),/segreto-finto/);assert.equal((await x.a.tick()).processed,0);assert.equal(x.f.calls,['budget','month'].includes(mode)?0:1,mode);
 }
});
test('riavvio: una scadenza presa in carico non viene ripetuta, anche senza job già creato',async t=>{
 const x=await fixture(t);x.save();x.due();const row=x.state().entry;x.s.run("INSERT INTO os_ai_schedule_runs VALUES(?,?,?,'running',NULL,?,NULL)",row.id,row.nextAt,randomUUID(),x.clock().toISOString());
 const reopened=createAgentSchedules({store:x.s,work:x.app.agentWork,clock:x.clock,enabled:()=>true});assert.equal((await reopened.tick()).processed,0);assert.equal(x.state().entry.enabled,false);assert.equal(x.state().history[0].status,'interrupted');assert.equal(x.f.calls,0);await reopened.close();
});
test('HTTP: solo soci, CSRF, interruttore separato e anteprima scaduta',async t=>{
 const x=await fixture(t),path='/api/agent-work/social/schedule?clientId='+cid;
 for(const id of [null,'fixture-client','fixture-collaborator']){assert.ok([401,403].includes((await x.request('GET',path,null,{id})).status));assert.ok([401,403].includes((await x.request('POST',path,{version:0,enabled:true},{id})).status));}
 assert.equal((await x.request('POST',path,{},{csrf:'bad'})).status,403);const p=x.preview();x.setTime('2026-10-10T10:11:00Z');assert.throws(()=>x.save(p),/scaduta/);x.env.BIGANT_SCIAME_SCHEDULES_ENABLED='false';assert.equal(x.state().available,false);assert.throws(()=>x.preview(),/spente/);assert.equal(x.f.calls,0);
 const off=await agentWorkFixture(t);assert.equal(off.app.agentSchedules.state(off.owner,cid,'social').available,false);assert.throws(()=>off.app.agentSchedules.preview(off.owner,cid,'social',{brief:'Prova'}),/spente/);
});
