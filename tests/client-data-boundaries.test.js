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

test('area cliente: overview e anagrafica minima non consegnano bozze, fonti, memoria o dati interni',async t=>{
  const f=await fixture(t),s=f.store;
  s.run("UPDATE os_contents SET state='IDEA',body='INTERNAL_DRAFT_FIXTURE',source='INTERNAL_SOURCE_FIXTURE' WHERE id='content-demo'");
  s.run("UPDATE os_approvals SET reason='INTERNAL_REASON_FIXTURE' WHERE id='approval-demo'");
  s.run("UPDATE os_memory SET content='CLIENT_MEMORY_FIXTURE',source='MEMORY_SOURCE_FIXTURE',visibility='client' WHERE client_id='demo-bottega' AND kind='master'");
  s.run("UPDATE os_clients SET risk='risk',services_json='[\"social\",\"local\",\"growth\",\"fidelity\"]' WHERE id='demo-bottega'");
  for(const state of ['IDEA','DA APPROVARE','APPROVATO']) {
    s.run("UPDATE os_contents SET state=? WHERE id='content-demo'",state);
    const r=await f.request('client','/api/overview');
    assert.equal(r.status,200);
    for(const key of ['tasks','contents','approvals','activity','memory'])assert.deepEqual(r.data[key],[],key);
    for(const marker of ['INTERNAL_DRAFT_FIXTURE','INTERNAL_SOURCE_FIXTURE','INTERNAL_REASON_FIXTURE','CLIENT_MEMORY_FIXTURE','MEMORY_SOURCE_FIXTURE','workerError','risk','stage'])assert.ok(!JSON.stringify(r.data).includes(marker),marker);
    assert.equal(r.data.currentClient.id,'demo-bottega');
    assert.ok(!r.data.currentClientServices.includes('growth'));
    assert.ok(r.data.registry.services.every(service=>Object.keys(service).sort().join(',')==='id,name'));
    assert.deepEqual(r.data.registry.integrations,[]);
  }
  const clients=await f.request('client','/api/clients');
  assert.equal(clients.status,200);assert.equal(clients.data.items.length,1);
  assert.deepEqual(Object.keys(clients.data.items[0]).sort(),['id','name','services_json']);
  assert.ok(!JSON.parse(clients.data.items[0].services_json).includes('growth'));
  assert.equal((await f.request('client','/api/overview?clientId=demo-studio')).status,403);
  assert.equal((await f.request('other','/api/overview?clientId=demo-bottega')).status,403);
  for(const role of ['owner','team']) {
    const r=await f.request(role,'/api/overview?clientId=demo-bottega');
    assert.equal(r.status,200);assert.ok(JSON.stringify(r.data).includes('INTERNAL_DRAFT_FIXTURE'));
  }
});

test('area cliente: vecchie rotte produzione e Chiedi sono chiuse sul server senza creare lavori',async t=>{
  const f=await fixture(t),s=f.store;
  const before=s.one('SELECT count(*) n FROM os_tasks').n;
  for(const [method,path,body]of [
    ['GET','state'],['GET','memory'],['GET','memory/history'],['GET','memory/export'],
    ['POST','ask',{question:'Richiesta inventata',createTask:true}],
    ['POST','contents',{service:'social',title:'Bozza inventata',body:'Testo'}],
    ['PATCH','contents/content-demo',{version:1,body:'Modifica inventata'}],
    ['POST','tasks',{service:'social',title:'Lavoro inventato'}],
    ['POST','memory',{kind:'master',content:'Memoria inventata'}],
    ['POST','approvals/approval-demo',{decision:'approved'}]
  ]) assert.equal((await f.request('client','/api/production/'+path,method,body)).status,403,path);
  assert.equal(s.one('SELECT count(*) n FROM os_tasks').n,before);
  assert.equal(s.one("SELECT status FROM os_approvals WHERE id='approval-demo'").status,'pending');
  const client=s.one("SELECT * FROM os_users WHERE id='demo-client'");
  await assert.rejects(f.production.handle({method:'POST',path:'/ask',body:{question:'Diretta',createTask:true},user:client,clientId:'demo-bottega'}),e=>e.status===403);
  for(const role of ['owner','team'])assert.equal((await f.request(role,'/api/production/state?clientId=demo-bottega')).status,200);
});

