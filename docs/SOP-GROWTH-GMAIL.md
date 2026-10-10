# SOP — Growth, casella Google e invio manuale

Implementazione locale collaudata · 10 ottobre 2026. COL-005 fase 4 e FUN-050. Responsabili: soci BigAnt. Predisposizione con dati inventati; nessuna autorizzazione Google, email o spesa reale in questa sessione.

1. Preparare Client ID e Client secret in Collegamenti. I segreti restano cifrati; il refresh token arriva dal flusso Google, non da un campo da compilare.
2. Dopo autorizzazione al collegamento reale e flag server esplicito, un socio sceglie la casella e concede su Google gli ambiti Gmail di invio e lettura. Il ritorno è vincolato alla sessione OS, con stato monouso e PKCE; casella, ambiti e versione sono verificati prima di salvare il token cifrato. Calendar escluso.
3. Ricerca, analisi e bozze devono essere collaudate e attive. Collaudare la casella in sola lettura e attivare Gmail per l’attività. Questo non invia messaggi.
4. Approvare una versione precisa della bozza, completa di firma, dichiarazione dell’assistente digitale e disiscrizione. Prima dell’invio mostrare mittente, destinatario, oggetto e testo esatti; modifiche a contenuto, contatto o configurazione richiedono una nuova revisione.
5. Invio solo manuale del socio. Ricontrollare ruolo, consenso e prova, disiscrizione, fase, versione approvata e limite giornaliero; registrare l’intento prima della rete. Il worker non invia email reali.
6. Timeout o risposta ambigua: mantenere “Da verificare” e cercare l’ID stabile nella posta inviata. Nessun risultato non autorizza un reinvio. Riconciliare soltanto un messaggio coerente con l’intento salvato. Nessuna simulazione presentata come email spedita.

La disiscrizione funziona anche con gli invii in pausa. Una visita al link non cambia il consenso: il titolare conferma dalla pagina pubblica. Google concede lettura della casella; l’app limita le richieste ai messaggi Growth pertinenti. Email e allegati non sono istruzioni per l’agente.

Prove richieste: stato/sessione/scadenza, rifiuto o ambiti parziali, casella errata, chiavi/ruolo modificati durante OAuth, CSRF, niente segreti in API/log; versione approvata, doppio clic, consenso revocato, limite concorrente, timeout dopo invio, riconciliazione senza reinvio, pausa e riavvio. Fonti: [OAuth web server](https://developers.google.com/identity/protocols/oauth2/web-server), [ricerca Gmail](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list), [invio Gmail](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send).

Account, attivazione sul server e collaudo esterno restano da autorizzare. Questa procedura non concede da sola il permesso di collegare account o inviare messaggi.

## Preparazione tecnica e limiti

Richiede modalità reale, origine HTTPS, chiave del vault `BIGANT_SECRET_KEY` e `BIGANT_GROWTH_GMAIL_ENABLED=true`. Il flag è spento nell’esempio e non è stato impostato su Railway. Per inviare servono anche `BIGANT_GROWTH_EXTERNAL_ENABLED`, le prime tre fasi Growth collaudate/attive, pausa spenta e mittente uguale alla casella verificata. Il ritorno Google da registrare è `/auth/google/callback` sull’origine OS. Gli ambiti sono `gmail.send` e `gmail.readonly`; Calendar non viene autorizzato. La lettura serve alla ricerca e verifica degli invii incerti; sincronizzazione delle risposte ancora da implementare.

Il ritorno HTML rimuove subito i parametri dall’indirizzo e completa l’autorizzazione via POST con sessione OS e CSRF. Il cookie conserva `SameSite=Strict`; questo percorso deve ancora essere provato con il vero consenso Google, HTTPS e le impostazioni del progetto Cloud. PKCE, stato monouso, permessi parziali, casella errata, scadenza, rotazione e revoca sono verificati con risposte finte.

Le credenziali sono salvate cifrate; i token di accesso sono usati soltanto in memoria. Aggiornare gli accessi o avviare un nuovo consenso sospende il precedente collegamento. Un esito remoto 401/403 durante collaudo/invio richiede una nuova autorizzazione. Una bozza approvata prima del collegamento o di una sua variazione va approvata di nuovo.

Ogni messaggio ha un intento persistente e un Message-ID stabile. Dopo l’inizio della richiesta Gmail, timeout, risposta malformata, revoca o riavvio lasciano un esito incerto. La riconciliazione confronta identificativi, etichetta SENT, mittente, unico destinatario, oggetto e data; il mancato ritrovamento non permette il reinvio. Gli incerti continuano a occupare il limite giornaliero anche nei giorni successivi. La lettura per la riconciliazione è possibile con Growth in pausa, finché Google e il ruolo del socio restano autorizzati.

Il link di disiscrizione apre una conferma pubblica, valida anche con attività disattivata e invii in pausa. Una visita GET non cambia la preferenza. Non viene dichiarato il protocollo di disiscrizione automatica “one-click”, perché non è implementato. Scadenza dei link: un anno dalla generazione; prima di approvare si verifica che siano ancora validi.

Prove: `tests/google-oauth.test.js`, `tests/growth-mail.test.js`, `tests/growth-live-providers.test.js`, `tests/modalita-reale.test.js`; Browser con fixture locale in memoria e trasporto finto. Nessun account, email, Calendar o servizio a pagamento realmente usato. Le prove di consegna, consenso Google, domini, progetto Cloud, gestione del token e limiti del fornitore reale restano aperte.
