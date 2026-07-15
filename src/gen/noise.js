// Value-noise fields. Now sourced from the shared anatomy-core (also used by vivo) so the
// procedural brain has one source of truth. Regenerate the vendored bundle from vivo with
// `npm run build:core`. This shim keeps the original import path stable for the rest of
// the app (main.js, levels/brain.js).
export { clamp, vnoise, fbm3, gyri, folia } from '../vendor/anatomy-core.js';
