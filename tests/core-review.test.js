import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
import { uid, now, openStore, seedCore } from '../src/store.js';
import { createProduction } from '../src/production.js';
import { createGrowthModule } from '../src/growth.js';
import { createOrchestrator } from '../src/orchestrator.js';

async function fixture(t, profile = 'demo-owner') {
  const app = createApp();
  t.after(() => app.close());
  const origin = 'http://127.0.0.1:4330';
  // Exercise the actual HTTP handler without opening sockets or making any network request.
  const handler = app.server.listeners('request')[0];
  async function invoke(method, path, body, headers) {
    const outHeaders = {}, chunks = [];
    const req = { method, url: path, headers: Object.fromEntries(Object.entries({ Host: '127.0.0.1:4330', ...headers }).map(([k, v]) => [k.toLowerCase(), v])), socket: { remoteAddress: '127.0.0.1' }, async *[Symbol.asyncIterator]() { if (body !== undefined) yield Buffer.from(JSON.stringify(body)); } };
    const res = { headersSent: false, statusCode: 200, setHeader(k, v) { outHeaders[k.toLowerCase()] = v; }, writeHead(status, values) { this.statusCode = status; this.headersSent = true; for (const [k, v] of Object.entries(values ?? {})) this.setHeader(k, v); }, end(chunk) { if (chunk !== undefined) chunks.push(Buffer.from(chunk)); } };
    await handler(req, res);
    const raw = Buffer.concat(chunks).toString('utf8');
    return { status: res.statusCode, data: String(outHeaders['content-type'] ?? '').includes('json') ? JSON.parse(raw) : raw, headers: outHeaders };
  }
  const response = await invoke('POST', '/api/demo/login', { profile }, { Origin: origin, 'Content-Type': 'application/json' });
  const login = response.data, cookie = response.headers['set-cookie'].split(';')[0];
  async function request(method, path, body, { auth = true, csrf = true, suppliedOrigin = origin } = {}) {
    const headers = { Origin: suppliedOrigin };
    if (auth) headers.Cookie = cookie;
    if (csrf) headers['X-CSRF-Token'] = login.csrf;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    return invoke(method, path, body, headers);
  }
  return { app, request, origin, user: app.store.one('SELECT * FROM os_users WHERE id=?', profile) };
}

async function draftGrowth(app, user) {
  const call = async (method, path, body = {}) => (await app.growth.handle({ method, path, body, user, clientId: 'demo-bigant' })).data;
  const lead = app.growth.state('demo-bigant', user).leads[0];
  await call('PATCH', `/leads/${lead.id}`, { consent: 'marketing', consent_proof: 'Autorizzazione fittizia DEMO' });
  await call('POST', '/settings', { paused: false });
  await call('POST', '/jobs', { type: 'draft', leadId: lead.id });
  await call('POST', '/jobs/run');
  const message = app.growth.state('demo-bigant', user).messages.find(x => x.direction === 'out');
  return { call, message, approval: app.store.one("SELECT * FROM os_approvals WHERE kind='growth_message' AND entity_id=? ORDER BY version DESC", message.id) };
}

test('Review HTTP: accessi cliente, dati amministrativi e protezioni Origin/CSRF', async t => {
  const { request } = await fixture(t, 'demo-client');
  assert.equal((await request('GET', '/api/overview?clientId=demo-studio')).status, 403);
  assert.equal((await request('GET', '/api/administration/state')).status, 403);
  assert.equal((await request('GET', '/api/agents/state')).status, 403);
  assert.equal((await request('POST', '/api/logout', {}, { csrf: false })).status, 403);
  assert.equal((await request('POST', '/api/logout', {}, { suppliedOrigin: 'https://outside.example' })).status, 403);
});

test('Review HTTP: approvazione Growth passa dalla coda comune e rifiuta una versione vecchia', async t => {
  const { app, request, user } = await fixture(t), { call, message, approval } = await draftGrowth(app, user);
  await call('PATCH', `/messages/${message.id}`, { body: message.body + '\nRevisione DEMO.', status: 'draft' });
  assert.equal((await request('POST', `/api/approvals/${approval.id}?clientId=demo-bigant`, { decision: 'approved' })).status, 409);
  const current = app.store.one("SELECT * FROM os_approvals WHERE kind='growth_message' AND entity_id=? ORDER BY version DESC", message.id);
  const response = await request('POST', `/api/approvals/${current.id}?clientId=demo-bigant`, { decision: 'approved' });
  assert.equal(response.status, 200, JSON.stringify(response.data));
  assert.equal(app.store.one('SELECT status FROM gr_messages WHERE id=?', message.id).status, 'approved');
});

