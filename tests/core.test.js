import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {createApp} from '../server.js';
import {openStore,seedCore,passwordHash,verifyPassword} from '../src/store.js';
import {createProduction} from '../src/production.js';
import {createOrchestrator,nextRun} from '../src/orchestrator.js';

async function setup(t) {
 const app=createApp(); await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 t.after(()=>app.close());const origin=`http://127.0.0.1:${app.server.address().port}`;
 async function profile(id) {const r=await fetch(origin+'/api/demo/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({profile:id})});const b=await r.json();assert.equal(r.status,200);return {cookie:r.headers.get('set-cookie').split(';')[0],csrf:b.csrf};}
 async function request(path,{user,method='GET',body,headers={}}={}) {const r=await fetch(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(user?{Cookie:user.cookie,'X-CSRF-Token':user.csrf}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});const type=r.headers.get('content-type');return {status:r.status,body:type?.includes('json')?await r.json():await r.text(),headers:r.headers};}
 return {...app,origin,profile,request};
}
test('sessioni reali: cookie protetto, Origin, CSRF, logout, pagine e asset',async t=>{
 const a=await setup(t),u=await a.profile('demo-owner');
 assert.equal((await a.request('/api/overview')).status,401);
 assert.equal((await a.request('/api/overview',{user:u})).body.user.role,'owner');
 assert.equal((await a.request('/api/agents/pause',{method:'POST',user:u,body:{paused:true},headers:{Origin:'https://evil.example'}})).status,403);
 assert.equal((await a.request('/api/agents/pause',{method:'POST',user:u,body:{paused:true},headers:{'X-CSRF-Token':''}})).status,403);
 assert.equal((await a.request('/',{})).status,200);
 assert.equal((await a.request('/brand/logo.png',{})).status,200);
 assert.equal((await a.request('/api/fidelity/wallet/icon.png')).status,200);
 assert.equal((await a.request('/api/logout',{method:'POST',user:u,body:{}})).status,200);
 assert.equal((await a.request('/api/overview',{user:u})).status,401);
});
test('isola economia, agenti e CRM dal cliente e dal collaboratore, indipendentemente dalla UI',async t=>{
 const a=await setup(t);
 for(const id of ['demo-client','demo-collaborator']) {const u=await a.profile(id);for(const module of ['administration','agents','growth']) assert.equal((await a.request(`/api/${module}/state?clientId=demo-bottega`,{user:u})).status,403);assert.equal((await a.request('/api/overview?clientId=demo-studio',{user:u})).status,403);const b=(await a.request('/api/overview?clientId=demo-bottega',{user:u})).body;assert.equal(b.admin,null);assert.equal(b.clients.length,1);assert.ok(!JSON.stringify(b).includes('password_hash'));}
 const b=await a.profile('demo-client-other');assert.equal((await a.request('/api/fidelity/state?clientId=demo-studio',{user:b})).status,403);
});
test('servizi non acquistati non compaiono né nella panoramica né nelle API dirette',async t=>{
 const a=await setup(t),u=await a.profile('demo-client');
 a.store.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bottega'");
 for(const path of ['/api/overview','/api/production/state']){const r=await a.request(path+'?clientId=demo-bottega',{user:u});assert.equal(r.status,200);assert.equal(r.body.contents.length,0);}
 assert.equal((await a.request('/api/approvals/approval-demo?clientId=demo-bottega',{user:u,method:'POST',body:{decision:'approved'}})).status,403);
 assert.equal((await a.request('/api/production/ask?clientId=demo-bottega',{user:u,method:'POST',body:{question:'Come va?'}})).body.answer.includes('0 contenuti'),true);
});
test('approvazione, feedback, revisione obsoleta e pianificazione interna senza pubblicare',async t=>{
 const a=await setup(t),u=await a.profile('demo-owner'),client=await a.profile('demo-client');
 const req=(path,body,user=u)=>a.request('/api/'+path+'?clientId=demo-bottega',{user,method:'POST',body});
 assert.equal((await req('approvals/approval-demo',{decision:'changes',reason:'Mostrare i materiali.'},client)).status,200);
 const memory=a.store.one("SELECT * FROM os_memory WHERE kind='feedback' AND client_id='demo-bottega'");assert.match(memory.content,/Mostrare i materiali/);
 let c=a.store.one("SELECT * FROM os_contents WHERE id='content-demo'");assert.equal(c.version,2);
 assert.equal((await req('approvals/approval-demo',{decision:'approved'})).status,409);
 const patch=body=>a.request('/api/production/contents/content-demo?clientId=demo-bottega',{user:u,method:'PATCH',body});
 assert.equal((await patch({version:1,state:'DA APPROVARE'})).status,409);
 assert.equal((await patch({version:2,state:'DA APPROVARE'})).status,200);
 const ap=a.store.one("SELECT * FROM os_approvals WHERE entity_id='content-demo' AND version=2");assert.equal((await req('approvals/'+ap.id,{decision:'approved'},client)).status,200);
 assert.equal((await patch({version:2,state:'PROGRAMMATO',scheduled_at:new Date(Date.now()+86400000).toISOString()})).status,200);
 assert.equal((await patch({version:2,state:'PUBBLICATO'})).status,409);
 const revision=await patch({version:2,body:'Nuovo testo DEMO'});assert.equal(revision.body.version,3);assert.equal(revision.body.scheduled_at,null);assert.equal(a.store.one('SELECT status FROM os_approvals WHERE id=?',ap.id).status,'obsolete');
});
test('disattivazione utente invalida sessioni e la memoria amministrativa resta riservata',async t=>{
 const a=await setup(t),u=await a.profile('demo-owner'),co=await a.profile('demo-collaborator');
 a.store.run("UPDATE os_memory SET visibility='admin' WHERE client_id='demo-bottega' AND kind='master'");
 assert.equal((await a.request('/api/production/memory?clientId=demo-bottega',{method:'POST',user:co,body:{kind:'master',content:'Non autorizzato'}})).status,403);
 assert.equal((await a.request('/api/users/demo-collaborator',{method:'PATCH',user:u,body:{active:false}})).status,200);
 assert.equal((await a.request('/api/overview',{user:co})).status,401);
 const hash=passwordHash('Esempio-test-effimero-2026');assert.ok(verifyPassword('Esempio-test-effimero-2026',hash));assert.equal(verifyPassword('errata',hash),false);
});
test('calendario Europe/Rome: cambio ora, venerdì e primo del mese',()=>{
 assert.equal(nextRun('daily',new Date('2026-10-24T08:00:00Z')),'2026-10-25T08:00:00.000Z');
 assert.equal(nextRun('weekly-friday',new Date('2026-10-08T11:00:00Z')),'2026-10-09T07:00:00.000Z');
 assert.equal(nextRun('monthly',new Date('2026-12-31T23:30:00Z')),'2027-01-01T08:00:00.000Z');
 assert.equal(nextRun('event:content.ready'),null);
});
test('coda persistente: lease interrotta, retry limitato, deduplica e contesto senza contabilità',async t=>{
 const s=openStore();seedCore(s);t.after(()=>s.close());let date=new Date('2026-10-08T09:00:00Z'),fail=true;
 const p=createProduction({store:s});const o=createOrchestrator({store:s,production:p,clock:()=>date,testHandlers:{account:c=>{assert.equal(c.memory.some(m=>m.visibility==='admin'),false);assert.equal(c.movements,undefined);if(fail)throw new Error('Guasto DEMO controllato');return {summary:'Ripreso',sources:['DEMO']};}}});
 const u=s.one("SELECT * FROM os_users WHERE id='demo-owner'");const j=o.enqueue(u,'demo-bottega','account',{},'same');assert.equal(o.enqueue(u,'demo-bottega','account',{},'same').id,j.id);
 await o.tick();assert.equal(s.one('SELECT attempts FROM os_jobs WHERE id=?',j.id).attempts,1);
 date=new Date(date.getTime()+31000);await o.tick();date=new Date(date.getTime()+61000);await o.tick();assert.equal(s.one('SELECT status FROM os_jobs WHERE id=?',j.id).status,'failed');
 fail=false;await o.handle({method:'POST',path:'/jobs/'+j.id+'/retry',body:{},user:u});await o.tick();assert.equal(s.one('SELECT status FROM os_jobs WHERE id=?',j.id).status,'done');
 const interrupted=o.enqueue(u,'demo-bottega','social',{},'interrupted');s.run("UPDATE os_jobs SET status='running',attempts=1,lease_until=? WHERE id=?",new Date(date.getTime()-1000).toISOString(),interrupted.id);await o.tick();await o.tick();assert.equal(s.one("SELECT count(*) n FROM os_contents WHERE id=?",'agent-content-'+interrupted.id).n,1);assert.equal(s.one('SELECT attempts FROM os_jobs WHERE id=?',interrupted.id).attempts,2);
});
test('budget centralizzato e pausa comune fermano i lavori senza falsi costi',async t=>{
 const a=createApp();t.after(()=>a.close());const u=a.store.one("SELECT * FROM os_users WHERE id='demo-owner'");
 a.orchestrator.reserve('demo-bigant','proof',1500);assert.equal(a.orchestrator.budget().availableCents,0);assert.throws(()=>a.orchestrator.reserve('demo-bigant','proof',1),/Budget/);
 a.orchestrator.enqueue(u,'demo-bigant','account');a.store.setSetting('paused',true);await a.orchestrator.tick();assert.equal(a.store.one("SELECT status FROM os_jobs").status,'queued');
 assert.equal(a.orchestrator.state(u).moduleJobs.some(j=>j.module==='fidelity'),true);
});
test('database si riapre senza duplicare fixture né perdere lavori, consensi e movimenti',async()=>{
 const dir=mkdtempSync(resolve('.cache/test-persistence-')),file=resolve(dir,'demo.sqlite');
 try{let a=createApp({database:file});const u=a.store.one("SELECT * FROM os_users WHERE id='demo-owner'");const job=a.orchestrator.enqueue(u,'demo-bigant','account');const counts=a.store.query('SELECT count(*) n FROM os_clients')[0].n;await a.close();a=createApp({database:file});assert.equal(a.store.one('SELECT count(*) n FROM os_clients').n,counts);assert.equal(a.store.one('SELECT id FROM os_jobs WHERE id=?',job.id).id,job.id);await a.orchestrator.tick();assert.equal(a.store.one('SELECT status FROM os_jobs WHERE id=?',job.id).status,'done');await a.close();}finally{rmSync(dir,{recursive:true,force:true});}
});
test('scheduler unico esegue Growth e Fidelity offline, nessuna chiamata a provider',async t=>{
 const a=createApp();t.after(()=>a.close());const u=a.store.one("SELECT * FROM os_users WHERE id='demo-owner'");a.growth.store.saveSettings('demo-bigant',{paused:false});await a.growth.handle({method:'POST',path:'/jobs',body:{type:'research'},user:u,clientId:'demo-bigant'});
 const previous=globalThis.fetch;globalThis.fetch=()=>{throw Error('Rete vietata nel collaudo DEMO');};
 try{await a.orchestrator.tick();await a.orchestrator.tick();assert.ok(a.store.one("SELECT count(*) n FROM gr_leads").n>2);assert.ok(a.orchestrator.state(u).moduleJobs.some(j=>j.module==='growth'&&j.status==='done'));assert.equal(a.orchestrator.budget().usedCents,0);assert.equal(a.orchestrator.state(u).moduleErrors.fidelity,null);}finally{globalThis.fetch=previous;}
});

test('QR tessera pubblica e iscrizione programma: PNG reali, isolamento e revoca',async t=>{
 const a=await setup(t),u=await a.profile('demo-owner'),other=await a.profile('demo-client-other');
 const token=a.store.one("SELECT public_token FROM fi_members WHERE id='fi-demo-member'").public_token;
 let r=await a.request('/api/fidelity/public/cards/'+token+'/qr');assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/png');
 r=await a.request('/api/fidelity/programs/fi-demo-stamps/qr?clientId=demo-bottega',{user:u});assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/png');
 assert.equal((await a.request('/api/fidelity/programs/fi-demo-stamps/qr?clientId=demo-studio',{user:other})).status,403);
 a.store.run("UPDATE fi_members SET status='deleted' WHERE id='fi-demo-member'");assert.notEqual((await a.request('/api/fidelity/public/cards/'+token+'/qr')).status,200);
});

test('memoria conserva testo e fonte delle versioni precedenti senza esporre versioni amministrative',()=>{
 const a=createApp();try{const u=a.store.one("SELECT * FROM os_users WHERE id='demo-owner'");a.production.saveMemory(u,'demo-bottega','dna','Prima voce','Brief DEMO');a.production.saveMemory(u,'demo-bottega','dna','Seconda voce','Feedback DEMO');const rows=a.store.query("SELECT * FROM os_memory_versions WHERE client_id='demo-bottega' AND kind='dna' ORDER BY version");assert.equal(rows.length,2);assert.equal(rows[0].content,'Prima voce');assert.equal(rows[1].source,'Feedback DEMO');assert.equal(rows[1].version,2);assert.throws(()=>a.store.run("UPDATE os_memory_versions SET content='alterato' WHERE kind='dna'"),/immutabile/);assert.throws(()=>a.store.run("DELETE FROM os_memory_versions WHERE kind='dna'"),/immutabile/);}finally{a.store.close();}
});

test('un cliente riuscito non nasconde il guasto Fidelity di un altro nel giro comune',async t=>{
 const app=createApp(),s=app.store;t.after(()=>app.close());let broken=true;const o=createOrchestrator({store:s,production:createProduction({store:s}),fidelity:{tick:id=>{if(id==='demo-bigant'&&broken)throw Error('Errore fixture da verificare');return {prepared:[]};}}});const u=s.one("SELECT * FROM os_users WHERE id='demo-owner'");await o.tick();assert.match(o.state(u).moduleErrors.fidelity,/Errore fixture/);broken=false;await o.tick();assert.equal(o.state(u).moduleErrors.fidelity,null);
});
