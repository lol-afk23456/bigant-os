import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { createApp } from '../server.js';
import { createAgentConfig } from '../src/agent-config.js';
import { createMotore, scegliMotore } from '../src/motori/index.js';
import { schemi } from '../src/sciame/schemi.js';

const root = resolve(import.meta.dirname, '..');
const draft = entry => ({ version: entry.config.version, task: entry.config.task, instructions: entry.config.instructions, sources: entry.config.sources, quality: entry.config.quality, estimatedCents: 40, provider: '', cadence: 'manual', enabled: false, authorized: false });

test('32 agenti Base, configurazione persistente con versioni e nessuna attivazione implicita', async t => {
  const app = createApp({ env: {} }); t.after(() => app.close());
  const user = app.store.one("SELECT * FROM os_users WHERE id='demo-owner'");
  const initial = app.agentConfig.state(user);
  assert.equal(initial.items.length, 32); assert.ok(initial.items.every(item => item.operationalStatus === 'Base'));
  assert.ok(initial.items.filter(item => item.hasAIInstructions).length > 0);
  assert.deepEqual(initial.providers.map(item => item.configured), [false, false]);
  const social = app.agentConfig.entry('social'), b = { ...draft(social), task: 'Prepara post dalle fonti verificate', provider: 'openai', cadence: 'daily' };
  const saved = app.agentConfig.save(user, 'social', b);
  assert.equal(saved.config.version, 1); assert.equal(saved.operationalStatus, 'Base'); assert.equal(saved.config.enabled, 0);
  assert.throws(() => app.agentConfig.save(user, 'social', b), /Configurazione cambiata/);
  const reopened = createAgentConfig({ store: app.store, root, env: {} });
  assert.equal(reopened.entry('social').config.task, b.task);
  assert.throws(() => reopened.requireRun('social'), /non attivo/);
  const team = app.store.one("SELECT * FROM os_users WHERE id='demo-collaborator'");
  assert.throws(() => reopened.state(team), /riservata/);
  assert.throws(() => reopened.save(team, 'social', { ...b, version: 1 }), /riservata/);
});

test('AI pronta non significa Attivo; collaudo e autorizzazione richiesti, revoca spegne i calendari', async t => {
  const app = createApp({ env: {} }); t.after(() => app.close());
  const env = { BIGANT_OPENAI_API_KEY: 'chiave-fittizia', BIGANT_OPENAI_MODELLO: 'modello-fittizio' };
  const user = app.store.one("SELECT * FROM os_users WHERE id='demo-owner'");
  const config = createAgentConfig({ store: app.store, root, env });
  const saved = config.save(user, 'social', { ...draft(config.entry('social')), provider: 'openai', authorized: true, cadence: 'daily' });
  assert.equal(saved.operationalStatus, 'Base');
  assert.throws(() => config.save(user, 'social', { ...draft(saved), provider: 'openai', enabled: true, authorized: true }), /Attivazione non disponibile/);
  assert.throws(() => config.requireRun('social'), /non attivo/);
  // Synthetic readiness injected only here; no network calls or production activation.
  const tested = createAgentConfig({ store: app.store, root, env, runtimeReady: () => true });
  assert.equal(tested.entry('social').operationalStatus, 'AI pronta');
  const active = tested.save(user, 'social', { ...draft(saved), provider: 'openai', enabled: true, authorized: true, cadence: 'daily' });
  assert.equal(active.operationalStatus, 'Attivo'); assert.equal(tested.requireRun('social', { automatic: true }).id, 'social');
  app.store.run("INSERT INTO os_schedules VALUES('test-social','demo-bottega','social','daily',1,NULL,1440,NULL)");
  tested.save(user, 'social', { ...draft(active), provider: 'openai' });
  assert.equal(app.store.one("SELECT enabled FROM os_schedules WHERE id='test-social'").enabled, 0);
  assert.throws(() => tested.requireRun('social', { automatic: true }), /non attivo/);
});

test('costi per agente riconciliati con os_costs, riserve distinte e regia non dispersa', async t => {
  const app = createApp({ env: {}, clock: () => new Date('2026-10-10T10:00:00Z') }); t.after(() => app.close());
  const first = app.orchestrator.reserve('demo-bottega', 'social', 10);
  app.store.run("UPDATE os_costs SET status='charged' WHERE id=?", first);
  app.orchestrator.reserve('demo-bottega', 'sciame:social', 20);
  app.orchestrator.reserve('demo-bigant', 'sciame:orchestratore', 30);
  const released = app.orchestrator.reserve('demo-bottega', 'social', 5);
  app.store.run("UPDATE os_costs SET status='released' WHERE id=?", released);
  const costs = app.agentConfig.costs(), social = costs.rows.find(row => row.agent === 'social');
  assert.equal(costs.month, '2026-10'); assert.equal(social.chargedCents, 10); assert.equal(social.reservedCents, 20); assert.equal(costs.otherCents, 30);
  assert.equal(costs.rows.reduce((n, row) => n + row.chargedCents + row.reservedCents, costs.otherCents), app.orchestrator.budget().usedCents);
});

