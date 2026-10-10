# Decisioni — 8 ottobre 2026

| Decisione | Motivo e conseguenza |
|---|---|
| Nuovo repository privato bigant-os, ramo bigant-os-notte-1 | Mantiene intatti gli originali e consente revisione separata. Il primo README è stato scritto sul ramo notturno; main è solo il riferimento alla stessa base iniziale necessario alla PR. Nessun lavoro applicativo su main. |
| Monolite modulare Node 24.19.0 + SQLite nativo | Growth e Fidelity usano già Node24 e SQLite. Una connessione, una sessione e un pannello riducono costi e doppioni. Dipendenze fissate `sharp` 0.34.5 per loghi raster e `qrcode` 1.5.4 per codici QR; nessun servizio a pagamento aggiunto. Un'istanza e backup verificati saranno obbligatori prima del cloud. |
| Unificazione di dominio, non iframe o collegamenti tra app | Clienti, accessi, attività e dati devono essere comuni. Le logiche Growth e Fidelity sono adattate da fonti GitHub identificate negli inventari. |
| Ricerca clienti trattata come sottosistema Growth | Il codice verificato contiene già ricerca, analisi e pipeline. Non è emersa prova di un terzo repository autonomo; non ne viene inventato uno. |
| Stanotte solo dati DEMO e nessuna rete dall'app | Il nuovo brief vieta collegamenti reali. Le funzioni locali sono implementate; integrazioni e invii restano esplicitamente scollegati. Un'emulazione non prova la consegna Gmail o il rilascio Wallet. |
| Area amministrativa riservata ai soci | Titolare cliente, collaboratore e socio sono ruoli diversi. Nessun ruolo Fidelity legacy ottiene automaticamente privilegi BigAnt. |
| Due entità contabili distinte; nessun dato fiscale presunto | Il marchio non è una società. Soglie, bollo, accantonamenti e ritenute vanno confermati dal commercialista. |
| Movimenti originali immutabili; rettifiche con contromovimento e nuova registrazione | Ogni storno richiede socio, documento e motivo. Duplicati e cambio ditta sono bloccati. Un periodo chiuso resta chiuso: rettificare in un periodo successivo aperto richiede scelta esplicita. L'agente segnala, non cambia importi. |
| Contributo di cassa, margine stimato e consuntivo gestionale distinti | Le ore valgono solo con tariffa confermata dal socio, per ditta, cliente, persona e servizio. I compensi già registrati non vengono conteggiati due volte. Dati mancanti o sovrapposizioni sospendono il calcolo; costi comuni e utile fiscale restano non disponibili. |
| Database fonte operativa; Markdown come memoria versionata esportabile | Evita doppia compilazione Mac/Drive. Le proiezioni Markdown sono generate dal dato canonico; modifiche e feedback passano dall'app. Archivi reali non letti. |
| Fogli attuali ancora fonte reale | Il prototipo non li sostituisce. Collegamento futuro inizialmente in sola lettura con confronto saldi e approvazione dei soci. |
| Budget di progetto assunto €50 complessivi, hosting incluso | Interpretazione prudente della richiesta precedente. Le buste sono limiti di pianificazione, non prezzi o costi reali misurati. Nessuna spesa stanotte. |
| Arancione #F26B21 | È il colore nel nuovo brief; prevale sul vecchio #E16332 usato dalle app originali, che restano inalterate. Logo originale BigAnt riusato. |
| Foto e merch nel catalogo operativo, esclusi dalla prima acquisizione | Concilia catalogo ampio del nuovo brief con precedente esclusione dei servizi a margine insufficiente. |
| PED conservato, integrazione futura via contratto dati/API | UI autenticata ispezionata in sola lettura: dashboard, workspace, chat, notifiche, approvazioni, revisioni, calendario, tracciamento manuale e attività. Il client Supabase 2.45.0 è osservabile; schema, RLS, backend e hosting non sono verificati. Prima ottenere sorgente/API da Alfonso e verificare dati/permessi. |
| Agenti deterministici prima dei modelli esterni | Il prototipo esegue regole, fixture, controlli e bozze a costo API zero. Le specializzazioni pianificate restano indicate come tali. Schedules e code sono locali: nessuna promessa di attività autonoma mentre il server è spento. |
| Approvazione interna separata dall'esecuzione esterna | L'approvazione riguarda un contenuto o una campagna e la sua versione. Non collega il provider né prova una pubblicazione. `PROGRAMMATO` indica una data nel calendario DEMO; canali social e invii restano scollegati. |
| Locale ora, cloud soltanto nella fase successiva | Server vincolato a loopback, fixture DEMO e nessun deploy. Railway è stato consultato in sola lettura. Il porting non modifica le applicazioni Growth, Fidelity o PED esistenti. |
| UI italiana senza termini da sviluppatore nei flussi normali | Gli stati dicono cosa funziona, cosa è demo e cosa manca. I dettagli tecnici stanno nei documenti di progetto. |
| Copia testuale reversibile delle immagini del marchio | Il caricamento browser dei PNG su GitHub resta bloccato, mentre i file testo vengono trasferiti. Le copie `.png.base64` conservano gli stessi byte originali, verificati con SHA-256; il server restituisce i PNG sugli stessi due indirizzi. Nessun ridimensionamento o modifica del logo. |
| Salvataggio remoto tramite interfaccia GitHub | La sessione autorizzata è nel browser. I commit remoti raccolgono gli stessi file per cartella e non hanno gli stessi identificativi dei commit tecnici locali. Nessuna riscrittura della storia o force push. Prima di proseguire in una sessione futura, usare come base il ramo remoto e confrontare i file. |

