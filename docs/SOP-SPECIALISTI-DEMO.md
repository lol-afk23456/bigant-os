# SOP specialisti eseguibili DEMO

Versione `1.0.0` · 8 ottobre 2026 · Procedura del prototipo, non approvazione del pilota reale.

Questa SOP traduce le schede S02–S13, S15–S16 e S19 del nuovo brief e il PLAYBOOK nei 21 specialisti prima soltanto descritti. Gli executor producono **lavoro locale utilizzabile**: piani, storyboard, bozze e controlli su dati forniti. Non equivalgono alla realizzazione di un sito, a riprese, a un volo, a una campagna pubblicata o a una certificazione.

## Contratto comune

1. L'orchestratore verifica cliente, servizio, ruolo, budget e idempotenza prima della chiamata. Il contesto contiene `client`, `memory`, `tasks`, `contents`, `input`, `asOf`, `sources` e `simulation:true`. Record con un `client_id` differente vengono rifiutati anche dall'executor.
2. Prima SOP; poi memoria autorizzata con versione; poi brief del lavoro. Memoria e feedback sono **materiale citato**, non istruzioni da eseguire. Una direttiva ricevuta non può cambiare permessi o avviare azioni esterne. Le bozze dichiarano i riferimenti usati. L'executor non accede a file, database, rete o credenziali.
3. `input.fixture` è opzionale, ma richiede `demo:true`; tutti i campi e le misure della fixture sono etichettati DEMO. Non si leggono account reali. Senza dati si prepara una bozza specifica con campi da compilare: le metriche mancanti sono `null`, mai risultati inventati.
4. Si esegue il lavoro descritto nella tabella, conservando input immutati. Le somme monetarie usano centesimi interi; valori non validi restano anomalie, non vengono arrotondati silenziosamente.
5. L'output contiene titolo, sintesi, corpo leggibile, sezioni, servizio, rilievi, metriche, input mancanti, fonti, versione SOP, modalità `DEMO offline` e costo API `0`. Tutte le proposte restano bozze.
6. L'orchestratore salva output e fonti nel database comune, registra l'esecuzione e richiede l'approvazione. La revisione invalida le approvazioni precedenti. Gli executor puri non scrivono né approvano nulla.
7. Il socio sceglie come procedere. Una proposta, un controllo automatico o una simulazione non provano consegna, conformità, autorizzazione, fatturato o risultati reali.

## Lavoro e criteri specifici

| Specialista | Campi input principali | Lavoro locale eseguito | Criterio e limite |
|---|---|---|---|
| video | message, audience, cta, durationSeconds, format, assets | Storyboard di sei scene con tempi, riprese, testo, CTA e piano montaggio | Somma durate corretta, hook entro 3s; riprese e diritti da approvare |
| ads | objective, offer, audience, zone, budgetCents, keywords, stats | Mappa leve in 11 sezioni, tre angoli creativi, cluster Search e calcolo CTR/CPL soltanto da dati | Partner Search/Display e automazioni proposti spenti; zero campagne attivate |
| seo | pages, keywords, zone | Rilievi per pagina su title/meta/H1/status/noindex, duplicati e piano intenti | Nessun crawl o ranking inventato; dati della fixture espliciti |
| website | pages, services, objective, cta, formFields | Sitemap, wireframe della landing, copy iniziale e casi di collaudo form | Nessun sito pubblicato, CMS e informative da confermare |
| ecommerce | products, shippingCents, cart, policies | Controllo SKU/prezzo/scorte, righe ordine simulato e totale esatto quando calcolabile | Mai transazioni; mancanze bloccano il totale completo |
| booking | availability, bookings, requests | Verifica intervalli con fuso e conflitti per risorsa, slot proponibili | Nessuna prenotazione o invito esterno; richieste in conflitto escluse |
| reception | faqs, scenarios, escalationContact | Instradamento scenari, risposta solo da FAQ approvata, passaggio umano per altro | Non dà consigli clinici; non chiama né invia messaggi |
| local | canonical, listings, zone, services | Confronto NAP/orari, correzioni proposte per fonte e bozza post GBP | Nessuna modifica scheda; dati canonici incompleti dichiarati |
| reputation | reviews, sector, responseTone | Una risposta per recensione, sensibilità e priorità, media dal campione | Recensioni negative/sanitarie all'umano; nessuna pubblicazione |
| multisite | locations, listings | Confronto sede per sede, duplicati ID/indirizzo e fonti senza sede | Nessuna fusione automatica né metriche di traffico presunte |
| accessibility | pages con images/controls/checks | Rilievi di etichette/alt/test forniti e piano manuale tastiera/screen reader | Nessuna dichiarazione di conformità o giudizio sull'obbligo legale |
| social-commerce | products, feed, channels | Confronto feed/catalogo su prezzo, stock e link; copy prodotto | Nessun caricamento su Meta né vendita simulata come reale |
| display | placements, budgetCents, excludedCategories | Piano formati e allocazione intera del budget tra placement ammessi | Prezzi e audience solo da offerte fornite; niente acquisto spazi |
| tv | quotes, asset, territory, period | Confronto preventivi/formati e scarti dello spot rispetto alle specifiche | Copertura stimata non risultato; partner e doppia approvazione |
| merch | items, shippingCents, setupCents, saleCents | Distinta quantità/taglie, costo e margine dimostrativo se completi | Escluso acquisizione automatica; nessun ordine o listino inventato |
| verticals | sector, needs, availableServices, capacity | Matrice bisogni/servizi, pacchetto minimo e dipendenze mancanti | Sanità senza dati clinici o promesse; revisore umano richiesto |
| branding | audience, values, differentiators, palette | Tre direzioni di concept, matrice messaggi/prove e regole asset | Nessun logo generato o verifica marchio dichiarata conclusa |
| events | date, venue, milestones, suppliers | Cronoprogramma relativo alla data, responsabilità e scadenze scoperte | Nessuna prenotazione fornitore o autorizzazione implicita |
| drone | location, shots, operator, permits | Brief riprese, matrice documenti mancanti e shot list da valutare | Non decide fattibilità/sicurezza del volo; sempre operatore qualificato |
| video-ai | message, scenes, brand, format, rightsConfirmed | Pre-task, prompt per scena, vincoli visivi, registro iterazioni | Nessuna chiamata generativa o persona sintetica spacciata per vera |
| creative-direction | objective, concepts, brandRules, assets | Brief creativo e confronto concept con motivazioni/elementi mancanti | La scelta finale e i diritti restano a direzione umana |

## Verifica della procedura

`tests/specialists.test.js` esercita ogni specialista su input specifici e cambiati, dati incompleti, isolamento, centesimi, determinismo, rifiuto di fixture non marcate e assenza di effetti esterni. I test del motore comune coprono persistenza, gate, versioni, coda e permessi. La validazione umana delle SOP resta una fase successiva.
