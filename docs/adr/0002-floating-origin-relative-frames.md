# 0002 — Floating origin / relative frames for the descent

*Status: accepted (implementation planned) · 2026-07-14*

## Context
The descent spans ~6 orders of magnitude (brain → synapse). Single-precision float
(~7 digits) cannot represent synapse-scale coordinates relative to a brain-scale
origin — the result is jitter, z-fighting, and unusable camera control. Double
precision only delays the wall.

## Decision
Never compute absolute world coordinates. Keep the camera near the origin and
re-root the scene at the current level on each descent, composing only the transforms
along the active path and renormalizing scale to O(1). Frame math lives in
`src/frames.js`.

## Consequences
- Precision stays constant at every depth.
- Level transforms are relative-to-parent, not absolute — the scale-stack must
  compose them lazily.
- The existing anchor math (work in a mesh's local space, transform up per frame) is
  already compatible with this scheme.
