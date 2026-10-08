import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { openStore, seedCore } from '../src/store.js';
import { createFidelityModule } from '../src/fidelity.js';
import { buildAppleDefinition, buildGooglePayloads, buildGoogleMessage, googlePassIds } from '../src/fidelity-wallet.js';
import { sanitizeLogo } from '../src/fidelity-branding.js';

function fixture(t) {
  const store = openStore(); seedCore(store); const f = createFidelityModule({ store, origin: 'http://127.0.0.1:4330' }); f.seed(); t.after(() => store.close());
  const owner = store.one('SELECT * FROM os_users WHERE id=?', 'demo-owner'), client = store.one('SELECT * FROM os_users WHERE id=?', 'demo-client'), collaborator = store.one('SELECT * FROM os_users WHERE id=?', 'demo-collaborator');
  const call = async (method, path, body = {}, user = owner, clientId = 'demo-bottega') => (await f.handle({ method, path, body, user, clientId }))?.data;
  return { store, f, owner, client, collaborator, call };
}
const fails = (work, status) => assert.rejects(work, error => error.status === status);
const stampCredit = (amount = 1, idempotencyKey = 'test-credit-demo-0001') => ({ type: 'credit', amount, idempotencyKey });

test('Fidelity usa clienti, utenti e audit comuni e il seed è idempotente', async t => {
  const { store, f, owner, call } = fixture(t);
  const first = f.state('demo-bottega', owner); f.seed(); const second = f.state('demo-bottega', owner);
  assert.equal(first.members.length, second.members.length); assert.equal(first.transactions.length, second.transactions.length);
  assert.equal(second.metrics.members, 1); assert.equal(second.members[0].balance, 4); assert.equal(second.demo, true);
  assert.equal(store.one("SELECT count(*) n FROM sqlite_master WHERE type='table' AND name='tenants'").n, 0);
  assert.ok(store.one("SELECT count(*) n FROM os_audit WHERE action LIKE 'fidelity.%'").n > 0);
  assert.equal((await call('GET', '/tenants')).items.length, 3);
});

test('Permessi ricontrollati nel modulo: cliente, assegnazioni, ruolo falsificato e sessione assente', async t => {
  const { owner, client, collaborator, call } = fixture(t);
  await fails(() => call('GET', '/state', {}, client, 'demo-bigant'), 403);
  await fails(() => call('GET', '/state', {}, collaborator, 'demo-studio'), 403);
  await fails(() => call('GET', '/state', {}, { ...client, role: 'owner' }), 403);
  await fails(() => call('GET', '/state', {}, null), 401);
  assert.equal((await call('GET', '/state', {}, owner)).metrics.members, 1);
  assert.equal((await call('GET', '/state', {}, collaborator)).campaigns.length, 0);
});

test('Operatore assegnato accredita ma non gestisce campagne, programmi, export o storni', async t => {
  const { collaborator, call } = fixture(t);
  const credit = await call('POST', '/members/fi-demo-member/transactions', stampCredit(1), collaborator);
  assert.equal(credit.member.balance, 5);
  for (const [method, path, body] of [['POST', '/programs', {}], ['GET', '/members/export', {}], ['GET', '/campaigns', {}], ['DELETE', '/members/fi-demo-member', {}], ['POST', `/transactions/${credit.transaction.id}/reverse`, { note: 'Motivo DEMO', idempotencyKey: 'reverse-key-demo-001' }]]) await fails(() => call(method, path, body, collaborator), 403);
});

test('Isolamento sulle letture, sui QR e sulle operazioni indipendentemente dagli ID nel body', async t => {
  const { call } = fixture(t);
  await fails(() => call('GET', '/members/fi-demo-bigant-member'), 404);
  await fails(() => call('POST', '/members/fi-demo-bigant-member/transactions', stampCredit(1)), 404);
  await fails(() => call('POST', '/scan', { code: 'fi-demo-bigant-member' }), 404);
  await fails(() => call('POST', '/members', { programId: 'fi-demo-points', name: 'DEMO Altrui', email: 'altrui@test.example' }), 404);
});

test('Accredito idempotente, conflitto su payload diverso e nessun doppio job', async t => {
  const { store, call } = fixture(t), body = stampCredit(6);
  const first = await call('POST', '/members/fi-demo-member/transactions', body), count = store.one('SELECT count(*) n FROM fi_jobs').n;
  const retry = await call('POST', '/members/fi-demo-member/transactions', body);
  assert.deepEqual(retry, first); assert.equal(store.one('SELECT count(*) n FROM fi_jobs').n, count); assert.equal(first.member.balance, 10);
  await fails(() => call('POST', '/members/fi-demo-member/transactions', { ...body, amount: 7 }), 409);
});

