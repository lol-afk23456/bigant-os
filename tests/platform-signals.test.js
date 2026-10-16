import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {openStore,seedCore} from '../src/store.js';
import {createConnections} from '../src/connections.js';
import {createGrowthModule} from '../src/growth.js';
import {createFidelityModule} from '../src/fidelity.js';
import {mailFixture} from './helpers/growth-mail-fixture.js';

const noNetwork=()=>{throw Error('Rete vietata durante la lettura dei segnali');};
function readOnly(store,read,calls=[]){
 const before=store.one('SELECT total_changes() n').n,requests=calls.length;
 try{return read();}finally{
  assert.equal(store.one('SELECT total_changes() n').n,before,'la lettura non scrive, neppure INSERT OR IGNORE o audit');
  assert.equal(calls.length,requests,'la lettura non interroga il fornitore');
 }
}
function emptyFixture(t,{realMode=false}={}){
 const store=openStore();seedCore(store);t.after(()=>store.close());t.mock.method(globalThis,'fetch',noNetwork);
 const owner=store.one("SELECT * FROM os_users WHERE id='demo-owner'"),connections=createConnections({store,env:{}});
 const growth=createGrowthModule({store,realMode,connections,origin:'https://os.example',providerOptions:{fetchImpl:noNetwork}});
 const fidelity=createFidelityModule({store,realMode,origin:'https://os.example',env:{},walletProviderOptions:{fetchImpl:noNetwork}});
 return {store,owner,connections,growth,fidelity};
}
function assertMinimal(growth,fidelity){
 assert.deepEqual(Object.keys(growth).sort(),['analysis','calendar','drafts','gmail','paused','research','simulation']);
 for(const phase of ['research','analysis','drafts'])assert.deepEqual(Object.keys(growth[phase]).sort(),['available','checked','enabled','lastCheck']);
 assert.deepEqual(Object.keys(growth.gmail).sort(),['available','checked','configured','enabled','lastCheck']);
 assert.deepEqual(Object.keys(fidelity).sort(),['appleWallet','googleWallet','simulation']);
 assert.deepEqual(Object.keys(fidelity.googleWallet).sort(),['available','checkedCount','configured','enabledCount','lastCheck']);
 assert.deepEqual(Object.keys(growth.calendar).sort(),['available','checked','configured','enabled','lastCheck']);assert.equal(growth.calendar.enabled,false);assert.deepEqual(fidelity.appleWallet,{enabled:false});
}

test('segnali DEMO: nessuna attivazione né creazione di configurazioni alla lettura',t=>{
 const f=emptyFixture(t),g=readOnly(f.store,()=>f.growth.progress(f.owner)),w=readOnly(f.store,()=>f.fidelity.progress(f.owner));
 assertMinimal(g,w);assert.equal(g.simulation,true);assert.equal(w.simulation,true);assert.equal(g.paused,true);
 for(const phase of ['research','analysis','drafts','gmail'])assert.equal(g[phase].enabled,false);
 assert.equal(w.googleWallet.enabledCount,0);assert.equal(f.store.one('SELECT count(*) n FROM gr_workspaces').n,0);
});

test('installazione reale vuota: consultazioni ripetute non inizializzano workspace, collaudi o audit',t=>{
 const f=emptyFixture(t,{realMode:true});
 for(let i=0;i<2;i++){
  const g=readOnly(f.store,()=>f.growth.progress(f.owner)),w=readOnly(f.store,()=>f.fidelity.progress(f.owner));
  assertMinimal(g,w);assert.equal(g.simulation,false);assert.equal(w.simulation,false);assert.equal(g.gmail.configured,false);assert.equal(w.googleWallet.configured,false);
 }
 for(const table of ['gr_workspaces','gr_runtime','gr_mail_config','fi_google_config'])assert.equal(f.store.one(`SELECT count(*) n FROM ${table}`).n,0);
});

test('segnali riservati a soci correnti: sessione obsoleta, ruoli e disattivazione',t=>{
 const f=emptyFixture(t,{realMode:true});
 for(const module of [f.growth,f.fidelity]){
  for(const id of ['demo-client','demo-collaborator','missing'])assert.throws(()=>readOnly(f.store,()=>module.progress({id,role:'owner',active:1})),e=>e.status===403);
 }
 for(const change of ["role='collaborator'","role='owner',active=0"]){
  f.store.run('UPDATE os_users SET '+change+" WHERE id='demo-owner'");
  for(const module of [f.growth,f.fidelity])assert.throws(()=>module.progress(f.owner),e=>e.status===403);
 }
});

