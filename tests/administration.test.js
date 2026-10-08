import test from 'node:test';
import assert from 'node:assert/strict';
import { openStore, seedCore } from '../src/store.js';
import { createAdministrationModule } from '../src/administration.js';

function setup(t) {
  const store=openStore(); seedCore(store); t.after(()=>store.close());
  const clock=()=>new Date('2026-10-08T10:00:00Z');
  const module=createAdministrationModule({store,clock}); module.seed();
  const owner=store.one("SELECT * FROM os_users WHERE id='demo-owner'");
  let request=0;
  const call=(path,body={},method='POST',user=owner)=>module.handle({path,method,body:{idempotencyKey:'test-'+(++request),...body},user,clientId:'demo-bigant'});
  const movement={entityId:'demo-entity-a',accountId:'demo-bank-a',date:'2026-10-08',amountCents:101,direction:'out',category:'Materiale DEMO',sourceRef:'movement-1',documentRef:'Ricevuta DEMO'};
  return {store,module,owner,call,movement};
}

test('seed idempotente, due ditte, contabilità in centesimi e fonti DEMO',t=>{
  const {store,module,owner}=setup(t); module.seed();
  const state=module.state('demo-bigant',owner);
  assert.equal(state.entities.length,2); assert.equal(state.accounts.length,3);
  assert.equal(state.movements.length,1); assert.equal(state.summary.income_month_cents,10000);
  assert.equal(state.summary.arrears_cents,25000); assert.equal(state.summary.balance_cents,320000);
  assert.equal(state.questions.length,6); assert.equal(state.demo,true);
  assert.equal(state.entities[0].tax.threshold_cents,null); assert.equal(store.query('SELECT * FROM os_fin_invoices').length,1);
});

test('permessi anche nelle funzioni chiamate direttamente, senza dipendere dal router',async t=>{
  const {module,owner,call,store}=setup(t);
  for(const user of [null,{...owner,active:0},{...owner,role:'collaborator'},{...owner,role:'client'}]) {
    assert.throws(()=>module.state('demo-bottega',user),e=>e.status===403);
    assert.throws(()=>module.analyze(user),e=>e.status===403);
    await assert.rejects(call('/analyze',{},'POST',user),e=>e.status===403);
  }
  assert.equal(store.query('SELECT * FROM os_fin_movements').length,1);
});

test('centesimi interi, date effettive e categorie obbligatorie',async t=>{
  const {call,module,owner,movement}=setup(t);
  for(const amountCents of [1.1,'100',0,-1,Number.MAX_SAFE_INTEGER,NaN]) await assert.rejects(call('/movements',{...movement,amountCents}));
  await assert.rejects(call('/movements',{...movement,date:'2026-02-30'}));
  await assert.rejects(call('/movements',{...movement,date:'2026-10-09'}));
  await assert.rejects(call('/movements',{...movement,category:''}));
  await call('/movements',movement);
  await call('/movements',{...movement,amountCents:202,sourceRef:'movement-2'});
  const state=module.state(null,owner); assert.equal(state.summary.expenses_month_cents,303); assert.equal(state.summary.balance_cents,319697);
});

test('idempotenza atomica e riferimento duplicato anche su un altro conto',async t=>{
  const {call,store,movement}=setup(t),body={...movement,idempotencyKey:'same'};
  const first=await call('/movements',body),again=await call('/movements',body);
  assert.equal(again.data.id,first.data.id); assert.equal(again.data.replayed,true);
  await assert.rejects(call('/movements',{...body,amountCents:102}),e=>e.status===409);
  await assert.rejects(call('/movements',{...movement,accountId:'demo-cash-a'}),e=>e.status===409);
  assert.equal(store.query('SELECT * FROM os_fin_movements WHERE source_ref=?',movement.sourceRef).length,1);
});

test('prima nota immutabile anche dal database e nessuna API di cancellazione',async t=>{
  const {store,call}=setup(t);
  assert.throws(()=>store.run('UPDATE os_fin_movements SET amount_cents=1'));
  assert.throws(()=>store.run('DELETE FROM os_fin_movements'));
  assert.equal(await call('/movements/demo-payment-001',{},'DELETE'),null);
});

