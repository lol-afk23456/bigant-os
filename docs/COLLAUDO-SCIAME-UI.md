# Sciame BigAnt — interfaccia DEMO

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
