import test from 'node:test';
import assert from 'node:assert/strict';
import { openStore, seedCore } from '../src/store.js';
import { createGrowthModule } from '../src/growth.js';
import { uid, now } from '../src/growth-store.js';

function setup(t) {
  const db = openStore(); seedCore(db); const growth = createGrowthModule({ store: db }); growth.seed();
  t.after(() => db.close());
  const owner = db.one('SELECT * FROM os_users WHERE id=?', 'demo-owner');
  const call = async (method, path, body = {}, user = owner, clientId = 'demo-bigant') => (await growth.handle({ method, path, body, user, clientId }))?.data;
  const state = () => growth.state('demo-bigant', owner);
  const first = () => state().leads[0];
  async function job(type, extra = {}) { await call('POST', '/jobs', { type, ...extra }); await call('POST', '/settings', { paused: false }); return call('POST', '/jobs/run'); }
  async function draft(leadId = first().id) { await job('draft', { leadId }); return state().messages.find(m => m.lead_id === leadId && m.direction === 'out'); }
  async function approve(message) { await call('PATCH', `/leads/${message.lead_id}`, { consent: 'marketing', consent_proof: 'Prova inventata e marcata DEMO' }); await call('PATCH', `/messages/${message.id}`, { status: 'approved', reason: 'Approvazione DEMO del socio' }); }
  async function send(message) { await approve(message); return call('POST', `/simulate/messages/${message.id}/send`); }
  return { db, growth, owner, call, state, first, job, draft, approve, send };
}

test('Growth usa la connessione centrale, fixture idempotenti e audit comune', t => {
  const c = setup(t); c.growth.seed();
  assert.equal(c.state().leads.length, 2);
  assert.equal(c.growth.store.db, c.db.db);
  assert.ok(c.db.one("SELECT 1 FROM os_audit WHERE action='Azienda aggiunta'"));
  assert.equal(c.db.one("SELECT name FROM sqlite_master WHERE name='users'"), undefined);
  assert.equal(c.state().connections.google, false);
});

test('Clienti e collaboratori non accedono al CRM Growth neppure tramite API diretta', async t => {
  const c = setup(t);
  for (const id of ['demo-client', 'demo-collaborator']) {
    const user = c.db.one('SELECT * FROM os_users WHERE id=?', id);
    assert.throws(() => c.growth.state('demo-bigant', user), e => e.status === 403);
    await assert.rejects(c.call('POST', '/leads', { company: 'DEMO' }, user), e => e.status === 403);
  }
});

test('Deduplica dominio/email e validazione di nome, email e importo', async t => {
  const c = setup(t), lead = c.first();
  await assert.rejects(c.call('POST', '/leads', { company: 'Duplicato DEMO', website: lead.website }), e => e.status === 409);
  await assert.rejects(c.call('POST', '/leads', { company: '' }), /nome/);
  await assert.rejects(c.call('POST', '/leads', { company: 'DEMO', email: 'real@company.it' }), /example/);
  await assert.rejects(c.call('PATCH', `/leads/${lead.id}`, { value: 10.5 }), /Importo/);
  await c.call('PATCH', `/leads/${lead.id}`, { value: 45000, stage: 'proposal' });
  assert.equal(c.first().value, 45000);
});

test('Consenso richiede prova e il cambio email lo revoca', async t => {
  const c = setup(t), lead = c.first();
  await assert.rejects(c.call('PATCH', `/leads/${lead.id}`, { consent: 'marketing' }), /prova/);
  await c.call('PATCH', `/leads/${lead.id}`, { consent: 'marketing', consent_proof: 'DEMO' });
  await c.call('PATCH', `/leads/${lead.id}`, { email: 'nuovo@attivita.example' });
  assert.equal(c.first().consent, 'none');
  assert.equal(c.first().consent_proof, '');
});

test('Ricerca, qualificazione e costi zero funzionano senza fetch o account', async t => {
  const c = setup(t), oldFetch = globalThis.fetch;
  globalThis.fetch = () => { throw Error('Rete vietata nel test'); };
  t.after(() => { globalThis.fetch = oldFetch; });
  const result = await c.job('research', { query: 'aziende di prova' });
  assert.equal(result.job.status, 'done');
  assert.equal(c.state().leads.length, 7);
  await c.call('POST', '/jobs/run');
  const qualified = c.state().leads.filter(l => l.stage === 'qualified');
  assert.equal(qualified.length, 1);
  assert.match(qualified[0].analysis, /DEMO/);
  assert.equal(c.state().budget.used, 0);
  assert.ok(c.db.one("SELECT 1 FROM os_costs WHERE agent LIKE 'growth:%' AND cents=0"));
});

