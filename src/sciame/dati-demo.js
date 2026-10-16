// Dati DEMO dello sciame. Aziende, schede, recensioni e numeri sono INVENTATI per collaudare
// i flussi: non descrivono attività reali e non vanno mai presentati come risultati veri.
export const NOTA_DEMO = 'DATI DEMO inventati per il collaudo: nessuna attività reale, nessuna consultazione online.';

// Candidati della ricerca clienti (dominio .example: la demo Growth rifiuta altri domini).
export const aziendeDemo = [
 {chiave:'fisio-volturno',azienda:'Centro Fisio Volturno DEMO',settore:'Fisioterapia e riabilitazione',citta:'Caserta',sito:'https://fisio-volturno.example/',email:'info@fisio-volturno.example',
  segnali:{sito_aggiornato:'Ultimo aggiornamento dichiarato nel 2021 (DEMO)',scheda_google:'Presente, orari festivi non indicati (DEMO)',recensioni:'11 recensioni, media 4,4 (DEMO)',social:'Instagram fermo da 5 mesi (DEMO)',prenotazione_online:'Assente: solo telefono (DEMO)'},
  dati:{
   sito:{titolo_home:'Centro Fisio Volturno DEMO',meta_description:'',h1:'Benvenuti',pagine:['Home','Chi siamo','Servizi','Contatti'],mobile:'Menu non utilizzabile sotto i 400 px (rilievo DEMO)',velocita:'Caricamento home 6,8 s su rete mobile simulata (misura DEMO)',moduli:'Modulo contatti senza informativa privacy (DEMO)',https:true,accessibilita:'Immagini senza testo alternativo: 14 su 18 (DEMO)',ultimo_aggiornamento:'2021 (DEMO)'},
   scheda_google:{nome:'Centro Fisio Volturno DEMO',categoria_principale:'Fisioterapista',categorie_secondarie:[],indirizzo:'Via Roma 10, Caserta (DEMO)',telefono:'0823 000 001 (DEMO)',sito:'https://fisio-volturno.example/',orari:'Lun–Ven 8:30–19:30; festivi non indicati (DEMO)',foto:6,post_ultimi_90_giorni:0,domande_e_risposte:0,servizi_elencati:false,prenotazione:'Non collegata (DEMO)'},
   recensioni:[
    {id:'fv-r1',voto:5,data:'2026-09-12',testo:'Personale preparato e gentile, mi hanno seguito con attenzione dopo l’intervento. (DEMO)',risposta_presente:false},
    {id:'fv-r2',voto:4,data:'2026-08-30',testo:'Bravi, ma prenotare per telefono è difficile: spesso occupato. (DEMO)',risposta_presente:false},
    {id:'fv-r3',voto:2,data:'2026-07-18',testo:'Attesa lunga in sala nonostante l’appuntamento. (DEMO)',risposta_presente:false}
   ],
   riepilogo_recensioni:{totale:11,media:4.4,con_risposta:0,fonte:'Conteggio DEMO della scheda inventata'},
   social:{instagram:{follower:'380 (DEMO)',ultimo_post:'2026-05-02 (DEMO)',frequenza:'irregolare (DEMO)'},facebook:{pagina:'presente (DEMO)',ultimo_post:'2026-04-20 (DEMO)'}},
   coerenza_dati:{telefono_sito:'0823 000 010 (DEMO)',telefono_scheda:'0823 000 001 (DEMO)',indirizzo_sito:'Via Roma 10, Caserta (DEMO)',indirizzo_scheda:'Via Roma 10, Caserta (DEMO)',directory:'Su 2 directory DEMO compare ancora il vecchio telefono'},
   concorrenti:[{nome:'Studio Riabilita Caserta DEMO',nota:'Prenotazione online attiva, 64 recensioni con media 4,7, post settimanali sulla scheda (DEMO)'},{nome:'Fisiomedica Centro DEMO',nota:'Sito recente, nessuna attività social da 3 mesi, 23 recensioni con media 4,2 (DEMO)'}]
  }},
 {chiave:'trattoria-logge',azienda:'Trattoria Le Logge DEMO',settore:'Ristorazione',citta:'Santa Maria Capua Vetere',sito:'https://trattoria-logge.example/',email:'info@trattoria-logge.example',
  segnali:{sito_aggiornato:'Menù in PDF del 2024 (DEMO)',scheda_google:'Completa, 120 foto (DEMO)',recensioni:'210 recensioni, media 4,6 (DEMO)',social:'Instagram attivo con 3 post a settimana (DEMO)',prenotazione_online:'Tramite piattaforma a commissione (DEMO)'},
  dati:{sito:{titolo_home:'Trattoria Le Logge DEMO · Santa Maria Capua Vetere',meta_description:'Cucina casertana e prodotti del territorio (DEMO)',h1:'Trattoria Le Logge',pagine:['Home','Menù (PDF 2024)','Dove siamo','Prenota'],mobile:'Leggibile; il menù PDF non è navigabile da telefono (rilievo DEMO)',velocita:'Caricamento home 3,1 s su rete mobile simulata (misura DEMO)',moduli:'Prenotazione tramite piattaforma esterna a commissione (DEMO)',https:true,accessibilita:'Menù solo in PDF scansionato (DEMO)',ultimo_aggiornamento:'2024 (DEMO)'},
   scheda_google:{nome:'Trattoria Le Logge DEMO',categoria_principale:'Ristorante',categorie_secondarie:['Trattoria'],indirizzo:'Piazza Mazzini 3, Santa Maria Capua Vetere (DEMO)',telefono:'0823 000 210 (DEMO)',sito:'https://trattoria-logge.example/',orari:'Mar–Dom 12:30–15:00, 19:30–23:00 (DEMO)',foto:120,post_ultimi_90_giorni:2,domande_e_risposte:3,servizi_elencati:true,prenotazione:'Collegata alla piattaforma esterna (DEMO)'},
   recensioni:[{id:'tl-r1',voto:5,data:'2026-09-28',testo:'Genovese strepitosa, servizio attento. (DEMO)',risposta_presente:true},{id:'tl-r2',voto:3,data:'2026-09-02',testo:'Buono ma attesa lunga il sabato sera. (DEMO)',risposta_presente:false}],
   riepilogo_recensioni:{totale:210,media:4.6,con_risposta:120,fonte:'Conteggio DEMO della scheda inventata'},
   social:{instagram:{follower:'2.400 (DEMO)',ultimo_post:'2026-10-05 (DEMO)',frequenza:'3 a settimana (DEMO)'},facebook:{pagina:'presente (DEMO)',ultimo_post:'2026-10-04 (DEMO)'}},
   coerenza_dati:{telefono_sito:'0823 000 210 (DEMO)',telefono_scheda:'0823 000 210 (DEMO)',indirizzo_sito:'Piazza Mazzini 3, Santa Maria Capua Vetere (DEMO)',indirizzo_scheda:'Piazza Mazzini 3, Santa Maria Capua Vetere (DEMO)',directory:'Dati coerenti sulle directory DEMO controllate'},
   concorrenti:[{nome:'Osteria del Foro DEMO',nota:'Prenotazione diretta con Google, menù navigabile, 340 recensioni con media 4,5 (DEMO)'},{nome:'Antica Taverna Capuana DEMO',nota:'Nessun sito, 95 recensioni con media 4,3 (DEMO)'}]}},
 {chiave:'nautica-garigliano',azienda:'Officine Nautiche Garigliano DEMO',settore:'Nautica e rimessaggio',citta:'Castel Volturno',sito:'https://nautica-garigliano.example/',email:'info@nautica-garigliano.example',
  segnali:{sito_aggiornato:'Sito senza versione mobile (DEMO)',scheda_google:'Non rivendicata (DEMO)',recensioni:'4 recensioni, media 3,9 (DEMO)',social:'Assenti (DEMO)',prenotazione_online:'Non pertinente (DEMO)'},
  dati:{sito:{titolo_home:'Officine Nautiche Garigliano DEMO',meta_description:'',h1:'',pagine:['Home','Servizi','Contatti'],mobile:'Nessuna versione mobile: testo non leggibile sotto i 600 px (rilievo DEMO)',velocita:'Caricamento home 7,9 s su rete mobile simulata (misura DEMO)',moduli:'Nessun modulo contatti (DEMO)',https:false,accessibilita:'Testo in immagini (DEMO)',ultimo_aggiornamento:'2019 (DEMO)'},
   scheda_google:{nome:'Officine Nautiche Garigliano DEMO',categoria_principale:'Non rivendicata (DEMO)',categorie_secondarie:[],indirizzo:'Via Domitiana km 30, Castel Volturno (DEMO)',telefono:'0823 000 330 (DEMO)',sito:'non indicato (DEMO)',orari:'non indicati (DEMO)',foto:3,post_ultimi_90_giorni:0,domande_e_risposte:0,servizi_elencati:false,prenotazione:'Non pertinente (DEMO)'},
   recensioni:[{id:'ng-r1',voto:5,data:'2026-06-10',testo:'Rimessaggio serio, barca riconsegnata pulita. (DEMO)',risposta_presente:false},{id:'ng-r2',voto:2,data:'2026-05-02',testo:'Difficile parlare con qualcuno al telefono. (DEMO)',risposta_presente:false}],
   riepilogo_recensioni:{totale:4,media:3.9,con_risposta:0,fonte:'Conteggio DEMO della scheda inventata'},
   social:{instagram:{follower:'assente (DEMO)'},facebook:{pagina:'assente (DEMO)'}},
   coerenza_dati:{telefono_sito:'0823 000 331 (DEMO)',telefono_scheda:'0823 000 330 (DEMO)',indirizzo_sito:'Via Domitiana km 30, Castel Volturno (DEMO)',indirizzo_scheda:'Via Domitiana km 30, Castel Volturno (DEMO)',directory:'Su 3 directory DEMO manca del tutto'},
   concorrenti:[{nome:'Cantiere Volturno Marine DEMO',nota:'Sito mobile con galleria lavori, scheda Google con 48 recensioni media 4,6 (DEMO)'},{nome:'Rimessaggio Foce DEMO',nota:'Solo pagina Facebook, 12 recensioni media 4,0 (DEMO)'}]}},
 {chiave:'studio-aurelia',azienda:'Studio Legale Aurelia DEMO',settore:'Studio professionale',citta:'Marcianise',sito:'https://studio-aurelia.example/',email:'segreteria@studio-aurelia.example',
  segnali:{sito_aggiornato:'Sito di una pagina (DEMO)',scheda_google:'Presente, senza foto (DEMO)',recensioni:'2 recensioni (DEMO)',social:'LinkedIn del titolare poco curato (DEMO)',prenotazione_online:'Assente (DEMO)'},
  dati:{sito:{titolo_home:'Studio Legale Aurelia DEMO',meta_description:'Studio legale a Marcianise (DEMO)',h1:'Studio Legale Aurelia',pagine:['Home'],mobile:'Leggibile (rilievo DEMO)',velocita:'Caricamento home 2,4 s su rete mobile simulata (misura DEMO)',moduli:'Solo indirizzo email, nessun modulo (DEMO)',https:true,accessibilita:'Contrasto testo/sfondo insufficiente (DEMO)',ultimo_aggiornamento:'2023 (DEMO)'},
   scheda_google:{nome:'Studio Legale Aurelia DEMO',categoria_principale:'Avvocato',categorie_secondarie:[],indirizzo:'Corso Umberto 40, Marcianise (DEMO)',telefono:'0823 000 440 (DEMO)',sito:'https://studio-aurelia.example/',orari:'Lun–Ven 9:00–13:00, 15:30–19:00 (DEMO)',foto:0,post_ultimi_90_giorni:0,domande_e_risposte:0,servizi_elencati:false,prenotazione:'Non collegata (DEMO)'},
   recensioni:[{id:'sa-r1',voto:5,data:'2026-04-15',testo:'Professionali e chiari nei costi. (DEMO)',risposta_presente:false}],
   riepilogo_recensioni:{totale:2,media:5,con_risposta:0,fonte:'Conteggio DEMO della scheda inventata'},
   social:{linkedin:{titolare:'profilo con 180 collegamenti, ultimo post 2025 (DEMO)'}},
   coerenza_dati:{telefono_sito:'0823 000 440 (DEMO)',telefono_scheda:'0823 000 440 (DEMO)',indirizzo_sito:'Corso Umberto 40, Marcianise (DEMO)',indirizzo_scheda:'Corso Umberto 40, Marcianise (DEMO)',directory:'Coerente sulle directory DEMO controllate'},
   concorrenti:[{nome:'Studio Associato Casertano DEMO',nota:'Sito con aree di pratica e articoli, 31 recensioni media 4,8 (DEMO)'},{nome:'Avvocato in Marcianise DEMO',nota:'Solo scheda Google, 9 recensioni (DEMO)'}]}},
 {chiave:'carpenteria-sud',azienda:'Carpenteria Metallica Sud DEMO',settore:'Carpenteria industriale B2B',citta:'Maddaloni',sito:'https://carpenteria-sud.example/',email:'commerciale@carpenteria-sud.example',
  segnali:{sito_aggiornato:'Catalogo lavori fermo al 2022 (DEMO)',scheda_google:'Presente, categoria errata (DEMO)',recensioni:'7 recensioni, media 4,1 (DEMO)',social:'Nessun video dei lavori (DEMO)',prenotazione_online:'Non pertinente (DEMO)'},
  dati:{sito:{titolo_home:'Carpenteria Metallica Sud DEMO',meta_description:'Strutture in acciaio per industria e agricoltura (DEMO)',h1:'Carpenteria Metallica Sud',pagine:['Home','Lavori (2022)','Certificazioni','Contatti'],mobile:'Leggibile, gallerie lente (rilievo DEMO)',velocita:'Caricamento home 5,2 s su rete mobile simulata (misura DEMO)',moduli:'Modulo preventivo senza informativa privacy (DEMO)',https:true,accessibilita:'Immagini senza testo alternativo (DEMO)',ultimo_aggiornamento:'2022 (DEMO)'},
   scheda_google:{nome:'Carpenteria Metallica Sud DEMO',categoria_principale:'Fabbro (categoria errata, DEMO)',categorie_secondarie:[],indirizzo:'Zona industriale lotto 12, Maddaloni (DEMO)',telefono:'0823 000 550 (DEMO)',sito:'https://carpenteria-sud.example/',orari:'Lun–Ven 8:00–17:00 (DEMO)',foto:14,post_ultimi_90_giorni:0,domande_e_risposte:1,servizi_elencati:false,prenotazione:'Non pertinente (DEMO)'},
   recensioni:[{id:'cs-r1',voto:4,data:'2026-07-22',testo:'Lavoro preciso sul capannone, tempi un po’ lunghi. (DEMO)',risposta_presente:false}],
   riepilogo_recensioni:{totale:7,media:4.1,con_risposta:0,fonte:'Conteggio DEMO della scheda inventata'},
   social:{linkedin:{pagina:'assente (DEMO)'},youtube:{canale:'assente: nessun video dei lavori (DEMO)'}},
   coerenza_dati:{telefono_sito:'0823 000 550 (DEMO)',telefono_scheda:'0823 000 550 (DEMO)',indirizzo_sito:'Zona industriale lotto 12, Maddaloni (DEMO)',indirizzo_scheda:'Zona industriale lotto 12, Maddaloni (DEMO)',directory:'Su 1 directory DEMO la categoria è Ferramenta'},
   concorrenti:[{nome:'Acciai Campania Strutture DEMO',nota:'Video dei cantieri su YouTube e LinkedIn attivo, 26 recensioni media 4,7 (DEMO)'},{nome:'Metalcarpenteria Volturno DEMO',nota:'Sito recente, nessun social (DEMO)'}]}}
];

