// The macro-optics window as a scale-aware anatomical locator — the traditional way
// to show *where* you are, not a texture crop. Swaps schematic by descent level:
// lateral brain atlas (surface) -> cortical column, layers I-VI (forest) -> synapse
// diagram (synapse). Pure 2D canvas, theme + ink aware via CSS variables.
const DW = 1000, DH = 760;

// lateral-view brain silhouette (facing left), fissures, and the survey-point atlas
const CEREBRUM = [['M',176,392],['C',150,298,196,214,292,192],['C',420,150,586,150,690,182],['C',794,210,864,262,872,342],['C',878,398,862,436,834,456],['C',806,506,748,522,676,514],['C',636,556,556,566,486,548],['C',430,536,392,516,360,498],['C',322,478,286,472,254,468],['C',214,452,182,436,176,392],['Z']];
const CEREBELLUM = [['M',770,470],['C',840,470,902,506,900,556],['C',898,602,846,626,792,618],['C',742,610,712,576,716,534],['C',720,498,740,472,770,470],['Z']];
const BRAINSTEM = [['M',694,516],['C',686,560,682,612,690,662],['C',694,690,720,700,732,688],['C',742,676,742,616,748,566],['C',750,536,742,520,724,514],['C',712,510,700,510,694,516],['Z']];
const SYLVIAN = [['M',300,432],['C',420,472,560,462,706,408]];
const CENTRAL = [['M',552,196],['C',540,300,548,362,560,432]];
// one atlas point per survey region (same order as brain.REGIONS)
const RT = [[306,250],[520,208],[664,244],[470,492],[822,380],[812,546],[712,602]];

