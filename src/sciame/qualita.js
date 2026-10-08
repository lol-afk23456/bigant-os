// Controlli automatici di Qualità e compliance, eseguiti dal codice prima dell'agente Qualità.
// Non certificano nulla: segnalano rischi evidenti e i dati che non tornano con il pacchetto.
const testo=v=>JSON.stringify(v??'');
const PROMESSE=/garantit[oaie]|risultat[oi] sicur|100\s?%|il migliore|la migliore|i migliori|numero uno|leader indiscuss|cura (sicura|definitiva)|guarigione (certa|sicura)|senza rischi/i;
const AZIONI_FATTE=/\b(abbiamo|ho|è stat[oa]|sono stat[ie])\s+(pubblicat|inviat|spedit|programmat[oaie] su|caricat)/i;
const SOCIETA=/\bBigAnt\s+(S\.?r\.?l|S\.?p\.?a|società)\b|società BigAnt/i;
const CHIUSURE=/grazie per l['’]attenzione|thank you for watching|grazie per aver guardato/i;

export function controlliAutomatici(agente,output,pacchetto){
 const t=testo(output),r=[];
 const add=(regola,esito,dettaglio)=>r.push({regola,esito,dettaglio});
 add('Promesse assolute o non dimostrabili',PROMESSE.test(t)?'bloccante':'ok',PROMESSE.test(t)?'Trovata una formulazione di risultato garantito o superlativa: '+t.match(PROMESSE)[0]:'Nessuna formulazione vietata trovata.');
 add('Azioni esterne dichiarate come fatte',AZIONI_FATTE.test(t)?'bloccante':'ok',AZIONI_FATTE.test(t)?'Il testo afferma un invio o una pubblicazione: le azioni esterne sono bloccate.':'Nessuna azione esterna dichiarata come eseguita.');
 add('BigAnt presentata come società',SOCIETA.test(t)?'bloccante':'ok',SOCIETA.test(t)?'BigAnt è un marchio di due ditte individuali.':'Corretto.');
 add('Chiusure deboli',CHIUSURE.test(t)?'importante':'ok',CHIUSURE.test(t)?'Formula di chiusura debole da eliminare.':'Corretto.');
 if(Array.isArray(output?.da_verificare))add('Dati mancanti dichiarati','ok',`${output.da_verificare.length} punti [DA VERIFICARE] dichiarati.`);
 if(agente==='direttore-crescita'){
  const n=output?.priorita?.length;add('Esattamente tre priorità',n===3?'ok':'bloccante',`Priorità proposte: ${n}.`);
  const noti=new Map(Object.entries(pacchetto.kpi||{}).map(([k,v])=>[k,String(v.valore)]));
  const falsi=(output?.kpi_letti||[]).filter(k=>noti.has(k.nome)&&noti.get(k.nome)!==String(k.valore));
  add('KPI identici al pacchetto',falsi.length?'bloccante':'ok',falsi.length?'Valori diversi dal pacchetto: '+falsi.map(k=>k.nome).join(', '):'I KPI citati coincidono con i dati aggregati.');
 }
 if(agente==='amministrazione'){
  const attese=new Map((pacchetto.anomalie_rilevate||[]).map(a=>[a.anomalia_id,a.importo])),viste=(output?.anomalie||[]).map(a=>a.anomalia_id);
  const mancanti=[...attese.keys()].filter(id=>!viste.includes(id)),estranee=viste.filter(id=>!attese.has(id)),diversi=(output?.anomalie||[]).filter(a=>attese.has(a.anomalia_id)&&attese.get(a.anomalia_id)!==a.importo);
  add('Tutte le anomalie, nessuna inventata',mancanti.length||estranee.length?'bloccante':'ok',`Mancanti: ${mancanti.length}; non previste: ${estranee.length}.`);
  add('Importi identici al centesimo',diversi.length?'bloccante':'ok',diversi.length?'Importi diversi: '+diversi.map(a=>a.anomalia_id).join(', '):'Importi coincidenti con il motore contabile.');
 }
 if(agente==='reputazione'){
  const attese=(pacchetto.recensioni||[]).map(x=>x.id),viste=(output?.risposte||[]).map(x=>x.recensione_id);
  add('Una risposta per ogni recensione',attese.every(id=>viste.includes(id))&&viste.every(id=>attese.includes(id))?'ok':'bloccante',`Recensioni: ${attese.length}; risposte: ${viste.length}.`);
  const negative=(pacchetto.recensioni||[]).filter(x=>x.voto<=2).map(x=>x.id),senzaOk=(output?.risposte||[]).filter(x=>negative.includes(x.recensione_id)&&!x.serve_ok_cliente);
  add('Negative con ok del cliente',senzaOk.length?'bloccante':'ok',senzaOk.length?'Risposte a recensioni negative senza ok del cliente.':'Corretto.');
 }
 if(agente==='ricerca-clienti'){
  const ids=(pacchetto.candidati||[]).map(c=>c.lead_id);
  add('Lead scelto tra i candidati',ids.includes(output?.scelto_lead_id)?'ok':'bloccante',`Scelto: ${output?.scelto_lead_id||'nessuno'}.`);
 }
 if(agente==='proposta-commerciale'){
  const prezzi=testo(output?.prezzo);
  add('Prezzi marcati da validare',/DA VALIDARE/i.test(prezzi)?'ok':'bloccante','I prezzi del catalogo sono proposte: servono la dicitura [DA VALIDARE].');
 }
 if(['marketing','social'].includes(agente)){
  const elenco=output?.bozze||output?.post||[];
  add('Bozze presenti',elenco.length?'ok':'bloccante',`${elenco.length} bozze.`);
 }
 return r;
}

export function esitoQualita(auto,verdetto){
 if(auto.some(c=>c.esito==='bloccante'))return verdetto?.esito==='bloccato'?'bloccato':'da_correggere';
 return verdetto?.esito||'da_correggere';
}
