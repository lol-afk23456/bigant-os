# Giro dello sciame 97badbc3

- Richiesta: Secondo giro: analisi gratuita di un’azienda DEMO dalla ricerca clienti fino alla bozza di proposta Presenza; piano social S01 di novembre e scheda Google con recensioni di Bottega Aurora DEMO.
- Motore: **Claude Code (sottoagenti .claude/agents, sessione cloud)**
- Stato: completato · inizio 2026-10-08T13:27:51.702Z · fine 2026-10-08T13:34:57.588Z
- Costo dichiarato dal motore: 1.8322 USD (equivalente a listino)
- Flussi eseguiti: commerciale, social, local

I dati di input sono DEMO inventati. Pubblicazioni, invii e modifiche di account sono rimasti bloccati dal codice (elenco in fondo).

## 1. Orchestratore · regia

Compito: Leggi la richiesta dei soci, scegli i flussi da avviare e scrivi il brief per ciascun reparto.

Stato: Completato · motore claude-code · durata 20 s · costo 0.0422 USD

```json
{
 "sintesi": "Avvio commerciale, social e local, in quest'ordine: i tre flussi sono indipendenti e coprono tutta la richiesta. Restano fuori l'invio dell'analisi e della proposta al lead, la modifica della scheda Google e la risposta online alle recensioni, azioni esterne riservate ai soci. Non serve il flusso amministrazione, perché la richiesta non contiene bisogni economici.",
 "piano": [
  {
   "flusso": "commerciale",
   "motivo": "La richiesta chiede l'analisi gratuita dalla ricerca clienti alla bozza di proposta Presenza; pacchetto.flussi_disponibili[2] (commerciale) copre ricerca DEMO, analisi S17 e bozza di proposta.",
   "brief": "Cliente: BigAnt · cliente zero DEMO. Obiettivo: cercare lead DEMO, scegliere un'azienda DEMO motivando la scelta, produrre l'analisi gratuita S17 della sua presenza online e la bozza di proposta del pacchetto Presenza. Periodo: 2026-10-08 → 2026-10-15 (finestra operativa da confermare). Vincoli: solo dati DEMO; nessun contatto con il lead, nessun invio; nessuna promessa di risultato garantito né superlativi; ogni output passa da Qualità prima della coda approvazioni. Consegna in bozza: decide un socio."
  },
  {
   "flusso": "social",
   "motivo": "La richiesta chiede il piano social S01 di novembre per Bottega Aurora DEMO; pacchetto.clienti[1].servizi include social e flussi_disponibili[3] (social) produce piano mensile e post.",
   "brief": "Cliente: Bottega Aurora DEMO. Obiettivo: preparare pilastri, piano mensile e post S01. Periodo: 2026-11-01 → 2026-11-30. Vincoli: solo dati DEMO; nessuna pubblicazione né programmazione; nessuna promessa di risultato garantito, nessun superlativo, nessuna recensione inventata o incentivata; ogni output passa da Qualità prima della coda approvazioni. Consegna in bozza: decide un socio, poi il cliente."
  },
  {
   "flusso": "local",
   "motivo": "La richiesta chiede la scheda Google con recensioni di Bottega Aurora DEMO; pacchetto.clienti[1].servizi include local e flussi_disponibili[4] (local) copre scheda Google S06 e recensioni S08.",
   "brief": "Cliente: Bottega Aurora DEMO. Obiettivo: controllare la scheda Google (S06), elencare le correzioni proposte e preparare bozze di post GBP e bozze di risposta alle recensioni (S08). Periodo: 2026-10-08 → 2026-10-15 (finestra operativa da confermare). Vincoli: solo dati DEMO; nessuna modifica alla scheda, nessuna risposta online; nessuna recensione inventata o incentivata; nessuna promessa di risultato garantito né superlativo; ogni output passa da Qualità prima della coda approvazioni. Consegna in bozza: decide un socio."
  }
 ],
 "escluso": [
  {
   "richiesta": "Invio o consegna dell'analisi gratuita e della proposta Presenza al lead",
   "motivo": "Inviare è un'azione esterna riservata ai soci, bloccata dal codice (pacchetto.vincoli[0]): il flusso commerciale consegna analisi e proposta in bozza per l'approvazione."
  },
  {
   "richiesta": "Intervento diretto sulla scheda Google e risposta pubblica alle recensioni di Bottega Aurora DEMO",
   "motivo": "Modificare account o schede e rispondere online sono azioni vietate agli agenti (pacchetto.vincoli[0]): il flusso local consegna correzioni proposte e bozze di risposta ai soci."
  }
 ],
 "da_verificare": [
  "[DA VERIFICARE] azienda DEMO per l'analisi gratuita: la richiesta non la nomina né indica settore o zona di ricerca.",
  "[DA VERIFICARE] periodo del flusso commerciale: la richiesta non indica scadenze; la finestra 2026-10-08 → 2026-10-15 è una proposta operativa.",
  "[DA VERIFICARE] periodo del flusso local: la richiesta non indica date; la finestra 2026-10-08 → 2026-10-15 è una proposta operativa.",
  "[DA VERIFICARE] ambito 'scheda Google con recensioni': la richiesta non specifica se servono solo controllo e bozze di risposta o anche post GBP.",
  "[DA VERIFICARE] obiettivi numerici: la richiesta non indica target per piano social, scheda Google o recensioni."
 ]
}
```

## 2. Produzione social S01 · social

Compito: Prepara il piano editoriale S01 di novembre 2026 per Bottega Aurora DEMO con i testi dei post.

Stato: Fermato da Qualità · motore claude-code · durata 188 s · costo 0.3361 USD · esito Qualità: da_correggere

