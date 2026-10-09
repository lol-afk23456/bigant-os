import { canAccessClient, requireOwner, AppError } from './store.js';
import { integrations } from './registry.js';

export const ownerNavigation = [
  ['home', 'Home', 'grid', 'Lavoro'], ['clients', 'Clienti', 'users', 'Lavoro'],
  ['catalog', 'Servizi', 'book', 'Lavoro'], ['profiles', 'Profili', 'globe', 'Lavoro'],
  ['agents', 'Sciame di agenti', 'agents', 'Lavoro'],
  ['growth', 'Growth', 'growth', 'Prodotti'], ['fidelity', 'Fidelity', 'card', 'Prodotti'],
  ['client', 'Vista cliente', 'eye', 'Sistema'], ['users', 'Accessi', 'shield', 'Sistema'],
  ['connections', 'Collegamenti', 'link', 'Sistema'], ['progress', 'Avanzamento', 'chart', 'Sistema'],
  ['administration', 'Fatturazione', 'wallet', 'Fatturazione']
];

export function navigationFor(user, activeServices = []) {
  if (user.role === 'owner') return { landing: 'home', items: ownerNavigation };
  if (user.role === 'collaborator') return { landing: 'home', items: [
    ['home', 'Home', 'grid', 'Lavoro'], ['clients', 'Clienti assegnati', 'users', 'Lavoro'], ['agents', 'Da approvare', 'approval', 'Lavoro']
  ] };
  // The definitive client navigation follows the dedicated client review.
  return { landing: 'client', items: [
    ['client', 'La tua attività', 'grid', 'Il tuo spazio'], ['catalog', 'I tuoi servizi', 'book', 'Il tuo spazio'],
    ...(activeServices.includes('fidelity') ? [['fidelity', 'Fidelity', 'card', 'Prodotti']] : [])
  ] };
}

export function createWorkspace({ store, clock = () => new Date(), budget, expiring, agentConfig }) {
  function assignedClients(user) {
    return store.query('SELECT * FROM os_clients WHERE active=1 ORDER BY name').filter(client => canAccessClient(store, user, client.id));
  }
  function approvals(user) {
    if (user.role === 'client') throw new AppError('Le approvazioni sono riservate al team BigAnt.', 403);
    const ids = new Set(assignedClients(user).map(client => client.id));
    return store.query("SELECT a.*,c.service FROM os_approvals a LEFT JOIN os_contents c ON a.kind='content' AND c.id=a.entity_id WHERE a.status='pending' ORDER BY a.created_at")
      .filter(item => ids.has(item.client_id) && (user.role === 'owner' || (item.kind === 'content' && item.service === 'social')));
  }
  function home(user) {
    if (user.role === 'client') throw new AppError('La tua home è nella tua area clienti.', 403);
    const clients = assignedClients(user);
    const pending = approvals(user).map(({ id, client_id, kind, title, version, created_at, service }) => ({ id, client_id, kind, title, version, created_at, service }));
    const base = { clients: clients.map(({ id, name, industry, services_json }) => ({ id, name, industry, services: JSON.parse(services_json) })), approvals: pending };
    if (user.role !== 'owner') return base;
    const today = clock().toISOString().slice(0, 10);
    const expiringContracts = expiring(user);
    const month = today.slice(0, 7), customers = clients.filter(client => client.id !== 'demo-bigant');
    const spending = budget();
    return { ...base, expiringContracts, customers: { active: customers.length, newThisMonth: customers.filter(client => client.created_at.startsWith(month)).length },
      swarm: { active: agentConfig.state(user).items.filter(agent=>agent.operationalStatus==='Attivo').length, blocked: store.one("SELECT count(*) n FROM os_jobs WHERE status='failed'").n,
        qualityBlocked: store.one("SELECT count(*) n FROM os_sciame_passi WHERE stato='bloccato_qualita'").n,
        usedCents: spending.usedCents, capCents: spending.capCents },
      growth: { connected: false, newLeads: null }, connections: { errors: 0, connected: 0, total: integrations.length } };
  }
  function profiles(user, clientId) {
    if (!canAccessClient(store, user, clientId)) throw new AppError('Attività non accessibile.', 403);
    if (user.role === 'collaborator') requireOwner(user);
    return { clientId, items: [
      ['instagram', 'Instagram'], ['facebook', 'Facebook'], ['linkedin', 'LinkedIn aziendale'], ['tiktok', 'TikTok'], ['google-business', 'Google Business Profile'], ['website', 'Sito web']
    ].map(([id, name]) => ({ id, name, status: 'Da collegare', lastSync: null, metrics: null })) };
  }
  return { home, profiles, approvals };
}
