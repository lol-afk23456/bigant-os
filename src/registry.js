import {managementBlueprints} from './agency/management.js';
import {agentServices} from './agents/catalog.js';
export const services = [
  ['presence','Presenza online e reputazione','local','GBP, directory autorizzate, recensioni','Da attivare','Google Business Profile'],
  ['multisite','Presenza multisede','local','Sedi, coerenza anagrafica, segnalazioni','Da attivare','Google Business Profile'],
  ['reception','Centralino AI','production','Chiamate, consensi, riepiloghi','Partner da valutare','Partner telefonia'],
  ['website','Siti web','production','Brief, pagine, collaudo, manutenzione','Metodo disponibile','CMS'],
  ['accessibility','Accessibilità digitale','quality','Audit, correzioni, test manuali','Da attivare','Strumenti W3C'],
  ['seo','SEO e contenuti','production','Audit, priorità, testi, misure','Metodo disponibile','GA4 e Search Console'],
  ['ecommerce','E-commerce','production','Catalogo, ordini, resi e collaudo','Da attivare','Piattaforma e-commerce'],
  ['social-commerce','Social commerce','production','Catalogo collegato e percorso di acquisto','Da attivare','Meta'],
  ['booking','Prenotazioni','account','Disponibilità, appuntamenti, conferme','Attivazione con prova e approvazione','Google Calendar'],
  ['ads','Pubblicità online','production','Brief, mappa leve, creatività, report','Metodo disponibile','Google Ads e Meta Ads'],
  ['display','Display e programmatic','production','Pianificazione tramite partner','Partner da valutare','Partner pubblicitario'],
  ['social','Social media','production','DNA, calendario, bozze, approvazioni','Flusso locale','Postiz'],
  ['video','Foto, video e drone','production','Brief, storyboard, produzione e revisioni','Metodo disponibile','Adobe, Runway e Artlist'],
  ['marketplace','Marketplace servizi casa','production','Rete proprietaria: non replicabile','Escluso','Nessuna'],
  ['tv','TV, cinema e DOOH','production','Spot e pianificazione con partner','Partner da valutare','Partner media'],
  ['merch','Abbigliamento e gadget','production','Preventivo fornitore e verifica margine','Solo su richiesta','Fornitori'],
  ['apple-leasing','Noleggio Apple','production','Non pertinente alla piattaforma','Escluso','Nessuna'],
  ['verticals','Pacchetti verticali','direction','Perimetro servizi, capacità, margine','Da attivare','Servizi del pacchetto'],
  ['audit','Analisi gratuita presenza online','sales','Rilievi con fonti e proposta','Simulazione locale','Ricerca e siti ufficiali'],
  ['branding','Brand e direzione creativa','production','Posizionamento, identità, linee guida','Metodo disponibile','Figma, Canva e Adobe'],
  ['growth','Growth e ricerca clienti','sales','Ricerca, CRM, proposte, conversazioni e appuntamenti','Modulo locale','Brave, OpenAI, Gmail e Calendar'],
  ['fidelity','Fidelity','account','Carte, timbri, punti, premi e campagne','Modulo locale','Apple e Google Wallet'],
  ['local','Google Business Profile','local','Scheda, aggiornamenti, recensioni e report','Metodo disponibile','Google Business Profile'],
  ['events','Gestione eventi','production','Programma, fornitori, responsabilità e rendiconto','Da attivare','Partner e calendario'],
  ['drone','Riprese con drone','production','Brief, piano riprese, autorizzazioni e montaggio','Da attivare','Operatore e strumenti video'],
  ['video-ai','Video AI','production','SOP master, brand, storyboard e log feedback','Da attivare','Runway e Artlist'],
  ['creative-direction','Direzione creativa','production','Concept, coerenza visiva e revisione dei materiali','Da attivare','Figma, Canva e Adobe']
].map(([id,name,department,deliverables,status,integration],index)=>({id,name,department,deliverables,status,integration,catalogue:index<19?index+1:null,sop:'docs/PLAYBOOK.md',data:['client_id','source','version','approval','cost'],activation:'SOP validata, responsabile, margine, fonte autorizzata e test sul pilota',implemented:['social','growth','fidelity','booking','audit'].includes(id)}));
export const departments=[
  {id:'direction',name:'Direzione e crescita',agents:['director'],trigger:'Venerdì · massimo tre priorità',visibility:'aggregates'},
  {id:'marketing',name:'Marketing BigAnt',agents:['marketing'],trigger:'Lunedì e obiettivo aggiornato',visibility:'internal'},
  {id:'sales',name:'Commerciale',agents:['research','analyst','commercial'],trigger:'Nuovo lead e ricerca pianificata',visibility:'internal'},
  {id:'account',name:'Account e fidelizzazione',agents:['account','reporter'],trigger:'Nuovo contratto, scadenze, primo del mese',visibility:'internal'},
  {id:'production',name:'Produzione',agents:['social','video','ads','seo','website','ecommerce','booking','reception'],trigger:'Brief approvato o attività assegnata',visibility:'client-scoped'},
  {id:'local',name:'Local e reputazione',agents:['local','reputation'],trigger:'Controllo giornaliero e nuova recensione',visibility:'client-scoped'},
  {id:'quality',name:'Qualità e compliance',agents:['quality'],trigger:'Bozza pronta',visibility:'client-scoped'},
  {id:'administration',name:'Amministrazione',agents:['administration'],trigger:'Ogni giorno e fine mese',visibility:'admin'}
];
export const agentDefinitions=[
  ['director','Direttore Crescita','direction','Valuta segnali e propone massimo tre priorità','implemented'],
  ['marketing','Marketing BigAnt','marketing','Prepara la prossima azione del cliente zero','implemented'],
  ['account','Account e rinnovi','account','Controlla lavori e attività in scadenza','implemented'],
  ['social','Specialista social','production','Prepara una bozza seguendo memoria e feedback','implemented'],
  ['quality','Qualità e compliance','quality','Controlla fonti, demo e approvazioni','implemented'],
  ['reporter','Reporter','account','Riepiloga soltanto dati presenti e fonti scollegate','implemented'],
  ['administration','Controllo amministrativo','administration','Segnala anomalie senza correggere i movimenti','implemented'],
  ['research','Ricerca commerciale','sales','Ricerca fixture Growth','module'],
  ['analyst','Analista commerciale','sales','Analisi fixture Growth','module'],
  ['commercial','Commerciale','sales','Bozze, proposte e follow-up Growth','module'],
  ...['video','ads','seo','website','ecommerce','booking','reception','local','reputation'].map(id=>[id,({ads:'Specialista ADV',seo:'SEO e sito',local:'Google Business Profile',reputation:'Reputazione',video:'Produzione video',website:'Siti web',ecommerce:'E-commerce',booking:'Prenotazioni',reception:'Centralino AI'})[id],['local','reputation'].includes(id)?'local':'production','SOP da validare sul pilota; specialista da implementare','planned']),
  ['multisite','Specialista multisede','local','Confronta sedi, anagrafiche e anomalie','planned'],
  ['accessibility','Specialista accessibilità','quality','Prepara audit e correzioni, da verificare anche manualmente','planned'],
  ['social-commerce','Specialista social commerce','production','Coordina catalogo social e percorso di acquisto','planned'],
  ['display','Specialista display e partner','production','Prepara piano media, partner e controlli risultati','planned'],
  ['tv','Specialista TV, cinema e DOOH','production','Coordina spot, diritti e piano del partner','planned'],
  ['merch','Produzione merchandising','production','Prepara specifiche, preventivo fornitore e campione','planned'],
  ['verticals','Pacchetti e partnership','direction','Prepara perimetro, capacità e decisioni sui pacchetti','planned'],
  ['branding','Specialista branding','production','Traduce posizionamento e brief in identità visiva','planned'],
  ['events','Coordinatore eventi','production','Coordina programma, consegne, fornitori e responsabili','planned'],
  ['drone','Produzione drone','production','Prepara piano riprese e verifiche dell’operatore qualificato','planned'],
  ['video-ai','Specialista Video AI','production','Segue SOP, brand cliente e feedback, con controllo diritti','planned'],
  ['creative-direction','Direttore creativo','production','Verifica concept e coerenza visiva del lavoro','planned'],
  ['fidelity','Specialista Fidelity','account','Prepara campagne DEMO e controlli delle tessere nel modulo comune','module']
].map(([id,name,department,purpose])=>({id,name,department,purpose:purpose.includes('da implementare')?'Esegue una procedura specialistica DEMO con fonti e approvazione':purpose,status:Object.hasOwn(agentServices,id)?'implemented':'planned',mode:'Procedura DEMO offline · nessun modello AI collegato',costCents:0,source:'SOP versionata BigAnt',runsOn:'Processo OS locale; cloud non attivo',failure:'Tre tentativi idempotenti; errori e prerequisiti visibili; nessuna uscita esterna',reads:department==='administration'?['admin']:['master','dna','feedback','strategy','report']}));
// Un solo elenco autorevole degli specialisti: i reparti non possono perderne uno.
for(const department of departments)department.agents=agentDefinitions.filter(a=>a.department===department.id).map(a=>a.id);
export const integrations=[
  ['google-ads','Google Ads','Report e campagne','Lettura iniziale'],['meta','Meta Ads e social','Campagne e contenuti','Lettura iniziale'],['ga4','Google Analytics','Traffico e conversioni','Lettura'],['gsc','Search Console','Ricerca e salute del sito','Lettura'],['gbp','Google Business Profile','Scheda e recensioni','Lettura iniziale'],['postiz','Postiz','Programmazione contenuti','Approvazione prima di pubblicare'],['gmail','Gmail','Conversazioni commerciali','Approvazione prima degli invii'],['calendar','Google Calendar','Disponibilità e appuntamenti','Lettura, scrittura approvata'],['sheets','Prima Nota e Tracker','Migrazione e riconciliazione','Sola lettura iniziale'],['drive','Google Drive','Documenti e riferimenti','Per cartella autorizzata'],['trello','Trello','Task e assegnazioni','Sola lettura iniziale'],['openai','OpenAI','Analisi e bozze','Budget e permessi minimi'],['brave','Brave Search','Ricerca commerciale','Ricerca autorizzata'],['wallet','Apple e Google Wallet','Carte e aggiornamenti','Certificati e approvazione'],['ped','PED BigAnt','Calendario e approvazioni','API e sorgente da verificare'],['invoicing','Fatturazione elettronica','Bozze fatture','Software da identificare'],['notifications','Notifiche ai soci','Avvisi di blocco','Canale da autorizzare']
].map(([id,name,purpose,permission])=>({id,name,purpose,permission,status:'Non collegato',lastSync:null,...(id==='wallet'?{sop:'docs/SOP-GOOGLE-WALLET.md'}:{})}));
export const managementModules=managementBlueprints.map(m=>m.name);
