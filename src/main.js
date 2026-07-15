import * as THREE from 'three';
import { renderer, scene, camera, macroCam } from './scene.js';
import { uScanPoint, uScanTime } from './scan-shader.js';
import { buildBrain } from './levels/brain.js';
import { blip } from './audio.js';
import * as hud from './hud.js';
import { clamp } from './gen/noise.js';

// Bootstrap + render loop. Owns the descent path state (currently a single
// level: scanIdx cycles the survey regions) and the frame's 3D->screen math.
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = id => document.getElementById(id);

const brain = buildBrain();
scene.add(brain.group);
const REGIONS = brain.REGIONS;

const wA = new THREE.Vector3(), wN = new THREE.Vector3(), proj = new THREE.Vector3(), camDir = new THREE.Vector3();
let scanIdx = 0, tick = 0, last = 0, regionTimer = 0, beatTimer = 0, started = 0;

function resize(){
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // frame the brain so it fits both dimensions (pull back on portrait screens)
  const vfov = camera.fov*Math.PI/180, brainR = 1.16;
  const distV = brainR/Math.tan(vfov/2), distH = distV/camera.aspect;
  camera.position.set(0.15, 0.35, Math.max(distV, distH)*1.34);
  camera.updateProjectionMatrix(); hud.sizeEEG(); hud.buildOverlay();
}
addEventListener('resize', resize);

function frame(ts){
  if(!started) started = ts; const t = (ts - started)/1000; const dt = Math.min(50, ts - last); last = ts;
  uScanTime.value = t;
  if(!REDUCED){ brain.group.rotation.y = -0.35 + Math.sin(t*0.12)*0.42; brain.group.rotation.x = Math.sin(t*0.09)*0.06; }

  hud.tickTypewriter(dt);

  // current anchor world-space
  const R = REGIONS[scanIdx];
  R.host.updateWorldMatrix(true, false);
  wA.copy(R.local).applyMatrix4(R.host.matrixWorld);
  wN.copy(R.lnormal).transformDirection(R.host.matrixWorld);
  uScanPoint.value.copy(wA);

  // beat
  beatTimer += dt; if(beatTimer >= 1150){ beatTimer -= 1150; blip(240 + scanIdx*18, 0.16, 0.045); }
  // region cycle
  regionTimer += dt; if(regionTimer >= 5200){ regionTimer = 0; tick++; scanIdx = (scanIdx + 1) % REGIONS.length; hud.setRegion(scanIdx, REGIONS, tick); }

  // main render (transparent over CSS studio backdrop)
  renderer.setScissorTest(false); renderer.setClearColor(0x000000, 0); renderer.setViewport(0, 0, innerWidth, innerHeight); renderer.render(scene, camera);

  // macro render — second camera into the panel window, dark eyepiece field so lit cortex pops
  const mw = el('macro-window');
  if(mw && mw.offsetParent !== null){
    const r = mw.getBoundingClientRect(), y = innerHeight - r.bottom;
    // sit between the surface point and the main camera (guaranteed to see the lit front), zoomed
    const vdir = new THREE.Vector3().subVectors(camera.position, wA).normalize();
    macroCam.position.copy(wA).addScaledVector(vdir, 1.25);
    macroCam.lookAt(wA);
    macroCam.aspect = r.width/r.height; macroCam.updateProjectionMatrix();
    renderer.setScissorTest(true); renderer.setScissor(r.left, y, r.width, r.height); renderer.setViewport(r.left, y, r.width, r.height);
    renderer.toneMappingExposure = 0.72; renderer.setClearColor(0x0a0c12, 1); renderer.render(scene, macroCam);
    renderer.setClearColor(0x000000, 0); renderer.toneMappingExposure = 0.95;
    renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight);
  }

  // reticle + leader
  camera.getWorldDirection(camDir);
  const facing = wN.dot(camDir); // <0 means facing camera
  proj.copy(wA).project(camera);
  const [ow, oh] = hud.overlaySize();
  const sx = (proj.x*0.5 + 0.5)*ow, sy = (-proj.y*0.5 + 0.5)*oh;
  const vis = facing < -0.02 && proj.z < 1;
  const op = vis ? clamp((-facing)*2.2, 0.15, 1) : 0;
  hud.updateReticleLeader(sx, sy, op, t);

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
