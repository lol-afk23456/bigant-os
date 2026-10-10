import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.js';
import {createClientArea} from '../src/cliente/area.js';
import * as dashboardModule from '../src/cliente/dashboard.js';
import {createClientRecords} from '../src/client-records.js';
import {services} from '../src/registry.js';

const instant='2026-10-10T10:00:00Z';
function fixture(t,{businessProfile=null}={}) {
  const clock=()=>new Date(instant),app=createApp({env:{},clock}),s=app.store;
  t.after(()=>app.close());
  const records=createClientRecords({store:s,production:app.production,env:{},clock});
  const area=createClientArea({store:s,records,businessProfile,clock});
  const user=id=>s.one('SELECT * FROM os_users WHERE id=?',id);
  const owner=user('demo-owner'),client=user('demo-client'),other=user('demo-client-other'),team=user('demo-collaborator');
  return {app,s,area,owner,client,other,team,clock};
}
const fails=(fn,status)=>assert.throws(fn,error=>error.status===status);

test('vista cliente: alias pubblico unico, tre sezioni e stessi dati nell’anteprima del socio',t=>{
  const f=fixture(t),{s,area,owner,client}=f;
  assert.deepEqual(Object.keys(dashboardModule),['createClientDashboard']);
  assert.equal(dashboardModule.createClientDashboard,createClientArea);
  s.run("UPDATE os_contents SET body='DRAFT_PRIVATE_MARKER',source='SOURCE_PRIVATE_MARKER' WHERE id='content-demo'");
  s.run("UPDATE os_tasks SET title='TASK_PRIVATE_MARKER' WHERE client_id='demo-bottega'");
  s.run("UPDATE os_memory SET content='MEMORY_PRIVATE_MARKER',source='MEMORY_SOURCE_MARKER',visibility='client' WHERE client_id='demo-bottega'");
  s.run("UPDATE os_approvals SET body='APPROVAL_PRIVATE_MARKER',reason='FEEDBACK_PRIVATE_MARKER' WHERE client_id='demo-bottega'");
  const expected=area.dashboard(client,'demo-bottega');
  assert.deepEqual(expected.sezioni.map(row=>row.id),['home','servizi','documenti']);
  assert.deepEqual(area.dashboard(owner,'demo-bottega'),expected);
  assert.deepEqual(f.app.cliente.dashboard(client,'demo-bottega'),expected,'La factory server deve usare l’area corrente');
  for(const text of ['DRAFT_PRIVATE_MARKER','SOURCE_PRIVATE_MARKER','TASK_PRIVATE_MARKER','MEMORY_PRIVATE_MARKER','MEMORY_SOURCE_MARKER','APPROVAL_PRIVATE_MARKER','FEEDBACK_PRIVATE_MARKER','amount_cents','risultati','approvazioni','consigliati','crm','chiedi','profilo'])assert.ok(!JSON.stringify(expected).includes(text),text);
});

test('vista cliente: ruoli e titolarità riletti, senza fidarsi dell’oggetto utente precedente',t=>{
  const {s,area,owner,client,team}=fixture(t);
  for(const id of ['demo-bottega','demo-studio'])fails(()=>area.dashboard(team,id),403);
  fails(()=>area.dashboard({...client,role:'owner',tenant_id:'demo-studio'},'demo-studio'),403);
  fails(()=>area.dashboard(null,'demo-bottega'),403);
  fails(()=>area.dashboard({id:'utente-inesistente',role:'owner'},'demo-bottega'),403);
  for(const patch of ["active=0","must_change_password=1","role='collaborator'","tenant_id='demo-studio'"]) {
    s.run("UPDATE os_users SET "+patch+" WHERE id='demo-client'");
    fails(()=>area.dashboard(client,'demo-bottega'),403);
    fails(()=>area.service(client,'demo-bottega','social'),403);
    s.run("UPDATE os_users SET active=1,must_change_password=0,role='client',tenant_id='demo-bottega' WHERE id='demo-client'");
  }
  s.run("UPDATE os_users SET role='collaborator' WHERE id='demo-owner'");
  fails(()=>area.dashboard(owner,'demo-bottega'),403);
  s.run("UPDATE os_clients SET active=0 WHERE id='demo-bottega'");
  fails(()=>area.dashboard(client,'demo-bottega'),403);
});

