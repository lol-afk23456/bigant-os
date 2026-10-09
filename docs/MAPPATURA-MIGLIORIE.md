# Mappatura e migliorie di BigAnt OS

Sessione di mappatura con il proprietario (Raffaele), iniziata il 9 ottobre 2026. Documento cumulativo: si aggiorna pagina dopo pagina ed è il riferimento per Codex.

**Legenda delle fonti**
- **[R]** riferito dal proprietario mentre usa l'app;
- **[C]** verificato nel codice del ramo `bigant-os-notte-1`;
- **[DV]** da verificare.

**Tipi di problema:** UI (aspetto e testi) · FUN (funzione o percorso) · DAT (dati) · COL (collegamento esterno). Ogni voce indica anche la natura: *difetto*, *preferenza*, *nuova funzione* o *collegamento mancante*.

**Priorità:** P1 = blocca l'uso reale · P2 = importante · P3 = secondo piano.

**Regola per chi implementa:** nessuna modifica prima dell'ok dei soci sul piano. "Togliere" significa togliere dal menu e dalla vista; il codice si elimina solo dopo una decisione esplicita, perché procedure e test vi si appoggiano.

---

## Copertura

| Pagina / percorso | Stato dell'analisi |
|---|---|
| Accesso (login) | Esaminata [R] [C] |
| Pagina d'ingresso dopo il login | Esaminata [R] [C] |
| Mappa agenzia, tutte e quattro le parti (Reparti e specialisti, Servizi, Gestionale, Fondamenta) | Esaminata [R] [C] |
| Marketing BigAnt | Esaminata [R] [C] |
| Direzione | Esaminata [R] [C] |
| Amministrazione, Clienti, Lavori e contenuti, Growth, Fidelity, Ufficio virtuale, Sciame di agenti, Approvazioni, Registro attività, Servizi, Collegamenti, Accessi, Vista cliente | Da esaminare |
| Vista collaboratore, vista cliente | Da esaminare |
| Uso da telefono | Da esaminare |

---

## 1. Accesso e ruoli

### Decisione del proprietario [R]

Per ora servono **tre tipi di accesso**:

| Ruolo | Chi | Note |
|---|---|---|
| Amministrazione | I soci BigAnt (account già esistente sul server) | Vede tutto, compresa l'amministrazione |
| Collaboratore | Vincenzo | Solo la produzione e i clienti assegnati |
| Cliente | **"BigAnt" come primo cliente di prova** | BigAnt viene trattata come un cliente esterno, distinto dall'agenzia che usa l'app, per collaudare la vista cliente con dati propri |

