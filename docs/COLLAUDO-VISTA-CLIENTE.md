# Area cliente — prove del 10 ottobre 2026

Procedura: [SOP vista cliente](SOP-VISTA-CLIENTE.md). Ambito: decisioni UI-010, FUN-036…044 e COL-004 già confermate. Non è il giro definitivo di tutte le schermate con il proprietario.

## Comportamento verificato

Home a due card, servizi acquistati e documenti. Ogni servizio apre il proprio report, anche dall’anteprima del socio. Le sezioni rimosse non tornano seguendo i vecchi indirizzi. Contratti propri, PDF con verifica del cliente, nessuna fattura o informazione economica nella risposta cliente.

Bozze non approvate, task, memoria, fonti interne, feedback e trascrizioni non arrivano più attraverso overview, produzione o vecchi spazi dei servizi. Le approvazioni rimangono al team autorizzato. Ogni richiesta rilegge utente, ruolo, sessione, attività e servizio corrente. Growth resta interno e non abilita Fidelity o Email marketing.

I report usano valori mancanti espliciti, non conteggi di bozze presentati come risultati. Google mostra soltanto la cache attivata, non il collaudo del socio; fonte, data, periodo e limite delle recensioni restano visibili. Alla scadenza i dati scompaiono subito, anche mentre un nuovo caricamento resta pendente. Gli indicatori non coperti dalla cache rimangono da collegare. Fidelity riporta solo conteggi dell’attività e data della lettura, senza anagrafiche.

## Difetti trovati e corretti

- Accessi precedenti potevano consegnare bozze e memoria interne al cliente: proiezioni minime e rifiuto delle operazioni non autorizzate.
- La vecchia dashboard poteva associare conteggi Fidelity a Growth: prodotto e servizio ora distinti.
- Primo login senza sezione inizializzata: ora apre la home; cambio profilo azzera sezione, servizio e indirizzo precedente. Stessa inizializzazione per email/password.
- La prima versione nascondeva interi gruppi di indicatori appena presente Google: conservati quelli ancora privi di fonte.
- Il rinnovo della cache poteva lasciare dati scaduti a schermo senza rete: rimozione prima della nuova lettura.
- Due contratti diversi con la stessa scadenza venivano deduplicati: conservati entrambi nei documenti e negli avvisi. Nessuna modifica ai movimenti o ai contratti registrati.

## Prove automatiche

**22 nuove prove, suite completa 725/725**, nessuna saltata. Otto prove del nuovo modulo, sei sui confini API, sette UI e una sui contratti con uguale scadenza. Aggiornate le aspettative precedenti che richiedevano sezioni ormai rimosse; lo scenario a 13 passaggi verifica ora che l’upsell rimanga interno. Log `.cache/client-area-full.log`. Controllo progetto **5/5**: 150 file JavaScript, 86 documenti, 190 collegamenti locali e dipendenze fissate; log `.cache/client-area-check.log`.

Revisione indipendente su confini, modulo, UI e criteri della matrice. I rilievi relativi a KPI, scadenza della cache e contratti sono stati corretti e coperti da regressioni. Tutte le fixture sono inventate; letture senza scritture o chiamate a fornitori. La cache Google attiva è provata con dati simulati nei test, senza account reale.

## Browser

Anteprima in memoria, senza worker o credenziali esterne. Cliente Aurora: login, home, elenco servizi, report social e Fidelity, contratto e ritorno. Cliente Orizzonte: servizi diversi, Fidelity assente; voce I tuoi servizi coerente con le card. Socio: stessa attività, stessi servizi e report, anteprima dichiarata in sola lettura. Collaboratore: home e approvazioni social disponibili, nessuna vista cliente o economia.

Finestra app, desktop esplicito 1280×800 e telefono 390×844: home, servizi, documenti e report Google privo di fonte. Larghezza del documento 390 px, senza overflow della pagina; la tabella contratti scorre nel proprio contenitore. Errore iniziale di login riprodotto e corretto; passaggio finale senza errori console osservati.

Immagini nella cache tecnica del progetto: `.cache/riordino-browser/bigant-client-before.png`, `bigant-client-after.png` (finestra app), `bigant-client-desktop.png` (1280×800), `bigant-client-mobile.png`. Processi locali terminati, tab chiuse e viewport ripristinata.

## Limiti e copertura

Matrice aggiornata a **68 implementate in locale, 16 parziali, 8 da fare**. Questi stati non attestano rilascio o collaudo sul server, né completamento del brief esteso o T0–T10. UI-010, COL-004 e FUN-037/038/039/041/042/043 soddisfano il criterio locale; COL-004 riguarda la dismissione attuale, non un collegamento PED.

FUN-036 resta parziale: contenitore corretto, report di tutte le fonti ancora incompleti. FUN-040 resta parziale: Email marketing autonomo e gestione contatti assenti. FUN-044 resta parziale: Fidelity mostra archivio e data ma non un collegamento alla fonte originale. FUN-035 resta in attesa del completamento della vista amministrativa dei risultati. Servizi Ads non ancora distinti in prodotti autonomi Google/Meta, dati e collegamenti reali ancora da verificare.

