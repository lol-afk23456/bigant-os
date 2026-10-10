# Growth — riordino e predisposizione fornitori

10 ottobre 2026. Ramo locale `bigant-os-notte-1`. Fonte del confronto: originale `lol-afk23456/bigant-growth`, commit `cfd4b0bfc1b9f209474af1eb9ca7fe90c6eb8aa4`, file `lib/providers.js`. Originale non modificato.

## Cosa è verificato

L’interfaccia è suddivisa in sette sezioni con ritorno alla griglia. Ricerca, aziende, analisi e storico conservano il percorso DEMO. Nel Browser una ricerca inventata ha aggiunto cinque aziende e un’analisi ha aggiornato il conteggio delle qualificate. Nessuna email inviata. Larghezza 390 px senza scorrimento orizzontale nel documento; prova su dispositivo fisico ancora da fare.

| Famiglia | Predisposizione locale | Verifica effettuata |
|---|---|---|
| Brave Search | Query, chiave solo in header, massimo dieci risultati, fonte e data | Risposte finte, budget prima della richiesta, URL non HTTP/S esclusi |
| Siti pubblici | DNS verificato e socket vincolato, limiti di tempo/dimensioni, fonte e data | IP privati/riservati, DNS misto, redirect privato, formati non testuali e dimensione eccessiva rifiutati |
| AI | OpenAI e Anthropic; modello da configurare, stesso schema per analisi/bozza | Nessun tool, validazione locale, rifiuto/risposta incompleta, errore e costo prudenziale |
| OAuth Google | Scambio codice e rinnovo token verso endpoint fisso | Callback HTTPS da configurare, nessun segreto in URL/errori |
| Gmail | MIME con logo, invio, ricerca messaggio inviato e lettura thread | Message-ID stabile, gate distinto lettura/invio, protezione header |
| Calendar | Disponibilità, prenotazione, lettura e cancellazione | ID stabile, gate distinto lettura/scrittura, errore disponibilità non trattato come calendario libero, risposta incoerente rifiutata |

Test dedicati: `tests/growth-live-providers.test.js` e `tests/public-website.test.js`, **11/11**. Suite OS completa: **234/234**; controlli progetto **5/5**; costruzione della DEMO offline riuscita. Nessuno di questi test usa credenziali o servizi veri.

## Stato precedente: parti mancanti al commit d48f2ad

Al commit d48f2ad gli adattatori **non erano importati dal server o dal motore Growth attivo**. Il successivo avanzamento è riportato sotto. La predisposizione non soddisfa ancora il criterio “ricerca reale con risultati veri”.

1. Collegare il vault centralizzato agli adattatori, senza introdurre nuove API che restituiscano segreti. Distinguere configurazione, collaudo e attivazione per fase e cliente.
2. Portare il motore oltre le assunzioni DEMO: fonte e data persistenti, esiti reali distinti, nessun avvio automatico degli invii. Registrare stima/costi nell’archivio comune; le stime non sono un limite garantito della fattura del fornitore.
3. Il gate `allow` dell’adattatore deve essere una verifica applicativa reale. Per Gmail deve controllare socio, approvazione della versione corrente, consenso/esclusione, limite giornaliero e richiesta manuale. Per Calendar servono invito valido, slot ricontrollato e intenzione persistita. Vietato sostituirlo con un consenso costante nel server.
4. Completare il ciclo OAuth: avvio autorizzato, stato monouso legato alla sessione, ambiti minimi, callback reale e conservazione cifrata. Il solo scambio codice implementato non è un login Google pronto.
5. Gestire nel motore gli esiti incerti e la riconciliazione senza reinvio; distinguere pausa, revoca e lavori già accodati.
6. Solo dopo chiavi, budget e autorizzazione: collaudo progressivo ricerca → AI → bozze → Gmail manuale → Calendar. Nessuna attivazione richiesta o eseguita durante questo blocco.

D-11 esclude l’importazione dei dati originali, dichiarati inutilizzati dal proprietario. Restano da verificare i conteggi autorizzati, il confronto funzionale e la successiva dismissione dei siti separati, dopo il collaudo. Nessun dato di produzione letto o copiato.

## Riferimenti dei protocolli

