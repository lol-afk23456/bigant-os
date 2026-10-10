# Growth e Ricerca lead dentro BigAnt OS

Il modulo riutilizza le regole CRM e il motore del repository Growth verificato al commit `cfd4b0bfc1b9f209474af1eb9ca7fe90c6eb8aa4`. È eseguito dal server OS, con la stessa connessione SQLite, la stessa sessione, gli stessi clienti, le approvazioni e il registro centrale. Nessun iframe, server Growth separato, account reale o secondo file database.

**Contratto storico della DEMO offline** (vedere sotto l’estensione reale del 10 ottobre). Ricerca e testi sono fixture deterministiche, non risposte AI reali. Le email simulate restano nel database locale; gli appuntamenti non generano inviti Google. In modalità DEMO non si leggono chiavi né si chiamano provider esterni. I destinatari/siti inseriti devono usare `.example`. Il modulo è riservato ai soci, anche sui percorsi denominati `public` nel vecchio sistema: è un collaudo protetto, non un modulo pubblico già rilasciato.

## Contratto per il server e l'interfaccia

```js
const growth = createGrowthModule({ store, origin });
growth.seed(); // Dopo seedCore; idempotente.
const state = growth.state('demo-bigant', user);
const result = await growth.handle({
  method: 'POST', path: '/jobs', body: { type: 'research', query: 'DEMO Caserta' },
  user, clientId: 'demo-bigant'
});
```

Il router antepone `/api/growth`. `user` deve provenire dalla sessione OS, mai dal corpo. `clientId` deve essere verificato dal router; il modulo verifica a sua volta il ruolo owner e i riferimenti di tutte le righe/token. Le risposte sono `{data,status?,contentType?}`; `null` significa percorso non riconosciuto. Gli errori hanno `status` HTTP e messaggio italiano. Le date sono ISO; gli importi sono centesimi interi.

`state` restituisce:

- `simulation:true`, `label`: avviso DEMO da rendere sempre visibile;
- `settings`: configurazione acquisizione, pausa, limiti, offerta, calendario;
- `connections`: tutti i provider reali `false`; `demoAvailable:true`;
- `leads`: id, company, email, website, stage, score, analysis, consent/proof, suppressed, value, owner, source, client_id;
- `messages`: bozza/testo/stato, lead_id/company, direzione, tipo, thread; `simulation:true`, `externalDelivery:false`;
- `meetings`: lead_id/company, start/end, stato; `simulation:true`, `externalInvitation:false`;
- `jobs`: attività persistenti Growth, input JSON, stato, errore, date;
- `costs`: dettagli modulo; `budget`: consumo e disponibilità del budget centrale OS, costo simulazioni zero;
- `approvals`: ultima decisione specifica dei messaggi; la coda visibile comune è `os_approvals`;
- `auditSource`: registro centrale OS.

Fasi: `new`, `qualified`, `contacted`, `interested`, `meeting`, `proposal`, `won`, `lost`.

Stati che la UI deve tradurre esplicitamente: `simulated_sent` = «Invio simulato», `simulated_booked` = «Appuntamento DEMO». Non usare «Email inviata» o «Prenotazione Google confermata». `uncertain` va mostrato come verifica necessaria e impedisce il reinvio.

## Percorsi effettivi

Tutti i percorsi sotto sono relativi a `/api/growth`.

