# Giro dello sciame 167079fc

- Richiesta: Giro completo di oggi: le 3 priorità della settimana dai KPI, il piano marketing di BigAnt della prossima settimana con le bozze dei post, l’analisi gratuita di un’azienda DEMO con la proposta del pacchetto Presenza, il piano social S01 e la scheda Google con le recensioni di Bottega Aurora DEMO, il controllo della prima nota. Poi pubblica tutto e manda la proposta al cliente.
- Motore: **Claude Code (sottoagenti .claude/agents, sessione cloud)**
- Stato: completato · inizio 2026-10-08T13:17:44.830Z · fine 2026-10-08T13:27:33.862Z
- Costo dichiarato dal motore: 2.7962 USD (equivalente a listino)
- Flussi eseguiti: amministrazione, crescita, marketing, commerciale, social, local

I dati di input sono DEMO inventati. Pubblicazioni, invii e modifiche di account sono rimasti bloccati dal codice (elenco in fondo).

## 1. Orchestratore · regia

Compito: Leggi la richiesta dei soci, scegli i flussi da avviare e scrivi il brief per ciascun reparto.

Stato: Completato · motore claude-code · durata 25 s · costo 0.0515 USD

```json
{
 "sintesi": "Avvio sei flussi, in quest'ordine: amministrazione, crescita, marketing, commerciale, social e local. Amministrazione precede crescita perché il Direttore Crescita legge KPI aggiornati. Restano esclusi la pubblicazione di tutto e l'invio della proposta al cliente: sono azioni esterne riservate ai soci.",
 "piano": [
  {
   "flusso": "amministrazione",
   "motivo": "La richiesta chiede il controllo della prima nota; pacchetto.flussi_disponibili[amministrazione] produce prima nota DEMO e lista 'cosa non torna'. Va prima di crescita per i KPI economici aggiornati.",
   "brief": "Cliente: BigAnt · cliente zero DEMO. Obiettivo: aggiorna la prima nota DEMO e produci la lista 'cosa non torna' per il periodo 2026-10-01 → 2026-10-08. Proponi verifiche e rettifiche per ogni anomalia, senza correzioni automatiche. Il risultato resta visibile solo ai soci; rendi disponibili al Direttore Crescita solo KPI aggregati, mai importi grezzi. Il prodotto passa da Qualità prima della coda approvazioni. Consegna in bozza: decide un socio."
  },
  {
   "flusso": "crescita",
   "motivo": "La richiesta chiede le 3 priorità della settimana dai KPI; il flusso crescita legge KPI aggregati e propone tre priorità (pacchetto.flussi_disponibili[crescita]).",
   "brief": "Cliente: BigAnt · cliente zero DEMO. Leggi solo i KPI aggregati autorizzati, mai importi grezzi, e proponi al massimo 3 priorità per la settimana 2026-10-05 → 2026-10-11. Per ogni priorità indica il KPI di riferimento e il reparto coinvolto. Solo dati DEMO. Il prodotto passa da Qualità prima della coda approvazioni. Consegna in bozza: decide un socio."
  },
  {
   "flusso": "marketing",
   "motivo": "La richiesta chiede il piano marketing BigAnt della prossima settimana con le bozze dei post; pacchetto.flussi_disponibili[marketing] copre piano editoriale e bozze per i canali BigAnt.",
   "brief": "Cliente: BigAnt · cliente zero DEMO. Prepara il piano editoriale e le bozze dei post per i canali BigAnt nel periodo 2026-10-12 → 2026-10-18. Non includere dati economici. Non promettere risultati garantiti e non usare superlativi. Non programmare né pubblicare nulla. Il prodotto passa da Qualità prima della coda approvazioni. Consegna in bozza: decide un socio."
  },
  {
   "flusso": "commerciale",
   "motivo": "La richiesta chiede l'analisi gratuita di un'azienda DEMO con la proposta del pacchetto Presenza; pacchetto.flussi_disponibili[commerciale] copre ricerca clienti DEMO, analisi S17 e bozza di proposta.",
   "brief": "Cliente: BigAnt · cliente zero DEMO. Esegui la ricerca di lead DEMO, scegli un lead e produci l'analisi gratuita S17 della sua presenza online. Chiudi con la bozza di proposta del pacchetto Presenza, riferita alla data 2026-10-08. Usa solo dati DEMO e non contattare il lead. Non inserire prezzi non presenti nel pacchetto e non promettere risultati garantiti. Il prodotto passa da Qualità prima della coda approvazioni. Consegna in bozza: decide un socio, che valuta l'eventuale invio."
  },
  {
   "flusso": "social",
   "motivo": "La richiesta chiede il piano social S01 di Bottega Aurora DEMO; pacchetto.clienti[demo-bottega].servizi include social e il flusso social produce piano mensile e post.",
   "brief": "Cliente: Bottega Aurora DEMO. Prepara pilastri, piano mensile e post S01 per il periodo provvisorio 2026-11-01 → 2026-11-30, in attesa di conferma del mese. Rispetta DNA e feedback cliente del pacchetto. Non inserire dati economici e non programmare né pubblicare. Il prodotto passa da Qualità prima della coda approvazioni. Consegna in bozza: decide un socio, poi il cliente."
  },
  {
   "flusso": "local",
   "motivo": "La richiesta chiede la scheda Google con le recensioni di Bottega Aurora DEMO; pacchetto.clienti[demo-bottega].servizi include local e il flusso local copre S06 e S08.",
   "brief": "Cliente: Bottega Aurora DEMO. Controlla la scheda Google (S06) con i dati disponibili alla data 2026-10-08. Prepara bozze di post GBP e di risposta alle recensioni (S08). Non modificare la scheda, non rispondere online, non inventare né incentivare recensioni. Evita promesse di risultato garantito, superlativi e dati clinici. Il prodotto passa da Qualità prima della coda approvazioni. Consegna in bozza: decide un socio."
  }
 ],
 "escluso": [
  {
   "richiesta": "pubblica tutto",
   "motivo": "Pubblicare è un'azione esterna riservata ai soci e bloccata dal codice (pacchetto.vincoli). Alternativa: i flussi consegnano bozze in coda approvazioni, dopo il controllo di Qualità."
  },
  {
   "richiesta": "manda la proposta al cliente",
   "motivo": "Inviare è un'azione esterna riservata ai soci e bloccata dal codice (pacchetto.vincoli). Alternativa: il flusso commerciale consegna la bozza di proposta e un socio decide se e come inviarla."
  }
 ],
 "da_verificare": [
  "[DA VERIFICARE] azienda DEMO da analizzare: la richiesta non la nomina; il flusso commerciale sceglie il lead dalla ricerca DEMO e un socio conferma la scelta.",
  "[DA VERIFICARE] periodo del piano social S01: la richiesta non indica il mese; il brief assume 2026-11-01 → 2026-11-30.",
  "[DA VERIFICARE] settimane di riferimento: il brief assume 2026-10-05 → 2026-10-11 per le priorità e 2026-10-12 → 2026-10-18 per il marketing (lunedì-domenica).",
  "[DA VERIFICARE] periodo della prima nota: la richiesta non lo indica; il brief assume il mese in corso fino a oggi, 2026-10-01 → 2026-10-08.",
  "[DA VERIFICARE] recensioni e dati della scheda Google di Bottega Aurora DEMO: il pacchetto non li contiene; il flusso local lavora solo su dati DEMO disponibili.",
  "[DA VERIFICARE] obiettivi numerici dei KPI: il pacchetto non riporta soglie o target per le priorità della settimana."
 ]
}
```

## 2. Direttore Crescita · crescita

Compito: Analizza i KPI aggregati e proponi ai soci esattamente 3 priorità per la settimana dal 2026-10-12 al 2026-10-18.

Stato: Completato · motore claude-code · durata 58 s · costo 0.1480 USD · esito Qualità: approvabile

```json
{
 "sintesi": "Settimana 2026-10-12 / 2026-10-18 (DEMO): la crescita passa dal valore dei clienti attuali, non dal loro numero. Tre mosse: scheda del pacchetto Presenza (S06 + S07 + S08), prima Analisi gratuita S17 con criterio di qualificazione, completamento dei KPI mancanti. Ogni decisione resta ai soci.",
 "priorita": [
  {
   "titolo": "Preparare la scheda del pacchetto Presenza per i clienti attuali",
   "motivo": "Servizi medi per cliente a 4,7 (DEMO) e S07 e S08 ancora DA ATTIVARE con priorità 1: il ricavo per cliente può crescere con il pacchetto Presenza (S06 + S07 + S08), come da roadmap Q4 2026. Il pacchetto Presenza punta ad aumentare il ricavo per cliente, da misurare appena il KPI è disponibile: ricavo_medio_per_cliente è [DA VERIFICARE].",
   "kpi_collegati": [
    "servizi_medi_per_cliente",
    "ricavo_medio_per_cliente"
   ],
   "azione": "Il Commerciale prepara la scheda del pacchetto Presenza (composizione S06 + S07 + S08) con tempi, criteri di misura e una short list di strumenti o partner da confrontare per S07 e S08. I soci scelgono i clienti candidati al pilota e validano il prezzo proposto.",
   "costo_stimato": "[DA VERIFICARE] canoni di strumenti o partner per S07 e S08 assenti dal pacchetto",
   "tempo_stimato": "Scheda pronta entro 2026-10-16; ore di lavoro [DA VERIFICARE]",
   "risultato_atteso": "Scheda Presenza completa e short list di strumenti o partner pronte per la decisione dei soci, con criteri di misura definiti: tempo, costo, margine, soddisfazione.",
   "decisione_richiesta": "Approvare la scheda Presenza e il prezzo proposto [DA VALIDARE], oppure indicare le correzioni entro 2026-10-16."
  },
  {
   "titolo": "Preparare la prima Analisi gratuita S17 e il criterio di qualificazione",
   "motivo": "Il funnel commerciale è fermo: new 2, qualified 0, contacted 0, meeting 0, proposal 0. Con 3 clienti attivi (DEMO) l'Analisi gratuita S17, in roadmap Q4 2026, alimenta il commerciale e apre la strada al pacchetto Presenza.",
   "kpi_collegati": [
    "clienti_attivi"
   ],
   "azione": "Il Commerciale redige il modello di Analisi S17 e il criterio di qualificazione per i 2 contatti in fase new, con verifica preventiva di consenso e Registro delle opposizioni [DA VERIFICARE] prima di ogni contatto. Nessun contatto parte in settimana. I soci rivedono il modello e il criterio.",
   "costo_stimato": "[DA VERIFICARE] ore di lavoro e strumenti per S17 assenti dal pacchetto",
   "tempo_stimato": "Modello e criterio pronti entro 2026-10-15; ore di lavoro [DA VERIFICARE]",
   "risultato_atteso": "Modello S17 e criterio di qualificazione pronti per l'approvazione dei soci, con la procedura di verifica del consenso descritta.",
   "decisione_richiesta": "Approvare modello S17 e criterio di qualificazione, oppure correggerli o rinviarli entro 2026-10-15."
  },
  {
   "titolo": "Completare i KPI mancanti con l'Amministrazione",
   "motivo": "Ricavo medio per cliente, clienti persi e ore risparmiate dagli agenti sono [DA VERIFICARE]: senza queste misure non si valuta né l'effetto del pacchetto Presenza né il carico dei soci.",
   "kpi_collegati": [
    "ricavo_medio_per_cliente",
    "clienti_persi",
    "ore_risparmiate_agenti"
   ],
   "azione": "L'Amministrazione indica per ciascun KPI cosa serve per renderlo disponibile in forma aggregata: canoni collegati, storico migrato, misura di base delle ore. Nessun dato contabile grezzo. I soci autorizzano il collegamento.",
   "costo_stimato": "[DA VERIFICARE] ore e costi per collegare canoni e storico assenti dal pacchetto",
   "tempo_stimato": "Elenco dei dati necessari entro 2026-10-14; ore di lavoro [DA VERIFICARE]",
   "risultato_atteso": "Elenco dei tre KPI con dato mancante, responsabile e passo di collegamento, pronto per la decisione dei soci.",
   "decisione_richiesta": "Approvare il piano di completamento dei tre KPI, oppure correggerlo o rinviarlo entro 2026-10-14."
  }
 ],
 "kpi_letti": [
  {
   "nome": "servizi_medi_per_cliente",
   "valore": "4,7",
   "fonte": "Servizi acquistati per cliente DEMO"
  },
  {
   "nome": "ricavo_medio_per_cliente",
   "valore": "[DA VERIFICARE]",
   "fonte": "Canoni reali non collegati"
  },
  {
   "nome": "clienti_attivi",
   "valore": "3",
   "fonte": "Anagrafica clienti DEMO"
  },
  {
   "nome": "clienti_persi",
   "valore": "[DA VERIFICARE]",
   "fonte": "Storico non migrato"
  },
  {
   "nome": "ore_risparmiate_agenti",
   "valore": "[DA VERIFICARE]",
   "fonte": "Nessuna misura di base"
  }
 ],
 "rischi": [
  "Il carico dei soci non è misurabile: le ore socio e la soglia di carico oltre cui delegare sono [DA VERIFICARE]. Contromisura: segnare le ore reali questa settimana e proporre ai soci la delega a un partner o a una persona se la soglia, una volta definita, viene superata.",
  "Dipendenza da un partner o strumento per S07 e S08: canoni assenti, scelta non confrontabile. Contromisura: confrontare almeno 3 opzioni prima di qualsiasi decisione, senza firmare nulla.",
  "Dati DEMO e KPI mancanti: l'effetto del pacchetto Presenza sul ricavo non è misurabile. Contromisura: completare i KPI prima di presentare stime ai clienti.",
  "Contatti in fase new senza consenso verificato: rischio di non conformità. Contromisura: nessun contatto prima della verifica di consenso e Registro delle opposizioni."
 ],
 "da_verificare": [
  "priorita[0].costo_stimato: canoni di strumenti o partner per S07 e S08 assenti",
  "priorita[0].tempo_stimato: ore di lavoro assenti",
  "priorita[0].decisione_richiesta: prezzo proposto del pacchetto Presenza [DA VALIDARE] dai soci",
  "priorita[1].costo_stimato: ore e strumenti per S17 assenti",
  "priorita[1].tempo_stimato: ore di lavoro assenti",
  "priorita[1].azione: verifica di consenso e Registro delle opposizioni per i contatti in fase new [DA VERIFICARE]",
  "priorita[2].costo_stimato: ore e costi di collegamento di canoni e storico assenti",
  "priorita[2].tempo_stimato: ore di lavoro assenti",
  "kpi.ricavo_medio_per_cliente: [DA VERIFICARE], canoni reali non collegati",
  "kpi.clienti_persi: [DA VERIFICARE], storico non migrato",
  "kpi.ore_risparmiate_agenti: [DA VERIFICARE], nessuna misura di base",
  "rischi: soglia di carico del socio oltre cui assumere una persona [DA VERIFICARE]",
  "rischi: soglia di costo per scegliere un partner, non calcolabile perché i canoni sono assenti [DA VERIFICARE]",
  "rischi: ore socio e soglia di carico oltre cui delegare [DA VERIFICARE]"
 ],
 "fonti_usate": [
  "pacchetto.kpi.servizi_medi_per_cliente",
  "pacchetto.kpi.ricavo_medio_per_cliente",
  "pacchetto.kpi.clienti_attivi",
  "pacchetto.kpi.clienti_persi",
  "pacchetto.kpi.ore_risparmiate_agenti",
  "pacchetto.funnel_commerciale.new",
  "pacchetto.funnel_commerciale.qualified",
  "pacchetto.funnel_commerciale.contacted",
  "pacchetto.funnel_commerciale.meeting",
  "pacchetto.funnel_commerciale.proposal",
  "pacchetto.stato_servizi",
  "pacchetto.roadmap_q4_2026",
  "pacchetto.priorita_precedenti",
  "pacchetto.feedback_soci",
  "pacchetto.vincoli"
 ]
}
```

## 3. Amministrazione · amministrazione

Compito: Spiega ai soci le anomalie “cosa non torna” della prima nota DEMO, con verifiche e correzioni solo proposte.

Stato: Completato · motore claude-code · durata 54 s · costo 0.1231 USD · esito Qualità: approvabile

