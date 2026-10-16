# Aggiungere un modulo o attivare un servizio

Questa guida descrive il contratto usato dal codice della fondazione. Non richiede un nuovo server, database, login o abbonamento per ogni servizio. Prima leggere `AGENTS.md` quando presente, `BRIEF-BIGANT.md`, `PLAYBOOK.md`, `ARCHITETTURA.md` e le regole del ramo di lavoro.

## 1. Prima distinguere servizio e modulo

Un **servizio** è ciò che BigAnt offre: social, video, sito, local. Può funzionare usando task, memoria, contenuti e approvazioni già esistenti. Per aggiungere soltanto una SOP/voce catalogo basta il registro e la relativa documentazione; non dichiarare il backend “implementato” senza codice e test.

Un **modulo** contiene regole o dati propri: ad esempio saldo carta Fidelity, prenotazioni Growth, prima nota. Si aggiunge soltanto quando il modello comune non basta. Le integrazioni di un servizio sono una terza cosa: mostrare un logo nel registro non collega un account.

## 2. Scheda obbligatoria

Prima del codice definire:

| Campo | Domanda concreta |
|---|---|
| Identificativo e responsabile | Quale nome stabile useremo e chi verifica il lavoro? |
| SOP/versione | Quale metodo esegue e quale problema risolve? |
| Input e fonti | Che dati servono, chi li può leggere, da dove arrivano? |
| Output | Che risultato verificabile lascia e dove lo vede il cliente/socio? |
| Permessi | Soci, collaboratori assegnati, clienti, eventuale pagina pubblica? |
| Innesco | Manuale, evento già previsto o calendario? |
| Costo | Ore/costo API massimo e modalità di prenotazione nel tetto comune? |
| Gate | Chi approva pubblicazione, invio, account o spesa, su quale versione? |
| Fallimento | Retry sicuro, esito incerto, come evitare duplicazioni? |
| Stato | SOP soltanto, DEMO funzionante, integrazione scollegata o collaudo reale? |

Le decisioni nuove vanno in `DECISIONI.md`; le informazioni mancanti in `DOMANDE-PER-RAFFAELE.md`. L'attuale autorizzazione notturna non consente deploy, account reali, invii o spese.

## 3. Registrare il servizio

La struttura completa è descritta in [STRUTTURA-AGENZIA](STRUTTURA-AGENZIA.md). Il registro di sola lettura in `src/agency/index.js` viene validato all’avvio e da `npm run check`. Per un nuovo pezzo:

1. Aggiungere l’ID e il reparto in `src/registry.js`; per un servizio aggiungere anche il contratto specifico in `src/agency/services.js`. Una voce senza contratto fa fallire l’avvio, così non resta una semplice etichetta.
2. Dichiarare input, sezioni/output, specialisti, fonti, integrazioni, modalità di erogazione, gate, condizioni di attivazione, limiti e prove di accettazione. Gli identificativi dei connettori devono esistere nel registro.
3. Aggiungere gli specialisti come `planned`; in `src/agency/swarm.js` completare trigger, memoria, permessi, costo/fallimento. Un trigger non implementato resta tale anche se l’agente dispone già di una procedura DEMO.
4. Se è una parte di uno dei dieci moduli gestionali, aggiungere sezioni e contratto in `src/agency/management.js`, senza creare un undicesimo modulo per compensi o quadratura. Le aree trasversali pianificate sono in `foundations.js`.
5. Se interessa la dashboard cliente, aggiornare `src/agency/dashboards.js` e la lista dei servizi che possono vederla. Provare anche il cliente che compra soltanto il nuovo servizio e la revoca dell’acquisto.
6. La UI Servizi usa lo stesso workspace parametrico e riceve il DTO filtrato dal server. Mappa e Marketing restano riservati ai soci. Non aggiungere un secondo database, un login o un timer.
7. Prima di passare da scheda a funzione, implementare l’handler, i dati necessari e test di comportamento. Solo dopo aggiornarne lo stato e la [copertura del brief](VERIFICA-COPERTURA-BRIEF.md). L’attivazione esterna non è autorizzata da un cambio di stato nel registro.

I file `services.js`, `management.js`, `marketing.js` e `foundations.js` sono contratti distinti anche quando condividono un file: non sono esecutori. Il validatore intercetta duplicati, agenti/reparti orfani, connettori sconosciuti, moduli mancanti e privilegi amministrativi impropri. I test verificano che gli specialisti pianificati siano rifiutati dall’orchestratore.

Aggiornare `src/registry.js` con ID univoco, reparto, deliverable, stato, integrazioni previste e riferimento SOP. Aggiungere/estendere la scheda nel playbook. Marcare `implemented` solo quando il relativo flusso è presente e verificato. Per il catalogo Italiaonline conservare l'identificativo, senza attribuire a BigAnt partnership o capacità proprietarie altrui.

Il servizio acquistato è elencato in `os_clients.services_json`. Il backend controlla tale abilitazione dove pertinente; il menu non è un confine di sicurezza. Un servizio amministrativo rimane riservato ai soci anche se il cliente acquista una prestazione commerciale simile.

## 4. Implementare soltanto le regole necessarie

Il contratto ordinario è una factory sulla connessione comune:

