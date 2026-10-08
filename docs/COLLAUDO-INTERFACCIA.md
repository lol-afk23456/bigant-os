# Collaudo dell’interfaccia BigAnt OS

## Revisione dopo l’audit di copertura — 8 ottobre 2026

Questa estensione segue il salvataggio di `docs/VERIFICA-COPERTURA-BRIEF.md` (audit `1635c8e`) e riguarda la **struttura visibile dell’intera agenzia**. Aggiungere schede e spazi non completa i requisiti operativi del brief e non aumenta automaticamente la percentuale di funzionalità realizzate.

I precedenti risultati R/F/B e il congelamento delle 09:56:43 UTC, riportati più sotto, descrivono la versione precedente. **Non sono prove di funzionamento delle nuove viste.** Per questa revisione sono stati eseguiti soltanto lettura del contratto effettivo in `src/agency/`, confronto statico dei campi consumati dall’interfaccia e `node --check public/app.js`, passato. Nessun browser, rete, deploy, commit o collaudo mobile/fotocamera è stato eseguito da questo agente nella revisione. Le prove browser finali spettano al coordinatore.

### Nuova copertura dell’interfaccia

| Spazio / navigazione | Fonte API | Cosa espone | Prova e limite |
|---|---|---|---|
| Mappa agenzia, ingresso dei soci (`#agency`) | `GET /api/agency/state` | Otto reparti, 32 specialisti descritti, 27 servizi, dieci moduli gestionali e nove fondamenta secondo il registro. Reparti e contratti degli specialisti espandibili; input, output, inneschi, controlli, errori e perimetro locale. | Corrispondenza statica con i campi del backend. Nessuna esecuzione o attivazione dai nuovi pannelli. |
| Dieci moduli del gestionale nella mappa | `state.management` | Anagrafiche; commerciale/contratti; fatturazione/incassi; scadenziario; cassa/prima nota; costi; lavoro/marginalità; task/consegne; documenti; direzione. Ogni scheda distingue parte disponibile e mancanze. | Link alla vista esistente soltanto quando il registro ne indica una. Documenti resta struttura, senza pulsante che simula un archivio. |
| Fondamenta nella mappa | `state.foundations` | Onboarding, portfolio/autorizzazioni, capacità, obiettivi, KPI, pacchetti, pacchetto commercialista, spese insolite, custodia collegamenti. | Sezioni dichiarate «Solo struttura». Nessun archivio o operazione fittizia introdotti dalla UI. |
| Regia e contratto orchestratore | `state.orchestrator` più viste esistenti | Ciclo, coda, esecuzione locale, approvazioni, errori e limite condiviso. | Le nuove schede leggono. I comandi già presenti restano in Sciame; nessun nuovo comando agente. |
| Marketing BigAnt (`#marketing`) | `GET /api/agency/marketing` | Nove canali previsti, dieci aree, memoria, lavori e contenuti del cliente zero, assenza dichiarata di obiettivi registrati. | L’API vincola BigAnt; il selettore cliente è sostituito da un contesto fisso. «Apri lavori BigAnt» passa il `clientId` restituito dal server alla vista operativa esistente. Nessuna riscrittura di memoria dalla nuova vista. |
| Servizi (`#catalog`) | Soci: `GET /api/agency/state`; altri: `GET /api/agency/dashboard` | Catalogo ricercabile per i soci; solo servizi acquistati per cliente/team. | Schede con stati del registro. Servizi esclusi restano consultabili dai soci con motivo dell’esclusione. |
| Workspace unico di servizio (`#service:…`) | `GET /api/agency/services/:id?clientId=…` | Sezioni specifiche, lavori, contenuti, approvazioni, fonti e specialisti dello stesso cliente/servizio. | Mapping statico: i soci ricevono il contratto completo; cliente/team il DTO ridotto con `agentNames`, senza contratti/permessi amministrativi. Nessuna copia o secondo archivio. |
| Dashboard cliente | `GET /api/agency/dashboard` e `/api/overview` | Sezioni previste dal brief, incluse quando pertinenti ai servizi acquistati; collegamenti ai workspace. Contenuti da approvare, richieste e materiali continuano a usare i dati comuni. | Sostituita la precedente lista fissa di sei schede con le sezioni filtrate dal server. Fonti non collegate e parti mancanti esplicite; nessun KPI inventato. |

