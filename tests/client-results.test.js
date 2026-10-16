import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore,seedCore} from '../src/store.js';
import {createClientResults} from '../src/client-results.js';

const instant='2026-10-10T10:00:00Z',clientId='demo-bottega';
function fixture(t){
  const s=openStore();seedCore(s);t.after(()=>s.close());
  const clock=()=>new Date(instant),results=createClientResults({store:s,clock});
  const user=id=>s.one('SELECT * FROM os_users WHERE id=?',id);
  return {s,results,clock,owner:user('demo-owner'),client:user('demo-client'),other:user('demo-client-other'),team:user('demo-collaborator')};
}
function input(period='2026-10'){
  const common={serviceId:'social',date:period+'-05',source:'Registro di prova verificato dal socio',url:'https://example.com/report',detail:''};
  return {period,version:0,summary:'Sintesi preparata per il cliente',nextSteps:'Verificare il prossimo periodo',entries:[
    {...common,kind:'goal',title:'Obiettivo contatti',value:0,target:12,unit:'contatti'},
    {...common,kind:'work',title:'Materiale consegnato',detail:'Consegna confermata nel registro',value:null,target:null,unit:''},
    {...common,kind:'result',title:'Risultato ancora non misurato',value:null,target:null,unit:'contatti'},
    {...common,kind:'result',title:'Contatti rilevati',value:0,target:null,unit:'contatti'}
  ]};
}
const fails=(fn,status)=>assert.throws(fn,error=>error.status===status);
const decision=report=>({id:report.id,version:report.version,confirmed:true});
function publish(f,body=input()){
  const state=f.results.save(f.owner,clientId,body);
  return f.results.publish(f.owner,clientId,decision(state.report)).report;
}

test('risultati: versione corrente verificata esplicitamente, revisione e ritiro senza recuperare vecchie pubblicazioni',t=>{
  const f=fixture(t),{s,results,owner,client}=f,body=input();
  s.run("UPDATE os_tasks SET title='INTERNAL_TASK_MARKER' WHERE client_id=?",clientId);
  s.run("UPDATE os_contents SET body='INTERNAL_DRAFT_MARKER',source='INTERNAL_SOURCE_MARKER' WHERE client_id=?",clientId);
  s.run("UPDATE os_memory SET content='INTERNAL_MEMORY_MARKER' WHERE client_id=?",clientId);
  body.private='INTERNAL_EXTRA_MARKER';body.entries[0].private='INTERNAL_ENTRY_MARKER';
  const first=results.save(owner,clientId,body).report;
  assert.equal(first.version,1);assert.equal(first.published,false);
  assert.deepEqual(results.published(client,clientId).reports,[]);
  fails(()=>results.publish(owner,clientId,{...decision(first),confirmed:false}),400);
  fails(()=>results.publish(owner,clientId,{id:first.id,version:first.version}),400);
  results.publish(owner,clientId,decision(first));
  const visible=results.published(client,clientId);
  assert.deepEqual(results.published(owner,clientId),visible,'Anteprima del socio e cliente coincidono');
  assert.equal(visible.reports[0].version,1);
  for(const key of ['status','canPublish','updatedAt','created_by','history','events'])assert.equal(Object.hasOwn(visible.reports[0],key),false,key);
  assert.ok(!JSON.stringify(visible).includes('INTERNAL_'));
  const before=s.one('SELECT total_changes() n').n;
  results.publish(owner,clientId,decision(first));
  results.save(owner,clientId,{...body,version:1});
  assert.equal(s.one('SELECT total_changes() n').n,before,'Doppio clic e salvataggio identico non generano versioni/eventi');
  const second=results.save(owner,clientId,{...body,version:1,summary:'Nuova sintesi da verificare'}).report;
  assert.equal(second.version,2);
  assert.deepEqual(results.published(client,clientId).reports,[]);
  fails(()=>results.save(owner,clientId,{...body,version:1,summary:'Salvataggio concorrente obsoleto'}),409);
  fails(()=>results.publish(owner,clientId,decision(first)),409);
  fails(()=>results.hide(owner,clientId,decision(first)),409);
  results.publish(owner,clientId,decision(second));
  assert.equal(results.published(client,clientId).reports[0].summary,second.summary);
  results.hide(owner,clientId,decision(second));
  assert.deepEqual(results.published(client,clientId).reports,[]);
  const hidden=s.one('SELECT total_changes() n').n;
  results.hide(owner,clientId,decision(second));
  assert.equal(s.one('SELECT total_changes() n').n,hidden);
  assert.equal(results.state(owner,clientId).history.length,2);
});

