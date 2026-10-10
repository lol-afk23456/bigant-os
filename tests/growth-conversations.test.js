import test from 'node:test';
import assert from 'node:assert/strict';
import {mailFixture} from './helpers/growth-mail-fixture.js';

// Every address and provider response is invented. The shared fixture uses only SQLite
// in memory and an injected transport: no listener, mailbox, attachment or remote AI.
const sync = f => f.call('POST', '/mail/sync', {confirmed:true});
const incoming = f => f.store.query("SELECT * FROM gr_messages WHERE direction='in' ORDER BY provider_id");
const threadRequests = f => f.calls.filter(c => c.url.includes('/threads/'));
const sendRequests = f => f.calls.filter(c => c.url.endsWith('/messages/send'));
const aiRequests = f => f.calls.filter(c => c.url.includes('api.openai.com'));
const encoded = text => Buffer.from(text).toString('base64url');
const headers = rows => Object.entries(rows).map(([name,value]) => ({name,value}));
function header(raw, name, value) {
  raw.payload.headers = raw.payload.headers.filter(h => h.name.toLowerCase() !== name.toLowerCase());
  if (value !== undefined) raw.payload.headers.push({name,value});
}
function threadFor(f, id, replies = []) {
  const intent = f.store.one('SELECT * FROM gr_mail_intents WHERE message_id=?', id);
  const sent = f.store.one('SELECT * FROM gr_messages WHERE id=?', id);
  const p = JSON.parse(intent.payload_json);
  return {id:sent.thread_id, messages:[{
    id:sent.provider_id, threadId:sent.thread_id, labelIds:['SENT'], internalDate:String(Date.parse(sent.sent)),
    payload:{mimeType:'text/plain', headers:headers({
      'Message-ID':`<${id}@growth.bigantagency.it>`, From:p.from, To:p.to, Subject:p.subject,
    }), body:{data:encoded(p.body)}},
  }, ...replies]};
}
function replyTo(f, id, {id:providerId='reply-invented-1', text='Grazie, leggeremo la proposta.', ...patch} = {}) {
  const sent = f.store.one('SELECT * FROM gr_messages WHERE id=?', id);
  const p = JSON.parse(f.store.one('SELECT payload_json FROM gr_mail_intents WHERE message_id=?', id).payload_json);
  return {
    id:providerId, threadId:sent.thread_id, labelIds:['INBOX'], internalDate:String(Date.parse(sent.sent)+1000),
    payload:{mimeType:'text/plain', headers:headers({
      'Message-ID':`<${providerId}@fixture.example>`, From:p.to, To:p.from, Subject:'Re: '+p.subject,
    }), body:{data:encoded(text)}}, ...patch,
  };
}
async function sentFixture(t) {
  const f = mailFixture(t);
  await f.enable();
  const m = await f.draft();
  await f.approve(m);
  await f.send(await f.preview(m.id));
  return {f,m};
}
async function followup(f, m) {
  await f.call('POST', '/jobs', {type:'draft',leadId:m.lead_id,kind:'followup'});
  const result = await f.call('POST', '/jobs/run');
  assert.equal(result.job.status, 'done', result.job.error);
  return f.state().messages.find(x => x.lead_id === m.lead_id && x.status === 'draft');
}
function deferred() {
  let resolve;
  const promise = new Promise(r => {resolve=r;});
  return {promise,resolve};
}

test('lettura Gmail: flag, OAuth e conferma esplicita prima di qualsiasi richiesta', async t => {
  const disabled = mailFixture(t, {gmailEnabled:false});
  assert.equal(disabled.state().conversations.canSync, false);
  await assert.rejects(sync(disabled), /non abilitato/);
  assert.equal(disabled.calls.length, 0);
  const f = mailFixture(t);
  assert.equal(f.state().conversations.canSync, false);
  await assert.rejects(sync(f), /autorizzare/);
  assert.equal(f.calls.length, 0);
  await f.enable();
  const before = f.calls.length;
  for (const confirmed of [undefined,false,'true',1]) {
    await assert.rejects(f.call('POST', '/mail/sync', {confirmed}), /Conferma/);
  }
  assert.equal(f.calls.length, before);
  assert.deepEqual(await sync(f), {checked:0,received:0,skipped:0,review:0,errors:0,totalThreads:0,batchLimit:10});
  assert.equal(f.calls.length, before);
});

