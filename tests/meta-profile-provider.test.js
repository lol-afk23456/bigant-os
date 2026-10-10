import test from 'node:test';
import assert from 'node:assert/strict';
import {createMetaProfileProvider,metaFacebookMetrics,metaInstagramMetrics,metaProfileScopes} from '../src/meta-profile-provider.js';

const json=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
const scopes=channel=>({data:metaProfileScopes[channel].map(permission=>({permission,status:'granted'}))});
const page={id:'123',name:'Pagina inventata',instagram_business_account:{id:'456'},access_token:'page-token-fixture',followers_count:40};
const instagram={id:'456',name:'Profilo inventato',username:'profilo_fixture',followers_count:30};
const input={pageId:'123',instagramId:'456',channel:'facebook',from:'2026-09-01',to:'2026-09-28'};
const fbMetric=(name='page_media_view',values=[{value:10,end_time:'2026-09-02T07:00:00+0000'}])=>({id:`123/insights/${name}/day`,name,period:'day',values});
const igMetric=(name='views',value=10)=>({id:`456/insights/${name}/day`,name,period:'day',total_value:{value}});
function fixture(payloads,options={}){
 const calls=[],queue=[...payloads];
 const provider=createMetaProfileProvider({allow:()=>true,accessToken:async()=> 'user-token-fixture',...options,fetchImpl:async(request,init)=>{
  calls.push({url:new URL(request),init});assert.ok(queue.length,'No extra network call or automatic retry');
  const item=queue.shift();if(typeof item==='function')return item(request,init);return item instanceof Response?item:json(item);
 }});
 return {provider,calls,queue};
}

test('chiuso per default: nessun token né trasporto prima del consenso',async()=>{
 let calls=0;const provider=createMetaProfileProvider({accessToken:()=>{calls++;},fetchImpl:()=>{calls++;}});
 for(const read of [()=>provider.permissions(),()=>provider.pages(),()=>provider.page({pageId:'123'}),()=>provider.report(input)])await assert.rejects(read(),e=>e.status===409);
 assert.equal(calls,0);assert.deepEqual(Object.keys(provider).sort(),['page','pages','permissions','report']);
});

test('permessi solo granted, pagina limitata e cursor senza seguire URL next con token',async()=>{
 const f=fixture([{data:[{permission:'pages_show_list',status:'granted'},{permission:'read_insights',status:'declined'},{permission:'instagram_basic',status:'expired'}]},
  {data:[page,{id:'789',name:'Seconda pagina'}],paging:{cursors:{after:'cursor+opaque='},next:'https://evil.invalid/steal?access_token=do-not-expose'}},
  {data:[],paging:{cursors:{after:'last-page-cursor'}}},page]);
 assert.deepEqual(await f.provider.permissions(),['pages_show_list']);
 const first=await f.provider.pages();assert.deepEqual(first,{items:[{id:'123',name:page.name,instagramId:'456'},{id:'789',name:'Seconda pagina',instagramId:null}],after:'cursor+opaque='});
 assert.equal(f.calls.length,2);assert.deepEqual(await f.provider.pages({after:first.after}),{items:[]});
 assert.deepEqual(await f.provider.page({pageId:'123'}),{id:'123',name:page.name,instagramId:'456'});
 assert.equal(f.calls[1].url.searchParams.get('limit'),'25');assert.equal(f.calls[2].url.searchParams.get('after'),'cursor+opaque=');
 for(const {url,init} of f.calls){assert.equal(url.origin,'https://graph.facebook.com');assert.ok(url.pathname.startsWith('/v26.0/'));assert.equal(init.method,'GET');assert.equal(init.redirect,'error');assert.equal(init.headers.Authorization,'Bearer user-token-fixture');assert.ok(init.signal instanceof AbortSignal);assert.equal(init.body,undefined);assert.equal(url.searchParams.get('access_token'),null);}
 assert.doesNotMatch(JSON.stringify(first),/token|secret|evil/);
});