Decisioni provvisorie di implementazione ammesse dal brief notturno; pubblicazione, acquisti e migrazione reale richiedono la decisione successiva dei soci.

## Correzione dopo verifica integrale del brief

L’audit precedente al nuovo codice è congelato su `8750e80` e salvato nel commit `1635c8e`. La copertura funzionale usa 205 requisiti, senza punti parziali: documentazione, esclusioni e segnaposto sono separati. Il denominatore resta invariato durante questa revisione.

Prima ampliare la struttura a tutta l’agenzia: registro per dominio e workspace parametrico per servizio, con contratti distinti, anziché decine di cartelle vuote o app separate. I dieci moduli sono esattamente quelli del brief; compensi e quadratura sono sezioni. Mappa e Marketing sono riservati ai soci, Marketing è sempre sul cliente zero. Le nuove API leggono soltanto e non attivano agenti. Gli eventi futuri restano dichiarati non implementati; specialisti pianificati con costo sconosciuto, mai zero presunto. Prove e limiti sono in STRUTTURA-AGENZIA e VERIFICA-COPERTURA-BRIEF.


## Passaggio a Claude Code — 8 ottobre 2026

La richiesta finale del proprietario interrompe lo sviluppo e chiede due salvataggi e una consegna completa nel repository. Nessun nuovo goal viene attivato dal titolo del documento allegato. Il brief viene conservato come fonte del lavoro futuro; non autorizza a continuare sviluppo o deploy durante la consegna.

