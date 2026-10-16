import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createApp } from '../server.js';

function fixture() {
  const window = {}; vm.runInNewContext(readFileSync(new URL('../public/fidelity-scanner.js', import.meta.url), 'utf8'), { window });
  let stopped = 0, controlStops = 0, callback;
  const stream = { getTracks: () => [{ stop: () => stopped++ }] };
  const video = { hidden: true, srcObject: null, pause() {}, play: async () => {} };
  const codes = [], errors = [];
  class BrowserQRCodeReader { async decodeFromStream(input, element, onResult) { assert.equal(input, stream); assert.equal(element, video); callback = onResult; return { stop: () => controlStops++ }; } }
  const scanner = new window.BigAntScanner({ video, onCode: code => codes.push(code), onError: error => errors.push(error), readerLoader: async () => ({ BrowserQRCodeReader }), media: { getUserMedia: async constraints => { assert.equal(constraints.audio, false); return stream; } } });
  return { scanner, video, stream, codes, errors, scanned: code => callback({ getText: () => code }), counts: () => ({ stopped, controlStops }) };
}

test('scanner senza BarcodeDetector: lettura singola, video chiuso e fotocamera rilasciata', async () => {
  const f = fixture(); await f.scanner.start(); assert.equal(f.video.hidden, false);
  f.scanned('token-di-prova'); f.scanned('seconda-lettura');
  assert.deepEqual(f.codes, ['token-di-prova']); assert.equal(f.video.srcObject, null); assert.equal(f.video.hidden, true);
  assert.deepEqual(f.counts(), { stopped: 1, controlStops: 1 }); assert.deepEqual(f.errors, []);
});

test('chiusura durante richiesta fotocamera non lascia accesa una camera tardiva', async () => {
  const f = fixture(); let complete, entered;
  const requested = new Promise(resolve => { entered = resolve; });
  f.scanner.media.getUserMedia = () => new Promise(resolve => { complete = resolve; entered(); });
  const pending = f.scanner.start(); await requested; f.scanner.stop(); complete(f.stream); await pending;
  assert.equal(f.counts().stopped, 1); assert.equal(f.video.srcObject, null); assert.deepEqual(f.codes, []); assert.deepEqual(f.errors, []);
});

test('permesso rifiutato: errore comprensibile e nessuna esposizione di dettagli del dispositivo', async () => {
  const f = fixture(); f.scanner.media.getUserMedia = async () => { throw Error('dettaglio-riservato-dispositivo'); };
  await f.scanner.start(); assert.equal(f.errors.length, 1); assert.match(f.errors[0], /permesso/); assert.ok(!f.errors[0].includes('dettaglio-riservato'));
  assert.equal(f.video.srcObject, null);
});

test('libreria QR servita localmente e senza esporre altri file delle dipendenze', async t => {
  const app = createApp({ env: {} }); await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve)); t.after(() => app.close());
  const origin = `http://127.0.0.1:${app.server.address().port}`;
  const response = await fetch(origin + '/vendor/zxing-browser.min.js'); assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /javascript/);
  assert.match(await response.text(), /ZXingBrowser/);
  assert.equal((await fetch(origin + '/node_modules/@zxing/browser/package.json')).status, 404);
});
