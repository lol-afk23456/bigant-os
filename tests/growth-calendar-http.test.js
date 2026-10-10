import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createApp} from '../server.js';
import {calendarAppFixture} from './helpers/growth-calendar-app-fixture.js';

// Exercise the production handler without opening a socket or using real credentials.
function fixture(t,flags={}){
 const env={BIGANT_MODALITA:'reale',BIGANT_SOCIO_EMAIL:'socio@fixture.example',BIGANT_SOCIO_PASSWORD_INIZIALE:'password-inventata-per-test',...flags};
 const calls=[],app=createApp({origin:'https://os.example',env,growthProviderOptions:{fetchImpl:async()=>{calls.push('unexpected-network');throw Error('Rete vietata');}}});t.after(()=>app.close());
 const owner=app.store.one('SELECT * FROM os_users WHERE email=?',env.BIGANT_SOCIO_EMAIL),token='sessione-calendario-inventata';
 app.store.run('UPDATE os_users SET must_change_password=0 WHERE id=?',owner.id);
 app.store.run('INSERT INTO os_sessions VALUES(?,?,?,?)',createHash('sha256').update(token).digest('hex'),owner.id,'csrf-inventato',Date.now()+3600000);
 const handler=app.server.listeners('request')[0];
 async function request(method,path,body,{authenticated=false,origin='https://os.example',csrf='csrf-inventato',host='os.example'}={}){
  const req={method,url:path,headers:{host,origin,'content-type':'application/json',...(authenticated?{cookie:'bigant_os='+token,'x-csrf-token':csrf}:{})},socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){if(body!==undefined)yield Buffer.from(JSON.stringify(body));}};
  const res={status:200,headers:{},headersSent:false,setHeader(k,v){this.headers[k.toLowerCase()]=v;},writeHead(status,headers){this.status=status;this.headersSent=true;for(const[k,v]of Object.entries(headers||{}))this.setHeader(k,v);},end(body){this.body=body?JSON.parse(String(body)):null;}};
  await handler(req,res);return res;
 }
 return {app,env,calls,owner,request};
}

test('Calendar HTTP: flag spento, ruoli e CSRF bloccano le nuove operazioni senza rete',async t=>{
 const f=fixture(t),path='/api/growth/calendar/check',body={version:0};
 assert.equal((await f.request('POST',path,body)).status,401);
 assert.equal((await f.request('POST',path,body,{authenticated:true,csrf:'errato'})).status,403);
 assert.equal((await f.request('POST',path,body,{authenticated:true,origin:'https://altro.example'})).status,403);
 assert.equal((await f.request('POST',path,body,{authenticated:true})).status,409);
 for(const role of ['collaborator','client']){
  f.app.store.run('UPDATE os_users SET role=?,tenant_id=? WHERE id=?',role,role==='client'?'demo-bigant':null,f.owner.id);
  f.app.store.run('INSERT OR IGNORE INTO os_assignments VALUES(?,?)',f.owner.id,'demo-bigant');
  for(const [method,url] of [['POST',path],['POST','/api/growth/calendar/probe-preview'],['POST','/api/growth/calendar/activate'],['POST','/api/growth/calendar/invite'],['GET','/api/growth/leads/prova/invite-preview'],['GET','/api/growth/meetings/prova/cancel-preview'],['POST','/api/growth/meetings/prova/cancel'],['POST','/api/growth/meetings/prova/reconcile']])assert.equal((await f.request(method,url,body,{authenticated:true})).status,403,url);
 }
 assert.equal(f.calls.length,0);
});

test('Calendar HTTP pubblico usa la sola capacità del link, senza attribuire un socio al visitatore',async t=>{
 const f=fixture(t),seen=[],token='token-inventato-lungo',path='/api/growth/public/book/'+token;
 t.mock.method(f.app.growth.calendar,'publicSlots',async(...args)=>{seen.push(['slots',args]);return {slots:[],simulation:false,notice:'Prova di instradamento'};});
 t.mock.method(f.app.growth.calendar,'publicBook',async(...args)=>{seen.push(['book',args]);return {status:'booked',simulation:false};});
 t.mock.method(f.app.growth,'handle',()=>{throw Error('Il visitatore non può ereditare il ruolo owner');});
 const read=await f.request('GET',path);assert.equal(read.status,200);assert.equal(read.headers['referrer-policy'],'no-referrer');assert.equal(read.headers['cache-control'],'no-store');
 assert.equal((await f.request('POST',path,{start:'2026-11-10T10:00:00Z',confirmed:true})).status,200);
 assert.deepEqual(seen,[['slots',[token]],['book',[token,{start:'2026-11-10T10:00:00Z',confirmed:true}]]]);
 assert.equal((await f.request('POST',path,{}, {origin:'https://altro.example'})).status,403);
 for(const method of ['PATCH','DELETE','HEAD'])assert.equal((await f.request(method,path,{})).status,405);
 assert.equal(seen.length,2);assert.equal(f.calls.length,0);
});

