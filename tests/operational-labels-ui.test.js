import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createApp} from '../server.js';
import {serviceBlueprints} from '../src/agency/services.js';

const technical=/Solo struttura|Flusso DEMO parziale/i;
async function fixture(){
 const node={innerHTML:'',addEventListener(){},close(){}};
 const context=vm.createContext({URL,Date,Intl,crypto:{randomUUID},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},window:{},history:{replaceState(){}},location:{origin:'http://127.0.0.1:4330',pathname:'/',hash:'',search:''},document:{querySelector:()=>node,addEventListener(){}},fetch:async()=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>({user:null,demo:true,profiles:[]})})});
 for(const file of ['app.js','cliente.js','workspace.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),context,{filename:file});
 await new Promise(setImmediate);
 let requests=0;context.fetch=async()=>{requests++;throw Error('Il rendering non deve avviare richieste.');};
 const run=code=>vm.runInContext(code,context),S=run('S');
 S.session={user:{id:'client-fixture',name:'Cliente DEMO',role:'client'},demo:true};S.view='catalog';S.section='';S.clientId='demo-bottega';
 S.overview={clients:[{id:'demo-bottega',name:'Bottega DEMO'}],currentClient:{id:'demo-bottega',name:'Bottega DEMO'},registry:{services:[],agents:[]}};
 return {S,run,context,get requests(){return requests;}};
}

test('Servizi cliente: il catalogo delle API conserva limiti e DEMO senza etichette di costruzione',async t=>{
 const app=createApp({env:{},worker:false});t.after(()=>app.close());const f=await fixture();
 const user=app.store.one("SELECT * FROM os_users WHERE role='client' AND active=1 LIMIT 1");
 f.S.module=app.agency.dashboard(user,user.tenant_id);const html=f.run('catalogView()');
 assert.ok(f.S.module.services.length>0);assert.doesNotMatch(html,technical);assert.match(html,/Aprirla non attiva il servizio/);
 for(const row of f.S.module.services){assert.ok(html.includes(row.name));assert.ok(html.includes(`data-action="service" data-id="${row.id}"`));}
 assert.match(html,/resta da attivare/);assert.equal(f.requests,0);
});

test('Schede servizio: tutti i contratti attuali espongono mancanze senza promuovere il servizio',async t=>{
 const app=createApp({env:{},worker:false});t.after(()=>app.close());const f=await fixture();
 const owner=app.store.one("SELECT * FROM os_users WHERE role='owner' AND active=1 LIMIT 1");f.S.session.user=owner;f.S.view='service';
 for(const service of serviceBlueprints){
  f.S.module=app.agency.workspace(owner,'demo-bottega',service.id);const html=f.run('serviceWorkspaceView()');
  assert.doesNotMatch(html,technical,service.id);assert.match(html,/Da completare/,service.id);assert.match(html,/data-id="catalog"/,service.id);
  if(service.status==='Flusso DEMO parziale')assert.match(html,/Alcune funzioni DEMO sono disponibili; il servizio completo resta da attivare/,service.id);
  else if(service.excluded)assert.match(html,/Questo servizio non è previsto nell’offerta/,service.id);
  else assert.match(html,/Il metodo è descritto; il lavoro specialistico resta da attivare/,service.id);
  assert.doesNotMatch(html,/data-action="(?:run-agent|agent-config|service-plan-edit|google-oauth-start)"/);
  assert.doesNotMatch(html,/data-action="goto" data-id="work"|Apri i lavori dell’attività/);
 }
 assert.equal(f.requests,0);
});

test('Scheda cliente: il testo del lavoro disponibile e delle parti mancanti resta visibile',async t=>{
 const app=createApp({env:{},worker:false});t.after(()=>app.close());const f=await fixture(),user=app.store.one("SELECT * FROM os_users WHERE role='client' AND active=1 LIMIT 1");
 const service=app.agency.dashboard(user,user.tenant_id).services[0];f.S.module=app.agency.workspace(user,user.tenant_id,service.id);f.S.view='service';
 const html=f.run('serviceWorkspaceView()');assert.doesNotMatch(html,technical);assert.ok(html.includes(f.S.module.service.available));assert.ok(html.includes(f.S.module.service.missing));assert.match(html,/Le sezioni ancora vuote non eseguono automaticamente il servizio/);
});

test('Cliente: KPI assente, zero registrato e dati DEMO mantengono significati e fonti distinti',async()=>{
 const f=await fixture();f.context.rows=[{kpi:'Tempi di consegna',valore:null,fonte:'Misura interna non ancora registrata',stato:'SOLO STRUTTURA'},{kpi:'Contatti registrati',valore:0,fonte:'Archivio DEMO',stato:'DEMO'},{kpi:'Visite sito',valore:null,fonte:'Fonte esterna non collegata',stato:'COLLEGAMENTO MANCANTE'}];
 const html=f.run('kpiTabella(rows)');assert.doesNotMatch(html,technical);assert.match(html,/Dato non disponibile/);assert.equal((html.match(/class="muted">—/g)||[]).length,2);assert.match(html,/class="kpi-val">0<span class="badge orange">DEMO/);assert.match(html,/Misura interna non ancora registrata/);assert.match(html,/Fonte esterna non collegata/);assert.doesNotMatch(html,/OPERATIVO|Funziona/);
});

test('Dashboard effettiva cliente: KPI e Report escludono gergo tecnico, invio e PDF restano assenti',async t=>{
 const app=createApp({env:{},worker:false});t.after(()=>app.close());const f=await fixture(),user=app.store.one("SELECT * FROM os_users WHERE role='client' AND active=1 LIMIT 1");
 const payload=await app.cliente.handle({method:'GET',path:'/dashboard',user,clientId:user.tenant_id});f.S.module=payload.data;f.S.view='client';
 const html=f.run('clienteDashboardView()');assert.doesNotMatch(html,technical);assert.match(html,/Dati DEMO di prova/);assert.match(html,/Invio email programmato non collegato: nessun messaggio parte dal sistema/);assert.match(html,/Esportazione PDF da costruire/);assert.equal(f.requests,0);
});

test('Testi operativi: nomi, note e fonti restano escaped; stato sconosciuto non diventa operativo',async()=>{
 const f=await fixture();f.context.service={id:'video',name:'Nome <script>',status:'sconosciuto',deliverables:'Consegna <img>'};
 let html=f.run('serviceCard(service)');assert.match(html,/Nome &lt;script&gt;/);assert.match(html,/Consegna &lt;img&gt;/);assert.match(html,/Verifica con l’agenzia/);assert.doesNotMatch(html,/<script>|<img|Funziona|OPERATIVO/);
 f.context.report={id:'report',report:[],invioAutomatico:{stato:'COLLEGAMENTO MANCANTE',nota:'Nessun invio <script>'},pdf:{stato:'SOLO STRUTTURA',nota:'PDF assente <img>'}};
 html=f.run('sezioneCliente(report)');assert.match(html,/Nessun invio &lt;script&gt;/);assert.match(html,/PDF assente &lt;img&gt;/);assert.doesNotMatch(html,/<script>|<img|Solo struttura/i);
});

test('Navigazione storica: Mappa e Marketing restano nascosti, senza introdurre nuove voci cliente',async()=>{
 const f=await fixture();f.run("setViewRoute('agency')");assert.equal(f.S.view,'progress');f.run("setViewRoute('marketing')");assert.equal(f.S.view,'profiles');
 f.context.sections=[{name:'Sezione storica',status:'Solo struttura'}];assert.match(f.run('sectionPanels(sections)'),technical);assert.doesNotMatch(f.run('sectionPanels(sections,false)'),technical);
});
