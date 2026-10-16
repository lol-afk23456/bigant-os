# La struttura dell’intera agenzia

8 ottobre 2026, passaggio a Claude Code. **32 procedure DEMO eseguibili; servizi e integrazioni reali ancora incompleti.** Gli agenti producono piani, controlli e bozze specifici: non equivalgono a 32 servizi autonomi consegnati.

L’ultima copertura misurata è **30,2% (62/205)**, riferita esclusivamente al [brief notturno originale di 567 righe](BRIEF-NOTTE-ORIGINALE.md); per l’agenzia oltre Growth/Fidelity è **14,9% (17/114)**. Il [nuovo brief integrale di 2184 righe](BRIEF-BIGANT.md) **non è stato misurato**. La [matrice](VERIFICA-COPERTURA-BRIEF.md) conserva il vecchio denominatore e gli stati precedenti, aggiornando prove e lacune: queste percentuali non descrivono il perimetro ampliato.

**Ultima suite completa: 160 test superati su 161.** Rimane `tests/agency.test.js:31–34`, che conserva l’aspettativa `implemented:false` per eventi ora disponibili come eventi DEMO locali. Il test va riallineato e la suite rieseguita. In questa consegna soltanto documentale non viene corretto; non si dichiara tutto verde.

## Tre ingressi nella stessa app

- **Mappa agenzia:** otto reparti, 32 procedure DEMO descritte e avviabili dalla regia, 27 servizi, dieci moduli gestionali e nove aree ancora da sviluppare. È riservata ai soci.
- **Marketing BigAnt:** tutti i canali dell’agenzia e dei soci, DNA, strategia, calendario, portfolio, Google, sito, acquisizione, ADV e misure. Legge sempre il cliente zero `demo-bigant`, anche se prima era selezionata un’altra attività.
- **Servizi:** uno spazio per ogni servizio, con sezioni specifiche, input, consegne, specialisti, modalità di erogazione, approvazione, limiti e fonti. Task, contenuti e approvazioni presenti vengono letti dall’archivio comune per quel cliente e servizio.

Le schede dell’agenzia restano di sola lettura; la **regia dello sciame** avvia una procedura o un giro DEMO, permette di leggere l’elaborato e di passarlo nella coda delle approvazioni. Il giro BigAnt usa fixture dichiarate per gli specialisti; i prerequisiti dei moduli (per esempio consensi o programmi) restano obbligatori. Le azioni non attivano servizi esterni.

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
| `src/agents/catalog.js` | Ambito consentito per ciascun agente, servizi necessari e otto eventi DEMO locali. |
| `src/agents/core.js` | Sette procedure centrali: Direttore, Marketing, Account, Social, Qualità, Reporter e Amministrazione. |
| `src/agents/modules.js` | Quattro adapter verso Growth e Fidelity, con prerequisiti verificati e approvazioni dei moduli. |
| `src/agents/specialists.js` | Ventuno procedure pure specifiche: storyboard, audit delle fixture, piani e controlli; nessuna rete. |
| `src/agents/outputs.js` | Elaborati, fotografia degli input/fonti/SOP, versioni immutabili, revisioni, approvazioni e feedback. |
| `public/app.js`, `public/style.css` | Mappa, Marketing, workspace del servizio e dashboard cliente. Una vista parametrica evita 27 interfacce divergenti. |
| `tests/agency.test.js` | Verifiche della struttura, permessi e stati; un test sugli eventi conserva una vecchia aspettativa e fallisce. |
| `tests/specialists.test.js`, `tests/module-agents.test.js`, `tests/swarm.test.js` | Prove specifiche, adapter dei moduli e giro dei 32 agenti, isolamento, fonti, versioni, input modificati, gate e assenza di effetti esterni. |
| `scripts/demo-all-agents.js` | Collaudo dei 32 agenti in database temporaneo con consensi inventati soltanto per il test isolato; non modifica archivi salvati. |

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

L’orchestratore coordina **32 procedure deterministiche locali**: sette centrali, quattro adapter dei moduli (ricerca, analisi, commerciale e Fidelity) e 21 specialisti. La precedente descrizione “21 pianificati” è superata. Il giro isolato produce 32 elaborati con fonti e approvazioni, a costo API zero e senza effetti esterni.

