// Dominio adattato da Fidelity 350d64f: una sola identità, cliente, audit e connessione SQLite OS.
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { AppError, requireClient, requireOwner, now } from './store.js';
import { buildGooglePayloads, buildAppleDefinition } from './fidelity-wallet.js';
import { sanitizeLogo } from './fidelity-branding.js';
import { walletIconPng } from './fidelity-icon.js';

const uid = () => randomUUID();
const token = () => randomBytes(32).toString('base64url');
const needed = (x, message = 'Elemento non trovato.') => { if (!x) throw new AppError(message, 404); return x; };
function str(v, label, min = 0, max = 1000) {
  if (typeof v !== 'string' || v.trim().length < min || v.trim().length > max) throw new AppError(`${label}: testo non valido.`);
  return v.trim();
}
function num(v, label, min = 0, max = 1000000, integral = true) {
  if (typeof v !== 'number' || !Number.isFinite(v) || (integral && !Number.isSafeInteger(v)) || v < min || v > max) throw new AppError(`${label}: numero non valido.`);
  return v;
}
function bool(v, label) { if (typeof v !== 'boolean') throw new AppError(`${label}: valore non valido.`); return v; }
function choice(v, choices, label) { if (!choices.includes(v)) throw new AppError(`${label}: valore non valido.`); return v; }
function date(v) { if (v === null) return null; if (typeof v !== 'string' || !Number.isFinite(Date.parse(v))) throw new AppError('Data non valida.'); return new Date(v).toISOString(); }
function color(v) { if (!/^#[a-f\d]{6}$/i.test(v)) throw new AppError('Colore non valido.'); return v; }
function email(v) { const e = str(v, 'Email', 3, 254).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new AppError('Email non valida.'); return e; }
function locations(v) {
  if (!Array.isArray(v) || v.length > 10) throw new AppError('Massimo 10 posizioni.');
  return v.map(x => ({ latitude: num(x.latitude, 'Latitudine', -90, 90, false), longitude: num(x.longitude, 'Longitudine', -180, 180, false), relevantText: str(x.relevantText ?? '', 'Descrizione posizione', 0, 100) }));
}
const externalError = () => { throw new AppError('Servizio non collegato: operazione esterna disabilitata nella demo.', 409); };
const walletStatus = () => ({ apple: { configured: false, missing: ['Certificati e attivazione Apple: non collegati'], status: 'disconnected' }, google: { configured: false, missing: ['Issuer e account Google: non collegati'], status: 'disconnected' } });

export function createFidelityModule({ store: s, origin = 'http://127.0.0.1:4330' }) {
  const base = new URL(origin).origin;
  s.db.exec(`
    CREATE TABLE IF NOT EXISTS fi_meta(key TEXT PRIMARY KEY,value INTEGER NOT NULL);
    INSERT OR IGNORE INTO fi_meta VALUES('sequence',0);
    CREATE TABLE IF NOT EXISTS fi_programs(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL REFERENCES os_clients(id),name TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN('stamps','points','coupon')),description TEXT NOT NULL DEFAULT '',reward_threshold INTEGER NOT NULL CHECK(reward_threshold>0),reward_name TEXT NOT NULL,color TEXT NOT NULL,points_per_euro REAL NOT NULL DEFAULT 1,active INTEGER NOT NULL DEFAULT 1,expires_at TEXT,locations_json TEXT NOT NULL DEFAULT '[]',created_at TEXT NOT NULL,UNIQUE(id,tenant_id));
    CREATE TABLE IF NOT EXISTS fi_members(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL REFERENCES os_clients(id),program_id TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL DEFAULT '',marketing_consent INTEGER NOT NULL DEFAULT 0,consent_at TEXT NOT NULL,privacy_version TEXT NOT NULL DEFAULT 'demo-1',balance INTEGER NOT NULL DEFAULT 0 CHECK(balance>=0),total_earned INTEGER NOT NULL DEFAULT 0 CHECK(total_earned>=0),reward_count INTEGER NOT NULL DEFAULT 0 CHECK(reward_count>=0),public_token TEXT UNIQUE NOT NULL,apple_auth_token TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN('active','deleted')),offer TEXT,last_visit_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,update_seq INTEGER NOT NULL DEFAULT 0,google_issued INTEGER NOT NULL DEFAULT 0,apple_issued INTEGER NOT NULL DEFAULT 0,FOREIGN KEY(program_id,tenant_id) REFERENCES fi_programs(id,tenant_id),UNIQUE(id,tenant_id));
    CREATE UNIQUE INDEX IF NOT EXISTS fi_unique_email ON fi_members(program_id,email) WHERE status='active';
    CREATE TABLE IF NOT EXISTS fi_transactions(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,member_id TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN('credit','redeem','reversal')),amount INTEGER NOT NULL,balance_after INTEGER NOT NULL CHECK(balance_after>=0),note TEXT NOT NULL DEFAULT '',actor_id TEXT REFERENCES os_users(id),reversal_of TEXT UNIQUE REFERENCES fi_transactions(id),created_at TEXT NOT NULL,FOREIGN KEY(member_id,tenant_id) REFERENCES fi_members(id,tenant_id));
    CREATE TABLE IF NOT EXISTS fi_idempotency(tenant_id TEXT NOT NULL,key TEXT NOT NULL,fingerprint TEXT NOT NULL,response_json TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(tenant_id,key));
    CREATE TABLE IF NOT EXISTS fi_consents(id TEXT PRIMARY KEY,member_id TEXT NOT NULL REFERENCES fi_members(id),granted INTEGER NOT NULL,source TEXT NOT NULL,version TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS fi_campaigns(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL REFERENCES os_clients(id),name TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,segment TEXT NOT NULL,program_id TEXT REFERENCES fi_programs(id),status TEXT NOT NULL DEFAULT 'draft',scheduled_at TEXT,version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS fi_deliveries(id TEXT PRIMARY KEY,campaign_id TEXT NOT NULL REFERENCES fi_campaigns(id),member_id TEXT NOT NULL REFERENCES fi_members(id),channel TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'blocked',error TEXT,sent_at TEXT,UNIQUE(campaign_id,member_id,channel));
    CREATE TABLE IF NOT EXISTS fi_jobs(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL REFERENCES os_clients(id),member_id TEXT NOT NULL REFERENCES fi_members(id),type TEXT NOT NULL,payload_json TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'blocked',attempts INTEGER NOT NULL DEFAULT 0,error TEXT,available_at TEXT NOT NULL,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS fi_automations(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL REFERENCES os_clients(id),name TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,inactive_days INTEGER NOT NULL,cooldown_days INTEGER NOT NULL,program_id TEXT REFERENCES fi_programs(id),active INTEGER NOT NULL DEFAULT 1,last_run_at TEXT,created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS fi_automation_runs(automation_id TEXT NOT NULL REFERENCES fi_automations(id),member_id TEXT NOT NULL REFERENCES fi_members(id),prepared_at TEXT NOT NULL,PRIMARY KEY(automation_id,member_id));
    CREATE TABLE IF NOT EXISTS fi_branding(program_id TEXT PRIMARY KEY REFERENCES fi_programs(id),tenant_id TEXT NOT NULL REFERENCES os_clients(id),png BLOB NOT NULL,updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS fi_members_tenant ON fi_members(tenant_id,status);
    CREATE INDEX IF NOT EXISTS fi_transactions_member ON fi_transactions(member_id,created_at);
    CREATE INDEX IF NOT EXISTS fi_jobs_tenant ON fi_jobs(tenant_id,status,available_at);
  `);
  const audit = (u, t, a, id, detail = {}) => s.audit(u, t, `fidelity.${a}`, id, detail, 'client');
  const tenant = id => needed(s.one('SELECT * FROM os_clients WHERE id=?', id));
  const program = (id, t) => needed(s.one('SELECT * FROM fi_programs WHERE id=? AND tenant_id=?', id, t));
  const member = (id, t, active = true) => needed(s.one(`SELECT * FROM fi_members WHERE id=? AND tenant_id=?${active ? " AND status='active'" : ''}`, id, t));
  const seq = () => { s.run("UPDATE fi_meta SET value=value+1 WHERE key='sequence'"); return s.one("SELECT value FROM fi_meta WHERE key='sequence'").value; };
  const manager = u => { if (!['owner', 'client'].includes(u?.role)) throw new AppError('Operazione riservata al gestore dell’attività.', 403); };
  function authorized(u, t) {
    if (!u) throw new AppError('Accedi per continuare.', 401);
    const live = s.one('SELECT id,active,role,tenant_id FROM os_users WHERE id=?', u.id);
    if (!live?.active || live.role !== u.role || live.tenant_id !== (u.tenant_id ?? null)) throw new AppError('Accesso non valido.', 403);
    requireClient(s, u, t);
  }
  function activeProgram(id, t) { const p = program(id, t); if (!tenant(t).active || !p.active || (p.expires_at && p.expires_at <= now())) throw new AppError('Programma non attivo o scaduto.', 409); return p; }
  function queue(t, m, type = 'wallet_update', payload = {}) {
    const id = uid(); s.run('INSERT INTO fi_jobs(id,tenant_id,member_id,type,payload_json,error,available_at,created_at) VALUES(?,?,?,?,?,?,?,?)', id, t, m, type, JSON.stringify(payload), 'Provider scollegati: nessuna operazione esterna eseguita.', now(), now()); return id;
  }
  function programJson(p) {
    const t = tenant(p.tenant_id);
    return { id: p.id, tenantId: p.tenant_id, clientId: p.tenant_id, name: p.name, type: p.type, description: p.description, rewardThreshold: p.reward_threshold, rewardName: p.reward_name, color: p.color, pointsPerEuro: p.points_per_euro, active: !!p.active, expiresAt: p.expires_at, locations: JSON.parse(p.locations_json), createdAt: p.created_at, memberCount: s.one("SELECT count(*) n FROM fi_members WHERE program_id=? AND status='active'", p.id).n, joinUrl: `${base}/fidelity/join/${encodeURIComponent(t.slug)}?program=${encodeURIComponent(p.id)}`, logoUrl: s.one('SELECT 1 FROM fi_branding WHERE program_id=?', p.id) ? `${base}/api/fidelity/branding/${encodeURIComponent(p.id)}.png` : null };
  }
  function memberJson(m) {
    const p = program(m.program_id, m.tenant_id);
    return { id: m.id, tenantId: m.tenant_id, clientId: m.tenant_id, programId: p.id, programName: p.name, programType: p.type, name: m.name, email: m.email, phone: m.phone, marketingConsent: !!m.marketing_consent, balance: m.balance, totalEarned: m.total_earned, rewardCount: m.reward_count, availableRewards: Math.floor(m.balance / p.reward_threshold), status: m.status, createdAt: m.created_at, updatedAt: m.updated_at, lastVisitAt: m.last_visit_at, cardUrl: m.status === 'active' ? `${base}/fidelity/card/${m.public_token}` : '', publicToken: m.status === 'active' ? m.public_token : '' };
  }
  function transactionJson(x) {
    const m = member(x.member_id, x.tenant_id, false), p = program(m.program_id, x.tenant_id);
    return { id: x.id, memberId: x.member_id, memberName: m.name, programName: p.name, type: x.type, amount: x.amount, balanceAfter: x.balance_after, note: x.note, actorName: x.actor_id ? s.one('SELECT name FROM os_users WHERE id=?', x.actor_id)?.name ?? 'Operatore' : 'Iscrizione', createdAt: x.created_at, reversalOf: x.reversal_of, reversed: !!s.one('SELECT 1 FROM fi_transactions WHERE reversal_of=?', x.id) };
  }
  function campaignJson(c) {
    const counts = s.query('SELECT status,count(*) n FROM fi_deliveries WHERE campaign_id=? GROUP BY status', c.id);
    return { id: c.id, tenantId: c.tenant_id, name: c.name, title: c.title, body: c.body, segment: c.segment, programId: c.program_id, status: c.status, scheduledAt: c.scheduled_at, createdAt: c.created_at, version: c.version, recipientCount: s.one("SELECT count(DISTINCT member_id) n FROM fi_deliveries WHERE campaign_id=? AND status!='superseded'", c.id).n, sentCount: 0, blockedCount: counts.find(x => x.status === 'blocked')?.n ?? 0, failedCount: counts.find(x => x.status === 'failed')?.n ?? 0, simulated: true };
  }
  const automationJson = a => ({ id: a.id, name: a.name, title: a.title, body: a.body, inactiveDays: a.inactive_days, cooldownDays: a.cooldown_days, programId: a.program_id, active: !!a.active, lastRunAt: a.last_run_at, createdAt: a.created_at, mode: 'prepare_only' });
  function validateProgram(b, partial = false) {
    const p = {};
    for (const [key, def, validator] of [
      ['name', undefined, v => str(v, 'Nome', 2, 120)], ['type', undefined, v => choice(v, ['stamps', 'points', 'coupon'], 'Tipo')], ['description', '', v => str(v, 'Descrizione', 0, 1000)],
      ['rewardThreshold', undefined, v => num(v, 'Soglia', 1)], ['rewardName', undefined, v => str(v, 'Premio', 2, 120)], ['color', '#F26B21', color],
      ['pointsPerEuro', 1, v => num(v, 'Punti per euro', .01, 1000, false)], ['expiresAt', null, date], ['locations', [], locations], ['active', true, v => bool(v, 'Attivo')]
    ]) if (Object.hasOwn(b, key)) p[key] = validator(b[key]); else if (!partial) p[key] = validator(def);
    if (p.type === 'coupon') p.rewardThreshold = 1;
    return p;
  }
  function createProgram(t, b, u, forcedId) {
    const p = validateProgram(b), id = forcedId ?? uid(); tenant(t);
    s.run('INSERT INTO fi_programs(id,tenant_id,name,type,description,reward_threshold,reward_name,color,points_per_euro,active,expires_at,locations_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)', id, t, p.name, p.type, p.description, p.rewardThreshold, p.rewardName, p.color, p.pointsPerEuro, +p.active, p.expiresAt, JSON.stringify(p.locations), now());
    audit(u, t, 'program.created', id); return programJson(program(id, t));
  }
  function updateConsent(m, granted, source) {
    s.run('UPDATE fi_members SET marketing_consent=?,consent_at=? WHERE id=?', +granted, now(), m.id);
    s.run('INSERT INTO fi_consents VALUES(?,?,?,?,?,?)', uid(), m.id, +granted, source, 'demo-1', now());
    if (!granted) s.run("UPDATE fi_deliveries SET status='blocked',error='Consenso revocato' WHERE member_id=? AND sent_at IS NULL", m.id);
  }
  function createMember(t, b, u, source = 'operator', forcedId) {
    const p = activeProgram(str(b.programId, 'Programma', 1, 128), t), name = str(b.name, 'Nome', 2, 120), address = email(b.email), phone = str(b.phone ?? '', 'Telefono', 0, 30), consent = bool(b.marketingConsent ?? false, 'Consenso');
    if (s.one("SELECT id FROM fi_members WHERE program_id=? AND email=? AND status='active'", p.id, address)) throw new AppError('Tessera già presente. Rivolgiti all’attività per recuperarla.', 409);
    return s.transaction(() => {
      const id = forcedId ?? uid(), time = now(), balance = p.type === 'coupon' ? 1 : 0;
      s.run('INSERT INTO fi_members(id,tenant_id,program_id,name,email,phone,marketing_consent,consent_at,balance,total_earned,public_token,apple_auth_token,created_at,updated_at,update_seq) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', id, t, p.id, name, address, phone, +consent, time, balance, balance, token(), token(), time, time, seq());
      s.run('INSERT INTO fi_consents VALUES(?,?,?,?,?,?)', uid(), id, +consent, source, 'demo-1', time);
      if (balance) s.run('INSERT INTO fi_transactions(id,tenant_id,member_id,type,amount,balance_after,note,actor_id,created_at) VALUES(?,?,?,?,?,?,?,?,?)', uid(), t, id, 'credit', 1, 1, 'Coupon di benvenuto DEMO', u?.id ?? null, time);
      audit(u, t, 'member.created', id); return memberJson(member(id, t));
    });
  }
  const hash = x => createHash('sha256').update(JSON.stringify(x)).digest('hex');
  function idempotent(t, key, payload, work) {
    str(key, 'Chiave idempotenza', 16, 128);
    return s.transaction(() => {
      const fingerprint = hash(payload), prev = s.one('SELECT * FROM fi_idempotency WHERE tenant_id=? AND key=?', t, key);
      if (prev) { if (prev.fingerprint !== fingerprint) throw new AppError('Chiave già utilizzata per una richiesta diversa.', 409); return JSON.parse(prev.response_json); }
      const result = work(); s.run('INSERT INTO fi_idempotency VALUES(?,?,?,?,?)', t, key, fingerprint, JSON.stringify(result), now()); return result;
    });
  }
  function transact(t, id, b, u) {
    choice(b.type, ['credit', 'redeem'], 'Operazione'); const note = str(b.note ?? '', 'Nota', 0, 250);
    if (b.amount !== undefined) num(b.amount, 'Quantità', 1);
    if (b.spendCents !== undefined) num(b.spendCents, 'Spesa', 1, 100000000);
    const payload = { actor: u?.id ?? null, id, type: b.type, amount: b.amount, spendCents: b.spendCents, note };
    return idempotent(t, b.idempotencyKey, payload, () => {
      const m = member(id, t), p = activeProgram(m.program_id, t); let amount;
      if (b.type === 'credit') {
        if (p.type === 'coupon') throw new AppError('Il coupon è monouso e non può essere ricaricato.');
        if (b.amount !== undefined && b.spendCents !== undefined) throw new AppError('Indica punti oppure importo speso.');
        if (b.spendCents !== undefined) { if (p.type !== 'points') throw new AppError('Spesa prevista solo per programmi punti.'); amount = Math.floor(b.spendCents * p.points_per_euro / 100); }
        else amount = b.amount ?? 1;
        num(amount, 'Quantità', 1, p.type === 'stamps' ? 100 : 1000000);
      } else { if (b.amount !== undefined || b.spendCents !== undefined) throw new AppError('Il costo del premio è stabilito dal programma.'); amount = -p.reward_threshold; }
      const balance = m.balance + amount; if (balance < 0) throw new AppError('Saldo insufficiente per il premio.', 409); num(balance, 'Saldo', 0, 1000000000);
      const xid = uid(), time = now();
      s.run('UPDATE fi_members SET balance=?,total_earned=total_earned+?,reward_count=reward_count+?,last_visit_at=?,updated_at=?,update_seq=? WHERE id=?', balance, Math.max(0, amount), b.type === 'redeem' ? 1 : 0, time, time, seq(), id);
      s.run('INSERT INTO fi_transactions(id,tenant_id,member_id,type,amount,balance_after,note,actor_id,created_at) VALUES(?,?,?,?,?,?,?,?,?)', xid, t, id, b.type, amount, balance, note, u?.id ?? null, time);
      queue(t, id); audit(u, t, `transaction.${b.type}`, xid);
      return { member: memberJson(member(id, t)), transaction: transactionJson(s.one('SELECT * FROM fi_transactions WHERE id=?', xid)) };
    });
  }
  function reverse(t, id, b, u) {
    const note = str(b.note, 'Motivo storno', 3, 250);
    return idempotent(t, b.idempotencyKey, { actor: u.id, transactionId: id, note }, () => {
      const x = needed(s.one('SELECT * FROM fi_transactions WHERE id=? AND tenant_id=?', id, t));
      if (x.type === 'reversal' || s.one('SELECT id FROM fi_transactions WHERE reversal_of=?', id)) throw new AppError('Operazione già stornata o non stornabile.', 409);
      const m = member(x.member_id, t); if (m.balance - x.amount < 0) throw new AppError('Lo storno renderebbe il saldo negativo.', 409);
      const xid = uid(), time = now();
      s.run('UPDATE fi_members SET balance=balance-?,total_earned=total_earned-?,reward_count=reward_count-?,updated_at=?,update_seq=? WHERE id=?', x.amount, x.type === 'credit' ? x.amount : 0, x.type === 'redeem' ? 1 : 0, time, seq(), m.id);
      s.run('INSERT INTO fi_transactions(id,tenant_id,member_id,type,amount,balance_after,note,actor_id,reversal_of,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)', xid, t, m.id, 'reversal', -x.amount, m.balance - x.amount, note, u.id, id, time);
      queue(t, m.id); audit(u, t, 'transaction.reversal', xid);
      return { member: memberJson(member(m.id, t)), transaction: transactionJson(s.one('SELECT * FROM fi_transactions WHERE id=?', xid)) };
    });
  }
  function recipients(t, segment = 'all', programId, consentOnly = false, inactiveDays = 30) {
    choice(segment, ['all', 'active', 'inactive', 'reward', 'marketing'], 'Segmento');
    const before = new Date(Date.now() - inactiveDays * 86400000).toISOString();
    return s.query("SELECT m.* FROM fi_members m JOIN fi_programs p ON p.id=m.program_id JOIN os_clients t ON t.id=m.tenant_id WHERE m.tenant_id=? AND m.status='active' AND p.active=1 AND t.active=1 AND (p.expires_at IS NULL OR p.expires_at>?)", t, now()).filter(m => {
      if (programId && m.program_id !== programId) return false;
      if ((consentOnly || segment === 'marketing') && !m.marketing_consent) return false;
      if (segment === 'active') return !!m.last_visit_at && m.last_visit_at >= before;
      if (segment === 'inactive') return (m.last_visit_at ?? m.created_at) < before;
      if (segment === 'reward') return m.balance >= program(m.program_id, t).reward_threshold;
      return true;
    });
  }
  function createCampaign(t, b, u) {
    const programId = b.programId ? str(b.programId, 'Programma', 1, 128) : null; if (programId) program(programId, t);
    const id = uid(); s.run('INSERT INTO fi_campaigns(id,tenant_id,name,title,body,segment,program_id,scheduled_at,created_at) VALUES(?,?,?,?,?,?,?,?,?)', id, t, str(b.name, 'Nome', 2, 120), str(b.title, 'Titolo', 2, 60), str(b.body, 'Messaggio', 3, 500), choice(b.segment ?? 'all', ['all', 'active', 'inactive', 'reward'], 'Segmento'), programId, b.scheduledAt ? date(b.scheduledAt) : null, now());
    audit(u, t, 'campaign.created', id); return campaignJson(s.one('SELECT * FROM fi_campaigns WHERE id=?', id));
  }
  function prepareCampaign(t, id, u, explicitMembers) {
    return s.transaction(() => {
      const c = needed(s.one('SELECT * FROM fi_campaigns WHERE id=? AND tenant_id=?', id, t));
      if (c.status !== 'draft') throw new AppError('Campagna già preparata.', 409);
      const list = explicitMembers ?? recipients(t, c.segment, c.program_id, true);
      // Outbox demo stores the latest proposed recipient snapshot; prior contents remain in versioned approvals.
      s.run("UPDATE fi_deliveries SET status='superseded',error='Preparazione precedente superata; nessun invio.' WHERE campaign_id=?", id);
      s.run("UPDATE fi_jobs SET status='blocked',error='Versione campagna superata; nessun invio.' WHERE type='campaign' AND json_extract(payload_json,'$.campaignId')=?", id);
      for (const m of list) for (const channel of ['apple', 'google']) {
        let did = s.one('SELECT id FROM fi_deliveries WHERE campaign_id=? AND member_id=? AND channel=?', id, m.id, channel)?.id;
        if (did) s.run("UPDATE fi_deliveries SET status='blocked',error='Demo: provider scollegato; nessun invio.' WHERE id=?", did);
        else { did = uid(); s.run('INSERT INTO fi_deliveries(id,campaign_id,member_id,channel,status,error) VALUES(?,?,?,?,?,?)', did, id, m.id, channel, 'blocked', 'Demo: provider scollegato; nessun invio.'); }
        queue(t, m.id, 'campaign', { campaignId: id, version: c.version, deliveryId: did, channel });
      }
      s.run("UPDATE fi_campaigns SET status='awaiting_approval' WHERE id=?", id);
      s.run('INSERT OR IGNORE INTO os_approvals(id,client_id,kind,entity_id,version,title,body,status,requested_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)', uid(), t, 'fidelity_campaign', id, c.version, `${c.title} · DEMO`, `${c.body}\n\n${list.length} destinatari idonei. Invio esterno disabilitato.`, 'pending', u?.id ?? 'fidelity-automation', now());
      audit(u, t, 'campaign.prepared', id, { recipients: list.length, externalSent: 0 });
      return { campaign: campaignJson(s.one('SELECT * FROM fi_campaigns WHERE id=?', id)), recipients: list.length, simulated: true, externalSent: 0 };
    });
  }
  function decideCampaign(t, id, b, u) {
    const decision = choice(b.decision, ['approved', 'rejected', 'changes'], 'Decisione'), reason = str(b.reason ?? '', 'Motivo', decision === 'approved' ? 0 : 3, 2000);
    return s.transaction(() => {
      const c = needed(s.one('SELECT * FROM fi_campaigns WHERE id=? AND tenant_id=?', id, t));
      if (b.version !== undefined && num(b.version, 'Versione', 1) !== c.version) throw new AppError('Versione superata. Riapri la campagna prima di decidere.', 409);
      const a = needed(s.one("SELECT * FROM os_approvals WHERE kind='fidelity_campaign' AND entity_id=? AND client_id=? AND version=?", id, t, c.version), 'Approvazione non trovata.');
      if (a.status !== 'pending' || c.status !== 'awaiting_approval') throw new AppError('Questa versione è già stata decisa o modificata.', 409);
      const changed = s.run("UPDATE os_approvals SET status=?,decision_by=?,decision_at=?,reason=? WHERE id=? AND status='pending' AND version=?", decision, u.id, now(), reason, a.id, c.version);
      if (!changed.changes) throw new AppError('Approvazione aggiornata da un altro operatore.', 409);
      const status = decision === 'changes' ? 'changes_requested' : decision;
      s.run('UPDATE fi_campaigns SET status=? WHERE id=?', status, id);
      if (decision !== 'approved') {
        const kind = 'fidelity-feedback', previous = s.one('SELECT * FROM os_memory WHERE client_id=? AND kind=?', t, kind), line = `\n\n## ${now()} · ${decision} · campagna ${id} v${c.version}\n${reason}\nRegola: applicare questo feedback alle prossime bozze Fidelity; nessun invio esterno.`;
        if (previous) s.run('UPDATE os_memory SET content=?,version=version+1,source=?,updated_at=? WHERE id=?', previous.content + line, 'Feedback esplicito approvazione Fidelity DEMO', now(), previous.id);
        else s.run('INSERT INTO os_memory(id,client_id,kind,content,visibility,version,source,updated_at) VALUES(?,?,?,?,?,?,?,?)', uid(), t, kind, '# Feedback Fidelity DEMO' + line, 'internal', 1, 'Feedback esplicito approvazione Fidelity DEMO', now());
      }
      audit(u, t, 'campaign.decision', id, { approvalId: a.id, version: c.version, decision, reason, externalSent: 0 });
      return { campaign: campaignJson(s.one('SELECT * FROM fi_campaigns WHERE id=?', id)), approvalId: a.id, decision, externalSent: 0 };
    });
  }
  function runAutomation(t, id, u) {
    return s.transaction(() => {
      const a = needed(s.one('SELECT * FROM fi_automations WHERE id=? AND tenant_id=?', id, t)); if (!a.active) throw new AppError('Automazione sospesa.', 409);
      const cooldown = new Date(Date.now() - a.cooldown_days * 86400000).toISOString();
      const list = recipients(t, 'inactive', a.program_id, true, a.inactive_days).filter(m => !s.one('SELECT 1 FROM fi_automation_runs WHERE automation_id=? AND member_id=? AND prepared_at>?', id, m.id, cooldown));
      let campaign = null;
      if (list.length) {
        const c = createCampaign(t, { name: `${a.name} · ${now().slice(0, 10)}`.slice(0, 120), title: a.title, body: a.body, segment: 'inactive', programId: a.program_id }, u);
        campaign = prepareCampaign(t, c.id, u, list).campaign;
        for (const m of list) s.run('INSERT INTO fi_automation_runs VALUES(?,?,?) ON CONFLICT(automation_id,member_id) DO UPDATE SET prepared_at=excluded.prepared_at', id, m.id, now());
      }
      s.run('UPDATE fi_automations SET last_run_at=? WHERE id=?', now(), id); audit(u, t, 'automation.prepared', id, { recipients: list.length, externalSent: 0 });
      return { recipients: list.length, campaign, simulated: true, externalSent: 0 };
    });
  }
  function metrics(t) {
    const count = (sql, ...p) => Number(s.one(sql, t, ...p).n);
    return { members: count("SELECT count(*) n FROM fi_members WHERE tenant_id=? AND status='active'"), activeMembers: recipients(t, 'active').length, credits: count("SELECT coalesce(sum(x.amount),0) n FROM fi_transactions x WHERE tenant_id=? AND type='credit' AND NOT EXISTS(SELECT 1 FROM fi_transactions y WHERE y.reversal_of=x.id)"), redemptions: count("SELECT count(*) n FROM fi_transactions x WHERE tenant_id=? AND type='redeem' AND NOT EXISTS(SELECT 1 FROM fi_transactions y WHERE y.reversal_of=x.id)"), programs: count('SELECT count(*) n FROM fi_programs WHERE tenant_id=? AND active=1'), marketingMembers: count("SELECT count(*) n FROM fi_members WHERE tenant_id=? AND status='active' AND marketing_consent=1") };
  }
  function state(t, u) {
    authorized(u, t);
    const trend = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10), x = s.one("SELECT coalesce(sum(CASE WHEN type='credit' THEN amount ELSE 0 END),0) credits,coalesce(sum(CASE WHEN type='redeem' THEN 1 ELSE 0 END),0) redemptions FROM fi_transactions WHERE tenant_id=? AND substr(created_at,1,10)=?", t, d);
      return { date: d, ...x, registrations: s.one('SELECT count(*) n FROM fi_members WHERE tenant_id=? AND substr(created_at,1,10)=?', t, d).n };
    });
    const managerView = ['owner', 'client'].includes(u.role);
    return { demo: true, source: 'Database locale DEMO · nessuna fonte collegata', metrics: metrics(t), trend, programs: s.query('SELECT * FROM fi_programs WHERE tenant_id=? ORDER BY created_at', t).map(programJson), members: s.query("SELECT * FROM fi_members WHERE tenant_id=? AND status='active' ORDER BY created_at DESC LIMIT 1000", t).map(memberJson), transactions: s.query('SELECT * FROM fi_transactions WHERE tenant_id=? ORDER BY created_at DESC LIMIT 200', t).map(transactionJson), campaigns: managerView ? s.query('SELECT * FROM fi_campaigns WHERE tenant_id=? ORDER BY created_at DESC', t).map(campaignJson) : [], automations: managerView ? s.query('SELECT * FROM fi_automations WHERE tenant_id=?', t).map(automationJson) : [], jobs: managerView ? s.query('SELECT id,type,status,attempts,error,available_at,created_at FROM fi_jobs WHERE tenant_id=? ORDER BY created_at DESC LIMIT 100', t) : [], wallet: walletStatus() };
  }
  function walletData(m) {
    const p = program(m.program_id, m.tenant_id), t = tenant(m.tenant_id);
    return { member: { id: m.id, publicToken: m.public_token, appleAuthToken: m.apple_auth_token, name: m.name, balance: m.status === 'deleted' ? 0 : m.balance, rewardCount: m.status === 'deleted' ? 0 : m.reward_count, updatedAt: m.updated_at, offer: m.offer || undefined, voided: m.status === 'deleted' || !p.active || !t.active }, program: { id: p.id, name: p.name, type: p.type, rewardThreshold: p.reward_threshold, rewardName: p.reward_name, color: p.color, description: p.description, tenantName: t.name, expiresAt: p.expires_at || undefined, locations: JSON.parse(p.locations_json) } };
  }
  function publicMember(publicToken) { return needed(s.one("SELECT m.* FROM fi_members m JOIN os_clients t ON t.id=m.tenant_id WHERE m.public_token=? AND m.status='active' AND t.active=1", publicToken), 'Tessera non disponibile.'); }

  async function handle({ method, path, body = {}, user: u, clientId: t }) {
    const url = new URL(path, base); let parts;
    try { parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent); } catch { throw new AppError('Percorso non valido.'); }
    const [resource, id, action] = parts;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new AppError('Richiesta non valida.');
    const data = (value, status = 200) => ({ data: value, status });
    // These routes are explicitly public; the host router still applies Origin and rate limits to writes.
    if (resource === 'public') {
      if (id === 'join') {
        const c = needed(s.one('SELECT * FROM os_clients WHERE slug=? AND active=1', action));
        if (method === 'GET') return data({ demo: true, tenant: { name: c.name, slug: c.slug, color: c.color, address: c.address, privacyUrl: c.privacy_url, termsText: c.terms_text }, programs: s.query('SELECT * FROM fi_programs WHERE tenant_id=? AND active=1 AND (expires_at IS NULL OR expires_at>?)', c.id, now()).map(programJson) });
        if (method === 'POST') { if (body.acceptTerms !== true) throw new AppError('Accetta il regolamento per iscriverti.'); const m = createMember(c.id, body, null, 'public_signup'); return data({ cardUrl: m.cardUrl, token: m.publicToken, demo: true }, 201); }
      }
      if (id === 'cards') {
        const m = publicMember(action), p = program(m.program_id, m.tenant_id), c = tenant(m.tenant_id), tail = parts[3];
        if (!tail && method === 'GET') return data({ demo: true, member: { name: m.name, balance: m.balance, rewardCount: m.reward_count, availableRewards: Math.floor(m.balance / p.reward_threshold), status: m.status, createdAt: m.created_at }, program: programJson(p), tenant: { name: c.name, color: c.color, address: c.address }, wallet: walletStatus(), marketingConsent: !!m.marketing_consent, offer: m.offer });
        if (tail === 'consent' && method === 'PATCH') { const consent = bool(body.marketingConsent, 'Consenso'); s.transaction(() => updateConsent(m, consent, 'card_holder')); return data({ ok: true }); }
        if (['apple', 'google'].includes(tail)) externalError();
      }
      return null;
    }
    if (resource === 'branding' && method === 'GET' && id?.endsWith('.png')) {
      const r = needed(s.one('SELECT b.png FROM fi_branding b JOIN os_clients t ON t.id=b.tenant_id WHERE b.program_id=? AND t.active=1', id.slice(0, -4)));
      return { data: Buffer.from(r.png), contentType: 'image/png' };
    }
    if (resource === 'wallet' && id === 'icon.png' && method === 'GET') return { data: walletIconPng(), contentType: 'image/png' };
    if (resource === 'wallet' && id === 'apple') externalError();
    // A current, active session user and a server-side assignment are required on every private route.
    authorized(u, t);
    if ((resource === 'state' || resource === 'dashboard' || !resource) && method === 'GET') return data(state(t, u));
    if (['tenants', 'businesses'].includes(resource)) {
      if (method === 'GET') return data({ items: u.role === 'owner' ? s.query('SELECT * FROM os_clients ORDER BY name') : [tenant(t)] });
      requireOwner(u);
      if (method === 'POST') {
        const name = str(body.name, 'Nome attività', 2, 120), slug = str(body.slug, 'Slug', 3, 64); if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new AppError('Slug non valido.');
        const cid = uid(); s.run('INSERT INTO os_clients(id,name,slug,industry,color,address,services_json,created_at) VALUES(?,?,?,?,?,?,?,?)', cid, name, slug, str(body.industry ?? '', 'Settore', 0, 100), color(body.color ?? '#F26B21'), str(body.address ?? '', 'Indirizzo', 0, 250), '["fidelity"]', now()); audit(u, cid, 'tenant.created', cid); return data(tenant(cid), 201);
      }
      if (id && method === 'PATCH') {
        const old = tenant(id), name = body.name === undefined ? old.name : str(body.name, 'Nome', 2, 120), active = body.active === undefined ? old.active : +bool(body.active, 'Attivo'), slug = body.slug === undefined ? old.slug : str(body.slug, 'Slug', 3, 64);
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new AppError('Slug non valido.');
        s.transaction(() => { s.run('UPDATE os_clients SET name=?,slug=?,industry=?,color=?,address=?,active=? WHERE id=?', name, slug, body.industry === undefined ? old.industry : str(body.industry, 'Settore', 0, 100), body.color === undefined ? old.color : color(body.color), body.address === undefined ? old.address : str(body.address, 'Indirizzo', 0, 250), active, id); if (old.name !== name || old.active !== active) for (const m of s.query("SELECT id FROM fi_members WHERE tenant_id=? AND status='active'", id)) { s.run('UPDATE fi_members SET updated_at=?,update_seq=? WHERE id=?', now(), seq(), m.id); queue(id, m.id); } audit(u, id, 'tenant.updated', id); }); return data(tenant(id));
      }
    }
    if (resource === 'programs') {
      if (method === 'GET') return data(id ? programJson(program(id, t)) : { items: s.query('SELECT * FROM fi_programs WHERE tenant_id=? ORDER BY created_at', t).map(programJson) });
      manager(u);
      if (!id && method === 'POST') return data(createProgram(t, body, u), 201);
      if (id && action === 'logo' && method === 'POST') { program(id, t); const png = await sanitizeLogo(body.dataUrl); s.transaction(() => { s.run('INSERT INTO fi_branding VALUES(?,?,?,?) ON CONFLICT(program_id) DO UPDATE SET png=excluded.png,updated_at=excluded.updated_at', id, t, png, now()); for (const m of s.query("SELECT id FROM fi_members WHERE program_id=? AND status='active'", id)) { s.run('UPDATE fi_members SET updated_at=?,update_seq=? WHERE id=?', now(), seq(), m.id); queue(t, m.id); } audit(u, t, 'program.logo_updated', id); }); return data({ logoUrl: programJson(program(id, t)).logoUrl }); }
      if (id && method === 'PATCH') {
        const p = program(id, t), b = validateProgram(body, true);
        if (b.type && b.type !== p.type) throw new AppError('Il tipo programma non può cambiare.', 409);
        if (b.rewardThreshold && b.rewardThreshold !== p.reward_threshold && s.one('SELECT 1 FROM fi_members WHERE program_id=? LIMIT 1', id)) throw new AppError('La soglia non cambia dopo la prima iscrizione.', 409);
        if (p.type === 'coupon' && b.rewardThreshold && b.rewardThreshold !== 1) throw new AppError('Il coupon è monouso.');
        s.transaction(() => { s.run('UPDATE fi_programs SET name=?,description=?,reward_threshold=?,reward_name=?,color=?,points_per_euro=?,active=?,expires_at=?,locations_json=? WHERE id=?', b.name ?? p.name, b.description ?? p.description, b.rewardThreshold ?? p.reward_threshold, b.rewardName ?? p.reward_name, b.color ?? p.color, b.pointsPerEuro ?? p.points_per_euro, b.active === undefined ? p.active : +b.active, b.expiresAt === undefined ? p.expires_at : b.expiresAt, b.locations ? JSON.stringify(b.locations) : p.locations_json, id); for (const m of s.query("SELECT id FROM fi_members WHERE program_id=? AND status='active'", id)) { s.run('UPDATE fi_members SET updated_at=?,update_seq=? WHERE id=?', now(), seq(), m.id); queue(t, m.id); } audit(u, t, 'program.updated', id); }); return data(programJson(program(id, t)));
      }
    }
    if (resource === 'members') {
      if (id === 'export' && method === 'GET') { manager(u); const cell = v => '"' + String(v ?? '').replace(/^[=+\-@\t\r]/, "'$&").replace(/"/g, '""') + '"'; const rows = s.query("SELECT name,email,phone,balance,marketing_consent,created_at FROM fi_members WHERE tenant_id=? AND status='active' ORDER BY name", t); audit(u, t, 'members.export', 'all'); return { data: '\ufeff' + [['Nome', 'Email', 'Telefono', 'Saldo', 'Consenso marketing', 'Iscrizione'], ...rows.map(Object.values)].map(r => r.map(cell).join(',')).join('\r\n'), contentType: 'text/csv; charset=utf-8' }; }
      if (!id && method === 'GET') { const q = (url.searchParams.get('q') ?? '').toLowerCase(); let list = s.query("SELECT * FROM fi_members WHERE tenant_id=? AND status='active' ORDER BY created_at DESC LIMIT 1000", t); const pid = url.searchParams.get('programId'), segment = url.searchParams.get('segment') ?? 'all'; if (segment !== 'all') { const ids = new Set(recipients(t, segment, pid).map(x => x.id)); list = list.filter(x => ids.has(x.id)); } return data({ items: list.filter(x => (!pid || x.program_id === pid) && (!q || x.name.toLowerCase().includes(q) || x.email.includes(q))).map(memberJson) }); }
      if (!id && method === 'POST') { manager(u); return data(createMember(t, body, u), 201); }
      if (id && action === 'transactions' && method === 'POST') return data(transact(t, id, body, u), 201);
      if (id && action === 'wallet-preview' && method === 'GET') {
        manager(u); const values = walletData(member(id, t));
        // Fixed fictional issuer/base URL: the payload is a technical preview, never a signed pass.
        const apple = buildAppleDefinition(values.member, values.program, { baseUrl: 'https://demo.bigant.example', passTypeId: 'pass.example.bigant.demo', teamId: 'DEMOONLY00' });
        delete apple.authenticationToken;
        return data({ demo: true, issued: false, google: buildGooglePayloads(values.member, values.program, '1234567890', 'https://demo.bigant.example'), apple });
      }
      if (id && !action && method === 'GET') { const m = member(id, t); return data({ member: memberJson(m), transactions: s.query('SELECT * FROM fi_transactions WHERE member_id=? AND tenant_id=? ORDER BY created_at DESC', id, t).map(transactionJson) }); }
      if (id && method === 'PATCH') {
        manager(u); const m = member(id, t), address = body.email === undefined ? m.email : email(body.email);
        if (address !== m.email && s.one("SELECT id FROM fi_members WHERE program_id=? AND email=? AND status='active' AND id!=?", m.program_id, address, id)) throw new AppError('Email già iscritta a questo programma.', 409);
        s.transaction(() => { s.run('UPDATE fi_members SET name=?,email=?,phone=?,updated_at=?,update_seq=? WHERE id=?', body.name === undefined ? m.name : str(body.name, 'Nome', 2, 120), address, body.phone === undefined ? m.phone : str(body.phone, 'Telefono', 0, 30), now(), seq(), id); if (body.marketingConsent !== undefined && bool(body.marketingConsent, 'Consenso') !== !!m.marketing_consent) updateConsent(m, body.marketingConsent, 'operator'); queue(t, id); audit(u, t, 'member.updated', id); }); return data(memberJson(member(id, t)));
      }
      if (id && method === 'DELETE') {
        manager(u); member(id, t);
        s.transaction(() => { s.run("UPDATE fi_members SET name='Iscritto anonimizzato DEMO',email=?,phone='',marketing_consent=0,status='deleted',public_token=?,offer=NULL,updated_at=?,update_seq=? WHERE id=?", `deleted-${uid()}@invalid.example`, token(), now(), seq(), id); s.run('DELETE FROM fi_consents WHERE member_id=?', id); s.run("UPDATE fi_transactions SET note='' WHERE member_id=?", id); s.run("UPDATE fi_jobs SET status='blocked',payload_json='{}',error='Iscritto anonimizzato' WHERE member_id=?", id); s.run("UPDATE fi_deliveries SET status='blocked',error='Iscritto anonimizzato' WHERE member_id=?", id); s.run('DELETE FROM fi_idempotency WHERE tenant_id=? AND response_json LIKE ?', t, `%${id}%`); s.run('DELETE FROM fi_automation_runs WHERE member_id=?', id); queue(t, id, 'wallet_revoke'); audit(u, t, 'member.anonymized', id); }); return data({ ok: true, walletRevocation: 'blocked_disconnected' });
      }
    }
    if (resource === 'scan' && method === 'POST') {
      let code = str(body.code, 'Codice', 8, 2048);
      if (code.startsWith('http')) { try { const x = new URL(code); if (x.origin !== base || !x.pathname.startsWith('/fidelity/card/')) throw new Error(); code = decodeURIComponent(x.pathname.slice('/fidelity/card/'.length)); } catch { throw new AppError('QR non riconosciuto.'); } }
      const m = needed(s.one("SELECT * FROM fi_members WHERE tenant_id=? AND status='active' AND (public_token=? OR id=?)", t, code, code), 'Tessera non trovata per questa attività.'); return data({ member: memberJson(m), transactions: s.query('SELECT * FROM fi_transactions WHERE member_id=? AND tenant_id=? ORDER BY created_at DESC', m.id, t).map(transactionJson) });
    }
    if (resource === 'transactions') {
      if (method === 'GET') return data({ items: s.query('SELECT * FROM fi_transactions WHERE tenant_id=? ORDER BY created_at DESC LIMIT 200', t).map(transactionJson) });
      if (method === 'POST' && action === 'reverse') { manager(u); return data(reverse(t, id, body, u)); }
    }
    if (resource === 'campaigns') {
      manager(u);
      if (!id && method === 'GET') return data({ items: s.query('SELECT * FROM fi_campaigns WHERE tenant_id=? ORDER BY created_at DESC', t).map(campaignJson) });
      if (!id && method === 'POST') return data(createCampaign(t, body, u), 201);
      const c = needed(s.one('SELECT * FROM fi_campaigns WHERE id=? AND tenant_id=?', id, t));
      if (action === 'send') externalError();
      if (action === 'decision' && method === 'POST') return data(decideCampaign(t, id, body, u));
      if (!action && method === 'PATCH') {
        if (!['draft', 'rejected', 'changes_requested'].includes(c.status)) throw new AppError('Decidi prima la versione in approvazione; una versione approvata non si riscrive.', 409);
        if (body.version !== undefined && num(body.version, 'Versione', 1) !== c.version) throw new AppError('Versione superata. Riapri la campagna.', 409);
        const pid = body.programId === undefined ? c.program_id : body.programId || null; if (pid) program(pid, t);
        s.run("UPDATE fi_campaigns SET name=?,title=?,body=?,segment=?,program_id=?,scheduled_at=?,version=version+1,status='draft' WHERE id=?", body.name === undefined ? c.name : str(body.name, 'Nome', 2, 120), body.title === undefined ? c.title : str(body.title, 'Titolo', 2, 60), body.body === undefined ? c.body : str(body.body, 'Messaggio', 3, 500), body.segment === undefined ? c.segment : choice(body.segment, ['all', 'active', 'inactive', 'reward'], 'Segmento'), pid, body.scheduledAt === undefined ? c.scheduled_at : body.scheduledAt ? date(body.scheduledAt) : null, id);
        audit(u, t, 'campaign.revised', id, { fromVersion: c.version, toVersion: c.version + 1 });
        return data(campaignJson(s.one('SELECT * FROM fi_campaigns WHERE id=?', id)));
      }
      if (action === 'preview' && ['GET', 'POST'].includes(method)) return data({ recipients: recipients(t, c.segment, c.program_id, true).map(memberJson), simulated: true, externalSent: 0 });
      if (['prepare', 'queue'].includes(action) && method === 'POST') return data(prepareCampaign(t, id, u));
      if (method === 'GET') return data({ campaign: campaignJson(c), deliveries: s.query('SELECT d.id,d.channel,d.status,d.error,d.sent_at,m.name memberName FROM fi_deliveries d JOIN fi_members m ON m.id=d.member_id WHERE d.campaign_id=?', id) });
    }
    if (resource === 'automations') {
      manager(u);
      if (!id && method === 'GET') return data({ items: s.query('SELECT * FROM fi_automations WHERE tenant_id=? ORDER BY created_at DESC', t).map(automationJson) });
      if (!id && method === 'POST') { if (body.programId) program(body.programId, t); const aid = uid(); s.run('INSERT INTO fi_automations(id,tenant_id,name,title,body,inactive_days,cooldown_days,program_id,created_at) VALUES(?,?,?,?,?,?,?,?,?)', aid, t, str(body.name, 'Nome', 2, 120), str(body.title, 'Titolo', 2, 60), str(body.body, 'Messaggio', 3, 500), num(body.inactiveDays, 'Giorni inattività', 7, 365), num(body.cooldownDays, 'Intervallo minimo', 7, 365), body.programId ?? null, now()); audit(u, t, 'automation.created', aid); return data(automationJson(s.one('SELECT * FROM fi_automations WHERE id=?', aid)), 201); }
      const a = needed(s.one('SELECT * FROM fi_automations WHERE id=? AND tenant_id=?', id, t));
      if (method === 'PATCH') { const active = bool(body.active, 'Attivo'); s.run('UPDATE fi_automations SET active=? WHERE id=?', +active, id); audit(u, t, 'automation.updated', id); return data(automationJson({ ...a, active: +active })); }
      if (method === 'POST' && action === 'run') return data(runAutomation(t, id, u));
    }
    if (resource === 'settings') {
      if (method === 'GET') return data({ tenant: tenant(t), wallet: walletStatus(), jobs: s.query('SELECT status,count(*) count FROM fi_jobs WHERE tenant_id=? GROUP BY status', t), publicBaseUrl: base, demo: true });
      if (id === 'policies' && method === 'PATCH') { manager(u); const privacyUrl = str(body.privacyUrl, 'URL privacy', 0, 2000), termsText = str(body.termsText, 'Regolamento', 0, 10000); if (privacyUrl) { let valid = false; try { const x = new URL(privacyUrl); valid = x.protocol === 'https:' && !x.username && !x.password; } catch {} if (!valid) throw new AppError('Usa un URL HTTPS pubblico per la privacy.'); } s.run('UPDATE os_clients SET privacy_url=?,terms_text=? WHERE id=?', privacyUrl, termsText, t); audit(u, t, 'policies.updated', t); return data({ ok: true }); }
    }
    if (resource === 'users') { manager(u); if (method === 'GET') return data({ items: s.query("SELECT id,name,email,role,tenant_id,active FROM os_users WHERE tenant_id=? OR (role='collaborator' AND id IN(SELECT user_id FROM os_assignments WHERE client_id=?))", t, t) }); throw new AppError('Gestisci gli accessi dalla sezione Utenti comune di BigAnt OS.', 409); }
    if (resource === 'audit' && method === 'GET') { manager(u); return data({ items: s.query("SELECT id,user_id,action,entity_id,created_at FROM os_audit WHERE client_id=? AND action LIKE 'fidelity.%' ORDER BY created_at DESC LIMIT 200", t) }); }
    if (resource === 'jobs') {
      manager(u);
      if (method === 'GET') return data({ items: s.query('SELECT id,type,status,error,attempts,available_at,created_at FROM fi_jobs WHERE tenant_id=? ORDER BY created_at DESC', t) });
      if (id === 'retry' && method === 'POST') externalError();
    }
    if (resource === 'tick' && method === 'POST') { manager(u); return data(tick(t, u)); }
    return null;
  }
  function tick(t, u) {
    authorized(u, t); manager(u);
    const results = [];
    for (const a of s.query('SELECT * FROM fi_automations WHERE tenant_id=? AND active=1 AND (last_run_at IS NULL OR last_run_at<?)', t, new Date(Date.now() - 86400000).toISOString())) results.push(runAutomation(t, a.id, u));
    for (const c of s.query("SELECT id FROM fi_campaigns WHERE tenant_id=? AND status='draft' AND scheduled_at IS NOT NULL AND scheduled_at<=?", t, now())) results.push(prepareCampaign(t, c.id, u));
    return { simulated: true, externalSent: 0, prepared: results, costCents: 0 };
  }
  function seed(realMode=false) {
    if (realMode) return;
    s.transaction(() => {
      if (!s.one('SELECT id FROM os_clients WHERE id=?', 'demo-bottega')) return;
      for (const [id, t, type, name, threshold] of [
        ['fi-demo-stamps', 'demo-bottega', 'stamps', 'Ritorni in bottega DEMO', 10], ['fi-demo-points', 'demo-bigant', 'points', 'Relazioni BigAnt DEMO', 100], ['fi-demo-coupon', 'demo-bottega', 'coupon', 'Benvenuto DEMO', 1]
      ]) if (!s.one('SELECT id FROM fi_programs WHERE id=?', id)) createProgram(t, { name, type, rewardThreshold: threshold, rewardName: 'Premio dimostrativo', pointsPerEuro: 1.5 }, null, id);
      if (!s.one('SELECT id FROM fi_members WHERE id=?', 'fi-demo-member')) { createMember('demo-bottega', { programId: 'fi-demo-stamps', name: 'Visitatore Aurora DEMO', email: 'visitatore@aurora.example', marketingConsent: true }, null, 'fixture_demo', 'fi-demo-member'); transact('demo-bottega', 'fi-demo-member', { type: 'credit', amount: 4, note: 'Saldo fixture DEMO', idempotencyKey: 'fixture-demo-stamps-0001' }, null); }
      if (!s.one('SELECT id FROM fi_members WHERE id=?', 'fi-demo-bigant-member')) createMember('demo-bigant', { programId: 'fi-demo-points', name: 'Contatto Relazione DEMO', email: 'relazione@bigant.example', marketingConsent: false }, null, 'fixture_demo', 'fi-demo-bigant-member');
    });
  }
  return { state, seed, handle, tick };
}
