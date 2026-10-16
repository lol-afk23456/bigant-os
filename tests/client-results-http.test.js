import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.js';

async function fixture(t) {
  const app=createApp({env:{},clock:()=>new Date('2026-10-10T10:00:00Z')});
  t.after(()=>app.close());
  const handler=app.server.listeners('request')[0],origin='http://127.0.0.1:4330';
  // The real HTTP handler, with invented in-memory records and no listening socket.
  async function invoke(method,path,body,headers={}) {
    const chunks=[],outHeaders={};
    const req={method,url:path,headers:{host:'127.0.0.1:4330',origin,'content-type':'application/json',...headers},socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){if(body!==undefined)yield Buffer.from(JSON.stringify(body));}};
    const res={headersSent:false,statusCode:200,setHeader(k,v){outHeaders[k.toLowerCase()]=v;},writeHead(status,values){this.statusCode=status;this.headersSent=true;for(const [k,v]of Object.entries(values||{}))this.setHeader(k,v);},end(chunk){if(chunk!==undefined)chunks.push(Buffer.from(chunk));}};
    await handler(req,res);
    const raw=Buffer.concat(chunks).toString('utf8');
    return {status:res.statusCode,data:String(outHeaders['content-type']||'').includes('json')?JSON.parse(raw):raw,headers:outHeaders};
  }
  const users={};
  for(const [role,id]of [['owner','demo-owner'],['team','demo-collaborator'],['client','demo-client'],['other','demo-client-other']]) {
    const login=await invoke('POST','/api/demo/login',{profile:id});
    users[role]={cookie:login.headers['set-cookie'].split(';')[0],'x-csrf-token':login.data.csrf};
  }
  const request=(role,path,method='GET',body)=>invoke(method,path,body,users[role]||{});
  return {...app,request};
}

test('risultati HTTP: report verificato nel servizio e nella home, isolamento e revoca persistente',async t=>{
 const f=await fixture(t),base='/api/client-results',scope='?clientId=demo-bottega';
 for(const role of ['client','other','team'])assert.equal((await f.request(role,base+'/index')).status,403);
 assert.equal((await f.request('owner',base+'/index')).data.items.length,2);
 const body={period:'2026-10',version:0,summary:'REPORT_INVENTATO',nextSteps:'',entries:[{kind:'result',serviceId:'social',title:'Contatti',value:0,target:null,unit:'contatti',date:'2026-10-01',source:'Archivio inventato',url:'https://example.com/report'}]};
 assert.equal((await f.request('client',base+'/save'+scope,'POST',body)).status,403);
 const saved=await f.request('owner',base+'/save'+scope,'POST',body);assert.equal(saved.status,200);const report=saved.data.report;
 assert.deepEqual((await f.request('client','/api/cliente/results')).data.reports,[]);
 assert.ok(!(await f.request('client','/api/cliente/dashboard')).data.sezioni.some(x=>x.id==='results'));
 assert.equal((await f.request('owner',base+'/publish'+scope,'POST',{id:report.id,version:1,confirmed:false})).status,400);
 assert.equal((await f.request('owner',base+'/publish'+scope,'POST',{id:report.id,version:1,confirmed:true})).status,200);
 const client=await f.request('client','/api/cliente/results'),preview=await f.request('owner','/api/cliente/results'+scope);
 assert.equal(client.status,200);assert.deepEqual(client.data,preview.data);assert.equal(client.data.reports[0].entries[0].value,0);
 assert.ok((await f.request('client','/api/cliente/dashboard')).data.sezioni.some(x=>x.id==='results'));
 assert.equal((await f.request('client','/api/cliente/services/social')).data.publishedReports.length,1);
 assert.deepEqual((await f.request('client','/api/cliente/services/website')).data.publishedReports,[]);
 assert.equal((await f.request('other','/api/cliente/results'+scope)).status,403);
 assert.equal((await f.request('client',base+scope)).status,403);
 assert.equal((await f.request('owner',base+'/hide'+scope,'POST',{id:report.id,version:99})).status,409);
 assert.equal((await f.request('owner','/api/clients/demo-bottega','PATCH',{services:['website']})).status,200);
 assert.equal((await f.request('owner','/api/clients/demo-bottega','PATCH',{services:['social','local','fidelity','website']})).status,200);
 assert.deepEqual((await f.request('client','/api/cliente/results')).data.reports,[]);
});
