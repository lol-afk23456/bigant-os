// Scenario dimostrativo completo (brief 0.4, punto 7) con un solo comando:
//   npm run scenario                         motore DEMO deterministico, archivio in memoria
//   npm run scenario -- --motore claude-code agenti eseguiti da Claude Code
//   npm run scenario -- --salva-prove        salva il resoconto in docs/demo-scenario/
// Solo dati DEMO. Pubblicazioni, invii, SDI e pagamenti restano bloccati dal codice.
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createApp} from '../server.js';
import {aziendeDemo} from '../src/sciame/dati-demo.js';
import {ETICHETTE} from '../src/motori/index.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const euro=c=>(c/100).toLocaleString('it-IT',{minimumFractionDigits:2})+' €';
const oggi=()=>new Date().toISOString().slice(0,10);

export async function eseguiScenario({motore='demo',database=':memory:',log=()=>{}}={}){
 const app=createApp({database,motore});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+app.server.address().port,s=app.store,owner=s.one("SELECT * FROM os_users WHERE id='demo-owner'");
 const passi=[];let ctx={};
 const passo=async(n,titolo,fn)=>{const inizio=Date.now();try{const prova=await fn();passi.push({n,titolo,esito:'ok',prova,secondi:Math.round((Date.now()-inizio)/1000)});log(`${String(n).padStart(2)} ✔ ${titolo} · ${prova}`);}catch(e){passi.push({n,titolo,esito:'errore',prova:e.message});log(`${String(n).padStart(2)} ✖ ${titolo} · ${e.message}`);throw e;}};
 const http=async(path,{method='GET',body,sessione})=>{const r=await fetch(origin+path,{method,headers:{Cookie:sessione.cookie,'X-CSRF-Token':sessione.csrf,Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const j=await r.json();if(!r.ok)throw new Error(j.error||('HTTP '+r.status));return j;};
 const accedi=async body=>{const r=await fetch(origin+(body.profile?'/api/demo/login':'/api/login'),{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error(j.error);return {cookie:r.headers.get('set-cookie').split(';')[0],csrf:j.csrf,user:j.user};};
 const amm=(method,path,body={})=>app.administration.handle({method,path,body:{idempotencyKey:'scenario-'+path+'-'+(body.sourceRef||body.name||''),...body},user:owner,clientId:'demo-bigant'});
 const giro=app.sciame.creaGiro(owner,{richiesta:'Scenario dimostrativo a 13 passaggi: dal lead all’upsell',flussi:['commerciale','local','amministrazione']});
 s.run("UPDATE os_sciame_giri SET stato='in_corso',started_at=? WHERE id=?",new Date().toISOString(),giro.id);
 const passoSciame=agente=>s.query('SELECT * FROM os_sciame_passi WHERE giro_id=? AND agente=? ORDER BY ordine DESC',giro.id,agente)[0];
 const approvato=p=>p&&['completato','in_attesa_approvazione'].includes(p.stato)&&s.one("SELECT status FROM os_approvals WHERE id=?",p.approvazione_id)?.status==='approved';
 try{
  await passo(1,'Nasce un lead dalla ricerca clienti',async()=>{
   await app.sciame.flussi.commerciale(giro);
   const p=passoSciame('ricerca-clienti');if(!approvato(p))throw new Error(`Ricerca non approvata da Qualità (${p?.stato}): ${p?.errore||p?.esito_qualita||''}`);
   const lead=app.growth.store.query('SELECT * FROM leads WHERE id=?',JSON.parse(p.output_json).scelto_lead_id)[0];ctx.lead=lead;
   return `${lead.company} · punteggio ${lead.score}/100 nel CRM Growth · motore ${p.motore}`;
  });
  await passo(2,'Si genera l’analisi gratuita (S17)',async()=>{
   const p=passoSciame('analisi-gratuita');if(!approvato(p))throw new Error(`Analisi non approvata (${p?.stato}): ${p?.errore||p?.esito_qualita||''}`);
   const o=JSON.parse(p.output_json);ctx.analisi=o;
   if(!app.growth.store.query('SELECT analysis FROM leads WHERE id=?',ctx.lead.id)[0].analysis)throw new Error('Analisi non salvata sul lead.');
   return `Punteggio presenza ${o.punteggio_presenza}/100, ${o.azioni_consigliate.length} azioni consigliate, report salvato sul lead`;
  });
  await passo(3,'Si prepara la proposta del pacchetto Presenza',async()=>{
   const p=passoSciame('proposta-commerciale');if(!approvato(p))throw new Error(`Proposta non approvata (${p?.stato}): ${p?.errore||''}`);
   const invio=s.one("SELECT * FROM os_azioni_esterne WHERE passo_id=? AND tipo='invio_email'",p.id);if(!invio)throw new Error('Invio non registrato come bloccato.');
   const o=JSON.parse(p.output_json);return `${o.pacchetto}: setup ${o.prezzo.setup}, canone ${o.prezzo.canone_mensile}; invio email bloccato`;
  });
  await passo(4,'Il contratto viene accettato',async()=>{
   const conv=(await app.growth.handle({method:'POST',path:`/leads/${ctx.lead.id}/convert`,user:owner,clientId:'demo-bigant'})).data;ctx.clientId=conv.client.id;
   s.run('UPDATE os_clients SET services_json=? WHERE id=?',JSON.stringify(['local','presence']),ctx.clientId);
   const cp=(await amm('POST','/counterparties',{kind:'client',name:conv.client.name,clientId:ctx.clientId,documentRef:'Anagrafica DEMO'})).data;
   const c=(await amm('POST','/contracts',{entityId:'demo-entity-b',counterpartyId:cp.id,clientId:ctx.clientId,service:'presence',amountCents:19900,startDate:oggi().slice(0,7)+'-01',endDate:new Date(Date.now()+365*86400000).toISOString().slice(0,10),noticeDays:60,documentRef:'Contratto DEMO pacchetto Presenza (importo DEMO, prezzo da validare)'})).data;ctx.contratto=c;ctx.controparte=cp;
   const ev=app.orchestrator.event('contract.signed',ctx.clientId,c.id);
   return `Cliente ${conv.client.name} creato dal lead; contratto ${euro(c.amount_cents)}/mese registrato (evento contract.signed ${ev.eventId.slice(0,8)})`;
  });
  await passo(5,'Si fa l’onboarding',async()=>{
   app.production.saveMemory(owner,ctx.clientId,'master',`# ${ctx.lead.company}\n\nCliente DEMO acquisito con il pacchetto Presenza.\n\n## Punto di partenza (analisi S17)\n${ctx.analisi.sintesi}`,'Scenario · analisi gratuita');
   app.production.saveMemory(owner,ctx.clientId,'dna','DNA DEMO · Tono professionale e rassicurante, nessuna promessa di risultato, nessun dato clinico. [DA VERIFICARE con il cliente]','Scenario · onboarding');
   for(const [title,due] of [['Raccogliere l’accesso da gestore alla scheda Google (in 04_ACCESSI, mai letto dagli agenti)',3],['Approvare il DNA con il cliente',5],['Registrare l’autorizzazione portfolio (sì/no)',7]])await app.production.handle({method:'POST',path:'/tasks',body:{title,service:'local',assignee:'Vincenzo',due:new Date(Date.now()+due*86400000).toISOString(),estimate_minutes:30},user:owner,clientId:ctx.clientId});
   const password=randomBytes(18).toString('base64url');
   const u=await http('/api/users',{method:'POST',body:{role:'client',name:'Titolare DEMO',email:`titolare-${ctx.clientId.slice(-6)}@cliente.example`,password,clientId:ctx.clientId},sessione:ctx.sessioneSocio||(ctx.sessioneSocio=await accedi({profile:'demo-owner'}))});
   ctx.sessioneCliente=await accedi({email:`titolare-${ctx.clientId.slice(-6)}@cliente.example`,password});
   const j=app.orchestrator.enqueue(owner,ctx.clientId,'account');await app.orchestrator.tick(ctx.clientId);
   const out=JSON.parse(s.one('SELECT result FROM os_jobs WHERE id=?',j.id).result);
   return `Memoria master e DNA, 3 attività di onboarding, accesso cliente ${u.id.slice(0,8)} creato; agente Account: ${out.summary}`;
  });
  await passo(6,'Gli agenti producono i contenuti del mese',async()=>{
   const fix=aziendeDemo.find(a=>a.domain===ctx.lead.domain||new URL(a.sito).hostname===ctx.lead.domain)||aziendeDemo[0],d=fix.dati||{};
   const dati={cliente:{id:ctx.clientId,nome:ctx.lead.company,settore:ctx.lead.sector,citta:ctx.lead.city},scheda_google:d.scheda_google||{nota:'[DA VERIFICARE] scheda non ancora analizzata'},dati_sito:{nome:ctx.lead.company,indirizzo:d.coerenza_dati?.indirizzo_sito||'[DA VERIFICARE]',telefono:d.coerenza_dati?.telefono_sito||'[DA VERIFICARE]',sito:ctx.lead.website},recensioni:[]};
   const r=await app.sciame.flussi.local(giro,{dati,attendiCliente:true});
   if(!r.approvato||!r.contenuti?.length)throw new Error(`Contenuti non prodotti (${r.passo?.stato}): ${r.passo?.errore||r.passo?.esito_qualita||''}`);
   ctx.contenuti=r.contenuti;return `${r.contenuti.length} post Google Business Profile passati da Qualità e in attesa del socio · motore ${r.passo.motore}`;
  });
  await passo(7,'Il socio approva i contenuti dalla coda comune',async()=>{
   const vista=await http('/api/overview?clientId='+ctx.clientId,{sessione:ctx.sessioneSocio});
   const daApprovare=vista.approvals.filter(a=>a.status==='pending'&&ctx.contenuti.includes(a.entity_id));if(daApprovare.length!==ctx.contenuti.length)throw new Error(`Il socio vede ${daApprovare.length} contenuti da approvare su ${ctx.contenuti.length}.`);
   for(const a of daApprovare)await http('/api/approvals/'+a.id+'?clientId='+ctx.clientId,{method:'POST',body:{decision:'approved'},sessione:ctx.sessioneSocio});
   const decisi=s.query(`SELECT * FROM os_approvals WHERE id IN (${daApprovare.map(()=>'?').join(',')})`,...daApprovare.map(a=>a.id));
   if(!decisi.every(a=>a.status==='approved'&&a.decision_by===ctx.sessioneSocio.user.id&&a.decision_at))throw new Error('Approvazione non registrata con nome e data del socio.');
   return `${decisi.length} approvazioni registrate con l’identità del socio e la data`;
  });
  await passo(8,'I contenuti vengono programmati (solo simulazione)',async()=>{
   const p=passoSciame('local-gbp');let n=0;
   for(const [i,id] of ctx.contenuti.entries()){const c=s.one('SELECT * FROM os_contents WHERE id=?',id);await http('/api/production/contents/'+id+'?clientId='+ctx.clientId,{method:'PATCH',body:{version:c.version,state:'PROGRAMMATO',scheduled_at:new Date(Date.now()+(i+1)*7*86400000).toISOString()},sessione:ctx.sessioneSocio});n++;s.run('INSERT INTO os_azioni_esterne VALUES(?,?,?,?,?,?,?,?,?)','scenario-'+id,giro.id,p.id,ctx.clientId,'pubblicazione_gbp',`Post GBP «${c.title}» — programmato nel calendario DEMO, pubblicazione bloccata`,'bloccata','COLLEGAMENTO MANCANTE e ok di un socio obbligatorio: in DEMO il codice non esegue azioni verso l’esterno.',new Date().toISOString());}
   const prog=s.query("SELECT * FROM os_contents WHERE client_id=? AND state='PROGRAMMATO'",ctx.clientId).length;if(prog!==n)throw new Error('Programmazione incompleta.');
   await http('/api/production/contents/'+ctx.contenuti[0]+'?clientId='+ctx.clientId,{method:'PATCH',body:{version:s.one('SELECT version FROM os_contents WHERE id=?',ctx.contenuti[0]).version,state:'PUBBLICATO'},sessione:ctx.sessioneSocio}).then(()=>{throw new Error('Pubblicazione non bloccata!');},e=>{if(!/disabilitata/.test(e.message))throw e;});
   return `${prog} contenuti PROGRAMMATI nel calendario DEMO; il passaggio a PUBBLICATO è rifiutato dal codice`;
  });
  await passo(9,'Si scrive il report mensile',async()=>{
   const j=app.orchestrator.enqueue(owner,ctx.clientId,'reporter');await app.orchestrator.tick(ctx.clientId);
   const r=JSON.parse(s.one('SELECT result FROM os_jobs WHERE id=?',j.id).result);const mem=s.one("SELECT * FROM os_memory WHERE client_id=? AND kind='report'",ctx.clientId);
   if(!mem)throw new Error('Report non salvato nella memoria del cliente.');
   return `${r.title}: ${r.summary}`;
  });
  await passo(10,'Si emette la fattura da emettere (bozza)',async()=>{
   const r=(await amm('POST',`/contracts/${ctx.contratto.id}/invoice`,{name:'fattura'})).data;ctx.fattura=r.invoice;
   await amm('POST','/sdi',{}).then(()=>{throw new Error('Invio SDI non bloccato!');},e=>{if(!/disabilitata/.test(e.message))throw e;});
   return `Bozza ${r.invoice.number} da ${euro(r.invoice.amount_cents)}, scadenza ${r.invoice.due_date}; invio allo SDI bloccato`;
  });
  await passo(11,'Arriva l’incasso in prima nota',async()=>{
   const m=(await amm('POST','/movements',{sourceRef:'scenario-incasso-'+ctx.fattura.id.slice(0,8),entityId:'demo-entity-b',accountId:'demo-bank-b',counterpartyId:ctx.controparte.id,invoiceId:ctx.fattura.id,date:oggi(),amountCents:19000,direction:'in',category:'Canone Presenza',method:'bank',documentRef:ctx.fattura.number,note:'Bonifico DEMO: il cliente ha versato 190,00 € invece di 199,00 €'})).data;
   return `Movimento ${m.id.slice(0,8)} di ${euro(m.amount_cents)} collegato alla fattura ${ctx.fattura.number}, immutabile`;
  });
  await passo(12,'Il controllo “cosa non torna” segnala un’anomalia',async()=>{
   const r=await app.sciame.flussi.amministrazione(giro);
   const anomalia=s.one("SELECT * FROM os_fin_anomalies WHERE rule='payment_mismatch' AND source_id=?",ctx.fattura.id);if(!anomalia)throw new Error('Anomalia di esempio non rilevata.');
   if(!r.approvato)throw new Error(`Spiegazione dell’Amministrazione non approvata (${r.passo?.stato}): ${r.passo?.errore||r.passo?.esito_qualita||''}`);
   const voce=JSON.parse(r.passo.output_json).anomalie.find(a=>a.anomalia_id===anomalia.id);
   return `${anomalia.title}: ${euro(anomalia.amount_cents)} su ${ctx.fattura.number}; l’Amministrazione propone: ${voce?.verifica_proposta||'—'} (nessuna correzione automatica)`;
  });
  await passo(13,'Il Direttore Crescita propone un upsell',async()=>{
   const r=await app.sciame.flussi.upsell(giro,{clientId:ctx.clientId});
   if(!r.approvato)throw new Error(`Upsell non approvato (${r.passo?.stato}): ${r.passo?.errore||r.passo?.esito_qualita||''}`);
   const interna=await http('/api/overview?clientId='+ctx.clientId,{sessione:ctx.sessioneSocio});if(!interna.memory.some(m=>m.kind==='servizi-consigliati'))throw new Error('Proposta interna non registrata per i soci.');
   const vista=await http('/api/overview?clientId='+ctx.clientId,{sessione:ctx.sessioneCliente});if(vista.memory.length)throw new Error('Memoria interna esposta al cliente.');
   return `${r.output.priorita.map(p=>p.titolo).join(' · ')} — servizi consigliati conservati per i soci, nascosti al cliente`;
  });
 }finally{
  const g=app.sciame.chiudiGiro(giro.id);ctx.giro=g;
  await app.close();
 }
 return {ok:passi.length===13&&passi.every(p=>p.esito==='ok'),passi,giro:ctx.giro,motore};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const i=process.argv.indexOf('--motore'),motore=i>0?process.argv[i+1]:'demo';
 console.info(`BigAnt OS · scenario dimostrativo a 13 passaggi · motore: ${ETICHETTE[motore]||motore}`);
 let r;try{r=await eseguiScenario({motore,log:x=>console.info(x)});}catch(e){console.error('Scenario interrotto: '+e.message);process.exitCode=1;}
 if(r){console.info(r.ok?'Esito: 13 passaggi su 13 completati.':'Esito: scenario incompleto.');
  if(process.argv.includes('--salva-prove')){const dir=resolve(root,'docs/demo-scenario');mkdirSync(dir,{recursive:true});const file=resolve(dir,`${oggi()}-scenario-${motore}.md`);
   writeFileSync(file,[`# Scenario dimostrativo a 13 passaggi`,'',`- Data: ${new Date().toISOString()}`,`- Motore: ${ETICHETTE[motore]||motore}`,`- Esito: ${r.ok?'13/13 passaggi completati':'incompleto'}`,`- Costo dichiarato dal motore: ${(r.giro.costo_usd_micro/1e6).toFixed(4)} USD`,'','Dati DEMO in un archivio temporaneo. Pubblicazioni, invii, SDI e pagamenti restano bloccati dal codice.','','| # | Passaggio | Esito | Prova |','|---|---|---|---|',...r.passi.map(p=>`| ${p.n} | ${p.titolo} | ${p.esito} | ${String(p.prova).replace(/\|/g,'/').replace(/\n/g,' ')} |`),''].join('\n'));
   console.info('Resoconto salvato in '+file);}
  process.exitCode=r.ok?0:1;}
}