test('solo un invio confermato rende eleggibile il thread; importazione idempotente senza AI o autoreply', async t => {
  const f = mailFixture(t);
  await f.enable();
  const m = await f.draft();
  await f.approve(m);
  assert.equal(f.state().conversations.eligibleThreads, 0);
  await sync(f);
  assert.equal(threadRequests(f).length, 0);
  await f.send(await f.preview(m.id));
  const reply = replyTo(f,m.id);
  f.control.thread = threadFor(f,m.id,[reply]);
  assert.equal(f.state().conversations.eligibleThreads, 1);
  const jobsBefore = f.state().jobs.length, aiBefore = aiRequests(f).length;
  assert.deepEqual(await sync(f), {checked:1,received:1,skipped:0,review:0,errors:0,totalThreads:1,batchLimit:10});
  const stored = incoming(f)[0];
  assert.equal(stored.lead_id, m.lead_id);
  assert.equal(stored.provider_id, reply.id);
  assert.equal(stored.thread_id, reply.threadId);
  assert.equal(stored.reply_to, '<reply-invented-1@fixture.example>');
  assert.equal(stored.created, new Date(Number(reply.internalDate)).toISOString());
  assert.equal(stored.body, 'Grazie, leggeremo la proposta.');
  assert.equal(stored.status, 'received');
  assert.equal(f.state().leads[0].stage, 'contacted');
  assert.equal(f.state().leads[0].suppressed, 0);
  const receipt = f.store.one('SELECT * FROM gr_mail_receipts WHERE message_id=?',stored.id);
  assert.equal(receipt.google_email, 'mittente@fixture.example');
  assert.match(receipt.fingerprint,/^[a-f0-9]{64}$/);
  assert.deepEqual(await sync(f), {checked:1,received:0,skipped:1,review:0,errors:0,totalThreads:1,batchLimit:10});
  assert.deepEqual(incoming(f), [stored]);
  assert.equal(f.state().jobs.length, jobsBefore);
  assert.equal(aiRequests(f).length, aiBefore);
  assert.equal(sendRequests(f).length, 1);
  assert.ok(f.state().conversations.lastAttempt);
  assert.ok(f.state().conversations.lastSuccess);
  for (const call of threadRequests(f)) {
    assert.equal(new URL(call.url).pathname.split('/threads/')[1], reply.threadId);
    assert.equal(new URL(call.url).searchParams.get('format'), 'full');
  }
});

test('rifiuto: interrompe il contatto, annulla bozza e approvazioni e ferma il lavoro accodato', async t => {
  const {f,m} = await sentFixture(t);
  const next = await followup(f,m);
  await f.approve(next);
  const approved = await f.preview(next.id);
  const job = await f.call('POST', '/jobs', {type:'draft',leadId:m.lead_id});
  const aiBefore = aiRequests(f).length;
  f.control.thread = threadFor(f,m.id,[replyTo(f,m.id,{text:'Non siamo interessati. Non contattateci più.'})]);
  assert.equal((await sync(f)).received, 1);
  assert.equal(incoming(f)[0].status, 'handled');
  assert.equal(f.state().leads[0].suppressed, 1);
  assert.ok(f.store.one('SELECT 1 FROM gr_suppressions WHERE workspace=? AND email=?','demo-bigant','destinatario1@fixture.example'));
  assert.equal(f.store.one('SELECT status FROM gr_messages WHERE id=?',next.id).status,'cancelled');
  assert.equal(f.store.one('SELECT decision FROM gr_approvals WHERE message_id=?',next.id).decision,'cancelled');
  assert.equal(f.store.one('SELECT status FROM os_approvals WHERE entity_id=? ORDER BY version DESC',next.id).status,'superseded');
  assert.equal(f.store.one('SELECT status FROM gr_jobs WHERE id=?',job.id).status,'failed');
  await assert.rejects(f.send(approved));
  assert.equal(sendRequests(f).length,1);
  assert.equal(aiRequests(f).length,aiBefore);
});

test('risposta ordinaria invalida la bozza approvata senza dedurre interesse commerciale o consenso', async t => {
  const {f,m} = await sentFixture(t);
  const next = await followup(f,m);
  await f.approve(next);
  const leadBefore = f.state().leads[0];
  f.control.thread = threadFor(f,m.id,[replyTo(f,m.id,{text:'Ne parleremo tra noi.'})]);
  await sync(f);
  assert.equal(f.store.one('SELECT status FROM gr_messages WHERE id=?',next.id).status,'cancelled');
  assert.equal(f.state().leads[0].consent,leadBefore.consent);
  assert.equal(f.state().leads[0].stage,leadBefore.stage);
  assert.equal(f.state().leads[0].suppressed,0);
});

