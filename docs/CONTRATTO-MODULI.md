# Contratto tecnico iniziale — 8 ottobre 2026

Scelta: un solo processo Node 24.19.0, un solo database SQLite, una sola sessione e interfaccia. Nessun servizio esterno viene chiamato nel prototipo. I moduli originali sono letti da GitHub, adattati e verificati nella nuova applicazione; gli originali rimangono intatti.

## Store comune (src/store.js)

- `store.db`: connessione `DatabaseSync` già aperta; non aprire altri database.
- `store.query(sql,...params)`, `store.one(sql,...params)`, `store.run(sql,...params)`.
- `store.transaction(fn)`: sincrona, supporta transazioni annidate con SAVEPOINT.
- `store.audit(user, clientId, action, entityId, detail={}, visibility='internal')`: registro comune; visibility `admin` per economia e `client` solo per eventi espressamente visibili al cliente. Niente segreti nei detail.
- Tabelle comuni: `os_clients(id,name,slug,industry,color,address,active,created_at,privacy_url,terms_text,services_json,risk,stage)`; `os_users(id,tenant_id,name,email,password_hash,role,active,created_at)`; `os_assignments(user_id,client_id)`.
- Ruoli: `owner` = socio BigAnt; `collaborator` = collaboratore con clienti assegnati; `client` = titolare di una sola attività. Il ruolo legacy Fidelity owner NON equivale a owner OS.
- `os_clients` sostituisce la tabella tenants Fidelity. L'agenzia cliente zero è `demo-bigant`; altri fixture `demo-bottega`, `demo-studio`. Ogni nome fixture contiene DEMO.
- Le anagrafiche dei consumatori Fidelity restano distinte dai clienti dell'agenzia e dai lead Growth. Le chiavi dei consumatori puntano allo stesso `os_clients.id`.

## Moduli

`createGrowthModule({store,origin})` / `createFidelityModule({store,origin})` in `src/growth.js` e `src/fidelity.js`. Possono usare altri file piatti `src/growth-*.js` / `src/fidelity-*.js`.

Ogni factory inizializza solo le proprie tabelle con prefisso `gr_` o `fi_`, sulla connessione ricevuta. Nessuna lettura ENV/segreti, nessun timer all'import, nessun fetch, processi o provider reali.

Restituisce:

```js
{
  state(clientId, user), // oggetto sincrono serializzabile
  seed(), // fixture idempotenti .example e nomi DEMO, mai utenti/password
  async handle({method, path, body, user, clientId}),
  // path relativo alla rotta /api/growth oppure /api/fidelity;
  // ritorno {data, status?:200, contentType?:'application/json'} oppure null (404)
}
```

`handle` deve verificare i permessi anche se il router ha già controllato il client. Growth riservato ai soci per questa notte; Fidelity owner OS e client della propria attività, collaborator solo sulle attività assegnate (controllo router). L'identità arriva SEMPRE dalla sessione, mai dal body.

Date ISO, euro in centesimi interi. Errori con `.status` HTTP e messaggio italiano. Import/cancellazioni solo record demo, preferire archiviazione. Integrazioni reali restituiscono 409 `Servizio non collegato: operazione esterna disabilitata nella demo` prima di qualunque effetto. Simulazioni dichiarate e costo0.

## Fonti e copertura

Ogni funzione legacy deve comparire nell'inventario con posizione OS, test e limite. Conservare quanto possibile della logica di dominio originaria. Connettori e certificati reali restano scollegati; non dichiarare verificato ciò che richiede account/certificati. Le attività simulate non devono comparire come email realmente inviate o wallet realmente rilasciati.

Documentare le API effettive in `docs/API-GROWTH.md` / `docs/API-FIDELITY.md`, così la dashboard unica può esporle. Test `node:test`, file `tests/growth.test.js` / `tests/fidelity.test.js`, con DatabaseSync memoria e utenti demo creati dal test.
