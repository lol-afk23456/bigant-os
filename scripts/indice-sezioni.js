// Genera docs/verifica/indice-sezioni.html (e il PDF con Chromium) dall'elenco reale delle sezioni,
// raccolto aprendo ogni pagina dell'app (docs/verifica/sezioni.json) e dal registro dei servizi.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {services,departments} from '../src/registry.js';
import {agentiSciame} from '../src/sciame/agenti.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const S=JSON.parse(readFileSync(resolve(root,'docs/verifica/sezioni.json'),'utf8'));
const e=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const reparto=id=>departments.find(d=>d.id===id)?.name||id;
// Cosa guardare in ogni sezione e limite noto (stato verificato nell'analisi dell'8 ottobre 2026).
const guida={
 agency:['Reparti, agenti e servizi corrispondono a come lavorate davvero? Manca qualcuno o qualcosa?','Struttura completa; i numeri sono dati inventati.'],
 marketing:['Obiettivi, lavori e contenuti di BigAnt come «cliente zero»: sono quelli giusti per la vostra comunicazione?','Nessuna pubblicazione sui canali.'],
 direction:['Le priorità e i «prossimi passi» aiutano davvero a decidere la settimana?','Priorità calcolate su dati inventati.'],
 administration:['Prima nota, scadenze, fatture, contratti e canoni: rispecchiano come gestite le due ditte? Mancano voci o categorie?','Nessuna banca né fatturazione elettronica collegata.'],
 clients:['Schede dei clienti e servizi attivi: i campi bastano? Cosa vi serve sapere di ogni cliente?','Solo anagrafiche DEMO.'],
 work:['Prova il ciclo completo: crea un contenuto, mandalo in approvazione, approvalo, programmalo.','La pubblicazione resta bloccata.'],
 growth:['Ricerca, contatti, appuntamenti e proposte: è il vostro percorso commerciale?','Nessuna email parte davvero.'],
 fidelity:['Programmi fedeltà, carte, iscritti e campagne: lo proporreste a un cliente?','I codici QR funzionano solo nella versione installata.'],
 ufficio:['Gli agenti al lavoro e i testi che scrivono: sono chiari e utili? Aprite ogni scrivania.','Online il motore è a regole, non è AI.'],
 agents:['Le procedure di ogni reparto: cosa produce ogni agente e se vi serve.','21 agenti su 32 lavorano a regole fisse.'],
 approvals:['Tutto ciò che aspetta un ok: si capisce cosa approvare e perché?','—'],
 activity:['Il registro di chi ha fatto cosa: le informazioni sono quelle utili?','—'],
 catalog:['Le 27 schede dei servizi: nomi, descrizioni, pacchetti. Ogni spazio è nella Parte B.','Prezzi dei pacchetti da validare.'],
 connections:['Le piattaforme da collegare: quali servono per prime?','17 su 17 non collegate.'],
 users:['Chi può entrare e cosa vede: prova a creare un collaboratore.','Accessi validi solo nella prova.'],
 client:['Come il cliente vede la propria area: vi sembra chiara per un titolare?','Molti numeri aspettano i collegamenti.']
};
const guidaCliente={work:'Lavori e contenuti visibili al cliente: solo i suoi, e comprensibili?',fidelity:'Il programma fedeltà della propria attività.',approvals:'Approva e rifiuta un contenuto: è semplice da telefono?',catalog:'I servizi acquistati: descrizioni chiare per un cliente?',client:'La dashboard: le 9 sezioni una per una, sotto.'};
const scheda=(cod,x,cosa,limite)=>`<article class="sez"><header><span class="cod">${cod}</span><div><h3>${e(x.menu||x.nome)}</h3><small>Menu → ${e(x.menu||'Servizi → '+x.nome)}${x.titolo?' · «'+e(x.titolo)+'»':''}</small></div></header>
 ${x.riquadri.length?`<p><b>Cosa contiene:</b> ${e([...new Set(x.riquadri)].join(' · '))}</p>`:''}
 ${x.numeri?.length?`<p><b>Numeri in alto:</b> ${e(x.numeri.join(' · '))}</p>`:''}
 <p><b>Cosa controllare:</b> ${e(cosa)}</p>${limite&&limite!=='—'?`<p class="lim"><b>Limite noto:</b> ${e(limite)}</p>`:''}
 <div class="esito"><span>☐ Aperta</span><span>☐ Chiara</span><span>☐ Funziona</span><span>Voto: ___ /5</span><span>Chi: R · A</span></div><div class="note">Note:</div></article>`;
