// Genera docs/verifica/roadmap-servizi.html: la strada servizio per servizio (S01–S19) dalla demo alla versione reale.
// Nome, contenuti e KPI vengono dalle schede del Playbook (src/servizi/catalogo.js); i passi sono il piano dell'8 ottobre 2026.
import {writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {catalogoServizi} from '../src/servizi/catalogo.js';
import {integrations} from '../src/registry.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const e=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const nomeInt=id=>integrations.find(i=>i.id===id)?.name||id;
// onda: 1 = reale in 1–2 settimane senza collegamenti; 2–4 = con i collegamenti (vedi calendario).
const R={
 S01:{onda:'1 → 3',subito:'Lo sciame Social prepara ogni mese piano e post per BigAnt e per un cliente pilota. Voi approvate e pubblicate a mano da Meta Business Suite.',passi:['Server condiviso e AI vera (Fasi 1–2)','Tono di voce reale del cliente (parole chiave, parole vietate) nella memoria','Meta in lettura: statistiche dei post nei KPI','Pubblicazione programmata dopo l’ok (Meta o Postiz)','Report mensile automatico'],serve:'Meta Business del cliente con BigAnt come partner; app Meta verificata (tempi di approvazione da verificare); in alternativa Postiz [DA VERIFICARE costo].'},
 S02:{onda:'1',subito:'Progetti veri gestiti nell’app: brief, lista riprese, scadenze, consegne e approvazione del cliente (funziona già). L’AI scrive brief e storyboard.',passi:['Server condiviso','Agente Video con AI per brief, storyboard e lista riprese','Consegne con link alla cartella del cliente','Liberatorie e permessi drone come controllo obbligatorio prima della consegna'],serve:'Nessun account nuovo; cartella Drive per le consegne (facoltativa).'},
 S03:{onda:'2 → 3',subito:'L’AI prepara brief, struttura delle campagne, parole chiave e annunci; Raffaele li carica a mano in Google Ads e inserisce i risultati a fine mese.',passi:['Agente ADS con AI','Account manager (MCC) di BigAnt con i clienti collegati','Google Ads in lettura: spesa, contatti e costo per contatto nel report','Google Analytics in lettura per le conversioni','Modifiche alle campagne solo dopo l’ok di un socio'],serve:'Account manager Google Ads; token sviluppatore Google Ads da richiedere subito (approvazione con tempi da verificare); accesso Analytics del cliente.'},
 S04:{onda:'3',subito:'L’AI scrive pubblici, testi e varianti degli annunci; si caricano a mano in Gestione inserzioni e i risultati si inseriscono a fine mese.',passi:['Agente ADS Meta con AI','BigAnt partner nel Business Manager del cliente','Meta in lettura: spesa e contatti nel report','Moduli contatto di Meta collegati al CRM (S14)'],serve:'App Meta verificata con i permessi pubblicitari (revisione Meta, tempi da verificare).'},
 S05:{onda:'2',subito:'L’AI scrive audit e piano parole chiave partendo dall’esportazione di Search Console che caricate voi; le ottimizzazioni si fanno sul sito.',passi:['Agente SEO con AI','Search Console e Analytics in lettura (autorizzazione del cliente)','Posizioni, clic e traffico nei KPI','Report SEO mensile automatico'],serve:'Accesso del cliente a Search Console e Google Analytics (gratuito, configurazione rapida).'},
 S06:{onda:'1 → 2',subito:'Già oggi lo sciame Local/GBP controlla la scheda e prepara i post: Vincenzo applica a mano le correzioni e pubblica i post approvati.',passi:['Dati reali della scheda inseriti all’inizio','Richiesta di accesso alle API di Google Business Profile (da fare il primo giorno)','Lettura di scheda, chiamate e indicazioni stradali nei KPI','Post pubblicati dopo l’ok','Controllo mensile automatico delle incoerenze'],serve:'Progetto Google Cloud, accesso API Business Profile approvato da Google (tempi da verificare), BigAnt gestore delle schede dei clienti.'},
 S07:{onda:'2',subito:'Censimento della presenza sulle directory con una lista di controllo; l’AI segnala le differenze di nome, indirizzo e telefono.',passi:['Lista delle directory italiane nel servizio','Scheda Google come fonte unica dei dati','Aggiornamenti a mano (poche directory hanno un accesso automatico) [DA VERIFICARE]','Eventuale strumento di sincronizzazione a pagamento [DA VERIFICARE]'],serve:'Accesso alla scheda Google (come S06).'},
 S08:{onda:'1 → 2',subito:'Lo sciame Reputazione scrive le risposte; le recensioni negative passano dal cliente. Si pubblicano a mano. Il kit per raccogliere recensioni (QR e messaggio) è pronto.',passi:['Lettura delle recensioni dalla scheda Google','Risposte pubblicate dopo l’ok','Richiesta di recensioni ai clienti via email o WhatsApp (S14)','Andamento di media e numero di recensioni nel report'],serve:'Accesso API Business Profile (come S06).'},
 S09:{onda:'1 → 2',subito:'Il progetto del sito si gestisce nell’app: struttura e testi dall’AI, approvazioni del cliente; lo sviluppo resta con i vostri strumenti.',passi:['Agente Sito con AI per struttura e testi','Analytics e Search Console in lettura per i risultati','Pagine del sito BigAnt previste dal brief'],serve:'Accesso Analytics e Search Console del cliente.'},
 S10:{onda:'2',subito:'Verifica di accessibilità con lista di controllo e strumenti gratuiti; l’AI scrive il rapporto e la dichiarazione di accessibilità.',passi:['Lista di controllo WCAG 2.1 AA nel servizio','Agente con AI per rapporto e dichiarazione','Verifica dell’obbligo per il cliente [DA VERIFICARE con il consulente]'],serve:'Nessun account.'},
 S11:{onda:'4',subito:'Progetto gestito nell’app, con schede prodotto scritte dall’AI.',passi:['Scelta della piattaforma (decisione con il cliente)','Catalogo collegato a Instagram e Facebook','Ordini e vendite in lettura dalla piattaforma'],serve:'Account della piattaforma scelta; Meta per il catalogo.'},
 S12:{onda:'4',subito:'Configurazione dello strumento di prenotazione del cliente, seguita come progetto.',passi:['Scelta dello strumento','Google Calendar in lettura per contare le prenotazioni','Pulsante «Prenota» sulla scheda Google'],serve:'Calendario o strumento del cliente; scheda Google (S06).'},
 S13:{onda:'4',subito:'Nessuna funzione reale finché non si sceglie un fornitore di centralino o chatbot.',passi:['Scelta del fornitore [DA VERIFICARE costi]','Riepiloghi delle chiamate nel CRM','WhatsApp Business (costi a conversazione) [DA VERIFICARE]'],serve:'Contratto con il fornitore scelto.'},
 S14:{onda:'3',subito:'Il CRM (Growth) funziona già: sul server si usano contatti veri, raccolti con il consenso; l’AI scrive le email e voi le inviate a mano.',passi:['Contatti reali sul server, con consenso privacy','Invio email dall’app dopo l’ok (Gmail o servizio newsletter) [DA VERIFICARE]','Carte fedeltà digitali (Wallet) per i clienti Fidelity'],serve:'Account email di invio; per Wallet: Apple Developer (99 $ l’anno) e Google Wallet.'},
 S15:{onda:'1',subito:'Progetti di brand gestiti nell’app con consegne e approvazioni; l’AI aiuta su posizionamento e naming, il design resta di Alfonso.',passi:['Agente Branding con AI per posizionamento e brand book testuale','Archivio delle consegne nell’area cliente'],serve:'Nessun account.'},
 S16:{onda:'1',subito:'Ordini e campionature gestiti come lavori, con scadenze e approvazioni del cliente.',passi:['Listino dei fornitori nel servizio','Preventivi e consegne nell’app'],serve:'Nessun account.'},
 S17:{onda:'1 (priorità)',subito:'Lo sciame Commerciale produce già, con l’AI, analisi gratuite e proposte: si possono usare subito su potenziali clienti veri, raccogliendo a mano i loro dati pubblici (sito, scheda, recensioni).',passi:['Dati pubblici dell’azienda raccolti a mano, poi analisi e proposta','Ricerca automatica con Brave Search [DA VERIFICARE soglia gratuita]','Invio dell’analisi via email dopo l’ok (S14)','Contatti e conversioni nel CRM'],serve:'Per l’automazione: chiave Brave Search.'},
 S18:{onda:'1 → 3',subito:'Report mensile scritto dall’AI con i numeri chiave inseriti a mano dal socio (pochi minuti per cliente).',passi:['Inserimento manuale dei numeri chiave','Numeri automatici man mano che si collegano scheda Google, Analytics, Search Console, Meta e Google Ads','Report in PDF inviato dopo l’ok'],serve:'Gli stessi collegamenti dei servizi acquistati dal cliente.'},
 S19:{onda:'1',subito:'Pianificazione e creatività gestite come progetto; l’acquisto degli spazi resta al partner.',passi:['Listini dei partner nel servizio','Preventivi e consegne nell’app'],serve:'Nessun account.'}
};
const card=s=>{const r=R[s.codice];return `<article class="srv"><header><span class="cod">${s.codice}</span><div><h3>${e(s.nome)}</h3><small>Onda ${e(r.onda)} · Oggi: ${s.sciame.length?'agente con AI nello sciame':'agente a regole fisse'}${s.integrazioni.length?' · collegamenti: '+e(s.integrazioni.map(nomeInt).join(', '))+' (non collegati)':' · nessun collegamento necessario'}</small></div></header>
<p class="sub"><b>Reale da subito, senza collegamenti:</b> ${e(r.subito)}</p>
<p><b>Passi per farlo funzionare del tutto:</b></p><ol>${r.passi.map(p=>`<li>${e(p)}</li>`).join('')}</ol>
<p><b>Cosa serve:</b> ${e(r.serve)}</p>
<p class="kpi"><b>Funziona davvero quando questi numeri sono reali:</b> ${e(s.kpi.slice(0,3).join(' · '))}</p></article>`;};
const onde=[['Settimana 0 · Base','Decisioni dei soci · server condiviso su Railway · chiave AI con tetto di spesa · dati veri di BigAnt e di 1–2 clienti pilota che danno il consenso · <b>richieste di accesso da avviare subito</b> (Google Business Profile, app Meta, token Google Ads), perché l’approvazione richiede tempo.'],
 ['Onda 1 · settimane 1–2','Servizi reali senza collegamenti: S17 analisi e proposte, S01 social (pubblicazione a mano), S06 scheda Google e S08 recensioni (lavoro di Vincenzo), S18 report con numeri inseriti a mano, S02, S15, S16, S19 e la gestione dei progetti S09.'],
 ['Onda 2 · settimane 3–5','Primi collegamenti in lettura: scheda Google (S06, S07, S08), Analytics e Search Console (S05, S09), accessibilità (S10).'],
 ['Onda 3 · settimane 5–8','Meta (S01 pubblicazione, S04), Google Ads (S03), email (S14), report automatico (S18).'],
 ['Onda 4 · dopo l’ottava settimana','E-commerce (S11), prenotazioni (S12), centralino e chatbot (S13), Wallet, WhatsApp, fatturazione elettronica.']];
const html=`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>BigAnt OS · Roadmap dei servizi</title><style>
:root{--ink:#141413;--orange:#F26B21;--muted:#6b6862;--line:#e4e1da;--soft:#f6f4ef}
@page{size:A4;margin:14mm 14mm 16mm}*{box-sizing:border-box}
body{margin:0;font-family:"Helvetica Neue","Liberation Sans",Arial,sans-serif;color:var(--ink);font-size:9.6pt;line-height:1.45}
h1{font-size:29pt;line-height:1.05;margin:0 0 10px;letter-spacing:-.02em}h2{font-size:15pt;margin:0 0 8px}h3{font-size:11pt;margin:0}
p{margin:3px 0}ol,ul{margin:3px 0 5px;padding-left:18px}li{margin:1px 0}
.eyebrow{font-size:7.5pt;letter-spacing:.14em;text-transform:uppercase;color:var(--orange);font-weight:700;margin-bottom:8px}
.cover{height:262mm;display:flex;flex-direction:column;justify-content:space-between;border-left:6px solid var(--orange);padding:6mm 0 0 10mm}
.lead{font-size:12.5pt;color:var(--muted);max-width:140mm}.page{break-before:page}
.box{background:var(--soft);border-radius:8px;padding:9px 12px;margin:7px 0;break-inside:avoid}
.dark{background:var(--ink);color:#f7f6f2;border-radius:8px;padding:12px 14px}.dark b{color:#fff}
.srv{border:1px solid var(--line);border-radius:8px;padding:8px 11px;margin:0 0 8px;break-inside:avoid}
.srv header{display:flex;gap:10px;align-items:center;margin-bottom:5px}.srv small{color:var(--muted)}
.cod{background:var(--orange);color:var(--ink);font-weight:800;border-radius:6px;padding:4px 8px;font-size:9.5pt}
.sub{background:var(--soft);border-radius:6px;padding:5px 8px}.kpi{color:var(--muted);font-size:8.6pt}
.onda{display:grid;grid-template-columns:42mm 1fr;gap:10px;border-bottom:1px solid var(--line);padding:5px 0;break-inside:avoid;font-size:9pt}
.compact td{padding:2.5px 5px;font-size:8.3pt}.onda b:first-child{color:var(--orange)}
table{width:100%;border-collapse:collapse;font-size:9pt}th{text-align:left;font-size:7pt;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border-bottom:1.5px solid var(--ink);padding:4px 5px}td{border-bottom:1px solid var(--line);padding:5px;vertical-align:top}
</style></head><body>
<section class="cover"><div><div class="eyebrow">BigAnt Agency · dalla demo alla versione reale</div><h1>BigAnt OS<br>Roadmap dei servizi<br>S01–S19</h1>
<p class="lead">Per ogni servizio: cosa diventa reale subito, i passi per farlo funzionare del tutto, cosa serve e quando i suoi numeri saranno veri.</p></div>
<div class="dark"><b>In una pagina, per chi deve decidere.</b><br>
<b>Cosa c'è:</b> il motore interno è pronto e verificato da 183 test (accessi, lavori, approvazioni, amministrazione, CRM, Fidelity, agenti con AI).<br>
<b>Cosa manca:</b> server condiviso, dati reali e collegamenti alle piattaforme.<br>
<b>Il piano:</b> nelle prime 2 settimane diventano reali i servizi che non hanno bisogno di collegamenti. L'AI prepara, voi approvate ed eseguite: analisi gratuite e proposte ai potenziali clienti, social di BigAnt, scheda Google e recensioni, report mensili. In parallelo si chiedono gli accessi a Google e Meta, che sbloccano i numeri automatici dalla settimana 3 in poi.<br>
<b>Costi ricorrenti:</b> Railway (già nel vostro abbonamento); AI con un tetto mensile scelto da voi (per esempio 20–50 €). Il resto è gratuito, tranne le opzioni indicate servizio per servizio [DA VERIFICARE].</div></section>
<section class="page"><div class="eyebrow">Calendario</div><h2>Base, poi quattro onde</h2>
${onde.map(([t,d])=>`<div class="onda"><b>${t}</b><div>${d}</div></div>`).join('')}
<div class="box"><b>Regola di lavoro:</b> un'onda alla volta. Ogni servizio si dichiara OPERATIVO solo quando funziona su dati veri, provato da voi due, con una prova scritta. Niente nuove sezioni finché le onde non sono chiuse.</div>
<h2 style="margin-top:10px">Riepilogo</h2><table class="compact"><tr><th>Cod.</th><th>Servizio</th><th>Onda</th><th>Collegamenti</th></tr>
${catalogoServizi.map(s=>`<tr><td><b>${s.codice}</b></td><td>${e(s.nome)}</td><td>${e(R[s.codice].onda)}</td><td>${e(s.integrazioni.map(nomeInt).join(', ')||'—')}</td></tr>`).join('')}</table></section>
<section class="page"><div class="eyebrow">Servizio per servizio</div><h2>Le 19 schede, dalla S01 alla S19</h2>${catalogoServizi.map(card).join('')}</section>
</body></html>`;
writeFileSync(resolve(root,'docs/verifica/roadmap-servizi.html'),html);console.log('ok',catalogoServizi.length,'servizi');
