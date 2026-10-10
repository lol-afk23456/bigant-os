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

## Sessione Claude Code cloud — 10 ottobre 2026

| Ora | Ciclo / macro-area | Requisiti R-xxx | Risultato | Problemi |
|---|---|---|---|---|
| 12:40 | Frontend: tre direzioni | R-006, R-051, R-169 | Tre prove di interfaccia cliccabili (cabina di regia, prima le decisioni, studio per cliente) su una tela privata dei soci, con dati DEMO del repository | Nessun file del repository modificato in questo passo |
| 13:20 | Frontend: guida estetica | R-006, R-051, R-169 | Ricerca sulle buone pratiche (gerarchia, token, contrasto WCAG 2.2, stati vuoti, tabelle dense); app avviata in locale (DEMO) e fotografata; CSS misurato. `docs/GUIDA-ESTETICA-FRONTEND.md` con diagnosi, token, componenti, piano e criteri; schermate "prima" in `docs/estetica/prima/`; puntatore in `AGENTS.md` | Node 22 nel container: l'app parte comunque (SQLite sperimentale). Rilevato che `scripts/build-online.js` legge i file di `public/` per nome: la guida vieta di dividerli in questa fase |

