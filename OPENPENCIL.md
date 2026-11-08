# OpenPencil fork notes

This fork is maintained for [OpenPencil](https://github.com/open-pencil/open-pencil).

The `openpencil/canvaskit` branch is the CanvasKit release OpenPencil ships, from `Release Canvaskit v0.41.1`, with these patches on top:

- `[canvaskit] Add PDFDocument`: Skia's PDF backend in CanvasKit; each page is an ordinary Canvas.
- `[skparagraph] Give text blobs the text and clusters of their glyphs`: PDF text maps shaped glyphs back to their characters.
- `[pdf] Embed variable TrueType fonts as the instance they draw`: variable fonts embed as TrueType instead of Type3.
- `[canvaskit] Add ImageFilter.MakeRuntimeShader`: a runtime shader as an image filter, sampling its input or the backdrop.
- `[canvaskit] Build CanvasKit as an ES module`: `canvaskit.js` default-exports `CanvasKitInit`, as its types declare, and finds `canvaskit.wasm` beside itself.

Every push to the branch builds CanvasKit (`tools/openpencil/build-canvaskit.sh`, run by `.github/workflows/canvaskit.yml`) and releases it as `canvaskit-<commit>`: `canvaskit.js`, `canvaskit.wasm`, `index.d.ts` and their `SHA256SUMS`. OpenPencil's `packages/canvaskit` pins one of these releases and publishes it as `@open-pencil/canvaskit`. Patches that are useful beyond OpenPencil should also be offered upstream.
