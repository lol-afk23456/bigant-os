import {AppError} from './store.js';
import {isISODate} from './date-validation.js';

// Facebook Login user token; no OAuth, token storage, writes, retries or caller URLs.
const GRAPH='https://graph.facebook.com/v26.0/';
const PAGE_FIELDS='id,name,instagram_business_account';
const DAY=86400000;
export const metaFacebookMetrics=Object.freeze(['page_media_view','page_total_media_view_unique','page_post_engagements','page_daily_follows_unique','page_daily_unfollows_unique']);
export const metaInstagramMetrics=Object.freeze(['views','reach','total_interactions']);
export const metaProfileScopes=Object.freeze({facebook:Object.freeze(['pages_show_list','pages_read_engagement','read_insights']),instagram:Object.freeze(['pages_show_list','pages_read_engagement','instagram_basic','instagram_manage_insights'])});
const malformed=()=>new AppError('Risposta Meta incompleta o fuori dai limiti.',502);
const denied=()=>new AppError('Lettura Meta non autorizzata.',409);
const unavailable=()=>new AppError('Autorizzazione Meta non disponibile.',409);
const object=value=>{if(!value||typeof value!=='object'||Array.isArray(value))throw malformed();return value;};
const list=(value,max)=>{if(!Array.isArray(value)||value.length>max)throw malformed();return value;};
const string=(value,max=500)=>{if(typeof value!=='string'||value.length>max||/[\p{Cc}\p{Cf}]/u.test(value))throw malformed();return value;};
const count=value=>{if(!Number.isSafeInteger(value)||value<0)throw malformed();return value;};
const id=(value,response=false)=>{if(typeof value!=='string'||!/^\d{1,64}$/.test(value))throw response?malformed():new AppError('Riferimento Meta non valido.');return value;};
const cursor=(value,response=false)=>{if(value===undefined||value==='')return '';if(typeof value!=='string'||value.length>2048||/[\s\p{Cc}\p{Cf}]/u.test(value))throw response?malformed():new AppError('Pagina Meta non valida.');return value;};
const token=value=>{if(typeof value!=='string'||!value||value.length>16000||/[\s\p{Cc}\p{Cf}]/u.test(value))throw unavailable();return value;};
const url=(path,params={})=>{const result=new URL(GRAPH+path);result.search=new URLSearchParams(params);return result;};
function page(value,expected){
 const src=object(value),out={id:id(src.id,true),name:string(src.name),instagramId:null};
 if(expected&&out.id!==expected)throw malformed();
 if(src.instagram_business_account!==undefined&&src.instagram_business_account!==null)out.instagramId=id(object(src.instagram_business_account).id,true);
 return out;
}
function permissions(value){
 const scopes=[],seen=new Set();
 for(const raw of list(value.data??[],200)){
  const item=object(raw),scope=string(item.permission,100);
  if(!/^[a-z][a-z0-9_]*$/.test(scope)||seen.has(scope)||!['granted','declined','expired'].includes(item.status))throw malformed();
  seen.add(scope);if(item.status==='granted')scopes.push(scope);
 }
 return scopes;
}
function dateRange(from,to){
 if(!isISODate(from)||!isISODate(to))throw new AppError('Periodo Meta non valido.');
 const start=Date.parse(from),end=Date.parse(to);
 if(end<start||end-start>27*DAY)throw new AppError('Periodo Meta non valido.');
 // Instagram documents inclusive Unix boundaries. Do not include the next day.
 return {since:String(start/1000),until:String((end+DAY)/1000-1)};
}
function metricBase(value,profileId,allowed,seen){
 const src=object(value);
 if(!allowed.includes(src.name)||seen.has(src.name)||src.period!=='day'||src.id!==`${profileId}/insights/${src.name}/day`)throw malformed();
 seen.add(src.name);return src;
}
function pointDate(endTime,from,to){
 string(endTime,64);
 if(!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)$/.test(endTime)||!isISODate(endTime.slice(0,10))||!Number.isFinite(Date.parse(endTime)))throw malformed();
 // Meta daily values are labelled by the END of the bucket (the next date).
 // Keep Meta's calendar boundary; never sum unique daily viewers into reach.
 const date=new Date(Date.parse(endTime.slice(0,10))-DAY).toISOString().slice(0,10);
 if(date<from||date>to)throw malformed();return date;
}
function facebookMetrics(value,profileId,from,to){
 const seen=new Set();return list(value.data??[],metaFacebookMetrics.length).map(raw=>{
  const src=metricBase(raw,profileId,metaFacebookMetrics,seen),dates=new Set(),points=[];
  for(const rawPoint of list(src.values??[],28)){
   const p=object(rawPoint),date=pointDate(p.end_time,from,to);
   if(dates.has(date))throw malformed();dates.add(date);
   // Missing values stay missing: an absent observation is never a zero.
   if(p.value!==undefined&&p.value!==null)points.push({date,value:count(p.value)});
  }
  points.sort((a,b)=>a.date.localeCompare(b.date));return {name:src.name,kind:'series',points};
 });
}
function instagramMetrics(value,profileId){
 const seen=new Set();return list(value.data??[],metaInstagramMetrics.length).map(raw=>{
  const src=metricBase(raw,profileId,metaInstagramMetrics,seen),out={name:src.name,kind:'total'};
  if(src.total_value!==undefined&&src.total_value!==null){const total=object(src.total_value);if(total.value!==undefined&&total.value!==null)out.value=count(total.value);}
  return out;
 });
}
function instagramGrowth(value,profileId){
 const rows=list(value.data??[],1);if(!rows.length)return {status:'not_available'};
 const src=metricBase(rows[0],profileId,['follows_and_unfollows'],new Set());
 if(src.total_value===undefined||src.total_value===null)return {status:'not_available'};
 const total=object(src.total_value);if(total.value!==undefined&&total.value!==null)count(total.value);
 const breakdowns=list(total.breakdowns??[],1);if(!breakdowns.length)return {status:'not_available'};
 const breakdown=object(breakdowns[0]);if(!Array.isArray(breakdown.dimension_keys)||breakdown.dimension_keys.length!==1||breakdown.dimension_keys[0]!=='follow_type')throw malformed();
 const out={status:'incomplete'},seen=new Set();let unknownMissing=false;
 const fields={FOLLOWER:'follows',NON_FOLLOWER:'unfollows',UNKNOWN:'unclassified'};
 for(const raw of list(breakdown.results??[],3)){
  const result=object(raw),dimensions=list(result.dimension_values,1),key=string(dimensions[0],32);
  if(dimensions.length!==1||!Object.hasOwn(fields,key)||seen.has(key))throw malformed();seen.add(key);
  if(result.value!==undefined&&result.value!==null)out[fields[key]]=count(result.value);
  else if(key==='UNKNOWN')unknownMissing=true;
 }
 if(Number.isSafeInteger(out.follows)&&Number.isSafeInteger(out.unfollows)&&!unknownMissing&&(!Object.hasOwn(out,'unclassified')||out.unclassified===0)){
  out.net=out.follows-out.unfollows;out.status='available';
 }
 return out;
}
function profile(value,expected,instagram=false){
 const src=object(value);if(id(src.id,true)!==expected)throw malformed();
 const out={id:src.id,name:src.name===undefined&&instagram?'':string(src.name)};
 if(instagram&&src.username!==undefined){const username=string(src.username,30);if(!/^[a-zA-Z0-9._]{1,30}$/.test(username))throw malformed();out.username=username;if(!out.name)out.name=username;}
 if(src.followers_count!==undefined&&src.followers_count!==null)out.followers=count(src.followers_count);
 return out;
}

