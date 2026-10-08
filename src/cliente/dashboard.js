// Dashboard cliente: le 9 voci del menu della specifica (docs/playbook/00_ITALIAONLINE-PUNTI-DI-FORZA-DASHBOARD-SITO.md, 3.1).
// Ogni cliente vede solo i propri dati; l'amministrazione interna di BigAnt non compare mai.
// Ogni numero dichiara la fonte; se la fonte esterna non è collegata, la dashboard lo dice.
import {AppError,requireClient} from '../store.js';
import {integrations} from '../registry.js';
import {catalogoServizi,codiciPerServiziRegistro} from '../servizi/catalogo.js';
import {kpiServizio} from '../servizi/kpi.js';

const FAMIGLIE=[
 {id:'contatti',nome:'Contatti',codici:['S14','S17','S12','S13']},
 {id:'presenza',nome:'Presenza: scheda Google, directory, recensioni',codici:['S06','S07','S08']},
 {id:'sito',nome:'Sito e SEO',codici:['S09','S05','S10']},
 {id:'pubblicita',nome:'Pubblicità',codici:['S03','S04','S19']},
 {id:'social',nome:'Social e contenuti',codici:['S01','S02','S15']},
 {id:'ecommerce',nome:'E-commerce e prenotazioni',codici:['S11','S12']},
 {id:'altro',nome:'Altri servizi',codici:['S16','S18']}
];
// Numeri chiave della Home: KPI precisi delle schede (codice e posizione nella sezione 7).
const CHIAVE_HOME=[['Contatti','S14',0],['Chiamate','S06',1],['Prenotazioni','S12',0],['Recensioni','S08',0],['Spesa ADV','S03',4]];