- I 32 agenti ora hanno procedure DEMO locali; non sono 32 modelli AI collegati e non completano il catalogo. I vecchi stati di 7 eseguibili, 4 nel modulo e 21 pianificati sono storici e superati nel solo perimetro procedurale.
- I rapporti agenti restano ai soci, perché includono memoria interna. Per Social, Growth e Fidelity si mantiene l'approvazione canonica nel modulo; nessuna doppia decisione. Un esito con prerequisiti non diventa approvabile modificandone il testo.
- Calendari e otto eventi sono implementati localmente, ma richiedono regole attivate; recensioni, obiettivi e brief non hanno provider. Il nome evento `contract.signed` indica registrazione DEMO, non firma effettiva.
- Il report restituisce l'esito reale: 160/161 test. Non si corregge il test durante l'incarico di sola consegna; il prossimo agente deve verificarlo e aggiornarlo. Il giro unico 32/32 non sostituisce lo scenario aziendale a 13 passaggi del nuovo documento.
- Il documento integrale più recente (2.184 righe) sostituisce come fonte `BRIEF-BIGANT.md`; la copia originale di 567 righe resta in `BRIEF-NOTTE-ORIGINALE.md`. La matrice di 205 requisiti misura soltanto quest'ultima. Nuovo integrale non quantificato: non promuovere il 30,2% a copertura globale.
- La consegna spiega la numerazione storica Italiaonline e la diversa numerazione S01–S19 del playbook esteso. Usare ID testuali finché non viene applicata la corrispondenza documentata.
- Salvataggio GitHub tramite UI autorizzata, come nei cicli precedenti; copia locale senza remote e con commit diversi. Claude deve partire da un clone del ramo remoto, non forzare la storia locale.
- Restano invariati il budget di 50 €/mese assunto complessivo, il divieto di deploy, merge e modifiche Railway, i soli dati DEMO e nessun invio, pagamento o Gmail. Nessun segreto salvato nel passaggio.


Controllo documentale dopo il salvataggio del brief integrale: `npm run check` passa sintassi, registro, dipendenze e prototipo locale, ma segnala 22 riferimenti relativi del testo sorgente a schede playbook non ancora estratte. Il file integrale resta byte per byte uguale all’originale. Anche questo limite è consegnato a Claude, senza cambiare il testo sorgente o introdurre segnaposto vuoti.

## Sessione Claude Code cloud — 8 ottobre 2026