export function createLocator(canvas){
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1;
  const css = (n, fb) => (getComputedStyle(canvas).getPropertyValue(n).trim() || fb);

  function size(){
    const r = canvas.getBoundingClientRect(), dp = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(r.width*dp)); canvas.height = Math.max(1, Math.round(r.height*dp));
    W = canvas.width; H = canvas.height;
  }
  function fit(){ const s = Math.min(W/DW, H/DH)*0.84; return { s, ox: (W - DW*s)/2, oy: (H - DH*s)/2 }; }
  function P(cmds, f){
    const p = new Path2D();
    for(const c of cmds){
      if(c[0] === 'M') p.moveTo(f.ox + c[1]*f.s, f.oy + c[2]*f.s);
      else if(c[0] === 'C') p.bezierCurveTo(f.ox+c[1]*f.s, f.oy+c[2]*f.s, f.ox+c[3]*f.s, f.oy+c[4]*f.s, f.ox+c[5]*f.s, f.oy+c[6]*f.s);
      else if(c[0] === 'Z') p.closePath();
    }
    return p;
  }
  const label = (s, x, y, col, size, anchor='left') => {
    ctx.font = (size*Math.min(2, devicePixelRatio||1)) + 'px ui-monospace, "SF Mono", Menlo, monospace';
    ctx.fillStyle = col; ctx.textAlign = anchor; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y);
  };

  function brain(regionIndex, region, t){
    const f = fit(), ink = css('--ink', '#e7e9e4'), dim = css('--ink-dim', '#9aa09a'), acc = css('--accent', '#46e0c6');
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.strokeStyle = ink; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.6*f.s;
    ctx.stroke(P(BRAINSTEM, f)); ctx.stroke(P(CEREBELLUM, f)); ctx.stroke(P(CEREBRUM, f));
    ctx.globalAlpha = 0.62; ctx.lineWidth = 1.2*f.s; ctx.strokeStyle = dim;
    ctx.stroke(P(SYLVIAN, f)); ctx.stroke(P(CENTRAL, f));
    ctx.globalAlpha = 1;
    // atlas points, active one lit
    for(let i = 0; i < RT.length; i++){
      const x = f.ox + RT[i][0]*f.s, y = f.oy + RT[i][1]*f.s, on = i === regionIndex;
      ctx.beginPath(); ctx.arc(x, y, (on ? 3 : 2)*f.s, 0, 7);
      ctx.fillStyle = on ? acc : dim; ctx.globalAlpha = on ? 1 : 0.5; ctx.fill(); ctx.globalAlpha = 1;
      if(on){
        const pr = (3 + (Math.sin(t*3.4)*0.5+0.5)*7)*f.s;
        ctx.beginPath(); ctx.arc(x, y, pr, 0, 7); ctx.strokeStyle = acc; ctx.lineWidth = 1.2*f.s; ctx.globalAlpha = 0.6; ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
    if(region) label(region.name.toUpperCase(), 10*f.s, H - 12*f.s, acc, 8.5);
  }

  function column(region, t){
    const ink = css('--ink', '#e7e9e4'), dim = css('--ink-dim', '#9aa09a'), acc = css('--accent', '#46e0c6');
    const x0 = W*0.36, x1 = W*0.64, y0 = H*0.12, y1 = H*0.9, span = y1 - y0;
    const names = ['I', 'II', 'III', 'IV', 'V', 'VI'], frac = [0.09, 0.13, 0.22, 0.14, 0.24, 0.18];
    ctx.strokeStyle = ink; ctx.globalAlpha = 0.4; ctx.lineWidth = 1.2; ctx.strokeRect(x0, y0, x1 - x0, span);
    let y = y0;
    for(let i = 0; i < 6; i++){
      const h = frac[i]*span, act = i === 4;                     // layer V — pyramidal
      if(act){ ctx.fillStyle = acc; ctx.globalAlpha = 0.1; ctx.fillRect(x0, y, x1 - x0, h); }
      ctx.globalAlpha = 0.3; ctx.strokeStyle = dim; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      label(names[i], x1 + 8, y + h*0.5 + 4, act ? acc : dim, 8);
      if(i === 2 || i === 4){                                    // a pyramidal glyph
        const cx = (x0 + x1)/2, cy = y + h*0.6, r = Math.min(14, h*0.3);
        ctx.globalAlpha = 1; ctx.strokeStyle = act ? acc : ink; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx - r*0.7, cy); ctx.lineTo(cx + r*0.7, cy); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, y0 + 4); ctx.stroke();       // apical dendrite up
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + r*1.4); ctx.stroke();        // axon down
      }
      y += h;
    }
    ctx.globalAlpha = 1;
    label('CORTICAL COLUMN', 10, H - 12, acc, 8.5);
  }

  function synapse(t){
    const ink = css('--ink', '#e7e9e4'), dim = css('--ink-dim', '#9aa09a'), acc = css('--accent', '#46e0c6'), vio = css('--accent-2', '#a874ff');
    const cx = W*0.5;
    // presynaptic bouton (top)
    ctx.strokeStyle = ink; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.ellipse(cx, H*0.24, W*0.26, H*0.16, 0, 0, 7); ctx.stroke();
    for(let i = 0; i < 6; i++){                                   // vesicles
      const a = i/6*6.28, vx = cx + Math.cos(a)*W*0.12, vy = H*0.24 + Math.sin(a)*H*0.07;
      ctx.beginPath(); ctx.arc(vx, vy, 3, 0, 7); ctx.strokeStyle = acc; ctx.globalAlpha = 0.7; ctx.stroke();
    }
    // cleft — transmitter crossing
    ctx.globalAlpha = 0.8; ctx.fillStyle = vio;
    for(let i = 0; i < 5; i++){
      const px = cx + (i - 2)*W*0.08, py = H*0.44 + ((t*40 + i*20) % (H*0.16));
      ctx.beginPath(); ctx.arc(px, py, 2.4, 0, 7); ctx.fill();
    }
    // postsynaptic membrane + receptors (bottom)
    ctx.globalAlpha = 0.6; ctx.strokeStyle = ink; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(W*0.16, H*0.72); ctx.lineTo(W*0.84, H*0.72); ctx.stroke();
    for(let i = 0; i < 7; i++){
      const rx = W*0.2 + i*(W*0.6/6);
      ctx.strokeStyle = dim; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(rx, H*0.72); ctx.lineTo(rx, H*0.79); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    label('PRE', W*0.12, H*0.24, dim, 8);
    label('POST', W*0.12, H*0.76, dim, 8);
    label('SYNAPSE', 10, H - 12, acc, 8.5);
  }

  function draw(z, regionIndex, region, t){
    if(!W) return; ctx.clearRect(0, 0, W, H);
    if(z < 0.5) brain(regionIndex, region, t);
    else if(z < 1.5) column(region, t);
    else synapse(t);
  }
  return { size, draw };
}
