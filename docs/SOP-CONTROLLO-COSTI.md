# Controllo dei costi prima delle operazioni a pagamento

Requisiti: tetto complessivo 50 €/mese, stop prima di raggiungere 40 € (80%), Railway almeno 20 € già impegnati, consumi ignoti diversi da zero. Integra FUN-056 e [COSTI](COSTI.md); non autorizza nuove spese.

1. Il socio verifica i pannelli dei fornitori e dichiara, per il mese corrente Europe/Rome, i costi e gli impegni esterni **non già registrati nel contatore OS**. Include Railway, imposte e cambio prudenziale. Niente fatture, credenziali o dati dei clienti nel modulo.
2. La conferma è esplicita, versionata e non modifica i movimenti OS. Deve includere almeno 2.000 centesimi Railway. Un totale sopra soglia si può registrare: ferma le nuove operazioni, senza nascondere la spesa.
3. Senza conferma valida del mese, o se il socio che l'ha registrata non è più autorizzato, nessuna prenotazione onerosa parte. Al cambio mese serve una nuova verifica. I consumi esterni vanno aggiornati quando cambiano: questa è una dichiarazione del socio, non una sincronizzazione dei conti.
4. Prima di una chiamata onerosa, una transazione somma costi OS contabilizzati, prenotazioni del mese, prenotazioni precedenti ancora aperte e totale esterno dichiarato. Rifiuta l'operazione se raggiungerebbe il minore tra 40 € e l'80% del tetto configurato. Restano anche i limiti interni già esistenti.
5. Una prenotazione si conta una sola volta quando diventa costo. Esiti incerti conservano l'impegno prudenziale; nessun errore di rete autorizza tentativi gratuiti. Le operazioni locali DEMO a costo zero e le letture già autorizzate non vengono bloccate da questo contatore.
6. La schermata Budget mostra stato della verifica, totale, margine effettivo, socio e data. Il server riserva lettura e modifiche ai soci; versione, mese, identità e sessione vengono verificati. Ogni revisione lascia una prova immutabile e una voce nel Registro.

Verifiche: totale ignoto, soglia esatta e un centesimo sotto, concorrenza tra moduli, cambio mese a Roma, prenotazioni aperte, revoca del socio, importi malformati, aggiornamento obsoleto, timeout, permessi HTTP, salvataggio e navigazione desktop/mobile. Tutti i dati dei test sono inventati, trasporti simulati.

Limite: le stime delle singole chiamate non sono tariffe o fatture verificate e il contatore non osserva spese fatte direttamente fuori dall'OS. Prima di attivare servizi reali occorrono riconciliazione dei pannelli, stime adeguate, eventuali limiti del fornitore e OK alle spese. Nessuna dichiarazione di gratuità per Codex o account esterni.
