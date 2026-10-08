# BigAnt OS online — come funziona la versione da aprire con un link

Aggiornato l'8 ottobre 2026.

## In breve

- **Link**: pagina privata su claude.ai, https://claude.ai/artifact/XmLAh53TMRvZQpEJ86BXRu (la apre solo il proprietario e chi lui invita dal menu *Condividi*).
- **Cosa c'è dentro**: l'intero BigAnt OS, cioè lo stesso codice di `server.js`, `src/` e `public/`. Ci sono la dashboard dei soci (agenzia, marketing, direzione, amministrazione, clienti, lavori, Growth, Fidelity, ufficio virtuale, sciame, approvazioni, registro, servizi, collegamenti, accessi) e l'area cliente.
- **Dove gira**: dentro il browser di chi apre il link. Il database SQLite vive nella pagina e si salva solo in quel browser. Nessun dato passa da un server e nessun dato reale entra mai.
- **Accessi**: email e password di prova per il socio (`socio@bigant.example`) e per il cliente (`cliente@aurora.example`, attività *Bottega Aurora DEMO*). Le password si generano quando si costruisce la pagina e restano in `.cache/online/credenziali.json`, cartella esclusa da Git: non sono nel repository. Restano anche i pulsanti di accesso rapido dei profili DEMO.
- **Ricomincia da capo**: il pulsante in basso a destra cancella le prove salvate nel browser e riparte dai dati DEMO iniziali.

## Lo sciame nella versione online

| Cosa | Stato |
|---|---|
| Giri reali già fatti con Claude Code (8 ottobre 2026) | **OPERATIVO come registro**: compaiono nelle scrivanie e nei giri con l'etichetta del motore Claude Code e i costi reali. |
| Nuovi giri avviati dal pulsante *Avvia un giro* | **DEMO**: motore a regole fisse, nessuna AI. Il testo compare a velocità di lettura (`BIGANT_DEMO_RITMO_MS=6000`) per mostrare il flusso: agente al lavoro → Qualità → approvazione automatica DEMO → azioni esterne bloccate. L'etichetta del motore lo dichiara su ogni postazione. |
| Agenti con intelligenza artificiale vera dentro la pagina online | **COLLEGAMENTO MANCANTE**: nel browser non si può avviare Claude Code. Per l'AI vera serve la versione sul computer (`npm start` con Claude Code) oppure un motore che usa le capacità AI della pagina claude.ai [DA VERIFICARE]. |

## Limiti noti della versione online

- **Codici QR di Fidelity**: si generano solo nella versione sul computer. La pagina online risponde con un messaggio chiaro.
- **Logo personalizzato di Fidelity**: anche l'elaborazione delle immagini funziona solo sulla versione sul computer.
- **Download di file (esportazioni)**: il visualizzatore di claude.ai non permette di scaricare file dalle pagine, quindi i pulsanti di download non fanno nulla.
- **Password nella pagina online**: sono protette con una derivazione SHA-256 iterata al posto di scrypt. Basta per accessi DEMO che restano nel browser; non è adatta a utenti reali.
- **Salvataggio delle prove**: i dati stanno solo nel browser in cui si prova. Un altro browser, un altro dispositivo o una finestra in incognito ripartono da zero.

## Come si ricostruisce e si ripubblica

```bash
export PATH=$PWD/.cache/node-v24.19.0-linux-x64/bin:$PATH        # Node 24 ufficiale (vedi CLAUDE.md)
npm install --prefix .cache/build-online esbuild@0.25.10 buffer@6.0.3 sql.js@1.13.0   # strumenti fissati, fuori da Git
node scripts/build-online.js                                     # crea .cache/online/BigAnt-OS.html
```

Poi si pubblica `.cache/online/BigAnt-OS.html` con lo strumento Artifact di Claude Code, sullo stesso indirizzo. Ogni nuova costruzione cambia la "versione": i browser che avevano dati salvati ripartono dai dati DEMO iniziali.

## Come è fatta

- `online/avvio.js` crea l'app con `createApp()` come fa `npm start`. Le richieste `/api/*` della dashboard passano al gestore del server dentro la pagina, con gli stessi controlli: sessione, CSRF, permessi per ruolo e isolamento tra clienti.
- `online/shim/` contiene i sostituti dei moduli Node:
  - `node:sqlite` → sql.js;
  - `node:crypto` → SHA-256 e casualità del browser;
  - `node:fs` → file inclusi (playbook, istruzioni degli agenti, giri reali);
  - `node:http` → nessuna rete;
  - `child_process` → bloccato.
- Verifica dell'8 ottobre 2026, con un browser automatico (Chromium), sulla pagina costruita:
  - socio: 16 pagine su 16 aperte senza errori, giro dello sciame avviato dall'ufficio con agenti al lavoro e testo in diretta;
  - cliente: 5 pagine su 5 senza errori, la sessione resta dopo il ricaricamento, nessuno scorrimento orizzontale su telefono (390 px);
  - nessuna chiave o email reale trovata nel file.
