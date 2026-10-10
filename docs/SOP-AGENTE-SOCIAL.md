# Agente social — percorso operativo manuale

FUN-053 e FUN-048. Preparare il servizio S01 senza attivare account o agenti durante lo sviluppo. Questa SOP riguarda il primo percorso operativo AI; gli altri agenti restano Base finché manca il proprio percorso.

1. Configurazione salvata e prova tecnica corrente del singolo agente. Il socio legge il risultato e autorizza esplicitamente l’agente sulla stessa configurazione, collegamento e prova. Il server deve avere `BIGANT_SCIAME_AI_ENABLED=true` in modalità reale; default spento. L’autorizzazione non avvia lavori e non abilita pianificazioni.
2. Prima di ogni elaborazione il socio sceglie l’attività, scrive un incarico e legge l’anteprima del pacchetto. Il servizio social deve essere attivo. Il server include solo nome dell’attività e memoria non amministrativa: master, DNA, strategia, feedback generale/social. Ogni voce ha fonte e versione; serve almeno un brief o DNA. Nessun accesso a credenziali, contabilità, email, cartelle, altri clienti o account social.
3. Consenso per singola elaborazione: pacchetto esatto, istruzioni, fornitore e stima. Cambio configurazione, collegamento, autorizzazione, attività o memoria richiede una nuova anteprima. Permessi, sessione, servizio, pausa e budget sono ricontrollati prima del trasporto e del salvataggio.
4. Identificativo unico e una elaborazione per agente/attività alla volta. Prenotazione sul budget comune, nessun retry automatico. Timeout o riavvio dopo possibile chiamata conservano la stima; il registro permette di verificare l’accaduto senza reinviare.
5. Schema social verificato, da una a dieci bozze con titolo e testo. Controlli automatici esistenti per promesse e azioni dichiarate. Rilievi bloccanti: risultato conservato per il socio, nessuna bozza approvabile creata. I controlli automatici non sostituiscono una persona.
6. Risposta valida: bozze separate, fonte del pacchetto e provenienza AI, ciascuna in “Da approvare”. Approvazione soltanto del socio o collaboratore assegnato, sulla versione corrente. Date suggerite non programmano nulla. Nessuna pubblicazione o invio da questo percorso.
7. Modifica configurazione, chiavi o revoca del socio sospende la validità dell’autorizzazione; sospensione esplicita impedisce anche il salvataggio dei lavori in corso. Risultati e prove rimangono consultabili dai soci. Configurare in T4 uno alla volta solo dopo OK del proprietario.

I test e il browser di sviluppo usano dati inventati e fornitori simulati. Primo collaudo reale, costi del modello, chiavi, trasferimento di dati e attivazione sul server richiedono autorizzazione; non fanno parte dell’implementazione locale.

La stima in centesimi è una prenotazione prudenziale, non il prezzo misurato o un limite garantito dal fornitore. Prima dell’uso reale verificare modello, listino, limite account e costi mensili complessivi; riconciliare gli importi dopo l’uso. In modalità reale i vecchi avvii, calendari e retry delle procedure DEMO sono chiusi: non possono eseguire un incarico AI. Growth e Fidelity conservano le proprie code e autorizzazioni separate.

[Collaudo locale, prove e limiti](COLLAUDO-AGENTE-SOCIAL.md).
