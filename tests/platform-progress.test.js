import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';
import { createPlatformProgress } from '../src/platform-progress.js';

const readAt = '2026-10-10T12:00:00.000Z';
function fixture(t, { realMode = false, env = {} } = {}) {
  const app = createApp({ env, clock: () => new Date(readAt) }); t.after(() => app.close());
  t.mock.method(globalThis, 'fetch', () => { throw Error('Rete vietata alla consultazione'); });
  t.mock.method(app.connections, 'readForRuntime', () => { throw Error('Vault vietato alla consultazione'); });
  const s = app.store, owner = s.one("SELECT * FROM os_users WHERE id='demo-owner'");
  let backup = { enabled: false };
  const read = createPlatformProgress({ ...app, realMode, clock: () => new Date(readAt), backup: () => backup });
  function snapshot() {
    const before = s.one('SELECT total_changes() n').n, result = read(owner);
    assert.equal(s.one('SELECT total_changes() n').n, before, 'consultazione senza scritture');
    return result;
  }
  return { ...app, s, owner, read, snapshot, backup: value => { backup = value; } };
}
const row = (result, id) => result.items.find(item => item.id === id);

test('Avanzamento DEMO: capacità e nove fondamenta senza false attivazioni, dati cliente o segreti', t => {
  const f = fixture(t), result = f.snapshot();
  assert.equal(result.readAt, readAt); assert.match(result.environment, /DEMO/);
  assert.equal(result.items.length, 17); assert.equal(result.foundations.length, 9);
  for (const item of [...result.items, ...result.foundations]) {
    assert.ok(['Prova', 'Da collegare'].includes(item.status));
    assert.ok(item.name && item.summary && item.source && Array.isArray(item.available) && Array.isArray(item.missing));
    assert.deepEqual(Object.keys(item).sort(), ['id','name','status','summary','available','missing','route','source','evidenceAt','evidenceLabel'].sort());
  }
  assert.match(result.foundations.find(x => x.id === 'credentials').available.join(' '), /cifrat/);
  assert.match(result.foundations.find(x => x.id === 'credentials').missing.join(' '), /Chiave/);
  assert.equal(row(result, 'google-auth').status, 'Da collegare');
  assert.match(row(result, 'billing').missing.join(' '), /Trello/);
  assert.doesNotMatch(JSON.stringify(result), /password_hash|sealed|apiKey|demo-bottega|demo-studio|@|socio-demo|total_cents/);
});

test('Avanzamento: funzioni interne e cifratura reali non promuovono canali, invii o agenti', t => {
  const f = fixture(t, { realMode: true, env: { BIGANT_SECRET_KEY: Buffer.alloc(32, 9).toString('base64') } });
  const result = f.snapshot();
  for (const id of ['access','clients','services','approvals','vault']) assert.equal(row(result, id).status, 'Funziona', id);
  for (const id of ['profiles','google-auth','calendar','google-wallet']) assert.equal(row(result, id).status, 'Da collegare', id);
  for (const id of ['agents','fidelity','billing']) assert.equal(row(result, id).status, 'Prova', id);
  assert.match(row(result, 'approvals').missing.join(' '), /Pubblicazione.*disabilitata/);
  assert.doesNotMatch(result.foundations.find(x => x.id === 'credentials').missing.join(' '), /Chiave di cifratura del server da configurare/);
});

test('Avanzamento backup: errore, vecchia copia, data futura o invalida non risultano Funziona', t => {
  const f = fixture(t, { realMode: true });
  for (const [backup, status] of [
    [{ enabled: false }, 'Da collegare'],
    [{ enabled: true }, 'Prova'],
    [{ enabled: true, lastSuccess: '2026-10-09T09:59:59.999Z' }, 'Prova'],
    [{ enabled: true, lastSuccess: '2026-10-09T10:00:00.000Z' }, 'Funziona'],
    [{ enabled: true, lastSuccess: '2026-10-10T11:00:00.000Z' }, 'Funziona'],
    [{ enabled: true, lastSuccess: '2026-10-10T12:00:00.001Z' }, 'Prova'],
    [{ enabled: true, lastSuccess: 'data inventata' }, 'Prova'],
    [{ enabled: true, lastSuccess: '2026-10-10T11:00:00.000Z', error: 'errore inventato' }, 'Prova']
  ]) {
    f.backup(backup); const item = row(f.snapshot(), 'backup'); assert.equal(item.status, status, JSON.stringify(backup));
    assert.match(item.missing.join(' '), /ripristino/); assert.match(item.missing.join(' '), /perdita del volume/);
    assert.equal(item.evidenceAt, Number.isFinite(Date.parse(backup.lastSuccess || '')) ? backup.lastSuccess : null);
  }
});

