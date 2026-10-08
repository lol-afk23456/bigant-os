import test from 'node:test';
import assert from 'node:assert/strict';
import { openStore, seedCore } from '../src/store.js';
import { createGrowthModule } from '../src/growth.js';
import { createFidelityModule } from '../src/fidelity.js';
import { createModuleAgentRunner } from '../src/agents/modules.js';

function setup(t) {
  const store = openStore(); seedCore(store);
  const growth = createGrowthModule({ store }), fidelity = createFidelityModule({ store });
  growth.seed(); fidelity.seed();
  const owner = store.one('SELECT * FROM os_users WHERE id=?', 'demo-owner');
  t.after(() => store.close());
  t.mock.method(globalThis, 'fetch', () => { throw Error('RETE VIETATA'); });
  const run = createModuleAgentRunner({ store, growth, fidelity });
  const job = (id, agent, input = {}, client_id = 'demo-bigant') => ({ id, agent, client_id, input: JSON.stringify(input) });
  const call = async (method, path, body = {}, clientId = 'demo-bigant') => (await growth.handle({ method, path, body, user: owner, clientId })).data;
  const enable = () => call('POST', '/settings', { paused: false });
  const lead = () => growth.store.one('SELECT * FROM leads WHERE workspace=? ORDER BY created,id LIMIT 1', 'demo-bigant');
  const permit = async () => { const l = lead(); await call('PATCH', `/leads/${l.id}`, { consent: 'marketing', consent_proof: 'Fixture DEMO: autorizzazione deliberatamente registrata dal test' }); return l; };
  const assertNoExternal = () => {
    assert.equal(store.one('SELECT count(*) n FROM gr_demo_mail').n, 0);
    assert.equal(store.one('SELECT count(*) n FROM gr_demo_calendar').n, 0);
    assert.equal(store.one("SELECT count(*) n FROM gr_messages WHERE status IN ('simulated_sent','sending')").n, 0);
    assert.equal(store.one('SELECT count(*) n FROM fi_deliveries WHERE sent_at IS NOT NULL').n, 0);
    assert.equal(store.one('SELECT coalesce(sum(cents),0) n FROM os_costs').n, 0);
  };
  return { store, growth, fidelity, owner, run, job, call, enable, lead, permit, assertNoExternal };
}

test('Ricerca OS usa provider e handler Growth, salva e analizza i lead sullo stesso database', async t => {
  const c = setup(t); await c.enable();
  const result = await c.run(c.job('module-research-1', 'research', { query: 'Servizi DEMO a Caserta' }), c.owner);
  assert.equal(result.status, 'completed'); assert.equal(result.mode, 'DEMO offline');
  assert.equal(result.links.leadIds.length, 5); assert.equal(result.links.added, 5);
  for (const id of result.links.leadIds) {
    const lead = c.growth.store.lead('demo-bigant', id);
    assert.equal(lead.score, 72); assert.equal(lead.stage, 'qualified'); assert.match(lead.analysis, /Fonte: https:/);
    assert.equal(lead.consent, 'none'); assert.equal(lead.email, '');
    assert.equal(c.growth.store.one('SELECT status FROM jobs WHERE dedupe=?', `analyze:${id}`).status, 'done');
  }
  assert.equal(c.growth.store.one('SELECT count(*) n FROM leads WHERE workspace=?', 'demo-bigant').n, 7);
  assert.equal(c.growth.store.one('SELECT count(*) n FROM messages').n, 0);
  const again = await c.run(c.job('module-research-1', 'research', { query: 'Servizi DEMO a Caserta' }), c.owner);
  assert.deepEqual(again, result);
  assert.equal(c.growth.store.one('SELECT count(*) n FROM leads').n, 7);
  c.assertNoExternal();
});

test('Analista aggiorna il lead esplicito, non quello di un altro workspace e non concatena bozze', async t => {
  const c = setup(t); await c.enable(); await c.permit();
  await c.call('POST', '/settings', { autoDraft: true });
  const first = c.lead(), result = await c.run(c.job('module-analysis-1', 'analyst', { leadId: first.id }), c.owner);
  assert.equal(result.links.leadId, first.id); assert.match(result.body, /DEMO/);
  assert.equal(c.growth.store.lead('demo-bigant', first.id).score, 72);
  assert.equal(c.growth.store.settings('demo-bigant').autoDraft, true);
  assert.equal(c.growth.store.one("SELECT count(*) n FROM jobs WHERE type='draft'").n, 0);
  c.assertNoExternal();
});