test('Pausa, job fallito e retry esplicito restano verificabili', async t => {
  const c = setup(t);
  const lead = await c.call('POST', '/leads', { company: 'Senza sito DEMO' });
  const job = await c.call('POST', '/jobs', { type: 'analyze', leadId: lead.id });
  await assert.rejects(c.call('POST', '/jobs/run'), /pausa/);
  await c.call('POST', '/settings', { paused: false });
  const failed = await c.call('POST', '/jobs/run');
  assert.equal(failed.job.status, 'failed');
  assert.match(failed.job.error, /sito/);
  await c.call('POST', `/jobs/${job.id}/retry`);
  assert.equal(c.state().jobs.find(j => j.id === job.id).status, 'queued');
});

test('Una bozza genera approvazione centrale; consenso e socio sono necessari', async t => {
  const c = setup(t), message = await c.draft();
  assert.equal(message.status, 'draft');
  assert.ok(c.db.one("SELECT * FROM os_approvals WHERE kind='growth_message' AND entity_id=? AND status='pending'", message.id));
  await assert.rejects(c.call('POST', `/simulate/messages/${message.id}/send`), /approvazione/);
  await assert.rejects(c.call('PATCH', `/messages/${message.id}`, { status: 'approved' }), /Autorizzazione/);
  await c.approve(message);
  assert.equal(c.db.one("SELECT * FROM os_approvals WHERE entity_id=?", message.id).decision_by, c.owner.id);
});

test('Modificare una bozza approvata invalida la vecchia versione', async t => {
  const c = setup(t), message = await c.draft(); await c.approve(message);
  await c.call('PATCH', `/messages/${message.id}`, { body: 'Testo rivisto · DEMO' });
  const approvals = c.db.query('SELECT * FROM os_approvals WHERE entity_id=? ORDER BY version', message.id);
  assert.deepEqual(approvals.map(a => a.status), ['superseded', 'pending']);
  await assert.rejects(c.call('POST', `/simulate/messages/${message.id}/send`), /approvazione/);
});

test('Invio simulato idempotente e mai presentato come email reale', async t => {
  const c = setup(t), message = await c.draft();
  const result = await c.send(message);
  assert.equal(result.externalDelivery, false);
  assert.equal(c.state().messages[0].status, 'simulated_sent');
  assert.equal(c.state().messages[0].externalDelivery, false);
  await assert.rejects(c.call('POST', `/simulate/messages/${message.id}/send`), /approvato/);
  assert.equal(c.db.one('SELECT COUNT(*) n FROM gr_demo_mail').n, 1);
});

test('Una richiesta consente risposta pertinente ma non promozione iniziale', async t => {
  const c = setup(t), message = await c.draft();
  await c.call('PATCH', `/leads/${message.lead_id}`, { consent: 'request', consent_proof: 'Richiesta DEMO' });
  await assert.rejects(c.call('PATCH', `/messages/${message.id}`, { status: 'approved' }), /risposta pertinente/);
});

test('Risposta DEMO correlata ferma i followup ed è deduplicata', async t => {
  const c = setup(t), message = await c.draft(); await c.send(message);
  c.growth.store.run('INSERT INTO messages(id,workspace,lead_id,direction,subject,body,status,kind,created) VALUES(?,?,?,?,?,?,?,?,?)', uid(), 'demo-bigant', message.lead_id, 'out', 'Followup DEMO', 'Promemoria DEMO', 'draft', 'followup', now());
  await c.call('POST', '/simulate/incoming', { leadId: message.lead_id, body: 'Mi interessa un confronto, grazie · DEMO' });
  assert.equal(c.state().messages.find(m => m.kind === 'followup').status, 'cancelled');
  assert.equal(c.state().messages.filter(m => m.direction === 'in').length, 1);
  await c.growth.engine.handlers.sync('demo-bigant');
  assert.equal(c.state().messages.filter(m => m.direction === 'in').length, 1);
  const incoming = c.state().messages.find(m => m.direction === 'in');
  await c.job('draft', { leadId: message.lead_id, kind: 'reply', incomingId: incoming.id });
  const sent = c.state().messages.find(m => m.id === message.id);
  const reply = c.state().messages.find(m => m.kind === 'reply' && m.status === 'draft');
  assert.equal(reply.thread_id, sent.thread_id);
  assert.equal(reply.reply_to, `<${incoming.provider_id}@growth.example>`);
});

