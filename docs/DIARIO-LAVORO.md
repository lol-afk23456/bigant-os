# Diario di lavoro — consegna a Claude Code

8 ottobre 2026, aggiornamento di consegna dalle 14:24 CEST · Europe/Rome. Ricostruzione dai commit e dalle prove: gli orari dei cicli precedenti non sono stati registrati in un diario e non vengono inventati. Gli ID R-xxx del brief esteso non sono ancora stati assegnati; sotto si usano gli ID storici AG-/MIG- e i nomi delle aree.

| Momento | Ciclo / area | Requisiti toccati | Risultato e problemi |
|---|---|---|---|
| Prima della correzione di direzione | Nucleo, Growth, Fidelity, amministrazione | MIG-GR, MIG-FI, AG-gestionale | Fondazione DEMO comune; 103 test nella baseline 8750e80. Non equivalenza ai provider originali |
| Correzione sull'intera agenzia, 8 ottobre | Audit e mappa agenzia | AG-sciame/servizi/gestionale/dashboard | Audit 1635c8e; struttura dacdc25; UI f290e3f; report723c26b. 27 spazi, 32 schede, 10 moduli. Ultima misura vecchio brief 62/205 = 30,2%, agenzia 17/114 = 14,9%; 114 test allora |
| Ultima fase prima del passaggio | Procedure dello sciame | AG-sciame e flussi specialistici, MIG-GR/MIG-FI | 7 core + 4 adapter + 21 specialisti eseguibili; output, versioni, fonti, gate e feedback. Nessun AI/provider reale |
| Revisione indipendente | Permessi e regia | Output, memoria, calendario, eventi | Corretto INSERT con 14 colonne e 15 valori, visibilità interna, feedback amministrativo, input pianificazioni, revoca servizi, cliente del contratto, eventi social/ricerca e revisione prerequisiti |
| Richiesta di consegna, 8 ottobre | Salvataggio immediato | Tutto il lavoro non committato | Commit locale 569c70d; copia web GitHub in 8 gruppi, ultimo cc1585e. Nessun collegamento Git remoto configurato, storie locale/remota diverse; nessun force push |
| Verifica consegna, 8 ottobre | Collaudo fermo al codice consegnato | Suite completa, check, 32 procedure | 161 test: 160 passati, 1 fallito in agency.test.js:31–34. Vecchia aspettativa di eventi non implementati. Test sugli agenti planned alla riga 23 vacuo. Check del codice 5/5; giro 32/32 con approvazioni, costo 0, invii 0 |
| Consegna documentale, 8 ottobre | Memoria e brief | PASSAGGIO-CONSEGNE, copertura, decisioni, brief | Trasferito contesto chat senza credenziali. Vecchio brief di 567 righe identico all’allegato; nuovo integrale di 2.184 righe conservato byte per byte. Percentuale nuovo integrale non misurata |

## Punto di arresto

Lo sviluppo si ferma per istruzione del proprietario, non perché il progetto sia completato. Il contratto `src/agency/swarm.js` è stato aggiornato, il corrispondente `tests/agency.test.js` no. Non è stato fatto il collaudo browser finale della nuova regia. Nuova matrice R-xxx, scenario aziendale a 13 passaggi, completamento dei servizi/gestionale e provider sono rimasti da fare. Vedere [PASSAGGIO-CONSEGNE](PASSAGGIO-CONSEGNE.md) per dieci prossimi passi e rischi.

Le copie remote dei report Drive possono essere precedenti alla consegna. Nessun deploy, modifica Railway, invio, pagamento, merge o accesso a Gmail è stato eseguito durante questo passaggio.


Controllo documentale dopo il salvataggio del brief integrale: `npm run check` passa sintassi, registro, dipendenze e prototipo locale, ma segnala 22 riferimenti relativi del testo sorgente a schede playbook non ancora estratte. Primo salvataggio: 21/21 file confrontati con GitHub e coincidenti. Il file integrale resta byte per byte uguale all’originale. Anche questo limite è consegnato a Claude, senza cambiare il testo sorgente o introdurre segnaposto vuoti.


## Sessione Claude Code cloud — 8 ottobre 2026

Orari Europe/Rome dei commit (i lavori sono stati committati a blocchi, quindi più righe possono avere lo stesso orario). Prova principale di ogni riga: commit, test e file indicati.

