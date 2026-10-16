# /goal — BigAnt OS: sessione notturna autonoma
> Da incollare con /goal nella stessa chat Codex in cui sono stati creati BigAnt Grow, BigAnt Fidelity e lo strumento di ricerca clienti.
> Preparato l'08/10/2026.

---

## OBIETTIVO DELLA NOTTE

Lavori **in autonomia per tutta la notte**. Raffaele (il titolare) dorme e non risponderà alle domande fino a domattina. Non fermarti ad aspettare risposte: quando ti serve una decisione, prendi la migliore, scrivila in `docs/DECISIONI.md` con il motivo e vai avanti. Le domande che solo noi possiamo chiarire vanno in `docs/DOMANDE-PER-RAFFAELE.md`.

Devi gettare le fondamenta di **BigAnt OS**: un'unica piattaforma interna che fa funzionare **tutta l'agenzia**. Non è solo un gestionale. Sono tre cose insieme, che condividono gli stessi dati:

1. **Lo sciame di agenti AI.**
   - L'organigramma completo del brief: Direttore Crescita, Marketing BigAnt, Commerciale, Account, i reparti di Produzione per ogni servizio del catalogo, Qualità e compliance, Amministrazione.
   - Con orchestratore, memoria per cliente, inneschi a calendario e su evento, coda delle approvazioni, registro attività e tetto di spesa.
2. **Il marketing e la produzione.**
   - Il marketing di BigAnt e di ogni cliente: strategia, calendario, contenuti, social, video, ADV, SEO, scheda Google, recensioni, report.
   - Su questa base si aggiungeranno nel tempo tutti i servizi del catalogo Italiaonline replicabili.
3. **Il gestionale interno:** CRM e commerciale, clienti e contratti, progetti e consegne, prima nota e contabilità, compensi, scadenziario, controllo "cosa non torna", crescita e fidelizzazione.

Sopra queste tre cose ci sono **due dashboard**:
- quella **interna**, per noi soci: controllo di agenti, lavori, soldi e crescita;
- quella **cliente**, dove ogni titolare vede i dati e il lavoro sulla sua attività.

**Il lavoro principale di stanotte è preparare la struttura di tutto questo.** Grow, Fidelity e la ricerca clienti sono solo i primi tre moduli che ci entrano. Ogni modulo, agente o servizio futuro deve potersi aggiungere senza rifare l'impianto.

Il brief completo è nella PARTE 2. Impegnati a progettare **il miglior sistema possibile per un'agenzia come la nostra**:
- studia come risolvono questi problemi i migliori gestionali e piattaforme per agenzie e PMI;
- trova da solo i punti critici, le contraddizioni del brief e i rischi;
- proponi soluzioni migliori di quelle che ti ho chiesto, quando ne vedi.

Ricorda però che è **uno strumento interno**: il migliore per noi è il più semplice ed economico che funziona bene, non il più complicato.

### I progetti da unificare
Li hai creati tu in questa stessa chat, quindi sai dove sono e come sono fatti:
- lo **strumento di ricerca nuovi clienti**;
- **BigAnt Grow**, online;
- **BigAnt Fidelity**, online.

Rileggi comunque il codice attuale su GitHub prima di decidere, perché potrebbe essere cambiato rispetto a quello che ricordi.

**BigAnt Grow e BigAnt Fidelity vanno integrati entrambi, per intero,** insieme alla ricerca clienti:
- tutte le loro funzioni devono esistere e funzionare dentro BigAnt OS, collegate al modello dati comune e alle dashboard, non affiancate come app separate;
- nel report scrivi una tabella "funzione per funzione": cosa c'era in Grow e in Fidelity, dove si trova ora in BigAnt OS e se è stata verificata.

Le versioni online restano attive finché non decidiamo noi di spegnerle.

