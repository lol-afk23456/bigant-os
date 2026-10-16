# Passaggio di consegne a Codex — BigAnt OS

9 ottobre 2026, sera (Europe/Rome). Da: sessione Claude Code. A: Codex. Su richiesta del proprietario (Raffaele).
Questo documento sostituisce come punto di partenza `docs/PASSAGGIO-CONSEGNE.md` (8 ottobre), che resta valido per lo storico, i progetti originali e le decisioni della chat.

---

## 1. In trenta secondi

- **Cos'è:** BigAnt OS, gestionale **interno** di BigAnt Agency (Caserta, soci Raffaele e Alfonso, collaboratore Vincenzo). Clienti, lavori, approvazioni, amministrazione delle due ditte, Growth (CRM), Fidelity, catalogo servizi S01–S19 e uno "sciame" di 32 agenti. Non è un SaaS.
- **Dove gira:** un server reale su Railway, in produzione dal 9 ottobre 2026: `https://bigant-os-server-production.up.railway.app`. Verificato dal vivo alle 22 circa: `GET /health` → `{"status":"ok","app":"BigAnt OS","demo":false,"externalActions":false}`.
- **Codice:** `github.com/lol-afk23456/bigant-os` (privato), ramo **`bigant-os-notte-1`**.
- **Test:** 188/188 verdi e `npm run check` verde su `6e80d79` (verificato con Node 24.19.0).
- **Prossimo lavoro:** il quaderno delle migliorie UI (sezione 9) e la copia di sicurezza del volume Railway (sezione 8, punto 1).

## 2. Accessi: chi entra dove

| Cosa | Dove | Come entra Codex |
|---|---|---|
| Codice | GitHub `lol-afk23456/bigant-os` | Account GitHub del proprietario già autorizzato sulla macchina (`gh auth status`). Il Mac di Raffaele ha GitHub CLI con login fatto il 9/10 |
| Server online | Railway, progetto **BigAnt OS**, servizio **bigant-os-server**, ambiente **production** | Railway CLI sul Mac di Raffaele, già con login (`railway whoami`). Collegare la cartella con `railway link` scegliendo progetto e servizio sopra |
| App (interfaccia) | `https://bigant-os-server-production.up.railway.app` | Email e password del socio. **Codex non le chiede in chat, non le stampa, non le scrive in file o log.** Le inserisce il proprietario nel browser |
| Sito di prova DEMO | `https://lol-afk23456.github.io/bigant-os-prova` (GitHub Pages, cartella `online/`) | Pubblico, dati inventati |
| Mappa e quaderno migliorie | `https://claude.ai/artifact/1d3JwagmRR4YUyAmcZXofn` | Pagina claude.ai: **Codex non la legge**. Il proprietario preme «Copia elenco» e incolla le note a Codex |

### Credenziali: dove stanno (solo nomi, mai valori)

- **Login del primo socio:** variabili Railway del servizio `bigant-os-server`. `BIGANT_SOCIO_EMAIL` è l'email, `BIGANT_SOCIO_PASSWORD_INIZIALE` la password iniziale. Si vedono da railway.com → BigAnt OS → bigant-os-server → *Variables*, oppure con `railway variables` dal Mac. Le apre **il proprietario**.
- **Attenzione:** il socio viene creato **solo al primo avvio** (`src/store.js`, `seedRealCore`, riga 70: `if(!existing) INSERT`). Cambiare la variabile della password **non** reimposta un utente esistente. Per rientrare se la password è stata cambiata e persa: impostare in `BIGANT_SOCIO_EMAIL` una **nuova** email e una nuova `BIGANT_SOCIO_PASSWORD_INIZIALE` (almeno 14 caratteri). Al riavvio nasce un secondo socio, da cui si sistemano gli altri accessi in *Accessi*. Una procedura di recupero password nel codice **non esiste** (gap, sezione 8).
- **Chiave AI:** `BIGANT_ANTHROPIC_API_KEY` **non impostata**, per scelta del proprietario. L'AI sul server è spenta.
- Il proprietario conserva le password nell'app Password di Apple (iCloud). Nessuna password va nel repository, in `docs/`, nei commit, nei log o nei messaggi.