export function createMetaProfileProvider({accessToken=async()=>null,allow=()=>false,fetchImpl=globalThis.fetch}={}){
 async function gate(){let allowed;try{allowed=await allow();}catch{throw denied();}if(allowed!==true)throw denied();}
 async function userToken(){await gate();let value;try{value=await accessToken();}catch{await gate();throw unavailable();}await gate();return token(value);}
 async function get(request,bearer){
  await gate();let response;
  try{response=await fetchImpl(request,{method:'GET',headers:{Authorization:'Bearer '+token(bearer),Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(25000)});}
  catch{await gate();throw new AppError('Meta non raggiungibile. Nessun nuovo tentativo automatico.',502);}
  try{
   await gate();
   if(!response.ok||response.redirected){throw new AppError('Lettura Meta non riuscita. Verifica permessi e profilo scelto.',502);}
   const length=response.headers?.get('content-length');if(length!==null&&length!==undefined&&(!/^\d+$/.test(length)||Number(length)>1_000_000))throw malformed();
   let size=0;const chunks=[];
   if(!response.body)throw malformed();
   for await(const chunk of response.body){await gate();if(!(chunk instanceof Uint8Array))throw malformed();size+=chunk.byteLength;if(size>1_000_000)throw malformed();chunks.push(chunk);await gate();}
   await gate();let parsed;try{parsed=object(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{throw malformed();}
   if(Object.hasOwn(parsed,'error'))throw new AppError('Lettura Meta non riuscita. Verifica permessi e profilo scelto.',502);
   await gate();return parsed;
  }catch(error){
   try{await response.body?.cancel();}catch{}
   await gate();if(error instanceof AppError)throw error;throw malformed();
  }
 }
 async function readPage(pageId,bearer,withToken=false){return get(url(pageId,{fields:PAGE_FIELDS+(withToken?',access_token,followers_count':'')}),bearer);}
 return {
  async permissions(){const bearer=await userToken();const result=permissions(await get(url('me/permissions'),bearer));await gate();return result;},
  async pages({after}={}){
   const next=cursor(after),bearer=await userToken(),params={fields:PAGE_FIELDS,limit:'25'};if(next)params.after=next;
   const src=await get(url('me/accounts',params),bearer),seen=new Set(),out={items:list(src.data??[],25).map(raw=>{const item=page(raw);if(seen.has(item.id))throw malformed();seen.add(item.id);return item;})};
   if(src.paging!==undefined){
    const paging=object(src.paging),after=paging.cursors===undefined?'':cursor(object(paging.cursors).after,true);
    // Meta can include cursors even on the last page. next is only an end flag.
    if(paging.next!==undefined&&paging.next!==null){if(typeof paging.next!=='string'||!paging.next||!after)throw malformed();out.after=after;}
   }
   // Never copy or follow paging.next: Meta may include a credential in it.
   await gate();return out;
  },
  async page({pageId}){id(pageId);const bearer=await userToken(),out=page(await readPage(pageId,bearer),pageId);await gate();return out;},
  async report({pageId,instagramId,channel,from,to}){
   id(pageId);if(!['facebook','instagram'].includes(channel))throw new AppError('Canale Meta non valido.');
   if(instagramId!==undefined&&instagramId!==null)id(instagramId);if(channel==='instagram')id(instagramId);
   const range=dateRange(from,to),bearer=await userToken(),granted=permissions(await get(url('me/permissions'),bearer));
   if(metaProfileScopes[channel].some(scope=>!granted.includes(scope)))throw new AppError('Permessi Meta di lettura insufficienti per il canale scelto.',409);
   const rawPage=await readPage(pageId,bearer,channel==='facebook'),selected=page(rawPage,pageId);
   let result,request;
   if(channel==='instagram'){
    if(selected.instagramId!==instagramId)throw new AppError('Il profilo Instagram non corrisponde alla Pagina scelta.',409);
    const raw=await get(url(instagramId,{fields:'id,name,username,followers_count'}),bearer),account=profile(raw,instagramId,true);
    request=url(instagramId+'/insights',{metric:metaInstagramMetrics.join(','),period:'day',metric_type:'total_value',...range});
    const metrics=instagramMetrics(await get(request,bearer),instagramId);
    let growth={status:'below_threshold'};
    if(account.followers===undefined||account.followers>=100){
     const growthRequest=url(instagramId+'/insights',{metric:'follows_and_unfollows',period:'day',metric_type:'total_value',breakdown:'follow_type',...range});
     growth={...instagramGrowth(await get(growthRequest,bearer),instagramId),sourceUrl:growthRequest.href};
    }
    // Recheck the relationship after the report transport as well as before it.
    if(page(await readPage(pageId,bearer),pageId).instagramId!==instagramId)throw new AppError('Il collegamento Instagram è cambiato durante la lettura.',409);
    result={profile:account,metrics,growth};
   }else{
    const pageToken=token(rawPage.access_token);request=url(pageId+'/insights',{metric:metaFacebookMetrics.join(','),period:'day',...range});
    result={profile:profile(rawPage,pageId),metrics:facebookMetrics(await get(request,pageToken),pageId,from,to)};
   }
   await gate();return {...result,sourceUrl:request.href};
  }
 };
}
