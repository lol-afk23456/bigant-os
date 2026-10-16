# Analisi iniziale — BigAnt OS

8 ottobre 2026. Documento di scoperta e scelta; non è un attestato di equivalenza produttiva. Il report notturno contiene gli esiti finali, i test effettivamente eseguiti e il collegamento alla pull request. Le informazioni organizzative derivano dal brief, non da una lettura degli archivi reali dell'agenzia.

## 1. Il problema da risolvere

BigAnt ha già competenze, clienti, strumenti e parti di metodo. Manca una regia unica che colleghi acquisizione, contratto, lavoro, approvazioni e incassi. Ogni duplicazione tra chat, fogli e cartelle rende più difficile capire se un lavoro sia dovuto, consegnato, approvato e pagato.

Il risultato utile del primo pilota è rispondere con dati verificabili alle sei domande dei soci: cassa disponibile, crediti, consegne/clienti a rischio, contratti in scadenza, carico di lavoro e decisioni aperte. L'automazione viene dopo il metodo. Aggiungere molti agenti senza definire queste regole aumenterebbe soprattutto bozze e notifiche da controllare.

Il nuovo brief definisce un prodotto **interno**, con pochi utenti e qualche decina di clienti. Prevale sull'idea precedente di rivenderlo al pubblico dopo un anno: questa versione non include piani SaaS, pagamenti di abbonamenti, onboarding pubblico commerciale o funzioni per migliaia di organizzazioni.

## 2. Come si lavora oggi, secondo il brief

| Area | Fonte o strumento attuale | Problema emerso | Primo miglioramento |
|---|---|---|---|
| Metodo e memoria | Markdown per cliente, con scheda master, Ads, DNA, direttive, brand e storico | Frammentazione e doppia compilazione Mac/Drive | Memoria versionata dal gestionale, esportabile; credenziali escluse |
| Attività | Trello agenzia e GBP | Consegne e carico da ricomporre a mano | Task con cliente, servizio, referente, scadenza e ore |
| Produzione editoriale | PED clienti, strumenti creativi e Postiz | Stato fra bozza, approvazione e pubblicazione da allineare | Versione approvata collegata all'azione e al suo esito |
| Incassi e scadenze | Prima Nota e Tracker | Arretrati, documenti, rinnovi e quadrature non sempre verificati | Lettura futura delle fonti, anomalie e riconciliazione per ditta |
| Amministrazione | Modelli interni e commercialista | Due ditte sotto un marchio, dati e responsabilità da separare | Ditta obbligatoria sui documenti e conto coerente sui movimenti |
| Commerciale | Growth e ricerca clienti | Servizi ancora da collegare e processo da validare | Prima collaudo completo offline, poi un connettore alla volta |
| Fidelizzazione | Fidelity | Prodotto esistente da preservare e riusare | Regole carte e campagne integrate nel modello OS |

Non sono stati aperti `04_ACCESSI/`, documenti contabili reali o caselle Gmail. I modelli originali Ads/Video/DNA non risultano acquisiti integralmente: il playbook riprende quanto descritto nel brief e indica cosa va confrontato con gli originali.

## 3. Inventario delle applicazioni

### Growth / Grow e ricerca nuovi clienti

