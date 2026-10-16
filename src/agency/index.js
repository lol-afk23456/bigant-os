import {AppError,requireOwner,requireClient} from '../store.js';
import {integrations} from '../registry.js';
import {serviceBlueprints} from './services.js';
import {managementBlueprints} from './management.js';
import {agentContracts,departmentContracts,orchestratorContract,triggerDefinitions} from './swarm.js';
import {marketingChannels,marketingAreas,marketingContract} from './marketing.js';
import {clientSections,internalSections} from './dashboards.js';
import {foundations} from './foundations.js';

export const agencyRegistry={services:serviceBlueprints,management:managementBlueprints,agents:agentContracts,departments:departmentContracts,orchestrator:orchestratorContract,triggers:triggerDefinitions,dashboard:{internal:internalSections,client:clientSections},foundations};

export function validateAgencyRegistry(registry=agencyRegistry){
 const fail=message=>{throw new Error('Registro agenzia: '+message);};
 for(const key of ['services','management','agents','departments','foundations']){
  const list=registry[key];if(!Array.isArray(list)||!list.length||list.some(x=>!x.id||!x.name)||new Set(list.map(x=>x.id)).size!==list.length)fail('identificativi mancanti o duplicati in '+key);
 }
 if(registry.management.length!==10||registry.management.some((m,i)=>m.number!==i+1||!m.ownerOnly||!m.sections.length||!m.data.plannedFields.length))fail('devono esserci i dieci moduli del brief con contratto e permessi');
 const agents=new Map(registry.agents.map(a=>[a.id,a])),departments=new Map(registry.departments.map(d=>[d.id,d]));
 const catalogue=registry.services.map(s=>s.catalogue).filter(Boolean).sort((a,b)=>a-b);
 if(JSON.stringify(catalogue)!==JSON.stringify(Array.from({length:19},(_,i)=>i+1)))fail('catalogo 1–19 incompleto');
 for(const s of registry.services){
  if(!departments.has(s.department)||!s.sections?.length||!s.inputs||!s.outputs||!s.gate||!s.acceptance?.length||!s.activation)fail('contratto incompleto per '+s.id);
  if(!s.excluded&&!s.agents.length)fail('specialista mancante per '+s.id);
  for(const id of s.agents)if(!agents.has(id))fail('specialista sconosciuto '+id);
  for(const id of s.integrations)if(!integrations.some(i=>i.id===id))fail('connettore sconosciuto '+id);
 }
 for(const a of registry.agents){
  if(!departments.has(a.department)||!departments.get(a.department).agents.includes(a.id)||!a.triggers?.length||!a.memory||!a.gate||!a.budget||!a.activity||!a.failure||!a.acceptance?.length)fail('contratto incompleto per agente '+a.id);
  if(a.permissions.externalActions!==false||(a.department!=='administration'&&a.permissions.administration!==false))fail('permessi eccessivi per '+a.id);
 }
 for(const d of registry.departments)for(const id of d.agents)if(agents.get(id)?.department!==d.id)fail('specialista nel reparto errato '+id);
 for(const side of ['client','internal']){
  const list=registry.dashboard[side];if(new Set(list.map(s=>s.id)).size!==list.length)fail('sezioni dashboard duplicate');
  for(const section of list)for(const id of section.services||[])if(!registry.services.some(s=>s.id===id))fail('servizio sconosciuto in dashboard '+id);
 }
 return true;
}
validateAgencyRegistry();

export function createAgencyModule({store:s}){
 function client(user,clientId){requireClient(s,user,clientId);return s.one('SELECT id,name,services_json FROM os_clients WHERE id=? AND active=1',clientId);}
 function purchased(c){return JSON.parse(c.services_json);}
 function publicService(service){return {id:service.id,name:service.name,status:service.status,sections:service.sections,deliverables:service.deliverables,missing:service.missing,available:service.available,agentNames:service.agents.map(id=>agentContracts.find(a=>a.id===id).name)};}
 function state(user){requireOwner(user);return {demo:true,scope:'agency',...agencyRegistry};}
 function dashboard(user,clientId){
  const c=client(user,clientId),active=purchased(c);
  const services=serviceBlueprints.filter(v=>!v.excluded&&active.includes(v.id)).map(v=>({id:v.id,name:v.name,status:v.status}));
  if(user.role==='client')return {demo:true,clientId:c.id,clientName:c.name,sections:[],services:services.filter(service=>service.id!=='growth')};
  return {demo:true,clientId:c.id,clientName:c.name,sections:clientSections.filter(v=>!v.services.length||v.services.some(id=>active.includes(id))),services};
 }
 function workspace(user,clientId,id){
  const c=client(user,clientId),service=serviceBlueprints.find(v=>v.id===id);
  if(!service)throw new AppError('Spazio del servizio non trovato.',404);
  const active=purchased(c).includes(id);
  if(user.role!=='owner'&&(!active||service.excluded||(user.role==='client'&&id==='growth')))throw new AppError('Questo servizio non è disponibile per la tua attività.',403);
  // Compatibilità con i vecchi indirizzi: i clienti ricevono il nome del
  // servizio, mentre lavorazioni, bozze e decisioni restano al team.
  if(user.role==='client')return {demo:true,clientId:c.id,clientName:c.name,active,service:{id:service.id,name:service.name,status:service.status},sections:[],tasks:[],contents:[],approvals:[],integrations:[]};
  const tasks=s.query('SELECT * FROM os_tasks WHERE client_id=? AND service=? ORDER BY due',c.id,id);
  const contents=s.query('SELECT * FROM os_contents WHERE client_id=? AND service=? ORDER BY updated_at DESC',c.id,id);
  const ids=new Set(contents.map(v=>v.id));
  const approvals=s.query('SELECT * FROM os_approvals WHERE client_id=? ORDER BY created_at DESC',c.id).filter(a=>(a.kind==='content'&&ids.has(a.entity_id))||(id==='fidelity'&&a.kind==='fidelity_campaign'));
  return {demo:true,clientId:c.id,clientName:c.name,active,service:user.role==='owner'?{...service,agentNames:service.agents.map(id=>agentContracts.find(a=>a.id===id).name)}:publicService(service),sections:service.sections,tasks,contents,approvals,
   integrations:integrations.filter(v=>service.integrations.includes(v.id)).map(({id,name,status,lastSync})=>({id,name,status,lastSync}))};
 }
 function marketing(user){
  requireOwner(user);const c=client(user,marketingContract.clientId);
  const memory=s.query("SELECT kind,content,version,source,updated_at FROM os_memory WHERE client_id=? AND visibility!='admin'",c.id);
  return {demo:true,...marketingContract,clientName:c.name,channels:marketingChannels,areas:marketingAreas,memory,
   tasks:s.query('SELECT * FROM os_tasks WHERE client_id=? ORDER BY due',c.id),contents:s.query('SELECT * FROM os_contents WHERE client_id=? ORDER BY updated_at DESC',c.id),
   objectives:[],objectivesStatus:'Solo struttura; nessun obiettivo registrato',source:'Archivio comune DEMO, non dati reali dei canali'};
 }
 async function handle({method,path,user,clientId}){
  if(method!=='GET')throw new AppError('Questa sezione descrive la struttura: non attiva servizi o automatismi.',405);
  if(path==='/state')return {data:state(user)};
  if(path==='/marketing')return {data:marketing(user)};
  if(path==='/dashboard')return {data:dashboard(user,clientId)};
  const m=path.match(/^\/services\/([a-z][a-z0-9-]*)$/);if(m)return {data:workspace(user,clientId,m[1])};
  return null;
 }
 return {handle,state,dashboard,workspace,marketing};
}