test('Riscatto fissato dal server e saldo mai negativo', async t => {
  const { call } = fixture(t); await call('POST', '/members/fi-demo-member/transactions', stampCredit(6));
  await fails(() => call('POST', '/members/fi-demo-member/transactions', { type: 'redeem', amount: 1, idempotencyKey: 'wrong-cost-demo-001' }), 400);
  const result = await call('POST', '/members/fi-demo-member/transactions', { type: 'redeem', idempotencyKey: 'redeem-demo-key-001' }); assert.equal(result.member.balance, 0); assert.equal(result.member.rewardCount, 1);
  await fails(() => call('POST', '/members/fi-demo-member/transactions', { type: 'redeem', idempotencyKey: 'redeem-demo-key-002' }), 409);
});

test('Punti da centesimi arrotondati e rifiuto quantità ambigue', async t => {
  const { call } = fixture(t);
  const result = await call('POST', '/members/fi-demo-bigant-member/transactions', { type: 'credit', spendCents: 101, idempotencyKey: 'points-demo-key-001' }, undefined, 'demo-bigant'); assert.equal(result.member.balance, 1);
  await fails(() => call('POST', '/members/fi-demo-bigant-member/transactions', { type: 'credit', amount: 1, spendCents: 100, idempotencyKey: 'points-demo-key-002' }, undefined, 'demo-bigant'), 400);
  await fails(() => call('POST', '/members/fi-demo-member/transactions', { type: 'credit', spendCents: 100, idempotencyKey: 'stamps-euro-key-001' }), 400);
});

test('Coupon monouso iscritto con saldo uno e impossibile ricaricarlo', async t => {
  const { call } = fixture(t);
  const m = await call('POST', '/members', { programId: 'fi-demo-coupon', name: 'Coupon DEMO', email: 'coupon@test.example' }); assert.equal(m.balance, 1);
  await fails(() => call('POST', `/members/${m.id}/transactions`, stampCredit(1)), 400);
  assert.equal((await call('POST', `/members/${m.id}/transactions`, { type: 'redeem', idempotencyKey: 'coupon-redeem-001' })).member.balance, 0);
  await fails(() => call('POST', `/members/${m.id}/transactions`, { type: 'redeem', idempotencyKey: 'coupon-redeem-002' }), 409);
});

test('Storno atomico una volta, idempotente e rifiutato se renderebbe negativo il saldo', async t => {
  const { call } = fixture(t), credit = await call('POST', '/members/fi-demo-member/transactions', stampCredit(6));
  const redemption = await call('POST', '/members/fi-demo-member/transactions', { type: 'redeem', idempotencyKey: 'redeem-for-reverse' });
  await fails(() => call('POST', `/transactions/${credit.transaction.id}/reverse`, { note: 'Errore DEMO', idempotencyKey: 'credit-reverse-001' }), 409);
  const body = { note: 'Errore DEMO', idempotencyKey: 'redemption-reverse-001' }, reverse = await call('POST', `/transactions/${redemption.transaction.id}/reverse`, body);
  assert.equal(reverse.member.balance, 10); assert.equal(reverse.member.rewardCount, 0);
  assert.deepEqual(await call('POST', `/transactions/${redemption.transaction.id}/reverse`, body), reverse);
  await fails(() => call('POST', `/transactions/${redemption.transaction.id}/reverse`, { ...body, idempotencyKey: 'redemption-reverse-002' }), 409);
});

test('Modifica parziale conserva impostazioni, soglia/tipo diventano invarianti dopo iscrizione', async t => {
  const { call } = fixture(t);
  const original = await call('GET', '/programs/fi-demo-stamps'); const changed = await call('PATCH', '/programs/fi-demo-stamps', { name: 'Programma rinominato DEMO' });
  assert.equal(changed.color, original.color); assert.equal(changed.rewardThreshold, original.rewardThreshold);
  await fails(() => call('PATCH', '/programs/fi-demo-stamps', { rewardThreshold: 11 }), 409);
  await fails(() => call('PATCH', '/programs/fi-demo-stamps', { type: 'points' }), 409);
  const member = await call('PATCH', '/members/fi-demo-member', { phone: '0000000000' }); assert.equal(member.marketingConsent, true);
});

