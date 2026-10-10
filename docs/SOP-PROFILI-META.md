# Procedura — lettura dei profili Meta

Stato: predisposizione tecnica, nessun account reale attivato. Il collegamento di un indirizzo pubblico non autorizza l’account.

1. Un socio configura nei Collegamenti un token **utente Facebook** custodito nel vault. Questo passaggio non esegue letture e non costituisce un flusso OAuth completo.
2. Il server deve avere `BIGANT_META_PROFILES_ENABLED=true`. In produzione resta disabilitato fino al collaudo e all’autorizzazione specifica.
3. Per un cliente con Social attivo, il socio chiede esplicitamente l’elenco delle pagine autorizzate, seleziona quella corretta e conferma l’abbinamento. Una pagina può appartenere a un solo cliente nell’OS. Facebook e Instagram si selezionano separatamente; Instagram deve essere professionale e collegato alla pagina restituita da Meta.
4. Il socio esegue una prova e confronta nome, pagina e metriche con Meta. Solo il socio vede questa prova. I risultati riguardano 28 giorni terminanti tre giorni prima della lettura, per ridurre l’effetto dei ritardi del fornitore.
5. Un consenso distinto abilita i dati nell’area cliente. L’aggiornamento giornaliero è facoltativo e inizialmente spento. Non si pubblica, non si modificano profili, non si leggono messaggi né si gestiscono inserzioni.
6. Pausa, revoca di un socio coinvolto, cambio credenziali/configurazione, servizio rimosso o errori invalidano la copia mostrata. Disconnessione locale libera l’abbinamento; non revoca il token presso Meta.

I dati restano solo in memoria per massimo 24 ore dall’inizio della lettura. Date e identificativi di configurazione restano nel registro; niente contenuti o token nei log. Dopo riavvio o scadenza si mostra «dati non disponibili», mai una copia storica come aggiornata. Ogni lettura fallita cancella la copia precedente. Le letture manuali hanno almeno un minuto di distanza; quelle automatiche massimo una ogni 24 ore per cliente, senza tentativi ravvicinati dopo un errore.

Metriche mancanti restano mancanti: non sono zero. La copertura giornaliera non viene sommata per ricavare persone uniche nel periodo. Facebook espone serie giornaliere; Instagram totali del periodo. I follower del profilo sono una fotografia al momento della lettura, non una variazione storica. La crescita Instagram resta non disponibile nella prima versione.

Fonti ufficiali verificate il 10 ottobre 2026: [Instagram User Insights](https://developers.facebook.com/documentation/instagram-platform/api-reference/instagram-user/insights), [Page Insights v26](https://developers.facebook.com/docs/graph-api/reference/v26.0/insights), [Page](https://developers.facebook.com/docs/graph-api/reference/page). API fissata a v26.0. Permessi di lettura verificati prima delle richieste; nessun permesso di scrittura richiesto. Il percorso Instagram con ruoli tramite Business Manager può richiedere ulteriori permessi pubblicitari: è da verificare separatamente, senza concederli automaticamente. OAuth completo, approvazione dell’app Meta e confronto su account reali restano requisiti di attivazione.
