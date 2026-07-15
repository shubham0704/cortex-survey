import * as THREE from 'three';

// Per-level camera framing. In the minimal (2-level) descent each level is its own
// O(1)-scaled scene, so the camera is posed *within* that frame rather than in a
// giant shared coordinate space — the degenerate case of the floating origin in
// docs/adr/0002. Full re-rooting only becomes necessary once 3+ nested levels share
// one view.
const _look = new THREE.Vector3();

// Pose a camera descending into the forest: z in [0.5,1] dollies from far (survey
// the whole forest) to near (immersed), with a slow drift for parallax / life.
export function descentCamera(camera, z, t){
  const k = Math.max(0, Math.min(1, (z - 0.5) / 0.5));
  const dist = 3.4 - k*1.5;
  const dx = Math.sin(t*0.18)*0.5, dy = Math.cos(t*0.13)*0.28;
  camera.position.set(dx, dy, dist);
  _look.set(dx*0.3, dy*0.3, 0);
  camera.lookAt(_look);
}
