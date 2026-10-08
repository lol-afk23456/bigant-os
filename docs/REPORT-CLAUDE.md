# Report della sessione Claude Code — 8 ottobre 2026

Ramo `bigant-os-notte-1`, PR #1 aperta e **non unita**. Nessun deploy, nessun invio, nessuna pubblicazione, nessun dato reale. Tutto è salvato su GitHub (ultimo commit della sessione nel ramo).

## In una frase

Ora BigAnt OS ha uno **sciame di agenti che lavora davvero con l'intelligenza artificiale** (motore Claude Code), con un controllo Qualità che ferma gli errori, un **ufficio virtuale** dove lo vedi al lavoro, uno **scenario completo a 13 passaggi** con un solo comando e una **dashboard cliente a 9 sezioni**. Test: **182 su 182 verdi**, controlli 5 su 5.

## Provarlo online, senza installare nulla (aggiornamento 8 ottobre, ore 16)

- Link privato: https://claude.ai/artifact/XmLAh53TMRvZQpEJ86BXRu. Le credenziali di prova le ha il proprietario; non sono nel repository.
- È tutto BigAnt OS: dashboard dei soci con ufficio virtuale, e area cliente.
- I giri reali dello sciame si vedono con il loro motore (Claude Code). I nuovi giri avviati online sono DEMO, cioè regole senza AI, e lo dichiarano.
- Come funziona e quali sono i limiti: `docs/ONLINE.md`.

## Come provarlo (comandi esatti)

Serve un computer con **Node 24.19.0** (sito ufficiale nodejs.org, versione 24) e accesso al repository.

```sh
git clone --branch bigant-os-notte-1 --single-branch https://github.com/lol-afk23456/bigant-os.git
cd bigant-os
npm ci --ignore-scripts
npm start
```

Poi apri **http://127.0.0.1:4330** nel browser.