Le etichette **Solo struttura**, **Flusso DEMO parziale**, **Fonte non collegata** ed **Escluso** mantengono significati distinti. «32 specialisti descritti» non significa 32 agenti funzionanti; avere un workspace video, eventi, drone o Video AI non significa eseguire automaticamente quel servizio.

Le schede pubbliche al cliente mostrano soltanto consegne, disponibilità parziale, mancanze, sezioni e nomi degli specialisti autorizzati dal DTO. Non vengono mostrati nomi di tabelle, identificativi interni, percorsi di codice o file di configurazione. I collegamenti operativi presenti aprono viste già esistenti; non introducono pulsanti di pubblicazione, attivazione, collegamento account o generazione inesistente.

### Smartphone e limiti di verifica della revisione

Il CSS prevede schede impilate, dettagli espandibili, testo che va a capo, collegamenti ampi e chiusura esplicita del menu mobile. La mappa non richiede un organigramma largo da trascinare. Questa è **predisposizione del layout**, non una prova su smartphone. Restano da verificare visualmente apertura di tutti i pannelli, navigazione tastiera, focus, contrasto, layout a 360/390 px e percorsi dei tre ruoli. Nessuna prova camera o provider esterno è stata aggiunta.

I contratti delle nuove API sono di sola lettura. Restano mancanti gli specialisti esecutivi pianificati, dataset di canale, obiettivi/KPI operativi, autorizzazioni portfolio applicative, capacità del team, archivio documenti completo, collegamenti provider e autonomia cloud. Queste carenze sono rese visibili dalla nuova struttura, non dichiarate risolte.

---

## Verifica browser del coordinatore dopo la struttura completa

Eseguita sull’anteprima locale, senza dati reali o provider. A 1440×1000: ingresso Mappa, apertura reparto Produzione e contratto Coordinatore eventi, workspace Eventi con acquisto assente dichiarato, selezione Bottega e successivo Marketing ancora fissato a BigAnt. A 390×844: Marketing, menu, uscita/cambio profilo, Cliente Aurora e workspace Social. Nessuno scorrimento orizzontale del documento rilevato nelle viste marketing e cliente controllate (larghezza documento 390 px).

Nel cliente Aurora sono visibili soltanto quattro servizi acquistati e le sezioni pertinenti; la pubblicità non acquistata, Mappa, Marketing e Amministrazione sono assenti. I contratti interni e i costi non sono restituiti nel DTO del workspace cliente. I dati di lavoro provengono dal cliente comune; gli obiettivi marketing e le metriche dei canali restano vuoti.

Nel controllo telefono è emersa l’assenza del cambio profilo nella barra compatta: aggiunti Aggiorna e Cambia profilo nel menu, provato il cambio al profilo cliente. Questa prova riguarda le nuove viste e la navigazione citata, non tutti i moduli su dispositivi fisici, tutte le dimensioni, tastiera o accessibilità completa. Nessuna nuova prova fotocamera/Wallet/provider.

I controlli server della nuova struttura sono **11/11** e la suite completa aggiornata **114/114**. La revisione indipendente ha corretto trigger futuri presentati come configurabili, stati ottimistici di Documenti/Obiettivi e sezione contatti per Centralino AI.

## Collaudo della versione precedente

Data: 8 ottobre 2026. Ambito: prototipo DEMO locale, con un server, una sessione e un database comune. Nessun account esterno o dato di produzione è stato utilizzato per questi controlli.

L’interfaccia è italiana, usa il logo BigAnt, arancione `#F26B21`, nero `#141413` e sfondi chiari. Le operazioni scrivono nelle API del server; lo stato di lavoro non è conservato in `localStorage`. Le sorgenti originali Growth e Fidelity restano separate e non vengono modificate dalla UI di OS.

## Evidenze e significato degli esiti

