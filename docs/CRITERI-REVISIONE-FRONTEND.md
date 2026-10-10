# Criteri di revisione del frontend: fluidità e intuitività

10 ottobre 2026. Completa `docs/GUIDA-ESTETICA-FRONTEND.md`: quella dice **come appare** l'app, questo documento dice **come si usa**.

Ha due usi:
1. **Per chi sviluppa (Codex):** sono le regole da rispettare mentre si rifà l'interfaccia.
2. **Per la revisione:** quando il lavoro di Codex è finito, l'app viene analizzata con il protocollo del paragrafo 11 e la griglia del paragrafo 12. Le correzioni proposte citeranno il numero della regola (es. "regola V3").

Ogni regola indica **cosa** fare e **come si verifica**. Valgono sempre `AGENTS.md` e `CLAUDE.md`: niente rotte, permessi o effetti esterni cambiati per ragioni di interfaccia.

## 1. Le dodici regole in sintesi

1. Ogni clic ha una risposta visibile entro 100 ms.
2. Sotto 1 s nessun indicatore; oltre 1 s un indicatore; oltre 10 s avanzamento e possibilità di fare altro.
3. Niente salti di impaginazione mentre i dati arrivano.
4. Il tasto Indietro del browser, il ricaricamento e i link condivisi riportano esattamente dove si era.
5. Al massimo 6–7 voci principali; le funzioni rare restano un livello sotto.
6. Ogni azione con conseguenze lo dice, con parole del lavoro e non del codice.
7. Le azioni reversibili si annullano; si chiede conferma solo per quelle irreversibili.
8. Ogni errore spiega cosa è successo e come rimediare, vicino a dove è nato, senza perdere ciò che è stato scritto.
9. Chi usa l'app ogni giorno lavora anche da tastiera e passa da un elemento al successivo senza tornare indietro.
10. Dal telefono le azioni principali stanno sotto il pollice; nessuna funzione dipende dal passaggio del mouse.
11. Testi in italiano semplice: verbo + oggetto sui pulsanti, una parola per ogni concetto.
12. Ogni vista ha i suoi sette stati disegnati: caricamento, vuoto, errore, parziale, pieno, accesso negato, non collegato.

## 2. Velocità percepita (V)