test('Facebook usa token Page confinato, metriche correnti e serie senza sommare utenti unici',async()=>{
 const f=fixture([scopes('facebook'),page,{data:[fbMetric(),fbMetric('page_total_media_view_unique',[{value:8,end_time:'2026-09-02T07:00:00+0000'},{value:7,end_time:'2026-09-03T07:00:00+0000'}]),fbMetric('page_daily_follows_unique',[{value:2,end_time:'2026-09-02T07:00:00+0000'}])]}]);
 const result=await f.provider.report(input);
 assert.deepEqual(result.profile,{id:'123',name:page.name,followers:40});
 assert.deepEqual(result.metrics[0],{name:'page_media_view',kind:'series',points:[{date:'2026-09-01',value:10}]});
 assert.deepEqual(result.metrics[1],{name:'page_total_media_view_unique',kind:'series',points:[{date:'2026-09-01',value:8},{date:'2026-09-02',value:7}]});
 assert.equal(f.calls.length,3);assert.equal(f.calls[1].init.headers.Authorization,'Bearer user-token-fixture');assert.equal(f.calls[2].init.headers.Authorization,'Bearer page-token-fixture');
 const request=f.calls[2].url;assert.equal(request.pathname,'/v26.0/123/insights');assert.equal(request.searchParams.get('metric'),metaFacebookMetrics.join(','));assert.equal(request.searchParams.get('period'),'day');
 assert.equal(new Date(Number(request.searchParams.get('since'))*1000).toISOString(),'2026-09-01T00:00:00.000Z');assert.equal(new Date(Number(request.searchParams.get('until'))*1000).toISOString(),'2026-09-28T23:59:59.000Z');
 assert.equal(result.sourceUrl,request.href);assert.doesNotMatch(JSON.stringify(result),/token|impressions|page_fans/);
});

test('Instagram usa token utente, total_value, ID esatto e ricontrolla il collegamento',async()=>{
 const f=fixture([scopes('instagram'),page,instagram,{data:[igMetric('views',0),igMetric('reach',12),igMetric('total_interactions',3)]},page]);
 const result=await f.provider.report({...input,channel:'instagram'});
 assert.deepEqual(result.profile,{id:'456',name:instagram.name,username:instagram.username,followers:30});
 assert.deepEqual(result.metrics,[{name:'views',kind:'total',value:0},{name:'reach',kind:'total',value:12},{name:'total_interactions',kind:'total',value:3}]);
 assert.deepEqual(f.calls.map(c=>c.url.pathname),['/v26.0/me/permissions','/v26.0/123','/v26.0/456','/v26.0/456/insights','/v26.0/123']);
 assert.ok(f.calls.every(c=>c.init.headers.Authorization==='Bearer user-token-fixture'));
 assert.equal(f.calls[3].url.searchParams.get('metric'),metaInstagramMetrics.join(','));assert.equal(f.calls[3].url.searchParams.get('metric_type'),'total_value');
 assert.doesNotMatch(JSON.stringify(result),/token|follows_and_unfollows|impressions/);
});

test('nessun dato, valore o follower mancante viene trasformato in zero',async()=>{
 const f=fixture([scopes('facebook'),{id:'123',name:page.name,access_token:page.access_token},{data:[fbMetric('page_media_view',[{end_time:'2026-09-02T07:00:00+0000'}]),fbMetric('page_post_engagements',[])]}]);
 const result=await f.provider.report(input);assert.deepEqual(result.profile,{id:'123',name:page.name});assert.ok(result.metrics.every(m=>m.points.length===0));
 const g=fixture([scopes('instagram'),page,{id:'456',username:'fixture'}, {data:[{id:'456/insights/views/day',name:'views',period:'day',total_value:{}}]},{data:[]},page]);
 const missing=await g.provider.report({...input,channel:'instagram'});assert.deepEqual(missing.profile,{id:'456',name:'fixture',username:'fixture'});assert.deepEqual(missing.metrics,[{name:'views',kind:'total'}]);
 const h=fixture([scopes('instagram'),page,{id:'456'}, {data:[]},{data:[]},page]);const empty=await h.provider.report({...input,channel:'instagram'});assert.deepEqual(empty.metrics,[]);assert.deepEqual(empty.profile,{id:'456',name:''});
});

test('revoca scope blocca report prima della pagina; non richiede scope di scrittura',async()=>{
 for(const channel of ['facebook','instagram']){
  for(const permission of metaProfileScopes[channel]){
   const denied=scopes(channel);denied.data.find(x=>x.permission===permission).status='expired';
   const f=fixture([denied]);await assert.rejects(f.provider.report({...input,channel}),e=>e.status===409);assert.equal(f.calls.length,1);
  }
 }
 assert.ok(Object.values(metaProfileScopes).flat().every(scope=>!['ads_management','pages_manage_posts','pages_manage_metadata','instagram_content_publish'].includes(scope)));
});