- **Sintassi:** controllo JavaScript di `public/app.js` passato dopo l’ultima modifica.
- **R — rendering in processo:** generate le 13 viste con gli stati dei moduli reali e SQLite in memoria, senza errori JavaScript. Il DOM è simulato: questo verifica la composizione delle viste, non impaginazione, focus o interazioni di un browser.
- **F — form verso modulo:** invocati i gestori effettivi dei form con dati DEMO; le richieste sono state inoltrate ai moduli reali sulla stessa connessione SQLite in memoria. Verificati risultati persistiti, non soltanto il payload. Questo non sostituisce il click e la validazione HTML nel browser.
- **C — copertura server:** test automatici del relativo modulo. Rieseguiti qui **70/70 test** di Growth, Fidelity e Amministrazione, tutti passati. Il coordinatore ha inoltre comunicato **99/99 test dell’intero progetto e controllo progetto PASS**; l’esito complessivo appartiene al suo collaudo.
- **B — browser del coordinatore:** prove descritte nella sezione seguente, comunicate dal coordinatore. Non tutti i form della matrice sono stati cliccati nel browser.
- **P — presente:** percorso UI e corrispondente API rilevati nel codice. Non significa prova browser individuale completata.

### Prove nel browser comunicate dal coordinatore

1. Ricerca Growth: aggiunte cinque aziende DEMO e avviata l’analisi automatica.
2. Fidelity: accredito verificato con saldo da **4 a 5**.
3. QR Fidelity: immagine PNG caricata con dimensione naturale **280 px** e apertura della tessera pubblica.
4. Social: esecuzione agente → approvazione → richiesta di modifiche → feedback registrato.
5. Apertura delle pagine Clienti, Lavori, Catalogo, Collegamenti e Accessi senza errori di console osservati.
6. Accesso come cliente Aurora: navigazione limitata al ruolo.

Queste prove riguardano la sessione desktop del coordinatore. **Non è stata provata la lettura con fotocamera, né una tessera Apple/Google, né un dispositivo mobile.** Il tentativo di cambiare viewport non ha prodotto una vista mobile: la larghezza è rimasta 1280 px. Le ultime estensioni dei form sono coperte dalle verifiche F sotto, non da una rivendicazione di prova browser completa.

## Sessioni, accessi e anagrafica comune

Le mutazioni private inviano `X-CSRF-Token`; il server verifica sessione, origine, ruolo e cliente indipendentemente dalla UI. Il selettore attività aggiunge `clientId` alle richieste. La decisione su un’approvazione globale usa il cliente dell’approvazione, anche quando è diverso da quello selezionato.

| Azione UI | API | Verifica / limite |
|---|---|---|
| Scegli profilo DEMO, esci | `GET /api/session`, `POST /api/demo/login`, `POST /api/logout` | P, B accesso cliente; C in `core.test.js` per cookie, Origin, CSRF e logout. Nessuna password necessaria ai profili fixture. |
| Accedi con utente creato nel prototipo | `POST /api/login` | P; test HTTP in `core-review.test.js`, inclusa conservazione degli spazi della password. Nessuna credenziale reale usata. |
| Accessi: elenco e assegnazioni | `GET /api/users` | R, B pagina; solo soci. |
| Crea utente DEMO, ruolo e attività assegnate | `POST /api/users` | P; campo password vuoto da compilare, email `.example`; non sono state create password durante il collaudo UI. |
| Nuova password, disattiva/riattiva utente | `PATCH /api/users/:id` | P; C invalidazione sessioni. Reset personale riporta al login; non si disattiva il proprio accesso. |
| Elenco/selezione clienti | `GET /api/overview?clientId=…` | R, B; server limita il cliente alla propria attività e il collaboratore alle assegnate. |
| Nuova attività con servizi | `POST /api/clients` | P; anagrafica comune, non un cliente separato per ogni modulo. |
| Modifica servizi acquistati e rischio relazione | `PATCH /api/clients/:id` | P; C servizi rimossi nascosti anche nelle API cliente. Il form non modifica gli altri campi anagrafici. |
| Vista cliente e schede dei servizi attivi | `GET /api/overview` | R, B ruolo; fonti marketing scollegate mostrate con trattino, non con risultati inventati. |
| Chiedi all’agenzia, eventualmente apri lavoro | `POST /api/production/ask` | P; riepilogo deterministico sui dati del cliente, non un modello AI collegato. |
| Report cliente | `overview.memory` filtrata dal server | R; una modifica interna della memoria non diventa automaticamente un report pubblico. C in `core-review.test.js`. |
| Approvazioni comuni: approva, rifiuta, chiedi modifiche | `POST /api/approvals/:id?clientId=…` | P, B contenuto; C isolamento, stato e versione. Il socio vede la coda globale, gli altri la coda consentita. |
| Registro comune e ricerca testuale | `overview.activity` / `overview.agency.activity` | R; soci elenco globale, altri filtro del server. Il contenuto economico resta riservato. |

