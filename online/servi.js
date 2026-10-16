// Sito pubblico di prova di BigAnt OS (Railway): serve una sola pagina, online/pubblica/index.html,
// dentro cui gira l'intera app con dati inventati salvati nel browser di ogni visitatore.
// Nessun database sul server, nessuna chiave, nessuna chiamata verso servizi esterni.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';

const pagina=readFileSync(new URL('./pubblica/index.html',import.meta.url));
const compressa=gzipSync(pagina,{level:9}),etag='"'+createHash('sha256').update(pagina).digest('hex').slice(0,16)+'"';
const sicurezza={
 'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'",
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=()',
 'Strict-Transport-Security':'max-age=31536000'
};
const porta=Number(process.env.PORT||8080);
createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end();}
 const percorso=new URL(req.url,'http://x').pathname;
 if(percorso==='/salute'){res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});return res.end('ok');}
 if(percorso==='/robots.txt'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('User-agent: *\nDisallow: /\n');}
 if(percorso!=='/'&&percorso!=='/index.html'){res.writeHead(302,{Location:'/'});return res.end();}
 if(req.headers['if-none-match']===etag){res.writeHead(304,{ETag:etag});return res.end();}
 const gzip=/\bgzip\b/.test(req.headers['accept-encoding']||'');
 res.writeHead(200,{...sicurezza,'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache',ETag:etag,Vary:'Accept-Encoding',...(gzip?{'Content-Encoding':'gzip'}:{})});
 res.end(req.method==='HEAD'?undefined:gzip?compressa:pagina);
}).listen(porta,'0.0.0.0',()=>console.info(`BigAnt OS · prova pubblica · porta ${porta}`));