test('ancora originale obbligatoria: identificativi, destinatari, oggetto, Message-ID, SENT e data', async t => {
  const mutations = {
    'invio assente': data => data.messages.shift(),
    'id errato': data => {data.messages[0].id='other-sent';},
    'thread errato': data => {data.messages[0].threadId='other-thread';},
    'mittente errato': data => header(data.messages[0],'From','altro@fixture.example'),
    'destinatario errato': data => header(data.messages[0],'To','altro@fixture.example'),
    'destinatari multipli': data => header(data.messages[0],'To','destinatario1@fixture.example, altro@fixture.example'),
    'oggetto errato': data => header(data.messages[0],'Subject','Altra conversazione'),
    'Message-ID errato': data => header(data.messages[0],'Message-ID','<altro@fixture.example>'),
    'SENT assente': data => {data.messages[0].labelIds=['INBOX'];},
    'data troppo antica': data => {data.messages[0].internalDate='1';},
    'data futura': data => {data.messages[0].internalDate=String(Date.now()+3600000);},
    'header duplicato': data => data.messages[0].payload.headers.push({name:'from',value:'mittente@fixture.example'}),
    'thread di risposta diverso': data => {data.id='other-thread';},
  };
  for (const [name,mutate] of Object.entries(mutations)) await t.test(name,async t => {
    const {f,m} = await sentFixture(t);
    const data = threadFor(f,m.id,[replyTo(f,m.id)]);
    mutate(data); f.control.thread=data;
    assert.equal((await sync(f)).errors,1);
    assert.equal(incoming(f).length,0);
    assert.equal(f.state().conversations.lastSuccess,null);
    assert.match(f.store.one('SELECT error FROM gr_mail_thread_checks').error,/verifica nella casella/);
  });
});

test('header ambigui, date incoerenti e thread malformati non producono importazioni parziali', async t => {
  const mutations = {
    'mittente mancante': raw => header(raw,'From'),
    'destinatario mancante': raw => header(raw,'To'),
    'To duplicato': raw => raw.payload.headers.push({name:'to',value:'mittente@fixture.example'}),
    'più destinatari': raw => header(raw,'To','mittente@fixture.example; altro@fixture.example'),
    'header con newline': raw => header(raw,'From','destinatario1@fixture.example\r\nBcc: altro@fixture.example'),
    'Message-ID mancante': raw => header(raw,'Message-ID'),
    'data mancante': raw => {delete raw.internalDate;},
    'data antica': raw => {raw.internalDate='1';},
    'data futura': raw => {raw.internalDate=String(Date.now()+3600000);},
    'id non valido': raw => {raw.id='../wrong';},
    'thread non corrispondente': raw => {raw.threadId='unrelated-thread';},
    'charset oggetto ignoto': raw => header(raw,'Subject','=?not-a-charset?B?YWJj?='),
  };
  for (const [name,mutate] of Object.entries(mutations)) await t.test(name,async t => {
    const {f,m} = await sentFixture(t);
    const broken = replyTo(f,m.id,{id:'broken-invented'});
    mutate(broken);
    f.control.thread = threadFor(f,m.id,[replyTo(f,m.id),broken]);
    assert.equal((await sync(f)).errors,1);
    assert.equal(incoming(f).length,0);
    assert.equal(f.store.query('SELECT * FROM gr_mail_receipts').length,0);
  });
  const {f,m} = await sentFixture(t);
  f.control.thread = threadFor(f,m.id,[replyTo(f,m.id),replyTo(f,m.id)]);
  assert.equal((await sync(f)).errors,1);
  f.control.thread = threadFor(f,m.id,Array.from({length:100},(_,i)=>replyTo(f,m.id,{id:'reply-'+i})));
  assert.equal((await sync(f)).errors,1);
  assert.equal(incoming(f).length,0);
});

test('MIME: testo preferito, HTML reso testo e allegati mai scaricati né usati per classificare', async t => {
  const {f,m} = await sentFixture(t);
  const plain = replyTo(f,m.id,{id:'plain-alternative'});
  plain.payload = {mimeType:'multipart/mixed',headers:plain.payload.headers,parts:[
    {mimeType:'multipart/alternative',parts:[
      {mimeType:'text/plain',body:{data:encoded('Testo inline attendibile.')}},
      {mimeType:'text/html',body:{data:encoded('<p>Non siamo interessati</p>')}},
    ]},
    {mimeType:'text/plain',filename:'allegato.txt',body:{attachmentId:'attachment-invented'}},
    {mimeType:'text/plain',headers:[{name:'Content-Disposition',value:'attachment'}],body:{data:encoded('Non contattateci')}},
  ]};
  const html = replyTo(f,m.id,{id:'html-only'});
  html.payload.mimeType='text/html';
  html.payload.body={data:encoded('<style>Non contattateci</style><script>fetch("https://tracking.example/")</script><p>Grazie &amp; a presto.</p><blockquote>Non siamo interessati</blockquote><img src="https://tracking.example/pixel"><p>&#67;iao.</p>')};
  const quoted = replyTo(f,m.id,{id:'plain-quoted',text:'Grazie della risposta.\nOn yesterday wrote:\n> Non siamo interessati.'});
  const before=f.calls.length;
  f.control.thread = threadFor(f,m.id,[plain,html,quoted]);
  const result=await sync(f);
  assert.equal(result.received,3); assert.equal(result.review,0);
  assert.equal(incoming(f).find(x=>x.provider_id===plain.id).body,'Testo inline attendibile.');
  assert.equal(incoming(f).find(x=>x.provider_id===html.id).body,'Grazie & a presto.\nCiao.');
  assert.equal(f.state().leads[0].suppressed,0);
  assert.ok(f.calls.slice(before).every(c=>c.url.endsWith('/token')||c.url.includes('/threads/')));
});

