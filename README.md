# Doodle-Do

Frame-by-frame pixel animation tool that teaches you as you work.
Web-based, local-first, no accounts, no AI. See the requirements plan for
the full spec.

**Status: Phase 0 (rendering spike) — gate passed.** Canvas 2D confirmed;
stroke→loop p95 = 0.1ms against a 16ms budget (see `bench/README.md`).

## Layout

```
src/lib/core/    document model, commands, palette ops (pure TS, no DOM)
src/lib/render/  compositor, frame cache, live loop player
src/lib/tools/   stroke builder (command factories)
src/routes/      Phase 0 spike page + /bench harness page
bench/           performance harness (Phase 0 gate instrument)
e2e/             Playwright smoke tests
```

## Commands

```sh
npm run dev        # dev server
npm run test       # core unit tests (vitest)
npx playwright test  # e2e smoke
npm run bench      # performance gate (headless Chromium)
npm run build      # static build (Cloudflare Pages target)
```
