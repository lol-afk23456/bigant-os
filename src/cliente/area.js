import {AppError,requireClient} from '../store.js';
import {services} from '../registry.js';
import {catalogoServizi} from '../servizi/catalogo.js';

// The customer and owner preview share this explicit, read-only projection.
// Internal task/content/agent work is never used to build a customer report.
export function createClientArea({store:s,records,businessProfile=null,clock=()=>new Date(),clientResults=null,emailMarketing=null,publicProfiles=null}){
 function scope(user,clientId){
  const current=user?.id?s.one('SELECT * FROM os_users WHERE id=?',user.id):null;
  if(!current?.active||current.must_change_password||!['owner','client'].includes(current.role)||current.id==='os-orchestrator')throw new AppError('Area riservata al cliente e all’anteprima dei soci.',403);
  if(user.session_id&&!s.one('SELECT 1 FROM os_sessions WHERE id=? AND user_id=? AND expires_at>?',user.session_id,current.id,clock().getTime()))throw new AppError('Sessione scaduta.',401);
  requireClient(s,current,clientId);
  const client=s.one('SELECT id,name,services_json FROM os_clients WHERE id=? AND active=1',clientId);
  if(!client)throw new AppError('Attività non disponibile.',404);
  const active=JSON.parse(client.services_json);
  const visible=services.filter(row=>active.includes(row.id)&&!['growth','marketplace','apple-leasing'].includes(row.id));
  return {user:{...current,...(user.session_id?{session_id:user.session_id}:{})},client,visible,demo:client.name.includes('DEMO')||client.id.startsWith('demo-')};
 }
 const serviceCard=row=>({id:row.id,nome:row.name});
 function dashboard(user,clientId){
  const c=scope(user,clientId),attivi=c.visible.map(serviceCard),contracts=records?.contracts(c.user,clientId)||[];
  return {demo:c.demo,clientId,clientName:c.client.name,servizi:attivi.map(row=>row.id),sezioni:[
   {id:'home',nome:'Home',servicesCount:attivi.length,contractsCount:contracts.length},
   {id:'servizi',nome:'I tuoi servizi',attivi},
   {id:'documenti',nome:'Documenti',contratti:contracts},
   ...(clientId!=='demo-bigant'&&clientResults?.published(user,clientId).reports.length?[{id:'results',nome:'I tuoi risultati'}]:[])
  ]};
 }
 function fidelitySource(user,clientId){
  const c=scope(user,clientId);
  if(!c.visible.some(row=>row.id==='fidelity'))throw new AppError('Servizio non disponibile per questa attività.',403);
  const programs=s.query(`SELECT p.name,p.active,COUNT(m.id) inscriptions,COALESCE(SUM(m.marketing_consent),0) marketing
   FROM fi_programs p LEFT JOIN fi_members m ON m.program_id=p.id AND m.tenant_id=p.tenant_id AND m.status='active'
   WHERE p.tenant_id=? GROUP BY p.id ORDER BY p.name,p.id`,clientId).map(row=>({...row,active:!!row.active}));
  return {clientId,clientName:c.client.name,source:'Archivio Fidelity della tua attività',readAt:clock().toISOString(),
   totals:programs.reduce((sum,row)=>({inscriptions:sum.inscriptions+row.inscriptions,marketing:sum.marketing+row.marketing}),{inscriptions:0,marketing:0}),programs,
   definition:'Si contano le tessere attive, incluse quelle di programmi sospesi. Una persona iscritta a due programmi conta due volte. Le iscrizioni eliminate sono escluse; il consenso marketing non prova un invio né un aggiornamento Wallet.'};
 }
 function service(user,clientId,id){
  const c=scope(user,clientId),selected=c.visible.find(row=>row.id===id);
  if(!selected)throw new AppError('Servizio non disponibile per questa attività.',403);
  const reports=catalogoServizi.filter(row=>row.registro.includes(id)&&row.codice!=='S17').map(row=>({id:row.codice,nome:row.nome,metriche:row.kpi.map(nome=>({nome,valore:null,fonte:'Fonte del servizio da collegare',aggiornato:null,url:null,stato:'Da collegare'}))}));
  if(id==='email-marketing')reports.splice(0,reports.length,{id:'email-campaigns',nome:'Risultati delle campagne',metriche:['Email inviate','Aperture','Clic'].map(nome=>({nome,valore:null,fonte:'Fornitore Email marketing da collegare',aggiornato:null,url:null,stato:'Da collegare'}))});
  // Fidelity is a separate purchased product, never a synonym for email or Growth.
  if(id==='fidelity'){
   const source=fidelitySource(user,clientId),counts=source.totals;
   reports.push({id:'fidelity',nome:'Iscritti Fidelity',metriche:[['Iscrizioni attive',counts.inscriptions],['Con consenso marketing',counts.marketing]].map(([nome,valore])=>({nome,valore,fonte:'Archivio Fidelity della tua attività',aggiornato:source.readAt,url:null,sourceAction:'fidelity',stato:c.demo?'DEMO':'Registrato',nota:'Conteggio delle tessere attive alla data di lettura, non delle persone uniche né del Wallet.'}))});
  }
  let google=null;
  if(['local','presence','multisite'].includes(id)&&businessProfile){
   const state=businessProfile.state(c.user,clientId);
   // Owners can read a technical trial in Profili; preview must only show activated data.
   if(state.enabled&&state.data){const {source,sourceUrl,fetchedAt,expiresAt,from,to,reviews,performance}=state.data;google={source,sourceUrl,fetchedAt,expiresAt,from,to,reviews,performance};}
  }
  if(!reports.length)reports.push({id,nome:selected.name,metriche:[]});
  const publishedReports=clientId!=='demo-bigant'&&clientResults?clientResults.published(user,clientId).reports.map(row=>({...row,summary:'Voci verificate per questo servizio.',nextSteps:'',entries:row.entries.filter(entry=>entry.serviceId===id)})).filter(row=>row.entries.length):[];
  return {demo:c.demo,clientId,clientName:c.client.name,service:serviceCard(selected),reports,google,publishedReports,...(id==='email-marketing'&&emailMarketing?{emailMarketing:emailMarketing.state(user,clientId)}:{}),
   note:id==='fidelity'?'Gli iscritti appartengono soltanto a questa attività. Gli invii dipendono dalle autorizzazioni del prodotto.':'I valori mancanti restano da collegare. Bozze e calendario editoriale sono gestiti separatamente.'};
 }
 function profiles(user,clientId){
  const c=scope(user,clientId);
  if(!publicProfiles)throw new AppError('Profili non disponibili.',503);
  const directory=publicProfiles(c.user,clientId);
  const channelServices={instagram:['social'],facebook:['social'],linkedin:['social'],tiktok:['social'],'google-business':['local','presence','multisite','seo'],website:['website','seo','ecommerce']};
  return {demo:c.demo,clientId,clientName:c.client.name,canEdit:false,items:directory.items.map(row=>({id:row.id,name:row.name,
   link:row.link?{url:row.link.url,sourceUrl:row.link.sourceUrl,updatedAt:row.link.updatedAt}:null,
   reportService:(channelServices[row.id]||[]).find(id=>c.visible.some(service=>service.id===id))||null}))};
 }
 async function handle({method,path,user,clientId}){
  if(method!=='GET')throw new AppError('Area cliente in sola lettura.',405);
  if(path==='/profiles')return {data:profiles(user,clientId)};
  if(path==='/dashboard')return {data:dashboard(user,clientId)};
  if(path==='/results'&&clientResults){scope(user,clientId);return {data:clientResults.published(user,clientId)};}
  if(path==='/services/fidelity/source')return {data:fidelitySource(user,clientId)};
  const match=path.match(/^\/services\/([a-z-]+)$/);
  if(match)return {data:service(user,clientId,match[1])};
  return null;
 }
 return {dashboard,service,profiles,fidelitySource,handle};
}
