'use strict';

// Shared navigation pattern: compact cards, one open section, a clear way back.
function sectionCards(items){
 return `<div class="section-cards">${items.map(item=>`<button class="section-card" data-view="${e(item.route)}"><span class="section-card-icon">${icon(item.icon||'grid')}</span><span class="section-card-copy"><b>${e(item.name)}</b><strong>${e(item.value??'Apri')}</strong>${item.note?`<small>${e(item.note)}</small>`:''}</span><span class="section-card-arrow">${icon('arrow')}</span></button>`).join('')}</div>`;
}
function sectionNavigator(base,items,renderSection){
 const current=items.find(item=>item.id===S.section);
 if(!current)return sectionCards(items.map(item=>({...item,route:`${base}:${item.id}`})));
 return `<div class="section-back">${btn('Indietro','goto',`${base}:sections`,'ghost','arrow')}<span>${e(current.name)}</span></div>${renderSection(current.id)}`;
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
  if(id==='list')return notice('Le procedure di prova restano indicate come DEMO. Gli agenti per il lavoro reale devono essere configurati e collaudati.')+`<div class="toolbar"><label class="sr-only" for="local-filter">Cerca un agente</label><input id="local-filter" class="search" placeholder="Cerca un agente o un compito…" value="${e(S.filter)}"></div><div class="card-grid">${(a.definitions||[]).filter(agent=>`${agent.name} ${agent.purpose}`.toLocaleLowerCase('it').includes(S.filter.toLocaleLowerCase('it'))).map(agent=>agentCard(agent,jobs)).join('')}</div>`;
  if(id==='history')return panel('Storico',table(['Agente','Quando','Stato','Esito',''],jobs.map(job=>[e(agentName(job.agent)),date(job.created_at,true),badge(agentJobStatus(job)),e(job.result?.summary||job.error||'In attesa'),job.result?btn('Leggi elaborato','agent-result',job.id,'small'):''])));
  if(id==='budget'){const b=a.budget||{};return panel('Budget dello sciame',`<div class="stats">${stat('Tetto mensile',money(b.capCents),'Limite condiviso')}${stat('Speso e impegnato',money(b.usedCents),'Nel mese corrente')}${stat('Disponibile',money(b.availableCents),'Dopo quote fisse e riserva')}</div>${btn('Modifica ripartizione','budget','','','wallet')}`);}
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
