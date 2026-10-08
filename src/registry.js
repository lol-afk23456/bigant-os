export const services = [
  ['presence','Presenza online e reputazione','local','GBP, directory autorizzate, recensioni','Da attivare','Google Business Profile'],
  ['multisite','Presenza multisede','local','Sedi, coerenza anagrafica, segnalazioni','Da attivare','Google Business Profile'],
  ['reception','Centralino AI','production','Chiamate, consensi, riepiloghi','Partner da valutare','Partner telefonia'],
  ['website','Siti web','production','Brief, pagine, collaudo, manutenzione','Metodo disponibile','CMS'],
  ['accessibility','Accessibilità digitale','quality','Audit, correzioni, test manuali','Da attivare','Strumenti W3C'],
  ['seo','SEO e contenuti','production','Audit, priorità, testi, misure','Metodo disponibile','GA4 e Search Console'],
  ['ecommerce','E-commerce','production','Catalogo, ordini, resi e collaudo','Da attivare','Piattaforma e-commerce'],
  ['social-commerce','Social commerce','production','Catalogo collegato e percorso di acquisto','Da attivare','Meta'],
  ['booking','Prenotazioni','account','Disponibilità, appuntamenti, conferme','Simulazione locale','Google Calendar'],
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
  ['local','Google Business Profile','local','Scheda, aggiornamenti, recensioni e report','Metodo disponibile','Google Business Profile']
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
  ...['video','ads','seo','website','ecommerce','booking','reception','local','reputation'].map(id=>[id,({ads:'Specialista ADV',seo:'SEO e sito',local:'Google Business Profile',reputation:'Reputazione',video:'Produzione video',website:'Siti web',ecommerce:'E-commerce',booking:'Prenotazioni',reception:'Centralino AI'})[id],['local','reputation'].includes(id)?'local':'production','SOP e spazio pronti; connettore da attivare','planned'])
].map(([id,name,department,purpose,status])=>({id,name,department,purpose,status,mode:'Regole locali DEMO',costCents:0,source:'Playbook BigAnt',runsOn:'Processo OS: locale nel prototipo, server dopo approvazione',failure:'Tre tentativi per attività idempotenti; poi verifica dei soci',reads:department==='administration'?['admin']:['master','dna','feedback','strategy','report']}));
export const integrations=[
  ['google-ads','Google Ads','Report e campagne','Lettura iniziale'],['meta','Meta Ads e social','Campagne e contenuti','Lettura iniziale'],['ga4','Google Analytics','Traffico e conversioni','Lettura'],['gsc','Search Console','Ricerca e salute del sito','Lettura'],['gbp','Google Business Profile','Scheda e recensioni','Lettura iniziale'],['postiz','Postiz','Programmazione contenuti','Approvazione prima di pubblicare'],['gmail','Gmail','Conversazioni commerciali','Approvazione prima degli invii'],['calendar','Google Calendar','Disponibilità e appuntamenti','Lettura, scrittura approvata'],['sheets','Prima Nota e Tracker','Migrazione e riconciliazione','Sola lettura iniziale'],['drive','Google Drive','Documenti e riferimenti','Per cartella autorizzata'],['trello','Trello','Task e assegnazioni','Sola lettura iniziale'],['openai','OpenAI','Analisi e bozze','Budget e permessi minimi'],['brave','Brave Search','Ricerca commerciale','Ricerca autorizzata'],['wallet','Apple e Google Wallet','Carte e aggiornamenti','Certificati e approvazione'],['ped','PED BigAnt','Calendario e approvazioni','API e sorgente da verificare'],['invoicing','Fatturazione elettronica','Bozze fatture','Software da identificare'],['notifications','Notifiche ai soci','Avvisi di blocco','Canale da autorizzare']
].map(([id,name,purpose,permission])=>({id,name,purpose,permission,status:'Non collegato',lastSync:null}));
export const managementModules=['Anagrafiche','Contratti e preventivi','Fatturazione e incassi','Scadenziario','Prima nota e cassa','Costi e abbonamenti','Ore e marginalità','Task e consegne','Documenti e autorizzazioni','Direzione','Compensi e prelievi','Quadratura e anomalie'];