test('testo assente, incompleto o ambiguo richiede il socio; nessuna bozza automatica', async t => {
  const {f,m} = await sentFixture(t);
  const cases = [
    raw => {raw.payload.body={attachmentId:'body-invented'};},
    raw => {raw.payload.body={data:'%%%invalid'};},
    raw => {raw.payload.body={data:encoded('x'.repeat(8100))};},
    raw => {raw.payload.body={data:Buffer.from([0xff]).toString('base64url')};},
    raw => header(raw,'Cc','terzo@fixture.example'),
  ];
  f.control.thread = threadFor(f,m.id,cases.map((change,i)=>{const raw=replyTo(f,m.id,{id:'manual-'+i});change(raw);return raw;}));
  const aiBefore=aiRequests(f).length, jobsBefore=f.state().jobs.length;
  const result=await sync(f);
  assert.equal(result.received,cases.length); assert.equal(result.review,cases.length);
  for(const row of incoming(f)) {assert.equal(row.status,'needs_owner');assert.ok(row.body.length<=8000);assert.match(row.error,/Gmail/);}
  const repeated=await sync(f);assert.equal(repeated.received,0);assert.equal(repeated.review,cases.length);
  assert.equal(f.state().leads[0].suppressed,0);
  assert.equal(aiRequests(f).length,aiBefore);
  assert.equal(f.state().jobs.length,jobsBefore);
});

test('limiti MIME impediscono importazioni con profondità, numero parti o testo eccessivi',async t=>{
  for(const mode of ['depth','parts','bytes']) await t.test(mode,async t=>{
    const {f,m}=await sentFixture(t),raw=replyTo(f,m.id),rootHeaders=raw.payload.headers;
    if(mode==='depth'){let part={mimeType:'text/plain',body:{data:encoded('testo')}};for(let i=0;i<12;i++)part={mimeType:'multipart/mixed',parts:[part]};raw.payload={...part,headers:rootHeaders};}
    if(mode==='parts')raw.payload={mimeType:'multipart/mixed',headers:rootHeaders,parts:Array.from({length:101},()=>({mimeType:'text/plain',body:{data:encoded('testo')}}))};
    if(mode==='bytes')raw.payload={mimeType:'text/plain',headers:rootHeaders,body:{data:encoded('a'.repeat(65000))}};
    f.control.thread=threadFor(f,m.id,[raw]);
    assert.equal((await sync(f)).errors,1);assert.equal(incoming(f).length,0);
  });
});

test('inviati, bozze, spam, cestino e risposte automatiche ignorati; interlocutore diverso da verificare',async t=>{
  const {f,m}=await sentFixture(t);
  const replies=['SENT','DRAFT','TRASH','SPAM'].map((label,i)=>replyTo(f,m.id,{id:'ignored-'+i,labelIds:[label]}));
  const auto=replyTo(f,m.id,{id:'auto'});header(auto,'Auto-Submitted','auto-replied');replies.push(auto);
  const bulk=replyTo(f,m.id,{id:'bulk'});header(bulk,'Precedence','bulk');replies.push(bulk);
  const other=replyTo(f,m.id,{id:'other-address'});header(other,'From','terzo@fixture.example');replies.push(other);
  f.control.thread=threadFor(f,m.id,replies);
  assert.deepEqual(await sync(f),{checked:1,received:0,skipped:7,review:1,errors:0,totalThreads:1,batchLimit:10});
  assert.equal(incoming(f).length,0);
  assert.equal(f.state().leads[0].suppressed,0);
});

test('replay alterato non sovrascrive la prova e annulla tutto il lotto del thread',async t=>{
  const {f,m}=await sentFixture(t);
  f.control.thread=threadFor(f,m.id,[replyTo(f,m.id)]);
  await sync(f);
  const original=incoming(f)[0],receipt=f.store.one('SELECT * FROM gr_mail_receipts');
  const lastSuccess=f.state().conversations.lastSuccess;
  f.control.thread=threadFor(f,m.id,[replyTo(f,m.id,{id:'new-before-replay',text:'Non contattateci più.'}),replyTo(f,m.id,{text:'Testo alterato dopo importazione.'})]);
  const result=await sync(f);
  assert.equal(result.errors,1);assert.equal(result.received,0);
  assert.deepEqual(incoming(f),[original]);
  assert.deepEqual(f.store.one('SELECT * FROM gr_mail_receipts'),receipt);
  assert.equal(f.state().leads[0].suppressed,0);
  assert.equal(f.state().conversations.lastSuccess,lastSuccess);
});

