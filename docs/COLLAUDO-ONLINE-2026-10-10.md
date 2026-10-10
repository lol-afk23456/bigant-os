# Collaudo autenticato e archivio Growth — 10 ottobre 2026

Sessione socio di BigAnt OS sul server Railway. Login e cambio password completati; nessuna credenziale copiata nei file. Le prove seguenti riguardano la sessione socio, non certificano ancora cliente, collaboratore o dispositivi fisici.

## Cliente separato e preparazione degli accessi

Creata sul server l’attività «BigAnt (cliente di prova)», settore «COLLAUDO · dati inventati», con Social media e Fidelity. La scheda ha due servizi e nessun documento. L’anteprima cliente mostra soltanto i due servizi propri. In Fidelity il cliente di prova ha zero iscritti; passando all’agenzia si vede l’unico iscritto inventato del collaudo precedente e tornando al cliente di prova il conteggio resta zero. È una verifica dalla sessione socio, non il collaudo dell’isolamento con un’autenticazione cliente.

Il proprietario ha fornito in chat gli indirizzi nominali. Preparati due moduli non ancora salvati: cliente associato alla sola attività di prova; Vincenzo collaboratore assegnato soltanto alla medesima attività. Campi password lasciati vuoti; il titolare deve inserire e confermare le nuove credenziali direttamente nel browser. Nessuna email inviata, nessuna password copiata, nessun accesso aggiunto da questi moduli. Immagine dei soli permessi, senza indirizzi: `riordino-browser/accesso-vincenzo-pronto.png` nella cache ignorata.

DAT-001 passa a parziale; FUN-001 resta da fare fino al salvataggio, al cambio password obbligatorio e alla verifica dei tre accessi distinti. Nessuna modifica al codice applicativo: le 791 prove già superate non sono state ripetute.

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

## 19:37 — Originali: prerequisito per DAT-003

Consultati in sola lettura gli indirizzi già documentati delle due app originali. Fidelity reindirizza alla pagina `/login`; BigAnt Growth mostra «GROWTH · ACCESSO TITOLARI». Nella sessione del browser non sono disponibili accessi autenticati separati. Nessun conteggio è stato ricavato o assunto pari a zero; nessuna password tentata, nessun dato copiato e nessuna modifica alle originali. DAT-003 resta aperto fino alla consultazione autorizzata dei conteggi. La sessione socio BigAnt OS non equivale all’accesso a queste due app.

## Profili Meta — 20:09 Roma

Codice `5e84188` pubblicato e verificato, deployment `458353d9-ac30-4686-b5d3-f66000a568d3` SUCCESS. Backup prima del rilascio: `e3a614c5-0079-4ecd-9b10-554d0959fa0d`, 20:05, 801 MB. Suite **846/846**, controllo progetto **5/5**. Nuove letture Instagram/Facebook con selezione, prova privata, consenso per cliente e aggiornamento giornaliero facoltativo; API di lettura e copie temporanee protette. Dati nel servizio Social solo dopo attivazione.

Online: health ok, `demo:false`, `externalActions:false`, `externalReadsEnabled:false`; due file pubblici corrispondenti, API Meta anonima401. Pannello socio conferma Meta disabilitato e nessun canale selezionato; zero errori console. Nessun account Meta reale collegato. Procedura, prove e limiti in [COLLAUDO-PROFILI-META](COLLAUDO-PROFILI-META.md).

## Report cliente a schede — 20:20 Roma

Codice `71aeb3d`, deployment `371d5377-9c53-4b2b-8e14-cc7ba2bfec74` SUCCESS. Suite **851/851**, controllo **5/5**. Modificati soltanto interfaccia, test e documentazione; nessuna migrazione o modifica del database.

Railway ha rifiutato una nuova copia manuale per limite del piano («10 backups per volume»). Nessuna copia cancellata e nessun cambio di piano: usata la copia delle 20:05 `e3a614c5-0079-4ecd-9b10-554d0959fa0d` (801 MB), nuovamente confermata dall’API prima del rilascio. Il precedente deployment `458353d9-ac30-4686-b5d3-f66000a568d3` resta il riferimento per un ripristino della sola interfaccia. Un eventuale ripristino dei dati è una decisione distinta e non è stato eseguito.

Health ok; `demo:false`, letture e azioni esterne false. `app.js` e `cliente.js` corrispondono ai file verificati; API dei servizi anonima401. Browser socio: Fidelity → card Iscritti Fidelity → dettaglio del cliente di prova (conteggi0, fonte e data) → Indietro ripristina la sola card; zero errori console. Immagine tecnica `report-detail-online.png`. Per il giro Social/Google e mobile vedere [COLLAUDO-VISTA-CLIENTE](COLLAUDO-VISTA-CLIENTE.md). Nessuna attestazione del completamento globale delle92 voci.

## Calendario interno e diciture — blocco UI-006

Corretti i testi della sola produzione dei contenuti: fonte manuale, nuove bozze, revisione, pianificazione/rimozione data e dettagli del servizio distinguono modalità reale e DEMO. Il motore riceve esplicitamente la modalità del server; feedback e provenienza nuovi non ricevono più una falsa etichetta DEMO sul server reale. Nessuna riscrittura dei dati esistenti. Avanzamento descrive il calendario interno e l'annullamento di approvazione/data dopo una revisione; la pubblicazione esterna resta dichiarata disabilitata. Non cambia il menu: Lavori e contenuti rimane nascosto.

Prove mirate **29/29**, suite **890/890**, controllo **5/5** (182 JavaScript, 103 documenti, 252 link). Un errore iniziale riguardava solo l'origine HTTPS mancante della nuova fixture ed è stato corretto. Le prove coprono entrambe le modalità e il passaggio effettivo della configurazione dal server. Collaudo online mirato da registrare dopo il rilascio; UI-006 complessiva ancora aperta.

**Esito online delle 21:00:** codice `30315a3`, deployment `45eb1c9e-e584-41be-b2da-32973fdd3217` SUCCESS. Backup delle 20:05 riconfermato, 801 MB; nessuna migrazione o scrittura automatica. Health ok, file app.js coincidente, azioni e letture esterne false.

Collaudo tramite normali API autenticate, con credenziali già autorizzate e solo in memoria: identificazione esatta di BigAnt (cliente di prova), creazione di un solo contenuto inventato, transizioni a revisione, programmazione senza approvazione rifiutata (409), decisione del socio registrata, data interna salvata, pubblicazione rifiutata (409). La modifica del testo crea la versione 2, rimuove la data e rende inutilizzabile l'approvazione precedente (409). Nessuna chiamata a canali esterni. Sessione tecnica chiusa al termine, nessuna modifica agli accessi del browser.

Browser socio: riletto il contenuto nel servizio Social, fonte di collaudo, stato IN PRODUZIONE, testo «COLLAUDO CONCLUSO», nessuna data pianificata e nessuna approvazione pendente. Desktop e telefono 390/390 px; zero errori/avvisi. Immagini `production-mode-online.png` e `production-mode-mobile.png`, prove API in `production-mode-online.json`, tutte nella cache ignorata. La prova non attesta gli accessi nominali del collaboratore/cliente né la pubblicazione esterna. UI-006 passa a parziale: matrice 73 locali, 15 parziali, 4 da fare.

Durante questo giro è emersa una pagina residua per PRINC-01: `#service:social`, gestita da `serviceWorkspaceView()`, mostra ancora più pannelli completi. L'indice Servizi già riordinato non basta a coprire questo percorso diretto: prossimo intervento da fare sulla pagina, senza ripetere il collaudo del calendario.
