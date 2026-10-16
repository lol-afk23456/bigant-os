import { AppError, requireClient, requireOwner, text } from './store.js';

const agencyId = 'demo-bigant';
const decode = value => {
  if (typeof value !== 'string' || value.length > 250000) return null;
  try { const result = JSON.parse(value); return result && typeof result === 'object' && !Array.isArray(result) ? result : null; }
  catch { return null; }
};
const words = value => typeof value === 'string' ? value : '';
function priorities(value, sciame) {
  if (!Array.isArray(value) || !value.length || value.length > 3) return null;
  const rows = value.map(row => ({ title: words(sciame ? row?.titolo : row?.priority), reason: words(sciame ? row?.motivo : row?.reason), next: words(sciame ? row?.azione : row?.next) }));
  return rows.every(row => row.title.trim() && row.reason.trim() && row.next.trim()) ? rows : null;
}

// A read model of existing outputs: no model call, approval or execution here.
export function directorPriorities(store, user) {
  const actor = user?.id && store.one('SELECT id,role,active FROM os_users WHERE id=?', user.id);
  if (!actor) throw new AppError('Accesso non più disponibile.', 403);
  requireOwner(actor); requireClient(store, actor, agencyId);
  const local = store.one(`SELECT o.* FROM os_agent_outputs o JOIN os_jobs j ON j.id=o.job_id
    WHERE o.agent='director' AND o.client_id=? AND j.client_id=o.client_id AND j.agent=o.agent AND j.status='done'
    ORDER BY o.updated_at DESC,o.rowid DESC LIMIT 1`, agencyId);
  const ai = store.one(`SELECT * FROM os_sciame_passi WHERE agente='direttore-crescita' AND client_id=? AND flusso='crescita'
    ORDER BY created_at DESC,rowid DESC LIMIT 1`, agencyId);
  const candidates = [local && { kind: 'procedure', row: local, date: local.updated_at }, ai && { kind: 'sciame', row: ai, date: ai.finished_at || ai.created_at }]
    .filter(Boolean).sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0) || a.kind.localeCompare(b.kind));
  if (!candidates.length) return { clientId: agencyId, current: null };
  const { kind, row, date } = candidates[0], sciame = kind === 'sciame';
  const payload = decode(sciame ? row.output_json : row.payload);
  const version = sciame ? 1 : row.version;
  const title = sciame ? 'Priorità del Direttore Crescita' : row.title;
  const source = sciame ? 'Sciame · Direttore Crescita' : 'Procedura locale · Direttore Crescita';
  const current = { id: row.id, kind, title, body: '', items: [], updatedAt: date, version,
    mode: sciame ? (row.motore === 'demo' ? 'DEMO · motore di prova' : 'DEMO · risultato AI su dati di prova') : 'DEMO · procedura locale',
    source, approvalStatus: 'needs_review', decisionAt: null, decisionBy: null,
    quality: sciame ? row.esito_qualita : 'Verifica umana richiesta', available: false,
    notice: 'L’ultimo risultato non è consultabile. Controlla l’esecuzione nello Storico.' };
  if (!payload) return { clientId: agencyId, current };
  if (sciame && (!['completato', 'in_attesa_approvazione'].includes(row.stato) || row.esito_qualita !== 'approvabile')) {
    current.notice = ['al_lavoro', 'controllo_qualita', 'in_coda'].includes(row.stato)
      ? 'Il Direttore sta preparando o verificando la proposta. Riapri le priorità dopo il completamento.'
      : 'L’ultima proposta è ferma o non ha superato Qualità. Controlla il motivo nello Storico.';
    return { clientId: agencyId, current };
  }
  // Manual revisions change body, not the original structured priorities in payload.
  const edited = !sciame && payload.edited === true;
  const items = edited ? [] : priorities(sciame ? payload.priorita : payload.priorities, sciame);
  if (!items || (edited && !words(row.body).trim())) return { clientId: agencyId, current };
  current.items = items;
  current.body = sciame ? words(payload.sintesi) : row.body;
  current.available = true;
  current.notice = edited ? 'Testo revisionato: leggi questa versione. Le priorità della versione precedente non vengono riproposte.' : 'Proposte da valutare: la lettura non avvia lavori e non registra una decisione.';
  const approval = store.one("SELECT * FROM os_approvals WHERE kind=? AND client_id=? AND entity_id=? AND version=?", sciame ? 'sciame_output' : 'agent_output', agencyId, row.id, version);
  const matches = approval && (sciame ? approval.id === row.approvazione_id && approval.body === text(payload.sintesi, 1500) : approval.title === row.title && approval.body === row.body);
  if (matches && ['pending', 'approved', 'rejected', 'changes'].includes(approval.status)) {
    current.approvalStatus = approval.status;
    if (approval.status !== 'pending') {
      const decider = approval.decision_by && store.one('SELECT name FROM os_users WHERE id=?', approval.decision_by);
      if (decider && Number.isFinite(Date.parse(approval.decision_at))) {
        current.decisionAt = approval.decision_at;
        current.decisionBy = approval.decision_by === 'os-orchestrator' ? 'Passaggio interno DEMO' : decider.name;
        if (approval.decision_by === 'os-orchestrator') current.approvalStatus = 'simulated';
      } else current.approvalStatus = 'needs_review';
    }
  }
  return { clientId: agencyId, current };
}
