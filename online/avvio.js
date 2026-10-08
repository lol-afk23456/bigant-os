// BigAnt OS online: l'intero server (stesso codice di server.js e src/) gira dentro la pagina del browser.
// Il database SQLite vive nella scheda e si salva nel browser di chi la apre; nessun dato esce dal dispositivo.
// Le richieste /api/* della dashboard non vanno in rete: le serve il gestore del server, come in locale.
import './shim/globali.js';
import {createApp} from '../server.js';
import {passwordHash} from '../src/store.js';

const VERSIONE=__BIGANT_VERSIONE__,CREDENZIALI=__BIGANT_CREDENZIALI__;
const ORIGINE='http://127.0.0.1:4330';

// ---------- Salvataggio nel browser (IndexedDB). Se il browser lo blocca, l'app funziona lo stesso. ----------
const apriDb=()=>new Promise((ok,ko)=>{const r=indexedDB.open('bigant-os-online',1);r.onupgradeneeded=()=>r.result.createObjectStore('dati');r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error);});
async function leggi(chiave){try{const d=await apriDb();return await new Promise(ok=>{const q=d.transaction('dati').objectStore('dati').get(chiave);q.onsuccess=()=>ok(q.result??null);q.onerror=()=>ok(null);});}catch{return null;}}
async function scrivi(chiave,valore){try{const d=await apriDb();await new Promise(ok=>{const t=d.transaction('dati','readwrite');t.objectStore('dati').put(valore,chiave);t.oncomplete=ok;t.onerror=ok;});}catch{}}
async function cancella(){try{const d=await apriDb();await new Promise(ok=>{const t=d.transaction('dati','readwrite');t.objectStore('dati').clear();t.oncomplete=ok;t.onerror=ok;});}catch{}}

let cookie='',salvataggio=null;
function salvaTraPoco(){clearTimeout(salvataggio);salvataggio=setTimeout(salva,1500);}
async function salva(){const db=globalThis.__BIGANT_DB;if(db)await scrivi('database',{versione:VERSIONE,dati:db.esporta()});await scrivi('sessione',{versione:VERSIONE,cookie});}

// ---------- fetch: /api/* passa al gestore del server; tutto il resto resta com'è ----------
function installaFetch(){
 const originale=globalThis.fetch.bind(globalThis);
 globalThis.fetch=async(risorsa,opz={})=>{
  const url=new URL(typeof risorsa==='string'||risorsa instanceof URL?String(risorsa):risorsa.url,location.href);
  if(!url.pathname.startsWith('/api/'))return originale(risorsa,opz);
  const metodo=String(opz.method||'GET').toUpperCase(),intestazioni={host:'127.0.0.1:4330'};
  for(const [k,v] of Object.entries(opz.headers||{}))intestazioni[k.toLowerCase()]=String(v);
  if(!['GET','HEAD'].includes(metodo))intestazioni.origin=ORIGINE;
  if(cookie)intestazioni.cookie=cookie;
  const corpo=opz.body==null?null:Buffer.from(typeof opz.body==='string'?opz.body:new Uint8Array(opz.body));
  const req={method:metodo,url:url.pathname+url.search,headers:intestazioni,socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){if(corpo)yield corpo;}};
  return new Promise(ok=>{
   const h={};let stato=200;
   const res={headersSent:false,setHeader(k,v){h[k.toLowerCase()]=v;},getHeader:k=>h[k.toLowerCase()],removeHeader(k){delete h[k.toLowerCase()];},
    writeHead(s,extra={}){stato=s;for(const [k,v] of Object.entries(extra))h[k.toLowerCase()]=v;res.headersSent=true;return res;},write(){},
    end(dati){const sc=h['set-cookie'];if(sc){const v=String(Array.isArray(sc)?sc[0]:sc).split(';')[0];cookie=v.endsWith('=')?'':v;}
     const intest=new Headers();for(const [k,v] of Object.entries(h))if(k!=='set-cookie')intest.set(k,String(v));
     ok(new Response([204,304].includes(stato)?null:(dati??null),{status:stato,headers:intest}));
     if(metodo!=='GET'||sc)salvaTraPoco();}};
   Promise.resolve(globalThis.__BIGANT_GESTORE(req,res)).catch(e=>{if(!res.headersSent)res.writeHead(500,{'content-type':'application/json'});res.end(JSON.stringify({error:e.message}));});
  });
 };
}

export async function avvia(){
 globalThis.__BIGANT_SQL=await globalThis.initSqlJs();
 const [db,sessione]=await Promise.all([leggi('database'),leggi('sessione')]);
 if(db?.versione===VERSIONE)globalThis.__BIGANT_DB_SALVATO=db.dati;
 if(sessione?.versione===VERSIONE)cookie=sessione.cookie||'';
 const app=createApp({worker:true,importaProveSciame:true,// nel sito pubblico i giri reali non sono inclusi: l'import trova la cartella vuota
 env:{BIGANT_MOTORE:'demo',BIGANT_DEMO_RITMO_MS:'6000',BIGANT_APPROVAZIONE_AUTOMATICA_DEMO:'true',BIGANT_SCIAME_PARALLELISMO:'3'}});
 app.server.listen(4330,'127.0.0.1');
 // Password dei due accessi di prova (scelte alla costruzione della pagina, mai salvate nel repository).
 for(const [id,password] of Object.entries(CREDENZIALI))app.store.run('UPDATE os_users SET password_hash=? WHERE id=?',passwordHash(password),id);
 installaFetch();
 setInterval(()=>{if(!document.hidden)salva();},20000);
 addEventListener('pagehide',()=>{salva();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)salva();});
 return {app,ricomincia:async()=>{clearTimeout(salvataggio);globalThis.__BIGANT_DB=null;await cancella();location.reload();}};
}