export function createClientDashboard({store:s}){
 function dashboard(user,clientId){
  requireClient(s,user,clientId);
  const c=s.one('SELECT * FROM os_clients WHERE id=? AND active=1',clientId);if(!c)throw new AppError('Attività non disponibile.',404);
  const servizi=JSON.parse(c.services_json),codici=codiciPerServiziRegistro(servizi),mese=new Date().toISOString().slice(0,7);
  const demo=c.name.includes('DEMO')||/^demo-/.test(c.id);
  const kpi=codici.map(cod=>kpiServizio(s,clientId,cod,{demo}));
  const contenuti=s.query('SELECT id,title,service,state,scheduled_at,version,updated_at FROM os_contents WHERE client_id=? ORDER BY COALESCE(scheduled_at,updated_at)',clientId).filter(x=>user.role!=='client'||servizi.includes(x.service));
  const approvazioni=s.query("SELECT a.id,a.entity_id,a.title,a.status,a.version,a.decision_by,a.decision_at,a.reason,a.created_at,u.name decisore FROM os_approvals a LEFT JOIN os_users u ON u.id=a.decision_by WHERE a.client_id=? AND a.kind='content' ORDER BY a.created_at DESC",clientId).filter(a=>contenuti.some(x=>x.id===a.entity_id));
  const lavori=s.query('SELECT id,title,service,status,due,assignee FROM os_tasks WHERE client_id=? ORDER BY due',clientId).filter(t=>user.role!=='client'||servizi.includes(t.service)||t.service==='account');
  const memoria=k=>s.one("SELECT content,source,updated_at,visibility FROM os_memory WHERE client_id=? AND kind=?",clientId,k);
  const report=memoria('report'),consigliati=memoria('servizi-consigliati');
  const avvisiRecensioni=s.query("SELECT output_json FROM os_sciame_passi WHERE client_id=? AND agente='reputazione' AND stato IN('completato','in_attesa_approvazione') ORDER BY created_at DESC LIMIT 1",clientId).flatMap(r=>JSON.parse(r.output_json).avvisi);
  const contratti=s.query("SELECT c.id,c.service,c.start_date,c.end_date,c.notice_days,c.status,c.amount_cents,e.name ditta FROM os_fin_contracts c JOIN os_fin_entities e ON e.id=c.entity_id WHERE c.client_id=?",clientId);
  const fatture=s.query("SELECT i.id,i.number,i.amount_cents,i.issue_date,i.due_date,i.status,e.name ditta,COALESCE((SELECT SUM(m.amount_cents) FROM os_fin_movements m WHERE m.invoice_id=i.id AND m.direction='in'),0) pagato_cents FROM os_fin_invoices i JOIN os_fin_entities e ON e.id=i.entity_id WHERE i.client_id=? ORDER BY i.issue_date DESC",clientId).map(f=>({...f,residuo_cents:f.amount_cents-f.pagato_cents,stato_pagamento:f.pagato_cents>=f.amount_cents?'Pagata':f.pagato_cents>0?'Pagata in parte':'Da pagare'}));
  const utenti=s.query("SELECT name,role FROM os_users WHERE tenant_id=? AND active=1",clientId);
  const fonteNonCollegata=id=>({id,nome:integrations.find(i=>i.id===id)?.name||id,stato:'COLLEGAMENTO MANCANTE',nota:'Serve l’autorizzazione OAuth del cliente in sola lettura, non ancora attiva.'});
  // Solo le piattaforme dei dati del cliente (autorizzazione OAuth in sola lettura); gli strumenti interni di BigAnt restano fuori.
  const FONTI_CLIENTE=['google-ads','meta','ga4','gsc','gbp'],integrazioniCliente=[...new Set(catalogoServizi.filter(x=>codici.includes(x.codice)).flatMap(x=>x.integrazioni))].filter(id=>FONTI_CLIENTE.includes(id));
  const fatto=lavori.filter(t=>t.status==='done'),inCorso=lavori.filter(t=>t.status!=='done');
  const sezioni=[
   {id:'home',nome:'Home',
    numeri:CHIAVE_HOME.map(([nome,cod,i])=>{if(!codici.includes(cod))return {nome,valore:null,stato:'NON ATTIVO',fonte:'Servizio non acquistato'};const k=kpi.find(x=>x.codice===cod).kpi.filter(r=>!r.operativo)[i];return {nome,kpi:k.kpi,valore:k.valore,stato:k.stato,fonte:k.fonte};}),
    sintesi:report?{testo:report.content,fonte:report.source,aggiornato:report.updated_at,stato:'Report operativo dai dati registrati; nessuna metrica dei canali reali'}:null,
    fattoQuestoMese:[...contenuti.filter(x=>['APPROVATO','PROGRAMMATO'].includes(x.state)&&x.updated_at.startsWith(mese)).map(x=>`${x.title} · ${x.state}`),...fatto.map(t=>t.title)],
    prossimiPassi:inCorso.slice(0,5).map(t=>({titolo:t.title,scadenza:t.due})),
    avvisi:[...(contenuti.filter(x=>x.state==='DA APPROVARE').length?[`${contenuti.filter(x=>x.state==='DA APPROVARE').length} contenuti da approvare`]:[]),...avvisiRecensioni,...contratti.filter(x=>x.status==='active').map(x=>`Contratto ${x.service}: decisione sul rinnovo entro ${new Date(Date.parse(x.end_date+'T00:00:00Z')-x.notice_days*86400000).toISOString().slice(0,10)}`)]},
   {id:'risultati',nome:'I tuoi risultati',famiglie:FAMIGLIE.map(f=>({...f,servizi:kpi.filter(k=>f.codici.includes(k.codice))})).filter(f=>f.servizi.length),
    filtri:{stato:'SOLO STRUTTURA',nota:'Filtri per periodo, confronto col periodo precedente ed esportazione PDF arriveranno con le fonti collegate.'}},
   {id:'approvazioni',nome:'Approvazioni e calendario',calendario:contenuti.filter(x=>x.scheduled_at||x.state==='DA APPROVARE'),daApprovare:approvazioni.filter(a=>a.status==='pending'),storico:approvazioni.filter(a=>a.status!=='pending').map(a=>({titolo:a.title,decisione:a.status,da:a.decisore,quando:a.decision_at,motivo:a.reason}))},
   {id:'servizi',nome:'I tuoi servizi',attivi:catalogoServizi.filter(x=>codici.includes(x.codice)).map(x=>({codice:x.codice,nome:x.nome,include:x.include,consegneDelMese:{fatte:fatto.filter(t=>x.registro.includes(t.service)).length,inCorso:inCorso.filter(t=>x.registro.includes(t.service)).length}})),
    consigliati:consigliati&&consigliati.visibility==='client'?{testo:consigliati.content,fonte:consigliati.source}:null},
   {id:'report',nome:'Report',report:report?[{titolo:'Report operativo del mese',testo:report.content,aggiornato:report.updated_at}]:[],invioAutomatico:{stato:'COLLEGAMENTO MANCANTE',nota:'Invio email programmato non collegato: nessun messaggio parte dal sistema.'},pdf:{stato:'SOLO STRUTTURA',nota:'Esportazione PDF da costruire.'}},
   ...(user.role==='collaborator'?[]:[{id:'documenti',nome:'Documenti e amministrazione',contratti:contratti.map(({amount_cents,...x})=>({...x,canone_cents:amount_cents})),fatture,preventivi:[],materiali:{stato:'SOLO STRUTTURA',nota:'Archivio dei materiali consegnati (loghi, foto, video) da costruire.'}}]),
   ...(codici.includes('S14')?[{id:'crm',nome:'Contatti e clienti (CRM)',contatti:s.query('SELECT COUNT(*) n FROM gr_leads WHERE workspace=?',clientId)[0].n,iscrittiFidelity:s.query('SELECT COUNT(*) n FROM fi_members WHERE tenant_id=?',clientId)[0].n,campagne:{stato:'COLLEGAMENTO MANCANTE',nota:'Email, SMS e Wallet non collegati.'}}]:[]),
   {id:'chiedi',nome:'Chiedi all’agenzia',endpoint:'/api/production/ask',stato:'DEMO',nota:'Le richieste diventano lavori per il team; la risposta usa solo i dati registrati. WhatsApp non collegato.'},
   {id:'profilo',nome:'Il tuo profilo',azienda:{nome:c.name,settore:c.industry,indirizzo:c.address},utenti,notifiche:{stato:'SOLO STRUTTURA',nota:'Preferenze di notifica da costruire.'},fonti:integrazioniCliente.map(fonteNonCollegata)}
  ];
  return {demo,clientId,clientName:c.name,servizi:codici,sezioni,regole:['Ogni cliente vede solo i suoi dati','Mai numeri inventati: le fonti non collegate sono dichiarate']};
 }
 async function handle({method,path,user,clientId}){
  if(method==='GET'&&path==='/dashboard')return {data:dashboard(user,clientId)};
  return null;
 }
 return {dashboard,handle};
}
