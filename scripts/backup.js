import { DatabaseSync, backup } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { lstat, mkdir, mkdtemp, chmod, open, link, rm } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { dirname, resolve, relative, sep, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const stamp = () => new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
export const uniqueName = prefix => `${prefix}-${stamp()}-${randomUUID()}`;
const inside = (parent, path) => path.startsWith(parent + sep);

// Only the repository's technical data directory is accepted. Tests can explicitly
// choose an already-created fixture directory inside .cache; the CLI cannot.
export async function technicalPaths(fixtureRoot) {
  let dataRoot = resolve(PROJECT_ROOT, '.data');
  if (fixtureRoot !== undefined) {
    dataRoot = resolve(PROJECT_ROOT, fixtureRoot);
    if (!inside(resolve(PROJECT_ROOT, '.cache'), dataRoot)) throw new Error('Fixture consentite solo in una cartella dentro .cache.');
    const stat = await lstat(await safePath(dataRoot, resolve(PROJECT_ROOT, '.cache')));
    if (!stat.isDirectory()) throw new Error('La cartella delle fixture non esiste.');
  }
  await safePath(dataRoot, PROJECT_ROOT);
  return { dataRoot, backupDirectory: resolve(dataRoot, 'backups') };
}

export async function safePath(input, scope, { file = false } = {}) {
  if (typeof input !== 'string' || !input || input.includes('\0')) throw new Error('Percorso non valido.');
  const path = resolve(PROJECT_ROOT, input), boundary = resolve(scope);
  if (!inside(PROJECT_ROOT, path) || (path !== boundary && !inside(boundary, path))) throw new Error('Percorso fuori dalla cartella tecnica consentita.');
  const parts = relative(PROJECT_ROOT, path).split(sep);
  let current = PROJECT_ROOT;
  for (let index = 0; index < parts.length; index++) {
    current = resolve(current, parts[index]);
    let stat;
    try { stat = await lstat(current); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (stat.isSymbolicLink()) throw new Error('I collegamenti simbolici non sono consentiti nei percorsi dei dati.');
    if (index < parts.length - 1 && !stat.isDirectory()) throw new Error('Un elemento del percorso non è una cartella.');
    if (index === parts.length - 1 && file && (!stat.isFile() || stat.nlink !== 1)) throw new Error('Occorre un file regolare senza collegamenti aggiuntivi.');
  }
  if (file) {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error('Occorre un file regolare senza collegamenti aggiuntivi.');
  }
  return path;
}

export async function assertAbsent(path) {
  try { await lstat(path); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  throw new Error('La destinazione esiste già: nessun file viene sovrascritto.');
}

export async function assertNoSidecars(path) {
  for (const suffix of ['-wal', '-shm', '-journal']) {
    try { await lstat(path + suffix); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    throw new Error('La copia contiene file temporanei SQLite: usa un backup completato e chiuso.');
  }
}

const requiredSchema = {
  os_schema: ['version', 'applied_at'],
  os_clients: ['id', 'name', 'services_json'],
  os_users: ['id', 'tenant_id', 'role', 'password_hash'],
  os_sessions: ['id', 'user_id', 'csrf', 'expires_at'],
  os_assignments: ['user_id', 'client_id'],
  os_memory: ['id', 'client_id', 'version', 'content', 'visibility'],
  os_approvals: ['id', 'client_id', 'entity_id', 'version', 'status'],
  os_jobs: ['id', 'client_id', 'status', 'dedupe'],
  os_settings: ['key', 'value'],
  gr_leads: ['id', 'workspace', 'consent', 'consent_proof'],
  gr_messages: ['id', 'workspace', 'lead_id', 'status'],
  gr_meetings: ['id', 'workspace', 'lead_id', 'start', 'end'],
  fi_members: ['id', 'tenant_id', 'balance', 'marketing_consent', 'privacy_version'],
  fi_transactions: ['id', 'member_id', 'amount', 'balance_after', 'reversal_of'],
  fi_consents: ['id', 'member_id', 'granted', 'source', 'version'],
  os_fin_accounts: ['id', 'entity_id', 'opening_cents'],
  os_fin_movements: ['id', 'entity_id', 'account_id', 'direction', 'amount_cents', 'source_ref'],
};
const requiredTables = `os_audit os_tasks os_contents os_schedules os_costs
  gr_workspaces gr_tokens gr_jobs gr_costs gr_suppressions gr_conversions gr_approvals gr_demo_mail gr_demo_calendar
  fi_meta fi_programs fi_idempotency fi_campaigns fi_deliveries fi_jobs fi_automations fi_automation_runs fi_branding
  os_fin_entities os_fin_counterparties os_fin_contracts os_fin_invoices os_fin_obligations os_fin_subscriptions
  os_fin_reconciliations os_fin_anomalies os_fin_requests os_fin_reversals os_fin_hourly_rates os_fin_work_allocations`.trim().split(/\s+/);

// No application bootstrap/migration runs against a backup. Reject unrelated,
// incomplete or future schemas before offering the copy as a restorable database.
export function validateDatabase(db) {
  const integrity = db.prepare('PRAGMA integrity_check').all();
  if (integrity.length !== 1 || integrity[0].integrity_check !== 'ok') throw new Error('Verifica di integrità SQLite non superata.');
  if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Relazioni del database non valide.');
  const tables = new Set(db.prepare("SELECT name FROM sqlite_schema WHERE type='table'").all().map(row => row.name));
  for (const table of requiredTables) if (!tables.has(table)) throw new Error(`Schema BigAnt OS incompleto: manca ${table}.`);
  for (const [table, expected] of Object.entries(requiredSchema)) {
    if (!tables.has(table)) throw new Error(`Schema BigAnt OS incompleto: manca ${table}.`);
    const columns = new Set(db.prepare(`PRAGMA table_info("${table}")`).all().map(row => row.name));
    if (expected.some(column => !columns.has(column))) throw new Error(`Schema BigAnt OS incompatibile: ${table}.`);
  }
  const versions = db.prepare('SELECT version FROM os_schema ORDER BY version').all().map(row => row.version);
  if (versions.length !== 1 || versions[0] !== 1) throw new Error('Versione del database non supportata da questo ripristino.');
  if (db.prepare("SELECT 1 FROM sqlite_schema WHERE type='trigger' AND tbl_name='os_sessions'").get()) throw new Error('Schema sessioni inatteso: ripristino non consentito.');
  for (const table of tables) {
    const quoted = table.replaceAll('"', '""');
    if (db.prepare(`PRAGMA foreign_key_list("${quoted}")`).all().some(row => row.table === 'os_sessions')) throw new Error('Relazioni inattese con le sessioni: ripristino non consentito.');
  }
  return { schemaVersion: 1, tables: tables.size };
}

export async function sqliteSnapshot(sourcePath, destinationPath, { beforePublish } = {}) {
  for (const path of [sourcePath, destinationPath]) {
    if (![resolve(PROJECT_ROOT, '.data'), resolve(PROJECT_ROOT, '.cache')].some(root => inside(root, resolve(path)))) throw new Error('Snapshot consentito solo nelle cartelle tecniche dei dati.');
  }
  await safePath(sourcePath, PROJECT_ROOT, { file: true });
  await safePath(destinationPath, PROJECT_ROOT);
  await assertAbsent(destinationPath);
  const staging = await mkdtemp(resolve(dirname(destinationPath), '.snapshot-'));
  const temporary = resolve(staging, 'bigant-os.sqlite');
  let source, snapshot;
  try {
    source = new DatabaseSync(sourcePath, { readOnly: true, timeout: 5000 });
    source.exec('PRAGMA trusted_schema=OFF');
    await backup(source, temporary);
    source.close(); source = null;
    snapshot = new DatabaseSync(temporary);
    snapshot.exec('PRAGMA trusted_schema=OFF; PRAGMA foreign_keys=ON; PRAGMA journal_mode=DELETE;');
    const schema = validateDatabase(snapshot);
    const details = beforePublish ? beforePublish(snapshot) : {};
    validateDatabase(snapshot);
    snapshot.close(); snapshot = null;
    await chmod(temporary, 0o600);
    const file = await open(temporary, 'r');
    try { await file.sync(); } finally { await file.close(); }
    await safePath(destinationPath, PROJECT_ROOT);
    await assertNoSidecars(destinationPath);
    // Atomic create without replacement; an existing destination always wins.
    await link(temporary, destinationPath);
    return { ...schema, ...details };
  } finally {
    source?.close(); snapshot?.close();
    // Only the unique staging directory created by this invocation is removed.
    await rm(staging, { recursive: true, force: true });
  }
}

export async function createBackup({ sourcePath, destinationPath, fixtureRoot } = {}) {
  const { dataRoot, backupDirectory } = await technicalPaths(fixtureRoot);
  const source = await safePath(sourcePath ?? resolve(dataRoot, 'bigant-os.sqlite'), dataRoot, { file: true });
  if (!source.endsWith('.sqlite')) throw new Error('Seleziona un database .sqlite del progetto.');
  const destination = await safePath(destinationPath ?? resolve(backupDirectory, uniqueName('bigant-os') + '.sqlite'), backupDirectory);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.sqlite$/.test(basename(destination))) throw new Error('Nome del backup non valido.');
  await assertAbsent(destination); await assertNoSidecars(destination);
  await safePath(dirname(destination), backupDirectory);
  await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
  await safePath(dirname(destination), backupDirectory);
  const schema = await sqliteSnapshot(source, destination);
  return { path: destination, source, createdAt: new Date().toISOString(), ...schema };
}

export function parseArguments(args, supported) {
  const values = {};
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (!supported.includes(flag) || values[flag] !== undefined || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error('Argomenti non validi.');
    values[flag] = args[++index];
  }
  return values;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.includes('--help')) console.info('Uso: npm run backup -- [--source .data/bigant-os.sqlite] [--output .data/backups/nome.sqlite]\nIl backup resta nel repository, in .data/backups. DATA_DIR può indicare un database ripristinato dentro .data.');
    else {
      const args = parseArguments(process.argv.slice(2), ['--source', '--output']);
      const sourcePath = args['--source'] ?? (process.env.DATA_DIR ? resolve(process.env.DATA_DIR, 'bigant-os.sqlite') : undefined);
      const result = await createBackup({ sourcePath, destinationPath: args['--output'] });
      console.info(`Backup verificato: ${result.path}\nSchema ${result.schemaVersion}, ${result.tables} tabelle. Nessun dato originale modificato.`);
    }
  } catch (error) { console.error(`Backup non creato: ${error.message}`); process.exitCode = 1; }
}
