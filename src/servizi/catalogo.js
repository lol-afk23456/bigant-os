// Catalogo S01–S19 letto dalle schede del Playbook (docs/playbook/Sxx_*.md): se la scheda cambia,
// cambiano flusso, KPI e strumenti che agenti e dashboard usano. Nessun dato di risultato è inventato:
// ogni KPI dichiara la fonte e se è calcolato dai dati interni o richiede un collegamento esterno.
import {readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const DIR=resolve(root,'docs/playbook');

function sezioni(md){
 const out={};let corrente=null;
 for(const riga of md.split('\n')){const m=riga.match(/^#### (\d+)\. /);if(m){corrente=Number(m[1]);out[corrente]=[];continue;}if(corrente)out[corrente].push(riga);}
 return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v.join('\n').trim()]));
}
const voci=t=>String(t||'').replace(/\n/g,' ').split(' · ').map(x=>x.trim().replace(/\.$/,'')).filter(Boolean);
const passi=t=>String(t||'').split('\n').map(x=>x.match(/^\d+\.\s+(.*)$/)?.[1]).filter(Boolean);
const tabella=t=>String(t||'').split('\n').filter(x=>x.startsWith('|')&&!/^\|\s*-/.test(x)).slice(1).map(x=>x.split('|').slice(1,-1).map(c=>c.trim())).map(([nome,contenuto])=>({nome,contenuto}));

// Collegamento tra codici del Playbook e ID del registro (src/registry.js), che segue ancora la
// numerazione storica del catalogo Italiaonline: la corrispondenza è esplicita, non dedotta dal numero.
export const corrispondenze={
 S01:{registro:['social'],agenti:['social','marketing','quality'],sciame:['social','marketing','qualita'],approvazioni:['content','sciame_output'],integrazioni:['postiz','meta']},
 S02:{registro:['video','drone','video-ai'],agenti:['video','drone','video-ai','creative-direction'],sciame:[],approvazioni:['agent_output','content'],integrazioni:[]},
 S03:{registro:['ads'],agenti:['ads'],sciame:[],approvazioni:['agent_output'],integrazioni:['google-ads','ga4']},
 S04:{registro:['ads'],agenti:['ads'],sciame:[],approvazioni:['agent_output'],integrazioni:['meta']},
 S05:{registro:['seo'],agenti:['seo'],sciame:[],approvazioni:['agent_output','content'],integrazioni:['gsc','ga4']},
 S06:{registro:['local'],agenti:['local'],sciame:['local-gbp','qualita'],approvazioni:['content','sciame_output'],integrazioni:['gbp','trello']},
 S07:{registro:['presence','multisite'],agenti:['multisite','local'],sciame:[],approvazioni:['agent_output'],integrazioni:['gbp']},
 S08:{registro:['presence','local'],agenti:['reputation'],sciame:['reputazione','qualita'],approvazioni:['sciame_output','agent_output'],integrazioni:['gbp']},
 S09:{registro:['website'],agenti:['website'],sciame:[],approvazioni:['agent_output','content'],integrazioni:['ga4','gsc']},
 S10:{registro:['accessibility'],agenti:['accessibility'],sciame:[],approvazioni:['agent_output'],integrazioni:[]},
 S11:{registro:['ecommerce','social-commerce'],agenti:['ecommerce','social-commerce'],sciame:[],approvazioni:['agent_output'],integrazioni:['meta']},
 S12:{registro:['booking'],agenti:['booking'],sciame:[],approvazioni:['agent_output'],integrazioni:['calendar','gbp']},
 S13:{registro:['reception'],agenti:['reception'],sciame:[],approvazioni:['agent_output'],integrazioni:[]},
 S14:{registro:['email-marketing'],agenti:['account'],sciame:[],approvazioni:[],integrazioni:[]},
 S15:{registro:['branding','creative-direction'],agenti:['branding','creative-direction'],sciame:[],approvazioni:['agent_output'],integrazioni:[]},
 S16:{registro:['merch'],agenti:['merch'],sciame:[],approvazioni:['agent_output'],integrazioni:[]},
 S17:{registro:['audit','growth'],agenti:['research','analyst','commercial'],sciame:['ricerca-clienti','analisi-gratuita','proposta-commerciale','qualita'],approvazioni:['sciame_output','growth_message'],integrazioni:['brave']},
 S18:{registro:[],agenti:['reporter'],sciame:['direttore-crescita'],approvazioni:['agent_output'],integrazioni:['google-ads','meta','ga4','gsc','gbp']},
 S19:{registro:['tv','display'],agenti:['tv','display'],sciame:[],approvazioni:['agent_output'],integrazioni:[]}
};

