import * as THREE from 'three';
import { seedFromPath, rng } from '../gen/seed.js';
import { descentCamera } from '../frames.js';

// Level 2: a Cajal forest of neurons — glowing dendritic trees on a dark eyepiece
// field, firing in rhythm, receding into fog. Its own O(1)-scaled scene + camera
// (see frames.js). Seeded per region so a given specimen always grows the same
// forest. The Neurocomic hero image, one scale below the cortex.
const INK    = new THREE.Color('#e9e3d5');
const TEAL   = new THREE.Color('#46e0c6');
const VIOLET = new THREE.Color('#a874ff');
// Cajal plate palette — dark sepia ink drawn on cream instead of glow on black
const PLATE_INK = new THREE.Color('#2a2016');
const PLATE_HOT = new THREE.Color('#6b4d24');
const PLATE_BG  = 0xe6dabd;

// soft radial dot so somata read as glowing cell bodies, not hard discs
function dotTexture(){
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.28, 'rgba(255,255,255,0.65)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function buildForest(){
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0c12, 0.26);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 40);
  const group = new THREE.Group(); scene.add(group);
  const dotTex = dotTexture();
  let neurons = [], ink = false;

  function clear(){
    for(const n of neurons){ n.lines.geometry.dispose(); n.lines.material.dispose(); n.soma.material.dispose(); }
    group.clear(); neurons = [];
  }

  // recursive dendrite: step along a jittering direction, then spawn child branches
  function branch(rand, pts, x, y, z, dx, dy, dz, len, depth){
    let m = Math.hypot(dx, dy, dz) || 1; dx/=m; dy/=m; dz/=m;
    const steps = 5; let cx=x, cy=y, cz=z;
    for(let i=0;i<steps;i++){
      const nx = cx + dx*len/steps, ny = cy + dy*len/steps, nz = cz + dz*len/steps;
      pts.push(cx, cy, cz, nx, ny, nz);
      cx=nx; cy=ny; cz=nz;
      dx += (rand()-0.5)*0.45; dy += (rand()-0.5)*0.32; dz += (rand()-0.5)*0.45;
      m = Math.hypot(dx, dy, dz) || 1; dx/=m; dy/=m; dz/=m;
    }
    if(depth <= 0 || len < 0.1) return;
    const nb = depth > 2 ? 3 : 2;
    for(let b=0;b<nb;b++){
      const a = (b/nb - 0.4)*1.6;
      branch(rand, pts, cx, cy, cz, dx + Math.cos(a)*0.6, dy + 0.1, dz + Math.sin(a)*0.6, len*0.64, depth-1);
    }
  }

  function makeNeuron(rand){
    const pts = [];
    const px = (rand()*2-1)*1.3, py = (rand()*2-1)*1.0, pz = (rand()*2-1)*1.1;
    branch(rand, pts, px, py, pz, (rand()-0.5)*0.3, 1, (rand()-0.5)*0.3, 0.65 + rand()*0.35, 4);       // apical + tuft
    const nb = 4 + Math.floor(rand()*3);
    for(let b=0;b<nb;b++){ const a = (b/nb)*Math.PI*2; branch(rand, pts, px, py, pz, Math.cos(a)*0.7, -0.15 - rand()*0.3, Math.sin(a)*0.7, 0.28 + rand()*0.22, 3); } // basal
    branch(rand, pts, px, py, pz, (rand()-0.5)*0.2, -1, (rand()-0.5)*0.2, 0.9 + rand()*0.5, 2);         // axon

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const hot = rand() < 0.5 ? TEAL : VIOLET;
    const base = INK.clone().lerp(hot, 0.15).multiplyScalar(0.7);
    const blend = ink ? THREE.NormalBlending : THREE.AdditiveBlending;
    const mat = new THREE.LineBasicMaterial({ color: base.clone(), transparent: true, opacity: 0.9, blending: blend, depthWrite: false });
    const lines = new THREE.LineSegments(g, mat);

    const soma = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: INK.clone(), transparent: true, blending: blend, depthWrite: false }));
    soma.position.set(px, py, pz);
    group.add(lines, soma);
    return { lines, mat, soma, base, hot, phase: rand()*6.28, rate: 0.5 + rand()*1.4, sz: 0.12 + rand()*0.06 };
  }

  function reseed(regionIndex){
    clear();
    const rand = rng(seedFromPath([regionIndex, 91]));
    const N = 9 + Math.floor(rand()*4);
    for(let i=0;i<N;i++) neurons.push(makeNeuron(rand));
  }

  // animate firing (half-wave envelope per neuron) + dolly the camera by descent z
  function update(t, z, yaw, pitch){
    descentCamera(camera, z, t, yaw, pitch);
    for(const n of neurons){
      const fire = Math.max(0, Math.sin(t*n.rate + n.phase));
      if(ink){                                                     // Cajal plate: static-ish dark ink, faint firing
        n.mat.color.copy(PLATE_INK).lerp(PLATE_HOT, fire*0.45);
        n.soma.scale.setScalar(n.sz * (1 + fire*0.5));
        n.soma.material.color.copy(PLATE_INK).lerp(PLATE_HOT, 0.25 + fire*0.4);
      } else {                                                     // eyepiece glow on black
        n.mat.color.copy(n.base).lerp(n.hot, fire*0.6).multiplyScalar(0.6 + fire*fire*1.3);
        n.soma.scale.setScalar(n.sz * (1 + fire*1.1));
        n.soma.material.color.copy(INK).lerp(n.hot, 0.3 + fire*0.5).multiplyScalar(0.5 + fire*0.9);
      }
    }
  }

  // switch the whole field between glow-on-black and Cajal ink-on-cream
  function setInk(on){
    ink = on;
    scene.fog.color.set(on ? PLATE_BG : 0x0a0c12);
    const blend = on ? THREE.NormalBlending : THREE.AdditiveBlending;
    for(const n of neurons){
      n.mat.blending = blend; n.mat.needsUpdate = true;
      n.soma.material.blending = blend; n.soma.material.needsUpdate = true;
    }
  }

  reseed(0);
  return { scene, camera, reseed, update, setInk };
}
