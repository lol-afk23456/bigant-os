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
 const rows=S.module?.items||[];
 return title('I profili, tutti qui.',`Canali di ${clientName(S.clientId)}. I dati compariranno dopo il collegamento alla piattaforma.`)+sectionNavigator('profiles',rows.map(row=>({id:row.id,name:row.name,value:row.status,icon:'globe'})),id=>{
  const row=rows.find(item=>item.id===id);
  return panel(row.name,empty('Da collegare','Collega la fonte per vedere dati aggiornati, crescita e risultati.','link')+(id==='google-business'?notice('Le recensioni di Google saranno raccolte dentro questa scheda.'):'')+(isOwner()?btn('Apri Collegamenti','goto','connections','','link'):''));
 });
}
function workspaceProgressView(){
 const a=S.module||{},backup=S.overview.backup||{};
 return title('Avanzamento BigAnt OS.','Cosa funziona, cosa è ancora una prova e cosa aspetta un collegamento.')+sectionNavigator('progress',[
  {id:'status',name:'Stato della piattaforma',value:'Funziona · Prova · Da collegare',icon:'chart'},
  {id:'foundations',name:'Fondamenta da completare',value:`${a.foundations?.length||0} aree`,icon:'grid'}
 ],id=>id==='foundations'?`<div class="card-grid">${(a.foundations||[]).map(item=>`<article class="module-card"><h3>${e(item.name)}</h3>${badge('Prova','orange')}<p>${e(item.missing)}</p>${bulletText(item.sections.map(section=>section.name))}</article>`).join('')}</div>`:
  panel('Stato delle funzioni',table(['Funzione','Stato','Ultima verifica'],[
   ['Accesso e gestione persone',badge(S.session.demo===false?'Funziona':'Prova',S.session.demo===false?'green':'orange'),'Nell’ambiente attuale'],
   ['Copia di sicurezza',badge(backup.enabled&&backup.lastSuccess&&!backup.error?'Funziona':'Da collegare'),backup.lastSuccess?date(backup.lastSuccess,true):'Nessuna copia automatica verificata in questo ambiente'],
   ['Procedure degli agenti',badge('Prova','orange'),'Procedure disponibili; configurazione AI da completare'],
   ['Growth e Fidelity',badge('Prova','orange'),'Percorsi da collaudare prima dell’attivazione'],
   ['Google, Meta e altri canali',badge('Da collegare'),'Nessuna fonte esterna attiva']
  ])));
}
function agentsUnifiedView(){
 if(!isOwner())return approvalsView();
 const a=S.module||{},jobs=(a.jobs||[]).filter(job=>job.client_id===S.clientId);
 const sections=[{id:'office',name:'Ufficio',value:'Lo sciame dal vivo',icon:'eye'},{id:'list',name:'Agenti',value:'Elenco e compiti',icon:'agents'},
  {id:'approvals',name:'Da approvare',value:approvalItems().filter(item=>item.status==='pending').length,icon:'approval'},
  {id:'history',name:'Storico',value:'Risultati ed esecuzioni',icon:'clock'},{id:'budget',name:'Budget',value:'Spesa e tetto mensile',icon:'wallet'},{id:'structure',name:'Struttura',value:'Reparti e specialisti',icon:'grid'}];
 const header=title('Sciame di agenti.','Una sola regia, dal lavoro degli agenti alle tue decisioni.',S.section==='office'?btn('Avvia un giro','ufficio-avvia','','primary','play'):'');
 return header+(S.section==='office'?workspaceHero('La testa resta umana.<br>Il lavoro trova il suo ritmo.','Le postazioni mostrano il lavoro registrato. Ogni uscita richiede una decisione umana.'):'')+sectionNavigator('agents',sections,id=>{
  if(id==='office')return `<div id="ufficio-root">${ufficioCorpo()}</div>`;
  if(id==='approvals')return approvalsView();
  if(id==='list')return notice('Base = procedura di prova. AI pronta = configurazione e collaudo completati. Attivo = autorizzato per il lavoro reale.')+`<div class="toolbar"><label class="sr-only" for="local-filter">Cerca un agente</label><input id="local-filter" class="search" placeholder="Cerca un agente o un compito…" value="${e(S.filter)}"></div><div class="card-grid">${(a.configuration?.items||[]).filter(agent=>`${agent.name} ${agent.config.task}`.toLocaleLowerCase('it').includes(S.filter.toLocaleLowerCase('it'))).map(agent=>`<article class="module-card"><h3>${e(agent.name)}</h3>${badge(agent.operationalStatus,agent.operationalStatus==='Attivo'?'green':'orange')}<p>${e(agent.config.task)}</p><small>${agent.hasAIInstructions?'Istruzioni AI presenti':'Procedura base disponibile'} · ${e(agent.config.cadence==='manual'?'Avvio manuale':label(agent.config.cadence))}</small><footer>${btn('Configura','agent-config',agent.id,'small')}${btn('Registro','agent-record',agent.id,'small ghost')}${S.session.demo!==false?btn('Prova procedura','run-agent',agent.id,'small ghost'):''}</footer></article>`).join('')}</div>`;
  if(id==='history')return panel('Esecuzioni dello sciame AI',table(['Agente','Quando','Stato','Qualità',''],(a.configuration?.history||[]).filter(row=>row.client_id===S.clientId).map(row=>[e(row.agente),date(row.created_at,true),badge(STATI_PASSO_UI[row.stato]||row.stato),e(row.esito_qualita||'Da verificare'),btn('Leggi','ufficio-postazione',row.id,'small')])))+panel('Procedure di prova',table(['Agente','Quando','Stato','Esito',''],jobs.map(job=>[e(agentName(job.agent)),date(job.created_at,true),badge(agentJobStatus(job)),e(job.result?.summary||job.error||'In attesa'),job.result?btn('Leggi elaborato','agent-result',job.id,'small'):''])));
  if(id==='budget'){const b=a.budget||{},costs=a.configuration?.costs||{};return panel('Budget dello sciame',`<div class="stats">${stat('Tetto mensile',money(b.capCents),'Limite condiviso')}${stat('Speso e impegnato',money(b.usedCents),'Nel mese corrente')}${stat('Disponibile',money(b.availableCents),'Dopo quote fisse e riserva')}</div>${btn('Modifica ripartizione','budget','','','wallet')}`)+panel('Costo per agente',table(['Agente','Contabilizzato','Impegnato'],(costs.rows||[]).map(row=>[e(row.name),money(row.chargedCents),money(row.reservedCents)])))+notice(`Regia e altri consumi: ${money(costs.otherCents)}. I costi AI sono stime prudenziali finché il listino del modello non è verificato.`);}
  return `<div class="card-grid">${(a.departments||[]).map(department=>`<article class="module-card"><h3>${e(department.name)}</h3><p>${e(department.purpose||'')}</p><ul class="plain-list">${(a.agents||[]).filter(agent=>(department.agents||[]).includes(agent.id)).map(agent=>`<li>${e(agent.name)}</li>`).join('')}</ul></article>`).join('')}</div>`;
 });
}

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
 'agent-config':id=>{const agent=S.module.configuration.items.find(item=>item.id===id),c=agent.config;form('Configura · '+agent.name,[
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
 const rows=S.module?.jobs||[];
 return panel('Attività di '+(S.view==='growth'?'Growth':'Fidelity'),table(['Tipo','Stato','Quantità o data','Nota'],rows.map(row=>[
  e(row.type||'Aggiornamento tessere'),badge(row.status),row.count!==undefined?String(row.count):date(row.created||row.created_at,true),e(row.error||'Nessuna azione esterna eseguita')
 ])));
}


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
  return panel(row.name,`${badge(row.status,row.status==='Errore'?'red':'orange')}<p>${e(row.purpose)}</p><dl class="out-obj"><div><dt>Accessi salvati</dt><dd>${row.configured?'Sì, nell’archivio protetto':'Da inserire'}</dd></div><div><dt>Configurato da</dt><dd>${e(row.configuredBy||'Nessuno')}</dd></div><div><dt>Ultima verifica</dt><dd>${row.lastCheck?date(row.lastCheck,true)+' · controllo locale':'Non ancora eseguita'}</dd></div></dl>${row.checkNote?notice(row.checkNote,row.status==='Errore'):''}<p>${e(row.activationNote)}</p><div class="actions">${row.fields.length&&d.vaultReady?btn(row.configured?'Aggiorna accessi':'Inserisci accessi','connection-save',id,'primary','shield'):''}${row.configured?btn('Controlla configurazione','connection-check',id,'','check'):''}${row.dependsOn?btn('Apri accesso Google','goto','connections:'+row.dependsOn,'','arrow'):''}</div>${!row.fields.length&&!row.dependsOn?notice('Procedura di collegamento da completare e collaudare.') : ''}`);
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
  return panel('Regolamento e privacy',`<p class="preserve">${e(c.terms_text||'Regolamento da compilare')}</p><p>Informativa: ${e(c.privacy_url||'Da indicare')}</p>`,btn('Modifica documenti','fidelity-policies','','small'))+panel('Apple e Google Wallet',notice('Da collegare. Le tessere web restano consultabili; nessuna carta Wallet è stata emessa.')+(isOwner()?btn('Apri Collegamenti','goto','connections','','link'):''));
 });
}
Object.assign(ACTIONS,{
 'member-anonymize':id=>{const member=S.module.members.find(row=>row.id===id);form('Anonimizza e revoca la tessera',[{html:`<p>Rimuovi i dati personali di <strong>${e(member.name)}</strong> e revochi subito il link della tessera. Il registro dei movimenti resta senza i contatti.</p>`},{name:'confirmation',label:'Scrivi ANONIMIZZA per confermare',required:true}],async b=>{if(b.confirmation!=='ANONIMIZZA')throw Error('Scrivi ANONIMIZZA per confermare.');await mutate('/api/fidelity/members/'+id,{},'DELETE');await saved('Dati personali rimossi e tessera revocata.');},{intro:'Operazione irreversibile sui dati personali. Gli aggiornamenti Wallet remoti richiedono il collegamento del fornitore.',submit:'Anonimizza e revoca'});}
});
