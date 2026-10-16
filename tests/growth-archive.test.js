import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore,seedCore} from '../src/store.js';
import {growthStore} from '../src/growth-store.js';
import {createLead} from '../src/growth-domain.js';
import {demoProviders} from '../src/growth-providers.js';
import {createGrowthRuntime} from '../src/growth-runtime.js';
import {createGrowthMail} from '../src/growth-mail.js';
import {createGrowthCalendar} from '../src/growth-calendar.js';
import {createGrowthArchive} from '../src/growth-archive.js';

const w='demo-bigant',at='2026-10-10T12:00:00.000Z';
function fixture(t){
 const store=openStore();seedCore(store);t.after(()=>store.close());
 const owner=store.one("SELECT * FROM os_users WHERE id='demo-owner'"),s=growthStore(store,()=>owner);s.workspace(w);s.workspace('demo-studio');demoProviders(s);
 const runtime=createGrowthRuntime({store,growthStore:s,getActor:()=>owner}),mail=createGrowthMail({store,growthStore:s,runtime});createGrowthCalendar({store,growthStore:s,runtime,mail});
 const put=(table,row)=>{const columns=Object.keys(row);store.run(`INSERT INTO ${table}(${columns.join(',')}) VALUES(${columns.map(()=>'?').join(',')})`,...columns.map(key=>row[key]));};
 const lead=createLead(s,w,{company:'Archivio riservato DEMO',email:'inventato@fixture.example',source:'Fonte inventata'}),other=createLead(s,'demo-studio',{company:'Altra attività DEMO',source:'Fixture'});
 put('gr_messages',{id:'message-demo',workspace:w,lead_id:lead.id,direction:'out',subject:'Proposta DEMO',body:'Contenuto privato da conservare',status:'sending',created:at});
 put('gr_meetings',{id:'meeting-demo',workspace:w,lead_id:lead.id,start:at,end:'2026-10-10T12:30:00.000Z',status:'simulated_booked',created:at});
 put('gr_tokens',{id:'token-demo',workspace:w,lead_id:lead.id,kind:'booking',expires:1900000000000,used:0});
 put('gr_jobs',{id:'job-demo',workspace:w,type:'draft',input:JSON.stringify({leadId:lead.id}),status:'running',created:at,dedupe:'demo-dedupe'});
 put('gr_costs',{id:'cost-demo',workspace:w,category:'Fixture',cents:125,status:'charged',note:'Importo inventato',created:at});
 put('os_costs',{id:'cost-demo',client_id:w,agent:'growth:Fixture',cents:125,status:'charged',month:'2026-10',created_at:at});
 put('gr_suppressions',{workspace:w,email:'interrotto@fixture.example',created:at});
 put('gr_sources',{id:'source-demo',workspace:w,lead_id:lead.id,kind:'website',url:'https://fixture.example',retrieved_at:at,content:'Fonte immutabile inventata',provenance_json:'{"simulation":true}'});
 put('gr_conversions',{lead_id:lead.id,client_id:'demo-bottega',provenance:'{"simulation":true}',created:at});
 put('gr_approvals',{message_id:'message-demo',user_id:owner.id,decided_at:at,decision:'approved',reason:'Fixture'});
 s.requestApproval(w,'message-demo',{status:'approved',decidedBy:owner.id});
 put('gr_runtime',{workspace:w,provider:'openai',search_cents:5,ai_cents:25,version:3,checks_json:'{}',enabled_json:'{}',updated_at:at,updated_by:owner.id});
 put('gr_mail_config',{workspace:w,version:2,fingerprint:'fixture',checked_at:at,enabled_by:owner.id,enabled_at:at});
 put('gr_mail_approvals',{message_id:'message-demo',version:1,payload_json:'{}',context_json:'{}',hash:'fixture'});
 put('gr_mail_intents',{message_id:'message-demo',workspace:w,approval_version:1,payload_json:'{}',hash:'fixture',google_email:'owner@fixture.example',requested_by:owner.id,status:'uncertain',created_at:at,updated_at:at});
 put('gr_mail_thread_checks',{workspace:w,thread_id:'thread-demo',checked_at:at,error:'Fixture'});
 put('gr_mail_receipts',{message_id:'message-demo',google_email:'owner@fixture.example',sender_email:'inventato@fixture.example',fingerprint:'fixture',imported_at:at});
 put('gr_mail_sync_state',{workspace:w,last_attempt:at,last_success:at,result_json:'{"imported":1}'});
 put('gr_calendar_config',{workspace:w,version:2,fingerprint:'fixture',checked_at:at,enabled_by:owner.id,enabled_at:at});
 put('gr_calendar_invites',{hash:'invite-demo',workspace:w,lead_id:lead.id,approved_by:owner.id,config_version:2,fingerprint:'fixture',lead_json:'{}',content_json:'{}',expires:1900000000000,created_at:at});
 put('gr_calendar_intents',{id:'intent-demo',workspace:w,kind:'booking',lead_id:lead.id,invitation_hash:'invite-demo',calendar_id:'primary',resource_key:'fixture',google_email:'owner@fixture.example',google_version:1,config_version:2,fingerprint:'fixture',payload_json:'{}',payload_hash:'fixture',requested_by:owner.id,start:at,end:'2026-10-10T12:30:00.000Z',status:'uncertain',created_at:at,updated_at:at});
 put('gr_demo_mail',{id:'mail-demo',workspace:w,request_id:'message-demo',thread_id:'thread-demo',direction:'out',payload:'{"simulation":true}'});
 put('gr_demo_calendar',{id:'meeting-demo',workspace:w,start:at,end:'2026-10-10T12:30:00.000Z',status:'confirmed',payload:'{"simulation":true}'});
 const archive=createGrowthArchive({store,clock:()=>new Date(at)}),inspect=()=>archive.inspect(w),body=()=>({version:inspect().version,confirmed:true});
 const growthRows=()=>Object.fromEntries(store.query("SELECT name FROM sqlite_master WHERE type='table' AND name GLOB 'gr_*' AND name<>'gr_demo_archives' ORDER BY name").map(({name})=>[name,store.query(`SELECT * FROM ${name}`).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))]));
 return {store,s,owner,put,lead,other,archive,inspect,body,growthRows};
}

