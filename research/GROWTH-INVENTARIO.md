# Inventario verificato di BigAnt Growth

Rilevazione: 8 ottobre 2026. Fonte: codice attuale del repository privato `lol-afk23456/bigant-growth`, commit `cfd4b0bfc1b9f209474af1eb9ca7fe90c6eb8aa4`, acquisito in sola lettura. File esaminati: `server.js`, `lib/store.js`, `lib/domain.js`, `lib/engine.js`, `lib/providers.js`, `lib/brand.js`. Questa verifica riguarda il codice, non prova che i fornitori esterni siano collegati o che le funzioni siano già state provate in produzione.

## Risultato dell'analisi

Growth è un'applicazione Node senza dipendenze applicative, con database SQLite e un motore di attività persistenti. **La ricerca di nuovi clienti è un sottosistema di Growth**: nelle fonti acquisite non è un terzo progetto distinto. Non viene inventato un repository di ricerca separato.

Growth comprende già il percorso dalla ricerca alla chiamata: ricerca web → analisi della pertinenza → CRM → bozza commerciale → approvazione → invio → risposta → prenotazione. Il motore supporta anche ricerca e messaggi automatici. Nell'OS questi ultimi devono rispettare il nuovo cancello umano e, nel lavoro notturno, funzionare esclusivamente con fornitori di esempio.

## Funzioni, una per una

