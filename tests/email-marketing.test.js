import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.js';
import {catalogoServizi,codiciPerServiziRegistro} from '../src/servizi/catalogo.js';
import {kpiServizio} from '../src/servizi/kpi.js';

const clientId='demo-bottega',otherId='demo-studio';
function fixture(t){
 let time=new Date('2026-10-10T10:00:00Z');const clock=()=>time,app=createApp({env:{},clock}),s=app.store;
 t.after(()=>app.close());const user=id=>s.one('SELECT * FROM os_users WHERE id=?',id);
 const enable=id=>{const active=JSON.parse(s.one('SELECT services_json FROM os_clients WHERE id=?',id).services_json);s.run('UPDATE os_clients SET services_json=? WHERE id=?',JSON.stringify([...new Set([...active,'email-marketing'])]),id);};
 enable(clientId);return {app,s,m:app.emailMarketing,owner:user('demo-owner'),client:user('demo-client'),other:user('demo-client-other'),team:user('demo-collaborator'),enable,advance:date=>{time=new Date(date);}};
}
const entry={email:'contatto@example.com',name:'Contatto inventato',consentDate:'2026-10-09',source:'Modulo di prova numero 1',privacyVersion:'Informativa di prova v1',confirmed:true};
const fails=(fn,status)=>assert.throws(fn,error=>error.status===status);

test('Email marketing autonomo: fonte propria, nessuna importazione Growth/Fidelity, anteprima equivalente',t=>{
 const {m,app,owner,client,s}=fixture(t);
 assert.ok(!codiciPerServiziRegistro(['growth','fidelity']).includes('S14'));
 assert.deepEqual(codiciPerServiziRegistro(['email-marketing']),['S14']);
 assert.equal(catalogoServizi.find(row=>row.codice==='S14').nome,'Email marketing');
 assert.equal(m.state(client,clientId).counts.total,0);
 m.add(owner,clientId,entry);
 assert.deepEqual(m.state(owner,clientId),m.state(client,clientId));
 assert.deepEqual(app.cliente.service(owner,clientId,'email-marketing'),app.cliente.service(client,clientId,'email-marketing'));
 const view=app.cliente.service(client,clientId,'email-marketing');
 assert.equal(view.emailMarketing.counts.granted,1);assert.ok(view.reports.every(report=>report.metriche.every(row=>row.valore===null)));
 assert.equal(view.emailMarketing.sendingEnabled,false);
 const kpi=kpiServizio(s,clientId,'S14');assert.ok(JSON.stringify(kpi).includes('Registro contatti Email marketing'));
 assert.ok(!JSON.stringify(kpi).includes('Fidelity'));assert.ok(!JSON.stringify(kpi).includes('Growth'));
});

test('Email marketing: identità corrente, attività, servizio e collaboratore assegnato controllati sul server',t=>{
 const {m,s,owner,client,other,team,enable}=fixture(t);enable(otherId);
 fails(()=>m.state({...client,role:'owner',tenant_id:otherId},otherId),403);
 fails(()=>m.state(null,clientId),403);fails(()=>m.add(team,clientId,entry),403);
 assert.equal(m.state(team,clientId).canManage,false);
 s.run('DELETE FROM os_assignments WHERE user_id=? AND client_id=?',team.id,clientId);fails(()=>m.state(team,clientId),403);
 s.run("UPDATE os_users SET active=0 WHERE id=?",owner.id);fails(()=>m.add(owner,clientId,entry),403);
 s.run("UPDATE os_users SET must_change_password=1 WHERE id=?",client.id);fails(()=>m.state(client,clientId),403);
 s.run("UPDATE os_users SET must_change_password=0 WHERE id=?",client.id);
 s.run("UPDATE os_clients SET services_json='[]' WHERE id=?",clientId);fails(()=>m.state(client,clientId),403);fails(()=>m.add(client,clientId,entry),403);
 enable(clientId);s.run('UPDATE os_clients SET active=0 WHERE id=?',clientId);fails(()=>m.state(client,clientId),403);
 assert.equal(m.state(other,otherId).counts.total,0);
});

test('Email marketing: sessione assente, scaduta o appartenente ad altri non accede ai contatti',t=>{
 const {m,s,owner,client}=fixture(t);
 s.run('INSERT INTO os_sessions VALUES(?,?,?,?)','em-session',client.id,'fake-csrf',Date.parse('2026-10-10T11:00:00Z'));
 assert.equal(m.state({...client,session_id:'em-session'},clientId).counts.total,0);
 fails(()=>m.state({...owner,session_id:'em-session'},clientId),401);
 fails(()=>m.state({...client,session_id:'missing'},clientId),401);
 s.run("UPDATE os_sessions SET expires_at=1 WHERE id='em-session'");fails(()=>m.add({...client,session_id:'em-session'},clientId,entry),401);
});