test('archivio completo e ripristino preservano 23 tabelle, approvazioni e importi senza rete',t=>{
 const f=fixture(t),original=f.growthRows(),costs=f.store.query('SELECT * FROM os_costs'),approvals=f.store.query('SELECT * FROM os_approvals'),clients=f.store.query('SELECT * FROM os_clients');
 const oldFetch=globalThis.fetch;globalThis.fetch=()=>{throw Error('La rete non deve essere usata');};t.after(()=>{globalThis.fetch=oldFetch;});
 const first=f.inspect();assert.equal(first.required,true);assert.equal(first.archive,null);assert.equal(Object.keys(first.counts).length,22);assert.equal(first.counts.gr_tokens,1);assert.equal(first.counts.gr_mail_receipts,1);assert.equal(first.counts.gr_demo_mail,1);
 assert.deepEqual(f.growthRows(),original);assert.equal(f.store.one('SELECT count(*) n FROM gr_demo_archives').n,0);
 const result=f.archive.archive(f.owner,w,f.body());assert.equal(result.required,false);assert.equal(result.archive.canRestore,true);assert.equal(result.archive.archivedAt,at);
 assert.equal(f.store.one('SELECT simulation FROM gr_workspaces WHERE id=?',w).simulation,0);
 const settings=f.s.settings(w);assert.equal(settings.paused,true);for(const key of ['autoResearch','autoDraft','autoSend','autoReply','publicFormEnabled'])assert.equal(settings[key],false);assert.equal(settings.senderEmail,'');
 assert.equal(f.store.one('SELECT count(*) n FROM gr_leads WHERE workspace=?',w).n,0);assert.ok(f.store.one('SELECT id FROM gr_leads WHERE id=?',f.other.id));
 assert.deepEqual(f.store.query('SELECT * FROM os_costs'),costs);assert.deepEqual(f.store.query('SELECT * FROM os_clients'),clients);assert.equal(f.store.one("SELECT status FROM os_approvals WHERE entity_id='message-demo'").status,'superseded');
 const exposed=JSON.stringify(result);assert.ok(!exposed.includes('Contenuto privato'));assert.ok(!exposed.includes('snapshot'));assert.ok(!exposed.includes('inventato@'));
 const restored=f.archive.restore(f.owner,w,f.body());assert.equal(restored.required,true);assert.equal(restored.archive,null);
 assert.deepEqual(f.growthRows(),original);assert.deepEqual(f.store.query('SELECT * FROM os_costs'),costs);assert.deepEqual(f.store.query('SELECT * FROM os_approvals'),approvals);assert.deepEqual(f.store.query('SELECT * FROM os_clients'),clients);
 assert.equal(f.store.one('SELECT status FROM gr_messages WHERE id=?','message-demo').status,'sending');assert.equal(f.store.one('SELECT status FROM gr_jobs WHERE id=?','job-demo').status,'running');assert.equal(f.store.one('SELECT restored_at FROM gr_demo_archives').restored_at,at);assert.deepEqual(f.store.query('PRAGMA foreign_key_check'),[]);
});

