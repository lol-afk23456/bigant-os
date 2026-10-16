import {isIP} from 'node:net';
import {AppError} from './store.js';
import {isISODate} from './date-validation.js';

// Read-only Google adapter. No caller-controlled host, write method or retry.
const INFO='https://mybusinessbusinessinformation.googleapis.com/v1/';
const MASK='name,title,storefrontAddress,websiteUri,phoneNumbers,metadata.mapsUri';
export const businessProfileMetrics=['WEBSITE_CLICKS','CALL_CLICKS','BUSINESS_DIRECTION_REQUESTS'];
const malformed=()=>new AppError('Risposta Google Business Profile incompleta o fuori dai limiti.',502);
const object=v=>{if(!v||typeof v!=='object'||Array.isArray(v))throw malformed();return v;};
const string=(v,max=4000)=>{if(typeof v!=='string'||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v))throw malformed();return v;};
const list=(v,max)=>{if(!Array.isArray(v)||v.length>max)throw malformed();return v;};
const optional=(out,input,key,validate)=>{if(Object.hasOwn(input,key))out[key]=validate(input[key]);};
export function businessProfileName(value,kind){if(typeof value!=='string'||!(kind==='account'?/^accounts\/\d{1,64}$/:/^locations\/\d{1,64}$/).test(value))throw new AppError('Riferimento Google non valido.');return value;}
export function businessProfilePageToken(value){if(value===undefined||value==='')return '';if(typeof value!=='string'||value.length>2048||/[\s\p{Cc}\p{Cf}]/u.test(value))throw new AppError('Pagina Google non valida.');return value;}
function publicURL(value,maps=false){
 string(value,2048);let u;try{u=new URL(value);}catch{throw malformed();}
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port||u.hash||/[\s\\\p{Cc}\p{Cf}]/u.test(value)||isIP(u.hostname.replace(/^\[|\]$/g,''))||!u.hostname.includes('.')||!u.hostname.split('.').every(s=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(s))||/(?:^|\.)(?:local|localhost|internal|test|invalid|example|onion|arpa|lan|home)$/.test(u.hostname))throw malformed();
 if(maps){
  const hosts=['google.com','www.google.com','maps.google.com','google.it','www.google.it','maps.google.it'];
  if(u.protocol!=='https:'||!hosts.includes(u.hostname)||!(/^\/maps(?:\/|$)/.test(u.pathname)||(u.hostname.startsWith('maps.')&&u.pathname==='/'))||[...u.searchParams.keys()].some(k=>!['cid','q','query','query_place_id','api','hl','ftid'].includes(k)))throw malformed();
 }
 return u.href;
}
function address(value){const src=object(value),out={};for(const key of ['regionCode','languageCode','postalCode','administrativeArea','locality','sublocality'])optional(out,src,key,v=>string(v,200));optional(out,src,'addressLines',v=>list(v,5).map(x=>string(x,400)));return out;}
function location(value,expected){
 const src=object(value),out={name:businessProfileName(src.name,'location'),title:string(src.title,500)};if(expected&&out.name!==expected)throw malformed();
 optional(out,src,'storefrontAddress',address);optional(out,src,'websiteUri',v=>publicURL(v));
 optional(out,src,'phoneNumbers',v=>{const p=object(v),r={};optional(r,p,'primaryPhone',x=>string(x,80));optional(r,p,'additionalPhones',x=>list(x,5).map(y=>string(y,80)));return r;});
 if(src.metadata&&Object.hasOwn(object(src.metadata),'mapsUri'))out.metadata={mapsUri:publicURL(src.metadata.mapsUri,true)};
 return out;
}
function timestamp(value){string(value,64);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))throw malformed();return value;}
function reviews(value,parent){
 const src=object(value),out={};optional(out,src,'reviews',v=>list(v,50).map(item=>{
  const r=object(item),result={reviewId:string(r.reviewId,500)};if(!result.reviewId)throw malformed();
  optional(result,r,'name',v=>{string(v,800);if(!v.startsWith(parent+'/reviews/')||!/^[-A-Za-z0-9_]+$/.test(v.slice((parent+'/reviews/').length)))throw malformed();return v;});
  optional(result,r,'reviewer',v=>{const person=object(v),p={};optional(p,person,'displayName',x=>string(x,500));optional(p,person,'isAnonymous',x=>{if(typeof x!=='boolean')throw malformed();return x;});return p;});
  optional(result,r,'starRating',v=>{if(!['STAR_RATING_UNSPECIFIED','ONE','TWO','THREE','FOUR','FIVE'].includes(v))throw malformed();return v;});
  optional(result,r,'comment',v=>string(v,20000));for(const key of ['createTime','updateTime'])optional(result,r,key,timestamp);
  optional(result,r,'reviewReply',v=>{const reply=object(v),p={};optional(p,reply,'comment',x=>string(x,10000));optional(p,reply,'updateTime',timestamp);return p;});return result;
 }));
 optional(out,src,'averageRating',v=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>5)throw malformed();return v;});
 optional(out,src,'totalReviewCount',v=>{if(!Number.isSafeInteger(v)||v<0)throw malformed();return v;});
 optional(out,src,'nextPageToken',businessProfilePageToken);return out;
}
function performance(value,from,to){
 const src=object(value),out={},seen=new Set();optional(out,src,'multiDailyMetricTimeSeries',v=>list(v,3).map(group=>{
  const g=object(group),result={};optional(result,g,'dailyMetricTimeSeries',v=>list(v,3).map(item=>{
   const s=object(item);if(!businessProfileMetrics.includes(s.dailyMetric)||seen.has(s.dailyMetric)||s.dailySubEntityType&&Object.keys(object(s.dailySubEntityType)).length)throw malformed();seen.add(s.dailyMetric);
   const metric={dailyMetric:s.dailyMetric};optional(metric,s,'timeSeries',v=>{const series=object(v),r={},dates=new Set();optional(r,series,'datedValues',v=>list(v,28).map(point=>{
    object(point);const d=object(point.date);if(![d.year,d.month,d.day].every(Number.isSafeInteger))throw malformed();const iso=`${String(d.year).padStart(4,'0')}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`;
    if(!isISODate(iso)||iso<from||iso>to||dates.has(iso))throw malformed();dates.add(iso);const p={date:{year:d.year,month:d.month,day:d.day}};
    // Google omits value for a zero-valued point. Preserve the omission, and
    // never add missing days or series; the UI explains this protobuf rule.
    optional(p,point,'value',v=>{if(typeof v!=='string'||!/^\d{1,19}$/.test(v)||BigInt(v)>9223372036854775807n)throw malformed();return v;});return p;
   }));return r;});return metric;
  }));return result;
 }));return out;
}

