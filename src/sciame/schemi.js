// Contratti di uscita degli agenti dello sciame: lo stesso schema vale per ogni motore
// (Claude Code, API, DEMO). Gli schemi sono compatibili con l'output strutturato:
// ogni oggetto chiude le proprietà e le richiede tutte.
const S = {type:'string'}, I = (minimum,maximum)=>({type:'integer',minimum,maximum}), B = {type:'boolean'};
const L = items=>({type:'array',items});
const O = properties=>({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
const E = values=>({type:'string',enum:values});
const comuni = {da_verificare:L(S),fonti_usate:L(S)};

export const FLUSSI = ['crescita','marketing','commerciale','social','local','amministrazione'];

export const schemi = {
 orchestratore:O({sintesi:S,piano:L(O({flusso:E(FLUSSI),motivo:S,brief:S})),escluso:L(O({richiesta:S,motivo:S})),da_verificare:L(S)}),
 'direttore-crescita':O({sintesi:S,
  priorita:L(O({titolo:S,motivo:S,kpi_collegati:L(S),azione:S,costo_stimato:S,tempo_stimato:S,risultato_atteso:S,decisione_richiesta:S})),
  kpi_letti:L(O({nome:S,valore:S,fonte:S})),rischi:L(S),...comuni}),
 marketing:O({sintesi:S,settimana:O({dal:S,al:S}),obiettivo_settimana:S,
  piano:L(O({data:S,giorno:S,canale:S,formato:S,tema:S,obiettivo:S})),
  bozze:L(O({id:S,canale:S,formato:S,titolo:S,testo:S,cta:S,hashtag:L(S),brief_visivo:S,data_proposta:S})),...comuni}),
 'ricerca-clienti':O({sintesi:S,valutazioni:L(O({lead_id:S,azienda:S,punteggio:I(0,100),motivo:S,servizio_consigliato:S,segnali:L(S)})),scelto_lead_id:S,motivo_scelta:S,...comuni}),
 'analisi-gratuita':O({sintesi:S,azienda:S,punteggio_presenza:I(0,100),
  aree:L(O({area:E(['sito','scheda_google','recensioni','social','coerenza_dati','concorrenti']),voto:I(0,10),punti_forza:L(S),problemi:L(S)})),
  azioni_consigliate:L(O({titolo:S,perche:S,servizio_bigant:S})),confronto_concorrenti:L(O({nome:S,nota:S})),invito:S,testo_report:S,...comuni}),
 'proposta-commerciale':O({sintesi:S,pacchetto:S,servizi_inclusi:L(O({codice:S,nome:S,cosa_include:S})),prezzo:O({setup:S,canone_mensile:S,nota:S}),tempi:S,condizioni:L(S),
  email_accompagnamento:O({oggetto:S,testo:S}),testo_proposta:S,...comuni}),
 social:O({sintesi:S,mese:S,pilastri:L(S),piano:L(O({data:S,canale:S,formato:S,tema:S})),
  post:L(O({id:S,canale:S,formato:S,titolo:S,testo:S,cta:S,brief_visivo:S,data_proposta:S})),...comuni}),
 'local-gbp':O({sintesi:S,controlli:L(O({voce:S,stato:E(['ok','da_correggere','mancante']),dettaglio:S,correzione_proposta:S})),
  incoerenze_nap:L(O({campo:S,scheda:S,sito:S,proposta:S})),post_gbp:L(O({id:S,titolo:S,testo:S,cta:S,data_proposta:S})),...comuni}),
 reputazione:O({sintesi:S,risposte:L(O({recensione_id:S,priorita:E(['alta','media','bassa']),sentiment:E(['positiva','neutra','negativa']),risposta:S,nota_interna:S,serve_ok_cliente:B})),
  avvisi:L(S),kit_raccolta:O({messaggio_whatsapp:S,testo_qr:S,istruzioni_staff:S}),...comuni}),
 qualita:O({esito:E(['approvabile','da_correggere','bloccato']),sintesi:S,rilievi:L(O({gravita:E(['bloccante','importante','suggerimento']),regola:S,dove:S,problema:S,correzione:S}))}),
 amministrazione:O({sintesi:S,anomalie:L(O({anomalia_id:S,titolo:S,importo:S,priorita:S,spiegazione:S,verifica_proposta:S,correzione_proposta:S,chi_decide:S})),
  cosa_non_torna_in_breve:L(S),domande_commercialista:L(S),prossimi_passi:L(S),...comuni})
};

// Validatore minimo del sottoinsieme JSON Schema usato sopra (nessuna dipendenza).
export function valida(schema,valore,percorso='uscita'){
 const errori=[];
 (function check(sc,v,p){
  if(sc.type==='object'){
   if(!v||typeof v!=='object'||Array.isArray(v))return errori.push(`${p}: atteso oggetto`);
   for(const k of sc.required||[])if(!(k in v))errori.push(`${p}.${k}: mancante`);
   if(sc.additionalProperties===false)for(const k of Object.keys(v))if(!sc.properties[k])errori.push(`${p}.${k}: campo non previsto`);
   for(const [k,s] of Object.entries(sc.properties||{}))if(k in v)check(s,v[k],`${p}.${k}`);
  }else if(sc.type==='array'){
   if(!Array.isArray(v))return errori.push(`${p}: atteso elenco`);
   v.forEach((x,i)=>check(sc.items,x,`${p}[${i}]`));
  }else if(sc.type==='string'){
   if(typeof v!=='string')return errori.push(`${p}: atteso testo`);
   if(sc.enum&&!sc.enum.includes(v))errori.push(`${p}: valore non ammesso (${v})`);
  }else if(sc.type==='integer'){
   if(!Number.isInteger(v))return errori.push(`${p}: atteso numero intero`);
   if(sc.minimum!==undefined&&v<sc.minimum||sc.maximum!==undefined&&v>sc.maximum)errori.push(`${p}: fuori intervallo`);
  }else if(sc.type==='boolean'&&typeof v!=='boolean')errori.push(`${p}: atteso vero/falso`);
 })(schema,valore,percorso);
 return errori;
}
