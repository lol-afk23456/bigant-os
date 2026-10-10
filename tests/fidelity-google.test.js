import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,verify,randomUUID} from 'node:crypto';
import {openStore,seedCore} from '../src/store.js';
import {createFidelityModule} from '../src/fidelity.js';
import {googleWalletConfig,googleSaveJwt} from '../src/fidelity-google.js';
import {createConnections} from '../src/connections.js';
const keys=generateKeyPairSync('rsa',{modulusLength:2048});
const account={type:'service_account',client_email:'fixture@inventato.iam.gserviceaccount.com',private_key_id:'chiave-test',private_key:keys.privateKey.export({type:'pkcs8',format:'pem'})};
const decode=token=>JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());
function verifyJwt(token){const parts=token.split('.');assert.equal(verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),keys.publicKey,Buffer.from(parts[2],'base64url')),true);return decode(token);}
async function fixture(t,{enabled=true,type='stamps'}={}){
 const store=openStore();seedCore(store);t.after(()=>store.close());
 const env={BIGANT_GOOGLE_WALLET_ENABLED:enabled?'true':'false',GOOGLE_ISSUER_ID:'1234567',GOOGLE_SERVICE_ACCOUNT_JSON:JSON.stringify(account)},origin='https://os.example';
 const owner=store.one("SELECT * FROM os_users WHERE id='demo-owner'"),client=store.one("SELECT * FROM os_users WHERE id='demo-client'");
 const resources=new Map(),calls=[],control={};let clockValue=0;const clock=()=>new Date(Date.now()+clockValue);
 const reply=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
 const fetchImpl=async(url,options)=>{
  url=String(url);calls.push({url,options});assert.equal(options.redirect,'error');
  if(url==='https://oauth2.googleapis.com/token'){
   const claims=verifyJwt(new URLSearchParams(options.body).get('assertion'));assert.equal(claims.scope,'https://www.googleapis.com/auth/wallet_object.issuer');assert.equal(claims.aud,url);assert.equal(claims.exp-claims.iat,3600);
   return reply({access_token:'token-inventato',token_type:'Bearer',expires_in:3600});
  }
  assert.ok(url.startsWith('https://walletobjects.googleapis.com/walletobjects/v1/'));assert.equal(options.headers.Authorization,'Bearer token-inventato');
  const path=decodeURIComponent(url.split('/v1/')[1]),body=options.body?JSON.parse(options.body):null;
  if(control.before)await control.before(path,options);
  if(control.error)return reply({error:{message:'messaggio-non-da-mostrare'}},control.error);
  if(options.method==='GET')return resources.has(path)?reply(resources.get(path)):reply({},404);
  const key=options.method==='POST'?path+'/'+body.id:path;
  if(options.method==='POST'&&resources.has(key))return reply({},409);
  if(options.method==='PATCH'&&!resources.has(key))return reply({},404);
  resources.set(key,{...(resources.get(key)||{}),...body});
  if(control.timeoutOnce){control.timeoutOnce=false;throw Error('Timeout finto dopo scrittura');}
  return reply(resources.get(key));
 };
 const f=createFidelityModule({store,origin,realMode:true,env,clock,walletProviderOptions:{fetchImpl}});
 const call=async(method,path,body={},user=owner,clientId='demo-bottega')=>(await f.handle({method,path,body,user,clientId})).data;
 const p=await call('POST','/programs',{name:'Programma di prova',type,rewardThreshold:type==='coupon'?1:10,rewardName:'Premio di prova',pointsPerEuro:2});
 const m=await call('POST','/members',{programId:p.id,name:'Persona inventata',email:'persona@fixture.example',marketingConsent:false});
 const state=()=>f.state('demo-bottega',owner).wallet.google;
 const check=()=>call('POST','/google-wallet/check',{memberId:m.id,version:state().version,acknowledged:true});
 const activate=(enabled=true)=>call('POST','/google-wallet/activate',{enabled,version:state().version,deviceVerified:true});
 const issue=(body={acknowledged:true})=>call('POST','/public/cards/'+m.publicToken+'/google',body,null);
 const credit=()=>call('POST','/members/'+m.id+'/transactions',{type:'credit',amount:3,idempotencyKey:randomUUID()},client);
 const object=()=>[...resources.values()].find(row=>row.classId);
 return {restart:()=>createFidelityModule({store,origin,realMode:true,env,clock,walletProviderOptions:{fetchImpl}}),store,env,f,call,owner,client,state,check,activate,issue,credit,p,m,resources,calls,control,object,advance:ms=>clockValue+=ms};
}
test('Wallet chiuso di default: nessuna rete, ruolo del socio e metodo POST obbligatori',async t=>{
 const x=await fixture(t,{enabled:false});assert.equal(x.state().configured,true);assert.equal(x.state().enabled,false);
 await assert.rejects(x.check(),/non abilitato/);await assert.rejects(x.issue(),/non abilitato/);
 await assert.rejects(x.call('GET','/public/cards/'+x.m.publicToken+'/google',{},null),e=>e.status===405);
 await assert.rejects(x.call('POST','/google-wallet/check',{memberId:x.m.id,version:0},x.client),e=>e.status===403);
 assert.equal(x.calls.length,0);assert.equal(x.store.one('SELECT google_issued FROM fi_members WHERE id=?',x.m.id).google_issued,0);
});
test('carta Google firmata, attivazione attestata dal socio, accredito e storno aggiornano lo stesso oggetto',async t=>{
 const x=await fixture(t);const proof=await x.check(),claims=verifyJwt(proof.url.split('/save/')[1]);assert.deepEqual(claims.payload,{loyaltyObjects:[{id:x.object().id}]});assert.deepEqual(claims.origins,['https://os.example']);
 assert.equal(x.state().checked,true);assert.equal(x.state().enabled,false);
 await assert.rejects(x.call('POST','/google-wallet/activate',{version:x.state().version,enabled:true}),/prova su Android/);await x.activate();
 await assert.rejects(x.issue({}),/Conferma/);assert.ok((await x.issue()).url.startsWith('https://pay.google.com/gp/v/save/'));
 const credit=await x.credit();assert.equal(x.object().loyaltyPoints.balance.int,0);await x.f.runWalletJobs();assert.equal(x.object().loyaltyPoints.balance.int,3);
 await x.call('POST','/transactions/'+credit.transaction.id+'/reverse',{note:'Storno di prova',idempotencyKey:randomUUID()});await x.f.runWalletJobs();assert.equal(x.object().loyaltyPoints.balance.int,0);
 assert.equal([...x.resources.keys()].filter(key=>key.startsWith('loyaltyObject')).length,1);
 const output=JSON.stringify(x.f.state('demo-bottega',x.owner))+JSON.stringify(x.store.query('SELECT * FROM os_audit'));assert.ok(!output.includes('PRIVATE KEY'));assert.ok(!output.includes('token-inventato'));assert.ok(!output.includes('/gp/v/save/'));
 assert.ok(!JSON.stringify(x.store.query('SELECT * FROM os_settings')).includes('PRIVATE KEY'));
});
test('coupon salvato come offer, riscatto monouso reso inattivo nel Wallet',async t=>{
 const x=await fixture(t,{type:'coupon'});const result=await x.check();assert.ok(decode(result.url.split('/save/')[1]).payload.offerObjects);await x.activate();
 await x.call('POST','/members/'+x.m.id+'/transactions',{type:'redeem',idempotencyKey:randomUUID()},x.client);await x.f.runWalletJobs();assert.equal(x.object().state,'INACTIVE');
});
test('pausa, revoca del socio e rotazione delle chiavi invalidano le uscite prima della rete',async t=>{
 const x=await fixture(t);await x.check();await x.activate();const before=x.calls.length;await x.activate(false);await assert.rejects(x.issue(),/sospeso/);assert.equal(x.calls.length,before);
 await x.activate();x.store.run('UPDATE os_users SET active=0 WHERE id=?',x.owner.id);await assert.rejects(x.issue(),/sospeso/);x.store.run('UPDATE os_users SET active=1 WHERE id=?',x.owner.id);
 x.env.GOOGLE_SERVICE_ACCOUNT_JSON=JSON.stringify({...account,private_key_id:'nuova-chiave'});assert.equal(x.state().checked,false);await assert.rejects(x.issue(),/sospeso/);assert.equal(x.calls.length,before);
});
test('errore dopo scrittura: backoff e ripresa aggiornano senza creare una seconda carta',async t=>{
 const x=await fixture(t);await x.check();await x.activate();await x.credit();x.control.timeoutOnce=true;
 await x.f.runWalletJobs();assert.ok(x.store.one("SELECT id FROM fi_jobs WHERE status='queued' AND attempts=1"));const before=x.calls.length;const restarted=x.restart();await restarted.runWalletJobs();assert.equal(x.calls.length,before);
 x.advance(6000);await x.f.runWalletJobs();assert.equal(x.object().loyaltyPoints.balance.int,3);assert.equal([...x.resources.keys()].filter(key=>key.startsWith('loyaltyObject')).length,1);
});
test('anonimizzazione durante un aggiornamento: link revocato e dati rimossi dall’oggetto remoto',async t=>{
 const x=await fixture(t);await x.check();await x.activate();await x.credit();let deleted=false;
 x.control.before=async(path,options)=>{if(!deleted&&path.startsWith('loyaltyObject')&&options.method==='PATCH'){deleted=true;await x.call('DELETE','/members/'+x.m.id);}};
 await x.f.runWalletJobs();await assert.rejects(x.issue(),e=>e.status===404);x.control.before=null;x.advance(6000);await x.f.runWalletJobs();assert.equal(x.object().state,'INACTIVE');assert.equal(x.object().accountName,'');assert.equal(x.object().barcode,null);assert.deepEqual(x.object().textModulesData,[]);
});
test('programma sospeso accoda una revoca senza aspettare un nuovo accredito',async t=>{
 const x=await fixture(t);await x.check();await x.activate();await x.call('PATCH','/programs/'+x.p.id,{active:false});await x.f.runWalletJobs();assert.equal(x.object().state,'INACTIVE');
});
test('nessuna emissione di fixture DEMO e nessuna chiave Wallet salvata nella custodia del database',async t=>{
 const x=await fixture(t);x.store.run('UPDATE fi_programs SET simulation=1 WHERE id=?',x.p.id);await assert.rejects(x.check(),/DEMO/);assert.equal(x.calls.length,0);
 const connections=createConnections({store:x.store,env:{BIGANT_SECRET_KEY:Buffer.alloc(32,3).toString('base64')}});assert.throws(()=>connections.save(x.owner,'wallet',{version:0,fields:{issuerId:'123',serviceAccount:JSON.stringify(account)}}),/server/);assert.equal(connections.state(x.owner).items.find(row=>row.id==='wallet').fields.length,0);
});
test('configurazione invalida, chiave debole e tentativo di cambiare destinazione OAuth rifiutati',()=>{
 assert.throws(()=>googleWalletConfig({},'https://os.example'),/non valida/);
 const weak=generateKeyPairSync('rsa',{modulusLength:1024}).privateKey.export({type:'pkcs8',format:'pem'});
 assert.throws(()=>googleWalletConfig({GOOGLE_ISSUER_ID:'123',GOOGLE_SERVICE_ACCOUNT_JSON:JSON.stringify({...account,private_key:weak})},'https://os.example'),/non valida/);
 const cfg=googleWalletConfig({GOOGLE_ISSUER_ID:'123',GOOGLE_SERVICE_ACCOUNT_JSON:JSON.stringify({...account,token_uri:'https://evil.example'})},'https://os.example');
 assert.equal(decode(googleSaveJwt(cfg,'123.member_id','loyalty')).aud,'google');assert.throws(()=>googleSaveJwt(cfg,'999.member','loyalty'),/non valida/);
});

