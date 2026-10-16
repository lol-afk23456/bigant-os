// Costruisce BigAnt OS online: un'unica pagina HTML con dentro l'intero server (server.js + src/),
// la dashboard (public/) e SQLite in JavaScript. La pagina si pubblica come Artifact privato su claude.ai.
//
// Strumenti fissati, installati nella cartella tecnica esclusa da Git:
//   npm install --prefix .cache/build-online esbuild@0.25.10 buffer@6.0.3 sql.js@1.13.0
// Uso: node scripts/build-online.js            → .cache/online/BigAnt-OS.html (Artifact privato, con password di prova)
//      node scripts/build-online.js --pubblica → online/pubblica/index.html (sito pubblico di prova su Railway:
//      accesso con i profili DEMO, senza password, senza giri reali né dati interni dell'agenzia)
// Le password dei due accessi di prova stanno in .cache/online/credenziali.json (esclusa da Git):
// si generano la prima volta, oppure si impostano con BIGANT_ONLINE_PASSWORD_SOCIO e BIGANT_ONLINE_PASSWORD_CLIENTE.
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomBytes} from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const strumenti=resolve(root,'.cache/build-online/node_modules');
if(!existsSync(resolve(strumenti,'esbuild')))throw new Error('Strumenti mancanti: npm install --prefix .cache/build-online esbuild@0.25.10 buffer@6.0.3 sql.js@1.13.0');
const {build}=await import(resolve(strumenti,'esbuild/lib/main.js'));
const pubblica=process.argv.includes('--pubblica');
const uscita=resolve(root,'.cache/online');mkdirSync(uscita,{recursive:true});

// ---------- Credenziali di prova (mai nel repository) ----------
const fileCredenziali=resolve(uscita,'credenziali.json');
const alfabeto='ABCDEFGHJKMNPQRSTUVWXYZ23456789',parola=n=>[...randomBytes(n)].map(b=>alfabeto[b%alfabeto.length]).join('');
const credenziali=pubblica?{}:existsSync(fileCredenziali)?JSON.parse(readFileSync(fileCredenziali,'utf8')):{
 'demo-owner':{email:'socio@bigant.example',password:process.env.BIGANT_ONLINE_PASSWORD_SOCIO||`Socio-${parola(4)}-${parola(4)}`},
 'demo-client':{email:'cliente@aurora.example',password:process.env.BIGANT_ONLINE_PASSWORD_CLIENTE||`Cliente-${parola(4)}-${parola(4)}`}
};
if(!pubblica)writeFileSync(fileCredenziali,JSON.stringify(credenziali,null,1),{mode:0o600});

// ---------- File letti dal server a runtime: playbook, istruzioni degli agenti, giri reali registrati ----------
const vfs={};
const aggiungi=(cartella,filtro)=>{const d=resolve(root,cartella);if(!existsSync(d))return;for(const voce of readdirSync(d,{withFileTypes:true})){const p=resolve(d,voce.name);if(voce.isDirectory())aggiungi(relative(root,p),filtro);else if(filtro(voce.name))vfs['/app/'+relative(root,p)]=readFileSync(p,'utf8');}};
// Il catalogo legge solo le schede S01–S19; nel sito pubblico restano fuori gli altri documenti interni del playbook.
aggiungi('docs/playbook',n=>pubblica?/^S\d\d_.+\.md$/.test(n):n.endsWith('.md'));
// Nel sito pubblico: niente istruzioni degli agenti né registri dei giri reali (contengono costi e dati interni).
if(!pubblica){aggiungi('.claude/agents',n=>n.endsWith('.md'));aggiungi('docs/demo-sciame',n=>n==='giro.json');}

const shim=n=>resolve(root,'online/shim',n);
const moduli={'node:sqlite':shim('sqlite.js'),'node:crypto':shim('crypto.js'),'node:fs':shim('fs.js'),'node:path':shim('path.js'),'node:url':shim('url.js'),'node:http':shim('http.js'),
 'node:child_process':shim('varie.js'),'node:async_hooks':shim('varie.js'),'node:zlib':shim('varie.js')};