test('ditta, conto e documento non possono essere incrociati',async t=>{
  const {call,movement,store}=setup(t);
  await assert.rejects(call('/movements',{...movement,accountId:'demo-bank-b'}),e=>e.status===409);
  await assert.rejects(call('/movements',{...movement,entityId:'demo-entity-b',accountId:'demo-bank-b',invoiceId:'demo-fin-invoice',counterpartyId:'demo-party-client',direction:'in'}),e=>e.status===409);
  await assert.rejects(call('/movements',{...movement,invoiceId:'demo-fin-invoice',direction:'in',counterpartyId:'demo-party-supplier'}),e=>e.status===409);
  await assert.rejects(call('/movements',{...movement,counterpartyId:'demo-party-client',clientId:'demo-studio'}),e=>e.status===409);
  assert.equal(store.query('SELECT * FROM os_fin_movements').length,1);
});

test('incassi parziali, residuo fattura e blocco doppio saldo',async t=>{
  const {call,module,owner,movement}=setup(t);
  const payment={...movement,direction:'in',counterpartyId:'demo-party-client',invoiceId:'demo-fin-invoice',amountCents:25000};
  await call('/movements',payment);
  assert.equal(module.state(null,owner).invoices[0].remaining_cents,0);
  await assert.rejects(call('/movements',{...payment,amountCents:1,sourceRef:'excess'}),e=>e.status===409);
  assert.equal(module.state(null,owner).summary.income_month_cents,35000);
});

test('trasferimento atomico conserva saldi totali e non produce ricavo o costo',async t=>{
  const {call,module,owner,store}=setup(t);
  const before=module.state(null,owner);
  const transfer={fromAccountId:'demo-bank-a',toAccountId:'demo-cash-a',amountCents:1000,date:'2026-10-08',sourceRef:'transfer-001'};
  await call('/transfers',transfer);
  const after=module.state(null,owner);
  assert.equal(after.summary.balance_cents,before.summary.balance_cents);
  assert.equal(after.summary.income_month_cents,before.summary.income_month_cents);
  assert.equal(after.summary.expenses_month_cents,before.summary.expenses_month_cents);
  assert.equal(after.accounts.find(a=>a.id==='demo-cash-a').balance_cents,11000);
  await assert.rejects(call('/transfers',{...transfer,toAccountId:'demo-bank-b'}),e=>e.status===409);
  const count=store.query('SELECT * FROM os_fin_movements').length;
  await assert.rejects(call('/transfers',{...transfer,amountCents:500}));
  assert.equal(store.query('SELECT * FROM os_fin_movements').length,count);
});

test('quadratura per ditta e mese, differenza spiegata ma non corretta, chiusura blocca retrodatazione',async t=>{
  const {call,module,owner,movement,store}=setup(t);
  const request={entityId:'demo-entity-a',accountId:'demo-bank-a',month:'2026-09',actualCents:119900,note:'DEMO: ricevuta da cercare'};
  const review=await call('/reconciliations',request);
  assert.equal(review.data.difference_cents,-100); assert.equal(review.data.status,'in_review');
  await assert.rejects(call('/reconciliations',{...request,close:true}),e=>e.status===409);
  await assert.rejects(call('/reconciliations',{...request,entityId:'demo-entity-b'}),e=>e.status===409);
  await call('/reconciliations',{...request,actualCents:120000,note:'DEMO: saldo verificato',close:true});
  await assert.rejects(call('/movements',{...movement,date:'2026-09-30'}),e=>e.status===409);
  await call('/movements',{...movement,entityId:'demo-entity-b',accountId:'demo-bank-b',date:'2026-09-30'});
  const result=module.analyze(owner);
  assert.equal(result.anomalies.filter(a=>a.rule==='reconciliation_difference'&&a.detected).length,0);
  assert.equal(store.query('SELECT * FROM os_fin_movements').length,2);
});

