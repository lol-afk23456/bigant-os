# SOP — agenti collegati a Growth e Fidelity

Versione 1 · DEMO offline. Questa procedura precede il relativo adapter.

## Perimetro comune

1. Accettare un job OS con cliente, agente e input. Ricontrollare l'identità attiva del socio, il cliente attivo e il servizio acquistato anche alla ripresa. Non accettare ID appartenenti ad altri clienti.
2. Leggere soltanto i record del workspace selezionato. Rispettare la pausa centrale e Growth: l'agente non cambia impostazioni o consensi. In mancanza di prerequisiti produrre un esito `needs_input`, con il motivo, senza inventare dati.
3. Usare gli handler del modulo sul database comune e i soli provider deterministici DEMO. Non eseguire `tick`, invii, sincronizzazioni, prenotazioni o operazioni Wallet.
4. Salvare scelta e risultato per ID del job. Riavvio e retry recuperano gli stessi record; un input diverso sullo stesso ID viene rifiutato. Per la finestra tra creazione e salvataggio risultato, messaggi e campagne portano un riferimento DEMO stabile derivato dal job.
5. Restituire titolo, esito, corpo, fonti e collegamenti ai record, modalità DEMO, costo zero e visibilità interna. Il nucleo OS conserva risultato, registro e revisione dell'output. Le approvazioni commerciali e Fidelity rimangono quelle dei moduli.

## Ricerca commerciale

Input: query facoltativa. Leggere le impostazioni di ricerca del workspace; se attivo interrogare il provider di fixture, salvare il lotto, passarlo all'handler Growth ricerca con deduplica del dominio. Analizzare tramite lo stesso motore ogni risultato locale. Non creare email o autorizzazioni di contatto. Riutilizzare i record già presenti. Non eseguire altri job della coda.

Output: ID delle aziende aggiunte/riutilizzate, analisi salvate, punteggi e fonti dichiaratamente inventate. I job di analisi corrispondenti già eseguiti sono completati; non si lanciano altri lavori.

## Analista commerciale

Input: `leadId`, facoltativo; in sua assenza scegliere un lead del workspace con sito DEMO. Usare l'handler Growth analisi, salvare analisi e punteggio sul lead. Nessun confronto con aziende reali, nessuna invenzione di metriche osservate. L'adapter disabilita solo la concatenazione di nuovi draft nella propria vista del motore: non cambia le impostazioni persistenti.

## Commerciale

Input: `leadId`, `kind` (`initial`, `reply`, `followup`), `incomingId` per risposta. Senza ID scegliere solo un record già idoneo. Applicare prima il cancello di contatto originale: consenso documentato, nessuna soppressione, trattativa aperta; una semplice richiesta consente soltanto una risposta pertinente. Se manca il consenso, produrre la lista dei prerequisiti senza bozza.

Creare la bozza mediante l'handler Growth e la sua approvazione comune. Se esiste già un messaggio da gestire, restituirlo senza modificarlo. Prezzi/contratti e rifiuti seguono il ramo originale di intervento umano o soppressione. Non approvare o inviare, neppure nel simulatore.

## Fidelity

Input: `campaignId` oppure `programId` facoltativi. Scegliere solo programmi attivi del cliente. Preparare una campagna DEMO con il normale endpoint del modulo, includendo soltanto gli iscritti con consenso marketing già registrato. Conservare gli stati dei provider bloccati e richiedere la decisione umana nella coda OS.

Se mancano un programma attivo o destinatari idonei, restituire un controllo con `needs_input`; non iscrivere persone, concedere consensi o creare premi. Una campagna già preparata viene soltanto riletta. Non chiamare invii né automazioni generali.

## Accettazione

I test devono provare i quattro flussi sul database reale temporaneo, l'approvazione comune, la pausa invariata, il rispetto dei consensi, la revoca del servizio, il rifiuto degli ID altrui e il retry dopo una creazione già avvenuta. La rete è sostituita da una funzione che fallisce se chiamata; le tabelle posta/calendario restano vuote e nessuna consegna Fidelity ha `sent_at`.
