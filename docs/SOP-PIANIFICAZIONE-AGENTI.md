# Pianificazione autorizzata degli agenti

FUN-055. Si gestisce dalla scheda del singolo agente, mai dal vecchio pannello degli automatismi DEMO. Prima implementazione per Social; Qualità resta manuale, perché una revisione riguarda una bozza specifica.

1. Il socio configura «Quando lavora», completa la prova dell'agente e lo autorizza. Il server mantiene un interruttore separato per le pianificazioni, spento per impostazione predefinita.
2. Dalla scheda Social, per una sola attività con servizio acquistato, il socio legge l'incarico ricorrente, il pacchetto esatto, la frequenza, il costo stimato per esecuzione e la scadenza a 30 giorni. Conferma separatamente la pianificazione. Nessun lavoro parte al salvataggio.
3. Le scadenze sono alle 09:00 di Roma: ogni giorno, lunedì, venerdì o primo giorno del mese. Il prossimo orario è sempre futuro. Un fermo non genera una raffica di recuperi: al massimo una scadenza viene presa in carico e la successiva viene calcolata dal momento corrente.
4. Ogni occorrenza ha un identificativo unico. Prima e dopo il trasporto si ricontrollano socio autorizzante, servizio, pausa, configurazione/prova/chiavi/autorizzazione correnti, fonti e consenso alla pianificazione. Alla bozza si aggiunge soltanto la data prevista dall'incarico ricorrente autorizzato.
5. Il budget comune viene verificato a ogni esecuzione. Cambio mese senza consumi riconciliati, costo insufficiente, fonti cambiate, errore o rilievi bloccanti sospendono la pianificazione. Serve una nuova anteprima e una nuova conferma per riprendere. La disattivazione globale non autorizza recuperi impliciti al successivo riavvio.
6. Scadenze già prese in carico non vengono ritentate automaticamente. Un'interruzione conserva l'identificativo e l'eventuale costo da verificare; al riavvio la pianificazione è sospesa. La persona legge lo storico e decide come ripartire.
7. Il risultato passa nel normale percorso delle bozze social: revisione umana, nessuna pubblicazione automatica. L'autorizzazione scade dopo 30 giorni e può essere revocata dalla stessa scheda; revoca e modifiche bloccano anche il salvataggio dei lavori in corso.

Lo sviluppo usa solo dati inventati e trasporti simulati. Pubblicare il codice non abilita chiavi, variabili, pianificazioni o spese reali.
