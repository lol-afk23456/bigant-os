import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createApp } from '../server.js';
import { createServicePlan } from '../src/service-plan.js';

test('piano persistente: fonte iniziale, scadenze valide, conflitto e nessuna attivazione implicita', t => {
  const app = createApp({ env: {} }); t.after(() => app.close());
  const user = app.store.one("SELECT * FROM os_users WHERE id='demo-owner'");
  const original = app.servicePlan.state(user), social = original.items.find(row => row.id === 'S01');
  assert.equal(social.plan.status, 'Attivo'); assert.equal(social.plan.target_date, null);
  assert.match(social.source, /S01/); assert.ok(original.items.some(row => row.id === 'events'));
  assert.ok(social.agents.every(row => row.status === 'Base'));
  const body = { version: 0, status: 'In preparazione', missing: 'Validare SOP e pilota', targetDate: '2027-02-28' };
  for (const date of ['2027-02-29', '2026-13-01', 'domani']) assert.throws(() => app.servicePlan.save(user, 'S01', { ...body, targetDate: date }), /Data obiettivo/);
  const saved = app.servicePlan.save(user, 'S01', body);
  assert.equal(saved.plan.version, 1); assert.equal(saved.plan.target_date, body.targetDate);
  assert.throws(() => app.servicePlan.save(user, 'S01', body), /piano è cambiato/);
  const reopened = createServicePlan({ store: app.store, agentConfig: app.agentConfig });
  assert.equal(reopened.state(user).items.find(row => row.id === 'S01').plan.missing, body.missing);
  assert.equal(app.store.one('SELECT count(*) n FROM os_jobs').n, 0);
  assert.ok(app.agentConfig.state(user).items.every(row => row.operationalStatus === 'Base'));
});

test('listino con centesimi esatti e ripetizione idempotente; ruoli non autorizzati rifiutati', t => {
  const app = createApp({ env: {} }); t.after(() => app.close());
  const user = app.store.one("SELECT * FROM os_users WHERE id='demo-owner'");
  const body = { requestId: randomUUID(), name: '100 penne di prova', priceCents: 12999, unit: 'pacchetto', notes: 'Campione da validare', service: 'S16', effectiveDate: '2026-10-10' };
  assert.equal(app.servicePlan.addPrice(user, body).price_cents, 12999);
  assert.equal(app.servicePlan.addPrice(user, body).id, body.requestId);
  assert.equal(app.servicePlan.state(user).prices.length, 1);
  assert.throws(() => app.servicePlan.addPrice(user, { ...body, priceCents: 1 }), /altri dati/);
  for (const priceCents of [0.1, NaN, -1, '12999', 100000001]) assert.throws(() => app.servicePlan.addPrice(user, { ...body, requestId: randomUUID(), priceCents }), /Prezzo/);
  for (const id of ['demo-collaborator', 'demo-client']) {
    const other = app.store.one('SELECT * FROM os_users WHERE id=?', id);
    assert.throws(() => app.servicePlan.state(other), /riservata/);
    assert.throws(() => app.servicePlan.save(other, 'S01', {}), /riservata/);
    assert.throws(() => app.servicePlan.addPrice(other, body), /riservata/);
  }
});

test('API del piano e del listino protette per ogni ruolo', async t => {
  const app = createApp({ env: {} }); await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve)); t.after(() => app.close());
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  for (const profile of ['demo-owner', 'demo-collaborator', 'demo-client']) {
    const login = await fetch(origin + '/api/demo/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ profile }) });
    const session = await login.json(), headers = { Origin: origin, Cookie: login.headers.get('set-cookie').split(';')[0], 'X-CSRF-Token': session.csrf, 'Content-Type': 'application/json' };
    const r = await fetch(origin + '/api/service-plan', { headers }); assert.equal(r.status, profile === 'demo-owner' ? 200 : 403);
    if (profile === 'demo-owner') { assert.ok((await r.json()).items.length >= 19); continue; }
    for (const [path, method] of [['S01', 'PATCH'], ['prices', 'POST']]) {
      const denied = await fetch(origin + '/api/service-plan/' + path, { headers, method, body: '{}' }); assert.equal(denied.status, 403);
    }
  }
});
