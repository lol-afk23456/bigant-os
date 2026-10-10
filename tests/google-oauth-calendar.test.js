import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore,seedCore} from '../src/store.js';
import {createConnections} from '../src/connections.js';
import {createGoogleOAuth,GMAIL_SCOPES,CALENDAR_SCOPES} from '../src/google-oauth.js';

const ALL_SCOPES=[...GMAIL_SCOPES,...CALENDAR_SCOPES];
function setup(t,{enabled=true,calendarEnabled=true,legacySchema=false}={}){
 const store=openStore();seedCore(store);t.after(()=>store.close());
 if(legacySchema)store.db.exec('CREATE TABLE os_google_oauth_states(hash TEXT PRIMARY KEY,session_id TEXT NOT NULL,user_id TEXT NOT NULL,version INTEGER NOT NULL,expected_email TEXT NOT NULL,verifier TEXT NOT NULL,expires INTEGER NOT NULL,consumed INTEGER NOT NULL DEFAULT 0)');
 const owner={...store.one("SELECT * FROM os_users WHERE id='demo-owner'"),session_id:'sessione-calendar-fixture'},env={BIGANT_SECRET_KEY:Buffer.alloc(32,8).toString('base64')},connections=createConnections({store,env}),requests=[],control={calendar:calendarEnabled,scopes:ALL_SCOPES};
 let offset=0;const clock=()=>new Date(Date.now()+offset);
 store.run('INSERT INTO os_sessions VALUES(?,?,?,?)',owner.session_id,owner.id,'csrf-calendar-fixture',clock().getTime()+3600000);
 connections.save(owner,'google',{version:0,fields:{clientId:'id-google-inventato',clientSecret:'segreto-google-inventato'}});
 const fetchImpl=async(url,options)=>{const token=String(url).endsWith('/token');requests.push({url:String(url),options});if(control.before)await control.before(token?'token':'profile');return new Response(JSON.stringify(token?{access_token:'accesso-calendar-finto',refresh_token:'rinnovo-calendar-finto',token_type:'Bearer',scope:control.scopes.join(' ')}:{emailAddress:control.email||'mittente@fixture.example'}));};
 const build=()=>createGoogleOAuth({store,connections,env,origin:'https://os.example',enabled,calendarEnabled:()=>control.calendar,clock,providerOptions:{fetchImpl}}),auth=build();
 const start=(extra={})=>new URL(auth.start(owner,{version:connections.runtimeMetadata('google').version,email:'mittente@fixture.example',acknowledged:true,...extra}).url);
 const finish=(url,extra={},who=owner)=>auth.finish(who,{state:url.searchParams.get('state'),code:'codice-finto',...extra});
 return {store,owner,connections,requests,control,auth,start,finish,build,advance:ms=>offset+=ms};
}

test('Calendar è opt-in: URL e record chiedono solo Gmail per default, nessun consenso implicito',async t=>{
 const f=setup(t),url=f.start();assert.deepEqual(url.searchParams.get('scope').split(' '),GMAIL_SCOPES);assert.equal(url.searchParams.get('include_granted_scopes'),'false');
 assert.deepEqual(JSON.parse(f.store.one('SELECT requested_scopes_json FROM os_google_oauth_states').requested_scopes_json),GMAIL_SCOPES);
 const state=await f.finish(url,{calendar:true,scope:ALL_SCOPES.join(' '),scopes:ALL_SCOPES});
 assert.equal(state.connected,true);assert.equal(state.calendarAvailable,true);assert.equal(state.calendarConnected,false);assert.deepEqual(state.scopes,GMAIL_SCOPES);
 assert.deepEqual(f.auth.credentials(f.owner,state.version).scopes,GMAIL_SCOPES);assert.throws(()=>f.auth.credentials(f.owner,state.version,{calendar:true}),/Calendar da autorizzare/);
 assert.equal(f.requests.length,2);
});