test('Growth collaudato con fornitori finti: segnali minimi, nessuna chiamata o apertura credenziali',async t=>{
 t.mock.method(globalThis,'fetch',noNetwork);const f=mailFixture(t);await f.enable();
 t.mock.method(f.connections,'readForRuntime',noNetwork);t.mock.method(f.googleAuth,'credentials',noNetwork);
 const g=readOnly(f.store,()=>f.growth.progress(f.owner,'demo-bottega'),f.calls);
 assert.equal(g.simulation,false);assert.equal(g.paused,false);
 for(const phase of ['research','analysis','drafts','gmail']){assert.equal(g[phase].checked,true);assert.equal(g[phase].enabled,true);assert.ok(g[phase].lastCheck);}
 assert.equal(g.gmail.configured,true);assert.equal(g.calendar.enabled,false);assert.equal(g.calendar.checked,false);
 const serialized=JSON.stringify(g);assert.doesNotMatch(serialized,/mittente|fixture\.example|inventat|fingerprint|provider|searchCents|signature|source|preview/);
});

test('Growth: pausa, accessi/versioni superati, prerequisiti e revoca non risultano attivi',async t=>{
 t.mock.method(globalThis,'fetch',noNetwork);
 for(const change of ['pause','brave','google','runtime','prerequisite','authorizer','inactive-client','demo-workspace'])await t.test(change,async()=>{
  const f=mailFixture(t);await f.enable();let reader=f.owner;
  if(change==='pause')f.growth.store.saveSettings('demo-bigant',{paused:true});
  if(change==='brave')f.connections.save(f.owner,'brave',{version:1,fields:{apiKey:'nuova-chiave-inventata'}});
  if(change==='google')f.connections.save(f.owner,'google',{version:f.googleAuth.state(f.owner).version,fields:{clientId:'nuovo-client',clientSecret:'nuovo-segreto'}});
  if(change==='runtime')f.growth.runtime.save(f.owner,'demo-bigant',{version:1,provider:'openai',searchCents:6,aiCents:25});
  if(change==='prerequisite')f.store.run("UPDATE gr_runtime SET search_cents=0 WHERE workspace='demo-bigant'");
  if(change==='authorizer'){
   f.store.run("UPDATE os_users SET role='owner' WHERE id='demo-collaborator'");reader=f.store.one("SELECT * FROM os_users WHERE id='demo-collaborator'");
   f.store.run("UPDATE os_users SET active=0 WHERE id='demo-owner'");
  }
  if(change==='inactive-client')f.store.run("UPDATE os_clients SET active=0 WHERE id='demo-bigant'");
  if(change==='demo-workspace')f.store.run("UPDATE gr_workspaces SET simulation=1 WHERE id='demo-bigant'");
  const g=readOnly(f.store,()=>f.growth.progress(reader),f.calls);
  assert.equal(g.gmail.enabled,false);
  if(change==='google'){assert.equal(g.gmail.configured,false);assert.equal(g.gmail.checked,false);assert.equal(g.research.enabled,true);}
  else for(const phase of ['research','analysis','drafts'])assert.equal(g[phase].enabled,false);
  if(change==='pause'){assert.equal(g.paused,true);assert.equal(g.drafts.checked,true);}
  if(['brave','runtime'].includes(change)){assert.equal(g.research.checked,false);assert.equal(g.research.lastCheck,null);}
  if(change==='demo-workspace')assert.equal(g.simulation,true);
 });
});

test('Growth senza chiave del vault: vecchi collaudi non sono capacità disponibili per eseguire',async t=>{
 t.mock.method(globalThis,'fetch',noNetwork);const f=mailFixture(t);await f.enable();
 const connections=createConnections({store:f.store,env:{}}),growth=createGrowthModule({store:f.store,connections,googleAuth:f.googleAuth,realMode:true,gmailEnabled:true,externalEnabled:true,origin:'https://os.example',providerOptions:{fetchImpl:noNetwork}});
 const g=readOnly(f.store,()=>growth.progress(f.owner),f.calls);
 for(const phase of ['research','analysis','drafts','gmail'])assert.equal(g[phase].enabled,false);
});

