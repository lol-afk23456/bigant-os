import {uid,now,text,integer,AppError,requireOwner,requireClient} from './store.js';
import {agentDefinitions} from './registry.js';
import {eligibleAgent,eventDefinitions,agentServices} from './agents/catalog.js';
import {runCoreAgent,coreAgentIds} from './agents/core.js';
import {runSpecialist,specialistDemoInputs} from './agents/specialists.js';
import {createModuleAgentRunner} from './agents/modules.js';
import {createAgentOutputs} from './agents/outputs.js';
const agentMap=new Map(agentDefinitions.map(a=>[a.id,a]));
const romeFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',weekday:'short',hourCycle:'h23'});
function romeParts(date) {return Object.fromEntries(romeFormatter.formatToParts(date).map(p=>[p.type,p.value]));}
export function nextRun(trigger,after=new Date()) {
  if(trigger.startsWith('event:'))return null;
  if(!['daily','weekly-monday','weekly-friday','monthly'].includes(trigger))throw new AppError('Calendario non valido.');
  let t=Math.floor(after.getTime()/60000)*60000+60000;
  for(let i=0;i<46081;i++,t+=60000){const p=romeParts(new Date(t));if(p.hour!=='09'||p.minute!=='00')continue;if(trigger==='weekly-monday'&&p.weekday!=='Mon')continue;if(trigger==='weekly-friday'&&p.weekday!=='Fri')continue;if(trigger==='monthly'&&p.day!=='01')continue;return new Date(t).toISOString();}
  throw new AppError('Impossibile calcolare la prossima esecuzione.');
}
export function createOrchestrator({store:s,production,administration,growth=null,fidelity=null,clock=()=>new Date(),testHandlers={}}) {
  const instant=()=>clock().toISOString();
  const month=()=>{const p=romeParts(clock());return `${p.year}-${p.month}`;};
  let ticking=false;
  const outputs=createAgentOutputs({store:s,production});
  const moduleRunner=createModuleAgentRunner({store:s,growth,fidelity});
  s.db.exec(`CREATE TABLE IF NOT EXISTS os_agent_events(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES os_clients(id),name TEXT NOT NULL,entity_id TEXT NOT NULL,version INTEGER NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(client_id,name,entity_id,version));
  CREATE TABLE IF NOT EXISTS os_schedule_inputs(schedule_id TEXT PRIMARY KEY REFERENCES os_schedules(id),input TEXT NOT NULL);`);
  function eligibility(clientId,agent) {const c=s.one('SELECT id,name,services_json FROM os_clients WHERE id=? AND active=1',clientId);if(!c)throw new AppError('Attività non disponibile.',403);const r=eligibleAgent(agent,c);if(!r.eligible)throw new AppError(r.unavailableReason,403);return c;}
  function checkedInput(input) {if(!input||typeof input!=='object'||Array.isArray(input)||JSON.stringify(input).length>40000)throw new AppError('Input della procedura non valido.');if(input.fixture&&input.fixture.demo!==true)throw new AppError('Sono ammessi solo dati di esempio marcati DEMO.');return structuredClone(input);} 

  function budget() {const used=s.one("SELECT COALESCE(SUM(cents),0) n FROM os_costs WHERE month=? AND status IN('reserved','charged')",month()).n;const cap=Number(s.getSetting('budget_cents')),fixed=Number(s.getSetting('fixed_cents'));return {capCents:cap,fixedCents:fixed,usedCents:used,availableCents:Math.max(0,cap-fixed-used),month:month(),simulation:true};}
  function reserve(clientId,agent,cents) {integer(cents);return s.transaction(()=>{const b=budget();if(cents>b.availableCents)throw new AppError('Budget disponibile esaurito. Attività in attesa.',409);const id=uid();s.run('INSERT INTO os_costs VALUES(?,?,?,?,?,?,?)',id,clientId,agent,cents,'reserved',month(),instant());return id;});}
  function enqueue(user,clientId,agent,input={},dedupe=null) {
    requireOwner(user);requireClient(s,user,clientId);const def=agentMap.get(agent);
    if(!def||def.status!=='implemented')throw new AppError('Questo specialista è predisposto: usa il modulo indicato o completa prima la sua attivazione.',409);
    eligibility(clientId,agent);const clean=checkedInput(input);delete clean.requestedBy;
    const key=dedupe?`${clientId}:${agent}:${text(dedupe,180)}`:null;
    const id=uid();s.run('INSERT OR IGNORE INTO os_jobs(id,client_id,agent,input,status,available_at,dedupe,created_at) VALUES(?,?,?,?,?,?,?,?)',id,clientId,agent,JSON.stringify({...clean,requestedBy:user.id}),'queued',instant(),key,instant());
    const job=s.one('SELECT * FROM os_jobs WHERE id=?',id)||s.one('SELECT * FROM os_jobs WHERE dedupe=?',key);if(job.id===id)s.audit(user,clientId,'Agente accodato',id,{agent,mode:'DEMO',source:'SOP versionata'});return job;
  }

  const robot={id:'os-orchestrator',role:'owner',name:'Orchestratore DEMO',active:1};
  function context(job) {
    const client=eligibility(job.client_id,job.agent);
    const memory=s.query("SELECT kind,content,version,source FROM os_memory WHERE client_id=? AND (visibility!='admin' OR ?='administration') AND (kind IN('master','dna','strategy','feedback','report') OR kind=?)",job.client_id,job.agent,'agent-feedback:'+job.agent);
    const tasks=s.query('SELECT id,title,service,status,due,estimate_minutes,actual_minutes FROM os_tasks WHERE client_id=?',job.client_id);
    const contents=s.query('SELECT id,title,body,service,state,source,version FROM os_contents WHERE client_id=?',job.client_id);
    return {client,memory,tasks,contents,input:JSON.parse(job.input),asOf:instant(),feedback:memory.filter(m=>m.kind==='feedback'||m.kind.startsWith('agent-feedback:')).map(m=>m.content).join('\n'),sources:memory.map(m=>`Memoria ${m.kind} v${m.version} · ${m.source}`),simulation:true};
  }
  async function resultFor(job,c) {
    if(testHandlers[job.agent])return testHandlers[job.agent](c);
    if(['research','analyst','commercial','fidelity'].includes(job.agent))return moduleRunner(job,robot);
    if(coreAgentIds.includes(job.agent)) {
      let aggregates={},anomalies=[];
      if(job.agent==='director') {
        const clients=s.query('SELECT services_json FROM os_clients WHERE active=1');
        aggregates={activeClients:clients.length,servicesPerClient:clients.length?Math.round(clients.reduce((n,x)=>n+JSON.parse(x.services_json).length,0)/clients.length*10)/10:0,marketingResults:null};
        if(administration){const {summary}=administration.state(job.client_id,robot,{asOf:instant().slice(0,10)});aggregates={...aggregates,incomeMonthCents:summary.income_month_cents,expensesMonthCents:summary.expenses_month_cents,arrearsCents:summary.arrears_cents,source:'Aggregati Amministrazione DEMO; non riconciliati con fonti reali'};}
      }
      if(job.agent==='administration')anomalies=administration.analyze(robot,{asOf:instant().slice(0,10)});
      return runCoreAgent(job.agent,c,{aggregates,anomalies});
    }
    return runSpecialist(job.agent,c);
  }
  function schedule() {
    for(const row of s.query('SELECT * FROM os_schedules WHERE enabled=1 AND next_at<=?',instant())) {
      const def=agentMap.get(row.agent);if(def?.status!=='implemented')continue;
      if(!s.one('SELECT id FROM os_clients WHERE id=? AND active=1',row.client_id)){s.run('UPDATE os_schedules SET enabled=0 WHERE id=?',row.id);s.audit(robot,row.client_id,'Pianificazione sospesa',row.id,{reason:'Attività disattivata'});continue;}
      try{eligibility(row.client_id,row.agent);}catch(e){s.run('UPDATE os_schedules SET enabled=0 WHERE id=?',row.id);s.audit(robot,row.client_id,'Pianificazione sospesa',row.id,{reason:e.message});continue;}
      s.transaction(()=>{enqueue(robot,row.client_id,row.agent,JSON.parse(s.one('SELECT input FROM os_schedule_inputs WHERE schedule_id=?',row.id)?.input||'{}'),`schedule:${row.id}:${row.next_at}`);s.run('UPDATE os_schedules SET last_at=?,next_at=? WHERE id=?',instant(),nextRun(row.trigger,clock()),row.id);});
    }
  }
  function event(name,clientId,entityId,version=1,payload={}) {
    if(!eventDefinitions.some(e=>e.id===name))throw new AppError('Evento non previsto.');
    requireClient(s,robot,clientId);integer(version,1);const clean=checkedInput(payload);
    return s.transaction(()=>{
      const id=uid();s.run('INSERT OR IGNORE INTO os_agent_events VALUES(?,?,?,?,?,?,?)',id,clientId,name,text(entityId,180),version,JSON.stringify(clean),instant());
      const record=s.one('SELECT * FROM os_agent_events WHERE client_id=? AND name=? AND entity_id=? AND version=?',clientId,name,text(entityId,180),version);
      const jobs=[];for(const row of s.query('SELECT * FROM os_schedules WHERE enabled=1 AND trigger=? AND client_id=?','event:'+name,clientId)){
        try{eligibility(clientId,row.agent);}catch{continue;}
        jobs.push(enqueue(robot,clientId,row.agent,{...JSON.parse(s.one('SELECT input FROM os_schedule_inputs WHERE schedule_id=?',row.id)?.input||'{}'),...clean,entityId,...(name==='lead.created'?{leadId:entityId}:{})},`event:${row.id}:${record.id}`));
      }return {eventId:record.id,jobs};
    });
  }
  async function tickModules() {
    const results=[];
    if(growth)try {results.push({module:'growth',...(await growth.engine.tick())});s.setSetting('module_error_growth','');}catch(e){s.setSetting('module_error_growth',text(e.message,300));results.push({module:'growth',error:true});}
    const fidelityErrors=[];
    if(fidelity)for(const c of s.query('SELECT id,name,services_json FROM os_clients WHERE active=1'))if(JSON.parse(c.services_json).includes('fidelity'))try {const r=fidelity.tick(c.id,robot);if(r.prepared.length)results.push({module:'fidelity',clientId:c.id,prepared:r.prepared.length});}catch(e){fidelityErrors.push(c.name+': '+text(e.message,300));results.push({module:'fidelity',clientId:c.id,error:true});}
    if(fidelity)s.setSetting('module_error_fidelity',fidelityErrors.join(' · '));
    return results;
  }
  async function tick(clientId=null) {
    if(ticking||s.getSetting('paused')==='true')return {processed:0,paused:s.getSetting('paused')==='true'};if(budget().availableCents===0)return {processed:0,budgetBlocked:true};ticking=true;
    try {
      s.run("UPDATE os_jobs SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'queued' END,lease_until=NULL,error='Esecuzione interrotta: ripresa automatica controllata' WHERE status='running' AND lease_until<?",instant());
      if(!clientId)schedule();
      const modules=clientId?[]:await tickModules();
      const job=s.transaction(()=>{const j=s.one("SELECT * FROM os_jobs WHERE status='queued' AND available_at<=? AND (? IS NULL OR client_id=?) ORDER BY created_at,rowid LIMIT 1",instant(),clientId,clientId);if(!j)return null;const changed=s.run("UPDATE os_jobs SET status='running',attempts=attempts+1,lease_until=? WHERE id=? AND status='queued'",new Date(clock().getTime()+120000).toISOString(),j.id).changes;return changed?{...j,attempts:j.attempts+1}:null;});
      if(!job)return {processed:0,modules};
      if(!s.one('SELECT id FROM os_clients WHERE id=? AND active=1',job.client_id)){s.run("UPDATE os_jobs SET status='cancelled',error='Attività disattivata',finished_at=? WHERE id=?",instant(),job.id);return {processed:1,cancelled:true};}
      let reservation;
      try {
        const requestedBy=JSON.parse(job.input).requestedBy;const caller=s.one('SELECT role,active FROM os_users WHERE id=?',requestedBy);if(!caller||caller.role!=='owner'||!caller.active)throw new AppError('Il socio che ha richiesto il lavoro non è più autorizzato.',403);
        eligibility(job.client_id,job.agent);
        reservation=reserve(job.client_id,job.agent,0);
        const c=context(job),output=await resultFor(job,c);eligibility(job.client_id,job.agent);
        const refreshed=s.one('SELECT role,active FROM os_users WHERE id=?',requestedBy);if(!refreshed||refreshed.role!=='owner'||!refreshed.active)throw new AppError('Autorizzazione del socio revocata durante il lavoro.',403);
        output.sources=output.sources||c.sources;output.title=output.title||agentMap.get(job.agent).name;output.body=output.body||output.summary;
        s.transaction(()=>{
          if(output.draft) {const contentId='agent-content-'+job.id;s.run('INSERT OR IGNORE INTO os_contents VALUES(?,?,?,?,?,?,?,?,?,?)',contentId,job.client_id,'social',output.title,output.draft,'DA APPROVARE',null,1,output.sources.join('; '),instant());const a=production.requestApproval(robot,s.one('SELECT * FROM os_contents WHERE id=?',contentId));output.revisionInModule=true;output.links={...output.links,view:'work',contentId,approvalId:a.id};event('content.ready',job.client_id,contentId,1);}
          if(job.agent==='reporter')s.run('INSERT INTO os_memory VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(client_id,kind) DO UPDATE SET content=excluded.content,version=os_memory.version+1,source=excluded.source,visibility=\'internal\',updated_at=excluded.updated_at',uid(),job.client_id,'report',output.body,'internal',1,output.sources.join('; '),instant());
          if(output.links?.approvalId)output.revisionInModule=true;
          if(job.agent==='research')for(const leadId of output.links?.leadIds||[])event('lead.created',job.client_id,leadId);
          const saved=outputs.save(job,output,c,robot);output.outputId=saved.outputId;output.approvalId=saved.approvalId;
          s.run("UPDATE os_costs SET status='charged' WHERE id=?",reservation);
          s.run("UPDATE os_jobs SET status='done',result=?,error=NULL,lease_until=NULL,finished_at=? WHERE id=?",JSON.stringify(output),instant(),job.id);
          s.audit(robot,job.client_id,'Agente completato',job.id,{agent:job.agent,costCents:0,sources:output.sources,mode:'DEMO'},job.agent==='administration'?'admin':'internal');
        });return {processed:1,id:job.id,modules};
      }catch(e){if(reservation)s.run("UPDATE os_costs SET status='released' WHERE id=?",reservation);s.run('UPDATE os_jobs SET status=?,error=?,lease_until=NULL,available_at=?,finished_at=? WHERE id=?',job.attempts>=3?'failed':'queued',text(e.message,500),new Date(clock().getTime()+Math.min(600000,job.attempts*30000)).toISOString(),job.attempts>=3?instant():null,job.id);s.audit(robot,job.client_id,'Agente da verificare',job.id,{agent:job.agent,attempt:job.attempts},job.agent==='administration'?'admin':'internal');return {processed:1,failed:true,id:job.id};}
    }finally{ticking=false;}
  }
  function state(user,clientId='demo-bigant') {requireOwner(user);requireClient(s,user,clientId);const moduleJobs=[...(growth?s.query("SELECT 'growth' module,id,workspace client_id,type agent,status,error,created created_at FROM gr_jobs ORDER BY created DESC LIMIT 150"):[]),...(fidelity?s.query("SELECT 'fidelity' module,id,tenant_id client_id,type agent,status,error,created_at FROM fi_jobs ORDER BY created_at DESC LIMIT 150"):[])];return {moduleJobs,moduleErrors:{growth:s.getSetting('module_error_growth')||null,fidelity:s.getSetting('module_error_fidelity')||null},definitions:agentDefinitions.map(a=>({...a,...eligibleAgent(a.id,s.one('SELECT * FROM os_clients WHERE id=?',clientId))})),eventDefinitions,jobs:s.query('SELECT * FROM os_jobs ORDER BY created_at DESC LIMIT 150').map(j=>({...j,input:JSON.parse(j.input),result:j.result?JSON.parse(j.result):null})),schedules:s.query('SELECT * FROM os_schedules'),budget:budget(),paused:s.getSetting('paused')==='true',mode:'Solo DEMO locale',notifications:'Avvisi visibili qui; email e WhatsApp non collegati'};}
  async function handle({method,path,body={},user,clientId}) {
    requireOwner(user);
    if(method==='GET'&&path==='/state')return {data:state(user,clientId)};
    if(method==='POST'&&path==='/run')return {data:enqueue(user,clientId,body.agent,body.input||{},body.dedupe||null),status:201};
    if(method==='POST'&&path==='/tick')return {data:await tick(clientId)};
    if(method==='POST'&&path==='/run-all') {requireClient(s,user,clientId);if(s.getSetting('paused')==='true')throw new AppError('La regia è in pausa.',409);const batch=uid(),c=s.one('SELECT * FROM os_clients WHERE id=?',clientId);return {data:{batch,jobs:s.transaction(()=>agentDefinitions.filter(a=>eligibleAgent(a.id,c).eligible).map(a=>enqueue(user,clientId,a.id,clientId==='demo-bigant'?(specialistDemoInputs[a.id]||{}):{},'trial:'+batch)))},status:201};}
    if(method==='POST'&&path==='/drain') {const limit=integer(body.limit??40,1,50),results=[];for(let i=0;i<limit;i++){const r=await tick(clientId);if(!r.processed){results.push(r);break;}results.push(r);}return {data:{results,processed:results.filter(r=>r.processed).length}};}
    if(method==='POST'&&path==='/events') {return {data:event(body.name,clientId,body.entityId||uid(),body.version||1,body.input||{}),status:201};}
    const out=path.match(/^\/outputs\/([^/]+)(\/revise)?$/);if(out){const row=s.one('SELECT client_id FROM os_agent_outputs WHERE id=?',out[1]);if(!row||row.client_id!==clientId)throw new AppError('Risultato non disponibile per questa attività.',404);if(method==='GET'&&!out[2])return {data:outputs.get(user,out[1])};if(method==='POST'&&out[2])return {data:outputs.revise(user,out[1],body)};}

    if(method==='POST'&&path==='/pause') {s.setSetting('paused',body.paused===true);s.audit(user,null,'Automazioni aggiornate','',{paused:body.paused===true});return {data:{ok:true}};}
    if(method==='POST'&&path==='/budget') {const cap=integer(body.capCents,1,5000),fixed=integer(body.fixedCents,0,cap);if(cap-fixed<budget().usedCents)throw new AppError('Il nuovo limite è inferiore ai costi già impegnati.');s.setSetting('budget_cents',cap);s.setSetting('fixed_cents',fixed);s.audit(user,null,'Budget aggiornato','',{cap,fixed},'admin');return {data:budget()};}
    if(method==='POST'&&path==='/schedules') {requireClient(s,user,clientId);const def=agentMap.get(body.agent);if(def?.status!=='implemented')throw new AppError('Agente non ancora attivo.');const trigger=text(body.trigger,80);eligibility(clientId,body.agent);if(trigger.startsWith('event:')&&!eventDefinitions.some(e=>'event:'+e.id===trigger))throw new AppError('Evento non previsto.');const next=nextRun(trigger,clock()),input=checkedInput(body.input||{});const id=uid();s.transaction(()=>{s.run('INSERT INTO os_schedules VALUES(?,?,?,?,?,?,?,?)',id,clientId,body.agent,trigger,body.enabled===true?1:0,next,1440,null);s.run('INSERT INTO os_schedule_inputs VALUES(?,?)',id,JSON.stringify(input));});s.audit(user,clientId,'Pianificazione creata',id,{agent:body.agent,trigger});return {data:{id,next_at:next},status:201};}
    let m=path.match(/^\/schedules\/([^/]+)$/);if(m&&method==='PATCH'){const row=s.one('SELECT * FROM os_schedules WHERE id=?',m[1]);if(!row||row.client_id!==clientId)throw new AppError('Pianificazione non trovata.',404);if(body.enabled===true)eligibility(clientId,row.agent);s.run('UPDATE os_schedules SET enabled=?,next_at=? WHERE id=?',body.enabled===true?1:0,nextRun(row.trigger,clock()),row.id);s.audit(user,row.client_id,'Pianificazione aggiornata',row.id);return {data:{ok:true}};}
    m=path.match(/^\/jobs\/([^/]+)\/retry$/);if(m&&method==='POST'){const j=s.one("SELECT * FROM os_jobs WHERE id=? AND status='failed'",m[1]);if(!j||j.client_id!==clientId)throw new AppError('Attività non ritentabile.',409);eligibility(clientId,j.agent);s.run("UPDATE os_jobs SET status='queued',attempts=0,available_at=?,error=NULL WHERE id=?",instant(),j.id);s.audit(user,j.client_id,'Nuovo tentativo richiesto',j.id);return {data:{ok:true}};}
    return null;
  }
  return {handle,state,tick,enqueue,event,reserve,budget,nextRun,outputs};
}
