# Risultati dei clienti — FUN-015 / FUN-035

Un report periodico raccoglie obiettivi, lavori svolti, risultati e prossimi passi dell’attività. Si prepara prima nell’area soci, nella vista comune Risultati dei clienti e nella scheda dell’attività. Non contiene obiettivi di fatturato dell’agenzia.

Ogni voce riguarda un servizio acquistato e dichiara fonte e data; eventuali misure mancanti restano vuote. Il socio inserisce e verifica i dati: non vengono presentati come sincronizzati da un fornitore. Bozze, memoria e contabilità interne non vengono copiate automaticamente. Report per mese, versioni immutabili, modifica concorrente rifiutata.

Il socio legge l’anteprima completa e conferma la versione da mostrare. Solo allora compare I tuoi risultati nella home del cliente. Una modifica, una revoca o un cambiamento dei servizi invalida la visibilità della versione; il cliente non legge bozze, storico interno o documenti di altre attività. Si può nascondere il report senza cancellare lo storico. La pubblicazione nell’area cliente non invia email o notifiche e non chiama servizi esterni.

Percorsi registrati: `GET /api/client-results/index` (soci, riepilogo di tutte le attività), `GET /api/client-results` (soci, report e storico dell’attività), `POST /api/client-results/save`, `POST /api/client-results/publish`, `POST /api/client-results/hide` (soci); `GET /api/cliente/results` (proiezione pubblicata comune a cliente e anteprima). I report dei singoli servizi rimangono nelle loro sezioni; questa è la sintesi trasversale richiesta, non la vecchia pagina Report mensili.

Prove: permessi correnti, isolamento, servizi rimossi, conflitti, versioni e storico immutabili, visibilità prima/dopo verifica, revoca, valori nulli distinti da zero, date/fonti, nessuna rete o scrittura dalle letture. Collaudo con attività e dati inventati. L’esistenza del report manuale non completa le integrazioni automatiche dei canali.