test('lettura dei rifiuti disponibile con invii in pausa e fase Gmail sospesa',async t=>{
  const {f,m}=await sentFixture(t);
  await f.call('POST','/settings',{paused:true});
  await f.call('POST','/mail/activate',{version:f.state().mail.version,enabled:false});
  assert.equal(f.state().mail.enabled,false);
  assert.equal(f.state().conversations.canSync,true);
  f.control.thread=threadFor(f,m.id,[replyTo(f,m.id,{text:'Non contattateci più.'})]);
  assert.equal((await sync(f)).received,1);
  assert.equal(f.state().leads[0].suppressed,1);
  assert.equal(sendRequests(f).length,1);
});

test('intenti incerti, altra casella, altro workspace e indirizzo contatto cambiato non autorizzano la lettura',async t=>{
  for(const mode of ['uncertain','mailbox','workspace','contact']) await t.test(mode,async t=>{
    const {f,m}=await sentFixture(t);
    if(mode==='uncertain')f.store.run("UPDATE gr_mail_intents SET status='uncertain' WHERE message_id=?",m.id);
    if(mode==='mailbox')f.store.run("UPDATE os_google_authorization SET email='altra@fixture.example'");
    if(mode==='contact')await f.call('PATCH','/leads/'+m.lead_id,{email:'nuovo@fixture.example'});
    const before=threadRequests(f).length;
    const result=mode==='workspace'?await f.call('POST','/mail/sync',{confirmed:true},f.owner,'demo-bottega'):await sync(f);
    assert.equal(result.totalThreads,0);assert.equal(threadRequests(f).length,before);assert.equal(incoming(f).length,0);
  });
});

test('revoca OAuth, socio inattivo o attività sospesa durante rete impediscono il salvataggio',async t=>{
  for(const stage of ['token','thread'])for(const mode of ['oauth','owner','workspace'])await t.test(stage+' '+mode,async t=>{
    const {f,m}=await sentFixture(t);
    f.control.thread=threadFor(f,m.id,[replyTo(f,m.id)]);
    let changed=false;
    f.control.before=async url=>{
      if(changed||!(stage==='token'?url.endsWith('/token'):url.includes('/threads/')))return;
      changed=true;
      if(mode==='oauth')f.googleAuth.invalidate();
      if(mode==='owner')f.store.run('UPDATE os_users SET active=0 WHERE id=?',f.owner.id);
      if(mode==='workspace')f.store.run("UPDATE os_clients SET active=0 WHERE id='demo-bigant'");
    };
    await assert.rejects(sync(f));
    assert.equal(changed,true);assert.equal(incoming(f).length,0);
    assert.equal(f.store.one('SELECT last_success FROM gr_mail_sync_state').last_success,null);
    assert.equal(JSON.parse(f.store.one('SELECT result_json FROM gr_mail_sync_state').result_json).interrupted,true);
    if(stage==='token')assert.equal(threadRequests(f).length,0);
  });
});

test('contatto modificato durante lettura rende il thread incompleto senza conservare la risposta',async t=>{
  const {f,m}=await sentFixture(t);
  f.control.thread=async()=>{
    const data=threadFor(f,m.id,[replyTo(f,m.id)]);
    await f.call('PATCH','/leads/'+m.lead_id,{email:'nuovo@fixture.example'});
    return data;
  };
  assert.equal((await sync(f)).errors,1);
  assert.equal(incoming(f).length,0);
  assert.equal(f.state().conversations.running,false);
  assert.equal(f.state().conversations.eligibleThreads,0);
});

test('doppia sincronizzazione: un solo accesso al thread e lock rilasciato anche dopo errore',async t=>{
  const {f,m}=await sentFixture(t),entered=deferred(),release=deferred();
  t.after(()=>release.resolve());
  f.control.thread=async()=>{entered.resolve();await release.promise;return threadFor(f,m.id,[replyTo(f,m.id)]);};
  const pending=sync(f);await entered.promise;
  assert.equal(f.state().conversations.running,true);
  await assert.rejects(sync(f),/già in corso/);
  assert.equal(threadRequests(f).length,1);
  release.resolve();await pending;
  assert.equal(f.state().conversations.running,false);
  f.control.thread={id:'broken',messages:[]};
  assert.equal((await sync(f)).errors,1);
  assert.equal(f.state().conversations.running,false);
});

test('risposta durante rinnovo token annulla un invio non partito',async t=>{
  const {f,m}=await sentFixture(t),next=await followup(f,m);
  await f.approve(next);const preview=await f.preview(next.id);
  const entered=deferred(),release=deferred();let held=false;
  t.after(()=>release.resolve());
  f.control.before=async url=>{if(!held&&url.endsWith('/token')){held=true;entered.resolve();await release.promise;}};
  f.control.thread=threadFor(f,m.id,[replyTo(f,m.id)]);
  const pending=assert.rejects(f.send(preview));
  await entered.promise;await sync(f);release.resolve();await pending;
  assert.equal(sendRequests(f).length,1);
  assert.equal(f.store.one('SELECT status FROM gr_mail_intents WHERE message_id=?',next.id).status,'safe_failed');
  assert.notEqual(f.store.one('SELECT status FROM gr_messages WHERE id=?',next.id).status,'approved');
  assert.equal(f.store.one('SELECT decision FROM gr_approvals WHERE message_id=?',next.id).decision,'cancelled');
});

