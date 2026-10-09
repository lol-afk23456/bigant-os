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
| Amministrazione | Esaminata [R] [C]; bacheca Trello Fatturazione letta in sola lettura (solo struttura) |
| Clienti (elenco, nuova attività, apri attività) e vista cliente (tutte le sezioni) | Esaminata [R] [C] |
| Lavori e contenuti | Esaminata [R] [C] |
| Growth (e verifica del trasferimento di Fidelity sugli inventari) | Esaminata [R] [C]; Growth confrontato con il codice originale; Fidelity originale non ancora letto (accesso al repository bloccato dal controllo di sicurezza della sessione) |
| Ufficio virtuale e Sciame di agenti | Esaminata [R] [C] |
| Registro attività, Servizi | Esaminate [R] [C] |
| Approvazioni | Esaminata [R] [C] |
| Collegamenti, Accessi, Vista cliente (dal pannello dell'amministrazione) | Esaminate [R] [C] |
| **Giro lato amministrazione** | **Completato il 9/10** |
| Fidelity (interfaccia) | Rinviata dal proprietario; lavoro da fare in sezione 8 |
| Lato cliente, con un vero login da cliente | **In programma il 10/10** |
| Lato collaboratore | **In programma l'11/10** |
| Uso da telefono | Da esaminare durante i giri lato cliente e collaboratore |

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
| UI-002 | Accesso | Si vedono diciture "demo" [R]. I profili dimostrativi sono già nascosti in modalità reale (`public/app.js:62`) [C], ma la **finestra di accesso** usata sul server reale mostra ancora «Accesso utente DEMO», «Email .example», «Password del prototipo» [C, verifica del 9/10] | Al primo contatto l'app sembra una prova | Il login è una funzione reale: per la regola UI-006 i testi da prototipo vanno tolti **subito** in modalità reale (insieme a UI-001) | P1 · difetto | Sul server reale la finestra di accesso non contiene «DEMO», «.example» né «prototipo» |
| UI-006 | Tutta l'app | Diciture "DEMO" in tutta l'app. Estensione [C]: **157** in `public/app.js`; dei 578 nei file del server una parte sono nomi tecnici o commenti, non testi a schermo [C, verifica del 9/10]; (molte fisse, per esempio "Apri la regia DEMO", "Accoda procedura DEMO", "Azienda DEMO"), 3 in `public/cliente.js`, 6 in `public/ufficio.js` e **578** nei testi generati dal server in `src/`. **Regola decisa [R]:** la dicitura DEMO si toglie **solo dalla funzione che è stata configurata e funziona davvero**, man mano che si avanza. Quello che non è ancora configurato resta segnato DEMO | Distinguere sempre ciò che è vero da ciò che è ancora una prova | Per ogni funzione portata a regime: togliere le sue diciture DEMO (interfaccia e testi del server) **nello stesso intervento** che la rende reale, e aggiornare la pagina Avanzamento (FUN-004). Nessuna rimozione in blocco | P1 · regola di lavoro | Ogni funzione senza DEMO ha una prova che funziona sul server reale; ogni funzione non ancora configurata riporta ancora DEMO |
| FUN-001 | Accessi | Servono gli accessi definitivi: amministrazione, collaboratore Vincenzo, cliente BigAnt [R] | Senza, il collaboratore e il cliente non possono essere collaudati | Creare da *Accessi*: utente collaboratore (Vincenzo) e utente cliente collegato al cliente di prova "BigAnt" (vedi DAT-001). Account nominali, password scelte dai titolari, mai scritte in chat o nei documenti | P1 · funzione esistente da usare | Tre accessi distinti entrano e ciascuno vede solo il proprio spazio |
| DAT-001 | Clienti / Accessi | Oggi l'unico cliente nel database reale è "BigAnt", ed è l'agenzia stessa ("cliente zero" del Marketing BigAnt) [C: `src/store.js`, `seedRealCore`] | Usare quel record come cliente di prova mescolerebbe i dati dell'agenzia con quelli del cliente | Creare un cliente separato, per esempio "BigAnt (cliente di prova)", con servizi attivi propri, e collegarci l'utente cliente | P1 · decisione + dati | Il cliente di prova ha una scheda propria; la vista cliente non mostra dati interni dell'agenzia |
| FUN-002 | Dopo il login | Si entra in automatico su *Mappa agenzia* [R] [C: `public/app.js`, `S.view=isOwner()?'agency':…`] | La prima schermata non risponde alla domanda "cosa devo fare oggi?" | **Una home diversa per ogni ruolo**, come prima pagina dopo il login, scegliendo solo ciò che conta davvero a primo impatto. **Estetica [R]:** amministrazione e collaboratore soprattutto **funzionali**; cliente **bella esteticamente e allo stesso tempo funzionale**. Tutte "almeno un minimo belle", nello stile della cabina di regia (contenuti in §13.3 e §13.4) | P1 · nuova funzione | Ogni ruolo entra sulla propria home, la Mappa agenzia non è più la pagina d'ingresso |
| FUN-003 | Accesso | Un socio può già impostare una **nuova password** a un utente dalla sezione Accessi [C: pulsante "Nuova password"]. Manca il **cambio obbligatorio al primo accesso** [C, già dichiarato nel report della Fase 1] | Se la password si perde, oggi serve un intervento tecnico su Railway | Cambio password **obbligatorio al primo accesso** e dopo ogni "Nuova password" impostata da un socio. Il recupero resta gestito da un socio (nessuna email automatica finché le email sono spente) | P1 · nuova funzione | Un nuovo utente deve cambiare la password al primo accesso; un socio può reimpostare quella di un altro |

### Proposta di home per ruolo · **superata**: la versione aggiornata alle decisioni è nella sezione 13

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
| Anagrafiche | Tenere | **Clienti**: anagrafica di ogni cliente dell'agenzia | Oggi il modulo comprende anche fornitori, collaboratori e le due ditte [C]: proposta, in **Fatturazione** (D-16) |
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

Sono **9** [C]: Onboarding e salute cliente, Portfolio e autorizzazioni, Capacità del team, Obiettivi a 90 giorni, KPI qualità e ore risparmiate, Pacchetti listini e upsell, Pacchetto per il commercialista, Spese insolite, Custodia dei collegamenti.

**Decisione [R]:** l'intera sezione si sposta in **Avanzamento BigAnt OS** (FUN-008), senza eliminare nulla. Quando una fondamenta viene costruita, finisce nella pagina dove serve:
- Onboarding e salute cliente → scheda cliente, "Avvio cliente";
- Spese insolite e Pacchetto per il commercialista → Fatturazione;
- Custodia dei collegamenti → Collegamenti.

### Altre voci di questo blocco

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-010 | Clienti → scheda cliente → Accessi | **Decisione del proprietario [R]:** nella scheda cliente vanno anche le **credenziali** degli account del cliente (Meta, Google, sito…). Le vedono **amministrazione e collaboratori**, **mai i clienti**. Rischio noto e accettato per ora; la messa in sicurezza si completa più avanti | Le credenziali sono a portata di mano per chi lavora sul cliente | Requisiti minimi raccomandati fin dalla prima versione, perché costano poco e riducono molto il danno di un furto del database: (1) credenziali **cifrate** nel database; (2) password **nascosta** di default, si mostra con un clic; (3) ogni visualizzazione registrata nel **Registro** delle persone (Sistema → Accessi → Registro, FUN-059, FUN-066); (4) controllo del ruolo **sul server**, non solo nel menu; (5) mai nei log, negli export o nei backup in chiaro | P2 · nuova funzione · rischio accettato | Un utente cliente non ottiene le credenziali nemmeno chiamando l'API direttamente; nel database non compaiono in chiaro; ogni visualizzazione lascia una riga nel Registro |

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
| FUN-020 | Direzione → quattro numeri (attività nel sistema, lavori in corso, decisioni in attesa, cassa registrata) | Inutili qui [R] | Numeri senza azione collegata | Togliere. "Decisioni in attesa" sopravvive come contatore **Da approvare** nella home dell'amministrazione, con il collegamento a Sciame → Da approvare (FUN-061) | P3 · decisa | Nessuna fila di numeri senza azione |
| FUN-021 | Direzione → "Le sei domande della settimana" | Non è chiaro a cosa servano [R] | Domande utili in parte, ma nel posto sbagliato | **Decisione [R]:** cassa e incassi → **Fatturazione** (secondo piano, FUN-009); clienti e consegne a rischio → **Trello** (non in BigAnt OS, D-03); **contratti in scadenza → pagina iniziale di *Clienti*** come avviso in evidenza (FUN-023); decisioni da prendere → **Trello**, come task; "chi è sovraccarico" → **tolta** | P2 · decisa | Nessuna delle sei domande resta in una pagina a sé; i contratti in scadenza compaiono come avviso aprendo *Clienti* |
| FUN-023 | Clienti → pagina iniziale | I contratti in scadenza devono essere visibili appena si apre l'anagrafica clienti [R] | Un rinnovo dimenticato è un cliente perso o un servizio non pagato | In cima alla pagina *Clienti*, un **avviso** con i contratti che scadono nei prossimi 30 giorni (cliente, data, collegamento alla scheda). Richiede che il contratto in scheda cliente abbia data di inizio, durata e scadenza (FUN-007) | P2 · decisa | Con un contratto che scade entro 30 giorni, aprendo *Clienti* compare l'avviso con il nome del cliente e la data |
| FUN-022 | Sciame di agenti: chi lo vede | Lo sciame lo controlla **solo l'amministrazione**; i collaboratori vedono al massimo le cose da approvare, come i post [R] | — | Oggi il collaboratore ha *Approvazioni* ma non *Sciame di agenti* né *Ufficio virtuale* [C: `allowedNav()`]. Con il riordino (FUN-048, FUN-061) il collaboratore vede **solo la scheda Da approvare** dello Sciame. Le altre rotte dello sciame devono rifiutarlo **sul server** | P2 · da verificare | Un collaboratore che chiama le rotte dello sciame (tranne Da approvare) riceve un rifiuto |

---

## 5. Amministrazione

### Cosa contiene oggi [C: `public/app.js`, vista amministrazione]

- Quattro numeri: incassi del mese, arretrati, bozze da emettere, cosa non torna.
- Le due ditte, una scheda per ciascuna.
- Pannelli:
  - Cosa non torna;
  - Prima nota;
  - Documenti e incassi;
  - Scadenze e compensi;
  - Cassa a 30, 60 e 90 giorni;
  - Conti e quadrature;
  - Abbonamenti;
  - Contributo di cassa per cliente;
  - Ore e margini gestionali;
  - Tariffe confermate;
  - Ore attribuite;
  - Contratti e rinnovi;
  - Storico delle quadrature.

**Significato verificato nel codice di due voci poco chiare:**
- **"Bozze da emettere"** non sono preventivi: sono **bozze di fattura** non ancora emesse ("Nessuna trasmissione allo SDI").
- **"Documenti e incassi"** è la tabella di quelle bozze, con importo da incassare e scadenza.
- **"Tariffe confermate"** oggi è un **costo orario** per cliente e servizio, non un listino prezzi.

### Come si lavora oggi davvero: bacheca Trello "Fatturazione" [osservata in sola lettura il 9/10]

Solo la struttura; nessun dato reale riportato qui.

| Lista Trello | Contenuto tipo |
|---|---|
| Canoni ricorrenti (attivi) | Una card per cliente: importo mensile, metodo (bonifico o contanti), data del prossimo saldo, arretrati, scadenza del contratto |
| Canone ricorrente: non fatturato | Come sopra, per gli importi senza fattura |
| Hosting / canoni annuali | Una card per sito: dominio, fornitore dell'hosting, prezzo annuale, scadenza; alcuni sono "solo hosting" (non clienti dell'agenzia) |
| Prelievi di materiale (una lista per fornitura) | Card "saldo residuo" di una fornitura concordata, più una card per ogni prelievo (data, materiale, importo) |
| Siti, Foto/Video, Promozionale: non fatturati | Lavori una tantum da incassare |
| Gestione social a pacchetto: fatturati | Pacchetti di più mesi, con la ditta che fattura e la data della fattura |

