---
name: Doodle-Do Screentone
description: A working pixel-animation tool presented as a weekly manga page: black ink, warm newsprint, visible halftone, and direct editorial pacing.
colors:
  paper: "#f2efe6"
  paper-2: "#e9e5d9"
  ink: "#111111"
  gray: "#6a675f"
  comb-red: "#b52e2e"
  onion-previous: "#d04648"
  onion-next: "#6daa2c"
  checker-light: "#f7f4ec"
  checker-dark: "#ddd9ce"
  checker-muted: "#bbb7ad"
typography:
  family: "Zen Kaku Gothic New, Noto Sans, system-ui, sans-serif"
  marketing-body: "1rem / 1.6"
  product-body: "0.8125rem / 1.45"
  label: "0.6875rem / 1.2 / 700 / 0.14em"
  micro: "0.625rem / 1.2 / 700 / 0.14em"
  display: "clamp(2.7rem, 6vw, 5.2rem) / 0.98 / 900"
rounded:
  panel: "0"
  speech-bubble: "22px"
---

# Doodle-Do Screentone

## Direction

Screentone is the production visual system. The app should feel like a manga page built for work: warm newsprint, hard black rules, visible dot screens, caption boxes, speech-bubble teaching notes, and panels arranged for reading order. It is not a generic monochrome dashboard and not a decorative comic skin.

The white chicken with the red comb is the canonical example animation. It is labeled as example artwork, never presented as a user project or product library.

## Content contract

Canonical product copy lives in `src/lib/content/product.ts`. UI components import that source instead of maintaining alternate descriptions.

Every public claim must be directly supported by shipped code or tests:

- Three views—Focus, Grid, and Loop—share one editor session.
- Twenty-seven contextual tips fire from editing actions, never modally, one at a time, and can be dismissed forever.
- Work autosaves locally to OPFS with IndexedDB fallback. A `.doodledo` file on disk is the durable user-owned copy.
- Import accepts `.doodledo` projects and horizontal strip PNGs, optionally with animation timing data.
- Export produces a PNG sprite sheet, TexturePacker JSON-hash, `doodledo.json`, GIF, and zipped frame PNGs.
- Phaser and Godot verification scripts support the engine-output claim.
- The document model uses 1-bit transparency, brush sizes 1–4px, and a 64-color palette cap.
- Doodle-Do is free. Optional contributions through an external support link do not unlock features or services.

Do not claim licensing, public availability, testimonials, user counts, a reference animation library, or any unshipped collaboration/cloud feature.

## Color

`paper` is the page and editor ground. `paper-2` separates secondary fields and checkerboards. `ink` carries structure, active controls, text, and focus indicators. `gray` is metadata only.

`comb-red` is a rare stamp color for destructive actions and the chicken comb; it should not become a general accent wash. Onion previous and next retain their fixed red/green meanings and are never swapped.

Halftone is a real dot pitch built with radial gradients. It appears on stages, section heads, and empty work areas where it reinforces the print metaphor. It does not sit behind long body copy at high contrast.

## Typography

Zen Kaku Gothic New is loaded with `font-display: swap`; Noto Sans and system UI are the offline-safe fallbacks. The interface remains fully usable without the web font.

Marketing prose is at least `1rem` with a maximum measure of 65–70 characters. The editor uses fixed rem roles: `0.625rem` micro labels, `0.6875rem` section labels, `0.75rem` controls, `0.8125rem` UI prose, and `0.9375rem` compact headings. Large landing headings use fluid `clamp()` sizing and never track tighter than `-0.04em`.

Uppercase and tracking belong to labels, chapter furniture, and panel captions. Sentences remain sentence case and untracked.

## Layout

The landing page reads as a chapter: masthead, hero panel, view table, teaching bubbles, output list, then the factual toolbox. Panels use full black borders and shared seams rather than floating cards.

The editor keeps the production information architecture: title bar, tool row, active workspace, side panels, and frame strip. Screentone changes material and hierarchy without moving or hiding core functions.

At narrow widths, the canvas stays primary, the side rail moves below it, horizontal control groups scroll instead of disappearing, and tap targets remain at least 44px on coarse pointers.

## Shape and borders

Most surfaces are square. The only rounded surface is the 22px speech bubble used by contextual tips. Its angular tail and 3px full border are intentional manga grammar, not a generic rounded card.

Internal vertical borders in tables, button groups, and the editor rail are structural seams. They are not colored side accents. Hard shadows, when used, have zero blur; soft ambient card shadows are not part of the system.

## Motion and accessibility

The example sprite and live loop are the only continuous motion. Respect `prefers-reduced-motion` by pausing autoplay where the production player already does so. Focus indicators use a 3px black outline on paper. All controls retain semantic labels, keyboard access, and readable contrast.
