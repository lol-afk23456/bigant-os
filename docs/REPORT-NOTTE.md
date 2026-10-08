# BigAnt OS — report della sessione notturna

**8 ottobre 2026 · Prototipo interno DEMO · revisione in corso, nessun rilascio online.**

## Da leggere per primo

È stata costruita una prima applicazione unica BigAnt OS: gli stessi clienti, accessi, database, approvazioni e registro collegano Growth, Fidelity, produzione e amministrazione. Non sono collegamenti a quattro app: le operazioni locali scrivono davvero nello stesso archivio. Il logo è quello BigAnt; il colore segue il nuovo brief, **#F26B21**.

**Non è ancora il sostituto delle app online.** La ricerca web reale, i modelli AI, Gmail, Google Calendar, Apple e Google Wallet, social, pubblicità e banca sono scollegati. La prova usa soltanto aziende inventate e indirizzi `.example`. Un invio simulato non è un’email spedita; un appuntamento DEMO non è un invito Google; una tessera mostrata non è un pass Apple emesso.

**Nessuna modifica a Growth, Fidelity, PED o Railway. Nessun deploy, merge, invio esterno o servizio a pagamento attivato.** Gmail e gli archivi economici reali non sono stati letti. Tutti i file tecnici restano nella cartella del nuovo repository.

Non sono emerse credenziali effettive nei file applicativi esaminati. Questo non è un audit completo della cronologia Git. Le credenziali condivise in precedenza in chat non vengono copiate nel codice o nei report: prima dell’uso reale vanno sostituite e conservate in un gestore dedicato.

## Dove trovare il lavoro

