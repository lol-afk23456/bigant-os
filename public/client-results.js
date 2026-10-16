'use strict';
const resultKindNames={goal:'Obiettivi',work:'Lavori svolti',result:'Risultati misurati'};
function resultsBody(report,showPeriod=true){
 return (showPeriod?`<h2>${e(report.period)}</h2>`:'')+`<p class="preserve">${e(report.summary)}</p>`+notice('Report preparato dai soci. Ogni voce indica la sua fonte e la data; i dati non sono sincronizzati automaticamente.')+
 Object.entries(resultKindNames).map(([kind,label])=>{const rows=report.entries.filter(row=>row.kind===kind);return rows.length?panel(label,rows.map(row=>`<article class="list-item"><div class="body"><small>${e(serviceName(row.serviceId))}</small><b>${e(row.title)}</b>${row.detail?`<p class="preserve">${e(row.detail)}</p>`:''}${kind!=='work'?`<p>Misura: <b>${row.value===null?'Non disponibile':e(row.value)+' '+e(row.unit)}</b>${kind==='goal'?` · Obiettivo: ${row.target===null?'Da definire':e(row.target)+' '+e(row.unit)}`:''}</p>`:''}${clientSource({fonte:row.source,aggiornato:row.date,url:row.url,dateOnly:true})}</div></article>`).join('')):'';}).join('')+
 (report.nextSteps?panel('Prossimi passi',`<p class="preserve">${e(report.nextSteps)}</p>`):'');
}
function resultsIndexView(){
 if(!isOwner())return empty('Area riservata ai soci','');
 return title('Risultati dei clienti.','Obiettivi, lavoro svolto e misure. Prima li verifichi qui, poi scegli cosa rendere visibile.',btn('Indietro','goto','clients','','arrow'))+
 `<div class="card-grid">${(S.module?.items||[]).map(item=>`<article class="module-card"><h3>${e(item.clientName)}</h3>${item.latest?`${badge(item.latest.status)}<p><b>${e(item.latest.period)}</b></p><p>${e(item.latest.summary.slice(0,220))}</p><small>${item.latest.entries.filter(x=>x.kind==='goal').length} obiettivi · ${item.latest.entries.filter(x=>x.kind==='work').length} lavori · ${item.latest.entries.filter(x=>x.kind==='result').length} misure</small>`:notice('Nessun report preparato.')}<footer>${btn('Apri risultati','results-client',item.clientId,'small','chart')}</footer></article>`).join('')}</div>`;
}
function resultsEditorView(){
 const d=S.module||{},r=d.report;if(!isOwner()||d.clientId!==S.clientId)return empty('Report non disponibile','Riapri l’attività.');
 const actions=btn('Tutti i risultati','goto','clients:results','','arrow')+btn('Nuovo mese','results-new','','primary','plus');
 return title('Risultati · '+d.clientName,'Prepara il riepilogo, controlla fonti e contenuti, poi rendilo visibile al cliente.',actions)+
 (d.reports.length?`<div class="pill-row">${d.reports.map(row=>btn(row.period,'results-open',row.period,row.period===d.period?'primary':'ghost')).join('')}</div>`:'')+
 (!r?empty('Il primo report parte da qui','Scegli Nuovo mese per inserire una sintesi. Nessun dato viene generato automaticamente.','chart'):
 `<div class="actions section">${badge(r.status,r.published?'green':'orange')}${btn('Modifica sintesi','results-summary','','small')}${btn('Aggiungi voce','results-entry','','small','plus')}${r.canPublish?btn(r.published?'Verifica anteprima':'Verifica e mostra al cliente','results-preview','','primary','eye'):''}${r.published?btn('Nascondi al cliente','results-hide','','small'):''}</div>`+
 resultsBody(r)+panel('Modifica le voci',r.entries.length?list(r.entries,(row,i)=>`<div class="list-item"><div class="body"><b>${e(row.title)}</b><small>${e(resultKindNames[row.kind])}</small></div>${btn('Modifica','results-entry',String(i),'small')}${btn('Togli dal report','results-remove',String(i),'small')}</div>`):empty('Nessuna voce','Aggiungi obiettivi, lavori o misure con fonte e data.'))+
 `<details class="section"><summary>Versioni e visibilità</summary>${table(['Versione','Salvata'],d.history.map(row=>[e(row.version),e(date(row.created_at,true))]))}${table(['Versione','Decisione','Data'],d.events.map(row=>[e(row.version),row.action==='publish'?'Mostrato al cliente':'Nascosto al cliente',e(date(row.created_at,true))]))}</details>`);
}
function clientResultsView(){
 const d=S.module||{};if(d.clientId!==S.clientId)return empty('Risultati non disponibili','');
 return clientAreaHeader()+`<div class="section-back">${btn('Indietro','goto','client','ghost','arrow')}<span>I tuoi risultati</span></div>`+
 (d.reports?.length?d.reports.map(r=>`<details class="section"${d.reports.length===1?' open':''}><summary>${e(r.period)} · Aggiornato ${e(date(r.publishedAt))}</summary>${resultsBody(r,false)}</details>`).join(''):empty('Nessun report disponibile','L’agenzia sta preparando o verificando il riepilogo.'));
}
function resultsContext(){if(!isOwner()||!S.module?.clientId||S.module.clientId!==S.clientId)throw Error('Riapri i risultati dell’attività.');return {d:S.module,snapshot:viewSnapshot()};}
async function saveResults(context,body){
 if(!isCurrentView(context.snapshot))throw Error('Hai cambiato pagina o attività. Riapri il report prima di salvare.');
 const result=await mutate('/api/client-results/save?clientId='+encodeURIComponent(context.d.clientId),body);
 if(isCurrentView(context.snapshot)){S.module=result;await go('clients:client-results/'+result.period);toast('Versione salvata. Prima di mostrarla al cliente, verificala.');}
}
Object.assign(ACTIONS,{
 'results-client':async id=>{S.clientId=id;await go('clients:client-results');},
 'results-open':period=>go('clients:client-results/'+period),
 'results-new':()=>{const c=resultsContext();form('Prepara un report',[{name:'period',label:'Mese',type:'month',value:today().slice(0,7),required:true},areaField('summary','Sintesi del periodo'),{name:'nextSteps',label:'Prossimi passi',type:'textarea',full:true}],b=>saveResults(c,{...b,version:0,entries:[]}),{intro:'Report interno. Usa dati verificabili e cita le fonti nelle singole voci.'});},
 'results-summary':()=>{const c=resultsContext(),r=c.d.report;form('Sintesi del report',[areaField('summary','Sintesi',r.summary),{name:'nextSteps',label:'Prossimi passi',type:'textarea',full:true,value:r.nextSteps}],b=>saveResults(c,{...r,...b}),{intro:'La modifica richiede una nuova verifica prima di essere visibile al cliente.'});},
 'results-entry':id=>{
  const c=resultsContext(),r=c.d.report,index=id==null||id===''?-1:Number(id),row=index<0?{}:r.entries[index];if(!row)throw Error('Voce non trovata.');
  form(index<0?'Aggiungi una voce':'Modifica la voce',[
   selectField('kind','Tipo',[['goal','Obiettivo'],['work','Lavoro svolto'],['result','Risultato misurato']],row.kind||'goal'),selectField('serviceId','Servizio',c.d.services.map(x=>[x.id,x.name]),row.serviceId),textField('title','Titolo',row.title||'',true),{name:'detail',label:'Descrizione',type:'textarea',full:true,value:row.detail||''},
   {name:'value',label:'Misura attuale (vuoto se manca)',type:'number',step:'any',value:row.value??''},{name:'target',label:'Valore obiettivo (solo per obiettivi)',type:'number',step:'any',value:row.target??''},{name:'unit',label:'Unità della misura',value:row.unit||''},
   {name:'date',label:'Data della fonte nel mese del report',type:'date',value:row.date||r.period+'-01',required:true},textField('source','Fonte del dato',row.source||'',true),{name:'url',label:'Link alla fonte, se disponibile',type:'url',value:row.url||'',full:true}
  ],b=>{const entries=r.entries.slice(),entry={...b,value:b.value===''?null:Number(b.value),target:b.target===''?null:Number(b.target)};if(index<0)entries.push(entry);else entries[index]=entry;return saveResults(c,{...r,entries});},{intro:'Indica solo dati controllati. Lascia vuota una misura assente: zero significa zero misurato.'});
 },
 'results-remove':id=>{const c=resultsContext(),r=c.d.report,index=Number(id);form('Togli questa voce',[],()=>saveResults(c,{...r,entries:r.entries.filter((_,i)=>i!==index)}),{intro:'La voce resta nelle versioni precedenti. Il report modificato richiederà una nuova verifica.',submit:'Togli e salva'});},
 'results-preview':()=>{
  const c=resultsContext(),r=c.d.report;form('Verifica il report',r.published?[]:[{name:'confirmed',type:'checkbox',label:'Ho controllato questa versione, le fonti e che tutti i contenuti siano destinati al cliente.',required:true}],async(b,fd)=>{
   if(r.published)return $('#dialog').close();if(!isCurrentView(c.snapshot))throw Error('La pagina è cambiata. Riapri la verifica.');
   await mutate('/api/client-results/publish?clientId='+encodeURIComponent(c.d.clientId),{id:r.id,version:r.version,confirmed:fd.has('confirmed')});if(isCurrentView(c.snapshot))await saved('Report visibile al cliente. Nessun messaggio inviato.');
  },{intro:'Versione '+r.version+' · '+c.d.clientName+'. Questa è la sintesi che vedrà il cliente.',extra:resultsBody(r),submit:r.published?'Chiudi':'Mostra al cliente'});
 },
 'results-hide':()=>{const c=resultsContext(),r=c.d.report;form('Nascondi il report',[],async()=>{if(!isCurrentView(c.snapshot))throw Error('La pagina è cambiata.');await mutate('/api/client-results/hide?clientId='+encodeURIComponent(c.d.clientId),{id:r.id,version:r.version});if(isCurrentView(c.snapshot))await saved('Report nascosto. Lo storico è conservato.');},{intro:'Il cliente non vedrà più questo report. Puoi verificarlo e mostrarlo nuovamente.',submit:'Nascondi'});}
});
