# Mirrored-twin selection

Approved 2026-07-15 (roadmap item 4). With Mirror on, a selection gets a twin
across the canvas X centerline, and move/rotate/flip apply symmetrically,
matching mirror-draw's philosophy for selections.

## Model

The twin is an ordinary second `FloatingSelection` lifted from the mirrored
mask (`mirrorMaskX`). Symmetry comes from mirrored parameters, not new
rasterizer code: main `moveBy(dx, dy)` pairs with twin `moveBy(-dx, dy)`,
`rotateTo(a)` with `rotateTo(-a)`, `flip(axis)` with the same flip. Reflection
conjugation (Mx R(a) Mx = R(-a)) makes the twin's render the exact mirror of
the main's.

Lift order matters: main lifts first, so ITS snapshot is the pristine layer.
- Commit: `main.commitPair(twin)` stamps twin then main and diffs once against
  main's snapshot. Still ONE PixelDiffCommand.
- Cancel: `main.cancel()` alone restores everything (its snapshot predates the
  twin's lift). The twin's own commit/cancel are never called.
- Extract: `main.extractPair(twin)` stamps both into the new layer's pixels
  and clears both sources in one source diff.

Selection crossing the centerline: overlap pixels lift into the main once;
the twin lifts zeros there and stamps nothing. Graceful, no special-casing.

## Session and UI

`floatingTwin` sits next to `floating`; it exists only when Mirror was on at
lift time (toggling Mirror mid-float changes nothing). `moveFloatingBy`,
`rotateFloating`, `flip`, and nudge route mirrored parameters to the twin.
Pre-lift, the marching ants also draw mirrored (canvas transform trick, no
second mask). Pointer: clicking inside the twin region moves the pair with
dx negated so the dragged half follows the pointer; the rotate handle stays
on the main selection. Tip T24 fires on the first mirrored lift.

## Out of scope

Y-axis mirror, per-selection mirror toggle independent of mirror-draw,
mirroring an already-lifted selection retroactively.