| Decisione | Motivo e conseguenza |
|---|---|
| Lavoro solo sul ramo `bigant-os-notte-1`, PR #1 aperta e non unita | Istruzione esplicita del proprietario e di AGENTS.md. Nessun merge, nessun force push. |
| Node 24.19.0 ufficiale scaricato in `.cache/` (escluso da Git) con verifica SHA-256 | Il container aveva Node 22; il progetto dichiara `>=24.19.0 <25`. Fonte nota (nodejs.org) e checksum controllato, nessuno script eseguito. |
| Test agenzia riscritti, non cancellati | Il test vecchio pretendeva eventi "non implementati", ora implementati in DEMO; quello sui "planned" non provava nulla. Ora si verificano i 32 executor, il rifiuto degli ID sconosciuti e che nessuna pianificazione parta da sola. |
| Playbook estratto dal brief con uno script, brief intatto | Il brief chiede un file per ogni marcatore `<!-- FILE: -->`. `scripts/estrai-playbook.js` li genera e `npm run check` verifica che coincidano; i link del brief si risolvono rispetto al file incorporato. Così i 22 link "rotti" si chiudono senza creare file vuoti o modificare il sorgente. |
| Matrice R-xxx: 377 requisiti estratti da agenti in parallelo più un controllo di completezza, numerati per riga del brief | Denominatore fisso e tracciabile (`docs/copertura/requisiti-brief.json`). Il vecchio 30,2% resta solo storico. Nota: il commit `d364e37` cita per errore R-016; il requisito della matrice è **R-019**. |
| Sciame con motore AI come livello nuovo, accanto alle 32 procedure a regole | Non si riscrive ciò che funziona: le procedure deterministiche restano (motore "regole DEMO"), lo sciame AI usa le stesse tabelle (approvazioni, registro, memoria, costi, contenuti). L'ufficio mostra entrambi e dichiara il motore. |
| Motore Claude Code = `claude -p --agent bigant-<agente>` senza strumenti | Gli agenti sono sottoagenti veri in `.claude/agents/` e girano con l'account della sessione Claude Code; senza strumenti non leggono file, non navigano e non eseguono comandi. Il pacchetto DEMO arriva dall'input standard. Con `--agent` lo strumento di output strutturato non è disponibile, quindi il JSON si legge dal testo e viene **sempre** validato sullo schema: un'uscita fuori contratto è un errore visibile. |
| Motore predefinito: Claude Code se il comando esiste, altrimenti "nessuno" | Il motore DEMO deterministico si usa solo se richiesto esplicitamente (test). Senza motore AI lo sciame non parte e lo dice, invece di produrre testi preconfezionati. |
| Motore API con SDK ufficiale `@anthropic-ai/sdk` 0.127.0 fissato, chiavi `BIGANT_*` dedicate, nessun modello predefinito nel codice | Attivabile solo con variabili d'ambiente. Una chiave `ANTHROPIC_API_KEY` cambierebbe l'account di Claude Code stesso, quindi si usa un nome dedicato. Il modello lo scelgono i soci dalla documentazione ufficiale. Il costo per chiamata si conta prudenzialmente al tetto `BIGANT_API_COSTO_MAX_CENT` (25 centesimi) finché non c'è un listino validato. |
| Costi del motore Claude Code: USD dichiarati da Claude Code, contati 1:1 in centesimi di euro nel tetto mensile | Conversione prudenziale (1 USD vale meno di 1 €) senza inventare un cambio. Prima di ogni chiamata si prenotano 40 centesimi stimati; oltre il tetto lo sciame si ferma e lo dichiara. Se i consumi siano inclusi nell'abbonamento Claude è [DA VERIFICARE]. |
| Qualità su ogni output: controlli automatici del codice + agente Qualità; una sola correzione, poi stop | Nessun output entra in coda approvazioni senza esito "approvabile". Un secondo fallimento ferma il passo ("Fermato da Qualità") con il motivo, invece di insistere a pagamento. |
| Auto-approvazione solo dei passaggi interni in DEMO (`BIGANT_APPROVAZIONE_AUTOMATICA_DEMO`, attiva di default) | Richiesta del proprietario per far arrivare i flussi fino in fondo. Ogni auto-approvazione è registrata come "auto-approvato (DEMO)". Con la variabile a `false` decidono i soci dalla coda, e il motivo di un rifiuto torna all'agente come regola. |
| Azioni verso l'esterno registrate come "bloccate" e rifiutate dal codice | Pubblicare, inviare email, modificare la scheda Google e rispondere alle recensioni restano in `os_azioni_esterne` con motivo COLLEGAMENTO MANCANTE + ok del socio. Il passo resta "in attesa di un socio": è lo stato reale. |
| Prima nota DEMO del mese: cinque movimenti inventati importati con la procedura del gestionale | Servono anomalie realistiche (incasso senza ricevuta, doppio pagamento, abbonamento aumentato) per il controllo "cosa non torna". I movimenti passano dalla stessa API dei soci, con chiave di idempotenza e categoria obbligatoria: l'agente non li modifica mai. |
| Ufficio virtuale con aggiornamento ogni 4 secondi invece di una connessione in streaming | Più semplice, compatibile con la politica di sicurezza dei contenuti e senza dipendenze. Gli stati vengono solo dal database. |
| Output reali dello sciame salvati in `docs/demo-sciame/` e importati all'avvio del server | Chi clona il ramo vede nell'ufficio le esecuzioni vere, non animazioni. L'importazione è idempotente e marcata "registro salvato in docs/demo-sciame". |
| Versione online come pagina privata su claude.ai, con l'intero server nel browser (richiesta esplicita del proprietario, 8 ottobre 2026, ore 16) | Il proprietario vuole provare il SaaS da un link senza installare nulla. Railway e altri server pubblici restano esclusi: servirebbero credenziali, autenticazione reale e una fase di rilascio autorizzata. La pagina è privata, i dati DEMO restano nel browser e le azioni esterne restano bloccate come in locale. Dettagli in `docs/ONLINE.md`. |
| Sciame online con motore DEMO a velocità di lettura, dichiarato su ogni postazione | Nel browser non si può avviare Claude Code. I giri reali già registrati restano visibili con il loro motore; i nuovi giri online sono DEMO e lo dichiarano. |
| Credenziali di prova generate a ogni prima costruzione e fuori dal repository | La regola vieta password nel repository. Le password esistono solo nella pagina pubblicata e in `.cache/online/credenziali.json`, esclusa da Git. |
| Sito pubblico di prova autorizzato dal proprietario (8 ottobre 2026, ore 16:40: «ti autorizzo a metterlo online, su GitHub») | La versione pubblica (`node scripts/build-online.js --pubblica`) contiene solo l'app con dati inventati. Accesso con i profili DEMO, senza password. Fuori: le istruzioni degli agenti, i giri reali con i costi e i documenti interni del playbook (resta solo il catalogo S01–S19); il numero di clienti e i canoni sono oscurati. Va su GitHub Pages da un repository pubblico separato, perché `bigant-os` resta privato. Preparato anche `online/servi.js` con `online/Dockerfile` e `railway.json`, per Railway in alternativa. |
| Automazione solo nella versione online: un giro al giorno all'apertura, con il motore DEMO | È la richiesta di «qualcosa di già attivo». Un giro giornaliero automatico nel server, con l'AI vera, consumerebbe crediti senza un'azione dei soci: resta da decidere insieme al tetto di spesa (punto 8 del piano di verifica). |
| Passaggio alla versione reale chiesto dal proprietario (8 ottobre 2026: «non voglio una demo, passiamo alla versione reale») | La strada è in `docs/verifica/BigAnt-OS-roadmap-servizi.pdf`: base (server, AI con tetto, dati veri di BigAnt e di clienti pilota con consenso, richieste di accesso a Google e Meta), poi quattro onde, servizio per servizio. La regola «solo dati DEMO» cade con la Fase 1, sul server condiviso. I dati reali restano fuori dal repository. |
| Server reale su Railway autorizzato dal proprietario (8 ottobre 2026) | Non eseguibile in questa sessione: nessuna chiave Railway, rete verso Railway bloccata, CLI assente. Il piano esatto è in `docs/FASE-1-SERVER-REALE.md`, da eseguire in una sessione nuova con `RAILWAY_TOKEN` salvato nelle impostazioni dell'ambiente e i domini Railway consentiti. |


