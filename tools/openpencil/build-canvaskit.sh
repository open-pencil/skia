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
bash modules/canvaskit/compile.sh release es_module

mkdir -p out/openpencil
cp out/canvaskit_wasm/canvaskit.js out/canvaskit_wasm/canvaskit.wasm out/openpencil/
cp modules/canvaskit/npm_build/types/index.d.ts out/openpencil/

# The licenses of everything compiled into canvaskit.wasm: the libraries above and Emscripten's
# runtime (libc, libc++, compiler-rt), whose licenses require their notices with the binary.
E=third_party/externals
EMSCRIPTEN=$E/emsdk/upstream/emscripten
python3 - > out/openpencil/THIRD-PARTY-NOTICES.md <<EOF
notices = [
    ('Skia', 'LICENSE'),
    ('Brotli', '$E/brotli/LICENSE'),
    ('FreeType (FreeType License)', '$E/freetype/docs/FTL.TXT'),
    ('HarfBuzz', '$E/harfbuzz/COPYING'),
    ('ICU', '$E/icu/LICENSE'),
    ('libjpeg-turbo', '$E/libjpeg-turbo/LICENSE.md'),
    ('libjpeg-turbo (IJG)', '$E/libjpeg-turbo/README.ijg'),
    ('libpng', '$E/libpng/LICENSE'),
    ('libwebp', '$E/libwebp/COPYING'),
    ('libwebp (patents)', '$E/libwebp/PATENTS'),
    ('Wuffs', '$E/wuffs/LICENSE'),
    ('zlib', '$E/zlib/LICENSE'),
    ('Emscripten', '$EMSCRIPTEN/LICENSE'),
    ('musl libc', '$EMSCRIPTEN/system/lib/libc/musl/COPYRIGHT'),
    ('libc++', '$EMSCRIPTEN/system/lib/libcxx/LICENSE.TXT'),
    ('libc++abi', '$EMSCRIPTEN/system/lib/libcxxabi/LICENSE.TXT'),
    ('libunwind', '$EMSCRIPTEN/system/lib/libunwind/LICENSE.TXT'),
    ('compiler-rt', '$EMSCRIPTEN/system/lib/compiler-rt/LICENSE.TXT'),
]
print('# Third-party notices\n')
print('canvaskit.wasm and canvaskit.js are built from Skia and the software below.')
for name, path in notices:
    text = open(path, encoding='utf-8', errors='replace').read().strip()
    print(f'\n## {name}\n\n~~~~\n{text}\n~~~~')
EOF

(cd out/openpencil && sha256sum canvaskit.js canvaskit.wasm index.d.ts THIRD-PARTY-NOTICES.md > SHA256SUMS)
cat out/openpencil/SHA256SUMS
