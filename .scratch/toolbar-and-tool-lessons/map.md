Label: wayfinder:map

## Destination

A decision-complete product and interaction spec for configurable drawing-toolbar layouts and interactive tool lessons, followed by implementation tickets. This map plans the work and does not implement it.

## Notes

- Use `/grill-with-docs` for decision tickets and domain vocabulary. Use `/prototype` where a concrete interaction is needed.
- The toolbar effort covers the drawing toolbar in Focus and Grid, not the file/export header or side panels.
- The three toolbar layouts are Essentials, Full, and Custom. New users choose one from a visual first-use popup. Existing users keep Full until they choose otherwise.
- Custom can control every toolbar group. The exact dependency and recovery rules remain open.
- A toolbar preference applies across projects and persists in the browser, not in `.doodledo` files.
- Tool lessons are user-started tasks on the canvas. They remain separate from event-triggered animation Tips.
- Formal analytics and usability targets are not a release priority. The owner will use direct feedback.
- Preserve keyboard access, semantic labels, coarse-pointer tap targets, and the local-first product model.

## Decisions so far

## Not yet specified

- The implementation slices, preference migration, and test boundaries depend on the chosen toolbar and lesson interactions.
- Final instructional copy and any lesson visuals depend on the representative lesson prototype.
- Documentation and product-copy changes depend on whether the prototypes alter existing claims about tips and editor layout.

## Out of scope

- Decluttering the file/export header, side panels, frame strip, or palette controls outside the drawing toolbar.
- Formal analytics, telemetry, or a research program for the first release.
- Combining Tool lessons with the contextual Tips queue.
- Saving toolbar preferences or lesson progress inside project files.
