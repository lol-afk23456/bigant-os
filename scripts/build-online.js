// Costruisce BigAnt OS online: un'unica pagina HTML con dentro l'intero server (server.js + src/),
// la dashboard (public/) e SQLite in JavaScript. La pagina si pubblica come Artifact privato su claude.ai.
//
// Strumenti fissati, installati nella cartella tecnica esclusa da Git:
//   npm install --prefix .cache/build-online esbuild@0.25.10 buffer@6.0.3 sql.js@1.13.0
// Uso: node scripts/build-online.js
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
const uscita=resolve(root,'.cache/online');mkdirSync(uscita,{recursive:true});

// ---------- Credenziali di prova (mai nel repository) ----------
const fileCredenziali=resolve(uscita,'credenziali.json');
const alfabeto='ABCDEFGHJKMNPQRSTUVWXYZ23456789',parola=n=>[...randomBytes(n)].map(b=>alfabeto[b%alfabeto.length]).join('');
const credenziali=existsSync(fileCredenziali)?JSON.parse(readFileSync(fileCredenziali,'utf8')):{
 'demo-owner':{email:'socio@bigant.example',password:process.env.BIGANT_ONLINE_PASSWORD_SOCIO||`Socio-${parola(4)}-${parola(4)}`},
 'demo-client':{email:'cliente@aurora.example',password:process.env.BIGANT_ONLINE_PASSWORD_CLIENTE||`Cliente-${parola(4)}-${parola(4)}`}
};
writeFileSync(fileCredenziali,JSON.stringify(credenziali,null,1),{mode:0o600});

// ---------- File letti dal server a runtime: playbook, istruzioni degli agenti, giri reali registrati ----------
const vfs={};
const aggiungi=(cartella,filtro)=>{const d=resolve(root,cartella);if(!existsSync(d))return;for(const voce of readdirSync(d,{withFileTypes:true})){const p=resolve(d,voce.name);if(voce.isDirectory())aggiungi(relative(root,p),filtro);else if(filtro(voce.name))vfs['/app/'+relative(root,p)]=readFileSync(p,'utf8');}};
aggiungi('docs/playbook',n=>n.endsWith('.md'));
aggiungi('.claude/agents',n=>n.endsWith('.md'));
aggiungi('docs/demo-sciame',n=>n==='giro.json');

const shim=n=>resolve(root,'online/shim',n);
const moduli={'node:sqlite':shim('sqlite.js'),'node:crypto':shim('crypto.js'),'node:fs':shim('fs.js'),'node:path':shim('path.js'),'node:url':shim('url.js'),'node:http':shim('http.js'),
 'node:child_process':shim('varie.js'),'node:async_hooks':shim('varie.js'),'node:zlib':shim('varie.js')};
const predefiniti={sharp:'sharp',qrcode:'QRCode','@anthropic-ai/sdk':'Anthropic'};
const pluginOnline={name:'bigant-online',setup(b){
 b.onResolve({filter:/^node:/},a=>{if(moduli[a.path])return {path:moduli[a.path]};return {errors:[{text:'Modulo Node non previsto nella versione online: '+a.path}]};});
 b.onResolve({filter:/^(sharp|qrcode|@anthropic-ai\/sdk)$/},a=>({path:a.path,namespace:'sostituto'}));
 b.onLoad({filter:/.*/,namespace:'sostituto'},a=>({contents:`export {${predefiniti[a.path]} as default} from ${JSON.stringify(shim('varie.js'))};`,resolveDir:root}));
 // safePath serve solo all'avvio da riga di comando (cartella dati su disco).
 b.onResolve({filter:/scripts\/backup\.js$/},()=>({path:'backup',namespace:'sostituto-backup'}));
 b.onLoad({filter:/.*/,namespace:'sostituto-backup'},()=>({contents:'export async function safePath(){}',loader:'js'}));
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
const server=r.outputFiles[0].text;

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
.online-bar{position:fixed;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:50;display:flex;align-items:center;gap:8px;flex-wrap:wrap;max-width:calc(100vw - 24px);background:#141413;color:#f7f6f2;border-radius:999px;padding:6px 6px 6px 14px;font-size:12px;box-shadow:0 6px 24px rgba(20,20,19,.25)}
.online-bar button{border:0;border-radius:999px;padding:6px 12px;font:inherit;font-weight:600;cursor:pointer;background:#F26B21;color:#141413}
.online-bar button:focus-visible{outline:2px solid #fff;outline-offset:2px}
@media(max-width:720px){.online-bar{left:12px;right:12px;border-radius:14px;justify-content:space-between}}
</style>
<a class="skip" href="#main">Vai al contenuto</a>
<div id="app"><main class="loading" aria-live="polite"><p>Sto aprendo BigAnt OS nel tuo browser…</p></main></div>
<div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
<dialog id="dialog" aria-labelledby="dialog-title"><div id="dialog-content"></div></dialog>
<div class="online-bar" id="online-bar" hidden><span>Versione online di prova · i dati restano in questo browser</span><button type="button" id="online-reset">Ricomincia da capo</button></div>
${script(`try{const o=history.replaceState.bind(history);history.replaceState=(...a)=>{try{o(...a);}catch{}};}catch{}`)}
${script(sqlJs)}
${script(server)}
${script(app)}
${script(readFileSync(resolve(root,'public/ufficio.js'),'utf8'))}
${script(readFileSync(resolve(root,'public/cliente.js'),'utf8'))}
${script(`(async()=>{
 try{
  const b=atob(${JSON.stringify(logo)}),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
  window.__BIGANT_LOGO=URL.createObjectURL(new Blob([u],{type:'image/png'}));
  const online=await BigAntOnline.avvia();
  const barra=document.getElementById('online-bar'),tasto=document.getElementById('online-reset');barra.hidden=false;
  tasto.addEventListener('click',()=>{if(tasto.dataset.conferma){tasto.textContent='Ricomincio…';online.ricomincia();return;}tasto.dataset.conferma='1';tasto.textContent='Conferma: cancella le prove';setTimeout(()=>{delete tasto.dataset.conferma;tasto.textContent='Ricomincia da capo';},5000);});
  window.__BIGANT_START();
 }catch(e){document.getElementById('app').innerHTML='<main class="loading"><p>BigAnt OS non è riuscito a partire in questo browser.</p><p><small>'+String(e&&e.message||e).replace(/[<>&]/g,'')+'</small></p></main>';console.error(e);}
})();`)}`;
const file=resolve(uscita,'BigAnt-OS.html');writeFileSync(file,pagina);
console.log(JSON.stringify({file:relative(root,file),versione,kb:Math.round(Buffer.byteLength(pagina)/1024),fileInclusi:Object.keys(vfs).length,credenziali:relative(root,fileCredenziali)}));