| Ora | Ciclo / macro-area | Requisiti R-xxx | Risultato | Problemi |
|---|---|---|---|---|
| 14:52 | Presa in carico | R-021 | Prompt salvato in `docs/PROMPT-CLAUDE-CLOUD.md`, `CLAUDE.md` creato (`5f1e730`). Node 24.19.0 ufficiale installato in `.cache/` con verifica SHA-256 | Il container aveva Node 22 |
| 14:53 | Test e controlli | R-008, R-018, R-047, R-208, R-367 | Test agenzia riallineati senza perdere copertura; playbook estratto dal brief (24 file) e link del brief risolti per file incorporato (`b708ec5`). `npm test` 161/161, `npm run check` 5/5 | — |
| 15:14 | Metodo e matrice | R-019 | Brief scomposto in 377 requisiti R-001…R-377 (`d364e37`, il messaggio cita per errore R-016) | Valutazione dello stato in corso con revisione avversaria |
| 15:14 | Sciame | R-002, R-028, R-083, R-134, R-147, R-151, R-152, R-176 | Motore intercambiabile (Claude Code / API / DEMO / nessuno), 11 agenti con istruzioni in `.claude/agents/`, Qualità prima della coda approvazioni, auto-approvazione DEMO, azioni esterne bloccate, tetto di spesa (`2a4168e`). 175/175 test | Con `--agent` l'output strutturato non è disponibile: JSON letto dal testo e sempre validato |
| 15:14 | Dashboard interna | R-145, R-149 | Ufficio virtuale: 9 stanze, 33 postazioni, flusso in tempo reale, aggiornamento ogni 4 s, prova browser desktop e 390 px senza scorrimento orizzontale (`f7a83e1`) | — |
| 15:27 | Sciame, prova reale | R-002, R-028, R-083 | Giro 1 con motore Claude Code: 21 passi, 2,80 USD dichiarati; approvati Direttore, Marketing, Amministrazione e Recensioni; Qualità ha fermato Ricerca, Social e GBP per dati senza fonte | Dati mancanti nei pacchetti (squadra, settori): aggiunti |
| 15:27 | Gestionale e metodo | R-015, R-017, R-100, R-116, R-125 | Contratto → fattura da emettere, canoni attesi e scadenze; regola "incasso diverso dal dovuto"; scenario a 13 passaggi con un comando e test (`f3f518b`) | — |
| 15:36 | Servizi e dashboard cliente | R-003, R-007, R-011, R-012, R-259…R-262 | Catalogo S01–S19 dalle schede, 5 pacchetti, KPI per servizio con fonte, dashboard cliente a 9 sezioni; giro 2 reale (17 passi, 1,83 USD): approvati Ricerca, GBP e Recensioni, fermati Analisi e Social (`210e6c7`) | Metodo di punteggio S17 e luogo eventi aggiunti, da rifare il giro |
| 15:45 | Consegna | R-019, R-022, R-045 | Report `docs/REPORT-CLAUDE.md`, matrice R-xxx preliminare (R-001…R-126), README e diario aggiornati | Revisione scettica della matrice interrotta per limiti di credito |
| 15:52 | Ufficio virtuale in diretta | R-145, R-149, R-007 | Il motore Claude Code invia il testo mentre scrive (stream-json). Ogni scrivania mostra in diretta cosa scrive l'agente, il dettaglio diventa una trascrizione che si aggiorna, il cliente vede "il team al lavoro per te" senza costi. Test nuovo: 183 su 183 | Avvio con doppio clic per Mac pronto, ma accantonato su richiesta del proprietario |
| 16:09 | BigAnt OS online | R-007, R-017, R-149 | L'intero server gira nel browser come pagina privata su claude.ai, con accessi socio e cliente. Verifica con browser automatico: socio 16 pagine su 16, cliente 5 su 5, zero errori, sciame al lavoro in diretta | AI vera online non disponibile: giri online DEMO dichiarati, QR e download solo sul computer |
| 16:45 | Analisi e sito pubblico | R-019, R-149 | `docs/ANALISI-APP.md`: 17 collegamenti su 17 scollegati, 56 KPI su 80 in attesa di collegamento, 11 agenti su 32 con AI. Versione pubblica dell'app provata da telefono senza errori | La creazione del repository pubblico richiede il proprietario (l'integrazione GitHub non può crearne) |
| 16:55 | Sito pubblico, automazione e piano di verifica | R-028, R-019, R-045 | Sito pubblico su GitHub Pages (`bigant-os-prova`). All'apertura parte da solo il giro del giorno dello sciame (motore DEMO, costo zero). Tolta la barra di prova. PDF `docs/verifica/BigAnt-OS-piano-verifica-7-giorni.pdf` per i soci, con 10 punti critici, divisione dei compiti, 7 giorni, modulo correzioni e decisioni | L'automazione nel server (giro giornaliero con l'AI vera) è stata fermata dal controllo di sicurezza: richiede l'ok esplicito dei soci e un tetto di spesa |
| 17:10 | Indice, piano di completamento e roadmap dei servizi | R-011, R-019, R-045 | Tre PDF in `docs/verifica/`: indice delle sezioni (raccolto aprendo ogni pagina dell'app), piano di completamento in 8 fasi, roadmap S01–S19 (cosa diventa reale subito, passi, cosa serve, onda) | Stime di tempo e costo da verificare con le approvazioni di Google e Meta |

## Sessione Claude Code dal Mac del proprietario — 9 ottobre 2026

Fase 1 (`docs/FASE-1-SERVER-REALE.md`), autorizzata l'8 ottobre. Lavoro fatto dal Mac del proprietario (non cloud): installati Node 24, GitHub CLI e Railway CLI durante la sessione, con conferma esplicita del proprietario prima di ogni azione su GitHub/Railway. Orari Europe/Rome.

| Ora | Ciclo / area | Risultato | Problemi |
|---|---|---|---|
| 12:30 | Preparazione ambiente | Installati Node 24.21.0, GitHub CLI, Railway CLI sul Mac (niente Homebrew: non supporta più Intel da settembre 2026, usati gli installer ufficiali). Login GitHub e Railway via browser | L'installer `.pkg` di GitHub CLI è stato bloccato da macOS come "sviluppatore non identificato", sbloccato dalle Preferenze di Sistema |
| 12:50 | Lettura del piano | Letti CLAUDE.md, AGENTS.md, FASE-1-SERVER-REALE.md, ANALISI-APP.md. Repository clonato sul ramo `bigant-os-notte-1` in una cartella temporanea (il proprietario ha chiesto di non lasciare nulla di permanente sul Mac) | — |
| 13:00 | Progetto Railway | Creato il progetto "BigAnt OS" su Railway, separato da Growth/Fidelity, con conferma del proprietario | — |
| 13:20 | Modalità reale: codice | `server.js` (origine https, host pubblico, cookie `Secure`, niente `/api/demo/login`, ascolto `0.0.0.0`, cartella dati fuori dal repository); `src/store.js` (`seedRealCore`: solo BigAnt e il primo socio da variabili d'ambiente, nessun dato DEMO); `src/growth.js`, `src/fidelity.js`, `src/administration.js` (i semi DEMO non partono più in modalità reale). 183 test esistenti ancora verdi | — |
| 13:35 | Modalità reale: collaudo e test nuovi | `tests/modalita-reale.test.js`, 5 test nuovi (host sconosciuto rifiutato, login DEMO assente, cookie `Secure`, primo socio, nessun dato DEMO). Collaudo manuale in locale: login reale funzionante. 188/188 test verdi | — |
| 13:40 | Interfaccia | `public/app.js`: le diciture "AMBIENTE DEMO" e il selettore di profili dimostrativi spariscono quando il server dichiara `demo:false` | — |
| 13:45 | Pacchetto per Railway | `Dockerfile` (Node 24, `npm ci --omit=dev`), `railway.json` aggiornato per puntare al server reale invece del sito di prova | — |
| 13:50 | Push e servizio Railway | Commit e push su `bigant-os-notte-1` (con conferma del proprietario). Servizio `bigant-os-server` creato nel progetto, collegato al repository GitHub | Il collegamento diretto GitHub→Railway via CLI ha dato "Repository not found": usato invece il caricamento diretto del codice locale (`railway up`), che ha funzionato |
| 14:00 | Variabili e primo deploy | Impostate `BIGANT_MODALITA`, `BIGANT_ORIGINE` (dominio Railway generato), `DATA_DIR`, `BIGANT_SOCIO_EMAIL`, `BIGANT_SOCIO_PASSWORD_INIZIALE`. Primo deploy | Crash: mancava `docs/playbook` nella build (il catalogo servizi lo legge all'avvio). Corretto e ridistribuito |
| 14:10 | Volume persistente | Volume creato e montato su `/data` (il comando diretto della CLI Railway andava in crash per un bug interno: usata la API GraphQL di Railway come alternativa) | — |
| 14:15 | Collaudo persistenza | Login reale online funzionante (cookie `Secure` confermato negli header). Primo collaudo di persistenza (utente di prova + riavvio) fallito: `unable to open database file` | Il volume Railway si monta di proprietà di `root`; il container girava con utente non privilegiato (`USER node` nel Dockerfile). Rimosso, il container ora gira come `root` |
| 14:20 | Riprova e conferma | Rifatto il collaudo: utente di prova creato, servizio riavviato, login riuscito con lo stesso utente dopo il riavvio. **Persistenza dei dati confermata.** Account di collaudo disattivati. Correzione committata e caricata su GitHub | — |
| 14:25 | Report | Aggiornati `docs/REPORT-CLAUDE.md` (sezione "Fase 1 · Server reale") e questo diario, con le prove e i limiti dichiarati (dominio `os.bigant.it` non ancora collegato, backup del volume da fare, cambio password al primo accesso non forzato) | — |

Nessun dato reale di clienti è stato inserito. Nessuna email, messaggio o pubblicazione esterna. Il dominio `os.bigant.it` non è stato toccato (serve un'azione DNS separata, da autorizzare). La chiave AI non è stata impostata, come da istruzione del proprietario.


## 10 ottobre 2026 — Codex, avvio del riordino

- Integrato con fast-forward il ramo Claude `d3b4461` nel ramo `bigant-os-notte-1`, senza modificare main.
- Letti i cinque documenti richiesti; creata la matrice `docs/copertura/riordino.json` per tutte le 92 voci.
- Fase 0 implementata: backup reale su volume esterno con rotazione e ripristino isolato; scheduler persistente ogni 24 ore; stato riservato ai soci. FUN-003: obbligo cambio password, verifica corrente, invalidazione delle vecchie sessioni; UI-014: testi e creazione Accessi coerenti con la modalità reale.
- Anticipati UI-001/UI-002: modulo email/password direttamente nella schermata reale e recupero assistito.
- Prove: **197/197 test**, `node scripts/check.js` **5/5**. Nuove prove in `tests/accessi.test.js` e `tests/backup-reale.test.js`; aggiornati i test reali per attraversare il cambio obbligatorio.
- Browser integrato: login reale con campi subito visibili; larghezza 390 px senza scorrimento orizzontale (clientWidth e scrollWidth entrambi 390). Flussi HTTP reali verificati su istanze isolate, senza dati di produzione.
- Il certificato dell'anteprima HTTPS locale non è accettato dal Browser: nessun avviso aggirato. La verifica visiva usa una vista locale; HTTPS, cookie e operazioni di autenticazione sono verificati dai test HTTP.
- **Nessun rilascio Railway eseguito**: modifiche ancora non operative sul server online.

### D-15 — permessi di approvazione

Aggiornate le decisioni su contenuti e Fidelity e i relativi test: collaboratore solo sui post social assegnati, Fidelity solo socio, cliente escluso. Restano obbligatori feedback, versione corrente e blocco degli invii. Scenario dimostrativo aggiornato al socio come decisore. Verifica della suite durante il riordino: 203 test verdi; sei nuovi test coprono anche i percorsi HTTP comuni e diretti.

## 10 ottobre 2026 — menu, home e scheda cliente in locale

Menu socio a 12 voci; collaboratore provvisorio a tre voci, con rifiuto server delle aree riservate. Home per socio e collaboratore; conteggi delle approvazioni assegnate e contratti con scadenza inclusiva entro 30 giorni. Sciame con Ufficio iniziale, griglia a sei schede e unica coda filtrabile. Accessi diviso in Persone e Registro. Profili senza numeri inventati e Avanzamento separato. Codice e tabelle delle vecchie viste conservati.

Scheda agenzia a otto sezioni (sei per collaboratore: niente contratti o documenti). Creazione cliente con link generato e disambiguazione degli omonimi; anagrafica modificabile; scheda informativa versionata con rifiuto dei conflitti; avvio con note e stato. Contratti: date, rinnovo, preavviso, allegato PDF fino a 500 KB; download riservato a socio e cliente interessato. Contratti amministrativi esistenti restano leggibili come date, senza canone. La vista cliente non mostra le fatture: Trello resta ufficiale. Anteprima socio in sola lettura e stessi filtri sui servizi del cliente.

Accessi del cliente: cifratura AES-256-GCM con contesto autenticato per cliente e record; chiave `BIGANT_SECRET_KEY` esterna al database, nessun valore nel repository. Senza chiave archivio disabilitato. Apertura tramite richiesta autenticata con CSRF, controllo dell'assegnazione a ogni richiesta e audit senza credenziali. La finestra cancella i dati mostrati quando viene chiusa. Prove: password non presente in tabella, audit o panoramica; rifiuto di cliente, altro cliente, collaboratore revocato, chiave errata e contesto scambiato.

Verifica: **203/203 test**, controllo progetto **5/5**; costruzione della pagina DEMO offline riuscita con gli strumenti fissati. Browser: menu socio, home, cliente→contratto→Indietro, Sciame→Ufficio→Indietro→Da approvare; profilo collaboratore senza aree riservate, modulo revisione, scheda assegnata; viewport 390 px con contenuto largo 390 px. Il giro completo lato cliente e il collaudo su telefono fisico restano da fare.

Limiti espliciti: non tutti i pannelli adottano ancora il componente a card; gli avvisi strutturali delle vecchie pagine Servizi devono ancora confluire in Avanzamento. Profili e Risultati sono predisposti senza fonti collegate. Report per servizio, configurazione/stato degli agenti, storico e costi per agente, Listino, integrazioni, Fatturazione e collaudo prodotti restano nel piano. I contratti aggiunti non hanno ancora modifica/revisione del PDF; si conserva l'originale. Nessuna attivazione AI, nessun invio e **nessun rilascio Railway**.

## 10 ottobre 2026 — configurazione e controllo dello Sciame

Predisposti Anthropic e OpenAI, senza chiavi né chiamate reali. OpenAI usa Responses con JSON Schema, destinazione fissa, nessun retry automatico e richiesta di non conservare la risposta; implementazione confrontata con la [documentazione ufficiale](https://developers.openai.com/api/docs/guides/structured-outputs). Modello e prezzi restano da scegliere e verificare. La cifra registrata è una stima prudenziale, non una fattura del fornitore.

I 32 agenti hanno configurazione persistente e versionata: compito, servizio, istruzioni, fonti, qualità, costo e frequenza. La scheda distingue Base, AI pronta e Attivo. Una chiave configurata non basta per AI pronta: serve anche il collaudo del percorso. Solo un agente collaudato e autorizzato può risultare Attivo. I flussi attuali usano ancora pacchetti DEMO: in modalità reale l'avvio viene rifiutato prima di creare lavori o riservare costi. Frequenze salvate senza attivazione; la revoca spegne le pianificazioni esistenti. Il collegamento delle frequenze al futuro lavoro reale resta da completare.

Storico comune e registro per agente comprendono procedure e passi AI; Budget mostra speso e impegnato per agente, riconciliati con os_costs. Le code Growth e Fidelity sono nelle rispettive pagine. Test: **209/209**, controllo progetto **5/5**, pagina DEMO offline costruita. Sei test dedicati coprono configurazione, conflitti, permessi, blocco reale, costi, protocollo OpenAI e risposte non valide; dopo l'affinamento dello stato AI pronta i sei test sono stati rieseguiti. Browser: elenco agenti e modulo con entrambi i fornitori, fonti, qualità e frequenze.

FUN-053 resta **parziale**: nessun percorso con dati reali ancora collaudato e attivabile; FUN-048 deve ancora mostrare provenienza e qualità della singola bozza. Nessun modello, canale o servizio esterno attivato. Nessun deploy o push.

## 10 ottobre 2026 — Piano servizi, Listino e custodia dei collegamenti

Servizi è il Piano di attivazione approvato in chat: 19 schede del playbook più Eventi e Pacchetti verticali, con collegamenti ai 27 spazi storici (il servizio escluso resta nascosto e conservato). Gli stati iniziali hanno fonte esplicita nel playbook da validare; nessuna data obiettivo inventata. Ogni servizio apre quattro card: Attivazione, Come lavoriamo, Agenti e Listino. I soci aggiornano stato, prossimi passi e data; conflitti di versione rifiutati. Il piano non accende automazioni né assegna servizi ai clienti.

Listino: nome, prezzo in centesimi, unità, data, note e servizio facoltativo. Aggiunta rapida, ricerca nel nome/unità/note, ripetizione della stessa richiesta senza duplicati. Nessuna scrittura in contabilità. Browser: aggiunta di una voce inventata da 129,99 euro e ricerca riuscita.

Collegamenti: card e dettaglio singolo, a cosa serve, chi ha configurato e ultima verifica. Inserimento di Brave, OpenAI, Anthropic, Google, Meta, Postiz, Trello e Google Wallet (schema iniziale). Custodia AES-256-GCM con contesto autenticato per fornitore; solo socio e CSRF. Le chiavi non ritornano nelle risposte né nell'audit, nemmeno dopo il salvataggio. Aggiornamento parziale e conflitto di versione. Verifica **locale** dell'archivio esplicitamente distinta dal collaudo del fornitore: stato ancora Da collegare, oppure Errore se l'archivio non si apre. Nessun connettore esterno attivato; i valori salvati non alimentano ancora le operazioni reali dei prodotti. Chiave del server da configurare al rilascio.

La coda Da approvare ora mostra autore e qualità. La provenienza del contenuto AI è registrata sulla specifica approvazione: dopo una modifica non si eredita il controllo della vecchia versione. Mancanza di prova indicata come Da verificare. Anche gli elaborati deterministici hanno un autore ricavato dal registro.

Verifica complessiva: **216/216 test**, controllo progetto **5/5**, costruzione DEMO offline riuscita. Sette nuove prove coprono piano, date impossibili, centesimi, idempotenza, permessi HTTP, chiavi non esposte, CSRF, contesto cifrato e qualità per versione. Browser: piano→servizio→attivazione→Indietro, inserimento e ricerca listino, Collegamenti→OpenAI senza attestazioni di connessione inesistenti. Nessun push, deploy, invio o spesa. I giri dedicati dei ruoli e i collaudi dei fornitori restano aperti.

## 10 ottobre 2026 — Fidelity: confronto originale e primo percorso completo locale

Verificata HEAD originale 350d64f, ancora coincidente con l'inventario precedente. Differenza concreta corretta: scanner OS prima limitato a BarcodeDetector, ora ZXing 0.2.1 come famiglia di libreria dell'originale, distribuita dal server locale. Rilascio della fotocamera anche in caso di chiusura durante l'attesa del permesso. Fidelity divisa in sette sezioni; ricerca iscritti, saldo aggiornato dopo ricerca e azione di anonimizzazione con conferma esplicita. Campagne: la vista cliente indica che decide un socio.

Sharp portato a 0.35.5 per l'avviso del produttore; pacchetti fissati e installati senza script. **220/220 test, controllo 5/5 e build DEMO offline**. Browser: cerca tessera, accredita fino a 10, riscatta, saldo 0 e registro; carta pubblica a 390 px senza overflow. Non è un collaudo fisico dello scanner o dei Wallet. Il [rapporto Fidelity](COLLAUDO-FIDELITY-RIORDINO.md) distingue copertura, prove e parti non ancora trasferite (provider, firma, notifiche, recupero invii). Nessun deploy, invio o modifica all'originale.


## 10 ottobre 2026 — Fatturazione, tracker e compensi

Fatturazione riservata ai soci, ultima voce di menu e senza filtro di cliente. Incassi del mese e arretrati in testa, poi quattro card: Da fatturare, Prima nota, Tracker incassi, Costi e abbonamenti. Le card riepilogano fino a tre saldi clienti e rinnovi imminenti. Previsione 30/60/90 dentro la Prima nota. Pannelli di quadrature, anomalie, ore e margini nascosti, con codice e dati conservati; contratti accessibili da Clienti e tariffe commerciali nel Listino.

Tracker con categorie della mappatura Trello, ditta, metodo, scadenza, importo, pagato e residuo. Totale effettivamente incassato per cliente. La classificazione è versionata e distingue Da fatturare dal riferimento della fattura già emessa in Aruba: non genera fatture o movimenti. Costi comprende abbonamenti, compensi mensili e anagrafiche di fornitori/collaboratori/ditte. I compensi senza mese restano visibili ed esclusi dai totali mensili, con avviso. Il pagamento registrato usa la Prima nota esistente; pagamenti parziali, saldo e doppio clic non duplicano il costo.

Prove: **223/223 test**, controllo **5/5**, costruzione DEMO offline riuscita. Tre test specifici verificano classificazione, conflitto di versione, nessuna modifica degli incassi, centesimi, compensi mensili, pagamento parziale/completo, idempotenza, mese impossibile con annullamento atomico e rifiuto HTTP per cliente/collaboratore. Browser: quattro card, Prima nota con previsioni, area costi, creazione di un compenso inventato di 123,45 euro e totale mensile corretto.

Limiti: **Trello resta il registro ufficiale**. Categorie predisposte, ma nessuna lettura o riconciliazione con i suoi dati reali: FUN-028 resta parziale. Nessun archivio contabile importato, fattura emessa, bonifico, collegamento o rilascio. Le anagrafiche reali e il collegamento in sola lettura richiedono la fase autorizzata di attivazione.


## 10 ottobre 2026 — Growth a sezioni e adattatori dei fornitori

Growth riordinato in sette card: Ricerca, Aziende e trattative, Bozze e conversazioni, Appuntamenti, Attività, Impostazioni e budget, Attivazione. Una sezione per volta, Indietro, nessuna coda duplicata sotto ogni schermata. I percorsi DEMO sono conservati; nessuna simulazione rinominata come operativa. Browser: ricerca inventata con cinque nuovi risultati, elenco aziende, esecuzione di un’analisi e aggiornamento della card Qualificate; vista e coda a 390 px con documento largo 390 px. Il telefono fisico resta da collaudare.

Riletto in sola lettura `lib/providers.js` dell’originale Growth al commit cfd4b0bfc1b9f209474af1eb9ca7fe90c6eb8aa4; copia tecnica con hash in .cache. Adattatori nuovi in `src/growth-live-providers.js` e lettura pubblica in `src/public-website.js`: Brave, OpenAI/Anthropic selezionabili senza modello predefinito, scambio OAuth Google, Gmail e Calendar. **Non ancora installati nel modulo attivo**: createGrowthModule continua a usare esclusivamente i simulatori. Ogni operazione dell’adattatore richiede un’autorizzazione applicativa esplicita, chiavi fornite dal chiamante e, per AI/Brave, una prenotazione nel budget centrale. Senza questi requisiti non legge credenziali né apre la rete.

Destinazioni API fisse, redirect vietati, risposte limitate, errori privi di chiavi e nessun retry automatico. Output AI con schema comune e verifica locale; errori o timeout dopo l’avvio mantengono la stima prudenziale, da confrontare in seguito con il costo effettivo. Gmail conserva Message-ID stabile e ha funzioni distinte per invio e ricerca del già inviato. Calendar distingue disponibilità da prenotazione, conserva ID stabile e rifiuta un esito non coerente. MIME usa il logo OS incorporato e rifiuta indirizzi/header non validi.

Lettura siti: solo HTTP/S pubblico, controllo di tutti gli indirizzi DNS e vincolo del socket all’indirizzo verificato; rete privata, IPv4 mappato, multicast e indirizzi riservati esclusi. Massimo tre redirect, un megabyte e 12 secondi complessivi; nessun cookie o header di autenticazione; testo con URL e data di acquisizione. Prove con trasporti finti, nessuna lettura di aziende reali.

Suite **234/234**, controllo **5/5**, DEMO offline costruita. Undici nuove prove sui fornitori, su entrambe le AI, su budget, errori, gate chiusi, MIME, OAuth, disponibilità/risposte Calendar, IP/DNS/redirect e limiti delle pagine. Dettagli e parti ancora mancanti in [COLLAUDO-GROWTH-RIORDINO](COLLAUDO-GROWTH-RIORDINO.md). Nessun push, deploy, chiave reale, invio o spesa.


## 10 ottobre 2026 — Growth: prime tre fasi nel motore, tutte chiuse

Collegati vault, Brave, lettura siti e AI OpenAI/Anthropic al motore reale con attivazioni distinte ricerca → analisi → bozze. Configurazione rinviabile e nessun fornitore scelto implicitamente. Flag server, prove, autorizzazione del socio, pausa, budget e versione sono verificati; cambiare chiavi, ripetere una prova o revocare il socio invalida le operazioni interessate. Il worker non esegue attività reali. Fonti persistenti, stati separati dalla DEMO, nessun link di prenotazione simulato nelle bozze reali. Gmail e Calendar restano bloccati.

La suite ha individuato e permesso di correggere la dipendenza dei backup dalle tabelle del simulatore. **248/248 test**, comprese 13 nuove prove sul motore e una sul percorso HTTP reale; backup/ripristino su archivi temporanei verificati. Browser con fixture locale in memoria: entrambe le AI disponibili, “Scelta rinviata” salvabile (corretto il campo facoltativo), zero fasi attive, ricerca disabilitata, 390 px senza overflow. Le prove non equivalgono a un fornitore reale collegato o a una sessione Browser di produzione.

Il [rapporto Growth](COLLAUDO-GROWTH-RIORDINO.md) riporta procedura, limiti e parti mancanti. Corretto anche il promemoria sull’importazione: D-11 stabilisce **nessuna importazione dagli originali**, non un’importazione ancora da fare. Originali e Railway intatti; nessuna chiave vera, spesa, push o deploy.


## 10 ottobre 2026 — Google Wallet predisposto, senza attivazione reale

COL-006: chiavi soltanto nelle variabili protette del server; rimossi i campi Wallet dalla custodia database, con eventuali vecchie righe conservate e inutilizzate. Motore Google con JWT RSA e OAuth a destinazioni fisse, creazione/aggiornamento idempotente di classi e oggetti, link firmato dopo conferma, revoca con rimozione dei dati. Nessun nuovo pacchetto. La DEMO offline esclude il motore reale.

Attivazione per attività: flag server, configurazione valida, collaudo esplicito di una tessera e attestazione Android da parte di un socio. Pausa, variazione delle chiavi, revoca del socio e risposta Google 401/403 impediscono nuove operazioni. Worker con coda persistente, una richiesta per iscritto, backoff fino a cinque minuti, massimo otto tentativi, recupero dopo riavvio e controllo dello stato dopo ogni risposta. Corretto il caso in cui un nuovo movimento saltava il ritardo di un tentativo precedente. Le tessere mai richieste non sono emesse automaticamente. Campagne e Apple restano bloccate.

Interfaccia: Google e Apple separati; collaudo e pausa riservati ai soci, ripresa degli errori ammessi e scelta esplicita dalla carta pubblica. Testi dei nuovi programmi coerenti con la modalità, mentre le vecchie fixture conservano DEMO. **265/265 test**, controllo 5/5, build offline. Browser su modulo reale chiuso e contenitore DEMO: nuovo programma e persona inventati, nessun consenso marketing, carta pubblica e QR a 390 px senza overflow. Screenshot nella cache. La [SOP](SOP-GOOGLE-WALLET.md) e il [rapporto Fidelity](COLLAUDO-FIDELITY-RIORDINO.md) distinguono prove locali e verifiche reali ancora da fare.

Nessuna chiave vera, emissione reale, spesa, push o deploy. Android/Google e Apple/iPhone restano da collaudare; nessuna voce Wallet marcata conclusa. Pausa del collegamento sospende anche le revoche remote; controllare i pendenti prima della dismissione. Gli originali non sono stati modificati né importati.


## 10 ottobre 2026 — OAuth e invio manuale Growth (COL-005, FUN-050, FUN-064)

Prima la SOP-GROWTH-GMAIL, poi il runtime: avvio Google legato alla sessione OS, PKCE e stato monouso di dieci minuti; casella e ambiti verificati, token cifrato nel vault. Le rotte API richiedono identità, cambio password completato e CSRF. Il ritorno HTML elimina i parametri dall’indirizzo; cookie SameSite=Strict conservato. Nessun consenso Google vero o lettura della posta.

Gmail collegato alle prime tre fasi Growth e a un collaudo/attivazione distinto per attività. Versione attesa nelle decisioni dirette e comuni; snapshot immutabile di contenuto, mittente, destinatario e consenso. Modifiche ai contatti o alla firma invalidano le bozze precedenti. L’anteprima richiede conferma esplicita; ogni intento è persistito prima della richiesta. Doppio clic e richieste concorrenti rispettano il limite. Gli esiti incerti e i riavvii richiedono riconciliazione, senza reinvio automatico; un risultato vuoto resta incerto. Disiscrizione pubblica tramite conferma, anche a attività spenta.

Corretto un rischio nel blocco iniziale: se durante il rinnovo del token venivano revocati consenso, mittente o socio, l’errore poteva riportare il messaggio ad approvato. Ora conserva l’invalidazione e una prova impedisce regressioni. Verificati gli identificativi Gmail e le intestazioni nella riconciliazione. Nel collaudo UI corretto anche il trasporto finto che riusava un identificativo per tutti i messaggi; la prova successiva conferma due esiti distinti.

**284/284 test**, dei quali 19 nuovi (6 OAuth, 10 mail, 3 HTTP). Controlli progetto **5/5**; build offline **43d06565ce8d**, 3863 KB. Browser: bozza → approvazione → anteprima → conferma obbligatoria → esito con fornitore finto; incerto → verifica senza reinvio. A 390 px documento 390 e dialogo 354, nessun overflow. Screenshot nella cache riordino-browser: bigant-gmail-390.png e bigant-gmail-esito.png. Pagina di ritorno Google caricata e rifiutata correttamente nella DEMO, senza chiamare Google; console della prova Growth senza errori dopo la correzione della fixture.

Limiti: prova su telefono fisico, progetto Cloud/consenso Google/recapito reali, sincronizzazione delle conversazioni, Calendar e collaudo server ancora mancanti. Le 92 voci non sono complete; matrice e report conservano lo stato parziale. Scelta OpenAI/Anthropic rinviata; l’OpenAI mostrato nella fixture è un dato di prova con trasporto finto. Nessuna chiave vera, email, spesa, push, deploy o modifica a Railway/originali.

## 10 ottobre 2026 — T0: selezione strumenti e primo riordino

Ricevuto e letto il nuovo prompt T0–T10. Salvati requisiti e stato in TASK-AVANZAMENTO, selezione motivata in STRUMENTI e limiti/registro in COSTI. Il proprietario ha confermato che si può continuare a scrivere nella cartella esistente del progetto. Nessun elenco reale dei clienti del prompt trascritto; solo ricognizione dei nomi delle cartelle, nessuna lettura di accessi o contabilità. Le task T1–T10 seguono il riordino ancora in corso. Apple esclusa dalle attivazioni reali richieste, non rimossa dal codice.

Due subagenti autorizzati hanno controllato riordini e servizi ufficiali. Skill di revisione del codice applicata; metodo di accessibilità selezionato per T2. Confermati test Node e capacità già disponibili, nessuna nuova dipendenza. Trello/Drive disponibili nel catalogo ma non collegati; servizi che ricevono dati o generano spese da approvare. Totale mensile effettivo ignoto: 20 euro Railway dichiarati dal proprietario non equivalgono alla verifica dell'intero conto. Stop richiesto a 40 euro, senza inventare credito residuo o un monitoraggio globale già operativo.

Estratto il controllo data ISO condiviso da contratti e piano servizi. Messaggi, date facoltative, permessi e transazioni conservati. Rafforzata la prova HTTP contratti con giorni impossibili rifiutati senza record e 29 febbraio valido. Revisione indipendente del diff senza regressioni individuate. Corretto il README sulle quattro dipendenze effettive.

Verifica: **10/10 mirati, 284/284 suite completa, check 5/5**. Ambiente della suite privo di credenziali, temporanei nella cache del progetto. Nessuna modifica visiva o nuova prova Browser richiesta da questo refactor. T0 resta in corso per i piccoli riordini successivi; nessuna delle 92 voci promossa sulla sola base di questa pulizia. Nessun account, acquisto, email, push, deploy o dato reale inserito sul server.


## 10 ottobre 2026 — lettura manuale delle conversazioni Growth

COL-005 / FUN-050, MIG-GR-17/20/30/31. Continuato nella cartella tecnica come confermato dal proprietario. Nuova SOP prima del codice; registrata funzione nel catalogo API. Aggiunti parser Gmail e servizio conversazioni separati dal modulo di invio: invio OS verificato, casella/destinatario, data Gmail, MIME limitato, deduplica con impronta, transazioni per thread, lotto di dieci con rotazione, rifiuti e invalidazione delle approvazioni superate. Nessuna AI o invio automatico.

Due verifiche delegate: suite specifica e revisione statica. Corretti tutti i casi segnalati: mail precedenti all’invio, contenuto incompleto inviabile all’AI, parti HTML perse, riuso dopo cambio identità (anche con kind improprio) e data di conferma HTTP successiva all’email ricevuta. Durante l’AI nuove risposte scartano la bozza; durante l’invio, annullamento prima del dispatch ed esito da riconciliare dopo. Il contatore continua a mostrare messaggi da verificare anche se già acquisiti.

Prove finali: 78/78 dedicate, 362/362 suite, check 5/5. Ambiente isolato, temporanei sotto la cache del progetto. HTTP verifica sessione/CSRF/ruoli. Browser: tre email finte acquisite, rifiuto e testo incompleto senza preparazione, vecchia bozza annullata, nuova risposta accodata e preparata solo manualmente. A 390 px documento 390 e dialogo 356. Schermate archiviate nella cache tecnica; i soli temporanei delle immagini rimossi dopo la copia. Build DEMO pubblica senza credenziali e1b292740835 (3078 KB) generata in cache, file di pubblicazione preesistente preservato.

Limiti: nessuna Gmail reale letta o collegata, nessuna AI applicativa, spesa, email, push o deploy. Calendar, server, telefono fisico e collaudo completo autorizzato restano aperti; le 92 voci non sono concluse. Nessun nuovo dato cliente reale nel repository. I messaggi needs_owner richiedono gestione manuale nella casella; non viene finto uno sblocco OS non implementato.


## 10 ottobre 2026 — contenuti: approvazione umana prima del calendario

FUN-062, collegata a FUN-063. Revisione indipendente iniziale: riprodotte in memoria programmazioni con approvazione tecnica, servizio rimosso e approvatore disattivato o non più assegnato. Nessuna pubblicazione esterna possibile già prima della correzione. Scritto SOP-PUBBLICAZIONE-CONTENUTI prima del codice, poi introdotto il controllo della prova completa e delle identità correnti anche negli accessi interni al modulo. Decisione e calendario verificano stesso cliente, contenuto, versione, titolo e testo; la pianificazione richiede una decisione datata di una persona ancora autorizzata. Le bozze dello Sciame restano DA APPROVARE anche in DEMO. Nessuna migrazione o correzione retroattiva delle approvazioni esistenti.

Test delegati in file disgiunti e riesame dei sorgenti senza ulteriori difetti bloccanti: 35/35 mirati, altri 29/29 di regressione, suite completa **382/382**. Le prove comprendono sessione, CSRF, isolamento e revoca dell’utente durante la lettura della richiesta HTTP. Ambiente privo di credenziali; gli errori iniziali EPERM riguardavano i soli listener locali e sono stati risolti con esecuzione autorizzata. Browser: otto post Sciame attendono il team, un collaboratore registra la decisione e la coda si aggiorna. Finestra mobile 390×844, documento 390 e dialogo 356, nessun errore console. Schermate in cache tecnica, temporanei esterni rimossi; anteprima in memoria terminata.

FUN-062 passa da da fare a parziale in locale: mancano connettore, esecuzione e ricevute del canale, oltre al collaudo autorizzato sul server. Le 92 voci e il nuovo incarico non sono conclusi. Nessuna dipendenza aggiunta, account collegato, AI applicativa reale, pubblicazione, spesa, push o deploy.

Controllo conclusivo: **check 5/5**, 105 file JavaScript, 72 documenti, 137 collegamenti locali, registro e dipendenze verificati senza rete.

## 10 ottobre 2026 — Struttura dello Sciame e priorità del Direttore

FUN-005/FUN-019/UI-008/UI-011, con correzione del collegamento social FUN-046. La revisione ha individuato priorità rimaste nella vecchia Direzione, Struttura limitata ai nomi, un collegamento alle bozze che finiva sulla Home e aggiornamenti tardivi dell’Ufficio capaci di sovrascrivere un’altra pagina. SOP aggiornata prima del codice. Backend di lettura separato: ambito agenzia, identità corrente, risultati versionati, revisione manuale, decisioni simulate distinte e nessun ripiego su proposte obsolete quando il risultato corrente è incompleto.

Delega con file disgiunti per interfaccia e prove VM, quindi revisione del diff e controllo indipendente del backend. Struttura ora apre un reparto con specialisti e metodo, e da lì la configurazione. La cabina conserva l’aspetto e offre esplorazione e priorità. Il collegamento social apre la bozza giusta; Ufficio, dettaglio del passo e giro scartano le risposte appartenenti alla navigazione precedente. Corretti i messaggi sulle approvazioni interne DEMO.

**407/407 test finali**, inclusi 25 nuovi: 6 backend/HTTP e 19 UI. Le prove controllano revoca e isolamento, versioni e testo, assenza di scritture/AI, errori, escaping e risposte tardive; la diretta aggiorna correttamente il passo corrente fino al risultato finale. Browser con archivio in memoria e rete esterna disabilitata: priorità da un cliente selezionato, origine, reparto/configurazione, ricerca agente, elaborato social/bozza e nuovo giro nel feed. Menu dei tre ruoli senza Lavori. Reparto e priorità a 390×844 senza overflow; dialogo 356 px. Nessun errore console rilevato. Prove dettagliate in COLLAUDO-SCIAME-UI e immagini nella cache tecnica.

Cinque voci promosse soltanto a implementate in locale, con rilascio e collaudo server ancora da fare. Matrice: 48 implementate localmente, 18 parziali, 26 da fare. Le 92 migliorie e T0–T10 restano incomplete. Avanzamento/Fondamenta hanno descrizioni ormai superate da correggere nel prossimo intervento. Nessuna nuova dipendenza, AI applicativa reale, account collegato, spesa, push o deploy.

Controllo finale **5/5**: 108 file JavaScript, 72 documenti e 138 collegamenti locali, registro e dipendenze verificati offline. Anteprima terminata, tab chiusa, viewport ripristinata; temporanei delle prove e delle immagini rimossi dopo il salvataggio nella cache del progetto.


## 10 ottobre 2026 — Avanzamento e Fondamenta affidabili

Corrette descrizioni superate: la custodia cifrata e l’autorizzazione Google risultavano ancora assenti; Growth e Fidelity erano raccolti in una riga generica. SOP scritta prima del codice. Nuova API di sola lettura riservata ai soci, 17 capacità e nove Fondamenta con parti disponibili/mancanti. Interfaccia a due ingressi, griglia compatta e dettaglio singolo con Indietro; fonte ed evidenza datata separate dalla lettura corrente.

Delega su file disgiunti per segnali dei runtime e interfaccia, poi revisione dei diff. La revisione indipendente ha individuato il caso Gmail autorizzato ma chiave del vault assente: corretto e coperto. 42 nuove prove e **449/449 test** complessivi: nessuna scrittura o chiamata esterna alla lettura, scope, permessi/revoche, pausa, versioni obsolete, backup vecchio/futuro/in errore, nessuna promozione dei canali, navigazione asincrona, errori e testi protetti.

Browser in memoria: Stato e Fondamenta, dettaglio custodia e collegamento a Collegamenti, Indietro e 390×844 senza overflow. Verificati anche catalogo e dettaglio social del cliente e testi Report, conservando i dati DEMO. Rimosso il vecchio pulsante Lavori che rimandava alla Home. Nessun errore console osservato. Schermate salvate nella cache tecnica; specifiche e limiti in SOP-AVANZAMENTO.

Quattro voci promosse a implementate soltanto in locale: FUN-004, FUN-008, UI-003, UI-004. Matrice: **52 implementate localmente, 14 parziali, 26 da fare**. Non è una percentuale di prontezza del progetto. Mancano ancora collaudo server, giro completo cliente/collaboratore, collegamenti e altre voci del piano; T0–T10 non conclusi. Nessuna dipendenza aggiunta, account, AI applicativa reale, spesa, push o deploy.

Controllo finale **5/5**: 113 file JavaScript, 73 documenti e 140 collegamenti locali; registro e dipendenze verificati senza rete. Suite ripetuta dopo la correzione del pulsante: 449/449. Anteprima terminata, tab chiusa, viewport ripristinata; temporanei delle prove e delle immagini rimossi dopo il salvataggio nella cache del progetto.

## 10 ottobre 2026 — Calendar Growth, preparazione della quinta fase

COL-005/FUN-050. SOP scritta prima del codice e delega su file disgiunti per OAuth, runtime e interfaccia, con ulteriore revisione indipendente. Aggiunti consenso Calendar separato, configurazione/versione, FreeBusy, prova alla casella verificata, ricezione esplicita, attivazione, anteprima del contatto e link temporaneo monouso senza invio automatico. Prenotazione pubblica con capacità limitata, senza utente owner fittizio; intenzioni immutabili, conflitti locali fra attività sullo stesso calendario, esiti incerti e riconciliazione sul calendario originale. Annullo con conferma e versione remota, nessuna nota interna inviata a Google.

Revisione: corretti il blocco permanente dopo 412 e il possibile ripristino delle vecchie autorizzazioni attraverso impostazioni generali. Corretto inoltre il segnale di invito esterno: il solo tentativo non prova che Google abbia ricevuto la richiesta. La prima suite ha rilevato una vecchia fixture che selezionava os-orchestrator: ora prova il rifiuto dell’identità tecnica e usa il socio umano inventato. Nessun controllo di sicurezza indebolito per far passare la prova.

**543/543 test finali**, 94 nuovi: OAuth 38, runtime Calendar 27, adattatore 5, HTTP/integrazione completa 6 e UI 18. Ambiente senza credenziali e provider integralmente sostituiti. Browser: flusso completo dalla prova all’appuntamento e annullamento, destinatario mascherato sul pubblico, orari Roma, 390 px senza overflow e dialogo 356 px. Corretti due campi vuoti senza nome nella scheda del contatto; verifica visiva ripetuta. Nessun errore console osservato. Riferimenti, screenshot e limiti in COLLAUDO-GROWTH-RIORDINO.

Matrice riordino ancora **52 implementate in locale, 14 parziali e 26 da fare**. COL-005/FUN-050 conservano stato parziale; aggiornate le prove delle righe MIG-GR-33–37/49, senza promuovere i collaudi reali o ridefinire la vecchia copertura storica. Fasi 0–7 e T0–T10 non concluse. Nessuna nuova dipendenza, account, invito reale, spesa, push o deploy. Anteprima terminata, schede chiuse, dimensioni ripristinate e immagini temporanee trasferite nel progetto.

Controllo finale **5/5**: 121 file JavaScript, 74 documenti e 144 collegamenti locali; registro, dipendenze e prototipo DEMO verificati senza rete. Suite finale 543/543 dopo tutte le correzioni al codice.
