// The descent for the macro window: the two-level slice of the scale-stack
// (cortex zoom <-> neuron forest) driven by a scalar z in [0,1] (0 = cortex,
// 1 = forest). Realizes docs/adr/0003 at two levels.
//
// Cross-fade mechanic (resolves an open question): a *through-dark opacity
// hand-off* — only one level is rendered at a time, and both fade to the dark
// eyepiece field at the z = 0.5 seam, reading as "descending through the tissue."
// See docs/research/2026-07-14-forest-descent.md.
export function smoothstep(a, b, x){ const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t*t*(3 - 2*t); }

export function createDescent(z0 = 0){
  let z = z0, dir = 1, hold = 0, held = false;
  function update(dt){
    if(held){ z = Math.min(1, z + dt/1000); }
    else if(dir > 0){ z += dt/2200; if(z >= 1){ z = 1; hold += dt; if(hold > 2600){ hold = 0; dir = -1; } } }
    else { z -= dt/2200; if(z <= 0){ z = 0; hold += dt; if(hold > 1600){ hold = 0; dir = 1; } } }
    return z;
  }
  return {
    update,
    setHeld(v){ held = v; if(!v) dir = -1; },
    get z(){ return z; },
    cortexFade(){ return smoothstep(0.5, 0.0, z); },
    forestFade(){ return smoothstep(0.5, 1.0, z); }
  };
}
