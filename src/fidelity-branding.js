import sharp from 'sharp';
import { AppError } from './store.js';

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const invalid = () => { throw new AppError('Immagine non valida. Usa un PNG, JPEG o WebP statico entro 512 KiB e 2 milioni di pixel.'); };

export async function sanitizeLogo(dataUrl) {
  if (typeof dataUrl !== 'string' || dataUrl.length > 710000) invalid();
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl); if (!match) invalid();
  const bytes = Buffer.from(match[2], 'base64'); if (!bytes.length || bytes.length > 512 * 1024 || bytes.toString('base64') !== match[2]) invalid();
  const format = match[1], signatureMatches = format === 'png' ? bytes.subarray(0, 8).equals(signature) : format === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  if (!signatureMatches) invalid();
  // Decoder del progetto Fidelity, fissato alla versione 0.34.5; nessun download o provider remoto.
  {
    try {
      const image = sharp(bytes, { limitInputPixels: 2000000, failOn: 'warning', animated: false }), meta = await image.metadata();
      if (!['png', 'jpeg', 'webp'].includes(meta.format) || meta.format !== format || !meta.width || !meta.height || meta.width * meta.height > 2000000 || (meta.pages ?? 1) !== 1) invalid();
      return await image.rotate().resize(320, 100, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    } catch { invalid(); }
  }
}
