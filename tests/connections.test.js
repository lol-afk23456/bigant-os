import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
import { createConnections } from '../src/connections.js';
import { createVault } from '../src/vault.js';

const env = { BIGANT_SECRET_KEY: Buffer.alloc(32, 22).toString('base64') };

test('chiavi cifrate, risposte e registro privi di segreti; nessuna attivazione dopo salvataggio o controllo', t => {
  const app = createApp({ env }); t.after(() => app.close());
  const user = app.store.one("SELECT * FROM os_users WHERE id='demo-owner'");
  const secret = 'chiave-sintetica-da-non-esporre', body = { version: 0, fields: { apiKey: secret, model: 'modello-test' } };
  const saved = app.connections.save(user, 'openai', body);
  assert.equal(saved.configured, true); assert.equal(saved.status, 'Da collegare'); assert.equal(saved.version, 1);
  const row = app.store.one("SELECT * FROM os_connections WHERE id='openai'"); assert.ok(!row.sealed.includes(secret));
  assert.equal(createVault(env).open(row.sealed, 'connection:openai').apiKey, secret);
  assert.throws(() => createVault(env).open(row.sealed, 'connection:anthropic'), /Impossibile/);
  assert.throws(() => app.connections.save(user, 'openai', body), /Configurazione cambiata/);
  app.connections.save(user, 'openai', { version: 1, fields: { model: 'modello-test-2' } });
  const updated = app.store.one("SELECT * FROM os_connections WHERE id='openai'");
  assert.equal(createVault(env).open(updated.sealed, 'connection:openai').apiKey, secret);
  assert.notEqual(updated.sealed, row.sealed);
  const checked = app.connections.check(user, 'openai');
  assert.equal(checked.status, 'Da collegare'); assert.ok(checked.lastCheck); assert.match(checked.checkNote, /locale/);
  const state = JSON.stringify(app.connections.state(user)); assert.ok(!state.includes(secret)); assert.ok(!state.includes(updated.sealed));
  assert.ok(!JSON.stringify(app.store.query('SELECT * FROM os_audit')).includes(secret));
  assert.equal(app.connections.summary().connected, 0);
  assert.equal(app.store.one('SELECT count(*) n FROM os_costs').n, 0);
});

test('chiave assente o cambiata, campi errati e accesso altrui non aprono la custodia', t => {
  const app = createApp({ env }); t.after(() => app.close());
  const user = app.store.one("SELECT * FROM os_users WHERE id='demo-owner'");
  const body = { version: 0, fields: { apiKey: 'chiave-sintetica' } };
  for (const id of ['demo-client', 'demo-collaborator']) {
    const denied = app.store.one('SELECT * FROM os_users WHERE id=?', id);
    assert.throws(() => app.connections.state(denied), /riservata/);
    assert.throws(() => app.connections.save(denied, 'brave', body), /riservata/);
    assert.throws(() => app.connections.check(denied, 'brave'), /riservata/);
  }
  assert.throws(() => app.connections.save(user, 'brave', { ...body, fields: { extra: 'non-ammesso' } }), /Campi/);
  const missing = createConnections({ store: app.store, env: {} });
  assert.throws(() => missing.save(user, 'brave', body), /Archivio protetto/);
  app.connections.save(user, 'brave', body);
  const changed = createConnections({ store: app.store, env: { BIGANT_SECRET_KEY: Buffer.alloc(32, 23).toString('base64') } });
  assert.equal(changed.check(user, 'brave').status, 'Errore'); assert.equal(changed.summary().errors, 1);
  assert.throws(() => changed.save(user, 'brave', { ...body, version: 1 }), /Impossibile/);
  assert.equal(app.connections.check(user, 'brave').status, 'Da collegare'); assert.equal(app.connections.summary().errors, 0);
});

test('API Collegamenti protegge segreti, versione e controllo con sessione owner e CSRF', async t => {
  const app = createApp({ env }); await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve)); t.after(() => app.close());
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  for (const profile of ['demo-owner', 'demo-collaborator', 'demo-client']) {
    const login = await fetch(origin + '/api/demo/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ profile }) });
    const session = await login.json(), headers = { Origin: origin, Cookie: login.headers.get('set-cookie').split(';')[0], 'X-CSRF-Token': session.csrf, 'Content-Type': 'application/json' };
    const state = await fetch(origin + '/api/connections', { headers }); assert.equal(state.status, profile === 'demo-owner' ? 200 : 403);
    const body = JSON.stringify({ version: 0, fields: { apiKey: 'segreto-finto-http' } });
    const result = await fetch(origin + '/api/connections/brave', { method: 'POST', headers, body }); assert.equal(result.status, profile === 'demo-owner' ? 200 : 403);
    assert.ok(!(await result.text()).includes('segreto-finto-http'));
    const check = await fetch(origin + '/api/connections/brave/check', { method: 'POST', headers, body: '{}' }); assert.equal(check.status, profile === 'demo-owner' ? 200 : 403);
    const csrf = await fetch(origin + '/api/connections/brave/check', { method: 'POST', headers: { ...headers, 'X-CSRF-Token': '' }, body: '{}' }); assert.equal(csrf.status, 403);
  }
});