### Voci

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| UI-001 | Accesso | Il login non sembra professionale [R]. Nel codice il pannello reale mostra prima un pulsante e solo dopo il modulo (`public/app.js`, `login()`) [C] | Prima impressione debole, un passaggio in più a ogni accesso | Login definitivo: logo BigAnt, campi email e password subito visibili, pulsante unico "Accedi", messaggio d'errore chiaro, "Password dimenticata?" (vedi FUN-003). Colori BigAnt #F26B21 e #141413 | P1 · preferenza + difetto | Da telefono e da PC: si accede con email e password in un solo passaggio, senza diciture DEMO |
| UI-002 | Accesso | Si vedono diciture "demo" [R]. I profili dimostrativi del login il codice li nasconde già in modalità reale (`public/app.js:62`) [C]; le altre diciture DEMO restano in tutta l'app (vedi UI-006) | Testi da prototipo nella versione definitiva | Confluisce in UI-006 | P1 | Vedi UI-006 |
| UI-006 | Tutta l'app | Diciture "DEMO" in tutta l'app. Estensione [C]: **157** in `public/app.js` (molte fisse, per esempio "Apri la regia DEMO", "Accoda procedura DEMO", "Azienda DEMO"), 3 in `public/cliente.js`, 6 in `public/ufficio.js` e **578** nei testi generati dal server in `src/`. **Regola decisa [R]:** la dicitura DEMO si toglie **solo dalla funzione che è stata configurata e funziona davvero**, man mano che si avanza. Quello che non è ancora configurato resta segnato DEMO | Distinguere sempre ciò che è vero da ciò che è ancora una prova | Per ogni funzione portata a regime: togliere le sue diciture DEMO (interfaccia e testi del server) **nello stesso intervento** che la rende reale, e aggiornare la pagina Avanzamento (FUN-004). Nessuna rimozione in blocco | P1 · regola di lavoro | Ogni funzione senza DEMO ha una prova che funziona sul server reale; ogni funzione non ancora configurata riporta ancora DEMO |
| FUN-001 | Accessi | Servono gli accessi definitivi: amministrazione, collaboratore Vincenzo, cliente BigAnt [R] | Senza, il collaboratore e il cliente non possono essere collaudati | Creare da *Accessi*: utente collaboratore (Vincenzo) e utente cliente collegato al cliente di prova "BigAnt" (vedi DAT-001). Account nominali, password scelte dai titolari, mai scritte in chat o nei documenti | P1 · funzione esistente da usare | Tre accessi distinti entrano e ciascuno vede solo il proprio spazio |
| DAT-001 | Clienti / Accessi | Oggi l'unico cliente nel database reale è "BigAnt", ed è l'agenzia stessa ("cliente zero" del Marketing BigAnt) [C: `src/store.js`, `seedRealCore`] | Usare quel record come cliente di prova mescolerebbe i dati dell'agenzia con quelli del cliente | Creare un cliente separato, per esempio "BigAnt (cliente di prova)", con servizi attivi propri, e collegarci l'utente cliente | P1 · decisione + dati | Il cliente di prova ha una scheda propria; la vista cliente non mostra dati interni dell'agenzia |
| FUN-002 | Dopo il login | Si entra in automatico su *Mappa agenzia* [R] [C: `public/app.js`, `S.view=isOwner()?'agency':…`] | La prima schermata non risponde alla domanda "cosa devo fare oggi?" | **Una home diversa per ogni ruolo**, come prima pagina dopo il login (proposta di contenuti sotto) | P1 · nuova funzione | Ogni ruolo entra sulla propria home, la Mappa agenzia non è più la pagina d'ingresso |
| FUN-003 | Accesso | Non esiste il recupero della password né il cambio obbligatorio al primo accesso [C, già dichiarato nel report della Fase 1] | Se la password si perde, oggi serve un intervento tecnico su Railway | Cambio password obbligatorio al primo accesso e recupero password gestito da un socio dalla sezione Accessi (nessuna email automatica finché le email sono spente) | P1 · nuova funzione | Un nuovo utente deve cambiare la password al primo accesso; un socio può reimpostare quella di un altro |

### Proposta di home per ruolo (da validare con i soci)

**Amministrazione: funzionale, "cosa richiede attenzione oggi"** · [DV] da rivedere a fine giro: dopo le decisioni D-03 e FUN-021 (rischi e decisioni restano su Trello, soldi in Fatturazione) i punti 2 e 5 vanno probabilmente tolti
1. Da approvare: numero e collegamento diretto alla coda.
2. Lavori in ritardo o in scadenza questa settimana.
3. Clienti: attivi, con problemi, in rinnovo.
4. Commerciale: lead nuovi e proposte aperte.
5. Soldi, in sintesi: incassi attesi e scadenze a 30 giorni. Solo per l'amministrazione, e in secondo piano finché la fatturazione non è attiva.
6. Agenti: lavori fermi o bloccati dal controllo qualità.

**Collaboratore (Vincenzo): funzionale, "il mio lavoro"**
1. I miei lavori di oggi e della settimana, in ordine di scadenza.
2. Correzioni richieste dai soci o dai clienti.
3. Contenuti pronti da mandare in approvazione.
4. Clienti assegnati, con collegamento rapido.

