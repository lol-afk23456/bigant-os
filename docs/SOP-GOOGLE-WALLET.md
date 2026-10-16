# SOP — Google Wallet in Fidelity

Versione 1 · 10 ottobre 2026 · responsabile: socio BigAnt. Preparazione locale: nessun rilascio o collegamento reale eseguito. Catalogo: Fidelity, integrazione Wallet; COL-006, COL-007, FUN-051. Apple e campagne sono percorsi distinti ancora chiusi.

## Prima dell’attivazione reale

Il rilascio e l’uso dell’account reale richiedono l’istruzione esplicita del proprietario. Servono backup verificato, attività con Fidelity attivo, regolamento e informativa verificati, dominio HTTPS, issuer Google autorizzato e account di servizio abilitato per quell’issuer. Il salvataggio nell’app Google Wallet va provato con un Android fisico; un risultato tecnico non dimostra che l’utente abbia salvato la carta.

Le sole variabili protette del server sono `GOOGLE_ISSUER_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON` e il flag `BIGANT_GOOGLE_WALLET_ENABLED`, chiuso salvo valore esplicito `true`. L’origine deriva dalla configurazione HTTPS OS. Non inserire chiavi nel database, repository, moduli dell’app, allegati o log. Eventuali vecchie righe cifrate Wallet rimangono conservate ma non vengono usate dal nuovo motore. Nessuna variabile reale è stata letta o impostata durante lo sviluppo.

## Collaudo e abilitazione per attività

1. Il socio apre Fidelity → Regolamento e Wallet dell’attività corretta. Il flag server rende disponibile il collaudo, ma non attiva automaticamente l’emissione per gli iscritti.
2. Usa un programma non DEMO e una persona di prova consapevole; nella finestra conferma l’invio a Google di nome, codice, saldo, premi e informazioni del programma. Ripetere il collaudo sospende l’attivazione precedente.
3. Il sistema crea o aggiorna classe e oggetto e restituisce un collegamento firmato solo dopo la conferma del provider. Aprilo su Android e aggiungi la tessera; verifica nome, QR, saldo e premio.
4. Registra un accredito, ripeti il collaudo della medesima tessera e controlla l’aggiornamento sul telefono. Prova poi riscatto e storno. Gli ID stabili mantengono una sola carta.
5. Solo dopo queste verifiche il socio seleziona “Conferma prova Android e attiva”. L’attestazione è registrata. Il titolare della carta può prepararla con una richiesta POST esplicita dalla pagina pubblica; una visita o un GET non la emette.
6. A regime il worker invia gli aggiornamenti delle sole tessere già richieste/collaudate. Saldi e movimenti del database restano la fonte autorevole. Campagne, messaggi promozionali e Apple Wallet restano disattivati.

Una tessera su Google non attesta il consenso marketing. Nessuna email, telefono o credenziale dell’account di servizio viene inclusa nella carta. Il nome viene usato per loyalty; i coupon contengono i dati dell’offerta e il codice della tessera.

## Errori, pausa e revoca

Ogni operazione ricontrolla flag, configurazione, autorizzazione corrente del socio, attività, servizio e versione dei dati prima e dopo la rete. Una variazione durante la richiesta scarta l’esito non più valido e conserva la necessità di riconciliare. Un cambio issuer sulle tessere esistenti richiede una migrazione esplicita, non crea automaticamente una seconda carta.

La coda è persistente e lavora sul saldo più recente. Una richiesta per iscritto alla volta, attesa progressiva da 5 secondi a 5 minuti, massimo otto tentativi; i nuovi movimenti non saltano l’attesa del precedente. Un esito incerto si riconcilia sullo stesso oggetto. Dopo il limite o un errore permanente, il socio verifica la causa e usa “Riprova” nelle Attività Fidelity. Le operazioni rimaste in corso al riavvio e gli intenti interrotti sono recuperati; il recupero non aggira le autorizzazioni.

Errori Google 401/403 invalidano prova e attivazione. Rotazione delle chiavi, revoca del socio o pausa impediscono nuove uscite. Le chiavi e le risposte grezze del provider non compaiono negli errori, nell’audit o nelle API. Il link firmato viene restituito al richiedente, non salvato nella coda o nell’audit.

L’anonimizzazione invalida subito il link pubblico e accoda la rimozione del codice e dei dati personali dall’oggetto Google, reso inattivo. Anche scadenza, sospensione del programma o rimozione del servizio generano revoche. **Pausa o flag spento sospendono anche le revoche remote**: una carta nel telefono può mantenere dati precedenti fino alla ripresa. Controllare le operazioni pendenti prima di sospendere o dismettere un’attività; l’interfaccia corrente non offre il recupero manuale delle attività ormai archiviate. Il programma non può dichiarare rimossi i dati remoti prima della conferma Google.

## Prove e limiti attuali

Trasporto Google sostituito da risposte finte nelle prove; firme RSA generate e verificate localmente, nessuna chiave vera. Suite completa: 265 test; 16 prove del motore/provider e una nuova prova HTTP per origine, CSRF, ruoli e percorso pubblico. Browser: fixture con modulo Fidelity reale chiuso e contenitore DEMO, creazione di programma e tessera inventati, nessun consenso marketing, carta a 390 px senza overflow e QR caricato. Non è un test di autenticazione browser di produzione, né un collaudo Google/Android.

Per completare COL-006 restano account e dominio autorizzati, verifica delle classi/payload contro l’API reale, salvataggio e aggiornamento su Android e l’intero percorso Apple. Nessuna importazione dagli originali (D-11), nessuno spegnimento o rilascio eseguito.

Riferimenti primari verificati durante lo sviluppo: [OAuth per account di servizio](https://developers.google.com/identity/protocols/oauth2/service-account), [JWT Wallet](https://developers.google.com/wallet/retail/loyalty-cards/use-cases/jwt), [aggiornamenti delle carte](https://developers.google.com/wallet/retail/loyalty-cards/use-cases/updates), [API patch LoyaltyObject](https://developers.google.com/wallet/reference/rest/v1/loyaltyobject/patch). Adattamento dal codice originale Fidelity 350d64f in sola lettura; inventario in [FIDELITY-INVENTARIO](../research/FIDELITY-INVENTARIO.md).