test('Email marketing: prove incomplete, date impossibili/future e indirizzi invalidi non producono scritture',t=>{
 const {m,s,owner}=fixture(t),before=s.query('SELECT * FROM os_audit');
 for(const patch of [{source:''},{privacyVersion:''},{confirmed:false},{consentDate:'2026-02-30'},{consentDate:'2026-10-11'},{email:'a@b-.com'},{email:'a@example.com\nBcc:x@example.com'},{email:'a..b@example.com'},{name:'x'.repeat(141)}])fails(()=>m.add(owner,clientId,{...entry,...patch}),400);
 fails(()=>m.add(owner,clientId,null),400);
 assert.equal(s.one('SELECT COUNT(*) n FROM em_contacts').n,0);assert.equal(s.one('SELECT COUNT(*) n FROM em_consents').n,0);assert.deepEqual(s.query('SELECT * FROM os_audit'),before);
});

test('Email marketing: duplicati normalizzati, storico e identificativi isolati per attività',t=>{
 const {m,owner,client,other,enable}=fixture(t);enable(otherId);
 const a=m.add(client,clientId,{...entry,email:' CONTATTO@example.com '});
 fails(()=>m.add(owner,clientId,entry),409);
 m.add(other,otherId,entry);assert.equal(m.state(other,otherId).counts.total,1);
 fails(()=>m.history(other,otherId,a.id),404);
 fails(()=>m.consent(other,otherId,a.id,{version:1,status:'withdrawn',source:'Prova'}),404);
 assert.equal(m.history(client,clientId,a.id).events.length,1);
});

test('Email marketing: revoca, conflitti e nuovo consenso richiedono nuova prova',t=>{
 const {m,s,client,advance}=fixture(t),a=m.add(client,clientId,entry);
 m.consent(client,clientId,a.id,{version:1,status:'withdrawn',source:'Richiesta revoca inventata'});
 assert.equal(m.state(client,clientId).counts.granted,0);
 fails(()=>m.consent(client,clientId,a.id,{version:1,status:'granted',...entry}),409);
 fails(()=>m.consent(client,clientId,a.id,{version:2,status:'granted',...entry}),400);
 fails(()=>m.consent(client,clientId,a.id,{version:2,status:'withdrawn',source:'Richiesta doppia'}),409);
 advance('2026-10-11T10:00:00Z');m.consent(client,clientId,a.id,{...entry,version:2,status:'granted',consentDate:'2026-10-11',source:'Nuova prova numero 2'});
 assert.equal(m.state(client,clientId).counts.granted,1);assert.equal(m.history(client,clientId,a.id).events.length,3);
 const audit=s.query("SELECT detail FROM os_audit WHERE action LIKE '%Email marketing%'");assert.ok(!JSON.stringify(audit).includes(entry.email));assert.ok(!JSON.stringify(audit).includes(entry.source));
});

test('Email marketing: storico non alterabile neppure con INSERT OR REPLACE, letture senza scritture',t=>{
 const {m,s,client}=fixture(t),a=m.add(client,clientId,entry);
 assert.throws(()=>s.run('UPDATE em_consents SET source=? WHERE contact_id=?','alterata',a.id),/immutabile/);
 assert.throws(()=>s.run('DELETE FROM em_consents WHERE contact_id=?',a.id),/immutabile/);
 assert.throws(()=>s.run('INSERT OR REPLACE INTO em_consents SELECT * FROM em_consents WHERE contact_id=?',a.id),/immutabile/);
 const before=s.db.prepare('SELECT total_changes() n').get().n;
 m.state(client,clientId);m.history(client,clientId,a.id);
 assert.equal(s.db.prepare('SELECT total_changes() n').get().n,before);
});

test('Email marketing: pagine limitate, ricerca letterale e contatti altrui esclusi',t=>{
 const {m,client,other,enable}=fixture(t);enable(otherId);
 for(let i=0;i<52;i++)m.add(client,clientId,{...entry,email:'test'+String(i).padStart(2,'0')+'@example.com'});
 m.add(other,otherId,{...entry,name:'Altra attività'});
 const first=m.state(client,clientId);assert.equal(first.items.length,50);assert.equal(first.total,52);assert.equal(first.pages,2);
 const last=m.state(client,clientId,{page:2});assert.equal(last.items.length,2);assert.ok(!last.items.some(row=>first.items.some(x=>x.id===row.id)));
 assert.equal(m.state(client,clientId,{q:'TEST51'}).items.length,1);
 assert.equal(m.state(client,clientId,{q:'%'}).items.length,0);
 assert.equal(m.state(client,clientId,{q:"' OR 1=1 --"}).items.length,0);
 for(const page of [0,-1,1.5,'abc',100001])fails(()=>m.state(client,clientId,{page}),400);
});