**Cliente: curata nell'aspetto e chiara**
1. Benvenuto con il nome dell'attività e i servizi attivi.
2. Da approvare: contenuti in attesa di un suo "ok".
3. Risultati principali del mese, pochi numeri e leggibili.
4. Prossime uscite in calendario.
5. "Chiedi all'agenzia", sempre a portata di mano.

Base di partenza: la dashboard cliente a 9 sezioni esistente (`src/cliente/dashboard.js`) è già il modello più chiaro dell'app [C].

---

## 2. Mappa agenzia

### Cosa contiene oggi [C: `public/app.js`, `agencyView()`]

Un'unica pagina lunga:
- titolo "Tutta BigAnt, prima dei singoli strumenti" e pulsante "Apri la regia DEMO";
- blocco "La mappa dell'agenzia / Il metodo è comune";
- quattro numeri: reparti, procedure DEMO, servizi, moduli;
- quattro collegamenti che scorrono la pagina: Reparti e specialisti · Servizi · Gestionale · Fondamenta;
- avviso «Solo struttura / Flusso DEMO parziale»;
- le quattro parti, una sotto l'altra.

### Giudizio del proprietario [R]

È una pagina confusa e non è chiaro a cosa serva. Diverse parti ripetono cose presenti in altre voci del menu. Non deve stare in primo piano.

