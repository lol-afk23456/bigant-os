# Schede cliente — collaudo del 10 ottobre 2026

## Correzioni verificate

- Un modulo aperto resta associato al cliente, alla pagina, alla sessione e alla versione iniziali. Se cambiano, il salvataggio viene fermato; non usa più il cliente selezionato al momento dell’invio.
- Una risposta ritardata dell’archivio Accessi non mostra credenziali dopo navigazione, cambio sessione o apertura di un’altra finestra. Tra due richieste vale soltanto l’ultima ancora pertinente.
- L’uscita nasconde subito i dati, invalida le richieste pendenti e blocca nuove aperture. Se il server non conferma l’uscita, compare una pagina pubblica che invita a riprovare; i dati privati non vengono ripristinati.
- Protetti anche doppio invio, PDF letto in ritardo, permessi dell’editor e versioni di memoria/avvio. Restano i controlli server già presenti.

## Prove

Due regressioni riprodotte prima della correzione; dieci prove mirate ora superate in `tests/client-record-ui.test.js`. Revisione indipendente limitata al blocco: rilevata e corretta anche la possibilità di una nuova apertura durante l’uscita pendente; nessun problema residuo nel ricontrollo.

**Suite completa 769/769, zero errori e zero saltate**, eseguita una volta sul blocco finale; controllo progetto **5/5** (161 JavaScript, 95 documenti, 219 collegamenti locali). Evidenza locale `.cache/client-record-full.log`. Nessuna nuova dipendenza.

Browser locale con archivio in memoria e soli dati inventati: aggiornamento anagrafica, nota versionata, avvio cliente e ritorno alla pagina di accesso riusciti. Nessun errore console osservato. Immagine `.cache/riordino-browser/bigant-collaudo-scheda.png`. Le risposte ritardate, le credenziali e il PDF sono verificati nelle prove automatiche, senza inserire password reali nel browser.

## Limiti

Il controllo FUN-007 ha confermato nel codice le destinazioni di anagrafiche, contratti, accessi e contabilità; non chiude Trello, fonti contabili reali o il collaudo autenticato online. FUN-007 e PRINC-01 restano parziali. Nessuna modifica a database di produzione, collegamenti, account o fornitori.

Matrice92 invariata: 72 implementate in locale, 14 parziali, 6 da fare. Rilascio e backup nel [registro](RILASCIO-2026-10-10.md).