test('Commerciale crea una bozza e approvazione comune, retry concorrenti non duplicano messaggi o token', async t => {
  const c = setup(t); await c.enable(); const lead = await c.permit();
  const job = c.job('module-commercial-1', 'commercial', { leadId: lead.id });
  const [result, retry] = await Promise.all([c.run(job, c.owner), c.run(job, c.owner)]);
  assert.deepEqual(result, retry);
  const message = c.growth.store.one('SELECT * FROM messages WHERE id=?', result.links.messageId);
  assert.equal(message.workspace, 'demo-bigant'); assert.equal(message.status, 'draft');
  const approval = c.store.one('SELECT * FROM os_approvals WHERE id=?', result.links.approvalId);
  assert.equal(approval.kind, 'growth_message'); assert.equal(approval.status, 'pending'); assert.equal(approval.entity_id, message.id);
  assert.equal(c.store.one('SELECT count(*) n FROM gr_messages').n, 1);
  assert.equal(c.store.one('SELECT count(*) n FROM gr_tokens').n, 2);
  assert.equal(c.growth.store.lead('demo-bigant', lead.id).consent, 'marketing');
  c.assertNoExternal();
});

test('Fidelity prepara campagna comune per soli iscritti opt-in e richiede approvazione', async t => {
  const c = setup(t);
  const result = await c.run(c.job('module-fidelity-1', 'fidelity', {}, 'demo-bottega'), c.owner);
  assert.equal(result.status, 'completed'); assert.deepEqual(result.links.recipientIds, ['fi-demo-member']);
  const campaign = c.store.one('SELECT * FROM fi_campaigns WHERE id=?', result.links.campaignId);
  assert.equal(campaign.tenant_id, 'demo-bottega'); assert.equal(campaign.status, 'awaiting_approval');
  const approval = c.store.one('SELECT * FROM os_approvals WHERE id=?', result.links.approvalId);
  assert.equal(approval.kind, 'fidelity_campaign'); assert.equal(approval.status, 'pending');
  assert.equal(c.store.one('SELECT count(*) n FROM fi_deliveries WHERE campaign_id=?', campaign.id).n, 2);
  assert.equal(c.store.one("SELECT count(*) n FROM fi_deliveries WHERE campaign_id=? AND status='blocked'", campaign.id).n, 2);
  assert.deepEqual(await c.run(c.job('module-fidelity-1', 'fidelity', {}, 'demo-bottega'), c.owner), result);
  assert.equal(c.store.one('SELECT count(*) n FROM fi_campaigns').n, 1);
  c.assertNoExternal();
});

test('Mancanza di consenso e pausa producono prerequisiti senza alterare impostazioni o autorizzazioni', async t => {
  const c = setup(t);
  const paused = await c.run(c.job('module-paused', 'research'), c.owner);
  assert.equal(paused.status, 'needs_input'); assert.equal(paused.prerequisite, true);
  assert.equal(c.growth.store.settings('demo-bigant').paused, true);
  await c.enable();
  const missing = await c.run(c.job('module-no-consent', 'commercial'), c.owner);
  assert.equal(missing.status, 'needs_input'); assert.match(missing.summary, /autorizzazione/);
  assert.equal(c.store.one('SELECT count(*) n FROM gr_messages').n, 0);
  assert.equal(c.store.one("SELECT count(*) n FROM gr_leads WHERE consent<>'none'").n, 0);
  const fidelity = await c.run(c.job('module-fi-no-consent', 'fidelity'), c.owner);
  assert.equal(fidelity.status, 'needs_input'); assert.equal(c.store.one('SELECT count(*) n FROM fi_campaigns').n, 0);
  assert.equal(c.store.one('SELECT marketing_consent FROM fi_members WHERE id=?', 'fi-demo-bigant-member').marketing_consent, 0);
  c.store.setSetting('paused', true);
  const central = await c.run(c.job('module-central-paused', 'fidelity', {}, 'demo-bottega'), c.owner);
  assert.equal(central.status, 'needs_input'); assert.equal(c.store.getSetting('paused'), 'true');
  c.assertNoExternal();
});

test('ID altrui, identità falsificata e servizi revocati non attraversano i workspace, neanche su cache', async t => {
  const c = setup(t); await c.enable();
  c.growth.store.workspace('demo-bottega');
  const other = await c.call('POST', '/leads', { company: 'Altro workspace DEMO', website: 'https://altro.example' }, 'demo-bottega');
  await assert.rejects(c.run(c.job('module-foreign-lead', 'analyst', { leadId: other.id }), c.owner), e => e.status === 404);
  await assert.rejects(c.run(c.job('module-foreign-program', 'fidelity', { programId: 'fi-demo-points' }, 'demo-bottega'), c.owner), e => e.status === 404);
  await assert.rejects(c.run(c.job('module-no-service', 'research', {}, 'demo-bottega'), c.owner), e => e.status === 403);
  const client = c.store.one('SELECT * FROM os_users WHERE id=?', 'demo-client');
  await assert.rejects(c.run(c.job('module-forged-owner', 'fidelity', {}, 'demo-bottega'), { ...client, role: 'owner' }), e => e.status === 403);
  const job = c.job('module-revocation', 'analyst'); await c.run(job, c.owner);
  c.store.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bigant'");
  await assert.rejects(c.run(job, c.owner), e => e.status === 403);
  assert.equal(c.growth.store.lead('demo-bottega', other.id).analysis, '');
  c.assertNoExternal();
});

