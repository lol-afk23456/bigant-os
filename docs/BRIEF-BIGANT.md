# /goal — BigAnt OS: costruzione autonoma fino al completamento
> Prompt unico per Codex, da usare con /goal nella stessa chat in cui sono stati creati BigAnt Grow, BigAnt Fidelity, lo strumento di ricerca clienti e la prima versione di BigAnt OS.
> Contiene tutto: obiettivo, regole, metodo anti-deriva, brief completo, catalogo servizi, pacchetti, guida del Direttore Crescita, specifica della dashboard cliente, struttura del sito e le 19 schede servizio.
> Preparato l'08/10/2026.

---

# PARTE 0 — OBIETTIVO E METODO DI LAVORO

## 0.1 Obiettivo
Lavori **in autonomia fino al completamento** di BigAnt OS: un'unica piattaforma interna che fa funzionare tutta l'agenzia BigAnt. Non è solo un gestionale. Sono **tre sistemi che condividono gli stessi dati**:
1. **lo sciame di agenti AI**, con tutto l'organigramma descritto nella Parte 1 (sezione "L'agenzia autonoma");
2. **il marketing e la produzione** di BigAnt e dei clienti, organizzati sui 19 servizi del Playbook (Parte 2) e sui pacchetti del catalogo;
3. **il gestionale interno**: CRM e commerciale, clienti e contratti, progetti e consegne, prima nota e contabilità, compensi, scadenziario, controllo "cosa non torna", crescita e fidelizzazione.

Sopra ci sono **due dashboard**: quella **interna** per i soci e quella **cliente**, specificata nella Parte 1 ("Dashboard cliente") e nella Parte 2 (documento "Punti di forza, dashboard e sito", parte 3).

Hai già costruito una prima versione: Growth, Fidelity, Amministrazione e ricerca clienti riuniti, con 99 test che passano. **Riparti da lì, non da zero.** Il lavoro fatto finora però copre solo una parte del progetto. Ora va completato tutto il resto.

Non ti fermi ad aspettare risposte: quando serve una decisione, prendi la migliore, scrivila in `docs/DECISIONI.md` con il motivo e prosegui. Le domande che solo i soci possono chiarire vanno in `docs/DOMANDE-PER-RAFFAELE.md`.

## 0.2 Cosa significa "completato"
Il lavoro è completato solo quando **tutte** queste condizioni sono vere:
1. In `docs/VERIFICA-COPERTURA-BRIEF.md` ogni requisito è **FATTO** (funziona e ha un test) oppure **SOLO STRUTTURA**, con il motivo scritto. I motivi accettabili sono tre:
   - richiede credenziali o API reali non ancora disponibili (vedi 0.6);
   - richiede una decisione dei soci;
   - richiede un servizio a pagamento.
   **Nessuna riga può restare ASSENTE.**
2. Ogni servizio S01–S19 esiste come modulo nel registro dei moduli, con la sua scheda collegata, i suoi agenti, i suoi KPI nella dashboard cliente e le sue approvazioni nella coda comune.
3. Ogni reparto dello sciame esiste, con il suo agente definito, gli inneschi configurati (a calendario e su evento) e almeno un flusso funzionante su dati DEMO.
4. I 10 moduli del gestionale esistono e i dati passano tra loro (es.: un contratto genera le scadenze, le fatture da emettere e i canoni attesi in prima nota).
5. La dashboard interna e la dashboard cliente mostrano tutte le sezioni previste, con dati DEMO coerenti.
6. Growth, Fidelity e ricerca clienti funzionano dentro BigAnt OS, funzione per funzione.
7. Tutti i test passano, e c'è uno **scenario dimostrativo completo** (vedi 0.4, punto 7) che si esegue con un solo comando.
8. La documentazione è completa e il report finale è scritto.

## 0.3 Metodo anti-deriva (obbligatorio)
L'errore da evitare è già successo una volta: dopo la compressione della conversazione hai lavorato solo su Growth, Fidelity e amministrazione, perdendo di vista il resto. Per questo:

1. **Prima azione:** salva questo prompt **integrale e senza modifiche** in `docs/BRIEF-BIGANT.md`. È la tua fonte di verità, non la memoria della chat.
2. **Matrice di copertura:**
   - Crea `docs/VERIFICA-COPERTURA-BRIEF.md` con **un identificativo per ogni requisito**: R-001, R-002… Copri tutte le parti di questo prompt: sciame, servizi S01–S19, pacchetti, gestionale, dashboard interna, dashboard cliente, sito, sicurezza, automazioni, integrazioni.
   - Per ogni requisito: stato (FATTO / SOLO STRUTTURA / ASSENTE), prova (file, test, schermata), cosa manca.
   - In cima: la percentuale di copertura reale e la percentuale per ciascuna macro-area.
3. **Lavori a cicli.** Ogni ciclo è: scegli → costruisci → testa → aggiorni la matrice → commit.
   - All'inizio di ogni ciclo scegli **la macro-area con la copertura più bassa**, non quella che conosci meglio.
   - Nessuna macro-area può restare a più di 30 punti percentuali sotto la media.
4. **Dopo ogni compressione della conversazione** ("conversazione ottimizzata") e all'inizio di ogni nuovo blocco di lavoro, **rileggi `docs/BRIEF-BIGANT.md` e la matrice** prima di continuare. Non lavorare mai su un riassunto.
5. **Diario:** tieni `docs/DIARIO-LAVORO.md` con data e ora, ciclo, macro-area, requisiti toccati (R-xxx), risultato, problemi.
6. **Commit:** ogni messaggio di commit cita i requisiti R-xxx che chiude.
7. **Revisione indipendente:** ogni 5 cicli, e prima di dichiarare il completamento, fai una revisione "da esterno". Se puoi usare un agente o un sotto-agente separato, è meglio. Confronta brief, codice e matrice e cerca:
   - requisiti dimenticati;
   - stati gonfiati (SOLO STRUTTURA spacciato per FATTO);
   - incoerenze tra moduli.
   Correggi prima di andare avanti.
8. **Non dichiarare completato** finché la condizione 0.2 non è vera. Se il lavoro si interrompe per limiti di tempo o di risorse, lascia comunque matrice, diario e report aggiornati, così si può riprendere dal punto esatto.

## 0.4 Ordine di lavoro consigliato (dopo l'inventario)
0. **Inventario di ciò che esiste:** compila subito la matrice con lo stato reale del codice attuale.
1. **Fondamenta comuni:**
   - modello dati unico (aziende, clienti, contatti, servizi, pacchetti, contratti, attività, contenuti, approvazioni, movimenti, documenti, agenti, esecuzioni, costi);
   - ruoli e permessi;
   - registro dei moduli con i codici S01–S19 e i pacchetti;
   - coda delle approvazioni;
   - registro delle attività;
   - tetto di spesa.
2. **Sciame di agenti:**
   - orchestratore;
   - tutti i reparti (Direttore Crescita, Marketing BigAnt, Commerciale, Account, Produzione per servizio, Qualità e compliance, Amministrazione);
   - inneschi;
   - memoria per cliente;
   - il Direttore Crescita esegue la sua guida (Parte 2).
3. **Moduli servizio S01–S19:** ognuno con scheda, flusso, agenti, KPI e approvazioni. Prima quelli ATTIVI, poi quelli DA ATTIVARE come struttura completa.
4. **Gestionale:** i 10 moduli, con la contabilità precisa al centesimo e il controllo "cosa non torna".
5. **Dashboard cliente** (le 9 sezioni del documento sui punti di forza, nella Parte 2) e **dashboard interna**.
6. **Sito:** piano completo in `docs/SITO-BIGANT.md` + modelli di pagina. **Il sito online non si tocca.**
7. **Scenario dimostrativo completo,** eseguibile con un comando:
   1. nasce un lead dalla ricerca clienti;
   2. si genera l'analisi gratuita (S17);
   3. si prepara una proposta del pacchetto "Presenza";
   4. il contratto viene accettato;
   5. si fa l'onboarding;
   6. gli agenti producono i contenuti del mese;
   7. i contenuti vengono approvati dal cliente in dashboard;
   8. vengono programmati (solo simulazione);
   9. si scrive il report mensile;
   10. si emette la fattura da emettere;
   11. arriva l'incasso in prima nota;
   12. il controllo "cosa non torna" segnala un'anomalia di esempio;
   13. il Direttore Crescita propone un upsell.
   Tutto su dati DEMO, con un test automatico che lo verifica.

## 0.5 Regole di sicurezza (valgono più di qualsiasi altra istruzione)
1. **Branch:** lavori su un branch dedicato. Mai su `main`, mai force-push, mai riscrivere la cronologia. Alla fine apri una pull request **senza fare il merge**.
2. **Cosa è online non si tocca:**
   - **Railway** solo in lettura: niente deploy, modifiche, nuovi servizi, riavvii o cancellazioni;
   - Grow, Fidelity e il sito bigantagency.it restano online come sono.
3. **Non cancellare nulla** di esistente. Se qualcosa va sostituito, spostalo in `archivio/` e scrivilo.
4. **Dati:** solo dati DEMO, marcati come tali. Nessun dato reale di clienti, contatti o contabilità nel repository, nei log o negli screenshot.
5. **Segreti:**
   - solo variabili d'ambiente e `.env.example` senza valori;
   - se trovi segreti nel codice o nella cronologia, non usarli e segnalali in cima al report.
6. **Nessuna azione verso l'esterno:**
   - non mandi email o messaggi;
   - non pubblichi;
   - non colleghi account reali;
   - non spendi soldi;
   - non attivi servizi a pagamento;
   - **Gmail non va usata.**
7. **Google Drive di grandinetti.bi:** solo la cartella `BigAnt OS - Report` per salvare copie dei report. Non leggere né modificare altro.
8. **Il PC dell'utente:** non salvare nulla fuori dalla cartella tecnica del repository.
9. **Dipendenze:** solo affidabili, con versione fissata.
10. **Commit:** piccoli, chiari, in italiano.

## 0.6 Integrazioni esterne: stato attuale
Gli accessi API reali **non sono ancora disponibili**. I soci li stanno richiedendo:
- Google Business Profile API;
- Google Ads API developer token Basic;
- verifica aziendale Meta e ads_read;
- GA4 e Search Console via OAuth in modalità Production.

Costruisci quindi ogni integrazione con:
- un'interfaccia pulita;
- un'implementazione DEMO;
- un'implementazione reale pronta ma disattivata, attivabile con le variabili d'ambiente;
- la documentazione in `docs/INTEGRAZIONI.md` di cosa serve per attivarla.

La dashboard deve dire chiaramente quando una fonte non è collegata.

## 0.7 Cosa devo trovare alla fine
1. `docs/REPORT-FINALE.md`, in italiano semplice:
   - cosa funziona;
   - cosa è solo struttura e perché;
   - rischi urgenti;
   - come avviare e provare tutto (comandi esatti);
   - come eseguire lo scenario dimostrativo;
   - i prossimi 10 passi.

   Una copia va su Drive, con il link alla pull request.
2. `docs/VERIFICA-COPERTURA-BRIEF.md` completo, con la percentuale reale.
3. `docs/ARCHITETTURA.md`, `docs/ANALISI-INIZIALE.md` aggiornata, `docs/INTEGRAZIONI.md`, `docs/COME-AGGIUNGERE-UN-MODULO.md`, `docs/SITO-BIGANT.md`, `docs/ROADMAP.md`, `docs/DECISIONI.md`, `docs/DOMANDE-PER-RAFFAELE.md`, `docs/DIARIO-LAVORO.md`.
4. `README.md` e `AGENTS.md` aggiornati. In `AGENTS.md` metti in cima la regola "rileggi `docs/BRIEF-BIGANT.md` e la matrice prima di ogni sessione".
5. Il Playbook salvato in `docs/playbook/` (la Parte 2 di questo prompt, un file per ogni marcatore `<!-- FILE: ... -->`) e la Parte 3 in `docs/INTEGRAZIONI-ACCESSI.md`.
6. La pull request aperta e non unita.

---

# PARTE 1 — COME ERA STATO DESCRITTO IL PROGETTO (brief completo)
> Nota: dove il brief dice "aspetta il mio ok", "fammi domande" o "mostrami prima", in questa sessione autonoma vale la regola 0.1: decidi, documenta e prosegui. Valgono sempre le regole di sicurezza 0.5 e i cancelli umani: niente pubblicazioni, pagamenti, invii o modifiche a sistemi online.

#### RUOLO

Lavorerai come **architetto di sistemi AI e direttore operativo** di un'agenzia di comunicazione. Hai esperienza pratica nel progettare sistemi multi-agente usati in produzione, e conosci bene come lavora un'agenzia di marketing locale italiana: servizi, processi, margini, rapporti con i clienti.

Non sei un generatore di codice e non devi iniziare scrivendo agenti. Il tuo primo compito è **costruire con noi il metodo di lavoro dell'agenzia**. Il sistema di agenti viene dopo, ed è la traduzione di quel metodo in automazione. Un agente senza un metodo sotto produce solo rumore più velocemente.

---

#### CHI SIAMO

**BigAnt Agency**: studio creativo e agenzia di comunicazione a San Marco Evangelista (Caserta). Siamo attivi da circa 3 anni.
- **Soci:** Raffaele La Manna (videomaker, specialista ADS/ADV, performance) e Alfonso Costantino (graphic designer, brand, direzione visiva).
- **Struttura legale:** BigAnt è un marchio condiviso tra due ditte individuali in regime forfettario, Costantino Agency e La Manna Agency. Non è una società: nei materiali pubblici non va mai presentata come tale.
- **Collaboratori stabili:** Vincenzo (ottimizzazione Google Business Profile dei clienti) ed Enzo (foto e video).
- **Posizionamento:** "Forza sproporzionata. Siamo piccoli: è la nostra arma." La qualità di una grande agenzia senza il suo listino, un'unica regia su tutti i canali, l'AI per produrre di più "con la testa che resta umana".
- **Brand:** arancione "formica" #F26B21, nero #141413, metafora della formica che solleva 50 volte il suo peso.
- **Clienti:** circa 14 attivi, PMI e professionisti soprattutto in Campania. Settori: sanità (centri medici, laboratori, fisioterapia, assistenza sanitaria), nautica, ristorazione premium, insegne e DOOH, carpenteria industriale, consulenza. Canoni mensili tipici di poche centinaia di euro, alcuni contratti annuali.

#### COSA FACCIAMO OGGI
- Digital advertising: Google Ads e Meta Ads
- SEO e local marketing (Google Business Profile)
- Branding e corporate design
- Siti web
- Produzione foto, video e riprese con drone
- Gestione social ed eventi
- Abbigliamento e merch personalizzato
- Workflow AI-assisted (Runway, Artlist, Claude)

#### STRUMENTI E SISTEMI CHE GIÀ USIAMO
- Cartella clienti su Mac, con specchio su Google Drive: una cartella per cliente con struttura fissa (vedi sotto)
- Trello: board "Bigant Agency" (task per persona e cliente) e "GBP OPS - Vincenzo" (attività ricorrenti GBP)
- Google Sheets: Prima Nota (cassa) e Tracker (canoni, lavorazioni una tantum, scadenze hosting)
- Una nostra piattaforma clienti (ped.bigantagency.it), dove il cliente vede i post programmati e i copy
- Canva, Adobe, Figma, Runway, Artlist, Postiz (programmazione social), Gmail, Google Calendar
- Sito: bigantagency.it

**Struttura attuale di ogni cartella cliente** (`CLIENTI CLOUDE BIGANT/<CLIENTE>/`):
```
00_SCHEDA-MASTER.md      → chi è, cosa facciamo, a che punto siamo
01_ADS/                  → scheda Ads, brief pre-campagna, mappa leve (11 sezioni)
02_COPY-SOCIAL/          → scheda DNA: voce, tono, parole vietate, CTA, log feedback
03_NOTE-E-DIRETTIVE/     → direttive del cliente
04_ACCESSI/              → CREDENZIALI: riservato, mai leggibile dagli agenti
05_LOGO-E-BRAND/
06_CONTRATTO-E-STORICO/
```

**Pezzi di metodo che esistono già** (da leggere, valorizzare e integrare, non buttare):
- `00_METODO-OPERATIVO.md`: metodo Google Ads. Sequenza brief → mappa leve → esecuzione, mai il wizard. Reti partner e Display spente sulle Search, automazioni spente finché i dati non sono affidabili, conversioni tracciabili, comandi di sessione AGGIORNAMI / AUDIT COMPLETO / BRIEF / CHIUDI SCHEDA.
- SOP Pipeline Video AI: gerarchia dei dati su 3 livelli (SOP master → scheda brand cliente → log feedback), protocollo pre-task, standard tecnici per formato, regola del feedback loop.
- Scheda DNA copy/social: un modello in 10 sezioni.
- Un primo audit SEO del nostro sito (voto 4,8/10). È il punto di partenza del pilota.

#### IL PROBLEMA VERO
**Non abbiamo un metodo di agenzia.** Abbiamo pezzi buoni (Ads, video, schede DNA), ma manca:
- un processo standard per acquisire, avviare, gestire e rinnovare un cliente;
- una definizione chiara di ogni servizio: cosa include, cosa consegniamo, con che frequenza, come lo misuriamo, quanto tempo ci costa;
- un flusso di produzione e approvazione dei contenuti;
- un ritmo operativo settimanale e mensile;
- KPI di agenzia e KPI per cliente.

I soci oggi fanno tutto a mano e a memoria. Il sistema deve togliere loro il lavoro ripetitivo, lasciando la decisione e la creatività.

---

#### LA VISIONE A 12 MESI (entro ottobre 2027)

