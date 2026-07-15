# The Cajal ink plate + the anatomical atlas

*2026-07-15*

Two changes that make the survey read more like the Neurocomic source and less like a
generic sci-fi scanner: a **plate mode** that renders the whole descent as sepia ink on
cream, and a **scale-aware atlas** that replaces the fuzzy macro-optics crop with the
traditional way of showing *where* a brain region is.

## Plate mode (`PLATE` toggle)

A single button flips the entire survey between the photoreal "eyepiece" look and a
Cajal histology-plate look — sepia ink on warm cream. It is deliberately cheap to toggle:

- **Ground / HUD / veil** — a `.plate` class on `:root` swaps the CSS custom properties
  (`--bg`, `--panel-bg`, `--ink`, `--accent`, `--veil`, …) to a cream/sepia palette. It is
  placed *after* the light/dark theme blocks so source order lets it win over either theme
  without touching the existing theme system. The through-dark seam (`#veil`) becomes a
  through-*light* cream seam for free, because its colour is now `var(--veil)`.
- **Brain** — no material swap. The scan-shader patch gained a `uInk` uniform: when set,
  the lit PBR fragment is collapsed to a sepia ramp keyed on luminance
  (`mix(inkDark, inkCream, smoothstep(l))`), so the existing three-point lighting supplies
  the fold shading and the result reads as a shaded engraving. The scan halo/ring is gated
  off by `(1 - uInk)` — a plate doesn't glow.
- **Forest / synapse** — each level got a `setInk(on)` that swaps additive-on-black glow
  for normal-blended dark ink and repaints the fog cream. The forest becomes the classic
  Golgi drawing (black dendrites on cream); the synapse drops its glow bulb and keeps the
  wireframe terminal as the ink outline.

Because the WebGL clear is transparent, the cream CSS ground shows through behind the ink
neurons, and the cream fog fades distant ones into it — so the Golgi look composites for
free.

## The anatomical atlas (`src/locator.js`)

The right-hand window used to be a second WebGL camera cropping the cortex — a blurry
zoom that said little. It is now a 2D canvas atlas that shows the *traditional* locator
for whatever scale you're at, and swaps with descent:

- **Surface** → a lateral brain silhouette (cerebrum / cerebellum / brainstem + Sylvian
  and central fissures) with an atlas dot per survey region; the active one pulses.
- **Forest** → a cortical column, layers I–VI, layer V (pyramidal) highlighted with
  little pyramidal-cell glyphs.
- **Synapse** → a pre-terminal with vesicles, transmitter crossing the cleft, and a
  postsynaptic receptor band.

It reads its colours from the same CSS variables, so it turns sepia in plate mode with no
extra code. The window footer pairs a location label (left, e.g. `GYRUS FRONTALIS`) with
the view/scale readout (right, e.g. `ATLAS · LATERAL`).

## Notes / still open
- The lit crown of the plate brain fades into the cream ground; a fresnel darkening at
  grazing angles would firm up the silhouette like a real engraving outline.
- Dev caching bit us: Python's `http.server` sends no `Cache-Control`, so the browser
  served a stale module after an edit. The local dev server now sends `no-store`.