test('ID pagina o Instagram non corrispondente respinto senza leggere un altro profilo',async()=>{
 const wrongPage=fixture([{...page,id:'999'}]);await assert.rejects(wrongPage.provider.page({pageId:'123'}),e=>e.status===502);
 const changed=fixture([scopes('instagram'),{...page,instagram_business_account:{id:'999'}}]);await assert.rejects(changed.provider.report({...input,channel:'instagram'}),e=>e.status===409);assert.equal(changed.calls.length,2);
 const wrongIG=fixture([scopes('instagram'),page,{...instagram,id:'999'}]);await assert.rejects(wrongIG.provider.report({...input,channel:'instagram'}),e=>e.status===502);assert.equal(wrongIG.calls.length,3);
 const changedLater=fixture([scopes('instagram'),page,instagram,{data:[igMetric()]},{...page,instagram_business_account:null}]);await assert.rejects(changedLater.provider.report({...input,channel:'instagram'}),e=>e.status===409);
 const wrongSeries=fixture([scopes('facebook'),page,{data:[{...fbMetric(),id:'999/insights/page_media_view/day'}]}]);await assert.rejects(wrongSeries.provider.report(input),e=>e.status===502);
});

test('due provider non condividono token, pagine o risultati',async()=>{
 const a=fixture([scopes('facebook'),page,{data:[fbMetric()]}]);
 const b=fixture([scopes('facebook'),{id:'987',name:'Cliente B inventato',access_token:'page-b-fixture'},{data:[]}],{accessToken:async()=> 'user-b-fixture'});
 const [first,second]=await Promise.all([a.provider.report(input),b.provider.report({...input,pageId:'987',instagramId:null})]);
 assert.equal(first.profile.id,'123');assert.equal(second.profile.id,'987');assert.equal(b.calls[0].init.headers.Authorization,'Bearer user-b-fixture');assert.equal(b.calls[2].init.headers.Authorization,'Bearer page-b-fixture');assert.ok(b.calls.every(c=>!c.url.pathname.includes('123')));
});

test('riferimenti, cursori e date invalidi falliscono prima di leggere credenziali',async()=>{
 let reads=0;const p=createMetaProfileProvider({allow:()=>true,accessToken:()=>{reads++;return 'fixture';},fetchImpl:()=>{throw Error('must not fetch');}});
 for(const pageId of ['https://evil.invalid','123/../999','123?token=x','123%2finsights',123,''])await assert.rejects(p.page({pageId}),e=>e.status===400);
 for(const after of ['x\r\ny','x'.repeat(2049),45])await assert.rejects(p.pages({after}),e=>e.status===400);
 for(const changes of [{from:'2026-02-30'},{from:'2026-09-29'},{to:'2026-09-29'},{channel:'threads'},{channel:'instagram',instagramId:null},{instagramId:'x/insights'}])await assert.rejects(p.report({...input,...changes}),e=>e.status===400);
 assert.equal(reads,0);
 const single=fixture([scopes('facebook'),page,{data:[]}]);await single.provider.report({...input,to:input.from});assert.equal(single.calls.length,3);
});

test('guard ricontrollato dopo token, risposta e lettura stream, senza proseguire',async()=>{
 let allowed=true,calls=0;
 const p=createMetaProfileProvider({allow:()=>allowed,accessToken:async()=>{allowed=false;return 'fixture';},fetchImpl:()=>{calls++;}});await assert.rejects(p.pages(),e=>e.status===409);assert.equal(calls,0);
 allowed=true;const f=fixture([()=>{allowed=false;return json({data:[]});}],{allow:()=>allowed});await assert.rejects(f.provider.pages(),e=>e.status===409);assert.equal(f.calls.length,1);
 allowed=true;let cancelled=false;
 const response={ok:true,headers:new Headers(),body:{async *[Symbol.asyncIterator](){yield Buffer.from('{"data":');allowed=false;yield Buffer.from('[]}');},async cancel(){cancelled=true;}}};
 const stream=fixture([()=>response],{allow:()=>allowed});await assert.rejects(stream.provider.pages(),e=>e.status===409);assert.equal(cancelled,true);
 allowed=true;const between=fixture([scopes('facebook'),()=>{allowed=false;return json(page);}],{allow:()=>allowed});await assert.rejects(between.provider.report(input),e=>e.status===409);assert.equal(between.calls.length,2);
});

