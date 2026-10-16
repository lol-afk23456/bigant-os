// node:crypto per il browser: SHA-256 in JavaScript, casualità dal browser.
// scryptSync qui è una derivazione SHA-256 iterata: vale solo per gli utenti DEMO salvati nel browser.
const testo=new TextEncoder();
const byte=(x,enc)=>x instanceof Uint8Array?x:typeof x==='string'?(enc&&enc!=='utf8'&&enc!=='utf-8'?Buffer.from(x,enc):testo.encode(x)):new Uint8Array(x);
const H0=[],K=[];{let n=2,c=0;const primo=x=>{for(let d=2;d*d<=x;d++)if(x%d===0)return false;return true;};while(c<64){if(primo(n)){if(c<8)H0[c]=(Math.sqrt(n)%1)*4294967296|0;K[c]=(Math.cbrt(n)%1)*4294967296|0;c++;}n++;}}
export function sha256(dati){
 const l=dati.length,tot=((l+9+63)>>6)<<6,m=new Uint8Array(tot);m.set(dati);m[l]=0x80;
 const dv=new DataView(m.buffer);dv.setUint32(tot-8,Math.floor(l/0x20000000));dv.setUint32(tot-4,(l*8)>>>0);
 const H=H0.slice(),W=new Int32Array(64);
 for(let o=0;o<tot;o+=64){
  for(let i=0;i<16;i++)W[i]=dv.getInt32(o+i*4);
  for(let i=16;i<64;i++){const a=W[i-15],b=W[i-2];const s0=((a>>>7)|(a<<25))^((a>>>18)|(a<<14))^(a>>>3),s1=((b>>>17)|(b<<15))^((b>>>19)|(b<<13))^(b>>>10);W[i]=(W[i-16]+s0+W[i-7]+s1)|0;}
  let [a,b,c,d,e,f,g,h]=H;
  for(let i=0;i<64;i++){const S1=((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7)),ch=(e&f)^(~e&g),t1=(h+S1+ch+K[i]+W[i])|0,S0=((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10)),mj=(a&b)^(a&c)^(b&c),t2=(S0+mj)|0;h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
  H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0;
 }
 const out=new Uint8Array(32),ov=new DataView(out.buffer);H.forEach((x,i)=>ov.setInt32(i*4,x));return out;
}
const unisci=(...p)=>{const out=new Uint8Array(p.reduce((n,x)=>n+x.length,0));let i=0;for(const x of p){out.set(x,i);i+=x.length;}return out;};
export function createHash(alg){
 if(String(alg).toLowerCase()!=='sha256')throw new Error('Nella versione online è disponibile solo SHA-256.');
 const parti=[];const h={update(x,enc){parti.push(byte(x,enc));return h;},digest(enc){const b=Buffer.from(sha256(unisci(...parti)));return enc?b.toString(enc):b;}};return h;
}
export const randomUUID=()=>globalThis.crypto.randomUUID();
export const randomBytes=n=>Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(n)));
export function timingSafeEqual(a,b){if(a.length!==b.length)throw new RangeError('Lunghezze diverse.');let d=0;for(let i=0;i<a.length;i++)d|=a[i]^b[i];return d===0;}
export function scryptSync(password,salt,lunghezza){
 let h=sha256(unisci(byte(String(password)),byte(String(salt))));
 for(let i=0;i<2000;i++)h=sha256(unisci(h,byte(String(password))));
 const blocchi=[];for(let i=0;blocchi.length*32<lunghezza;i++)blocchi.push(sha256(unisci(h,Uint8Array.of(i))));
 return Buffer.from(unisci(...blocchi).slice(0,lunghezza));
}
export default {createHash,randomUUID,randomBytes,timingSafeEqual,scryptSync};
