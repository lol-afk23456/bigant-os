# Email marketing — contatti e consensi (FUN-040)

Servizio autonomo `email-marketing`, acquistato esplicitamente dall’attività. I contatti si raggiungono dalla sua scheda servizi e da I tuoi servizi → Email marketing; non compaiono nel menu generale. Growth e Fidelity mantengono i propri archivi e non alimentano questo elenco.

Il socio e il cliente titolare possono registrare un contatto e la prova del consenso ricevuto: email, nome facoltativo, data, fonte/riferimento e versione dell’informativa. Il sistema registra una dichiarazione dell’operatore, senza dichiarare verificata l’identità del destinatario. Nessun contatto viene importato, cercato o iscritto automaticamente. Duplicati per attività rifiutati; stessa email in attività diverse isolata.

La revoca richiede un motivo e resta nello storico. Una nuova dichiarazione di consenso richiede una prova nuova, data non precedente alla revoca e conferma esplicita; nessuna riattivazione implicita. Lo storico è immutabile, le decisioni concorrenti o obsolete sono rifiutate. Email e nome non vengono copiati nell’audit. I collaboratori assegnati consultano; soci e titolare modificano. L’anteprima socio della vista cliente resta in sola lettura.

Ogni richiesta ricontrolla identità, sessione, attività e servizio attivo. La rimozione del servizio nasconde i contatti e blocca le API, senza cancellarli. Ricerca e paginazione restano limitate all’attività corrente. La UI rifiuta il salvataggio di un dialogo se nel frattempo cambiano attività o pagina.

API: `GET /api/email-marketing/contacts` (ricerca `q`, pagina `page`), `POST /api/email-marketing/contacts`, `GET /api/email-marketing/contacts/:id/history`, `POST /api/email-marketing/contacts/:id/consent`. Tutte richiedono autenticazione, attività corrente e, per le scritture, CSRF. Il servizio è registrato anche nel catalogo e nel Piano di attivazione.

Questa funzione gestisce il registro dei contatti: campagne, invii, sincronizzazione con fornitori, doppia conferma via email e misure di apertura/clic restano da collegare. Non usa Gmail Growth, non invia messaggi e non certifica adempimenti legali.

Collaudo: consenso incompleto/futuro rifiutato senza scritture, deduplicazione, revoca e nuovo consenso, conflitti e storico immutabile, ruoli/sessioni/servizi revocati, isolamento, ricerca/pagine, HTML escapato, anteprima in sola lettura e nessun effetto esterno.
