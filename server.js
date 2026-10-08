import http from 'node:http';
import QRCode from 'qrcode';
import {safePath} from './scripts/backup.js';
import {readFileSync,mkdirSync,statSync,existsSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {openStore,seedCore,AppError,requireOwner,requireClient,canAccessClient,passwordHash,verifyPassword,uid,now,text} from './src/store.js';
import {services,departments,agentDefinitions,integrations,managementModules} from './src/registry.js';
import {createProduction} from './src/production.js';
import {createGrowthModule} from './src/growth.js';
import {createFidelityModule} from './src/fidelity.js';
import {createAdministrationModule} from './src/administration.js';
import {createOrchestrator} from './src/orchestrator.js';
import {createAgencyModule} from './src/agency/index.js';
const root=dirname(fileURLToPath(import.meta.url));
const brandAssets=Object.freeze({
  '/brand/logo.png':{file:'logo.png.base64',sha256:'664e4ae8d8170427554fe36c2739562b71f24b8ed533f6068aa012b97ec2864c'},
  '/brand/icon.png':{file:'icon.png.base64',sha256:'be66a098b2a5ffa99187279e7c606d24129fc13d34b865a17dcf530506ca0009'}
});
export function decodeBrandAsset(encoded,expectedSha256){
  if(typeof encoded!=='string'||encoded.length>1000000||/[^A-Za-z0-9+/=\r\n]/.test(encoded))throw new Error('Codifica base64 del brand non valida.');
  const compact=encoded.replace(/[\r\n]/g,''),bytes=Buffer.from(compact,'base64');
  if(!compact||compact.length%4!==0||bytes.toString('base64')!==compact)throw new Error('Codifica base64 del brand non valida.');
  if(!/^[a-f0-9]{64}$/.test(expectedSha256)||createHash('sha256').update(bytes).digest('hex')!==expectedSha256)throw new Error('Integrità SHA-256 del brand non valida.');
  return bytes;
}
const digest=value=>createHash('sha256').update(String(value)).digest('hex');
const safeEqual=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&timingSafeEqual(x,y);};
const profiles=['demo-owner','demo-collaborator','demo-client','demo-client-other'];
const publicUser={id:'os-public',role:'owner',name:'Visitatore DEMO',active:1};
export function createApp({database=':memory:',origin='http://127.0.0.1:4330',worker=false,clock=()=>new Date()}={}) {
  const base=new URL(origin);if(base.protocol!=='http:'||!['localhost','127.0.0.1'].includes(base.hostname))throw new Error('Prototipo DEMO: è consentito soltanto un indirizzo HTTP locale.');
  const store=openStore(database);seedCore(store);
  const production=createProduction({store}),growth=createGrowthModule({store,origin}),fidelity=createFidelityModule({store,origin}),administration=createAdministrationModule({store,clock});
  growth.seed();fidelity.seed();administration.seed();
  const orchestrator=createOrchestrator({store,production,administration,growth,fidelity,clock});
  const agency=createAgencyModule({store});
  const limits=new Map();
  function rate(key,max=120,window=60000) {let l=limits.get(key);if(!l||l.until<Date.now()){l={count:0,until:Date.now()+window};limits.set(key,l);}if(++l.count>max)throw new AppError('Troppe richieste: riprova tra poco.',429);if(limits.size>10000)for(const[k,v]of limits)if(v.until<Date.now())limits.delete(k);}
  function session(req) {const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('bigant_os='))?.slice(10);if(!token)return null;return store.one('SELECT u.id,u.name,u.email,u.role,u.tenant_id,u.active,s.csrf,s.id session_id FROM os_sessions s JOIN os_users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>? AND u.active=1',digest(token),Date.now());}
  function safeUser(u){return u?{id:u.id,name:u.name,email:u.email,role:u.role,tenant_id:u.tenant_id,active:u.active}:null;}
  function login(res,u) {const token=randomBytes(32).toString('base64url'),csrf=randomBytes(32).toString('base64url');store.run('INSERT INTO os_sessions VALUES(?,?,?,?)',digest(token),u.id,csrf,Date.now()+8*3600000);res.setHeader('Set-Cookie',`bigant_os=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);store.audit(u,u.tenant_id,'Accesso effettuato',u.id);return {user:safeUser(u),csrf,demo:true};}
  async function body(req) {let length=0;const chunks=[];for await(const chunk of req){length+=chunk.length;if(length>800000)throw new AppError('Richiesta troppo grande.',413);chunks.push(chunk);}if(!length)return{};if(!req.headers['content-type']?.includes('application/json'))throw new AppError('Formato della richiesta non supportato.',415);try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new AppError('Dati non validi.');}}
  const json=(res,data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  function reply(res,result){if(!result)throw new AppError('Funzione non trovata.',404);if(result.contentType&&!result.contentType.startsWith('application/json')){res.writeHead(result.status||200,{'Content-Type':result.contentType,'Cache-Control':'no-store'});return res.end(result.data);}return json(res,result.data,result.status||200);}
  function allClients(user){return store.query('SELECT * FROM os_clients WHERE active=1').filter(c=>canAccessClient(store,user,c.id));}
  function clientFrom(url,user) {const id=url.searchParams.get('clientId')||user.tenant_id||(user.role==='owner'?'demo-bigant':allClients(user)[0]?.id);if(!id)throw new AppError('Nessuna attività assegnata.',403);requireClient(store,user,id);return id;}
  function overview(user,clientId){
    const clients=allClients(user),currentClient=clients.find(c=>c.id===clientId),ownedServices=JSON.parse(currentClient.services_json);
    const tasks=store.query('SELECT * FROM os_tasks WHERE client_id=? ORDER BY due',clientId).filter(t=>user.role!=='client'||ownedServices.includes(t.service)||t.service==='account');
    const contents=store.query('SELECT * FROM os_contents WHERE client_id=? ORDER BY updated_at DESC',clientId).filter(c=>user.role!=='client'||ownedServices.includes(c.service));
    const approvals=store.query('SELECT * FROM os_approvals WHERE client_id=? ORDER BY created_at DESC',clientId).filter(a=>user.role==='owner'||(a.kind==='content'&&contents.some(c=>c.id===a.entity_id))||(a.kind==='fidelity_campaign'&&ownedServices.includes('fidelity')));
    const activity=store.query(`SELECT * FROM os_audit WHERE client_id=? ${user.role==='owner'?'':user.role==='client'?"AND visibility='client'":"AND visibility!='admin'"} ORDER BY created_at DESC LIMIT 100`,clientId).map(a=>({...a,detail:JSON.parse(a.detail)}));
    const memory=store.query(`SELECT * FROM os_memory WHERE client_id=? AND ${user.role==='client'?"visibility='client'":"visibility!='admin'"}`,clientId);
    const agency=user.role==='owner'?{
      tasksOpen:store.one("SELECT count(*) n FROM os_tasks WHERE status!='done'").n,
      late:store.one("SELECT count(*) n FROM os_tasks WHERE status!='done' AND due<?",now()).n,
      approvalsPending:store.one("SELECT count(*) n FROM os_approvals WHERE status='pending'").n,
      servicesPerClient:clients.map(c=>({clientId:c.id,count:JSON.parse(c.services_json).length})),
      approvals:store.query('SELECT * FROM os_approvals ORDER BY created_at DESC LIMIT 300'),
      activity:store.query('SELECT a.*,u.name actor_name FROM os_audit a LEFT JOIN os_users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 150').map(a=>({...a,detail:JSON.parse(a.detail)})),
      priorities:store.query("SELECT * FROM os_jobs WHERE agent='director' AND status='done' ORDER BY finished_at DESC LIMIT 1").flatMap(j=>JSON.parse(j.result).priorities||[])
    }:null;
    return {user:safeUser(user),demo:true,workerError,agency,clients,currentClient,currentClientServices:ownedServices,tasks,contents,approvals,activity,memory,
      summary:{tasksOpen:tasks.filter(t=>t.status!=='done').length,late:tasks.filter(t=>t.status!=='done'&&t.due&&t.due<now()).length,approvalsPending:approvals.filter(a=>a.status==='pending').length,clientsActive:clients.length},
      registry:{services:user.role==='client'?services.filter(x=>ownedServices.includes(x.id)):services,departments:user.role==='owner'?departments:[],agents:user.role==='owner'?agentDefinitions:[],integrations,managementModules:user.role==='owner'?managementModules:[]},
      admin:user.role==='owner'?administration.state(clientId,user):null};
  }
  async function handler(req,res){
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(self), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'");
    try{
      const bound=server.address();const runtimeOrigin=`http://${base.hostname}:${typeof bound==='object'&&bound?bound.port:base.port||4330}`;
      if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||req.headers.host!==new URL(runtimeOrigin).host)throw new AppError('Il prototipo è disponibile solo in locale.',403);
      const url=new URL(req.url,runtimeOrigin),path=url.pathname,method=req.method;
      if(!['GET','HEAD','POST','PATCH','DELETE'].includes(method))throw new AppError('Metodo non consentito.',405);
      if(method==='GET'&&path==='/health')return json(res,{status:'ok',app:'BigAnt OS',demo:true,externalActions:false});
      const u=session(req);
      if(method==='GET'&&path==='/api/session')return json(res,{user:safeUser(u),csrf:u?.csrf||null,demo:true,profiles:profiles.map(id=>store.one('SELECT id,name,role FROM os_users WHERE id=? AND active=1',id)).filter(Boolean)});
      if(!['GET','HEAD'].includes(method)&&req.headers.origin!==runtimeOrigin)throw new AppError('Origine della richiesta non autorizzata.',403);
      if(method==='POST'&&path==='/api/demo/login'){rate('login:'+req.socket.remoteAddress,30,60000);const b=await body(req);if(!profiles.includes(b.profile))throw new AppError('Profilo dimostrativo non valido.');const profile=store.one('SELECT * FROM os_users WHERE id=? AND active=1',b.profile);if(!profile)throw new AppError('Profilo disattivato.',403);return json(res,login(res,profile));}
      if(method==='POST'&&path==='/api/login'){rate('password:'+req.socket.remoteAddress,8,900000);const b=await body(req);const user=store.one('SELECT * FROM os_users WHERE email=? AND active=1',text(b.email,254).toLowerCase());if(!user||user.id==='os-orchestrator'||!user.password_hash||!verifyPassword(typeof b.password==='string'&&b.password.length<=256?b.password:'',user.password_hash))throw new AppError('Email o password non corretta.',401);return json(res,login(res,user));}
      if(method==='GET'&&/^\/api\/fidelity\/public\/cards\/[^/]+\/qr$/.test(path)){rate('public:'+req.socket.remoteAddress,80);const token=path.split('/')[5];await fidelity.handle({method:'GET',path:'/public/cards/'+token,user:null});return reply(res,{data:await QRCode.toBuffer(runtimeOrigin+'/fidelity/card/'+token,{type:'png',width:280,margin:2,errorCorrectionLevel:'M'}),contentType:'image/png'});}
      if(path.startsWith('/api/fidelity/public/')||((/^\/api\/fidelity\/branding\/[^/]+\.png$/.test(path)||path==='/api/fidelity/wallet/icon.png')&&method==='GET')) {rate('public:'+req.socket.remoteAddress,80);return reply(res,await fidelity.handle({method,path:path.slice('/api/fidelity'.length)+url.search,body:['GET','HEAD'].includes(method)?{}:await body(req),user:null,clientId:null}));}
      let publicGrowth=path.match(/^\/api\/growth\/(public\/book|unsubscribe)\/([^/]+)$/);
      if(publicGrowth||path==='/api/growth/public/inquiry'){
        rate('public:'+req.socket.remoteAddress,80);let clientId='demo-bigant';
        if(publicGrowth){const kind=publicGrowth[1]==='unsubscribe'?'unsubscribe':'booking';const t=store.one('SELECT workspace FROM gr_tokens WHERE id=? AND kind=? AND expires>?',publicGrowth[2],kind,Date.now());if(!t)throw new AppError('Collegamento scaduto o non valido.',410);clientId=t.workspace;}
        if(!store.one('SELECT 1 FROM os_clients WHERE id=? AND active=1',clientId))throw new AppError('Attività non disponibile.',404);
        return reply(res,await growth.handle({method,path:path.slice('/api/growth'.length),body:['GET','HEAD'].includes(method)?{}:await body(req),user:publicUser,clientId}));
      }
      if(path.startsWith('/api/')){
        if(!u)throw new AppError('Accedi per continuare.',401);rate('api:'+u.id,300);
        if(!['GET','HEAD'].includes(method)&&!safeEqual(req.headers['x-csrf-token'],u.csrf))throw new AppError('Sessione scaduta: ricarica la pagina.',403);
        if(path==='/api/logout'&&method==='POST'){store.run('DELETE FROM os_sessions WHERE id=?',u.session_id);res.setHeader('Set-Cookie','bigant_os=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,{ok:true});}
        const clientId=clientFrom(url,u);
        const b=['GET','HEAD'].includes(method)?{}:await body(req);
        if(path==='/api/overview'&&method==='GET')return json(res,overview(u,clientId));
        if(path==='/api/clients'&&method==='GET')return json(res,{items:allClients(u)});
        if(path==='/api/clients'&&method==='POST') {requireOwner(u);const name=text(b.name,140),slug=text(b.slug,100);if(!name||!/^[a-z0-9-]{3,100}$/.test(slug))throw new AppError('Nome e identificativo attività non validi.');if(!Array.isArray(b.services)||b.services.some(x=>!services.some(y=>y.id===x)))throw new AppError('Seleziona servizi validi.');const id=uid();try{store.run('INSERT INTO os_clients(id,name,slug,industry,services_json,created_at) VALUES(?,?,?,?,?,?)',id,name.includes('DEMO')?name:name+' · DEMO',slug,text(b.industry,100),JSON.stringify([...new Set(b.services)]),now());}catch(e){if(String(e).includes('UNIQUE'))throw new AppError('Identificativo già utilizzato.',409);throw e;}store.audit(u,id,'Attività creata',id);orchestrator.event('client.created',id,id);return json(res,{id},201);}
        let m=path.match(/^\/api\/clients\/([^/]+)$/);if(m&&method==='PATCH'){requireOwner(u);const c=store.one('SELECT * FROM os_clients WHERE id=?',m[1]);if(!c)throw new AppError('Attività non trovata.',404);const selected=b.services??JSON.parse(c.services_json);if(!Array.isArray(selected)||selected.some(x=>!services.some(y=>y.id===x)))throw new AppError('Servizi non validi.');const risk=b.risk??c.risk;if(!['normal','watch','risk'].includes(risk))throw new AppError('Stato di rischio non valido.');store.run('UPDATE os_clients SET services_json=?,risk=? WHERE id=?',JSON.stringify(selected),risk,c.id);store.audit(u,c.id,'Servizi e rischio aggiornati',c.id);return json(res,{ok:true});}
        if(path==='/api/users'&&method==='GET'){requireOwner(u);return json(res,{items:store.query('SELECT id,name,email,role,tenant_id,active FROM os_users WHERE id!=?' , 'os-orchestrator'),assignments:store.query('SELECT * FROM os_assignments')});}
        if(path==='/api/users'&&method==='POST'){requireOwner(u);if(!['owner','collaborator','client'].includes(b.role)||!text(b.name,100)||!/^([^\s@]+)@[^\s@]+\.example$/.test(text(b.email,254))||typeof b.password!=='string'||b.password.length<14||b.password.length>256)throw new AppError('Nome, email .example, ruolo e password di almeno 14 caratteri sono obbligatori.');const tenant=b.role==='client'?b.clientId:null;if(tenant)requireClient(store,u,tenant);else if(b.role==='client')throw new AppError('Assegna il cliente.');const assignments=b.role==='collaborator'?(b.clientIds||[]):[];if(!Array.isArray(assignments))throw new AppError('Assegnazioni non valide.');assignments.forEach(id=>requireClient(store,u,id));const id=uid();store.transaction(()=>{store.run('INSERT INTO os_users(id,tenant_id,name,email,password_hash,role,created_at) VALUES(?,?,?,?,?,?,?)',id,tenant,text(b.name,100),text(b.email,254).toLowerCase(),passwordHash(b.password),b.role,now());for(const c of new Set(assignments))store.run('INSERT INTO os_assignments VALUES(?,?)',id,c);store.audit(u,null,'Accesso DEMO creato',id,{role:b.role});});return json(res,{id},201);}
        m=path.match(/^\/api\/users\/([^/]+)$/);if(m&&method==='PATCH'){requireOwner(u);const target=store.one('SELECT * FROM os_users WHERE id=?',m[1]);if(!target)throw new AppError('Utente non trovato.',404);if(target.id==='os-orchestrator')throw new AppError('Identità tecnica senza accesso interattivo.',403);if(b.active===false&&target.id===u.id)throw new AppError('Non puoi disattivare il tuo accesso.',409);if(b.active!==undefined&&typeof b.active!=='boolean')throw new AppError('Stato non valido.');if(b.password!==undefined&&(typeof b.password!=='string'||b.password.length<14||b.password.length>256))throw new AppError('Password di almeno 14 caratteri.');store.transaction(()=>{if(b.active!==undefined)store.run('UPDATE os_users SET active=? WHERE id=?',b.active?1:0,target.id);if(b.password!==undefined)store.run('UPDATE os_users SET password_hash=? WHERE id=?',passwordHash(b.password),target.id);store.run('DELETE FROM os_sessions WHERE user_id=?',target.id);store.audit(u,null,'Accesso DEMO aggiornato',target.id);});return json(res,{ok:true});}
        m=path.match(/^\/api\/approvals\/([^/]+)$/);if(m&&method==='POST'){
          const a=store.one('SELECT * FROM os_approvals WHERE id=?',m[1]);if(!a)throw new AppError('Richiesta non trovata.',404);requireClient(store,u,a.client_id);
          if(a.client_id!==clientId)throw new AppError('Seleziona l’attività della richiesta.',403);
          if(a.status!=='pending')throw new AppError('Richiesta già decisa o superata.',409);
          if(!['approved','rejected','changes'].includes(b.decision))throw new AppError('Decisione non valida.');
          if(b.decision!=='approved'&&!text(b.reason))throw new AppError('Indica il motivo della richiesta.');
          if(a.kind==='growth_message'){requireOwner(u);const current=store.one("SELECT MAX(version) version FROM os_approvals WHERE kind='growth_message' AND entity_id=?",a.entity_id);if(current.version!==a.version)throw new AppError('Versione superata.',409);return reply(res,await growth.handle({method:'PATCH',path:'/messages/'+a.entity_id,body:{status:b.decision==='approved'?'approved':b.decision==='changes'?'draft':'cancelled',reason:b.reason},user:u,clientId}));}
          if(a.kind==='fidelity_campaign'&&u.role!=='owner'&&!JSON.parse(store.one('SELECT services_json FROM os_clients WHERE id=?',clientId).services_json).includes('fidelity'))throw new AppError('Servizio Fidelity non attivo.',403);
          if(a.kind==='fidelity_campaign')return reply(res,await fidelity.handle({method:'POST',path:'/campaigns/'+a.entity_id+'/decision',body:{...b,version:a.version},user:u,clientId}));
          return reply(res,await production.handle({method:'POST',path:'/approvals/'+a.id,body:b,user:u,clientId}));
        }
        for(const [name,module]of Object.entries({growth,fidelity,administration,agents:orchestrator,production,agency}))if(path.startsWith('/api/'+name+'/')){
          if(name==='growth'||name==='administration'||name==='agents')requireOwner(u);
          if(name==='fidelity'&&u.role!=='owner'&&!JSON.parse(store.one('SELECT services_json FROM os_clients WHERE id=?',clientId).services_json).includes('fidelity'))throw new AppError('Servizio Fidelity non attivo.',403);
          const relative=path.slice(('/api/'+name).length)+(name==='fidelity'?url.search:'');
          if(name==='fidelity'&&method==='GET'&&/^\/programs\/[^/]+\/qr$/.test(relative.split('?')[0])){const programId=relative.split('/')[2];const program=store.one('SELECT id FROM fi_programs WHERE id=? AND tenant_id=? AND active=1',programId,clientId);if(!program)throw new AppError('Programma non disponibile.',404);const slug=store.one('SELECT slug FROM os_clients WHERE id=?',clientId).slug;return reply(res,{data:await QRCode.toBuffer(runtimeOrigin+'/fidelity/join/'+encodeURIComponent(slug)+'?program='+encodeURIComponent(programId),{type:'png',width:280,margin:2,errorCorrectionLevel:'M'}),contentType:'image/png'});}
          const result=await module.handle({method,path:relative,body:b,user:u,clientId});
          if(result&&method==='POST'&&name==='growth'&&relative==='/leads')orchestrator.event('lead.created',clientId,result.data.id);
          if(result&&method==='PATCH'&&name==='production'&&b.state==='DA APPROVARE')orchestrator.event('content.ready',clientId,result.data.id,result.data.version);
          return reply(res,result);
        }
        throw new AppError('Funzione non trovata.',404);
      }
      if(method==='GET'||method==='HEAD'){
        if(Object.hasOwn(brandAssets,path)){
          const asset=brandAssets[path],bytes=decodeBrandAsset(readFileSync(resolve(root,'public/brand',asset.file),'utf8'),asset.sha256);
          res.writeHead(200,{'Content-Type':'image/png','Content-Length':bytes.length,'Cache-Control':'no-store'});return res.end(method==='HEAD'?undefined:bytes);
        }
        const appPage=path==='/'||path.startsWith('/fidelity/')||path.startsWith('/growth/');
        const file=appPage?resolve(root,'public/index.html'):resolve(root,'public','.'+decodeURIComponent(path));const publicRoot=resolve(root,'public')+'/';
        if(!file.startsWith(publicRoot)||!existsSync(file)||!statSync(file).isFile())throw new AppError('Pagina non trovata.',404);
        const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf'};
        res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});return res.end(method==='HEAD'?undefined:readFileSync(file));
      }
      throw new AppError('Pagina non trovata.',404);
    }catch(e){if(!res.headersSent)json(res,{error:e.status?e.message:'Operazione non riuscita. Controlla i dati e riprova.'},e.status||500);else res.end();}
  }
  const server=http.createServer(handler);server.requestTimeout=30000;server.headersTimeout=15000;
  let workerError=null;
  const timer=worker?setInterval(()=>orchestrator.tick().then(()=>{workerError=null;}).catch(()=>{workerError='Controllo delle automazioni da verificare.';}),2000):null;timer?.unref();
  return {server,store,production,growth,fidelity,administration,orchestrator,agency,get workerError(){return workerError;},close:async()=>{if(timer)clearInterval(timer);if(server.listening)await new Promise(r=>server.close(r));store.close();}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.env.NODE_ENV==='production')throw new Error('Questa versione è un prototipo DEMO locale. Il rilascio richiede una fase autorizzata separata.');
  const port=Number(process.env.PORT||4330);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Porta non valida.');
  const data=resolve(process.env.DATA_DIR||resolve(root,'.data'));if(!data.startsWith(root+'/'))throw new Error('I dati devono restare nella cartella tecnica del repository.');await safePath(data,root);
  const databasePath=resolve(data,'bigant-os.sqlite');for(const suffix of ['', '-wal', '-shm', '-journal'])await safePath(databasePath+suffix,root,{file:existsSync(databasePath+suffix)});
  mkdirSync(data,{recursive:true,mode:0o700});
  const app=createApp({database:resolve(data,'bigant-os.sqlite'),origin:`http://127.0.0.1:${port}`,worker:true});
  app.server.listen(port,'127.0.0.1',()=>console.info(`BigAnt OS · DEMO locale · http://127.0.0.1:${port}`));
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>app.close().then(()=>process.exit(0)));
}