test('nuova risposta durante preparazione AI impedisce il salvataggio della bozza superata',async t=>{
  const {f,m}=await sentFixture(t);
  f.control.thread=threadFor(f,m.id,[replyTo(f,m.id)]);await sync(f);
  await f.call('POST','/jobs',{type:'draft',kind:'reply',leadId:m.lead_id,incomingId:incoming(f)[0].id});
  const entered=deferred(),release=deferred();t.after(()=>release.resolve());
  f.control.before=async url=>{if(url.includes('api.openai.com')){entered.resolve();await release.promise;}};
  const pending=f.call('POST','/jobs/run');await entered.promise;
  f.control.thread=threadFor(f,m.id,[replyTo(f,m.id),replyTo(f,m.id,{id:'new-during-ai',text:'Aggiornamento: ne riparliamo più avanti.'})]);
  await sync(f);release.resolve();const result=await pending;
  assert.equal(result.job.status,'failed');assert.match(result.job.error,/conversazione.*cambiata/);
  assert.equal(f.store.query("SELECT * FROM gr_messages WHERE direction='out'").length,1);
  assert.equal(incoming(f).length,2);
  assert.equal(sendRequests(f).length,1);
});

test('lotto di dieci conversazioni e rotazione: i thread più vecchi non escludono gli altri',async t=>{
  const f=mailFixture(t);await f.enable();await f.call('POST','/settings',{dailyLimit:50});
  const threads=new Map();
  for(let i=0;i<11;i++){
    const m=await f.draft();await f.approve(m);await f.send(await f.preview(m.id));
    const data=threadFor(f,m.id,[replyTo(f,m.id,{id:'batch-reply-'+i})]);threads.set(data.id,data);
  }
  f.control.thread=url=>threads.get(new URL(url).pathname.split('/threads/')[1]);
  const first=await sync(f);assert.equal(first.totalThreads,11);assert.equal(first.checked,10);assert.equal(first.received,10);
  const checked=new Set(threadRequests(f).map(c=>new URL(c.url).pathname.split('/threads/')[1]));
  const second=await sync(f);assert.equal(second.received,1);assert.equal(second.checked,10);assert.equal(second.skipped,9);
  assert.equal(incoming(f).length,11);
  assert.ok(!checked.has(new URL(threadRequests(f)[10].url).pathname.split('/threads/')[1]));
});

test('risposta precedente all’invio di un solo millisecondo rifiutata; stesso istante ammesso',async t=>{
  const {f,m}=await sentFixture(t);
  const sentAt=Date.parse(f.store.one('SELECT sent FROM gr_messages WHERE id=?',m.id).sent);
  const reply=replyTo(f,m.id,{internalDate:String(sentAt-1)});
  f.control.thread=threadFor(f,m.id,[reply]);
  const rejected=await sync(f);
  assert.equal(rejected.errors,1);
  assert.equal(rejected.received,0);
  assert.equal(incoming(f).length,0);
  assert.equal(f.store.query('SELECT * FROM gr_mail_receipts').length,0);
  reply.internalDate=String(sentAt);
  const accepted=await sync(f);
  assert.equal(accepted.errors,0);
  assert.equal(accepted.received,1);
  assert.equal(incoming(f)[0].created,new Date(sentAt).toISOString());
});

test('email needs_owner blocca reply, initial e followup prima della chiamata AI',async t=>{
  for(const kind of ['reply','initial','followup'])await t.test(kind,async t=>{
    const {f,m}=await sentFixture(t);
    const raw=replyTo(f,m.id);
    raw.payload.body={attachmentId:'body-da-leggere-in-gmail'};
    f.control.thread=threadFor(f,m.id,[raw]);
    await sync(f);
    const source=incoming(f)[0];
    assert.equal(source.status,'needs_owner');
    const aiBefore=aiRequests(f).length;
    const approvalsBefore=f.store.query("SELECT * FROM os_approvals WHERE kind='growth_message'");
    await f.call('POST','/jobs',{type:'draft',kind,leadId:m.lead_id,...(kind==='reply'?{incomingId:source.id}:{})});
    const result=await f.call('POST','/jobs/run');
    assert.equal(result.job.status,'failed');
    assert.equal(aiRequests(f).length,aiBefore,'Una conversazione da verificare non deve essere inviata alla AI');
    assert.equal(f.store.query("SELECT * FROM gr_messages WHERE direction='out'").length,1);
    assert.deepEqual(f.store.query("SELECT * FROM os_approvals WHERE kind='growth_message'"),approvalsBefore);
    assert.equal(incoming(f)[0].status,'needs_owner');
  });
});

