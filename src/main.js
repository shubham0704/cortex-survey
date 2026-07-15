import * as THREE from 'three';
import { renderer, scene, camera } from './scene.js';
import { uScanPoint, uScanTime, uInk } from './scan-shader.js';
import { buildBrain } from './levels/brain.js';
import { blip } from './audio.js';
import * as hud from './hud.js';
import { clamp } from './gen/noise.js';
import { buildForest } from './levels/forest.js';
import { buildSynapse } from './levels/synapse.js';
import { createDescent } from './scalestack.js';
import { createLocator } from './locator.js';

// Bootstrap + render loop. Owns the descent path state (currently a single
// level: scanIdx cycles the survey regions) and the frame's 3D->screen math.
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = id => document.getElementById(id);

const brain = buildBrain();
scene.add(brain.group);
const REGIONS = brain.REGIONS;

// descent: scroll / pinch / +- keys drive a full-screen dive brain -> neuron forest ->
// synapse (z in [0,2]: 0 = brain, 1 = forest, 2 = synapse).
const forest = buildForest();
const synapse = buildSynapse();
const locator = createLocator(el('macro-canvas'));
const z0 = location.hash === '#synapse' ? 2 : location.hash === '#forest' ? 1 : 0;  // deep-links
const deepLink = z0 > 0;
const descent = createDescent(z0);

const hint = el('hint');
let interacted = deepLink;
function grab(){ if(!interacted){ interacted = true; if(hint) hint.classList.add('gone'); } }
addEventListener('wheel', (e) => {                                // trackpad scroll; ctrl+wheel = pinch
  e.preventDefault(); grab();
  descent.nudge(clamp(-e.deltaY * (e.ctrlKey ? 0.010 : 0.0016), -0.12, 0.12));
}, { passive: false });
addEventListener('keydown', (e) => {
  if(e.key === '+' || e.key === '=' || e.key === 'ArrowUp'){ grab(); descent.nudge(0.09); }
  else if(e.key === '-' || e.key === '_' || e.key === 'ArrowDown'){ grab(); descent.nudge(-0.09); }
});
let gScale = 1;                                                   // Safari pinch (gesture events)
addEventListener('gesturestart', (e) => { e.preventDefault(); gScale = e.scale; });
addEventListener('gesturechange', (e) => { e.preventDefault(); grab(); descent.nudge((e.scale - gScale) * 1.3); gScale = e.scale; });

// drag to rotate the brain — turn a region to the front, then scroll to dive into it
const gl = el('gl');
let dragging = false, dragX = 0, dragY = 0, rotY = -0.35, rotX = 0, manualRot = false, manualRegion = false, orbitYaw = 0, orbitPitch = 0;
gl.addEventListener('pointerdown', (e) => {
  dragging = true; manualRot = true; manualRegion = true; grab();
  dragX = e.clientX; dragY = e.clientY;
});
addEventListener('pointermove', (e) => {
  if(!dragging) return;
  const dx = e.clientX - dragX, dy = e.clientY - dragY;
  dragX = e.clientX; dragY = e.clientY;
  if(descent.z > 0.5){                                            // deep: orbit the forest / synapse
    orbitYaw += dx * 0.006;
    orbitPitch = clamp(orbitPitch + dy * 0.006, -1.1, 1.1);
  } else {                                                        // surface: rotate the brain
    rotY += dx * 0.006;
    rotX = clamp(rotX + dy * 0.006, -0.7, 0.7);
  }
});
addEventListener('pointerup', () => { dragging = false; });
addEventListener('pointercancel', () => { dragging = false; });

// PLATE toggle — flip the whole survey to Cajal sepia-on-cream ink (brain via the
// shader luminance remap, forest + synapse to dark ink, ground/HUD/veil via CSS)
let plate = false;
const inkBtn = el('ink-btn');
inkBtn.addEventListener('click', () => {
  plate = !plate;
  document.documentElement.classList.toggle('plate', plate);
  inkBtn.setAttribute('aria-pressed', String(plate));
  uInk.value = plate ? 1 : 0;
  forest.setInk(plate);
  synapse.setInk(plate);
});

const wA = new THREE.Vector3(), wN = new THREE.Vector3(), proj = new THREE.Vector3(), camDir = new THREE.Vector3(), tmpN = new THREE.Vector3();
let scanIdx = 0, tick = 0, last = 0, regionTimer = 0, regionPickTimer = 0, beatTimer = 0, started = 0, baseCamZ = 5.4;

// the region currently turned toward the camera (used once you take manual control)
function frontMostRegion(){
  camera.getWorldDirection(camDir);
  let best = -2, bi = scanIdx, cur = -2;
  for(let i = 0; i < REGIONS.length; i++){
    tmpN.copy(REGIONS[i].lnormal).transformDirection(REGIONS[i].host.matrixWorld);
    const f = -tmpN.dot(camDir);
    if(i === scanIdx) cur = f;
    if(f > best){ best = f; bi = i; }
  }
  return best > cur + 0.06 ? bi : scanIdx;                        // hysteresis: switch only if clearly more front
}

function resize(){
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // frame the brain so it fits both dimensions (pull back on portrait screens)
  const vfov = camera.fov*Math.PI/180, brainR = 1.16;
  const distV = brainR/Math.tan(vfov/2), distH = distV/camera.aspect;
  baseCamZ = Math.max(distV, distH)*1.34;
  camera.position.set(0.15, 0.35, baseCamZ);
  camera.updateProjectionMatrix(); hud.sizeEEG(); hud.buildOverlay(); locator.size();
}
addEventListener('resize', resize);

