// Livello "motore" intercambiabile dello sciame. Ogni output dichiara il motore che lo ha prodotto.
// - claude-code: Claude Code in modalità non interattiva (claude -p) con i sottoagenti di .claude/agents/;
// - api: Messages API Anthropic, attivabile solo con variabili d'ambiente dedicate;
// - demo: regole deterministiche, solo per i test automatici.
import {spawn,spawnSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {cervelloDemo} from './demo.js';

export const ETICHETTE={
 'claude-code':'Claude Code (sottoagenti .claude/agents, sessione cloud)',
 api:'API Anthropic (variabili d’ambiente)',
 demo:'Motore DEMO deterministico (solo test, nessuna AI)',
 nessuno:'Nessun motore AI disponibile'
};

export function istruzioniAgente(root,agente){
 const file=resolve(root,'.claude/agents',`bigant-${agente}.md`);
 if(!existsSync(file))throw new Error(`Istruzioni mancanti: .claude/agents/bigant-${agente}.md`);
 return readFileSync(file,'utf8').replace(/^---\n[\s\S]*?\n---\n/,'').trim();
}

export function promptPasso({compito,pacchetto}){
 return `COMPITO\n${compito}\n\nPACCHETTO DI INPUT (JSON, dati DEMO: non presentarli come reali)\n\`\`\`json\n${JSON.stringify(pacchetto,null,1)}\n\`\`\`\n\nRispondi soltanto con l’oggetto JSON richiesto dallo schema. Ciò che manca nel pacchetto è [DA VERIFICARE].`;
}

export function estraiJson(testo){
 if(typeof testo!=='string')return null;
 const prova=t=>{try{const v=JSON.parse(t);return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}catch{return null;}};
 const blocco=testo.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
 return prova(testo.trim())||(blocco&&prova(blocco[1]))||prova(testo.slice(testo.indexOf('{'),testo.lastIndexOf('}')+1));
}

let cliVerificato=null;
export function claudeDisponibile(bin='claude'){
 if(cliVerificato?.bin===bin)return cliVerificato.ok;
 let ok=false;try{ok=spawnSync(bin,['--version'],{timeout:15000,encoding:'utf8'}).status===0;}catch{ok=false;}
 cliVerificato={bin,ok};return ok;
}

export function scegliMotore(env=process.env){
 const richiesto=env.BIGANT_MOTORE;
 if(richiesto){if(!Object.hasOwn(ETICHETTE,richiesto))throw new Error('BIGANT_MOTORE non valido: usare claude-code, api, demo o nessuno.');return richiesto;}
 return claudeDisponibile(env.BIGANT_CLAUDE_BIN||'claude')?'claude-code':'nessuno';
}

function motoreClaudeCode({root,env,spawnImpl=spawn}){
 const bin=env.BIGANT_CLAUDE_BIN||'claude',timeout=Number(env.BIGANT_MOTORE_TIMEOUT_MS||420000);
 return {id:'claude-code',etichetta:ETICHETTE['claude-code'],
  stato(){const ok=claudeDisponibile(bin);return {disponibile:ok,statoCollegamento:ok?'OPERATIVO':'COLLEGAMENTO MANCANTE',motivo:ok?'Claude Code risponde in modalità non interattiva; strumenti disattivati per ogni agente.':'Comando claude non trovato o non autenticato in questo ambiente.'};},
  esegui({agente,compito,pacchetto,schema,onProgresso=()=>{}}){
   // Nessuno strumento: l'agente non legge file, non naviga e non esegue comandi. Il pacchetto arriva da stdin.
   // stream-json: il testo arriva mentre l'agente lo scrive, così l'ufficio virtuale lo mostra in diretta.
   const args=['-p','--agent',`bigant-${agente}`,'--tools','','--output-format','stream-json','--verbose','--include-partial-messages','--json-schema',JSON.stringify(schema),'--no-session-persistence'];
   const inizio=Date.now();
   return new Promise((ok,ko)=>{
    const child=spawnImpl(bin,args,{cwd:root,env,stdio:['pipe','pipe','pipe']});
    let resto='',err='',testo='',r=null;const timer=setTimeout(()=>{child.kill('SIGTERM');ko(new Error(`Claude Code non ha risposto entro ${Math.round(timeout/1000)} s.`));},timeout);
    const riga=x=>{let j;try{j=JSON.parse(x);}catch{return;}
     for(const ev of Array.isArray(j)?j:[j]){
      if(ev?.type==='result')r=ev;
      const d=ev?.type==='stream_event'&&ev.event?.type==='content_block_delta'?ev.event.delta:null;
      if(d?.type==='text_delta'){testo+=d.text;onProgresso({fase:'scrittura',testo});}
      else if(d?.type==='thinking_delta')onProgresso({fase:'ragionamento',testo});
     }};
    child.stdout.on('data',d=>{const parti=(resto+d).split('\n');resto=parti.pop();parti.forEach(riga);});child.stderr.on('data',d=>{err+=d;});
    child.on('error',e=>{clearTimeout(timer);ko(new Error('Avvio di Claude Code non riuscito: '+e.message));});
    child.on('close',code=>{
     clearTimeout(timer);
     if(resto.trim())riga(resto);
     if(!r)return ko(new Error(`Risposta di Claude Code non leggibile (uscita ${code}). ${err.slice(0,300)}`));
     if(r.is_error||r.subtype!=='success')return ko(new Error(`Claude Code: esecuzione non riuscita (${r.subtype||'errore'}). ${String(r.result||err).slice(0,300)}`));
     // Con --agent gli strumenti del sottoagente sostituiscono quello dell'output strutturato:
     // in quel caso il JSON arriva nel testo e viene comunque validato sullo schema dal chiamante.
     const output=r.structured_output??estraiJson(r.result);
     if(!output)return ko(new Error(`Claude Code: risposta senza JSON leggibile. ${String(r.result||'').slice(0,300)}`));
     ok({output,meta:{motore:'claude-code',durataMs:Date.now()-inizio,costoUsdMicro:Math.round(Number(r.total_cost_usd||0)*1e6),costoNota:'Costo equivalente a listino dichiarato da Claude Code (USD)',turni:r.num_turns??null}});
    });
    child.stdin.end(promptPasso({compito,pacchetto}));
   });
  }};
}

function motoreApi({root,env,importSdk=()=>import('@anthropic-ai/sdk')}){
 // Chiave e modello dedicati: non si usa ANTHROPIC_API_KEY per non interferire con Claude Code.
 const chiave=env.BIGANT_ANTHROPIC_API_KEY,modello=env.BIGANT_API_MODELLO,maxCent=Number(env.BIGANT_API_COSTO_MAX_CENT||25);
 return {id:'api',etichetta:ETICHETTE.api,
  stato(){const mancanti=[!chiave&&'BIGANT_ANTHROPIC_API_KEY',!modello&&'BIGANT_API_MODELLO'].filter(Boolean);return {disponibile:!mancanti.length,statoCollegamento:mancanti.length?'COLLEGAMENTO MANCANTE':'OPERATIVO',motivo:mancanti.length?'Impostare '+mancanti.join(' e ')+' nelle impostazioni dell’ambiente.':'Chiave e modello configurati.'};},
  async esegui({agente,compito,pacchetto,schema}){
   if(!chiave||!modello)throw new Error('Motore API non configurato: servono BIGANT_ANTHROPIC_API_KEY e BIGANT_API_MODELLO.');
   const {default:Anthropic}=await importSdk(),client=new Anthropic({apiKey:chiave,baseURL:env.BIGANT_API_URL||'https://api.anthropic.com'});
   const inizio=Date.now();
   const r=await client.messages.create({model:modello,max_tokens:16000,system:istruzioniAgente(root,agente),messages:[{role:'user',content:promptPasso({compito,pacchetto})}],output_config:{format:{type:'json_schema',schema}}});
   if(r.stop_reason==='refusal')throw new Error('Il modello ha rifiutato la richiesta.');
   if(r.stop_reason==='max_tokens')throw new Error('Risposta troncata: limite di lunghezza raggiunto.');
   const testo=r.content.filter(b=>b.type==='text').map(b=>b.text).join('');
   let output;try{output=JSON.parse(testo);}catch{throw new Error('Risposta API non in formato JSON.');}
   // Il costo reale dipende dal listino del modello scelto: si addebita prudenzialmente il tetto per chiamata.
   return {output,meta:{motore:'api',durataMs:Date.now()-inizio,costoUsdMicro:maxCent*10000,costoNota:'Tetto prudenziale per chiamata (BIGANT_API_COSTO_MAX_CENT); consumo reale da verificare sul pannello Anthropic',token:{input:r.usage?.input_tokens??null,output:r.usage?.output_tokens??null}}};
  }};
}

function motoreDemo(){
 return {id:'demo',etichetta:ETICHETTE.demo,
  stato:()=>({disponibile:true,statoCollegamento:'DEMO',motivo:'Regole deterministiche per i test automatici: non è intelligenza artificiale.'}),
  async esegui({agente,pacchetto,onProgresso=()=>{}}){const inizio=Date.now(),output=cervelloDemo(agente,pacchetto);onProgresso({fase:'scrittura',testo:JSON.stringify(output)});return {output,meta:{motore:'demo',durataMs:Date.now()-inizio,costoUsdMicro:0,costoNota:'Nessun costo: regole locali'}};}};
}

function motoreNessuno(){
 return {id:'nessuno',etichetta:ETICHETTE.nessuno,
  stato:()=>({disponibile:false,statoCollegamento:'COLLEGAMENTO MANCANTE',motivo:'Nessun motore AI configurato: impostare BIGANT_MOTORE=claude-code (con Claude Code installato) oppure il motore API.'}),
  async esegui(){throw new Error('Nessun motore AI disponibile: lo sciame non produce output simulati al posto dell’AI.');}};
}

export function createMotore({nome,root,env=process.env,...opzioni}={}){
 const id=nome||scegliMotore(env);
 if(id==='claude-code')return motoreClaudeCode({root,env,...opzioni});
 if(id==='api')return motoreApi({root,env,...opzioni});
 if(id==='demo')return motoreDemo();
 return motoreNessuno();
}
