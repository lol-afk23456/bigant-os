// Motore DEMO: regole deterministiche che rispettano gli stessi contratti degli agenti AI.
// Serve ai test automatici. Ogni testo dichiara di essere prodotto da regole, non da un modello.
const MARCA='[Motore DEMO deterministico]';
const giorni=['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
const addGiorni=(data,n)=>{const d=new Date(data+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const giorno=data=>giorni[new Date(data+'T12:00:00Z').getUTCDay()];

export function cervelloDemo(agente,p={}){
 const base={da_verificare:['Output generato da regole DEMO: nessuna valutazione AI'],fonti_usate:['pacchetto']};
 switch(agente){
  case 'orchestratore':{
   const r=String(p.richiesta||'').toLowerCase(),scelti=[];
   const mappa=[['crescita',/kpi|priorit|crescita|direttore/],['marketing',/marketing|editorial|post|bigant/],['commerciale',/analisi|commercial|lead|propost|cliente/],['social',/social|s01/],['local',/gbp|google|recension|local|s06|s08/],['amministrazione',/prima nota|amministr|cosa non torna|contabil/]];
   for(const [id,re] of mappa)if(re.test(r))scelti.push(id);
   const disponibili=(p.flussi_disponibili||[]).map(f=>f.id),piano=(scelti.length?scelti:disponibili).filter(id=>disponibili.includes(id));
   return {sintesi:`${MARCA} ${piano.length} flussi scelti per parole chiave.`,piano:piano.map(flusso=>({flusso,motivo:'Parola chiave presente nella richiesta',brief:'Eseguire il flusso standard su dati DEMO.'})),escluso:/pubblic|invia|spend/.test(r)?[{richiesta:'Azioni verso l’esterno',motivo:'Bloccate dal codice: servono ok del socio e collegamento.'}]:[],da_verificare:[]};
  }
  case 'direttore-crescita':{
   const kpi=Object.entries(p.kpi||{}).map(([nome,v])=>({nome,valore:String(v.valore),fonte:v.fonte}));
   const pr=(titolo,motivo,azione)=>({titolo,motivo,kpi_collegati:kpi.slice(0,2).map(k=>k.nome),azione,costo_stimato:'[DA VERIFICARE]',tempo_stimato:'[DA VERIFICARE]',risultato_atteso:'Decisione dei soci registrata',decisione_richiesta:'Approvare o rinviare'});
   return {...base,sintesi:`${MARCA} Tre priorità standard dal catalogo.`,priorita:[pr('Pacchetto Presenza ai clienti attuali','Primo upsell indicato dal catalogo','Preparare offerta pilota'),pr('Analisi gratuita come porta d’ingresso','Priorità 2 del playbook','Produrre un’analisi per un lead DEMO'),pr('Consegne in ritardo','Controllo carico','Riassegnare i lavori scaduti')],kpi_letti:kpi,rischi:['Prezzi non validati']};
  }
  case 'marketing':{
   const dal=p.settimana?.dal||p.oggi,canali=(p.canali||[]).map(c=>c.nome);
   const piano=Array.from({length:5},(_,i)=>{const data=addGiorni(dal,i);return {data,giorno:giorno(data),canale:canali[i%Math.max(1,canali.length)]||'Instagram',formato:i%2?'Carosello':'Post',tema:['Metodo','Dietro le quinte','Domanda frequente','Servizio','Persone'][i],obiettivo:'Notorietà locale'};});
   return {...base,sintesi:`${MARCA} Piano di 5 uscite.`,settimana:{dal,al:p.settimana?.al||addGiorni(dal,6)},obiettivo_settimana:'Far conoscere il metodo BigAnt [DA VERIFICARE obiettivo numerico]',piano,bozze:piano.slice(0,4).map((x,i)=>({id:`bozza-${i+1}`,canale:x.canale,formato:x.formato,titolo:`${x.tema} · DEMO`,testo:`${MARCA} Bozza sul tema ${x.tema}.`,cta:'Scrivici per un confronto',hashtag:['#BigAnt','#Caserta'],brief_visivo:'Foto di lavoro autorizzata [DA VERIFICARE]',data_proposta:x.data}))};
  }
  case 'ricerca-clienti':{
   const valutazioni=(p.candidati||[]).map((c,i)=>({lead_id:c.lead_id,azienda:c.azienda,punteggio:80-i*10,motivo:`${MARCA} ordine di inserimento`,servizio_consigliato:'Siti web',segnali:Object.values(c.segnali||{}).slice(0,2)}));
   return {...base,sintesi:`${MARCA} ${valutazioni.length} candidati ordinati.`,valutazioni,scelto_lead_id:valutazioni[0]?.lead_id||'',motivo_scelta:'Primo candidato'};
  }
  case 'analisi-gratuita':{
   const aree=['sito','scheda_google','recensioni','social','coerenza_dati','concorrenti'].map(area=>({area,voto:5,punti_forza:[],problemi:[`${MARCA} da valutare`]}));
   return {...base,sintesi:`${MARCA} Analisi standard.`,azienda:p.azienda?.nome||'',punteggio_presenza:50,aree,azioni_consigliate:[1,2,3].map(n=>({titolo:`Azione ${n}`,perche:MARCA,servizio_bigant:'S17'})),confronto_concorrenti:[],invito:'Fissiamo una chiamata di 20 minuti.',testo_report:`# Analisi DEMO\n\n${MARCA}`};
  }
  case 'proposta-commerciale':
   return {...base,sintesi:`${MARCA} Proposta standard.`,pacchetto:p.pacchetto?.nome||'BigAnt Presenza',servizi_inclusi:(p.pacchetto?.composizione||[]).map(c=>({codice:c.slice(0,3),nome:c,cosa_include:'Come da scheda servizio'})),prezzo:{setup:p.pacchetto?.setup_proposto||'[DA VALIDARE]',canone_mensile:p.pacchetto?.canone_proposto||'[DA VALIDARE]',nota:'Prezzi da validare dai soci'},tempi:'[DA VERIFICARE]',condizioni:['Durata minima [DA DEFINIRE]'],email_accompagnamento:{oggetto:'Proposta DEMO',testo:MARCA},testo_proposta:`# Proposta DEMO\n\n${MARCA}`};
  case 'social':{
   const dal=p.oggi,post=Array.from({length:p.pacchetto?.contenuti_mese||8},(_,i)=>({id:`post-${i+1}`,canale:(p.pacchetto?.canali||['Instagram'])[i%2]||'Instagram',formato:i<(p.pacchetto?.reel||2)?'Reel':'Post',titolo:`Contenuto ${i+1} · DEMO`,testo:`${MARCA} Testo nella voce del cliente.`,cta:'Passa in bottega',brief_visivo:'Foto del laboratorio [DA VERIFICARE]',data_proposta:addGiorni(dal,7+i*3)}));
   return {...base,sintesi:`${MARCA} Piano mensile.`,mese:p.mese||'',pilastri:['Mani e materia','Persone','Novità'],piano:post.map(x=>({data:x.data_proposta,canale:x.canale,formato:x.formato,tema:x.titolo})),post};
  }
  case 'local-gbp':
   return {...base,sintesi:`${MARCA} Controllo scheda.`,controlli:[{voce:'Descrizione',stato:p.scheda_google?.descrizione?'ok':'mancante',dettaglio:'Campo descrizione',correzione_proposta:'Scrivere descrizione [DA VERIFICARE]'}],incoerenze_nap:['telefono','indirizzo','orari'].filter(k=>p.scheda_google?.[k]&&p.dati_sito?.[k]&&p.scheda_google[k]!==p.dati_sito[k]).map(campo=>({campo,scheda:p.scheda_google[campo],sito:p.dati_sito[campo],proposta:'Allineare al dato confermato dal cliente [DA VERIFICARE]'})),post_gbp:[1,2,3,4].map(n=>({id:`gbp-${n}`,titolo:`Post ${n} · DEMO`,testo:MARCA,cta:'Chiama',data_proposta:addGiorni(p.oggi,n*7)}))};
  case 'reputazione':
   return {...base,sintesi:`${MARCA} Risposte standard.`,risposte:(p.recensioni||[]).map(r=>({recensione_id:r.id,priorita:r.voto<=2?'alta':'bassa',sentiment:r.voto<=2?'negativa':r.voto===3?'neutra':'positiva',risposta:`${MARCA} Grazie per il riscontro.`,nota_interna:'',serve_ok_cliente:r.voto<=3})),avvisi:(p.recensioni||[]).filter(r=>r.voto<=2).map(r=>`Recensione negativa ${r.id}`),kit_raccolta:{messaggio_whatsapp:MARCA,testo_qr:MARCA,istruzioni_staff:MARCA}};
  case 'qualita':
   return {esito:(p.controlli_automatici||[]).some(c=>c.esito==='bloccante')?'da_correggere':'approvabile',sintesi:`${MARCA} Esito dai controlli automatici.`,rilievi:(p.controlli_automatici||[]).filter(c=>c.esito!=='ok').map(c=>({gravita:c.esito==='bloccante'?'bloccante':'importante',regola:c.regola,dove:'output',problema:c.dettaglio,correzione:'Correggere secondo la regola'}))};
  case 'amministrazione':
   return {...base,sintesi:`${MARCA} ${(p.anomalie_rilevate||[]).length} anomalie riportate.`,anomalie:(p.anomalie_rilevate||[]).map(a=>({anomalia_id:a.anomalia_id,titolo:a.titolo,importo:a.importo,priorita:a.priorita,spiegazione:MARCA,verifica_proposta:'Controllare documento e conto',correzione_proposta:'Proposta da confermare dal socio',chi_decide:'Un socio'})),cosa_non_torna_in_breve:[],domande_commercialista:[],prossimi_passi:[]};
  default:throw new Error('Agente DEMO sconosciuto: '+agente);
 }
}
