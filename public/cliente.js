'use strict';
// Vista precedente conservata; l'area corrente a sezioni è definita in fondo.
// Ogni numero mostra la fonte; le misure assenti non vengono presentate come zero.
const TONI_STATO={OPERATIVO:'green',DEMO:'orange','COLLEGAMENTO MANCANTE':'red','NON ATTIVO':'',Pronto:'green','Pronto per la verifica':'green','Al lavoro':'orange','Controllo qualità':'orange','In coda':'orange','In revisione interna':''};
const statoBadge=st=>`<span class="badge ${TONI_STATO[st]??''}">${e(st==='SOLO STRUTTURA'?'Dato non disponibile':st)}</span>`;
const euroC=c=>money(c);
function kpiTabella(righe){return `<div class="kpi-list">${righe.map(k=>`<div class="kpi-row"><div><b>${e(k.kpi)}</b><small>${e(k.fonte)}</small></div><div class="kpi-val">${k.valore===null?'<span class="muted">—</span>':e(k.valore)}${statoBadge(k.stato)}</div></div>`).join('')}</div>`;}
function sezioneCliente(x){
 if(x.id==='home')return `<div class="client-numbers">${x.numeri.map(n=>`<article class="stat ${n.valore!==null?'emphasis':''}"><div class="stat-label">${e(n.nome)}</div><div class="stat-value">${n.valore===null?'—':e(n.valore)}</div><div class="stat-note">${statoBadge(n.stato)} ${e(n.fonte)}</div></article>`).join('')}</div>
  <div class="grid-two section">${panel('Come sta andando',x.sintesi?`<p class="preserve">${e(x.sintesi.testo).slice(0,1400)}</p><small>${e(x.sintesi.stato)} · ${e(x.sintesi.fonte)}</small>`:empty('Report del mese non ancora pronto','Il reporter lo scrive il primo giorno lavorativo del mese, dopo il controllo di un socio.','file'))}
  ${panel('Avvisi',x.avvisi.length?`<ul class="out-list">${x.avvisi.map(a=>`<li>${e(a)}</li>`).join('')}</ul>`:empty('Nessun avviso','Tutto in ordine per ora.','check'))}</div>
  ${panel('Il team BigAnt al lavoro per te',x.squadra?.length?`<div class="list">${x.squadra.map(q=>`<div class="list-item office-row"><span><b>${q.attivo?'<b class="live-dot"></b>':''}${e(q.agente)}</b><small>${e(q.compito)} · ${e(date(q.quando,true))}</small></span>${statoBadge(q.stato)}</div>`).join('')}</div>`:empty('Nessun lavoro degli agenti ancora','Quando un agente lavora per la tua attività, lo vedi qui.','agents'),'','Si aggiorna da solo mentre gli agenti lavorano')}
  <div class="grid-two section">${panel('Cosa abbiamo fatto per te questo mese',x.fattoQuestoMese.length?`<ul class="out-list">${x.fattoQuestoMese.map(a=>`<li>${e(a)}</li>`).join('')}</ul>`:empty('Ancora nessuna consegna registrata nel mese','',"work"))}${panel('Prossimi passi',x.prossimiPassi.length?`<ul class="out-list">${x.prossimiPassi.map(p=>`<li>${e(p.titolo)}${p.scadenza?` · entro ${e(date(p.scadenza))}`:''}</li>`).join('')}</ul>`:empty('Nessun lavoro aperto','','calendar'))}</div>`;
 if(x.id==='risultati')return x.famiglie.map(f=>panel(f.nome,f.servizi.map(sv=>`<h3>${e(sv.codice)} · ${e(sv.nome)}</h3>${kpiTabella(sv.kpi)}`).join(''),'','Valori solo da fonti registrate; le piattaforme non collegate sono indicate')).join('')+notice(x.filtri.nota);
 if(x.id==='approvazioni')return `<div class="grid-two">${panel('Da approvare',x.daApprovare.length?`<div class="list">${x.daApprovare.map(a=>`<div class="list-item"><span class="number">${icon('approval')}</span><div class="body"><b>${e(a.title)}</b><p>Versione ${a.version} · ${e(date(a.created_at,true))}</p></div>${badge('In verifica dal team')}</div>`).join('')}</div>`:empty('Niente da approvare','Le nuove bozze compariranno qui.','check'))}
  ${panel('Calendario',x.calendario.length?`<div class="list">${x.calendario.map(c=>`<div class="list-item"><span class="number">${icon('calendar')}</span><div class="body"><b>${e(c.title)}</b><p>${e(c.state)}${c.scheduled_at?` · ${e(date(c.scheduled_at,true))}`:''}</p></div></div>`).join('')}</div>`:empty('Calendario vuoto','',"calendar"),'','PROGRAMMATO = in calendario; la pubblicazione sui canali non è collegata')}</div>
  ${panel('Storico delle decisioni',x.storico.length?table(['Contenuto','Decisione','Chi','Quando','Motivo'],x.storico.map(h=>[e(h.titolo),badge(h.decisione),e(h.da||'—'),e(date(h.quando,true)),e(h.motivo||'')])):empty('Nessuna decisione ancora','',"clock"))}`;
 if(x.id==='servizi')return `<div class="card-grid">${x.attivi.map(sv=>`<article class="module-card"><h3>${e(sv.codice)} · ${e(sv.nome)}</h3><ul class="out-list">${sv.include.slice(0,6).map(i=>`<li>${e(i)}</li>`).join('')}</ul><small>Consegne del mese: ${sv.consegneDelMese.fatte} fatte · ${sv.consegneDelMese.inCorso} in corso</small></article>`).join('')}</div>${panel('Servizi consigliati per te',x.consigliati?`<p class="preserve">${e(x.consigliati.testo)}</p><small>${e(x.consigliati.fonte)}</small>`:empty('Nessun consiglio per ora','Le proposte arrivano dal Direttore Crescita dopo l’approvazione dei soci.','star'))}`;
 if(x.id==='report')return panel('Report mensili',x.report.length?x.report.map(r=>`<h3>${e(r.titolo)}</h3><p class="preserve">${e(r.testo)}</p><small>Aggiornato ${e(date(r.aggiornato,true))}</small>`).join(''):empty('Nessun report ancora','',"file"))+notice(`Invio dei report: ${x.invioAutomatico.nota} · PDF: ${x.pdf.nota}`);
 if(x.id==='documenti')return panel('Contratti',contractLinks(x.contratti))+notice('Fatture e pagamenti sono gestiti separatamente dall’agenzia.');
 if(x.id==='crm')return `<div class="stats">${stat('Contatti nel CRM',String(x.contatti),'CRM BigAnt OS','users')}${stat('Iscritti Fidelity',String(x.iscrittiFidelity),'BigAnt Fidelity','card')}</div>${notice(`${x.campagne.stato}: ${x.campagne.nota}`)}`;
 if(x.id==='chiedi'&&isOwner())return panel('Chiedi all’agenzia',notice('Vista in sola lettura: la richiesta è disponibile dall’accesso personale del cliente.'));
 if(x.id==='chiedi')return panel('Chiedi all’agenzia',`<p class="muted">${e(x.nota)}</p><form id="ask-form"><div class="field"><label for="ask-question">La tua domanda o richiesta</label><textarea id="ask-question" name="question" required placeholder="A che punto sono i post del mese?"></textarea></div><label class="check-field section"><input type="checkbox" name="createTask">Crea anche un lavoro per il team</label><button class="btn primary section" type="submit">Invia la richiesta ${icon('arrow')}</button></form><div id="ask-answer" class="preserve section" aria-live="polite"></div>`);
 if(x.id==='profilo')return `<div class="grid-two">${panel('La tua attività',`<dl class="out-obj"><div><dt>Nome</dt><dd>${e(x.azienda.nome)}</dd></div><div><dt>Settore</dt><dd>${e(x.azienda.settore||'—')}</dd></div><div><dt>Indirizzo</dt><dd>${e(x.azienda.indirizzo||'[DA VERIFICARE]')}</dd></div></dl>`)}${panel('Chi ha accesso',`<ul class="out-list">${x.utenti.map(u=>`<li>${e(u.name)} · ${e(u.role==='client'?'Titolare':u.role)}</li>`).join('')}</ul>`)}</div>${panel('Collegamenti alle tue fonti dati',`<div class="kpi-list">${x.fonti.map(f=>`<div class="kpi-row"><div><b>${e(f.nome)}</b><small>${e(f.nota)}</small></div><div class="kpi-val">${statoBadge(f.stato)}</div></div>`).join('')||'<p class="muted">Nessuna fonte necessaria per i servizi attivi.</p>'}</div>`)}${notice(x.notifiche.nota)}`;
 return '';
}
function legacyClienteDashboardView(){
 const d=S.module||{},sezioni=d.sezioni||[],iniz=String(d.clientName||'').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('');
 return (isOwner()?notice('Stai guardando la dashboard del cliente in sola lettura.'):'')+`<header class="page-head client-head"><div class="client-brand"><span class="client-logo" aria-hidden="true">${e(iniz)}</span><div><div class="eyebrow">La tua area clienti · BigAnt</div><h1>${e(d.clientName||'La tua attività')}</h1><p>Come sta andando, cosa stiamo facendo e cosa aspetta la tua decisione.</p></div></div></header>
 ${d.demo?notice('Dati DEMO di prova. Le piattaforme esterne (Google, Meta, sito) non sono ancora collegate: dove manca una fonte lo scriviamo, senza numeri inventati.',true):''}
 <nav class="client-tabs" aria-label="Sezioni della dashboard">${sezioni.map(x=>`<button data-action="vai-sezione" data-id="${e(x.id)}">${e(x.nome)}</button>`).join('')}</nav>
 ${sezioni.map(x=>`<section class="client-section" id="sez-${e(x.id)}"><div class="section-title"><h2>${e(x.nome)}</h2></div>${sezioneCliente(x)}</section>`).join('')}`;
}
Object.assign(ACTIONS,{'vai-sezione':id=>{document.getElementById('sez-'+id)?.scrollIntoView({behavior:'smooth',block:'start'});}});
// Mentre un agente lavora per il cliente, la pagina si aggiorna da sola (senza perdere la posizione).
setInterval(async()=>{
 if(!S.session?.user||S.view!=='client'||document.hidden||$('#dialog').open||S.refreshing)return;
 const home=(S.module?.sezioni||[]).find(x=>x.id==='home');if(!home?.squadra?.some(q=>q.attivo))return;
 S.refreshing=true;try{const y=scrollY;S.module=await api('/api/cliente/dashboard');render();scrollTo(0,y);}catch{}finally{S.refreshing=false;}
},5000);