test('risultati: isolamento attività, permessi correnti e sessioni anche fuori dalle route HTTP',t=>{
  const f=fixture(t),{s,results,owner,client,other,team,clock}=f,report=publish(f);
  for(const user of [client,team]){
    fails(()=>results.index(user),403);fails(()=>results.state(user,clientId),403);
    fails(()=>results.save(user,clientId,input()),403);
    fails(()=>results.publish(user,clientId,decision(report)),403);
    fails(()=>results.hide(user,clientId,decision(report)),403);
  }
  fails(()=>results.published(team,clientId),403);
  fails(()=>results.published(other,clientId),403);
  fails(()=>results.published({...client,role:'owner',tenant_id:'demo-studio'},'demo-studio'),403);
  fails(()=>results.publish(owner,'demo-studio',decision(report)),404);
  fails(()=>results.state(owner,'demo-bigant'),403);
  fails(()=>results.published(owner,'demo-bigant'),403);
  assert.ok(results.index(owner).items.every(row=>row.clientId!=='demo-bigant'));
  fails(()=>results.published({id:'os-orchestrator'},clientId),403);
  s.run('INSERT INTO os_sessions VALUES(?,?,?,?)','results-session',client.id,'csrf-inventato',clock().getTime()+1000);
  const logged={...client,session_id:'results-session'};
  assert.equal(results.published(logged,clientId).reports.length,1);
  fails(()=>results.state({...owner,session_id:'results-session'},clientId),401);
  s.run("UPDATE os_sessions SET expires_at=? WHERE id='results-session'",clock().getTime());
  fails(()=>results.published(logged,clientId),401);
  s.run("DELETE FROM os_sessions WHERE id='results-session'");
  fails(()=>results.published(logged,clientId),401);
  for(const change of ["active=0","must_change_password=1","role='collaborator'","tenant_id='demo-studio'"]){
    s.run('UPDATE os_users SET '+change+' WHERE id=?',client.id);
    fails(()=>results.published(client,clientId),403);
    s.run("UPDATE os_users SET active=1,must_change_password=0,role='client',tenant_id=? WHERE id=?",clientId,client.id);
  }
});

test('risultati: servizi o attività revocati non ripubblicano il report quando vengono riattivati',t=>{
  const f=fixture(t),{s,results,owner,client}=f,report=publish(f);
  const services=s.one('SELECT services_json FROM os_clients WHERE id=?',clientId).services_json;
  s.run('UPDATE os_clients SET services_json=? WHERE id=?',JSON.stringify(['website']),clientId);
  assert.deepEqual(results.published(client,clientId).reports,[]);
  fails(()=>results.publish(owner,clientId,decision(report)),400);
  s.run('UPDATE os_clients SET services_json=? WHERE id=?',services,clientId);
  assert.deepEqual(results.published(client,clientId).reports,[],'Riaggiungere il servizio richiede nuova verifica esplicita');
  results.publish(owner,clientId,decision(report));
  s.run('UPDATE os_clients SET active=0 WHERE id=?',clientId);
  fails(()=>results.published(client,clientId),403);
  s.run('UPDATE os_clients SET active=1 WHERE id=?',clientId);
  assert.deepEqual(results.published(client,clientId).reports,[],'Riattivare il cliente non ripristina la pubblicazione');
});

test('risultati: revoca del socio pubblicatore persistente anche dopo ripristino delle sue autorizzazioni',t=>{
  const f=fixture(t),{s,results,owner,client}=f,report=publish(f);
  for(const change of ["active=0","must_change_password=1","role='collaborator'"]){
    results.publish(owner,clientId,decision(report));
    s.run('UPDATE os_users SET '+change+' WHERE id=?',owner.id);
    assert.deepEqual(results.published(client,clientId).reports,[]);
    fails(()=>results.state(owner,clientId),403);
    s.run("UPDATE os_users SET active=1,must_change_password=0,role='owner' WHERE id=?",owner.id);
    assert.deepEqual(results.published(client,clientId).reports,[],'Il ripristino del socio non rinnova implicitamente la sua verifica');
  }
});

