// Oggetti globali di Node richiesti dal codice del server, ricreati nel browser.
import {Buffer} from 'buffer';
globalThis.Buffer=Buffer;
// Il pacchetto buffer non conosce 'base64url' (usato per token e sessioni): conversione da/verso base64.
const toStringBase=Buffer.prototype.toString,fromBase=Buffer.from;
Buffer.prototype.toString=function(enc,...a){return enc==='base64url'?toStringBase.call(this,'base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''):toStringBase.call(this,enc,...a);};
Buffer.from=function(x,enc,...a){return enc==='base64url'&&typeof x==='string'?fromBase.call(Buffer,x.replace(/-/g,'+').replace(/_/g,'/'),'base64'):fromBase.call(Buffer,x,enc,...a);};
const isEncodingBase=Buffer.isEncoding;Buffer.isEncoding=e=>e==='base64url'||isEncodingBase(e);
// Senza process.versions: SQLite (Emscripten) non deve credere di essere in Node.
globalThis.process=globalThis.process||{env:{},argv:[],cwd:()=>'/app',on(){},exit(){},nextTick:(f,...a)=>queueMicrotask(()=>f(...a))};
globalThis.setImmediate=globalThis.setImmediate||((f,...a)=>setTimeout(f,0,...a));
// Nel browser i timer sono numeri: unref() di Node non fa nulla.
if(!Number.prototype.unref)Object.defineProperties(Number.prototype,{unref:{value(){return this;}},ref:{value(){return this;}}});
