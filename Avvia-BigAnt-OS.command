#!/bin/bash
# BigAnt OS · avvio con doppio clic (Mac; funziona anche su Linux).
# Cosa fa, in ordine:
#  1. usa Node.js 24 se è già installato; altrimenti scarica UNA volta la versione fissata
#     dal sito ufficiale nodejs.org, ne verifica l'impronta SHA-256 e la tiene in .cache/;
#  2. installa le dipendenze bloccate nel package-lock (npm ci, senza script esterni);
#  3. cerca Claude Code: se c'è, gli agenti lavorano davvero con il tuo abbonamento Claude;
#  4. accende l'app sul tuo computer e apre il browser su http://127.0.0.1:4330.
# Non chiede password, non legge file privati, non pubblica e non invia nulla.
set -euo pipefail
cd "$(dirname "$0")"
NODE_VERSIONE="24.19.0"
PORTA="${PORT:-4330}"
INDIRIZZO="http://127.0.0.1:$PORTA"

echo ""
echo "  BigAnt OS · prototipo DEMO sul tuo computer"
echo "  ------------------------------------------"

node_giusto() { "$1" -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a===24&&b>=19?0:1)' 2>/dev/null; }
NODE=""
if command -v node >/dev/null 2>&1 && node_giusto node; then NODE="$(command -v node)"; fi
if [ -z "$NODE" ]; then
  case "$(uname -s)-$(uname -m)" in
    Darwin-arm64) PIATTAFORMA=darwin-arm64 ;;
    Darwin-x86_64) PIATTAFORMA=darwin-x64 ;;
    Linux-x86_64) PIATTAFORMA=linux-x64 ;;
    Linux-aarch64) PIATTAFORMA=linux-arm64 ;;
    *) echo "  Sistema non riconosciuto: installa Node.js $NODE_VERSIONE da https://nodejs.org e riprova."; exit 1 ;;
  esac
  CARTELLA=".cache/node-v$NODE_VERSIONE-$PIATTAFORMA"
  if [ ! -x "$CARTELLA/bin/node" ]; then
    echo "  1/3 Scarico Node.js $NODE_VERSIONE da nodejs.org (solo la prima volta, circa 50 MB)…"
    mkdir -p .cache
    ARCHIVIO="node-v$NODE_VERSIONE-$PIATTAFORMA.tar.gz"
    curl -fsSL "https://nodejs.org/dist/v$NODE_VERSIONE/$ARCHIVIO" -o ".cache/$ARCHIVIO"
    curl -fsSL "https://nodejs.org/dist/v$NODE_VERSIONE/SHASUMS256.txt" -o ".cache/SHASUMS256.txt"
    ATTESA="$(grep " $ARCHIVIO\$" .cache/SHASUMS256.txt | cut -d' ' -f1)"
    OTTENUTA="$( (shasum -a 256 ".cache/$ARCHIVIO" 2>/dev/null || sha256sum ".cache/$ARCHIVIO") | cut -d' ' -f1)"
    if [ -z "$ATTESA" ] || [ "$ATTESA" != "$OTTENUTA" ]; then
      rm -f ".cache/$ARCHIVIO"; echo "  Impronta del download non valida: file scartato. Riprova più tardi."; exit 1
    fi
    tar -xzf ".cache/$ARCHIVIO" -C .cache && rm -f ".cache/$ARCHIVIO"
  fi
  NODE="$PWD/$CARTELLA/bin/node"; echo "  1/3 Node.js $NODE_VERSIONE pronto (copia ufficiale verificata in .cache/)"
else
  echo "  1/3 Node.js già presente: $("$NODE" --version)"
fi
export PATH="$(dirname "$NODE"):$PATH"

if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  echo "  2/3 Installo le dipendenze fissate (solo la prima volta)…"
  npm ci --ignore-scripts --no-audit --no-fund --loglevel=error
else
  echo "  2/3 Dipendenze già installate"
fi

# Claude Code può stare in posti diversi a seconda di come è stato installato.
for c in "$(command -v claude 2>/dev/null || true)" "$HOME/.local/bin/claude" "$HOME/.claude/local/claude" /opt/homebrew/bin/claude /usr/local/bin/claude; do
  if [ -n "$c" ] && [ -x "$c" ]; then export BIGANT_CLAUDE_BIN="$c"; break; fi
done
if [ -n "${BIGANT_MOTORE:-}" ]; then
  echo "  3/3 Motore degli agenti scelto a mano: $BIGANT_MOTORE"
elif [ -n "${BIGANT_CLAUDE_BIN:-}" ]; then
  echo "  3/3 Motore degli agenti: Claude Code ($BIGANT_CLAUDE_BIN) · gli agenti lavorano davvero"
else
  echo "  3/3 Claude Code non trovato: l'app si apre, ma gli agenti non possono lavorare."
  echo "      Per accenderli segui la guida docs/COME-PROVARE.md, passo 3 (due comandi)."
fi

if curl -fsS -o /dev/null "$INDIRIZZO/api/session" 2>/dev/null; then
  echo ""; echo "  BigAnt OS è già acceso: apro $INDIRIZZO"
  (open "$INDIRIZZO" || xdg-open "$INDIRIZZO") >/dev/null 2>&1 || true
  exit 0
fi

"$NODE" server.js &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true' EXIT INT TERM
for _ in $(seq 1 80); do
  if curl -fsS -o /dev/null "$INDIRIZZO/api/session" 2>/dev/null; then break; fi
  sleep 0.5
done
(open "$INDIRIZZO" || xdg-open "$INDIRIZZO") >/dev/null 2>&1 || true
echo ""
echo "  Pronto: $INDIRIZZO"
echo "  Entra come «Socio DEMO» (amministratore) o «Cliente» dalla pagina iniziale."
echo "  Per spegnere: chiudi questa finestra oppure premi Ctrl+C."
echo ""
wait "$SERVER"
