import { mkdir, rmdir, open } from 'node:fs/promises';
import { resolve, dirname, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { technicalPaths, safePath, assertAbsent, assertNoSidecars, sqliteSnapshot, uniqueName, parseArguments } from './backup.js';

export async function restoreBackup({ backupPath, targetDirectory, fixtureRoot, env = {} } = {}) {
  const { dataRoot, backupDirectory, pathRoot } = await technicalPaths(fixtureRoot, env);
  const within = (path, scope, options = {}) => safePath(path, scope, { ...options, root: pathRoot });
  const source = await within(backupPath, backupDirectory, { file: true });
  if (!source.endsWith('.sqlite')) throw new Error('Seleziona un backup .sqlite.');
  await assertNoSidecars(source);
  // Our completed backups use rollback-journal format and need no external WAL.
  // Inspect the format header before opening SQLite so an incomplete WAL copy
  // cannot silently lose recent commits or create sidecars next to its source.
  const file = await open(source, 'r');
  try {
    const header = Buffer.alloc(100), { bytesRead } = await file.read(header, 0, 100, 0);
    if (bytesRead !== 100 || header.subarray(0, 16).toString('binary') !== 'SQLite format 3\0') throw new Error('Il file non è un backup SQLite valido.');
    if (header[18] !== 1 || header[19] !== 1) throw new Error('Il file richiede WAL: crea un backup completato con lo script del progetto.');
  } finally { await file.close(); }
  const directory = await within(targetDirectory ?? resolve(dataRoot, uniqueName('restored')), dataRoot);
  if (dirname(directory) !== dataRoot || !/^restored-[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(basename(directory))) throw new Error('Usa una nuova cartella restored-… direttamente nella cartella tecnica dei dati.');
  await assertAbsent(directory);
  await mkdir(dataRoot, { recursive: true, mode: 0o700 });
  await within(dataRoot, dataRoot);
  await mkdir(directory, { mode: 0o700 });
  const destination = resolve(directory, 'bigant-os.sqlite');
  let published = false;
  try {
    const result = await sqliteSnapshot(source, destination, { scope: dataRoot, root: pathRoot, beforePublish(db) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const removedSessions = Number(db.prepare('DELETE FROM os_sessions').run().changes);
        db.exec('COMMIT');
        return { removedSessions };
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    } });
    published = true;
    return { path: destination, directory, source, createdAt: new Date().toISOString(), ...result };
  } finally {
    // Remove only our empty directory on failure; never recurse into a target.
    if (!published) await rmdir(directory).catch(error => { if (!['ENOTEMPTY', 'ENOENT'].includes(error.code)) throw error; });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.includes('--help')) console.info('Uso: npm run restore -- --backup .data/backups/nome.sqlite [--target-dir .data/restored-prova]\nCrea una copia isolata. Database attivo e backup restano intatti. Le sessioni vengono eliminate soltanto nella nuova copia.');
    else {
      const args = parseArguments(process.argv.slice(2), ['--backup', '--target-dir']);
      if (!args['--backup']) throw new Error('Indica --backup .data/backups/nome.sqlite; usa --help per le istruzioni.');
      const result = await restoreBackup({ backupPath: args['--backup'], targetDirectory: args['--target-dir'], env: process.env });
      const shellQuote = value => `'${value.replaceAll("'", "'\\''")}'`;
      console.info(`Copia ripristinata e verificata: ${result.path}\nSessioni rimosse nella sola copia: ${result.removedSessions}. Occorrerà accedere di nuovo.\nIl database attivo e il backup non sono stati sostituiti. Nessun provider collegato.\nPer provare la copia, arresta manualmente l'app locale e, dalla cartella del progetto, esegui:\nDATA_DIR=${shellQuote(result.directory)} npm start\nPer tornare al database precedente, riavvia con il precedente DATA_DIR (senza DATA_DIR per .data${sep}bigant-os.sqlite).`);
    }
  } catch (error) { console.error(`Ripristino non eseguito: ${error.message}`); process.exitCode = 1; }
}
