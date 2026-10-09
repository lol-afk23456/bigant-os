import { AppError, requireClient, requireOwner, uid, now, text } from './store.js';
import { createVault } from './vault.js';

export function createClientRecords({ store: s, production, env = {}, clock = () => new Date() }) {
  const vault = createVault(env);
  s.db.exec(`
    CREATE TABLE IF NOT EXISTS os_client_credentials (
      id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES os_clients(id), label TEXT NOT NULL,
      sealed TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS os_client_contract_docs (
      id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES os_clients(id), title TEXT NOT NULL,
      start_date TEXT NOT NULL, end_date TEXT NOT NULL, renewal TEXT NOT NULL, notice_days INTEGER NOT NULL,
      pdf_base64 TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS os_client_onboarding (
      client_id TEXT PRIMARY KEY REFERENCES os_clients(id), notes TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL
    );
  `);
  function team(user, clientId) {
    requireClient(s, user, clientId);
    if (user.role === 'client') throw new AppError('Scheda riservata al team BigAnt.', 403);
  }
  function contracts(user, clientId) {
    requireClient(s, user, clientId);
    if (user.role === 'collaborator') requireOwner(user);
    const docs = s.query("SELECT id,title,start_date,end_date,renewal,notice_days,version,updated_at,LENGTH(pdf_base64)>0 has_document FROM os_client_contract_docs WHERE client_id=? ORDER BY end_date", clientId);
    const legacy = s.query("SELECT id,service title,start_date,end_date,notice_days,0 has_document,1 version FROM os_fin_contracts WHERE client_id=? AND status='active' ORDER BY end_date", clientId);
    return [...docs, ...legacy.filter(old => !docs.some(doc => doc.end_date === old.end_date))];
  }
  function expiring(user) {
    requireOwner(user);
    const today = clock().toISOString().slice(0, 10), end = new Date(clock()); end.setUTCDate(end.getUTCDate() + 30);
    const until = end.toISOString().slice(0, 10);
    const docs = s.query('SELECT d.id,d.client_id,d.end_date,d.title,c.name client_name FROM os_client_contract_docs d JOIN os_clients c ON c.id=d.client_id WHERE c.active=1 AND d.end_date>=? AND d.end_date<=? ORDER BY d.end_date', today, until);
    const legacy = s.query("SELECT d.id,d.client_id,d.end_date,d.service title,c.name client_name FROM os_fin_contracts d JOIN os_clients c ON c.id=d.client_id WHERE c.active=1 AND d.status='active' AND d.end_date>=? AND d.end_date<=? ORDER BY d.end_date", today, until);
    // Keep existing contracts available while their PDF records are completed.
    return [...docs, ...legacy.filter(old => !docs.some(doc => doc.client_id === old.client_id && doc.end_date === old.end_date))].sort((a, b) => a.end_date.localeCompare(b.end_date));
  }
  function record(user, clientId) {
    team(user, clientId);
    const client = s.one('SELECT id,name,industry,address,services_json,stage,risk FROM os_clients WHERE id=?', clientId);
    const memory = s.query("SELECT kind,content,version,source,updated_at FROM os_memory WHERE client_id=? AND visibility!='admin' ORDER BY kind", clientId);
    return { client, services: JSON.parse(client.services_json), memory,
      credentials: s.query('SELECT id,label,version,updated_at FROM os_client_credentials WHERE client_id=? ORDER BY label', clientId), vaultReady: vault.ready,
      ...(user.role === 'owner' ? { contracts: contracts(user, clientId) } : {}),
      onboarding: s.one('SELECT notes,completed,version,updated_at FROM os_client_onboarding WHERE client_id=?', clientId) || { notes: '', completed: 0, version: 0 },
      results: { connected: false, source: 'Fonti esterne da collegare', updatedAt: null, metrics: null }
    };
  }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new AppError('Data non valida.');
    return value;
  }
  function checkedText(value, name, max = 500) {
    if (typeof value !== 'string' || !value.trim() || value.length > max) throw new AppError(`${name}: testo non valido.`);
    return value.trim();
  }
  async function handle({ method, path, body: b = {}, user, clientId }) {
    requireClient(s, user, clientId);
    if (method === 'GET' && path === '/contracts') return { data: { items: contracts(user, clientId) } };
    let match = path.match(/^\/contracts\/([^/]+)\/pdf$/);
    if (method === 'GET' && match) {
      if (user.role === 'collaborator') requireOwner(user);
      const doc = s.one('SELECT pdf_base64 FROM os_client_contract_docs WHERE id=? AND client_id=?', match[1], clientId);
      if (!doc?.pdf_base64) throw new AppError('Documento non disponibile.', 404);
      return { contentType: 'application/pdf', headers: { 'Content-Disposition': 'attachment; filename="contratto.pdf"', 'Cache-Control': 'no-store' }, data: Buffer.from(doc.pdf_base64, 'base64') };
    }
    team(user, clientId);
    if (method === 'GET' && path === '/state') return { data: record(user, clientId) };
    if (method === 'PATCH' && path === '/profile') {
      requireOwner(user);
      const name = checkedText(b.name, 'Nome', 140);
      s.run('UPDATE os_clients SET name=?,industry=?,address=? WHERE id=?', name, text(b.industry, 100), text(b.address, 500), clientId);
      s.audit(user, clientId, 'Anagrafica aggiornata', clientId); return { data: { ok: true } };
    }
    if (method === 'POST' && path === '/memory') {
      if (!['master', 'dna', 'strategy', 'feedback'].includes(b.kind)) throw new AppError('Sezione informativa non valida.');
      const previous = s.one('SELECT version FROM os_memory WHERE client_id=? AND kind=?', clientId, b.kind);
      if (b.version !== (previous?.version || 0)) throw new AppError('La scheda è cambiata. Ricarica prima di salvare.', 409);
      return { data: production.saveMemory(user, clientId, b.kind, checkedText(b.content, 'Contenuto', 20000), 'Scheda informativa aggiornata dal team') };
    }
    if (method === 'POST' && path === '/credentials') {
      const id = uid(), label = checkedText(b.label, 'Nome accesso', 140);
      if (typeof b.password !== 'string' || !b.password.length || b.password.length > 4000) throw new AppError('Password non valida.');
      const value = { username: checkedText(b.username, 'Utente', 254), password: b.password, url: text(b.url, 1000), notes: text(b.notes, 2000) };
      if (value.url) { let url; try { url = new URL(value.url); } catch { throw new AppError('Indirizzo non valido.'); } if (!['https:', 'http:'].includes(url.protocol)) throw new AppError('Indirizzo non valido.'); }
      const sealed = vault.seal(value, `client:${clientId}:credential:${id}`);
      s.transaction(() => { s.run('INSERT INTO os_client_credentials VALUES(?,?,?,?,1,?)', id, clientId, label, sealed, now()); s.audit(user, clientId, 'Accesso cliente salvato', id); });
      return { data: { id }, status: 201 };
    }
    match = path.match(/^\/credentials\/([^/]+)\/reveal$/);
    if (method === 'POST' && match) {
      const row = s.one('SELECT * FROM os_client_credentials WHERE id=? AND client_id=?', match[1], clientId);
      if (!row) throw new AppError('Accesso non disponibile.', 404);
      const value = vault.open(row.sealed, `client:${clientId}:credential:${row.id}`);
      s.audit(user, clientId, 'Credenziali cliente consultate', row.id);
      return { data: { label: row.label, ...value } };
    }
    if (method === 'POST' && path === '/contracts') {
      requireOwner(user);
      const title = checkedText(b.title, 'Titolo', 180), start = validDate(b.startDate), end = validDate(b.endDate);
      if (end < start) throw new AppError('La scadenza precede l’inizio.');
      const notice = b.noticeDays ?? 30;
      if (!Number.isInteger(notice) || notice < 0 || notice > 365) throw new AppError('Preavviso non valido.');
      const encoded = b.pdfBase64 || '';
      if (typeof encoded !== 'string' || encoded.length > 700000) throw new AppError('PDF troppo grande: massimo 500 KB.');
      if (encoded) { const pdf = Buffer.from(encoded, 'base64'); if (pdf.length > 500000 || pdf.toString('base64') !== encoded || pdf.subarray(0, 5).toString() !== '%PDF-') throw new AppError('Allega un PDF valido di massimo 500 KB.'); }
      const id = uid();
      s.transaction(() => { s.run('INSERT INTO os_client_contract_docs VALUES(?,?,?,?,?,?,?,?,1,?)', id, clientId, title, start, end, text(b.renewal, 1000), notice, encoded, now()); s.audit(user, clientId, 'Contratto cliente aggiunto', id); });
      return { data: { id }, status: 201 };
    }
    if (method === 'POST' && path === '/onboarding') {
      requireOwner(user);
      const previous = s.one('SELECT version FROM os_client_onboarding WHERE client_id=?', clientId);
      if (b.version !== (previous?.version || 0)) throw new AppError('L’avvio è cambiato. Ricarica prima di salvare.', 409);
      if (typeof b.completed !== 'boolean') throw new AppError('Stato non valido.');
      s.run('INSERT INTO os_client_onboarding VALUES(?,?,?,?,?) ON CONFLICT(client_id) DO UPDATE SET notes=excluded.notes,completed=excluded.completed,version=os_client_onboarding.version+1,updated_at=excluded.updated_at', clientId, text(b.notes, 5000), b.completed ? 1 : 0, 1, now());
      s.audit(user, clientId, 'Avvio cliente aggiornato', clientId); return { data: { ok: true } };
    }
    return null;
  }
  return { handle, record, contracts, expiring };
}
