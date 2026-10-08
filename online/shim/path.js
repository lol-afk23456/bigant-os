// node:path (POSIX) per il browser. La cartella del progetto è /app.
const normalizza=p=>{const out=[];for(const x of p.split('/')){if(!x||x==='.')continue;if(x==='..')out.pop();else out.push(x);}return '/'+out.join('/');};
export function resolve(...parti){let p='';for(let i=parti.length-1;i>=0&&!p.startsWith('/');i--)p=parti[i]+(p?'/'+p:'');if(!p.startsWith('/'))p='/app/'+p;return normalizza(p);}
export const join=(...p)=>normalizza(p.join('/')).replace(/^\//,p[0]?.startsWith('/')?'/':'');
export const dirname=p=>{const s=String(p).replace(/\/+$/,''),i=s.lastIndexOf('/');return i<=0?'/':s.slice(0,i);};
export const basename=(p,ext='')=>{const b=String(p).replace(/\/+$/,'').split('/').pop();return ext&&b.endsWith(ext)?b.slice(0,-ext.length):b;};
export const extname=p=>{const b=basename(p),i=b.lastIndexOf('.');return i>0?b.slice(i):'';};
export const relative=(da,a)=>{const x=resolve(da).split('/').filter(Boolean),y=resolve(a).split('/').filter(Boolean);let i=0;while(i<x.length&&x[i]===y[i])i++;return [...x.slice(i).map(()=>'..'),...y.slice(i)].join('/');};
export const sep='/';
export default {resolve,join,dirname,basename,extname,relative,sep};
