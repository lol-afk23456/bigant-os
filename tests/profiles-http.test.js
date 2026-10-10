import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createApp} from '../server.js';

function fixture(t, real = false) {
  const origin = real ? 'https://os.example' : 'http://127.0.0.1:4330';
  const env = real ? {BIGANT_MODALITA:'reale', BIGANT_SOCIO_EMAIL:'socio@prova.example', BIGANT_SOCIO_PASSWORD_INIZIALE:'password-inventata-per-test-profili'} : {};
  const app = createApp({origin, env, clock:()=>new Date('2026-10-10T12:00:00Z')});
  t.after(()=>app.close());
  t.mock.method(globalThis, 'fetch', ()=>{throw Error('Nessuna rete durante la gestione dei link');});
  const handler = app.server.listeners('request')[0];
  const ownerId = real ? app.store.one('SELECT id FROM os_users WHERE email=?', env.BIGANT_SOCIO_EMAIL).id : 'demo-owner';
  const ids = [ownerId, ...(!real ? ['demo-client','demo-client-other','demo-collaborator'] : [])];
  for (const id of ids) app.store.run('INSERT INTO os_sessions VALUES(?,?,?,?)', createHash('sha256').update('profiles-'+id).digest('hex'), id, 'profiles-csrf', Math.max(Date.now(),Date.parse('2026-10-10T12:00:00Z'))+3600000);
  async function request(method, path, body, {user = ownerId, csrf = 'profiles-csrf', requestOrigin = origin} = {}) {
    const req = {method, url:path, headers:{host:new URL(origin).host, origin:requestOrigin, 'content-type':'application/json', ...(user ? {cookie:'bigant_os=profiles-'+user, 'x-csrf-token':csrf} : {})}, socket:{remoteAddress:'127.0.0.1'}, async *[Symbol.asyncIterator](){if(body!==undefined) yield Buffer.from(JSON.stringify(body));}};
    const res = {status:200, headers:{}, headersSent:false, setHeader(k,v){this.headers[k.toLowerCase()]=v;}, writeHead(status,headers){this.status=status;this.headersSent=true;for(const [k,v] of Object.entries(headers||{}))this.setHeader(k,v);}, end(body){this.body=body?JSON.parse(String(body)):null;}};
    await handler(req,res);return res;
  }
  return {...app, ownerId, request};
}
const path = (client='demo-bottega',channel='')=>'/api/workspace/profiles'+(channel?'/'+channel:'')+'?clientId='+client;
const payload = (version=0)=>({version,url:'https://bottega-inventata.example.com/',sourceUrl:'https://fonte-inventata.example.org/contatti',confirmedBusiness:true});

test('Profili HTTP: il socio registra il link; il cliente legge solo la propria attività, collaboratore escluso', async t=>{
  const f=fixture(t);
  const saved=await f.request('PATCH',path('demo-bottega','website'),payload());assert.equal(saved.status,200);
  const customer=await f.request('GET',path(),undefined,{user:'demo-client'});assert.equal(customer.status,200);assert.equal(customer.body.canEdit,false);
  const website=customer.body.items.find(row=>row.id==='website');assert.equal(website.link.url,payload().url);assert.equal(website.link.sourceUrl,payload().sourceUrl);
  for(const row of customer.body.items){assert.equal(row.status,'Da collegare');assert.equal(row.lastSync,null);assert.equal(row.metrics,null);assert.equal(row.reviews,null);}
  for(const user of ['demo-client','demo-client-other','demo-collaborator'])assert.equal((await f.request('PATCH',path('demo-bottega','website'),payload(1),{user})).status,403);
  for(const [user,client] of [['demo-client','demo-studio'],['demo-client','demo-bigant'],['demo-client-other','demo-bottega'],['demo-collaborator','demo-bottega']])assert.equal((await f.request('GET',path(client),undefined,{user})).status,403);
  const other=await f.request('GET',path('demo-studio'),undefined,{user:'demo-client-other'});assert.ok(other.body.items.every(row=>row.link===null));
});

test('Profili HTTP: login, origine, CSRF e disattivazioni impediscono scritture', async t=>{
  const f=fixture(t),before=f.store.one('SELECT total_changes() n').n;
  assert.equal((await f.request('GET',path(),undefined,{user:null})).status,401);
  for(const options of [{csrf:'errato'},{requestOrigin:'https://non-autorizzato.example'}])assert.equal((await f.request('PATCH',path('demo-bottega','website'),payload(),options)).status,403);
  assert.equal(f.store.one('SELECT total_changes() n').n,before);
  f.store.run('UPDATE os_users SET active=0 WHERE id=?',f.ownerId);
  assert.equal((await f.request('PATCH',path('demo-bottega','website'),payload())).status,401);
  f.store.run('UPDATE os_users SET active=1 WHERE id=?',f.ownerId);f.store.run("UPDATE os_clients SET active=0 WHERE id='demo-bottega'");
  assert.equal((await f.request('PATCH',path('demo-bottega','website'),payload())).status,403);
});

