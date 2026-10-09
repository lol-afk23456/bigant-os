# Piano di riordino di BigAnt OS: lato amministrazione

Per: Codex. Redatto il 9 ottobre 2026 dopo il giro completo del lato amministrazione con il proprietario.
Fonte di ogni voce: `docs/MAPPATURA-MIGLIORIE.md`. Gli ID (UI-, FUN-, DAT-, COL-, D-, PRINC-) rimandano lì: in caso di dubbio prevale quel documento.
I giri lato cliente (10/10) e lato collaboratore (11/10) aggiungeranno voci: **non anticipare** le parti segnate come "attendere il giro".

---

## 0. Obiettivo

Rendere BigAnt OS **ordinato, comprensibile e utile** per il lavoro quotidiano di BigAnt, conservando ciò che funziona. "Ordine" è la parola d'ordine del proprietario.

Il risultato atteso è:
- un menu da 12 voci in 4 gruppi;
- una home per ruolo;
- una scheda cliente dell'agenzia;
- lo Sciame unificato;
- lo stato degli agenti visibile;
- Growth e Fidelity pronti per l'attivazione.

## 1. Regole di lavoro (valgono per ogni fase)

1. **Ramo `bigant-os-notte-1`.** Niente merge su `main`, niente force push. La PR la unisce il proprietario.
2. **Nessun rilascio su Railway** (`railway up`, variabili, redeploy) senza l'ok scritto del proprietario per quel rilascio. Ricorda: il push su GitHub **non** aggiorna il server (vedi `docs/PASSAGGIO-CODEX.md`, sezione 3).
3. **Nascondere, non cancellare** (D-05, raccomandazione applicata). Le voci tolte escono dal menu e dalle viste, ma il codice e le tabelle restano finché il proprietario non autorizza l'eliminazione. Procedure, sciame e test vi si appoggiano.
4. **Regola DEMO (UI-006).** La parola "DEMO" si toglie **solo** dalle funzioni configurate e funzionanti sul server reale, nello stesso commit che le rende reali. Mai in blocco. Eccezione già decisa: **Accessi** è reale, quindi la sua dicitura DEMO va tolta ora (UI-014).
5. **Modalità DEMO intatta.** Ogni cambiamento deve continuare a funzionare con `BIGANT_MODALITA` non impostata (test e sito di prova).
6. **Permessi sul server**, non solo nel menu. Ogni voce nascosta a un ruolo deve essere rifiutata anche dalla sua rotta API.
7. **PRINC-01, una sezione alla volta.** Niente pagine lunghe a vetrina: griglia di card piccole (nome e un dato), il clic apre solo quella sezione, "Indietro" chiaro.
8. **Estetica.** BigAnt arancione `#F26B21`, nero `#141413`, essenziale ed elegante. Il riquadro "cabina di regia" (UI-008) e l'Ufficio virtuale (UI-011) piacciono: sono il riferimento grafico e non vanno peggiorati.
9. **Prima di ogni push:** `npm test` e `npm run check` verdi, più i test nuovi della fase. Commit piccoli in italiano che citano gli ID.
10. **Nessun segreto, nessun dato reale** nel repository, nei test o nei log. Nessuna email, pubblicazione o spesa.
11. A fine fase: aggiornare `docs/DIARIO-LAVORO.md`, `docs/DECISIONI.md` e lo stato delle voci in `docs/MAPPATURA-MIGLIORIE.md`. Chiedere l'ok prima della fase successiva.

**Stime:** S, M e L sono indicazioni da confermare sul codice, non impegni.

---

## 2. Le fasi

### Fase 0: messa in sicurezza (prima di tutto) · stima M

| Cosa | Voci | Criterio di accettazione |
|---|---|---|
| Copia di sicurezza giornaliera del database sul volume `/data`, con rotazione | `PASSAGGIO-CODEX` §8.1 | Test: il backup in modalità reale scrive in `/data/backups`, ruota le copie e si ripristina in un archivio nuovo |
| Cambio password **obbligatorio** al primo accesso e dopo ogni "Nuova password" impostata da un socio | FUN-003 | Test: un utente con password provvisoria non accede ad altre rotte finché non la cambia |
| Accessi: togliere "Nuovo accesso DEMO" e l'avviso «prototipo locale» in modalità reale | UI-014 | Sul server reale la pagina Accessi non contiene "DEMO" né "prototipo" |

