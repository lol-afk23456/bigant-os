const client=[
 ['overview','Panoramica',[], 'KPI mensili, confronto con mese precedente/obiettivi, sintesi e prossimi passi.'],
 ['leads','Contatti e lead',['growth','audit','booking','reception','ads','presence','website','local'],'Chiamate, WhatsApp, moduli e prenotazioni con fonte.'],
 ['social','Social',['social','social-commerce'],'Follower, copertura, interazioni, contenuti migliori e calendario.'],
 ['advertising','Pubblicità',['ads','display','tv'],'Spesa, risultati e costo per contatto per ogni canale attivo.'],
 ['local','Google e presenza locale',['local','presence','multisite'],'Visualizzazioni, chiamate, indicazioni, posizioni e coerenza directory.'],
 ['reputation','Reputazione',['local','presence','multisite'],'Nuove recensioni, media voti, risposte e richieste in attesa.'],
 ['website','Sito e SEO',['website','seo','ecommerce','accessibility'],'Visite, fonti, pagine, conversioni e salute tecnica.'],
 ['approvals','Contenuti da approvare',[],'Approvazioni disponibili nel flusso comune per i servizi acquistati.'],
 ['reports','Report e documenti',[],'Report mensili, strategia e materiali consegnati.'],
 ['ask','Chiedi all’agenzia',[],'Risposte basate sui dati presenti e richieste trasformate in task.'],
 ['fidelity','Fidelity',['fidelity'],'Tessere, premi, consensi e campagne DEMO; Wallet scollegato.']
];
export const clientSections=client.map(([id,name,services,description])=>({id,name,services,description,
 status:['approvals','ask','fidelity'].includes(id)?'Flusso DEMO parziale':'Solo struttura',
 missing:['approvals','ask','fidelity'].includes(id)?'Consultare il modulo locale per i limiti e le funzioni disponibili.':'Collegare fonti e costruire il riepilogo specifico; nessuna misura reale disponibile.',
 metrics:null,updatedAt:null
}));
export const internalSections=[
 ['agency','Mappa dell’agenzia','Reparti, moduli e servizi, con stato e limiti.'],
 ['marketing','Marketing BigAnt','Canali e piano del cliente zero.'],
 ['direction','Sei domande di direzione','Cassa, crediti, rischio, contratti, capacità e decisioni.'],
 ['clients','Clienti e reparti','Lavori, scadenze, rischio e opportunità.'],
 ['approvals','Decisioni in attesa','Approva, modifica e rifiuta con motivazione.'],
 ['agents','Automatismi','Code, ritardi, errori, pianificazioni e ripresa.'],
 ['activity','Registro attività','Autore/agente, data, cliente, output, fonte e costo.'],
 ['budget','Costi e tetto di spesa','API e strumenti per cliente e totale.'],
 ['administration','Amministrazione','Incassi, arretrati, fatture, scadenze, cash flow, margini, soglie, compensi e quadratura.'],
 ['objectives','Priorità e KPI','Obiettivi a 90 giorni, andamento e crescita misurata.'],
 ['services','Produzione e servizi','Workspace per ciascun servizio.'],
 ['documents','Documenti e portfolio','Documenti obbligatori e autorizzazioni.']
].map(([id,name,description])=>({id,name,description,status:['objectives','documents'].includes(id)?'Solo struttura':'Flusso DEMO parziale',missing:'Vedere limiti e parti ancora da completare nella mappa.',ownerOnly:true}));