export function caricaCatalogo(dir=DIR){
 return readdirSync(dir).filter(f=>/^S\d\d_.+\.md$/.test(f)).sort().map(file=>{
  const md=readFileSync(resolve(dir,file),'utf8'),sez=sezioni(md),codice=file.slice(0,3);
  const testa=md.match(/^### SCHEDA SERVIZIO — (.+)$/m)?.[1]?.trim(),stato=md.match(/\*\*Stato:\*\* (.+?) · \*\*Ultimo/)?.[1]?.trim();
  return {codice,nome:testa,statoPlaybook:stato,scheda:`docs/playbook/${file}`,problema:sez[1],include:voci(sez[2]),richieste:voci(sez[4]),flusso:passi(sez[5]),
   kpi:voci(sez[7]),strumenti:voci(sez[8]),rischi:voci(sez[9]),upsell:voci(sez[10]),pacchetti:tabella(sez[13]),prezzi:String(sez[14]||'').split('\n')[0],...corrispondenze[codice],...(codice==='S14'?{nome:'Email marketing',scheda:'docs/SOP-EMAIL-MARKETING.md',include:['Contatti dell’attività','Registro dei consensi','Report del servizio'],richieste:['Fonte, data e informativa del consenso'],flusso:['Registra la prova del consenso','Controlla il contatto','Registra eventuali revoche'],kpi:['Contatti registrati','Consensi registrati','Consensi revocati'],strumenti:['Registro interno; fornitore email da scegliere'],approvazioni:[],pacchetti:[],prezzi:'Da definire nel Listino'}:{})};
 });
}
export const catalogoServizi=caricaCatalogo();

// Pacchetti combinati del catalogo (docs/playbook/00_CATALOGO-BIGANT.md, sezione 4). Prezzi: proposte da validare.
export const pacchetti=[
 {id:'presenza',nome:'BigAnt Presenza',servizi:['S06','S07','S08','S17','S18'],perChi:'Qualunque attività locale: pacchetto d’ingresso',canone:'150–250 €/mese + setup 200–300 €',nota:'Primo upsell sui clienti attuali'},
 {id:'crescita-locale',nome:'BigAnt Crescita Locale',servizi:['S06','S07','S08','S17','S18','S01','S03'],perChi:'PMI che vogliono contatti ogni mese',canone:'900–1.400 €/mese + budget ADV',nota:'Presenza + S01 M + S03 Start'},
 {id:'sanita',nome:'BigAnt Sanità',servizi:['S09','S05','S06','S07','S08','S17','S18','S12','S13'],perChi:'Centri medici, laboratori, fisioterapia, studi professionali',canone:'600–1.000 €/mese + setup 2.500–4.000 €',nota:'Con compliance sanitaria'},
 {id:'ristorazione',nome:'BigAnt Ristorazione',servizi:['S01','S06','S07','S08','S17','S18','S12','S02'],perChi:'Ristoranti, bar, hotel',canone:'450–800 €/mese',nota:'S12 Ristoranti con menù QR e Prenota con Google; S02 mezza giornata a trimestre'},
 {id:'brand',nome:'BigAnt Brand',servizi:['S15','S09','S01','S16'],perChi:'Nuove attività, rebranding',canone:'Progetto 3.500–6.000 €',nota:'S15 identità + S09 Essenziale + S01 S per 3 mesi + S16 kit merch'}
].map(p=>({...p,stato:'Proposta del catalogo 0.1: prezzi [DA VALIDARE dai soci]',regole:['Costa il 10–20% in meno della somma dei servizi','Durata minima e condizioni [DA DEFINIRE nel contratto standard]'],fonte:'docs/playbook/00_CATALOGO-BIGANT.md, sezione 4'}));

export function codiciPerServiziRegistro(ids){return catalogoServizi.filter(s=>s.registro.some(r=>ids.includes(r))).map(s=>s.codice);}
