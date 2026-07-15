// Floating-origin frame math: re-root the scene at the current focus on each
// descent so coordinates stay O(1) across scales (avoids the float-precision wall).
// See docs/adr/0002 and docs/research/2026-07-14-multiscale-zoom-data-structure.md.
// Status: planned. The app is single-scale today; this lands with the descent.
export function reRoot(/* scene, focusWorldPos, scaleFactor */){ /* TODO */ }
