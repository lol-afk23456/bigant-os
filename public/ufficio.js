'use strict';
// Ufficio virtuale: lo sciame "al lavoro", letto dal registro reale (os_sciame_passi, os_jobs, os_audit).
// Nessuna animazione inventata: ogni stato, ogni riga del flusso e il testo in diretta vengono dal database.
const STATI_UFFICIO={libero:'Libero',al_lavoro:'Al lavoro',in_attesa_approvazione:'In attesa di approvazione',errore:'Errore'};
const STATI_PASSO_UI={in_coda:'In coda',al_lavoro:'Al lavoro',controllo_qualita:'Controllo qualità',in_attesa_approvazione:'In attesa di un socio',completato:'Completato',bloccato_qualita:'Fermato da Qualità',errore:'Errore'};
const tonoPasso=st=>st==='completato'?'green':st==='errore'||st==='bloccato_qualita'?'red':'orange';
const usd=micro=>micro?`${(micro/1e6).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:4})} USD`:'0 USD';
const fa=v=>{if(!v)return '—';const s=Math.max(0,Math.round((Date.now()-new Date(v))/1000));return s<60?`${s} s fa`:s<3600?`${Math.round(s/60)} min fa`:s<86400?`${Math.round(s/3600)} h fa`:date(v,true);};
const iniziali=nome=>String(nome||'?').replace(/[^A-Za-zÀ-ÿ ]/g,' ').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join('');
const toneMotore=stato=>stato==='OPERATIVO'?'green':stato==='DEMO'?'orange':'red';

