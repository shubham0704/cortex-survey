# 0003 — Lazy scale-stack; at most two levels live

*Status: accepted (implementation planned) · 2026-07-14*

## Context
We cannot hold every level at full detail across the whole brain — that is an
astronomically large octree. And transitions must feel continuous (the Neurocomic
descent), not hard cuts.

## Decision
A lazy hierarchical LOD tree. Instantiate only the level path currently being
descended. Zoom is a continuous log scalar; at any zoom at most two adjacent levels
are alive and are cross-faded on the fractional part. `THREE.LOD` is insufficient
(single-object distance swap), so hand-roll it in `src/scalestack.js`.

## Consequences
- Cost is bounded to ~2 levels regardless of depth.
- A level's content is generated on entry (deterministic, path-seeded) and can be
  discarded on exit.
- Sibling levels collapse to impostors for context.
