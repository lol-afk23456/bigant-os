# Fidelity — confronto e collaudo del riordino

10 ottobre 2026. Sorgente originale consultata in sola lettura: [Fidelity, commit 350d64f](https://github.com/lol-afk23456/Fidelity/tree/350d64f16826530d1c64e6d3cbe998e3adbdd587). La HEAD remota coincide ancora con quella del precedente [inventario verificato](../research/FIDELITY-INVENTARIO.md). Acquisiti soltanto codice e documenti selezionati in `.cache/review-fidelity-350d64f`, con manifest SHA-256. Nessun archivio, segreto o certificato originale letto.

## Confronto per area

| Area originale | Stato OS verificato ora | Limite |
|---|---|---|
| Identità, attività e permessi | Sistema OS comune; assegnazioni e isolamento verificati dal server | I ruoli cliente/collaboratore definitivi aspettano il giro dedicato |
| Timbri, punti, coupon, storni | Test dominio verdi: calcolo, saldo non negativo, doppio riscatto e idempotenza | Prova su server reale da fare |
| Programmi, scadenze, consensi, iscritti, export, anonimizzazione | API già integrate e testate; aggiunto accesso UI all'anonimizzazione con conferma esplicita | Anonimizzazione non eseguita dal browser; è irreversibile |
| Scanner | Originale usa ZXing; OS usava solo BarcodeDetector. Portato ZXing 0.2.1 con risorsa locale, senza CDN | Telefono e fotocamera fisica da collaudare |
| Ciclo fotocamera | Test su lettura singola, rilascio tracce, chiusura durante richiesta pendente e permesso rifiutato | Sono test di ciclo con dispositivi simulati |
| Interfaccia | Sette sezioni: programmi, iscritti, movimenti, campagne, ritorno clienti, attività, regolamento/Wallet | Giro completo con titolare cliente ancora aperto |
| Loghi | Sharp aggiornato da 0.34.5 a 0.35.5; decodifica, limiti, metadati e isolamento ancora verdi | Build Docker e rilascio da verificare prima di pubblicare |
| Campagne e automazioni | Bozze, consenso, cooldown, approvazione dei soli soci e blocco delle uscite verificati | Nessuna consegna Apple/Google eseguita |
| Google Wallet | Firma RSA, OAuth, emissione/aggiornamento, revoca, coda persistente e comandi dei soci implementati; flag chiuso. Chiavi soltanto in variabili server protette | Verificato con risposte finte; issuer/dominio autorizzati, API reale e telefono Android ancora da collaudare |
| Apple Wallet | Payload puri presenti | Firma, certificati, registrazioni, APNs e prova iPhone ancora mancanti; account Developer da sbloccare |
| Coda aggiornamenti e invii | Google: attesa progressiva, otto tentativi, ripresa e ID stabili verificati in locale. Campagne conservate ma bloccate | Notifiche marketing e consegne Apple ancora da completare e collaudare |

## Prove osservate

- Suite completa OS: **220/220 test**, controllo progetto **5/5**. Il sottoinsieme Fidelity comprende 27 prove di dominio e quattro prove nuove del lettore e dell'asset locale. I 40 test originali descritti in `docs/acceptance.md` non sono stati rieseguiti sull'app originale.
- Browser su archivio isolato: ricerca di una tessera tramite link; saldo iniziale 4; accrediti di 4 e 2; saldo 10 e un premio disponibile; riscatto della soglia 10; saldo finale 0. Registro con quattro movimenti e un premio riscattato.
- Carta pubblica a 390 px: saldo 0, QR leggibile, viewport e contenuto entrambi larghi 390 px. È un controllo responsive, non una prova con telefono fisico.
- Build DEMO offline riuscita; lettore incluso senza richieste a CDN. Installazione npm: zero vulnerabilità segnalate nel grafo corrente. Riferimenti primari: [avviso Sharp](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w) e [ZXing Browser](https://github.com/zxing-js/browser).

Nessun rilascio, invio o carta Wallet emessa. Nessuna importazione di dati e nessuna modifica/spegnimento dell'originale. FUN-051, COL-006 e COL-007 restano aperte per le prove e le parti indicate nella tabella.


## 10 ottobre — motore Google Wallet, collegamento reale ancora chiuso

La [SOP Google Wallet](SOP-GOOGLE-WALLET.md) descrive configurazione, collaudo, attivazione per attività, pausa e recupero. Il socio sceglie una tessera di prova e conferma l’invio dei dati; la prova tecnica non attiva il servizio. Per abilitare le tessere degli iscritti deve anche attestare il controllo su Android. La carta pubblica richiede una scelta esplicita; GET, tessere DEMO e movimenti di carte mai richieste non emettono pass.

**265/265 test**, controllo **5/5**, DEMO offline costruita. Le 16 nuove prove Wallet verificano firma RSA, percorso timbri/coupon, accredito/storno, ID stabili, errori dopo scrittura, backoff anche dopo riavvio, otto tentativi e ripresa manuale, sospensione/scadenza/servizio revocato, anonimizzazione durante un aggiornamento, isolamento, concorrenza, rotazione chiave/issuer e rifiuto delle credenziali Wallet nel database. Una prova HTTP aggiunge i controlli di sessione, ruoli, origine, CSRF e metodo POST. Tutto con dati inventati e trasporto Google finto.

Browser, fixture isolata del modulo reale chiuso: schede Google/Apple separate, assenza dei comandi di attivazione quando mancano configurazione/flag, nuovo programma e iscritto creati, consenso marketing lasciato assente. Carta pubblica con Google non disponibile; QR caricato, viewport/contenuto 390 px. Screenshot tecnici nella cache `riordino-browser/fidelity-google-settings.png` e `fidelity-google-card-390.png`. Non è una prova di login browser di produzione o di un Wallet fisico.

I programmi preesistenti restano marcati DEMO finché non verificati, senza conversione automatica. Le nuove iscrizioni pubbliche in modalità reale richiedono documenti e servizio Fidelity attivo. Il corpo pubblico non espone i contatti dell’iscritto.

**COL-006, COL-007 e FUN-051 rimangono parziali.** Google reale/Android, Apple/iPhone, scanner fisico, giri definitivi dei ruoli e rilascio devono ancora essere completati. Nessuna modifica ai dati originali o a Railway; nessuna tessera, chiave o notifica reale usata. La pausa ferma anche le revoche remote: lo stato locale e quello sul telefono restano distinti finché Google non conferma.
