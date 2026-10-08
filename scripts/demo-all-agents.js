import {createApp} from '../server.js';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

// Archive isolated in memory. These explicit DEMO permissions never touch a saved archive.
export async function runAllAgentsDemo() {
 const app=createApp(),s=app.store,owner=s.one("SELECT * FROM os_users WHERE id='demo-owner'");
 try {
  await app.growth.handle({method:'POST',path:'/settings',body:{paused:false},user:owner,clientId:'demo-bigant'});
  const lead=s.one("SELECT id FROM gr_leads WHERE workspace='demo-bigant' ORDER BY created,id LIMIT 1");
  await app.growth.handle({method:'PATCH',path:'/leads/'+lead.id,body:{consent:'marketing',consent_proof:'Fixture isolata DEMO: permesso inventato esclusivamente per il collaudo'},user:owner,clientId:'demo-bigant'});
  await app.fidelity.handle({method:'PATCH',path:'/members/fi-demo-bigant-member',body:{marketingConsent:true},user:owner,clientId:'demo-bigant'});
  const {data:{jobs}}=await app.orchestrator.handle({method:'POST',path:'/run-all',user:owner,clientId:'demo-bigant'});
  await app.orchestrator.handle({method:'POST',path:'/drain',body:{limit:40},user:owner,clientId:'demo-bigant'});
  const results=jobs.map(job=>{
   const saved=s.one('SELECT * FROM os_jobs WHERE id=?',job.id),result=JSON.parse(saved.result||'null');
   const output=result?.outputId?app.orchestrator.outputs.get(owner,result.outputId):null;
   return {agent:job.agent,status:saved.status,error:saved.error,output:output?.title,bodyLength:output?.body?.length||0,needsInput:output?.status==='needs_input',approvalId:output?.approvalId,sources:output?.sources?.length||0};
  });
  const external={mail:s.one('SELECT count(*) n FROM gr_demo_mail').n,calendar:s.one('SELECT count(*) n FROM gr_demo_calendar').n,fidelity:s.one('SELECT count(*) n FROM fi_deliveries WHERE sent_at IS NOT NULL').n,costCents:s.one('SELECT coalesce(sum(cents),0) n FROM os_costs').n};
  const outputs=s.one('SELECT count(*) n FROM os_agent_outputs').n;
  return {ok:results.length===32&&results.every(r=>r.status==='done'&&!r.needsInput&&r.bodyLength>60&&r.approvalId&&r.sources>0)&&outputs===32&&Object.values(external).every(n=>n===0),mode:'DEMO offline · database temporaneo in memoria',results,outputs,external};
 } finally {await app.close();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const report=await runAllAgentsDemo();
 for(const row of report.results)console.info(`${row.status==='done'&&!row.needsInput?'OK':'ERRORE'} · ${row.agent} · ${row.output||row.error} · ${row.bodyLength} caratteri`);
 console.info(JSON.stringify({ok:report.ok,mode:report.mode,outputs:report.outputs,external:report.external}));
 if(!report.ok)process.exitCode=1;
}
