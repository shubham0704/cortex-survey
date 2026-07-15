# CONTEXT — cortex-survey

A photoreal WebGL "neural field survey": a procedural human brain examined by a
scanner HUD, built as the brain counterpart to Daniel An's `cardia-survey` heart
demo. The thesis, borrowed from *Neurocomic*: don't scan the brain like a dead
specimen — descend into it.

## Vocabulary
- **specimen** — the whole procedural brain (cerebrum + cerebellum + brainstem).
- **survey / region** — one scan waypoint on the specimen (a `REGIONS[]` entry).
- **descent** — the zoom across scales: brain → cortical patch → neuron forest →
  synapse. Each step goes *inside*, not just closer. Step 1 is live: scroll / pinch /
  keys dive the main view from the brain into the neuron forest and back.
- **level** — one node of the scale-stack; one file under `src/levels/`.
- **scale-stack** — the lazy hierarchical LOD tree spanning the levels.
- **frame** — a level's local coordinate system. Under the floating-origin scheme
  the camera stays near the origin and the frame re-roots on each descent.
- **impostor** — a cheap stand-in (billboard) for a collapsed / distant level.
- **macro optics** — the right-hand panel: a second camera rendering a zoomed view
  of the specimen into the panel rectangle (`setScissor` / `setViewport`).
- **scan** — the travelling shader halo/ring emanating from the current region.

## Layout
- `index.html` — shell: markup, styles, import map, `import ./src/main.js`.
- `src/` — behaviour, split by *level* first (see `src/levels/`), concern second.
- `docs/` — this file, `open-questions.md`, `references.md`, dated `research/`,
  numbered `adr/`.
- `archive/` — the original self-contained 2D ink prototype, kept for provenance.

## Non-negotiables
- Zero build step. ESM via import map, Three.js from CDN. `edit → push → live`.
- Runs on GitHub Pages (served over http; never opened as a `file://`).
- Both light and dark themes; honours `prefers-reduced-motion`.