## Produzione, memoria e calendario

| Azione UI | API | Verifica / limite |
|---|---|---|
| Crea idea/contenuto | `POST /api/production/contents` | P; servizio attivo obbligatorio, fonte e testo registrati. |
| Modifica testo/titolo | `PATCH /api/production/contents/:id` con versione | P; C versione vecchia rifiutata, approvazione precedente invalidata. |
| Inizia produzione e chiedi approvazione | Stessa PATCH, cambio stato | P, B flusso social; niente passaggio automatico a pubblicato. |
| Pianifica una versione approvata | Stessa PATCH, `state=PROGRAMMATO`, `scheduled_at` ISO | P; C data futura e approvazione della versione. La UI dice **Pianificato in DEMO**. |
| Togli dal calendario | Stessa PATCH, `state=APPROVATO` | P; rimuove soltanto la data locale. |
| Calendario mensile reale | `overview.contents.scheduled_at` e `overview.tasks.due` | R; giorni del mese effettivo, selettore mese, consegne e contenuti salvati. Orari nel fuso del dispositivo. Nessun calendario social remoto. |
| Nuovo lavoro con responsabile e minuti previsti | `POST /api/production/tasks`; soci leggono anche `/api/users` | F; il form invia l’ID della persona, necessario al raccordo con le tariffe. Collaboratore può selezionare sé stesso. |
| Aggiorna stato e minuti effettivi | `PATCH /api/production/tasks/:id` | F; conteggio ore collegato alla stessa attività. |
| Apri/modifica DNA, master, strategia, feedback, report | `POST /api/production/memory` | F DNA; versioni conservate e visibilità interna. |
| Leggi versioni precedenti | `GET /api/production/memory/history` | F; usa `recorded_at`, fonte, testo e numero versione. |
| Esporta memoria | `GET /api/production/memory/export` | F contenuto Markdown; pulsante download presente, salvataggio del file nel browser non provato qui. Memoria amministrativa esclusa. |

Le date inserite nei campi `datetime-local` vengono convertite in ISO prima dell’invio. Le date di contenuti, scadenze dei programmi e preparazione delle campagne non sono etichette decorative: sono persistite. Le scadenze dei lavori usano le ore 18 del dispositivo; il calendario prenotazioni Growth usa Europe/Rome.

## Growth e ricerca clienti

Base API della tabella: `/api/growth`. Il modulo è riservato ai soci; i percorsi pubblici sono esposti dal front controller solo per i flussi autorizzati della DEMO.

