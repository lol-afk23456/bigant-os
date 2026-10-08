import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {EventEmitter} from 'node:events';
import {createApp} from '../server.js';
import {createMotore,scegliMotore,istruzioniAgente} from '../src/motori/index.js';
import {cervelloDemo} from '../src/motori/demo.js';
import {schemi,valida} from '../src/sciame/schemi.js';
import {agentiSciame} from '../src/sciame/agenti.js';
import {controlliAutomatici} from '../src/sciame/qualita.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const RICHIESTA='Priorità dai KPI, piano marketing BigAnt della prossima settimana, analisi gratuita di un’azienda DEMO, social e GBP di Bottega, controllo prima nota';
function fixture(t,opzioni={}){
 const a=createApp({motore:'demo',...opzioni});t.after(()=>a.close());
 t.mock.method(globalThis,'fetch',()=>{throw Error('Rete vietata nel collaudo dello sciame');});
 const user=id=>a.store.one('SELECT * FROM os_users WHERE id=?',id);
 return {...a,s:a.store,owner:user('demo-owner'),client:user('demo-client'),team:user('demo-collaborator')};
}
// Motore di prova: delega al DEMO ma permette di alterare l'uscita di un agente.
function motoreFinto(altera={},{id='demo',costoUsdMicro=0}={}){
 const chiamate=[];
 return {id,etichetta:'Motore di prova',chiamate,stato:()=>({disponibile:true,statoCollegamento:'DEMO',motivo:'test'}),
  async esegui({agente,compito,pacchetto}){chiamate.push({agente,compito});const base=cervelloDemo(agente,pacchetto);return {output:altera[agente]?altera[agente](base,chiamate.filter(c=>c.agente===agente).length):base,meta:{motore:id,durataMs:1,costoUsdMicro}};}};
}

test('ogni agente dello sciame ha istruzioni proprie in .claude/agents con frontmatter e contratto di uscita',()=>{
 for(const id of Object.keys(agentiSciame)){
  const file=resolve(root,'.claude/agents',`bigant-${id}.md`);assert.ok(existsSync(file),'manca '+file);
  const testo=readFileSync(file,'utf8');assert.match(testo,new RegExp(`^---\\nname: bigant-${id}\\n`));assert.match(testo,/\ntools: Read\n---\n/);
  assert.ok(istruzioniAgente(root,id).length>800,'istruzioni troppo brevi per '+id);
  for(const campo of Object.keys(schemi[id].properties))assert.ok(testo.includes(campo),`${id}: il campo ${campo} non è descritto nelle istruzioni`);
  assert.ok(schemi[id],'schema mancante per '+id);
 }
});

