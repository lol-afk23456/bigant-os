import test from 'node:test';
import assert from 'node:assert/strict';
import {mailFixture} from './helpers/growth-mail-fixture.js';
import {createGrowthModule} from '../src/growth.js';
const requests=f=>f.calls.filter(c=>c.url.endsWith('/messages/send')).length;
test('Gmail chiuso: accessi salvati non autorizzano rete, approvazioni o invii',async t=>{
 const f=mailFixture(t,{gmailEnabled:false});assert.equal(f.state().mail.available,false);await assert.rejects(f.call('POST','/mail/check',{version:0}),/non abilitato/);assert.equal(f.calls.length,0);
});
test('approvazione e invio esatti, idempotenza e nessun worker reale',async t=>{
 const f=mailFixture(t);await f.enable();const m=await f.draft();await assert.rejects(f.call('PATCH','/messages/'+m.id,{status:'approved'}),/Versione/);await f.approve(m);const p=await f.preview(m.id);assert.equal(p.to,'destinatario1@fixture.example');assert.equal(p.canSend,true);assert.match(p.body,/Assistente digitale/);
 assert.match(f.store.one('SELECT body FROM os_approvals WHERE entity_id=? ORDER BY version DESC',m.id).body,/Mittente: mittente@fixture.example\nDestinatario: destinatario1@fixture.example/);
 assert.equal((await f.growth.engine.tick()).processed,0);assert.equal(requests(f),0);await assert.rejects(f.call('POST','/messages/'+m.id+'/send',{...p,confirmed:false}),/Rivedi/);
 assert.equal((await f.send(p)).status,'sent');assert.equal(f.state().messages[0].externalDelivery,true);await assert.rejects(f.send(p),/non approvata/);assert.equal(requests(f),1);
 const raw=Buffer.from(JSON.parse(f.calls.find(c=>c.url.endsWith('/messages/send')).opts.body).raw,'base64url').toString();assert.ok(raw.includes('To: '+p.to));assert.ok(raw.includes('Message-ID: <'+m.id+'@growth.bigantagency.it>'));assert.ok(!raw.includes('List-Unsubscribe-Post'));
 assert.throws(()=>f.store.run("UPDATE gr_mail_approvals SET hash='changed'"),/immutabile/);
});
test('versione, indirizzo, mittente e consenso modificati richiedono nuova revisione',async t=>{
 const f=mailFixture(t);await f.enable();const m=await f.draft();await f.approve(m);let p=await f.preview(m.id);
 await f.call('PATCH','/messages/'+m.id,{version:p.version,status:'approved',subject:'Oggetto rivisto'});await assert.rejects(f.send(p),/Rivedi/);p=await f.preview(m.id);assert.equal(p.version,m.approvalVersion+1);
 await f.call('PATCH','/leads/'+m.lead_id,{email:'nuovo@fixture.example'});await assert.rejects(f.send(p),/non approvata/);assert.equal(f.state().messages[0].status,'draft');assert.equal(f.state().leads[0].consent,'none');assert.equal(requests(f),0);
 const m2=await f.draft();await f.approve(m2);const p2=await f.preview(m2.id);await f.call('POST','/settings',{senderName:'Nuovo mittente'});await assert.rejects(f.send(p2),/non approvata/);
});
test('firma e disiscrizione non eliminabili dalla versione approvata',async t=>{
 const f=mailFixture(t);await f.enable();const m=await f.draft();await assert.rejects(f.call('PATCH','/messages/'+m.id,{version:m.approvalVersion,status:'approved',body:'Testo senza tutele'}),/firma/);assert.equal(f.state().messages[0].body,m.body);assert.equal(f.state().messages[0].status,'draft');
});
test('revoca durante il rinnovo token: nessun invio e nessuna approvazione ripristinata',async t=>{
 for(const change of ['consent','suppression','role','sender']){const f=mailFixture(t);await f.enable();const m=await f.draft();await f.approve(m);const p=await f.preview(m.id);let once=false;
  f.control.before=async url=>{if(once||!url.endsWith('/token'))return;once=true;if(change==='consent')await f.call('PATCH','/leads/'+m.lead_id,{consent:'none'});if(change==='suppression')await f.call('POST','/leads/'+m.lead_id+'/suppress');if(change==='role')f.store.run("UPDATE os_users SET active=0 WHERE id=?",f.owner.id);if(change==='sender')await f.call('POST','/settings',{senderName:'Altro nome'});};
  await assert.rejects(f.send(p));assert.equal(requests(f),0);assert.equal(f.store.one('SELECT status FROM gr_mail_intents').status,'safe_failed');assert.notEqual(f.store.one('SELECT status FROM gr_messages WHERE id=?',m.id).status,'approved');
 }
});
test('richieste concorrenti rispettano limite giornaliero e doppio clic',async t=>{
 const f=mailFixture(t);await f.enable();const a=await f.draft(),b=await f.draft();await f.approve(a);await f.approve(b);const p=await f.preview(a.id),q=await f.preview(b.id);await f.call('POST','/settings',{dailyLimit:1});let entered,release;const ready=new Promise(r=>entered=r);f.control.before=async url=>{if(url.endsWith('/messages/send')){entered();await new Promise(r=>release=r);}};
 const pending=f.send(p);await ready;await assert.rejects(f.send(p),/non approvata/);await assert.rejects(f.send(q),/Limite/);release();await pending;assert.equal(requests(f),1);
});
test('timeout o revoca dopo richiesta: incerto, nessun reinvio, riconciliazione coerente anche in pausa',async t=>{
 const f=mailFixture(t);await f.enable();const m=await f.draft();await f.approve(m);const p=await f.preview(m.id);f.control.sendFail=true;await assert.rejects(f.send(p),/non raggiungibile/);assert.equal(f.state().messages[0].status,'uncertain');await assert.rejects(f.send(p),/non approvata/);
 await f.call('POST','/settings',{paused:true});assert.equal((await f.call('POST','/messages/'+m.id+'/reconcile')).found,false);assert.equal(f.state().messages[0].status,'uncertain');f.control.found=true;f.control.to=p.to+', intruso@fixture.example';await assert.rejects(f.call('POST','/messages/'+m.id+'/reconcile'),/non corrisponde/);f.control.to=null;assert.equal((await f.call('POST','/messages/'+m.id+'/reconcile')).status,'sent');assert.equal(requests(f),1);
});
test('pausa dopo accettazione e risposta Gmail malformata restano da verificare',async t=>{
 for(const change of ['pause','malformed']){const f=mailFixture(t);await f.enable();const m=await f.draft();await f.approve(m);const p=await f.preview(m.id);
  if(change==='pause')f.control.before=async url=>{if(url.endsWith('/messages/send'))await f.call('POST','/settings',{paused:true});};else f.control.sendResult={id:{},threadId:'thread1'};
  await assert.rejects(f.send(p));assert.equal(f.store.one('SELECT status FROM gr_mail_intents').status,'uncertain');assert.equal(requests(f),1);
 }
});
test('disiscrizione pubblica funziona con attività sospesa senza rivelare il contatto',async t=>{
 const f=mailFixture(t);await f.enable();const m=await f.draft();await f.approve(m);const p=await f.preview(m.id),token=p.unsubscribe.split('/').at(-1);f.store.run("UPDATE os_clients SET active=0 WHERE id='demo-bigant'");await f.call('POST','/settings',{paused:true});const user={id:'os-public',role:'owner'};
 assert.deepEqual(await f.call('GET','/unsubscribe/'+token,{},user),{simulation:false});assert.equal(f.state().leads[0].suppressed,0);await f.call('POST','/unsubscribe/'+token,{},user);assert.equal(f.state().leads[0].suppressed,1);assert.equal(requests(f),0);
});
test('riavvio conserva l’intento incerto; identità diversa e ruoli esterni non accedono',async t=>{
 const f=mailFixture(t);await f.enable();const m=await f.draft();await f.approve(m);const p=await f.preview(m.id);f.control.sendFail=true;await assert.rejects(f.send(p));f.store.run("UPDATE gr_mail_intents SET status='dispatching'");f.store.run("UPDATE gr_messages SET status='sending' WHERE id=?",m.id);
 const next=createGrowthModule({store:f.store,connections:f.connections,googleAuth:f.googleAuth,realMode:true,gmailEnabled:true,externalEnabled:true,origin:'https://os.example',providerOptions:f.providerOptions});assert.equal(next.state('demo-bigant',f.owner).messages[0].status,'uncertain');assert.equal(f.store.one('SELECT status FROM gr_mail_intents').status,'uncertain');
 f.store.run("UPDATE os_google_authorization SET email='altra@fixture.example'");await assert.rejects(f.call('POST','/messages/'+m.id+'/reconcile'),/stessa casella/);
 for(const role of ['client','collaborator'])await assert.rejects(f.call('GET','/messages/'+m.id+'/send-preview',{}, {...f.owner,role}),e=>e.status===403);assert.equal(requests(f),1);
});
