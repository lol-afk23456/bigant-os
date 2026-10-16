import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createApp} from '../server.js';

const ORIGIN_HOST='os.bigant.it.test';
const SOCIO_EMAIL='raffaele@bigant.it';
const SOCIO_PASSWORD='password-reale-collaudo-01';

async function setupReale(t,envExtra={},growthProviderOptions={}) {
  const app=createApp({origin:`https://${ORIGIN_HOST}`,env:{BIGANT_MODALITA:'reale',BIGANT_SOCIO_EMAIL:SOCIO_EMAIL,BIGANT_SOCIO_PASSWORD_INIZIALE:SOCIO_PASSWORD,...envExtra},growthProviderOptions});
  await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
  t.after(()=>app.close());
  const port=app.server.address().port;
  function request(path,{method='GET',body,headers={},host=ORIGIN_HOST}={}) {
    return new Promise((resolve,reject)=>{
      const data=body!==undefined?JSON.stringify(body):undefined;
      const req=http.request({host:'127.0.0.1',port,path,method,headers:{Host:host,'Content-Type':'application/json',...headers}},res=>{
        let chunks='';res.on('data',c=>chunks+=c);res.on('end',()=>{
          const type=res.headers['content-type'];
          let parsed=chunks;if(type?.includes('json')){try{parsed=JSON.parse(chunks);}catch{parsed=chunks;}}
          resolve({status:res.statusCode,body:parsed,headers:res.headers});
        });
      });
      req.on('error',reject);if(data)req.write(data);req.end();
    });
  }
  return {app,port,request};
}

test('modalità reale: host sconosciuto rifiutato, login DEMO assente, cookie Secure, primo socio funzionante',async t=>{
  const {request}=await setupReale(t);
  assert.equal((await request('/api/session',{host:'sito-sconosciuto.test'})).status,403);
  const demoAttempt=await request('/api/demo/login',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{profile:'demo-owner'}});
  assert.equal(demoAttempt.status,401);
  const session=await request('/api/session');
  assert.equal(session.body.demo,false);
  assert.deepEqual(session.body.profiles,[]);
  let login=await request('/api/login',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{email:SOCIO_EMAIL,password:SOCIO_PASSWORD}});
  assert.equal(login.status,200);
  assert.equal(login.body.user.role,'owner');
  assert.match(login.headers['set-cookie'][0],/Secure/);
  assert.equal(login.body.user.mustChangePassword,true);
  login=await request('/api/account/password',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`,Cookie:login.headers['set-cookie'][0].split(';')[0],'X-CSRF-Token':login.body.csrf},body:{currentPassword:SOCIO_PASSWORD,newPassword:'personale-collaudo-aggiornata-02',confirmPassword:'personale-collaudo-aggiornata-02'}});
  assert.equal(login.status,200);
  const cookie=login.headers['set-cookie'][0].split(';')[0];
  const overview=await request('/api/overview',{headers:{Cookie:cookie,'X-CSRF-Token':login.body.csrf}});
  assert.equal(overview.status,200);
  assert.equal(overview.body.demo,false);
  assert.equal(overview.body.currentClient.name,'BigAnt');
});

test('modalità reale: password iniziale mancante blocca l’avvio',async t=>{
  assert.throws(()=>createApp({origin:`https://${ORIGIN_HOST}`,env:{BIGANT_MODALITA:'reale',BIGANT_SOCIO_EMAIL:SOCIO_EMAIL}}),/PASSWORD_INIZIALE/);
});

test('modalità reale: origine non https rifiutata in fase di creazione',async t=>{
  assert.throws(()=>createApp({origin:'http://127.0.0.1:4330',env:{BIGANT_MODALITA:'reale',BIGANT_SOCIO_EMAIL:SOCIO_EMAIL,BIGANT_SOCIO_PASSWORD_INIZIALE:SOCIO_PASSWORD}}),/https/);
});

