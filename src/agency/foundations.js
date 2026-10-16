// Contratti delle aree incomplete. Le parti già disponibili sono distinte dal flusso ancora mancante.
const plans=[
 ['onboarding','Onboarding e salute cliente','account',['cliente','servizio','fase','responsabile','checklist','campi mancanti','gate di avvio','rischio','fonte','versione'],['Acquisizione e passaggio dal commerciale','Checklist di avvio per servizio','Campi mancanti e documenti','Rinnovo, rischio e chiusura'],'Mancano checklist per servizio, passaggio dal commerciale e controlli obbligatori prima dell’avvio. Il completamento manuale non verifica quei requisiti.'],
 ['portfolio','Portfolio e autorizzazioni','account',['cliente','materiale','ambito','canali consentiti','autorizzante','inizio validità','scadenza','revoca','documento','versione'],['Richieste di autorizzazione','Materiali consentiti','Scadenze e revoche','Controllo prima delle uscite'],'Manca archivio e gate applicativo delle autorizzazioni. Tutte le pubblicazioni restano bloccate.'],
 ['capacity','Capacità del team','direction',['persona','settimana','minuti disponibili','assenze','minuti assegnati','cliente','servizio','fonte'],['Disponibilità settimanale','Lavori assegnati','Sovraccarico','Decisioni di riallocazione'],'Mancano disponibilità e confronto automatico; non si confondono ore lavorate e capacità.'],
 ['objectives','Obiettivi a 90 giorni','direction',['responsabile','periodo','canale','baseline','target','stato','iniziative','fonte','versione'],['Obiettivi del trimestre','Iniziative','Responsabili e scadenze','Decisioni e risultati'],'Manca registro obiettivi, iniziative e avanzamento misurato.'],
 ['kpis','KPI, qualità e ore risparmiate','direction',['cliente','servizio','KPI','unità','periodo','baseline','target','valore','fonte','freschezza','qualità','minuti risparmiati'],['KPI agenzia','KPI per cliente e servizio','Confronti tra periodi','Ore risparmiate e qualità'],'Mancano serie storiche, fonti collegate e misurazione affidabile delle ore risparmiate.'],
 ['packages','Pacchetti, listini e upsell','direction',['settore','servizi inclusi','esclusioni','ore','costi confermati','prezzo proposto','margine','capacità','cliente candidato','decisione','versione'],['Pacchetti per livelli','Verticali sanità','Listini da approvare','Opportunità clienti','Partner e condizioni'],'Mancano registro commerciale completo dei pacchetti, costi e capacità confermati, margini completi e processo di approvazione dell’offerta. Il listino esiste; i prezzi richiedono validazione dei soci.'],
 ['accountant','Pacchetto per il commercialista','administration',['ditta','periodo','documenti richiesti','documenti presenti','documenti mancanti','numeri verificati','versione','approvatore'],['Selezione periodo e ditta','Documenti e mancanze','Confronto dei numeri','Approvazione del socio'],'Manca generazione del pacchetto documentale; nessun invio autorizzato.'],
 ['unusual-expenses','Spese insolite','administration',['ditta','categoria','periodo','baseline storica','soglia confermata','frequenza','importo in centesimi','motivazione','responsabile','esito'],['Storico di confronto','Regole confermate','Segnalazioni','Verifica e motivazione'],'Rilevazione statistica e valutazione ancora assenti; i controlli esistenti non coprono questa regola.'],
 ['credentials','Custodia dei collegamenti','administration',['fornitore','ambito autorizzato','riferimento al gestore segreti','scadenza','revoca','ultimo controllo'],['Permessi minimi','Custodia online','Rotazione','Revoca e registro'],'Restano configurazione e collaudo degli account reali, autorizzazioni per gli altri fornitori e gestione completa della rotazione della chiave principale. Le chiavi Wallet rimangono nelle variabili protette del server.']
];
const present={
 onboarding:{available:['Note di avvio e completamento manuale, con versione e registro.','Scheda cliente con informazioni, servizi e accessi disponibili.'],route:'clients',files:['src/client-records.js']},
 portfolio:{available:['Contratti e approvazioni dei contenuti sono disponibili, ma non registrano i diritti portfolio.'],route:null},
 capacity:{available:['Minuti stimati e consuntivati per il lavoro; non misurano la disponibilità del team.'],route:null},
 objectives:{available:['Priorità del Direttore consultabili nello Sciame; non sono un registro di obiettivi misurati.'],route:'agents:office'},
 kpis:{available:['Misure interne e report operativi con fonte, limitati ai dati registrati.'],route:'clients'},
 packages:{available:['Piano servizi e listino persistente con prezzi in centesimi.','Proposte di pacchetti e controllo dimostrativo delle capacità dichiarate.'],route:'catalog:prices',files:['src/service-plan.js']},
 accountant:{available:['Prima nota, tracker e contratti costituiscono dati di partenza; non un dossier pronto da consegnare.'],route:'administration'},
 'unusual-expenses':{available:['Controlli su duplicati, documenti, scadenze e aumenti degli abbonamenti; non rilevano automaticamente spese insolite.'],route:null},
 credentials:{available:['Archivio cifrato e controllo di versione, con metadati separati dai segreti.','Autorizzazione Google e controlli sulla casella; gli altri canali richiedono collegamenti propri.'],route:'connections',files:['src/connections.js','src/google-oauth.js']}
};
export const foundations=plans.map(([id,name,department,fields,names,missing])=>({id,name,department,status:present[id].files?'Flusso DEMO parziale':'Solo struttura',missing,
 available:present[id].available,route:present[id].route,
 fields,sections:names.map((name,i)=>({id:id+'-'+(i+1),name,status:'Solo struttura',missing})),
 ownerOnly:true,records:[],implementation:present[id].files?{partial:true,files:present[id].files}:null,
 approval:'Decisione umana tracciata prima di attivare o usare dati esterni.',
 acceptance:['Campi e fonti verificati','Permessi per record','Versione e audit','Nessuna azione esterna nel prototipo']
}));
