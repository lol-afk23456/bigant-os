# Approvazione e calendario dei contenuti — FUN-062

Procedura locale, 10 ottobre 2026. Nessun canale esterno collegato o autorizzato.

1. Il team o lo Sciame prepara una bozza per un servizio attivo dell’attività. La porta **DA APPROVARE**: titolo, testo e numero di versione entrano nella coda comune.
2. Una persona del team legge quella versione. Per i post social può decidere un socio oppure un collaboratore assegnato all’attività; per gli altri contenuti decide un socio. Il cliente e l’identità tecnica dell’Orchestratore non possono decidere.
3. Il server rilegge identità, permessi, servizio e contenuto. Accetta la decisione soltanto se la richiesta pendente corrisponde a cliente, contenuto, versione, titolo e testo correnti. Un rifiuto motivato torna al team e produce una nuova versione.
4. Prima di inserire una data nel calendario, il server ricontrolla l’approvazione: persona ancora attiva e autorizzata, data della decisione presente, stessa versione e stesso testo, servizio ancora attivo. Un’approvazione vecchia, incompleta o tecnica non basta.
5. Una modifica del contenuto annulla le approvazioni precedenti, elimina la data e rimette la bozza in produzione. Se l’approvatore non ha più i permessi, il team salva una nuova revisione e la sottopone a una persona autorizzata.
6. **PROGRAMMATO** significa soltanto pianificato nel calendario interno. Ogni tentativo di registrare **PUBBLICATO** viene rifiutato: dopo il controllo dell’approvazione manca comunque un collegamento esterno collaudato e autorizzato. Non si inventano ricevute o risultati.

I passaggi interni dello Sciame DEMO possono continuare con la simulazione già prevista; questo non approva i contenuti prodotti. Le bozze restano **DA APPROVARE**, senza data. La verifica Qualità è distinta dalla decisione umana.

## Prove richieste

Test in memoria su soci e collaboratori, richieste senza approvazione, versioni superate, contenuto diverso, attività e servizi revocati, approvatori disattivati o non più assegnati, identità tecniche e oggetti utente obsoleti. Verificare sia il passaggio valido al calendario interno sia il rifiuto della pubblicazione con approvazione valida. Nessuna chiamata di rete necessaria.

## Limiti e passo successivo

Questo controllo non realizza una pubblicazione automatica. Meta, Google Business Profile, PED o il futuro programmatore richiederanno un’implementazione separata, un collaudo autorizzato e la prova dell’effettiva pubblicazione. Prima di ogni futuro invio, ripetere il controllo sulla versione esatta al momento dell’esecuzione, gestire revoche, duplicati e ricevute; non utilizzare soltanto lo stato **PROGRAMMATO** come autorizzazione.

Le approvazioni storiche incoerenti non vengono corrette retroattivamente né considerate valide: occorre una nuova revisione. Nessun rilascio o modifica ai database reali è compreso in questo intervento.
