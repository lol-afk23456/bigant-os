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
| Marketing BigAnt, Direzione, Amministrazione, Clienti, Lavori e contenuti, Growth, Fidelity, Ufficio virtuale, Sciame di agenti, Approvazioni, Registro attività, Servizi, Collegamenti, Accessi, Vista cliente | Da esaminare |
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
| UI-002 | Accesso | Si vedono gli "account demo" [R]. In modalità reale il codice li nasconde: compaiono solo se il server risponde `demo:true` (`public/app.js:62`) [C]. Il server reale risponde `demo:false` [C, verificato dal vivo il 9/10] | Se è il server reale, è un difetto grave; se è il sito di prova, è il comportamento previsto | Chiarire su quale indirizzo è stata vista (domanda 1). Sul server reale: nessun profilo dimostrativo, nessuna "ANTEPRIMA INTERATTIVA", nessun testo "dati inventati" | P1 · [DV] | Su `bigant-os-server-production.up.railway.app` il login non mostra profili DEMO |
| FUN-001 | Accessi | Servono gli accessi definitivi: amministrazione, collaboratore Vincenzo, cliente BigAnt [R] | Senza, il collaboratore e il cliente non possono essere collaudati | Creare da *Accessi*: utente collaboratore (Vincenzo) e utente cliente collegato al cliente di prova "BigAnt" (vedi DAT-001). Account nominali, password scelte dai titolari, mai scritte in chat o nei documenti | P1 · funzione esistente da usare | Tre accessi distinti entrano e ciascuno vede solo il proprio spazio |
| DAT-001 | Clienti / Accessi | Oggi l'unico cliente nel database reale è "BigAnt", ed è l'agenzia stessa ("cliente zero" del Marketing BigAnt) [C: `src/store.js`, `seedRealCore`] | Usare quel record come cliente di prova mescolerebbe i dati dell'agenzia con quelli del cliente | Creare un cliente separato, per esempio "BigAnt (cliente di prova)", con servizi attivi propri, e collegarci l'utente cliente | P1 · decisione + dati | Il cliente di prova ha una scheda propria; la vista cliente non mostra dati interni dell'agenzia |
| FUN-002 | Dopo il login | Si entra in automatico su *Mappa agenzia* [R] [C: `public/app.js`, `S.view=isOwner()?'agency':…`] | La prima schermata non risponde alla domanda "cosa devo fare oggi?" | **Una home diversa per ogni ruolo**, come prima pagina dopo il login (proposta di contenuti sotto) | P1 · nuova funzione | Ogni ruolo entra sulla propria home, la Mappa agenzia non è più la pagina d'ingresso |
| FUN-003 | Accesso | Non esiste il recupero della password né il cambio obbligatorio al primo accesso [C, già dichiarato nel report della Fase 1] | Se la password si perde, oggi serve un intervento tecnico su Railway | Cambio password obbligatorio al primo accesso e recupero password gestito da un socio dalla sezione Accessi (nessuna email automatica finché le email sono spente) | P1 · nuova funzione | Un nuovo utente deve cambiare la password al primo accesso; un socio può reimpostare quella di un altro |

### Proposta di home per ruolo (da validare con i soci)

**Amministrazione: funzionale, "cosa richiede attenzione oggi"**
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
| FUN-006 | Mappa agenzia → "Un workspace per ogni servizio" | Utile, ma configurare un agente AI per ogni servizio richiede molto tempo. Potrebbe servire come **promemoria per la crescita dell'agenzia** oppure come base per costruire gli agenti [R] | Oggi è un elenco senza un uso chiaro | Spostare in **Sciame di agenti**, insieme a FUN-005. Il catalogo commerciale resta nella voce *Servizi*. L'uso da dare (promemoria di crescita o piano di costruzione degli agenti) è una decisione dei soci (D-02) | P3 · decisione | Un solo posto per "servizi e agenti che li seguono"; nessun doppione con *Servizi* |
| FUN-007 | Mappa agenzia → I 10 moduli del gestionale | La sezione non è interessante così; i moduli vanno distribuiti dove servono [R] | Dieci moduli presentati in astratto, staccati dal lavoro | Ripartizione decisa dal proprietario: tabella "Dove finiscono i 10 moduli" qui sotto | P2 · preferenza strutturale | La sezione "Gestionale" non esiste più come elenco astratto; ogni modulo tenuto vive nella sua pagina |
| FUN-008 | Mappa agenzia → Fondamenta da completare | Portfolio e autorizzazioni, capacità del team, obiettivi a 90 giorni, spese insolite, pacchetto per il commercialista, custodia dei collegamenti, onboarding: giudicate inutili da eliminare, o da ricollocare [R] [C: `src/agency/foundations.js`] | Lista di cantieri aperti che appesantisce la pagina | Proposta per ciascuna nella tabella "Fondamenta" qui sotto: togliere dalla vista e ricollocare solo quelle utili | P3 · preferenza | Nessuna "fondamenta da completare" visibile ai soci nelle pagine di lavoro |
| COL-001 | Task e consegne | Oggi i task si gestiscono su **Trello**, e funziona bene [R] | Doppio lavoro se BigAnt OS replica Trello | Valutare un collegamento a Trello in sola lettura: lavori e scadenze dei clienti visibili in BigAnt OS, mentre si continua a lavorare su Trello. Da progettare e autorizzare come ogni collegamento | P3 · collegamento mancante | Decisione dei soci (D-03); se approvato, i lavori Trello di un cliente compaiono nella sua scheda senza essere riscritti |

