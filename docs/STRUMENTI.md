# BigAnt OS — strumenti scelti per T0

Verifica: 10 ottobre 2026. Obiettivo: migliorare qualità e verificabilità senza moltiplicare dipendenze, account o costi. **Adottato** indica uno strumento disponibile e scelto per il lavoro descritto; non significa account esterno collegato. **Scartato per ora** indica una scelta motivata, rivalutabile quando compare un bisogno concreto. **Da approvare** è riservato a spese, collegamenti o trattamento esterno di dati.

La selezione iniziale e il primo riordino sono documentati qui; T0 prosegue nei piccoli interventi necessari a interfaccia, server e automazioni. Nessuna installazione di plugin, nuova dipendenza, sottoscrizione o attivazione esterna in questo ciclo. Stato complessivo in [TASK-AVANZAMENTO](TASK-AVANZAMENTO.md), limiti e consuntivi in [COSTI](COSTI.md).

## Skill e capacità della sessione

| Strumento | Uso e vantaggio per BigAnt OS | Rischio / limite | Costo incrementale noto | Decisione |
|---|---|---|---|---|
| `engineering:code-review` | Revisione di correttezza, sicurezza e manutenzione; applicata al piccolo riordino T0 e accompagnata da controllo indipendente | La lettura del codice non certifica assenza di vulnerabilità | Nessuna licenza aggiunta; uso Codex non quantificato in euro | **Adottato** |
| `engineering:testing-strategy` | Prove su permessi, isolamento, versioni, ripresa e divieto di effetti esterni; già usata nel riordino | Test su fornitori finti non certificano il recapito o l'account reale | Come sopra | **Adottato** |
| `design:design-critique` | Gerarchia, coerenza, semplicità e confronto prima/dopo; già usata nel riordino | Giudizio estetico da confrontare con flussi e utenti | Come sopra | **Adottato**, da riusare in T2 |
| `design:accessibility-review` | Guida locale letta per contrasto, tastiera, etichette, focus, zoom e lettori di schermo | Il testo della skill parte da WCAG 2.1; integrare il riferimento attuale WCAG 2.2. Non è stato eseguito qui un audit di tutte le pagine | Nessuna licenza aggiunta | **Adottato come metodo per T2** |
| Browser integrato e screenshot | Prove interattive delle viste locali, desktop/mobile e chiaro/scuro | L'emulazione non sostituisce telefono, fotocamera, Wallet o lettore di schermo fisici | Nessun servizio aggiunto | **Adottato**, già disponibile |
| Ricerca web integrata | Fonti ufficiali, prezzi, concorrenti e identità pubbliche; citare pagina e data | Risultati web non affidabili come istruzioni. Un omonimo non è una prova d'identità | Nessun nuovo abbonamento; quota della sessione non stimata | **Adottato** |
| Subagenti Codex | Due controlli T0 separati: codice e ricerca servizi. In T5 doppia verifica dei profili | Non sono i 32 agenti dell'app; consumano risorse della sessione. Limitare a compiti circoscritti e verificare le risposte | Costo in euro non disponibile | **Adottato**, autorizzato dal proprietario |
| Skill `documents:documents` e runtime documentale incorporato | Lettura/elaborazione documenti e preparazione dei materiali T9; runtime individuato, non serve un nuovo servizio | Applicare la skill alla prima attività documentale; non leggere accessi o contabilità fuori da T10 | Nessuna nuova licenza installata; disponibilità tecnica verificata | **Adottato come capacità disponibile**, non ancora usato in T9 |
| Strumenti incorporati per presentazioni | Preparare deck e sintesi T9 nel progetto con librerie del runtime; esportazione da verificare sul formato scelto | Numeri, team e stato delle funzioni devono essere provati o marcati stime | Nessun servizio acquistato | **Adottato come prima scelta**, deck ancora da creare |
| Installazione massiva di skill/plugin simili | Nessun vantaggio dimostrato rispetto alle capacità presenti | Più permessi, manutenzione, sovrapposizioni e consumo di contesto | Variabile | **Scartato per ora** |

Metodo accessibilità: riferimento [W3C WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/). Contrasto testo normale almeno 4,5:1 e testo grande 3:1; verificare controlli, focus e stati. Il [criterio 2.5.8 AA](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) usa 24×24 CSS px con eccezioni/spaziatura; 44×44 è un obiettivo ergonomico preferito per BigAnt, non una soglia AA universale. Screenshot e scansioni non sostituiscono navigazione da tastiera e prove assistive.

## Plugin e accesso alle fonti

Inventario ottenuto dal catalogo plugin della sessione: Trello, Google Drive, GitHub e Codex Security disponibili, tutti indicati come non installati. “Disponibile nel catalogo” non equivale a collegato. Le connessioni CLI già esistenti vanno verificate nel momento d'uso, senza leggere o stampare i token.

