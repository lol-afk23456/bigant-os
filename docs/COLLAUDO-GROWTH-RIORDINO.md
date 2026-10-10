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

## Parti ancora da completare prima dell’attivazione

Gli adattatori **non sono importati dal server o dal motore Growth attivo**. Questo resta sui simulatori. La predisposizione non soddisfa ancora il criterio “ricerca reale con risultati veri”.

1. Collegare il vault centralizzato agli adattatori, senza introdurre nuove API che restituiscano segreti. Distinguere configurazione, collaudo e attivazione per fase e cliente.
2. Portare il motore oltre le assunzioni DEMO: fonte e data persistenti, esiti reali distinti, nessun avvio automatico degli invii. Registrare stima/costi nell’archivio comune; le stime non sono un limite garantito della fattura del fornitore.
3. Il gate `allow` dell’adattatore deve essere una verifica applicativa reale. Per Gmail deve controllare socio, approvazione della versione corrente, consenso/esclusione, limite giornaliero e richiesta manuale. Per Calendar servono invito valido, slot ricontrollato e intenzione persistita. Vietato sostituirlo con un consenso costante nel server.
4. Completare il ciclo OAuth: avvio autorizzato, stato monouso legato alla sessione, ambiti minimi, callback reale e conservazione cifrata. Il solo scambio codice implementato non è un login Google pronto.
5. Gestire nel motore gli esiti incerti e la riconciliazione senza reinvio; distinguere pausa, revoca e lavori già accodati.
6. Solo dopo chiavi, budget e autorizzazione: collaudo progressivo ricerca → AI → bozze → Gmail manuale → Calendar. Nessuna attivazione richiesta o eseguita durante questo blocco.

Anche l’importazione dei dati originali, i confronti tra applicazioni e lo spegnimento dei siti separati restano da fare. Nessun dato di produzione letto o copiato.

## Riferimenti dei protocolli

- [Brave Search: autenticazione](https://api-dashboard.search.brave.com/documentation/guides/authentication) e [ricerca web](https://api-dashboard.search.brave.com/app/documentation/web-search/codes).
- [OpenAI: output strutturati](https://developers.openai.com/api/docs/guides/structured-outputs).
- [Anthropic: output strutturati](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
- [Google: OAuth per applicazioni web](https://developers.google.com/identity/protocols/oauth2/web-server).
- [Gmail: formato del messaggio](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages).
- [Calendar: disponibilità](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query) e [inserimento evento](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert).

Documentazione consultata per il contratto delle richieste; non prova che gli account BigAnt abbiano i permessi o che un dato modello sia già stato scelto e collaudato.