test('multipart mixed conserva un rifiuto HTML insieme alla firma plain, anche dentro alternative annidato',async t=>{
  for(const nested of [false,true])await t.test(nested?'alternative annidato':'parti sorelle',async t=>{
    const {f,m}=await sentFixture(t);
    const raw=replyTo(f,m.id);
    const refusal={mimeType:'text/html',body:{data:encoded('<p>Non siamo interessati. Non contattateci più.</p>')}};
    raw.payload={mimeType:'multipart/mixed',headers:raw.payload.headers,parts:[
      nested?{mimeType:'multipart/alternative',parts:[refusal]}:refusal,
      {mimeType:'text/plain',body:{data:encoded('Cordiali saluti, Team Azienda inventata.')}},
    ]};
    f.control.thread=threadFor(f,m.id,[raw]);
    const aiBefore=aiRequests(f).length;
    const result=await sync(f);
    assert.equal(result.errors,0);
    assert.equal(result.received,1);
    assert.match(incoming(f)[0].body,/Non siamo interessati/);
    assert.match(incoming(f)[0].body,/Cordiali saluti, Team Azienda inventata/);
    assert.equal(incoming(f)[0].status,'handled');
    assert.equal(f.state().leads[0].suppressed,1);
    assert.equal(aiRequests(f).length,aiBefore);
  });
});

test('una email più vecchia non può guidare una risposta quando ne è arrivata una nuova: blocco prima AI',async t=>{
  const {f,m}=await sentFixture(t);
  const older=replyTo(f,m.id,{id:'older-email',text:'Prima richiesta inventata.'});
  const newer=replyTo(f,m.id,{id:'newer-email',text:'Questa è la richiesta aggiornata.',internalDate:String(Number(older.internalDate)+1000)});
  // Provider order is deliberately unrelated to received time.
  f.control.thread=threadFor(f,m.id,[newer,older]);
  assert.equal((await sync(f)).received,2);
  const oldSource=incoming(f).find(x=>x.provider_id===older.id);
  const newSource=incoming(f).find(x=>x.provider_id===newer.id);
  assert.equal(oldSource.status,'received');
  assert.equal(newSource.status,'received');
  const aiBefore=aiRequests(f).length;
  await f.call('POST','/jobs',{type:'draft',kind:'reply',leadId:m.lead_id,incomingId:oldSource.id});
  const outdated=await f.call('POST','/jobs/run');
  assert.equal(outdated.job.status,'failed');
  assert.equal(aiRequests(f).length,aiBefore);
  assert.equal(f.store.query("SELECT * FROM gr_messages WHERE direction='out'").length,1);
  await f.call('POST','/jobs',{type:'draft',kind:'reply',leadId:m.lead_id,incomingId:newSource.id});
  const current=await f.call('POST','/jobs/run');
  assert.equal(current.job.status,'done',current.job.error);
  assert.equal(aiRequests(f).length,aiBefore+1);
  const draft=f.store.one("SELECT * FROM gr_messages WHERE direction='out' AND status='draft'");
  assert.equal(draft.reply_to,'<newer-email@fixture.example>');
  assert.equal(draft.thread_id,newer.threadId);
});

test('risposta importata vincolata al contatto e alla casella originali prima della chiamata AI',async t=>{
  for(const changed of ['contact','mailbox'])await t.test(changed,async t=>{
    const {f,m}=await sentFixture(t);
    f.control.thread=threadFor(f,m.id,[replyTo(f,m.id)]);
    await sync(f);
    const source=incoming(f)[0],aiBefore=aiRequests(f).length;
    if(changed==='contact'){
      await f.call('PATCH','/leads/'+m.lead_id,{email:'nuovo-destinatario@fixture.example'});
      await f.call('PATCH','/leads/'+m.lead_id,{consent:'marketing',consent_proof:'Consenso inventato del nuovo destinatario'});
      assert.equal(f.state().leads[0].consent,'marketing');
    }else{
      f.store.run("UPDATE os_google_authorization SET email='nuova-casella@fixture.example'");
      await f.call('POST','/settings',{senderEmail:'nuova-casella@fixture.example'});
    }
    await f.call('POST','/jobs',{type:'draft',kind:'reply',leadId:m.lead_id,incomingId:source.id});
    const result=await f.call('POST','/jobs/run');
    assert.equal(result.job.status,'failed');
    assert.equal(aiRequests(f).length,aiBefore,'La nuova identità non autorizza l’uso AI della conversazione precedente');
    assert.equal(f.store.query("SELECT * FROM gr_messages WHERE direction='out'").length,1);
    assert.deepEqual(incoming(f),[source]);
    assert.equal(sendRequests(f).length,1);
  });
});

