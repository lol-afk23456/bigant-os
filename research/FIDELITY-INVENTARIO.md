# Fidelity — inventario verificato e piano di integrazione

Data: 8 ottobre 2026. Analisi in sola lettura, senza accessi a database, `.env`, certificati, cartelle clienti o servizi esterni. Questo documento descrive il software originale; **non dichiara completata la migrazione in BigAnt OS**. Gli esiti dei test di OS vanno registrati separatamente.

## Fonte e versione

- Repository GitHub: [lol-afk23456/Fidelity](https://github.com/lol-afk23456/Fidelity).
- Sorgente GitHub acquisita dal coordinatore in un clone bare locale, letta con `git show`, senza checkout o modifiche all'originale.
- HEAD GitHub verificata: `350d64f16826530d1c64e6d3cbe998e3adbdd587`, commit del 6 ottobre 2026, «docs: prepara il deploy e il pilot cliente in giornata».
- Copia locale originale: checkout `main`, HEAD `9c86baf4ed2b0d2ab3c67e3d4415da40bc3bebda`, con modifiche non committate di branding e relativi asset. È stata soltanto letta.
- Confronto puntuale: dominio, schema e punto di avvio differiscono tra locale e GitHub soltanto nei colori predefiniti e nel nome mostrato nel messaggio di avvio. `auth`, `app`, `routes`, `jobs`, `automations`, route pubbliche, branding, provider Apple/Google e quattro file test risultano identici. `package.json` e lockfile identici.
- Il GitHub attuale usa il precedente colore viola `#7357ff`; il locale è stato brandizzato con `#E16332`. OS deve applicare **`#F26B21`**, come stabilito dal nuovo brief, senza cambiare Fidelity online.

## Dimensioni e architettura attuale

Monolite TypeScript ESM: **Node.js 24, Express 5, React 19, Vite, SQLite nativo `node:sqlite`**. Un processo serve API e frontend compilato; un worker nello stesso processo tratta la coda. Gli otto file pagina coprono panoramica, attività, programmi, clienti, scanner, campagne, impostazioni e due viste pubbliche (iscrizione/carta). Il codice server è compatto, spesso su righe lunghe; il conteggio righe non è un indicatore affidabile di complessità.

SQLite usa chiavi esterne, WAL, `busy_timeout=5000` e transazioni `BEGIN IMMEDIATE` per saldi, movimenti e idempotenza. **19 tabelle**, tre versioni di schema. La configurazione è da singola istanza su volume persistente. Non richiede un database esterno.

Il ledger fedeltà contiene punti/timbri/premi; **non è la prima nota economica dell'agenzia**. L'azienda cliente, l'operatore dell'azienda e il consumatore iscritto al programma sono tre identità differenti.

## Funzioni, una per una

La colonna OS è una destinazione progettuale. `Sì — codice` significa che la funzione è stata individuata nel sorgente GitHub attuale, non che un provider sia stato collaudato live o che OS la implementi già.

| Funzione originale | Evidenza GitHub | Destinazione in OS e vincolo | Verifica originale |
|---|---|---|---|
| Login, logout, cambio password, sessioni 12 ore | `auth.ts`, `routes.ts` | Identità comune; invalidazione sessioni e CSRF conservati | Sì — codice e test presenti |
| Ruoli agency / owner / staff | `auth.ts`, `routes.ts` | Socio OS / gestore Fidelity cliente / operatore Fidelity; mapping esplicito | Sì — codice e test presenti |
| Elenco, creazione, modifica, sospensione attività | `/tenants` | Anagrafica azienda comune, servizio fidelity abilitato per cliente | Sì — codice |
| Aggiornamento carte per cambio nome/sospensione attività | `routes.ts`, `jobs.ts` | Evento cliente → coda Fidelity, uscita bloccata nel pilota offline | Sì — test presente |
| Dashboard iscritti, attivi, consensi, accrediti, riscatti, programmi | `/dashboard` | Widget Fidelizzazione sullo stesso cliente OS | Sì — codice |
| Trend di 14 giorni e ultime operazioni | `/dashboard` | Metriche Fidelity, fonti esplicite e nessun dato inventato | Sì — codice |
| Programmi a timbri | `/programs`, `transact` | `fidelity.programs`, ledger comune per modulo | Sì — codice e test presenti |
| Programmi a punti e conversione spesa in centesimi | `transact` | Calcolo server, arrotondamento verso il basso | Sì — test presente |
| Coupon monouso | `createMember`, `transact` | Saldo iniziale 1, niente ricarica, singolo riscatto | Sì — test presente |
| Modifica programma, scadenza, geolocalizzazioni e colore | `/programs/:id` | Scheda servizio; tipo immutabile e soglia bloccata dopo prima iscrizione | Sì — codice |
| Logo programma | `branding.ts` | Asset cliente autorizzato, normalizzato e isolato | Sì — 7 test presenti |
| URL/QR di iscrizione per attività e programma | `Public.tsx`, `/public/join/:slug` | Portale pubblico Fidelity nello stesso server OS | Sì — codice |
| Iscrizione e accettazione termini | `/public/join/:slug` | Consenso registrato; documenti richiesti prima dell'apertura reale | Sì — test presente |
| Prevenzione duplicati iscrizione senza svelare tessera esistente | `createMember` | Vincolo univoco programma/email attiva | Sì — test presente |
| Carta web pubblica con saldo, QR, premio e offerta | `/public/cards/:token` | Vista pubblica dedicata; token bearer, nessuna anagrafica completa | Sì — test presente |
| Modifica/revoca consenso dal titolare carta | `/cards/:token/consent` | Registro consensi e blocco consegne pendenti | Sì — test presente |
| Ricerca iscritti e segmenti tutti/attivi/inattivi/premio/marketing | `/members` | Elenco consumatori separato dai contatti commerciali OS | Sì — codice |
| Creazione e modifica iscritti da operatore autorizzato | `/members` | Permessi fidelity.manage per il singolo cliente | Sì — codice e test presenti |
| Export CSV clienti | `/members/export` | Export limitato al cliente, audit, neutralizzazione formule CSV | Sì — codice |
| Anonimizzazione/revoca tessera | `DELETE /members/:id` | Revoca token, pulizia dati personali e job di revoca esterna separato | Sì — test presente |
| Scanner fotocamera e ricerca manuale | `Scanner.tsx`, `/scan` | Interfaccia Fidelity OS; input token/ID/URL valido | Sì — codice; fotocamera live da collaudare |
| Accredito e riscatto | `transact` | Controllo saldo e costo premio server, transazione atomica | Sì — test presenti |
| Idempotenza accrediti/riscatti | `idempotency`, `transact` | Chiave per tenant + fingerprint; retry identico non duplica | Sì — test presente |
| Storno una sola volta, senza saldo negativo | `reverseTransaction` | Nuova scrittura ledger, motivazione obbligatoria, permesso elevato | Sì — test presente |
| Registro operazioni e dettaglio carta | `/transactions`, `/members/:id` | Timeline cliente OS con accesso ristretto | Sì — codice |
| Campagne per segmento/programma | `/campaigns` | Bozza + approvazione comune prima della coda esterna | Sì — codice e test presenti |
| Pianificazione campagne | `queueCampaign`, `jobs.ts` | Scheduler OS e stato programmato; nessun invio durante la notte | Sì — codice |
| Consegne distinte Apple/Google e stati reali | `campaign_deliveries`, `jobs.ts` | Audit uscita: pending/sent/blocked/failed; non equiparare sent a lettura | Sì — codice e test presenti |
| Recupero clienti inattivi con cooldown | `automations.ts` | Automazione Fidelity registrata nell'orchestratore OS | Sì — test presente |
| Coda, backoff, tentativi, ripresa dopo riavvio | `jobs.ts` | Scheduler e coda comuni con effetti esterni disabilitati per default | Sì — test presenti |
| Riprova job bloccati/falliti | `/jobs/retry` | Azione socio/gestore consentito; esclusione invii Google incerti | Sì — test presente |
| Apple `.pkpass`, aggiornamenti, registrazioni, revoche | `wallet/apple.ts`, `appleRoutes` | Adapter presente ma disconnesso, credenziali e prove dispositivo future | Sì — codice e test payload; live non verificato |
| Google Wallet loyalty/offer, link firmato, aggiornamenti/messaggi | `wallet/google.ts`, `payloads.ts` | Adapter presente ma disconnesso, issuer e prova live future | Sì — codice e test payload; live non verificato |
| Gestione operatori, titolari e disattivazione accessi | `/users` | Un solo sistema utenti OS con membership e permessi del modulo | Sì — codice |
| Regolamento, informativa, stato wallet e job | `/settings`, `/settings/policies` | Impostazioni servizio cliente; nessuna esposizione segreti | Sì — codice |
| Registro attività | `/audit` | Audit comune immutabile applicativamente, filtrato per cliente/modulo | Sì — codice |
| Backup e restore offline SQLite | `scripts/backup.ts`, `restore.ts` | Procedure OS sul database condiviso; mai eseguite su produzione stanotte | Sì — documentazione e codice presenti |
| Bootstrap e dati demo espliciti | `scripts/bootstrap.ts`, `seed-demo.ts` | Nuovo ambiente locale DEMO; nessun riuso account o archivio reale | Sì — codice presente |

## API da preservare o tradurre

Base originale `/api`. Nuovo namespace consigliato `/api/fidelity`, con autenticazione OS e stessi controlli dominio. Le route pubbliche vanno separate dalla sessione interna ma non dai controlli di origine, rate limit e token.

| Area | Endpoint originali |
|---|---|
| Salute | `GET /health` |
| Sessione | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/password` |
| Aziende | `GET/POST /tenants`, `PATCH /tenants/:id` |
| Panoramica | `GET /dashboard` |
| Programmi | `GET/POST /programs`, `PATCH /programs/:id`, `POST /programs/:id/logo` |
| Iscritti | `GET/POST /members`, `GET/PATCH/DELETE /members/:id`, `GET /members/export` |
| Operazioni | `POST /scan`, `POST /members/:id/transactions`, `POST /transactions/:id/reverse`, `GET /transactions` |
| Campagne | `GET/POST /campaigns`, `GET /campaigns/:id`, `POST /campaigns/:id/send` |
| Automazioni | `GET/POST /automations`, `PATCH /automations/:id`, `POST /automations/:id/run` |
| Amministrazione Fidelity | `GET /settings`, `PATCH /settings/policies`, `GET/POST /users`, `PATCH /users/:id`, `GET /audit`, `POST /jobs/retry` |
| Iscrizione pubblica | `GET/POST /public/join/:slug` |
| Carta pubblica | `GET /public/cards/:token`, `PATCH /public/cards/:token/consent`, `GET /public/cards/:token/apple`, `GET /public/cards/:token/google` |
| Asset pubblici | `GET /branding/:programId.png`, `GET /wallet/icon.png` |
| Apple web service | Sotto `/wallet/apple/v1`: `POST/DELETE /devices/:device/registrations/:passType/:serial`, `GET /devices/:device/registrations/:passType`, `GET /passes/:passType/:serial`, `POST /log` |

**Attenzione:** il `GET` originale della carta Google effettua provision/upsert reali tramite API. Non va considerato innocuo perché è GET. Anche il worker si avvia immediatamente al lancio del server originale. Un adapter OS offline deve impedire questi effetti sul server, non limitarsi a disabilitare il pulsante.

## Modello dati e confluenze

| Tabelle originali | Ruolo | Destinazione comune proposta |
|---|---|---|
| `tenants` | Aziende servite, stato, brand, documenti | `clients`/aziende comuni + configurazione Fidelity, mapping stabile ID |
| `users`, `sessions` | Accessi degli operatori | Identità e sessioni OS, membership e capability Fidelity |
| `programs` | Timbri, punti, coupon, premio, scadenze | `fidelity_programs` con riferimento a cliente OS |
| `members` | Consumatori iscritti e token carta | `fidelity_members`, distinti dai lead e dai clienti dell'agenzia |
| `transactions`, `idempotency` | Ledger punti e deduplica richieste | `fidelity_transactions`, namespace idempotenza per modulo/cliente |
| `consent_log` | Storico marketing per consumatore | Registro consensi con scopo Fidelity, nessun riuso automatico per email commerciali BigAnt |
| `campaigns`, `campaign_deliveries` | Messaggi wallet e singole consegne | Campagne Fidelity collegate a approvazioni/audit OS |
| `jobs` | Aggiornamenti/revoche/campagne | Coda comune: tipo modulo, tenant, retry, errore, effetto esterno |
| `automations`, `automation_runs` | Inattività e cooldown | Registro automazioni OS + stato per destinatario |
| `apple_registrations`, `google_notifications` | Dispositivi e rate limit | Tabelle riservate al provider Fidelity, mai memoria agenti generale |
| `branding` | Logo PNG sanificato per programma | Asset autorizzati con riferimento a programma/cliente |
| `audit` | Attore, azione, entità, data | Audit comune esteso con fonte, correlazione e approvazione |
| `schema_migrations`, `metadata` | Migrazioni, demo e sequenza aggiornamento | Migrazioni OS per modulo, metadati isolati per namespace |

Vincoli da conservare: chiavi esterne composite programma/tenant e iscritto/tenant; email attiva unica per programma; saldo non negativo; storno univoco; idempotenza per cliente; consenso ricontrollato al momento dell'invio; cancellazione che invalida immediatamente il link pubblico. Non trasferire token o sessioni reali nella nuova demo.

## Accessi e sicurezza osservati

- Password scrypt con salt casuale; sessioni registrate per hash del token; cookie HttpOnly, SameSite Lax, Secure in produzione.
- Login con controllo Origin e rate limit; scritture private anche con token CSRF; origini delle scritture pubbliche controllate.
- `agency` può scegliere il tenant, `owner` e `staff` restano vincolati al loro tenant anche se falsificano l'header.
- `staff` ricerca, scansiona, accredita e riscatta; non amministra programmi, campagne, utenti, export, cancellazioni o storni.
- La carta pubblica non espone email, telefono, segreti Apple, sessioni o registro dettagliato.
- Upload solo raster con decodifica/re-encoding, limite 512 KiB e 2 milioni di pixel; niente SVG o URL remoti.
- Errori provider sanificati; nessuna stampa del contenuto credenziali.
- Una scansione statica limitata dei file applicativi/documentali/test non ha trovato pattern comuni di chiavi API o blocchi di chiavi private. **Non è un audit completo della cronologia**. Non sono stati letti `.env`, archivi dati o certificati.

### Rischi d'integrazione prioritari

1. **Collisione semantica `owner`:** il titolare di una palestra/negozio in Fidelity è un cliente, non un socio BigAnt. Tradurre il ruolo con permessi espliciti; mai concedergli Amministrazione OS.
2. **Avvio automatico worker e GET con effetti esterni:** importare il dominio, non il vecchio entrypoint. Adapter disconnessi e coda offline per default, con blocco anche lato server.
3. **Punti ≠ euro:** non mescolare ledger fedeltà e prima nota. La spesa in centesimi serve soltanto a calcolare punti; non prova un incasso contabile.
4. **Consenso per finalità:** iscriversi a un programma del cliente non autorizza campagne commerciali dell'agenzia. Non fondere i registri destinatari per email coincidente.
5. **Migrazione ID/URL:** le carte emesse contengono identificativi e URL del servizio originale. Migrazione reale richiede mapping persistente, strategia dominio e test provider; non basta copiare tabelle. Nessuna migrazione reale stanotte.
6. **Consegna incerta:** conservare la sospensione dei retry Google dopo timeout/riavvio; un retry generico può duplicare notifiche.
7. **Isolamento memoria:** i token carta sono credenziali bearer e i token dispositivi non devono entrare in prompt, report o log per il cliente.
8. **Disponibilità wallet:** il codice di integrazione e i test payload non certificano Apple Developer, issuer Google, emissione, installazione o revoca reale. Stati sempre espliciti «non collegato / non verificato».
9. **Concorrenza SQLite:** una sola istanza e worker coordinato. Non progettare repliche che condividono il file su filesystem di rete.
10. **Consistenza Google issuance:** la route originale marca `google_issued=1` prima della risposta del provider; nel porting farlo solo dopo conferma o introdurre stato `pending/issued/failed` verificato, per non confondere tentativo e emissione.

## Dipendenze e versioni risolte

Il manifest originale usa intervalli `^`; il lockfile v3 fissa le versioni sotto. Per OS usare versioni esatte per le dipendenze effettivamente riutilizzate, senza obbligare tutto lo stack Fidelity al nucleo amministrativo.

| Gruppo | Versioni risolte nel GitHub attuale |
|---|---|
| Server | express 5.2.1; cookie-parser 1.4.7; dotenv 16.6.1; express-rate-limit 8.7.0; helmet 8.3.0; zod 4.6.5 |
| Wallet / immagini | google-auth-library 10.9.1; passkit-generator 3.6.1; sharp 0.34.5 |
| Interfaccia | react/react-dom 19.3.0; react-router-dom 7.18.4; lucide-react 0.468.0; qrcode.react 4.2.0; @zxing/browser 0.1.5; @zxing/library 0.21.3 |
| Sviluppo / test | typescript 5.9.3; tsx 4.23.15; vite 7.3.6; @vitejs/plugin-react 5.2.0; supertest 7.3.0 |

`node:sqlite`, `node:crypto`, filesystem e HTTP/2 sono nativi di Node. Dipendenze compilate/native e firma wallet vanno considerate nel build, anche se durante la notte i provider restano disconnessi.

## Test ed evidenze

Nel sorgente attuale sono presenti **40 test**: 15 API, 10 wallet, 7 branding, 8 worker. Coprono tenant isolation, permessi, CSRF/Origin, idempotenza, saldo/riscatti/storni, opt-in/revoca, anonimizzazione, firme/payload, limiti immagini, throttling, invii incerti, riavvio e automazioni. `docs/acceptance.md` dichiara 40/40 e build superata il 6 ottobre; è evidenza storica del progetto, non una riesecuzione in questa analisi.

Questa analisi non ha eseguito il server originale né i suoi test e non ha scritto nell'originale. Nel porting eseguire i test su nuovo database dimostrativo isolato; aggiungere in particolare:

- titolare Fidelity escluso da ogni dato amministrativo dell'agenzia;
- consumatore del cliente A mai leggibile dal cliente B;
- nessuna richiesta di rete anche se una variabile provider fosse accidentalmente presente;
- approvazione contenuto/campagna non equivale a invio senza gate di uscita;
- mapping cliente condiviso tra CRM, produzione e Fidelity senza duplicare anagrafiche;
- regressioni su idempotenza, punti da centesimi, coupon, storni e anonimizzazione;
- nuovo stato di emissione Google aggiornato solo dopo conferma dell'adapter;
- ripristino del database OS in ambiente isolato, senza ereditare sessioni/provider reali.

## Piano di porting raccomandato

1. Unificare identità, cliente e audit nel nucleo OS, con membership specifiche per Fidelity.
2. Migrare invarianti e servizi di dominio in un modulo importabile con `db`, contesto autorizzato e provider espliciti; nessun worker o lettura di credenziali in fase d'import.
3. Usare lo stesso database OS, con tabelle Fidelity prefissate e relazioni al cliente comune. Nessun iframe, login separato o database parallelo.
4. Esporre API del modulo sotto namespace OS e viste Fidelity dentro navigazione/dashboard comuni; carta/iscrizione mantengono viste pubbliche specifiche.
5. Conservare integrità ledger/consensi e coda. Gli adapter wallet restano disconnessi finché configurazione e prove reali non sono autorizzate in una fase successiva.
6. Portare test e compilazione nel ramo notturno. Segnare funzione per funzione le parti effettivamente verificate in OS, distinguendole dai soli contratti o stub.
7. Preparare un futuro piano di migrazione dati e carte emesse con backup, confronto saldi, mapping ID e rollback; non eseguirlo ora.

Il porting completo richiede che anche interfacce, carta pubblica, scanner e adapter abbiano una destinazione verificabile. Importare soltanto una tabella programmi o inserire un collegamento a Fidelity **non soddisfa** l'integrazione richiesta dal brief.

## Aggiornamento: dominio OS implementato durante la notte

Il piano sopra è stato tradotto nei file `src/fidelity.js`, `src/fidelity-wallet.js`, `src/fidelity-branding.js` e `src/fidelity-icon.js`, con contratto in `docs/API-FIDELITY.md`. Il coordinatore cura il router e la UI comuni. Questa sezione aggiorna le destinazioni progettuali iniziali; non attribuisce al solo dominio una verifica dell'interfaccia o dei wallet reali.

| Funzioni originali | Implementazione OS | Verifica dominio OS / limite |
|---|---|---|
| Aziende, modifica, sospensione, brand e documenti | `/api/fidelity/tenants`, `/settings/policies`, tabelle **os_clients** comuni | Test anagrafica/policy/sospensione superato |
| Programmi timbri/punti/coupon, premio, scadenza, posizione, PATCH | `/programs`, **fi_programs** nello stesso DB | Test coupon, punti, PATCH e invarianti superati |
| Iscritti, ricerca/segmenti, modifica, consensi | `/members`, **fi_members/fi_consents** | Test isolamento, PATCH, opt-in e revoca superati |
| Scanner/codice/URL | `/scan` | Ricerca manuale e validazione URL testate; fotocamera è controllo UI successivo |
| Accredito, riscatto, saldo, storno, idempotenza | `/members/:id/transactions`, `/transactions/:id/reverse` | Test atomici, doppio riscatto, conflitto/idempotenza e saldo negativo superati |
| Carta pubblica e iscrizione | `/public/join/:slug`, `/public/cards/:token` | Test termini, duplicato senza token, risposta ridotta e revoca superati; UI verificata separatamente |
| Export e anonimizzazione | `/members/export`, `DELETE /members/:id` | Test CSV e rimozione dati/token/idempotenza superati |
| Metriche e storico | `/state` / `/dashboard`, liste e trend 14 giorni | Test dati condivisi e seed idempotente superato |
| Campagne, segmenti, consegne e pianificazione | `/campaigns/*`, preparazione in **os_approvals** condiviso; **fi_deliveries/fi_jobs** bloccati | Test opt-in, doppia preparazione, revoca e campagne dovute superati; nessun invio simulato come reale |
| Decisione umana e revisione campagna | `/campaigns/:id/decision`, `PATCH /campaigns/:id`; storico versioni in **os_approvals**, feedback in **os_memory** | Test approvazione una sola volta, rifiuto/modifiche, nuova versione, rifiuto versione superata e isolamento memoria superati |
| Automazioni inattività, cooldown, esecuzione giornaliera | `/automations/*`, `/tick`, metodo `tick()` per scheduler OS | Test inattività/cooldown/tick superati; prepara bozze da approvare, non invia |
| Logo PNG/JPEG/WebP | `/programs/:id/logo`, sharp **0.34.5** | Test decodifica, formato/byte/pixel, normalizzazione e isolamento superati |
| Payload Google/Apple e stati coupon/revoca | Generatori puri originali adattati, `/members/:id/wallet-preview` | Test ID/payload, segreti omessi, coupon, validazione e `issued:false` superati |
| Icona PNG wallet di ripiego | `/wallet/icon.png`, generatore puro originale con colore OS | Test dimensioni PNG e URL namespace OS superato |
| Emissione firmata, APNs, registrazioni device, API Google | Adapter disconnessi, route restituiscono 409 | Intenzionalmente non attivi; nessuna prova live, certificati o account copiati |
| Retry e recupero invii esterni | Job conservati e visibili, retry bloccato 409 | Nessun falso sent e nessun cambiamento issued; backoff/recovery provider da riattivare e ricollaudare nella fase autorizzata |
| Accessi/password/operatori | Unica identità **os_users/os_sessions**; `/users` restituisce elenco scoped | Test mapping ruoli/assegnazioni superato. Mutazioni utenti demandate al core OS; nessun login separato |
| Audit | **os_audit**, eventi `fidelity.*` visibili soltanto al cliente autorizzato | Test esclusione eventi amministrativi superato |
| Backup/restore/bootstrap | Responsabilità unica del nucleo OS | Non eseguiti sull'app originale; verifiche core separate |

Prima esecuzione: **23 test superati su 23**, su `openStore(':memory:')` e fixture marcati DEMO. Il decoder sharp è stato risolto temporaneamente, solo in lettura, dall'installazione Fidelity esistente perché l'installazione della dipendenza nel nuovo OS era ancora in corso. Nessun codice o dato originale modificato. La prova con installazione autonoma OS va registrata separatamente a installazione completata.

**Verifica finale del modulo:** installazione sharp nel nuovo workspace completata dal coordinatore; eseguito normalmente `node --test tests/fidelity.test.js` con Node 24.19.0. **27/27 test superati, zero fallimenti**, comprendendo i nuovi casi approvazioni/versioni/memoria e icona/URL OS. Non viene più richiesto il decoder della cartella originale.

### Controllo finale delle responsabilità residue

- Il dominio locale ora implementa realmente programmi, iscritti, saldo/ledger, consensi, segmenti, export, anonimizzazione, bozze campagne, pianificazione, automazioni, approvazioni, feedback, branding, metriche, payload e icona. Nessuna di queste operazioni è una finta risposta di successo.
- I contatti/ditte sono quelli comuni OS; le operazioni locali non aprono un secondo database, non leggono credenziali e non effettuano chiamate esterne.
- Sessioni/password/creazione-disattivazione utenti, backup/ripristino, scheduler del processo e UI sono funzioni comuni del nucleo, da verificare dal coordinatore. L'endpoint `/users` Fidelity elenca soltanto gli accessi autorizzati e rimanda le mutazioni alla gestione comune: **la parità utenti non è dimostrata dal solo modulo**.
- Scanner fotocamera, rendering QR, iscrizione/carta pubblica e interfacce amministrative devono essere verificate end-to-end nella UI comune; le rispettive API/dominio sono testate, non sostituiscono tale verifica.
- Firma e protocollo Apple, service account e provisioning Google, invii, retry/backoff e revoche remote sono intenzionalmente bloccati dal perimetro notturno. I generatori puri non vengono presentati come pass emessi. Prima dell'attivazione futura riprendere i test originali sui provider e le prove dispositivo.
