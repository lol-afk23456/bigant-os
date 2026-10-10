import {confirmFixtureBudget} from './budget-fixture.js';
// Invented data and in-memory database. Every provider request is replaced here.
import {openStore,seedCore} from '../../src/store.js';
import {createConnections} from '../../src/connections.js';
import {createGoogleOAuth,GMAIL_SCOPES} from '../../src/google-oauth.js';
import {createGrowthModule} from '../../src/growth.js';
export function mailFixture(t,{gmailEnabled=true}={}){
 const store=openStore();seedCore(store);confirmFixtureBudget(store);t?.after(()=>store.close());const owner={...store.one("SELECT * FROM os_users WHERE id='demo-owner'"),session_id:'mail-fixture-session'},env={BIGANT_SECRET_KEY:Buffer.alloc(32,9).toString('base64')},connections=createConnections({store,env}),calls=[],control={};
 store.run('INSERT INTO os_sessions VALUES(?,?,?,?)',owner.session_id,owner.id,'csrf-fixture',Date.now()+3600000);
 for(const id of ['brave','openai'])connections.save(owner,id,{version:0,fields:{apiKey:'chiave-inventata',...(id==='brave'?{}:{model:'modello-inventato'})}});
 connections.save(owner,'google',{version:0,fields:{clientId:'client-inventato',clientSecret:'segreto-inventato'}});
 const json=value=>new Response(JSON.stringify(value));
 const fetchImpl=async(url,opts)=>{
  const href=String(url);calls.push({url:href,opts});if(control.before)await control.before(href,opts);
  if(href.endsWith('/token'))return json({access_token:'accesso-inventato',refresh_token:'rinnovo-inventato',token_type:'Bearer',scope:GMAIL_SCOPES.join(' ')});
  if(href.endsWith('/profile'))return json({emailAddress:'mittente@fixture.example'});
  if(href.includes('/threads/'))return json(typeof control.thread==='function'?await control.thread(href):control.thread);
  if(href.endsWith('/messages/send')){if(control.sendFail)throw Error('Timeout finto');const mime=Buffer.from(JSON.parse(opts.body).raw,'base64url').toString(),id=mime.match(/Message-ID: <([^@]+)@growth\.bigantagency\.it>/)[1];return json(control.sendResult||{id:'gmail-'+id,threadId:'thread-'+id});}
  if(href.includes('/messages?')){const id=new URL(href).searchParams.get('q').match(/rfc822msgid:([^@]+)@/)[1];return json({messages:control.found?[{id:'gmail-'+id,threadId:'thread-'+id}]:[],resultSizeEstimate:control.found?1:0});}
  if(href.includes('/messages/gmail-')){const id=new URL(href).pathname.split('/messages/gmail-')[1],intent=store.one("SELECT * FROM gr_mail_intents WHERE status='uncertain' AND message_id=?",id),p=JSON.parse(intent.payload_json);return json({id:'gmail-'+id,threadId:'thread-'+id,labelIds:['SENT'],internalDate:String(Date.now()),payload:{headers:[['Message-ID',`<${p.id}@growth.bigantagency.it>`],['From',p.from],['To',control.to||p.to],['Subject',p.subject]].map(([name,value])=>({name,value}))}});}
  if(href.includes('brave'))return json({web:{results:[{title:'Azienda inventata',url:'https://azienda.example',description:'Descrizione inventata'}]}});
  if(href.includes('api.openai.com')){const b=JSON.parse(opts.body),result=b.text.format.schema.properties.score?{score:70,summary:'Analisi inventata',service:'Video',reason:'Da rivedere'}:{subject:'Confronto su un progetto',body:'Messaggio inventato da rivedere insieme.',action:'reply',reason:'Da approvare'};return json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]});}
  throw Error('Endpoint non previsto dalla fixture');
 };
 const providerOptions={fetchImpl,readWebsite:async url=>({url,text:'Testo inventato',retrievedAt:new Date().toISOString(),simulation:false})};
 const googleAuth=createGoogleOAuth({store,connections,env,origin:'https://os.example',enabled:gmailEnabled,providerOptions});
 const growth=createGrowthModule({store,connections,googleAuth,realMode:true,gmailEnabled,externalEnabled:true,origin:'https://os.example',providerOptions});
 const call=async(method,path,body={},user=owner,w='demo-bigant')=>(await growth.handle({method,path,body,user,clientId:w})).data;
 const state=()=>growth.state('demo-bigant',owner);
 async function enable(){const url=new URL(googleAuth.start(owner,{version:1,email:'mittente@fixture.example',acknowledged:true}).url);await googleAuth.finish(owner,{state:url.searchParams.get('state'),code:'code-fixture'});
  await call('POST','/runtime/config',{version:0,provider:'openai',searchCents:5,aiCents:25});for(const phase of ['research','analysis','drafts']){await call('POST','/runtime/check',{version:state().runtime.version,phase,query:'Prova'});await call('POST','/runtime/activate',{version:state().runtime.version,phase,enabled:true});}
  await call('POST','/settings',{paused:false,senderEmail:'mittente@fixture.example',senderName:'BigAnt Prova',signature:'Team BigAnt · firma inventata'});
  await call('POST','/mail/check',{version:state().mail.version});await call('POST','/mail/activate',{version:state().mail.version,enabled:true});
 }
 let sequence=0;
 async function draft(){const n=++sequence,lead=await call('POST','/leads',{company:'Azienda inventata '+n,email:`destinatario${n}@fixture.example`,source:'Fixture inventata'});await call('PATCH','/leads/'+lead.id,{consent:'marketing',consent_proof:'Consenso inventato per i test'});await call('POST','/jobs',{type:'draft',leadId:lead.id});const job=await call('POST','/jobs/run');if(job.job.status!=='done')throw Error(job.job.error);return state().messages.find(m=>m.lead_id===lead.id);}
 const approve=m=>call('PATCH','/messages/'+m.id,{version:m.approvalVersion,status:'approved'});
 const preview=id=>call('GET','/messages/'+id+'/send-preview');
 const send=p=>call('POST','/messages/'+p.id+'/send',{version:p.version,hash:p.hash,confirmed:true});
 return {store,owner,env,connections,googleAuth,growth,providerOptions,calls,control,call,state,enable,draft,approve,preview,send};
}
