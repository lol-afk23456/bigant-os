import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {openStore,seedCore} from '../src/store.js';
import {createConnections} from '../src/connections.js';
import {createGoogleOAuth,GMAIL_SCOPES} from '../src/google-oauth.js';
function setup(t,{enabled=true}={}){
 const store=openStore();seedCore(store);t.after(()=>store.close());const owner={...store.one("SELECT * FROM os_users WHERE id='demo-owner'"),session_id:'sessione-di-prova'},env={BIGANT_SECRET_KEY:Buffer.alloc(32,6).toString('base64')},connections=createConnections({store,env}),requests=[],control={};
 let offset=0;const clock=()=>new Date(Date.now()+offset);store.run('INSERT INTO os_sessions VALUES(?,?,?,?)',owner.session_id,owner.id,'csrf-fixture',Date.now()+3600000);
 connections.save(owner,'google',{version:0,fields:{clientId:'id-google-inventato',clientSecret:'segreto-inventato'}});
 const fetchImpl=async(url,options)=>{requests.push({url:String(url),options});if(control.before)await control.before(url,options);const value=String(url).endsWith('/token')?{access_token:'accesso-finto',refresh_token:'rinnovo-finto',token_type:'Bearer',scope:(control.scopes||GMAIL_SCOPES).join(' ')}:{emailAddress:control.email||'mittente@fixture.example'};return new Response(JSON.stringify(value));};
 const auth=createGoogleOAuth({store,connections,env,origin:'https://os.example',enabled,clock,providerOptions:{fetchImpl}});
 const start=()=>{const result=auth.start(owner,{version:connections.runtimeMetadata('google').version,email:'mittente@fixture.example',acknowledged:true});return new URL(result.url);};
 const finish=(url,who=owner,extra={})=>auth.finish(who,{state:url.searchParams.get('state'),code:'codice-finto',...extra});
 return {store,owner,auth,connections,requests,control,start,finish,advance:ms=>offset+=ms};
}
test('OAuth chiuso: nessuna rete, credenziali sufficienti non autorizzano la casella',t=>{
 const f=setup(t,{enabled:false});assert.equal(f.auth.state(f.owner).connected,false);assert.throws(f.start,/non abilitata/);assert.equal(f.requests.length,0);assert.equal(f.connections.state(f.owner).items.find(r=>r.id==='google').fields.length,2);
});
test('OAuth monouso con PKCE, casella verificata e refresh token cifrato',async t=>{
 const f=setup(t),url=f.start();assert.equal(url.origin,'https://accounts.google.com');assert.equal(url.searchParams.get('redirect_uri'),'https://os.example/auth/google/callback');assert.deepEqual(url.searchParams.get('scope').split(' '),GMAIL_SCOPES);
 const before=f.store.one('SELECT * FROM os_google_oauth_states');assert.ok(!before.verifier.includes('verifier'));assert.notEqual(before.hash,url.searchParams.get('state'));const result=await f.finish(url);assert.equal(result.connected,true);assert.equal(result.email,'mittente@fixture.example');assert.equal(f.connections.summary().connected,1);
 const verifier=f.requests[0].options.body.get('code_verifier');assert.equal(createHash('sha256').update(verifier).digest('base64url'),url.searchParams.get('code_challenge'));assert.equal(f.store.one('SELECT verifier FROM os_google_oauth_states').verifier,'');
 const serialized=JSON.stringify(f.connections.state(f.owner))+JSON.stringify(f.auth.state(f.owner))+JSON.stringify(f.store.query('SELECT * FROM os_audit'))+JSON.stringify(f.store.query('SELECT * FROM os_connections'));assert.ok(!serialized.includes('rinnovo-finto'));assert.ok(!serialized.includes('accesso-finto'));assert.ok(!serialized.includes('codice-finto'));
 assert.equal(f.auth.credentials(f.owner,result.version).refreshToken,'rinnovo-finto');await assert.rejects(f.finish(url),/già utilizzata/);assert.equal(f.requests.length,2);
});
test('sessione diversa, scadenza e rifiuto bloccano il ritorno prima della rete',async t=>{
 const f=setup(t),url=f.start();f.store.run('INSERT INTO os_sessions VALUES(?,?,?,?)','altra-sessione',f.owner.id,'csrf-2',Date.now()+3600000);
 await assert.rejects(f.finish(url,{...f.owner,session_id:'altra-sessione'}),/scaduta/);assert.equal(f.requests.length,0);
 await assert.rejects(f.finish(url,f.owner,{error:'access_denied'}),/non concessa/);await assert.rejects(f.finish(url),/già utilizzata/);
 const next=f.start();f.advance(601000);await assert.rejects(f.finish(next),/scaduta/);assert.equal(f.requests.length,0);
});
test('permessi parziali e casella diversa non sostituiscono gli accessi',async t=>{
 const f=setup(t);f.control.scopes=[GMAIL_SCOPES[0]];await assert.rejects(f.finish(f.start()),/tutti i permessi/);assert.equal(f.connections.runtimeMetadata('google').version,1);
 f.control.scopes=GMAIL_SCOPES;f.control.email='altra@fixture.example';await assert.rejects(f.finish(f.start()),/diversa/);assert.equal(f.auth.state(f.owner).connected,false);assert.equal(f.connections.runtimeMetadata('google').version,1);
});
test('chiavi o ruolo cambiati durante OAuth impediscono di salvare i token',async t=>{
 for(const change of ['keys','role','new-flow']){
  const f=setup(t),url=f.start();let once=false;
  f.control.before=()=>{if(once)return;once=true;if(change==='keys')f.connections.save(f.owner,'google',{version:1,fields:{clientSecret:'nuovo-segreto-finto'}});if(change==='role')f.store.run("UPDATE os_users SET role='collaborator' WHERE id=?",f.owner.id);if(change==='new-flow')f.start();};
  await assert.rejects(f.finish(url),/cambiati|autorizzato|nuovo collegamento/);assert.equal(f.store.one('SELECT status FROM os_google_authorization').status,'pending');assert.equal(f.requests.length,1);
 }
});
test('nuova autorizzazione, rotazione accessi e revoca del socio sospendono il collegamento',async t=>{
 const f=setup(t);await f.finish(f.start());assert.equal(f.auth.state(f.owner).connected,true);f.start();assert.equal(f.auth.state(f.owner).connected,false);await f.finish(f.start());
 f.connections.save(f.owner,'google',{version:3,fields:{clientSecret:'segreto-ruotato'}});assert.equal(f.auth.state(f.owner).connected,false);assert.equal(f.auth.state(f.owner).version,4);
});
