// Adapted from BigAnt Growth cfd4b0b/lib/providers.js. Reads public text only.
// Standalone preparation: no route or scheduler imports this reader yet.
import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { BlockList, isIP } from 'node:net';
import { AppError } from './store.js';

const blocked4 = new BlockList();
for (const [address, prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.88.99.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',3]]) blocked4.addSubnet(address,prefix,'ipv4');
const global6 = new BlockList(), blocked6 = new BlockList();
global6.addSubnet('2000::',3,'ipv6');
for (const [address,prefix] of [['2001::',23],['2001:db8::',32],['2002::',16],['3fff::',20]]) blocked6.addSubnet(address,prefix,'ipv6');
export function publicAddress(address) {
 const family=isIP(address);
 return family===4?!blocked4.check(address,'ipv4'):family===6&&global6.check(address,'ipv6')&&!blocked6.check(address,'ipv6');
}
function publicURL(value) {
 let u; try { if(typeof value!=='string'||value.length>2048)throw Error();u=new URL(value); } catch { throw new AppError('Indirizzo web non valido.'); }
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password||(u.port&&!['80','443'].includes(u.port)))throw new AppError('Indirizzo web non consentito.');
 u.hash='';return u;
}
function pageText(html) {
 return html.replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<!--[\s\S]*?-->/g,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim().slice(0,14000);
}
export function createPublicWebsiteReader({lookupImpl=lookup,requestImpl=(url,opts,callback)=>(url.protocol==='https:'?https:http).get(url,opts,callback),clock=()=>new Date(),timeoutMs=12000}={}) {
 return async function readWebsite(value) {
  const deadline=Date.now()+timeoutMs;
  for(let redirects=0;redirects<=3;redirects++) {
   const u=publicURL(value),hostname=u.hostname.replace(/^\[|\]$/g,'');
   let records,timer;
   try {
    records=await Promise.race([lookupImpl(hostname,{all:true}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error()),Math.max(1,deadline-Date.now()));})]);
   } catch { throw new AppError('Impossibile risolvere il sito pubblico. Nessun tentativo automatico.',502); }
   finally {clearTimeout(timer);}
   if(!Array.isArray(records)||!records.length||records.some(row=>!publicAddress(row.address)||isIP(row.address)!==row.family))throw new AppError('Sono consentiti solo siti web pubblici.');
   if(Date.now()>=deadline)throw new AppError('Tempo di consultazione esaurito.',504);
   const result=await new Promise((resolve,reject)=>{
    let finished=false,req;
    const finish=(error,data)=>{if(finished)return;finished=true;clearTimeout(timer);if(error){reject(error);req?.destroy();}else resolve(data);};
    timer=setTimeout(()=>finish(new AppError('Tempo di consultazione esaurito.',504)),Math.max(1,deadline-Date.now()));
    try {
     req=requestImpl(u,{headers:{'User-Agent':'BigAntOS/0.1 (+https://bigantagency.it)','Accept':'text/html,text/plain','Accept-Encoding':'identity'},
      // Pin the actual socket to the validated record: no second DNS resolution.
      lookup:(_host,opts,cb)=>opts.all?cb(null,[records[0]]):cb(null,records[0].address,records[0].family)
     },res=>{
      res.on('error',()=>finish(new AppError('Lettura del sito interrotta.',502)));
      res.on('aborted',()=>finish(new AppError('Lettura del sito interrotta.',502)));
      if(res.statusCode>=300&&res.statusCode<400){if(res.headers.location)finish(null,{redirect:res.headers.location});else finish(new AppError('Reindirizzamento non valido.',502));req?.destroy();return;}
      if(res.statusCode!==200){res.resume();return finish(new AppError(`Sito non consultabile (HTTP ${res.statusCode}).`,502));}
      if(!/^text\/(html|plain)(?:;|$)/i.test(res.headers['content-type']||'')||!['identity',''].includes(res.headers['content-encoding']||'')){res.resume();return finish(new AppError('La pagina non contiene testo consultabile.'));}
      let size=0;const chunks=[];
      res.on('data',chunk=>{if(finished)return;size+=chunk.length;if(size>1_000_000)return finish(new AppError('Pagina troppo grande.'));chunks.push(chunk);});
      res.on('end',()=>finish(null,{html:Buffer.concat(chunks).toString('utf8'),bytes:size}));
     });
     req.on('error',()=>finish(new AppError('Sito non raggiungibile. Nessun tentativo automatico.',502)));
    } catch {finish(new AppError('Consultazione del sito non riuscita.',502));}
   });
   if(result.redirect){if(redirects===3)throw new AppError('Troppi reindirizzamenti.');try{value=new URL(result.redirect,u).href;}catch{throw new AppError('Reindirizzamento non valido.');}continue;}
   return {url:u.href,text:pageText(result.html),retrievedAt:clock().toISOString(),bytes:result.bytes,simulation:false};
  }
 };
}
