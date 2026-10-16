# Collaudo locale del primo incarico social AI

10 ottobre 2026 · S01, FUN-053/FUN-048. [Procedura](SOP-AGENTE-SOCIAL.md). Primo percorso operativo predisposto, con attivazione reale ancora spenta. Le 92 voci restano 60 implementate localmente, 14 parziali e 18 da fare; FUN-053/FUN-055 ancora parziali.

## Percorso verificato

Configurazione salvata → prova tecnica corrente → autorizzazione separata del socio → attività e incarico → anteprima del pacchetto → consenso alla singola elaborazione → risposta controllata → bozze in “Da approvare”. L’autorizzazione è legata alla versione delle istruzioni, del collegamento e della prova. Sospensione o modifiche impediscono nuovi incarichi e il salvataggio di risposte già in corso.

Il fornitore riceve soltanto il pacchetto mostrato: nome/identificativo dell’attività, incarico e memoria non amministrativa con fonti/versioni, oltre alle istruzioni salvate. Nessun accesso a cartelle, email, contabilità, account social o memoria di altre attività. I trasporti OpenAI/Anthropic sono condivisi con le prove tecniche, con destinazioni fisse, nessuno strumento eseguibile, risposta limitata e nessun retry. Tutte le chiamate di questo collaudo sono simulate.

## Prove automatiche

- 11 nuovi test in `tests/agent-work.test.js`: autorizzazione e sospensione, isolamento del pacchetto, bozze e provenienza, approvazione del collaboratore assegnato sulla versione esatta, prerequisiti, concorrenza/idempotenza, revoche durante le attese, controlli qualità bloccanti, schema/errori/budget, HTTP/CSRF e riavvio senza reinvio. Verificati anche stato, costo e risultato nella postazione Ufficio.
- 5 nuovi test in `tests/swarm-workspace-ui.test.js`: anteprima e consenso, doppio invio/risposte tardive, autorizzazione sulle versioni esatte, storico del cliente corretto e postazione Ufficio.
- Corretta la fixture dell’ultimo test OAuth GBP: il costruttore senza vault ora riceve lo stesso orologio della sessione inventata. Il primo giro completo aveva fallito quel test per scadenza legata all’ora reale; nessun cambiamento al codice Google per risolverlo.
- Suite completa: **703/703**, zero falliti, saltati, cancellati o TODO. Log `.cache/agent-work-full.log`. Controllo progetto **5/5**, log `.cache/agent-work-check.log`.

## Browser

Database in memoria, account DEMO, budget e chiavi inventati, trasporto finto. Sul desktop: autorizzazione senza checkbox respinta, autorizzazione esplicita, anteprima delle sole informazioni del laboratorio inventato, consenso vuoto respinto, elaborazione singola e apertura della bozza. La bozza compare in “Da approvare” con provenienza “Specialista social · AI” e revisione umana necessaria. Il dialogo di approvazione è stato aperto e annullato; nessuna approvazione automatica. La postazione Ufficio mostra “In attesa di approvazione”, la stima di 0,40 € e apre il risultato corretto.

Sul telefono a 390×844: nuova anteprima con etichette italiane, memoria espansa leggibile, annullamento senza seconda elaborazione e sospensione. Dopo la sospensione l’agente torna “AI pronta” e scompare “Nuovo incarico AI”. Documento largo 390 px e dialogo 356 px, nessuno scorrimento orizzontale. Console senza errori osservati. Screenshot `.cache/riordino-browser/bigant-agent-work-desktop.png` e `bigant-agent-work-mobile.png`. Anteprima terminata, tab chiusa, viewport ripristinata; temporanei trasferiti nel progetto.

## Limiti

Solo social S01, avvio manuale e bozze: nessuna programmazione o pubblicazione. Gli altri agenti non acquisiscono un percorso operativo per il solo fatto di superare una prova tecnica. I controlli automatici intercettano alcuni errori, ma non certificano veridicità o qualità commerciale. Costi espressi come stime, non come fatture; consumi reali ancora da riconciliare. Revisione del codice e dei test svolta dal parent, senza una nuova revisione indipendente.

Primo collaudo con account/modelli reali, scelta del fornitore, verifica dei prezzi, attivazione e trasferimento di dati restano da autorizzare. Nessun nuovo pacchetto, dato cliente reale, chiamata applicativa a pagamento, push o rilascio. T4 e le altre task T0–T10 mantengono il loro ordine; questa tranche non chiude il riordino.