function frame(ts){
  if(!started) started = ts; const t = (ts - started)/1000; const dt = Math.min(50, ts - last); last = ts;
  uScanTime.value = t;
  const z = descent.update(dt);
  forest.update(t, z, orbitYaw, orbitPitch);
  synapse.update(t, z, orbitYaw, orbitPitch);

  // rotation: manual (drag) holds where you leave it; otherwise auto-rotate, damped as we dive
  if(!REDUCED){
    if(manualRot){ brain.group.rotation.y = rotY; brain.group.rotation.x = rotX; }
    else { const rot = 1 - clamp(z*2.6, 0, 1);
      brain.group.rotation.y = -0.35 + Math.sin(t*0.12)*0.42*rot;
      brain.group.rotation.x = Math.sin(t*0.09)*0.06*rot; }
  }
  brain.group.updateWorldMatrix(false, true);

  hud.tickTypewriter(dt);
  beatTimer += dt; if(beatTimer >= 1150){ beatTimer -= 1150; blip(240 + scanIdx*18, 0.16, 0.045); }

  // region selection — auto-cycle until you take control (drag), then whichever region
  // you turn to the front (facing the camera) becomes the active one
  if(manualRegion){
    regionPickTimer += dt;
    if(z < 0.4 && regionPickTimer > 120){ regionPickTimer = 0;
      const bi = frontMostRegion();
      if(bi !== scanIdx){ scanIdx = bi; tick++; hud.setRegion(scanIdx, REGIONS, tick); forest.reseed(scanIdx); synapse.reseed(scanIdx); }
    }
  } else {
    regionTimer += dt; if(regionTimer >= 5200){ regionTimer = 0; tick++; scanIdx = (scanIdx + 1) % REGIONS.length; hud.setRegion(scanIdx, REGIONS, tick); forest.reseed(scanIdx); synapse.reseed(scanIdx); }
  }

  // current anchor world-space (matrices updated above)
  const R = REGIONS[scanIdx];
  wA.copy(R.local).applyMatrix4(R.host.matrixWorld);
  wN.copy(R.lnormal).transformDirection(R.host.matrixWorld);
  uScanPoint.value.copy(wA);

  // MAIN view — the dive: brain (z<0.5) -> neuron forest (0.5..1.5) -> synapse (z>1.5),
  // each pair handed off through a full-screen dark veil at z = 0.5 and z = 1.5.
  renderer.setScissorTest(false); renderer.setClearColor(0x000000, 0); renderer.setViewport(0, 0, innerWidth, innerHeight);
  if(z < 0.5){
    camera.position.set(0.15, 0.35, baseCamZ - clamp(z/0.5, 0, 1)*(baseCamZ - 1.5)); // dolly straight in
    renderer.render(scene, camera);
  } else if(z < 1.5){
    forest.camera.aspect = innerWidth/innerHeight; forest.camera.updateProjectionMatrix();
    renderer.render(forest.scene, forest.camera);
  } else {
    synapse.camera.aspect = innerWidth/innerHeight; synapse.camera.updateProjectionMatrix();
    renderer.render(synapse.scene, synapse.camera);
  }
  const veil = Math.max(1 - clamp(Math.abs(z - 0.5)/0.18, 0, 1), 1 - clamp(Math.abs(z - 1.5)/0.18, 0, 1));
  el('veil').style.opacity = veil.toFixed(3);                                          // dark seams at 0.5 and 1.5

  // MACRO window — a scale-aware anatomical locator (2D atlas): brain -> column -> synapse
  locator.draw(z, scanIdx, REGIONS[scanIdx], t);

  // reticle + leader + contact shadow fade out as we leave the surface
  const surf = clamp(1 - z*2.6, 0, 1);
  el('overlay').style.opacity = surf.toFixed(2);
  el('shadow').style.opacity = surf.toFixed(2);
  if(surf > 0.01){
    camera.getWorldDirection(camDir);
    const facing = wN.dot(camDir);
    proj.copy(wA).project(camera);
    const [ow, oh] = hud.overlaySize();
    const sx = (proj.x*0.5 + 0.5)*ow, sy = (-proj.y*0.5 + 0.5)*oh;
    const vis = facing < -0.02 && proj.z < 1;
    const op = vis ? clamp((-facing)*2.2, 0.15, 1) : 0;
    hud.updateReticleLeader(sx, sy, op, t);
  }

  el('macro-mag').textContent = z < 0.5 ? 'ATLAS · LATERAL' : z < 1.5 ? 'COLUMN · I–VI' : 'SYNAPSE';
  el('scanstate').textContent = z > 1.55 ? 'SYNAPTIC CLEFT' : z > 0.55 ? 'NEURAL FIELD' : z > 0.06 ? 'DESCENDING…' : 'SCANNING…';

  hud.drawEEG(t*1000);
  const s = Math.floor(t); el('clock').textContent = [s/3600, s/60%60, s%60].map(n => ('0'+Math.floor(n)).slice(-2)).join(':');
  requestAnimationFrame(frame);
}

function boot(){
  resize(); brain.computeAnchors(); scanIdx = 0; hud.setRegion(0, REGIONS, tick);
  el('loader').classList.add('hide');
  requestAnimationFrame(frame);
}
// boot via timeout (not rAF, which pauses when the tab/iframe starts hidden)
setTimeout(boot, 30);
