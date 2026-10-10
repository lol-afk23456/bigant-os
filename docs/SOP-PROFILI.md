# Profili pubblici di agenzia e clienti

Versione 1 · 10 ottobre 2026 · FUN-012, UI-007, FUN-013. Procedura locale: nessun account collegato, dato acquisito dal web o aggiornamento esterno.

## Scopo e responsabilità

Un'unica scheda per canale dell'attività selezionata: Instagram, Facebook, LinkedIn aziendale, TikTok, Google Business Profile e sito. Solo un socio può registrare o aggiornare un indirizzo pubblico, indicando la fonte e confermando che appartenga all'attività. Questa dichiarazione manuale non sostituisce la verifica indipendente prevista da T5. I collegamenti personali LinkedIn non sono ammessi.

La presenza di un indirizzo non equivale a un account autorizzato: lo stato rimane **Da collegare**, metriche e ultima sincronizzazione restano assenti. Google Business Profile ospita lo spazio Recensioni, che dichiara i dati mancanti fino al collegamento e al collaudo del fornitore. Nessun numero zero usato al posto di un dato non acquisito; nessuna recensione generata o copiata dagli output AI.

## Flusso

1. Selezionare l'attività e un canale dalla griglia.
2. Inserire l'indirizzo pubblico e l'URL della fonte. Niente accessi riservati, token o password. Confermare la corrispondenza con l'attività selezionata.
3. Il server rilegge utente e attività: socio attivo, identità umana e attività attiva; controlla URL, canale, conferma e versione corrente. Una modifica concorrente richiede di riaprire la scheda, senza sovrascrivere.
4. Salvare la nuova versione, conservando la precedente e registrando autore, canale e versione nell'audit. Nessuna cancellazione, richiesta al sito o autorizzazione OAuth.
5. Mostrare il link e la fonte, data e natura manuale dell'inserimento. L'apertura esterna è una scelta dell'utente, con isolamento della finestra e senza referrer.

## Contratto e limiti

- GET `/api/workspace/profiles?clientId=…`: sei canali fissi. Per ciascuno `id`, `name`, `status`, `lastSync`, `metrics`, `reviews`, `link`. `link` è nullo oppure `{url, sourceUrl, version, updatedAt, confirmation: 'owner'}`. Risposta con `clientId` e `canEdit`.
- PATCH `/api/workspace/profiles/:channel?clientId=…`: `{version, url, sourceUrl, confirmedBusiness: true}`; versione 0 per il primo inserimento. Restituisce la stessa vista aggiornata. Niente parametri per dichiarare account collegati, metriche o recensioni.
- Lettura riservata ai soci e al cliente della propria attività; collaboratori esclusi da Profili secondo il menu provvisorio. Il giro cliente resta necessario prima di aggiungere questa pagina al suo menu.
- URL HTTPS pubblici con limiti di lunghezza; vietati credenziali incorporate, host locali/privati e porte non standard. I canali social accettano solo i loro host e percorsi di profilo; LinkedIn solo `/company/…`. Query e frammenti non necessari non vengono accettati. Non si risolvono redirect o DNS: un URL formalmente valido non dimostra proprietà o contenuto.
- La schermata di modifica conserva cliente, canale e versione di apertura. Se si cambia attività, pagina o sessione non deve salvare in un contesto diverso.
- Non importare dati reali durante queste prove. Il nuovo flusso non autorizza T5 o T6.

## Verifica richiesta

Permessi HTTP e diretti, isolamento clienti, disattivazioni e cambio ruolo, validazione URL e conferma, conflitti di versione e storico, audit privo di URL, nessuna scrittura alla consultazione. Prova interfaccia di inserimento/modifica, fonte visibile, mancato salvataggio dopo cambio contesto, messaggi senza dati inventati e finestra mobile. Suite completa e controllo progetto.