const privateKey=generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({type:'pkcs8',format:'pem'});
async function walletFixture(t){
 const store=openStore();seedCore(store);t.after(()=>store.close());
 const owner=store.one("SELECT * FROM os_users WHERE id='demo-owner'"),account={type:'service_account',client_email:'wallet@inventato.iam.gserviceaccount.com',private_key_id:'fixture-key',private_key:privateKey};
 const env={BIGANT_GOOGLE_WALLET_ENABLED:'true',GOOGLE_ISSUER_ID:'1234567',GOOGLE_SERVICE_ACCOUNT_JSON:JSON.stringify(account)},calls=[],objects=new Map();
 const fetchImpl=async(url,options)=>{
  const value=String(url);calls.push(value);const reply=(data,status=200)=>new Response(JSON.stringify(data),{status});
  if(value==='https://oauth2.googleapis.com/token')return reply({access_token:'inventato',token_type:'Bearer',expires_in:3600});
  assert.ok(value.startsWith('https://walletobjects.googleapis.com/walletobjects/v1/'));
  const path=decodeURIComponent(value.split('/v1/')[1]),body=options.body?JSON.parse(options.body):null;
  if(options.method==='GET')return objects.has(path)?reply(objects.get(path)):reply({},404);
  const key=options.method==='POST'?path+'/'+body.id:path;objects.set(key,{...objects.get(key),...body});return reply(objects.get(key));
 };
 const fidelity=createFidelityModule({store,realMode:true,origin:'https://os.example',env,walletProviderOptions:{fetchImpl}});
 const call=async(path,body,user=owner)=>(await fidelity.handle({method:'POST',path,body,user,clientId:'demo-bottega'})).data;
 const program=await call('/programs',{name:'Programma inventato',type:'stamps',rewardThreshold:10,rewardName:'Premio inventato'});
 const member=await call('/members',{programId:program.id,name:'Persona inventata',email:'persona@fixture.example',marketingConsent:false});
 await call('/google-wallet/check',{version:0,memberId:member.id,acknowledged:true});
 await call('/google-wallet/activate',{version:1,enabled:true,deviceVerified:true});
 return {store,owner,env,account,calls,fidelity,call};
}

test('Wallet: conteggi solo delle attività attive Fidelity, senza iscritti e senza scritture',async t=>{
 t.mock.method(globalThis,'fetch',noNetwork);const f=await walletFixture(t);
 let p=readOnly(f.store,()=>f.fidelity.progress(f.owner),f.calls);assert.equal(p.googleWallet.configured,true);assert.equal(p.googleWallet.checkedCount,1);assert.equal(p.googleWallet.enabledCount,1);assert.ok(p.googleWallet.lastCheck);
 assert.deepEqual(p.appleWallet,{enabled:false});assert.doesNotMatch(JSON.stringify(p),/persona|inventato|PRIVATE KEY|member|tenant|issuer|fingerprint|@/);
 f.store.run("UPDATE os_clients SET active=0 WHERE id='demo-bottega'");
 p=readOnly(f.store,()=>f.fidelity.progress(f.owner),f.calls);assert.equal(p.googleWallet.checkedCount,0);assert.equal(p.googleWallet.enabledCount,0);assert.equal(p.googleWallet.lastCheck,null);
 f.store.run("UPDATE os_clients SET active=1,services_json='[]' WHERE id='demo-bottega'");
 p=readOnly(f.store,()=>f.fidelity.progress(f.owner),f.calls);assert.equal(p.googleWallet.enabledCount,0);assert.equal(p.googleWallet.checkedCount,0);
});

test('Wallet: pausa, flag spento, fingerprint cambiato e socio revocato annullano gli attivi',async t=>{
 t.mock.method(globalThis,'fetch',noNetwork);
 for(const change of ['pause','flag','fingerprint','authorizer'])await t.test(change,async()=>{
  const f=await walletFixture(t);let reader=f.owner;
  if(change==='pause')await f.call('/google-wallet/activate',{version:2,enabled:false});
  if(change==='flag')f.env.BIGANT_GOOGLE_WALLET_ENABLED='false';
  if(change==='fingerprint')f.env.GOOGLE_SERVICE_ACCOUNT_JSON=JSON.stringify({...f.account,private_key_id:'rotated-key'});
  if(change==='authorizer'){f.store.run("UPDATE os_users SET role='owner' WHERE id='demo-collaborator'");reader=f.store.one("SELECT * FROM os_users WHERE id='demo-collaborator'");f.store.run("UPDATE os_users SET active=0 WHERE id='demo-owner'");}
  const p=readOnly(f.store,()=>f.fidelity.progress(reader),f.calls);assert.equal(p.googleWallet.enabledCount,0);
  if(change==='fingerprint'){assert.equal(p.googleWallet.checkedCount,0);assert.equal(p.googleWallet.lastCheck,null);}
 });
});
