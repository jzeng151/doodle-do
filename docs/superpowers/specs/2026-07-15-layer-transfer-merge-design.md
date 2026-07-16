# Layer operations: merge down, send to frame

Approved 2026-07-15. Roadmap items 5 and 6; both are CompositeCommand bundles.

## Merge down

`mergeDownCommand(doc, frame, layerIndex)` (src/lib/tools/layers.ts) composites
the layer's nonzero pixels onto the layer below (matching the compositor's
topmost-wins flattening, regardless of visibility flags), then deletes it:
a `PixelDiffCommand` on the lower layer plus a `LayerDeleteCommand`, in ONE
composite. The merged (lower) layer stays active. UI: a button in the Layers
panel header, disabled on the bottom layer.

## Send layer to frame

`sendLayerCommand(doc, frame, layerIndex, targetFrame, move)` clones the layer
onto the TOP of the target frame's stack (`LayerAddCommand` takes the prebuilt
payload); a move also deletes the source, in the same composite. Refused when
the target is the same frame or at MAX_LAYERS, or when a move would leave the
source frame empty. UI: a Layers-panel button opening SendLayerDialog
(ResizeDialog pattern): target frame number, Copy / Move / Cancel. Disabled
with fewer than two frames.

## Tips

T22 (merge) and T23 (send) fire on addLayer, where both features become
relevant; T23 only when a second frame exists, and it queues behind T22.
T23 deliberately does NOT fire on addFrame: the phase2 e2e contract expects a
re-duplicated frame to stay quiet after its tip is dismissed forever.

## Out of scope

Merging non-adjacent layers, merge-visible/flatten-all, sending to multiple
frames at once, drag-and-drop transfer.
