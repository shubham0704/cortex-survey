import * as THREE from 'three';
import { seedFromPath, rng } from '../gen/seed.js';
import { synapseCamera } from '../frames.js';

// Level 3 (deepest): a single synapse releasing. Vesicles fuse at the presynaptic
// membrane and neurotransmitter crosses the cleft to light up postsynaptic receptors
// — the molecular handshake made visible, one scale below the neuron forest.
const VES = new THREE.Color(0xbfeee6);   // vesicle / transmitter pale
const HOT = new THREE.Color(0xf1e8ff);   // firing flash

function dotTexture(){
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.28, 'rgba(255,255,255,0.6)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
function sprite(tex, color, size){
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color(color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(size); return s;
}

export function buildSynapse(){
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0c12, 0.16);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 40);
  const dot = dotTexture();

  // presynaptic terminal — a glowing membrane bulb (top) + wire rim
  const pre = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 3),
    new THREE.MeshBasicMaterial({ color: 0x1f5f57, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false }));
  pre.position.set(0, 0.68, 0); scene.add(pre);
  const rim = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.6, 2)),
    new THREE.LineBasicMaterial({ color: 0x46e0c6, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }));
  rim.position.copy(pre.position); scene.add(rim);

  // vesicles inside the terminal, biased toward the release face
  const vesicles = [];
  for(let i = 0; i < 15; i++){
    const s = sprite(dot, VES, 0.12);
    s.userData = { home: new THREE.Vector3(), ph: Math.random()*6.28, fired: -9 };
    scene.add(s); vesicles.push(s);
  }

  // postsynaptic membrane — receptors in a gently curved band (bottom)
  const receptors = [];
  for(let i = 0; i < 13; i++) for(let j = 0; j < 3; j++){
    const x = (i/12 - 0.5)*1.6, zz = (j - 1)*0.42;
    const s = sprite(dot, 0x5a4d78, 0.09);
    s.position.set(x, -0.62 - Math.abs(x)*0.14 - Math.abs(zz)*0.1, zz);
    s.userData = { base: new THREE.Color(0x5a4d78), flash: -9 };
    scene.add(s); receptors.push(s);
  }

  // neurotransmitter particle pool
  const parts = [];
  for(let i = 0; i < 44; i++){
    const s = sprite(dot, 0xa874ff, 0.06); s.visible = false;
    s.userData = { origin: new THREE.Vector3(), vel: new THREE.Vector3(), birth: -9, target: null };
    scene.add(s); parts.push(s);
  }
  let pi = 0, lastRel = -1;

  function release(t){
    const v = vesicles[Math.floor(Math.random()*vesicles.length)];
    v.userData.fired = t;
    const ox = v.position.x, oz = v.position.z, burst = 10 + Math.floor(Math.random()*8);
    for(let b = 0; b < burst; b++){
      const s = parts[pi]; pi = (pi + 1) % parts.length;
      s.visible = true; s.userData.birth = t;
      s.userData.origin.set(ox + (Math.random()*2-1)*0.08, 0.12, oz + (Math.random()*2-1)*0.08);
      s.userData.vel.set((Math.random()*2-1)*0.55, -1.5 - Math.random()*0.5, (Math.random()*2-1)*0.55);
      s.userData.target = receptors[Math.floor(Math.random()*receptors.length)];
      s.position.copy(s.userData.origin);
    }
  }

  function update(t, z, yaw, pitch){
    synapseCamera(camera, z, t, yaw, pitch);
    const rf = Math.floor(t / 1.7);
    if(rf !== lastRel){ lastRel = rf; release(t); }

    for(const v of vesicles){
      const u = v.userData;
      v.position.set(u.home.x + Math.sin(t*0.8 + u.ph)*0.03, u.home.y + Math.cos(t*0.6 + u.ph)*0.03, u.home.z + Math.sin(t*0.5 + u.ph)*0.03);
      const e = t - u.fired, f = e >= 0 && e < 0.4 ? 1 - e/0.4 : 0;
      v.material.color.copy(VES).lerp(HOT, f); v.scale.setScalar(0.12 * (1 + f*0.9));
    }
    for(const s of parts){
      if(!s.visible) continue;
      const age = t - s.userData.birth;
      if(age > 0.75){ s.visible = false; continue; }
      s.position.copy(s.userData.origin).addScaledVector(s.userData.vel, age);
      s.material.opacity = 1 - age/0.75;
      if(s.userData.target && s.position.y < -0.55){ s.userData.target.userData.flash = t; s.userData.target = null; s.userData.birth = t - 0.75; }
    }
    for(const r of receptors){
      const e = t - r.userData.flash, f = e >= 0 && e < 0.55 ? 1 - e/0.55 : 0;
      r.material.color.copy(r.userData.base).lerp(HOT, f); r.scale.setScalar(0.09 * (1 + f*1.4));
    }
  }

  function reseed(regionIndex){
    const rand = rng(seedFromPath([regionIndex, 42]));
    for(const v of vesicles){ v.userData.home.set((rand()*2-1)*0.34, 0.55 + (rand()*2-1)*0.22, (rand()*2-1)*0.34); v.position.copy(v.userData.home); }
  }

  reseed(0);
  return { scene, camera, update, reseed };
}
