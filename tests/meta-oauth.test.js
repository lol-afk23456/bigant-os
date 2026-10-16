import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {metaProfilesFixture} from './helpers/meta-profiles-fixture.js';
import {META_READ_SCOPES,createMetaOAuth} from '../src/meta-oauth.js';
import {createVault} from '../src/vault.js';

function fixture(t,options){
 const f=metaProfilesFixture(t,options),auth=f.app.metaAuth,control={};
 f.owner.session_id=createHash('sha256').update('meta-app-'+f.owner.id).digest('hex');
 f.hook(async(u,o)=>{
  if(control.before)await control.before(u,o);
  const json=x=>new Response(JSON.stringify(x));
  if(u.pathname==='/v26.0/oauth/access_token')return json({access_token:'oauth-token-fixture',expires_in:3600,token_type:'bearer',...control.token});
  if(u.pathname.endsWith('/debug_token'))return json({data:{app_id:'987',user_id:'789',type:'USER',is_valid:true,scopes:META_READ_SCOPES,expires_at:Math.floor(f.clock().getTime()/1000)+3600,data_access_expires_at:Math.floor(f.clock().getTime()/1000)+1800,...control.info}});
  if(u.pathname==='/v26.0/me')return json({id:'789',name:'Socio Meta inventato',...control.identity});
 });
 const state=()=>auth.state(f.owner);
 const configure=(extra={})=>auth.configure(f.owner,{version:state().version,appId:'987',appSecret:'app-secret-fixture',...extra});
 const start=(extra={})=>new URL(auth.start(f.owner,{version:state().version,channels:['facebook','instagram'],acknowledged:true,...extra}).url);
 const finish=(url,who=f.owner,extra={})=>auth.finish(who,{state:url.searchParams.get('state'),code:'code-fixture',...extra});
 return {...f,auth,control,oauthState:state,oauthConfigure:configure,start,finish,connect:async()=>{configure();return finish(start());}};
}

test('Meta OAuth: consenso guidato, scadenza minima, token cifrato e callback monouso',async t=>{
 const f=fixture(t);f.oauthConfigure();const url=f.start();assert.equal(url.origin,'https://www.facebook.com');assert.equal(url.searchParams.get('response_type'),'code');assert.equal(url.searchParams.get('redirect_uri'),'https://os.example/auth/meta/callback');assert.doesNotMatch(url.href,/app-secret|access_token|code_challenge/);
 const result=await f.finish(url);assert.equal(result.connected,true);assert.equal(result.accountName,'Socio Meta inventato');assert.equal(result.expiresAt,new Date(f.clock().getTime()+1800000).toISOString());assert.equal(f.app.connections.summary().connected,1);
 const stored=f.store.one("SELECT * FROM os_connections WHERE id='meta'");assert.equal(createVault(f.env).open(stored.sealed,'connection:meta').accessToken,'oauth-token-fixture');
 const safe=JSON.stringify([f.app.connections.state(f.owner),f.store.query('SELECT * FROM os_connections'),f.store.query('SELECT * FROM os_audit')]);for(const secret of ['app-secret-fixture','oauth-token-fixture','code-fixture',url.searchParams.get('state')])assert.ok(!safe.includes(secret));
 const count=f.calls.length;await assert.rejects(f.finish(url),/scaduta/);assert.equal(f.calls.length,count);
});

test('Meta OAuth: flag spento non scambia credenziali e consultazione non scrive',async t=>{
 const f=fixture(t,{enabled:false});f.oauthConfigure();const before=f.store.one('SELECT total_changes() n').n;
 assert.equal(f.oauthState().available,false);f.app.connections.state(f.owner);assert.equal(f.store.one('SELECT total_changes() n').n,before);assert.throws(()=>f.start(),/non abilitato/);assert.equal(f.calls.length,0);
});

test('Meta OAuth: scelta canali minima, conferma obbligatoria e nessun privilegio scrittura',async t=>{
 const f=fixture(t);f.oauthConfigure();assert.throws(()=>f.start({acknowledged:false}),/conferma/);for(const channels of [[],['facebook','facebook'],['ads']])assert.throws(()=>f.start({channels}),/canali/);
 const url=f.start({channels:['facebook']});assert.deepEqual(url.searchParams.get('scope').split(/[ ,]+/),['public_profile','pages_show_list','pages_read_engagement','read_insights']);
 f.control.info={scopes:[...META_READ_SCOPES,'pages_manage_posts']};await assert.rejects(f.finish(url));assert.equal(f.oauthState().connected,false);
});

