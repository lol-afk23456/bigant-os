# API Fidelity integrata in BigAnt OS

Versione notturna del 8 ottobre 2026. Il modulo riusa il dominio del repository Fidelity `350d64f`, adattandolo a **una sola connessione SQLite, agli utenti, ai clienti e alle approvazioni comuni di OS**. Nessun server secondario, iframe o login Fidelity separato. Tutte le funzionalità operano su dati DEMO; i provider esterni sono disabilitati per costruzione.

## Contratto del modulo

```js
const fidelity = createFidelityModule({ store, origin });
fidelity.seed(); // Idempotente. Richiede prima seedCore(store).
fidelity.state(clientId, sessionUser);
await fidelity.handle({ method, path, body, user: sessionUser, clientId });
fidelity.tick(clientId, sessionUser);
```

`path` è relativo a `/api/fidelity` e comprende eventuale query string. Risposta `{data,status?,contentType?}`; `null` indica route inesistente. Errori con `error.status` e messaggio italiano. Default JSON; export CSV e logo restituiscono stringa/Buffer con tipo specifico.

Il router comune deve applicare limiti dimensione richiesta, rate limit, Origin/CSRF alle scritture, cache privata e sessioni. Il modulo ricontrolla autenticazione corrente, ruolo e assegnazione cliente; non si fida del body. Le route `/public/*` e `GET /branding/:id.png` sono pubbliche e vanno inoltrate prima del blocco della sessione privata. Le scritture pubbliche richiedono comunque Origin e rate limit nel router. Niente token carta in log, report generali o memoria agenti.

## Permessi

| Utente OS | Accesso Fidelity |
|---|---|
| `owner`, socio BigAnt | Tutte le attività, gestione e operazioni |
| `client`, titolare attività | Solo il proprio cliente; programmi, iscritti, campagne e operazioni |
| `collaborator` assegnato | Solo clienti assegnati; lettura iscritti, scanner, accredito/riscatto; nessuna gestione, export, campagna, cancellazione o storno |
| Visitatore con token carta | Solo carta pubblica ridotta e proprio consenso |

Il ruolo originale Fidelity `owner` è mappato a **client OS**, mai a socio. Il modulo non espone prima nota o altre tabelle amministrative. Gestione password e utenti appartengono al nucleo OS, non a un sistema di identità duplicato.

## Stato per la dashboard

`GET /state` (alias `/dashboard`, `/`) restituisce:

```js
{
  demo: true,
  source: 'Database locale DEMO · nessuna fonte collegata',
  metrics: { members, activeMembers, credits, redemptions, programs, marketingMembers },
  trend: [{ date, credits, redemptions, registrations }], // 14 giorni
  programs: [...], members: [...], transactions: [...],
  campaigns: [...], automations: [...], jobs: [...],
  wallet: { apple: { configured: false, status: 'disconnected', missing: [...] },
            google: { configured: false, status: 'disconnected', missing: [...] } }
}
```

Per collaboratori campagne/automazioni/job sono liste vuote. I contatori derivano dal database demo, non da metriche commerciali inventate. `credits` e `redemptions` escludono operazioni stornate; il trend racconta le registrazioni giornaliere delle operazioni originali, come Fidelity.

## Aziende e programmi

| Metodo e path | Body / risultato |
|---|---|
| `GET /tenants` o `/businesses` | `{items:[aziendaComune]}`; soci tutte, altri propria attività |
| `POST /tenants` | Socio; `{name,slug,industry?,color?,address?}` crea cliente comune con servizio fidelity |
| `PATCH /tenants/:id` | Socio; `{name?,slug?,industry?,color?,address?,active?}`. Cambio nome/stato aggiorna versioni carte e crea job bloccati |
| `GET /programs` | `{items:Program[]}` |
| `GET /programs/:id` | Programma scoped |
| `POST /programs` | Gestore; `{name,type,description?,rewardThreshold,rewardName,color?,pointsPerEuro?,expiresAt?,locations?,active?}` |
| `PATCH /programs/:id` | Stessi campi opzionali. Tipo immutabile; soglia immutabile dalla prima iscrizione |
| `POST /programs/:id/logo` | `{dataUrl}` raster PNG/JPEG/WebP. Ritorna `{logoUrl}` |
| `GET /branding/:programId.png` | PNG pubblico sanificato, se cliente attivo |
| `GET /wallet/icon.png` | Icona geometrica PNG di ripiego nei colori BigAnt OS, generata localmente |

`type`: `stamps`, `points`, `coupon`. Coupon forza soglia 1. `pointsPerEuro` positivo (massimo 1000), spesa in centesimi interi. Posizioni massimo 10, con `{latitude,longitude,relevantText?}` valide. Colore predefinito `#F26B21`.

`Program`: `id,tenantId,clientId,name,type,description,rewardThreshold,rewardName,color,pointsPerEuro,active,expiresAt,locations,createdAt,memberCount,joinUrl,logoUrl`.

