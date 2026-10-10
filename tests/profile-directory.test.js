import test from 'node:test';
import assert from 'node:assert/strict';
import {openStore,seedCore} from '../src/store.js';
import {createProfileDirectory} from '../src/profile-directory.js';
import {createWorkspace} from '../src/workspace.js';

// Only invented profiles and source URLs. No lookup, browser or provider runs.
const source='https://directory.example.com/attivita/fixture';
const links={instagram:'https://www.instagram.com/fixture_company/',facebook:'https://www.facebook.com/fixture.company/',linkedin:'https://www.linkedin.com/company/fixture-company/',tiktok:'https://www.tiktok.com/@fixture.company','google-business':'https://www.google.com/maps?cid=1234567890123456789',website:'https://business.example.com/'};
function fixture(t){
 const store=openStore();seedCore(store);t.after(()=>store.close());let date='2026-10-10T10:00:00.000Z';
 const directory=createProfileDirectory({store,clock:()=>new Date(date)}),owner=store.one("SELECT * FROM os_users WHERE id='demo-owner'"),client=store.one("SELECT * FROM os_users WHERE id='demo-client'"),collaborator=store.one("SELECT * FROM os_users WHERE id='demo-collaborator'"),other=store.one("SELECT * FROM os_users WHERE id='demo-client-other'");
 let network=0;t.mock.method(globalThis,'fetch',()=>{network++;throw Error('Rete vietata nei test Profili');});
 const body=(channel,version=0)=>({version,url:links[channel],sourceUrl:source,confirmedBusiness:true});
 const save=(channel='instagram',b=body(channel),user=owner,clientId='demo-bigant')=>directory.save(user,clientId,channel,b);
 return {store,directory,owner,client,other,collaborator,body,save,setDate:value=>date=value,network:()=>network};
}
function noWrite(f,read){const before=f.store.one('SELECT total_changes() n').n,result=read();assert.equal(f.store.one('SELECT total_changes() n').n,before);assert.equal(f.network(),0);return result;}
const entry=(view,id)=>view.items.find(item=>item.id===id);

