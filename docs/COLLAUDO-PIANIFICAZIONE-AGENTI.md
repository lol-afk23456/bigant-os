# Pianificazione Social — prove e limiti

FUN-055, 10 ottobre 2026. [SOP](SOP-PIANIFICAZIONE-AGENTI.md). Dalla singola scheda agente: «Quando lavora» sceglie un incarico ricorrente per la sola attività selezionata, dopo configurazione, prova e autorizzazione dell’agente. La prima implementazione riguarda Social; Qualità resta manuale.

## Comportamento verificato

- Anteprima senza chiamate al fornitore: testi, fonti/versioni, fornitore configurato, frequenza, costo per esecuzione, prima data e scadenza del consenso. Casella di conferma inizialmente vuota; validità dell’anteprima 10 minuti, del consenso 30 giorni. Nessun avvio al salvataggio.
- Alle 09:00 di Roma secondo la frequenza configurata. Cambio dell’ora coperto; nessuna raffica di recuperi dopo un fermo. Una sola presa in carico per scadenza, anche con chiamate concorrenti nello stesso processo.
- Attività e agente Attivo, socio autorizzante corrente, servizio social acquistato, fonti ammesse, configurazione/chiavi/prova/consensi verificati prima e dopo il trasporto. Fonti nuove o modificate, revoca, pausa, scadenza e interruttori spenti sospendono il piano. Una sostituzione del piano non riceve il risultato del lavoro precedente.
- Budget comune controllato a ogni esecuzione: costi non riconciliati nel nuovo mese, tetto insufficiente, errore del fornitore o rilievi bloccanti sospendono; nessun tentativo automatico. Costi già impegnati conservati per la riconciliazione.
- Ripartenza del processo: occorrenze in corso marcate interrotte, anche se il job non era ancora stato creato; pianificazione sospesa. Storico e versioni del consenso immutabili.
- API riservate ai soci, sessione e CSRF; consenso di un cliente non riutilizzabile per un altro. Il percorso DEMO non abilita pianificazioni AI reali. Risposte tardive o cambio pagina/cliente/sessione non salvano né mostrano dati nella vista successiva.
- Bozze nel normale percorso DA APPROVARE, nessuna data di pubblicazione impostata e nessuna approvazione automatica.

Browser locale con dati inventati e trasporto simulato: anteprima, consenso, salvataggio, riapertura e sospensione. A 390 px: documento 390 px, finestra 356 px, nessuno scorrimento orizzontale; zero errori console. Corretto durante il collaudo un errore di visualizzazione delle date nella conferma salvata. Immagini nella cache: `pianificazione-desktop.png`, `pianificazione-mobile.png`, `pianificazione-salvata.png` sotto `.cache/riordino-browser/`.

Suite finale **814/814**, zero prove saltate; controllo progetto **5/5**. Log in `.cache/schedules-full-suite.log` e `.cache/schedules-check.log`. Verifica indipendente mirata senza difetti riproducibili nel perimetro esaminato.

## Limiti

Nessuna attivazione reale: `BIGANT_SCIAME_SCHEDULES_ENABLED` è spento per impostazione predefinita. Sono ancora necessari il primo incarico manuale reale collaudato, fonti/autorizzazioni valide e budget riconciliato. Nessuna prova onerosa o pubblicazione è stata effettuata. L’avvio assume una sola istanza scrivente sul database, come gli altri worker: una distribuzione con più repliche richiederebbe un coordinamento distinto. FUN-055 resta parziale; gli altri agenti non ricevono automaticamente un’autorizzazione ricorrente.

## Pubblicazione

Codice `9e3e543`, Railway `9b870574-f4cf-4a7a-a8b9-3cb6d4e94168` SUCCESS. Backup `ac26d2b4-1c59-4b93-9d1a-48de9f566c4f` alle 19:32, 801 MB referenziati. Alle 19:34 health e impronte dei file verificati, tre API anonime 401; socio nel browser: «Pianificazioni AI spente sul server», zero errori console. Evidenza `.cache/schedules-release-verification.json` e immagine `.cache/riordino-browser/pianificazione-online.png`. Nessuna attivazione reale.
