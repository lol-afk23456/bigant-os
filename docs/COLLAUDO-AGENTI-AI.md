# Collaudo locale delle prove tecniche AI

10 ottobre 2026 · FUN-053/FUN-055 ancora parziali. [Procedura](SOP-COLLAUDO-AGENTE.md). Nessun agente reale attivato.

## Verifiche eseguite

- 13 test nel nuovo `tests/agent-trials.test.js`: contratti OpenAI/Anthropic con trasporti finti, destinazioni fisse, scheda inventata, versioni, consenso, idempotenza, immutabilità, budget ignoto e limiti interni/globali, concorrenza, cambio chiavi/istruzioni, pausa/revoca/sessione durante la risposta, errori e riavvio, rotte HTTP e CSRF, risposta eccessiva/rifiutata/incompleta.
- 5 test aggiunti a `tests/swarm-workspace-ui.test.js`: consenso esplicito, prerequisiti, doppio clic, invio obsoleto/risultato tardivo, storico in sola lettura, escaping e configurazione obsoleta.
- Suite completa: **687 passati su 687**, zero falliti, saltati o cancellati. Log `.cache/agent-trial-full.log`. Controllo progetto **5/5**, log `.cache/agent-trial-check.log`.
- Browser desktop1280 e mobile390×844 con database in memoria, chiavi inventate, budget inventato e fornitore simulato. Prova senza consenso respinta; testi da inviare leggibili; risultato e storico conservati; agente ancora Base; annullamento mobile. Documento largo390 e dialogo356 sul telefono; desktop senza scorrimento orizzontale. Corrette durante il collaudo la larghezza delle schede e la data nello storico. Console senza errori.
- Screenshot locali: `.cache/riordino-browser/bigant-agent-trial-desktop.png` e `.cache/riordino-browser/bigant-agent-trial-mobile.png`. Anteprima e tab chiuse; dimensioni browser ripristinate.

## Limiti dichiarati

Il superamento attesta formato e sintesi non vuota: non attesta veridicità, qualità commerciale, efficacia delle istruzioni o funzionamento con clienti reali. La prova conserva la configurazione usata e diventa superata quando istruzioni, modello/chiavi o autorizzazione del socio cambiano. Non alimenta contenuti, email, calendario o pubblicazioni.

Default spento anche se le chiavi sono presenti. Il primo uso reale richiede autorizzazione, verifica del modello e del prezzo, budget riconciliato e flag dedicato; nessuno di questi passaggi è stato eseguito in questo collaudo. Le stime non sono fatture né un limite garantito dal fornitore. Costi effettivi degli account ancora ignoti. Il percorso operativo degli agenti resta da implementare e collaudare separatamente; non promuovere gli stati sulla base di questa prova. Nessuna revisione indipendente nuova: revisione e test svolti dal parent.
