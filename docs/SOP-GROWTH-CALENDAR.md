# Growth — calendario e prenotazioni (COL-005, FUN-050)

## Perimetro e autorizzazione

Preparazione locale dell’ultima fase Growth. Nessun account, invito o calendario reale viene usato durante lo sviluppo. Il flag `BIGANT_GROWTH_CALENDAR_ENABLED` resta spento per impostazione predefinita. Sono necessari vault, consenso Google esplicito per Calendar, configurazione corrente collaudata e attivazione di un socio. La sola autorizzazione Gmail non concede Calendar. Si riusa l’identità Google verificata; il consenso Calendar è opzionale e aggiunge soltanto `calendar.events.owned` e `calendar.freebusy`, per calendari di proprietà dell’account.

La nuova autorizzazione usa stato monouso, sessione OS, PKCE e permessi richiesti salvati lato server. Versioni, identità, flag e consenso vengono riletti dopo le attese. Una nuova configurazione o un nuovo consenso richiedono nuovi collaudi e attivazioni. Nessuna attivazione implicita dalla presenza di una chiave.

Nell’ordine di attivazione concordato, Calendar richiede anche Gmail e le precedenti fasi Growth collaudate. Per leggere o annullare un appuntamento già registrato non occorre riattivare gli invii: serve ancora un socio corrente e l’autorizzazione Calendar della stessa casella. L’amministratore non deve usare i flag del server come attestazione del collaudo.

## Configurazione e prova

Il socio sceglie il calendario, gli orari e la durata. La disponibilità usa Europe/Rome, dal lunedì al venerdì, intervalli di mezz’ora, preavviso minimo di due ore e orizzonte di 14 giorni. La prova iniziale legge la disponibilità senza creare eventi. La prima emissione deve essere una prova esplicitamente confermata dal socio; soltanto dopo una verifica della ricezione si può autorizzare l’uso delle prenotazioni. Le prove restano legate al calendario, alla casella e alla versione della configurazione.

## Prenotazione e controllo umano

Il socio autorizza un invito per il singolo contatto e controlla nome, destinatario, disponibilità e contenuto dell’invito. Il link pubblico è imprevedibile, temporaneo, monouso e legato a tale autorizzazione. La visita legge soltanto disponibilità aggregate; la conferma del destinatario prenota l’orario scelto. Non mostra altri appuntamenti o contatti e non attribuisce consenso marketing. La modifica del contatto, della configurazione o la revoca del socio sospendono il vecchio invito. Gli inviti non vengono aggiunti automaticamente alle bozze AI o spediti alla creazione del link.

Prima di prenotare: rilettura dei permessi e del consenso del contatto, pausa, versione, disponibilità remota e impegni locali. L’intenzione si registra prima dell’invio con identificativo stabile; una transazione impedisce doppio uso del token e sovrapposizioni locali, anche tra attività che condividono il calendario. L’evento contiene soltanto i dati approvati e nessuna nota commerciale interna. Google può inviare una notifica agli invitati: l’interfaccia lo esplicita prima di ogni creazione o annullamento.

La lettura FreeBusy e l’inserimento dell’evento sono richieste distinte: BigAnt OS impedisce le sovrapposizioni fra le proprie prenotazioni, ma non può bloccare una modifica simultanea effettuata direttamente in Google o da un’altra applicazione. Non presentare questa verifica come una prenotazione atomica del calendario Google.

## Esiti incerti, revoca e ripresa

Timeout, crash o risposta incoerente dopo l’inizio dell’invio lasciano l’appuntamento in verifica: niente nuovi tentativi automatici e orario ancora impegnato. La riconciliazione legge l’identificativo stabile sul calendario originale e confronta destinatario, orari e marcatura OS. Un 404 non autorizza un reinvio. L’annullamento riguarda solo eventi OS verificati, con conferma del socio; timeout dell’annullamento non fa sparire l’impegno locale. La pausa ferma nuove prenotazioni, ma permette la verifica degli esiti con la stessa autorizzazione. Non cancellare o modificare eventi estranei all’OS.

Per l’annullamento viene riletta la versione remota dell’evento e inviata come condizione `If-Match`: un evento modificato nel frattempo richiede una nuova verifica. Questa condizione è supportata dalla [documentazione Google sulle versioni](https://developers.google.com/workspace/calendar/api/guides/version-resources).

## Contratto applicativo

Tutte le route private richiedono un socio ancora attivo, attività accessibile e sessione OS; le scritture richiedono CSRF e stessa origine. Nessun ruolo amministrativo viene attribuito a un visitatore del link pubblico.

| Percorso | Metodo | Effetto |
|---|---|---|
| `/api/growth/calendar/config` | POST | Salva calendario, durata e orari con versione corrente |
| `/api/growth/calendar/check` | POST | Legge disponibilità, senza invitare |
| `/api/growth/calendar/probe-preview` | POST | Prepara la prova con destinatario fissato alla casella autorizzata |
| `/api/growth/calendar/probe` | POST | Crea la sola prova esplicitamente confermata |
| `/api/growth/calendar/probe-verify` | POST | Verifica l’evento e registra la ricezione dichiarata dal socio |
| `/api/growth/calendar/activate` | POST | Attiva o sospende la configurazione corrente |
| `/api/growth/leads/:id/invite-preview` | GET | Mostra i dati del singolo invito, senza contattare il destinatario |
| `/api/growth/calendar/invite` | POST | Crea il link confermato, senza spedirlo |
| `/api/growth/public/book/:token` | GET / POST | Legge gli orari / prenota dopo la conferma del destinatario |
| `/api/growth/meetings/:id/reconcile` | POST | Verifica l’esito originale, senza ripetere l’invito |
| `/api/growth/meetings/:id/cancel-preview` | GET | Verifica l’evento e prepara l’annullamento |
| `/api/growth/meetings/:id/cancel` | POST | Annulla la versione confermata, con notifica Google |

Lo stato locale e l’elenco degli appuntamenti sono inclusi in `/api/growth/state`. Avanzamento usa un riepilogo minimo senza account, contatti o chiamate a Google. I token non sono conservati in chiaro; le risposte pubbliche non mostrano altri appuntamenti e mascherano il destinatario.

Leggere gli orari pubblici non modifica inviti, contatti, prove o appuntamenti. La lettura autorizzata delle credenziali conserva però il proprio audit: il registro di sicurezza non viene disabilitato per rendere il GET artificialmente privo di scritture. Stato e Avanzamento, che leggono solo metadati locali, non aprono il vault e non scrivono.

## Prove richieste

Consenso parziale, flusso OAuth precedente, casella errata, revoca durante una richiesta; flag spenti e ruoli negati; configurazioni e inviti obsoleti; date e fuso orario; concorrenza sul token e sugli orari; timeout prima/dopo l’invio, riavvio, riconciliazione incoerente o assente; destinatario modificato; conferma e annullamento; assenza di effetti esterni. Browser socio e pagina pubblica anche a 390 px. Prove reali da autorizzare separatamente.

Fonti ufficiali consultate il 10 ottobre 2026: [permessi Calendar](https://developers.google.com/workspace/calendar/api/auth), [disponibilità](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query), [creazione eventi](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert), [gestione errori](https://developers.google.com/workspace/calendar/api/guides/errors). I dettagli del protocollo non costituiscono un collaudo del progetto Google o del server Railway.
