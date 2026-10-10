# Google Business Profile — lettura autorizzata

Versione 1 · 10 ottobre 2026 · FUN-012, FUN-013, COL-002. Prima implementazione del canale Google, chiusa dal flag `BIGANT_GBP_ENABLED=false`. Prove esclusivamente con account, schede, recensioni e risposte inventati. Nessun collegamento o rilascio reale autorizzato da questa procedura.

## Metodo e confini

1. Il socio configura un client OAuth dedicato nella scheda GBP dei Collegamenti. Il consenso GBP è distinto da Gmail/Calendar e non richiede accesso alla casella. Ambiti `openid`, `https://www.googleapis.com/auth/userinfo.email`, `https://www.googleapis.com/auth/business.manage`: Google concede un ambito ampio; questa implementazione usa soltanto letture delle schede. Indicare chiaramente tale differenza prima del consenso.
2. Autorizzare la casella dichiarata con sessione corrente, PKCE, stato monouso e verifica dell'identità Google. Token e verificatore cifrati; nessuna rotta li restituisce. Nuovo consenso o modifica delle chiavi invalida prove e attivazioni precedenti. La disconnessione nell'OS ferma l'uso locale; la revoca della concessione Google si effettua separatamente nelle autorizzazioni dell'account.
3. In Profili → Google Business Profile, scegliere un account e una scheda fra quelli restituiti da Google. La selezione temporanea resta legata a socio, attività, versione del collegamento e configurazione: non basta inviare un ID arbitrario. Confermare che la scheda appartenga all'attività selezionata; non equivale alla verifica indipendente T5.
4. Collaudare la lettura della scheda scelta: dettagli pubblici, prima pagina delle recensioni (massimo 50, con totale e indicazione di ulteriori recensioni) e valori giornalieri Google per clic al sito, chiamate e indicazioni stradali. Periodo di 28 giorni concluso tre giorni prima della lettura; lacune e valori non forniti restano tali. Mostrare i valori ricevuti, senza aggregati o indicatori inventati.
5. Il socio confronta il risultato con Google e autorizza l'attivazione per questa attività. Aggiornamento automatico una volta al giorno soltanto se esplicitamente abilitato, più Aggiorna ora manuale. Il fallimento automatico non produce retry ravvicinati. Configurazione, autorizzazione, permessi, servizio e attività vengono ricontrollati anche dopo ogni attesa.
6. Il cliente può leggere soltanto i propri dati già acquisiti e con servizio locale attivo. La navigazione cliente definitiva resta in attesa del giro dedicato. Collaboratori esclusi da questa gestione provvisoria. Il cliente non può avviare richieste Google, scegliere schede o modificare collegamenti.

## Conservazione e veridicità

I contenuti Google restano soltanto nella memoria del processo, per massimo 24 ore, con un limite di risorse; nessun testo recensione, nome del recensore, dettaglio della scheda o serie statistica in SQLite, backup, audit o log. Il database conserva configurazione scelta, versioni, autorizzazioni e date/esiti. Dopo un riavvio o una scadenza i dati sono assenti finché arriva una nuova lettura; l'ultima sincronizzazione storica non viene presentata come dato disponibile. Revoca, pausa e cambio scheda impediscono l'accesso alla vecchia copia.

I dati della cache non alimentano AI, Growth, export o report persistenti. Nessun nome/foto recensore richiesto ad altri servizi; niente caricamento di immagini remote. Si mostra l'attribuzione Google e il collegamento Maps verificato restituito dalla fonte. La corrispondenza non viene dedotta dal link pubblico registrato nel ciclo precedente.