**Regole scritte nella bacheca:**
- la scadenza si spunta solo quando il cliente ha pagato;
- per le voci "non fatturate" la bacheca è l'unico registro ufficiale dei saldi;
- le fatture si emettono con Aruba.

Fonte storica: un foglio Google "Tracker abbonamenti".

**Nota del consulente:** questa bacheca è già, di fatto, il "tracker delle lavorazioni e degli incassi" che il proprietario descrive. Il rischio principale è avere **due registri** dello stesso denaro (Trello e BigAnt OS) che divergono. Prima di costruire la Fatturazione va deciso quale dei due è quello ufficiale (D-09).

### Voci

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-024 | Amministrazione | Quasi tutto il contenuto va nella **Fatturazione** in secondo piano (FUN-009) [R] | Due voci (Amministrazione, Fatturazione) per la stessa materia | La voce **Amministrazione diventa Fatturazione**: una sola voce, solo amministrazione, ultima del menu | P3 · decisa | Esiste una sola voce per soldi e costi |
| FUN-025 | Amministrazione → Incassi del mese, Arretrati | Piacciono [R] | — | **Tenere** come numeri principali in testa alla Fatturazione | P3 · da conservare | I due numeri sono la prima cosa visibile in Fatturazione |
| UI-009 | Amministrazione → "Bozze da emettere" | Non si capisce cosa sia; sembra "preventivi" [R]. Sono bozze di fattura non emesse [C] | Nome ambiguo | Rinominare **"Da fatturare"**: lavori e canoni conclusi senza fattura emessa. Le fatture vere restano su Aruba (COL-003) | P3 · difetto di testo | Il nome descrive cosa contiene senza bisogno di spiegazioni |
| FUN-026 | Amministrazione → "Cosa non torna", "Conti e quadrature", "Storico delle quadrature", "Ore attribuite", "Ore e margini gestionali" | Da eliminare [R] | Pannelli che nessuno usa | Togliere dalla vista | P3 · decisa | I pannelli non compaiono |
| FUN-027 | Amministrazione → Prima nota, Cassa a 30/60/90 giorni | La prima nota piace. La cassa a 30, 60 e 90 giorni piace, ma va **dentro la prima nota**, non in tre pannelli separati [R] | Tre riquadri dove ne basta uno | **Prima nota** con, in testa, la previsione di cassa a 30, 60 e 90 giorni | P3 · decisa | Un solo pannello mostra movimenti e previsione |
| FUN-028 | Amministrazione → "Documenti e incassi", "Contributo di cassa per cliente" | Va trasformato nel **tracker delle lavorazioni e degli incassi**, diviso per tipo di lavoro, come la bacheca Trello Fatturazione. Il contributo di cassa per cliente va lì dentro [R] | — | **Tracker incassi** con le stesse categorie della bacheca Trello: canoni ricorrenti (fatturati e non), hosting e canoni annuali, siti, foto e video, promozionale, gestione social a pacchetto, forniture con saldo residuo e prelievi. Per ogni voce: cliente, importo, metodo, scadenza, pagato sì/no, ditta che fattura. Per ogni cliente il totale incassato (ex "contributo di cassa") | P3 · nuova funzione, dipende da D-09 | Ogni categoria della bacheca Trello ha il suo corrispettivo e il saldo per cliente torna con quello della bacheca |
| FUN-029 | Amministrazione → "Scadenze e compensi" | Interessanti soprattutto i **compensi**: registrare mese per mese quanto si deve ai collaboratori (Vincenzo, Giovanni, fotografo esterno…) [R] | Oggi non c'è un posto per i compensi | Pannello **Compensi collaboratori**: persona, mese, lavoro, importo, pagato sì/no. Sta nella stessa area di **Costi e abbonamenti** | P3 · nuova funzione | Si registra il compenso del mese di un collaboratore e risulta nel totale dei costi del mese |
| FUN-030 | Amministrazione → Abbonamenti | Va bene, ma si ripete con "Costi e abbonamenti" del gestionale (FUN-007) [R] | Doppione | **Un solo pannello "Costi e abbonamenti"** in Fatturazione, insieme ai compensi (FUN-029) | P3 · decisa | Un solo elenco degli abbonamenti in tutta l'app |
| FUN-031 | Amministrazione → "Tariffe confermate" | Interessa, ma come **listino**: ogni giorno si creano tariffe nuove (un abbonamento, il costo dei QR code, delle fidelity, di 100 penne, un pacchetto di abbigliamento promozionale per Natale) [R]. Oggi è un costo orario [C] | Il pannello attuale non serve a questo | Trasformare in **Listino**: prodotto o servizio, prezzo, unità (mese, pezzo, pacchetto), note e data. Si aggiungono voci in un attimo. Valutare il collegamento con il Catalogo servizi | P3 · nuova funzione | Si aggiunge una voce di listino in meno di un minuto e la si ritrova cercandola |
| FUN-032 | Amministrazione → "Contratti e rinnovi" | Si ripete: va in **Clienti** [R] | Doppione | Spostare nella scheda cliente (FUN-007) e nell'avviso dei contratti in scadenza (FUN-023) | P3 · decisa | I contratti si trovano solo in Clienti |
| COL-003 | Fatturazione → fatture | Le fatture si emettono con **Aruba** (dalla bacheca Trello) | BigAnt OS non trasmette allo SDI | BigAnt OS **non emette fatture**: segna "da fatturare" e "fatturato". Un collegamento ad Aruba si valuta in futuro | P3 · collegamento mancante | Nessuna funzione di BigAnt OS promette l'emissione di fatture elettroniche |
| DAT-002 | Fatturazione | Il registro ufficiale oggi è Trello (più un foglio Google storico) | Rischio di due registri divergenti | Decidere la fonte ufficiale (D-09). Se diventa BigAnt OS: importazione una tantum dalla bacheca, poi la bacheca resta in sola lettura. Se resta Trello: BigAnt OS la legge e la mostra (COL-001) | P2 · decisione | Esiste un solo registro ufficiale dichiarato |

