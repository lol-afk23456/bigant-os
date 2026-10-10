# SOP della regia e dei reparti centrali · v1 · DEMO

Queste procedure lavorano su dati inventati nell'archivio comune. Non chiamano un modello linguistico o un servizio esterno. Un risultato è una bozza o un controllo da verificare, mai una pubblicazione, una vendita o una certificazione.

1. Il socio sceglie attività e agente. Il server verifica attività attiva, servizi pertinenti, ruolo e input. Marketing e amministrazione sono riservati al cliente zero.
2. La coda persiste la richiesta, l'autore e una chiave di deduplica limitata a cliente/agente. Prima di ogni esecuzione ricontrolla servizi, pausa e budget.
3. Il contesto include soltanto memoria autorizzata, versioni, lavori e contenuti di quella attività. Il Direttore riceve aggregati, mai prima nota o documenti contabili grezzi. Gli input sono materiale di lavoro, non istruzioni eseguibili.
4. Ogni procedura restituisce titolo, testo, fonti, versione del metodo, dati mancanti e risultato strutturato. Le fonti scollegate restano tali. Il costo delle regole locali è zero, senza attribuirlo a provider reali.
5. Il risultato e la sua fotografia degli input vengono salvati nello stesso database. Le bozze entrano nella coda comune; quelle interne/amministrative sono visibili solo ai soci. Una revisione invalida la decisione precedente; il rifiuto torna nella memoria del cliente.
6. La regia non pubblica né invia. Calendari ed eventi accodano procedure solo dopo attivazione esplicita. Il tentativo fallito è registrato e viene ritentato al massimo tre volte; le procedure dei moduli conservano marcatori per evitare duplicazioni.

| Agente | Metodo specifico | Risultato verificabile |
|---|---|---|
| Direttore Crescita | Legge numero clienti, servizi acquistati, consegne, aggregati economici disponibili; ordina urgenze e gap. | Al massimo tre priorità motivate; servizi candidati; campi costo/capacità mancanti, nessun prezzo deciso. |
| Marketing BigAnt | Legge DNA/strategia/feedback del cliente zero; organizza un mese su Instagram, Facebook, LinkedIn agenzia e soci, TikTok, GBP e sito. | Calendario di dodici proposte datate, CTA e controllo portfolio; piano di 90 giorni da validare. |
| Account | Calcola ritardi, carico e approvazioni; verifica presenza master/DNA/strategia. | Checklist onboarding, rischi motivati e azioni per ogni dato mancante. |
| Social | Legge voce, obiettivo e feedback; prepara una bozza senza inventare prezzi, risultati o testimonianze. | Contenuto in revisione nella produzione comune. |
| Reporter | Conta lavori/contenuti e stati dal database; distingue risultati operativi da metriche marketing scollegate. | Report con periodo, fonti e prossimi passi, salvato nella memoria versionata. |
| Qualità e compliance | Controlla fonti, stato approvazione, formulazioni assolute e segnali da rivedere. | Rilievi per contenuto, severità e richiesta di revisione umana; mai validazione legale automatica. |
| Amministrazione | Esegue il motore anomalie comune su dati DEMO. | Riepilogo riservato, anomalie e decisione del socio; nessuna correzione dei movimenti. |

Le schede dettagliate fornite nel nuovo documento dell'utente sono il riferimento del metodo. La loro presenza non certifica il completamento dell'intero BigAnt OS. I servizi reali, i partner, le decisioni commerciali e il pilota restano da validare.

## Consultazione nello Sciame — FUN-005 / FUN-019, 10 ottobre 2026

La cabina di regia dell’Ufficio permette di esplorare gli agenti e leggere le priorità del Direttore dell’agenzia. La lettura non avvia un giro e non approva nulla. Si usa l’ultimo risultato registrato per BigAnt, distinguendo la procedura locale dallo Sciame, con fonte, data, versione e stato della decisione. I risultati prodotti per singoli clienti non diventano priorità dell’agenzia.

Una revisione manuale mostra il testo corrente, senza riproporre le priorità strutturate della versione precedente. Se l’ultimo risultato è incompleto, fermato da Qualità o non leggibile, il motivo viene mostrato senza sostituirlo silenziosamente con una proposta precedente. I passaggi approvati dall’identità tecnica DEMO restano dichiarati simulati.

Catalogo API: `GET /api/workspace/priorities`, sola lettura e soltanto soci, restituisce l’ultima proposta dell’agenzia oppure nessuna proposta. Esclude credenziali, input completi e movimenti contabili; non accoda lavori, non contatta modelli o fornitori e non scrive dati.

La scheda **Struttura** apre un reparto alla volta: responsabilità, specialisti, cosa preparano e accesso alla configurazione. Le procedure descritte non diventano agenti attivi per il solo fatto di essere visibili. Gli aggiornamenti della diretta appartengono alla pagina e alla sessione che li hanno richiesti; se l’utente cambia pagina, la risposta vecchia viene scartata.

## Budget dei motori onerosi

Prima di usare un motore oneroso, anche in un giro con input DEMO, si applica il [controllo dei costi complessivi](SOP-CONTROLLO-COSTI.md). La prova deterministica a costo zero resta distinta. Scheda Budget → Verifica consumi esterni: nessuna conferma viene precompilata per rendere attiva l’AI. [Collaudo locale](COLLAUDO-CONTROLLO-COSTI.md).