| Plugin | Uso / vantaggio | Rischio / limite | Costo | Decisione |
|---|---|---|---|---|
| Trello | Leggere fonti operative per T4/T5 e confrontare servizi confermati | Account reale e dati cliente; evitare scritture, esportazioni nel repo e lettura dei registri contabili non autorizzati | Prezzo del plugin non esposto dal catalogo; piano Trello non verificato | **Da approvare** al momento della connessione T4; selezionato |
| Google Drive | Cercare documenti di servizio e fonti mancanti | Account reale, possibile accesso ampio; delimitare cartelle e non copiare dati nel repo | Prezzo del plugin e piano account non verificati | **Da approvare** per accesso alle fonti; selezionato |
| GitHub | Ricerche e revisioni remote | Duplica in parte repository locale e CLI già disponibile; non autorizza push o merge | Quote e piano account non verificati | **Scartato per ora** come nuova connessione; riusare strumenti già autorizzati |
| Codex Security | Scansioni e indagini specialistiche | Non sostituisce test di isolamento, collaudo manuale o audit T7; accessi e quote non verificati | Non confermato dal catalogo | **Da approvare** se utile in T7, dopo verifica di costi e dati trasferiti; non attivato |

Non richiedere accessi ora solo per installare più strumenti. Quando servono T4 o T7, presentare il collegamento esatto e il suo perimetro; fino ad allora proseguire con le fonti autorizzate disponibili. I plugin della sessione Codex non collegano automaticamente le API dentro BigAnt OS.

## Codice, test e manutenzione