// Cliente gestito Bottega Aurora DEMO: scheda Google, sito e recensioni inventate.
export const bottegaDemo = {
 cliente:{id:'demo-bottega',nome:'Bottega Aurora DEMO',settore:'Laboratorio artigiano di ceramiche e oggetti per la casa (DEMO)',citta:'San Marco Evangelista (DEMO)'},
 dna:'DNA DEMO · Voce calda e precisa, prima persona plurale. Parole chiave: mani, tempo, materia. Parole vietate: "low cost", "imperdibile". CTA preferite: "Passa in bottega", "Scrivici per un pezzo su misura". Pubblico: famiglie e chi cerca regali unici nell’area di Caserta (DEMO).',
 promozioni_eventi:[{data:'2026-11-14',evento:'Laboratorio aperto del sabato: dimostrazione al tornio (DEMO)',luogo:'In bottega, Corso Italia 5, San Marco Evangelista (DEMO)',orario:'10:00–12:30 (DEMO)'},{data:'2026-11-28',evento:'Anteprima collezione natalizia (DEMO)',luogo:'In bottega, Corso Italia 5, San Marco Evangelista (DEMO)',orario:'17:00–20:00 (DEMO)'}],
 scheda_google:{nome:'Bottega Aurora DEMO',categoria_principale:'Negozio di articoli da regalo',categorie_secondarie:['Laboratorio di ceramica'],descrizione:'',indirizzo:'Corso Italia 5, San Marco Evangelista (DEMO)',telefono:'0823 111 222 (DEMO)',sito:'https://bottega-aurora.example/',orari:'Mar–Sab 9:30–13:00, 16:00–20:00; domenica non indicata (DEMO)',foto:9,ultima_foto:'2026-03-01 (DEMO)',post_ultimi_90_giorni:1,domande_e_risposte:0,servizi_elencati:false,attributi:['Pagamento con carta (DEMO)']},
 dati_sito:{nome:'Bottega Aurora DEMO',indirizzo:'Corso Italia 5/A, San Marco Evangelista (DEMO)',telefono:'0823 111 223 (DEMO)',orari:'Mar–Sab 9:30–13:00, 16:00–19:30 (DEMO)',email:'ciao@bottega-aurora.example'},
 recensioni:[
  {id:'ba-r1',piattaforma:'Google',autore:'M. R. (DEMO)',voto:5,data:'2026-10-02',testo:'Ho preso un servizio di piatti fatto a mano: bellissimo e confezionato con cura. (DEMO)',risposta_presente:false},
  {id:'ba-r2',piattaforma:'Google',autore:'L. P. (DEMO)',voto:4,data:'2026-09-25',testo:'Pezzi unici, prezzi un po’ alti ma la qualità si vede. (DEMO)',risposta_presente:false},
  {id:'ba-r3',piattaforma:'Google',autore:'G. C. (DEMO)',voto:2,data:'2026-09-20',testo:'Sono passato sabato pomeriggio alle 19:45 e ho trovato chiuso, sul sito c’era scritto aperto fino alle 20. (DEMO)',risposta_presente:false},
  {id:'ba-r4',piattaforma:'Facebook',autore:'A. D. (DEMO)',voto:5,data:'2026-09-10',testo:'Il laboratorio per bambini è stato un’esperienza bellissima. (DEMO)',risposta_presente:true}
 ]
};

