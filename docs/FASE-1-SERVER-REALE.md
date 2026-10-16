# Fase 1 · BigAnt OS reale su Railway

Autorizzata dal proprietario l'8 ottobre 2026 («autorizzo il server reale su Railway»). Da eseguire in una sessione nuova, appena sono pronti i prerequisiti.

## Perché non è partita in questa sessione

Il controllo dell'8 ottobre 2026 ha dato questo esito:
- nessuna chiave Railway disponibile nell'ambiente;
- `backboard.railway.com` irraggiungibile, perché la rete dell'ambiente cloud la blocca;
- la CLI Railway non è installata.

Senza questi tre elementi non si può creare né aggiornare un servizio Railway.

## Prerequisiti (proprietario)

1. **Chiave Railway.** Su Railway: *Account Settings → Tokens*, crea un token. Nelle impostazioni dell'ambiente di Claude (menu dell'ambiente nella barra del titolo → *Modifica*) salvalo come `RAILWAY_TOKEN`. Mai scriverlo in chat.
2. **Rete.** Sempre nelle impostazioni dell'ambiente, *Network access*: aggiungi ai domini consentiti `backboard.railway.com` e `railway.com`, oppure scegli un livello di accesso più ampio. Guida: https://code.claude.com/docs/en/cloud-environments#network-access
3. **Chiave AI.** Su console.anthropic.com crea una chiave dedicata con un limite di spesa mensile. Andrà nelle variabili del servizio su Railway come `BIGANT_ANTHROPIC_API_KEY`.
4. **Email dei soci** che avranno l'accesso: Raffaele, Alfonso, Vincenzo.
5. **Sessione nuova** di Claude Code sul ramo `bigant-os-notte-1`, con questo messaggio: *«Esegui docs/FASE-1-SERVER-REALE.md»*.

## Lavoro tecnico (sessione Claude)

### A. Modalità reale (`BIGANT_MODALITA=reale`)

La modalità DEMO resta identica per i test e per il sito di prova.

- **`server.js`**
  - origine pubblica da `BIGANT_ORIGINE` (https);
  - ascolto su `0.0.0.0:$PORT`;
  - controllo dell'Host sul dominio pubblico, al posto del controllo «solo locale»;
  - cookie `Secure`;
  - nessun `/api/demo/login` e nessun profilo DEMO;
  - `NODE_ENV=production` consentito solo in modalità reale.
- **`src/store.js`**
  - `seedCore` senza aziende e utenti DEMO;
  - primo socio creato da `BIGANT_SOCIO_EMAIL` e `BIGANT_SOCIO_PASSWORD_INIZIALE` (variabili Railway), con cambio password obbligatorio al primo accesso;
  - gli altri utenti si creano dalla sezione Accessi.
- **Vincoli DEMO da togliere solo in modalità reale:** 35 punti in `server.js`, `src/*.js` e `public/app.js` (email `.example`, `demoEmail`, suffisso «DEMO» nei nomi), più le diciture «AMBIENTE DEMO» e «Dati inventati» nell'interfaccia.

### B. Dati

- Volume Railway montato su `/data`, con `DATA_DIR=/data`.
- Copia di sicurezza giornaliera con `scripts/backup.js` [DA VERIFICARE sul volume].
- Nessun dato reale nel repository, nelle fixture o nei log.

### C. AI

- `BIGANT_MOTORE=api`, `BIGANT_API_MODELLO`, `BIGANT_API_COSTO_MAX_CENT`.
- Tetto mensile in `os_costs`.
- Giro automatico giornaliero solo dopo l'ok esplicito dei soci, con il tetto attivo.

### D. Rilascio

- `Dockerfile` del server reale (Node 24, `npm ci --omit=dev`).
- `railway.json` che punta al server reale. Il sito di prova resta su GitHub Pages; `online/Dockerfile` rimane per chi lo vuole su Railway.
- Variabili su Railway: `BIGANT_MODALITA`, `BIGANT_ORIGINE`, `DATA_DIR`, `BIGANT_SOCIO_EMAIL`, `BIGANT_SOCIO_PASSWORD_INIZIALE`, `BIGANT_MOTORE`, `BIGANT_ANTHROPIC_API_KEY`, `BIGANT_API_MODELLO`, `BIGANT_API_COSTO_MAX_CENT`.
- Dominio: `os.bigant.it` va al server reale; il sito di prova resta su `lol-afk23456.github.io/bigant-os-prova`.

### E. Collaudo

- **Test automatici della modalità reale:**
  - accesso DEMO rifiutato;
  - cookie `Secure`;
  - Host diverso rifiutato;
  - creazione del primo socio;
  - isolamento tra clienti invariato.
- **Prova a mano:** Raffaele e Alfonso entrano da telefono e da PC con le proprie password e vedono gli stessi dati.

## La fase è finita quando

Raffaele e Alfonso entrano su `https://os.bigant.it` con email e password personali e lavorano sugli stessi dati. Agenti, lavori e approvazioni si salvano sul server, la copia di sicurezza è attiva e il report dichiara la Fase 1 come OPERATIVA, con le prove.
