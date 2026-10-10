# Vista cliente e report dei servizi

UI-010, FUN-036…044, COL-004. Applicare le decisioni già prese nella mappatura principale; il giro definitivo con il proprietario rimane distinto dal collaudo locale.

La home mostra card compatte. Ogni clic apre una sola sezione e un ritorno chiaro: servizi attivi oppure documenti. Un report si apre dal relativo servizio, anche nella scheda dell’agenzia. La Vista cliente del socio usa gli stessi dati pubblicabili al cliente, sempre in sola lettura.

Il server rilegge identità, assegnazione e servizi. Le risposte per il cliente non contengono task, bozze, approvazioni interne, memoria riservata, trascrizioni degli agenti, chiavi o economia dell’agenzia. I percorsi precedenti conservano il codice ma non offrono scorciatoie ai dati nascosti. Fidelity e i suoi conteggi richiedono il servizio Fidelity; Growth resta interno all’agenzia e non equivale all’acquisto di Email marketing.

Si nascondono approvazioni/calendario, report generici, servizi consigliati, richieste all’agenzia e profilo personale. Documenti contiene soltanto i contratti propri: fatture e pagamenti rimangono fuori finché Trello è il registro ufficiale. I risultati generali del cliente attendono la configurazione e verifica della vista amministrativa.

I report distinguono dati disponibili e fonti da collegare. Ogni misura disponibile dichiara fonte e data; un collegamento pubblico non certifica una sincronizzazione. Le letture Google autorizzate possono essere mostrate solo dalla cache corrente e attiva, con gli stessi limiti temporali della sezione Profili. La consultazione non contatta fornitori, attiva servizi o modifica account. Non riclassificare contatori di bozze come risultati commerciali.

Prove con attività inventate: due clienti con servizi diversi, rimozione del servizio, sessione/revoca, accesso diretto ai percorsi vecchi, anteprima socio equivalente, contratto isolato, nessuna scrittura o rete alla consultazione, navigazione e ritorno su desktop e telefono. Il collaudo locale non certifica gli account o il server reale.

## Registrazione della funzione

La funzione sostituisce la proiezione pubblica della dashboard già registrata: `createClientDashboard` esporta `createClientArea` da `src/cliente/area.js`. Il corpo precedente resta privato per conservare il lavoro originale. Percorsi comuni, tutti in sola lettura:

| Percorso | Risultato |
|---|---|
| `GET /api/cliente/dashboard` | Home, servizi acquistati e contratti propri |
| `GET /api/cliente/services/:id` | Report del servizio corrente |
| `GET /api/client-record/contracts` e relativo PDF | Stessi documenti per cliente e anteprima del socio |

La voce Vista cliente e le card dei servizi riutilizzano queste proiezioni. La registrazione non aggiunge servizi acquistati né collegamenti. Catalogo storico delle nove sezioni conservato ma non usato dalla risposta pubblica. [Prove e limiti](COLLAUDO-VISTA-CLIENTE.md).