test('Iscrizione pubblica richiede termini e non rivela token per email duplicata', async t => {
  const { call } = fixture(t), body = { programId: 'fi-demo-stamps', name: 'Pubblico DEMO', email: 'pubblico@test.example', marketingConsent: false };
  await fails(() => call('POST', '/public/join/bottega-demo', body, null), 400);
  const result = await call('POST', '/public/join/bottega-demo', { ...body, acceptTerms: true }, null); assert.ok(result.token.length > 32);
  await fails(() => call('POST', '/public/join/bottega-demo', { ...body, acceptTerms: true }, null), 409);
  await fails(() => call('POST', '/public/join/bottega-demo', { ...body, programId: 'fi-demo-points', email: 'x@test.example', acceptTerms: true }, null), 404);
});

test('Carta pubblica senza contatti, segreti o ledger; revoca consenso registrata', async t => {
  const { store, call } = fixture(t), m = (await call('GET', '/members/fi-demo-member')).member;
  const card = await call('GET', `/public/cards/${m.publicToken}`, {}, null);
  const serialized = JSON.stringify(card); assert.ok(!serialized.includes(m.email)); assert.ok(!serialized.includes('apple_auth')); assert.ok(!serialized.includes('transactions'));
  await call('PATCH', `/public/cards/${m.publicToken}/consent`, { marketingConsent: false }, null);
  assert.equal(store.one('SELECT marketing_consent FROM fi_members WHERE id=?', m.id).marketing_consent, 0);
  assert.equal(store.one('SELECT count(*) n FROM fi_consents WHERE member_id=?', m.id).n, 2);
});

test('Scanner accetta codice e URL del server, rifiuta URL esterno', async t => {
  const { call } = fixture(t), m = (await call('GET', '/members/fi-demo-member')).member;
  assert.equal((await call('POST', '/scan', { code: m.cardUrl })).member.id, m.id);
  assert.equal((await call('POST', '/scan', { code: m.publicToken })).member.id, m.id);
  await fails(() => call('POST', '/scan', { code: `https://evil.example/fidelity/card/${m.publicToken}` }), 400);
});

test('Campagna solo opt-in, approvazione comune, delivery bloccate e nessun falso invio', async t => {
  const { store, call } = fixture(t);
  await call('POST', '/members', { programId: 'fi-demo-stamps', name: 'Senza Consenso DEMO', email: 'no@test.example', marketingConsent: false });
  const c = await call('POST', '/campaigns', { name: 'Campagna DEMO', title: 'Un nuovo incontro', body: 'Questo è un testo dimostrativo.', segment: 'all' });
  assert.equal((await call('GET', `/campaigns/${c.id}/preview`)).recipients.length, 1);
  const prepared = await call('POST', `/campaigns/${c.id}/prepare`); assert.equal(prepared.recipients, 1); assert.equal(prepared.externalSent, 0); assert.equal(prepared.campaign.sentCount, 0);
  assert.equal(store.one('SELECT count(*) n FROM os_approvals WHERE kind=? AND entity_id=?', 'fidelity_campaign', c.id).n, 1);
  assert.equal(store.one("SELECT count(*) n FROM fi_deliveries WHERE campaign_id=? AND status='blocked'", c.id).n, 2);
  await fails(() => call('POST', `/campaigns/${c.id}/prepare`), 409);
  await fails(() => call('POST', `/campaigns/${c.id}/send`), 409);
  await call('PATCH', '/members/fi-demo-member', { marketingConsent: false }); assert.equal(store.one("SELECT count(*) n FROM fi_deliveries WHERE campaign_id=? AND error='Consenso revocato'", c.id).n, 2);
});

test('Automazione inattivi rispetta consenso, anzianità e cooldown, prepara senza inviare', async t => {
  const { store, call } = fixture(t);
  store.run('UPDATE fi_members SET created_at=?,last_visit_at=NULL WHERE id=?', new Date(Date.now() - 40 * 86400000).toISOString(), 'fi-demo-member');
  const a = await call('POST', '/automations', { name: 'Ritorni DEMO', title: 'Ci rivediamo', body: 'Messaggio dimostrativo.', inactiveDays: 30, cooldownDays: 14 });
  const first = await call('POST', `/automations/${a.id}/run`), retry = await call('POST', `/automations/${a.id}/run`); assert.equal(first.recipients, 1); assert.equal(first.externalSent, 0); assert.equal(retry.recipients, 0);
  await call('PATCH', `/automations/${a.id}`, { active: false }); await fails(() => call('POST', `/automations/${a.id}/run`), 409);
});