test('risultati: fonti e date valide, valori mancanti distinti da zero e servizi ammessi',t=>{
  const {s,results,owner,client}=fixture(t),body=input();
  const badRows=[{source:''},{date:'2026-09-30'},{date:'2026-10-11'},{date:'2026-10-32'},
    {url:'javascript:alert(1)'},{url:'http://example.com'},{url:'https://user:secret@example.com'},
    {url:'https://example.com/?api_key=segreto-inventato'},{value:Infinity},{value:'12'},{value:1,unit:''},
    {kind:'result',target:12},{serviceId:'growth'},{serviceId:'ads'},{serviceId:'inesistente'}];
  for(const patch of badRows)fails(()=>results.save(owner,clientId,{...body,entries:[{...body.entries[0],...patch}]}),400);
  for(const period of ['2026-13','2026-11','not-a-month'])fails(()=>results.save(owner,clientId,{...body,period}),400);
  assert.equal(s.one('SELECT count(*) n FROM os_client_reports').n,0,'Le validazioni fallite non salvano report parziali');
  const saved=results.save(owner,clientId,body).report;
  results.publish(owner,clientId,decision(saved));
  const entries=results.published(client,clientId).reports[0].entries;
  assert.deepEqual(entries.map(row=>row.value),[0,null,null,0]);
  assert.equal(entries[0].target,12);
  assert.ok(entries.every(row=>row.source===body.entries[0].source&&row.date==='2026-10-05'&&row.url==='https://example.com/report'));
  const empty=results.save(owner,clientId,{...input('2026-09'),entries:[]}).report;
  fails(()=>results.publish(owner,clientId,decision(empty)),400);
});

test('risultati: periodi e clienti distinti, storico immutabile anche con SQL diretto',t=>{
  const f=fixture(t),{s,results,owner,client,other}=f;
  const october=publish(f),september=publish(f,input('2026-09'));
  const foreign=results.save(owner,'demo-studio',{...input(),summary:'OTHER_CUSTOMER_MARKER'}).report;
  results.publish(owner,'demo-studio',decision(foreign));
  assert.notEqual(october.id,september.id);assert.notEqual(october.id,foreign.id);
  assert.deepEqual(results.published(client,clientId).reports.map(row=>row.period),['2026-10','2026-09']);
  assert.ok(!JSON.stringify(results.published(client,clientId)).includes('OTHER_CUSTOMER_MARKER'));
  assert.equal(results.published(other,'demo-studio').reports[0].summary,'OTHER_CUSTOMER_MARKER');
  assert.equal(results.index(owner).items.length,2);
  for(const [table,column] of [['os_client_reports','period'],['os_client_report_versions','body_json'],['os_client_report_events','action']]){
    const before=s.query('SELECT * FROM '+table);
    assert.throws(()=>s.run('UPDATE '+table+' SET '+column+'='+column),/immutabile/i);
    assert.throws(()=>s.run('DELETE FROM '+table),/immutabile/i);
    assert.throws(()=>s.run('INSERT OR REPLACE INTO '+table+' SELECT * FROM '+table),/immutabile/i,'REPLACE non deve aggirare lo storico di '+table);
    assert.deepEqual(s.query('SELECT * FROM '+table),before);
  }
  assert.throws(()=>s.run('INSERT OR REPLACE INTO os_client_reports VALUES(?,?,?)','replacement-report',clientId,'2026-10'),/immutabile/i,'Anche la collisione cliente/mese con ID diverso deve preservare la testata');
});

test('risultati: consultazione senza scritture, aggiornamenti automatici o richieste a fornitori',t=>{
  const f=fixture(t),{s,results,owner,client}=f;publish(f);
  t.mock.method(globalThis,'fetch',()=>assert.fail('Nessun fornitore deve essere contattato dalla consultazione'));
  const before=s.one('SELECT total_changes() n').n;
  results.index(owner);results.state(owner,clientId);results.state(owner,clientId,'2026-09');
  assert.deepEqual(results.published(owner,clientId),results.published(client,clientId));
  assert.equal(s.one('SELECT total_changes() n').n,before);
});
