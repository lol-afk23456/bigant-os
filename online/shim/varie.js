// Moduli che nella versione online non servono o non possono funzionare: rispondono in modo esplicito.
export const spawn=()=>{throw new Error('Nella versione online non si avviano programmi: il motore Claude Code funziona solo sul computer.');};
export const spawnSync=()=>({status:1,stdout:'',stderr:'non disponibile online'});
export class AsyncLocalStorage{run(stato,fn,...a){this.stato=stato;return fn(...a);}getStore(){return this.stato;}enterWith(s){this.stato=s;}}
// zlib: blocchi "stored" (senza compressione) con intestazione zlib e Adler-32: PNG validi e leggibili.
export function deflateSync(dati){
 const b=dati instanceof Uint8Array?dati:new Uint8Array(dati),parti=[Uint8Array.of(0x78,0x01)];
 for(let i=0;i<b.length||i===0;i+=65535){const pezzo=b.subarray(i,i+65535),ultimo=i+65535>=b.length;parti.push(Uint8Array.of(ultimo?1:0,pezzo.length&255,pezzo.length>>8,~pezzo.length&255,(~pezzo.length>>8)&255),pezzo);if(ultimo)break;}
 let a=1,c=0;for(const x of b){a=(a+x)%65521;c=(c+a)%65521;}parti.push(Uint8Array.of(c>>8,c&255,a>>8,a&255));
 const out=new Uint8Array(parti.reduce((n,x)=>n+x.length,0));let o=0;for(const x of parti){out.set(x,o);o+=x.length;}return Buffer.from(out);
}
const nonOnline=nome=>()=>{throw new Error(nome+' non è disponibile nella versione online.');};
export const sharp=Object.assign(nonOnline('L’elaborazione delle immagini'),{});
export const QRCode={toBuffer:async()=>{throw new Error('Il codice QR si genera solo nella versione sul computer.');},toDataURL:nonOnline('Il codice QR')};
export class Anthropic{constructor(){throw new Error('Il motore API non è attivo nella versione online.');}}
