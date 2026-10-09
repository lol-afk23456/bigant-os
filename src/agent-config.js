import { AppError, requireOwner, now, text } from './store.js';
import { agentDefinitions, services } from './registry.js';
import { agentServices } from './agents/catalog.js';
import { perRegistro } from './sciame/agenti.js';
import { createMotore, istruzioniAgente } from './motori/index.js';

export function createAgentConfig({ store: s, root, env = {}, clock = () => new Date(), runtimeReady = () => false }) {
  s.db.exec(`CREATE TABLE IF NOT EXISTS os_agent_config (
    agent TEXT PRIMARY KEY, task TEXT NOT NULL, service TEXT NOT NULL DEFAULT '', instructions TEXT NOT NULL,
    sources TEXT NOT NULL, quality TEXT NOT NULL, estimated_cents INTEGER NOT NULL, provider TEXT NOT NULL,
    cadence TEXT NOT NULL DEFAULT 'manual', authorized INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL
  );`);
  const instructions = id => { try { return perRegistro[id] ? istruzioniAgente(root, perRegistro[id]) : ''; } catch { return ''; } };
  function entry(id) {
    const definition = agentDefinitions.find(row => row.id === id);
    if (!definition) throw new AppError('Agente non trovato.', 404);
    const saved = s.one('SELECT * FROM os_agent_config WHERE agent=?', id);
    const config = saved || { agent: id, task: definition.purpose, service: agentServices[id]?.[0] || '', instructions: instructions(id),
      sources: 'Scheda informativa del cliente e dati autorizzati del servizio', quality: 'Controllo delle fonti, qualità e approvazione umana prima di ogni uscita',
      estimated_cents: 40, provider: '', cadence: 'manual', authorized: 0, enabled: 0, version: 0, updated_at: null };
    const prepared = !!perRegistro[id] && !!config.instructions && !!config.task && !!config.sources && !!config.quality;
    const providerReady = ['api', 'openai'].includes(config.provider) && createMotore({ nome: config.provider, root, env }).stato().disponibile;
    const verified = prepared && providerReady && runtimeReady(id);
    const active = verified && !!config.authorized && !!config.enabled;
    return { ...definition, config, aiId:perRegistro[id]||null, hasAIInstructions: !!instructions(id), readyForAI: verified,
      operationalStatus: active ? 'Attivo' : verified ? 'AI pronta' : config.task ? 'Base' : 'Da configurare',
      activationBlock: !runtimeReady(id) ? 'Il percorso con dati reali deve ancora essere collaudato.' : !providerReady ? 'Scegli e configura il fornitore AI.' : null };
  }
  function requireRun(id, { automatic = false } = {}) {
    const agent = entry(id);
    if (agent.operationalStatus !== 'Attivo' || (automatic && agent.config.cadence === 'manual')) throw new AppError('Agente non attivo per il lavoro reale. Completa configurazione, collaudo e autorizzazione.', 409);
    return agent;
  }
  function costs() {
    const month = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit' }).format(clock()).slice(0, 7);
    const rows = s.query("SELECT agent,status,SUM(cents) cents FROM os_costs WHERE month=? AND status IN('reserved','charged') GROUP BY agent,status", month);
    return { month, rows: agentDefinitions.map(agent => {
      const matching = rows.filter(row => row.agent === agent.id || row.agent === 'sciame:' + perRegistro[agent.id]);
      return { agent: agent.id, name: agent.name, chargedCents: matching.filter(row => row.status === 'charged').reduce((n, row) => n + row.cents, 0), reservedCents: matching.filter(row => row.status === 'reserved').reduce((n, row) => n + row.cents, 0) };
    }), otherCents: rows.filter(row => !agentDefinitions.some(agent => row.agent === agent.id || row.agent === 'sciame:' + perRegistro[agent.id])).reduce((n, row) => n + row.cents, 0) };
  }
  function state(user) { requireOwner(user); return { history:s.query('SELECT id,giro_id,agente,client_id,compito,stato,motore,esito_qualita,created_at,finished_at FROM os_sciame_passi ORDER BY created_at DESC LIMIT 150'), items: agentDefinitions.map(agent => entry(agent.id)), costs: costs(), providers: ['api', 'openai'].map(id => ({ id, name: id === 'api' ? 'Anthropic' : 'OpenAI', configured: createMotore({ nome: id, root, env }).stato().disponibile })) }; }
  function save(user, id, b) {
    requireOwner(user); const previous = entry(id);
    if (b.version !== previous.config.version) throw new AppError('Configurazione cambiata. Ricarica prima di salvare.', 409);
    if (b.service !== undefined && !['', ...services.map(item => item.id)].includes(b.service)) throw new AppError('Servizio non valido.');
    if (!['', 'api', 'openai'].includes(b.provider) || !['manual', 'daily', 'weekly-monday', 'weekly-friday', 'monthly'].includes(b.cadence)) throw new AppError('Fornitore o frequenza non validi.');
    if (!Number.isSafeInteger(b.estimatedCents) || b.estimatedCents < 1 || b.estimatedCents > 5000) throw new AppError('Costo stimato non valido.');
    if (![b.task, b.sources, b.quality].every(value => typeof value === 'string' && value.trim())) throw new AppError('Compito, fonti e controllo qualità sono obbligatori.');
    if (b.enabled === true && (!runtimeReady(id) || b.authorized !== true || !b.instructions?.trim() || !['api', 'openai'].includes(b.provider) || !createMotore({ nome: b.provider, root, env }).stato().disponibile)) throw new AppError('Attivazione non disponibile: completa fornitore, istruzioni, collaudo dei dati reali e autorizzazione.', 409);
    s.transaction(() => {
      s.run('INSERT INTO os_agent_config VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(agent) DO UPDATE SET task=excluded.task,service=excluded.service,instructions=excluded.instructions,sources=excluded.sources,quality=excluded.quality,estimated_cents=excluded.estimated_cents,provider=excluded.provider,cadence=excluded.cadence,authorized=excluded.authorized,enabled=excluded.enabled,version=os_agent_config.version+1,updated_at=excluded.updated_at',
        id, text(b.task, 4000), b.service ?? previous.config.service, text(b.instructions, 20000), text(b.sources, 4000), text(b.quality, 4000), b.estimatedCents, b.provider, b.cadence, b.authorized === true ? 1 : 0, b.enabled === true ? 1 : 0, 1, now());
      if (b.enabled !== true) s.run('UPDATE os_schedules SET enabled=0 WHERE agent=?', id);
      s.audit(user, null, 'Configurazione agente aggiornata', id, { enabled: b.enabled === true, provider: b.provider }, 'admin');
    });
    return entry(id);
  }
  return { entry, state, save, requireRun, costs };
}
