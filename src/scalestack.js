// The descent: the two-level slice of the scale-stack (brain <-> neuron forest)
// driven by a scalar z in [0,1] (0 = brain surface, 1 = deep in the forest).
// User-driven — scroll / pinch / keys nudge a target and z eases toward it; there
// is no auto-loop. Realizes docs/adr/0003 at two levels.
//
// Cross-fade mechanic (resolves an open question): a *through-dark opacity
// hand-off* — only one level is rendered at a time, and both fade to the dark
// eyepiece field at the z = 0.5 seam, reading as "descending through the tissue."
// See docs/research/2026-07-14-forest-descent.md.
export function smoothstep(a, b, x){ const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t*t*(3 - 2*t); }

export function createDescent(z0 = 0){
  let z = z0, target = z0, held = false;
  const c = v => Math.max(0, Math.min(1, v));
  return {
    update(dt){
      if(held) z += (1 - z) * Math.min(1, dt/300);               // snap to the forest and stay
      else z += (target - z) * Math.min(1, dt/150);              // ease toward the user's target
      z = c(z); return z;
    },
    nudge(dz){ held = false; target = c(target + dz); },         // scroll / pinch / keys
    setTarget(v){ held = false; target = c(v); },
    setHeld(v){ held = v; if(!v) target = z; },                  // #forest deep-link
    get z(){ return z; },
    cortexFade(){ return smoothstep(0.5, 0.0, z); },
    forestFade(){ return smoothstep(0.5, 1.0, z); }
  };
}
