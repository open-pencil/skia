# OpenPencil fork notes

This fork is maintained for [OpenPencil](https://github.com/open-pencil/open-pencil).

The `openpencil/canvaskit` branch is the CanvasKit release OpenPencil ships, from `Release Canvaskit v0.41.1`, with these patches on top:

- `[canvaskit] Add PDFDocument`: Skia's PDF backend in CanvasKit; each page is an ordinary Canvas.
- `[skparagraph] Give text blobs the text and clusters of their glyphs`: PDF text maps shaped glyphs back to their characters.
- `[pdf] Embed variable TrueType fonts as the instance they draw`: variable fonts embed as TrueType instead of Type3.
- `[canvaskit] Add ImageFilter.MakeRuntimeShader`: a runtime shader as an image filter, sampling its input or the backdrop.
- `[canvaskit] Add ImageFilter.MakeRuntimeShaderWithInputs`: the same with several inputs, each bound to one of the effect's uniform shaders by name, and other uniform shaders bound to shaders as they are.
- `[canvaskit] Return null from Surface.makeSurface when Skia makes none`: instead of throwing on the missing surface, as a half-float surface on a context without float color buffers does.
- `[canvaskit] Build CanvasKit as an ES module`: with `compile.sh es_module`, which the release build passes, `canvaskit.js` default-exports `CanvasKitInit`, as its types declare, and finds `canvaskit.wasm` beside itself. The classic script stays the default, which CanvasKit's example page and Karma tests load.
- `[imagefilters] Evaluate runtime image filters at device resolution`: a runtime shader filter runs once per device pixel under a scaled or rotated canvas, in its own parameter coordinates, instead of at parameter resolution stretched to fit.

Every push to the branch builds CanvasKit (`tools/openpencil/build-canvaskit.sh`, run by `.github/workflows/canvaskit.yml`) and releases it as `canvaskit-<commit>`: `canvaskit.js`, `canvaskit.wasm`, `index.d.ts` and their `SHA256SUMS`. OpenPencil's `packages/canvaskit` pins one of these releases and publishes it as `@open-pencil/canvaskit`. Patches that are useful beyond OpenPencil should also be offered upstream.
