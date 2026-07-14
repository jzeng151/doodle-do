# Doodle-Do

Frame-by-frame pixel animation tool that teaches you as you work.
Web-based, local-first, no accounts, no AI. See the requirements plan for
the full spec.

## Status

- **Phase 0 (rendering spike): gate passed.** Canvas 2D confirmed;
  stroke→loop p95 = 0.1ms against the 16ms budget (`bench/README.md`).
- **Phase 1 (focus mode MVP): code complete.** Full toolset, onion
  skinning, palette lock/swap/remove, frames and layers, Appendix-B undo,
  OPFS autosave with IndexedDB fallback, sprite sheet (TexturePacker
  JSON-hash + doodledo.json), GIF, and frame-PNG-zip export.
  - Phaser import verification: **passing** (`npm run verify:phaser`).
  - Godot import verification: **open** — no Godot binary on this machine.
  - Phase 1 gate (founder ships a 4-frame walk cycle in under 30 minutes):
    **awaiting the founder.**
- **Phase 2 (learning layer + polish): code items complete.** Selection
  per Appendix B5, canvas-size presets, tips engine per Appendix A
  (T12 dormant until the reference library exists), sprite strip import,
  PWA/offline via service worker.
  - Reference animation library: **blocked on the commissioned art**
    (§4.5 production plan).
  - Phase 2 gate (5-participant usability protocol): **awaiting humans.**
- **Phase 3 (mode toggle): code complete, gate passed.** Grid and Loop
  modes as pure views over the same session; switcher with "great at /
  strains when" tooltips; keys 1/2/3. Gate verified mechanically:
  switching preserves document, current frame, zoom, and palette (e2e),
  and the Phase 3 diff touches zero files in `src/lib/core/`
  (`git diff 732b53f -- src/lib/core/` is empty).

## Layout

```
src/lib/core/    document model, commands, palette ops (pure TS, no DOM)
src/lib/render/  compositor, frame cache, onion tinting, loop player
src/lib/tools/   stroke/fill/flip/eyedropper (command factories)
src/lib/io/      project file, OPFS autosave, exporters (GIF in a worker)
src/lib/modes/   workspace shell + focus/grid/loop views over one session
src/lib/editor/  editor session: doc + bus + non-undoable view state (B7)
bench/           performance harness (Phase 0 gate instrument)
scripts/         export verification against stock Phaser
e2e/             Playwright end-to-end tests
```

## Commands

```sh
npm run dev            # dev server
npm run test           # core unit tests (vitest)
npm run test:e2e       # Playwright end-to-end suite
npm run bench          # performance gate (headless Chromium)
npm run verify:phaser  # load a real export in stock Phaser
npm run build          # static build (Cloudflare Pages target)
```

## Opening files

One "Open" picker handles everything and dispatches by file type:

- `.doodledo` (or exported project JSON): opens as a project.
- Horizontal sprite strip PNG (frame width = image height, like typical
  animation-pack `sprites/` folders): splits into frames. Select the
  pack's `animations.json` in the same picker to apply its per-frame
  timing; the manifest's frame count is validated against the split.

Strip sources with more than 64 colors are quantized to the palette cap
(gifenc median-cut); alpha is thresholded at 128 because the document
model's transparency is 1-bit. Multi-animation master atlases without
uniform grids are not importable — use the per-animation strips.

Two consequences of the unified picker, by design:

- **Open always uses a plain `<input type="file">`**, never
  `showOpenFilePicker`. For reading, the two are equivalent (no write-back
  handle is kept either way); the plain input supports the multi-select
  needed for PNG + manifest pairs, works in Safari/Firefox without a
  fallback branch, and can be driven by Playwright, so the open path stays
  end-to-end testable. Save still uses `showSaveFilePicker` where
  available, where the FS Access API actually adds something.
- **Dispatch is by content, not just extension**: a `.json` selected alone
  must parse as a project (`format: "doodledo-project"`); a `.json` with an
  `animations` key is treated as a strip manifest and refused without its
  PNG. Mixed or ambiguous selections (project + PNG, two PNGs, manifest
  alone) fail with specific messages rather than guessing.

## Export formats

Sprite sheet exports produce three files: the PNG sheet, a TexturePacker
JSON-hash atlas (loads natively in Phaser, importable in Godot/Unity
pipelines), and `*.doodledo.json` — a minimal schema for hand-rolled
engines: `{ format, version, image, frameSize, fps, frames: [{x, y, w, h,
durationMs}] }`. GIF export runs gifenc in a Web Worker with per-frame
delays and index-0 transparency.