```json
{
 "sintesi": "Il motore ha rilevato 8 anomalie sulla prima nota DEMO, nessuna critical e 3 con priorità high. Si parte dal possibile doppio movimento b4defea4-17d3-443a-be16-180dec2eae31, poi dal credito scaduto 331fd139-110c-45eb-b5ff-191863f8f65b e dal compenso non saldato e7b0ca4b-6c77-4d14-b71d-f2a6180b67c0. Ogni correzione è solo una proposta: decide un socio.",
 "anomalie": [
  {
   "anomalia_id": "b71984d9-7068-47fb-ae03-c7263cffd82a",
   "titolo": "Incasso in contanti senza fattura o ricevuta collegata",
   "importo": "150,00 €",
   "priorita": "medium",
   "spiegazione": "Il movimento 6eba4c2d-a10d-42aa-b381-25ca74e1b19c (DEMO) è un incasso in contanti del 2026-10-07 su Cassa A DEMO, ditta Ditta Creativa A DEMO, da Bottega Aurora DEMO, senza documento. Senza un documento non si dimostra a quale lavoro appartiene l'incasso. La controparte coincide con quella della fattura DEMO-001, ma il collegamento non è certo.",
   "verifica_proposta": "Controllare il registro di cassa di Cassa A DEMO per ottobre 2026 e cercare una ricevuta o una fattura per il lavoro una tantum di Bottega Aurora DEMO. Verificare se l'incasso riguarda DEMO-001 o un altro lavoro.",
   "correzione_proposta": "PROPOSTA: dopo la verifica, collegare il documento trovato al movimento 6eba4c2d-a10d-42aa-b381-25ca74e1b19c tramite registrazione di rettifica motivata, senza modificare il movimento originale. Se l'incasso risulta riferito a DEMO-001, valutare uno storno con data non precedente al 2026-10-07 e una nuova registrazione collegata alla fattura.",
   "chi_decide": "Il socio titolare di Ditta Creativa A DEMO [DA VERIFICARE: nome del socio]"
  },
  {
   "anomalia_id": "12ad23b9-3e2f-453e-a18c-c3b345765caa",
   "titolo": "Spesa software senza fattura o ricevuta collegata",
   "importo": "49,00 €",
   "priorita": "medium",
   "spiegazione": "Il movimento cae05091-d2c0-4223-a01a-9b300132a325 (DEMO) è un'uscita con carta del 2026-10-05 su Banca B DEMO, ditta Ditta Video B DEMO, verso Strumenti Alfa DEMO, categoria Software. Non ha alcun documento collegato. La spesa non è dimostrabile e non si può confermare che sia di competenza di questa ditta.",
   "verifica_proposta": "Confrontare l'estratto della carta di Banca B DEMO di ottobre 2026 con la fattura o la ricevuta di Strumenti Alfa DEMO. Verificare a quale ditta intestare l'abbonamento.",
   "correzione_proposta": "PROPOSTA: acquisire il documento e collegarlo al movimento cae05091-d2c0-4223-a01a-9b300132a325 con registrazione di rettifica motivata. Se la spesa risulta di un'altra ditta, stornarla con contromovimento non precedente al 2026-10-05 e registrarla correttamente.",
   "chi_decide": "Il socio titolare di Ditta Video B DEMO [DA VERIFICARE: nome del socio]"
  },
  {
   "anomalia_id": "b4defea4-17d3-443a-be16-180dec2eae31",
   "titolo": "Possibile doppio movimento: verificare documento e conto",
   "importo": "90,00 €",
   "priorita": "high",
   "spiegazione": "I movimenti 673a34fa-68cb-4e99-84cd-60f950246a70 e 30a94a85-bcd5-44bf-976f-50392a759d5e (DEMO) hanno stessa data 2026-10-04, ditta, conto, verso, importo, controparte (Collaboratore Delta DEMO) e documento (Notula DEMO-5). Se la notula è una sola, il pagamento è registrato due volte e la cassa di Ditta Video B DEMO risulta più bassa del dovuto.",
   "verifica_proposta": "Confrontare Notula DEMO-5 con l'estratto di Banca B DEMO di ottobre 2026 e contare gli addebiti verso Collaboratore Delta DEMO. Stabilire se i pagamenti reali sono uno o due.",
   "correzione_proposta": "PROPOSTA: se il pagamento è uno solo, stornare uno dei due movimenti con contromovimento motivato, documento di rettifica e data non precedente al 2026-10-04. Se i pagamenti sono due, collegare a ciascuno il proprio documento.",
   "chi_decide": "Il socio titolare di Ditta Video B DEMO [DA VERIFICARE: nome del socio]"
  },
  {
   "anomalia_id": "e58108ee-fa86-46c0-8bd5-eb2dea6c6d62",
   "titolo": "Pagamento abbonamento sopra il canone concordato",
   "importo": "5,00 €",
   "priorita": "medium",
   "spiegazione": "Il motore segnala un abbonamento pagato sopra il canone concordato. Nel pacchetto compaiono due uscite verso Strumenti Alfa DEMO: a70ea6cf-461a-465f-8862-917242ad44cf e cae05091-d2c0-4223-a01a-9b300132a325. Il canone concordato non è indicato, quindi il movimento interessato non è identificabile con certezza.",
   "verifica_proposta": "Recuperare l'accordo o il listino di Strumenti Alfa DEMO e confrontarlo con le ricevute e con gli addebiti carta di ottobre 2026 su Banca A DEMO e Banca B DEMO.",
   "correzione_proposta": "PROPOSTA: se l'eccedenza è confermata, richiedere al fornitore nota di credito o rimborso e registrare la rettifica con contromovimento motivato. Nessun movimento esistente va modificato.",
   "chi_decide": "Entrambi i soci: l'abbonamento compare su due ditte"
  },
  {
   "anomalia_id": "331fd139-110c-45eb-b5ff-191863f8f65b",
   "titolo": "Documento DEMO scaduto con residuo da incassare",
   "importo": "250,00 €",
   "priorita": "high",
   "spiegazione": "La fattura DEMO-001 di Bottega Aurora DEMO è scaduta il 2026-10-03 e ha un residuo da incassare. Lo stato nel pacchetto è draft (bozza), incoerente con una scadenza già trascorsa. Il credito pesa sulla liquidità di Ditta Creativa A DEMO.",
   "verifica_proposta": "Verificare se DEMO-001 è stata emessa e con quale data, e confrontare gli incassi su Banca A DEMO e Cassa A DEMO riferiti a Bottega Aurora DEMO nel periodo ottobre 2026.",
   "correzione_proposta": "PROPOSTA: preparare una bozza di sollecito a scaglioni (gentile, fermo, ultimo avviso), partendo dal tono gentile, con l'importo del residuo di 250,00 €, da sottoporre alla coda approvazioni. Nessun invio fino all'approvazione di un socio.",
   "chi_decide": "Il socio titolare di Ditta Creativa A DEMO [DA VERIFICARE: nome del socio]"
  },
  {
   "anomalia_id": "0b135b4d-289e-43e8-8d04-c6e5988471de",
   "titolo": "Incasso parziale oltre la scadenza",
   "importo": "250,00 €",
   "priorita": "medium",
   "spiegazione": "Su DEMO-001 risulta un incasso parziale dopo la scadenza del 2026-10-03: il movimento 73906dd8-7684-4073-a123-863ea48ee8cf del 2026-10-08 cita \"Bozza DEMO-001\" e non una fattura emessa. Il contante 6eba4c2d-a10d-42aa-b381-25ca74e1b19c, stessa controparte e senza documento, potrebbe riguardare la stessa fattura, ma non è certo. Finché il collegamento non è chiaro, il residuo non è affidabile.",
   "verifica_proposta": "Verificare sull'estratto di Banca A DEMO l'accredito di ottobre 2026 di Bottega Aurora DEMO e controllare se il contante del 2026-10-07 appartiene a DEMO-001.",
   "correzione_proposta": "PROPOSTA: dopo la verifica, collegare gli incassi a DEMO-001 con registrazione di rettifica motivata. Se un incasso è attribuito al documento sbagliato, stornarlo con contromovimento confermato da un socio e registrarlo correttamente.",
   "chi_decide": "Il socio titolare di Ditta Creativa A DEMO [DA VERIFICARE: nome del socio]"
  },
  {
   "anomalia_id": "e7b0ca4b-6c77-4d14-b71d-f2a6180b67c0",
   "titolo": "Compenso collaboratore non saldato alla scadenza",
   "importo": "180,00 €",
   "priorita": "high",
   "spiegazione": "La scadenza \"collaborator\" del 2026-10-06 risulta con residuo pari all'importo, quindi non saldata. I movimenti 673a34fa-68cb-4e99-84cd-60f950246a70 e 30a94a85-bcd5-44bf-976f-50392a759d5e pagano Collaboratore Delta DEMO con Notula DEMO-5, ma il legame con questa scadenza non è certo. Va chiarito se il compenso sia già pagato o ancora dovuto.",
   "verifica_proposta": "Confrontare Notula DEMO-5 con l'estratto di Banca B DEMO di ottobre 2026 e verificare quale ditta deve il compenso.",
   "correzione_proposta": "PROPOSTA: se il pagamento è già avvenuto, collegare i movimenti alla scadenza con registrazione motivata. Se è ancora dovuto, preparare il pagamento nella coda approvazioni, senza eseguirlo.",
   "chi_decide": "Il socio titolare di Ditta Video B DEMO [DA VERIFICARE: nome del socio] dopo il parere del commercialista"
  },
  {
   "anomalia_id": "f22eeaf3-bbed-4ed6-aa7d-da3d48ee39ae",
   "titolo": "Contratto scaduto o vicino al termine di preavviso",
   "importo": "350,00 €",
   "priorita": "medium",
   "spiegazione": "Il motore segnala un contratto scaduto o vicino al preavviso. Nel pacchetto non c'è alcun contratto: l'importo coincide con quello di DEMO-001, ma il collegamento non è certo. Senza contratto non si può dire quale termine sia in gioco.",
   "verifica_proposta": "Individuare il contratto o accordo con Bottega Aurora DEMO e controllarne data di scadenza e termine di preavviso.",
   "correzione_proposta": "PROPOSTA: dopo aver letto il contratto, i soci decidono se rinnovare, rinegoziare o dare disdetta nei termini. Preparare una bozza di comunicazione per la coda approvazioni, senza invio.",
   "chi_decide": "Il socio titolare di Ditta Creativa A DEMO [DA VERIFICARE: nome del socio]"
  }
 ],
 "cosa_non_torna_in_breve": [
  "b71984d9-7068-47fb-ae03-c7263cffd82a: incasso cash senza documento, 150,00 €",
  "12ad23b9-3e2f-453e-a18c-c3b345765caa: spesa software senza documento, 49,00 €",
  "b4defea4-17d3-443a-be16-180dec2eae31: possibile doppio movimento, 90,00 €",
  "e58108ee-fa86-46c0-8bd5-eb2dea6c6d62: abbonamento sopra canone, 5,00 €",
  "331fd139-110c-45eb-b5ff-191863f8f65b: DEMO-001 scaduta con residuo, 250,00 €",
  "0b135b4d-289e-43e8-8d04-c6e5988471de: incasso parziale oltre scadenza, 250,00 €",
  "e7b0ca4b-6c77-4d14-b71d-f2a6180b67c0: compenso collaboratore non saldato, 180,00 €",
  "f22eeaf3-bbed-4ed6-aa7d-da3d48ee39ae: contratto in scadenza o preavviso, 350,00 €"
 ],
 "domande_commercialista": [
  "Per b4defea4-17d3-443a-be16-180dec2eae31: se uno storno va datato nello stesso mese del movimento originale, serve un documento di rettifica particolare per la ditta forfettaria?",
  "Per e7b0ca4b-6c77-4d14-b71d-f2a6180b67c0: la Notula DEMO-5 al Collaboratore Delta DEMO richiede una ritenuta o altri adempimenti? [DA VERIFICARE con il commercialista]",
  "Per b71984d9-7068-47fb-ae03-c7263cffd82a: quale documento serve per un incasso in contanti da Bottega Aurora DEMO e come va tracciato?",
  "Per 331fd139-110c-45eb-b5ff-191863f8f65b: DEMO-001 è in bozza e già scaduta; va emessa o regolarizzata e serve l'imposta di bollo? [DA VERIFICARE con il commercialista]",
  "Per 12ad23b9-3e2f-453e-a18c-c3b345765caa: l'abbonamento di Strumenti Alfa DEMO compare su entrambe le ditte; come va attribuita la spesa tra le due ditte forfettarie?"
 ],
 "prossimi_passi": [
  "Verificare entro 2026-10-09 su Banca B DEMO se i due pagamenti a Collaboratore Delta DEMO sono uno o due (b4defea4-17d3-443a-be16-180dec2eae31).",
  "Chiarire entro 2026-10-09 se la scadenza e7b0ca4b-6c77-4d14-b71d-f2a6180b67c0 è già coperta dai pagamenti con Notula DEMO-5.",
  "Confermare lo stato di DEMO-001 ed eventualmente approvare dalla coda approvazioni la bozza di sollecito gentile per 331fd139-110c-45eb-b5ff-191863f8f65b entro 2026-10-12.",
  "Collegare gli incassi di Bottega Aurora DEMO a DEMO-001 per 0b135b4d-289e-43e8-8d04-c6e5988471de e b71984d9-7068-47fb-ae03-c7263cffd82a entro 2026-10-12.",
  "Recuperare le ricevute di Strumenti Alfa DEMO e il canone concordato per 12ad23b9-3e2f-453e-a18c-c3b345765caa ed e58108ee-fa86-46c0-8bd5-eb2dea6c6d62 entro 2026-10-14.",
  "Individuare il contratto di f22eeaf3-bbed-4ed6-aa7d-da3d48ee39ae e fissare entro 2026-10-14 il termine di preavviso."
 ],
 "da_verificare": [
  "[DA VERIFICARE] Associazione tra i soci e le ditte DEMO: il pacchetto non indica quale socio è titolare di Ditta Creativa A DEMO e di Ditta Video B DEMO.",
  "[DA VERIFICARE] Canone concordato di Strumenti Alfa DEMO e movimento esatto di e58108ee-fa86-46c0-8bd5-eb2dea6c6d62.",
  "[DA VERIFICARE] Contratto collegato a f22eeaf3-bbed-4ed6-aa7d-da3d48ee39ae: non presente nel pacchetto.",
  "[DA VERIFICARE] Fattura DEMO-001 in stato draft pur avendo scadenza passata e incassi collegati; il movimento 73906dd8-7684-4073-a123-863ea48ee8cf cita \"Bozza DEMO-001\". Segnalazione per il motore.",
  "[DA VERIFICARE] Scadenza \"owner_agreement\" del 2026-10-18 con residuo pari all'importo: non è tra le anomalie, ma va tenuta d'occhio. Segnalazione per il motore.",
  "Il motore non copre il confronto con il Tracker reale, le spese insolite, le soglie del forfettario e i pagamenti assenti da ogni fonte interna: nessuno di questi controlli è stato eseguito.",
  "L'importazione prima nota risulta registrata per sciame-pn-001 … sciame-pn-005; nessun rifiuto da spiegare."
 ],
 "fonti_usate": [
  "pacchetto.anomalie_rilevate",
  "pacchetto.prima_nota[6eba4c2d-a10d-42aa-b381-25ca74e1b19c]",
  "pacchetto.prima_nota[cae05091-d2c0-4223-a01a-9b300132a325]",
  "pacchetto.prima_nota[673a34fa-68cb-4e99-84cd-60f950246a70]",
  "pacchetto.prima_nota[30a94a85-bcd5-44bf-976f-50392a759d5e]",
  "pacchetto.prima_nota[a70ea6cf-461a-465f-8862-917242ad44cf]",
  "pacchetto.prima_nota[73906dd8-7684-4073-a123-863ea48ee8cf]",
  "pacchetto.fatture[DEMO-001]",
  "pacchetto.scadenze",
  "pacchetto.conti",
  "pacchetto.ditte",
  "pacchetto.importazione_prima_nota",
  "pacchetto.regole"
 ]
}
```

## 4. Ricerca clienti · commerciale

Compito: Qualifica i candidati DEMO e scegli il lead per l’analisi gratuita.

Stato: Fermato da Qualità · motore claude-code · durata 63 s · costo 0.1533 USD · esito Qualità: da_correggere

