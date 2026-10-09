# BigAnt OS — regole per gli agenti

**Punto di partenza (9 ottobre 2026): `docs/PASSAGGIO-CODEX.md`** — accessi, server reale su Railway, stato, priorità e regole.

Prima di ogni sessione rileggere `docs/BRIEF-BIGANT.md`, `docs/VERIFICA-COPERTURA-BRIEF.md` e `docs/PASSAGGIO-CONSEGNE.md`. Il brief esteso è conservato integralmente; la matrice storica non ne misura ancora tutto il perimetro. Per proseguire usare il ramo remoto, senza forzare la storia locale.

Leggere README, docs/BRIEF-BIGANT.md, docs/DECISIONI.md e docs/REPORT-NOTTE.md prima di modificare.

- Progetto interno, due ditte individuali sotto un marchio. Non costruire un SaaS commerciale.
- Lavorare sul branch bigant-os-notte-1; niente main, force push, merge o deploy senza nuova istruzione esplicita.
- Growth, Fidelity e PED originali restano intatti. Railway solo lettura dei metadati, mai valori riservati.
- Nessuna email, messaggio, pubblicazione, pagamento, collegamento reale o servizio a pagamento durante il prototipo.
- Nessuna lettura di 04_ACCESSI, .env reali, archivi contabili o database di produzione. Non trasferire dati reali in repository, fixture o log.
- Un database e un'identità. Il socio BigAnt è owner OS; il titolare cliente Fidelity è client OS.
- Permessi verificati sul server per ogni rotta/record. Economia solo ai soci. Gli agenti non amministrativi ricevono solo aggregati autorizzati.
- Importi in centesimi interi; movimenti finanziari immutabili. Proporre rettifiche, mai correggere automaticamente.
- Memoria versionata e fonti obbligatorie. Ogni rifiuto torna nel feedback. Nessun output simulato presentato come reale.
- Prima una SOP, poi l'agente. Nuove funzioni si registrano nel catalogo; nuove integrazioni restano scollegate fino a collaudo e autorizzazione.
- Dipendenze note e fissate; preferire runtime standard già disponibile. Non eseguire script scaricati da fonti ignote.
- Testare isolamento clienti, permessi, approvazioni obsolete, precisione, idempotenza, ripresa job e divieto effetti esterni.
- Commit piccoli in italiano. Aggiornare tabella migrazione e report con prove, limiti e gap espliciti.
- Tutti i file di lavoro devono rimanere nella cartella tecnica del repository. Su Drive soltanto i tre report autorizzati.

La delega è consentita dal brief notturno. Assegnare file disgiunti, verificare i risultati, nessuna autonomia esterna ereditata dagli agenti applicativi.
