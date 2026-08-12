# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: indie and hobby game developers who need sprite animation for a
Phaser or Godot project and do not consider themselves artists. They open
the tool with a concrete asset need (a walk cycle, an idle, an attack) and
a deadline, not a desire to learn art for its own sake.

Secondary, in weight order:

1. Beginners learning pixel animation as a craft, for whom the teaching
   layer is the reason to stay.
2. Experienced pixel artists who want a fast, local, account-free tool and
   keyboard-driven control.

The landing page leads with the indie-dev job; the teaching layer is the
differentiator, not the headline promise.

## Product Purpose

Doodle-Do is a frame-by-frame pixel animation tool that runs in the
browser and teaches animation principles while the user works. Success is
a user going from empty canvas to an engine-ready animated sprite in one
sitting, having learned something they did not know when they started.

The Phase 1 gate the project set for itself: a founder ships a 4-frame
walk cycle in under 30 minutes.

## Positioning

Two mechanisms a neighboring tool could not truthfully copy:

- **The teaching layer is built into the tool, not bolted on.** 26
  contextual tips (`src/lib/learn/tips.ts`) fire from real editing events,
  never modally, at most one at a time, each capped and individually
  dismissible forever. They teach animation principles ("draw where things
  have moved to, not where they were"), not UI mechanics.
- **Three modes are pure views over one session, and the tool says out
  loud what each one is bad at.** Focus, Grid, and Loop share a document,
  frame, zoom, and palette; the switcher carries "great at / strains when"
  tooltips (`src/lib/modes/ModeSwitcher.svelte`). Honest about tradeoffs
  rather than claiming one view does everything.

No AI, no accounts, no cloud. Work is local-first.

## Operating Context

Users work alongside a game project. The output leaves Doodle-Do and
enters an engine: a PNG sprite sheet plus a TexturePacker JSON-hash atlas
(loads natively in Phaser, importable in Godot), plus `*.doodledo.json`
for hand-rolled engines. GIF export exists for showing work off. Frame
PNGs export zipped.

Import accepts `.doodledo` project files and horizontal sprite strip PNGs
(with optional `animations.json` for per-frame timing), so users can bring
in art from existing animation packs.

The tool is a PWA and works offline. Work autosaves to OPFS (IndexedDB
fallback), but the product's stated position is that a project file on
disk is the only copy the user truly owns.

## Capabilities and Constraints

Confirmed and shipped:

- Tools: pencil, eraser, fill, eyedropper, and four selection tools
  (rectangle select, lasso, wand, polygon). Brush sizes 1-4px.
- Mirror-draw across the centerline, including mirror-twin selections that
  move, rotate, flip, and extract symmetrically.
- Onion skinning (previous frame red, next frame green) with an opacity
  slider.
- Frames, layers, merge down, send-layer-to-frame (copy or move).
- Bulk frame editing: Ctrl/Shift-click a set of frames, then strokes,
  fills, flips, and selection moves fan out across all of them as one
  undoable step. Stacked ghost view while editing the set.
- Palette with lock, swap, and remove. Palette lock restricts painting to
  palette colors.
- Loop playback with an adjustable From/To range.
- Canvas-size presets and resize (crop or scale).
- Full undo/redo, keyboard-driven (1/2/3 modes; B/E/G/I/M/L/W/P tools;
  brackets for brush size; arrows nudge or step frames).

Technical constraints that bind design:

- The document model's transparency is **1-bit**. Alpha is thresholded at
  128 on import. No soft edges, no anti-aliasing, no blur in the artwork
  itself.
- Palette cap is 64 colors; strip imports beyond that are quantized.
- Rendering is Canvas 2D. The performance budget is 16ms per stroke-to-
  loop cycle; measured p95 is 0.1ms.
- Stack is SvelteKit 2 + Svelte 5 (runes) + Vite, static adapter,
  Cloudflare Pages target. No CSS framework and no UI library is currently
  installed.

Release model:

- Doodle-Do is free and is not intended to be monetized.
- A future external support link may accept optional one-time contributions.
  Contributions do not unlock features, services, support, or other benefits.

Explicitly undecided, and not to be stated as fact anywhere in the UI or
marketing:

- License, repository visibility, and whether the product is
  publicly launched.
- The reference animation library (§4.5) is blocked on commissioned art;
  tip T12 stays dormant until it exists.

## Brand Commitments

Name: **Doodle-Do**. The only existing identity asset is
`src/lib/assets/favicon.svg` plus 192/512 PWA icons. No confirmed logo,
wordmark, typeface, or palette; the current dark editor chrome is an
implementation default, not a brand decision.

Voice, as evidenced by the shipped tip copy and mode tooltips: plain,
specific, encouraging without flattery, willing to name what a thing is
bad at. "Longer isn't always better." "The loop preview never lies."
"Onion skin is training wheels that pros never take off."

## Evidence on Hand

Real, verifiable:

- The full shipped feature set above, in code.
- Phaser import verification passing (`npm run verify:phaser`) and Godot
  import verification passing (`npm run verify:godot`) against stock
  engines.
- Performance: 0.1ms p95 stroke-to-loop against a 16ms budget
  (`bench/README.md`).

Absent, and never to be fabricated: testimonials, user counts, customer
logos, press, funding, launch dates, awards, ratings, a license
claim, a repository URL, and any example sprite artwork. The reference
animation library does not exist yet. Any sprite shown in marketing must
be generated by this project's own code or clearly presented as a
placeholder.

## Product Principles

1. **The user owns their work.** Local-first, no accounts, no upload. A
   file on disk beats a promise about a server.
2. **Teach at the moment of relevance, never in the way.** A tip fires
   from something the user just did, appears once, and can be silenced
   forever.
3. **Be honest about tradeoffs.** Name what each mode strains at. Do not
   claim smoothness comes from frame rate when it comes from in-betweens.
4. **The output has to land in a real engine.** Export formats are
   verified against stock Phaser and Godot, not asserted.
5. **Constraints are the craft.** Limited palettes, 1-bit alpha, and small
   canvases are the medium, not limitations to apologize for.

## Accessibility & Inclusion

No product-specific standard has been established by the user. The
existing implementation uses semantic roles, `aria-label`s on icon-only
and slider controls, `aria-live` on the status region, and a visible
`:focus-visible` outline; keyboard coverage is broad by design. Preserve
that floor.
