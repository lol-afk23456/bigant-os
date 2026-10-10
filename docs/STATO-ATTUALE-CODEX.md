# BigAnt OS — ripresa rapida

Aggiornato il 10 ottobre 2026. Questo file riassume lo stato; non sostituisce le decisioni del proprietario o la mappatura principale.

- Repository: `~/Documents/BigAnt-OS-Codex`, ramo `bigant-os-notte-1`.
- **Codice online:** `aef13b3`, Railway BigAnt OS / bigant-os-server / production; deployment `2032ce9d-ce21-475a-b747-4eb3c349e0d8` SUCCESS. Documentazione successiva sullo stesso ramo.
- Backup Railway prima del rilascio: 10 ottobre, 17:09, 799 MB referenziati, confermato dall’API ufficiale. Copia giornaliera applicativa inclusa; prima esecuzione da verificare. Nessuna pianificazione aggiuntiva Railway impostata.
- Ultime prove del codice: **772/772**, zero saltate, controllo progetto **5/5**. Tre nuove prove di navigazione e dieci regressioni scheda/sessione ancora verdi. Browser: nota singola salvata, impostazioni Fidelity e anagrafiche/incassi, 390 px senza overflow nelle pagine misurate, zero errori console. Health online OK, workspace.js identico e tre API anonime 401. Non ripetere queste prove se il codice non cambia.
- Ultimo sviluppo: note cliente, Regolamento/Wallet e anagrafiche/incassi separati in sottopagine, con indice e ritorno. Vedi COLLAUDO-NAVIGAZIONE-RUOLI.md. Restano online i precedenti interventi su sicurezza schede, Profili cliente, Email marketing e Risultati; FUN-054 ha un ordine scritto senza attivazioni.
- Matrice92: **73 implementate localmente, 13 parziali, 6 da fare**. Rilascio del codice e collaudo funzionale autenticato sono distinti. L’intero obiettivo resta aperto.

## Prossimo lavoro utile

1. FUN-040 completata, verificata e online. Vedi COLLAUDO-EMAIL-MARKETING.md. Nessun invio collegato. Non ripetere il collaudo già concluso.
2. FUN-054 completata: ORDINE-CONFIGURAZIONE-AGENTI.md. Sequenza scritta dal brief, nessuna attivazione e T4 ancora aperta. Nuovo percorso Profili cliente verificato e online.
3. Audit residui concluso: AUDIT-RESIDUI-RIORDINO.md. FUN-007 soddisfa il criterio locale delle destinazioni; FUN-053/055/062 restano parziali perché non provano percorsi automatici/esterni funzionanti. Non ripetere audit o collaudi equivalenti. Le modifiche sono online; proseguire dal collaudo autenticato e dai prerequisiti del primo fornitore, mantenendo Fidelity prima di Growth.
4. **Login automatico del socio riuscito** dopo nuova autorizzazione esplicita. Il browser online è su «Scegli la tua password»: account con password provvisoria, cambio obbligatorio. Richiesta al titolare già inviata per completare direttamente nel browser «Salva ed entra»; nessuna password nuova in chat. Non ripetere login, cercare altre password o aggirare il cambio. La sessione è conservata nel browser; verificare la schermata dopo la conferma. Il cambio credenziali richiede handoff per le regole del controllo browser.
5. T0 in corso; T1–T10 seguono il riordino, con stato in [TASK-AVANZAMENTO](TASK-AVANZAMENTO.md). Non dichiararle completate per il solo numero di test.

## Autorizzazioni e accessi

Il proprietario autorizza ora push e rilascio finale senza ulteriore supervisione. Non serve richiederli. Restano le condizioni su spese, account/collegamenti reali, dati cliente e cancellazioni. Niente main, force push o interventi sulle app originali. Apple esclusa dall’attivazione; OpenAI e Anthropic predisposti, scelta rinviata. Budget50€/mese, stop40€; consumi AI/Codex ancora ignoti. Railway: consumo rilevato0,16214USD, limite preesistente20USD.

CLI ufficiale Railway disponibile in `.cache/release-tools/railway`, già autenticata e cartella collegata. Git remoto accessibile; non cercare nuovamente gh o reinstallare strumenti. Non esiste chiave SSH: nessuna creata. Chrome Grandinetti è autenticato a Railway; il Mac era bloccato alla fine del controllo. Non leggere variabili segrete o database di produzione. Nessun dato reale nel repository, neppure nelle cache. Runtime Node24 in `/Users/raffaelelamanna/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.

## Fonti mirate

[Rilascio e limiti](RILASCIO-2026-10-10.md) · [Matrice92](copertura/riordino.json) · [Mappatura principale](MAPPATURA-FINALE-CODEX.md) · [Piano](PIANO-RIORDINO-CODEX.md) · [Collaudo risultati](COLLAUDO-RISULTATI-CLIENTI.md).

Leggere solo ciò che serve al prossimo intervento. Aggiornare questo riepilogo quando cambia codice, rilascio o impedimento. Non ripetere esplorazioni e test già risolti.

## Ultime direttive del proprietario

Accelerare e finire entro la quota residua: il controllo Codex del 10 ottobre indica 40% consumato, 60% disponibile nella finestra settimanale, nessun credito aggiuntivo. Questa percentuale non misura il lavoro restante e non è il budget operativo dell’app. Usare blocchi di lavoro più grandi, letture mirate, test pertinenti e una sola verifica finale per blocco; niente nuovi audit o pubblicazioni per sole modifiche documentali.

Il proprietario autorizza esplicitamente gli accessi automatici e il recupero mirato delle sole credenziali necessarie a BigAnt OS da GitHub/Railway. Questa istruzione successiva supera la precedente richiesta che il socio esegua personalmente il normale login. Il login è già riuscito con le credenziali fornite in precedenza: non è servita alcuna lettura di segreti GitHub/Railway. Non copiarle in documenti o log. Restano distinti cambio password obbligatorio (titolare), costi, consensi ai fornitori, nuovi permessi e operazioni irreversibili. «Riprendi obiettivo» deve continuare con queste nuove direttive, senza ricominciare l’audit.
