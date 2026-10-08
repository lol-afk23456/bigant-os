import { readFile, readdir, lstat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECT_ROOT, safePath, validateDatabase } from './backup.js';
import { services, departments, agentDefinitions, integrations } from '../src/registry.js';
import {validateAgencyRegistry} from '../src/agency/index.js';

const run = promisify(execFile);
const pinned = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const demand = (condition, message) => { if (!condition) throw new Error(message); };

async function filesInside(directory, extension) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Collegamento simbolico inatteso: ${relative(PROJECT_ROOT, path)}.`);
    if (entry.isDirectory()) result.push(...await filesInside(path, extension));
    else if (entry.isFile() && path.endsWith(extension)) result.push(path);
  }
  return result;
}

async function checkSyntax() {
  const files = [resolve(PROJECT_ROOT, 'server.js')];
  for (const directory of ['src', 'public', 'scripts', 'tests']) files.push(...await filesInside(resolve(PROJECT_ROOT, directory), '.js'));
  const errors = [];
  for (const file of files) {
    try { await run(process.execPath, ['--check', file], { cwd: PROJECT_ROOT, timeout: 15000, maxBuffer: 300000 }); }
    catch (error) { errors.push(`${relative(PROJECT_ROOT, file)}: ${(error.stderr || error.message).trim()}`); }
  }
  demand(!errors.length, errors.join('\n'));
  return `${files.length} file JavaScript verificati senza eseguirli.`;
}

async function checkRegistry() {
  validateAgencyRegistry();
  for (const [label, rows] of Object.entries({ servizi: services, reparti: departments, agenti: agentDefinitions, integrazioni: integrations })) {
    demand(rows.length > 0 && rows.every(row => /^[a-z][a-z0-9-]*$/.test(row.id) && row.name), `Identificativi o nomi non validi nel registro ${label}.`);
    demand(new Set(rows.map(row => row.id)).size === rows.length, `Identificativi duplicati nel registro ${label}.`);
  }
  const departmentIds = new Set(departments.map(row => row.id)), agentIds = new Set(agentDefinitions.map(row => row.id));
  for (const service of services) {
    demand(departmentIds.has(service.department), `Reparto mancante per ${service.id}.`);
    demand(service.deliverables && service.activation && service.status && service.integration && Array.isArray(service.data) && service.data.includes('client_id'), `Scheda incompleta per ${service.id}.`);
    const sop = await safePath(resolve(PROJECT_ROOT, service.sop), PROJECT_ROOT, { file: true });
    demand((await readFile(sop, 'utf8')).trim().length > 100, `SOP vuota per ${service.id}.`);
  }
  demand(JSON.stringify(services.map(row => row.catalogue).filter(Boolean).sort((a, b) => a - b)) === JSON.stringify(Array.from({ length: 19 }, (_, i) => i + 1)), 'Catalogo incompleto: devono essere presenti le 19 voci del brief.');
  for (const agent of agentDefinitions) demand(departmentIds.has(agent.department) && agent.source && agent.purpose && agent.failure && Array.isArray(agent.reads), `Scheda agente incompleta: ${agent.id}.`);
  for (const department of departments) for (const id of department.agents) demand(agentIds.has(id) && agentDefinitions.find(row => row.id === id).department === department.id, `Assegnazione incoerente dell'agente ${id}.`);
  return `${services.length} servizi, ${departments.length} reparti e ${agentDefinitions.length} agenti con schede e SOP.`;
}