### Voci

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-004 | Mappa agenzia | Lo scopo non è chiaro; è la prima voce del menu e la pagina d'ingresso [R] | Chi entra non capisce cosa fare; la pagina racconta l'impianto, non il lavoro | Trasformarla in **"Avanzamento BigAnt OS"**: una pagina che mostra lo stato di costruzione della piattaforma (cosa è operativo, demo o da collegare). Spostarla in un'area **Avanzate / Sistema**, fuori dal menu principale | P2 · preferenza strutturale | La voce non è più nel menu principale; in Avanzate una pagina mostra l'avanzamento con i tre stati |
| UI-003 | Mappa agenzia | I collegamenti interni (Reparti e specialisti, Servizi, Gestionale, Fondamenta) scorrono una pagina unica lunga, come una vetrina [R] [C: `section-jumps`] | Pagina molto lunga e dispersiva, difficile ritrovare le cose | Una pagina per ogni argomento, oppure schede che mostrano un argomento alla volta. In gran parte però queste parti si spostano altrove (FUN-005…FUN-008) | P2 · preferenza | Nessuna pagina del socio richiede di scorrere quattro argomenti diversi |
| UI-004 | Mappa agenzia | Avviso «"Solo struttura" descrive lo spazio e il metodo. "Flusso DEMO parziale" indica funzioni locali limitate…» [R] [C] | Linguaggio tecnico; nella versione definitiva confonde | Togliere dalle pagine di lavoro. Gli stati di avanzamento compaiono solo nella pagina "Avanzamento BigAnt OS" (FUN-004), con tre etichette semplici: Funziona · Prova · Da collegare | P2 · difetto di testo | Nessun avviso tecnico nelle pagine operative |
| UI-005 | Mappa agenzia | Pulsante "Apri la regia DEMO" in testata [C] | Dicitura DEMO nella versione reale, e un collegamento allo sciame dalla pagina sbagliata | Togliere. L'accesso allo sciame resta dalla sua voce di menu | P2 · difetto | Nessun pulsante "DEMO" in modalità reale |
| FUN-005 | Mappa agenzia → Reparti e specialisti | È lo schema degli agenti per reparto; non ha senso come prima cosa vista dall'amministrazione [R] | Informazione tecnica in primo piano | Spostare in **Sciame di agenti** come "Struttura dello sciame" (reparti, specialisti, procedure) | P2 · preferenza strutturale | La struttura per reparto si trova solo dentro Sciame di agenti |
| FUN-006 | Mappa agenzia → "Un workspace per ogni servizio" | Utile, ma configurare un agente AI per ogni servizio richiede molto tempo [R]. **Aggiornato con la sezione 3:** lo scopo è attivare i servizi dell'agenzia entro un anno (D-02 decisa) | Oggi è un elenco senza un uso chiaro, doppione delle "aree del marketing" | Confluisce nel **Piano di attivazione dei servizi** (FUN-014). Gli agenti di ciascun servizio restano in *Sciame di agenti* | P2 · decisa | Un solo posto per lo stato di attivazione dei servizi |
| FUN-007 | Mappa agenzia → I 10 moduli del gestionale | La sezione non è interessante così; i moduli vanno distribuiti dove servono [R] | Dieci moduli presentati in astratto, staccati dal lavoro | Ripartizione decisa dal proprietario: tabella "Dove finiscono i 10 moduli" qui sotto | P2 · preferenza strutturale | La sezione "Gestionale" non esiste più come elenco astratto; ogni modulo tenuto vive nella sua pagina |
| FUN-008 | Mappa agenzia → Fondamenta da completare | Portfolio e autorizzazioni, capacità del team, obiettivi a 90 giorni, spese insolite, pacchetto per il commercialista, custodia dei collegamenti, onboarding [C: `src/agency/foundations.js`]. **Decisione [R]:** non si eliminano; sono interessanti come elenco di cose da costruire e si spostano in **Avanzamento BigAnt OS**, come il resto della Mappa agenzia | Lista di cantieri aperti in una pagina di lavoro | Spostare l'intera sezione in Avanzamento (FUN-004) | P3 · decisa | Le Fondamenta si trovano solo in Avanzamento |
| FUN-009 | Nuova voce di menu: **Fatturazione** | Il proprietario vuole tenere sotto controllo soprattutto due cose: il **saldo dei clienti** della gestione social (quanto pagano e cosa resta da incassare) e i **costi degli abbonamenti** dell'agenzia [R] | Oggi questi dati sono sparsi tra Amministrazione e Gestionale | Una sola sezione **Fatturazione**, visibile **solo all'accesso amministrazione**, **ultima voce del menu**, in secondo piano. Raccoglie cassa, prima nota, fatture, incassi, saldo per cliente, costi e abbonamenti. Prima schermata: saldo per cliente e abbonamenti in scadenza | P3 · decisa | Collaboratore e cliente non vedono la voce né i dati (verifica sul server, non solo nel menu); l'amministrazione la trova in fondo al menu |
| COL-001 | Task e consegne | Oggi i task si gestiscono su **Trello**, e funziona bene [R] | Doppio lavoro se BigAnt OS replica Trello | Valutare un collegamento a Trello in sola lettura: lavori e scadenze dei clienti visibili in BigAnt OS, mentre si continua a lavorare su Trello. Da progettare e autorizzare come ogni collegamento | P3 · collegamento mancante | Decisione dei soci (D-03); se approvato, i lavori Trello di un cliente compaiono nella sua scheda senza essere riscritti |

### Dove finiscono i 10 moduli del gestionale

| Modulo attuale | Decisione [R] | Dove va | Note del consulente |
|---|---|---|---|
| Anagrafiche | Tenere | **Clienti**: anagrafica di ogni cliente dell'agenzia | Sono i clienti di BigAnt, non gli utenti del gestionale |
| Commerciale e contratti | Tenere il contratto | **Clienti → scheda cliente → Contratto**, "sempre a portata di mano" | Il contratto si carica come documento (PDF), con data di inizio, durata e rinnovo |
| Accessi del cliente (nuovo) | Aggiungere, **con le credenziali** (D-01 decisa) | **Clienti → scheda cliente → Accessi**, visibile ad amministrazione e collaboratori, **mai ai clienti** | Vedi FUN-010 |
| Fatturazione e incassi | Secondo piano | **Fatturazione** (FUN-009), solo amministrazione | |
| Cassa e prima nota | Secondo piano | **Fatturazione** (FUN-009) | |
| Costi e abbonamenti | Tenere, secondo piano | **Fatturazione** (FUN-009) | Priorità interna: abbonamenti sotto controllo |
| Lavoro e marginalità | **Togliere** | — | Si nasconde; il codice resta finché non si decide |
| Task e consegne | Da valutare | Clienti / Lavori, oppure collegamento Trello (COL-001) | Decisione D-03 |
| Documenti e autorizzazioni | In dubbio | Probabilmente **Clienti → scheda cliente → Documenti** (contratti, liberatorie) | Decisione D-04 |
| Cruscotto di direzione | **Eliminabile** | La sua funzione utile passa alla home dell'amministrazione (FUN-002) | Da riverificare quando si analizza la voce *Direzione* |
| Scadenziario unico | Non commentato | [DV] | Proposta: le scadenze di contratti e rinnovi nella scheda cliente; quelle fiscali in Amministrazione |

