// Permessi e inneschi della sola esecuzione locale: non attivano servizi esterni.
export const agentServices={
 director:[],marketing:[],administration:[],account:[],quality:[],reporter:[],
 social:['social'],research:['growth'],analyst:['growth'],commercial:['growth'],fidelity:['fidelity'],
 video:['video'],ads:['ads'],seo:['seo'],website:['website'],ecommerce:['ecommerce'],booking:['booking'],reception:['reception'],local:['local','presence','multisite'],reputation:['local','presence','multisite'],multisite:['multisite'],accessibility:['accessibility'],
 'social-commerce':['social-commerce'],display:['display'],tv:['tv'],merch:['merch'],verticals:['verticals'],branding:['branding'],'events':['events'],drone:['drone'],'video-ai':['video-ai'],'creative-direction':['creative-direction','branding','video']
};
export const agencyOnlyAgents=['director','marketing','administration','verticals'];
export const eventDefinitions=[
 ['lead.created','Nuovo lead DEMO'],['client.created','Nuova anagrafica DEMO'],['content.ready','Bozza in revisione'],['content.approved','Contenuto approvato'],['contract.signed','Contratto registrato DEMO'],['review.created','Recensione DEMO inserita'],['objective.changed','Obiettivo DEMO aggiornato'],['brief.approved','Brief DEMO approvato']
].map(([id,name])=>({id,name,implemented:true,simulation:true,source:['review.created','objective.changed','brief.approved'].includes(id)?'Evento DEMO esplicito; provider scollegato':'Operazione locale comune o evento DEMO esplicito'}));
export function eligibleAgent(id,client) {
 if(!Object.hasOwn(agentServices,id))return {eligible:false,unavailableReason:'Specialista non registrato.'};
 if(agencyOnlyAgents.includes(id)&&client.id!=='demo-bigant')return {eligible:false,unavailableReason:'Procedura interna: seleziona BigAnt, cliente zero.'};
 if(client.id==='demo-bigant'&&!['research','analyst','commercial','fidelity'].includes(id))return {eligible:true,unavailableReason:null};
 const selected=JSON.parse(client.services_json),required=agentServices[id];
 const eligible=!required.length||required.some(s=>selected.includes(s));
 return {eligible,unavailableReason:eligible?null:'Servizio non incluso per questa attività.'};
}