Nessuna nuova dipendenza, spesa applicativa, lettura di clienti reali, collegamento di account, push o deploy. T1–T10 non avviate. Il lavoro successivo continua dalle voci aperte della matrice.

## 10 ottobre — Fonte dei conteggi Fidelity (FUN-044)

Il report Fidelity consente ora di aprire la sua fonte interna. La lettura mostra conteggi per programma e totale, data della consultazione e criterio del calcolo; usa la medesima proiezione sia per il cliente sia nell’anteprima del socio. «Iscrizioni attive» conta tessere, non persone uniche: due programmi della stessa attività possono avere la stessa persona. Programmi sospesi inclusi, tessere eliminate escluse; nessun contatto, token o dato di altre attività esposto.

La nuova API di sola lettura `/api/cliente/services/fidelity/source` rilegge ruolo, sessione, attività e acquisto Fidelity. Cliente altrui, collaboratore, sessione revocata e servizio rimosso sono respinti. Il dettaglio non chiama fornitori e non scrive dati. In interfaccia le risposte tardive non riaprono finestre né cambiano cliente. Quattro prove aggiunte per riconciliazione, riservatezza, HTTP e interfaccia.

Browser con login cliente DEMO: I tuoi servizi → Fidelity → Apri la fonte, totale riconciliato con i programmi. Desktop e 390 px, documento 390 px e finestra 356 px, zero errori console. Immagini nella cache `riordino-browser/fonte-fidelity-desktop.png` e `fonte-fidelity-mobile.png`. È una consultazione dell’archivio OS; non un collegamento alla vecchia app Fidelity né una prova del Wallet. Le fonti esterne mancanti lasciano FUN-044 parziale.

Verifica del blocco: **818/818** test, zero saltati; controllo progetto **5/5**. Dopo la sola correzione della tabella mobile: 11/11 prove UI pertinenti e browser confermano larghezza visibile/contenuto 314/314 px. Log `.cache/fidelity-source-full-suite.log`, `fidelity-source-ui-final.log` e `fidelity-source-check.log`.

Pubblicato `b6540a7`, Railway `6231fd20-46ef-412e-8a1f-f84f6498af7e` SUCCESS, backup precedente `91a0b9ed-420c-4b65-bf20-b91d22d0edb6` (19:43, 801 MB). Alle 19:45 health/file verificati e nuova API anonima 401. Alle 19:46 browser socio sul cliente di prova: dettaglio fonte aperto, totale 0 distinto dall’agenzia, nessun contatto e nessun errore console. Durante il cambio attività, un clic anticipato è stato respinto dal controllo della pagina corrente; completato il caricamento, il dettaglio corretto si è aperto. `.cache/fidelity-source-release-verification.json`, immagine `riordino-browser/fonte-fidelity-online.png`. Login cliente reale ancora rinviato.

## Riordino dei report per servizio — 10 ottobre, dopo Meta

Ogni servizio ora si apre su una griglia di schede. Facebook, Instagram, risultati Google, recensioni Google, report verificati, indicatori del catalogo e contatti Email marketing si aprono separatamente. Il dettaglio contiene un solo report; Indietro torna al servizio, poi all’elenco dei servizi. Si riusa il componente delle card, senza nuove voci nel menu.

L’indirizzo della sottosezione carica soltanto l’API del servizio: un ID di report non diventa un percorso o una fonte arbitraria. Il dettaglio deve esistere nella proiezione corrente e corrispondere al cliente e al servizio selezionati. Cambio servizio/cliente, report rimosso e scadenza delle copie non mostrano un altro report come ripiego. L’anteprima socio usa la stessa navigazione; i comandi di gestione dei contatti conservano i permessi precedenti.

Cinque nuovi test coprono schede/dettagli separati, Google risultati/recensioni, percorso malformato o servizio diverso, API del servizio e Email marketing. Aggiornati i controlli delle schermate precedenti; la prima suite ha segnalato soltanto due aspettative rimaste sul vecchio layout, poi corrette e superate nelle 13 prove pertinenti.

Browser locale con dati inventati: servizio Social → schede Facebook/Instagram/indicatori → dettaglio Instagram da solo → ricaricamento dell’indirizzo → Indietro. A 390 px: nessuno scorrimento orizzontale (390/390). Cambiando attività sul dettaglio, appare Report non disponibile e il contenuto precedente sparisce. Zero errori console. Schermate tecniche: `report-cards-desktop.png`, `report-cards-mobile.png`, `report-detail-mobile.png`.

Questo completa il riordino locale dei report nei servizi; non dimostra l’intero PRINC-01 per tutte le schermate/ruoli reali e non completa le fonti ancora scollegate.

Verifica finale di questo blocco: **851/851**, zero saltate. Controllo progetto **5/5**: 177 JavaScript, 103 documenti, 246 link.
