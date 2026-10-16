export const fileURLToPath=u=>decodeURIComponent(String(u).replace(/^file:\/\//,''));
export const pathToFileURL=p=>new URL('file://'+p);
export const URL=globalThis.URL,URLSearchParams=globalThis.URLSearchParams;
export default {fileURLToPath,pathToFileURL,URL,URLSearchParams};