### Dove finiscono i 10 moduli del gestionale

| Modulo attuale | Decisione [R] | Dove va | Note del consulente |
|---|---|---|---|
| Anagrafiche | Tenere | **Clienti**: anagrafica di ogni cliente dell'agenzia | Sono i clienti di BigAnt, non gli utenti del gestionale |
| Commerciale e contratti | Tenere il contratto | **Clienti → scheda cliente → Contratto**, "sempre a portata di mano" | Il contratto si carica come documento (PDF), con data di inizio, durata e rinnovo |
| Accessi del cliente (nuovo) | Aggiungere | **Clienti → scheda cliente → Accessi** | Vedi D-01: elenco di **quali** accessi esistono (Meta, Google, sito…), chi li possiede e dove sono custoditi. **Non** le password, che restano nel gestore di password |
| Fatturazione e incassi | Secondo piano | **Amministrazione**, solo per l'accesso amministrazione | Collaboratori e clienti non la vedono. Attivazione futura |
| Cassa e prima nota | Secondo piano | **Amministrazione → Fatturazione interna BigAnt** | Come sopra |
| Costi e abbonamenti | Tenere, secondo piano | **Amministrazione** (costi e abbonamenti dell'agenzia) | Come sopra |
| Lavoro e marginalità | **Togliere** | — | Si nasconde; il codice resta finché non si decide |
| Task e consegne | Da valutare | Clienti / Lavori, oppure collegamento Trello (COL-001) | Decisione D-03 |
| Documenti e autorizzazioni | In dubbio | Probabilmente **Clienti → scheda cliente → Documenti** (contratti, liberatorie) | Decisione D-04 |
| Cruscotto di direzione | **Eliminabile** | La sua funzione utile passa alla home dell'amministrazione (FUN-002) | Da riverificare quando si analizza la voce *Direzione* |
| Scadenziario unico | Non commentato | [DV] | Proposta: le scadenze di contratti e rinnovi nella scheda cliente; quelle fiscali in Amministrazione |

### Fondamenta da completare: proposta

| Voce attuale | Proposta |
|---|---|
| Onboarding e salute cliente | Ricollocare: nella scheda cliente come "Avvio cliente" (checklist dei primi giorni) |
| Portfolio e autorizzazioni | Togliere per ora (si può unire a Documenti, D-04) |
| Capacità del team | Togliere: con due soci e un collaboratore non serve ora |
| Obiettivi a 90 giorni | Togliere da qui; se servono, un riquadro nella home dell'amministrazione |
| Spese insolite | Togliere da qui; rientra in Amministrazione quando la fatturazione sarà attiva |
| Pacchetto per il commercialista | Come sopra: in Amministrazione, secondo piano |
| Custodia dei collegamenti | Togliere da qui; vive già nella voce *Collegamenti* |

---

## Decisioni che spettano ai soci

| ID | Decisione | Contesto |
|---|---|---|
| D-01 | "Accessi del cliente" nella scheda cliente: solo l'elenco (quali account, chi li ha, dove sono custoditi) o anche le credenziali? | Raccomandazione: **solo l'elenco**. Le password dei clienti in un gestionale web sono un rischio grave e una responsabilità verso il cliente |
| D-02 | "Un workspace per ogni servizio": promemoria per la crescita dell'agenzia o piano per costruire gli agenti? | Cambia dove va e cosa mostra |
| D-03 | Task e consegne: restare su Trello con un collegamento in lettura, o gestirli in BigAnt OS? | Raccomandazione: restare su Trello e collegarlo dopo; non duplicare uno strumento che funziona |
| D-04 | Documenti e autorizzazioni: servono in BigAnt OS? | Proposta minima: solo contratti e liberatorie nella scheda cliente |
| D-05 | Le parti tolte vanno nascoste o eliminate dal codice? | Raccomandazione: nasconderle ora ed eliminarle dopo il collaudo della nuova struttura |

## Domande aperte

1. Gli "account demo" nel login li hai visti sul server reale (`bigant-os-server-production.up.railway.app`) o sul sito di prova? (UI-002)