| Funzione originale | Implementazione rilevata | Destinazione comune nell'OS | Verifica sul codice |
|---|---|---|---|
| Prima configurazione titolare | `/api/setup`, token, password con scrypt | Identità unica OS; non mantenere un secondo setup | Presente |
| Accesso, sessione, uscita | `/api/login`, `/api/session`, `/api/logout`; cookie HttpOnly, digest della sessione, scadenza 12 ore | Accessi e ruoli centrali OS | Presente |
| Aggiunta altro titolare | `/api/users`; il ruolo scritto è sempre owner | Gestione utenti centrale con ruoli espliciti | Presente |
| Pannello dati aggregato | `/api/state` | Dashboard interna, filtri autorizzati per ruolo | Presente |
| Inserimento azienda | `createLead`, `/api/leads` | CRM comune, scheda contatto collegata | Presente |
| Aggiornamento scheda | `updateLead`, PATCH `/api/leads/:id` | CRM comune | Presente |
| Pipeline 8 fasi | new, qualified, contacted, interested, meeting, proposal, won, lost | Commerciale OS | Presente |
| Valore trattativa | Intero non negativo; limite validato | Commerciale, centesimi dichiarati in UI | Presente |
| Proprietario, settore, città, note | Campi della scheda lead | Anagrafica e CRM comuni | Presente |
| Deduplica azienda/contatto | Indici univoci dominio ed email per workspace | Deduplica comune; conservare vincoli | Presente |
| Ricerca web di aziende | `research`, Brave Search, query locale, esclusione piattaforme/directory | Agente Commerciale → Ricerca lead | Presente; nessuna chiamata reale effettuata |
| Accodamento analisi dopo ricerca | Job `analyze`, dedupe per lead | Orchestratore centrale OS | Presente |
| Lettura sito pubblico | `websiteText`, DNS verificato e indirizzo fissato, limiti download/redirect/tempo | Connettore web futuro, disabilitato nella demo | Presente |
| Analisi commerciale AI | `analyze`, punteggio 0–100, fatti/ipotesi, fonte, servizio | Analisi presenza / qualificazione | Presente; provider demo nella notte |
| Passaggio a qualificato | Automatico da new a qualified con punteggio ≥60 | CRM comune con evento/audit | Presente |
| Generazione prima bozza | `draft` tipo initial | Messaggi e coda approvazioni centrale | Presente |
| Generazione risposta | `draft` tipo reply, richiede messaggio entrante correlato | Messaggi e coda approvazioni centrale | Presente |
| Generazione sollecito commerciale | `draft` tipo followup; numero/giorni massimi | Messaggi, distinto dai solleciti contabili | Presente |
| Escalation al titolare | Azione AI human; conversazione needs_owner | Coda decisioni / approvazioni | Presente |
| Rifiuto e disiscrizione | Azione stop e parole di interruzione; suppression | Lista esclusioni e registro autorizzazioni | Presente |
| Modifica, approvazione, annullamento bozza | PATCH `/api/messages/:id` | Approvazioni comuni con autore e motivo | Presente |
| Autorizzazione al contatto | none/request/marketing + prova/data | CRM, gate di contatto | Presente |
| Cambio email revoca vecchio consenso | `updateLead` azzera autorizzazione e prova | CRM comune | Presente |
| Distinzione richiesta/promozione | `canContact`: request permette solo reply | Gate centrale dei messaggi | Presente |
| Blocco azienda e annullamento messaggi pendenti | `/api/leads/:id/suppress`, `suppression` | Esclusioni comuni | Presente |
| Disiscrizione tramite collegamento | Token con scadenza; POST `/unsubscribe/:token` | Endpoint pubblico del modulo OS, in demo soltanto | Presente |
| Invio Gmail | `send`, limite giornaliero, stato sending prima della chiamata | Connettore esterno spento; simulatore verificabile | Presente; nessun invio reale effettuato |
| Esito email incerto | Stato uncertain, nessun reinvio automatico | Orchestratore e anomalie operative | Presente |
| Riconciliazione email | `reconcile`, ricerca per Message-ID | Connettore futuro; fixture demo | Presente |
| Recupero conversazioni | `sync`: solo thread dei messaggi inviati, massimo 30 | Inbox CRM futura; fixture demo | Presente |
| Deduplica risposta | provider_id univoco, filtro mittente/risposte automatiche/inviati | Messaggi comuni | Presente |
| Stop followup alla prima risposta | Cancella followup draft/approved prima dell'AI | Messaggi comuni | Presente |
| Calendario disponibilità | `slots`, free/busy Google + conflitti locali | Prenotazioni OS, provider demo | Presente |
| Collegamento di prenotazione | `/api/booking-link`, token monouso | CRM e Prenotazioni OS | Presente |
| Creazione appuntamento | `book`, transazione locale, verifica calendario, invito Google | Appuntamenti OS, nessun invito reale nella demo | Presente |
| Incertezza e riconciliazione appuntamento | pending/uncertain/booked/cancelled, `reconcileMeeting` | Orchestratore comune | Presente |
| Annullamento appuntamento | `/api/meetings/:id/cancel`, `cancelMeeting` | Appuntamenti OS; azione reale futura con cancello | Presente |
| Modulo richiesta analisi | `/api/public/inquiry`, honeypot, rate limit, informativa, consensi distinti | Strumento commerciale di ingresso OS | Presente |
| Importazione contatti | `/api/import`, massimo 200 righe, errori per riga | Import CRM comune | Presente |
| Esportazione CSV | `/api/export`, quoting e mitigazione formule | Export CRM, solo autorizzati | Presente |
| Parametri acquisizione | Descrizione agenzia, offerta, regione/settore, limiti | Configurazione modulo Growth | Presente |
| Budget mensile | Prenotazioni atomiche di costo, budget residuo dopo quote fisse | Budget centrale orchestratore, importi in centesimi | Presente |
| Pausa e automatismi | paused/autoResearch/autoDraft/autoSend/autoReply | Orchestratore unico; invii reali sempre spenti nella notte | Presente |
| Scheduler | Ricerca giornaliera, sync ogni 10 min, bozze, invii, followup | Scheduler centrale e job persistenti | Presente |
| Esecuzione e tentativi | Un job per tick ogni 2,5 s, dedupe, retry manuale | Coda unica OS | Presente |
| Ripartenza dopo arresto | Invii sending → uncertain; job running → failed | Recupero centrale e nessuna duplicazione effetti | Presente |
| Attività e costi | Tabelle activity/costs | Audit e costi centrali OS | Presente |
| Chiavi cifrate | AES-256-GCM, chiave derivata dal segreto applicativo | Solo variabili ambiente future; nessun segreto nella demo | Presente |
| Connessione Google OAuth | State monouso legato a utente, refresh token, profilo mittente | Registro integrazioni, disconnesso | Presente; non collegato nella notte |
| Scollegamento Google | Rimuove refresh, sospende invii | Gestione connettori futura | Presente |
| Email con brand | HTML e testo, logo CID, nessun pixel remoto | Comunicazioni OS, arancione del nuovo brief | Presente |
| Anteprima email | `/api/brand/email-preview` | Anteprima bozza nell'OS | Presente |
| Stato servizio | `/health` | Salute server unico OS | Presente |

