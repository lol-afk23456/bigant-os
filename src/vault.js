import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { AppError } from './store.js';

// The key belongs to the runtime configuration, never to SQLite or its backups.
export function createVault(env = {}) {
  const encoded = env.BIGANT_SECRET_KEY || '';
  const key = /^[A-Za-z0-9+/]{43}=$/.test(encoded) ? Buffer.from(encoded, 'base64') : null;
  const ready = !!key && key.length === 32;
  const requireKey = () => { if (!ready) throw new AppError('Archivio protetto da configurare: manca la chiave del server.', 409); };
  return {
    ready,
    seal(value, context) {
      requireKey();
      const nonce = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, nonce);
      cipher.setAAD(Buffer.from(context));
      const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
      return JSON.stringify({ v: 1, nonce: nonce.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') });
    },
    open(envelope, context) {
      requireKey();
      try {
        const data = JSON.parse(envelope);
        if (data.v !== 1) throw Error('version');
        const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(data.nonce, 'base64'));
        decipher.setAAD(Buffer.from(context)); decipher.setAuthTag(Buffer.from(data.tag, 'base64'));
        return JSON.parse(Buffer.concat([decipher.update(Buffer.from(data.ciphertext, 'base64')), decipher.final()]).toString('utf8'));
      } catch { throw new AppError('Impossibile aprire questo accesso con la chiave configurata.', 409); }
    }
  };
}
