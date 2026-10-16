import test from 'node:test';
import assert from 'node:assert/strict';
import {createGrowthLiveProviders} from '../src/growth-live-providers.js';

const appointment={id:'abcd1234abcd1234',start:'2026-11-10T10:00:00.000Z',end:'2026-11-10T10:30:00.000Z',marker:'a'.repeat(64),lead:{company:'Azienda inventata',email:'INVITATO@fixture.example',notes:'Nota interna che non deve uscire dal CRM'}};
const json=(value,status=200)=>new Response(status===204?null:JSON.stringify(value),{status});
function fixture({respond,allow=()=>true}={}){
 const calls=[],gates=[];
 const provider=createGrowthLiveProviders({settings:()=>({calendarId:'calendario@fixture.example'}),credentials:async()=>({clientId:'inventato',clientSecret:'inventato',refreshToken:'inventato'}),allow:async(...args)=>{gates.push(args);return allow(...args);},fetchImpl:async(url,options)=>{calls.push({url:String(url),options});return String(url).endsWith('/token')?json({access_token:'inventato'}):respond?respond(String(url),options):json({id:appointment.id,status:'confirmed'});}});
 return {provider,calls,gates};
}

test('Calendar invia solo il contenuto pubblico, un destinatario e la prova OS',async()=>{
 const f=fixture();await f.provider.book('w',appointment);
 const request=f.calls.at(-1),payload=JSON.parse(request.options.body);
 assert.equal(payload.summary,'BigAnt · Azienda inventata');
 assert.equal(payload.description,'Chiamata conoscitiva concordata con il team BigAnt.');
 assert.deepEqual(payload.attendees,[{email:'invitato@fixture.example'}]);
 assert.deepEqual(payload.extendedProperties,{private:{bigantOS:appointment.marker}});
 assert.equal(payload.visibility,'private');assert.equal(payload.guestsCanModify,false);assert.equal(payload.guestsCanInviteOthers,false);
 assert.ok(!request.options.body.includes(appointment.lead.notes));
 assert.equal(request.options.headers.Authorization,'Bearer inventato');
 assert.match(request.url,/calendario%40fixture\.example\/events\?sendUpdates=all$/);
 assert.deepEqual(f.gates.map(row=>row[2].stage),[undefined,'dispatch','result']);
});

test('Calendar non spedisce dopo revoca durante il rinnovo Google e non conferma dopo revoca al risultato',async()=>{
 for(const stage of ['dispatch','result']){
  const f=fixture({allow:(_w,_op,context)=>context.stage!==stage});
  await assert.rejects(f.provider.book('w',appointment),/non autorizzata/);
  assert.equal(f.calls.length,stage==='dispatch'?1:2);
 }
});

test('Calendar respinge date inesistenti e marcature invalide prima di aprire Google',async()=>{
 const f=fixture();
 for(const details of [{...appointment,start:'2026-02-30T10:00:00Z',end:'2026-03-02T10:30:00Z'},{...appointment,marker:'non una prova OS'},{...appointment,lead:{...appointment.lead,email:'a@b.example,c@d.example'}}])await assert.rejects(f.provider.book('w',details));
 assert.equal(f.calls.length,0);
});

test('Calendar cancella la sola versione verificata e mantiene l’errore di concorrenza remoto',async()=>{
 const f=fixture({respond:(_url,options)=>{assert.equal(options.method,'DELETE');assert.equal(options.headers['If-Match'],'"versione-fixture"');return json({error:'Concorrenza'},412);}});
 await assert.rejects(f.provider.cancelEvent('w',appointment.id,{etag:'"versione-fixture"'}),error=>error.remoteStatus===412);
 assert.equal(f.calls.length,2);
 await assert.rejects(f.provider.cancelEvent('w',appointment.id,{etag:'x\r\nHeader: value'}),/Versione/);
 assert.equal(f.calls.length,2);
});

test('Calendar non interpreta intervalli remoti malformati come disponibilità libera',async()=>{
 for(const value of [{},{busy:[{start:'2026-02-30T10:00:00Z',end:'2026-03-02T10:30:00Z'}]},{busy:[],errors:[{reason:'forbidden'}]}]){
  const f=fixture({respond:()=>json({calendars:{'calendario@fixture.example':value}})});
  await assert.rejects(f.provider.busy('w',appointment.start,appointment.end),/non verificabile/);
 }
});