## Riordino autorizzato — 10 ottobre 2026

Il proprietario ha autorizzato tutte le modifiche del piano e confermato in chat: **nascondere** le sezioni tolte (D-05), **Servizi come Piano di attivazione con Listino** (FUN-060/FUN-031), **post approvabili dai soci o dai collaboratori; Growth e Fidelity solo dai soci** (D-15). La scelta del fornitore AI è rinviata: **predisporre sia Anthropic sia OpenAI** (aggiornamento D-14), lasciando chiavi, modello, budget e attivazione espliciti.

Il riferimento principale è `MAPPATURA-FINALE-CODEX.md`; il piano a fasi guida esecuzione e verifiche. L'autorizzazione al lavoro copre le fasi senza ripetere la domanda di avvio; rilascio Railway e azioni esterne restano soggetti alle autorizzazioni specifiche previste. Le viste cliente e collaboratore non ancora analizzate non diventano implicitamente definitive.

Fase 0: backup giornaliero sul volume configurato, 14 copie conservate, rotazione solo dopo una copia verificata, ripristino in archivio nuovo. Stato riservato ai soci. Le copie sullo stesso volume non costituiscono un backup remoto indipendente.

FUN-003: password provvisoria obbligatoriamente sostituita per nuovi account reali e reset del socio; il socio iniziale è marcato se usa ancora la password iniziale. Il cambio verifica la password corrente, chiude tutte le sessioni precedenti e ne emette una nuova. I profili rapidi DEMO restano utilizzabili. Recupero assistito da un socio, senza invii email automatici.

### Applicazione D-15 ai percorsi esistenti

