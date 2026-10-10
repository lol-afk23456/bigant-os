import test from 'node:test';
import assert from 'node:assert/strict';
import {createGrowthLiveProviders,growthMime} from '../src/growth-live-providers.js';
const message={id:'mail-123',from:'team@agency.example',to:'info@company.example',subject:'Una prova',body:'Messaggio inventato',unsubscribe:'https://agency.example/unsubscribe/token'};
const event={id:'aabbccdd-1234-4567-8910-abcdef123456',start:'2026-11-10T10:00:00Z',end:'2026-11-10T10:30:00Z',lead:{email:'info@company.example',company:'Azienda inventata',notes:'Dati di prova'}};
const credentials=async()=>({apiKey:'secret-fixture',model:'model-fixture',clientId:'client-fixture',clientSecret:'secret-fixture',refreshToken:'refresh-fixture'});
const json=(value,status=200)=>new Response(status===204?null:JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
function setup(overrides={}) {
 const requests=[],costs=[],gates=[];
 const config={credentials,aiProvider:'openai',estimatedCents:{search:5,ai:25},origin:'https://agency.example',settings:()=>({calendarId:'primary'}),
  allow:async(w,operation,context)=>{gates.push({w,operation,context});return true;},
  budget:{reserve:async(w,category,cents,note)=>{costs.push({w,category,cents,note});return 'reservation';},settle:async(id,charged)=>costs.push({id,charged})},
  fetchImpl:async(url,opts)=>{requests.push({url:String(url),...opts});return json({});},...overrides};
 return {p:createGrowthLiveProviders(config),requests,costs,gates,config};
}
test('fornitori chiusi per default: zero rete, credenziali, riserve o letture siti',async()=>{
 let calls=0;const never=async()=>{calls++;throw Error('Mai chiamato');};
 const p=createGrowthLiveProviders({credentials:never,fetchImpl:never,readWebsite:never,aiProvider:'openai',settings:()=>({calendarId:'primary'}),origin:'https://agency.example'});
 for(const action of [()=>p.search('w','Aziende'),()=>p.website('w','https://company.example'),()=>p.ai('w','Valuta',{}),()=>p.send('w',message),()=>p.findSent('w','mail-123'),()=>p.thread('w','thread1'),()=>p.busy('w',event.start,event.end),()=>p.book('w',event),()=>p.event('w',event.id),()=>p.cancelEvent('w',event.id),()=>p.exchange('w','code-fixture'),()=>p.profile('w')])await assert.rejects(action,/non attivato/);
 assert.equal(calls,0);
});
test('ricerca: chiave in header, fonte e data, budget prima della rete; dati inattesi esclusi',async()=>{
 const f=setup({clock:()=>new Date('2026-10-10T12:00:00Z')});
 f.config.fetchImpl=async(url,opts)=>{f.requests.push({url:String(url),...opts});return json({web:{results:[{title:'Azienda',url:'https://company.example',description:'Risultato di prova'},{url:'file:///private'},{url:'https://key:secret@company.example'}]}});};
 const p=createGrowthLiveProviders(f.config),rows=await p.search('w','Aziende di prova',3);
 assert.equal(rows.length,1);assert.equal(rows[0].source,'Brave Search');assert.equal(rows[0].retrievedAt,'2026-10-10T12:00:00.000Z');
 assert.equal(f.requests[0].headers['X-Subscription-Token'],'secret-fixture');assert.equal(f.requests[0].redirect,'error');assert.ok(!f.requests[0].url.includes('secret-fixture'));assert.deepEqual(f.costs.at(-1),{id:'reservation',charged:true});
 let calls=0;const denied=setup({budget:{reserve:()=>{throw Error('Budget esaurito');},settle:()=>{}},fetchImpl:()=>{calls++;}});await assert.rejects(denied.p.search('w','Prova'),/Budget esaurito/);assert.equal(calls,0);
 await assert.rejects(setup({estimatedCents:{}}).p.search('w','Prova'),/Budget e stima/);
});
test('OpenAI e Anthropic: stesso contratto, modello configurato, nessuno strumento, output validato',async()=>{
 const answer={score:72,summary:'Fatti e ipotesi distinti',service:'Video',reason:'Da verificare'};
 for(const provider of ['openai','anthropic']){
  const f=setup({aiProvider:provider});f.config.fetchImpl=async(url,opts)=>{f.requests.push({url:String(url),...opts});return json(provider==='openai'?{status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(answer)}]}]}:{stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(answer)}]});};
  assert.deepEqual(await createGrowthLiveProviders(f.config).ai('w','Valuta la pertinenza',{websiteText:'Dati inventati'}),answer);
  const body=JSON.parse(f.requests[0].body);assert.equal(body.model,'model-fixture');assert.equal(body.tools,undefined);assert.equal((body.text?.format||body.output_config.format).schema.additionalProperties,false);
  if(provider==='openai')assert.equal(body.store,false);else assert.equal(f.requests[0].headers['x-api-key'],'secret-fixture');
  assert.equal(f.costs[0].cents,25);assert.deepEqual(f.costs.at(-1),{id:'reservation',charged:true});
 }
});
test('AI invalida, rifiuto, errore remoto o rete: costo prudenziale conservato, nessun retry o segreto negli errori',async()=>{
 for(const response of [()=>json({status:'incomplete'}),()=>json({status:'completed',output:[{type:'message',content:[{type:'refusal'}]}]}),()=>json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({score:101,summary:'x',service:'x',reason:'x'})}]}]}),()=>json({error:'secret-fixture'},429),()=>{throw Error('secret-fixture');}]){
  let calls=0;const f=setup({fetchImpl:async()=>{calls++;return response();}});await assert.rejects(f.p.ai('w','Valuta',{}),e=>!e.message.includes('secret-fixture'));assert.equal(calls,1);assert.deepEqual(f.costs.at(-1),{id:'reservation',charged:true});
 }
 await assert.rejects(setup({aiProvider:null}).p.ai('w','Valuta',{}),/Scegli il fornitore/);
 const f=setup({fetchImpl:async()=>json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{"subject":"","body":"","action":"human","reason":"Serve un socio"}'}]}]})});assert.equal((await f.p.ai('w','Scrivi',{})).action,'human');
});
test('Google: gate distinto per lettura e invio; token mai in URL, messaggio stabile per riconciliazione',async()=>{
 const f=setup();f.config.fetchImpl=async(url,opts)=>{f.requests.push({url:String(url),...opts});if(String(url).endsWith('/token'))return json({access_token:'access-fixture'});if(String(url).endsWith('/send'))return json({id:'sent1',threadId:'thread1'});return json({messages:[{id:'sent1',threadId:'thread1'}]});};
 const p=createGrowthLiveProviders(f.config);assert.equal((await p.send('w',message)).id,'sent1');assert.equal((await p.findSent('w',message.id)).id,'sent1');
 assert.deepEqual(f.gates.map(row=>row.operation),['gmail-send','gmail-send','gmail-send','gmail-read','gmail-read','gmail-read']);assert.deepEqual(f.gates.slice(0,3).map(row=>row.context.stage),[undefined,'dispatch','result']);assert.equal(f.gates[0].context.message.id,message.id);assert.equal(f.requests.length,4);
 const send=f.requests[1],decoded=Buffer.from(JSON.parse(send.body).raw,'base64url').toString();assert.match(decoded,/Message-ID: <mail-123@growth.bigantagency.it>/);assert.match(decoded,/List-Unsubscribe/);
 assert.equal(send.headers.Authorization,'Bearer access-fixture');assert.ok(f.requests.every(row=>!row.url.includes('fixture')));assert.equal(f.costs.length,0);
});
test('Calendar: disponibilità distinta dalla scrittura, id stabile, errore di calendario non equivale a libero',async()=>{
 const f=setup();f.config.fetchImpl=async(url,opts)=>{f.requests.push({url:String(url),...opts});if(String(url).endsWith('/token'))return json({access_token:'access-fixture'});if(String(url).endsWith('/freeBusy'))return json({calendars:{primary:{busy:[]}}});if(opts.method==='DELETE')return json({},404);return json({id:event.id.replaceAll('-',''),status:'confirmed'});};
 const p=createGrowthLiveProviders(f.config);assert.deepEqual(await p.busy('w',event.start,event.end),[]);await p.book('w',event);await p.cancelEvent('w',event.id);
 assert.deepEqual(f.gates.map(row=>row.operation),['calendar-read','calendar-read','calendar-read','calendar-write','calendar-write','calendar-write','calendar-write','calendar-write']);assert.equal(JSON.parse(f.requests[3].body).id,event.id.replaceAll('-',''));assert.equal(f.gates[3].context.action,'book');assert.match(f.requests[3].url,/sendUpdates=all/);
 const missing=setup({fetchImpl:async url=>json(String(url).endsWith('/token')?{access_token:'fake'}:{calendars:{primary:{errors:[{reason:'notFound'}]}}})});await assert.rejects(missing.p.busy('w',event.start,event.end),/non verificabile/);
 const uncertain=setup({fetchImpl:async url=>json(String(url).endsWith('/token')?{access_token:'fake'}:{id:'different',status:'confirmed'})});await assert.rejects(uncertain.p.book('w',event),/Esito Calendar da verificare/);
 await assert.rejects(p.busy('w','2026','2027'),/Intervallo/);
});
test('OAuth e MIME: callback fisso HTTPS, dati strutturati e difesa dagli header aggiunti',async()=>{
 const f=setup();f.config.fetchImpl=async(url,opts)=>{f.requests.push({url:String(url),...opts});return json({access_token:'access-fixture'});};await createGrowthLiveProviders(f.config).exchange('w','code-fixture');
 assert.equal(f.gates[0].operation,'google-oauth');assert.equal(f.requests[0].body.get('redirect_uri'),'https://agency.example/auth/google/callback');
 await assert.rejects(setup({origin:'http://agency.example'}).p.exchange('w','code'),/non valida/);
 assert.throws(()=>growthMime({...message,to:'x@example.com\r\nBcc: victim@example.com'}),/email non valido/);
 const raw=Buffer.from(growthMime({...message,subject:'Ciao\r\nBcc: altra persona'},{logo:Buffer.from('fake')}),'base64url').toString();assert.ok(!raw.includes('\r\nBcc:'));assert.match(raw,/Content-ID: <bigant-logo>/);
});