// Posizionamento BigAnt dal brief (Parte 1, "Chi siamo"): materiale fornito dai soci, non dati inventati.
export const bigantProfilo = {
 nome:'BigAnt Agency',area:'San Marco Evangelista (Caserta), PMI e professionisti in Campania',
 posizionamento:'La qualità di una grande agenzia senza il suo listino, un’unica regia su tutti i canali, l’AI per produrre di più con la testa che resta umana.',
 claim:'Forza sproporzionata. Siamo piccoli: è la nostra arma.',
 soci:['Raffaele La Manna — videomaker, ADS/ADV, performance','Alfonso Costantino — graphic designer, brand, direzione visiva'],
 servizi:['Google Ads e Meta Ads','SEO e local marketing (Google Business Profile)','Branding e corporate design','Siti web','Foto, video e riprese con drone','Social ed eventi','Workflow AI-assisted'],
 avvertenza:'BigAnt è un marchio condiviso tra due ditte individuali: non presentarla mai come società.',
 clienti_attuali:'Circa 14 clienti attivi, PMI e professionisti soprattutto in Campania; canoni tipici di poche centinaia di euro (brief, “Chi siamo”).',
 squadra:['Raffaele La Manna — socio: videomaker, ADS/ADV, performance','Alfonso Costantino — socio: graphic designer, brand, direzione visiva','Vincenzo — collaboratore stabile: ottimizzazione Google Business Profile dei clienti','Enzo — collaboratore stabile: foto e video'],
 settori_presidiati:['Sanità (centri medici, laboratori, fisioterapia, assistenza sanitaria)','Nautica','Ristorazione premium','Insegne e DOOH','Carpenteria industriale','Consulenza']
};

export const pacchettoPresenza = {
 nome:'BigAnt Presenza',
 composizione:['S06 Local SEO e Google Business Profile','S07 Presenza online multi-directory','S08 Reputazione e recensioni (base)','S17 Analisi gratuita trimestrale','Dashboard cliente'],
 setup_proposto:'200–300 € [DA VALIDARE dai soci]',canone_proposto:'150–250 €/mese [DA VALIDARE dai soci]',
 stato_prezzi:'Fasce del catalogo 0.1 dell’08/10/2026: proposte di mercato, non decisioni.'
};

// Struttura dei pacchetti S06 dal playbook (docs/playbook/S06_local-seo-gbp.md, sezione 13).
export const pacchettoS06={Setup:'Ottimizzazione completa della scheda, verifica del NAP, foto, servizi, Q&A',Gestione:'4 post al mese · aggiornamento delle foto · Q&A · statistiche mensili · monitoraggio del Local Pack',fonte:'docs/playbook/S06_local-seo-gbp.md, sezione 13'};
