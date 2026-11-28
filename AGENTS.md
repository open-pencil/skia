# CanvasKit for OpenPencil

Branch `openpencil/canvaskit` is the CanvasKit that [OpenPencil](https://github.com/open-pencil/open-pencil) ships as `@open-pencil/canvaskit`. `OPENPENCIL.md` says what the branch is and lists its patches; this file holds the rules for changing it. Skia's own contribution rules apply to everything sent upstream.

## Changing the branch

- Every push to `openpencil/canvaskit` is a release (`.github/workflows/canvaskit.yml`), so the branch changes only through pull requests against it, never by a direct push. A pull request is reviewed by CodeRabbit and then a maintainer, and merges only once both are done and its build passes.
- A pull request follows OpenPencil's body template: Summary, What changed, AI assistance (the model's name, never as commit authorship or a trailer), Validation.
- Branch from `openpencil/canvaskit` and keep history linear: merge it into a branch that falls behind rather than force-pushing a branch under review.
- OpenPencil moves to a release only after its pull request merges, with `bun run fork:pin packages/canvaskit canvaskit-<commit>` in a pull request of its own there.

## Patches

- Commit subjects follow Skia's `[area] Imperative summary` form, as upstream's do, so a patch can be offered upstream as it is.
- Each patch is added to `OPENPENCIL.md` with what it changes and why, and patches useful beyond OpenPencil are offered upstream through Skia's Gerrit; one is dropped here once a CanvasKit release includes it.
- A change to CanvasKit's JavaScript API updates its types in `modules/canvaskit/npm_build/types/index.d.ts`, which the release ships, and its type tests in `canvaskit-wasm-tests.ts` beside them.
- The base is a CanvasKit release (`Release Canvaskit v0.41.1`); moving it is a rebase onto a later release, in a pull request of its own.

## Building

- `tools/openpencil/build-canvaskit.sh` builds the release into `out/openpencil`, syncing only the libraries CanvasKit links; the workflow runs it on every pull request, so a change that only CI can build is still checked before it merges.