// Il motore scrive JSON: per la diretta si mostrano le parole, senza parentesi e virgolette.
const leggibile=t=>String(t||'').replace(/\\n/g,' ').replace(/\\"/g,'’').replace(/"([a-z_]+)"\s*:/gi,(m,k)=>' '+k.replaceAll('_',' ')+': ').replace(/[{}\[\]"]/g,' ').replace(/\s+/g,' ').replace(/\s+([,.:;])/g,'$1').trim();
const durata=da=>{const s=Math.max(0,Math.round((Date.now()-new Date(da))/1000));return s<60?`${s} s`:`${Math.floor(s/60)} min ${s%60} s`;};
const FASI={in_attesa:'si collega al motore…',ragionamento:'sta ragionando…',scrittura:'sta scrivendo',finito:'ha finito, passa a Qualità'};
function diretta(d){
 const t=leggibile(d.testo);
 return `<span class="desk-live" aria-live="polite"><small><b class="live-dot"></b>${e(FASI[d.fase]||d.fase)} · da ${e(durata(d.inizio))}${d.cliente?' · '+e(clientName(d.cliente)):''}</small>${t?`<span class="desk-stream">${e(t.slice(-260))}<i class="caret" aria-hidden="true"></i></span>`:''}</span>`;
}
function scrivania(a){
 const u=a.ultimoOutput,apri=a.diretta?.passoId||u?.passoId||'';
 return `<button class="desk desk-${e(a.stato)}" data-action="ufficio-postazione" data-id="${e(apri)}" aria-label="${e(a.nome)}: ${e(STATI_UFFICIO[a.stato])}" ${apri?'':'data-vuota="1"'}>
  <span class="desk-top"><span class="desk-avatar" aria-hidden="true">${e(iniziali(a.nome))}</span><span class="desk-name"><b>${e(a.nome)}</b><small>${a.sciame?'Motore AI':'Procedura locale'}</small></span></span>
  <span class="desk-state"><i aria-hidden="true"></i>${e(STATI_UFFICIO[a.stato]||a.stato)}</span>
  <span class="desk-task">${a.compito?e(a.compito):'<span class="muted">Nessun compito in corso</span>'}</span>
  ${a.diretta?diretta(a.diretta):''}
  <span class="desk-last">${u?`<b>Ultimo output</b> · ${e(fa(u.quando))}<br>${e(u.sintesi||u.titolo||'')}`:'<span class="muted">Ancora nessuna esecuzione registrata</span>'}</span>
  <span class="desk-foot"><span>${u?e(u.motoreEtichetta):'—'}</span><span>${e(usd(a.costoMeseUsdMicro))} nel mese</span></span>
 </button>`;
}
function rigaFeed(f){
 const d=f.detail||{},extra=[d.motore&&`motore ${d.motore}`,d.costoUsdMicro?usd(d.costoUsdMicro):null,d.esito&&`esito ${d.esito}`].filter(Boolean).join(' · ');
 return `<li><time datetime="${e(f.created_at)}">${e(new Date(f.created_at).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',second:'2-digit'}))}</time><div><b>${e(f.action)}</b><small>${e(f.actor||'Sistema')}${f.client_id?' · '+e(clientName(f.client_id)):''}${extra?' · '+e(extra):''}</small></div></li>`;
}
function ufficioCorpo(){
 const u=S.module||{},m=u.motore||{},tutti=(u.stanze||[]).flatMap(s=>s.agenti),lavoro=tutti.filter(a=>a.stato==='al_lavoro').length,attesa=tutti.filter(a=>a.stato==='in_attesa_approvazione').length,errori=tutti.filter(a=>a.stato==='errore').length;
 return `<div class="office-status">
   <article class="stat emphasis"><div class="stat-label">Motore</div><div class="stat-value office-engine">${e(m.etichetta||'—')}</div><div class="stat-note">${badge(m.statoCollegamento||'—',toneMotore(m.statoCollegamento))} ${e(m.motivo||'')}</div></article>
   ${stat('Al lavoro ora',String(lavoro),u.inCorso?.length?`${u.inCorso.length} giro in corso`:'Nessun giro in corso','bolt')}
   ${stat('In attesa di un socio',String(attesa),'Azioni esterne bloccate finché non c’è collegamento e ok','approval')}
   ${stat('Errori o fermi Qualità',String(errori),'Motivo visibile nella postazione','info')}
  </div>
  ${u.autoApprovazioneDemo?notice('Modalità DEMO: i passaggi interni (bozze, revisioni, avanzamenti) si approvano da soli e restano registrati come “auto-approvato (DEMO)”. Pubblicare, inviare, spendere e modificare account restano bloccati dal codice.',true):''}
  <div class="office">
   <div class="office-floor">${(u.stanze||[]).map(s=>`<section class="room ${s.agenti.length>3?'wide':''}" aria-label="Stanza ${e(s.nome)}"><header><h2>${e(s.nome)}</h2><span>${s.agenti.filter(a=>a.stato==='al_lavoro').length?`<b class="live-dot"></b>${s.agenti.filter(a=>a.stato==='al_lavoro').length} al lavoro`:`${s.agenti.length} postazioni`}</span></header><div class="desks">${s.agenti.map(scrivania).join('')}</div></section>`).join('')}</div>
   <aside class="office-feed" aria-label="Attività in tempo reale"><header><h2>In tempo reale</h2><small>Aggiornato ${e(new Date(u.aggiornatoAlle||Date.now()).toLocaleTimeString('it-IT'))}</small></header><ol>${(u.feed||[]).map(rigaFeed).join('')||'<li><div><b>Nessuna attività registrata</b></div></li>'}</ol></aside>
  </div>
  ${panel('Ultimi giri dello sciame',(u.giri||[]).length?`<div class="list">${u.giri.map(g=>`<button class="list-item office-row" data-action="ufficio-giro" data-id="${e(g.id)}"><span><b>${e(g.richiesta)}</b><small>${e(date(g.created_at,true))} · motore ${e(g.motore)} · ${e(usd(g.costo_usd_micro))}${g.origine!=='locale'?' · '+e(g.origine):''}</small></span>${badge({completato:'Completato',completato_con_errori:'Con errori',in_corso:'In corso',in_coda:'In coda',errore:'Errore'}[g.stato]||g.stato,g.stato==='completato'?'green':['in_corso','in_coda'].includes(g.stato)?'orange':'red')}</button>`).join('')}</div>`:empty('Nessun giro ancora','Avvia un giro: ogni agente comparirà al lavoro nella sua stanza.','agents'),'',`Tetto mensile: ${money(u.budget?.availableCents)} disponibili su ${money((u.budget?.capCents||0)-(u.budget?.fixedCents||0))} per gli agenti`)}
  ${panel('Azioni verso l’esterno bloccate',(u.azioniBloccate||[]).length?`<div class="list">${u.azioniBloccate.slice(0,12).map(a=>`<div class="list-item office-row"><span><b>${e(a.descrizione)}</b><small>${e(clientName(a.client_id))} · ${e(date(a.created_at,true))}</small></span>${badge('blocked','red')}</div>`).join('')}</div>`:empty('Nessuna azione esterna richiesta','Qui compaiono pubblicazioni, invii e modifiche che il codice blocca.','shield'))}`;
}
function ufficioView(){
 const azioni=`${btn('Avvia un giro','ufficio-avvia','','primary','play')}${btn('Aggiorna','refresh','','','refresh')}`;
 return title('Ufficio virtuale','Lo sciame al lavoro, stanza per stanza. Ogni stato viene dal registro delle esecuzioni, aggiornato in automatico.',azioni)+`<div id="ufficio-root">${ufficioCorpo()}</div>`;
}
function valore(v){
 if(v===null||v===undefined||v==='')return '<span class="muted">—</span>';
 if(Array.isArray(v))return v.length?`<ul class="out-list">${v.map(x=>`<li>${valore(x)}</li>`).join('')}</ul>`:'<span class="muted">Nessuna voce</span>';
 if(typeof v==='object')return `<dl class="out-obj">${Object.entries(v).map(([k,x])=>`<div><dt>${e(k.replaceAll('_',' '))}</dt><dd>${valore(x)}</dd></div>`).join('')}</dl>`;
 return `<span class="out-text">${e(String(v))}</span>`;
}
function mostraPasso(p){
 const q=p.qualita?.verdetto,ap=p.approvazione;
 dialog(`${p.compito}`,`<div class="out-meta">${badge(STATI_PASSO_UI[p.stato]||p.stato,tonoPasso(p.stato))}<span>Motore: <b>${e(p.motoreEtichetta)}</b></span><span>Durata ${Math.round((p.durata_ms||0)/1000)} s</span><span>Costo ${e(usd(p.costo_usd_micro))}</span>${p.esito_qualita?`<span>Qualità: <b>${e(p.esito_qualita)}</b></span>`:''}</div>
  ${p.errore?notice(p.errore,true):''}
  ${ap?notice(`Approvazione: ${label(ap.status)}${ap.reason?' · '+ap.reason:''}${ap.decision_at?' · '+date(ap.decision_at,true):''}`):''}
  ${(p.azioni||[]).length?notice('Azioni esterne bloccate: '+p.azioni.map(a=>a.descrizione).join(' · '),true):''}
  ${q?`<details class="out-quality"><summary>Controllo Qualità: ${e(q.esito)} · ${q.rilievi.length} rilievi</summary>${valore(q)}</details>`:''}
  ${['al_lavoro','controllo_qualita'].includes(p.stato)?`<div class="live-transcript" aria-live="polite"><small><b class="live-dot"></b>${e(FASI[p.diretta_fase]||'si collega al motore…')} · da ${e(durata(p.started_at||p.created_at))} · si aggiorna da solo</small><p>${e(leggibile(p.diretta))||'<span class="muted">In attesa delle prime parole…</span>'}<i class="caret" aria-hidden="true"></i></p></div>`:`<div class="out-body">${p.output?valore(p.output):'<p class="muted">Nessun output salvato.</p>'}</div>`}
  <details><summary>Dati di input (DEMO) passati all’agente</summary>${valore(p.input)}</details>`);
}
async function aggiornaUfficio(){
 if(!(S.view==='agents'&&S.section==='office'))return;
 S.module=await api('/api/sciame/ufficio',{scoped:false});S.lastRefresh=Date.now();
 const root=$('#ufficio-root');if(root)root.innerHTML=ufficioCorpo();
}
Object.assign(ACTIONS,{
 'ufficio-postazione':async id=>{if(!id)return toast('Questa postazione non ha ancora un output dello sciame.');S.passoAperto=id;mostraPasso(await api('/api/sciame/passi/'+encodeURIComponent(id),{scoped:false}));},
 'ufficio-giro':async id=>{const g=await api('/api/sciame/giri/'+encodeURIComponent(id),{scoped:false});dialog('Giro dello sciame',`${notice(`${g.richiesta} · motore ${g.motore} · ${g.stato}`)}<div class="list">${g.passi.map(p=>`<button class="list-item office-row" data-action="ufficio-postazione" data-id="${e(p.id)}"><span><b>${p.ordine}. ${e(p.compito)}</b><small>${e(p.agente)} · ${e(p.flusso)} · ${e(usd(p.costo_usd_micro))}${p.esito_qualita?' · qualità '+e(p.esito_qualita):''}</small></span>${badge(STATI_PASSO_UI[p.stato]||p.stato,tonoPasso(p.stato))}</button>`).join('')}</div>`);},
 'ufficio-avvia':async()=>{const flussi=(S.module?.flussi||[]);form('Avvia un giro dello sciame',[{name:'richiesta',label:'Cosa deve fare lo sciame?',type:'textarea',required:true,full:true,value:'Piano marketing di BigAnt della prossima settimana, analisi gratuita di un’azienda DEMO e controllo della prima nota.'},{html:`<label>Reparti (facoltativo: se non scegli, decide l’Orchestratore)</label><div class="service-checks">${flussi.map(f=>`<label><input type="checkbox" name="flussi" value="${e(f.id)}">${e(f.reparto)} — ${e(f.cosa_fa)}</label>`).join('')}</div>`}],async(b,fd)=>{const scelti=fd.getAll('flussi');const g=await mutate('/api/sciame/giri',{richiesta:b.richiesta,flussi:scelti.length?scelti:null});$('#dialog').close();toast(`Giro avviato con motore ${g.motore}: guarda le postazioni.`);await aggiornaUfficio();},{submit:'Avvia',intro:`Motore attuale: ${S.module?.motore?.etichetta||'—'}. Solo dati DEMO; nessuna azione verso l’esterno.`});}
});
// Ogni 2 secondi: ufficio e, se è aperta, la diretta dell'agente scelto (finché lavora).
async function aggiornaDiretta(){
 const id=S.passoAperto;if(!id||!$('#dialog').open)return;
 const p=await api('/api/sciame/passi/'+encodeURIComponent(id),{scoped:false});
 if(S.passoAperto===id&&$('#dialog').open&&$('#dialog-title')?.textContent===p.compito){const prima=$('.live-transcript');if(prima||['al_lavoro','controllo_qualita'].includes(p.stato))mostraPasso(p);}
}
setInterval(()=>{if(!S.session?.user||!(S.view==='agents'&&S.section==='office')||document.hidden||S.refreshing)return;S.refreshing=true;($('#dialog').open?aggiornaDiretta():aggiornaUfficio()).catch(()=>{}).finally(()=>{S.refreshing=false;});},2000);