Il logo usa **sharp 0.34.5**, lo stesso decoder del progetto originale: decodifica reale, massimo 512 KiB/2 milioni di pixel, soli formati statici dichiarati correttamente, niente SVG/URL remoti, rimozione metadati e PNG 320×100 con trasparenza. Non sono previste chiamate di rete.

## Iscritti, scanner, ledger e consensi

| Metodo e path | Body / risultato |
|---|---|
| `GET /members?q=&programId=&segment=` | `{items:Member[]}`, massimo 1000. Segmenti `all/active/inactive/reward/marketing` |
| `POST /members` | Gestore; `{programId,name,email,phone?,marketingConsent?}` |
| `GET /members/:id` | `{member,transactions}` |
| `PATCH /members/:id` | Gestore; `{name?,email?,phone?,marketingConsent?}`. Omissione preserva i valori |
| `DELETE /members/:id` | Gestore; anonimizza demo, revoca token, pulisce dati personali, conserva ledger pseudonimo |
| `GET /members/export` | Gestore; CSV con neutralizzazione formule |
| `POST /scan` | `{code}`: token, ID o URL carta dell'origine OS |
| `POST /members/:id/transactions` | `{type:'credit'|'redeem',amount?,spendCents?,note?,idempotencyKey}` |
| `POST /transactions/:id/reverse` | Gestore; `{note,idempotencyKey}` |
| `GET /transactions` | Ultime 200 operazioni del cliente |

`Member`: `id,tenantId,clientId,programId,programName,programType,name,email,phone,marketingConsent,balance,totalEarned,rewardCount,availableRewards,status,createdAt,updatedAt,lastVisitAt,cardUrl,publicToken`.

Il token carta è una credenziale bearer; viene restituito solo agli operatori autorizzati e al flusso che crea la propria carta. **Mai inoltrare gli oggetti Member integrali agli agenti generali.**

Regole originali preservate:

- Timbri: accredito 1–100; punti: quantità intera oppure spesa in centesimi, mai entrambe.
- Punti calcolati sul server: `floor(spendCents * pointsPerEuro / 100)`.
- Riscatto deduce esattamente la soglia del programma; il chiamante non può imporre il costo.
- Coupon parte da 1, non ricaricabile, un solo riscatto.
- Saldo mai negativo. Una transazione SQLite comprende saldo, ledger, audit, job e idempotenza.
- Chiave idempotenza 16–128 caratteri; stesso payload restituisce la medesima risposta, payload diverso produce 409.
- Storno è un nuovo movimento, al massimo uno per originale, con motivazione di almeno 3 caratteri e controllo saldo.
- Anonimizzazione invalida subito la carta web e l'uso al banco. La revoca wallet è registrata **bloccata**, non falsamente eseguita.
- I consensi Fidelity restano distinti dal consenso commerciale Growth.

## Campagne, pianificazione e automazioni

| Metodo e path | Comportamento |
|---|---|
| `GET/POST /campaigns` | Elenco/creazione bozza; `{name,title,body,segment,programId?,scheduledAt?}` |
| `GET /campaigns/:id` | `{campaign,deliveries}` |
| `GET/POST /campaigns/:id/preview` | Destinatari idonei attuali, soltanto opt-in, nessun invio |
| `POST /campaigns/:id/prepare` | Alias `/queue`. Calcola destinatari, crea consegne/job **blocked**, approvazione comune `kind=fidelity_campaign`, stato `awaiting_approval` |
| `POST /campaigns/:id/decision` | Gestore; `{decision:'approved'|'rejected'|'changes',reason?,version?}` aggiorna approvazione comune e campagna atomicamente; motivo obbligatorio per rifiuto/modifiche |
| `PATCH /campaigns/:id` | Gestore; modifica bozza/rifiutata/da correggere, stessi campi creazione opzionali e `version?`; incrementa versione e richiede nuova preparazione/approvazione |
| `POST /campaigns/:id/send` | **409: provider scollegato**, nessun cambiamento o invio |
| `GET/POST /automations` | Creazione `{name,title,body,inactiveDays,cooldownDays,programId?}`; intervalli 7–365 giorni |
| `PATCH /automations/:id` | `{active:boolean}` |
| `POST /automations/:id/run` | Prepara campagne/approvazioni per inattivi idonei, registra cooldown e data ultimo giro |
| `POST /tick` | Giro locale esplicito: automazioni dovute una volta al giorno e campagne con data scaduta |
| `GET /jobs` | Stato della coda di uscita Fidelity, sempre bloccata nella demo |
| `POST /jobs/retry` | **409: provider scollegato**, nessun retry esterno |

Preparazione non significa consegna. La risposta espone `simulated:true`, `externalSent:0`; `sentCount` resta 0. L'approvazione comune permette di esaminare il contenuto, ma non collega provider né autorizza automaticamente un invio.