---

## 6. Clienti (lato amministrazione) e dashboard del cliente

### Cosa succede oggi [C]

- *Clienti* mostra le **card dei clienti**, con il pulsante **"Nuova attività"**. Il modulo chiede: nome dell'attività, nome per il link (campo tecnico), settore e servizi attivi.
- **"Apri attività"** porta l'amministratore nella **vista cliente**, cioè la dashboard che vede il cliente stesso (`public/cliente.js`, `src/cliente/dashboard.js`).
- La vista cliente è **un'unica pagina lunga**, con le sezioni una sotto l'altra:
  - Home;
  - I tuoi risultati;
  - Approvazioni e calendario;
  - I tuoi servizi (con "Servizi consigliati per te" e "Report mensili");
  - Documenti e amministrazione;
  - Contatti e clienti;
  - Iscritti Fidelity;
  - Chiedi all'agenzia;
  - Il tuo profilo;
  - Collegamento alla fonte dei dati.

### Giudizio del proprietario [R]

Le card dei clienti e la creazione di una nuova attività piacciono. Non va bene che l'amministrazione, aprendo un cliente, finisca nella vista del cliente. La pagina lunga "a vetrina" è poco professionale e confusa. **La parola d'ordine per tutta l'app è "ordine".**

### Principio di impaginazione per tutta l'app

**PRINC-01 · Una sezione alla volta.** Niente pagine lunghe con tutte le sezioni in fila. Ogni pagina mostra una griglia di **card piccole** (nome della sezione e un dato di sintesi). Il clic apre **solo quella sezione**, con un "Indietro" chiaro. Vale per la scheda cliente dell'amministrazione, per la dashboard del cliente e, quando serve, per le altre pagine (vedi anche UI-003).

### Voci

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-033 | Clienti → elenco e "Nuova attività" | Card dei clienti e creazione rapida (nome, settore, servizi attivi) piacciono [R]. Il modulo chiede anche "Nome per il link dell'attività", un campo tecnico [C] | Un campo che l'utente non sa come riempire | **Tenere** l'elenco a card e il modulo. Il nome per il link si genera da solo dal nome dell'attività. Dopo la creazione si completa la scheda (FUN-034) | P2 · da conservare + difetto minore | Una nuova attività si crea con nome, settore e servizi; il link si genera senza intervento |
| FUN-034 | Clienti → "Apri attività" | Apre la **vista del cliente** invece di una scheda di lavoro per l'agenzia [R] [C] | L'amministrazione vede quello che vede il cliente, non quello che serve all'agenzia | **Scheda cliente dell'amministrazione**, separata dalla vista cliente, organizzata a card (PRINC-01): **Anagrafica** · **Contratto** (FUN-007, FUN-023) · **Accessi** (FUN-010) · **Scheda informativa**, cioè brief, tono di voce e note (FUN-017) · **Servizi attivi con i loro report** (FUN-036) · **Documenti**, cioè contratto, fatture e pagamenti (FUN-039) · **Avvio cliente** (FUN-008) · **Risultati** (FUN-035) | P1 · nuova funzione | "Apri attività" apre la scheda dell'agenzia; nessun elemento della vista cliente compare al suo posto |
| UI-010 | Vista cliente | Pagina vetrina che scende "tantissimo" con 9-10 sezioni insieme [R] [C] | Poco professionale, difficile trovare le cose | Applicare PRINC-01: home del cliente a card, ogni sezione si apre da sola | P1 · preferenza strutturale | Nessuna pagina del cliente mostra più di una sezione completa alla volta |
| FUN-035 | "I tuoi risultati" | È una sezione **per il login del cliente**, non per l'amministrazione [R] | — | Due livelli. **Amministrazione:** una vista **"Risultati dei clienti"** con i risultati di ogni cliente in un unico posto. **Cliente:** "I tuoi risultati", solo i propri. **Ordine di rilascio deciso [R]:** prima solo nella dashboard dell'amministrazione; quando è configurata bene, anche nella dashboard del cliente | P2 · decisa | L'amministrazione vede i risultati di tutti i clienti in una pagina; il cliente, quando abilitato, vede solo i suoi |
| FUN-036 | Report (presenza, scheda Google, clic al sito, report mensili…) | Report sparsi "senza senso" [R] | Non si capisce a quale servizio si riferisca un dato | **I report stanno dentro il servizio attivo a cui si riferiscono**, sia nella scheda cliente dell'amministrazione sia in "I tuoi servizi" del cliente. Esempi [R]: Sito e SEO → report; **Reputazione e recensioni** → report più elenco delle recensioni; **Email marketing** → report più gestione delle email; **Meta Ads** → report; **Google Ads** → report (**molto importante**). Si toglie "Report mensili" come sezione separata. Le sezioni della versione cliente **Sito e SEO, Pubblicità, Social e contenuti** si tengono, ma con **molta pulizia** [R]: dentro i rispettivi servizi, solo dati utili e comprensibili | P1 · decisa | Ogni report si raggiunge solo dal servizio corrispondente; nessuna sezione "report" generica |
| COL-004 | Approvazioni e calendario, Storico delle decisioni | Il piano editoriale e le approvazioni dei contenuti si presentano già ai clienti con il **PED** (`ped.bigantagency.it`) [R] | Doppio lavoro se BigAnt OS replica il PED | **Mettere da parte** queste sezioni. In futuro **collegare il PED** (prima in sola lettura) per mostrare piano e approvazioni in BigAnt OS. Il PED originale non si tocca senza autorizzazione | P3 · collegamento mancante | Decisione futura; nel frattempo le sezioni non compaiono |
| FUN-037 | "I tuoi servizi" | Piace: il cliente vede i servizi attivati con BigAnt e l'amministrazione vede gli stessi servizi nella scheda del cliente [R] | — | **Tenere** su entrambi i lati, come contenitore dei report (FUN-036) | P1 · da conservare | Lo stesso elenco di servizi attivi compare nei due lati |
| FUN-038 | "Servizi consigliati per te" | Da eliminare per ora [R] | — | Togliere | P3 · decisa | La sezione non compare |
| FUN-039 | "Documenti e amministrazione" | Giusto che l'agenzia veda contratti, fatture e pagamenti del cliente, e che **anche il cliente** veda il proprio contratto, le fatture e i pagamenti fatti [R] | — | Card **Documenti** su entrambi i lati, ciascuno limitato al proprio cliente. **Dipendenza:** finché il registro ufficiale dei pagamenti è Trello (D-09), in BigAnt OS i pagamenti non ci sono; vedi D-10 | P2 · decisa, con dipendenza | Il cliente vede solo i propri documenti, verificato sul server |
| FUN-040 | "Contatti e clienti" | Va dentro il servizio **Email marketing**: lì si raccolgono i contatti che danno il consenso [R] | Sezione isolata senza un servizio di riferimento | Spostare nel servizio Email marketing, visibile solo a chi lo ha attivo | P3 · decisa | La sezione compare solo dentro Email marketing |
| FUN-041 | "Iscritti Fidelity" e moduli futuri | Si sblocca **solo** per chi ha attivato il piano Fidelity, e così in futuro il menu digitale e gli altri moduli [R] | — | Regola generale: **ogni sezione legata a un servizio compare solo se il servizio è attivo** per quel cliente. Nel menu del cliente la regola esiste già per Fidelity [C: `allowedNav()`]; nella dashboard cliente è [DV] | P2 · decisa | Un cliente senza Fidelity non vede la sezione né riceve i dati dal server |
| FUN-042 | "Chiedi all'agenzia" | I clienti scrivono quasi sempre su **WhatsApp** [R] | Funzione che nessuno userebbe | Togliere | P3 · decisa | La sezione non compare |
| FUN-043 | "Il tuo profilo / La tua attività" | Da togliere [R] | — | Togliere | P3 · decisa | La sezione non compare |
| FUN-044 | "Collegamento alla fonte dei dati" | **Piace molto:** il cliente vede da dove arrivano i dati e che sono veri, non inventati [R] | Fiducia del cliente | **Tenere solo nella vista cliente**, accanto a ogni report: fonte, data dell'ultimo aggiornamento e collegamento all'originale. Non serve nel lato amministrazione | P2 · da conservare | Ogni dato mostrato al cliente ha la sua fonte e la data |
| FUN-045 | Vista cliente dal pannello dell'amministrazione | **Decisione rivista dal proprietario a fine giro [R]:** la *Vista cliente* **resta**, solo per l'amministrazione, per controllare cliente per cliente come vede la piattaforma (vedi FUN-067). Cambia solo "Apri attività", che apre la scheda dell'agenzia (FUN-034) | — | Tenere "Vista cliente" nel gruppo **Sistema**, con la scelta del cliente; in più un pulsante **"Guarda come il cliente"** nella scheda cliente | P2 · decisa | Dall'amministrazione si vede la piattaforma esattamente come la vede un cliente scelto, senza poter modificare nulla per suo conto |