test('Meta OAuth: identità, app, tipo, permessi e scadenze incoerenti non diventano autorizzati',async t=>{
 for(const change of [{info:{app_id:'999'}},{info:{user_id:'999'}},{info:{type:'PAGE'}},{info:{is_valid:false}},{info:{scopes:['public_profile']}},{info:{expires_at:0}},{info:{data_access_expires_at:1}},{identity:{name:''}},{token:{expires_in:-1}}]){
  const f=fixture(t);f.oauthConfigure();Object.assign(f.control,change);await assert.rejects(f.finish(f.start()));assert.equal(f.oauthState().connected,false);
 }
});

test('Meta OAuth: callback vincolato alla sessione, TTL e riavvio senza recupero del consenso',async t=>{
 const f=fixture(t);f.oauthConfigure();let url=f.start();f.store.run('INSERT INTO os_sessions VALUES(?,?,?,?)','other-session',f.owner.id,'csrf',f.clock().getTime()+3600000);
 await assert.rejects(f.finish(url,{...f.owner,session_id:'other-session'}));assert.equal(f.calls.length,0);await f.finish(url);
 url=f.start();f.advance(600001);await assert.rejects(f.finish(url));assert.equal(f.oauthState().connected,false);
 url=f.start();const second=createMetaOAuth({store:f.store,connections:f.app.connections,env:f.env,origin:'https://os.example',enabled:true,clock:f.clock,providerOptions:{fetchImpl:f.fetchImpl}});await assert.rejects(second.finish(f.owner,{state:url.searchParams.get('state'),code:'code'}));await second.close();
});

test('Meta OAuth: nuova richiesta, cambio chiavi, disconnessione o ruolo revocato fermano risposte tardive',async t=>{
 for(const action of ['start','configure','disconnect','role','session','flag']){
  const f=fixture(t);f.oauthConfigure();const url=f.start();let ran=false;
  f.control.before=async()=>{if(ran)return;ran=true;if(action==='start')f.start();if(action==='configure')f.oauthConfigure({appSecret:'changed-fixture'});if(action==='disconnect')f.auth.disconnect(f.owner,{version:f.oauthState().version});if(action==='role')f.store.run("UPDATE os_users SET role='collaborator' WHERE id=?",f.owner.id);if(action==='session')f.store.run('DELETE FROM os_sessions WHERE id=?',f.owner.session_id);if(action==='flag')f.env.BIGANT_META_PROFILES_ENABLED='false';};
  await assert.rejects(f.finish(url));assert.equal(f.auth.metadata().connected,false);assert.equal(f.calls.length,1);
 }
});

test('Meta OAuth: ogni passaggio esterno ricontrolla revoche prima di proseguire',async t=>{
 for(const step of [2,3,4]){const f=fixture(t);f.oauthConfigure();let n=0;f.control.before=async()=>{if(++n===step)f.auth.disconnect(f.owner,{version:f.oauthState().version});};await assert.rejects(f.finish(f.start()));assert.equal(n,step);assert.equal(f.oauthState().connected,false);}
});

test('Meta OAuth: scadenza e disconnessione invalidano report e vecchie prove dei profili',async t=>{
 const f=fixture(t);await f.connect();await f.configure();await f.check();f.activate();assert.ok(f.state(f.client).data);f.advance(1800001);assert.equal(f.oauthState().connected,false);assert.equal(f.state(f.client).data,null);assert.equal(f.state(f.client).enabled,false);
 await f.connect();assert.equal(f.state(f.client).enabled,false);await f.configure();await f.check();f.activate();f.auth.disconnect(f.owner,{version:f.oauthState().version});assert.equal(f.state(f.client).data,null);assert.equal(f.state(f.client).enabled,false);assert.throws(()=>f.app.connections.save(f.owner,'meta',{version:f.oauthState().version,fields:{accessToken:''}}),/Compila/);
});

test('Meta OAuth: API solo socio, CSRF, metodi corretti e callback privata in cache',async t=>{
 const f=fixture(t),path='/api/connections/meta/oauth/';
 for(const user of [null,f.client.id,f.collaborator.id])assert.ok([401,403].includes((await f.request('POST',path+'configure',{version:1,appId:'987',appSecret:'fake'},{user})).status));
 assert.equal((await f.request('POST',path+'configure',{version:1,appId:'987',appSecret:'fake'},{token:'wrong'})).status,403);
 assert.equal((await f.request('GET',path+'start')).status,405);assert.equal((await f.request('POST',path+'state',{})).status,405);
 const callback=await f.request('GET','/auth/meta/callback?code=fake&state=fake');assert.equal(callback.status,200);assert.equal(callback.headers['cache-control'],'no-store');assert.equal(callback.headers['referrer-policy'],'no-referrer');assert.doesNotMatch(callback.body,/code=fake/);
 const configured=await f.request('POST',path+'configure',{version:1,appId:'987',appSecret:'app-secret-fixture'});assert.equal(configured.status,200);
 const started=await f.request('POST',path+'start',{version:configured.body.version,channels:['facebook'],acknowledged:true});assert.equal(started.status,200);
 const finished=await f.request('POST',path+'finish',{state:new URL(started.body.url).searchParams.get('state'),code:'code-fixture'});assert.equal(finished.status,200);assert.equal(finished.body.connected,true);
});

test('Meta OAuth: token manuale distinto, rotazione chiavi esplicita e disconnessione disponibile a flag spento',async t=>{
 const f=fixture(t);assert.equal(f.oauthState().mode,'manual');await f.configure();await f.check();f.activate();f.oauthConfigure();assert.equal(f.state(f.client).data,null);
 assert.throws(()=>f.oauthConfigure({appId:'1234',appSecret:''}),/reinserisci/);await f.finish(f.start());f.env.BIGANT_META_PROFILES_ENABLED='false';f.auth.disconnect(f.owner,{version:f.oauthState().version});assert.equal(f.oauthState().connected,false);
 const v=createVault(f.env).open(f.store.one("SELECT sealed FROM os_connections WHERE id='meta'").sealed,'connection:meta');assert.equal(v.accessToken,undefined);assert.equal(v.mode,'oauth');
});

test('Meta OAuth: report scade con il consenso e vault illeggibile non ripiega sul token manuale',async t=>{
 const f=fixture(t);await f.connect();await f.configure();await f.check();f.activate();assert.equal(f.state(f.client).data.expiresAt,f.oauthState().expiresAt);
 const broken=createMetaOAuth({store:f.store,connections:f.app.connections,env:{BIGANT_SECRET_KEY:Buffer.alloc(32,25).toString('base64')},origin:'https://os.example',enabled:true,clock:f.clock});
 assert.equal(broken.metadata().readable,false);assert.equal(f.state(f.client).data,null);assert.equal(f.state(f.client).enabled,false);await broken.close();
});

test('Meta manuale: sessione revocata durante il corpo non sostituisce OAuth né modifica i controlli',async t=>{
 for(const action of ['save','check'])for(const change of ['logout','expiry','role','password']){
  const f=fixture(t);await f.connect();const before=f.store.one("SELECT * FROM os_connections WHERE id='meta'");
  const result=await f.request('POST','/api/connections/meta'+(action==='check'?'/check':''),{version:before.version,fields:{accessToken:'replacement-fixture'}},{beforeBody:()=>{
   if(change==='logout')f.store.run('DELETE FROM os_sessions WHERE id=?',f.owner.session_id);
   if(change==='expiry')f.store.run('UPDATE os_sessions SET expires_at=? WHERE id=?',Date.now()-1,f.owner.session_id);
   if(change==='role')f.store.run("UPDATE os_users SET role='collaborator' WHERE id=?",f.owner.id);
   if(change==='password')f.store.run('UPDATE os_users SET must_change_password=1 WHERE id=?',f.owner.id);
  }});assert.equal(result.status,403);assert.deepEqual(f.store.one("SELECT * FROM os_connections WHERE id='meta'"),before);
 }
});