test('server reale non avvia procedure o giri DEMO, nemmeno con un motore configurato', async t => {
  let calls = 0;
  const motore = { id: 'openai', stato: () => ({ disponibile: true }), esegui: async () => { calls++; throw Error('Non deve essere chiamato'); } };
  const app = createApp({ origin: 'https://collaudo.example', motore, env: { BIGANT_MODALITA: 'reale', BIGANT_SOCIO_EMAIL: 'socio@collaudo.example', BIGANT_SOCIO_PASSWORD_INIZIALE: 'password-inventata-di-test' } });
  t.after(() => app.close()); const user = app.store.one("SELECT * FROM os_users WHERE email='socio@collaudo.example'");
  assert.throws(() => app.orchestrator.enqueue(user, 'demo-bigant', 'social'), /non attivo/);
  assert.throws(() => app.sciame.creaGiro(user, { richiesta: 'Prova' }), /collaudato/);
  assert.equal(calls, 0); assert.equal(app.store.one('SELECT count(*) n FROM os_jobs').n, 0); assert.equal(app.store.one('SELECT count(*) n FROM os_costs').n, 0);
  assert.equal(scegliMotore({ BIGANT_MODALITA: 'reale' }), 'nessuno');
});

test('OpenAI predisposto: schema comune, destinazione fissa, nessun salvataggio remoto richiesto e costo esplicito', async () => {
  const spento = createMotore({ nome: 'openai', root, env: {}, fetchImpl: () => { throw Error('Rete non consentita'); } });
  assert.equal(spento.stato().disponibile, false); await assert.rejects(spento.esegui({}), /non configurato/);
  let request;
  const m = createMotore({ nome: 'openai', root, env: { BIGANT_OPENAI_API_KEY: 'chiave-fittizia', BIGANT_OPENAI_MODELLO: 'modello-fittizio', BIGANT_OPENAI_COSTO_MAX_CENT: '35' }, fetchImpl: async (url, options) => {
    request = { url, ...options, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ esito: 'approvabile', sintesi: 'ok', rilievi: [] }) }] }], usage: { input_tokens: 7, output_tokens: 8 } }) };
  } });
  const result = await m.esegui({ agente: 'qualita', compito: 'Verifica', pacchetto: { demo: true }, schema: schemi.qualita });
  assert.equal(request.url, 'https://api.openai.com/v1/responses'); assert.equal(request.redirect, 'error'); assert.equal(request.body.store, false);
  assert.equal(request.body.text.format.strict, true); assert.deepEqual(request.body.text.format.schema, schemi.qualita); assert.match(request.body.instructions, /Qualità/);
  assert.equal(request.body.model, 'modello-fittizio'); assert.equal(result.meta.costoUsdMicro, 350000); assert.equal(result.output.esito, 'approvabile');
});

test('OpenAI rifiuta risposte incomplete, rifiuti, errori e JSON non valido senza riportare segreti', async () => {
  const env = { BIGANT_OPENAI_API_KEY: 'chiave-fittizia', BIGANT_OPENAI_MODELLO: 'modello-fittizio' };
  for (const result of [
    { status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } },
    { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal' }] }] },
    { status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'non JSON' }] }] }
  ]) {
    const m = createMotore({ nome: 'openai', root, env, fetchImpl: async () => ({ ok: true, json: async () => result }) });
    await assert.rejects(m.esegui({ agente: 'qualita', compito: 'Prova', pacchetto: {}, schema: schemi.qualita }));
  }
  let attempts = 0;
  const failed = createMotore({ nome: 'openai', root, env, fetchImpl: async () => { attempts++; throw Error('chiave-fittizia'); } });
  await assert.rejects(failed.esegui({ agente: 'qualita', compito: 'Prova', pacchetto: {}, schema: schemi.qualita }), error => !error.message.includes('chiave-fittizia'));
  assert.equal(attempts, 1);
  for (const provider of ['api', 'openai']) assert.equal(createMotore({ nome: provider, root, env: { ...env, BIGANT_ANTHROPIC_API_KEY: 'finta', BIGANT_API_MODELLO: 'finto', BIGANT_API_COSTO_MAX_CENT: 'NaN', BIGANT_OPENAI_COSTO_MAX_CENT: 'NaN' } }).stato().disponibile, false);
});
