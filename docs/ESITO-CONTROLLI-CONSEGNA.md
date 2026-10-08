# Esito dei controlli alla consegna

8 ottobre 2026 · codice del commit locale 569c70d, documentazione di consegna aggiunta in seguito.

| Comando | Esito |
|---|---|
| `node --test tests/*.test.js` | 161 test; 160 passati, 1 fallito, 0 saltati |
| `node scripts/demo-all-agents.js` | 32 procedure concluse, 32 output con approvazione, nessun prerequisito bloccante nel campione preparato |
| `node scripts/check.js` prima della copia integrale | 5 gruppi su 5 superati |
| `node scripts/check.js` dopo la copia integrale | 4 gruppi su 5; link documentali del sorgente da risolvere, come descritto sotto |

Fallimento suite: `tests/agency.test.js:31`, asserzione riga 34. Atteso `false`, ottenuto `true`: `review.created`, `content.approved` e `contract.signed` sono ora eventi DEMO implementati. Il test precedente non è ancora stato riallineato. Un secondo test alla riga 23 filtra gli agenti planned, ora assenti, e passa in modo vacuo.

Scenario isolato: mail 0, appuntamenti esterni 0, consegne Fidelity 0, costo API 0 centesimi. Lo script usa un archivio in memoria, permessi inventati marcati DEMO e fixture. Non prova il nuovo scenario aziendale a 13 passaggi né AI/provider collegati.

Il controllo finale segnala 22 link relativi mancanti nel brief sorgente: indice/catalogo/guida e schede S01–S19 non estratti nei percorsi citati. Il brief viene conservato integralmente; non è stato corretto per far passare un controllo. Le quattro verifiche verdi sono sintassi (45 file JavaScript), registro/SOP (27 servizi, 8 reparti, 32 agenti), dipendenze fissate e isolamento offline del prototipo.

La nuova regia non ha ancora un collaudo browser completo. Vedere [consegna](PASSAGGIO-CONSEGNE.md) e [collaudo sciame UI](COLLAUDO-SCIAME-UI.md). Nessun deploy o modifica alle applicazioni originali.