const predefiniti={sharp:'sharp',qrcode:'QRCode','@anthropic-ai/sdk':'Anthropic'};
const pluginOnline={name:'bigant-online',setup(b){
 b.onResolve({filter:/^node:/},a=>{if(moduli[a.path])return {path:moduli[a.path]};return {errors:[{text:'Modulo Node non previsto nella versione online: '+a.path}]};});
 b.onResolve({filter:/^(sharp|qrcode|@anthropic-ai\/sdk)$/},a=>({path:a.path,namespace:'sostituto'}));
 b.onLoad({filter:/.*/,namespace:'sostituto'},a=>({contents:`export {${predefiniti[a.path]} as default} from ${JSON.stringify(shim('varie.js'))};`,resolveDir:root}));
 b.onResolve({filter:/\/fidelity-google-runtime\.js$/},()=>({path:'fidelity-google-runtime',namespace:'sostituto-fidelity-google'}));
 b.onLoad({filter:/.*/,namespace:'sostituto-fidelity-google'},()=>({contents:'export function createGoogleWalletRuntime(){throw new Error("Wallet reale non disponibile nella DEMO offline.");}',loader:'js'}));
 // safePath serve solo all'avvio da riga di comando (cartella dati su disco).
 b.onResolve({filter:/\/growth-live-providers\.js$/},()=>({path:'growth-live-providers',namespace:'sostituto-growth-live'}));
 b.onLoad({filter:/.*/,namespace:'sostituto-growth-live'},()=>({contents:'export function createGrowthLiveProviders(){throw new Error("Fornitori reali non disponibili nella DEMO offline.");}',loader:'js'}));
 b.onResolve({filter:/\/vault\.js$/},()=>({path:'vault',namespace:'sostituto-vault'}));
 b.onLoad({filter:/.*/,namespace:'sostituto-vault'},()=>({contents:'export function createVault(){const blocked=()=>{throw Object.assign(new Error("Archivio protetto disponibile solo sul server configurato."),{status:409})};return {ready:false,seal:blocked,open:blocked}}',loader:'js'}));
 b.onResolve({filter:/scripts\/backup\.js$/},()=>({path:'backup',namespace:'sostituto-backup'}));
 b.onLoad({filter:/.*/,namespace:'sostituto-backup'},()=>({contents:'export async function safePath(){};export async function createBackup(){throw new Error("Backup su disco non disponibile nel browser.")};export async function rotateBackups(){throw new Error("Backup su disco non disponibile nel browser.")}',loader:'js'}));
 b.onResolve({filter:/^virtual:vfs$/},()=>({path:'vfs',namespace:'vfs'}));
 b.onLoad({filter:/.*/,namespace:'vfs'},()=>({contents:JSON.stringify(vfs),loader:'json'}));
 // Ogni file del server conosce il proprio percorso sotto /app; il blocco di avvio da riga di comando non serve.
 b.onLoad({filter:/\.js$/},a=>{
  if(!a.path.startsWith(root+'/')||a.path.includes('/node_modules/')||a.path.includes('/online/'))return;
  let codice=readFileSync(a.path,'utf8').replaceAll('import.meta.url',JSON.stringify('file:///app/'+relative(root,a.path)));
  if(a.path===resolve(root,'server.js')){const i=codice.indexOf('\nif(process.argv[1]');if(i<0)throw new Error('Blocco di avvio di server.js non trovato.');codice=codice.slice(0,i)+'\n';}
  return {contents:codice,loader:'js'};
 });
}};

const ingressi=[resolve(root,'online/avvio.js'),resolve(root,'online/shim'),resolve(root,'server.js'),resolve(root,'src'),resolve(root,'public'),resolve(root,'docs/playbook'),resolve(root,'.claude/agents'),resolve(root,'docs/demo-sciame')];
const impronta=createHash('sha256');
const percorri=p=>{for(const v of readdirSync(p,{withFileTypes:true})){const x=resolve(p,v.name);if(v.isDirectory())percorri(x);else impronta.update(x).update(readFileSync(x));}};
for(const p of ingressi)if(existsSync(p)){if(p.endsWith('.js'))impronta.update(readFileSync(p));else percorri(p);}
const versione=impronta.digest('hex').slice(0,12);

const r=await build({entryPoints:[resolve(root,'online/avvio.js')],bundle:true,format:'iife',globalName:'BigAntOnline',platform:'browser',target:'es2022',write:false,
 minifyWhitespace:true,minifySyntax:true,legalComments:'none',nodePaths:[strumenti],plugins:[pluginOnline],logLevel:'warning',
 define:{__BIGANT_VERSIONE__:JSON.stringify(versione),__BIGANT_CREDENZIALI__:JSON.stringify(Object.fromEntries(Object.entries(credenziali).map(([id,c])=>[id,c.password])))}});
