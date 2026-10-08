# BigAnt OS: cosa funziona davvero e cosa è solo struttura

Analisi dell'8 ottobre 2026, fatta sul codice del ramo `bigant-os-notte-1`. I numeri sotto si ricontrollano con i comandi indicati in fondo.

## In una frase

La struttura è ampia e coerente: 8 reparti, 32 agenti, 27 servizi, 19 schede S01–S19, 61 tabelle e 183 test automatici verdi. Il "motore" però funziona solo nelle parti interne: permessi, lavori, approvazioni, amministrazione, CRM, Fidelity e sciame AI. Tutto quello che dipende dal mondo esterno non è collegato: Google, Meta, email, WhatsApp, fatturazione elettronica e pubblicazione.

## I numeri che contano

| Cosa | Totale | Funziona davvero | Solo struttura o da collegare |
|---|---|---|---|
| Collegamenti esterni (Google Ads, Meta, GA4, Search Console, scheda Google, Gmail, Wallet, SDI…) | 17 | 0 | **17 non collegati** |
| KPI delle schede servizio mostrati ai clienti | 80 | 5 calcolati dai dati interni (oggi DEMO) | **56 aspettano un collegamento**, 19 senza misura interna |
| Agenti del registro | 32 | **11 con intelligenza artificiale** (sciame: Orchestratore, Direttore Crescita, Marketing, Ricerca, Analisi gratuita, Proposta, Social, Local/GBP, Reputazione, Qualità, Amministrazione) | 21 sono procedure a regole fisse, senza AI |
| Requisiti del brief valutati (R-001…R-126, valutazione preliminare non ancora verificata) | 126 | 36 operativi, 39 DEMO | 43 solo struttura, 5 da collegare, 3 assenti |
| Requisiti del brief non ancora valutati | 251 (R-127…R-377) | — | da analizzare |

## Cosa funziona davvero (oggi su dati inventati)

- **Accessi e permessi**:
  - soci, collaboratori e clienti vedono solo ciò che spetta loro;
  - nessun cliente vede i dati di un altro;
  - l'economia è visibile solo ai soci;
  - tutto è verificato dai test.
- **Lavori, contenuti e approvazioni**:
  - il ciclo idea → produzione → da approvare → approvato → programmato, con versioni e storico delle decisioni;
  - il cliente approva dalla sua area;
  - la pubblicazione resta bloccata dal codice.
- **Amministrazione delle due ditte**:
  - prima nota con movimenti non modificabili, importi al centesimo e rettifiche proposte (mai automatiche);
  - fatture, incassi, scadenze;
  - contratto → canoni attesi → fattura da emettere;
  - avvisi su "cosa non torna".
- **Growth (CRM commerciale)** e **Fidelity (carte fedeltà)**: le funzioni dei due programmi originali, riportate dentro BigAnt OS.
- **Sciame di agenti con AI vera**, ma solo su un computer con Claude Code: oggi ha prodotto davvero piani marketing, controlli della scheda Google, risposte alle recensioni, analisi gratuite e controlli della prima nota. Il controllo Qualità ferma gli output non approvabili.
- **Ufficio virtuale**: vedi gli agenti al lavoro e il testo che scrivono in diretta.
- **Area cliente** con 9 sezioni, catalogo S01–S19 letto dal Playbook, registro di tutte le attività.

## Cosa è solo struttura (schermate pronte, motore assente)

- **Risultati per il cliente**: contatti, chiamate, prenotazioni, recensioni e spesa pubblicitaria compaiono come "collegamento mancante", perché nessuna piattaforma è collegata.
- **Pubblicazioni e invii**: social, scheda Google, risposte alle recensioni, email, WhatsApp e SMS sono tutti bloccati. Le bozze esistono, ma non escono dal sistema.
- **Fatturazione elettronica (SDI) e pagamenti**: le fatture sono bozze gestionali e non vengono trasmesse.
- **Report mensile in PDF, invio automatico dei report, preferenze di notifica, archivio dei materiali consegnati, filtri per periodo**: solo l'interfaccia.
- **21 agenti su 32** (per esempio video, drone, ADS, SEO, sito, e-commerce): oggi eseguono procedure a regole fisse. Non scrivono con l'AI e non toccano piattaforme.
- **Sito BigAnt e pagine dei servizi**: previste dal brief, non costruite.

## Perché oggi non si può ancora usare per il lavoro vero

1. **Le regole del prototipo vietano i dati reali**: solo dati DEMO, nessun invio. È una scelta di sicurezza; per cambiarla serve un tuo sì esplicito.
2. **Non c'è ancora un server condiviso**: la versione online gira nel browser di ognuno, quindi tu e Alfonso non vedete gli stessi dati.
3. **Mancano i collegamenti** alle piattaforme dei clienti. Ognuno richiede chiavi o autorizzazioni dei titolari degli account (elenco in `docs/DA-FARE-RAFFAELE.md`).

## La strada più corta verso l'utilità reale

1. **Sito pubblico su Railway**, la prova per tutti. È pronto in locale ma è bloccato dal controllo di sicurezza della sessione (vedi sotto).
2. **Primo uso reale su BigAnt stessa**, il "cliente zero": lo sciame lavora sui dati pubblici veri di BigAnt e prepara ogni settimana piano e post da approvare. Nessun dato di terzi coinvolto.
3. **Server condiviso per i soci** su Railway, con accessi veri (niente profili DEMO), database persistente e motore AI con chiave e tetto di spesa.
4. **Primo collegamento in sola lettura**: la scheda Google dei clienti, che è il lavoro di Vincenzo. Dà numeri veri a recensioni, chiamate e post.

## Come ricontrollare i numeri

```bash
npm test                      # 183 test
npm run scenario              # scenario a 13 passaggi
```

I conteggi di agenti, integrazioni e KPI vengono da `src/registry.js`, `src/sciame/agenti.js` e `src/servizi/kpi.js`. La valutazione preliminare dei requisiti è in `docs/copertura/valutazione-preliminare.json`.
