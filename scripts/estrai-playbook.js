// Estrae dal brief integrale i documenti del Playbook (un file per ogni marcatore
// <!-- FILE: ... -->) e la Parte 3 in docs/INTEGRAZIONI-ACCESSI.md, senza modificare
// il brief. Con --verifica controlla soltanto che i file estratti coincidano.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

export const PROJECT_ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const BRIEF=resolve(PROJECT_ROOT,'docs/BRIEF-BIGANT.md');
const PART3_HEADING='# PARTE 3';
const MARKER=/^<!-- FILE: (docs\/[A-Za-z0-9_./-]+\.md) -->$/;

const clean=lines=>{const out=[...lines];while(out.length&&/^\s*$/.test(out[0]))out.shift();while(out.length&&/^(\s*|---)$/.test(out.at(-1)))out.pop();return out.join('\n')+'\n';};

export function splitBrief(markdown){
 const lines=markdown.split('\n'),documents=[];let current=null,part3=null;
 for(const line of lines){
  const m=line.match(MARKER);
  if(m){if(current)documents.push(current);current={path:m[1],lines:[]};continue;}
  if(line.startsWith(PART3_HEADING)){if(current)documents.push(current);current=null;part3=[];}
  if(part3)part3.push(line);else if(current)current.lines.push(line);
 }
 if(current)documents.push(current);
 if(!part3)throw new Error('Parte 3 non trovata nel brief.');
 const files=documents.map(d=>({path:d.path,content:clean(d.lines)}));
 if(new Set(files.map(f=>f.path)).size!==files.length)throw new Error('Marcatori duplicati nel brief.');
 for(const f of files)if(!f.path.startsWith('docs/playbook/'))throw new Error('Marcatore fuori da docs/playbook: '+f.path);
 files.push({path:'docs/INTEGRAZIONI-ACCESSI.md',content:clean(part3)});
 return files;
}

export async function extractPlaybook({verify=false}={}){
 const files=splitBrief(await readFile(BRIEF,'utf8')),problems=[];
 for(const f of files){
  const target=resolve(PROJECT_ROOT,f.path);
  if(!target.startsWith(resolve(PROJECT_ROOT,'docs')+'/'))throw new Error('Percorso non ammesso: '+f.path);
  if(verify){let existing=null;try{existing=await readFile(target,'utf8');}catch{}if(existing!==f.content)problems.push(relative(PROJECT_ROOT,target));continue;}
  await mkdir(dirname(target),{recursive:true});await writeFile(target,f.content);
 }
 return {files:files.map(f=>f.path),problems};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const verify=process.argv.includes('--verifica'),r=await extractPlaybook({verify});
 if(verify&&r.problems.length){console.error('File del playbook diversi dal brief: '+r.problems.join(', '));process.exit(1);}
 console.info(`${verify?'Verificati':'Estratti'} ${r.files.length} documenti dal brief integrale.`);
}
