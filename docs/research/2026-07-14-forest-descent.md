# The forest descent — the macro window goes inside

*2026-07-14*

## What we built
The macro-optics window is no longer a fixed zoom of the cortex — it now **descends**
into a Cajal neuron forest. A descent scalar `z ∈ [0,1]` (`src/scalestack.js`) drives
the two-level slice of the scale-stack: cortex zoom (`z < 0.5`) hands off to the forest
(`z > 0.5`). It auto-loops (dive → hold → surface); clicking the macro window holds the
dive; and `#forest` deep-links straight in.

## The forest (`src/levels/forest.js`)
A separate O(1)-scaled scene with its own camera + fog, so precision is trivial — the
degenerate floating-origin case of `adr/0002`. Procedural pyramidal neurons: recursive
domain-jittered dendrites drawn as additive-blended glowing `LineSegments`, somata as
soft radial sprites that pulse on a per-neuron half-wave firing envelope, receding into
`FogExp2` so depth reads. Seeded per region via `gen/seed.js` (mulberry32) so a given
specimen always grows the same forest.

## Cross-fade decision (closes an open question)
Not a simultaneous opacity blend or a geometry morph — a **through-dark opacity
hand-off**: only one level renders into the scissor rect at a time, and both fade to
the eyepiece dark (`#0a0c12`) at the `z = 0.5` seam. It reads as "descending through the
tissue," avoids blending two 3D scenes in one rectangle, and keeps the macro pass at
≤1 render. Implemented as `toneMappingExposure × fade`, with `cortexFade` / `forestFade`
from `scalestack.js`.

## Still open
- **The synapse level** — the next descent step (`src/levels/synapse.js`).
- **Ink / plate mode** for the forest — Cajal black-on-cream vs the current
  fluorescence-on-dark look.
- **A real geometry morph** between levels, if we ever want a seamless (non-dark)
  hand-off, or to chain 3+ levels in one view (where true frame re-rooting kicks in).
