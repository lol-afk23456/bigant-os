import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createApp} from '../server.js';

const ORIGIN_HOST='os.bigant.it.test';
const SOCIO_EMAIL='raffaele@bigant.it';
const SOCIO_PASSWORD='password-reale-collaudo-01';

async function setupReale(t,envExtra={}) {
  const app=createApp({origin:`https://${ORIGIN_HOST}`,env:{BIGANT_MODALITA:'reale',BIGANT_SOCIO_EMAIL:SOCIO_EMAIL,BIGANT_SOCIO_PASSWORD_INIZIALE:SOCIO_PASSWORD,...envExtra}});
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
  const login=await request('/api/login',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{email:SOCIO_EMAIL,password:SOCIO_PASSWORD}});
  assert.equal(login.status,200);
  assert.equal(login.body.user.role,'owner');
  assert.match(login.headers['set-cookie'][0],/Secure/);
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
  const login=await request('/api/login',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{email:SOCIO_EMAIL,password:SOCIO_PASSWORD}});
  const cookie=login.headers['set-cookie'][0].split(';')[0];
  const created=await request('/api/users',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`,Cookie:cookie,'X-CSRF-Token':login.body.csrf},body:{name:'Alfonso',email:'alfonso@bigant.it',role:'owner',password:'password-reale-alfonso-02'}});
  assert.equal(created.status,201);
});

test('modalità reale: non crea aziende o utenti DEMO',async t=>{
  const {request}=await setupReale(t);
  const login=await request('/api/login',{method:'POST',headers:{Origin:`https://${ORIGIN_HOST}`},body:{email:SOCIO_EMAIL,password:SOCIO_PASSWORD}});
  const cookie=login.headers['set-cookie'][0].split(';')[0];
  const overview=await request('/api/overview',{headers:{Cookie:cookie,'X-CSRF-Token':login.body.csrf}});
  assert.equal(overview.body.clients.length,1);
  assert.equal(overview.body.clients[0].name,'BigAnt');
});
