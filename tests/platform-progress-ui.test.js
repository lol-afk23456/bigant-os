import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';

const response=value=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>value});
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
const item=(id,name,status='Prova')=>({id,name,status,summary:`Perimetro ${id}`,available:[`Disponibile ${id}`],missing:[`Manca ${id}`],source:`Registro ${id}`,evidenceAt:null,evidenceLabel:null,route:null});
function data(){return {environment:'Installazione di prova',readAt:'2026-10-10T12:00:00.000Z',notice:'La lettura non avvia operazioni.',items:[item('access','Accessi','Funziona'),item('backup','Copia di sicurezza','Da collegare'),item('agents','Agenti')],foundations:[item('vault','Custodia dei collegamenti'),item('team','Capacità del team')]};}
async function fixture(){
 const nodes=new Map(),calls=[];
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',open:false,addEventListener(){},close(){this.open=false;},focus(){}});return nodes.get(selector);};
 const context=vm.createContext({URL,Date,Intl,crypto:{randomUUID},setInterval:()=>0,setTimeout:()=>0,clearTimeout(){},window:{},history:{replaceState(){}},location:{origin:'http://127.0.0.1:4330',pathname:'/',hash:'',search:''},document:{querySelector:node,addEventListener(){},hidden:false},fetch:async()=>response({user:null,demo:true,profiles:[]})});
 for(const file of ['app.js','ufficio.js','workspace.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),context,{filename:file});
 await new Promise(setImmediate);
 const run=code=>vm.runInContext(code,context),S=run('S'),actions=run('ACTIONS');
 S.session={user:{id:'owner-fixture',role:'owner',name:'Socio'},demo:false,csrf:'csrf-fixture'};S.view='progress';S.section='';S.clientId='demo-bottega';
 S.overview={clients:[{id:'demo-bottega',name:'Bottega DEMO'}],currentClient:{id:'demo-bottega'},backup:{enabled:true,lastSuccess:'2026-10-10T12:00:00.000Z'},navigation:{landing:'home',items:[['home','Home'],['progress','Avanzamento'],['connections','Collegamenti'],['catalog','Servizi']]}};
 S.module=data();
 let serve=call=>{throw Error('Richiesta inattesa '+call.path);};
 context.fetch=async(url,options={})=>{const u=new URL(url),call={path:u.pathname,clientId:u.searchParams.get('clientId'),method:options.method||'GET'};calls.push(call);return response(await serve(call));};
 return {S,actions,calls,run,node,serve:fn=>{serve=fn;}};
}

test('Avanzamento: due ingressi, poi griglie compatte separate senza dettagli tutti insieme',async()=>{
 const f=await fixture(),root=f.run('workspaceProgressView()');
 assert.deepEqual([...root.matchAll(/data-view="([^"]+)"/g)].map(x=>x[1]),['progress:status','progress:foundations']);
 assert.doesNotMatch(root,/Perimetro|Disponibile vault|Manca access/);
 f.S.section='status';const status=f.run('workspaceProgressView()');
 assert.deepEqual([...status.matchAll(/data-view="([^"]+)"/g)].map(x=>x[1]),['progress:status/access','progress:status/backup','progress:status/agents']);
 assert.match(status,/Funziona/);assert.match(status,/Da collegare/);assert.match(status,/Prova/);
 assert.match(status,/data-action="goto" data-id="progress"/);assert.doesNotMatch(status,/Custodia dei collegamenti|Perimetro|Disponibile access/);
 f.S.section='foundations';const foundations=f.run('workspaceProgressView()');
 assert.deepEqual([...foundations.matchAll(/data-view="([^"]+)"/g)].map(x=>x[1]),['progress:foundations/vault','progress:foundations/team']);
 assert.doesNotMatch(foundations,/Copia di sicurezza|Perimetro|Disponibile vault/);assert.equal(f.calls.length,0);
});

test('Avanzamento: una scheda alla volta con Indietro, disponibilità, mancanze e fonte',async()=>{
 const f=await fixture();f.S.section='status/access';const detail=f.run('workspaceProgressView()');
 assert.match(detail,/data-action="goto" data-id="progress:status"/);assert.match(detail,/Cosa è disponibile/);assert.match(detail,/Disponibile access/);assert.match(detail,/Cosa manca/);assert.match(detail,/Manca access/);assert.match(detail,/Registro access/);
 assert.doesNotMatch(detail,/Copia di sicurezza|Capacità del team|Perimetro backup|data-view=/);
 f.S.section='foundations/vault';const foundation=f.run('workspaceProgressView()');
 assert.match(foundation,/data-action="goto" data-id="progress:foundations"/);assert.match(foundation,/Custodia dei collegamenti/);assert.match(foundation,/Disponibile vault/);assert.doesNotMatch(foundation,/Capacità del team|Perimetro access/);
});

test('Avanzamento: la data di lettura resta distinta dall’evidenza; testo e attributi sono protetti',async()=>{
 const f=await fixture(),row=f.S.module.items[0];f.S.section='status/access';
 Object.assign(row,{name:'Nome <script>',summary:'Testo <img src=x>',available:['Disponibile <b>'],missing:['Manca <svg>'],source:'Fonte <iframe>',evidenceAt:'2026-10-09T08:15:00.000Z',evidenceLabel:'Ultima copia <script>'});
 f.S.module.environment='Ambiente <script>';f.S.module.notice='Nota <img>';
 const html=f.run('workspaceProgressView()');assert.match(html,/Lettura dello stato: <time datetime="2026-10-10T12:00:00.000Z"/);
 assert.match(html,/Ultima copia &lt;script&gt;<\/dt><dd><time datetime="2026-10-09T08:15:00.000Z"/);assert.match(html,/2026/);assert.match(html,/Roma<\/time>/);
 for(const text of ['Nome &lt;script&gt;','Testo &lt;img src=x&gt;','Disponibile &lt;b&gt;','Manca &lt;svg&gt;','Fonte &lt;iframe&gt;','Ambiente &lt;script&gt;','Nota &lt;img&gt;'])assert.ok(html.includes(text));
 assert.doesNotMatch(html,/<script>|<img|<iframe|collaud/i);
});

test('Avanzamento: stati, date o schede mancanti non diventano Funziona e non riaprono altre voci',async()=>{
 const f=await fixture();f.S.section='status/access';
 Object.assign(f.S.module.items[0],{status:'Solo struttura',evidenceAt:'data inventata'});f.S.module.readAt='data inventata';
 const unknown=f.run('workspaceProgressView()');assert.match(unknown,/Stato non disponibile/);assert.match(unknown,/Data non disponibile/);assert.match(unknown,/Nessuna evidenza datata disponibile/);assert.doesNotMatch(unknown,/Funziona|Solo struttura|Flusso DEMO parziale/);
 for(const section of ['status/inesistente','foundations/inesistente','status/access/extra','status/']){f.S.section=section;const html=f.run('workspaceProgressView()');assert.match(html,/Scheda non disponibile/);assert.doesNotMatch(html,/Perimetro access|Disponibile vault/);}
 f.S.section='inesistente';assert.match(f.run('workspaceProgressView()'),/Sezione non disponibile/);
 f.S.module={};f.S.section='status';const absent=f.run('workspaceProgressView()');assert.match(absent,/Stato non disponibile/);assert.doesNotMatch(absent,/Funziona|data-view="progress:status\//);
});

test('Avanzamento: solo collegamenti noti e autorizzati, nessun avvio o attivazione',async()=>{
 const f=await fixture();f.S.section='foundations/vault';const row=f.S.module.foundations[0];
 for(const route of ['connections','catalog:prices']){row.route=route;assert.ok(f.run('workspaceProgressView()').includes(`data-action="goto" data-id="${route}"`));}
 for(const route of ['https://example.test','javascript:alert(1)','work','catalog:price-list','catalog:inesistente','users:people','connections" onclick="alert(1)']){row.route=route;assert.doesNotMatch(f.run('workspaceProgressView()'),/Apri la pagina/);}
 row.route='connections';const html=f.run('workspaceProgressView()');
 assert.deepEqual([...html.matchAll(/data-action="([^"]+)"/g)].map(x=>x[1]),['goto','goto']);assert.equal(f.calls.length,0);
});

test('Avanzamento: navigazione e aggiornamento rileggono l’API corrente senza ambito cliente',async()=>{
 const f=await fixture();let current=data();current.items[0].status='Prova';
 f.serve(call=>{if(call.path==='/api/overview')return f.S.overview;assert.equal(call.path,'/api/workspace/progress');assert.equal(call.clientId,null);return current;});
 await f.actions.goto('progress:status/access');let html=f.node('#app').innerHTML;
 assert.equal(f.S.section,'status/access');assert.match(html,/class="badge orange">Prova/);assert.doesNotMatch(html,/class="badge green">Funziona/);assert.equal(f.S.clientId,'demo-bottega');
 current=data();current.items[0].status='Da collegare';current.items[0].source='Autorizzazione revocata';
 await f.actions.refresh();html=f.node('#app').innerHTML;assert.match(html,/Da collegare/);assert.match(html,/Autorizzazione revocata/);assert.doesNotMatch(html,/class="badge orange">Prova/);
 await f.actions.goto('progress:foundations/vault');assert.match(f.node('#app').innerHTML,/Disponibile vault/);
 assert.equal(f.calls.filter(call=>call.path==='/api/workspace/progress').length,3);assert.ok(f.calls.every(call=>call.method==='GET'));
});

test('Avanzamento: una lettura precedente non ripristina lo stato dopo un aggiornamento più recente',async()=>{
 const f=await fixture(),pending=deferred();f.S.section='status/access';let reads=0;
 f.serve(call=>{if(call.path==='/api/overview')return f.S.overview;if(++reads===1)return pending.promise;const updated=data();updated.items[0].status='Da collegare';return updated;});
 const old=f.run('load()');await new Promise(setImmediate);await f.run('load()');pending.resolve(data());await old;
 assert.match(f.node('#app').innerHTML,/Da collegare/);assert.doesNotMatch(f.node('#app').innerHTML,/class="badge green">Funziona/);
});

test('Avanzamento: errore di lettura visibile e ritentabile, senza presentare lo stato vecchio',async()=>{
 const f=await fixture();f.S.section='status/access';f.serve(call=>{if(call.path==='/api/overview')return f.S.overview;throw Error('Stato non leggibile adesso');});
 await f.run('load()');const html=f.node('#app').innerHTML;assert.match(html,/Stato non leggibile adesso/);assert.match(html,/data-action="refresh"/);assert.doesNotMatch(html,/Perimetro access|class="badge green">Funziona/);
});
