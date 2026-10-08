import {agentDefinitions,departments} from '../registry.js';
import {serviceBlueprints} from './services.js';
const eventNames={
 'lead.created':'Nuovo lead','client.created':'Nuova anagrafica cliente','content.ready':'Bozza da verificare',
 'review.created':'Nuova recensione','content.approved':'Contenuto approvato','contract.signed':'Contratto firmato','objective.changed':'Obiettivo aggiornato','brief.approved':'Brief approvato'
};
const departmentTriggers={direction:['weekly-friday','objective.changed'],marketing:['weekly-monday','objective.changed'],sales:['lead.created','daily'],account:['contract.signed','client.created','monthly'],production:['brief.approved','content.approved'],local:['daily','review.created'],quality:['content.ready'],administration:['daily','monthly']};
const calendars={'daily':'Ogni giorno alle 09:00','weekly-monday':'Lunedì alle 09:00','weekly-friday':'Venerdì alle 09:00','monthly':'Primo del mese alle 09:00'};
export const triggerDefinitions=[...Object.entries(calendars).map(([id,name])=>({id,name,kind:'calendar',implemented:true,timezone:'Europe/Rome',enabledByDefault:false})),...Object.entries(eventNames).map(([id,name])=>({id,name,kind:'event',implemented:['lead.created','client.created','content.ready'].includes(id),enabledByDefault:false}))];
const missingByAgent={
 director:'Analisi di mercato, KPI economici aggregati, roadmap viva e scelte motivate ancora da implementare.',
 marketing:'DNA e strategia compilati, calendari completi e misure dei canali ancora da costruire.',
 account:'Onboarding, salute cliente strutturata, rinnovi e autorizzazioni portfolio ancora da completare.',
 quality:'Controlli creativi, privacy e pubblicità sanitaria richiedono checklist e revisione qualificata.',
 administration:'Restano le regole contabili mancanti, documenti, fiscalità confermata e fonti collegate.',
 reporter:'Mancano metriche marketing, serie storiche e report mensili completi.'
};
export const agentContracts=agentDefinitions.map(a=>{
 const related=serviceBlueprints.filter(s=>s.agents.includes(a.id));
 return {...a,services:related.map(s=>s.id),sop:{file:'docs/PLAYBOOK.md',version:'Iniziale da validare',validated:false},
  triggers:(departmentTriggers[a.department]||[]).map(id=>{const trigger=triggerDefinitions.find(t=>t.id===id);return {...trigger,execution:!trigger.implemented?'Solo struttura: questo evento non è ancora implementato':a.status==='implemented'?'Configurabile per la procedura DEMO; pianificazioni effettive nella regia':'Solo contratto; questo specialista non è attivabile dalla coda centrale'};}),
  inputs:['Cliente e servizi autorizzati','SOP e fonti con versione',...(related.flatMap(s=>s.inputs).slice(0,8))],
  outputs:related.length?[...new Set(related.flatMap(s=>s.outputs))]:['Riepilogo con fonti','Azioni proposte','Decisioni da approvare'],
  reads:a.department==='administration'?['Dati amministrativi riservati','Memoria autorizzata del cliente']:['Scheda master','DNA','Strategia','Calendario','Cruscotto','Decisioni','Feedback'],
  memory:{scope:'Un client_id per esecuzione',storage:'os_memory e os_memory_versions',history:'Versioni e fonti immutabili',excluded:['04_ACCESSI','Credenziali',...(a.department==='administration'?[]:['Movimenti e documenti contabili grezzi'])],missing:'Calendario/cruscotto/decisioni non sono ancora tutti tipi di memoria editabili; le fonti esistenti sono nel database comune.'},
  permissions:{administration:a.department==='administration',economicAggregates:a.id==='director'?'Contratto previsto; aggregati economici non ancora forniti':'Nessuno',externalActions:false},
  gate:'Analisi e bozza interne; socio prima di pubblicare, spendere, modificare account, inviare o assumere. Per il cliente, approvatore definito per servizio.',
  activity:{storage:'os_audit',fields:['agente','cliente','data','azione','output','fonte','costo','esito']},
  budget:{capCents:5000,reservation:'Tetto unico os_costs, con prenotazione prima del lavoro',activation:'Nessun costo autorizzato da questa scheda'},
  missing:missingByAgent[a.id]||(a.status==='planned'?'Specialista, dati e test di dominio da implementare.':a.status==='module'?'Provider reali e parti mancanti della migrazione; consultare la matrice funzione per funzione.':'Bozza locale deterministica; flusso specialistico completo e fonti esterne mancanti.'),
  acceptance:['Input e fonte presenti','Perimetro cliente/servizio verificato','Output e versione registrati','Gate e rifiuto con feedback','Costo e pausa comuni','Retry idempotente oppure esito incerto bloccato']
 };
});
export const departmentContracts=departments.map(d=>({...d,owner:d.id==='administration'?'Soci BigAnt':'Responsabile di reparto da confermare nel pilota',
 status:'Struttura completa; operatività parziale',triggers:departmentTriggers[d.id].map(id=>triggerDefinitions.find(t=>t.id===id)),
 units:serviceBlueprints.filter(s=>s.department===d.id&&!s.excluded).map(s=>({id:s.id,name:s.name,agents:s.agents,status:s.status})),
 approval:'Soci per BigAnt; accordo di servizio per il cliente',memory:'Memoria comune per cliente, con visibilità e versione',
 runsOn:'Solo processo locale nella DEMO',cost:'Zero API nella DEMO; attivazioni future entro il tetto comune di 50 €',
 failure:'Esito e motivo nella regia. Nessun successo simulato per un provider scollegato.'
}));
export const orchestratorContract={id:'orchestrator',name:'Orchestratore BigAnt',status:'Procedura DEMO locale',
 purpose:'Coordina specialisti e code dei moduli sullo stesso archivio; la pianificazione strategica completa è ancora da costruire.',
 cycle:['Legge contesto autorizzato','Accoda e deduplica','Prenota il costo','Esegue la procedura disponibile','Registra output e fonti','Richiede approvazione dove prevista','Conserva esito o errore'],
 runsOn:'Un processo locale; si ferma quando il processo è spento',
 externalActions:false,capCents:5000,queue:'Persistente, lease e massimo tre tentativi per job centrali',
 memory:'Cliente, master, DNA, strategia, feedback e report autorizzati; mai 04_ACCESSI',
 approvals:'Coda comune, autore, data, versione e motivo; revisione rende obsoleta la decisione precedente',
 failure:'Errore nella regia, retry limitato o riconciliazione; notifiche esterne scollegate',
 future:'Cloud, planning/delega evoluti, nuovi eventi e specialisti richiedono implementazione, collaudo e autorizzazione separati.'
};
