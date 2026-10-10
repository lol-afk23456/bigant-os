import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore,seedCore} from '../src/store.js';
import {createProduction} from '../src/production.js';
import {createApp} from '../server.js';

const future=()=>new Date(Date.now()+86400000).toISOString();
const status=code=>error=>error.status===code;
function fixture(t,{store=null,production=null}={}) {
 const s=store||openStore();if(!store){seedCore(s);t.after(()=>s.close());}
 const p=production||createProduction({store:s}),user=id=>s.one('SELECT * FROM os_users WHERE id=?',id);
 const owner=user('demo-owner'),collaborator=user('demo-collaborator'),robot=user('os-orchestrator');
 let network=0;t.mock.method(globalThis,'fetch',()=>{network++;throw Error('Rete vietata nel collaudo produzione');});t.after(()=>assert.equal(network,0));
 const call=async(method,path,body={},actor=owner,clientId='demo-bottega')=>(await p.handle({method,path,body,user:actor,clientId})).data;
 async function ready({service='social',actor=owner}={}) {
  let c=await call('POST','/contents',{service,title:'Contenuto di prova DEMO',body:'Testo inventato per verificare le approvazioni.',source:'Fixture automatica DEMO'},actor);
  c=await call('PATCH','/contents/'+c.id,{version:c.version,state:'IN PRODUZIONE'},actor);
  c=await call('PATCH','/contents/'+c.id,{version:c.version,state:'DA APPROVARE'},actor);
  return {content:c,approval:s.one("SELECT * FROM os_approvals WHERE kind='content' AND entity_id=? AND version=?",c.id,c.version)};
 }
 const decide=(a,actor=owner,decision='approved')=>call('POST','/approvals/'+a.id,{decision,...(decision==='approved'?{}:{reason:'Cambiare il testo DEMO.'})},actor);
 const schedule=(c,actor=owner)=>call('PATCH','/contents/'+c.id,{version:c.version,state:'PROGRAMMATO',scheduled_at:future()},actor);
 const publish=(c,actor=owner)=>call('PATCH','/contents/'+c.id,{version:c.version,state:'PUBBLICATO'},actor);
 return {s,p,user,owner,collaborator,robot,call,ready,decide,schedule,publish};
}

test('FUN-062: socio e collaboratore assegnato approvano la versione social; solo calendario locale',async t=>{
 const f=fixture(t);
 for(const actor of [f.owner,f.collaborator]) {
  const {content:c,approval:a}=await f.ready();await f.decide(a,actor);
  const approved=f.s.one('SELECT * FROM os_approvals WHERE id=?',a.id);
  assert.equal(approved.decision_by,actor.id);assert.ok(Number.isFinite(Date.parse(approved.decision_at)));
  assert.equal(approved.body,c.body);assert.equal(approved.title,c.title);
  const scheduled=await f.schedule(c);assert.equal(scheduled.state,'PROGRAMMATO');assert.ok(scheduled.scheduled_at);
  await assert.rejects(f.publish(c),status(409));
  assert.equal(f.s.one('SELECT state FROM os_contents WHERE id=?',c.id).state,'PROGRAMMATO');
 }
 assert.equal((await f.call('GET','/state')).externalPublished,false);
});

test('FUN-062: assenza di approvazione, identità tecnica e cliente non autorizzano contenuti',async t=>{
 const f=fixture(t),{content:c,approval:a}=await f.ready({actor:f.robot});
 await assert.rejects(f.schedule(c),status(409));await assert.rejects(f.publish(c),status(409));
 for(const actor of [f.robot,f.user('demo-client')])await assert.rejects(f.decide(a,actor),status(403));
 assert.equal(f.s.one('SELECT status FROM os_approvals WHERE id=?',a.id).status,'pending');
 assert.equal(f.s.one('SELECT state FROM os_contents WHERE id=?',c.id).state,'DA APPROVARE');
 const local=await f.ready({service:'local'});await assert.rejects(f.decide(local.approval,f.collaborator),status(403));
 await f.decide(local.approval);assert.equal((await f.schedule(local.content)).state,'PROGRAMMATO');
});