test('Tick locale prepara campagne scadute una sola volta e conserva la pianificazione futura', async t => {
  const { call } = fixture(t);
  const body = { name: 'Campagna calendario DEMO', title: 'Calendario DEMO', body: 'Prova pianificazione.', segment: 'all' };
  const due = await call('POST', '/campaigns', { ...body, scheduledAt: new Date(Date.now() - 60000).toISOString() }), future = await call('POST', '/campaigns', { ...body, scheduledAt: new Date(Date.now() + 86400000).toISOString() });
  assert.equal((await call('POST', '/tick')).prepared.length, 1); assert.equal((await call('POST', '/tick')).prepared.length, 0);
  assert.equal((await call('GET', `/campaigns/${due.id}`)).campaign.status, 'awaiting_approval'); assert.equal((await call('GET', `/campaigns/${future.id}`)).campaign.status, 'draft');
});

test('Anonimizzazione revoca subito link e rimuove contatti da idempotenza/job/storico', async t => {
  const { store, call } = fixture(t), m = (await call('GET', '/members/fi-demo-member')).member;
  await call('POST', '/members/fi-demo-member/transactions', { ...stampCredit(1), note: 'Annotazione privata DEMO' });
  await call('DELETE', '/members/fi-demo-member');
  await fails(() => call('GET', `/public/cards/${m.publicToken}`, {}, null), 404);
  assert.equal(store.one('SELECT count(*) n FROM fi_idempotency WHERE response_json LIKE ?', `%${m.email}%`).n, 0);
  assert.equal(store.one('SELECT phone FROM fi_members WHERE id=?', m.id).phone, '');
  assert.equal(store.one("SELECT count(*) n FROM fi_transactions WHERE member_id=? AND note!=''", m.id).n, 0);
  assert.equal(store.one("SELECT count(*) n FROM fi_jobs WHERE member_id=? AND type='wallet_revoke' AND status='blocked'", m.id).n, 1);
});

test('Wallet preview usa payload originali senza segreti; emissione disabilitata prima di ogni effetto', async t => {
  const { store, call } = fixture(t), m = (await call('GET', '/members/fi-demo-member')).member;
  const preview = await call('GET', '/members/fi-demo-member/wallet-preview'); assert.equal(preview.issued, false); assert.equal(preview.google.kind, 'loyalty'); assert.equal(preview.apple.authenticationToken, undefined);
  await fails(() => call('GET', `/public/cards/${m.publicToken}/google`, {}, null), 409);
  await fails(() => call('GET', `/public/cards/${m.publicToken}/apple`, {}, null), 409);
  await fails(() => call('POST', '/jobs/retry'), 409);
  assert.equal(store.one('SELECT google_issued+apple_issued n FROM fi_members WHERE id=?', m.id).n, 0);
});

test('Generatori wallet: coupon revocato, identificativi isolati, validazione input e messaggio testuale', () => {
  const m = { id: 'member-demo', publicToken: 'public-demo-token-12345', appleAuthToken: 'apple-demo-token-123456789', name: 'Persona DEMO', balance: 0, rewardCount: 1, updatedAt: '2026-10-08T00:00:00Z' }, p = { id: 'program-demo', name: 'Coupon DEMO', tenantName: 'Attività DEMO', type: 'coupon', rewardThreshold: 1, rewardName: 'Premio DEMO', color: '#F26B21', description: 'Prova offline' };
  const google = buildGooglePayloads(m, p, '12345', 'https://demo.example'); assert.equal(google.kind, 'offer'); assert.equal(google.objectPayload.state, 'INACTIVE'); assert.ok(!JSON.stringify(google).includes(m.appleAuthToken));
  assert.equal(buildAppleDefinition(m, p, { baseUrl: 'https://demo.example', passTypeId: 'pass.example.demo', teamId: 'DEMO' }).voided, true);
  assert.notEqual(googlePassIds('12345', m, p).objectId, googlePassIds('12345', m, { ...p, id: 'other-program' }).objectId);
  assert.throws(() => buildGooglePayloads({ ...m, balance: -1 }, p, '12345', 'https://demo.example'));
  assert.equal(buildGoogleMessage({ id: 'demo', title: '<titolo>', body: 'testo <demo>' }).message.body, 'testo demo');
});