## 3. Come è stato distribuito (importante prima di qualsiasi rilascio)

- Il deploy **non** parte da GitHub. Il collegamento GitHub→Railway via CLI ha dato "Repository not found", quindi il codice è stato caricato dal Mac con **`railway up`**. **Un push su GitHub non aggiorna il server.** Per rilasciare: dalla cartella del ramo aggiornato, `railway up` sul servizio `bigant-os-server`, e **solo con l'ok esplicito del proprietario**.
- Build: `Dockerfile` in radice (`node:24-alpine`, `npm ci --omit=dev`, copia `server.js src public scripts docs/playbook`). `ENV BIGANT_MODALITA=reale`, gira come **root** (scelta per i permessi del volume).
- `railway.json`: builder Dockerfile, healthcheck `/health` (60 s), riavvio `ON_FAILURE` per 5 volte.
- **Volume** persistente montato su `/data` (`DATA_DIR=/data`), database `bigant-os.sqlite`. Persistenza provata con un riavvio e un nuovo accesso.
- Dominio definitivo `os.bigant.it`: **non collegato** (serve un CNAME e l'autorizzazione del proprietario). `BIGANT_ORIGINE` oggi è il dominio `*.up.railway.app`.
- Due account di collaudo disattivati da eliminare: `collaudo-persistenza@bigant.it`, `collaudo-volume-2@bigant.it`.

### Variabili del servizio Railway (nomi)

| Nome | Valore / scopo | Stato |
|---|---|---|
| `BIGANT_MODALITA` | `reale` | impostata |
| `BIGANT_ORIGINE` | URL https pubblico; il server rifiuta altri Host | impostata (dominio Railway) |
| `DATA_DIR` | `/data` | impostata |
| `BIGANT_SOCIO_EMAIL`, `BIGANT_SOCIO_PASSWORD_INIZIALE` | primo socio | impostate |
| `BIGANT_MOTORE` | `demo` · `api` · `claude-code` | non impostata → demo |
| `BIGANT_ANTHROPIC_API_KEY`, `BIGANT_API_MODELLO`, `BIGANT_API_COSTO_MAX_CENT`, `BIGANT_API_URL` | motore AI via API, con tetto di spesa | non impostate |
| `PORT` | fornita da Railway | automatica |

Altre variabili lette dal codice: `BIGANT_MOTORE_TIMEOUT_MS`, `BIGANT_SCIAME_PARALLELISMO`, `BIGANT_SCIAME_STIMA_CENT`, `BIGANT_CLAUDE_BIN`, `BIGANT_DEMO_RITMO_MS`, `BIGANT_APPROVAZIONE_AUTOMATICA_DEMO`, `BIGANT_ONLINE*` e `BIGANT_LOGO` (sito di prova). Connettori futuri, tutti spenti: `docs/DA-FARE-RAFFAELE.md`.

## 4. Avvio in locale, comandi esatti

Serve Node **>=24.19.0 <25** (usa `node:sqlite`). Nessun database esterno.

```sh
git clone --branch bigant-os-notte-1 https://github.com/lol-afk23456/bigant-os.git
cd bigant-os
node --version            # deve essere 24.x
npm ci --ignore-scripts
npm test                  # atteso: 188 pass, 0 fail
npm run check             # atteso: 5 righe OK
npm start                 # DEMO su http://127.0.0.1:4330, profili Socio/Collaboratore/Cliente DEMO
```

Altri comandi: `npm run demo:agents` (32 procedure in memoria), `npm run sciame -- --motore demo` (sciame a costo zero), `npm run scenario`, `npm run backup` / `npm run restore -- --backup PERCORSO`, `node scripts/build-online.js` (sito di prova).

**Il motore `claude-code` dello sciame richiede la CLI Claude Code** (`BIGANT_CLAUDE_BIN`). Codex usi `--motore demo` oppure `api` con chiave e tetto autorizzati. Gli agenti in `.claude/agents/` sono i prompt dello sciame, non strumenti di Codex.

Per provare la **modalità reale** in locale: `tests/modalita-reale.test.js` mostra le variabili minime (`BIGANT_MODALITA=reale`, `BIGANT_ORIGINE=https://…`, `BIGANT_SOCIO_EMAIL`, `BIGANT_SOCIO_PASSWORD_INIZIALE`, `DATA_DIR` fuori dal repository).

## 5. Mappa del codice

| Percorso | Cosa contiene |
|---|---|
| `server.js` | Server HTTP senza framework. Modalità DEMO/reale (riga 37), cookie e sessioni (54), `/health` (91), `/api/demo/login` solo DEMO (95), ascolto `0.0.0.0` in modalità reale (182) |
| `src/store.js` | SQLite, schema, `seedCore` (DEMO) e `seedRealCore` (reale), audit |
| `src/registry.js` | Registro dei 27 servizi e dei 32 agenti |
| `src/agency/` | Mappa agenzia, cruscotti, gestionale, marketing cliente zero, regia dello sciame (`swarm.js`) |
| `src/agents/` | Procedure dei 32 agenti: core, moduli, specialisti, output |
| `src/sciame/` | Sciame con motore AI: agenti, schemi di contratto (`schemi.js`), qualità, dati DEMO |
| `src/motori/` | Motori `demo`, `api`, `claude-code` |
| `src/servizi/` | Catalogo S01–S19 e KPI per servizio (legge `docs/playbook/`) |
| `src/cliente/dashboard.js` | Dashboard cliente a 9 sezioni |
| `src/growth*.js`, `src/fidelity*.js`, `src/administration.js`, `src/production.js` | Moduli Growth, Fidelity, amministrazione, produzione |
| `public/app.js` | Interfaccia unica (socio, collaboratore, cliente). Menu: `navItems` (riga 59) e `allowedNav()` (riga 60) |
| `public/ufficio.js`, `public/cliente.js` | Ufficio virtuale e dashboard cliente |
| `tests/` | 16 file, 188 test (`node --test`) |
| `scripts/` | check, backup/restore, sciame, scenario, build del sito online, PDF |
| `online/` | Sito di prova statico (GitHub Pages) |
| `docs/` | Brief, decisioni, diario, report, SOP, playbook, verifiche |

## 6. Documenti da leggere, in ordine

1. `AGENTS.md`: regole vincolanti.
2. Questo file.
3. `docs/REPORT-CLAUDE.md`: stato e sezione "Fase 1 · Server reale" con prove e limiti.
4. `docs/FASE-1-SERVER-REALE.md`: piano del server reale.
5. `docs/BRIEF-BIGANT.md`: fonte di verità, 2.184 righe, **non modificare**.
6. `docs/DECISIONI.md`, `docs/DIARIO-LAVORO.md`.
7. `docs/DA-FARE-RAFFAELE.md`: account e chiavi che servono.
8. `docs/ANALISI-APP.md`: cosa funziona davvero e cosa è solo struttura.
9. `docs/copertura/requisiti-brief.json` (R-001…R-377) e `valutazione-preliminare.json` (solo R-001…R-126, da verificare).
10. Storico: `docs/PASSAGGIO-CONSEGNE.md`, `docs/REPORT-NOTTE.md`, `research/`.

## 7. Stato reale, con i tre stati

**OPERATIVO (provato):**
- server su Railway in modalità reale;
- login con email e password, cookie `Secure`/`HttpOnly`/`SameSite=Strict`;
- Host sconosciuto rifiutato (403);
- dati persistenti sul volume;
- nessun dato DEMO nel database reale;
- 188 test, 5 dedicati alla modalità reale.

**DEMO (procedura vera su dati finti):**
- 32 agenti come procedure deterministiche;
- sciame con motore AI provato in locale con Claude Code;
- Growth, Fidelity, amministrazione, dashboard cliente;
- sito di prova.

**COLLEGAMENTO MANCANTE:**
- AI sul server: manca la chiave;
- Google Business Profile, Ads, Meta, GA4, Search Console, Postiz, Wallet Apple/Google, email: tutto spento;
- elenco completo in `docs/DA-FARE-RAFFAELE.md`.

## 8. Cosa resta da fare, in ordine di priorità

1. **Copia di sicurezza del volume.** `scripts/backup.js` accetta solo cartelle dentro il repository (`.data`, `.cache`, riga 110), quindi sul server, dove `DATA_DIR=/data`, non funziona. Oggi non esiste un backup giornaliero: è il **rischio principale**. Va estesa in modalità reale a `/data/backups` con rotazione, più un test. In alternativa, o in aggiunta, attivare i backup del volume dal pannello Railway (decisione del proprietario).
2. **Cambio password obbligatorio** al primo accesso, più una procedura di recupero per il socio. Oggi non esistono.
3. **Accessi nominali** per Alfonso e Vincenzo, dalla sezione *Accessi*: lo fa il proprietario dall'interfaccia. Eliminare i due account di collaudo.
4. **Semplificazione dell'interfaccia** secondo il quaderno delle migliorie (sezione 9). Nessuna modifica prima che i soci abbiano approvato il piano.
5. **`sharp` 0.34.5** ha vulnerabilità alte note: aggiornare a 0.35.x e ricollaudare loghi e Fidelity.
6. **Dominio `os.bigant.it`**: CNAME, dominio personalizzato su Railway, aggiornamento di `BIGANT_ORIGINE`. Con autorizzazione.
7. **Sciame:** rifare Commerciale e Social con i dati aggiunti; completare la matrice R-127…R-377 con il revisore scettico.
8. **Connettori reali**, uno alla volta e solo con chiavi e autorizzazione: GBP, poi GA4/Search Console, poi Ads (`docs/DA-FARE-RAFFAELE.md`).
9. Container non root con permessi corretti sul volume (oggi gira come root).

## 9. Quaderno delle migliorie UI

- Pagina: `https://claude.ai/artifact/1d3JwagmRR4YUyAmcZXofn`, titolo "Flussi e Pannelli BigAnt OS". Contiene la mappa dei menu, verificata su `public/app.js` il 9/10, e il quaderno condiviso delle note.
- Fotografia attuale:
  - **socio**: 16 voci, si entra su *Mappa agenzia*;
  - **collaboratore**: 6 voci, si entra su *Lavori e contenuti*;
  - **cliente**: menu fino a 5 voci più una dashboard a 9 sezioni, si entra sulla dashboard.
- Sovrapposizioni lato socio:
  - Direzione / Mappa agenzia;
  - Sciame di agenti / Ufficio virtuale;
  - Clienti / Vista cliente.
- Sovrapposizioni lato cliente: Approvazioni e Servizi compaiono sia nel menu sia come sezioni della dashboard.
- Proposta da discutere: da 16 a 7 destinazioni (Panoramica, Clienti, Lavoro, Crescita, Sciame AI, Amministrazione, Sistema), con *Vista cliente* che diventa un pulsante nella scheda del cliente.
- **Flusso di lavoro:** il proprietario annota le note mentre usa il server, poi preme «Copia elenco» e incolla il testo a Codex. Codex raggruppa le note per le 7 destinazioni e propone un piano: **nessuna modifica al codice prima dell'ok dei soci**.

## 9-bis. Mappatura con il proprietario e lavoro su Growth e Fidelity

**Il piano di lavoro passo per passo è `docs/PIANO-RIORDINO-CODEX.md`** (fasi 0-7, criteri di accettazione, prime 10 modifiche). Le voci di dettaglio sono in `docs/MAPPATURA-MIGLIORIE.md`, aggiornato con il proprietario pagina per pagina: voci UI/FUN/DAT/COL, decisioni D-xx, principio PRINC-01. Prevale sulla proposta a 7 destinazioni della sezione 9.

**Growth e Fidelity girano dentro BigAnt OS**: il codice è stato copiato, non è un collegamento alle app originali. Le app originali non sono usate da nessuno (D-11): niente dati da importare. Si spengono dopo il collaudo.

**Fidelity, da fare (prima di Growth, D-12):**
1. Leggere in sola lettura l'originale `lol-afk23456/Fidelity` e confrontarlo funzione per funzione con `research/FIDELITY-INVENTARIO.md` e con `src/fidelity*.js`. Riportare quello che manca. L'accesso al repository va chiesto al proprietario.
2. Collaudo completo sul server reale, lato amministrazione e lato iscritto, anche da telefono con lo scanner (FUN-051).
3. Google Wallet, poi Apple Wallet (COL-006). Certificati e chiavi solo nelle variabili di Railway.
4. Spegnere l'originale dopo il collaudo, con un controllo dei conteggi (DAT-003).

**Growth, da fare dopo:** riportare da `lol-afk23456/bigant-growth` (revisione `cfd4b0b`, `lib/providers.js`) le sei famiglie di collegamenti oggi simulate: ricerca Brave, lettura dei siti, AI, accesso Google, Gmail, Calendar. Accenderle a fasi come da COL-005, con chiavi cifrate nel database e tetto di spesa. Fornitore AI: decisione D-14.

## 10. Regole che Codex deve rispettare

- Lavorare solo su `bigant-os-notte-1`. **Mai** merge su `main`, **mai** force push. La PR [lol-afk23456/bigant-os#1](https://github.com/lol-afk23456/bigant-os/pull/1) la unisce solo il proprietario.
- **Nessun rilascio su Railway** (`railway up`, modifica di variabili, redeploy) senza l'ok esplicito del proprietario per quel rilascio.
- Non toccare i progetti originali: **BigAnt Growth**, **Fidelity**, il **PED** (`ped.bigantagency.it`), e gli altri progetti Railway (Growth, Fidelity - LPF Sporting Club).
- Nessuna email, messaggio, pubblicazione, pagamento o spesa. Nessun dato reale di clienti nel repository, nelle fixture o nei log.
- Nessun segreto nel repository, nei documenti, nei commit o in chat. Railway: leggere solo i nomi delle variabili, mai i valori.
- Nessun identificativo di modello AI nei file del repository.
- Importi in centesimi interi; movimenti finanziari immutabili, solo rettifiche proposte.
- Tre stati sempre distinti: **OPERATIVO / DEMO / COLLEGAMENTO MANCANTE**. Quello che non è provato si scrive `[DA VERIFICARE]`.
- Commit piccoli in italiano che citano i requisiti R-xxx. Aggiornare `docs/DECISIONI.md` (data, decisione, motivo) e `docs/DIARIO-LAVORO.md`.
- Prima di ogni push: `npm test` e `npm run check` verdi.

## 11. Prima azione consigliata per Codex

1. Clonare il ramo, leggere `AGENTS.md` e questo file, eseguire `npm test` e `npm run check`, e riportare l'esito.
2. Leggere solo il **nome** delle variabili del servizio con `railway variables --kv | cut -d= -f1`: confermare il collegamento senza esporre valori.
3. Chiedere al proprietario l'elenco del quaderno («Copia elenco»).
4. Proporre il piano per la copia di sicurezza del volume (sezione 8, punto 1) e attendere l'ok.
