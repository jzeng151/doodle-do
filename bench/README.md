# bench/

Performance harness for the Phase 0 gate. Run with:

```
npm run bench          # builds, serves, runs headless Chromium, checks the gate
npm run bench -- --no-build
```

Or open `/bench` in any browser for an interactive run.

## What is measured

**stroke→loop latency (the gate):** synchronous cost from a pointer event
being applied (`StrokeBuilder.moveTo`) through dirty-rect recomposite and
blit to both the editor canvas and the live-loop canvas. Display present
(≤1 vsync) is outside our control and excluded. Scripted load: 100 strokes
× 30 moves at 64×64 with 4 layers and 12 frames, seeded PRNG, rAF-paced
between strokes like real input.

**Gate:** p95 < 16ms. The driver exits non-zero on failure.

Informational: pointer-up finalize cost, full 12-frame grid redraw
(Phase 3 budget: one animation frame), and worst-case full composite at
the 128×128 / 8-layer cap.

Gates are evaluated on the reference machine, not by feel. Record the
machine and numbers in the table below when running for a gate decision.

| Date | Machine | stroke→loop p95 | grid redraw | verdict |
|------|---------|-----------------|-------------|---------|
| 2026-07-13 | Linux (CachyOS), headless Chromium 149 | 0.1ms | 0.9ms | PASS |
