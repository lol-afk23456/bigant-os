import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readdir, writeFile, symlink, stat } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, basename, dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../server.js';
import { createBackup, rotateBackups, technicalPaths } from '../scripts/backup.js';
import { restoreBackup } from '../scripts/restore.js';
import { createBackupScheduler } from '../src/backups.js';

async function fixture(t) {
  // An isolated temporary volume outside the repository, never production data.
  const directory = await mkdtemp(resolve(realpathSync(tmpdir()), 'bigant-volume-test-'));
  const env = { BIGANT_MODALITA: 'reale', DATA_DIR: directory, BIGANT_SOCIO_EMAIL: 'socio@backup.example', BIGANT_SOCIO_PASSWORD_INIZIALE: 'iniziale-fixture-backup-01' };
  const sourcePath = resolve(directory, 'bigant-os.sqlite');
  const app = createApp({ database: sourcePath, origin: 'https://backup.example', env });
  t.after(async () => { await app.close(); await rm(directory, { recursive: true, force: true }); });
  return { directory, env, sourcePath, app };
}

test('Fase 0: volume reale esterno, backup coerente, rotazione e ripristino in archivio nuovo', async t => {
  const f = await fixture(t);
  f.app.store.setSetting('fixture_value', 'prima');
  const snapshots = [];
  for (let i = 0; i < 3; i++) snapshots.push(await createBackup({ env: f.env }));
  const last = snapshots.at(-1);
  assert.equal(dirname(last.path), resolve(f.directory, 'backups'));
  assert.equal((await stat(last.path)).mode & 0o777, 0o600);
  const unrelated = resolve(f.directory, 'backups', 'copia-manuale.sqlite');
  await writeFile(unrelated, 'file da conservare');
  const rotated = await rotateBackups({ env: f.env, keep: 2 });
  assert.equal(rotated.removed.length, 1);
  assert.ok((await readdir(dirname(last.path))).includes(basename(last.path)));
  assert.ok((await readdir(dirname(last.path))).includes(basename(unrelated)));
  f.app.store.setSetting('fixture_value', 'dopo');
  const restored = await restoreBackup({ backupPath: last.path, env: f.env });
  assert.notEqual(restored.path, f.sourcePath);
  const db = new DatabaseSync(restored.path, { readOnly: true });
  try {
    assert.equal(db.prepare("SELECT value FROM os_settings WHERE key='fixture_value'").get().value, 'prima');
    assert.equal(db.prepare("SELECT must_change_password FROM os_users WHERE email='socio@backup.example'").get().must_change_password, 1);
    assert.equal(db.prepare('SELECT count(*) n FROM os_sessions').get().n, 0);
  } finally { db.close(); }
  assert.equal(f.app.store.getSetting('fixture_value'), 'dopo');
  await assert.rejects(restoreBackup({ backupPath: last.path, targetDirectory: f.directory, env: f.env }));
});

test('Fase 0: /data/backups è il default reale; percorsi estranei, root e link sono rifiutati', async t => {
  assert.equal((await technicalPaths(undefined, { BIGANT_MODALITA: 'reale' })).backupDirectory, '/data/backups');
  const f = await fixture(t);
  await assert.rejects(technicalPaths(undefined, { BIGANT_MODALITA: 'reale', DATA_DIR: '/' }));
  await assert.rejects(technicalPaths(undefined, { BIGANT_MODALITA: 'reale', DATA_DIR: 'relativo' }));
  await assert.rejects(createBackup({ sourcePath: f.sourcePath }));
  await assert.rejects(createBackup({ env: f.env, sourcePath: resolve(f.directory, '../estraneo.sqlite') }));
  await assert.rejects(createBackup({ env: f.env, destinationPath: f.sourcePath }));
  const saved = await createBackup({ env: f.env });
  const linked = resolve(f.directory, 'link.sqlite');
  await symlink(f.sourcePath, linked);
  await assert.rejects(createBackup({ env: f.env, sourcePath: linked }), /simbolici/);
  const oldLink = resolve(dirname(saved.path), 'bigant-os-2000-01-01T00-00-00-000Z-00000000-0000-0000-0000-000000000000.sqlite');
  await symlink(f.sourcePath, oldLink);
  await assert.rejects(rotateBackups({ env: f.env, keep: 1 }), /simbolici/);
  assert.ok(await stat(f.sourcePath));
});

test('Fase 0: scheduler una copia ogni 24 ore, persistente al riavvio e senza sovrapposizioni', async t => {
  const f = await fixture(t);
  let time = new Date('2026-10-10T09:00:00Z');
  const options = { store: f.app.store, sourcePath: f.sourcePath, env: f.env, clock: () => time };
  const first = createBackupScheduler(options);
  await Promise.all([first.tick(), first.tick()]);
  assert.equal((await readdir(resolve(f.directory, 'backups'))).length, 1);
  assert.equal(first.status().lastSuccess, time.toISOString());
  assert.equal(first.status().error, null);
  await first.close();
  const restarted = createBackupScheduler(options);
  t.after(() => restarted.close());
  await restarted.tick();
  assert.equal((await readdir(resolve(f.directory, 'backups'))).length, 1);
  time = new Date('2026-10-11T09:00:00Z');
  await Promise.all([restarted.tick(), restarted.tick()]);
  assert.equal((await readdir(resolve(f.directory, 'backups'))).length, 2);
  assert.equal(restarted.status().lastSuccess, time.toISOString());
  await restarted.close();
});

test('Fase 0: fallimento visibile senza dati riservati, nuovo tentativo e arresto attendono il lavoro', async t => {
  const f = await fixture(t);
  let fail = true, release;
  const scheduler = createBackupScheduler({ store: f.app.store, sourcePath: f.sourcePath, env: f.env,
    snapshot: () => { if (fail) throw Error('errore-riservato-non-da-esporre'); return new Promise(resolve => { release = resolve; }); }, rotate: async () => ({ removed: [] }) });
  await scheduler.tick();
  assert.match(scheduler.status().error, /non completata/);
  assert.ok(!JSON.stringify(scheduler.status()).includes('errore-riservato'));
  assert.equal(scheduler.status().lastSuccess, null);
  fail = false;
  const pending = scheduler.tick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(scheduler.status().running, true);
  let closed = false;
  const closing = scheduler.close().then(() => { closed = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(closed, false);
  release(); await pending; await closing;
  assert.equal(scheduler.status().error, null);
  assert.ok(scheduler.status().lastSuccess);
});
