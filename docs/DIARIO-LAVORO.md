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

