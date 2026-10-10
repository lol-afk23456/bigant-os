import {createHash,randomUUID} from 'node:crypto';
import {AppError} from './store.js';
import {defaultSettings} from './growth-store.js';

// Parent rows precede children. The archive uses the same database/transaction
// so a failed transfer can never leave a partial snapshot or partial live data.
const definitions={
 gr_workspaces:'id name settings simulation',
 gr_leads:'id workspace company website domain email contact sector city stage score source notes analysis consent consent_proof consent_at suppressed value owner created updated client_id',
 gr_messages:'id workspace lead_id direction subject body status provider_id thread_id reply_to kind created sent error booking_token',
 gr_meetings:'id workspace lead_id start end status provider_id link created',
 gr_tokens:'id workspace lead_id kind expires used',
 gr_jobs:'id workspace type input status error created started finished dedupe',
 gr_costs:'id workspace category cents status note created',
 gr_suppressions:'workspace email created',
 gr_sources:'id workspace lead_id kind url retrieved_at content provenance_json',
 gr_conversions:'lead_id client_id provenance created',
 gr_approvals:'message_id user_id decided_at decision reason',
 gr_runtime:'workspace provider search_cents ai_cents version checks_json enabled_json updated_at updated_by',
 gr_mail_config:'workspace version fingerprint checked_at enabled_by enabled_at',
 gr_mail_approvals:'message_id version payload_json context_json hash',
 gr_mail_intents:'message_id workspace approval_version payload_json hash google_email requested_by status created_at updated_at error',
 gr_mail_thread_checks:'workspace thread_id checked_at error',
 gr_mail_receipts:'message_id google_email sender_email fingerprint imported_at',
 gr_mail_sync_state:'workspace last_attempt last_success result_json',
 gr_calendar_config:'workspace version fingerprint checked_at checked_by probe_id verified_at verified_by received_at enabled_by enabled_at',
 gr_calendar_invites:'hash workspace lead_id approved_by config_version fingerprint lead_json content_json expires used intent_id created_at',
 gr_calendar_intents:'id workspace kind lead_id invitation_hash calendar_id resource_key google_email google_version config_version fingerprint payload_json payload_hash requested_by start end status provider_status link dispatch_at cancel_etag cancel_dispatch_at created_at updated_at error',
 gr_demo_mail:'id workspace request_id thread_id direction payload',
 gr_demo_calendar:'id workspace start end status payload',
};
const tables=Object.keys(definitions),archiveTable='gr_demo_archives';
const quote=value=>'"'+String(value).replaceAll('"','""')+'"';
const canonical=value=>JSON.stringify(normalize(value));
function normalize(value){if(Array.isArray(value))return value.map(normalize);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,normalize(value[key])]));return value;}
const ordered=rows=>rows.sort((a,b)=>canonical(a).localeCompare(canonical(b)));
const hash=value=>createHash('sha256').update(canonical(value)).digest('hex');
const fail=message=>{throw new AppError(message,409);};
const scope=table=>table==='gr_workspaces'?'id=?':definitions[table].split(' ').includes('workspace')?'workspace=?':table==='gr_conversions'?'lead_id IN (SELECT id FROM gr_leads WHERE workspace=?)':'message_id IN (SELECT id FROM gr_messages WHERE workspace=?)';
const pristineConfigs={
 gr_runtime:{provider:'',search_cents:0,ai_cents:0,version:0,checks_json:'{}',enabled_json:'{}',updated_at:null,updated_by:null},
 gr_mail_config:{version:0,fingerprint:null,checked_at:null,enabled_by:null,enabled_at:null},
 gr_calendar_config:{version:0,fingerprint:null,checked_at:null,checked_by:null,probe_id:null,verified_at:null,verified_by:null,received_at:null,enabled_by:null,enabled_at:null},
};