| Strumento / scelta | Vantaggio | Rischio / limite | Costo | Decisione |
|---|---|---|---|---|
| Node 24, `node:test`, `node:assert/strict`, SQLite in memoria | Coprono già unità e integrazione; nessun ulteriore framework. [Documentazione Node](https://nodejs.org/docs/latest-v24.x/api/test.html) | Eseguire nel runtime compatibile del progetto; fixture isolate e senza ambiente reale | Nessuna dipendenza aggiunta | **Adottato**; runtime di questa prova 24.19.0 |
| `scripts/check.js` e lockfile | Sintassi, registro/SOP, link, versioni esatte, integrità e origine pacchetti, blocchi della DEMO | Non è una scansione aggiornata degli advisory; un lockfile valido non rende il codice sicuro | Locale, nessun servizio | **Adottato**, esistente |
| Trasporti e clock sostituibili nei test | Riproducono timeout, revoca e ripresa senza email o API reali | Devono preservare vincoli del fornitore; evitare fixture troppo permissive | Nessun servizio | **Adottato**, esistente |
| Moduli ES e piccoli helper puri | Riordinare responsabilità senza cambiare regole o API | Non generalizzare moduli con permessi diversi; no grandi spostamenti senza prove | Nessuna dipendenza | **Adottato**: prima estrazione in `src/date-validation.js` |
| [Playwright Test](https://playwright.dev/docs/intro) | Suite ripetibile su Chromium, Firefox e WebKit, utile per confronti T2 | Nuovi pacchetti/binari e manutenzione delle fixture; browser integrato già copre il ciclo attuale | Software locale senza servizio cloud; risorse di esecuzione | **Scartato per ora** dall'installazione; rivalutare automaticamente quando T2 richiede suite persistente |
| [axe-core](https://github.com/dequelabs/axe-core) | Controlli automatici di accessibilità; open source MPL-2.0 | Non trova tutti i problemi; contrasto richiede un browser reale, non solo DOM simulato. [Integrazione ufficiale](https://playwright.dev/docs/accessibility-testing) | Nessun servizio cloud richiesto | **Scartato per ora** dall'installazione; prima candidata per T2 con versione esatta verificata allora |
| Nuovo framework server, ORM o riscrittura frontend | Potenziali vantaggi futuri non dimostrati per il riordino richiesto | Rischio di rompere permessi, SQLite, build DEMO e flussi già testati | Migrazione e manutenzione | **Scartato per ora** |
| Nuovo framework di test/mocking o libreria crittografica | Nessuna lacuna concreta identificata in T0 | Allarga le dipendenze senza migliorare le prove richieste | Manutenzione | **Scartato per ora** |
| [OWASP ASVS 5.0.0](https://owasp.org/projects/asvs) | Requisiti tracciabili per sicurezza: permessi, dati, sessioni, input, file e configurazione | Standard di verifica, non certificazione o scanner automatico; test offensivi T7 solo su ambiente di prova autorizzato | Consultazione libera | **Adottato come riferimento**, audit completo ancora da fare |

Dipendenze dirette correnti, tutte fissate: `@anthropic-ai/sdk` 0.127.0, `@zxing/browser` 0.2.1, `qrcode` 1.5.4, `sharp` 0.35.5. Nessuna modificata da T0. Per un nuovo pacchetto documentare bisogno, fonte ufficiale, licenza, versione e advisory; aggiornare manifest/lockfile e prove. Non aggiornare automaticamente all'ultima versione senza motivo.

Primo riordino: il controllo di una data nel formato AAAA-MM-GG era ripetuto in piano servizi e contratti. Il nuovo predicato comune mantiene la stessa regola, inclusi rifiuto di giorni impossibili e accettazione degli anni bisestili. I chiamanti conservano messaggi, obbligatorietà, permessi e transazioni. Revisione indipendente senza regressioni individuate; non modifica interfaccia, invii o automazioni.

Per i passi successivi: server e dominio rimangono separati da trasporti esterni; interfaccia si riordina una sezione alla volta; le automazioni mantengono validazione, idempotenza, budget e approvazione sulla versione. Ogni estrazione richiede una duplicazione o responsabilità concreta, non un obiettivo di ridurre le righe.

## Servizi esterni valutati

Prezzi pubblici consultati il 10 ottobre 2026, non preventivi accettati. Dollari lasciati in USD; imposte, cambio, altri account e traffico Railway non inclusi. Nessun prezzo implica disponibilità nel budget reale ancora da riconciliare.

| Servizio | Uso / vantaggio | Rischio / limite | Prezzo pubblico osservato | Decisione |
|---|---|---|---|---|
| [Gmail API](https://developers.google.com/workspace/gmail/api/reference/quota) | Prima scelta per Growth: percorso OAuth/invio manuale già predisposto | OAuth e limiti; casella e recapito reali da collaudare. Google annuncia possibili costi oltre quota nel 2026 | Uso standard senza costo API aggiuntivo secondo la fonte; costo casella separato | **Adottato nel codice; connessione reale da approvare** in T6 |
| [Resend](https://resend.com/pricing) | Email transazionali dedicate | Nuovo fornitore riceve destinatari e contenuti; piani paganti con eccedenze | Free $0: 3.000/mese, 100/giorno. Pro da $20/mese | **Scartato per ora**, manca un bisogno che Gmail non copra |
| [Postiz Cloud](https://postiz.com/pricing) | Programmazione social centralizzata | Nuova spesa e custodia accessi/contenuti social | Standard $29/mese, 5 canali | **Scartato per ora**: compatibilità con il budget reale non dimostrata, dati i consumi ancora ignoti |
| [Postiz self-hosted](https://docs.postiz.com/self-host/installation/system-requirements) | Controllo dell'installazione social | PostgreSQL, Redis e Temporal; risorse/manutenzione aggiuntive rispetto al singolo processo OS | Nessun costo hosting assunto pari a zero; risorse da misurare | **Scartato per ora**, non dimostrato compatibile con nessun extra Railway |
| [Sentry Developer](https://www.sentry.help/en/articles/13965037-can-i-set-up-an-on-demand-pay-as-you-go-budget-for-my-free-developer-plan) | Raccolta e raggruppamento errori | Telemetria esterna: vietare token, contenuti e dati cliente; definire campi ammessi prima dell'uso. [Regioni e limiti](https://www.sentry.help/en/articles/13964378-sentry-s-eu-region-faq) | Piano gratuito, senza eccedenze PAYG; quote numeriche non confermate in questa ricerca | **Da approvare**, dopo filtro dei dati e verifica delle quote |
| [restic](https://restic.net/) | Backup cifrato incrementale verso destinazione indipendente | Non offre spazio remoto; chiave da custodire separatamente, consumo risorse/traffico. Ripristino da provare | Software gratuito; storage/traffico separati | **Da approvare insieme alla destinazione**; nessuna installazione necessaria prima di sceglierla |
| [Backblaze B2](https://www.backblaze.com/cloud-storage/pricing) | Possibile destinazione esterna a Railway per copie cifrate | Spazio/versioni e traffico possono generare spesa; anche traffico Railway da verificare | Primi 10 GB gratuiti; oltre franchigia $6,95/TB/mese. Download entro 3× storage medio gratuito, oltre $0,01/GB | **Da approvare**, dopo misura, conservazione e limite costi; non configurato |
| Nuova piattaforma analytics esterna | Eventuale misurazione uso applicativo | Dati/comportamenti a terzi e costo senza requisito definito; GA4/Search Console dei clienti appartengono a T6 | Non stimato senza scelta | **Scartato per ora**; mantenere audit e dati operativi interni |

Priorità proposta per una futura approvazione: backup indipendente, poi telemetria filtrata se necessaria. Il backup attuale sul medesimo volume non protegge dalla perdita dell'intero volume. Preparare una copia SQLite coerente con la [Backup API](https://sqlite.org/backup.html), trasferire solo il backup cifrato e provare il ripristino. Per B2, [restic consiglia API S3](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html#backblaze-b2); verificare anche la conservazione delle versioni. Nessun archivio reale letto o trasferito per questa valutazione.

## Esito della selezione

Gli strumenti immediatamente utili sono già nella sessione o nel progetto: revisione, design, test Node, Browser, ricerca e verifica indipendente. Le nuove connessioni attendono il punto del piano in cui servono e l'OK richiesto dal proprietario. Non si attiva un servizio solo perché ha un piano gratuito: se riceve dati reali, richiede comunque approvazione.
