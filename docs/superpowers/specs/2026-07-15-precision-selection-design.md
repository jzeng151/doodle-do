# Precision selection: lasso, magic wand, polygon

Approved 2026-07-15. Extends the B5 selection model (rect marquee, multi-select,
group move/rotate/flip, one-command commit) with non-rectangular selection.

## Requirements

- Three new focus-mode tools, one toolbar button each: Lasso (L), Wand (W), Polygon (P).
- Lasso: freehand-drag an outline; release auto-closes and selects the enclosed pixels.
- Wand: click selects the 4-connected same-color region on the active layer
  (transparent counts as a color; selecting it is harmless since lifted zeros stamp nothing).
- Polygon: click places vertices; close by clicking the first vertex or pressing Enter;
  Escape cancels the in-progress outline.
- Everything from the existing model keeps working on precision selections:
  shift adds to the selection, drag inside moves the group, the handle rotates it
  (free angle, Shift snaps 15 degrees), flips, Escape/Enter, commit-on-lifecycle,
  and the whole edit is ONE undo command.

## Design

**Unified mask representation.** The pre-lift state `session.marquees: Rect[]`
becomes one canvas-sized selection mask (`Uint8Array`, 1 = selected). Every tool
bakes its result into the mask; a non-shift gesture clears it first. With four
mask-producing tools, a rect list would be a second representation of the same
thing in hit-testing, outlines, and lifting.

**Model.** `FloatingSelection`'s constructor takes the mask instead of `Rect[]`
and computes the bbox from mask extents. The pristine-buffer transform machinery
(move/rotate/flip/commit/cancel) is untouched. `maskFromRects()` covers the
rectangle tool and tests.

**Rasterization.** `maskFromPolygon(points)`: even-odd scanline fill sampled at
pixel centers, plus the path pixels themselves so thin lasso strokes still select.
Shared by lasso (pointer trail) and polygon (vertices).

**Wand.** The BFS inside `floodFill` (src/lib/tools/fill.ts) is extracted into
`floodRegion()` and reused; no duplicated traversal.

**Outline.** Marching ants traced from the mask: edges between selected and
unselected pixels, drawn in the existing white/black dash style. The floating
(lifted) outline stays the rotated bbox polygon.

**Interaction rules, all four selection tools identical:** rotate-handle hit
first, then shift = additive gesture, then click-inside-selection = move,
otherwise start that tool's gesture.

## Out of scope

- Grid-mode frame multi-select (future feature).
- Wand tolerance/threshold, anti-aliased edges, mask feathering.
- Selection modes beyond add (no subtract/intersect).