const servizi=S.servizi.map(x=>({...x,reg:services.find(s=>s.id===x.id)}));
const clienteHome=S.cliente.find(x=>x.id==='client');
const html=`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>BigAnt OS · Indice delle sezioni</title><style>
:root{--ink:#141413;--orange:#F26B21;--muted:#6b6862;--line:#e4e1da;--soft:#f6f4ef}
@page{size:A4;margin:14mm 14mm 16mm}*{box-sizing:border-box}
body{margin:0;font-family:"Helvetica Neue","Liberation Sans",Arial,sans-serif;color:var(--ink);font-size:9.5pt;line-height:1.45}
h1{font-size:28pt;line-height:1.05;margin:0 0 10px;letter-spacing:-.02em}h2{font-size:15pt;margin:0 0 4px}h3{font-size:11pt;margin:0}
p{margin:3px 0}.eyebrow{font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);font-weight:700;margin-bottom:8px}
.cover{height:262mm;display:flex;flex-direction:column;justify-content:space-between;border-left:6px solid var(--orange);padding:6mm 0 0 10mm}
.page{break-before:page}.intro{color:var(--muted);margin-bottom:10px}
.sez{border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin:0 0 8px;break-inside:avoid}
.sez header{display:flex;gap:10px;align-items:center;margin-bottom:4px}.sez small{color:var(--muted)}
.cod{background:var(--ink);color:#fff;font-weight:700;border-radius:6px;padding:3px 7px;font-size:9pt;min-width:34px;text-align:center}
.lim{color:#9a3a0b}.esito{display:flex;flex-wrap:wrap;gap:14px;margin-top:6px;font-size:8.5pt;font-weight:600}
.note{border-bottom:1px solid var(--line);height:22px;margin-top:4px;font-size:8pt;color:var(--muted)}
table{width:100%;border-collapse:collapse;font-size:8.8pt}th{text-align:left;font-size:7pt;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--ink);padding:4px 5px}
td{border-bottom:1px solid var(--line);padding:5px;vertical-align:top}tr{break-inside:avoid}
.box{background:var(--soft);border-radius:8px;padding:9px 11px;margin:8px 0}.toc td:first-child{font-weight:700;width:46px}
</style></head><body>
<section class="cover"><div><div class="eyebrow">BigAnt Agency · per Raffaele e Alfonso</div><h1>BigAnt OS<br>Indice delle sezioni<br>da analizzare</h1>
<p style="font-size:12pt;color:var(--muted);max-width:140mm">Ogni sezione dell'app, una per una: dove si trova, cosa contiene, cosa controllare. Sotto ogni scheda trovate le caselle per l'esito e lo spazio per le note.</p></div>
<div><div class="box"><b>Come usarlo.</b> Aprite il sito https://lol-afk23456.github.io/bigant-os-prova/ e seguite l'ordine dell'indice. Per ogni sezione: spuntate <b>Aperta</b>, <b>Chiara</b> e <b>Funziona</b>, date un voto da 1 a 5, cerchiate chi l'ha controllata (R = Raffaele, A = Alfonso) e scrivete le note. Gli errori vanno anche nel modulo correzioni del «Piano di verifica in 7 giorni».</div>
<table class="toc"><tr><th>Parte</th><th>Contenuto</th><th>Sezioni</th><th>Profilo</th></tr>
<tr><td>A</td><td>Area dei soci: tutte le voci del menu</td><td>${S.socio.length}</td><td>Socio DEMO</td></tr>
<tr><td>B</td><td>Spazi dei servizi (Menu → Servizi → Apri spazio)</td><td>${servizi.length}</td><td>Socio DEMO</td></tr>
<tr><td>C</td><td>Area cliente: voci del menu e sezioni della dashboard</td><td>${S.cliente.length+(clienteHome?.riquadri.length?0:0)}</td><td>Cliente Aurora DEMO</td></tr>
<tr><td>D</td><td>Agenti dello sciame nell'Ufficio virtuale</td><td>${Object.keys(agentiSciame).length}</td><td>Socio DEMO</td></tr></table>
<p style="color:var(--muted);font-size:8pt;margin-top:8px">Elenco raccolto aprendo automaticamente ogni pagina della versione pubblica, l'8 ottobre 2026. Sezioni: ${S.socio.length+servizi.length+S.cliente.length}; riquadri: ${[...S.socio,...S.servizi,...S.cliente].reduce((n,x)=>n+x.riquadri.length,0)}.</p></div></section>
<section class="page"><div class="eyebrow">Parte A · Area dei soci</div><h2>${S.socio.length} sezioni del menu</h2><p class="intro">Entrate con «Socio DEMO» e seguite l'ordine del menu a sinistra.</p>
${S.socio.map((x,i)=>scheda('A'+(i+1),x,...(guida[x.id]||['Cosa serve di questa sezione? Cosa manca?','—']))).join('')}</section>
<section class="page"><div class="eyebrow">Parte B · Spazi dei servizi</div><h2>${servizi.length} spazi, uno per servizio</h2>
<p class="intro">Menu → Servizi → «Apri spazio». Ogni spazio ha le stesse parti: ${e([...new Set(servizi[0]?.riquadri||[])].join(' · '))}. Controllate che nome, reparto e materiali consegnati siano giusti, e che i lavori mostrati abbiano senso per quel servizio.</p>
<table><tr><th>#</th><th>Servizio</th><th>Reparto</th><th>Cosa si consegna</th><th>Collegamento</th><th>Esito</th><th>Note</th></tr>
${servizi.map((x,i)=>`<tr><td><b>B${i+1}</b></td><td><b>${e(x.reg?.name||x.id)}</b></td><td>${e(reparto(x.reg?.department))}</td><td>${e(x.reg?.deliverables||'')}</td><td>${e(x.reg?.integration||'—')}</td><td style="white-space:nowrap">☐ ok · voto __/5</td><td style="width:22%"></td></tr>`).join('')}</table></section>
<section class="page"><div class="eyebrow">Parte C · Area cliente</div><h2>${S.cliente.length} voci del menu e la dashboard</h2><p class="intro">Cambiate profilo e premete «Cliente Aurora DEMO». Guardate tutto come se foste il titolare di Bottega Aurora, possibilmente da telefono.</p>
${S.cliente.map((x,i)=>scheda('C'+(i+1),x,guidaCliente[x.id]||'Cosa serve al cliente qui?',x.id==='client'?'I numeri dei canali compaiono come «collegamento mancante».':'')).join('')}
${clienteHome?`<h3 style="margin:10px 0 6px">Dashboard cliente: le sezioni una per una</h3><table><tr><th>#</th><th>Sezione</th><th>Domanda da farsi</th><th>Esito</th><th>Note</th></tr>${[...new Set(clienteHome.riquadri)].map((r,i)=>`<tr><td><b>C5.${i+1}</b></td><td><b>${e(r)}</b></td><td>Un cliente capisce subito cosa vede e cosa deve fare?</td><td style="white-space:nowrap">☐ ok · voto __/5</td><td style="width:30%"></td></tr>`).join('')}</table>`:''}</section>
<section class="page"><div class="eyebrow">Parte D · Sciame di agenti</div><h2>Gli agenti dell'Ufficio virtuale, uno per uno</h2><p class="intro">Menu → Ufficio virtuale. Il giro del giorno parte da solo; cliccate ogni scrivania e leggete l'ultimo testo prodotto. Online il motore è a regole: giudicate soprattutto se il compito e la forma del risultato sono quelli giusti.</p>
<table><tr><th>#</th><th>Agente</th><th>Reparto</th><th>Il risultato vi servirebbe?</th><th>Cosa cambiereste</th></tr>
${Object.values(agentiSciame).map((a,i)=>`<tr><td><b>D${i+1}</b></td><td><b>${e(a.nome)}</b></td><td>${e(a.reparto==='regia'?'Regia':reparto(a.reparto))}</td><td style="white-space:nowrap">☐ sì ☐ in parte ☐ no</td><td style="width:38%"></td></tr>`).join('')}</table>
<div class="box"><b>Alla fine.</b> Contate le sezioni con voto 1–2: sono le prime da rifare. Mandate le note insieme al modulo correzioni: ogni codice (A3, B12, C5.4…) mi dice esattamente dove intervenire.</div></section>
</body></html>`;
writeFileSync(resolve(root,'docs/verifica/indice-sezioni.html'),html);console.log('ok');
