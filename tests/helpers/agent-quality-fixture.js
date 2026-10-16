import {randomUUID} from 'node:crypto';
import {agentWorkFixture,socialReply,socialOutput} from './agent-work-fixture.js';
export const qualityOutput=()=>({esito:'da_correggere',sintesi:'Il testo richiede una fonte più precisa.',rilievi:[{gravita:'importante',regola:'Fonti verificabili',dove:'Introduzione',problema:'Manca un riferimento verificabile.',correzione:'Chiedere la fonte e aggiornare la stessa bozza.'}]});
export async function qualityWorkFixture(t,{activate=true,fetchImpl,provider='openai',real=true,port=4457}={}){
 const reply=(url,out)=>url.includes('anthropic')?new Response(JSON.stringify({stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(out)}]})):socialReply(out);
 const f=await agentWorkFixture(t,{real,port,activate:false,fetchImpl:fetchImpl||((url)=>reply(url,qualityOutput())),trialFetchImpl:(url,options)=>{const b=JSON.parse(options.body),schema=b.text?.format?.schema||b.output_config?.format?.schema;return reply(url,schema.properties.esito?qualityOutput():socialOutput());}});
 if(provider==='api')f.app.connections.save(f.owner,'anthropic',{version:0,fields:{apiKey:'chiave-anthropic-finta',model:'modello-simulato'}});
 const config=f.app.agentConfig.entry('quality').config;
 f.app.agentConfig.save(f.owner,'quality',{...config,task:'Controlla una bozza social',instructions:'Segnala rilievi, non approvare.',sources:'Brief e bozza selezionata',quality:'Testo e fonti verificabili',provider,estimatedCents:40});
 await f.app.agentTrials.check(f.owner,'quality',{version:1,connectionVersion:1,requestId:randomUUID(),confirmed:true});
 const authorization=()=>{const a=f.app.agentConfig.entry('quality');return {enabled:true,confirmed:true,version:a.config.version,connectionVersion:a.operational.connectionVersion,trialId:a.operational.trialId,authorizationVersion:a.operational.authorizationVersion};};
 if(activate)f.app.agentWork.authorize(f.owner,'quality',authorization());
 const created=await f.app.production.handle({method:'POST',path:'/contents',user:f.owner,clientId:'fixture-orange',body:{title:'Bozza laboratorio DEMO',body:'Scopri il laboratorio creativo di prova.',service:'social',source:'Brief inventato'}}),draft=created.data;
 for(const state of ['IN PRODUZIONE','DA APPROVARE'])await f.app.production.handle({method:'PATCH',path:'/contents/'+draft.id,user:f.owner,clientId:'fixture-orange',body:{state,version:1}});
 const preview=()=>f.app.agentWork.preview(f.owner,'fixture-orange','quality','Verifica tono e fonti.',{contentId:draft.id});
 const body=(p=preview())=>({contentId:draft.id,brief:p.context.brief,fingerprint:p.fingerprint,requestId:randomUUID(),confirmed:true});
 const run=(b=body())=>f.app.agentWork.run(f.owner,'fixture-orange','quality',b);
 const review=()=>f.app.agentWork.review(f.owner,'fixture-orange',draft.id);
 return {...f,get calls(){return f.calls;},get lastRequest(){return f.lastRequest;},draft,authorization,preview,body,run,review};
}

