import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
import { directorPriorities } from '../src/swarm-priorities.js';

function fixture(t) {
  const app = createApp({ env: {}, motore: 'demo' }); t.after(() => app.close());
  const s = app.store, owner = s.one("SELECT * FROM os_users WHERE id='demo-owner'");
  let calls = 0; t.mock.method(globalThis, 'fetch', () => { calls++; throw Error('Rete vietata nella prova'); });
  t.after(() => assert.equal(calls, 0));
  async function core() {
    const job = app.orchestrator.enqueue(owner, 'demo-bigant', 'director');
    await app.orchestrator.tick('demo-bigant');
    assert.equal(s.one('SELECT status FROM os_jobs WHERE id=?', job.id).status, 'done');
    return s.one('SELECT * FROM os_agent_outputs WHERE job_id=?', job.id);
  }
  async function sciame() {
    const giro = app.sciame.creaGiro(owner, { richiesta: 'Priorità inventate DEMO', flussi: ['crescita'] });
    await app.sciame.eseguiGiro(giro.id);
    return s.one("SELECT * FROM os_sciame_passi WHERE giro_id=? AND agente='direttore-crescita'", giro.id);
  }
  return { ...app, s, owner, core, sciame, read: () => directorPriorities(s, owner) };
}

test('FUN-019: le priorità leggono risultati registrati, senza generazione, scritture o dati grezzi', async t => {
  const f = fixture(t);
  assert.deepEqual(f.read(), { clientId: 'demo-bigant', current: null });
  const out = await f.core(), before = f.s.one('SELECT total_changes() n').n;
  const { current } = f.read();
  assert.equal(current.kind, 'procedure'); assert.equal(current.id, out.id); assert.equal(current.version, 1);
  assert.equal(current.available, true); assert.equal(current.items.length, 3); assert.equal(current.approvalStatus, 'pending');
  assert.match(current.mode, /DEMO/); assert.equal(current.updatedAt, out.updated_at);
  assert.equal(f.s.one('SELECT total_changes() n').n, before);
  for (const key of ['source_snapshot', 'input', 'payload', 'metrics', 'password_hash']) assert.equal(Object.hasOwn(current, key), false);
});

test('FUN-019: una revisione del Direttore mostra il testo corrente, mai le priorità vecchie del payload', async t => {
  const f = fixture(t), out = await f.core();
  const body = 'Nuova priorità manuale DEMO: verificare il piano dei servizi.';
  await f.orchestrator.handle({ user: f.owner, clientId: 'demo-bigant', method: 'POST', path: `/outputs/${out.id}/revise`, body: { version: 1, title: 'Priorità riviste DEMO', body } });
  const current = f.read().current;
  assert.equal(current.version, 2); assert.equal(current.body, body); assert.deepEqual(current.items, []);
  assert.equal(current.title, 'Priorità riviste DEMO'); assert.equal(current.approvalStatus, 'pending');
  assert.match(current.notice, /revisionato/);
  const approval = f.s.one("SELECT * FROM os_approvals WHERE entity_id=? AND kind='agent_output' AND version=2", out.id);
  // The old decision cannot make the new text appear approved.
  f.s.run("UPDATE os_approvals SET status='approved' WHERE entity_id=? AND version=1", out.id);
  assert.equal(f.read().current.approvalStatus, 'pending');
  f.s.run("UPDATE os_approvals SET body='Testo diverso' WHERE id=?", approval.id);
  assert.equal(f.read().current.approvalStatus, 'needs_review');
});

test('FUN-019: priorità dello Sciame, stato simulato e isolamento dalle proposte dei clienti', async t => {
  const f = fixture(t), out = await f.core();
  f.s.run("UPDATE os_agent_outputs SET updated_at='2026-01-01T00:00:00.000Z' WHERE id=?", out.id);
  const step = await f.sciame(), current = f.read().current;
  assert.equal(current.kind, 'sciame'); assert.equal(current.id, step.id); assert.equal(current.items.length, 3);
  assert.equal(current.available, true); assert.equal(current.approvalStatus, 'simulated');
  assert.equal(current.decisionBy, 'Passaggio interno DEMO'); assert.match(current.mode, /DEMO/);
  f.s.run("UPDATE os_sciame_passi SET client_id='demo-bottega',created_at='2099-01-01T00:00:00.000Z' WHERE id=?", step.id);
  assert.equal(f.read().current.id, out.id);
  f.s.run("UPDATE os_agent_outputs SET client_id='demo-bottega' WHERE id=?", out.id);
  assert.equal(f.read().current, null);
});

