# Encephalon — Neural Field Survey

A photoreal WebGL brain-specimen scanner, built as the brain counterpart to Daniel An's
`cardia-survey` heart demo. Same pipeline shape (Three.js + PBR studio lighting + a surface-scan
shader + a real second-camera macro zoom + raycast-anchored HUD), but the brain mesh is **generated
procedurally** — displaced, gyrified, welded for smooth normals — so there is **no 3D model file** to
ship. The folder is just this one page.

## Run it

It uses ES modules + an import map that pulls Three.js from a CDN, so it must be **served over
http(s)** — opening `index.html` as a `file://` URL will not work (same constraint as the heart demo).

```bash
# local
python3 -m http.server 8000
# then open http://localhost:8000/

# or host: drop this folder in a repo and enable GitHub Pages
```

## What's inside

- **Procedural brain** — icosphere → domain-warped ridge-network displacement (gyri/sulci) + a
  longitudinal fissure, welded via `mergeVertices` for smooth shading; separate cerebellum
  (fine foliation) and brainstem. Baked vertex-color AO darkens the sulci.
- **Studio render** — ACES Filmic tone mapping, PMREM `RoomEnvironment`, three-point lighting over a
  CSS seamless backdrop with a contact shadow. Light + dark themes.
- **Scan shader** — `onBeforeCompile` injects a travelling highlight ring + halo emanating from the
  current region's surface point (`uScanPoint` / `uScanColor`).
- **Macro optics** — a second camera rendered into the panel via `setScissor`/`setViewport` (a genuine
  optical zoom of the same mesh), on a dark eyepiece field so the lit cortex pops.
- **HUD** — 7 cortical regions cycle with a typewritten Latin name, live multi-band EEG, ACT/OXY/SNR
  meters (with a "hot" warn state), MNI coordinates, a raycast-anchored reticle + leader line that
  fades by surface facing, and a capture flash on region change.
- **Audio** — ambient drone + noise bed + per-region whoosh + EEG-synced blips, behind the SOUND
  toggle (top-right). Honors `prefers-reduced-motion`.

Single file, no build step, no assets.
