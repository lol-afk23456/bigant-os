import { AppError, requireOwner, text, now } from './store.js';

export const trackerCategories = [
  ['recurring_billed', 'Canoni ricorrenti fatturati'], ['recurring_unbilled', 'Canoni ricorrenti da fatturare'],
  ['annual', 'Hosting e canoni annuali'], ['websites', 'Siti'], ['photo_video', 'Foto e video'],
  ['promotional', 'Promozionale'], ['social_package', 'Gestione social a pacchetto'], ['supplies', 'Forniture con saldo residuo'],
  ['withdrawals', 'Prelievi'], ['unclassified', 'Da classificare']
].map(([id, name]) => ({ id, name }));

export function createBilling({ store: s, administration }) {
  s.db.exec(`CREATE TABLE IF NOT EXISTS os_fin_tracker_labels (
    invoice_id TEXT PRIMARY KEY REFERENCES os_fin_invoices(id), category TEXT NOT NULL, description TEXT NOT NULL,
    issued_ref TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL
  );`);
  function state(user) {
    requireOwner(user); const data = administration.state(null, user);
    const labels = s.query('SELECT * FROM os_fin_tracker_labels');
    const tracker = data.invoices.map(invoice => {
      const label = labels.find(row => row.invoice_id === invoice.id);
      const payments = data.movements.filter(row => row.invoice_id === invoice.id);
      return { ...invoice, category: label?.category || (invoice.contract_id ? (invoice.status === 'draft' ? 'recurring_unbilled' : 'recurring_billed') : 'unclassified'),
        description: label?.description || invoice.number, issuedRef: label?.issued_ref || '', labelVersion: label?.version || 0,
        methods: [...new Set(payments.map(row => row.method))], paid: invoice.remaining_cents === 0 };
    });
    const periods = s.query('SELECT * FROM os_fin_compensation_periods');
    const compensations = data.obligations.filter(row => row.kind === 'collaborator').map(row => ({ ...row,
      period: periods.find(period => period.obligation_id === row.id)?.month || null, paid: row.remaining_cents === 0 }));
    const sum = (rows, key) => { const value=rows.reduce((total,row)=>total+row[key],0);if(!Number.isSafeInteger(value))throw new AppError('Totale fuori intervallo.');return value; };
    const month = data.asOf.slice(0, 7), dueThisMonth = compensations.filter(row => row.period === month);
    const customerBalances = data.counterparties.filter(row=>row.kind==='client').map(party=>({
      id:party.id,name:party.name,remainingCents:sum(tracker.filter(row=>row.counterparty_id===party.id),'remaining_cents')
    })).filter(row=>row.remainingCents>0);
    const until = new Date(data.asOf+'T12:00:00Z'); until.setUTCDate(until.getUTCDate()+30);
    const dueSubscriptions = data.subscriptions.filter(row=>row.active&&row.next_due<=until.toISOString().slice(0,10));
    return { ...data, billing: { officialSource: 'Trello · Fatturazione', sourceConnected: false, categories: trackerCategories,
      tracker, compensations, customerBalances, dueSubscriptions, compensationTotalCents: sum(dueThisMonth,'amount_cents'),
      compensationRemainingCents: sum(dueThisMonth,'remaining_cents'),
      incomeByClient: s.query("SELECT client_id,SUM(CASE WHEN direction='in' THEN amount_cents ELSE -amount_cents END) cents FROM os_fin_movements WHERE kind='income' AND date<=? GROUP BY client_id", data.asOf)
    } };
  }
  function label(user, id, body) {
    requireOwner(user); const invoice = s.one('SELECT * FROM os_fin_invoices WHERE id=?', id);
    if (!invoice) throw new AppError('Voce da fatturare non trovata.', 404);
    const previous = s.one('SELECT * FROM os_fin_tracker_labels WHERE invoice_id=?', id);
    if (body.version !== (previous?.version || 0)) throw new AppError('Il tracker è cambiato. Ricarica prima di salvare.', 409);
    if (!trackerCategories.some(row => row.id === body.category && row.id !== 'withdrawals')) throw new AppError('Categoria non valida.');
    const description = text(body.description, 500), issuedRef = text(body.issuedRef, 160);
    if (!description) throw new AppError('Descrivi il lavoro o il canone.');
    if ((body.category === 'recurring_billed' && !issuedRef) || (body.category === 'recurring_unbilled' && issuedRef)) throw new AppError('Categoria e riferimento della fattura devono essere coerenti.');
    s.transaction(() => {
      s.run('INSERT INTO os_fin_tracker_labels VALUES(?,?,?,?,?,?,?) ON CONFLICT(invoice_id) DO UPDATE SET category=excluded.category,description=excluded.description,issued_ref=excluded.issued_ref,version=os_fin_tracker_labels.version+1,updated_at=excluded.updated_at,updated_by=excluded.updated_by',
        id, body.category, description, issuedRef, 1, now(), user.id);
      s.run('UPDATE os_fin_invoices SET status=? WHERE id=?', issuedRef ? 'issued' : 'draft', id);
      s.audit(user, null, 'Tracker fatturazione aggiornato', id, { version: (previous?.version || 0) + 1, issued: !!issuedRef }, 'admin');
    });
    return { ok: true, version: (previous?.version || 0) + 1 };
  }
  return { state, label };
}
