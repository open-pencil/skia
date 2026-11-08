#!/usr/bin/env bash
# OpenPencil: builds CanvasKit's full release variant from this checkout into out/openpencil, with
# its TypeScript types and a SHA256SUMS of both, as the release open-pencil/open-pencil fetches.
# Syncs only the third-party libraries CanvasKit links; the rest of DEPS is never built.
set -euo pipefail

cd "$(dirname "$0")/../.."
CANVASKIT_DEPS="brotli emsdk freetype harfbuzz icu libjpeg-turbo libpng libwebp wuffs zlib"

python3 - $CANVASKIT_DEPS > canvaskit.DEPS <<'EOF'
import sys
scope = {}
exec('def Var(x): return vars[x]\n' + open('DEPS').read(), scope)
wanted = {f'third_party/externals/{name}' for name in sys.argv[1:]}
deps = {path: url for path, url in scope['deps'].items() if path in wanted}
missing = wanted - deps.keys()
if missing:
    sys.exit(f'not in DEPS: {sorted(missing)}')
print(f'deps = {deps!r}')
EOF
GIT_SYNC_DEPS_PATH=canvaskit.DEPS python3 tools/git-sync-deps
rm canvaskit.DEPS
bin/fetch-gn

# Homebrew headers must not leak into Emscripten's sysroot.
unset CPATH C_INCLUDE_PATH CPLUS_INCLUDE_PATH
bash modules/canvaskit/compile.sh release

mkdir -p out/openpencil
cp out/canvaskit_wasm/canvaskit.js out/canvaskit_wasm/canvaskit.wasm out/openpencil/
cp modules/canvaskit/npm_build/types/index.d.ts out/openpencil/
(cd out/openpencil && sha256sum canvaskit.js canvaskit.wasm index.d.ts > SHA256SUMS)
cat out/openpencil/SHA256SUMS