Distinguere lacune da zeri: nella serie giornaliera, un punto con data presente e campo `value` omesso rappresenta zero secondo il contratto Google; la UI lo spiega senza alterare l'oggetto conservato. Una data o un'intera serie non restituite restano mancanti. Riferimento: [TimeSeries / DatedValue](https://developers.google.com/my-business/reference/performance/rest/v1/TimeSeries).

## Contratti interni

`createBusinessProfileOAuth({store,connections,env,origin,enabled,clock,providerOptions})` → `state(user)`, `metadata()` (solo interno, senza segreti), `start(user,{version,email,acknowledged:true})`, `finish(user,{state,code,error})`, `accessToken(user,authorizationVersion)`, `disconnect(user,{version})`. `metadata/state`: `{available,configured,connected,version,connectionVersion,email,lastCheck,authorizedBy}`; `version` è la revisione dell'autorizzazione GBP, `connectionVersion` la versione delle chiavi GBP. `start.version` usa connectionVersion; disconnect.version usa version. Callback `/auth/google-business/callback`. Funzione `accessToken` interna, mai esposta HTTP. enabled può essere booleano o funzione.

`createBusinessProfile({store,auth,enabled,clock,providerOptions})` → `state(user,clientId)`, `accounts(user,clientId,{pageToken?})`, `locations(user,clientId,{accountName,pageToken?})`, `configure(user,clientId,{version,selectionToken,confirmedBusiness:true})`, `check(user,clientId,{version})`, `activate(user,clientId,{version,enabled,daily,confirmed:true})`, `refresh(user,clientId,{version})`, `tick()`, `progress(user)`, `close()`.

State: `{available,configured,version,status,checked,enabled,daily,lastSync,error,canManage,data,note}`. `status` = Da collegare / Collegato / Errore. `data` nullo oppure `{location,reviews,performance,from,to,fetchedAt,expiresAt,source:'Google Business Profile',sourceUrl}`; i tre oggetti conservano i dati restituiti da Google con campi previsti e limiti verificati, senza ricalcolare valori. `reviews` prima pagina, totale e nextPageToken (solo per indicare che Google ne ha altre, non eseguire paginazioni implicite). `accounts` restituisce `{items:[{name,label}],nextPageToken}`; `locations` restituisce `{items:[{name,title,address,selectionToken}],nextPageToken}`. Le selezioni scadono dopo dieci minuti. Letture state/progress senza rete, audit o scritture. Il socio vede la prova prima dell'attivazione, il cliente soltanto dati di una configurazione attiva.

API comuni: GET `/api/connections/gbp/oauth/state`, POST `/api/connections/gbp/oauth/start|finish|disconnect`; POST `/api/business-profile/accounts|locations|configure|check|activate|refresh?clientId=…`, GET `/api/business-profile/state?clientId=…`. Profili conserva il contratto precedente e aggiunge `businessProfile` a livello principale. Nessuna risposta, creazione, cancellazione o modifica di schede Google implementata.

## Prove obbligatorie

Scope separati e flag chiuso, PKCE/stato/sessione/versione, account errato e consenso incompleto, errori senza segreti, revoca e disattivazione durante una richiesta. Isolamento fra clienti e selezioni, cliente senza servizio, concorrenza, configurazioni obsolete, attivazione prima della prova rifiutata. Cache scaduta/riavvio/limiti, aggiornamento giornaliero senza doppio giro, errore senza falsi zeri o successo. Tutte le richieste Google Business sono GET; i soli POST esterni sono scambio/rinnovo OAuth. UI desktop e mobile, fonti, mancanze e modifiche di contesto.

## Fonti ufficiali consultate

- [Regole Business Profile](https://developers.google.com/my-business/content/policies): utilizzo per attività gestite con autorizzazione; contenuti temporanei protetti, massimo 30 giorni. Scelta prudenziale OS: memoria volatile per 24 ore, senza riuso esterno.
- [Preparazione e accesso API](https://developers.google.com/my-business/content/basic-setup), [prezzi](https://developers.google.com/my-business/content/pricing): API senza costo d'uso indicato; approvazione del progetto e quote da verificare, nessuna disponibilità account attestata.
- [Recensioni](https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list): lettura paginata, massimo 50 per pagina, scheda verificata.
- [Scheda attività](https://developers.google.com/my-business/reference/businessinformation/rest/v1/locations/get), [valori giornalieri](https://developers.google.com/my-business/reference/performance/rest/v1/locations/fetchMultiDailyMetricsTimeSeries), [identità Google](https://developers.google.com/identity/openid-connect/openid-connect).

Prima dell'attivazione reale: istruzioni per il proprietario, verifica accesso approvato/quote/costi, account e una scheda pilota autorizzata, controllo dati e ruoli sul server. Nessuna parte di questo documento sostituisce l'ok richiesto da T6.
