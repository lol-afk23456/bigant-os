import {createHash} from 'node:crypto';
import {AppError} from './store.js';

const invalid = () => new AppError('Conversazione Gmail non verificabile: controllala nella casella.', 409);
export const gmailId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(value);
export function gmailHeaders(message) {
  const rows = message.payload?.headers;
  if (!Array.isArray(rows) || rows.length > 100 || rows.some(row => typeof row.name !== 'string' || typeof row.value !== 'string' || row.name.length > 100 || row.value.length > 4000)) throw invalid();
  return name => {
    const values = rows.filter(row => row.name.toLowerCase() === name.toLowerCase());
    if (values.length > 1) throw invalid();
    return values[0]?.value || '';
  };
}
export function gmailAddress(value) {
  if (typeof value !== 'string' || /[\r\n,;]/.test(value)) return '';
  const match = value.match(/^(?:[^<>]*<([^<>]+)>|([^<>]+))$/);
  const address = (match?.[1] || match?.[2] || '').trim().toLowerCase();
  return address.length <= 254 && /^[^\s<>@,;:]+@[^\s<>@,;:]+\.[^\s<>@,;:]+$/.test(address) ? address : '';
}
export function gmailSubject(value) {
  return value.replace(/(\?=)\s+(=\?)/g, '$1$2').replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi, (_, charset, encoding, data) => {
    try {
      const bytes = encoding.toUpperCase() === 'B' ? Buffer.from(data, 'base64') : Buffer.from(data.replace(/_/g, ' ').replace(/=([\da-f]{2})/gi, (_, code) => String.fromCharCode(parseInt(code, 16))), 'latin1');
      return new TextDecoder(charset, {fatal: true}).decode(bytes);
    } catch { throw invalid(); }
  });
}
function receivedDate(message, earliest, clock, tolerance = 0) {
  if (typeof message.internalDate !== 'string' || !/^\d{1,16}$/.test(message.internalDate)) throw invalid();
  const time = Number(message.internalDate);
  if (!Number.isSafeInteger(time) || time < earliest - tolerance || time > clock().getTime() + 300000) throw invalid();
  return new Date(time).toISOString();
}
export function verifyGmailAnchor(message, anchor, clock) {
  const header = gmailHeaders(message), payload = JSON.parse(anchor.payload_json);
  if (message.id !== anchor.provider_id || message.threadId !== anchor.thread_id || !Array.isArray(message.labelIds) || !message.labelIds.includes('SENT')
    || header('Message-ID') !== `<${anchor.message_id}@growth.bigantagency.it>`
    || gmailAddress(header('From')) !== payload.from.toLowerCase() || gmailAddress(header('To')) !== payload.to.toLowerCase()
    || gmailSubject(header('Subject')) !== payload.subject) throw invalid();
  receivedDate(message, Date.parse(anchor.created_at), clock, 300000);
}
const entities = value => value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, name) => {
  const basic = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
  if (basic[name.toLowerCase()]) return basic[name.toLowerCase()];
  const point = name[1]?.toLowerCase() === 'x' ? parseInt(name.slice(2),16) : Number(name.slice(1));
  return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff) ? String.fromCodePoint(point) : match;
});
function bodyText(payload) {
  let parts = 0, bytes = 0, incomplete = false;
  const htmlText = value => entities(value.replace(/<(script|style|blockquote)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\s*(br\s*\/|br|\/p|\/div|\/li)\s*>/gi, '\n').replace(/<[^>]*>/g, ''));
  function visit(part, depth = 0) {
    if (!part || typeof part !== 'object' || ++parts > 100 || depth > 10) throw invalid();
    const headers = part.headers || [];
    if (!Array.isArray(headers)) throw invalid();
    if (part.filename || headers.some(h => String(h.name).toLowerCase() === 'content-disposition' && /^attachment/i.test(String(h.value)))) return;
    const mime = String(part.mimeType || '').toLowerCase();
    if (['text/plain', 'text/html'].includes(mime)) {
      const body = part.body || {};
      if (body.attachmentId) { incomplete = true; return; }
      if (typeof body.data !== 'string' || body.data.length > 90000 || !/^[A-Za-z0-9_-]*={0,2}$/.test(body.data) || body.data.replace(/=+$/, '').length % 4 === 1) { incomplete = true; return; }
      const decoded = Buffer.from(body.data, 'base64url'); bytes += decoded.length;
      if (bytes > 64000) throw invalid();
      const contentType = headers.find(h => String(h.name).toLowerCase() === 'content-type')?.value || '';
      const charset = String(contentType).match(/charset\s*=\s*["']?([^;\s"']+)/i)?.[1] || 'utf-8';
      try {
        const text = new TextDecoder(charset, {fatal:true}).decode(decoded);
        return {text:mime === 'text/plain' ? text : htmlText(text), plain:mime === 'text/plain'};
      }
      catch { incomplete = true; }
    } else if (mime.startsWith('multipart/')) {
      if (!Array.isArray(part.parts)) { incomplete = true; return; }
      const children = part.parts.map(child => visit(child, depth + 1)).filter(child => child?.text.trim());
      // Alternative bodies represent the same text; mixed/related parts may not.
      if (mime === 'multipart/alternative') return children.find(child => child.plain) || children[0];
      return {text:children.map(child => child.text).join('\n'), plain:children.every(child => child.plain)};
    }
  }
  const text = (visit(payload)?.text || '')
    .replace(/\r\n?/g, '\n').replace(/\u0000/g, '').trim();
  return {text, incomplete:incomplete || !text || text.length > 8000};
}
export function parseGmailReply(message, anchor, clock) {
  if (!gmailId(message.id) || message.threadId !== anchor.thread_id || !Array.isArray(message.labelIds)) throw invalid();
  if (message.labelIds.some(label => ['SENT','DRAFT','TRASH','SPAM'].includes(label))) return {skip:true};
  const header = gmailHeaders(message), payload = JSON.parse(anchor.payload_json);
  const from = gmailAddress(header('From')), to = gmailAddress(header('To'));
  if (!from || !to) throw invalid();
  if (from !== payload.to.toLowerCase() || to !== payload.from.toLowerCase()) return {skip:true, review:true};
  const auto = header('Auto-Submitted').trim().toLowerCase();
  if ((auto && auto !== 'no') || /^(bulk|list|junk)$/i.test(header('Precedence').trim())) return {skip:true};
  const messageId = header('Message-ID');
  if (!/^<[^<>\r\n\s]{1,250}>$/.test(messageId)) throw invalid();
  const created = receivedDate(message, Date.parse(anchor.sent || anchor.created_at), clock);
  const subject = gmailSubject(header('Subject'));
  const body = bodyText(message.payload);
  const review = body.incomplete || !!header('Cc') || !!header('Bcc') || subject.length > 200;
  const fresh = body.text.split(/\n(?:Il .+ha scritto:|On .+wrote:|>|_{3,}|-{3,}\s*(?:Original|Messaggio))/i)[0];
  const stopped = /\b(unsubscribe|disiscriv|rimuov|cancellat|non contatt|non sono interessat|non siamo interessat|non mi interess)/i.test(fresh);
  const fingerprint = createHash('sha256').update(JSON.stringify({id:message.id,thread:message.threadId,messageId,from,to,subject,text:body.text,created,review})).digest('hex');
  return {id:message.id, threadId:message.threadId, replyTo:messageId, subject:subject.slice(0,200),
    body:body.text.slice(0,8000) || 'Testo non disponibile: controlla il messaggio nella casella Gmail.', created, stopped, review, fingerprint};
}
