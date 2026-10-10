import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

async function fixture(){
 const nodes=new Map(),node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',open:false,hidden:true,textContent:'',addEventListener(){},focus(){},replaceChildren(){this.innerHTML='';},close(){this.open=false;},showModal(){this.open=true;}});return nodes.get(key);};
 const context=vm.createContext({URL,Date,Intl,crypto:{randomUUID},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},window:{},history:{replaceState(){}},location:{origin:'http://127.0.0.1',pathname:'/',hash:'',search:''},document:{querySelector:node,addEventListener(){}},fetch:async()=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>({user:null,demo:true,profiles:[]})})});
 for(const name of ['app.js','ufficio.js','cliente.js','workspace.js'])vm.runInContext(readFileSync(new URL('../public/'+name,import.meta.url),'utf8'),context,{filename:name});await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S');S.session={user:{id:'owner-fixture',role:'owner'},csrf:'fake'};S.clientId='client-a';S.view='clients';S.section='credentials';
 S.module={client:{id:'client-a',name:'Attività inventata'},memory:[{kind:'master',content:'Brief inventato',version:2}],onboarding:{notes:'Prova',completed:false,version:3},credentials:[{id:'cred-a',label:'Finta A'},{id:'cred-b',label:'Finta B'}],vaultReady:true};
 const calls=[];context.testApi=async(path,options={})=>{calls.push({path,options,clientAtCall:S.clientId});return {};};run('api=testApi;saved=async()=>{globalThis.savedCount=(globalThis.savedCount||0)+1;};');
 return {run,S,node,context,calls,action:(name,id)=>run(`ACTIONS[${JSON.stringify(name)}](${JSON.stringify(id)})`),submit:entries=>run('formHandler')(new Map(Object.entries(entries)))};
}
const secret={label:'Accesso inventato',username:'utente inventato',password:'SECRET_TEST_ONLY',url:'https://example.com',notes:'Nota inventata'};

test('scheda cliente: nessun salvataggio di moduli aperti per un’altra attività o sessione',async()=>{
 const scenarios=[['record-profile','profile'],['record-memory','brief/master','master'],['record-credential','credentials'],['record-contract','contract'],['record-onboarding','onboarding']];
 for(const [action,section,id]of scenarios)for(const change of [f=>{f.S.clientId='client-b';},f=>{f.S.session={...f.S.session};}]){
  const f=await fixture();f.S.section=section;f.action(action,id);change(f);
  await assert.rejects(f.submit({name:'Modifica di prova',content:'Nuovo testo',password:'FAKE',notes:'Nota'}),/pagina|scheda|attività|sessione/i);assert.equal(f.calls.length,0,action);
 }
});

test('scheda cliente: risposta credenziali tardiva non compare dopo cambio pagina o logout',async()=>{
 for(const change of [f=>{f.S.navigation++;},f=>{f.S.session=null;},f=>{f.S.clientId='client-b';},f=>{f.S.session.user.role='client';}]){
  const f=await fixture();let resolve;f.context.testApi=()=>new Promise(r=>{resolve=r;});f.run('api=testApi;');
  const pending=f.action('record-reveal','cred-a');change(f);resolve(secret);await pending;
  assert.doesNotMatch(f.node('#dialog-content').innerHTML,/SECRET_TEST_ONLY/);assert.equal(f.node('#dialog').open,false);
 }
});

test('scheda cliente: una risposta obsoleta non sostituisce un altro dialogo o una richiesta più recente',async()=>{
 const f=await fixture(),resolve=[];f.context.testApi=()=>new Promise(r=>resolve.push(r));f.run('api=testApi;');
 const first=f.action('record-reveal','cred-a'),second=f.action('record-reveal','cred-b');resolve[1]({...secret,password:'SECOND_TEST'});await second;resolve[0](secret);await first;
 assert.match(f.node('#dialog-content').innerHTML,/SECOND_TEST/);assert.doesNotMatch(f.node('#dialog-content').innerHTML,/SECRET_TEST_ONLY/);
 const g=await fixture();let answer;g.context.testApi=()=>new Promise(r=>{answer=r;});g.run('api=testApi;');const pending=g.action('record-reveal','cred-a');g.run('dialog("Altro modulo","Da conservare")');answer(secret);await pending;assert.match(g.node('#dialog-content').innerHTML,/Da conservare/);assert.doesNotMatch(g.node('#dialog-content').innerHTML,/SECRET_TEST_ONLY/);
});

test('scheda cliente: file PDF letto in ritardo non viene inviato dopo cambio attività',async()=>{
 const f=await fixture();f.S.section='contract';let reader;
 f.context.FileReader=class{readAsDataURL(){reader=this;}};f.action('record-contract');
 const pending=f.submit({title:'Contratto inventato',pdf:{size:40},startDate:'2026-10-01',endDate:'2026-11-01',noticeDays:'30'});
 f.S.clientId='client-b';reader.result='data:application/pdf;base64,JVBERi0=';reader.onload();await pending;assert.equal(f.calls.length,0);
});