test('bozza reply non riapprovabile né inviabile sul vecchio thread dopo cambio contatto o casella',async t=>{
  for(const changed of ['contact','mailbox'])await t.test(changed,async t=>{
    const {f,m}=await sentFixture(t);
    f.control.thread=threadFor(f,m.id,[replyTo(f,m.id)]);
    await sync(f);
    await f.call('POST','/jobs',{type:'draft',kind:'reply',leadId:m.lead_id,incomingId:incoming(f)[0].id});
    const prepared=await f.call('POST','/jobs/run');
    assert.equal(prepared.job.status,'done',prepared.job.error);
    const draft=f.state().messages.find(row=>row.kind==='reply'&&row.direction==='out');
    assert.equal(draft.thread_id,f.control.thread.id);
    await f.approve(draft);
    const oldPreview=await f.preview(draft.id);
    assert.equal(oldPreview.canSend,true);
    if(changed==='contact'){
      await f.call('PATCH','/leads/'+m.lead_id,{email:'altro-destinatario@fixture.example'});
      await f.call('PATCH','/leads/'+m.lead_id,{consent:'marketing',consent_proof:'Consenso inventato separato per il nuovo destinatario'});
      assert.equal(f.state().leads[0].consent,'marketing');
    }else{
      f.store.run("UPDATE os_google_authorization SET email='altra-casella@fixture.example'");
      await f.call('POST','/settings',{senderEmail:'altra-casella@fixture.example'});
    }
    await assert.rejects(f.send(oldPreview));
    // Use the current approval version so rejection cannot be explained by a stale UI.
    const currentDraft=f.state().messages.find(row=>row.id===draft.id);
    await assert.rejects(f.approve(currentDraft));
    assert.notEqual(f.store.one('SELECT status FROM gr_messages WHERE id=?',draft.id).status,'approved');
    assert.equal(f.store.one('SELECT * FROM gr_mail_intents WHERE message_id=?',draft.id),undefined);
    assert.equal(sendRequests(f).length,1);
  });
});

test('data risposta confrontata con l’invio Gmail verificato, non con la conferma HTTP locale',async t=>{
  const {f,m}=await sentFixture(t);
  const localAck=Date.parse(f.store.one('SELECT sent FROM gr_messages WHERE id=?',m.id).sent);
  const gmailSent=localAck-1000;
  const validReply=replyTo(f,m.id,{id:'reply-before-local-ack',internalDate:String(localAck-500)});
  const data=threadFor(f,m.id,[validReply]);
  data.messages[0].internalDate=String(gmailSent);
  assert.ok(gmailSent<Number(validReply.internalDate)&&Number(validReply.internalDate)<localAck);
  f.control.thread=data;
  const accepted=await sync(f);
  assert.equal(accepted.errors,0);
  assert.equal(accepted.received,1);
  const stored=incoming(f)[0];
  assert.equal(stored.created,new Date(localAck-500).toISOString());
  data.messages.push(replyTo(f,m.id,{id:'reply-before-gmail-anchor',internalDate:String(gmailSent-1)}));
  const rejected=await sync(f);
  assert.equal(rejected.errors,1);
  assert.equal(rejected.received,0);
  assert.deepEqual(incoming(f),[stored]);
});

test('incomingId non può aggirare i controlli usando initial, followup o un tipo sconosciuto',async t=>{
  const cases=[
    {kind:'initial',changed:true},
    {kind:'followup',changed:true},
    {kind:'valore-sconosciuto',changed:true},
    {kind:'initial',changed:false},
  ];
  for(const {kind,changed} of cases)await t.test(kind+(changed?' dopo cambio identità':' con identità invariata'),async t=>{
    const {f,m}=await sentFixture(t);
    f.control.thread=threadFor(f,m.id,[replyTo(f,m.id)]);
    await sync(f);
    const source=incoming(f)[0];
    if(changed){
      await f.call('PATCH','/leads/'+m.lead_id,{email:'nuovo-contatto@fixture.example'});
      await f.call('PATCH','/leads/'+m.lead_id,{consent:'marketing',consent_proof:'Consenso inventato per il nuovo contatto'});
      assert.equal(f.state().leads[0].consent,'marketing');
    }
    const aiBefore=aiRequests(f).length;
    const jobsBefore=f.state().jobs.length;
    const approvalsBefore=f.store.query("SELECT * FROM os_approvals WHERE kind='growth_message'");
    const request={type:'draft',kind,leadId:m.lead_id,incomingId:source.id};
    if(kind==='valore-sconosciuto'){
      await assert.rejects(f.call('POST','/jobs',request),/Tipo di messaggio non valido/);
      assert.equal(f.state().jobs.length,jobsBefore);
    }else{
      await f.call('POST','/jobs',request);
      const result=await f.call('POST','/jobs/run');
      assert.equal(result.job.status,'failed');
    }
    assert.equal(aiRequests(f).length,aiBefore,'La fonte di una risposta è ammessa soltanto con kind reply');
    assert.equal(f.store.query("SELECT * FROM gr_messages WHERE direction='out'").length,1);
    assert.deepEqual(f.store.query("SELECT * FROM os_approvals WHERE kind='growth_message'"),approvalsBefore);
    assert.deepEqual(incoming(f),[source]);
    assert.equal(sendRequests(f).length,1);
  });
});