test('giro completo con motore DEMO: sette reparti, Qualità su ogni output, auto-approvazioni DEMO e azioni esterne bloccate',async t=>{
 const a=fixture(t),giro=a.sciame.creaGiro(a.owner,{richiesta:RICHIESTA});
 const r=await a.sciame.eseguiGiro(giro.id);
 assert.equal(r.stato,'completato',JSON.stringify(r.passi.filter(p=>p.errore)));
 assert.deepEqual(r.piano.eseguiti.sort(),['amministrazione','commerciale','crescita','local','marketing','social']);
 const produttori=r.passi.filter(p=>!['qualita','orchestratore'].includes(p.agente));
 assert.deepEqual([...new Set(produttori.map(p=>p.agente))].sort(),['amministrazione','analisi-gratuita','direttore-crescita','local-gbp','marketing','proposta-commerciale','reputazione','ricerca-clienti','social']);
 for(const p of produttori){
  const controlli=r.passi.filter(q=>q.agente==='qualita'&&q.controlla_passo===p.id);
  assert.ok(controlli.length>=1,'Qualità non ha controllato '+p.agente);
  assert.ok(new Date(controlli[0].created_at)<=new Date(a.s.one('SELECT created_at FROM os_approvals WHERE id=?',p.approvazione_id).created_at),'approvazione prima della Qualità');
  const ap=a.s.one('SELECT * FROM os_approvals WHERE id=?',p.approvazione_id);assert.equal(ap.status,'approved');assert.equal(ap.reason,'auto-approvato (DEMO)');assert.equal(ap.kind,'sciame_output');
  assert.equal(p.motore,'demo');assert.ok(['completato','in_attesa_approvazione'].includes(p.stato));
 }
 assert.equal(r.passi.find(p=>p.agente==='amministrazione').visibilita,'admin');
 // Contenuti nella produzione comune fino a PROGRAMMATO, con pubblicazione bloccata.
 const contenuti=a.s.query("SELECT * FROM os_contents WHERE source LIKE 'Sciame %'");
 assert.equal(contenuti.length,4+8);assert.ok(contenuti.every(c=>c.state==='PROGRAMMATO'&&c.scheduled_at));
 for(const c of contenuti)assert.equal(a.s.one("SELECT reason FROM os_approvals WHERE kind='content' AND entity_id=?",c.id).reason.startsWith('auto-approvato (DEMO)'),true);
 const azioni=a.s.query('SELECT * FROM os_azioni_esterne WHERE giro_id=?',giro.id);
 assert.ok(azioni.length>=12&&azioni.every(x=>x.stato==='bloccata'));
 for(const tipo of ['pubblicazione','pubblicazione_gbp','modifica_scheda','risposta_recensioni','invio_email'])assert.ok(azioni.some(x=>x.tipo===tipo),'manca azione '+tipo);
 assert.throws(()=>a.sciame.eseguiAzioneEsterna(a.owner,azioni[0].id),/bloccato.*COLLEGAMENTO MANCANTE/);
 // Commerciale: lead nel CRM Growth con punteggio e analisi salvati; nessuna email simulata inviata.
 const leads=a.growth.store.query("SELECT * FROM leads WHERE workspace='demo-bigant' AND domain LIKE '%.example' AND source LIKE 'Ricerca clienti DEMO dello sciame%'");
 assert.equal(leads.length,5);assert.ok(leads.some(l=>l.analysis.length>0));
 assert.equal(a.s.one("SELECT COUNT(*) n FROM gr_demo_mail").n,0);
 // Amministrazione: prima nota DEMO importata e movimenti mai modificati dall'agente.
 assert.equal(a.s.one("SELECT COUNT(*) n FROM os_fin_movements WHERE source_ref LIKE 'sciame-pn-%'").n,5);
 const anomalie=r.passi.find(p=>p.agente==='amministrazione').input.anomalie_rilevate;for(const regola of ['missing_document','subscription_increase','possible_duplicate','invoice_overdue'])assert.ok(anomalie.some(x=>x.regola===regola),'manca '+regola);
 // Registro attività: ogni passo lascia righe con agente, motore e costo; il Direttore salva le priorità.
 assert.ok(a.s.query("SELECT * FROM os_audit WHERE action LIKE 'Sciame · %'").length>=r.passi.length);
 assert.equal(a.s.query("SELECT * FROM os_audit WHERE action='Approvazione: auto-approvato (DEMO)'").length,9+12);
 assert.match(a.s.one("SELECT content FROM os_memory WHERE client_id='demo-bigant' AND kind='priorita-settimana'").content,/^1\. /);
 assert.equal(r.costo_usd_micro,0);
});

test('Qualità ferma un output con promessa garantita dopo una correzione fallita: nessuna approvazione, nessun contenuto',async t=>{
 const motore=motoreFinto({social:o=>({...o,post:o.post.map(p=>({...p,testo:'Risultati garantiti al 100% per il tuo negozio.'}))})});
 const a=fixture(t,{motore}),giro=a.sciame.creaGiro(a.owner,{richiesta:'Social Bottega',flussi:['social']});
 const r=await a.sciame.eseguiGiro(giro.id),p=r.passi.find(x=>x.agente==='social');
 assert.equal(p.stato,'bloccato_qualita');assert.equal(p.approvazione_id,null);
 assert.equal(motore.chiamate.filter(c=>c.agente==='social').length,2,'una sola correzione');
 assert.match(motore.chiamate.filter(c=>c.agente==='social')[1].compito,/CORREZIONE RICHIESTA DA QUALITÀ/);
 assert.equal(r.passi.filter(x=>x.agente==='qualita'&&x.controlla_passo===p.id).length,2);
 assert.equal(a.s.one("SELECT COUNT(*) n FROM os_contents WHERE source LIKE 'Sciame %'").n,0);
 assert.equal(a.s.one('SELECT COUNT(*) n FROM os_azioni_esterne').n,0);
});