test('Logo PNG/JPEG/WebP decodificato, normalizzato e privato di metadati; input pericolosi respinti', async () => {
  for (const format of ['png', 'jpeg', 'webp']) {
    const image = await sharp({ create: { width: 3, height: 2, channels: 4, background: { r: 242, g: 107, b: 33, alpha: .5 } } }).toFormat(format).toBuffer();
    const out = await sanitizeLogo(`data:image/${format};base64,${image.toString('base64')}`), meta = await sharp(out).metadata(); assert.equal(meta.width, 320); assert.equal(meta.height, 100); assert.equal(meta.format, 'png'); assert.equal(meta.exif, undefined);
  }
  await fails(() => sanitizeLogo('data:image/svg+xml;base64,PHN2Zz4='), 400);
  await fails(() => sanitizeLogo('https://example.com/image.png'), 400);
  await fails(() => sanitizeLogo('data:image/png;base64,YWJjZA=='), 400);
  const giant = await sharp({ create: { width: 1500, height: 1500, channels: 3, background: '#ffffff' } }).png().toBuffer(); await fails(() => sanitizeLogo(`data:image/png;base64,${giant.toString('base64')}`), 400);
});

test('Logo autorizzato, aggiornamento solo propri iscritti, route pubblica senza accessi riservati', async t => {
  const { store, client, call, f } = fixture(t), bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#F26B21' } }).png().toBuffer(), body = { dataUrl: 'data:image/png;base64,' + bytes.toString('base64') };
  const before = store.one('SELECT count(*) n FROM fi_jobs WHERE tenant_id=?', 'demo-bigant').n;
  await call('POST', '/programs/fi-demo-stamps/logo', body, client);
  assert.equal(store.one('SELECT count(*) n FROM fi_jobs WHERE tenant_id=?', 'demo-bigant').n, before);
  const out = await f.handle({ method: 'GET', path: '/branding/fi-demo-stamps.png' }); assert.equal(out.contentType, 'image/png'); assert.ok(Buffer.isBuffer(out.data));
  await fails(() => call('POST', '/programs/fi-demo-points/logo', body, client), 404);
});

test('Documenti e anagrafiche comuni; sospensione blocca carte senza modificare altre attività', async t => {
  const { store, call } = fixture(t), m = (await call('GET', '/members/fi-demo-member')).member;
  await call('PATCH', '/settings/policies', { privacyUrl: 'https://demo.example/privacy', termsText: 'Regolamento dimostrativo.' }); assert.equal(store.one('SELECT privacy_url FROM os_clients WHERE id=?', 'demo-bottega').privacy_url, 'https://demo.example/privacy');
  await fails(() => call('PATCH', '/settings/policies', { privacyUrl: 'javascript:alert(1)', termsText: '' }), 400);
  await call('PATCH', '/tenants/demo-bottega', { active: false });
  await fails(() => call('GET', `/public/cards/${m.publicToken}`, {}, null), 404);
  assert.equal(store.one('SELECT active FROM os_clients WHERE id=?', 'demo-bigant').active, 1);
});

test('Export neutralizza formule e registro clienti non include audit amministrativo', async t => {
  const { store, f, owner, call } = fixture(t); await call('PATCH', '/members/fi-demo-member', { name: '=DEMO formula' });
  const exportFile = await f.handle({ method: 'GET', path: '/members/export', user: owner, clientId: 'demo-bottega' }); assert.ok(exportFile.data.includes("'=DEMO formula"));
  store.audit(owner, 'demo-bottega', 'finance.private', 'demo', { secret: 'costo dimostrativo' }, 'admin');
  assert.ok(!(await call('GET', '/audit')).items.some(x => x.action === 'finance.private'));
});

test('Decisione campagna comune: titolare corretto approva, una sola decisione e nessun invio', async t => {
  const { store, client, collaborator, call } = fixture(t);
  const c = await call('POST', '/campaigns', { name: 'Approvazione DEMO', title: 'Titolo DEMO', body: 'Bozza da verificare.' });
  await call('POST', `/campaigns/${c.id}/prepare`);
  await fails(() => call('POST', `/campaigns/${c.id}/decision`, { decision: 'approved', version: 1 }, collaborator), 403);
  await fails(() => call('POST', `/campaigns/${c.id}/decision`, { decision: 'approved', version: 2 }, client), 409);
  const approved = await call('POST', `/campaigns/${c.id}/decision`, { decision: 'approved', version: 1 }, client);
  assert.equal(approved.campaign.status, 'approved'); assert.equal(approved.externalSent, 0);
  assert.equal(store.one("SELECT decision_by FROM os_approvals WHERE kind='fidelity_campaign' AND entity_id=?", c.id).decision_by, client.id);
  await fails(() => call('POST', `/campaigns/${c.id}/decision`, { decision: 'rejected', reason: 'Seconda decisione', version: 1 }, client), 409);
  await fails(() => call('PATCH', `/campaigns/${c.id}`, { title: 'Cambio non approvato' }), 409);
  await fails(() => call('POST', `/campaigns/${c.id}/send`), 409);
});