| Azione UI | API relativa | Verifica / limite |
|---|---|---|
| Radar: cerca aziende DEMO | `POST /jobs` research, `/jobs/run`, eventuale `/settings` per pausa | B cinque aziende e analisi; C ricerca/qualificazione/costo zero senza fetch. Non trova aziende reali. |
| Aggiungi azienda | `POST /leads` | P; C deduplica dominio/email e validazione. Solo contatti `.example`. |
| Scheda: pipeline, referente, email, consenso/prova, valore, note | `PATCH /leads/:id` | P; C consenso revocato al cambio email. Valore in centesimi tramite conversione esatta. |
| Analizza e prepara prima bozza | `POST /jobs`, tipi analyze/draft | P, B analisi; C fonte/punteggio, coda e approvazione comune. |
| Apri/modifica/approva/annulla messaggio | `PATCH /messages/:id` | P; C testo/versione, consenso e socio. La bozza resta locale. |
| Simula invio approvato | `POST /simulate/messages/:id/send` | P; C idempotenza e gate. Stato **Invio simulato**, nessuna email. |
| Simula risposta e prepara replica | `POST /simulate/incoming`, job draft con incomingId | P; C correlazione, deduplica, stop follow-up e rifiuti. |
| Verifica esito messaggio incerto | `POST /jobs` reconcile | P; C riconciliazione senza reinvio. |
| Interrompi contatti | `POST /leads/:id/suppress` | P; C esclusione e annullamento messaggi pendenti. |
| Trasforma lead in cliente | `POST /leads/:id/convert` | P; C unica anagrafica OS, provenienza e conversione ripetuta senza duplicati. |
| Genera link, scegli slot, prenota | `POST /booking-link`, `GET/POST /public/book/:token` | P; C token monouso, conflitti, orari e scadenza. Appuntamento locale senza invito Google. |
| Annulla appuntamento | `POST /meetings/:id/cancel` | P; C annullamento locale. |
| Verifica appuntamento incerto | `POST /jobs` reconcileMeeting | P; C riconciliazione senza doppio evento. |
| Importa testo CSV | `POST /import` | P; C massimo 200 righe, import parziale/errori per riga. La UI gestisce virgole e virgolette, non file XLSX. |
| Esporta CSV | `GET /export` | P; C quoting e neutralizzazione formule. Download browser non provato qui. |
| Pausa, esegui prossima attività, riprova errore | `/settings`, `/jobs/run`, `/jobs/:id/retry` | P; C pausa, ripartenza e retry. Errori visibili. |
| Impostazioni: settore/zona/offerta, limiti e bozze automatiche | `POST /settings` | P; i limiti sono ricontrollati dal server. Invii automatici disabilitati. |
| Disponibilità e seguito: durata/orari/giorni/massimo | `POST /settings` | P; finestra Europe/Rome, durata tra quelle ammesse, massimo due follow-up. |
| Attiva modulo analisi DEMO con informativa | `POST /settings` | P; richiede link privacy prima dell’abilitazione. Nessuna pagina pubblicata online. |
| Richiesta analisi pubblica e disiscrizione | `GET/POST /public/inquiry`, `POST /unsubscribe/:token` | P; C richiesta distinta dal marketing e token. Pagine `/growth/inquiry` e `/growth/unsubscribe/:token`. |

Lo scheduler può produrre bozze di seguito, mai approvarle. I job specializzati sono visibili nello Sciame insieme a quelli centrali; restano nella stessa connessione SQLite. La pagina Growth si aggiorna ogni otto secondi solo quando non si sta compilando un campo e non è aperta una finestra.

## Fidelity

Base API: `/api/fidelity`. Il cliente gestisce soltanto il proprio programma; il collaboratore assegnato usa lettura, scanner e accredito/riscatto. Campagne, modifica programmi, esportazione e storni richiedono il gestore.

