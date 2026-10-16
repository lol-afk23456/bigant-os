# Amministrazione — API locale DEMO

Modulo: `src/administration.js`. Nessuna lettura di credenziali, rete, Gmail, SDI, banca o fogli Google. Tabelle `os_fin_*` nello **stesso** SQLite dello store OS. Collegamenti alle anagrafiche comuni tramite `client_id`; consumatori Fidelity e contatti Growth non sono controparti contabili automaticamente.

## Integrazione con il nucleo

```js
const administration = createAdministrationModule({store, clock: () => new Date()});
administration.seed(); // solo fixture locali, idempotenti; dopo seedCore
administration.state(clientId, authenticatedUser);
administration.analyze(authenticatedUser, {asOf: '2026-10-08'});
await administration.handle({method, path, body, user: authenticatedUser, clientId});
```

`clock` è facoltativo e permette test ripetibili. `path` è relativo al prefisso assegnato dal router, per esempio `/api/administration`. Risposta `{data,status?}`; `null` quando la rotta non esiste. Errori `AppError` con `.status` 400/403/404/409 e messaggio italiano. Il router deve autenticare sessione e proteggere le mutazioni da CSRF. L'identità non si legge mai dal body.

**Tutte le letture, analisi e mutazioni sono owner-only anche dentro il modulo**, compreso l'accesso diretto a `state` e `analyze`. Un owner disabilitato è respinto. `seed` è una funzione di avvio per fixture, non una rotta pubblica. Il selettore `clientId` non restringe la vista economica globale dei soci: ogni record conserva cliente e ditta. Il modulo non restituisce dati amministrativi a collaboratori o clienti. Il nucleo deve escludere la proprietà amministrazione dalle loro risposte generali, non soltanto nasconderla in UI.

## Stato per la dashboard

`GET /state` restituisce:

| Campo | Contenuto |
|---|---|
| `demo`, `asOf`, `currency` | `true`, data YYYY-MM-DD, `EUR` |
| `summary` | `balance_cents`, `income_month_cents`, `expenses_month_cents`, `withdrawals_month_cents`, `arrears_cents`, `draft_invoice_cents`, `open_anomalies`, `unreconciled` |
| `entities` | Due ditte DEMO con saldi, incassi/spese/prelievi mensili e incassi annui. `tax.status=awaiting_accountant`; soglia e accantonamenti `null` |
| `accounts` | Conti con saldo iniziale, data e `balance_cents` alla data di riferimento |
| `counterparties` | Clienti, fornitori, collaboratori e titolari fittizi |
| `contracts` | Servizio, importo, inizio, fine, giorni preavviso, documento |
| `invoices` | Bozze DEMO, `paid_cents`, `remaining_cents`; nessuna fattura fiscale emessa |
| `movements` | Prima nota immutabile, importi positivi e `direction=in/out`, `kind=income/expense/withdrawal/transfer` |
| `obligations` | Compensi, accordi prelievi, hosting, domini e altre scadenze, con pagato/residuo e minuti lavoro |
| `subscriptions` | Canone concordato, prossima scadenza e periodicità 1/12 mesi |
| `arrears` | Bozze oltre scadenza con residuo positivo |
| `projections` | Scenari a 30/60/90 giorni: saldo, incassi/uscite attesi, saldo previsto e arretrati esclusi |
| `margins` | Contributo di cassa, margine stimato e consuntivo gestionale da ore e tariffe confermate, dettaglio per ditta. Mancano dati → `null` e motivazione. `full_margin_cents=null`: competenza economica e costi comuni non ancora completi |
| `hourlyRates`, `workAllocations` | Tariffe confermate per ditta/cliente/persona/servizio e attribuzione univoca dei lavori |
| `reversals` | Legame tra originale e contromovimento, motivo/documento/autore e riconoscimento esplicito del nuovo periodo |
| `reconciliations` | Quadrature conto/ditta/mese: saldo calcolato/reale/differenza, stato, nota, autore |
| `anomalies` | Lista persistente; `status=open/in_review/resolved`, `detected=1/0`, priorità, importo, responsabile e nota |
| `questions` | Sei domande direzionali: cassa, crediti, rischi consegne, scadenza contratti, capacità, decisioni |
| `rules` | Manifesto regole realmente implementate e ancora mancanti |
| `external` | Sheets/banca `not_connected`, SDI `disabled` |

Gli importi sono **centesimi interi**, mai stringhe in euro o numeri decimali. Lo stato non avvia l'analisi automaticamente e non modifica dati: il pulsante controllo chiama `/analyze`, poi ricarica lo stato. Il saldo mostrato è contabile; la riconciliazione va verificata per ogni conto. L'indicatore prudenziale `unreconciled` resta vero finché non esiste una gestione completa della chiusura di tutti i conti.

