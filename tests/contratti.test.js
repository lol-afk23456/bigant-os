import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.js';

function fixture(t){const a=createApp({motore:'demo'});t.after(()=>a.close());const owner=a.store.one("SELECT * FROM os_users WHERE id='demo-owner'");const call=(method,path,body={})=>a.administration.handle({method,path,body,user:owner,clientId:'demo-bottega'});return {...a,owner,call};}
const oggi=()=>new Date().toISOString().slice(0,10);
const piu=(giorni)=>new Date(Date.now()+giorni*86400000).toISOString().slice(0,10);

test('R-015: un contratto genera la fattura da emettere del mese, i canoni attesi e le scadenze nello scadenziario unico',async t=>{
 const a=fixture(t);
 const c=(await a.call('POST','/contracts',{idempotencyKey:'k-contratto',entityId:'demo-entity-a',counterpartyId:'demo-party-client',clientId:'demo-bottega',service:'presence',amountCents:19900,startDate:oggi().slice(0,7)+'-01',endDate:piu(200),noticeDays:30,documentRef:'Contratto DEMO Presenza'})).data;
 let st=a.administration.state('demo-bottega',a.owner),piano=st.contractPlans.find(p=>p.contract_id===c.id);
 assert.equal(piano.monthly_cents,19900);assert.equal(piano.expected[0].status,'da_emettere');assert.ok(piano.expected.length>=3);
 assert.ok(piano.expected.slice(1).every(x=>x.status==='atteso'&&x.amount_cents===19900));
 assert.ok(piano.deadlines.some(d=>d.kind==='preavviso_rinnovo'&&d.date===new Date(Date.parse(c.end_date+'T00:00:00Z')-30*86400000).toISOString().slice(0,10)));
 // Fattura da emettere: bozza al centesimo, idempotente, mai inviata.
 const r=(await a.call('POST',`/contracts/${c.id}/invoice`,{idempotencyKey:'k-fattura'})).data;
 assert.equal(r.created,true);assert.equal(r.invoice.amount_cents,19900);assert.equal(r.invoice.status,'draft');assert.equal(r.invoice.contract_id,c.id);assert.match(r.invoice.number,/^CAN-\d{6}-/);
 assert.equal((await a.call('POST',`/contracts/${c.id}/invoice`,{idempotencyKey:'k-fattura'})).data.replayed,true);
 const again=(await a.call('POST',`/contracts/${c.id}/invoice`,{idempotencyKey:'k-fattura-2'})).data;assert.equal(again.created,false);assert.equal(again.invoice.id,r.invoice.id);
 assert.equal(a.store.one('SELECT COUNT(*) n FROM os_fin_invoices WHERE contract_id=?',c.id).n,1);
 st=a.administration.state('demo-bottega',a.owner);piano=st.contractPlans.find(p=>p.contract_id===c.id);
 assert.equal(piano.expected[0].status,'fatturato');
 const kinds=new Set(st.deadlines.map(d=>d.kind));for(const k of ['incasso','canone_atteso','preavviso_rinnovo','pagamento','abbonamento'])assert.ok(kinds.has(k),'scadenziario senza '+k);
 assert.ok(st.deadlines.every((d,i,l)=>!i||l[i-1].date<=d.date),'scadenziario ordinato per data');
 // Incasso collegato: il residuo torna a zero al centesimo; invio SDI resta bloccato.
 await a.call('POST','/movements',{idempotencyKey:'k-incasso',sourceRef:'incasso-contratto-test',entityId:'demo-entity-a',accountId:'demo-bank-a',counterpartyId:'demo-party-client',invoiceId:r.invoice.id,date:oggi(),amountCents:19900,direction:'in',category:'Canone Presenza',method:'bank',documentRef:r.invoice.number});
 assert.equal(a.administration.state('demo-bottega',a.owner).invoices.find(i=>i.id===r.invoice.id).remaining_cents,0);
 await assert.rejects(a.call('POST','/sdi',{}),/disabilitata/);
});

test('contratto fuori periodo o non attivo: nessuna fattura generata',async t=>{
 const a=fixture(t);
 const futuro=(await a.call('POST','/contracts',{idempotencyKey:'k-f',entityId:'demo-entity-a',counterpartyId:'demo-party-client',clientId:'demo-bottega',service:'social',amountCents:10000,startDate:piu(70),endDate:piu(400),noticeDays:30})).data;
 await assert.rejects(a.call('POST',`/contracts/${futuro.id}/invoice`,{idempotencyKey:'k-f-1'}),/non copre/);
 a.store.run("UPDATE os_fin_contracts SET status='closed' WHERE id=?",futuro.id);
 await assert.rejects(a.call('POST',`/contracts/${futuro.id}/invoice`,{idempotencyKey:'k-f-2'}),/non attivo/);
});