| Metodo e percorso | Corpo / risultato | Funzione |
|---|---|---|
| GET `/state` | Stato sopra | Pannello Growth |
| POST `/leads` | `company` obbligatorio, `website,email,contact,sector,city,source,notes` | Aggiunge azienda DEMO, deduplica dominio/email |
| PATCH `/leads/:id` | `stage,value,contact,sector,city,notes,owner,analysis,email,consent,consent_proof` | Aggiorna scheda; cambio email revoca consenso |
| POST `/leads/:id/suppress` | Nessuno | Esclude contatto e annulla messaggi pendenti |
| POST `/leads/:id/convert` | Nessuno | Crea cliente in `os_clients`, ritorna `client,alreadyConverted,simulation` |
| POST `/import` | `rows`: massimo 200 record | Importazione parziale con errori per riga |
| GET `/export` | CSV testuale, contentType CSV | Esporta con quoting e protezione formule |
| POST `/jobs` | `type`, più parametri sotto | Accoda attività DEMO |
| POST `/jobs/run` | Nessuno | Esegue un'attività accodata della selezione; richiede pausa spenta |
| POST `/jobs/:id/retry` | Nessuno | Riaccoda solo attività failed; vincoli sugli invii incerti |
| PATCH `/messages/:id` | `subject,body,status,reason`; status draft/approved/cancelled | Modifica e approvazione attribuita al socio |
| POST `/simulate/messages/:id/send` | Nessuno | Simula recapito una volta, solo dopo consenso e approvazione |
| POST `/simulate/incoming` | `leadId,body,subject?` | Simula risposta nello stesso thread e sincronizza |
| POST `/booking-link` | `leadId` | Ritorna `token,url,simulation` |
| GET `/public/book/:token` | `slots,company,minutes,simulation` | Disponibilità locale di esempio |
| POST `/public/book/:token` | `start` ISO tra le disponibilità | Prenota localmente, token monouso, niente inviti esterni |
| POST `/meetings/:id/cancel` | Nessuno | Annulla appuntamento DEMO |
| POST `/unsubscribe/:token` | Nessuno | Disiscrizione tramite token |
| GET `/public/inquiry` | enabled/privacyUrl/simulation | Configurazione form DEMO |
| POST `/public/inquiry` | company/email/request/privacyAcknowledged; website/contact/marketing facoltativi | Richiesta con autorizzazione request distinta da marketing |
| POST `/settings` | Parametri validati | Pausa, limiti, offerta, budget; autoSend/autoReply sempre vietati |
| GET `/brand/email-preview` | HTML, contentType text/html | Anteprima brandizzata DEMO |
| GET `/session` | Sessione unica OS | Alias informativo, non crea una sessione Growth |
| `/login`, `/logout`, `/setup`, `/users` | 409 | Usare accessi e gestione utenti OS |
| `/secrets`, `/google/*`, `/auth/*` | 409 prima di effetti | Collegamento account e segreti disabilitato |

Tipi job:

| type | Parametri |
|---|---|
| research | query facoltativa; risponde con 5 aziende inventate al massimo |
| analyze | leadId; sito `.example`; punteggio/ipotesi/fonte DEMO |
| draft | leadId; kind initial/followup/reply; per reply incomingId obbligatorio |
| sync | Conversazioni del provider locale DEMO |
| reconcile | messageId, stato uncertain |
| reconcileMeeting | meetingId, stato pending/uncertain |

Un job di ricerca accoda le analisi delle aziende trovate. Il pulsante «Esegui attività DEMO» può chiamare `/jobs/run` ripetutamente fino a esaurimento, mostrando ogni risultato. Ogni giro è persistito e non serve aprire un terminale. La pianificazione originale è disponibile nel motore del modulo; non avvia timer propri. L'orchestratore centrale decide quando invocarla. I job specifici del dominio rimangono in `gr_jobs` sulla stessa connessione e vanno mostrati insieme alla coda centrale, senza sommare due volte lo stesso lavoro.

## Approvazioni centrali e registro

Ogni bozza genera una riga `os_approvals` con:

```text
kind = growth_message
entity_id = ID del messaggio
client_id = attività OS
version = progressivo
status = pending
```

Il pulsante centrale approva/rifiuta per questo tipo **deve chiamare `growth.handle` con PATCH `/messages/:id`**, passando status `approved` o `cancelled` e il motivo. La modifica torna a `draft` e crea una nuova versione: un'approvazione del testo vecchio non autorizza il testo modificato. Il solo aggiornamento manuale di `os_approvals` non è sufficiente a portare il messaggio allo stato corretto.

