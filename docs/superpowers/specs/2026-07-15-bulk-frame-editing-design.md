# Bulk multi-frame editing

Approved 2026-07-15 (roadmap item 1, the last). Pick several frames, see them
stacked, and one gesture edits every selected frame's own content as ONE undo.

## Frame picking

In the focus-mode frame strip: Ctrl-click toggles a frame into the edit set,
Shift-click selects the range from the current frame. Plain click returns to
single-frame editing. `session.bulkFrames: number[]` (sorted, empty = single;
always includes the current frame when non-empty). The set clears on plain
select, frame add/delete/reorder (index remapping is not worth its
complexity), and mode switch. Set membership renders as a blue thumb border;
the stacked view draws the other set frames at 35% alpha under the active
frame, like onion skin but in true color.

## Fan-out

Every mutating gesture builds per-frame commands against each frame's OWN
pixels and bundles them in a CompositeCommand (single undo):
- Strokes: one StrokeBuilder per set frame, driven in lockstep
  (mirror-draw composes for free).
- Fill: one floodFill per frame (flood extents differ per frame, by design).
- Whole-layer flip: one FlipLayerCommand per frame.
- Selection: the mask lifts per frame (active frame's floats render live;
  other frames show lifted holes in their ghosts until commit); move, rotate,
  flip, and nudge apply identically to each frame's floats, mirror twins
  included. Commit emits one command per frame inside the composite; Escape
  cancels every frame's snapshot.

Frames whose layer stack is shorter than the active layer index are skipped.

## Limitations (deliberate)

- Extract-to-layer no-ops while a bulk set is active (layer-structure edits
  stay single-frame).
- The edit set does not survive frame add/delete/reorder.

## Tips

T25 (Ctrl/Shift-click discovery) fires on selecting a frame once the doc has
3+ frames; T26 (bulk active explanation) fires when the set first activates.