test('errori, redirect, JSON e risposte oltre 1 MB non espongono segreti né riprovano',async()=>{
 const cases=[new Response('provider-secret-fixture',{status:403}),new Response('provider-secret-fixture',{status:302,headers:{Location:'https://evil.invalid'}}),new Response('provider-secret-fixture'),json([]),json({error:{message:'provider-secret-fixture'}}),json({padding:'x'.repeat(1_000_001)}),new Response('{}',{headers:{'content-length':'1000001'}}),()=>{throw Error('provider-secret-fixture');},()=>({ok:true,redirected:true,body:{cancel:async()=>{}}})];
 for(const response of cases){const f=fixture([response]);await assert.rejects(f.provider.pages(),e=>e.status===502&&!/provider-secret|user-token|page-token/.test(e.message));assert.equal(f.calls.length,1);}
 const p=createMetaProfileProvider({allow:()=>true,accessToken:()=>{throw Error('provider-secret-fixture');}});await assert.rejects(p.permissions(),e=>e.status===409&&!e.message.includes('provider-secret'));
});

test('limiti risposta, duplicati, date e contatori malformati sono rifiutati',async()=>{
 for(const value of [{data:Array.from({length:26},()=>page)},{data:[page,page]},{data:[{id:'123',name:'x\u0000'}]},{data:[{id:'123',name:'X',instagram_business_account:{id:'not-numeric'}}]}, {data:[],paging:{cursors:{after:'x\n'}}}]){
  const f=fixture([value]);await assert.rejects(f.provider.pages(),e=>e.status===502);
 }
 const invalid=[fbMetric('impressions'),{...fbMetric(),period:'week'},fbMetric('page_media_view',[{value:1,end_time:'2026-09-01T07:00:00+0000'}]),fbMetric('page_media_view',[{value:1,end_time:'2026-09-31T07:00:00+0000'}]),fbMetric('page_media_view',[{value:-1,end_time:'2026-09-02T07:00:00+0000'}]),fbMetric('page_media_view',[{value:Number.MAX_SAFE_INTEGER+1,end_time:'2026-09-02T07:00:00+0000'}]),fbMetric('page_media_view',[{value:'12',end_time:'2026-09-02T07:00:00+0000'}]),fbMetric('page_media_view',[{value:1,end_time:'2026-09-02T07:00:00+0000'},{value:1,end_time:'2026-09-02T07:00:00+0000'}])];
 for(const value of invalid){const f=fixture([scopes('facebook'),page,{data:[value]}]);await assert.rejects(f.provider.report(input),e=>e.status===502);}
 for(const value of [{...igMetric(),id:'999/insights/views/day'},igMetric('impressions'),igMetric('views',1.2),igMetric('views',{})]){const f=fixture([scopes('instagram'),page,instagram,{data:[value]}]);await assert.rejects(f.provider.report({...input,channel:'instagram'}),e=>e.status===502);}
});