test('Calendar esplicito: scope minimi, casella verificata e credenziali legate alla nuova versione',async t=>{
 const f=setup(t),url=f.start({calendar:true});assert.deepEqual(url.searchParams.get('scope').split(' '),ALL_SCOPES);
 assert.deepEqual(JSON.parse(f.store.one('SELECT requested_scopes_json FROM os_google_oauth_states').requested_scopes_json),ALL_SCOPES);
 const state=await f.finish(url,{calendar:false,scope:GMAIL_SCOPES.join(' ')});assert.equal(state.calendarConnected,true);assert.equal(state.connected,true);assert.equal(state.version,2);assert.deepEqual(state.scopes,ALL_SCOPES);
 assert.equal(f.connections.state(f.owner).items.find(row=>row.id==='google').authorization.calendarConnected,true);
 assert.equal(f.auth.credentials(f.owner,2,{calendar:true}).refreshToken,'rinnovo-calendar-finto');assert.throws(()=>f.auth.credentials(f.owner,1,{calendar:true}),/cambiati/);
 assert.equal(f.store.one('SELECT verifier FROM os_google_oauth_states').verifier,'');await assert.rejects(f.finish(url),/già utilizzata/);
 const publicState=JSON.stringify(state)+JSON.stringify(f.connections.state(f.owner))+JSON.stringify(f.store.query('SELECT * FROM os_audit'))+JSON.stringify(f.store.query('SELECT * FROM os_connections'));
 for(const secret of ['accesso-calendar-finto','rinnovo-calendar-finto','codice-finto','segreto-google-inventato'])assert.ok(!publicState.includes(secret));
});

test('Consenso parziale: mancare anche un solo scope richiesto impedisce la connessione',async t=>{
 for(const missing of ALL_SCOPES)await t.test(missing.split('/').at(-1),async t=>{
  const f=setup(t),url=f.start({calendar:true});f.control.scopes=ALL_SCOPES.filter(scope=>scope!==missing);
  await assert.rejects(f.finish(url,{calendar:false,scope:ALL_SCOPES.join(' ')}),/tutti i permessi/);assert.equal(f.requests.length,1);assert.equal(f.auth.state(f.owner).connected,false);assert.equal(f.auth.state(f.owner).calendarConnected,false);assert.equal(f.connections.runtimeMetadata('google').version,1);assert.equal(f.store.one('SELECT verifier FROM os_google_oauth_states').verifier,'');
 });
});

test('Flag spenti e consenso assente fermano Calendar prima della rete e della creazione dello stato',t=>{
 for(const options of [{enabled:false,calendarEnabled:true},{calendarEnabled:false}]){
  const f=setup(t,options);assert.equal(f.auth.state(f.owner).calendarAvailable,false);assert.throws(()=>f.start({calendar:true}),/non abilitata/);assert.equal(f.requests.length,0);assert.equal(f.store.one('SELECT COUNT(*) n FROM os_google_oauth_states').n,0);
 }
 const f=setup(t);assert.throws(()=>f.start({calendar:true,acknowledged:false}),/Conferma/);assert.equal(f.store.one('SELECT COUNT(*) n FROM os_google_oauth_states').n,0);assert.equal(f.requests.length,0);
 for(const calendar of [undefined,false,'true',1])assert.deepEqual(f.start({calendar}).searchParams.get('scope').split(' '),GMAIL_SCOPES);
});

test('Riavvio con flag Calendar spento: callback Calendar negato ma Gmail resta utilizzabile',async t=>{
 const f=setup(t),url=f.start({calendar:true});f.control.calendar=false;const restarted=f.build();
 await assert.rejects(restarted.finish(f.owner,{state:url.searchParams.get('state'),code:'codice-finto'}),/Calendar non abilitata/);assert.equal(f.requests.length,0);
 const gmail=f.start();const state=await f.finish(gmail);assert.equal(state.connected,true);assert.equal(state.calendarConnected,false);assert.equal(state.calendarAvailable,false);assert.deepEqual(state.scopes,GMAIL_SCOPES);assert.equal(f.auth.credentials(f.owner,state.version).refreshToken,'rinnovo-calendar-finto');
});

test('Migrazione legacy idempotente: gli stati senza scope salvati autorizzano solo Gmail',async t=>{
 const f=setup(t,{legacySchema:true});assert.ok(f.store.query('PRAGMA table_info(os_google_oauth_states)').some(row=>row.name==='requested_scopes_json'));f.build();
 const url=f.start();f.store.run('UPDATE os_google_oauth_states SET requested_scopes_json=NULL');
 const state=await f.finish(url,{calendar:true,requested_scopes_json:JSON.stringify(ALL_SCOPES),scope:ALL_SCOPES.join(' ')});
 assert.equal(state.connected,true);assert.equal(state.calendarConnected,false);assert.deepEqual(state.scopes,GMAIL_SCOPES);assert.throws(()=>f.auth.credentials(f.owner,state.version,{calendar:true}),/Calendar da autorizzare/);
});