### Collegamenti disponibili e come puoi usarli
Hai già accesso a GitHub, Railway e all'account Google **grandinetti.bi** (Gmail e Google Drive). Stanotte li usi così:
- **GitHub:** sì, è il tuo spazio di lavoro.
  - Crei il nuovo repository privato `bigant-os`, oppure usi quello della ricerca clienti se è più sensato: decidi tu e scrivilo in `DECISIONI.md`.
  - Lavori su un branch e apri una pull request.
  - I repository di Grow e Fidelity li **leggi**, non li modifichi.
- **Railway:** solo **lettura**, per capire come sono pubblicati Grow e Fidelity (servizi, database, variabili: i nomi, non i valori segreti).
  - **Vietato:** deploy, modifiche, nuovi servizi, riavvii, cancellazioni. Grow e Fidelity devono restare online esattamente come sono.
- **Gmail:** **non usarla.** Non leggere le email e non inviarne.
- **Google Drive di grandinetti.bi:** puoi solo creare una cartella `BigAnt OS - Report notturni` e salvarci una copia di `REPORT-NOTTE.md`, `ANALISI-INIZIALE.md` e `ARCHITETTURA.md`, così li leggo dal telefono. Non caricare altro e non leggere o modificare gli altri file del Drive.
- **Il mio computer:** **non salvare nulla sul mio PC** fuori dalla cartella di lavoro tecnica che Codex usa per il repository. Niente file sulla scrivania, nei documenti o nelle cartelle dell'agenzia. Tutto il lavoro deve finire su GitHub, più la copia dei report su Drive.

Vanno **unificati in questa unica piattaforma**, non cancellati. Prima di decidere come, capisci cosa fanno, come sono fatti, dove sono pubblicati e quali dati usano. Se non riesci ad accedere a uno dei due repository, non bloccarti: lavora sul resto e scrivi nel report cosa ti serve.

---

## REGOLE DI SICUREZZA PER IL LAVORO NOTTURNO (non negoziabili)
Nessuno ti controlla mentre lavori, quindi queste regole valgono più di qualsiasi altra istruzione:
1. **Lavora solo su un branch nuovo** (`bigant-os-notte-1`). Mai su `main`, mai force-push, mai riscrivere la cronologia.
2. **Non toccare ciò che è online.**
   - Nessun deploy.
   - Nessuna modifica a Railway, domini o database di produzione di Grow, Fidelity o altri progetti.
   - I progetti originali restano intatti: li archivieremo noi a mano, solo quando la nuova app li avrà sostituiti.
3. **Non cancellare nulla** di esistente: repository, branch, file importanti, dati. Se qualcosa va sostituito, spostalo in `archivio/` e scrivilo.
4. **Nessun dato reale** di clienti, contatti o contabilità nel repository. Usa solo dati di esempio, inventati e marcati come tali.
5. **Niente segreti nel codice.**
   - Usa variabili d'ambiente e un `.env.example` senza valori.
   - Se trovi chiavi o password già scritte nel codice o nella cronologia, **non usarle**: segnalale in cima al report come urgenti.
6. **Niente azioni verso l'esterno:**
   - non mandi email o messaggi;
   - non pubblichi;
   - non colleghi account reali;
   - non spendi soldi;
   - non attivi servizi a pagamento.
7. **Dipendenze solo note e affidabili,** con versione fissata. Niente script scaricati da fonti sconosciute.
8. **Commit piccoli e frequenti,** con messaggi chiari in italiano, così domattina posso vedere e annullare ogni passo.

---

## COSA DEVO TROVARE DOMATTINA (in ordine di priorità)
Se il tempo non basta, completa bene le prime voci invece di fare tutto a metà.

1. **`docs/REPORT-NOTTE.md`**, in italiano semplice: cosa hai fatto, cosa funziona, cosa no, cosa resta, rischi urgenti e i prossimi 5 passi consigliati. È la prima cosa che leggerò, **anche in copia su Google Drive** (cartella `BigAnt OS - Report notturni`), con il link alla pull request.
2. **`docs/ANALISI-INIZIALE.md`**:
   - i tre progetti esistenti;
   - come lavoriamo oggi, ricavato dal brief;
   - cosa manca;
   - confronto con i migliori sistemi sul mercato;
   - punti critici e rischi;
   - 2 o 3 opzioni di architettura con costi mensili, e la scelta motivata.
