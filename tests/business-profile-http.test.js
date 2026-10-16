import test from 'node:test';
import assert from 'node:assert/strict';
import {businessProfileAppFixture} from './helpers/business-profile-app-fixture.js';

test('GBP HTTP: flag chiuso anche nella DEMO; health non confonde letture e scritture',async t=>{
  for(const options of [{enabled:false},{real:false}]){
    const f=businessProfileAppFixture(t,options);
    const state=await f.request('GET','/api/connections/gbp/oauth/state');assert.equal(state.status,200);assert.equal(state.body.available,false);
    const read=await f.request('GET',f.path('state'));assert.equal(read.status,200);assert.equal(read.body.available,false);assert.equal(read.body.data,null);
    for(const action of ['start','finish'])assert.ok((await f.request('POST','/api/connections/gbp/oauth/'+action,{})).status>=400);
    assert.ok((await f.request('POST',f.path('accounts'),{})).status>=400);
    assert.equal(f.calls.length,0);
    const health=await f.request('GET','/health');assert.equal(health.body.externalActions,false);assert.equal(health.body.externalReadsEnabled,false);
  }
  const f=businessProfileAppFixture(t),health=await f.request('GET','/health');assert.equal(health.body.externalActions,false);assert.equal(health.body.externalReadsEnabled,true);
});

test('GBP HTTP: consenso separato, selezione, prova, attivazione e dati in Profili senza rete alla consultazione',async t=>{
  const f=businessProfileAppFixture(t);await f.authorize();
  assert.equal(f.store.one("SELECT count(*) n FROM os_connections WHERE id='google'").n,0);
  assert.equal((await f.select()).status,200);
  let state=await f.state();assert.equal(state.checked,false);assert.equal(state.enabled,false);
  assert.equal((await f.request('POST',f.path('activate'),{version:state.version,enabled:true,daily:false,confirmed:true})).status,409);
  const checked=await f.request('POST',f.path('check'),{version:state.version});assert.equal(checked.status,200,JSON.stringify(checked.body));assert.equal(checked.body.checked,true);
  state=checked.body;assert.equal(state.enabled,false);assert.equal(state.data.reviews.totalReviewCount,1);
  const activated=await f.request('POST',f.path('activate'),{version:state.version,enabled:true,daily:false,confirmed:true});assert.equal(activated.status,200);assert.equal(activated.body.enabled,true);
  const writes=f.store.one('SELECT total_changes() n').n,calls=f.calls.length;
  const profiles=await f.request('GET','/api/workspace/profiles?clientId=demo-bigant');assert.equal(profiles.status,200);assert.equal(profiles.body.items.length,6);assert.equal(profiles.body.businessProfile.data.source,'Google Business Profile');
  const progress=await f.request('GET','/api/workspace/progress');const item=progress.body.items.find(x=>x.id==='profiles');assert.equal(item.status,'Prova');assert.match(item.summary,/1 attività abilitate/);
  assert.equal(f.store.one('SELECT total_changes() n').n,writes);assert.equal(f.calls.length,calls);
  const saved=await f.request('PATCH','/api/workspace/profiles/website?clientId=demo-bigant',{version:0,url:'https://attivita-inventata.example.com/',sourceUrl:'https://fonte-inventata.example.com/contatti',confirmedBusiness:true});
  assert.equal(saved.status,200);assert.equal(saved.body.businessProfile.enabled,true);assert.equal(saved.body.businessProfile.data.reviews.totalReviewCount,1);assert.equal(f.calls.length,calls);
  assert.ok(f.calls.filter(x=>!x.url.endsWith('/token')).every(x=>x.method==='GET'));
  assert.doesNotMatch(JSON.stringify([profiles.body,progress.body]),/accesso-gbp-inventato|rinnovo-gbp-inventato|segreto-gbp-inventato/);
});

test('GBP HTTP: autenticazione, origine, CSRF, metodi e callback senza effetti esterni',async t=>{
  const f=businessProfileAppFixture(t),url='/api/connections/gbp/oauth/start';
  assert.equal((await f.request('GET',f.path('state'),undefined,{user:null})).status,401);
  for(const options of [{token:'errato'},{requestOrigin:'https://altra.example'}])assert.equal((await f.request('POST',url,{},options)).status,403);
  for(const [method,path]of [['GET',url],['POST',f.path('state')],['DELETE',f.path('configure')]])assert.equal((await f.request(method,path,{})).status,405);
  const callback=await f.request('GET','/auth/google-business/callback?code=codice-inventato&state=stato-inventato',undefined,{user:null});assert.equal(callback.status,200);assert.match(callback.headers['content-type'],/text\/html/);assert.equal(callback.headers['referrer-policy'],'no-referrer');
  assert.equal(f.calls.length,0);
  f.store.run('UPDATE os_users SET must_change_password=1 WHERE id=?',f.ownerId);assert.equal((await f.request('GET',f.path('state'))).status,403);
});