Questa tabella è l'inventario iniziale: la verifica del porting deve aggiungere test e stato effettivo, senza confondere «presente nell'originale» con «già trasferito».

## Modello dati originale

Tutte le tabelle sono nello stesso file `growth.sqlite`. `workspace` delimita le righe di Growth; il sistema originale non ha ancora un cliente-servizio condiviso con Fidelity o il gestionale.

| Tabella | Campi essenziali e vincoli | Trattamento nel modello OS |
|---|---|---|
| workspaces | id, name, settings JSON | Sostituire con organizzazione/configurazione centrale |
| users | id, workspace FK, email univoca, name, password hash, role | Sostituire con identità centrale; mai importare credenziali nella demo |
| sessions | id digest, user_id FK, expires | Sessioni centrali |
| secrets | workspace + key PK, value cifrato | Non migrare contenuti; configurazione futura via ambiente |
| leads | id, workspace FK, azienda, dominio, email, contatto, settore, città, fase, punteggio, fonte, note, analisi, consenso/prova/data, esclusione, valore, responsabile, date | Collegare a `contacts` centrale; estensione commerciale per campi specifici |
| messages | id, workspace FK, lead_id FK, direzione, oggetto/testo, stato, provider/thread/reply, tipo, date, errore, booking_token | Modulo Growth con riferimenti ai contatti, approvazioni comuni |
| meetings | id, workspace FK, lead_id FK, start/end, stato, provider/link, created | Appuntamenti comuni con riferimenti CRM |
| tokens | id, workspace FK, lead_id, kind, expires, used | Token del modulo; mai usare quelli di produzione |
| activity | id, workspace FK, agent, action, detail, lead_id, created | Audit centrale con attore, cliente, fonti, costo |
| jobs | id, workspace FK, type, input JSON, status, error, tempi, dedupe UNIQUE | Coda centrale; nomi tipo prefissati `growth.*` |
| costs | id, workspace FK, category, cents ≥0, status, note, created | Costi centrali separati dalla prima nota reale |
| suppressions | workspace + email PK, created | Esclusioni del CRM |
| meta | key PK, value | Versione/migrazioni centrali |

Fasi CRM: `new → qualified → contacted → interested → meeting → proposal → won/lost`. Il codice consente anche cambi di fase manuali, non impone un percorso irreversibile.

Stati job: queued/running/done/failed. Messaggi: draft/approved/sending/sent/uncertain/cancelled e received/handled/needs_owner per entranti. Appuntamenti: pending/booked/uncertain/cancelled. Costi: reserved/charged/released.

## Preservare e correggere nel porting