### Fondamenta da completare

**Decisione [R]:** l'intera sezione si sposta in **Avanzamento BigAnt OS** (FUN-008), senza eliminare nulla. Quando una fondamenta viene costruita, finisce nella pagina dove serve:
- Onboarding e salute cliente → scheda cliente, "Avvio cliente";
- Spese insolite e Pacchetto per il commercialista → Fatturazione;
- Custodia dei collegamenti → Collegamenti.

### Altre voci di questo blocco

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-010 | Clienti → scheda cliente → Accessi | **Decisione del proprietario [R]:** nella scheda cliente vanno anche le **credenziali** degli account del cliente (Meta, Google, sito…). Le vedono **amministrazione e collaboratori**, **mai i clienti**. Rischio noto e accettato per ora; la messa in sicurezza si completa più avanti | Le credenziali sono a portata di mano per chi lavora sul cliente | Requisiti minimi raccomandati fin dalla prima versione, perché costano poco e riducono molto il danno di un furto del database: (1) credenziali **cifrate** nel database; (2) password **nascosta** di default, si mostra con un clic; (3) ogni visualizzazione registrata nel **Registro attività** (chi, quando, quale); (4) controllo del ruolo **sul server**, non solo nel menu; (5) mai nei log, negli export o nei backup in chiaro | P2 · nuova funzione · rischio accettato | Un utente cliente non ottiene le credenziali nemmeno chiamando l'API direttamente; nel database non compaiono in chiaro; ogni visualizzazione lascia una riga nel Registro |

---

## 3. Marketing BigAnt

### Cosa contiene oggi [C: `public/app.js`, `marketingView()`; `src/agency/marketing.js`]

- Titolo "BigAnt è il nostro primo caso studio", pulsante "Apri i lavori BigAnt" e l'avviso «profili non collegati».
- Quattro numeri: canali previsti, lavori BigAnt, contenuti BigAnt, obiettivi registrati.
- **I canali dell'agenzia e dei soci:** Instagram, Facebook, LinkedIn agenzia, LinkedIn Raffaele, LinkedIn Alfonso, TikTok, Google Business Profile, Sito BigAnt, Recensioni e reputazione. Tutti con lo stato "da collegare".
- **Le aree del marketing BigAnt:** DNA BigAnt, Strategia a 90 giorni, Calendario e mese di contenuti, Portfolio e case study, Presenza Google e recensioni, Sito e SEO, Ricerca e analisi gratuita, Piano ADV BigAnt, Due prossimi servizi e pacchetti, KPI e obiettivi.
- **Obiettivi e risultati**, **Lavori e contenuti registrati**, **Memoria del cliente zero**.

### Giudizio del proprietario [R]

Così com'è la pagina va eliminata o trasformata, e il nome "Marketing BigAnt" non va bene. Si tiene solo l'idea dei profili da tenere sotto controllo.

