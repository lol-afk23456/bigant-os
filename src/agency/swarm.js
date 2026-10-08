import {agentDefinitions,departments} from '../registry.js';
import {agentServices,agencyOnlyAgents,eventDefinitions} from '../agents/catalog.js';
import {serviceBlueprints} from './services.js';
const departmentTriggers={direction:['weekly-friday','objective.changed'],marketing:['weekly-monday','objective.changed'],sales:['lead.created','daily'],account:['contract.signed','client.created','monthly'],production:['brief.approved','content.approved'],local:['daily','review.created'],quality:['content.ready'],administration:['daily','monthly']};
const calendars={'daily':'Ogni giorno alle 09:00','weekly-monday':'Lunedì alle 09:00','weekly-friday':'Venerdì alle 09:00','monthly':'Primo del mese alle 09:00'};
export const triggerDefinitions=[...Object.entries(calendars).map(([id,name])=>({id,name,kind:'calendar',implemented:true,simulation:true,timezone:'Europe/Rome',enabledByDefault:false})),...eventDefinitions.map(event=>({...event,kind:'event',enabledByDefault:false,externalSourceConnected:false}))];
const coreAgents=new Set(['director','marketing','account','social','quality','reporter','administration']);
const moduleAgents=new Set(['research','analyst','commercial','fidelity']);
const procedureOutputs={
 director:['Massimo tre priorità motivate','Aggregati DEMO e dati mancanti per le decisioni'],
 marketing:['Dodici proposte editoriali datate','Piano di 90 giorni da validare'],
 account:['Controllo onboarding, ritardi e carico','Azioni per memorie, rinnovi e autorizzazioni mancanti'],
 social:['Bozza social nella produzione comune','Approvazione della versione e feedback'],
 quality:['Rilievi su fonti, formulazioni e approvazioni','Richieste di verifica umana, senza certificazione'],
 reporter:['Report operativo dai dati registrati','Report salvato nella memoria versionata'],
 administration:['Anomalie dal motore amministrativo','Decisioni riservate ai soci; nessuna correzione automatica'],
 research:['Lead DEMO deduplicati nel CRM comune','Analisi locali con punteggio e fonti inventate dichiarate'],
 analyst:['Analisi e punteggio aggiornati sul lead DEMO','Fatti di fixture e ipotesi distinti'],
 commercial:['Bozza nel modulo Growth e approvazione comune','Controllo prerequisiti quando manca autorizzazione'],
 fidelity:['Campagna locale per iscritti già opt-in','Approvazione comune o controllo dei prerequisiti'],
 video:['Storyboard con tempi e scene','Piano riprese e montaggio da approvare'],
 ads:['Mappa leve in undici sezioni','Angoli creativi e metriche calcolate solo dai dati forniti'],
 seo:['Rilievi sulle pagine fornite','Priorità tecniche e piano intenti senza crawl'],
 website:['Sitemap, wireframe e copy iniziale','Casi di collaudo form, senza sito pubblicato'],
 ecommerce:['Controllo catalogo e scorte DEMO','Totale ordine dimostrativo quando i dati sono completi'],
 booking:['Conflitti per risorsa e slot proponibili','Richieste da verificare, nessun invito'],
 reception:['Risposte da FAQ dichiarate approvate','Instradamento dei casi all’operatore umano'],
 local:['Confronto anagrafiche e orari forniti','Correzioni proposte e bozza GBP'],
 reputation:['Bozze di risposta alle recensioni DEMO','Priorità e revisione umana dei casi sensibili'],
 multisite:['Confronto sede per sede','Duplicati e fonti senza sede da verificare'],
 accessibility:['Rilievi sui controlli e materiali forniti','Piano di verifica manuale, nessuna conformità certificata'],
 'social-commerce':['Confronto catalogo e feed DEMO','Scarti di prezzo/scorte e copy prodotto'],
 display:['Piano placement ammessi','Allocazione del budget fornito senza acquisto spazi'],
 tv:['Confronto preventivi DEMO e formati','Difformità dello spot e doppio gate umano'],
 merch:['Distinta e costi del lotto DEMO','Margine solo da valori completi, nessun ordine'],
 verticals:['Matrice bisogni, servizi e capacità dichiarate','Perimetro pacchetto e dipendenze mancanti'],
 branding:['Tre concept verbali motivati','Regole degli asset da validare, nessun logo generato'],
 events:['Cronoprogramma relativo alla data','Responsabilità e scadenze scoperte'],
 drone:['Brief e shot list da valutare','Documenti mancanti da verificare con operatore qualificato'],
 'video-ai':['Pre-task e prompt per scena','Registro iterazioni proposto, nessun video generato'],
 'creative-direction':['Brief e confronto testuale dei concept','Criteri e materiali mancanti per la decisione umana']
};
const missingByAgent={
 director:'Fonti di mercato e KPI reali scollegati; costi partner, capacità e roadmap commerciale da validare dai soci.',
 marketing:'DNA e strategia definitivi, autorizzazioni portfolio, obiettivi numerici e misure reali dei canali da completare.',
 account:'Il controllo produce checklist; contratti, rinnovi, autorizzazioni portfolio e onboarding reale richiedono registrazione e decisione umana.',
 quality:'Controlli creativi, privacy e pubblicità sanitaria richiedono checklist e revisione qualificata.',
 administration:'Restano le regole contabili mancanti, documenti, fiscalità confermata e fonti collegate.',
 reporter:'Metriche marketing e fonti reali scollegate; il riepilogo locale non prova risultati commerciali.',
 research:'Ricerca web reale scollegata; le aziende e le analisi prodotte sono fixture DEMO, non lead utilizzabili per invii.',
 analyst:'Analisi deterministica di fonti .example; audit web reale e verifica umana delle evidenze da attivare.',
 commercial:'Servono contatti DEMO già autorizzati; nessun consenso viene inventato. Gmail e modelli AI non collegati.',
 fidelity:'Servono programmi e iscritti opt-in già presenti. Provider Wallet e invii restano scollegati.'
};
export const agentContracts=agentDefinitions.map(a=>{
 const related=serviceBlueprints.filter(s=>s.agents.includes(a.id));
 const family=coreAgents.has(a.id)?'core':moduleAgents.has(a.id)?'modules':'specialists';
 const sopFile={core:'docs/SOP-REGIA-DEMO.md',modules:'docs/SOP-AGENTI-MODULI.md',specialists:'docs/SOP-SPECIALISTI-DEMO.md'}[family];
 return {...a,services:related.map(s=>s.id),sop:{file:sopFile,version:family==='specialists'?'1.0.0':'1',validated:false,validation:'Procedura collaudata su dati DEMO; validazione umana del pilota da completare'},
  execution:{implemented:a.status==='implemented',file:`src/agents/${family}.js`,mode:'DEMO offline · regole deterministiche, nessun modello AI collegato',requiredServices:agentServices[a.id],agencyOnly:agencyOnlyAgents.includes(a.id),provesServiceDelivery:false,prerequisites:'Cliente attivo, permessi e servizio verificati; fonti/input di prova, pausa e budget rispettati. I dati mancanti restano dichiarati.'},
  triggers:(departmentTriggers[a.department]||[]).map(id=>{const trigger=triggerDefinitions.find(t=>t.id===id);return {...trigger,execution:'Configurabile per la procedura DEMO locale; calendario o evento richiedono una regola esplicitamente attivata nella regia'};}),
  inputs:['Cliente e servizi autorizzati','SOP e fonti con versione',...(related.flatMap(s=>s.inputs).slice(0,8))],
  outputs:procedureOutputs[a.id],
  reads:a.department==='administration'?['Dati amministrativi riservati','Memoria autorizzata del cliente']:family==='modules'?[a.id==='fidelity'?'Programmi, iscritti e consensi Fidelity del cliente':'Impostazioni Growth, lead e messaggi del workspace','Approvazioni del modulo']:['Scheda master','DNA','Strategia','Report','Feedback comune e specifico dell’agente','Task e contenuti del cliente'],
  memory:{scope:'Un client_id per esecuzione',storage:'os_memory, os_memory_versions e os_agent_outputs con storico versioni',history:'Versioni, fonti e fotografia degli input conservate; revisione e rifiuto producono feedback',excluded:['04_ACCESSI','Credenziali',...(a.department==='administration'?[]:['Movimenti e documenti contabili grezzi'])],missing:family==='modules'?'Gli adapter leggono il dominio comune del modulo; l’interpretazione semantica della memoria e i modelli AI restano scollegati.':'Calendario/cruscotto/decisioni non sono ancora tutti tipi di memoria editabili; il contesto disponibile viene fotografato nell’output.'},
  permissions:{administration:a.department==='administration',economicAggregates:a.id==='director'?'Aggregati DEMO dal modulo Amministrazione, senza accesso ai movimenti grezzi':'Nessuno',externalActions:false},
  gate:'Analisi e bozza interne; socio prima di pubblicare, spendere, modificare account, inviare o assumere. Per il cliente, approvatore definito per servizio.',
  activity:{storage:'os_audit',fields:['agente','cliente','data','azione','output','fonte','costo','esito']},
  budget:{capCents:5000,costCents:0,reservation:'Tetto unico os_costs, con prenotazione prima del lavoro',activation:'Le procedure locali costano zero API; nessun costo o fornitore reale attivato'},
  missing:missingByAgent[a.id]||'Esegue una procedura locale di preparazione o controllo, non l’intero servizio: esecuzione materiale, partner, fonti reali e approvazioni del pilota restano da completare.',
  acceptance:['Input e fonte presenti','Perimetro cliente/servizio verificato','Output e versione registrati','Gate e rifiuto con feedback','Costo e pausa comuni','Retry idempotente oppure esito incerto bloccato']
 };
});
export const departmentContracts=departments.map(d=>({...d,owner:d.id==='administration'?'Soci BigAnt':'Responsabile di reparto da confermare nel pilota',
 status:'Procedure DEMO eseguibili; servizi reali da completare e validare',triggers:departmentTriggers[d.id].map(id=>triggerDefinitions.find(t=>t.id===id)),
 units:serviceBlueprints.filter(s=>s.department===d.id&&!s.excluded).map(s=>({id:s.id,name:s.name,agents:s.agents,status:s.status})),
 approval:'Soci per BigAnt; accordo di servizio per il cliente',memory:'Memoria comune per cliente, con visibilità e versione',
 runsOn:'Solo processo locale nella DEMO',cost:'Zero API nella DEMO; attivazioni future entro il tetto comune di 50 €',
 failure:'Esito e motivo nella regia. Nessun successo simulato per un provider scollegato.'
}));
export const orchestratorContract={id:'orchestrator',name:'Orchestratore BigAnt',status:'Procedura DEMO locale',
 purpose:'Coordina 32 procedure DEMO, quattro calendari e otto eventi locali sullo stesso archivio; non realizza autonomamente i servizi esterni.',
 cycle:['Legge contesto autorizzato','Accoda e deduplica','Prenota il costo','Esegue la procedura disponibile','Registra output e fonti','Richiede approvazione dove prevista','Conserva esito o errore'],
 runsOn:'Un processo locale; si ferma quando il processo è spento',
 externalActions:false,capCents:5000,queue:'Persistente, lease e massimo tre tentativi per job centrali',
 memory:'Cliente, master, DNA, strategia, feedback e report autorizzati; mai 04_ACCESSI',
 approvals:'Coda comune, autore, data, versione e motivo; revisione rende obsoleta la decisione precedente',
 failure:'Errore nella regia, retry limitato o riconciliazione; notifiche esterne scollegate',
 future:'Cloud, modelli AI, connettori ed eventi dai canali reali richiedono implementazione, collaudo e autorizzazione separati. Il pilota operativo dell’agenzia resta da validare.'
};
