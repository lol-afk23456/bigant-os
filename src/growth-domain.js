// Adattato dal dominio Growth corrente: stesse regole CRM e consenso.
import {uid,now,stages} from './growth-store.js';
export class AppError extends Error {constructor(message,status=400){super(message);this.status=status;}}
export function string(v,max=2000){return String(v??'').trim().slice(0,max);}
export function email(v){const s=string(v,254).toLowerCase();if(s&&!/^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/.test(s))throw new AppError('Inserisci un indirizzo email valido.');return s;}
export function website(v){if(!v)return '';try{const u=new URL(/^https?:\/\//i.test(v)?v:`https://${v}`);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error();u.hash='';return u.toString();}catch{throw new AppError('Inserisci un sito web valido.');}}
export function createLead(s,w,input){
 const company=string(input.company,160);if(!company)throw new AppError('Il nome dell’azienda è obbligatorio.');
 const url=website(string(input.website,1000)),domain=url?new URL(url).hostname.toLowerCase().replace(/^www\./,''):'';
 const mail=email(input.email); const id=uid();
 try{s.run('INSERT INTO leads(id,workspace,company,website,domain,email,contact,sector,city,source,notes,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',id,w,company,url,domain,mail,string(input.contact,120),string(input.sector,120),string(input.city,120),string(input.source,1000),string(input.notes,6000),now(),now());}catch(e){if(String(e).includes('UNIQUE'))throw new AppError('Questa azienda o email è già presente.',409);throw e;}
 if(s.simulation===false)s.run('UPDATE leads SET owner=? WHERE id=?','Soci BigAnt',id);
 if(mail&&s.one('SELECT 1 FROM suppressions WHERE workspace=? AND email=?',w,mail))s.run('UPDATE leads SET suppressed=1 WHERE id=?',id);
 s.log(w,'Archivio','Azienda aggiunta',company,id);return s.lead(w,id);
}
export function updateLead(s,w,id,input){const l=s.lead(w,id);if(!l)throw new AppError('Azienda non trovata.',404);const allowed=['contact','sector','city','notes','owner','analysis'];const patch={};for(const k of allowed)if(k in input)patch[k]=string(input[k],k==='notes'||k==='analysis'?8000:160);
 if('stage'in input){if(!stages.includes(input.stage))throw new AppError('Fase non valida.');patch.stage=input.stage;}
 if('value'in input){const v=Number(input.value);if(!Number.isSafeInteger(v)||v<0||v>1e10)throw new AppError('Importo non valido.');patch.value=v;}
 if('email'in input)patch.email=email(input.email);
 if('consent'in input){if(!['none','request','marketing'].includes(input.consent))throw new AppError('Tipo di autorizzazione non valido.');if(input.consent!=='none'&&!string(input.consent_proof))throw new AppError('Indica la fonte e la prova dell’autorizzazione.');patch.consent=input.consent;patch.consent_proof=string(input.consent_proof);patch.consent_at=now();}
 if('email' in patch&&patch.email!==l.email){patch.consent='none';patch.consent_proof='';patch.consent_at=null;if(s.one('SELECT 1 FROM suppressions WHERE workspace=? AND email=?',w,patch.email))patch.suppressed=1;}
 patch.updated=now();return s.transaction(()=>{try{s.run(`UPDATE leads SET ${Object.keys(patch).map(k=>k+'=?').join(',')} WHERE workspace=? AND id=?`,...Object.values(patch),w,id);}catch(e){if(String(e).includes('UNIQUE'))throw new AppError('Email già presente.',409);throw e;}
 if(s.simulation===false)s.invalidateApprovals(w,id);
 s.log(w,'Archivio','Scheda aggiornata',l.company,id);return s.lead(w,id);});
}
export function suppression(s,w,id,reason='Disiscrizione'){return s.transaction(()=>{const l=s.lead(w,id);if(!l)throw new AppError('Contatto non trovato.',404);s.run('UPDATE leads SET suppressed=1,updated=? WHERE workspace=? AND id=?',now(),w,id);if(l.email)s.run('INSERT OR IGNORE INTO suppressions VALUES(?,?,?)',w,l.email,now());s.run("UPDATE messages SET status='cancelled',error=? WHERE workspace=? AND lead_id=? AND direction='out' AND status IN ('draft','approved','queued')",reason,w,id);s.log(w,'Controllo','Contatti interrotti',reason,id);});}
export function canContact(s,w,l,kind='initial'){if(!l||!l.email)return 'Email mancante';if(l.suppressed||s.one('SELECT 1 FROM suppressions WHERE workspace=? AND email=?',w,l.email))return 'Contatto disiscritto';if(['won','lost'].includes(l.stage))return 'Trattativa chiusa';if(l.consent==='none'||!l.consent_proof)return 'Autorizzazione al contatto da verificare';if(l.consent==='request'&&kind!=='reply')return 'La richiesta consente una risposta pertinente, non una sequenza promozionale';return null;}
export function validateSettings(p,old){const out={...old};for(const k of ['sector','region','offer','description','signature','senderName','senderEmail','privacyUrl','calendarId'])if(k in p)out[k]=string(p[k],k==='description'?6000:2000);if(out.senderEmail)email(out.senderEmail);if(out.privacyUrl)out.privacyUrl=website(out.privacyUrl);
 for(const k of ['totalBudget','hostingBudget','emailBudget','reserveBudget','dailyLimit','researchLimit','followupDays','maxFollowups','meetingMinutes','startHour','endHour'])if(k in p){const n=Number(p[k]);if(!Number.isSafeInteger(n)||n<0)throw new AppError('Valore numerico non valido.');out[k]=n;}
 if(out.totalBudget>5000||out.totalBudget<100||out.hostingBudget+out.emailBudget+out.reserveBudget>out.totalBudget)throw new AppError('Il pilota ha un tetto di 50 €. Controlla la ripartizione.');
 if(out.dailyLimit>50||out.researchLimit>20||out.followupDays<2||out.maxFollowups>2||![15,30,45,60].includes(out.meetingMinutes)||out.startHour<8||out.endHour>20||out.endHour<=out.startHour)throw new AppError('Limiti del pilota non validi.');
 for(const k of ['autoResearch','autoDraft','autoSend','autoReply','paused','publicFormEnabled','autonomyAcknowledged'])if(k in p)out[k]=p[k]===true;
 if((out.autoSend||out.autoReply)&&!out.autonomyAcknowledged)throw new AppError('Prima definisci e conferma le regole delle comunicazioni autonome.');
 if(out.publicFormEnabled&&!out.privacyUrl)throw new AppError('Inserisci il link all’informativa prima di attivare il modulo pubblico.');return out;}
export function csv(rows){const keys=['company','website','email','contact','sector','city','stage','owner','value','consent','source'];const cell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,'\'$&').replaceAll('"','""')+'"';return '\uFEFF'+[keys.join(','),...rows.map(r=>keys.map(k=>cell(r[k])).join(','))].join('\r\n');}
