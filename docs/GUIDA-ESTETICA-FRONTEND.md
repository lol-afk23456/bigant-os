# Guida estetica del frontend

10 ottobre 2026. Destinatario: chi modifica `public/` (Codex, Claude Code o una persona). Stato: **proposta**, da applicare dopo l'ok dei soci sulle tre decisioni del paragrafo 11.

Obiettivo: far sembrare BigAnt OS uno strumento professionale da agenzia "corporate high-end", minimal ed elegante, senza cambiare né funzioni né permessi. Il lavoro è solo di presentazione.

## 0. Regole per chi applica la guida

1. Leggere tutta la guida prima di toccare `public/`. Valgono comunque `AGENTS.md` e `CLAUDE.md`: in caso di conflitto vincono loro.
2. Non cambiare rotte, API, permessi, logica di dominio o test. Se una modifica estetica richiede di toccarli, fermarsi e annotarlo in `docs/DOMANDE-PER-RAFFAELE.md`.
3. Un commit per fase (paragrafo 8), in italiano, con i requisiti citati (R-006, R-051, R-169).
4. Dopo ogni fase: `npm test`, `npm run check` e gli screenshot "dopo" delle stesse schermate di `docs/estetica/prima/`.
5. I dati restano DEMO e marcati come tali. Un dato mancante non diventa mai uno zero o un numero inventato.

## 1. Diagnosi: perché oggi non sembra professionale

Misurato sul codice e sull'app in esecuzione (DEMO, 10 ottobre 2026). Schermate in `docs/estetica/prima/`.

| # | Problema | Prova | Effetto |
|---|---|---|---|
| 1 | Il font non viene mai caricato | `style.css` dichiara `'Work Sans'`, ma non c'è nessun `@font-face` né `<link>` | Ogni dispositivo mostra un font diverso: Inter se installato, San Francisco su Mac, Segoe UI su Windows. Nessuna identità tipografica |
| 2 | Non esiste un sistema visivo | 10 variabili CSS in tutto; 122 colori esadecimali diversi tra CSS e JS; 28 dimensioni di testo; 16 raggi degli angoli; 73 `padding` e 31 `gap` diversi; 17 `letter-spacing` | Ogni schermata è leggermente diversa dall'altra: è la prima cosa che fa sembrare "amatoriale" un'interfaccia |
| 3 | Testo troppo piccolo | 9–11 px usati 72 volte (11 px ×38, 10 px ×26, 9 px ×6, 10,5 px ×2) | Fatica di lettura, aspetto da bozza, problemi su telefono |
| 4 | Codice non manutenibile | `style.css` è 43 KB su 131 righe (minificato a mano); `app.js` è 144 KB in un solo file | Ogni correzione introduce nuove incoerenze |
| 5 | Slogan al posto dei titoli | «Tutta BigAnt, prima dei singoli strumenti.», «I conti, senza punti ciechi.», «Dal brief al lavoro fatto.», più occhiello maiuscolo e sottotitolo | Circa 200 px prima del primo dato. Sembra un sito vetrina, non uno strumento di lavoro |
| 6 | Numeri che non servono a decidere | La pagina iniziale mostra 8 reparti, 32 procedure, 27 servizi, 10 moduli | Misure del software, non del lavoro dell'agenzia |
| 7 | Menu lungo e piatto | 16 voci; icona a griglia ripetuta per "Mappa agenzia" e "Direzione", icona a occhio per "Ufficio virtuale" e "Vista cliente" | Difficile orientarsi; icone che non distinguono |
| 8 | Contrasto insufficiente | Bottone primario arancione `#F26B21` con testo bianco: 3,04:1 (serve 4,5:1) | Fuori norma WCAG AA, meno leggibile |
| 9 | Logo rotto nella pagina di accesso | `.login-story img{filter:brightness(0) invert(1)}` rende tutto bianco | L'icona della formica diventa un quadrato bianco vuoto |
| 10 | Avvisi con gergo interno | «Solo struttura», «Flusso DEMO parziale», «auto-approvato (DEMO)» in fasce grigie in cima alle pagine | Rumore; il socio non sa se deve fare qualcosa |
| 11 | "DEMO" ovunque | Nei nomi, nei pulsanti («Apri la regia DEMO»), nei badge | Il segnale importante (dati inventati) si perde nel rumore |
| 12 | Telefono | Nella "Mappa agenzia" il primo schermo è solo slogan; il primo dato utile è sotto la piega | Inutilizzabile in mobilità |