test('modalità reale: nuovo utente con email reale (non .example) viene creato',async t=>{
  const {request}=await setupReale(t);
  let login=await request('/api/login',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{email:SOCIO_EMAIL,password:SOCIO_PASSWORD}});
  assert.equal(login.body.user.mustChangePassword,true);
  login=await request('/api/account/password',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`,Cookie:login.headers['set-cookie'][0].split(';')[0],'X-CSRF-Token':login.body.csrf},body:{currentPassword:SOCIO_PASSWORD,newPassword:'personale-collaudo-aggiornata-02',confirmPassword:'personale-collaudo-aggiornata-02'}});
  assert.equal(login.status,200);
  const cookie=login.headers['set-cookie'][0].split(';')[0];
  const created=await request('/api/users',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`,Cookie:cookie,'X-CSRF-Token':login.body.csrf},body:{name:'Alfonso',email:'alfonso@bigant.it',role:'owner',password:'password-reale-alfonso-02'}});
  assert.equal(created.status,201);
});

test('modalità reale: non crea aziende o utenti DEMO',async t=>{
  const {request}=await setupReale(t);
  let login=await request('/api/login',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{email:SOCIO_EMAIL,password:SOCIO_PASSWORD}});
  assert.equal(login.body.user.mustChangePassword,true);
  login=await request('/api/account/password',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`,Cookie:login.headers['set-cookie'][0].split(';')[0],'X-CSRF-Token':login.body.csrf},body:{currentPassword:SOCIO_PASSWORD,newPassword:'personale-collaudo-aggiornata-02',confirmPassword:'personale-collaudo-aggiornata-02'}});
  assert.equal(login.status,200);
  const cookie=login.headers['set-cookie'][0].split(';')[0];
  const overview=await request('/api/overview',{headers:{Cookie:cookie,'X-CSRF-Token':login.body.csrf}});
  assert.equal(overview.body.clients.length,1);
  assert.equal(overview.body.clients[0].name,'BigAnt');
});

test('Growth reale via HTTP: scelta rinviata salvabile, nessun collaudo senza gate, CSRF e ruoli applicati',async t=>{
 const {app,request}=await setupReale(t);
 let login=await request('/api/login',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{email:SOCIO_EMAIL,password:SOCIO_PASSWORD}});
 login=await request('/api/account/password',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`,Cookie:login.headers['set-cookie'][0].split(';')[0],'X-CSRF-Token':login.body.csrf},body:{currentPassword:SOCIO_PASSWORD,newPassword:'personale-fixture-growth-02',confirmPassword:'personale-fixture-growth-02'}});
 const headers={Origin:`https://${ORIGIN_HOST}`,Cookie:login.headers['set-cookie'][0].split(';')[0],'X-CSRF-Token':login.body.csrf};
 const initial=await request('/api/growth/state',{headers});assert.equal(initial.status,200);assert.equal(initial.body.runtime.available,false);assert.equal(initial.body.simulation,false);
 let result=await request('/api/growth/runtime/config',{method:'POST',headers,body:{version:0,provider:'',searchCents:0,aiCents:0}});assert.equal(result.status,200);assert.equal(result.body.provider,null);assert.equal(result.body.version,1);
 result=await request('/api/growth/runtime/config',{method:'POST',headers:{...headers,'X-CSRF-Token':''},body:{version:1,provider:'openai',searchCents:5,aiCents:25}});assert.equal(result.status,403);
 result=await request('/api/growth/runtime/check',{method:'POST',headers,body:{version:1,phase:'research',query:'Dati di prova'}});assert.equal(result.status,409);
 const owner={id:login.body.user.id},client=app.store.one('SELECT id FROM os_clients');
 app.store.run('INSERT INTO os_assignments VALUES(?,?)',owner.id,client.id);
 for(const role of ['collaborator','client']){
  app.store.run('UPDATE os_users SET role=?,tenant_id=? WHERE id=?',role,role==='client'?client.id:null,owner.id);
  assert.equal((await request('/api/growth/state',{headers})).status,403);
  assert.equal((await request('/api/growth/runtime/activate',{method:'POST',headers,body:{version:1,phase:'research',enabled:true}})).status,403);
 }
 assert.equal(app.store.one('SELECT count(*) n FROM os_costs').n,0);
});


