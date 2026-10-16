# Sciame BigAnt — interfaccia DEMO

## Riordino Struttura e priorità — 10 ottobre 2026

FUN-005, FUN-019, FUN-046, UI-008 e UI-011 verificati in locale. Lo Sciame si apre sull’Ufficio, conserva la cabina di regia, le stanze e il feed, e offre sei sezioni: Ufficio, Agenti, Da approvare, Storico, Budget e Struttura. Struttura apre un reparto alla volta, con responsabilità, specialisti, risultati della procedura, metodo e controllo umano; Configura apre la scheda senza avviare lavori.

Le priorità del Direttore leggono soltanto risultati registrati dell’agenzia, anche quando è selezionato un altro cliente. Fonte, data, versione e decisione restano visibili; il passaggio interno DEMO è distinto da una decisione umana. Una revisione manuale mostra il nuovo testo; un risultato incoerente o fermato non ripropone silenziosamente una proposta precedente. La lettura non genera AI, scritture o approvazioni.

Browser su archivio in memoria e rete esterna disabilitata: socio, Bottega selezionata → priorità dell’agenzia → risultato di origine; Struttura → Direzione e crescita → Configura; Esplora lo sciame → ricerca del Direttore; Storico social → elaborato → bozza effettiva nella coda. Un nuovo giro DEMO compare nel feed e nel dettaglio dei giri. La vecchia voce Lavori è assente dai menu socio, collaboratore e cliente. Nessun errore console rilevato.

Verifica a 390×844: reparto e priorità leggibili, documento largo 390 px e dialogo 356 px. Schermate nella cache tecnica: `bigant-swarm-structure.jpg`, `bigant-swarm-structure-mobile.jpg`, `bigant-swarm-priorities.jpg` e `bigant-swarm-priorities-mobile.jpg`, sotto `.cache/riordino-browser/`. Non è una prova su telefono fisico.

**407/407 test nella suite completa**, inclusi 6 nuovi sul servizio priorità e 19 sulle regressioni di interfaccia. Le risposte tardive dell’Ufficio e dei suoi dettagli sono scartate dopo cambio pagina, sezione, sessione o caricamento; la prova positiva della diretta verifica aggiornamento della trascrizione e passaggio al risultato finale. Permessi, revoche, isolamento, versioni, escaping ed errori di lettura sono coperti. Revisione indipendente del backend senza difetti bloccanti individuati. Nessun rilascio o attivazione reale; rimangono aperti collaudo sul server, integrazioni e le altre voci delle 92 migliorie.

## Aggiornamento FUN-062 — 10 ottobre 2026

Su un nuovo archivio soltanto in memoria, il flusso social DEMO produce otto bozze **DA APPROVARE**, senza auto-approvazione né data in calendario. Browser locale: accesso Collaboratore DEMO, coda di nove richieste (otto Sciame e una fixture preesistente), lettura di Contenuto 1 e decisione registrata; la richiesta decisa scompare e le altre restano pendenti. Verificato il dialogo di Contenuto 2 a 390×844: documento 390 px, finestra 356 px, nessuno scorrimento orizzontale e nessun errore console rilevato.

Schermate nella cache tecnica `.cache/riordino-browser/bigant-publication-desktop.jpg` e `bigant-publication-mobile.jpg`. La pianificazione e i rifiuti del server sono verificati da `tests/production-approval.test.js` e `tests/sciame.test.js`: 35 prove mirate, suite complessiva 382/382. [SOP e limiti](SOP-PUBBLICAZIONE-CONTENUTI.md). Nessun test su un telefono fisico o su un canale esterno; nessun rilascio. Il resoconto seguente resta storico.

Aggiornamento: 8 ottobre 2026. Il collaudo riguarda BigAnt OS nella cartella tecnica, non le applicazioni online.

## Comportamenti predisposti