test('una correzione richiesta da Qualità che va a buon fine entra nella coda approvazioni',async t=>{
 const motore=motoreFinto({'direttore-crescita':(o,n)=>n===1?{...o,priorita:o.priorita.slice(0,2)}:o});
 const a=fixture(t,{motore}),giro=a.sciame.creaGiro(a.owner,{richiesta:'Priorità',flussi:['crescita']});
 const r=await a.sciame.eseguiGiro(giro.id),p=r.passi.find(x=>x.agente==='direttore-crescita');
 assert.equal(p.stato,'completato');assert.equal(p.output.priorita.length,3);
 assert.ok(a.s.one("SELECT * FROM os_audit WHERE action LIKE '%correzione richiesta da Qualità' AND entity_id=?",p.id));
});

test('uscita fuori contratto: errore visibile, costo rilasciato, nessuna approvazione',async t=>{
 const motore=motoreFinto({marketing:o=>({...o,bozze:'non un elenco'})},{id:'claude-code',costoUsdMicro:120000});
 const a=fixture(t,{motore}),giro=a.sciame.creaGiro(a.owner,{richiesta:'Marketing',flussi:['marketing']});
 const r=await a.sciame.eseguiGiro(giro.id),p=r.passi.find(x=>x.agente==='marketing');
 assert.equal(r.stato,'completato_con_errori');assert.equal(p.stato,'errore');assert.match(p.errore,/contratto/);
 assert.equal(a.s.one("SELECT COUNT(*) n FROM os_approvals WHERE kind='sciame_output'").n,0);
 assert.ok(a.s.one("SELECT * FROM os_audit WHERE action LIKE '%errore' AND entity_id=?",p.id));
});

test('tetto di spesa: con budget esaurito lo sciame si ferma e lo dichiara; i costi reali vengono addebitati',async t=>{
 const motore=motoreFinto({},{id:'claude-code',costoUsdMicro:43210}),a=fixture(t,{motore});
 let giro=a.sciame.creaGiro(a.owner,{richiesta:'Priorità',flussi:['crescita']});await a.sciame.eseguiGiro(giro.id);
 const addebiti=a.s.query("SELECT * FROM os_costs WHERE agent LIKE 'sciame:%'");
 assert.equal(addebiti.length,3);assert.ok(addebiti.every(c=>c.status==='charged'&&c.cents===5),JSON.stringify(addebiti));
 assert.equal(a.sciame.riepilogoGiro(giro.id).costo_usd_micro,3*43210);
 await a.orchestrator.handle({method:'POST',path:'/budget',body:{capCents:3550,fixedCents:3500},user:a.owner,clientId:'demo-bigant'});
 const prima=motore.chiamate.length;giro=a.sciame.creaGiro(a.owner,{richiesta:'Priorità',flussi:['crescita']});const r=await a.sciame.eseguiGiro(giro.id);
 assert.equal(r.stato,'errore');assert.match(r.errore,/Tetto di spesa/);assert.equal(motore.chiamate.length,prima,'nessuna chiamata al motore oltre il tetto');
});

test('pausa, motore assente e permessi: il giro non parte e solo i soci vedono l’ufficio',async t=>{
 const a=fixture(t);
 await a.orchestrator.handle({method:'POST',path:'/pause',body:{paused:true},user:a.owner,clientId:'demo-bigant'});
 assert.throws(()=>a.sciame.creaGiro(a.owner,{richiesta:'Prova'}),/pausa/);
 await a.orchestrator.handle({method:'POST',path:'/pause',body:{paused:false},user:a.owner,clientId:'demo-bigant'});
 for(const u of [a.client,a.team]){assert.throws(()=>a.sciame.ufficio(u),/riservata/);assert.throws(()=>a.sciame.creaGiro(u,{richiesta:'x'}),/riservata/);}
 assert.throws(()=>a.sciame.creaGiro(a.owner,{richiesta:'x',flussi:['pubblica-tutto']}),/Flussi non validi/);
 const b=createApp({motore:'nessuno'});t.after(()=>b.close());
 assert.throws(()=>b.sciame.creaGiro(b.store.one("SELECT * FROM os_users WHERE id='demo-owner'"),{richiesta:'x'}),/Motore non disponibile/);
 assert.equal(b.sciame.ufficio(b.store.one("SELECT * FROM os_users WHERE id='demo-owner'")).motore.statoCollegamento,'COLLEGAMENTO MANCANTE');
});