### Voci

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-011 | Marketing BigAnt | La pagina mescola profili, aree di sviluppo, obiettivi, lavori e memoria [R] | Non si capisce a cosa serva | **Eliminare la voce "Marketing BigAnt"** e sostituirla con la nuova sezione **Profili** (FUN-012). Il resto si sposta o si toglie come indicato sotto | P2 · decisa | La voce "Marketing BigAnt" non c'è più nel menu |
| FUN-012 | Nuova sezione **Profili** ("Profili"; per il cliente "I tuoi profili", D-06) | Il proprietario vuole un posto dove **tenere sotto controllo tutti i profili** e averli "in linea" [R] | — | Una sezione per **l'agenzia e per ogni cliente** (il cliente vede solo i propri). Per ogni profilo: stato del collegamento, ultimi dati, crescita dei follower e insight. Profili: Instagram, Facebook, LinkedIn aziendale, TikTok, **Google Business Profile** (con dentro le recensioni, FUN-013), **Sito** | P2 · nuova funzione | Ogni profilo collegato mostra dati veri con la data dell'ultimo aggiornamento; il cliente vede solo i propri profili (verifica sul server) |
| UI-007 | Profili | I **canali personali dei soci** (LinkedIn Raffaele, LinkedIn Alfonso) [R] [C] | Profili personali mescolati con quelli aziendali | Togliere i canali dei soci; restano solo i canali dell'agenzia | P2 · decisa | Nessun profilo personale nella sezione |
| FUN-013 | Profili → Google Business Profile | "Recensioni e reputazione" è una voce separata, ma le recensioni si raccolgono quasi solo da Google [R] | Doppione | Le recensioni stanno **dentro Google Business Profile** | P3 · decisa | Nessuna voce "Recensioni" separata; le recensioni si leggono nella scheda GBP |
| COL-002 | Profili | Insight "in tempo reale" e report dei follower [R] | Serve un collegamento vero a Meta, Google, TikTok e LinkedIn | Nota del consulente: le API di Meta, Google Business Profile, LinkedIn e TikTok richiedono app approvate e verifiche aziendali (`docs/DA-FARE-RAFFAELE.md`). Il "tempo reale" vero non è realistico né necessario: proposta **aggiornamento automatico una volta al giorno** più il pulsante "Aggiorna ora". Ordine consigliato: GBP, poi Instagram/Facebook, poi gli altri | P3 · collegamento mancante | Decisione D-07; poi, per ogni canale collegato, dati confrontati con quelli della piattaforma originale |
| FUN-014 | Marketing BigAnt → Le aree del marketing BigAnt | Va eliminata: si è confusa con "Un workspace per ogni servizio". **Intenzione vera [R]:** l'app deve aiutare BigAnt a **configurare e attivare, passo dopo passo, i servizi che oggi l'agenzia non offre**, con l'obiettivo di offrirli tutti **entro un anno** (analisi gratuita, piano ADV, sito e SEO, portfolio, strategia a 90 giorni…) | Oggi l'idea è dispersa in due pagine con nomi diversi | **Eliminare le "aree".** Al loro posto un unico **Piano di attivazione dei servizi**: per ogni servizio lo stato (Attivo · In preparazione · Futuro), cosa manca per attivarlo e la data obiettivo. Si costruisce dal catalogo esistente (`src/servizi/catalogo.js`) | P2 · decisa (risolve D-02) | Un solo posto mostra quali servizi BigAnt offre oggi, quali sono in preparazione e cosa manca per ciascuno |
| FUN-015 | Marketing BigAnt → Obiettivi e risultati | Interessante, ma **per i clienti**, non per l'agenzia [R] | — | Obiettivi e risultati vanno **nella vista cliente**, insieme ai **report**: un report generale di tutto quello che è stato fatto per il cliente. Nessun riquadro "obiettivo di fatturato" per l'agenzia (D-08) | P2 · decisa | Il cliente vede obiettivi, risultati e report nella sua area; l'agenzia non ha più questa sezione |
| FUN-016 | Marketing BigAnt → Lavori registrati, Contenuti registrati | Da eliminare in questa pagina [R] | Doppione di *Lavori e contenuti* | Togliere | P3 · decisa | La pagina non esiste più (FUN-011) |
| FUN-017 | Marketing BigAnt → Memoria del cliente zero | La memoria del cliente va **solo nella sezione Clienti** [R] | Dati del cliente sparsi in più pagine | Nella **scheda cliente** di *Clienti* ci sono: anagrafica, contratto, quanto paga, accessi (FUN-010) e la **scheda informativa del cliente** (memoria: brief, tono di voce, note) | P2 · decisa | Tutte le informazioni di un cliente sono in un'unica scheda |