- Repository privato: [BigAnt OS](https://github.com/lol-afk23456/bigant-os/tree/bigant-os-notte-1).
- Ramo di lavoro: `bigant-os-notte-1`. `main` conserva la base iniziale; nessun merge autorizzato.
- Pull request: [Revisione BigAnt OS #1](https://github.com/lol-afk23456/bigant-os/pull/1), aperta verso `main`, senza merge.
- Copia dei tre report su Drive: [BigAnt OS - Report notturni](https://drive.google.com/drive/u/0/folders/17P2Zg4dvhi8ZODnPMcMFQg6lB4xkIzad).
- Anteprima locale: [Apri BigAnt OS](http://127.0.0.1:4330/). Richiede il processo locale acceso; non è un sito pubblico.

## Cosa si può provare

1. **Entrare come socio, collaboratore o cliente.** I permessi sono verificati dal server: nascondere una voce di menu non è l’unica protezione. Solo i soci leggono conti, margini e CRM dell’agenzia.
2. **Cercare aziende DEMO, analizzarle e preparare una bozza commerciale.** La bozza richiede consenso appropriato e decisione esplicita di un socio. Si possono simulare risposta, rifiuto, prenotazione, annullamento e recupero di un esito incerto.
3. **Convertire un lead in cliente comune**, una sola volta, mantenendo la provenienza. La stessa anagrafica serve poi a contratti, produzione e Fidelity.
4. **Creare lavori e contenuti**, registrarne le ore, inviare in revisione, approvare o richiedere modifiche. Cambiare il testo rende obsoleta l’approvazione precedente; il rifiuto alimenta la memoria di quel cliente.
5. **Usare Fidelity nello spazio comune:** programmi timbri, punti e coupon; iscritti; consensi; accrediti; premi; storni; export; anonimizzazione; campagne e automazioni di ritorno. Le notifiche esterne restano bloccate.
6. **Registrare una prima nota DEMO per due ditte**, distinguendo entrate, spese, prelievi e trasferimenti. Gli importi sono centesimi interi; i movimenti non vengono riscritti. Rettifiche e storni lasciano una traccia e rispettano le chiusure.
7. **Controllare arretrati, scadenze e anomalie.** Il sistema segnala cosa non torna, ma non corregge i conti da solo. Tariffe confermate e ore registrate consentono un primo margine gestionale; i dati mancanti restano tali.
8. **Avviare gli agenti locali**, vedere risultati, fonti, errori, tentativi e costi. La coda centrale coordina anche i lavori dei moduli. Calendari ed eventi, pausa e tetto di spesa sono persistenti.

Gli agenti del prototipo seguono **regole deterministiche locali**, non modelli linguistici. Alcuni generano bozze e riepiloghi; gli specialisti futuri sono schede di catalogo dichiarate, non automazioni finte.

## Il metodo prima del software

Il [playbook](PLAYBOOK.md) definisce ciclo cliente, approvazioni, ruoli, rituali, KPI e SOP dei 19 servizi del catalogo di riferimento, più le specialità BigAnt. Il [confronto di mercato](CONFRONTO-MERCATO.md) considera Productive, Teamwork e Odoo e tre opzioni di infrastruttura. La scelta è un’app modulare semplice, un database, un processo di lavoro: proporzionata a due soci e poche decine di clienti.

BigAnt è il cliente zero. Fotografia e merchandising restano nel catalogo operativo, ma **sono esclusi dalle proposte automatiche di acquisizione**, insieme a insegne e abbigliamento, come richiesto. Network e marketplace proprietari non vengono presentati come replicabili; noleggio Apple non è una priorità.

## Growth e ricerca clienti: funzione per funzione

La ricerca è già parte di Growth; non è stato trovato un terzo repository autonomo nelle fonti disponibili. L’inventario completo, con versione di provenienza e dettagli endpoint, è in [GROWTH-INVENTARIO](../research/GROWTH-INVENTARIO.md). Qui l’esito nel nuovo OS, non soltanto l’esistenza nel vecchio codice.

| Funzione originale | Posizione in BigAnt OS | Verifica / limite |
|---|---|---|
| Setup, login, sessioni, uscita | Identità e accessi comuni | Test HTTP, cookie, Origin, CSRF, revoca sessioni |
| Creazione altro titolare | Accessi OS con ruoli espliciti | API comune; password solo DEMO, nessun account originale copiato |
| Pannello dati | Growth nella navigazione comune | Stato reale dal database DEMO |
| Inserimento/modifica azienda, responsabile, note, fonte, valore | CRM Growth | Test validazione e centesimi |
| Pipeline in otto fasi | CRM Growth | Stati persistiti e modificabili |
| Deduplica email e dominio | Vincoli del database comune | Test duplicati |
| Ricerca locale e analisi accodata | Agente ricerca del modulo | Provider deterministico, zero rete; ricerca web reale scollegata |
| Lettura sito pubblico | Provider di esempio `.example` | Il recupero web reale resta da portare e collaudare come connettore protetto |
| Analisi, punteggio, fonte e qualificazione | Lead e motore Growth | Test punteggio e passaggio di fase, fonte dichiarata DEMO |
| Bozza iniziale, risposta e followup | Messaggi e coda comune | Test tre modalità; niente approvazione automatica |
| Richiesta prezzi/contratti al socio | Stato di intervento umano | Scenario DEMO verificato |
| Rifiuti e disiscrizioni | Esclusioni e token | Test blocco dei contatti e degli invii successivi |
| Consenso, prova, richiesta distinta da marketing | Scheda lead e cancello di contatto | Test; cambio email revoca la vecchia autorizzazione |
| Modifica/approvazione/annullamento messaggio | Messaggi e approvazioni versionate OS | Test versioni obsolete e attribuzione della decisione |
| Invio Gmail e limite giornaliero | Simulatore esplicito | Stato `simulated_sent`; Gmail non collegata |
| Esito incerto, recupero e riconciliazione | Coda persistente Growth | Test interruzione e nessun doppio invio |
| Conversazioni, correlazione e deduplica | Inbox DEMO del modulo | Test; nessuna email reale letta |
| Stop followup dopo risposta | Motore Growth | Test prima della classificazione |
| Disponibilità e conflitti calendario | Prenotazioni DEMO | Test orari Europe/Rome e conflitti; Google scollegato |
| Invito, prenotazione monouso e annullamento | Vista pubblica locale e CRM | Test token, conflitti, annullamento, link raggiungibile |
| Esito incerto della prenotazione | Riconciliazione DEMO | Test senza creare due appuntamenti |
| Modulo analisi gratuita | Pagina pubblica locale / richiesta | Informativa, consenso distinto e honeypot; nessuna pubblicazione online |
| Import/export | Growth | Test righe parziali, massimo 200, formule CSV neutralizzate |
| Impostazioni, pausa, limiti, budget | Growth e controllo centrale | Test budget condiviso, cap massimo 50 €, mese Europe/Rome |
| Pianificazione ricerca/bozze/followup | Orchestratore → motore Growth | Stesso processo e database; niente secondo server |
| Job, retry, ripartenza | Coda comune e dettaglio Growth | Test persistenza, pause e retry esplicito |
| Audit e autore | Registro OS | Test due richieste concorrenti di soci diversi |
| Chiavi, OAuth, collega/scollega Google | Collegamenti, stato scollegato | Operazioni bloccate dal server; non attivabili nella prova |
| Brand email, anteprima e health | Brand OS e server comune | Generazione locale e controllo avvio |
| Lead acquisito → cliente | Anagrafica comune e provenienza | Nuova funzione atomica e idempotente verificata |

## Fidelity: funzione per funzione

Dettagli e versione originale in [FIDELITY-INVENTARIO](../research/FIDELITY-INVENTARIO.md). Il titolare di un negozio Fidelity diventa un **cliente OS**, mai un socio con accesso ai conti BigAnt.

| Funzione originale | Posizione in BigAnt OS | Verifica / limite |
|---|---|---|
| Login, password e operatori | Identità comune e assegnazioni | Permessi server e sessioni testati; gestione accessi centralizzata ai soci |
| Attività, modifica, sospensione | Anagrafiche OS | Stesso cliente usato dagli altri moduli; test sospensione |
| Dashboard, metriche e andamento | Fidelity | Dati calcolati dall’archivio DEMO, nessuna metrica remota inventata |
| Programmi timbri/punti/coupon | Fidelity / programmi | Test creazione, modifica, premio, scadenza e invarianti |
| Logo e colori per programma | Branding del modulo | PNG/JPEG/WebP ricodificati e privati di metadati; limiti byte/pixel testati |
| Iscrizione pubblica e scelta programma | Pagina locale di iscrizione | Test termini e duplicato senza divulgazione della tessera |
| Iscritti, ricerca e segmenti | Fidelity / iscritti | Isolamento, consenso e aggiornamento testati |
| Carta pubblica e revoca consenso | Pagina locale della tessera | Risposta ridotta senza email, telefono o segreti; revoca testata |
| QR carta e iscrizione | Immagini generate nel server OS | PNG veri; accesso e revoca testati |
| Scanner e ricerca manuale | Fidelity / cerca tessera | Token, ID e URL stesso servizio testati; camera fisica non collaudata |
| Accredito, riscatto e saldo | Ledger Fidelity nel DB comune | Test transazioni atomiche e impossibilità di saldo negativo |
| Punti da spesa in centesimi | Programmi punti | Test arrotondamento e quantità; non genera un incasso contabile |
| Coupon monouso | Programmi coupon | Test saldo iniziale, riscatto e ricarica vietata |
| Idempotenza e storno | Registro operazioni | Test retry identico, conflitto, storno unico e saldo |
| Export CSV | Iscritti | Test formule e isolamento |
| Anonimizzazione | Scheda iscritto | Test pulizia contatti, token, job e idempotenza |
| Campagne e segmenti | Fidelity / campagne | Solo opt-in; preparazione locale di destinatari |
| Approvazione e revisione campagna | Coda OS e memoria cliente | Test decisione singola, versione superata, motivo e feedback |
| Pianificazione campagna | Orchestratore comune | Prepara campagna dovuta una volta; non invia |
| Ritorno inattivi e cooldown | Automazioni Fidelity | Test periodo, consenso e preparazione; attivazione esplicita |
| Consegne per canale e coda | Coda comune / Fidelity | Stato bloccato reale; mai un falso “inviato” |
| Retry, backoff e recupero esterno | Uscite disabilitate | Retry bloccato; worker provider originale da adattare e ricollaudare prima dell’attivazione |
| Payload Apple e Google | Generatori puri del modulo | Test contenuti, coupon, identificativi e revoca; `issued:false` |
| Pass Apple firmato, APNs, registrazioni dispositivo | Collegamento futuro | **Non operativo nel prototipo**, nessun certificato copiato o prova dispositivo |
| Google Wallet: firma, provision, aggiornamenti e messaggi | Collegamento futuro | **Non operativo nel prototipo**, nessun issuer collegato |
| Policy, regolamento e stato provider | Impostazioni Fidelity | API testate; valori segreti mai esposti |
| Icona di ripiego | Endpoint OS pubblico | PNG testato, colore BigAnt |
| Audit | Registro comune filtrato | Test esclusione dell’amministrazione dai dati cliente |
| Bootstrap e fixture | Avvio unico OS | Seed idempotente verificato |
| Backup/ripristino | Procedure del nucleo | Collaudo separato in copia; mai su database originali |

**Le funzioni di dominio locali elencate sono state verificate; gli effetti dei fornitori esterni restano da collaudare.** Le parti esterne non sono certificate come “già funzionanti”: il vincolo notturno vieta di collegarle e provarle. Le vecchie app restano operative fino a una migrazione separata.

## Amministrazione e limiti economici

Sono presenti anagrafiche DEMO delle due ditte, conti, controparti, contratti, bozze di fattura, incassi parziali, prima nota immutabile, trasferimenti, compensi, scadenze, abbonamenti, quadrature, storni/rettifiche e controllo anomalie. I test verificano che dati di una ditta non possano essere attribuiti a un conto o documento dell’altra.

Il margine mostrato distingue cassa, costo interno delle ore, stima e consuntivo gestionale. **Non è un utile fiscale o un bilancio certificato.** Costi comuni incompleti e ore prive di tariffa sono indicati, non trattati come zero. Soglie, imposte, bollo e accantonamenti fiscali restano `null` fino alle indicazioni del commercialista.

Prima Nota e Tracker esistenti restano la fonte reale. Non è stata effettuata alcuna migrazione o riconciliazione con numeri veri. Il piano prevede prima lettura controllata, staging separato, confronto saldi per ditta e doppia verifica dei soci.

## Costi e infrastruttura

La demo non consuma API né attiva abbonamenti. Il limite applicativo è **50 € al mese**: quota iniziale prudenziale 35 € per hosting, strumenti e riserva, 15 € disponibili per usi variabili. È un’impostazione di prova, non una fattura o una verifica del credito Railway.

La scelta futura proposta è un singolo servizio e volume persistente su Railway, con scheduler nello stesso processo. Il piano Railway già acquistato comprende un minimo d’uso condiviso: non equivale a risorse illimitate o a credito libero per OS. Costi, imposte, cambio e utilizzo degli altri progetti vanno controllati prima di un eventuale rilascio. [Fonti, ipotesi e alternative](CONFRONTO-MERCATO.md).

## Verifiche e avvio

Requisito: Node **24.19.0**. Dipendenze fissate nel lockfile; nessuna chiave API richiesta.

```sh
npm ci --ignore-scripts
npm test
npm run check
npm start
```

Aprire [l’anteprima locale](http://127.0.0.1:4330/) e scegliere il profilo. Il server ascolta soltanto sull’interfaccia locale; rifiuta modalità produzione e richieste da host estranei. L’archivio DEMO è `.data/bigant-os.sqlite`, escluso da Git.

**Esito finale: 103 test superati, zero errori, zero test saltati; controllo del progetto superato.** Le prove coprono domini Growth/Fidelity/amministrazione, API comuni, isolamento ruoli e servizi, versioni approvate, memoria interna, sessioni, Origin/CSRF, budget, calendario, retry, concorrenza, QR e ripartenza. Otto prove riguardano backup e ripristino in copie isolate, senza sovrascrivere l’archivio in uso. Quattro prove aggiuntive verificano che le immagini BigAnt distribuite in formato testuale reversibile restituiscano esattamente i byte e il formato PNG originali.

Nel browser sono state aggiunte cinque aziende DEMO, accreditato un timbro con saldo da 4 a 5, aperta la tessera con QR PNG e completato il percorso agente social → revisione → richiesta di modifica. L’accesso cliente Aurora mostra soltanto la sua attività ed esclude l’amministrazione. La [matrice di collaudo](COLLAUDO-INTERFACCIA.md) separa prove browser, verifiche dei form e test del server, ed elenca i campi avanzati ancora non esposti nell’interfaccia. Fotocamera, telefono e fornitori esterni non sono stati collaudati.

## Cosa manca per usarlo davvero

- Connettori reali e loro credenziali, consenso/account autorizzati, test sul fornitore e cancello di uscita prima di ogni azione esterna.
- Porting operativo e collaudo dei provider Wallet, notifiche e loro ripresa; migrazione delle carte emesse e strategia URL.
- App cloud con accessi nominali, recupero password, HTTPS, backup fuori dal volume, osservabilità e procedura di incidente. Le identità rapide DEMO non devono arrivare in produzione.
- Codice, schema e permessi del PED: è stata analizzata l’interfaccia autenticata, non la sua base dati o le regole interne. Il client Supabase è visibile, il resto non è verificato.
- Completare e misurare il pilota BigAnt: DNA e strategia reali, fonti, quantità di lavoro, capacità e KPI. Dashboard esterne mostrano “non collegato”, non risultati stimati.
- Specialisti futuri dei servizi e documenti fiscali: schede e SOP sono pronte, le esecuzioni specialistiche restano da sviluppare in fasi successive.

## Prossimi cinque passi consigliati

1. Provare insieme i tre ruoli, la revisione di un contenuto, un lead e una tessera DEMO; annotare le parti che rendono il lavoro più semplice o più lento.
2. Validare con i soci il playbook e il pilota BigAnt, i servizi prioritari, le responsabilità e la matrice degli accessi.
3. Ottenere da Alfonso il codice e lo schema del PED in sola lettura, per progettare una migrazione o integrazione conservativa.
4. Con il commercialista, confermare anagrafiche, saldi di apertura e regole delle due ditte; preparare un import controllato dei fogli, senza spegnerli.
5. Dopo una decisione esplicita, autorizzare un rilascio cloud separato e **un solo connettore alla volta**, con tetti di costo, dati minimi, approvazioni e possibilità di tornare indietro.
