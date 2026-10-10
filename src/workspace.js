import { agentDefinitions } from './registry.js';
import { agentiSciame } from './sciame/agenti.js';
import { canAccessClient, AppError } from './store.js';
import { directorPriorities } from './swarm-priorities.js';
import { createProfileDirectory } from './profile-directory.js';
import { latestQualityReview } from './agent-quality.js';

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
  // Customer navigation exposes only their own purchased services and public profiles.
  return { landing: 'client', items: [
    ['client', 'La tua attività', 'grid', 'Il tuo spazio'], ['catalog', 'I tuoi servizi', 'book', 'Il tuo spazio'],
    ['profiles', 'I tuoi profili', 'globe', 'Il tuo spazio'],
    ...(activeServices.includes('fidelity') ? [['fidelity', 'Fidelity', 'card', 'Prodotti']] : [])
  ] };
}

export function createWorkspace({ store, clock = () => new Date(), budget, expiring, agentConfig, connections, businessProfile }) {
  const profileDirectory = createProfileDirectory({ store, clock });
  function profiles(user, clientId) {
    const directory = profileDirectory.state(user, clientId);
    if (!businessProfile) return directory;
    try { return { ...directory, businessProfile: businessProfile.state(user, clientId) }; }
    catch (error) {
      // Public links remain readable when the client's local service is absent.
      if (error.status === 403 && user.role === 'client') return { ...directory, businessProfile: null };
      throw error;
    }
  }
  function assignedClients(user) {
    return store.query('SELECT * FROM os_clients WHERE active=1 ORDER BY name').filter(client => canAccessClient(store, user, client.id));
  }
  function approvals(user) {
    if (user.role === 'client') throw new AppError('Le approvazioni sono riservate al team BigAnt.', 403);
    const ids = new Set(assignedClients(user).map(client => client.id));
    return store.query("SELECT a.*,c.service,c.source,o.agent origin_agent,o.quality origin_quality,p.agente ai_agent,p.esito_qualita ai_quality,ao.agent procedure_agent,u.name requested_name FROM os_approvals a LEFT JOIN os_contents c ON a.kind='content' AND c.id=a.entity_id LEFT JOIN os_approval_origins o ON o.approval_id=a.id LEFT JOIN os_sciame_passi p ON a.kind='sciame_output' AND p.id=a.entity_id AND p.approvazione_id=a.id LEFT JOIN os_agent_outputs ao ON a.kind='agent_output' AND ao.id=a.entity_id AND ao.version=a.version LEFT JOIN os_users u ON u.id=a.requested_by WHERE a.status='pending' ORDER BY a.created_at")
      .filter(item => ids.has(item.client_id) && (user.role === 'owner' || (item.kind === 'content' && item.service === 'social')))
      .map(item => {
        const review=item.kind==='content'&&item.service==='social'?latestQualityReview(store,item.client_id,item.entity_id):null;
        return { ...item, qualityReview:review, author: item.origin_agent || agentiSciame[item.ai_agent]?.nome || agentDefinitions.find(row => row.id === item.procedure_agent)?.name || item.requested_name || 'Autore da verificare', quality: review?(review.current?'Parere AI: '+({approvabile:'approvabile, decisione umana necessaria',da_correggere:'da correggere',bloccato:'bloccato'})[review.verdict]:'Parere AI superato'):item.origin_quality || item.ai_quality || 'Da verificare' };
      });
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
      growth: { connected: false, newLeads: null }, connections: connections.summary() };
  }
  function saveProfile(user, clientId, channel, body) {
    profileDirectory.save(user, clientId, channel, body);
    return profiles(user, clientId);
  }
  return { home, profiles, publicProfiles: profileDirectory.state, saveProfile, approvals, priorities: user => directorPriorities(store, user) };
}
