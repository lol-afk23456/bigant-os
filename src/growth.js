import { AsyncLocalStorage } from 'node:async_hooks';
import { growthStore, now, uid } from './growth-store.js';
import { AppError, string, email, createLead, updateLead, suppression, canContact, validateSettings, csv } from './growth-domain.js';
import { createEngine } from './growth-engine.js';
import { demoProviders } from './growth-providers.js';
import {createGrowthMail} from './growth-mail.js';
import {createGrowthCalendar} from './growth-calendar.js';
import { createGrowthRuntime } from './growth-runtime.js';
import { emailHTML, emailPreviewText } from './growth-brand.js';
import {createCostControl} from './cost-control.js';

const EXTERNAL_DISABLED = 'Servizio non collegato: operazione esterna disabilitata nella demo';
const jobTypes = ['research', 'analyze', 'draft', 'sync', 'reconcile', 'reconcileMeeting'];
function owner(user) { if (!user || user.role !== 'owner' || user.active === 0 || user.active === false) throw new AppError('Growth è riservato ai soci BigAnt.', 403); }
function fixture(input) {
  if (input.email && !email(input.email).endsWith('.example')) throw new AppError('Usa un indirizzo inventato con dominio .example nella demo.', 400);
  if (input.website) {
    let url;
    try { url = new URL(/^https?:\/\//i.test(input.website) ? input.website : `https://${input.website}`); } catch { throw new AppError('Sito DEMO non valido.'); }
    if (!url.hostname.endsWith('.example')) throw new AppError('Usa un sito inventato con dominio .example nella demo.', 400);
  }
}
function data(value, status = 200) { return { data: value, status }; }

export function createGrowthModule({ store, origin = 'http://127.0.0.1:4330', realMode=false, connections=null, externalEnabled=false, providerOptions={}, googleAuth=null, gmailEnabled=false, calendarEnabled=false, clock=()=>new Date(),costControl=createCostControl({store,clock}) }) {
  const actor = new AsyncLocalStorage();
  const s = growthStore(store, () => actor.getStore(),{realMode,clock,costControl});
  const runtime=realMode?createGrowthRuntime({store,growthStore:s,connections,getActor:()=>actor.getStore(),externalEnabled,providerOptions}):null;
  const mail=realMode?createGrowthMail({store,growthStore:s,runtime,googleAuth,origin,enabled:gmailEnabled,providerOptions,clock}):null;
  const calendar=realMode?createGrowthCalendar({store,growthStore:s,runtime,mail,googleAuth,origin,enabled:calendarEnabled,providerOptions,clock}):null;
  const p = runtime?runtime.providers:demoProviders(s);
  const engine = createEngine(s, p, { origin: origin + '/api/growth',simulation:!realMode,runtime,...(realMode?{readWebsite:(url,w)=>p.website(w,url),replyContext:(w,m,user)=>mail.conversations.replyReason(user||actor.getStore(),w,m)}:{}) });
  engine.recover();

  function progress(user) {
    const current=user?.id&&store.one('SELECT id,role,active,must_change_password FROM os_users WHERE id=?',user.id);owner(current);
    const w='demo-bigant',fallback=()=>({available:false,checked:false,enabled:false,lastCheck:null});
    const snapshot=runtime?.progress(current,w),simulation=!realMode||!!snapshot?.simulation;
    const phase=id=>({...((snapshot?.[id])||fallback()),...(simulation?{enabled:false}:{})});
    return {simulation,paused:snapshot?.paused??!!s.settings(w).paused,research:phase('research'),analysis:phase('analysis'),drafts:phase('drafts'),
      gmail:mail?.progress(current,w)||{...fallback(),configured:false},calendar:calendar?.progress(current,w)||{...fallback(),configured:false}};
  }

  function state(clientId = 'demo-bigant', user) {
    owner(user); s.workspace(clientId);
    const settings = s.settings(clientId), used = s.costs(clientId),mailState=mail?.state(user,clientId)||null;
    return {
      simulation: !realMode, label: realMode?'Growth · attivazione per fasi':'DEMO offline · nessuna ricerca, email o prenotazione esterna', settings, mail:mailState,calendar:calendar?.state(user,clientId)||null,conversations:mail?.conversations.state(user,clientId)||null,runtime:runtime?.state(user,clientId)||null,
      sources:store.query('SELECT id,lead_id,kind,url,retrieved_at,provenance_json FROM gr_sources WHERE workspace=? ORDER BY retrieved_at DESC',clientId),
      connections: { openai: false, brave: false, google: mailState?.configured||false, googleConfigured: mailState?.configured||false, demoAvailable: !realMode },
      leads: s.query('SELECT * FROM leads WHERE workspace=? ORDER BY created DESC', clientId),
      messages: s.query('SELECT m.*,l.company FROM messages m JOIN leads l ON l.id=m.lead_id AND l.workspace=m.workspace WHERE m.workspace=? ORDER BY m.created DESC,m.id DESC', clientId).map(m => ({ ...m, simulation: !realMode, externalDelivery: realMode&&m.status==='sent',replyBlockedReason:realMode&&m.direction==='in'?engine.replyReason(clientId,m,user):null,source:realMode&&m.direction==='in'?store.one("SELECT 'Gmail' provider,imported_at importedAt FROM gr_mail_receipts WHERE message_id=?",m.id)||null:null,approvalVersion:store.one("SELECT MAX(version) version FROM os_approvals WHERE kind='growth_message' AND entity_id=?",m.id)?.version||0 })),
      meetings: calendar?calendar.meetings(user,clientId):s.query('SELECT m.*,l.company FROM meetings m JOIN leads l ON l.id=m.lead_id AND l.workspace=m.workspace WHERE m.workspace=? ORDER BY m.start DESC', clientId).map(m => ({ ...m, simulation: true, externalInvitation: false })),
      jobs: s.query('SELECT * FROM jobs WHERE workspace=? ORDER BY created DESC', clientId),
      costs: s.query('SELECT * FROM costs WHERE workspace=? ORDER BY created DESC', clientId),
      approvals: s.query('SELECT a.* FROM gr_approvals a JOIN leads l ON l.id=(SELECT lead_id FROM messages WHERE id=a.message_id) WHERE l.workspace=?', clientId),
      budget: { used, total: Number(store.getSetting('budget_cents')), fixed: Number(store.getSetting('fixed_cents')), available: Math.max(0, Math.min(Number(store.getSetting('budget_cents')) - Number(store.getSetting('fixed_cents')) - used,realMode?costControl.snapshot().availableCents:Infinity)), simulatedCostCents: 0, source: 'Budget centrale OS',costControl:costControl.snapshot() },
      auditSource: 'Registro attività centrale OS',
    };
  }
  function seed(realMode=false) {
    if (realMode) return;
    if (!store.one('SELECT id FROM os_clients WHERE id=?', 'demo-bigant')) return;
    s.workspace('demo-bigant');
    if (!s.one('SELECT 1 FROM leads WHERE workspace=?', 'demo-bigant')) {
      createLead(s, 'demo-bigant', { company: 'Officina Orizzonte · DEMO', website: 'https://officina-orizzonte.example', email: 'info@officina-orizzonte.example', city: 'Caserta · DEMO', sector: 'Servizi · DEMO', source: 'Fixture inventata, nessun dato reale', notes: 'Esempio da analizzare: interesse dimostrativo per video e sito web.' });
      createLead(s, 'demo-bigant', { company: 'Laboratorio Idee · DEMO', website: 'https://laboratorio-idee.example', email: 'contatti@laboratorio-idee.example', city: 'Campania · DEMO', sector: 'Produzione · DEMO', source: 'Fixture inventata, nessun dato reale' });
    }
  }
  function conversion(w, leadId) {
    return s.transaction(() => {
      const lead = s.lead(w, leadId); if (!lead) throw new AppError('Azienda non trovata.', 404);
      const previous = s.one('SELECT * FROM gr_conversions WHERE lead_id=?', lead.id);
      if (previous) return { client: store.one('SELECT * FROM os_clients WHERE id=?', previous.client_id), alreadyConverted: true, simulation: !realMode };
      const slugBase = lead.domain ? lead.domain.replace(/\.example$/, '').replace(/[^a-z0-9]+/g, '-') : lead.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = `${realMode?'growth':'demo-growth'}-${slugBase}`;
      if (store.one('SELECT id FROM os_clients WHERE slug=?', slug)) throw new AppError('Esiste già un cliente con questa identità: collega manualmente dopo la verifica.', 409);
      const id = `${realMode?'growth':'demo-growth'}-${uid()}`;
      store.run('INSERT INTO os_clients(id,name,slug,industry,color,address,active,created_at,privacy_url,terms_text,services_json,risk,stage) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)', id, realMode?lead.company:lead.company.includes('DEMO') ? lead.company : `${lead.company} · DEMO`, slug, lead.sector, '#F26B21', lead.city, 1, now(), '', realMode?'':'Cliente inventato per la demo', '[]', 'watch', 'onboarding');
      s.run('INSERT INTO gr_conversions VALUES(?,?,?,?)', lead.id, id, JSON.stringify({ source: lead.source, leadId: lead.id, workspace: w, simulation: !realMode }), now());
      s.run("UPDATE leads SET client_id=?,stage='won',updated=? WHERE workspace=? AND id=?", id, now(), w, lead.id);
      s.log(w, 'Commerciale', realMode?'Lead trasformato in cliente OS':'Lead DEMO trasformato in cliente OS', 'Anagrafica comune pronta per contratti e produzione', lead.id);
      return { client: store.one('SELECT * FROM os_clients WHERE id=?', id), alreadyConverted: false, simulation: !realMode };
    });
  }
  function verifyToken(w, id, kind) { const token = engine.getToken(id, kind); if (token.workspace !== w) throw new AppError('Invito non disponibile per questa attività.', 404); return token; }

  async function handle({ method, path, body = {}, user, clientId = 'demo-bigant' }) {
    owner(user); s.workspace(clientId); const w = clientId;
    return actor.run(user, async () => {
    try {
      if (method === 'GET' && (path === '/state' || path === '/')) return data(state(w, user));
      if(runtime&&method==='POST'&&path==='/runtime/config')return data(runtime.save(user,w,body));
      if(runtime&&method==='POST'&&path==='/runtime/check')return data(await runtime.check(user,w,body));
      if(runtime&&method==='POST'&&path==='/runtime/activate')return data(runtime.activate(user,w,body));
      if(mail&&method==='POST'&&path==='/mail/check')return data(await mail.check(user,w,body));
      if(mail&&method==='POST'&&path==='/mail/activate')return data(mail.activate(user,w,body));
      if(mail&&method==='POST'&&path==='/mail/sync')return data(await mail.sync(user,w,body));
      if(calendar&&method==='POST'&&path==='/calendar/config')return data(calendar.configure(user,w,body));
      if(calendar&&method==='POST'&&path==='/calendar/check')return data(await calendar.check(user,w,body));
      if(calendar&&method==='POST'&&path==='/calendar/probe-preview')return data(await calendar.probePreview(user,w,body));
      if(calendar&&method==='POST'&&path==='/calendar/probe')return data(await calendar.probe(user,w,body));
      if(calendar&&method==='POST'&&path==='/calendar/probe-verify')return data(await calendar.verifyProbe(user,w,body));
      if(calendar&&method==='POST'&&path==='/calendar/activate')return data(calendar.activate(user,w,body));
      if(calendar&&method==='POST'&&path==='/calendar/invite')return data(calendar.invite(user,w,body));
      const calendarLead=path.match(/^\/leads\/([^/]+)\/invite-preview$/);
      if(calendar&&calendarLead&&method==='GET')return data(calendar.invitePreview(user,w,calendarLead[1]));
      const calendarMeeting=path.match(/^\/meetings\/([^/]+)\/(cancel-preview|cancel|reconcile)$/);
      if(calendar&&calendarMeeting){const [,id,action]=calendarMeeting;if(method==='GET'&&action==='cancel-preview')return data(await calendar.cancelPreview(user,w,id));if(method==='POST'&&action==='cancel')return data(await calendar.cancel(user,w,id,body));if(method==='POST'&&action==='reconcile')return data(await calendar.reconcile(user,w,id));}
      const mailMatch=path.match(/^\/messages\/([^/]+)\/(send-preview|send|reconcile)$/);
      if(mail&&mailMatch){const [,id,action]=mailMatch;if(method==='GET'&&action==='send-preview')return data(mail.preview(user,w,id));if(method==='POST'&&action==='send')return data(await mail.send(user,w,id,body));if(method==='POST'&&action==='reconcile')return data(await mail.reconcile(user,w,id));}
      if(realMode&&(path.startsWith('/simulate/')||path==='/booking-link'||path.startsWith('/public/')||path.startsWith('/meetings/')))throw new AppError('Email, moduli pubblici e calendario richiedono una fase successiva di collaudo e attivazione.',409);
      if (path === '/secrets' || path.startsWith('/google/') || path.startsWith('/auth/')) throw new AppError(EXTERNAL_DISABLED, 409);
      if (method === 'GET' && path === '/session') return data({ user, unified: true, simulation: !realMode });
      if (['/login', '/logout', '/setup', '/users'].includes(path)) throw new AppError('Gli accessi sono gestiti dall’identità unica BigAnt OS.', 409);
      if (method === 'GET' && path === '/brand/email-preview') return { data: emailHTML(emailPreviewText + '\n\nDEMO: nessun messaggio sarà inviato.', { logo: '/brand/logo.png' }), contentType: 'text/html; charset=utf-8' };
      if (method === 'POST' && path === '/leads') {
        if (!string(body.company)) throw new AppError('Il nome dell’azienda è obbligatorio.');
        if(!realMode)fixture(body);if(realMode&&!string(body.source))throw new AppError('Indica la fonte del contatto.');return data(createLead(s, w, { ...body, company: realMode?body.company:String(body.company || '').includes('DEMO') ? body.company : `${string(body.company, 145)} · DEMO` }), 201);
      }
      let match = path.match(/^\/leads\/([^/]+)$/);
      if (method === 'PATCH' && match) { if(!realMode)fixture(body); return data(updateLead(s, w, match[1], body)); }
      match = path.match(/^\/leads\/([^/]+)\/suppress$/);
      if (method === 'POST' && match) { suppression(s, w, match[1], realMode?'Interrotto dal socio':'Interrotto dal socio nella demo'); return data({ ok: true }); }
      match = path.match(/^\/leads\/([^/]+)\/convert$/);
      if (method === 'POST' && match) return data(conversion(w, match[1]));
      if (method === 'GET' && path === '/export') return { data: csv(s.query('SELECT * FROM leads WHERE workspace=?', w)), contentType: 'text/csv; charset=utf-8' };
      if (method === 'POST' && path === '/import') {
        if (!Array.isArray(body.rows) || body.rows.length > 200) throw new AppError('Importa al massimo 200 righe alla volta.');
        let added = 0; const errors = [];
        for (let i = 0; i < body.rows.length; i++) { try { if(!realMode)fixture(body.rows[i]); const row = body.rows[i]; if (!string(row.company)) throw new AppError('Il nome dell’azienda è obbligatorio.'); if(realMode&&!string(row.source))throw new AppError('Indica la fonte del contatto.');createLead(s, w, { ...row, company: realMode?row.company:String(row.company || '').includes('DEMO') ? row.company : `${string(row.company, 145)} · DEMO` }); added++; } catch (e) { errors.push({ row: i + 2, error: e.message }); } }
        return data({ added, errors, simulation: !realMode });
      }
      if (method === 'POST' && path === '/jobs') {
        if (!jobTypes.includes(body.type)) throw new AppError('Attività non consentita.');
        if (['analyze', 'draft'].includes(body.type) && (typeof body.leadId !== 'string' || !s.lead(w, body.leadId))) throw new AppError('Azienda non trovata.', 404);
        if (body.kind && !['initial', 'reply', 'followup'].includes(body.kind)) throw new AppError('Tipo di messaggio non valido.');
        const input={leadId: body.leadId, query: string(body.query, 250), kind: body.kind || 'initial', incomingId: body.incomingId, messageId: body.messageId, meetingId: body.meetingId};
        const job = s.enqueue(w, body.type, runtime?runtime.decorate(w,body.type,input):input);
        s.log(w, 'Orchestratore', realMode?'Attività Growth accodata':'Attività Growth DEMO accodata', body.type, body.leadId || null);
        return data(job, 201);
      }
      if (method === 'POST' && path === '/jobs/run') {
        if (s.settings(w).paused) throw new AppError('Growth è in pausa. Riprendi dalle impostazioni.', 409);
        return data(await engine.runNext(w));
      }
      match = path.match(/^\/jobs\/([^/]+)\/retry$/);
      if (method === 'POST' && match) {
        const job = s.one("SELECT * FROM jobs WHERE workspace=? AND id=? AND status='failed'", w, match[1]);
        if (!job) throw new AppError('Attività non disponibile.', 404);
        if(realMode){const input=JSON.parse(job.input),current=runtime.decorate(w,job.type,input);if(input._runtime?.fingerprint!==current._runtime.fingerprint)throw new AppError('Configurazione superata: crea una nuova attività.',409);}
        if (job.type === 'send') { const message = s.one('SELECT status FROM messages WHERE workspace=? AND id=?', w, JSON.parse(job.input).messageId); if (!message || message.status !== 'approved') throw new AppError('Riconcilia prima l’esito della simulazione.', 409); }
        s.run("UPDATE jobs SET status='queued',error=NULL,started=NULL,finished=NULL WHERE workspace=? AND id=?", w, job.id);
        return data({ ok: true });
      }
      match = path.match(/^\/messages\/([^/]+)$/);
      if (method === 'PATCH' && match) {
        const message = s.one("SELECT * FROM messages WHERE workspace=? AND id=? AND direction='out'", w, match[1]);
        if (!message || !['draft', 'approved'].includes(message.status)) throw new AppError('Messaggio non modificabile.', 409);
        const latest=store.one("SELECT * FROM os_approvals WHERE kind='growth_message' AND entity_id=? ORDER BY version DESC LIMIT 1",message.id);
        if(realMode&&(!Number.isSafeInteger(body.version)||body.version!==(latest?.version||0)))throw new AppError('Versione superata: ricarica la bozza prima di decidere.',409);
        const status = body.status || 'draft';
        if (!['draft', 'approved', 'cancelled'].includes(status)) throw new AppError('Stato non valido.');
        if (status === 'approved') { const reason = canContact(s, w, s.lead(w, message.lead_id), message.kind); if (reason) throw new AppError(reason, 409); }
        const subject = string(body.subject ?? message.subject, 200), text = string(body.body ?? message.body, 8000);
        if (!subject || !text) throw new AppError('Oggetto e messaggio sono obbligatori.');
        s.transaction(() => {
          s.run('UPDATE messages SET subject=?,body=?,status=? WHERE workspace=? AND id=?', subject, text, status, w, message.id);
          s.run('INSERT OR REPLACE INTO gr_approvals VALUES(?,?,?,?,?)', message.id, user.id, now(), status, string(body.reason, 1000) || (status === 'approved' ? realMode?'Approvazione esplicita del socio':'Approvazione esplicita del socio · DEMO' : 'Bozza aggiornata'));
          s.requestApproval(w, message.id, { status: status === 'draft' ? 'pending' : status === 'cancelled' ? 'rejected' : 'approved', reason: string(body.reason, 1000), decidedBy: status === 'draft' ? null : user.id, changed: subject !== message.subject || text !== message.body || (realMode&&latest?.status!=='pending') });
          if(mail&&status==='approved')mail.recordApproval(user,w,message.id);
          s.log(w, 'Commerciale', status === 'approved' ? 'Messaggio approvato dal socio' : 'Bozza aggiornata', `Decisione ${status} · ${string(body.reason, 1000)}`, message.lead_id);
        });
        return data({ ok: true, simulation: !realMode });
      }
      match = path.match(/^\/simulate\/messages\/([^/]+)\/send$/);
      if (method === 'POST' && match) {
        const approval = s.one("SELECT a.* FROM gr_approvals a JOIN messages m ON m.id=a.message_id WHERE m.workspace=? AND a.message_id=? AND a.decision='approved'", w, match[1]);
        if (!approval) throw new AppError('È necessaria l’approvazione esplicita di un socio.', 409);
        await engine.handlers.send(w, { messageId: match[1] });
        return data({ ok: true, simulation: !realMode, externalDelivery: false });
      }
      if (method === 'POST' && path === '/simulate/incoming') {
        const lead = s.lead(w, body.leadId); if (!lead) throw new AppError('Azienda non trovata.', 404);
        if (!string(body.body, 6000)) throw new AppError('Scrivi il testo della risposta DEMO.');
        const id = p.incoming(w, lead, { subject: string(body.subject, 200), body: string(body.body, 6000) });
        const count = await engine.handlers.sync(w);
        return data({ id, synchronized: count, simulation: true });
      }
      if (method === 'POST' && path === '/booking-link') {
        const lead = s.lead(w, body.leadId); if (!lead || lead.suppressed || !lead.email) throw new AppError('Contatto non disponibile.');
        const token = engine.token(w, lead.id, 'booking');
        return data({ token, url: `${origin}/api/growth/public/book/${token}`, simulation: true });
      }
      match = path.match(/^\/public\/book\/([^/]+)$/);
      if (match) { verifyToken(w, match[1], 'booking'); if (method === 'GET') return data({ ...await engine.slots(match[1]), simulation: true }); if (method === 'POST') return data({ ...await engine.book(match[1], string(body.start, 40)), simulation: !realMode, externalInvitation: false }); }
      match = path.match(/^\/unsubscribe\/([^/]+)$/);
      if(match&&method==='GET'){verifyToken(w,match[1],'unsubscribe');return data({simulation:!realMode});}
      if (match && method === 'POST') { const token = verifyToken(w, match[1], 'unsubscribe'); suppression(s, w, token.lead_id, realMode?'Disiscrizione':'Disiscrizione DEMO'); return data({ ok: true, simulation: !realMode }); }
      match = path.match(/^\/meetings\/([^/]+)\/cancel$/);
      if (match && method === 'POST') { await engine.cancelMeeting(w, match[1]); return data({ ok: true, simulation: !realMode }); }
      if (method === 'GET' && path === '/public/inquiry') { const settings = s.settings(w); return data({ enabled: settings.publicFormEnabled, privacyUrl: settings.privacyUrl, simulation: true }); }
      if (method === 'POST' && path === '/public/inquiry') {
        const settings = s.settings(w); if (!settings.publicFormEnabled) throw new AppError('Il modulo DEMO non è attivo.', 403);
        if (body.fax) return data({ ok: true });
        fixture(body);
        if (!body.privacyAcknowledged || !email(body.email) || !string(body.company) || !string(body.request)) throw new AppError('Completa i campi e conferma di aver letto l’informativa DEMO.');
        let lead;
        try { lead = createLead(s, w, { company: `${string(body.company, 145)} · DEMO`, email: body.email, website: body.website, contact: body.contact, notes: body.request, source: 'Modulo richiesta analisi DEMO' }); }
        catch (e) { if (e.status === 409) return data({ ok: true, message: 'Richiesta ricevuta. Il socio verificherà i dati DEMO.' }); throw e; }
        updateLead(s, w, lead.id, { consent: body.marketing === true ? 'marketing' : 'request', consent_proof: `Modulo DEMO · ${now()} · informativa ${settings.privacyUrl} · marketing ${body.marketing === true ? 'sì' : 'no'}` });
        const id = uid(); s.run('INSERT INTO messages(id,workspace,lead_id,direction,subject,body,status,kind,created) VALUES(?,?,?,?,?,?,?,?,?)', id, w, lead.id, 'in', 'Richiesta DEMO di analisi', string(body.request, 6000), 'received', 'request', now());
        return data({ ok: true, leadId: lead.id, incomingId: id, simulation: true });
      }
      if (method === 'POST' && path === '/settings') {
        if (body.autoSend || body.autoReply) throw new AppError('Gli invii automatici sono disabilitati: ogni messaggio richiede un socio.', 409);
        if (!realMode&&body.senderEmail) fixture({ email: body.senderEmail });
        const previous=s.settings(w),next = validateSettings(body, previous); next.autoSend = false; next.autoReply = false;
        if(realMode&&['calendarId','meetingMinutes','startHour','endHour','timezone'].some(key=>next[key]!==previous[key]))throw new AppError('Modifica il calendario dalla configurazione Calendar in Collegamenti Growth: occorrono una nuova versione e nuovi collaudi.',409);
        if(realMode&&(next.autoResearch||next.publicFormEnabled||next.researchLimit<1||next.researchLimit>10))throw new AppError('Per ora Growth reale richiede ricerche manuali da 1 a 10 risultati e moduli pubblici disattivati.',409);
        if (['totalBudget','hostingBudget','emailBudget','reserveBudget'].some(k => k in body)) { if(next.totalBudget-next.hostingBudget-next.emailBudget-next.reserveBudget<s.costs())throw new AppError('Il nuovo limite è inferiore ai costi già impegnati.',409); store.setSetting('budget_cents', next.totalBudget); store.setSetting('fixed_cents', next.hostingBudget + next.emailBudget + next.reserveBudget); }
        s.transaction(()=>{s.saveSettings(w, next);if(realMode&&['senderEmail','senderName','signature'].some(key=>next[key]!==previous[key]))s.invalidateApprovals(w);});
        s.log(w, 'Controllo', 'Impostazioni Growth aggiornate', next.paused ? 'Attività in pausa' : realMode?'Esecuzioni vincolate alle fasi attivate':'Prova abilitata; nessun servizio esterno');
        return data({ ok: true, simulation: !realMode });
      }
      return null;
    } finally { /* Il contesto attore è isolato per richiesta. */ }
    });
  }
  return { mail,calendar,runtime,state,progress, seed, handle, engine, store: s, providers: p };
}
