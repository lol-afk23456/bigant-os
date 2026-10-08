# La struttura dell’intera agenzia

8 ottobre 2026, revisione successiva alla verifica del brief. **Struttura navigabile e testata; servizi autonomi ancora in gran parte da implementare.** Il risultato operativo è misurato nella [matrice di copertura](VERIFICA-COPERTURA-BRIEF.md), non dal numero di schede.

## Tre ingressi nella stessa app

- **Mappa agenzia:** otto reparti, 32 specialisti descritti, 27 servizi, dieci moduli gestionali e nove aree ancora da sviluppare. È riservata ai soci.
- **Marketing BigAnt:** tutti i canali dell’agenzia e dei soci, DNA, strategia, calendario, portfolio, Google, sito, acquisizione, ADV e misure. Legge sempre il cliente zero `demo-bigant`, anche se prima era selezionata un’altra attività.
- **Servizi:** uno spazio per ogni servizio, con sezioni specifiche, input, consegne, specialisti, modalità di erogazione, approvazione, limiti e fonti. Task, contenuti e approvazioni presenti vengono letti dall’archivio comune per quel cliente e servizio.

Le schede nuove sono di sola lettura. Il collegamento a una funzione già disponibile porta alla sua vista esistente. Non esiste un comando che “attiva” uno specialista ancora da costruire.

## Dove si aggiunge ogni pezzo

| File | Responsabilità |
|---|---|
| `src/registry.js` | Identità stabili di servizi, reparti, specialisti e integrazioni. Solo gli agenti con handler locale sono eseguibili. |
| `src/agency/services.js` | Contratto di ciascuno dei 19 servizi del catalogo, esclusioni comprese; specialità BigAnt, Growth, Fidelity e local. |
| `src/agency/swarm.js` | Organigramma, specialisti, trigger, memoria, input/output, permessi, approvazioni, log, budget, fallimento e accettazione. |
| `src/agency/management.js` | Esattamente dieci moduli: ID, numero, dati presenti e previsti, responsabilità, parti disponibili e mancanti. |
| `src/agency/marketing.js` | Nove canali e dieci aree del cliente zero. Obiettivi e misure non vengono inventati. |
| `src/agency/foundations.js` | Modelli dei pezzi mancanti: onboarding, portfolio, capacità, obiettivi, KPI, pacchetti, commercialista, spese insolite e custodia dei collegamenti. |
| `src/agency/dashboards.js` | Tutte le sezioni interne e le dieci sezioni cliente del brief, più Fidelity. Regole di visibilità per acquisto. |
| `src/agency/index.js` | Registro unificato, validatore dei riferimenti e API di lettura con controllo server del ruolo e cliente. |
| `public/app.js`, `public/style.css` | Mappa, Marketing, workspace del servizio e dashboard cliente. Una vista parametrica evita 27 interfacce divergenti. |
| `tests/agency.test.js` | Undici verifiche della struttura, dei permessi, degli stati e del divieto di esecuzione dei segnaposto. |

Un registro per dominio sostituisce decine di file vuoti. Ogni servizio e modulo ha comunque un ID stabile, un contratto distinto e uno spazio navigabile. Quando servono regole specifiche si aggiunge un modulo sulla connessione comune, come descritto nella [guida](COME-AGGIUNGERE-UN-MODULO.md).

## Dieci moduli, senza confondere le funzioni aggiuntive

1. `contacts` — anagrafiche.
2. `sales-contracts` — commerciale e contratti.
3. `invoicing` — fatturazione e incassi.
4. `deadlines` — scadenziario unico.
5. `cash` — cassa e prima nota, con compensi, prelievi, quadratura, rettifiche e anomalie.
6. `costs` — costi e abbonamenti.
7. `work-margin` — lavoro e marginalità, con capacità futura.
8. `delivery` — task e consegne.
9. `documents` — documenti e autorizzazioni, ancora solo struttura.
10. `direction` — direzione, sei domande, decisioni, obiettivi e KPI.

Compensi, prelievi e quadratura non sono più contati come un undicesimo e dodicesimo modulo: hanno il proprio posto dentro i dieci richiesti.

## Confini dello sciame

L’orchestratore esistente esegue sette procedure deterministiche locali. Quattro definizioni rimandano ai motori dei moduli (ricerca, analisi, commerciale e Fidelity); le altre 21 sono specialisti pianificati. Le definizioni complete descrivono il futuro contratto, ma non aggiungono nuovi handler.

I calendari disponibili sono giornaliero, lunedì, venerdì e primo del mese, alle 09:00 Europe/Rome. Gli eventi realmente implementati sono `lead.created`, `client.created`, `content.ready`. Nuova recensione, contenuto approvato, contratto firmato, obiettivo aggiornato e brief approvato sono **eventi previsti**, non attivi. Le pianificazioni effettive rimangono visibili nella regia; leggere la mappa non ne attiva nessuna.

Ogni specialista dichiara la memoria del cliente e le parti ancora mancanti. La memoria operativa corrente supporta master, DNA, strategia, feedback e report; calendario, cruscotto e decisioni sono in parte record comuni, non ancora tutti documenti editabili. `04_ACCESSI` e credenziali restano esclusi. Solo Amministrazione ha il contratto per dati contabili grezzi; gli aggregati economici del Direttore sono ancora da implementare.

Tetto comune 50 €/mese, nessun consumo API nella prova. Per gli specialisti pianificati il costo è sconosciuto (`null`), non zero. Il futuro costo e l’attivazione richiedono una valutazione separata. La coda esistente rifiuta l’avvio e la pianificazione degli specialisti `planned`.

## API e accessi

| Richiesta | Accesso / risultato |
|---|---|
| `GET /api/agency/state` | Solo soci. Registro intero, moduli, reparti e contratti. |
| `GET /api/agency/marketing` | Solo soci. Dati comuni del cliente zero BigAnt, canali/aree vuoti dove mancano. |
| `GET /api/agency/services/:id?clientId=…` | Socio: anche anteprima servizio non acquistato. Cliente/team: soltanto cliente consentito e servizio acquistato. |
| `GET /api/agency/dashboard?clientId=…` | Sezioni cliente filtrate per servizi acquistati; niente amministrazione o CRM commerciale dell’agenzia. |

Le nuove API rifiutano POST/PATCH/DELETE. Al cliente vengono restituiti consegne, stato e specialisti nominati, non i contratti interni con capacità, costi e permessi. Il workspace non accede ai lead Growth o ai movimenti contabili: usa soltanto lavori, contenuti e approvazioni pertinenti. Revocare un servizio nella base comune revoca l’accesso diretto allo spazio.

## Cosa questa consegna non completa

Restano da costruire i registri operativi di documenti/portfolio, onboarding, capacità, obiettivi e KPI; DNA, strategia e mese editoriale BigAnt compilati; pacchetti, listini e proposte del Direttore; specialisti e connettori reali; tutte le differenze di migrazione indicate nella matrice. Queste righe passano al massimo da **ASSENTE** a **SOLO STRUTTURA**, mai a funzione completata. Nessun deploy, modifica Railway, dato reale o invio.
