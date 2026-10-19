# Passaggio di consegne — BigAnt OS

8 ottobre 2026, fuso Europe/Rome. Destinatario: Claude Code. Il proprietario ha chiesto di fermare lo sviluppo e trasferire qui tutto il contesto utile. Questo documento non autorizza deploy, merge, invii, pagamenti o accesso a dati reali.

## Da dove ripartire

- Repository privato: **lol-afk23456/bigant-os**, [GitHub](https://github.com/lol-afk23456/bigant-os).
- Ramo di lavoro: **bigant-os-notte-1**. Non lavorare su main.
- Unica pull request aperta osservata: [#1](https://github.com/lol-afk23456/bigant-os/pull/1), da questo ramo verso main. Stato **Open**, non unita. Non ci sono prove di revisione o approvazione umana completata.
- Cartella tecnica locale: `/Users/raffaelelamanna/Documents/Codex/2026-10-07/mi-dai-un-prompt-per-farmi/bigant-os`.
- Primo salvataggio richiesto prima della consegna: commit locale **569c70d**. Gli stessi 21 file sono stati salvati nel ramo GitHub in più commit tramite interfaccia web; ultimo di quel gruppo **cc1585e**. Non sono gli stessi identificativi Git. Tutti i 21 file del primo salvataggio sono stati confrontati tramite la vista sorgente GitHub e coincidono con il locale (ignorata solo la terminazione finale di riga).
- **Particolarità essenziale:** `git remote -v` nella copia locale non restituisce remoti. La sessione autorizzata GitHub era nel browser, non nel terminale. Non è stato eseguito un push Git CLI. Per proseguire, clonare il ramo remoto in una nuova cartella tecnica con il proprio accesso autorizzato e confrontare eventuali cambiamenti locali. Non aggiungere origin per poi forzare il push della storia locale: sovrascriverebbe la cronologia salvata online.

## Avvio e controlli, comandi esatti

Usare **Node 24.19.0**, intervallo dichiarato `>=24.19.0 <25`. Il database è SQLite nativo di Node (`node:sqlite`), non un server separato. Frontend JavaScript/CSS senza compilazione. Dipendenze dirette fissate: **sharp 0.34.5** e **qrcode 1.5.4**. Il lockfile è incluso.

Su una macchina con Node e npm già nel PATH e accesso al repository privato:

```sh
git clone --branch bigant-os-notte-1 --single-branch https://github.com/lol-afk23456/bigant-os.git
cd bigant-os
node --version
npm ci --ignore-scripts
npm start
```

Aprire `http://127.0.0.1:4330/`. Scegliere **Socio DEMO**, **Collaboratore DEMO** oppure il profilo cliente; sono identità inventate solo locali. Il server rifiuta un indirizzo pubblico e l'avvio CLI in modalità produzione. L'archivio `.data/bigant-os.sqlite` si crea con dati DEMO, resta escluso da Git. Non importare i database originali.

```sh
npm test
npm run check
npm run demo:agents
npm run backup
npm run restore -- --backup PERCORSO_BACKUP
```

`demo:agents` usa un database nuovo **solo in memoria**, prepara esplicitamente consenso e opt-in inventati e prova tutte le 32 procedure senza modificare l'archivio dell'anteprima. Il ripristino crea un archivio nuovo senza sovrascrivere quello in uso. Per questo Mac il runtime usato è `/Users/raffaelelamanna/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`; non presumere che il Node di sistema sia uguale. Il server locale è stato riavviato prima della consegna, ma la sua permanenza dipende dalla sessione aperta.

## Variabili d'ambiente: solo nomi e scopo

BigAnt OS non richiede credenziali. Non carica automaticamente `.env`: il file `.env.example` documenta solo i nomi opzionali.

| Nome | Scopo nell'OS |
|---|---|
| PORT | Porta del server locale |
| DATA_DIR | Cartella dell'archivio di prova; deve rimanere dentro il repository tecnico |
| NODE_ENV | Controllo di sicurezza: l'avvio CLI in produzione è bloccato |

Non esistono chiavi AI, Google, Wallet o Railway necessarie per il prototipo. Non copiare qui token, password, certificati, cookie o valori di ambiente. Le variabili dei progetti originali sono descritte più avanti e **non sono quelle dell'OS**.

## Stato reale dello sciame

Gli otto reparti e tutti i **32 agenti hanno ora una procedura locale eseguibile**, non soltanto una scheda. Non sono 32 modelli AI collegati. Sono regole deterministiche che producono controlli, piani o bozze da dati DEMO. Il giro isolato ha prodotto **32 risultati salvati e 32 riferimenti di approvazione, zero chiamate esterne, zero invii, zero costo API**. Questo non prova l'erogazione dei servizi reali.

| Gruppo | Cosa esegue | Limite |
|---|---|---|
| Direttore Crescita | Tre priorità, aggregati amministrativi consentiti | Niente ricerca di mercato live, business case validati o strategia autonoma |
| Marketing BigAnt | Dodici proposte editoriali e piano a 90 giorni | Calendario proposto, non pubblicazioni; DNA reale e misure mancanti |
| Account e Reporter | Onboarding, ritardi, minuti, riepilogo e memoria report | Rinnovi, capacità, report marketing completo e portfolio parziali |
| Social | Bozza nella produzione comune, approvazione canonica | Testo deterministico; non generazione AI o pubblicazione |
| Qualità | Regole su fonti, promesse assolute e stati | Non verifica diritti delle immagini o conformità legale completa |
| Amministrazione | Anomalie sui dati contabili DEMO | Non modifica movimenti; dati e fonti reali scollegati |
| Ricerca, Analista, Commerciale | Modulo Growth comune, lead fixture, analisi, bozza e approvazione | Pausa e consenso richiesti; nessun consenso inventato dall'agente |
| Fidelity | Campagna per iscritti già opt-in e approvazione comune | In assenza di opt-in restituisce prerequisiti; nessuna consegna Wallet/email |
| 21 specialisti | Procedure specifiche per video, ADV, SEO, sito, ecommerce, prenotazioni, reception, local, reputazione, multisede, accessibilità, social commerce, display, TV, merch, verticali, branding, eventi, drone, video AI, direzione creativa | Analisi/bozze/piani, non siti realizzati, video generati, voli autorizzati, campagne acquistate o pubblicazioni |

La regia salva coda, errori, costo, fonti, input, versioni e approvazioni nello stesso database. Ha pausa, tetto, lease, tre tentativi e deduplica per cliente/agente. Quattro calendari Europe/Rome e otto eventi locali sono configurabili: nessuna pianificazione si abilita leggendo il registro. `review.created`, `objective.changed`, `brief.approved` richiedono evento DEMO esplicito; non arrivano da provider. `contract.signed` significa contratto registrato DEMO, **non firma digitale**. Il processo deve restare acceso.

I rapporti dello sciame sono riservati ai soci: possono contenere memoria interna. Social/Growth/Fidelity conservano l'approvazione del modulo originale senza duplicarla. La bozza social visibile al cliente esclude gli appunti interni. I feedback ritornano nel contesto, ma i motori deterministici non interpretano semanticamente ogni richiesta: citarla non prova che un creativo l'abbia applicata.

## Servizi S01–S19 del brief integrale

La numerazione qui sotto è quella **del nuovo Playbook**, righe 609–627 del brief integrale. Il campo numerico `catalogue` di `src/registry.js` segue ancora l'ordine del vecchio elenco Italiaonline: **è una discrepanza aperta**. Gli ID testuali permettono di ritrovare le funzioni senza confondere, per esempio, Social S01 con la vecchia voce 1 Presenza.

| Codice e servizio del brief integrale | ID / funzione presente | Stato reale e parte mancante |
|---|---|---|
| S01 Social media management | social | Contenuti, revisioni, approvazioni e calendario locale. Mancano PED/Postiz, pubblicazione e metriche reali |
| S02 Foto, video e drone | video, drone, video-ai | Storyboard, tempi e piani di ripresa. Niente riprese, montaggi, video generati o autorizzazioni di volo |
| S03 Google Ads | ads | Mappa leve e metriche da fixture; nessun account Google Ads, tracciamento o spesa |
| S04 Meta e altri social Ads | ads | Stessa procedura ADV generica; mancano flusso distinto per canale, Meta e altre reti |
| S05 SEO | seo | Audit di pagine fornite, duplicati e intenti; niente crawl/GSC/GA4 o interventi reali |
| S06 Local SEO e GBP | local | Confronto anagrafiche e orari, bozza GBP; niente sincronizzazione reale |
| S07 Presenza multi-directory | presence, multisite | Spazi e confronti di dati forniti; manca partner directory e gestione operativa |
| S08 Reputazione e recensioni | reputation, presence | Bozze di risposta a recensioni DEMO; mancano raccolta, richieste e risposte reali |
| S09 Siti e landing | website | Sitemap, copy iniziale e piano test; nessun sito costruito, form live o manutenzione |
| S10 Accessibilità | accessibility | Rilievi sugli elementi forniti; audit completo, correzioni e prove manuali mancanti |
| S11 E-commerce e social commerce | ecommerce, social-commerce | Catalogo/scorte, ordine di prova, confronto feed; niente negozio, checkout, spedizioni o Meta |
| S12 Prenotazioni | booking, Growth | Verifica slot e prenotazioni commerciali simulate; niente calendario operativo generale o Google live |
| S13 Centralino AI e chatbot | reception | FAQ di esempio e instradamento; niente telefonia, voce/modello AI, numeri o registrazioni |
| S14 Email, CRM, contatti | growth, fidelity | CRM, bozze e gate; nessun invio reale, lista autorizzata o integrazione marketing live |
| S15 Branding | branding, creative-direction | Concept verbali e controlli testuali; nessuna identità visuale/asset finale generato |
| S16 Merch | merch | Distinta, costi e margine da dati completi; manca ciclo fornitore/campione/ordine, escluso acquisizione iniziale |
| S17 Analisi gratuita | audit, analyst | Analisi Growth su fixture e fonti inventate; manca audit web reale e funnel validato |
| S18 Reporting e dashboard | reporter, dashboard | Riepilogo operativo e report in memoria, viste filtrate; mancano misure marketing, storico e consegna completa |
| S19 Offline tramite partner | tv, display | Confronto offerte/formati e allocazione placement; niente acquisto spazi, partner o prova di erogazione |

Le esclusioni storiche `marketplace` e `apple-leasing` restano nel registro. Le schede separate `docs/playbook/Sxx_...` non sono ancora state estratte dal brief: i testi integrali sono nel documento sorgente, non in moduli già completati.

Altri spazi: branding, Growth, Fidelity, GBP, eventi, drone, video AI, direzione creativa. Totale **27**. Sono posti espliciti per il lavoro futuro, non 27 prodotti completi. Insegne, foto, abbigliamento e gadget restano esclusi dalla prima acquisizione automatica per il margine insufficiente, anche quando figurano nel catalogo operativo.

## Dieci moduli gestionali e dashboard

| Modulo | Stato concreto | Gap principale |
|---|---|---|
| Anagrafiche | Clienti, utenti, ditte, controparti e assegnazioni DEMO comuni | Schede e documenti obbligatori completi |
| Commerciale e contratti | Pipeline Growth e contratti DEMO | Preventivi versionati, accettazione, firma, rinnovi |
| Fatturazione e incassi | Bozze, scadenze, incassi e residui | Software fiscale/SDI, generazione completa da canoni, solleciti |
| Scadenziario unico | Obbligazioni, contratti, abbonamenti | Avvisi, fonti e regole fiscali confermate |
| Cassa e prima nota | Movimenti immutabili, storni, rettifiche, quadratura | Fonti reali, migrazione, controlli economici completi |
| Costi e abbonamenti | Elenco DEMO e costo comune agenti | Utilità, variazioni e riparto effettivo |
| Lavoro e marginalità | Minuti, tariffe confermate e stime | Capacità settimanale, costi completi e ore risparmiate |
| Task e consegne | Attività, contenuti e approvazioni | Ricorrenze, dipendenze e migrazione Trello |
| Documenti e autorizzazioni | **Solo struttura**, riferimenti testuali | Archivio tipizzato/versionato, revoche, scadenze e permessi |
| Cruscotto di direzione | Sei domande con dati disponibili e decisioni | Obiettivi/KPI storici, capacità e decisioni strutturate |

**Dashboard soci:** direzione, mappa agenzia, marketing BigAnt, moduli, regia e approvazioni sono navigabili. Marketing è sempre il cliente zero BigAnt. La regia è appena stata estesa: il nuovo percorso completo di 32 agenti non ha ancora un collaudo browser end-to-end finale. Le prove UI precedenti coprono ricerca DEMO, timbro Fidelity, QR, social e accesso cliente.

**Dashboard cliente:** isolamento lato server e servizi acquistati verificati. Panoramica, lead, social, pubblicità, local, reputazione, sito, approvazioni, report e richieste hanno un posto nel registro, con filtro per acquisto. Approva contenuti/campagne autorizzati; non legge economia dell'agenzia o rapporti interni degli agenti. KPI reali, inbox completa, documenti, canali live e alcune viste rimangono struttura o parziali. Non scambiare un menu con un flusso completo.

## Test, problemi aperti e punto esatto di arresto

Ultima suite completa sul commit locale 569c70d: **161 test, 160 superati, 1 fallito, nessuno saltato**. `npm run check` prima della copia del brief superava i cinque gruppi; dopo la copia integrale supera quattro gruppi su cinque e segnala 22 link relativi del testo sorgente verso schede non ancora estratte. Non è un errore di sintassi o del database: il sorgente va conservato senza modifiche e il controllo dei link va adattato distinguendo documenti operativi e fonti incorporate; `npm run demo:agents` supera tutti i 32 casi. Non scrivere “suite verde”.

0. **Controllo documentale non superato:** `scripts/check.js` segnala 22 collegamenti locali mancanti nel brief integrale, che include più documenti concatenati con percorsi relativi. Salvare le schede nei percorsi previsti e gestire i riferimenti del documento sorgente senza alterarne la copia integrale; non creare file vuoti per nascondere il problema.
1. **Test fallito noto:** `tests/agency.test.js:31`, asserzione alla riga 34. Il vecchio test si aspetta `implemented:false` per `review.created`, `content.approved`, `contract.signed`; ora `src/agency/swarm.js` importa gli otto eventi locali implementati. La revisione del contratto è salvata, l'aggiornamento dei test era a metà. Verificare il comportamento e riscrivere la prova senza eliminare la copertura di assenza di attivazione automatica.
2. Il test alla riga 23 dello stesso file filtra gli agenti `planned`: ora non ne trova e passa senza provare nulla. Sostituirlo con controllo positivo dei 32 executor, più rifiuto degli ID sconosciuti. `tests/swarm.test.js` contiene già la corrispondenza forte tra registro ed executor.
3. Nuova UI sciame verificata per sintassi e rendering simulato, **non ancora provata interamente nel browser**. Da provare selezione cliente, prerequisiti, avvio singolo/tutti, risultati, approvazioni canoniche, feedback, retry e schermo piccolo.
4. Vecchie API inventario/documenti possono descrivere lo stato precedente. Leggere questa consegna, le SOP nuove, i test e il rapporto aggiornato prima di interpretare quei conteggi come attuali.
5. Le 32 procedure non soddisfano ancora la richiesta di un'agenzia AI autonoma. Mancano modelli, connettori, fonti reali, validazione dei servizi, trattamento operativo del feedback e pilota misurato.
6. La matrice di 239 righe / 205 requisiti funzionali appartiene al **brief notturno originale**. Il documento esteso di 2.184 righe amplia molto il perimetro: la percentuale sul nuovo integrale non è ancora misurata requisito per requisito. Non trasferire automaticamente il 30,2% al nuovo brief.
7. Il giro `demo:agents` prepara prerequisiti solo nel proprio archivio effimero. Nell'anteprima normale Commerciale/Fidelity possono correttamente fermarsi se manca consenso/opt-in. Non aggirare il blocco per mostrare un successo.
8. La regia e i domini Growth/Fidelity conservano code distinte (`os_jobs`, `gr_jobs`, `fi_jobs`) nello **stesso** SQLite, coordinate dal processo comune. Non affermare che ogni job sia stato migrato in una sola tabella.
9. La revisione ha corretto INSERT risultati, visibilità interna, input delle pianificazioni, revoca servizi, feedback amministrativo, cliente del contratto, eventi social/ricerca e revisione degli esiti con prerequisiti. I test swarm li coprono salvo il percorso HTTP contratto, che merita ancora una prova mirata.

Mi fermo qui: codice nuovo committato e copiato su GitHub, controlli rieseguiti per documentare l'esito; nessun ulteriore sviluppo dopo la richiesta di passaggio. La modifica del test agenzia, la verifica browser e la rimappatura del nuovo brief sono lavoro successivo per Claude Code.

## Prossimi dieci passi consigliati

1. Clonare il ramo remoto, leggere AGENTS, questa consegna e il brief integrale; confermare lo stato Git senza merge o force push.
2. Rieseguire i tre comandi di controllo; correggere il test evento obsoleto e quello vacuo mantenendo prove effettive.
3. Collaudare la UI sciame nel browser, anche come cliente e collaboratore; registrare prove e limiti.
4. Scomporre il brief esteso in requisiti tracciabili e ricalcolare la copertura; mappare numerazione schede servizi e ID del registro.
5. Separare esplicitamente rapporto interno e consegna cliente per gli specialisti, con revisione/approvazione e dati filtrati.
6. Completare memoria, feedback applicabile e SOP per ogni flusso, usando il cliente zero con dati DEMO finché non cambia l'autorizzazione.
7. Implementare documenti/autorizzazioni, preventivi/rinnovi e capacità, che sono gap sostanziali dell'intera agenzia.
8. Validare con i soci i servizi pilota, prezzi, capacità, partner e KPI; il budget di prova resta 50 € mensili, interpretato prudenzialmente come complessivo.
9. Preparare e collaudare un connettore alla volta soltanto quando autorizzato; prima accessi minimi, budget, fonti e cancelli di approvazione. Nessun invio implicito.
10. Prima di una migrazione reale: piano dati, backup e ripristino, accessi nominali, HTTPS, prove parallele Growth/Fidelity/PED e autorizzazione esplicita. Il ramo attuale non va distribuito così com'è.

## Progetti originali, pubblicazione e porting

### BigAnt Growth

Repository privato [lol-afk23456/bigant-growth](https://github.com/lol-afk23456/bigant-growth), revisione sorgenti acquisita `cfd4b0bfc1b9f209474af1eb9ca7fe90c6eb8aa4`. App nota: [BigAnt Growth online](https://bigant-growth-production.up.railway.app/). La ricerca clienti è parte di questo progetto: non abbiamo trovato un terzo repository indipendente.

Railway noto dalla sessione: progetto **BigAnt Growth**, servizio **bigant-growth**, ambiente **production**, ID `45d7d794-b650-4591-97be-6c95ad3cbc05`; servizio ID `584d104b-202f-4368-b9f5-6eb4b7eed9c3`; ambiente ID `d0d54bf2-2627-4de1-8cb2-1817a7e7dd95`. Collegato al repository privato tramite Railway App con autorizzazione dell'utente. Node e SQLite (`growth.sqlite`); niente database gestito separato richiesto dal codice. La UI Railway mostra un deploy attivo riuscito via GitHub, regione EU West, una replica e attività storica di configurazione del volume. Non è stato letto il database o il contenuto del volume.

Otto nomi ambiente osservati nel sorgente e confermati nella UI Railway con valori sempre nascosti: `NODE_ENV` (modalità), `LOCAL_ONLY` (restrizione locale), `PORT` e `HOST` (ascolto), `DATA_DIR` (persistenza), `APP_SECRET` (protezione dei segreti), `APP_ORIGIN` (origine pubblica), `BOOTSTRAP_TOKEN` (creazione iniziale del titolare). Il codice conserva i collegamenti del workspace cifrati in SQLite; non presumere che chiavi AI/Google siano variabili Railway. Non leggere la tabella secrets.

Confluiti nell'OS: dominio/motore, CRM/pipeline/deduplica, ricerca e analisi DEMO, bozze/consenso/opposizioni, import/export, token/prenotazioni locali, riconciliazione simulata, costi/audit, approvazioni versionate e conversione lead→cliente comune. File `src/growth*.js`; inventario funzione per funzione in [GROWTH-INVENTARIO](../research/GROWTH-INVENTARIO.md).

Non confluiti come capacità reale: provider OpenAI/Brave, lettura siti reali, OAuth Gmail/Calendar, invii, inbox e appuntamenti Google effettivi; nessun dato, password o token originale importato. I provider OS sono solo simulatori `.example` e i percorsi di connessione restituiscono un blocco.

### BigAnt Fidelity

Repository privato [lol-afk23456/Fidelity](https://github.com/lol-afk23456/Fidelity), maiuscola compresa. Revisione GitHub analizzata `350d64f16826530d1c64e6d3cbe998e3adbdd587`; copia locale originale `main` a `9c86baf4ed2b0d2ab3c67e3d4415da40bc3bebda` con branding non committato, lasciata intatta. App nota: [Fidelity online](https://fidelity-lpf-production.up.railway.app/).

Originale: TypeScript ESM, Node 24, Express 5, React 19, Vite e SQLite nativo. Singola istanza con worker nello stesso processo e volume persistente previsto. Metadati Railway verificati in sola lettura nella consegna: progetto **Fidelity - LPF Sporting Club**, ID `e2d6eb19-b4b5-473f-88fe-e78f97c63b15`; servizio **fidelity-lpf**, ID `f38cb510-dcc5-4b26-94e5-70fc5bdc7c7a`; ambiente **production**, ID `d8328777-8a7f-4446-998e-bb1b1b7aa929`. La UI mostra deploy attivo riuscito via GitHub, EU West, una replica. L'attività storica indica collegamento a Fidelity main e backup pianificati dei volumi `fidelity-lpf-volume` e `fidelity-lpf-2026-10-06 20:56 UTC`: nessun backup aperto o ripristinato durante la consegna. Non è stata riconfermata l'associazione del volume attuale nella scheda dedicata.

Le **sette variabili di servizio effettivamente elencate** in Railway sono `NODE_ENV`, `HOST`, `PORT`, `DATABASE_PATH`, `TRUST_PROXY`, `PUBLIC_BASE_URL`, `RAILWAY_RUN_UID` (utente del processo). Tutti i valori sono rimasti nascosti. Le chiavi Wallet non compaiono in questo elenco: ciò non dimostra da solo assenza di file o configurazioni altrove.

Nomi delle variabili previsti da `.env.example` e dal codice Fidelity, **non prova che siano configurati su Railway**:

| Nomi | Scopo |
|---|---|
| NODE_ENV, HOST, PORT | Modalità e ascolto server |
| DATABASE_PATH | File SQLite persistente |
| PUBLIC_BASE_URL, TRUST_PROXY | URL pubblico e proxy inverso |
| GOOGLE_ISSUER_ID, GOOGLE_SERVICE_ACCOUNT_FILE | Emittente e file account di servizio Google Wallet |
| APPLE_PASS_TYPE_ID, APPLE_TEAM_ID | Identificativi Pass Type e team Apple |
| APPLE_SIGNER_CERT_PATH, APPLE_SIGNER_KEY_PATH, APPLE_SIGNER_KEY_PASSPHRASE, APPLE_WWDR_CERT_PATH | Percorsi certificati/chiave e protezione della firma Apple |

Il Dockerfile originale compila il progetto e avvia `node dist/server/index.js`; database `fidelity.sqlite`, senza servizio SQL separato previsto. Non aprire i file delle credenziali per completare questo inventario.

Confluiti nell'OS: clienti/ruoli comuni, programmi timbri/punti/coupon, iscritti/consensi, ledger/riscatti/storni, carte web, QR, loghi raster, export/anonimizzazione, metriche, segmenti/campagne, automazioni di preparazione, approvazioni/feedback, generatori puri dei payload Wallet. File `src/fidelity*.js`; dettaglio in [FIDELITY-INVENTARIO](../research/FIDELITY-INVENTARIO.md).

Non confluiti come capacità reale: emissione firmata Apple/Google, registrazione dispositivi/APNs, provisioning Google, notifiche, retry/recovery provider e revoche remote, migrazione carte emesse. Il blocco Apple Deployment segnalato dall'utente **non è stato risolto**. Nessun certificato o account reale copiato. Scanner fotocamera e prova dispositivo ancora da collaudare.

### PED / Leadpad / Gelpad

Nella conversazione l'utente usa anche PAD/PEMD per il PED dei piani editoriali: [ped.bigantagency.it](https://ped.bigantagency.it/). Ha fornito un accesso amministrativo web, non repository/API. L'interfaccia è stata ispezionata in sola lettura: clienti, piani, chat, notifiche, revisioni e calendario. Client Supabase 2.45.0 osservabile; backend, schema, RLS e pipeline non verificati. Alfonso è il referente richiesto per ottenere il codice. In una fase precedente l'utente ha detto di non toccare il codice fatto da Riccardo: conservare entrambi i riferimenti senza supporre che siano la stessa persona. Nessuna modifica al PED.

## Decisioni e preferenze della chat da non perdere

- BigAnt OS deve coprire **tutta l'agenzia**, non soltanto Growth/Fidelity/amministrazione. L'utente ha fermato esplicitamente quella deriva e chiesto tabella onesta di copertura, tutti i moduli e tutti gli agenti.
- La prima idea era acquisizione clienti autonoma da zero e vendita del prodotto dopo un anno. Il brief notturno successivo definisce un gestionale **interno**, per pochi utenti e decine di clienti; non costruire un SaaS pubblico sulla base della richiesta vecchia.
- Budget iniziale 200 €/mese, poi ridotto dall'utente a **50 €/mese** per prova. Abbonamento Railway dichiarato circa 20 €/mese già acquistato per Fidelity; voleva riutilizzarlo mentre Apple era bloccata. Non abbiamo verificato credito residuo, imposte o ripartizione. Nessuna nuova spesa autorizzata in OS.
- Acquisizione prioritaria: video, siti web, social e sponsorizzate; escludere insegne, foto, abbigliamento e gadget personalizzati perché rivenduti con margine insufficiente. Il catalogo operativo più ampio non annulla questo filtro commerciale.
- Richiesta di brand BigAnt: logo originale e, nel brief OS più recente, arancione `#F26B21`. Le vecchie app usavano altri colori. Gli asset OS sono copie PNG testuali reversibili con hash verificato, necessarie perché l'upload browser dei PNG era rimasto bloccato. Non sono loghi ridisegnati.
- Vuole vedere e provare l'app dal lato soci e dal lato cliente, come l'anteprima Fidelity, non soltanto racconti o simulazioni in chat. Linguaggio UI semplice e italiano; dettagli tecnici nei documenti.
- Preferisce autonomia e poche richieste di conferma; non significa autorizzazione a inviare, spendere o modificare produzione. L'ultimo incarico è solo consegna a Claude, poi fermarsi.
- Aveva chiesto “nulla sul Mac, tutto online”; il perimetro successivo consente file tecnici nella cartella del nuovo repository e DEMO locali. Non salvare credenziali sul Mac o nel repository. Archivi reali e `04_ACCESSI` non vanno aperti. Non è stato creato un archivio finale di password.
- Contatto operativo richiesto nella prima prova: la casella Gmail personale indicata dall'utente; mail agenzia citata: la casella personale sul dominio dell'agenzia. Sono riferimenti di accesso, non destinatari autorizzati per nuovi invii. Gmail/Workspace indicato dall'utente, che dice di poter accedere all'amministrazione Google Cloud/Workspace. Chiavi OpenAI e Brave allora da creare; nessuna connessione reale provata nell'OS.
- L'utente segnalò login GitHub con Google in Chrome e confusione col vecchio account. Il repository **effettivamente verificato e autorizzato** rimane sotto `lol-afk23456`. Non è provata la creazione di un secondo account indipendente o un trasferimento di proprietà.
- Railway App autorizzata dall'utente al repository privato Growth, mantenendo i permessi Fidelity esistenti. Niente nuove autorizzazioni o token creati per OS durante questo incarico.
- Setup Growth: errore “non autorizzata” risolto riallineando il codice di attivazione al BOOTSTRAP_TOKEN con autorizzazione mirata; l'utente ha confermato di essere entrato. Questo non prova Gmail/Calendar collegati. Non riportare codici o password condivisi nella chat.
- Credenziali e codici sono comparsi in chat in passato: sono deliberatamente esclusi da questa consegna. Non considerarli recuperabili da un documento di password e non riusarli automaticamente. Eventuale gestione o rotazione passa dal proprietario e dal suo gestore sicuro.
- Report remoti autorizzati storicamente: solo i tre documenti della cartella [BigAnt OS — Report notturni](https://drive.google.com/drive/u/0/folders/17P2Zg4dvhi8ZODnPMcMFQg6lB4xkIzad). Il salvataggio attuale richiesto è **nel repository**; questa consegna non aggiorna Drive. Le copie Drive possono quindi essere meno recenti.
- Il master agenzia citato inizialmente era `BigAnt_Documento_Master_Memoria.md` nei Download. È una fonte di contesto, non un permesso di trasferire clienti o accessi. Dati anagrafici/contabili reali non sono stati usati nelle fixture.

## Integrità del brief e lacune del nuovo perimetro

`docs/BRIEF-BIGANT.md` è ora la copia **integrale e senza modifiche** del file `PROMPT-CODEX-GOAL-COMPLETO.md` fornito dall'utente: 2.184 righe, 154.656 byte, SHA-256 `a5623a01b084faad179955f9f00feea83fbacfb1313fd9e0a7bd744f73dd91b6`.

Il vecchio testo è conservato in [BRIEF-NOTTE-ORIGINALE.md](BRIEF-NOTTE-ORIGINALE.md): 567 righe, 45.310 byte, SHA-256 `af2357c44f5354e6b2a47e3dec8f778ec869f022a20692eb6c99911ba96ff9c1`, identico all'allegato notturno originale. La matrice storica usa ancora le sue righe e i suoi ID AG-/MIG-.

Non ancora consegnati rispetto al nuovo integrale: matrice R-xxx per tutte le parti, separazione dei file `docs/playbook/` secondo i marcatori, `docs/INTEGRAZIONI.md`, `docs/INTEGRAZIONI-ACCESSI.md`, `docs/SITO-BIGANT.md` e modelli di pagina, `docs/REPORT-FINALE.md`, scenario completo lead→contratto→produzione→fattura→incasso→upsell a 13 passaggi. Esistono materiali parziali in PLAYBOOK, ROADMAP e nelle API, ma non equivalgono alle nuove consegne. Anche la regola di copertura uniforme fra macro-aree non è stata verificata. Il sito online resta intatto.

Il testo sorgente conserva proposte di prezzi e istruzioni sugli accessi datate 8 ottobre: sono materiale fornito, non prezzi validati né autorizzazioni effettivamente ottenute. La Parte 0.6 dice che GBP, Google Ads, Meta, GA4 e Search Console sono in richiesta; non c'è prova delle relative approvazioni nel prototipo.

## Mappa dei file da leggere

`AGENTS.md` → questa consegna → [brief integrale](BRIEF-BIGANT.md) → [copertura](VERIFICA-COPERTURA-BRIEF.md) → [diario](DIARIO-LAVORO.md) → [decisioni](DECISIONI.md). Per codice: `server.js`, `src/store.js`, `src/orchestrator.js`, `src/agents/`, `src/agency/`, `src/growth*.js`, `src/fidelity*.js`, `src/administration.js`, `src/production.js`, `public/app.js`. Per le prove nuove: `tests/swarm.test.js`, `tests/module-agents.test.js`, `tests/specialists.test.js`, `scripts/demo-all-agents.js`.

I file esclusi da Git sono `.data`, `.cache`, `.sources` e dipendenze installate. Il repository contiene codice, fixture e documentazione, non backup di produzione. La copia remota è la base da usare per proseguire.
