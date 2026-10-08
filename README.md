# BigAnt OS

Il laboratorio interno di BigAnt per riunire lavoro, clienti, agenti e amministrazione. Prototipo con dati inventati marcati **DEMO**. Nessuna email, pubblicazione, pagamento, chiamata a servizi esterni o modifica alle app online.

Inizia da [Report della notte](docs/REPORT-NOTTE.md), [analisi](docs/ANALISI-INIZIALE.md), [architettura](docs/ARCHITETTURA.md) e [playbook operativo](docs/PLAYBOOK.md).

**Consegna a Claude Code:** iniziare da [PASSAGGIO-CONSEGNE.md](docs/PASSAGGIO-CONSEGNE.md). Lo sviluppo è fermato per richiesta del proprietario. Il ramo GitHub da usare è `bigant-os-notte-1`, PR #1 aperta. La copia locale e quella remota hanno storie diverse: non forzare il push.

Stato al passaggio: **32 procedure DEMO eseguibili**, non modelli AI collegati; **160/161 test passati**, con un test evento obsoleto in `tests/agency.test.js`. Il nuovo [brief integrale](docs/BRIEF-BIGANT.md) è conservato senza modifiche. La [copertura](docs/VERIFICA-COPERTURA-BRIEF.md) del documento esteso non è ancora misurata: il 30,2% storico (62/205) riguarda solo il vecchio brief notturno, conservato separatamente. La [struttura dell'agenzia](docs/STRUTTURA-AGENZIA.md) e i menu non equivalgono a servizi completi.

## Avvio locale

Occorre Node **24.19.0** (serie24). Le sole dipendenze applicative sono sharp 0.34.5 per i loghi e qrcode 1.5.4 per le tessere, fissate nel lockfile. Non occorrono chiavi API o abbonamenti aggiuntivi.

```sh
npm ci --ignore-scripts
npm start
```

Apri l'indirizzo locale stampato all'avvio. Scegli un accesso dimostrativo per provare socio, collaboratore e cliente. Sono identità inventate, disponibili solo sul computer locale: non sono account di produzione. Il prototipo rifiuta l'avvio pubblico.

```sh
npm test
npm run check
npm run demo:agents
```

Il database di prova resta nella cartella tecnica `.data`, esclusa da Git. Le fonti originali per l'analisi restano in `.sources`, anch'essa esclusa. Il repository contiene codice, documentazione e fixture; nessun archivio reale.

## Struttura

- `src`: nucleo comune, moduli Growth/Fidelity/amministrazione, registro servizi e orchestratore.
- `src/agency`: contratti e spazi dell’intera agenzia, marketing BigAnt, 27 servizi, 32 specialisti, dieci moduli e dashboard.
- `public`: dashboard italiana unica per soci, collaboratori e clienti.
- `tests`: controlli di comportamento, isolamento, importi, approvazioni e integrazione.
- `docs`: brief, metodo, decisioni, API, collaudo e percorso di attivazione.
- `research`: inventari delle funzioni originali con versione GitHub verificata.

Le funzioni esterne rimangono scollegate. La tabella nel report distingue funzioni provate localmente, simulazioni e parti ancora da attivare. Non distribuire questo prototipo su internet senza completare la checklist di produzione e una nuova autorizzazione.

## Salvataggio e ripristino della prova

`npm run backup` crea una copia coerente in `.data/backups`. `npm run restore -- --backup PERCORSO_BACKUP` verifica la copia e crea un archivio **nuovo**, senza sovrascrivere quello in uso. La procedura stampa la cartella da usare con `DATA_DIR`; le vecchie sessioni vengono escluse dalla copia ripristinata. Queste procedure locali non sostituiscono un backup remoto di produzione.

## Prima prova in cinque minuti

1. Entra come **Socio DEMO** e apri **Mappa agenzia**: reparti, servizi, dieci moduli e aree ancora da costruire. **Marketing BigAnt** contiene il piano del cliente zero; **Direzione** le sei domande e le decisioni.
2. In **Sciame di agenti**, avvia Social sull’attività BigAnt e leggi l’esito. Apri l’approvazione prodotta.
3. In **Growth**, prova la ricerca DEMO: i nuovi contatti hanno fonti ed email inventate; apri analisi e bozza.
4. Seleziona **Bottega Aurora DEMO**, apri Fidelity e accredita un timbro all’iscritto inventato.
5. Cambia profilo in **Cliente Aurora DEMO**: controlla servizi e approvazioni, senza accesso alla contabilità dell’agenzia.

Tutto rimane locale. Non aggiungere dati veri o credenziali: questo ramo prepara il pilota, non la messa in produzione. La sessione tecnica dello scheduler non consente accesso interattivo; non è un quinto profilo da usare.


Controllo documentale dopo il salvataggio del brief integrale: `npm run check` passa sintassi, registro, dipendenze e prototipo locale, ma segnala 22 riferimenti relativi del testo sorgente a schede playbook non ancora estratte. Il file integrale resta byte per byte uguale all’originale. Anche questo limite è consegnato a Claude, senza cambiare il testo sorgente o introdurre segnaposto vuoti.
