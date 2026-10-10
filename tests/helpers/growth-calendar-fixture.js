// All identities, events and credentials are invented; the transport never uses
// fetch. A supplied in-memory store belongs to the caller and is not closed here.
import {openStore,seedCore} from '../../src/store.js';
import {growthStore} from '../../src/growth-store.js';
import {createLead,updateLead} from '../../src/growth-domain.js';
import {createGrowthCalendar} from '../../src/growth-calendar.js';

export function calendarTransport(control={},calls=[],events=new Map()){
 const json=(body,status=200)=>new Response(JSON.stringify(body),{status});
 const fetchImpl=async(url,opts={})=>{
  const href=String(url);calls.push({url:href,opts});await control.before?.(href,opts);
  if(href.endsWith('/token'))return json({access_token:'accesso-calendar-inventato'});
  const u=new URL(href);let result;
  if(u.pathname==='/calendar/v3/freeBusy'){
   const b=JSON.parse(opts.body),id=b.items[0].id;
   if(control.busyError)return json({calendars:{[id]:{errors:[{reason:'notFound'}]}}});
   const busy=[...events.entries()].filter(([key,e])=>key.startsWith(id+'|')&&e.status!=='cancelled'&&Date.parse(e.start.dateTime)<Date.parse(b.timeMax)&&Date.parse(e.end.dateTime)>Date.parse(b.timeMin)).map(([,e])=>({start:e.start.dateTime,end:e.end.dateTime}));
   result={calendars:{[id]:{busy:[...busy,...(control.extraBusy||[])]}}};
  }else{
   const match=u.pathname.match(/^\/calendar\/v3\/calendars\/([^/]+)\/events(?:\/([^/]+))?$/);if(!match)throw Error('Endpoint non previsto dalla fixture Calendar');const calendar=decodeURIComponent(match[1]),id=match[2],key=calendar+'|'+id;
   if(opts.method==='POST'){
    const b=JSON.parse(opts.body),eventKey=calendar+'|'+b.id;if(events.has(eventKey))return json({error:'duplicate'},409);
    if(control.insertFail==='before')throw Error('Timeout Calendar inventato prima del salvataggio');
    result={...b,status:'confirmed',etag:'"evento-'+(events.size+1)+'"',htmlLink:'https://calendar.google.com/calendar/event?eid=fixture'};events.set(eventKey,structuredClone(result));
    if(control.insertFail==='after')throw Error('Timeout Calendar inventato dopo il salvataggio');
    if(control.insertResult)result=typeof control.insertResult==='function'?control.insertResult(result):control.insertResult;
   }else if(opts.method==='DELETE'){
    const current=events.get(key);if(!current)return json({error:'notFound'},404);if(opts.headers?.['If-Match']!==current.etag)return json({error:'precondition'},412);
    if(control.deleteFail==='before')throw Error('Timeout annullamento inventato');events.set(key,{id,status:'cancelled'});
    if(control.deleteFail==='after')throw Error('Timeout dopo annullamento inventato');result={};
   }else{
    const current=events.get(key);if(!current||control.missing)return json({error:'notFound'},404);result=structuredClone(current);if(control.eventPatch)result=control.eventPatch(result);
   }
  }
  await control.after?.(href,opts,result);return json(result);
 };
 return {fetchImpl,calls,events,control};
}

export function calendarFixture(t,{store:provided,workspace='demo-bigant',enabled=true,now='2026-10-12T06:00:00.000Z'}={}){
 const store=provided||openStore();if(!provided){seedCore(store);t?.after(()=>store.close());}
 const owner=store.one("SELECT * FROM os_users WHERE id='demo-owner'")||store.one("SELECT * FROM os_users WHERE role='owner' AND active=1"),s=growthStore(store,()=>owner,{realMode:true});
 s.workspace(workspace);s.saveSettings(workspace,{paused:false,senderEmail:'socio@fixture.example'});
 const control={enabled,now,deliveryReady:true,deliveryVersion:1,mailEnabled:true,googleConnected:true,calendarConnected:true,googleVersion:1,email:'socio@fixture.example',credentials:0},transport=calendarTransport(control);
 const runtime={deliveryContext:()=>({ready:control.deliveryReady&&!s.settings(workspace).paused,fingerprint:'delivery-'+control.deliveryVersion})},mail={progress:()=>({enabled:control.mailEnabled})};
 const googleAuth={state:()=>({connected:control.googleConnected,calendarConnected:control.calendarConnected,version:control.googleVersion,email:control.email}),credentials:(_user,version,options)=>{if(version!==control.googleVersion||options?.calendar!==true||!control.calendarConnected||!control.googleConnected)throw Error('Credenziali fixture non autorizzate');control.credentials++;return {clientId:'client-fixture',clientSecret:'secret-fixture',refreshToken:'refresh-fixture'};},invalidate:()=>{control.googleConnected=false;}};
 const options={store,growthStore:s,runtime,mail,googleAuth,enabled:()=>control.enabled,providerOptions:{fetchImpl:transport.fetchImpl},origin:'https://os.example',clock:()=>new Date(control.now)};
 let calendar=createGrowthCalendar(options),sequence=0;
 const state=()=>calendar.state(owner,workspace),version=()=>state().version;
 async function checked(){await calendar.check(owner,workspace,{version:version()});}
 async function probe(){const p=await calendar.probePreview(owner,workspace);await calendar.probe(owner,workspace,{...p,confirmed:true});return state().probe;}
 async function enable(){await checked();const p=await probe();await calendar.verifyProbe(owner,workspace,{id:p.id,received:true});calendar.activate(owner,workspace,{version:version(),enabled:true});}
 function lead({consent='request',email,company,...rest}={}){const n=++sequence,l=createLead(s,workspace,{company:company||'Azienda inventata '+n,email:email||'contatto'+n+'@fixture.example',notes:'NOTE COMMERCIALI PRIVATE',...rest});return updateLead(s,workspace,l.id,{consent,consent_proof:'Richiesta di incontro inventata'});}
 function invitation(l=lead()){const p=calendar.invitePreview(owner,workspace,l.id),value=calendar.invite(owner,workspace,{...p,confirmed:true});return {...value,token:new URL(value.url).pathname.split('/').at(-1),lead:l};}
 async function booked(l){const v=invitation(l),slots=await calendar.publicSlots(v.token),result=await calendar.publicBook(v.token,{start:slots.slots[0],confirmed:true});return {...result,...v};}
 const restart=()=>{calendar=createGrowthCalendar(options);return calendar;};
 return {store,s,owner,workspace,control,options,transport,calls:transport.calls,events:transport.events,runtime,mail,googleAuth,get calendar(){return calendar;},state,version,checked,probe,enable,lead,invitation,booked,restart};
}
