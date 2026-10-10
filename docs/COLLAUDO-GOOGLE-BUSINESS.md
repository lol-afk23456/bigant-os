# Google Business Profile — preparazione e collaudo locale

10 ottobre 2026 · FUN-012, FUN-013, COL-002 · ramo bigant-os-notte-1.

Il percorso GBP è implementato e provato con Google completamente sostituito da risposte inventate. Nessun account, recensione o dato cliente reale acquisito; nessun rilascio o collegamento esterno. [Procedura operativa e fonti ufficiali](SOP-GOOGLE-BUSINESS.md).

## Cosa cambia

Collegamenti contiene credenziali e consenso GBP separati da Gmail/Calendar. Il socio sceglie account e scheda fra i risultati autorizzati, conferma l'attività, prova la lettura e attiva il servizio dopo aver confrontato i dati. L'aggiornamento giornaliero è facoltativo; Aggiorna ora rimane manuale. Il client OAuth richiede business.manage, ma il codice delle schede esegue soltanto GET: nessuna risposta alle recensioni né modifica su Google.

Profili → Google Business Profile mostra scheda, prima pagina di recensioni (fino a 50), eventuali totale/media ricevuti e tre serie giornaliere: clic al sito, chiamate e indicazioni. Il periodo richiesto è di 28 giorni, concluso tre giorni prima. Giorni e serie assenti restano mancanti; il valore omesso in un punto datato corrisponde allo zero definito da Google ed è indicato come tale. Non si sommano le serie né si inventano statistiche.

La copia resta in RAM, fino a 24 ore dall'inizio dell'acquisizione, entro 64 attività e 8 MiB. Non entra in SQLite, audit, backup, AI, Growth o report persistenti. Date e provenienza sono visibili; la lettura storica non implica dati ancora disponibili. Il browser elimina la copia visualizzata alla scadenza senza interrogare Google. Il riavvio perde la cache: occorre una nuova lettura manuale o il successivo giro giornaliero autorizzato.

Il cliente può leggere soltanto dati della propria attività, con servizio locale attivo e configurazione autorizzata. Nessuna gestione per i collaboratori in questo percorso. Il menu cliente definitivo resta in attesa del giro dedicato. Per un'attività senza servizio il socio conserva i link pubblici e vede la mancanza del servizio; il cliente non riceve dati GBP.

## Prove riproducibili

**Suite completa: 652/652, zero fallimenti, test cancellati o saltati.** Sono 71 nuove prove rispetto alle 581 precedenti. Ambiente privo di variabili reali; trasporti Google sostituiti. Log tecnico escluso da Git: `.cache/gbp-full.log`.

| Gruppo | Test | Evidenza |
|---|---:|---|
| OAuth separato | 15 | tests/business-profile-oauth.test.js: PKCE, stato/sessione/scadenza, scope, identità verificata, chiavi indipendenti, token cifrati, refresh concorrente e revoche |
| Runtime | 22 | tests/business-profile.test.js: selezione vincolata, permessi e servizi, versioni, cache/riavvio/limiti, race durante richieste, attivazione dopo prova, pausa, worker e revoca dei soci |
| Adattatore Google | 7 | tests/business-profile-provider.test.js: endpoint/metodi fissi, limiti, URL, token pagina, dati incompleti, serie sparse, errori e controlli dopo attese |
| Applicazione HTTP completa | 7 | tests/business-profile-http.test.js: composizione OAuth/provider/UI DTO, sessione/Origin/CSRF, flag DEMO/reale, letture pure, isolamento, revoca e worker |
| Interfaccia | 19 | tests/business-profile-ui.test.js: stati, escaping, date/scadenza, dati mancanti/zero, scelte esplicite, callback e risposte tardive |
| Avanzamento | 1 aggiuntivo | tests/platform-progress.test.js: GBP non promuove gli altri canali; niente dati grezzi nel riepilogo |

Esecuzione nel runtime Node 24.19.0 del progetto: `node --test tests/*.test.js`. Le prove HTTP in memoria usano il vero handler; i test precedenti che aprono socket ascoltano soltanto sul loopback. Una fixture precedente aveva sessioni basate sull'ora del Mac e dominio impostato a mezzogiorno: la scadenza inventata ora è valida per entrambi gli orologi, senza indebolire i controlli del codice.

Revisione indipendente: trovato e corretto il salvataggio di un link pubblico che restituiva una risposta priva del nuovo stato GBP. Il wrapper ora ricompone Profili senza rete; test HTTP con cache attiva. Nessun ulteriore difetto concreto nella revisione finale. Il giro automatico è limitato a cinque attività per passaggio; gli esiti falliti attendono almeno 24 ore, senza retry ravvicinati. Questa revisione non certifica assenza di vulnerabilità e non sostituisce T7.

## Browser

Fixture locale `.cache/riordino-browser/gbp-ui.mjs`, dati inventati e indicazione visibile «COLLAUDO LOCALE · Google simulato». Il consenso iniziale è predisposto dalla fixture: nessuna pagina Google reale aperta. I permessi della composizione reale sono verificati separatamente nei test HTTP.

Percorso osservato: accesso Socio DEMO → Profili → Google Business Profile → account → scheda → riepilogo e conferma → lettura di prova → recensioni e serie disponibili → attivazione con due caselle inizialmente vuote. Aggiornamento giornaliero selezionato esplicitamente. Stato attivo e provenienza verificati nella pagina; metriche sparse e numero 12 letti dalla fixture. Eseguiti anche Aggiorna ora e Sospendi lettura: dopo la sospensione i dati scompaiono, la frequenza torna disattivata e resta distinta la data storica.

Desktop 1280 px; mobile 390×844 px senza scorrimento orizzontale, dialogo largo 356 px. Controllati modulo di attivazione, fonti e recensioni. Console senza errori osservati. Compattato l'avviso di indirizzo pubblico assente per lasciare spazio ai dati del collegamento.

Immagini nella cache tecnica del progetto: `bigant-gbp-final.png`, `bigant-gbp-mobile-dialog.png`, `bigant-gbp-mobile-reviews.png`, `bigant-gbp-paused.png`. Anteprima terminata e scheda chiusa; dimensioni del browser ripristinate e immagini temporanee trasferite nel progetto. Non è una prova su telefono fisico, fornitore Google reale o server Railway.

## Copertura e passo reale successivo

FUN-013 è implementata in locale: le recensioni si leggono dentro GBP, senza voce separata. FUN-012 resta parziale perché gli altri canali e il giro cliente non sono conclusi. COL-002 passa a parziale: il percorso GBP esiste, ma mancano accesso approvato al progetto Google, account/scheda pilota autorizzati e confronto con i dati originali. Conteggio delle 92 voci: **60 implementate localmente, 14 parziali, 18 da fare**. Nessuna equivalenza con completamento dell'intero brief o di T0–T10.

Prima dell'uso reale: approvare una scheda pilota e il suo perimetro, verificare progetto/API/quote, configurare le chiavi nella custodia del server e l'URL callback esatto, quindi collaudare il consenso, la corrispondenza della scheda e i ruoli. Attivare il flag e la frequenza soltanto nella tranche autorizzata. Costo API pubblicamente indicato come gratuito, ma disponibilità e quote non verificate sull'account; [registro costi](COSTI.md) ancora da riconciliare. Nessun consumo applicativo reale avviato.

Controllo finale del progetto **5/5**: 136 file JavaScript, 78 documenti, 158 link locali, registro/SOP e quattro dipendenze fissate verificati. Log `.cache/gbp-check.log`; nessuna nuova dipendenza o file cliente.
