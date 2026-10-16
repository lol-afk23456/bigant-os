# Agente Qualità — prove del percorso manuale

10 ottobre 2026 · FUN-053. [Procedura](SOP-AGENTE-QUALITA.md). Implementazione del secondo percorso manuale, dopo Social; nessuna attivazione di agenti o fornitori reali durante lo sviluppo.

## Comportamento

Il socio sceglie una bozza social della propria attività. L'anteprima comprende titolo, testo, fonte e versione, insieme alle sole memorie autorizzate e alla stima. Un'autorizzazione e una prova tecnica specifiche dell'agente precedono il consenso per ogni singolo incarico. Il risultato conserva rilievi e versione; soci e collaboratori assegnati lo leggono dalla bozza e nella decisione di approvazione. Una modifica della bozza o delle fonti rende il parere superato. Il controllo non cambia testo, stato, data o decisione umana.

Il motore automatico esamina la bozza originale: le frasi problematiche citate dal revisore non sono scambiate per promesse contenute nella bozza. Un problema automatico prevale su un parere AI positivo. Il registro distingue la revisione dalla preparazione di nuovi contenuti.

## Evidenza

- **804/804 test**, zero saltati; controllo progetto **5/5** (169 JavaScript, 99 documenti, 235 link). Tredici prove nuove, inclusi i due trasporti simulati OpenAI e Anthropic. Suite finale e controllo nella cache ignorata `quality-full-suite.log` e `quality-check.log`.
- Contratto e coerenza della risposta, isolamento dei clienti, servizio attivo, ruoli/CSRF, consenso esatto, prenotazione dei costi, replay senza nuova chiamata, concorrenza, revoca, errori e mancato retry. Nessuna bozza o approvazione viene creata o modificata dal controllo.
- Contenuto modificato prima/durante la chiamata: rifiuto; fonti modificate, aggiunte o rese amministrative dopo il risultato: parere superato. Risultato storico conservato; il collaboratore non riceve istruzioni private, pacchetto o costi.
- Interfaccia: scelta limitata alle bozze della stessa attività, testo e versione visibili prima del consenso, escaping dei dati, risposte tardive ignorate dopo cambio pagina/sessione.
- Browser locale con fornitore simulato: selezione del Laboratorio Arancio DEMO, anteprima, esecuzione, rilievi, apertura della bozza ancora DA APPROVARE e rilievi nella decisione umana. A 390 px documento largo 390 px, finestra senza overflow orizzontale; console senza errori o avvisi. Immagini nella cache ignorata `riordino-browser/qualita-desktop.png` e `riordino-browser/qualita-mobile.png`.
- Revisione indipendente in sola lettura: corretto e riverificato il confronto delle fonti dopo il risultato. La suite ha inoltre individuato e verificato la correzione del collegamento all'Ufficio per i risultati senza nuova richiesta di approvazione.

## Limiti

Le risposte, le chiavi di prova e gli importi del browser sono inventati. La stima resta da riconciliare, non attesta un prezzo del modello. Primo uso reale e attivazione richiedono chiavi, consumi verificati e consenso al trasferimento. Social rimane il primo agente da attivare; Qualità segue singolarmente. Pianificazioni, altri agenti e pubblicazione reale restano aperti. FUN-053 resta parziale e T4 non è dichiarata completata.

Rilascio e verifiche sul server sono riportati nel [registro](RILASCIO-2026-10-10.md); la pubblicazione del codice non attiva il fornitore.

## Verifica della pubblicazione

Codice `ad5dc36`, deployment Railway `730e7fa0-ed2b-4fcd-8a78-200e8aed1746` SUCCESS. Health e file app/workspace verificati alle 19:17; nuove API protette con risposta anonima 401. Browser socio: scheda Qualità presente, stato Base, messaggio «Il percorso operativo AI è spento sul server»; console senza errori. La schermata non offre l'avvio di un incarico reale. Prova nella cache ignorata `riordino-browser/qualita-online.png`. Nessuna variabile, chiave o autorizzazione operativa modificata.
