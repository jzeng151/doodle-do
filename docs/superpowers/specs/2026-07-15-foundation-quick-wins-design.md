# Foundation + quick wins: composite undo, extract-to-layer, nudge, loop range

Approved 2026-07-15. First slice of the feature roadmap (bulk frame editing,
mirrored selection, layer transfer/merge follow later and build on this).

## CompositeCommand (core/commands.ts)

A `Command` wrapping an ordered list: `do` runs children in order, `undo` in
reverse, `byteSize` sums, `dirty()` returns the children's shared frame (rect
null = whole frame) or whole-document when children disagree. This is the
primitive every multi-mutation feature needs for single-step undo.

## Extract selection to layer

`FloatingSelection.extract()` returns the transformed selection stamped into a
blank canvas-sized pixel array plus a `PixelDiffCommand` that clears the source
pixels (diff of the lifted state vs the snapshot). `commit()`'s stamp and diff
loops are shared, not duplicated. `session.extractSelectionToLayer()`:
auto-lift a bare mask, compute extract, cancel the float (restoring the layer),
then dispatch ONE composite: [source-clear diff, `LayerAddCommand` with the new
layer above the current one]. The new layer becomes active. No-ops when the
selection holds only transparent pixels or the frame is at `MAX_LAYERS`.
UI: an Extract button in `LayerPanel`'s header plus Ctrl+J.

## Nudge selection by pixel

Arrow keys move an active selection by 1px (`session.nudgeSelection(dx, dy)`:
auto-lift, then `moveFloatingBy`). Left/Right fall back to today's frame
switching when no selection is active; Up/Down only nudge.

## Loop playback range

`session.loopRange: { start, end } | null` (view state, B7: not undoable, not
persisted). `LoopPlayer` takes a live range getter; advancing past `end` wraps
to `start`; a frame outside the range snaps to `start`. Pure helper
`nextLoopFrame(frame, start, end)` carries the logic for unit tests. UI: From/To
number inputs (1-based) in LoopView's controls; a range covering all frames is
stored as null. `LoopPreview` in focus mode honors the same range. Frame
add/delete is handled by clamping on read.

## Out of scope

Bulk multi-frame editing, mirrored-twin selection, layer transfer, layer merge
(later slices; they reuse CompositeCommand), shift-arrow large nudge steps.