```json
{
 "sintesi": "Valutati 5 candidati DEMO. In testa Officine Nautiche Garigliano DEMO: sito senza versione mobile, scheda Google non rivendicata, social assenti. Il sito guida l'aggancio, con BigAnt Presenza come passo successivo. Graduatoria pronta per il controllo del socio.",
 "valutazioni": [
  {
   "lead_id": "9eeb51fc-67be-4c6d-94a5-4be195ed1ddc",
   "azienda": "Officine Nautiche Garigliano DEMO",
   "punteggio": 82,
   "motivo": "Sito senza versione mobile, scheda non rivendicata, social assenti e 4 recensioni (DEMO): divario netto su servizi prioritari e Presenza. Castel Volturno e nautica: coerenza con territorio e settori target [DA VERIFICARE].",
   "servizio_consigliato": "Siti web",
   "segnali": [
    "sito_aggiornato: Sito senza versione mobile (DEMO)",
    "scheda_google: Non rivendicata (DEMO)",
    "recensioni: 4 recensioni, media 3,9 (DEMO)",
    "social: Assenti (DEMO)"
   ]
  },
  {
   "lead_id": "3bfcf154-3e2c-41d3-a8c3-29798a77a40a",
   "azienda": "Carpenteria Metallica Sud DEMO",
   "punteggio": 71,
   "motivo": "Catalogo lavori fermo al 2022, categoria della scheda errata e nessun video dei lavori (DEMO): peso maggiore su Video e Presenza. Maddaloni e carpenteria industriale: coerenza con territorio e settori target [DA VERIFICARE].",
   "servizio_consigliato": "Video",
   "segnali": [
    "sito_aggiornato: Catalogo lavori fermo al 2022 (DEMO)",
    "scheda_google: Presente, categoria errata (DEMO)",
    "recensioni: 7 recensioni, media 4,1 (DEMO)",
    "social: Nessun video dei lavori (DEMO)"
   ]
  },
  {
   "lead_id": "8b813749-5d4a-48b2-95d8-8dd6e173f306",
   "azienda": "Centro Fisio Volturno DEMO",
   "punteggio": 66,
   "motivo": "Sito fermo al 2021, Instagram fermo da 5 mesi, prenotazione solo telefonica (DEMO). Caserta e fisioterapia: coerenza con territorio e settori target [DA VERIFICARE]. Testi sanitari: controllo Qualità e compliance e regole deontologiche.",
   "servizio_consigliato": "Siti web",
   "segnali": [
    "sito_aggiornato: Ultimo aggiornamento dichiarato nel 2021 (DEMO)",
    "scheda_google: Presente, orari festivi non indicati (DEMO)",
    "social: Instagram fermo da 5 mesi (DEMO)",
    "prenotazione_online: Assente: solo telefono (DEMO)"
   ]
  },
  {
   "lead_id": "3a3a3c25-3b5c-4662-b675-2463c8f67f29",
   "azienda": "Studio Legale Aurelia DEMO",
   "punteggio": 60,
   "motivo": "Sito di una pagina, scheda senza foto e 2 recensioni (DEMO): divario su sito e Presenza. Marcianise e studio professionale: coerenza con territorio e settori target [DA VERIFICARE]. Testi: controllo Qualità e compliance e regole deontologiche.",
   "servizio_consigliato": "Siti web",
   "segnali": [
    "sito_aggiornato: Sito di una pagina (DEMO)",
    "scheda_google: Presente, senza foto (DEMO)",
    "recensioni: 2 recensioni (DEMO)",
    "social: LinkedIn del titolare poco curato (DEMO)"
   ]
  },
  {
   "lead_id": "4273274f-05fe-4790-8393-9eb24b44589b",
   "azienda": "Trattoria Le Logge DEMO",
   "punteggio": 34,
   "motivo": "Scheda completa, 210 recensioni e Instagram attivo (DEMO): l'analisi avrebbe poco da mostrare. Resta il menù in PDF. Territorio e settore: coerenza con target [DA VERIFICARE].",
   "servizio_consigliato": "Siti web",
   "segnali": [
    "sito_aggiornato: Menù in PDF del 2024 (DEMO)",
    "scheda_google: Completa, 120 foto (DEMO)",
    "recensioni: 210 recensioni, media 4,6 (DEMO)",
    "social: Instagram attivo con 3 post a settimana (DEMO)"
   ]
  }
 ],
 "scelto_lead_id": "9eeb51fc-67be-4c6d-94a5-4be195ed1ddc",
 "motivo_scelta": "Officine Nautiche Garigliano DEMO mostra il divario più leggibile dai dati pubblici: sito senza versione mobile, scheda non rivendicata, social assenti. Castel Volturno e nautica: coerenza con territorio e settori target [DA VERIFICARE]. L'analisi S17 rende evidente il valore del progetto sito, servizio consigliato, e apre a BigAnt Presenza come passo successivo.",
 "da_verificare": [
  "[DA VERIFICARE] perimetro territoriale e settoriale BigAnt non presente nel pacchetto: confermare con i soci prima di usare il punteggio",
  "[DA VERIFICARE] definizione e perimetro del servizio BigAnt Presenza, non presente nel pacchetto",
  "[DA VERIFICARE] candidati (tutti), campagne dichiarate: nessun segnale sulle sponsorizzate nel pacchetto",
  "[DA VERIFICARE] 9eeb51fc-67be-4c6d-94a5-4be195ed1ddc, sito_aggiornato: data dell'ultimo aggiornamento non indicata",
  "[DA VERIFICARE] 9eeb51fc-67be-4c6d-94a5-4be195ed1ddc, recensioni: presenza di risposte del titolare non indicata",
  "[DA VERIFICARE] 3bfcf154-3e2c-41d3-a8c3-29798a77a40a, social: canali attivi non indicati, il segnale riguarda solo i video",
  "[DA VERIFICARE] 3a3a3c25-3b5c-4662-b675-2463c8f67f29, social: il segnale riguarda un profilo LinkedIn personale, non un canale aziendale",
  "[DA VERIFICARE] 8b813749-5d4a-48b2-95d8-8dd6e173f306, sito_aggiornato: data 2021 solo dichiarata, versione mobile non indicata",
  "[DA VERIFICARE] 4273274f-05fe-4790-8393-9eb24b44589b, sito_aggiornato: versione mobile e velocità non indicate",
  "[DA VERIFICARE] 9eeb51fc-67be-4c6d-94a5-4be195ed1ddc: possibile sovrapposizione con clienti attuali BigAnt dello stesso settore e comune",
  "[DA VERIFICARE] 9eeb51fc-67be-4c6d-94a5-4be195ed1ddc: base giuridica del primo contatto e verifica del Registro delle opposizioni prima di qualsiasi telefonata"
 ],
 "fonti_usate": [
  "pacchetto.oggi",
  "pacchetto.obiettivo",
  "pacchetto.servizi_prioritari",
  "pacchetto.servizi_esclusi_acquisizione",
  "pacchetto.vincoli",
  "pacchetto.candidati[0].citta",
  "pacchetto.candidati[0].settore",
  "pacchetto.candidati[0].segnali.sito_aggiornato",
  "pacchetto.candidati[0].segnali.scheda_google",
  "pacchetto.candidati[0].segnali.social",
  "pacchetto.candidati[0].segnali.prenotazione_online",
  "pacchetto.candidati[1].segnali.sito_aggiornato",
  "pacchetto.candidati[1].segnali.scheda_google",
  "pacchetto.candidati[1].segnali.recensioni",
  "pacchetto.candidati[1].segnali.social",
  "pacchetto.candidati[2].citta",
  "pacchetto.candidati[2].settore",
  "pacchetto.candidati[2].segnali.sito_aggiornato",
  "pacchetto.candidati[2].segnali.scheda_google",
  "pacchetto.candidati[2].segnali.recensioni",
  "pacchetto.candidati[2].segnali.social",
  "pacchetto.candidati[3].settore",
  "pacchetto.candidati[3].segnali.sito_aggiornato",
  "pacchetto.candidati[3].segnali.scheda_google",
  "pacchetto.candidati[3].segnali.recensioni",
  "pacchetto.candidati[3].segnali.social",
  "pacchetto.candidati[4].citta",
  "pacchetto.candidati[4].settore",
  "pacchetto.candidati[4].segnali.sito_aggiornato",
  "pacchetto.candidati[4].segnali.scheda_google",
  "pacchetto.candidati[4].segnali.recensioni",
  "pacchetto.candidati[4].segnali.social"
 ]
}
```

## 5. Qualità e compliance · crescita

Compito: Controlla l’output di Direttore Crescita prima della coda approvazioni

Stato: Completato · motore claude-code · durata 37 s · costo 0.1032 USD · esito Qualità: bloccato

```json
{
 "esito": "bloccato",
 "sintesi": "Output DEMO bloccato: 1 bloccante, 2 importanti, 2 suggerimenti. Il rischio principale è la soglia \"30%\" nei rischi, assente dal pacchetto e senza fonte. I sette controlli automatici sono confermati, ma non intercettano questo numero, né la composizione del pacchetto Presenza difforme dalla roadmap. KPI, date, priorità (3) e assenza di azioni esterne risultano corretti.",
 "rilievi": [
  {
   "gravita": "bloccante",
   "regola": "veridicita",
   "dove": "output.rischi[3]",
   "problema": "\"ore socio e soglia del 30% mancano\" cita una soglia numerica assente da `pacchetto_autore` (i `vincoli` non la contengono) e `fonti_usate` non la giustifica: il dato è inventato.",
   "correzione": "Sostituire con: \"Il carico dei soci non è misurabile: le ore socio e la soglia di carico oltre cui delegare sono [DA VERIFICARE]. Contromisura: segnare le ore reali questa settimana e proporre ai soci la delega a un partner o a una persona se la soglia, una volta definita, viene superata.\""
  },
  {
   "gravita": "importante",
   "regola": "coerenza_pacchetto",
   "dove": "output.priorita[0].motivo",
   "problema": "\"il pacchetto d'ingresso S06 + S07 + S08 + S17 + dashboard\" contraddice `roadmap_q4_2026`, che definisce il Pacchetto Presenza come \"S06 + S07 + S08\"; anche \"passo 1 della procedura\" in `azione` non ha riscontro nel pacchetto.",
   "correzione": "Nel motivo sostituire con: \"il ricavo per cliente può crescere con il pacchetto Presenza (S06 + S07 + S08), come da roadmap Q4 2026\". Nell'azione sostituire \"(passo 1 della procedura)\" con \"(composizione S06 + S07 + S08)\"."
  },
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.da_verificare[11]",
   "problema": "\"soglia del 30% del tempo di un socio ... [DA DEFINIRE]\" (e \"12 mesi di abbonamento\" in da_verificare[12]) usa un marcatore diverso da [DA VERIFICARE] e riporta numeri senza fonte nel pacchetto.",
   "correzione": "Sostituire la voce 11 con: \"rischi: soglia di carico del socio oltre cui assumere una persona [DA VERIFICARE]\" e la voce 12 con: \"rischi: soglia di costo per scegliere un partner, non calcolabile perché i canoni sono assenti [DA VERIFICARE]\"."
  },
  {
   "gravita": "suggerimento",
   "regola": "veridicita",
   "dove": "output.priorita[0].motivo",
   "problema": "\"il ricavo per cliente cresce con il pacchetto\" presenta come certo un effetto che non si misura, perché `ricavo_medio_per_cliente` è [DA VERIFICARE].",
   "correzione": "Sostituire con: \"il pacchetto Presenza punta ad aumentare il ricavo per cliente, da misurare appena il KPI è disponibile\"."
  },
  {
   "gravita": "suggerimento",
   "regola": "gdpr_consensi",
   "dove": "output.priorita[1].azione",
   "problema": "\"criterio di qualificazione per i 2 contatti in fase new\" e il loro uso per l'analisi non indicano la verifica del consenso e del Registro delle opposizioni.",
   "correzione": "Aggiungere dopo \"fase new\": \", con verifica preventiva di consenso e Registro delle opposizioni [DA VERIFICARE] prima di ogni contatto\"."
  }
 ]
}
```

## 6. Qualità e compliance · commerciale

Compito: Controlla l’output di Ricerca clienti prima della coda approvazioni

Stato: Completato · motore claude-code · durata 34 s · costo 0.0796 USD · esito Qualità: da_correggere

```json
{
 "esito": "da_correggere",
 "sintesi": "Output DEMO da correggere: 0 bloccanti, 2 importanti, 2 suggerimenti. Il rischio principale è l'affermazione che territorio e settori del lead rientrino nel \"perimetro\" o nella \"griglia\" BigAnt. Il pacchetto non contiene questa griglia e l'affermazione non ha [DA VERIFICARE]. Confermati i 6 controlli automatici, tutti ok, e i 12 punti [DA VERIFICARE] dichiarati. Integrati: incoerenza tra sintesi e motivo_scelta sul servizio d'ingresso e fonti non allineate ai dati usati. Segnali e recensioni dei 5 candidati DEMO corrispondono al pacchetto, senza dati sanitari o promesse.",
 "rilievi": [
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.valutazioni[0].motivo",
   "problema": "\"Castel Volturno e nautica rientrano pienamente in territorio e settori\" (e analoghe in valutazioni[1], [2], [3] e in motivo_scelta: \"rientrano nel perimetro BigAnt\", \"in griglia\") dà per noto un perimetro territoriale e settoriale assente da pacchetto_autore, senza [DA VERIFICARE].",
   "correzione": "Sostituire con: \"Castel Volturno e nautica: coerenza con territorio e settori target [DA VERIFICARE].\" Applicare lo stesso schema a valutazioni[1], [2], [3] e a output.motivo_scelta. Aggiungere in output.da_verificare: \"[DA VERIFICARE] perimetro territoriale e settoriale BigAnt non presente nel pacchetto: confermare con i soci prima di usare il punteggio\"."
  },
  {
   "gravita": "importante",
   "regola": "coerenza_pacchetto",
   "dove": "output.motivo_scelta",
   "problema": "La sintesi dice \"Il sito guida l'aggancio, con BigAnt Presenza come ingresso\" e servizio_consigliato è \"Siti web\", mentre motivo_scelta presenta Presenza come punto d'ingresso e il sito come \"passo successivo\": l'ordine dei servizi si contraddice.",
   "correzione": "In output.motivo_scelta sostituire la frase \"L'analisi S17 rende evidente il valore di BigAnt Presenza e apre al progetto sito come passo successivo.\" con: \"L'analisi S17 rende evidente il valore del progetto sito, servizio consigliato, e apre a BigAnt Presenza come passo successivo.\" In output.sintesi sostituire \"con BigAnt Presenza come ingresso\" con \"con BigAnt Presenza come passo successivo\"."
  },
  {
   "gravita": "suggerimento",
   "regola": "veridicita",
   "dove": "output.valutazioni[0].motivo",
   "problema": "\"BigAnt Presenza\" compare come servizio in sintesi, motivi e motivo_scelta, ma non figura in servizi_prioritari né altrove nel pacchetto_autore, quindi non ha fonte nel pacchetto.",
   "correzione": "Aggiungere in output.da_verificare: \"[DA VERIFICARE] definizione e perimetro del servizio BigAnt Presenza, non presente nel pacchetto\"."
  },
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.fonti_usate",
   "problema": "Le fonti \"pacchetto.candidati[1].citta\" (Santa Maria Capua Vetere, mai citata nell'output) e l'assenza di \"candidati[0].citta\", \"candidati[2].settore\" e \"candidati[4].settore\" non corrispondono ai dati effettivamente usati (Caserta, nautica, carpenteria).",
   "correzione": "Sostituire le voci settore/città con: \"pacchetto.candidati[0].citta\", \"pacchetto.candidati[0].settore\", \"pacchetto.candidati[2].citta\", \"pacchetto.candidati[2].settore\", \"pacchetto.candidati[3].settore\", \"pacchetto.candidati[4].citta\", \"pacchetto.candidati[4].settore\"; eliminare \"pacchetto.candidati[1].citta\"."
  }
 ]
}
```

## 7. Qualità e compliance · amministrazione

Compito: Controlla l’output di Amministrazione prima della coda approvazioni

Stato: Completato · motore claude-code · durata 38 s · costo 0.1031 USD · esito Qualità: approvabile

```json
{
 "esito": "approvabile",
 "sintesi": "Output DEMO approvabile: 0 bloccanti, 0 importanti, 4 suggerimenti. Confermo tutti i 7 controlli automatici: importi, ID e date coincidono con il pacchetto, le correzioni restano proposte e nessuna azione esterna è dichiarata come compiuta. Il rischio principale è un'incoerenza interna: il sollecito per DEMO-001 usa un residuo che l'anomalia 0b135b4d dichiara non affidabile. I soci decidono sui dati DEMO, che non sono risultati reali.",
 "rilievi": [
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.anomalie[4].correzione_proposta",
   "problema": "\"preparare una bozza di sollecito ... con l'importo del residuo di 250,00 €\" usa un residuo che l'anomalia 0b135b4d-289e-43e8-8d04-c6e5988471de definisce \"non affidabile\", e DEMO-001 è ancora in stato draft.",
   "correzione": "Sostituire con: \"PROPOSTA: dopo aver verificato lo stato di DEMO-001 e il residuo effettivo (vedi 0b135b4d-289e-43e8-8d04-c6e5988471de), preparare una bozza di sollecito a scaglioni (gentile, fermo, ultimo avviso), partendo dal tono gentile, con l'importo del residuo confermato, da sottoporre alla coda approvazioni. Nessun invio fino all'approvazione di un socio.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.anomalie[5].spiegazione",
   "problema": "\"Su DEMO-001 risulta un incasso parziale\" non indica che l'incasso è di 100,00 € e che i 250,00 € del campo `importo` sono il residuo: il lettore può scambiare le due cifre.",
   "correzione": "Sostituire l'apertura con: \"Su DEMO-001 (importo 350,00 €) risulta un incasso parziale di 100,00 € dopo la scadenza del 2026-10-03; i 250,00 € indicati sono il residuo, non l'incasso: il movimento 73906dd8-7684-4073-a123-863ea48ee8cf del 2026-10-08 cita\" e proseguire con il testo attuale (\"\\\"Bozza DEMO-001\\\" e non una fattura emessa ...\")."
  },
  {
   "gravita": "suggerimento",
   "regola": "da_verificare",
   "dove": "output.da_verificare[5]",
   "problema": "\"Il motore non copre il confronto con il Tracker reale, le spese insolite, le soglie del forfettario ...\" dichiara controlli non eseguiti senza il marcatore [DA VERIFICARE]; il controllo automatico conta 7 punti, ma solo 5 voci portano il marcatore.",
   "correzione": "Sostituire con: \"[DA VERIFICARE] Il motore non copre il confronto con il Tracker reale, le spese insolite, le soglie del forfettario e i pagamenti assenti da ogni fonte interna: nessuno di questi controlli è stato eseguito.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.anomalie[6].spiegazione",
   "problema": "\"il legame con questa scadenza non è certo\" omette che i due movimenti da 90,00 € sommano 180,00 €, pari al residuo della scadenza \"collaborator\" (dato presente nel pacchetto).",
   "correzione": "Aggiungere dopo \"non è certo\": \". I due movimenti sommano 180,00 €, pari al residuo della scadenza: se entrambi i pagamenti sono reali, la coprirebbero; se il pagamento è uno solo (vedi b4defea4-17d3-443a-be16-180dec2eae31), restano 90,00 € da chiarire.\""
  }
 ]
}
```

## 8. Produzione social S01 · social

Compito: Prepara il piano editoriale S01 di novembre 2026 per Bottega Aurora DEMO con i testi dei post.

Stato: Fermato da Qualità · motore claude-code · durata 158 s · costo 0.2917 USD · esito Qualità: da_correggere

