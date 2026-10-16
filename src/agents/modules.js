import { createHash } from 'node:crypto';
import { AppError, requireClient, requireOwner, now } from '../store.js';
import { canContact } from '../growth-domain.js';
import { createEngine } from '../growth-engine.js';

const supported = new Set(['research', 'analyst', 'commercial', 'fidelity']);
const queues = new WeakMap();
const digest = value => createHash('sha256').update(value).digest('hex');
const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, ordered(value[k])])) : value;
function parse(input) {
  let value;
  try { value = typeof input === 'string' ? JSON.parse(input) : input ?? {}; } catch { throw new AppError('Input agente non valido.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AppError('Input agente non valido.');
  for (const k of ['leadId', 'incomingId', 'programId', 'campaignId', 'kind', 'query']) if (value[k] !== undefined && (typeof value[k] !== 'string' || value[k].length > (k === 'query' ? 250 : 128))) throw new AppError(`Input ${k} non valido.`);
  if (value.kind && !['initial', 'reply', 'followup'].includes(value.kind)) throw new AppError('Tipo di bozza non valido.');
  return value;
}

/** Restricted adapters: they never drain a module queue or call any delivery handler. */
export function createModuleAgentRunner({ store, growth, fidelity }) {
  store.db.exec(`CREATE TABLE IF NOT EXISTS os_module_agent_runs(
    job_id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES os_clients(id),agent TEXT NOT NULL,
    fingerprint TEXT NOT NULL,plan_json TEXT NOT NULL DEFAULT '{}',result_json TEXT,updated_at TEXT NOT NULL
  );`);
  if (!queues.has(store)) queues.set(store, new Map());
  const serial = queues.get(store);

  function authorize(job, user, input) {
    requireOwner(user);
    const live = store.one('SELECT id,role,active,tenant_id FROM os_users WHERE id=?', user.id);
    if (!live?.active || live.role !== user.role || live.tenant_id !== (user.tenant_id ?? null)) throw new AppError('Identità agente non valida.', 403);
    requireClient(store, user, job.client_id);
    if (!supported.has(job.agent)) throw new AppError('Agente di modulo non previsto.');
    if (typeof job.id !== 'string' || !job.id || job.id.length > 128) throw new AppError('Job non valido.');
    const client = store.one('SELECT * FROM os_clients WHERE id=?', job.client_id);
    const service = job.agent === 'fidelity' ? 'fidelity' : 'growth';
    if (!JSON.parse(client.services_json).includes(service)) throw new AppError('Servizio non attivo per questa attività.', 403);
    if (job.agent === 'fidelity' && !fidelity || job.agent !== 'fidelity' && !growth) throw new AppError('Modulo non disponibile.', 409);
    const scope = [
      ['leadId', 'gr_leads', 'workspace'], ['incomingId', 'gr_messages', 'workspace'],
      ['programId', 'fi_programs', 'tenant_id'], ['campaignId', 'fi_campaigns', 'tenant_id'],
    ];
    for (const [key, table, column] of scope) if (input[key] && !store.one(`SELECT id FROM ${table} WHERE id=? AND ${column}=?`, input[key], job.client_id)) throw new AppError('Record non disponibile per questa attività.', 404);
    if (input.incomingId) {
      const incoming = store.one("SELECT * FROM gr_messages WHERE workspace=? AND id=? AND direction='in'", job.client_id, input.incomingId);
      if (!incoming || input.leadId && incoming.lead_id !== input.leadId) throw new AppError('Risposta non disponibile per questa azienda.', 404);
    }
    if (input.campaignId && input.programId && store.one('SELECT program_id FROM fi_campaigns WHERE id=? AND tenant_id=?', input.campaignId, job.client_id)?.program_id !== input.programId) throw new AppError('Programma diverso dalla campagna.', 409);
    return { client, service };
  }

  async function execute(job, user, input) {
    const { client, service } = authorize(job, user, input), w = job.client_id;
    const fingerprint = digest(JSON.stringify(ordered({ clientId: w, agent: job.agent, input })));
    let marker = store.one('SELECT * FROM os_module_agent_runs WHERE job_id=?', job.id);
    if (marker && marker.fingerprint !== fingerprint) throw new AppError('Job già usato per un input diverso.', 409);
    if (marker?.result_json) return JSON.parse(marker.result_json);
    if (!marker) {
      store.run('INSERT INTO os_module_agent_runs(job_id,client_id,agent,fingerprint,updated_at) VALUES(?,?,?,?,?)', job.id, w, job.agent, fingerprint, now());
      marker = store.one('SELECT * FROM os_module_agent_runs WHERE job_id=?', job.id);
    }
    const plan = JSON.parse(marker.plan_json), reference = digest(job.id).slice(0, 24);
    const savePlan = () => store.run('UPDATE os_module_agent_runs SET plan_json=?,updated_at=? WHERE job_id=?', JSON.stringify(plan), now(), job.id);
    const base = { service, mode: 'DEMO offline', costCents: 0, visibility: 'internal', sources: [`SOP: docs/SOP-AGENTI-MODULI.md · ${job.agent}`, `Cliente ${w} · archivio comune DEMO`], links: { clientId: w } };
    function finish(value) {
      const output = { ...base, status: 'completed', ...value };
      store.run('UPDATE os_module_agent_runs SET result_json=?,updated_at=? WHERE job_id=?', JSON.stringify(output), now(), job.id);
      return output;
    }
    const needs = (title, reason, links = {}) => finish({ title, summary: reason, body: `DEMO offline\n\n${reason}\n\nNessun consenso, impostazione o invio modificato.`, status: 'needs_input', prerequisite: true, links: { ...base.links, ...links } });
    const ensureRunning = () => {
      authorize(job, user, input);
      if (store.getSetting('paused') === 'true' || job.agent !== 'fidelity' && growth.store.settings(w).paused) throw new AppError('Attività sospesa durante l’esecuzione. Nessuna ripresa automatica della pausa.', 409);
    };
    if (store.getSetting('paused') === 'true') return needs('Esecuzione sospesa', 'La pausa centrale è attiva. Il socio deve riprendere le attività.');
    if (job.agent !== 'fidelity') {
      const s = growth.store;
      s.workspace(w);
      if (s.settings(w).paused) return needs('Growth in pausa', 'Le attività Growth di questo cliente sono in pausa. Attivare la prova dalle impostazioni prima di avviare un nuovo job.');
      // Prevent chained drafts, without changing persisted settings. All providers remain offline.
      const scoped = { ...s, settings: id => ({ ...s.settings(id), autoDraft: false }), run: (...args) => { ensureRunning(); return s.run(...args); } };
      const engine = createEngine(scoped, growth.providers, { origin: 'http://127.0.0.1:4330/api/growth' });
      if (job.agent === 'research') {
        if (!plan.results) {
          plan.query = input.query?.trim() || `${s.settings(w).sector || 'aziende e attività locali'} ${s.settings(w).region} sito ufficiale`;
          plan.beforeIds = s.query('SELECT id FROM leads WHERE workspace=?', w).map(l => l.id);
          plan.results = await growth.providers.search(w, plan.query, s.settings(w).researchLimit);
          if (!plan.results.every(r => new URL(r.url).hostname.endsWith('.example'))) throw new AppError('Il lotto deve contenere soltanto fonti DEMO.', 409);
          savePlan();
        }
        ensureRunning();
        if (!plan.results.length) return needs('Ricerca: lotto vuoto', 'Il limite di ricerca o il lotto DEMO non contiene aziende da analizzare.');
        const researchEngine = createEngine(scoped, { ...growth.providers, search: async () => plan.results }, { origin: 'http://127.0.0.1:4330/api/growth' });
        await researchEngine.handlers.research(w, { query: plan.query });
        const leads = plan.results.map(r => s.one('SELECT * FROM leads WHERE workspace=? AND domain=?', w, new URL(r.url).hostname.toLowerCase().replace(/^www\./, ''))).filter(Boolean);
        plan.analyzed ??= [];
        for (const lead of leads) if (!plan.analyzed.includes(lead.id)) {
          ensureRunning();
          await engine.handlers.analyze(w, { leadId: lead.id });
          store.transaction(() => {
            s.run("UPDATE jobs SET status='done',error=NULL,finished=? WHERE workspace=? AND dedupe=? AND status='queued'", now(), w, `analyze:${lead.id}`);
            plan.analyzed.push(lead.id); savePlan();
          });
        }
        const fresh = leads.map(l => s.lead(w, l.id));
        const added = fresh.filter(l => !plan.beforeIds.includes(l.id)).length;
        return finish({ title: 'Ricerca e analisi DEMO completate', summary: `${fresh.length} aziende di esempio analizzate: ${added} aggiunte, ${fresh.length - added} già presenti.`, body: fresh.map(l => `${l.company}\nPertinenza DEMO: ${l.score}/100\n${l.analysis}`).join('\n\n'), sources: [...base.sources, ...plan.results.map(r => `${r.url} · fixture inventata, nessuna visita online`)], links: { ...base.links, leadIds: fresh.map(l => l.id), added } });
      }
      if (!plan.leadId) {
        let candidate = input.leadId ? s.lead(w, input.leadId) : null;
        if (!candidate && input.incomingId) candidate = s.lead(w, s.one('SELECT lead_id FROM messages WHERE workspace=? AND id=?', w, input.incomingId).lead_id);
        const leads = s.query('SELECT * FROM leads WHERE workspace=? ORDER BY created,id', w);
        if (!candidate) candidate = job.agent === 'analyst' ? leads.find(l => l.website) : leads.find(l => canContact(s, w, l, input.kind || 'initial') === null);
        if (!candidate) return needs(job.agent === 'analyst' ? 'Analisi: dati mancanti' : 'Commerciale: contatto da autorizzare', job.agent === 'analyst' ? 'Aggiungere un lead DEMO con sito prima dell’analisi.' : 'Nessun contatto idoneo nel workspace: servono email DEMO, autorizzazione documentata e trattativa aperta.');
        plan.leadId = candidate.id; savePlan();
      }
      const lead = s.lead(w, plan.leadId);
      if (!lead) throw new AppError('Azienda non disponibile per questa attività.', 404);
      if (job.agent === 'analyst') {
        if (!lead.website) return needs('Analisi: sito mancante', 'Il lead selezionato non ha un sito DEMO.', { leadId: lead.id });
        await engine.handlers.analyze(w, { leadId: lead.id });
        const analyzed = s.lead(w, lead.id);
        return finish({ title: `Analisi · ${analyzed.company}`, summary: `Analisi salvata nel CRM; pertinenza DEMO ${analyzed.score}/100.`, body: analyzed.analysis, sources: [...base.sources, `${analyzed.website} · fonte di esempio offline`], links: { ...base.links, leadId: analyzed.id } });
      }
      const kind = input.kind || 'initial';
      const reason = canContact(s, w, lead, kind);
      if (reason) return needs('Commerciale: prerequisiti mancanti', reason, { leadId: lead.id });
      if (!lead.email.endsWith('.example')) return needs('Commerciale: dato non DEMO', 'Il contatto deve usare un indirizzo inventato .example.', { leadId: lead.id });
      if (kind === 'reply' && !input.incomingId) return needs('Commerciale: risposta originale mancante', 'Selezionare il messaggio ricevuto a cui preparare una risposta.', { leadId: lead.id });
      const tag = `Riferimento bozza DEMO: ${reference}`;
      let message = s.one("SELECT * FROM messages WHERE workspace=? AND lead_id=? AND direction='out' AND instr(body,?)>0 ORDER BY created LIMIT 1", w, lead.id, tag);
      message ??= s.one("SELECT * FROM messages WHERE workspace=? AND lead_id=? AND direction='out' AND status IN ('draft','approved','sending','uncertain') ORDER BY created LIMIT 1", w, lead.id);
      if (!message) {
        const draftEngine = createEngine(scoped, { ...growth.providers, ai: async (...args) => {
          const result = await growth.providers.ai(...args);
          ensureRunning();
          const changed = canContact(s, w, s.lead(w, lead.id), kind);
          if (changed) throw new AppError(changed, 409);
          return { ...result, body: result.body ? `${result.body}\n\n${tag}` : result.body };
        } }, { origin: 'http://127.0.0.1:4330/api/growth' });
        const id = await draftEngine.handlers.draft(w, { leadId: lead.id, kind, incomingId: input.incomingId });
        if (id) message = s.one('SELECT * FROM messages WHERE workspace=? AND id=?', w, id);
      }
      if (!message) return needs('Commerciale: intervento del socio', 'Il modulo ha rilevato una richiesta da gestire personalmente o un rifiuto. Nessuna bozza promozionale è stata creata.', { leadId: lead.id });
      let approval = store.one("SELECT * FROM os_approvals WHERE client_id=? AND kind='growth_message' AND entity_id=? ORDER BY version DESC LIMIT 1", w, message.id);
      if (!approval && message.status === 'draft') { s.requestApproval(w, message.id); approval = store.one("SELECT * FROM os_approvals WHERE client_id=? AND kind='growth_message' AND entity_id=? ORDER BY version DESC LIMIT 1", w, message.id); }
      return finish({ title: 'Bozza commerciale nel CRM', summary: `Messaggio ${message.status}; decisione umana richiesta. Nessun invio eseguito.`, body: `${message.subject}\n\n${message.body}`, sources: [...base.sources, `Lead ${lead.id} · ${lead.source || 'fonte DEMO non specificata'}`, `Autorizzazione già registrata: ${lead.consent_proof}`], links: { ...base.links, leadId: lead.id, messageId: message.id, approvalId: approval?.id ?? null } });
    }
    const call = async (method, path, body = {}) => {
      ensureRunning();
      return (await fidelity.handle({ method, path, body, user, clientId: w })).data;
    };
    let campaignId = input.campaignId || plan.campaignId;
    if (!campaignId) {
      const name = `Relazioni DEMO · OS ${reference}`;
      campaignId = store.one('SELECT id FROM fi_campaigns WHERE tenant_id=? AND name=?', w, name)?.id;
      if (!campaignId) {
        const programs = (await call('GET', '/programs')).items;
        const program = input.programId ? programs.find(p => p.id === input.programId) : programs.find(p => p.active && (!p.expiresAt || p.expiresAt > now()));
        if (!program?.active || program.expiresAt && program.expiresAt <= now()) return needs('Fidelity: programma da predisporre', 'Non è disponibile un programma attivo per questo cliente.');
        const recipients = (await call('GET', `/members?segment=marketing&programId=${encodeURIComponent(program.id)}`)).items;
        if (!recipients.length) return needs('Fidelity: consensi da verificare', 'Il programma non ha iscritti idonei con consenso marketing registrato. Nessuna campagna creata.', { programId: program.id });
        campaignId = (await call('POST', '/campaigns', { name, title: 'Un nuovo incontro · DEMO', body: `DEMO · ${client.name}: una proposta di relazione da verificare con il gestore, senza sconti o premi inventati. Nessuna notifica sarà inviata.`, segment: 'all', programId: program.id })).id;
      }
      plan.campaignId = campaignId; savePlan();
    }
    let campaign = (await call('GET', `/campaigns/${encodeURIComponent(campaignId)}`)).campaign;
    if (['rejected', 'changes_requested'].includes(campaign.status)) return needs('Fidelity: revisione richiesta', 'La versione della campagna è stata rifiutata o richiede modifiche. Il gestore deve revisionarla prima di una nuova preparazione.', { campaignId });
    const preview = await call('GET', `/campaigns/${encodeURIComponent(campaignId)}/preview`);
    if (!preview.recipients.length) return needs('Fidelity: nessun destinatario idoneo', 'La campagna non ha destinatari con programma attivo e consenso marketing. Nessun invio o nuova preparazione.', { campaignId });
    if (campaign.status === 'draft') campaign = (await call('POST', `/campaigns/${encodeURIComponent(campaignId)}/prepare`)).campaign;
    const approval = store.one("SELECT id,status FROM os_approvals WHERE client_id=? AND kind='fidelity_campaign' AND entity_id=? AND version=?", w, campaignId, campaign.version);
    return finish({ title: 'Campagna Fidelity preparata', summary: `${preview.recipients.length} iscritti idonei; stato ${campaign.status}. Nessun invio eseguito.`, body: `${campaign.title}\n\n${campaign.body}\n\nLa decisione umana è separata dall’invio. Apple e Google Wallet restano scollegati.`, sources: [...base.sources, `Programma ${campaign.programId || 'tutti'} · consensi già presenti in Fidelity`], links: { ...base.links, campaignId, programId: campaign.programId, approvalId: approval?.id ?? null, recipientIds: preview.recipients.map(m => m.id) } });
  }

  return async function run(job, user) {
    const input = parse(job?.input), key = job?.client_id;
    authorize(job, user, input);
    const previous = serial.get(key) ?? Promise.resolve();
    const work = previous.catch(() => {}).then(() => execute(job, user, input));
    serial.set(key, work);
    try { return await work; } finally { if (serial.get(key) === work) serial.delete(key); }
  };
}
