import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.js';
import {agencyRegistry,validateAgencyRegistry} from '../src/agency/index.js';
import {marketingChannels} from '../src/agency/marketing.js';
import {coreAgentIds} from '../src/agents/core.js';
import {specialistIds} from '../src/agents/specialists.js';

function fixture(t){const a=createApp();t.after(()=>a.close());const user=id=>a.store.one('SELECT * FROM os_users WHERE id=?',id);return {...a,user,owner:user('demo-owner'),client:user('demo-client'),team:user('demo-collaborator')};}
test('intera agenzia: diciannove servizi di riferimento, specialità e dieci moduli distinti senza orfani',()=>{
 const r=agencyRegistry;
 assert.deepEqual(r.services.filter(s=>s.catalogue).map(s=>s.catalogue),Array.from({length:19},(_,i)=>i+1));
 assert.deepEqual(r.management.map(m=>m.id),['contacts','sales-contracts','invoicing','deadlines','cash','costs','work-margin','delivery','documents','direction']);
 for(const id of ['branding','drone','video-ai','creative-direction','events','growth','fidelity','local'])assert.ok(r.services.some(s=>s.id===id));
 for(const s of r.services.filter(s=>!s.excluded)){assert.ok(s.agents.length);for(const id of s.agents){const a=r.agents.find(a=>a.id===id);assert.ok(a);assert.ok(r.departments.find(d=>d.id===a.department).agents.includes(id));}}
 assert.equal(validateAgencyRegistry(),true);
});
test('il registro rifiuta omissioni, ID duplicati, riferimenti errati e privilegi amministrativi di un creativo',()=>{
 for(const mutate of [r=>r.management.pop(),r=>r.services.splice(0,1),r=>r.services.push(r.services[0]),r=>{r.services[0].agents=['sconosciuto'];},r=>{r.services[0].integrations=['sconosciuto'];},r=>{r.agents.find(a=>a.id==='social').permissions.administration=true;}]){
  const r=structuredClone(agencyRegistry);mutate(r);
  assert.throws(()=>validateAgencyRegistry(r),/Registro agenzia/);
 }
});
test('tutti i 32 agenti hanno una procedura eseguibile; ID sconosciuti restano rifiutati senza creare job',async t=>{
 const a=fixture(t),before=a.store.one('SELECT COUNT(*) n FROM os_jobs').n;
 const executors=new Set([...coreAgentIds,...specialistIds,'research','analyst','commercial','fidelity']);
 assert.equal(agencyRegistry.agents.length,32);
 for(const agent of agencyRegistry.agents){
  assert.equal(agent.status,'implemented',agent.id);assert.ok(executors.has(agent.id),'executor mancante per '+agent.id);
  assert.equal(agent.execution.implemented,true);assert.equal(agent.costCents,0);assert.equal(agent.permissions.externalActions,false);
 }
 for(const id of ['assente','../director','director;drop','']){
  assert.throws(()=>a.orchestrator.enqueue(a.owner,'demo-bigant',id),/predisposto/);
  await assert.rejects(a.orchestrator.handle({method:'POST',path:'/schedules',body:{agent:id,trigger:'daily',enabled:true},user:a.owner,clientId:'demo-bigant'}),/non ancora attivo/);
 }
 assert.equal(a.store.one('SELECT COUNT(*) n FROM os_jobs').n,before);
});
test('calendari ed eventi DEMO sono implementati ma nessuna pianificazione si attiva leggendo la mappa o ricevendo un evento',t=>{
 const a=fixture(t),before=a.store.query('SELECT * FROM os_schedules'),jobs=a.store.one('SELECT COUNT(*) n FROM os_jobs').n;
 const r=a.agency.state(a.owner);
 for(const id of ['daily','weekly-monday','weekly-friday','monthly']){const c=r.triggers.find(v=>v.id===id);assert.equal(c.kind,'calendar');assert.equal(c.implemented,true);assert.equal(c.enabledByDefault,false);assert.equal(c.timezone,'Europe/Rome');}
 for(const id of ['lead.created','client.created','content.ready','content.approved','contract.signed','review.created','objective.changed','brief.approved']){
  const e=r.triggers.find(v=>v.id===id);assert.equal(e.kind,'event');assert.equal(e.implemented,true);assert.equal(e.simulation,true);assert.equal(e.externalSourceConnected,false);assert.equal(e.enabledByDefault,false);
 }
 for(const id of ['review.created','objective.changed','brief.approved'])assert.match(r.triggers.find(v=>v.id===id).source,/provider scollegato/);
 for(const agent of r.agents)for(const trigger of agent.triggers)assert.match(trigger.execution,/regola esplicitamente attivata/);
 for(const name of ['review.created','content.approved','contract.signed'])assert.deepEqual(a.orchestrator.event(name,'demo-bigant','entita-demo-'+name).jobs,[]);
 assert.deepEqual(a.store.query('SELECT * FROM os_schedules'),before);assert.ok(before.every(s=>s.enabled===0));
 assert.equal(a.store.one('SELECT COUNT(*) n FROM os_jobs').n,jobs);
});
test('mappa e marketing sono riservati ai soci; marketing ignora il cliente selezionato e legge solo BigAnt',async t=>{
 const a=fixture(t);
 for(const u of [a.client,a.team]){assert.throws(()=>a.agency.state(u),/riservata/);assert.throws(()=>a.agency.marketing(u),/riservata/);}
 a.production.saveMemory(a.owner,'demo-bigant','dna','DNA DEMO di prova','Fixture');
 a.production.saveMemory(a.owner,'demo-bottega','dna','TESTO ALTRO CLIENTE','Fixture');
 const r=await a.agency.handle({method:'GET',path:'/marketing',user:a.owner,clientId:'demo-bottega'});
 assert.equal(r.data.clientId,'demo-bigant');assert.ok(r.data.memory.some(m=>m.content==='DNA DEMO di prova'));
 assert.ok(!JSON.stringify(r).includes('TESTO ALTRO CLIENTE'));assert.deepEqual(r.data.objectives,[]);
 assert.deepEqual(marketingChannels.map(c=>c.id),['instagram','facebook','linkedin-agency','linkedin-raffaele','linkedin-alfonso','tiktok','gbp','website','reviews']);
});
test('workspace isolato per cliente, acquisto e servizio anche in accesso diretto',t=>{
 const a=fixture(t);
 assert.throws(()=>a.agency.workspace(a.client,'demo-studio','social'),e=>e.status===403);
 assert.throws(()=>a.agency.workspace(a.team,'demo-studio','social'),e=>e.status===403);
 assert.throws(()=>a.agency.workspace(a.client,'demo-bottega','ads'),/non è disponibile/);
 const social=a.agency.workspace(a.client,'demo-bottega','social'),web=a.agency.workspace(a.client,'demo-bottega','website');
 assert.equal(social.contents[0].id,'content-demo');assert.equal(web.contents.length,0);assert.equal(web.approvals.length,0);
 assert.equal(social.service.budget,undefined);assert.equal(social.service.dataContract,undefined);assert.equal(social.service.deliveryModel,undefined);
 assert.ok(social.approvals.every(p=>social.contents.some(c=>c.id===p.entity_id)));
 a.store.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bottega'");
 assert.throws(()=>a.agency.workspace(a.client,'demo-bottega','social'),/non è disponibile/);
 assert.equal(a.agency.workspace(a.owner,'demo-bottega','social').active,false);
});
test('dashboard cliente contiene le dieci sezioni previste ma filtra i servizi non acquistati',t=>{
 const a=fixture(t);
 assert.deepEqual(agencyRegistry.dashboard.client.slice(0,10).map(s=>s.id),['overview','leads','social','advertising','local','reputation','website','approvals','reports','ask']);
 let d=a.agency.dashboard(a.client,'demo-bottega');assert.ok(!d.sections.some(s=>s.id==='advertising'));assert.ok(d.sections.some(s=>s.id==='reputation'));
 assert.ok(!JSON.stringify(d).includes('os_fin_'));assert.equal(d.services.some(s=>s.id==='merch'),false);
 a.store.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bottega'");
 d=a.agency.dashboard(a.client,'demo-bottega');assert.deepEqual(d.sections.map(s=>s.id),['overview','approvals','reports','ask']);assert.deepEqual(d.services,[]);
 a.store.run("UPDATE os_clients SET services_json='[\"reception\"]' WHERE id='demo-bottega'");
 assert.ok(a.agency.dashboard(a.client,'demo-bottega').sections.some(s=>s.id==='leads'));
});
test('i nuovi spazi dichiarano ciò che manca e non inventano KPI, prezzi o record',t=>{
 const a=fixture(t),state=a.agency.state(a.owner);
 for(const f of state.foundations){assert.equal(f.status,'Solo struttura');assert.deepEqual(f.records,[]);assert.equal(f.implementation,null);assert.ok(f.fields.length&&f.missing);}
 for(const section of state.dashboard.client){assert.equal(section.metrics,null);assert.equal(section.updatedAt,null);}
 const docs=state.management.find(m=>m.id==='documents');assert.equal(docs.status,'Solo struttura');assert.equal(docs.implementation.file,null);
 for(const id of ['documents','objectives'])assert.equal(state.dashboard.internal.find(s=>s.id===id).status,'Solo struttura');
 for(const id of ['marketplace','apple-leasing'])assert.equal(state.services.find(s=>s.id===id).excluded,true);
 assert.equal(state.services.find(s=>s.id==='merch').acquisition,false);
});
test('API struttura di sola lettura: rifiuta scritture senza aggiungere job, record o costi',async t=>{
 const a=fixture(t),before={jobs:a.store.query('SELECT * FROM os_jobs'),costs:a.store.query('SELECT * FROM os_costs'),audit:a.store.query('SELECT * FROM os_audit')};
 for(const method of ['POST','PATCH','DELETE'])for(const path of ['/state','/marketing','/services/social'])await assert.rejects(a.agency.handle({method,path,user:a.owner,clientId:'demo-bigant'}),e=>e.status===405);
 assert.deepEqual(a.store.query('SELECT * FROM os_jobs'),before.jobs);assert.deepEqual(a.store.query('SELECT * FROM os_costs'),before.costs);assert.deepEqual(a.store.query('SELECT * FROM os_audit'),before.audit);
});
test('nuove viste leggono la base comune senza rete o creazione di archivi paralleli',t=>{
 const a=fixture(t),original=globalThis.fetch,tables=a.store.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
 globalThis.fetch=()=>{throw Error('Provider vietato');};
 try{for(const service of agencyRegistry.services)a.agency.workspace(a.owner,'demo-bottega',service.id);a.agency.marketing(a.owner);a.agency.state(a.owner);a.agency.dashboard(a.client,'demo-bottega');}finally{globalThis.fetch=original;}
 assert.deepEqual(a.store.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"),tables);
});
test('router HTTP: sessione obbligatoria, negazione ai non soci e pagine cliente per acquisto',async t=>{
 const a=createApp();await new Promise(r=>a.server.listen(0,'127.0.0.1',r));t.after(()=>a.close());const origin='http://127.0.0.1:'+a.server.address().port;
 const get=(path,cookie)=>fetch(origin+path,{headers:cookie?{Cookie:cookie}:{}});
 assert.equal((await get('/api/agency/state')).status,401);
 const login=await fetch(origin+'/api/demo/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({profile:'demo-client'})});const cookie=login.headers.get('set-cookie').split(';')[0];
 for(const path of ['/state','/marketing'])assert.equal((await get('/api/agency'+path,cookie)).status,403);
 assert.equal((await get('/api/agency/services/social',cookie)).status,200);assert.equal((await get('/api/agency/services/ads',cookie)).status,403);
 assert.equal((await get('/api/agency/services/social?clientId=demo-studio',cookie)).status,403);
});