- La regia legge il registro del server e raggruppa gli specialisti negli otto reparti. La disponibilità viene dal motore; nessun numero di agenti attivi è scritto a mano nell’interfaccia.
- Ogni scheda dichiara «Procedura DEMO offline», disponibilità per l’attività selezionata, ultimo giro e relativo esito. Le procedure con prerequisiti mancanti mostrano «Dati da completare».
- **Prepara giro** apre un modulo leggibile: indicazioni facoltative, settore/zona per la ricerca, azienda DEMO facoltativa per analista e commerciale. L’utente non deve scrivere JSON. La conferma accoda soltanto la procedura e lo dichiara.
- **Prova gli agenti dell’attività** accoda le procedure pertinenti e completa al massimo 40 lavori dell’attività. BigAnt cliente zero può provare tutto lo sciame. Il giro non approva gli elaborati e non cambia consensi o stato dei collegamenti.
- **Esegui prossima** e **Completa la coda** operano sui lavori già registrati. Durante un giro non si può avviarne un secondo; il selettore attività è temporaneamente disabilitato.
- Il riepilogo usa gli stati restituiti dal server. Un errore non viene presentato come successo; dopo un’interruzione invita a riprendere la coda, evitando di accodare nuovamente l’intera prova.
- **Leggi elaborato** mostra testo, versione, fonti, dati mancanti, costo DEMO e collegamenti interni. Il socio può aprire la decisione pendente o salvare una nuova versione con una nuova approvazione.
- Quando l’elaborato deriva da una bozza social, Growth o Fidelity, il comando di modifica centrale è assente: si modifica nel modulo collegato e si usa la stessa approvazione della bozza originale.
- Gli esiti con prerequisiti mancanti non offrono modifica dell’elaborato o approvazione: invitano a completare i dati e avviare un nuovo giro.
- Gli elaborati dello sciame sono riconoscibili nella coda comune delle approvazioni; la lettura non li approva.
- Gli automatismi usano gli eventi dichiarati dal server e quattro frequenze a calendario. La schermata dichiara che il processo locale deve rimanere aperto.
- Fonti e testo dell’elaborato sono mostrati come testo, non interpretati come HTML. I collegamenti dell’elaborato possono soltanto aprire sezioni interne note.

## Verifiche già eseguite

| Prova | Esito | Limite della prova |
|---|---|---|
| Sintassi `public/app.js` con Node 24 | PASS | Non verifica il browser |
| Rendering con 32 definizioni eseguibili e 8 reparti | PASS | Dati di contratto in memoria, non una chiamata al motore |
| Ricerca per nome e agente non pertinente senza comando di avvio | PASS | Rendering della regia |
| Job completato con prerequisito esposto come «Dati da completare» | PASS | Trasformazione dello stato nell’interfaccia |
| Testo simile a uno script reso come testo innocuo | PASS | Render del dettaglio elaborato |
| Fonti, mancanze e collegamento interno Growth presenti nell’elaborato | PASS | Render del dettaglio elaborato |
| Collegamento `javascript:` non reso come azione | PASS | Lista ammessa di destinazioni interne |

Verifica della sintassi:

```sh
node --check public/app.js
```

Le verifiche dei renderer sono state eseguite caricando lo stesso script in un contesto JavaScript isolato con DOM simulato. Non sono prove di esecuzione dei 32 agenti e non sostituiscono il collaudo interattivo o i test del server.

## Percorso per il collaudo interattivo

1. Entrare come Socio DEMO, scegliere BigAnt e aprire **Sciame di agenti**. Verificare otto reparti e il numero di procedure eseguibili restituito dal server.
2. Premere **Prova gli agenti dell’attività**. Attendere il riepilogo, leggere un elaborato di produzione e uno commerciale; distinguere esito registrato e prerequisiti mancanti.
3. Modificare un elaborato, salvarne la nuova versione e verificare che la decisione precedente sia superata. La nuova bozza deve comparire nelle approvazioni.
4. Preparare un giro di ricerca con un input DEMO, eseguire la coda e verificare le fonti e il collegamento al CRM.
5. Mettere lo sciame in pausa, accodare un giro e provare a completare la coda: non deve essere dichiarato completato. Riattivare e riprendere i lavori.
6. Passare a Bottega Aurora DEMO: le schede restano nel catalogo, ma gli specialisti non pertinenti non offrono **Prepara giro**; i giri mostrati appartengono soltanto all’attività selezionata.
7. Provare desktop e telefono: nessun testo o pulsante deve essere tagliato. Verificare che **Cambia profilo** rimanga nel menu compatto.

Il risultato del collaudo browser e le prove dell’esecuzione reale della DEMO vanno aggiunti dopo la verifica da parte dell’agente principale. Nessuna azione in questa lista richiede email, pubblicazioni, servizi a pagamento o modifica di Railway.