test('Fidelity reale via HTTP: tessera pubblica, Wallet chiuso, POST, CSRF e soli soci',async t=>{
 const {app,request}=await setupReale(t);
 let login=await request('/api/login',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{email:SOCIO_EMAIL,password:SOCIO_PASSWORD}});
 login=await request('/api/account/password',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`,Cookie:login.headers['set-cookie'][0].split(';')[0],'X-CSRF-Token':login.body.csrf},body:{currentPassword:SOCIO_PASSWORD,newPassword:'personale-fixture-wallet-02',confirmPassword:'personale-fixture-wallet-02'}});
 const headers={Origin:`https://${ORIGIN_HOST}`,Cookie:login.headers['set-cookie'][0].split(';')[0],'X-CSRF-Token':login.body.csrf};
 const state=await request('/api/fidelity/state',{headers});assert.equal(state.status,200);assert.equal(state.body.wallet.google.available,false);assert.equal(state.body.demo,false);
 const p=await request('/api/fidelity/programs',{method:'POST',headers,body:{name:'Programma fixture HTTP',type:'stamps',rewardName:'Premio di prova',rewardThreshold:8}});assert.equal(p.status,201);assert.equal(p.body.demo,false);
 const m=await request('/api/fidelity/members',{method:'POST',headers,body:{programId:p.body.id,name:'Persona inventata',email:'iscritto@fixture.example'}});assert.equal(m.status,201);
 const path='/api/fidelity/public/cards/'+m.body.publicToken;assert.equal((await request(path)).body.demo,false);assert.equal((await request(path+'/google')).status,405);
 assert.equal((await request(path+'/google',{method:'POST',headers:{Origin:'https://non-autorizzato.example'},body:{acknowledged:true}})).status,403);
 assert.equal((await request(path+'/google',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{acknowledged:true}})).status,409);
 assert.equal((await request('/api/fidelity/google-wallet/check',{method:'POST',headers:{...headers,'X-CSRF-Token':''},body:{memberId:m.body.id,version:0,acknowledged:true}})).status,403);
 const owner=login.body.user.id,client=app.store.one('SELECT id FROM os_clients').id;
 app.store.run('INSERT INTO os_assignments VALUES(?,?)',owner,client);
 for(const role of ['client','collaborator']){
  app.store.run('UPDATE os_users SET role=?,tenant_id=? WHERE id=?',role,role==='client'?client:null,owner);
  assert.equal((await request('/api/fidelity/google-wallet/activate',{method:'POST',headers,body:{version:0,enabled:true,deviceVerified:true}})).status,403);
 }
});

