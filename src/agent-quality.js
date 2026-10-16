import {AppError,requireClient} from './store.js';
import {schemi,valida} from './sciame/schemi.js';
import {controlliAutomatici} from './sciame/qualita.js';

export const reviewableStates=['IDEA','IN PRODUZIONE','DA APPROVARE'];

export function qualityDraft(store,clientId,contentId){
 if(typeof contentId!=='string'||!contentId||contentId.length>150)throw new AppError('Scegli una bozza social da controllare.');
 const row=store.one('SELECT id,title,body,version,state,source,service FROM os_contents WHERE id=? AND client_id=?',contentId,clientId);
 if(!row)throw new AppError('Bozza non trovata per questa attività.',404);
 if(row.service!=='social'||!reviewableStates.includes(row.state))throw new AppError('Scegli una bozza social ancora in lavorazione o da approvare.',409);
 if(!row.source?.trim())throw new AppError('Indica la fonte della bozza prima della revisione.',409);
 return row;
}

export function qualityAssessment(output,context){
 if(valida(schemi.qualita,output).length||!output.sintesi.trim()||output.sintesi.length>4000||output.rilievi.length>30
  ||output.rilievi.some(row=>['regola','dove','problema','correzione'].some(key=>!row[key].trim()||row[key].length>2000))
  ||(output.esito!=='approvabile'&&!output.rilievi.length)
  ||(output.esito==='approvabile'&&output.rilievi.some(row=>row.gravita!=='suggerimento'))
  ||(output.esito!=='bloccato'&&output.rilievi.some(row=>row.gravita==='bloccante')))
  throw new AppError('Revisione qualità incompleta o incoerente.',502);
 const automatic=controlliAutomatici('social',{post:[{titolo:context.draft.title,testo:context.draft.body}]},context);
 const verdict=automatic.some(row=>row.esito==='bloccante')?'bloccato':automatic.some(row=>row.esito==='importante')&&output.esito==='approvabile'?'da_correggere':output.esito;
 return {contentId:context.draft.id,version:context.draft.version,title:context.draft.title,verdict,summary:output.sintesi,findings:output.rilievi,automatic};
}

// Only the review is projected to the team; provider configuration, costs and
// the private packet remain in the owner's work log.
export function latestQualityReview(store,clientId,contentId){
 if(!store.one("SELECT 1 FROM sqlite_master WHERE type='table' AND name='os_agent_work'"))return null;
 const row=store.one("SELECT j.id,j.result,j.finished_at,w.packet_json FROM os_jobs j JOIN os_agent_work w ON w.job_id=j.id WHERE j.client_id=? AND j.agent='quality' AND j.status='done' AND json_extract(w.packet_json,'$.context.draft.id')=? ORDER BY j.finished_at DESC,j.rowid DESC LIMIT 1",clientId,contentId);
 if(!row)return null;
 const review=JSON.parse(row.result).review,context=JSON.parse(row.packet_json).context;
 if(!review||!context?.draft)return null;
 return {...review,id:row.id,at:row.finished_at,current:qualityReviewCurrent(store,clientId,context)};
}

export function qualityReviewCurrent(store,clientId,context){
 const draft=context?.draft;
 const current=draft&&store.one('SELECT title,body,version,source,service FROM os_contents WHERE client_id=? AND id=?',clientId,draft.id);
 const memory=store.query("SELECT kind,content,version,source FROM os_memory WHERE client_id=? AND visibility IN('internal','client') AND kind IN('master','dna','strategy','feedback','agent-feedback:social') ORDER BY kind",clientId);
 return !!current&&['title','body','version','source','service'].every(key=>current[key]===draft[key])&&JSON.stringify(memory)===JSON.stringify(context.memory);
}

export function readQualityReview(store,user,clientId,contentId){
 const actor=user?.id&&store.one("SELECT * FROM os_users WHERE id=? AND active=1 AND must_change_password=0 AND id<>'os-orchestrator'",user.id);
 if(!actor||!['owner','collaborator'].includes(actor.role))throw new AppError('Revisione riservata al team BigAnt.',403);
 requireClient(store,actor,clientId);
 const client=store.one('SELECT services_json FROM os_clients WHERE id=? AND active=1',clientId);
 if(!client||!JSON.parse(client.services_json).includes('social'))throw new AppError('Servizio social non attivo per questa attività.',403);
 if(!store.one("SELECT 1 FROM os_contents WHERE id=? AND client_id=? AND service='social'",contentId,clientId))throw new AppError('Bozza non trovata per questa attività.',404);
 return latestQualityReview(store,clientId,contentId);
}
