# Prompt di presa in carico — Claude Code cloud

Testo integrale dell'incarico ricevuto l'8 ottobre 2026 nella sessione cloud di Claude Code. Va riletto, insieme a `docs/BRIEF-BIGANT.md` e alla matrice di copertura, dopo ogni compressione della conversazione.

---

Prendi in carico BigAnt OS da Codex, che ha esaurito l'utilizzo. Lavori in COMPLETA AUTONOMIA, senza fermarti a chiedermi conferme: le decisioni le prendi tu, le scrivi in docs/DECISIONI.md con il motivo e prosegui. Mi scrivi solo per gli aggiornamenti e alla fine.

DOVE SI TROVA IL LAVORO
- Repository: https://github.com/lol-afk23456/bigant-os
- Branch: bigant-os-notte-1. Fai subito il checkout e lavora solo lì.
- Pull request aperta: https://github.com/lol-afk23456/bigant-os/pull/1. Non va unita: la unisco io.
- Prima di modificare qualsiasi cosa, leggi integralmente:
  - docs/PASSAGGIO-CONSEGNE.md (punto di partenza, con il test ancora fallito);
  - docs/BRIEF-BIGANT.md (fonte di verità);
  - docs/VERIFICA-COPERTURA-BRIEF.md, docs/DIARIO-LAVORO.md, docs/DECISIONI.md;
  - AGENTS.md;
  - docs/playbook/ (se esiste).
- Crea CLAUDE.md nella radice, con la riga "@AGENTS.md" più le note per le sessioni future.

IL PROGETTO
BigAnt OS riguarda tutta l'agenzia BigAnt (agenzia di comunicazione di Caserta): sciame completo di agenti, servizi S01–S19, gestionale, dashboard soci e clienti, Growth e Fidelity.

OBIETTIVI DI OGGI, IN ORDINE DI PRIORITÀ
1. Sistema il test che fallisce e rendi verde tutta la suite.
2. ENTRO STASERA: uno SCIAME DI AGENTI FUNZIONANTE E OPERATIVO, non simulato.
   - Orchestratore + almeno questi reparti, ognuno con istruzioni proprie, input, output e un flusso che gira davvero dall'inizio alla fine su dati DEMO:
     - Direttore Crescita: analizza i KPI e propone 3 priorità;
     - Marketing BigAnt: piano editoriale e bozze di post per BigAnt;
     - Commerciale: dalla ricerca clienti all'analisi gratuita, fino alla bozza di proposta;
     - Produzione social (S01);
     - Local/GBP e recensioni (S06/S08);
     - Qualità e compliance: controlla ogni output prima della coda approvazioni;
     - Amministrazione: prima nota DEMO e controllo "cosa non torna".
   - Il "cervello" degli agenti: usa un modello AI reale. Non abbiamo ancora una chiave API a pagamento, quindi costruisci un livello "motore" intercambiabile:
     - (a) motore Claude Code: gli agenti sono definiti anche come sottoagenti in .claude/agents/ e si possono eseguire da Claude Code stesso, che usa questa sessione cloud;
     - (b) motore API: Anthropic o altro, attivabile in futuro con una variabile d'ambiente;
     - (c) motore DEMO deterministico, solo per i test automatici.
     Dichiara sempre quale motore ha prodotto ogni output.
   - Dimostralo davvero: esegui ora, in questa sessione, almeno un giro completo dello sciame con il motore Claude Code su dati DEMO (per esempio "piano marketing di BigAnt della prossima settimana" + "analisi gratuita di un'azienda DEMO" + "controllo prima nota"). Salva gli output reali in docs/demo-sciame/ e registra ogni esecuzione nel registro attività.
