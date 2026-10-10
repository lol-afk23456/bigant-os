import {createHash,randomUUID} from 'node:crypto';
import {createApp} from '../../server.js';
import {createAgentTrials} from '../../src/agent-trials.js';
import {createAgentWork} from '../../src/agent-work.js';
import {confirmFixtureBudget} from './budget-fixture.js';
export const socialOutput=()=>({sintesi:'Proposte interne basate sul brief inventato.',mese:'2026-10',pilastri:['Laboratorio'],piano:[],post:[{id:'p1',canale:'Instagram',formato:'Post',titolo:'Il laboratorio DEMO',testo:'Scopri il laboratorio creativo di prova.',cta:'Leggi la proposta',brief_visivo:'Foto inventata del laboratorio',data_proposta:'2026-10-15'}],da_verificare:['Immagini e tono da approvare'],fonti_usate:['Brief inventato']});
export const socialReply=(out=socialOutput())=>new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(out)}]}]}));
export async function agentWorkFixture(t,{real=true,activate=true,fetchImpl,trialFetchImpl=async()=>socialReply(),port=4342}={}){
 const env={BIGANT_SECRET_KEY:Buffer.alloc(32,11).toString('base64'),...(real?{BIGANT_MODALITA:'reale',BIGANT_SOCIO_EMAIL:'socio@fixture.test',BIGANT_SOCIO_PASSWORD_INIZIALE:'password-fixture-inventata',BIGANT_SCIAME_AI_TRIALS_ENABLED:'true',BIGANT_SCIAME_AI_ENABLED:'true'}:{})};
 const origin=real?'https://fixture.test':`http://127.0.0.1:${port}`;let calls=0,lastRequest;
 const transport=async(url,options)=>{calls++;lastRequest={url,...options,body:JSON.parse(options.body)};return fetchImpl?fetchImpl(url,options):socialReply();};
 const app=createApp({env,origin,agentTrialProviderOptions:{fetchImpl:trialFetchImpl},agentWorkProviderOptions:{fetchImpl:transport}}),s=app.store;
 const owner=s.one("SELECT * FROM os_users WHERE role='owner' AND id<>'os-orchestrator' LIMIT 1");s.run('UPDATE os_users SET must_change_password=0 WHERE id=?',owner.id);owner.must_change_password=0;
 for(const [id,name] of [['fixture-orange','Laboratorio Arancio DEMO'],['fixture-blue','Laboratorio Blu DEMO']])s.run('INSERT INTO os_clients(id,name,slug,services_json,created_at) VALUES(?,?,?,?,?)',id,name,id,'["social"]',new Date().toISOString());
 for(const [id,role] of [['fixture-collaborator','collaborator'],['fixture-client','client']])s.run('INSERT INTO os_users(id,tenant_id,name,email,role,created_at) VALUES(?,?,?,?,?,?)',id,role==='client'?'fixture-orange':null,id,id+'@fixture.test',role,new Date().toISOString());
 s.run('INSERT INTO os_assignments VALUES(?,?)','fixture-collaborator','fixture-orange');
 app.production.saveMemory(owner,'fixture-orange','master','Laboratorio di creatività inventato. Tono semplice.','Brief inventato');app.production.saveMemory(owner,'fixture-blue','master','NON INVIARE: secondo cliente inventato.','Fonte secondo cliente');
 s.run('INSERT INTO os_memory VALUES(?,?,?,?,?,?,?,?)','fixture-private','fixture-orange','report','ECONOMIA RISERVATA INVENTATA','admin',1,'Fonte amministrativa',new Date().toISOString());
 app.connections.save(owner,'openai',{version:0,fields:{apiKey:'chiave-finta-operativa',model:'modello-simulato'}});
 const c=app.agentConfig.entry('social').config;app.agentConfig.save(owner,'social',{...c,task:'Prepara bozze social dal brief',instructions:'Scrivi soltanto bozze basate sulle fonti autorizzate.',sources:'Brief e DNA autorizzati',quality:'Verifica le fonti; non pubblicare.',provider:'openai',estimatedCents:40});confirmFixtureBudget(s,{owner});
 if(!real){Object.assign(app.agentTrials,createAgentTrials({store:s,connections:app.connections,costControl:app.costControl,reserve:app.orchestrator.reserve,configFor:id=>app.agentConfig.entry(id).config,enabled:()=>true,providerOptions:{fetchImpl:trialFetchImpl}}));Object.assign(app.agentWork,createAgentWork({store:s,connections:app.connections,trials:app.agentTrials,configFor:id=>app.agentConfig.entry(id).config,orchestrator:app.orchestrator,production:app.production,enabled:()=>true,providerOptions:{fetchImpl:transport}}));}
 await app.agentTrials.check(owner,'social',{version:1,connectionVersion:1,requestId:randomUUID(),confirmed:true});
 const authorization=()=>{const row=app.agentConfig.entry('social');return {enabled:true,confirmed:true,version:row.config.version,connectionVersion:row.operational.connectionVersion,trialId:row.operational.trialId,authorizationVersion:row.operational.authorizationVersion};};
 if(activate)app.agentWork.authorize(owner,'social',authorization());
 const preview=(client='fixture-orange')=>app.agentWork.preview(owner,client,'social','Prepara una bozza sul laboratorio.');
 const body=(p=preview())=>({brief:p.context.brief,fingerprint:p.fingerprint,requestId:randomUUID(),confirmed:true});
 const run=b=>app.agentWork.run(owner,'fixture-orange','social',b||body());
 const handler=app.server.listeners('request')[0];for(const id of [owner.id,'fixture-collaborator','fixture-client'])s.run('INSERT INTO os_sessions VALUES(?,?,?,?)',createHash('sha256').update('cookie-'+id).digest('hex'),id,'csrf',Date.now()+3600000);
 async function request(method,path,body,{id=owner.id,csrf='csrf'}={}){const req={method,url:path,headers:{host:new URL(origin).host,origin,'content-type':'application/json','x-csrf-token':csrf,...(id?{cookie:'bigant_os=cookie-'+id}:{})},socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){if(body)yield Buffer.from(JSON.stringify(body));}};const res={status:200,setHeader(){},writeHead(n){this.status=n;},end(b){this.body=JSON.parse(String(b));}};await handler(req,res);return res;}
 t?.after(()=>app.close());return {app,s,env,owner,authorization,preview,body,run,request,get calls(){return calls;},get lastRequest(){return lastRequest;}};
}
