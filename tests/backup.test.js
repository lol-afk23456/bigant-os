import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdir, mkdtemp, rm, readFile, writeFile, stat, symlink, link, readdir, copyFile } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createApp } from '../server.js';
import { createBackup, PROJECT_ROOT, validateDatabase } from '../scripts/backup.js';
import { restoreBackup } from '../scripts/restore.js';

const run = promisify(execFile);
const hash = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const rows = (db, table) => db.prepare(`SELECT * FROM "${table}"`).all().map(row => JSON.stringify(row)).sort();
const dump = (db, { sessions = true } = {}) => Object.fromEntries(db.prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").all().filter(row => sessions || row.name !== 'os_sessions').map(row => [row.name, rows(db, row.name)]));

async function fixture(t) {
  const cache = resolve(PROJECT_ROOT, '.cache');
  await mkdir(cache, { recursive: true, mode: 0o700 });
  const fixtureRoot = await mkdtemp(resolve(cache, 'backup-tests-'));
  const sourcePath = resolve(fixtureRoot, 'bigant-os.sqlite');
  const app = createApp({ database: sourcePath });
  t.after(async () => { await app.close(); await rm(fixtureRoot, { recursive: true, force: true }); });
  const owner = app.store.one('SELECT * FROM os_users WHERE id=?', 'demo-owner');
  const body = { type: 'credit', amount: 3, idempotencyKey: 'backup-credit-DEMO-0001' };
  const credited = (await app.fidelity.handle({ method: 'POST', path: '/members/fi-demo-member/transactions', body, user: owner, clientId: 'demo-bottega' })).data;
  await app.fidelity.handle({ method: 'PATCH', path: `/public/cards/${credited.member.publicToken}/consent`, body: { marketingConsent: false }, user: null });
  app.store.run('INSERT INTO os_sessions VALUES(?,?,?,?)', 'SESSION-FIXTURE-DEMO', 'demo-owner', 'CSRF-FIXTURE-DEMO', Date.now() + 60000);
  return { app, fixtureRoot, sourcePath, owner, body, credited, backup: extra => createBackup({ sourcePath, fixtureRoot, ...extra }), restore: (backupPath, extra) => restoreBackup({ backupPath, fixtureRoot, ...extra }) };
}

test('Backup coerente con WAL attivo: include tutti i moduli, saldi, revoca consenso e sessioni senza modificare la fonte', async t => {
  const f = await fixture(t);
  assert.ok((await stat(f.sourcePath + '-wal')).size > 0);
  const before = dump(f.app.store.db), sourceHash = await hash(f.sourcePath), walHash = await hash(f.sourcePath + '-wal');
  const result = await f.backup();
  assert.equal(dirname(result.path), resolve(f.fixtureRoot, 'backups'));
  assert.match(basename(result.path), /^bigant-os-[\dT-]+Z-[a-f0-9-]+\.sqlite$/);
  assert.equal((await stat(result.path)).mode & 0o777, 0o600);
  const backup = new DatabaseSync(result.path, { readOnly: true });
  try {
    assert.equal(validateDatabase(backup).schemaVersion, 1);
    assert.deepEqual(dump(backup), before);
    assert.equal(backup.prepare("SELECT balance FROM fi_members WHERE id='fi-demo-member'").get().balance, 7);
    assert.equal(backup.prepare("SELECT marketing_consent FROM fi_members WHERE id='fi-demo-member'").get().marketing_consent, 0);
    assert.equal(backup.prepare("SELECT COUNT(*) n FROM fi_consents WHERE member_id='fi-demo-member'").get().n, 2);
    assert.equal(backup.prepare('SELECT COUNT(*) n FROM os_sessions').get().n, 1);
  } finally { backup.close(); }
  assert.deepEqual(dump(f.app.store.db), before);
  assert.equal(await hash(f.sourcePath), sourceHash);
  assert.equal(await hash(f.sourcePath + '-wal'), walHash);
  assert.deepEqual(await readdir(dirname(result.path)), [basename(result.path)]);
});

test('Ripristino isolato conserva tutti i dati, saldi contabili e idempotenza; elimina soltanto le sessioni nella copia', async t => {
  const f = await fixture(t), before = dump(f.app.store.db, { sessions: false });
  const financial = f.app.administration.state('demo-bigant', f.owner).accounts.map(a => ({ id: a.id, balance: a.balance_cents }));
  const saved = await f.backup(), backupHash = await hash(saved.path);
  // New work after the backup must remain in the active database, not in the restore.
  f.app.store.run("UPDATE os_clients SET name='Nuova attività DEMO dopo il backup' WHERE id='demo-studio'");
  const sourceAfter = dump(f.app.store.db), sourceHash = await hash(f.sourcePath), walHash = await hash(f.sourcePath + '-wal');
  const restored = await f.restore(saved.path);
  assert.equal(dirname(restored.directory), f.fixtureRoot);
  assert.match(basename(restored.directory), /^restored-/);
  assert.equal(restored.removedSessions, 1);
  assert.equal((await stat(restored.directory)).mode & 0o777, 0o700);
  assert.equal((await stat(restored.path)).mode & 0o777, 0o600);
  const db = new DatabaseSync(restored.path);
  try {
    assert.deepEqual(dump(db, { sessions: false }), before);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM os_sessions').get().n, 0);
    assert.throws(() => db.exec('UPDATE os_fin_movements SET amount_cents=1'), /immutabile/);
    assert.throws(() => db.exec('DELETE FROM os_fin_movements'), /cancellazioni/);
  } finally { db.close(); }
  assert.equal(await hash(saved.path), backupHash);
  assert.equal(await hash(f.sourcePath), sourceHash);
  assert.equal(await hash(f.sourcePath + '-wal'), walHash);
  assert.deepEqual(dump(f.app.store.db), sourceAfter);
  const restoredApp = createApp({ database: restored.path });
  try {
    const restoredOwner = restoredApp.store.one('SELECT * FROM os_users WHERE id=?', 'demo-owner');
    assert.deepEqual(restoredApp.administration.state('demo-bigant', restoredOwner).accounts.map(a => ({ id: a.id, balance: a.balance_cents })), financial);
    const retry = (await restoredApp.fidelity.handle({ method: 'POST', path: '/members/fi-demo-member/transactions', body: f.body, user: restoredOwner, clientId: 'demo-bottega' })).data;
    assert.deepEqual(retry, f.credited);
    assert.equal(restoredApp.store.one("SELECT balance FROM fi_members WHERE id='fi-demo-member'").balance, 7);
    assert.equal(restoredApp.store.one("SELECT marketing_consent FROM fi_members WHERE id='fi-demo-member'").marketing_consent, 0);
  } finally { await restoredApp.close(); }
});

test('Nomi univoci anche per due backup contemporanei e nessuna sovrascrittura di copie o destinazioni', async t => {
  const f = await fixture(t), snapshots = await Promise.all([f.backup(), f.backup()]);
  assert.notEqual(snapshots[0].path, snapshots[1].path);
  const backupHash = await hash(snapshots[0].path);
  await assert.rejects(f.backup({ destinationPath: snapshots[0].path }), /esiste già/);
  assert.equal(await hash(snapshots[0].path), backupHash);
  const targetDirectory = resolve(f.fixtureRoot, 'restored-prova'), restored = await f.restore(snapshots[0].path, { targetDirectory });
  const restoredHash = await hash(restored.path);
  await assert.rejects(f.restore(snapshots[1].path, { targetDirectory }), /esiste già/);
  assert.equal(await hash(restored.path), restoredHash);
  assert.equal(f.app.store.one('SELECT COUNT(*) n FROM os_sessions').n, 1);
});

test('Percorsi esterni, traversal, file attivo come destinazione e cartelle di ripristino arbitrarie sono rifiutati', async t => {
  const f = await fixture(t), saved = await f.backup();
  await assert.rejects(f.backup({ sourcePath: '/outside-project.sqlite' }), /fuori dalla cartella tecnica/);
  await assert.rejects(f.backup({ sourcePath: resolve(f.fixtureRoot, '../../../outside.sqlite') }), /fuori dalla cartella tecnica/);
  await assert.rejects(f.backup({ destinationPath: f.sourcePath }), /fuori dalla cartella tecnica/);
  await assert.rejects(f.backup({ destinationPath: resolve(f.fixtureRoot, 'backups/../../escape.sqlite') }), /fuori dalla cartella tecnica/);
  await assert.rejects(createBackup({ fixtureRoot: PROJECT_ROOT }), /Fixture consentite/);
  await assert.rejects(f.restore(f.sourcePath), /fuori dalla cartella tecnica/);
  await assert.rejects(f.restore(saved.path, { targetDirectory: resolve(f.fixtureRoot, 'active') }), /restored/);
  await assert.rejects(f.restore(saved.path, { targetDirectory: '/outside-project/restored-copy' }), /fuori dalla cartella tecnica/);
  assert.equal(f.app.store.one('SELECT COUNT(*) n FROM os_sessions').n, 1);
});

test('Link simbolici in file e cartelle e hard link non aggirano il confine tecnico', async t => {
  const f = await fixture(t), saved = await f.backup();
  const sourceLink = resolve(f.fixtureRoot, 'source-link.sqlite');
  await symlink(f.sourcePath, sourceLink);
  await assert.rejects(f.backup({ sourcePath: sourceLink }), /simbolici/);
  const hardLinkedSource = resolve(f.fixtureRoot, 'hardlink.sqlite');
  await link(f.sourcePath, hardLinkedSource);
  await assert.rejects(f.backup({ sourcePath: hardLinkedSource }), /collegamenti aggiuntivi/);
  const directoryLink = resolve(f.fixtureRoot, 'backups/linked');
  await symlink(resolve(f.fixtureRoot, 'backups'), directoryLink);
  await assert.rejects(f.backup({ sourcePath: saved.path, destinationPath: resolve(directoryLink, 'copy.sqlite') }), /simbolici/);
  await assert.rejects(f.restore(resolve(directoryLink, basename(saved.path))), /simbolici/);
  const restoredLink = resolve(f.fixtureRoot, 'restored-linked');
  await symlink(f.fixtureRoot, restoredLink);
  await assert.rejects(f.restore(saved.path, { targetDirectory: restoredLink }), /simbolici/);
  const outputLink = resolve(f.fixtureRoot, 'backups/destination.sqlite');
  await symlink(f.sourcePath, outputLink);
  await assert.rejects(f.backup({ sourcePath: saved.path, destinationPath: outputLink }), /simbolici/);
});

test('Copie corrotte, schema incompleto o futuro e relazioni invalide sono rifiutati senza alterare la fonte', async t => {
  const f = await fixture(t), saved = await f.backup(), before = dump(f.app.store.db);
  const cases = [
    ['schema', db => db.exec('DROP TABLE fi_branding')],
    ['versione', db => db.exec("INSERT INTO os_schema VALUES(2,'DEMO')")],
    ['relazioni', db => db.exec("PRAGMA foreign_keys=OFF; INSERT INTO os_assignments VALUES('missing-user','demo-bottega')")],
    ['session-trigger', db => db.exec('CREATE TRIGGER unsafe_session AFTER DELETE ON os_sessions BEGIN DELETE FROM os_memory; END')],
  ];
  for (const [name, corrupt] of cases) {
    const path = resolve(f.fixtureRoot, `backups/${name}.sqlite`);
    await copyFile(saved.path, path);
    const db = new DatabaseSync(path);
    try { corrupt(db); } finally { db.close(); }
    const priorHash = await hash(path);
    const targetDirectory = resolve(f.fixtureRoot, `restored-invalid-${name}`);
    await assert.rejects(f.restore(path, { targetDirectory }));
    await assert.rejects(stat(targetDirectory), { code: 'ENOENT' });
    assert.equal(await hash(path), priorHash);
  }
  const malformed = resolve(f.fixtureRoot, 'backups/corrotto.sqlite');
  await writeFile(malformed, 'Questo è testo DEMO, non un database SQLite.', { mode: 0o600 });
  await assert.rejects(f.restore(malformed));
  assert.deepEqual(dump(f.app.store.db), before);
});

test('Ripristino rifiuta i sidecar; un tentativo fallito lascia backup, sessioni e file esistenti intatti', async t => {
  const f = await fixture(t), saved = await f.backup(), backupHash = await hash(saved.path);
  const walCopy = resolve(f.fixtureRoot, 'backups/wal-copy.sqlite');
  await copyFile(saved.path, walCopy);
  const walDb = new DatabaseSync(walCopy);
  walDb.exec('PRAGMA journal_mode=WAL'); walDb.close();
  const walCopyHash = await hash(walCopy);
  await assert.rejects(f.restore(walCopy), /richiede WAL/);
  assert.equal(await hash(walCopy), walCopyHash);
  await assert.rejects(stat(walCopy + '-wal'), { code: 'ENOENT' });
  await assert.rejects(stat(walCopy + '-shm'), { code: 'ENOENT' });
  await writeFile(saved.path + '-wal', 'SIDECAR DEMO', { mode: 0o600 });
  await assert.rejects(f.restore(saved.path), /temporanei SQLite/);
  assert.equal(await hash(saved.path), backupHash);
  assert.equal((await readFile(saved.path + '-wal', 'utf8')), 'SIDECAR DEMO');
  assert.equal(f.app.store.one('SELECT COUNT(*) n FROM os_sessions').n, 1);
  const blockedOutput = resolve(f.fixtureRoot, 'backups/blocked.sqlite');
  await writeFile(blockedOutput + '-journal', 'JOURNAL DEMO', { mode: 0o600 });
  await assert.rejects(f.backup({ destinationPath: blockedOutput }), /temporanei SQLite/);
  await assert.rejects(stat(blockedOutput), { code: 'ENOENT' });
  assert.equal(await readFile(blockedOutput + '-journal', 'utf8'), 'JOURNAL DEMO');
});

test('CLI documenta i percorsi e rifiuta argomenti non validi prima di accedere ai dati', async () => {
  for (const script of ['backup', 'restore']) {
    const entry = resolve(PROJECT_ROOT, 'scripts', script + '.js');
    const help = await run(process.execPath, [entry, '--help'], { cwd: PROJECT_ROOT });
    assert.match(help.stdout, /Uso:/);
    assert.match(help.stdout, /\.data\/backups/);
    await assert.rejects(run(process.execPath, [entry, '--unknown', 'DEMO'], { cwd: PROJECT_ROOT }), error => error.code === 1 && /Argomenti non validi/.test(error.stderr));
  }
  await assert.rejects(run(process.execPath, [resolve(PROJECT_ROOT, 'scripts/restore.js')], { cwd: PROJECT_ROOT }), error => error.code === 1 && /Indica --backup/.test(error.stderr));
});