---

## 7. Lavori e contenuti

### Cosa contiene oggi [C]

Lavori (task) e contenuti (piano editoriale, versioni, approvazioni) dell'attività selezionata. È la **pagina d'ingresso del collaboratore** (`S.view=…'work'`) ed è presente anche nel menu del cliente. Le bozze dello sciame (per esempio quelle Social) finiscono nei contenuti e da lì nelle approvazioni (`src/agents/outputs.js`, `src/sciame/index.js`).

### Decisione del proprietario [R]

**Eliminare.** Non se ne capisce il senso. I task si gestiscono su **Trello** (D-03) e il piano editoriale sul **PED** (COL-004).

### Voci

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-046 | Lavori e contenuti | Doppione di Trello (task) e del PED (piano editoriale) [R] | Tre posti per la stessa cosa | **Togliere la voce** dai menu di amministrazione, collaboratore e cliente. Il codice resta (D-05) perché ci si appoggiano lo sciame e le approvazioni | P2 · decisa | La voce non compare in nessun menu; sciame e approvazioni funzionano ancora (test verdi) |
| FUN-047 | Collaboratore → pagina d'ingresso | Oggi il collaboratore entra proprio su *Lavori e contenuti* [C] | Tolta la voce, il collaboratore non ha più una pagina d'ingresso sensata | La **home del collaboratore** (FUN-002) va ripensata senza task e senza piano editoriale: per esempio clienti assegnati, accessi e scheda informativa dei clienti, approvazioni. Da decidere a fine giro, insieme al menu del collaboratore | P1 · conseguenza da risolvere | Il collaboratore entra su una home utile senza passare da *Lavori e contenuti* |
| FUN-048 | Bozze dello sciame | Le bozze degli agenti (per esempio i post Social) oggi passano dai contenuti [C]. **Decisione [R]:** la revisione e l'approvazione delle bozze degli agenti fanno parte dello **Sciame di agenti**, non di altre pagine | Senza *Lavori e contenuti* serve un posto unico | Dentro *Sciame di agenti*, una scheda **"Da approvare"** con le bozze prodotte dagli agenti (testo, agente, cliente, esito del controllo qualità, approva o rimanda con nota). Il **collaboratore** vede solo questa scheda dello sciame (coerente con FUN-022). Cosa fare della voce *Approvazioni* si decide quando la analizziamo | P2 · decisa | Una bozza di un agente si approva da Sciame → Da approvare; il collaboratore vede quella scheda e nient'altro dello sciame (verifica sul server) |

---

## 8. Growth (e verifica del trasferimento di Fidelity)

### Visione del proprietario [R]

Growth è un **progetto-prodotto** come Fidelity, e come sarà il futuro **Menu digitale**. Si appoggia allo sciame di agenti, va tenuto **in evidenza** e va **attivato davvero**. Oggi, cercando attività locali, restituisce solo risultati "DEMO". L'app originale BigAnt Growth esiste ed è online su un progetto Railway separato. Fidelity è stata collaudata molte volte, lato amministrazione e lato utente, quando era il progetto separato "BigAnt Fidelity", e funzionava. Va verificato che il trasferimento in BigAnt OS sia corretto. In Fidelity manca ancora l'inserimento in **Apple Wallet e Google Wallet**.

### Cosa risulta dal codice e dagli inventari del trasferimento [C]

Fonti: `research/GROWTH-INVENTARIO.md`, `research/FIDELITY-INVENTARIO.md`, `src/growth-providers.js`.

**Growth.** La logica è stata trasferita quasi tutta e passa i suoi **24 test**:
- CRM a 8 fasi, deduplica, punteggio, bozze, consensi, disiscrizioni;
- import/export, budget, job con ripresa, conversione da lead a cliente.

Però **tutte le funzioni esterne sono state sostituite da simulatori senza rete**: `src/growth-providers.js` non fa nessuna chiamata. Per questo la ricerca restituisce attività inventate. Mancano:
- ricerca web reale (Brave Search);
- lettura dei siti veri;
- analisi con l'AI;
- invio con Gmail;
- calendario Google.

L'inventario dice esplicitamente: «l'OS non è ancora un sostituto pronto della produzione Growth». Il collaudo dell'interfaccia completa non è stato fatto.

**Fidelity.** La logica è stata trasferita e passa i suoi **27 test**:
- programmi a timbri, punti e coupon; iscritti e consensi;
- accrediti, riscatti e storni; carta pubblica e iscrizione;
- export, anonimizzazione, campagne in bozza, automazioni, loghi, QR.

Restano **non verificati di persona nell'interfaccia di BigAnt OS**:
- scanner con la fotocamera;
- carta pubblica;
- iscrizione;
- schermate dell'amministrazione.

L'**emissione dei pass Wallet** (Apple e Google), le notifiche e i reinvii sono **bloccati** (rispondono "409"). Esistono solo i generatori dei contenuti del pass. Nell'originale l'Apple Wallet era fermo per un blocco del deployment Apple, non risolto.


**Confronto con l'originale `lol-afk23456/bigant-growth`** (revisione `cfd4b0b`, la stessa dell'inventario; letta in sola lettura il 9/10) [C]:

| Collegamento nell'originale (`lib/providers.js`) | Servizio esterno | In BigAnt OS (`src/growth-providers.js`) |
|---|---|---|
| `search` | Brave Search API | Simulatore |
| `publicAddress` più lettura del sito | Siti web pubblici, con protezione contro indirizzi interni | Presente solo su indirizzi `.example` |
| `ai` | OpenAI, Responses API (`gpt-4.1-mini`) | Simulatore |
| `googleToken`, `exchange`, `profile` | Accesso Google (OAuth) | Bloccato (risposta 409) |
| `send`, `findSent`, `thread` | Gmail | Simulatore |
| `busy`, `book`, `event`, `cancelEvent` | Google Calendar | Simulatore |