`state(clientId,user,{asOf})` supporta una data passata per calcolare pagamenti/saldi alla data, non una ricostruzione storica completa delle anagrafiche o del momento in cui ogni contratto era conosciuto. `asOf` futuro è respinto. I sei quesiti indicano esplicitamente che la capacità in ore non è ancora configurata.

## Mutazioni comuni

Tutte le POST di registrazione e PATCH anomalie richiedono `idempotencyKey` non vuota. Riutilizzare la stessa chiave, stesso socio, stessa rotta e body restituisce lo stesso risultato con `replayed:true`. Riutilizzarla per dati diversi dà 409. La registrazione, l'audit e la chiave sono nella stessa transazione.

Il riferimento `sourceRef` di un movimento è unico per ditta **anche tra conti diversi**. Evita di importare due volte lo stesso pagamento. Un versamento fra conti usa la rotta atomica trasferimenti; due conti della stessa ditta vengono aggiornati insieme. Trasferimenti tra ditte sono bloccati in attesa di una causale contabile validata.

### Registrare un movimento

`POST /movements`

```json
{
  "idempotencyKey": "demo-ricevuta-001",
  "entityId": "demo-entity-a",
  "accountId": "demo-bank-a",
  "counterpartyId": "demo-party-client",
  "invoiceId": "demo-fin-invoice",
  "date": "2026-10-08",
  "amountCents": 10000,
  "direction": "in",
  "kind": "income",
  "category": "Canone social",
  "method": "bank",
  "documentRef": "Bozza DEMO-001",
  "sourceRef": "demo-banca-operazione-002",
  "note": "Incasso parziale DEMO"
}
```

Obbligatori: ditta, conto, data valida non futura, importo >0, verso, categoria, riferimento univoco, chiave. `method` può essere `bank/cash/card`, default bank. `kind` default income per entrata, expense per uscita. `clientId`, controparte, documento e nota sono facoltativi; le incoerenze dei collegamenti sono respinte.

Collegare al massimo uno tra `invoiceId`, `obligationId`, `subscriptionId`. L'incasso di fattura richiede la sua controparte, ditta e cliente; non può superare il residuo. L'uscita su obbligo richiede controparte coerente. Un prelievo usa `kind=withdrawal` e controparte `owner`; è separato dai costi operativi. Il superamento dell'accordo di prelievo viene registrato e segnalato, perché un fatto avvenuto non deve sparire dalla prima nota.

I movimenti non hanno API di aggiornamento o cancellazione; trigger SQLite impediscono anche UPDATE/DELETE diretti. Le correzioni avvengono con **storno collegato e nuova registrazione**, senza modificare l'originale. Nessun agente può modificare un importo esistente. I movimenti di storno mantengono il tipo economico dell'originale ma hanno verso opposto: i totali applicano il segno correttamente, non sommano valori assoluti.

### Altre registrazioni

| Rotta | Campi body oltre `idempotencyKey` |
|---|---|
| `POST /counterparties` | `kind`: client/supplier/collaborator/owner; `name`; facoltativi `clientId`, `documentRef` |
| `POST /accounts` | `entityId`, `name`, `openingCents` anche negativo o zero, `openingDate` non futura |
| `POST /contracts` | `entityId`, `counterpartyId` cliente, `service`, `amountCents`, `startDate`, `endDate`; opzionali `clientId`, `noticeDays` default30, `documentRef` |
| `POST /invoices` | `entityId`, `counterpartyId` cliente, `number` univoco per ditta, `amountCents`, `issueDate`, `dueDate`; opzionali `clientId`, `contractId`. Stato sempre draft |
| `POST /obligations` | `entityId`, `kind`: collaborator/owner_agreement/hosting/domain/other; `title`, `amountCents`, `dueDate`; opzionali `counterpartyId`, `clientId`, `documentRef`, `minutes`. Per collaboratore/titolare serve controparte della categoria corretta |
| `POST /subscriptions` | `entityId`, `counterpartyId` fornitore, `name`, `amountCents`, `nextDue`; `intervalMonths` 1 oppure12, default1 |
| `POST /transfers` | `fromAccountId`, `toAccountId`, `date`, `amountCents`, `sourceRef`; opzionali `method`, `documentRef`, `note` |

Date: `YYYY-MM-DD`; importi massimi per registrazione 1.000.000.000.000 centesimi. Nomi e testi hanno limiti di lunghezza. Gli esempi devono mantenere dati inventati e dicitura DEMO. Le ditte iniziali sono `demo-entity-a` e `demo-entity-b`, i conti `demo-bank-a`, `demo-cash-a`, `demo-bank-b`. Le controparti seed sono `demo-party-client`, `demo-party-supplier`, `demo-party-team`, `demo-party-owner`.

