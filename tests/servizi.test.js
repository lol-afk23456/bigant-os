import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createApp} from '../server.js';
import {catalogoServizi,pacchetti,corrispondenze} from '../src/servizi/catalogo.js';
import {kpiServizio} from '../src/servizi/kpi.js';
import {services,agentDefinitions,integrations} from '../src/registry.js';
import {agentiSciame} from '../src/sciame/agenti.js';

const codici=Array.from({length:19},(_,i)=>'S'+String(i+1).padStart(2,'0'));
function fixture(t){const a=createApp({motore:'demo'});t.after(()=>a.close());const u=id=>a.store.one('SELECT * FROM os_users WHERE id=?',id);return {...a,owner:u('demo-owner'),client:u('demo-client'),other:u('demo-client-other'),team:u('demo-collaborator')};}

test('R-011: il catalogo S01–S19 nasce dalle schede del playbook con flusso, agenti, KPI, approvazioni e strumenti',()=>{
 assert.deepEqual(catalogoServizi.map(s=>s.codice),codici);
 const kinds=['content','sciame_output','agent_output','growth_message','fidelity_campaign'];
 for(const s of catalogoServizi){
  assert.ok(existsSync(s.scheda),s.scheda);assert.ok(s.nome&&s.statoPlaybook,s.codice);
  assert.ok(s.flusso.length&&s.kpi.length&&s.strumenti.length&&s.include.length,'scheda incompleta '+s.codice);
  for(const id of s.registro)assert.ok(services.some(x=>x.id===id),`${s.codice}: servizio ${id} non nel registro`);
  for(const id of s.agenti)assert.ok(agentDefinitions.some(x=>x.id===id),`${s.codice}: agente ${id}`);
  for(const id of s.sciame)assert.ok(agentiSciame[id],`${s.codice}: agente sciame ${id}`);
  if(s.codice==='S14')assert.deepEqual(s.approvazioni,[], 'Il registro manuale non crea campagne o approvazioni di invio');
  else assert.ok(s.approvazioni.length&&s.approvazioni.every(k=>kinds.includes(k)),s.codice);
  for(const id of s.integrazioni)assert.ok(integrations.some(x=>x.id===id),`${s.codice}: integrazione ${id}`);
 }
 assert.equal(catalogoServizi.find(s=>s.codice==='S04').statoPlaybook,'ATTIVO (Meta) · DA ATTIVARE (LinkedIn, TikTok)');
 assert.deepEqual(Object.keys(corrispondenze),codici);
});

test('pacchetti del catalogo: composizione in codici validi e prezzi solo da validare',()=>{
 assert.deepEqual(pacchetti.map(p=>p.id),['presenza','crescita-locale','sanita','ristorazione','brand']);
 for(const p of pacchetti){assert.ok(p.servizi.every(c=>codici.includes(c)));assert.match(p.stato,/DA VALIDARE/);}
 assert.deepEqual(pacchetti[0].servizi,['S06','S07','S08','S17','S18']);
});

test('R-012: KPI per servizio con fonte dichiarata; nessun valore senza fonte e piattaforme esterne come collegamento mancante',async t=>{
 const a=fixture(t);
 for(const c of codici){
  const r=kpiServizio(a.store,'demo-bottega',c);assert.ok(r.kpi.length>=catalogoServizi.find(x=>x.codice===c).kpi.length);
  for(const k of r.kpi){assert.ok(k.fonte,c);assert.ok(['DEMO','OPERATIVO','COLLEGAMENTO MANCANTE','SOLO STRUTTURA'].includes(k.stato));if(k.valore===null)assert.notEqual(k.stato,'DEMO');else assert.ok(['DEMO','OPERATIVO'].includes(k.stato));}
 }
 for(const c of ['S03','S04','S05'])assert.ok(kpiServizio(a.store,'demo-bottega',c).kpi.every(k=>k.stato==='COLLEGAMENTO MANCANTE'&&k.valore===null),c);
 // Accessi del cliente: misura reale dal registro accessi.
 await new Promise(r=>a.server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+a.server.address().port;
 await fetch(origin+'/api/demo/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({profile:'demo-client'})});
 assert.equal(kpiServizio(a.store,'demo-bottega','S18').kpi.find(k=>/accessi/.test(k.kpi)).valore,'1');
});

test('R-007 R-259: dashboard cliente riordinata: card, servizi propri e soli contratti',async t=>{
 const a=fixture(t);
 const g=a.sciame.creaGiro(a.owner,{richiesta:'Social e GBP',flussi:['social','local']});await a.sciame.eseguiGiro(g.id);
 const d=a.cliente.dashboard(a.client,'demo-bottega');
 assert.deepEqual(d.sezioni.map(x=>x.id),['home','servizi','documenti']);
 assert.deepEqual(d.sezioni.find(x=>x.id==='servizi').attivi.map(x=>x.id).sort(),['fidelity','local','social','website']);
 const testo=JSON.stringify(d);for(const vietato of ['os_fin_','anomal','margin','prelievo','Collaboratore Delta','opening_cents','approvazioni','chiedi','squadra'])assert.ok(!testo.includes(vietato),'dato interno esposto: '+vietato);
 assert.equal(d.sezioni.find(x=>x.id==='documenti').fatture,undefined);
 assert.throws(()=>a.cliente.dashboard(a.client,'demo-studio'),/accessibile/);
 assert.throws(()=>a.cliente.dashboard(a.team,'demo-bottega'),e=>e.status===403);
 const studio=a.cliente.dashboard(a.other,'demo-studio');assert.ok(!studio.servizi.includes('fidelity'));assert.equal(studio.sezioni[0].servicesCount,studio.servizi.length);
 await new Promise(r=>a.server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+a.server.address().port;
 const login=async p=>{const r=await fetch(origin+'/api/demo/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({profile:p})});return r.headers.get('set-cookie').split(';')[0];};
 const c=await login('demo-client');
 assert.equal((await fetch(origin+'/api/cliente/dashboard',{headers:{Cookie:c}})).status,200);
 assert.equal((await fetch(origin+'/api/cliente/dashboard?clientId=demo-studio',{headers:{Cookie:c}})).status,403);
 assert.equal((await fetch(origin+'/api/catalogo',{headers:{Cookie:c}})).status,403);
 assert.equal((await fetch(origin+'/api/catalogo',{headers:{Cookie:await login('demo-owner')}})).status,200);
});
