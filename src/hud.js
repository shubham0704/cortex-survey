import { blip, whoosh } from './audio.js';
import { uScanColor } from './scan-shader.js';

// All DOM + 2D-canvas chrome: the survey panel (typewriter, meters, coords),
// the live EEG, and the SVG reticle/leader. main.js feeds it time + projected
// screen positions; this module owns no 3D state.
const el = id => document.getElementById(id);

const specCount = el('spec-count'), specName = el('spec-name').querySelector('.txt'),
      specDesc = el('spec-desc'), pos = el('pos'), scanid = el('scanid'),
      macroMag = el('macro-mag'), macroDepth = el('macro-depth'), flash = el('macro-flash'),
      fills = [...document.querySelectorAll('.meter')];
let twT = 0, twTarget = '';

function meter(k, v){ const m = fills.find(x => x.dataset.k === k); m.querySelector('.fill').style.width = Math.round(v*100)+'%'; m.querySelector('.val').textContent = v.toFixed(2); m.classList.toggle('hot', v > 0.82); }

export function setRegion(i, REGIONS, tick){
  const R = REGIONS[i];
  specCount.textContent = 'SPECIMEN 0'+(i+1)+' / 0'+REGIONS.length;
  twTarget = R.name; specName.textContent = ''; twT = 0;
  specDesc.textContent = R.desc;
  meter('ACT', R.m[0]); meter('OXY', R.m[1]); meter('SNR', R.m[2]);
  pos.textContent = R.pos; scanid.textContent = 'Ø '+(7000 + i*617 + tick*13).toString().slice(0,5);
  macroMag.textContent = 'MAG '+R.mag; macroDepth.textContent = 'Z '+(0.2 + 0.18*R.m[2]).toFixed(3);
  uScanColor.value.set(R.col === 'a' ? '#46e0c6' : '#a874ff');
  flash.style.transition = 'none'; flash.style.opacity = '0.85';
  setTimeout(() => { flash.style.transition = 'opacity .55s'; flash.style.opacity = '0'; }, 40);
  whoosh();
}

export function tickTypewriter(dt){
  if(specName.textContent.length < twTarget.length){
    twT += dt;
    if(twT > 42){ twT = 0; specName.textContent = twTarget.slice(0, specName.textContent.length + 1); blip(1400, 0.03, 0.02); }
  }
}

// ---- EEG ----
const eeg = el('eeg'), ectx = eeg.getContext('2d'); let EW, EH;
export function sizeEEG(){ const r = eeg.getBoundingClientRect(), dp = Math.min(2, devicePixelRatio || 1);
  eeg.width = Math.max(1, r.width*dp); eeg.height = Math.max(1, r.height*dp); EW = eeg.width; EH = eeg.height; }
export function drawEEG(t){
  if(!EW) return; ectx.clearRect(0, 0, EW, EH); const mid = EH*0.5, sp = t*0.09;
  ectx.strokeStyle = 'rgba(154,160,154,0.18)'; ectx.lineWidth = 1; ectx.beginPath(); ectx.moveTo(0, mid); ectx.lineTo(EW, mid); ectx.stroke();
  ectx.strokeStyle = 'rgba(154,160,154,0.5)'; ectx.lineWidth = 1;
  for(let c=0;c<2;c++){ ectx.beginPath(); for(let x=0;x<EW;x+=2){ const tt = x - sp*(0.7+c*0.2) - c*30;
    const v = Math.sin(tt*0.05+c)*0.4 + Math.sin(tt*0.017)*0.5*Math.max(0, Math.sin(tt*0.006+c)); const y = mid + v*EH*0.15 + (c?1:-1)*EH*0.16;
    x ? ectx.lineTo(x, y) : ectx.moveTo(x, y); } ectx.stroke(); }
  const gr = ectx.createLinearGradient(0, 0, EW, 0); gr.addColorStop(0, '#46e0c6'); gr.addColorStop(1, '#a874ff');
  ectx.strokeStyle = gr; ectx.lineWidth = 1.6*Math.min(2, devicePixelRatio || 1); ectx.shadowColor = '#46e0c6'; ectx.shadowBlur = 7; ectx.beginPath();
  for(let x=0;x<EW;x+=1.5){ const tt = x - sp, a = Math.max(0, Math.sin(tt*0.006));
    const v = Math.sin(tt*0.055)*0.42*a + Math.sin(tt*0.14)*0.12 + Math.sin(tt*0.02)*0.22; const y = mid - v*EH*0.34; x ? ectx.lineTo(x, y) : ectx.moveTo(x, y); } ectx.stroke(); ectx.shadowBlur = 0;
  ectx.strokeStyle = 'rgba(154,160,154,0.4)'; ectx.beginPath(); ectx.moveTo(EW-6, 3); ectx.lineTo(EW-6, EH-3); ectx.stroke();
}

