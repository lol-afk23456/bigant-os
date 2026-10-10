import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {openStore,seedCore} from '../src/store.js';
import {createConnections} from '../src/connections.js';
import {createBusinessProfileOAuth,BUSINESS_PROFILE_SCOPES} from '../src/business-profile-oauth.js';
import {createVault} from '../src/vault.js';

function fixture(t,{enabled=true,origin='https://os.example',configure=true}={}){
 const store=openStore();seedCore(store);t.after(()=>store.close());
 t.mock.method(globalThis,'fetch',()=>{throw Error('Rete reale vietata dal test');});
 const env={BIGANT_SECRET_KEY:Buffer.alloc(32,19).toString('base64')},connections=createConnections({store,env}),control={enabled},requests=[];
 let milliseconds=Date.parse('2026-10-10T12:00:00Z');const clock=()=>new Date(milliseconds);
 const owner={...store.one("SELECT * FROM os_users WHERE id='demo-owner'"),session_id:'gbp-session-fixture'};
 store.run('INSERT INTO os_sessions VALUES(?,?,?,?)',owner.session_id,owner.id,'gbp-csrf-fixture',milliseconds+3600000);
 if(configure)connections.save(owner,'gbp',{version:0,fields:{clientId:'client-gbp-inventato',clientSecret:'secret-gbp-inventato'}});
 const fetchImpl=async(url,options)=>{
  requests.push({url:String(url),options});if(control.before)await control.before(String(url),options);
  if(control.response)return control.response(String(url),options);
  const token={access_token:'access-gbp-inventato',refresh_token:'refresh-gbp-inventato',expires_in:3600,token_type:'Bearer',scope:BUSINESS_PROFILE_SCOPES.join(' '),...control.tokens};
  const profile={email:'socio@fixture.example',email_verified:true,sub:'1234567890',...control.identity};
  return new Response(JSON.stringify(String(url).endsWith('/token')?token:profile));
 };
 const auth=createBusinessProfileOAuth({store,connections,env,origin,enabled:()=>control.enabled,clock,providerOptions:{fetchImpl}});
 const start=(extra={})=>new URL(auth.start(owner,{version:connections.runtimeMetadata('gbp').version,email:'socio@fixture.example',acknowledged:true,...extra}).url);
 const finish=(url,who=owner,extra={})=>auth.finish(who,{state:url.searchParams.get('state'),code:'code-gbp-inventato',...extra});
 return {store,owner,env,connections,auth,control,requests,start,finish,advance:ms=>milliseconds+=ms,connect:async()=>finish(start())};
}
const authRow=f=>f.store.one('SELECT * FROM os_gbp_authorization WHERE id=1');
const changes=f=>f.store.one('SELECT total_changes() n').n;

test('GBP disabilitato per default: metadata disponibile in DEMO, nessuna rete o scrittura alla consultazione',t=>{
 const f=fixture(t,{enabled:false,origin:'http://127.0.0.1:4330',configure:false}),before=changes(f);
 assert.deepEqual(f.auth.state(f.owner),{available:false,configured:false,connected:false,version:0,connectionVersion:0,email:null,lastCheck:null,authorizedBy:null});
 const row=f.connections.state(f.owner).items.find(item=>item.id==='gbp');assert.equal(row.dependsOn,null);assert.deepEqual(row.fields.map(field=>field.id),['clientId','clientSecret']);assert.equal(row.authorization.available,false);
 assert.equal(changes(f),before);assert.throws(()=>f.start({version:1}),/non abilitato/);assert.equal(f.requests.length,0);
 const other=createBusinessProfileOAuth({store:f.store,connections:f.connections,env:f.env,origin:'http://127.0.0.1:4330'});assert.equal(other.metadata().available,false);
});