```json
{
 "sintesi": "Piano S01 di novembre 2026 per Bottega Aurora DEMO: 8 contenuti su Instagram e Facebook, di cui 2 Reel, costruiti su 4 pilastri e con un annuncio per ciascun evento DEMO del 14 e del 28 novembre. Serve l'ok di un socio e poi quello del cliente su piano e testi, dopo il controllo Qualità. La consegna rispetta la scadenza del 20 ottobre.",
 "mese": "novembre 2026",
 "pilastri": [
  "Mani e materia — il pezzo che nasce dall'argilla, passo dopo passo",
  "Persone — le mani e il tempo di chi lavora in bottega",
  "Regali e casa — pezzi unici per le famiglie e per chi cerca un regalo",
  "Eventi in bottega — laboratorio aperto e anteprime da vivere dal vivo"
 ],
 "piano": [
  {
   "data": "2026-11-03",
   "canale": "Instagram",
   "formato": "Carosello",
   "tema": "Mani e materia · Dall'argilla alla ciotola in cinque passaggi"
  },
  {
   "data": "2026-11-05",
   "canale": "Facebook",
   "formato": "Post",
   "tema": "Regali e casa · Se cerchi un regalo che non somigli a nessuno"
  },
  {
   "data": "2026-11-10",
   "canale": "Instagram",
   "formato": "Reel",
   "tema": "Eventi in bottega · Il tornio dal vivo, sabato 14"
  },
  {
   "data": "2026-11-12",
   "canale": "Facebook",
   "formato": "Post",
   "tema": "Persone · Le mani dietro ogni pezzo"
  },
  {
   "data": "2026-11-17",
   "canale": "Instagram",
   "formato": "Post",
   "tema": "Mani e materia · Il tempo dell'asciugatura"
  },
  {
   "data": "2026-11-19",
   "canale": "Facebook",
   "formato": "Post",
   "tema": "Regali e casa · Un pezzo per casa tua"
  },
  {
   "data": "2026-11-24",
   "canale": "Instagram",
   "formato": "Reel",
   "tema": "Eventi in bottega · Anteprima natalizia, sabato 28"
  },
  {
   "data": "2026-11-26",
   "canale": "Facebook",
   "formato": "Post",
   "tema": "Regali e casa · Un pezzo su misura, a partire da una parola"
  }
 ],
 "post": [
  {
   "id": "post-1",
   "canale": "Instagram",
   "formato": "Carosello",
   "data_proposta": "2026-11-03",
   "titolo": "Dall'argilla alla ciotola in cinque passaggi (DEMO)",
   "testo": "Dall'argilla alla ciotola: cinque passaggi, nessuna scorciatoia.\n\nIn bottega ogni pezzo parte da un blocco di materia e da mani che sanno aspettare. Nel carosello ti mostriamo come nasce una ciotola: impasto, tornio, asciugatura, cottura, smalto.\n\nIl tempo fa parte del lavoro. Per questo ogni pezzo ha il suo ritmo e la sua piccola differenza. (contenuto DEMO)\n\nScorri e guarda, poi passa in bottega. Orari [DA VERIFICARE].\n\n#SanMarcoEvangelista #Caserta #CeramicaArtigianale #FattoAMano",
   "cta": "Passa in bottega",
   "brief_visivo": "Carosello 4:5 1080×1350, 6 slide (grafica: Alfonso). Slide 1 copertina: foto di mani sull'argilla, titolo 'Dall'argilla alla ciotola'. Slide 2 'Impasto': la materia lavorata a mano. Slide 3 'Tornio': la forma che sale. Slide 4 'Asciugatura': il pezzo che riposa. Slide 5 'Cottura e smalto': il pezzo finito. Slide 6 chiusura: 'Passa in bottega' con orari [DA VERIFICARE]. Inquadratura ravvicinata sulle mani, luce naturale laterale. Materiale: foto e video del cliente disponibili, oppure giornata di shooting in bottega [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Persone riconoscibili solo con liberatoria."
  },
  {
   "id": "post-2",
   "canale": "Facebook",
   "formato": "Post",
   "data_proposta": "2026-11-05",
   "titolo": "Regalo unico: parti dalle mani che lo fanno (DEMO)",
   "testo": "Se cerchi un regalo che non somigli a nessun altro, parti dalle mani che lo fanno.\n\nIn bottega lavoriamo ceramiche e oggetti per la casa con la materia e con il tempo che serve. Ogni pezzo porta una piccola differenza, ed è ciò che lo rende unico per chi lo riceve.\n\nTi aspettiamo per vedere i pezzi dal vivo, sceglierli con calma e sapere come sono fatti.\n\nPassa in bottega. Orari [DA VERIFICARE].\n\n#SanMarcoEvangelista #Caserta #RegaliUnici #CeramicaArtigianale",
   "cta": "Passa in bottega",
   "brief_visivo": "Post feed 4:5 1080×1350 (grafica: Alfonso). Soggetto: una ciotola o un oggetto per la casa su un piano di legno, con le mani che lo sistemano o lo porgono. Inquadratura a 45 gradi, luce naturale morbida. Testo sull'immagine: 'Un regalo che non somiglia a nessun altro'. Materiale: foto del cliente disponibili, oppure giornata di shooting in bottega [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Persone riconoscibili solo con liberatoria."
  },
  {
   "id": "post-3",
   "canale": "Instagram",
   "formato": "Reel",
   "data_proposta": "2026-11-10",
   "titolo": "Annuncio laboratorio aperto del 14 novembre (DEMO)",
   "testo": "Un blocco d'argilla, due mani, il tempo giusto.\n\nSabato 14 novembre apriamo il laboratorio: al tornio ti mostriamo come nasce una ciotola, un passaggio alla volta, e sei invitato a guardare da vicino. (evento DEMO)\n\nPassa in bottega. Orari [DA VERIFICARE].\n\n#SanMarcoEvangelista #Caserta #CeramicaArtigianale",
   "cta": "Passa in bottega",
   "brief_visivo": "Reel 9:16 1080×1920, 20 s (video: [DA VERIFICARE] assegnazione dei soci). Storyboard. 0-2 s: gancio, mani sull'argilla bagnata in primo piano, testo 'Sabato 14 · Laboratorio aperto'. 2-12 s: la ciotola prende forma al tornio, luce naturale laterale. 12-17 s: il pezzo finito sul bancone. 17-20 s: testo 'Passa in bottega', orari [DA VERIFICARE]. Sottotitoli sempre attivi. Materiale: riprese in bottega, giornata di shooting [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Musica con licenza [DA VERIFICARE]. Volti dei visitatori solo con liberatoria."
  },
  {
   "id": "post-4",
   "canale": "Facebook",
   "formato": "Post",
   "data_proposta": "2026-11-12",
   "titolo": "Le mani dietro ogni pezzo (DEMO)",
   "testo": "Dietro ogni pezzo ci sono mani, e ogni paio di mani ha il suo modo di lavorare.\n\nIn bottega la materia prende forma attraverso gesti che si imparano con il tempo. Ogni settimana ti racconteremo un dettaglio di chi lavora qui: un gesto, uno strumento, un passaggio.\n\nSe vuoi conoscere da vicino come nascono i pezzi che porti a casa, ti aspettiamo.\n\nPassa in bottega. Orari [DA VERIFICARE].\n\n#SanMarcoEvangelista #Caserta #FattoAMano #CeramicaArtigianale",
   "cta": "Passa in bottega",
   "brief_visivo": "Post feed 4:5 1080×1350 (grafica: Alfonso). Soggetto: primo piano di mani al lavoro con un attrezzo da bottega, senza volti. Luce naturale laterale, sfondo neutro. Testo sull'immagine: 'Le mani dietro ogni pezzo'. Materiale: foto del cliente disponibili, oppure giornata di shooting in bottega [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Se le mani o la persona sono riconoscibili, serve la liberatoria."
  },
  {
   "id": "post-5",
   "canale": "Instagram",
   "formato": "Post",
   "data_proposta": "2026-11-17",
   "titolo": "Il tempo dell'asciugatura (DEMO)",
   "testo": "L'argilla non ha fretta: prima di diventare ceramica deve asciugare, piano.\n\nÈ il passaggio che si vede meno e che conta di più. Un pezzo asciugato con il suo tempo regge la cottura e conserva la forma che le mani gli hanno dato.\n\nIn bottega rispettiamo questo ritmo, perché la materia lo chiede. È parte di ciò che rende ogni pezzo diverso dall'altro.\n\nPassa in bottega e guarda i pezzi che riposano. Orari [DA VERIFICARE].\n\n#SanMarcoEvangelista #Caserta #CeramicaArtigianale #Materia",
   "cta": "Passa in bottega",
   "brief_visivo": "Post feed 4:5 1080×1350 (grafica: Alfonso). Soggetto: ciotole e vasi non ancora cotti allineati su uno scaffale di legno. Inquadratura frontale leggermente dall'alto, luce naturale di finestra. Testo sull'immagine: 'Il tempo fa parte del pezzo'. Materiale: foto del cliente disponibili, oppure giornata di shooting in bottega [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Nessuna persona in primo piano."
  },
  {
   "id": "post-6",
   "canale": "Facebook",
   "formato": "Post",
   "data_proposta": "2026-11-19",
   "titolo": "Un pezzo per casa tua (DEMO)",
   "testo": "Un pezzo per casa tua nasce da una scelta lenta, non da una corsa.\n\nCiotole, piatti, oggetti per la tavola e per gli spazi di ogni giorno: li lavoriamo a mano, con la materia e con il tempo che servono. Ognuno entra in casa con la sua piccola differenza.\n\nPensa a dove lo metteresti, a chi lo userebbe ogni mattina. Poi vieni a sceglierlo con noi.\n\nPassa in bottega. Orari [DA VERIFICARE].\n\n#SanMarcoEvangelista #Caserta #CasaArtigianale #CeramicaArtigianale",
   "cta": "Passa in bottega",
   "brief_visivo": "Post feed 4:5 1080×1350 (grafica: Alfonso). Soggetto: un oggetto della bottega in una scena domestica, tavola apparecchiata o mensola. Inquadratura a 45 gradi, luce calda naturale. Testo sull'immagine: 'Un pezzo per casa tua'. Materiale: foto del cliente disponibili, oppure giornata di shooting in bottega [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Persone riconoscibili solo con liberatoria; minori mai riconoscibili senza consenso scritto dei genitori."
  },
  {
   "id": "post-7",
   "canale": "Instagram",
   "formato": "Reel",
   "data_proposta": "2026-11-24",
   "titolo": "Annuncio anteprima collezione natalizia (DEMO)",
   "testo": "Sabato 28 novembre la bottega si prepara al Natale.\n\nTi mostriamo in anteprima la collezione natalizia, nata dalle nostre mani e dal tempo che serve alla materia. (evento DEMO)\n\nPassa in bottega e guarda i pezzi prima di tutti. Orari [DA VERIFICARE].\n\n#SanMarcoEvangelista #Caserta #CeramicaArtigianale #NataleArtigiano",
   "cta": "Passa in bottega",
   "brief_visivo": "Reel 9:16 1080×1920, 15 s (video: [DA VERIFICARE] assegnazione dei soci). Storyboard. 0-2 s: gancio, un telo che si solleva su un tavolo di pezzi, testo 'Sabato 28 · Anteprima'. 2-10 s: carrellata lenta sui pezzi della collezione natalizia, luce calda naturale. 10-13 s: mani che sistemano un pezzo. 13-15 s: testo 'Passa in bottega', orari [DA VERIFICARE]. Sottotitoli sempre attivi. Materiale: riprese dei pezzi della collezione, da fornire dal cliente o da girare in bottega [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Musica con licenza [DA VERIFICARE]. Persone riconoscibili solo con liberatoria."
  },
  {
   "id": "post-8",
   "canale": "Facebook",
   "formato": "Post",
   "data_proposta": "2026-11-26",
   "titolo": "Un pezzo su misura (DEMO)",
   "testo": "Un regalo su misura comincia da una parola: per chi è, dove vivrà, cosa deve raccontare.\n\nRaccontaci l'idea e noi ti diciamo come la lavoriamo a mano. Tempi e prezzi del pezzo su misura: [DA VERIFICARE].\n\nSabato 28 novembre ti aspettiamo anche per l'anteprima della collezione natalizia. (evento DEMO)\n\nScrivici per un pezzo su misura. Contatti [DA VERIFICARE].\n\n#SanMarcoEvangelista #Caserta #SuMisura #RegaliUnici",
   "cta": "Scrivici per un pezzo su misura",
   "brief_visivo": "Post feed 4:5 1080×1350 (grafica: Alfonso). Soggetto: mani che disegnano o modellano un pezzo su un tavolo di lavoro, accanto a un bozzetto. Inquadratura dall'alto a 45 gradi, luce naturale. Testo sull'immagine: 'Un pezzo su misura'. Materiale: foto del cliente disponibili, oppure giornata di shooting in bottega [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Persone riconoscibili solo con liberatoria."
  }
 ],
 "da_verificare": [
  "[DA VERIFICARE] Orari di apertura della bottega, da fornire dal cliente (compaiono in tutti i post con la CTA 'Passa in bottega').",
  "[DA VERIFICARE] Contatti per le richieste di pezzi su misura (telefono, messaggio o email), da fornire dal cliente.",
  "[DA VERIFICARE] Tempi di realizzazione e prezzi del pezzo su misura, da fornire dal cliente. Il post del 26 novembre li lascia aperti.",
  "[DA VERIFICARE] Conferma del Laboratorio aperto del 14 novembre (data, programma, orari), dal cliente.",
  "[DA VERIFICARE] Conferma dell'Anteprima collezione natalizia del 28 novembre (data, programma, orari, pezzi mostrabili), dal cliente.",
  "[DA VERIFICARE] Foto e video del cliente disponibili, oppure data della giornata di shooting in bottega: da concordare tra i soci e il cliente.",
  "[DA VERIFICARE] Assegnazione dei soci per la produzione dei due Reel e per le grafiche.",
  "[DA VERIFICARE] Palette e logo del cliente per grafiche e video, dal cliente.",
  "[DA VERIFICARE] Musica con licenza per i due Reel, a cura del socio che produce il video.",
  "[DA VERIFICARE] Liberatorie delle persone riconoscibili e consenso scritto dei genitori per eventuali minori, dal cliente.",
  "[DA VERIFICARE] Approvazione della scheda DNA da parte del cliente: nel pacchetto il DNA è compilato ma lo stato di approvazione non è indicato."
 ],
 "fonti_usate": [
  "pacchetto.oggi",
  "pacchetto.mese",
  "pacchetto.cliente",
  "pacchetto.pacchetto.contenuti_mese",
  "pacchetto.pacchetto.canali",
  "pacchetto.pacchetto.reel",
  "pacchetto.dna",
  "pacchetto.promozioni_eventi[0]",
  "pacchetto.promozioni_eventi[1]",
  "pacchetto.feedback_cliente",
  "pacchetto.regole"
 ]
}
```

## 9. Qualità e compliance · crescita

Compito: Controlla l’output di Direttore Crescita prima della coda approvazioni

Stato: Completato · motore claude-code · durata 30 s · costo 0.0772 USD · esito Qualità: approvabile

```json
{
 "esito": "approvabile",
 "sintesi": "Output DEMO approvabile: 0 bloccanti, 0 importanti, 3 suggerimenti. I 7 controlli automatici sono confermati. KPI (3 clienti attivi, 4,7 servizi medi), funnel e date 2026-10-14/15/16 coincidono con il pacchetto e cadono nella settimana 2026-10-12/2026-10-18. Nessun prezzo, nessuna azione esterna e nessun dato contabile grezzo. Il rischio residuo è un'aspettativa di ricavo non ancora misurabile, perché il KPI è [DA VERIFICARE].",
 "rilievi": [
  {
   "gravita": "suggerimento",
   "regola": "veridicita",
   "dove": "output.priorita[0].motivo",
   "problema": "\"il ricavo per cliente può crescere con il pacchetto Presenza\" e \"punta ad aumentare il ricavo per cliente\" anticipano un effetto che il KPI ricavo_medio_per_cliente, [DA VERIFICARE], non permette di verificare. Il registro è inoltre dubitativo.",
   "correzione": "Sostituire le due frasi con: \"Il pacchetto Presenza (S06 + S07 + S08), in roadmap Q4 2026, è l'ipotesi da testare sul ricavo per cliente: il KPI ricavo_medio_per_cliente è [DA VERIFICARE] e fissa la misura dell'esito.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.priorita[1].motivo",
   "problema": "\"Il funnel commerciale è fermo: new 2, qualified 0, contacted 0, meeting 0, proposal 0\" riporta valori DEMO senza marcatura DEMO nel punto in cui compaiono.",
   "correzione": "Sostituire con: \"Il funnel commerciale (DEMO) è fermo: new 2, qualified 0, contacted 0, meeting 0, proposal 0.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "da_verificare",
   "dove": "output.da_verificare[11]",
   "problema": "Le voci 11, 12 e 13 su soglie di carico e di costo non hanno corrispondenza puntuale nel testo di `rischi`: \"soglia di costo per scegliere un partner\" non compare in rischi[1], e la voce 13 duplica la 11 su carico e delega.",
   "correzione": "Eliminare la voce 13 (\"rischi: ore socio e soglia di carico oltre cui delegare [DA VERIFICARE]\"). In rischi[1] sostituire \"canoni assenti, scelta non confrontabile\" con \"canoni e soglia di costo per la scelta del partner [DA VERIFICARE], scelta non confrontabile\"."
  }
 ]
}
```