L'approvazione dei contenuti social è riservata a soci e collaboratori assegnati. Gli altri contenuti richiedono un socio. Le campagne Fidelity richiedono un socio anche sulla rotta diretta del modulo; Growth mantiene il controllo esistente. Il cliente non prende queste decisioni. Lo scenario dimostrativo a 13 passaggi è aggiornato al nuovo decisore, conservando i controlli sulla versione e il divieto di pubblicazione.

### Scheda cliente e credenziali

Confermata la separazione tra scheda agenzia e anteprima cliente. Contratti e documenti restano esclusi dal collaboratore in attesa del suo giro. L'anteprima socio applica gli stessi filtri del cliente e non offre azioni a suo nome. La password di piattaforme del cliente è cifrata con AES-256-GCM e una chiave del server indipendente da SQLite: nessuna chiave generata/salvata implicitamente nel database. L'archivio resta disabilitato finché la chiave non è predisposta nell'ambiente. Un ripristino richiede anche la chiave corretta, da custodire separatamente; il cambio della chiave richiederà una migrazione esplicita. Contratti PDF scaricati come allegato, non eseguiti nell'interfaccia.

### Riordino 10 ottobre — D-14 e stati agenti

Predisporre Anthropic e OpenAI come confermato in chat. Nessuna scelta automatica di modello, chiave o attivazione. Istruzioni presenti e chiave disponibile non certificano il collaudo. I percorsi DEMO restano bloccati sul server reale; le attivazioni reali richiedono percorso collaudato e autorizzazione.

### Riordino 10 ottobre — Piano e Listino

Applicata la conferma FUN-060: Piano e Listino in Servizi. Gli stati iniziali provengono dalle schede del playbook e sono da validare; date e prossimi passi restano ai soci. I 27 spazi tecnici esistenti non sono cancellati. Custodia dei collegamenti predisposta senza attivare fornitori: la verifica locale non certifica credenziali valide presso terzi.

### Riordino Fidelity — 10 ottobre

Confermata la priorità D-12: Fidelity prima di Growth. Riutilizzata la famiglia di lettore QR dell’originale (ZXing), servita localmente. Nessuna riattivazione implicita di Wallet o campagne; la prova responsive non sostituisce quella del telefono.


### Growth: configurazione senza scelta del fornitore — 10 ottobre

Conferme del proprietario conservate: entrambe le AI predisposte, scelta rinviata. Il salvataggio senza fornitore è previsto sia nell’API sia nell’interfaccia; le stime iniziali sono zero. La preparazione del motore non costituisce autorizzazione a impostare il flag delle operazioni esterne, inserire chiavi vere o sostenere costi. Il socio deve collaudare e attivare ogni fase; Gmail e Calendar non sono ancora attivabili.

### Nuovo incarico T0–T10 — 10 ottobre 2026

Il prompt completo inviato dal proprietario estende il lavoro dopo le fasi 0–7; la sua istruzione finale avvia subito T0 come supporto al riordino. Requisiti e avanzamento sono in [TASK-AVANZAMENTO](TASK-AVANZAMENTO.md). Le 92 voci restano aperte dove mancano codice o collaudi: il nuovo elenco non le sostituisce. L'elenco reale dei clienti contenuto nel prompt non viene copiato nel repository.

Chiarimento esplicito in chat: è autorizzato continuare a modificare la cartella esistente del progetto; nessun'altra nuova cartella o documento sul Mac fino all'archivio T10. L'archivio sarà una copia degli originali, con esclusione delle credenziali che devono rimanere nei file originali.

Budget totale 50 €/mese, stop e avviso a 40 €; mantenuta l'interpretazione prudente con Railway incluso, senza extra oltre il piano da 20 € dichiarato pagato. Consuntivi non verificati, quindi nessun residuo spendibile presunto. Non si attivano servizi o account reali perché soltanto gratuiti: resta il consenso per connessioni e dati esterni. Dettagli in [COSTI](COSTI.md).