test('errore di autorizzazione invalida il collaudo senza mostrare risposte o segreti Google',async t=>{
 const x=await fixture(t);await x.check();await x.activate();await x.credit();x.control.error=403;await x.f.runWalletJobs();
 assert.equal(x.state().checked,false);assert.equal(x.state().enabled,false);const before=x.calls.length;await x.f.runWalletJobs();assert.equal(x.calls.length,before);
 assert.ok(!JSON.stringify(x.f.state('demo-bottega',x.owner)).includes('messaggio-non-da-mostrare'));x.control.error=null;await x.check();await x.activate();await x.f.runWalletJobs();assert.equal(x.object().loyaltyPoints.balance.int,3);
 await assert.rejects(x.call('POST','/google-wallet/retry',{}),e=>e.status===400);
});
test('cambio issuer, isolamento tra clienti e richieste simultanee non duplicano la tessera',async t=>{
 const x=await fixture(t);await assert.rejects(x.call('POST','/google-wallet/check',{memberId:x.m.id,version:0,acknowledged:true},x.owner,'demo-bigant'),e=>e.status===404);
 await x.check();await x.activate();let reached;const entered=new Promise(r=>reached=r);let release;const latch=new Promise(r=>release=r);
 x.control.before=async path=>{if(path.startsWith('loyaltyObject')){reached();await latch;}};
 const pending=x.issue();await entered;await assert.rejects(x.issue(),/già in corso/);release();await pending;x.control.before=null;
 const before=x.calls.length;x.env.GOOGLE_ISSUER_ID='7654321';await assert.rejects(x.check(),/migrare/);assert.equal(x.calls.length,before);assert.equal([...x.resources.keys()].filter(key=>key.startsWith('loyaltyObject')).length,1);
});
test('scadenza e revoca del servizio inattivano la tessera anche senza movimenti',async t=>{
 for(const cause of ['expiry','service']){
  const x=await fixture(t);await x.check();await x.activate();
  if(cause==='expiry')x.store.run('UPDATE fi_programs SET expires_at=? WHERE id=?',new Date(Date.now()-1000).toISOString(),x.p.id);
  else x.store.run("UPDATE os_clients SET services_json='[]' WHERE id='demo-bottega'");
  await x.f.runWalletJobs();assert.equal(x.object().state,'INACTIVE');assert.equal(x.object().barcode,null);
 }
});
test('aggiornare un programma conserva approvazione Google e rimuove scadenze e posizioni obsolete',async t=>{
 const x=await fixture(t);await x.call('PATCH','/programs/'+x.p.id,{expiresAt:'2090-01-01T00:00:00Z',locations:[{latitude:40,longitude:15,relevantText:'Sede di prova'}]});await x.check();await x.activate();
 const classKey=[...x.resources.keys()].find(key=>key.startsWith('loyaltyClass'));x.resources.get(classKey).reviewStatus='APPROVED';
 await x.call('PATCH','/programs/'+x.p.id,{expiresAt:null,locations:[],name:'Nuovo nome del programma'});await x.f.runWalletJobs();
 assert.equal(x.resources.get(classKey).reviewStatus,'APPROVED');assert.deepEqual(x.resources.get(classKey).merchantLocations,[]);assert.equal(x.resources.get(classKey).programName,'Nuovo nome del programma');assert.equal(x.object().validTimeInterval,null);
});
test('iscrizione pubblica reale richiede documenti e servizio; le vecchie tessere mantengono DEMO',async t=>{
 const x=await fixture(t);x.store.run("UPDATE os_clients SET privacy_url='',terms_text='' WHERE id='demo-bottega'");const slug=x.store.one("SELECT slug FROM os_clients WHERE id='demo-bottega'").slug;
 assert.deepEqual((await x.call('GET','/public/join/'+slug,{},null)).programs,[]);
 await assert.rejects(x.call('POST','/public/join/'+slug,{programId:x.p.id,name:'Iscritto inventato',email:'nuovo@fixture.example',acceptTerms:true},null),/configurazione/);
 x.store.run('UPDATE fi_programs SET simulation=1 WHERE id=?',x.p.id);const card=await x.call('GET','/public/cards/'+x.m.publicToken,{},null);assert.equal(card.demo,true);assert.equal(card.program.demo,true);
});


