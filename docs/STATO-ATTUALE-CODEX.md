# BigAnt OS — ripresa rapida

Aggiornato il 10 ottobre 2026. Questo file riassume lo stato; non sostituisce le decisioni del proprietario o la mappatura principale.

- Repository: `~/Documents/BigAnt-OS-Codex`, ramo `bigant-os-notte-1`.
- **Codice online:** `a752be3`, Railway BigAnt OS / bigant-os-server / production; deployment `f7a9d622-5175-4487-a462-068602ff8c5c` SUCCESS. Documentazione successiva sullo stesso ramo.
- Backup Railway prima del rilascio: 10 ottobre, 17:00, 799 MB referenziati, confermato dall’API ufficiale. Copia giornaliera applicativa inclusa; prima esecuzione da verificare. Nessuna pianificazione aggiuntiva Railway impostata.
- Ultime prove del codice: **769/769**, zero saltate, controllo progetto **5/5**. Dieci nuove regressioni su scheda/sessione/credenziali/logout, una revisione indipendente, browser su anagrafica, memoria, avvio e uscita. Health online OK, due file aggiornati corrispondenti e due API anonime 401. Non rifare queste prove se il codice non cambia.
- Ultimo sviluppo: moduli associati al cliente iniziale, nessuna credenziale tardiva dopo cambio pagina o uscita, dati nascosti subito durante logout. Vedi COLLAUDO-SCHEDE-CLIENTI.md. Restano online Profili cliente, Email marketing e Risultati dei clienti; FUN-054 ha un ordine scritto senza attivazioni.
- Matrice92: **72 implementate localmente, 14 parziali, 6 da fare**. Rilascio del codice e collaudo funzionale autenticato sono distinti. L’intero obiettivo resta aperto.

## Prossimo lavoro utile

1. FUN-040 completata, verificata e online. Vedi COLLAUDO-EMAIL-MARKETING.md. Nessun invio collegato. Non ripetere il collaudo già concluso.
2. FUN-054 completata: ORDINE-CONFIGURAZIONE-AGENTI.md. Sequenza scritta dal brief, nessuna attivazione e T4 ancora aperta. Nuovo percorso Profili cliente verificato e online.
3. FUN-007: destinazioni di anagrafiche, contratti, accessi e contabilità individuate nel codice; Trello e fonti reali restano aperti. Corrette e collaudate le regressioni delle schede, non ripetere quel giro. Prossimo controllo mirato: sottopagine residue PRINC-01. Le schermate principali per ruolo sono già verificate: COLLAUDO-NAVIGAZIONE-RUOLI.md.
4. Richiesta di accesso al socio già inviata il 10 ottobre: attendere la risposta senza ripetere la domanda. La scheda browser online è pronta al login. I collaudi autenticati sul server richiedono la sessione del socio e gli accessi nominali ancora da predisporre con password scelte dai titolari. Non leggere variabili/credenziali. Fonti reali, Fidelity/Growth e telefoni Wallet restano distinti; Apple esclusa.
5. T0 in corso; T1–T10 seguono il riordino, con stato in [TASK-AVANZAMENTO](TASK-AVANZAMENTO.md). Non dichiararle completate per il solo numero di test.

## Autorizzazioni e accessi

Il proprietario autorizza ora push e rilascio finale senza ulteriore supervisione. Non serve richiederli. Restano le condizioni su spese, account/collegamenti reali, dati cliente e cancellazioni. Niente main, force push o interventi sulle app originali. Apple esclusa dall’attivazione; OpenAI e Anthropic predisposti, scelta rinviata. Budget50€/mese, stop40€; consumi AI/Codex ancora ignoti. Railway: consumo rilevato0,16214USD, limite preesistente20USD.

CLI ufficiale Railway disponibile in `.cache/release-tools/railway`, già autenticata e cartella collegata. Git remoto accessibile; non cercare nuovamente gh o reinstallare strumenti. Non esiste chiave SSH: nessuna creata. Chrome Grandinetti è autenticato a Railway; il Mac era bloccato alla fine del controllo. Non leggere variabili segrete o database di produzione. Nessun dato reale nel repository, neppure nelle cache. Runtime Node24 in `/Users/raffaelelamanna/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.

## Fonti mirate

[Rilascio e limiti](RILASCIO-2026-10-10.md) · [Matrice92](copertura/riordino.json) · [Mappatura principale](MAPPATURA-FINALE-CODEX.md) · [Piano](PIANO-RIORDINO-CODEX.md) · [Collaudo risultati](COLLAUDO-RISULTATI-CLIENTI.md).

Leggere solo ciò che serve al prossimo intervento. Aggiornare questo riepilogo quando cambia codice, rilascio o impedimento. Non ripetere esplorazioni e test già risolti.