Anche dentro il motore, prima della simulazione, viene controllata l'ultima approvazione centrale, attribuita a un socio OS ancora attivo. I consensi vengono verificati di nuovo al momento del recapito. Rifiuti e disiscrizioni annullano i messaggi pendenti. I solleciti commerciali automatici possono produrre **bozze**, mai approvarle autonomamente.

Gli eventi sono scritti direttamente in `os_audit`, visibilità internal, dettaglio `{module:'growth',agent,detail,simulation:true,costCents:0}`. Il contesto del socio usa `AsyncLocalStorage`: due richieste contemporanee non scambiano autore nel registro.

I costi sono nella tabella centrale `os_costs`; `gr_costs` conserva il dettaglio specifico con il medesimo ID. Il blocco spesa legge il totale di tutti gli agenti e il budget centrale. Cambiare una quota di budget dalle impostazioni Growth aggiorna lo stesso limite centrale, non crea un secondo portafoglio. Tutti i provider DEMO registrano zero centesimi.

## Modello comune e conversione

`gr_workspaces` è la configurazione del modulo per un `os_clients.id`, non un'identità o un tenant separato. I lead commerciali rimangono potenziali clienti; quando diventano clienti reali nella simulazione, `/convert` crea un'unica anagrafica `os_clients` in transazione e valorizza `gr_leads.client_id`. `gr_conversions` conserva fonte, lead di origine, workspace e indicatore DEMO. La stessa chiamata ripetuta restituisce il cliente già creato. Un conflitto sullo slug non genera un duplicato: richiede la verifica del socio.

## Verifiche e limiti dichiarati

Eseguire dalla radice tecnica del repository:

```sh
node --test tests/growth.test.js
```

Sono presenti 24 test: connessione e audit comuni, accesso ruoli, deduplica, consenso, ricerca/analisi senza rete, pausa/errori/retry, approvazione con versioni, simulazione invio idempotente, risposta correlata e deduplica, stop al rifiuto, escalation prezzi, calendario/conflitti/token, riconciliazione esiti incerti, CSV, form, conversione cliente, budget globale, audit concorrente, bozze followup, scadenza token. I test non aprono account e non chiamano servizi esterni.

Non sono collaudati invio Gmail reale, OAuth, Brave/OpenAI, Google Calendar o pubblicazione del modulo pubblico: sono intenzionalmente disconnessi e rispondono 409 ove applicabile. Attivarli richiede un lavoro successivo autorizzato e verifiche con credenziali fuori dal codice. I payload Gmail vengono esercitati con fixture, non leggendo posta.

Lo scheduler e l'integrazione del pannello devono essere verificati anche tramite il front controller OS: i test di questo modulo provano le regole e i percorsi del modulo; non sostituiscono il collaudo HTTP/UI complessivo.


## Estensione reale — 10 ottobre 2026

La modalità reale mantiene lo stesso database e i ruoli OS. Non carica simulatori o archivi DEMO occupati. Ricerca, analisi e bozze usano `runtime` con flag, configurazione, collaudi e attivazioni esplicite; Gmail usa il percorso manuale sotto. Tutto è chiuso per impostazione predefinita. Stato e limiti correnti: [collaudo Growth](COLLAUDO-GROWTH-RIORDINO.md), procedura: [SOP Gmail](SOP-GROWTH-GMAIL.md).

Catalogo delle nuove funzioni, disponibili soltanto ai soci nella modalità reale:

| Percorso | Dati | Effetto |
|---|---|---|
| GET `/api/connections/google/oauth/state` | Metadati, mai token | Stato della casella e versione della configurazione |
| POST `/api/connections/google/oauth/start` | `version,email,acknowledged:true` | Stato monouso e URL di consenso Google; nessun invio |
| POST `/api/connections/google/oauth/finish` | `state,code` oppure `state,error` | Verifica sessione, casella e ambiti; token cifrato |
| GET `/auth/google/callback` | Pagina HTML | Completa via POST autenticato/CSRF, senza indebolire il cookie |
| POST `/api/growth/mail/check` | `version` della configurazione mail | Verifica profilo Google e sospende l’attivazione precedente |
| POST `/api/growth/mail/sync` | `confirmed:true` | Legge al massimo dieci thread verificabili di questa attività/casella, senza AI o invii |
| POST `/api/growth/mail/activate` | `version,enabled` booleano | Attivazione o sospensione Gmail per attività |
| PATCH `/api/growth/messages/:id` | `version` obbligatoria, campi della bozza e decisione | Controllo concorrenza; approvazione immutabile di testo, mittente, destinatario e consenso |
| GET `/api/growth/messages/:id/send-preview` | Payload approvato, `version,hash,canSend,reason` | Anteprima leggibile, senza invio |
| POST `/api/growth/messages/:id/send` | `version,hash,confirmed:true` | Intento persistente, controlli freschi e unico invio manuale |
| POST `/api/growth/messages/:id/reconcile` | Nessuno | Verifica la posta inviata; mai un reinvio |
| GET `/api/growth/unsubscribe/:token` | Solo `simulation` | Pubblico, non cambia consenso e non rivela il contatto |
| POST `/api/growth/unsubscribe/:token` | Conferma dalla medesima origine | Pubblico, esclude il contatto anche ad attività spenta |

`state.mail` distingue disponibilità server, casella configurata, collaudo e attivazione. `messages[].approvalVersion` alimenta l’approvazione; `sent` indica conferma Gmail, `uncertain` richiede verifica. Le prove automatiche usano lo stesso percorso con un trasporto finto e non dimostrano consegna reale. Anche la coda comune passa la versione al modulo; un’approvazione SQL generica non basta perché manca lo snapshot del messaggio.

Le chiamate protette richiedono sessione attiva, cambio password completato e CSRF per le scritture; il client selezionato viene verificato dal server. I vecchi percorsi `/secrets`, `/google/*`, `/auth/*` interni a Growth restano bloccati. Il worker non esegue invii reali. La lettura manuale delle risposte è integrata nel percorso dedicato `/mail/sync`; il vecchio job `sync` reale resta vietato, come Calendar e i moduli pubblici di acquisizione/prenotazione ancora da integrare. La disiscrizione è l’eccezione pubblica supportata.


### Conversazioni Gmail — lettura manuale

Catalogo della funzione e procedura: [SOP-GROWTH-CONVERSAZIONI](SOP-GROWTH-CONVERSAZIONI.md). `state.conversations` espone `canSync`, `reason`, `running`, `eligibleThreads`, `batchLimit`, `lastAttempt`, `lastSuccess` e `result`. Il risultato contiene conversazioni verificate, risposte nuove, messaggi esclusi/già presenti, verifiche manuali ed errori; `interrupted` segnala una richiesta interrotta. Un errore in un thread annulla quel thread; i thread precedenti già verificati restano acquisiti.

La lettura richiede socio/attività attivi, flag Gmail e OAuth valido. Rimane consentita in pausa o con invio sospeso per ricevere anche i rifiuti. Ogni thread deve contenere l’invio OS verificato con gli stessi indirizzi e identificativi. Conservati `gr_mail_receipts` (casella/mittente originali e impronta), ultima verifica per thread e risultato del lotto; audit solo con conteggi. Allegati e risorse remote non scaricati.

Le risposte hanno `source` (Gmail e data acquisizione) e `replyBlockedReason`. `received` nella vista reale è «Da leggere», mai «Ricevuto DEMO»; `needs_owner` blocca tutte le nuove bozze AI per quel contatto. Rifiuti e nuove risposte invalidano messaggi/approvazioni superati in transazione. Un invio già in dispatch rimane soggetto alla verifica dell’esito; prima del dispatch il messaggio resta annullato.

Il job reply accetta solo l’ultima email e la provenienza corrente; `incomingId` non è ammesso per initial/followup. Una nuova email durante l’AI scarta il risultato superato. Casella e destinatario originali vengono ricontrollati anche approvando e inviando la bozza. Nessuna risposta o chiamata AI automatica deriva dalla lettura. Prove: `tests/growth-conversations.test.js`, `tests/modalita-reale.test.js` e collaudo Browser locale. Il collegamento reale resta da autorizzare e verificare.