test('configurazioni predefinite create dalla lettura dello stato restano ripristinabili',t=>{
 const f=fixture(t);f.archive.archive(f.owner,w,f.body());
 for(const table of ['gr_runtime','gr_mail_config','gr_calendar_config'])f.store.run(`INSERT INTO ${table}(workspace) VALUES(?)`,w);
 assert.equal(f.inspect().archive.canRestore,true);f.archive.restore(f.owner,w,f.body());assert.equal(f.store.one('SELECT provider FROM gr_runtime WHERE workspace=?',w).provider,'openai');
});

test('nessun ripristino sovrascrive nuovi contatti reali, token, impostazioni o configurazioni',t=>{
 for(const mutate of [f=>createLead(f.s,w,{company:'Nuovo contatto',source:'Fixture'}),f=>f.put('gr_tokens',{id:'new-token',workspace:w,kind:'booking',expires:1900000000000}),f=>f.s.saveSettings(w,{paused:false}),f=>f.put('gr_runtime',{workspace:w,version:1})]){
  const f=fixture(t);f.archive.archive(f.owner,w,f.body());mutate(f);const before=f.growthRows();assert.equal(f.inspect().archive.canRestore,false);assert.throws(()=>f.archive.restore(f.owner,w,f.body()),e=>e.status===409);assert.deepEqual(f.growthRows(),before);
 }
});

test('conferma e versione corrente obbligatorie; il doppio invio è innocuo',t=>{
 const f=fixture(t),before=f.growthRows(),preview=f.body();assert.throws(()=>f.archive.archive(f.owner,w,{...preview,confirmed:false}),e=>e.status===409);
 f.store.run('UPDATE gr_leads SET notes=? WHERE id=?','Modifica successiva',f.lead.id);assert.throws(()=>f.archive.archive(f.owner,w,preview),e=>e.status===409);assert.equal(f.inspect().archive,null);
 const current=f.body();f.archive.archive(f.owner,w,current);assert.throws(()=>f.archive.archive(f.owner,w,current),e=>e.status===409);assert.equal(f.store.one('SELECT count(*) n FROM gr_demo_archives').n,1);
 const restore=f.body();f.store.run('INSERT INTO gr_mail_config(workspace) VALUES(?)',w);assert.throws(()=>f.archive.restore(f.owner,w,restore),e=>e.status===409);f.archive.restore(f.owner,w,f.body());assert.equal(f.growthRows().gr_messages[0].body,before.gr_messages[0].body);
});

test('ruoli falsificati, socio revocato, orchestratore e password provvisoria non archiviano',t=>{
 const f=fixture(t),body=f.body();
 for(const user of [null,{id:'missing',role:'owner'}, {...f.owner,id:'demo-client'}, {...f.owner,id:'demo-collaborator'}, {...f.owner,id:'os-orchestrator'}])assert.throws(()=>f.archive.archive(user,w,body),e=>e.status===403);
 f.store.run('UPDATE os_users SET active=0 WHERE id=?',f.owner.id);assert.throws(()=>f.archive.archive(f.owner,w,body),e=>e.status===403);
 f.store.run('UPDATE os_users SET active=1,must_change_password=1 WHERE id=?',f.owner.id);assert.throws(()=>f.archive.archive(f.owner,w,body),e=>e.status===403);assert.equal(f.store.one('SELECT count(*) n FROM gr_demo_archives').n,0);
});

