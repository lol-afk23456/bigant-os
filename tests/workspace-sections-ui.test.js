import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

async function fixture(){
 const node={innerHTML:'',open:false,addEventListener(){},close(){this.open=false;},showModal(){this.open=true;}};
 const context=vm.createContext({URL,Date,Intl,crypto:{randomUUID},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},window:{},history:{replaceState(){}},location:{origin:'http://127.0.0.1',pathname:'/',hash:'',search:''},document:{querySelector:()=>node,addEventListener(){}},fetch:async()=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>({user:null,demo:true,profiles:[]})})});
 for(const file of ['app.js','cliente.js','workspace.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),context,{filename:file});await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S');S.session={user:{id:'owner',role:'owner',name:'Socio inventato'}};S.clientId='client-a';S.overview={clients:[{id:'client-a',name:'Attività inventata'}],currentClient:{terms_text:'REGOLAMENTO_PROVA',privacy_url:'https://example.com/privacy'},registry:{services:[]}};
 return {S,run};
}

test('scheda informativa: indice senza testi completi, una nota alla volta e modifica limitata a quella aperta',async()=>{
 const f=await fixture();f.S.view='clients';f.S.section='brief';f.S.module={client:{id:'client-a',name:'Attività inventata'},memory:['master','dna','strategy','feedback'].map((kind,i)=>({kind,content:'CONTENUTO_'+kind,version:i+1,updated_at:'2026-10-10T12:00:00Z'})),services:[],onboarding:{completed:false},credentials:[]};
 for(const role of ['owner','collaborator']){
  f.S.session.user.role=role;f.S.section='brief';const index=f.run('clientRecordsView()');assert.doesNotMatch(index,/CONTENUTO_/);assert.match(index,/clients:sections/);
  for(const kind of ['master','dna','strategy','feedback']){
   f.S.section='brief/'+kind;const detail=f.run('clientRecordsView()');assert.equal((detail.match(/CONTENUTO_/g)||[]).length,1);assert.match(detail,new RegExp('CONTENUTO_'+kind));assert.match(detail,/data-id="clients:brief"/);assert.doesNotThrow(()=>f.run(`ACTIONS['record-memory']('${kind}')`));
   assert.throws(()=>f.run(`ACTIONS['record-memory']('${kind==='master'?'dna':'master'}')`),/permessi/);
  }
 }
 f.S.section='brief/inesistente';assert.doesNotMatch(f.run('clientRecordsView()'),/CONTENUTO_/);assert.match(f.run('clientRecordsView()'),/clients:sections/);
});

test('Fidelity: impostazioni separate, ritorno unico e sottopagine non raggiungibili dal collaboratore',async()=>{
 const f=await fixture();f.S.view='fidelity';f.S.filter='';f.S.module={metrics:{programs:0,members:0,redemptions:0},campaigns:[],automations:[],jobs:[],wallet:{google:{enabled:false,checked:false,available:false,note:'NOTA_GOOGLE_PROVA'}}};
 for(const role of ['owner','client']){
  f.S.session.user.role=role;f.S.section='settings';const index=f.run('fidelitySectionsView()');assert.match(index,/settings\/policies/);assert.doesNotMatch(index,/REGOLAMENTO_PROVA|NOTA_GOOGLE_PROVA/);
  f.S.section='settings/policies';const policies=f.run('fidelitySectionsView()');assert.match(policies,/REGOLAMENTO_PROVA/);assert.doesNotMatch(policies,/NOTA_GOOGLE_PROVA/);assert.match(policies,/data-id="fidelity:settings"/);
  f.S.section='settings/google-wallet';const google=f.run('fidelitySectionsView()');assert.match(google,/NOTA_GOOGLE_PROVA/);assert.doesNotMatch(google,/REGOLAMENTO_PROVA|Apple Wallet/);
  f.S.section='settings/apple-wallet';const apple=f.run('fidelitySectionsView()');assert.match(apple,/Apple Wallet/);assert.doesNotMatch(apple,/REGOLAMENTO_PROVA|NOTA_GOOGLE_PROVA|google-wallet-activate/);
 }
 f.S.session.user.role='collaborator';for(const section of ['settings','settings/policies','settings/google-wallet']){f.S.section=section;assert.doesNotMatch(f.run('fidelitySectionsView()'),/REGOLAMENTO_PROVA|NOTA_GOOGLE_PROVA|Modifica documenti/);}
});

test('Fatturazione: anagrafiche e ditte separate, totali cliente fuori dal tracker',async()=>{
 const f=await fixture();f.S.view='administration';f.S.module={asOf:'2026-10-10',summary:{income_month_cents:0,arrears_cents:0,draft_invoice_cents:0},entities:[{id:'entity',name:'DITTA_PROVA'}],counterparties:[{name:'FORNITORE_PROVA',kind:'supplier'}],subscriptions:[],movements:[],billing:{tracker:[],customerBalances:[],dueSubscriptions:[],compensations:[],categories:[],incomeByClient:[{client_id:'client-a',cents:12345}]}};
 f.S.section='costs/parties';const index=f.run('billingView()');assert.doesNotMatch(index,/DITTA_PROVA|FORNITORE_PROVA/);assert.match(index,/administration:costs/);
 f.S.section='costs/parties/contacts';const contacts=f.run('billingView()');assert.match(contacts,/FORNITORE_PROVA/);assert.doesNotMatch(contacts,/DITTA_PROVA/);assert.match(contacts,/data-id="administration:costs\/parties"/);
 f.S.section='costs/parties/entities';const entities=f.run('billingView()');assert.match(entities,/DITTA_PROVA/);assert.doesNotMatch(entities,/FORNITORE_PROVA|Nuova anagrafica/);
 f.S.section='tracker';assert.doesNotMatch(f.run('billingView()'),/Incassato fino al|123,45/);
 f.S.section='customer-income';const income=f.run('billingView()');assert.match(income,/123,45/);assert.doesNotMatch(income,/billing-category|Prelievi/);assert.match(income,/data-id="administration:sections"/);
});
