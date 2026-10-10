import test from 'node:test';
import assert from 'node:assert/strict';
import {metaProfilesFixture} from './helpers/meta-profiles-fixture.js';
import {createMetaProfiles} from '../src/meta-profiles.js';
const deny=status=>error=>error.status===status;

test('Meta: flag spento e DEMO non fanno rete; state e progress sono solo lettura',async t=>{
 for(const options of [{enabled:false},{real:false}]){const f=metaProfilesFixture(t,options),writes=f.store.one('SELECT total_changes() n').n;assert.equal(f.state().available,false);assert.equal(f.runtime.progress(f.owner).cachedCount,0);assert.equal(f.store.one('SELECT total_changes() n').n,writes);await assert.rejects(f.selection(),deny(409));assert.equal(f.calls.length,0);assert.equal((await f.request('GET','/health')).body.externalReadsEnabled,false);}
});
test('Meta: selezione, prova privata, attivazione e report Social isolato senza rete alla consultazione',async t=>{
 const f=metaProfilesFixture(t);await f.configure();assert.throws(()=>f.activate(),deny(409));const checked=await f.check();assert.equal(checked.checked,true);assert.equal(checked.enabled,false);assert.equal(checked.data.instagram.metrics[0].value,180);assert.equal(f.state(f.client).data,null);
 let preview=await f.request('GET','/api/cliente/services/social?clientId=demo-bigant');assert.equal(preview.body.meta,null);await f.activate();const calls=f.calls.length,writes=f.store.one('SELECT total_changes() n').n;
 assert.equal(f.state(f.client).data.facebook.profile.followers,1000);preview=await f.request('GET','/api/cliente/services/social?clientId=demo-bigant',{},{user:f.client.id});assert.equal(preview.status,200);assert.ok(preview.body.meta.instagram);assert.equal(f.store.one('SELECT total_changes() n').n,writes);assert.equal(f.calls.length,calls);
 assert.doesNotMatch(JSON.stringify(preview.body),/user-token|page-token|authorized_by|configured_by/);assert.equal((await f.request('GET','/health')).body.externalActions,false);
 assert.equal((await f.request('GET','/api/cliente/services/local?clientId=demo-bigant')).body.meta,null);
});
test('Meta: HTTP blocca anonimo, CSRF, ruolo, cliente incrociato e servizio assente',async t=>{
 const f=metaProfilesFixture(t);assert.equal((await f.request('GET',f.path('state'),undefined,{user:null})).status,401);
 for(const options of [{token:'bad'},{requestOrigin:'https://untrusted.example'},{user:f.client.id},{user:f.collaborator.id}])assert.equal((await f.request('POST',f.path('pages'),{confirmed:true},options)).status,403);
 assert.equal((await f.request('GET',f.path('state','other-client'),undefined,{user:f.client.id})).status,403);
 assert.equal((await f.request('GET',f.path('state'),undefined,{user:f.collaborator.id})).status,403);
 f.store.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bigant'");await assert.rejects(f.selection(),deny(403));assert.equal(f.calls.length,0);
});
test('Meta: token selezione monouso, legato a sessione, cliente, credenziali, versione e scadenza',async t=>{
 for(const reason of ['client','session','expired','credentials','version']){const f=metaProfilesFixture(t);f.store.run('INSERT INTO os_sessions VALUES(?,?,?,?)','s1',f.owner.id,'csrf',f.clock().getTime()+3600000);const user={...f.owner,session_id:'s1'},token=await f.selection('demo-bigant',user);let id='demo-bigant',who=user;
 if(reason==='client')id='other-client';if(reason==='session')who=f.owner;if(reason==='expired')f.advance(600001);if(reason==='credentials')f.app.connections.save(f.owner,'meta',{version:1,fields:{accessToken:'changed-fixture'}});if(reason==='version')f.store.run("INSERT INTO os_meta_profiles(client_id,version) VALUES('demo-bigant',1)");
 assert.throws(()=>f.runtime.configure(who,id,{version:f.state(f.owner,id).version,selectionToken:token,channels:['facebook'],confirmedBusiness:true}),deny(409));}
 const f=metaProfilesFixture(t);const token=await f.selection();const b={version:0,selectionToken:token,channels:['facebook'],confirmedBusiness:true};f.runtime.configure(f.owner,'demo-bigant',b);assert.throws(()=>f.runtime.configure(f.owner,'demo-bigant',{...b,version:1}),deny(409));
});
test('Meta: pagina e Instagram esclusivi; disconnessione libera la riserva e cancella la copia',async t=>{
 const f=metaProfilesFixture(t);await f.configure();await f.check();await f.activate();await assert.rejects(f.configure('other-client'),deny(409));
 f.payload.page.id='789';await assert.rejects(f.configure('other-client'),e=>e.status===409&&/Instagram/.test(e.message));
 const off=f.runtime.disconnect(f.owner,'demo-bigant',{version:2,confirmed:true});assert.equal(off.data,null);assert.equal(off.configured,false);await f.configure('other-client');
 f.payload.page.id='111';await f.configure('demo-bigant',['facebook']);assert.equal(f.store.one("SELECT instagram_id FROM os_meta_profiles WHERE client_id='demo-bigant'").instagram_id,null);
});
test('Meta: errori e revoche in volo non pubblicano dati; nessun dettaglio remoto',async t=>{
 for(const reason of ['flag','paused','role','client','service','credential','session','disconnect']){const f=metaProfilesFixture(t);f.store.run('INSERT INTO os_sessions VALUES(?,?,?,?)','s1',f.owner.id,'csrf',f.clock().getTime()+3600000);const user={...f.owner,session_id:'s1'};await f.configure('demo-bigant',['instagram'],user);let ran=false;f.hook(()=>{if(ran)return;ran=true;
 if(reason==='flag')f.env.BIGANT_META_PROFILES_ENABLED='false';if(reason==='paused')f.store.setSetting('paused','true');if(reason==='role')f.store.run("UPDATE os_users SET role='collaborator' WHERE id=?",f.owner.id);if(reason==='client')f.store.run("UPDATE os_clients SET active=0 WHERE id='demo-bigant'");if(reason==='service')f.store.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bigant'");if(reason==='credential')f.app.connections.save(f.owner,'meta',{version:1,fields:{accessToken:'changed-fixture'}});if(reason==='session')f.store.run("DELETE FROM os_sessions WHERE id='s1'");if(reason==='disconnect')f.runtime.disconnect(user,'demo-bigant',{version:1,confirmed:true});});
 await assert.rejects(f.check(user),e=>[403,409].includes(e.status));assert.equal(f.store.one("SELECT checked_at FROM os_meta_profiles WHERE client_id='demo-bigant'").checked_at,null);}
 const f=metaProfilesFixture(t);await f.configure();await f.check();await f.activate();f.advance(60001);f.hook(()=>new Response('private-remote',{status:429}));await assert.rejects(f.runtime.refresh(f.owner,'demo-bigant',{version:2}),deny(502));assert.equal(f.state().data,null);assert.doesNotMatch(f.state().error,/private-remote/);
});
test('Meta: revoca collaudatore o attivatore elimina anche la copia per altri soci',async t=>{
 for(const step of ['check','activate']){const f=metaProfilesFixture(t);f.store.run("INSERT INTO os_users(id,name,email,role,created_at) VALUES('second','Secondo','second@fixture.example','owner',?)",f.clock().toISOString());const second=f.store.one("SELECT * FROM os_users WHERE id='second'");await f.configure();await f.check(step==='check'?second:f.owner);await f.activate(true,step==='activate'?second:f.owner);f.store.run("UPDATE os_users SET active=0 WHERE id='second'");assert.equal(f.state().data,null);assert.equal(f.state().enabled,false);assert.equal(f.state(f.client).data,null);f.advance(86400000);assert.equal((await f.runtime.tick()).attempted,0);}
});
test('Meta: cache solo RAM, scade dall’inizio, non viene rinnovata da state o dal riavvio',async t=>{
 const f=metaProfilesFixture(t);await f.configure();let once=true;f.hook(()=>{if(once){once=false;f.advance(60000);}});const checked=await f.check();await f.activate();assert.equal(checked.data.expiresAt,'2026-10-11T12:00:00.000Z');
 const persisted=JSON.stringify([...f.store.query('SELECT * FROM os_meta_profiles'),...f.store.query('SELECT * FROM os_audit')]);assert.doesNotMatch(persisted,/Bottega Meta|Bottega Instagram|bottega_fixture|user-token|page-token|total_interactions/);
 const cold=createMetaProfiles({store:f.store,connections:f.app.connections,enabled:true,clock:f.clock});t.after(()=>cold.close());assert.equal(cold.state(f.owner,'demo-bigant').data,null);assert.ok(cold.state(f.owner,'demo-bigant').lastSync);f.advance(86400000-60000);assert.equal(f.state().data,null);assert.ok(f.state().lastSync);
});
test('Meta: paginazione limitata alla selezione corrente e payload chiusi',async t=>{
 const f=metaProfilesFixture(t);f.payload.after='next';await f.selection();await f.runtime.pages(f.owner,'demo-bigant',{confirmed:true,after:'next'});await assert.rejects(f.runtime.pages(f.owner,'other-client',{confirmed:true,after:'next'}),deny(409));await assert.rejects(f.runtime.pages(f.owner,'demo-bigant',{confirmed:true,after:'invented'}),deny(409));await assert.rejects(f.runtime.pages(f.owner,'demo-bigant',{confirmed:true,url:'https://evil.invalid'}),deny(400));await f.configure();for(const b of [null,[],{version:'1'},{version:1,force:true}])await assert.rejects(f.runtime.check(f.owner,'demo-bigant',b),deny(400));
});
test('Meta: aggiornamento massimo giornaliero, niente retry dopo errore, refresh limitato',async t=>{
 const f=metaProfilesFixture(t);await f.configure();await f.check();await f.activate(true);await assert.rejects(f.runtime.refresh(f.owner,'demo-bigant',{version:2}),deny(429));assert.equal((await f.runtime.tick()).attempted,0);f.advance(86400000);f.hook(()=>new Response('',{status:429}));const [a,b]=await Promise.all([f.runtime.tick(),f.runtime.tick()]);assert.equal(a.attempted+b.attempted,1);assert.equal(a.failed+b.failed,1);assert.equal((await f.runtime.tick()).attempted,0);f.hook(null);f.advance(86400000);assert.equal((await f.runtime.tick()).succeeded,1);
});
test('Meta: blocca letture concorrenti e close attende lo scarto delle risposte tardive',async t=>{
 const f=metaProfilesFixture(t);await f.configure();let release,entered;const started=new Promise(r=>entered=r),wait=new Promise(r=>release=r);f.hook(async()=>{entered();await wait;});const first=f.check();await started;await assert.rejects(f.check(),deny(409));const ending=f.runtime.close();release();await assert.rejects(first,deny(409));await ending;assert.equal(f.state().data,null);assert.equal(f.store.one('SELECT checked_at FROM os_meta_profiles').checked_at,null);
});
