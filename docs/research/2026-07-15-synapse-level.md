# The synapse level — the deepest scale

*2026-07-15*

## What we built
A third descent level below the neuron forest: a single synapse releasing. The descent
scalar `z` now runs `[0, 2]` over three levels — brain (0) → neuron forest (1) → synapse
(2) — with through-dark veil seams at `z = 0.5` and `z = 1.5`. Scroll / pinch / keys carry
you all the way down; `#synapse` deep-links straight in.

## The synapse (`src/levels/synapse.js`)
Its own O(1) scene + camera + fog. A glowing presynaptic terminal (additive membrane bulb
+ wire rim) holds drifting vesicles; a curved band of postsynaptic receptors sits across
the cleft. Every ~1.7 s a vesicle fuses and releases a burst of neurotransmitter particles
(additive sprites, analytic `origin + vel·age` motion so it's frame-rate independent) that
cross the cleft and flash the receptor they hit. Seeded per region via `gen/seed.js`.

## Camera
`frames.js` gains `synapseCamera` (dolly + orbit over `z ∈ [1.5, 2]`); the forest camera's
dolly was extended to keep pushing in over `z ∈ [1, 1.5]`, so the hand-off reads as flying
toward one synaptic connection and punching in. Drag orbits whichever deep level you're in
(shared `orbitYaw` / `orbitPitch`).

## Still open
- **Deeper still?** — receptors → ion channels → molecules is possible, but three levels
  already spans the Neurocomic arc (forest → synapse); diminishing returns vs. polish.
- The earlier open items stand: fold realism, ink/plate mode, credibility.
