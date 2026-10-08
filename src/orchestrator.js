import {uid,now,text,integer,AppError,requireOwner,requireClient} from './store.js';
import {agentDefinitions} from './registry.js';
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
  function budget() {const used=s.one("SELECT COALESCE(SUM(cents),0) n FROM os_costs WHERE month=? AND status IN('reserved','charged')",month()).n;const cap=Number(s.getSetting('budget_cents')),fixed=Number(s.getSetting('fixed_cents'));return {capCents:cap,fixedCents:fixed,usedCents:used,availableCents:Math.max(0,cap-fixed-used),month:month(),simulation:true};}
  function reserve(clientId,agent,cents) {integer(cents);return s.transaction(()=>{const b=budget();if(cents>b.availableCents)throw new AppError('Budget disponibile esaurito. Attività in attesa.',409);const id=uid();s.run('INSERT INTO os_costs VALUES(?,?,?,?,?,?,?)',id,clientId,agent,cents,'reserved',month(),instant());return id;});}
  function enqueue(user,clientId,agent,input={},dedupe=null) {
    requireOwner(user);requireClient(s,user,clientId);const def=agentMap.get(agent);
    if(!def||def.status!=='implemented')throw new AppError('Questo specialista è predisposto: usa il modulo indicato o completa prima la sua attivazione.',409);
    const id=uid();s.run('INSERT OR IGNORE INTO os_jobs(id,client_id,agent,input,status,available_at,dedupe,created_at) VALUES(?,?,?,?,?,?,?,?)',id,clientId,agent,JSON.stringify({requestedBy:user.id,...input}),'queued',instant(),dedupe,instant());
    const job=s.one('SELECT * FROM os_jobs WHERE id=?',id)||s.one('SELECT * FROM os_jobs WHERE dedupe=?',dedupe);if(job.id===id)s.audit(user,clientId,'Agente accodato',id,{agent,mode:'DEMO',source:'Playbook'});return job;
  }
  const robot={id:'os-orchestrator',role:'owner',name:'Orchestratore DEMO',active:1};
  function context(job) {
    const client=s.one('SELECT id,name,services_json FROM os_clients WHERE id=?',job.client_id);
    const memory=s.query("SELECT kind,content,version,source FROM os_memory WHERE client_id=? AND visibility!='admin' AND kind IN('master','dna','strategy','feedback','report')",job.client_id);
    const tasks=s.query('SELECT id,title,status,due,estimate_minutes,actual_minutes FROM os_tasks WHERE client_id=?',job.client_id);
    const contents=s.query('SELECT id,title,state,source,version FROM os_contents WHERE client_id=?',job.client_id);
    return {client,memory,tasks,contents,sources:memory.map(m=>`Memoria ${m.kind} v${m.version} · ${m.source}`),simulation:true};
  }
  function resultFor(job,c) {
    const pending=c.tasks.filter(t=>t.status!=='done');
    const late=pending.filter(t=>t.due&&t.due<instant());
    const base={mode:'Regole locali DEMO: nessun modello AI collegato',costCents:0,sources:[...c.sources,'Task e contenuti del database DEMO']};
    if(testHandlers[job.agent])return testHandlers[job.agent](c);
    switch(job.agent) {
      case 'account': return {...base,title:'Controllo consegne',summary:`${pending.length} lavori aperti, ${late.length} oltre scadenza, ${c.contents.filter(x=>x.state==='DA APPROVARE').length} contenuti da approvare.`,priorities:late.slice(0,3).map(t=>t.title)};
      case 'director': {
        // Soltanto aggregati esplicitamente selezionati: nessuna riga di prima nota nel contesto del direttore.
        const clients=s.one('SELECT COUNT(*) n FROM os_clients WHERE active=1').n;
        return {...base,title:'Tre priorità per la settimana',summary:`${clients} attività DEMO nel sistema. Le fonti di mercato e le metriche dei canali sono scollegate.`,priorities:['Confermare saldi e anagrafiche delle due ditte nel pilota autorizzato',late.length?'Chiudere le consegne oltre scadenza':'Completare il piano contenuti del cliente zero','Verificare margine e capacità prima di attivare un nuovo servizio']};
      }
      case 'marketing': return {...base,title:'Prossimo passo marketing BigAnt',summary:'Preparare un caso studio solo dopo autorizzazione portfolio e verifica dei dati.',priorities:['Brief → DNA → bozza → approvazione del socio'],unsupported:'Risultati reali dei canali non disponibili'};
      case 'reporter': return {...base,title:'Report operativo DEMO',summary:`${c.tasks.length} lavori e ${c.contents.length} contenuti registrati. ${c.tasks.filter(t=>t.status==='done').length} lavori completati. Google, social e campagne non collegati: nessun risultato commerciale reale è disponibile.`};
      case 'quality': return {...base,title:'Verifica delle bozze',summary:'Controllo automatico limitato a presenza delle fonti e stato approvazioni; non è una validazione legale o creativa.',findings:c.contents.filter(x=>!x.source||x.state==='DA APPROVARE').map(x=>({id:x.id,reason:!x.source?'Fonte mancante':'Approvatore umano necessario'}))};
      case 'social': {
        if(!JSON.parse(c.client.services_json).includes('social'))throw new AppError('Servizio social non attivo per questa attività.');
        const feedback=c.memory.find(m=>m.kind==='feedback')?.content||'Nessuna correzione ancora registrata.';
        return {...base,title:`Una storia di ${c.client.name}`,summary:'Bozza dimostrativa creata; attende revisione.',draft:`DEMO · Una giornata dietro le quinte di ${c.client.name}.\nRaccontiamo il metodo e le persone, senza inventare prezzi, risultati o testimonianze.\n\nIndicazioni da verificare prima della revisione:\n${feedback}`};
      }
      case 'administration': {const anomalies=administration.analyze(robot,{asOf:instant().slice(0,10)});return {...base,title:'Controllo amministrativo DEMO',summary:'Controllo eseguito. Nessun movimento è stato corretto.',result:anomalies,sources:['Prima nota e documenti DEMO'],visibility:'admin'};}
      default: throw new AppError('Specialista non implementato.');
    }
  }
  function schedule() {
    for(const row of s.query('SELECT * FROM os_schedules WHERE enabled=1 AND next_at<=?',instant())) {
      const def=agentMap.get(row.agent);if(def?.status!=='implemented')continue;
      if(!s.one('SELECT id FROM os_clients WHERE id=? AND active=1',row.client_id)){s.run('UPDATE os_schedules SET enabled=0 WHERE id=?',row.id);s.audit(robot,row.client_id,'Pianificazione sospesa',row.id,{reason:'Attività disattivata'});continue;}
      s.transaction(()=>{enqueue(robot,row.client_id,row.agent,{},`schedule:${row.id}:${row.next_at}`);s.run('UPDATE os_schedules SET last_at=?,next_at=? WHERE id=?',instant(),nextRun(row.trigger,clock()),row.id);});
    }
  }
  function event(name,clientId,entityId,version=1) {for(const row of s.query('SELECT * FROM os_schedules WHERE enabled=1 AND trigger=? AND client_id=?','event:'+name,clientId))enqueue(robot,clientId,row.agent,{entityId},`event:${row.id}:${entityId}:${version}`);}
  async function tickModules() {
    const results=[];
    if(growth)try {results.push({module:'growth',...(await growth.engine.tick())});s.setSetting('module_error_growth','');}catch(e){s.setSetting('module_error_growth',text(e.message,300));results.push({module:'growth',error:true});}
    if(fidelity)for(const c of s.query('SELECT id,services_json FROM os_clients WHERE active=1'))if(JSON.parse(c.services_json).includes('fidelity'))try {const r=fidelity.tick(c.id,robot);s.setSetting('module_error_fidelity','');if(r.prepared.length)results.push({module:'fidelity',clientId:c.id,prepared:r.prepared.length});}catch(e){s.setSetting('module_error_fidelity',text(e.message,300));results.push({module:'fidelity',clientId:c.id,error:true});}
    return results;
  }
  async function tick() {
    if(ticking||s.getSetting('paused')==='true')return {processed:0};ticking=true;
    try {
      s.run("UPDATE os_jobs SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'queued' END,lease_until=NULL,error='Esecuzione interrotta: ripresa automatica controllata' WHERE status='running' AND lease_until<?",instant());
      schedule();
      const modules=await tickModules();
      const job=s.transaction(()=>{const j=s.one("SELECT * FROM os_jobs WHERE status='queued' AND available_at<=? ORDER BY created_at LIMIT 1",instant());if(!j)return null;const changed=s.run("UPDATE os_jobs SET status='running',attempts=attempts+1,lease_until=? WHERE id=? AND status='queued'",new Date(clock().getTime()+120000).toISOString(),j.id).changes;return changed?{...j,attempts:j.attempts+1}:null;});
      if(!job)return {processed:0,modules};
      if(!s.one('SELECT id FROM os_clients WHERE id=? AND active=1',job.client_id)){s.run("UPDATE os_jobs SET status='cancelled',error='Attività disattivata',finished_at=? WHERE id=?",instant(),job.id);return {processed:1,cancelled:true};}
      let reservation;
      try {
        reservation=reserve(job.client_id,job.agent,0);
        s.transaction(()=>{
          const output=resultFor(job,context(job));
          if(output.draft) {const contentId='agent-content-'+job.id;s.run('INSERT OR IGNORE INTO os_contents VALUES(?,?,?,?,?,?,?,?,?,?)',contentId,job.client_id,'social',output.title,output.draft,'DA APPROVARE',null,1,output.sources.join('; '),instant());production.requestApproval(robot,s.one('SELECT * FROM os_contents WHERE id=?',contentId));}
          if(job.agent==='reporter')s.run('INSERT INTO os_memory VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(client_id,kind) DO UPDATE SET content=excluded.content,version=os_memory.version+1,source=excluded.source,visibility=\'internal\',updated_at=excluded.updated_at',uid(),job.client_id,'report',`# ${output.title}\n\n${output.summary}`,'internal',1,output.sources.join('; '),instant());
          s.run("UPDATE os_costs SET status='charged' WHERE id=?",reservation);
          s.run("UPDATE os_jobs SET status='done',result=?,error=NULL,lease_until=NULL,finished_at=? WHERE id=?",JSON.stringify(output),instant(),job.id);
          s.audit(robot,job.client_id,'Agente completato',job.id,{agent:job.agent,costCents:0,sources:output.sources,mode:'DEMO'},job.agent==='administration'?'admin':'internal');
        });return {processed:1,id:job.id,modules};
      }catch(e){if(reservation)s.run("UPDATE os_costs SET status='released' WHERE id=?",reservation);s.run('UPDATE os_jobs SET status=?,error=?,lease_until=NULL,available_at=?,finished_at=? WHERE id=?',job.attempts>=3?'failed':'queued',text(e.message,500),new Date(clock().getTime()+Math.min(600000,job.attempts*30000)).toISOString(),job.attempts>=3?instant():null,job.id);s.audit(robot,job.client_id,'Agente da verificare',job.id,{agent:job.agent,attempt:job.attempts},job.agent==='administration'?'admin':'internal');return {processed:1,failed:true,id:job.id};}
    }finally{ticking=false;}
  }
  function state(user) {requireOwner(user);const moduleJobs=[...(growth?s.query("SELECT 'growth' module,id,workspace client_id,type agent,status,error,created created_at FROM gr_jobs ORDER BY created DESC LIMIT 150"):[]),...(fidelity?s.query("SELECT 'fidelity' module,id,tenant_id client_id,type agent,status,error,created_at FROM fi_jobs ORDER BY created_at DESC LIMIT 150"):[])];return {moduleJobs,moduleErrors:{growth:s.getSetting('module_error_growth')||null,fidelity:s.getSetting('module_error_fidelity')||null},definitions:agentDefinitions,jobs:s.query('SELECT * FROM os_jobs ORDER BY created_at DESC LIMIT 150').map(j=>({...j,input:JSON.parse(j.input),result:j.result?JSON.parse(j.result):null})),schedules:s.query('SELECT * FROM os_schedules'),budget:budget(),paused:s.getSetting('paused')==='true',mode:'Solo DEMO locale',notifications:'Avvisi visibili qui; email e WhatsApp non collegati'};}
  async function handle({method,path,body={},user,clientId}) {
    requireOwner(user);
    if(method==='GET'&&path==='/state')return {data:state(user)};
    if(method==='POST'&&path==='/run')return {data:enqueue(user,clientId,body.agent,{},body.dedupe||null),status:201};
    if(method==='POST'&&path==='/tick')return {data:await tick()};
    if(method==='POST'&&path==='/pause') {s.setSetting('paused',body.paused===true);s.audit(user,null,'Automazioni aggiornate','',{paused:body.paused===true});return {data:{ok:true}};}
    if(method==='POST'&&path==='/budget') {const cap=integer(body.capCents,1,5000),fixed=integer(body.fixedCents,0,cap);if(cap-fixed<budget().usedCents)throw new AppError('Il nuovo limite è inferiore ai costi già impegnati.');s.setSetting('budget_cents',cap);s.setSetting('fixed_cents',fixed);s.audit(user,null,'Budget aggiornato','',{cap,fixed},'admin');return {data:budget()};}
    if(method==='POST'&&path==='/schedules') {requireClient(s,user,clientId);const def=agentMap.get(body.agent);if(def?.status!=='implemented')throw new AppError('Agente non ancora attivo.');const trigger=text(body.trigger,80);if(trigger.startsWith('event:')&&!['event:content.ready','event:lead.created','event:client.created'].includes(trigger))throw new AppError('Evento non previsto.');const next=nextRun(trigger,clock());const id=uid();s.run('INSERT INTO os_schedules VALUES(?,?,?,?,?,?,?,?)',id,clientId,body.agent,trigger,body.enabled===true?1:0,next,1440,null);s.audit(user,clientId,'Pianificazione creata',id,{agent:body.agent,trigger});return {data:{id,next_at:next},status:201};}
    let m=path.match(/^\/schedules\/([^/]+)$/);if(m&&method==='PATCH'){const row=s.one('SELECT * FROM os_schedules WHERE id=?',m[1]);if(!row)throw new AppError('Pianificazione non trovata.',404);s.run('UPDATE os_schedules SET enabled=?,next_at=? WHERE id=?',body.enabled===true?1:0,nextRun(row.trigger,clock()),row.id);s.audit(user,row.client_id,'Pianificazione aggiornata',row.id);return {data:{ok:true}};}
    m=path.match(/^\/jobs\/([^/]+)\/retry$/);if(m&&method==='POST'){const j=s.one("SELECT * FROM os_jobs WHERE id=? AND status='failed'",m[1]);if(!j)throw new AppError('Attività non ritentabile.',409);s.run("UPDATE os_jobs SET status='queued',attempts=0,available_at=?,error=NULL WHERE id=?",instant(),j.id);s.audit(user,j.client_id,'Nuovo tentativo richiesto',j.id);return {data:{ok:true}};}
    return null;
  }
  return {handle,state,tick,enqueue,event,reserve,budget,nextRun};
}