test('FUN-062: revisione del testo annulla approvazione e data; la vecchia versione resta inutilizzabile',async t=>{
 const f=fixture(t),{content:c,approval:a}=await f.ready();await f.decide(a);await f.schedule(c);
 const next=await f.call('PATCH','/contents/'+c.id,{version:c.version,body:'Seconda versione inventata DEMO.'});
 assert.equal(next.version,c.version+1);assert.equal(next.scheduled_at,null);assert.equal(next.state,'IN PRODUZIONE');
 assert.equal(f.s.one('SELECT status FROM os_approvals WHERE id=?',a.id).status,'obsolete');
 await assert.rejects(f.schedule(c),status(409));await assert.rejects(f.decide(a),status(409));await assert.rejects(f.publish(next),status(409));
 await f.call('PATCH','/contents/'+c.id,{version:next.version,state:'DA APPROVARE'});
 const a2=f.s.one("SELECT * FROM os_approvals WHERE kind='content' AND entity_id=? AND version=?",c.id,next.version);
 await assert.rejects(f.schedule(next),status(409));await f.decide(a2,f.collaborator);
 assert.equal((await f.schedule(next)).state,'PROGRAMMATO');
});

test('FUN-062: rimozione del servizio ferma sia decisione sia programmazione successiva',async t=>{
 const f=fixture(t),pending=await f.ready(),approved=await f.ready();await f.decide(approved.approval);
 f.s.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bottega'");
 await assert.rejects(f.decide(pending.approval),status(403));await assert.rejects(f.schedule(approved.content),status(403));
 await assert.rejects(f.publish(approved.content),status(403));
 assert.equal(f.s.one('SELECT state FROM os_contents WHERE id=?',approved.content.id).state,'APPROVATO');
});

test('FUN-062: una decisione non usa testo, titolo o versione diversi dalla richiesta mostrata',async t=>{
 const f=fixture(t);
 for(const [field,value] of [['body','Altro testo DEMO'],['title','Altro titolo DEMO'],['version',12],['entity_id','missing-content'],['kind','agent_output']]) {
  const {content:c,approval:a}=await f.ready();
  f.s.run(`UPDATE os_approvals SET ${field}=? WHERE id=?`,value,a.id);
  await assert.rejects(f.decide(a),status(409),field);
  assert.equal(f.s.one('SELECT state FROM os_contents WHERE id=?',c.id).state,'DA APPROVARE');
  assert.equal(f.s.one('SELECT status FROM os_approvals WHERE id=?',a.id).status,'pending');
 }
 const cross=await f.ready();f.s.run("UPDATE os_approvals SET client_id='demo-studio' WHERE id=?",cross.approval.id);
 await assert.rejects(f.decide(cross.approval),status(404));
});

test('FUN-062: la programmazione richiede la prova completa, non il solo stato approved',async t=>{
 const f=fixture(t);
 for(const [field,value] of [['kind','agent_output'],['client_id','demo-studio'],['entity_id','different-content'],['version',8],['title','Titolo alterato'],['body','Testo alterato'],['decision_by',null],['decision_by','missing-user'],['decision_by','os-orchestrator'],['decision_by','demo-client'],['decision_at',null],['decision_at','non-una-data']]) {
  const {content:c,approval:a}=await f.ready();await f.decide(a);
  f.s.run(`UPDATE os_approvals SET ${field}=? WHERE id=?`,value,a.id);
  await assert.rejects(f.schedule(c),status(409),field+': '+value);await assert.rejects(f.publish(c),status(409));
  assert.equal(f.s.one('SELECT state FROM os_contents WHERE id=?',c.id).state,'APPROVATO');
 }
});

test('FUN-062: un testo cambiato fuori dal normale percorso di revisione non conserva una prova valida',async t=>{
 const f=fixture(t),{content:c,approval:a}=await f.ready();await f.decide(a);
 f.s.run('UPDATE os_contents SET body=? WHERE id=?','Contenuto attuale diverso dalla versione approvata.',c.id);
 await assert.rejects(f.schedule(c),status(409));await assert.rejects(f.publish(c),status(409));
});

test('FUN-062: approvatore disattivato, trasferito o senza ruolo valido non autorizza la programmazione',async t=>{
 for(const change of ['disabled','unassigned','client-role','owner-demoted'])await t.test(change,async t=>{
  const f=fixture(t),{content:c,approval:a}=await f.ready();await f.decide(a,change==='owner-demoted'?f.owner:f.collaborator);
  if(change==='disabled')f.s.run("UPDATE os_users SET active=0 WHERE id='demo-collaborator'");
  if(change==='unassigned'){f.s.run("DELETE FROM os_assignments WHERE user_id='demo-collaborator'");f.s.run("INSERT INTO os_assignments VALUES('demo-collaborator','demo-studio')");}
  if(change==='client-role')f.s.run("UPDATE os_users SET role='client',tenant_id='demo-bottega' WHERE id='demo-collaborator'");
  if(change==='owner-demoted')f.s.run("UPDATE os_users SET role='client',tenant_id='demo-studio' WHERE id='demo-owner'");
  const caller=change==='owner-demoted'?f.collaborator:f.owner;
  await assert.rejects(f.schedule(c,caller),status(409));await assert.rejects(f.publish(c,caller),status(409));
 });
});

