import { DatabaseSync } from 'node:sqlite';
import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export const uid = () => randomUUID();
export const now = () => new Date().toISOString();
export class AppError extends Error { constructor(message, status=400) { super(message); this.status=status; } }
export function integer(value, min=0, max=1e12) { if (!Number.isSafeInteger(value)||value<min||value>max) throw new AppError('Serve un numero intero valido.'); return value; }
export function text(value, max=4000) { return String(value??'').trim().slice(0,max); }
export function passwordHash(password) { const salt=randomBytes(16).toString('hex'); return salt+':'+scryptSync(password,salt,64).toString('hex'); }
export function verifyPassword(password, hash='') { try { const [salt,key]=hash.split(':'); const a=Buffer.from(key,'hex'),b=scryptSync(password,salt,64); return a.length===b.length&&timingSafeEqual(a,b); } catch { return false; } }
export function openStore(path=':memory:') {
  if(path!==':memory:') mkdirSync(dirname(path),{recursive:true,mode:0o700});
  const db=new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
  CREATE TABLE IF NOT EXISTS os_schema(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS os_clients(id TEXT PRIMARY KEY,name TEXT NOT NULL,slug TEXT UNIQUE NOT NULL,industry TEXT NOT NULL DEFAULT '',color TEXT NOT NULL DEFAULT '#F26B21',address TEXT NOT NULL DEFAULT '',active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,privacy_url TEXT NOT NULL DEFAULT '',terms_text TEXT NOT NULL DEFAULT '',services_json TEXT NOT NULL DEFAULT '[]',risk TEXT NOT NULL DEFAULT 'normal',stage TEXT NOT NULL DEFAULT 'active');
  CREATE TABLE IF NOT EXISTS os_users(id TEXT PRIMARY KEY,tenant_id TEXT REFERENCES os_clients(id),name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL DEFAULT '',role TEXT NOT NULL CHECK(role IN('owner','collaborator','client')),active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS os_assignments(user_id TEXT NOT NULL REFERENCES os_users(id),client_id TEXT NOT NULL REFERENCES os_clients(id),PRIMARY KEY(user_id,client_id));
  CREATE TABLE IF NOT EXISTS os_sessions(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES os_users(id),csrf TEXT NOT NULL,expires_at INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS os_audit(id TEXT PRIMARY KEY,user_id TEXT,client_id TEXT,action TEXT NOT NULL,entity_id TEXT NOT NULL,detail TEXT NOT NULL,visibility TEXT NOT NULL,created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS os_memory(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES os_clients(id),kind TEXT NOT NULL,content TEXT NOT NULL,visibility TEXT NOT NULL DEFAULT 'internal',version INTEGER NOT NULL DEFAULT 1,source TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(client_id,kind));
  CREATE TABLE IF NOT EXISTS os_tasks(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES os_clients(id),title TEXT NOT NULL,service TEXT NOT NULL,assignee TEXT NOT NULL DEFAULT '',due TEXT,status TEXT NOT NULL DEFAULT 'todo',estimate_minutes INTEGER NOT NULL DEFAULT 0,actual_minutes INTEGER NOT NULL DEFAULT 0,source TEXT NOT NULL,created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS os_contents(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES os_clients(id),service TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'IDEA',scheduled_at TEXT,version INTEGER NOT NULL DEFAULT 1,source TEXT NOT NULL,updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS os_approvals(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES os_clients(id),kind TEXT NOT NULL,entity_id TEXT NOT NULL,version INTEGER NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',requested_by TEXT NOT NULL,decision_by TEXT,decision_at TEXT,reason TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,UNIQUE(kind,entity_id,version));
  CREATE TABLE IF NOT EXISTS os_jobs(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES os_clients(id),agent TEXT NOT NULL,input TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'queued',attempts INTEGER NOT NULL DEFAULT 0,available_at TEXT NOT NULL,lease_until TEXT,result TEXT,error TEXT,dedupe TEXT UNIQUE,created_at TEXT NOT NULL,finished_at TEXT);
  CREATE TABLE IF NOT EXISTS os_schedules(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES os_clients(id),agent TEXT NOT NULL,trigger TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 0,next_at TEXT,interval_minutes INTEGER NOT NULL DEFAULT 1440,last_at TEXT);
  CREATE TABLE IF NOT EXISTS os_costs(id TEXT PRIMARY KEY,client_id TEXT REFERENCES os_clients(id),agent TEXT NOT NULL,cents INTEGER NOT NULL CHECK(cents>=0),status TEXT NOT NULL,month TEXT NOT NULL,created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS os_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
  INSERT OR IGNORE INTO os_settings VALUES('budget_cents','5000'),('fixed_cents','3500'),('paused','false');
  INSERT OR IGNORE INTO os_schema VALUES(1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
  CREATE TABLE IF NOT EXISTS os_memory_versions(client_id TEXT NOT NULL,kind TEXT NOT NULL,version INTEGER NOT NULL,content TEXT NOT NULL,visibility TEXT NOT NULL,source TEXT NOT NULL,recorded_at TEXT NOT NULL,PRIMARY KEY(client_id,kind,version));
  CREATE TRIGGER IF NOT EXISTS os_memory_history_insert AFTER INSERT ON os_memory BEGIN INSERT INTO os_memory_versions SELECT NEW.client_id,NEW.kind,NEW.version,NEW.content,NEW.visibility,NEW.source,NEW.updated_at WHERE NOT EXISTS(SELECT 1 FROM os_memory_versions WHERE client_id=NEW.client_id AND kind=NEW.kind AND version=NEW.version); END;
  CREATE TRIGGER IF NOT EXISTS os_memory_history_update AFTER UPDATE ON os_memory BEGIN INSERT INTO os_memory_versions SELECT OLD.client_id,OLD.kind,OLD.version,OLD.content,OLD.visibility,OLD.source,OLD.updated_at WHERE NOT EXISTS(SELECT 1 FROM os_memory_versions WHERE client_id=OLD.client_id AND kind=OLD.kind AND version=OLD.version); INSERT INTO os_memory_versions SELECT NEW.client_id,NEW.kind,NEW.version,NEW.content,NEW.visibility,NEW.source,NEW.updated_at WHERE NOT EXISTS(SELECT 1 FROM os_memory_versions WHERE client_id=NEW.client_id AND kind=NEW.kind AND version=NEW.version); END;
  CREATE TRIGGER IF NOT EXISTS os_memory_versions_no_update BEFORE UPDATE ON os_memory_versions BEGIN SELECT RAISE(ABORT, 'Storico memoria immutabile'); END;
  CREATE TRIGGER IF NOT EXISTS os_memory_versions_no_delete BEFORE DELETE ON os_memory_versions BEGIN SELECT RAISE(ABORT, 'Storico memoria immutabile'); END;
  INSERT OR IGNORE INTO os_memory_versions SELECT client_id,kind,version,content,visibility,source,updated_at FROM os_memory;
  CREATE INDEX IF NOT EXISTS os_tasks_client ON os_tasks(client_id,status,due);
  CREATE INDEX IF NOT EXISTS os_jobs_due ON os_jobs(status,available_at);
  CREATE INDEX IF NOT EXISTS os_audit_client ON os_audit(client_id,created_at);
  `);
  const query=(sql,...p)=>db.prepare(sql).all(...p),one=(sql,...p)=>db.prepare(sql).get(...p),run=(sql,...p)=>db.prepare(sql).run(...p);
  let depth=0;
  function transaction(fn) {
    const n=depth++; const name='os_nested_'+n;
    db.exec(n?`SAVEPOINT ${name}`:'BEGIN IMMEDIATE');
    try { const out=fn(); if(out?.then) throw new Error('Le transazioni devono essere sincrone.'); db.exec(n?`RELEASE ${name}`:'COMMIT'); return out; }
    catch(e) { db.exec(n?`ROLLBACK TO ${name}`:'ROLLBACK'); if(n) db.exec(`RELEASE ${name}`); throw e; }
    finally { depth--; }
  }
  const audit=(user,clientId,action,entityId='',detail={},visibility='internal')=>run('INSERT INTO os_audit VALUES(?,?,?,?,?,?,?,?)',uid(),user?.id||null,clientId||null,action,String(entityId),JSON.stringify(detail),visibility,now());
  const getSetting=(key)=>one('SELECT value FROM os_settings WHERE key=?',key)?.value;
  const setSetting=(key,value)=>run('INSERT INTO os_settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',key,String(value));
  return {db,query,one,run,transaction,audit,getSetting,setSetting,close:()=>db.close()};
}
export function canAccessClient(store,user,clientId) {
  if(!user?.active && user?.active!==undefined) return false;
  if(!user||!store.one('SELECT id FROM os_clients WHERE id=? AND active=1',clientId)) return false;
  return user.role==='owner'||(user.role==='client'&&user.tenant_id===clientId)||(user.role==='collaborator'&&!!store.one('SELECT 1 FROM os_assignments WHERE user_id=? AND client_id=?',user.id,clientId));
}
export function requireClient(store,user,clientId) { if(!canAccessClient(store,user,clientId)) throw new AppError('Attività non accessibile.',403); }
export function requireOwner(user) { if(user?.role!=='owner'||user.active===0||user.active===false) throw new AppError('Area riservata ai soci BigAnt.',403); }
export function seedCore(s) {
  s.transaction(()=>{
    for(const c of [
      ['demo-bigant','BigAnt · cliente zero DEMO','bigant-demo','Agenzia',['growth','social','video','ads','local','seo','fidelity']],
      ['demo-bottega','Bottega Aurora DEMO','bottega-demo','Attività inventata',['social','local','fidelity','website']],
      ['demo-studio','Studio Orizzonte DEMO','studio-demo','Attività inventata',['social','ads','website']]
    ]) s.run('INSERT OR IGNORE INTO os_clients(id,name,slug,industry,services_json,created_at) VALUES(?,?,?,?,?,?)',c[0],c[1],c[2],c[3],JSON.stringify(c[4]),now());
    for(const u of [
      ['demo-owner',null,'Socio DEMO','socio@bigant.example','owner'],
      ['demo-collaborator',null,'Collaboratore DEMO','team@bigant.example','collaborator'],
      ['demo-client','demo-bottega','Cliente Aurora DEMO','cliente@aurora.example','client'],
      ['demo-client-other','demo-studio','Cliente Orizzonte DEMO','cliente@orizzonte.example','client']
    ]) s.run('INSERT OR IGNORE INTO os_users(id,tenant_id,name,email,role,created_at) VALUES(?,?,?,?,?,?)',...u,now());
    s.run('INSERT OR IGNORE INTO os_users(id,name,email,role,created_at) VALUES(?,?,?,?,?)','os-orchestrator','Orchestratore DEMO','orchestratore@bigant.example','owner',now());
    s.run('INSERT OR IGNORE INTO os_assignments VALUES(?,?)','demo-collaborator','demo-bottega');
    for(const c of s.query('SELECT id,name FROM os_clients')) {
      s.run('INSERT OR IGNORE INTO os_memory VALUES(?,?,?,?,?,?,?,?)',uid(),c.id,'master',`# ${c.name}\n\nDATI DI ESEMPIO. Attività e risultati inventati per collaudo.\n\n## Metodo\nBrief → proposta → approvazione → produzione → verifica → report.\n\n## Vincoli\nNessun collegamento o invio esterno.`, 'internal',1,'Fixture DEMO · seedCore',now());
      s.run('INSERT OR IGNORE INTO os_schedules VALUES(?,?,?,?,?,?,?,?)','daily-'+c.id,c.id,'account','daily',0,null,1440,null);
    }
    s.run('INSERT OR IGNORE INTO os_tasks VALUES(?,?,?,?,?,?,?,?,?,?,?)','task-demo','demo-bottega','Rivedere il piano social DEMO','social','demo-collaborator',new Date(Date.now()+86400000).toISOString(),'todo',90,0,'Fixture DEMO',now());
    s.run('INSERT OR IGNORE INTO os_contents VALUES(?,?,?,?,?,?,?,?,?,?)','content-demo','demo-bottega','social','La bottega si racconta · DEMO','Bozza dimostrativa: persone, gesti e materiali. Nessuna offerta o risultato reale.','DA APPROVARE',null,1,'Fixture DEMO',now());
    s.run('INSERT OR IGNORE INTO os_approvals VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)','approval-demo','demo-bottega','content','content-demo',1,'Piano social · DEMO','Bozza dimostrativa: persone, gesti e materiali. Nessuna offerta o risultato reale.','pending','agente-social',null,null,'',now());
  });
}
