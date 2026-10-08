// KPI dei servizi per la dashboard cliente. Ogni riga dichiara il proprio stato:
// - valori calcolati dai dati interni di BigAnt OS (stato DEMO finché i dati sono di prova);
// - COLLEGAMENTO MANCANTE quando il numero arriva solo da una piattaforma esterna non collegata;
// - SOLO STRUTTURA quando la misura interna non è ancora registrata.
// Nessun numero viene inventato: un KPI senza fonte resta senza valore.
import {catalogoServizi} from './catalogo.js';
import {integrations} from '../registry.js';

const nomeIntegrazione=id=>integrations.find(i=>i.id===id)?.name||id;
const mese=()=>new Date().toISOString().slice(0,7);

// Misure interne per codice: indice del KPI del playbook (o null per misure operative aggiuntive) → calcolo.
function misure(s,clientId,codice){
 const q=(sql,...p)=>s.query(sql,...p),uno=(sql,...p)=>s.one(sql,...p);
 const contenuti=servizio=>q('SELECT * FROM os_contents WHERE client_id=? AND service=?',clientId,servizio);
 const approvati=servizio=>q("SELECT a.* FROM os_approvals a JOIN os_contents c ON c.id=a.entity_id WHERE a.kind='content' AND c.client_id=? AND c.service=? AND a.status='approved'",clientId,servizio);
 const consegneInTempo=servizi=>{const t=q(`SELECT * FROM os_tasks WHERE client_id=? AND service IN (${servizi.map(()=>'?').join(',')}) AND status='done'`,clientId,...servizi);return t.length?{valore:`${t.filter(x=>!x.due||x.due>=x.created_at).length} su ${t.length}`,fonte:'Lavori registrati in BigAnt OS'}:null;};
 const revisioni=servizi=>{const c=q(`SELECT version FROM os_contents WHERE client_id=? AND service IN (${servizi.map(()=>'?').join(',')})`,clientId,...servizi);return c.length?{valore:(c.reduce((n,x)=>n+x.version-1,0)/c.length).toFixed(1).replace('.',','),fonte:'Versioni dei contenuti in BigAnt OS'}:null;};
 const tabellaEsiste=nome=>!!uno("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?",nome);
 const regole={
  S01:[[null,'Contenuti del piano approvati e programmati',()=>{const c=contenuti('social');return {valore:`${c.filter(x=>['APPROVATO','PROGRAMMATO'].includes(x.state)).length} su ${c.length}`,fonte:'Calendario editoriale BigAnt OS (pubblicazione non collegata)'};}]],
  S02:[[1,null,()=>consegneInTempo(['video','drone','video-ai'])],[2,null,()=>revisioni(['video','drone','video-ai'])]],
  S06:[[null,'Post della scheda Google preparati e programmati',()=>{const c=contenuti('local');return {valore:`${c.filter(x=>x.state==='PROGRAMMATO').length} programmati su ${c.length}`,fonte:'Calendario BigAnt OS (pubblicazione GBP non collegata)'};}],[null,'Correzioni alla scheda proposte dallo sciame',()=>{const n=q("SELECT * FROM os_azioni_esterne WHERE client_id=? AND tipo='modifica_scheda'",clientId).length;return n?{valore:String(n),fonte:'Sciame Local/GBP, modifiche bloccate in attesa di collegamento'}:null;}]],
  S08:[[null,'Risposte alle recensioni preparate e approvate',()=>{const r=q("SELECT output_json FROM os_sciame_passi WHERE client_id=? AND agente='reputazione' AND stato IN('completato','in_attesa_approvazione')",clientId).flatMap(x=>JSON.parse(x.output_json).risposte);return r.length?{valore:String(r.length),fonte:'Sciame Reputazione (pubblicazione non collegata)'}:null;}]],
  S12:[[0,null,()=>tabellaEsiste('gr_meetings')?{valore:String(q("SELECT * FROM gr_meetings WHERE workspace=? AND substr(start,1,7)=?",clientId,mese()).length),fonte:'Appuntamenti DEMO del modulo Growth'}:null]],
  S14:[[0,null,()=>{if(!tabellaEsiste('gr_leads'))return null;const l=q('SELECT source FROM gr_leads WHERE workspace=?',clientId);if(!l.length)return null;const per={};for(const x of l){const k=(x.source||'manuale').split(' · ')[0].slice(0,40);per[k]=(per[k]||0)+1;}return {valore:Object.entries(per).map(([k,n])=>`${k}: ${n}`).join(' · '),fonte:'CRM Growth DEMO'};}],[null,'Iscritti Fidelity con consenso marketing',()=>tabellaEsiste('fi_members')?{valore:`${q("SELECT * FROM fi_members WHERE tenant_id=? AND marketing_consent=1",clientId).length} su ${q('SELECT * FROM fi_members WHERE tenant_id=?',clientId).length}`,fonte:'BigAnt Fidelity DEMO'}:null]],
  S15:[[0,null,()=>consegneInTempo(['branding','creative-direction'])],[1,null,()=>revisioni(['branding','creative-direction'])]],
  S16:[[1,null,()=>consegneInTempo(['merch'])]],
  S17:[[0,null,()=>{const n=q("SELECT * FROM os_sciame_passi WHERE client_id=? AND agente='analisi-gratuita' AND stato IN('completato','in_attesa_approvazione')",clientId).length;return n?{valore:String(n),fonte:'Analisi prodotte dallo sciame e approvate (invio bloccato)'}:null;}],[2,null,()=>tabellaEsiste('gr_meetings')?{valore:String(q('SELECT * FROM gr_meetings WHERE workspace=?',clientId).length),fonte:'Appuntamenti DEMO del modulo Growth'}:null],[3,null,()=>tabellaEsiste('gr_conversions')?{valore:String(q('SELECT c.* FROM gr_conversions c JOIN gr_leads l ON l.id=c.lead_id WHERE l.workspace=?',clientId).length),fonte:'Conversioni lead → cliente in BigAnt OS'}:null]],
  S18:[[0,null,()=>{const m=uno("SELECT updated_at FROM os_memory WHERE client_id=? AND kind='report'",clientId);return m?{valore:`Ultimo report ${m.updated_at.slice(0,10)}`,fonte:'Memoria report del cliente'}:null;}],[1,null,()=>({valore:String(q("SELECT a.* FROM os_audit a JOIN os_users u ON u.id=a.user_id WHERE u.role='client' AND u.tenant_id=? AND a.action='Accesso effettuato' AND substr(a.created_at,1,7)=?",clientId,mese()).length),fonte:'Registro accessi BigAnt OS'})]]
 };
 return regole[codice]||[];
}