### Quadratura

`POST /reconciliations`

```json
{
  "idempotencyKey": "demo-chiusura-settembre-a",
  "entityId": "demo-entity-a",
  "accountId": "demo-bank-a",
  "month": "2026-09",
  "actualCents": 120000,
  "note": "Saldo DEMO verificato con conteggio di prova",
  "close": true
}
```

Il mese deve essere terminato. Il sistema calcola saldo e differenza; la nota è obbligatoria. Con differenza non zero è consentita solo una rilevazione `in_review`; `close:true` dà 409. Una quadratura chiusa blocca tutti i nuovi movimenti retrodatati in quel conto fino a fine mese. Non blocca conti dell'altra ditta. Il saldo reale viene conservato come osservazione, **mai applicato automaticamente ai movimenti**. Una nuova rilevazione non cancella la precedente; il controllo anomalie usa l'ultima per conto/mese.

### Storno e rettifica controllata

`POST /reversals` registra un contromovimento speculare. Il movimento originale resta immutato. Per un trasferimento tra due conti vengono stornati **entrambi** i lati nella stessa transazione.

```json
{
  "idempotencyKey": "demo-storno-001",
  "movementId": "identificativo-del-movimento",
  "entityId": "demo-entity-a",
  "date": "2026-10-08",
  "sourceRef": "demo-rettifica-001",
  "documentRef": "Nota di rettifica DEMO",
  "reason": "Registrazione duplicata verificata dal socio",
  "allowClosedPeriodAdjustment": false
}
```

Documento e motivo obbligatori. Data non futura né precedente all'originale. Stessa ditta; non si cambia l'attribuzione fiscale. Un originale può essere stornato una sola volta. Replay della stessa chiave restituisce il risultato precedente, una nuova richiesta di doppio storno dà 409. Storno dello storno bloccato: serve una nuova operazione motivata.

Se il mese dell'originale è chiuso, lo storno richiede una **data nel nuovo periodo aperto** e `allowClosedPeriodAdjustment:true`. Non riapre o riscrive la quadratura. Una data in periodo chiuso resta vietata anche con il flag. L'acknowledgment viene conservato nel registro.

`POST /corrections` usa gli stessi campi più `replacement`, per esempio `{"amountCents":20000}`. Nella stessa transazione registra lo storno e il movimento corretto. Il nuovo movimento eredita conto, controparte, cliente, collegamento documento, verso e categoria, salvo modifiche esplicite coerenti; importo obbligatorio. Data, ditta, documento e motivo sono quelli della richiesta principale. Se il nuovo movimento è invalido, **anche lo storno viene annullato dalla transazione**. Nessuna rettifica a metà. Per un trasferimento si usa storno completo, poi nuova registrazione trasferimento.

Incassi, uscite, prelievi e residui sono calcolati al netto dei contromovimenti. Le anomalie sulle operazioni annullate non restano rilevate, ma le decisioni storiche e i record originali si conservano. Questo è un registro gestionale di cassa, non un sistema di contabilità legale in partita doppia.

### Costi orari e margini

Nessuna tariffa è inserita nel seed. Prima il socio registra `POST /hourly-rates`:

```json
{
  "idempotencyKey": "demo-tariffa-001",
  "entityId": "demo-entity-a",
  "clientId": "demo-bottega",
  "userId": "demo-collaborator",
  "counterpartyId": "demo-party-team",
  "service": "social",
  "hourlyCents": 2000,
  "costTreatment": "expense_backed",
  "effectiveFrom": "2026-10-01",
  "confirmed": true,
  "note": "Tariffa fittizia DEMO confermata per il collaudo"
}
```

`costTreatment` distingue `internal_time` (costo interno delle ore, aggiuntivo alle spese registrate) e `expense_backed` (compenso già rappresentato dai movimenti di prima nota). Persona operativa attiva e controparte collaboratore/titolare obbligatorie. Le tariffe sono nuove registrazioni, non aggiornamenti silenziosi di quelle già applicate.

Poi `POST /work-allocations` con `idempotencyKey`, `entityId`, `taskId`, `rateId`, `workDate`, `note`. Il lavoro comune OS deve coincidere con cliente, assegnatario e servizio della tariffa, valida alla data del lavoro. Ogni task viene attribuito una volta soltanto: niente doppio conteggio tra le ditte. Si leggono ore previste ed effettive già registrate nel task, senza inventarle. Per lavorazioni distribuite su più mesi usare task separati: la prima versione attribuisce ogni task a una sola data/mese.