// ---- overlay reticle + leader ----
const NS = 'http://www.w3.org/2000/svg', ov = el('overlay');
let retG, leader, ldotA, ldotB;
function dot(r, f){ const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', r); c.setAttribute('fill', f); return c; }
export function buildOverlay(){
  ov.innerHTML = ''; const w = ov.clientWidth, h = ov.clientHeight; ov.setAttribute('viewBox', '0 0 '+w+' '+h);
  leader = document.createElementNS(NS, 'polyline'); leader.setAttribute('fill', 'none'); leader.setAttribute('stroke', 'rgba(154,160,154,0.55)');
  leader.setAttribute('stroke-width', '1'); leader.setAttribute('stroke-dasharray', '1 4'); ov.appendChild(leader);
  ldotA = dot(3, 'rgba(154,160,154,0.8)'); ldotB = dot(2.5, '#46e0c6'); ov.appendChild(ldotA); ov.appendChild(ldotB);
  retG = document.createElementNS(NS, 'g'); ov.appendChild(retG);
  const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', '22'); c.setAttribute('fill', 'none'); c.setAttribute('stroke', '#46e0c6');
  c.setAttribute('stroke-width', '1'); c.setAttribute('stroke-dasharray', '26 10'); retG.appendChild(c); retG._c = c;
  ['M -30 0 L -18 0','M 30 0 L 18 0','M 0 -30 L 0 -18','M 0 30 L 0 18'].forEach(d => { const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d); p.setAttribute('stroke', '#46e0c6'); p.setAttribute('stroke-width', '1'); retG.appendChild(p); });
  const dc = document.createElementNS(NS, 'circle'); dc.setAttribute('r', '2'); dc.setAttribute('fill', '#f1e8ff'); retG.appendChild(dc);
}

export function overlaySize(){ return [ov.clientWidth, ov.clientHeight]; }

export function updateReticleLeader(sx, sy, op, t){
  if(!retG) return;
  retG.setAttribute('opacity', op.toFixed(2)); retG.setAttribute('transform', 'translate('+sx+','+sy+') rotate('+((t*24)%360)+')');
  retG._c.setAttribute('r', 20 + Math.sin(t*3.2)*3);
  const sr = el('survey').getBoundingClientRect(), or = ov.getBoundingClientRect();
  const ax = sr.right - or.left, ay = sr.top - or.top + sr.height*0.5;
  leader.setAttribute('opacity', op.toFixed(2)); ldotA.setAttribute('opacity', op); ldotB.setAttribute('opacity', op);
  leader.setAttribute('points', ax+','+ay+' '+(ax+26)+','+ay+' '+((ax+sx)/2)+','+ay+' '+(sx-28)+','+sy+' '+(sx-24)+','+sy);
  ldotA.setAttribute('cx', ax); ldotA.setAttribute('cy', ay); ldotB.setAttribute('cx', sx); ldotB.setAttribute('cy', sy);
}