export function createGrowthArchive({store,clock=()=>new Date()}){
 store.db.exec(`CREATE TABLE IF NOT EXISTS ${archiveTable}(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES os_clients(id),archived_at TEXT NOT NULL,archived_by TEXT NOT NULL,snapshot_json TEXT NOT NULL,restored_at TEXT,restored_by TEXT);
 CREATE UNIQUE INDEX IF NOT EXISTS gr_demo_archive_active ON ${archiveTable}(client_id) WHERE restored_at IS NULL;
 CREATE TRIGGER IF NOT EXISTS gr_demo_archive_immutable BEFORE UPDATE OF id,client_id,archived_at,archived_by,snapshot_json ON ${archiveTable} BEGIN SELECT RAISE(ABORT,'Archivio DEMO immutabile'); END;
 CREATE TRIGGER IF NOT EXISTS gr_demo_archive_no_delete BEFORE DELETE ON ${archiveTable} BEGIN SELECT RAISE(ABORT,'Archivio DEMO conservato'); END;`);

 function schema(){
  const all=store.query("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"),present=new Set(all.map(row=>row.name)),out={};
  for(const {name} of all){
   if(name.startsWith('gr_')&&!definitions[name]&&name!==archiveTable)fail('Schema Growth non riconosciuto: archiviazione sospesa.');
   const foreign=store.query(`PRAGMA foreign_key_list(${quote(name)})`);
   if(!definitions[name]&&name!==archiveTable&&foreign.some(row=>definitions[row.table]))fail('Dipendenza Growth non riconosciuta: archiviazione sospesa.');
  }
  for(const table of tables){
   if(!present.has(table)){if(tables.indexOf(table)<=tables.indexOf('gr_approvals'))fail('Schema Growth incompleto: archiviazione sospesa.');continue;}
   const columns=store.query(`PRAGMA table_info(${quote(table)})`);
   if(canonical(columns.map(row=>row.name).sort())!==canonical(definitions[table].split(' ').sort()))fail('Schema Growth aggiornato: occorre verificare l’archivio.');
   out[table]={columns,foreign:store.query(`PRAGMA foreign_key_list(${quote(table)})`)};
  }
  return out;
 }
 function capture(clientId,shape){
  const rows={};for(const table of tables)if(shape[table])rows[table]=ordered(store.query(`SELECT * FROM ${quote(table)} WHERE ${scope(table)}`,clientId));
  // A malformed cross-workspace reference must never drag another client's
  // rows into this archive, or permit deletion of their referenced records.
  for(const table of tables.filter(name=>shape[name]&&definitions[name].includes('workspace'))){
   const columns=definitions[table].split(' ');
   for(const [column,parent] of [['lead_id','gr_leads'],['message_id','gr_messages']])if(columns.includes(column)&&store.one(`SELECT 1 FROM ${quote(table)} WHERE workspace<>? AND ${column} IN (SELECT id FROM ${parent} WHERE workspace=?) LIMIT 1`,clientId,clientId))fail('Riferimenti Growth tra attività diverse: archiviazione sospesa.');
   for(const [column,parent] of [['lead_id','gr_leads'],['message_id','gr_messages']])if(columns.includes(column)&&store.one(`SELECT 1 FROM ${quote(table)} WHERE workspace=? AND ${column} IS NOT NULL AND ${column} NOT IN (SELECT id FROM ${parent} WHERE workspace=?) LIMIT 1`,clientId,clientId))fail('Riferimenti Growth incoerenti: archiviazione sospesa.');
  }
  const approvals=ordered(store.query("SELECT * FROM os_approvals WHERE kind='growth_message' AND entity_id IN (SELECT id FROM gr_messages WHERE workspace=?)",clientId));
  if(approvals.some(row=>row.client_id!==clientId))fail('Approvazioni Growth di un’altra attività: archiviazione sospesa.');
  const costs=ordered(store.query('SELECT * FROM os_costs WHERE id IN (SELECT id FROM gr_costs WHERE workspace=?)',clientId));
  if(costs.some(row=>row.client_id!==clientId))fail('Costi Growth di un’altra attività: archiviazione sospesa.');
  return {rows,approvals,costs};
 }
 function related(snapshot){
  const messages=snapshot.rows.gr_messages.map(row=>row.id),costs=snapshot.costs.map(row=>row.id);
  return {approvals:ordered(messages.flatMap(id=>store.query("SELECT * FROM os_approvals WHERE kind='growth_message' AND entity_id=?",id))),costs:ordered(costs.flatMap(id=>store.query('SELECT * FROM os_costs WHERE id=?',id)))};
 }
 function afterApprovals(snapshot){return snapshot.approvals.map(row=>({...row,status:['pending','approved'].includes(row.status)?'superseded':row.status}));}
 function isPristine(current,snapshot,shared,shape){
  if(hash(shape)!==snapshot.schemaHash||canonical(current.rows.gr_workspaces)!==canonical([snapshot.freshWorkspace]))return false;
  for(const table of tables.filter(name=>shape[name]&&name!=='gr_workspaces')){
   const rows=current.rows[table];if(rows.length&&(!pristineConfigs[table]||rows.length!==1||canonical(rows[0])!==canonical({workspace:snapshot.freshWorkspace.id,...pristineConfigs[table]})))return false;
  }
  return canonical(shared.approvals)===canonical(ordered(afterApprovals(snapshot)))&&canonical(shared.costs)===canonical(snapshot.costs);
 }
 function read(clientId){
  const client=store.one('SELECT id,name,active FROM os_clients WHERE id=?',clientId);if(!client)throw new AppError('Cliente OS non trovato.',404);
  const archived=store.one(`SELECT * FROM ${archiveTable} WHERE client_id=? AND restored_at IS NULL`,clientId),workspace=store.one('SELECT * FROM gr_workspaces WHERE id=?',clientId);
  if(workspace?.simulation!==1&&!archived)return {metadata:{required:false,version:hash({client,workspace}),counts:{},archive:null}};
  const shape=schema(),current=capture(clientId,shape),snapshot=archived?JSON.parse(archived.snapshot_json):null,shared=snapshot?related(snapshot):null;
  const required=current.rows.gr_workspaces[0]?.simulation===1;
  const counts=Object.fromEntries(Object.entries(current.rows).filter(([table])=>table!=='gr_workspaces').map(([table,rows])=>[table,rows.length]));
  const version=hash({client,shape,current,archived,shared});
  const archive=archived?{id:archived.id,archivedAt:archived.archived_at,canRestore:isPristine(current,snapshot,shared,shape),counts:Object.fromEntries(Object.entries(snapshot.rows).filter(([table])=>table!=='gr_workspaces').map(([table,rows])=>[table,rows.length]))}:null;
  return {client,shape,current,archived,snapshot,shared,metadata:{required,version,counts,archive}};
 }
 function inspect(clientId){
  try{return read(clientId).metadata;}
  catch(error){
   const workspace=store.one('SELECT * FROM gr_workspaces WHERE id=?',clientId),archived=store.one(`SELECT id,archived_at FROM ${archiveTable} WHERE client_id=? AND restored_at IS NULL`,clientId);
   if(error.status!==409||workspace?.simulation!==0||!archived)throw error;
   return {required:false,version:hash({workspace,archived,blocked:error.message}),counts:{},archive:{id:archived.id,archivedAt:archived.archived_at,canRestore:false,counts:{}}};
  }
 }
 function authorize(user,clientId,body){
  const fresh=user?.id&&store.one('SELECT * FROM os_users WHERE id=?',user.id);
  if(!fresh||fresh.role!=='owner'||fresh.active!==1||fresh.must_change_password!==0||fresh.id==='os-orchestrator')throw new AppError('Serve un socio BigAnt attivo per gestire l’archivio Growth.',403);
  if(!store.one('SELECT 1 FROM os_clients WHERE id=? AND active=1',clientId))throw new AppError('Attività non accessibile.',403);
  if(body?.confirmed!==true)fail('Conferma esplicitamente l’operazione sull’archivio Growth.');
  return fresh;
 }
 function preview(clientId,body){const context=read(clientId);if(typeof body?.version!=='string'||body.version!==context.metadata.version)fail('L’archivio Growth è cambiato: ricarica la pagina prima di confermare.');return context;}
 function removeRows(clientId,shape){for(const table of [...tables].reverse())if(shape[table])store.run(`DELETE FROM ${quote(table)} WHERE ${scope(table)}`,clientId);}
 function insert(table,row){const columns=Object.keys(row);store.run(`INSERT INTO ${quote(table)}(${columns.map(quote).join(',')}) VALUES(${columns.map(()=>'?').join(',')})`,...columns.map(name=>row[name]));}
 function archive(user,clientId,body){return store.transaction(()=>{
  const actor=authorize(user,clientId,body),context=preview(clientId,body);if(!context.metadata.required||context.archived)fail('Non esiste un archivio DEMO da separare per questa attività.');
  const freshWorkspace={id:clientId,name:context.client.name,settings:JSON.stringify({...defaultSettings,senderEmail:'',agency:'BigAnt Agency',signature:'Il team BigAnt Agency'}),simulation:0};
  const snapshot={format:1,schemaHash:hash(context.shape),...context.current,freshWorkspace},id=randomUUID(),at=clock().toISOString();
  store.run(`INSERT INTO ${archiveTable}(id,client_id,archived_at,archived_by,snapshot_json) VALUES(?,?,?,?,?)`,id,clientId,at,actor.id,JSON.stringify(snapshot));
  for(const approval of context.current.approvals)if(['pending','approved'].includes(approval.status))store.run("UPDATE os_approvals SET status='superseded' WHERE id=?",approval.id);
  removeRows(clientId,context.shape);insert('gr_workspaces',freshWorkspace);
  store.audit(actor,clientId,'Archivio Growth DEMO conservato',id,{counts:context.metadata.counts,simulation:true},'admin');
  return inspect(clientId);
 });}
 function restore(user,clientId,body){return store.transaction(()=>{
  const actor=authorize(user,clientId,body),context=preview(clientId,body);if(!context.archived||!context.metadata.archive.canRestore)fail('Ripristino sospeso: Growth contiene nuove attività o l’archivio è cambiato. Nessun dato è stato modificato.');
  removeRows(clientId,context.shape);
  for(const table of tables)for(const row of context.snapshot.rows[table]||[])insert(table,row);
  for(const row of context.snapshot.approvals)store.run('UPDATE os_approvals SET status=? WHERE id=?',row.status,row.id);
  store.run(`UPDATE ${archiveTable} SET restored_at=?,restored_by=? WHERE id=?`,clock().toISOString(),actor.id,context.archived.id);
  store.audit(actor,clientId,'Archivio Growth DEMO ripristinato',context.archived.id,{simulation:true},'admin');
  return inspect(clientId);
 });}
 return {inspect,archive,restore};
}
