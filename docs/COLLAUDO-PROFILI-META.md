# Collaudo — profili Meta

10 ottobre 2026. Procedura: [SOP Meta](SOP-PROFILI-META.md). Implementazione predisposta in sola lettura; nessun account o fornitore reale attivato. FUN-012, COL-002, FUN-036 e FUN-044 rimangono parziali.

## Cosa funziona nel collaudo

- Provider ufficiale Graph v26.0: token nell’header, host fisso, GET soltanto, limite risposta 1 MB, timeout 25 secondi e nessun retry. Permessi controllati prima di ogni report; token Pagina confinato al server, token utente per Instagram. Relazione Pagina–Instagram verificata prima e dopo i dati.
- Selezione vincolata a cliente, socio, sessione, versione e credenziali; monouso, scadenza 10 minuti. Paginazione solo con cursori già ricevuti. Pagina e Instagram assegnabili a una sola attività; disconnessione locale libera la riserva.
- Servizio Social obbligatorio, utenti e sessioni riletti dal server. Anonimo, collaboratore, cliente incrociato, ruolo/servizio revocati e CSRF errato rifiutati. Gli account applicativi non autorizzano letture.
- Prova privata al socio, confronto e consenso distinti dall’attivazione. Il cliente e l’anteprima ricevono la stessa proiezione solo dopo attivazione. Una nuova prova sospende l’attivazione precedente.
- Copia in sola memoria, massimo 24 ore dall’avvio; metadati di configurazione persistenti senza contenuti né segreti. Errori, revoca di un socio coinvolto e cambio credenziali/configurazione invalidano i dati. Nessun dato vecchio dopo scadenza o riavvio.
- Aggiornamento giornaliero facoltativo; al massimo 5 clienti per giro e un tentativo ogni 24 ore per cliente. Letture manuali distanziate di un minuto. Concorrenza e chiusura scartano risultati tardivi.
- Frontend: cambio cliente/pagina/dialogo invalida risposte tardive; checkbox non preselezionati; i dati scaduti spariscono anche senza una nuova risposta dalla rete.

## Prove

12 test del provider e 16 nuovi test runtime/HTTP/interfaccia. Prima suite generale: 842/846; quattro fixture dell’interfaccia precedente ancora attendevano il vecchio segnaposto Instagram. Fixture aggiornate al nuovo stato Meta e verifiche profili 15/15 superate. Verifica finale generale: **846/846**, zero saltate; controllo progetto **5/5** (177 JavaScript, 103 documenti, 243 link).

Browser locale, esclusivamente dati inventati: Socio DEMO → Profili Instagram → elenco → scelta Facebook/Instagram → prova → attivazione senza frequenza automatica → Vista cliente → Social. Risultati Facebook e Instagram presenti; nessun controllo di configurazione nel report cliente. Desktop e 390 px: larghezza contenuto 390/390; tabella aperta 324/324; zero errori o avvisi console. Schermate nella cache tecnica `meta-profiles-desktop.png` e `meta-profiles-mobile.png`.

La revisione indipendente ha rilevato il rischio di un Instagram associabile a due clienti tramite Pagine diverse dopo uno spostamento Meta: corretto con riserva univoca anche su Instagram, verifica transazionale e test dedicato.

## Limiti reali

Non provano il collegamento reale i dati inventati, il salvataggio del token o il superamento dei test. Sono ancora necessari app Meta approvata, verifica aziendale ove richiesta, autorizzazione del titolare e confronto con le piattaforme. Il token manuale rimane compatibile; il percorso OAuth guidato è ora predisposto e testato offline (vedi aggiornamento sotto). I token scaduti richiedono un nuovo consenso del titolare.

Instagram: account professionale collegato alla Pagina, metriche aggregabili del periodo (views, reach, total_interactions). Follower del profilo come fotografia corrente; crescita Instagram ancora assente. Per alcuni ruoli Business Manager Meta indica anche permessi pubblicitari: non vengono aggiunti automaticamente.

Facebook: visualizzazioni, persone raggiunte, interazioni, nuovi follower e follower persi come serie giornaliere. Non sommiamo persone uniche; Page Insights può richiedere almeno 100 Mi piace e task ANALYZE. Assenze e soglie del fornitore producono dati mancanti, mai zero inventato. Nessuna lettura di messaggi, nessuna pubblicazione, gestione campagne o scrittura esterna.

L’interruttore `BIGANT_META_PROFILES_ENABLED` resta falso/assente in produzione. Nessun requisito viene marcato completo per la sola predisposizione.

## Rilascio verificato

Codice `5e84188`, deployment `458353d9-ac30-4686-b5d3-f66000a568d3` SUCCESS. Backup preliminare `e3a614c5-0079-4ecd-9b10-554d0959fa0d`, 20:05 Roma, 801 MB. Alle 20:09: health ok, ambiente reale, azioni e letture esterne false; `cliente.js` e `workspace.js` identici al codice verificato; nuova API senza sessione 401. Browser socio: pannello Instagram con lettura Meta non abilitata, nessun canale selezionato, nessun dato o controllo di attivazione. Zero errori console; schermata `meta-profiles-online.png` nella cache tecnica. Nessuna configurazione reale modificata.

## Aggiornamento — accesso Meta guidato

29 nuove prove offline: trasporto ufficiale, stato monouso, sessione, versione, ruoli, consenso minimo per canale, identità e app, scadenze, permessi aggiuntivi rifiutati, disconnessione, cache e risposte tardive nell’interfaccia. Tre rilievi della revisione indipendente corretti: chiavi non decifrabili bloccano anche la cache; report con scadenza non oltre il consenso OAuth; salvataggio manuale ricontrolla la sessione dopo la ricezione del corpo. Coperti anche `app_id` numerico sicuro e riavvio senza recupero automatico del consenso.

Browser locale con dati inventati: scheda Meta → consenso canali → rifiuto della prosecuzione senza scelte. Checkbox vuoti; desktop e 390 px senza overflow (pagina390/390, dialogo354/354), zero errori/avvisi. Nessuna navigazione al login reale. Schermate `meta-oauth-desktop.png` e `meta-oauth-mobile.png` nella cache tecnica.

Nessuna nuova tabella, migrazione o configurazione eseguita all’avvio: l’autorizzazione usa l’archivio cifrato e la versione già esistenti. Stato del consenso solo in RAM. Il rilascio non modifica dati o accessi Meta presenti sul server. Per questo blocco senza migrazioni si conserva la copia Railway delle20:05 e la possibilità di ripristinare il deployment precedente; nessuna cancellazione di backup né variazione del piano.
