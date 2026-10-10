# Profili — preparazione e verifica locale

10 ottobre 2026. Requisiti FUN-012, UI-007, FUN-013; procedura in [SOP Profili](SOP-PROFILI.md). Solo attività e indirizzi inventati. Nessuna lettura di account, cartelle clienti o siti esterni.

## Capacità aggiunta

Il socio può registrare e aggiornare l'indirizzo pubblico di ciascuno dei sei canali, con URL della fonte e conferma esplicita dell'attività. Ogni modifica conserva una versione immutabile; una scheda obsoleta non sovrascrive una modifica successiva. L'audit registra autore, attività, canale e versione, senza ripetere gli URL.

L'API rilegge ruoli e attività correnti: soci per la scrittura, cliente soltanto per la lettura della propria attività, collaboratore escluso dal percorso Profili provvisorio. La nuova pagina non viene aggiunta al menu cliente prima del giro dedicato. Link personali LinkedIn rifiutati; validazione conservativa degli URL senza richieste ai siti. Salvare un link non certifica proprietà, contenuto o corrispondenza: la verifica indipendente di T5 resta distinta dalla dichiarazione manuale del socio.

La griglia apre un solo canale alla volta. Il dettaglio distingue indirizzo registrato da account ancora da collegare. Fonte e data riguardano l'inserimento manuale; non sono una data di acquisizione delle metriche. Google Business Profile contiene lo spazio Recensioni, con assenza esplicita dei dati.

## Limiti ancora aperti

- FUN-012 resta parziale: mancano fornitori, dati reali, sincronizzazione, confronto con i canali e collaudo autorizzato.
- FUN-013 resta parziale: lo spazio è dentro GBP, ma non si possono ancora leggere recensioni acquisite dal fornitore. Non vengono usate recensioni AI o valori zero inventati.
- COL-002 resta da fare: nessun aggiornamento giornaliero o pulsante che simuli una sincronizzazione riuscita.
- Nessun dato reale inserito e nessun rilascio; T5, T6 e il giro cliente restano da svolgere.

## Riallineamento della mappa

Controllo indipendente del codice precedente, confrontato con il criterio di ogni riga. Queste voci erano ancora aperte nella mappa nonostante la modifica locale già presente; nessuna viene presentata come collaudata sul server.

| Riga | Evidenza locale |
|---|---|
| UI-005 | Il percorso Mappa agenzia porta ad Avanzamento; vecchio pulsante DEMO fuori dalla navigazione. `tests/operational-labels-ui.test.js`. |
| UI-007 | Sei canali aziendali in Profili; niente canali personali dei soci. Il nuovo salvataggio LinkedIn ammette solo pagine aziendali. |
| FUN-011 | Menu Profili al posto di Marketing BigAnt; alias della vecchia pagina. `tests/workspace.test.js`. |
| FUN-016 | Vecchia pagina Marketing e relativi riquadri non raggiungibili. Codice conservato secondo D-05. |
| FUN-020 | Home con schede azionabili; Da approvare apre lo Sciame. Vecchia pagina Direzione reindirizzata. |
| FUN-021 | Avviso contratti in Clienti, con soglia 30 giorni provata in `tests/workspace.test.js`; incassi e cassa in Fatturazione. |
| DAT-002 | Trello dichiarato registro ufficiale in `src/billing.js`, provato in `tests/billing.test.js`. `sourceConnected:false`: la lettura Trello rimane lavoro di COL-001. |

## Esiti

- **38 nuove prove**: 18 del dominio (`profile-directory`), 5 HTTP con il gestore effettivo del server (`profiles-http`), 15 della UI (`profiles-ui`). Coprono ruoli correnti, isolamento, URL e parametri non consentiti, atomicità in caso di audit fallito, storico immutabile, conflitti, blocco dei falsi stati collegati, CSRF/origine e cambi di contesto durante le richieste.
- Controllo progetto **5/5**: 125 file JavaScript, 76 documenti, 150 collegamenti locali, 27 servizi/8 reparti/32 agenti e 4 dipendenze fissate. Log `.cache/profiles-check.log`.
- Suite completa: **581/581**, nessuna prova saltata o fallita. Log `.cache/profiles-full.log`; HTTP e Avanzamento insieme 12/12 in `.cache/profiles-http.log`.
- Browser su archivio inventato in memoria: aggiunto e modificato il sito di Bottega Aurora DEMO, fonte/data visibili, account ancora scollegato; Studio Orizzonte DEMO conserva la propria scheda vuota. Google Business Profile contiene Recensioni senza dati inventati.
- Desktop e larghezza 390 px: nessuna eccedenza orizzontale, dialogo 356 px. Nessun errore console osservato. Schermate nella cache tecnica: `bigant-profiles-final.png`, `bigant-profiles-form-mobile.png`, `bigant-profiles-google-mobile.png`.
- Revisione indipendente statica senza ulteriori difetti concreti individuati. Corrette le fixture HTTP iniziali: usavano il suffisso riservato `.example`, rifiutato dalla validazione conservativa; ora usano sottodomini inventati di `example.com` e `example.org`, senza visitarli.
- Copertura riordino: **59 implementate localmente, 14 parziali, 19 da fare**. Sette righe riallineate a capacità precedenti verificate; FUN-013 passa da da fare a parziale, senza dichiarare recensioni operative. Nessuna percentuale di completamento dell'intero brief.