test('analisi deterministica non cambia conti; risoluzione necessita nota e non nasconde la persistenza',async t=>{
  const {module,owner,call,store}=setup(t);
  const before=JSON.stringify(store.query('SELECT * FROM os_fin_movements'));
  const a=module.analyze(owner),b=module.analyze(owner);
  assert.equal(a.detected,b.detected); assert.equal(a.costCents,0);
  assert.equal(JSON.stringify(store.query('SELECT * FROM os_fin_movements')),before);
  const anomaly=a.anomalies.find(a=>a.rule==='invoice_overdue');
  await assert.rejects(call('/anomalies/'+anomaly.id,{status:'resolved'},'PATCH'));
  await call('/anomalies/'+anomaly.id,{status:'resolved',resolutionNote:'DEMO: differenza presa in carico dal socio'},'PATCH');
  const current=module.analyze(owner).anomalies.find(a=>a.id===anomaly.id);
  assert.equal(current.status,'resolved'); assert.equal(current.detected,1); assert.ok(current.resolution_note);
});

test('prelievi distinti dai costi, superamento accordo e documenti mancanti segnalati',async t=>{
  const {call,module,owner,movement}=setup(t);
  await call('/movements',{...movement,entityId:'demo-entity-b',accountId:'demo-bank-b',counterpartyId:'demo-party-owner',obligationId:'demo-fin-withdrawal',kind:'withdrawal',amountCents:30000,documentRef:''});
  const result=module.analyze(owner);
  assert.ok(result.anomalies.some(a=>a.rule==='owner_overdraw'&&a.amount_cents===5000));
  assert.ok(result.anomalies.some(a=>a.rule==='missing_document'));
  const state=module.state(null,owner); assert.equal(state.summary.withdrawals_month_cents,30000); assert.equal(state.summary.expenses_month_cents,0);
});

test('anagrafiche contratti bozze scadenze e abbonamenti condividono il modello e restano offline',async t=>{
  const {call,module,owner}=setup(t);
  const party=(await call('/counterparties',{kind:'client',name:'Cliente Test DEMO',clientId:'demo-studio'})).data;
  const contract=(await call('/contracts',{entityId:'demo-entity-b',counterpartyId:party.id,service:'video',amountCents:10001,startDate:'2026-10-01',endDate:'2027-09-30'})).data;
  const invoice=(await call('/invoices',{entityId:'demo-entity-b',counterpartyId:party.id,contractId:contract.id,number:'DEMO-NEW',amountCents:10001,issueDate:'2026-10-08',dueDate:'2026-11-01'})).data;
  assert.equal(invoice.client_id,'demo-studio'); assert.equal(invoice.status,'draft');
  await call('/obligations',{entityId:'demo-entity-b',counterpartyId:'demo-party-team',kind:'collaborator',title:'Montaggio DEMO',amountCents:5000,dueDate:'2026-11-01',minutes:90});
  await call('/subscriptions',{entityId:'demo-entity-a',counterpartyId:'demo-party-supplier',name:'Archivio creativo DEMO',amountCents:1900,nextDue:'2026-10-18'});
  assert.ok(module.analyze(owner).anomalies.some(a=>a.rule==='subscription_duplicate'));
  assert.equal(module.state(null,owner).projections[0].expected_income_cents,10001);
  await assert.rejects(call('/obligations',{entityId:'demo-entity-b',kind:'tax_reserve',title:'Imposta',amountCents:100,dueDate:'2026-11-01'}),e=>e.status===409);
  for(const path of ['/send','/pay','/sdi','/connect']) await assert.rejects(call(path),e=>e.status===409);
});

test('storno speculare idempotente conserva originale e riapre residuo senza raddoppiare incassi',async t=>{
  const {store,call,module,owner}=setup(t),original=store.one('SELECT * FROM os_fin_movements LIMIT 1'),snapshot=JSON.stringify(original);
  const request={idempotencyKey:'reverse-1',movementId:original.id,entityId:original.entity_id,date:'2026-10-08',sourceRef:'reversal-1',documentRef:'Rettifica DEMO',reason:'Registrazione errata DEMO'};
  const result=await call('/reversals',request),again=await call('/reversals',request);
  assert.equal(result.data.id,again.data.id);assert.equal(again.data.replayed,true);
  assert.equal(result.data.reversals[0].reversal.amount_cents,original.amount_cents);
  assert.equal(result.data.reversals[0].reversal.direction,'out');
  assert.equal(JSON.stringify(store.one('SELECT * FROM os_fin_movements WHERE id=?',original.id)),snapshot);
  const state=module.state(null,owner);assert.equal(state.invoices[0].paid_cents,0);assert.equal(state.invoices[0].remaining_cents,35000);assert.equal(state.summary.income_month_cents,0);assert.equal(state.summary.balance_cents,310000);
  await assert.rejects(call('/reversals',{...request,idempotencyKey:'reverse-again',sourceRef:'other'}),e=>e.status===409);
  assert.equal(store.query('SELECT * FROM os_fin_reversals').length,1);
});

