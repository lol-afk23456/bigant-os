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

test('Email marketing HTTP: servizio acquistato, titolarità, scritture e anteprima senza contaminare Fidelity',async t=>{
 const f=await fixture(t),s=f.store,cid='demo-bottega';
 const scoped='/api/email-marketing/contacts?clientId='+cid;
 assert.equal((await f.request('client',scoped)).status,403);
 for(const id of [cid,'demo-studio'])s.run('UPDATE os_clients SET services_json=? WHERE id=?',JSON.stringify(['email-marketing','fidelity']),id);
 const input={email:'http-contact@example.com',name:'Contatto HTTP inventato',consentDate:'2026-10-09',source:'Modulo HTTP inventato',privacyVersion:'v1',confirmed:true};
 assert.equal((await f.request('',scoped)).status,401);
 assert.equal((await f.request('team',scoped,'POST',input)).status,403);
 const added=await f.request('client',scoped,'POST',input);assert.equal(added.status,201);
 const list=await f.request('client',scoped);assert.equal(list.status,200);assert.equal(list.data.items[0].email,input.email);
 assert.equal((await f.request('other',scoped)).status,403);
 const path='/api/email-marketing/contacts/'+added.data.id;
 assert.equal((await f.request('other',path+'/history?clientId=demo-studio')).status,404);
 const preview=await f.request('owner','/api/cliente/services/email-marketing?clientId='+cid);
 const customer=await f.request('client','/api/cliente/services/email-marketing?clientId='+cid);assert.deepEqual(preview.data,customer.data);
 const withdrawn=await f.request('client',path+'/consent?clientId='+cid,'POST',{version:1,status:'withdrawn',source:'Revoca HTTP inventata'});assert.equal(withdrawn.status,200);
 assert.equal((await f.request('client',scoped)).data.counts.withdrawn,1);
 assert.equal((await f.request('client',path+'/consent?clientId='+cid,'POST',{version:1,status:'withdrawn',source:'Doppia'})).status,409);
 s.run('UPDATE os_clients SET services_json=? WHERE id=?',JSON.stringify(['fidelity']),cid);
 assert.equal((await f.request('owner',scoped)).status,403);
 assert.equal((await f.request('client','/api/cliente/services/email-marketing?clientId='+cid)).status,403);
 assert.equal((await f.request('client','/api/cliente/services/fidelity?clientId='+cid)).status,200);
});