Dopo la Fase 0 il proprietario crea gli accessi di Vincenzo e del cliente di prova (FUN-001, DAT-001: "BigAnt (cliente di prova)" come **cliente separato** dall'agenzia).

### Fase 1: login e scheletro della navigazione · stima M

| Cosa | Voci | Criterio di accettazione |
|---|---|---|
| Login definitivo: logo, email e password subito visibili, un pulsante "Accedi", errore chiaro | UI-001 | Si accede in un solo passaggio da telefono e da PC |
| Nuovo menu dell'amministrazione a 12 voci in 4 gruppi (Lavoro · Prodotti · Sistema · Fatturazione ultima) | `MAPPATURA` §13.1, FUN-049 | `navItems`/`allowedNav()` (`public/app.js` righe 59-60) producono esattamente il menu di §13.1 per il socio |
| Nascondere le voci tolte: Mappa agenzia, Marketing BigAnt, Direzione, Lavori e contenuti, Approvazioni, Registro attività; Ufficio virtuale come voce a sé | FUN-011, FUN-018, FUN-046, FUN-052, FUN-059, FUN-061 | Le voci non compaiono in nessun ruolo; i test esistenti restano verdi |
| Menu provvisorio del collaboratore: Home, Clienti assegnati, Sciame → solo Da approvare | FUN-022, FUN-047 | Il collaboratore non vede altre voci e le rotte nascoste gli rispondono con un rifiuto |
| Menu del cliente: **attendere il giro del 10/10**; intanto togliere solo *Lavori e contenuti* | FUN-046 | — |
| Componente unico "griglia di card + sezione singola + Indietro" da riusare ovunque | PRINC-01, UI-003 | Usato da almeno la scheda cliente e lo Sciame |
| Pagina **Avanzamento** (Sistema): stato di costruzione con tre etichette (Funziona · Prova · Da collegare) e le Fondamenta | FUN-004, FUN-008, UI-004 | Gli avvisi «Solo struttura / Flusso DEMO parziale» spariscono dalle pagine di lavoro e vivono solo qui |

### Fase 2: Home per ruolo · stima M

| Cosa | Voci | Criterio di accettazione |
|---|---|---|
| Home dell'amministrazione come pagina d'ingresso, stile cabina di regia: Da approvare, Contratti in scadenza a 30 giorni, Clienti, Growth, Sciame (attivi, bloccati, budget), Collegamenti in errore. **Niente soldi, niente task** | FUN-002, `MAPPATURA` §13.3, UI-008 | Dopo il login il socio entra sulla Home; ogni card porta alla sezione giusta |
| Home del collaboratore (provvisoria): clienti assegnati e bozze da approvare | FUN-047 | Il collaboratore non entra più su *Lavori e contenuti* |
| Home del cliente: **attendere il giro del 10/10** | — | — |

### Fase 3: Clienti e scheda cliente dell'agenzia · stima L

| Cosa | Voci | Criterio di accettazione |
|---|---|---|
| Elenco a card (si tiene) e Nuova attività con nome, settore e servizi; il nome per il link si genera da solo | FUN-033 | Una nuova attività si crea senza campi tecnici |
| Avviso in cima: contratti in scadenza nei prossimi 30 giorni | FUN-023 | Con un contratto di prova in scadenza compare l'avviso |
| "Apri attività" apre la **scheda dell'agenzia**, non la vista cliente. Card: Anagrafica · Contratto · Accessi · Scheda informativa · Servizi attivi (con i report) · Documenti · Avvio cliente · Risultati | FUN-034, FUN-007, FUN-017, FUN-032 | Nessun elemento della vista cliente al posto della scheda |
| Contratto: documento (PDF) con inizio, durata, scadenza, rinnovo | FUN-007, FUN-023 | Le date alimentano l'avviso |
| **Accessi del cliente con credenziali**: cifrate nel database, nascoste finché non si apre, ogni apertura registrata, ruolo verificato sul server, mai nei log, negli export o nei backup in chiaro. Visibili a soci e collaboratori, **mai ai clienti** | FUN-010, D-01 | Test: un cliente non ottiene le credenziali nemmeno chiamando l'API; nel database non sono in chiaro; ogni apertura lascia una riga nel Registro |
| Scheda informativa (ex memoria del cliente: brief, tono di voce, note) | FUN-017 | Modificabile e versionata come la memoria esistente |
| Documenti: contratto; fatture e pagamenti **solo** quando la Fatturazione di BigAnt OS diventerà ufficiale | FUN-039, D-10 | Il cliente vede solo il proprio contratto |
| Scheda **Risultati dei clienti** in Clienti (prima solo amministrazione) | FUN-035 | Risultati di tutti i clienti in un'unica vista |
| Pulsante "Guarda come il cliente" | FUN-067 | Apre la Vista cliente sul cliente scelto, in sola lettura |

### Fase 4: Sciame di agenti unificato · stima L

| Cosa | Voci | Criterio di accettazione |
|---|---|---|
| Una sola voce con schede **Ufficio** (prima) · **Agenti** · **Da approvare** · **Storico** · **Budget** · **Struttura**; cabina di regia in testa | FUN-052, FUN-019, UI-008, UI-011, FUN-005 | L'Ufficio virtuale resta identico nell'aspetto e nella diretta |
| **Stato di ogni agente:** Da configurare → Base → AI pronta → Attivo, con scheda di configurazione (compito, servizio, istruzioni, fonti, controllo qualità, costo stimato, "quando lavora"). Solo gli Attivi partono nel lavoro vero | FUN-053 | L'elenco mostra lo stato reale: oggi 32 Base, 11 con istruzioni AI, nessuno Attivo sul server |
| **Da approvare**: tutte le bozze (post, messaggi Growth, campagne Fidelity) con filtro per tipo; approva o rimanda con nota | FUN-048, FUN-061 | Una bozza dello sciame si approva da qui; la vecchia vista Approvazioni non serve più |
| **Regola di pubblicazione sul server:** niente pubblicazione senza approvazione umana sulla **stessa versione**; la pubblicazione automatica resta spenta finché il canale non è collegato e autorizzato | FUN-062 | Test: pubblicare senza approvazione, o con un'approvazione su una versione precedente, viene rifiutato |
| Chi approva cosa: post → socio o collaboratore; Growth e Fidelity → solo soci | FUN-063, D-15 (**da confermare**) | Test di permesso per ruolo |
| Storico (ex "Giri dell'attività") e registro di ogni agente nella sua scheda | UI-012, FUN-058 | Ogni agente mostra cosa ha fatto |
| Togliere "Automatismi pianificati": "quando lavora" diventa un campo dell'agente, spento finché non è Attivo e autorizzato | FUN-055 | Nessun agente parte da solo se non è Attivo |
| Budget: tetto, speso, costo per agente | FUN-056 | Valori coerenti con `os_costs` |
| "Attività dei moduli collegati" spostata in Growth e Fidelity | FUN-057 | Ogni prodotto mostra la propria coda |

### Fase 5: Servizi e Profili · stima M

| Cosa | Voci | Criterio di accettazione |
|---|---|---|
| **Servizi = Piano di attivazione**: per servizio stato (Attivo · In preparazione · Futuro), cosa manca, data obiettivo, agenti e loro stato; dettaglio a card | FUN-014, FUN-060 (**da confermare**), FUN-006, UI-013 | Un solo posto risponde a "quali servizi offriamo e a che punto siamo" |
| **Listino** (prodotto o servizio, prezzo, unità, note, data), inserimento rapido | FUN-031 | Una voce si aggiunge in meno di un minuto |
| **Profili**: agenzia e ogni cliente; senza i LinkedIn personali dei soci; recensioni dentro Google Business Profile; dati con fonte e data, aggiornati una volta al giorno più "Aggiorna ora" quando collegati | FUN-012, UI-007, FUN-013, D-06, D-07 | Senza collegamenti mostra "Da collegare" in modo chiaro, senza numeri inventati |

### Fase 6: Prodotti, prima Fidelity poi Growth (D-12) · stima L

Dettagli in `docs/PASSAGGIO-CODEX.md` §9-bis e `MAPPATURA` §8.

| Cosa | Voci | Criterio di accettazione |
|---|---|---|
| **Fidelity:** confronto con l'originale `lol-afk23456/Fidelity` (sola lettura, accesso da chiedere al proprietario), riporto delle parti mancanti, collaudo completo anche da telefono con lo scanner | FUN-051, COL-007 | La lista di prove dell'originale passa tutta su BigAnt OS |
| **Google Wallet**, poi **Apple Wallet** (serve sbloccare l'account Apple Developer) | COL-006 | Una carta di prova si aggiunge al Wallet e si aggiorna dopo un accredito |
| **Growth:** riportare da `lol-afk23456/bigant-growth` (`cfd4b0b`, `lib/providers.js`) i sei collegamenti oggi simulati; accenderli a fasi: (1) ricerca e lettura siti, (2) AI con tetto, (3) bozze approvate, (4) Gmail solo manuale, (5) Calendar. Chiavi inserite in Collegamenti e salvate cifrate | COL-005, FUN-050, D-14 (**da confermare**) | Una ricerca reale restituisce attività vere con fonte e data; nessun invio parte senza approvazione |
| Nessuna importazione di dati: le originali non sono usate (D-11). Spegnerle dopo il collaudo, con controllo dei conteggi | DAT-003, D-13 | — |

### Fase 7: Sistema e Fatturazione · stima M (Fatturazione in secondo piano)

| Cosa | Voci | Criterio di accettazione |
|---|---|---|
| **Collegamenti**: per ciascuno a cosa serve, stato, ultima verifica; inserimento delle chiavi; nuovo testo dell'avviso | FUN-064, UI-015 | Nessuna chiave in chiaro dopo il salvataggio |
| **Accessi**: schede Persone e Registro | FUN-066, FUN-059 | Il registro risponde a "chi ha visto le credenziali di X" |
| **Vista cliente** in sola lettura con scelta del cliente | FUN-067, FUN-045 | Coincide con la vista del cliente reale |
| **Fatturazione** (ultima voce, solo amministrazione, **secondo piano**): Incassi del mese e Arretrati in testa; "Da fatturare"; Prima nota con cassa a 30/60/90; Tracker incassi con le categorie della bacheca Trello; Costi e abbonamenti; Compensi collaboratori. Togliere Cosa non torna, Conti e quadrature, Storico quadrature, Ore attribuite, Ore e margini. **Registro ufficiale: Trello** (D-09); BigAnt OS non emette fatture (Aruba) | FUN-009, FUN-024…032, UI-009, COL-003, DAT-002 | Collaboratore e cliente non vedono né la voce né i dati (verifica sul server) |

### Dopo i giri del 10/10 e dell'11/10

- **Vista cliente:**
  - home a card;
  - report dentro i servizi;
  - fonte dei dati;
  - sezioni legate ai servizi visibili solo se il servizio è attivo;
  - via Chiedi all'agenzia, Il tuo profilo, Servizi consigliati, Report mensili, Approvazioni e calendario.

  Voci: UI-010, FUN-036…044, FUN-041, COL-004.
- **Vista collaboratore** definitiva.

---

## 3. Le prime 10 modifiche consigliate (per utilità e urgenza)

1. **Backup giornaliero del volume** (Fase 0): senza, ogni altro lavoro è a rischio.
2. **Cambio password obbligatorio** e **Accessi senza "DEMO"** (FUN-003, UI-014): servono per dare gli accessi a Vincenzo e al cliente di prova.
3. **Nuovo menu a 12 voci** con le voci tolte nascoste (Fase 1): è il cambiamento più visibile e più chiesto.
4. **Login definitivo** (UI-001).
5. **Componente "una sezione alla volta"** (PRINC-01): si riusa ovunque e rende il resto più veloce.
6. **Home dell'amministrazione** (FUN-002).
7. **Scheda cliente dell'agenzia** con contratto, accessi cifrati e avviso delle scadenze (FUN-034, FUN-010, FUN-023).
8. **Sciame unificato con lo stato degli agenti e Da approvare** (FUN-052, FUN-053, FUN-048).
9. **Regola di pubblicazione sul server** (FUN-062).
10. **Collaudo di Fidelity** e, a seguire, **Growth fase 1** (FUN-051, COL-005).

## 4. Decisioni ancora aperte (chiedere al proprietario prima della fase che le usa)

| ID | Domanda | Proposta applicata nel piano |
|---|---|---|
| D-05 | Nascondere o eliminare le parti tolte? | Nascondere ora |
| D-14 | Un solo fornitore AI per tutta la piattaforma? | Anthropic, già usato dallo sciame, con un solo tetto |
| D-15 | Chi approva cosa? | Post: socio o collaboratore; Growth e Fidelity: solo soci |
| FUN-060 | Servizi diventa il Piano di attivazione? | Sì |
| Listino | In Servizi o in Fatturazione? | In Servizi, perché si usa ogni giorno mentre la Fatturazione è in secondo piano |
| Collaboratore | Vede contratto e documenti dei clienti assegnati? | No, finché non si decide nel giro dell'11/10 |

## 5. Copertura dell'analisi

- **Esaminato con il proprietario il 9/10:** login, pagina d'ingresso e tutte le 16 voci del menu dell'amministrazione, comprese la vista cliente aperta dall'amministrazione e la bacheca Trello Fatturazione (solo struttura).
- **Non esaminato:**
  - Fidelity nell'interfaccia (rinviata);
  - lato cliente con un vero login (10/10);
  - lato collaboratore (11/10);
  - uso da telefono.
- **Verificato nel codice:** ogni voce segnata [C] in `MAPPATURA`. Growth confrontato con l'originale; Fidelity originale **non** letto (accesso al repository non concesso in questa sessione).
