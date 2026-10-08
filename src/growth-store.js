import { randomUUID } from 'node:crypto';
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
export function growthStore(root,getActor=()=>null){
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
 const query=(sql,...args)=>root.query(mapSql(sql),...args),one=(sql,...args)=>root.one(mapSql(sql),...args),run=(sql,...args)=>root.run(mapSql(sql),...args);
 const transaction=fn=>root.transaction(fn);
 function workspace(id='demo-bigant'){if(!one('SELECT id FROM workspaces WHERE id=?',id)){const c=root.one('SELECT name FROM os_clients WHERE id=?',id);if(!c)throw Object.assign(new Error('Cliente OS non trovato.'),{status:404});run('INSERT INTO workspaces VALUES(?,?,?)',id,c.name,JSON.stringify({...defaultSettings,agency:'BigAnt Agency · DEMO',signature:'Team BigAnt · DEMO',senderEmail:'team@bigant.example',description:defaultSettings.description}));}return id;}
 const settings=w=>({...defaultSettings,...JSON.parse(one('SELECT settings FROM workspaces WHERE id=?',w)?.settings||'{}')});
 const saveSettings=(w,p)=>run('UPDATE workspaces SET settings=? WHERE id=?',JSON.stringify({...settings(w),...p}),w);
 const log=(w,agent,action,detail='',lead=null)=>root.audit(getActor()||{id:'growth-demo',name:'Agente Growth DEMO',role:'agent'},w,action,lead,{module:'growth',agent,detail,simulation:true,costCents:0},'internal');
 const lead=(w,id)=>one('SELECT * FROM leads WHERE workspace=? AND id=?',w,id);
 const active=w=>!!root.one('SELECT 1 FROM os_clients WHERE id=? AND active=1',w);
 const budgetMonth=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit'}).format(new Date());
 const costs=()=>root.one("SELECT COALESCE(SUM(cents),0) total FROM os_costs WHERE month=? AND status IN ('reserved','charged')",budgetMonth()).total;
 const reserve=(w,category,cents,note)=>transaction(()=>{
   if(!Number.isSafeInteger(cents)||cents<0)throw Error('Costo non valido.');
   const st=settings(w),budget=Number(root.getSetting?.('budget_cents')??st.totalBudget),fixed=Number(root.getSetting?.('fixed_cents')??(st.hostingBudget+st.emailBudget+st.reserveBudget));
   if(costs()+cents>budget-fixed)throw Object.assign(new Error('Budget globale disponibile esaurito.'),{status:409});
   const id=uid();run('INSERT INTO costs VALUES(?,?,?,?,?,?,?)',id,w,category,cents,'reserved',note,now());
   root.run('INSERT INTO os_costs VALUES(?,?,?,?,?,?,?)',id,w,'growth:'+category,cents,'reserved',budgetMonth(),now());return id;
 });
 const settle=(id,ok=true)=>transaction(()=>{const status=ok?'charged':'released';run('UPDATE costs SET status=? WHERE id=?',status,id);root.run('UPDATE os_costs SET status=? WHERE id=?',status,id);});
 function requestApproval(w,messageId,{status='pending',reason='',decidedBy=null,changed=false}={}){
   const m=one("SELECT * FROM messages WHERE workspace=? AND id=? AND direction='out'",w,messageId);if(!m)return null;
   const latest=root.one("SELECT * FROM os_approvals WHERE kind='growth_message' AND entity_id=? ORDER BY version DESC LIMIT 1",messageId);
   if(latest&&!changed){root.run('UPDATE os_approvals SET status=?,decision_by=?,decision_at=?,reason=? WHERE id=?',status,decidedBy,status==='pending'?null:now(),reason,latest.id);return latest.id;}
   if(latest)root.run("UPDATE os_approvals SET status='superseded' WHERE kind='growth_message' AND entity_id=? AND status IN ('pending','approved')",messageId);
   const id=uid();root.run('INSERT INTO os_approvals(id,client_id,kind,entity_id,version,title,body,status,requested_by,decision_by,decision_at,reason,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',id,w,'growth_message',messageId,(latest?.version||0)+1,m.subject,m.body,status,getActor()?.id||'growth-demo',decidedBy,status==='pending'?null:now(),reason,now());return id;
 }
 const enqueue=(w,type,input={},dedupe=null)=>{const id=uid();run('INSERT OR IGNORE INTO jobs VALUES(?,?,?,?,?,?,?,?,?,?)',id,w,type,JSON.stringify(input),'queued',null,now(),null,null,dedupe);return one('SELECT * FROM jobs WHERE workspace=? AND id=?',w,id)||one('SELECT * FROM jobs WHERE workspace=? AND dedupe=?',w,dedupe);};
 // Presenza provider solo simulata: niente chiavi o credenziali nel modulo.
 const hasApproval=(w,id)=>!!root.one("SELECT 1 FROM os_approvals a JOIN gr_messages m ON m.id=a.entity_id JOIN os_users u ON u.id=a.decision_by WHERE a.kind='growth_message' AND a.status='approved' AND a.version=(SELECT MAX(version) FROM os_approvals WHERE kind='growth_message' AND entity_id=a.entity_id) AND m.workspace=? AND m.id=? AND u.role='owner' AND u.active=1",w,id);
 const getSecret=(_w,name)=>['brave','openai'].includes(name)?'DEMO_PROVIDER': '';
 return {active,db:root.db,query,one,run,transaction,workspace,settings,saveSettings,log,lead,costs,reserve,settle,enqueue,getSecret,requestApproval,hasApproval};
}
