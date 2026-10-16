import { randomUUID } from 'node:crypto';
import {createCostControl} from './cost-control.js';
export const stages = ['new','qualified','contacted','interested','meeting','proposal','won','lost'];
export const now = () => new Date().toISOString();
export const uid = () => randomUUID();
export const defaultSettings = {
  agency:'BigAnt Agency', region:'Caserta e provincia', sector:'', offer:'Analisi della presenza online e delle opportunità di acquisizione clienti.',
  description:'BigAnt Agency è uno studio creativo del casertano. Servizi prioritari per questa acquisizione: produzione video, siti web, gestione social, Google Ads e Meta Ads. Servizi complementari: branding e SEO locale. Esclusi da ricerca e proposte: fotografia, insegne, abbigliamento e gadget personalizzati, perché rivenduti con margine insufficiente per finanziare l’acquisizione. Metodo: brief, analisi delle opportunità, esecuzione. Non promettere risultati garantiti né inventare prezzi o casi di successo.',
  pedUrl:'https://ped.bigantagency.it/', senderName:'BigAnt Agency', senderEmail:'', signature:'Il team BigAnt Agency',
  totalBudget:5000, hostingBudget:2000, emailBudget:500, reserveBudget:1000, dailyLimit:5, researchLimit:5,
  autoResearch:false, autoDraft:false, autoSend:false, autoReply:false, paused:true,
  followupDays:5, maxFollowups:1, calendarId:'primary', meetingMinutes:30, startHour:10, endHour:17,
  timezone:'Europe/Rome', privacyUrl:'', publicFormEnabled:false, autonomyAcknowledged:false,
};


