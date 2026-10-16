import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createApp, decodeBrandAsset } from '../server.js';

const originals = [
  { name: 'logo', size: 267207, hash: '664e4ae8d8170427554fe36c2739562b71f24b8ed533f6068aa012b97ec2864c' },
  { name: 'icon', size: 198212, hash: 'be66a098b2a5ffa99187279e7c606d24129fc13d34b865a17dcf530506ca0009' },
];
const assetPath = (name, suffix = '') => fileURLToPath(new URL(`../public/brand/${name}.png${suffix}`, import.meta.url));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

for (const original of originals) {
  test(`Brand ${original.name}: base64 conserva byte, dimensione e SHA-256 del PNG originale`, () => {
    const encoded = readFileSync(assetPath(original.name, '.base64'), 'utf8');
    const bytes = decodeBrandAsset(encoded, original.hash);
    assert.equal(bytes.length, original.size);
    assert.equal(sha256(bytes), original.hash);
    assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    // Original binaries remain untouched locally. A text-only checkout needs
    // just the encoded assets; fixed original hashes still verify every byte.
    if (existsSync(assetPath(original.name))) assert.deepEqual(bytes, readFileSync(assetPath(original.name)));
  });
}

test('Brand HTTP: GET restituisce i PNG originali, HEAD il MIME e la dimensione senza corpo', async t => {
  const app = createApp(); t.after(() => app.close());
  const handler = app.server.listeners('request')[0];
  async function request(method, url) {
    const headers = {}, chunks = []; let status;
    await handler({ method, url, headers: { host: '127.0.0.1:4330' }, socket: { remoteAddress: '127.0.0.1' } }, {
      setHeader(name, value) { headers[name.toLowerCase()] = value; },
      writeHead(value, values) { status = value; for (const [name, entry] of Object.entries(values)) this.setHeader(name, entry); },
      end(value) { if (value !== undefined) chunks.push(Buffer.from(value)); },
    });
    return { status, headers, body: Buffer.concat(chunks) };
  }
  for (const original of originals) {
    const get = await request('GET', `/brand/${original.name}.png`);
    assert.equal(get.status, 200); assert.equal(get.headers['content-type'], 'image/png');
    assert.equal(get.headers['content-length'], original.size); assert.equal(get.body.length, original.size);
    assert.equal(sha256(get.body), original.hash);
    assert.deepEqual(get.body, decodeBrandAsset(readFileSync(assetPath(original.name, '.base64'), 'utf8'), original.hash));
    const head = await request('HEAD', `/brand/${original.name}.png`);
    assert.equal(head.status, 200); assert.equal(head.headers['content-type'], 'image/png');
    assert.equal(head.headers['content-length'], original.size); assert.equal(head.body.length, 0);
  }
  assert.equal((await request('GET', '/brand/unknown.png')).status, 404);
});

test('Decoder brand: rifiuta input non base64, padding ambiguo, contenuto alterato e hash errato', () => {
  const bytes = Buffer.from('Esempio DEMO'), encoded = bytes.toString('base64'), expected = sha256(bytes);
  assert.deepEqual(decodeBrandAsset(encoded + '\r\n', expected), bytes);
  for (const malformed of [null, 12, '', '\n', '@@@@', 'AA=A', 'AAAA=', 'AB==', encoded + ' ', encoded + '\t', encoded + 'é', 'A'.repeat(1000001)]) {
    assert.throws(() => decodeBrandAsset(malformed, expected), /Codifica base64/);
  }
  assert.throws(() => decodeBrandAsset(Buffer.from('Alterato').toString('base64'), expected), /SHA-256/);
  assert.throws(() => decodeBrandAsset(encoded, 'not-a-hash'), /SHA-256/);
  assert.throws(() => decodeBrandAsset(encoded, '0'.repeat(64)), /SHA-256/);
});