## 10. Qualità e compliance · commerciale

Compito: Controlla l’output di Ricerca clienti prima della coda approvazioni

Stato: Completato · motore claude-code · durata 43 s · costo 0.0950 USD · esito Qualità: da_correggere

```json
{
 "esito": "da_correggere",
 "sintesi": "Output DEMO da correggere: 0 bloccanti, 6 importanti, 1 suggerimento. Il rischio principale è \"BigAnt Presenza\", un servizio assente dal pacchetto che il testo cita come fatto senza [DA VERIFICARE] in 5 punti. Un secondo problema: gli indici di `fonti_usate` seguono l'ordine dell'output e non quello di `pacchetto.candidati`. I sei controlli automatici sono confermati. I segnali, le recensioni e le città dei 5 candidati DEMO coincidono con il pacchetto, e l'11 di punti [DA VERIFICARE] dichiarati è corretto.",
 "rilievi": [
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.sintesi",
   "problema": "\"con BigAnt Presenza come passo successivo\" cita un servizio che il pacchetto non contiene e non porta il marcatore [DA VERIFICARE] nel testo, solo in `da_verificare`.",
   "correzione": "Sostituire con: \"Valutati 5 candidati DEMO. In testa Officine Nautiche Garigliano DEMO: sito senza versione mobile, scheda Google non rivendicata, social assenti. Il sito guida l'aggancio; l'eventuale secondo servizio si definisce dopo l'analisi S17 [DA VERIFICARE]. Graduatoria pronta per il controllo del socio.\""
  },
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.motivo_scelta",
   "problema": "\"apre a BigAnt Presenza come passo successivo\" presenta come esistente un servizio assente dal pacchetto, senza marcatore inline.",
   "correzione": "Sostituire la frase finale con: \"L'analisi S17 rende evidente il valore del progetto sito, servizio consigliato; il passo successivo resta da definire [DA VERIFICARE].\""
  },
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.valutazioni[0].motivo",
   "problema": "\"divario netto su servizi prioritari e Presenza\" usa \"Presenza\" come servizio BigAnt, ma il pacchetto elenca solo Video, Siti web, Social e Sponsorizzate.",
   "correzione": "Sostituire con: \"Sito senza versione mobile, scheda non rivendicata, social assenti e 4 recensioni (DEMO): divario netto su servizi prioritari e sulla presenza online. Castel Volturno e nautica: coerenza con territorio e settori target [DA VERIFICARE].\""
  },
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.valutazioni[1].motivo",
   "problema": "\"peso maggiore su Video e Presenza\" cita un servizio BigAnt non presente nel pacchetto, senza marcatore.",
   "correzione": "Sostituire con: \"Catalogo lavori fermo al 2022, categoria della scheda errata e nessun video dei lavori (DEMO): peso maggiore su Video e sulla presenza online. Maddaloni e carpenteria industriale: coerenza con territorio e settori target [DA VERIFICARE].\""
  },
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.valutazioni[3].motivo",
   "problema": "\"divario su sito e Presenza\" cita un servizio BigAnt non presente nel pacchetto, senza marcatore.",
   "correzione": "Sostituire con: \"Sito di una pagina, scheda senza foto e 2 recensioni (DEMO): divario su sito e presenza online. Marcianise e studio professionale: coerenza con territorio e settori target [DA VERIFICARE]. Testi: controllo Qualità e compliance e regole deontologiche.\""
  },
  {
   "gravita": "importante",
   "regola": "coerenza_pacchetto",
   "dove": "output.fonti_usate",
   "problema": "Gli indici seguono l'ordine dell'output, non quello di `pacchetto.candidati`: \"pacchetto.candidati[0].segnali.sito_aggiornato\" nel pacchetto è Centro Fisio Volturno DEMO, non Officine Nautiche. Mancano anche le fonti di città e settore di Studio Legale e Carpenteria, le recensioni di Officine e i segnali di Trattoria.",
   "correzione": "Sostituire l'elenco con le voci nell'ordine del pacchetto (Fisio [0], Trattoria [1], Officine [2], Studio [3], Carpenteria [4]): pacchetto.oggi, pacchetto.obiettivo, pacchetto.servizi_prioritari, pacchetto.servizi_esclusi_acquisizione, pacchetto.vincoli; per ciascun indice da 0 a 4 le voci .citta e .settore; per i soli indici 0, 2, 3 e 4 le voci .segnali.sito_aggiornato, .segnali.scheda_google, .segnali.recensioni e .segnali.social; per l'indice 1 le stesse quattro voci; infine pacchetto.candidati[2].segnali.prenotazione_online solo se il dato viene usato."
  },
  {
   "gravita": "suggerimento",
   "regola": "veridicita",
   "dove": "output.valutazioni[*].punteggio",
   "problema": "I punteggi \"82\", \"71\", \"66\", \"60\" e \"34\" non hanno un criterio di calcolo documentato in `fonti_usate`, e il perimetro territoriale e settoriale su cui poggiano è [DA VERIFICARE].",
   "correzione": "Aggiungere in `da_verificare`: \"[DA VERIFICARE] criterio e pesi del punteggio non presenti nel pacchetto: i punteggi sono indicativi finché i soci non li confermano\"."
  }
 ]
}
```

## 11. Marketing BigAnt · marketing

Compito: Prepara il piano editoriale BigAnt per la settimana dal 2026-10-12 al 2026-10-18 e le bozze dei post pronte da approvare.

Stato: In attesa di approvazione · motore claude-code · durata 163 s · costo 0.3139 USD · esito Qualità: approvabile

```json
{
 "sintesi": "Obiettivo della settimana: portare PMI di Caserta e della Campania a richiedere la prima Analisi gratuita della presenza online. Il piano ha 10 uscite su tutti i 9 canali e 5 bozze complete (LinkedIn agenzia, Reel Instagram, articolo sito, post Recensioni, video TikTok), con brief visivi pronti per Alfonso e Raffaele. Pacchetto DEMO: DNA e strategia non sono compilati. Ai soci chiediamo l'ok alle bozze, la conferma del criterio dell'Analisi gratuita S17 e la disponibilità per le riprese.",
 "settimana": {
  "dal": "2026-10-12",
  "al": "2026-10-18"
 },
 "obiettivo_settimana": "Portare PMI di Caserta e Campania a richiedere la prima Analisi gratuita della presenza online [DA VERIFICARE obiettivo numerico] (dati DEMO).",
 "piano": [
  {
   "data": "2026-10-12",
   "giorno": "lunedì",
   "canale": "LinkedIn agenzia",
   "formato": "Post LinkedIn",
   "tema": "Regia unica: sei canali, una sola voce",
   "obiettivo": "Nuovi clienti locali"
  },
  {
   "data": "2026-10-13",
   "giorno": "martedì",
   "canale": "Instagram",
   "formato": "Reel",
   "tema": "Dietro le quinte: come prepariamo uno shooting",
   "obiettivo": "Notorietà"
  },
  {
   "data": "2026-10-13",
   "giorno": "martedì",
   "canale": "LinkedIn Raffaele",
   "formato": "Post LinkedIn",
   "tema": "Video e ADV: la regia parte dal montaggio",
   "obiettivo": "Notorietà"
  },
  {
   "data": "2026-10-14",
   "giorno": "mercoledì",
   "canale": "LinkedIn Alfonso",
   "formato": "Post LinkedIn",
   "tema": "Direzione visiva: un'identità che regge su ogni canale",
   "obiettivo": "Portfolio e reputazione"
  },
  {
   "data": "2026-10-14",
   "giorno": "mercoledì",
   "canale": "Sito BigAnt",
   "formato": "Articolo sito",
   "tema": "Analisi gratuita: cosa controlliamo su sito e scheda Google",
   "obiettivo": "Nuovi clienti locali"
  },
  {
   "data": "2026-10-15",
   "giorno": "giovedì",
   "canale": "Google Business Profile",
   "formato": "Aggiornamento GBP",
   "tema": "Local marketing: scheda Google coerente con il sito",
   "obiettivo": "Nuovi clienti locali"
  },
  {
   "data": "2026-10-15",
   "giorno": "giovedì",
   "canale": "Recensioni e reputazione",
   "formato": "Post",
   "tema": "Invito a tutti i clienti: racconta la tua esperienza su Google",
   "obiettivo": "Portfolio e reputazione"
  },
  {
   "data": "2026-10-16",
   "giorno": "venerdì",
   "canale": "TikTok",
   "formato": "Video TikTok",
   "tema": "AI che produce, testa umana: il montaggio in 30 secondi",
   "obiettivo": "Notorietà"
  },
  {
   "data": "2026-10-17",
   "giorno": "sabato",
   "canale": "Facebook",
   "formato": "Post",
   "tema": "Tre controlli sulla scheda Google di una PMI",
   "obiettivo": "Nuovi clienti locali"
  },
  {
   "data": "2026-10-18",
   "giorno": "domenica",
   "canale": "Instagram",
   "formato": "Carosello",
   "tema": "Due soci, due modi di decidere, una sola regia",
   "obiettivo": "Notorietà"
  }
 ],
 "bozze": [
  {
   "id": "bozza-1",
   "canale": "LinkedIn agenzia",
   "formato": "Post LinkedIn",
   "data_proposta": "2026-10-12",
   "titolo": "Regia unica sui canali (DEMO)",
   "testo": "Sei canali, sei voci diverse: così una PMI disperde forza.\n\nSito, scheda Google, social, annunci: ognuno racconta una storia a sé. Il cliente se ne accorge prima di noi.\n\nLavoriamo con una regia unica. Una strategia, un'identità, un calendario. Grafica, video, annunci e scheda Google seguono la stessa direzione. L'AI ci fa produrre di più, la testa resta umana.\n\nSiamo due soci con ruoli chiari: Alfonso su brand e direzione visiva, Raffaele su video e performance. Decidiamo insieme, in pochi passaggi.\n\nForza sproporzionata. Siamo piccoli: è la nostra arma.\n\nRichiedi l'analisi gratuita della tua presenza online: ti mostriamo da dove partire. [DA VERIFICARE link]",
   "cta": "Richiedi l'analisi gratuita",
   "hashtag": [
    "#Caserta",
    "#Campania",
    "#PMI",
    "#MarketingLocale"
   ],
   "brief_visivo": "Grafica 1:1 1080×1080, produce Alfonso. Sei icone di canale (Instagram, Facebook, LinkedIn, TikTok, Google, sito) in nero #141413 su fondo chiaro, linee sottili che convergono in un punto arancione #F26B21 al centro. Testo in sovraimpressione: 'Una sola regia'. In basso, piccolo, il claim 'Forza sproporzionata. Siamo piccoli: è la nostra arma.' Materiali: logo BigAnt in versione vettoriale e icone dei canali (set generico, senza marchi altrui in primo piano)."
  },
  {
   "id": "bozza-2",
   "canale": "Instagram",
   "formato": "Reel",
   "data_proposta": "2026-10-13",
   "titolo": "Dietro le quinte dello shooting (DEMO)",
   "testo": "Uno shooting si vince prima di accendere la camera.\n\nDietro le quinte: sopralluogo, scaletta, luci, inquadrature. Poi il montaggio, dove il ritmo decide cosa resta.\n\nNel Reel mostriamo i passaggi con cui prepariamo le riprese per un brand. Un metodo, una regia, nessuna improvvisazione.\n\nL'AI ci aiuta a produrre di più. La testa resta umana.\n\nForza sproporzionata. Siamo piccoli: è la nostra arma.\n\nVuoi capire come lavoriamo sulla tua presenza online? Richiedi l'analisi gratuita. [DA VERIFICARE link]",
   "cta": "Richiedi l'analisi gratuita",
   "hashtag": [
    "#Caserta",
    "#Campania",
    "#DietroLeQuinte",
    "#Videomaking",
    "#MarketingLocale",
    "#BigAnt"
   ],
   "brief_visivo": "Reel 9:16 1080×1920, 20 secondi. Produce Raffaele (riprese e montaggio) [DA VERIFICARE eventuale supporto alle riprese]; titoli e sottotitoli Alfonso. Copione: scena 1 (0-2 s, gancio) primo piano della scaletta scritta a mano, titolo 'Lo shooting si vince prima'; scena 2 (2-7 s) sopralluogo, panoramica lenta sullo spazio di lavoro; scena 3 (7-12 s) set luci e inquadratura, dettagli di mani e attrezzatura; scena 4 (12-17 s) timeline di montaggio con tagli a ritmo; scena 5 (17-20 s) fermo su fondo nero #141413 con testo arancione #F26B21 'Una sola regia' e claim. Sottotitoli sempre attivi, bianchi su fascia nera. Musica con licenza [DA VERIFICARE]. Persone riconoscibili inquadrate solo con liberatoria [DA VERIFICARE]. Materiali: attrezzatura video, luogo delle riprese [DA VERIFICARE], font del brand."
  },
  {
   "id": "bozza-3",
   "canale": "Sito BigAnt",
   "formato": "Articolo sito",
   "data_proposta": "2026-10-14",
   "titolo": "Articolo: cosa controlliamo nell'analisi gratuita",
   "testo": "# Analisi gratuita della presenza online: da dove partiamo\n\n*Un primo sguardo d'insieme su sito, scheda Google e social di una PMI.*\n\n## Perché partiamo da qui\nSpesso sito, scheda Google e social raccontano tre storie diverse. Noi lavoriamo con una regia unica: prima guardiamo l'insieme, poi scegliamo dove intervenire per primo.\n\n## Cosa controlliamo [DA VERIFICARE criterio e checklist della prima Analisi gratuita S17, da confermare con Direttore e soci]\nSul sito guardiamo la chiarezza dell'offerta e il percorso che porta al contatto. Sulla scheda Google verifichiamo che le informazioni siano coerenti con il sito. Sulle recensioni osserviamo come vengono gestite. Leggiamo ogni recensione e rispondiamo con cura. [DA VERIFICARE impegno confermato dai soci] Sui social controlliamo coerenza di voce e identità visiva.\n\n## Cosa ricevi\nUn quadro delle priorità, in linguaggio semplice, per capire dove intervenire per primo.\n\n## Come richiederla\nRaccontaci la tua attività e il sito da analizzare. I dati inviati servono solo a preparare l'analisi. Informativa privacy: [DA VERIFICARE link informativa].\n\nRichiedi l'analisi gratuita: [DA VERIFICARE link].\n\nForza sproporzionata. Siamo piccoli: è la nostra arma.",
   "cta": "Richiedi l'analisi gratuita",
   "hashtag": [],
   "brief_visivo": "Immagine di copertina 4:3 1200×900, produce Alfonso. Fondo #141413, al centro una lente di ingrandimento stilizzata in arancione #F26B21 che inquadra tre blocchi (sito, scheda Google, social) allineati. Testo in sovraimpressione: 'Analisi gratuita'. Nessuna persona e nessun dato cliente. Materiali: logo BigAnt vettoriale, font del brand. Impaginazione articolo: titolo H1, sottotitoli H2, pulsante finale in arancione con la CTA."
  },
  {
   "id": "bozza-4",
   "canale": "Recensioni e reputazione",
   "formato": "Post",
   "data_proposta": "2026-10-15",
   "titolo": "Invito neutro a recensire su Google (DEMO)",
   "testo": "Ogni cliente di BigAnt può raccontare la propria esperienza su Google.\n\nUna recensione è un racconto onesto: cosa ha funzionato, cosa si può migliorare. Aiuta chi sta scegliendo un partner e aiuta noi a lavorare meglio.\n\nL'invito è per tutti i clienti, senza distinzioni. Nessun compenso e nessuna contropartita: solo la tua esperienza, con le tue parole.\n\nLeggiamo ogni recensione e rispondiamo con cura. [DA VERIFICARE impegno confermato dai soci]\n\nRacconta la tua esperienza su Google. [DA VERIFICARE link scheda Google]",
   "cta": "Racconta la tua esperienza su Google",
   "hashtag": [
    "#Caserta"
   ],
   "brief_visivo": "Grafica 4:5 1080×1350, produce Alfonso. Fondo #141413, cinque stelle vuote in contorno arancione #F26B21 (nessuna valutazione o punteggio mostrato, nessuna recensione reale o citazione). Testo in sovraimpressione: 'La tua esperienza conta.' Logo BigAnt in basso. Materiali: logo vettoriale, font del brand, link alla scheda Google [DA VERIFICARE]."
  },
  {
   "id": "bozza-5",
   "canale": "TikTok",
   "formato": "Video TikTok",
   "data_proposta": "2026-10-16",
   "titolo": "AI e montaggio: la testa resta umana (DEMO)",
   "testo": "Montaggio in 30 secondi: l'AI sistema i tempi, noi scegliamo cosa resta.\n\nRichiedi l'analisi gratuita. [DA VERIFICARE link]",
   "cta": "Richiedi l'analisi gratuita",
   "hashtag": [
    "#Caserta",
    "#Videomaking",
    "#MarketingLocale",
    "#AIassisted"
   ],
   "brief_visivo": "Video 9:16 1080×1920, 30 secondi. Produce Raffaele [DA VERIFICARE eventuale supporto alle riprese]; titoli Alfonso. Copione: scena 1 (0-2 s, gancio) schermo del montaggio con clip grezze, testo 'L'AI taglia. Noi decidiamo.'; scena 2 (2-10 s) l'AI propone una sequenza, screen recording della timeline; scena 3 (10-20 s) Raffaele sposta tagli e ritmo a mano, scartando le proposte che non servono al messaggio; scena 4 (20-27 s) confronto prima e dopo della stessa sequenza, solo materiale BigAnt; scena 5 (27-30 s) fondo #141413, testo arancione #F26B21 'Più produzione. Testa umana.' e claim. Sottotitoli sempre attivi. Musica con licenza [DA VERIFICARE]. Persone riconoscibili solo con liberatoria [DA VERIFICARE]. Materiali: screen recording del software di montaggio, clip proprie di BigAnt."
  }
 ],
 "da_verificare": [
  "[DA VERIFICARE] DNA definitivo di BigAnt (voce, tono, parole vietate, CTA): il pacchetto riporta 'non ancora compilato'; il piano usa posizionamento e claim. Lo forniscono i soci.",
  "[DA VERIFICARE] Strategia a 90 giorni (pilastri, ruolo dei canali): non compilata nel pacchetto. La fornisce il Direttore Crescita.",
  "[DA VERIFICARE] Obiettivo numerico della settimana (richieste di analisi gratuita): nessun valore nel pacchetto. Lo indica il Direttore Crescita.",
  "[DA VERIFICARE] Link per richiedere l'analisi gratuita e per la scheda Google: nessun link nel pacchetto. Li forniscono i soci.",
  "[DA VERIFICARE] Criterio e checklist della prima Analisi gratuita S17: da confermare con Direttore e soci prima dell'ok all'articolo del 14 ottobre.",
  "[DA VERIFICARE] Autorizzazioni portfolio: nessuna presente nel pacchetto, quindi nessun lavoro, logo, nome o risultato cliente è usato. Le registrano i soci, cliente per cliente.",
  "[DA VERIFICARE] Misure reali dei canali (follower, copertura, contatti): non presenti nel pacchetto, nessun dato di performance citato. Le fornisce l'Amministrazione con i soci.",
  "[DA VERIFICARE] Disponibilità di Raffaele e Alfonso per le riprese del Reel (13 ottobre) e del video TikTok (16 ottobre), con liberatorie per le persone riconoscibili ed eventuale supporto alle riprese.",
  "[DA VERIFICARE] Link all'informativa privacy per il modulo di richiesta dell'analisi gratuita, finalità e gestione dei dati inviati. La forniscono i soci.",
  "[DA VERIFICARE] Impegno a leggere e rispondere a ogni recensione: non confermato dai soci, presente nell'articolo del 14 ottobre e nel post del 15 ottobre.",
  "[DA VERIFICARE] Licenza della musica per Reel e video TikTok, e luogo delle riprese. Li fornisce Raffaele.",
  "[DA VERIFICARE] Le priorità del Direttore sulla scheda del pacchetto Presenza per i clienti attuali e sui KPI mancanti non sono servite da questo piano: le CTA seguono la priorità sull'Analisi gratuita S17. Conferma del Direttore."
 ],
 "fonti_usate": [
  "pacchetto.oggi",
  "pacchetto.settimana",
  "pacchetto.cliente.nome",
  "pacchetto.cliente.area",
  "pacchetto.cliente.posizionamento",
  "pacchetto.cliente.claim",
  "pacchetto.cliente.soci",
  "pacchetto.cliente.servizi",
  "pacchetto.cliente.avvertenza",
  "pacchetto.canali",
  "pacchetto.dna",
  "pacchetto.strategia",
  "pacchetto.priorita_direttore[1]",
  "pacchetto.feedback_soci",
  "pacchetto.regole[0]",
  "pacchetto.regole[1]",
  "pacchetto.regole[2]",
  "pacchetto.regole[3]"
 ]
}
```