test('Input diverso sullo stesso job non riutilizza un risultato appartenente ad altra richiesta', async t => {
  const c = setup(t); await c.enable();
  await c.run(c.job('module-input-conflict', 'research', { query: 'Primo lotto DEMO' }), c.owner);
  await assert.rejects(c.run(c.job('module-input-conflict', 'research', { query: 'Secondo lotto DEMO' }), c.owner), e => e.status === 409);
  c.assertNoExternal();
});

test('La revoca del servizio durante la produzione di un risultato impedisce la scrittura sul lead', async t => {
  const c = setup(t); await c.enable();
  const lead = c.lead(), original = c.growth.providers.ai;
  c.growth.providers.ai = async (...args) => {
    const result = await original(...args);
    c.store.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bigant'");
    return result;
  };
  await assert.rejects(c.run(c.job('module-revoke-in-flight', 'analyst', { leadId: lead.id }), c.owner), e => e.status === 403);
  assert.equal(c.growth.store.lead('demo-bigant', lead.id).analysis, '');
  assert.equal(c.growth.store.lead('demo-bigant', lead.id).score, 0);
  c.assertNoExternal();
});

test('Ripresa dopo creazione messaggio e prima del risultato non duplica la bozza, anche se annullata', async t => {
  const c = setup(t); await c.enable(); await c.permit();
  const original = c.growth.store.requestApproval;
  c.growth.store.requestApproval = (...args) => { original(...args); throw Error('Interruzione DEMO dopo la bozza'); };
  const job = c.job('module-draft-crash', 'commercial');
  await assert.rejects(c.run(job, c.owner), /Interruzione DEMO/);
  assert.equal(c.store.one('SELECT count(*) n FROM gr_messages').n, 1);
  const message = c.store.one('SELECT * FROM gr_messages');
  c.growth.store.requestApproval = original;
  await c.call('PATCH', `/messages/${message.id}`, { status: 'cancelled', reason: 'Annullamento DEMO prima della ripresa' });
  const resumed = createModuleAgentRunner({ store: c.store, growth: c.growth, fidelity: c.fidelity });
  const result = await resumed(job, c.owner);
  assert.equal(result.links.messageId, message.id); assert.match(result.summary, /cancelled/);
  assert.equal(c.store.one('SELECT count(*) n FROM gr_messages').n, 1);
  assert.equal(c.store.one('SELECT count(*) n FROM gr_tokens').n, 2);
  c.assertNoExternal();
});

test('Ripresa dopo creazione campagna senza marcatore risultato recupera la stessa campagna', async t => {
  const c = setup(t), original = c.fidelity.handle;
  let interrupted = false;
  c.fidelity.handle = async request => {
    const result = await original(request);
    if (!interrupted && request.method === 'POST' && request.path === '/campaigns') { interrupted = true; throw Error('Interruzione DEMO dopo la campagna'); }
    return result;
  };
  const job = c.job('module-campaign-crash', 'fidelity', {}, 'demo-bottega');
  await assert.rejects(c.run(job, c.owner), /Interruzione DEMO/);
  const campaign = c.store.one('SELECT * FROM fi_campaigns');
  c.fidelity.handle = original;
  const result = await createModuleAgentRunner({ store: c.store, growth: c.growth, fidelity: c.fidelity })(job, c.owner);
  assert.equal(result.links.campaignId, campaign.id);
  assert.equal(c.store.one('SELECT count(*) n FROM fi_campaigns').n, 1);
  assert.equal(c.store.one("SELECT count(*) n FROM os_approvals WHERE kind='fidelity_campaign'").n, 1);
  c.assertNoExternal();
});

test('Risposta commerciale richiede il messaggio pertinente e il solo consenso richiesta non avvia sequenze', async t => {
  const c = setup(t); await c.enable();
  const lead = c.lead();
  await c.call('PATCH', `/leads/${lead.id}`, { consent: 'request', consent_proof: 'Richiesta DEMO registrata dal test' });
  const blocked = await c.run(c.job('module-request-initial', 'commercial', { leadId: lead.id }), c.owner);
  assert.equal(blocked.status, 'needs_input'); assert.match(blocked.summary, /risposta pertinente/);
  c.store.run('INSERT INTO gr_messages(id,workspace,lead_id,direction,subject,body,status,kind,created) VALUES(?,?,?,?,?,?,?,?,?)', 'incoming-module-demo', 'demo-bigant', lead.id, 'in', 'Richiesta DEMO', 'Vorrei un confronto sul sito DEMO', 'received', 'request', new Date().toISOString());
  const reply = await c.run(c.job('module-request-reply', 'commercial', { leadId: lead.id, kind: 'reply', incomingId: 'incoming-module-demo' }), c.owner);
  assert.equal(reply.status, 'completed');
  assert.equal(c.store.one('SELECT kind FROM gr_messages WHERE id=?', reply.links.messageId).kind, 'reply');
  assert.equal(c.store.one('SELECT consent FROM gr_leads WHERE id=?', lead.id).consent, 'request');
  c.assertNoExternal();
});