test('Calendar HTTP non accetta i vecchi token DEMO né token sconosciuti nel percorso reale',async t=>{
 const f=fixture(t),s=f.app.growth.store;
 s.workspace('demo-bigant');
 const lead=await f.app.growth.handle({method:'POST',path:'/leads',body:{company:'Contatto inventato',email:'contatto@fixture.example',source:'Fixture HTTP'},user:{...f.owner,must_change_password:0}});
 const legacy=f.app.growth.engine.token('demo-bigant',lead.data.id,'booking');
 for(const token of ['sconosciuto',legacy]){
  for(const method of ['GET','POST']){const r=await f.request(method,'/api/growth/public/book/'+token,{start:'2026-11-10T10:00:00Z',confirmed:true});assert.ok([404,409,410].includes(r.status),JSON.stringify(r.body));}
 }
 assert.equal(f.calls.length,0);assert.equal(f.app.store.one('SELECT count(*) n FROM gr_meetings').n,0);
});

test('Calendar flag e stato OAuth si aggiornano senza attivazione implicita',async t=>{
 const f=fixture(t,{BIGANT_GROWTH_GMAIL_ENABLED:'true',BIGANT_GROWTH_CALENDAR_ENABLED:'true'});
 let state=await f.request('GET','/api/connections/google/oauth/state',undefined,{authenticated:true});
 assert.equal(state.body.calendarAvailable,true);assert.equal(state.body.calendarConnected,false);
 f.env.BIGANT_GROWTH_CALENDAR_ENABLED='false';
 state=await f.request('GET','/api/connections/google/oauth/state',undefined,{authenticated:true});assert.equal(state.body.calendarAvailable,false);
 const growth=await f.request('GET','/api/growth/state',undefined,{authenticated:true});assert.equal(growth.body.calendar.available,false);assert.equal(growth.body.calendar.enabled,false);assert.equal(f.calls.length,0);
});

test('Calendar flusso integrato: OAuth, fasi Growth, prova, link pubblico, appuntamento e annullamento',async t=>{
 t.mock.method(globalThis,'fetch',()=>{throw Error('Nessuna rete reale');});const f=calendarAppFixture(t);await f.enable();
 assert.equal(f.state().calendar.enabled,true);assert.equal(f.app.growth.progress(f.owner).calendar.enabled,true);
 const l=await f.lead(),privateRequest=(method,path,body)=>f.request(method,'/api/growth'+path,body,{authenticated:true});
 const preview=await privateRequest('GET','/leads/'+l.id+'/invite-preview');assert.equal(preview.status,200);
 const link=await privateRequest('POST','/calendar/invite',{...preview.body,confirmed:true});assert.equal(link.status,200);const path=new URL(link.body.url).pathname.replace('/growth/book/','/api/growth/public/book/');
 const before=f.store.one('SELECT count(*) n FROM gr_calendar_intents').n,slots=await f.request('GET',path);assert.equal(slots.status,200);assert.ok(slots.body.slots.length);assert.equal(slots.body.simulation,false);assert.equal(f.store.one('SELECT count(*) n FROM gr_calendar_intents').n,before);
 assert.ok(!JSON.stringify(slots.body).includes(l.email));assert.equal((await f.request('POST',path,{start:slots.body.slots[0],confirmed:false})).status,409);
 const booked=await f.request('POST',path,{start:slots.body.slots[0],confirmed:true});assert.equal(booked.status,200,JSON.stringify(booked.body));assert.equal(booked.body.status,'booked');assert.equal(booked.body.externalInvitation,true);
 assert.equal((await f.request('POST',path,{start:slots.body.slots[0],confirmed:true})).status,409);
 const cancel=await privateRequest('GET','/meetings/'+booked.body.id+'/cancel-preview');assert.equal(cancel.status,200);
 assert.equal((await privateRequest('POST','/meetings/'+booked.body.id+'/cancel',{hash:cancel.body.hash,confirmed:true})).body.status,'cancelled');
 assert.equal(f.transport.calls.filter(r=>r.opts.method==='POST'&&r.url.includes('/events?')).length,2,'solo prova e appuntamento');
});

test('Calendar impostazioni precedenti non possono ripristinare inviti dopo una modifica',async t=>{
 const f=calendarAppFixture(t);await f.enable();const l=await f.lead(),p=await f.call('GET','/leads/'+l.id+'/invite-preview'),link=await f.call('POST','/calendar/invite',{...p,confirmed:true}),token=new URL(link.url).pathname.split('/').at(-1);
 await assert.rejects(f.call('POST','/settings',{meetingMinutes:45}),/configurazione Calendar/);
 assert.equal(f.state().settings.meetingMinutes,30);assert.equal(f.state().calendar.enabled,true);
 await f.call('POST','/calendar/config',{version:f.state().calendar.version,meetingMinutes:45});
 await f.call('POST','/calendar/config',{version:f.state().calendar.version,meetingMinutes:30});
 assert.equal(f.state().calendar.enabled,false);assert.equal(f.state().calendar.checked,false);
 await assert.rejects(f.app.growth.calendar.publicSlots(token),/verificare|attivare|superato/);
});