### Dove finisce Marketing BigAnt

| Parte attuale | Destinazione |
|---|---|
| Canali dell'agenzia | **Profili** (FUN-012), senza i canali dei soci |
| Recensioni e reputazione | Dentro Google Business Profile (FUN-013) |
| Le aree del marketing BigAnt | Eliminate; l'intenzione diventa il **Piano di attivazione dei servizi** (FUN-014) |
| Obiettivi e risultati | Vista cliente, con i report (FUN-015) |
| Lavori e contenuti registrati | Tolti (FUN-016) |
| Memoria del cliente zero | Scheda cliente in *Clienti* (FUN-017) |

---

## 4. Direzione

### Cosa contiene oggi [C: `public/app.js`, `directionView()`]

- Titolo "Una regia. Tutta BigAnt.", la data e il pulsante "Apri le approvazioni".
- Riquadro **"La tua cabina di regia"**: «La testa resta umana. Il lavoro trova il suo ritmo…», con il pulsante "Esplora lo sciame" e il contatore dei lavori aperti.
- Quattro numeri: attività nel sistema, lavori in corso, decisioni in attesa, cassa registrata.
- "Le tre priorità proposte dal Direttore" (agente Direttore Crescita, segnato DEMO).
- **"Le sei domande della settimana":** quanta cassa abbiamo, quanto dobbiamo incassare, quali clienti e consegne sono a rischio, quali contratti scadono, chi è sovraccarico, quali decisioni dobbiamo prendere.
- **"Serve il tuo sguardo"** (approvazioni in attesa) e **"Il prossimo passo"**.

### Giudizio del proprietario [R]

Il riquadro "cabina di regia" è **bello, anche esteticamente**. Il resto della pagina non ha un senso chiaro. Di fatto è la direzione dello **sciame di agenti**, e quindi va lì.

### Nota del consulente

La pagina mescola due cose diverse:
1. **La regia degli agenti** (cabina di regia, "assegna il prossimo passo agli agenti", priorità del Direttore): è materia dello Sciame. Qui il proprietario ha ragione.
2. **Le sei domande e "Serve il tuo sguardo"**: non riguardano gli agenti, ma la gestione dell'agenzia (soldi, clienti a rischio, contratti, decisioni). Il consulente proponeva di portarle nella home dell'amministrazione; **la decisione del proprietario** (FUN-021) le distribuisce invece tra Fatturazione, Trello e la pagina *Clienti*.

