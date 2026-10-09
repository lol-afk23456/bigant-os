import { AppError, requireOwner, now } from './store.js';
import { createVault } from './vault.js';
import { integrations } from './registry.js';

const apiKey = { id: 'apiKey', label: 'Chiave API', secret: true };
const fields = {
  brave: [apiKey], openai: [apiKey, { id: 'model', label: 'Modello', secret: false }],
  anthropic: [apiKey, { id: 'model', label: 'Modello', secret: false }],
  google: [{ id: 'clientId', label: 'Client ID', secret: false }, { id: 'clientSecret', label: 'Client secret', secret: true }, { id: 'refreshToken', label: 'Refresh token', secret: true }],
  meta: [{ id: 'accessToken', label: 'Token di accesso', secret: true }],
  postiz: [apiKey], trello: [apiKey, { id: 'token', label: 'Token', secret: true }],
  wallet: [{ id: 'issuerId', label: 'Google Wallet · Issuer ID', secret: false }, { id: 'serviceAccount', label: 'Google Wallet · account di servizio JSON', secret: true }]
};
const definitions = [...integrations, { id: 'anthropic', name: 'Anthropic', purpose: 'Analisi e bozze per Sciame e Growth', permission: 'Budget e approvazione umana' },
  { id: 'google', name: 'Accesso Google', purpose: 'Autorizzazione per Gmail, Calendar e fonti Google', permission: 'Ambiti minimi, da collaudare' }
].map(row => ({ ...row, fields: fields[row.id] || [], dependsOn: ['gmail', 'calendar', 'ga4', 'gsc', 'gbp', 'google-ads', 'drive', 'sheets'].includes(row.id) ? 'google' : null }));

export function createConnections({ store: s, env = {} }) {
  const vault = createVault(env);
  s.db.exec(`CREATE TABLE IF NOT EXISTS os_connections (
    id TEXT PRIMARY KEY, sealed TEXT NOT NULL, version INTEGER NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL,
    last_checked TEXT, check_status TEXT NOT NULL DEFAULT 'Da collegare', check_note TEXT NOT NULL DEFAULT ''
  );`);
  function definition(id) {
    const item = definitions.find(row => row.id === id);
    if (!item) throw new AppError('Collegamento non trovato.', 404);
    return item;
  }
  const stored = id => s.one('SELECT * FROM os_connections WHERE id=?', id);
  function metadata(id) {
    const d = definition(id), row = stored(id), by = row && s.one('SELECT name FROM os_users WHERE id=?', row.updated_by);
    return { ...d, status: row?.check_status || 'Da collegare', lastCheck: row?.last_checked || null, checkNote: row?.check_note || '',
      configured: !!row, version: row?.version || 0, updatedAt: row?.updated_at || null, configuredBy: by?.name || null,
      activationNote: 'Il salvataggio delle chiavi non attiva il collegamento. Servono collaudo e autorizzazione dei soci.' };
  }
  function state(user) { requireOwner(user); return { vaultReady: vault.ready, items: definitions.map(row => metadata(row.id)) }; }
  function save(user, id, b) {
    requireOwner(user); const d = definition(id), row = stored(id);
    if (!d.fields.length) throw new AppError('Questo collegamento richiede prima la definizione degli accessi o un’autorizzazione dedicata.', 409);
    if (b.version !== (row?.version || 0)) throw new AppError('Configurazione cambiata. Ricarica prima di salvare.', 409);
    if (!b.fields || typeof b.fields !== 'object' || Array.isArray(b.fields) || Object.keys(b.fields).some(key => !d.fields.some(field => field.id === key))) throw new AppError('Campi del collegamento non validi.');
    const values = row ? vault.open(row.sealed, 'connection:' + id) : {};
    for (const field of d.fields) {
      const value = b.fields[field.id];
      if (value !== undefined && (typeof value !== 'string' || value.length > 20000)) throw new AppError('Valore del collegamento non valido.');
      if (value?.trim()) values[field.id] = value.trim();
      if (!values[field.id]) throw new AppError('Compila tutti i campi richiesti per questo collegamento.');
    }
    // Validate public identifiers without revealing or echoing secret input in errors.
    if (values.model && !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,199}$/.test(values.model)) throw new AppError('Nome del modello non valido.');
    if (id === 'wallet') {
      let account; try { account = JSON.parse(values.serviceAccount); } catch { throw new AppError('Documento dell’account di servizio non valido.'); }
      if (!/^\d+$/.test(values.issuerId) || typeof account.client_email !== 'string' || !account.client_email.endsWith('.gserviceaccount.com') || typeof account.private_key !== 'string' || !account.private_key.includes('BEGIN PRIVATE KEY')) throw new AppError('Dati Google Wallet incompleti.');
    }
    const sealed = vault.seal(values, 'connection:' + id);
    s.transaction(() => {
      s.run("INSERT INTO os_connections(id,sealed,version,updated_at,updated_by) VALUES(?,?,1,?,?) ON CONFLICT(id) DO UPDATE SET sealed=excluded.sealed,version=os_connections.version+1,updated_at=excluded.updated_at,updated_by=excluded.updated_by,last_checked=NULL,check_status='Da collegare',check_note=''", id, sealed, now(), user.id);
      s.audit(user, null, 'Chiavi del collegamento salvate', id, { version: (row?.version || 0) + 1 }, 'admin');
    });
    return metadata(id);
  }
  function check(user, id) {
    requireOwner(user); const d = definition(id), row = stored(id);
    if (!row) throw new AppError('Inserisci prima gli accessi del collegamento.', 409);
    let ok = false;
    try { const values = vault.open(row.sealed, 'connection:' + id); ok = d.fields.every(field => typeof values[field.id] === 'string' && values[field.id].trim()); } catch { /* Generic, audited result; never secret details. */ }
    const status = ok ? 'Da collegare' : 'Errore';
    const note = ok ? 'Controllo locale superato. La validità presso il fornitore deve ancora essere verificata.' : 'Archivio non leggibile o configurazione incompleta. Verifica la chiave del server e reinserisci gli accessi.';
    s.transaction(() => {
      s.run('UPDATE os_connections SET last_checked=?,check_status=?,check_note=? WHERE id=?', now(), status, note, id);
      s.audit(user, null, 'Configurazione collegamento controllata', id, { result: status, scope: 'locale' }, 'admin');
    });
    return metadata(id);
  }
  function summary() {
    return { total: definitions.length, connected: 0, errors: s.one("SELECT COUNT(*) n FROM os_connections WHERE check_status='Errore'").n };
  }
  return { state, save, check, summary };
}
