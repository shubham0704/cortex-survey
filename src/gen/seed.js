// Deterministic path -> seed hashing + a small PRNG, so a given descent path always
// regenerates the same forest (stable on re-descent).
export function seedFromPath(ids){
  let h = 2166136261 >>> 0;
  for(const v of [].concat(ids)){ h = Math.imul(h ^ ((v >>> 0) || 0), 16777619); }
  return h >>> 0;
}

// mulberry32
export function rng(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
