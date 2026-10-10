import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createApp} from '../server.js';
import {createCostControl} from '../src/cost-control.js';
import {growthStore} from '../src/growth-store.js';

function fixture(t,{realMode=false}={}) {
  let instant=new Date('2026-10-10T12:00:00Z');const clock=()=>instant;
  const app=createApp({env:{},clock});t.after(()=>app.close());
  const store=app.store,owner=store.one("SELECT * FROM os_users WHERE id='demo-owner'"),control=app.costControl;
  const confirm=(externalCents=2000,extra={})=>control.confirm(owner,{...control.state(owner),externalCents,confirmed:true,...extra});
  const paid=(cents)=>app.orchestrator.reserve('demo-bigant','sciame:fixture',cents,{paid:true});
  const growth=growthStore(store,()=>owner,{realMode:true,clock,costControl:control});
  return {app,store,owner,control,confirm,paid,growth,clock,advance:value=>{instant=new Date(value);}};
}
test('budget ignoto: zero spese autorizzate; DEMO gratuita e letture senza scritture',async t=>{
  const f=fixture(t),before=f.store.db.prepare('SELECT total_changes() n').get().n;
  const state=f.control.state(f.owner);assert.equal(state.verified,false);assert.equal(state.totalCents,null);assert.equal(state.availableCents,0);
  assert.equal(f.store.db.prepare('SELECT total_changes() n').get().n,before);
  assert.throws(()=>f.paid(1),/Verifica i consumi/);assert.throws(()=>f.growth.reserve('demo-bigant','ai',1,'Test'),/Verifica i consumi/);
  assert.equal(f.store.one('SELECT COUNT(*) n FROM os_costs').n,0);
  f.app.orchestrator.reserve('demo-bigant','demo',0);assert.equal(f.control.snapshot().osCents,0);
});
test('soglia esatta esclusa e ultimo centesimo disponibile condiviso tra Growth e Sciame',async t=>{
  const f=fixture(t);f.confirm(3900);
  const first=f.growth.reserve('demo-bigant','search',50,'Test');
  assert.throws(()=>f.paid(50),/Soglia di stop/);const second=f.paid(49);
  assert.equal(f.control.snapshot().totalCents,3999);assert.equal(f.control.snapshot().availableCents,0);
  assert.throws(()=>f.growth.reserve('demo-bigant','ai',1,'Test'),/Soglia di stop/);
  f.growth.settle(first,true);assert.equal(f.control.snapshot().totalCents,3999);
  f.store.run("UPDATE os_costs SET status='released' WHERE id=?",second);assert.equal(f.control.snapshot().totalCents,3950);
});
test('due chiamanti concorrenti non prenotano lo stesso margine',async t=>{
  const f=fixture(t);f.confirm(3950);
  const results=await Promise.allSettled([Promise.resolve().then(()=>f.paid(30)),Promise.resolve().then(()=>f.growth.reserve('demo-bigant','ai',30,'Test'))]);
  assert.deepEqual(results.map(r=>r.status),['fulfilled','rejected']);assert.equal(f.control.snapshot().totalCents,3980);
});
test('conferme immutabili e versionate; non azzerano o duplicano il contatore OS',async t=>{
  const f=fixture(t);f.confirm();f.paid(25);const previous=f.control.state(f.owner);
  f.confirm(3000);assert.equal(f.control.snapshot().totalCents,3025);
  assert.throws(()=>f.control.confirm(f.owner,{...previous,externalCents:2500,confirmed:true}),/cambiati/);
  for(const sql of ['UPDATE os_budget_reconciliations SET external_cents=2000','DELETE FROM os_budget_reconciliations'])assert.throws(()=>f.store.run(sql),/immutabile/);
  assert.equal(f.store.one('SELECT COUNT(*) n FROM os_budget_reconciliations').n,2);
  assert.equal(f.store.one("SELECT COUNT(*) n FROM os_audit WHERE action='Consumi esterni del mese verificati'").n,2);
  assert.equal(createCostControl({store:f.store,clock:f.clock}).snapshot().totalCents,3025);
});
test('cambio mese Europe/Rome: nuova verifica e impegni precedenti ancora conteggiati',async t=>{
  const f=fixture(t);f.advance('2026-10-31T22:59:00Z');f.confirm();f.paid(50);
  f.advance('2026-10-31T23:00:00Z');assert.equal(f.control.snapshot().month,'2026-11');assert.equal(f.control.snapshot().verified,false);
  assert.throws(()=>f.paid(1),/Verifica i consumi/);f.confirm(3900);
  assert.equal(f.control.snapshot().previousReservedCents,50);assert.equal(f.control.snapshot().totalCents,3950);
  assert.throws(()=>f.paid(50),/Soglia di stop/);
});
test('dati malformati o senza consenso non confermano la spesa; eccedenze sono registrabili',async t=>{
  const f=fixture(t);
  for(const externalCents of [0,1999,-1,NaN,Infinity,'2000',2000.1,null,100_000_001])assert.throws(()=>f.confirm(externalCents),/Conferma/);
  assert.throws(()=>f.confirm(2000,{confirmed:false}),/Conferma/);assert.throws(()=>f.confirm(2000,{month:'2026-09'}),/cambiati/);
  f.confirm(5000);assert.equal(f.control.snapshot().blocked,true);assert.equal(f.control.snapshot().availableCents,0);assert.throws(()=>f.paid(1),/Soglia/);
  assert.equal(f.store.one('SELECT COUNT(*) n FROM os_budget_reconciliations').n,1);
});
test('revoca, cambio ruolo, password e sessione sono verificati dal server',async t=>{
  const f=fixture(t);
  for(const id of ['demo-client','demo-collaborator','os-orchestrator'])assert.throws(()=>f.control.state(f.store.one('SELECT * FROM os_users WHERE id=?',id)),e=>e.status===403);
  f.confirm();f.store.run('UPDATE os_users SET active=0 WHERE id=?',f.owner.id);
  assert.throws(()=>f.confirm(),e=>e.status===403);assert.equal(f.control.snapshot().verified,false);assert.throws(()=>f.paid(1),/Verifica/);
  f.store.run("UPDATE os_users SET active=1,role='collaborator' WHERE id=?",f.owner.id);assert.throws(()=>f.confirm(),e=>e.status===403);
  f.store.run("UPDATE os_users SET role='owner',must_change_password=1 WHERE id=?",f.owner.id);assert.throws(()=>f.confirm(),e=>e.status===403);
  f.store.run('UPDATE os_users SET must_change_password=0 WHERE id=?',f.owner.id);
  assert.throws(()=>f.control.state({...f.owner,session_id:'non-esiste'}),e=>e.status===401);
});
test('80% anche per un tetto interno più basso, indipendente dalle quote fisse',async t=>{
  const f=fixture(t);f.confirm();f.store.setSetting('budget_cents',3000);f.store.setSetting('fixed_cents',2000);
  assert.equal(f.control.snapshot().stopCents,2400);f.paid(399);assert.throws(()=>f.paid(1),/Soglia/);
  f.store.setSetting('budget_cents','non valido');assert.throws(()=>f.paid(1),/Soglia/);
});
test('HTTP: lettura e conferma owner-only, consenso, versione e CSRF',async t=>{
  const f=fixture(t),handler=f.app.server.listeners('request')[0];
  for(const id of ['demo-owner','demo-collaborator','demo-client'])f.store.run('INSERT INTO os_sessions VALUES(?,?,?,?)',createHash('sha256').update(id).digest('hex'),id,'csrf',Math.max(Date.now(),f.clock().getTime())+3600000);
  async function request(method,user,body,csrf='csrf'){
    const req={method,url:'/api/agents/cost-control',headers:{host:'127.0.0.1:4330',origin:'http://127.0.0.1:4330','content-type':'application/json','x-csrf-token':csrf,...(user?{cookie:'bigant_os='+user}:{})},socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){if(body)yield Buffer.from(JSON.stringify(body));}};
    const res={status:200,setHeader(){},writeHead(status){this.status=status;},end(body){this.body=JSON.parse(String(body));}};await handler(req,res);return res;
  }
  for(const user of [null,'demo-collaborator','demo-client'])for(const method of ['GET','POST'])assert.ok([401,403].includes((await request(method,user,{})).status));
  const first=(await request('GET','demo-owner')).body;
  assert.equal((await request('POST','demo-owner',{...first,externalCents:2000,confirmed:true},'wrong')).status,403);
  assert.equal((await request('POST','demo-owner',{...first,externalCents:2000,confirmed:true})).status,200);
  assert.equal((await request('POST','demo-owner',{...first,externalCents:2000,confirmed:true})).status,409);
});