test('GBP HTTP: cliente vede solo la cache autorizzata propria; senza servizio mantiene i soli link pubblici',async t=>{
  const f=businessProfileAppFixture(t);await f.authorize();await f.select();let state=await f.state();state=(await f.request('POST',f.path('check'),{version:state.version})).body;
  f.store.run("INSERT INTO os_users(id,name,email,role,tenant_id,created_at) VALUES('cliente-gbp','Cliente inventato','cliente@fixture.example','client','demo-bigant','2026-10-10')");f.addSession('cliente-gbp');
  const client={user:'cliente-gbp'};
  assert.equal((await f.request('GET',f.path('state'),undefined,client)).body.data,null);
  await f.request('POST',f.path('activate'),{version:state.version,enabled:true,daily:false,confirmed:true});
  const data=await f.request('GET',f.path('state'),undefined,client);assert.equal(data.status,200);assert.equal(data.body.canManage,false);assert.equal(data.body.data.reviews.totalReviewCount,1);
  const calls=f.calls.length;
  for(const action of ['accounts','locations','configure','check','activate','refresh'])assert.equal((await f.request('POST',f.path(action),{},client)).status,403);
  assert.equal((await f.request('GET','/api/connections/gbp/oauth/state',undefined,client)).status,403);
  assert.equal((await f.request('GET',f.path('state','attivita-altrui'),undefined,client)).status,403);
  f.store.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bigant'");assert.equal((await f.request('GET',f.path('state'),undefined,client)).status,403);
  const profiles=await f.request('GET','/api/workspace/profiles?clientId=demo-bigant',undefined,client);assert.equal(profiles.status,200);assert.equal(profiles.body.businessProfile,null);assert.equal(profiles.body.items.length,6);
  assert.equal(f.calls.length,calls);
});

test('GBP HTTP: disconnessione toglie cache e autorizzazione, errore remoto non espone dettagli',async t=>{
  const f=businessProfileAppFixture(t);await f.authorize();await f.select();let state=await f.state();state=(await f.request('POST',f.path('check'),{version:state.version})).body;
  await f.request('POST',f.path('activate'),{version:state.version,enabled:true,daily:true,confirmed:true});
  f.fail({host:'mybusiness.googleapis.com',status:403});
  const refresh=await f.request('POST',f.path('refresh'),{version:(await f.state()).version});assert.ok(refresh.status>=400||refresh.body.error);assert.doesNotMatch(JSON.stringify(refresh.body),/dettaglio-riservato/);
  const auth=(await f.request('GET','/api/connections/gbp/oauth/state')).body;
  assert.equal((await f.request('POST','/api/connections/gbp/oauth/disconnect',{version:auth.version})).status,200);
  state=await f.state();assert.equal(state.enabled,false);assert.equal(state.data,null);
  const calls=f.calls.length;await f.app.businessProfile.tick();assert.equal(f.calls.length,calls);
});

test('GBP HTTP: collaboratore assegnato escluso e cambio servizio non rompe Profili del socio',async t=>{
  const f=businessProfileAppFixture(t);
  f.store.run("INSERT INTO os_users(id,name,email,role,created_at) VALUES('collab-gbp','Collaboratore inventato','collab@fixture.example','collaborator','2026-10-10')");
  f.store.run("INSERT INTO os_assignments VALUES('collab-gbp','demo-bigant')");f.addSession('collab-gbp');
  for(const [method,path]of [['GET',f.path('state')],['POST',f.path('accounts')],['GET','/api/connections/gbp/oauth/state'],['POST','/api/connections/gbp/oauth/disconnect']])assert.equal((await f.request(method,path,{}, {user:'collab-gbp'})).status,403);
  f.store.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bigant'");
  const profiles=await f.request('GET','/api/workspace/profiles?clientId=demo-bigant');assert.equal(profiles.status,200);assert.equal(profiles.body.items.length,6);assert.equal(profiles.body.businessProfile.canManage,false);assert.equal(profiles.body.businessProfile.data,null);
  assert.equal(f.calls.length,0);
});

test('GBP HTTP: il worker legge solo dopo autorizzazione giornaliera esplicita e non ripete il giro',async t=>{
  const f=businessProfileAppFixture(t);await f.authorize();await f.select();let state=await f.state();state=(await f.request('POST',f.path('check'),{version:state.version})).body;
  state=(await f.request('POST',f.path('activate'),{version:state.version,enabled:true,daily:false,confirmed:true})).body;
  let calls=f.calls.length;f.advance(86400000);await f.app.businessProfile.tick();assert.equal(f.calls.length,calls);
  assert.equal((await f.request('POST',f.path('activate'),{version:state.version,enabled:true,daily:true,confirmed:true})).status,409);
  state=(await f.request('POST',f.path('check'),{version:state.version})).body;
  state=(await f.request('POST',f.path('activate'),{version:state.version,enabled:true,daily:true,confirmed:true})).body;assert.equal(state.daily,true);
  calls=f.calls.length;f.advance(86400000);
  await f.app.businessProfile.tick();assert.ok(f.calls.length>calls);calls=f.calls.length;
  await f.app.businessProfile.tick();assert.equal(f.calls.length,calls);
  f.env.BIGANT_GBP_ENABLED='false';await f.app.businessProfile.tick();assert.equal(f.calls.length,calls);
  state=await f.state();assert.equal(state.enabled,false);assert.equal(state.data,null);
});
