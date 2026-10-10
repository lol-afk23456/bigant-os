import { AppError, requireOwner } from './store.js';
import { agentDefinitions } from './registry.js';
import { foundations } from './agency/foundations.js';

const HOUR = 60 * 60 * 1000;
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;

// Describe this installation using read-only metadata. Never probe a provider here.
export function createPlatformProgress({ store, realMode, connections, agentConfig, growth, fidelity, businessProfile, metaProfiles, backup = () => ({ enabled: false }), clock = () => new Date() }) {
  return function progress(user) {
    const actor = user?.id && store.one('SELECT id,role,active,must_change_password FROM os_users WHERE id=?', user.id);
    if (!actor || actor.must_change_password) throw new AppError('Accesso non più disponibile. Accedi e completa il cambio password.', 403);
    requireOwner(actor);
    const readAt = clock().toISOString(), now = Date.parse(readAt), basic = realMode ? 'Funziona' : 'Prova';
    const vault = connections.state(actor), google = vault.items.find(item => item.id === 'google')?.authorization;
    const agents = agentDefinitions.map(item => agentConfig.entry(item.id));
    const active = agents.filter(item => item.operationalStatus === 'Attivo').length;
    const g = growth.progress(actor), f = fidelity.progress(actor), b = backup();
    const items = [];
    const add = (id, name, status, summary, available, missing, route, source = 'Funzioni interne di questa versione', evidenceAt = null, evidenceLabel = null) => {
      items.push({ id, name, status, summary, available, missing, route, source, evidenceAt: validDate(evidenceAt), evidenceLabel });
    };
    add('access', 'Accesso e persone', basic, 'Accessi distinti e permessi per ruolo.', ['Accesso con password, cambio obbligatorio delle password provvisorie e registro delle attività.'], realMode ? [] : ['Stai usando identità e dati di prova.'], 'users:people', 'Sessione corrente e identità riletta dall’archivio');
    add('clients', 'Schede clienti', basic, 'Anagrafica, contratto e informazioni per il team.', ['Contratti PDF, scadenze, informazioni versionate e avvio manuale del cliente.'], ['Checklist completa di avvio e risultati dei canali ancora da completare.'], 'clients');
    add('services', 'Piano servizi e listino', basic, 'Offerta dell’agenzia e prezzi in un solo posto.', ['Piano di attivazione, date obiettivo, agenti associati e voci di listino salvabili.'], ['Lo stato del piano non attiva automaticamente un servizio o un agente.'], 'catalog:plan');
    add('approvals', 'Revisione dei contenuti', basic, 'Una persona decide sulla versione esatta.', ['Coda comune, feedback, versioni e controllo prima della pianificazione interna.'], ['Pubblicazione sui canali esterni ancora disabilitata.'], 'agents:approvals');
    add('vault', 'Custodia cifrata', vault.vaultReady ? basic : 'Da collegare', vault.vaultReady ? 'La cifratura è disponibile in questa installazione.' : 'La chiave di cifratura del server manca o non è valida.', ['Interfaccia e archivio protetto predisposti; i segreti non vengono mostrati in questa pagina.'], [...(!vault.vaultReady ? ['Configurare la chiave protetta prima di salvare credenziali.'] : []), 'Rotazione completa della chiave principale da completare. Il salvataggio non verifica i fornitori.'], 'connections', 'Disponibilità locale della cifratura; nessuna verifica esterna');
    add('agents', 'Sciame di agenti', active && realMode ? 'Funziona' : 'Prova', `${active} agenti attivi su ${agents.length}.`, ['Configurazione, procedure di prova, elaborati, priorità, budget e controlli umani.'], [active ? 'L’attivazione riguarda solo gli agenti indicati come Attivi nelle loro schede.' : 'Percorsi con dati reali, collaudo e autorizzazione da completare prima dell’attivazione.'], 'agents:list', 'Stati effettivi della configurazione degli agenti');
    const age = now - Date.parse(b.lastSuccess || '');
    const fresh = b.enabled && !b.error && Number.isFinite(age) && age >= 0 && age <= 26 * HOUR;
    add('backup', 'Copia di sicurezza', fresh ? basic : b.enabled ? 'Prova' : 'Da collegare', !b.enabled ? 'Copia automatica non attiva in questa installazione.' : b.error ? 'L’ultima copia automatica non è riuscita.' : !fresh ? 'Non risulta una copia riuscita nelle ultime 26 ore.' : 'Ultima copia automatica riuscita entro 26 ore.', b.enabled ? ['Copia giornaliera e conservazione delle ultime 14 copie.'] : [], ['Una copia sullo stesso volume non protegge dalla perdita del volume.','Il ripristino e una destinazione indipendente richiedono una verifica separata.'], null, 'Registro locale delle copie automatiche', b.lastSuccess, 'Ultima copia riuscita');
    add('google-auth', 'Autorizzazione Gmail', realMode && vault.vaultReady && google?.connected ? 'Funziona' : 'Da collegare', google?.connected ? vault.vaultReady ? 'Autorizzazione corrente della casella registrata.' : 'Autorizzazione registrata, ma la custodia cifrata non è disponibile.' : 'Casella da autorizzare in questa installazione.', ['Autorizzazione Google con consenso e verifica della casella predisposta.'], ['Calendar richiede un consenso aggiuntivo e i propri controlli. Analytics, Search Console e social restano separati; gli invii richiedono i controlli Growth.'], 'connections', 'Autorizzazione Google corrente, versione e socio autorizzante', google?.lastCheck, 'Ultima verifica della casella');
    for (const [id, name, detail] of [
      ['research','Ricerca Growth','Ricerca delle aziende e lettura dei siti.'],
      ['analysis','Analisi Growth','Analisi AI delle fonti raccolte.'],
      ['drafts','Bozze Growth','Preparazione delle bozze per la decisione dei soci.'],
      ['gmail','Gmail in Growth','Invio manuale e lettura delle conversazioni verificate.']
    ]) {
      const phase = g[id], enabled = realMode && !g.simulation && !g.paused && phase?.enabled;
      add('growth-' + id, name, enabled ? 'Funziona' : g.simulation || phase?.checked ? 'Prova' : 'Da collegare', detail,
        [g.simulation ? 'Percorso disponibile con dati e fornitori di prova.' : enabled ? 'Fase collaudata e autorizzata nella configurazione corrente.' : 'Percorso predisposto; controlli e attivazione nella pagina Growth.'],
        [...(g.paused ? ['Growth è in pausa.'] : []), ...(enabled ? [] : ['Completare collegamento, collaudo corrente e autorizzazione.']), ...(id === 'gmail' ? ['Ogni invio resta manuale, soggetto ad approvazione, consenso e limite giornaliero.'] : [])],
        'growth:connections', 'Controlli Growth: configurazione corrente, prerequisiti, pausa e autorizzazioni', phase?.lastCheck, 'Ultimo collaudo registrato');
    }
    const calendar = g.calendar, calendarActive = realMode && !g.simulation && !g.paused && calendar?.enabled;
    add('calendar', 'Calendario Growth', calendarActive ? 'Funziona' : calendar?.checked ? 'Prova' : 'Da collegare', calendarActive ? 'Prenotazioni attive nella configurazione autorizzata.' : 'Gli inviti al calendario non sono attivi.', ['Disponibilità, inviti approvati singolarmente e verifica degli esiti predisposti.'], [...(g.paused ? ['Growth è in pausa.'] : []), ...(calendarActive ? [] : ['Completare consenso Calendar, prova ricevuta e attivazione del socio.']), 'Le notifiche di creazione e annullamento richiedono conferma. Modifiche fatte direttamente in Google possono cambiare la disponibilità.'], 'growth:connections', 'Configurazione Calendar corrente, prova verificata, pausa e autorizzazioni', calendar?.lastCheck, 'Ultimo controllo della disponibilità');
    add('fidelity', 'Fidelity', 'Prova', 'Programmi, tessere, accrediti e premi integrati.', ['Archivio comune, consenso, scanner, operazioni sulle tessere e coda delle campagne.'], ['Collaudo completo su telefono e sui flussi reali ancora da completare.','Gli invii delle campagne restano disabilitati.'], 'fidelity');
    const wallet = f.googleWallet;
    add('google-wallet', 'Google Wallet', realMode && wallet?.enabledCount > 0 ? 'Funziona' : wallet?.checkedCount > 0 ? 'Prova' : 'Da collegare', `${wallet?.enabledCount || 0} attività abilitate; ${wallet?.checkedCount || 0} con collaudo corrente.`, ['Firma, emissione, aggiornamento e revoca delle tessere predisposti.'], ['L’attivazione vale per le sole attività collaudate e autorizzate; controlla la scheda Fidelity dell’attività.'], 'fidelity:settings', 'Configurazione Wallet corrente e attività attive con servizio Fidelity', wallet?.lastCheck, 'Ultimo collaudo registrato');
    const gbp = businessProfile?.progress(actor), meta = metaProfiles?.progress(actor);
    add('profiles', 'Profili e risultati dei canali', gbp?.checkedCount > 0 || gbp?.enabledCount > 0 || meta?.checkedCount > 0 || meta?.enabledCount > 0 ? 'Prova' : 'Da collegare', `${gbp?.enabledCount || 0} attività abilitate per Google Business Profile; ${gbp?.cachedCount || 0} con dati temporanei disponibili. Meta: ${meta?.enabledCount || 0} attività abilitate, ${meta?.cachedCount || 0} con dati temporanei.`, ['Indirizzi pubblici e fonti registrabili dai soci, con versioni e separazione fra attività.', 'Lettura GBP di scheda, recensioni e valori giornalieri predisposta con fonte e data.', 'Lettura di pagine Facebook e profili Instagram professionali predisposta, con scelta separata dei canali e isolamento per attività.'], ['Meta richiede token utente autorizzato, scelta della pagina, prova e attivazione per attività. OAuth completo e collaudo reale restano da completare. Gli altri canali non hanno una sincronizzazione dei risultati.', 'GBP richiede consenso separato, scheda scelta, prova e autorizzazione per attività. Aggiornamento giornaliero facoltativo; dati conservati in memoria fino a 24 ore.'], 'profiles', 'Configurazioni GBP e Meta correnti; nessuna chiamata ai fornitori alla consultazione', [gbp?.lastSync,meta?.lastSync].filter(Boolean).sort().at(-1), 'Ultima lettura dei canali riuscita');
    add('billing', 'Fatturazione interna', 'Prova', 'Riepiloghi e controllo degli incassi.', ['Tracker, prima nota, costi e compensi disponibili per i soci.'], ['Trello resta il registro ufficiale; BigAnt OS non emette fatture.'], 'administration');
    return { readAt, environment: realMode ? 'Installazione reale' : 'Ambiente di prova DEMO', notice: 'Funziona indica la capacità descritta in questa installazione. Prova include dati dimostrativi e parti incomplete. Da collegare indica un collegamento mancante. Questa lettura non esegue collaudi e non misura il completamento del progetto.', items,
      foundations: foundations.map(item => ({ id: item.id, name: item.name, status: 'Prova', summary: 'Area da completare: le parti disponibili non costituiscono ancora il flusso completo.', available: [...item.available], missing: [item.missing, ...(item.id === 'credentials' && !vault.vaultReady ? ['Chiave di cifratura del server da configurare in questa installazione.'] : [])], source: 'Registro delle capacità e delle mancanze di questa versione', evidenceAt: null, evidenceLabel: null, route: item.route })) };
  };
}
