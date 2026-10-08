// node:sqlite → sql.js (SQLite compilato in JavaScript): usato SOLO dalla versione online nel browser.
// Stessa interfaccia minima usata da src/store.js: exec, prepare().all/get/run, close.
const pulisci=p=>p.map(v=>v===undefined?null:typeof v==='boolean'?(v?1:0):typeof v==='bigint'?Number(v):v);
export class DatabaseSync{
 constructor(){const SQL=globalThis.__BIGANT_SQL;if(!SQL)throw new Error('SQLite del browser non caricato.');const salvato=globalThis.__BIGANT_DB_SALVATO;this.db=salvato?new SQL.Database(salvato):new SQL.Database();globalThis.__BIGANT_DB=this;}
 exec(sql){this.db.exec(sql);}
 prepare(sql){
  const db=this.db,usa=(p,fn)=>{const st=db.prepare(sql);try{if(p.length)st.bind(p.length===1&&p[0]&&typeof p[0]==='object'&&!(p[0] instanceof Uint8Array)?p[0]:pulisci(p));return fn(st);}finally{st.free();}};
  return {
   all:(...p)=>usa(p,st=>{const out=[];while(st.step())out.push(st.getAsObject());return out;}),
   get:(...p)=>usa(p,st=>st.step()?st.getAsObject():undefined),
   run:(...p)=>usa(p,st=>{st.step();return {changes:db.getRowsModified(),lastInsertRowid:0};})
  };
 }
 // Copia del database per salvarlo nel browser; export() riapre il file e azzera i PRAGMA.
 esporta(){const dati=this.db.export();this.db.exec('PRAGMA foreign_keys=ON');return dati;}
 close(){}
}
export default {DatabaseSync};
