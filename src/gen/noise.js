// Value noise + derived fields. Pure functions, no dependencies.
// The gyral field here is what gives the cortex its folds; higher-frequency
// octaves are where per-scale detail will "switch on" during the descent.
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function hash3(x, y, z){ let n = Math.sin(x*127.1 + y*311.7 + z*74.7) * 43758.5453; return n - Math.floor(n); }
function fade(t){ return t*t*t*(t*(t*6 - 15) + 10); }

export function vnoise(x, y, z){
  const xi=Math.floor(x), yi=Math.floor(y), zi=Math.floor(z), xf=x-xi, yf=y-yi, zf=z-zi;
  const u=fade(xf), v=fade(yf), w=fade(zf);
  function L(a, b, t){ return a + (b - a) * t; }
  const c000=hash3(xi,yi,zi), c100=hash3(xi+1,yi,zi), c010=hash3(xi,yi+1,zi), c110=hash3(xi+1,yi+1,zi),
        c001=hash3(xi,yi,zi+1), c101=hash3(xi+1,yi,zi+1), c011=hash3(xi,yi+1,zi+1), c111=hash3(xi+1,yi+1,zi+1);
  return L(L(L(c000,c100,u), L(c010,c110,u), v), L(L(c001,c101,u), L(c011,c111,u), v), w);
}

export function fbm3(x, y, z, oct, freq){
  let a=0, amp=0.5, f=freq, nn=0;
  for(let i=0;i<oct;i++){ a += amp * vnoise(x*f, y*f, z*f); nn += amp; amp *= 0.5; f *= 2.0; }
  return a / nn;
}

// gyral field: domain-warped ridge network -> meandering cortical folds (0..1, high = gyral crown)
export function gyri(x, y, z){
  const wx=fbm3(x+3.1,y-2.7,z,2,1.7)-0.5, wy=fbm3(x-5.3,y+4.1,z,2,1.7)-0.5, wz=fbm3(x,y,z+7.9,2,1.7)-0.5;
  const s=0.66, qx=x+s*wx, qy=y+s*wy, qz=z+s*wz;
  const v=fbm3(qx, qy, qz, 3, 6.1);
  const r=1.0 - Math.abs(2.0*v - 1.0);
  return Math.pow(clamp(r,0,1), 0.7);   // narrow deep sulci, broad gyral crowns
}

export function folia(x, y, z){ const f=fbm3(x*1.0, y*4.6, z*1.0, 3, 4.2); return 1.0 - Math.abs(2.0*f - 1.0); }