test('GBP separato: chiavi proprie, PKCE, identità userinfo e stato monouso, nessun permesso Gmail/Calendar',async t=>{
 const f=fixture(t),url=f.start(),pending=f.store.one('SELECT * FROM os_gbp_oauth_states');
 assert.equal(url.origin,'https://accounts.google.com');assert.equal(url.searchParams.get('redirect_uri'),'https://os.example/auth/google-business/callback');
 assert.deepEqual(url.searchParams.get('scope').split(' '),BUSINESS_PROFILE_SCOPES);assert.doesNotMatch(url.searchParams.get('scope'),/gmail|calendar/);assert.equal(url.searchParams.get('include_granted_scopes'),'false');assert.equal(url.searchParams.get('access_type'),'offline');assert.equal(url.searchParams.get('code_challenge_method'),'S256');
 assert.notEqual(pending.hash,url.searchParams.get('state'));assert.doesNotMatch(pending.verifier,/verifier/);
 const result=await f.finish(url);assert.equal(result.connected,true);assert.equal(result.version,1);assert.equal(result.connectionVersion,1);assert.equal(result.authorizedBy,f.owner.id);assert.equal(f.connections.summary().connected,1);
 assert.deepEqual(f.requests.map(r=>r.url),['https://oauth2.googleapis.com/token','https://openidconnect.googleapis.com/v1/userinfo']);
 const sent=f.requests[0].options;assert.equal(sent.method,'POST');assert.equal(sent.redirect,'error');assert.equal(sent.body.get('client_id'),'client-gbp-inventato');assert.equal(sent.body.get('redirect_uri'),url.searchParams.get('redirect_uri'));
 assert.equal(createHash('sha256').update(sent.body.get('code_verifier')).digest('base64url'),url.searchParams.get('code_challenge'));
 assert.equal(f.requests[1].options.method,'GET');assert.equal(f.requests[1].options.headers.Authorization,'Bearer access-gbp-inventato');
 assert.equal(f.store.one('SELECT verifier FROM os_gbp_oauth_states').verifier,'');
 const safe=JSON.stringify([f.auth.state(f.owner),f.connections.state(f.owner),authRow(f),f.store.query('SELECT * FROM os_audit'),f.store.query('SELECT * FROM os_connections')]);
 for(const secret of ['refresh-gbp-inventato','access-gbp-inventato','code-gbp-inventato','secret-gbp-inventato',sent.body.get('code_verifier')])assert.ok(!safe.includes(secret));
 assert.equal(createVault(f.env).open(authRow(f).sealed,'gbp-authorization:1').refreshToken,'refresh-gbp-inventato');
 await assert.rejects(f.finish(url),/già utilizzata/);assert.equal(f.requests.length,2);
 const before=changes(f);f.auth.metadata();f.auth.state(f.owner);f.connections.state(f.owner);assert.equal(changes(f),before);
});

test('GBP: Gmail configurato non sostituisce chiavi o consenso GBP; chiavi indipendenti',async t=>{
 const f=fixture(t,{configure:false});f.connections.save(f.owner,'google',{version:0,fields:{clientId:'google-separato',clientSecret:'segreto-google'}});
 assert.equal(f.auth.state(f.owner).configured,false);assert.throws(()=>f.start({version:1}),/da configurare/);assert.equal(f.requests.length,0);
 f.connections.save(f.owner,'gbp',{version:0,fields:{clientId:'gbp-separato',clientSecret:'segreto-gbp'}});await f.connect();
 f.connections.save(f.owner,'google',{version:1,fields:{clientSecret:'google-ruotato'}});assert.equal(f.auth.state(f.owner).connected,true);assert.equal(f.auth.state(f.owner).connectionVersion,1);
 f.connections.save(f.owner,'gbp',{version:1,fields:{clientSecret:'gbp-ruotato'}});assert.equal(f.auth.metadata().connected,false);assert.equal(f.auth.metadata().connectionVersion,2);
 await assert.rejects(f.auth.accessToken(f.owner,1),/cambiati/);assert.equal(f.requests.length,2);
});

