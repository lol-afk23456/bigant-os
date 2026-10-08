// Provider deterministici offline: nessun import di rete, OAuth o credenziali.
import { randomUUID } from 'node:crypto';
import { AppError } from './growth-domain.js';

export async function websiteText(value) {
  const url = new URL(value);
  if (!url.hostname.endsWith('.example')) throw new AppError('La demo analizza solo siti inventati con dominio .example.', 409);
  return `FONTE DI ESEMPIO, NON CONSULTATA ONLINE. Attività dimostrativa presso ${url.hostname}. Offre servizi locali e desidera migliorare i contenuti video e il sito. Dati inventati per collaudare il flusso.`;
}

export function parseGoogleMessage(m) {
  const headers = Object.fromEntries((m.payload?.headers || []).map(h => [h.name.toLowerCase(), h.value]));
  function body(p) { return p.mimeType === 'text/plain' && p.body?.data ? Buffer.from(p.body.data, 'base64url').toString() : (p.parts || []).map(body).filter(Boolean).join('\n'); }
  const from = headers.from?.match(/<([^>]+)>/)?.[1] || headers.from || '';
  return { id: m.id, threadId: m.threadId, from: from.toLowerCase(), subject: headers.subject || '', body: body(m.payload) || m.snippet || '', replyTo: headers['message-id'] || '', date: Number(m.internalDate || 0), auto: headers['auto-submitted'] && headers['auto-submitted'] !== 'no', sent: m.labelIds?.includes('SENT') };
}

export function demoProviders(s) {
  s.db.exec(`CREATE TABLE IF NOT EXISTS gr_demo_mail(id TEXT PRIMARY KEY,workspace TEXT NOT NULL,request_id TEXT UNIQUE,thread_id TEXT NOT NULL,direction TEXT NOT NULL,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS gr_demo_calendar(id TEXT PRIMARY KEY,workspace TEXT NOT NULL,start TEXT NOT NULL,end TEXT NOT NULL,status TEXT NOT NULL,payload TEXT NOT NULL);`);
  const chargeZero = (w, category) => { const id = s.reserve(w, category, 0, 'Esecuzione DEMO offline: nessun costo'); s.settle(id); };
  async function search(w, query, count = 5) {
    chargeZero(w, 'Ricerca DEMO');
    return Array.from({ length: Math.min(count, 5) }, (_, i) => ({ title: `Attività locale ${i + 1} · DEMO`, url: `https://attivita-${i + 1}.example/`, description: `Risultato inventato per la ricerca «${query}». Nessuna ricerca online eseguita.` }));
  }
  async function ai(w, task, input) {
    chargeZero(w, 'AI DEMO');
    if (task.startsWith('Valuta')) return { score: 72, summary: `DEMO: ${input.company} è un'attività inventata. La fonte di esempio descrive un'esigenza video e sito. Non sono state verificate carenze reali.`, service: 'Video e siti web', reason: 'Ipotesi dimostrativa coerente con i servizi prioritari BigAnt; verifica umana richiesta.' };
    const request = String(input.request || '').toLowerCase();
    if (/disiscriv|non.*interess|non.*contatt|rimuov/.test(request)) return { action: 'stop', reason: 'Rifiuto nella risposta DEMO.' };
    if (/prezz|sconto|contratt|reclam/.test(request)) return { action: 'human', reason: 'Prezzi, contratti o reclami richiedono un socio.' };
    return { subject: `DEMO · Un confronto per ${input.company}`, body: `Ciao,\n\nquesta è una bozza dimostrativa preparata per ${input.company}. BigAnt può affiancarti con video, siti web, social e campagne pubblicitarie. Partiamo dai tuoi obiettivi per capire quale servizio può essere utile.\n\nTi interessa un breve confronto?`, action: request ? 'booking' : 'reply', reason: 'Bozza deterministica di esempio: nessun modello AI collegato.' };
  }
  async function send(w, message) {
    if (!message.to.endsWith('.example')) throw new AppError('La simulazione accetta soltanto destinatari .example.', 409);
    const existing = s.one('SELECT * FROM gr_demo_mail WHERE workspace=? AND request_id=?', w, message.id);
    if (existing) return { id: existing.id, threadId: existing.thread_id, simulated: true };
    const id = `demo-mail-${randomUUID()}`, threadId = message.threadId || `demo-thread-${randomUUID()}`;
    s.run('INSERT INTO gr_demo_mail VALUES(?,?,?,?,?,?)', id, w, message.id, threadId, 'out', JSON.stringify(message));
    return { id, threadId, simulated: true };
  }
  async function findSent(w, id) { const row = s.one("SELECT * FROM gr_demo_mail WHERE workspace=? AND request_id=? AND direction='out'", w, id); return row ? { id: row.id, threadId: row.thread_id, simulated: true } : null; }
  async function thread(w, id) {
    return { messages: s.query('SELECT * FROM gr_demo_mail WHERE workspace=? AND thread_id=?', w, id).map(row => {
      const payload = JSON.parse(row.payload);
      return { id: row.id, threadId: row.thread_id, labelIds: row.direction === 'out' ? ['SENT'] : ['INBOX'], payload: { mimeType: 'text/plain', headers: [{ name: 'From', value: payload.from || payload.to }, { name: 'Subject', value: payload.subject }, { name: 'Message-ID', value: `<${row.id}@growth.example>` }], body: { data: Buffer.from(payload.body).toString('base64url') } } };
    }) };
  }
  function incoming(w, lead, message) {
    const last = s.one("SELECT * FROM messages WHERE workspace=? AND lead_id=? AND direction='out' AND status='simulated_sent' ORDER BY sent DESC LIMIT 1", w, lead.id);
    if (!last) throw new AppError('Simula prima un messaggio approvato verso questo contatto.', 409);
    const id = `demo-incoming-${randomUUID()}`;
    s.run('INSERT INTO gr_demo_mail VALUES(?,?,?,?,?,?)', id, w, null, last.thread_id, 'in', JSON.stringify({ from: lead.email, subject: message.subject || `Re: ${last.subject}`, body: message.body }));
    return id;
  }
  async function busy(w, start, end) { return s.query("SELECT start,end FROM gr_demo_calendar WHERE workspace=? AND status<>'cancelled' AND start<? AND end>?", w, end, start); }
  async function book(w, details) {
    const old = s.one('SELECT * FROM gr_demo_calendar WHERE workspace=? AND id=?', w, details.id);
    if (!old) s.run('INSERT INTO gr_demo_calendar VALUES(?,?,?,?,?,?)', details.id, w, details.start, details.end, 'confirmed', JSON.stringify({ company: details.lead.company }));
    return { id: details.id, htmlLink: '', status: old?.status || 'confirmed', simulated: true };
  }
  async function event(w, id) { const row = s.one('SELECT * FROM gr_demo_calendar WHERE workspace=? AND id=?', w, id); if (!row) throw Object.assign(new AppError('Evento DEMO non trovato.', 404), { remoteStatus: 404 }); return { id: row.id, status: row.status, htmlLink: '', simulated: true }; }
  async function cancelEvent(w, id) { s.run("UPDATE gr_demo_calendar SET status='cancelled' WHERE workspace=? AND id=?", w, id); return { simulated: true }; }
  return { ai, search, send, findSent, thread, incoming, busy, book, event, cancelEvent };
}