test('scheda cliente: cliente vincolato nella richiesta, doppio submit ignorato e nessuna conferma su nuova pagina',async()=>{
 const f=await fixture();f.S.section='brief/master';f.action('record-memory','master');let resolve;
 f.context.testApi=async(path,options)=>{f.calls.push({path,options});return new Promise(r=>{resolve=r;});};f.run('api=testApi;');
 const a=f.submit({content:'Brief modificato inventato'}),b=f.submit({content:'Doppio clic'});await b;
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].path,'/api/client-record/memory?clientId=client-a');assert.equal(f.calls[0].options.scoped,false);assert.equal(f.calls[0].options.body.version,2);
 f.S.navigation++;resolve({ok:true});await a;assert.equal(f.context.savedCount,undefined);
});

test('scheda cliente: errori correnti ritentabili, errori vecchi ignorati e testi delle credenziali escapati',async()=>{
 const f=await fixture();f.S.section='profile';f.action('record-profile');f.context.testApi=async()=>{throw Error('Errore previsto');};f.run('api=testApi;');await assert.rejects(f.submit({name:'Prova'}),/Errore previsto/);f.context.testApi=async()=>({ok:true});f.run('api=testApi;');await f.submit({name:'Prova'});assert.equal(f.context.savedCount,1);
 const g=await fixture();let reject;g.context.testApi=()=>new Promise((_,r)=>{reject=r;});g.run('api=testApi;');const pending=g.action('record-reveal','cred-a');g.S.navigation++;reject(Error('Vecchio errore'));await assert.doesNotReject(pending);
 const h=await fixture();h.context.testApi=async()=>({...secret,label:'<script>',password:'<img src=x>',notes:'<iframe>'});h.run('api=testApi;');await h.action('record-reveal','cred-a');const html=h.node('#dialog-content').innerHTML;assert.match(html,/&lt;img src=x&gt;/);assert.doesNotMatch(html,/<script>|<img|<iframe/);
});

test('scheda cliente: ruoli, scheda sbagliata e identificativi non presenti non avviano richieste',async()=>{
 const f=await fixture();f.S.session.user.role='client';assert.throws(()=>f.action('record-credential'),/permessi/);f.S.session.user.role='collaborator';f.S.section='profile';assert.throws(()=>f.action('record-profile'),/permessi/);f.S.section='credentials';await assert.rejects(f.action('record-reveal','foreign-credential'),/scheda/);f.S.module.vaultReady=false;assert.throws(()=>f.action('record-credential'),/Archivio/);assert.equal(f.calls.length,0);
});

test('logout: invalidazione immediata della schermata prima della risposta di rete',async()=>{
 const f=await fixture();let resolveReveal,resolveLogout;
 f.context.testApi=(path)=>path.includes('/reveal?')?new Promise(r=>{resolveReveal=r;}):path==='/api/logout'?new Promise(r=>{resolveLogout=r;}):Promise.resolve({user:null,demo:true,profiles:[]});f.run('api=testApi;login=()=>{};');
 const reveal=f.action('record-reveal','cred-a'),logout=f.action('logout');resolveReveal(secret);await reveal;assert.equal(f.node('#dialog').open,false);assert.doesNotMatch(f.node('#dialog-content').innerHTML,/SECRET_TEST_ONLY/);resolveLogout({ok:true});await logout;
});

test('logout: attesa di rete impedisce nuove aperture e nasconde subito lo spazio precedente',async()=>{
 const f=await fixture();let resolveLogout;f.context.testApi=path=>path==='/api/logout'?new Promise(r=>{resolveLogout=r;}):Promise.resolve({user:null,demo:true,profiles:[]});f.run('api=testApi;login=()=>{};');
 const logout=f.action('logout');assert.equal(f.S.session,null);assert.equal(f.S.module,null);assert.match(f.node('#app').innerHTML,/Uscita in corso/);
 await assert.rejects(f.action('record-reveal','cred-a'),/Uscita in corso/);assert.throws(()=>f.action('record-credential'),/Uscita in corso/);resolveLogout({ok:true});await logout;assert.equal(f.S.signingOut,false);
});

test('logout: rete fallita non ripristina dati o credenziali del workspace',async()=>{
 const f=await fixture();f.context.testApi=async()=>{throw Error('Rete assente');};f.run('api=testApi;publicShell=(title,body)=>{$("#app").innerHTML=title+body;};');await f.action('logout');assert.equal(f.S.session,null);assert.equal(f.S.overview,null);assert.equal(f.S.module,null);assert.match(f.node('#app').innerHTML,/Uscita da verificare/);assert.doesNotMatch(f.node('#app').innerHTML,/SECRET_TEST_ONLY|Attività inventata/);
});
