# Multi-scale zoom — data structures for the descent

*2026-07-14*

## Question
What data structure lets us zoom brain → cortex → neuron forest → synapse (≈6 orders
of magnitude) with correct rendering?

## What we found
It's the *Powers of Ten* problem, and it splits into two decoupled sub-problems that
are usually conflated:

1. **Which representation to draw at each scale** — a **lazy hierarchical LOD tree**
   ("scale-stack"). Each node is one level with geometry + transform-relative-to-parent
   + a zoom interval. Expand only the path being descended (like opening one folder in
   a filesystem tree). Zoom is a continuous log scalar `z` (`scale ≈ 10^z`); at most
   **two adjacent levels are alive**, cross-faded on the fractional part. Bounds cost to
   ~2 levels at any depth. (Mipmapping, but the "texels" are whole representations.)
   → `adr/0003`

2. **Not running out of float precision** — a **floating origin**. 32-bit float has
   ~7 digits; brain (0.15 m) to synapse (1e-6 m) underflows the relative coordinates →
   jitter, z-fighting, dead camera controls. Fix: never compute absolute world
   coordinates — re-root the frame at the current level, composing only the active path
   and renormalizing to O(1) each hop. "The camera doesn't descend; the world rescales
   up around it." → `adr/0002`

Supporting structures:
- **Intra-level**: an octree / BVH for frustum culling + impostor selection within a
  busy level (the forest of hundreds of neurons).
- **Content**: deterministic procedural, seeded by the descent path; detail arrives as
  added noise octaves (the gyri already work this way). → `src/gen/seed.js`

## Maps onto the code
`THREE.LOD` is too weak (single-object distance swap) → hand-roll the scale-stack in
`src/scalestack.js`. The macro-optics window is already "the next level down": the
descent is promote-macro-to-main → re-root → generate child → repeat.

## Prior art
Powers of Ten; geometry clipmaps / OpenSceneGraph PagedLOD; space-sim floating origin;
Mandelbrot perturbation.

## Still open
- Cross-fade mechanic: opacity blend vs geometry morph between levels.
- Where the octree gets built for the forest (per-descent, from the seed).
