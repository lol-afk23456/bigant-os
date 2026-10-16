# Avanzamento della piattaforma — FUN-004 / FUN-008 / UI-004

La pagina Avanzamento è riservata ai soci e descrive questa installazione di BigAnt OS. Non misura la percentuale di completamento del progetto e non certifica il collaudo del server o di un servizio esterno. La consultazione non avvia prove, backup, agenti o chiamate ai fornitori e non apre il vault né restituisce o mostra credenziali. La validità della configurazione Wallet viene verificata internamente sulle variabili già passate al modulo, senza letture di file o chiamate esterne.

Tre etichette: **Funziona** per una capacità disponibile nell’installazione reale con i prerequisiti richiesti; **Prova** per dati DEMO, funzioni parziali o una capacità da verificare; **Da collegare** quando manca il collegamento necessario. Il testo della scheda precisa sempre il perimetro: autorizzare Gmail non collega Calendar, Analytics o i social; salvare una chiave non verifica il fornitore né attiva un agente.

Lo stato viene letto dai moduli già presenti: modalità dell’installazione, disponibilità dell’archivio cifrato, autorizzazione Google corrente, configurazione degli agenti e ultima copia automatica riuscita. La data di lettura non viene presentata come data di collaudo. Una copia con errore, futura o più vecchia di 26 ore non risulta funzionante; una copia recente non attesta il ripristino né protegge dalla perdita dell’intero volume. Le funzioni esterne ancora incomplete restano Prova o Da collegare, anche con accessi salvati.

Le nove Fondamenta rimangono tutte consultabili, una alla volta. Ogni scheda distingue le parti già presenti dalle parti da costruire, senza reinserire nella navigazione i moduli che il proprietario ha nascosto. Custodia dei collegamenti, listino e onboarding vengono descritti secondo il codice attuale, non secondo i vecchi segnaposto.

Catalogo API: `GET /api/workspace/progress`, sola lettura, soci attivi soltanto. Restituisce schede con nome, stato, capacità disponibili, mancanze, fonte dello stato, eventuale data dell’evidenza e destinazione interna. Include le Fondamenta ma esclude credenziali, nomi degli account, dati dei clienti, contenuti e numeri economici. Il cliente selezionato non cambia l’ambito della piattaforma. La lettura verifica di nuovo l’identità del socio; non salva record o eventi di audit.

Collaudo richiesto: permessi e revoche, modalità DEMO/reale, backup recente/vecchio/in errore, Google autorizzato con versioni correnti o revocate, chiave cifratura assente/presente, nessuna promozione dei canali senza collegamento, assenza di rete e scritture. Browser: Stato → funzione → Indietro, Fondamenta → area → Indietro, collegamenti alle pagine correnti e 390 px. Le prove locali non sostituiscono il collaudo reale.

## Verifica locale del 10 ottobre 2026

42 nuove prove: 20 sui segnali dei runtime, 7 su aggregazione/API e permessi, 8 sulla navigazione e gestione asincrona, 7 sui testi operativi. La suite completa passa 449/449. I casi coprono archivio vuoto senza insert, assenza di chiamate e apertura del vault, configurazioni/versioni obsolete, revoca del socio, pausa, attività disattivata, backup al limite delle 26 ore e futuro, fonte e data distinte, errori e risposte tardive. I fornitori dei collaudi sono finti; nessuna chiave reale.

Browser locale in memoria: accesso socio, Stato → Custodia → Collegamenti, Fondamenta → Custodia → Indietro, elenco di 17 capacità e nove aree. Desktop e 390×844; documento largo 390 px, nessun overflow orizzontale. Profilo cliente: catalogo, dettaglio social e Report senza le vecchie etichette tecniche; dati DEMO e parti mancanti conservati. Rimosso anche il collegamento residuo a Lavori che conduceva alla Home. Console senza errori osservati. Le immagini sono nella cache tecnica del progetto: bigant-progress-status, bigant-progress-status-mobile, bigant-progress-foundation e bigant-progress-foundation-mobile.

FUN-004, FUN-008, UI-003 e UI-004 sono implementate in locale. Restano rilascio e collaudo sul server; il giro completo cliente/collaboratore e i flussi reali non sono certificati da queste prove. Nessuna attivazione, account, spesa o modifica del server.
