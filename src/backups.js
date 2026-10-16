import { createBackup, rotateBackups } from '../scripts/backup.js';

const DAY = 24 * 60 * 60 * 1000;

// One in-process job, with a persisted success timestamp to survive restarts.
// No application data or filesystem paths are included in status or error logs.
export function createBackupScheduler({ store, sourcePath, env, clock = () => new Date(), intervalMs = 60000, snapshot = createBackup, rotate = rotateBackups }) {
  let pending = null, stopped = false;
  function status() {
    const stored = store.getSetting('backup_last_success');
    const lastSuccess = Number.isFinite(Date.parse(stored || '')) ? stored : null;
    return { enabled: true, running: !!pending, lastSuccess, nextAt: lastSuccess ? new Date(Date.parse(lastSuccess) + DAY).toISOString() : null,
      error: store.getSetting('backup_error') || null, copies: 14 };
  }
  function tick() {
    if (stopped) return Promise.resolve();
    if (pending) return pending;
    const previous = Date.parse(store.getSetting('backup_last_success') || '');
    if (Number.isFinite(previous) && clock().getTime() - previous < DAY) return Promise.resolve();
    pending = Promise.resolve().then(async () => {
      try {
        await snapshot({ sourcePath, env });
        await rotate({ env, keep: 14 });
        store.setSetting('backup_last_success', clock().toISOString());
        store.setSetting('backup_error', '');
      } catch {
        store.setSetting('backup_error', 'Copia di sicurezza non completata. Verificare il volume e lo spazio disponibile.');
      }
    }).finally(() => { pending = null; });
    return pending;
  }
  const timer = setInterval(() => { void tick(); }, intervalMs);
  timer.unref();
  void tick();
  return { tick, status, async close() { stopped = true; clearInterval(timer); await pending; } };
}
