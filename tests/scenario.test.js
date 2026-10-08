import test from 'node:test';
import assert from 'node:assert/strict';
import {eseguiScenario} from '../scripts/scenario.js';

test('R-017: scenario dimostrativo a 13 passaggi con un comando, dal lead all’upsell, senza effetti esterni',async t=>{
 const originale=globalThis.fetch,esterni=[];
 // Consentite solo le chiamate al server locale dello scenario: ogni altra rete è vietata.
 t.mock.method(globalThis,'fetch',(url,...resto)=>{if(!/^http:\/\/127\.0\.0\.1:\d+\//.test(String(url))){esterni.push(String(url));throw Error('Rete esterna vietata');}return originale(url,...resto);});
 const r=await eseguiScenario({motore:'demo'});
 assert.equal(r.ok,true,JSON.stringify(r.passi.filter(p=>p.esito!=='ok')));
 assert.deepEqual(r.passi.map(p=>p.n),[1,2,3,4,5,6,7,8,9,10,11,12,13]);
 const prova=n=>r.passi.find(p=>p.n===n).prova;
 assert.match(prova(3),/DA VALIDARE.*invio email bloccato/);
 assert.match(prova(7),/identità del cliente e la data/);
 assert.match(prova(8),/PUBBLICATO è rifiutato/);
 assert.match(prova(10),/SDI bloccato/);
 assert.match(prova(12),/Incasso diverso dall’importo dovuto: 9,00 €/);
 assert.match(prova(13),/servizi consigliati/);
 assert.equal(r.giro.motore,'demo');assert.ok(r.giro.passi.every(p=>p.motore==='demo'));
 assert.ok(r.giro.azioni_esterne.length>=6&&r.giro.azioni_esterne.every(a=>a.stato==='bloccata'));
 assert.deepEqual(esterni,[]);
});