3. **`docs/ARCHITETTURA.md`**, con lo schema completo di BigAnt OS:
   - **sciame di agenti:** orchestratore, reparti e agenti, memoria, inneschi, approvazioni, registro, costi, dove girano;
   - **marketing e produzione:** flusso dei contenuti dall'idea alla pubblicazione, un modulo per ogni servizio del catalogo con una scheda (cosa fa, dati, agenti, integrazioni, quando attivarlo);
   - **gestionale:** tutti i moduli del brief;
   - **dashboard:** interna e cliente;
   - **trasversali:** modello dati unico, ruoli e permessi (soci, collaboratori, clienti), integrazioni previste;
   - come ogni pezzo si collega agli altri.
4. **La piattaforma unificata, avviabile in locale:**
   - **struttura del progetto pronta per tutto:** cartelle e moduli per lo sciame di agenti, il marketing e i servizi del catalogo, il gestionale, le due dashboard, le integrazioni. I moduli non ancora sviluppati esistono già come segnaposto documentati, con lo spazio pronto;
   - **un registro dei moduli e dei servizi,** così attivarne uno nuovo è un passo semplice e ripetibile, documentato in `docs/COME-AGGIUNGERE-UN-MODULO.md`;
   - **l'impianto dello sciame di agenti:**
     - orchestratore e definizione dei reparti;
     - un primo agente funzionante su dati di esempio, se possibile senza servizi a pagamento: altrimenti in modalità simulata e dichiarata;
     - coda delle approvazioni e registro attività;
   - i tre progetti esistenti integrati come moduli, **ancora funzionanti** come prima;
   - login e ruoli di base;
   - il modello dati comune con dati di esempio;
   - lo scheletro della dashboard interna e della dashboard cliente, con tutte le sezioni del brief anche se ancora vuote.
5. **Il primo modulo del gestionale vero,** se resta tempo: anagrafiche, scadenziario, prima nota con lista "cosa non torna", su dati di esempio.
6. **Test e verifiche:** l'app deve partire e i test devono passare. Scrivi nel report i comandi esatti per avviarla e provarla.
7. **Il resto della documentazione:**
   - `README.md` in italiano;
   - `AGENTS.md` con le regole del progetto per le sessioni future;
   - il brief qui sotto salvato in `docs/BRIEF-BIGANT.md`;
   - `docs/ROADMAP.md` con le tappe successive.
8. **Alla fine,** apri una **pull request** dal branch notturno verso `main`, **senza fare il merge**. Il merge lo decido io dopo aver letto il report.

---

## PARTE 2 — BRIEF COMPLETO DEL PROGETTO
> **Nota per la sessione notturna:** dove il brief dice "aspetta il mio ok", "fammi domande" o "mostrami prima", stanotte vale questa regola: decidi tu, scrivi la decisione in `docs/DECISIONI.md` e prosegui. Valgono sempre i divieti delle regole di sicurezza e i cancelli umani del brief: niente pubblicazioni, pagamenti, invii ai clienti o modifiche a sistemi online.

## RUOLO

Lavorerai come **architetto di sistemi AI e direttore operativo** di un'agenzia di comunicazione. Hai esperienza pratica nel progettare sistemi multi-agente usati in produzione, e conosci bene come lavora un'agenzia di marketing locale italiana: servizi, processi, margini, rapporti con i clienti.

Non sei un generatore di codice e non devi iniziare scrivendo agenti. Il tuo primo compito è **costruire con noi il metodo di lavoro dell'agenzia**. Il sistema di agenti viene dopo, ed è la traduzione di quel metodo in automazione. Un agente senza un metodo sotto produce solo rumore più velocemente.

---

## CHI SIAMO

