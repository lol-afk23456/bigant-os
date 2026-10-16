import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.js';
import {createOrchestrator} from '../src/orchestrator.js';
import {agentDefinitions} from '../src/registry.js';
import {specialistDemoInputs,specialistIds} from '../src/agents/specialists.js';
import {coreAgentIds} from '../src/agents/core.js';
import {runAllAgentsDemo} from '../scripts/demo-all-agents.js';

function fixture(t){
 let date=new Date('2026-10-08T07:00:00.000Z');
 const a=createApp({clock:()=>date}),s=a.store;
 t.after(()=>a.close());t.mock.method(globalThis,'fetch',()=>{throw Error('Rete vietata nel collaudo DEMO');});
 const owner=s.one("SELECT * FROM os_users WHERE id='demo-owner'"),client=s.one("SELECT * FROM os_users WHERE id='demo-client'");
 const call=(path,body={},clientId='demo-bigant',method='POST')=>a.orchestrator.handle({method,path,body,user:owner,clientId});
 const run=async(agent,input={},clientId='demo-bigant')=>{const j=a.orchestrator.enqueue(owner,clientId,agent,input);await a.orchestrator.tick(clientId);const saved=s.one('SELECT * FROM os_jobs WHERE id=?',j.id);assert.equal(saved.status,'done',saved.error);return a.orchestrator.outputs.get(owner,JSON.parse(saved.result).outputId);};
 return {...a,s,owner,client,call,run,advance:minutes=>{date=new Date(+date+minutes*60000);}};
}

test('tutti i 32 agenti hanno executor distinti e completano il giro comune isolato senza rete o effetti esterni',async t=>{
 t.mock.method(globalThis,'fetch',()=>{throw Error('Rete vietata');});
 assert.deepEqual([...coreAgentIds,...specialistIds,'research','analyst','commercial','fidelity'].sort(),agentDefinitions.map(a=>a.id).sort());
 const r=await runAllAgentsDemo();assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.outputs,32);
 assert.deepEqual(r.external,{mail:0,calendar:0,fidelity:0,costCents:0});
 assert.equal(new Set(r.results.map(x=>x.approvalId)).size,32);
});

test('rapporti e fonti interne restano ai soci; bozza social cliente non copia memoria riservata',async t=>{
 const a=fixture(t);a.production.saveMemory(a.owner,'demo-bottega','strategy','MARCATORE RISERVATO STRATEGIA','Fixture');
 const website=await a.run('website',specialistDemoInputs.website,'demo-bottega');
 assert.match(website.body,/MARCATORE RISERVATO/);assert.equal(website.visibility,'internal');
 assert.throws(()=>a.orchestrator.outputs.get(a.client,website.id),/riservato/);
 assert.throws(()=>a.orchestrator.outputs.decide(a.client,a.s.one('SELECT * FROM os_approvals WHERE id=?',website.approvalId),{decision:'approved'}),/riservato/);
 const social=await a.run('social',{},'demo-bottega');
 assert.match(social.body,/MARCATORE RISERVATO/);
 assert.doesNotMatch(a.s.one('SELECT body FROM os_contents WHERE id=?',social.links.contentId).body,/MARCATORE RISERVATO/);
 assert.doesNotMatch(a.s.one('SELECT body FROM os_approvals WHERE id=?',social.approvalId).body,/MARCATORE RISERVATO/);
 const admin=await a.run('administration');assert.equal(admin.visibility,'admin');
 assert.throws(()=>a.orchestrator.outputs.get(a.client,admin.id),/accessibile/);
});

test('versioni output immutabili, decisioni obsolete rifiutate e feedback restituito al medesimo agente',async t=>{
 const a=fixture(t),out=await a.run('website',specialistDemoInputs.website),old=a.s.one('SELECT * FROM os_approvals WHERE id=?',out.approvalId);
 const v2=a.orchestrator.outputs.revise(a.owner,out.id,{version:1,title:out.title,body:out.body+'\nRevisione del socio'});
 assert.equal(v2.version,2);assert.equal(a.s.one('SELECT status FROM os_approvals WHERE id=?',old.id).status,'obsolete');
 assert.throws(()=>a.orchestrator.outputs.decide(a.owner,old,{decision:'approved'}),/superata/);
 const approval=a.s.one('SELECT * FROM os_approvals WHERE id=?',v2.approvalId);
 a.orchestrator.outputs.decide(a.owner,approval,{decision:'changes',reason:'CTA DEMO: chiedere un sopralluogo'});
 const next=await a.run('website',specialistDemoInputs.website);assert.match(next.body,/chiedere un sopralluogo/);
 assert.ok(next.sourceSnapshot.memory.some(m=>m.kind==='agent-feedback:website'&&m.version===1));
 assert.throws(()=>a.s.run("UPDATE os_agent_output_versions SET body='alterato' WHERE output_id=?",out.id),/immutabile/);
 assert.throws(()=>a.orchestrator.outputs.revise(a.owner,out.id,{version:1,body:'obsoleto'}),/superata/);
 const other=await a.run('seo',specialistDemoInputs.seo);assert.doesNotMatch(other.body,/chiedere un sopralluogo/);
});

test('feedback amministrativo riservato torna all’amministrazione senza entrare negli specialisti',async t=>{
 const a=fixture(t),out=await a.run('administration');
 a.orchestrator.outputs.decide(a.owner,a.s.one('SELECT * FROM os_approvals WHERE id=?',out.approvalId),{decision:'changes',reason:'SOLO CONTABILITA DEMO verificare il documento'});
 const next=await a.run('administration');assert.match(next.body,/SOLO CONTABILITA/);
 const website=await a.run('website',specialistDemoInputs.website);assert.doesNotMatch(website.body,/SOLO CONTABILITA/);
 assert.ok(!website.sourceSnapshot.memory.some(m=>m.kind==='agent-feedback:administration'));
});

test('prerequisiti mancanti fermano le procedure modulo senza inventare consenso o approvazione',async t=>{
 const a=fixture(t),out=await a.run('commercial');
 assert.equal(out.status,'needs_input');assert.equal(out.approvalId,undefined);
 assert.throws(()=>a.orchestrator.outputs.revise(a.owner,out.id,{version:1,body:'aggira prerequisiti'}),/prerequisiti/);
 assert.equal(a.s.one('SELECT count(*) n FROM gr_messages').n,0);
 assert.equal(a.s.one("SELECT count(*) n FROM gr_leads WHERE consent<>'none'").n,0);
 const fidelity=await a.run('fidelity');assert.equal(fidelity.status,'needs_input');
});

test('permessi servizio, pausa, tetto e ambito impediscono l’avvio improprio senza saltare il blocco',async t=>{
 const a=fixture(t);assert.throws(()=>a.orchestrator.enqueue(a.client,'demo-bottega','website'),/riservata/);
 assert.throws(()=>a.orchestrator.enqueue(a.owner,'demo-bottega','administration'),/cliente zero/);
 assert.throws(()=>a.orchestrator.enqueue(a.owner,'demo-bottega','drone'),/non incluso/);
 const j=a.orchestrator.enqueue(a.owner,'demo-bottega','website');
 a.s.setSetting('paused',true);assert.equal((await a.orchestrator.tick('demo-bottega')).paused,true);
 a.s.setSetting('paused',false);a.s.setSetting('fixed_cents',5000);assert.equal((await a.orchestrator.tick('demo-bottega')).budgetBlocked,true);
 a.s.setSetting('fixed_cents',2000);a.s.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bottega'");
 await a.orchestrator.tick('demo-bottega');assert.match(a.s.one('SELECT error FROM os_jobs WHERE id=?',j.id).error,/non incluso/);
 assert.equal(a.s.one('SELECT count(*) n FROM os_agent_outputs').n,0);
 a.s.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bigant'");
 assert.throws(()=>a.orchestrator.enqueue(a.owner,'demo-bigant','commercial'),/non incluso/);
});

test('eventi deduplicati propagano input e restano nello stesso cliente',async t=>{
 const a=fixture(t);await a.call('/schedules',{agent:'website',trigger:'event:brief.approved',enabled:true,input:{brief:'Brief ricorrente DEMO'}} ,'demo-bottega');
 const one=a.orchestrator.event('brief.approved','demo-bottega','brief-demo',2,{fixture:{demo:true,pages:[]}}),two=a.orchestrator.event('brief.approved','demo-bottega','brief-demo',2,{});
 assert.equal(one.eventId,two.eventId);assert.equal(one.jobs[0].id,two.jobs[0].id);
 const input=JSON.parse(one.jobs[0].input);assert.equal(input.brief,'Brief ricorrente DEMO');assert.equal(input.fixture.demo,true);
 assert.equal(a.orchestrator.event('brief.approved','demo-studio','brief-demo',2,{}).jobs.length,0);
 await a.orchestrator.tick('demo-bottega');assert.equal(a.s.one('SELECT status FROM os_jobs WHERE id=?',one.jobs[0].id).status,'done');
});

test('calendario conserva input e sospende servizio revocato senza bloccare le altre regole',async t=>{
 const a=fixture(t);const first=await a.call('/schedules',{agent:'website',trigger:'daily',enabled:true,input:specialistDemoInputs.website},'demo-bottega');
 const second=await a.call('/schedules',{agent:'account',trigger:'daily',enabled:true,input:{brief:'PIANIFICAZIONE DEMO'}});
 a.s.run("UPDATE os_schedules SET next_at='2026-10-08T06:00:00.000Z' WHERE id IN(?,?)",first.data.id,second.data.id);
 a.s.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bottega'");await a.orchestrator.tick();
 assert.equal(a.s.one('SELECT enabled FROM os_schedules WHERE id=?',first.data.id).enabled,0);
 const j=a.s.one("SELECT * FROM os_jobs WHERE agent='account'");assert.equal(j.status,'done');assert.equal(JSON.parse(j.input).brief,'PIANIFICAZIONE DEMO');
 assert.equal(a.s.one('SELECT count(*) n FROM os_agent_outputs').n,1);
});

test('social genera evento di qualità; ricerca genera evento per i lead senza duplicazioni',async t=>{
 const a=fixture(t);await a.call('/schedules',{agent:'quality',trigger:'event:content.ready',enabled:true});
 await a.run('social');assert.equal(a.s.one("SELECT count(*) n FROM os_jobs WHERE agent='quality'").n,1);
 await a.orchestrator.tick('demo-bigant');
 await a.growth.handle({method:'POST',path:'/settings',body:{paused:false},user:a.owner,clientId:'demo-bigant'});
 await a.call('/schedules',{agent:'account',trigger:'event:lead.created',enabled:true});
 const research=await a.run('research');assert.equal(research.links.leadIds.length,5);
 assert.equal(a.s.one("SELECT count(*) n FROM os_jobs WHERE agent='account'").n,5);
 a.orchestrator.event('lead.created','demo-bigant',research.links.leadIds[0]);
 assert.equal(a.s.one("SELECT count(*) n FROM os_jobs WHERE agent='account'").n,5);
});

test('input non valido e deduplica non mescolano agenti o clienti',t=>{
 const a=fixture(t);assert.throws(()=>a.orchestrator.enqueue(a.owner,'demo-bigant','website',{fixture:{demo:false}}),/DEMO/);
 assert.throws(()=>a.orchestrator.enqueue(a.owner,'demo-bigant','assente'),/predisposto/);
 const one=a.orchestrator.enqueue(a.owner,'demo-bigant','account',{},'stesso'),same=a.orchestrator.enqueue(a.owner,'demo-bigant','account',{},'stesso');
 const other=a.orchestrator.enqueue(a.owner,'demo-bottega','account',{},'stesso'),agent=a.orchestrator.enqueue(a.owner,'demo-bigant','quality',{},'stesso');
 assert.equal(one.id,same.id);assert.equal(new Set([one.id,other.id,agent.id]).size,3);
});

test('revoca del socio durante l’esecuzione impedisce il salvataggio del risultato',async t=>{
 const a=fixture(t);const o=createOrchestrator({store:a.s,production:a.production,testHandlers:{account:async()=>{a.s.run("UPDATE os_users SET active=0 WHERE id='demo-owner'");return {summary:'Non salvare'};}}});
 const j=o.enqueue(a.owner,'demo-bigant','account');await o.tick('demo-bigant');
 assert.equal(a.s.one('SELECT count(*) n FROM os_agent_outputs').n,0);
 assert.match(a.s.one('SELECT error FROM os_jobs WHERE id=?',j.id).error,/revocata/);
});