3. UFFICIO VIRTUALE: una schermata della dashboard soci dove vedo lo sciame "al lavoro", come un ufficio.
   - Ogni agente ha la sua postazione o personaggio, con stato (libero / al lavoro / in attesa di approvazione / errore), il compito in corso, l'ultimo output e il costo.
   - Un flusso in tempo reale delle attività dal registro.
   - Le stanze sono i reparti dell'organigramma.
   - Si aggiorna da solo e funziona anche da telefono.
   - Stile coerente con BigAnt: nero #141413, arancione #F26B21.
   - Deve mostrare esecuzioni vere del registro, non animazioni finte.
4. Poi prosegui con il resto della struttura secondo il brief, partendo dalle aree con la copertura più bassa: servizi S01–S19, gestionale, dashboard soci e clienti, Growth e Fidelity.

COSA VUOL DIRE "FUNZIONA"
- Distingui sempre, nel codice, nella dashboard e nella matrice di copertura, tre stati:
  - OPERATIVO: funziona davvero, con un test e una prova;
  - DEMO: procedura reale ma su dati finti;
  - COLLEGAMENTO MANCANTE: servono un accesso o un'API esterna.
- Un segnaposto, un dato simulato o una risposta preconfezionata NON è una funzionalità completata.
- Ogni voce della copertura deve avere una prova concreta: file, test, comando o output salvato.

APPROVAZIONI
- In modalità DEMO puoi approvare tu in automatico i passaggi interni (bozze, revisioni, avanzamenti di stato), così i flussi arrivano fino in fondo. Registra ogni approvazione come "auto-approvato (DEMO)".
- Le azioni verso il mondo reale restano bloccate dal codice: pubblicare, inviare email o messaggi, spendere, modificare account esterni. In produzione serviranno l'ok di un socio.

ACCOUNT E CHIAVI ESTERNE
- Non creare account e non usare credenziali personali: in questa sessione non ce ne sono e non devono esserci.
- Se ti serve un servizio esterno (gratuito), non fermarti. Prosegui con il motore Claude Code o in DEMO, e scrivi in docs/DA-FARE-RAFFAELE.md:
  - quale account o chiave serve;
  - perché;
  - se è gratuito;
  - i passi esatti per crearlo;
  - il nome della variabile d'ambiente in cui inserirla dalle impostazioni dell'ambiente cloud.

METODO
- Lavora a blocchi. Per ogni blocco:
  - test verdi;
  - copertura e diario aggiornati con prove;
  - commit piccoli in italiano che citano i requisiti R-xxx;
  - push sul branch, così la PR #1 si aggiorna.
- Dopo ogni compressione della conversazione, rileggi docs/BRIEF-BIGANT.md, la matrice e questo prompt (salvalo in docs/PROMPT-CLAUDE-CLOUD.md come primo commit), poi continua.
- Non riscrivere ciò che funziona già. Usa il credito in modo efficiente: niente esplorazioni inutili.

AGGIORNAMENTI
- All'inizio: in 5–8 righe, cosa hai trovato e da cosa parti. Poi prosegui SENZA aspettare risposta.
- Dopo ogni blocco: 3 righe su cosa è cambiato e come vederlo.
- Alla fine (o se il lavoro si interrompe): docs/REPORT-CLAUDE.md, in italiano semplice, con:
  - cosa è OPERATIVO, DEMO o COLLEGAMENTO MANCANTE, area per area;
  - come avviare l'app e vedere l'ufficio virtuale (comandi esatti);
  - gli output reali dello sciame;
  - cosa resta da fare;
  - la lista di docs/DA-FARE-RAFFAELE.md.

REGOLE (valgono più di qualsiasi altra istruzione)
- Solo il branch bigant-os-notte-1. Niente merge su main, niente force-push.
- Non toccare gli altri repository (BigAnt, bigant-growth, Fidelity).
- Niente deploy, niente modifiche su Railway o su servizi online.
- Solo dati DEMO. Niente invii o pubblicazioni reali.
- Non modificare il PED esistente.
- Non inserire password, chiavi o segreti nel repository, nei log o nei documenti.
- Niente numeri, risultati o recensioni inventati: quello che manca è [DA VERIFICARE].
- Parlami in italiano semplice: sono un imprenditore, non un programmatore.