test('Richiesta modifiche persistita nella memoria giusta; revisione richiede nuova approvazione', async t => {
  const { store, client, call } = fixture(t);
  const c = await call('POST', '/campaigns', { name: 'Feedback DEMO', title: 'Titolo prima', body: 'Prima bozza DEMO.' });
  await call('POST', `/campaigns/${c.id}/prepare`);
  await fails(() => call('POST', `/campaigns/${c.id}/decision`, { decision: 'changes', reason: '', version: 1 }), 400);
  const changed = await call('POST', `/campaigns/${c.id}/decision`, { decision: 'changes', reason: 'Usare un tono più semplice.', version: 1 }, client);
  assert.equal(changed.campaign.status, 'changes_requested');
  const memory = store.one("SELECT * FROM os_memory WHERE client_id='demo-bottega' AND kind='fidelity-feedback'"); assert.ok(memory.content.includes('Usare un tono più semplice.'));
  assert.equal(store.one("SELECT count(*) n FROM os_memory WHERE client_id='demo-studio' AND kind='fidelity-feedback'").n, 0);
  const revised = await call('PATCH', `/campaigns/${c.id}`, { body: 'Seconda bozza DEMO, più semplice.', version: 1 }); assert.equal(revised.version, 2); assert.equal(revised.status, 'draft');
  await call('POST', `/campaigns/${c.id}/prepare`);
  await fails(() => call('POST', `/campaigns/${c.id}/decision`, { decision: 'approved', version: 1 }), 409);
  assert.equal((await call('POST', `/campaigns/${c.id}/decision`, { decision: 'approved', version: 2 })).campaign.status, 'approved');
  assert.equal(store.one("SELECT count(*) n FROM os_approvals WHERE kind='fidelity_campaign' AND entity_id=?", c.id).n, 2);
  assert.ok(store.one("SELECT body FROM os_approvals WHERE kind='fidelity_campaign' AND entity_id=? AND version=1", c.id).body.includes('Prima bozza DEMO.'));
});

test('Rifiuto campagna mantiene feedback e decisioni fuori dall’attività altrui', async t => {
  const { store, call } = fixture(t), other = store.one('SELECT * FROM os_users WHERE id=?', 'demo-client-other');
  const c = await call('POST', '/campaigns', { name: 'Rifiuto DEMO', title: 'Messaggio DEMO', body: 'Bozza dimostrativa.' }); await call('POST', `/campaigns/${c.id}/prepare`);
  await fails(() => call('POST', `/campaigns/${c.id}/decision`, { decision: 'approved', version: 1 }, other, 'demo-studio'), 404);
  const result = await call('POST', `/campaigns/${c.id}/decision`, { decision: 'rejected', reason: 'Offerta non coerente con il programma.', version: 1 }); assert.equal(result.campaign.status, 'rejected');
  assert.ok(store.one("SELECT content FROM os_memory WHERE client_id='demo-bottega' AND kind='fidelity-feedback'").content.includes('Offerta non coerente'));
});

test('Icona wallet pubblica e URL payload appartengono al namespace unificato OS', async t => {
  const { f, call } = fixture(t);
  const icon = await f.handle({ method: 'GET', path: '/wallet/icon.png' }); assert.equal(icon.contentType, 'image/png');
  const meta = await sharp(icon.data).metadata(); assert.equal(meta.width, 256); assert.equal(meta.height, 256);
  const preview = await call('GET', '/members/fi-demo-member/wallet-preview');
  assert.ok(preview.google.classPayload.programLogo.sourceUri.uri.endsWith('/api/fidelity/wallet/icon.png'));
  assert.ok(preview.google.objectPayload.linksModuleData.uris[0].uri.includes('/fidelity/card/'));
  assert.ok(preview.apple.webServiceURL.endsWith('/api/fidelity/wallet/apple'));
});
