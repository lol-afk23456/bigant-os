'use strict';

// Shared navigation pattern: compact cards, one open section, a clear way back.
function sectionCards(items){
 return `<div class="section-cards">${items.map(item=>`<button class="section-card" data-view="${e(item.route)}"><span class="section-card-icon">${icon(item.icon||'grid')}</span><span class="section-card-copy"><b>${e(item.name)}</b><strong>${e(item.value??'Apri')}</strong>${item.note?`<small>${e(item.note)}</small>`:''}</span><span class="section-card-arrow">${icon('arrow')}</span></button>`).join('')}</div>`;
}
function sectionNavigator(base,items,renderSection,backRoute=`${base}:sections`){
 const current=items.find(item=>item.id===S.section);
 if(!current)return sectionCards(items.map(item=>({...item,route:`${base}:${item.id}`})));
 return `<div class="section-back">${btn('Indietro','goto',backRoute,'ghost','arrow')}<span>${e(current.name)}</span></div>${renderSection(current.id)}`;
}
function workspaceHero(heading,description,action=''){
 return `<section class="hero workspace-hero"><div class="hero-copy"><div class="eyebrow">LA TUA CABINA DI REGIA</div><h2>${heading}</h2><p>${e(description)}</p>${action}</div><div class="hero-aside" aria-hidden="true"><span class="orbit"></span><span class="orbit second"></span><span class="hero-symbol">${icon('agents')}</span></div></section>`;
}
function workspaceHomeView(){
 const d=S.module||{},name=(S.session.user.name||'').split(' ')[0];
 const heading=title(`Ciao ${name}. Da dove partiamo?`,'Le cose che richiedono attenzione, in un solo posto.',`<span class="date-label">${date(new Date())}</span>`);
 if(!isOwner())return heading+workspaceHero('Il tuo spazio.<br>Il lavoro, più chiaro.','Apri un cliente assegnato o rivedi le bozze social che aspettano il tuo sguardo.')+sectionCards([
  {name:'Clienti assegnati',value:d.clients?.length||0,route:'clients',icon:'users'},
  {name:'Da approvare',value:d.approvals?.length||0,route:'agents:approvals',icon:'approval'}
 ])+(!d.clients?.length?notice('Non hai ancora clienti assegnati. Un socio può aggiungerli dalla pagina Accessi.'):'');
 const swarm=d.swarm||{},cards=[
  {name:'Da approvare',value:d.approvals?.length||0,note:'Bozze in attesa di una persona',route:'agents:approvals',icon:'approval'},
  {name:'Contratti in scadenza',value:d.expiringContracts?.length||0,note:'Nei prossimi 30 giorni',route:'clients',icon:'calendar'},
  {name:'Clienti',value:d.customers?.active||0,note:`${d.customers?.newThisMonth||0} nuovi questo mese`,route:'clients',icon:'users'},
  {name:'Growth',value:d.growth?.connected?d.growth.newLeads:'Da attivare',note:'Ricerca e sviluppo clienti',route:'growth',icon:'growth'},
  {name:'Sciame di agenti',value:`${swarm.active||0} attivi`,note:`${(swarm.blocked||0)+(swarm.qualityBlocked||0)} lavori da verificare · ${money(swarm.usedCents)} su ${money(swarm.capCents)}`,route:'agents',icon:'agents'},
  {name:'Collegamenti',value:d.connections?.errors?`${d.connections.errors} da verificare`:`${d.connections?.connected||0} collegati`,note:'Account e fonti dei dati',route:'connections',icon:'link'}
 ];
 return heading+workspaceHero('La testa resta umana.<br>Il lavoro trova il suo ritmo.','Clienti, approvazioni e agenti. Scegli il prossimo passo.',btn('Apri lo sciame','goto','agents','primary','arrow'))+sectionCards(cards)+(S.overview.backup?.error?notice(S.overview.backup.error,true):'');
}
function workspaceProfilesView(){
 const data=S.module,header=title('I profili, tutti qui.',`Indirizzi pubblici e fonti di ${clientName(S.clientId)}. Registrare un indirizzo non collega l’account né acquisisce dati.`);
 if(!data||data.clientId!==S.clientId||!Array.isArray(data.items))return header+empty('Profili non disponibili','Aggiorna la pagina per leggere i canali dell’attività selezionata.','globe');
 const rows=data.items.filter(row=>row&&PROFILE_CHANNELS.includes(row.id));
 if(!S.section||S.section==='sections')return header+(rows.length?sectionCards(rows.map(row=>({id:row.id,name:row.name,value:row.link?'Indirizzo registrato':'Da aggiungere',note:'Account: '+profileConnectionStatus(row.status),icon:'globe',route:'profiles:'+row.id}))):empty('Nessun canale disponibile','Aggiorna la pagina per riprovare.','globe'));
 const row=rows.find(item=>item.id===S.section),back=`<div class="section-back">${btn('Indietro','goto','profiles','ghost','arrow')}</div>`;
 if(!row)return header+back+empty('Canale non disponibile','Torna all’elenco e scegli uno dei profili.','globe');
 const link=row.link,manual=link?.confirmation==='owner',canEdit=isOwner()&&data.canEdit===true;
 const links=link?`<dl class="out-obj"><div><dt>Indirizzo pubblico</dt><dd class="out-text">${profileExternalLink(link.url,'Apri il profilo pubblico',row.id)}</dd></div><div><dt>Fonte dell’indirizzo</dt><dd class="out-text">${profileExternalLink(link.sourceUrl,'Apri la fonte')}</dd></div><div><dt>Conferma dell’attività</dt><dd>${manual?'Corrispondenza confermata manualmente da un socio.':'Conferma non disponibile.'}</dd></div><div><dt>Ultimo inserimento o modifica</dt><dd>${progressDate(link.updatedAt)}</dd></div></dl>${notice('L’indirizzo è stato registrato manualmente. La verifica indipendente della corrispondenza con l’attività resta da completare.')}`:empty('Indirizzo da aggiungere',canEdit?'Inserisci il profilo pubblico e la fonte dopo aver controllato a quale attività appartengono.':'Un socio può registrare il profilo pubblico e la sua fonte.','link');
 return header+back+panel(row.name,links+(row.id==='linkedin'?notice('Questa scheda accetta soltanto pagine LinkedIn aziendali, con indirizzo /company/.'):'')+`<div class="section"><h3>Account e dati della piattaforma</h3>${badge(profileConnectionStatus(row.status),'orange')}<p>Il collegamento dell’account e la lettura dei dati richiedono un’attivazione separata.</p><dl class="out-obj"><div><dt>Ultima sincronizzazione</dt><dd>Non ancora effettuata</dd></div><div><dt>Metriche</dt><dd>Non ancora disponibili</dd></div></dl></div>`+(row.id==='google-business'?`<div class="section"><h3>Recensioni</h3>${empty('Non ancora disponibili','Compariranno qui dopo il collegamento e la verifica di Google Business Profile.','star')}</div>`:'')+(canEdit?`<div class="actions section">${btn(link?'Modifica indirizzo e fonte':'Aggiungi indirizzo e fonte','profile-edit',row.id,'primary','link')}</div>`:''));
}
const PROFILE_CHANNELS=['instagram','facebook','linkedin','tiktok','google-business','website'];
function profileConnectionStatus(value){return value==='Da collegare'?value:'Stato non disponibile';}
function profilePublicURL(value,channel=''){
 if(typeof value!=='string'||!value.trim())return null;
 try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.port)return null;if(channel==='linkedin'&&(!['linkedin.com','www.linkedin.com'].includes(url.hostname)||!/^\/company\/[^/]+\/?$/.test(url.pathname)))return null;return url.href;}catch{return null;}
}
function profileExternalLink(value,label,channel=''){const url=profilePublicURL(value,channel);return url?`<a href="${e(url)}" target="_blank" rel="noopener noreferrer" aria-label="${e(label)}">${e(url)}</a>`:'Indirizzo non disponibile o da verificare.';}
ACTIONS['profile-edit']=id=>{
 const data=S.module,row=data?.items?.find(item=>item.id===id);
 if(S.view!=='profiles'||!isOwner()||data?.canEdit!==true||data.clientId!==S.clientId||!PROFILE_CHANNELS.includes(id)||!row)throw Error('Solo un socio può modificare i profili dell’attività selezionata.');
 const snapshot=viewSnapshot(),clientId=S.clientId,channel=row.id,version=row.link?.version??0,editorToken=crypto.randomUUID(),activity=clientName(clientId);
 if(!Number.isSafeInteger(version)||version<0)throw Error('Versione del profilo non disponibile. Aggiorna la scheda.');
 let saving=false;
 const current=()=>isCurrentView(snapshot)&&isOwner()&&S.module===data&&data.canEdit===true&&data.clientId===clientId&&(data.items.find(item=>item.id===channel)?.link?.version??0)===version&&$('#dialog').open&&$('#dialog-content').innerHTML.includes(`data-profile-editor="${editorToken}"`);
 form('Profilo '+row.name+' · '+activity,[{name:'url',label:channel==='linkedin'?'Pagina LinkedIn aziendale · https://www.linkedin.com/company/…':'Indirizzo pubblico HTTPS',type:'url',value:row.link?.url||'',required:true,full:true},{name:'sourceUrl',label:'URL della fonte usata per riconoscere l’attività',type:'url',value:row.link?.sourceUrl||'',required:true,full:true},{html:`<label class="check-field" data-profile-editor="${editorToken}"><input type="checkbox" name="confirmedBusiness" required><span>Confermo che questo profilo appartiene a ${e(activity)} e ho controllato la fonte indicata</span></label>`}],async(b,fd)=>{
  if(!current())throw Error('Attività, pagina o accesso cambiati. Riapri la scheda prima di salvare.');
  if(saving)throw Error('Salvataggio già in corso. Attendi l’esito.');
  if(!fd.has('confirmedBusiness'))throw Error('Conferma che il profilo appartenga all’attività indicata.');
  const url=profilePublicURL(b.url,channel),sourceUrl=profilePublicURL(b.sourceUrl);
  if(!url||!sourceUrl)throw Error(channel==='linkedin'?'Inserisci una pagina LinkedIn aziendale /company/ e una fonte HTTPS valide.':'Inserisci indirizzo pubblico e fonte HTTPS validi, senza credenziali o porte personalizzate.');
  let updated;saving=true;try{updated=await api('/api/workspace/profiles/'+encodeURIComponent(channel)+'?clientId='+encodeURIComponent(clientId),{method:'PATCH',body:{version,url,sourceUrl,confirmedBusiness:true},scoped:false});}catch(error){if(!current())return;throw error;}finally{saving=false;}
  if(!current())return;
  if(updated?.clientId!==clientId||!Array.isArray(updated.items))throw Error('Risposta del profilo non verificabile. Riapri la scheda per controllare il salvataggio.');
  S.module=updated;$('#dialog').close();toast('Indirizzo e fonte salvati. Account ancora da collegare.');render();
 },{submit:'Salva indirizzo e fonte',intro:'Registra soltanto indirizzi pubblici. Usa indirizzi senza parametri di tracciamento. Non inserire password, token o accessi riservati. Il salvataggio non collega account e non visita i siti.',extra:`<div class="actions section">${btn('Rileggi scheda','goto','profiles:'+channel,'ghost','refresh')}</div>`});
};
function workspaceProgressView(){
 const data=S.module||{},groups=[
  {id:'status',name:'Stato della piattaforma',value:'Funziona · Prova · Da collegare',icon:'chart'},
  {id:'foundations',name:'Fondamenta da completare',value:Array.isArray(data.foundations)?`${data.foundations.length} aree`:'Da leggere',icon:'grid'}
 ];
 const header=title('Avanzamento BigAnt OS.','Cosa funziona, cosa è ancora una prova e cosa aspetta un collegamento.')+
  `<p class="muted">${e(typeof data.environment==='string'?data.environment:'Ambiente da verificare')} · Lettura dello stato: ${progressDate(data.readAt)}</p>`+
  notice(typeof data.notice==='string'?data.notice:'Lo stato non è disponibile. Aggiorna i dati per riprovare.');
 const [section,id,...extra]=String(S.section||'').split('/'),group=groups.find(item=>item.id===section);
 if(!group){
  if(S.section&&S.section!=='sections')return header+`<div class="section-back">${btn('Indietro','goto','progress','ghost','arrow')}</div>`+empty('Sezione non disponibile','Torna ad Avanzamento e scegli una delle due schede.');
  return header+sectionCards(groups.map(item=>({...item,route:'progress:'+item.id})));
 }
 const rows=(Array.isArray(data[section==='status'?'items':'foundations'])?data[section==='status'?'items':'foundations']:[]).filter(row=>row&&typeof row.id==='string'&&/^[a-z0-9-]+$/.test(row.id));
 const back=`<div class="section-back">${btn('Indietro','goto',id!==undefined?'progress:'+section:'progress','ghost','arrow')}<span>${e(group.name)}</span></div>`;
 if(id!==undefined){
  const item=!extra.length&&rows.find(row=>row.id===id);
  return header+back+(item?progressDetail(item):empty('Scheda non disponibile','Questa voce non è presente nello stato appena letto. Torna all’elenco o aggiorna i dati.'));
 }
 return header+back+(rows.length?sectionCards(rows.map(item=>({name:item.name||'Voce senza nome',value:progressStatus(item.status),route:`progress:${section}/${item.id}`,icon:group.icon}))):empty('Stato non disponibile','Non ci sono schede consultabili in questa lettura. Aggiorna i dati per riprovare.'));
}
function progressStatus(value){return ['Funziona','Prova','Da collegare'].includes(value)?value:'Stato non disponibile';}
function progressDate(value){
 if(typeof value!=='string'||!value.trim()||!Number.isFinite(Date.parse(value)))return 'Data non disponibile';
 return `<time datetime="${e(value)}">${e(new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Rome'}).format(new Date(value)))} · Roma</time>`;
}
function progressDetail(item){
 const status=progressStatus(item.status),strings=value=>Array.isArray(value)?value.filter(row=>typeof row==='string'&&row.trim()):[];
 const routes=['users:people','clients','catalog:plan','catalog:prices','connections','agents:list','agents:office','agents:approvals','growth:connections','fidelity','fidelity:settings','profiles','administration'];
 const route=routes.includes(item.route)&&allowedNav().some(row=>row[0]===item.route.split(':')[0])?item.route:null;
 const evidence=typeof item.evidenceAt==='string'&&Number.isFinite(Date.parse(item.evidenceAt));
 return panel(item.name||'Scheda senza nome',`${badge(status,status==='Funziona'?'green':'orange')}<p>${e(item.summary||'Descrizione non disponibile.')}</p>`+
  `<h3>Cosa è disponibile</h3>${bulletText(strings(item.available),'Nessuna capacità documentata in questa lettura.')}`+
  `<h3>Cosa manca</h3>${bulletText(strings(item.missing),'Nessuna mancanza indicata nella scheda. Consulta il perimetro descritto sopra.')}`+
  `<dl class="out-obj section"><div><dt>Fonte dello stato</dt><dd>${e(item.source||'Fonte non disponibile.')}</dd></div><div><dt>${e(item.evidenceLabel||'Data dell’evidenza')}</dt><dd>${evidence?progressDate(item.evidenceAt):'Nessuna evidenza datata disponibile.'}</dd></div></dl>`+
  (route?`<div class="actions section">${btn('Apri la pagina','goto',route,'','arrow')}</div>`:''));
}
function agentsUnifiedView(){
 if(!isOwner())return approvalsView();
 const a=S.module||{},jobs=(a.jobs||[]).filter(job=>job.client_id===S.clientId);
 const sections=[{id:'office',name:'Ufficio',value:'Lo sciame dal vivo',icon:'eye'},{id:'list',name:'Agenti',value:'Elenco e compiti',icon:'agents'},
  {id:'approvals',name:'Da approvare',value:approvalItems().filter(item=>item.status==='pending').length,icon:'approval'},
  {id:'history',name:'Storico',value:'Risultati ed esecuzioni',icon:'clock'},{id:'budget',name:'Budget',value:'Spesa e tetto mensile',icon:'wallet'},{id:'structure',name:'Struttura',value:'Reparti e specialisti',icon:'grid'}];
 const header=title('Sciame di agenti.','Una sola regia, dal lavoro degli agenti alle tue decisioni.',S.section==='office'?btn('Avvia un giro','ufficio-avvia','','primary','play'):'');
 if(S.section.startsWith('structure/'))return header+`<div class="section-back">${btn('Indietro','goto','agents:structure','ghost','arrow')}<span>Struttura dello sciame</span></div>`+swarmDepartmentView(a,S.section.slice('structure/'.length));
 return header+(S.section==='office'?workspaceHero('La testa resta umana.<br>Il lavoro trova il suo ritmo.','Le postazioni mostrano il lavoro registrato. Ogni contenuto richiede una decisione umana.',`<div class="actions">${btn('Esplora lo sciame','goto','agents:list','primary','arrow')}${btn('Priorità del Direttore','director-priorities','','','chart')}</div>`):'')+sectionNavigator('agents',sections,id=>{
  if(id==='office')return `<div id="ufficio-root">${ufficioCorpo()}</div>`;
  if(id==='approvals')return approvalsView();
  if(id==='list')return notice('Base = procedura di prova. AI pronta = configurazione e collaudo completati. Attivo = autorizzato per il lavoro reale.')+`<div class="toolbar"><label class="sr-only" for="local-filter">Cerca un agente</label><input id="local-filter" class="search" placeholder="Cerca un agente o un compito…" value="${e(S.filter)}"></div><div class="card-grid">${(a.configuration?.items||[]).filter(agent=>`${agent.name} ${agent.config.task}`.toLocaleLowerCase('it').includes(S.filter.toLocaleLowerCase('it'))).map(agent=>`<article class="module-card"><h3>${e(agent.name)}</h3>${badge(agent.operationalStatus,agent.operationalStatus==='Attivo'?'green':'orange')}<p>${e(agent.config.task)}</p><small>${agent.hasAIInstructions?'Istruzioni AI presenti':'Procedura base disponibile'} · ${e(agent.config.cadence==='manual'?'Avvio manuale':label(agent.config.cadence))}</small><footer>${btn('Configura','agent-config',agent.id,'small')}${btn('Registro','agent-record',agent.id,'small ghost')}${S.session.demo!==false?btn('Prova procedura','run-agent',agent.id,'small ghost'):''}</footer></article>`).join('')}</div>`;
  if(id==='history')return panel('Esecuzioni dello sciame AI',table(['Agente','Quando','Stato','Qualità',''],(a.configuration?.history||[]).filter(row=>row.client_id===S.clientId).map(row=>[e(row.agente),date(row.created_at,true),badge(STATI_PASSO_UI[row.stato]||row.stato),e(row.esito_qualita||'Da verificare'),btn('Leggi','ufficio-postazione',row.id,'small')])))+panel('Procedure di prova',table(['Agente','Quando','Stato','Esito',''],jobs.map(job=>[e(agentName(job.agent)),date(job.created_at,true),badge(agentJobStatus(job)),e(job.result?.summary||job.error||'In attesa'),job.result?btn('Leggi elaborato','agent-result',job.id,'small'):''])));
  if(id==='budget'){const b=a.budget||{},costs=a.configuration?.costs||{};return panel('Budget dello sciame',`<div class="stats">${stat('Tetto mensile',money(b.capCents),'Limite condiviso')}${stat('Speso e impegnato',money(b.usedCents),'Nel mese corrente')}${stat('Disponibile',money(b.availableCents),'Dopo quote fisse e riserva')}</div>${btn('Modifica ripartizione','budget','','','wallet')}`)+panel('Costo per agente',table(['Agente','Contabilizzato','Impegnato'],(costs.rows||[]).map(row=>[e(row.name),money(row.chargedCents),money(row.reservedCents)])))+notice(`Regia e altri consumi: ${money(costs.otherCents)}. I costi AI sono stime prudenziali finché il listino del modello non è verificato.`);}
  return sectionCards((a.departments||[]).map(department=>({name:department.name,value:`${department.agents?.length||0} ${department.agents?.length===1?'agente':'agenti'}`,note:department.purpose||department.trigger,route:'agents:structure/'+department.id,icon:'agents'})));
 });
}