T6 esclude Apple reale per mancanza dell'account Developer; non eliminare le strutture esistenti. T7 è un collaudo futuro su server di prova separato, circa un mese dopo a lavori finiti; non autorizza prove offensive sul server reale o un nuovo servizio a pagamento. La visione SaaS della presentazione T9 non autorizza una conversione del codice in piattaforma per altre agenzie.

T0: usare le skill e i test già disponibili, due verifiche delegate circoscritte e fonti ufficiali per i servizi. Nessuna nuova dipendenza necessaria. Estrarre solo il predicato puro `isISODate` ripetuto fra contratti e piano servizi, conservando i wrapper e tutti i messaggi. Ampliato il test contratti esistente per verificare che date impossibili non scrivano record e che il giorno bisestile valido sia accettato. Nessun comportamento applicativo cambiato; pulizia dei moduli maggiori da proseguire in piccoli passi motivati. Selezione e alternative in [STRUMENTI](STRUMENTI.md).


### Conversazioni Growth — 10 ottobre 2026

Lettura solo su richiesta del socio, senza worker o AI automatici. Il consenso OAuth Gmail già predisposto è sufficiente: nessun nuovo scope o collegamento attivato. Dieci thread per richiesta con rotazione, provenienti da invii OS confermati e dalla stessa casella/destinatario. Consentire la lettura mentre gli invii sono sospesi, per ricevere rifiuti; revoca OAuth, socio o attività inattivi la bloccano.

Verificare ancore e data Gmail, poi acquisire ogni thread in transazione con invalidazione di bozze e approvazioni. Un messaggio incompleto impedisce nuove bozze AI per quel contatto; gestione fuori dall’OS nella casella finché non esiste un flusso esplicito di revisione. Ultima risposta e provenienza sono vincolanti anche dopo modifica del consenso o della casella. Nessuna email ricevuta concede consenso commerciale automaticamente. Parser MIME locale, senza nuove dipendenze, con limiti espliciti; nessun allegato o risorsa remota acquisiti. Confrontare gli indirizzi non certifica l’identità del mittente. Dettagli e limiti in SOP-GROWTH-CONVERSAZIONI.


### Approvazione umana dei contenuti — FUN-062, 10 ottobre 2026

La regola vale anche nella DEMO: os-orchestrator può preparare una bozza e richiedere revisione, ma non decidere sui contenuti. Restano simulate soltanto le approvazioni interne sciame_output. Il calendario rilegge la prova completa e i permessi correnti di chi ha deciso: una disattivazione, revoca dell’assegnazione o rimozione del servizio blocca l’uso dell’approvazione. Non alterare decisioni storiche incoerenti per farle risultare valide; serve una nuova revisione umana. Riallineata soltanto la fixture di approvazione dei nuovi archivi DEMO al titolo della sua bozza.

Correzione locale senza nuovi connettori: PUBBLICATO resta rifiutato anche con prova valida. Il futuro esecutore dovrà ricontrollare la stessa versione al momento dell’invio e registrare ricevute e idempotenza; FUN-062 resta parziale per questa parte e per il collaudo server. SOP e catalogo architetturale aggiornati.

### Priorità e Struttura nello Sciame — 10 ottobre 2026

FUN-005/FUN-019: il percorso attuale dello Sciame ospita le priorità del Direttore e i dettagli dei reparti. GET /api/workspace/priorities è riservato ai soci ancora attivi e legge l’agenzia, indipendentemente dall’attività selezionata. Nessuna chiamata AI o scrittura durante la consultazione. Il risultato corrente include provenienza e versione; una revisione manuale prevale sul vecchio elenco strutturato. Output incompleti o fermati non autorizzano a mostrare una proposta precedente come corrente. Le decisioni riportate sono storia, non autorizzazioni all’esecuzione; le decisioni tecniche restano etichettate DEMO.

UI-008/UI-011: mantenuti stile della cabina, stanze e diretta. Ogni risposta asincrona aggiorna solo la vista e sessione che l’hanno richiesta. FUN-046: il collegamento social apre il contenuto specifico nello Sciame; non reintroduce Lavori nei menu. Codice precedente conservato secondo D-05. Nessuna attivazione di agenti, provider o servizi reali; Avanzamento/Fondamenta da riallineare in un intervento successivo.