test('Review HTTP: contenuti e approvazioni di un servizio rimosso non compaiono al cliente', async t => {
  const { app, request } = await fixture(t, 'demo-client');
  app.store.run("UPDATE os_clients SET services_json='[\"fidelity\"]' WHERE id='demo-bottega'");
  const overview = await request('GET', '/api/overview');
  assert.equal(overview.status, 200); assert.equal(overview.data.contents.length, 0); assert.equal(overview.data.approvals.length, 0);
  const state = await request('GET', '/api/production/state'); assert.equal(state.status, 403);
  assert.equal((await request('POST', '/api/approvals/approval-demo', { decision: 'approved' })).status, 403);
});

test('Review HTTP: le password create con spazi restano utilizzabili senza trasformazione al login', async t => {
  const { request } = await fixture(t);
  const password = '  Password DEMO lunga 2026  ';
  const created = await request('POST', '/api/users', { name: 'Utente Spazi DEMO', email: 'spaces@test.example', role: 'collaborator', password });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const login = await request('POST', '/api/login', { email: 'spaces@test.example', password }, { auth: false });
  assert.equal(login.status, 200, 'La password deve essere confrontata byte per byte come salvata, senza trim.');
});

test('Review: una modifica nella memoria interna non pubblica automaticamente sul report cliente', t => {
  const store = openStore(); seedCore(store); t.after(() => store.close());
  const production = createProduction({ store }), collaborator = store.one("SELECT * FROM os_users WHERE id='demo-collaborator'");
  store.run('INSERT INTO os_memory VALUES(?,?,?,?,?,?,?,?)', uid(), 'demo-bottega', 'report', 'Report precedente approvato DEMO', 'client', 1, 'Fixture DEMO', now());
  production.saveMemory(collaborator, 'demo-bottega', 'report', 'Nuova bozza interna DEMO ancora da approvare');
  const visible = store.query("SELECT content FROM os_memory WHERE client_id='demo-bottega' AND visibility='client'");
  assert.ok(!visible.some(x => x.content.includes('Nuova bozza interna')), 'Una revisione manuale deve tornare interna o passare da un’approvazione, non ereditare visibility=client.');
});

test('Review: budget Growth non può abbassare il tetto comune sotto i costi già impegnati', async t => {
  const { app, request } = await fixture(t);
  app.store.run('INSERT INTO os_costs VALUES(?,?,?,?,?,?,?)', uid(), 'demo-bigant', 'review-demo', 1000, 'charged', now().slice(0, 7), now());
  const result = await request('POST', '/api/growth/settings?clientId=demo-bigant', { totalBudget: 100, hostingBudget: 0, emailBudget: 0, reserveBudget: 0 });
  assert.equal(result.status, 409, 'La stessa protezione del budget orchestratore deve valere passando da Growth.');
  assert.equal(app.store.getSetting('budget_cents'), '5000');
});

test('Review: il link appuntamenti nella bozza Growth punta a una route esistente', async t => {
  const { app, request, user } = await fixture(t), { message } = await draftGrowth(app, user);
  const match = message.body.match(/Scegli un appuntamento:\s*(https?:\/\/[^\s]+)/); assert.ok(match);
  const link = new URL(match[1]), response = await request('GET', link.pathname, undefined, { auth: false });
  assert.equal(response.status, 200, `Link pubblico appuntamento non raggiungibile: ${link.pathname}`);
});

test('Review: i due moduli condividono il mese contabile Europe/Rome anche alla mezzanotte del primo giorno', t => {
  const moment = new Date('2026-09-30T22:30:00Z');
  t.mock.timers.enable({ apis: ['Date'], now: moment });
  const store = openStore(); seedCore(store); t.after(() => store.close());
  const growth = createGrowthModule({ store }); growth.seed();
  const production = createProduction({ store }), orchestrator = createOrchestrator({ store, production, administration: {}, clock: () => new Date() });
  const reservation = growth.store.reserve('demo-bigant', 'review', 100, 'Costo fittizio DEMO');
  assert.ok(reservation);
  assert.equal(orchestrator.budget().month, '2026-10');
  assert.equal(orchestrator.budget().usedCents, 100, 'Una prenotazione Growth deve essere conteggiata nello stesso mese del budget comune.');
});
