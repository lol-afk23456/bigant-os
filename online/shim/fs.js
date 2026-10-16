// node:fs per il browser: file di sola lettura inclusi al momento della costruzione (playbook, agenti, giri reali).
// Le scritture restano in memoria nella scheda del browser.
import vfs from 'virtual:vfs';
const file=new Map(Object.entries(vfs));
const norm=p=>String(p).replace(/\/+$/,'')||'/';
const errore=p=>Object.assign(new Error(`ENOENT: file non presente nella versione online: ${p}`),{code:'ENOENT'});
const cartella=p=>{const d=norm(p)+'/';for(const k of file.keys())if(k.startsWith(d))return true;return false;};
export function readFileSync(p,opz){const k=norm(p);if(!file.has(k))throw errore(k);const t=file.get(k),enc=typeof opz==='string'?opz:opz?.encoding;return enc?t:Buffer.from(t);}
export function readdirSync(p,opz){const d=norm(p)+'/';if(!cartella(p))throw errore(p);const nomi=[...new Set([...file.keys()].filter(k=>k.startsWith(d)).map(k=>k.slice(d.length).split('/')[0]))].sort();return opz?.withFileTypes?nomi.map(name=>({name,isFile:()=>file.has(d+name),isDirectory:()=>!file.has(d+name)})):nomi;}
export const existsSync=p=>file.has(norm(p))||cartella(p);
export function statSync(p){const f=file.has(norm(p)),c=cartella(p);if(!f&&!c)throw errore(p);return {isFile:()=>f,isDirectory:()=>c,size:f?file.get(norm(p)).length:0,mode:0o600};}
export function writeFileSync(p,dati){file.set(norm(p),typeof dati==='string'?dati:new TextDecoder().decode(dati));}
export function mkdirSync(){}
export default {readFileSync,readdirSync,existsSync,statSync,writeFileSync,mkdirSync};