let server=r.outputFiles[0].text;
// Dati interni dell'agenzia che non vanno in una pagina pubblica.
const interni=[/Circa 14 clienti attivi[^'"]*/g];
if(pubblica)for(const x of interni){if(!x.test(server))throw new Error('Dato interno da oscurare non trovato: '+x);server=server.replace(x,'[Dato interno non pubblicato nella versione di prova]');}

// ---------- Dashboard: stessi file di public/, con tre adattamenti per la pagina online ----------
let app=readFileSync(resolve(root,'public/app.js'),'utf8');
const sostituisci=(testo,da,a,minimo=1)=>{const n=testo.split(da).length-1;if(n<minimo)throw new Error('Adattamento non applicabile: '+da);return testo.replaceAll(da,a);};
app=sostituisci(app,'src="/brand/logo.png"','src="${window.__BIGANT_LOGO}"',2);
app=sostituisci(app,'href="/"','href="#"');
app=sostituisci(app,'\nstart();','\nwindow.__BIGANT_START=start;');
const stile=readFileSync(resolve(root,'public/style.css'),'utf8');
const sqlJs=readFileSync(resolve(strumenti,'sql.js/dist/sql-asm.js'),'utf8');
const logo=readFileSync(resolve(root,'public/brand/logo.png.base64'),'utf8').replace(/\s/g,'');
const script=t=>`<script>${t.replace(/<\/script/gi,'<\\/script')}</script>`;

const pagina=`<title>BigAnt OS</title>
<meta name="theme-color" content="#F26B21">
<style>${stile}
</style>
<a class="skip" href="#main">Vai al contenuto</a>
<div id="app"><main class="loading" aria-live="polite"><p>Sto aprendo BigAnt OS nel tuo browser…</p></main></div>
<div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
<dialog id="dialog" aria-labelledby="dialog-title"><div id="dialog-content"></div></dialog>
${script(`try{const o=history.replaceState.bind(history);history.replaceState=(...a)=>{try{o(...a);}catch{}};}catch{}`)}
${script(sqlJs)}
${script(server)}
${script(app)}
${script(readFileSync(resolve(root,'public/ufficio.js'),'utf8'))}
${script(readFileSync(resolve(root,'public/cliente.js'),'utf8'))}
${script(readFileSync(resolve(root,'public/workspace.js'),'utf8'))}
${script(readFileSync(resolve(root,'node_modules/@zxing/browser/umd/zxing-browser.min.js'),'utf8'))}
${script(readFileSync(resolve(root,'public/fidelity-scanner.js'),'utf8'))}
${script(`(async()=>{
 try{
  const b=atob(${JSON.stringify(logo)}),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
  window.__BIGANT_LOGO=URL.createObjectURL(new Blob([u],{type:'image/png'}));
  const online=await BigAntOnline.avvia();
  // «Riparti da zero» nel menu laterale: cancella le prove salvate in questo browser, con conferma.
  window.__BIGANT_ONLINE=true;
  Object.assign(ACTIONS,{'online-reset':()=>dialog('Ripartire dai dati di esempio?','<p>Le modifiche fatte in questo browser (lavori, approvazioni, giri dello sciame) vengono cancellate e l’app riparte dai dati di esempio iniziali.</p><div class="actions section"><button class="btn primary" data-action="online-reset-conferma">Sì, riparti da zero</button><button class="btn ghost" data-action="close">Annulla</button></div>'),'online-reset-conferma':()=>{toast('Riparto dai dati di esempio…');online.ricomincia();}});
  window.__BIGANT_START();
 }catch(e){document.getElementById('app').innerHTML='<main class="loading"><p>BigAnt OS non è riuscito a partire in questo browser.</p><p><small>'+String(e&&e.message||e).replace(/[<>&]/g,'')+'</small></p></main>';console.error(e);}
})();`)}`;
const file=pubblica?resolve(root,'online/pubblica/index.html'):resolve(uscita,'BigAnt-OS.html');
if(pubblica)mkdirSync(dirname(file),{recursive:true});
writeFileSync(file,pubblica?`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><meta name="description" content="BigAnt OS: prova con dati inventati."></head><body>${pagina}</body></html>`:pagina);
console.log(JSON.stringify({file:relative(root,file),versione,kb:Math.round(Buffer.byteLength(pagina)/1024),fileInclusi:Object.keys(vfs).length,credenziali:pubblica?'nessuna (profili DEMO)':relative(root,fileCredenziali)}));