test('ufficio virtuale: stanze dell’organigramma, 33 postazioni e stati letti dal registro reale',async t=>{
 const a=fixture(t);let u=a.sciame.ufficio(a.owner);
 assert.deepEqual(u.stanze.map(s=>s.id),['regia','direction','marketing','sales','account','production','local','quality','administration']);
 assert.equal(u.stanze.flatMap(s=>s.agenti).length,33);assert.ok(u.stanze.flatMap(s=>s.agenti).every(x=>x.stato==='libero'));
 const giro=a.sciame.creaGiro(a.owner,{richiesta:'Social e GBP Bottega',flussi:['social','local']});await a.sciame.eseguiGiro(giro.id);
 u=a.sciame.ufficio(a.owner);const desk=id=>u.stanze.flatMap(s=>s.agenti).find(x=>x.id===id);
 assert.equal(desk('social').stato,'in_attesa_approvazione');assert.equal(desk('social').ultimoOutput.motore,'demo');assert.ok(desk('social').ultimoOutput.sintesi);
 assert.equal(desk('quality').ultimoOutput.motore,'demo');assert.equal(desk('director').stato,'libero');
 assert.ok(u.feed.some(f=>f.action==='Approvazione: auto-approvato (DEMO)'));assert.ok(u.azioniBloccate.length>0);
 // Un passo interrotto da un riavvio diventa errore visibile, non resta "al lavoro".
 a.s.run("UPDATE os_sciame_passi SET stato='al_lavoro' WHERE agente='social'");
 assert.equal(a.sciame.ufficio(a.owner).stanze.flatMap(s=>s.agenti).find(x=>x.id==='social').stato,'al_lavoro');
});

test('approvazione manuale: il rifiuto torna all’agente come regola nel giro successivo',async t=>{
 const a=fixture(t,{env:{...process.env,BIGANT_APPROVAZIONE_AUTOMATICA_DEMO:'false'}});
 let giro=a.sciame.creaGiro(a.owner,{richiesta:'Priorità',flussi:['crescita']});let r=await a.sciame.eseguiGiro(giro.id);
 const p=r.passi.find(x=>x.agente==='direttore-crescita');assert.equal(p.stato,'in_attesa_approvazione');
 const ap=a.s.one('SELECT * FROM os_approvals WHERE id=?',p.approvazione_id);assert.equal(ap.status,'pending');
 assert.throws(()=>a.sciame.decide(a.owner,ap,{decision:'rejected'}),/motivo/);
 a.sciame.decide(a.owner,ap,{decision:'rejected',reason:'Indicare sempre il costo in ore dei soci'});
 assert.match(a.s.one("SELECT content FROM os_memory WHERE client_id='demo-bigant' AND kind='agent-feedback:director'").content,/costo in ore/);
 giro=a.sciame.creaGiro(a.owner,{richiesta:'Priorità',flussi:['crescita']});r=await a.sciame.eseguiGiro(giro.id);
 assert.ok(r.passi.find(x=>x.agente==='direttore-crescita').input.feedback_soci.some(f=>/costo in ore/.test(f)));
});