test('vista cliente: sessione inesistente, scaduta, altrui o revocata rifiutata anche nelle chiamate dirette',t=>{
  const {s,area,client,owner,clock}=fixture(t),until=clock().getTime()+3600000;
  s.run('INSERT INTO os_sessions VALUES(?,?,?,?)','area-client-session',client.id,'csrf-inventato',until);
  const logged={...client,session_id:'area-client-session'};
  assert.equal(area.dashboard(logged,'demo-bottega').clientId,'demo-bottega');
  fails(()=>area.dashboard({...client,session_id:'sessione-inesistente'},'demo-bottega'),401);
  fails(()=>area.dashboard({...owner,session_id:'area-client-session'},'demo-bottega'),401);
  s.run("UPDATE os_sessions SET expires_at=? WHERE id='area-client-session'",clock().getTime());
  fails(()=>area.dashboard(logged,'demo-bottega'),401);
  s.run("UPDATE os_sessions SET expires_at=? WHERE id='area-client-session'",until);
  s.run("DELETE FROM os_sessions WHERE id='area-client-session'");
  fails(()=>area.service(logged,'demo-bottega','social'),401);
});

test('vista cliente: servizi del registro coerenti, Growth escluso e Fidelity autonomo da S14',t=>{
  const {s,area,owner,client}=fixture(t);
  const purchased=['social','ads','local','presence','fidelity','growth','marketplace','apple-leasing'];
  s.run("UPDATE os_clients SET services_json=? WHERE id='demo-bottega'",JSON.stringify(purchased));
  const d=area.dashboard(client,'demo-bottega'),ids=['social','ads','local','presence','fidelity'];
  assert.deepEqual([...d.servizi].sort(),[...ids].sort());
  const cards=d.sezioni.find(row=>row.id==='servizi').attivi;
  assert.deepEqual(cards.map(row=>row.id),d.servizi);
  for(const card of cards)assert.equal(card.nome,services.find(row=>row.id===card.id).name);
  for(const id of ids) {
    const report=area.service(client,'demo-bottega',id);
    assert.deepEqual(area.service(owner,'demo-bottega',id),report);
    assert.deepEqual(report.service,cards.find(row=>row.id===id));
    assert.ok(report.reports.every(row=>!['S14','S17'].includes(row.id)));
  }
  assert.deepEqual(area.service(client,'demo-bottega','ads').reports.map(row=>row.id),['S03','S04']);
  assert.deepEqual(area.service(client,'demo-bottega','fidelity').reports.map(row=>row.id),['fidelity']);
  for(const id of ['growth','marketplace','apple-leasing','S14','servizio-inesistente','website'])fails(()=>area.service(client,'demo-bottega',id),403);
});

test('vista cliente: report diretti rispettano cliente selezionato e revoca immediata dei servizi',t=>{
  let stateCalls=0;
  const {s,area,owner,client,other}=fixture(t,{businessProfile:{state(){stateCalls++;return {enabled:false,data:null};}}});
  fails(()=>area.service(client,'demo-studio','local'),403);
  fails(()=>area.service(other,'demo-bottega','local'),403);
  assert.equal(stateCalls,0,'Nessuna lettura cache prima della verifica di tenant e servizio');
  area.service(client,'demo-bottega','local');assert.equal(stateCalls,1);
  s.run("UPDATE os_clients SET services_json='[\"growth\"]' WHERE id='demo-bottega'");
  assert.deepEqual(area.dashboard(client,'demo-bottega').servizi,[]);
  for(const user of [client,owner])for(const id of ['fidelity','local','social','growth'])fails(()=>area.service(user,'demo-bottega',id),403);
  assert.equal(stateCalls,1,'La revoca non deve richiamare neppure il lettore cache');
});

