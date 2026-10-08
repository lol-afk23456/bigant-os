// Agenti dello sciame con motore AI. "registro" collega ogni agente alla scheda dell'organigramma
// (src/registry.js); le istruzioni stanno in .claude/agents/bigant-<id>.md.
export const agentiSciame={
 orchestratore:{registro:'orchestrator',reparto:'regia',nome:'Orchestratore'},
 'direttore-crescita':{registro:'director',reparto:'direction',nome:'Direttore Crescita'},
 marketing:{registro:'marketing',reparto:'marketing',nome:'Marketing BigAnt'},
 'ricerca-clienti':{registro:'research',reparto:'sales',nome:'Ricerca clienti'},
 'analisi-gratuita':{registro:'analyst',reparto:'sales',nome:'Analisi gratuita S17'},
 'proposta-commerciale':{registro:'commercial',reparto:'sales',nome:'Proposta commerciale'},
 social:{registro:'social',reparto:'production',nome:'Produzione social S01'},
 'local-gbp':{registro:'local',reparto:'local',nome:'Local SEO e GBP S06'},
 reputazione:{registro:'reputation',reparto:'local',nome:'Reputazione e recensioni S08'},
 qualita:{registro:'quality',reparto:'quality',nome:'Qualità e compliance'},
 amministrazione:{registro:'administration',reparto:'administration',nome:'Amministrazione'}
};
export const perRegistro=Object.fromEntries(Object.entries(agentiSciame).map(([id,a])=>[a.registro,id]));

export const descrizioneFlussi=[
 {id:'crescita',reparto:'Direzione e crescita',cosa_fa:'Il Direttore Crescita legge i KPI aggregati e propone tre priorità ai soci.',cliente:'demo-bigant'},
 {id:'marketing',reparto:'Marketing BigAnt',cosa_fa:'Piano editoriale della prossima settimana e bozze dei post per i canali BigAnt.',cliente:'demo-bigant'},
 {id:'commerciale',reparto:'Commerciale',cosa_fa:'Ricerca clienti DEMO, analisi gratuita S17 del lead scelto e bozza di proposta del pacchetto Presenza.',cliente:'demo-bigant'},
 {id:'social',reparto:'Produzione',cosa_fa:'Produzione social S01: piano mensile e post per Bottega Aurora DEMO.',cliente:'demo-bottega'},
 {id:'local',reparto:'Local e reputazione',cosa_fa:'Controllo della scheda Google (S06), post GBP e risposte alle recensioni (S08) per Bottega Aurora DEMO.',cliente:'demo-bottega'},
 {id:'amministrazione',reparto:'Amministrazione',cosa_fa:'Prima nota DEMO del mese e controllo “cosa non torna”, con correzioni solo proposte.',cliente:'demo-bigant'}
];

// Stato dei servizi del Playbook (docs/playbook/00_INDICE-PLAYBOOK.md), letto dal Direttore Crescita.
export const statoServiziPlaybook=[
 ['S01','Social media management','ATTIVO'],['S02','Produzione foto, video e drone','ATTIVO (punto di forza)'],['S03','Google Ads','ATTIVO — metodo già scritto'],['S04','Meta Ads e altri social a pagamento','ATTIVO (Meta) · DA ATTIVARE (LinkedIn, TikTok)'],
 ['S05','SEO','IN PARTE'],['S06','Local SEO e Google Business Profile','ATTIVO (con Vincenzo)'],['S07','Presenza online multi-directory','DA ATTIVARE — priorità 1'],['S08','Reputazione e recensioni','DA ATTIVARE — priorità 1'],
 ['S09','Siti web e landing page','ATTIVO'],['S10','Accessibilità digitale','DA ATTIVARE — priorità 3'],['S11','E-commerce e social commerce','DA ATTIVARE — priorità 6'],['S12','Prenotazioni online','DA ATTIVARE — priorità 5'],
 ['S13','Centralino AI e chatbot','DA ATTIVARE — priorità 5'],['S14','Email marketing, CRM e contatti','DA ATTIVARE'],['S15','Branding e corporate design','ATTIVO (Alfonso)'],['S16','Merch e abbigliamento','ATTIVO'],
 ['S17','Analisi gratuita della presenza online','DA ATTIVARE — priorità 2'],['S18','Reporting e dashboard cliente','IN COSTRUZIONE (BigAnt OS)'],['S19','Pubblicità offline tramite partner','SU RICHIESTA']
].map(([codice,nome,stato])=>({codice,nome,stato}));

export const roadmapQ4_2026=['Pacchetto Presenza (S06 + S07 + S08)','S17 Analisi gratuita','Prova di S13 chatbot su BigAnt'];
export const checklistS06=['Categorie principale e secondarie','Descrizione','Servizi e attributi','Foto aggiornate','Orari, anche festivi','Domande e risposte','Coerenza NAP con il sito','Post settimanali o mensili','Collegamento al sito e prenotazione'];