test('OAuth Google via HTTP: sessione, CSRF, callback senza segreti e casella autorizzata senza invii',async t=>{
 const calls=[],scopes=['https://www.googleapis.com/auth/gmail.send','https://www.googleapis.com/auth/gmail.readonly'];
 const {app,request}=await setupReale(t,{BIGANT_SECRET_KEY:Buffer.alloc(32,4).toString('base64'),BIGANT_GROWTH_GMAIL_ENABLED:'true'},{fetchImpl:async url=>{calls.push(String(url));return new Response(JSON.stringify(String(url).endsWith('/token')?{access_token:'token-finto-http',refresh_token:'refresh-finto-http',token_type:'Bearer',scope:scopes.join(' ')}:{emailAddress:'casella@fixture.example'}));}});
 const callback=await request('/auth/google/callback?code=codice-finto-http&state=stato-finto');assert.equal(callback.status,200);assert.ok(!callback.body.includes('codice-finto-http'));assert.equal(callback.headers['referrer-policy'],'no-referrer');assert.equal(calls.length,0);
 assert.equal((await request('/api/connections/google/oauth/state')).status,401);
 assert.equal((await request('/api/growth/mail/sync',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{confirmed:true}})).status,401);
 let login=await request('/api/login',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{email:SOCIO_EMAIL,password:SOCIO_PASSWORD}});
 login=await request('/api/account/password',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`,Cookie:login.headers['set-cookie'][0].split(';')[0],'X-CSRF-Token':login.body.csrf},body:{currentPassword:SOCIO_PASSWORD,newPassword:'personale-fixture-oauth-02',confirmPassword:'personale-fixture-oauth-02'}});
 assert.match(login.headers['set-cookie'][0],/SameSite=Strict/);const headers={Origin:`https://${ORIGIN_HOST}`,Cookie:login.headers['set-cookie'][0].split(';')[0],'X-CSRF-Token':login.body.csrf};
 assert.equal((await request('/api/connections/google',{method:'POST',headers,body:{version:0,fields:{clientId:'id-finto-http',clientSecret:'secret-finto-http'}}})).status,200);
 const body={version:1,email:'casella@fixture.example',acknowledged:true};assert.equal((await request('/api/connections/google/oauth/start',{method:'POST',headers:{...headers,'X-CSRF-Token':''},body})).status,403);
 const started=await request('/api/connections/google/oauth/start',{method:'POST',headers,body});assert.equal(started.status,200);const state=new URL(started.body.url).searchParams.get('state');
 assert.equal((await request('/api/connections/google/oauth/finish',{method:'POST',headers:{...headers,'X-CSRF-Token':''},body:{state,code:'codice-finto-http'}})).status,403);
 const finished=await request('/api/connections/google/oauth/finish',{method:'POST',headers,body:{state,code:'codice-finto-http'}});assert.equal(finished.status,200);assert.equal(finished.body.connected,true);assert.equal(finished.body.email,body.email);assert.ok(!JSON.stringify(finished.body).includes('refresh-finto-http'));assert.equal(calls.length,2);
 assert.equal((await request('/api/connections/google/oauth/finish',{method:'POST',headers,body:{state,code:'codice-finto-http'}})).status,409);
 const growth=await request('/api/growth/state',{headers});assert.equal(growth.status,200);assert.equal(growth.body.mail.enabled,false);assert.equal((await request('/api/growth/mail/activate',{method:'POST',headers,body:{version:0,enabled:true}})).status,409);
 assert.equal(growth.body.conversations.canSync,true);
 assert.equal((await request('/api/growth/mail/sync',{method:'POST',headers:{...headers,'X-CSRF-Token':''},body:{confirmed:true}})).status,403);
 assert.equal((await request('/api/growth/mail/sync',{method:'POST',headers,body:{confirmed:false}})).status,409);
 const sync=await request('/api/growth/mail/sync',{method:'POST',headers,body:{confirmed:true}});assert.equal(sync.status,200);assert.equal(sync.body.checked,0);assert.equal(calls.length,2);
 assert.equal((await request('/api/growth/mail/sync',{headers})).status,404);
 const ownerId=login.body.user.id,client=app.store.one('SELECT id FROM os_clients');app.store.run('INSERT INTO os_assignments VALUES(?,?)',ownerId,client.id);
 for(const role of ['collaborator','client']){app.store.run('UPDATE os_users SET role=?,tenant_id=? WHERE id=?',role,role==='client'?client.id:null,ownerId);assert.equal((await request('/api/connections/google/oauth/state',{headers})).status,403);assert.equal((await request('/api/growth/messages/inventato/send',{method:'POST',headers,body:{confirmed:true}})).status,403);assert.equal((await request('/api/growth/mail/sync',{method:'POST',headers,body:{confirmed:true}})).status,403);}
 assert.equal(calls.length,2);
});

