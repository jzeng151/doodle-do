# Doodle-Do

Frame-by-frame pixel animation tool that teaches you as you work.
Web-based, local-first, no accounts, no AI. See the requirements plan for
the full spec.

## Status

- **Phase 0 (rendering spike): gate passed.** Canvas 2D confirmed;
  stroke→loop p95 = 0.1ms against the 16ms budget (`bench/README.md`).
- **Phase 1 (focus mode MVP): code complete.** Full toolset minus
  selection, onion skinning, palette lock/swap/remove, frames and layers,
  Appendix-B undo, OPFS autosave with IndexedDB fallback, sprite sheet
  (TexturePacker JSON-hash + doodledo.json) and GIF export.
  - Phaser import verification: **passing** (`npm run verify:phaser`).
  - Godot import verification: **open** — no Godot binary on this machine.
  - Phase 1 gate (founder ships a 4-frame walk cycle in under 30 minutes):
    **awaiting the founder.**
- Known gap for Phase 2: canvas-size presets on "New" (currently always
  32×32), selection/move, tips engine, reference library, PWA.

## Layout

```
src/lib/core/    document model, commands, palette ops (pure TS, no DOM)
src/lib/render/  compositor, frame cache, onion tinting, loop player
src/lib/tools/   stroke/fill/flip/eyedropper (command factories)
src/lib/io/      project file, OPFS autosave, exporters (GIF in a worker)
src/lib/modes/   focus mode views (grid/loop modes arrive in Phase 3)
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

## Export formats

Sprite sheet exports produce three files: the PNG sheet, a TexturePacker
JSON-hash atlas (loads natively in Phaser, importable in Godot/Unity
pipelines), and `*.doodledo.json` — a minimal schema for hand-rolled
engines: `{ format, version, image, frameSize, fps, frames: [{x, y, w, h,
durationMs}] }`. GIF export runs gifenc in a Web Worker with per-frame
delays and index-0 transparency.
