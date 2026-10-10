import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createApp} from '../server.js';
import {createGrowthModule} from '../src/growth.js';

function fixture(t){
 const app=createApp({origin:'https://os.example',env:{BIGANT_MODALITA:'reale',BIGANT_SOCIO_EMAIL:'owner@fixture.example',BIGANT_SOCIO_PASSWORD_INIZIALE:'password-inventata-per-test'},growthProviderOptions:{fetchImpl:()=>{throw Error('Rete vietata');}}});t.after(()=>app.close());
 const owner=app.store.one("SELECT * FROM os_users WHERE email='owner@fixture.example'"),token='sessione-archivio-inventata';app.store.run('UPDATE os_users SET must_change_password=0 WHERE id=?',owner.id);app.store.run('INSERT INTO os_sessions VALUES(?,?,?,?)',createHash('sha256').update(token).digest('hex'),owner.id,'csrf-inventato',Date.now()+3600000);
 const demo=createGrowthModule({store:app.store});demo.seed();
 const handler=app.server.listeners('request')[0];
 async function request(method,path,body,{authenticated=true,origin='https://os.example',csrf='csrf-inventato'}={}){
  const req={method,url:'/api/growth'+path,headers:{host:'os.example',origin,'content-type':'application/json',...(authenticated?{cookie:'bigant_os='+token,'x-csrf-token':csrf}:{})},socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){if(body!==undefined)yield Buffer.from(JSON.stringify(body));}};
  const res={status:200,headersSent:false,setHeader(){},writeHead(status){this.status=status;this.headersSent=true;},end(body){this.body=body?JSON.parse(String(body)):null;}};await handler(req,res);return res;
 }
 return {app,owner,request};
}
test('Growth archivio HTTP: anteprima senza conversione; sessione, origine, CSRF e ruolo proteggono la transizione',async t=>{
 const f=fixture(t),before=f.app.store.query('SELECT * FROM gr_leads ORDER BY id');
 const read=await f.request('GET','/state');assert.equal(read.status,200);assert.equal(read.body.migration.required,true);assert.equal(read.body.leads,undefined);assert.deepEqual(f.app.store.query('SELECT * FROM gr_leads ORDER BY id'),before);
 const body={version:read.body.migration.version,confirmed:true};
 for(const options of [{authenticated:false},{csrf:'errato'},{origin:'https://altro.example'}])assert.ok([401,403].includes((await f.request('POST','/demo-archive',body,options)).status));
 assert.equal((await f.request('POST','/leads',{company:'Non creare',source:'Prova'})).status,409);
 for(const role of ['collaborator','client']){f.app.store.run('UPDATE os_users SET role=? WHERE id=?',role,f.owner.id);assert.equal((await f.request('POST','/demo-archive',body)).status,403);}
 assert.deepEqual(f.app.store.query('SELECT * FROM gr_leads ORDER BY id'),before);
});
test('Growth archivio HTTP: separazione esplicita e ripristino conservano le prove senza attivare servizi',async t=>{
 const f=fixture(t),before=f.app.store.query('SELECT * FROM gr_leads ORDER BY id'),preview=(await f.request('GET','/state')).body.migration;
 assert.equal((await f.request('POST','/demo-archive',{version:preview.version})).status,409);
 const archived=await f.request('POST','/demo-archive',{version:preview.version,confirmed:true});assert.equal(archived.status,200,JSON.stringify(archived.body));assert.equal(archived.body.simulation,false);assert.equal(archived.body.leads.length,0);assert.equal(archived.body.settings.paused,true);assert.equal(archived.body.runtime.available,false);assert.equal(archived.body.mail.enabled,false);assert.equal(archived.body.calendar.enabled,false);assert.equal(archived.body.migration.archive.canRestore,true);
 const restored=await f.request('POST','/demo-restore',{version:archived.body.migration.version,confirmed:true});assert.equal(restored.status,200,JSON.stringify(restored.body));assert.equal(restored.body.migration.required,true);assert.deepEqual(f.app.store.query('SELECT * FROM gr_leads ORDER BY id'),before);
});
test('Growth archivio HTTP: nuovi contatti reali impediscono il ripristino e restano intatti',async t=>{
 const f=fixture(t),preview=(await f.request('GET','/state')).body.migration;
 const archived=await f.request('POST','/demo-archive',{version:preview.version,confirmed:true});assert.equal(archived.status,200);
 const lead=await f.request('POST','/leads',{company:'Azienda inventata test API',source:'Fixture automatica',email:'azienda@fixture.example'});assert.equal(lead.status,201);
 const current=(await f.request('GET','/state')).body;assert.equal(current.migration.archive.canRestore,false);
 assert.equal((await f.request('POST','/demo-restore',{version:current.migration.version,confirmed:true})).status,409);assert.equal((await f.request('GET','/state')).body.leads[0].id,lead.body.id);
});