```json
{
 "sintesi": "Bottega Aurora DEMO, novembre 2026: piano di 8 contenuti, di cui 2 Reel, su Instagram e Facebook, costruito su 4 pilastri. Ogni evento DEMO (14 e 28 novembre) ha un annuncio e un promemoria nei giorni precedenti. Servono prima l'ok di un socio e poi quello del cliente; luogo, orari e modalità degli eventi restano [DA VERIFICARE]. La consegna è nei termini, perché il piano arriva prima del 20 ottobre.",
 "mese": "novembre 2026",
 "pilastri": [
  "Mani e materia — mostrare il processo e il tempo che serve",
  "Persone — le mani dietro ogni pezzo e chi lo sceglie",
  "Regali e casa — ceramiche e oggetti per la casa da regalare",
  "Appuntamenti — laboratorio aperto e anteprima natalizia (DEMO)"
 ],
 "piano": [
  {
   "data": "2026-11-03",
   "canale": "Instagram",
   "formato": "Carosello",
   "tema": "Mani e materia · Dall'argilla al pezzo, passo dopo passo"
  },
  {
   "data": "2026-11-06",
   "canale": "Facebook",
   "formato": "Post",
   "tema": "Persone · Le mani che sanno aspettare"
  },
  {
   "data": "2026-11-10",
   "canale": "Instagram",
   "formato": "Reel",
   "tema": "Appuntamenti · Laboratorio aperto, dimostrazione al tornio, sabato 14"
  },
  {
   "data": "2026-11-13",
   "canale": "Facebook",
   "formato": "Post",
   "tema": "Mani e materia · L'argilla non si affretta"
  },
  {
   "data": "2026-11-17",
   "canale": "Instagram",
   "formato": "Post",
   "tema": "Regali e casa · Un regalo fatto a mano che racconta qualcosa"
  },
  {
   "data": "2026-11-20",
   "canale": "Facebook",
   "formato": "Post",
   "tema": "Persone · Chi regala un pezzo fatto a mano"
  },
  {
   "data": "2026-11-24",
   "canale": "Instagram",
   "formato": "Reel",
   "tema": "Appuntamenti · Anteprima collezione natalizia, sabato 28"
  },
  {
   "data": "2026-11-27",
   "canale": "Facebook",
   "formato": "Post",
   "tema": "Appuntamenti · Promemoria anteprima natalizia, domani"
  }
 ],
 "post": [
  {
   "id": "post-1",
   "canale": "Instagram",
   "formato": "Carosello",
   "data_proposta": "2026-11-03",
   "titolo": "Dall'argilla al pezzo (carosello)",
   "testo": "Prima di diventare un oggetto per la casa, è solo argilla e tempo.\n\nNel carosello seguiamo un pezzo dall'inizio: la materia, le mani, l'attesa. Ogni passaggio ha il suo ritmo e non si accelera.\n\nLavoriamo così perché un oggetto fatto con cura merita di trovare il suo posto in casa tua.\n\nScorri e guarda come nasce. Poi passa in bottega.\n\n#SanMarcoEvangelista #Caserta #CeramicaArtigianale #FattoAMano",
   "cta": "Passa in bottega",
   "brief_visivo": "Carosello 4:5 1080×1350, 5 slide, grafica di Alfonso. Slide 1: testo 'Argilla e tempo' su foto della materia grezza. Slide 2: 'La materia', mani che lavorano l'argilla. Slide 3: 'Le mani', il pezzo prende forma. Slide 4: 'L'attesa', il pezzo a riposo, testo 'Ogni passaggio ha il suo ritmo'. Slide 5: 'Il pezzo', oggetto finito con testo 'Passa in bottega'. Inquadrature ravvicinate, luce naturale laterale. Materiale: foto del cliente oppure giornata di shooting con Enzo [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Nessuna musica. Liberatoria per ogni persona riconoscibile."
  },
  {
   "id": "post-2",
   "canale": "Facebook",
   "formato": "Post",
   "data_proposta": "2026-11-06",
   "titolo": "Le mani che sanno aspettare",
   "testo": "Dietro ogni pezzo ci sono mani che sanno aspettare.\n\nIn bottega lavoriamo la materia con le mani e con il tempo che serve. Non ci sono scorciatoie: c'è attenzione, un gesto dopo l'altro.\n\nDall'altra parte ci sei tu: famiglie e chi cerca un regalo fatto a mano. Raccontaci per chi stai cercando e ti aiutiamo a scegliere.\n\nScrivici per un pezzo su misura. Canale di contatto [DA VERIFICARE].\n\n#SanMarcoEvangelista #Caserta #FattoAMano #RegaloUnico",
   "cta": "Scrivici per un pezzo su misura",
   "brief_visivo": "Post feed 4:5 1080×1350, grafica di Alfonso. Soggetto: primo piano di mani che lavorano l'argilla, luce naturale laterale, sfondo neutro. Testo in sovraimpressione: 'Mani che sanno aspettare'. Materiale: foto del cliente oppure shooting con Enzo [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Liberatoria se il volto di una persona è riconoscibile."
  },
  {
   "id": "post-3",
   "canale": "Instagram",
   "formato": "Reel",
   "data_proposta": "2026-11-10",
   "titolo": "Annuncio laboratorio aperto 14/11 (DEMO)",
   "testo": "Un blocco d'argilla, due mani, il tempo giusto.\n\nSabato 14 novembre apriamo il laboratorio e ti mostriamo la dimostrazione al tornio. (evento DEMO)\n\nPassa in bottega. Luogo, orari e modalità dell'evento [DA VERIFICARE].\n\n#SanMarcoEvangelista #Caserta #CeramicaArtigianale",
   "cta": "Passa in bottega",
   "brief_visivo": "Reel 9:16 1080×1920, 20 s, produzione di Raffaele ed Enzo. Storyboard: 0-2 s gancio, mani sull'argilla bagnata in primo piano, testo 'Sabato 14'. 2-12 s la forma prende vita al tornio, luce naturale laterale, testo 'Dimostrazione al tornio'. 12-20 s pezzo finito sul piano di lavoro, testo 'Laboratorio aperto del sabato (DEMO)'. Sottotitoli sempre attivi. Luogo e orari non vanno nel video finché non sono confermati [DA VERIFICARE]. Materiale: riprese in bottega, giornata di shooting [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Musica con licenza [DA VERIFICARE]. Liberatoria per le persone riconoscibili."
  },
  {
   "id": "post-4",
   "canale": "Facebook",
   "formato": "Post",
   "data_proposta": "2026-11-13",
   "titolo": "L'argilla non si affretta",
   "testo": "L'argilla non si affretta, e noi con lei.\n\nOgni pezzo passa da fasi che chiedono pazienza: la forma, l'attesa, la rifinitura. Saltarle vuol dire rinunciare alla cura che mettiamo in ciò che facciamo.\n\nLavoriamo con le mani, la materia e il tempo: tre ingredienti che non si comprano e non si comprimono.\n\nPassa in bottega e guarda la materia da vicino.\n\n#SanMarcoEvangelista #Caserta #FattoAMano #CeramicaArtigianale",
   "cta": "Passa in bottega",
   "brief_visivo": "Post feed 4:5 1080×1350, grafica di Alfonso. Soggetto: un pezzo a riposo accanto all'argilla grezza, inquadratura dall'alto leggermente inclinata, luce naturale morbida. Testo in sovraimpressione: 'L'argilla non si affretta'. Materiale: foto del cliente oppure shooting con Enzo [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Nessuna persona riconoscibile in scena, altrimenti serve la liberatoria."
  },
  {
   "id": "post-5",
   "canale": "Instagram",
   "formato": "Post",
   "data_proposta": "2026-11-17",
   "titolo": "Regalo fatto a mano per la casa",
   "testo": "Cerchi un regalo che racconti qualcosa?\n\nLe nostre ceramiche e i nostri oggetti per la casa nascono in bottega, con le mani e la materia che scegliamo. Ognuno ha la sua forma e il suo carattere.\n\nPer una casa nuova, per una ricorrenza, per una persona a cui tieni: se hai un'idea precisa, parliamone.\n\nScrivici per un pezzo su misura. Canale di contatto [DA VERIFICARE].\n\n#SanMarcoEvangelista #Caserta #RegaloUnico #CeramicaArtigianale #OggettiPerLaCasa",
   "cta": "Scrivici per un pezzo su misura",
   "brief_visivo": "Post feed 4:5 1080×1350, grafica di Alfonso. Soggetto: due o tre ceramiche e oggetti per la casa disposti su un piano in legno, inquadratura frontale, luce naturale laterale. Testo in sovraimpressione: 'Un regalo fatto a mano'. Nessun prezzo. Materiale: foto dei pezzi forniti dal cliente oppure shooting con Enzo [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Nessuna persona riconoscibile in scena."
  },
  {
   "id": "post-6",
   "canale": "Facebook",
   "formato": "Post",
   "data_proposta": "2026-11-20",
   "titolo": "Chi regala un pezzo fatto a mano",
   "testo": "Chi regala un pezzo fatto a mano regala anche tempo.\n\nPer noi è la parte più bella: sapere che un oggetto nato in bottega entra in una casa, in una famiglia, in una giornata speciale.\n\nRaccontaci nei commenti: qual è l'oggetto fatto a mano a cui sei più legato? Ci piace conoscere chi sceglie il nostro lavoro.\n\nPassa in bottega e raccontacelo di persona.\n\n#SanMarcoEvangelista #Caserta #FattoAMano #RegaloUnico",
   "cta": "Passa in bottega",
   "brief_visivo": "Post feed 4:5 1080×1350, grafica di Alfonso. Soggetto: un oggetto in ceramica incartato o appoggiato su un tavolo, con due mani che lo porgono, volti fuori inquadratura. Luce calda naturale. Testo in sovraimpressione: 'Regalare tempo'. Materiale: foto del cliente oppure shooting con Enzo [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Liberatoria per ogni persona riconoscibile; minori mai riconoscibili senza consenso scritto dei genitori."
  },
  {
   "id": "post-7",
   "canale": "Instagram",
   "formato": "Reel",
   "data_proposta": "2026-11-24",
   "titolo": "Annuncio anteprima natalizia 28/11 (DEMO)",
   "testo": "Sabato 28 novembre: l'anteprima della collezione natalizia.\n\nPreparamo i pezzi con le mani e con il tempo che serve. Vieni a vederli in anteprima. (evento DEMO)\n\nPassa in bottega. Luogo, orari e modalità dell'evento [DA VERIFICARE].\n\n#SanMarcoEvangelista #Caserta #CollezioneNatalizia",
   "cta": "Passa in bottega",
   "brief_visivo": "Reel 9:16 1080×1920, 20 s, produzione di Raffaele ed Enzo. Storyboard: 0-2 s gancio, dettaglio di un pezzo della collezione, testo 'Sabato 28'. 2-12 s mani che rifiniscono e dispongono i pezzi, luce calda laterale, testo 'Anteprima collezione natalizia (DEMO)'. 12-20 s carrellata lenta sui pezzi disposti, testo finale 'Passa in bottega'. Sottotitoli sempre attivi. I pezzi della collezione vanno indicati dal cliente [DA VERIFICARE]. Luogo e orari non vanno nel video finché non sono confermati [DA VERIFICARE]. Materiale: riprese in bottega, giornata di shooting [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Musica con licenza [DA VERIFICARE]. Liberatoria per le persone riconoscibili."
  },
  {
   "id": "post-8",
   "canale": "Facebook",
   "formato": "Post",
   "data_proposta": "2026-11-27",
   "titolo": "Promemoria anteprima natalizia (DEMO)",
   "testo": "Domani, sabato 28 novembre, l'anteprima della collezione natalizia.\n\nOgni pezzo nasce da mani, materia e tempo, tre cose che non si hanno mai in fretta. Se cerchi un regalo di Natale per la famiglia, puoi guardarli da vicino. (evento DEMO)\n\nPassa in bottega. Luogo, orari e modalità dell'evento [DA VERIFICARE].\n\n#SanMarcoEvangelista #Caserta #CollezioneNatalizia #RegaloUnico",
   "cta": "Passa in bottega",
   "brief_visivo": "Post feed 4:5 1080×1350, grafica di Alfonso. Soggetto: pezzi della collezione natalizia disposti su un piano, inquadratura frontale, luce calda naturale. Testo in sovraimpressione: 'Domani · Anteprima collezione natalizia (DEMO)'. Luogo e orari solo dopo conferma [DA VERIFICARE]. Materiale: foto dei pezzi forniti dal cliente oppure shooting con Enzo [DA VERIFICARE]. Palette e logo del cliente [DA VERIFICARE palette cliente]. Nessuna persona riconoscibile in scena, altrimenti serve la liberatoria."
  }
 ],
 "da_verificare": [
  "[DA VERIFICARE] Scheda DNA: il cliente conferma che la scheda DEMO è approvata e completa, hashtag inclusi (cliente, via socio).",
  "[DA VERIFICARE] Evento 14 novembre, laboratorio aperto con dimostrazione al tornio: luogo, orari e modalità (cliente).",
  "[DA VERIFICARE] Evento 28 novembre, anteprima collezione natalizia: luogo, orari, modalità e quali pezzi presentare (cliente).",
  "[DA VERIFICARE] Conferma che i due eventi DEMO restano invariati nelle date indicate (cliente).",
  "[DA VERIFICARE] Canale di contatto per la CTA 'Scrivici per un pezzo su misura': link, telefono o messaggio (cliente).",
  "[DA VERIFICARE] Palette e logo del cliente per tutte le grafiche (cliente, per Alfonso).",
  "[DA VERIFICARE] Foto e video: materiale già in possesso del cliente o giornata di shooting in bottega con Enzo e Raffaele, da fissare (cliente e soci).",
  "[DA VERIFICARE] Liberatorie per persone riconoscibili e consenso scritto dei genitori per eventuali minori (cliente).",
  "[DA VERIFICARE] Musica con licenza per i due Reel (Raffaele).",
  "[DA VERIFICARE] Cancello umano: ok di un socio e poi del cliente, con nome e data, prima di qualsiasi programmazione (soci e cliente)."
 ],
 "fonti_usate": [
  "pacchetto.oggi",
  "pacchetto.mese",
  "pacchetto.cliente",
  "pacchetto.squadra_bigant",
  "pacchetto.pacchetto.nome",
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

## 3. Local SEO e GBP S06 · local

Compito: Controlla la scheda Google di Bottega Aurora DEMO (S06), segnala le incoerenze con il sito e prepara 4 post GBP del mese.

Stato: In attesa di approvazione · motore claude-code · durata 166 s · costo 0.3031 USD · esito Qualità: approvabile

```json
{
 "sintesi": "Bottega Aurora DEMO: 9 voci controllate, 1 ok, 6 da correggere, 2 mancanti; 3 incoerenze NAP (indirizzo, telefono, orari). Le urgenze sono la descrizione assente e le foto ferme al 2026-03-01 (DEMO). I 4 post sono pronti e non citano orari, telefono o indirizzo finché il cliente non conferma i valori. Serve l'ok del socio per l'esecuzione di Vincenzo su GBP OPS.",
 "controlli": [
  {
   "voce": "Categorie principale e secondarie",
   "stato": "da_correggere",
   "dettaglio": "Principale «Negozio di articoli da regalo», secondaria «Laboratorio di ceramica» (DEMO). Il cliente è un laboratorio artigiano di ceramiche: la principale potrebbe non descrivere l'attività da far trovare.",
   "correzione_proposta": "Modifica 8 di 8, rischio alto, ultima della sequenza e distanziata dalle altre modifiche sensibili. Nessun cambio della principale senza decisione di un socio e conferma del cliente: i soci valutano se «Laboratorio di ceramica» debba diventare principale. Nomi esatti nell'elenco ufficiale Google [DA VERIFICARE nell'elenco Google]. Eventuali secondarie aggiuntive solo se confermate dal cliente [DA VERIFICARE]."
  },
  {
   "voce": "Descrizione",
   "stato": "mancante",
   "dettaglio": "Campo descrizione vuoto (DEMO).",
   "correzione_proposta": "Modifica 1 di 8, basso rischio. Dopo l'ok Vincenzo inserisce: \"Bottega Aurora a San Marco Evangelista è un laboratorio artigiano di ceramiche e oggetti per la casa. In bottega trovi pezzi pensati per accompagnare la vita di ogni giorno e per diventare un regalo con una storia, perché dietro ogni oggetto c'è un lavoro di mani e di cura. Vieni a vedere da vicino materiali e forme, chiedi consiglio a chi li realizza e scegli con calma ciò che fa per la tua casa o per una persona a cui tieni. Puoi pagare anche con carta. (DEMO)\" Prima dell'inserimento il cliente conferma lavorazioni e provenienza [DA VERIFICARE]."
  },
  {
   "voce": "Servizi e attributi",
   "stato": "da_correggere",
   "dettaglio": "Servizi non elencati (servizi_elencati: falso). Attributi: solo «Pagamento con carta (DEMO)». Altri attributi non rilevati.",
   "correzione_proposta": "Modifica 2 di 8, basso rischio. Dopo l'ok Vincenzo elenca i servizi: «Vendita di ceramiche artigianali», «Oggetti per la casa», «Idee regalo». Gli altri servizi, come personalizzazioni, confezione regalo o ordini su misura, restano [DA VERIFICARE con il cliente]. Mantiene l'attributo «Pagamento con carta». Ogni altro attributo, come accessibilità o ritiro in negozio, è [DA VERIFICARE con il cliente]."
  },
  {
   "voce": "Foto aggiornate",
   "stato": "da_correggere",
   "dettaglio": "9 foto; ultima 2026-03-01 (DEMO), 221 giorni prima di oggi, oltre la soglia di aggiornamento foto [DA VERIFICARE soglia nel playbook S06]. Le serie presenti non sono rilevate.",
   "correzione_proposta": "Modifica 3 di 8, basso rischio. Dopo l'ok Vincenzo aggiunge le foto nuove consegnate. Serie da produrre: esterno con insegna, interno della bottega, prodotti (ceramiche e oggetti per la casa), persone al lavoro in laboratorio con liberatoria firmata. Chi scatta e quando: [DA VERIFICARE con Enzo e il cliente]. Nessuna foto senza liberatoria."
  },
  {
   "voce": "Orari, anche festivi",
   "stato": "da_correggere",
   "dettaglio": "Scheda: «Mar–Sab 9:30–13:00, 16:00–20:00; domenica non indicata (DEMO)». Sito: «Mar–Sab 9:30–13:00, 16:00–19:30 (DEMO)». Chiusura serale diversa; domenica, lunedì e festivi non definiti.",
   "correzione_proposta": "Modifica 5 di 8, sensibile. Nessuna modifica prima della conferma del cliente sugli orari corretti, compresi domenica, lunedì e festivi [DA VERIFICARE]. Poi, dopo l'ok, Vincenzo inserisce gli orari confermati e gli eventuali orari speciali in una sessione separata dalle Modifiche 6, 7 e 8. Il sito va allineato [DA VERIFICARE chi lo gestisce]."
  },
  {
   "voce": "Domande e risposte",
   "stato": "mancante",
   "dettaglio": "domande_e_risposte: 0 (DEMO). Nessuna domanda sulla scheda.",
   "correzione_proposta": "Modifica 4 di 8, basso rischio [DA VERIFICARE disponibilità della funzione sulla scheda]. Dopo l'ok Vincenzo inserisce tre coppie. 1) D: \"Che cos'è Bottega Aurora?\" R: \"Un laboratorio artigiano di ceramiche e oggetti per la casa a San Marco Evangelista. (DEMO)\" 2) D: \"Posso trovare un'idea regalo?\" R: \"Sì, tra ceramiche e oggetti per la casa trovi idee regalo; in bottega ti consigliamo. (DEMO)\" 3) D: \"Posso pagare con carta?\" R: \"Sì, il pagamento con carta è disponibile. (DEMO)\""
  },
  {
   "voce": "Coerenza NAP con il sito",
   "stato": "da_correggere",
   "dettaglio": "Nome coincide. Differenze: indirizzo («5» contro «5/A»), telefono (…222 contro …223), orari (chiusura 20:00 contro 19:30). Tre incoerenze (DEMO).",
   "correzione_proposta": "Nessuna modifica prima della conferma del cliente, che indica i valori corretti con documento o insegna. Poi, dopo l'ok: Modifica 6 di 8 telefono e Modifica 7 di 8 indirizzo, ciascuna in una sessione separata e distanziata dalle altre modifiche sensibili, comprese orari (Modifica 5) e categorie (Modifica 8). L'intervallo lo fissano i soci con Vincenzo [DA VERIFICARE]. Gli orari sono nella Modifica 5. Il sito va allineato [DA VERIFICARE chi lo gestisce]."
  },
  {
   "voce": "Post settimanali o mensili",
   "stato": "da_correggere",
   "dettaglio": "post_ultimi_90_giorni: 1 (DEMO), contro i 12 attesi con 4 post al mese (Gestione S06). Ritmo insufficiente.",
   "correzione_proposta": "Fuori dalla sequenza delle modifiche alla scheda. Dopo l'ok di un socio e il controllo Qualità, Vincenzo inserisce i 4 post in bozza (gbp-1…gbp-4) nelle date indicate, una per settimana. Foto abbinate a ciascun post [DA VERIFICARE con Enzo o il cliente]."
  },
  {
   "voce": "Collegamento al sito e prenotazione",
   "stato": "ok",
   "dettaglio": "URL https://bottega-aurora.example/ (DEMO), dominio coerente con l'email del sito ciao@bottega-aurora.example. Prenotazione non rilevata.",
   "correzione_proposta": "Nessuna modifica. Il link risponde e punta alla pagina giusta [DA VERIFICARE]. Il pulsante di prenotazione non è pertinente per un negozio-laboratorio, salvo attività su appuntamento [DA VERIFICARE con il cliente]."
  }
 ],
 "incoerenze_nap": [
  {
   "campo": "indirizzo",
   "scheda": "Corso Italia 5, San Marco Evangelista (DEMO)",
   "sito": "Corso Italia 5/A, San Marco Evangelista (DEMO)",
   "proposta": "Il cliente conferma il civico corretto con documento o insegna. Vincenzo allinea la scheda dopo l'ok (Modifica 7 di 8, sessione separata); il sito lo aggiorna [DA VERIFICARE chi lo gestisce]. Se resta incoerente, rischio di verifica o sospensione e di indicazioni stradali errate. Nessun post cita l'indirizzo."
  },
  {
   "campo": "telefono",
   "scheda": "0823 111 222 (DEMO)",
   "sito": "0823 111 223 (DEMO)",
   "proposta": "Il cliente conferma il numero attivo. Vincenzo allinea la scheda dopo l'ok (Modifica 6 di 8, sessione separata); il sito lo aggiorna [DA VERIFICARE chi lo gestisce]. Se resta incoerente, i clienti chiamano un numero sbagliato e la scheda perde affidabilità. Nessun post cita il telefono."
  },
  {
   "campo": "orari",
   "scheda": "Mar–Sab 9:30–13:00, 16:00–20:00; domenica non indicata (DEMO)",
   "sito": "Mar–Sab 9:30–13:00, 16:00–19:30 (DEMO)",
   "proposta": "Il cliente conferma gli orari reali, compresi domenica, lunedì e festivi. Vincenzo allinea la scheda dopo l'ok (Modifica 5 di 8); il sito lo aggiorna [DA VERIFICARE chi lo gestisce]. Se resta incoerente, clienti davanti a una porta chiusa e recensioni negative. Nessun post cita gli orari."
  }
 ],
 "post_gbp": [
  {
   "id": "gbp-1",
   "titolo": "Dove nascono ceramiche e oggetti per la casa",
   "testo": "A San Marco Evangelista, Bottega Aurora è il laboratorio artigiano dove nascono ceramiche e oggetti per la casa. Ogni pezzo prende forma tra le nostre mani, con attenzione ai dettagli e alla funzione che avrà nella tua quotidianità. Passa in bottega: puoi vedere da vicino forme e finiture, toccare i materiali e chiedere a chi li realizza come usarli e prendersene cura. Ti aspettiamo per scegliere con calma l'oggetto giusto per la tua casa. Lavorazioni e materiali [DA VERIFICARE con il cliente]. (DEMO)",
   "cta": "Scopri di più · https://bottega-aurora.example/ (DEMO)",
   "data_proposta": "2026-10-10"
  },
  {
   "id": "gbp-2",
   "titolo": "Idee regalo in ceramica artigianale",
   "testo": "Bottega Aurora, a San Marco Evangelista, ti aiuta a trovare un regalo che racconta qualcosa: ceramiche e oggetti per la casa nati in laboratorio, pensati per essere usati e tenuti con cura. Se cerchi un pensiero per una persona a cui tieni, vieni in bottega: ti consigliamo in base a chi lo riceverà e agli spazi in cui vivrà, e ti raccontiamo come nascono [DA VERIFICARE lavorazioni e provenienza con il cliente]. Confezione regalo e personalizzazioni [DA VERIFICARE con il cliente]. (DEMO)",
   "cta": "Scopri di più · https://bottega-aurora.example/ (DEMO)",
   "data_proposta": "2026-10-17"
  },
  {
   "id": "gbp-3",
   "titolo": "Ceramiche per la casa di ogni giorno",
   "testo": "A San Marco Evangelista, nel laboratorio di Bottega Aurora, realizziamo ceramiche e oggetti per la casa pensati per entrare nelle abitudini di ogni giorno. Un oggetto artigianale ha una sua personalità: la senti nella forma, nel peso, nella finitura. In bottega puoi osservare i pezzi disponibili, confrontarli e immaginarli nei tuoi spazi, con il consiglio di chi li crea. Collezioni disponibili [DA VERIFICARE con il cliente]. Passa a conoscerci. (DEMO)",
   "cta": "Scopri di più · https://bottega-aurora.example/ (DEMO)",
   "data_proposta": "2026-10-24"
  },
  {
   "id": "gbp-4",
   "titolo": "La bottega in nuove immagini",
   "testo": "Bottega Aurora, laboratorio artigiano a San Marco Evangelista, si racconta in nuove immagini: l'ingresso, gli spazi dove espone ceramiche e oggetti per la casa, i pezzi in esposizione e le mani al lavoro. Guardale e scegli cosa vuoi vedere dal vivo: in bottega ti aspetta chi li realizza, pronto a consigliarti con cura. Serie fotografica e liberatorie delle persone ritratte [DA VERIFICARE con Enzo e il cliente]. (DEMO)",
   "cta": "Scopri di più · https://bottega-aurora.example/ (DEMO)",
   "data_proposta": "2026-10-31"
  }
 ],
 "da_verificare": [
  "[DA VERIFICARE] Indirizzo corretto (civico «5» o «5/A»): lo conferma il cliente con documento o insegna.",
  "[DA VERIFICARE] Numero di telefono attivo (0823 111 222 o 0823 111 223, DEMO): lo conferma il cliente.",
  "[DA VERIFICARE] Orari reali, compresi domenica, lunedì, festivi e orari speciali: li conferma il cliente.",
  "[DA VERIFICARE] Chi gestisce il sito e lo allinea ai valori NAP confermati: lo indica il cliente.",
  "[DA VERIFICARE] Intervallo tra le modifiche sensibili (Modifiche 5, 6, 7 e 8): lo fissano i soci con Vincenzo.",
  "[DA VERIFICARE] Nome esatto delle categorie nell'elenco ufficiale Google e decisione sulla categoria principale: la prendono i soci con il cliente.",
  "[DA VERIFICARE] Elenco completo di servizi e attributi oltre «Pagamento con carta»: lo fornisce il cliente.",
  "[DA VERIFICARE] Lavorazioni, materiali, provenienza dei prodotti e collezioni usati in descrizione e post: li conferma il cliente.",
  "[DA VERIFICARE] Disponibilità della funzione Domande e risposte sulla scheda: la verifica Vincenzo.",
  "[DA VERIFICARE] Foto per ciascun post e serie nuove (esterno con insegna, interno, prodotti, persone al lavoro) con liberatorie: Enzo o il cliente.",
  "[DA VERIFICARE] Soglia di aggiornamento foto e sezione del playbook S06 che la contiene: la indicano i soci.",
  "[DA VERIFICARE] Pulsante di prenotazione pertinente o no, e risposta del link al sito: il cliente e Vincenzo.",
  "[DA VERIFICARE] BigAnt registrata come gestore della scheda e stato di accesso: lo conferma il cliente, senza leggere 04_ACCESSI."
 ],
 "fonti_usate": [
  "pacchetto.oggi",
  "pacchetto.cliente",
  "pacchetto.squadra_bigant",
  "pacchetto.pacchetto_s06.Setup",
  "pacchetto.pacchetto_s06.Gestione (4 post al mese)",
  "pacchetto.pacchetto_s06.fonte (docs/playbook/S06_local-seo-gbp.md, sezione 13)",
  "docs/playbook/S06_local-seo-gbp.md, sezione 13: Gestione include l'aggiornamento delle foto; sezione con la soglia di aggiornamento foto [DA VERIFICARE]",
  "pacchetto.scheda_google.categoria_principale",
  "pacchetto.scheda_google.categorie_secondarie",
  "pacchetto.scheda_google.descrizione",
  "pacchetto.scheda_google.indirizzo",
  "pacchetto.scheda_google.telefono",
  "pacchetto.scheda_google.sito",
  "pacchetto.scheda_google.orari",
  "pacchetto.scheda_google.foto",
  "pacchetto.scheda_google.ultima_foto",
  "pacchetto.scheda_google.post_ultimi_90_giorni",
  "pacchetto.scheda_google.domande_e_risposte",
  "pacchetto.scheda_google.servizi_elencati",
  "pacchetto.scheda_google.attributi",
  "pacchetto.dati_sito.nome",
  "pacchetto.dati_sito.indirizzo",
  "pacchetto.dati_sito.telefono",
  "pacchetto.dati_sito.orari",
  "pacchetto.dati_sito.email",
  "pacchetto.checklist_s06",
  "pacchetto.vincoli[0]",
  "pacchetto.vincoli[1]"
 ]
}
```

## 4. Ricerca clienti · commerciale

Compito: Qualifica i candidati DEMO e scegli il lead per l’analisi gratuita.

Stato: Completato · motore claude-code · durata 32 s · costo 0.0795 USD · esito Qualità: approvabile

```json
{
 "sintesi": "Valutati 5 candidati DEMO. In testa Officine Nautiche Garigliano DEMO: sito senza versione mobile, scheda Google non rivendicata, social assenti, in un settore già presidiato da BigAnt. L'aggancio parte da BigAnt Presenza e porta al progetto Siti web. Graduatoria pronta per il controllo del socio.",
 "valutazioni": [
  {
   "lead_id": "9eeb51fc-67be-4c6d-94a5-4be195ed1ddc",
   "azienda": "Officine Nautiche Garigliano DEMO",
   "punteggio": 90,
   "motivo": "Divario netto su tutti i fronti (DEMO): sito senza versione mobile, social assenti, scheda non rivendicata e poche recensioni. Peso maggiore su servizi prioritari e Presenza. Nautica e Caserta rientrano nel perimetro.",
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
   "punteggio": 81,
   "motivo": "Catalogo lavori fermo al 2022 e nessun video dei lavori (DEMO): spazio evidente per la produzione video. Scheda con categoria errata e poche recensioni pesano su Presenza. Carpenteria industriale è settore presidiato.",
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
   "punteggio": 75,
   "motivo": "Sito fermo al 2021, Instagram fermo e solo prenotazione telefonica (DEMO); scheda con orari festivi mancanti. Sanità a Caserta: peso alto sull'aderenza. Settore regolamentato: testi soggetti a Qualità e compliance e a regole deontologiche.",
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
   "punteggio": 68,
   "motivo": "Sito di una pagina, scheda senza foto e 2 recensioni (DEMO): spazio su sito e Presenza. Territorio campano, settore vicino alla consulenza. Professione regolamentata: testi soggetti a Qualità e compliance e a regole deontologiche.",
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
   "punteggio": 28,
   "motivo": "Presenza già solida (DEMO): scheda completa, 210 recensioni, Instagram attivo. Resta la prenotazione tramite piattaforma a commissione, da approfondire. L'analisi avrebbe poco da mostrare; fascia ristorazione da verificare.",
   "servizio_consigliato": "Sponsorizzate",
   "segnali": [
    "sito_aggiornato: Menù in PDF del 2024 (DEMO)",
    "scheda_google: Completa, 120 foto (DEMO)",
    "recensioni: 210 recensioni, media 4,6 (DEMO)",
    "prenotazione_online: Tramite piattaforma a commissione (DEMO)"
   ]
  }
 ],
 "scelto_lead_id": "9eeb51fc-67be-4c6d-94a5-4be195ed1ddc",
 "motivo_scelta": "Officine Nautiche Garigliano DEMO mostra il divario più leggibile dai dati pubblici: sito senza versione mobile, scheda non rivendicata, social assenti. L'analisi S17 rende evidente il valore di BigAnt Presenza e apre al progetto Siti web come passo successivo. Pronto per il controllo del socio.",
 "da_verificare": [
  "[DA VERIFICARE] 9eeb51fc-67be-4c6d-94a5-4be195ed1ddc, sponsorizzate: nessuna campagna dichiarata nei segnali",
  "[DA VERIFICARE] 9eeb51fc-67be-4c6d-94a5-4be195ed1ddc, video: presenza di video dei lavori non indicata",
  "[DA VERIFICARE] 3bfcf154-3e2c-41d3-a8c3-29798a77a40a, sponsorizzate: campagne non dichiarate; sito: versione mobile non indicata",
  "[DA VERIFICARE] 3bfcf154-3e2c-41d3-a8c3-29798a77a40a, social: la chiave riporta solo l'assenza di video, profili non descritti",
  "[DA VERIFICARE] 8b813749-5d4a-48b2-95d8-8dd6e173f306, video e sponsorizzate: nessun segnale presente",
  "[DA VERIFICARE] 8b813749-5d4a-48b2-95d8-8dd6e173f306, recensioni: assenza di risposte non indicata",
  "[DA VERIFICARE] 3a3a3c25-3b5c-4662-b675-2463c8f67f29, recensioni: media non indicata; video e sponsorizzate: nessun segnale",
  "[DA VERIFICARE] 3a3a3c25-3b5c-4662-b675-2463c8f67f29, social: segnale riferito al LinkedIn del titolare, non a profili aziendali",
  "[DA VERIFICARE] 4273274f-05fe-4790-8393-9eb24b44589b, video e sponsorizzate: nessun segnale; sito: versione mobile non indicata",
  "[DA VERIFICARE] 4273274f-05fe-4790-8393-9eb24b44589b, settore: fascia premium non indicata",
  "[DA VERIFICARE] 9eeb51fc-67be-4c6d-94a5-4be195ed1ddc: possibile sovrapposizione con clienti attuali BigAnt dello stesso settore (nautica) e comune (Castel Volturno)",
  "[DA VERIFICARE] 9eeb51fc-67be-4c6d-94a5-4be195ed1ddc: base giuridica del primo contatto e verifica del Registro delle opposizioni prima di qualsiasi telefonata"
 ],
 "fonti_usate": [
  "pacchetto.oggi",
  "pacchetto.obiettivo",
  "pacchetto.profilo_bigant.area",
  "pacchetto.profilo_bigant.settori_presidiati",
  "pacchetto.pacchetto_ingresso",
  "pacchetto.servizi_prioritari",
  "pacchetto.servizi_esclusi_acquisizione",
  "pacchetto.candidati[0].segnali",
  "pacchetto.candidati[1].segnali",
  "pacchetto.candidati[2].segnali",
  "pacchetto.candidati[3].segnali",
  "pacchetto.candidati[4].segnali",
  "pacchetto.vincoli"
 ]
}
```

## 5. Qualità e compliance · commerciale

Compito: Controlla l’output di Ricerca clienti prima della coda approvazioni

Stato: Completato · motore claude-code · durata 26 s · costo 0.0692 USD · esito Qualità: approvabile

```json
{
 "esito": "approvabile",
 "sintesi": "Output DEMO approvabile: 0 bloccanti, 0 importanti, 3 suggerimenti. Confermo tutti i controlli automatici (promesse assolute, azioni esterne, identità legale, chiusure deboli, 12 punti [DA VERIFICARE], lead scelto). Punteggi, segnali e recensioni corrispondono a pacchetto_autore, e i dati DEMO restano marcati come tali. I rischi GDPR e di sovrapposizione con i clienti attuali sono già dichiarati in da_verificare per il lead scelto.",
 "rilievi": [
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.valutazioni[0].motivo",
   "problema": "\"Nautica e Caserta rientrano nel perimetro\" indica Caserta, ma nel pacchetto il lead ha città Castel Volturno.",
   "correzione": "Sostituire \"Nautica e Caserta rientrano nel perimetro.\" con: \"Nautica e Castel Volturno rientrano nel perimetro Campania.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.fonti_usate",
   "problema": "Settore e città dei candidati compaiono nei motivi (\"Sanità a Caserta\", \"Carpenteria industriale è settore presidiato\"), ma le fonti citano solo i campi `segnali`.",
   "correzione": "Aggiungere a fonti_usate: \"pacchetto.candidati[0].settore\", \"pacchetto.candidati[0].citta\", \"pacchetto.candidati[2].settore\", \"pacchetto.candidati[2].citta\", \"pacchetto.candidati[4].settore\", \"pacchetto.profilo_bigant.clienti_attuali\"."
  },
  {
   "gravita": "suggerimento",
   "regola": "gdpr_consensi",
   "dove": "output.valutazioni[3].segnali[3]",
   "problema": "\"LinkedIn del titolare poco curato (DEMO)\" valuta il profilo di una persona fisica e non un canale aziendale.",
   "correzione": "Sostituire con: \"social: profilo LinkedIn professionale del titolare, presenza aziendale da verificare (DEMO)\"."
  }
 ]
}
```

## 6. Analisi gratuita S17 · commerciale

Compito: Produci l’analisi gratuita della presenza online (S17) di Officine Nautiche Garigliano DEMO.

Stato: Fermato da Qualità · motore claude-code · durata 103 s · costo 0.2105 USD · esito Qualità: da_correggere

```json
{
 "sintesi": "Punteggio 31/100 [DA VERIFICARE: metodo e pesi] e voti per area [DA VERIFICARE], calcolati sui soli segnali DEMO. Divario principale: scheda Google non rivendicata e sito senza versione mobile. Tre leve: S06, S09, S08. Pronta per il controllo del socio.",
 "azienda": "Officine Nautiche Garigliano DEMO",
 "punteggio_presenza": 31,
 "aree": [
  {
   "area": "sito",
   "voto": 3,
   "punti_forza": [],
   "problemi": [
    "Sito senza versione mobile (DEMO)",
    "Velocità, titolo, meta description, H1, moduli e accessibilità non rilevati [DA VERIFICARE]"
   ]
  },
  {
   "area": "scheda_google",
   "voto": 2,
   "punti_forza": [],
   "problemi": [
    "Scheda Google non rivendicata (DEMO)",
    "Categorie, descrizione, orari, foto, servizi e post non verificabili [DA VERIFICARE]"
   ]
  },
  {
   "area": "recensioni",
   "voto": 4,
   "punti_forza": [
    "Media 3,9 su 4 recensioni (DEMO): una base da cui partire"
   ],
   "problemi": [
    "Solo 4 recensioni (DEMO): campione ridotto",
    "Recenza, risposte e temi ricorrenti non rilevati [DA VERIFICARE]"
   ]
  },
  {
   "area": "social",
   "voto": 1,
   "punti_forza": [],
   "problemi": [
    "Profili social assenti (DEMO)"
   ]
  },
  {
   "area": "coerenza_dati",
   "voto": 5,
   "punti_forza": [],
   "problemi": [
    "Area non valutabile: dati assenti [DA VERIFICARE]"
   ]
  },
  {
   "area": "concorrenti",
   "voto": 5,
   "punti_forza": [],
   "problemi": [
    "Area non valutabile: dati assenti [DA VERIFICARE]",
    "Nessun concorrente locale nel pacchetto [DA VERIFICARE]"
   ]
  }
 ],
 "azioni_consigliate": [
  {
   "titolo": "Rivendicare e completare la scheda Google dell'officina",
   "perche": "La scheda risulta non rivendicata (DEMO): orari, servizi e foto non sono gestibili direttamente. Completarla rende visibile ciò che fate già a chi cerca un'officina o un rimessaggio a Castel Volturno.",
   "servizio_bigant": "S06 Local SEO e Google Business Profile"
  },
  {
   "titolo": "Rendere il sito consultabile da smartphone",
   "perche": "Il sito è senza versione mobile (DEMO): chi lo apre dal telefono incontra una pagina pensata per il computer. Una versione mobile facilita la richiesta di contatto da parte dei clienti.",
   "servizio_bigant": "S09 Siti web e landing page"
  },
  {
   "titolo": "Raccogliere nuove recensioni e rispondere a ciascuna",
   "perche": "Le recensioni sono 4 con media 3,9 (DEMO): poco materiale per chi sceglie a chi affidare la barca. Un flusso spontaneo di opinioni, con risposte puntuali, offre più elementi di valutazione.",
   "servizio_bigant": "S08 Reputazione e recensioni"
  }
 ],
 "confronto_concorrenti": [],
 "invito": "Fissiamo una chiamata breve: vi mostriamo le tre azioni sulla vostra scheda e sul vostro sito e scegliete voi da dove partire.",
 "testo_report": "# Analisi della presenza online — Officine Nautiche Garigliano DEMO\n\nDATI DEMO inventati per il collaudo: nessuna attività reale, nessuna consultazione online. Data di riferimento: 2026-10-08. Tutti i dati citati sono DEMO.\n\n## In sintesi\n\nPunteggio di presenza: 31/100 [DA VERIFICARE]. È un indicatore interno costruito solo sui segnali raccolti nella DEMO, non è una misura ufficiale. Il metodo di calcolo e il peso delle aree sono [DA VERIFICARE] con i soci; le aree non valutabili non sono incluse in un giudizio.\n\nLa lettura: Officine Nautiche Garigliano DEMO ha una presenza online ancora poco strutturata. La scheda Google non è rivendicata, il sito è senza versione mobile e i social sono assenti. Le quattro recensioni, con media 3,9, sono una base da cui partire.\n\nVoti per area, scala 0–10, tutti [DA VERIFICARE]: sito 3, scheda Google 2, recensioni 4, social 1, coerenza dei dati 5, concorrenti 5. Gli ultimi due sono valori neutri dichiarati: nel pacchetto mancano i dati per valutarli.\n\n## Sito\n\nIl segnale raccolto è uno: il sito è senza versione mobile (DEMO). Chi lo apre dallo smartphone trova una pagina pensata per il computer, e questo limita la facilità con cui un cliente può leggere i servizi e chiedere un contatto.\n\nVoto 3/10 [DA VERIFICARE]. Velocità di caricamento, titolo, meta description, H1, moduli con informativa privacy, accessibilità e data dell'ultimo aggiornamento non sono stati raccolti: restano [DA VERIFICARE].\n\n## Scheda Google\n\nLa scheda risulta non rivendicata (DEMO). Senza rivendicazione, la gestione diretta di orari, servizi, foto e risposte ai clienti non è disponibile.\n\nVoto 2/10 [DA VERIFICARE]. Categorie, descrizione, orari anche festivi, domande e risposte, post e collegamento al sito non sono verificabili con i dati raccolti: restano [DA VERIFICARE]. È il punto di partenza più diretto: rivendicare e completare la scheda rende visibile ciò che fate già.\n\n## Recensioni\n\nIl pacchetto segnala 4 recensioni con media 3,9 (DEMO). La media è una base da cui partire; il numero ridotto lascia poco materiale a chi deve scegliere a chi affidare la propria imbarcazione.\n\nVoto 4/10 [DA VERIFICARE]. Data delle recensioni, percentuale con risposta e temi ricorrenti non sono disponibili: restano [DA VERIFICARE]. Il lavoro da fare è semplice nell'impostazione: raccogliere nuove opinioni in modo spontaneo, senza incentivi, e rispondere a ciascuna.\n\n## Social\n\nI profili social risultano assenti (DEMO). Voto 1/10 [DA VERIFICARE]. Manca un canale in cui mostrare interventi, lavorazioni e servizi di rimessaggio. Non è la priorità immediata: la sequenza naturale parte da scheda e sito, poi arrivano foto e contenuti (S01 Social media management, S02 Produzione foto, video e drone).\n\n## Coerenza dei dati\n\nArea non valutabile: nome, indirizzo, telefono e orari non sono stati confrontati tra sito, scheda e directory [DA VERIFICARE]. Il voto 5/10 è un valore neutro dichiarato [DA VERIFICARE], non un giudizio. Il confronto va fatto prima della consulenza, perché dati identici su ogni canale rendono la presenza affidabile per Google e per i clienti.\n\n## Confronto con i concorrenti locali\n\nIl pacchetto non contiene concorrenti locali rilevati: il confronto non è possibile e non ne aggiungiamo di nostra iniziativa [DA VERIFICARE]. Il voto 5/10 è un valore neutro dichiarato [DA VERIFICARE]. Con 2–3 concorrenti rilevati, il confronto avverrà su dati oggettivi: numero e media delle recensioni, continuità dei post, collegamenti della scheda. La prenotazione online è indicata come non pertinente (DEMO).\n\n## Tre azioni per partire\n\n1. **Rivendicare e completare la scheda Google dell'officina** (S06 Local SEO e Google Business Profile). La scheda non è rivendicata: completarla rende visibile ciò che fate già a chi cerca un'officina o un rimessaggio a Castel Volturno.\n2. **Rendere il sito consultabile da smartphone** (S09 Siti web e landing page). Senza versione mobile, chi apre il sito dal telefono incontra una pagina pensata per il computer. Una versione mobile facilita la richiesta di contatto.\n3. **Raccogliere nuove recensioni e rispondere a ciascuna** (S08 Reputazione e recensioni). Con 4 recensioni e media 3,9, un flusso spontaneo di opinioni e risposte offre più elementi a chi sceglie a chi affidare la barca.\n\nLe tre azioni nascono dai soli segnali disponibili; i dettagli si precisano con i dati completi, ancora [DA VERIFICARE].\n\n## Parliamone\n\nFissiamo una chiamata breve: vi mostriamo le tre azioni sulla vostra scheda e sul vostro sito e scegliete voi da dove partire.\n\nBozza BigAnt — invio solo dopo l'ok di un socio\n\n[DA VERIFICARE: informativa privacy e modalità di opposizione da allegare al primo contatto]",
 "da_verificare": [
  "dati_raccolti: dati completi non raccolti nella DEMO, valutazione basata solo sui segnali (dati_raccolti.nota)",
  "punteggio_presenza e voti per area: metodo di calcolo e pesi non documentati nel pacchetto",
  "sito: velocità, titolo, meta description, H1, moduli e privacy, HTTPS, accessibilità, ultimo aggiornamento non rilevati",
  "scheda_google: categorie, descrizione, servizi, foto, orari anche festivi, domande e risposte, post, collegamento a sito e prenotazione non rilevati",
  "recensioni: data, percentuale con risposta e temi ricorrenti non rilevati",
  "social: data dell'ultimo post e frequenza non rilevate (profili segnalati come assenti)",
  "coerenza_dati: confronto di nome, indirizzo, telefono e orari tra sito, scheda e directory assente; area non valutabile, voto neutro 5",
  "concorrenti: nessun concorrente nel pacchetto (meno di 2 richiesti); area non valutabile, voto neutro 5, confronto non possibile",
  "Voti e punteggio marcati [DA VERIFICARE] in sintesi e testo_report finché i soci non confermano il metodo",
  "Base giuridica del primo contatto e verifica del Registro delle opposizioni prima di telefonare"
 ],
 "fonti_usate": [
  "pacchetto.azienda.nome",
  "pacchetto.azienda.settore",
  "pacchetto.azienda.citta",
  "pacchetto.dati_raccolti.segnali.sito_aggiornato",
  "pacchetto.dati_raccolti.segnali.scheda_google",
  "pacchetto.dati_raccolti.segnali.recensioni",
  "pacchetto.dati_raccolti.segnali.social",
  "pacchetto.dati_raccolti.segnali.prenotazione_online",
  "pacchetto.dati_raccolti.nota",
  "pacchetto.nota_dati",
  "pacchetto.servizi_bigant",
  "pacchetto.vincoli",
  "metodo di calcolo di punteggio_presenza e voti per area: [DA VERIFICARE] voce puntuale da inserire dopo la conferma dei soci"
 ]
}
```

## 7. Qualità e compliance · local

Compito: Controlla l’output di Local SEO e GBP S06 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 45 s · costo 0.1014 USD · esito Qualità: da_correggere

```json
{
 "esito": "da_correggere",
 "sintesi": "Output DEMO da correggere: 0 bloccanti, 1 importante, 2 suggerimenti. Il rilievo principale è la sequenza delle modifiche sensibili su GBP: orari, telefono, indirizzo e categorie sono numerate in fila, ma il testo le dichiara \"isolate\", e questo contraddice il vincolo \"nessuna modifica aggressiva: rischio sospensione\". I 5 controlli automatici risultano confermati: nessuna promessa assoluta, nessuna azione esterna dichiarata, BigAnt non è presentata come società, nessuna chiusura debole, 9 punti [DA VERIFICARE] presenti. Conteggi, giorni (221), differenze NAP e dati DEMO risultano coerenti con il pacchetto.",
 "rilievi": [
  {
   "gravita": "importante",
   "regola": "coerenza_pacchetto",
   "dove": "output.controlli[6].correzione_proposta",
   "problema": "\"Modifica 6 di 8 telefono, Modifica 7 di 8 indirizzo, da sola e a distanza dalle altre modifiche sensibili\" è contraddittorio: le Modifiche 5, 6 e 7 (orari, telefono, indirizzo) sono consecutive e tutte sensibili, contro il vincolo \"Nessuna modifica aggressiva: rischio sospensione\".",
   "correzione": "Sostituire con: \"Nessuna modifica prima della conferma del cliente, che indica i valori corretti con documento o insegna. Poi, dopo l'ok: Modifica 6 di 8 telefono e Modifica 7 di 8 indirizzo, ciascuna in una sessione separata e distanziata dalle altre modifiche sensibili, comprese orari (Modifica 5) e categorie (Modifica 8). L'intervallo lo fissano i soci con Vincenzo [DA VERIFICARE]. Gli orari sono nella Modifica 5. Il sito va allineato [DA VERIFICARE chi lo gestisce].\""
  },
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.post_gbp[3].testo",
   "problema": "\"ti raccontiamo come li scegliamo\" presenta i pezzi come selezionati, mentre gbp-1 e la descrizione dicono che nascono in laboratorio (\"dove nascono ceramiche e oggetti per la casa\"): la provenienza dei prodotti non è coerente tra i testi e non è confermata nel pacchetto.",
   "correzione": "Sostituire \"ti raccontiamo come li scegliamo\" con \"ti raccontiamo come nascono [DA VERIFICARE lavorazioni e provenienza con il cliente]\"."
  },
  {
   "gravita": "suggerimento",
   "regola": "veridicita",
   "dove": "output.controlli[3].dettaglio",
   "problema": "\"oltre la soglia di 90\" cita una soglia sulle foto che non compare in pacchetto_autore (né in pacchetto_s06 né in checklist_s06) e che fonti_usate non giustifica.",
   "correzione": "Sostituire \"oltre la soglia di 90\" con \"oltre la soglia di aggiornamento foto [DA VERIFICARE soglia nel playbook S06]\" e aggiungere in fonti_usate il riferimento puntuale alla sezione del playbook da cui proviene la soglia."
  }
 ]
}
```

## 8. Qualità e compliance · social

Compito: Controlla l’output di Produzione social S01 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 32 s · costo 0.0862 USD · esito Qualità: da_correggere

```json
{
 "esito": "da_correggere",
 "sintesi": "Output DEMO da correggere: 0 bloccanti, 2 importanti, 2 suggerimenti. Il rischio principale è che i post 3 e 7 diano per certi luogo e svolgimento degli eventi DEMO del 14 e del 28 novembre, mentre il pacchetto riporta solo data e nome. I 6 controlli automatici sono confermati, compresi i 10 punti [DA VERIFICARE] dichiarati. Piano, date, canali, formati e rispetto della scadenza del 20 sono coerenti con il pacchetto. Non risultano promesse, prezzi, recensioni o azioni esterne dichiarate come compiute.",
 "rilievi": [
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.post[2].testo",
   "problema": "\"apriamo il laboratorio e ti mostriamo la dimostrazione al tornio\" seguito da \"Passa in bottega. Orari [DA VERIFICARE].\" presenta come certi luogo e svolgimento dell'evento DEMO, ma il pacchetto riporta solo data e nome. La conferma dell'evento (da_verificare, voce 4) non ha un marcatore nel testo.",
   "correzione": "Sostituire \"Passa in bottega. Orari [DA VERIFICARE].\" con: \"Passa in bottega. Luogo, orari e modalità dell'evento [DA VERIFICARE].\""
  },
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.post[6].testo",
   "problema": "\"Sabato 28 novembre in bottega: l'anteprima della collezione natalizia\" colloca l'evento in bottega senza fonte. Il pacchetto non indica il luogo e il testo non riporta [DA VERIFICARE] sull'evento, a differenza del post 8.",
   "correzione": "Sostituire la prima riga con: \"Sabato 28 novembre: l'anteprima della collezione natalizia.\" e \"Passa in bottega. Orari [DA VERIFICARE].\" con: \"Passa in bottega. Luogo, orari e modalità dell'evento [DA VERIFICARE].\""
  },
  {
   "gravita": "suggerimento",
   "regola": "veridicita",
   "dove": "output.post[0].testo",
   "problema": "\"Prima di diventare una tazza, è solo argilla e tempo.\" cita una tipologia di prodotto assente dal pacchetto. Le tipologie confermate sono \"ceramiche e oggetti per la casa\".",
   "correzione": "Sostituire con: \"Prima di diventare un oggetto per la casa, è solo argilla e tempo.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "brand_tono",
   "dove": "output.post[5].testo",
   "problema": "\"con le mani e con il tempo che servono\" contiene un errore di concordanza (\"il tempo che servono\") e indebolisce il registro corporate.",
   "correzione": "Sostituire con: \"con le mani e con il tempo che serve\"."
  }
 ]
}
```

## 9. Qualità e compliance · commerciale

Compito: Controlla l’output di Analisi gratuita S17 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 27 s · costo 0.0684 USD · esito Qualità: da_correggere

```json
{
 "esito": "da_correggere",
 "sintesi": "Output DEMO da correggere: 0 bloccanti, 2 importanti, 2 suggerimenti. Il rischio principale è il punteggio di presenza 31/100 con i voti per area: nessuna fonte ne giustifica il calcolo, e le due aree \"non valutabili\" entrano con voto neutro 5. I cinque controlli automatici sono confermati: nessuna promessa assoluta, azione esterna o presentazione come società, nessuna chiusura debole, 8 punti [DA VERIFICARE] dichiarati. Dati DEMO sempre marcati, nessun prezzo, nessuna recensione inventata e GDPR segnalato.",
 "rilievi": [
  {
   "gravita": "importante",
   "regola": "veridicita",
   "dove": "output.punteggio_presenza",
   "problema": "\"Punteggio di presenza 31/100\" e i voti per area (3, 2, 4, 1, 5, 5) non derivano da alcun dato del pacchetto: il metodo di calcolo e i pesi non sono dichiarati e le aree non valutabili entrano con voto neutro 5. Nel dubbio sulla fonte il numero resta non giustificato.",
   "correzione": "Nel testo_report, dopo \"non è una misura ufficiale.\", aggiungere: \"Il metodo di calcolo e il peso delle aree sono [DA VERIFICARE] con i soci; le aree non valutabili non sono incluse in un giudizio.\" Aggiungere a output.da_verificare la voce: \"punteggio_presenza e voti per area: metodo di calcolo e pesi non documentati nel pacchetto\"."
  },
  {
   "gravita": "importante",
   "regola": "coerenza_pacchetto",
   "dove": "output.fonti_usate",
   "problema": "L'elenco cita i segnali del pacchetto, ma nessuna voce giustifica il punteggio 31/100, i voti per area e la frase \"È la leva più rapida\": la tracciabilità è incompleta.",
   "correzione": "Aggiungere in fonti_usate la voce puntuale del metodo di calcolo, appena i soci lo confermano. Finché manca, mantenere il punteggio e i voti marcati [DA VERIFICARE] in output.sintesi e in output.testo_report."
  },
  {
   "gravita": "suggerimento",
   "regola": "brand_tono",
   "dove": "output.testo_report",
   "problema": "\"È la leva più rapida: rivendicare e completare la scheda rende visibile ciò che fate già.\" afferma una rapidità non dimostrata dal pacchetto.",
   "correzione": "Sostituire con: \"È il punto di partenza più diretto: rivendicare e completare la scheda rende visibile ciò che fate già.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.testo_report",
   "problema": "\"La media è una base solida da cui partire\" contraddice \"campione ridotto\" di 4 recensioni DEMO e l'area \"punti_forza\" (\"una base da cui partire\").",
   "correzione": "Sostituire con: \"La media è una base da cui partire; il numero ridotto lascia poco materiale a chi deve scegliere a chi affidare la propria imbarcazione.\""
  }
 ]
}
```

## 10. Qualità e compliance · commerciale

Compito: Controlla l’output di Analisi gratuita S17 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 38 s · costo 0.0788 USD · esito Qualità: da_correggere

```json
{
 "esito": "da_correggere",
 "sintesi": "Output DEMO da correggere: 0 bloccanti, 4 importanti, 1 suggerimento. Il rischio principale è il punteggio 31/100 con i voti neutri 5 su aree non valutabili, senza metodo né fonte nel pacchetto. I cinque controlli automatici sono confermati senza falsi positivi. Controllo integrato: nessuna promessa, nessuna azione dichiarata compiuta e BigAnt non presentata come società. I dati restano DEMO e il report è marcato come bozza soggetta all'ok di un socio.",
 "rilievi": [
  {
   "gravita": "importante",
   "regola": "veridicita",
   "dove": "output.aree[4].voto",
   "problema": "Il voto 5 su \"coerenza_dati\" contraddice \"Area non valutabile: dati assenti\": un numero neutro senza dati presenta un giudizio che il pacchetto non giustifica. Lo stesso vale per output.aree[5].voto (\"concorrenti\").",
   "correzione": "Escludere le due aree dal punteggio. In testo_report, nelle sezioni \"Coerenza dei dati\" e \"Confronto con i concorrenti locali\" e nell'elenco dei voti, sostituire \"voto 5/10\" con \"non valutata [DA VERIFICARE]\". Se lo schema impone un numero, conservarlo solo come valore tecnico, dichiarato \"escluso dal giudizio\"."
  },
  {
   "gravita": "importante",
   "regola": "veridicita",
   "dove": "output.punteggio_presenza",
   "problema": "\"31\" non ha riscontro nel pacchetto: manca il metodo di calcolo e la media semplice dei sei voti (20 su 60) non lo riproduce. L'indicatore include inoltre due voti neutri su aree non valutabili.",
   "correzione": "Mantenere il punteggio fuori dalla comunicazione al lead finché i soci non approvano metodo e pesi. In sintesi e testo_report scrivere: \"Punteggio indicativo, non calcolabile senza un metodo approvato dai soci [DA VERIFICARE]\"."
  },
  {
   "gravita": "importante",
   "regola": "coerenza_pacchetto",
   "dove": "output.fonti_usate[12]",
   "problema": "\"metodo di calcolo di punteggio_presenza e voti per area: [DA VERIFICARE] voce puntuale da inserire dopo la conferma dei soci\" non è una fonte: è un segnaposto, quindi la voce è vaga e non dimostra l'origine dei voti.",
   "correzione": "Eliminare la voce da fonti_usate. La lacuna resta dichiarata in da_verificare, alla voce \"punteggio_presenza e voti per area\"."
  },
  {
   "gravita": "importante",
   "regola": "veridicita",
   "dove": "output.testo_report",
   "problema": "\"Con 2–3 concorrenti rilevati, il confronto avverrà su dati oggettivi\" (e in da_verificare \"meno di 2 richiesti\") introduce una soglia numerica assente da pacchetto.vincoli e da ogni altra fonte.",
   "correzione": "Sostituire con: \"Con i concorrenti locali rilevati, il confronto avverrà su dati oggettivi: numero e media delle recensioni, continuità dei post, collegamenti della scheda [DA VERIFICARE].\" In da_verificare sostituire \"(meno di 2 richiesti)\" con \"(numero minimo da definire con i soci)\"."
  },
  {
   "gravita": "suggerimento",
   "regola": "brand_tono",
   "dove": "output.aree[2].punti_forza[0]",
   "problema": "\"Media 3,9 su 4 recensioni (DEMO)\" si legge come voto 3,9 su una scala da 4, mentre indica la media di 4 recensioni.",
   "correzione": "Sostituire con: \"Media 3,9 sulle 4 recensioni disponibili (DEMO): una base da cui partire\"."
  }
 ]
}
```

## 11. Qualità e compliance · local

Compito: Controlla l’output di Local SEO e GBP S06 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 38 s · costo 0.0960 USD · esito Qualità: approvabile

```json
{
 "esito": "approvabile",
 "sintesi": "Output DEMO approvabile: 0 bloccanti, 0 importanti, 3 suggerimenti. I 5 controlli automatici sono confermati e nessun falso positivo emerge. Ho verificato anche i 221 giorni dall'ultima foto, il conteggio 1 ok / 6 da correggere / 2 mancanti, i 13 [DA VERIFICARE] e la numerazione delle modifiche da 1 a 8. Il rischio residuo sta nelle affermazioni non ancora verificate presentate come certe: la soglia foto, lo stato del link e la definizione dei post come \"pronti\". Tutti i dati restano DEMO e nessuna azione esterna è dichiarata come compiuta.",
 "rilievi": [
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.controlli[3].dettaglio",
   "problema": "\"oltre la soglia di aggiornamento foto [DA VERIFICARE soglia nel playbook S06]\" afferma il superamento di una soglia che lo stesso testo dichiara sconosciuta.",
   "correzione": "Sostituire con: \"9 foto; ultima 2026-03-01 (DEMO), 221 giorni prima di oggi. Il pacchetto non riporta una soglia di aggiornamento: [DA VERIFICARE soglia nel playbook S06]. Le serie presenti non sono rilevate.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "da_verificare",
   "dove": "output.controlli[8].stato",
   "problema": "Lo stato \"ok\" convive con \"Il link risponde e punta alla pagina giusta [DA VERIFICARE]\": l'esito positivo poggia su un controllo non eseguito.",
   "correzione": "Mantenere \"ok\" solo per la coerenza del dominio con l'email del sito. Sostituire la frase con: \"Dominio coerente con l'email del sito. Risposta del link e pagina di destinazione non controllate: [DA VERIFICARE con Vincenzo].\" Aggiornare di conseguenza il conteggio \"1 ok\" nella sintesi."
  },
  {
   "gravita": "suggerimento",
   "regola": "brand_tono",
   "dove": "output.sintesi",
   "problema": "\"I 4 post sono pronti\" è prematuro: ciascun post contiene [DA VERIFICARE] su lavorazioni, collezioni o liberatorie, e gbp-4 presenta \"nuove immagini\" che non esistono ancora (Modifica 3 e serie fotografica in sospeso).",
   "correzione": "Sostituire con: \"I 4 bozze di post sono pronte per la revisione e non citano orari, telefono o indirizzo; restano da sciogliere i [DA VERIFICARE] su lavorazioni, collezioni e liberatorie, e gbp-4 esce solo con la serie fotografica disponibile.\""
  }
 ]
}
```

## 12. Qualità e compliance · social

Compito: Controlla l’output di Produzione social S01 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 25 s · costo 0.0756 USD · esito Qualità: da_correggere

```json
{
 "esito": "da_correggere",
 "sintesi": "Output DEMO da correggere: 0 bloccanti, 1 importante, 0 suggerimenti. La `sintesi` dell'autore dichiara un promemoria per entrambi gli eventi DEMO, ma il piano ne contiene uno solo (28 novembre). I sei controlli automatici sono confermati: i 10 punti [DA VERIFICARE] corrispondono all'elenco, nessuna promessa, nessun prezzo, nessuna azione esterna dichiarata, nessuna recensione. Date, pacchetto (8 contenuti, 2 Reel), CTA, DNA e scadenza del 20 ottobre risultano coerenti con il pacchetto autore.",
 "rilievi": [
  {
   "gravita": "importante",
   "regola": "coerenza_pacchetto",
   "dove": "output.sintesi",
   "problema": "\"Ogni evento DEMO (14 e 28 novembre) ha un annuncio e un promemoria nei giorni precedenti\" contraddice il piano: l'evento del 14 novembre ha solo l'annuncio del 10 novembre (post-3), mentre il promemoria esiste solo per il 28 novembre (post-8, 27 novembre).",
   "correzione": "Sostituire con: \"Bottega Aurora DEMO, novembre 2026: piano di 8 contenuti, di cui 2 Reel, su Instagram e Facebook, costruito su 4 pilastri. L'evento DEMO del 14 novembre ha un annuncio (10 novembre); l'evento DEMO del 28 novembre ha un annuncio (24 novembre) e un promemoria (27 novembre). Servono prima l'ok di un socio e poi quello del cliente; luogo, orari e modalità degli eventi restano [DA VERIFICARE]. La consegna è nei termini, perché il piano arriva prima del 20 ottobre.\""
  }
 ]
}
```

## 13. Reputazione e recensioni S08 · local

Compito: Prepara le risposte a tutte le recensioni DEMO di Bottega Aurora DEMO (S08) e il kit di raccolta.

Stato: In attesa di approvazione · motore claude-code · durata 95 s · costo 0.1527 USD · esito Qualità: approvabile

```json
{
 "sintesi": "Bottega Aurora DEMO: 4 recensioni DEMO, 3 positive, 0 neutre, 1 negativa. L'avviso immediato riguarda ba-r3 (Google 2/5, orario di chiusura). Tre recensioni senza risposta sono oltre le 48 ore; ba-r4 ha già una risposta. Il kit di raccolta è pronto. Serve l'ok del cliente sulla bozza di ba-r3 e la conferma degli orari reali del sabato.",
 "risposte": [
  {
   "recensione_id": "ba-r1",
   "priorita": "bassa",
   "sentiment": "positiva",
   "risposta": "Un servizio di piatti fatto a mano, confezionato con cura: è il modo in cui lavoriamo. Ogni pezzo nasce dalle nostre mani, con il tempo che la materia chiede, e merita attenzione fino all'ultimo gesto. Passa in bottega per vedere le prossime creazioni, o scrivici per un pezzo su misura.",
   "nota_interna": "Voto 5/5 del 2026-10-02 (DEMO): 6 giorni senza risposta, oltre le 48 ore S08. Nessuna criticità. Serve l'ok di un socio prima della pubblicazione (bloccata nel prototipo).",
   "serve_ok_cliente": false
  },
  {
   "recensione_id": "ba-r2",
   "priorita": "media",
   "sentiment": "positiva",
   "risposta": "Pezzi unici e una qualità che si vede: ci fa piacere che il lavoro delle nostre mani arrivi a chi sceglie. Il prezzo è un punto che prendiamo sul serio, perché dietro ogni pezzo ci sono mani, tempo e materia. Passa in bottega per vedere i pezzi da vicino, o scrivici per un pezzo su misura.",
   "nota_interna": "Voto 4/5 del 2026-09-25 (DEMO): 13 giorni senza risposta, oltre le 48 ore S08. Critica sul prezzo: nessun fatto aggiunto oltre al pacchetto, nessuno sconto in pubblico. Serve l'ok di un socio.",
   "serve_ok_cliente": false
  },
  {
   "recensione_id": "ba-r3",
   "priorita": "alta",
   "sentiment": "negativa",
   "risposta": "Arrivare in bottega nel tardo pomeriggio e trovare la porta chiusa non è l'esperienza che vogliamo offrire a chi dedica tempo a venirci a trovare. Prendiamo sul serio quello che ci racconti e vogliamo capire con te cosa è successo quel sabato: scrivici a [contatto DA VERIFICARE] e ne parliamo direttamente con il titolare. Quando passerai di nuovo, la bottega deve ripagare il tempo che le dedichi, con le nostre mani al lavoro e la materia da toccare.",
   "nota_interna": "Voto 2/5 del 2026-09-20 (DEMO): 18 giorni senza risposta, oltre le 48 ore S08. Il cliente deve confermare gli orari reali del sabato; se l'orario del sito risulta errato, la correzione passa da S06 (referente [DA VERIFICARE], dopo ok) prima di pubblicare. Approva il cliente. Nessun omaggio in pubblico.",
   "serve_ok_cliente": true
  },
  {
   "recensione_id": "ba-r4",
   "priorita": "bassa",
   "sentiment": "positiva",
   "risposta": "Un'esperienza bellissima per i bambini: è ciò che cerchiamo quando apriamo il laboratorio, con le mani nella materia e il tempo di scoprire come nasce un oggetto. Passa in bottega per vedere dove nascono i nostri pezzi, o scrivici per un pezzo su misura.",
   "nota_interna": "Facebook, voto 5/5 del 2026-09-10 (DEMO): 28 giorni. Risposta già presente: nessun secondo commento; bozza da usare solo se il cliente sceglie di sostituirla.",
   "serve_ok_cliente": false
  }
 ],
 "avvisi": [
  "AVVISO IMMEDIATO · ba-r3 · Google 2/5 del 2026-09-20 · orario di chiusura e sito · da inoltrare a socio e cliente, serve l'ok sulla risposta (DEMO)"
 ],
 "kit_raccolta": {
  "messaggio_whatsapp": "Grazie per la visita in bottega: ogni pezzo nasce dalle nostre mani e dal tempo che la materia chiede, e il parere di chi ci sceglie ci aiuta a lavorare meglio. Com'è andata la tua esperienza? Se ti va, raccontacelo con un parere sincero, in due minuti: [DA VERIFICARE: link breve alla recensione della scheda Google]. Se preferisci non ricevere altri messaggi, rispondi NO.",
  "testo_qr": "Com'è andata in bottega? Lasciaci il tuo parere sincero su Google. [QR: link recensione DA VERIFICARE]",
  "istruzioni_staff": "1. Chiedi il parere a fine servizio o acquisto, a tutti i clienti che hanno dato il consenso a essere contattati, non solo a chi sembra soddisfatto.\n2. Dì in una frase: \"Ci farebbe piacere un tuo parere sincero su Google\" e mostra il cartoncino con il QR.\n3. Vietato offrire sconti, omaggi, buoni o partecipazioni a concorsi in cambio di una recensione.\n4. Vietato suggerire il voto o chiedere \"5 stelle\": il parere deve essere libero.\n5. Vietato scrivere recensioni al posto del cliente, usare i dispositivi della bottega per lasciarle o chiederle a familiari e colleghi.\n6. Se il cliente dice no, ringrazia e non insistere; se risponde NO su WhatsApp, annota il rifiuto e non scrivere più.\n7. Non chiedere mai di modificare o togliere una recensione, nemmeno negativa: segnalala al titolare.\n8. Registra il consenso al contatto WhatsApp nel registro dei consensi [DA VERIFICARE: registro fornito dal cliente] prima di inviare il messaggio."
 },
 "da_verificare": [
  "[DA VERIFICARE] Contatto per il canale privato da inserire nella risposta a ba-r3: lo fornisce il cliente.",
  "[DA VERIFICARE] Orari reali di apertura del sabato: li conferma il cliente; senza conferma non si cita alcun orario nelle risposte.",
  "[DA VERIFICARE] Referente S06 per la correzione dell'orario del sito: lo conferma un socio.",
  "[DA VERIFICARE] Chi approva la risposta negativa a ba-r3: il cliente, con ok registrato (nome e data).",
  "[DA VERIFICARE] Link breve alla recensione della scheda Google per messaggio WhatsApp e QR: lo fornisce il cliente.",
  "[DA VERIFICARE] Registro dei consensi WhatsApp: lo indica il cliente.",
  "[DA VERIFICARE] Firma delle risposte (se prevista): la decide il cliente.",
  "[DA VERIFICARE] Su ba-r4 il cliente decide se mantenere la risposta già presente o sostituirla con la bozza."
 ],
 "fonti_usate": [
  "pacchetto.oggi",
  "pacchetto.cliente",
  "pacchetto.tono",
  "pacchetto.regole[0]",
  "pacchetto.regole[1]",
  "pacchetto.regole[2]",
  "pacchetto.recensioni[0].testo",
  "pacchetto.recensioni[0].voto",
  "pacchetto.recensioni[0].data",
  "pacchetto.recensioni[1].testo",
  "pacchetto.recensioni[1].voto",
  "pacchetto.recensioni[1].data",
  "pacchetto.recensioni[2].testo",
  "pacchetto.recensioni[2].voto",
  "pacchetto.recensioni[2].data",
  "pacchetto.recensioni[3].testo",
  "pacchetto.recensioni[3].voto",
  "pacchetto.recensioni[3].data",
  "pacchetto.recensioni[3].piattaforma",
  "pacchetto.recensioni[3].risposta_presente"
 ]
}
```

## 14. Qualità e compliance · local

Compito: Controlla l’output di Reputazione e recensioni S08 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 36 s · costo 0.0729 USD · esito Qualità: da_correggere

```json
{
 "esito": "da_correggere",
 "sintesi": "Output DEMO da correggere: 0 bloccanti, 1 importante, 2 suggerimenti. Il rischio principale è il nome \"Vincenzo\" nella nota di ba-r3, assente da `pacchetto_autore` e senza [DA VERIFICARE]. I 7 controlli automatici sono confermati: 4 recensioni DEMO con 4 risposte, 8 punti [DA VERIFICARE] e negativa con ok del cliente. Nessun rischio su recensioni, GDPR, azioni esterne o identità legale.",
 "rilievi": [
  {
   "gravita": "importante",
   "regola": "da_verificare",
   "dove": "output.risposte[2].nota_interna",
   "problema": "\"correggere via S06 (Vincenzo, dopo ok)\" cita un nome che non compare in `pacchetto_autore` e non porta [DA VERIFICARE]; senza fonte, il nome va trattato come inventato.",
   "correzione": "Sostituire \"S06 (Vincenzo, dopo ok)\" con \"S06 (referente [DA VERIFICARE], dopo ok)\" e aggiungere a `da_verificare`: \"[DA VERIFICARE] Referente S06 per la correzione dell'orario del sito: lo conferma un socio.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "veridicita",
   "dove": "output.sintesi",
   "problema": "\"l'orario del sito va corretto con S06 prima di pubblicare\" presenta l'errore come accertato, mentre la nota di ba-r3 e `da_verificare` lo definiscono solo \"forse errato\" fino alla conferma del cliente.",
   "correzione": "Sostituire con: \"il cliente deve confermare gli orari reali del sabato; se l'orario del sito risulta errato, la correzione passa da S06 prima di pubblicare.\""
  },
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.fonti_usate",
   "problema": "Voti, date, piattaforme e stato `risposta_presente` citati nelle `nota_interna` e nella `sintesi` (es. \"Voto 2/5 del 2026-09-20\") non compaiono in `fonti_usate`, che elenca solo i campi `testo` e `risposta_presente` di ba-r4.",
   "correzione": "Aggiungere a `fonti_usate`: \"pacchetto.recensioni[0].voto\", \"pacchetto.recensioni[0].data\", \"pacchetto.recensioni[1].voto\", \"pacchetto.recensioni[1].data\", \"pacchetto.recensioni[2].voto\", \"pacchetto.recensioni[2].data\", \"pacchetto.recensioni[3].voto\", \"pacchetto.recensioni[3].data\", \"pacchetto.recensioni[3].piattaforma\"."
  }
 ]
}
```

## 15. Qualità e compliance · local

Compito: Controlla l’output di Reputazione e recensioni S08 prima della coda approvazioni

Stato: Completato · motore claude-code · durata 24 s · costo 0.0595 USD · esito Qualità: approvabile

```json
{
 "esito": "approvabile",
 "sintesi": "Output DEMO approvabile: 0 bloccanti, 0 importanti, 2 suggerimenti. I 7 controlli automatici sono confermati. Non risultano recensioni inventate o incentivate, dati sanitari, azioni esterne dichiarate come compiute né orari non confermati. I giorni di attesa (6, 13, 18 e 28) tornano con `oggi` 2026-10-08. Il kit di raccolta rispetta consenso, assenza di incentivi e richieste non selettive. L'approvazione della risposta a ba-r3 resta al cliente, con ok registrato (nome e data).",
 "rilievi": [
  {
   "gravita": "suggerimento",
   "regola": "coerenza_pacchetto",
   "dove": "output.fonti_usate",
   "problema": "La sintesi e l'avviso citano \"Google 2/5\" per ba-r3, ma `fonti_usate` riporta `piattaforma` solo per `pacchetto.recensioni[3]`, quindi la piattaforma delle recensioni 0, 1 e 2 non ha una fonte puntuale.",
   "correzione": "Aggiungere a `fonti_usate`: \"pacchetto.recensioni[0].piattaforma\", \"pacchetto.recensioni[1].piattaforma\", \"pacchetto.recensioni[2].piattaforma\"."
  },
  {
   "gravita": "suggerimento",
   "regola": "brand_tono",
   "dove": "output.sintesi",
   "problema": "\"Il kit di raccolta è pronto\" è impreciso: il messaggio WhatsApp e il QR contengono ancora link e registro consensi [DA VERIFICARE], quindi il kit non è utilizzabile.",
   "correzione": "Sostituire con: \"Il kit di raccolta è in bozza: servono il link alla recensione e il registro dei consensi dal cliente [DA VERIFICARE].\""
  }
 ]
}
```

## Azioni esterne bloccate

- Modificare la scheda Google: 8 correzioni alla scheda Google — modifica bloccata (GBP API non collegata)
- Pubblicare sulla scheda Google: Post GBP «Dove nascono ceramiche e oggetti per la casa» — pubblicazione bloccata
- Pubblicare sulla scheda Google: Post GBP «Idee regalo in ceramica artigianale» — pubblicazione bloccata
- Pubblicare sulla scheda Google: Post GBP «Ceramiche per la casa di ogni giorno» — pubblicazione bloccata
- Pubblicare sulla scheda Google: Post GBP «La bottega in nuove immagini» — pubblicazione bloccata
- Pubblicare le risposte alle recensioni: 4 risposte alle recensioni — pubblicazione bloccata (GBP API non collegata)