test('FUN-019: ultimo risultato incompleto o fermato non ripiega silenziosamente su priorità vecchie', async t => {
  const f = fixture(t), out = await f.core();
  f.s.run("UPDATE os_agent_outputs SET updated_at='2026-01-01T00:00:00.000Z' WHERE id=?", out.id);
  const step = await f.sciame();
  f.s.run("UPDATE os_sciame_passi SET stato='bloccato_qualita',esito_qualita='bloccato' WHERE id=?", step.id);
  let current = f.read().current;
  assert.equal(current.id, step.id); assert.equal(current.available, false); assert.deepEqual(current.items, []);
  assert.equal(current.body, ''); assert.match(current.notice, /Qualità/);
  f.s.run("UPDATE os_sciame_passi SET stato='completato',esito_qualita='approvabile',output_json='non JSON' WHERE id=?", step.id);
  current = f.read().current; assert.equal(current.available, false); assert.deepEqual(current.items, []);
  f.s.run("UPDATE os_sciame_passi SET output_json=? WHERE id=?", JSON.stringify({ sintesi: 'Output incompleto DEMO', priorita: [{ titolo: 'Manca il motivo' }] }), step.id);
  assert.equal(f.read().current.available, false);
});

test('FUN-019: soci soltanto, anche dopo revoca della sessione o disattivazione dell’agenzia', t => {
  const f = fixture(t);
  for (const id of ['demo-client', 'demo-collaborator']) assert.throws(() => directorPriorities(f.s, f.s.one('SELECT * FROM os_users WHERE id=?', id)), e => e.status === 403);
  f.s.run("UPDATE os_users SET role='collaborator' WHERE id='demo-owner'");
  assert.throws(f.read, e => e.status === 403);
  f.s.run("UPDATE os_users SET role='owner',active=0 WHERE id='demo-owner'");
  assert.throws(f.read, e => e.status === 403);
  f.s.run("UPDATE os_users SET active=1 WHERE id='demo-owner'");
  f.s.run("UPDATE os_clients SET active=0 WHERE id='demo-bigant'");
  assert.throws(f.read, e => e.status === 403);
});

test('FUN-019 HTTP: endpoint protetto e ambito agenzia indipendente dal cliente selezionato', async t => {
  const f = fixture(t); await f.core();
  const handler = f.server.listeners('request')[0], origin = 'http://127.0.0.1:4330';
  async function request(method, path, body, cookie) {
    const req = { method, url: path, headers: { host: '127.0.0.1:4330', origin, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, socket: { remoteAddress: '127.0.0.1' }, async *[Symbol.asyncIterator]() { if (body !== undefined) yield Buffer.from(JSON.stringify(body)); } };
    const res = { headersSent: false, status: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, writeHead(status, h) { this.status = status; this.headersSent = true; for (const [k, v] of Object.entries(h || {})) this.setHeader(k, v); }, end(body) { this.body = body ? JSON.parse(String(body)) : null; } };
    await handler(req, res); return res;
  }
  assert.equal((await request('GET', '/api/workspace/priorities')).status, 401);
  for (const profile of ['demo-owner', 'demo-collaborator', 'demo-client']) {
    const login = await request('POST', '/api/demo/login', { profile }), cookie = login.headers['set-cookie'].split(';')[0];
    const result = await request('GET', '/api/workspace/priorities?clientId=demo-bottega', undefined, cookie);
    assert.equal(result.status, profile === 'demo-owner' ? 200 : 403);
    if (profile === 'demo-owner') { assert.equal(result.body.clientId, 'demo-bigant'); assert.equal(result.body.current.items.length, 3); }
  }
});