function swarmDepartmentView(data,id){
 const department=(data.departments||[]).find(row=>row.id===id);
 if(!department)return empty('Reparto non disponibile','Torna alla Struttura e scegli un reparto.','agents');
 const members=(data.agents||[]).filter(agent=>(department.agents||[]).includes(agent.id));
 return panel(department.name,`<p>${e(department.purpose||department.trigger||'')}</p><p><strong>Responsabilità:</strong> ${e(department.owner||'Da definire con i soci')}</p>`)+`<div class="card-grid">${members.map(agent=>`<article class="module-card"><h3>${e(agent.name)}</h3><p>${e(agent.purpose||'')}</p><h4>Cosa prepara</h4>${bulletText(agent.outputs)}<h4>Come lavora</h4><p>${e(agent.execution?.mode||'Procedura da configurare')}</p><small>Metodo ${e(agent.sop?.version||'da verificare')} · ${e(agent.sop?.validation||'Da collaudare')}</small><h4>Controllo umano</h4><p>${e(agent.gate||'Decisione del team prima di qualsiasi azione esterna.')}</p><footer>${btn('Configura','agent-config',agent.id,'small','agents')}</footer></article>`).join('')}</div>`;
}

function directorPriorityBody(current){
 if(!current)return empty('Nessuna priorità registrata','Il Direttore non ha ancora un risultato per BigAnt. Questa lettura non avvia agenti o modelli.','chart');
 const approval={pending:'Da approvare',approved:'Approvata',rejected:'Rifiutata',changes:'Modifiche richieste',obsolete:'Versione superata',simulated:'Passaggio interno DEMO',needs_review:'Da verificare'}[current.approvalStatus]||'Da verificare';
 const meta=`<div class="pill-row">${badge(current.mode||'Origine da verificare')}${badge(approval,current.approvalStatus==='approved'?'green':'orange')}</div><dl class="out-obj"><div><dt>Fonte</dt><dd>${e(agentValue(current.source))}</dd></div><div><dt>Aggiornato</dt><dd>${date(current.updatedAt,true)}</dd></div><div><dt>Versione</dt><dd>${e(current.version??'—')}</dd></div>${current.quality?`<div><dt>Controllo qualità</dt><dd>${e(agentValue(current.quality))}</dd></div>`:''}${current.decisionAt?`<div><dt>Decisione</dt><dd>${date(current.decisionAt,true)}${current.decisionBy?' · '+e(agentValue(current.decisionBy)):''}</dd></div>`:''}</dl>`;
 const items=Array.isArray(current.items)?current.items:[];
 const content=current.available===false?'':`<h3>${e(current.title||'Proposte del Direttore')}</h3>`+(items.length?list(items,(item,i)=>`<div class="list-item"><span class="number">${i+1}</span><div class="body"><b>${e(item.title)}</b><p>${e(item.reason)}</p><small>${e(item.next)}</small></div></div>`):`<p class="preserve">${e(current.body||'Nessun testo disponibile.')}</p>`);
 return meta+notice(current.notice||'Sono proposte da valutare. Questa lettura non approva né avvia alcuna attività.',current.approvalStatus!=='approved')+content+(current.available!==false&&current.id&&['procedure','sciame'].includes(current.kind)?`<div class="actions section">${btn('Leggi il risultato di origine','director-source','','','file')}</div>`:'');
}

Object.assign(ACTIONS,{
 'director-priorities':async()=>{
  const snapshot=viewSnapshot(),token={};S.priorityDialogToken=token;S.directorPriority=null;
  dialog('Priorità del Direttore',notice('Sto leggendo le proposte registrate per BigAnt.'));
  const visible=()=>isCurrentView(snapshot)&&S.priorityDialogToken===token&&$('#dialog').open&&$('#dialog-title')?.textContent==='Priorità del Direttore';
  let result;try{result=await api('/api/workspace/priorities',{scoped:false});}catch(error){if(visible())dialog('Priorità del Direttore',notice(error.message||'Le priorità non sono disponibili. Riprova.',true)+btn('Riprova','director-priorities','','','refresh'));throw error;}
  if(!visible())return;
  S.directorPriority=result.current;dialog('Priorità del Direttore',directorPriorityBody(result.current));
 },
 'director-source':async()=>{const current=S.directorPriority;if(!current||current.available===false)return;if(current.kind==='sciame')return ACTIONS['ufficio-postazione'](current.id);if(current.kind==='procedure')return openAgentOutput(current.id,'demo-bigant');}
});

function usersView(){
 return sectionNavigator('users',[
  {id:'people',name:'Persone',value:S.module?.items?.length||0,icon:'users'},
  {id:'registry',name:'Registro',value:'Accessi e modifiche',icon:'clock'}
 ],id=>id==='people'?usersPeopleView():activityView());
}