test('prove salvate: esportazione e importazione idempotente del registro in un archivio nuovo',async t=>{
 const a=fixture(t),dir=mkdtempSync(join(tmpdir(),'sciame-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const giro=a.sciame.creaGiro(a.owner,{richiesta:'Prima nota',flussi:['amministrazione']});await a.sciame.eseguiGiro(giro.id);
 const cartella=a.sciame.esportaProve(giro.id,dir);assert.ok(existsSync(join(cartella,'giro.json'))&&existsSync(join(cartella,'README.md')));
 assert.match(readFileSync(join(cartella,'README.md'),'utf8'),/Motore: \*\*Motore DEMO deterministico/);
 const b=createApp({motore:'demo'});t.after(()=>b.close());
 assert.equal(b.sciame.importaProve(dir),1);assert.equal(b.sciame.importaProve(dir),0);
 const g=b.sciame.riepilogoGiro(giro.id);assert.equal(g.origine,'registro salvato in docs/demo-sciame');assert.equal(g.passi.length,3);
});

test('motore Claude Code: sottoagente, nessuno strumento, schema imposto, costo dichiarato ed errori leggibili',async()=>{
 const viste=[];
 const spawnImpl=(bin,args,opts)=>{viste.push({bin,args,opts});const c=new EventEmitter();c.stdout=new EventEmitter();c.stderr=new EventEmitter();let input='';c.stdin={end:x=>{input=x;setImmediate(()=>{c.stdout.emit('data',JSON.stringify([{type:'result',subtype:'success',is_error:false,total_cost_usd:0.0421,num_turns:2,structured_output:{esito:'approvabile',sintesi:'ok '+input.length,rilievi:[]}},{type:'result',subtype:'error_max_turns',is_error:true,result:'limite'},{type:'result',subtype:'success',is_error:false,total_cost_usd:0.01,result:'```json\n{"esito":"da_correggere","sintesi":"dal testo","rilievi":[]}\n```'},{type:'result',subtype:'success',is_error:false,result:'nessun JSON qui'}][viste.length-1]));c.emit('close',0);});}};c.kill=()=>{};return c;};
 const m=createMotore({nome:'claude-code',root,env:{BIGANT_CLAUDE_BIN:'claude-finto'},spawnImpl});
 const r=await m.esegui({agente:'qualita',compito:'Controlla',pacchetto:{oggi:'2026-10-08'},schema:schemi.qualita});
 assert.equal(r.output.esito,'approvabile');assert.equal(r.meta.motore,'claude-code');assert.equal(r.meta.costoUsdMicro,42100);
 const {bin,args,opts}=viste[0];assert.equal(bin,'claude-finto');assert.equal(opts.cwd,root);
 assert.deepEqual(args.slice(0,5),['-p','--agent','bigant-qualita','--tools','']);
 assert.equal(JSON.parse(args[args.indexOf('--json-schema')+1]).required.includes('esito'),true);
 await assert.rejects(m.esegui({agente:'qualita',compito:'x',pacchetto:{},schema:schemi.qualita}),/non riuscita/);
 assert.equal((await m.esegui({agente:'qualita',compito:'x',pacchetto:{},schema:schemi.qualita})).output.esito,'da_correggere','JSON letto dal testo quando manca l’output strutturato');
 await assert.rejects(m.esegui({agente:'qualita',compito:'x',pacchetto:{},schema:schemi.qualita}),/senza JSON/);
});

test('diretta: lo stream di Claude Code arriva a pezzi, si salva sul passo e compare nell’ufficio e al cliente senza costi',async t=>{
 // 1. Motore: righe stream-json spezzate a metà tra due blocchi di dati.
 const righe=[{type:'system',subtype:'init'},{type:'stream_event',event:{type:'content_block_delta',delta:{type:'thinking_delta',thinking:'...'}}},{type:'stream_event',event:{type:'content_block_delta',delta:{type:'text_delta',text:'{"esito":"appro'}}},{type:'stream_event',event:{type:'content_block_delta',delta:{type:'text_delta',text:'vabile","sintesi":"ok","rilievi":[]}'}}},{type:'result',subtype:'success',is_error:false,total_cost_usd:0.002,result:'{"esito":"approvabile","sintesi":"ok","rilievi":[]}'}].map(x=>JSON.stringify(x)).join('\n')+'\n';
 const spawnImpl=()=>{const c=new EventEmitter();c.stdout=new EventEmitter();c.stderr=new EventEmitter();c.stdin={end:()=>setImmediate(()=>{c.stdout.emit('data',righe.slice(0,200));c.stdout.emit('data',righe.slice(200));c.emit('close',0);})};c.kill=()=>{};return c;};
 const visti=[],m=createMotore({nome:'claude-code',root,env:{BIGANT_CLAUDE_BIN:'claude-finto'},spawnImpl});
 const r=await m.esegui({agente:'qualita',compito:'x',pacchetto:{},schema:schemi.qualita,onProgresso:x=>visti.push(x)});
 assert.equal(r.output.esito,'approvabile');assert.equal(r.meta.costoUsdMicro,2000);
 assert.deepEqual(visti.map(x=>x.fase),['ragionamento','scrittura','scrittura']);assert.match(visti.at(-1).testo,/approvabile.*rilievi/);
 // 2. Sciame: mentre l'agente scrive, l'ufficio mostra il testo; il cliente vede chi lavora, mai i costi.
 const a=fixture(t);let sblocca,scritto;const pronto=new Promise(r=>{scritto=r;});
 const finto=motoreFinto();const base=finto.esegui;
 finto.esegui=async x=>{if(x.agente==='local-gbp'&&!sblocca){x.onProgresso({fase:'scrittura',testo:'{"controlli":[{"voce":"Orari di apertura'});scritto();await new Promise(r=>{sblocca=r;});}return base(x);};
 a.sciame.usaMotore(finto);
 const giro=a.sciame.creaGiro(a.owner,{richiesta:'Scheda Google di Bottega',flussi:['local']}),fine=a.sciame.eseguiGiro(giro.id);
 await pronto;
 const desk=a.sciame.ufficio(a.owner).stanze.flatMap(s=>s.agenti).find(x=>x.id==='local');
 assert.equal(desk.stato,'al_lavoro');assert.equal(desk.diretta.fase,'scrittura');assert.match(desk.diretta.testo,/Orari di apertura/);
 assert.match(a.sciame.dettaglioPasso(a.owner,desk.diretta.passoId).diretta,/Orari di apertura/);
 const clienteId=desk.diretta.cliente,home=a.cliente.dashboard(a.s.one("SELECT * FROM os_users WHERE role='client' AND tenant_id=?",clienteId),clienteId).sezioni.find(x=>x.id==='home');
 const voce=home.squadra.find(q=>q.attivo);assert.equal(voce.agente,agentiSciame['local-gbp'].nome);assert.equal(voce.stato,'Al lavoro');
 assert.equal(JSON.stringify(home.squadra).includes('costo'),false,'nessun costo nella vista cliente');
 sblocca();const fatto=await fine;assert.ok(fatto.passi.every(p=>p.diretta===undefined),'il riepilogo del giro non porta la trascrizione completa');
});

test('motore API: spento senza chiave e modello dedicati; acceso usa istruzioni e schema dei sottoagenti',async()=>{
 const spento=createMotore({nome:'api',root,env:{}});assert.equal(spento.stato().statoCollegamento,'COLLEGAMENTO MANCANTE');
 await assert.rejects(spento.esegui({agente:'qualita',compito:'x',pacchetto:{},schema:schemi.qualita}),/non configurato/);
 let richiesta=null;
 class Finto{constructor(o){this.o=o;this.messages={create:async b=>{richiesta={...b,client:this.o};return {stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify({esito:'approvabile',sintesi:'ok',rilievi:[]})}],usage:{input_tokens:10,output_tokens:5}};}};}}
 const m=createMotore({nome:'api',root,env:{BIGANT_ANTHROPIC_API_KEY:'chiave-di-prova',BIGANT_API_MODELLO:'modello-di-prova'},importSdk:async()=>({default:Finto})});
 assert.equal(m.stato().statoCollegamento,'OPERATIVO');
 const r=await m.esegui({agente:'qualita',compito:'Controlla',pacchetto:{a:1},schema:schemi.qualita});
 assert.equal(r.output.esito,'approvabile');assert.equal(richiesta.model,'modello-di-prova');assert.equal(richiesta.client.apiKey,'chiave-di-prova');
 assert.equal(richiesta.output_config.format.type,'json_schema');assert.match(richiesta.system,/Qualità/i);
 assert.equal(scegliMotore({BIGANT_MOTORE:'demo'}),'demo');assert.throws(()=>scegliMotore({BIGANT_MOTORE:'gpt'}),/non valido/);
});

