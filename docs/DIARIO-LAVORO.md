# Diario di lavoro — consegna a Claude Code

8 ottobre 2026, aggiornamento di consegna dalle 14:24 CEST · Europe/Rome. Ricostruzione dai commit e dalle prove: gli orari dei cicli precedenti non sono stati registrati in un diario e non vengono inventati. Gli ID R-xxx del brief esteso non sono ancora stati assegnati; sotto si usano gli ID storici AG-/MIG- e i nomi delle aree.

| Momento | Ciclo / area | Requisiti toccati | Risultato e problemi |
|---|---|---|---|
| Prima della correzione di direzione | Nucleo, Growth, Fidelity, amministrazione | MIG-GR, MIG-FI, AG-gestionale | Fondazione DEMO comune; 103 test nella baseline 8750e80. Non equivalenza ai provider originali |
| Correzione sull'intera agenzia, 8 ottobre | Audit e mappa agenzia | AG-sciame/servizi/gestionale/dashboard | Audit 1635c8e; struttura dacdc25; UI f290e3f; report723c26b. 27 spazi, 32 schede, 10 moduli. Ultima misura vecchio brief 62/205 = 30,2%, agenzia 17/114 = 14,9%; 114 test allora |
| Ultima fase prima del passaggio | Procedure dello sciame | AG-sciame e flussi specialistici, MIG-GR/MIG-FI | 7 core + 4 adapter + 21 specialisti eseguibili; output, versioni, fonti, gate e feedback. Nessun AI/provider reale |
| Revisione indipendente | Permessi e regia | Output, memoria, calendario, eventi | Corretto INSERT con 14 colonne e 15 valori, visibilità interna, feedback amministrativo, input pianificazioni, revoca servizi, cliente del contratto, eventi social/ricerca e revisione prerequisiti |
| Richiesta di consegna, 8 ottobre | Salvataggio immediato | Tutto il lavoro non committato | Commit locale 569c70d; copia web GitHub in 8 gruppi, ultimo cc1585e. Nessun collegamento Git remoto configurato, storie locale/remota diverse; nessun force push |
| Verifica consegna, 8 ottobre | Collaudo fermo al codice consegnato | Suite completa, check, 32 procedure | 161 test: 160 passati, 1 fallito in agency.test.js:31–34. Vecchia aspettativa di eventi non implementati. Test sugli agenti planned alla riga 23 vacuo. Check del codice 5/5; giro 32/32 con approvazioni, costo 0, invii 0 |
| Consegna documentale, 8 ottobre | Memoria e brief | PASSAGGIO-CONSEGNE, copertura, decisioni, brief | Trasferito contesto chat senza credenziali. Vecchio brief di 567 righe identico all’allegato; nuovo integrale di 2.184 righe conservato byte per byte. Percentuale nuovo integrale non misurata |

## Punto di arresto

Lo sviluppo si ferma per istruzione del proprietario, non perché il progetto sia completato. Il contratto `src/agency/swarm.js` è stato aggiornato, il corrispondente `tests/agency.test.js` no. Non è stato fatto il collaudo browser finale della nuova regia. Nuova matrice R-xxx, scenario aziendale a 13 passaggi, completamento dei servizi/gestionale e provider sono rimasti da fare. Vedere [PASSAGGIO-CONSEGNE](PASSAGGIO-CONSEGNE.md) per dieci prossimi passi e rischi.

Le copie remote dei report Drive possono essere precedenti alla consegna. Nessun deploy, modifica Railway, invio, pagamento, merge o accesso a Gmail è stato eseguito durante questo passaggio.


Controllo documentale dopo il salvataggio del brief integrale: `npm run check` passa sintassi, registro, dipendenze e prototipo locale, ma segnala 22 riferimenti relativi del testo sorgente a schede playbook non ancora estratte. Primo salvataggio: 21/21 file confrontati con GitHub e coincidenti. Il file integrale resta byte per byte uguale all’originale. Anche questo limite è consegnato a Claude, senza cambiare il testo sorgente o introdurre segnaposto vuoti.