function contractLinks(items){
 return table(['Contratto','Inizio','Scadenza','Rinnovo','Documento'],items.map(item=>[
  e(item.title),date(item.start_date),date(item.end_date),e(item.renewal||'Da definire'),
  item.has_document?`<a class="btn small" href="/api/client-record/contracts/${encodeURIComponent(item.id)}/pdf?clientId=${encodeURIComponent(S.clientId)}">Scarica PDF</a>`:'Da allegare'
 ]));
}
function clientRecordsView(){
 if(!S.section){
  const due=S.module?.items||[];
  return (isOwner()&&due.length?panel('Contratti in scadenza entro 30 giorni',list(due,item=>`<div class="list-item"><div class="body"><b>${e(item.client_name)}</b><small>${e(item.title)} · ${date(item.end_date)}</small></div>${btn('Apri cliente','select-client',item.client_id,'small')}</div>`)):'')+clientsView()+(isOwner()?`<div class="section">${btn('Risultati dei clienti','goto','clients:results','','chart')}</div>`:'');
 }
 if(S.section==='results')return title('Risultati dei clienti.','Una vista comune. Fonte e data accompagneranno ogni dato disponibile.',btn('Indietro','goto','clients','','arrow'))+`<div class="card-grid">${S.overview.clients.map(client=>`<article class="module-card"><h3>${e(client.name)}</h3>${badge('Da collegare')}<p>Le fonti esterne non sono ancora collegate.</p>${btn('Apri cliente','select-client',client.id,'small')}</article>`).join('')}</div>`;
 const d=S.module||{},c=d.client||{},items=[
  {id:'profile',name:'Anagrafica',value:c.industry||'Da completare',icon:'users'},
  ...(isOwner()?[{id:'contract',name:'Contratto',value:d.contracts?.length||0,icon:'file'}]:[]),
  {id:'credentials',name:'Accessi',value:d.credentials?.length||0,icon:'shield'},
  {id:'brief',name:'Scheda informativa',value:'Brief, voce e note',icon:'book'},
  {id:'services',name:'Servizi attivi',value:d.services?.length||0,icon:'grid'},
  ...(isOwner()?[{id:'documents',name:'Documenti',value:'Contratti',icon:'file'}]:[]),
  {id:'onboarding',name:'Avvio cliente',value:d.onboarding?.completed?'Completato':'Da completare',icon:'check'},
  {id:'client-results',name:'Risultati',value:'Fonti da collegare',icon:'chart'}
 ];
 return title(c.name||'Scheda cliente','Lo spazio di lavoro dell’agenzia per questa attività.',btn('Tutti i clienti','goto','clients','','arrow')+(isOwner()?btn('Guarda come il cliente','goto','client','','eye'):''))+sectionNavigator('clients',items,id=>{
  if(id==='profile')return panel('Anagrafica',`<dl class="out-obj"><div><dt>Nome</dt><dd>${e(c.name)}</dd></div><div><dt>Settore</dt><dd>${e(c.industry||'Da completare')}</dd></div><div><dt>Indirizzo</dt><dd>${e(c.address||'Da completare')}</dd></div></dl>`,isOwner()?btn('Modifica','record-profile','','small'):'');
  if(['contract','documents'].includes(id))return panel('Contratti',contractLinks(d.contracts||[]),btn('Aggiungi contratto','record-contract','','small','plus'))+notice('Qui trovi i contratti. Per fatture e pagamenti il registro ufficiale resta Trello.');
  if(id==='credentials')return (!d.vaultReady?notice('Archivio protetto da configurare sul server. Potrai salvare gli accessi dopo la configurazione.'):notice('Le credenziali restano nascoste. Ogni apertura viene registrata.'))+panel('Accessi del cliente',list(d.credentials||[],item=>`<div class="list-item"><div class="body"><b>${e(item.label)}</b><small>Aggiornato ${date(item.updated_at,true)}</small></div>${btn('Apri credenziali','record-reveal',item.id,'small','eye')}</div>`),d.vaultReady?btn('Nuovo accesso','record-credential','','small','plus'):'');
  if(id==='brief')return `<div class="card-grid">${[['master','Brief'],['dna','Tono di voce'],['strategy','Strategia'],['feedback','Note e feedback']].map(([kind,name])=>{const row=(d.memory||[]).find(item=>item.kind===kind);return `<article class="module-card"><h3>${name}</h3><small>${row?`Versione ${row.version} · ${date(row.updated_at,true)}`:'Da compilare'}</small><div class="preserve section">${e(row?.content||'')}</div><footer>${btn('Modifica','record-memory',kind,'small')}</footer></article>`;}).join('')}</div>`;
  if(id==='services')return `<div class="card-grid">${(d.services||[]).map(service=>`<article class="module-card"><h3>${e(serviceName(service))}</h3>${badge('Attivo per il cliente','green')}<p>Report del servizio: da completare con fonti verificate.</p></article>`).join('')||empty('Nessun servizio attivo','Un socio può aggiungere i servizi dalla lista clienti.')}</div>`;
  if(id==='onboarding')return panel('Avvio cliente',`<div class="pill-row">${badge(d.onboarding.completed?'Completato':'Da completare')}</div><p class="preserve">${e(d.onboarding.notes||'Annota dati mancanti, prossimo passo e responsabile.')}</p><ul class="plain-list"><li>Scheda informativa: ${(d.memory||[]).some(row=>row.kind==='master')?'presente':'da compilare'}</li><li>Servizi assegnati: ${d.services.length}</li><li>Accessi registrati: ${d.credentials.length}</li></ul>`,isOwner()?btn('Aggiorna avvio','record-onboarding','','small'):'');
  return panel('Risultati',empty('Fonti da collegare','Non ci sono ancora metriche verificate per questa attività.','chart'));
 });
}