test('Avanzamento: autorizzazione Google richiede anche custodia, senza estendersi agli altri prodotti', t => {
  const f = fixture(t, { realMode: true });
  let vaultReady = true, connected = true;
  t.mock.method(f.connections, 'state', () => ({ vaultReady, items: [{ id: 'google', authorization: { connected, email: 'non-esporre@fixture.example', lastCheck: '2026-10-09T12:00:00.000Z' } }] }));
  let result = f.snapshot(); assert.equal(row(result, 'google-auth').status, 'Funziona');
  assert.equal(row(result, 'google-auth').evidenceAt, '2026-10-09T12:00:00.000Z');
  for (const id of ['profiles','calendar']) assert.equal(row(result, id).status, 'Da collegare');
  vaultReady = false; result = f.snapshot(); assert.equal(row(result, 'google-auth').status, 'Da collegare'); assert.match(row(result, 'google-auth').summary, /custodia/);
  vaultReady = true; connected = false; assert.equal(row(f.snapshot(), 'google-auth').status, 'Da collegare');
  assert.doesNotMatch(JSON.stringify(result), /non-esporre/);
});

test('Avanzamento: fasi Growth e conteggio Wallet descrivono soltanto la capacità autorizzata', t => {
  const f = fixture(t, { realMode: true }); let paused = false, simulation = false, enabled = true;
  const phase = () => ({ enabled, checked: true, lastCheck: '2026-10-09T12:00:00.000Z' });
  t.mock.method(f.growth, 'progress', () => ({ paused, simulation, research: phase(), analysis: phase(), drafts: phase(), gmail: phase() }));
  t.mock.method(f.fidelity, 'progress', () => ({ googleWallet: { enabledCount: 1, checkedCount: 2, lastCheck: '2026-10-09T12:00:00.000Z' } }));
  let result = f.snapshot();
  for (const id of ['research','analysis','drafts','gmail']) assert.equal(row(result, 'growth-' + id).status, 'Funziona');
  assert.match(row(result, 'growth-gmail').missing.join(' '), /manuale.*approvazione/);
  assert.equal(row(result, 'google-wallet').status, 'Funziona'); assert.match(row(result, 'google-wallet').summary, /1 attività abilitate; 2/);
  assert.equal(row(result, 'fidelity').status, 'Prova');
  paused = true; result = f.snapshot(); assert.equal(row(result, 'growth-gmail').status, 'Prova'); assert.match(row(result, 'growth-gmail').missing.join(' '), /pausa/);
  paused = false; simulation = true; assert.equal(row(f.snapshot(), 'growth-gmail').status, 'Prova');
  simulation = false; enabled = false; assert.equal(row(f.snapshot(), 'growth-gmail').status, 'Prova');
});

test('Avanzamento: identità riletta, soci attivi soltanto e password provvisoria negata', t => {
  const f = fixture(t);
  for (const id of ['demo-client','demo-collaborator','non-esiste']) assert.throws(() => f.read({ id, role: 'owner', active: 1 }), e => e.status === 403);
  for (const change of ["role='collaborator'", "role='owner',active=0", "active=1,must_change_password=1"]) {
    f.s.run('UPDATE os_users SET ' + change + " WHERE id='demo-owner'"); assert.throws(f.snapshot, e => e.status === 403);
  }
});

test('Avanzamento HTTP: sessione e ruolo richiesti, stato globale indipendente dal cliente selezionato', async t => {
  const f = fixture(t), handler = f.server.listeners('request')[0], origin = 'http://127.0.0.1:4330';
  async function request(method, path, body, cookie) {
    const req = { method, url: path, headers: { host: '127.0.0.1:4330', origin, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, socket: { remoteAddress: '127.0.0.1' }, async *[Symbol.asyncIterator]() { if (body !== undefined) yield Buffer.from(JSON.stringify(body)); } };
    const res = { headersSent: false, status: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, writeHead(status, h) { this.status = status; this.headersSent = true; for (const [k, v] of Object.entries(h || {})) this.setHeader(k, v); }, end(body) { this.body = body ? JSON.parse(String(body)) : null; } };
    await handler(req, res); return res;
  }
  assert.equal((await request('GET', '/api/workspace/progress')).status, 401);
  for (const profile of ['demo-owner','demo-collaborator','demo-client']) {
    const login = await request('POST', '/api/demo/login', { profile }), cookie = login.headers['set-cookie'].split(';')[0];
    const before = f.s.one('SELECT total_changes() n').n;
    const result = await request('GET', '/api/workspace/progress', undefined, cookie);
    assert.equal(result.status, profile === 'demo-owner' ? 200 : 403);
    if (profile === 'demo-owner') {
      const selected = await request('GET', '/api/workspace/progress?clientId=demo-bottega', undefined, cookie);
      assert.deepEqual(selected.body, result.body); assert.equal(result.headers['cache-control'], 'no-store');
      assert.equal(f.s.one('SELECT total_changes() n').n, before);
      f.s.run("UPDATE os_users SET active=0 WHERE id='demo-owner'");
      assert.equal((await request('GET', '/api/workspace/progress', undefined, cookie)).status, 401);
    }
  }
});
