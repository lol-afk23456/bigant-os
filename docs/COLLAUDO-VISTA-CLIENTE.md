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