export function createBusinessProfileProvider({accessToken=async()=>null,allow=()=>false,fetchImpl=globalThis.fetch}={}){
 async function gate(){if(await allow()!==true)throw new AppError('Lettura Google Business Profile non autorizzata.',409);}
 async function get(url){
  await gate();const token=await accessToken();await gate();if(typeof token!=='string'||!token||token.length>16000||/[\s\p{Cc}\p{Cf}]/u.test(token))throw new AppError('Autorizzazione Google non disponibile.',409);
  let response;try{response=await fetchImpl(url,{method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(25000)});}catch{await gate();throw new AppError('Google Business Profile non raggiungibile. Nessun nuovo tentativo automatico.',502);}
  await gate();if(!response.ok){try{await response.body?.cancel();}catch{}await gate();throw new AppError('Lettura Google Business Profile non riuscita. Verifica accesso, quote e scheda scelta.',502);}
  let parsed;try{let size=0;const chunks=[];for await(const chunk of response.body){await gate();size+=chunk.length;if(size>1_000_000)throw malformed();chunks.push(chunk);}parsed=object(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{await gate();throw malformed();}await gate();return parsed;
 }
 return {
  async accounts({pageToken}={}){const url=new URL('https://mybusinessaccountmanagement.googleapis.com/v1/accounts');url.searchParams.set('pageSize','20');if(businessProfilePageToken(pageToken))url.searchParams.set('pageToken',pageToken);const src=await get(url),out={items:[]};if(src.accounts!==undefined)out.items=list(src.accounts,20).map(item=>({name:businessProfileName(object(item).name,'account'),label:string(item.accountName,500)}));optional(out,src,'nextPageToken',businessProfilePageToken);return out;},
  async locations({accountName,pageToken}){businessProfileName(accountName,'account');const url=new URL(INFO+accountName+'/locations');url.search=new URLSearchParams({pageSize:'20',readMask:MASK});if(businessProfilePageToken(pageToken))url.searchParams.set('pageToken',pageToken);const src=await get(url),out={items:[]};if(src.locations!==undefined)out.items=list(src.locations,20).map(v=>location(v));optional(out,src,'nextPageToken',businessProfilePageToken);return out;},
  async location({locationName}){businessProfileName(locationName,'location');const url=new URL(INFO+locationName);url.searchParams.set('readMask',MASK);return location(await get(url),locationName);},
  async reviews({accountName,locationName}){const parent=businessProfileName(accountName,'account')+'/'+businessProfileName(locationName,'location');return reviews(await get(new URL('https://mybusiness.googleapis.com/v4/'+parent+'/reviews?pageSize=50&orderBy=updateTime%20desc')),parent);},
  async performance({locationName,from,to}){businessProfileName(locationName,'location');if(!isISODate(from)||!isISODate(to)||Date.parse(to)-Date.parse(from)!==27*86400000)throw new AppError('Periodo Google non valido.');const url=new URL('https://businessprofileperformance.googleapis.com/v1/'+locationName+':fetchMultiDailyMetricsTimeSeries');for(const metric of businessProfileMetrics)url.searchParams.append('dailyMetrics',metric);for(const [side,date] of [['start',from],['end',to]])for(const [i,key] of ['year','month','day'].entries())url.searchParams.set('dailyRange.'+side+'_date.'+key,String(Number(date.split('-')[i])));return performance(await get(url),from,to);}
 };
}