const mapSql=sql=>sql.replace(/\b(workspaces|leads|messages|meetings|tokens|jobs|costs|suppressions)\b/g,name=>'gr_'+name).replace(/\b(leads_domain|leads_email|messages_provider|meeting_provider)\b/g,name=>'gr_'+name);
export function growthStore(root,getActor=()=>null,{realMode=false,clock=()=>new Date(),costControl=createCostControl({store:root,clock})}={}){
 root.db.exec(mapSql(`  CREATE TABLE IF NOT EXISTS workspaces(id TEXT PRIMARY KEY REFERENCES os_clients(id), name TEXT NOT NULL, settings TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY, workspace TEXT NOT NULL REFERENCES workspaces(id), company TEXT NOT NULL, website TEXT NOT NULL DEFAULT '', domain TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', contact TEXT NOT NULL DEFAULT '', sector TEXT NOT NULL DEFAULT '', city TEXT NOT NULL DEFAULT '', stage TEXT NOT NULL DEFAULT 'new', score INTEGER NOT NULL DEFAULT 0, source TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', analysis TEXT NOT NULL DEFAULT '', consent TEXT NOT NULL DEFAULT 'none', consent_proof TEXT NOT NULL DEFAULT '', consent_at TEXT, suppressed INTEGER NOT NULL DEFAULT 0, value INTEGER NOT NULL DEFAULT 0, owner TEXT NOT NULL DEFAULT 'Socio DEMO', created TEXT NOT NULL, updated TEXT NOT NULL,client_id TEXT REFERENCES os_clients(id));
  CREATE UNIQUE INDEX IF NOT EXISTS leads_domain ON leads(workspace,domain) WHERE domain<>'';
  CREATE UNIQUE INDEX IF NOT EXISTS leads_email ON leads(workspace,email) WHERE email<>'';
  CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY, workspace TEXT NOT NULL REFERENCES workspaces(id), lead_id TEXT NOT NULL REFERENCES leads(id), direction TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL, provider_id TEXT, thread_id TEXT, reply_to TEXT, kind TEXT NOT NULL DEFAULT 'initial', created TEXT NOT NULL, sent TEXT, error TEXT, booking_token TEXT);
  CREATE UNIQUE INDEX IF NOT EXISTS messages_provider ON messages(workspace,provider_id) WHERE provider_id IS NOT NULL;
  CREATE TABLE IF NOT EXISTS meetings(id TEXT PRIMARY KEY, workspace TEXT NOT NULL REFERENCES workspaces(id), lead_id TEXT NOT NULL REFERENCES leads(id), start TEXT NOT NULL, end TEXT NOT NULL, status TEXT NOT NULL, provider_id TEXT, link TEXT, created TEXT NOT NULL);
  CREATE UNIQUE INDEX IF NOT EXISTS meeting_provider ON meetings(workspace,provider_id) WHERE provider_id IS NOT NULL;
  CREATE TABLE IF NOT EXISTS tokens(id TEXT PRIMARY KEY, workspace TEXT NOT NULL REFERENCES workspaces(id), lead_id TEXT, kind TEXT NOT NULL, expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, workspace TEXT NOT NULL REFERENCES workspaces(id), type TEXT NOT NULL, input TEXT NOT NULL, status TEXT NOT NULL, error TEXT, created TEXT NOT NULL, started TEXT, finished TEXT, dedupe TEXT UNIQUE);
  CREATE TABLE IF NOT EXISTS costs(id TEXT PRIMARY KEY, workspace TEXT NOT NULL REFERENCES workspaces(id), category TEXT NOT NULL, cents INTEGER NOT NULL CHECK(cents>=0), status TEXT NOT NULL, note TEXT NOT NULL, created TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS suppressions(workspace TEXT NOT NULL REFERENCES workspaces(id), email TEXT NOT NULL, created TEXT NOT NULL, PRIMARY KEY(workspace,email));
`));
 root.db.exec(`CREATE TABLE IF NOT EXISTS gr_conversions(lead_id TEXT PRIMARY KEY REFERENCES gr_leads(id),client_id TEXT NOT NULL UNIQUE REFERENCES os_clients(id),provenance TEXT NOT NULL,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS gr_approvals(message_id TEXT PRIMARY KEY REFERENCES gr_messages(id),user_id TEXT NOT NULL,decided_at TEXT NOT NULL,decision TEXT NOT NULL,reason TEXT NOT NULL);`);
 if(!root.query('PRAGMA table_info(gr_workspaces)').some(row=>row.name==='simulation'))root.run('ALTER TABLE gr_workspaces ADD COLUMN simulation INTEGER NOT NULL DEFAULT 1');
 root.db.exec(`CREATE TABLE IF NOT EXISTS gr_sources(id TEXT PRIMARY KEY,workspace TEXT NOT NULL REFERENCES gr_workspaces(id),lead_id TEXT NOT NULL REFERENCES gr_leads(id),kind TEXT NOT NULL,url TEXT NOT NULL,retrieved_at TEXT NOT NULL,content TEXT NOT NULL,provenance_json TEXT NOT NULL);
 CREATE TRIGGER IF NOT EXISTS gr_sources_immutable BEFORE UPDATE ON gr_sources BEGIN SELECT RAISE(ABORT,'Fonte immutabile'); END;`);
 const query=(sql,...args)=>root.query(mapSql(sql),...args),one=(sql,...args)=>root.one(mapSql(sql),...args),run=(sql,...args)=>root.run(mapSql(sql),...args);
 const transaction=fn=>root.transaction(fn);
 function workspace(id='demo-bigant') {
  const current=one('SELECT * FROM workspaces WHERE id=?',id);
  const initial={...defaultSettings,...(realMode?{senderEmail:'',agency:'BigAnt Agency',signature:'Il team BigAnt Agency'}:{agency:'BigAnt Agency · DEMO',signature:'Team BigAnt · DEMO',senderEmail:'team@bigant.example'})};
  if(!current){const c=root.one('SELECT name FROM os_clients WHERE id=?',id);if(!c)throw Object.assign(new Error('Cliente OS non trovato.'),{status:404});run('INSERT INTO workspaces(id,name,settings,simulation) VALUES(?,?,?,?)',id,c.name,JSON.stringify(initial),realMode?0:1);}
  else if(!!current.simulation===realMode){
   const occupied=['leads','messages','jobs','costs','meetings'].some(table=>one(`SELECT 1 FROM ${table} WHERE workspace=? LIMIT 1`,id));
   if(occupied)throw Object.assign(new Error('Archivio Growth di prova e modalità reale non possono essere mescolati. Serve un archivio separato.'),{status:409});
   run('UPDATE workspaces SET settings=?,simulation=? WHERE id=?',JSON.stringify(initial),realMode?0:1,id);
  }
  return id;
 }

 const settings=w=>({...defaultSettings,...JSON.parse(one('SELECT settings FROM workspaces WHERE id=?',w)?.settings||'{}')});
 const saveSettings=(w,p)=>run('UPDATE workspaces SET settings=? WHERE id=?',JSON.stringify({...settings(w),...p}),w);
 const log=(w,agent,action,detail='',lead=null)=>root.audit(getActor()||{id:realMode?'growth-runtime':'growth-demo',name:realMode?'Agente Growth':'Agente Growth DEMO',role:'agent'},w,action,lead,{module:'growth',agent,detail,simulation:!realMode},'internal');
 const lead=(w,id)=>one('SELECT * FROM leads WHERE workspace=? AND id=?',w,id);
 const active=w=>!!root.one('SELECT 1 FROM os_clients WHERE id=? AND active=1',w);
 const budgetMonth=()=>costControl.month();
 const costs=()=>root.one("SELECT COALESCE(SUM(cents),0) total FROM os_costs WHERE month=? AND status IN ('reserved','charged')",budgetMonth()).total;
 const reserve=(w,category,cents,note)=>transaction(()=>{
   if(!Number.isSafeInteger(cents)||cents<0)throw Error('Costo non valido.');
   const st=settings(w),budget=Number(root.getSetting?.('budget_cents')??st.totalBudget),fixed=Number(root.getSetting?.('fixed_cents')??(st.hostingBudget+st.emailBudget+st.reserveBudget));
   if(costs()+cents>budget-fixed)throw Object.assign(new Error('Budget globale disponibile esaurito.'),{status:409});
   if(realMode)costControl.assertCanReserve(cents);
   const id=uid();run('INSERT INTO costs VALUES(?,?,?,?,?,?,?)',id,w,category,cents,'reserved',note,now());
   root.run('INSERT INTO os_costs VALUES(?,?,?,?,?,?,?)',id,w,'growth:'+category,cents,'reserved',budgetMonth(),now());return id;
 });
 const settle=(id,ok=true)=>transaction(()=>{const status=ok?'charged':'released';run('UPDATE costs SET status=? WHERE id=?',status,id);root.run('UPDATE os_costs SET status=? WHERE id=?',status,id);});
 const dispatch=id=>{if(realMode)costControl.assertReserved(id);};
 const approvalBody=(w,m)=>realMode?`Mittente: ${settings(w).senderEmail||'Da configurare'}\nDestinatario: ${lead(w,m.lead_id)?.email||'Da indicare'}\n\n${m.body}`:m.body;
 function invalidateApprovals(w,leadId=null){for(const m of query("SELECT * FROM messages WHERE workspace=? AND direction='out' AND status IN ('draft','approved') AND (? IS NULL OR lead_id=?)",w,leadId,leadId)){run("UPDATE messages SET status='draft' WHERE id=?",m.id);requestApproval(w,m.id,{changed:true});}}
 function requestApproval(w,messageId,{status='pending',reason='',decidedBy=null,changed=false}={}){
   const m=one("SELECT * FROM messages WHERE workspace=? AND id=? AND direction='out'",w,messageId);if(!m)return null;
   const latest=root.one("SELECT * FROM os_approvals WHERE kind='growth_message' AND entity_id=? ORDER BY version DESC LIMIT 1",messageId);
   if(latest&&!changed){root.run('UPDATE os_approvals SET status=?,decision_by=?,decision_at=?,reason=? WHERE id=?',status,decidedBy,status==='pending'?null:now(),reason,latest.id);return latest.id;}
   if(latest)root.run("UPDATE os_approvals SET status='superseded' WHERE kind='growth_message' AND entity_id=? AND status IN ('pending','approved')",messageId);
   const id=uid();root.run('INSERT INTO os_approvals(id,client_id,kind,entity_id,version,title,body,status,requested_by,decision_by,decision_at,reason,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',id,w,'growth_message',messageId,(latest?.version||0)+1,m.subject,approvalBody(w,m),status,getActor()?.id||'growth-demo',decidedBy,status==='pending'?null:now(),reason,now());return id;
 }
 const enqueue=(w,type,input={},dedupe=null)=>{const id=uid();run('INSERT OR IGNORE INTO jobs VALUES(?,?,?,?,?,?,?,?,?,?)',id,w,type,JSON.stringify(input),'queued',null,now(),null,null,dedupe);return one('SELECT * FROM jobs WHERE workspace=? AND id=?',w,id)||one('SELECT * FROM jobs WHERE workspace=? AND dedupe=?',w,dedupe);};
 // Presenza provider solo simulata: niente chiavi o credenziali nel modulo.
 const hasApproval=(w,id)=>!!root.one("SELECT 1 FROM os_approvals a JOIN gr_messages m ON m.id=a.entity_id JOIN os_users u ON u.id=a.decision_by WHERE a.kind='growth_message' AND a.status='approved' AND a.version=(SELECT MAX(version) FROM os_approvals WHERE kind='growth_message' AND entity_id=a.entity_id) AND m.workspace=? AND m.id=? AND u.role='owner' AND u.active=1",w,id);
 const getSecret=(_w,name)=>!realMode&&['brave','openai'].includes(name)?'DEMO_PROVIDER': '';
 const source=(w,leadId,kind,value)=>{const lead=one('SELECT id FROM leads WHERE workspace=? AND id=?',w,leadId);if(!lead)throw new Error('Azienda non trovata per la fonte.');let url;try{url=new URL(value.url);}catch{throw new Error('URL della fonte non valido.');}if(!['http:','https:'].includes(url.protocol)||url.username||url.password||!['search','website'].includes(kind)||typeof value.retrievedAt!=='string'||!Number.isFinite(Date.parse(value.retrievedAt)))throw new Error('Fonte incompleta o non valida.');run('INSERT INTO gr_sources VALUES(?,?,?,?,?,?,?,?)',uid(),w,leadId,kind,url.href,value.retrievedAt,String(value.text||value.description||'').slice(0,14000),JSON.stringify({provider:value.source||'Sito pubblico',simulation:!realMode}));};
 return {simulation:!realMode,source,active,approvalBody,invalidateApprovals,db:root.db,query,one,run,transaction,workspace,settings,saveSettings,log,lead,costs,reserve,settle,dispatch,enqueue,getSecret,requestApproval,hasApproval};
}
