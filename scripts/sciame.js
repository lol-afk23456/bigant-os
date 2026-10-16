// Avvia un giro dello sciame dal terminale (anche da una sessione Claude Code).
// Esempi:
//   npm run sciame -- --motore claude-code --richiesta "Piano marketing BigAnt della prossima settimana" --salva-prove
//   npm run sciame -- --motore demo --memoria
// Per default usa l'archivio dell'anteprima (.data/bigant-os.sqlite): l'ufficio virtuale mostra il lavoro in diretta.
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdirSync} from 'node:fs';
import {createApp} from '../server.js';
import {ETICHETTE} from '../src/motori/index.js';
import {STATI_PASSO} from '../src/sciame/index.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const arg=(nome,predefinito=null)=>{const i=process.argv.indexOf('--'+nome);return i>0&&process.argv[i+1]&&!process.argv[i+1].startsWith('--')?process.argv[i+1]:predefinito;};
const flag=nome=>process.argv.includes('--'+nome);

const richiesta=arg('richiesta','Giro completo: priorità della settimana dai KPI, piano marketing BigAnt della prossima settimana con bozze dei post, analisi gratuita di un’azienda DEMO con proposta Presenza, piano social S01 e scheda Google/recensioni di Bottega Aurora DEMO, controllo della prima nota.');
const flussi=arg('flussi')?.split(',').map(x=>x.trim()).filter(Boolean)||null;
const motore=arg('motore',process.env.BIGANT_MOTORE||null);
const dataDir=resolve(process.env.DATA_DIR||resolve(root,'.data'));
if(!flag('memoria')&&!dataDir.startsWith(root+'/'))throw new Error('I dati devono restare nella cartella tecnica del repository.');
if(!flag('memoria'))mkdirSync(dataDir,{recursive:true,mode:0o700});
const app=createApp({database:flag('memoria')?':memory:':resolve(dataDir,'bigant-os.sqlite'),motore});
const owner=app.store.one("SELECT * FROM os_users WHERE id='demo-owner'");
const visti=new Map(),stampa=()=>{for(const p of app.store.query('SELECT p.*,g.id gid FROM os_sciame_passi p JOIN os_sciame_giri g ON g.id=p.giro_id WHERE g.id=? ORDER BY ordine',giro.id)){const k=p.stato+(p.esito_qualita||'');if(visti.get(p.id)===k)continue;visti.set(p.id,k);console.info(`${new Date().toISOString().slice(11,19)} · ${String(p.ordine).padStart(2)} · ${p.agente.padEnd(21)} · ${(STATI_PASSO[p.stato]||p.stato).padEnd(26)}${p.esito_qualita?' · qualità: '+p.esito_qualita:''}${p.errore?' · '+p.errore:''}`);}};
const giro=app.sciame.creaGiro(owner,{richiesta,flussi});
console.info(`BigAnt OS · giro ${giro.id.slice(0,8)} · motore: ${ETICHETTE[giro.motore]||giro.motore}`);
const timer=setInterval(stampa,1500);
const r=await app.sciame.eseguiGiro(giro.id);clearInterval(timer);stampa();
console.info(`Esito: ${r.stato}${r.errore?' · '+r.errore:''} · passi ${r.passi.length} · azioni esterne bloccate ${r.azioni_esterne.length} · costo dichiarato ${(r.costo_usd_micro/1e6).toFixed(4)} USD`);
if(flag('salva-prove'))console.info('Prove salvate in '+app.sciame.esportaProve(giro.id,resolve(root,'docs/demo-sciame')));
await app.close();
process.exitCode=['completato','completato_con_errori'].includes(r.stato)?0:1;