test('Scope dello stato incoerenti non sono corretti né ampliati con i parametri del callback',async t=>{
 for(const value of ['invalid-json',JSON.stringify([]),JSON.stringify([GMAIL_SCOPES[0],GMAIL_SCOPES[0]]),JSON.stringify([...GMAIL_SCOPES,CALENDAR_SCOPES[0]]),JSON.stringify([...GMAIL_SCOPES,'https://www.googleapis.com/auth/calendar'])]){
  const f=setup(t),url=f.start({calendar:true});f.store.run('UPDATE os_google_oauth_states SET requested_scopes_json=?',value);
  await assert.rejects(f.finish(url,{calendar:true,scopes:ALL_SCOPES}),/Permessi Google della richiesta non validi/);assert.equal(f.requests.length,0);assert.equal(f.connections.runtimeMetadata('google').version,1);
 }
});

test('Cambio flag, identità, sessione, versioni o revoca durante ogni attesa impedisce il salvataggio',async t=>{
 const changes={
  flag:f=>{f.control.calendar=false;},
  role:f=>f.store.run("UPDATE os_users SET role='collaborator' WHERE id=?",f.owner.id),
  inactive:f=>f.store.run('UPDATE os_users SET active=0 WHERE id=?',f.owner.id),
  password:f=>f.store.run('UPDATE os_users SET must_change_password=1 WHERE id=?',f.owner.id),
  session:f=>f.store.run('DELETE FROM os_sessions WHERE id=?',f.owner.session_id),
  'session-changed':f=>{f.store.run('INSERT INTO os_sessions VALUES(?,?,?,?)','altra-sessione',f.owner.id,'csrf-altra-fixture',Date.now()+3600000);f.owner.session_id='altra-sessione';},
  keys:f=>f.connections.save(f.owner,'google',{version:1,fields:{clientSecret:'nuovo-segreto-finto'}}),
  'new-flow':f=>f.start(),
  revoke:f=>f.auth.invalidate(),
  expires:f=>f.advance(600001)
 };
 for(const phase of ['token','profile'])for(const [name,change] of Object.entries(changes))await t.test(phase+' / '+name,async t=>{
  const f=setup(t),url=f.start({calendar:true});let changed=false;f.control.before=where=>{if(where===phase&&!changed){changed=true;change(f);}};
  await assert.rejects(f.finish(url),/Calendar non abilitata|autorizzato|sessione|cambiati|nuovo collegamento|revocata|scaduta/);
  assert.equal(f.requests.length,phase==='token'?1:2);assert.notEqual(f.store.one('SELECT status FROM os_google_authorization').status,'connected');assert.equal(f.store.one('SELECT verifier FROM os_google_oauth_states WHERE consumed=1').verifier,'');
 });
});

test('Credenziali Calendar sospese da nuova autorizzazione, flag, chiavi, revoca o socio revocato',async t=>{
 for(const change of ['flag','new-flow','keys','revoke','owner'])await t.test(change,async t=>{
  const f=setup(t),state=await f.finish(f.start({calendar:true}));assert.equal(state.calendarConnected,true);
  if(change==='flag')f.control.calendar=false;
  if(change==='new-flow')f.start();
  if(change==='keys')f.connections.save(f.owner,'google',{version:state.version,fields:{clientSecret:'chiave-ruotata'}});
  if(change==='revoke')f.auth.invalidate();
  if(change==='owner')f.store.run('UPDATE os_users SET active=0 WHERE id=?',f.owner.id);
  assert.throws(()=>f.auth.credentials(f.owner,state.version,{calendar:true}),/Calendar da autorizzare|nuovamente|cambiati|autorizzato/);assert.equal(f.requests.length,2);
  if(change==='flag'){assert.equal(f.auth.state(f.owner).connected,true);assert.equal(f.auth.credentials(f.owner,state.version).refreshToken,'rinnovo-calendar-finto');}
 });
});