test('GBP: sessione, stato, scadenza e diniego fermano il callback prima della rete',async t=>{
 const f=fixture(t),url=f.start();f.store.run('INSERT INTO os_sessions VALUES(?,?,?,?)','seconda-sessione',f.owner.id,'csrf2',Date.parse('2026-10-11T12:00:00Z'));
 await assert.rejects(f.finish(url,{...f.owner,session_id:'seconda-sessione'}),/scaduta/);await assert.rejects(f.finish(url,f.owner,{state:'invalid'}),/non valida/);
 await assert.rejects(f.finish(url,f.owner,{error:'errore-fornitore-con-segreto'}),e=>!e.message.includes('segreto')&&e.status===409);await assert.rejects(f.finish(url),/già utilizzata/);
 const expired=f.start();f.advance(600000);await assert.rejects(f.finish(expired),/scaduta/);assert.equal(f.requests.length,0);
 const active=f.start();f.store.run('DELETE FROM os_sessions');await assert.rejects(f.finish(active),/sessione/);assert.equal(f.requests.length,0);
});

test('GBP: attori umani correnti, password provvisoria e forme richiesta obbligatori',async t=>{
 const f=fixture(t);for(const id of ['demo-client','demo-collaborator','os-orchestrator']){const user=f.store.one('SELECT * FROM os_users WHERE id=?',id);assert.throws(()=>f.auth.state(user));assert.throws(()=>f.auth.start(user,{version:1,email:'socio@fixture.example',acknowledged:true}));await assert.rejects(f.auth.accessToken(user,1));assert.throws(()=>f.connections.save(user,'gbp',{version:1,fields:{clientSecret:'nuovo'}}));}
 for(const b of [null,[],{version:1,email:'socio@fixture.example',acknowledged:true,calendar:true}])assert.throws(()=>f.auth.start(f.owner,b),/non valida/);
 assert.throws(()=>f.start({acknowledged:false}),/Conferma/);assert.throws(()=>f.start({email:'non-email'}),/email/);assert.throws(()=>f.auth.disconnect(f.owner,null),/non valida/);
 f.store.run('UPDATE os_users SET must_change_password=1 WHERE id=?',f.owner.id);assert.throws(f.start,/Socio/);assert.throws(()=>f.connections.save(f.owner,'gbp',{version:1,fields:{clientSecret:'nuovo'}}),/Socio/);
 f.store.run("UPDATE os_users SET must_change_password=0,role='client' WHERE id=?",f.owner.id);assert.throws(f.start,/Socio/);assert.equal(f.requests.length,0);
});

test('GBP: ambiti incompleti, token invalidi e identità diversa o non verificata non vengono accettati',async t=>{
 const cases=[{tokens:{scope:'openid https://www.googleapis.com/auth/userinfo.email'}},{tokens:{refresh_token:''}},{tokens:{access_token:'token\r\nsegreto'}},{tokens:{token_type:'Other'}},{tokens:{token_type:123}},{tokens:{expires_in:0}},{tokens:{expires_in:86401}},{identity:{email:'altro@fixture.example'}},{identity:{email_verified:false}},{identity:{email_verified:'true'}},{identity:{sub:''}}];
 for(const change of cases){const f=fixture(t);Object.assign(f.control,change);await assert.rejects(f.connect());assert.equal(f.auth.metadata().connected,false);assert.equal(authRow(f).sealed,null);assert.equal(f.store.one('SELECT verifier FROM os_gbp_oauth_states').verifier,'');}
 const f=fixture(t);f.control.tokens={scope:'openid email https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/gmail.send'};assert.equal((await f.connect()).connected,true);assert.ok(!JSON.stringify(authRow(f)).includes('gmail'));
});