La decisione consuma soltanto un'approvazione ancora `pending` della versione corrente e viene registrata con utente/data/motivo. Il router della coda comune deve inoltrare sempre `version`, ricavata dall'approvazione visualizzata: una versione vecchia riceve 409. Una seconda decisione sulla stessa versione riceve 409. Lo stato campagna diventa `approved`, `rejected` o `changes_requested`; `approved` non è modificabile direttamente e non abilita l'uscita. Rifiuto e richiesta modifiche alimentano `os_memory`, tipo `fidelity-feedback`, solo per il relativo cliente. Una revisione incrementa la versione, torna `draft` e conserva le vecchie approvazioni come storico. Nella demo le consegne sono solo la fotografia dell'ultima preparazione; le precedenti vengono marcate superate senza essere inviate.

Il cooldown dell'automazione è registrato su **preparazione**, non spacciato per data invio. Evita di moltiplicare bozze pendenti. La futura attivazione dei provider dovrà separare preparato/approvato/inviato e preservare i limiti e i retry prudenti originali. Il modulo non installa timer: `tick()` è il punto d'ingresso dello scheduler comune.

## Carta pubblica e wallet

| Metodo e path | Comportamento |
|---|---|
| `GET /public/join/:slug` | Dati pubblici attività, documenti e programmi attivi |
| `POST /public/join/:slug` | `{programId,name,email,phone?,acceptTerms:true,marketingConsent:boolean}` → `{cardUrl,token,demo:true}`. Duplicato restituisce 409 senza rivelare il vecchio token |
| `GET /public/cards/:token` | Carta ridotta: nome, saldo, premio, programma, attività, consenso, stato wallet. Nessun telefono/email/ledger/segreto Apple |
| `PATCH /public/cards/:token/consent` | `{marketingConsent:boolean}`, storico aggiornato |
| `GET /members/:id/wallet-preview` | Gestore; payload Apple/Google **non firmati**, issuer/dominio fittizi, `issued:false`; autenticazione Apple omessa dalla risposta |
| `/public/cards/:token/apple` e `/google` | 409 prima di emissione o aggiornamenti remoti; non cambia i flag issued |
| `/wallet/apple/*` | 409: protocollo provider non attivato nella demo |

Le viste pubbliche destinate alla UI sono `/fidelity/join/:slug` e `/fidelity/card/:token`. Il frontend deve distinguere «carta web DEMO» da «carta salvata nel wallet».

`src/fidelity-wallet.js` conserva i generatori puri del codice corrente: validazione dati, ID Google stabili/isolati, loyalty/offer, barcode, scadenza, posizioni, premio, stato revocato, messaggio testuale e definizione Apple completa. Non contiene accesso a certificati, chiavi, firma JWT, rete/APNs o emissione `.pkpass`.

## Impostazioni, utenti e audit

- `GET /settings`: cliente comune, wallet disconnessi, contatori job, origine, `demo:true`.
- `PATCH /settings/policies`: `{privacyUrl,termsText}`; HTTPS senza credenziali nell'URL.
- `GET /users`: titolari e collaboratori assegnati, senza hash o sessioni.
- Mutazioni `/users`: 409 con rimando alla gestione utenti comune OS; non esiste un secondo archivio login.
- `GET /audit`: solo eventi `fidelity.*` del cliente, nessuna voce economica/amministrativa.

## Limiti dichiarati e accettazione

Questa è una demo locale, **non un rilascio pronto per contatti reali**. Le integrazioni wallet originali non sono attive: firma, certificati, emissione, registrazioni dispositivi, push, limiti provider, retry e revoche remote richiedono una fase autorizzata e collaudi live. Non è stato copiato alcun dato di produzione.

In produzione futura vanno riattivati i controlli documento privacy/regolamento obbligatori prima delle iscrizioni, insieme al gate globale che impedisce l'avvio dei fixture in produzione. Il presente modulo è sempre esplicitamente DEMO.

Test dominio:

```sh
node --test tests/fidelity.test.js
```

Copertura significativa: dati condivisi/idempotenza seed, autorizzazioni/tenant, saldi/idempotenza/riscatto/coupon/storno, PATCH, iscrizione pubblica/consensi/anonimizzazione, scanner, campagne/approvazioni, pianificazione/inattività/cooldown, disconnessione wallet, payload, upload raster, sospensione cliente, CSV e audit. Gli esiti effettivi sono riportati nel report notturno dopo l'esecuzione.

## QR condivisi nel server OS

Il nucleo genera PNG con qrcode 1.5.4: `GET /api/fidelity/public/cards/:token/qr` verifica prima la carta attiva; `GET /api/fidelity/programs/:id/qr?clientId=...` richiede accesso al cliente e programma attivo di quel cliente. Nessun generatore QR esterno riceve il token. Il QR rimanda alla stessa origine locale.
