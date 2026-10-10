# Collaudo autenticato e archivio Growth — 10 ottobre 2026

Sessione socio di BigAnt OS sul server Railway. Login e cambio password completati; nessuna credenziale copiata nei file. Le prove seguenti riguardano la sessione socio, non certificano ancora cliente, collaboratore o dispositivi fisici.

## Fidelity sul server

Creati un programma `COLLAUDO BigAnt · 10 ottobre` e un solo iscritto esplicitamente inventato, con dominio `.example` e senza consenso marketing. Nessun messaggio, Wallet o premio commerciale emesso.

- Creazione programma a cinque timbri e tessera web: riuscita.
- Accredito di cinque timbri: saldo 5, un premio disponibile.
- Riscatto: saldo 0; secondo riscatto rifiutato per saldo insufficiente.
- Storno del riscatto: saldo 5, movimento originale conservato e contro-movimento nello storico.
- Ricerca tramite link della tessera: restituisce l’iscritto corretto.
- Esportazione CSV: una riga inventata, saldo 5, consenso marketing 0.
- Pagina pubblica: QR caricato; email assente dal testo visibile; a 390 px larghezza documento pari alla larghezza disponibile.
- Cambio soglia dopo l’iscrizione: rifiutato dal server.
- Programma infine disattivato; stato verificato riaprendo il modulo. La tessera web rimane consultabile e lo storico resta conservato.

Prove tecniche nella cache ignorata: `riordino-browser/bigant-fidelity-online-390.png` e `riordino-browser/fidelity-collaudo-online.csv`. Il CSV contiene esclusivamente il dato inventato di questo collaudo.

Restano aperti: iscrizione pubblica con documenti approvati, scanner con fotocamera fisica, Google Wallet/Android, giri definitivi cliente/collaboratore. Apple esclusa dalle attivazioni richieste. FUN-051 e COL-007 non sono completate dal solo percorso socio.

## Backup e custodia cifrata

- Avanzamento → Copia di sicurezza: prima copia automatica verificata nel browser, riuscita il **10 ottobre alle 16:05, ora di Roma**. Conservazione dichiarata: ultime 14 copie. Il ripristino e una destinazione indipendente restano verifiche distinte.
- Railway: backup `8c653fc3-b653-4bf0-9096-9dbfb239f533`, **18:06**, 800 MB referenziati, prima della configurazione della cifratura.
- Assenza di `BIGANT_SECRET_KEY` verificata leggendo soltanto nomi e metadati delle variabili Railway. Generata una chiave casuale di 32 byte in memoria e trasmessa tramite stdin al servizio autorizzato. Nessun valore mostrato o salvato localmente; nessuna variabile preesistente sovrascritta.
- Riavvio della versione già collaudata: deployment `eed99845-3e3e-4a01-8188-b6dfe47d9262`, SUCCESS. Health 200; modalità reale, letture e azioni esterne ancora disabilitate.
- Avanzamento → Custodia cifrata: disponibilità della cifratura confermata nel browser alle **18:32**. La rotazione completa della chiave resta lavoro aperto. La disponibilità del vault non prova il collegamento a un fornitore.

## Blocco Growth osservato

Aprendo Growth in produzione, il server rifiutava un vecchio spazio DEMO occupato. Il rifiuto proteggeva dal mescolare prove e dati reali, ma mancava un percorso utilizzabile per iniziare.

La correzione aggiunge un passaggio esplicito riservato ai soci: anteprima dei conteggi, conservazione atomica della prova in un archivio privato nello stesso database e creazione dello spazio reale vuoto, in pausa e con i fornitori disabilitati. Non converte contatti, messaggi o appuntamenti dimostrativi in dati reali. I movimenti economici centrali restano invariati.

Il ripristino è disponibile dalle impostazioni soltanto finché lo spazio reale è vuoto e non configurato. Versione dell’anteprima, permessi correnti e dipendenze vengono ricontrollati sul server; modifiche concorrenti o nuove attività impediscono la sostituzione. Il browser vincola la conferma alla pagina, al socio e al cliente iniziali.

Verifiche: **791/791 test**, zero saltati, controllo progetto **5/5**. Le 19 prove nuove coprono 23 tabelle Growth, ripristino integrale, transazioni interrotte, isolamento, versioni obsolete, ruoli e protezioni HTTP/browser. Codice **4d99498**, pubblicato e verificato sul server.


## Rilascio e prova finale Growth

- Backup Railway prima del rilascio: `351d73d0-ffb7-4118-a4cf-044dea2a76ca`, 10 ottobre **18:43**, 800 MB referenziati.
- Deployment `a8da3f4f-3e95-47cb-921c-23a58c8ba450`, SUCCESS. Alle 18:46: health OK, codice pubblico identico al commit, API Growth/Fidelity/Collegamenti anonime 401; azioni e letture esterne disabilitate.
- Il browser mostrava soltanto i conteggi della prova precedente: **5 aziende, 6 attività e 6 registrazioni di costo**. Nessuna scheda precedente esportata o copiata nel repository.
- Eseguita la transizione esplicita: Growth ora si apre con aziende, bozze, appuntamenti e attività a zero; ricerca in pausa, **0 di 5 fasi attive**. Le vecchie registrazioni sono conservate nell’archivio privato, i costi centrali invariati.
- Impostazioni: ripristino disponibile e abilitato. Il ciclo completo di ripristino è verificato nei test automatici; non ripetuto in produzione.
- Vista Growth a 390 px: larghezza documento 390 px. Immagine `riordino-browser/bigant-growth-online-390.png` nella cache ignorata.

Restano da autorizzare e collaudare fornitori AI, ricerca, Gmail e Calendar. Il budget disponibile mostrato da Growth è **0 €**: va verificato nel controllo costi prima di qualsiasi prova a pagamento. Questo rilascio non attiva alcun fornitore e non certifica il percorso esterno di acquisizione clienti.