test('contratti: il motore DEMO rispetta gli schemi e i controlli automatici riconoscono le violazioni',()=>{
 const pk={oggi:'2026-10-08',settimana:{dal:'2026-10-12',al:'2026-10-18'},kpi:{clienti_attivi:{valore:'3',fonte:'x'}},candidati:[{lead_id:'l1',azienda:'A',segnali:{}}],recensioni:[{id:'r1',voto:1}],anomalie_rilevate:[{anomalia_id:'a1',titolo:'t',importo:'10,00 €',priorita:'high'}],pacchetto:{composizione:['S06'],setup_proposto:'[DA VALIDARE]',canone_proposto:'[DA VALIDARE]',contenuti_mese:8,canali:['Instagram'],reel:2},flussi_disponibili:[{id:'crescita'}],richiesta:'kpi'};
 for(const id of Object.keys(agentiSciame))assert.deepEqual(valida(schemi[id],cervelloDemo(id,pk)),[],id);
 const blocchi=(agente,o)=>controlliAutomatici(agente,o,pk).filter(c=>c.esito==='bloccante').map(c=>c.regola);
 assert.ok(blocchi('marketing',{bozze:[{testo:'Abbiamo pubblicato il post'}]}).includes('Azioni esterne dichiarate come fatte'));
 assert.ok(blocchi('marketing',{bozze:[{testo:'BigAnt S.r.l. è la migliore'}]}).includes('BigAnt presentata come società'));
 assert.ok(blocchi('amministrazione',{anomalie:[{anomalia_id:'a1',importo:'11,00 €'}]}).includes('Importi identici al centesimo'));
 assert.ok(blocchi('amministrazione',{anomalie:[{anomalia_id:'inventata',importo:'10,00 €'}]}).includes('Tutte le anomalie, nessuna inventata'));
 assert.ok(blocchi('reputazione',{risposte:[{recensione_id:'r1',serve_ok_cliente:false}]}).includes('Negative con ok del cliente'));
 assert.ok(blocchi('direttore-crescita',{priorita:[1,2,3],kpi_letti:[{nome:'clienti_attivi',valore:'30'}]}).includes('KPI identici al pacchetto'));
 assert.ok(blocchi('proposta-commerciale',{prezzo:{setup:'200 €'}}).includes('Prezzi marcati da validare'));
 assert.deepEqual(valida(schemi.qualita,{esito:'forse',sintesi:1,rilievi:[],extra:true}),['uscita.extra: campo non previsto','uscita.esito: valore non ammesso (forse)','uscita.sintesi: atteso testo']);
});