test('storno richiede documento motivo e stessa ditta; non ammette storno dello storno',async t=>{
  const {store,call}=setup(t),original=store.one('SELECT * FROM os_fin_movements LIMIT 1');
  const request={movementId:original.id,entityId:original.entity_id,date:'2026-10-08',sourceRef:'reversal-1',documentRef:'Rettifica DEMO',reason:'Registrazione errata DEMO'};
  await assert.rejects(call('/reversals',{...request,documentRef:''}));await assert.rejects(call('/reversals',{...request,reason:''}));
  await assert.rejects(call('/reversals',{...request,entityId:'demo-entity-b'}),e=>e.status===409);
  const {data}=await call('/reversals',request);
  await assert.rejects(call('/reversals',{...request,movementId:data.reversals[0].reversal.id,sourceRef:'again'}),e=>e.status===409);
});

test('rettifica è atomica: contromovimento e nuova registrazione oppure nessun effetto',async t=>{
  const {store,call,module,owner}=setup(t),original=store.one('SELECT * FROM os_fin_movements LIMIT 1');
  const request={movementId:original.id,entityId:original.entity_id,date:'2026-10-08',sourceRef:'correction-1',documentRef:'Rettifica DEMO',reason:'Importo corretto DEMO'};
  await assert.rejects(call('/corrections',{...request,replacement:{amountCents:50000}}),e=>e.status===409);
  assert.equal(store.query('SELECT * FROM os_fin_reversals').length,0);assert.equal(store.query('SELECT * FROM os_fin_movements').length,1);
  await assert.rejects(call('/corrections',{...request,replacement:{amountCents:20000,accountId:'demo-bank-b'}}),e=>e.status===409);
  const result=await call('/corrections',{...request,replacement:{amountCents:20000}});
  assert.equal(result.data.replacement.amount_cents,20000);assert.equal(store.query('SELECT * FROM os_fin_movements').length,3);
  const state=module.state(null,owner);assert.equal(state.summary.income_month_cents,20000);assert.equal(state.invoices[0].remaining_cents,15000);
});

test('storno di trasferimento registra entrambi i contromovimenti nella stessa transazione',async t=>{
  const {call,module,owner,store}=setup(t),initial=module.state(null,owner);
  const transfer=(await call('/transfers',{fromAccountId:'demo-bank-a',toAccountId:'demo-cash-a',amountCents:5000,date:'2026-10-08',sourceRef:'transfer-x'})).data;
  const {data}=await call('/reversals',{movementId:transfer.movements[0].id,entityId:'demo-entity-a',date:'2026-10-08',sourceRef:'reverse-transfer',documentRef:'Nota DEMO',reason:'Trasferimento errato DEMO'});
  assert.equal(data.reversals.length,2);assert.equal(store.query('SELECT * FROM os_fin_reversals').length,2);
  const state=module.state(null,owner);assert.deepEqual(state.accounts.map(a=>a.balance_cents),initial.accounts.map(a=>a.balance_cents));assert.equal(state.summary.expenses_month_cents,0);
});