test('FUN-062: gli oggetti utente obsoleti non aggirano revoche intervenute nel database',async t=>{
 for(const change of ['disabled','demoted','unassigned','deleted'])await t.test(change,async t=>{
  const f=fixture(t),pending=await f.ready(),approved=await f.ready();await f.decide(approved.approval);
  const actor=change==='unassigned'?f.collaborator:f.owner;
  if(change==='disabled')f.s.run("UPDATE os_users SET active=0 WHERE id='demo-owner'");
  if(change==='demoted')f.s.run("UPDATE os_users SET role='client',tenant_id='demo-bottega' WHERE id='demo-owner'");
  if(change==='unassigned')f.s.run("DELETE FROM os_assignments WHERE user_id='demo-collaborator'");
  if(change==='deleted')f.s.run("DELETE FROM os_users WHERE id='demo-owner'");
  await assert.rejects(f.decide(pending.approval,actor),status(403));await assert.rejects(f.schedule(approved.content,actor),status(403));
  assert.equal(f.s.one('SELECT status FROM os_approvals WHERE id=?',pending.approval.id).status,'pending');
 });
});

async function httpFixture(t) {
 const app=createApp({env:{}});t.after(()=>app.close());const f=fixture(t,{store:app.store,production:app.production});
 const handler=app.server.listeners('request')[0],origin='http://127.0.0.1:4330';
 async function request(method,path,body,{session=null,csrf=true,beforeBody=null}={}) {
  const headers={host:'127.0.0.1:4330',origin,'content-type':'application/json',...(session?{cookie:session.cookie,...(csrf?{'x-csrf-token':session.csrf}:{})}:{})};
  const req={method,url:path,headers,socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){beforeBody?.();if(body!==undefined)yield Buffer.from(JSON.stringify(body));}};
  const res={headersSent:false,statusCode:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},writeHead(code,h){this.statusCode=code;this.headersSent=true;for(const[k,v]of Object.entries(h||{}))this.setHeader(k,v);},end(chunk){this.body=chunk?JSON.parse(String(chunk)):null;}};
  await handler(req,res);return res;
 }
 async function login(profile){const r=await request('POST','/api/demo/login',{profile});assert.equal(r.statusCode,200);return {cookie:r.headers['set-cookie'].split(';')[0],csrf:r.body.csrf};}
 return {...f,request,login};
}

test('FUN-062 HTTP: entrambi gli accessi alle approvazioni proteggono sessione, CSRF, ruolo e isolamento',async t=>{
 const f=await httpFixture(t),{content:c,approval:a}=await f.ready(),owner=await f.login('demo-owner'),client=await f.login('demo-client');
 for(const prefix of ['/api/approvals/','/api/production/approvals/']) {
  const path=prefix+a.id+'?clientId=demo-bottega';
  assert.equal((await f.request('POST',path,{decision:'approved'})).statusCode,401);
  assert.equal((await f.request('POST',path,{decision:'approved'},{session:owner,csrf:false})).statusCode,403);
  assert.equal((await f.request('POST',path,{decision:'approved'},{session:client})).statusCode,403);
 }
 assert.equal((await f.request('POST','/api/approvals/'+a.id+'?clientId=demo-studio',{decision:'approved'},{session:owner})).statusCode,403);
 const collaborator=await f.login('demo-collaborator');
 assert.equal((await f.request('POST','/api/approvals/'+a.id+'?clientId=demo-bottega',{decision:'approved'},{session:collaborator})).statusCode,200);
 const path='/api/production/contents/'+c.id+'?clientId=demo-bottega';
 assert.equal((await f.request('PATCH',path,{version:c.version,state:'PROGRAMMATO',scheduled_at:future()},{session:owner})).statusCode,200);
 assert.equal((await f.request('PATCH',path,{version:c.version,state:'PUBBLICATO'},{session:owner})).statusCode,409);
});

test('FUN-062 HTTP: revoca durante la lettura della richiesta non conserva i permessi della sessione',async t=>{
 const f=await httpFixture(t),{approval:a}=await f.ready(),session=await f.login('demo-collaborator');
 const r=await f.request('POST','/api/approvals/'+a.id+'?clientId=demo-bottega',{decision:'approved'},{session,beforeBody:()=>f.s.run("UPDATE os_users SET active=0 WHERE id='demo-collaborator'")});
 assert.equal(r.statusCode,403);assert.equal(f.s.one('SELECT status FROM os_approvals WHERE id=?',a.id).status,'pending');
});