test('router HTTP dello sciame: solo soci, decisione dalla coda comune e azioni esterne rifiutate',async t=>{
 const a=createApp({motore:'demo'});await new Promise(r=>a.server.listen(0,'127.0.0.1',r));t.after(()=>a.close());const origin='http://127.0.0.1:'+a.server.address().port;
 const login=async profile=>{const r=await fetch(origin+'/api/demo/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({profile})});return {cookie:r.headers.get('set-cookie').split(';')[0],csrf:(await r.json()).csrf};};
 const client=await login('demo-client');assert.equal((await fetch(origin+'/api/sciame/ufficio',{headers:{Cookie:client.cookie}})).status,403);
 const owner=await login('demo-owner'),headers={Cookie:owner.cookie,'X-CSRF-Token':owner.csrf,Origin:origin,'Content-Type':'application/json'};
 const avvio=await fetch(origin+'/api/sciame/giri',{method:'POST',headers,body:JSON.stringify({richiesta:'Controllo prima nota',flussi:['amministrazione']})});assert.equal(avvio.status,202);
 const giro=await avvio.json();await a.sciame.attesa();
 const dettaglio=await (await fetch(origin+'/api/sciame/giri/'+giro.id,{headers})).json();assert.equal(dettaglio.stato,'completato');
 const ufficio=await (await fetch(origin+'/api/sciame/ufficio',{headers})).json();assert.equal(ufficio.motore.id,'demo');assert.equal(ufficio.stanze.length,9);
 const passo=dettaglio.passi.find(p=>p.agente==='amministrazione');assert.equal((await (await fetch(origin+'/api/sciame/passi/'+passo.id,{headers})).json()).motoreEtichetta,'Motore DEMO deterministico (solo test, nessuna AI)');
});
