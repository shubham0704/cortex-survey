# Open questions

Living backlog. Each item links to the research note that explores it and, once
resolved, the ADR that closes it.

## Answered
- **What does Neurocomic teach, and which illustrations beat the heart scanner?**
  The brain is a world to enter, not a specimen to scan; the Cajal neuron forest is
  the hero image. → `research/2026-07-14-neurocomic-lessons.md`
- **What data structure zooms across scales with correct precision?**
  Lazy scale-stack (inter-level) + octree (intra-level) + floating origin
  (precision). → `research/2026-07-14-multiscale-zoom-data-structure.md`, `adr/0002`,
  `adr/0003`
- **Descent, step 1 — does a real macro-window descent (cortex → Cajal forest) work?**
  Yes. The macro optics window drills from the cortex zoom into a procedural neuron
  forest, seeded per region, via the 2-level scale-stack + per-level frames. →
  `research/2026-07-14-forest-descent.md`, `src/levels/forest.js`
- **Cross-fade mechanic** — a *through-dark opacity hand-off* (only one level rendered
  at a time; both fade to the eyepiece dark at the z = 0.5 seam). →
  `research/2026-07-14-forest-descent.md`
- **The synapse level — does the descent go a third scale deeper?**
  Yes. z now runs [0,2] over three levels (brain → forest → synapse) with dark seams at
  0.5 and 1.5; the synapse releases vesicles across the cleft to postsynaptic receptors. →
  `research/2026-07-15-synapse-level.md`, `src/levels/synapse.js`

## Open
- **Fold realism** — the gyri read as brain but still a touch generic; try worley
  (cellular) noise or a sulcal-depth prior for more anatomical folds.
- **Ink / plate mode** — a Cajal black-and-white render toggle beside the photoreal
  specimen (more authored, more iconic).
- **Credibility** — does a stylized procedural specimen hold up, or do we eventually
  want real MRI-derived geometry for the whole-brain level?