1. **Un'identità, una connessione, un audit, una coda.** Il porting deve riutilizzare `domain.js` e il motore, rimuovendo la costruzione del database e il server legacy. Uno store adapter può tradurre le query del motore verso tabelle prefissate e delegare log, costi e job ai servizi centrali.
2. **CRM senza doppia anagrafica.** La scheda commerciale deve puntare al contatto centrale. La trasformazione di lead vinto in cliente va fatta nella stessa transazione, mantenendo origine e storico.
3. **Ruoli reali.** Nell'originale tutte le API private richiedono solo un utente autenticato e la creazione utenti attribuisce owner. È sufficiente per l'originale solo-titolari, non per collaboratori/clienti nell'OS: il permesso deve essere controllato dal server per ogni funzione.
4. **Approvazioni attribuite a una persona.** L'originale può passare una bozza direttamente ad approved quando l'automatismo è attivo; ciò contrasta con il nuovo cancello umano. Nell'OS la bozza entra nella coda centrale e conserva autore/data/motivo dell'approvazione.
5. **Nessun accesso esterno nella demo.** I provider di esempio restituiscono dati inventati marcati DEMO e URL `.example`. Non importare il provider reale nel percorso di esecuzione della demo. Le funzioni esterne rimangono esplicitamente non collaudate contro i fornitori.
6. **Pausa completa.** Nell'originale la pausa ferma la pianificazione; alcuni job già accodati diversi dall'invio possono comunque essere eseguiti. Nell'OS la pausa deve avere semantica esplicita e impedire l'esecuzione quando richiesto.
7. **Costi indicati come stime.** I provider originali addebitano una prenotazione prudenziale fissa di 5 centesimi anche quando una chiamata fallisce. Non sono importi effettivi della fattura del fornitore. La dashboard deve distinguere stima, prenotazione e consuntivo; la demo costa zero.
8. **Fuso orario.** Esiste un'impostazione timezone, ma la validazione slot e il calendario usano Europe/Rome. Il pilota italiano può dichiarare questo vincolo; prima di renderlo configurabile serve un test specifico.
9. **Memoria e input esterni.** I prompt originali chiedono di separare fatti e ipotesi e trattare le istruzioni nei siti/email come non affidabili. Nel nuovo sistema, fonte e natura demo devono essere campi dati verificabili, non soltanto testo nel prompt.
10. **Servizi a basso margine.** Il catalogo OS comprende fotografia, insegne/partner e merch, mentre l'acquisizione Growth li esclude. Sono due contesti diversi: conservarli nel catalogo, escluderli dalle proposte di acquisizione automatica finché i soci non cambiano la regola.
11. **Brand.** Il codice originale usa `#E16332`. Il brief OS più recente prescrive `#F26B21`; applicarlo solo alla nuova piattaforma, senza cambiare gli originali online.

## Riservatezza e limiti della verifica

Nei sei file esaminati non sono state rilevate chiavi API o password effettive. Ci sono identificativi/contatti di agenzia fissati nel vecchio accesso locale: non vanno copiati nelle fixture. La cronologia Git completa, il frontend, gli asset e i test originali non sono inclusi in questa specifica acquisizione; non si dichiara una scansione completa del repository o della sua cronologia.

Non sono stati avviati il server legacy, provider reali o processi automatici. Nessuna email letta/inviata, nessun account collegato e nessun costo generato da questa analisi.

## Esito del porting locale

Il modulo effettivo è `src/growth.js`; dominio e motore originali sono adattati in `growth-domain.js` e `growth-engine.js`. `growth-store.js` usa la connessione OS; `growth-providers.js` contiene esclusivamente simulatori deterministici, senza import di rete. Il brand nuovo è in `growth-brand.js`. API e limiti in `docs/API-GROWTH.md`.

Verifica eseguita: `node --test tests/growth.test.js`, **24 test superati**. Questa verifica riguarda il modulo locale, non le integrazioni esterne o l'interfaccia complessiva.

