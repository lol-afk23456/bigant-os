# Ordine di configurazione degli agenti — FUN-054

10 ottobre 2026. Sequenza del riordino basata sui servizi dichiarati attivi nel [brief](BRIEF-BIGANT.md), tabella S01–S19, e sul [catalogo](../src/servizi/catalogo.js). Non attesta acquisti correnti o attivazioni reali. La verifica aggregata dei servizi effettivamente venduti dalle fonti autorizzate e il piano completo dei 32 agenti appartengono a T4.

## Prima di iniziare

Completare struttura, permessi e scheda cliente. In Servizi → Piano di attivazione confrontare lo stato corrente con il servizio acquistato dalla singola attività. “Attivo” nel catalogo significa offerto dall’agenzia, non autorizza un agente. Se il servizio non è più venduto, rinviare la sua riga.

Configurare un solo agente per volta: compito, SOP, istruzioni, fonti consentite, risultato atteso, controllo umano, costo e avvio manuale. Le procedure Base restano distinte dall’AI pronta e dall’uso reale. Non aprire nuove integrazioni solo per completare la sequenza.

## Sequenza iniziale

| Ordine | Agente e servizio | Primo lavoro utile | Condizione di avanzamento |
|---|---|---|---|
| 1 | Social (`social`) · S01, attivo nel brief | Bozze dal brief, DNA, strategia e materiali autorizzati della sola attività | Versioni, qualità, costo e approvazione del socio o collaboratore assegnato. Percorso già predisposto: [SOP](SOP-AGENTE-SOCIAL.md), [prove](COLLAUDO-AGENTE-SOCIAL.md). Primo uso reale ancora da autorizzare |
| 2 | Qualità (`quality`) · supporto S01 | Controllare una bozza e restituire rilievi nella stessa revisione. Percorso manuale predisposto: [SOP](SOP-AGENTE-QUALITA.md), [prove](COLLAUDO-AGENTE-QUALITA.md) | Non pubblica né sostituisce la decisione umana; testo o fonti modificati rendono superato il parere. Primo uso reale ancora da autorizzare |
| 3 | Local (`local`) · S06, attivo nel brief | Dati GBP con fonte/data e proposte di miglioramento | Account e scheda corretti, lettura autorizzata; nessuna risposta automatica. Il collegamento GBP non autorizza il trasferimento dei dati all’AI |
| 4 | Ads (`ads`) · S03/S04, attivi per Google e Meta | Analisi e proposte da obiettivi, budget e misure verificate | Canali distinti, assenza di dati dichiarata; nessuna modifica campagne o spesa. LinkedIn/TikTok non ereditano l’attivazione Meta |
| 5 | Video (`video`), poi Direzione creativa (`creative-direction`) · S02 | Brief, storyboard, piano riprese, formati e diritti | Una configurazione alla volta e revisione umana. Drone/video AI solo se richiesti dal lavoro acquistato |
| 6 | Branding (`branding`) · S15, attivo nel brief | Coerenza dei materiali con identità approvata | Fonti, diritti e revisione del responsabile creativo |
| 7 | Siti (`website`) · S09, attivo nel brief | Mappa pagine e revisione dei contenuti | Perimetro concordato, nessuna modifica live implicita. SEO S05 segue se acquistata e con fonti disponibili |
| 8 | Merch (`merch`) · S16, attivo nel brief | Specifiche e confronto di preventivi forniti e verificati | Nessun ordine o prezzo promesso; servizio su richiesta |
| 9 | Reporter (`reporter`) · S18, in costruzione | Sintesi di misure e lavori verificati nei servizi | Fonte/data, nessun numero inventato, visibilità al cliente dopo verifica del socio |

Anticipare una consegna effettivamente dovuta o un blocco operativo documentato, registrandone il motivo nel Piano di attivazione. Non dedurre priorità dai clienti DEMO o da ricavi stimati.

## Growth e servizi futuri

D-12: prima collaudo Fidelity, poi Growth ricerca/analisi senza invii, poi Google Wallet e infine invii. Apple resta esclusa dalle attivazioni della tranche corrente.

S17/Growth: Ricerca (`research`) → Analisi (`analyst`) → Commerciale (`commercial`), uno alla volta, con fonti e risultati precedenti verificati. La ricerca non contatta attività; una bozza non autorizza Gmail. Messaggi Growth e campagne Fidelity sono approvati solo dai soci. Calendar, Wallet e invio manuale hanno prerequisiti propri.

S07/S08, S10–S14 e altri servizi futuri seguono una decisione nel Piano di attivazione e una domanda effettiva. Il registro manuale Email marketing non richiede né abilita un agente di invio. Marketing e Direttore crescita lavorano su BigAnt dopo fonti aggregate affidabili; amministrazione separata dagli specialisti dei clienti. Nessun avvio simultaneo dei 32 agenti.

## Preparazione e uso reale

Per ciascuno: SOP → configurazione versionata → prova tecnica con dati inventati → revisione dell’esito → autorizzazione del proprietario per il primo uso reale → incarico manuale sul servizio acquistato → verifica di risultato e costo → eventuale autorizzazione distinta della pianificazione. Una prova fallita si risolve prima dell’agente successivo.

OpenAI e Anthropic restano predisposti, scelta rinviata. Costi complessivi ancora da riconciliare; tetto 50 €/mese e stop prima di 40 €. Prezzo del modello e consumi reali si verificano al suo turno, senza inventare stime.

FUN-054 richiede questo ordine scritto; non chiude FUN-053/FUN-055, i collaudi reali o T4. Stato: percorso Social verificato con fornitore simulato, nessun nuovo agente configurato o attivato da questo documento.