test('archivio fallito a metà transazione ripristina dati, approvazioni e audit',t=>{
 const f=fixture(t),before=f.growthRows(),approvals=f.store.query('SELECT * FROM os_approvals'),audit=f.store.query('SELECT * FROM os_audit');
 f.store.db.exec("CREATE TRIGGER archive_fixture_failure BEFORE DELETE ON gr_leads BEGIN SELECT RAISE(ABORT,'Interruzione inventata'); END;");
 assert.throws(()=>f.archive.archive(f.owner,w,f.body()),/Interruzione inventata/);assert.deepEqual(f.growthRows(),before);assert.deepEqual(f.store.query('SELECT * FROM os_approvals'),approvals);assert.deepEqual(f.store.query('SELECT * FROM os_audit'),audit);assert.equal(f.store.one('SELECT count(*) n FROM gr_demo_archives').n,0);
});

test('ripristino fallito a metà transazione conserva lo spazio reale e l’archivio',t=>{
 const f=fixture(t);f.archive.archive(f.owner,w,f.body());const before=f.growthRows(),archived=f.store.one('SELECT * FROM gr_demo_archives');
 f.store.db.exec("CREATE TRIGGER restore_fixture_failure BEFORE INSERT ON gr_leads BEGIN SELECT RAISE(ABORT,'Interruzione ripristino'); END;");
 assert.throws(()=>f.archive.restore(f.owner,w,f.body()),/Interruzione ripristino/);assert.deepEqual(f.growthRows(),before);assert.deepEqual(f.store.one('SELECT * FROM gr_demo_archives'),archived);assert.equal(f.inspect().archive.canRestore,true);
});

test('modifiche successive a costi o approvazioni condivise impediscono il ripristino',t=>{
 for(const sql of ["UPDATE os_costs SET status='released' WHERE id='cost-demo'","UPDATE os_approvals SET reason='Nuova decisione'"]){
  const f=fixture(t);f.archive.archive(f.owner,w,f.body());const old=f.body();f.store.run(sql);assert.equal(f.inspect().archive.canRestore,false);assert.throws(()=>f.archive.restore(f.owner,w,old),e=>e.status===409);assert.throws(()=>f.archive.restore(f.owner,w,f.body()),e=>e.status===409);
 }
});

test('dipendenze o colonne sconosciute bloccano il trasferimento senza perdita',t=>{
 for(const sql of ['CREATE TABLE gr_future(id TEXT,workspace TEXT)','CREATE TABLE future_child(id TEXT,lead_id TEXT REFERENCES gr_leads(id))','ALTER TABLE gr_leads ADD COLUMN future TEXT']){
  const f=fixture(t),body=f.body(),before=f.growthRows();f.store.db.exec(sql);assert.throws(()=>f.archive.archive(f.owner,w,body),e=>e.status===409);assert.equal(f.store.one('SELECT count(*) n FROM gr_demo_archives').n,0);assert.equal(f.store.one('SELECT count(*) n FROM gr_leads').n,before.gr_leads.length);
 }
});

test('nuove estensioni non impediscono lo stato reale e disabilitano il ripristino',t=>{
 const f=fixture(t);f.archive.archive(f.owner,w,f.body());f.store.db.exec('CREATE TABLE gr_future(id TEXT,workspace TEXT)');const state=f.inspect();assert.equal(state.required,false);assert.equal(state.archive.canRestore,false);assert.throws(()=>f.archive.restore(f.owner,w,{version:state.version,confirmed:true}),e=>e.status===409);
});

test('riferimenti tra workspace diversi sono rifiutati senza spostare altre attività',t=>{
 const f=fixture(t);f.put('gr_tokens',{id:'invalid-token',workspace:'demo-studio',lead_id:f.lead.id,kind:'booking',expires:1900000000000});assert.throws(()=>f.inspect(),e=>e.status===409);assert.equal(f.store.one('SELECT count(*) n FROM gr_demo_archives').n,0);
});

test('contenuto dell’archivio immutabile e conservato anche dopo il ripristino',t=>{
 const f=fixture(t);f.archive.archive(f.owner,w,f.body());assert.throws(()=>f.store.run("UPDATE gr_demo_archives SET snapshot_json='{}'"),/immutabile/);assert.throws(()=>f.store.run('DELETE FROM gr_demo_archives'),/conservato/);f.archive.restore(f.owner,w,f.body());assert.equal(f.store.one('SELECT count(*) n FROM gr_demo_archives').n,1);
});
