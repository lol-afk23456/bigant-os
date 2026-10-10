import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

async function fixture(){
 const handlers={},routes=[];
 const node={innerHTML:'',open:false,focus(){},addEventListener(){},close(){this.open=false;},showModal(){this.open=true;}};
 const context=vm.createContext({URL,Date,Intl,crypto:{randomUUID},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},window:{},history:{replaceState(a,b,route){routes.push(route);}},location:{origin:'http://127.0.0.1',pathname:'/',hash:'',search:''},document:{querySelector:()=>node,addEventListener(name,callback){(handlers[name]||=[]).push(callback);}},fetch:async()=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>({user:null,demo:true,profiles:[]})})});
 for(const file of ['app.js','cliente.js','workspace.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),context,{filename:file});await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S');S.session={user:{id:'owner',role:'owner',name:'Socio inventato'}};S.clientId='client-a';S.overview={clients:[{id:'client-a',name:'Attività inventata'}],currentClient:{terms_text:'REGOLAMENTO_PROVA',privacy_url:'https://example.com/privacy'},registry:{services:[]}};
 return {S,run,handlers,routes};
}

function serviceData(){return {clientId:'client-a',clientName:'Attività inventata',active:true,service:{id:'social',name:'Social media',status:'implemented',inputs:['METODO_RISERVATO'],outputs:['Consegna'],agentNames:['SPECIALISTA_UNICO'],deliverables:'CONSEGNA_TEAM'},sections:[{name:'Prima parte',missing:'DETTAGLIO_PARTE_UNO'},{name:'Seconda parte',missing:'DETTAGLIO_PARTE_DUE'}],tasks:[{id:'task-a',title:'Lavoro A',source:'FONTE_LAVORO_A',status:'todo',actual_minutes:12}],contents:[{id:'content-a',title:'Contenuto A',body:'TESTO_CONTENUTO_A <script>',state:'IN PRODUZIONE',source:'FONTE_CONTENUTO_A',version:2},{id:'content-b',title:'Contenuto B',body:'TESTO_CONTENUTO_B',state:'APPROVATO',version:1}],approvals:[{id:'approval-a',title:'DECISIONE_UNICA',status:'pending'}],integrations:[{name:'FONTE_ESTERNA_UNICA',status:'Non collegato'}]};}

test('pagina servizio: indice a card e una sola sezione o contenuto completo alla volta',async()=>{
 const f=await fixture();f.S.module=serviceData();f.run("setViewRoute('service:social')");
 const markers=['METODO_RISERVATO','DETTAGLIO_PARTE_UNO','DETTAGLIO_PARTE_DUE','FONTE_LAVORO_A','TESTO_CONTENUTO_A','TESTO_CONTENUTO_B','DECISIONE_UNICA','FONTE_ESTERNA_UNICA','SPECIALISTA_UNICO'];
 let html=f.run('serviceWorkspaceView()');for(const marker of markers)assert.ok(!html.includes(marker),marker);assert.match(html,/service:social\/contents/);
 for(const [section,expected] of [['method','METODO_RISERVATO'],['parts/0','DETTAGLIO_PARTE_UNO'],['parts/1','DETTAGLIO_PARTE_DUE'],['tasks/task-a','FONTE_LAVORO_A'],['contents/content-a','TESTO_CONTENUTO_A'],['contents/content-b','TESTO_CONTENUTO_B'],['approvals','DECISIONE_UNICA'],['sources','FONTE_ESTERNA_UNICA'],['specialists','SPECIALISTA_UNICO']]){
  f.run(`setViewRoute('service:social/${section}')`);html=f.run('serviceWorkspaceView()');assert.ok(html.includes(expected),section);for(const marker of markers.filter(x=>x!==expected))assert.ok(!html.includes(marker),section+' '+marker);assert.match(html,/Indietro/);
 }
 f.run("setViewRoute('service:social/contents')");html=f.run('serviceWorkspaceView()');assert.match(html,/Contenuto A|Contenuto B/);assert.doesNotMatch(html,/TESTO_CONTENUTO_/);
 f.run("setViewRoute('service:social/contents/content-a')");html=f.run('serviceWorkspaceView()');assert.match(html,/&lt;script&gt;/);assert.match(html,/data-id="service:social\/contents"/);assert.match(html,/Versione<\/dt><dd>2/);assert.match(html,/Nessuna data pianificata/);
});

test('pagina servizio: collaboratore senza metodo amministrativo, ritorno alla scheda assegnata e dati obsoleti esclusi',async()=>{
 const f=await fixture();f.S.module=serviceData();f.S.session.user.role='collaborator';f.run("setViewRoute('service:social/method')");let html=f.run('serviceWorkspaceView()');assert.match(html,/CONSEGNA_TEAM/);assert.doesNotMatch(html,/METODO_RISERVATO/);assert.match(html,/data-id="clients:services"/);
 for(const mutate of [()=>{f.S.module.clientId='other';},()=>{f.S.module.clientId='client-a';f.S.module.service.id='local';}]){mutate();html=f.run('serviceWorkspaceView()');assert.match(html,/attività è cambiato/);assert.doesNotMatch(html,/CONSEGNA_TEAM|METODO_RISERVATO/);}
});

test('pagina servizio: percorsi annidati, sconosciuti e precedenti non riaprono sezioni o menu rimossi',async()=>{
 const f=await fixture();f.S.module=serviceData();
 for(const route of ['service:social','service:social/contents/content-a']){f.run(`setViewRoute('${route}')`);assert.equal(f.S.serviceId,'social');assert.equal(f.S.section,route.slice('service:'.length));}
 for(const route of ['service:social/contents/missing','service:social/contents/content-a/extra','service:social/parts/99','service:social/../contents/content-a']){f.run(`setViewRoute('${route}')`);const html=f.run('serviceWorkspaceView()');assert.match(html,/Sezione non disponibile/);assert.doesNotMatch(html,/TESTO_CONTENUTO_|METODO_RISERVATO|DETTAGLIO_PARTE_/);}
 f.run("setViewRoute('work')");assert.equal(f.S.view,'home');assert.equal(f.S.serviceId,'');
 f.S.clientId='another-client';f.run("setViewRoute('service:social/contents/content-a?clientId=client-a')");assert.equal(f.S.clientId,'client-a');assert.equal(f.S.serviceId,'social');assert.equal(f.S.section,'social/contents/content-a');assert.match(f.run('serviceWorkspaceView()'),/TESTO_CONTENUTO_A/);
 f.run("setViewRoute('service:social/contents/content-a?clientId=another-client')");assert.doesNotMatch(f.run('serviceWorkspaceView()'),/TESTO_CONTENUTO_A/);
});

test('pagina servizio: cambiare attività dal selettore chiude il vecchio dettaglio e aggiorna il percorso',async()=>{
 const f=await fixture();f.S.module=serviceData();f.run("setViewRoute('service:social/contents/content-a?clientId=client-a');load=async()=>{};");
 for(const handler of f.handlers.change)await handler({target:{id:'client-picker',value:'client-b'}});
 assert.equal(f.S.clientId,'client-b');assert.equal(f.S.section,'social');assert.equal(f.routes.at(-1),'#service:social?clientId=client-b');
 assert.doesNotMatch(f.run('serviceWorkspaceView()'),/TESTO_CONTENUTO_A/);
 f.S.clientId='client-a';f.run(`setViewRoute('${f.routes.at(-1).slice(1)}')`);assert.equal(f.S.clientId,'client-b');
});

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