## 12. Local SEO e GBP S06 · local

Compito: Controlla la scheda Google di Bottega Aurora DEMO (S06), segnala le incoerenze con il sito e prepara 4 post GBP del mese.

Stato: Fermato da Qualità · motore claude-code · durata 169 s · costo 0.3170 USD · esito Qualità: da_correggere

```json
{
 "sintesi": "Bottega Aurora DEMO: 1 voce ok, 6 da correggere, 2 mancanti (descrizione, domande e risposte); 3 incoerenze NAP (indirizzo, telefono, orari). Urgenti: descrizione e foto, poi allineamento NAP dopo conferma del cliente. Le 4 bozze di post sono pronte per l'approvazione, dal 2026-10-13; gbp-3 resta in attesa di foto e liberatoria [DA VERIFICARE]. Serve l'ok del socio per l'esecuzione di Vincenzo su GBP OPS.",
 "controlli": [
  {
   "voce": "Categorie principale e secondarie",
   "stato": "da_correggere",
   "dettaglio": "Principale: Negozio di articoli da regalo; secondaria: Laboratorio di ceramica (DEMO). Il settore è laboratorio artigiano di ceramiche: la principale potrebbe non rappresentare l'attività.",
   "correzione_proposta": "Nessuna modifica automatica. Decisione del socio sulla categoria principale (modifica sensibile, da eseguire da sola e solo dopo l'ok, fuori dalla sequenza a basso rischio). Nomi esatti delle categorie [DA VERIFICARE nell'elenco Google]. Nessuna categoria aggiunta senza conferma del cliente."
  },
  {
   "voce": "Descrizione",
   "stato": "mancante",
   "dettaglio": "Campo descrizione vuoto (DEMO).",
   "correzione_proposta": "Modifica 1 di 7, basso rischio. Dopo l'ok Vincenzo inserisce: \"Bottega Aurora è un laboratorio artigiano di ceramiche e oggetti per la casa a San Marco Evangelista. Qui il lavoro si fa con le mani e con il tempo che serve: dalla forma alla finitura, ogni pezzo porta il segno di chi lo realizza. In bottega trovi ceramiche e oggetti pensati per vivere la casa ogni giorno e per diventare un regalo che racconta qualcosa. Passa a trovarci: ti mostriamo i pezzi, ti spieghiamo come nascono e ti aiutiamo a scegliere quello adatto alla tua casa o a chi vuoi sorprendere. Per i dettagli sui singoli articoli, chiedi direttamente a noi.\" (DEMO)"
  },
  {
   "voce": "Servizi e attributi",
   "stato": "da_correggere",
   "dettaglio": "Servizi non elencati (servizi_elencati: falso). Attributi: solo \"Pagamento con carta (DEMO)\".",
   "correzione_proposta": "Modifica 2 di 7, basso rischio. Dopo l'ok Vincenzo elenca i servizi desumibili dal settore: \"Ceramiche artigianali\", \"Oggetti per la casa\", \"Idee regalo\" (DEMO). Mantiene l'attributo \"Pagamento con carta\". Ogni altro servizio o attributo (personalizzazioni, corsi, spedizioni, accessibilità) [DA VERIFICARE con il cliente]."
  },
  {
   "voce": "Foto aggiornate",
   "stato": "da_correggere",
   "dettaglio": "9 foto; ultima foto 2026-03-01 (DEMO), 221 giorni prima di oggi, oltre la soglia di 90 giorni.",
   "correzione_proposta": "Modifica 3 di 7, basso rischio. Dopo l'ok Vincenzo carica le nuove foto fornite dal cliente o dal team BigAnt [DA VERIFICARE chi le fornisce], in queste serie: esterno con insegna, interno della bottega, prodotti, persone al lavoro in laboratorio. Per le persone serve la liberatoria. Condizione di pubblicazione di gbp-3: foto del laboratorio e liberatoria disponibili [DA VERIFICARE]; senza, gbp-3 non si pubblica."
  },
  {
   "voce": "Orari, anche festivi",
   "stato": "da_correggere",
   "dettaglio": "Scheda: \"Mar–Sab 9:30–13:00, 16:00–20:00; domenica non indicata (DEMO)\". Il sito riporta chiusura serale alle 19:30. Festivi e orari speciali non rilevati.",
   "correzione_proposta": "Modifica 5 di 7, dopo conferma del cliente. Il cliente conferma gli orari esatti, domenica e festivi compresi [DA VERIFICARE]. Poi Vincenzo li imposta identici sulla scheda dopo l'ok; il sito si allinea in parallelo."
  },
  {
   "voce": "Domande e risposte",
   "stato": "mancante",
   "dettaglio": "0 domande e risposte (DEMO).",
   "correzione_proposta": "Modifica 4 di 7, basso rischio [DA VERIFICARE disponibilità della funzione sulla scheda]. Dopo l'ok Vincenzo inserisce: 1) D: \"Che cosa trovo in bottega?\" R: \"Ceramiche e oggetti per la casa di un laboratorio artigiano.\" 2) D: \"Posso pagare con carta?\" R: \"Sì, accettiamo il pagamento con carta.\" 3) D: \"Siete un laboratorio o un negozio?\" R: \"Siamo un laboratorio artigiano con vendita in bottega.\" (DEMO)"
  },
  {
   "voce": "Coerenza NAP con il sito",
   "stato": "da_correggere",
   "dettaglio": "Nome coincide. Differenze: indirizzo (\"5\" contro \"5/A\"), telefono (\"111 222\" contro \"111 223\"), orari (chiusura 20:00 contro 19:30). Tre incoerenze (DEMO).",
   "correzione_proposta": "Nessuna modifica prima della conferma del cliente. Poi Modifica 6 di 7 (telefono) e Modifica 7 di 7 (indirizzo, sensibile), una alla volta e distanziate, dopo l'ok del socio. Gli orari sono alla Modifica 5. Finché restano incoerenti, i post non citano orari, telefono o indirizzo."
  },
  {
   "voce": "Post settimanali o mensili",
   "stato": "da_correggere",
   "dettaglio": "1 post negli ultimi 90 giorni (DEMO): la scheda S06 prevede 4 post al mese e considera da correggere meno di 12 in 90 giorni.",
   "correzione_proposta": "Dopo l'ok Vincenzo prepara i 4 post gbp-1..gbp-4 con le date proposte, una a settimana, basso rischio. gbp-3 si pubblica solo con foto e liberatoria disponibili. Foto per ciascun post [DA VERIFICARE]."
  },
  {
   "voce": "Collegamento al sito e prenotazione",
   "stato": "ok",
   "dettaglio": "URL https://bottega-aurora.example/ presente, dominio coerente con l'email del sito (ciao@bottega-aurora.example). Prenotazione non rilevata, non necessaria per il settore (DEMO).",
   "correzione_proposta": "Nessuna modifica"
  }
 ],
 "incoerenze_nap": [
  {
   "campo": "indirizzo",
   "scheda": "Corso Italia 5, San Marco Evangelista (DEMO)",
   "sito": "Corso Italia 5/A, San Marco Evangelista (DEMO)",
   "proposta": "Il titolare conferma il civico corretto con documento o foto dell'insegna. Vincenzo allinea la scheda dopo l'ok; il sito lo aggiorna [DA VERIFICARE chi lo gestisce]. Se resta incoerente, rischio di mappa errata e di nuova verifica."
  },
  {
   "campo": "telefono",
   "scheda": "0823 111 222 (DEMO)",
   "sito": "0823 111 223 (DEMO)",
   "proposta": "Il titolare conferma il numero attivo. Vincenzo allinea la scheda dopo l'ok; il sito lo aggiorna [DA VERIFICARE chi lo gestisce]. Se resta incoerente, chiamate perse e segnale NAP debole."
  },
  {
   "campo": "orari",
   "scheda": "Mar–Sab 9:30–13:00, 16:00–20:00; domenica non indicata (DEMO)",
   "sito": "Mar–Sab 9:30–13:00, 16:00–19:30 (DEMO)",
   "proposta": "Il titolare conferma l'orario di chiusura serale e lo stato della domenica. Vincenzo allinea la scheda dopo l'ok; il sito lo aggiorna [DA VERIFICARE chi lo gestisce]. Se resta incoerente, clienti davanti al negozio chiuso."
  }
 ],
 "post_gbp": [
  {
   "id": "gbp-1",
   "titolo": "Il laboratorio artigiano di San Marco Evangelista",
   "testo": "Bottega Aurora è il laboratorio artigiano di San Marco Evangelista dove nascono ceramiche e oggetti per la casa. Lavoriamo con le mani e con il tempo che serve, curando la forma e la finitura, perché un oggetto d'uso quotidiano merita la stessa attenzione di uno da esporre. Scopri sul nostro sito chi siamo e che cosa creiamo: guardalo con calma e scegli ciò che ti somiglia di più. Se preferisci vedere i pezzi dal vivo, passa in bottega. (DEMO)",
   "cta": "Scopri di più · https://bottega-aurora.example/ (DEMO)",
   "data_proposta": "2026-10-13"
  },
  {
   "id": "gbp-2",
   "titolo": "Ceramiche e oggetti per la casa come idea regalo",
   "testo": "Bottega Aurora, a San Marco Evangelista, propone ceramiche e oggetti per la casa pensati anche come idee regalo. Un pezzo fatto a mano ha il carattere di chi lo realizza e racconta qualcosa a chi lo riceve. È una scelta adatta a chi inaugura una casa, a chi ama curare la propria tavola o a chi vuole fare un gesto che resti. Raccontaci per chi lo cerchi: ti aiutiamo a trovare il pezzo giusto. (DEMO)",
   "cta": "Scopri di più · https://bottega-aurora.example/ (DEMO)",
   "data_proposta": "2026-10-20"
  },
  {
   "id": "gbp-3",
   "titolo": "Come nasce una ceramica nel nostro laboratorio",
   "testo": "A San Marco Evangelista il laboratorio di Bottega Aurora è il luogo in cui ceramiche e oggetti per la casa prendono forma. Ti mostriamo il lavoro dietro ogni pezzo: le mani, gli strumenti, i tempi giusti. Dietro un oggetto semplice c'è sempre una sequenza di gesti precisi, e vederla cambia il modo di guardarlo. Se il nostro mestiere ti incuriosisce, vieni a trovarci. (DEMO)",
   "cta": "Scopri di più · https://bottega-aurora.example/ (DEMO)",
   "data_proposta": "2026-10-27"
  },
  {
   "id": "gbp-4",
   "titolo": "Un oggetto fatto a mano, scelto da vicino",
   "testo": "Bottega Aurora è il laboratorio artigiano di San Marco Evangelista per ceramiche e oggetti per la casa. Scegliere un pezzo fatto a mano significa dare valore a un mestiere e a chi lo porta avanti sul nostro territorio. In bottega puoi vedere gli articoli da vicino, toccarli e farti consigliare, e puoi pagare con carta. Per conoscere meglio la nostra attività, scopri di più sul sito. (DEMO)",
   "cta": "Scopri di più · https://bottega-aurora.example/ (DEMO)",
   "data_proposta": "2026-11-03"
  }
 ],
 "da_verificare": [
  "[DA VERIFICARE] Indirizzo corretto (Corso Italia 5 o 5/A): lo conferma il cliente con documento o foto dell'insegna.",
  "[DA VERIFICARE] Telefono corretto (0823 111 222 o 0823 111 223): lo conferma il cliente.",
  "[DA VERIFICARE] Orari esatti: chiusura serale 20:00 o 19:30, domenica, festivi e orari speciali: li conferma il cliente.",
  "[DA VERIFICARE] Nome esatto delle categorie nell'elenco Google e decisione del socio sulla categoria principale (BigAnt, con evidenza dal cliente).",
  "[DA VERIFICARE] Servizi e attributi ulteriori oltre a quelli desumibili (personalizzazioni, corsi, spedizioni, accessibilità): li fornisce il cliente.",
  "[DA VERIFICARE] Disponibilità della funzione domande e risposte sulla scheda: la verifica Vincenzo in fase di esecuzione.",
  "[DA VERIFICARE] Chi aggiorna il sito per allineare indirizzo, telefono e orari: lo indica il cliente.",
  "[DA VERIFICARE] Foto per ciascun post e liberatoria per le persone al lavoro in gbp-3: le nuove foto fornite dal cliente o dal team BigAnt [DA VERIFICARE chi le fornisce].",
  "[DA VERIFICARE] BigAnt registrata come gestore della scheda e assenza di gestori terzi con accesso: lo verificano i soci, senza leggere 04_ACCESSI.",
  "[DA VERIFICARE] Conferma del cliente che la prenotazione non serve sulla scheda e che l'URL del sito è quello corretto."
 ],
 "fonti_usate": [
  "pacchetto.oggi",
  "pacchetto.cliente",
  "pacchetto.scheda_google.categoria_principale",
  "pacchetto.scheda_google.categorie_secondarie",
  "pacchetto.scheda_google.descrizione",
  "pacchetto.scheda_google.servizi_elencati",
  "pacchetto.scheda_google.attributi",
  "pacchetto.scheda_google.foto",
  "pacchetto.scheda_google.ultima_foto",
  "pacchetto.scheda_google.orari",
  "pacchetto.scheda_google.domande_e_risposte",
  "pacchetto.scheda_google.indirizzo",
  "pacchetto.scheda_google.telefono",
  "pacchetto.scheda_google.sito",
  "pacchetto.scheda_google.post_ultimi_90_giorni",
  "pacchetto.dati_sito.nome",
  "pacchetto.dati_sito.indirizzo",
  "pacchetto.dati_sito.telefono",
  "pacchetto.dati_sito.orari",
  "pacchetto.dati_sito.email",
  "pacchetto.checklist_s06",
  "pacchetto.vincoli[0]",
  "pacchetto.vincoli[1]",
  "scheda servizio S06 (soglia foto 90 giorni; 4 post al mese)"
 ]
}
```

## 13. Qualità e compliance · social