| Azione UI | API relativa | Verifica / limite |
|---|---|---|
| Dashboard programmi, iscritti, premi e consensi | `GET /state` | R; contatori SQLite DEMO, wallet sempre scollegati. |
| Crea programma timbri/punti/coupon | `POST /programs` | P; C regole dei tre tipi. |
| Modifica nome/premio/colore/descrizione/coefficiente/scadenza/stato/sede | `PATCH /programs/:id` | F; C soglia immutabile dopo prima iscrizione. UI modifica la prima sede e conserva le altre, non offre un editor multisede completo. |
| Carica logo | `POST /programs/:id/logo`, immagine `/branding/:id.png` | P; C decodifica, sanificazione e permessi. UI allineata al massimo 512 KiB; limite 2 milioni di pixel validato sul server. |
| Regolamento e informativa | `PATCH /settings/policies` | F; documenti di prova, da verificare prima dell’uso reale. |
| QR e link di iscrizione | `GET /programs/:id/qr`, pagina `/fidelity/join/:slug` | P; C PNG e isolamento in `core.test.js`; QR effettivo generato dal server. |
| Iscrizione pubblica e termini | `GET/POST /public/join/:slug` | P; C accettazione termini e duplicato senza esporre token esistente. |
| Crea/modifica iscritto e consenso | `POST /members`, `PATCH /members/:id` | P; C validazione e isolamento. Dati inventati. |
| Tessera web, saldo, premio, QR | `GET /public/cards/:token`, `/public/cards/:token/qr` | B tessera pubblica e PNG; C nessun contatto/ledger esposto. Il token resta un collegamento riservato alla tessera. |
| Cambia consenso dalla tessera | `PATCH /public/cards/:token/consent` | P; C revoca registrata e blocco consegne pendenti. |
| Cerca tessera con codice/URL | `POST /scan` | P; C URL del proprio server e isolamento attività. |
| Fotocamera QR | Browser `BarcodeDetector`/`getUserMedia`, poi `/scan` | P soltanto: rilevamento compatibilità e alternativa manuale. **Fotocamera e dispositivo non collaudati.** |
| Accredita timbri/punti o spesa in euro | `POST /members/:id/transactions` | B saldo 4→5; C saldo, centesimi, idempotenza. Il coefficiente viene applicato sul server. |
| Riscatta premio/coupon | Stessa POST, type redeem | P; C costo imposto dal server, coupon monouso e saldo mai negativo. |
| Storna operazione motivata | `POST /transactions/:id/reverse` | P; C storno unico e atomico, controllo saldo. |
| Esporta iscritti | `GET /members/export` | P; C CSV e permessi. Download browser non provato qui. |
| Crea campagna e data di preparazione | `POST /campaigns` | F; nessuna consegna esterna. La data riguarda la preparazione locale. |
| Anteprima destinatari | `GET /campaigns/:id/preview` | P; C destinatari solo opt-in. |
| Prepara e sottoponi ad approvazione | `POST /campaigns/:id/prepare` | P; C coda comune, consegne bloccate e zero invii. |
| Approva/rifiuta/richiedi modifiche | Route globale `/api/approvals/:id` → `/campaigns/:id/decision` | P; C socio/cliente corretto, versione e feedback. |
| Rivedi bozza rifiutata o da correggere | `PATCH /campaigns/:id` | F; C nuova versione e nuova approvazione. Approvate/in revisione non riscrivibili. |
| Regola ritorno inattivi, pausa e preparazione | `POST /automations`, `PATCH /automations/:id`, `POST /automations/:id/run` | P; C anzianità, consenso e cooldown. Coda sempre bloccata verso Wallet. |
| Stato job Fidelity | `state.jobs` e `/api/agents/state.moduleJobs` | R; provider scollegato spiegato. Retry esterno non presentato come azione disponibile. |

## Amministrazione, ore e controllo

Base API: `/api/administration`. Solo soci. Ogni form finanziario invia una chiave di idempotenza conservata per l’invio del form. Le due ditte e i relativi conti sono distinti.

| Azione UI | API relativa | Verifica / limite |
|---|---|---|
| Saldi, incassi, arretrati, proiezioni 30/60/90 | `GET /state` | R; C dati reali della DEMO e assunzioni esplicite. Nessun saldo bancario importato. |
| Nuovo conto e saldo iniziale | `POST /accounts` | P; C data effettiva/centesimi. Nessun collegamento bancario. |
| Nuova controparte cliente/fornitore/collaboratore/titolare | `POST /counterparties` | P; C collegamento all’anagrafica comune. |
| Contratto con servizio/importo/scadenza/preavviso | `POST /contracts` | P; C modello comune. Firma e documento originale non caricati dalla UI. |
| Bozza fattura, importo e scadenza | `POST /invoices` | P; C residui e pagamenti parziali. Nessun SDI. |
| Scadenza o compenso | `POST /obligations` | P; C categorie ammesse e controparte coerente. Accantonamenti fiscali non inventati. |
| Abbonamento mensile/annuale | `POST /subscriptions` | P; C fornitore, importo e rinnovo. |
| Incasso/spesa/prelievo con riferimento | `POST /movements` | F; C prima nota immutabile, date, ditta/conto, documento, doppioni. |
| Collega fattura, scadenza o abbonamento al movimento | Stessa POST | P; la selezione compila ditta/controparte/importo e azzera gli altri collegamenti. C rifiuto dei collegamenti incompatibili e del doppio saldo. |
| Trasferimento interno tra conti della stessa ditta | `POST /transfers` | P; C entrambe le scritture atomiche, nessun ricavo/costo artificiale. |
| Storna con motivo e documento | `POST /reversals` | F; C originale conservato, storno speculare una sola volta, trasferimento stornato su entrambi i conti. |
| Rettifica importo/conto/categoria/metodo | `POST /corrections` | F; C storno e sostituzione atomici, ditta invariata. Non modifica il documento/cliente originariamente collegato. |
| Conferma rettifica di periodo chiuso nel nuovo periodo | `allowClosedPeriodAdjustment` nei form precedenti | P; C consenso esplicito, data nel periodo aperto, originale chiuso invariato. |
| Quadra conto/mese, registra differenza, eventuale chiusura | `POST /reconciliations` | P; C mese concluso, differenza zero per chiudere, retrodatazione bloccata. |
| Ricalcola anomalie e registra verifica motivata | `POST /analyze`, `PATCH /anomalies/:id` | P; C nessuna correzione automatica dei conti. Risoluzione con nota. |
| Conferma tariffa per ditta/cliente/persona/servizio | `POST /hourly-rates` | F; C conferma esplicita e costo in centesimi. Distinzione tra ore interne e compensi già nei movimenti. |
| Attribuisci lavoro e tariffa coerente | `POST /work-allocations` | F; C corrispondenza cliente/persona/servizio, validità e nessun doppio conteggio. UI propone i lavori dell’attività selezionata. |
| Leggi ore, margine stimato e consuntivo gestionale | `state.margins`, `hourlyRates`, `workAllocations` | R, F dati; C ore arrotondate e compenso non contato due volte. Trattino se incompleto; non è utile fiscale o margine completo per competenza. |