Nell'originale le chiavi (Brave, OpenAI, Google) si inseriscono dall'interfaccia e sono salvate **cifrate nel database** con `APP_SECRET`; non sono variabili di Railway. Per attivare Growth in BigAnt OS bisogna **riportare queste sei famiglie di funzioni**, accese una alla volta come da COL-005, con la stessa custodia cifrata delle chiavi e con le protezioni esistenti (consenso, disiscrizione, approvazione prima dell'invio, tetto di spesa).

**Modalità reale.** Sul server reale i dati DEMO di Growth e Fidelity non vengono caricati: i due moduli partono vuoti.

### Voci

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-049 | Menu → Growth, Fidelity, Menu digitale | Growth e Fidelity sono **prodotti** BigAnt, non pagine di gestione [R] | Oggi stanno mescolati alle altre voci | Gruppo di menu **"Prodotti"**, in evidenza: Growth, Fidelity, in futuro Menu digitale. Ogni prodotto si attiva per cliente come un servizio (FUN-041) | P2 · decisa | I prodotti sono raggruppati e riconoscibili nel menu |
| COL-005 | Growth → ricerca attività locali | La ricerca restituisce solo risultati DEMO [R]. Causa: i fornitori esterni sono simulatori senza rete [C] | Growth non serve ancora al lavoro vero | **Attivazione a fasi**, ciascuna con chiavi, tetto di spesa, test e ok dei soci: **(1)** ricerca reale delle attività (Brave Search o fonte equivalente) e lettura dei siti, solo lettura; **(2)** analisi e punteggio con l'AI (`BIGANT_ANTHROPIC_API_KEY` con tetto); **(3)** bozze dei messaggi, sempre approvate da un socio; **(4)** invio da Gmail **solo manuale**, dopo l'approvazione, con consenso e disiscrizione già gestiti dal codice; **(5)** Google Calendar per gli appuntamenti. Il codice dei fornitori reali si recupera dall'originale `bigant-growth` (in sola lettura) e si ricollauda | P1 · collegamento mancante | Fase 1: una ricerca su "ristoranti Caserta" restituisce attività vere con fonte e data; nessun invio parte senza un'approvazione registrata |
| FUN-050 | Growth → verifica del trasferimento | Il proprietario vuole la certezza che il trasferimento sia corretto [R] | — | **Collaudo completo sul server reale**, percorso per percorso: lead → analisi → bozza → approvazione → (invio simulato) → appuntamento → conversione in cliente. Confronto voce per voce con l'inventario e con l'app originale | P1 · verifica | Ogni riga dell'inventario Growth risulta provata nell'interfaccia, con esito scritto |
| FUN-051 | Fidelity → verifica del trasferimento | Fidelity funzionava come progetto separato; non è dimostrato che funzioni uguale dentro BigAnt OS [R] [C] | Rischio di regressioni non viste | **Collaudo completo sul server reale**, lato amministrazione e lato iscritto: creare il programma, iscriversi dalla carta pubblica, accreditare con lo scanner (fotocamera, da telefono), riscattare, stornare, esportare. Stessa lista di prove usata in passato sull'originale | P1 · verifica | La lista di prove dell'originale passa tutta su BigAnt OS, anche da telefono |
| COL-006 | Fidelity → Apple Wallet e Google Wallet | Manca l'inserimento nel Wallet [R]. Nel codice l'emissione è bloccata; esistono solo i generatori dei contenuti del pass [C] | La carta non si può salvare nel telefono | **Google Wallet:** emittente e account di servizio Google (variabili già previste nell'originale), poi attivazione e prova su un telefono Android. **Apple Wallet:** serve sbloccare l'account Apple Developer (Pass Type ID e certificati), problema aperto anche nell'originale. Certificati e chiavi solo nelle variabili di Railway, mai nel repository | P2 · collegamento mancante | Una carta di prova si aggiunge a Google Wallet e ad Apple Wallet e si aggiorna dopo un accredito |
| DAT-003 | Growth e Fidelity → dati esistenti | Le app originali **non sono ancora usate da nessuno** [R] | Nessun dato vero da salvare | **Nessuna importazione necessaria.** Prima di spegnere le originali, controllo veloce che non contengano dati da tenere (solo conteggi, senza copiarli) | P3 · semplificata dalla decisione D-11 | Conteggi verificati prima dello spegnimento |

### Fidelity: lavoro da fare (da non esaminare ora) [R]

Il proprietario non vuole guardare Fidelity adesso, ma va messo in lista per Codex:
1. **Confronto con l'originale** `lol-afk23456/Fidelity`, in sola lettura, funzione per funzione rispetto a `research/FIDELITY-INVENTARIO.md`. Riportare in BigAnt OS quello che manca. L'accesso al repository va autorizzato dal proprietario: in questa sessione è stato bloccato.
2. **Collaudo completo sul server reale** (FUN-051), lato amministrazione e lato iscritto, anche da telefono con lo scanner.
3. **Google Wallet e Apple Wallet** (COL-006).
4. **Nessuna importazione di dati**: l'originale non è usato da nessuno (D-11). Poi si spegne l'originale.
5. Fidelity diventa un **prodotto** nel gruppo "Prodotti" (FUN-049) e si attiva per cliente come servizio (FUN-041).

---

## 9. Ufficio virtuale e Sciame di agenti

### Cosa contengono oggi [C]

- **Ufficio virtuale** (`public/ufficio.js`): gli agenti al lavoro **in tempo reale**, stanza per stanza, con il testo che scrivono in diretta.
- **Sciame di agenti** (`public/app.js`, vista agenti):
  - i 32 agenti per reparto;
  - **"Giri dell'attività"**: lo **storico delle esecuzioni** degli agenti per il cliente selezionato (agente, quando, stato, esito, "Leggi elaborato");
  - **"Automatismi pianificati"**: le **regole che fanno partire gli agenti da sole** a orari fissi (calendari) o dopo un evento;
  - **"Budget del pilota"**: il tetto mensile di spesa condiviso da tutti i reparti;
  - **"Attività dei moduli collegati"**: la **coda dei lavori di Growth e Fidelity** (ricerche, analisi, aggiornamenti delle tessere). Non riguarda la configurazione degli agenti.

**Stato reale degli agenti:**
- Dei 32 agenti, tutti hanno una **procedura base senza AI**, cioè regole fisse.
- Solo **11** hanno anche le istruzioni per lavorare con l'AI (`.claude/agents/`, sciame in `src/sciame/`), provate in locale.
- Sul server reale **nessun agente usa l'AI**, perché la chiave non è impostata.
- **Nell'interfaccia non c'è modo di configurare un agente** né di vedere se è configurato.

### Giudizio del proprietario [R]

- Ufficio virtuale e Sciame sono **la stessa cosa vista da due lati**: l'Ufficio è il **davanti**, la vista dal vivo che **piace tantissimo**; lo Sciame è il **dietro**, l'elenco e la configurazione.
- Gli agenti vanno configurati con l'AI **uno alla volta**, e deve essere chiaro **quale è configurato e quale no**, così da usare solo quelli attivi.
- "Giri dell'attività" e "Automatismi pianificati" non si capiscono; gli automatismi sono da eliminare.
- Il "Budget del pilota" piace.

### Voci

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-052 | Ufficio virtuale + Sciame di agenti | Due voci per la stessa materia, davanti e dietro [R]. **Confermata [R]** | Doppione nel menu | **Una sola voce "Sciame di agenti"** con schede (PRINC-01): **Ufficio** (dal vivo, la prima scheda) · **Agenti** (elenco e configurazione) · **Da approvare** (FUN-048) · **Storico** · **Budget**. In testa il riquadro "cabina di regia" (UI-008) | P2 · decisa | Una sola voce nel menu; l'Ufficio si apre per primo |
| UI-011 | Ufficio virtuale | Piace tantissimo [R] | — | **Conservare** l'aspetto e la diretta così come sono | P2 · da conservare | Nessuna regressione dell'Ufficio dopo il riordino |
| FUN-053 | Sciame → Agenti | Non si vede quali agenti sono configurati e non c'è modo di configurarli [R] [C] | Non si sa quali agenti usare | Per ogni agente uno **stato chiaro**: **Da configurare** → **Base** (procedura senza AI) → **AI pronta** (istruzioni, fonti, prova superata) → **Attivo** (usato nel lavoro vero). Una **scheda di configurazione** per agente: compito, servizio a cui serve, istruzioni, fonti di dati, controllo qualità, costo stimato, "quando lavora". Si usano solo gli agenti **Attivi** | P1 · nuova funzione | L'elenco mostra lo stato di ciascun agente; un agente non Attivo non parte nel lavoro vero |
| FUN-054 | Sciame → ordine dei lavori | Il proprietario si chiede se analizzare gli agenti ora o prima sistemare la struttura [R] | — | Raccomandazione: **prima la struttura** (menu, schede, scheda cliente, stati degli agenti), **poi si configurano gli agenti uno alla volta**, partendo da quelli che servono ai **servizi già attivi** (Piano di attivazione, FUN-014) e alla ricerca clienti di Growth (COL-005). Ogni agente si analizza quando arriva il suo turno | P1 · proposta | Esiste un ordine di configurazione scritto, legato ai servizi |
| UI-012 | Sciame → "Giri dell'attività" | Non si capisce cosa sia [R]. È lo storico delle esecuzioni [C] | Nome oscuro | Rinominare **"Storico"**: cosa ha fatto ogni agente, quando, con quale esito, con il collegamento al risultato | P2 · difetto di testo | Il nome si capisce senza spiegazioni |
| FUN-055 | Sciame → "Automatismi pianificati" | Da eliminare [R]. Sono le regole che fanno partire gli agenti da soli [C] | Pannello incomprensibile, e gli automatismi lanciano lavoro senza che nessuno lo chieda | Togliere il pannello. La regola "quando lavora" diventa un campo della **configurazione del singolo agente** (FUN-053), disattivato finché l'agente non è **Attivo** e i soci non lo autorizzano | P2 · decisa | Nessun pannello di automatismi; nessun agente parte da solo se non è Attivo e autorizzato |
| FUN-056 | Sciame → "Budget del pilota" | Piace: è il budget dello sciame [R] | — | **Tenere** come scheda **Budget**: tetto mensile, speso, costo per agente | P2 · da conservare | Il budget mostra speso e tetto aggiornati |
| FUN-057 | Sciame → "Attività dei moduli collegati" | Non si capisce [R]. È la coda dei lavori di Growth e Fidelity, non la configurazione degli agenti [C] | Informazione nel posto sbagliato | Spostare in **Growth** e in **Fidelity**, ciascuno con la propria coda (FUN-049) | P3 · proposta | La coda di Growth si vede in Growth, quella di Fidelity in Fidelity |

---

## 10. Registro attività e Servizi

### Registro attività [C]

"Ogni azione lascia una traccia": è il **registro comune di chi ha fatto cosa** (`os_audit`). Contiene gli agenti, ma anche e soprattutto **le persone**: accessi, approvazioni, modifiche, creazione di utenti.

**Decisione del proprietario [R]:** ogni agente deve avere il **proprio registro**, dentro lo Sciame / Ufficio virtuale. La voce "Registro attività" si elimina.

**Nota del consulente:** il registro serve anche per la **sicurezza**, non solo per gli agenti. È lì che deve risultare chi ha visto le credenziali di un cliente (FUN-010), chi ha creato o disattivato un utente, chi ha approvato cosa. Va tolto dal menu, ma non va cancellato: deve restare consultabile dall'amministrazione.

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-058 | Registro attività → parte agenti | Il registro degli agenti va dentro ogni agente [R] | — | Nella scheda di ogni agente (FUN-053) e nello **Storico** dello Sciame (UI-012): cosa ha fatto, quando, con quale esito | P2 · decisa | Aprendo un agente si vede il suo registro |
| FUN-059 | Registro attività → voce di menu | Da eliminare [R] | — | Togliere la voce dal menu di tutti i ruoli. Il **registro delle persone** (accessi, credenziali viste, utenti, approvazioni) resta, **solo per l'amministrazione**, nella voce **Accessi** come scheda **Registro** (gruppo **Sistema**, FUN-066). Non si cancella nessuna riga | P2 · decisa con riserva del consulente | La voce non è nel menu; dall'area Avanzate l'amministrazione ritrova "chi ha visto le credenziali di X" |

### Servizi [C]

"Tutti i servizi, con il loro spazio": il **catalogo dei 27 servizi**, ciascuno con una pagina di dettaglio (perimetro, metodo, stato "Solo struttura" o "Flusso DEMO parziale", lavoro condiviso). Il cliente vede solo i servizi attivi.

**Giudizio del proprietario [R]:** non è chiaro quali servizi siano; probabilmente è la stessa cosa dei servizi di cui si è parlato prima (Mappa agenzia e Marketing BigAnt).

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-060 | Servizi | Non si capisce quali servizi siano. È il **terzo posto** che parla dei servizi, dopo "Un workspace per ogni servizio" (Mappa agenzia) e "Le aree del marketing" (Marketing BigAnt) [R] [C] | Tre pagine per lo stesso argomento | **Una sola voce "Servizi"** per l'amministrazione, che è il **Piano di attivazione dei servizi** (FUN-014): elenco dei servizi BigAnt con stato (**Attivo · In preparazione · Futuro**), cosa manca per attivarlo, data obiettivo, agenti che lo seguono (stato da FUN-053) e voce di **Listino** (FUN-031). La pagina di dettaglio resta, a card (PRINC-01). Lato cliente, "Servizi" è "I tuoi servizi" con i report (FUN-036, FUN-037) | P2 · proposta, da confermare | Un solo posto spiega quali servizi offre BigAnt e a che punto è ciascuno |
| UI-013 | Servizi | Avviso «Le schede descrivono il perimetro. "Solo struttura" significa…» [C] | Linguaggio tecnico | Sostituire con i tre stati semplici del Piano di attivazione (UI-004) | P2 · difetto di testo | Nessun avviso tecnico nella pagina |


---

## 11. Approvazioni

### Cosa contiene oggi [C]

Una **coda unica** di tutte le decisioni in sospeso (`os_approvals`). Ci finiscono le bozze dello sciame (`src/sciame/index.js`), i messaggi commerciali di Growth (`src/growth-store.js`) e le campagne Fidelity. Ogni approvazione è legata alla versione del testo: se il testo cambia, l'approvazione vecchia non vale più.

### Decisione del proprietario [R]

Le approvazioni si gestiscono **dentro lo Sciame di agenti**. Regola: quello che gli agenti preparano in autonomia, per esempio i post, **deve essere approvato da una persona** (un socio o un collaboratore BigAnt). Solo dopo l'approvazione si **pubblica in automatico**. **Senza approvazione umana non si pubblica nulla.**

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-061 | Approvazioni → voce di menu | Le approvazioni vanno nello Sciame [R] | Una voce in più nel menu | Togliere la voce "Approvazioni": tutto confluisce nella scheda **Da approvare** dello Sciame (FUN-048), con un filtro per tipo (post, messaggi Growth, campagne Fidelity) e il contatore nella home dell'amministrazione | P2 · decisa | Una sola coda "Da approvare", dentro lo Sciame |
| FUN-062 | Regola di pubblicazione | **Nessuna pubblicazione senza approvazione umana**; dopo l'approvazione, pubblicazione automatica [R] | Garanzia per l'agenzia e per i clienti | Regola **applicata dal server**, non solo dall'interfaccia: una pubblicazione parte solo se esiste un'approvazione di una persona, sulla **stessa versione** del testo (il codice già annulla le approvazioni dei testi modificati [C]). La pubblicazione automatica richiede il collegamento al canale (Meta, PED, o un programmatore di post: COL-002, COL-004) ed è **spenta finché non viene collaudata e autorizzata** | P1 · decisa | Un tentativo di pubblicare senza approvazione, o con un'approvazione su una versione precedente, viene rifiutato dal server (test automatico) |
| FUN-063 | Chi approva cosa | Approvano soci o collaboratori [R] | Serve chiarezza sui permessi | Proposta: **post social** → socio **o** collaboratore; **messaggi commerciali Growth** e **campagne Fidelity** → **solo soci** (oggi il codice di Growth richiede già un socio [C]). Da confermare (D-15) | P2 · proposta | Un collaboratore può approvare un post ma non un messaggio commerciale (verifica sul server) |

---

## 12. Collegamenti, Accessi e Vista cliente

### Giudizio del proprietario [R]

- **Collegamenti** piace. Lo vede **solo l'amministrazione** e raccoglie tutti i collegamenti che servono a far funzionare BigAnt OS.
- **Accessi** piace. Lo vede **solo l'amministrazione** e ci si gestiscono tutti gli accessi: soci, collaboratori, clienti.
- **Vista cliente** piace e **resta** (rivede FUN-045): serve a controllare, cliente per cliente, come i clienti vedono la piattaforma. Va migliorata come già detto (sezione 6).

### Cosa risulta dal codice [C]

- **Collegamenti** mostra i 17 collegamenti esterni, tutti spenti. L'avviso dice: «In questa sessione non puoi attivare account, inserire chiavi o avviare servizi a pagamento. Le versioni online di Growth e Fidelity restano indipendenti».
- **Accessi** mostra persone, ruolo, attività assegnate e stato, con i pulsanti "Nuova password" e "Nuovo accesso DEMO". Avviso: «Gli accessi creati qui appartengono soltanto al prototipo locale». **Sul server reale questa frase è falsa:** gli accessi sono veri. Creazione e modifica degli utenti sono riservate ai soci sul server (`requireOwner`).

### Voci

| ID | Pagina / percorso | Problema osservato | Conseguenza per l'utente | Modifica proposta | Priorità | Come verificare che sia risolto |
|---|---|---|---|---|---|---|
| FUN-064 | Collegamenti | Da tenere, solo amministrazione [R] | — | Tenere nel gruppo **Sistema**. Per ogni collegamento: **a cosa serve** (servizio o prodotto), stato (**Da collegare · Collegato · Errore**), data dell'ultima verifica, chi l'ha collegato. È il posto dove si **inseriscono le chiavi** (Brave, AI, Google, Meta…), salvate cifrate come nell'originale Growth (COL-005). Qui confluisce la fondamenta "Custodia dei collegamenti" | P2 · decisa | Ogni collegamento dichiara a cosa serve e il suo stato; nessuna chiave compare in chiaro dopo il salvataggio |
| UI-015 | Collegamenti → avviso | Testo da prototipo: «In questa sessione…», «Le versioni online di Growth e Fidelity restano indipendenti» [C] | Contraddice D-13 (piattaforma unica) e confonde | Riscrivere: «Qui colleghi i servizi esterni che BigAnt OS usa. Nessun collegamento si attiva senza l'ok dei soci» | P2 · difetto di testo | Nessun riferimento a "sessione" o "prototipo" sul server reale |
| FUN-066 | Accessi | Da tenere, solo amministrazione; gestione di tutti gli accessi [R] | — | Tenere nel gruppo **Sistema**, con due schede: **Persone** (soci, collaboratori, clienti, assegnazione dei clienti ai collaboratori, "Nuova password", disattiva) e **Registro** (chi è entrato, chi ha visto le credenziali di un cliente, chi ha creato o disattivato utenti: FUN-059) | P1 · decisa | Dalla stessa voce si gestiscono gli utenti e si consulta il registro |
| UI-014 | Accessi → "Nuovo accesso DEMO", avviso «appartengono soltanto al prototipo locale», modulo «Nuovo utente DEMO» con «Nome di esempio», «Email .example», «Password dedicata al prototipo» | Sul server reale gli accessi sono **veri** e il server accetta email vere [C: `server.js`, `/api/users` POST con `realMode`]: le scritte sono **ingannevoli** e fanno pensare che non si possa inserire l'email vera di Vincenzo | Si rischia di non prendere sul serio account reali | Per la regola UI-006 la funzione è già reale, quindi **togliere ora** "DEMO" e l'avviso in modalità reale. Pulsante "Nuovo accesso" | P1 · difetto | Sul server reale la pagina Accessi non contiene "DEMO" né "prototipo" |
| FUN-067 | Vista cliente | Resta, solo amministrazione, per controllare cliente per cliente [R] | — | Nel gruppo **Sistema**: si sceglie il cliente e si vede la sua dashboard **in sola lettura**. Riflette sempre la nuova dashboard cliente (UI-010, FUN-036…044). Pulsante "Guarda come il cliente" anche nella scheda cliente | P2 · decisa | Scelto un cliente, la vista coincide con quella che il cliente vede entrando con le sue credenziali |

---

## 13. Sintesi del giro lato amministrazione (9 ottobre 2026)

### 13.1 Nuovo menu dell'amministrazione

Da 16 voci a **12**, in 4 gruppi. Ogni voce segue PRINC-01: card e una sezione alla volta.

| Gruppo | Voce | Contenuto | Voci di oggi che vi confluiscono |
|---|---|---|---|
| **Lavoro** | **Home** | Cosa richiede attenzione oggi (13.3) | Mappa agenzia come pagina d'ingresso, Direzione (in parte) |
| | **Clienti** | Schede: **Elenco** (card, Nuova attività, avviso contratti in scadenza) · **Risultati dei clienti**. Scheda cliente dell'agenzia a card | Clienti, Anagrafiche, Contratti e rinnovi, Memoria del cliente zero |
| | **Servizi** | Piano di attivazione dei servizi (stato, cosa manca, data obiettivo, agenti) e Listino (proposta) | Servizi, "Un workspace per ogni servizio", Le aree del marketing, Tariffe confermate |
| | **Profili** | Profili dell'agenzia e di ogni cliente, con dati e crescita | Canali di Marketing BigAnt |
| | **Sciame di agenti** | Schede: Ufficio · Agenti · Da approvare · Storico · Budget · Struttura. Cabina di regia in testa | Ufficio virtuale, Sciame di agenti, Approvazioni, Reparti e specialisti, parte agenti di Direzione e del Registro |
| **Prodotti** | **Growth** | CRM e ricerca clienti, con la sua coda di lavori | Growth, sua parte di "Attività dei moduli collegati" |
| | **Fidelity** | Programmi fedeltà, con la sua coda di lavori | Fidelity, sua parte di "Attività dei moduli collegati" |
| **Sistema** | **Vista cliente** | La piattaforma come la vede un cliente scelto | Vista cliente |
| | **Accessi** | Persone · Registro | Accessi, Registro attività (parte persone) |
| | **Collegamenti** | Collegamenti esterni e chiavi | Collegamenti, Custodia dei collegamenti |
| | **Avanzamento** | Stato di costruzione di BigAnt OS, Fondamenta | Mappa agenzia, Fondamenta da completare |
| *(ultima)* | **Fatturazione** | Incassi e arretrati, Da fatturare, Prima nota con cassa a 30/60/90, Tracker incassi, Costi e abbonamenti, Compensi. **Secondo piano**; registro ufficiale ancora Trello | Amministrazione, moduli economici del gestionale |

**Tolte dal menu:** Mappa agenzia, Marketing BigAnt, Direzione, Lavori e contenuti, Approvazioni, Registro attività, Ufficio virtuale (come voce a sé), Amministrazione (rinominata).

### 13.2 Le 16 voci di oggi, una per una

| Voce di oggi | Destino |
|---|---|
| Mappa agenzia | → **Avanzamento** (Sistema); Reparti → Sciame; Servizi → Servizi; Gestionale smontato (FUN-007) |
| Marketing BigAnt | Eliminata → **Profili**; le aree diventano il Piano di attivazione |
| Direzione | Eliminata → cabina di regia in Sciame; contratti in scadenza in Clienti; soldi in Fatturazione; il resto su Trello |
| Amministrazione | → **Fatturazione**, ultima voce |
| Clienti | Resta, con la nuova scheda dell'agenzia |
| Lavori e contenuti | Eliminata: task su Trello, piano editoriale sul PED |
| Growth | Resta in **Prodotti**, da attivare |
| Fidelity | Resta in **Prodotti**, da collaudare e completare con il Wallet |
| Ufficio virtuale | → scheda **Ufficio** dello Sciame |
| Sciame di agenti | Resta, unificato |
| Approvazioni | → scheda **Da approvare** dello Sciame |
| Registro attività | Agenti → Sciame; persone → Accessi → Registro |
| Servizi | Resta, diventa il Piano di attivazione |
| Collegamenti | Resta in Sistema |
| Accessi | Resta in Sistema |
| Vista cliente | Resta in Sistema |

### 13.3 Home dell'amministrazione, aggiornata alle decisioni

Stile della "cabina di regia" (UI-008), card cliccabili. **Niente soldi** (Fatturazione è in secondo piano) e **niente task** (sono su Trello).
1. **Da approvare**: numero di bozze in attesa, collegamento a Sciame → Da approvare.
2. **Contratti in scadenza** nei prossimi 30 giorni, collegamento a Clienti.
3. **Clienti**: attivi e nuovi del mese.
4. **Growth**: nuovi lead da guardare (quando Growth è attivo).
5. **Sciame**: agenti attivi, lavori fermi o bloccati dal controllo qualità, budget speso rispetto al tetto.
6. **Collegamenti in errore**, se ce ne sono.

### 13.4 Collaboratore e cliente: bozza da completare nei prossimi giri

**Collaboratore (Vincenzo).** Giro previsto l'11/10. Bozza dalle decisioni prese finora:
- Home: clienti assegnati e bozze da approvare;
- Clienti assegnati: scheda con anagrafica, accessi, scheda informativa, servizi attivi e report. Contratto e documenti: [DV];
- Sciame: solo la scheda Da approvare.

**Cliente.** Giro previsto il 10/10. Bozza dalle decisioni prese finora:
- Home a card;
- I tuoi servizi, con i report e la fonte dei dati;
- I tuoi profili;
- Documenti (per ora solo il contratto);
- Fidelity e altri prodotti, solo se attivi;
- I tuoi risultati, dopo che l'amministrazione li avrà collaudati.

Tolti: Chiedi all'agenzia, Il tuo profilo, Servizi consigliati, Report mensili, Approvazioni e calendario (PED).

### 13.5 I percorsi completi dopo il riordino

| Percorso | Come funzionerà | Cosa manca (voci) |
|---|---|---|
| Nuovo cliente → servizi → lavori → consegna | Clienti → Nuova attività → scheda cliente (contratto, accessi, scheda informativa, servizi attivi) → lavori su **Trello** → report nel servizio | Scheda dell'agenzia (FUN-034), Avvio cliente, report reali (COL-002) |
| Contenuto → revisione → approvazione → programmazione | Agente prepara la bozza → Sciame → Da approvare (socio o collaboratore) → pubblicazione automatica **solo dopo l'approvazione** | Scheda Da approvare (FUN-048/061), regola sul server (FUN-062), collegamento al canale o al PED (COL-004) |
| Lead → analisi → proposta → cliente | Growth: ricerca reale → analisi AI → bozza approvata da un socio → appuntamento → conversione in cliente (esiste già) | Collegamenti reali (COL-005), collaudo (FUN-050) |
| Contratto → fattura → incasso → scadenze | Contratto nella scheda cliente con avviso di scadenza → fattura su **Aruba** → incasso registrato su **Trello** | Contratto con date (FUN-023); Fatturazione di BigAnt OS in secondo piano (D-09) |
| Agente → incarico → risultato → controllo → approvazione | Sciame → Agenti (solo Attivi) → Storico → controllo qualità → Da approvare | Stati e configurazione degli agenti (FUN-053) |
| Cliente → risultati → contenuti da approvare → richiesta | Da definire nel giro lato cliente; richieste via WhatsApp | Giro del 10/10 |
| Accesso → ruolo → permessi → proprio account | Accessi → Persone → ruolo e clienti assegnati → primo accesso con cambio password | Cambio password obbligatorio (FUN-003), testi da correggere (UI-014) |

Il piano di lavoro passo per passo per Codex è in **`docs/PIANO-RIORDINO-CODEX.md`**.

---

## Decisioni che spettano ai soci

| ID | Decisione | Contesto |
|---|---|---|
| D-01 | "Accessi del cliente": solo l'elenco o anche le credenziali? | **DECISA [R]:** anche le credenziali, visibili ad amministrazione e collaboratori, mai ai clienti. Rischio accettato; requisiti minimi in FUN-010 |
| D-02 | "Un workspace per ogni servizio": promemoria per la crescita dell'agenzia o piano per costruire gli agenti? | **DECISA [R]:** serve ad attivare, passo dopo passo ed entro un anno, i servizi che BigAnt oggi non offre. Diventa il Piano di attivazione dei servizi (FUN-014) |
| D-03 | Task e consegne: Trello o BigAnt OS? | **DECISA [R]:** si resta su Trello; il collegamento si valuta in futuro (COL-001) |
| D-04 | Documenti e autorizzazioni: servono in BigAnt OS? | **Risolta da FUN-039 [R]:** card Documenti nella scheda cliente (contratto, poi fatture e pagamenti). Liberatorie e autorizzazioni: [DV], da decidere quando servirà |
| D-05 | Le parti tolte vanno nascoste o eliminate dal codice? | **Da confermare.** Raccomandazione applicata nel piano: nasconderle ora ed eliminarle dopo il collaudo della nuova struttura |
| D-06 | Nome della nuova sezione dei profili | **DECISA [R]:** "Profili" (per il cliente: "I tuoi profili") |
| D-07 | Aggiornamento dei dati dei profili | **DECISA [R]:** una volta al giorno più "Aggiorna ora" |
| D-08 | Riquadro "obiettivo di fatturato" nella home dell'amministrazione | **DECISA [R]:** non si fa |
| D-09 | Registro ufficiale di incassi, canoni e saldi: Trello (bacheca Fatturazione) o BigAnt OS? | **DECISA [R]: per ora resta Trello.** Percorso futuro: **finché la Fatturazione resta in secondo piano, Trello è il registro ufficiale**. BigAnt OS lo sostituisce solo quando il tracker (FUN-028) è collaudato, con un'importazione una tantum e un mese di prova in parallelo |
| D-10 | Fatture e pagamenti visibili al cliente (FUN-039), visto che il registro ufficiale resta Trello (D-09) | **DECISA [R]:** per ora il cliente vede **solo il contratto**; fatture e pagamenti quando la Fatturazione di BigAnt OS diventerà il registro ufficiale |
| D-11 | Si continuano a usare le app originali su Railway nel frattempo? | **DECISA [R]: no.** Le app originali Growth e Fidelity **non sono ancora usate da nessuno**: si lavora direttamente su BigAnt OS. Le originali restano solo come riferimento del codice (sola lettura) finché il trasferimento non è collaudato; poi si spengono |
| D-12 | Ordine di attivazione | **DECISA [R]:** prima il **collaudo di Fidelity** (già funzionante nell'originale, rischio basso), poi **Growth fase 1-2** (ricerca e analisi, senza invii), poi Google Wallet, poi gli invii Growth |
| D-13 | Growth e Fidelity: un'unica piattaforma (BigAnt OS) o app separate? | **DECISA [R]: piattaforma unica.** Chiarimento dato al proprietario: in BigAnt OS Growth e Fidelity **girano completamente dentro** (codice copiato, stesso database), non sono un collegamento alle app originali. Le app originali sono **copie separate**, con database e dati propri, ancora online. Raccomandazione: **un'unica piattaforma**. Il cliente che compra solo Fidelity riceve un accesso BigAnt OS con il solo servizio Fidelity attivo (FUN-041); gli iscritti usano la carta pubblica. Dopo il collaudo (FUN-050, FUN-051) le originali si spengono. Siccome nessuno le usa (D-11), non ci sono tessere o link già distribuiti da preservare |
| D-14 | Growth: analisi AI con OpenAI (come nell'originale) o con Anthropic (come lo sciame di BigAnt OS)? | **Da confermare.** Proposta: **un solo fornitore AI per tutta la piattaforma** (Anthropic, già usato dallo sciame, con un solo tetto di spesa). Da confermare |
| D-15 | Chi può approvare cosa | **Da confermare.** Proposta: post social → socio o collaboratore; messaggi commerciali Growth e campagne Fidelity → solo soci |
| D-16 | Dove vanno le anagrafiche di fornitori, collaboratori e ditte? | **Da confermare.** Proposta: in Fatturazione, insieme a costi e compensi |

## Domande aperte

1. **D-05** nascondere o eliminare le parti tolte (nel piano si nasconde).
2. **D-14** un solo fornitore AI (proposta: Anthropic).
3. **D-15** chi approva cosa.
4. **FUN-060** Servizi = Piano di attivazione (proposta).

## Aggiornamento Codex — 10 ottobre 2026

Confermate in chat: **D-05: nascondere**; **D-15: post social anche ai collaboratori, Growth e Fidelity solo ai soci**; **FUN-060: Servizi come Piano di attivazione, con Listino**. **D-14: scelta rinviata; predisporre Anthropic e OpenAI**, senza attivazione implicita. Questo aggiornamento prevale sulle precedenti proposte per queste sole decisioni.

FUN-003, UI-014, UI-001 e UI-002 implementate in locale; backup Fase 0 provato su un volume temporaneo esterno. Suite 197/197 e controlli 5/5. **Rilascio e collaudo sul server ancora da fare**. Esecuzione delle 92 voci tracciata in `copertura/riordino.json`; dettagli in `DIARIO-LAVORO.md`.

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