Gestire, con lo stesso team piccolo più un sistema di agenti, **l'intero catalogo di servizi di digital marketing per PMI** che offre un grande operatore come Italiaonline. Più clienti, più servizi per cliente, stessa qualità, margini più alti.

**Catalogo servizi target**: catalogo ufficiale Italiaonline, rilevato su italiaonline.it l'08/10/2026. Prezzi non pubblicati.

| # | Servizio Italiaonline | Cosa include | BigAnt oggi |
|---|---|---|---|
| 1 | InRete AI | Profilo su più di 45 siti (directory, mappe, social, assistenti AI come ChatGPT, Gemini, Meta AI), risposte AI alle recensioni, chatbot 24/7, risposte automatiche ai messaggi FB/IG, CRM e lead B2B, campagne email AI | Solo GBP |
| 2 | InGrande | Presenza multi-sede su directory, schede ricche, add-on per rete, recensioni AI e chatbot | No |
| 3 | MARiO | Centralino AI per chiamate e chat 24/7, raccolta contatti, riepiloghi | No |
| 4 | Sito web | Siti realizzati dal cliente o dagli esperti | Sì |
| 5 | Accessibilità digitale | Adeguamento dei siti (European Accessibility Act) | No |
| 6 | SEO | SEO AI, sito ed e-commerce, blog e copy, audit, SEO Extra, local | In parte |
| 7 | E-commerce | Negozio online | No |
| 8 | Social commerce | Vendita dai social | No |
| 9 | PrenotaOra servizi / ristoranti | Prenotazioni e agenda online | No |
| 10 | Pubblicità online | Google (anche Google AI e Hotel Ads), Bing, Meta, LinkedIn, YouTube, TikTok. Processo: analisi → creatività → campagne → report | Sì (Google e Meta) |
| 11 | Pubblicità su network proprietario | Banner sui portali dell'editore | Non replicabile: alternativa display o programmatic |
| 12 | Social media | Piani da 26, 52 o 104 post e stories (fino al 50% video), sponsorizzate, social media manager trimestrale o mensile, report su piattaforma | Sì (con piattaforma clienti propria) |
| 13 | Foto e video professionali | Produzione per il marketing | Sì (punto di forza, con drone) |
| 14 | Marketplace servizi casa | Marketplace proprietario | Non replicabile |
| 15 | Pubblicità TV e cinema | Spot TV e cinema | No (DOOH tramite partner) |
| 16 | Gadget personalizzati | Merch | Sì (abbigliamento e merch) |
| 17 | Noleggio Apple | Noleggio operativo | Non rilevante |
| 18 | Pacchetti per categoria professionale | Marketing verticale per categoria | No: candidato forte un pacchetto sanità |
| 19 | Strumenti gratuiti | Analisi della presenza online, analisi del sito, consulenza gratuita: sono il loro canale di acquisizione | No: da costruire come primo strumento commerciale |

**Priorità di sviluppo proposte, da validare con noi:**
1. Presenza online e recensioni con l'AI (equivalente di InRete AI)
2. Analisi gratuita della presenza online come porta d'ingresso commerciale
3. Accessibilità dei siti
4. Pacchetti verticali per la sanità
5. Prenotazioni online e centralino AI
6. E-commerce e social commerce

I servizi che sono nostri e che Italiaonline non ha (branding, direzione creativa, drone, merch, video AI) restano il nostro elemento distintivo e vanno valorizzati.

---

#### COSA TI CHIEDO DI COSTRUIRE

> **Importante: è uno strumento interno, non un prodotto da vendere.** Lo useremo solo noi (due soci e qualche collaboratore) e i nostri clienti, che accederanno alla loro dashboard. Al massimo qualche decina di clienti nei prossimi anni. Quindi:
> - scegli sempre la soluzione **più semplice, economica e facile da mantenere** che funzioni bene;
> - niente architetture da SaaS commerciale: niente piani a pagamento, onboarding self-service, marketing del prodotto o scalabilità per migliaia di utenti;
> - preferisci strumenti e servizi esistenti al codice scritto da zero, quando fanno il lavoro;
> - il sistema deve poterlo far funzionare una persona non tecnica, con documentazione chiara;
> - i costi mensili devono restare proporzionati a un'agenzia piccola: dimmi sempre quanto costa ogni scelta.

Un **sistema operativo ad agenti** per BigAnt, costruito in modo incrementale, che:
1. **Formalizza il metodo dell'agenzia**: un playbook vivo con le SOP di ogni servizio.
2. **Esegue il metodo con agenti specializzati**, coordinati da un orchestratore, su una memoria condivisa per cliente (le cartelle cliente in Markdown).
3. **Parte da un pilota interno**: BigAnt è il cliente zero. Il primo cliente gestito dal sistema è la nostra stessa comunicazione e il nostro marketing.
4. **Scala per servizio e per cliente**: si aggiunge un servizio solo quando la sua SOP è scritta e testata, e un cliente solo quando il pilota funziona.
5. **Ha una dashboard lato cliente.** Ogni titolare d'azienda vede in un unico posto tutti i dati, le analisi e il lavoro sulla sua attività. Nel pilota il "cliente" che la usa sono io, titolare di BigAnt. Dettagli nella sezione dedicata qui sotto.

##### L'agenzia autonoma: un organigramma da grande agenzia, fatto di agenti
Oggi siamo piccoli. L'obiettivo è funzionare come una grande agenzia, con reparti che lavorano da soli e due soci che decidono. Lo sciame non serve solo a gestire i clienti: deve **far crescere BigAnt** fino a coprire tutto il catalogo, esclusi i servizi non replicabili o non pertinenti (directory, network e marketplace proprietari, noleggio Apple).

Progetta il sistema come un organigramma, con un reparto per ogni funzione di una grande agenzia:
- **Direzione e crescita (agente "Direttore Crescita")**
  - È il cervello strategico dell'agenzia: pensa a BigAnt come un direttore generale.
  - Ogni settimana analizza clienti, servizi, risultati, mercato e concorrenti (Italiaonline e agenzie locali), e propone al massimo 3 priorità concrete ai soci.
  - Mantiene la roadmap verso il catalogo completo: quale servizio attivare dopo, cosa serve per farlo (competenze, strumenti, partner white-label, costi), quando conviene.
  - Progetta pacchetti e listini (per esempio piani a livelli come S, M, L, XL, e pacchetti verticali per settore), le opportunità di upsell sui clienti attuali e le partnership.
  - Misura la crescita con KPI di agenzia: numero di clienti, servizi per cliente, ricavo medio per cliente, clienti persi, ore risparmiate dagli agenti, crescita dei canali BigAnt.
  - Per i numeri economici usa i **KPI aggregati** che gli prepara il reparto Amministrazione (fatturato, margini, incassi, costi). Non legge i dati grezzi.
