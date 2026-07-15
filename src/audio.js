// Web Audio: ambient drone + noise bed, plus blip/whoosh events.
// Gated behind the SOUND button (browsers block autoplay). blip/whoosh
// self-guard on `sound`, so callers invoke them unconditionally.
const el = id => document.getElementById(id);
let ctx = null, master = null, sound = false;

function initAudio(){
  if(ctx) return; ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  const dg = ctx.createGain(); dg.gain.value = 0.09; dg.connect(master);
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(); o1.type = o2.type = 'sine'; o1.frequency.value = 55; o2.frequency.value = 55.4;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300; o1.connect(lp); o2.connect(lp); lp.connect(dg); o1.start(); o2.start();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), dd = buf.getChannelData(0); for(let i=0;i<dd.length;i++) dd[i] = (Math.random()*2 - 1) * 0.5;
  const nz = ctx.createBufferSource(); nz.buffer = buf; nz.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.7;
  const ng = ctx.createGain(); ng.gain.value = 0.01; nz.connect(bp); bp.connect(ng); ng.connect(master); nz.start();
}

export function blip(f, d, v){ if(!sound || !ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
  const t = ctx.currentTime; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(1e-4, t + d);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.02); }

export function whoosh(){ if(!sound || !ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle';
  const t = ctx.currentTime; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(280, t + 0.3);
  g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(1e-4, t + 0.34); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.36); }

el('audio-btn').addEventListener('click', function(){ sound = !sound; this.setAttribute('aria-pressed', sound ? 'true' : 'false');
  if(sound){ initAudio(); if(ctx.state === 'suspended') ctx.resume(); master.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 0.5); }
  else if(ctx){ master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); } });