### Voci

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-018 | Direzione | Pagina senza uno scopo chiaro, doppione della regia dello sciame [R] | Un'altra voce di menu che non porta a un'azione | **Eliminare la voce "Direzione"**. I contenuti si ridistribuiscono come nella tabella sotto | P2 · decisa | La voce non c'è più; nessun contenuto utile è andato perso |
| UI-008 | Direzione → "La tua cabina di regia" | Piace, anche esteticamente [R] | — | **Conservare lo stile** di questo riquadro come riferimento grafico: in testa a *Sciame di agenti* e come modello per la testata delle home (FUN-002) | P2 · da conservare | Il riquadro esiste in Sciame di agenti, con lo stesso aspetto |
| FUN-019 | Direzione → cabina di regia, "Esplora lo sciame", priorità del Direttore | Riguardano gli agenti [R] | — | Spostare in **Sciame di agenti** | P2 · decisa | Questi blocchi si trovano solo in Sciame di agenti |
| FUN-020 | Direzione → quattro numeri (attività nel sistema, lavori in corso, decisioni in attesa, cassa registrata) | Inutili qui [R] | Numeri senza azione collegata | Togliere. "Decisioni in attesa" sopravvive come contatore nella home dell'amministrazione, con il collegamento alle Approvazioni | P3 · decisa | Nessuna fila di numeri senza azione |
| FUN-021 | Direzione → "Le sei domande della settimana" | Non è chiaro a cosa servano [R] | Domande utili in parte, ma nel posto sbagliato | **Decisione [R]:** cassa e incassi → **Fatturazione** (secondo piano, FUN-009); clienti e consegne a rischio → **Trello** (non in BigAnt OS, D-03); **contratti in scadenza → pagina iniziale di *Clienti*** come avviso in evidenza (FUN-023); decisioni da prendere → **Trello**, come task; "chi è sovraccarico" → **tolta** | P2 · decisa | Nessuna delle sei domande resta in una pagina a sé; i contratti in scadenza compaiono come avviso aprendo *Clienti* |
| FUN-023 | Clienti → pagina iniziale | I contratti in scadenza devono essere visibili appena si apre l'anagrafica clienti [R] | Un rinnovo dimenticato è un cliente perso o un servizio non pagato | In cima alla pagina *Clienti*, un **avviso** con i contratti che scadono nei prossimi 30 giorni (cliente, data, collegamento alla scheda). Richiede che il contratto in scheda cliente abbia data di inizio, durata e scadenza (FUN-007) | P2 · decisa | Con un contratto che scade entro 30 giorni, aprendo *Clienti* compare l'avviso con il nome del cliente e la data |
| FUN-022 | Sciame di agenti: chi lo vede | Lo sciame lo controlla **solo l'amministrazione**; i collaboratori vedono al massimo le cose da approvare, come i post [R] | — | Già così nel codice [C: `allowedNav()`, il collaboratore ha *Approvazioni* ma non *Sciame di agenti* né *Ufficio virtuale*]. Da mantenere e da verificare anche sul server (le rotte dello sciame devono rifiutare il collaboratore) | P2 · da verificare | Un collaboratore che chiama le rotte dello sciame riceve un rifiuto; vede i post da approvare in *Approvazioni* |

---

## Decisioni che spettano ai soci

| ID | Decisione | Contesto |
|---|---|---|
| D-01 | "Accessi del cliente": solo l'elenco o anche le credenziali? | **DECISA [R]:** anche le credenziali, visibili ad amministrazione e collaboratori, mai ai clienti. Rischio accettato; requisiti minimi in FUN-010 |
| D-02 | "Un workspace per ogni servizio": promemoria per la crescita dell'agenzia o piano per costruire gli agenti? | **DECISA [R]:** serve ad attivare, passo dopo passo ed entro un anno, i servizi che BigAnt oggi non offre. Diventa il Piano di attivazione dei servizi (FUN-014) |
| D-06 | Nome della nuova sezione dei profili | **DECISA [R]:** "Profili" (per il cliente: "I tuoi profili") |
| D-07 | Aggiornamento dei dati dei profili | **DECISA [R]:** una volta al giorno più "Aggiorna ora" |
| D-08 | Riquadro "obiettivo di fatturato" nella home dell'amministrazione | **DECISA [R]:** non si fa |
| D-03 | Task e consegne: Trello o BigAnt OS? | **DECISA [R]:** si resta su Trello; il collegamento si valuta in futuro (COL-001) |
| D-04 | Documenti e autorizzazioni: servono in BigAnt OS? | Proposta minima: solo contratti e liberatorie nella scheda cliente |
| D-05 | Le parti tolte vanno nascoste o eliminate dal codice? | Raccomandazione: nasconderle ora ed eliminarle dopo il collaudo della nuova struttura |

## Domande aperte

Nessuna per questo blocco.