Compito: Controlla l’output di Produzione social S01 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 35 s · costo 0.0869 USD · esito Qualità: da_correggere

```json
{
 "esito": "da_correggere",
 "sintesi": "Output DEMO da correggere: 0 bloccanti, 2 importanti, 1 suggerimento. Il rischio principale è l'attribuzione a \"Enzo\" di un ruolo da socio e di ruoli di produzione, senza riscontro nel pacchetto. I 6 controlli automatici sono confermati (11 punti [DA VERIFICARE] presenti, 8 bozze, nessuna promessa, azione esterna o presentazione di BigAnt come società). Non risultano rilievi su GDPR, recensioni, prezzi o Codice del Consumo. L'invito a recensire in post-6 è aperto a tutti e privo di incentivi. Gli eventi restano marcati DEMO.",
 "rilievi": [
  {
   "gravita": "importante",
   "regola": "coerenza_pacchetto",
   "dove": "output.da_verificare[7]",
   "problema": "\"da concordare tra soci (Raffaele ed Enzo) e cliente\" definisce soci due persone, ma i soci sono Alfonso Costantino e Raffaele La Manna. \"Enzo\" non compare in `pacchetto_autore`.",
   "correzione": "Sostituire con: \"[DA VERIFICARE] Foto e video del cliente disponibili, oppure data della giornata di shooting in bottega: da concordare tra i soci e il cliente.\""
  },
  {
   "gravita": "importante",
   "regola": "veridicita",
   "dove": "output.post[2].brief_visivo",
   "problema": "\"video: Raffaele ed Enzo\" assegna la produzione a una persona assente dal pacchetto, senza [DA VERIFICARE]. La stessa dicitura compare in output.post[6].brief_visivo.",
   "correzione": "Sostituire \"(video: Raffaele ed Enzo)\" con \"(video: [DA VERIFICARE] assegnazione dei soci)\" in output.post[2].brief_visivo e in output.post[6].brief_visivo."
  },
  {
   "gravita": "suggerimento",
   "regola": "brand_tono",
   "dove": "output.post[2].testo",
   "problema": "\"voi siete invitati a guardare\" passa al plurale e poche righe dopo c'è \"Passa in bottega\" al singolare. Anche output.post[1].testo usa \"Se cerchi\" e output.piano[5].tema usa \"casa vostra\". La voce DNA (prima persona plurale, registro coerente) risulta incostante tra le due forme di allocuzione.",
   "correzione": "In output.post[2].testo sostituire \"e voi siete invitati a guardare\" con \"e sei invitato a guardare\". Mantenere il singolare \"tu\" in tutti i testi e in output.piano[5].tema sostituire \"casa vostra\" con \"casa tua\"."
  }
 ]
}
```

## 14. Qualità e compliance · marketing

Compito: Controlla l’output di Marketing BigAnt prima della coda approvazioni

Stato: Completato · motore claude-code · durata 40 s · costo 0.1027 USD · esito Qualità: bloccato

```json
{
 "esito": "bloccato",
 "sintesi": "Output DEMO bloccato: 3 bloccanti, 1 importante, 2 suggerimenti. Il rischio principale è il nome \"Enzo\", assegnato alle riprese senza alcuna fonte nel pacchetto (i soci sono Raffaele e Alfonso) e senza [DA VERIFICARE] nel testo. I 6 controlli automatici sono confermati: nessuna promessa assoluta, nessuna azione dichiarata compiuta, BigAnt mai presentata come società, 14 punti [DA VERIFICARE] dichiarati. Anche le date e i giorni del piano 12-18 ottobre 2026 sono coerenti.",
 "rilievi": [
  {
   "gravita": "bloccante",
   "regola": "veridicita",
   "dove": "output.bozze[2].brief_visivo",
   "problema": "\"Produce Raffaele con Enzo (riprese e montaggio)\" cita una persona assente da pacchetto_autore (soci: Raffaele La Manna e Alfonso Costantino) e senza [DA VERIFICARE] nel testo: dato inventato.",
   "correzione": "Sostituire \"Produce Raffaele con Enzo (riprese e montaggio)\" con: \"Produce Raffaele (riprese e montaggio) [DA VERIFICARE eventuale supporto alle riprese]\"."
  },
  {
   "gravita": "bloccante",
   "regola": "veridicita",
   "dove": "output.bozze[4].brief_visivo",
   "problema": "\"Produce Raffaele con Enzo; titoli Alfonso\" assegna un ruolo a una persona senza fonte nel pacchetto e senza [DA VERIFICARE] nel testo: dato inventato.",
   "correzione": "Sostituire \"Produce Raffaele con Enzo; titoli Alfonso\" con: \"Produce Raffaele [DA VERIFICARE eventuale supporto alle riprese]; titoli Alfonso\"."
  },
  {
   "gravita": "bloccante",
   "regola": "veridicita",
   "dove": "output.sintesi",
   "problema": "\"brief visivi pronti per Alfonso, Raffaele ed Enzo\" presenta come acquisita una persona non presente nel pacchetto. La stessa voce compare in output.da_verificare[7] (\"Disponibilità di Raffaele, Alfonso ed Enzo\").",
   "correzione": "Sostituire con: \"brief visivi pronti per Alfonso e Raffaele\". In output.da_verificare[7] sostituire con: \"[DA VERIFICARE] Disponibilità di Raffaele e Alfonso per le riprese del Reel (13 ottobre) e del video TikTok (16 ottobre), con liberatorie per le persone riconoscibili ed eventuale supporto alle riprese.\""
  },
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.bozze[3].testo",
   "problema": "La sezione \"Cosa controlliamo\" (sito, scheda Google, recensioni, social) descrive un metodo che output.da_verificare[4] dichiara non confermato da Direttore e soci, ma il testo dell'articolo non porta alcun [DA VERIFICARE].",
   "correzione": "Sostituire l'intestazione \"Cosa controlliamo\" con: \"Cosa controlliamo [DA VERIFICARE criterio e checklist della prima Analisi gratuita S17, da confermare con Direttore e soci]\"."
  },
  {
   "gravita": "suggerimento",
   "regola": "gdpr_consensi",
   "dove": "output.bozze[3].testo",
   "problema": "\"Raccontaci la tua attività e il sito da analizzare.\" raccoglie dati di contatto e di attività, ma l'articolo non menziona informativa privacy né finalità del trattamento.",
   "correzione": "Aggiungere dopo la frase: \"I dati inviati servono solo a preparare l'analisi. Informativa privacy: [DA VERIFICARE link informativa].\""
  },
  {
   "gravita": "suggerimento",
   "regola": "da_verificare",
   "dove": "output.bozze[5].testo",
   "problema": "\"Leggiamo ogni recensione e rispondiamo con cura.\" è un impegno operativo che output.da_verificare[9] dichiara non confermato dai soci, ma il testo non lo segnala.",
   "correzione": "Sostituire con: \"Leggiamo ogni recensione e rispondiamo con cura. [DA VERIFICARE impegno confermato dai soci]\"."
  }
 ]
}
```

## 15. Qualità e compliance · local

Compito: Controlla l’output di Local SEO e GBP S06 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 46 s · costo 0.1069 USD · esito Qualità: da_correggere

```json
{
 "esito": "da_correggere",
 "sintesi": "Output DEMO da correggere: 0 bloccanti, 2 importanti, 2 suggerimenti. Il rischio principale è la tracciabilità: le soglie operative (foto 90 giorni, 4 post al mese, 12 in 90 giorni) e il nome «Enzo» non hanno riscontro nel pacchetto. I 5 controlli automatici sono confermati, senza falsi positivi. I calcoli (221 giorni dall'ultima foto, 1 ok / 5 da correggere / 3 mancanti, 11 punti [DA VERIFICARE]) e i dati NAP corrispondono al pacchetto, e nessuna azione esterna è dichiarata compiuta.",
 "rilievi": [
  {
   "gravita": "importante",
   "regola": "coerenza_pacchetto",
   "dove": "output.fonti_usate",
   "problema": "Le soglie «soglia 90», «La Gestione S06 prevede 4 post al mese» e «sotto 12 in 90 giorni» compaiono in output.controlli[3].dettaglio e output.controlli[7].dettaglio. In pacchetto_autore.checklist_s06 esistono solo i titoli delle nove voci, quindi la voce «pacchetto.checklist_s06» in fonti_usate non giustifica questi numeri.",
   "correzione": "Aggiungere a output.fonti_usate la voce «scheda servizio S06 (soglia foto 90 giorni; 4 post al mese)». Se la scheda non riporta queste soglie, aggiungere [DA VERIFICARE] dopo ciascun numero in output.controlli[3].dettaglio e output.controlli[7].dettaglio e una voce corrispondente in output.da_verificare."
  },
  {
   "gravita": "importante",
   "regola": "veridicita",
   "dove": "output.controlli[3].correzione_proposta",
   "problema": "\"le nuove foto fornite dal cliente o da Enzo\": il nome «Enzo» non compare in pacchetto_autore e non ha una fonte in fonti_usate. Lo stesso nome è ripetuto in output.da_verificare[7].",
   "correzione": "Sostituire con: \"le nuove foto fornite dal cliente o dal team BigAnt [DA VERIFICARE chi le fornisce]\". Applicare la stessa sostituzione in output.da_verificare[7]."
  },
  {
   "gravita": "suggerimento",
   "regola": "formato",
   "dove": "output.post_gbp[2].testo",
   "problema": "\"Foto da allegare e liberatoria [DA VERIFICARE].\" è una nota interna dentro il testo destinato alla pubblicazione: se il testo viene copiato così com'è, la nota finisce sulla scheda.",
   "correzione": "Eliminare la frase dal testo. Il testo termina con \"...vieni a trovarci. (DEMO)\". Il vincolo su foto e liberatoria resta in output.da_verificare[7] e va aggiunto in output.controlli[3].correzione_proposta come condizione di pubblicazione di gbp-3."
  },
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.sintesi",
   "problema": "\"I 4 post sono pronti, dal 2026-10-13\" contraddice il fatto che gbp-3 dipende da foto e liberatoria non disponibili, e che le foto per ciascun post sono ancora [DA VERIFICARE].",
   "correzione": "Sostituire con: \"Le 4 bozze di post sono pronte per l'approvazione, dal 2026-10-13; gbp-3 resta in attesa di foto e liberatoria [DA VERIFICARE].\""
  }
 ]
}
```

## 16. Qualità e compliance · social

Compito: Controlla l’output di Produzione social S01 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 48 s · costo 0.1090 USD · esito Qualità: da_correggere

```json
{
 "esito": "da_correggere",
 "sintesi": "Output DEMO da correggere: 0 bloccanti, 4 importanti, 1 suggerimento. Il rischio principale è nei contenuti non coperti dal pacchetto: il processo di lavorazione descritto come fatto, un impegno editoriale settimanale e l'assegnazione di Alfonso alle grafiche. I 6 controlli automatici sono confermati senza falsi positivi; l'integrazione manuale ha aggiunto 5 rilievi. Date, scadenza del 20 ottobre, eventi del 14 e 28 novembre, CTA e divieto di azioni esterne risultano coerenti con il pacchetto.",
 "rilievi": [
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.post[0].testo",
   "problema": "\"ogni pezzo parte da un blocco di materia\" e \"impasto, tornio, asciugatura, cottura, smalto\" descrivono il processo della bottega e il pezzo \"ciotola\", ma il pacchetto cita solo una dimostrazione al tornio: cottura, smalto e ciotola non hanno fonte e non portano [DA VERIFICARE].",
   "correzione": "Sostituire la frase con: \"In bottega ogni pezzo parte dalla materia e da mani che sanno aspettare. Nel carosello ti mostriamo come nasce un pezzo: fasi di lavorazione [DA VERIFICARE con il cliente].\" Aggiungere in output.da_verificare: \"[DA VERIFICARE] Fasi di lavorazione reali della bottega (impasto, tornio, asciugatura, cottura, smalto) e pezzo da mostrare, dal cliente.\" Allineare titolo e brief_visivo alla conferma."
  },
  {
   "gravita": "importante",
   "regola": "coerenza_pacchetto",
   "dove": "output.post[3].testo",
   "problema": "\"Ogni settimana ti racconteremo un dettaglio di chi lavora qui\" promette una rubrica settimanale assente dal pacchetto e dal piano, che contiene un solo contenuto \"Persone\" nel mese.",
   "correzione": "Sostituire con: \"In questo spazio ti raccontiamo un dettaglio di chi lavora qui: un gesto, uno strumento, un passaggio.\""
  },
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.post[0].brief_visivo",
   "problema": "\"(grafica: Alfonso)\" assegna una persona alle grafiche, ma il pacchetto non lo indica e output.da_verificare dichiara l'assegnazione dei soci ancora aperta; la stessa dicitura compare in post[1], post[3], post[4], post[5] e post[7].",
   "correzione": "In ciascuno dei sei brief_visivo sostituire \"(grafica: Alfonso)\" con \"(grafica: [DA VERIFICARE] assegnazione dei soci)\"."
  },
  {
   "gravita": "importante",
   "regola": "veridicita",
   "dove": "output.post[4].testo",
   "problema": "\"Un pezzo asciugato con il suo tempo regge la cottura\" e \"conta di più\" sono affermazioni tecniche e gerarchiche sul processo, senza fonte nel pacchetto e senza [DA VERIFICARE].",
   "correzione": "Sostituire \"È il passaggio che si vede meno e che conta di più. Un pezzo asciugato con il suo tempo regge la cottura e conserva la forma che le mani gli hanno dato.\" con: \"È il passaggio che si vede meno. Il tempo fa parte del pezzo e della forma che le mani gli hanno dato [DA VERIFICARE con il cliente].\""
  },
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.post[0].brief_visivo",
   "problema": "Il testo promette \"cinque passaggi\", ma le slide mostrano quattro passaggi: \"Cottura e smalto\" è accorpata in una sola slide.",
   "correzione": "Dopo la conferma del cliente sulle fasi, allineare le slide al numero di passaggi del titolo, oppure sostituire \"cinque passaggi\" con \"i passaggi\" in titolo e testo."
  }
 ]
}
```

## 17. Qualità e compliance · marketing

Compito: Controlla l’output di Marketing BigAnt prima della coda approvazioni

Stato: Completato · motore claude-code · durata 31 s · costo 0.0843 USD · esito Qualità: approvabile

```json
{
 "esito": "approvabile",
 "sintesi": "Output DEMO approvabile: 0 bloccanti, 0 importanti, 3 suggerimenti. Nessun rischio legale: i 6 controlli automatici sono confermati e l'invito a recensire è neutro, senza incentivi né selezione. Il rilievo principale riguarda l'offerta \"Analisi gratuita\", il cui criterio S17 non è ancora confermato dai soci e resta senza marcatore nelle bozze 1, 2 e 5.",
 "rilievi": [
  {
   "gravita": "suggerimento",
   "regola": "codice_consumo",
   "dove": "output.bozze[0].testo",
   "problema": "\"Richiedi l'analisi gratuita della tua presenza online: ti mostriamo da dove partire.\" presenta come certa un'offerta gratuita il cui criterio e le cui condizioni (S17) non sono ancora confermati, e qui manca il marcatore presente solo nell'articolo. Lo stesso vale per output.bozze[1].testo e output.bozze[4].testo.",
   "correzione": "Aggiungere in coda a ciascuna delle tre bozze: \"[DA VERIFICARE criterio e condizioni dell'Analisi gratuita S17, da confermare con i soci prima dell'ok]\"."
  },
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.bozze[2].titolo",
   "problema": "\"Articolo: cosa controlliamo nell'analisi gratuita\" è l'unico titolo senza la marcatura DEMO, mentre le altre quattro bozze la riportano.",
   "correzione": "Sostituire con: \"Articolo DEMO: cosa controlliamo nell'analisi gratuita\"."
  },
  {
   "gravita": "suggerimento",
   "regola": "formato",
   "dove": "output.bozze[2].testo",
   "problema": "\"## Cosa controlliamo [DA VERIFICARE criterio e checklist della prima Analisi gratuita S17, da confermare con Direttore e soci]\" inserisce il marcatore dentro il sottotitolo H2, che finirebbe nell'impaginazione pubblica.",
   "correzione": "Sostituire l'intestazione con \"## Cosa controlliamo\" e collocare il marcatore \"[DA VERIFICARE criterio e checklist della prima Analisi gratuita S17, da confermare con Direttore e soci]\" a inizio del paragrafo successivo."
  }
 ]
}
```

## 18. Qualità e compliance · local

Compito: Controlla l’output di Local SEO e GBP S06 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 38 s · costo 0.0924 USD · esito Qualità: da_correggere

