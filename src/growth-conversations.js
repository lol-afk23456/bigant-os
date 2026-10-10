import {randomUUID} from 'node:crypto';
import {AppError} from './store.js';
import {suppression} from './growth-domain.js';
import {gmailId, parseGmailReply, verifyGmailAnchor} from './gmail-message.js';

// Manual reads only. The caller supplies fresh application authorization for every gate.
export function createGrowthConversations({store:root, growthStore:s, authorize, providers, clock=()=>new Date()}) {
  const running = new Set(), time = () => clock().toISOString();
  root.db.exec(`CREATE TABLE IF NOT EXISTS gr_mail_thread_checks(
    workspace TEXT NOT NULL,thread_id TEXT NOT NULL,checked_at TEXT NOT NULL,error TEXT,
    PRIMARY KEY(workspace,thread_id));
  CREATE TABLE IF NOT EXISTS gr_mail_receipts(
    message_id TEXT PRIMARY KEY REFERENCES gr_messages(id),google_email TEXT NOT NULL,sender_email TEXT NOT NULL,
    fingerprint TEXT NOT NULL,imported_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS gr_mail_sync_state(
    workspace TEXT PRIMARY KEY,last_attempt TEXT,last_success TEXT,result_json TEXT);`);
  const anchors = (w,email) => root.query(`SELECT i.*,m.provider_id,m.thread_id,m.lead_id,m.sent FROM gr_mail_intents i
    JOIN gr_messages m ON m.id=i.message_id AND m.workspace=i.workspace
    JOIN gr_leads l ON l.id=m.lead_id AND l.workspace=m.workspace
    LEFT JOIN gr_mail_thread_checks c ON c.workspace=m.workspace AND c.thread_id=m.thread_id
    WHERE i.workspace=? AND i.status='sent' AND m.direction='out' AND m.status='sent'
      AND i.google_email=? AND m.thread_id IS NOT NULL AND m.provider_id IS NOT NULL
    ORDER BY COALESCE(c.checked_at,''),m.sent,m.id`,w,email).filter(row => {
      const payload = JSON.parse(row.payload_json), lead = s.lead(w,row.lead_id);
      return gmailId(row.thread_id) && gmailId(row.provider_id) && payload.from.toLowerCase() === email && payload.to.toLowerCase() === lead.email.toLowerCase();
    });
  function grouped(w,email) {
    const groups = new Map();
    for (const anchor of anchors(w,email)) {
      const group = groups.get(anchor.thread_id) || [];
      group.push(anchor); groups.set(anchor.thread_id,group);
    }
    return [...groups.values()];
  }
  function state(user,w) {
    let access, reason;
    try { access = authorize(user,w); } catch(e) { reason = e.message; }
    const row = root.one('SELECT * FROM gr_mail_sync_state WHERE workspace=?',w);
    return {canSync:!!access,reason:reason||null,running:running.has(w),batchLimit:10,
      eligibleThreads:access?grouped(w,access.google.email).length:0,
      lastAttempt:row?.last_attempt||null,lastSuccess:row?.last_success||null,result:row?.result_json?JSON.parse(row.result_json):null};
  }
  function replyReason(user,w,message) {
    try {
      const access=authorize(user,w),lead=s.lead(w,message.lead_id);
      const receipt=root.one('SELECT * FROM gr_mail_receipts WHERE message_id=?',message.id);
      if(message.workspace!==w||message.direction!=='in'||!receipt||receipt.google_email!==access.google.email||receipt.sender_email!==lead?.email.toLowerCase())return 'Casella o destinatario diversi dalla conversazione originale: non riutilizzare questa risposta.';
      return null;
    } catch(e) { return e.message; }
  }
  function invalidate(w,leadId) {
    for (const message of s.query("SELECT * FROM messages WHERE workspace=? AND lead_id=? AND direction='out' AND status IN ('draft','approved','queued','sending')",w,leadId)) {
      const dispatched = message.status === 'sending' && root.one("SELECT 1 FROM gr_mail_intents WHERE message_id=? AND status='dispatching'",message.id);
      if (!dispatched) s.run("UPDATE messages SET status='cancelled',error='È arrivata una risposta: prepara una nuova bozza.' WHERE id=?",message.id);
      root.run("UPDATE os_approvals SET status='superseded' WHERE kind='growth_message' AND entity_id=? AND status IN ('pending','approved')",message.id);
      root.run("UPDATE gr_approvals SET decision='cancelled',reason='Conversazione aggiornata' WHERE message_id=?",message.id);
    }
    for (const job of s.query("SELECT * FROM jobs WHERE workspace=? AND type='draft' AND status='queued'",w)) {
      if (JSON.parse(job.input).leadId === leadId) s.run("UPDATE jobs SET status='failed',error='È arrivata una risposta: prepara una nuova richiesta.',finished=? WHERE id=?",time(),job.id);
    }
  }
  async function sync(user,w,b={}) {
    const access = authorize(user,w);
    if (b.confirmed !== true) throw new AppError('Conferma la lettura delle conversazioni Growth.',409);
    if (running.has(w)) throw new AppError('Aggiornamento risposte già in corso.',409);
    const all = grouped(w,access.google.email), selected = all.slice(0,10);
    const result = {checked:0,received:0,skipped:0,review:0,errors:0,totalThreads:all.length,batchLimit:10};
    const fresh = () => {
      const current = authorize(user,w);
      if (current.google.version !== access.google.version || current.google.email !== access.google.email) throw new AppError('Casella cambiata durante la lettura: ripeti dalla configurazione attuale.',409);
    };
    running.add(w);
    root.run('INSERT INTO gr_mail_sync_state(workspace,last_attempt) VALUES(?,?) ON CONFLICT(workspace) DO UPDATE SET last_attempt=excluded.last_attempt',w,time());
    try {
      for (const group of selected) {
        fresh();
        const anchor = group[0], lead = s.lead(w,anchor.lead_id), context = JSON.stringify(lead);
        const valid = () => {
          fresh();
          if (group.some(row => row.lead_id !== anchor.lead_id) || JSON.stringify(s.lead(w,anchor.lead_id)) !== context
            || !anchors(w,access.google.email).some(row => row.message_id === anchor.message_id && row.thread_id === anchor.thread_id)) throw new AppError('Contatto o conversazione cambiati durante la lettura.',409);
        };
        try {
          valid();
          const provider = providers(user,access.google.version,(_w,operation,context={}) => {
            valid(); return _w === w && operation === 'gmail-read' && context.threadId === anchor.thread_id;
          });
          const data = await provider.thread(w,anchor.thread_id); valid();
          if (data.id !== anchor.thread_id || !Array.isArray(data.messages) || data.messages.length > 100
            || new Set(data.messages.map(m=>m.id)).size !== data.messages.length) throw new AppError('Thread Gmail incompleto o troppo grande: verifica nella casella.',409);
          for (const own of group) {
            const raw = data.messages.find(m => m.id === own.provider_id);
            if (!raw) throw new AppError('Invio OS non trovato nella conversazione Gmail.',409);
            verifyGmailAnchor(raw,own,clock);
          }
          // Gmail's verified date precedes the local HTTP acknowledgement, sometimes by seconds.
          const firstSent=Math.min(...group.map(own=>Number(data.messages.find(raw=>raw.id===own.provider_id).internalDate)));
          const replyAnchor={...anchor,sent:new Date(firstSent).toISOString()};
          const replies = data.messages.filter(raw => !group.some(row => row.provider_id === raw.id)).map(raw => parseGmailReply(raw,replyAnchor,clock));
          const counts = {received:0,skipped:0,review:0};
          root.transaction(() => {
            valid();
            for (const reply of replies) {
              if (reply.skip) { counts.skipped++; if(reply.review) counts.review++; continue; }
              const existing = s.one('SELECT * FROM messages WHERE workspace=? AND provider_id=?',w,reply.id);
              if (existing) {
                const receipt = root.one('SELECT * FROM gr_mail_receipts WHERE message_id=?',existing.id);
                if (existing.lead_id !== lead.id || existing.direction !== 'in' || !receipt || receipt.google_email !== access.google.email || receipt.fingerprint !== reply.fingerprint) throw new AppError('Risposta già acquisita con contenuto diverso: verifica nella casella.',409);
                counts.skipped++; if(existing.status==='needs_owner')counts.review++; continue;
              }
              const id = randomUUID(), status = reply.stopped?'handled':reply.review?'needs_owner':'received';
              s.run('INSERT INTO messages(id,workspace,lead_id,direction,subject,body,status,provider_id,thread_id,reply_to,created,error) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',id,w,lead.id,'in',reply.subject,reply.body,status,reply.id,reply.threadId,reply.replyTo,reply.created,
                reply.stopped?'Richiesta di interruzione ricevuta.':reply.review?'Controlla la mail originale in Gmail prima di rispondere.':null);
              root.run('INSERT INTO gr_mail_receipts VALUES(?,?,?,?,?)',id,access.google.email,JSON.parse(anchor.payload_json).to.toLowerCase(),reply.fingerprint,time());
              invalidate(w,lead.id);
              if (reply.stopped) suppression(s,w,lead.id,'Richiesta di interruzione ricevuta via email');
              counts.received++; if(reply.review) counts.review++;
            }
            root.run('INSERT INTO gr_mail_thread_checks VALUES(?,?,?,NULL) ON CONFLICT(workspace,thread_id) DO UPDATE SET checked_at=excluded.checked_at,error=NULL',w,anchor.thread_id,time());
            if (counts.received) root.audit(user,w,'Risposte Gmail acquisite',lead.id,{received:counts.received,review:counts.review},'admin');
          });
          for (const key of Object.keys(counts)) result[key] += counts[key];
          result.checked++;
        } catch(e) {
          fresh(); // Revocation aborts the request; never persist the provider's raw error.
          if ([401,403].includes(e.remoteStatus)) throw e;
          result.errors++;
          root.run('INSERT INTO gr_mail_thread_checks VALUES(?,?,?,?) ON CONFLICT(workspace,thread_id) DO UPDATE SET checked_at=excluded.checked_at,error=excluded.error',w,anchor.thread_id,time(),'Conversazione non aggiornata: verifica nella casella Gmail.');
        }
      }
      fresh();
      root.run('UPDATE gr_mail_sync_state SET last_success=CASE WHEN ?=0 THEN ? ELSE last_success END,result_json=? WHERE workspace=?',result.errors,time(),JSON.stringify(result),w);
      root.audit(user,w,'Lettura manuale Gmail terminata',w,result,'admin');
      return result;
    } catch(e) {
      root.run('UPDATE gr_mail_sync_state SET result_json=? WHERE workspace=?',JSON.stringify({...result,interrupted:true}),w);
      throw e;
    } finally { running.delete(w); }
  }
  return {state,sync,replyReason};
}
