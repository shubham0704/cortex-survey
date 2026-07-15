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

## Open
- **Descent, step 1** — make the macro window an actual descent (cortical patch →
  Cajal forest) with the re-rooting frame. The smallest thing that proves the stack.
- **Cross-fade mechanic** — opacity blend vs geometry morph between adjacent levels.
- **Fold realism** — the gyri read as brain but still a touch generic; try worley
  (cellular) noise or a sulcal-depth prior for more anatomical folds.
- **Ink / plate mode** — a Cajal black-and-white render toggle beside the photoreal
  specimen (more authored, more iconic).
- **Credibility** — does a stylized procedural specimen hold up, or do we eventually
  want real MRI-derived geometry for the whole-brain level?