```json
{
 "esito": "da_correggere",
 "sintesi": "Output DEMO da correggere: 0 bloccanti, 2 importanti, 3 suggerimenti. Il rischio principale è la qualificazione 'fatto a mano' riferita a tutti gli articoli senza fonte, insieme alle immagini di gbp-3 che dipendono da foto e liberatoria non ancora disponibili. I 5 controlli automatici sono confermati, incluse le 10 voci [DA VERIFICARE]. Ho verificato anche i 221 giorni dall'ultima foto, i conteggi della sintesi e le date dei post (tutte successive a oggi, 2026-10-08, di martedì). Nessuna azione esterna è dichiarata come compiuta e BigAnt non è presentata come società.",
 "rilievi": [
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.post_gbp[1].testo",
   "problema": "\"Un pezzo fatto a mano ha il carattere di chi lo realizza\" afferma che gli articoli sono realizzati a mano. Il pacchetto non lo conferma per tutti gli articoli: la categoria principale è \"Negozio di articoli da regalo\", quindi parte della merce potrebbe non essere prodotta in laboratorio. Manca il marcatore [DA VERIFICARE].",
   "correzione": "Sostituire con: \"Un pezzo di laboratorio artigiano ha il carattere di chi lo realizza [DA VERIFICARE con il cliente che gli articoli siano realizzati in laboratorio] e racconta qualcosa a chi lo riceve.\" Aggiungere in output.da_verificare: \"[DA VERIFICARE] Il cliente conferma quali articoli sono realizzati in laboratorio e quali sono rivenduti; la conferma vale anche per output.post_gbp[0], [3] e per la descrizione.\""
  },
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.post_gbp[2].testo",
   "problema": "\"Ti mostriamo il lavoro dietro ogni pezzo: le mani, gli strumenti, i tempi giusti\" presuppone foto del laboratorio e persone al lavoro. La condizione (foto e liberatoria) compare solo in sintesi e controlli, non nel testo del post, che potrebbe quindi arrivare in coda senza il vincolo.",
   "correzione": "Anteporre al testo: \"[DA VERIFICARE: pubblicabile solo con foto del laboratorio e liberatoria scritta delle persone ritratte]\". Sostituire l'ultima frase con: \"Vieni a trovarci in bottega e guarda il lavoro da vicino.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "brand_tono",
   "dove": "output.post_gbp[0].cta",
   "problema": "\"Scopri di più\" è una CTA generica, ripetuta identica nei 4 post, e il tono del registro corporate high-end richiede un invito più deciso.",
   "correzione": "Sostituire con: \"Visita il sito · https://bottega-aurora.example/ (DEMO)\" in gbp-1, \"Scegli il tuo pezzo · https://bottega-aurora.example/ (DEMO)\" in gbp-2, \"Vieni in bottega · https://bottega-aurora.example/ (DEMO)\" in gbp-3 e gbp-4."
  },
  {
   "gravita": "suggerimento",
   "regola": "veridicita",
   "dove": "output.post_gbp[0].testo",
   "problema": "\"Scopri sul nostro sito chi siamo e che cosa creiamo\" presuppone una sezione del sito con quei contenuti, ma il pacchetto riporta del sito solo nome, indirizzo, telefono, orari ed email.",
   "correzione": "Sostituire con: \"Visita il sito e scopri le nostre ceramiche.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "veridicita",
   "dove": "output.controlli[1].correzione_proposta",
   "problema": "\"ti spieghiamo come nascono e ti aiutiamo a scegliere\" nella descrizione GBP descrive un servizio di accompagnamento che il pacchetto non documenta.",
   "correzione": "Sostituire la frase con: \"Passa a trovarci: ti mostriamo i pezzi e ti aiutiamo a scegliere quello adatto alla tua casa o a chi vuoi sorprendere [DA VERIFICARE con il cliente].\""
  }
 ]
}
```

## 19. Reputazione e recensioni S08 · local

Compito: Prepara le risposte a tutte le recensioni DEMO di Bottega Aurora DEMO (S08) e il kit di raccolta.

Stato: In attesa di approvazione · motore claude-code · durata 111 s · costo 0.2150 USD · esito Qualità: approvabile

```json
{
 "sintesi": "Bottega Aurora DEMO: 4 recensioni DEMO, 3 positive e 1 negativa (ba-r3, Google 2/5, orari del sito errati) con avviso immediato. Tutte e 4 sono oltre le 48 ore S08 (6, 13, 18 e 28 giorni); ba-r4 ha già una risposta. Il kit di raccolta è pronto. Serve l'ok del cliente sulla risposta a ba-r3 e la correzione degli orari via S06 prima della pubblicazione.",
 "risposte": [
  {
   "recensione_id": "ba-r1",
   "priorita": "bassa",
   "sentiment": "positiva",
   "risposta": "Un servizio di piatti fatto a mano merita di arrivare a casa con la stessa cura con cui è nato. Lo lavoriamo con le mani, un pezzo alla volta, dando alla materia il tempo che chiede. Siamo felici che il confezionamento ti abbia convinto. Passa in bottega: il prossimo pezzo ti aspetta.",
   "nota_interna": "Voto 5/5 del 2026-10-02 (DEMO): 6 giorni senza risposta, oltre le 48 ore S08. Nessuna criticità. Serve l'ok di un socio; la pubblicazione spetta ai soci.",
   "serve_ok_cliente": false
  },
  {
   "recensione_id": "ba-r2",
   "priorita": "media",
   "sentiment": "positiva",
   "risposta": "Pezzi unici, sì: ognuno nasce dalle nostre mani, con il tempo e la materia che richiede. Capiamo che il prezzo possa farsi sentire e ti ringraziamo per aver riconosciuto la qualità. Se hai in mente qualcosa di preciso, scrivici per un pezzo su misura: ne parliamo insieme, senza fretta.",
   "nota_interna": "Voto 4/5 del 2026-09-25 (DEMO): 13 giorni senza risposta, oltre le 48 ore S08. Critica sul prezzo: nessuna giustificazione né sconto in pubblico, nel pacchetto non ci sono dati sui costi. Serve l'ok di un socio.",
   "serve_ok_cliente": false
  },
  {
   "recensione_id": "ba-r3",
   "priorita": "alta",
   "sentiment": "negativa",
   "risposta": "Trovare chiusa la bottega alle 19:45, con un orario diverso letto sul sito, è un'esperienza che ci dispiace e che non vogliamo far vivere a chi viene a trovarci. Vogliamo capire con precisione cosa è successo: scrivici a [contatto DA VERIFICARE] e ne parliamo direttamente con chi gestisce la bottega. Ci teniamo che la prossima visita sia all'altezza del tempo che dedichi a venirci a trovare.",
   "nota_interna": "Voto 2/5 del 2026-09-20 (DEMO): 18 giorni senza risposta, oltre le 48 ore S08. Segnala un orario errato sul sito: correzione via S06 (responsabile S06 [DA VERIFICARE], dopo ok), da fare prima di pubblicare. Verificare gli orari reali. Nessuna ammissione né omaggio in pubblico. Approva il cliente.",
   "serve_ok_cliente": true
  },
  {
   "recensione_id": "ba-r4",
   "priorita": "bassa",
   "sentiment": "positiva",
   "risposta": "Vedere i bambini lavorare la materia con le mani, senza fretta, è la parte del laboratorio che amiamo di più. Grazie per averlo raccontato con parole così belle. Passa in bottega: ci fa piacere ritrovarti e farti vedere cosa stiamo preparando con le nostre mani.",
   "nota_interna": "Risposta già presente: nessun secondo commento; bozza da usare solo se il cliente sceglie di sostituirla. Voto 5/5 del 2026-09-10 (DEMO) su Facebook, 28 giorni.",
   "serve_ok_cliente": false
  }
 ],
 "avvisi": [
  "AVVISO IMMEDIATO · ba-r3 · Google 2/5 del 2026-09-20 · orari del sito errati · da inoltrare a socio e cliente, serve l'ok sulla risposta (DEMO)"
 ],
 "kit_raccolta": {
  "messaggio_whatsapp": "Grazie per essere passato in Bottega Aurora DEMO: da noi ogni pezzo nasce dalle mani e dal tempo, e il tuo parere ci aiuta a capire cosa funziona e cosa possiamo migliorare. Se ti va, racconta com'è andata con un parere sincero: [DA VERIFICARE: link breve alla recensione della scheda Google]. Ci vuole un minuto. Se preferisci non ricevere altri messaggi, rispondi NO.",
  "testo_qr": "Com'è andata in bottega? Lasciaci un parere sincero su Google. [QR: link recensione DA VERIFICARE]",
  "istruzioni_staff": "1. Chiedi il parere a fine servizio, a tutti i clienti che hanno dato il consenso a essere contattati, senza scegliere solo i più soddisfatti.\n2. Di' in modo semplice: \"Ci farebbe piacere un tuo parere sincero su com'è andata\".\n3. Vietato offrire sconti, omaggi, buoni o concorsi in cambio di una recensione, e suggerire il voto.\n4. Vietato scrivere recensioni per conto dei clienti, usare i dispositivi della bottega per lasciarle o chiederle a familiari e colleghi.\n5. Se il cliente dice no, rispetta la scelta: non insistere e non richiedere.\n6. Non chiedere mai di modificare o togliere una recensione negativa, nemmeno offrendo un rimedio. Se un cliente è scontento, ascoltalo e avvisa il referente [DA VERIFICARE] per il canale privato: resta libero di lasciare la sua recensione.\n7. Registra il consenso WhatsApp nel registro dei consensi [DA VERIFICARE] prima di inviare il messaggio."
 },
 "da_verificare": [
  "[DA VERIFICARE] Contatto per il canale privato (telefono o email) da inserire nella risposta a ba-r3: lo fornisce il cliente.",
  "[DA VERIFICARE] Link breve alla recensione della scheda Google per messaggio WhatsApp e QR: lo forniscono i soci.",
  "[DA VERIFICARE] Registro dei consensi WhatsApp e luogo in cui lo staff registra il consenso: lo indica il cliente.",
  "[DA VERIFICARE] Orari di apertura reali del sabato e orari pubblicati sul sito e sulla scheda: li conferma il cliente.",
  "[DA VERIFICARE] Chi esegue la correzione degli orari via S06: lo indicano i soci.",
  "[DA VERIFICARE] Chi approva la risposta alla recensione negativa ba-r3 (ok del cliente, nome e data) e chi approva le altre (un socio).",
  "[DA VERIFICARE] Referente della bottega per il canale privato indicato nelle istruzioni staff: lo indica il cliente.",
  "[DA VERIFICARE] Firma delle risposte: se il cliente vuole una firma, la indica lui; BigAnt non firma.",
  "[DA VERIFICARE] Pubblicazione bloccata nel prototipo (GBP API non collegata): la gestiscono i soci dopo l'ok."
 ],
 "fonti_usate": [
  "pacchetto.oggi",
  "pacchetto.cliente",
  "pacchetto.tono",
  "pacchetto.regole[0]",
  "pacchetto.regole[1]",
  "pacchetto.regole[2]",
  "pacchetto.recensioni[0].testo",
  "pacchetto.recensioni[0].risposta_presente",
  "pacchetto.recensioni[1].testo",
  "pacchetto.recensioni[1].risposta_presente",
  "pacchetto.recensioni[2].testo",
  "pacchetto.recensioni[2].risposta_presente",
  "pacchetto.recensioni[3].testo",
  "pacchetto.recensioni[3].risposta_presente",
  "pacchetto.recensioni[0].voto",
  "pacchetto.recensioni[0].data",
  "pacchetto.recensioni[1].voto",
  "pacchetto.recensioni[1].data",
  "pacchetto.recensioni[2].voto",
  "pacchetto.recensioni[2].data",
  "pacchetto.recensioni[2].piattaforma",
  "pacchetto.recensioni[3].voto",
  "pacchetto.recensioni[3].data",
  "pacchetto.recensioni[3].piattaforma"
 ]
}
```

## 20. Qualità e compliance · local

Compito: Controlla l’output di Reputazione e recensioni S08 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 36 s · costo 0.0805 USD · esito Qualità: da_correggere

```json
{
 "esito": "da_correggere",
 "sintesi": "Output DEMO da correggere: 0 bloccanti, 2 importanti, 2 suggerimenti. Il rischio principale è una nota interna di ba-r1 con data troncata (\"2026-09-...\") e un nome operativo (\"Vincenzo\") assente dal pacchetto e senza [DA VERIFICARE]. I 7 controlli automatici sono confermati: nessuna promessa assoluta, nessuna azione esterna dichiarata, 4 risposte per 4 recensioni DEMO, ok del cliente richiesto su ba-r3. Ho ricalcolato i giorni senza risposta (6, 13, 18, 28) e coincidono con `oggi`. Il kit di raccolta rispetta le regole su recensioni e consensi.",
 "rilievi": [
  {
   "gravita": "importante",
   "regola": "formato",
   "dove": "output.risposte[0].nota_interna",
   "problema": "\"Voto 5/5 del 2026-09-... non applicabile: recensione del 2026-10-02\" contiene una data troncata fuori formato YYYY-MM-DD e un testo contraddittorio sulla data della recensione.",
   "correzione": "Sostituire con: \"Voto 5/5 del 2026-10-02 (DEMO): 6 giorni senza risposta, oltre le 48 ore S08. Nessuna criticità. Serve l'ok di un socio; la pubblicazione spetta ai soci.\""
  },
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.risposte[2].nota_interna",
   "problema": "\"Correzione via S06 (Vincenzo, dopo ok)\" cita un nome che non compare in `pacchetto_autore` e non porta [DA VERIFICARE].",
   "correzione": "Sostituire \"(Vincenzo, dopo ok)\" con \"(responsabile S06 [DA VERIFICARE], dopo ok)\" e aggiungere in `da_verificare`: \"[DA VERIFICARE] Chi esegue la correzione degli orari via S06: lo indicano i soci.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "brand_tono",
   "dove": "output.kit_raccolta.istruzioni_staff",
   "problema": "Il punto 6, \"se un cliente è scontento, avvisa chi gestisce la bottega per il canale privato\", può essere letto come deviazione dei clienti scontenti dalla recensione pubblica.",
   "correzione": "Sostituire il punto 6 con: \"6. Non chiedere mai di modificare o togliere una recensione negativa, nemmeno offrendo un rimedio. Se un cliente è scontento, ascoltalo e avvisa il referente [DA VERIFICARE] per il canale privato: resta libero di lasciare la sua recensione.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.fonti_usate",
   "problema": "Le note interne usano voto, data e piattaforma delle recensioni (es. \"Google 2/5 del 2026-09-20\"), ma `fonti_usate` cita solo `testo` e `risposta_presente`.",
   "correzione": "Aggiungere: \"pacchetto.recensioni[0].voto\", \"pacchetto.recensioni[0].data\", \"pacchetto.recensioni[1].voto\", \"pacchetto.recensioni[1].data\", \"pacchetto.recensioni[2].voto\", \"pacchetto.recensioni[2].data\", \"pacchetto.recensioni[2].piattaforma\", \"pacchetto.recensioni[3].voto\", \"pacchetto.recensioni[3].data\", \"pacchetto.recensioni[3].piattaforma\"."
  }
 ]
}
```

## 21. Qualità e compliance · local

Compito: Controlla l’output di Reputazione e recensioni S08 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 24 s · costo 0.0620 USD · esito Qualità: approvabile

```json
{
 "esito": "approvabile",
 "sintesi": "Output DEMO approvabile: 0 bloccanti, 0 importanti, 2 suggerimenti. I 7 controlli automatici sono confermati e integrati dalla verifica manuale: le 4 risposte corrispondono alle 4 recensioni DEMO, i giorni d'attesa (6, 13, 18, 28) coincidono con le date del pacchetto rispetto a oggi 2026-10-08, e le 9 voci [DA VERIFICARE] sono presenti. Il rischio principale resta la risposta a ba-r3, che richiede l'ok del cliente e la correzione degli orari via S06 prima di qualsiasi pubblicazione dei soci. Il kit di raccolta rispetta le regole sulle recensioni: nessun incentivo, nessuna selezione, consenso WhatsApp e opt-out previsti.",
 "rilievi": [
  {
   "gravita": "suggerimento",
   "regola": "brand_tono",
   "dove": "output.risposte[2].risposta",
   "problema": "\"Trovare chiusa la bottega alle 19:45, con un orario diverso letto sul sito\" riporta come fatto accertato l'orario errato, mentre gli orari reali sono ancora [DA VERIFICARE] e la nota interna prescrive \"Nessuna ammissione\".",
   "correzione": "Sostituire la prima frase con: \"Trovare chiusa la bottega all'orario in cui sei passato è un'esperienza che ci dispiace e che non vogliamo far vivere a chi viene a trovarci.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "formato",
   "dove": "output.risposte[2].risposta",
   "problema": "\"[contatto DA VERIFICARE]\" (e \"[QR: link recensione DA VERIFICARE]\" in output.kit_raccolta.testo_qr) non usa il marcatore standard \"[DA VERIFICARE]\" e può sfuggire al controllo automatico dei marcatori.",
   "correzione": "In risposte[2].risposta sostituire con: \"[DA VERIFICARE: contatto]\". In kit_raccolta.testo_qr sostituire con: \"[QR: DA VERIFICARE link recensione]\"."
  }
 ]
}
```

## Azioni esterne bloccate

- Pubblicare sui canali social: LinkedIn agenzia: «Regia unica sui canali (DEMO)» — pubblicazione reale bloccata (Postiz/Meta non collegati)
- Pubblicare sui canali social: Instagram: «Dietro le quinte dello shooting (DEMO)» — pubblicazione reale bloccata (Postiz/Meta non collegati)
- Pubblicare sui canali social: Sito BigAnt: «Articolo: cosa controlliamo nell'analisi gratuita» — pubblicazione reale bloccata (Postiz/Meta non collegati)
- Pubblicare sui canali social: Recensioni e reputazione: «Invito neutro a recensire su Google (DEMO)» — pubblicazione reale bloccata (Postiz/Meta non collegati)
- Pubblicare sui canali social: TikTok: «AI e montaggio: la testa resta umana (DEMO)» — pubblicazione reale bloccata (Postiz/Meta non collegati)
- Pubblicare le risposte alle recensioni: 4 risposte alle recensioni — pubblicazione bloccata (GBP API non collegata)
