# Audit mirato dei requisiti residui — 10 ottobre 2026

Codice esaminato: `aef13b3`, online e verificato. Suite finale già eseguita: 772/772, controllo 5/5. Questo audit non modifica il codice e non ripete la suite. Non certifica il completamento delle 92 voci né delle fasi 0–7.

## FUN-007 — destinazione dei moduli

Il criterio locale è soddisfatto: il vecchio elenco Gestionale non è nel menu e i moduli mantenuti hanno una destinazione. Fonti: `src/workspace.js` (menu per ruolo), `public/app.js` (alias e instradamento), `public/workspace.js` (scheda cliente e Fatturazione), test workspace e [prove browser](COLLAUDO-NAVIGAZIONE-RUOLI.md). Le decisioni aggiornate della mappatura principale prevalgono sulle vecchie proposte del dettaglio.

| Modulo | Destinazione attuale / decisione |
|---|---|
| Anagrafiche clienti | Clienti → scheda → Anagrafica |
| Fornitori, collaboratori e ditte | Fatturazione → Costi e abbonamenti → Anagrafiche; persone/aziende e ditte separate |
| Commerciale e contratti mantenuti | Clienti → Contratto, PDF e date |
| Accessi del cliente | Clienti → Accessi; team assegnato, credenziali protette; mai cliente |
| Fatturazione e incassi | Fatturazione → Da fatturare / Tracker / Incassi per cliente; Trello resta fonte ufficiale |
| Cassa e prima nota | Fatturazione → Prima nota, proiezioni 30/60/90 |
| Costi e abbonamenti | Fatturazione → Costi e abbonamenti / Compensi |
| Lavoro e marginalità | Voce nascosta, codice conservato secondo D-05 |
| Task e consegne | Restano su Trello secondo la mappatura aggiornata; COL-001 è un requisito separato aperto |
| Documenti | Contratti nella scheda cliente; fatture e pagamenti rimangono su Trello secondo D-04/D-10 |
| Direzione e scadenze mantenute | Home per priorità, clienti e avvisi; contratti con scadenze nella scheda; componenti economiche in Fatturazione |

La proposta storica di un ulteriore scadenziario fiscale non è una decisione di implementazione confermata. Nessuna integrazione Trello, importazione contabile o cancellazione è stata dichiarata completata da questa verifica.

FUN-007 passa a implementata localmente, con codice online e collaudo autenticato completo ancora aperto. Matrice: **73 locali, 13 parziali, 6 da fare**.

## Agenti e pubblicazione: perché restano parziali

| Requisito | Evidenza attuale | Cosa non dimostra |
|---|---|---|
| FUN-053 | `src/agent-config.js` produce stati e configurazioni; `requireRun` rifiuta agenti non Attivi. `src/agent-work.js` verifica configurazione, prova, collegamento e socio autorizzante. Test agent-config, agent-trials e agent-work nella suite. | Il percorso operativo predisposto è soltanto social manuale; gli altri percorsi e l’uso reale non sono collaudati. |
| FUN-055 | Frequenza nel singolo agente; `src/orchestrator.js` blocca modifiche agli automatismi in modalità reale, non elabora la coda DEMO e non avvia lo scheduler reale. Revoca della configurazione spegne i calendari. | Non esiste ancora una pianificazione AI reale collaudata e autorizzata. Il campo frequenza non equivale a un automatismo operativo. |
| FUN-062 | `src/production.js` controlla stessa versione/titolo/testo, decisione umana e permessi correnti; modificare la bozza annulla approvazione e data. `tests/production-approval.test.js` verifica rifiuti e calendario interno valido. | PUBBLICATO è sempre rifiutato anche con approvazione valida: manca un canale di pubblicazione collaudato. Il solo rifiuto delle richieste non prova il percorso reale. |

Questi tre requisiti restano parziali. Nessuna promozione a completati sulla base di un blocco sempre attivo.

## Dipendenze per il seguito

- **Accesso del socio:** risolto; login e cambio password completati. La sessione autenticata ha consentito il [collaudo online](COLLAUDO-ONLINE-2026-10-10.md). Non ripetere la ricerca di credenziali.
- **Fase 0, FUN-001, DAT-001 e UI-006:** primo backup applicativo confermato nell’area socio il 10 ottobre alle 16:05. Custodia cifrata ora disponibile. Restano accessi nominali e giri dei tre ruoli; le prove socio non li sostituiscono.
- **Fidelity prima di Growth:** completare le prove sul server e sul telefono; Google Wallet richiede account/chiavi e verifica Android. Apple resta esclusa dalle nuove attivazioni. Confronto/conteggi degli originali ancora aperti, senza copiarne dati o modificarli.
- **Profili, fonti e report:** prima il collaudo reale GBP autorizzato, poi gli altri canali. Restano ulteriori implementazioni e prove per i canali non collegati; non basta il registro dei link pubblici. Tracker da riconciliare con la fonte ufficiale autorizzata. Nessun dato cliente reale raccolto nell’audit.
- **Agenti:** chiavi, budget verificato e consenso al trasferimento delle fonti precedono la prima prova reale. Attivazione uno alla volta, a partire dal percorso social già predisposto. I successivi percorsi, automatismi e pubblicazione restano lavoro aperto, non funzionalità operative nascoste.
- **PRINC-01:** prove locali delle schermate principali e delle sottopagine corrette disponibili; nessuna certificazione di tutte le schermate con tutti gli accessi reali.
- **T0–T10:** l’ordine confermato in [TASK-AVANZAMENTO](TASK-AVANZAMENTO.md) mantiene T1–T10 dopo il riordino; non anticipare importazione clienti, archivio Desktop o nuovi collegamenti per aggirare questi prerequisiti.

Non riaprire i blocchi di codice già collaudati per produrre nuove prove equivalenti. Il prossimo passo utile è riprendere dalla sessione autenticata del socio e dai prerequisiti effettivamente disponibili, senza nuovi costi o attivazioni implicite.
