// node:http per il browser: nessuna rete. Il gestore delle richieste viene chiamato dal fetch della pagina (online/avvio.js).
export function createServer(gestore){
 const server={listening:false,requestTimeout:0,headersTimeout:0,
  listen(porta,host,fatto){server.listening=true;(typeof host==='function'?host:fatto)?.();return server;},
  address:()=>({address:'127.0.0.1',port:4330}),close(fatto){server.listening=false;fatto?.();},on(){return server;}};
 globalThis.__BIGANT_GESTORE=gestore;return server;
}
export default {createServer};