test('Rifiuto ricevuto esclude il contatto e impedisce ulteriori messaggi', async t => {
  const c = setup(t), message = await c.draft(); await c.send(message);
  await c.call('POST', '/simulate/incoming', { leadId: message.lead_id, body: 'Non siamo interessati, non contattateci più.' });
  const lead = c.state().leads.find(l => l.id === message.lead_id);
  assert.equal(lead.suppressed, 1);
  assert.ok(c.growth.store.one('SELECT 1 FROM suppressions WHERE workspace=? AND email=?', 'demo-bigant', lead.email));
});

test('Prezzi non documentati passano al titolare senza nuova bozza', async t => {
  const c = setup(t), message = await c.draft(); await c.send(message);
  await c.call('POST', '/simulate/incoming', { leadId: message.lead_id, body: 'Che prezzo proponete? DEMO' });
  const incoming = c.state().messages.find(m => m.direction === 'in');
  await c.job('draft', { leadId: message.lead_id, kind: 'reply', incomingId: incoming.id });
  assert.equal(c.state().messages.find(m => m.id === incoming.id).status, 'needs_owner');
});

test('Prenotazione locale, conflitto, token monouso e annullamento funzionano', async t => {
  const c = setup(t), lead = c.first();
  const invitation = await c.call('POST', '/booking-link', { leadId: lead.id });
  const availability = await c.call('GET', `/public/book/${invitation.token}`);
  assert.ok(availability.slots.length);
  const result = await c.call('POST', `/public/book/${invitation.token}`, { start: availability.slots[0] });
  assert.equal(result.externalInvitation, false);
  assert.equal(c.state().meetings[0].status, 'simulated_booked');
  await assert.rejects(c.call('POST', `/public/book/${invitation.token}`, { start: availability.slots[1] }), /utilizzato/);
  const second = await c.call('POST', '/booking-link', { leadId: lead.id });
  await assert.rejects(c.call('POST', `/public/book/${second.token}`, { start: availability.slots[0] }), /occupato/);
  await c.call('POST', `/meetings/${result.id}/cancel`);
  assert.equal(c.state().meetings[0].status, 'cancelled');
});

test('Un token non consente attraversare le attività', async t => {
  const c = setup(t), invitation = await c.call('POST', '/booking-link', { leadId: c.first().id });
  await assert.rejects(c.call('GET', `/public/book/${invitation.token}`, {}, c.owner, 'demo-bottega'), e => e.status === 404);
});

test('Ripartenza e riconciliazione non duplicano messaggi incerti', async t => {
  const c = setup(t), message = await c.draft(); await c.send(message);
  c.growth.store.run("UPDATE messages SET status='sending' WHERE id=?", message.id);
  c.growth.engine.recover();
  assert.equal(c.state().messages[0].status, 'uncertain');
  await c.job('reconcile', { messageId: message.id });
  assert.equal(c.state().messages[0].status, 'simulated_sent');
  assert.equal(c.db.one('SELECT COUNT(*) n FROM gr_demo_mail').n, 1);
});

test('Prenotazione con esito incerto viene riconciliata e non rifatta', async t => {
  const c = setup(t), invitation = await c.call('POST', '/booking-link', { leadId: c.first().id });
  const slots = await c.call('GET', `/public/book/${invitation.token}`);
  const actualBook = c.growth.providers.book;
  c.growth.providers.book = async (...args) => { await actualBook(...args); throw Error('Interruzione DEMO dopo salvataggio'); };
  await assert.rejects(c.call('POST', `/public/book/${invitation.token}`, { start: slots.slots[0] }), e => e.status === 503);
  const meeting = c.state().meetings[0]; assert.equal(meeting.status, 'uncertain');
  await c.job('reconcileMeeting', { meetingId: meeting.id });
  assert.equal(c.state().meetings[0].status, 'simulated_booked');
  assert.equal(c.db.one('SELECT COUNT(*) n FROM gr_demo_calendar').n, 1);
});

