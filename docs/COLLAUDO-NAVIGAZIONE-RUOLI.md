# Navigazione per ruolo e profili cliente — 10 ottobre 2026

## Modifiche

I tuoi profili è ora raggiungibile dal menu cliente e dalla home. Sei canali pubblici della propria attività, con indirizzo, fonte e data; i report si aprono nel servizio acquistato. L’anteprima del socio usa la medesima proiezione in sola lettura, senza controlli amministrativi o dati delle prove Google. API `/api/cliente/profiles`: identità/sessione/attività ricontrollate, nessuna scrittura o chiamata esterna. Accessi ha ora una testata esplicita.

L’[ordine degli agenti](ORDINE-CONFIGURAZIONE-AGENTI.md) soddisfa il criterio documentale FUN-054, partendo dai servizi attivi dichiarati nel brief. Non certifica i servizi correnti né avvia T4 o attivazioni reali.

## Prove

- Browser in memoria: dodici sezioni del socio caricate, dimensione 390 px senza overflow. Ufficio conservato come prima scheda dello Sciame, come richiesto.
- Collaboratore: solo Home, Clienti assegnati, Da approvare; una sola attività assegnata, cinque sezioni operative della scheda e nessun contratto, documento o dato economico nel menu/scheda consultati. Verificate la scheda servizi e la coda post; non è un collaudo di ogni comando.
- Cliente: home, servizi, profili e Fidelity a 390 px senza overflow. Secondo cliente senza Fidelity: voce assente. Nuovo percorso verificato anche dopo ricarica.
- Profilo sito inventato registrato dal socio: cliente e anteprima mostrano indirizzo/fonte/data, senza modifica; apertura del report Siti web nel servizio. URL esterni non visitati. Console senza errori. Screenshot `.cache/riordino-browser/bigant-profili-cliente-desktop.png` e `bigant-profili-cliente-mobile.png`.
- Quattro nuove prove HTTP/UI su proiezione, isolamento, ruoli, sola lettura, collegamenti per servizio, routing ed escaping. Suite completa: 759 prove, 757 superate; due fixture aggiornate caricando il nuovo componente e verificando che le recensioni restino nei servizi. File interessati ricontrollati: 34/34 superate. Codice applicativo invariato dopo la suite. Controllo progetto 5/5, dipendenze invariate.

## Limiti

Questo giro verifica navigazione e proiezioni con dati inventati, non attiva sincronizzazioni. FUN-012/COL-002 restano parziali finché mancano i collegamenti reali. PRINC-01 resta parziale: non sono stati provati tutti i comandi e tutte le sottopagine, né gli accessi nominali sul server. I collaudi reali Fidelity/Growth, telefono fisico/Wallet e la prima copia giornaliera applicativa restano distinti.


## Sottopagine — verifica successiva del 10 ottobre

Riordinate tre aree che mostravano ancora sezioni complete affiancate o in sequenza:

- Scheda informativa: quattro card con nome e versione; ogni nota apre solo il proprio testo. Editor vincolato alla nota aperta, salvataggio e versioni conservati. Indietro torna prima all’indice delle note, poi alla scheda cliente.
- Fidelity, Regolamento e Wallet: indice con Regolamento/privacy, Google Wallet e Apple Wallet; una pagina per voce. Il collaboratore non accede a queste sottopagine. Nessun Wallet attivato.
- Fatturazione: anagrafiche divise tra Persone e aziende e Ditte BigAnt; Incassi per cliente ha una propria card, separata dal Tracker. Le informazioni restano quelle già disponibili, senza nuovi dati o movimenti.

Tre nuove prove UI su contenuti esclusi dalle altre sottopagine, ritorni, ruoli e contesto dell’editor. Le dieci regressioni delle schede cliente restano superate. **Suite completa 772/772**, zero errori e zero saltate, eseguita una volta sul blocco finale; prova locale `.cache/workspace-sections-full.log`.

Browser locale, dati inventati: apertura della nota, salvataggio versione 2, ritorno all’indice; regolamento e Google Wallet singoli; incassi cliente, ditte e persone separati. A 390 px non c’è overflow nelle pagine misurate; nessun errore console. Screenshot `.cache/riordino-browser/bigant-sottopagine-desktop.png` e `bigant-sottopagine-mobile.png`. Le API e i permessi server non sono cambiati.

PRINC-01 resta parziale nell’audit complessivo: questo è il collaudo delle sottopagine modificate, non la certificazione di ogni schermata o dell’uso autenticato sul server. Matrice92 invariata.

## Pagina operativa del servizio — completamento del riordino

Il percorso diretto `service:<id>` mostrava ancora metodo, sezioni, lavori, contenuti, approvazioni e fonti insieme. Ora mostra un indice a card e una sola sezione aperta. Sezioni, lavori e contenuti hanno un proprio elenco e un dettaglio singolo; il contenuto riporta versione, fonte e calendario interno. Indietro torna al proprio elenco e poi all’indice. I collegamenti conservano l’attività anche dopo una ricarica; percorsi inesistenti o dati caricati per un’altra attività non mostrano il contenuto precedente. Nessuna riapertura del menu Lavori e contenuti.

Prove automatiche sul codice finale: **894/894 superate**, zero saltate, e controllo progetto **5/5** (182 JavaScript, 103 documenti, 254 collegamenti). Quattro nuove prove coprono indice/dettagli separati, escaping, dati obsoleti, percorso, contesto e cambio dell’attività. Aggiornata la fixture storica con servizio/sezione correnti, ritorno al piano e verifica delle mancanze in ogni dettaglio di tutti i contratti. Prove mirate 30/30.

Cambio attività: il selettore chiude il dettaglio corrente e apre l’indice del servizio per la nuova attività; aggiorna anche il collegamento. Browser locale: da contenuto Bottega Aurora a Studio Orizzonte, poi ricarica; resta Studio Orizzonte, zero contenuti, nessun dato della precedente attività e zero errori console.

Browser locale, dati inventati: socio, indice Social, elenco e dettaglio contenuto; ricarica conserva Bottega Aurora, ritorni corretti, desktop e telefono a 390 px senza overflow. Console del socio senza errori. Screenshot in `.cache/riordino-browser/service-index-desktop.png`, `service-index-mobile.png`, `service-detail-desktop.png`, `service-detail-mobile.png`.

Permessi: il server conserva `/api/agency/*` riservato ai soci. Accesso diretto del collaboratore provato nel browser e rifiutato con 403; la proiezione collaboratore coperta dal test UI è solo difensiva, non un nuovo accesso operativo. La delega cliente al proprio report resta invariata e coperta dalle regressioni. Gli account nominali online attendono il salvataggio del proprietario. PRINC-01 rimane parziale per il giro completo delle altre pagine e dei ruoli reali.

Backup Railway delle 20:05, 801 MB, riconfermato via metadati prima del rilascio. Modifica solo interfaccia: nessuna migrazione o scrittura automatica ai dati.

Rilascio concluso: codice `4c04e8a`, deployment `c92ec2b8-0faf-486f-a7f8-376239048b74` SUCCESS. Health ok, `app.js` identico al codice verificato e API servizio anonima rifiutata con 401. Browser online con sessione socio: indice Social del solo BigAnt (cliente di prova), elenco e dettaglio del contenuto di collaudo già presente, versione 2, fonte inventata e nessuna data pianificata. Ricarica conserva attività e dettaglio; Indietro torna all’elenco. Schermo 390 px senza overflow, zero errori/avvisi console. Screenshot `.cache/riordino-browser/service-online.png` e `service-online-mobile.png`. Nessun nuovo contenuto o account creato; schede degli account nominali conservate per il titolare.