1. **Ufficio virtuale** — scegli "Socio DEMO" e, nel menu a sinistra, "Ufficio virtuale". Vedi le 9 stanze (Regia più gli 8 reparti) e le 33 postazioni. Le postazioni dello sciame mostrano gli output **veri** dei due giri fatti oggi con Claude Code, caricati da `docs/demo-sciame/`. Tocca una postazione per leggere l'output completo, il motore, il costo e l'esito di Qualità. La pagina si aggiorna da sola ogni 4 secondi e funziona da telefono.
2. **Avvia un giro dalla dashboard** — pulsante arancione "Avvia un giro". Funziona solo se sul computer è installato Claude Code con accesso attivo; altrimenti l'ufficio mostra "COLLEGAMENTO MANCANTE" e non inventa nulla.
3. **Dashboard cliente** — esci ("Cambia profilo") e scegli "Cliente Aurora DEMO": vedi le 9 sezioni (Home, Risultati, Approvazioni e calendario, Servizi, Report, Documenti, CRM, Chiedi all'agenzia, Profilo). Ogni numero dice da dove viene; se la fonte (Google, Meta…) non è collegata, lo scrive.
4. **Scenario completo**, in un altro terminale nella stessa cartella:
   ```sh
   npm run scenario
   ```
   Stampa i 13 passaggi, dal lead all'upsell: deve finire con "13 passaggi su 13 completati".
5. **Controlli automatici**: `npm test` (182 test) e `npm run check` (5 controlli).
6. **Sciame con l'AI vera, da terminale** (serve Claude Code installato e collegato al tuo account):
   ```sh
   npm run sciame -- --motore claude-code --richiesta "Piano marketing BigAnt della prossima settimana e controllo prima nota" --salva-prove
   ```
   Se tieni aperto l'ufficio virtuale mentre gira, vedi gli agenti passare a "Al lavoro" in diretta.

Nell'ambiente cloud di Claude Code le stesse cose si fanno dalla sessione: lo sciame gira con il comando 6, mentre il browser non è raggiungibile da fuori.

## Cosa funziona, area per area

| Area | Stato | Cosa c'è davvero | Prova |
|---|---|---|---|
| Test e controlli | **OPERATIVO** | 182/182 test, 5/5 controlli, playbook estratto dal brief e verificato | `npm test`, `npm run check` |
| Sciame: motore Claude Code | **OPERATIVO** | 11 agenti con istruzioni proprie in `.claude/agents/`, eseguiti da Claude Code senza strumenti (non leggono file, non navigano, non inviano) | `docs/demo-sciame/`, `tests/sciame.test.js` |
| Sciame: controllo Qualità | **OPERATIVO** | Controlli automatici + agente Qualità su ogni output prima della coda approvazioni; una correzione, poi stop con motivo | Giri reali: 7 output approvati, 5 fermati con motivo |
| Sciame: dati su cui lavora | **DEMO** | Aziende, schede Google, recensioni e prima nota inventate e marcate DEMO | `src/sciame/dati-demo.js` |
| Motore API (Anthropic) | **COLLEGAMENTO MANCANTE** | Pronto e testato con un finto server; si accende con due variabili d'ambiente | `docs/DA-FARE-RAFFAELE.md`, voce 1 |
| Motore DEMO | Solo test | Regole fisse, dichiarate "nessuna AI" | `src/motori/demo.js` |
| Azioni verso l'esterno | **Bloccate dal codice** | Pubblicare, inviare email, modificare la scheda Google, rispondere alle recensioni, SDI: registrate come "bloccate" e rifiutate | `os_azioni_esterne`, test sciame e scenario |
| Approvazioni | **DEMO** | Coda comune; i passaggi interni si auto-approvano in DEMO e restano registrati come "auto-approvato (DEMO)"; il cliente approva con il suo accesso | Test scenario, passo 7 |
| Ufficio virtuale | **OPERATIVO** | Stati letti solo dal registro, aggiornamento automatico, telefono senza scorrimento orizzontale | Prova nel browser a 1440 e 390 px |
| Scenario a 13 passaggi | **DEMO** | Un comando, test automatico; con `--motore claude-code` usa gli agenti veri | `npm run scenario`, `tests/scenario.test.js` |
| Contratti → fatture, canoni, scadenze | **DEMO** | Il contratto genera la fattura da emettere (bozza), i canoni attesi e il preavviso di rinnovo in uno scadenziario unico | `tests/contratti.test.js` |
| "Cosa non torna" | **DEMO** | 14 controlli attivi, nuovo: incasso diverso dal dovuto; correzioni solo proposte | `tests/administration.test.js`, giro reale |
| Servizi S01–S19 | **DEMO** | Catalogo letto dalle schede del playbook: flusso, KPI, strumenti, agenti, approvazioni; 5 pacchetti con prezzi [DA VALIDARE] | `tests/servizi.test.js` |
| KPI nella dashboard cliente | **COLLEGAMENTO MANCANTE** per i canali | Misure interne calcolate (contenuti, consegne, accessi, analisi); i numeri di Google, Meta e sito restano vuoti con la fonte mancante dichiarata | `src/servizi/kpi.js` |
| Dashboard cliente a 9 sezioni | **DEMO** | Ogni cliente vede solo i propri dati, senza l'amministrazione interna | `tests/servizi.test.js` |
| Growth, Fidelity, amministrazione | **DEMO** | Come lasciato da Codex, più i collegamenti nuovi | Test esistenti |
| Integrazioni Google, Meta, Postiz, Gmail, Wallet | **COLLEGAMENTO MANCANTE** | Nessun account reale collegato | `docs/DA-FARE-RAFFAELE.md` |
| Sito BigAnt (`docs/SITO-BIGANT.md`) | Da fare | Non ancora scritto | — |

## Gli output reali dello sciame (motore Claude Code, dati DEMO)

Due giri completi, salvati con input, output, controlli di Qualità, costi e tempi in `docs/demo-sciame/`.

**Giro 1** (21 passi, circa 10 minuti, 2,80 USD dichiarati a listino):
- **Orchestratore**: ha letto la richiesta e scelto i 6 reparti. Ha **escluso da solo** "pubblica tutto e manda la proposta al cliente", perché sono azioni riservate ai soci.
- **Direttore Crescita**: tre priorità per la settimana dal 12 al 18 ottobre: scheda del pacchetto Presenza per i clienti attuali, prima Analisi gratuita S17 con criterio di qualificazione, completamento dei KPI mancanti con l'Amministrazione. Approvato dopo una correzione: Qualità aveva trovato una soglia "30%" senza fonte nei dati.
- **Marketing BigAnt**: 10 uscite su 9 canali e 5 bozze complete, diventate contenuti programmati nel calendario DEMO. Pubblicazione bloccata.
- **Amministrazione**: 8 anomalie spiegate (doppio movimento, credito scaduto, compenso non saldato, abbonamento aumentato…) con verifiche e correzioni **solo proposte**; importi identici al centesimo.
- **Recensioni (S08)**: risposte alle 4 recensioni, con l'avviso immediato sulla negativa.
- **Fermati da Qualità**: qualifica dei lead, social S01 e scheda Google. Avevano citato dati assenti dal pacchetto (il collaboratore Enzo, il "perimetro settori"). Ho aggiunto quei dati, presi dal brief.

**Giro 2** (17 passi, 1,83 USD):
- **Ricerca clienti**: approvata al primo tentativo. Ha scelto Officine Nautiche Garigliano DEMO, perché ha il divario più evidente: sito senza versione mobile, scheda non rivendicata, social assenti.
- **Scheda Google di Bottega Aurora (S06)**: 9 controlli, 3 incoerenze NAP tra scheda e sito, 4 post pronti. Modifiche bloccate in attesa di Vincenzo e del collegamento.
- **Recensioni**: approvate.
- **Fermati da Qualità**: analisi gratuita (punteggio senza un metodo dichiarato) e social (luogo degli eventi non indicato). Ora il metodo di punteggio, provvisorio e [DA VALIDARE], e i dati mancanti sono nei pacchetti: va rifatto un giro per vederli approvati.

Il controllo Qualità **funziona davvero**: ferma gli agenti quando scrivono qualcosa che non viene dai dati.

## Cosa resta da fare (in ordine)

1. Rifare un giro reale di Commerciale e Social con i dati aggiunti: `npm run sciame -- --motore claude-code --flussi commerciale,social --salva-prove`.
2. Completare la **matrice R-001…R-377**: la valutazione preliminare copre R-001…R-126 (`docs/copertura/valutazione-preliminare.json`). La seconda passata del revisore scettico e i requisiti R-127…R-377 sono da fare. Non c'è ancora una percentuale ufficiale sul brief nuovo.
3. `docs/SITO-BIGANT.md` con i modelli di pagina e `docs/INTEGRAZIONI.md` con l'interfaccia di ogni connettore (versione DEMO e versione reale spenta).
4. Connettori reali uno alla volta, dopo le chiavi di `docs/DA-FARE-RAFFAELE.md`: prima GBP, poi GA4/Search Console, poi Ads.
5. Documenti e autorizzazioni (archivio contratti, privacy, portfolio), preventivi versionati, capacità e carico per persona.
6. Avvisi ai soci (email o WhatsApp) quando un automatismo si blocca: oggi gli avvisi si vedono solo nell'ufficio.
7. Aggiornare `sharp` a 0.35.x: `npm audit` segnala vulnerabilità alte nella versione attuale (vedi rischi).

## Rischi da conoscere

- **Sicurezza delle dipendenze**: `sharp` 0.34.5, la libreria dei loghi, ha vulnerabilità alte note. Prima di qualsiasi messa online va aggiornata e ricollaudata.
- **Costi del motore Claude Code**: ogni passo dichiara un costo "equivalente a listino" (circa 0,05–0,30 USD). Nel tetto mensile di BigAnt OS è contato prudenzialmente 1 USD = 1 €. Se questi consumi siano inclusi nel tuo abbonamento Claude è [DA VERIFICARE].
- **L'app resta un prototipo locale**: rifiuta indirizzi pubblici e non va pubblicata così com'è.
- **Matrice incompleta**: i numeri di copertura sul brief nuovo non sono ancora misurati in modo verificato.

## Cosa serve da te (da `docs/DA-FARE-RAFFAELE.md`)

| # | Cosa | Gratuito? | Variabili d'ambiente |
|---|---|---|---|
| 1 | Chiave API Anthropic (facoltativa: lo sciame funziona già con Claude Code) | No, a consumo | `BIGANT_MOTORE=api`, `BIGANT_ANTHROPIC_API_KEY`, `BIGANT_API_MODELLO` |
| 2 | Progetto Google Cloud + Google Business Profile API | Sì, con approvazione | `BIGANT_GOOGLE_CLIENT_ID`, `BIGANT_GOOGLE_CLIENT_SECRET`, `BIGANT_GOOGLE_PROJECT_NUMBER` |
| 3 | Google Ads API, token "Basic" | Sì | `BIGANT_GOOGLE_ADS_DEVELOPER_TOKEN`, `BIGANT_GOOGLE_ADS_LOGIN_CUSTOMER_ID` |
| 4 | Verifica aziendale Meta + app con `ads_read` | Sì | `BIGANT_META_APP_ID`, `BIGANT_META_APP_SECRET` |
| 5 | GA4 e Search Console | Sì | Le stesse del punto 2 |
| 6 | Postiz | Sì se installato da voi | `BIGANT_POSTIZ_URL`, `BIGANT_POSTIZ_API_KEY` |

Più le decisioni dei soci: account aziendale Google, ditta per la verifica Meta, software di fatturazione, canale degli avvisi, prezzi dei pacchetti, metodo di punteggio dell'analisi gratuita. I passi esatti sono in `docs/DA-FARE-RAFFAELE.md`.
