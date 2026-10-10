import {createHash} from 'node:crypto';
import {createApp} from '../../server.js';
import {metaFacebookMetrics,metaInstagramMetrics,metaProfileScopes} from '../../src/meta-profile-provider.js';

export function metaProfilesFixture(t,{enabled=true,real=true,origin='https://os.example',at:newAt}={}){
 if(!real&&origin==='https://os.example')origin='http://127.0.0.1:4460';
 let at=newAt||new Date('2026-10-10T12:00:00Z'),hook=null;
 const env={...(real?{BIGANT_MODALITA:'reale',BIGANT_SOCIO_EMAIL:'socio@fixture.example',BIGANT_SOCIO_PASSWORD_INIZIALE:'password-inventata-fixture-meta'}:{}),BIGANT_SECRET_KEY:Buffer.alloc(32,15).toString('base64'),BIGANT_META_PROFILES_ENABLED:String(enabled)};
 const calls=[],payload={page:{id:'123',name:'Bottega Meta DEMO',instagram_business_account:{id:'456'}},instagram:{id:'456',name:'Bottega Instagram DEMO',username:'bottega_fixture',followers_count:120},after:null};
 const json=data=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
 const fetchImpl=async(input,options)=>{
  const u=new URL(String(input));calls.push({url:u.href,method:options.method});const replacement=await hook?.(u,options);if(replacement!==undefined)return replacement;
  if(u.origin!=='https://graph.facebook.com'||options.method!=='GET')throw Error('Destinazione inattesa');
  if(u.pathname==='/v26.0/me/permissions')return json({data:[...new Set(Object.values(metaProfileScopes).flat())].map(permission=>({permission,status:'granted'}))});
  if(u.pathname==='/v26.0/me/accounts')return json({data:[payload.page],...(payload.after?{paging:{cursors:{after:payload.after},next:'https://unrequested.invalid/'}}:{})});
  if(u.pathname===`/v26.0/${payload.page.id}`)return json({...payload.page,access_token:'page-token-fixture',followers_count:1000});
  if(u.pathname===`/v26.0/${payload.instagram.id}`)return json(payload.instagram);
  if(u.pathname.endsWith('/insights')){
   const ig=u.searchParams.get('metric_type')==='total_value',id=ig?payload.instagram.id:payload.page.id;
   return json({data:(ig?metaInstagramMetrics:metaFacebookMetrics).map((name,index)=>({name,period:'day',id:`${id}/insights/${name}/day`,...(ig?{total_value:{value:index===0?180:0}}:{values:[{end_time:new Date(Number(u.searchParams.get('since'))*1000+86400000).toISOString().replace('.000Z','+0000'),value:index===0?25:0}]})}))});
  }
  throw Error('Endpoint fixture non previsto');
 };
 const app=createApp({origin,env,clock:()=>new Date(at),metaProfileProviderOptions:{fetchImpl}}),store=app.store,runtime=app.metaProfiles;
 const ownerId=real?store.one('SELECT id FROM os_users WHERE email=?',env.BIGANT_SOCIO_EMAIL).id:'demo-owner';
 store.run('UPDATE os_users SET must_change_password=0 WHERE id=?',ownerId);
 for(const [id,role,cid] of [['meta-client','client','demo-bigant'],['meta-collab','collaborator',null]])store.run('INSERT INTO os_users(id,name,email,role,tenant_id,created_at) VALUES(?,?,?,?,?,?)',id,'Persona DEMO',id+'@fixture.example',role,cid,at.toISOString());
 store.run("INSERT INTO os_clients(id,name,slug,services_json,created_at) VALUES('other-client','Altro cliente DEMO','other-client','[\"social\"]',?)",at.toISOString());
 const owner=store.one('SELECT * FROM os_users WHERE id=?',ownerId),client=store.one("SELECT * FROM os_users WHERE id='meta-client'"),collaborator=store.one("SELECT * FROM os_users WHERE id='meta-collab'");
 const sessionKey=id=>'meta-app-'+id,csrf='meta-csrf';
 for(const id of [ownerId,client.id,collaborator.id])store.run('INSERT INTO os_sessions VALUES(?,?,?,?)',createHash('sha256').update(sessionKey(id)).digest('hex'),id,csrf,Math.max(Date.now(),at.getTime())+7*86400000);
 app.connections.save(owner,'meta',{version:0,fields:{accessToken:'user-token-fixture'}});
 const handler=app.server.listeners('request')[0];
 async function request(method,path,body,{user=ownerId,token=csrf,requestOrigin=origin,beforeBody}={}){
  const req={method,url:path,headers:{host:new URL(origin).host,origin:requestOrigin,'content-type':'application/json',...(user?{cookie:'bigant_os='+sessionKey(user),'x-csrf-token':token}:{})},socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){await beforeBody?.();if(body!==undefined)yield Buffer.from(JSON.stringify(body));}};
  const res={status:200,headers:{},headersSent:false,setHeader(k,v){this.headers[k.toLowerCase()]=v;},writeHead(status,headers){this.status=status;this.headersSent=true;for(const[k,v]of Object.entries(headers||{}))this.setHeader(k,v);},end(body){this.body=body?this.headers['content-type']?.startsWith('application/json')?JSON.parse(String(body)):String(body):null;}};
  await handler(req,res);return res;
 }
 const state=(user=owner,id='demo-bigant')=>runtime.state(user,id),path=(action,id='demo-bigant')=>'/api/meta-profiles/'+action+'?clientId='+id;
 async function selection(id='demo-bigant',user=owner){return (await runtime.pages(user,id,{confirmed:true})).items[0].selectionToken;}
 async function configure(id='demo-bigant',channels=['facebook','instagram'],user=owner){return runtime.configure(user,id,{version:state(user,id).version,selectionToken:await selection(id,user),channels,confirmedBusiness:true});}
 const check=(user=owner,id='demo-bigant')=>runtime.check(user,id,{version:state(user,id).version});
 const activate=(daily=false,user=owner,id='demo-bigant')=>runtime.activate(user,id,{version:state(user,id).version,enabled:true,daily,confirmed:true});
 t?.after(()=>app.close());
 return {app,store,runtime,env,fetchImpl,owner,client,collaborator,calls,payload,state,selection,configure,check,activate,request,path,clock:()=>new Date(at),advance:ms=>{at=new Date(at.getTime()+ms);},hook:fn=>{hook=fn;}};
}
