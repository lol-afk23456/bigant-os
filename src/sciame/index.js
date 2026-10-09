// Sciame di agenti con motore AI intercambiabile. Ogni giro: l'Orchestratore pianifica,
// i reparti producono, Qualità controlla ogni output PRIMA della coda approvazioni.
// Le approvazioni interne si auto-approvano solo in modalità DEMO; le azioni verso
// l'esterno (pubblicare, inviare, spendere, modificare account) restano bloccate dal codice.
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {AppError,requireOwner,requireClient,uid,now,text} from '../store.js';
import {agentDefinitions,departments} from '../registry.js';
import {marketingChannels} from '../agency/marketing.js';
import {createMotore,ETICHETTE} from '../motori/index.js';
import {schemi,valida,FLUSSI} from './schemi.js';
import {controlliAutomatici,esitoQualita} from './qualita.js';
import {agentiSciame,perRegistro,descrizioneFlussi,statoServiziPlaybook,roadmapQ4_2026,checklistS06} from './agenti.js';
import {aziendeDemo,bottegaDemo,bigantProfilo,pacchettoPresenza,pacchettoS06,NOTA_DEMO} from './dati-demo.js';

const romeDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'});
const euro=c=>(c<0?'-':'')+(Math.abs(c)/100).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const addGiorni=(data,n)=>{const d=new Date(data+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const mesi=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
export const STATI_PASSO={in_coda:'In coda',al_lavoro:'Al lavoro',controllo_qualita:'Controllo qualità',in_attesa_approvazione:'In attesa di approvazione',completato:'Completato',bloccato_qualita:'Fermato da Qualità',errore:'Errore'};
const AZIONI={pubblicazione:'Pubblicare sui canali social',pubblicazione_gbp:'Pubblicare sulla scheda Google',modifica_scheda:'Modificare la scheda Google',risposta_recensioni:'Pubblicare le risposte alle recensioni',invio_email:'Inviare email al potenziale cliente'};

export function createSciame({store:s,production,administration,growth,orchestrator,root,env=process.env,clock=()=>new Date(),motore:motoreIniziale=null}){
 s.db.exec(`CREATE TABLE IF NOT EXISTS os_sciame_giri(id TEXT PRIMARY KEY,richiesta TEXT NOT NULL,flussi TEXT NOT NULL,motore TEXT NOT NULL,stato TEXT NOT NULL,piano TEXT NOT NULL DEFAULT '{}',richiesto_da TEXT NOT NULL,origine TEXT NOT NULL DEFAULT 'locale',errore TEXT,costo_usd_micro INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL,started_at TEXT,finished_at TEXT);
 CREATE TABLE IF NOT EXISTS os_sciame_passi(id TEXT PRIMARY KEY,giro_id TEXT NOT NULL REFERENCES os_sciame_giri(id),ordine INTEGER NOT NULL,flusso TEXT NOT NULL,agente TEXT NOT NULL,reparto TEXT NOT NULL,client_id TEXT NOT NULL REFERENCES os_clients(id),compito TEXT NOT NULL,stato TEXT NOT NULL,motore TEXT NOT NULL,visibilita TEXT NOT NULL DEFAULT 'internal',controlla_passo TEXT,input_json TEXT NOT NULL DEFAULT '{}',output_json TEXT,qualita_json TEXT,esito_qualita TEXT,approvazione_id TEXT,durata_ms INTEGER,costo_usd_micro INTEGER NOT NULL DEFAULT 0,errore TEXT,created_at TEXT NOT NULL,started_at TEXT,finished_at TEXT);
 CREATE TABLE IF NOT EXISTS os_azioni_esterne(id TEXT PRIMARY KEY,giro_id TEXT NOT NULL,passo_id TEXT NOT NULL,client_id TEXT NOT NULL,tipo TEXT NOT NULL,descrizione TEXT NOT NULL,stato TEXT NOT NULL,motivo TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS os_sciame_passi_giro ON os_sciame_passi(giro_id,ordine);
 CREATE INDEX IF NOT EXISTS os_sciame_passi_agente ON os_sciame_passi(agente,created_at);`);
 // Diretta: il testo che l'agente sta scrivendo, salvato a intervalli brevi (visibile anche se il giro gira da riga di comando).
 const colonne=s.query('PRAGMA table_info(os_sciame_passi)').map(c=>c.name);
 for(const c of ['diretta','diretta_fase','diretta_at'])if(!colonne.includes(c))s.db.exec(`ALTER TABLE os_sciame_passi ADD COLUMN ${c} TEXT`);
 // Un processo riavviato non lascia agenti "al lavoro" per sempre: il lavoro interrotto diventa errore visibile.
 s.run("UPDATE os_sciame_passi SET stato='errore',errore='Interrotto: processo riavviato durante il lavoro',finished_at=? WHERE stato IN('in_coda','al_lavoro','controllo_qualita')",now());
 s.run("UPDATE os_sciame_giri SET stato='errore',errore='Interrotto: processo riavviato',finished_at=? WHERE stato IN('in_coda','in_corso')",now());
 const robot=()=>s.one("SELECT * FROM os_users WHERE id='os-orchestrator'");
 const autoDemo=()=>env.BIGANT_MODALITA!=='reale'&&env.BIGANT_APPROVAZIONE_AUTOMATICA_DEMO!=='false';
 const oggi=()=>romeDate.format(clock());
 let motoreCorrente=motoreIniziale;
 const mot=()=>motoreCorrente||(motoreCorrente=createMotore({root,env}));
 const attivi=new Map();

 // ---------- Registro ----------
 function registra(passo,azione,dettaglio={}){s.audit(robot(),passo.client_id,azione,passo.id,{agente:passo.agente,reparto:passo.reparto,flusso:passo.flusso,motore:passo.motore,giro:passo.giro_id,...dettaglio},passo.visibilita==='admin'?'admin':'internal');}
 function aggiorna(id,campi){const k=Object.keys(campi);s.run(`UPDATE os_sciame_passi SET ${k.map(x=>x+'=?').join(',')} WHERE id=?`,...k.map(x=>campi[x]),id);return s.one('SELECT * FROM os_sciame_passi WHERE id=?',id);}
 function feedback(clientId,agente){const reg=agentiSciame[agente]?.registro;return (s.one('SELECT content FROM os_memory WHERE client_id=? AND kind=?',clientId,'agent-feedback:'+reg)?.content||'').split('\n').filter(x=>x&&!x.startsWith('#')).slice(-10);}

 // ---------- Costi: tetto mensile comune (os_costs). 1 USD conteggiato come 1 € (prudenziale). ----------
 function prenota(clientId,agente){const stima=mot().id==='demo'?0:Math.max(Number(env.BIGANT_SCIAME_STIMA_CENT||40),Number(mot().costoMassimoCent||0));const b=orchestrator.budget();if(stima>b.availableCents)throw new AppError(`Tetto di spesa mensile raggiunto: disponibili ${euro(b.availableCents)}. Lo sciame si ferma e avvisa i soci.`,409);return orchestrator.reserve(clientId,'sciame:'+agente,stima);}
 function addebita(costId,usdMicro){s.run("UPDATE os_costs SET cents=?,status='charged' WHERE id=?",Math.ceil(usdMicro/10000),costId);}

 // ---------- Esecuzione di un agente con il motore ----------
 async function chiamaMotore(passo,{agente,compito,pacchetto}){
  if(env.BIGANT_MODALITA==='reale')throw new AppError('Percorso AI reale da collaudare: i giri dimostrativi sono disponibili soltanto in DEMO.',409);
  const costo=prenota(passo.client_id,agente);
  try{
   let scritto=0,ultimo=null;
   const salva=({fase,testo})=>s.run('UPDATE os_sciame_passi SET diretta=?,diretta_fase=?,diretta_at=? WHERE id=?',String(testo||'').slice(-20000),fase,now(),passo.id);
   const onProgresso=x=>{ultimo=x;if(Date.now()-scritto<600)return;scritto=Date.now();salva(x);};
   const {output,meta}=await mot().esegui({agente,compito,pacchetto,schema:schemi[agente],onProgresso});
   if(ultimo)salva({...ultimo,fase:'finito'});
   const errori=valida(schemi[agente],output);
   addebita(costo,meta.costoUsdMicro||0);
   if(errori.length)throw new AppError('Uscita non conforme al contratto: '+errori.slice(0,5).join('; '));
   return {output,meta};
  }catch(e){s.run("UPDATE os_costs SET status=CASE WHEN status='reserved' THEN 'released' ELSE status END WHERE id=?",costo);throw e;}
 }
 function nuovoPasso(giro,{flusso,agente,clientId,compito,pacchetto,visibilita='internal',controlla=null}){
  const id=uid(),ordine=(s.one('SELECT MAX(ordine) n FROM os_sciame_passi WHERE giro_id=?',giro.id).n||0)+1,a=agentiSciame[agente];
  s.run('INSERT INTO os_sciame_passi(id,giro_id,ordine,flusso,agente,reparto,client_id,compito,stato,motore,visibilita,controlla_passo,input_json,created_at,started_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',id,giro.id,ordine,flusso,agente,a.reparto,clientId,compito,'al_lavoro',mot().id,visibilita,controlla,JSON.stringify(pacchetto),now(),now());
  const p=s.one('SELECT * FROM os_sciame_passi WHERE id=?',id);registra(p,`Sciame · ${a.nome} al lavoro`,{compito});return p;
 }
 function chiudiConErrore(p,e){const q=aggiorna(p.id,{stato:'errore',errore:text(e.message,600),finished_at:now()});registra(q,`Sciame · ${agentiSciame[p.agente].nome}: errore`,{errore:q.errore});}

 async function controllo(giro,autore,output,pacchetto,cliente){
  const auto=controlliAutomatici(autore.agente,output,pacchetto);
  const pq=nuovoPasso(giro,{flusso:autore.flusso,agente:'qualita',clientId:autore.client_id,visibilita:autore.visibilita,controlla:autore.id,compito:`Controlla l’output di ${agentiSciame[autore.agente].nome} prima della coda approvazioni`,pacchetto:{oggi:oggi(),autore:{agente:autore.agente,reparto:autore.reparto,flusso:autore.flusso},cliente,controlli_automatici:auto,output,pacchetto_autore:pacchetto,regole:['Brand e tono BigAnt','Nessun dato inventato: ciò che manca è [DA VERIFICARE]','Dati DEMO mai presentati come reali','GDPR e consensi','Pubblicità sanitaria e Codice del Consumo','Recensioni mai inventate o incentivate','Prezzi solo [DA VALIDARE]','Nessuna azione esterna dichiarata come eseguita','BigAnt non è una società']}});
  try{
   const {output:v,meta}=await chiamaMotore(pq,{agente:'qualita',compito:pq.compito,pacchetto:JSON.parse(pq.input_json)});
   const esito=esitoQualita(auto,v);
   const q=aggiorna(pq.id,{stato:'completato',output_json:JSON.stringify(v),qualita_json:JSON.stringify(auto),esito_qualita:esito,durata_ms:meta.durataMs,costo_usd_micro:meta.costoUsdMicro||0,finished_at:now()});
   registra(q,`Sciame · Qualità: ${esito.replace('_',' ')}`,{esito,controllato:autore.id,rilievi:v.rilievi.length,costoUsdMicro:q.costo_usd_micro});
   return {esito,auto,verdetto:v};
  }catch(e){chiudiConErrore(pq,e);throw e;}
 }

 // Un passo completo: agente → Qualità → (una correzione) → coda approvazioni.
 async function passo(giro,def){
  if(s.getSetting('paused')==='true')throw new AppError('Regia in pausa: lo sciame non avvia nuovi lavori.',409);
  let p=nuovoPasso(giro,def);
  try{
   let {output,meta}=await chiamaMotore(p,def),costo=meta.costoUsdMicro||0,durata=meta.durataMs;
   p=aggiorna(p.id,{stato:'controllo_qualita',output_json:JSON.stringify(output),durata_ms:durata,costo_usd_micro:costo});
   registra(p,`Sciame · ${agentiSciame[p.agente].nome}: output pronto per Qualità`,{costoUsdMicro:costo,durataMs:durata});
   let q=await controllo(giro,p,output,def.pacchetto,def.cliente);
   if(q.esito!=='approvabile'){ // una sola correzione, anche dopo un 'bloccato': poi il passo si ferma
    const rilievi=[...q.auto.filter(c=>c.esito!=='ok').map(c=>`${c.regola}: ${c.dettaglio}`),...q.verdetto.rilievi.map(r=>`[${r.gravita}] ${r.problema} → ${r.correzione}`)];
    registra(p,`Sciame · ${agentiSciame[p.agente].nome}: correzione richiesta da Qualità`,{rilievi:rilievi.length});
    const r=await chiamaMotore(p,{...def,compito:`${def.compito}\n\nCORREZIONE RICHIESTA DA QUALITÀ: riscrivi l’output applicando questi rilievi.\n- ${rilievi.join('\n- ')}`});
    output=r.output;costo+=r.meta.costoUsdMicro||0;durata+=r.meta.durataMs;
    p=aggiorna(p.id,{output_json:JSON.stringify(output),durata_ms:durata,costo_usd_micro:costo});
    q=await controllo(giro,p,output,def.pacchetto,def.cliente);
   }
   if(q.esito!=='approvabile'){
    p=aggiorna(p.id,{stato:'bloccato_qualita',esito_qualita:q.esito,qualita_json:JSON.stringify({auto:q.auto,verdetto:q.verdetto}),finished_at:now()});
    registra(p,`Sciame · ${agentiSciame[p.agente].nome}: fermato da Qualità`,{esito:q.esito});
    return {passo:p,output,approvato:false};
   }
   const titolo=`${agentiSciame[p.agente].nome} · ${text(output.sintesi,120)}`;
   const aid=uid();s.run('INSERT INTO os_approvals(id,client_id,kind,entity_id,version,title,body,status,requested_by,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',aid,p.client_id,'sciame_output',p.id,1,titolo,text(output.sintesi,1500),'pending','os-orchestrator',now());
   p=aggiorna(p.id,{stato:'in_attesa_approvazione',esito_qualita:q.esito,qualita_json:JSON.stringify({auto:q.auto,verdetto:q.verdetto}),approvazione_id:aid});
   registra(p,`Sciame · ${agentiSciame[p.agente].nome}: in coda approvazioni`,{approvazione:aid});
   if(autoDemo()){
    s.run("UPDATE os_approvals SET status='approved',decision_by='os-orchestrator',decision_at=?,reason=? WHERE id=?",now(),'auto-approvato (DEMO)',aid);
    p=aggiorna(p.id,{stato:'completato',finished_at:now()});
    registra(p,'Approvazione: auto-approvato (DEMO)',{approvazione:aid,passaggio:'interno'});
    return {passo:p,output,approvato:true};
   }
   return {passo:p,output,approvato:false};
  }catch(e){if(s.one('SELECT stato FROM os_sciame_passi WHERE id=?',p.id).stato!=='errore')chiudiConErrore(p,e);return {passo:s.one('SELECT * FROM os_sciame_passi WHERE id=?',p.id),errore:e};}
 }

 // ---------- Azioni verso l'esterno: sempre bloccate dal codice in questa versione ----------
 function azioneEsterna(passoRow,tipo,descrizione){
  const id=uid(),motivo='COLLEGAMENTO MANCANTE e ok di un socio obbligatorio: in DEMO il codice non esegue azioni verso l’esterno.';
  s.run('INSERT INTO os_azioni_esterne VALUES(?,?,?,?,?,?,?,?,?)',id,passoRow.giro_id,passoRow.id,passoRow.client_id,tipo,text(descrizione,500),'bloccata',motivo,now());
  registra(passoRow,'Azione esterna bloccata',{tipo,descrizione:text(descrizione,200)});
  if(passoRow.stato==='completato')aggiorna(passoRow.id,{stato:'in_attesa_approvazione'});
  return id;
 }
 function eseguiAzioneEsterna(user,id){requireOwner(user);const a=s.one('SELECT * FROM os_azioni_esterne WHERE id=?',id);if(!a)throw new AppError('Azione non trovata.',404);s.audit(user,a.client_id,'Tentativo di azione esterna rifiutato',id,{tipo:a.tipo},'internal');throw new AppError(`${AZIONI[a.tipo]||a.tipo}: bloccato. ${a.motivo}`,409);}

 // ---------- Contenuti nella produzione comune (stati IDEA → … → PROGRAMMATO) ----------
 async function contenuti(passoRow,bozze,{approvatore,servizio='social',attendiCliente=false}){
  const r=robot(),c=passoRow.client_id,creati=[];
  for(const b of bozze){
   const corpo=`${b.testo}\n\nCTA: ${b.cta}${b.hashtag?.length?'\n'+b.hashtag.join(' '):''}${b.brief_visivo?`\n\nBrief visivo: ${b.brief_visivo}`:''}${b.canale?`\nCanale: ${b.canale} · ${b.formato}`:'\nCanale: Google Business Profile'}`;
   const fonte=`Sciame ${passoRow.giro_id.slice(0,8)} · ${agentiSciame[passoRow.agente].nome} · motore ${passoRow.motore}`;
   let x=(await production.handle({method:'POST',path:'/contents',body:{service:servizio,title:text(b.titolo,170),body:corpo,source:fonte},user:r,clientId:c})).data;
   x=(await production.handle({method:'PATCH',path:'/contents/'+x.id,body:{version:x.version,state:'IN PRODUZIONE'},user:r,clientId:c})).data;
   x=(await production.handle({method:'PATCH',path:'/contents/'+x.id,body:{version:x.version,state:'DA APPROVARE'},user:r,clientId:c})).data;
   const a=s.one("SELECT * FROM os_approvals WHERE kind='content' AND entity_id=? AND version=?",x.id,x.version);
   production.tagApproval(a.id,agentiSciame[passoRow.agente].nome,passoRow.esito_qualita);
   if(attendiCliente){registra(passoRow,'Contenuto in attesa dell’approvazione del cliente',{contenuto:x.id,approvazione:a.id});creati.push(x.id);continue;}
   if(autoDemo()){
    await production.handle({method:'POST',path:'/approvals/'+a.id,body:{decision:'approved',reason:`auto-approvato (DEMO) · ${approvatore}`},user:r,clientId:c});
    s.run("UPDATE os_approvals SET reason=? WHERE id=?",`auto-approvato (DEMO) · ${approvatore}`,a.id);
    registra(passoRow,'Approvazione: auto-approvato (DEMO)',{contenuto:x.id,passaggio:approvatore});
    const quando=/^\d{4}-\d{2}-\d{2}$/.test(b.data_proposta)&&Date.parse(b.data_proposta+'T10:00:00+02:00')>Date.now()?b.data_proposta+'T10:00:00+02:00':new Date(Date.now()+86400000).toISOString();
    x=(await production.handle({method:'PATCH',path:'/contents/'+x.id,body:{version:x.version,state:'PROGRAMMATO',scheduled_at:quando},user:r,clientId:c})).data;
    registra(passoRow,'Contenuto programmato (solo calendario DEMO)',{contenuto:x.id,quando});
   }
   creati.push(x.id);azioneEsterna(passoRow,servizio==='local'?'pubblicazione_gbp':'pubblicazione',servizio==='local'?`Post GBP «${b.titolo}» — pubblicazione bloccata (GBP API non collegata)`:`${b.canale}: «${b.titolo}» — pubblicazione reale bloccata (Postiz/Meta non collegati)`);
  }
  return creati;
 }

 // ---------- Pacchetti di input (dati DEMO dal database comune) ----------
 function settimanaProssima(){const d=oggi(),g=new Date(d+'T12:00:00Z').getUTCDay(),dal=addGiorni(d,((8-g)%7)||7);return {dal,al:addGiorni(dal,6)};}
 function amministrazioneAggregati(){const st=administration.state('demo-bigant',robot());return st;}
 function pacchettoDirettore(){
  const clienti=s.query('SELECT name,services_json FROM os_clients WHERE active=1'),st=amministrazioneAggregati(),mese=oggi().slice(0,7);
  const leads=growth?growth.store.query('SELECT stage FROM leads WHERE workspace=?','demo-bigant'):[];
  const funnel=Object.fromEntries(['new','qualified','contacted','replied','meeting','proposal','won','lost'].map(f=>[f,leads.filter(l=>l.stage===f).length]));
  const costi=s.one("SELECT COALESCE(SUM(cents),0) n FROM os_costs WHERE month=? AND status='charged'",mese).n;
  const kpi={
   clienti_attivi:{valore:String(clienti.length),fonte:'Anagrafica clienti DEMO'},
   servizi_medi_per_cliente:{valore:(clienti.reduce((n,c)=>n+JSON.parse(c.services_json).length,0)/Math.max(1,clienti.length)).toFixed(1).replace('.',','),fonte:'Servizi acquistati per cliente DEMO'},
   saldo_conti:{valore:euro(st.summary.balance_cents),fonte:'Aggregati Amministrazione DEMO (non riconciliati)'},
   incassi_mese:{valore:euro(st.summary.income_month_cents),fonte:'Aggregati Amministrazione DEMO'},
   spese_mese:{valore:euro(-st.summary.expenses_month_cents||0),fonte:'Aggregati Amministrazione DEMO'},
   arretrati:{valore:euro(st.summary.arrears_cents),fonte:'Aggregati Amministrazione DEMO'},
   fatture_da_emettere:{valore:euro(st.summary.draft_invoice_cents),fonte:'Aggregati Amministrazione DEMO'},
   anomalie_contabili_aperte:{valore:String(st.summary.open_anomalies),fonte:'Controllo “cosa non torna” DEMO'},
   lavori_aperti:{valore:String(s.one("SELECT COUNT(*) n FROM os_tasks WHERE status!='done'").n),fonte:'Task DEMO'},
   lavori_in_ritardo:{valore:String(s.one("SELECT COUNT(*) n FROM os_tasks WHERE status!='done' AND due<?",now()).n),fonte:'Task DEMO'},
   approvazioni_in_attesa:{valore:String(s.one("SELECT COUNT(*) n FROM os_approvals WHERE status='pending'").n),fonte:'Coda approvazioni'},
   costo_agenti_mese:{valore:euro(costi),fonte:'Tetto di spesa comune os_costs'},
   ricavo_medio_per_cliente:{valore:'[DA VERIFICARE]',fonte:'Canoni reali non collegati'},
   clienti_persi:{valore:'[DA VERIFICARE]',fonte:'Storico non migrato'},
   ore_risparmiate_agenti:{valore:'[DA VERIFICARE]',fonte:'Nessuna misura di base'}
  };
  const precedenti=s.query("SELECT output_json FROM os_sciame_passi WHERE agente='direttore-crescita' AND stato IN('completato','in_attesa_approvazione') ORDER BY created_at DESC LIMIT 1").flatMap(r=>JSON.parse(r.output_json).priorita.map(p=>p.titolo));
  return {oggi:oggi(),settimana:settimanaProssima(),kpi,funnel_commerciale:funnel,stato_servizi:statoServiziPlaybook,roadmap_q4_2026:roadmapQ4_2026,priorita_precedenti:precedenti,feedback_soci:feedback('demo-bigant','direttore-crescita'),vincoli:['Massimo e non meno di 3 priorità','Solo KPI aggregati: nessun dato contabile grezzo','Il Direttore propone, i soci decidono','Nessun prezzo o risultato garantito']};
 }
 function pacchettoMarketing(prioritaDirettore){
  const mem=k=>s.one('SELECT content FROM os_memory WHERE client_id=? AND kind=?','demo-bigant',k)?.content||'[DA VERIFICARE] non ancora compilato';
  return {oggi:oggi(),settimana:settimanaProssima(),cliente:bigantProfilo,canali:marketingChannels.map(c=>({id:c.id,nome:c.name})),dna:mem('dna'),strategia:mem('strategy'),priorita_direttore:prioritaDirettore||[],feedback_soci:feedback('demo-bigant','marketing'),
   regole:['BigAnt è il cliente zero: obiettivi Tappa 3B (clienti locali, portfolio e reputazione, notorietà)','Nessun caso cliente, logo o risultato senza autorizzazione registrata: [DA VERIFICARE]','Nulla viene pubblicato senza l’ok di un socio','Italiano, tono autorevole e concreto, nessuna chiusura debole']};
 }
 async function leadCandidati(){
  const r=robot(),out=[];
  for(const a of aziendeDemo){
   let lead=growth.store.query('SELECT * FROM leads WHERE workspace=? AND domain=?','demo-bigant',new URL(a.sito).hostname)[0];
   if(!lead){try{lead=(await growth.handle({method:'POST',path:'/leads',body:{company:a.azienda,website:a.sito,email:a.email,sector:a.settore,city:a.citta,source:'Ricerca clienti DEMO dello sciame · '+NOTA_DEMO,notes:'Lead DEMO inventato per il collaudo.'},user:r,clientId:'demo-bigant'})).data;}catch(e){if(e.status!==409)throw e;lead=growth.store.query('SELECT * FROM leads WHERE workspace=? AND domain=?','demo-bigant',new URL(a.sito).hostname)[0];}}
   out.push({lead_id:lead.id,azienda:a.azienda,settore:a.settore,citta:a.citta,sito:a.sito,segnali:a.segnali,chiave:a.chiave});
  }
  return out;
 }
 const statoAmm=()=>administration.state('demo-bigant',robot());
 async function primaNotaDemo(){
  // Importazione della prima nota DEMO del mese: movimenti inventati e immutabili, idempotenti per riferimento.
  const r=robot(),g=n=>addGiorni(romeDate.format(new Date()),-n),movimenti=[
   {sourceRef:'sciame-pn-001',entityId:'demo-entity-a',accountId:'demo-cash-a',counterpartyId:'demo-party-client',date:g(1),amountCents:15000,direction:'in',category:'Lavoro una tantum',method:'cash'},
   {sourceRef:'sciame-pn-002',entityId:'demo-entity-a',accountId:'demo-bank-a',counterpartyId:'demo-party-supplier',subscriptionId:'demo-fin-subscription',date:g(2),amountCents:2400,direction:'out',category:'Abbonamenti strumenti',method:'card',documentRef:'Ricevuta DEMO-77'},
   {sourceRef:'sciame-pn-003',entityId:'demo-entity-b',accountId:'demo-bank-b',counterpartyId:'demo-party-supplier',date:g(3),amountCents:4900,direction:'out',category:'Software',method:'card'},
   {sourceRef:'sciame-pn-004',entityId:'demo-entity-b',accountId:'demo-bank-b',counterpartyId:'demo-party-team',date:g(4),amountCents:9000,direction:'out',category:'Compensi collaboratori',method:'bank',documentRef:'Notula DEMO-5'},
   {sourceRef:'sciame-pn-005',entityId:'demo-entity-b',accountId:'demo-bank-b',counterpartyId:'demo-party-team',date:g(4),amountCents:9000,direction:'out',category:'Compensi collaboratori',method:'bank',documentRef:'Notula DEMO-5'}
  ],esiti=[];
  for(const m of movimenti){
   if(s.one('SELECT id FROM os_fin_movements WHERE source_ref=?',m.sourceRef)){esiti.push({riferimento:m.sourceRef,esito:'già registrato'});continue;}
   try{await administration.handle({method:'POST',path:'/movements',body:{...m,idempotencyKey:m.sourceRef},user:r,clientId:'demo-bigant'});esiti.push({riferimento:m.sourceRef,esito:'registrato'});}catch(e){esiti.push({riferimento:m.sourceRef,esito:'rifiutato dal gestionale: '+e.message});}
  }
  return esiti;
 }
 function pacchettoAmministrazione(importazione){
  const analisi=administration.analyze(robot()),st=statoAmm(),nomi=Object.fromEntries([...st.entities,...st.accounts,...st.counterparties].map(x=>[x.id,x.name]));
  const aperte=analisi.anomalies.filter(a=>a.status!=='resolved'&&a.detected);
  return {oggi:oggi(),nota:NOTA_DEMO,importazione_prima_nota:importazione,ditte:st.entities.map(e=>({id:e.id,nome:e.name,saldo:euro(e.balance_cents)})),
   conti:st.accounts.map(a=>({id:a.id,nome:a.name,ditta:nomi[a.entity_id],saldo:euro(a.balance_cents)})),
   prima_nota:st.movements.slice(0,40).map(m=>({id:m.id,data:m.date,importo:euro(m.amount_cents),verso:m.direction==='in'?'entrata':'uscita',ditta:nomi[m.entity_id],conto:nomi[m.account_id],categoria:m.category||'(mancante)',controparte:nomi[m.counterparty_id]||'',documento:m.document_ref||'(nessuno)',metodo:m.method})),
   fatture:st.invoices.map(i=>({numero:i.number,cliente:nomi[i.counterparty_id]||i.client_id,importo:euro(i.amount_cents),scadenza:i.due_date,residuo:euro(i.remaining_cents),stato:i.status})),
   scadenze:st.obligations.map(o=>({descrizione:o.description||o.kind,scadenza:o.due_date,importo:euro(o.amount_cents),residuo:euro(o.remaining_cents)})),
   anomalie_rilevate:aperte.map(a=>({anomalia_id:a.id,regola:a.rule,titolo:a.title,importo:euro(a.amount_cents),priorita:a.priority})),
   regole:['Movimenti immutabili: correzioni solo proposte, con contromovimento confermato da un socio','Nessuna consulenza fiscale presentata come certa: dubbi al commercialista','Importi riportati identici al centesimo','Area riservata ai soci']};
 }

 // ---------- Flussi ----------
 async function flussoCrescita(giro){
  const pk=pacchettoDirettore();
  const r=await passo(giro,{flusso:'crescita',agente:'direttore-crescita',clientId:'demo-bigant',compito:`Analizza i KPI aggregati e proponi ai soci esattamente 3 priorità per la settimana dal ${pk.settimana.dal} al ${pk.settimana.al}.`,pacchetto:pk,cliente:{nome:'BigAnt',settore:'Agenzia di comunicazione',sanitario:false}});
  if(r.approvato)s.run("INSERT INTO os_memory VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(client_id,kind) DO UPDATE SET content=excluded.content,version=os_memory.version+1,source=excluded.source,updated_at=excluded.updated_at",uid(),'demo-bigant','priorita-settimana',r.output.priorita.map((p,i)=>`${i+1}. ${p.titolo} — ${p.azione}`).join('\n'),'internal',1,`Sciame ${giro.id.slice(0,8)} · Direttore Crescita · motore ${r.passo.motore}`,now());
  return r;
 }
 async function flussoMarketing(giro,ctx){
  const pk=pacchettoMarketing(ctx.priorita);
  const r=await passo(giro,{flusso:'marketing',agente:'marketing',clientId:'demo-bigant',compito:`Prepara il piano editoriale BigAnt per la settimana dal ${pk.settimana.dal} al ${pk.settimana.al} e le bozze dei post pronte da approvare.`,pacchetto:pk,cliente:{nome:'BigAnt',settore:'Agenzia di comunicazione',sanitario:false}});
  if(r.approvato)await contenuti(r.passo,r.output.bozze,{approvatore:'passaggio interno al posto del socio'});
  return r;
 }
 async function flussoCommerciale(giro){
  const candidati=await leadCandidati();
  const pr={oggi:oggi(),obiettivo:'Trovare e qualificare PMI locali per l’analisi gratuita S17',profilo_bigant:{area:bigantProfilo.area,clienti_attuali:bigantProfilo.clienti_attuali,settori_presidiati:bigantProfilo.settori_presidiati,fonte:'docs/BRIEF-BIGANT.md, Parte 1 “Chi siamo”'},pacchetto_ingresso:{nome:pacchettoPresenza.nome,composizione:pacchettoPresenza.composizione,fonte:'docs/playbook/00_CATALOGO-BIGANT.md, sezione 4'},servizi_prioritari:['Video','Siti web','Social','Sponsorizzate'],servizi_esclusi_acquisizione:['Insegne','Foto','Abbigliamento','Gadget personalizzati'],candidati:candidati.map(({chiave,...c})=>c),vincoli:['Lead DEMO inventati: nessun contatto reale','GDPR e Registro delle opposizioni prima di qualsiasi contatto','Nessun invio automatico']};
  const ricerca=await passo(giro,{flusso:'commerciale',agente:'ricerca-clienti',clientId:'demo-bigant',compito:'Qualifica i candidati DEMO e scegli il lead per l’analisi gratuita.',pacchetto:pr,cliente:{nome:'BigAnt',settore:'Agenzia',sanitario:false}});
  if(!ricerca.approvato)return ricerca;
  for(const v of ricerca.output.valutazioni)if(candidati.some(c=>c.lead_id===v.lead_id))growth.store.run('UPDATE leads SET score=?,notes=?,updated=? WHERE workspace=? AND id=?',v.punteggio,text(`Qualifica sciame (motore ${ricerca.passo.motore}): ${v.motivo}`,6000),now(),'demo-bigant',v.lead_id);
  const scelto=candidati.find(c=>c.lead_id===ricerca.output.scelto_lead_id),fix=aziendeDemo.find(a=>a.chiave===scelto.chiave);
  const pa={oggi:oggi(),azienda:{lead_id:scelto.lead_id,nome:scelto.azienda,settore:scelto.settore,citta:scelto.citta,sito:scelto.sito},dati_raccolti:fix.dati||{segnali:fix.segnali,nota:'[DA VERIFICARE] Dati completi non raccolti nella DEMO: usare solo i segnali.'},nota_dati:NOTA_DEMO,servizi_bigant:statoServiziPlaybook.map(({codice,nome})=>({codice,nome})),metodo_punteggio:{regola:'Ogni area valutabile riceve un voto 0–10 motivato dai dati raccolti; punteggio_presenza = somma dei voti delle aree valutate / (10 × numero di aree valutate) × 100, arrotondato all’intero. Le aree senza dati non entrano in “aree” né nel calcolo e vanno in da_verificare.',stato:'Metodo provvisorio [DA VALIDARE dai soci]',fonte:'docs/playbook/S17_analisi-gratuita.md, sezioni 2 e 13'},vincoli:['Report di 2–3 pagine con 3 azioni consigliate','Niente toni denigratori sui concorrenti','Controllo di un socio prima di qualsiasi invio']};
  const analisi=await passo(giro,{flusso:'commerciale',agente:'analisi-gratuita',clientId:'demo-bigant',compito:`Produci l’analisi gratuita della presenza online (S17) di ${scelto.azienda}.`,pacchetto:pa,cliente:{nome:scelto.azienda,settore:scelto.settore,sanitario:/fisio|medic|sanit|clinic/i.test(scelto.settore)}});
  if(!analisi.approvato)return analisi;
  growth.store.run('UPDATE leads SET analysis=?,updated=? WHERE workspace=? AND id=?',text(analisi.output.testo_report,8000),now(),'demo-bigant',scelto.lead_id);
  const pp={oggi:oggi(),azienda:pa.azienda,analisi:{punteggio_presenza:analisi.output.punteggio_presenza,sintesi:analisi.output.sintesi,azioni_consigliate:analisi.output.azioni_consigliate},pacchetto:pacchettoPresenza,ditte:['Costantino Agency (Alfonso Costantino)','La Manna Agency (Raffaele La Manna)'],vincoli:['Prezzi solo come proposta [DA VALIDARE dai soci]','Ditta emittente [DA DECIDERE]','Regime forfettario: niente IVA, bollo da verificare con il commercialista','Email in bozza: invio bloccato fino all’ok di un socio']};
  const proposta=await passo(giro,{flusso:'commerciale',agente:'proposta-commerciale',clientId:'demo-bigant',compito:`Prepara la bozza di proposta del pacchetto BigAnt Presenza per ${scelto.azienda}, collegata all’analisi.`,pacchetto:pp,cliente:pa.azienda});
  if(proposta.approvato)azioneEsterna(proposta.passo,'invio_email',`Email a ${aziendeDemo.find(a=>a.chiave===scelto.chiave).email} con analisi e proposta — invio bloccato (Gmail non collegata, consenso da verificare)`);
  return proposta;
 }
 async function flussoSocial(giro){
  const d=oggi(),m=new Date(d+'T12:00:00Z');m.setUTCMonth(m.getUTCMonth()+1);const mese=`${mesi[m.getUTCMonth()]} ${m.getUTCFullYear()}`;
  const pk={oggi:d,mese,cliente:bottegaDemo.cliente,squadra_bigant:bigantProfilo.squadra,pacchetto:{nome:'S “Presenza”',contenuti_mese:8,canali:['Instagram','Facebook'],reel:2},dna:bottegaDemo.dna,promozioni_eventi:bottegaDemo.promozioni_eventi,feedback_cliente:feedback('demo-bottega','social'),regole:['Piano del mese successivo entro il 20','Voce del cliente (DNA)','Nessuna promessa o prezzo non fornito','Pubblicazione solo dopo ok del cliente']};
  const r=await passo(giro,{flusso:'social',agente:'social',clientId:'demo-bottega',compito:`Prepara il piano editoriale S01 di ${mese} per ${bottegaDemo.cliente.nome} con i testi dei post.`,pacchetto:pk,cliente:{nome:bottegaDemo.cliente.nome,settore:bottegaDemo.cliente.settore,sanitario:false}});
  if(r.approvato)await contenuti(r.passo,r.output.post,{approvatore:'approvazione del cliente simulata'});
  return r;
 }
 async function flussoLocal(giro,{dati=bottegaDemo,attendiCliente=false}={}){
  const cid=dati.cliente.id,cliente={nome:dati.cliente.nome,settore:dati.cliente.settore,sanitario:/fisio|medic|sanit|clinic/i.test(dati.cliente.settore)};
  const gbp=await passo(giro,{flusso:'local',agente:'local-gbp',clientId:cid,compito:`Controlla la scheda Google di ${cliente.nome} (S06), segnala le incoerenze con il sito e prepara 4 post GBP del mese.`,pacchetto:{oggi:oggi(),cliente:dati.cliente,squadra_bigant:bigantProfilo.squadra,pacchetto_s06:pacchettoS06,scheda_google:dati.scheda_google,dati_sito:dati.dati_sito,checklist_s06:checklistS06,vincoli:['Le modifiche le esegue Vincenzo dopo l’ok (Trello “GBP OPS”)','Nessuna modifica aggressiva: rischio sospensione']},cliente});
  if(gbp.approvato){azioneEsterna(gbp.passo,'modifica_scheda',`${gbp.output.controlli.filter(c=>c.stato!=='ok').length} correzioni alla scheda Google — modifica bloccata (GBP API non collegata)`);
   if(attendiCliente)gbp.contenuti=await contenuti(gbp.passo,gbp.output.post_gbp,{approvatore:'cliente',servizio:'local',attendiCliente:true});
   else for(const x of gbp.output.post_gbp)azioneEsterna(gbp.passo,'pubblicazione_gbp',`Post GBP «${x.titolo}» — pubblicazione bloccata`);}
  if(!dati.recensioni?.length)return gbp;
  const rep=await passo(giro,{flusso:'local',agente:'reputazione',clientId:cid,compito:`Prepara le risposte a tutte le recensioni DEMO di ${cliente.nome} (S08) e il kit di raccolta.`,pacchetto:{oggi:oggi(),cliente:dati.cliente,tono:dati.dna||'[DA VERIFICARE] DNA non compilato',recensioni:dati.recensioni,regole:['Vietato comprare, inventare o incentivare recensioni','Negative: avviso immediato e ok del cliente','Nessun dato personale o sensibile nelle risposte']},cliente});
  if(rep.approvato){for(const a of rep.output.avvisi)registra(rep.passo,'Avviso reputazione',{avviso:text(a,200)});azioneEsterna(rep.passo,'risposta_recensioni',`${rep.output.risposte.length} risposte alle recensioni — pubblicazione bloccata (GBP API non collegata)`);}
  return rep;
 }
 async function flussoAmministrazione(giro){
  const importazione=await primaNotaDemo(),pk=pacchettoAmministrazione(importazione);
  return passo(giro,{flusso:'amministrazione',agente:'amministrazione',clientId:'demo-bigant',visibilita:'admin',compito:'Spiega ai soci le anomalie “cosa non torna” della prima nota DEMO, con verifiche e correzioni solo proposte.',pacchetto:pk,cliente:{nome:'BigAnt (area riservata ai soci)',settore:'Amministrazione',sanitario:false}});
 }
 async function flussoUpsell(giro,{clientId}){
  const c=s.one('SELECT * FROM os_clients WHERE id=?',clientId),attivi=JSON.parse(c.services_json),analisi=growth.store.query('SELECT company,analysis FROM leads WHERE client_id=? OR company=?',clientId,c.name)[0];
  const pk={...pacchettoDirettore(),cliente:{id:c.id,nome:c.name,settore:c.industry,servizi_attivi:attivi},analisi_iniziale:analisi?.analysis?text(analisi.analysis,3000):'[DA VERIFICARE] analisi non disponibile',pacchetti_catalogo:['BigAnt Presenza (S06+S07+S08 base+S17+dashboard)','BigAnt Crescita Locale (Presenza + S01 M + S03 Start)','BigAnt Sanità (Sito Standard + S05 S + Presenza + S12 Servizi + S13 chatbot + compliance sanitaria)','BigAnt Ristorazione','BigAnt Brand'],vincoli:['Esattamente 3 proposte di upsell gentile per questo cliente, nessuna pressione commerciale','Prezzi solo [DA VALIDARE]','Il Direttore propone, i soci decidono e solo dopo il cliente vede i servizi consigliati']};
  const r=await passo(giro,{flusso:'upsell',agente:'direttore-crescita',clientId:'demo-bigant',compito:`Proponi ai soci 3 opportunità di upsell per ${c.name}, partendo dai servizi attivi, dall’analisi iniziale e dal catalogo.`,pacchetto:pk,cliente:{nome:c.name,settore:c.industry,sanitario:/fisio|medic|sanit|clinic/i.test(c.industry)}});
  if(r.approvato)s.run("INSERT INTO os_memory VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(client_id,kind) DO UPDATE SET content=excluded.content,version=os_memory.version+1,source=excluded.source,visibility='client',updated_at=excluded.updated_at",uid(),clientId,'servizi-consigliati',r.output.priorita.map((p,i)=>`${i+1}. ${p.titolo}\n${p.risultato_atteso}`).join('\n\n'),'client',1,`Direttore Crescita · motore ${r.passo.motore} · approvato`,now());
  return r;
 }
 const esecutori={crescita:flussoCrescita,marketing:flussoMarketing,commerciale:flussoCommerciale,social:flussoSocial,local:flussoLocal,amministrazione:flussoAmministrazione};

 // ---------- Giro completo ----------
 function creaGiro(user,{richiesta,flussi=null}){
  requireOwner(user);if(env.BIGANT_MODALITA==='reale')throw new AppError('Lo sciame reale richiede agenti attivi e un percorso collaudato sui dati autorizzati.',409);const req=text(richiesta,1500);if(!req)throw new AppError('Scrivi la richiesta per lo sciame.');
  if(flussi&&(!Array.isArray(flussi)||flussi.some(f=>!FLUSSI.includes(f))))throw new AppError('Flussi non validi.');
  const stato=mot().stato();if(!stato.disponibile)throw new AppError(`Motore non disponibile: ${stato.motivo}`,409);
  if(s.getSetting('paused')==='true')throw new AppError('Regia in pausa: lo sciame non avvia nuovi lavori.',409);
  const id=uid();s.run('INSERT INTO os_sciame_giri(id,richiesta,flussi,motore,stato,richiesto_da,created_at) VALUES(?,?,?,?,?,?,?)',id,req,JSON.stringify(flussi||[]),mot().id,'in_coda',user.id,now());
  s.audit(user,'demo-bigant','Sciame · giro richiesto',id,{richiesta:text(req,200),motore:mot().id},'internal');
  return s.one('SELECT * FROM os_sciame_giri WHERE id=?',id);
 }
 async function eseguiGiro(giroId){
  let giro=s.one('SELECT * FROM os_sciame_giri WHERE id=?',giroId);
  s.run("UPDATE os_sciame_giri SET stato='in_corso',started_at=? WHERE id=?",now(),giroId);
  try{
   const pk={richiesta:giro.richiesta,oggi:oggi(),flussi_disponibili:descrizioneFlussi,clienti:s.query('SELECT id,name nome,services_json FROM os_clients WHERE active=1').map(c=>({id:c.id,nome:c.nome,servizi:JSON.parse(c.services_json)})),vincoli:['Pubblicare, inviare, spendere e modificare account: vietato, bloccato dal codice','Solo dati DEMO','Ogni output passa da Qualità prima della coda approvazioni']};
   const pp=nuovoPasso(giro,{flusso:'regia',agente:'orchestratore',clientId:'demo-bigant',compito:'Leggi la richiesta dei soci, scegli i flussi da avviare e scrivi il brief per ciascun reparto.',pacchetto:pk});
   let piano;
   try{const {output,meta}=await chiamaMotore(pp,{agente:'orchestratore',compito:pp.compito,pacchetto:pk});piano=output;const q=aggiorna(pp.id,{stato:'completato',output_json:JSON.stringify(output),durata_ms:meta.durataMs,costo_usd_micro:meta.costoUsdMicro||0,finished_at:now()});registra(q,'Sciame · Orchestratore: piano pronto',{flussi:output.piano.map(x=>x.flusso)});}
   catch(e){chiudiConErrore(pp,e);throw e;}
   const richiesti=JSON.parse(giro.flussi),scelti=[...new Set((richiesti.length?richiesti:piano.piano.map(x=>x.flusso)).filter(f=>FLUSSI.includes(f)))];
   s.run('UPDATE os_sciame_giri SET piano=? WHERE id=?',JSON.stringify({...piano,eseguiti:scelti,forzati:!!richiesti.length}),giroId);
   // Crescita prima del Marketing (le priorità del Direttore entrano nel piano editoriale); gli altri in parallelo.
   const ctx={},limite=Math.max(1,Number(env.BIGANT_SCIAME_PARALLELISMO||3));
   const catena=async()=>{if(scelti.includes('crescita')){const r=await flussoCrescita(giro);if(r.approvato)ctx.priorita=r.output.priorita.map(p=>p.titolo);}if(scelti.includes('marketing'))await flussoMarketing(giro,ctx);};
   const lavori=[...(scelti.some(f=>['crescita','marketing'].includes(f))?[catena]:[]),...scelti.filter(f=>!['crescita','marketing'].includes(f)).map(f=>()=>esecutori[f](giro))];
   const coda=[...lavori];await Promise.all(Array.from({length:Math.min(limite,coda.length)},async()=>{while(coda.length)await coda.shift()();}));
   const passi=s.query('SELECT stato,costo_usd_micro FROM os_sciame_passi WHERE giro_id=?',giroId),errori=passi.filter(p=>p.stato==='errore').length;
   s.run('UPDATE os_sciame_giri SET stato=?,costo_usd_micro=?,finished_at=? WHERE id=?',errori?'completato_con_errori':'completato',passi.reduce((n,p)=>n+p.costo_usd_micro,0),now(),giroId);
  }catch(e){s.run("UPDATE os_sciame_giri SET stato='errore',errore=?,finished_at=? WHERE id=?",text(e.message,600),now(),giroId);}
  giro=s.one('SELECT * FROM os_sciame_giri WHERE id=?',giroId);s.audit(robot(),'demo-bigant','Sciame · giro concluso',giroId,{stato:giro.stato,motore:giro.motore,costoUsdMicro:giro.costo_usd_micro},'internal');
  return riepilogoGiro(giroId);
 }
 function avviaGiro(user,richiesta){const giro=creaGiro(user,richiesta);const p=eseguiGiro(giro.id).finally(()=>attivi.delete(giro.id));attivi.set(giro.id,p);return giro;}

 // ---------- Approvazione manuale (quando l'auto-approvazione DEMO è disattivata) ----------
 function decide(user,a,body){
  requireOwner(user);const p=s.one('SELECT * FROM os_sciame_passi WHERE id=?',a.entity_id);
  if(!p||a.status!=='pending'||p.stato!=='in_attesa_approvazione')throw new AppError('Decisione già registrata o passo non in attesa.',409);
  if(!['approved','rejected','changes'].includes(body.decision))throw new AppError('Decisione non valida.');if(body.decision!=='approved'&&!text(body.reason))throw new AppError('Indica il motivo: tornerà all’agente come regola.');
  return s.transaction(()=>{
   s.run('UPDATE os_approvals SET status=?,decision_by=?,decision_at=?,reason=? WHERE id=?',body.decision,user.id,now(),text(body.reason,1500),a.id);
   aggiorna(p.id,{stato:body.decision==='approved'?'completato':'bloccato_qualita',finished_at:now()});
   if(body.decision!=='approved'){const kind='agent-feedback:'+agentiSciame[p.agente].registro,prev=s.one('SELECT content FROM os_memory WHERE client_id=? AND kind=?',p.client_id,kind)?.content||'# Feedback agente';s.run('INSERT INTO os_memory VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(client_id,kind) DO UPDATE SET content=excluded.content,version=os_memory.version+1,source=excluded.source,updated_at=excluded.updated_at',uid(),p.client_id,kind,(prev+'\n'+now().slice(0,10)+' · Regola dai soci: '+text(body.reason,1500)).slice(-20000),p.visibilita==='admin'?'admin':'internal',1,'Decisione '+a.id,now());}
   s.audit(user,p.client_id,'Decisione sull’output dello sciame',p.id,{decision:body.decision,agente:p.agente},p.visibilita==='admin'?'admin':'internal');
   return {ok:true,externalActions:false};
  });
 }

 // ---------- Letture ----------
 const parse=v=>v?JSON.parse(v):null;
 function riepilogoGiro(id){const g=s.one('SELECT * FROM os_sciame_giri WHERE id=?',id);if(!g)throw new AppError('Giro non trovato.',404);return {...g,flussi:parse(g.flussi),piano:parse(g.piano),passi:s.query('SELECT * FROM os_sciame_passi WHERE giro_id=? ORDER BY ordine',id).map(p=>({...p,input:parse(p.input_json),output:parse(p.output_json),qualita:parse(p.qualita_json),input_json:undefined,output_json:undefined,qualita_json:undefined,diretta:undefined,diretta_fase:undefined,diretta_at:undefined})),azioni_esterne:s.query('SELECT * FROM os_azioni_esterne WHERE giro_id=? ORDER BY created_at',id)};}
 function ufficio(user){
  requireOwner(user);const mese=oggi().slice(0,7),statoMotore=mot().stato();
  const ultimi=new Map(),costiMese=new Map(),inCorso=new Map();
  for(const p of s.query("SELECT id,agente,giro_id,client_id,compito,stato,motore,output_json,errore,esito_qualita,costo_usd_micro,created_at,started_at,finished_at,CASE WHEN stato IN('al_lavoro','controllo_qualita') THEN substr(diretta,-700) END diretta_coda,diretta_fase,diretta_at FROM os_sciame_passi ORDER BY created_at DESC LIMIT 400")){
   const reg=agentiSciame[p.agente].registro;
   if(['al_lavoro','controllo_qualita'].includes(p.stato)&&!inCorso.has(reg))inCorso.set(reg,p);
   if(!ultimi.has(reg)&&!['in_coda','al_lavoro','controllo_qualita'].includes(p.stato))ultimi.set(reg,p);
   if(p.created_at.slice(0,7)===mese)costiMese.set(reg,(costiMese.get(reg)||0)+p.costo_usd_micro);
  }
  const jobs=new Map();for(const j of s.query('SELECT agent,status,created_at,finished_at,error,result FROM os_jobs ORDER BY created_at DESC LIMIT 300'))if(!jobs.has(j.agent))jobs.set(j.agent,j);
  const postazione=(id,nome)=>{
   const lavoro=inCorso.get(id),ultimo=ultimi.get(id),job=jobs.get(id);
   let stato='libero',compito=null,uscita=null;
   if(lavoro){stato='al_lavoro';compito=lavoro.stato==='controllo_qualita'?'Output in controllo Qualità · '+lavoro.compito:lavoro.compito;}
   else if(ultimo?.stato==='in_attesa_approvazione'){stato='in_attesa_approvazione';compito='In attesa dell’ok di un socio';}
   else if(ultimo?.stato==='errore'||ultimo?.stato==='bloccato_qualita'){stato='errore';compito=ultimo.errore||'Fermato da Qualità: output non approvabile';}
   else if(!ultimo&&job?.status==='running'){stato='al_lavoro';compito='Procedura DEMO locale in esecuzione';}
   else if(!ultimo&&job?.status==='failed'){stato='errore';compito=job.error;}
   if(ultimo){const o=parse(ultimo.output_json);uscita={passoId:ultimo.id,giroId:ultimo.giro_id,titolo:ultimo.compito,sintesi:o?.sintesi||o?.esito||null,quando:ultimo.finished_at||ultimo.created_at,motore:ultimo.motore,motoreEtichetta:ETICHETTE[ultimo.motore]||ultimo.motore,esitoQualita:ultimo.esito_qualita,costoUsdMicro:ultimo.costo_usd_micro};}
   else if(job){const r=parse(job.result);uscita={titolo:r?.title||'Procedura DEMO locale',sintesi:r?.summary||job.error||null,quando:job.finished_at||job.created_at,motore:'regole-demo',motoreEtichetta:'Procedura DEMO locale a regole (nessuna AI)',costoUsdMicro:0};}
   const diretta=lavoro?{passoId:lavoro.id,cliente:lavoro.client_id,inizio:lavoro.started_at||lavoro.created_at,fase:lavoro.diretta_fase||'in_attesa',testo:lavoro.diretta_coda||'',aggiornato:lavoro.diretta_at,motore:lavoro.motore}:null;
   return {id,nome,stato,compito,diretta,ultimoOutput:uscita,costoMeseUsdMicro:costiMese.get(id)||0,sciame:!!perRegistro[id]};
  };
  const stanze=[{id:'regia',nome:'Regia',agenti:[postazione('orchestrator','Orchestratore')]},...departments.map(d=>({id:d.id,nome:d.name,agenti:d.agents.map(a=>postazione(a,agentDefinitions.find(x=>x.id===a).name))}))];
  const feed=s.query("SELECT a.id,a.action,a.client_id,a.detail,a.visibility,a.created_at,u.name actor FROM os_audit a LEFT JOIN os_users u ON u.id=a.user_id ORDER BY a.created_at DESC,a.rowid DESC LIMIT 60").map(a=>({...a,detail:parse(a.detail)}));
  const giri=s.query('SELECT id,richiesta,motore,stato,origine,costo_usd_micro,created_at,started_at,finished_at FROM os_sciame_giri ORDER BY created_at DESC LIMIT 12');
  return {aggiornatoAlle:now(),motore:{id:mot().id,etichetta:mot().etichetta,...statoMotore},autoApprovazioneDemo:autoDemo(),pausa:s.getSetting('paused')==='true',budget:orchestrator.budget(),stanze,feed,giri,inCorso:s.query("SELECT id FROM os_sciame_giri WHERE stato IN('in_coda','in_corso')").map(g=>g.id),
   azioniBloccate:s.query("SELECT * FROM os_azioni_esterne ORDER BY created_at DESC LIMIT 30"),stati:STATI_PASSO,flussi:descrizioneFlussi};
 }
 function dettaglioPasso(user,id){requireOwner(user);const p=s.one('SELECT * FROM os_sciame_passi WHERE id=?',id);if(!p)throw new AppError('Passo non trovato.',404);return {...p,input:parse(p.input_json),output:parse(p.output_json),qualita:parse(p.qualita_json),motoreEtichetta:ETICHETTE[p.motore]||p.motore,approvazione:p.approvazione_id?s.one('SELECT * FROM os_approvals WHERE id=?',p.approvazione_id):null,azioni:s.query('SELECT * FROM os_azioni_esterne WHERE passo_id=?',id),input_json:undefined,output_json:undefined,qualita_json:undefined};}

 // ---------- Prove salvate nel repository (docs/demo-sciame) ----------
 function esportaProve(giroId,dir){
  const g=riepilogoGiro(giroId),cartella=resolve(dir,`${g.created_at.slice(0,10)}-giro-${g.id.slice(0,8)}`);mkdirSync(cartella,{recursive:true});
  writeFileSync(resolve(cartella,'giro.json'),JSON.stringify({formato:'bigant-sciame-giro/1',nota:'Esecuzione reale registrata. Dati di input DEMO inventati; nessuna azione esterna eseguita.',...g},null,1)+'\n');
  const md=[`# Giro dello sciame ${g.id.slice(0,8)}`,'',`- Richiesta: ${g.richiesta}`,`- Motore: **${ETICHETTE[g.motore]||g.motore}**`,`- Stato: ${g.stato} · inizio ${g.started_at} · fine ${g.finished_at}`,`- Costo dichiarato dal motore: ${(g.costo_usd_micro/1e6).toFixed(4)} USD (equivalente a listino)`,`- Flussi eseguiti: ${(g.piano?.eseguiti||[]).join(', ')}`,'','I dati di input sono DEMO inventati. Pubblicazioni, invii e modifiche di account sono rimasti bloccati dal codice (elenco in fondo).',''];
  for(const p of g.passi){md.push(`## ${p.ordine}. ${agentiSciame[p.agente].nome} · ${p.flusso}`,'',`Compito: ${p.compito}`,'',`Stato: ${STATI_PASSO[p.stato]||p.stato} · motore ${p.motore} · durata ${Math.round((p.durata_ms||0)/1000)} s · costo ${((p.costo_usd_micro||0)/1e6).toFixed(4)} USD${p.esito_qualita?` · esito Qualità: ${p.esito_qualita}`:''}${p.errore?` · errore: ${p.errore}`:''}`,'');if(p.output)md.push('```json',JSON.stringify(p.output,null,1),'```','');}
  md.push('## Azioni esterne bloccate','',...g.azioni_esterne.map(a=>`- ${AZIONI[a.tipo]||a.tipo}: ${a.descrizione}`),'');
  writeFileSync(resolve(cartella,'README.md'),md.join('\n'));return cartella;
 }
 function importaProve(dir){
  if(!existsSync(dir))return 0;let n=0;
  for(const voce of readdirSync(dir,{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>resolve(dir,d.name,'giro.json')).filter(existsSync)){
   const g=JSON.parse(readFileSync(voce,'utf8'));if(g.formato!=='bigant-sciame-giro/1'||s.one('SELECT id FROM os_sciame_giri WHERE id=?',g.id))continue;
   s.transaction(()=>{
    s.run('INSERT INTO os_sciame_giri(id,richiesta,flussi,motore,stato,piano,richiesto_da,origine,errore,costo_usd_micro,created_at,started_at,finished_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',g.id,g.richiesta,JSON.stringify(g.flussi||[]),g.motore,g.stato,JSON.stringify(g.piano||{}),g.richiesto_da,'registro salvato in docs/demo-sciame',g.errore,g.costo_usd_micro,g.created_at,g.started_at,g.finished_at);
    for(const p of g.passi){if(!s.one('SELECT id FROM os_clients WHERE id=?',p.client_id))continue;s.run('INSERT INTO os_sciame_passi(id,giro_id,ordine,flusso,agente,reparto,client_id,compito,stato,motore,visibilita,controlla_passo,input_json,output_json,qualita_json,esito_qualita,approvazione_id,durata_ms,costo_usd_micro,errore,created_at,started_at,finished_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',p.id,g.id,p.ordine,p.flusso,p.agente,p.reparto,p.client_id,p.compito,p.stato,p.motore,p.visibilita,p.controlla_passo,JSON.stringify(p.input||{}),p.output?JSON.stringify(p.output):null,p.qualita?JSON.stringify(p.qualita):null,p.esito_qualita,p.approvazione_id,p.durata_ms,p.costo_usd_micro,p.errore,p.created_at,p.started_at,p.finished_at);
     if(p.approvazione_id&&!s.one('SELECT id FROM os_approvals WHERE id=?',p.approvazione_id))s.run('INSERT OR IGNORE INTO os_approvals(id,client_id,kind,entity_id,version,title,body,status,requested_by,decision_by,decision_at,reason,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',p.approvazione_id,p.client_id,'sciame_output',p.id,1,`${agentiSciame[p.agente].nome} · ${text(p.output?.sintesi,120)}`,text(p.output?.sintesi,1500),p.stato==='in_attesa_approvazione'&&!g.azioni_esterne.some(a=>a.passo_id===p.id)?'pending':'approved','os-orchestrator','os-orchestrator',p.finished_at,'auto-approvato (DEMO)',p.created_at);}
    for(const a of g.azioni_esterne||[])if(s.one('SELECT id FROM os_clients WHERE id=?',a.client_id))s.run('INSERT OR IGNORE INTO os_azioni_esterne VALUES(?,?,?,?,?,?,?,?,?)',a.id,a.giro_id,a.passo_id,a.client_id,a.tipo,a.descrizione,a.stato,a.motivo,a.created_at);
    s.audit(robot(),'demo-bigant','Sciame · giro importato dal registro salvato',g.id,{motore:g.motore,stato:g.stato,passi:g.passi.length},'internal');
   });n++;
  }
  return n;
 }

 async function handle({method,path,body={},user}){
  requireOwner(user);
  if(method==='GET'&&path==='/ufficio')return {data:ufficio(user)};
  if(method==='GET'&&path==='/giri')return {data:s.query('SELECT * FROM os_sciame_giri ORDER BY created_at DESC LIMIT 50')};
  if(method==='POST'&&path==='/giri')return {data:avviaGiro(user,{richiesta:body.richiesta,flussi:body.flussi||null}),status:202};
  let m=path.match(/^\/giri\/([^/]+)$/);if(m&&method==='GET')return {data:riepilogoGiro(m[1])};
  m=path.match(/^\/passi\/([^/]+)$/);if(m&&method==='GET')return {data:dettaglioPasso(user,m[1])};
  m=path.match(/^\/azioni\/([^/]+)\/esegui$/);if(m&&method==='POST')return eseguiAzioneEsterna(user,m[1]);
  return null;
 }
 const flussi={crescita:flussoCrescita,marketing:flussoMarketing,commerciale:flussoCommerciale,social:flussoSocial,local:flussoLocal,amministrazione:flussoAmministrazione,upsell:flussoUpsell};
 function chiudiGiro(id){const passi=s.query('SELECT stato,costo_usd_micro FROM os_sciame_passi WHERE giro_id=?',id);s.run('UPDATE os_sciame_giri SET stato=?,costo_usd_micro=?,started_at=COALESCE(started_at,created_at),finished_at=? WHERE id=?',passi.some(p=>p.stato==='errore')?'completato_con_errori':'completato',passi.reduce((n,p)=>n+p.costo_usd_micro,0),now(),id);return riepilogoGiro(id);}
 return {flussi,chiudiGiro,handle,creaGiro,eseguiGiro,avviaGiro,decide,ufficio,riepilogoGiro,dettaglioPasso,esportaProve,importaProve,eseguiAzioneEsterna,
  get motore(){return mot();},usaMotore(m){motoreCorrente=m;},attesa:()=>Promise.all(attivi.values())};
}