test('Import parziale, esportazione protetta da formule e massimo 200 righe', async t => {
  const c = setup(t);
  const result = await c.call('POST', '/import', { rows: [{ company: '=SUM(1,2) DEMO', email: 'csv@fixture.example' }, { company: 'Reale vietato', email: 'utente@azienda.it' }] });
  assert.equal(result.added, 1); assert.equal(result.errors.length, 1);
  const csv = await c.call('GET', '/export'); assert.match(csv, /'=SUM/);
  await assert.rejects(c.call('POST', '/import', { rows: Array(201).fill({ company: 'DEMO' }) }), /200/);
});

test('Il modulo analisi distingue richiesta, marketing e disiscrizione', async t => {
  const c = setup(t);
  await c.call('POST', '/settings', { publicFormEnabled: true, privacyUrl: 'https://privacy.example/' });
  const before = c.state().leads.length;
  await c.call('POST', '/public/inquiry', { fax: 'bot' }); assert.equal(c.state().leads.length, before);
  const result = await c.call('POST', '/public/inquiry', { company: 'Ingresso DEMO', email: 'ingresso@contatti.example', request: 'Mi interessa il sito DEMO', privacyAcknowledged: true });
  const lead = c.state().leads.find(l => l.id === result.leadId); assert.equal(lead.consent, 'request');
  const token = c.growth.engine.token('demo-bigant', lead.id, 'unsubscribe');
  await c.call('POST', `/unsubscribe/${token}`);
  assert.equal(c.state().leads.find(l => l.id === lead.id).suppressed, 1);
});

test('Conversione del lead crea una sola anagrafica OS con provenienza', async t => {
  const c = setup(t), lead = c.first(), before = c.db.one('SELECT COUNT(*) n FROM os_clients').n;
  const first = await c.call('POST', `/leads/${lead.id}/convert`);
  const second = await c.call('POST', `/leads/${lead.id}/convert`);
  assert.equal(first.client.id, second.client.id); assert.equal(second.alreadyConverted, true);
  assert.equal(c.db.one('SELECT COUNT(*) n FROM os_clients').n, before + 1);
  assert.equal(c.state().leads.find(l => l.id === lead.id).client_id, first.client.id);
  assert.match(c.db.one('SELECT provenance FROM gr_conversions WHERE lead_id=?', lead.id).provenance, /simulation/);
});

test('Budget globale blocca il giro e i collegamenti esterni sono sempre disabilitati', async t => {
  const c = setup(t);
  c.db.run('INSERT INTO os_costs VALUES(?,?,?,?,?,?,?)', uid(), 'demo-bigant', 'altro-agente', 1600, 'charged', now().slice(0, 7), now());
  const job = await c.job('research'); assert.equal(job.job.status, 'failed'); assert.match(job.job.error, /Budget globale/);
  for (const path of ['/secrets', '/google/start', '/google/disconnect', '/auth/google/callback']) await assert.rejects(c.call('POST', path), e => e.status === 409);
  await assert.rejects(c.call('POST', '/settings', { autoSend: true }), /disabilitati/);
});

test('Richieste concorrenti conservano il socio corretto nel registro comune', async t => {
  const c = setup(t), leads = c.state().leads;
  c.db.run('INSERT INTO os_users(id,name,email,role,created_at) VALUES(?,?,?,?,?)', 'demo-owner-second', 'Secondo socio DEMO', 'secondo@bigant.example', 'owner', now());
  const second = c.db.one('SELECT * FROM os_users WHERE id=?', 'demo-owner-second');
  await c.call('POST', '/jobs', { type: 'draft', leadId: leads[0].id });
  await c.call('POST', '/jobs', { type: 'draft', leadId: leads[1].id });
  await c.call('POST', '/settings', { paused: false });
  await Promise.all([c.call('POST', '/jobs/run'), c.call('POST', '/jobs/run', {}, second)]);
  const events = c.db.query("SELECT user_id,entity_id FROM os_audit WHERE action='Bozza preparata'");
  assert.equal(events.length, 2);
  assert.equal(events.find(e => e.entity_id === leads[0].id).user_id, c.owner.id);
  assert.equal(events.find(e => e.entity_id === leads[1].id).user_id, second.id);
});

test('Il motore pianifica bozze di followup ma non le approva da solo', async t => {
  const c = setup(t), message = await c.draft(); await c.send(message);
  c.growth.store.run('UPDATE messages SET sent=? WHERE id=?', new Date(Date.now() - 10 * 86400000).toISOString(), message.id);
  await c.call('POST', '/settings', { autoDraft: true, followupDays: 5, maxFollowups: 1 });
  await c.growth.engine.tick();
  const followup = c.state().messages.find(m => m.kind === 'followup');
  assert.equal(followup.status, 'draft');
  assert.ok(c.db.one("SELECT id FROM os_approvals WHERE entity_id=? AND status='pending'", followup.id));
});

test('I token scaduti e le prenotazioni fuori orario sono rifiutati', async t => {
  const c = setup(t), invitation = await c.call('POST', '/booking-link', { leadId: c.first().id });
  await assert.rejects(c.call('POST', `/public/book/${invitation.token}`, { start: new Date().toISOString() }), /Orario/);
  c.growth.store.run('UPDATE tokens SET expires=? WHERE id=?', Date.now() - 1000, invitation.token);
  await assert.rejects(c.call('GET', `/public/book/${invitation.token}`), e => e.status === 410);
});
