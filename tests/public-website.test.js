import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createPublicWebsiteReader,publicAddress} from '../src/public-website.js';

const publicRecords=[{address:'8.8.8.8',family:4}];
function fakePages(pages,observed=[]) {
 return (url,options,callback)=>{
  const req=new EventEmitter();req.destroy=()=>{};observed.push({url:url.href,options});
  queueMicrotask(()=>{const page=pages.shift(),res=new EventEmitter();res.statusCode=page.status||200;res.headers={'content-type':'text/html',...page.headers};res.resume=()=>{};callback(res);for(const chunk of page.chunks||[page.html||''])res.emit('data',Buffer.from(chunk));res.emit('end');});return req;
 };
}
test('indirizzi locali, riservati, multicast e IPv4 mappato rifiutati; soltanto unicast pubblico',()=>{
 for(const address of ['127.0.0.1','10.4.0.1','169.254.169.254','172.16.0.1','192.168.1.1','100.64.0.1','198.18.0.1','192.0.2.1','203.0.113.5','255.255.255.255','::1','::ffff:8.8.8.8','fc00::1','fe80::1','2001:db8::1','2002:808:808::1','3fff::1','not-an-ip'])assert.equal(publicAddress(address),false,address);
 for(const address of ['8.8.8.8','1.1.1.1','2001:4860:4860::8888','2606:4700:4700::1111'])assert.equal(publicAddress(address),true,address);
});
test('testo con fonte e data, script esclusi; socket vincolato al DNS verificato, senza cookie o credenziali',async()=>{
 const observed=[],reader=createPublicWebsiteReader({lookupImpl:async()=>publicRecords,requestImpl:fakePages([{html:'<h1>Azienda &amp; servizi</h1><script>segreto()</script><style>css</style><p>Video</p>'}],observed),clock:()=>new Date('2026-10-10T12:00:00Z')});
 const result=await reader('https://company.test/#anchor');assert.equal(result.text,'Azienda & servizi Video');assert.equal(result.url,'https://company.test/');assert.equal(result.retrievedAt,'2026-10-10T12:00:00.000Z');assert.equal(result.simulation,false);
 const options=observed[0].options;assert.equal(options.headers.Cookie,undefined);assert.equal(options.headers.Authorization,undefined);
 options.lookup('company.test',{},(error,address,family)=>{assert.equal(error,null);assert.equal(address,'8.8.8.8');assert.equal(family,4);});
 options.lookup('company.test',{all:true},(error,records)=>assert.deepEqual(records,publicRecords));
});
test('DNS misto o reindirizzamento verso rete privata bloccati prima della richiesta',async()=>{
 let calls=0;
 const requestImpl=()=>{calls++;throw Error('Mai chiamato');};
 const mixed=createPublicWebsiteReader({lookupImpl:async()=>[...publicRecords,{address:'127.0.0.1',family:4}],requestImpl});
 await assert.rejects(mixed('https://company.test'),/solo siti web pubblici/);assert.equal(calls,0);
 const observed=[],redirect=createPublicWebsiteReader({lookupImpl:async host=>host==='company.test'?publicRecords:[{address:'127.0.0.1',family:4}],requestImpl:fakePages([{status:302,headers:{location:'http://127.0.0.1/admin'}}],observed)});
 await assert.rejects(redirect('https://company.test'),/solo siti web pubblici/);assert.equal(observed.length,1);
 for(const url of ['file:///etc/passwd','https://secret:password@company.test','http://company.test:22'])await assert.rejects(mixed(url),/non consentito/);
});
test('limiti su contenuto, dimensioni, redirect e tempo; nessun errore di rete rivela segreti',async()=>{
 const reader=pages=>createPublicWebsiteReader({lookupImpl:async()=>publicRecords,requestImpl:fakePages(pages)});
 await assert.rejects(reader([{headers:{'content-type':'application/pdf'}}])('https://company.test'),/testo consultabile/);
 await assert.rejects(reader([{chunks:['x'.repeat(1_000_001)]}])('https://company.test'),/troppo grande/);
 await assert.rejects(reader(Array.from({length:4},()=>({status:302,headers:{location:'/next'}})))('https://company.test'),/Troppi/);
 const timed=createPublicWebsiteReader({lookupImpl:()=>new Promise(()=>{}),timeoutMs:5});await assert.rejects(timed('https://company.test'),/Impossibile risolvere/);
 const failure=createPublicWebsiteReader({lookupImpl:async()=>{throw Error('password-riservata');}});await assert.rejects(failure('https://company.test'),e=>!e.message.includes('password-riservata'));
});