const growth=(results,total)=>({data:[{name:'follows_and_unfollows',period:'day',id:'456/insights/follows_and_unfollows/day',total_value:{...(total===undefined?{}:{value:total}),breakdowns:[{dimension_keys:['follow_type'],results:results.map(([key,value])=>({dimension_values:[key],value}))}]}}]});
const growthFixture=(response,options={})=>fixture([scopes('instagram'),page,{...instagram,followers_count:100},{data:[igMetric()]},response,page],options);
test('Instagram crescita: richiesta separata, stesso periodo, netta positiva/negativa/zero e fonte senza token',async()=>{
 for(const [follows,unfollows] of [[12,5],[2,7],[0,0]]){
  const f=growthFixture(growth([['FOLLOWER',follows],['NON_FOLLOWER',unfollows]],follows+unfollows));
  const result=await f.provider.report({...input,channel:'instagram'}),request=f.calls[4].url;
  assert.deepEqual(result.growth,{status:'available',follows,unfollows,net:follows-unfollows,sourceUrl:request.href});
  assert.equal(request.searchParams.get('metric'),'follows_and_unfollows');assert.equal(request.searchParams.get('breakdown'),'follow_type');assert.equal(request.searchParams.get('metric_type'),'total_value');assert.equal(request.searchParams.get('period'),'day');
  for(const key of ['since','until'])assert.equal(request.searchParams.get(key),f.calls[3].url.searchParams.get(key));
  assert.equal(f.calls[3].url.searchParams.get('breakdown'),null);assert.equal(f.calls.length,6);assert.equal(f.calls[5].url.pathname,'/v26.0/123');assert.ok(f.calls.every(c=>c.init.headers.Authorization==='Bearer user-token-fixture'&&c.init.method==='GET'));assert.doesNotMatch(JSON.stringify(result.growth),/access_token|user-token/);
 }
});
test('Instagram crescita: sotto soglia non interroga metriche non disponibili; totale ignoto non viene assunto sotto soglia',async()=>{
 const f=fixture([scopes('instagram'),page,{...instagram,followers_count:99},{data:[]},page]);const result=await f.provider.report({...input,channel:'instagram'});assert.deepEqual(result.growth,{status:'below_threshold'});assert.equal(f.calls.length,5);
 const unknown=fixture([scopes('instagram'),page,{id:'456'},{data:[]},{data:[]},page]);const missing=await unknown.provider.report({...input,channel:'instagram'});assert.equal(missing.growth.status,'not_available');assert.equal(unknown.calls.length,6);
});
test('Instagram crescita: categorie mancanti, nulle o sconosciute non diventano zero né netta',async()=>{
 for(const response of [{data:[]},{data:[{...igMetric('follows_and_unfollows'),total_value:{value:0}}]},growth([['FOLLOWER',5]]),growth([['FOLLOWER',5],['NON_FOLLOWER',null]]),growth([['FOLLOWER',5],['NON_FOLLOWER',2],['UNKNOWN',1]]),growth([['FOLLOWER',5],['NON_FOLLOWER',2],['UNKNOWN',null]])]){
  const f=growthFixture(response),out=(await f.provider.report({...input,channel:'instagram'})).growth;assert.equal(out.net,undefined);assert.notEqual(out.status,'available');
 }
 const zero=growthFixture(growth([['FOLLOWER',0],['NON_FOLLOWER',0],['UNKNOWN',0]]));assert.equal((await zero.provider.report({...input,channel:'instagram'})).growth.net,0);
});
test('Instagram crescita: ID, dimensioni, duplicati, valori invalidi e payload inattesi respinti',async()=>{
 const base=growth([['FOLLOWER',3],['NON_FOLLOWER',2]]);
 const cases=[growth([['FOLLOWER',1],['FOLLOWER',2]]),growth([['FOLLOWER','3']]),growth([['FOLLOWER',-1]]),growth([['FOLLOWER',1.5]]),growth([['FOLLOWER',Number.MAX_SAFE_INTEGER+1]]),growth([['FOLLOWS',5]]),growth([[['FOLLOWER'],5]])];
 for(const modify of [x=>x.data[0].id='999/insights/follows_and_unfollows/day',x=>x.data[0].period='lifetime',x=>x.data[0].total_value.breakdowns[0].dimension_keys=['media_product_type'],x=>x.data[0].total_value.breakdowns.push(x.data[0].total_value.breakdowns[0]),x=>x.data.push(x.data[0])]){const value=structuredClone(base);modify(value);cases.push(value);}
 for(const response of cases){const f=growthFixture(response);await assert.rejects(f.provider.report({...input,channel:'instagram'}),e=>e.status===502);assert.equal(f.calls.length,5);}
});
test('Instagram crescita: revoca o errore durante il trasporto non mantiene un report parziale o riprova',async()=>{
 let allowed=true;const f=growthFixture(()=>{allowed=false;return json(growth([['FOLLOWER',3],['NON_FOLLOWER',2]]));},{allow:()=>allowed});await assert.rejects(f.provider.report({...input,channel:'instagram'}),e=>e.status===409);assert.equal(f.calls.length,5);
 const denied=growthFixture(new Response('segreto-provider-fixture',{status:403}));await assert.rejects(denied.provider.report({...input,channel:'instagram'}),e=>e.status===502&&!e.message.includes('segreto-provider'));assert.equal(denied.calls.length,5);
});
