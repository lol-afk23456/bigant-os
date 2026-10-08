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