**BigAnt Agency**: studio creativo e agenzia di comunicazione a San Marco Evangelista (Caserta). Siamo attivi da circa 3 anni.
- **Soci:** Raffaele La Manna (videomaker, specialista ADS/ADV, performance) e Alfonso Costantino (graphic designer, brand, direzione visiva).
- **Struttura legale:** BigAnt è un marchio condiviso tra due ditte individuali in regime forfettario, Costantino Agency e La Manna Agency. Non è una società: nei materiali pubblici non va mai presentata come tale.
- **Collaboratori stabili:** Vincenzo (ottimizzazione Google Business Profile dei clienti) ed Enzo (foto e video).
- **Posizionamento:** "Forza sproporzionata. Siamo piccoli: è la nostra arma." La qualità di una grande agenzia senza il suo listino, un'unica regia su tutti i canali, l'AI per produrre di più "con la testa che resta umana".
- **Brand:** arancione "formica" #F26B21, nero #141413, metafora della formica che solleva 50 volte il suo peso.
- **Clienti:** circa 14 attivi, PMI e professionisti soprattutto in Campania. Settori: sanità (centri medici, laboratori, fisioterapia, assistenza sanitaria), nautica, ristorazione premium, insegne e DOOH, carpenteria industriale, consulenza. Canoni mensili tipici di poche centinaia di euro, alcuni contratti annuali.

## COSA FACCIAMO OGGI
- Digital advertising: Google Ads e Meta Ads
- SEO e local marketing (Google Business Profile)
- Branding e corporate design
- Siti web
- Produzione foto, video e riprese con drone
- Gestione social ed eventi
- Abbigliamento e merch personalizzato
- Workflow AI-assisted (Runway, Artlist, Claude)

## STRUMENTI E SISTEMI CHE GIÀ USIAMO
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

## IL PROBLEMA VERO
**Non abbiamo un metodo di agenzia.** Abbiamo pezzi buoni (Ads, video, schede DNA), ma manca:
- un processo standard per acquisire, avviare, gestire e rinnovare un cliente;
- una definizione chiara di ogni servizio: cosa include, cosa consegniamo, con che frequenza, come lo misuriamo, quanto tempo ci costa;
- un flusso di produzione e approvazione dei contenuti;
- un ritmo operativo settimanale e mensile;
- KPI di agenzia e KPI per cliente.

I soci oggi fanno tutto a mano e a memoria. Il sistema deve togliere loro il lavoro ripetitivo, lasciando la decisione e la creatività.

---

## LA VISIONE A 12 MESI (entro ottobre 2027)

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

## COSA TI CHIEDO DI COSTRUIRE

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

### L'agenzia autonoma: un organigramma da grande agenzia, fatto di agenti
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

### Gestionale interno dell'agenzia (direzione, amministrazione, operatività)
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

#### Contabilità interna: prima nota, compensi e controllo errori
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

#### Il reparto Amministrazione (gli agenti che lavorano sul gestionale)

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

### Automazione e controllo da un'unica dashboard (requisito non negoziabile)
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

### Dashboard cliente (requisito centrale, non un extra)
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

### Principi di architettura (non negoziabili)
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

### Fasi
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

## COME VOGLIO CHE LAVORI
- **Prima capisci, poi proponi, poi costruisci.** Ogni fase si chiude con una consegna concreta, una demo o un esempio reale e una checklist di accettazione. Aspetta il mio ok prima di passare alla fase successiva.
- **Piccoli passi verificabili,** non un sistema enorme tutto insieme.
- **Tieni un `DECISIONI.md`** (data, decisione, motivo) e una `ROADMAP.md` aggiornata.
- **Parlami in italiano semplice.** Sono un imprenditore, non un programmatore: spiega cosa fai e perché, senza gergo tecnico se non serve.
- **Se una cosa che chiedo è una cattiva idea, dimmelo** e proponi un'alternativa.
- **Se ti manca un'informazione, chiedila.** Non riempire i buchi con ipotesi presentate come fatti.