test('GBP: chiavi, ruolo, sessione, flag, stato o scadenza cambiati durante ogni attesa bloccano i token',async t=>{
 for(const stage of ['/token','/userinfo'])for(const change of ['keys','role','inactive','password','session','flag','new-flow','disconnect','expire']){
  const f=fixture(t),url=f.start();let once=false;
  f.control.before=(request)=>{if(once||!request.endsWith(stage))return;once=true;
   if(change==='keys')f.connections.save(f.owner,'gbp',{version:1,fields:{clientSecret:'chiave-nuova'}});
   if(change==='role')f.store.run("UPDATE os_users SET role='collaborator' WHERE id=?",f.owner.id);
   if(change==='inactive')f.store.run('UPDATE os_users SET active=0 WHERE id=?',f.owner.id);
   if(change==='password')f.store.run('UPDATE os_users SET must_change_password=1 WHERE id=?',f.owner.id);
   if(change==='session')f.store.run('DELETE FROM os_sessions');if(change==='flag')f.control.enabled=false;
   if(change==='new-flow')f.start();if(change==='disconnect')f.auth.disconnect(f.owner,{version:f.auth.metadata().version});if(change==='expire')f.advance(600001);
  };
  await assert.rejects(f.finish(url),undefined,stage+':'+change);assert.equal(f.auth.metadata().connected,false);assert.equal(authRow(f).sealed,null);assert.equal(f.requests.length,stage==='/token'?1:2);
 }
});

test('GBP: rinnovo interno rilegge autorizzazione e chiavi, gestisce rotazione e non espone token',async t=>{
 const f=fixture(t);await f.connect();f.control.tokens={access_token:'accesso-rinnovato',refresh_token:'rinnovo-ruotato'};
 assert.equal(await f.auth.accessToken(f.owner,1),'accesso-rinnovato');const request=f.requests.at(-1);assert.equal(request.url,'https://oauth2.googleapis.com/token');assert.equal(request.options.body.get('grant_type'),'refresh_token');assert.equal(request.options.body.get('refresh_token'),'refresh-gbp-inventato');
 assert.equal(createVault(f.env).open(authRow(f).sealed,'gbp-authorization:1').refreshToken,'rinnovo-ruotato');
 f.control.tokens={refresh_token:undefined,scope:undefined};await f.auth.accessToken(f.owner,1);assert.equal(createVault(f.env).open(authRow(f).sealed,'gbp-authorization:1').refreshToken,'rinnovo-ruotato');
 const count=f.requests.length;await assert.rejects(f.auth.accessToken(f.owner,0),/cambiata/);assert.equal(f.requests.length,count);
 const safe=JSON.stringify([f.auth.metadata(),f.connections.state(f.owner),f.store.query('SELECT * FROM os_audit')]);assert.doesNotMatch(safe,/accesso-rinnovato|rinnovo-ruotato/);
});

test('GBP: rinnovi concorrenti condividono una richiesta e ricontrollano il richiedente',async t=>{
 const f=fixture(t);await f.connect();let release;f.control.before=()=>new Promise(resolve=>{release=resolve;});
 const first=f.auth.accessToken(f.owner,1),second=f.auth.accessToken(f.owner,1);assert.equal(f.requests.length,3);release();assert.deepEqual(await Promise.all([first,second]),['access-gbp-inventato','access-gbp-inventato']);assert.equal(f.requests.length,3);
});

test('GBP: callback concorrenti consumano lo stato una sola volta',async t=>{
 const f=fixture(t),url=f.start();let release;f.control.before=request=>request.endsWith('/token')?new Promise(resolve=>{release=resolve;}):undefined;
 const first=f.finish(url);await assert.rejects(f.finish(url),/già utilizzata/);assert.equal(f.requests.length,1);release();assert.equal((await first).connected,true);assert.equal(f.requests.length,2);
});

