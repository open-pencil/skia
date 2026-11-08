# OpenPencil fork notes

This fork is maintained for [OpenPencil](https://github.com/open-pencil/open-pencil).

The `openpencil/canvaskit` branch is the CanvasKit release OpenPencil ships, from `Release Canvaskit v0.41.1`, with these patches on top:

- `[canvaskit] Add PDFDocument`: Skia's PDF backend in CanvasKit; each page is an ordinary Canvas.
- `[skparagraph] Give text blobs the text and clusters of their glyphs`: PDF text maps shaped glyphs back to their characters.
- `[pdf] Embed variable TrueType fonts as the instance they draw`: variable fonts embed as TrueType instead of Type3.
- `[canvaskit] Add ImageFilter.MakeRuntimeShader`: a runtime shader as an image filter, sampling its input or the backdrop.

[open-pencil/canvaskit](https://github.com/open-pencil/canvaskit) builds and publishes the branch as `@open-pencil/canvaskit`. Patches that are useful beyond OpenPencil should also be offered upstream.
