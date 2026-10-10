function emailData(){return S.module?.emailMarketing||S.module;}
function emailCanManage(d){return !!d?.canManage&&((S.view==='clients'&&isOwner())||(['client','service'].includes(S.view)&&role()==='client'));}
function emailContext(){
 const d=emailData();if(!d||d.clientId!==S.clientId||!Array.isArray(d.items))throw Error('Riapri Email marketing per questa attività.');
 return {d,snapshot:viewSnapshot()};
}
function emailContactsPanel(d){
 const writable=emailCanManage(d);
 const controls=(writable?btn('Aggiungi contatto','email-add','','primary','plus'):'')+btn('Cerca contatto','email-search','','small','search')+(d.q?btn('Tutti i contatti','email-reset','','small'):'');
 const rows=d.items.map(row=>`<article class="list-item"><div class="body"><b>${e(row.name||row.email)}</b>${row.name?`<small>${e(row.email)}</small>`:''}<p>${badge(row.status==='granted'?'Consenso registrato':'Consenso revocato',row.status==='granted'?'green':'')}</p><small>Aggiornato ${e(date(row.updated_at,true))}</small></div>${btn('Consenso e storico','email-history',row.id,'small','file')}</article>`).join('');
 const pages=(d.page>1?btn('Precedenti','email-page',String(d.page-1),'small'):'')+`<span>Pagina ${d.page} di ${d.pages}</span>`+(d.page<d.pages?btn('Successivi','email-page',String(d.page+1),'small'):'');
 return panel('Contatti e consensi',`<div class="pill-row">${badge(d.counts.total+' contatti')}${badge(d.counts.granted+' consensi registrati')}${badge(d.counts.withdrawn+' revocati')}</div><p>Fonte: ${e(d.source)} · ${e(date(d.asOf,true))}</p>`+notice('Il consenso è registrato dall’attività sulla base della prova indicata. Gli invii email sono da collegare.')+`<div class="actions section">${controls}</div>`+(d.q?`<p>Ricerca: <b>${e(d.q)}</b> · ${d.total} risultati</p>`:'')+(rows?`<div class="list">${rows}</div>`:empty('Nessun contatto trovato',d.q?'Prova un’altra ricerca.':'Registra un contatto soltanto dopo aver ricevuto e verificato il suo consenso.'))+`<div class="actions section">${pages}</div>`);
}
function emailMarketingView(){const d=emailData();return title('Email marketing · '+(d?.clientName||''),'Il registro dei contatti di questa attività.',btn('Servizi del cliente','goto','clients:services','','arrow'))+emailContactsPanel(d);}
async function emailRefresh(c,{q=c.d.q,page=c.d.page}={}){
 const d=await api('/api/email-marketing/contacts?clientId='+encodeURIComponent(c.d.clientId)+'&q='+encodeURIComponent(q)+'&page='+page,{scoped:false});
 if(!isCurrentView(c.snapshot))return;
 if(S.module.emailMarketing)S.module.emailMarketing=d;else S.module=d;
 render();
}
function emailProofFields(){return [{name:'consentDate',label:'Data del consenso ricevuto',type:'date',required:true},{name:'privacyVersion',label:'Informativa accettata (versione o riferimento)',required:true,maxlength:160},{name:'source',label:'Prova del consenso: fonte e riferimento verificabile',type:'textarea',full:true,required:true,maxlength:800},{name:'confirmed',type:'checkbox',label:'Ho verificato la prova del consenso per questa attività e questo contatto.',required:true}];}
async function emailSave(c,path,body){
 if(!isCurrentView(c.snapshot)||!emailCanManage(c.d))throw Error('La pagina o i permessi sono cambiati. Riapri il contatto.');
 await api('/api/email-marketing/contacts'+path+'?clientId='+encodeURIComponent(c.d.clientId),{method:'POST',body,scoped:false});
 if(isCurrentView(c.snapshot)){$('#dialog').close();toast('Contatto aggiornato');await emailRefresh(c);}
}
Object.assign(ACTIONS,{
 'email-add':()=>{const c=emailContext();if(!emailCanManage(c.d))return;
  form('Aggiungi contatto',[{name:'email',label:'Email',type:'email',required:true,maxlength:254},{name:'name',label:'Nome (facoltativo)',maxlength:140},...emailProofFields()],(b,fd)=>emailSave(c,'',{...b,confirmed:fd.has('confirmed')}),{intro:'Attività: '+c.d.clientName+'. Nessuna email verrà inviata.'});
 },
 'email-search':()=>{const c=emailContext();form('Cerca contatto',[{name:'q',label:'Nome o email',value:c.d.q,maxlength:120}],async b=>{if(!isCurrentView(c.snapshot))throw Error('La pagina è cambiata.');$('#dialog').close();await emailRefresh(c,{q:b.q,page:1});},{submit:'Cerca'});},
 'email-page':page=>emailRefresh(emailContext(),{page:Number(page)}),
 'email-reset':()=>emailRefresh(emailContext(),{q:'',page:1}),
 'email-history':async id=>{
  const c=emailContext(),history=await api('/api/email-marketing/contacts/'+encodeURIComponent(id)+'/history?clientId='+encodeURIComponent(c.d.clientId),{scoped:false});
  if(!isCurrentView(c.snapshot))return;
  const row=history.contact,writable=emailCanManage(c.d),withdraw=row.status==='granted';
  const fields=!writable?[]:withdraw?[{name:'source',label:'Motivo e fonte della revoca',type:'textarea',full:true,required:true,maxlength:800}]:emailProofFields();
  const extra=history.events.map(event=>`<article class="section"><b>${event.status==='granted'?'Consenso registrato':'Consenso revocato'} · ${e(date(event.consent_date))}</b><p class="preserve">${e(event.source)}</p>${event.privacy_version?`<p>Informativa: ${e(event.privacy_version)}</p>`:''}<small>Registrato ${e(date(event.recorded_at,true))}</small></article>`).join('');
  form('Consenso · '+row.email,fields,async(b,fd)=>{if(!writable){$('#dialog').close();return;}await emailSave(c,'/'+encodeURIComponent(id)+'/consent',{...b,version:row.version,status:withdraw?'withdrawn':'granted',confirmed:fd.has('confirmed')});},{intro:!writable?'Storico in sola lettura.':withdraw?'Registra la revoca ricevuta dal contatto.':'Per un nuovo consenso serve una nuova prova, non precedente alla revoca.',extra,submit:!writable?'Chiudi':withdraw?'Registra revoca':'Registra nuovo consenso'});
 }
});