- **Marketing BigAnt:** fa crescere tutti i nostri profili (Instagram, Facebook, LinkedIn dell'agenzia e dei soci, TikTok, Google Business Profile, sito, recensioni). BigAnt deve diventare il miglior caso studio di sé stessa.
- **Commerciale:**
  - trova e qualifica nuovi clienti locali;
  - produce l'**analisi gratuita della presenza online** come porta d'ingresso;
  - prepara preventivi e proposte, segue i contatti fino alla chiusura.
- **Account e customer success:** onboarding dei nuovi clienti, salute di ogni cliente, rinnovi, segnali di rischio, raccolta delle autorizzazioni portfolio.
- **Produzione:** un reparto per ogni servizio del catalogo (social, video, ADV, SEO, local e reputazione, siti, e-commerce, prenotazioni e centralino AI...). Ognuno ha la sua SOP e i suoi specialisti.
- **Qualità e compliance:** controlla tutto quello che esce (brand, dati, GDPR, pubblicità sanitaria).
- **Amministrazione e gestione interna:** è un reparto completo, non di supporto, e lavora su un gestionale interno. Dettagli nella sezione dedicata qui sotto.

**Sii onesto sui limiti.** Italiaonline ha centinaia di consulenti. Indicami per ogni servizio se ha senso farlo con:
- agenti e strumenti nostri;
- partner o white-label;
- una persona da inserire nel team.

Dimmi anche in che momento ciascuna di queste scelte diventa necessaria. "Autonomo" significa che il lavoro si fa da solo. Le decisioni che contano (pubblicare, spendere, firmare, scrivere ai clienti, assumere) restano ai soci.

##### Gestionale interno dell'agenzia (direzione, amministrazione, operatività)
Il sistema deve gestire anche **la nostra azienda**, non solo i clienti. Voglio un **vero gestionale interno**, integrato con gli agenti e con le dashboard. Oggi l'amministrazione è fatta a mano su fogli Google, file Markdown e a memoria, e i soldi si perdono proprio lì: arretrati non sollecitati, scadenze dimenticate, abbonamenti inutili.

**Cosa esiste già (punto di partenza, da migrare e non da buttare).** Sul Mac dei soci c'è una cartella riservata, `GESTIONE INTERNA BIGANT`, fatta di file Markdown. La struttura è buona, ma è quasi tutta da compilare:
- **Cruscotto direzione:**
  - il cruscotto settimanale risponde a 6 domande: quanta cassa abbiamo, quanto dobbiamo incassare, quali clienti o consegne sono a rischio, quali contratti scadono, chi è sovraccarico, quali decisioni dobbiamo prendere;
  - ci sono anche le decisioni aperte, le priorità a 90 giorni e i KPI di agenzia.
- **Legale e fiscale:** anagrafica delle due ditte, commercialista, scadenze fiscali ricorrenti (oggi solo stimate) e documenti da raccogliere.
- **Team e collaboratori,** con una **matrice degli accessi** (chi vede cosa).
- **Vista aggregata clienti:** canone, cadenza, metodo di pagamento, arretrati, storico dei clienti persi, portfolio.
- **Finanza:** template del report mensile di gestione, rendiconto storico (da fare) e lista dei solleciti.
- **Strumenti e abbonamenti,** con i costi mensili e le date di rinnovo.
- **Marketing e portfolio:** cruscotto contenuti, registro delle autorizzazioni portfolio, SOP video.
- Nella cartella clienti c'è poi una sezione `00_CONTROLLO-CLIENTI`: stato dell'onboarding, scadenze dei contratti, consegne ricorrenti, clienti a rischio, campi da compilare.

**Problemi già noti:**
- oggi ogni modifica va fatta a mano due volte, su Mac e su Drive: va eliminata;
- alcuni clienti non hanno un contratto scritto e alcuni contratti risultano scaduti;
- i dati sono sparsi tra fogli, file e chat.

**Come lavorare su questa cartella:** ti farò vedere la struttura e i modelli. I contenuti con dati economici reali li carichiamo solo nel gestionale definitivo, mai nel repository e mai nei log. Proponimi tu il piano di migrazione.

**Moduli del gestionale** (costruiti per gradi, partendo da quelli che ci fanno perdere soldi):
1. **Anagrafiche:** clienti, fornitori, collaboratori e le due ditte, ciascuna con i suoi documenti.
2. **Commerciale → contratti:** lead, preventivi, preventivi accettati, contratti con date di inizio e fine e rinnovo automatico segnalato.
3. **Fatturazione e incassi:** dettagli qui sotto.
4. **Scadenziario unico:** fiscale, contratti, hosting e domini, abbonamenti, pagamenti ai collaboratori.
5. **Cassa e prima nota:** dettagli qui sotto.
6. **Costi e abbonamenti.**
7. **Lavoro e marginalità:** ore e attività per cliente (anche quelle degli agenti, con il loro costo), così sappiamo quanto guadagniamo davvero su ogni cliente e su ogni servizio.
8. **Task e consegne:** collegati o in sostituzione di Trello. Proponimi tu.
9. **Documenti:** contratti, privacy e GDPR, autorizzazioni portfolio, accordi con i collaboratori.
10. **Cruscotto di direzione:** le 6 domande del cruscotto settimanale con le risposte calcolate in automatico, più decisioni aperte, priorità e KPI.

Il gestionale è la **fonte unica** per agenti, dashboard interna e dashboard cliente. I fogli Prima Nota e Tracker restano in uso finché non migriamo: prima si collegano in sola lettura, poi si decide insieme quando spegnerli.

###### Contabilità interna: prima nota, compensi e controllo errori
È il cuore del gestionale e deve essere **preciso al centesimo**.

**Prima nota completa:**
- Ogni movimento di cassa e di banca va registrato con:
  - data;
  - importo;
  - entrata o uscita;
  - ditta (Costantino Agency o La Manna Agency);
  - conto (cassa comune, conto di Alfonso, conto di Raffaele…);
  - categoria;
  - cliente o fornitore collegato;
  - fattura o ricevuta collegata;
  - metodo (bonifico, contanti, carta).
- Saldi per conto e per ditta, sempre aggiornati.
- Chiusura mensile con **quadratura**: il saldo calcolato deve coincidere con quello reale dei conti e della cassa, e ogni differenza va spiegata.
- Gli incassi in contanti (alcuni clienti pagano così) sono tracciati come tutti gli altri.

**Compensi e prelievi:**
- **Collaboratori** (oggi Enzo e Vincenzo, domani altri):
  - compenso concordato, scadenza, pagato o da pagare;
  - documento ricevuto (fattura, ricevuta, prestazione occasionale);
  - ore e attività per cliente.
  - Avviso se un pagamento è in ritardo o se manca il documento.
- **Soci:**
  - prelievi di Raffaele e Alfonso, confrontati con quanto concordato e con l'utile reale, perché nessuno dei due prelevi più di quanto l'azienda produce;
  - contributi previdenziali e tasse da accantonare per ciascuno.
  - Avviso se gli accantonamenti non bastano per le prossime scadenze.
- Le regole fiscali che riguardano compensi e ritenute (diverse per collaboratori occasionali, a partita IVA o dipendenti, e influenzate dal fatto che siamo forfettari) **vanno confermate con il commercialista**. Il sistema le applica solo dopo la conferma.

**Controllo automatico: "cosa non torna".** Ogni giorno, e in modo completo a fine mese, il sistema controlla la coerenza dei conti e segnala le anomalie in una lista da risolvere, con priorità e importo:
- **Corrispondenze mancanti:**
  - incasso senza fattura, fattura senza incasso;
  - lavoro segnato "pagato" nel Tracker senza movimento in prima nota, e viceversa;
  - canone mensile non incassato entro la scadenza;
  - incasso diverso dall'importo dovuto.
- **Errori di registrazione:**
  - movimenti doppi o registrati due volte su conti diversi;
  - movimenti senza categoria, senza ditta o senza documento;
  - incasso attribuito alla ditta sbagliata.
- **Costi:**
  - spese insolite per importo o frequenza;
  - abbonamenti aumentati o doppioni;
  - costi che non compaiono più (rinnovo mancato o carta scaduta).
- **Soci e collaboratori:**
  - prelievi oltre il disponibile;
  - compensi pagati ma non registrati.
- **Fisco e cassa:**
  - avvicinamento alla soglia del forfettario di una delle due ditte;
  - saldo di cassa che non quadra con il conteggio reale.

Ogni anomalia ha uno stato (aperta, in verifica, risolta), un responsabile e una nota su come è stata risolta. Le anomalie non si correggono da sole: il sistema propone la correzione e un socio la conferma.

###### Il reparto Amministrazione (gli agenti che lavorano sul gestionale)

**Situazione da conoscere:**
- **Due ditte individuali in regime forfettario**, Costantino Agency (Alfonso) e La Manna Agency (Raffaele), sotto un solo marchio. Ogni incasso va attribuito alla ditta giusta.
- Vanno monitorati per ciascuna ditta i limiti e le regole del forfettario: soglia dei ricavi, nessuna IVA in fattura, imposta di bollo sopra la soglia prevista. I valori esatti vanno verificati con il commercialista, non dati per scontati.
- **Fonti attuali:**
  - foglio Google **Prima Nota**: cassa, conti dei soci, costi di gestione mensili, prelievi;
  - foglio Google **Tracker**: canoni mensili dei clienti, lavorazioni una tantum, scadenze annuali di hosting e domini;
  - una cartella riservata con il rendiconto mensile, i solleciti e un template di report mensile.
- **Costi ricorrenti:** affitto, utenze, abbonamenti a strumenti (Canva, Adobe, CapCut, Freepik, ChatGPT, Claude, Gemini, Midjourney…) e compensi dei collaboratori Enzo e Vincenzo.

**Cosa deve fare il reparto Amministrazione:**
- **Incassi e fatturazione:**
  - genera ogni mese la lista delle fatture da emettere (canoni e lavori chiusi), per cliente e per ditta;
  - prepara le bozze di fattura nel nostro software di fatturazione elettronica [DA DEFINIRE quale usiamo];
  - controlla gli incassi rispetto al dovuto.
- **Arretrati e solleciti:** tiene la lista degli arretrati sempre aggiornata, con età del credito e storico. Prepara i solleciti a scaglioni (gentile → fermo → ultimo avviso) e segnala i clienti da sospendere.
- **Prima nota e cassa:** registrazione dei movimenti, riconciliazione con l'estratto conto (se un giorno colleghiamo la banca, solo in lettura), cash flow previsto a 30, 60 e 90 giorni.
- **Costi e abbonamenti:** l'elenco di tutto quello che paghiamo, con scadenze e rinnovi. Segnala abbonamenti doppi, inutili o in aumento, e calcola il costo degli strumenti AI per cliente.
- **Scadenze:**
  - fiscali e contributive delle due ditte;
  - contratti clienti in scadenza;
  - rinnovi di hosting e domini, nostri e dei clienti.
  Avvisa con anticipo.
- **Contratti e documenti:** contratti dei clienti, preventivi accettati, accordi con i collaboratori, autorizzazioni portfolio, documenti legali (privacy, cookie, nomine GDPR quando trattiamo dati dei clienti). Segnala cosa manca.
- **Commercialista:** ogni mese o trimestre prepara il pacchetto di documenti e numeri da mandargli.
- **Collaboratori:** compensi, scadenze di pagamento, ore e attività svolte per cliente.
- **Report mensile di gestione per i soci:**
  - fatturato e incassi per ditta e per cliente;
  - arretrati;
  - costi e margine per cliente e per servizio;
  - carico di lavoro per persona;
  - criticità.

**Paletti (non negoziabili):**
- Gli agenti **non pagano, non trasferiscono denaro, non inviano fatture allo SDI e non mandano solleciti** senza l'ok esplicito di un socio. Preparano tutto, e i soci approvano dalla coda approvazioni.
- Nessuna consulenza fiscale presentata come certa: i dubbi fiscali diventano domande per il commercialista.
- **Accesso riservato:**
  - solo Raffaele e Alfonso vedono l'area amministrativa della dashboard;
  - collaboratori e clienti non la vedono mai;
  - gli altri reparti ricevono solo i KPI aggregati che servono a loro.
- I fogli Google esistenti restano la fonte finché non decidiamo di migrare: prima si collegano in sola lettura, poi si valuta.

**Nella dashboard interna** serve una sezione **Amministrazione**, visibile solo ai soci, con:
- incassi del mese;
- arretrati per cliente;
- fatture da emettere;
- scadenze dei prossimi 30 giorni;
- cash flow previsto;
- costi ricorrenti;
- margine per cliente;
- avanzamento verso la soglia del forfettario per ciascuna ditta.
- **cosa non torna**: anomalie contabili aperte, con importo e priorità;
- compensi dei collaboratori e prelievi dei soci rispetto all'utile;
- esito dell'ultima quadratura mensile.

##### Automazione e controllo da un'unica dashboard (requisito non negoziabile)
Il sistema deve **girare da solo** ed essere **verificabile da un solo posto**. Non voglio aprire chat, cartelle o terminali per sapere cosa è successo.

**Automazione: ogni reparto ha i suoi inneschi.**
- **A calendario:** per esempio piano settimanale il lunedì, report il primo del mese, controllo recensioni ogni giorno, analisi del Direttore Crescita il venerdì.
- **Su evento:** nuovo lead, nuova recensione, contenuto approvato, nuovo cliente firmato.

Per ogni reparto indicami: cosa lo avvia, dove gira, quanto costa, e cosa succede se fallisce.
- Gli agenti devono girare su un server o un servizio cloud, non sul mio Mac acceso.
- Proponimi l'infrastruttura (scheduler, code di lavoro, database) con i costi mensili.

**Un'unica dashboard di controllo per l'agenzia (vista interna)**, oltre alla dashboard per i clienti. Deve mostrare:
- **Registro attività:** ogni azione di ogni agente (quando, quale agente, quale cliente, cosa ha fatto, quale file o contenuto ha prodotto, quanto è costato), con filtri.
- **Coda delle approvazioni:** tutto ciò che aspetta l'ok di un socio, con approva / modifica / rifiuta in un clic e il motivo registrato. Il motivo del rifiuto torna all'agente come regola.
- **Stato degli automatismi:** cosa è andato a buon fine, cosa ha fallito, cosa è in ritardo, con notifica ai soci (email o WhatsApp) quando qualcosa si blocca.
- **Stato di ogni cliente e di ogni reparto:** lavori in corso, scadenze, KPI, clienti a rischio.
- **Le priorità della settimana** proposte dal Direttore Crescita, e i KPI di crescita dell'agenzia.
- **Costi:** spesa per API e strumenti, per cliente e totale, con un tetto mensile oltre il quale gli agenti si fermano e avvisano.

**Verificabilità:**
- ogni output deve poter essere ricondotto alle fonti e ai dati da cui nasce;
- ogni reparto ha test e una checklist di accettazione, che vanno eseguiti prima del rilascio;
- per ogni fase, mostrami una demo con dati reali di BigAnt.

**Unica fonte di verità:**
- agenti, dashboard interna e dashboard cliente leggono e scrivono **gli stessi dati** (un database centrale, sincronizzato con le cartelle clienti, oppure al loro posto: proponimi tu la soluzione);
- nessun dato copiato a mano in due posti.

##### Dashboard cliente (requisito centrale, non un extra)
È la vetrina del sistema e il motivo per cui un cliente resta con noi. Il cliente deve poter capire in 30 secondi come sta andando la sua attività online e cosa stiamo facendo per lui.

**Punto di partenza:** abbiamo già un'area clienti nostra (ped.bigantagency.it), dove il cliente vede i post creati e programmati con i copy. Prima di progettare, analizzala: tecnologia, cosa fa, cosa si può riusare. Proponimi se estenderla o ricostruirla, con i pro e i contro. Non buttare via ciò che funziona.

**Cosa deve mostrare** (un modulo per servizio, attivo solo per i servizi che il cliente ha acquistato):
- **Panoramica:** KPI principali del mese rispetto al mese precedente e agli obiettivi, una sintesi in linguaggio semplice scritta dall'agente reporter, e i prossimi passi.
- **Contatti e lead:** chiamate, WhatsApp, form, prenotazioni, con la fonte di ciascuno. È il dato che interessa di più a un titolare.
- **Social:** follower, copertura, interazioni, contenuti migliori, calendario dei prossimi post.
- **Pubblicità:** spesa, risultati, costo per contatto su Google Ads e Meta Ads (e sugli altri canali quando attivi).
- **Google e presenza locale:** visualizzazioni, chiamate e indicazioni stradali dalla scheda Google, posizioni sulle ricerche locali, coerenza della presenza sulle directory.
- **Reputazione:** recensioni nuove, media voti, risposte date, recensioni in attesa di risposta.
- **Sito:** visite, fonti, pagine principali e conversioni (GA4 e Search Console), salute tecnica e SEO.
- **Contenuti da approvare:** il cliente approva o chiede modifiche direttamente dalla dashboard. È il cancello umano del sistema, con traccia di chi ha approvato e quando.
- **Report e documenti:** report mensili scaricabili, strategia, materiali consegnati.
- **Chiedi all'agenzia:** il cliente fa domande sui suoi dati e un agente risponde basandosi solo sui dati reali. Le richieste di lavoro diventano un task per noi.

**Lato agenzia** serve anche una vista interna con tutti i clienti insieme: stato dei lavori, cosa è in ritardo, cosa aspetta approvazione, clienti a rischio, opportunità di upsell (servizi del catalogo che il cliente non ha ancora).

**Requisiti:**
- multi-cliente: ogni cliente vede solo i suoi dati;
- login sicuro;
- facile da usare dal telefono;
- in italiano;
- con il nostro brand, personalizzabile col logo del cliente.

**Dati:** devono arrivare dalle fonti reali tramite API e connettori ufficiali, con autorizzazioni OAuth date dal cliente, preferibilmente in sola lettura. Le fonti sono:
- Google Ads, Meta, GA4, Search Console, Google Business Profile;
- lo strumento di programmazione social;
- il CRM o i contatti.

Mai dati inventati o simulati presentati come veri. Se una fonte non è collegata, la dashboard lo dice.

**Privacy:**
- GDPR, con data processing agreement verso i clienti;
- dati ospitati preferibilmente nell'UE;
- nessuna credenziale in chiaro;
- registro degli accessi.

##### Principi di architettura (non negoziabili)
- **Il metodo viene prima degli agenti.** Ogni agente implementa una SOP scritta. Se la SOP non esiste, prima si scrive la SOP.
- **Un orchestratore e specialisti stretti.** Il coordinatore legge la scheda master, pianifica, delega, raccoglie e aggiorna stato e log. Gli specialisti fanno una cosa sola e bene (stratega, social, video, local/GBP, ADS, SEO/sito, reputazione, reporting, controllo qualità brand e compliance).
- **La memoria sta nei file, non nella chat.** Ogni giro legge e aggiorna la cartella del cliente: scheda master, DNA, strategia, calendario, cruscotto, log decisioni, log feedback. Ogni correzione dei soci diventa una regola scritta.
- **Un cancello umano prima di tutto ciò che esce.** Gli agenti hanno autonomia completa su analisi, strategia, piani, bozze, storyboard e report. Si fermano sempre prima di:
  - pubblicare;
  - spendere budget;
  - modificare account pubblicitari o schede Google;
  - scrivere a un cliente.
  Per BigAnt basta l'ok di uno dei due soci, registrato con nome e data. Per i clienti, il flusso di approvazione va definito servizio per servizio.
- **Stati di lavorazione standard:** IDEA → IN PRODUZIONE → DA APPROVARE → APPROVATO → PROGRAMMATO → PUBBLICATO → RIUTILIZZABILE.
- **Nessun dato inventato.** Numeri, risultati, recensioni, prezzi e clienti citati devono avere una fonte nei file. Altrimenti vanno marcati `[DA VERIFICARE]`.
- **Sicurezza e privacy:**
  - nessun agente legge le credenziali (`04_ACCESSI/`);
  - i dati economici e amministrativi sono accessibili **solo** agli agenti del reparto Amministrazione, con permessi separati, e sono visibili in dashboard solo ai due soci;
  - permessi minimi per ogni agente;
  - nessuna installazione di pacchetti o esecuzione di script presi da fonti non verificate;
  - GDPR, Codice del Consumo e regole sulla pubblicità sanitaria (molti clienti sono medici);
  - lavori e loghi dei clienti si pubblicano solo se c'è un'autorizzazione registrata.
- **In italiano e per il mercato locale:** Google.it, ricerca locale, Campania.
- **Strumenti prima del codice.** Usa i meccanismi nativi del tuo ambiente (AGENTS.md, skill, server MCP, sotto-agenti, se disponibili nella tua versione: verificalo sulla documentazione aggiornata) e le integrazioni con Google Ads, Meta, Search Console, GBP, Drive, Trello e Postiz. Scrivi codice su misura solo dove serve davvero.
- **Misurabile:** ogni servizio ha KPI, ogni giro dello sciame lascia una riga nel log, ogni mese si confrontano le ore risparmiate con la qualità.

##### Fasi
**Fase 0 — Scoperta (nessun codice).** Leggi i materiali esistenti che ti indico. Intervista i soci con domande raggruppate, non una alla volta e non cinquanta insieme. Mappa come lavoriamo davvero oggi. Consegna una sintesi "come lavorate oggi / dove si perde tempo / cosa manca".

**Fase 1 — Metodo.** Scrivi il **Playbook BigAnt**:
- ciclo di vita del cliente (acquisizione → onboarding → produzione → report → rinnovo e upsell → chiusura);
- scheda standard di ogni servizio (cosa include, deliverable, frequenza, input dal cliente, KPI, tempo stimato, rischi);
- flusso di approvazione;
- ritmo settimanale e mensile;
- KPI di agenzia e template.
Parti dai servizi che vendiamo già. Gli altri del catalogo vanno marcati come "da attivare".

**Fase 2 — Architettura.** Proponi lo schema del sistema: orchestratore, automatismi e dove girano, dashboard di controllo interna, specialisti, file di memoria, skill, integrazioni, cancelli di approvazione, permessi. Includi la **dashboard cliente**: analisi dell'area clienti esistente, scelta tra estenderla o rifarla, tecnologia, hosting, come arrivano i dati, come agenti e dashboard condividono le stesse informazioni. Aggiungi anche una stima dei costi mensili di strumenti, API e hosting. Mostrami lo schema e aspetta il mio ok prima di costruire.

**Fase 3 — Pilota su BigAnt (cliente zero), a tappe.** Ogni tappa dura qualche settimana e si chiude con una demo e il mio ok. Se ti sembra più sensato un altro ordine, proponimelo con il motivo.
- **Tappa 3A — I soldi (gestionale base).**
  - Anagrafiche, contratti e scadenziario.
  - Prima nota collegata in sola lettura ai fogli Prima Nota e Tracker.
  - Lista "cosa non torna", arretrati con bozze di sollecito, costi ricorrenti con i doppioni segnalati.
  - Cruscotto direzione con le 6 domande e primo report mensile di gestione.
  - Si parte da qui perché è dove oggi perdiamo soldi, e i dati sono già tutti nostri.
- **Tappa 3B — Il marketing di BigAnt.**
  - Obiettivi:
    - nuovi clienti locali (contatti e preventivi da PMI di Caserta e della Campania);
    - portfolio e reputazione (case study, recensioni Google);
    - notorietà del brand.
  - Canali: Instagram, Facebook, LinkedIn (pagina e soci), TikTok, Google Business Profile, sito.
  - Da produrre:
    - DNA di BigAnt;
    - strategia a 90 giorni;
    - calendario editoriale;
    - un mese di contenuti approvabili;
    - ottimizzazione della scheda Google e del sito.
  - Lo strumento di ricerca clienti già esistente entra qui, insieme all'analisi gratuita della presenza online.
- **Tappa 3C — Le dashboard.**
  - Dashboard di controllo interna: registro attività, coda approvazioni, stato degli automatismi, costi.
  - Prima versione della dashboard cliente, usata da me come titolare di BigAnt e collegata ai dati reali: panoramica, contatti, social, Google e presenza locale, recensioni, contenuti da approvare, report.
- **Tappa 3D — Crescita e completamento del gestionale.**
  - Primo piano del Direttore Crescita: dove siamo rispetto al catalogo, i prossimi 2 servizi da attivare, proposta di pacchetti e listino, obiettivi per tutti i profili BigAnt.
  - Piano ADV di BigAnt.
  - Compensi e prelievi, quadratura mensile completa, primo report del mese.

**Fase 4 — Primi 2–3 clienti reali.** Scegliamo insieme quali. Ogni servizio entra solo con la sua SOP testata.

**Fase 5 — Scala sul catalogo completo,** un servizio alla volta, con una roadmap trimestrale fino a ottobre 2027.

---

#### COME VOGLIO CHE LAVORI
- **Prima capisci, poi proponi, poi costruisci.** Ogni fase si chiude con una consegna concreta, una demo o un esempio reale e una checklist di accettazione. Aspetta il mio ok prima di passare alla fase successiva.
- **Piccoli passi verificabili,** non un sistema enorme tutto insieme.
- **Tieni un `DECISIONI.md`** (data, decisione, motivo) e una `ROADMAP.md` aggiornata.
- **Parlami in italiano semplice.** Sono un imprenditore, non un programmatore: spiega cosa fai e perché, senza gergo tecnico se non serve.
- **Se una cosa che chiedo è una cattiva idea, dimmelo** e proponi un'alternativa.
- **Se ti manca un'informazione, chiedila.** Non riempire i buchi con ipotesi presentate come fatti.

---

# PARTE 2 — PLAYBOOK SERVIZI BIGANT (da salvare in docs/playbook/, un file per documento)


<!-- FILE: docs/playbook/00_INDICE-PLAYBOOK.md -->
### PLAYBOOK SERVIZI BIGANT — INDICE
**Ultimo aggiornamento:** 08/10/2026 (bozza da validare con Raffaele e Alfonso)
> Una scheda per ogni servizio: cosa include, come si lavora, chi fa cosa, KPI, rischi. È il "metodo" che gli agenti di BigAnt OS eseguono. Prezzi e tempi li decidono i soci. Riferimento di mercato: catalogo Italiaonline (ottobre 2026), esclusi i servizi proprietari non replicabili.

#### Documenti principali (leggere per primi)
- [00_CATALOGO-BIGANT.md](00_CATALOGO-BIGANT.md): confronto con Italiaonline, listino proposto, pacchetti combinati, cosa serve per attivare i servizi nuovi
- [00_ITALIAONLINE-PUNTI-DI-FORZA-DASHBOARD-SITO.md](00_ITALIAONLINE-PUNTI-DI-FORZA-DASHBOARD-SITO.md): 14 punti di forza di Italiaonline, i loro punti deboli, la specifica della dashboard cliente BigAnt e la struttura del nuovo sito
- [00_GUIDA-DIRETTORE-CRESCITA.md](00_GUIDA-DIRETTORE-CRESCITA.md): come attivare un servizio, roadmap Q4 2026–Q4 2027, KPI, regole

Ogni scheda S01–S19 contiene anche: benchmark Italiaonline (sez. 12), struttura dei pacchetti (sez. 13) e prezzi proposti da validare (sez. 14).

| Codice | Servizio | Stato | File |
|---|---|---|---|
| S01 | Social media management | ATTIVO | [S01_social-media.md](S01_social-media.md) |
| S02 | Produzione foto, video e drone | ATTIVO (punto di forza) | [S02_foto-video-drone.md](S02_foto-video-drone.md) |
| S03 | Google Ads (Search, Performance Max, YouTube) | ATTIVO — metodo già scritto | [S03_google-ads.md](S03_google-ads.md) |
| S04 | Meta Ads (Facebook, Instagram) e altri social a pagamento | ATTIVO (Meta) · DA ATTIVARE (LinkedIn, TikTok) | [S04_meta-ads.md](S04_meta-ads.md) |
| S05 | SEO (sito, contenuti, tecnica) | IN PARTE (agenti SEO installati) | [S05_seo.md](S05_seo.md) |
| S06 | Local SEO e Google Business Profile | ATTIVO (con Vincenzo) | [S06_local-seo-gbp.md](S06_local-seo-gbp.md) |
| S07 | Presenza online multi-directory | DA ATTIVARE — priorità 1 | [S07_presenza-online-directory.md](S07_presenza-online-directory.md) |
| S08 | Reputazione e recensioni | DA ATTIVARE — priorità 1 | [S08_reputazione-recensioni.md](S08_reputazione-recensioni.md) |
| S09 | Siti web e landing page | ATTIVO | [S09_siti-web.md](S09_siti-web.md) |
| S10 | Accessibilità digitale dei siti | DA ATTIVARE — priorità 3 | [S10_accessibilita.md](S10_accessibilita.md) |
| S11 | E-commerce e social commerce | DA ATTIVARE — priorità 6 | [S11_ecommerce.md](S11_ecommerce.md) |
| S12 | Prenotazioni online | DA ATTIVARE — priorità 5 | [S12_prenotazioni.md](S12_prenotazioni.md) |
| S13 | Centralino AI e chatbot | DA ATTIVARE — priorità 5 | [S13_centralino-chatbot-ai.md](S13_centralino-chatbot-ai.md) |
| S14 | Email marketing, CRM e gestione contatti | DA ATTIVARE | [S14_email-crm-lead.md](S14_email-crm-lead.md) |
| S15 | Branding e corporate design | ATTIVO (Alfonso) | [S15_branding.md](S15_branding.md) |
| S16 | Merch e abbigliamento personalizzato | ATTIVO | [S16_merch-abbigliamento.md](S16_merch-abbigliamento.md) |
| S17 | Analisi gratuita della presenza online (commerciale) | DA ATTIVARE — priorità 2 | [S17_analisi-gratuita.md](S17_analisi-gratuita.md) |
| S18 | Reporting e dashboard cliente (trasversale) | IN COSTRUZIONE (BigAnt OS) | [S18_reporting.md](S18_reporting.md) |
| S19 | Pubblicità offline tramite partner (DOOH, insegne, TV/cinema) | SU RICHIESTA | [S19_offline-partner.md](S19_offline-partner.md) |

#### Priorità di attivazione proposte
1. S07 Presenza online multi-directory + S08 Reputazione e recensioni
2. S17 Analisi gratuita della presenza online
3. S10 Accessibilità digitale
4. Pacchetti verticali per la sanità (combinazione di S01, S03, S06, S08, S12, S13)
5. S12 Prenotazioni online + S13 Centralino AI e chatbot
6. S11 E-commerce e social commerce

#### Regole valide per tutti i servizi
- Stati di un lavoro: IDEA → IN PRODUZIONE → DA APPROVARE → APPROVATO → PROGRAMMATO → PUBBLICATO → RIUTILIZZABILE
- Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.
- Nessun dato inventato: quello che manca è [DA VERIFICARE].
- Gli agenti non leggono mai 04_ACCESSI né i dati economici.
- Ogni correzione di un socio o di un cliente va nel log feedback del cliente e diventa una regola.

#### Template per un nuovo servizio
Copia una scheda esistente e rinominala con il codice successivo (S20, S21…).


<!-- FILE: docs/playbook/00_CATALOGO-BIGANT.md -->
### CATALOGO SERVIZI BIGANT — confronto con Italiaonline, pacchetti e prezzi proposti
**Versione:** 0.1 · **Data:** 08/10/2026 · **Stato:** BOZZA da validare con Raffaele e Alfonso
> Questo è il documento che il Direttore Crescita (agente) e i soci usano per decidere cosa vendere, come impacchettarlo e a che prezzo. Le schede dettagliate sono nei file S01–S19 di questa cartella.
> **I prezzi sono proposte di mercato, non decisioni.** Italiaonline non pubblica listini, e le fonti di mercato italiane sono scarse: le fasce vanno validate con i costi interni reali prima di usarle con un cliente.

---

#### 1. Obiettivo
Entro ottobre 2027 BigAnt offre l'intero catalogo di digital marketing per PMI di un operatore come Italiaonline, esclusi i servizi proprietari non replicabili, e in più i servizi distintivi di BigAnt (branding, direzione creativa, video, drone, merch).

#### 2. Mappa: catalogo Italiaonline → servizi BigAnt

| Italiaonline | Servizio BigAnt | Stato oggi | Come si eroga |
|---|---|---|---|
| InRete AI (presenza su più di 45 siti, recensioni AI, chatbot, CRM, email) | S06 + S07 + S08 + S13 + S14 | Solo S06 | Agenti + piattaforma di listing (partner) + strumenti AI |
| InGrande (multi-sede su PagineGialle e simili) | S06/S07 multi-sede | No | GBP multi-sede + listing. Le directory proprietarie non sono replicabili |
| MARiO (centralino AI) | S13 | No | Piattaforma voice AI (partner) + agenti |
| TuttoCittà InEvidenza | — | — | Non replicabile (proprietario) |
| Sito Web (Essenziale / Standard / Extra) | S09 | Sì | In casa |
| Accessibilità digitale | S10 | No | In casa + strumenti di audit |
| Servizi SEO | S05 | In parte | Agenti SEO + in casa |
| Ecommerce | S11 | No | Shopify/WooCommerce in casa |
| Social Commerce | S11 | No | In casa |
| PrenotaOra Servizi / Ristoranti | S12 | No | Software di prenotazione (partner) |
| Pubblicità Online | S03 + S04 | Sì (Google, Meta) | In casa (Raffaele) + agenti |
| Pubblicità su network Italiaonline | S19 (display/programmatic) | No | Non replicabile come network: alternativa programmatic |
| Social Media | S01 | Sì | In casa + agenti + piattaforma clienti |
| Foto e Video professionali | S02 | Sì (punto di forza) | In casa (Raffaele, Enzo) |
| PagineGialle Casa (marketplace) | — | — | Non replicabile (proprietario) |
| Pubblicità TV e Cinema | S19 | Su richiesta | Partner |
| Gadget personalizzati | S16 | Sì | Fornitori |
| Noleggio Apple | — | — | Non pertinente |
| Pacchetti per categoria professionale (es. psicologi) | Pacchetti verticali (sez. 4) | No | Combinazione di servizi |
| Analisi presenza online / analisi sito / consulenza gratuita | S17 | No | Agenti + BigAnt OS |
| (non offerto da Italiaonline) | S15 Branding, S18 Dashboard e report | Sì | In casa: **elemento distintivo** |

#### 3. Listino proposto per singolo servizio (DA VALIDARE)

| Codice | Servizio | Setup / una tantum | Canone mensile |
|---|---|---|---|
| S01 | Social media | 150–300 € | S 250–350 · M 450–650 · L 800–1.200 € |
| S02 | Foto, video, drone | ½ giornata 300–500 € · giornata 600–1.000 € | Su canone: dentro S01 L |
| S03 | Google Ads | 200–400 € | min 200–400 € o 15–20% della spesa |
| S04 | Meta Ads | 150–300 € | min 200–400 € o 15–20% della spesa |
| S05 | SEO | audit 300–800 € | S 300–600 · M 600–1.000 · L 1.000–1.800 € |
| S06 | Google Business Profile | 150–300 € | 80–200 € per sede |
| S07 | Presenza multi-directory | — | 40–90 € per sede (solo in bundle) |
| S08 | Recensioni | — | Base 60–100 · Pro 120–200 € |
| S09 | Siti web | Landing 500–1.000 · Essenziale 1.200–2.500 · Standard 2.500–4.500 · Extra da 4.500 € | Manutenzione 30–80 € |
| S10 | Accessibilità | audit 300–600 · adeguamento 500–2.000 € | 150–400 €/anno |
| S11 | E-commerce | Start 2.500–4.000 · Pro 4.000–8.000 € | Gestione 300–800 € |
| S12 | Prenotazioni | 150–300 € | 40–90 € |
| S13 | Chatbot / centralino AI | 300–800 € | Chatbot 60–150 · Centralino 120–250 € |
| S14 | CRM, email, fidelity | 300–600 € | 80–300 € |
| S15 | Branding | Logo 500–1.200 · identità 1.500–3.500 € | — |
| S16 | Merch | ricarico 25–40% | — |
| S17 | Analisi gratuita | 0 € | — |
| S18 | Dashboard e report | incluso | incluso |
| S19 | Offline e display | commissione 10–15% | — |

#### 4. Pacchetti combinati (la vera leva di crescita)
Italiaonline vende soprattutto **pacchetti** (InRete AI, InGrande) e **verticali per categoria**. Proposta BigAnt:

| Pacchetto | Composizione | Per chi | Canone proposto (DA VALIDARE) |
|---|---|---|---|
| **BigAnt Presenza** (equivalente di InRete AI) | S06 + S07 + S08 base + S17 trimestrale + dashboard | Qualunque attività locale. È il **pacchetto d'ingresso** | 150–250 €/mese + setup 200–300 € |
| **BigAnt Crescita Locale** | Presenza + S01 M + S03 Start | PMI che vogliono contatti ogni mese | 900–1.400 €/mese + budget ADV |
| **BigAnt Sanità** | Sito Standard + S05 S + Presenza + S12 Servizi + S13 chatbot + compliance sanitaria | Centri medici, laboratori, fisioterapia, studi professionali (avete già 5–6 clienti nel settore) | 600–1.000 €/mese + setup 2.500–4.000 € |
| **BigAnt Ristorazione** | S01 S/M + Presenza + S12 Ristoranti (menù QR, Prenota con Google) + S02 mezza giornata a trimestre | Ristoranti, bar, hotel | 450–800 €/mese |
| **BigAnt Brand** | S15 identità + S09 Essenziale + S01 S per 3 mesi + S16 kit merch | Nuove attività, rebranding | Progetto 3.500–6.000 € |

**Regole dei pacchetti:**
- Un pacchetto costa il 10–20% in meno della somma dei singoli servizi.
- Si vende "Presenza" a tutti i clienti attuali: è il primo upsell.
- Durata minima e condizioni [DA DEFINIRE nel contratto standard].

#### 5. Quanto vale il catalogo sui clienti attuali (esercizio per il Direttore Crescita)
Oggi ci sono 12–14 clienti con canoni da 200 a 600 €/mese, alcuni annuali. Se ogni cliente attuale aggiungesse solo "BigAnt Presenza", servirebbero una piattaforma di listing e un processo recensioni, ma l'aumento ricorrente sarebbe immediato e misurabile. **Il calcolo esatto lo fa il reparto Amministrazione** con i dati veri del gestionale, non questo documento.

#### 6. Cosa serve per attivare i servizi nuovi

| Servizio | Strumento o partner da scegliere | Competenza | Prima azione |
|---|---|---|---|
| S07 Presenza | Piattaforma di listing con programma agenzie (Partoo, Uberall, Synup o altri: chiedere i prezzi in euro) | Vincenzo + agenti | Chiedere 3 preventivi white-label |
| S08 Recensioni | GBP API (richiesta in corso) + eventuale piattaforma | Agenti + approvazione | Inviare la richiesta GBP API |
| S10 Accessibilità | Strumento di audit WCAG | Alfonso / sviluppo | Testarlo sul sito BigAnt |
| S12 Prenotazioni | Software per settore (medicale, ristorazione) | Setup in casa | Scegliere 1 strumento per settore |
| S13 Chatbot/centralino | Piattaforma voice e chat AI con italiano e server UE | Agenti + setup | Prova su BigAnt stessa |
| S14 CRM/email | Modulo BigAnt OS + piattaforma email | BigAnt OS | Collegare BigAnt Fidelity |
| S17 Analisi gratuita | BigAnt OS + strumento di ricerca clienti | Agenti | Primo modello di report |

#### 7. Fonti dei benchmark
- Catalogo e schede servizi Italiaonline: https://www.italiaonline.it/ (pagine /servizi/…, consultate l'08/10/2026)
- Prezzi social: https://www.kontentino.com/it/blog/pacchetti-social-media-piccole-imprese-prezzi/ · https://socialk.it/it/blog/how-much-does-social-media-management-cost
- Prezzi Google Ads: https://www.cyberclick.es/numerical-blog/cuanto-cuesta-contratar-una-agencia-google-ads-en-espana · https://outerboxdesign.com/articles/paid-media/google-ads-management-agency/ppc-management-pricing-fees
- Prezzi siti: https://tuttocalcolato.it/tech/costo-sito-web/ · https://www.punto-informatico.it/quanto-costa-un-sito-web/
- Prezzi SEO: https://landingi.com/it/seo/prezzi-di-seo/ · https://techsy.io/it/blog/agenzia-seo-tradizionale-vs-ia · https://thestacc.com/it/migliori/servizi-seo-per-piccole-imprese/
- Listing management: https://en.uberall.com/en-us/compare/uberall-partoo-comparison · https://www.g2.com/compare/partoo
- Voice AI: https://www.cloudtalk.io/it/blog/quanto-costa-la-voice-ai/ · https://techsy.io/it/blog/ai-voice-agent-pricing


<!-- FILE: docs/playbook/00_GUIDA-DIRETTORE-CRESCITA.md -->
### GUIDA OPERATIVA PER IL DIRETTORE CRESCITA (agente) — come portare BigAnt al catalogo completo
**Versione:** 0.1 · **Data:** 08/10/2026 · **Destinatari:** l'agente "Direttore Crescita" di BigAnt OS e i soci
> Questa guida dice al Direttore Crescita **come** far crescere BigAnt servizio per servizio. Si usa insieme a `00_CATALOGO-BIGANT.md` e alle schede S01–S19. Il Direttore Crescita propone, i soci decidono.

---

#### 1. Il tuo compito
Portare BigAnt da 6 servizi attivi a tutto il catalogo replicabile entro ottobre 2027, **aumentando il ricavo per cliente prima del numero di clienti**, senza peggiorare la qualità e senza far lavorare i soci oltre il sostenibile.

#### 2. Il tuo ritmo
- **Ogni lunedì:** leggi i KPI della settimana (dashboard interna) e proponi ai soci al massimo **3 priorità**, ciascuna con il motivo, il costo, il tempo richiesto e il risultato atteso.
- **Ogni fine mese:** aggiorna la roadmap. Per ogni servizio: stato, passo successivo, cosa blocca.
- **Ogni trimestre:** fai la revisione del catalogo e dei prezzi con i dati reali di costo, tempo e margine che ti passa l'Amministrazione, in forma aggregata.

#### 3. Come si attiva un servizio nuovo (procedura standard, sempre uguale)
1. **Scheda:** la scheda S__ è completa, con prezzi e tempi validati dai soci.
2. **Strumento o partner:** scelto tra almeno 3 opzioni, con costo mensile, italiano, GDPR e server UE verificati.
3. **Prova su BigAnt:** il servizio si usa prima su BigAnt stessa (cliente zero) per almeno 30 giorni.
4. **Pilota:** 1–2 clienti attuali con uno sconto pilota in cambio di un feedback e, se d'accordo, di un caso studio.
5. **Misura:** tempo reale speso, costo, margine, soddisfazione del cliente, problemi incontrati.
6. **Decisione dei soci:** lanciare, correggere o abbandonare.
7. **Lancio:** materiali di vendita (pagina sul sito, post, analisi gratuita aggiornata), proposta ai clienti attuali, poi ai nuovi.
8. **Registro:** il modulo si attiva nel registro dei moduli di BigAnt OS e nel gestionale; la scheda passa allo stato ATTIVO.

#### 4. Roadmap proposta (DA VALIDARE)

| Trimestre | Servizi da attivare | Perché in quest'ordine |
|---|---|---|
| **Q4 2026** (ott–dic) | Pacchetto **Presenza** (S06 + S07 + S08) · **S17 Analisi gratuita** · prova di S13 chatbot su BigAnt | È il prodotto d'ingresso e il primo upsell sui clienti attuali; l'analisi gratuita alimenta il commerciale |
| **Q1 2027** (gen–mar) | **Pacchetto Sanità** (con S12 Servizi e S13) · **S10 Accessibilità** | Avete già 5–6 clienti sanitari; l'accessibilità è un obbligo per alcuni |
| **Q2 2027** (apr–giu) | **Pacchetto Ristorazione** (S12 Ristoranti) · **S14 CRM, email e Fidelity** | Avete già un cliente ristorazione premium; Fidelity è già in costruzione |
| **Q3 2027** (lug–set) | **S11 E-commerce e social commerce** · S05 SEO L con visibilità sugli assistenti AI | Servizi più complessi: si fanno con il sistema già rodato |
| **Q4 2027** | S19 display e programmatic · revisione completa catalogo e prezzi | Completamento e consolidamento |

#### 5. KPI che devi seguire
- **Ricavo medio per cliente** (dato dell'Amministrazione)
- **Servizi per cliente** (media, e distribuzione)
- **Clienti attivi**, nuovi, persi, e il motivo della perdita
- **Margine per servizio**, sul tempo reale e sui costi degli strumenti
- **Funnel commerciale:** lead → analisi gratuite → appuntamenti → proposte → clienti
- **Crescita dei canali BigAnt:** follower, recensioni Google, contatti dal sito
- **Ore risparmiate dagli agenti** rispetto al lavoro manuale
- **Carico dei soci:** se cresce oltre la soglia [DA DEFINIRE], la priorità diventa delegare (partner o nuova persona), non vendere di più

#### 6. Quando proporre partner o persone (regole)
- **Partner o white-label:** quando lo strumento esiste già sul mercato e costruirlo costerebbe più di 12 mesi di abbonamento (listing, voice AI, prenotazioni).
- **Una persona in più:** quando un servizio ha più di [DA DEFINIRE] clienti e assorbe più del 30% del tempo di un socio, oppure quando la qualità scende (ritardi, revisioni in aumento).
- **Agenti:** per tutto ciò che è ripetitivo, basato su regole e verificabile (bozze, report, controlli, risposte alle recensioni con approvazione).

#### 7. Cosa NON fai mai
- Non cambi prezzi, non mandi proposte ai clienti e non firmi accordi con i partner: **proponi**, i soci decidono.
- Non usi dati economici grezzi: lavori sui KPI aggregati dell'Amministrazione.
- Non copi i testi di Italiaonline: li usi come benchmark di struttura, non come contenuto.
- Non prometti risultati garantiti (posizioni su Google, numero di clienti).
- Non proponi servizi che non sono replicabili (directory e network proprietari) né quelli fuori tema (noleggio hardware).

#### 8. Primo compito
1. Leggi `00_CATALOGO-BIGANT.md` e le 19 schede.
2. Prepara per i soci: (a) la lista dei punti [DA DEFINIRE] e [DA VALIDARE], in ordine di importanza; (b) la proposta definitiva del pacchetto Presenza; (c) un piano di 30 giorni per offrirlo ai clienti attuali, con i messaggi già scritti, da approvare.


<!-- FILE: docs/playbook/00_ITALIAONLINE-PUNTI-DI-FORZA-DASHBOARD-SITO.md -->
### ITALIAONLINE: PUNTI DI FORZA DA IMPORTARE IN BIGANT — dashboard cliente e sito
**Data:** 08/10/2026 · **Stato:** proposta da validare con i soci · **Per:** soci, Codex (BigAnt OS), agente Direttore Crescita
> Ricerca sulle pagine pubbliche di italiaonline.it, sul centro assistenza, sull'app Area Clienti e sulle pagine contatti. L'obiettivo non è copiare: è capire perché funziona e farlo **meglio e su misura** per BigAnt.

---

#### PARTE 1 — I PUNTI DI FORZA DI ITALIAONLINE

| # | Punto di forza | Come lo fanno | Cosa significa per BigAnt |
|---|---|---|---|
| 1 | **Area Clienti unica** | Un solo accesso per statistiche per famiglia di servizio (Presenza, Sito, Pubblicità, E-commerce, Gestione attività) e per singolo servizio, servizi attivi, contratti attivi e scaduti (archivio di 5 anni), ordini e fatture in PDF, dati amministrativi, campagne email e SMS | È il modello per la **dashboard cliente BigAnt** (Parte 3) |
| 2 | **App mobile** dell'Area Clienti (iOS e Android, più di 10.000 installazioni su Android) | Novità e contenuti, risultati, fatture, contratti, assistenza | Per noi basta una dashboard **perfetta da telefono** (web app installabile), senza un'app da pubblicare negli store |
| 3 | **Report automatici** | PDF scaricabile delle statistiche + invio periodico via email a destinatari configurabili | Report mensile automatico + PDF + invio programmato (con l'ok del socio) |
| 4 | **Statistiche Google Ads chiare** | Clic, impressioni, budget investito e consumato | Lo stesso, ma con **contatti e costo per contatto**, che interessano di più al titolare |
| 5 | **Catalogo a famiglie** | 9 categorie: Presenza, Sito e SEO, E-commerce, Pubblicità online, Social e contenuti, Marketplace, TV e cinema, Prodotti per l'azienda, Professionisti | Organizzare sito, catalogo e dashboard **per famiglie**, non per servizi sparsi |
| 6 | **Prodotti "tutto in uno"** | InRete AI e InGrande: un nome, un canone, tanti servizi dentro | Pacchetti BigAnt (Presenza, Crescita Locale, Sanità, Ristorazione, Brand): vedi `00_CATALOGO-BIGANT.md` |
| 7 | **Porta d'ingresso gratuita** | "Analisi presenza online" con punteggio, analisi del sito, consulenza gratuita (nome, telefono, P.IVA) e "Ti chiamiamo noi" | S17 Analisi gratuita + modulo "Ti richiamiamo noi" sul sito |
| 8 | **Verticali per categoria** | Pagina dedicata agli psicologi: sito, social, SEO, recensioni, directory, visibilità sull'AI, "marketing etico" | Pagine e pacchetti per **sanità** e **ristorazione**, dove avete già clienti |
| 9 | **Fiducia con i numeri** | 700 consulenti, 45 agenzie, 205.000 clienti, badge Google Partner, loghi clienti, storie di successo | Numeri veri di BigAnt (clienti, siti, contenuti, anni), case study autorizzati, badge reali (es. Google Partner, se ottenuto) |
| 10 | **Presenza locale** | 45 web agency con localizzatore e pagina per sede | BigAnt è locale per definizione: sede a San Marco Evangelista, area servita Caserta e Campania, pagine per città/zona |
| 11 | **Risorse e formazione** | Blog, guide, webinar, sezione bandi, Academy | Blog e guide pratiche per PMI campane + **pagina "Bandi e contributi"** (voucher digitalizzazione regionali e camerali) |
| 12 | **Assistenza multicanale** | WhatsApp, numero verde, orari estesi (lun–ven 8.30–19, sab 8.30–13) | WhatsApp dedicato ai clienti + "chiedi all'agenzia" dentro la dashboard + orari chiari |
| 13 | **Funzioni AI dichiarate** | Siti "ottimizzati per le ricerche AI", visibilità su ChatGPT e Gemini, recensioni e chatbot AI | Offrirle con trasparenza: cosa fa l'AI, cosa controlla una persona |
| 14 | **CRM per il cliente** | Contatti segmentati (potenziali, clienti, VIP, inattivi), email, SMS, coupon, prenotazioni con pagamenti, documenti condivisi fino a 50 GB, client manager dedicato | Modulo CRM e Fidelity in BigAnt OS (S14 + BigAnt Fidelity) |

#### PARTE 2 — I LORO PUNTI DEBOLI (la vostra occasione)
- **Nessun prezzo pubblico:** si passa sempre dalla consulenza. BigAnt può mostrare almeno i prezzi di partenza dei pacchetti: è un elemento di fiducia.
- **Grandi numeri, rapporto distante:** consulenti e call center. BigAnt ha i soci che seguono il cliente, e questo è il vostro vantaggio.
- **Standardizzazione:** prodotti uguali per tutti, poca direzione creativa. BigAnt ha brand, video e drone, che sono il vostro tratto distintivo.
- **Reputazione mista:** l'app ha una media di 3,9 su 24 valutazioni, con recensioni sia molto positive sia molto negative. Per BigAnt trasparenza e risultati visibili nella dashboard devono essere la regola.
- **Statistiche "di attività" più che "di risultato":** clic e impressioni. BigAnt mette al centro contatti, chiamate, prenotazioni e costo per contatto.

---

#### PARTE 3 — LA DASHBOARD CLIENTE BIGANT (specifica proposta)
Modello: l'Area Clienti Italiaonline, **più** quello che a loro manca. Va costruita in BigAnt OS partendo dall'area clienti che esiste già (ped.bigantagency.it).

##### 3.1 Struttura (menu)
1. **Home**
   - In 30 secondi: come sta andando questo mese, rispetto al mese scorso e agli obiettivi.
   - 3–5 numeri chiave: contatti, chiamate, prenotazioni, recensioni, spesa ADV.
   - Sintesi in parole semplici scritta dall'agente reporter e controllata da un socio.
   - "Cosa abbiamo fatto per te questo mese" e "Prossimi passi".
   - Avvisi: contenuti da approvare, recensioni negative, scadenze.
2. **I tuoi risultati** (statistiche per famiglia, come Italiaonline, e dentro ogni famiglia il dettaglio per servizio)
   - Contatti: tutti i contatti, per fonte (ADV, sito, scheda Google, social, WhatsApp, centralino)
   - Presenza: scheda Google, directory, recensioni
   - Sito: visite, fonti, conversioni, posizioni su Google
   - Pubblicità: Google Ads e Meta Ads (spesa, contatti, costo per contatto)
   - Social: crescita, copertura, interazioni, contenuti migliori
   - E-commerce e prenotazioni, se attivi
   - Filtri per periodo, confronto con il periodo precedente, esportazione in PDF
3. **Approvazioni e calendario** *(Italiaonline non ce l'ha)*: calendario editoriale, contenuti da approvare con anteprima, approva o chiedi modifiche con commento, storico.
4. **I tuoi servizi:** servizi attivi con cosa include ogni pacchetto, consegne del mese (fatte o in corso), servizi consigliati (upsell gentile, proposto dal Direttore Crescita e approvato).
5. **Report:** report mensili in PDF, invio automatico via email a destinatari scelti dal cliente.
6. **Documenti e amministrazione:**
   - contratti attivi e scaduti;
   - preventivi;
   - fatture in PDF (dal gestionale, per la ditta corretta);
   - stato dei pagamenti;
   - materiali consegnati (loghi, foto, video).
7. **Contatti e clienti (CRM)**, se il servizio S14 è attivo: contatti ricevuti, segmenti, campagne email/SMS, coupon, tessere Fidelity.
8. **Chiedi all'agenzia** *(meglio di Italiaonline)*: domande sui dati con risposta dell'agente, basata solo sui dati reali; richieste di lavoro che diventano task; WhatsApp diretto.
9. **Il tuo profilo:** dati aziendali, utenti con accesso (titolare, collaboratori), preferenze di notifica, collegamenti alle fonti dati (Google, Meta) con autorizzazione del cliente.

##### 3.2 Regole
- Ogni cliente vede **solo i suoi dati**. L'amministrazione interna di BigAnt non è mai visibile ai clienti.
- **Mai numeri inventati:** se una fonte non è collegata, la dashboard lo dice.
- Pensata **prima per il telefono**, installabile sulla schermata home.
- Linguaggio semplice, niente gergo tecnico.
- Il logo del cliente in alto e il brand BigAnt discreto.

##### 3.3 Fasi
1. Home + Risultati (Presenza, Pubblicità) + Approvazioni + Report
2. Documenti e amministrazione (dipende dal gestionale) + Chiedi all'agenzia
3. CRM e Fidelity, e-commerce e prenotazioni

---

#### PARTE 4 — IL SITO BIGANT "COMPLETO COME IL LORO" (proposta)
Parte dall'audit del 08/10/2026 (`BIGANT/07_MARKETING/report/AUDIT-SEO-SITO-2026-10-08.md`, voto 4,8/10) e dalla struttura del sito Italiaonline.

##### 4.1 Menu proposto
- **Servizi** (menu per famiglie, come Italiaonline):
  - Presenza online (scheda Google, directory, recensioni)
  - Siti e SEO (siti, landing, SEO, accessibilità)
  - Pubblicità (Google Ads, Meta Ads, offline)
  - Social e contenuti (social, foto, video, drone)
  - E-commerce e prenotazioni
  - Brand e merch
  - AI per le imprese (chatbot, centralino AI)
- **Pacchetti:** Presenza, Crescita Locale, Sanità, Ristorazione, Brand, con prezzi di partenza (a differenza di Italiaonline).
- **Settori:** Sanità e studi medici · Ristorazione · Nautica · Industria · Professionisti
- **Analisi gratis:** analisi della presenza online · analisi del sito
- **Lavori:** storie di successo e portfolio, solo con autorizzazione
- **Risorse:** blog · guide per PMI · bandi e contributi
- **Studio:** chi siamo, soci, metodo, piattaforma
- **Contatti** · pulsante **Area clienti**

##### 4.2 Homepage (sezioni dall'alto)
1. Hero: H1 "Agenzia di comunicazione a Caserta per PMI e professionisti" + claim "Forza sproporzionata." + 2 CTA ("Analisi gratuita", "Parliamone su WhatsApp")
2. Famiglie di servizi (7 card)
3. Pacchetti con prezzo di partenza
4. Numeri reali di BigAnt [DA VERIFICARE] e loghi dei clienti autorizzati
5. Storie di successo (3), con risultati veri
6. "Perché BigAnt" (i 4 punti attuali: piccoli ma con i risultati dei grandi, due teste, AI + testa umana, una strategia per tutti i canali)
7. La piattaforma clienti (dashboard): screenshot con dati DEMO
8. Recensioni Google reali (embed)
9. Analisi gratuita, con modulo breve: nome, telefono, attività, e P.IVA facoltativa
10. Risorse: ultimi 3 articoli
11. Contatti + mappa + NAP identico alla scheda Google

##### 4.3 Modello di pagina servizio (uguale per tutti)
1. Problema del cliente
2. Cosa include
3. Pacchetti e prezzo di partenza
4. Come lavoriamo (fasi)
5. Cosa vedrai nella dashboard
6. Un caso studio
7. FAQ
8. CTA (analisi gratuita / WhatsApp)

Il contenuto viene dalle schede S01–S19.

##### 4.4 Modello di storia di successo
Titolo "[frase d'effetto]: [risultato] di [cliente]" · settore · situazione di partenza · servizi usati · cosa abbiamo fatto · risultati con numeri veri · citazione del cliente · foto o video · CTA. **Solo con l'autorizzazione** registrata nel registro autorizzazioni portfolio.

##### 4.5 Fondamenta tecniche e legali (dall'audit)
- Title e meta nuovi
- H1 testuale
- Schema `ProfessionalService`
- NAP coerente con la scheda Google, con la spiegazione delle due ditte nel footer
- Testi alternativi alle immagini
- Errore del modulo da correggere
- `noindex` sull'area clienti
- Privacy, cookie e **dichiarazione di accessibilità** (come Italiaonline), visto che vendiamo il servizio S10
- WhatsApp sempre visibile
- Velocità e Core Web Vitals

##### 4.6 Ordine di lavoro proposto
1. Correzioni dell'audit + nuova homepage
2. Pagine servizio per le famiglie attive + Analisi gratis
3. Pacchetti + Settori (Sanità, Ristorazione)
4. Lavori e storie di successo (dopo le autorizzazioni)
5. Risorse e bandi

#### FONTI
- Homepage, menu, contatti, web agency, storie di successo: https://www.italiaonline.it/ · https://www.italiaonline.it/contatti/ · https://www.italiaonline.it/web-agency/ · https://www.italiaonline.it/storie-di-successo/
- Aiuto Area Clienti: https://www.italiaonline.it/aiuto/area-clienti/ · https://www.italiaonline.it/aiuto/knowledgebase/dove-posso-visualizzare-le-statistiche-dei-miei-servizi/ · https://www.italiaonline.it/aiuto/knowledgebase/come-accedo-alle-statistiche-delle-mie-campagne-google-ads-e-quali-informazioni-trovo-in-area-clienti/ · https://www.italiaonline.it/aiuto/knowledgebase/come-posso-scaricare-le-statistiche-e-modificare-le-impostazioni-per-ricevere-i-report/ · https://www.italiaonline.it/aiuto/knowledgebase/dove-posso-trovare-i-miei-contratti-attivi-e-quelli-scaduti/
- App Area Clienti: https://apps.apple.com/it/app/italiaonline-area-clienti/id1436018800 · https://play.google.com/store/apps/details?id=it.italiaonline.areaclienti
- CRM: https://www.italiaonline.it/servizi/crm-creato-da-noi/


<!-- FILE: docs/playbook/S01_social-media.md -->
### SCHEDA SERVIZIO — Social media management
**Codice:** S01 · **Stato:** ATTIVO · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Il titolare non ha tempo né metodo per comunicare con costanza sui social, e i post fatti "quando capita" non portano clienti.

#### 2. Cosa include
Strategia e pilastri di contenuto · piano editoriale mensile · produzione di post, caroselli, reel e storie · copy nella voce del cliente (scheda DNA) · programmazione · community di base (risposte a commenti e messaggi in orario) · report mensile.

#### 3. Pacchetti
S: 8 contenuti al mese su 1–2 canali · M: 12–16 su 2–3 canali, con reel · L: 20–30 su 3–4 canali, con reel e storie e la gestione della community. Riferimento di mercato: i piani social Italiaonline vanno da 26 a 104 contenuti l'anno, con fino al 50% di video.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Accesso ai profili (in 04_ACCESSI, mai letto dagli agenti) · logo e materiali · foto e video, o una giornata di shooting · referente per le approvazioni · info su promozioni ed eventi entro il 20 del mese precedente.

#### 5. Flusso di lavoro
1. Onboarding: scheda DNA copy/social compilata e approvata (02_COPY-SOCIAL)
2. Entro il 20: piano editoriale del mese successivo (agente social) → ok del socio → ok del cliente
3. Produzione: copy (agente social), brief visivo (agente), grafica (Alfonso), video (Raffaele/Enzo, agente video per lo storyboard)
4. Controllo qualità (agente brand-guardian) → stato DA APPROVARE
5. Il cliente approva dall'area clienti → programmazione
6. A fine mese: report (agente reporter) e aggiornamento del log feedback

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Copertura · interazioni e tasso di interazione · crescita dei follower · clic e messaggi generati · contatti attribuiti ai social · puntualità (% di contenuti usciti come da piano).

#### 8. Strumenti e integrazioni
Piattaforma clienti BigAnt (ped.bigantagency.it) · Postiz o equivalente per la programmazione · Canva, Adobe e CapCut · Meta Business Suite · LinkedIn e TikTok.

#### 9. Rischi e compliance
Testi generici o da IA (serve il controllo qualità) · clienti sanitari: niente promesse di risultati, foto di pazienti solo con consenso scritto · diritti su musica e immagini.

#### 10. Servizi collegati (upsell)
Meta Ads · produzione video · shooting fotografico · recensioni.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
Servizio "Social Media": piani S/M/L/XL con 26, 52, 104 post e stories (Essenziale 26), video e reel fino al 50% dei contenuti, sponsorizzazioni incluse, Social Media Manager trimestrale (mensile nel piano XL), reportistica su piattaforma. Canali: Facebook, Instagram, LinkedIn (citati anche TikTok, YouTube, Google). Prezzi non pubblicati.

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| S "Presenza" | 8 contenuti al mese su 1–2 canali (di cui 2 reel) · piano editoriale · report mensile |
| M "Crescita" | 12–16 contenuti al mese su 2–3 canali (4 reel) · storie · risposte a commenti e messaggi in orario d'ufficio · call trimestrale |
| L "Leader" | 20–30 contenuti al mese su 3–4 canali (8 reel) · storie quotidiane · community completa · mezza giornata di shooting al mese · call mensile |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Setup (scheda DNA + strategia): 150–300 € una tantum · S: 250–350 €/mese · M: 450–650 €/mese · L: 800–1.200 €/mese · budget sponsorizzate a parte, pagato dal cliente.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S02_foto-video-drone.md -->
### SCHEDA SERVIZIO — Produzione foto, video e drone
**Codice:** S02 · **Stato:** ATTIVO (punto di forza) · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Contenuti visivi poveri o amatoriali che non trasmettono il valore dell'azienda.

#### 2. Cosa include
Pre-produzione (obiettivo, storyboard, lista riprese) · shooting foto e prodotto · video social verticali e video corporate/ADV · riprese con drone · montaggio, sottotitoli, colore · video con l'AI (Runway, Artlist) dove serve.

#### 3. Pacchetti
A progetto (giornata o mezza giornata di shooting + n. contenuti montati) oppure a canone, con una giornata al mese inclusa nel piano social.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Disponibilità di location e persone · liberatorie delle persone riprese · per il drone: permessi e zona di volo verificata.

#### 5. Flusso di lavoro
1. Brief compilato secondo la SOP Pipeline Video AI (formato, durata, canale, CTA)
2. Storyboard e lista riprese (agente video) → ok del socio
3. Shooting (Raffaele/Enzo)
4. Montaggio, con hook nei primi 3 secondi e sottotitoli max 3–4 parole per blocco
5. Revisione → ok del cliente → consegna nell'area clienti
6. Riga nel log feedback con le correzioni ricevute

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Visualizzazioni e tasso di completamento dei video · consegne nei tempi · numero di revisioni per progetto · riutilizzo dei contenuti su più canali.

#### 8. Strumenti e integrazioni
Runway, Artlist, CapCut, Adobe · drone [modello e abilitazioni DA VERIFICARE].

#### 9. Rischi e compliance
Volo drone: normativa ENAC/EASA, assicurazione, zone vietate · liberatorie e privacy · diritti musicali.

#### 10. Servizi collegati (upsell)
Social media · ADV video · sito web.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
"Foto e Video professionali": shooting, interviste, slideshow, video cartoon, più di 30 formati video, Video Specialist dedicato, distribuzione gratuita sui portali Italiaonline e sulla scheda Google. Dichiarano più di 650 fotografi e videomaker in Italia. Prezzi non pubblicati.

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Mezza giornata | fino a 4 ore di riprese, 20 foto editate e 2 reel montati |
| Giornata | fino a 8 ore, 40 foto e 4 reel, oppure 1 video corporate 60–90s |
| Add-on | drone · video con l'AI · sottotitoli multilingua · formati extra |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Mezza giornata: 300–500 € · Giornata: 600–1.000 € · Reel montato singolo: 80–200 € · Video corporate: 800–2.500 € · Drone: +150–300 € a uscita. Da verificare con il costo di Enzo (circa 400 €/mese ricorrenti).
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S03_google-ads.md -->
### SCHEDA SERVIZIO — Google Ads (Search, Performance Max, YouTube)
**Codice:** S03 · **Stato:** ATTIVO — metodo già scritto · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
L'azienda vuole contatti subito da chi la cerca su Google, ma le campagne fai-da-te sprecano budget.

#### 2. Cosa include
Brief pre-campagna · struttura delle campagne · parole chiave e negative · annunci ed estensioni · tracciamento delle conversioni · ottimizzazione periodica · report.

#### 3. Pacchetti
Gestione mensile a canone + budget pubblicitario pagato dal cliente direttamente a Google. Livelli in base al numero di campagne o alla spesa gestita [DA DEFINIRE].
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Accesso all'account Google Ads collegato all'MCC BigAnt · obiettivo e budget · accesso al sito o al tag manager per il tracciamento · zone servite e servizi principali.

#### 5. Flusso di lavoro
1. Si segue 00_METODO-OPERATIVO.md: brief → mappa leve (11 sezioni) → esecuzione, mai il wizard
2. Brief e proposta di struttura (agente ADS) → ok di Raffaele
3. Messa online (Raffaele): reti partner e Display spente sulle Search, AI Max spento finché i dati non sono affidabili
4. Controllo settimanale: termini di ricerca, negative, budget, spesa reale in Fatturazione
5. Report mensile e aggiornamento della scheda Ads del cliente

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Conversioni (chiamate, form, WhatsApp) · costo per contatto · tasso di conversione · quota impressioni · spesa rispetto al budget.

#### 8. Strumenti e integrazioni
Google Ads (MCC BigAnt) · Google Ads API (developer token) · Tag Manager · GA4.

#### 9. Rischi e compliance
Tracciamento assente su siti non nostri (va dichiarato nella scheda) · pubblicità sanitaria: regole Google e normativa italiana · budget superato.

#### 10. Servizi collegati (upsell)
Landing page · SEO · Meta Ads.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
"Pubblicità Online": Google e Bing, incluse Google AI e Google Hotel Ads, più i social. Processo: analisi di mercato e concorrenti → creatività → attivazione e gestione in tempo reale → report sulla piattaforma con un account dedicato. Prezzi non pubblicati, "dipende da canali e target".

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Start | 1 campagna Search · fino a 1.000 €/mese di budget · controllo ogni 2 settimane · report mensile |
| Pro | fino a 3 campagne (Search + PMax/YouTube) · budget fino a 5.000 €/mese · controllo settimanale |
| Setup | brief, mappa leve, struttura, tracciamento delle conversioni |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Setup: 200–400 € · Gestione: minimo 200–400 €/mese, oppure 15–20% della spesa pubblicitaria (il valore più alto dei due) · budget a parte, pagato dal cliente a Google. Benchmark: in Europa i piani base partono da 75–200 €/mese, mentre il modello a percentuale va dal 10–20% della spesa, fino al 20–30% sugli account piccoli.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S04_meta-ads.md -->
### SCHEDA SERVIZIO — Meta Ads (Facebook, Instagram) e altri social a pagamento
**Codice:** S04 · **Stato:** ATTIVO (Meta) · DA ATTIVARE (LinkedIn, TikTok) · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Farsi conoscere e generare contatti da persone che non stanno ancora cercando il servizio.

#### 2. Cosa include
Obiettivo e pubblico · creatività (testo, grafica, video) · campagne e moduli contatto nativi · pixel/API conversioni · ottimizzazione · report.

#### 3. Pacchetti
Canone di gestione + budget pagato dal cliente a Meta. LinkedIn e TikTok come estensioni per i clienti B2B o con target giovane.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Accesso al Business Manager e all'account pubblicitario · pagina Facebook e profilo Instagram · budget · offerta o promozione chiara.

#### 5. Flusso di lavoro
1. Brief (obiettivo, pubblico, offerta, budget)
2. 3 varianti creative (agente ADS + agente social; grafica di Alfonso, video di Raffaele) → ok
3. Messa online (Raffaele) → controllo a 72 ore → ottimizzazione settimanale
4. Gestione dei contatti generati: devono arrivare nel CRM e al cliente in giornata
5. Report mensile

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Costo per contatto · numero di contatti · qualità dei contatti (% utili, da chiedere al cliente) · CTR · frequenza · spesa.

#### 8. Strumenti e integrazioni
Meta Business Suite e Gestione inserzioni · Marketing API (ads_read) · pixel e Conversions API.

#### 9. Rischi e compliance
Categorie speciali (salute) con limiti di targeting · contatti non richiamati in fretta (si perdono) · stanchezza delle creatività.

#### 10. Servizi collegati (upsell)
Produzione video · landing page · CRM e contatti.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
Incluso in "Pubblicità Online": Instagram, Facebook, LinkedIn, YouTube, TikTok, con contenuti sponsorizzati (video, immagini, testi), landing personalizzate e report. Prezzi non pubblicati.

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Start | 1 obiettivo (contatti o notorietà) · 3 creatività al mese · budget fino a 1.000 €/mese |
| Pro | 2–3 campagne · test A/B · retargeting · moduli contatto nativi collegati al CRM |
| Add-on | LinkedIn Ads (B2B) · TikTok Ads · produzione video dedicata |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Setup (pixel, API conversioni, pubblici): 150–300 € · Gestione: minimo 200–400 €/mese o 15–20% della spesa · creatività video a parte (S02).
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S05_seo.md -->
### SCHEDA SERVIZIO — SEO (sito, contenuti, tecnica)
**Codice:** S05 · **Stato:** IN PARTE (agenti SEO installati) · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Il sito non compare su Google per le ricerche che contano.

#### 2. Cosa include
Audit SEO iniziale · ricerca delle parole chiave · ottimizzazione on-page (title, meta, H1–H2, contenuti) · SEO tecnica di base (velocità, indicizzazione, schema) · articoli o pagine nuove ogni mese · monitoraggio delle posizioni.

#### 3. Pacchetti
Audit una tantum · SEO mensile S/M/L in base al numero di contenuti e di pagine ottimizzate. Riferimento di mercato: Italiaonline offre SEO AI, SEO per sito ed e-commerce, blog e copy, audit, SEO Extra, "da poche centinaia a migliaia di euro".
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Accesso al CMS del sito · Search Console e GA4 · elenco dei servizi e delle zone servite · disponibilità a rispondere a domande tecniche sul settore.

#### 5. Flusso di lavoro
1. Audit (agente seo-content-auditor + controllo tecnico) → report con priorità
2. Piano parole chiave e contenuti (seo-keyword-strategist, seo-content-planner) → ok
3. Ottimizzazioni e nuovi contenuti (seo-content-writer, seo-meta-optimizer, seo-structure-architect) → controllo qualità → ok del cliente → pubblicazione
4. Ogni mese: posizioni, traffico, contenuti da aggiornare (seo-content-refresher)

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Clic e impressioni da Search Console · posizioni medie per le parole chiave obiettivo · traffico organico · contatti dal traffico organico · pagine indicizzate.

#### 8. Strumenti e integrazioni
Search Console API · GA4 API · agenti seo-* · WordPress (wordpress-mcp) dove il sito è WordPress.

#### 9. Rischi e compliance
Risultati lenti (3–6 mesi): va detto subito al cliente · contenuti sanitari: servono accuratezza e revisione da parte del cliente.

#### 10. Servizi collegati (upsell)
Siti web · accessibilità · local SEO.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
"Servizi SEO": SEO AI, SEO per sito ed e-commerce, SEO blog e copy, SEO audit, SEO Extra, progetti locali e nazionali, monitoraggio in tempo reale. Prezzi "dalle poche centinaia alle migliaia di euro". Il sito non è garantito in prima pagina.

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Audit | audit tecnico e dei contenuti, con un piano a priorità |
| S | ottimizzazione di 5 pagine al mese · 1 articolo · monitoraggio di 20 parole chiave |
| M | 10 pagine al mese · 2–4 articoli · SEO tecnica · 50 parole chiave |
| L | SEO completa · 4–8 articoli · link building locale · visibilità sugli assistenti AI (AI Overview, ChatGPT) |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Audit: 300–800 € · S: 300–600 €/mese · M: 600–1.000 €/mese · L: 1.000–1.800 €/mese. Benchmark Italia: freelance 400–1.000 €/mese, piccola agenzia 800–2.000 €/mese, audit una tantum da 300 € in su.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S06_local-seo-gbp.md -->
### SCHEDA SERVIZIO — Local SEO e Google Business Profile
**Codice:** S06 · **Stato:** ATTIVO (con Vincenzo) · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Il cliente non compare nella mappa di Google quando qualcuno cerca il suo servizio in zona.

#### 2. Cosa include
Ottimizzazione della scheda (categorie, descrizione, servizi, attributi, foto, orari) · post settimanali o mensili · domande e risposte · coerenza NAP con il sito · monitoraggio delle posizioni locali.

#### 3. Pacchetti
Ottimizzazione iniziale una tantum + gestione mensile (post, foto, monitoraggio).
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Accesso come gestore della scheda · foto aggiornate · orari e servizi corretti · eventuali promozioni.

#### 5. Flusso di lavoro
1. Checklist della scheda (agente local-GBP) → correzioni (Vincenzo)
2. Calendario dei post GBP (agente) → ok → pubblicazione (Vincenzo, board Trello "GBP OPS")
3. Ogni mese: statistiche della scheda (visualizzazioni, chiamate, indicazioni stradali) → report

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Visualizzazioni della scheda · chiamate · richieste di indicazioni stradali · clic al sito · posizione nel Local Pack per le ricerche chiave.

#### 8. Strumenti e integrazioni
Google Business Profile API (da richiedere, vedi ACCESSI-API-BIGANT-OS.md) · Drive "GBP CLIENTI - VINCENZO" · Trello.

#### 9. Rischi e compliance
Sospensione della scheda per modifiche aggressive o dati incoerenti · accesso alla scheda in mano a terzi.

#### 10. Servizi collegati (upsell)
Reputazione e recensioni · presenza online multi-directory.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
Incluso in InRete AI e InGrande: profilo sulle directory Italiaonline, scheda Google gestita, posizionamento premium su PagineGialle (proprietario, non replicabile).

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Setup | ottimizzazione completa della scheda, verifica del NAP, foto, servizi, Q&A |
| Gestione | 4 post al mese · aggiornamento delle foto · Q&A · statistiche mensili · monitoraggio del Local Pack |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Setup: 150–300 € · Gestione: 80–200 €/mese per sede. Nel bundle "Presenza" (vedi il catalogo) il prezzo scende.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S07_presenza-online-directory.md -->
### SCHEDA SERVIZIO — Presenza online multi-directory
**Codice:** S07 · **Stato:** DA ATTIVARE — priorità 1 · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
I dati dell'azienda (nome, indirizzo, telefono, orari) sono sbagliati o assenti su mappe, directory e assistenti AI, e i clienti trovano informazioni vecchie.

#### 2. Cosa include
Censimento della presenza attuale · scheda coerente su directory, mappe e portali italiani · aggiornamento centralizzato · controllo di come l'azienda viene descritta da ChatGPT, Gemini e simili.

#### 3. Pacchetti
Canone mensile con una piattaforma di listing management (da scegliere: rivendita white-label). È l'equivalente di InRete AI / InGrande Network di Italiaonline, che dichiarano più di 45 siti.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Dati ufficiali dell'azienda · logo e foto · accessi alle schede già esistenti.

#### 5. Flusso di lavoro
1. Analisi della presenza (parte dell'analisi gratuita, servizio 17)
2. Attivazione sulla piattaforma di listing (Raffaele/Alfonso) → pubblicazione dei dati coerenti
3. Ogni mese: controllo delle incoerenze e di come rispondono gli assistenti AI → report

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Numero di directory coerenti · errori corretti · visualizzazioni aggregate · menzioni corrette negli assistenti AI.

#### 8. Strumenti e integrazioni
Piattaforma di listing white-label [DA SCEGLIERE: confrontare costi e copertura Italia] · GBP API.

#### 9. Rischi e compliance
Costo della piattaforma per cliente, da coprire col canone · dipendenza da un fornitore.

#### 10. Servizi collegati (upsell)
Reputazione e recensioni · chatbot AI.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
InRete AI: profilo digitale su più di 45 siti (directory Italiaonline, motori di ricerca, social, mappe, portali di settore, assistenti AI come ChatGPT, Gemini, Meta AI), con un'unica Area Clienti. InGrande Network: pubblicazione automatica delle sedi su più di 45 siti.

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Presenza | sincronizzazione dei dati su directory e mappe tramite una piattaforma di listing · controllo trimestrale degli assistenti AI |
| Multi-sede | per le aziende con più sedi: un profilo per sede e collaboratori con accessi separati |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Costo della piattaforma di listing [DA PREVENTIVARE: Partoo, Uberall, Synup o altri; nessuno pubblica i prezzi, e Synup parte da 79 $/mese per le agenzie] + margine. Prezzo al cliente proposto: 40–90 €/mese per sede. Si vende solo in bundle con S06 e S08.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S08_reputazione-recensioni.md -->
### SCHEDA SERVIZIO — Reputazione e recensioni
**Codice:** S08 · **Stato:** DA ATTIVARE — priorità 1 · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Poche recensioni, recensioni senza risposta o una negativa in evidenza: chi confronta sceglie il concorrente.

#### 2. Cosa include
Strategia di raccolta recensioni (messaggio WhatsApp, QR, email dopo il servizio) · risposte a tutte le recensioni, preparate dall'AI e approvate · avvisi sulle recensioni negative · report.

#### 3. Pacchetti
Canone mensile, da solo o insieme al servizio 06/07.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Elenco dei clienti soddisfatti a cui chiedere la recensione, con il loro consenso · tono delle risposte (scheda DNA) · chi approva le risposte sensibili.

#### 5. Flusso di lavoro
1. Kit di raccolta (testi, QR, istruzioni per lo staff del cliente) → ok del cliente
2. Ogni giorno: nuove recensioni → bozza di risposta (agente) → ok (cliente o socio) → pubblicazione
3. Recensione negativa: avviso immediato al socio e al cliente, risposta concordata
4. Report mensile: numero, media, tempi di risposta

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Nuove recensioni al mese · voto medio · % di recensioni con risposta · tempo medio di risposta.

#### 8. Strumenti e integrazioni
GBP API · piattaforma di recensioni o listing (servizio 07).

#### 9. Rischi e compliance
Vietato comprare, inventare o incentivare recensioni (regole Google, Codice del Consumo, direttiva UE "Omnibus") · sanità: nessun dato clinico nelle risposte.

#### 10. Servizi collegati (upsell)
Presenza online multi-directory · local SEO.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
InRete AI e l'add-on InGrande "Gestione Recensioni con AI": risposte automatiche e personalizzate con l'AI, a partire da istruzioni fornite dal cliente, su tutte le sedi.

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Base | risposta a tutte le recensioni entro 48 ore (bozza AI + approvazione) · avvisi sulle recensioni negative |
| Pro | kit di raccolta recensioni (QR, WhatsApp, email dopo il servizio) · report sul sentiment · più piattaforme (Google, Facebook, TripAdvisor e portali di settore) |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Base: 60–100 €/mese · Pro: 120–200 €/mese · kit QR e materiali stampati a parte.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S09_siti-web.md -->
### SCHEDA SERVIZIO — Siti web e landing page
**Codice:** S09 · **Stato:** ATTIVO · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Sito vecchio, lento o che non porta contatti.

#### 2. Cosa include
Analisi e struttura · testi (agenti SEO e landing-page-copywriter) · design (Alfonso) · sviluppo · tracciamento · privacy e cookie · formazione al cliente · manutenzione e hosting a canone.

#### 3. Pacchetti
Landing page · sito vetrina · sito con blog o multilingua · manutenzione mensile (aggiornamenti, backup, sicurezza, piccole modifiche). Le scadenze di hosting e domini sono nel foglio Tracker.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Testi e foto, o lo shooting · accessi al dominio · elenco dei servizi · referente per le approvazioni.

#### 5. Flusso di lavoro
1. Brief e mappa del sito → ok
2. Testi (agenti) + design (Alfonso) → ok del cliente
3. Sviluppo → controllo: velocità, mobile, SEO di base, accessibilità, form, tracciamento
4. Pubblicazione dopo l'ok · consegna delle credenziali e mini-guida
5. Manutenzione: aggiornamenti mensili, backup, rinnovi (scadenziario)

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Contatti generati dal sito · tasso di conversione · velocità (Core Web Vitals) · uptime.

#### 8. Strumenti e integrazioni
WordPress (wordpress-mcp) o altro CMS [DA DEFINIRE lo standard BigAnt] · GA4 · Search Console.

#### 9. Rischi e compliance
Privacy e cookie banner obbligatori · accessibilità (servizio 10) · dominio intestato al cliente, non all'agenzia (da chiarire nel contratto).

#### 10. Servizi collegati (upsell)
SEO · accessibilità · manutenzione · Google Ads.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
"Sito web" con 3 piani: Essenziale (5 pagine, 80 immagini, 2 video), Standard (15 pagine, 160 immagini, 16 video, il più venduto), Extra (50 pagine, 200 immagini, 3 domini). Inclusi hosting, SSL, email (5/15/30 GB), integrazione WhatsApp, manutenzione tecnica illimitata, 3–5 ore di assistenza nel primo anno, area clienti con le statistiche, "sito ottimizzato per le ricerche AI". Add-on: copywriting, FAQ, gestione recensioni, landing, form evoluti, servizio fotografico (20 scatti l'anno), catalogo con richiesta di preventivo, vetrina annunci, asporto e consegna per i ristoranti. SEO venduta a parte. Prezzi non pubblicati.

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Landing | 1 pagina orientata ai contatti, collegata all'ADV |
| Essenziale | fino a 5 pagine · testi · SEO di base · privacy e cookie · WhatsApp · statistiche |
| Standard | fino a 15 pagine · blog · form evoluti · recensioni integrate · servizio fotografico |
| Extra | fino a 50 pagine · multilingua · catalogo con preventivi · integrazioni (prenotazioni, CRM) |
| Manutenzione | aggiornamenti, backup, sicurezza, hosting e dominio, 1–3 ore di modifiche al mese |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Landing: 500–1.000 € · Essenziale: 1.200–2.500 € · Standard: 2.500–4.500 € · Extra: da 4.500 € · Manutenzione e hosting: 30–80 €/mese (oppure 300–800 €/anno). Benchmark Italia: freelance 800–3.000 €, dominio 10–20 €/anno, hosting da 1–3 €/mese.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S10_accessibilita.md -->
### SCHEDA SERVIZIO — Accessibilità digitale dei siti
**Codice:** S10 · **Stato:** DA ATTIVARE — priorità 3 · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Molti siti non sono utilizzabili da persone con disabilità, e lo European Accessibility Act (in vigore da giugno 2025) obbliga diverse categorie di imprese ad adeguarsi.

#### 2. Cosa include
Verifica dell'obbligo per il cliente · audit WCAG · correzioni (contrasto, testi alternativi, navigazione da tastiera, form) · dichiarazione di accessibilità · monitoraggio.

#### 3. Pacchetti
Audit una tantum + adeguamento a progetto + monitoraggio annuale.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Accesso al sito · elenco dei servizi online offerti dal cliente (e-commerce, prenotazioni…).

#### 5. Flusso di lavoro
1. Verifica se il cliente rientra negli obblighi [DA VERIFICARE caso per caso: microimprese e settori]
2. Audit automatico + controllo manuale → report
3. Correzioni → nuova verifica → dichiarazione

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Errori di accessibilità risolti · punteggio di accessibilità · pagine conformi.

#### 8. Strumenti e integrazioni
Strumenti di audit WCAG [DA SCEGLIERE] · CMS del cliente.

#### 9. Rischi e compliance
Non promettere "conformità legale" senza verifica: consigliare un parere legale per i casi dubbi.

#### 10. Servizi collegati (upsell)
Rifacimento del sito · manutenzione.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
"Accessibilità digitale": widget di accessibilità + dichiarazione di accessibilità + adeguamento del sito. Riferimenti normativi indicati da Italiaonline: direttiva UE 2019/882 (European Accessibility Act) e D.Lgs. 82/2022, termine del 28 giugno 2025. Obbligo indicato per le imprese con più di 10 dipendenti e più di 2 milioni di euro di fatturato, in settori come e-commerce, banche, sanità privata, trasporti e media. Sanzioni fino al 5% del fatturato nei casi gravi (da verificare con un legale).

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Verifica | il cliente è obbligato? Check-list e audit automatico |
| Adeguamento | correzioni WCAG 2.1 AA sulle pagine principali + dichiarazione di accessibilità |
| Monitoraggio | controllo trimestrale e aggiornamento annuale della dichiarazione |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Verifica e audit: 300–600 € · Adeguamento: 500–2.000 € in base al sito · Monitoraggio: 150–400 €/anno. NB: un widget da solo non rende un sito conforme. Non va venduto come soluzione completa.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S11_ecommerce.md -->
### SCHEDA SERVIZIO — E-commerce e social commerce
**Codice:** S11 · **Stato:** DA ATTIVARE — priorità 6 · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Il cliente vuole vendere online o dai social ma non sa da dove partire.

#### 2. Cosa include
Scelta della piattaforma · catalogo e schede prodotto · pagamenti e spedizioni · policy legali · collegamento a Instagram/Facebook Shop e Google Merchant · campagne di lancio.

#### 3. Pacchetti
Setup a progetto + gestione mensile (catalogo, promozioni, ADV).
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Catalogo, prezzi, foto · condizioni di vendita · gestione logistica a carico del cliente.

#### 5. Flusso di lavoro
1. Analisi di fattibilità (margini, logistica) → proposta
2. Setup piattaforma e catalogo → test degli ordini → ok
3. Lancio con ADV e social → report mensile

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Ordini · fatturato online · tasso di conversione · valore medio dell'ordine · costo per acquisto.

#### 8. Strumenti e integrazioni
Shopify (plugin già disponibile) o WooCommerce [DA DEFINIRE lo standard] · Google Merchant Center · Meta Commerce.

#### 9. Rischi e compliance
Obblighi del Codice del Consumo (recesso, informazioni precontrattuali) · pagamenti e resi.

#### 10. Servizi collegati (upsell)
Meta Ads · Google Shopping · foto prodotto.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
"Ecommerce": progettazione, caricamento dei primi prodotti, pagamenti e spedizioni, mobile, accessibilità, store manager dedicato, comparatore di prezzi Kelkoo (1.500 clic), 25 testi e grafiche per i prodotti, SEO per e-commerce, monitoraggio dopo il lancio. "Social Commerce": catalogo collegato a Facebook e Instagram, tag prodotto nei post, creazione delle pagine, contenuti e sponsorizzazioni. Prezzi non pubblicati.

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Start | fino a 50 prodotti · pagamenti e spedizioni · policy legali · catalogo collegato a Instagram e Facebook |
| Pro | fino a 500 prodotti · Google Shopping e Merchant Center · email di carrello abbandonato · SEO e-commerce |
| Gestione | store manager: catalogo, promozioni, report mensile |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Start: 2.500–4.000 € · Pro: 4.000–8.000 € · Gestione: 300–800 €/mese · i costi della piattaforma (es. Shopify) sono a carico del cliente.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S12_prenotazioni.md -->
### SCHEDA SERVIZIO — Prenotazioni online
**Codice:** S12 · **Stato:** DA ATTIVARE — priorità 5 · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Il cliente perde appuntamenti e tavoli perché si può prenotare solo per telefono.

#### 2. Cosa include
Scelta e configurazione dello strumento · agenda e servizi · pulsante su sito, scheda Google e social · promemoria automatici · report.

#### 3. Pacchetti
Setup + canone mensile. È l'equivalente di PrenotaOra Servizi e PrenotaOra Ristoranti di Italiaonline.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Servizi, durate, orari, staff · regole di cancellazione.

#### 5. Flusso di lavoro
1. Scelta dello strumento adatto al settore (centri medici, ristorazione) → configurazione
2. Test → collegamento a sito, GBP e social → formazione dello staff
3. Report mensile delle prenotazioni

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Prenotazioni online al mese · % sul totale · mancate presentazioni · prenotazioni fuori orario.

#### 8. Strumenti e integrazioni
Strumento di prenotazione [DA SCEGLIERE per settore] · prenotazione diretta su GBP.

#### 9. Rischi e compliance
Dati sanitari nelle prenotazioni mediche: GDPR rafforzato, meglio uno strumento specifico per il settore.

#### 10. Servizi collegati (upsell)
Centralino AI · Google Ads · recensioni dopo la visita.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
"PrenotaOra Servizi": prenotazioni 24/7, agenda per operatore sincronizzata con Google, Outlook e Apple, fino a 3 operatori, assegnazione Round-Robin, appuntamenti in videocall o telefonici, conferma manuale configurabile, integrazione con Google e con MARiO, zero commissioni. "PrenotaOra Ristoranti": coperti e disponibilità in tempo reale, menù digitale con QR, blocco delle prenotazioni last-minute, allergie salvate nella prenotazione, Prenota con Google, CRM unico, zero commissioni (confronto: 300 coperti al mese sulle piattaforme tradizionali possono costare più di 3.600 € l'anno).

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Servizi | agenda online per centri medici, estetica, studi professionali: fino a 3 operatori, promemoria, prenotazione dalla scheda Google |
| Ristoranti | prenotazione tavoli, menù QR, Prenota con Google, nessuna commissione per coperto |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Setup: 150–300 € · Canone: 40–90 €/mese, con il software incluso o ribaltato al cliente. Argomento di vendita per i ristoranti: il confronto con le commissioni delle piattaforme.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S13_centralino-chatbot-ai.md -->
### SCHEDA SERVIZIO — Centralino AI e chatbot
**Codice:** S13 · **Stato:** DA ATTIVARE — priorità 5 · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Chiamate e messaggi persi fuori orario o quando lo staff è occupato.

#### 2. Cosa include
Centralino vocale AI (risponde, raccoglie l'esigenza, manda un riepilogo) · chatbot su sito, WhatsApp e Messenger · risposte basate solo sulle informazioni approvate · passaggio a un umano.

#### 3. Pacchetti
Setup + canone mensile con minuti e messaggi inclusi. È l'equivalente di MARiO e del chatbot di InRete AI di Italiaonline.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Domande frequenti e risposte approvate · orari, servizi, prezzi pubblici · a chi girare i casi urgenti.

#### 5. Flusso di lavoro
1. Base di conoscenza (agente) → ok del cliente
2. Configurazione (centralino o chatbot) → test con casi reali → ok
3. Ogni settimana: lettura delle conversazioni, risposte da correggere → aggiornamento

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Chiamate e chat gestite · contatti raccolti · % di risposte corrette · casi passati all'umano.

#### 8. Strumenti e integrazioni
Piattaforma voce/chat AI [DA SCEGLIERE: costi al minuto, italiano, GDPR, server UE].

#### 9. Rischi e compliance
Sanità: il bot non dà mai consigli medici e indirizza le urgenze al 112 · informativa privacy e registrazione delle chiamate.

#### 10. Servizi collegati (upsell)
Prenotazioni · CRM e contatti.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
"MARiO": assistente AI per chiamate e chat, 24/7, in 57 lingue, chiamate in parallelo, numero dedicato o deviazione, riepilogo dopo ogni conversazione, registrazioni consultabili; 300 minuti al mese inclusi (chiamate illimitate fino al 31/10/2026) e chat illimitate. InRete AI: chatbot 24/7 e risposte automatiche ai messaggi Facebook e Instagram, con 200 messaggi AI al mese inclusi e ricaricabili.

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Chatbot | chat su sito, WhatsApp e Messenger con base di conoscenza approvata · 200–500 messaggi al mese |
| Centralino AI | numero dedicato o deviazione · 300 minuti al mese · riepilogo via email o WhatsApp · prenotazione integrata con S12 |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Setup: 300–800 € · Chatbot: 60–150 €/mese · Centralino AI: 120–250 €/mese con 300 minuti, poi il costo dei minuti extra. Costo del fornitore: circa 0,07–0,30 $ al minuto tutto incluso, a cui vanno aggiunti telefonia e integrazioni (+20–40%).
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S14_email-crm-lead.md -->
### SCHEDA SERVIZIO — Email marketing, CRM e gestione contatti
**Codice:** S14 · **Stato:** DA ATTIVARE · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
I contatti arrivano da tanti canali e si perdono; i clienti passati non vengono ricontattati.

#### 2. Cosa include
Raccolta dei contatti da tutti i canali in un CRM · avviso immediato al cliente · newsletter e campagne email · automazioni (benvenuto, follow-up, richiesta di recensione) · coupon e promozioni.

#### 3. Pacchetti
Setup + canone mensile. È l'equivalente del CRM e delle "Campagne AI" di InRete AI di Italiaonline.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Elenco dei clienti con consenso marketing documentato · offerte · chi risponde ai contatti.

#### 5. Flusso di lavoro
1. Collegamento delle fonti (form, ADV, WhatsApp, centralino) → CRM
2. Automazioni base → ok
3. Una campagna email al mese (agente) → controllo qualità → ok → invio

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Contatti per fonte · tempo di risposta del cliente · tasso di apertura e clic · vendite da email.

#### 8. Strumenti e integrazioni
CRM del gestionale BigAnt OS o strumento esterno [DA DEFINIRE] · piattaforma email.

#### 9. Rischi e compliance
GDPR: consenso esplicito per il marketing, disiscrizione facile, niente liste comprate.

#### 10. Servizi collegati (upsell)
Meta Ads lead · centralino AI · fidelizzazione (BigAnt Fidelity).

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
InRete AI (gamma Premium): CRM con contatti unificati, lead B2B (aziende che hanno visitato i profili), form promozionali e coupon, campagne email automatizzate con template, testi e immagini AI, 10.000 email al mese incluse. Dal 2021 Italiaonline offre anche la fornitura di email. Esiste anche un servizio CRM dedicato ("CRM creato da noi"): contatti da sito, social e liste, segmentati in potenziali, clienti, VIP e inattivi; campagne email, SMS e coupon; prenotazioni 24/7 con pagamenti Nexi e PayPal, promemoria e sincronizzazione dei calendari; fino a 10 membri dello staff; documenti condivisi fino a 50 GB; app mobile; client manager dedicato.

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| CRM | raccolta dei contatti da tutti i canali · avviso al cliente in tempo reale · pipeline semplice |
| Email | 1–2 campagne al mese · automazioni (benvenuto, follow-up, richiesta di recensione, compleanno) · coupon |
| Fidelity | collegamento con BigAnt Fidelity: tessere, punti, premi |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Setup: 300–600 € · CRM + automazioni: 80–200 €/mese · Campagne email: 150–300 €/mese · Fidelity: [DA DEFINIRE in base al modulo BigAnt Fidelity].
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S15_branding.md -->
### SCHEDA SERVIZIO — Branding e corporate design
**Codice:** S15 · **Stato:** ATTIVO (Alfonso) · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Un'immagine incoerente o datata fa sembrare l'azienda più piccola o meno affidabile di quanto sia.

#### 2. Cosa include
Analisi e posizionamento · logo e sistema visivo · palette e font · regole d'uso (brand book) · applicazioni (biglietti, insegne, social, divise) · scheda DNA verbale.

#### 3. Pacchetti
Logo · identità completa · rebranding · brand book.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Storia e valori dell'azienda · concorrenti · gusti e limiti · materiali esistenti.

#### 5. Flusso di lavoro
1. Brief e ricerca (agente competitive-analyst per i concorrenti) → ok
2. Proposte creative (Alfonso) → scelta del cliente → rifinitura
3. Consegna dei file in tutti i formati in 05_LOGO-E-BRAND + brand book + scheda DNA

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Rispetto dei tempi · numero di revisioni · adozione del brand sui canali.

#### 8. Strumenti e integrazioni
Adobe, Figma, Canva (per i modelli che usa il cliente).

#### 9. Rischi e compliance
Verifica dell'anteriorità del marchio prima del deposito (consigliare un consulente) · font e immagini con licenza.

#### 10. Servizi collegati (upsell)
Sito · social · merch · insegne (partner).

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
Non è un servizio dichiarato di Italiaonline. È un elemento distintivo di BigAnt.

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Logo | 3 proposte · 2 giri di revisione · file in tutti i formati |
| Identità | logo + palette + font + applicazioni base + mini brand book |
| Rebranding | analisi + identità completa + brand book + scheda DNA verbale + kit social |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Logo: 500–1.200 € · Identità: 1.500–3.500 € · Rebranding completo: da 3.500 €.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S16_merch-abbigliamento.md -->
### SCHEDA SERVIZIO — Merch e abbigliamento personalizzato
**Codice:** S16 · **Stato:** ATTIVO · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Il cliente vuole divise e gadget coerenti con il brand.

#### 2. Cosa include
Scelta dei capi · grafica · campionatura · produzione all'ingrosso tramite fornitori · consegna.

#### 3. Pacchetti
A preventivo, per quantità.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Quantità, taglie, budget, tempi.

#### 5. Flusso di lavoro
1. Richiesta → preventivo (agente prepara la bozza, socio approva) → ok del cliente e acconto
2. Grafica (Alfonso) → campione → ok → produzione → consegna

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Margine per ordine · tempi di consegna · riordini.

#### 8. Strumenti e integrazioni
Fornitori [elenco DA COMPILARE nel gestionale].

#### 9. Rischi e compliance
Acconto prima della produzione · errori di taglia o colore: conferma scritta della bozza.

#### 10. Servizi collegati (upsell)
Branding · eventi.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
"Gadget personalizzati": più di 3.000 articoli (abbigliamento, penne, tech, tazze e borracce, eco, ufficio), personalizzazione, prototipo da approvare prima della stampa, consegna con corriere. Prezzi non pubblicati.

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Merch | gadget e abbigliamento con grafica · prototipo · consegna |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Ricarico del 25–40% sul costo del fornitore + grafica (inclusa sopra una soglia d'ordine) · acconto del 50% all'ordine.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S17_analisi-gratuita.md -->
### SCHEDA SERVIZIO — Analisi gratuita della presenza online (commerciale)
**Codice:** S17 · **Stato:** DA ATTIVARE — priorità 2 · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Serve un modo semplice e utile per iniziare a parlare con un potenziale cliente.

#### 2. Cosa include
Report automatico di 2–3 pagine: sito (velocità, SEO di base, mobile), scheda Google, recensioni, social, coerenza dei dati online, confronto con 2–3 concorrenti locali · 3 azioni consigliate · invito a una chiamata.

#### 3. Pacchetti
Gratuito: è la porta d'ingresso commerciale, collegata allo strumento di ricerca clienti. È l'equivalente dello "scantool" di Italiaonline.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Nome e sito dell'azienda (anche solo pubblici).

#### 5. Flusso di lavoro
1. Lead trovato (ricerca clienti) o richiesta dal sito
2. Analisi automatica (agenti) → controllo di un socio → invio dopo l'ok
3. Follow-up (agente sales) → appuntamento → proposta

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Analisi inviate · % di risposte · appuntamenti fissati · clienti acquisiti · tempo per produrre un'analisi.

#### 8. Strumenti e integrazioni
Strumento di ricerca clienti (in BigAnt OS) · agenti SEO e local · PageSpeed.

#### 9. Rischi e compliance
Contatto a freddo: rispettare GDPR e il Registro delle opposizioni per le telefonate · niente toni denigratori sulla concorrenza.

#### 10. Servizi collegati (upsell)
Tutti i servizi.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
"Analisi presenza online" (scantool): l'utente inserisce insegna, nome, indirizzo, telefono e P.IVA; riceve un punteggio di visibilità con punti di forza e di debolezza (dati coerenti, reperibilità, orari, recensioni) e consigli; accetta di essere ricontattato; segue la consulenza gratuita. Esiste anche un'analisi gratuita del sito (accessibilità, SEO, sicurezza, performance).

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Analisi lampo | punteggio + 3 problemi principali (automatica, per i lead freddi) |
| Analisi completa | 2–3 pagine con confronto con i concorrenti locali (per gli appuntamenti fissati) |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Gratuita. Obiettivo interno: produrla in meno di 15 minuti di lavoro umano. Il valore si misura in appuntamenti e clienti acquisiti.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S18_reporting.md -->
### SCHEDA SERVIZIO — Reporting e dashboard cliente (trasversale)
**Codice:** S18 · **Stato:** IN COSTRUZIONE (BigAnt OS) · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Il cliente non vede cosa fa l'agenzia e quanto rende: è il primo motivo per cui se ne va.

#### 2. Cosa include
Dashboard cliente sempre aggiornata · report mensile scritto in parole semplici · prossimi passi · "chiedi all'agenzia".

#### 3. Pacchetti
Incluso in tutti i canoni.
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Collegamento delle fonti dati del cliente (OAuth).

#### 5. Flusso di lavoro
1. Dati automatici dalle API → dashboard
2. Il primo giorno lavorativo del mese: report (agente reporter) → controllo del socio → pubblicazione nell'area clienti
3. Una call trimestrale per i clienti di livello alto

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Report consegnati in tempo · accessi del cliente alla dashboard · rinnovi · clienti persi.

#### 8. Strumenti e integrazioni
BigAnt OS · API di Google e Meta (vedi ACCESSI-API-BIGANT-OS.md).

#### 9. Rischi e compliance
Mai dati simulati presentati come veri · ogni cliente vede solo i suoi dati.

#### 10. Servizi collegati (upsell)
—

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
L'Area Clienti Italiaonline mostra visite al sito, spesa, visualizzazioni e clic delle campagne in tempo reale, con report periodici dell'account. BigAnt ha già una piattaforma propria (ped.bigantagency.it) da far evolvere in BigAnt OS.

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Incluso | dashboard + report mensile per tutti i clienti a canone |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Incluso nei canoni. È un argomento di vendita, non una voce di prezzo.
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


<!-- FILE: docs/playbook/S19_offline-partner.md -->
### SCHEDA SERVIZIO — Pubblicità offline tramite partner (DOOH, insegne, TV/cinema)
**Codice:** S19 · **Stato:** SU RICHIESTA · **Ultimo aggiornamento:** 08/10/2026 (bozza, da validare con i soci)
> Fa parte del Playbook BigAnt. Gli agenti eseguono questa scheda: se la scheda cambia, cambia il lavoro degli agenti. I campi [DA DEFINIRE] e [DA MISURARE] li compilano i soci.

#### 1. Che problema risolve al cliente
Clienti che vogliono visibilità fisica sul territorio.

#### 2. Cosa include
Pianificazione e creatività, con l'acquisto degli spazi tramite partner (per esempio il cliente Vision Graphic per DOOH e insegne).

#### 3. Pacchetti
A progetto, con commissione o ricarico [DA DEFINIRE].
- **Prezzi:** proposta nella sezione 14, [DA VALIDARE]
- **Tempo interno stimato al mese per cliente:** [DA MISURARE nei primi 3 mesi]

#### 4. Cosa serve dal cliente
Budget, zona, periodo.

#### 5. Flusso di lavoro
1. Proposta e preventivo del partner → ok del cliente → creatività (Alfonso/Raffaele) → messa in onda → report del partner

#### 6. Cancelli di approvazione
Nulla viene pubblicato, speso o inviato al cliente senza l'ok di un socio (BigAnt) o del cliente (dove previsto), registrato con nome e data.

#### 7. KPI (si vedono nella dashboard cliente)
Copertura dichiarata dal partner · contatti nel periodo della campagna.

#### 8. Strumenti e integrazioni
Partner esterni.

#### 9. Rischi e compliance
Margini e responsabilità contrattuali tra cliente, BigAnt e partner.

#### 10. Servizi collegati (upsell)
Video · branding.

#### 12. Benchmark Italiaonline (rilevato su italiaonline.it l'08/10/2026)
"Pubblicità TV e Cinema": Sky (anche Sky Adsmart locale e banner Sky Lanner), sale cinematografiche geolocalizzate, spot da 15–30s in TV e da 6–35s al cinema, produzione dello spot. Prezzi indicativi: TV locale da poche centinaia di euro, cinema da alcune centinaia. "Display su network Italiaonline": banner su Virgilio, Libero, PagineGialle e verticali (non replicabile: l'alternativa è il programmatic).

#### 13. Struttura dei pacchetti BigAnt (proposta)
| Pacchetto | Cosa comprende |
|---|---|
| Offline | DOOH e insegne (partner, es. Vision Graphic) · cinema locale · TV locale |
| Display | campagne display e programmatic come alternativa al network Italiaonline |

#### 14. Prezzi proposti — DA VALIDARE CON I SOCI
Commissione del 10–15% sull'acquisto degli spazi, oppure ricarico concordato + produzione dello spot (S02).
> Fasce ricavate da fonti di mercato (in gran parte non italiane) e dai canoni attuali di BigAnt (200–600 €/mese). Prima di usarle: calcolare il costo interno (ore × costo orario + strumenti + collaboratori) e verificare il margine. Le due ditte sono in regime forfettario e non applicano l'IVA: verificare con il commercialista diciture e marca da bollo in fattura.

#### 15. Log modifiche alla scheda
- 08/10/2026: prima bozza.
- 08/10/2026: aggiunti benchmark Italiaonline, struttura dei pacchetti e prezzi proposti.


---

# PARTE 3 — ACCESSI API (stato e requisiti; da salvare in docs/INTEGRAZIONI-ACCESSI.md)
### ACCESSI API PER BIGANT OS — cosa richiedere e in che ordine
**Preparato:** 08/10/2026 · **Per:** Raffaele e Alfonso
> Gli agenti e le dashboard di BigAnt OS leggono i dati dei clienti da Google e Meta tramite API. Alcuni accessi vanno **approvati** da Google o Meta e richiedono da qualche giorno a qualche settimana. Se li chiedi adesso, quando Codex ne avrà bisogno saranno già pronti.
> I requisiti cambiano spesso: prima di inviare ogni richiesta, controlla la pagina ufficiale linkata.

---

#### DECISIONE PRELIMINARE: quale account usare
Tutte le richieste devono partire dallo **stesso account aziendale**, non da quelli personali, perché resterà il "proprietario" tecnico di BigAnt OS.
- **Consigliato:** un account Google Workspace dell'agenzia (per esempio una casella tecnica dedicata sul dominio dell'agenzia). Workspace serve anche per avere una "Organization" su Google Cloud, che la richiesta GBP chiede.
- **Alternativa:** l'account Gmail personale già usato da Codex funziona per partire, ma un Gmail personale non ha una Organization e lega tutto a una persona.
- **Da decidere tra i soci:** [DA DECIDERE]

---

#### ORDINE CONSIGLIATO (dal più lento al più veloce)

| # | Accesso | Serve per | Tempi di approvazione | Difficoltà |
|---|---|---|---|---|
| 1 | **Verifica aziendale Meta** | Prerequisito per leggere gli account pubblicitari dei clienti | Giorni o settimane | Media: servono documenti di una delle due ditte |
| 2 | **Google Business Profile API** | Schede Google dei clienti: dati, post, recensioni | Da qualche giorno a qualche settimana; le richieste vengono spesso rifiutate se sono vaghe | Media |
| 3 | **Google Ads API: developer token "Basic"** | Spesa e risultati delle campagne Google Ads | Di solito qualche giorno | Bassa |
| 4 | **Meta Marketing API: ads_read in Advanced Access** | Spesa e risultati di Facebook e Instagram Ads dei clienti | Dopo la verifica aziendale; serve un video dimostrativo | Alta: conviene farlo quando la dashboard esiste |
| 5 | **Google Analytics 4 + Search Console API** | Visite al sito, conversioni, posizioni su Google | Nessuna approvazione per uso interno | Bassa |
| — | LinkedIn, TikTok | Statistiche social avanzate | Approvazioni lunghe e selettive | **Rimandare**: per partire basta lo strumento di programmazione social |

---

#### 1. Verifica aziendale Meta (Business Verification)
**Dove:** Meta Business Suite → Impostazioni → Centro sicurezza → Verifica dell'azienda
**Cosa serve:**
- una delle due ditte, consigliata quella che gestisce di più l'ADV (probabilmente La Manna Agency) [DA DECIDERE];
- documento con ragione sociale e P.IVA (visura o certificato di attribuzione P.IVA);
- un indirizzo e un telefono che coincidano con i documenti;
- un dominio verificato (bigantagency.it) oppure un'email su quel dominio.

**Attenzione:** BigAnt è un marchio e non una società. La verifica va fatta a nome di **una** ditta reale, con i suoi dati esatti: nomi diversi tra documento e Business Manager sono la causa più comune di rifiuto.

#### 2. Google Business Profile API
**Prerequisiti:**
- un progetto Google Cloud, con il suo numero (Project Number);
- un'email che sia **proprietaria o gestore** di una scheda Google;
- scheda completa e aggiornata, con il sito web. Alcune guide parlano anche di scheda verificata e attiva da più di 60 giorni: va verificato sulla pagina ufficiale.

**Come:**
1. Crea il progetto su Google Cloud e annota il Project Number.
2. Compila il modulo di contatto GBP API e scegli **"Application for Basic API Access"**.
3. Finché non arriva l'approvazione, le chiamate falliscono (quota a zero). È normale.

**Testo pronto per la richiesta** (in inglese, perché il modulo è in inglese):
> We are BigAnt Agency, a digital marketing agency in Caserta, Italy, managing the Google Business Profiles of about 15 local small businesses (healthcare clinics, restaurants, nautical and industrial companies), with the owners' explicit authorization. We are building an internal management tool used only by our agency and our clients. We need the Business Profile APIs to: (1) read profile information and performance metrics (views, calls, direction requests) to show them in each client's private dashboard; (2) read reviews and post owner replies that are approved by a human before publishing; (3) publish local posts prepared by our team after client approval. We do not sell API access, do not create or claim profiles in bulk, and do not post content without human approval. Contact: [EMAIL] — Website: https://bigantagency.it

#### 3. Google Ads API: developer token "Basic"
**Prerequisiti:**
- un **account amministratore (MCC)** Google Ads dell'agenzia, a cui collegare tutti gli account clienti attivi;
- un'email di contatto API aggiornata e controllata regolarmente.

**Come:**
1. Accedi all'MCC e apri il Centro API (`ads.google.com/aw/apicenter`).
2. Ottieni il token, che parte con un accesso di test o "Explorer".
3. Clicca **Apply for Basic Access** e compila il modulo.
4. Google valuta anche la verifica del brand del progetto Cloud: farla accelera la risposta.

**Descrizione d'uso pronta:**
> Internal reporting and campaign management tool for BigAnt Agency (Italy). It is used only by our agency staff to manage the Google Ads accounts of our own clients, all linked to our manager account. Features: performance reporting (spend, conversions, cost per lead) shown in a private client dashboard; budget and keyword recommendations reviewed and applied by a human. No external users, and no resale of API access.

#### 4. Meta Marketing API: ads_read in Advanced Access
**Quando:** dopo la verifica aziendale (punto 1), e quando BigAnt OS ha una schermata che mostra dati veri. Meta chiede un **video** che mostra il login con Facebook, il consenso e i dati delle campagne.

**Cosa richiedere:**
- **solo `ads_read`**, perché ci serve leggere i risultati;
- **non `ads_management`**: chiedere più del necessario è una causa frequente di rifiuto.

L'approvazione vale solo per quell'app: se in futuro se ne crea un'altra, si riparte da zero.

**Da fare oggi:**
- creare l'app su developers.facebook.com, collegata al Business Manager verificato;
- preparare un account pubblicitario reale con dati da mostrare (quello di BigAnt).

#### 5. Google Analytics 4 e Search Console
Non serve un'approvazione per uso interno, ma c'è un dettaglio importante:
- finché la schermata di consenso OAuth del progetto Google Cloud è in modalità **"Testing"**, gli accessi **scadono ogni 7 giorni** e le dashboard smettono di aggiornarsi;
- la soluzione è **pubblicarla in "Production"**. Per i dati di Analytics e Search Console Google può chiedere una verifica: senza verifica, chi collega il proprio account vede l'avviso "app non verificata".

**Da dire a Codex:** usare la modalità Production fin da subito e chiedere solo gli scope in sola lettura.

---

#### CHECKLIST DI OGGI
- [ ] Decidere quale account Google e quale ditta usare
- [ ] Avviare la verifica aziendale Meta
- [ ] Creare il progetto Google Cloud e annotare il Project Number
- [ ] Inviare la richiesta GBP API (testo pronto sopra)
- [ ] Controllare che esista l'MCC Google Ads con tutti i clienti collegati, poi richiedere l'accesso Basic
- [ ] Creare l'app Meta (la review ads_read si fa più avanti)
- [ ] Segnare qui le date di invio e di risposta

| Richiesta | Inviata il | Esito | Note |
|---|---|---|---|
| Verifica aziendale Meta | | | |
| GBP API Basic Access | | | |
| Google Ads API Basic | | | |
| Meta ads_read Advanced | | | |

#### FONTI
- Google Business Profile, prerequisiti: https://developers.google.com/my-business/content/prereqs
- Guida GBP API 2026 (terza parte): https://slashpost.ai/blogs/google-business-profile/google-business-profile-api-documentation-2026
- Google Ads API, livelli di accesso: https://developers.google.com/google-ads/api/docs/access-levels
- Google Ads API, developer token: https://developers.google.com/google-ads/api/docs/first-call/dev-token
- Meta Marketing API, accesso: https://developers.facebook.com/docs/marketing-api/access
- Google OAuth, verifica degli scope sensibili: https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification
