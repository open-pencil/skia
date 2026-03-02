# Building CanvasKit with WebGPU (Graphite + Dawn)

## Prerequisites

- Python 3
- CMake
- Ninja

## Build

```bash
# Sync dependencies
python3 tools/git-sync-deps

# Activate Emscripten
python3 bin/activate-emsdk

# Apply Dawn patch (missing include in tint.h)
cd third_party/externals/dawn
git apply ../../../patches/dawn-tint.patch
cd ../../..

# Prevent Homebrew headers from leaking into Emscripten (macOS)
unset CPATH C_INCLUDE_PATH CPLUS_INCLUDE_PATH

# Build
bash modules/canvaskit/compile.sh webgpu
```

Output: `out/canvaskit_wasm/canvaskit.js` + `out/canvaskit_wasm/canvaskit.wasm`

## Dawn patch

Dawn's `include/tint/tint.h` is missing `#include "src/tint/api/common/bindings.h"`,
which causes a build failure. The patch is at `patches/dawn-tint.patch` and must be
applied to `third_party/externals/dawn/` after `git-sync-deps`.