test('Profili HTTP: due schede concorrenti non sovrascrivono la versione e le attività restano separate', async t=>{
  const f=fixture(t),target=path('demo-bottega','website');
  const replies=await Promise.all([f.request('PATCH',target,payload()),f.request('PATCH',target,{...payload(),url:'https://seconda-inventata.example.com/'})]);
  assert.deepEqual(replies.map(r=>r.status).sort(),[200,409]);
  assert.equal((await f.request('PATCH',path('demo-studio','website'),payload())).status,200);
  assert.equal((await f.request('PATCH',target,{...payload(1),url:'https://aggiornata-inventata.example.com/'})).status,200);
  const first=await f.request('GET',path()),second=await f.request('GET',path('demo-studio'));
  assert.equal(first.body.items.find(r=>r.id==='website').link.version,2);assert.equal(second.body.items.find(r=>r.id==='website').link.version,1);
  assert.equal(second.body.items.find(r=>r.id==='website').link.url,payload().url);
});

test('Profili HTTP: il link funziona anche in modalità reale senza autorizzare fonti, con password provvisoria bloccata', async t=>{
  const f=fixture(t,true),target=path('demo-bigant','website');
  assert.equal((await f.request('PATCH',target,payload())).status,403);
  f.store.run('UPDATE os_users SET must_change_password=0 WHERE id=?',f.ownerId);
  const saved=await f.request('PATCH',target,payload());assert.equal(saved.status,200);
  const before=f.store.one('SELECT total_changes() n').n;
  const current=await f.request('GET',path('demo-bigant'));assert.equal(current.status,200);assert.equal(current.body.canEdit,true);
  assert.equal(current.body.items.find(r=>r.id==='website').link.confirmation,'owner');
  assert.ok(current.body.items.every(row=>row.status==='Da collegare'&&row.lastSync===null&&row.metrics===null&&row.reviews===null));
  assert.equal(f.store.one('SELECT total_changes() n').n,before);
  assert.equal(f.store.one('SELECT count(*) n FROM os_clients').n,1);
});

test('Profili HTTP: nessuna rotta cancella link o consente di dichiarare una sincronizzazione', async t=>{
  const f=fixture(t),target=path('demo-bottega','website');
  assert.equal((await f.request('PATCH',target,payload())).status,200);
  const before=f.store.one('SELECT total_changes() n').n;
  assert.equal((await f.request('PATCH',target,{...payload(1),status:'Collegato',metrics:{followers:5000}})).status,400);
  assert.ok([404,405].includes((await f.request('DELETE',target,{})).status));
  assert.equal(f.store.one('SELECT total_changes() n').n,before);
  assert.equal((await f.request('GET',path())).body.items.find(row=>row.id==='website').link.version,1);
});

test('Profili del cliente: anteprima identica, sola proiezione pubblica, report nel servizio e nessuna scrittura',async t=>{
 const f=fixture(t);await f.request('PATCH',path('demo-bottega','website'),payload());
 const before=f.store.one('SELECT total_changes() n').n;
 const route='/api/cliente/profiles?clientId=demo-bottega';
 const client=await f.request('GET',route,undefined,{user:'demo-client'}),owner=await f.request('GET',route);
 assert.equal(client.status,200);assert.deepEqual(owner.body,client.body);assert.equal(client.body.canEdit,false);
 const website=client.body.items.find(row=>row.id==='website');assert.deepEqual(Object.keys(website.link).sort(),['sourceUrl','updatedAt','url']);assert.equal(website.reportService,'website');
 assert.doesNotMatch(JSON.stringify(client.body),/businessProfile|confirmed_by|checked|metrics|token|oauth|credentials|configuration/);
 assert.equal(f.store.one('SELECT total_changes() n').n,before);
 f.store.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bottega'");
 const absent=await f.request('GET',route,undefined,{user:'demo-client'});assert.ok(absent.body.items.every(row=>row.reportService===null));assert.equal(absent.body.items.find(row=>row.id==='website').link.url,payload().url);
});

test('Profili del cliente: login, ruoli, altre attività e operazioni non ammesse',async t=>{
 const f=fixture(t),route='/api/cliente/profiles?clientId=demo-bottega';
 assert.equal((await f.request('GET',route,undefined,{user:null})).status,401);
 for(const user of ['demo-collaborator','demo-client-other'])assert.equal((await f.request('GET',route,undefined,{user})).status,403);
 assert.equal((await f.request('GET','/api/cliente/profiles?clientId=demo-studio',undefined,{user:'demo-client'})).status,403);
 assert.equal((await f.request('POST',route,{}, {user:'demo-client'})).status,405);
 f.store.run("UPDATE os_users SET active=0 WHERE id='demo-client'");assert.equal((await f.request('GET',route,undefined,{user:'demo-client'})).status,401);
});