export function kpiServizio(s,clientId,codice,{demo=true}={}){
 const scheda=catalogoServizi.find(x=>x.codice===codice);if(!scheda)throw new Error('Servizio sconosciuto: '+codice);
 const regole=misure(s,clientId,codice),righe=[],esterne=scheda.integrazioni.map(nomeIntegrazione);
 const stato=valore=>valore?(demo?'DEMO':'OPERATIVO'):null;
 scheda.kpi.forEach((kpi,i)=>{
  const regola=regole.find(r=>r[0]===i),v=regola?.[2]();
  if(v)righe.push({kpi,valore:v.valore,fonte:v.fonte,stato:stato(v)});
  else if(esterne.length)righe.push({kpi,valore:null,fonte:`Fonte non collegata: ${esterne.join(', ')}`,stato:'COLLEGAMENTO MANCANTE'});
  else righe.push({kpi,valore:null,fonte:'Misura interna non ancora registrata',stato:'SOLO STRUTTURA'});
 });
 for(const [,kpi,calcolo] of regole.filter(r=>r[0]===null)){const v=calcolo();if(v)righe.push({kpi,valore:v.valore,fonte:v.fonte,stato:stato(v),operativo:true});}
 return {codice,nome:scheda.nome,scheda:scheda.scheda,kpi:righe};
}
