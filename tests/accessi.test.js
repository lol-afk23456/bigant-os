import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server.js';
import { seedRealCore, verifyPassword } from '../src/store.js';

const host = 'accessi.bigant.test', origin = `https://${host}`;
// Synthetic accounts and passwords for isolated, in-memory tests only.
const email = 'socio@collaudo.example', initial = 'provvisoria-fixture-001', personal = 'personale-fixture-002';

async function fixture(t) {
  const env = { BIGANT_MODALITA: 'reale', BIGANT_SOCIO_EMAIL: email, BIGANT_SOCIO_PASSWORD_INIZIALE: initial };
  const app = createApp({ origin, env });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  t.after(() => app.close());
  function request(path, { method = 'GET', body, session, csrf = true } = {}) {
    return new Promise((resolve, reject) => {
      const headers = { Host: host, Origin: origin, 'Content-Type': 'application/json' };
      if (session) { headers.Cookie = session.cookie; if (csrf) headers['X-CSRF-Token'] = session.csrf; }
      const req = http.request({ host: '127.0.0.1', port: app.server.address().port, path, method, headers }, res => {
        let raw = ''; res.on('data', chunk => raw += chunk);
        res.on('end', () => { const data = JSON.parse(raw); resolve({ status: res.statusCode, data, cookie: res.headers['set-cookie']?.[0].split(';')[0], csrf: data.csrf }); });
      });
      req.on('error', reject); req.end(body === undefined ? undefined : JSON.stringify(body));
    });
  }
  const login = (password = initial, accountEmail = email) => request('/api/login', { method: 'POST', body: { email: accountEmail, password } });
  const change = (session, currentPassword = initial, newPassword = personal, extra = {}) => request('/api/account/password', {
    method: 'POST', session, body: { currentPassword, newPassword, confirmPassword: newPassword }, ...extra
  });
  return { app, request, login, change };
}

test('FUN-003: password provvisoria blocca tutte le API private, poi rinnova sessione e credenziali', async t => {
  const f = await fixture(t), session = await f.login();
  assert.equal(session.data.user.mustChangePassword, true);
  for (const path of ['/api/overview', '/api/users', '/api/clients', '/api/sciame/ufficio', '/api/fidelity/state']) {
    const blocked = await f.request(path, { session }); assert.equal(blocked.status, 403, path); assert.match(blocked.data.error, /password provvisoria/);
  }
  assert.equal((await f.request('/api/session', { session })).data.user.mustChangePassword, true);
  assert.equal((await f.change(session, initial, personal, { csrf: false })).status, 403);
  assert.equal((await f.change(session, 'password-errata')).status, 400);
  assert.equal((await f.change(session, initial, initial)).status, 400);
  assert.equal((await f.change(session, initial, 'corta')).status, 400);
  assert.equal((await f.change(session, initial, personal, { body: { currentPassword: initial, newPassword: personal, confirmPassword: 'diversa' } })).status, 400);
  assert.equal((await f.request('/api/overview', { session })).status, 403);
  const ready = await f.change(session);
  assert.equal(ready.status, 200); assert.equal(ready.data.user.mustChangePassword, false);
  assert.notEqual(ready.cookie, session.cookie); assert.notEqual(ready.csrf, session.csrf);
  assert.equal((await f.request('/api/overview', { session: ready })).status, 200);
  assert.equal((await f.request('/api/overview', { session })).status, 401);
  assert.equal((await f.login(initial)).status, 401); assert.equal((await f.login(personal)).status, 200);
  const account = f.app.store.one('SELECT * FROM os_users WHERE email=?', email);
  assert.ok(verifyPassword(personal, account.password_hash));
  const audit = JSON.stringify(f.app.store.query('SELECT * FROM os_audit'));
  for (const value of [initial, personal, account.password_hash]) assert.ok(!audit.includes(value));
});

test('FUN-003: cliente e collaboratore senza assegnazioni cambiano password prima di accedere ai dati', async t => {
  const f = await fixture(t), owner = await f.change(await f.login());
  for (const role of ['client', 'collaborator']) {
    const accountEmail = role + '@collaudo.example';
    const created = await f.request('/api/users', { method: 'POST', session: owner, body: { name: 'Persona di collaudo', email: accountEmail, role, password: initial, clientId: 'demo-bigant', clientIds: [] } });
    assert.equal(created.status, 201);
    const pending = await f.login(initial, accountEmail);
    assert.equal(pending.data.user.mustChangePassword, true);
    assert.equal((await f.request('/api/clients', { session: pending })).status, 403);
    const ready = await f.change(pending);
    assert.equal(ready.status, 200); assert.equal(ready.data.user.mustChangePassword, false);
    assert.equal((await f.request('/api/users', { session: ready })).status, 403);
    const overview = await f.request('/api/overview', { session: ready });
    assert.equal(overview.status, role === 'client' ? 200 : 403);
    if (role === 'client') assert.equal(overview.data.admin, null);
  }
});

test('FUN-003: reset del socio revoca ogni sessione e richiede di nuovo la password personale', async t => {
  const f = await fixture(t), owner = await f.change(await f.login());
  const accountEmail = 'secondo@collaudo.example';
  const created = await f.request('/api/users', { method: 'POST', session: owner, body: { name: 'Secondo socio', email: accountEmail, role: 'owner', password: initial } });
  const first = await f.change(await f.login(initial, accountEmail));
  const second = await f.login(personal, accountEmail);
  const resetPassword = 'nuova-provvisoria-fixture-003';
  assert.equal((await f.request('/api/users/' + created.data.id, { method: 'PATCH', session: owner, body: { password: resetPassword } })).status, 200);
  for (const session of [first, second]) assert.equal((await f.request('/api/overview', { session })).status, 401);
  const reset = await f.login(resetPassword, accountEmail);
  assert.equal(reset.data.user.mustChangePassword, true);
  assert.equal((await f.request('/api/overview', { session: reset })).status, 403);
  const changed = await f.change(reset, resetPassword, 'seconda-personale-fixture-004');
  assert.equal((await f.request('/api/overview', { session: changed })).status, 200);
});

test('FUN-003: migrazione del socio iniziale e riavvio non ripristinano password già cambiate', async t => {
  const f = await fixture(t);
  f.app.store.run('UPDATE os_users SET must_change_password=0 WHERE email=?', email);
  seedRealCore(f.app.store, { socioEmail: email, socioPassword: initial });
  assert.equal(f.app.store.one('SELECT must_change_password n FROM os_users WHERE email=?', email).n, 1);
  const ready = await f.change(await f.login());
  seedRealCore(f.app.store, { socioEmail: email, socioPassword: initial });
  assert.equal((await f.request('/api/session', { session: ready })).data.user.mustChangePassword, false);
  assert.equal((await f.login(personal)).status, 200);
});

test('FUN-003: logout disponibile anche prima del cambio password', async t => {
  const f = await fixture(t), session = await f.login();
  assert.equal((await f.request('/api/logout', { method: 'POST', session })).status, 200);
  assert.equal((await f.change(session)).status, 401);
});
