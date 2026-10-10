import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
import { createVault } from '../src/vault.js';

async function fixture(t, { env = { BIGANT_SECRET_KEY: Buffer.alloc(32, 19).toString('base64') } } = {}) {
  const app = createApp({ env, clock: () => new Date('2026-10-10T10:00:00Z') });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  t.after(() => app.close());
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  async function request(path, user, method = 'GET', body) {
    const r = await fetch(origin + path, { method, headers: { Origin: origin, 'Content-Type': 'application/json', ...(user ? { Cookie: user.cookie, 'X-CSRF-Token': user.csrf } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: r.status, body: r.headers.get('content-type')?.includes('json') ? await r.json() : await r.text(), headers: r.headers };
  }
  async function profile(id) {
    const r = await request('/api/demo/login', null, 'POST', { profile: id });
    return { cookie: r.headers.get('set-cookie').split(';')[0], csrf: r.body.csrf };
  }
  const owner = await profile('demo-owner'), team = await profile('demo-collaborator'), client = await profile('demo-client');
  return { ...app, request, owner, team, client };
}

test('menu e home per ruolo, nessuna economia nella home e nessun cliente fuori assegnazione', async t => {
  const f = await fixture(t);
  const owner = (await f.request('/api/overview', f.owner)).body;
  assert.deepEqual(owner.navigation.items.map(item => item[1]), ['Home', 'Clienti', 'Servizi', 'Profili', 'Sciame di agenti', 'Growth', 'Fidelity', 'Vista cliente', 'Accessi', 'Collegamenti', 'Avanzamento', 'Fatturazione']);
  assert.equal(owner.navigation.landing, 'home');
  const home = (await f.request('/api/workspace/home', f.owner)).body;
  assert.equal(home.customers.active, 2); assert.equal(home.growth.newLeads, null);
  assert.ok(!('admin' in home)); assert.ok(!('tasks' in home)); assert.ok(!JSON.stringify(home).includes('balance_cents'));
  const overview = (await f.request('/api/overview', f.team)).body;
  assert.deepEqual(overview.navigation.items.map(item => item[0]), ['home', 'clients', 'agents']);
  const assigned = (await f.request('/api/workspace/home', f.team)).body;
  assert.deepEqual(assigned.clients.map(client => client.id), ['demo-bottega']); assert.ok(!('swarm' in assigned));
  for (const path of ['agents/state', 'sciame/ufficio', 'agency/state', 'workspace/profiles', 'workspace/contracts', 'growth/state', 'fidelity/state', 'users', 'administration/state', 'cliente/dashboard']) {
    assert.equal((await f.request('/api/' + path, f.team)).status, 403, path);
  }
  assert.equal((await f.request('/api/workspace/home', f.client)).status, 403);
  f.store.run("DELETE FROM os_assignments WHERE user_id='demo-collaborator'");
  const empty = await f.request('/api/workspace/home', f.team); assert.equal(empty.status, 200); assert.deepEqual(empty.body.clients, []);
  assert.deepEqual((await f.request('/api/workspace/approvals', f.team)).body.items, []);
});

test('post social approvabili dal collaboratore, prodotti solo dal socio anche sulle rotte dirette', async t => {
  const f = await fixture(t), decision = { decision: 'approved' };
  const campaign = (await f.request('/api/fidelity/campaigns?clientId=demo-bottega', f.owner, 'POST', { name: 'Campagna test', title: 'Titolo', body: 'Messaggio inventato.' })).body;
  await f.request(`/api/fidelity/campaigns/${campaign.id}/prepare?clientId=demo-bottega`, f.owner, 'POST', {});
  const approval = f.store.one("SELECT id FROM os_approvals WHERE kind='fidelity_campaign' AND entity_id=?", campaign.id);
  assert.ok(approval);
  for (const user of [f.team, f.client]) {
    for (const path of [`approvals/${approval.id}`, `fidelity/campaigns/${campaign.id}/decision`]) assert.equal((await f.request(`/api/${path}?clientId=demo-bottega`, user, 'POST', decision)).status, 403);
  }
  const queue = (await f.request('/api/workspace/approvals', f.team)).body.items;
  assert.deepEqual(queue.map(item => item.id), ['approval-demo']);
  assert.deepEqual((await f.request('/api/overview', f.team)).body.approvals.map(item => item.id), ['approval-demo']);
  assert.equal((await f.request('/api/approvals/approval-demo?clientId=demo-bottega', f.client, 'POST', decision)).status, 403);
  assert.equal((await f.request('/api/production/approvals/approval-demo?clientId=demo-bottega', f.client, 'POST', decision)).status, 403);
  f.store.run("UPDATE os_contents SET service='local' WHERE id='content-demo'");
  assert.equal((await f.request('/api/production/approvals/approval-demo?clientId=demo-bottega', f.team, 'POST', decision)).status, 403);
  f.store.run("UPDATE os_contents SET service='social' WHERE id='content-demo'");
  assert.equal((await f.request('/api/approvals/approval-demo?clientId=demo-bottega', f.team, 'POST', decision)).status, 200);
  assert.equal(f.store.one("SELECT decision_by FROM os_approvals WHERE id='approval-demo'").decision_by, 'demo-collaborator');
  assert.equal((await f.request('/api/approvals/approval-demo?clientId=demo-bottega', f.team, 'POST', decision)).status, 409);
  assert.equal((await f.request(`/api/approvals/${approval.id}?clientId=demo-bottega`, f.owner, 'POST', decision)).status, 200);
});

test('nuova attività senza identificativo tecnico; omonimi separati e niente duplicazioni di identità', async t => {
  const f = await fixture(t), body = { name: 'Caffè di prova', industry: 'Bar', services: ['social'] };
  const first = await f.request('/api/clients', f.owner, 'POST', body), second = await f.request('/api/clients', f.owner, 'POST', body);
  assert.equal(first.status, 201); assert.equal(second.status, 201); assert.notEqual(first.body.id, second.body.id);
  const clients = f.store.query('SELECT slug FROM os_clients WHERE id IN (?,?) ORDER BY slug', first.body.id, second.body.id);
  assert.deepEqual(clients.map(client => client.slug), ['caffe-di-prova', 'caffe-di-prova-2']);
  assert.equal((await f.request('/api/clients', f.team, 'POST', body)).status, 403);
});

test('contratti: avviso a 30 giorni inclusi, PDF del proprio cliente e nessun documento per collaboratori', async t => {
  const f = await fixture(t), pdf = Buffer.from('%PDF-1.4\n% Documento sintetico per test\n%%EOF').toString('base64');
  f.store.run("UPDATE os_fin_contracts SET status='inactive'");
  const ids = [];
  for (const endDate of ['2026-10-09', '2026-10-10', '2026-11-09', '2026-11-10']) {
    const r = await f.request('/api/client-record/contracts?clientId=demo-bottega', f.owner, 'POST', { title: 'Test ' + endDate, startDate: '2026-10-01', endDate, renewal: 'Da concordare', pdfBase64: pdf });
    assert.equal(r.status, 201); ids.push(r.body.id);
  }
  const home = (await f.request('/api/workspace/home', f.owner)).body;
  assert.deepEqual(home.expiringContracts.map(row => row.end_date), ['2026-10-10', '2026-11-09']);
  const url = `/api/client-record/contracts/${ids[0]}/pdf?clientId=demo-bottega`;
  const download = await f.request(url, f.client); assert.equal(download.status, 200); assert.match(download.body, /^%PDF-/); assert.match(download.headers.get('content-disposition'), /^attachment/);
  assert.equal((await f.request(url, f.team)).status, 403);
  assert.equal((await f.request(url.replace('demo-bottega', 'demo-studio'), f.client)).status, 403);
  assert.equal((await f.request('/api/client-record/state?clientId=demo-bottega', f.client)).status, 403);
  assert.ok(!('contracts' in (await f.request('/api/client-record/state?clientId=demo-bottega', f.team)).body));
  const docs = (await f.request('/api/cliente/dashboard?clientId=demo-bottega', f.client)).body.sezioni.find(section => section.id === 'documenti');
  assert.equal(docs.contratti.length, 4); assert.deepEqual(docs.fatture, []); assert.ok(!JSON.stringify(docs).includes('amount_cents'));
  const contract = { title: 'Contratto bisestile di prova', startDate: '2028-02-29', endDate: '2028-03-01', renewal: 'Da concordare', pdfBase64: pdf };
  const countBefore = f.store.one('SELECT count(*) n FROM os_client_contract_docs').n;
  for (const startDate of ['2027-02-29', '2028-02-30', '2028-13-01']) {
    const refused = await f.request('/api/client-record/contracts?clientId=demo-bottega', f.owner, 'POST', { ...contract, startDate });
    assert.equal(refused.status, 400);
  }
  assert.equal(f.store.one('SELECT count(*) n FROM os_client_contract_docs').n, countBefore);
  assert.equal((await f.request('/api/client-record/contracts?clientId=demo-bottega', f.owner, 'POST', contract)).status, 201);
});

test('credenziali cifrate e aperte solo dal team assegnato, audit senza segreti e contesto autenticato', async t => {
  const f = await fixture(t), value = { label: 'Portale prova', username: 'test@example.test', password: ' password-fittizia-per-collaudo ', notes: 'nota-riservata-fittizia', url: 'https://example.test' };
  const created = await f.request('/api/client-record/credentials?clientId=demo-bottega', f.team, 'POST', value);
  assert.equal(created.status, 201);
  const id = created.body.id, row = f.store.one('SELECT * FROM os_client_credentials WHERE id=?', id);
  for (const secret of [value.password, value.username, value.notes]) assert.ok(!JSON.stringify(row).includes(secret));
  const path = `/api/client-record/credentials/${id}/reveal?clientId=demo-bottega`;
  assert.equal((await f.request(path, f.client, 'POST', {})).status, 403);
  assert.equal((await f.request(path.replace('demo-bottega', 'demo-studio'), f.team, 'POST', {})).status, 403);
  assert.equal((await f.request(path, f.team, 'POST', {})).body.password, value.password);
  assert.equal((await f.request(path, f.owner, 'POST', {})).body.username, value.username);
  assert.equal(f.store.one("SELECT count(*) n FROM os_audit WHERE action='Credenziali cliente consultate' AND entity_id=?", id).n, 2);
  for (const secret of [value.password, value.username, value.notes]) {
    assert.ok(!JSON.stringify(f.store.query('SELECT * FROM os_audit')).includes(secret));
    assert.ok(!JSON.stringify((await f.request('/api/overview?clientId=demo-bottega', f.owner)).body).includes(secret));
    assert.ok(!JSON.stringify((await f.request('/api/client-record/state?clientId=demo-bottega', f.team)).body).includes(secret));
  }
  f.store.run("DELETE FROM os_assignments WHERE user_id='demo-collaborator'");
  assert.equal((await f.request(path, f.team, 'POST', {})).status, 403);
  const vault = createVault({ BIGANT_SECRET_KEY: Buffer.alloc(32, 19).toString('base64') });
  assert.throws(() => vault.open(row.sealed, 'different-client'), /Impossibile/);
  assert.throws(() => createVault({ BIGANT_SECRET_KEY: Buffer.alloc(32, 20).toString('base64') }).open(row.sealed, `client:demo-bottega:credential:${id}`), /Impossibile/);
});

test('senza chiave nessuna credenziale è accettata; note versionate e conflitti conservano lo storico', async t => {
  const f = await fixture(t, { env: {} });
  assert.equal((await f.request('/api/client-record/credentials?clientId=demo-bottega', f.owner, 'POST', { label: 'Prova', username: 'prova', password: 'segreto-di-prova' })).status, 409);
  assert.equal(f.store.one('SELECT count(*) n FROM os_client_credentials').n, 0);
  const row = f.store.one("SELECT * FROM os_memory WHERE kind='master' AND client_id='demo-bottega'");
  const body = { kind: 'master', content: 'Brief rivisto e inventato.', version: row.version };
  assert.equal((await f.request('/api/client-record/memory?clientId=demo-bottega', f.team, 'POST', body)).status, 200);
  assert.equal((await f.request('/api/client-record/memory?clientId=demo-bottega', f.team, 'POST', body)).status, 409);
  assert.equal(f.store.one("SELECT content FROM os_memory_versions WHERE client_id='demo-bottega' AND kind='master' AND version=?", row.version).content, row.content);
  f.store.run("UPDATE os_memory SET visibility='admin' WHERE client_id='demo-bottega' AND kind='master'");
  assert.equal((await f.request('/api/client-record/memory?clientId=demo-bottega', f.team, 'POST', { ...body, version: row.version + 1 })).status, 403);
});

test('provenienza e qualità della bozza restano legate alla versione approvata', async t => {
  const f = await fixture(t);
  f.production.tagApproval('approval-demo', 'Specialista social · prova', 'approvabile');
  const first = (await f.request('/api/workspace/approvals', f.team)).body.items.find(row => row.id === 'approval-demo');
  assert.equal(first.author, 'Specialista social · prova'); assert.equal(first.quality, 'approvabile');
  assert.throws(() => f.store.run("UPDATE os_approval_origins SET quality='altro' WHERE approval_id='approval-demo'"), /immutabile/);
  const current = f.store.one("SELECT * FROM os_contents WHERE id='content-demo'");
  const edited = await f.request('/api/production/contents/content-demo?clientId=demo-bottega', f.team, 'PATCH', { version: current.version, body: 'Nuovo testo DEMO da verificare.' });
  assert.equal(edited.status, 200);
  const review = await f.request('/api/production/contents/content-demo?clientId=demo-bottega', f.team, 'PATCH', { version: edited.body.version, state: 'DA APPROVARE' });
  assert.equal(review.status, 200);
  const next = (await f.request('/api/workspace/approvals', f.team)).body.items.find(row => row.entity_id === current.id);
  assert.notEqual(next.id, first.id); assert.equal(next.quality, 'Da verificare'); assert.notEqual(next.author, first.author);
});