- [Brave Search: autenticazione](https://api-dashboard.search.brave.com/documentation/guides/authentication) e [ricerca web](https://api-dashboard.search.brave.com/app/documentation/web-search/codes).
- [OpenAI: output strutturati](https://developers.openai.com/api/docs/guides/structured-outputs).
- [Anthropic: output strutturati](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
- [Google: OAuth per applicazioni web](https://developers.google.com/identity/protocols/oauth2/web-server).
- [Gmail: formato del messaggio](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages).
- [Calendar: disponibilità](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query) e [inserimento evento](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert).

Documentazione consultata per il contratto delle richieste; non prova che gli account BigAnt abbiano i permessi o che un dato modello sia già stato scelto e collaudato.


## 10 ottobre — motore reale predisposto per ricerca, analisi e bozze

Le prime tre fasi sono ora collegate al vault e al motore OS. **Restano chiuse per impostazione predefinita.** Il server in modalità reale usa il nuovo percorso; la DEMO mantiene il simulatore. Nessuna configurazione di produzione è stata cambiata.

### Procedura di attivazione predisposta, non eseguita

1. Un socio prepara gli accessi in Collegamenti e sceglie stime prudenziali in Growth. La scelta AI può restare rinviata; sono previsti OpenAI e Anthropic, senza modello predefinito.
2. L’amministratore del server abilita esplicitamente `BIGANT_GROWTH_EXTERNAL_ENABLED=true` solo dopo l’autorizzazione alla fase reale. Il flag da solo non attiva fasi o lavori.
3. Un socio collauda in ordine ricerca/lettura, analisi, bozze. Ogni prova impegna la stima nel budget centrale; dopo l’avvio anche un timeout conserva il costo prudenziale. Non è una garanzia sull’importo fatturato dal fornitore.
4. Dopo aver esaminato l’esito, il socio attiva la singola fase. Un lavoro richiede anche Growth non in pausa e un’esecuzione manuale. Il worker non avvia attività reali.
5. Una modifica della configurazione o delle chiavi invalida i collaudi. Ripetere un collaudo sospende subito la fase e quelle successive: un errore non conserva la vecchia attestazione. Le attività accodate restano legate alla prova e alla versione degli accessi.

Invio, ricezione Gmail, moduli pubblici, prenotazioni e Calendar restano rifiutati dal motore reale, anche chiamando direttamente i gestori. Nessuna bozza equivale a un invio. I link di prenotazione DEMO non vengono inseriti nelle bozze reali.

### Dati e controlli

- Fonti di ricerca e siti salvate con URL, data, provenienza e testo; modifiche alle fonti esistenti rifiutate. Le schede mostrano le fonti consultate.
- Archivi occupati DEMO e reali non vengono mescolati. Per il rilascio va verificato lo stato dell’archivio: il sistema rifiuta la conversione implicita di dati inventati.
- Ruolo socio ricontrollato nel database, fase/cliente/versione verificati prima e dopo la chiamata. Risultati superati scartati; costi già sostenuti conservati. Schede o impostazioni cambiate durante l’AI non vengono sovrascritte.
- Le chiavi restano cifrate e sono lette soltanto dal motore autorizzato; nessuna nuova API restituisce segreti. Audit senza contenuto delle chiavi.
- Backup e ripristino riconoscono sia lo schema storico DEMO sia il nuovo schema reale; non richiedono tabelle del simulatore nell’archivio reale.

### Prove e limiti attuali

**248/248 test**. Tredici prove specifiche in `tests/growth-runtime.test.js`, più una prova HTTP reale su scelta rinviata, CSRF e ruoli. Ricerca → fonte → analisi → bozza verificata con trasporti e siti finti per entrambi i fornitori. Verificati pausa, revoca del socio, chiavi ruotate, risposte in ritardo, collaudi concorrenti/falliti, budget esaurito e separazione degli archivi. Backup/ripristino reali collaudati su volumi temporanei con dati inventati.

Browser: schermata e salvataggio di “Scelta rinviata”, entrambe le AI presenti nell’elenco, nessuna fase attiva e ricerca disabilitata; 390 px senza overflow. Per questa prova la cornice DEMO usa il modulo Growth reale chiuso attraverso una fixture locale in memoria, senza password o fornitori. Non è una prova dell’autenticazione reale in Browser né un collaudo di servizi esterni.

**COL-005 e FUN-050 restano parziali.** Mancano il collaudo con risultati veri autorizzato dai soci, il ciclo OAuth completo, Gmail manuale con approvazione della versione/consenso/idempotenza e riconciliazione, Calendar e il confronto integrale dell’inventario sul server. Nessun push, deploy, collegamento, invio o spesa eseguito.


## 10 ottobre — OAuth e Gmail manuale integrati, chiusi per default

COL-005 fase 4, FUN-050, FUN-064. Collegati server, custodia cifrata, approvazioni comuni e UI al runtime OAuth/Gmail. Il refresh token non è un campo da incollare: proviene soltanto dal consenso Google verificato. Nessun ambito Calendar. La [SOP Gmail](SOP-GROWTH-GMAIL.md) descrive attivazione e limiti.

Prove nuove: 6 OAuth, 10 invio/riconciliazione e 3 HTTP. I test dei provider ora verificano il cancello prima del token, prima della richiesta e dopo la risposta. Controllati anche doppio clic, quota concorrente, firma/disiscrizione, versione obsoleta, cambio destinatario o mittente, consenso e socio revocati, timeout, riavvio, casella diversa, intestazioni incongruenti e richiesta pubblica da origine estranea. Nessun segreto restituito da API o audit.

Nel Browser, fixture `.cache/riordino-browser/gmail-ui.mjs` con dati in memoria e tutti i fornitori finti: bozza → approvazione → anteprima → conferma → esito; checkbox obbligatoria, stato incerto → verifica senza reinvio, due identificativi distinti. Corretto il trasporto di prova che inizialmente assegnava lo stesso identificativo a messaggi diversi. Anteprima a 390 px: documento 390, finestra 354, nessun overflow orizzontale; screenshot `bigant-gmail-390.png` e `bigant-gmail-esito.png`. Ritorno Google provato in modalità DEMO: parametri rimossi, operazione esterna rifiutata; il vero giro Google resta da collaudare.

Suite completa finale: **284/284**. Controllo progetto **5/5**; build offline **43d06565ce8d**, 3863 KB. Queste prove non equivalgono a una consegna email reale. Nessun account collegato, nessuna email, spesa o modifica a Railway.

Restano da completare: sincronizzazione reale delle conversazioni e rifiuti, Calendar, verifiche con account autorizzati, confronto completo con l’originale e collaudo server/telefono. FUN-050 e COL-005 rimangono parziali, non chiusi contando i test.


## 10 ottobre — conversazioni Gmail e rifiuti, lettura manuale

COL-005 / FUN-050 ancora **parziali in locale**. Aggiunta lettura manuale di dieci thread per lotto, ordinati per ultima verifica, solo su invii OS confermati della stessa attività/casella/contatto. SOP scritta prima del codice: [SOP-GROWTH-CONVERSAZIONI](SOP-GROWTH-CONVERSAZIONI.md). Nessuna AI, risposta automatica o scaricamento allegati durante la lettura.

- **78/78 prove specifiche**: ancore e date Gmail, intestazioni e MIME ostili, rifiuti, consenso, duplicati/replay, isolamento, permessi/revoche, transazioni, doppia richiesta, rotazione oltre dieci thread e concorrenza con bozza/invio.
- Revisione indipendente: corretti la tolleranza sulle vecchie risposte, l’uso AI di testi incompleti, la perdita di parti HTML nei messaggi misti, il riuso dopo cambio casella/destinatario (compreso tipo job improprio) e la soglia temporale basata erroneamente sul ritorno HTTP. Ogni caso ha una regressione con dati inventati.
- HTTP: niente lettura senza sessione, CSRF o ruolo socio; GET non produce effetti, conferma obbligatoria, zero chiamate quando non ci sono thread eleggibili. La pausa dell’invio non impedisce di leggere un rifiuto.
- Browser desktop: acquisite tre risposte inventate, vecchia bozza annullata; messaggio incompleto e rifiuto senza comando per preparare risposta; normale risposta accodata e lavorata solo con esecuzione manuale, nuova bozza da approvare. Fonte Gmail e data visibili, etichetta reale «Da leggere».
- Browser a **390 px**: documento 390 px, dialogo 356 px, nessun overflow orizzontale. Screenshot: `.cache/riordino-browser/bigant-gmail-risposte-desktop.jpg` e `bigant-gmail-risposte-390.jpg`. La cornice DEMO usa il modulo reale su memoria e trasporti finti: non prova autenticazione Google o recapito reali. Autenticazione/CSRF verificati separatamente dai test HTTP.

Suite completa **362/362**, check **5/5**. Build DEMO pubblica locale senza credenziali **e1b292740835**, 3078 KB, salvata nella cache tecnica; il file di pubblicazione precedente è stato preservato. Nessun account, email, AI applicativa reale, spesa, push o deploy. Restano Calendar, verifica reale autorizzata di Gmail/fornitori, collaudo server e telefono fisico, confronto completo con l’inventario. I messaggi incompleti richiedono gestione manuale nella casella: non esiste ancora uno sblocco OS della revisione.