| # | Regola | Come si verifica |
|---|---|---|
| V1 | **Risposta entro 100 ms** a ogni clic o tasto: stato premuto del pulsante, riga selezionata, voce di menu attiva. Sotto 0,1 s l'interfaccia sembra istantanea; fino a 1 s il filo del pensiero regge; oltre 10 s l'attenzione si perde ([NN/g](https://www.nngroup.com/videos/3-response-time-limits-interaction-design/), [Nielsen](https://jakobnielsenphd.substack.com/p/time-scale-ux)). La soglia di Doherty indica 400 ms come limite per un dialogo fluido ([Laws of UX](https://lawsofux.com/index.md)); chi punta all'eccellenza lavora sotto 100 ms ([Superhuman](https://blog.superhuman.com/superhuman-is-built-for-speed/)) | Registrazione delle prestazioni nel browser: nessun clic senza cambio visivo entro 100 ms |
| V2 | **Indicatori proporzionati all'attesa.** Sotto 1 s nessun indicatore. Per caricamenti di pagina o di elenchi: sagome grigie (skeleton) con la forma del contenuto finale. La rotella solo per azioni che bloccano (salvataggio, accesso) tra 2 e 10 s. Oltre 10 s percentuale o fasi ("Agente al lavoro · passo 3 di 7") ([NN/g](https://www.nngroup.com/videos/skeleton-screens-vs-progress-bars-vs-spinners/)) | Rete rallentata nel browser ("Slow 4G"): ogni attesa sopra 1 s mostra un indicatore adatto |
| V3 | **Interaction to Next Paint ≤ 200 ms**, Largest Contentful Paint ≤ 2,5 s, Cumulative Layout Shift ≤ 0,1 ([corewebvitals.io](https://corewebvitals.io/core-web-vitals)) | Lighthouse in locale, desktop e mobile |
| V4 | **Nessun salto di impaginazione**: spazio riservato per numeri, tabelle e immagini prima che arrivino i dati | CLS misurato; nessun pulsante che si sposta sotto il dito |
| V5 | **Aggiornamento ottimista solo per azioni piccole e reversibili** (cambiare stato a un lavoro, segnare come visto): l'interfaccia cambia subito e torna indietro se il server rifiuta. **Mai** per denaro, approvazioni con versione, accessi o azioni esterne: lì si aspetta la conferma del server, mostrando subito lo stato "in corso" sul pulsante ([TanStack, sintesi](https://openskillindex.com/skills/intense-visions-harness-engineering-tanstack-optimistic-updates), [DEV](https://dev.to/werliton/optimistic-updates-in-react-how-they-work-and-why-theyre-so-fast-44g7)) | Prova con server che risponde errore: lo stato torna corretto e compare un messaggio |
| V6 | **Ritorno istantaneo alle viste già aperte**: mostrare subito l'ultima versione in memoria e aggiornarla in silenzio | Mappa → Amministrazione → Mappa: la seconda apertura è immediata |
| V7 | **Precaricare la vista probabile**: dati della voce di menu al passaggio del mouse o al focus ([prerender e precaricamento](https://specification.website/spec/performance/speculation-rules/)) | Navigazione percepita sotto 100 ms sulle voci principali |
| V8 | **Gli aggiornamenti automatici non disturbano** (oggi ufficio virtuale ogni 4 s, sciame e Growth periodici): niente sfarfallio, nessuna perdita di focus, posizione di scorrimento o testo in scrittura. Si aggiorna solo ciò che è cambiato | Scrivere in un campo mentre la vista si aggiorna: il testo e il cursore restano |

## 3. Movimento (M)

| # | Regola | Come si verifica |
|---|---|---|
| M1 | **Durate:** 100–150 ms per riscontri (pressione, interruttori), 200–300 ms per cambi di stato (menu, pannelli, schede), 300–400 ms al massimo per finestre e cambio pagina. L'uscita dura circa il 75% dell'entrata ([Impeccable](https://git.secluded.site/agent-skills/blob/main/vendor/impeccable/skill/reference/motion-design.md), [Motion Grammar](https://blakecrosley.com/fr/blog/motion-grammar-when-animation-earns-its-frames)) | Nessuna animazione oltre 400 ms |
| M2 | **Curve:** ease-out in entrata; mai `linear`, tranne le barre di avanzamento. Animare solo `transform` e `opacity` | Revisione del CSS |
| M3 | **Cambio vista morbido** con la View Transitions API (`document.startViewTransition`), sempre con controllo di disponibilità e ripiego senza animazione ([Chrome](https://developer.chrome.com/blog/view-transitions-in-2025)) | Funziona in Chrome e Safari; senza supporto, nessun errore |
| M4 | **Movimento ridotto rispettato** (`prefers-reduced-motion`) | Impostazione di sistema attiva: nessuna animazione |
| M5 | **Il movimento spiega, non decora**: un elemento approvato esce dalla coda, un pannello scorre dal lato da cui arriva | Ogni animazione ha uno scopo dichiarabile in una frase |

## 4. Orientamento e navigazione (N)

| # | Regola | Come si verifica |
|---|---|---|
| N1 | **Schemi conosciuti** (legge di Jakob): menu a sinistra, ricerca in alto, azioni principali a destra del titolo, logo che porta alla pagina iniziale ([Laws of UX](https://lawsofux.com/index.md)) | Confronto con strumenti noti (Linear, Stripe, Google Workspace) |
| N2 | **Poche scelte per volta** (legge di Hick): 6 aree nel menu, al massimo un primario e due secondari per pagina; le funzioni rare in un menu "Altro" o in un secondo livello (divulgazione progressiva) ([NN/g](https://nngroup.com/articles/progressive-disclosure/)) | Conteggio di voci e pulsanti per vista |
| N3 | **Lo stato sta nell'indirizzo.** Vista, cliente selezionato, scheda, filtri e voce aperta compaiono nell'URL. Il cambio di vista crea una voce nella cronologia (`pushState`), così Indietro e Avanti funzionano; ricaricare o condividere il link riporta allo stesso punto ([deep linking](https://pattern-playground.onrender.com/patterns/deep-linking), [Dynatrace](https://developer.dynatrace.com/develop/navigation/url-sharing/)). **Oggi:** la vista è nell'hash ma con `replaceState`, quindi Indietro esce dall'app; cliente e filtri non sono nell'URL | Mappa → Amministrazione → Indietro: si torna alla Mappa. Il link copiato apre lo stesso cliente e lo stesso filtro |
| N4 | **Scorrimento ripristinato** quando si torna indietro, anche se i dati arrivano dopo | Scorrere una tabella, aprire una voce, tornare: stessa posizione |
| N5 | **Titolo della scheda del browser** aggiornato a ogni vista ("Amministrazione · BigAnt OS"); dopo il cambio vista il focus va sull'h1 e una regione `aria-live` lo annuncia ([Helsinki](https://saavutettavuusmalli.hel.fi/en/toteutus-ja-ohjelmistotestaus/single-page-applications-spas-notes-on-accessibility/)). **Oggi** il titolo non cambia mai; il focus va su `#main` | Titolo della scheda diverso per ogni vista |
| N6 | **Ricerca e comandi con Ctrl/⌘ K**: clienti, lavori, movimenti e azioni ("Registra movimento", "Avvia un giro"), ciascuno con la sua scorciatoia mostrata accanto. Sempre anche un pulsante di ricerca visibile, che sul telefono è l'unico accesso ([guida al command palette](https://skillselion.com/skills/thedaviddias/ux-patterns-for-developers/command-palette), [WebFactory](https://www.webfactoryltd.com/command-palette-ux-speeding-up-saas/)) | Ctrl/⌘ K apre, Esc chiude, il focus torna dove era |
| N7 | **Dettaglio senza perdere il contesto**: aprire un elemento di un elenco in un pannello laterale, non in una pagina nuova, quando l'utente deve tornare all'elenco | Approvare tre contenuti senza mai ricaricare l'elenco |
| N8 | **Riconoscere invece di ricordare**: selettori con ricerca, valori recenti, nomi invece di codici ([NN/g, 10 euristiche](https://nngroup.com/articles/ten-usability-heuristics/)) | Nessun campo chiede un identificativo da ricordare |

## 5. Riscontro e stato del sistema (F)

| # | Regola | Come si verifica |
|---|---|---|
| F1 | **Nessuna azione con conseguenze senza riscontro** ([NN/g](https://nngroup.com/articles/visibility-system-status)): salvato, inviato al cliente, bloccato perché non collegato | Ogni pulsante produce un esito visibile |
| F2 | **Notifiche (toast):** conferme ~5 s; gli errori restano finché non si chiudono; il timer si ferma al passaggio del mouse e con il focus; `aria-live="polite"` (assertivo solo per guasti critici); "Annulla" solo dove l'annullamento è sicuro, e mai come unica via di recupero ([Maersk](https://designsystem.maersk.com/components/toast/), [Vercel](https://vercel.com/geist/toast), [Scott O'Hara](https://www.scottohara.me/blog/2019/07/08/a-toast-to-a11y-toasts.html), [Polaris](https://polaris-react.shopify.com/components/deprecated/toast)) | Revisione del componente notifiche |
| F3 | **Contatori vivi**: approvazioni in attesa, anomalie e agenti al lavoro si aggiornano dopo ogni azione, senza ricaricare | Approvare un elemento: il contatore nel menu scende subito |
| F4 | **Sette stati per ogni vista e componente**: caricamento, vuoto (cosa manca e una sola azione), errore, parziale, pieno, accesso negato (con chi può darlo), non collegato (quale collegamento serve) | Tabella "vista × stato" compilata in revisione |
| F5 | **Il registro parla italiano**: gli eventi mostrati alle persone usano frasi ("Analisi dell'amministrazione eseguita"), non codici. **Oggi** l'ufficio virtuale mostra `administration.analysis`, `fidelity.member.created`, `fidelity.transaction.credit` | Nessun codice tecnico visibile nell'interfaccia |

## 6. Prevenire e gestire gli errori (E)

| # | Regola | Come si verifica |
|---|---|---|
| E1 | **Prevenire prima di correggere**: valori predefiniti sensati, opzioni non valide disattivate con il motivo accanto, formati guidati (importi, date) ([NN/g](https://www.nngroup.com/articles/proximity-consequential-options/)) | Impossibile inviare un importo non valido |
| E2 | **Conferma solo per l'irreversibile.** Le finestre di conferma ripetute vengono cliccate senza leggerle; per ciò che è reversibile si usa "Annulla" ([UX Planet](https://uxplanet.org/confirmation-dialogs-how-to-design-dialogues-without-irritation-7b4cf2599956), [UX Psychology](https://uxpsychology.substack.com/p/how-to-design-better-destructive)). In BigAnt la conferma resta per: storno, disattivazione di un accesso, rifiuto (che chiede il motivo) | Conteggio delle finestre di conferma: solo nei casi elencati |
| E3 | **Validazione dei moduli:** controllo all'uscita dal campo, poi in diretta mentre si corregge. Messaggio vicino al campo, tolto appena l'errore è risolto; al tentativo di invio, riepilogo in cima con collegamenti ai campi ([Baymard](https://baymard.com/blog/inline-form-validation), [Smashing](https://www.smashingmagazine.com/2012/06/27/form-field-validation-errors-only-approach/)) | Modulo "Registra movimento" provato con errori voluti |
| E4 | **Messaggi d'errore visibili, precisi e costruttivi**: dicono cosa è successo e cosa fare, in linguaggio umano, senza colpa e senza codici ([NN/g](https://www.nngroup.com/videos/error-message-communication-guidelines/), [rubrica NN/g](https://www.nngroup.com/articles/error-messages-scoring-rubric/)). "Operazione non riuscita. Controlla i dati e riprova." non basta: va detto quale dato | Ogni messaggio d'errore valutato su visibilità, comunicazione, efficienza |
| E5 | **Nulla va perso**: dopo un errore il modulo resta compilato; i testi lunghi (motivo di rifiuto, richiesta all'agenzia) si salvano come bozza nella sessione | Errore di rete simulato durante l'invio: il testo è ancora lì |

## 7. Efficienza per chi lavora ogni giorno (K)

| # | Regola | Come si verifica |
|---|---|---|
| K1 | **Scorciatoie da tastiera** nelle code (approvazioni, anomalie): `j`/`k` per scorrere, `a` approva, `m` chiede modifiche, `r` rifiuta (chiede il motivo), `/` cerca, `?` mostra l'elenco. Disattive mentre si scrive in un campo ([Super Inbox](https://help.supersend.io/en/article/inbox-productivity-features-1p9ebjk/), [Dynatrace](https://developer.dynatrace.com/develop/guides/keyboard-shortcuts/plan-keyboard-shortcuts/)) | Approvare tre elementi senza mouse |
| K2 | **Avanzamento automatico**: dopo una decisione si apre il prossimo elemento, con una riga che conferma l'esito del precedente ([Tender](https://help.tenderapp.com/discussions/suggestions/417-rapid-fire-ticket-triage-workflow-please-comment-1-if-you-agree)) | Nessun ritorno manuale all'elenco tra una decisione e l'altra |
| K3 | **Azioni multiple solo dove sono sicure**: ad esempio segnare più anomalie come viste. Le approvazioni multiple solo per elementi già "approvabili" secondo Qualità e senza effetti esterni: l'approvazione dall'elenco salta i controlli di dettaglio ([Gravity Flow](https://docs.gravityflow.io/the-inbox-page/)) | Revisione delle azioni multiple esistenti |
| K4 | **L'app ricorda per ogni persona**: ultimo cliente scelto, filtri, schede aperte | Uscire e rientrare: si ritrova il proprio contesto |
| K5 | **Ogni coda si presenta come una decisione**: agire, rimandare o chiudere ([Jira triage](https://marketplace.atlassian.com/apps/2782015515/issue-triage-inbox-for-jira)); deve essere sempre chiaro chi deve agire ([ONES](https://ones.com/blog/?p=1123684)) | Ogni elemento in coda mostra chi decide e entro quando |

## 8. Telefono (T)

| # | Regola | Come si verifica |
|---|---|---|
| T1 | **Aree di tocco di 44 px** con almeno 8 px tra l'una e l'altra; azioni principali in basso, nella zona del pollice ([mobile craft](https://cdn.jsdelivr.net/npm/@memi-design/cli@2.6.2/notes/mobile-craft/mobile-craft.md), [Laws of UX: Fitts](https://lawsofux.com/index.md)) | Prova a 390 px con una mano |
| T2 | **Tabelle a schede impilate o colonne prioritarie** sotto i 640 px; lo scorrimento orizzontale solo per confronti densi ([Sizzy](https://sizzy.co/blog/responsive-tables), [Quackit](https://www.quackit.com/html/templates/tables/stacked_rows_on_mobile_table.cfm)) | Nessuna pagina più larga dello schermo |
| T3 | **`100dvh` invece di `100vh`** per le altezze a schermo intero | Barra del browser che compare o sparisce: nessun salto |
| T4 | **Nessuna funzione solo al passaggio del mouse**; i suggerimenti compaiono anche al focus | Tutto raggiungibile con tocco e tastiera |
| T5 | **Cliente da telefono (R-169)**: dopo l'accesso, approvare un contenuto in **due tocchi**; chiedere una cosa all'agenzia in **tre** | Scenario S5 e S6 del paragrafo 11 |

## 9. Testi dell'interfaccia (W)

| # | Regola | Come si verifica |
|---|---|---|
| W1 | **Italiano semplice e attivo**: frasi brevi, forme verbali attive, niente nominalizzazioni, maiuscola solo all'inizio della frase ([Designers Italia, Linguaggio](https://designers.italia.it/design-system/fondamenti/linguaggio/)) | Lettura ad alta voce: suona come lo direbbe un socio |
| W2 | **Pulsanti = verbo + oggetto** ("Approva il post", "Registra l'incasso"), mai "OK", "Conferma", "Invia" da soli | Elenco dei pulsanti |
| W3 | **Errori con titolo chiaro e azione per risolvere** ([Designers Italia, Microtesti](https://designers.italia.it/design-system/fondamenti/microtesti/)) | Vedi E4 |
| W4 | **Titoli entro 70 caratteri, descrizioni entro 160** ([Designers Italia, Contenuti](https://designers.italia.it/design-system/fondamenti/contenuti/)) | Conteggio |
| W5 | **Glossario unico**: una parola per ogni concetto in tutta l'app (es. "lavoro" o "attività", non entrambe; "cliente" e "attività del cliente" distinti), da tenere in `docs/` | Ricerca dei sinonimi nei testi di `public/` |
| W6 | **Niente gergo interno** nelle schermate: codici R-xxx, nomi di file, "procedura DEMO parziale", nomi di eventi tecnici | Nessuna occorrenza visibile |
| W7 | **Formati italiani coerenti**: `1.400,00 €`, `10 ott 2026`, `13:20`, percentuali con virgola | Revisione di importi, date e ore |
| W8 | **Tono BigAnt**: attivo, autorevole, concreto; niente saluti generici né chiusure deboli | Lettura delle pagine Oggi, cliente e accesso |

## 10. Accessibilità che rende l'app più comoda per tutti (A)

| # | Regola | Come si verifica |
|---|---|---|
| A1 | **Tutto usabile da tastiera**, in un ordine logico, con focus sempre visibile e mai coperto da barre fisse ([W3C, WCAG 2.2](https://w3.org/WAI/standards-guidelines/wcag/new-in-22/)) | Percorso completo con il solo tasto Tab |
| A2 | **Finestre e pannelli**: focus trattenuto dentro, Esc chiude, il focus torna al pulsante che li ha aperti | Prova su ogni finestra |
| A3 | **Aree cliccabili di almeno 24 px** su computer (noi 36–44), 44 px su telefono | Misura |
| A4 | **Mai solo il colore**: ogni stato ha anche la parola o la forma | Vista in scala di grigi |
| A5 | **Contrasti** come da guida estetica (testo 4,5:1, componenti 3:1) | axe o Lighthouse senza errori di contrasto |

## 11. Protocollo della revisione (quando Codex ha finito)

1. **Avvio e foto.** App in locale con dati DEMO; schermate a 1440 px e 390 px di ogni vista, confrontate con `docs/estetica/prima/`.
2. **Misure automatiche.**
   - Lighthouse per prestazioni e accessibilità;
   - axe;
   - INP, LCP e CLS;
   - conteggio di colori e dimensioni nel CSS (criteri della guida estetica).
3. **Scenari cronometrati**, con obiettivo:

| # | Chi | Compito | Obiettivo |
|---|---|---|---|
| S1 | Socio | Trovare e approvare il post di Bottega Aurora | ≤ 3 clic, ≤ 20 s |
| S2 | Socio | Capire cosa non torna in prima nota e aprire la prima anomalia | ≤ 2 clic |
| S3 | Socio | Registrare un incasso con un errore voluto e correggerlo | Solo tastiera; errore chiaro; nulla perso |
| S4 | Socio | Capire cosa sta facendo lo sciame e avviare un giro | Stato chiaro in ≤ 5 s |
| S5 | Cliente, telefono | Approvare un contenuto | ≤ 2 tocchi dopo l'accesso |
| S6 | Cliente, telefono | Chiedere una cosa all'agenzia | ≤ 3 tocchi |
| S7 | Socio | Filtrare, aprire una voce, premere Indietro | Torna allo stato precedente |
| S8 | Socio | Ricaricare la pagina o aprire un link copiato | Stessa vista, cliente e filtro |
| S9 | Socio | Inviare un modulo con la rete scollegata | Messaggio chiaro, testo conservato |

4. **Valutazione euristica** sulle 10 euristiche di Nielsen ([NN/g](https://nngroup.com/articles/ten-usability-heuristics/)):
   - gravità da 0 a 4: 0 nessun problema, 1 estetico, 2 minore, 3 maggiore, 4 bloccante ([Stanford](https://hci.stanford.edu/courses/cs377e/2016/sp/lectures/11-heuristic-evaluation.pdf), [Princeton](https://www.cs.princeton.edu/courses/archive/spring13/cos436/handouts/Heuristics_explained.pdf));
   - la priorità tiene conto anche di frequenza e costo della correzione ([Koji](https://www.koji.so/docs/usability-issue-severity-ratings)).
5. **Prova con persone, facoltativa ma consigliata.**
   - Partecipanti: Raffaele, Alfonso, Vincenzo e uno o due clienti sugli scenari S1–S6.
   - Questionario SUS (System Usability Scale) alla fine: la media di riferimento è 68, sopra 80 è il livello alto ([MeasuringU](https://measuringu.com/interpret-sus-score/)). **Obiettivo BigAnt: ≥ 80.**
6. **Esito.**
   - Tabella dei problemi con: dove, regola violata, gravità, prova (schermata) e correzione proposta.
   - Ordine per gravità e frequenza; al massimo 20 correzioni prioritarie.
   - Un messaggio pronto per Codex.

## 12. Griglia di valutazione

Ogni area riceve un voto da 0 a 4 (4 = nessun problema rilevato; 0 = problemi bloccanti). **Obiettivo: almeno 3 in ogni area, 4 in Velocità e Riscontro.**

| Area | Regole | Voto |
|---|---|---|
| Velocità percepita | V1–V8 | |
| Movimento | M1–M5 | |
| Orientamento e navigazione | N1–N8 | |
| Riscontro e stato | F1–F5 | |
| Errori | E1–E5 | |
| Efficienza | K1–K5 | |
| Telefono | T1–T5 | |
| Testi | W1–W8 | |
| Accessibilità | A1–A5 | |
| Aspetto (guida estetica, paragrafo 9) | criteri di accettazione | |

## 13. Già rilevato oggi (prima del lavoro di Codex)

Annotato per non perderlo; la revisione finale verificherà se è stato risolto.

- **N3:** il tasto Indietro esce dall'app (la vista è scritta con `replaceState`, nessun ascolto di `popstate`); cliente selezionato e filtri non sono nell'URL.
- **N5:** `document.title` non cambia mai.
- **F5:** codici di evento tecnici visibili nell'ufficio virtuale.
- **E4:** il messaggio d'errore generico del server ("Operazione non riuscita. Controlla i dati e riprova.") non dice quale dato correggere.
- **K1:** nessuna scorciatoia da tastiera.
- **V2:** nessuna sagoma di caricamento.
- **M1–M4:** solo due transizioni CSS in tutto il foglio di stile; View Transitions non usate.
- Il focus dopo il cambio vista va già su `#main`, ed esistono già un collegamento "Vai al contenuto" e regioni `aria-live`: da mantenere.

## Fonti

- Tempi di risposta: [NN/g, 3 limiti](https://www.nngroup.com/videos/3-response-time-limits-interaction-design/) · [Nielsen, scale temporali](https://jakobnielsenphd.substack.com/p/time-scale-ux) · [Superhuman, regola dei 100 ms](https://blog.superhuman.com/superhuman-is-built-for-speed/) · [Core Web Vitals](https://corewebvitals.io/core-web-vitals) · [Speculation rules](https://specification.website/spec/performance/speculation-rules/)
- Leggi dell'UX: [Laws of UX](https://lawsofux.com/index.md)
- Caricamento: [NN/g, skeleton vs spinner](https://www.nngroup.com/videos/skeleton-screens-vs-progress-bars-vs-spinners/)
- Aggiornamento ottimista: [DEV](https://dev.to/werliton/optimistic-updates-in-react-how-they-work-and-why-theyre-so-fast-44g7) · [TanStack, sintesi](https://openskillindex.com/skills/intense-visions-harness-engineering-tanstack-optimistic-updates)
- Movimento: [Impeccable](https://git.secluded.site/agent-skills/blob/main/vendor/impeccable/skill/reference/motion-design.md) · [Motion Grammar](https://blakecrosley.com/fr/blog/motion-grammar-when-animation-earns-its-frames) · [View Transitions 2025](https://developer.chrome.com/blog/view-transitions-in-2025)
- Euristiche e gravità: [NN/g, 10 euristiche](https://nngroup.com/articles/ten-usability-heuristics/) · [NN/g, stato del sistema](https://nngroup.com/articles/visibility-system-status) · [NN/g, divulgazione progressiva](https://nngroup.com/articles/progressive-disclosure/) · [Stanford](https://hci.stanford.edu/courses/cs377e/2016/sp/lectures/11-heuristic-evaluation.pdf) · [Princeton](https://www.cs.princeton.edu/courses/archive/spring13/cos436/handouts/Heuristics_explained.pdf) · [Koji](https://www.koji.so/docs/usability-issue-severity-ratings) · [MeasuringU, SUS](https://measuringu.com/interpret-sus-score/)
- Errori e conferme: [NN/g, messaggi d'errore](https://www.nngroup.com/videos/error-message-communication-guidelines/) · [NN/g, rubrica](https://www.nngroup.com/articles/error-messages-scoring-rubric/) · [NN/g, opzioni consequenziali](https://www.nngroup.com/articles/proximity-consequential-options/) · [Baymard, validazione in linea](https://baymard.com/blog/inline-form-validation) · [Smashing](https://www.smashingmagazine.com/2012/06/27/form-field-validation-errors-only-approach/) · [UX Planet, conferme](https://uxplanet.org/confirmation-dialogs-how-to-design-dialogues-without-irritation-7b4cf2599956) · [UX Psychology](https://uxpsychology.substack.com/p/how-to-design-better-destructive)
- Notifiche: [Maersk](https://designsystem.maersk.com/components/toast/) · [Vercel Geist](https://vercel.com/geist/toast) · [Polaris](https://polaris-react.shopify.com/components/deprecated/toast) · [Scott O'Hara](https://www.scottohara.me/blog/2019/07/08/a-toast-to-a11y-toasts.html)
- Navigazione e URL: [Deep linking](https://pattern-playground.onrender.com/patterns/deep-linking) · [Dynatrace, URL](https://developer.dynatrace.com/develop/navigation/url-sharing/) · [Helsinki, accessibilità SPA](https://saavutettavuusmalli.hel.fi/en/toteutus-ja-ohjelmistotestaus/single-page-applications-spas-notes-on-accessibility/)
- Comandi e scorciatoie: [Command palette](https://skillselion.com/skills/thedaviddias/ux-patterns-for-developers/command-palette) · [WebFactory](https://www.webfactoryltd.com/command-palette-ux-speeding-up-saas/) · [Dynatrace, scorciatoie](https://developer.dynatrace.com/develop/guides/keyboard-shortcuts/plan-keyboard-shortcuts/) · [Super Inbox](https://help.supersend.io/en/article/inbox-productivity-features-1p9ebjk/) · [Gravity Flow](https://docs.gravityflow.io/the-inbox-page/) · [Jira triage](https://marketplace.atlassian.com/apps/2782015515/issue-triage-inbox-for-jira) · [ONES](https://ones.com/blog/?p=1123684) · [Tender](https://help.tenderapp.com/discussions/suggestions/417-rapid-fire-ticket-triage-workflow-please-comment-1-if-you-agree)
- Telefono: [Mobile craft](https://cdn.jsdelivr.net/npm/@memi-design/cli@2.6.2/notes/mobile-craft/mobile-craft.md) · [Sizzy, tabelle](https://sizzy.co/blog/responsive-tables) · [Quackit](https://www.quackit.com/html/templates/tables/stacked_rows_on_mobile_table.cfm)
- Testi in italiano: [Designers Italia, Linguaggio](https://designers.italia.it/design-system/fondamenti/linguaggio/) · [Microtesti](https://designers.italia.it/design-system/fondamenti/microtesti/) · [Contenuti](https://designers.italia.it/design-system/fondamenti/contenuti/)
- Accessibilità: [W3C, novità di WCAG 2.2](https://w3.org/WAI/standards-guidelines/wcag/new-in-22/)
