import {confirmFixtureBudget} from './budget-fixture.js';
// Full production composition with an in-memory store and invented provider data.
// No global fetch, account or external service is used by this fixture.
import {createHash} from 'node:crypto';
import {createApp} from '../../server.js';
import {GMAIL_SCOPES,CALENDAR_SCOPES} from '../../src/google-oauth.js';
import {calendarTransport} from './growth-calendar-fixture.js';

export function calendarAppFixture(t){
 const transport=calendarTransport(),providerOptions={fetchImpl:async(url,opts)=>{
  const href=String(url),json=value=>new Response(JSON.stringify(value));
  if(href.endsWith('/token'))return json({access_token:'accesso-inventato',refresh_token:'rinnovo-inventato',token_type:'Bearer',scope:[...GMAIL_SCOPES,...CALENDAR_SCOPES].join(' ')});
  if(href.endsWith('/profile'))return json({emailAddress:'socio@fixture.example'});
  if(href.includes('api.search.brave.com'))return json({web:{results:[{title:'Azienda inventata',url:'https://azienda.example',description:'Informazioni inventate'}]}});
  if(href.includes('api.openai.com')){const b=JSON.parse(opts.body),value=b.text.format.schema.properties.score?{score:70,summary:'Analisi inventata',service:'Video',reason:'Da rivedere'}:{subject:'Proposta inventata',body:'Messaggio inventato da rivedere.',action:'reply',reason:'Decisione del socio'};return json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]});}
  return transport.fetchImpl(url,opts);
 },readWebsite:async url=>({url,text:'Testo inventato',retrievedAt:new Date().toISOString(),simulation:false})};
 const env={BIGANT_MODALITA:'reale',BIGANT_SOCIO_EMAIL:'socio@fixture.example',BIGANT_SOCIO_PASSWORD_INIZIALE:'password-inventata-fixture-calendar',BIGANT_SECRET_KEY:Buffer.alloc(32,11).toString('base64'),BIGANT_GROWTH_EXTERNAL_ENABLED:'true',BIGANT_GROWTH_GMAIL_ENABLED:'true',BIGANT_GROWTH_CALENDAR_ENABLED:'true'};
 const app=createApp({origin:'https://os.example',env,growthProviderOptions:providerOptions});t?.after(()=>app.close());
 const store=app.store,owner={...store.one('SELECT * FROM os_users WHERE email=?',env.BIGANT_SOCIO_EMAIL),session_id:createHash('sha256').update('calendar-app-fixture').digest('hex'),must_change_password:0};
 store.run('UPDATE os_users SET must_change_password=0 WHERE id=?',owner.id);store.run('INSERT INTO os_sessions VALUES(?,?,?,?)',owner.session_id,owner.id,'calendar-csrf',Date.now()+3600000);
 const call=async(method,path,body={})=>(await app.growth.handle({method,path,body,user:owner,clientId:'demo-bigant'})).data;
 const state=()=>app.growth.state('demo-bigant',owner);
 async function prerequisites(){
  confirmFixtureBudget(store,{owner});
  for(const id of ['brave','openai'])app.connections.save(owner,id,{version:0,fields:{apiKey:'chiave-inventata',...(id==='openai'?{model:'modello-inventato'}:{})}});
  app.connections.save(owner,'google',{version:0,fields:{clientId:'client-inventato',clientSecret:'segreto-inventato'}});
  const url=new URL(app.googleAuth.start(owner,{version:1,email:env.BIGANT_SOCIO_EMAIL,acknowledged:true,calendar:true}).url);
  await app.googleAuth.finish(owner,{state:url.searchParams.get('state'),code:'codice-inventato'});
  await call('POST','/runtime/config',{version:0,provider:'openai',searchCents:5,aiCents:25});
  for(const phase of ['research','analysis','drafts']){await call('POST','/runtime/check',{version:state().runtime.version,phase,query:'Prova inventata'});await call('POST','/runtime/activate',{version:state().runtime.version,phase,enabled:true});}
  await call('POST','/settings',{paused:false,senderEmail:env.BIGANT_SOCIO_EMAIL,senderName:'BigAnt Prova',signature:'Team inventato'});
  await call('POST','/mail/check',{version:state().mail.version});await call('POST','/mail/activate',{version:state().mail.version,enabled:true});
 }
 async function enable(){await prerequisites();await call('POST','/calendar/check',{version:state().calendar.version});const p=await call('POST','/calendar/probe-preview');await call('POST','/calendar/probe',{...p,confirmed:true});await call('POST','/calendar/probe-verify',{id:state().calendar.probe.id,received:true});await call('POST','/calendar/activate',{version:state().calendar.version,enabled:true});}
 let sequence=0;
 async function lead(){const n=++sequence,l=await call('POST','/leads',{company:'Azienda inventata '+n,email:`contatto${n}@fixture.example`,source:'Collaudo inventato',notes:'Nota interna riservata'});await call('PATCH','/leads/'+l.id,{consent:'request',consent_proof:'Richiesta di incontro inventata'});return l;}
 const handler=app.server.listeners('request')[0];
 async function request(method,path,body,{authenticated=false,csrf='calendar-csrf',origin='https://os.example'}={}){
  const req={method,url:path,headers:{host:'os.example',origin,'content-type':'application/json',...(authenticated?{cookie:'bigant_os=calendar-app-fixture','x-csrf-token':csrf}:{})},socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){if(body!==undefined)yield Buffer.from(JSON.stringify(body));}};
  const res={status:200,headers:{},headersSent:false,setHeader(k,v){this.headers[k.toLowerCase()]=v;},writeHead(status,headers){this.status=status;this.headersSent=true;for(const[k,v]of Object.entries(headers||{}))this.setHeader(k,v);},end(body){this.body=body?JSON.parse(String(body)):null;}};
  await handler(req,res);return res;
 }
 return {app,store,owner,env,transport,providerOptions,call,state,prerequisites,enable,lead,request};
}