Calcolo per mese, cliente e ditta:

- **Contributo di cassa**: incassi meno spese registrate, indipendente dalle ore.
- **Margine stimato**: importi delle bozze del mese meno costi non di lavoro registrati e costo delle ore previste. I compensi attribuiti alle tariffe `expense_backed` sono sostituiti, in questa sola stima, dal costo delle ore previste.
- **Consuntivo gestionale (`realized_margin_cents`)**: incassi meno spese registrate e costo delle ore interne effettive. I compensi `expense_backed` sono già nelle spese, quindi non vengono sottratti nuovamente.

Arrotondamento di ogni costo task al centesimo con aritmetica intera. Un task concluso senza minuti effettivi, un'assegnazione poi cambiata, lavori del mese non attribuiti o sovrapposizione tra ore interne e compensi registrati rendono il margine **non disponibile**, con motivi. Restano visibili componenti e contributo di cassa. Le tariffe sono dati riservati ai soci.

`full_margin_cents` resta `null`: mancano ancora riparto dei costi comuni e completa contabilità per competenza. Il consuntivo gestionale non viene chiamato utile fiscale. Le cifre si riferiscono soltanto a dati effettivamente registrati, non garantiscono che tutte le spese reali siano state caricate.

### Controllo anomalie

`POST /analyze` con `{}` oppure `{ "asOf": "2026-10-08" }` esegue controlli deterministici e restituisce `{asOf,detected,costCents:0,simulated:false,demo:true,rules,anomalies}`. È calcolo reale su dati di esempio, non chiamata a un modello AI.

Implementati: scaduti e pagamenti parziali, documenti/categorie mancanti, ditta incoerente, possibili duplicati per documento/data/importo, abbonamenti duplicati/in aumento/rinnovo senza movimento, compensi scaduti, prelievi oltre accordo o conto negativo, differenza di quadratura, scadenza contratti.

Non implementati o scollegati: confronto Tracker reale, analisi statistica spese, rilevazione di pagamenti assenti senza estratto conto esterno, soglie fiscali e accantonamenti non confermati. Il manifesto restituito distingue questi stati. L'analisi non modifica conti, documenti o importi e non risolve automaticamente le anomalie.

`PATCH /anomalies/:id`:

```json
{
  "idempotencyKey": "demo-anomalia-decisione-1",
  "status": "resolved",
  "assignee": "demo-owner",
  "resolutionNote": "Verifica DEMO completata; motivazione della decisione"
}
```

Responsabile: socio attivo, default autore. Stati `open/in_review/resolved`. La nota è obbligatoria per resolved. `detected=1` indica che la condizione contabile è ancora presente: la decisione del socio non cancella il problema sottostante. Se la condizione scompare, `detected=0` ma lo stato non viene automaticamente cambiato.

## Limiti economici e di sicurezza

- Nessuna aliquota fiscale o soglia numerica è inserita. Le richieste di scadenza `tax_reserve` sono bloccate finché manca il flusso di conferma del commercialista.
- Il margine completo non è inventato: le ore usano soltanto tariffe confermate; competenza economica e riparto costi comuni restano da completare.
- Il cash flow considera scadenze esplicite e ricorrenze, sottrae pagamenti anticipati nell'intervallo della ricorrenza; non prevede probabilità di incasso. Arretrati sono separati, non automaticamente promessi nel futuro. Non duplicare un abbonamento anche nello scadenziario generico.
- Il rilevatore di duplicati dà una **segnalazione**, non una cancellazione: due pagamenti uguali possono essere legittimi.
- Il tipo di fattura è sempre bozza gestionale DEMO. Nessun SDI, invio o collegamento; `/send`, `/pay`, `/sdi`, `/connect` restituiscono 409.
- Nessuna modifica dei fogli esistenti. Prima Nota/Tracker restano fonti reali fino a una migrazione concordata e verificata.

## Verifiche

```sh
node --test tests/administration.test.js
```

I 19 test usano SQLite in memoria e clock fissato: seed idempotente, centesimi/date, ruoli, chiavi di idempotenza, riferimenti duplicati anche su conti diversi, ditta/conto/fattura/cliente, residui e doppio saldo, trasferimenti atomici, quadratura di due ditte, blocco periodi chiusi, immutabilità del database, analisi senza correzioni, risoluzione motivata, compensi/prelievi, registri e blocco dei servizi esterni. Comprendono storno idempotente, immutabilità dell'originale, rettifica atomica e rollback, storno del trasferimento in coppia, rettifica esplicita nel nuovo periodo, tariffe confermate e arrotondamento al centesimo, isolamento delle ditte e assenza di doppio conteggio dei compensi.
