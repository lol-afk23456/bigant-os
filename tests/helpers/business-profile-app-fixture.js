// In-memory full application, invented credentials and strict fake Google transport.
import {createHash} from 'node:crypto';
import {createApp} from '../../server.js';

export function businessProfileAppFixture(t, {enabled=true, real=true}={}) {
  let at=new Date('2026-10-10T12:00:00Z');
  const origin=real?'https://os.example':'http://127.0.0.1:4330',calls=[];
  const env={...(real?{BIGANT_MODALITA:'reale',BIGANT_SOCIO_EMAIL:'socio@fixture.example',BIGANT_SOCIO_PASSWORD_INIZIALE:'password-inventata-fixture-gbp'}:{}),BIGANT_SECRET_KEY:Buffer.alloc(32,12).toString('base64'),BIGANT_GBP_ENABLED:enabled?'true':'false'};
  const location={name:'locations/456',title:'Officina Inventata DEMO',storefrontAddress:{regionCode:'IT',postalCode:'00100',locality:'Roma',addressLines:['Via Inventata 1']},metadata:{mapsUri:'https://maps.google.com/?cid=456'}};
  const reviews={reviews:[{reviewId:'recensione-inventata',reviewer:{displayName:'Recensore DEMO'},starRating:'FIVE',comment:'Recensione inventata per il collaudo locale.',createTime:'2026-10-06T10:00:00Z',updateTime:'2026-10-06T10:00:00Z'}],averageRating:5,totalReviewCount:1};
  const performance={multiDailyMetricTimeSeries:[{dailyMetricTimeSeries:[{dailyMetric:'WEBSITE_CLICKS',timeSeries:{datedValues:[{date:{year:2026,month:10,day:7},value:'12'}]}},{dailyMetric:'CALL_CLICKS',timeSeries:{datedValues:[{date:{year:2026,month:10,day:7},value:'0'}]}}]}]};
  let failure=null;
  const fetchImpl=async(input,options={})=>{
    const url=new URL(String(input));calls.push({url:url.href,method:options.method||'GET'});
    if(failure&&url.hostname===failure.host)return new Response(JSON.stringify({error:'dettaglio-riservato-da-non-mostrare'}),{status:failure.status});
    const json=data=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
    if(url.href==='https://oauth2.googleapis.com/token')return json({access_token:'accesso-gbp-inventato',refresh_token:'rinnovo-gbp-inventato',expires_in:3600,token_type:'Bearer',scope:'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/business.manage'});
    if(url.href==='https://openidconnect.googleapis.com/v1/userinfo')return json({sub:'identita-gbp-inventata',email:env.BIGANT_SOCIO_EMAIL,email_verified:true});
    if((options.method||'GET')!=='GET')throw Error('Mutazione Google Business non prevista');
    if(url.hostname==='mybusinessaccountmanagement.googleapis.com'&&url.pathname==='/v1/accounts')return json({accounts:[{name:'accounts/123',accountName:'Account Inventato DEMO',type:'LOCATION_GROUP'}]});
    if(url.hostname==='mybusinessbusinessinformation.googleapis.com'&&url.pathname==='/v1/accounts/123/locations')return json({locations:[location]});
    if(url.hostname==='mybusinessbusinessinformation.googleapis.com'&&url.pathname==='/v1/locations/456')return json(location);
    if(url.hostname==='mybusiness.googleapis.com'&&url.pathname==='/v4/accounts/123/locations/456/reviews')return json(reviews);
    if(url.hostname==='businessprofileperformance.googleapis.com'&&url.pathname==='/v1/locations/456:fetchMultiDailyMetricsTimeSeries')return json(performance);
    throw Error('Endpoint imprevisto nella fixture GBP');
  };
  const app=createApp({origin,env,clock:()=>new Date(at),businessProfileProviderOptions:{fetchImpl}});
  t?.after(()=>app.close());
  const store=app.store,ownerId=real?store.one('SELECT id FROM os_users WHERE email=?',env.BIGANT_SOCIO_EMAIL).id:'demo-owner';
  store.run('UPDATE os_users SET must_change_password=0 WHERE id=?',ownerId);
  const sessionKey=id=>'gbp-app-'+id,csrf='gbp-csrf';
  // Keep fixture sessions valid against both the HTTP wall clock and the advanced
  // domain clock. Session expiration itself is covered by OAuth/runtime tests.
  function addSession(id){store.run('INSERT INTO os_sessions VALUES(?,?,?,?)',createHash('sha256').update(sessionKey(id)).digest('hex'),id,csrf,Math.max(Date.now(),at.getTime())+7*86400000);}
  addSession(ownerId);
  const owner={...store.one('SELECT * FROM os_users WHERE id=?',ownerId),session_id:createHash('sha256').update(sessionKey(ownerId)).digest('hex')};
  const handler=app.server.listeners('request')[0];
  async function request(method,path,body,{user=ownerId,token=csrf,requestOrigin=origin}={}){
    const req={method,url:path,headers:{host:new URL(origin).host,origin:requestOrigin,'content-type':'application/json',...(user?{cookie:'bigant_os='+sessionKey(user),'x-csrf-token':token}:{})},socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){if(body!==undefined)yield Buffer.from(JSON.stringify(body));}};
    const res={status:200,headers:{},headersSent:false,setHeader(k,v){this.headers[k.toLowerCase()]=v;},writeHead(status,headers){this.status=status;this.headersSent=true;for(const[k,v]of Object.entries(headers||{}))this.setHeader(k,v);},end(body){this.body=body?this.headers['content-type']?.startsWith('application/json')?JSON.parse(String(body)):String(body):null;}};
    await handler(req,res);return res;
  }
  async function authorize(){
    let result=await request('POST','/api/connections/gbp',{version:0,fields:{clientId:'client-gbp-inventato',clientSecret:'segreto-gbp-inventato'}});
    if(result.status!==200)throw Error('Fixture GBP: salvataggio fallito '+result.body?.error);
    result=await request('POST','/api/connections/gbp/oauth/start',{version:1,email:env.BIGANT_SOCIO_EMAIL,acknowledged:true});
    if(result.status!==200)throw Error('Fixture GBP: consenso fallito '+result.body?.error);
    result=await request('POST','/api/connections/gbp/oauth/finish',{state:new URL(result.body.url).searchParams.get('state'),code:'codice-inventato'});
    if(result.status!==200)throw Error('Fixture GBP: callback fallito '+result.body?.error);
    return result.body;
  }
  const path=(action,client='demo-bigant')=>'/api/business-profile/'+action+'?clientId='+client;
  const state=async(client)=>(await request('GET',path('state',client))).body;
  async function select(client='demo-bigant'){
    const accounts=await request('POST',path('accounts',client),{});
    if(accounts.status!==200)throw Error('Fixture GBP accounts: '+accounts.body?.error);
    const locations=await request('POST',path('locations',client),{accountName:accounts.body.items[0].name});
    if(locations.status!==200)throw Error('Fixture GBP locations: '+locations.body?.error);
    return request('POST',path('configure',client),{version:(await state(client)).version,selectionToken:locations.body.items[0].selectionToken,confirmedBusiness:true});
  }
  return {app,store,owner,ownerId,env,origin,calls,location,reviews,performance,request,authorize,select,state,path,addSession,advance:milliseconds=>{at=new Date(at.getTime()+milliseconds);},fail:value=>{failure=value;}};
}
