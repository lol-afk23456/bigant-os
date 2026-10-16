# Growth — lettura manuale delle risposte Gmail

COL-005 / FUN-050. Procedura del 10 ottobre 2026, da verificare prima di qualsiasi attivazione reale.

## Ambito

Un socio chiede esplicitamente “Aggiorna risposte”. La lettura usa il consenso Gmail già verificato e riguarda solo conversazioni con un invio OS confermato, nella stessa attività, dalla medesima casella e verso l'indirizzo ancora assegnato al contatto. Non cerca nell'intera casella e non scarica allegati o risorse collegate nelle email.

La lettura resta possibile durante la pausa degli invii, per rilevare risposte e richieste di interruzione. Richiede comunque flag Gmail del server, OAuth valido, socio attivo e attività attiva. La revoca del collegamento blocca anche questa lettura. Nessun worker, pianificazione, analisi AI o risposta automatica viene attivato.

## Prima di conservare una risposta

1. Verificare l'intenzione persistente di invio, l'esito confermato e la casella; restringere la richiesta al thread selezionato.
2. Verificare nel thread l'invio OS originale: identificativi, mittente, destinatario, oggetto, Message-ID stabile e data Gmail. La soglia per le risposte usa l’ora dell’invio verificata da Gmail, non il successivo ritorno HTTP locale. Il semplice riferimento del thread non basta.
3. Accettare solo una risposta diretta dal contatto alla casella; rifiutare intestazioni ambigue o mancanti e date incoerenti. Email inviate, bozze e messaggi automatici non sono risposte commerciali.
4. Leggere solo parti testuali inline con limiti di dimensione e profondità. Non eseguire HTML, JavaScript, immagini, link o istruzioni contenute nel testo. Testo assente, incompleto o non interpretabile richiede controllo manuale in Gmail e blocca nuove bozze AI per il contatto. Le alternative MIME preferiscono il testo semplice; le parti distinte di un messaggio misto vengono conservate insieme.
5. Ricontrollare autorizzazioni e contesto dopo la rete e prima del salvataggio. Salvataggio della risposta, invalidazione delle approvazioni superate e interruzione dei contatti devono essere atomici.

## Effetti consentiti

- Conservare una sola copia per messaggio del fornitore, con data/fonte e impronta del contenuto. Un replay differente non sovrascrive la prova precedente. La provenienza conserva casella e mittente originali: cambio casella o destinatario blocca il riuso della risposta anche dopo un nuovo consenso.
- Una risposta annulla bozze e approvazioni superate del contatto. Un invio già partito resta soggetto alla riconciliazione prevista dalla SOP Gmail.
- Un rifiuto riconosciuto interrompe i contatti prima di qualsiasi AI. Un messaggio ambiguo resta da leggere: nessun consenso, interesse commerciale o cambiamento di fase è dedotto automaticamente.
- Preparare una risposta resta un'azione separata del socio, riferita all'ultima email; testo e destinatario richiedono approvazione sulla versione corrente prima dell'invio. Se arriva una nuova email durante la preparazione AI, la bozza superata non viene salvata.

## Limiti e prove

Massimo dieci conversazioni per richiesta, ordinate per ultima verifica per evitare che le stesse dieci escludano sempre le altre. Mostrare conteggi e problemi del lotto; un errore non può essere presentato come casella completamente aggiornata. Le risposte precedenti restano conservate. Le mail inviate manualmente da Gmail non vengono importate; alias e conversazioni con più destinatari richiedono verifica umana. Non esiste ancora un comando OS per dichiarare verificati i messaggi `needs_owner`: si gestiscono nella casella, senza aggirare il blocco AI. Il confronto degli indirizzi correla la conversazione, non certifica l’identità personale del mittente. Il riconoscimento dei rifiuti usa regole conservative, non comprende ogni possibile formulazione.

Fonti di protocollo: [lettura thread Gmail](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.threads/get), [messaggi e parti MIME](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages), [gestione conversazioni](https://developers.google.com/workspace/gmail/api/guides/threads). Queste API definiscono il formato; non provano il collegamento dell'account BigAnt.

Collaudo eseguito su trasporti finti, permessi, stessa casella/attività/contatto, ancora invio, header e MIME ostili, duplicati/replay, rifiuti, concorrenza, nuove risposte durante bozza/invio, revoca durante rete e UI desktop/mobile. Collaudo con account e messaggi reali solo dopo OK; mai dati reali nelle fixture o nel repository.

Prove registrate in [COLLAUDO-GROWTH-RIORDINO](COLLAUDO-GROWTH-RIORDINO.md): 78 test specifici e verifiche HTTP/UI locali. Nessuna lettura di Gmail reale.