test('vista cliente: Fidelity espone conteggi attivi con fonte/data, mai anagrafiche o iscritti di altre attività',t=>{
  const {s,area,owner,client,clock}=fixture(t);
  s.run("UPDATE fi_members SET name='FIDELITY_PRIVATE_NAME',email='private-fixture@test.example',phone='PRIVATE_PHONE_MARKER' WHERE id='fi-demo-member'");
  const read=()=>area.service(client,'demo-bottega','fidelity'),r=read();
  assert.equal(r.reports.length,1);
  const metrics=r.reports[0].metriche;
  assert.deepEqual(metrics.map(row=>[row.nome,row.valore]),[['Iscritti attivi',1],['Con consenso marketing',1]]);
  assert.ok(metrics.every(row=>row.fonte==='Archivio Fidelity della tua attività'&&row.aggiornato===clock().toISOString()&&row.stato==='DEMO'));
  assert.deepEqual(area.service(owner,'demo-bottega','fidelity'),r);
  for(const text of ['FIDELITY_PRIVATE_NAME','private-fixture@test.example','PRIVATE_PHONE_MARKER','public_token','apple_auth_token','fi-demo-bigant-member'])assert.ok(!JSON.stringify(r).includes(text),text);
  s.run("UPDATE fi_members SET marketing_consent=0 WHERE id='fi-demo-member'");
  assert.deepEqual(read().reports[0].metriche.map(row=>row.valore),[1,0]);
  s.run("UPDATE fi_members SET status='deleted' WHERE id='fi-demo-member'");
  assert.deepEqual(read().reports[0].metriche.map(row=>row.valore),[0,0],'Iscritti eliminati e altre attività non entrano nel conteggio');
});

test('vista cliente: dati Google soltanto dalla copia attivata, mai dal collaudo visibile al socio',t=>{
  const cache={source:'Google Business Profile',sourceUrl:'https://maps.google.com/?q=fixture',fetchedAt:instant,expiresAt:'2026-10-11T10:00:00Z',from:'2026-09-10',to:'2026-10-09',reviews:{totalReviewCount:2,averageRating:4.5,reviews:[]},performance:{multiDailyMetricTimeSeries:[]},location:{metadata:{mapsUri:'https://maps.google.com/?q=fixture'}},privateKey:'PRIVATE_CACHE_MARKER'};
  const calls=[];let enabled=false,hasCache=true;
  const {area,client,owner}=fixture(t,{businessProfile:{state(user,id){calls.push([user.role,id]);return {enabled,checked:true,canManage:user.role==='owner',connectionKey:'PRIVATE_CONNECTION_MARKER',data:hasCache&&(enabled||user.role==='owner')?cache:null};},refresh(){assert.fail('La consultazione non aggiorna Google');}}});
  assert.equal(area.service(owner,'demo-bottega','local').google,null,'La copia di collaudo del socio non è ancora pubblicabile');
  assert.equal(area.service(client,'demo-bottega','local').google,null);
  enabled=true;
  const visible=area.service(client,'demo-bottega','local');
  assert.deepEqual(area.service(owner,'demo-bottega','local'),visible);
  assert.deepEqual(Object.keys(visible.google).sort(),['expiresAt','fetchedAt','from','performance','reviews','source','sourceUrl','to']);
  assert.ok(!JSON.stringify(visible).includes('PRIVATE_'));
  assert.deepEqual(visible.google.reviews,cache.reviews);
  hasCache=false;
  assert.equal(area.service(client,'demo-bottega','local').google,null,'Una lettura attiva senza copia corrente non inventa valori');
  assert.ok(calls.every(([,id])=>id==='demo-bottega'));
});

test('vista cliente: consultazione senza scritture o provider e nessun metodo di modifica',async t=>{
  const {app,s,area,owner,client}=fixture(t);
  const original=globalThis.fetch;globalThis.fetch=()=>assert.fail('La consultazione non deve contattare fornitori');t.after(()=>{globalThis.fetch=original;});
  const before=s.one('SELECT total_changes() n').n;
  for(const user of [owner,client]) {
    const d=await area.handle({method:'GET',path:'/dashboard',user,clientId:'demo-bottega'});
    assert.equal(d.data.clientId,'demo-bottega');
    for(const id of d.data.servizi)assert.ok((await area.handle({method:'GET',path:'/services/'+id,user,clientId:'demo-bottega'})).data.service);
    for(const method of ['POST','PATCH','PUT','DELETE'])for(const path of ['/dashboard','/services/fidelity'])await assert.rejects(area.handle({method,path,user,clientId:'demo-bottega'}),error=>error.status===405);
    assert.equal(await area.handle({method:'GET',path:'/legacy',user,clientId:'demo-bottega'}),null);
  }
  assert.equal(s.one('SELECT total_changes() n').n,before);
  // The actual server factory's injected GBP implementation only reads cached state.
  assert.equal(app.cliente.service(client,'demo-bottega','local').google,null);
  assert.equal(s.one('SELECT total_changes() n').n,before);
});