test('verifica cambiata tra prenotazione e trasporto: nessuna richiesta, costo rilasciato',async t=>{
 const {createGrowthLiveProviders}=await import('../src/growth-live-providers.js');const f=fixture(t);f.confirm();let calls=0;
 const p=createGrowthLiveProviders({credentials:async()=>({apiKey:'finta'}),allow:async()=>true,estimatedCents:{search:5},fetchImpl:async()=>{calls++;throw Error('Non deve partire');},budget:{reserve:async(...args)=>{const id=f.growth.reserve(...args);f.confirm(4000);return id;},dispatch:f.growth.dispatch,settle:f.growth.settle}});
 await assert.rejects(p.search('demo-bigant','Prova',1),/Soglia/);assert.equal(calls,0);assert.equal(f.store.one('SELECT status FROM os_costs').status,'released');
});
test('timeout dopo il trasporto resta conteggiato nel limite condiviso',async t=>{
 const {createGrowthLiveProviders}=await import('../src/growth-live-providers.js');const f=fixture(t);f.confirm(3970);let calls=0;
 const p=createGrowthLiveProviders({credentials:async()=>({apiKey:'finta'}),allow:async()=>true,estimatedCents:{search:25},fetchImpl:async()=>{calls++;throw Error('Timeout finto');},budget:{reserve:f.growth.reserve,dispatch:f.growth.dispatch,settle:f.growth.settle}});
 await assert.rejects(p.search('demo-bigant','Prova',1),/raggiungibile/);assert.equal(calls,1);assert.equal(f.control.snapshot().totalCents,3995);assert.equal(f.store.one('SELECT status FROM os_costs').status,'charged');
 await assert.rejects(p.search('demo-bigant','Prova',1),/Soglia/);assert.equal(calls,1);
});
test('Sciame oneroso bloccato senza verifica; errore incerto dopo la chiamata conserva la stima',async t=>{
 const f=fixture(t);let calls=0;f.app.sciame.usaMotore({id:'api',stato:()=>({disponibile:true}),esegui:async({beforeDispatch})=>{beforeDispatch();calls++;throw Error('Timeout finto');}});
 const run=()=>f.app.sciame.eseguiGiro(f.app.sciame.creaGiro(f.owner,{richiesta:'Priorità di prova',flussi:['crescita']}).id);
 await run();assert.equal(calls,0);assert.equal(f.store.one('SELECT COUNT(*) n FROM os_costs').n,0);
 f.confirm();await run();assert.equal(calls,1);assert.equal(f.store.one('SELECT cents,status FROM os_costs').cents,40);assert.equal(f.store.one('SELECT status FROM os_costs').status,'charged');
});

test('Sciame ricontrolla la soglia dopo il caricamento del fornitore, prima del trasporto',async t=>{
 const {createMotore}=await import('../src/motori/index.js');const f=fixture(t);f.confirm();let calls=0;
 const motore=createMotore({nome:'api',root:process.cwd(),env:{BIGANT_ANTHROPIC_API_KEY:'chiave-inventata',BIGANT_API_MODELLO:'modello-inventato'},importSdk:async()=>{f.confirm(4000);return {default:class {constructor(options){assert.equal(options.maxRetries,0);assert.equal(options.timeout,120000);this.messages={create:async()=>{calls++;throw Error('Trasporto vietato');}};}}};}});
 f.app.sciame.usaMotore(motore);const giro=f.app.sciame.creaGiro(f.owner,{richiesta:'Prova inventata',flussi:['crescita']});const result=await f.app.sciame.eseguiGiro(giro.id);
 assert.equal(result.stato,'errore');assert.match(result.errore,/Soglia/);assert.equal(calls,0);assert.equal(f.store.one('SELECT status FROM os_costs').status,'released');
});