Riferimento verificato nella sessione: repository privato [bigant-growth](https://github.com/lol-afk23456/bigant-growth), commit `cfd4b0bfc1b9f209474af1eb9ca7fe90c6eb8aa4`. Applicazione originaria su [Railway](https://bigant-growth-production.up.railway.app/), lasciata intatta.

Il codice contiene CRM, deduplica, ricerca, analisi, bozze, consenso/opposizioni, messaggi e risposte, appuntamenti, import/export, code e controllo costi. La ricerca clienti è già un sottosistema di Growth: non è stata trovata evidenza sufficiente per dichiarare un terzo repository autonomo. Si integrano quindi **tre ambiti funzionali** attraverso due basi di codice conosciute, senza inventare una terza applicazione.

In OS le regole sono adattate in `src/growth.js` e nei file `growth-*`. I dati `gr_*` usano lo stesso SQLite, gli stessi clienti e il budget/audit OS. La conversione di un lead crea un cliente comune e conserva il collegamento di provenienza. Provider reali sostituiti con fixture `.example`: nessuna ricerca web, email o prenotazione Google viene presentata come realmente eseguita.

La lista API e le verifiche del dominio sono in [API-GROWTH.md](API-GROWTH.md). La corrispondenza completa con l'originale e i limiti di parità vanno letti nell'inventario di migrazione/report; la presenza di una rotta non prova una consegna Gmail o un collegamento OAuth.

### Fidelity

Riferimento verificato nella sessione: repository privato [Fidelity](https://github.com/lol-afk23456/Fidelity), revisione `350d64f`. Applicazione originaria [online](https://fidelity-lpf-production.up.railway.app), lasciata intatta.

Il porting locale comprende programmi timbri/punti/coupon, iscritti, consensi, scanner, movimenti/riscatti/storni, campagne e automazioni di preparazione, carte web, branding raster, export e generatori di payload wallet. Il tenant dell'app originale corrisponde al cliente comune OS; gli iscritti Fidelity restano persone distinte dai clienti dell'agenzia e dai lead commerciali.

Firma, certificati, registrazioni dispositivi e invio/aggiornamento Apple/Google Wallet restano scollegati. Campagna approvata o payload generato non significano campagna consegnata o carta emessa. Il porting non rimuove il blocco Apple Deployment del progetto esistente. Dettagli in [API-FIDELITY.md](API-FIDELITY.md).

### PED

L'interfaccia amministrativa autenticata è stata ispezionata in sola lettura durante la sessione. Sono stati osservati dashboard agenzia, workspace, chat, notifiche, approvazioni/revisioni, calendario, tracciamento manuale della pubblicazione e attività recenti. Non sono riportati nomi, messaggi, contenuti o dati dei clienti.

È confermata la presenza del client JavaScript **Supabase 2.45.0**. Questo indizio non basta a conoscere backend, schema dati, politiche RLS, repository, pipeline di rilascio o hosting. Questi aspetti restano **non verificati**. Le credenziali amministrative web non equivalgono ad accesso al sorgente.

| Scelta PED | Vantaggio | Costo/rischio | Decisione attuale |
|---|---|---|---|
| Estendere il PED | Conserva abitudini e interfaccia già usata dai clienti | Impossibile valutare integrazione amministrativa e agenti senza codice/permessi | Nessuna modifica adesso |
| Ricostruire e migrare tutto | Interfaccia e modello unici | Rischio di perdere funzioni/dati e duplicare ciò che funziona | Non autorizzare una sostituzione sulla sola osservazione della UI |
| Preparare OS e un contratto di collegamento, poi decidere | Consente il pilota senza interferire con il PED | Richiede successivo accesso al sorgente/API e prova di migrazione | Scelta provvisoria: preserva il lavoro esistente |

Prima della decisione definitiva servono da Alfonso repository o specifica API, ruoli, modello approvazioni/versioni, identificativi clienti, export consentiti e responsabilità hosting. Nessuna alterazione al codice originale del PED è inclusa nella notte.

### Railway

Usato soltanto come fonte di lettura dell'assetto esistente. Non sono autorizzati deploy, nuovi servizi, riavvii, modifiche database, domini o valori segreti. BigAnt OS è locale e separato. I nomi delle variabili possono essere inventariati; valori e credenziali non vanno copiati qui.

## 4. Confronto con il mercato

La ricerca su fonti primarie e i limiti dei prezzi sono in [CONFRONTO-MERCATO.md](CONFRONTO-MERCATO.md).

- **Productive:** riferimento per ore, risorse, budget e redditività cliente. Il listino estratto presenta incongruenze; nessun acquisto basato su quel numero.
- **Teamwork:** riferimento per pianificazione consegne, disponibilità del team e lavoro a canone. Il prezzo per utente e i minimi di posti non rappresentano l'intero costo di integrazione.
- **Odoo:** riferimento per dati comuni e separazione delle entità. Multi-company e API richiedono il piano pertinente e un lavoro di configurazione; non sono gratis perché le app sono numerose.
- **Italiaonline:** riferimento per una gamma di bisogni delle PMI e un funnel di analisi gratuita. Non possiamo replicare accordi di directory, network proprietari o promettere risultati AI acquistando soltanto software.

La proposta prende questi principi, senza provare a ricostruire interamente i quattro prodotti.

## 5. Tre opzioni e costo mensile

**Stime di pianificazione**, non preventivi: imposte, cambio, lavoro umano, pubblicità e strumenti creativi sono separati. Nessuna spesa è stata attivata. I prezzi dei fornitori e le fonti sono nel confronto mercato; qui è riassunta la conseguenza per BigAnt.

| Opzione | Stima mensile software/infrastruttura | Lavoro da considerare a parte | Esito |
|---|---|---|---|
| A. App unica modulare, Node + SQLite, singola istanza futura | Nel piano Railway esistente, consumo incrementale ipotizzato $3–10 a basso traffico; credito residuo sconosciuto. Busta operativa complessiva proposta entro €50 con AI/ricerca limitate | Pilota ristretto: ordine di grandezza 40–80h dopo audit, 2–4h/mese manutenzione; non è la stima del catalogo intero | Scelta per la fondazione locale |
| B. App unica + database gestito separato | Basi Railway + Supabase nell'ordine di almeno $45 prima di AI/eccedenze, più budget variabile | Permessi, migrazione e due componenti da gestire; stima pilota 50–100h | Rinviata: budget troppo stretto senza un'esigenza concreta |
| C. Gestionale acquistato + moduli BigAnt | Licenza per posti + hosting moduli + collegamenti; esempi e minimi nel confronto | Configurazione/integrazioni stimate 30–80h per perimetro ristretto; nessuna equivalenza automatica a OS | Alternativa se la manutenzione custom diventa sproporzionata |

Le ore sono stime interne iniziali, non lavoro dichiarato già effettuato né prezzo da fatturare. La scelta A riduce duplicazioni perché entrambe le applicazioni note usano già Node e SQLite. Non autorizza una pubblicazione: backup, autenticazione reale, persistenza e collaudo multiutente vanno completati prima del cloud.

Budget assunto: **€50 complessivi per la prova, hosting incluso**. Resta da confermare se includa anche tutti i consumi Fidelity del workspace. Nell'app il tetto centrale è 5.000 centesimi, con 3.500 per quote fisse/riserva e 1.500 disponibili alle lavorazioni. Non sono consumi fatturati: tutte le esecuzioni attuali costano zero API.

## 6. Rischi e contraddizioni risolte

| Tema | Rischio | Decisione / limite concreto |
|---|---|---|
| “Tutto integrato” e divieto di servizi esterni | Confondere porting locale con parità operativa online | Logiche locali collaudate; provider e risultati remoti dichiarati non verificati |
| Autonomia totale e decisioni dei soci | Invii/pubblicazioni/spese senza gate | Agenti autonomi su analisi/bozze; azioni esterne disabilitate |
| Catalogo vasto e budget piccolo | Diciannove prodotti incompleti | Registro estensibile, SOP e stato di attivazione; pochi servizi reali per volta |
| Due ditte sotto un marchio | Conti, fatture e costi attribuiti alla ditta sbagliata | Entità distinta obbligatoria, coerenza conto/documento, niente soglie fiscali presunte |
| Memoria in file e fonte unica | Nuova doppia scrittura | Database canonico e memoria testuale versionata/esportabile; sincronizzazione Drive non attiva |
| Demo con dati reali richiesta nelle fasi | Portare contabilità/contatti nel repository | Per la notte prevale il divieto: solo fixture DEMO |
| “Niente sul Mac” e prototipo locale | Scritture fuori perimetro | Solo cartella tecnica del repository; dati locali esclusi da Git |
| Foto/merch presenti nel catalogo | Investire in acquisizione a basso margine | Restano nel registro, esclusi dalla prima acquisizione automatica |
| Programmazione e pubblicazione | Stato locale scambiato per esito esterno | Documentare la pianificazione come locale; nessuna consegna dichiarata senza ricevuta |
| Accessi dimostrativi | Demo pubblicata accidentalmente | Server vincolato a localhost; `NODE_ENV=production` blocca l'avvio CLI |
| Misure economiche incomplete | Contributo di cassa chiamato utile | Distinguere cassa, stima e consuntivo gestionale; margine completo ancora non disponibile |
| Segreti nella storia originale | Riutilizzo o diffusione involontaria | Non usarli; eventuali ritrovamenti nel report urgente. Questa analisi non attesta una scansione completa di tutta la storia Git |

## 7. Primo gestionale già concreto e ciò che manca

Il modulo amministrazione registra anagrafiche, contratti, bozze documenti, scadenze, prima nota in centesimi, compensi, prelievi e abbonamenti. Calcola saldi, arretrati, scenari 30/60/90 giorni e anomalie deterministiche. Quadrature per conto/ditta chiudono periodi; storni e rettifiche preservano gli originali e richiedono motivazione. Tariffe confermate e attribuzione dei task permettono confronto fra stima e consuntivo gestionale, senza doppio conteggio dei compensi.

Mancano collegamenti reali, fatturazione fiscale/SDI, importazione concordata dei fogli, conferme del commercialista, completa competenza economica e riparto costi comuni. Non viene dichiarato pronto a sostituire un software fiscale.

Per passare ai dati reali: prima confermare fonte e ownership, poi importare un periodo autorizzato in un ambiente riservato, confrontare record/saldi e anomalie, eseguire due chiusure parallele e decidere insieme quando cambiare la fonte. Nessun foglio viene spento o scritto dal prototipo.

## 8. Come giudicare la consegna

L'esistenza del menu non prova l'implementazione di un servizio. Per ogni funzione contano percorso UI/API, input valido, permessi, verifica del risultato e limite dichiarato. Consultare le API dei tre domini, il playbook, l'architettura e i test. Il numero di test varia con le correzioni: il report finale riporta il comando e l'esito dell'ultima esecuzione, non una cifra anticipata da questo documento.

La prova deve dimostrare soprattutto che un cliente non vede un altro cliente, un collaboratore non legge i soldi, un testo cambiato perde l'approvazione, un pagamento non si duplica, uno storno non riscrive il passato e un servizio scollegato non finge di aver lavorato.