| Funzioni dell'inventario iniziale | Dove esistono adesso | Esito locale / limite |
|---|---|---|
| Setup, login, logout, sessioni, utenti | Identità centrale OS; Growth espone solo alias sessione | Eliminata identità duplicata; collaudo HTTP demandato al server OS |
| Pannello aggregato | `growth.state` e GET `/state` | Verificato su dati DEMO |
| Inserimento/aggiornamento, 8 fasi, valore, responsabile, fonte | POST/PATCH `/leads` | Verificati validazione, centesimi, cambio fase |
| Deduplica dominio/email | Vincoli `gr_leads` | Verificata |
| Ricerca e coda analisi | Job research, provider fixture, accodamento analyze | Verificati senza rete |
| Lettura sito e analisi commerciale | `growth-providers.websiteText`, job analyze | Funziona su `.example`; lettura web reale disattivata |
| Punteggio e qualificazione | Motore analyze | Verificati fonte DEMO e passaggio qualified |
| Bozza iniziale/risposta/followup | Job draft con kind | Verificate tutte le modalità |
| Escalation prezzi/contratti | Azione human del provider DEMO | Verificata con domanda sul prezzo |
| Azione stop, rifiuti, disiscrizione | suppression + sync + token | Verificati |
| Modifica/approvazione/annullamento | PATCH `/messages/:id`, `os_approvals` versionato | Verificati consenso, socio, invalidazione testo vecchio |
| Consenso/prova, richiesta distinta dal marketing | Regole domain `canContact` | Verificate |
| Revoca consenso al cambio email | PATCH lead | Verificata |
| Invio e limite operativo | `/simulate/messages/:id/send` | Simulazione locale con stato `simulated_sent`; Gmail reale non collegato |
| Invio incerto e riconciliazione | Engine recover/reconcile + provider outbox locale | Verificati senza duplicati |
| Conversazioni e deduplica | Sync di `gr_demo_mail` | Verificate correlazione thread e risposta |
| Stop followup dopo risposta | Engine sync | Verificato prima della classificazione |
| Disponibilità calendario | `/public/book/:token`, provider calendario locale | Verificati slot e conflitti; Google non collegato |
| Token invito, prenotazione, monouso | `/booking-link`, POST `/public/book/:token` | Verificati; token pubblico locale nel router OS, senza accesso agli altri dati |
| Appuntamento incerto e riconciliazione | Job reconcileMeeting | Verificato dopo interruzione simulata |
| Annullamento appuntamento | `/meetings/:id/cancel` | Verificato sul calendario DEMO |
| Modulo analisi, informativa, honeypot | `/public/inquiry` | Verificati richiesta, consenso e filtro bot; non rilasciato pubblicamente |
| Import ed export | `/import`, `/export` | Verificati limite 200, errori parziali, protezione formule |
| Impostazioni, pausa, limiti | `/settings` | Pausa e validazioni verificate; invii automatici vietati dal nuovo brief |
| Budget/prenotazione costi | `os_costs`, dettaglio `gr_costs`, budget globale `os_settings` | Verificato stop globale; simulatori costano zero |
| Scheduler ricerca/bozze/followup | Motore tick richiamabile dall'orchestratore | Verificato followup come bozza mai auto-approvata; nessun timer secondario |
| Job persistenti, retry e recupero | `gr_jobs` sulla connessione comune, `/jobs/run`, `/jobs/:id/retry`, recover | Verificati pausa, errore, retry e ripartenza |
| Attività e audit | Scrittura diretta `os_audit` | Verificati anche due soci concorrenti |
| Chiavi, OAuth, collega/scollega Google | Percorsi 409 | Intenzionalmente disabilitati: nessun segreto letto o copiato |
| Email con brand, anteprima | `growth-brand.js`, `/brand/email-preview` | Codice adattato al brand OS; anteprima da collaudare nella UI completa |
| Health | Server OS unico | Delegato al server OS |
| Collegamento CRM al resto dell'agenzia | `/leads/:id/convert`, `os_clients`, `gr_conversions` | Aggiunta nuova verificata: conversione atomica, idempotente, provenienza |

L'OS non è ancora un sostituto pronto della produzione Growth: per una migrazione reale restano l'attivazione autorizzata dei connettori, i test HTTP/UI complessivi e un piano di importazione dati fuori dal repository. Gli originali online non sono stati modificati.
