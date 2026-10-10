import {isIP} from 'node:net';
import {AppError} from './store.js';

const channels=[['instagram','Instagram'],['facebook','Facebook'],['linkedin','LinkedIn aziendale'],['tiktok','TikTok'],['google-business','Google Business Profile'],['website','Sito web']];
const channelIds=new Set(channels.map(([id])=>id));
const hasHost=(url,...hosts)=>hosts.includes(url.hostname);
const noQuery=url=>!url.search;
const onePath=(url,pattern,reserved=[])=>noQuery(url)&&pattern.test(url.pathname)&&!reserved.includes(url.pathname.replace(/^\/|\/$/g,'').toLowerCase());
const googleHosts=['google.com','www.google.com','maps.google.com','google.it','www.google.it','maps.google.it'];

// Syntax validation only: no DNS, redirects or HTTP requests. It establishes
// neither ownership nor that a hostname resolves to a public address today.
function publicURL(value){
 if(typeof value!=='string'||!value.trim()||value.length>2048)throw new AppError('Inserisci un URL pubblico HTTPS valido.');
 const raw=value.trim();if(/[\s\\\p{Cc}\p{Cf}]/u.test(raw)||raw.includes('#')||/%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/i.test(raw)||/\/(?:\.|%2e){1,2}(?:\/|[?#]|$)/i.test(raw))throw new AppError('L’URL contiene parti non consentite.');
 let url;try{url=new URL(raw);}catch{throw new AppError('Inserisci un URL pubblico HTTPS valido.');}
 const host=url.hostname;
 if(url.protocol!=='https:'||url.username||url.password||url.port||isIP(host.replace(/^\[|\]$/g,''))||host.length>253||!host.includes('.')||host.endsWith('.')||!host.split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))||/^[0-9]+$/.test(host.split('.').at(-1))||/(?:^|\.)(?:localhost|local|localdomain|internal|intranet|lan|home|corp|test|invalid|example|onion|arpa)$/.test(host))throw new AppError('Sono ammessi solo indirizzi HTTPS di siti pubblici, senza accessi o porte speciali.');
 if(raw.includes('?')&&!url.search)throw new AppError('Rimuovi la query vuota dall’URL.');
 return url;
}
function parameters(url,allowed){
 const keys=[...url.searchParams.keys()];return new Set(keys).size===keys.length&&keys.every(key=>allowed.includes(key));
}
function facebookURL(url){
 if(!hasHost(url,'facebook.com','www.facebook.com','m.facebook.com'))return false;
 if(url.pathname==='/profile.php')return parameters(url,['id'])&&/^\d{5,25}$/.test(url.searchParams.get('id')||'');
 if(url.search)return false;
 if(/^\/pages\/[A-Za-z0-9._-]{1,150}\/\d{5,25}\/?$/.test(url.pathname))return true;
 return onePath(url,/^\/[A-Za-z0-9][A-Za-z0-9._-]{0,99}\/?$/,['login','login.php','logout','signup','recover','help','privacy','policies','settings','dialog','oauth','sharer','sharer.php','share','share.php','groups','events','watch','marketplace','gaming','reel','reels','stories','story.php','photo','photo.php','photos','permalink.php','pages','search','business','ads','adsmanager']);
}
function googleURL(url){
 if(hasHost(url,'maps.app.goo.gl'))return onePath(url,/^\/[A-Za-z0-9_-]{5,100}\/?$/);
 if(hasHost(url,'g.page'))return noQuery(url)&&(/^\/[A-Za-z0-9_-]{2,100}\/?$/.test(url.pathname)||/^\/r\/[A-Za-z0-9_-]{5,100}\/?$/.test(url.pathname));
 if(hasHost(url,'g.co'))return onePath(url,/^\/kgs\/[A-Za-z0-9_-]{3,100}\/?$/);
 if(!googleHosts.includes(url.hostname))return false;
 const path=url.pathname,mapsRoot=/^\/maps\/?$/.test(path)||(url.hostname.startsWith('maps.')&&path==='/'),search=/^\/maps\/search\/?$/.test(path),place=/^\/maps\/place\/[^/]+(?:\/[^/]+)*\/?$/.test(path);
 if(!mapsRoot&&!search&&!place)return false;
 if(!url.search)return place;
 if(!parameters(url,['cid','q','api','query','query_place_id','hl']))return false;
 const q=url.searchParams,keys=[...q.keys()];
 if(q.has('hl')&&!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(q.get('hl')))return false;
 if(q.has('api')&&q.get('api')!=='1')return false;
 if(q.has('cid'))return mapsRoot&&/^\d{1,25}$/.test(q.get('cid'))&&keys.every(k=>['cid','hl'].includes(k));
 const query=q.get('q')||q.get('query');
 if(!query?.trim()||query.length>200||/[\p{Cc}\p{Cf}<>#&?]/u.test(query)||/https?:|javascript:|data:/i.test(query)||(q.has('q')&&q.has('query')))return false;
 if(q.has('query_place_id')&&(!q.has('query')||!/^[A-Za-z0-9_-]{5,200}$/.test(q.get('query_place_id'))))return false;
 return mapsRoot||search||place;
}
function channelURL(channel,value){
 const url=publicURL(value);let valid=false;
 if(channel==='instagram')valid=hasHost(url,'instagram.com','www.instagram.com')&&onePath(url,/^\/[A-Za-z0-9_](?:[A-Za-z0-9._]{0,28}[A-Za-z0-9_])?\/?$/,['p','reel','reels','stories','explore','accounts','direct','about','legal','developer','web','challenge','oauth','privacy','terms'])&&!url.pathname.includes('..');
 if(channel==='facebook')valid=facebookURL(url);
 if(channel==='linkedin')valid=hasHost(url,'linkedin.com','www.linkedin.com')&&onePath(url,/^\/company\/[A-Za-z0-9][A-Za-z0-9-]{0,99}\/?$/);
 if(channel==='tiktok')valid=hasHost(url,'tiktok.com','www.tiktok.com')&&onePath(url,/^\/@[A-Za-z0-9_](?:[A-Za-z0-9._]{0,22}[A-Za-z0-9_])?\/?$/)&&!url.pathname.includes('..');
 if(channel==='google-business')valid=googleURL(url);
 if(channel==='website')valid=noQuery(url);
 if(!valid)throw new AppError('Inserisci il link pubblico del profilo aziendale di questo canale, senza parametri superflui.');return url.href;
}
function sourceURL(value){const url=publicURL(value);if(url.search&&!googleURL(url)&&!facebookURL(url))throw new AppError('La fonte non può contenere parametri di accesso o query non necessarie.');return url.href;}

export function createProfileDirectory({store,clock=()=>new Date()}){
 store.db.exec(`CREATE TABLE IF NOT EXISTS os_profile_links(client_id TEXT NOT NULL REFERENCES os_clients(id),channel TEXT NOT NULL CHECK(channel IN ('instagram','facebook','linkedin','tiktok','google-business','website')),version INTEGER NOT NULL CHECK(version>0),url TEXT NOT NULL,source_url TEXT NOT NULL,confirmed_by TEXT NOT NULL REFERENCES os_users(id),updated_at TEXT NOT NULL,PRIMARY KEY(client_id,channel,version));
 CREATE TRIGGER IF NOT EXISTS os_profile_links_no_update BEFORE UPDATE ON os_profile_links BEGIN SELECT RAISE(ABORT,'Storico profili immutabile'); END;
 CREATE TRIGGER IF NOT EXISTS os_profile_links_no_delete BEFORE DELETE ON os_profile_links BEGIN SELECT RAISE(ABORT,'Storico profili immutabile'); END;`);
 function access(user,clientId,{write=false}={}){
  if(!user||typeof user.id!=='string'||user.active===0||user.active===false||user.id==='os-orchestrator')throw new AppError('Accesso ai profili non autorizzato.',403);
  const current=store.one('SELECT id,role,tenant_id,active,must_change_password FROM os_users WHERE id=?',user.id);
  if(!current?.active||current.must_change_password||!['owner','client'].includes(current.role)||(write&&current.role!=='owner')||typeof clientId!=='string'||!clientId||clientId.length>160||!store.one('SELECT id FROM os_clients WHERE id=? AND active=1',clientId)||(current.role==='client'&&current.tenant_id!==clientId))throw new AppError('Attività o profili non accessibili.',403);
  return current;
 }
 function state(user,clientId){
  const current=access(user,clientId),latest=new Map();for(const row of store.query('SELECT channel,url,source_url,version,updated_at FROM os_profile_links WHERE client_id=? ORDER BY version DESC',clientId))if(!latest.has(row.channel))latest.set(row.channel,row);
  return {clientId,canEdit:current.role==='owner',items:channels.map(([id,name])=>{const row=latest.get(id);return {id,name,status:'Da collegare',lastSync:null,metrics:null,reviews:null,link:row?{url:row.url,sourceUrl:row.source_url,version:row.version,updatedAt:row.updated_at,confirmation:'owner'}:null};})};
 }
 function save(user,clientId,channel,body){
  access(user,clientId,{write:true});if(!channelIds.has(channel))throw new AppError('Canale non disponibile.',404);
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(key=>!['version','url','sourceUrl','confirmedBusiness'].includes(key)))throw new AppError('Richiesta non valida: sono ammessi soltanto link, fonte, versione e conferma.');
  if(!Number.isSafeInteger(body.version)||body.version<0||body.confirmedBusiness!==true)throw new AppError('Indica la versione e conferma che il profilo appartenga all’attività selezionata.');
  const url=channelURL(channel,body.url),source=sourceURL(body.sourceUrl);
  return store.transaction(()=>{const current=access(user,clientId,{write:true}),old=store.one('SELECT MAX(version) version FROM os_profile_links WHERE client_id=? AND channel=?',clientId,channel)?.version||0;if(old!==body.version)throw new AppError('Il profilo è stato aggiornato: riapri la scheda prima di salvare.',409);const version=old+1,updatedAt=clock().toISOString();
   store.run('INSERT INTO os_profile_links VALUES(?,?,?,?,?,?,?)',clientId,channel,version,url,source,current.id,updatedAt);store.audit(current,clientId,'Profilo pubblico aggiornato',channel,{channel,version,confirmation:'owner'},'admin');return state(current,clientId);
  });
 }
 return {state,save};
}
