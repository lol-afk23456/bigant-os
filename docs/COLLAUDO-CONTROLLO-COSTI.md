# Controllo complessivo dei costi — collaudo locale

10 ottobre 2026. Rafforzamento FUN-056 e requisito stop 80% del prompt T0–T10. [Procedura](SOP-CONTROLLO-COSTI.md), [costi reali ancora da verificare](COSTI.md).

## Comportamento verificato

- Il totale esterno parte **non verificato**, mai da zero. Un socio dichiara costi e impegni del mese non già presenti nel contatore OS, inclusi almeno 20 € Railway. La conferma non collega account né abilita agenti.
- Conferme mensili immutabili e versionate: data, socio, importo e Registro. Nuovo mese Europe/Rome, ruolo revocato o cambio password obbligatorio rendono la verifica inutilizzabile per nuove spese.
- Prenotazione atomica comune a Growth e Sciame; somme in centesimi. Rifiuto se la chiamata raggiunge l’80% del tetto (40 € su 50 €). Le quote interne precedenti possono restringere ulteriormente il margine.
- Prenotazioni di mesi precedenti ancora aperte restano nel totale. Una prenotazione contabilizzata non viene contata due volte.
- Nuovo controllo subito prima del trasporto: modifica della verifica durante un’attesa impedisce la richiesta e rilascia la prenotazione non usata. Timeout dopo l’avvio conserva la stima. Il motore Anthropic non ritenta automaticamente la chiamata.
- Stato e conferma del budget riservati ai soci anche tramite API. Nessuna scrittura o chiamata esterna leggendo lo stato. Prove locali gratuite ancora possibili.

## Evidenze automatiche

**17 nuove prove**, tutte con dati inventati: 13 in `tests/cost-control.test.js` e 4 in `tests/swarm-workspace-ui.test.js`. Coprono stato ignoto, zero gratuito, soglia esatta/centesimo, concorrenza tra moduli, conferme immutabili e riapertura, cambio mese a Roma, importi invalidi, eccedenze, identità/sessioni, tetti inferiori, HTTP/CSRF, variazione prima del trasporto, timeout, motore Sciame, caricamento SDK, conferma UI e risposte obsolete.

Fixture precedenti dei fornitori aggiornate per dichiarare esplicitamente un budget inventato. Nessuna conferma viene inserita all’avvio dell’app. Le prove storiche Sciame continuano a verificare il costo restituito dal motore; il test dell’output non valido è stato rinominato perché il costo già sostenuto resta contabilizzato.

**Suite completa: 669/669**, zero fallimenti, cancellazioni o test saltati. Log `.cache/cost-control-full.log`. Controllo progetto **5/5**: 139 JavaScript, 80 documenti e 171 link locali; 24 schede playbook identiche, 4 dipendenze fissate, prova offline in memoria. Il primo passaggio ha individuato due fixture di motori onerosi senza verifica mensile: aggiornate le sole fixture, mantenuto il blocco applicativo. Un’esecuzione mirata senza permesso socket ha fallito il test HTTP locale; la suite finale con loopback autorizzato lo supera.

## Browser

Anteprima isolata in memoria, nessuna chiave e nessuna connessione esterna:

1. Socio DEMO → Sciame → Budget: totale non verificato e margine zero.
2. Modulo: importo inventato 20 € senza casella → rifiuto; con conferma → totale 20 € e margine limitato dalle quote interne.
3. Nuova verifica inventata 40 € → **Spese bloccate**, margine zero. Tornando alla scheda il dato resta salvato.
4. Desktop 1280×900: larghezza contenuto 1280, nessun overflow orizzontale. Mobile390×844: contenuto390, dialogo356, checkbox inizialmente vuota, annullamento riuscito. Nessun errore console osservato.

Prove nella cache del progetto: `.cache/riordino-browser/bigant-budget-desktop.png` e `bigant-budget-mobile.png`. I 40 € visibili sono **inventati**, non il consumo dell’account. Anteprima e tab terminate, viewport ripristinata.

## Limiti e stato

Questo è un controllo sulle registrazioni OS e sulla dichiarazione del socio. Non legge automaticamente fatture o pannelli, non verifica listini, imposte o cambio e non osserva acquisti fatti fuori dall’app. Costi effettivi del mese ancora ignoti; nessuna API a pagamento autorizzata o chiamata in questa sessione. Resta necessario verificare stime/limiti dei fornitori prima dell’attivazione.

Nessun nuovo pacchetto, importazione reale, push o deploy. La revisione indipendente tentata non è stata eseguita: il subagente ha segnalato il limite d’uso dell’account; non è attestata come completata. Codice e prove sono stati rivisti dall’agente principale.

Le 92 voci mantengono **60 implementate in locale, 14 parziali, 18 da fare**. FUN-056 era già locale e riceve queste prove aggiuntive. FUN-053/FUN-055 restano parziali: questo prerequisito economico non equivale a un motore Sciame pronto sui dati reali. T0–T10 e collaudi server restano aperti.