### Correzione degli importi nell’interfaccia

I form convertono euro testuali in centesimi interi separando parte intera e decimale. Non si usa il semplice prodotto in virgola mobile. Verificati **16 casi**, compresi `0.01 → 1`, `1.01 → 101`, `19.99 → 1999`, `32.55 → 3255`, virgola italiana, importi negativi dove consentiti e limite degli interi sicuri. Rifiutati input vuoto, esponente, tre decimali, separatori ambigui e superamento del limite. I server applicano poi i propri limiti e segni consentiti.

Il collaudo F ha inoltre registrato 10,01 €, rettificato a 8,55 € e stornato il sostitutivo, verificando il ledger effettivo. Per le ore ha creato un lavoro, una tariffa di 21,11 €/ora e l’attribuzione coerente allo stesso utente.

## Sciame, catalogo e collegamenti

| Azione UI | API | Verifica / limite |
|---|---|---|
| Direzione: sei domande, priorità e contatori agenzia | `/api/overview`, `agency`, `admin.questions` | R; aggregati dell’agenzia separati dal cliente selezionato. |
| Avvia specialista disponibile | `POST /api/agents/run` | P, B social; C coda persistente e fonte locale. Specialisti pianificati non spacciati per funzionanti. |
| Esegui giro, pausa comune, riprova job fallito | `/api/agents/tick`, `/pause`, `/jobs/:id/retry` | P; C deduplica, lease, tentativi, pausa e worker unico. |
| Crea/attiva/sospendi regola calendario o evento | `POST /api/agents/schedules`, `PATCH /schedules/:id` | P; C Europe/Rome e cambio ora in `core.test.js`. Il server locale deve restare acceso. |
| Budget comune e quote fisse | `POST /api/agents/budget` | P; C tetto di 50 €, prenotazioni di costo, nessun doppio portafoglio. |
| Risultati e fonti, coda dei moduli, avvisi errore | `GET /api/agents/state`, `overview.workerError` | R; `moduleErrors` Growth/Fidelity e worker mostrati come avvisi. |
| Aggiornamento automatico dello stato | `GET /api/overview` e stato modulo ogni 8 secondi | P; solo Growth/Sciame, fermo con dialogo/input attivo o scheda nascosta. Non modifica i dati da solo. |
| Catalogo servizi e condizioni di attivazione | `overview.registry.services` | R, B; cards distinguono disponibile, metodo, partner, escluso. Non genera nuovi connettori. |
| Collegamenti | `overview.registry.integrations` | R, B; tutti **Non collegato**. Non ci sono form per segreti o pulsanti che attivano provider. |

## Gap rispetto agli inventari: funzioni non rivendicate

Confronto con `research/GROWTH-INVENTARIO.md` e `research/FIDELITY-INVENTARIO.md`. La presenza nel sorgente originale non equivale a disponibilità completa nell’interfaccia OS.