async function checkDocumentation() {
  const files = [resolve(PROJECT_ROOT, 'README.md'), resolve(PROJECT_ROOT, 'AGENTS.md'), ...await filesInside(resolve(PROJECT_ROOT, 'docs'), '.md')];
  const problems = [];
  let checked = 0;
  for (const file of files) {
    // Prose and templates can contain untrusted examples. Inspect actual Markdown
    // links only; do not flag URLs, quoted instructions or provider names as code.
    const markdown = (await readFile(file, 'utf8')).replace(/^\s*(```|~~~)[\s\S]*?^\s*\1[^\n]*$/gm, '');
    for (const match of markdown.matchAll(/!?\[[^\]\n]*\]\(\s*(<[^>]*>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g)) {
      const link = match[1].replace(/^<|>$/g, '');
      if (/^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith('#') || link.startsWith('//')) continue;
      try {
        const target = decodeURIComponent(link.split(/[?#]/)[0]);
        if (!target) continue;
        const path = await safePath(resolve(dirname(file), target), PROJECT_ROOT);
        const stat = await lstat(path);
        demand(stat.isFile() || stat.isDirectory(), 'La destinazione non è un file o una cartella.'); checked++;
      } catch (error) { problems.push(`${relative(PROJECT_ROOT, file)} → ${link}: ${error.code === 'ENOENT' ? 'destinazione mancante' : error.message}`); }
    }
  }
  demand(!problems.length, problems.join('\n'));
  return `${files.length} documenti letti; ${checked} collegamenti locali verificati. Fonti web non interrogate.`;
}

async function checkDependencies() {
  const pkg = JSON.parse(await readFile(resolve(PROJECT_ROOT, 'package.json'), 'utf8'));
  const lock = JSON.parse(await readFile(resolve(PROJECT_ROOT, 'package-lock.json'), 'utf8'));
  demand(pkg.private === true, 'Il progetto deve restare privato.');
  demand(lock.lockfileVersion === 3 && lock.packages?.[''], 'Lockfile assente o non supportato.');
  let count = 0;
  for (const kind of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    const wanted = pkg[kind] ?? {}, locked = lock.packages[''][kind] ?? {};
    demand(JSON.stringify(Object.keys(wanted).sort()) === JSON.stringify(Object.keys(locked).sort()), `Elenco ${kind} diverso nel lockfile.`);
    for (const [name, version] of Object.entries(wanted)) {
      demand(pinned.test(version), `Versione non esatta per ${name}.`);
      demand(locked[name] === version && lock.packages[`node_modules/${name}`]?.version === version, `Versione di ${name} diversa nel lockfile.`);
      count++;
    }
  }
  for (const [name, entry] of Object.entries(lock.packages)) {
    if (!name) continue;
    demand(pinned.test(entry.version ?? '') && !entry.link, `Pacchetto non fissato nel lockfile: ${name}.`);
    demand(typeof entry.integrity === 'string' && entry.integrity.startsWith('sha512-'), `Integrità del pacchetto non registrata: ${name}.`);
    demand(typeof entry.resolved === 'string' && new URL(entry.resolved).origin === 'https://registry.npmjs.org', `Origine del pacchetto da verificare: ${name}.`);
  }
  return `${count} dipendenze dirette con versione esatta; risoluzioni e integrità del lockfile controllate senza rete.`;
}

async function checkOfflineMode() {
  const { createApp } = await import('../server.js');
  let refused = false;
  try { const unexpected = createApp({ origin: 'https://external.example' }); await unexpected.close(); } catch { refused = true; }
  demand(refused, 'Il prototipo accetta un indirizzo pubblico.');
  const app = createApp();
  try {
    validateDatabase(app.store.db);
    const owner = app.store.one('SELECT * FROM os_users WHERE id=?', 'demo-owner');
    const growth = app.growth.state('demo-bigant', owner), fidelity = app.fidelity.state('demo-bottega', owner);
    demand(growth.simulation === true && ['openai', 'brave', 'google', 'googleConfigured'].every(key => growth.connections[key] === false), 'Un provider Growth risulta abilitato.');
    demand(['apple', 'google'].every(key => fidelity.wallet[key].configured === false && fidelity.wallet[key].status === 'disconnected'), 'Un provider Wallet risulta abilitato.');
    demand(integrations.every(row => row.status === 'Non collegato' && row.lastSync === null), 'Un collegamento del registro risulta attivo.');
    const handler = app.server.listeners('request')[0];
    async function health(remoteAddress) {
      let status, payload;
      await handler({ method: 'GET', url: '/health', headers: { host: '127.0.0.1:4330' }, socket: { remoteAddress } }, { setHeader() {}, writeHead(value) { status = value; }, end(value) { payload = JSON.parse(String(value)); } });
      return { status, payload };
    }
    const local = await health('127.0.0.1'), external = await health('203.0.113.1');
    demand(local.status === 200 && local.payload.demo === true && local.payload.externalActions === false && external.status === 403, 'Il blocco degli accessi HTTP non locali non è confermato.');
    return 'Database in memoria, provider dichiarati scollegati, modalità DEMO e richieste non locali bloccate. Nessun socket o chiamata esterna aperto; controllo mirato, non audit completo della rete.';
  } finally { await app.close(); }
}

export async function checkProject() {
  const checks = [];
  for (const [name, work] of [['Sintassi', checkSyntax], ['Registro e SOP', checkRegistry], ['Documentazione', checkDocumentation], ['Dipendenze', checkDependencies], ['Prototipo locale', checkOfflineMode]]) {
    try { checks.push({ name, ok: true, detail: await work() }); }
    catch (error) { checks.push({ name, ok: false, detail: error.message }); }
  }
  return { ok: checks.every(check => check.ok), checks };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await checkProject();
  for (const check of report.checks) console.info(`${check.ok ? 'OK' : 'ERRORE'} · ${check.name}: ${check.detail}`);
  if (!report.ok) process.exitCode = 1;
}