```js
export function createExampleModule({ store, origin }) {
  // Inizializzare soltanto le proprie tabelle sulla connessione store.db.
  // Nessun fetch, lettura segreti, timer o processo avviato all'import.
  function seed() {
    // Fixture idempotenti, nomi DEMO, email e siti .example.
  }
  function state(clientId, user) {
    // Verificare ruolo e perimetro anche dentro il modulo.
    // Restituire soltanto dati serializzabili autorizzati.
  }
  async function handle({ method, path, body, user, clientId }) {
    // Ritorno: { data, status?, contentType? }; null se rotta sconosciuta.
    // Errori con AppError(message, status).
  }
  return { seed, state, handle };
}
```

Questo è uno scheletro illustrativo, non un modulo pronto da eseguire. Usare `store.query/one/run/transaction/audit` e i controlli `requireOwner`/`requireClient` appropriati. Le transazioni dello store sono sincrone: non mettere `await` o chiamate di rete dentro `store.transaction`. Le operazioni remote future richiedono preparazione persistita, azione fuori transazione e riconciliazione finale.

Regole dati:

- Riutilizzare `os_clients` e `os_users`: non creare una seconda identità o anagrafica dell'agenzia.
- Tabelle del dominio con prefisso univoco e chiavi esterne al cliente comune; per dati economici mantenere anche la ditta.
- Importi in centesimi interi, date ISO; distinguere input mancante da zero.
- Chiavi di idempotenza per ogni operazione che può essere ripetuta; stesso payload stesso esito, payload diverso errore.
- Aggiornamenti concorrenti con versione, controllo residui/saldo e transazione.
- Non mettere contatti reali, database, token o chiavi in Git. `.data`, file database e `.env` sono esclusi.

## 5. Collegare router e UI

In `server.js` istanziare la factory dopo lo store e chiamare `seed()` soltanto nel percorso dimostrativo. Registrare il modulo nel dispatch con prefisso API, verificando esplicitamente sessione, ruolo e perimetro. Per rotte pubbliche definire dati minimi, token, scadenza, rate limit e Origin: non trasformare un utente pubblico in un socio generico.

In `public/app.js` aggiungere la vista e i comandi necessari. Ogni schermata deve distinguere dati DEMO, dati reali, dato mancante e servizio scollegato. Validare anche sul backend. Evitare dettagli implementativi nei moduli destinati ai clienti. Una UI nascosta non rende privato un endpoint.

Il risultato visibile deve essere concreto: elenco, dettaglio, azione, conferma dell'esito, errore comprensibile e collegamento al registro. Non aggiungere un pulsante “collega” che simula una connessione riuscita.

## 6. Approvazioni, audit e costi comuni

Se il modulo prepara un'uscita, creare una richiesta `os_approvals` con `kind` dedicato, cliente, entità e versione. La coda comune inoltra la decisione al modulo: aggiornamento stato di dominio e approvazione devono essere atomici. Titolo/testo/asset/destinatari/spesa cambiati richiedono una nuova versione; motivo per rifiuto o modifiche. Un `approved` non abilita da solo il provider.

Scrivere `os_audit` con utente, cliente, azione, ID record e dettaglio minimo. `visibility=admin` per economia, `client` soltanto per eventi che il titolare può vedere. Non inserire password, token carta o payload riservati nel log.

I costi finiscono nel tetto comune `os_costs`/impostazioni. Prenotare prima della lavorazione, contabilizzare il costo verificato, rilasciare il residuo; niente secondo portafoglio invisibile. Il prototipo usa provider locali a zero costo. Qualunque provider a pagamento richiede una fase successiva autorizzata, soglie e confronto consumi reali.

## 7. Pianificazioni e agenti

Un agente implementa una SOP, non una conversazione libera senza input/output. Registrarlo in `agentDefinitions`, dichiarando `implemented`, `module` o `planned` correttamente.

Gli specialisti centrali sono eseguiti dall'orchestratore. I domini con coda propria espongono un ingresso `tick`/motore esplicito e vengono chiamati dal worker centrale: non installare `setInterval` in un modulo. Usare identità di servizio autorizzata e perimetro, controllare cliente attivo e pausa. I job dei domini devono comparire nella dashboard centrale insieme agli errori.

Calendari attuali: giornaliero, lunedì, venerdì, primo del mese alle 09:00 Europe/Rome; eventi `content.ready`, `lead.created`, `client.created`. Un nuovo evento richiede whitelist, produttore, chiave di deduplica, test e descrizione del trigger. Nessuna dichiarazione “autonomo in cloud” finché il sistema gira soltanto sul server locale.

## 8. Collaudo e consegna

Creare `tests/<modulo>.test.js` con `node:test`, SQLite in memoria e fixture. Verificare almeno:

1. Socio autorizzato, collaboratore fuori assegnazione e cliente di un'altra attività respinti.
2. Dati mancanti/invalidi respinti senza scritture parziali.
3. Operazione ripetuta senza duplicazioni; versione vecchia e conflitti gestiti.
4. Budget, pausa, retry ed esito incerto conservano invarianti.
5. Modifica del contenuto revoca la vecchia approvazione.
6. Provider scollegato non chiama rete e non registra un successo esterno.
7. Audit e output non espongono dati di un altro cliente o area admin.

Eseguire dalla radice `node --test tests/<modulo>.test.js`, poi la suite comune `npm test`. Provare la UI con i profili pertinenti e controllare che i dati restino nel perimetro autorizzato. Non dire “testato” per un solo controllo sintattico.

Documentare API effettive in `docs/API-<MODULO>.md`, aggiornare architettura, registro, roadmap e inventario funzione per funzione quando si tratta di migrazione. I segnaposto rimangono marcati come tali. Commit piccoli sul ramo autorizzato, pull request senza merge. Il rilascio remoto è un'attività distinta e non è autorizzato dalla sola implementazione locale.