Object.assign(ACTIONS,{
 'record-profile':()=>{const c=S.module.client;form('Anagrafica cliente',[textField('name','Nome',c.name),textField('industry','Settore',c.industry,false),textField('address','Indirizzo',c.address,false)],async b=>{await mutate('/api/client-record/profile',b,'PATCH');await saved('Anagrafica aggiornata');},{intro:''});},
 'record-memory':kind=>{const row=S.module.memory.find(item=>item.kind===kind);form('Scheda informativa',[{name:'content',label:'Testo',type:'textarea',value:row?.content||'',required:true,full:true}],async b=>{await mutate('/api/client-record/memory',{...b,kind,version:row?.version||0});await saved('Nuova versione salvata');},{intro:'La versione precedente rimane nello storico.'});},
 'record-credential':()=>form('Accesso del cliente',[textField('label','Nome accesso'),textField('username','Utente o email'),{name:'password',label:'Password',type:'password',required:true},{name:'url',label:'Indirizzo della piattaforma',type:'url'},{name:'notes',label:'Note riservate',type:'textarea',full:true}],async b=>{await mutate('/api/client-record/credentials',b);await saved('Accesso salvato nell’archivio protetto');},{intro:'Visibile ai soci e ai collaboratori assegnati a questo cliente.'}),
 'record-reveal':async id=>{const item=await mutate('/api/client-record/credentials/'+encodeURIComponent(id)+'/reveal');dialog(item.label,notice('Questa apertura è stata registrata.')+`<dl class="out-obj"><div><dt>Utente</dt><dd>${e(item.username)}</dd></div><div><dt>Password</dt><dd class="preserve">${e(item.password)}</dd></div><div><dt>Piattaforma</dt><dd>${e(item.url)}</dd></div><div><dt>Note</dt><dd>${e(item.notes)}</dd></div></dl>`);},
 'record-contract':()=>form('Aggiungi contratto',[textField('title','Nome del contratto'),{name:'startDate',label:'Data di inizio',type:'date',required:true},{name:'endDate',label:'Scadenza',type:'date',required:true},{name:'noticeDays',label:'Preavviso in giorni',type:'number',value:30,min:0,max:365},{name:'renewal',label:'Rinnovo e durata',type:'textarea',full:true},{html:'<label for="contract-pdf">Documento PDF (massimo 500 KB)</label><input id="contract-pdf" name="pdf" type="file" accept="application/pdf,.pdf">'}],async(b,fd)=>{const file=fd.get('pdf');let pdfBase64='';if(file?.size){if(file.size>500000)throw Error('Scegli un PDF di massimo 500 KB.');pdfBase64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Impossibile leggere il PDF.'));reader.readAsDataURL(file);});}await mutate('/api/client-record/contracts',{title:b.title,startDate:b.startDate,endDate:b.endDate,noticeDays:Number(b.noticeDays),renewal:b.renewal,pdfBase64});await saved('Contratto aggiunto');},{intro:'La scadenza alimenta gli avvisi della Home e della pagina Clienti.'}),
 'record-onboarding':()=>{const row=S.module.onboarding;form('Avvio cliente',[{name:'notes',label:'Prossimi passi, responsabile e note',type:'textarea',full:true,value:row.notes},{name:'completed',label:'Avvio completato',type:'checkbox',value:!!row.completed}],async(b,fd)=>{await mutate('/api/client-record/onboarding',{notes:b.notes,completed:fd.has('completed'),version:row.version});await saved('Avvio aggiornato');},{intro:''});}
});


Object.assign(ACTIONS,{
 'agent-config':async id=>{const snapshot=viewSnapshot(),configuration=S.module.configuration||await api('/api/agent-config/state',{scoped:false});if(!isCurrentView(snapshot))return;const agent=configuration.items.find(item=>item.id===id);if(!agent)throw Error('Agente non disponibile. Ricarica lo Sciame.');const c=agent.config;form('Configura · '+agent.name,[
  {name:'task',label:'Compito',type:'textarea',value:c.task,required:true,full:true},
  selectField('service','Servizio',[['','Trasversale'],...S.overview.registry.services.map(row=>[row.id,row.name])],c.service),
  selectField('provider','Fornitore AI',[['','Scelta rinviata'],['api','Anthropic'],['openai','OpenAI']],c.provider),
  {name:'estimatedCents',label:'Costo stimato per esecuzione (centesimi)',type:'number',min:1,max:5000,value:c.estimated_cents,required:true},
  {name:'instructions',label:'Istruzioni',type:'textarea',value:c.instructions,full:true},
  {name:'sources',label:'Fonti autorizzate',type:'textarea',value:c.sources,required:true,full:true},
  {name:'quality',label:'Controllo qualità',type:'textarea',value:c.quality,required:true,full:true},
  selectField('cadence','Quando lavora',[['manual','Solo quando lo avvio'],['daily','Ogni giorno'],['weekly-monday','Ogni lunedì'],['weekly-friday','Ogni venerdì'],['monthly','Ogni mese']],c.cadence)
 ],async b=>{await mutate('/api/agent-config/'+id,{...b,estimatedCents:Number(b.estimatedCents),enabled:false,authorized:false,version:c.version},'PATCH');await saved('Configurazione salvata; agente non attivato');},{intro:agent.activationBlock||'Le modifiche richiedono un nuovo collaudo prima dell’attivazione.'});},
 'agent-record':id=>{const agent=S.module.configuration.items.find(item=>item.id===id),jobs=(S.module.jobs||[]).filter(job=>job.agent===id),ai=(S.module.configuration.history||[]).filter(row=>(S.module.configuration.items.find(item=>item.id===id)?.aiId||id)===row.agente);dialog('Registro · '+agent.name,table(['Attività','Quando','Stato','Esito'],jobs.map(job=>[e(clientName(job.client_id)),date(job.created_at,true),badge(agentJobStatus(job)),e(job.result?.summary||job.error||'In attesa')]))+panel('Sciame AI',table(['Attività','Quando','Stato',''],ai.map(row=>[e(clientName(row.client_id)),date(row.created_at,true),badge(STATI_PASSO_UI[row.stato]||row.stato),btn('Leggi','ufficio-postazione',row.id,'small')]))));}
});

function productJobsPanel(){
 const rows=S.module?.jobs||[],google=S.view==='fidelity'&&S.module?.wallet?.google;
 return panel('Attività di '+(S.view==='growth'?'Growth':'Fidelity'),table(['Tipo','Stato','Quantità o data','Nota',''],rows.map(row=>[
  e(row.type==='wallet_update'?'Aggiornamento tessera':row.type==='wallet_revoke'?'Revoca tessera':row.type||'Aggiornamento tessere'),badge(row.status),row.count!==undefined?String(row.count):date(row.created||row.created_at,true),e(row.error||(row.status==='done'?'Aggiornamento confermato':row.status==='queued'?'Aggiornamento in attesa':'Nessuna azione esterna eseguita')),
  google?.enabled&&row.googleEligible&&isOwner()&&['blocked','failed'].includes(row.status)&&['wallet_update','wallet_revoke'].includes(row.type)?btn('Riprova','google-wallet-retry',row.id,'small'):''
 ])));
}
function fidelityWalletPanel(f){
 const g=f.wallet.google,canCheck=isOwner()&&!f.demo&&g.available&&g.configured;
 return panel('Google Wallet',`${badge(g.enabled?'Attivo':g.checked?'Prova tecnica completata':'Da collegare',g.enabled?'green':'orange')}<p>${e(g.note||'Google Wallet non è collegato. Le tessere DEMO restano nel browser.')}</p>${g.lastCheck?`<p>Ultimo collaudo: ${date(g.lastCheck,true)}. Il salvataggio sul telefono va verificato di persona.</p>`:''}<div class="actions">${canCheck?btn('Collauda una tessera','google-wallet-check','','','check'):''}${canCheck&&g.checked&&!g.enabled?btn('Conferma prova Android e attiva','google-wallet-activate','','primary'):''}${g.enabled&&isOwner()?btn('Sospendi Google Wallet','google-wallet-pause','','ghost'):''}</div><p class="muted">Chiavi e certificati si configurano solo nelle variabili protette del server. Le campagne restano senza invio.</p>`)+panel('Apple Wallet',notice('Da collegare: certificati, firma e prova su iPhone da completare. La tessera web è disponibile.'));
}
Object.assign(ACTIONS,{
 'google-wallet-check':()=>{const g=S.module.wallet.google,members=S.module.members.filter(m=>S.module.programs.some(p=>p.id===m.programId&&!p.demo&&p.active));if(!members.length)return dialog('Collaudo Google Wallet',notice('Crea prima un programma e una tessera di prova fuori dalla DEMO.'));form('Collauda Google Wallet',[selectField('memberId','Tessera da collaudare',members.map(m=>[m.id,m.name+' · '+m.programName+' · saldo '+m.balance])),{name:'acknowledged',label:'Autorizzo l’invio a Google dei dati di questa tessera di prova',type:'checkbox'}],async(b,fd)=>{if(!fd.has('acknowledged'))throw Error('Conferma l’invio dei dati della tessera di prova.');const result=await mutate('/api/fidelity/google-wallet/check',{memberId:b.memberId,version:g.version,acknowledged:true});await load();googleWalletLink(result.url,true);},{submit:'Prepara tessera su Google',intro:'Google riceverà nome, codice tessera, saldo, premi e dati del programma. Usa una persona di prova consapevole del collaudo. Ripetere il collaudo sospende emissioni e aggiornamenti fino alla nuova attivazione.'});},
 'google-wallet-activate':()=>{const g=S.module.wallet.google;form('Attiva Google Wallet',[{name:'deviceVerified',label:'Ho salvato la tessera su Android e verificato saldo e aggiornamento',type:'checkbox'}],async(b,fd)=>{if(!fd.has('deviceVerified'))throw Error('Completa prima la prova sul telefono.');await mutate('/api/fidelity/google-wallet/activate',{enabled:true,version:g.version,deviceVerified:true});await saved('Google Wallet attivato per questa attività');},{submit:'Attiva per questa attività',intro:'I titolari potranno preparare la propria tessera Google. Timbri, punti e revoche verranno sincronizzati automaticamente. Le campagne restano senza invio.'});},
 'google-wallet-pause':()=>{const g=S.module.wallet.google;form('Sospendi Google Wallet',[],async()=>{await mutate('/api/fidelity/google-wallet/activate',{enabled:false,version:g.version});await saved('Google Wallet sospeso');},{submit:'Sospendi',intro:'Ferma nuove emissioni e aggiornamenti, comprese le revoche remote. I link web già revocati restano inutilizzabili. Le tessere presenti nei telefoni possono mostrare l’ultimo saldo fino alla ripresa.'});},
 'google-wallet-retry':async id=>{await mutate('/api/fidelity/google-wallet/retry',{jobId:id});await saved('Aggiornamento rimesso in coda');}
});


function priceListTable(rows){
 return table(['Prodotto o servizio','Prezzo','Unità','Data','Note'],rows.map(row=>[e(row.name),money(row.price_cents),e(row.unit),date(row.effective_date),e(row.notes)]));
}
function servicePlanView(){
 if(!isOwner())return catalogView();
 const d=S.module||{},rows=d.items||[],prices=d.prices||[],filter=S.filter.toLocaleLowerCase('it');
 const current=rows.find(row=>S.section===`service/${row.id}`||S.section.startsWith(`service/${row.id}/`));
 if(current){
  const base=`service/${current.id}`,plan=current.plan;
  return title(current.name,'Il percorso del servizio, le persone che lo seguono e il suo listino.',btn('Tutti i servizi','goto','catalog:plan','','arrow'))+sectionNavigator('catalog',[
   {id:base+'/plan',name:'Attivazione',value:plan.status,icon:'check'},
   {id:base+'/method',name:'Come lavoriamo',value:'Passi e consegne',icon:'book'},
   {id:base+'/agents',name:'Agenti',value:current.agents.length,icon:'agents'},
   {id:base+'/prices',name:'Listino',value:prices.filter(row=>row.service===current.id).length,icon:'wallet'}
  ],id=>{
   if(id.endsWith('/plan'))return panel('Piano di attivazione',`${badge(plan.status,plan.status==='Attivo'?'green':'orange')}<dl class="out-obj"><div><dt>Data obiettivo</dt><dd>${plan.target_date?date(plan.target_date):'Da decidere'}</dd></div><div><dt>Cosa manca e prossimo passo</dt><dd class="preserve">${e(plan.missing||'Da definire con i soci')}</dd></div><div><dt>Fonte dello stato</dt><dd>${e(plan.version?`Aggiornato dai soci · versione ${plan.version} · ${date(plan.updated_at,true)}`:`Playbook da validare · ${current.sourceStatus}`)}</dd></div></dl>`,btn('Aggiorna piano','service-plan-edit',current.id,'small'))+notice('Lo stato descrive l’offerta dell’agenzia. Non attiva agenti, collegamenti o servizi sui clienti.');
   if(id.endsWith('/method'))return panel('Metodo e consegne',`<p>${e(current.description)}</p><h3>Cosa serve</h3>${bulletText(current.inputs)}<h3>Cosa consegniamo</h3>${bulletText(current.outputs)}<h3>Passi di lavoro</h3><ol>${current.steps.map(step=>`<li>${e(step)}</li>`).join('')}</ol><small>Fonte: ${e(current.source)}</small>`);
   if(id.endsWith('/agents'))return `<div class="card-grid">${current.agents.map(agent=>`<article class="module-card"><h3>${e(agent.name)}</h3>${badge(agent.status)}<footer>${btn('Apri lo Sciame','goto','agents:list','small')}</footer></article>`).join('')||empty('Agente da assegnare','Definiamo prima la procedura e il responsabile.')}</div>`;
   return panel('Listino del servizio',priceListTable(prices.filter(row=>row.service===current.id)),btn('Nuova voce','price-add',current.id,'small','plus'));
  },`catalog:${base}`);
 }
 return title('Servizi. Il piano, passo dopo passo.','Quali servizi offriamo, cosa prepariamo e quali saranno i prossimi.')+sectionNavigator('catalog',[
  {id:'plan',name:'Piano di attivazione',value:`${rows.length} servizi`,icon:'grid'},
  {id:'prices',name:'Listino',value:`${prices.length} voci`,icon:'wallet'}
 ],id=>`<div class="toolbar"><label class="sr-only" for="local-filter">${id==='plan'?'Cerca un servizio':'Cerca nel listino'}</label><input id="local-filter" class="search" placeholder="${id==='plan'?'Cerca un servizio…':'Cerca nome, unità o note…'}" value="${e(S.filter)}">${id==='prices'?btn('Nuova voce','price-add','','primary','plus'):''}</div>`+(id==='prices'?priceListTable(prices.filter(row=>`${row.name} ${row.unit} ${row.notes}`.toLocaleLowerCase('it').includes(filter))):sectionCards(rows.filter(row=>`${row.name} ${row.id} ${row.plan.status}`.toLocaleLowerCase('it').includes(filter)).map(row=>({name:row.name,value:row.plan.status,note:row.plan.target_date?`Obiettivo ${date(row.plan.target_date)}`:'Data obiettivo da decidere',route:`catalog:service/${row.id}`,icon:'book'})))));
}
Object.assign(ACTIONS,{
 'service-plan-edit':id=>{const row=S.module.items.find(item=>item.id===id),p=row.plan;form('Piano · '+row.name,[selectField('status','Stato',['Attivo','In preparazione','Futuro'],p.status),{name:'targetDate',label:'Data obiettivo',type:'date',value:p.target_date||''},{name:'missing',label:'Cosa manca e prossimo passo',type:'textarea',full:true,value:p.missing}],async b=>{await mutate('/api/service-plan/'+id,{...b,version:p.version},'PATCH');await saved('Piano aggiornato');},{intro:'Le date e le priorità sono decise dai soci. Questo salvataggio non attiva automazioni.'});},
 'price-add':service=>form('Nuova voce di listino',[textField('name','Prodotto o servizio'),{name:'priceEuros',label:'Prezzo in euro',type:'number',step:'0.01',min:0,max:1000000,required:true},selectField('unit','Unità',['mese','anno','pezzo','pacchetto','progetto','ora','giorno'],'pezzo'),{name:'effectiveDate',label:'Valido dal',type:'date',value:new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),required:true},selectField('service','Collega al servizio',[['','Nessun servizio specifico'],...S.module.items.map(row=>[row.id,row.name])],service||''),{name:'notes',label:'Note',type:'textarea',full:true}],async(b,fd,requestId)=>{await mutate('/api/service-plan/prices',{name:b.name,priceCents:cents(b.priceEuros),unit:b.unit,effectiveDate:b.effectiveDate,service:b.service,notes:b.notes,requestId});await saved('Voce aggiunta al listino');},{intro:'Una tariffa di riferimento: non genera fatture né movimenti contabili.'})
});


function protectedConnectionsView(){
 const d=S.module||{},items=d.items||[];
 return title('I collegamenti, sotto controllo.','Qui colleghi i servizi esterni che BigAnt OS usa. Nessun collegamento si attiva senza l’ok dei soci.')+(!d.vaultReady?notice('Prima di inserire chiavi, configura l’archivio protetto sul server.'):'')+sectionNavigator('connections',items.map(row=>({id:row.id,name:row.name,value:row.status,note:row.purpose,icon:'link'})),id=>{
  const row=items.find(item=>item.id===id);
  return panel(row.name,`${badge(row.status,row.status==='Errore'?'red':'orange')}<p>${e(row.purpose)}</p><dl class="out-obj"><div><dt>Accessi salvati</dt><dd>${row.id==='wallet'?'Gestiti nelle variabili protette del server':row.configured?'Sì, nell’archivio protetto':'Da inserire'}</dd></div><div><dt>Configurato da</dt><dd>${e(row.configuredBy||'Nessuno')}</dd></div><div><dt>Ultima verifica</dt><dd>${row.lastCheck?date(row.lastCheck,true)+' · controllo locale':'Non ancora eseguita'}</dd></div></dl>${row.checkNote?notice(row.checkNote,row.status==='Errore'):''}<p>${e(row.activationNote)}</p><div class="actions">${row.fields.length&&d.vaultReady?btn(row.configured?'Aggiorna accessi':'Inserisci accessi','connection-save',id,'primary','shield'):''}${row.configured?btn('Controlla configurazione','connection-check',id,'','check'):''}${row.dependsOn?btn('Apri accesso Google','goto','connections:'+row.dependsOn,'','arrow'):''}</div>${row.id==='google'?googleConnectionPanel(row):''}${row.id==='wallet'?btn('Apri Fidelity e Wallet','goto','fidelity:settings','','card'):!row.fields.length&&!row.dependsOn?notice('Procedura di collegamento da completare e collaudare.'):''}`);
 });
}
Object.assign(ACTIONS,{
 'connection-save':id=>{const row=S.module.items.find(item=>item.id===id);form('Accessi · '+row.name,row.fields.map(field=>({name:field.id,label:field.label,type:field.secret?'password':'text',required:!row.configured,full:true,help:row.configured?'Lascia vuoto per conservare il valore già salvato.':''})),async fields=>{await mutate('/api/connections/'+id,{fields,version:row.version});await saved('Accessi salvati e nascosti. Collegamento ancora da collaudare.');},{intro:'Le chiavi saranno cifrate. Dopo il salvataggio non verranno mostrate. Nessun servizio viene attivato.'});},
 'connection-check':async id=>{await mutate('/api/connections/'+id+'/check');await saved('Controllo locale completato; consulta l’esito nella scheda.');}
});


function fidelitySectionsView(){
 const f=S.module,manager=role()!=='collaborator',filter=S.filter.toLocaleLowerCase('it');
 const items=[{id:'programs',name:'Programmi',value:f.metrics.programs,icon:'card'},
  {id:'members',name:'Iscritti e tessere',value:f.metrics.members,icon:'users'},
  {id:'transactions',name:'Timbri e punti',value:`${f.metrics.redemptions} premi riscattati`,icon:'star'},
  ...(manager?[{id:'campaigns',name:'Campagne',value:f.campaigns.length,icon:'mail'},{id:'returns',name:'Ritorno clienti',value:f.automations.length,icon:'growth'},
  {id:'jobs',name:'Attività Fidelity',value:f.jobs.length,icon:'clock'},{id:'settings',name:'Regolamento e Wallet',value:'Configurazione',icon:'shield'}]:[])];
 return title('Un buon motivo per tornare.','Programmi fedeltà, iscritti e premi dell’attività selezionata.',btn('Cerca tessera','scan','','primary','search'))+sectionNavigator('fidelity',items,id=>{
  if(id==='programs')return `<div class="toolbar">${manager?btn('Nuovo programma','new-program','','primary','plus'):''}</div><div class="card-grid">${f.programs.map(p=>`<article class="module-card"><div class="fidelity-card"><div class="label">${e(label(p.type))}</div><h2>${e(p.name)}</h2><p>${e(p.rewardName)}</p><small>Premio a ${p.rewardThreshold} · ${p.memberCount} iscritti</small></div><footer>${btn('Apri programma','program',p.id,'small')}</footer></article>`).join('')||empty('Il primo programma parte da qui','Scegli timbri, punti o un coupon monouso.')}</div>`;
  if(id==='members')return `<div class="toolbar"><label class="sr-only" for="local-filter">Cerca un iscritto</label><input id="local-filter" class="search" placeholder="Cerca nome, email o programma…" value="${e(S.filter)}">${manager?btn('Nuovo iscritto','new-member','','primary','plus')+btn('Esporta','export-members','','','file'):''}</div>`+table(['Iscritto','Programma','Saldo','Marketing',''],f.members.filter(row=>`${row.name} ${row.email} ${row.programName}`.toLocaleLowerCase('it').includes(filter)).map(row=>[`<strong>${e(row.name)}</strong><small>${e(row.email)}</small>`,e(row.programName),`${row.balance}<small>${row.availableRewards} premi disponibili</small>`,badge(row.marketingConsent?'Consenso presente':'Non autorizzato'),`<div class="actions">${btn('Tessera','member',row.id,'small')}${btn('Movimento','member-transaction',row.id,'small')}</div>`]));
  if(id==='transactions')return panel('Registro timbri e punti',table(['Quando','Iscritto','Operazione','Quantità','Saldo',''],f.transactions.map(row=>[date(row.createdAt,true),e(row.memberName),e(label(row.type)),`${row.amount>0?'+':''}${row.amount}`,row.balanceAfter,manager&&row.type!=='reversal'&&!row.reversed?btn('Storna','reverse',row.id,'small'):''])));
  if(id==='campaigns')return panel('Campagne',list(f.campaigns,row=>`<div class="list-item"><div class="body"><b>${e(row.name)}</b><p>${e(row.title)} · ${row.recipientCount} destinatari</p>${badge(row.status)}</div>${btn('Apri','campaign',row.id,'small')}</div>`),btn('Nuova bozza','new-campaign','','small','plus'))+notice('Le campagne richiedono l’approvazione di un socio. I Wallet devono essere collegati prima di ogni invio.');
  if(id==='returns')return panel('Ritorno clienti',list(f.automations,row=>`<div class="list-item"><div class="body"><b>${e(row.name)}</b><p>Dopo ${row.inactiveDays} giorni · ${row.active?'Preparazione abilitata':'In pausa'}</p></div><div class="actions">${btn('Prepara','run-fidelity-auto',row.id,'small')}${btn(row.active?'Pausa':'Abilita preparazione','toggle-fidelity-auto',row.id,'small ghost')}</div></div>`),btn('Nuova regola','new-fidelity-auto','','small','plus'))+notice('Queste regole preparano bozze. Non inviano notifiche.');
  if(id==='jobs')return productJobsPanel();
  const c=S.overview.currentClient;
  return panel('Regolamento e privacy',`<p class="preserve">${e(c.terms_text||'Regolamento da compilare')}</p><p>Informativa: ${e(c.privacy_url||'Da indicare')}</p>`,btn('Modifica documenti','fidelity-policies','','small'))+fidelityWalletPanel(f);
 });
}
Object.assign(ACTIONS,{
 'member-anonymize':id=>{const member=S.module.members.find(row=>row.id===id);form('Anonimizza e revoca la tessera',[{html:`<p>Rimuovi i dati personali di <strong>${e(member.name)}</strong> e revochi subito il link della tessera. Il registro dei movimenti resta senza i contatti.</p>`},{name:'confirmation',label:'Scrivi ANONIMIZZA per confermare',required:true}],async b=>{if(b.confirmation!=='ANONIMIZZA')throw Error('Scrivi ANONIMIZZA per confermare.');await mutate('/api/fidelity/members/'+id,{},'DELETE');await saved('Dati personali rimossi e tessera revocata.');},{intro:'Operazione irreversibile sui dati personali. Gli aggiornamenti Wallet remoti richiedono il collegamento del fornitore.',submit:'Anonimizza e revoca'});}
});

function billingTrackerTable(rows){
 const a=S.module,party=id=>a.counterparties.find(row=>row.id===id)?.name||'—',entity=id=>a.entities.find(row=>row.id===id)?.name||'—';
 return table(['Cliente / lavoro','Importo','Incassato / residuo','Metodo','Scadenza','Ditta / fattura',''],rows.map(row=>[
  `<strong>${e(party(row.counterparty_id))}</strong><small>${e(row.description)}</small>`,money(row.amount_cents),
  `${money(row.amount_cents-row.remaining_cents)}<small>${row.paid?'Saldato':`Residuo ${money(row.remaining_cents)}`}</small>`,e(row.methods.map(label).join(', ')||'Da registrare'),date(row.due_date),
  `${e(entity(row.entity_id))}<small>${row.issuedRef?'Fatturato · '+e(row.issuedRef):'Da fatturare'}</small>`,btn('Aggiorna','billing-label',row.id,'small')
 ]));
}
function billingView(){
 const a=S.module,b=a.billing,party=id=>a.counterparties.find(row=>row.id===id)?.name||'—',entity=id=>a.entities.find(row=>row.id===id)?.name||'—';
 const heading=title('Fatturazione.','Incassi, lavori da fatturare e costi, riservati ai soci.')+notice('Il registro ufficiale è Trello · Fatturazione. Questa vista contiene le registrazioni locali di prova; il collegamento a Trello è da completare. Le fatture vengono emesse con Aruba.')+`<div class="stats">${stat('Incassi del mese',money(a.summary.income_month_cents),'Dai movimenti registrati','wallet')}${stat('Arretrati',money(a.summary.arrears_cents),'Residuo oltre la scadenza','clock',true)}</div>`;
 if(!a.entities.length)return heading+empty('Fonte contabile da collegare','Il registro ufficiale resta Trello. Nessuna ditta o registrazione contabile reale è stata importata.','link');
 if(S.section==='costs'||S.section.startsWith('costs/'))return heading+`<div class="actions section">${btn('Fatturazione','goto','administration:sections','','arrow')}</div>`+sectionNavigator('administration',[
  {id:'costs/subscriptions',name:'Costi e abbonamenti',value:a.subscriptions.length,icon:'wallet'},
  {id:'costs/compensations',name:'Compensi collaboratori',value:b.compensations.length,icon:'users'},
  {id:'costs/parties',name:'Anagrafiche',value:'Fornitori, collaboratori e ditte',icon:'book'}
 ],id=>{
  if(id==='costs/parties')return panel('Anagrafiche',table(['Nome','Tipo'],a.counterparties.map(row=>[e(row.name),e(label(row.kind))])),btn('Nuova anagrafica','new-party','','small','plus'))+panel('Ditte',table(['Ditta'],a.entities.map(row=>[e(row.name)])));
  if(id==='costs/subscriptions')return panel('Costi e abbonamenti',`<div class="stats">${stat('Costi registrati nel mese',money(a.summary.expenses_month_cents),'Pagamenti presenti nella Prima nota')}</div>`+table(['Strumento o servizio','Fornitore','Costo','Rinnovo','Ditta'],a.subscriptions.map(row=>[e(row.name),e(party(row.counterparty_id)),`${money(row.amount_cents)} / ${row.interval_months===12?'anno':'mese'}`,date(row.next_due),e(entity(row.entity_id))])),btn('Nuovo abbonamento','new-subscription','','small','plus'));
  return panel('Compensi collaboratori',(b.compensations.some(row=>!row.period)?notice('I compensi senza mese di lavoro restano visibili, ma sono esclusi dai totali mensili.'): '')+`<div class="stats">${stat('Compensi del mese',money(b.compensationTotalCents),'Mese di lavoro '+a.asOf.slice(0,7))}${stat('Ancora da pagare',money(b.compensationRemainingCents),'Compensi del mese non saldati')}</div>`+table(['Persona','Mese di lavoro','Lavoro','Importo','Pagamento',''],b.compensations.map(row=>[e(party(row.counterparty_id)),e(row.period||'Da definire'),e(row.title),money(row.amount_cents),row.paid?'Pagato':`${money(row.remaining_cents)} da pagare`,row.paid?'':btn('Registra pagamento','compensation-pay',row.id,'small')])),btn('Nuovo compenso','compensation-add','','small','plus'));
 },'administration:costs');
 return heading+sectionNavigator('administration',[
  {id:'invoices',name:'Da fatturare',value:money(a.summary.draft_invoice_cents),icon:'file'},
  {id:'ledger',name:'Prima nota',value:'Movimenti e cassa 30/60/90',icon:'wallet'},
  {id:'tracker',name:'Tracker incassi',value:`${b.tracker.length} ${b.tracker.length===1?'lavorazione':'lavorazioni'}`,note:b.customerBalances.length?b.customerBalances.slice(0,3).map(row=>`${row.name}: ${money(row.remainingCents)} da incassare`).join(' · '):'Nessun saldo cliente aperto',icon:'chart'},
  {id:'costs',name:'Costi e abbonamenti',value:'Strumenti e compensi',note:b.dueSubscriptions.length?b.dueSubscriptions.slice(0,3).map(row=>`${row.name}: ${date(row.next_due)}`).join(' · '):'Nessun rinnovo nei prossimi 30 giorni',icon:'users'}
 ],id=>{
  if(id==='invoices')return panel('Da fatturare',billingTrackerTable(b.tracker.filter(row=>row.status==='draft')),btn('Aggiungi lavoro da fatturare','new-invoice','','small','plus'));
  if(id==='ledger')return panel('Prima nota',`<div class="stats">${a.projections.map(row=>stat(`Cassa a ${row.days} giorni`,money(row.projected_cents),`Entrate attese ${money(row.expected_income_cents)} · uscite ${money(row.expected_expense_cents)}`)).join('')}</div>`+notice(a.projections[0]?.assumption||'Previsione dalle scadenze registrate.')+table(['Data','Causale','Ditta / conto','Controparte','Importo',''],a.movements.map(row=>[date(row.date),`<strong>${e(row.category)}</strong><small>${e(row.document_ref||'Documento da collegare')}</small>`,`${e(entity(row.entity_id))}<small>${e(a.accounts.find(item=>item.id===row.account_id)?.name||'')}</small>`,e(party(row.counterparty_id)),`${row.direction==='in'?'+':'−'}${money(row.amount_cents)}`,(a.reversals||[]).some(item=>item.original_id===row.id||item.reversal_id===row.id)?badge('Storno collegato'):`<div class="actions">${btn('Storna','admin-reverse',row.id,'small')}${row.kind!=='transfer'?btn('Rettifica','admin-correct',row.id,'small'):''}</div>`])),btn('Registra movimento','new-movement','','small','plus'));
  const category=S.billingCategory||'all';
  const controls=`<div class="toolbar"><label for="billing-category">Tipo di lavoro</label><select id="billing-category"><option value="all">Tutte le categorie</option>${b.categories.map(row=>`<option value="${e(row.id)}" ${category===row.id?'selected':''}>${e(row.name)}</option>`).join('')}</select></div>`;
  const withdrawals=table(['Prelievo','Ditta','Data','Metodo','Importo'],a.movements.filter(row=>row.kind==='withdrawal').map(row=>[e(row.category),e(entity(row.entity_id)),date(row.date),e(label(row.method)),`${row.direction==='out'?'':'−'}${money(row.amount_cents)}`]));
  return panel('Tracker incassi',controls+(category==='withdrawals'?withdrawals:billingTrackerTable(b.tracker.filter(row=>category==='all'||row.category===category)))+(category==='all'?`<h3>Prelievi</h3>${withdrawals}`:''))+panel('Totale incassato per cliente',table(['Cliente','Incassato fino al '+date(a.asOf)],b.incomeByClient.map(row=>[e(row.client_id?clientName(row.client_id):'Cliente non collegato'),money(row.cents)])));
 });
}
document.addEventListener('change',event=>{if(event.target.id==='billing-category'){S.billingCategory=event.target.value;render();}});
Object.assign(ACTIONS,{
 'billing-label':id=>{const row=S.module.billing.tracker.find(item=>item.id===id);form('Tracker · '+row.description,[textField('description','Lavoro o canone',row.description,true),selectField('category','Categoria',S.module.billing.categories.filter(item=>item.id!=='withdrawals').map(item=>[item.id,item.name]),row.category),{name:'issuedRef',label:'Riferimento della fattura già emessa in Aruba (facoltativo)',value:row.issuedRef,full:true}],async b=>{await mutate('/api/billing/tracker/'+id,{...b,version:row.labelVersion},'PATCH');await saved('Tracker aggiornato; nessuna fattura emessa.');},{intro:'Indica il riferimento soltanto dopo l’emissione in Aruba. Lascia vuoto per mantenere Da fatturare.'});},
 'compensation-add':()=>form('Compenso collaboratore',[entityField(),partyField('collaborator'),{name:'period',label:'Mese di lavoro',type:'month',value:S.module.asOf.slice(0,7),required:true},textField('title','Lavoro svolto','',true),numberField('amountEuros','Importo in euro','',.01,'.01'),dayField('dueDate','Da pagare entro'),{name:'documentRef',label:'Accordo o documento'}],async(b,fd,key)=>{const {amountEuros,...rest}=b;await financialSave('obligations',{...rest,kind:'collaborator',amountCents:cents(amountEuros)},key);},{intro:'Il compenso entra nei costi del mese di lavoro. Risulta pagato solo quando registri il relativo movimento.'}),
 'compensation-pay':id=>{const a=S.module,row=a.billing.compensations.find(item=>item.id===id);form('Registra il pagamento del compenso',[selectField('accountId','Conto della ditta',options(a.accounts.filter(account=>account.entity_id===row.entity_id))),dayField('date','Data del pagamento'),numberField('amountEuros','Importo pagato in euro',row.remaining_cents/100,.01,'.01'),selectField('method','Metodo',[['bank','Bonifico'],['cash','Contanti'],['card','Carta']]),{name:'documentRef',label:'Ricevuta o riferimento'},textField('note','Nota','Pagamento compenso',true)],async(b,fd,key)=>{const {amountEuros,...rest}=b;await financialSave('movements',{...rest,entityId:row.entity_id,counterpartyId:row.counterparty_id,clientId:row.client_id,obligationId:id,direction:'out',kind:'expense',category:'Compensi collaboratori',amountCents:cents(amountEuros),sourceRef:'compenso-'+key},key);},{intro:'Registra un pagamento già avvenuto nei dati di prova. Questa azione non invia denaro.'});}
});

function growthSectionsView(){
 const g=S.module,leads=g.leads.filter(row=>`${row.company} ${row.email} ${label(row.stage)}`.toLocaleLowerCase('it').includes(S.filter.toLocaleLowerCase('it')));
 return title('Le prossime relazioni di BigAnt.','Dalla ricerca alla chiamata, un passaggio alla volta.')+notice(g.simulation?'Prova con attività inventate. Ricerca, analisi, email e calendario non sono ancora collegati.':g.runtime.note+' '+(g.mail?.enabled?'Gmail disponibile per invii manuali approvati.':'Gmail da autorizzare, collaudare e attivare.')+' '+(g.calendar?.enabled?'Calendar disponibile per gli inviti autorizzati singolarmente.':'Calendar da autorizzare, collaudare e attivare.'))+sectionNavigator('growth',[
  {id:'research',name:'Ricerca aziende',value:g.settings.paused?'In pausa':g.simulation?'Prova abilitata':g.runtime.phases.research.enabled?'Pronta':'Da attivare',icon:'search'},
  {id:'companies',name:'Aziende e trattative',value:g.leads.length,note:`Qualificate: ${g.leads.filter(row=>row.stage==='qualified').length}`,icon:'growth'},
  {id:'messages',name:'Bozze e conversazioni',value:g.messages.filter(row=>row.status==='draft').length,note:'Bozze da rivedere',icon:'mail'},
  {id:'meetings',name:'Appuntamenti',value:g.meetings.length,icon:'calendar'},
  {id:'jobs',name:'Attività Growth',value:g.jobs.length,icon:'clock'},
  {id:'settings',name:'Impostazioni e budget',value:'Zona, offerta e limiti',icon:'grid'},
  {id:'connections',name:'Attivazione',value:g.simulation?'Da collegare':(Object.values(g.runtime.phases).filter(p=>p.enabled).length+(g.mail?.enabled?1:0)+(g.calendar?.enabled?1:0))+' di 5 fasi attive',icon:'link'}
 ],id=>{
  if(id==='research')return panel('Ricerca aziende',`<p>${g.simulation?'La prova restituisce siti inventati .example e mette in coda le analisi.':'Ricerche manuali con fonte e data. L’analisi viene accodata soltanto quando la relativa fase è attiva.'}</p><form id="research-form" class="inline-form"><label class="sr-only" for="research-query">Cosa cerchiamo?</label><input id="research-query" name="query" class="search" placeholder="Es. imprese di servizi a Caserta" value="${e([g.settings.sector,g.settings.region].filter(Boolean).join(' '))}" required><button class="btn primary" type="submit" ${!g.simulation&&(!g.runtime.phases.research.enabled||g.settings.paused)?'disabled':''}>${icon('search')}${g.simulation?'Cerca nella demo':'Cerca aziende'}</button></form><div class="actions section">${btn('Apri le aziende','goto','growth:companies','','growth')}${btn('Esegui un’attività','growth-run','','','play')}${btn(g.settings.paused?(g.simulation?'Abilita prova':'Riprendi attività'):'Metti in pausa','growth-pause','','',g.settings.paused?'play':'pause')}</div>`);
  if(id==='companies')return `<div class="toolbar"><input id="local-filter" class="search" placeholder="Cerca azienda, email o fase…" aria-label="Cerca aziende" value="${e(S.filter)}">${btn('Aggiungi azienda','new-lead','','primary','plus')}${btn('Importa CSV','import-leads','','small')}${btn('Esporta CSV','export-leads','','small')}</div>`+panel('Aziende e trattative',table(['Azienda','Fase','Pertinenza','Contatto',''],leads.map(row=>[
   `<button class="link-button" data-action="lead" data-id="${e(row.id)}">${e(row.company)}</button><small>${e(row.city||row.sector)}</small>`,badge(row.stage),row.analysis?`${row.score}/100`:'Da analizzare',
   `${e(row.email||'Email da aggiungere')}<small>${row.suppressed?'Contatto interrotto':row.consent==='marketing'?'Consenso marketing registrato':row.consent==='request'?'Richiesta di risposta':'Autorizzazione da verificare'}</small>`,
   `<div class="actions">${g.simulation||g.runtime.phases.analysis.enabled?btn('Analizza','analyze-lead',row.id,'small'):''}${g.simulation||g.runtime.phases.drafts.enabled?btn('Bozza','draft-lead',row.id,'small'):''}</div>`
  ])));
  if(id==='messages')return growthMessagesPanel(g);
  if(id==='meetings')return growthCalendarMeetings(g);
  if(id==='jobs')return panel('Attività Growth',table(['Attività','Quando','Stato','Esito',''],g.jobs.map(row=>[
   e(({research:'Ricerca',analyze:'Analisi',draft:'Bozza',sync:'Conversazioni',reconcile:'Verifica messaggio',reconcileMeeting:'Verifica appuntamento'})[row.type]||row.type),date(row.created,true),badge(row.status),`<span class="table-text">${e(row.error||'—')}</span>`,row.status==='failed'?btn('Riprova','retry-growth',row.id,'small'):''
  ])),btn('Esegui prossima','growth-run','','small','play'));
  if(id==='settings')return panel('Impostazioni e budget',`<dl class="out-obj"><div><dt>Zona</dt><dd>${e(g.settings.region||'Da definire')}</dd></div><div><dt>Settore</dt><dd>${e(g.settings.sector||'Tutti i settori previsti dall’offerta')}</dd></div><div><dt>Offerta</dt><dd>${e(g.settings.offer)}</dd></div><div><dt>Risultati per ricerca</dt><dd>${g.settings.researchLimit}</dd></div><div><dt>Fuso orario</dt><dd>Europe/Rome</dd></div></dl><div class="stats">${stat('Budget disponibile comune',money(g.budget.available),'Condiviso con tutti gli agenti')}${g.simulation?stat('Costo simulazioni Growth',money(g.budget.simulatedCostCents),'Nessuna chiamata a pagamento'):stat('Stime Growth registrate',money(g.costs.filter(row=>row.status!=='released').reduce((sum,row)=>sum+row.cents,0)),'Totale storico stimato, non fatture del fornitore')}</div><div class="actions">${btn('Modifica impostazioni','growth-settings','','primary')}${btn('Budget dello Sciame','goto','agents:budget','','wallet')}</div>`);
  if(!g.simulation)return growthRuntimeView(g);
  return panel('Attivazione per fasi',`<ol class="structure-list"><li>Ricerca e lettura siti: Brave e pagine pubbliche.</li><li>Analisi e bozze: OpenAI o Anthropic, con modello e tetto di spesa scelti dai soci.</li><li>Revisione della bozza e approvazione del socio.</li><li>Gmail: invio manuale, dopo il collaudo.</li><li>Calendar: disponibilità e appuntamenti, dopo il collaudo.</li></ol>${notice('I fornitori restano scollegati. Il salvataggio delle chiavi non avvia ricerche, invii o appuntamenti.')}${btn('Apri Collegamenti','goto','connections','','link')}`);
 });
}


function growthMessageBadge(message,simulation){return badge(!simulation&&message.status==='received'?'Da leggere':message.status);}
function growthMessagesPanel(g){
 const c=g.conversations,r=c?.result;
 const summary=r?`${r.received} nuove risposte · ${r.checked} conversazioni verificate · ${r.skipped} messaggi già acquisiti o esclusi`:'Nessuna lettura eseguita.';
 const sync=c?panel('Risposte Gmail',`<p>Legge soltanto le conversazioni avviate da BigAnt OS. Nessuna risposta o analisi AI parte da sola.</p><p><b>${e(summary)}</b></p>${r?.errors||r?.review||r?.interrupted?notice(`Conversazioni non aggiornate: ${r.errors||0}. Messaggi da controllare in Gmail: ${r.review||0}.${r.interrupted?' Lettura interrotta: alcuni risultati possono essere incompleti.':''}`,true):''}<p class="muted">${c.lastAttempt?'Ultima richiesta: '+date(c.lastAttempt,true):''}${c.eligibleThreads>c.batchLimit?` · Fino a ${c.batchLimit} conversazioni per volta, partendo dalle meno recentemente verificate.`:''}</p><div class="actions">${c.canSync&&!c.running&&c.eligibleThreads?btn('Aggiorna risposte','growth-mail-sync','','primary','mail'):''}${btn('Collegamento Gmail','goto','growth:connections','','link')}</div>${!c.canSync?notice(c.reason||'Casella da autorizzare.'):!c.eligibleThreads?notice('Non ci sono conversazioni inviate da questa casella tramite BigAnt OS da aggiornare.'):c.running?notice('Lettura in corso…'):''}`):'';
 return sync+panel('Bozze e conversazioni',list(g.messages,row=>`<div class="list-item"><div class="body"><b>${e(row.subject)}</b><p>${e(row.company)} · ${row.direction==='in'?(g.simulation?'Risposta DEMO':'Risposta ricevuta'):'Messaggio commerciale'}</p>${growthMessageBadge(row,g.simulation)}${row.error?`<small>${e(row.error)}</small>`:''}</div>${btn('Apri','message',row.id,'small')}</div>`))+notice('L’approvazione di messaggi Growth è riservata ai soci. Ogni modifica richiede una nuova approvazione.');
}
const growthPhaseNames={research:'Ricerca e lettura siti',analysis:'Analisi delle aziende',drafts:'Bozze da approvare'};
function growthRuntimeView(g){
 const r=g.runtime,phases=Object.keys(growthPhaseNames);
 return panel('Prepara i collegamenti',`<dl class="out-obj"><div><dt>Fornitore AI</dt><dd>${e(r.provider?({openai:'OpenAI',anthropic:'Anthropic'})[r.provider]:'Scelta rinviata')}</dd></div><div><dt>Stima per ricerca</dt><dd>${money(r.searchCents)}</dd></div><div><dt>Stima per chiamata AI</dt><dd>${money(r.aiCents)}</dd></div></dl><div class="actions">${btn('Configura Growth','growth-runtime-config','','primary')}${btn('Accessi dei fornitori','goto','connections','','link')}</div>`,'','Salvare una configurazione non attiva alcuna operazione.')+
 panel('Collauda e attiva una fase alla volta',list(phases,(id)=>{
  const phase=r.phases[id],previous=phases.slice(0,phases.indexOf(id)),canCheck=r.available&&previous.every(key=>r.phases[key].checked),canActivate=canCheck&&phase.checked&&previous.every(key=>r.phases[key].enabled);
  return `<div class="list-item"><div class="body"><b>${e(growthPhaseNames[id])}</b><p>${phase.lastCheck?'Ultimo collaudo: '+date(phase.lastCheck,true):'Da collaudare'}</p>${badge(phase.enabled?'Attiva':phase.checked?'Collaudata':'Da collaudare',phase.enabled?'green':'')}</div><div class="actions">${canCheck?btn('Collauda','growth-runtime-check',id,'small'):''}${phase.enabled?btn('Sospendi','growth-runtime-disable',id,'small'):canActivate?btn('Attiva fase','growth-runtime-enable',id,'small'):''}</div></div>`;
 })) + notice('Ogni collaudo usa il fornitore e impegna la stima nel budget comune. Ripeterlo sospende questa fase e le successive. Le attività si eseguono manualmente. Calendar segue un collaudo separato.')+growthMailPanel(g)+growthCalendarPanel(g);
}
function growthProbePreview(p){const r=p.result;return `<p><b>${e(p.company||'Fonte della prova')}</b></p><p class="preserve">${e(p.source)} · ${date(p.sourceDate,true)}</p>${r?`<h3>${e(r.subject||'Analisi')}</h3><p class="preserve">${e(r.body||r.summary)}</p>${r.score!==undefined?`<p>Pertinenza: ${r.score}/100 · ${e(r.service)}</p>`:''}<p>${e(r.reason)}</p>`:''}`;}
function growthSources(leadId){
 const rows=(S.module.sources||[]).filter(row=>row.lead_id===leadId);
 if(!rows.length)return '';
 return `<h3>Fonti consultate</h3>`+list(rows,row=>`<div class="list-item"><div class="body"><a href="${e(row.url)}" target="_blank" rel="noopener noreferrer">${e(row.url)}</a><p>${row.kind==='search'?'Ricerca':'Sito pubblico'} · ${date(row.retrieved_at,true)}</p></div></div>`);
}
Object.assign(ACTIONS,{
 'growth-runtime-config':()=>{const r=S.module.runtime;form('Configura Growth',[{...selectField('provider','Fornitore AI',[['','Scelta rinviata'],['openai','OpenAI'],['anthropic','Anthropic']],r.provider||''),required:false},numberField('searchCents','Stima per ricerca · centesimi',r.searchCents,0,'1'),numberField('aiCents','Stima per chiamata AI · centesimi',r.aiCents,0,'1')],async b=>{await mutate('/api/growth/runtime/config',{version:r.version,provider:b.provider,searchCents:Number(b.searchCents),aiCents:Number(b.aiCents)});await saved('Configurazione salvata. Le fasi richiedono un nuovo collaudo.');},{intro:'Puoi lasciare la scelta AI in sospeso. Le stime impegnano il budget comune, ma non garantiscono il costo fatturato dal fornitore. Un valore zero mantiene la fase bloccata.'});},
 'growth-runtime-check':phase=>{const r=S.module.runtime;form('Collauda: '+growthPhaseNames[phase],phase==='research'?[textField('query','Ricerca di prova',[S.module.settings.sector,S.module.settings.region].filter(Boolean).join(' '),true)]:[],async b=>{const result=await mutate('/api/growth/runtime/check',{...b,phase,version:r.version});await saved('Collaudo completato. Puoi attivare la fase.');dialog('Esito del collaudo',growthProbePreview(result.preview));},{submit:'Esegui collaudo',intro:'Questa prova chiama il fornitore. Stima impegnata: '+money(phase==='research'?r.searchCents:r.aiCents)+'. Il risultato resta da verificare dal socio. Ripetere il collaudo sospende questa fase e le successive.'});},
 'growth-runtime-enable':async phase=>{await mutate('/api/growth/runtime/activate',{phase,enabled:true,version:S.module.runtime.version});toast('Fase attivata per le esecuzioni manuali');await load();},
 'growth-runtime-disable':async phase=>{await mutate('/api/growth/runtime/activate',{phase,enabled:false,version:S.module.runtime.version});toast('Fase e passaggi successivi sospesi');await load();}
});
const demoGrowthSettings=ACTIONS['growth-settings'];
ACTIONS['growth-settings']=()=>{if(S.module.simulation)return demoGrowthSettings();const g=S.module.settings;form('Impostazioni Growth',[textField('region','Zona',g.region),textField('sector','Settore',g.sector),textField('senderName','Nome mittente',g.senderName),{name:'senderEmail',label:'Casella mittente Google',type:'email',value:g.senderEmail,full:true},{...numberField('dailyLimit','Massimo invii al giorno',g.dailyLimit,0,'1'),max:50},areaField('description','Presentazione dell’agenzia',g.description),areaField('offer','Offerta da proporre',g.offer),areaField('signature','Firma delle bozze',g.signature),{...numberField('researchLimit','Risultati per ricerca',g.researchLimit,1,'1'),max:10},{name:'autoDraft',label:'Accoda una bozza dopo l’analisi, quando la fase è attiva',type:'checkbox',value:g.autoDraft}],async(b,fd)=>{await mutate('/api/growth/settings',{...b,researchLimit:Number(b.researchLimit),dailyLimit:Number(b.dailyLimit),autoDraft:fd.has('autoDraft')});await saved('Impostazioni Growth salvate');},{intro:'Le attività accodate si avviano manualmente. Ogni bozza richiede l’approvazione di un socio. Budget comune nello Sciame. Il calendario si configura separatamente in Attivazione.',extra:btn('Configura Calendar in Attivazione','goto','growth:connections','','calendar')});};


function googleConnectionPanel(row){const a=row.authorization;return `<h3>Casella per Growth</h3>${notice(a?.note||'Autorizzazione Google disponibile soltanto in modalità reale, dopo l’abilitazione sul server.')}<p>${a?.connected?`Casella autorizzata: <b>${e(a.email)}</b>`:'Casella non autorizzata'}</p>${a?.calendarAvailable?`<p>${a.calendarConnected?'Calendar autorizzato. Prova e attivazione si completano in Growth.':'Calendar non autorizzato. Puoi includerlo nel nuovo consenso Google.'}</p>`:''}${a?.lastCheck?`<p>Ultimo collegamento verificato: ${date(a.lastCheck,true)}</p>`:''}${a?.available&&row.configured?btn(a.connected?'Autorizza di nuovo la casella':'Autorizza casella Google','google-oauth-start','','primary','link'):''}`;}
ACTIONS['google-oauth-start']=()=>{
 const row=S.module.items.find(item=>item.id==='google');if(!row?.configured||!row.authorization?.available)throw Error('Accesso Google non disponibile. Aggiorna i collegamenti.');
 const calendarAvailable=row.authorization.calendarAvailable===true;
 form('Autorizza la casella Google',[{name:'email',label:'Casella da autorizzare',type:'email',required:true,value:row.authorization.email||'',full:true},{name:'acknowledged',label:'Autorizzo l’app a leggere la casella e inviare i messaggi Growth che approverò e invierò manualmente',type:'checkbox'},...(calendarAvailable?[{name:'calendar',label:'Includi Calendar: leggi la disponibilità e crea gli appuntamenti approvati nei calendari di proprietà di questa casella',type:'checkbox',value:false}]:[])],async(b,fd)=>{
  if(!fd.has('acknowledged'))throw Error('Conferma i permessi per proseguire.');
  const result=await mutate('/api/connections/google/oauth/start',{email:b.email,acknowledged:true,calendar:calendarAvailable&&fd.has('calendar'),version:row.version});const url=new URL(result.url);if(url.origin!=='https://accounts.google.com'||url.pathname!=='/o/oauth2/v2/auth')throw Error('Indirizzo Google non valido.');location.assign(url.href);
 },{submit:'Continua su Google',intro:'Google chiederà accesso di lettura e invio alla casella. Una nuova autorizzazione sospende quella precedente e richiede nuovi collaudi. '+(calendarAvailable?'Calendar si aggiunge soltanto se lo selezioni. Autorizzarlo non crea eventi né inviti.':'Calendar rimane escluso.')});
};

function growthMailPanel(g){const m=g.mail;if(!m)return '';const canCheck=m.available&&m.configured&&g.runtime.phases.drafts.enabled&&!g.settings.paused;return panel('Gmail · invio manuale',`${badge(m.enabled?'Attivo':m.checked?'Collaudato':'Da attivare',m.enabled?'green':'')}<p>${e(m.note)}</p><dl class="out-obj"><div><dt>Casella autorizzata</dt><dd>${e(m.configured?m.email:'Da collegare')}</dd></div><div><dt>Mittente impostato</dt><dd>${e(g.settings.senderEmail||'Da indicare nelle impostazioni')}</dd></div><div><dt>Ultimo collaudo</dt><dd>${m.lastCheck?date(m.lastCheck,true):'Non eseguito'}</dd></div></dl><div class="actions">${btn('Accesso Google','goto','connections:google','','link')}${btn('Imposta mittente e limite','goto','growth:settings')}${canCheck?btn('Collauda la casella','growth-mail-check','','','check'):''}${m.enabled?btn('Sospendi Gmail','growth-mail-disable'):m.checked&&canCheck?btn('Attiva invio manuale','growth-mail-enable','','primary'):''}</div>`,'','Ogni invio richiede una versione approvata, un consenso valido e una conferma finale. Gli esiti incerti si verificano senza reinvio.');}

function calendarStatus(status){return ({preparing:'Preparazione',dispatching:'Invio in corso',booked:'Registrato in Google',safe_failed:'Non creato',uncertain:'Da verificare',cancelling:'Annullamento in corso',cancel_uncertain:'Annullamento da verificare',cancelled:'Annullato'})[status]||'Stato da verificare';}
function calendarDialogSnapshot(){return {open:$('#dialog').open,html:$('#dialog-content').innerHTML};}
function calendarDialogUnchanged(snapshot){return snapshot.open===$('#dialog').open&&snapshot.html===$('#dialog-content').innerHTML;}
function growthCalendarPanel(g){
 const c=g.calendar;if(!c)return panel('Calendar',notice('Calendario non disponibile in questa installazione.'));
 const canCheck=c.available&&c.configured&&!g.settings.paused,canProbe=canCheck&&c.checked&&!c.probe?.verified,canActivate=canCheck&&c.checked&&c.probe?.verified;
 return panel('Calendar · appuntamenti autorizzati',`${badge(c.enabled?'Attivo':c.probe?.verified?'Prova verificata':c.checked?'Disponibilità verificata':'Da configurare',c.enabled?'green':'')}<p>${e(c.note||'Nessun appuntamento si crea senza una conferma.')}</p><dl class="out-obj"><div><dt>Casella autorizzata</dt><dd>${e(c.email||'Da autorizzare')}</dd></div><div><dt>Calendario</dt><dd>${e(c.calendarId||'Da scegliere')}</dd></div><div><dt>Orari</dt><dd>${e(c.startHour)}–${e(c.endHour)} · lunedì–venerdì · Roma</dd></div><div><dt>Durata</dt><dd>${e(c.meetingMinutes)} minuti</dd></div><div><dt>Ultima lettura disponibilità</dt><dd>${c.lastCheck?e(calendarDate(c.lastCheck)):'Non eseguita'}</dd></div></dl>${c.probe?`<p>Invito di prova: ${e(calendarStatus(c.probe.status))} · ${c.probe.verified?'ricezione confermata dal socio':'ricezione da confermare'}</p>`:''}<div class="actions">${btn('Autorizzazione Google','goto','connections:google','','link')}${c.available?btn('Configura calendario','growth-calendar-config','','','calendar'):''}${canCheck?btn('Verifica disponibilità','growth-calendar-check'):''}${canProbe&&(!c.probe||['safe_failed','cancelled'].includes(c.probe.status))?btn('Prepara invito di prova','growth-calendar-probe-preview'):''}${canProbe&&c.probe?.status==='booked'&&!c.probe.verified?btn('Verifica ricezione della prova','growth-calendar-probe-verify'):''}${c.enabled?btn('Sospendi Calendar','growth-calendar-disable'):canActivate?btn('Attiva prenotazioni','growth-calendar-enable','','primary'):''}${c.probe&&['uncertain','cancel_uncertain','dispatching','cancelling'].includes(c.probe.status)?btn('Controlla la prova','goto','growth:meetings'):''}</div>`,'','Prima si legge la disponibilità, poi si conferma un invito di prova. Ogni contatto avrà un link autorizzato singolarmente; nessun invito viene spedito alla creazione del link.');
}
function growthCalendarMeetings(g){
 if(g.simulation)return panel('Appuntamenti',list(g.meetings,row=>`<div class="list-item"><div class="body"><b>${e(row.company)}</b><p>${e(calendarDate(row.start))}</p>${badge(row.status)}</div>${row.status==='simulated_booked'?btn('Annulla','cancel-meeting',row.id,'small'):''}</div>`),'','Calendario locale di prova. Nessun invito Google.');
 return panel('Appuntamenti',list(g.meetings,row=>`<div class="list-item"><div class="body"><b>${e(row.company)}</b><p>${e(calendarDate(row.start))} → ${e(calendarDate(row.end))}</p>${badge(calendarStatus(row.status),row.status==='booked'?'green':'')}<small>${row.kind==='probe'?'Invito di prova':'Invito autorizzato'}${row.externalInvitation?' · Google ha ricevuto la richiesta di invito':''}</small></div><div class="actions">${row.canReconcile?btn('Verifica esito','growth-calendar-reconcile',row.id,'small'):''}${row.canCancel?btn('Rivedi annullamento','growth-calendar-cancel-preview',row.id,'small'):''}</div></div>`),btn('Configura Calendar','goto','growth:connections','small'),'Registrato in Google non significa invito ricevuto o accettato. Gli esiti incerti si verificano senza ripetere l’invio.');
}
async function calendarDispatch(path,body,success,snapshot){
 if(!isCurrentView(snapshot))throw Error('La pagina è cambiata. Riapri la conferma.');
 const currentDialog=calendarDialogSnapshot();
 try{await mutate(path,body);}catch(error){if(isCurrentView(snapshot)&&calendarDialogUnchanged(currentDialog))dialog('Operazione non confermata',notice(error.message,true)+notice('Controlla l’esito negli Appuntamenti prima di ogni altra azione. Se è da verificare, non ripetere l’invio.')+btn('Apri Appuntamenti','goto','growth:meetings','','calendar'));return;}
 if(isCurrentView(snapshot))await saved(success);
}
Object.assign(ACTIONS,{
 'growth-calendar-config':()=>{const c=S.module.calendar;form('Configura Calendar',[textField('calendarId','Calendario di proprietà · ID o primary',c.calendarId||'primary',true),selectField('meetingMinutes','Durata appuntamento · minuti',['15','30','45','60'],String(c.meetingMinutes||30)),{...numberField('startHour','Disponibili dalle ore · Roma',c.startHour??9,8,'1'),max:19},{...numberField('endHour','Disponibili fino alle ore · Roma',c.endHour??18,9,'1'),max:20}],async b=>{if(!Number.isInteger(Number(b.startHour))||!Number.isInteger(Number(b.endHour))||Number(b.startHour)<8||Number(b.endHour)>20||Number(b.startHour)>=Number(b.endHour))throw Error('Scegli orari interi tra le 8 e le 20, con la fine dopo l’inizio.');await mutate('/api/growth/calendar/config',{version:c.version,calendarId:b.calendarId,meetingMinutes:Number(b.meetingMinutes),startHour:Number(b.startHour),endHour:Number(b.endHour)});await saved('Calendario salvato. Ripeti le verifiche prima di attivarlo.');},{intro:'Disponibilità dal lunedì al venerdì, con almeno due ore di preavviso, entro 14 giorni. Salvare non crea eventi e sospende la precedente attivazione.'});},
 'growth-calendar-check':()=>{const c=S.module.calendar;form('Verifica disponibilità Calendar',[],async()=>{await mutate('/api/growth/calendar/check',{version:c.version});await saved('Disponibilità letta. Prepara e verifica l’invito di prova.');},{submit:'Leggi disponibilità',intro:'Legge gli orari occupati da Google senza mostrare i dettagli degli eventi. Non crea appuntamenti né invia inviti. Ripetere la verifica richiede una nuova attivazione.'});},
 'growth-calendar-probe-preview':async()=>{
  const snapshot=viewSnapshot(),currentDialog=calendarDialogSnapshot(),slots=await mutate('/api/growth/calendar/probe-preview',{});if(!isCurrentView(snapshot)||!calendarDialogUnchanged(currentDialog))return;
  if(!slots.slots?.length)return dialog('Invito di prova',empty('Nessuna disponibilità','Scegli altri orari nelle impostazioni del calendario.','calendar'));
  form('Scegli l’orario della prova',[selectField('start','Orario · Roma',slots.slots.map(start=>[start,calendarDate(start)]),slots.start)],async b=>{
   if(!isCurrentView(snapshot))throw Error('La pagina è cambiata. Riapri la prova.');
   const nextDialog=calendarDialogSnapshot(),p=await mutate('/api/growth/calendar/probe-preview',{start:b.start});if(!isCurrentView(snapshot)||!calendarDialogUnchanged(nextDialog))return;
   form('Conferma invito di prova',[{html:calendarPreviewDetails(p)},{name:'confirmed',label:'Confermo destinatario, orario, contenuto e creazione dell’evento con notifica Google',type:'checkbox'}],async(_b,fd)=>{if(!fd.has('confirmed'))throw Error('Conferma l’invito prima di creare l’evento.');await calendarDispatch('/api/growth/calendar/probe',{version:p.version,hash:p.hash,start:p.start,confirmed:true},'Google ha registrato l’invito di prova. Controlla la ricezione.',snapshot);},{submit:'Crea evento e richiedi invito',intro:'Questa azione crea un evento Google e può inviare una notifica alla casella indicata. Non abilita ancora le prenotazioni.'});
  },{submit:'Rivedi invito di prova',intro:'La prova usa la casella Google autorizzata. In questo passaggio si legge soltanto la disponibilità; nessun evento viene creato.'});
 },
 'growth-calendar-probe-verify':()=>{const c=S.module.calendar;form('Verifica la ricezione della prova',[{name:'received',label:'Ho ricevuto l’invito nella casella autorizzata e controllato destinatario, giorno, orario e contenuto',type:'checkbox'}],async(_b,fd)=>{if(!fd.has('received'))throw Error('Controlla l’invito ricevuto e conferma prima di proseguire.');await mutate('/api/growth/calendar/probe-verify',{id:c.probe.id,received:true});await saved('Prova verificata. Puoi attivare le prenotazioni.');},{submit:'Conferma ricezione e verifica evento',intro:'BigAnt OS rilegge l’evento da Google. La tua conferma attesta la ricezione dell’invito; nessun nuovo invito viene inviato.'});},
 'growth-calendar-enable':()=>{const c=S.module.calendar;if(!c?.checked||!c.probe?.verified)throw Error('Completa prima la verifica dell’invito di prova.');form('Attiva prenotazioni Calendar',[{name:'confirmed',label:'Confermo il calendario e la prova verificata; autorizzerò un invito per ogni contatto',type:'checkbox'}],async(_b,fd)=>{if(!fd.has('confirmed'))throw Error('Conferma l’attivazione delle prenotazioni.');await mutate('/api/growth/calendar/activate',{version:c.version,enabled:true});await saved('Prenotazioni abilitate. Nessun invito creato o inviato.');},{submit:'Attiva prenotazioni',intro:'I link vengono creati e condivisi manualmente. Google potrà inviare una notifica soltanto dopo la conferma dell’appuntamento.'});},
 'growth-calendar-disable':async()=>{await mutate('/api/growth/calendar/activate',{version:S.module.calendar.version,enabled:false});await saved('Nuove prenotazioni sospese. Gli eventi già registrati restano nel calendario.');},
 'growth-calendar-invite-preview':async id=>{
  const snapshot=viewSnapshot(),currentDialog=calendarDialogSnapshot(),p=await api('/api/growth/leads/'+encodeURIComponent(id)+'/invite-preview');if(!isCurrentView(snapshot)||!calendarDialogUnchanged(currentDialog))return;
  form('Rivedi invito appuntamento',[{html:calendarPreviewDetails(p)+`<p>Link valido per ${e(p.expiresInDays)} giorni.</p>`},{name:'confirmed',label:'Confermo destinatario e contenuto; autorizzo questo contatto a prenotare un appuntamento',type:'checkbox'}],async(_b,fd)=>{
   if(!fd.has('confirmed'))throw Error('Conferma il destinatario prima di creare il link.');if(!isCurrentView(snapshot))throw Error('La pagina è cambiata. Riapri l’invito.');
   const nextDialog=calendarDialogSnapshot(),invitation=await mutate('/api/growth/calendar/invite',{leadId:p.leadId,version:p.version,hash:p.hash,confirmed:true});if(!isCurrentView(snapshot)||!calendarDialogUnchanged(nextDialog))return;
   const url=new URL(invitation.url,location.origin);if(url.origin!==location.origin||!/^\/growth\/book\/[A-Za-z0-9_-]+$/.test(url.pathname)||url.search||url.hash)throw Error('Il link di prenotazione non è valido.');
   dialog('Link pronto da condividere',`<p>Destinatario autorizzato: <b>${e(p.to)}</b></p><p>Scade ${e(calendarDate(invitation.expiresAt))}.</p><label for="calendar-invitation-link">Copia il link e condividilo con il contatto</label><textarea id="calendar-invitation-link" readonly rows="3">${e(url.href)}</textarea><div class="actions section">${btn('Copia link','growth-calendar-copy-link','','primary','link')}</div>${notice('Nessuna email o invito è stato inviato. Il contatto sceglierà l’orario e confermerà la notifica Google.')}`);
  },{submit:'Crea link da condividere',intro:'Il link permette una sola prenotazione per il contatto mostrato. Non viene inserito nelle bozze né inviato automaticamente.'});
 },
 'growth-calendar-copy-link':async()=>{const field=$('#calendar-invitation-link');if(!field?.value)return;if(typeof navigator!=='undefined'&&navigator.clipboard?.writeText){await navigator.clipboard.writeText(field.value);toast('Link copiato. Condividilo con il destinatario autorizzato.');}else{field.focus();field.select();toast('Link selezionato. Usa Copia per condividerlo.');}},
 'growth-calendar-reconcile':async id=>{const snapshot=viewSnapshot(),r=await mutate('/api/growth/meetings/'+encodeURIComponent(id)+'/reconcile');if(!isCurrentView(snapshot))return;await saved(r.found?'Evento verificato: '+calendarStatus(r.status):'Evento non confermato. Nessun invito ripetuto.');},
 'growth-calendar-cancel-preview':async id=>{const snapshot=viewSnapshot(),currentDialog=calendarDialogSnapshot(),p=await api('/api/growth/meetings/'+encodeURIComponent(id)+'/cancel-preview');if(!isCurrentView(snapshot)||!calendarDialogUnchanged(currentDialog))return;form('Rivedi annullamento',[{html:calendarPreviewDetails(p)},{name:'confirmed',label:'Confermo l’annullamento di questo evento e la notifica Google agli invitati',type:'checkbox'}],async(_b,fd)=>{if(!fd.has('confirmed'))throw Error('Conferma evento e notifica prima di annullare.');await calendarDispatch('/api/growth/meetings/'+encodeURIComponent(p.id)+'/cancel',{hash:p.hash,confirmed:true},'Google ha confermato l’annullamento dell’evento.',snapshot);},{submit:'Annulla evento e notifica',intro:'Riguarda soltanto questo evento creato da BigAnt OS. Google può avvisare gli invitati dell’annullamento.'});}
});
Object.assign(ACTIONS,{
 'growth-mail-sync':()=>form('Aggiorna risposte Gmail',[],async()=>{const r=await mutate('/api/growth/mail/sync',{confirmed:true});await saved(`${r.received} nuove risposte · ${r.checked} conversazioni verificate${r.errors?' · alcuni controlli non riusciti':''}`);},{submit:'Leggi le risposte',intro:'Legge fino a dieci conversazioni inviate da BigAnt OS. Le risposte annullano bozze e approvazioni superate; i rifiuti riconosciuti interrompono i contatti. Nessun messaggio o analisi AI viene avviato.'}),
 'growth-mail-check':()=>form('Collauda la casella',[],async()=>{await mutate('/api/growth/mail/check',{version:S.module.mail.version});await saved('Casella verificata. Puoi attivare l’invio manuale.');},{submit:'Verifica casella',intro:'Legge da Google l’identità della casella. Non invia messaggi. Ripetere il collaudo sospende l’attivazione Gmail.'}),
 'growth-mail-enable':async()=>{await mutate('/api/growth/mail/activate',{version:S.module.mail.version,enabled:true});toast('Invio manuale abilitato. Nessun messaggio inviato.');await load();},
 'growth-mail-disable':async()=>{await mutate('/api/growth/mail/activate',{version:S.module.mail.version,enabled:false});toast('Invio Gmail sospeso');await load();},
 'growth-mail-preview':async id=>{const p=await api('/api/growth/messages/'+encodeURIComponent(id)+'/send-preview'),html=`<dl class="out-obj"><div><dt>Da</dt><dd>${e(p.fromName)} &lt;${e(p.from)}&gt;</dd></div><div><dt>A</dt><dd>${e(p.to)}</dd></div><div><dt>Versione approvata</dt><dd>${p.version}</dd></div></dl><h3>${e(p.subject)}</h3><p class="preserve">${e(p.body)}</p>`;if(!p.canSend)return dialog('Anteprima invio',html+notice(p.reason,true));form('Conferma invio Gmail',[{html},{name:'confirmed',label:'Confermo destinatario, contenuto e invio di questa versione',type:'checkbox'}],async(b,fd)=>{if(!fd.has('confirmed'))throw Error('Conferma il messaggio prima di inviarlo.');await mutate('/api/growth/messages/'+encodeURIComponent(id)+'/send',{version:p.version,hash:p.hash,confirmed:true});await saved('Gmail ha confermato l’invio del messaggio.');},{submit:'Invia con Gmail',intro:'Questa azione invia il messaggio alla casella indicata. In caso di esito incerto usa Verifica esito, senza ripetere l’invio.'});}
});

const previousGrowthMessageAction=ACTIONS.message;
ACTIONS.message=id=>{
 const g=S.module,m=g.messages.find(row=>row.id===id);
 if(g.simulation||m.direction!=='in')return previousGrowthMessageAction(id);
 const reason=m.replyBlockedReason||(g.settings.paused?'Growth è in pausa.':!g.runtime?.phases.drafts.enabled?'La preparazione delle bozze deve essere collaudata e attivata.':null);
 return dialog(m.subject,`${growthMessageBadge(m,false)}<p>${e(m.company)} · ${date(m.created,true)}</p>${m.source?`<p class="muted">Fonte: ${e(m.source.provider)} · acquisita ${date(m.source.importedAt,true)}</p>`:''}<p class="preserve section">${e(m.body)}</p>${m.error?notice(m.error,true):''}${reason?notice(reason):notice('Prepara una bozza da rivedere. La richiesta entra nelle attività da eseguire manualmente; non avvia un invio.')}${reason?'':`<div class="actions">${btn('Prepara risposta','reply-message',id,'primary')}</div>`}`);
};