test('dopo otto errori si ferma anche la coda di saldi nuovi; ripresa manuale senza duplicati',async t=>{
 const x=await fixture(t);await x.check();await x.activate();await x.credit();await x.credit();x.control.error=500;
 for(let i=0;i<8;i++){await x.f.runWalletJobs();x.advance(600000);}
 assert.equal(x.store.one("SELECT count(*) n FROM fi_jobs WHERE status='queued'").n,0);const before=x.calls.length;await x.f.runWalletJobs();assert.equal(x.calls.length,before);
 x.control.error=null;const job=x.store.one("SELECT id FROM fi_jobs WHERE status='failed'");assert.ok(job);await x.call('POST','/google-wallet/retry',{jobId:job.id});await x.f.runWalletJobs();assert.equal(x.object().loyaltyPoints.balance.int,6);
});
test('ripresa di un intento interrotto; una carta mai richiesta non viene emessa dalla coda',async t=>{
 const x=await fixture(t);await x.credit();
 await x.check();await x.activate();await x.f.runWalletJobs();
 const other=await x.call('POST','/members',{programId:x.p.id,name:'Seconda persona inventata',email:'altra@fixture.example'});
 await x.call('POST','/members/'+other.id+'/transactions',{type:'credit',amount:1,idempotencyKey:randomUUID()});const otherJob=x.store.one('SELECT id FROM fi_jobs WHERE member_id=?',other.id);
 await assert.rejects(x.call('POST','/google-wallet/retry',{jobId:otherJob.id}),e=>e.status===404);
 x.store.run("UPDATE fi_google_objects SET status='pending' WHERE member_id=?",x.m.id);x.store.run("UPDATE fi_jobs SET status='done' WHERE member_id=?",x.m.id);
 await x.restart().runWalletJobs();assert.equal(x.store.one('SELECT status FROM fi_google_objects WHERE member_id=?',x.m.id).status,'ready');assert.equal([...x.resources.keys()].filter(key=>key.startsWith('loyaltyObject')).length,1);
});
