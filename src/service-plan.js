import { AppError, requireOwner, text, now } from './store.js';
import { services, agentDefinitions } from './registry.js';
import { agentServices } from './agents/catalog.js';
import { catalogoServizi } from './servizi/catalogo.js';

const states = ['Attivo', 'In preparazione', 'Futuro'];
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
// The playbook is the commercial catalog. Unmapped specialties remain available too.
const definitions = [...catalogoServizi.map(item => ({ id: item.codice, name: item.nome, source: item.scheda, sourceStatus: item.statoPlaybook,
  description: item.problema, inputs: item.richieste, outputs: item.include, steps: item.flusso, agents: item.agenti, registryIds: item.registro,
  initialStatus: item.statoPlaybook.startsWith('ATTIVO') ? 'Attivo' : /^IN PARTE|^IN COSTRUZIONE/.test(item.statoPlaybook) ? 'In preparazione' : 'Futuro' })),
...services.filter(item => item.status !== 'Escluso' && !catalogoServizi.some(row => row.registro.includes(item.id))).map(item => ({
  id: item.id, name: item.name, source: 'src/registry.js', sourceStatus: item.status, description: item.deliverables,
  inputs: [], outputs: [item.deliverables], steps: [item.activation], registryIds: [item.id],
  agents: agentDefinitions.filter(agent => agentServices[agent.id]?.includes(item.id)).map(agent => agent.id), initialStatus: 'Futuro'
}))];

export function createServicePlan({ store: s, agentConfig }) {
  s.db.exec(`CREATE TABLE IF NOT EXISTS os_service_plan (
    service TEXT PRIMARY KEY, status TEXT NOT NULL, missing TEXT NOT NULL, target_date TEXT,
    version INTEGER NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS os_price_list (
    id TEXT PRIMARY KEY, service TEXT NOT NULL DEFAULT '', name TEXT NOT NULL, price_cents INTEGER NOT NULL,
    unit TEXT NOT NULL, notes TEXT NOT NULL, effective_date TEXT NOT NULL, created_at TEXT NOT NULL, created_by TEXT NOT NULL
  );`);
  function item(id) {
    const definition = definitions.find(row => row.id === id);
    if (!definition) throw new AppError('Servizio non trovato.', 404);
    const plan = s.one('SELECT * FROM os_service_plan WHERE service=?', id) || {
      status: definition.initialStatus, missing: '', target_date: null, version: 0, updated_at: null, updated_by: null
    };
    return { ...definition, plan, agents: definition.agents.map(id => {
      const agent = agentConfig.entry(id); return { id, name: agent.name, status: agent.operationalStatus };
    }) };
  }
  function state(user) {
    requireOwner(user);
    return { items: definitions.map(row => item(row.id)), prices: s.query('SELECT * FROM os_price_list ORDER BY effective_date DESC,created_at DESC') };
  }
  function save(user, id, b) {
    requireOwner(user); const previous = item(id);
    if (b.version !== previous.plan.version) throw new AppError('Il piano è cambiato. Ricarica prima di salvare.', 409);
    if (!states.includes(b.status)) throw new AppError('Stato del servizio non valido.');
    if (b.targetDate && !validDate(b.targetDate)) throw new AppError('Data obiettivo non valida.');
    if (typeof b.missing !== 'string' || b.missing.length > 6000) throw new AppError('Indica i prossimi passi entro 6000 caratteri.');
    s.transaction(() => {
      s.run('INSERT INTO os_service_plan VALUES(?,?,?,?,?,?,?) ON CONFLICT(service) DO UPDATE SET status=excluded.status,missing=excluded.missing,target_date=excluded.target_date,version=os_service_plan.version+1,updated_at=excluded.updated_at,updated_by=excluded.updated_by',
        id, b.status, text(b.missing, 6000), b.targetDate || null, 1, now(), user.id);
      s.audit(user, null, 'Piano di attivazione aggiornato', id, { status: b.status, version: previous.plan.version + 1 }, 'admin');
    });
    return item(id);
  }
  function addPrice(user, b) {
    requireOwner(user);
    if (typeof b.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(b.requestId)) throw new AppError('Identificativo di salvataggio non valido.');
    if (!text(b.name, 160) || !['mese', 'anno', 'pezzo', 'pacchetto', 'progetto', 'ora', 'giorno'].includes(b.unit) || !validDate(b.effectiveDate)) throw new AppError('Compila nome, unità e data della voce.');
    if (!Number.isSafeInteger(b.priceCents) || b.priceCents < 0 || b.priceCents > 100000000) throw new AppError('Prezzo non valido: usa al massimo due decimali.');
    if (b.service && !definitions.some(row => row.id === b.service)) throw new AppError('Servizio non valido.');
    const values = [b.service || '', text(b.name, 160), b.priceCents, b.unit, text(b.notes, 4000), b.effectiveDate];
    const existing = s.one('SELECT * FROM os_price_list WHERE id=?', b.requestId);
    if (existing) {
      if (JSON.stringify([existing.service, existing.name, existing.price_cents, existing.unit, existing.notes, existing.effective_date]) !== JSON.stringify(values)) throw new AppError('Questa richiesta è già stata salvata con altri dati.', 409);
      return existing;
    }
    s.transaction(() => {
      s.run('INSERT INTO os_price_list VALUES(?,?,?,?,?,?,?,?,?)', b.requestId, ...values, now(), user.id);
      s.audit(user, null, 'Voce di listino aggiunta', b.requestId, {}, 'admin');
    });
    return s.one('SELECT * FROM os_price_list WHERE id=?', b.requestId);
  }
  return { state, save, addPrice };
}