test('disiscrizione HTTP non autenticata: solo conferma POST dalla propria origine, anche ad attività spenta',async t=>{
 const {app,request}=await setupReale(t);const owner=app.store.one("SELECT * FROM os_users WHERE role='owner'"),client=app.store.one('SELECT id FROM os_clients');
 const result=await app.growth.handle({method:'POST',path:'/leads',body:{company:'Prova inventata',email:'contatto@fixture.example',source:'Test inventato'},user:owner,clientId:client.id});const token=app.growth.engine.token(client.id,result.data.id,'unsubscribe',365);
 app.store.run('UPDATE os_clients SET active=0 WHERE id=?',client.id);const path='/api/growth/unsubscribe/'+token;assert.equal((await request(path)).status,200);assert.equal(app.store.one('SELECT suppressed FROM gr_leads').suppressed,0);
 assert.equal((await request(path,{method:'POST',headers:{Origin:'https://altro.example'},body:{}})).status,403);assert.equal(app.store.one('SELECT suppressed FROM gr_leads').suppressed,0);
 assert.equal((await request(path,{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{}})).status,200);assert.equal(app.store.one('SELECT suppressed FROM gr_leads').suppressed,1);
});

test('approvazione comune Growth reale registra lo snapshot e rifiuta una versione superata',async t=>{
 const {app,request}=await setupReale(t);const owner=app.store.one('SELECT * FROM os_users WHERE email=?',SOCIO_EMAIL),client=app.store.one('SELECT id FROM os_clients');app.store.run('UPDATE os_users SET must_change_password=0 WHERE id=?',owner.id);
 const login=await request('/api/login',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{email:SOCIO_EMAIL,password:SOCIO_PASSWORD}}),headers={Origin:`https://${ORIGIN_HOST}`,Cookie:login.headers['set-cookie'][0].split(';')[0],'X-CSRF-Token':login.body.csrf};
 const leadResult=await request('/api/growth/leads',{method:'POST',headers,body:{company:'Contatto inventato',email:'azienda@fixture.example',source:'Test HTTP'}});assert.equal(leadResult.status,201,JSON.stringify(leadResult.body));const lead=leadResult.body;assert.ok(lead.id);
 assert.equal((await request('/api/growth/leads/'+lead.id,{method:'PATCH',headers,body:{consent:'marketing',consent_proof:'Consenso inventato nel test'}})).status,200);
 const token=app.growth.engine.token(client.id,lead.id,'unsubscribe',365),text=`Testo inventato.\nIl team BigAnt Agency\nAssistente digitale del team BigAnt Agency.\nhttps://${ORIGIN_HOST}/growth/unsubscribe/${token}`;
 app.store.run('INSERT INTO gr_messages(id,workspace,lead_id,direction,subject,body,status,kind,created) VALUES(?,?,?,?,?,?,?,?,?)','mail-http-fixture',client.id,lead.id,'out','Oggetto di prova',text,'draft','initial',new Date().toISOString());app.growth.store.requestApproval(client.id,'mail-http-fixture');
 const a=app.store.one("SELECT * FROM os_approvals WHERE entity_id='mail-http-fixture'");const result=await request('/api/approvals/'+a.id,{method:'POST',headers,body:{decision:'approved',version:a.version}});assert.equal(result.status,200);assert.equal(app.store.one("SELECT version FROM gr_mail_approvals WHERE message_id='mail-http-fixture'").version,1);
 assert.equal((await request('/api/growth/messages/mail-http-fixture/send-preview',{headers})).body.canSend,false);
 assert.equal((await request('/api/growth/messages/mail-http-fixture',{method:'PATCH',headers,body:{version:1,status:'draft',subject:'Nuova versione'}})).status,200);
 assert.equal((await request('/api/approvals/'+a.id,{method:'POST',headers,body:{decision:'approved',version:a.version}})).status,409);
});