test('periodo chiuso resta invariato: storno solo in periodo aperto con conferma esplicita',async t=>{
  const {call,movement,store}=setup(t);
  const original=(await call('/movements',{...movement,date:'2026-09-30',amountCents:100})).data;
  await call('/reconciliations',{entityId:'demo-entity-a',accountId:'demo-bank-a',month:'2026-09',actualCents:119900,note:'Quadratura DEMO',close:true});
  const request={movementId:original.id,entityId:'demo-entity-a',date:'2026-10-08',sourceRef:'new-period',documentRef:'Rettifica ottobre DEMO',reason:'Correzione successiva DEMO'};
  await assert.rejects(call('/reversals',request),e=>e.status===409);
  await assert.rejects(call('/reversals',{...request,date:'2026-09-30',allowClosedPeriodAdjustment:true}),e=>e.status===409);
  await call('/reversals',{...request,allowClosedPeriodAdjustment:true});
  assert.equal(store.one('SELECT * FROM os_fin_reconciliations').calculated_cents,119900);
  assert.equal(store.query("SELECT * FROM os_fin_movements WHERE date LIKE '2026-09%'").length,1);
  assert.equal(store.one('SELECT * FROM os_fin_reversals').new_period_ack,1);
});

test('tariffa confermata e scope ditta/cliente/persona/servizio, costo ore arrotondato al centesimo',async t=>{
  const {call,module,owner,store}=setup(t);
  const rateBody={entityId:'demo-entity-a',clientId:'demo-bottega',userId:'demo-collaborator',counterpartyId:'demo-party-team',service:'social',hourlyCents:1001,costTreatment:'internal_time',effectiveFrom:'2026-10-01',confirmed:true,note:'Costo interno DEMO confermato, non già presente in prima nota'};
  await assert.rejects(call('/hourly-rates',{...rateBody,confirmed:false}));
  const rate=(await call('/hourly-rates',rateBody)).data;
  await assert.rejects(call('/work-allocations',{entityId:'demo-entity-b',taskId:'task-demo',rateId:rate.id,workDate:'2026-10-08',note:'DEMO'}),e=>e.status===409);
  await call('/work-allocations',{entityId:'demo-entity-a',taskId:'task-demo',rateId:rate.id,workDate:'2026-10-08',note:'Attribuzione DEMO'});
  store.run("UPDATE os_tasks SET estimate_minutes=90,actual_minutes=30,status='done' WHERE id='task-demo'");
  const margin=module.state(null,owner).margins.find(m=>m.client_id==='demo-bottega');
  assert.equal(margin.by_entity[0].estimated_labor_cents,1502);assert.equal(margin.by_entity[0].actual_hours_cost_cents,501);
  assert.equal(margin.realized_margin_cents,9499);assert.equal(margin.full_margin_cents,null);
  await assert.rejects(call('/work-allocations',{entityId:'demo-entity-a',taskId:'task-demo',rateId:rate.id,workDate:'2026-10-08',note:'Doppio DEMO'}),e=>e.status===409);
});

test('compensi a movimento non contati nuovamente come ore e dati incompleti non producono falso margine',async t=>{
  const {call,module,owner,store,movement}=setup(t);
  assert.equal(module.state(null,owner).margins.find(m=>m.client_id==='demo-bottega').realized_margin_cents,null);
  const rate=(await call('/hourly-rates',{entityId:'demo-entity-a',clientId:'demo-bottega',userId:'demo-collaborator',counterpartyId:'demo-party-team',service:'social',hourlyCents:2000,costTreatment:'expense_backed',effectiveFrom:'2026-10-01',confirmed:true,note:'Compenso DEMO registrato in prima nota'})).data;
  await call('/work-allocations',{entityId:'demo-entity-a',taskId:'task-demo',rateId:rate.id,workDate:'2026-10-08',note:'DEMO'});
  store.run("UPDATE os_tasks SET actual_minutes=60,status='done' WHERE id='task-demo'");
  await call('/movements',{...movement,clientId:'demo-bottega',counterpartyId:'demo-party-team',amountCents:2000});
  let margin=module.state(null,owner).margins.find(m=>m.client_id==='demo-bottega');
  assert.equal(margin.realized_margin_cents,8000);assert.equal(margin.by_entity[0].recorded_labor_payments_cents,2000);assert.equal(margin.by_entity[0].additional_internal_hours_cents,0);
  store.run("UPDATE os_tasks SET assignee='demo-owner' WHERE id='task-demo'");
  margin=module.state(null,owner).margins.find(m=>m.client_id==='demo-bottega');assert.equal(margin.realized_margin_cents,null);assert.ok(margin.by_entity[0].issues.length);
});
