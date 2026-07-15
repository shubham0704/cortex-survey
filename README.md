# Encephalon — Neural Field Survey

A photoreal WebGL brain-specimen scanner, built as the brain counterpart to Daniel
An's `cardia-survey` heart demo. Same pipeline shape (Three.js + PBR studio lighting
+ a surface-scan shader + a real second-camera macro zoom + raycast-anchored HUD),
but the brain mesh is **generated procedurally** — displaced, gyrified, welded for
smooth normals — so there is **no 3D model file** to ship.

**Live:** https://shubham-bhardwaj.com/cortex-survey/

## Run it

ES modules + an import map pull Three.js from a CDN, so it must be **served over
http(s)** — opening `index.html` as a `file://` URL will not work.

```bash
python3 -m http.server 8000   # then open http://localhost:8000/
```

Or host it: push to a repo and enable GitHub Pages.

## Layout

- `index.html` — shell: markup, styles, import map, `import ./src/main.js`.
- `src/` — behaviour, split by *level* first, concern second:
  - `main.js` bootstrap + loop · `scene.js` renderer/lights/env · `scan-shader.js`
    the scan-glow material patch · `hud.js` panels/EEG/reticle · `audio.js` sound.
  - `levels/` — one module per scale (`brain.js` today; `cortex` / `forest` /
    `synapse` are the planned descent). `gen/` — noise + path seeding.
  - `frames.js`, `scalestack.js` — the multi-scale machinery (planned; see docs).
- `docs/` — `CONTEXT.md` (vocabulary), `open-questions.md`, `references.md`, dated
  `research/`, numbered `adr/`.
- `archive/` — the original self-contained 2D ink prototype.

## What's inside

- **Procedural brain** — icosphere → domain-warped ridge-network displacement
  (gyri/sulci) + a longitudinal fissure, welded via `mergeVertices` for smooth
  shading; separate cerebellum (fine foliation) and brainstem. Baked vertex-colour
  AO darkens the sulci.
- **Descent** — scroll, pinch, or press `+`/`−` to dive the whole view from the brain
  down into a procedural Cajal neuron forest and back (or open the `#forest` deep-link).
  The brain → forest hand-off is a through-dark fade.
- **Studio render** — ACES Filmic tone mapping, PMREM `RoomEnvironment`, three-point
  lighting over a CSS seamless backdrop with a contact shadow. Light + dark themes.
- **Scan shader** — `onBeforeCompile` injects a travelling highlight ring + halo
  emanating from the current region's surface point.
- **Macro optics** — a second camera rendered into the panel via
  `setScissor` / `setViewport` (a genuine optical zoom of the same mesh), on a dark
  eyepiece field so the lit cortex pops.
- **HUD** — 7 cortical regions cycle with a typewritten Latin name, live EEG,
  ACT/OXY/SNR meters (with a "hot" warn state), MNI coordinates, a raycast-anchored
  reticle + leader line that fades by surface facing, and a capture flash.
- **Audio** — ambient drone + noise bed + per-region whoosh + EEG-synced blips,
  behind the SOUND toggle. Honours `prefers-reduced-motion`.

No build step, no bundler, no asset files — the brain is procedural.