function clientAreaHeader(){
 const d=S.module||{};
 return (isOwner()?notice('Stai guardando la dashboard del cliente in sola lettura.'):'')+title(d.clientName||'La tua attività','I tuoi servizi e documenti, un passo alla volta.')+(d.demo?notice('Dati DEMO inventati. Le fonti mancanti sono indicate nei singoli servizi.'):'');
}
function clientServicesView(){
 const d=S.module||{},rows=d.sezioni?.find(x=>x.id==='servizi')?.attivi||[];
 if(d.clientId!==S.clientId)return empty('Servizi non disponibili','Aggiorna la pagina per leggere l’attività selezionata.');
 return clientAreaHeader()+`<div class="section-back">${btn('Indietro','goto','client','ghost','arrow')}<span>I tuoi servizi</span></div>`+(rows.length?sectionCards(rows.map(row=>({name:row.nome,value:'Apri il report',route:'client:service/'+row.id,icon:row.id==='fidelity'?'card':'chart'}))):empty('Nessun servizio attivo','L’agenzia completerà qui i servizi concordati per la tua attività.','grid'));
}
function clientSource(row){
 let url=null;try{const u=new URL(row.url);if(u.protocol==='https:'&&!u.username&&!u.password)url=u.href;}catch{}
 return `<small>Fonte: ${e(row.fonte)} · ${row.aggiornato?`Aggiornato ${e(date(row.aggiornato,!row.dateOnly))}`:'Aggiornamento non disponibile'}${url?` · <a href="${e(url)}" target="_blank" rel="noopener noreferrer">Apri la fonte</a>`:''}</small>`;
}
function clientMetricRows(rows){return `<div class="kpi-list">${rows.map(row=>`<div class="kpi-row"><div><b>${e(row.nome)}</b>${clientSource(row)}${row.nota?`<small>${e(row.nota)}</small>`:''}</div><div class="kpi-val">${row.valore===null||row.valore===undefined?'<span class="muted">—</span>':e(row.valore)}${badge(row.stato)}</div></div>`).join('')}</div>`;}
let clientReportExpiryTimer=null;
function clientGoogleReport(g){
 const source={fonte:g.source,aggiornato:g.fetchedAt,url:g.sourceUrl};
 const summary=[['Recensioni totali',g.reviews?.totalReviewCount],['Voto medio',g.reviews?.averageRating]].map(([nome,valore])=>({...source,nome,valore:valore??null,stato:valore===undefined?'Dato non disponibile':'Registrato'}));
 const series=(g.performance?.multiDailyMetricTimeSeries||[]).flatMap(row=>row.dailyMetricTimeSeries||[]);
 const names={WEBSITE_CLICKS:'Clic al sito',CALL_CLICKS:'Clic sul pulsante chiama',BUSINESS_DIRECTION_REQUESTS:'Richieste di indicazioni'};
 const daily=Object.entries(names).map(([key,nome])=>{
  const points=series.find(row=>row.dailyMetric===key)?.timeSeries?.datedValues||[];
  return panel(nome,clientSource(source)+(points.length?table(['Giorno','Valore'],points.map(row=>[e(`${row.date.day}/${row.date.month}/${row.date.year}`),e(row.value)])):empty('Dati non disponibili','Google non ha restituito valori per questo indicatore.')));
 }).join('');
 const reviews=g.reviews?.reviews||[];
 return panel('Google Business Profile',clientMetricRows(summary)+`<p>Periodo delle misure giornaliere: ${e(date(g.from))} – ${e(date(g.to))}. I giorni assenti non valgono zero.</p>`)+daily+panel('Recensioni',clientSource(source)+`<p>Ultime ${reviews.length} recensioni disponibili in questa lettura, fino a 50. L’elenco può essere parziale.</p>`+(reviews.length?reviews.map(row=>`<article class="list-item"><div class="body"><b>${e(row.reviewer?.displayName||'Utente Google')}</b><small>${e(({ONE:'1',TWO:'2',THREE:'3',FOUR:'4',FIVE:'5'})[row.starRating]||'Voto non disponibile')} / 5 · ${e(date(row.updateTime||row.createTime,true))}</small><p class="preserve">${e(row.comment||'Nessun testo')}</p>${row.reviewReply?`<small>Risposta della tua attività</small><p class="preserve">${e(row.reviewReply.comment||'')}</p>`:''}</div></article>`).join(''):empty('Nessuna recensione nella lettura','')));
}
function clientServiceReportView(){
 const d=S.module||{},back=`<div class="section-back">${btn('Indietro','goto','client:servizi','ghost','arrow')}<span>I tuoi servizi</span></div>`;
 if(d.clientId!==S.clientId||!d.service)return clientAreaHeader()+back+empty('Report non disponibile','Torna ai servizi e riprova.');
 clearTimeout(clientReportExpiryTimer);clientReportExpiryTimer=null;
 const google=d.google&&Date.parse(d.google.expiresAt)>Date.now()?d.google:null;
 if(google){const snapshot=viewSnapshot();clientReportExpiryTimer=setTimeout(()=>{if(isCurrentView(snapshot)&&S.module===d){render();load();}},Math.max(1,Date.parse(google.expiresAt)-Date.now()+1));}
 const reports=d.reports||[];
 return clientAreaHeader()+back+`<h2>${e(d.service.nome)}</h2>`+notice(d.note)+(d.publishedReports||[]).map(row=>`<details class="section"><summary>${e(row.period)} · Report verificato</summary>${resultsBody(row,false)}</details>`).join('')+(google?clientGoogleReport(google):'')+reports.map(row=>panel(row.nome,row.metriche.length?clientMetricRows(row.metriche):empty('Report non ancora disponibile','Le misure verranno mostrate qui con fonte e data.'))).join('');
}
function clienteDashboardView(){
 const d=S.module||{};
 if(S.section==='results')return clientResultsView();
 if((S.section||'').startsWith('service/'))return clientServiceReportView();
 if(S.section==='servizi')return clientServicesView();
 if(d.clientId!==S.clientId)return clientAreaHeader()+empty('Attività non disponibile','Aggiorna la pagina.');
 if(S.section==='documenti')return clientAreaHeader()+`<div class="section-back">${btn('Indietro','goto','client','ghost','arrow')}<span>Documenti</span></div>`+panel('I tuoi contratti',contractLinks(d.sezioni?.find(x=>x.id==='documenti')?.contratti||[]))+notice('Qui trovi soltanto i contratti della tua attività. Fatture e pagamenti sono gestiti separatamente dall’agenzia.');
 if(S.section&&!['home','sections'].includes(S.section))return clientAreaHeader()+btn('Torna alla home','goto','client','','arrow')+empty('Sezione non disponibile','I report si trovano nei servizi attivi.');
 const home=d.sezioni?.find(x=>x.id==='home')||{};
 return clientAreaHeader()+workspaceHero('Il tuo spazio.<br>Tutto più chiaro.','Apri un servizio per leggere i suoi dati, oppure consulta i documenti della tua attività.')+sectionCards([
  {name:'I tuoi servizi',value:home.servicesCount||0,note:'Report e fonti, servizio per servizio',route:'client:servizi',icon:'chart'},
  {name:'Documenti',value:home.contractsCount||0,note:'I contratti della tua attività',route:'client:documenti',icon:'file'},
  ...(d.sezioni?.some(row=>row.id==='results')?[{name:'I tuoi risultati',value:'Apri',note:'Obiettivi e lavoro svolto',route:'client:results',icon:'chart'}]:[])
 ]);
}
