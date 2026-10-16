import test from 'node:test';
import assert from 'node:assert/strict';
import {createBusinessProfileProvider,businessProfileMetrics} from '../src/business-profile-provider.js';
import {businessProfileFixture,json} from './helpers/business-profile-fixture.js';

test('provider chiuso per default: nessuna credenziale o richiesta prima del gate',async()=>{
 let calls=0;const provider=createBusinessProfileProvider({accessToken:()=>{calls++;},fetchImpl:()=>{calls++;}});await assert.rejects(provider.accounts(),e=>e.status===409);assert.equal(calls,0);
});
test('endpoint ufficiali, mask pubblica, recensioni max50 e periodo sparse senza formule',async t=>{
 const f=businessProfileFixture(t);await f.configure();const view=await f.check();assert.equal(f.calls.length,5);assert.ok(f.calls.every(c=>c.options.method==='GET'&&c.options.redirect==='error'&&c.options.headers.Authorization==='Bearer bearer-fixture'));
 const [a,l,one,r,p]=f.calls.map(c=>c.url);assert.equal(a.href,'https://mybusinessaccountmanagement.googleapis.com/v1/accounts?pageSize=20');assert.equal(l.pathname,'/v1/accounts/123/locations');assert.equal(l.searchParams.get('readMask'),'name,title,storefrontAddress,websiteUri,phoneNumbers,metadata.mapsUri');assert.equal(one.pathname,'/v1/locations/456');assert.equal(r.pathname,'/v4/accounts/123/locations/456/reviews');assert.equal(r.searchParams.get('pageSize'),'50');assert.equal(r.searchParams.get('pageToken'),null);
 assert.deepEqual(p.searchParams.getAll('dailyMetrics'),businessProfileMetrics);assert.equal(p.searchParams.get('dailyRange.start_date.day'),'10');assert.equal(p.searchParams.get('dailyRange.start_date.month'),'9');assert.equal(p.searchParams.get('dailyRange.end_date.day'),'7');assert.equal(view.data.from,'2026-09-10');assert.equal(view.data.to,'2026-10-07');assert.equal(view.data.reviews.totalReviewCount,80);assert.equal(view.data.reviews.reviews.length,1);assert.equal(view.data.reviews.nextPageToken,'more-reviews');assert.equal(view.data.reviews.reviews[0].reviewer.profilePhotoUrl,undefined);assert.deepEqual(view.data.performance,f.payload.performance);assert.equal(view.data.sourceUrl,'https://maps.google.com/?cid=456');
});
test('token OAuth e risultati asincroni ricontrollano il gate prima di proseguire',async()=>{
 let allowed=true,calls=0;const p=createBusinessProfileProvider({allow:()=>allowed,accessToken:async()=>{allowed=false;return 'token';},fetchImpl:()=>{calls++;}});await assert.rejects(p.accounts(),e=>e.status===409);assert.equal(calls,0);
 allowed=true;const q=createBusinessProfileProvider({allow:()=>allowed,accessToken:async()=> 'token',fetchImpl:async()=>{calls++;allowed=false;return json({accounts:[]});}});await assert.rejects(q.accounts(),e=>e.status===409);assert.equal(calls,1);
});
test('gli errori Google, di rete e JSON non espongono testo o token del fornitore',async()=>{
 for(const fetchImpl of [async()=>new Response('token-private',{status:403}),async()=>{throw Error('token-private');},async()=>new Response('token-private'),async()=>json([]),async()=>json({secret:'x'.repeat(1_000_001)})]){
  const p=createBusinessProfileProvider({allow:()=>true,accessToken:async()=> 'token-private',fetchImpl});await assert.rejects(p.accounts(),e=>e.status===502&&!e.message.includes('token-private'));
 }
});
test('rifiuta URL arbitrari, nomi di risorsa iniettati e token di pagina non validi prima della rete',async()=>{
 let count=0;const p=createBusinessProfileProvider({allow:()=>true,accessToken:async()=> 'token',fetchImpl:async()=>{count++;}});
 for(const accountName of ['https://evil.example.com','accounts/123/../456','accounts/foo','accounts/123?key=private'])await assert.rejects(p.locations({accountName}),e=>e.status===400);
 for(const pageToken of ['x\r\ny','x'.repeat(2049),5])await assert.rejects(p.accounts({pageToken}),e=>e.status===400);
 await assert.rejects(p.performance({locationName:'locations/456',from:'2026-02-31',to:'2026-03-30'}),e=>e.status===400);assert.equal(count,0);
});
test('risposta scheda sbagliata, Maps arbitrario, contenuti o conteggi fuori limite non passano',async t=>{
 const invalid=[{path:'location',value:{name:'locations/999',title:'Altra'}},{path:'location',value:{name:'locations/456',title:'Fixture',metadata:{mapsUri:'https://evil.example.com/maps'}}},{path:'location',value:{name:'locations/456',title:'Fixture',metadata:{mapsUri:'https://maps.google.com/?q=x&redirect=https://evil.example.com'}}},{path:'reviews',value:{reviews:Array.from({length:51},()=>({reviewId:'r'}))}},{path:'reviews',value:{totalReviewCount:-1}},{path:'reviews',value:{averageRating:6}}];
 for(const sample of invalid){const f=businessProfileFixture(t);await f.configure();f.payload[sample.path]=sample.value;await assert.rejects(f.check(),e=>[400,502].includes(e.status));assert.equal(f.runtime.state(f.owner,'demo-bottega').data,null);}
});
test('serie non fornite restano assenti, date impossibili/duplicate e valori imprecisi respinti',async()=>{
 const series=point=>({multiDailyMetricTimeSeries:[{dailyMetricTimeSeries:[{dailyMetric:'CALL_CLICKS',timeSeries:{datedValues:point}}]}]});
 for(const value of [{},series([{date:{year:2026,month:9,day:30}}])]){const p=createBusinessProfileProvider({allow:()=>true,accessToken:async()=> 'token',fetchImpl:async()=>json(value)});assert.deepEqual(await p.performance({locationName:'locations/1',from:'2026-09-10',to:'2026-10-07'}),value);}
 for(const points of [[{date:{year:2026,month:9,day:31},value:'1'}],[{date:{year:2026,month:10,day:8},value:'1'}],[{date:{year:2026,month:10,day:7},value:2}],[{date:{year:2026,month:10,day:7},value:'9223372036854775808'}],[{date:{year:2026,month:10,day:7},value:'1'},{date:{year:2026,month:10,day:7},value:'2'}]]){
  const p=createBusinessProfileProvider({allow:()=>true,accessToken:async()=> 'token',fetchImpl:async()=>json(series(points))});await assert.rejects(p.performance({locationName:'locations/1',from:'2026-09-10',to:'2026-10-07'}),e=>e.status===502);
 }
});
