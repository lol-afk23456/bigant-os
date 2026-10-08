@AGENTS.md

# Note per le sessioni Claude Code

## Prima di toccare qualcosa
- Rileggi `docs/BRIEF-BIGANT.md` (fonte di verità), la matrice `docs/VERIFICA-COPERTURA-BRIEF.md` e `docs/PROMPT-CLAUDE-CLOUD.md` (incarico in corso), anche dopo ogni compressione della conversazione.
- Lavora solo sul ramo `bigant-os-notte-1`. La PR #1 non va unita: la unisce il proprietario. Niente force push, niente merge, niente deploy.
- Decisioni in `docs/DECISIONI.md` (data, decisione, motivo); diario in `docs/DIARIO-LAVORO.md`; commit piccoli in italiano che citano i requisiti R-xxx.

## Ambiente
- Il progetto richiede Node `>=24.19.0 <25` (`node:sqlite`). Nel container cloud c'è Node 22: scarica il binario ufficiale 24.19.0 da nodejs.org in `.cache/` (escluso da Git), verifica il checksum con `SHASUMS256.txt` e anteponi la sua cartella `bin` al `PATH`.
- Dipendenze: `npm ci --ignore-scripts`.
- Controlli: `npm test`, `npm run check`, `npm run demo:agents`.

## Tre stati, sempre distinti
- **OPERATIVO**: funziona davvero, con test e prova.
- **DEMO**: procedura reale su dati finti.
- **COLLEGAMENTO MANCANTE**: servono accessi o API esterne (elenco in `docs/DA-FARE-RAFFAELE.md`).
Un segnaposto o una risposta preconfezionata non è una funzione completata. Quello che manca è `[DA VERIFICARE]`.

## Regole che non cambiano
- Solo dati DEMO, nessun invio, pubblicazione, pagamento o modifica di account esterni: il codice li blocca.
- Nessun segreto nel repository, nei log o nei documenti. Nessun identificativo di modello AI nei file del repository.
- Non toccare i repository originali (BigAnt, bigant-growth, Fidelity), Railway o il PED.