test('GBP: revoca locale, chiavi, flag e autorizzazione cambiati durante rinnovo impediscono restituzione bearer',async t=>{
 for(const change of ['keys','inactive','role','password','flag','new-flow','disconnect']){
  const f=fixture(t);await f.connect();f.control.before=()=>{
   if(change==='keys')f.connections.save(f.owner,'gbp',{version:1,fields:{clientSecret:'nuova'}});
   if(change==='inactive')f.store.run('UPDATE os_users SET active=0 WHERE id=?',f.owner.id);
   if(change==='role')f.store.run("UPDATE os_users SET role='client' WHERE id=?",f.owner.id);
   if(change==='password')f.store.run('UPDATE os_users SET must_change_password=1 WHERE id=?',f.owner.id);
   if(change==='flag')f.control.enabled=false;if(change==='new-flow')f.start();if(change==='disconnect')f.auth.disconnect(f.owner,{version:1});
  };
  await assert.rejects(f.auth.accessToken(f.owner,1));assert.equal(f.auth.metadata().connected,false);assert.equal(f.requests.length,3);
 }
});

test('GBP: revoca Google invalid_grant elimina token e cambia revisione; messaggio remoto mai esposto',async t=>{
 const f=fixture(t);await f.connect();f.control.response=()=>new Response(JSON.stringify({error:'invalid_grant',error_description:'testo-segreto-remoto'}),{status:400});
 await assert.rejects(f.auth.accessToken(f.owner,1),e=>!e.message.includes('testo-segreto-remoto'));assert.equal(f.auth.metadata().connected,false);assert.equal(f.auth.metadata().version,2);assert.equal(authRow(f).sealed,null);
 const before=f.requests.length;await assert.rejects(f.auth.accessToken(f.owner,1));assert.equal(f.requests.length,before);assert.doesNotMatch(JSON.stringify(f.store.query('SELECT * FROM os_audit')),/testo-segreto-remoto/);
});

test('GBP: errori di trasporto e risposte eccessive non espongono corpo, codice o credenziali',async t=>{
 for(const response of [()=>{throw Error('secret-gbp-inventato');},()=>new Response('risposta-con-segreto',{status:502}),()=>new Response(JSON.stringify({error:'altro',detail:'secret-gbp-inventato'}),{status:400}),()=>new Response(JSON.stringify({value:'x'.repeat(65537)})),()=>new Response('[]')]){
  const f=fixture(t);f.control.response=response;await assert.rejects(f.connect(),e=>e.status===502&&!/segreto|secret-gbp|code-gbp/.test(e.message));assert.equal(f.auth.metadata().connected,false);assert.equal(authRow(f).sealed,null);
 }
});

test('GBP: disconnessione locale disponibile con flag spento, senza revoca remota o vecchio consenso riutilizzabile',async t=>{
 const f=fixture(t);await f.connect();f.control.enabled=false;const result=f.auth.disconnect(f.owner,{version:1});assert.equal(result.available,false);assert.equal(result.connected,false);assert.equal(result.version,2);assert.equal(result.email,null);assert.equal(authRow(f).sealed,null);assert.equal(f.requests.length,2);
 assert.throws(()=>f.auth.disconnect(f.owner,{version:1}),/cambiata/);f.control.enabled=true;await assert.rejects(f.auth.accessToken(f.owner,1));assert.equal(f.requests.length,2);
 const next=await f.connect();assert.equal(next.version,3);assert.equal(next.connectionVersion,1);
});

test('GBP: assenza vault o origine non HTTPS impediscono l’avvio prima della rete',t=>{
 for(const origin of ['http://os.example','https://user:pass@os.example','https://os.example/path','non-url']){const f=fixture(t,{origin});assert.throws(f.start,/Origine/);assert.equal(f.requests.length,0);}
 const f=fixture(t),auth=createBusinessProfileOAuth({store:f.store,connections:f.connections,env:{},origin:'https://os.example',enabled:true});assert.throws(()=>auth.start(f.owner,{version:1,email:'socio@fixture.example',acknowledged:true}),/Archivio/);assert.equal(f.requests.length,0);
});
