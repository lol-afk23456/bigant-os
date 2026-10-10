import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';

function setup(t) {
 const app=createApp({env:{},clock:()=>new Date('2026-10-10T12:00:00Z')});t.after(()=>app.close());
 const owner=app.store.one("SELECT * FROM os_users WHERE id='demo-owner'");
 let sequence=0;
 const call=(path,body)=>app.administration.handle({method:'POST',path,user:owner,body:{idempotencyKey:'billing-'+(++sequence),...body}});
 return {...app,owner,call};
}
test('tracker: categorie, fatturato esterno e versioni senza alterare gli incassi',t=>{
 const f=setup(t), before=f.billing.state(f.owner), row=before.billing.tracker[0];
 assert.equal(before.billing.officialSource,'Trello · Fatturazione');assert.equal(before.billing.sourceConnected,false);
 assert.equal(row.category,'recurring_unbilled');assert.equal(row.remaining_cents,25000);assert.equal(row.paid,false);
 assert.deepEqual(row.methods,['bank']);assert.equal(before.billing.incomeByClient[0].cents,10000);
 assert.throws(()=>f.billing.label(f.owner,row.id,{version:0,category:'recurring_billed',description:'Canone',issuedRef:''}),/coerenti/);
 const body={version:0,category:'recurring_billed',description:'Canone social di prova',issuedRef:'ARUBA-PROVA-001'};
 f.billing.label(f.owner,row.id,body);
 const after=f.billing.state(f.owner);assert.equal(after.summary.draft_invoice_cents,0);assert.equal(after.billing.tracker[0].issuedRef,body.issuedRef);
 assert.equal(after.summary.income_month_cents,before.summary.income_month_cents);assert.deepEqual(after.movements,before.movements);
 assert.throws(()=>f.billing.label(f.owner,row.id,body),/tracker è cambiato/);
 assert.throws(()=>f.billing.label(f.owner,row.id,{...body,version:1,category:'withdrawals'}),/Categoria/);
 for(const id of ['demo-client','demo-collaborator']){
  const user=f.store.one('SELECT * FROM os_users WHERE id=?',id);
  assert.throws(()=>f.billing.state(user),/riservata/);assert.throws(()=>f.billing.label(user,row.id,body),/riservata/);
 }
});

test('compenso per mese: totale, pagamento parziale e completo, idempotenza del ledger',async t=>{
 const f=setup(t), body={entityId:'demo-entity-b',counterpartyId:'demo-party-team',kind:'collaborator',title:'Foto di prova',amountCents:12345,period:'2026-10',dueDate:'2026-10-30'};
 const created=(await f.call('/obligations',body)).data;
 let state=f.billing.state(f.owner);assert.equal(state.billing.compensationTotalCents,12345);assert.equal(state.billing.compensationRemainingCents,12345);
 const payment={entityId:'demo-entity-b',accountId:'demo-bank-b',counterpartyId:'demo-party-team',obligationId:created.id,date:'2026-10-10',amountCents:2345,direction:'out',kind:'expense',category:'Compensi collaboratori',method:'bank',sourceRef:'compenso-prova-1',idempotencyKey:'compenso-prova-1'};
 await f.call('/movements',payment);await f.call('/movements',payment);
 state=f.billing.state(f.owner);assert.equal(state.billing.compensationRemainingCents,10000);assert.equal(state.summary.expenses_month_cents,2345);
 await f.call('/movements',{...payment,amountCents:10000,sourceRef:'compenso-prova-2',idempotencyKey:'compenso-prova-2'});
 state=f.billing.state(f.owner);assert.equal(state.billing.compensationRemainingCents,0);assert.equal(state.billing.compensations.find(row=>row.id===created.id).paid,true);assert.equal(state.summary.expenses_month_cents,12345);
 await assert.rejects(f.call('/movements',{...payment,amountCents:1,sourceRef:'compenso-prova-3',idempotencyKey:'compenso-prova-3'}),/superiore al residuo/);
 const count=f.store.one('SELECT COUNT(*) n FROM os_fin_obligations').n;
 await assert.rejects(f.call('/obligations',{...body,period:'2026-13'}),/Mese non valido/);
 assert.equal(f.store.one('SELECT COUNT(*) n FROM os_fin_obligations').n,count);
});

test('API della fatturazione riservata ai soci, senza dati finanziari agli altri ruoli',async t=>{
 const f=setup(t);await new Promise(resolve=>f.server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${f.server.address().port}`;
 for(const profile of ['demo-owner','demo-collaborator','demo-client']){
  const r=await fetch(origin+'/api/demo/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({profile})});
  const session=await r.json(),headers={Origin:origin,Cookie:r.headers.get('set-cookie').split(';')[0],'X-CSRF-Token':session.csrf,'Content-Type':'application/json'};
  const state=await fetch(origin+'/api/billing/state',{headers});assert.equal(state.status,profile==='demo-owner'?200:403);
  if(profile!=='demo-owner'){
   assert.ok(!(await state.text()).includes('amount_cents'));
   const label=await fetch(origin+'/api/billing/tracker/demo-fin-invoice',{method:'PATCH',headers,body:'{}'});assert.equal(label.status,403);
  }
 }
});
