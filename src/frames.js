import * as THREE from 'three';

// Per-level camera framing. In the minimal (2-level) descent each level is its own
// O(1)-scaled scene, so the camera is posed *within* that frame rather than in a
// giant shared coordinate space — the degenerate case of the floating origin in
// docs/adr/0002. Full re-rooting only becomes necessary once 3+ nested levels share
// one view.
const _look = new THREE.Vector3();

// Pose a camera descending into the forest: z in [0.5,1] dollies from far (survey the
// whole forest) to near (immersed). yaw/pitch orbit the forest (drag when deep); a slow
// auto-drift keeps it alive when idle.
export function descentCamera(camera, z, t, yaw = 0, pitch = 0){
  const k = Math.max(0, Math.min(1, (z - 0.5) / 0.5));
  const dist = 3.4 - k*1.5;
  const ay = yaw + Math.sin(t*0.05)*0.12;
  const ap = Math.max(-1.2, Math.min(1.2, pitch + Math.cos(t*0.04)*0.06));
  const cp = Math.cos(ap);
  camera.position.set(Math.sin(ay)*cp*dist, Math.sin(ap)*dist, Math.cos(ay)*cp*dist);
  _look.set(0, 0, 0);
  camera.lookAt(_look);
}
