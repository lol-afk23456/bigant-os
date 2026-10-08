export const brand = Object.freeze({
  name: 'BigAnt Agency',
  product: 'BigAnt OS · Growth',
  orange: '#F26B21',
  ink: '#141413',
  paper: '#F7F5F2',
  legal: 'BigAnt è un marchio di Costantino Agency e La Manna Agency',
});

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

function textWithLinks(value) {
  return String(value ?? '').split(/(https?:\/\/[^\s<>]+)/g).map(part => {
    if (!/^https?:\/\//.test(part)) return escape(part).replace(/\n/g, '<br>');
    return `<a href="${escape(part)}" style="color:${brand.orange};text-decoration:underline;overflow-wrap:anywhere">${escape(part)}</a>`;
  }).join('');
}

// The email uses an attached logo: opening it makes no request to a tracking server.
export function emailHTML(body, {logo = 'cid:bigant-logo'} = {}) {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${brand.product}</title></head>
<body style="margin:0;padding:24px 12px;background:${brand.paper};color:${brand.ink};font-family:Arial,Helvetica,sans-serif">
<table role="presentation" style="width:100%;max-width:620px;margin:auto;border-collapse:collapse;background:#fff;border-top:4px solid ${brand.orange}"><tr><td style="padding:32px 32px 24px">
<img src="${escape(logo)}" width="156" alt="BigAnt Agency" style="display:block;width:156px;max-width:100%;height:auto"><p style="font-size:10px;letter-spacing:2px;margin:12px 0 0;color:#72726b">BIGANT OS · DEMO</p>
</td></tr><tr><td style="padding:0 32px 32px;font-size:15px;line-height:1.7;overflow-wrap:anywhere">${textWithLinks(body)}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e6e3dd;font-size:11px;line-height:1.6;color:#72726b">${brand.legal}</td></tr></table></body></html>`;
}

export const emailPreviewText = 'Ciao,\n\nqui prenderà forma la proposta preparata per la tua attività: video, siti web, gestione social e campagne Google e Meta Ads.\n\nPartiamo dai tuoi obiettivi e valutiamo insieme il prossimo passo.\n\nIl team BigAnt Agency\nAssistente digitale del team BigAnt Agency.';