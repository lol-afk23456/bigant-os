# Prova tecnica di un agente AI

FUN-053, preparazione al lavoro reale. La prova tecnica verifica la risposta del fornitore alle istruzioni salvate e al contratto JSON dell’agente. **Non certifica la qualità del servizio o l’uso di dati reali e non attiva l’agente.** Il collaudo del percorso operativo resta separato.

1. Un socio prepara compito, istruzioni, fonti, controllo qualità, fornitore e stima; salva una versione. Le chiavi si custodiscono soltanto in Collegamenti. Anthropic e OpenAI sono predisposti; nessuna preferenza implica attivazione.
2. Il server deve autorizzare espressamente le prove AI con `BIGANT_SCIAME_AI_TRIALS_ENABLED=true` in modalità reale. Default spento. Verifica mensile del [budget](SOP-CONTROLLO-COSTI.md) obbligatoria; prova singola, nessun tentativo automatico.
3. Il socio legge cosa verrà trasmesso e conferma: istruzioni salvate più una scheda **inventata e riconoscibile**, senza memoria, credenziali, contabilità, email o dati GBP dei clienti. Nessuno strumento eseguibile dal modello.
4. La prova prende la versione della configurazione e del collegamento. Controlli su persona, sessione, pausa, flag, versioni e budget precedono il trasporto. Ripetere lo stesso identificativo non provoca una seconda chiamata; un’altra prova simultanea dello stesso agente è rifiutata.
5. Risposta validata sullo schema dell’agente, dimensione limitata, sintesi non vuota. Esito, risultato, versioni, data e stima restano nello storico dei soci. Errori generici senza chiavi; timeout già partiti conservano la stima. Un processo interrotto non ripete automaticamente il lavoro.
6. Cambio istruzioni/configurazione/chiavi o revoca del socio rende la prova superata; lo storico rimane. La schermata dichiara il limite tecnico della prova e conserva lo stato Base finché manca il percorso reale collaudato. Pubblicazione, email e pianificazione restano soggette alle proprie autorizzazioni.

Disponibili soltanto gli agenti con schema AI esistente; gli altri conservano la procedura locale e indicano la mancanza. Non inventare un contratto generico per dichiarare tutti i 32 pronti.

Prima attivazione reale: verificare costo del modello, limiti del fornitore, chiavi e trasferimento delle istruzioni; richiedere OK del proprietario. Le verifiche di sviluppo impiegano trasporti finti e budget inventati.

Fonti tecniche consultate il 10 ottobre 2026: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Anthropic Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs). Destinazioni API fisse, nessuno strumento esterno, nessun retry. La compatibilità del modello scelto e il suo prezzo vanno verificati prima del primo utilizzo reale.

Le stime in centesimi non sono misure del prezzo fatturato: riconciliare con il fornitore. Restano anche i limiti interni delle quote dell’OS, oltre allo stop complessivo. [Prove locali e limiti](COLLAUDO-AGENTI-AI.md).