test('sei canali aziendali, nessun dato inventato e nessuna scrittura alla consultazione',t=>{
 const f=fixture(t),view=noWrite(f,()=>f.directory.state(f.owner,'demo-bigant'));
 assert.deepEqual(Object.keys(view).sort(),['canEdit','clientId','items']);assert.equal(view.canEdit,true);assert.deepEqual(view.items.map(item=>item.id),Object.keys(links));
 for(const item of view.items){assert.deepEqual(Object.keys(item).sort(),['id','lastSync','link','metrics','name','reviews','status']);assert.equal(item.status,'Da collegare');for(const key of ['lastSync','metrics','reviews','link'])assert.equal(item[key],null);}
 assert.equal(f.store.one('SELECT COUNT(*) n FROM os_profile_links').n,0);
});
test('salvataggio manuale espone fonte e versione senza dichiarare account collegato',t=>{
 const f=fixture(t);for(const channel of Object.keys(links)){const view=f.save(channel),item=entry(view,channel);assert.deepEqual(item.link,{url:links[channel],sourceUrl:source,version:1,updatedAt:'2026-10-10T10:00:00.000Z',confirmation:'owner'});assert.equal(item.status,'Da collegare');assert.equal(item.metrics,null);assert.equal(item.reviews,null);assert.equal(item.lastSync,null);}
 assert.equal(f.store.one('SELECT COUNT(*) n FROM os_profile_links').n,6);assert.equal(f.network(),0);noWrite(f,()=>f.directory.state(f.owner,'demo-bigant'));
});
test('cliente legge soltanto la propria attività; collaboratore assegnato e robot esclusi',t=>{
 const f=fixture(t);f.save('instagram',f.body('instagram'),f.owner,f.client.tenant_id);const own=noWrite(f,()=>f.directory.state(f.client,f.client.tenant_id));assert.equal(own.canEdit,false);assert.equal(entry(own,'instagram').link.version,1);
 for(const user of [null,f.collaborator,{...f.collaborator,role:'owner'},{id:'os-orchestrator',role:'owner',active:1},{id:'inesistente',role:'owner',active:1}]){assert.throws(()=>f.directory.state(user,f.client.tenant_id),e=>e.status===403);assert.throws(()=>f.save('instagram',f.body('instagram'),user,f.client.tenant_id),e=>e.status===403);}
 assert.throws(()=>f.directory.state(f.client,f.other.tenant_id),e=>e.status===403);assert.throws(()=>f.save('website',f.body('website'),f.client,f.client.tenant_id),e=>e.status===403);assert.throws(()=>f.save('website',f.body('website'),{...f.client,role:'owner'},f.client.tenant_id),e=>e.status===403);
});
test('ruolo, tenant, disattivazioni e password da cambiare si rileggono dal database',t=>{
 for(const change of ['role','user','client','password']){const f=fixture(t);if(change==='role')f.store.run("UPDATE os_users SET role='collaborator' WHERE id=?",f.owner.id);if(change==='user')f.store.run('UPDATE os_users SET active=0 WHERE id=?',f.owner.id);if(change==='client')f.store.run("UPDATE os_clients SET active=0 WHERE id='demo-bigant'");if(change==='password')f.store.run('UPDATE os_users SET must_change_password=1 WHERE id=?',f.owner.id);assert.throws(()=>f.directory.state(f.owner,'demo-bigant'),e=>e.status===403);assert.throws(()=>f.save(),e=>e.status===403);assert.equal(f.store.one('SELECT COUNT(*) n FROM os_profile_links').n,0);}
 const f=fixture(t);f.store.run('UPDATE os_users SET tenant_id=? WHERE id=?',f.other.tenant_id,f.client.id);assert.throws(()=>f.directory.state(f.client,f.client.tenant_id),e=>e.status===403);assert.equal(f.directory.state(f.client,f.other.tenant_id).canEdit,false);
});
test('cliente sconosciuto, canale sconosciuto e corpo JSON malformato sono errori controllati',t=>{
 const f=fixture(t);assert.throws(()=>f.directory.state(f.owner,'manca'),e=>e.status===403);assert.throws(()=>f.directory.state(f.owner,null),e=>e.status===403);assert.throws(()=>f.save('mastodon',f.body('instagram')),e=>e.status===404);
 for(const body of [null,[],false,'testo',{},Object.create(null)])assert.throws(()=>f.save('instagram',body),e=>e.status===400);
 for(const version of [-1,0.5,'0',null,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>f.save('instagram',{...f.body('instagram'),version}),e=>e.status===400);
 for(const confirmation of [false,'true',1,null,undefined])assert.throws(()=>f.save('instagram',{...f.body('instagram'),confirmedBusiness:confirmation}),e=>e.status===400);
 assert.equal(f.store.one('SELECT COUNT(*) n FROM os_profile_links').n,0);
});
test('campi sconosciuti non possono simulare sincronizzazioni, recensioni o proprietà',t=>{
 const f=fixture(t);for(const key of ['status','metrics','lastSync','reviews','clientId','channel','confirmedBy','updatedAt','link','__proto__']){const body=JSON.parse(JSON.stringify({...f.body('instagram'),[key]:key==='metrics'?{followers:100}:'inventato'}));assert.throws(()=>f.save('instagram',body),e=>e.status===400);}
 assert.equal(f.store.one('SELECT COUNT(*) n FROM os_profile_links').n,0);
});
test('versioni concorrenti generano 409 e storico immutabile, anche con istanze diverse',t=>{
 const f=fixture(t),other=createProfileDirectory({store:f.store}),first=f.body('instagram');f.save('instagram',first);assert.throws(()=>other.save(f.owner,'demo-bigant','instagram',first),e=>e.status===409);
 f.setDate('2026-10-10T11:00:00.000Z');const second={...first,version:1,url:'https://instagram.com/fixture_updated',sourceUrl:'https://directory.example.com/seconda-fonte'},view=f.save('instagram',second);assert.equal(entry(view,'instagram').link.version,2);assert.equal(entry(view,'instagram').link.url,second.url);
 const history=f.store.query("SELECT * FROM os_profile_links WHERE client_id='demo-bigant' AND channel='instagram' ORDER BY version");assert.equal(history.length,2);assert.equal(history[0].url,first.url);assert.equal(history[1].source_url,second.sourceUrl);assert.equal(history[1].confirmed_by,f.owner.id);assert.equal(history[1].updated_at,'2026-10-10T11:00:00.000Z');
 assert.throws(()=>f.store.run("UPDATE os_profile_links SET url='https://other.example.com'"),/immutabile/);assert.throws(()=>f.store.run('DELETE FROM os_profile_links'),/immutabile/);assert.throws(()=>f.save('instagram',{...second,version:1}),e=>e.status===409);noWrite(f,()=>f.directory.state(f.owner,'demo-bigant'));
});
test('versione separata per attività e canale, nessuna contaminazione di link o fonte',t=>{
 const f=fixture(t);f.save();f.save('website');const other={...f.body('instagram'),url:'https://instagram.com/another_fixture',sourceUrl:'https://other.example.com/fonte'};f.save('instagram',other,f.owner,f.client.tenant_id);
 assert.equal(entry(f.directory.state(f.owner,'demo-bigant'),'instagram').link.url,links.instagram);assert.equal(entry(f.directory.state(f.client,f.client.tenant_id),'instagram').link.url,other.url);assert.equal(entry(f.directory.state(f.client,f.client.tenant_id),'website').link,null);assert.equal(entry(f.directory.state(f.owner,'demo-bigant'),'website').link.version,1);
});
test('audit solo metadati; un audit fallito annulla anche salvataggio e nuova versione',t=>{
 const f=fixture(t);f.save();const audit=f.store.one("SELECT * FROM os_audit WHERE action='Profilo pubblico aggiornato'");assert.equal(audit.client_id,'demo-bigant');assert.equal(audit.entity_id,'instagram');assert.equal(audit.user_id,f.owner.id);assert.deepEqual(JSON.parse(audit.detail),{channel:'instagram',version:1,confirmation:'owner'});assert.ok(!JSON.stringify(audit).includes('https:'));assert.ok(!JSON.stringify(audit).includes('fixture_company'));
 const original=f.store.audit;f.store.audit=()=>{throw Error('Audit indisponibile nella fixture');};assert.throws(()=>f.save('instagram',{...f.body('instagram',1),url:'https://instagram.com/other_fixture'}),/Audit indisponibile/);assert.throws(()=>f.save('website'),/Audit indisponibile/);f.store.audit=original;
 assert.equal(f.store.one('SELECT COUNT(*) n FROM os_profile_links').n,1);assert.equal(entry(f.directory.state(f.owner,'demo-bigant'),'instagram').link.version,1);assert.equal(entry(f.directory.state(f.owner,'demo-bigant'),'website').link,null);assert.equal(f.store.one("SELECT COUNT(*) n FROM os_audit WHERE action='Profilo pubblico aggiornato'").n,1);
});
test('URL HTTPS canonici: host normalizzato e porta standard ammessa',t=>{
 const f=fixture(t);const view=f.save('instagram',{...f.body('instagram'),url:' HTTPS://WWW.INSTAGRAM.COM:443/fixture_company/ '});assert.equal(entry(view,'instagram').link.url,links.instagram);f.save('website',{...f.body('website'),url:'https://sito.example.com/percorso%20pubblico'});assert.equal(f.network(),0);
});
test('protocolli, credenziali, host privati/locali, porte e controlli sono rifiutati per link e fonte',t=>{
 const f=fixture(t);const bad=['http://public.example.com','javascript:alert(1)','data:text/html,testo','file:///tmp/test','https://user:pass@public.example.com','https://user@public.example.com','https://public.example.com:8443','https://public.example.com:80','https://localhost/','https://localhost./','https://sub.localhost/','https://box.local/','https://machine.internal/','https://intranet/','https://127.0.0.1/','https://127.1/','https://2130706433/','https://0x7f000001/','https://10.0.0.1/','https://172.16.0.1/','https://192.168.1.1/','https://100.64.0.1/','https://169.254.169.254/','https://[::1]/','https://[fc00::1]/','https://public.example.com/#profilo','https://public.example.com/#','https://public.example.com/?','https://public.example.com/a\nb','https://public.example.com/%0a','https://public.example.com/%00','https://public.example.com/%5c','https://public.example.com\\@evil.example.com','https://public.example.com/a/../b','https://public.example.com/a/%2e%2e/b'];
 for(const value of bad){assert.throws(()=>f.save('website',{...f.body('website'),url:value}),e=>e.status===400,value);assert.throws(()=>f.save('instagram',{...f.body('instagram'),sourceUrl:value}),e=>e.status===400,value);}
 assert.equal(f.store.one('SELECT COUNT(*) n FROM os_profile_links').n,0);assert.equal(f.network(),0);
});
test('parametri riservati, redirect e frammenti non possono finire nello storico',t=>{
 const f=fixture(t);for(const suffix of ['?token=segreto','?access_token=segreto','?code=codice','?password=password','?next=https://evil.example.com','?utm_source=social','#access_token=segreto']){assert.throws(()=>f.save('website',{...f.body('website'),url:links.website+suffix}));assert.throws(()=>f.save('instagram',{...f.body('instagram'),sourceUrl:source+suffix}));assert.throws(()=>f.save('instagram',{...f.body('instagram'),url:links.instagram+suffix}));}assert.equal(f.store.one('SELECT COUNT(*) n FROM os_profile_links').n,0);
});
test('profili social richiedono host e percorso del canale; LinkedIn personale sempre escluso',t=>{
 const f=fixture(t),bad={instagram:['https://instagram.com.evil.example.com/fixture','https://www.instagram.com/p/ABC','https://www.instagram.com/reel/ABC','https://www.instagram.com/accounts/login','https://www.instagram.com/explore/','https://instagram.com/','https://www.instagram.com/fixture/../other','https://www.instagram.com/fixture%2fother'],facebook:['https://www.facebook.com/groups/123','https://www.facebook.com/events/123','https://www.facebook.com/sharer.php','https://www.facebook.com/login/','https://www.facebook.com/fixture/posts/123','https://fb.me/ABC'],linkedin:['https://www.linkedin.com/in/fixture','https://www.linkedin.com/school/fixture','https://www.linkedin.com/company/fixture/admin','https://www.linkedin.com/feed','https://linkedin.com.evil.example.com/company/fixture'],tiktok:['https://www.tiktok.com/@fixture/video/123','https://www.tiktok.com/fixture','https://vm.tiktok.com/ABC']};
 for(const [channel,urls] of Object.entries(bad))for(const url of urls)assert.throws(()=>f.save(channel,{...f.body(channel),url}),e=>e.status===400,url);
 assert.equal(f.store.one('SELECT COUNT(*) n FROM os_profile_links').n,0);
});
test('Facebook pagina con identificativo: solo id numerico unico e senza altri parametri',t=>{
 const f=fixture(t);for(const url of ['https://www.facebook.com/profile.php?id=1000123456789','https://m.facebook.com/pages/Fixture-Company/123456789']){const version=entry(f.directory.state(f.owner,'demo-bigant'),'facebook').link?.version||0;assert.equal(entry(f.save('facebook',{...f.body('facebook',version),url}),'facebook').link.url,url);}
 for(const url of ['https://www.facebook.com/profile.php','https://www.facebook.com/profile.php?id=abc','https://www.facebook.com/profile.php?id=12345&id=67890','https://www.facebook.com/profile.php?id=12345&access_token=secret'])assert.throws(()=>f.save('facebook',{...f.body('facebook',2),url}));
});
test('Google Business accetta Maps luogo/cid/ricerca e link brevi riconosciuti, senza risolverli',t=>{
 const f=fixture(t),valid=['https://www.google.com/maps?cid=1234567890123456789','https://maps.google.it/?cid=123456789','https://www.google.it/maps/place/Azienda+Inventata/','https://www.google.com/maps/place/Azienda%20Inventata/@41.1,14.1,17z/data=!3m1!4b1','https://www.google.com/maps/search/?api=1&query=Azienda+Inventata&query_place_id=ChIJfixture1234','https://maps.google.com/?q=Azienda+Inventata','https://www.google.com/maps?q=place_id:ChIJfixture1234&hl=it','https://maps.app.goo.gl/Abc123Fixture','https://g.page/azienda-fixture','https://g.page/r/Abc123Fixture','https://g.co/kgs/Abc123'];
 valid.forEach((url,version)=>{const view=f.save('google-business',{...f.body('google-business',version),url,sourceUrl:url});assert.equal(entry(view,'google-business').link.url,new URL(url).href);});assert.equal(f.network(),0);
});
test('Google Business rifiuta host simili, editor privati e query ambigue o riservate',t=>{
 const f=fixture(t),bad=['https://business.google.com/locations','https://www.google.com/search?q=azienda','https://google.com.evil.example.com/maps?cid=123456','https://www.google.com/maps','https://www.google.com/maps/directions/?q=azienda','https://www.google.com/maps?cid=123&cid=456','https://www.google.com/maps?cid=123&token=secret','https://www.google.com/maps?cid=123&url=https://evil.example.com','https://www.google.com/maps/search/?api=2&query=azienda','https://www.google.com/maps/search/?api=1&query=azienda&authuser=0','https://www.google.com/maps/search/?query=azienda&q=altra','https://www.google.com/maps/search/?query=%20%20','https://www.google.com/maps/search/?query=https://evil.example.com','https://www.google.com/maps/search/?query=azienda&query_place_id=%3Cscript%3E','https://maps.app.goo.gl/Abc123?token=secret','https://g.co/redirect?url=https://evil.example.com'];
 for(const url of bad)assert.throws(()=>f.save('google-business',{...f.body('google-business'),url}),e=>e.status===400,url);assert.equal(f.store.one('SELECT COUNT(*) n FROM os_profile_links').n,0);
});
test('campi mancanti o troppo lunghi non sono troncati silenziosamente',t=>{
 const f=fixture(t);for(const patch of [{url:''},{url:null},{sourceUrl:''},{sourceUrl:null},{url:'https://'+('a'.repeat(2050))+'.com'},{sourceUrl:'https://directory.example.com/'+('a'.repeat(2050))}])assert.throws(()=>f.save('instagram',{...f.body('instagram'),...patch}),e=>e.status===400);assert.equal(f.store.one('SELECT COUNT(*) n FROM os_profile_links').n,0);
});
test('workspace delega gli stessi permessi e dati al registro Profili',t=>{
 const f=fixture(t),workspace=createWorkspace({store:f.store,clock:()=>new Date('2026-10-10T12:00:00.000Z')});const saved=workspace.saveProfile(f.owner,'demo-bigant','website',f.body('website'));assert.equal(entry(saved,'website').link.updatedAt,'2026-10-10T12:00:00.000Z');assert.deepEqual(noWrite(f,()=>workspace.profiles(f.owner,'demo-bigant')),f.directory.state(f.owner,'demo-bigant'));assert.throws(()=>workspace.saveProfile(f.client,f.client.tenant_id,'website',f.body('website')),e=>e.status===403);
});