test('area cliente: API legacy Servizi offre solo metadati e rispetta servizio, tenant e Growth riservato',async t=>{
  const f=await fixture(t),s=f.store;
  s.run("UPDATE os_contents SET body='PRIVATE_BODY_FIXTURE',source='PRIVATE_SOURCE_FIXTURE' WHERE id='content-demo'");
  s.run("UPDATE os_approvals SET body='PRIVATE_APPROVAL_FIXTURE',reason='PRIVATE_FEEDBACK_FIXTURE' WHERE id='approval-demo'");
  s.run("UPDATE os_clients SET services_json='[\"social\",\"growth\",\"fidelity\"]' WHERE id='demo-bottega'");
  const r=await f.request('client','/api/agency/services/social');
  assert.equal(r.status,200);assert.deepEqual(Object.keys(r.data.service).sort(),['id','name','status']);
  for(const key of ['tasks','contents','approvals','integrations','sections'])assert.deepEqual(r.data[key],[],key);
  for(const marker of ['PRIVATE_BODY_FIXTURE','PRIVATE_SOURCE_FIXTURE','PRIVATE_APPROVAL_FIXTURE','PRIVATE_FEEDBACK_FIXTURE'])assert.ok(!JSON.stringify(r.data).includes(marker),marker);
  const catalogue=await f.request('client','/api/agency/dashboard');
  assert.equal(catalogue.status,200);assert.deepEqual(catalogue.data.sections,[]);
  assert.deepEqual(catalogue.data.services.map(service=>service.id).sort(),['fidelity','social']);
  for(const path of ['/api/agency/services/growth','/api/agency/services/ads','/api/agency/services/social?clientId=demo-studio'])assert.equal((await f.request('client',path)).status,403,path);
  const owner=await f.request('owner','/api/agency/services/social?clientId=demo-bottega');
  assert.equal(owner.status,200);assert.ok(JSON.stringify(owner.data).includes('PRIVATE_BODY_FIXTURE'));
  assert.equal((await f.request('team','/api/agency/services/social?clientId=demo-bottega')).status,403);
  s.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bottega'");
  assert.equal((await f.request('client','/api/agency/services/social')).status,403);
  assert.deepEqual((await f.request('client','/api/agency/dashboard')).data.services,[]);
});

test('area cliente: approvazioni comuni sempre negate; il collaboratore conserva la decisione social',async t=>{
  const f=await fixture(t);
  for(const id of ['approval-demo','id-inesistente'])assert.equal((await f.request('client','/api/approvals/'+id,'POST',{decision:'approved'})).status,403);
  assert.equal(f.store.one("SELECT status FROM os_approvals WHERE id='approval-demo'").status,'pending');
  assert.equal((await f.request('team','/api/approvals/approval-demo?clientId=demo-bottega','POST',{decision:'approved'})).status,200);
  assert.equal(f.store.one("SELECT decision_by FROM os_approvals WHERE id='approval-demo'").decision_by,'demo-collaborator');
  assert.equal((await f.request('client','/api/approvals/approval-demo','POST',{decision:'approved'})).status,403);
});

test('area cliente: contratto proprio e anteprima socio equivalenti, GET senza scritture o dati di altri clienti',async t=>{
  const f=await fixture(t),pdf=Buffer.from('%PDF-1.4\n% Contratto inventato\n%%EOF').toString('base64');
  const created=await f.request('owner','/api/client-record/contracts?clientId=demo-bottega','POST',{title:'Contratto inventato',startDate:'2026-10-01',endDate:'2027-10-01',renewal:'Da concordare',pdfBase64:pdf});
  assert.equal(created.status,201);
  const before={docs:f.store.one('SELECT count(*) n FROM os_client_contract_docs').n,audit:f.store.one('SELECT count(*) n FROM os_audit').n};
  const client=await f.request('client','/api/client-record/contracts'),owner=await f.request('owner','/api/client-record/contracts?clientId=demo-bottega');
  assert.equal(client.status,200);assert.deepEqual(client.data,owner.data);
  assert.ok(!JSON.stringify(client.data).includes('amount_cents'));
  const path='/api/client-record/contracts/'+created.data.id+'/pdf';
  const download=await f.request('client',path),preview=await f.request('owner',path+'?clientId=demo-bottega');
  assert.equal(download.status,200);assert.equal(download.data,preview.data);assert.match(download.headers['cache-control'],/no-store/);
  assert.equal((await f.request('client',path+'?clientId=demo-studio')).status,403);
  assert.equal((await f.request('other',path)).status,404);
  assert.equal((await f.request('team',path+'?clientId=demo-bottega')).status,403);
  assert.equal((await f.request('client','/api/client-record/state')).status,403);
  assert.equal((await f.request('client','/api/client-record/contracts','POST',{title:'Tentativo'})).status,403);
  assert.deepEqual({docs:f.store.one('SELECT count(*) n FROM os_client_contract_docs').n,audit:f.store.one('SELECT count(*) n FROM os_audit').n},before);
});

test('area cliente: rimozione servizio e disattivazione accesso valgono anche con la sessione precedente',async t=>{
  const f=await fixture(t);
  assert.equal((await f.request('client','/api/fidelity/state')).status,200);
  f.store.run("UPDATE os_clients SET services_json='[\"growth\"]' WHERE id='demo-bottega'");
  assert.equal((await f.request('client','/api/fidelity/state')).status,403);
  assert.deepEqual((await f.request('client','/api/overview')).data.currentClientServices,[]);
  f.store.run("UPDATE os_users SET active=0 WHERE id='demo-client'");
  for(const path of ['/api/overview','/api/clients','/api/client-record/contracts','/api/agency/dashboard'])assert.equal((await f.request('client',path)).status,401,path);
});