**Cosa funziona già e va tenuto:** palette neutra calda, bordi sottili al posto delle ombre, menu laterale chiaro, ufficio virtuale scuro e riconoscibile, stati dei contenuti ben definiti. La base è buona: il problema è la coerenza e la gerarchia, non serve rifare tutto da zero.

## 2. Principi (dalla ricerca)

1. **Una schermata risponde a una domanda.** Le dashboard falliscono quando mostrano troppe metriche senza gerarchia. In cima solo 3–5 numeri utili a decidere; il resto un livello sotto ([Idealogic](https://idealogic.io/blog/dashboard-design), [Lazarev](https://www.lazarev.agency/articles/saas-dashboard-design)).
2. **Gerarchia con tre leve: dimensione, peso, colore.** Si combinano con misura e non si usano tutte e tre sullo stesso elemento. Si parte in bianco e nero e il colore si aggiunge per ultimo ([sintesi di *Refactoring UI*](https://cdn.jsdelivr.net/npm/claude-code-skills@0.5.0/data/skills/ux-ui-design-system/references/refactoring-ui.md)).
3. **Scale chiuse.** Spazi, testi, raggi e colori si scelgono da un elenco corto, mai a occhio. Lo spazio esprime le relazioni: ciò che è vicino è collegato.
4. **Token in variabili CSS su `:root`, con nomi semantici** (`--text-muted`, non `--grey-500`). Il tema scuro si ottiene sovrascrivendo le stesse variabili sotto `[data-theme]`, senza framework ([U-M Library design system](https://design-system.lib.umich.edu/design-and-development/design-tokens-and-web-components/), [DEV](https://dev.to/gzamann/design-system-with-css-5bbh)).
5. **Ogni tono di colore ha un ruolo fisso.** Fondi chiarissimi per le superfici, toni medi per bordi e focus, toni pieni per i riempimenti, toni scuri per il testo. Così il contrasto resta corretto senza pensarci ([Radix Colors](https://radix-ui.com/themes/docs/theme/color)).
6. **Bordi, non ombre, per raggruppare.** Le ombre si riservano a ciò che si sovrappone (menu, finestre). Troppe ombre affollano e distraggono ([Atlassian](https://atlassian.design/foundations/elevation), [Leviy](https://styleguide.leviy.com/foundations/elevation)).
7. **Meno rumore, più allineamento.** Il rifacimento di Linear ha ridotto il rumore visivo di menu, schede e intestazioni, aumentando gerarchia e densità della navigazione. Le scale colore sono passate a uno spazio percettivo (LCH), così colori con la stessa luminosità sembrano davvero ugualmente chiari ([Linear](https://linear.app/now/how-we-redesigned-the-linear-ui)).
8. **Tabelle dense e leggibili.** Righe di 40–48 px, cifre tabellari allineate a destra, monospazio per codici e identificativi ([ui-craft](https://skills.cat/skills/educlopez/ui-craft/ui-craft-dense-dashboard), [Fuselab](https://fuselabcreative.com/dashboard-design-system/)).
9. **Uno stato vuoto spiega e offre un'azione.** Si tiene visibile l'intestazione della tabella, si dice cosa manca e si offre una sola azione. **Un dato mancante deve sembrare diverso da uno zero** ([Evergreen](https://evergreen.segment.com/patterns/empty-states)).
10. **Accessibilità WCAG 2.2 AA:**
    - contrasto 4,5:1 per il testo, 3:1 per componenti e indicatore di focus;
    - aree cliccabili di almeno 24×24 px;
    - focus sempre visibile e mai coperto da barre fisse ([W3C](https://w3.org/WAI/standards-guidelines/wcag/new-in-22/)).
11. **Evitare l'aspetto "generato dall'AI":**
    - font di default (Inter, Roboto, Arial);
    - viola e sfumature;
    - griglie di schede tutte uguali;
    - testi enfatici.

    Servono vincoli espliciti, un sistema deciso prima del codice e specifiche precise invece di aggettivi ([Superdesign](https://superdesign.dev/blog/how-to-make-ai-ui-look-less-generic), [prg.sh](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website)).
12. **Un solo set di icone, tratto uniforme.** Lucide funziona senza framework e ha tratto di default 2 px, regolabile in modo globale ([Lucide](https://lucide.dev/guide/lucide), [spessore del tratto](https://lucide.dev/guide/basics/stroke-width)).

## 3. Il sistema visivo: token

Tutti i valori dell'interfaccia vengono da qui. **Nessun colore esadecimale, nessuna dimensione di testo e nessun raggio fuori da questo blocco.**

```css
:root{
  /* Superfici */
  --bg:#F6F6F4;            /* fondo dell'app */
  --surface:#FFFFFF;       /* pannelli, tabelle */
  --surface-2:#F1F0EC;     /* hover, riga selezionata, voce di menu attiva */
  --surface-inverse:#141413;/* blocchi scuri: priorità, ufficio virtuale */

  /* Linee */
  --line:#E4E3DF;          /* separatori e bordi dei pannelli */
  --line-strong:#D6D5D0;   /* bordi dei pulsanti secondari */
  --line-input:#8C8A84;    /* bordo dei campi: 3,45:1 su bianco, richiesto da WCAG 1.4.11 */

  /* Testo */
  --text:#141413;          /* 18,4:1 */
  --text-2:#3A3935;        /* voci di menu, testo secondario forte */
  --text-muted:#5C5B57;    /* metadati, didascalie: 6,8:1 su bianco, 6,3:1 sul fondo */

  /* Marchio (R-051) */
  --brand:#F26B21;         /* solo segni grafici: indicatore attivo, barre, accenti */
  --brand-text:#B4461A;    /* arancione per testo e link: 5,5:1 su bianco */
  --brand-soft:#FCE9DC;
  --brand-on-soft:#8A3A0C; /* testo su --brand-soft: 6,6:1 */

  /* Stati (mai solo colore: sempre anche la parola) */
  --ok:#1B4F8A;   --ok-bg:#E6EEF7;     /* OPERATIVO, Regolare, Approvato: 7,1:1 */
  --warn:#8A3A0C; --warn-bg:#FCE9DC;   /* DEMO, Da seguire, Da correggere: 6,6:1 */
  --risk:#9B2C20; --risk-bg:#FBE5E2;   /* A rischio, Bloccato, Errore: 6,3:1 */
  --off:#8C8A84;                        /* NON COLLEGATO: bordo tratteggiato */
  --focus:#B4461A;

  /* Tipografia */
  --font-sans:'Instrument Sans',system-ui,-apple-system,'Segoe UI',sans-serif;
  --font-mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;
  --fs-12:12px;  /* minimo assoluto: etichette, badge */
  --fs-13:13px;  /* metadati, intestazioni di tabella */
  --fs-14:14px;  /* celle di tabella, pulsanti */
  --fs-15:15px;  /* testo base */
  --fs-17:17px;  /* testo introduttivo */
  --fs-20:20px;  /* titolo di sezione (h2) */
  --fs-26:26px;  /* titolo di pagina (h1) */
  --fs-34:34px;  /* solo accesso e stati vuoti grandi */
  --fw-regular:400; --fw-medium:500; --fw-semibold:600;
  --lh-tight:1.15; --lh-body:1.45;

  /* Spazi */
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:20px;
  --s-6:24px; --s-8:32px; --s-10:40px; --s-14:56px;

  /* Angoli */
  --r-sm:6px;    /* badge, campi piccoli */
  --r-md:10px;   /* pulsanti, campi */
  --r-lg:14px;   /* pannelli, schede */
  --r-pill:999px;

  /* Ombre: una sola, per ciò che si sovrappone */
  --shadow-overlay:0 8px 24px rgba(20,20,19,.12);

  /* Controlli */
  --h-compact:36px;  /* azioni dentro le tabelle */
  --h-control:40px;  /* pulsanti e campi */
  --h-touch:44px;    /* sotto i 640 px di larghezza */

  /* Movimento */
  --t-fast:120ms; --t:180ms; --ease:cubic-bezier(.2,.8,.2,1);
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
```

Regole d'uso:

**Arancione**
- **Bottone primario:** fondo `--text`, testo bianco (18,4:1). L'arancione non è il colore dei pulsanti: con testo bianco arriva solo a 3,04:1.
- **Pulsante arancione** (solo se proprio serve): testo `--text` su `--brand`, 6,06:1.
- **Dove si usa:** al massimo un elemento arancione pieno per schermata. Indicatore della voce di menu attiva, barra di avanzamento, numero in evidenza, anello di focus.

**Tipografia**
- **Titoli:** h1 `--fs-26`/600 con `letter-spacing:-0.02em`; h2 `--fs-20`/600.
- **Testo:** `--fs-15`/400.
- **Numeri:** sempre `font-variant-numeric:tabular-nums` (Instrument Sans supporta `tnum`, [GitHub](https://github.com/Instrument/instrument-sans)). I codici (S01, v2, importi in tabella) vanno in `--font-mono`.
- **Occhiello maiuscolo:** al massimo uno per pagina, `--fs-12`, `letter-spacing:.08em`. Niente occhielli sopra ogni titolo.

**Superfici**
- Pannelli con bordo `1px solid var(--line)` e senza ombra. L'ombra solo per menu a tendina, finestre e notifiche.

## 4. Componenti

Ogni componente ha **una sola** implementazione. In `app.js` va creata una sezione "Componenti" con funzioni che restituiscono il markup, e tutte le viste le usano. La funzione `escapeHTML` resta obbligatoria per ogni valore.

| Componente | Regole |
|---|---|
| **Intestazione pagina** | Briciole di pane, h1 con il **nome della pagina** (mai uno slogan), al massimo una riga di descrizione. Azioni a destra: un primario e al massimo due secondari. Altezza totale entro 120 px |
| **Barra superiore** | Ricerca, selettore cliente, un solo badge d'ambiente "Dati DEMO" (`--brand-soft`/`--brand-on-soft`), avatar. Nient'altro |
| **Menu laterale** | 6 aree (paragrafo 5), raggruppate. Voce attiva: fondo `--surface-2`, peso 600 e barra di 3 px `--brand` a sinistra. Un'icona diversa per ogni voce. Larghezza 240–248 px |
| **Pulsanti** | Primario: fondo `--text`, testo bianco. Secondario: bianco con bordo `--line-strong`. Terziario: solo testo sottolineato al passaggio. Altezza `--h-control`, angolo `--r-md`, peso 500–600 |
| **Badge degli stati** | Tre stili fissi, uguali in tutta l'app. **OPERATIVO**: `--ok` su `--ok-bg`. **DEMO**: `--warn` su `--warn-bg`. **NON COLLEGATO**: testo `--text-muted`, bordo tratteggiato `--off`, fondo trasparente. `--fs-12`, 600, `letter-spacing:.06em` |
| **Stato cliente** | Regolare / Da seguire / A rischio con `--ok`, `--warn`, `--risk` e **sempre la parola** |
| **Numero chiave (KPI)** | Etichetta `--fs-14` muted, valore 32–36 px mono tabellare, riga di contesto `--fs-13`, badge di stato. Massimo 5 per riga. Se la fonte non è collegata: valore "—" in `--off`, riquadro tratteggiato, riga «Serve il collegamento a …». **Mai 0** |
| **Tabella** | Intestazioni `--fs-13` muted, peso 500. Righe da 44 px con separatore `--line`. Numeri a destra in mono tabellare. Riga al passaggio `--surface-2`. Azioni in fondo alla riga. Se larga: contenitore `overflow-x:auto` |
| **Pannello** | Bianco, bordo `--line`, angolo `--r-lg`, padding `--s-6`. Titolo h2 e, se serve, un link "Vedi tutto" a destra |
| **Avviso** | Solo se richiede un'azione o protegge da un errore. Una riga, linguaggio semplice, niente gergo interno. Le spiegazioni di metodo («Solo struttura», «Flusso DEMO parziale») vanno in una legenda nel piè di pagina o in un suggerimento |
| **Stato vuoto** | Titolo di una riga, cosa manca, **un** pulsante. Le intestazioni di tabella restano visibili |
| **Caricamento** | Sagome grigie con la stessa forma del contenuto finale, pulsazione leggera. Nessuna rotella a tutto schermo |
| **Campi modulo** | Etichetta sempre visibile sopra il campo, bordo `--line-input`, altezza `--h-control`, errore sotto il campo in `--risk` con la parola "Errore" |
| **Focus** | `outline:2px solid var(--focus); outline-offset:2px` su pulsanti, link e campi. Mai `outline:none` senza sostituto |
| **Nomi DEMO** | Il suffisso " DEMO" dei nomi diventa un piccolo badge DEMO accanto al nome: il dato resta dichiarato inventato, con meno rumore. Togliere "DEMO" dalle etichette dei pulsanti («Apri la regia DEMO» → «Apri la regia»): lo dice già il badge d'ambiente |

## 5. Navigazione: da 16 voci a 6 aree

| Area nuova | Voci attuali che contiene |
|---|---|
| **Oggi** | Mappa agenzia, Direzione (le decisioni in attesa e le priorità della settimana stanno qui) |
| **Clienti** | Clienti, Vista cliente, Fidelity (servizio dei clienti) |
| **Produzione** | Lavori e contenuti, Approvazioni, Marketing BigAnt |
| **Commerciale** | Growth, Servizi (catalogo e pacchetti) |
| **Amministrazione** | Amministrazione (solo soci, icona lucchetto) |
| **Sciame** | Sciame di agenti, Ufficio virtuale, Registro attività |
| Sistema (in fondo) | Collegamenti, Accessi |

Le viste esistenti non si cancellano: diventano schede o sottosezioni dentro la propria area. I permessi restano quelli del server.

## 6. Pagina per pagina (in ordine di priorità)

1. **Accesso:**
   - usare `brand/icon.png` sul fondo scuro, senza filtri, oppure il logo su fondo chiaro;
   - un titolo breve e i profili in un elenco pulito.
2. **Oggi** (ex Mappa agenzia):
   - in cima, i numeri per decidere: decisioni in attesa, lavori in ritardo, "cosa non torna", spesa AI del mese sul tetto, un canale non collegato dichiarato come tale;
   - sotto, la coda approvazioni e le tre priorità del Direttore Crescita;
   - le misure del sistema (reparti, procedure, moduli) si spostano nella pagina Sciame.
3. **Approvazioni:**
   - ogni voce mostra cosa ha prodotto l'agente, l'esito di Qualità, le fonti e la versione;
   - Approva, Chiedi modifiche, Rifiuta. Il rifiuto chiede il motivo, come già previsto dalle regole.
4. **Amministrazione:**
   - tabelle dense, importi a destra in mono tabellare;
   - il bottone "Registra movimento" diventa primario scuro.
5. **Clienti e Vista cliente:**
   - una sola pagina cliente, con lo stesso aspetto per il socio e per il cliente;
   - il server toglie economia e note interne quando entra il cliente;
   - ogni servizio ha la sua linea di avanzamento: Brief → Produzione → Qualità → Approvazione → Consegnato (R-169).
6. **Sciame e Ufficio virtuale:**
   - tenere il tema scuro dell'ufficio, ma con gli stessi token in versione scura;
   - il registro in tempo reale usa la tabella standard.
7. **Lavori e contenuti:**
   - il calendario mensile con celle vuote alte 100 px spreca spazio;
   - aprire di default la vista **settimana in elenco**; il mese diventa una scheda.
8. **Telefono** (sotto i 640 px):
   - controlli da 44 px e menu a scomparsa;
   - nessuna tabella che esce dallo schermo;
   - il primo schermo mostra sempre un dato o una decisione, mai uno slogan.

## 7. Codice: come organizzarlo senza rompere niente

- **File:** in questa fase **niente nuovi file JS o CSS**. `scripts/build-online.js` legge per nome `public/app.js`, `public/style.css`, `public/ufficio.js` e `public/cliente.js`, e cerca dentro `app.js` tre testi precisi:
  - `src="/brand/logo.png"` (almeno due volte);
  - `href="/"`;
  - `\nstart();`.

  Se si spostano o si dividono i file, la versione online smette di costruirsi. Dividere `app.js` in moduli è una fase successiva, da fare insieme all'aggiornamento della build.
- **`style.css` leggibile:** una regola per riga, sezioni commentate in quest'ordine: token, base, struttura, componenti, pagine. Usare `@layer tokens, base, layout, components, pages;`.
- **Niente stili dentro le stringhe HTML di `app.js`:** solo classi.
- **Font scaricati dal server, non da Google** (privacy e funzionamento senza rete):
  - Instrument Sans e IBM Plex Mono, licenza SIL OFL 1.1, file `.woff2` in `public/fonts/` con il file `OFL.txt`;
  - fonte ufficiale annotata in `docs/DECISIONI.md`: repository GitHub dei progetti o `google/fonts`, con checksum;
  - due pesi per Instrument Sans (400 e 600, o il variabile) e uno per IBM Plex Mono (500);
  - `font-display:swap`.
- **`server.js`:** aggiungere `'.woff2':'font/woff2'` alla tabella dei tipi di file. Senza questa riga i font arrivano come `application/octet-stream`.
- **Versione online:** in `build-online.js` incorporare i font come `data:` in `@font-face`, altrimenti la pagina online ricade sul font di sistema.
- **Icone:** Lucide (licenza ISC). Copiare solo le icone usate in uno sprite SVG (`public/icons.svg`) e richiamarle con `<svg><use href="/icons.svg#nome"></use></svg>`. Tratto 1,75, dimensione 18 px, `aria-hidden="true"` se affiancate a un testo. Nessuna libreria caricata da CDN.
- **Nessun framework nuovo** (React, Tailwind, librerie di componenti): il progetto preferisce il runtime standard e dipendenze fissate.
- **Controllo automatico:** aggiungere a `scripts/check.js` un controllo "estetica" che fallisce se:
  - c'è un colore esadecimale fuori dal blocco dei token in `style.css`, o in `app.js`, `cliente.js` o `ufficio.js`;
  - c'è un `font-size` fuori dalla scala;
  - c'è un `font-size` sotto i 12 px.

  Così le regole restano vere anche dopo, senza doverle ricordare.

## 8. Piano di lavoro (un commit per fase)

1. **Token e font:** blocco `:root`, font scaricati dal server, tipo `woff2` in `server.js`, correzione del logo nella pagina di accesso. Sostituire ogni esadecimale con la variabile più vicina. Nessun cambio di layout.
2. **Componenti:** pulsanti, badge, KPI, tabella, pannello, avviso, stato vuoto, campi, focus. Tutte le viste passano dalle stesse funzioni.
3. **Struttura:** menu a 6 aree, barra superiore, intestazioni di pagina senza slogan, legenda degli stati nel piè di pagina.
4. **Pagine:** nell'ordine del paragrafo 6.
5. **Telefono e accessibilità:** controllo a 390 px e 1440 px, tastiera, contrasto con [axe](https://www.deque.com/axe/) o Lighthouse.
6. **Controllo automatico e screenshot:** `scripts/check.js` aggiornato; screenshot "dopo" in `docs/estetica/dopo/` con gli stessi nomi di `docs/estetica/prima/`.

## 9. Criteri di accettazione

- [ ] 0 colori esadecimali fuori dal blocco token; al massimo 8 dimensioni di testo; nessun testo sotto 12 px; al massimo 4 raggi; una sola ombra.
- [ ] Stesso font su Mac, Windows e telefono, servito da `public/fonts/`.
- [ ] Contrasto: testo ≥ 4,5:1, componenti e focus ≥ 3:1. Aree cliccabili ≥ 24 px (noi usiamo 36–44).
- [ ] Ogni h1 è il nome della pagina; nessuno slogan nelle pagine di lavoro.
- [ ] Menu con 6 aree e icone tutte diverse.
- [ ] I numeri senza fonte collegata mostrano "—" e "NON COLLEGATO", mai 0.
- [ ] `npm test` e `npm run check` verdi; `node scripts/build-online.js` funziona ancora.
- [ ] Screenshot prima e dopo, desktop 1440 px e telefono 390 px.

## 10. Vietato

- Sfumature, viola, effetto vetro, emoji, ombre su ogni scheda, animazioni decorative.
- Font Inter, Roboto o Arial come scelta principale.
- Slogan e frasi da sito vetrina nelle pagine di lavoro.
- Colori o dimensioni scritti a mano fuori dai token.
- Librerie, font o icone caricati da CDN esterni.
- Nascondere o attenuare l'indicazione DEMO dei dati inventati.

## 11. Decisioni dei soci, prima di partire

1. **Arancione del marchio.** Il brief (R-051) indica `#F26B21`; il file del logo in `public/brand/` usa in realtà circa `#E16332`. Proposta: tenere `#F26B21` come da brief e far riesportare il logo con lo stesso valore, oppure aggiornare R-051 al colore del logo. Va scelto **un** valore.
2. **Font.** Proposta: Instrument Sans per il testo e IBM Plex Mono per numeri e codici, entrambi gratuiti con licenza OFL. Alternativa più neutra: IBM Plex Sans al posto di Instrument Sans.
3. **Direzione di layout.** Le tre prove sono sulla tela privata dei soci (A cabina di regia, B prima le decisioni, C studio per cliente). Proposta: B come pagina "Oggi", C come pagina cliente, la densità di A per Amministrazione. I token di questa guida valgono per tutte e tre.

## 12. Fonti

- [Dashboard design: principles and best practices (Idealogic)](https://idealogic.io/blog/dashboard-design)
- [SaaS dashboard design (Lazarev)](https://www.lazarev.agency/articles/saas-dashboard-design)
- [Sintesi dei principi di *Refactoring UI*](https://cdn.jsdelivr.net/npm/claude-code-skills@0.5.0/data/skills/ux-ui-design-system/references/refactoring-ui.md)
- [Design tokens and web components (University of Michigan Library)](https://design-system.lib.umich.edu/design-and-development/design-tokens-and-web-components/)
- [Design system with CSS (DEV)](https://dev.to/gzamann/design-system-with-css-5bbh)
- [Radix Themes: color](https://radix-ui.com/themes/docs/theme/color)
- [How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Atlassian: elevation](https://atlassian.design/foundations/elevation)
- [Leviy: elevation](https://styleguide.leviy.com/foundations/elevation)
- [Dense dashboard (ui-craft)](https://skills.cat/skills/educlopez/ui-craft/ui-craft-dense-dashboard)
- [Dashboard design system (Fuselab)](https://fuselabcreative.com/dashboard-design-system/)
- [Empty states (Evergreen, Segment)](https://evergreen.segment.com/patterns/empty-states)
- [What's new in WCAG 2.2 (W3C)](https://w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [How to make AI UI look less generic (Superdesign)](https://superdesign.dev/blog/how-to-make-ai-ui-look-less-generic)
- [Why your AI keeps building the same purple gradient website](https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website)
- [Lucide per JavaScript senza framework](https://lucide.dev/guide/lucide) e [spessore del tratto](https://lucide.dev/guide/basics/stroke-width)
- [Instrument Sans (licenza e funzioni OpenType)](https://github.com/Instrument/instrument-sans)

## 13. Messaggio pronto per Codex

> Leggi `AGENTS.md` e poi `docs/GUIDA-ESTETICA-FRONTEND.md` per intero. Applica la **fase 1** del paragrafo 8 (token, font scaricati dal server, tipo `woff2`, logo della pagina di accesso), senza toccare rotte, API, permessi o test. Usa i valori del paragrafo 3 alla lettera e le decisioni del paragrafo 11 già prese dai soci. Alla fine esegui `npm test`, `npm run check` e `node scripts/build-online.js`. Salva gli screenshot "dopo" in `docs/estetica/dopo/` con gli stessi nomi di `docs/estetica/prima/`. Fai un commit in italiano che cita R-006, R-051 e R-169. Fermati e chiedi prima di passare alla fase 2.