Gli specialisti producono lavoro specifico: per esempio Video prepara sei scene con tempi; ADS undici leve; SEO controlla title, meta, H1 e indicizzazione delle pagine fornite; Booking verifica i conflitti; Ecommerce e Merch calcolano soltanto da importi completi; Reception usa FAQ approvate; Local e Multisite confrontano anagrafiche; Reputazione prepara risposte. Le altre procedure coprono accessibilità, social commerce, display, TV, verticali, branding, eventi, drone, Video AI e direzione creativa. Le [SOP degli specialisti](SOP-SPECIALISTI-DEMO.md), [della regia](SOP-REGIA-DEMO.md) e [dei moduli](SOP-AGENTI-MODULI.md) descrivono lavoro e limiti. Non costruiscono automaticamente siti, generano video, conducono voli, pubblicano campagne o certificano conformità.

I calendari disponibili sono giornaliero, lunedì, venerdì e primo del mese, alle 09:00 Europe/Rome. Gli otto eventi locali sono `lead.created`, `client.created`, `content.ready`, `content.approved`, `contract.signed`, `review.created`, `objective.changed` e `brief.approved`. Input, versione e deduplica vengono conservati. Recensioni, obiettivi e brief possono essere segnalati come eventi DEMO espliciti; non provengono da provider collegati. Un contratto registrato DEMO non prova una firma reale. Ogni regola deve essere attivata esplicitamente: leggere la mappa non ne avvia nessuna. Questa estensione rende obsoleta l’aspettativa del test agency ancora aperto.

Ogni specialista dichiara la memoria del cliente e le parti mancanti. La memoria operativa supporta master, DNA, strategia, feedback e report; i rifiuti degli elaborati tornano come feedback specifico dell’agente. Input, versioni delle memorie e SOP sono fotografati nell’output. Calendario, cruscotto e decisioni non sono ancora tutti documenti editabili. `04_ACCESSI` e credenziali restano esclusi. Amministrazione legge il proprio dominio riservato; il Direttore riceve aggregati DEMO, senza movimenti grezzi. Gli elaborati interni rimangono ai soci; la bozza social destinata al cliente non copia le memorie riservate.

Tetto comune 50 €/mese, **costo API zero per le procedure locali**, non costo zero del futuro servizio reale. Modelli, licenze, partner e hosting futuro richiedono valutazione distinta. La coda verifica ruolo, cliente, servizi, pausa e tetto; una revoca impedisce l’esecuzione o sospende la regola. I moduli restituiscono prerequisiti mancanti senza inventare consensi. Nessun consenso salvato viene attivato dal giro di prova.

## API e accessi

| Richiesta | Accesso / risultato |
|---|---|
| `GET /api/agency/state` | Solo soci. Registro intero, moduli, reparti e contratti. |
| `GET /api/agency/marketing` | Solo soci. Dati comuni del cliente zero BigAnt, canali/aree vuoti dove mancano. |
| `GET /api/agency/services/:id?clientId=…` | Socio: anche anteprima servizio non acquistato. Cliente/team: soltanto cliente consentito e servizio acquistato. |
| `GET /api/agency/dashboard?clientId=…` | Sezioni cliente filtrate per servizi acquistati; niente amministrazione o CRM commerciale dell’agenzia. |

Le API `/api/agency/*` rifiutano POST/PATCH/DELETE. La regia usa le API separate `/api/agents/*` per avvio, coda, pianificazioni, eventi ed elaborati. Al cliente vengono restituiti consegne, stato e specialisti nominati, non i contratti interni con capacità, costi e permessi. Il workspace non accede ai lead Growth o ai movimenti contabili: usa soltanto lavori, contenuti e approvazioni pertinenti. Revocare un servizio nella base comune revoca l’accesso diretto allo spazio.

## Cosa questa consegna non completa

Restano da completare i registri operativi di documenti/portfolio, onboarding, capacità, obiettivi e KPI; DNA e strategia validati; mese editoriale completo con asset approvabili; business case, pacchetti e listini verificati; realizzazione materiale dei servizi, modelli AI e connettori; differenze di migrazione indicate nella matrice. Le bozze generate non completano questi requisiti. L’adozione operativa delle SOP e il pilota richiedono verifica umana.

Prima di proseguire occorre riallineare l’unico test aperto e rileggere il nuovo brief integrale, costruendo la sua matrice senza riutilizzare impropriamente il 30,2%. Il codice del primo salvataggio è nel commit locale `569c70d` e nella copia GitHub `cc1585e`; questo aggiornamento è soltanto documentale. **Nessun deploy, modifica Railway, dato reale o invio.**