| Area / API o capacità | Stato e limite attuale |
|---|---|
| Growth: campi avanzati anagrafica e brand | Inserimento settore/città/sito presente; il form modifica lead non espone tutti i campi PATCH, fra cui owner, settore/città e analisi manuale. Descrizione agenzia/firma/nome mittente non hanno editor UI completo. |
| Growth: email HTML | API `/brand/email-preview` presente; nessuna anteprima HTML dedicata nella UI. Il messaggio si rivede come testo. |
| Growth: sincronizzazione manuale e follow-up singolo | Job sync e draft/followup disponibili; la risposta simulata sincronizza il thread e lo scheduler prepara follow-up. Non c’è un form separato per ogni parametro di questi job. |
| Fidelity: anagrafica attività | API `/tenants` e PATCH nome/slug/settore/colore/indirizzo/sospensione presenti; UI comune crea clienti e modifica servizi/rischio, non tutti questi campi. |
| Fidelity: ricerca per segmento e trend 14 giorni | Dati/API presenti. UI mostra elenco, scanner, contatori e registro; non presenta tutti i filtri avanzati né grafico trend. |
| Fidelity: posizioni | API fino a dieci sedi; form modifica la prima conservando le altre. Nessun editor aggiungi/rimuovi sedi multiple. |
| Fidelity: anonimizzazione | `DELETE /members/:id` implementata e testata sul server, senza pulsante/form UI. Nessuna anonimizzazione eseguita dal collaudo interfaccia. |
| Fidelity: consegne e payload Wallet | API dettaglio consegne e wallet-preview presenti; UI mostra destinatari/stato e tessera web, non un ispettore completo dei payload o delle consegne per canale. |
| Fidelity: retry e rilascio Wallet | Retry esterno, Apple/Google, firma, installazione e push sono disabilitati. Non sono mancanze mascherate da simulazione riuscita. |
| Accessi: assegnazioni esistenti | Assegnazioni impostabili alla creazione. Non è presente una API/UI completa per cambiare ruolo e assegnazioni di utenti già creati. |
| Lavori: modifica assegnazione e scadenza | Il form iniziale imposta persona/data; la PATCH attuale aggiorna stato/minuti. Non c’è riassegnazione completa del lavoro esistente. |
| Amministrazione: documenti e rettifiche avanzate | Riferimenti testuali, nessun upload/firma di documenti. Rettifica UI limitata a conto/importo/categoria/metodo; cambio controparte o documento collegato non esposto. |
| Amministrazione: fiscalità e riparto completo | Nessun calcolo fiscale arbitrario, banca/SDI scollegati, costi comuni e competenza non ripartiti. |
| Backup/ripristino | Procedure e test server separati, non un form nell’app. Nessun ripristino avviato da questa UI. |
| Mobile e accessibilità | CSS responsive, focus visibile, label, dialogo e preferenza movimento ridotto presenti. Prova su telefono, lettore schermo, contrasto completo e navigazione soltanto tastiera ancora da svolgere. |
| Fotocamera | Solo implementazione con rilevamento supporto e alternativa manuale. Nessuna prova camera live. |
| Provider e affidabilità live | Nessuna prova Gmail, Google Calendar, Brave/OpenAI, Postiz, Apple/Google Wallet, API bancarie, inviti o invii reali. Il collaudo non autorizza ad attivarli. |

## Congelamento dei file pubblici

Congelamento dichiarato **2026-10-08T09:56:43Z**. Da questo punto il lavoro di questo agente riguarda soltanto il presente documento; caricamento GitHub e ultime prove sono del coordinatore. Nessun commit eseguito da questo agente.

| File | SHA-256 |
|---|---|
| `public/index.html` | `c0966c55d0522d15d874be0da493ae3589e0522fc1f753a8bbe2da130679bffb` |
| `public/app.js` | `deecf86816b71a00ca1e24a71af9f81f8ea9a0418b015c4b971836e72c32af32` |
| `public/style.css` | `1c1d8f31019a43329fd5cdbe592df1f54b56faf820806616f1d224bafa9348f5` |

Per il rilascio successivo vanno completati i gap necessari al pilota reale, ripetute le prove browser dopo eventuali modifiche e collaudati separatamente i singoli provider autorizzati. Questa matrice certifica il perimetro delle prove descritte, non la prontezza alla produzione.