### Avanzamento e Fondamenta — 10 ottobre 2026

FUN-004/FUN-008/UI-003/UI-004: Avanzamento descrive la capacità effettiva di questa installazione con Funziona, Prova e Da collegare, senza percentuali di progetto o collaudi impliciti. Nessuna operazione alla consultazione. Configurazione salvata, prova superata e autorizzazione sono condizioni distinte; pausa, revoca, prerequisiti e versioni correnti impediscono false attivazioni. L’autorizzazione Gmail richiede anche la custodia disponibile per risultare Funziona. La data di lettura resta separata dall’ultima prova registrata.

Tutte le nove Fondamenta restano consultabili una alla volta; custodia cifrata, listino e avvio manuale del cliente non vengono più descritti come del tutto assenti. Nessuna Fondamenta è presentata come flusso completo. Le vecchie etichette tecniche spariscono dai percorsi operativi dei Servizi e dai KPI/Report cliente, conservando DEMO, dati mancanti e limiti. Il pulsante residuo verso Lavori viene rimosso dal dettaglio servizio: i lavori registrati restano nella scheda. Il riordino completo della vista cliente rimane una verifica distinta.

### Calendar Growth — 10 ottobre 2026

COL-005 fase 5: consenso Calendar facoltativo, nessuna estensione implicita dal consenso Gmail. Le nuove prenotazioni richiedono tutte le fasi precedenti, prova e ricezione confermata dal socio. Link autorizzati singolarmente e condivisi manualmente; nessun collegamento automatico nelle bozze AI. La conferma del destinatario non costituisce consenso marketing. API private solo ai soci; il visitatore pubblico dispone esclusivamente della capacità legata al token, senza ruolo owner.

Calendar reale separato dal motore DEMO, con versioni, token hash e intenzioni persistenti. Il calendario originale viene conservato per riconciliazione e annullamento, anche se le impostazioni cambiano. Le letture autorizzate del vault mantengono l’audit. Errori incerti non consentono reinvio o liberazione automatica dello slot; il 412 di annullamento è un rifiuto certo e richiede una nuova anteprima. Una prova ricevuta e verificata rimane attestata dopo il suo annullamento; cambi configurazione/autorizzazione o revoche dei soci invalidano l’attestazione. Nessuna garanzia di assenza di conflitti causati da applicazioni esterne a BigAnt OS.

Stato locale aggiornato in Avanzamento senza promuovere integrazioni solo configurate. La preparazione è collaudata con trasporti finti; le voci COL-005/FUN-050 e le autorizzazioni reali restano aperte. Procedura e prove: SOP-GROWTH-CALENDAR e COLLAUDO-GROWTH-RIORDINO.


### Profili pubblici — 10 ottobre 2026

Prima della sincronizzazione dei canali serve distinguere il link pubblico dall’autorizzazione dell’account. I soci registrano URL e fonte con conferma manuale dell’attività; questo non vale come verifica indipendente T5. Sei canali aziendali, LinkedIn solo pagine company. Nessuna nuova voce nel menu cliente prima del giro. Nessun indirizzo viene visitato o arricchito automaticamente. Versioni immutabili e conflitti espliciti impediscono sovrascritture involontarie; il dialogo conserva il contesto di apertura.

Lo spazio recensioni vive in GBP ma dichiara i dati non ancora disponibili: FUN-013 resta parziale, FUN-012 non è promosso a completo e COL-002 resta da collegare. La revisione indipendente ha invece verificato sette criteri di riordino già implementati (UI-005, UI-007, FUN-011, FUN-016, FUN-020, FUN-021, DAT-002): aggiornare la mappa conservando il limite locale. Trello resta fonte ufficiale, senza attestarne la lettura. Nessuna dipendenza, account, spesa o dato cliente aggiunto.
