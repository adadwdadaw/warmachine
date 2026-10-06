(() => {
'use strict';
const $ = id => document.getElementById(id);
const stage = $('stage');
if (!window.THREE){ $('menu').querySelector('p').textContent = '3D motoru yüklenemedi. Sayfayı yenileyip tekrar dene.'; return; }
const V = THREE.Vector3;

// ================= Settings =================
const TEAM_HUE = [212, 6], TEAM_NAME = ['Mavi Tim', 'Kızıl Tim'], TEAM_CLS = ['b', 'r'];
const WEAPONS = [
  {name:'Tabanca',         short:'TBN', dmg:24,  hs:2,   rate:260,  mag:12, reload:1100, spread:.012, pellets:1, auto:false, kick:.018, move:1.05, adsFov:62, sfx:[2400,.12,.35], casing:1},
  {name:'Ağır Tabanca',    short:'KRT', dmg:48,  hs:2,   rate:480,  mag:7,  reload:1500, spread:.016, pellets:1, auto:false, kick:.05,  move:1,    adsFov:60, sfx:[1500,.22,.55], casing:1.3},
  {name:'Hafif Makineli',  short:'HMK', dmg:11,  hs:1.6, rate:70,   mag:32, reload:1600, spread:.03,  pellets:1, auto:true,  kick:.008, move:1.1,  adsFov:58, sfx:[2700,.07,.22], casing:.9,  bot:{burst:[4,7], gap:.8,  min:3,  max:10}},
  {name:'Piyade Tüfeği',   short:'PYD', dmg:15,  hs:1.8, rate:100,  mag:30, reload:1900, spread:.022, pellets:1, auto:true,  kick:.010, move:1,    adsFov:52, sfx:[1900,.09,.28], casing:1,   bot:{burst:[3,5], gap:1,   min:6,  max:16}},
  {name:'Muharebe Tüfeği', short:'MHR', dmg:38,  hs:2,   rate:300,  mag:15, reload:2200, spread:.006, pellets:1, auto:false, kick:.03,  move:.95,  adsFov:38, sfx:[1500,.18,.45], casing:1.2, bot:{burst:[1,2], gap:1.1, min:10, max:24}},
  {name:'Pompalı',         short:'PMP', dmg:11,  hs:1.5, rate:850,  mag:6,  reload:2300, spread:.075, pellets:9, auto:false, kick:.055, move:1,    adsFov:62, sfx:[1100,.32,.6],  shell:true, falloff:true, bot:{burst:[1,1], gap:1.1, min:2, max:7}},
  {name:'Ağır Makineli',   short:'AĞM', dmg:17,  hs:1.6, rate:115,  mag:80, reload:3600, spread:.035, pellets:1, auto:true,  kick:.013, move:.82,  adsFov:55, sfx:[1600,.11,.33], casing:1.1, bot:{burst:[5,9], gap:1.1, min:8,  max:18}},
  {name:'Keskin Nişancı',  short:'KNS', dmg:90,  hs:2,   rate:1300, mag:5,  reload:2600, spread:0,    pellets:1, auto:false, kick:.07,  move:.9,   adsFov:20, sfx:[850,.5,.75],   casing:1.4, scope:true, bot:{burst:[1,1], gap:1.6, min:14, max:34}},
  {name:'Roketatar',       short:'RKT', dmg:130, hs:1,   rate:900,  mag:1,  reload:2800, spread:.004, pellets:1, auto:false, kick:.09,  move:.85,  adsFov:55, sfx:[600,.6,.55],   explosive:4.5, rocketSpeed:55},
];
const NW = WEAPONS.length;
const BOT_WEAPONS = [2,3,3,4,5,6,7];
const BOT_DIFF = [
  {spread:.075, react:750, gap:1300, dmgMul:.5},
  {spread:.045, react:450, gap:900,  dmgMul:.62},
  {spread:.025, react:250, gap:600,  dmgMul:.75},
];
const EYE = 1.6, RADIUS = .4, GRAV = 15, JUMP = 5.8, MAX_BOTS = 8;
const PEER_PREFIX = 'cephehatti-v2-';

// ================= Map =================
const A = 26, BOXES = [];
const box = (x,z,w,d,h,c) => BOXES.push({x,z,w,d,h,c});
const sym4 = (x,z,w,d,h,c) => { box(x,z,w,d,h,c); box(-x,z,w,d,h,c); box(x,-z,w,d,h,c); box(-x,-z,w,d,h,c); };
box(0,-A,A*2+1,1,4,'wall'); box(0,A,A*2+1,1,4,'wall'); box(-A,0,1,A*2+1,4,'wall'); box(A,0,1,A*2+1,4,'wall');
box(0,0,5,5,2.6,'concrete');
sym4(6,6,1.2,1.2,4,'pillar');
sym4(10,10,1.4,1.4,1,'crate'); sym4(11.5,10.2,1.4,1.4,1,'crate'); sym4(10.3,11.6,1.4,1.4,1,'crate');
sym4(16,5,.8,7,2.2,'cover'); sym4(5,16,7,.8,2.2,'cover');
sym4(20,20,1.4,1.4,1,'crate'); sym4(18.5,13,3,3,2.4,'concrete');
sym4(13,21,4,1,1,'sandbag'); sym4(21,13.5,1,4,1,'sandbag');
box(13,0,1.4,1.4,1,'crate'); box(-13,0,1.4,1.4,1,'crate'); box(0,13,1.4,1.4,1,'crate'); box(0,-13,1.4,1.4,1,'crate');
box(9,0,1,3,1.6,'sandbag'); box(-9,0,1,3,1.6,'sandbag'); box(0,9,3,1,1.6,'sandbag'); box(0,-9,3,1,1.6,'sandbag');
const SPAWN0 = [[-20,22.5],[0,22.5],[20,22.5],[-12,19],[12,19],[-22.5,9],[22.5,9],[-7,22.5],[7,22.5]];
const SPAWNS = [SPAWN0, SPAWN0.map(([x,z]) => [-x,-z])];
const WAYPTS = [];
for (let x=-22; x<=22; x+=3) for (let z=-22; z<=22; z+=3)
  if (!BOXES.some(b => Math.abs(x-b.x) < b.w/2+.9 && Math.abs(z-b.z) < b.d/2+.9)) WAYPTS.push([x,z]);
const MAT_COL = {wall:0x7d7259, concrete:0x9a948a, pillar:0x6e6a5e, crate:0x8a6a3c, cover:0x6b7552, sandbag:0xa8986c};

// ================= Three setup =================
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
stage.prepend(renderer.domElement);
const cv = renderer.domElement;
const C = hex => new THREE.Color(hex).convertSRGBToLinear();
const HSL = (h,s,l) => new THREE.Color(`hsl(${h},${s}%,${l}%)`).convertSRGBToLinear();
const scene = new THREE.Scene();
const HAZE = C(0xd9d3c0);
scene.background = HAZE.clone();
scene.fog = new THREE.Fog(HAZE.clone(), 45, 330);
const camera = new THREE.PerspectiveCamera(75, 1, .05, 600);
camera.rotation.order = 'YXZ';
camera.layers.enable(1);
scene.add(camera);

// --- lights ---
const SUN_DIR = new V(.55, .62, .35).normalize();
const hemiLight = new THREE.HemisphereLight(C(0xc7dcff), C(0x6b5838), .5); scene.add(hemiLight);
const sun = new THREE.DirectionalLight(C(0xffe2b8), 2.6);
sun.position.copy(SUN_DIR).multiplyScalar(45);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left:-34,right:34,top:34,bottom:-34,near:1,far:110});
sun.shadow.bias = -.0005; sun.shadow.normalBias = .03;
scene.add(sun); scene.add(sun.target);
const fillLight = new THREE.DirectionalLight(C(0xa9c4ff), .35); fillLight.position.set(-SUN_DIR.x*40, 18, -SUN_DIR.z*40); scene.add(fillLight);

// --- canvas texture helpers ---
function makeCanvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
function toTex(c, rep){
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (rep) t.repeat.set(rep, rep); return t;
}
const rnd = (a, b) => a + Math.random()*(b-a);
function speckle(g, w, h, n, cols, smin, smax){
  for (let i=0;i<n;i++){ g.fillStyle = cols[Math.floor(Math.random()*cols.length)]; const s = rnd(smin, smax); g.fillRect(Math.random()*w, Math.random()*h, s, s); }
}
function blotches(g, w, h, n, col, rmin, rmax){
  for (let i=0;i<n;i++){
    const x = Math.random()*w, y = Math.random()*h, r = rnd(rmin, rmax);
    const gr = g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x-r, y-r, r*2, r*2);
  }
}
// ================= PBR texture generator =================
// Builds tileable albedo + normal + packed roughness/metalness maps from procedural height fields.
const PBR = (() => {
  function rng(seed){ let s = (seed >>> 0) || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  // tileable fractal value noise, returned as Float32Array in [0,1]
  function fbm(w, h, period, seed, oct, pers){
    const out = new Float32Array(w*h); let amp = 1, tot = 0; const r = rng(seed);
    for (let o=0;o<oct;o++){
      const px = period << o, py = Math.max(1, Math.round(px * h / w)), lat = new Float32Array(px*py);
      for (let i=0;i<lat.length;i++) lat[i] = r();
      for (let y=0;y<h;y++){
        const fy = y / h * py, iy = Math.floor(fy); let ty = fy - iy; ty = ty*ty*(3 - 2*ty);
        const y0 = (iy % py) * px, y1 = ((iy + 1) % py) * px;
        for (let x=0;x<w;x++){
          const fx = x / w * px, ix = Math.floor(fx); let tx = fx - ix; tx = tx*tx*(3 - 2*tx);
          const x0 = ix % px, x1 = (ix + 1) % px;
          const a = lat[y0+x0] + (lat[y0+x1] - lat[y0+x0]) * tx, b = lat[y1+x0] + (lat[y1+x1] - lat[y1+x0]) * tx;
          out[y*w+x] += (a + (b - a) * ty) * amp;
        }
      }
      tot += amp; amp *= pers;
    }
    for (let i=0;i<out.length;i++) out[i] /= tot;
    return out;
  }
  function mask(w, h, draw){ // draw with canvas API, read back alpha*luminance as float mask
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    draw(g, w, h); const d = g.getImageData(0, 0, w, h).data, m = new Float32Array(w*h);
    for (let i=0;i<m.length;i++) m[i] = d[i*4+3] / 255 * (d[i*4] / 255);
    return m;
  }
  function blur(src, w, h, r){
    const tmp = new Float32Array(w*h), out = new Float32Array(w*h), n = r*2 + 1;
    for (let y=0;y<h;y++){ let s = 0; for (let k=-r;k<=r;k++) s += src[y*w + ((k + w) % w)];
      for (let x=0;x<w;x++){ tmp[y*w+x] = s / n; s += src[y*w + (x + r + 1) % w] - src[y*w + (x - r + w) % w]; } }
    for (let x=0;x<w;x++){ let s = 0; for (let k=-r;k<=r;k++) s += tmp[((k + h) % h)*w + x];
      for (let y=0;y<h;y++){ out[y*w+x] = s / n; s += tmp[((y + r + 1) % h)*w + x] - tmp[((y - r + h) % h)*w + x]; } }
    return out;
  }
  function toCanvas(w, h, fill){
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const img = g.createImageData(w, h); fill(img.data); g.putImageData(img, 0, 0); return c;
  }
  function normalCanvas(H, w, h, strength){
    return toCanvas(w, h, d => {
      for (let y=0;y<h;y++){ const ym = ((y - 1 + h) % h)*w, yp = ((y + 1) % h)*w, yr = y*w;
        for (let x=0;x<w;x++){
          const xm = (x - 1 + w) % w, xp = (x + 1) % w;
          let nx = -(H[yr+xp] - H[yr+xm]) * strength, ny = (H[yp+x] - H[ym+x]) * strength, nz = 1;
          const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
          const i = (yr + x) * 4; d[i] = (nx*.5+.5)*255; d[i+1] = (ny*.5+.5)*255; d[i+2] = (nz*.5+.5)*255; d[i+3] = 255;
        } }
    });
  }
  // finish: albedo (Float32 RGB 0..1), height, rough, metal -> canvases
  function finish(w, h, A, H, R, M, nStrength, cavity){
    const Hb = cavity ? blur(H, w, h, 3) : null;
    const albedo = toCanvas(w, h, d => {
      for (let i=0;i<w*h;i++){
        let k = 1; if (Hb) k = Math.max(.55, Math.min(1.08, 1 + (H[i] - Hb[i]) * cavity));
        d[i*4] = Math.min(255, A[i*3]*k*255); d[i*4+1] = Math.min(255, A[i*3+1]*k*255); d[i*4+2] = Math.min(255, A[i*3+2]*k*255); d[i*4+3] = 255;
      }
    });
    const orm = toCanvas(w, h, d => { for (let i=0;i<w*h;i++){ d[i*4] = 255; d[i*4+1] = Math.max(0, Math.min(1, R[i]))*255; d[i*4+2] = M ? Math.max(0, Math.min(1, M[i]))*255 : 0; d[i*4+3] = 255; } });
    return {albedo, normal:normalCanvas(H, w, h, nStrength), orm};
  }
  const hex = c => [(c >> 16 & 255)/255, (c >> 8 & 255)/255, (c & 255)/255];
  const mix3 = (a, b, t) => [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t, a[2] + (b[2]-a[2])*t];

  function concrete(S, tint){
    const w = S, h = S, n1 = fbm(w, h, 4, 11, 5, .55), n2 = fbm(w, h, 2, 23, 3, .5), grain = fbm(w, h, 64, 37, 2, .5), r = rng(5);
    const marks = mask(w, h, (g) => {
      g.fillStyle = '#fff';
      for (let i=0;i<S*S/900;i++){ const x = r()*w, y = r()*h, rr = r()*S/512*1.6 + .4; g.globalAlpha = .6 + r()*.4; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
      g.globalAlpha = 1; g.strokeStyle = '#fff'; g.lineWidth = S/512*1.2;
      for (let k=0;k<4;k++){ g.beginPath(); let x = r()*w, y = r()*h; g.moveTo(x, y); for (let j=0;j<14;j++){ x += (r()-.5)*S/12; y += r()*S/22; g.lineTo(x, y); } g.stroke(); }
    });
    const seams = mask(w, h, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, S/256*2.5); g.fillRect(0, 0, S/256*2.5, h);
      for (const [x, y] of [[.25,.25],[.75,.25],[.25,.75],[.75,.75]]){ g.beginPath(); g.arc(x*w, y*h, S/90, 0, 7); g.fill(); } });
    const base = hex(tint || 0x9b968c), dark = mix3(base, [.32,.3,.27], .55), light = mix3(base, [.95,.93,.88], .25);
    const A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h);
    for (let i=0;i<w*h;i++){
      const y = Math.floor(i / w) / h;
      let c = mix3(dark, light, Math.min(1, Math.max(0, n1[i]*1.4 - .2)));
      c = mix3(c, [.36,.33,.28], Math.max(0, n2[i] - .55) * 1.2);
      c = mix3(c, [.3,.27,.22], Math.max(0, y - .82) * 1.6 * (.6 + n1[i]*.6));
      const g2 = (grain[i] - .5) * .08; c = [c[0] + g2, c[1] + g2, c[2] + g2];
      const hole = marks[i], seam = seams[i];
      A.set(mix3(c, [.22,.21,.19], Math.max(hole, seam)*.8), i*3);
      H[i] = n1[i]*.6 + grain[i]*.4 - hole*.9 - seam*1.2;
      R[i] = .86 + (grain[i] - .5)*.12 - Math.max(0, n2[i] - .6)*.2;
    }
    return finish(w, h, A, H, R, null, S/256*2.2, 1.1);
  }
  function wall(S){
    const w = S, h = S, n1 = fbm(w, h, 4, 41, 5, .55), grain = fbm(w, h, 64, 43, 2, .5), drip = fbm(w, h, 32, 47, 3, .5), r = rng(9);
    const lines = mask(w, h, (g) => {
      g.fillStyle = '#fff'; for (const x of [0, w/2]) g.fillRect(x - S/512*3, 0, S/512*6, h);
      g.fillRect(0, h*.09, w, S/512*3);
      for (let i=0;i<S*S/1400;i++){ g.globalAlpha = .5 + r()*.5; g.beginPath(); g.arc(r()*w, r()*h, r()*S/512*1.5 + .4, 0, 7); g.fill(); }
    });
    const A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h);
    const base = [.56,.53,.47];
    for (let i=0;i<w*h;i++){
      const x = i % w, yv = Math.floor(i / w) / h;
      let c = mix3([.36,.34,.3], [.72,.69,.62], Math.min(1, Math.max(0, n1[i]*1.5 - .25)));
      c = mix3(c, base, .35);
      const rustStreak = Math.max(0, drip[(i % w) + Math.floor(Math.floor(i/w) * .08) * w] - .62) * 2.2 * Math.max(0, 1 - yv*1.4);
      c = mix3(c, [.42,.24,.12], Math.min(.7, rustStreak));
      c = mix3(c, [.24,.2,.15], Math.max(0, yv - .7) * 1.8 * (.5 + n1[i]*.7));
      let rough = .84 + (grain[i] - .5)*.1, height = n1[i]*.5 + grain[i]*.5;
      if (yv < .07){ const stripe = Math.floor((x + Math.floor(i / w)) / (S/16)) % 2; const paint = stripe ? [.78,.6,.12] : [.08,.08,.08];
        const chip = n1[i] > .62 ? 1 : 0; c = chip ? mix3(c, [.5,.47,.4], .8) : mix3(paint, c, .15); rough = chip ? rough : .55; height += chip ? -.15 : .05; }
      const g2 = (grain[i] - .5) * .07; c = [c[0] + g2, c[1] + g2, c[2] + g2];
      A.set(mix3(c, [.2,.19,.17], lines[i]*.85), i*3);
      H[i] = height - lines[i]*1.3; R[i] = rough;
    }
    return finish(w, h, A, H, R, null, S/256*2.4, 1.0);
  }
  function crate(S){
    const w = S, h = S, grain = fbm(w, h * 1, 4, 51, 5, .55), fine = fbm(w, h, 48, 53, 2, .5), r = rng(13);
    const A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h), M = new Float32Array(w*h);
    const plank = S / 8, frame = S * .085;
    const stencil = mask(w, h, (g) => { g.fillStyle = '#fff'; g.font = `bold ${S*.1}px Arial`; g.textAlign = 'center'; g.fillText('MÜHİMMAT', w/2, h*.3); g.font = `bold ${S*.05}px Arial`; g.fillText('7.62 × 39 · 1440', w/2, h*.38); });
    const nails = mask(w, h, (g) => { g.fillStyle = '#fff'; for (const [x, y] of [[.04,.04],[.96,.04],[.04,.96],[.96,.96],[.5,.04],[.5,.96],[.04,.5],[.96,.5]]){ g.beginPath(); g.arc(x*w, y*h, S/170, 0, 7); g.fill(); } });
    const tones = Array.from({length:8}, () => .85 + r()*.3);
    for (let i=0;i<w*h;i++){
      const x = i % w, y = Math.floor(i / w), pi = Math.floor(y / plank);
      const gx = grain[(y % h)*w + Math.floor(x*.25) % w];
      const grainLine = Math.sin((y + gx*90) * .55 + fine[i]*4) * .5 + .5;
      let tone = tones[pi]; let c = mix3([.34,.22,.11], [.62,.45,.26], (grainLine*.35 + gx*.65) * tone);
      let hgt = grainLine*.25 + fine[i]*.2;
      const gap = (y % plank) < S/256*1.5 ? 1 : 0;
      const inFrame = x < frame || x > w - frame || y < frame || y > h - frame;
      const dx = x - y, diag = Math.abs(dx) < frame*.72 && !inFrame;
      if (inFrame || diag){ c = mix3(c, [.3,.2,.1], .45); hgt += .35; }
      c = mix3(c, [.12,.1,.08], stencil[i]*.82);
      let rough = .78 + fine[i]*.12, metal = 0;
      if (nails[i] > .3){ c = [.45,.45,.47]; rough = .35; metal = 1; hgt += .5; }
      A.set(mix3(c, [.08,.05,.03], gap*.8), i*3); H[i] = hgt - gap*1.2; R[i] = rough; M[i] = metal;
    }
    return finish(w, h, A, H, R, M, S/256*2.6, .9);
  }
  function corrugated(S){
    const w = S, h = S, n1 = fbm(w, h, 4, 61, 5, .55), chips = fbm(w, h, 16, 67, 4, .5), streak = fbm(w, h, 64, 71, 2, .5);
    const A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h), M = new Float32Array(w*h);
    const rib = S / 16;
    for (let i=0;i<w*h;i++){
      const x = i % w, y = Math.floor(i / w);
      const ph = (x % rib) / rib, rh = Math.sin(ph * Math.PI * 2) * .5 + .5;
      let c = mix3([.27,.31,.2], [.4,.45,.3], n1[i]*.7 + rh*.3);
      let rough = .55 + n1[i]*.15, metal = .15;
      const chip = chips[i] > .64 + rh*.04;
      if (chip){ const rust = streak[i] > .45; c = rust ? [.4,.22,.1] : [.55,.55,.55]; rough = rust ? .85 : .38; metal = rust ? .2 : .9; }
      const rs = Math.max(0, streak[(x) + Math.floor(y*.05)*w] - .6) * 2 * (1 - y/h);
      c = mix3(c, [.38,.2,.09], Math.min(.6, rs));
      A.set(c, i*3); H[i] = rh*1.5 + (chip ? -.08 : 0) + n1[i]*.1; R[i] = rough; M[i] = metal;
    }
    return finish(w, h, A, H, R, M, S/256*1.1, .6);
  }
  function burlap(S){
    const w = S, h = S, n = fbm(w, h, 8, 81, 4, .5), A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h);
    const t = S / 64;
    for (let i=0;i<w*h;i++){
      const x = i % w, y = Math.floor(i / w);
      const wx = Math.sin(x / t * Math.PI) , wy = Math.sin(y / t * Math.PI);
      const over = ((Math.floor(x / t) + Math.floor(y / t)) % 2) ? wx*wx : wy*wy;
      const c = mix3([.42,.36,.24], [.7,.62,.44], over*.55 + n[i]*.45);
      A.set(c, i*3); H[i] = over*.8 + n[i]*.2; R[i] = .95;
    }
    return finish(w, h, A, H, R, null, S/256*2.6, .8);
  }
  function dirtDetail(S){
    const w = S, h = S, n = fbm(w, h, 8, 91, 4, .5), r = rng(17);
    const peb = mask(w, h, (g) => {
      for (let i=0;i<S*S/260;i++){ const x = r()*w, y = r()*h, rr = (r()*r())*S/40 + 1; const gr = g.createRadialGradient(x - rr*.3, y - rr*.3, 0, x, y, rr);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.7, 'rgba(180,180,180,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr;
        g.beginPath(); g.ellipse(x, y, rr, rr*(.6 + r()*.4), r()*3, 0, 7); g.fill(); }
    });
    const A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h);
    for (let i=0;i<w*h;i++){ const v = .82 + n[i]*.25 + peb[i]*.12; A.set([v, v, v], i*3); H[i] = n[i]*.5 + peb[i]*1.1; R[i] = .9 - peb[i]*.25; }
    return finish(w, h, A, H, R, null, S/256*3, 0);
  }
  function dirtAlbedo(S){
    const w = S, h = S, low = fbm(256, 256, 3, 101, 5, .55), mid = fbm(512, 512, 6, 103, 4, .5);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    const lowC = toCanvas(256, 256, d => { for (let i=0;i<256*256;i++){ const v = low[i];
      const col = mix3(mix3([.36,.29,.19], [.55,.47,.33], v), [.33,.38,.2], Math.max(0, .45 - v)*1.2);
      d[i*4] = col[0]*255; d[i*4+1] = col[1]*255; d[i*4+2] = col[2]*255; d[i*4+3] = 255; } });
    g.imageSmoothingQuality = 'high'; g.drawImage(lowC, 0, 0, w, h);
    const midC = toCanvas(512, 512, d => { for (let i=0;i<512*512;i++){ const v = mid[i]; d[i*4] = d[i*4+1] = d[i*4+2] = v*255; d[i*4+3] = 70; } });
    g.globalCompositeOperation = 'overlay'; for (let y=0;y<w;y+=512) for (let x=0;x<w;x+=512) g.drawImage(midC, x, y); g.globalCompositeOperation = 'source-over';
    const r = rng(29);
    for (let t=0;t<4;t++){ // tyre tracks
      let x = r()*w, y = 0, a = (r()-.5)*.6;
      for (const off of [-S/38, S/38]){ g.beginPath(); let xx = x + off, yy = y, aa = a; g.moveTo(xx, yy);
        for (let k=0;k<44;k++){ aa += (r()-.5)*.12; xx += Math.sin(aa)*S/38; yy += Math.cos(aa)*S/38; g.lineTo(xx, yy); }
        g.strokeStyle = 'rgba(40,32,22,.35)'; g.lineWidth = S/90; g.stroke(); g.setLineDash([S/300, S/250]); g.strokeStyle = 'rgba(25,20,14,.35)'; g.lineWidth = S/110; g.stroke(); g.setLineDash([]); }
    }
    for (let i=0;i<S*6;i++){ g.fillStyle = r() < .5 ? 'rgba(30,24,16,.35)' : 'rgba(200,185,150,.3)'; const s = r()*S/700 + .6; g.fillRect(r()*w, r()*h, s, s); }
    for (let i=0;i<10;i++){ const x = r()*w, y = r()*h, rr = S/40 + r()*S/30; const gr = g.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba(35,28,20,.45)'); gr.addColorStop(1,'rgba(35,28,20,0)'); g.fillStyle = gr; g.fillRect(x-rr,y-rr,rr*2,rr*2); }
    return c;
  }
  // ---- weapon & gear surfaces
  function gunSurface(S, base, opt){
    opt = opt || {};
    const w = S, h = S, n = fbm(w, h, 8, opt.seed || 111, 4, .5), wear = fbm(w, h, 12, (opt.seed || 111) + 5, 5, .55), r = rng(opt.seed || 3);
    const scratches = mask(w, h, (g) => { g.strokeStyle = '#fff'; for (let i=0;i<(opt.scratches ?? 60);i++){ g.globalAlpha = .3 + r()*.6; g.lineWidth = .6 + r()*.8; g.beginPath(); const x = r()*w, y = r()*h, a = r()*6, l = r()*S/6; g.moveTo(x, y); g.lineTo(x + Math.cos(a)*l, y + Math.sin(a)*l); g.stroke(); } });
    const A = new Float32Array(w*h*3), H = new Float32Array(w*h), R = new Float32Array(w*h), M = new Float32Array(w*h);
    const b = hex(base), edge = hex(opt.wearColor ?? 0x8a8a88);
    for (let i=0;i<w*h;i++){
      const x = i % w, y = Math.floor(i / w);
      let stip = 0;
      if (opt.stipple){ const cx = (x % 6) - 3, cy = (y % 6) - 3; stip = Math.max(0, 1 - Math.hypot(cx + (n[i]-.5)*2, cy) / 2.6); }
      if (opt.knurl){ const a = ((x + y) % 8) / 8, bb = ((x - y + 4096) % 8) / 8; stip = Math.min(Math.abs(a - .5), Math.abs(bb - .5)) * 2; }
      const worn = wear[i] > (opt.wearAt ?? .7) ? Math.min(1, (wear[i] - (opt.wearAt ?? .7)) * 8) : 0;
      let c = mix3(b, b.map(v => v*1.25 + .02), n[i]*.6);
      c = mix3(c, edge, Math.max(worn*.7, scratches[i]*.5) * (opt.wearAmt ?? .5));
      if (opt.grain){ const gl = Math.sin(y * .35 + n[i]*12 + Math.sin(x*.02)*3) * .5 + .5; c = mix3(c, b.map(v => v*.6), gl*.45); }
      A.set(c, i*3);
      H[i] = n[i]*.25 + stip*1.2 - scratches[i]*.4 + (opt.grain ? Math.sin(y * .35 + n[i]*12) * .15 : 0);
      R[i] = (opt.rough ?? .5) + (n[i] - .5)*.15 - worn*.15 + scratches[i]*.1 + stip*.05;
      M[i] = (opt.metal ?? 0) * (1 - (opt.paintedMetal ? (1 - worn) * .7 : 0));
    }
    return finish(w, h, A, H, R, M, S/256*(opt.nStrength ?? 1.4), 0);
  }
  function fabric(S){
    const w = S, h = S, n = fbm(w, h, 8, 131, 3, .5), H = new Float32Array(w*h), A = new Float32Array(w*h*3), R = new Float32Array(w*h);
    for (let i=0;i<w*h;i++){ const x = i % w, y = Math.floor(i / w);
      const tw = (Math.sin((x + y) * Math.PI / 2.5) * .5 + .5) * .7 + (Math.sin(y * Math.PI / 1.5) * .5 + .5) * .3;
      A.set([1, 1, 1], i*3); H[i] = tw*.6 + n[i]*.4; R[i] = .92 + (n[i] - .5)*.08; }
    return finish(w, h, A, H, R, null, S/256*1.8, 0);
  }
  return {fbm, concrete, wall, crate, corrugated, burlap, dirtDetail, dirtAlbedo, gunSurface, fabric};
})();

const TEX = {};
TEX.concrete = (() => { const c = makeCanvas(256), g = c.getContext('2d');
  g.fillStyle = '#9b968c'; g.fillRect(0,0,256,256);
  blotches(g,256,256,30,'rgba(70,64,55,.18)',20,60); blotches(g,256,256,20,'rgba(255,250,235,.12)',15,50);
  speckle(g,256,256,2500,['rgba(40,38,34,.25)','rgba(230,225,210,.25)'],1,2.5);
  g.strokeStyle = 'rgba(40,36,30,.45)'; g.lineWidth = 2; g.strokeRect(1,1,254,254);
  for (let i=0;i<3;i++){ g.strokeStyle = 'rgba(40,36,30,.25)'; g.lineWidth = 1; g.beginPath(); let x = rnd(0,256), y = rnd(0,256); g.moveTo(x,y); for (let k=0;k<6;k++){ x += rnd(-20,20); y += rnd(5,22); g.lineTo(x,y); } g.stroke(); }
  const grd = g.createLinearGradient(0,200,0,256); grd.addColorStop(0,'rgba(60,50,35,0)'); grd.addColorStop(1,'rgba(60,50,35,.35)'); g.fillStyle = grd; g.fillRect(0,200,256,56);
  return toTex(c); })();
TEX.wall = (() => { const c = makeCanvas(512,256), g = c.getContext('2d');
  g.fillStyle = '#8e8878'; g.fillRect(0,0,512,256);
  blotches(g,512,256,40,'rgba(60,55,45,.2)',20,70); speckle(g,512,256,4000,['rgba(30,28,24,.25)','rgba(235,230,215,.2)'],1,2.5);
  for (let x=0;x<=512;x+=128){ g.fillStyle = 'rgba(30,28,22,.55)'; g.fillRect(x-2,0,4,256); g.fillStyle = 'rgba(255,255,240,.12)'; g.fillRect(x+2,0,2,256); }
  for (let x=0;x<512;x+=64){ g.fillStyle = 'rgba(80,60,30,.25)'; g.fillRect(x+rnd(0,40), 0, rnd(2,5), rnd(60,180)); }
  const grd = g.createLinearGradient(0,150,0,256); grd.addColorStop(0,'rgba(70,55,30,0)'); grd.addColorStop(1,'rgba(70,55,30,.45)'); g.fillStyle = grd; g.fillRect(0,150,512,106);
  for (let x=0;x<512;x+=32){ g.fillStyle = (x/32)%2 ? '#d7b030' : '#222'; g.fillRect(x, 0, 32, 14); }
  return toTex(c); })();
TEX.crate = (() => { const c = makeCanvas(256), g = c.getContext('2d');
  g.fillStyle = '#8a6a3c'; g.fillRect(0,0,256,256);
  for (let y=0;y<256;y+=32){ g.fillStyle = `hsl(32,${rnd(32,42)}%,${rnd(30,38)}%)`; g.fillRect(0,y,256,31); g.fillStyle = 'rgba(30,18,8,.6)'; g.fillRect(0,y+30,256,2);
    for (let k=0;k<14;k++){ g.strokeStyle = 'rgba(40,24,10,.25)'; g.lineWidth = 1; g.beginPath(); const yy = y + rnd(3,28); g.moveTo(0,yy); g.bezierCurveTo(80,yy+rnd(-3,3),170,yy+rnd(-3,3),256,yy+rnd(-2,2)); g.stroke(); } }
  g.fillStyle = '#5c4220'; g.fillRect(0,0,256,22); g.fillRect(0,234,256,22); g.fillRect(0,0,22,256); g.fillRect(234,0,22,256);
  g.save(); g.translate(128,128); g.rotate(Math.PI/4); g.fillRect(-170,-11,340,22); g.restore();
  g.fillStyle = '#2b2b2b'; [[11,11],[245,11],[11,245],[245,245]].forEach(([x,y]) => { g.beginPath(); g.arc(x,y,3,0,7); g.fill(); });
  g.fillStyle = 'rgba(20,20,10,.55)'; g.font = 'bold 26px Arial'; g.textAlign = 'center'; g.fillText('MÜHİMMAT', 128, 70);
  return toTex(c); })();
TEX.metal = (() => { const c = makeCanvas(256), g = c.getContext('2d');
  g.fillStyle = '#5c6646'; g.fillRect(0,0,256,256);
  for (let x=0;x<256;x+=16){ const gr = g.createLinearGradient(x,0,x+16,0); gr.addColorStop(0,'rgba(0,0,0,.28)'); gr.addColorStop(.5,'rgba(255,255,230,.14)'); gr.addColorStop(1,'rgba(0,0,0,.28)'); g.fillStyle = gr; g.fillRect(x,0,16,256); }
  for (let i=0;i<14;i++){ const x = rnd(0,256), w = rnd(2,6), h = rnd(30,140), gr = g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'rgba(120,60,20,.55)'); gr.addColorStop(1,'rgba(120,60,20,0)'); g.fillStyle = gr; g.fillRect(x,0,w,h); }
  blotches(g,256,256,10,'rgba(110,70,30,.22)',10,40);
  return toTex(c); })();
TEX.bag = (() => { const c = makeCanvas(128), g = c.getContext('2d');
  g.fillStyle = '#b3a173'; g.fillRect(0,0,128,128);
  for (let i=0;i<128;i+=3){ g.fillStyle = 'rgba(80,65,35,.18)'; g.fillRect(i,0,1,128); g.fillRect(0,i,128,1); }
  speckle(g,128,128,600,['rgba(60,50,30,.3)','rgba(240,230,200,.25)'],1,2);
  return toTex(c); })();
TEX.dirt = (() => { const c = makeCanvas(1024), g = c.getContext('2d');
  g.fillStyle = '#7d6c4c'; g.fillRect(0,0,1024,1024);
  blotches(g,1024,1024,140,'rgba(90,75,50,.35)',30,110); blotches(g,1024,1024,90,'rgba(150,135,100,.25)',30,90);
  blotches(g,1024,1024,40,'rgba(70,85,40,.3)',20,70);
  speckle(g,1024,1024,22000,['rgba(40,32,20,.35)','rgba(190,175,140,.3)','rgba(110,95,70,.4)'],1,3.5);
  for (let t=0;t<4;t++){
    let x = rnd(0,1024), y = 0, ang = rnd(-.3,.3);
    g.strokeStyle = 'rgba(50,40,26,.32)'; g.lineWidth = 9;
    for (const off of [-26, 26]){ g.beginPath(); let xx = x + off, yy = y, a = ang; g.moveTo(xx,yy); for (let k=0;k<40;k++){ a += rnd(-.08,.08); xx += Math.sin(a)*28; yy += Math.cos(a)*28; g.lineTo(xx,yy); } g.stroke(); }
  }
  blotches(g,1024,1024,10,'rgba(40,35,28,.45)',15,40);
  return toTex(c); })();
TEX.dirt.wrapS = TEX.dirt.wrapT = THREE.ClampToEdgeWrapping;
TEX.dirtDetail = (() => { const c = makeCanvas(256), g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0,0,256,256);
  speckle(g,256,256,5000,['#5a5a5a','#a8a8a8','#6e6e6e','#959595'],1,3);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60,60); return t; })();
TEX.grass = (() => { const c = makeCanvas(256), g = c.getContext('2d');
  g.fillStyle = '#5f6b37'; g.fillRect(0,0,256,256);
  blotches(g,256,256,30,'rgba(120,110,60,.35)',15,50); blotches(g,256,256,25,'rgba(40,55,25,.35)',15,45);
  for (let i=0;i<5000;i++){ g.strokeStyle = Math.random()<.5 ? 'rgba(40,55,20,.5)' : 'rgba(150,150,80,.4)'; g.lineWidth = 1; const x = Math.random()*256, y = Math.random()*256; g.beginPath(); g.moveTo(x,y); g.lineTo(x+rnd(-2,2), y-rnd(2,6)); g.stroke(); }
  return toTex(c, 70); })();
TEX.soft = (() => { const c = makeCanvas(64), g = c.getContext('2d'); const gr = g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.4,'rgba(255,255,255,.5)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c); })();
TEX.flash = (() => { const c = makeCanvas(128), g = c.getContext('2d'); g.translate(64,64);
  const gr = g.createRadialGradient(0,0,0,0,0,64); gr.addColorStop(0,'rgba(255,255,230,1)'); gr.addColorStop(.25,'rgba(255,210,110,.9)'); gr.addColorStop(1,'rgba(255,120,20,0)');
  g.fillStyle = gr; for (let i=0;i<7;i++){ g.rotate(Math.PI*2/7); g.beginPath(); g.moveTo(-9,0); g.lineTo(0, -62 * rnd(.6,1)); g.lineTo(9,0); g.fill(); }
  g.beginPath(); g.arc(0,0,26,0,7); g.fill();
  return new THREE.CanvasTexture(c); })();
TEX.hole = (() => { const c = makeCanvas(64), g = c.getContext('2d'); const gr = g.createRadialGradient(32,32,0,32,32,30);
  gr.addColorStop(0,'rgba(10,8,6,1)'); gr.addColorStop(.35,'rgba(25,20,15,.9)'); gr.addColorStop(.6,'rgba(60,50,40,.4)'); gr.addColorStop(1,'rgba(60,50,40,0)');
  g.fillStyle = gr; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();

// higher quality effect sprites: noisy smoke/fire puffs and directional muzzle petals
function puffTexture(seed, core){
  const S = 128, c = makeCanvas(S), g = c.getContext('2d');
  for (let i=0;i<18;i++){ const x = S/2 + rnd(-24,24), y = S/2 + rnd(-24,24), rr = rnd(14,34); const gr = g.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba(255,255,255,.6)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0,0,S,S); }
  const n = PBR.fbm(S, S, 4, seed, 4, .55), img = g.getImageData(0,0,S,S), d = img.data;
  for (let i=0;i<S*S;i++){
    const x = i % S - S/2, y = Math.floor(i / S) - S/2, r = Math.hypot(x, y) / (S/2), fall = Math.max(0, 1 - r);
    d[i*4+3] = Math.min(255, d[i*4+3] * (.3 + n[i]*1.4) * fall * 1.5 + (core ? Math.max(0, 1 - r*2.2) * 200 : 0));
    const sh = core ? 255 : 185 + n[i]*70; d[i*4] = d[i*4+1] = d[i*4+2] = sh;
  }
  g.putImageData(img, 0, 0); return new THREE.CanvasTexture(c);
}
TEX.smoke = puffTexture(777, false);
TEX.fire = puffTexture(901, true);
TEX.flashSide = (() => {
  const c = makeCanvas(128, 64), g = c.getContext('2d');
  for (let i=0;i<5;i++){
    const len = rnd(70,124), wid = rnd(6,13), gr = g.createLinearGradient(0,0,len,0);
    gr.addColorStop(0,'rgba(255,250,225,1)'); gr.addColorStop(.35,'rgba(255,200,110,.85)'); gr.addColorStop(1,'rgba(255,120,30,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 32 - wid); g.quadraticCurveTo(len*.4, 32 - wid*.4 + rnd(-4,4), len, 32 + rnd(-6,6)); g.quadraticCurveTo(len*.4, 32 + wid*.4 + rnd(-4,4), 0, 32 + wid); g.fill();
  }
  return new THREE.CanvasTexture(c);
})();

// --- world-scaled UVs for boxes so textures don't stretch ---
function boxWorldUV(w, h, d, scale){
  const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv;
  const dims = [[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for (let f=0; f<6; f++) for (let i=0;i<4;i++){ const k = f*4+i; uv.setXY(k, uv.getX(k)*dims[f][0]/scale, uv.getY(k)*dims[f][1]/scale); }
  return geo;
}
const stdMat = (o) => new THREE.MeshStandardMaterial(Object.assign({roughness:.9, metalness:0}, o));
// vertex-shader wind sway for grass and tree crowns
const WIND = {value:0};
function addWind(mat, amp, quad){
  mat.onBeforeCompile = sh => {
    sh.uniforms.uWind = WIND;
    sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', [
      '#include <begin_vertex>',
      'float wh = max(position.y, 0.0);',
      '#ifdef USE_INSTANCING',
      'vec2 wp = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);',
      '#else',
      'vec2 wp = vec2(0.0);',
      '#endif',
      'float ws = sin(uWind * 1.7 + wp.x * .35 + wp.y * .27) * .6 + sin(uWind * 3.3 + wp.x * .9 + wp.y * .4) * .25;',
      'float wk = ' + (quad ? 'wh * wh' : 'wh') + ' * ' + amp.toFixed(4) + ';',
      'transformed.x += ws * wk; transformed.z += ws * wk * .5;'].join('\n'));
  };
  return mat;
}

// ---- PBR textures & materials (albedo + normal + roughness/metalness)
function pbrTex(set, opts){
  opts = opts || {};
  const mk = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); if (opts.repeat) t.repeat.set(opts.repeat, opts.repeat); return t; };
  return {map:mk(set.albedo, true), normalMap:mk(set.normal, false), orm:mk(set.orm, false)};
}
const pbrMat = (P, o) => stdMat(Object.assign({map:P.map, normalMap:P.normalMap, roughnessMap:P.orm, metalnessMap:P.orm, roughness:1, metalness:0}, o));
const PBRT = {
  concrete: pbrTex(PBR.concrete(1024)),
  wall: pbrTex(PBR.wall(1024)),
  crate: pbrTex(PBR.crate(512)),
  metal: pbrTex(PBR.corrugated(512)),
  bag: pbrTex(PBR.burlap(512)),
  dirt: pbrTex(PBR.dirtDetail(512), {repeat:40}),
};
const DIRT_MACRO = (() => { const t = new THREE.CanvasTexture(PBR.dirtAlbedo(2048)); t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; })();
const FABRIC = pbrTex(PBR.fabric(256));
const GUNT = {
  cerakote: pbrTex(PBR.gunSurface(512, 0x1f2023, {metal:1, paintedMetal:true, rough:.5, seed:5})),
  steel: pbrTex(PBR.gunSurface(512, 0x2a2c30, {metal:1, rough:.34, wearAt:.78, seed:6, scratches:90})),
  polymer: pbrTex(PBR.gunSurface(256, 0x262722, {stipple:true, rough:.74, wearAmt:.25, scratches:15, seed:7})),
  tan: pbrTex(PBR.gunSurface(256, 0x8a7754, {stipple:true, rough:.72, wearAmt:.25, scratches:15, seed:8, wearColor:0x5a4a32})),
  wood: pbrTex(PBR.gunSurface(512, 0x5a3418, {grain:true, rough:.5, wearAmt:.3, wearColor:0x8a5a30, seed:9})),
  olive: pbrTex(PBR.gunSurface(512, 0x4b5236, {metal:1, paintedMetal:true, rough:.6, seed:11, wearColor:0x6a6a66})),
  silver: pbrTex(PBR.gunSurface(512, 0xa8aaae, {metal:1, rough:.22, wearAmt:.2, seed:12, wearColor:0xd0d0d0})),
};

let SKY_TEX = null, SUN_SPR = null, SUN_CORE = null;
// --- sky dome, sun, mountains ---
(() => {
  const c = makeCanvas(4, 512), g = c.getContext('2d'), gr = g.createLinearGradient(0,0,0,512);
  gr.addColorStop(0,'#2f6db8'); gr.addColorStop(.32,'#6aa0d8'); gr.addColorStop(.47,'#c9d6dc'); gr.addColorStop(.5,'#e2dac4'); gr.addColorStop(1,'#d9d3c0');
  g.fillStyle = gr; g.fillRect(0,0,4,512);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; SKY_TEX = t;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.MeshBasicMaterial({map:t, side:THREE.BackSide, fog:false, depthWrite:false}));
  sky.renderOrder = -10; scene.add(sky);
  const sunS = new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.soft, color:C(0xfff2c8), fog:false, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false}));
  sunS.position.copy(SUN_DIR).multiplyScalar(450); sunS.scale.set(90,90,1); scene.add(sunS); SUN_SPR = sunS;
  const core = sunS.clone(); core.material = sunS.material.clone(); core.scale.set(26,26,1); core.material.color = C(0xffffff); scene.add(core); SUN_CORE = core;
  const mMat = new THREE.MeshLambertMaterial({color:C(0x7d8a8c), flatShading:true});
  const mMat2 = new THREE.MeshLambertMaterial({color:C(0x8f9688), flatShading:true});
  for (let i=0;i<46;i++){
    const a = i/46*Math.PI*2 + rnd(-.05,.05), r = rnd(190, 260), h = rnd(25, 70);
    const m = new THREE.Mesh(new THREE.ConeGeometry(rnd(35,70), h, Math.floor(rnd(5,8))), Math.random()<.5 ? mMat : mMat2);
    m.position.set(Math.cos(a)*r, h/2 - 4, Math.sin(a)*r); m.rotation.y = rnd(0,3); scene.add(m);
  }
})();

// --- ground ---
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), stdMat({map:TEX.grass, roughness:1}));
ground.rotation.x = -Math.PI/2; ground.position.y = -.02; ground.receiveShadow = true; scene.add(ground);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(A*2, A*2), pbrMat(PBRT.dirt, {normalScale:new THREE.Vector2(1.2, 1.2)}));
floor.material.onBeforeCompile = sh => {
  sh.uniforms.macroMap = {value:DIRT_MACRO};
  sh.fragmentShader = 'uniform sampler2D macroMap;\n' + sh.fragmentShader.replace('#include <map_fragment>', [
    '#ifdef USE_MAP',
    '  vec4 texelColor = mapTexelToLinear( texture2D( map, vUv ) );',
    '  vec4 macroC = mapTexelToLinear( texture2D( macroMap, vUv / 40.0 ) );',
    '  diffuseColor *= texelColor * macroC * 1.45;',
    '#endif'].join('\n'));
};
floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
[[0,21,TEAM_HUE[0]],[0,-21,TEAM_HUE[1]]].forEach(([x,z,h]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(40,6), new THREE.MeshBasicMaterial({color:HSL(h,60,45), transparent:true, opacity:.14, depthWrite:false}));
  m.rotation.x = -Math.PI/2; m.position.set(x,.012,z); scene.add(m);
});

// --- arena boxes (collision meshes are also the visible ones, except sandbags) ---
const worldMeshes = [floor], solidMeshes = [];
const MATS = {
  wall:     pbrMat(PBRT.wall),
  concrete: pbrMat(PBRT.concrete),
  pillar:   pbrMat(PBRT.concrete, {color:C(0xc4beb4)}),
  crate:    pbrMat(PBRT.crate, {metalness:1}),
  cover:    pbrMat(PBRT.metal, {metalness:1}),
  sandbag:  pbrMat(PBRT.bag),
};
const UVSCALE = {wall:4, concrete:2.5, pillar:2, crate:1.4, cover:2, sandbag:1};
const bagBoxes = [];
const BEVEL = {wall:.1, concrete:.08, pillar:.06, crate:.035, cover:.025};
function arenaGeo(b){
  const scale = b.c === 'crate' ? Math.max(b.w, b.h) : UVSCALE[b.c];
  if (!THREE.RoundedBoxGeometry || !BEVEL[b.c]) return boxWorldUV(b.w, b.h, b.d, scale);
  try {
    const geo = new THREE.RoundedBoxGeometry(b.w, b.h, b.d, 2, BEVEL[b.c]);
    const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
    for (let i=0;i<p.count;i++){
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
      let u, v;
      if (ax >= ay && ax >= az){ u = -p.getZ(i) * Math.sign(n.getX(i)) + b.d/2; v = p.getY(i) + b.h/2; }
      else if (ay >= az){ u = p.getX(i) + b.w/2; v = p.getZ(i) + b.d/2; }
      else { u = p.getX(i) * Math.sign(n.getZ(i)) + b.w/2; v = p.getY(i) + b.h/2; }
      uv.setXY(i, u / scale, v / (b.c === 'wall' ? b.h : scale));
    }
    uv.needsUpdate = true; return geo;
  } catch(e){ return boxWorldUV(b.w, b.h, b.d, scale); }
}
for (const b of BOXES){
  const m = new THREE.Mesh(arenaGeo(b), MATS[b.c]);
  m.position.set(b.x, b.h/2, b.z); m.castShadow = m.receiveShadow = true;
  if (b.c === 'sandbag'){ m.visible = false; bagBoxes.push(b); }
  scene.add(m); worldMeshes.push(m); solidMeshes.push(m);
  if (b.c === 'pillar' || b.c === 'concrete'){
    const cap = new THREE.Mesh(new THREE.BoxGeometry(b.w+.16, .14, b.d+.16), pbrMat(PBRT.concrete, {color:C(0xa49e94)}));
    cap.position.set(b.x, b.h + .07, b.z); cap.castShadow = true; scene.add(cap);
  }
  if (b.c === 'cover'){
    const frame = stdMat({color:C(0x3e452c), roughness:.6, metalness:.4});
    for (const s of [-1,1]){
      const long = b.w > b.d;
      const post = new THREE.Mesh(new THREE.BoxGeometry(long ? .12 : b.w+.06, b.h+.04, long ? b.d+.06 : .12), frame);
      post.position.set(b.x + (long ? s*(b.w/2-.06) : 0), b.h/2, b.z + (long ? 0 : s*(b.d/2-.06))); post.castShadow = true; scene.add(post);
    }
  }
}
// sandbag walls as instanced bags
(() => {
  const mats = [];
  for (const b of bagBoxes){
    const long = b.w >= b.d, len = long ? b.w : b.d, thick = long ? b.d : b.w;
    const rows = Math.max(1, Math.round(b.h / .2)), per = Math.max(1, Math.round(len / .55)), cols = Math.max(1, Math.round(thick / .45));
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) for (let i=0;i<per + (r%2 ? 0 : 0);i++){
      const off = (r % 2) ? .275 : 0;
      let t = -len/2 + .275 + i*(len/per) + off; if (t > len/2 - .2) continue;
      const u = -thick/2 + thick/cols*(c+.5);
      const m = new THREE.Matrix4().compose(
        new V(b.x + (long ? t : u), .1 + r*(b.h/rows) + rnd(-.01,.01), b.z + (long ? u : t)),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(-.05,.05), (long ? 0 : Math.PI/2) + rnd(-.12,.12), rnd(-.05,.05))),
        new V(1, 1, 1));
      mats.push(m);
    }
  }
  const geo = new THREE.SphereGeometry(.5, 12, 8); geo.scale(.58, .22*1.05, .44);
  const inst = new THREE.InstancedMesh(geo, MATS.sandbag, mats.length);
  mats.forEach((m,i) => inst.setMatrixAt(i, m)); inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = inst.receiveShadow = true; scene.add(inst);
})();

// --- decoration outside / around the arena (no gameplay effect) ---
(() => {
  // trees
  const trunkGeo = new THREE.CylinderGeometry(.18,.28,2.4,6); trunkGeo.translate(0,1.2,0);
  const leafGeo = new THREE.ConeGeometry(1.6,4.2,7); leafGeo.translate(0,4.2,0);
  const leaf2 = new THREE.ConeGeometry(1.2,3.2,7); leaf2.translate(0,5.8,0);
  const spots = [];
  for (let i=0;i<220;i++){ const a = Math.random()*Math.PI*2, r = rnd(31, 110); spots.push([Math.cos(a)*r, Math.sin(a)*r, rnd(.75,1.5)]); }
  const tr = new THREE.InstancedMesh(trunkGeo, stdMat({color:C(0x4a3826)}), spots.length);
  const lf = new THREE.InstancedMesh(leafGeo, addWind(new THREE.MeshLambertMaterial({color:C(0x3e5a2c), flatShading:true}), .018, false), spots.length);
  const lf2 = new THREE.InstancedMesh(leaf2, addWind(new THREE.MeshLambertMaterial({color:C(0x4b6a33), flatShading:true}), .018, false), spots.length);
  spots.forEach(([x,z,s], i) => { const m = new THREE.Matrix4().compose(new V(x,0,z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0,rnd(0,6),0)), new V(s,s*rnd(.9,1.25),s));
    tr.setMatrixAt(i,m); lf.setMatrixAt(i,m); lf2.setMatrixAt(i,m); });
  [tr,lf,lf2].forEach(o => { o.castShadow = true; scene.add(o); });
  // rocks
  const rockMat = new THREE.MeshLambertMaterial({color:C(0x7e7a70), flatShading:true});
  for (let i=0;i<40;i++){ const a = Math.random()*Math.PI*2, r = rnd(28, 70), s = rnd(.4, 1.8);
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat); m.position.set(Math.cos(a)*r, s*.3, Math.sin(a)*r); m.rotation.set(rnd(0,3),rnd(0,3),0); m.castShadow = true; scene.add(m); }
  // watchtowers
  const wood2 = pbrMat(GUNT.wood, {color:C(0xd8c0a0)}), roof = pbrMat(PBRT.metal, {metalness:1});
  for (const [x,z] of [[30,30],[-30,-30],[30,-30],[-30,30]]){
    const g = new THREE.Group();
    for (const [dx,dz] of [[-1.3,-1.3],[1.3,-1.3],[-1.3,1.3],[1.3,1.3]]){ const l = new THREE.Mesh(new THREE.BoxGeometry(.25,7,.25), wood2); l.position.set(dx,3.5,dz); g.add(l); }
    const p = new THREE.Mesh(new THREE.BoxGeometry(3.4,.25,3.4), wood2); p.position.y = 7; g.add(p);
    for (const s of [-1,1]){ const r1 = new THREE.Mesh(new THREE.BoxGeometry(3.4,.9,.12), wood2); r1.position.set(0,7.55,s*1.65); g.add(r1); const r2 = r1.clone(); r2.rotation.y = Math.PI/2; r2.position.set(s*1.65,7.55,0); g.add(r2); }
    const rf = new THREE.Mesh(new THREE.ConeGeometry(2.9,1.4,4), roof); rf.position.y = 9.6; rf.rotation.y = Math.PI/4; g.add(rf);
    for (const [dx,dz] of [[-1.4,-1.4],[1.4,-1.4],[-1.4,1.4],[1.4,1.4]]){ const l = new THREE.Mesh(new THREE.BoxGeometry(.12,1.8,.12), wood2); l.position.set(dx,8.8,dz); g.add(l); }
    g.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(x,0,z); scene.add(g);
  }
  // fence posts and wire on top of perimeter walls
  const postMat = stdMat({color:C(0x3a3a36), roughness:.5, metalness:.6});
  const wireMat = new THREE.LineBasicMaterial({color:C(0x2c2c2c)});
  for (let i=-A; i<=A; i+=4){
    for (const [x,z] of [[i,-A],[i,A],[-A,i],[A,i]]){ const p = new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.2,5), postMat); p.position.set(x,4.6,z); scene.add(p); }
  }
  for (const [a,b] of [[[-A,-A],[A,-A]],[[-A,A],[A,A]],[[-A,-A],[-A,A]],[[A,-A],[A,A]]])
    for (const y of [4.4,4.75,5.1]){ scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V(a[0],y,a[1]), new V(b[0],y,b[1])]), wireMat)); }
  // barrels along the walls
  const barrelMat = [0x3f5a2c, 0x7a2d1e, 0x2d4a6a].map(c => stdMat({color:C(c), roughness:1, metalness:1, roughnessMap:GUNT.olive.orm, metalnessMap:GUNT.olive.orm, normalMap:GUNT.olive.normalMap}));
  const bGeo = new THREE.CylinderGeometry(.3,.3,.9,14);
  for (const [x,z] of [[-25.2,-6],[-25.2,-5.3],[25.2,6],[25.2,5.3],[-7,25.2],[7,-25.2],[6.4,-25.2],[-25.2,17],[25.2,-17]]){
    const m = new THREE.Mesh(bGeo, barrelMat[Math.floor(Math.random()*3)]); m.position.set(x,.45,z); m.castShadow = m.receiveShadow = true; scene.add(m);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.3,.025,6,16), postMat); rim.rotation.x = Math.PI/2; rim.position.set(x,.78,z); scene.add(rim);
  }
  // camo net over the central bunker
  const netC = makeCanvas(256), ng = netC.getContext('2d');
  for (let i=0;i<500;i++){ ng.fillStyle = ['#3d4a26','#5b5a32','#2f3a1e','#6b6440'][i%4]; ng.beginPath(); ng.ellipse(Math.random()*256, Math.random()*256, rnd(6,16), rnd(4,10), rnd(0,3), 0, 7); ng.fill(); }
  const netT = toTex(netC); netT.repeat.set(2,2);
  const net = new THREE.Mesh(new THREE.PlaneGeometry(7.5,7.5,8,8), stdMat({map:netT, alphaTest:.5, side:THREE.DoubleSide, transparent:false}));
  const pos = net.geometry.attributes.position;
  for (let i=0;i<pos.count;i++){ const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, -Math.max(0, (Math.hypot(x,y) - 2.5)) * .55 + Math.sin(x*2)*.08); }
  net.geometry.computeVertexNormals(); net.rotation.x = -Math.PI/2; net.position.set(0, 3.0, 0); net.castShadow = true; scene.add(net);
})();

// --- floating dust ---
const dust = (() => {
  const n = 400, geo = new THREE.BufferGeometry(), arr = new Float32Array(n*3);
  for (let i=0;i<n;i++){ arr[i*3] = rnd(-A,A); arr[i*3+1] = rnd(.2,6); arr[i*3+2] = rnd(-A,A); }
  geo.setAttribute('position', new THREE.BufferAttribute(arr,3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({color:C(0xfff4d6), size:.05, transparent:true, opacity:.55, depthWrite:false}));
  scene.add(p); return p;
})();
function updateDust(dt){
  const a = dust.geometry.attributes.position;
  for (let i=0;i<a.count;i++){
    let x = a.getX(i) + Math.sin(now/3000 + i)*dt*.15 + dt*.12, y = a.getY(i) + Math.cos(now/2500 + i*1.7)*dt*.05;
    if (x > A) x = -A; a.setXY(i, x, y);
  }
  a.needsUpdate = true;
}

// ================= Viewmodels =================
const gunMetal = pbrMat(GUNT.cerakote, {metalness:1});
const gunDark = pbrMat(GUNT.steel, {metalness:1});
const wood = pbrMat(GUNT.wood);
const polymer = pbrMat(GUNT.polymer);
const gloveMat = stdMat({color:C(0x2e2a22), roughness:.85, normalMap:FABRIC.normalMap, normalScale:new THREE.Vector2(.8, .8)});
const sleeveMat = stdMat({color:HSL(TEAM_HUE[0],30,30), roughness:.95, normalMap:FABRIC.normalMap, normalScale:new THREE.Vector2(.7, .7)});
function vpart(g,w,h,d,x,y,z,mat){ const r = Math.min(.006, Math.min(w,h,d)*.22); const geo = THREE.RoundedBoxGeometry ? new THREE.RoundedBoxGeometry(w,h,d,2,r) : new THREE.BoxGeometry(w,h,d); const m = new THREE.Mesh(geo, mat); m.position.set(x,y,z); g.add(m); return m; }
function vcyl(g,r,len,x,y,z,mat,seg=20){ const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,seg), mat); m.rotation.x = Math.PI/2; m.position.set(x,y,z); g.add(m); return m; }
function limb(g, a, b, r, mat){
  const dir = new V().subVectors(b, a), len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r*.85, r, len, 10), mat);
  m.position.copy(a).addScaledVector(dir, .5); m.quaternion.setFromUnitVectors(new V(0,1,0), dir.normalize()); g.add(m); return m;
}
function hand(g, p){
  const h = new THREE.Mesh(new THREE.SphereGeometry(.045, 14, 10), gloveMat); h.scale.set(1,.8,1.3); h.position.copy(p); g.add(h);
  for (let k=0;k<4;k++){ const x = (k - 1.5) * .017; limb(g, new V(p.x + x, p.y - .005, p.z - .045), new V(p.x + x*1.1, p.y - .035, p.z - .062), .0095, gloveMat); }
  limb(g, new V(p.x - .03, p.y + .01, p.z - .02), new V(p.x - .02, p.y + .022, p.z - .062), .0105, gloveMat);
}
function arms(g, right, left){
  limb(g, new V(.2,-.42,.3), right, .05, sleeveMat); hand(g, right);
  limb(g, new V(-.3,-.46,.25), left, .05, sleeveMat); hand(g, left);
  const cuffL = new V().lerpVectors(left, new V(-.3,-.46,.25), .16); limb(g, cuffL, new V().lerpVectors(left, new V(-.3,-.46,.25), .05), .052, gloveMat);
  const cuffR = new V().lerpVectors(right, new V(.2,-.42,.3), .16); limb(g, cuffR, new V().lerpVectors(right, new V(.2,-.42,.3), .05), .052, gloveMat);
  const watch = new THREE.Mesh(new THREE.BoxGeometry(.04,.022,.045), gunDark); watch.position.copy(new V().lerpVectors(left, new V(-.3,-.46,.25), .24)).add(new V(0,.045,0)); g.add(watch);
}
const viewRoot = new THREE.Group(); viewRoot.position.set(.28,-.26,-.5); camera.add(viewRoot);
const views = [], muzzles = [];
let rocketHead = null;
(() => {
  const tan = pbrMat(GUNT.tan);
  const olive = pbrMat(GUNT.olive, {metalness:1});
  const oliveDark = pbrMat(GUNT.olive, {metalness:1, color:C(0xa0a090)});
  const silver = pbrMat(GUNT.silver, {metalness:1});
  const lensM = new THREE.MeshStandardMaterial({color:C(0x335577), roughness:.1, metalness:.9, emissive:C(0x112233)});
  const glass = new THREE.MeshBasicMaterial({color:0x8fb8d0, transparent:true, opacity:.18, depthWrite:false});
  const redDot = new THREE.MeshBasicMaterial({color:0xff3322});
  const add = (g, mz, r, l) => { arms(g, r, l); views.push(g); muzzles.push(mz); };
  const lensAt = (g, r, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r,16), mat || lensM); m.position.set(x,y,z); g.add(m); return m; };
  let g;
  // 0 pistol
  g = new THREE.Group();
  vpart(g,.06,.07,.3,0,.02,-.02,gunMetal); vpart(g,.065,.04,.28,0,.075,-.02,gunDark);
  vpart(g,.055,.15,.08,0,-.08,.08,polymer).rotation.x = -.25; vcyl(g,.012,.04,0,.035,-.18,gunDark);
  vpart(g,.01,.02,.01,0,.1,-.14,gunDark);
  add(g, -.2, new V(0,-.1,.12), new V(-.03,-.12,.1));
  // 1 heavy pistol
  g = new THREE.Group();
  vpart(g,.07,.075,.38,0,.02,-.04,silver); vpart(g,.072,.03,.36,0,.07,-.04,silver);
  for (let i=0;i<6;i++) vpart(g,.074,.022,.006,0,.07,.06+i*.014,gunDark);
  vpart(g,.06,.16,.085,0,-.085,.09,polymer).rotation.x = -.22; vcyl(g,.016,.03,0,.035,-.235,gunDark);
  vpart(g,.012,.022,.012,0,.095,-.2,gunDark); vpart(g,.03,.02,.012,0,.095,.12,gunDark); vpart(g,.02,.04,.06,0,-.025,.03,gunDark);
  add(g, -.25, new V(0,-.11,.12), new V(-.03,-.13,.1));
  // 2 SMG
  g = new THREE.Group();
  vpart(g,.07,.1,.34,0,0,-.05,polymer); vpart(g,.072,.04,.2,0,.06,-.06,gunDark);
  vcyl(g,.014,.12,0,.01,-.28,gunDark); vcyl(g,.024,.07,0,.01,-.24,gunDark);
  g.userData.mag = vpart(g,.045,.22,.055,0,-.17,-.12,gunDark); vpart(g,.05,.12,.06,0,-.09,.08,polymer).rotation.x = -.3;
  vpart(g,.015,.015,.26,.03,0,.24,gunDark); vpart(g,.015,.015,.26,-.03,0,.24,gunDark); vpart(g,.08,.08,.02,0,-.01,.37,gunDark);
  vpart(g,.05,.012,.07,0,.08,-.05,gunDark); vpart(g,.006,.05,.07,.022,.1,-.05,gunDark); vpart(g,.006,.05,.07,-.022,.1,-.05,gunDark); vpart(g,.05,.006,.07,0,.125,-.05,gunDark);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(.04,.04), glass); gl.position.set(0,.1,-.05); g.add(gl);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(.0025,8), redDot); dot.position.set(0,.1,-.049); g.add(dot);
  vpart(g,.04,.08,.04,0,-.07,-.2,polymer);
  add(g, -.34, new V(0,-.1,.08), new V(-.01,-.1,-.2));
  // 3 assault rifle
  g = new THREE.Group();
  vpart(g,.075,.11,.42,0,0,-.02,gunMetal); vpart(g,.08,.09,.3,0,0,-.36,polymer);
  vcyl(g,.015,.32,0,.01,-.62,gunDark); vpart(g,.05,.03,.04,0,.03,-.78,gunDark);
  g.userData.mag = vpart(g,.05,.2,.08,0,-.15,-.1,gunDark); g.userData.mag.rotation.x = .25;
  vpart(g,.05,.12,.06,0,-.09,.1,polymer).rotation.x = -.3;
  vpart(g,.06,.11,.26,0,-.02,.33,polymer); vpart(g,.03,.05,.32,0,.08,-.05,gunDark);
  vpart(g,.04,.05,.06,0,.12,-.02,gunDark); vpart(g,.01,.04,.01,0,.08,-.48,gunDark);
  add(g, -.8, new V(0,-.1,.08), new V(-.01,-.06,-.36));
  // 4 DMR
  g = new THREE.Group();
  vpart(g,.08,.12,.5,0,0,-.05,tan); vpart(g,.075,.085,.34,0,0,-.46,tan);
  vcyl(g,.016,.3,0,.01,-.76,gunDark); vpart(g,.04,.04,.07,0,.01,-.93,gunDark);
  g.userData.mag = vpart(g,.055,.13,.1,0,-.12,-.12,gunDark); g.userData.mag.rotation.x = .1; vpart(g,.05,.12,.06,0,-.09,.12,polymer).rotation.x = -.3;
  vpart(g,.065,.12,.3,0,-.02,.36,tan);
  vcyl(g,.03,.22,0,.1,-.08,gunDark); vcyl(g,.036,.05,0,.1,-.2,gunDark); vpart(g,.05,.03,.09,0,.07,-.08,gunDark);
  lensAt(g,.027,0,.1,.031);
  add(g, -.96, new V(0,-.1,.12), new V(-.01,-.06,-.42));
  // 5 shotgun
  g = new THREE.Group();
  vcyl(g,.025,.82,0,.02,-.25,gunMetal); vcyl(g,.02,.6,0,-.03,-.2,gunDark);
  vpart(g,.08,.1,.28,0,0,.05,gunMetal); vpart(g,.085,.07,.22,0,-.04,-.36,wood);
  vpart(g,.07,.13,.32,0,-.04,.36,wood).rotation.x = .12; vpart(g,.05,.12,.06,0,-.09,.15,wood).rotation.x = -.3;
  for (let i=0;i<4;i++) vcyl(g,.012,.05,.045,.0,.08+i*.03,stdMat({color:C(0x9c2a1e)}));
  add(g, -.66, new V(0,-.11,.14), new V(-.02,-.08,-.36));
  // 6 LMG
  g = new THREE.Group();
  vpart(g,.1,.14,.5,0,0,-.05,gunMetal); vpart(g,.104,.05,.4,0,.09,-.05,gunDark);
  vcyl(g,.036,.3,0,0,-.48,gunDark,10); vcyl(g,.02,.32,0,0,-.78,gunMetal); vcyl(g,.028,.06,0,0,-.95,gunDark);
  for (let i=0;i<6;i++) vcyl(g,.038,.012,0,0,-.36-i*.045,gunMetal,10);
  g.userData.mag = vpart(g,.13,.14,.13,-.02,-.13,-.08,olive); vpart(g,.135,.02,.135,-.02,-.055,-.08,oliveDark);
  vpart(g,.03,.03,.16,0,.15,-.05,gunDark); vpart(g,.02,.04,.02,0,.13,.0,gunDark); vpart(g,.02,.04,.02,0,.13,-.1,gunDark);
  vpart(g,.05,.12,.06,0,-.1,.14,polymer).rotation.x = -.3; vpart(g,.08,.13,.3,0,-.02,.38,polymer);
  vpart(g,.012,.012,.3,.022,-.04,-.68,gunDark); vpart(g,.012,.012,.3,-.022,-.04,-.68,gunDark);
  vpart(g,.03,.05,.02,0,.05,-.62,gunDark);
  add(g, -.98, new V(0,-.11,.1), new V(-.02,-.06,-.36));
  // 7 sniper
  g = new THREE.Group();
  vpart(g,.07,.1,.5,0,0,-.05,gunMetal); vcyl(g,.017,.55,0,.01,-.55,gunDark); vcyl(g,.026,.08,0,.01,-.84,gunDark);
  vpart(g,.08,.1,.3,0,-.03,-.33,olive);
  vpart(g,.07,.14,.3,0,-.04,.38,olive); vpart(g,.05,.12,.06,0,-.09,.12,polymer).rotation.x = -.3;
  vcyl(g,.033,.36,0,.1,-.08,gunDark); vcyl(g,.042,.06,0,.1,-.27,gunDark); vcyl(g,.04,.05,0,.1,.12,gunDark);
  const lz = lensAt(g,.035,0,.1,-.301); lz.rotation.y = Math.PI;
  vpart(g,.03,.05,.02,0,.06,-.15,gunDark); vpart(g,.03,.05,.02,0,.06,0,gunDark);
  add(g, -.88, new V(0,-.1,.12), new V(-.01,-.07,-.33));
  // 8 rocket launcher
  g = new THREE.Group();
  vcyl(g,.06,1.1,.02,.03,-.1,olive,16); vcyl(g,.068,.06,.02,.03,.42,oliveDark,16); vcyl(g,.068,.06,.02,.03,-.62,oliveDark,16);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.06,.008,6,16), gunDark); rim.position.set(.02,.03,.45); g.add(rim);
  rocketHead = new THREE.Mesh(new THREE.ConeGeometry(.05,.2,12), stdMat({color:C(0x58603e), roughness:.6})); rocketHead.rotation.x = -Math.PI/2; rocketHead.position.set(.02,.03,-.75); g.add(rocketHead);
  vpart(g,.05,.13,.06,.02,-.08,.05,polymer).rotation.x = -.25; vpart(g,.04,.12,.05,.02,-.08,-.3,polymer);
  vpart(g,.03,.08,.05,-.06,.11,-.15,gunDark); vpart(g,.012,.03,.012,-.06,.165,-.15,gunDark);
  add(g, -.72, new V(.02,-.12,.05), new V(.02,-.1,-.3));
  // ---- extra machined detail: triggers & guards, rails, pins, ejection ports, tritium sights, bolt handle
  const tritium = new THREE.MeshBasicMaterial({color:new THREE.Color(.5, 2.4, .7)});
  const portMat = stdMat({color:C(0x060606), roughness:.9});
  const trigger = (g, y, z) => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(.006, .03, .01), gunDark); t.position.set(0, y, z); t.rotation.x = .35; g.add(t);
    const guard = new THREE.Mesh(new THREE.TorusGeometry(.027, .0045, 6, 16, Math.PI), gunMetal); guard.position.set(0, y + .006, z - .006); guard.rotation.set(Math.PI, Math.PI/2, 0); g.add(guard);
  };
  const rail = (g, y, z0, z1, w) => {
    vpart(g, w, .008, z1 - z0, 0, y, (z0 + z1) / 2, gunDark);
    for (let z = z0 + .006; z < z1 - .003; z += .0125){ const t = new THREE.Mesh(new THREE.BoxGeometry(w + .004, .006, .006), gunDark); t.position.set(0, y + .006, z); g.add(t); }
  };
  const pin = (g, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.005, .005, .004, 12), gunDark); m.rotation.z = Math.PI/2; m.position.set(x, y, z); g.add(m); };
  const port = (g, x, y, z, l) => { const m = new THREE.Mesh(new THREE.BoxGeometry(.003, .022, l), portMat); m.position.set(x, y, z); g.add(m); };
  const tdot = (g, x, y, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.0028, 8, 6), tritium); m.position.set(x, y, z); g.add(m); };
  // pistol
  trigger(views[0], -.035, .03); pin(views[0], .031, .02, .05); pin(views[0], -.031, .02, .05);
  vpart(views[0], .03, .014, .01, 0, .102, .1, gunDark); tdot(views[0], 0, .106, -.134); tdot(views[0], .008, .106, .106); tdot(views[0], -.008, .106, .106);
  // heavy pistol
  trigger(views[1], -.04, .035); pin(views[1], .036, .02, .07); pin(views[1], -.036, .02, .07);
  tdot(views[1], 0, .1, -.193); tdot(views[1], .009, .099, .127); tdot(views[1], -.009, .099, .127);
  // SMG
  trigger(views[2], -.07, .035); port(views[2], .036, .01, -.06, .07); pin(views[2], .036, -.02, .02); pin(views[2], -.036, -.02, .02);
  // assault rifle
  trigger(views[3], -.075, .055); rail(views[3], .05, -.5, -.22, .03); port(views[3], .039, .015, -.03, .07);
  pin(views[3], .039, -.03, .05); pin(views[3], -.039, -.03, .05); pin(views[3], .039, -.03, -.1);
  // DMR
  trigger(views[4], -.075, .075); rail(views[4], .047, -.6, -.32, .03); port(views[4], .041, .015, -.05, .08); pin(views[4], .041, -.03, .08);
  // shotgun
  trigger(views[5], -.07, .1); pin(views[5], .041, .0, .09); pin(views[5], .041, .0, .0);
  // LMG
  trigger(views[6], -.085, .09); port(views[6], .052, .02, -.02, .09); pin(views[6], .052, -.04, .1); pin(views[6], -.052, -.04, .1);
  // sniper bolt handle
  trigger(views[7], -.07, .075);
  { const b = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .06, 10), gunMetal); b.rotation.z = Math.PI/2; b.position.set(.06, .01, .05); views[7].add(b);
    const k = new THREE.Mesh(new THREE.SphereGeometry(.013, 12, 10), gunDark); k.position.set(.09, .0, .05); views[7].add(k); }
  views.forEach(v => { if (v.userData.mag) v.userData.mag.userData.base = v.userData.mag.position.clone(); });
  views.forEach((v,i) => { v.visible = i===3; v.traverse(o => { if (o.isMesh) o.castShadow = false; }); viewRoot.add(v); });
})();
let sleeveTeam = -1;
function updateSleeves(team){ if (team !== sleeveTeam){ sleeveTeam = team; sleeveMat.map = soldierMats(team, false).camoTex; sleeveMat.color.set(0xffffff); sleeveMat.needsUpdate = true; } }
const muzzle = new THREE.Object3D(); viewRoot.add(muzzle);
const flash = new THREE.PointLight(0xffb85c, 0, 11, 2); viewRoot.add(flash);
const flashSprite = new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.flash, color:0xffffff, transparent:true, opacity:0, depthWrite:false, blending:THREE.AdditiveBlending, fog:false}));
flashSprite.scale.set(.32,.32,.32); viewRoot.add(flashSprite);
const flashPetals = new THREE.Group(); flashPetals.rotation.order = 'YXZ';
{ const geo = new THREE.PlaneGeometry(.36, .18); geo.translate(.18, 0, 0);
  const mk = () => new THREE.Mesh(geo, new THREE.MeshBasicMaterial({map:TEX.flashSide, color:new THREE.Color(2.4, 1.8, 1.1), transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide, fog:false}));
  const a = mk(), b = mk(); b.rotation.x = Math.PI/2; flashPetals.add(a, b); }
flashPetals.visible = false; viewRoot.add(flashPetals);

// ================= Soldiers =================
// Detailed procedural soldiers: camo uniforms, plate carriers, helmets with headsets,
// articulated legs with a walk cycle, aim pitch, hit flinch and a falling death.
const GEO = new Map();
function capsuleGeo(r1, r2, len, rs){
  rs = rs || 16;
  const key = `c${r1.toFixed(3)}|${r2.toFixed(3)}|${len.toFixed(2)}|${rs}`;
  if (GEO.has(key)) return GEO.get(key);
  const pts = [], n = 5;
  for (let i=0;i<=n;i++){ const a = -Math.PI/2 + i/n*Math.PI/2; pts.push(new THREE.Vector2(i === 0 ? 0 : Math.cos(a)*r2, -len + Math.sin(a)*r2)); }
  for (let i=0;i<=n;i++){ const a = i/n*Math.PI/2; pts.push(new THREE.Vector2(i === n ? 0 : Math.cos(a)*r1, Math.sin(a)*r1)); }
  const g = new THREE.LatheGeometry(pts, rs); GEO.set(key, g); return g;
}
function latheGeo(key, prof, rs){
  if (GEO.has(key)) return GEO.get(key);
  const g = new THREE.LatheGeometry(prof.map(([x,y]) => new THREE.Vector2(x,y)), rs || 16); GEO.set(key, g); return g;
}
function cachedGeo(key, make){ if (!GEO.has(key)) GEO.set(key, make()); return GEO.get(key); }
const BOX = (w,h,d) => cachedGeo(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w,h,d));
const SPH = (r, ws, hs) => cachedGeo(`s${r}|${ws}|${hs}`, () => new THREE.SphereGeometry(r, ws||14, hs||10));
const CYL = (r1, r2, h, s, open) => cachedGeo(`y${r1}|${r2}|${h}|${s}|${open?1:0}`, () => new THREE.CylinderGeometry(r1, r2, h, s||12, 1, !!open));

// Collects parts in a group's local space and merges them per material (few draw calls).
class Parts {
  constructor(){ this.byMat = new Map(); }
  add(geo, mat, pos, rot, scl){
    const m = new THREE.Matrix4().compose(pos || new V(), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rot || [0,0,0]))), scl || new V(1,1,1));
    this.addM(geo, mat, m);
  }
  addM(geo, mat, m){
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()); g.applyMatrix4(m);
    if (!this.byMat.has(mat)) this.byMat.set(mat, []); this.byMat.get(mat).push(g);
  }
  seg(a, b, r1, r2, mat){
    const dir = new V().subVectors(b, a), len = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new V(0,-1,0), dir.normalize());
    this.addM(capsuleGeo(r1, r2, Math.round(len*100)/100), mat, new THREE.Matrix4().compose(a, q, new V(1,1,1)));
  }
  build(group, owned, isHead){
    const U = THREE.BufferGeometryUtils;
    for (const [mat, list] of this.byMat){
      let geos = list;
      if (U && U.mergeBufferGeometries){ const merged = U.mergeBufferGeometries(list, false); if (merged){ geos = [merged]; list.forEach(g => g.dispose()); } }
      for (const g of geos){ const mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.headPart = !!isHead; group.add(mesh); owned.push(g); }
    }
  }
}

function camoTexture(base, blobs, seed){
  const c = makeCanvas(512), g = c.getContext('2d'); g.scale(2, 2);
  g.fillStyle = base; g.fillRect(0,0,256,256);
  let s = seed; const r = () => (s = (s*16807) % 2147483647) / 2147483647;
  for (let layer=0; layer<blobs.length; layer++){
    g.fillStyle = blobs[layer];
    for (let i=0;i<22;i++){
      const x = r()*256, y = r()*256, n = 7 + Math.floor(r()*5), rad = 10 + r()*22;
      g.beginPath();
      for (let k=0;k<=n;k++){ const a = k/n*Math.PI*2, rr = rad*(.6 + r()*.6); const px = x + Math.cos(a)*rr*1.5, py = y + Math.sin(a)*rr; k ? g.lineTo(px,py) : g.moveTo(px,py); }
      g.closePath(); g.fill();
      // wrap so the pattern tiles
      g.save(); g.translate(x > 128 ? -256 : 256, 0); g.fill(); g.restore();
    }
  }
  for (let i=0;i<1600;i++){ g.fillStyle = `rgba(0,0,0,${r()*.12})`; g.fillRect(r()*256, r()*256, 1.5, 1.5); }
  for (let y=0;y<256;y+=2){ g.fillStyle = 'rgba(255,255,255,.025)'; g.fillRect(0,y,256,1); }
  return toTex(c);
}
function webbingTexture(base){
  const c = makeCanvas(128), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0,0,128,128);
  for (let y=8;y<128;y+=16){ g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0,y,128,6); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0,y,128,1);
    for (let x=0;x<128;x+=20){ g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x,y-2,2,10); } }
  for (let i=0;i<500;i++){ g.fillStyle = `rgba(255,255,255,${Math.random()*.06})`; g.fillRect(Math.random()*128, Math.random()*128, 1, 1); }
  return toTex(c);
}
const TEAM_LOOK = [
  {base:'#56677a', blobs:['#34414f','#7f8fa1','#2a3440'], vest:'#2f3d4f', patch:0x3d8be0, gaiter:['#26303a','#4b5866']},
  {base:'#8c6c4c', blobs:['#5f3c2b','#b08d6c','#7b3a2b'], vest:'#5c3428', patch:0xe0503a, gaiter:['#3d2a20','#6e5040']},
];
const SKINS = [0xe2b896, 0xc99a74, 0xa87652, 0x7a5236].map(c => stdMat({color:C(c), roughness:.55}));
const SOLDIER_MATS = new Map();
function soldierMats(team, bot){
  const key = team + (bot ? 'b' : 'h');
  if (SOLDIER_MATS.has(key)) return SOLDIER_MATS.get(key);
  const L = TEAM_LOOK[team];
  const camo = camoTexture(L.base, L.blobs, 1234 + team*99 + (bot ? 7 : 0));
  const helmCamo = camoTexture(L.base, L.blobs, 4321 + team*31 + (bot ? 3 : 0)); helmCamo.repeat.set(2,1);
  const desat = bot ? .55 : 1;
  const m = {
    uni: stdMat({map:camo, roughness:.95, color:bot ? C(0xb8b8b8) : C(0xffffff), normalMap:FABRIC.normalMap, normalScale:new THREE.Vector2(.6, .6)}),
    vest: stdMat({map:webbingTexture(L.vest), roughness:.85, color:bot ? C(0xbcbcbc) : C(0xffffff), normalMap:FABRIC.normalMap, normalScale:new THREE.Vector2(.9, .9)}),
    helm: stdMat({map:helmCamo, roughness:.72, color:bot ? C(0xbdbdbd) : C(0xffffff), normalMap:FABRIC.normalMap, normalScale:new THREE.Vector2(.35, .35)}),
    gear: stdMat({color:C(bot ? 0x3a3a34 : 0x2f3326), roughness:.85}),
    patch: stdMat({color:C(L.patch), emissive:C(L.patch), emissiveIntensity:bot ? .25 * desat : .55, roughness:.5}),
    gaiter: L.gaiter.map(c => stdMat({color:C(parseInt(c.slice(1), 16)), roughness:.95})),
  };
  m.camoTex = camo;
  SOLDIER_MATS.set(key, m); return m;
}
const COMMON = {
  boot: stdMat({color:C(0x2a241c), roughness:.75}),
  sole: stdMat({color:C(0x111111), roughness:.9}),
  glove: stdMat({color:C(0x24221d), roughness:.85}),
  black: pbrMat(GUNT.steel, {metalness:1, color:C(0x8a8a8a)}),
  lens: stdMat({color:C(0x1d2a36), roughness:.08, metalness:.9, emissive:C(0x0a1420)}),
  gold: stdMat({color:C(0x6a4a1e), roughness:.15, metalness:1}),
  gun: pbrMat(GUNT.cerakote, {metalness:1}),
  mouth: stdMat({color:C(0x5a2a22), roughness:.8}),
  eyeWhite: stdMat({color:C(0xe8e2d6), roughness:.3}),
  pupil: stdMat({color:C(0x1a120c), roughness:.15}),
  silver: pbrMat(GUNT.silver, {metalness:1}),
  olive: pbrMat(GUNT.olive, {metalness:1}),
  gunTan: pbrMat(GUNT.tan),
  wood: pbrMat(GUNT.wood),
  scopeGlass: stdMat({color:C(0x224466), roughness:.05, metalness:1, emissive:C(0x0b2238)}),
};
function hashStr(s){ let h = 2166136261; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function nameSprite(text, hue){
  const c = makeCanvas(256, 64), g = c.getContext('2d'); g.font = '600 34px "Saira Condensed", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(0,0,0,.5)'; const w = Math.min(250, g.measureText(text).width + 24); g.fillRect(128-w/2,12,w,40);
  g.fillStyle = `hsl(${hue},85%,72%)`; g.fillText(text,128,33);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:t, transparent:true, depthWrite:false, fog:false}));
  s.scale.set(1.5,.375,1); s.position.y = 2.3; s.renderOrder = 5; return s;
}

function buildWeaponModels(owned){
  const list = [];
  const P = () => new Parts();
  const R = [Math.PI/2,0,0];
  // 0 pistol
  let p = P();
  p.add(BOX(.035,.05,.19), COMMON.gun, new V(.11,.35,-.42)); p.add(BOX(.03,.09,.045), COMMON.black, new V(.11,.3,-.36), [-.3,0,0]);
  list.push(p);
  // 1 heavy pistol
  p = P();
  p.add(BOX(.042,.06,.24), COMMON.silver, new V(.11,.355,-.44)); p.add(BOX(.035,.1,.05), COMMON.black, new V(.11,.3,-.36), [-.3,0,0]);
  list.push(p);
  // 2 SMG
  p = P();
  p.add(BOX(.05,.08,.3), COMMON.black, new V(.12,.36,-.32)); p.add(CYL(.011,.011,.12,8), COMMON.gun, new V(.12,.365,-.52), R);
  p.add(BOX(.035,.18,.05), COMMON.gun, new V(.12,.25,-.33)); p.add(BOX(.035,.1,.045), COMMON.black, new V(.12,.3,-.16), [-.35,0,0]);
  p.add(BOX(.04,.04,.18), COMMON.gun, new V(.12,.35,-.08)); p.add(BOX(.035,.04,.05), COMMON.black, new V(.12,.42,-.3));
  list.push(p);
  // 3 rifle
  p = P();
  p.add(BOX(.055,.085,.3), COMMON.gun, new V(.12,.36,-.28)); p.add(BOX(.06,.065,.28), COMMON.gunTan, new V(.12,.37,-.55));
  p.add(CYL(.011,.011,.22,8), COMMON.black, new V(.12,.37,-.78), R); p.add(CYL(.018,.018,.05,8), COMMON.black, new V(.12,.37,-.9), R);
  p.add(BOX(.04,.16,.065), COMMON.black, new V(.12,.27,-.31), [.28,0,0]); p.add(BOX(.035,.1,.045), COMMON.black, new V(.12,.3,-.14), [-.35,0,0]);
  p.add(BOX(.045,.085,.2), COMMON.gunTan, new V(.12,.35,-.03)); p.add(BOX(.04,.045,.07), COMMON.black, new V(.12,.43,-.32));
  p.add(BOX(.03,.03,.012), COMMON.lens, new V(.12,.44,-.36));
  list.push(p);
  // 4 DMR
  p = P();
  p.add(BOX(.06,.09,.42), COMMON.gunTan, new V(.12,.36,-.36)); p.add(CYL(.012,.012,.3,8), COMMON.black, new V(.12,.37,-.72), R);
  p.add(BOX(.04,.11,.08), COMMON.black, new V(.12,.27,-.32), [.1,0,0]); p.add(BOX(.05,.09,.24), COMMON.gunTan, new V(.12,.35,-.03));
  p.add(CYL(.024,.024,.2,10), COMMON.black, new V(.12,.45,-.33), R); p.add(BOX(.035,.1,.045), COMMON.black, new V(.12,.3,-.14), [-.35,0,0]);
  list.push(p);
  // 5 shotgun
  p = P();
  p.add(CYL(.018,.018,.62,10), COMMON.gun, new V(.12,.38,-.55), R); p.add(CYL(.015,.015,.45,8), COMMON.black, new V(.12,.35,-.5), R);
  p.add(BOX(.06,.08,.24), COMMON.gun, new V(.12,.36,-.22)); p.add(BOX(.065,.055,.17), COMMON.wood, new V(.12,.34,-.5));
  p.add(BOX(.05,.09,.24), COMMON.wood, new V(.12,.34,-.02), [.1,0,0]); p.add(BOX(.035,.1,.045), COMMON.wood, new V(.12,.3,-.14), [-.35,0,0]);
  list.push(p);
  // 6 LMG
  p = P();
  p.add(BOX(.07,.1,.42), COMMON.gun, new V(.12,.36,-.3)); p.add(CYL(.026,.026,.28,10), COMMON.black, new V(.12,.36,-.62), R);
  p.add(CYL(.014,.014,.25,8), COMMON.gun, new V(.12,.36,-.86), R); p.add(BOX(.1,.1,.1), COMMON.olive, new V(.1,.26,-.3));
  p.add(BOX(.025,.025,.14), COMMON.black, new V(.12,.43,-.3)); p.add(BOX(.05,.1,.26), COMMON.black, new V(.12,.35,-.02));
  p.add(BOX(.035,.1,.045), COMMON.black, new V(.12,.3,-.14), [-.35,0,0]);
  list.push(p);
  // 7 sniper
  p = P();
  p.add(BOX(.055,.08,.38), COMMON.gun, new V(.12,.36,-.3)); p.add(CYL(.013,.013,.5,8), COMMON.black, new V(.12,.37,-.72), R);
  p.add(CYL(.022,.022,.07,8), COMMON.black, new V(.12,.37,-.99), R);
  p.add(CYL(.026,.026,.26,10), COMMON.black, new V(.12,.45,-.3), R); p.add(CYL(.032,.032,.04,10), COMMON.black, new V(.12,.45,-.44), R);
  p.add(BOX(.05,.1,.26), COMMON.gunTan, new V(.12,.34,-.02)); p.add(BOX(.035,.1,.045), COMMON.black, new V(.12,.3,-.14), [-.35,0,0]);
  p.add(BOX(.04,.06,.05), COMMON.gunTan, new V(.12,.32,-.34));
  list.push(p);
  // 8 rocket launcher (on the shoulder)
  p = P();
  p.add(CYL(.055,.055,1.0,14), COMMON.olive, new V(.14,.47,-.2), R); p.add(CYL(.062,.062,.06,14), COMMON.black, new V(.14,.47,.3), R);
  p.add(cachedGeo('rkcone', () => new THREE.ConeGeometry(.045,.18,10)), COMMON.olive, new V(.14,.47,-.79), [-Math.PI/2,0,0]);
  p.add(BOX(.035,.12,.045), COMMON.black, new V(.14,.37,-.12), [-.3,0,0]); p.add(BOX(.03,.07,.04), COMMON.black, new V(.08,.53,-.25));
  list.push(p);
  return list.map(parts => { const g = new THREE.Group(); parts.build(g, owned, false); return g; });
}
const HAIR = [0x17120e, 0x2e2018, 0x4a3020, 0x7a4a22, 0x8c8a84].map(c => stdMat({color:C(c), roughness:.95}));
function buildMoustache(p, style, hair){
  if (style === 0){
    for (const s of [-1,1]) p.seg(new V(s*.004,.096,-.121), new V(s*.04,.084,-.109), .013, .008, hair);
  } else if (style === 1){
    for (const s of [-1,1]){
      p.seg(new V(s*.004,.095,-.121), new V(s*.04,.088,-.11), .01, .007, hair);
      p.seg(new V(s*.04,.088,-.11), new V(s*.058,.096,-.098), .007, .005, hair);
      p.seg(new V(s*.058,.096,-.098), new V(s*.056,.108,-.094), .005, .004, hair);
    }
  } else if (style === 2){
    p.add(SPH(.03,12,8), hair, new V(0,.088,-.114), null, new V(1.75,.85,.65));
    for (const s of [-1,1]) p.seg(new V(s*.03,.088,-.112), new V(s*.042,.068,-.104), .016, .01, hair);
  } else if (style === 3){
    for (const s of [-1,1]) p.seg(new V(s*.003,.09,-.12), new V(s*.036,.088,-.112), .005, .004, hair);
  } else {
    for (const s of [-1,1]){
      p.seg(new V(s*.004,.095,-.121), new V(s*.036,.088,-.112), .012, .009, hair);
      p.seg(new V(s*.038,.09,-.111), new V(s*.042,.04,-.098), .009, .008, hair);
    }
  }
}
function makeAvatar(team, name, id, isBot){
  const M = soldierMats(team, isBot), h = hashStr(String(id));
  const skin = SKINS[h % SKINS.length], gaiter = M.gaiter[(h >> 3) % 2];
  const variant = {pack: isBot ? (h >> 5) % 3 === 0 : (h >> 5) % 2 === 0, gaiter:(h >> 7) % 3 !== 0, goggles:(h >> 9) % 2 === 0, nvg: !isBot};
  const owned = [];
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const hips = new THREE.Group(); hips.position.y = .95; body.add(hips);
  const spine = new THREE.Group(); spine.position.y = .06; hips.add(spine);
  const head = new THREE.Group(); head.position.y = .6; spine.add(head);

  // ---- pelvis
  let p = new Parts();
  p.add(latheGeo('pelvis', [[0,-.1],[.14,-.1],[.165,-.02],[.16,.08],[0,.1]]), M.uni, new V(), null, new V(1,1,.72));
  p.add(CYL(.172,.172,.055,18,true), M.gear, new V(0,.03,0), null, new V(1,1,.74));
  p.add(BOX(.04,.04,.02), COMMON.black, new V(0,.03,-.128));
  p.add(BOX(.06,.15,.08), M.gear, new V(.19,-.07,.0)); p.add(BOX(.04,.07,.05), COMMON.black, new V(.19,.0,.0));
  p.add(BOX(.12,.09,.07), M.gear, new V(-.05,-.02,.14));
  p.build(hips, owned, false);

  // ---- legs (articulated)
  const legs = [];
  for (const s of [-1, 1]){
    const thigh = new THREE.Group(); thigh.position.set(s*.095, -.02, 0); hips.add(thigh);
    p = new Parts();
    p.seg(new V(0,0,0), new V(0,-.42,0), .078, .06, M.uni);
    p.add(BOX(.03,.11,.09), M.uni, new V(s*.075,-.2,-.005));
    p.add(BOX(.032,.012,.092), M.gear, new V(s*.077,-.145,-.005));
    p.build(thigh, owned, false);
    const knee = new THREE.Group(); knee.position.y = -.42; thigh.add(knee);
    p = new Parts();
    p.seg(new V(0,0,0), new V(0,-.36,0), .058, .045, M.uni);
    p.add(SPH(.055,12,8), M.gear, new V(0,-.03,-.04), null, new V(1.05,1.25,.7));
    p.add(CYL(.058,.062,.13,12), COMMON.boot, new V(0,-.38,0));
    p.add(BOX(.1,.085,.2), COMMON.boot, new V(0,-.44,-.04));
    p.add(BOX(.105,.025,.215), COMMON.sole, new V(0,-.49,-.04));
    for (let k=0;k<3;k++) p.add(BOX(.07,.006,.012), COMMON.black, new V(0,-.36 - k*.03,-.052));
    p.build(knee, owned, false);
    legs.push({thigh, knee, s});
  }

  // ---- torso, vest, arms (static rifle-holding pose)
  p = new Parts();
  p.add(latheGeo('torso', [[0,0],[.15,0],[.16,.1],[.17,.22],[.195,.35],[.205,.43],[.17,.51],[0,.54]], 18), M.uni, new V(), null, new V(1,1,.62));
  p.add(BOX(.34,.3,.055), M.vest, new V(0,.31,-.125)); p.add(BOX(.34,.32,.055), M.vest, new V(0,.31,.125));
  p.add(CYL(.178,.178,.13,18,true), M.vest, new V(0,.17,0), null, new V(1,1,.72));
  for (const s of [-1,1]) p.add(BOX(.065,.03,.27), M.vest, new V(s*.11,.47,0));
  for (const x of [-.1,0,.1]){ p.add(BOX(.075,.11,.05), M.gear, new V(x,.2,-.172)); p.add(BOX(.077,.03,.054), M.vest, new V(x,.25,-.173)); }
  p.add(BOX(.08,.06,.045), M.gear, new V(-.08,.4,-.17)); p.add(BOX(.07,.05,.04), M.gear, new V(.09,.39,-.17));
  p.add(BOX(.05,.1,.05), M.gear, new V(-.17,.36,-.08)); p.add(CYL(.004,.004,.32,4), COMMON.black, new V(-.17,.56,-.06));
  p.add(BOX(.06,.06,.008), M.patch, new V(.09,.42,-.195));
  if (variant.pack){
    p.add(BOX(.27,.33,.13), M.gear, new V(0,.29,.22)); p.add(BOX(.22,.12,.05), M.vest, new V(0,.22,.29));
    p.add(CYL(.05,.05,.27,10), M.uni, new V(0,.48,.21), [0,0,Math.PI/2]);
  } else {
    p.add(BOX(.2,.26,.06), M.gear, new V(0,.3,.18));
  }
  p.seg(new V(0,.5,0), new V(0,.62,0), .056, .056, skin);
  // arms
  const RS = new V(.2,.44,0), RE = new V(.29,.2,.0), RH = new V(.12,.3,-.13);
  const LS = new V(-.2,.44,0), LE = new V(-.12,.23,-.2), LH = new V(.1,.33,-.43);
  for (const [S, E, H, side] of [[RS,RE,RH,1],[LS,LE,LH,-1]]){
    p.add(SPH(.07,12,10), M.uni, S);
    p.seg(S, E, .062, .05, M.uni);
    p.add(SPH(.045,10,8), M.gear, E, null, new V(1,1,1));
    p.seg(E, H, .05, .04, M.uni);
    p.seg(new V().lerpVectors(E, H, .75), new V().lerpVectors(E, H, .92), .046, .044, COMMON.glove);
    p.add(SPH(.043,10,8), COMMON.glove, H, null, new V(1,.85,1.25));
    // shoulder patch with team colour
    const mid = new V().lerpVectors(S, E, .35); mid.x += side*.058;
    p.add(BOX(.008,.065,.065), M.patch, mid);
  }
  p.build(spine, owned, false);

  // ---- head (open-face helmet so the face and moustache show)
  p = new Parts();
  const hair = HAIR[(h >> 11) % HAIR.length];
  p.add(SPH(.115,24,18), skin, new V(0,.13,0), null, new V(.95,1.1,1.02));
  for (const s of [-1,1]) p.add(SPH(.022,8,6), skin, new V(s*.112,.13,.005), null, new V(.5,1,.8));
  p.add(BOX(.026,.045,.032), skin, new V(0,.128,-.114), [-.15,0,0]);
  p.add(SPH(.014,8,6), skin, new V(0,.108,-.122));
  p.add(BOX(.04,.006,.008), COMMON.mouth, new V(0,.072,-.109));
  for (const s of [-1,1]){
    p.add(SPH(.013,8,6), COMMON.eyeWhite, new V(s*.04,.152,-.1)); p.add(SPH(.008,8,6), COMMON.pupil, new V(s*.04,.152,-.109));
    p.add(BOX(.042,.011,.012), hair, new V(s*.041,.176,-.106), [0,0,s*-.12]);
  }
  buildMoustache(p, (h >> 13) % 5, hair);
  if (variant.gaiter) p.add(SPH(.12,16,10), gaiter, new V(0,-.005,0), null, new V(1.08,.42,1.08));
  if (variant.goggles && !variant.nvg){
    p.add(BOX(.19,.045,.04), COMMON.lens, new V(0,.245,-.125), [.35,0,0]);
    p.add(CYL(.158,.158,.02,18,true), COMMON.black, new V(0,.235,.01), [.2,0,0], new V(1,1,1.08));
  } else if (variant.goggles || (h >> 15) % 2 === 0){
    for (const s of [-1,1]){ p.add(BOX(.045,.026,.008), COMMON.lens, new V(s*.04,.152,-.114)); p.add(BOX(.004,.006,.1), COMMON.black, new V(s*.097,.155,-.06)); }
    p.add(BOX(.02,.006,.006), COMMON.black, new V(0,.157,-.116));
  }
  p.add(cachedGeo('helmet2', () => new THREE.SphereGeometry(.15,18,10,0,Math.PI*2,0,Math.PI*.5)), M.helm, new V(0,.185,.018), [.22,0,0], new V(1,.95,1.08));
  p.add(cachedGeo('helmrim2', () => new THREE.TorusGeometry(.15,.011,6,24)), M.helm, new V(0,.185,.018), [Math.PI/2 + .22,0,0], new V(1,1.08,1));
  for (const s of [-1,1]){
    p.add(BOX(.02,.03,.13), COMMON.black, new V(s*.152,.2,.02));
    p.add(CYL(.046,.046,.045,14), M.gear, new V(s*.123,.12,0), [0,0,Math.PI/2]);
  }
  p.add(BOX(.008,.008,.08), COMMON.black, new V(.095,.085,-.075), [0,.5,0]);
  if (variant.nvg) p.add(BOX(.05,.045,.03), COMMON.black, new V(0,.255,-.13), [.22,0,0]);
  p.add(BOX(.028,.018,.028), M.patch, new V(0,.33,.04));
  p.build(head, owned, true);

  // ---- weapons
  const weapons = buildWeaponModels(owned); weapons.forEach((w,i) => { w.visible = i === 3; spine.add(w); });

  const hit = [];
  body.traverse(o => { if (o.isMesh){ o.userData = {id, head:!!o.userData.headPart}; hit.push(o); } });
  const blob = new THREE.Mesh(BLOB_GEO, BLOB_ROUND); blob.rotation.x = -Math.PI/2; blob.position.y = .02; g.add(blob);
  let label = null; if (name !== null){ label = nameSprite(name, TEAM_HUE[team]); g.add(label); }
  scene.add(g);
  return {g, body, hips, spine, head, legs, weapons, hit, owned, label, hue:TEAM_HUE[team], name, phase:0, flinch:0, kick:0, weapon:3, fallDir:(h & 1) ? 1 : -1, fallSide:((h >> 2) % 3 - 1) * .4};
}
function relabel(av, name){ if (av.label){ av.g.remove(av.label); av.label.material.map.dispose(); } av.label = nameSprite(name, av.hue); av.g.add(av.label); av.name = name; }
function disposeAvatar(av){ scene.remove(av.g); av.owned.forEach(g => g.dispose()); if (av.label) av.label.material.map.dispose(); }
function setAvatarWeapon(av, w){ if (av.weapon === w) return; av.weapon = w; av.weapons.forEach((m,i) => m.visible = i === w); }
function animateAvatar(av, o){
  const dt = o.dt, k = Math.min(1, o.speed / 5.5), dir = o.fwd < -.5 ? -1 : 1;
  if (o.speed > .3) av.phase += dt * (3 + o.speed * 1.55) * dir;
  else av.phase += (Math.round(av.phase / Math.PI) * Math.PI - av.phase) * Math.min(1, dt*6);
  const sideK = Math.max(-1, Math.min(1, o.side / Math.max(.5, o.speed)));
  for (const L of av.legs){
    const ph = av.phase + (L.s > 0 ? Math.PI : 0);
    L.thigh.rotation.x = Math.sin(ph) * .62 * k + .04;
    L.thigh.rotation.z = Math.sin(ph) * .22 * k * sideK * -1;
    L.knee.rotation.x = -(Math.max(0, Math.cos(ph)) * 1.05 * k + .08);
  }
  av.body.position.y = -Math.abs(Math.sin(av.phase)) * .045 * k - .01;
  const sk = o.slideK || 0;
  if (sk > .01){
    for (const L of av.legs){
      L.thigh.rotation.x += ((L.s > 0 ? 1.45 : 1.15) - L.thigh.rotation.x) * sk; L.thigh.rotation.z *= 1 - sk;
      L.knee.rotation.x += ((L.s > 0 ? -.15 : -1.2) - L.knee.rotation.x) * sk;
    }
    av.body.position.y += (-.5 - av.body.position.y) * sk;
  }
  av.body.rotation.x = .38 * sk;
  av.flinch *= Math.pow(.004, dt);
  const breathe = Math.sin(now / 700) * .012;
  av.kick = (av.kick || 0) * Math.pow(.0003, dt);
  av.spine.rotation.x = (o.pitch || 0) * .75 + breathe + av.flinch * .35 + k * .06 + av.kick * .09;
  av.spine.rotation.y = Math.sin(av.phase) * .07 * k;
  av.spine.rotation.z = av.flinch * .08;
  av.head.rotation.x = (o.pitch || 0) * .3 - k * .05;
}
function animateDeath(av, t, dt){
  const e = Math.min(1, t / .5), ease = e*e*(3 - 2*e);
  av.body.rotation.x = ease * 1.48 * av.fallDir;
  av.body.rotation.z = ease * av.fallSide;
  av.body.position.y = 0;
  av.spine.rotation.x += (.5 * av.fallDir - av.spine.rotation.x) * Math.min(1, dt*6);
  av.head.rotation.x += (.6 * av.fallDir - av.head.rotation.x) * Math.min(1, dt*6);
  for (const L of av.legs){ L.thigh.rotation.x *= .9; L.knee.rotation.x += (-.35 - L.knee.rotation.x) * Math.min(1, dt*5); }
}

// ---- menu showcase: one soldier from each team posed in front of the camera
const preview = [];
function buildPreview(){
  [[0, .95, 21.2, Math.PI - .25], [1, 1.75, 20.65, Math.PI - .5]].forEach(([t, x, z, ry]) => {
    const av = makeAvatar(t, null, 'preview' + t + 'x', false);
    av.hit.forEach(m => m.userData = {});
    av.g.position.set(x, 0, z); av.g.rotation.y = ry; av.baseRy = ry; av.team = t;
    preview.push(av);
  });
}
function updatePreview(dt){
  const show = !started;
  for (const av of preview){
    av.g.visible = show;
    if (!show) continue;
    const sel = av.team === me.team;
    const target = av.baseRy + (sel ? .28 : -.05) + Math.sin(now/2400 + av.team) * .06;
    av.g.rotation.y += (target - av.g.rotation.y) * Math.min(1, dt*3);
    animateAvatar(av, {speed:0, fwd:0, side:0, pitch:sel ? .05 : -.12, dt});
  }
}

// ================= Effects =================
const tracers = [], puffs = [], decals = [];
const tracerMat = new THREE.LineBasicMaterial({color:0xffe1a0, transparent:true, opacity:.95, blending:THREE.AdditiveBlending, depthWrite:false});
const TRACER_GEO = new THREE.CylinderGeometry(.01, .01, 1, 5, 1, true); TRACER_GEO.rotateX(Math.PI/2); TRACER_GEO.translate(0, 0, .5);
const TRACER_MAT = new THREE.MeshBasicMaterial({color:new THREE.Color(4.2, 2.9, 1.3), transparent:true, opacity:.9, blending:THREE.AdditiveBlending, depthWrite:false});
function addTracer(o, e){
  const dir = e.clone().sub(o), L = dir.length(); if (L < .5) return; dir.divideScalar(L);
  const m = new THREE.Mesh(TRACER_GEO, TRACER_MAT); m.position.copy(o); m.lookAt(e); m.scale.set(1,1,.01); scene.add(m);
  tracers.push({m, o:o.clone(), dir, L, t:0, len:Math.min(6, L*.6)});
  if (tracers.length > 120){ const t = tracers.shift(); scene.remove(t.m); }
}
function spawnSprite(p, opts){
  if (puffs.length > 320) return;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:opts.tex || TEX.soft, color:opts.color, transparent:true, opacity:opts.fadeIn ? 0 : (opts.op ?? 1), depthWrite:false, blending:opts.add ? THREE.AdditiveBlending : THREE.NormalBlending}));
  s.material.rotation = opts.rot ?? (opts.tex ? Math.random()*6.28 : 0);
  s.position.copy(p); s.scale.setScalar(opts.size); s.layers.set(1); scene.add(s);
  puffs.push({s, v:opts.v || new V(), life:opts.life, max:opts.life, grow:opts.grow || 0, grav:opts.grav || 0, op:opts.op ?? 1, spin:opts.spin || 0, fadeIn:opts.fadeIn || 0});
}
// pooled lights so remote muzzle flashes can light the surroundings without changing the light count
const FX_LIGHTS = [0, 1].map(() => { const l = new THREE.PointLight(0xffb060, 0, 9, 2); scene.add(l); return l; });
function lightFlash(p, color, intensity, dist){
  let L = FX_LIGHTS[0]; for (const l of FX_LIGHTS) if (l.intensity < L.intensity) L = l;
  L.position.copy(p); L.color.setHex(color); L.intensity = intensity; L.distance = dist;
}
// small physical debris chunks for impacts and explosions
const debris = [], DEB_GEO = new THREE.DodecahedronGeometry(.025, 0), DEB_MAT = stdMat({color:C(0x6e665a), roughness:.95});
function spawnDebris(p, n, count, size){
  for (let i=0;i<count;i++){
    if (debris.length > 70){ const o = debris.shift(); scene.remove(o.m); }
    const m = new THREE.Mesh(DEB_GEO, DEB_MAT); m.scale.setScalar((size || 1) * rnd(.6, 1.4));
    m.position.copy(p).addScaledVector(n, .04); m.rotation.set(rnd(0,3), rnd(0,3), 0); m.castShadow = true; scene.add(m);
    debris.push({m, v:n.clone().multiplyScalar(rnd(1.5,3.5)).add(new V(rnd(-1.5,1.5), rnd(.5,2.5), rnd(-1.5,1.5))), spin:new V(rnd(-15,15), rnd(-15,15), rnd(-15,15)), life:rnd(2,3.5), rest:false});
  }
}
const waves = [];
function updateDebris(dt){
  for (let i=debris.length-1;i>=0;i--){
    const c = debris[i]; c.life -= dt;
    if (!c.rest){
      c.v.y -= 9.8*dt; c.m.position.addScaledVector(c.v, dt); c.m.rotation.x += c.spin.x*dt; c.m.rotation.y += c.spin.y*dt;
      const gh = groundAt(c.m.position.x, c.m.position.z, c.m.position.y + .1) + .02;
      if (c.m.position.y < gh){ c.m.position.y = gh; if (Math.abs(c.v.y) < 1) c.rest = true; else { c.v.y *= -.3; c.v.x *= .5; c.v.z *= .5; c.spin.multiplyScalar(.4); } }
    }
    if (c.life < .4) c.m.scale.multiplyScalar(Math.pow(.02, dt));
    if (c.life <= 0){ scene.remove(c.m); debris.splice(i,1); }
  }
  for (let i=waves.length-1;i>=0;i--){
    const w = waves[i]; w.t += dt; const k = w.t / .45;
    w.m.scale.setScalar(1 + k*22); w.m.material.opacity = Math.max(0, 1 - k) * .55;
    if (k >= 1){ scene.remove(w.m); w.m.material.dispose(); waves.splice(i,1); }
  }
  for (const l of FX_LIGHTS) l.intensity *= Math.pow(.00001, dt);
}
function addPuff(p, color){
  if (color === 0x9a1d12){
    for (let i=0;i<5;i++) spawnSprite(p, {color:C(0x7a1006), size:rnd(.05,.11), life:rnd(.25,.45), v:new V(rnd(-1.6,1.6), rnd(0,2), rnd(-1.6,1.6)), grav:7, op:.95});
    spawnSprite(p, {tex:TEX.smoke, color:C(0x6a0c05), size:.3, life:.45, grow:1.6, op:.6, spin:rnd(-1,1)});
  } else {
    for (let i=0;i<3;i++) spawnSprite(p, {tex:TEX.smoke, color:C(0xb8ab8c), size:rnd(.18,.32), life:rnd(.6,1), v:new V(rnd(-.4,.4), rnd(.2,.8), rnd(-.4,.4)), grow:1.5, op:.55, fadeIn:.15, spin:rnd(-1,1)});
  }
}
const _n = new V(), _q = new V();
const decalGeo = new THREE.PlaneGeometry(.11, .11);
const decalMat = new THREE.MeshBasicMaterial({map:TEX.hole, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-4});
function addImpact(hit){
  const p = hit.point;
  _n.set(0,1,0);
  if (hit.face) _n.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
  const d = new THREE.Mesh(decalGeo, decalMat); d.position.copy(p).addScaledVector(_n, .005);
  d.lookAt(_q.copy(p).add(_n)); d.rotation.z = Math.random()*6; d.scale.setScalar(rnd(.7,1.2));
  d.layers.set(1); scene.add(d); decals.push(d);
  if (decals.length > 90){ const o = decals.shift(); scene.remove(o); }
  const spark = new THREE.Color(3.2, 2.1, .9);
  for (let i=0;i<7;i++) spawnSprite(p, {color:spark, size:rnd(.022,.045), life:rnd(.1,.28), v:_n.clone().multiplyScalar(rnd(2.5,5.5)).add(new V(rnd(-2.2,2.2), rnd(-1,2.4), rnd(-2.2,2.2))), grav:12, add:true});
  spawnSprite(p.clone().addScaledVector(_n, .02), {tex:TEX.flash, color:new THREE.Color(2.2, 1.6, .9), size:.16, life:.05, add:true});
  for (let i=0;i<3;i++) spawnSprite(p.clone().addScaledVector(_n, .08), {tex:TEX.smoke, color:C(0xb5a98a), size:rnd(.18,.32), life:rnd(.6,1.1), v:_n.clone().multiplyScalar(rnd(.4,.9)).add(new V(0, rnd(.1,.4), 0)), grow:1.7, op:.5, fadeIn:.12, spin:rnd(-1,1)});
  spawnDebris(p, _n, 3, 1);
}
function addMuzzleFlash(p){
  spawnSprite(p, {tex:TEX.flash, color:new THREE.Color(2.6, 1.9, 1.1), size:rnd(.45,.7), life:.05, add:true});
  spawnSprite(p, {tex:TEX.smoke, color:C(0xbdb8ae), size:.22, life:.9, v:new V(rnd(-.15,.15), .35, rnd(-.15,.15)), grow:2.2, op:.28, fadeIn:.1, spin:rnd(-1,1)});
  lightFlash(p, 0xffb060, 3.2, 9);
}
function updateFx(dt){
  WIND.value = now / 1000;
  for (let i=tracers.length-1;i>=0;i--){
    const tr = tracers[i]; tr.t += dt;
    const head = tr.t * 330, a = Math.max(0, head - tr.len), b = Math.min(tr.L, head);
    if (a >= tr.L){ scene.remove(tr.m); tracers.splice(i,1); continue; }
    tr.m.position.copy(tr.o).addScaledVector(tr.dir, a); tr.m.scale.z = Math.max(.01, b - a);
  }
  for (let i=puffs.length-1;i>=0;i--){ const p = puffs[i]; p.life -= dt;
    p.s.position.addScaledVector(p.v, dt); p.v.y -= p.grav*dt; p.v.multiplyScalar(Math.pow(.2, dt));
    if (p.grow) p.s.scale.multiplyScalar(1 + p.grow*dt);
    if (p.spin) p.s.material.rotation += p.spin*dt;
    { const k = Math.max(0, p.life/p.max); p.s.material.opacity = (p.fadeIn ? Math.min(k, (1 - k) / p.fadeIn) : k) * p.op; }
    if (p.life <= 0){ scene.remove(p.s); p.s.material.dispose(); puffs.splice(i,1); } }
  updateDust(dt);
}

// ================= Graphics upgrade: env, clouds, grass, contact shadows =================
// image-based lighting from the sky so metal and painted surfaces pick up real reflections
function buildEnv(){
  try {
    const pm = new THREE.PMREMGenerator(renderer);
    const es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({map:SKY_TEX, side:THREE.BackSide})));
    const gr = new THREE.Mesh(new THREE.CircleGeometry(9.9, 32), new THREE.MeshBasicMaterial({color:C(0x6e5f45)}));
    gr.rotation.x = -Math.PI/2; gr.position.y = -.6; es.add(gr);
    const sunBall = new THREE.Mesh(new THREE.SphereGeometry(.6, 12, 8), new THREE.MeshBasicMaterial({color:new THREE.Color(14, 12, 9).multiplyScalar(Math.min(1, sun.intensity / 2.6))}));
    sunBall.position.copy(SUN_DIR).multiplyScalar(9); es.add(sunBall);
    const old = scene.environment;
    scene.environment = pm.fromScene(es, .03).texture;
    if (old) old.dispose();
    pm.dispose();
  } catch(e){}
}
buildEnv();

// clouds
const clouds = [];
(() => {
  const c = makeCanvas(256, 128), g = c.getContext('2d');
  for (let i=0;i<26;i++){
    const x = rnd(40, 216), y = rnd(50, 95) - (Math.abs(x-128) < 50 ? 18 : 0), r = rnd(18, 40);
    const gr = g.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,'rgba(255,255,255,.85)'); gr.addColorStop(.6,'rgba(245,245,250,.45)'); gr.addColorStop(1,'rgba(240,240,245,0)');
    g.fillStyle = gr; g.fillRect(x-r,y-r,r*2,r*2);
  }
  const shade = g.createLinearGradient(0,40,0,128); shade.addColorStop(0,'rgba(0,0,0,0)'); shade.addColorStop(1,'rgba(90,100,120,.35)');
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = shade; g.fillRect(0,0,256,128);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  for (let i=0;i<28;i++){
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map:t, transparent:true, opacity:rnd(.55,.9), fog:false, depthWrite:false}));
    const a = Math.random()*Math.PI*2, r = rnd(120, 380), w = rnd(80, 170);
    s.position.set(Math.cos(a)*r, rnd(70, 140), Math.sin(a)*r); s.scale.set(w, w*.5, 1);
    s.userData.v = rnd(.6, 1.6); s.renderOrder = -5; scene.add(s); clouds.push(s);
  }
})();
function updateClouds(dt){
  for (const s of clouds){ s.position.x += s.userData.v * dt; if (s.position.x > 400) s.position.x = -400; }
}

// grass tufts (crossed alpha planes, instanced)
(() => {
  const c = makeCanvas(128), g = c.getContext('2d');
  for (let i=0;i<70;i++){
    const x = rnd(10,118), h = rnd(50,120), lean = rnd(-18,18);
    g.strokeStyle = `hsl(${rnd(60,85)},${rnd(30,45)}%,${rnd(22,42)}%)`; g.lineWidth = rnd(1.5,3.5);
    g.beginPath(); g.moveTo(x,128); g.quadraticCurveTo(x+lean*.3,128-h*.6,x+lean,128-h); g.stroke();
  }
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
  const p1 = new THREE.PlaneGeometry(1, .7).toNonIndexed(); p1.translate(0,.35,0);
  const p2 = p1.clone(); p2.rotateY(Math.PI/2);
  const p3 = p1.clone(); p3.rotateY(Math.PI/4);
  const geo = new THREE.BufferGeometry();
  for (const k of ['position','normal','uv']){
    const arrs = [p1,p2,p3].map(p => p.attributes[k].array), len = arrs.reduce((a,b) => a + b.length, 0), out = new Float32Array(len);
    let o = 0; for (const a of arrs){ out.set(a, o); o += a.length; }
    geo.setAttribute(k, new THREE.BufferAttribute(out, p1.attributes[k].itemSize));
  }
  // normals pointing up make the tufts light like the ground
  const n = geo.attributes.normal; for (let i=0;i<n.count;i++) n.setXYZ(i, 0, 1, 0);
  const mat = addWind(new THREE.MeshLambertMaterial({map:tex, alphaTest:.45, side:THREE.DoubleSide}), .35, true);
  const spots = [];
  for (let i=0;i<2600;i++){ const a = Math.random()*Math.PI*2, r = rnd(27.5, 75); spots.push([Math.cos(a)*r, Math.sin(a)*r, rnd(.8,1.6)]); }
  for (let i=0;i<420;i++){
    const side = Math.floor(Math.random()*4), t = rnd(-A+1, A-1), off = A - rnd(.6, 2.2);
    const [x,z] = side === 0 ? [t, off] : side === 1 ? [t, -off] : side === 2 ? [off, t] : [-off, t];
    spots.push([x, z, rnd(.5, .9)]);
  }
  for (const b of BOXES){ if (b.c === 'wall') continue; for (let i=0;i<4;i++){ const sx = Math.random()<.5 ? -1 : 1; spots.push([b.x + sx*(b.w/2 + rnd(.1,.4)), b.z + rnd(-b.d/2, b.d/2), rnd(.4,.8)]); } }
  const inst = new THREE.InstancedMesh(geo, mat, spots.length);
  spots.forEach(([x,z,s], i) => inst.setMatrixAt(i, new THREE.Matrix4().compose(new V(x,0,z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rnd(0,6), 0)), new V(s, s*rnd(.8,1.3), s))));
  inst.receiveShadow = true; scene.add(inst);
  // pebbles and debris on the arena floor
  const peb = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.07, 0), stdMat({color:C(0x8a8274)}), 500);
  for (let i=0;i<500;i++) peb.setMatrixAt(i, new THREE.Matrix4().compose(new V(rnd(-A+1,A-1), .02, rnd(-A+1,A-1)), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(0,3),rnd(0,3),0)), new V(1,1,1).multiplyScalar(rnd(.5,1.8))));
  peb.castShadow = true; peb.receiveShadow = true; scene.add(peb);
})();

// soft contact shadows at the base of every obstacle and under each soldier
const BLOB_TEX = (() => {
  const c = makeCanvas(128), g = c.getContext('2d');
  g.shadowColor = 'rgba(0,0,0,1)'; g.shadowBlur = 22; g.fillStyle = 'rgba(0,0,0,1)'; g.fillRect(30,30,68,68);
  return new THREE.CanvasTexture(c);
})();
const BLOB_MAT = new THREE.MeshBasicMaterial({map:BLOB_TEX, transparent:true, opacity:.55, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2});
const BLOB_GEO = new THREE.CircleGeometry(.42, 20);
const BLOB_ROUND = new THREE.MeshBasicMaterial({map:TEX.soft, color:0x000000, transparent:true, opacity:.55, depthWrite:false});
for (const b of BOXES){
  if (b.c === 'wall') continue;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(b.w + 1.1, b.d + 1.1), BLOB_MAT);
  m.rotation.x = -Math.PI/2; m.position.set(b.x, .014, b.z); scene.add(m);
}
for (const [a, len, rotY] of [[[0,-A+.5], A*2, 0],[[0,A-.5], A*2, 0],[[-A+.5,0], A*2, Math.PI/2],[[A-.5,0], A*2, Math.PI/2]]){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 2.2), BLOB_MAT); m.rotation.set(-Math.PI/2, 0, rotY); m.position.set(a[0], .013, a[1]); scene.add(m);
}

// ejected shell casings
const casings = [];
const CASE_GEO = new THREE.CylinderGeometry(.009, .009, .045, 8);
const CASE_MAT = stdMat({color:C(0xc89b3c), roughness:.3, metalness:1});
const SHELL_MAT = stdMat({color:C(0x9c2a1e), roughness:.5, metalness:.2});
const ejector = new THREE.Object3D(); ejector.position.set(.05, .06, -.05); viewRoot.add(ejector);
function ejectCasing(){
  if (casings.length > 50){ const o = casings.shift(); scene.remove(o.m); }
  const W = WEAPONS[me.weapon];
  if (!W.shell && !W.casing) return;
  const m = new THREE.Mesh(CASE_GEO, W.shell ? SHELL_MAT : CASE_MAT);
  if (W.shell) m.scale.set(2.2, 1.6, 2.2); else m.scale.setScalar(W.casing);
  ejector.getWorldPosition(m.position); m.rotation.set(rnd(0,3), rnd(0,3), rnd(0,3));
  const right = new V(Math.cos(me.yaw), 0, -Math.sin(me.yaw));
  const v = right.multiplyScalar(rnd(1.6, 2.6)).add(new V(0, rnd(1.6, 2.4), 0)).add(me.vel.clone().setY(0));
  m.castShadow = true; scene.add(m);
  casings.push({m, v, spin:new V(rnd(-20,20), rnd(-20,20), rnd(-20,20)), life:6, rest:false});
}
function groundAt(x, z, y){
  let h = 0;
  for (const b of BOXES) if (Math.abs(x-b.x) < b.w/2 && Math.abs(z-b.z) < b.d/2 && y >= b.h - .05) h = Math.max(h, b.h);
  return h;
}
function updateCasings(dt){
  for (let i=casings.length-1;i>=0;i--){
    const c = casings[i]; c.life -= dt;
    if (!c.rest){
      c.v.y -= 9.8*dt; c.m.position.addScaledVector(c.v, dt);
      c.m.rotation.x += c.spin.x*dt; c.m.rotation.y += c.spin.y*dt; c.m.rotation.z += c.spin.z*dt;
      const gh = groundAt(c.m.position.x, c.m.position.z, c.m.position.y + .1) + .01;
      if (c.m.position.y < gh){
        c.m.position.y = gh;
        if (Math.abs(c.v.y) < .8){ c.rest = true; c.m.rotation.x = Math.PI/2; }
        else { c.v.y = -c.v.y * .35; c.v.x *= .5; c.v.z *= .5; c.spin.multiplyScalar(.5); }
      }
    }
    if (c.life <= 0){ scene.remove(c.m); casings.splice(i,1); }
  }
}

// ---- custom post shaders (AO + god rays), shared by game and compile test
const AO_SHADER = {
  vertex: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  ao: [
    'uniform sampler2D tDepth; uniform vec2 texel; uniform vec2 projScale; uniform float cameraNear, cameraFar, radius, intensity;',
    'varying vec2 vUv;',
    'float viewZ(vec2 uv){ float d = texture2D(tDepth, uv).x; return (cameraNear * cameraFar) / ((cameraFar - cameraNear) * d - cameraFar); }',
    'vec3 viewPos(vec2 uv){ float z = viewZ(uv); return vec3((uv * 2.0 - 1.0) / projScale * -z, z); }',
    'void main(){',
    '  float d0 = texture2D(tDepth, vUv).x;',
    '  if (d0 >= 0.99999){ gl_FragColor = vec4(1.0); return; }',
    '  vec3 p = viewPos(vUv);',
    '  vec3 pr = viewPos(vUv + vec2(texel.x, 0.0)), pl = viewPos(vUv - vec2(texel.x, 0.0));',
    '  vec3 pu = viewPos(vUv + vec2(0.0, texel.y)), pd = viewPos(vUv - vec2(0.0, texel.y));',
    '  vec3 dx = abs(pr.z - p.z) < abs(p.z - pl.z) ? pr - p : p - pl;',
    '  vec3 dy = abs(pu.z - p.z) < abs(p.z - pd.z) ? pu - p : p - pd;',
    '  vec3 n = normalize(cross(dx, dy));',
    '  float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));',
    '  vec2 rUv = min(vec2(0.1), radius * projScale * 0.5 / -p.z);',
    '  float occ = 0.0;',
    '  for (int i = 0; i < AO_SAMPLES; i++){',
    '    float fi = (float(i) + jit) / float(AO_SAMPLES);',
    '    float a = (float(i) + jit) * 2.39996323 + jit * 6.2831853;',
    '    vec2 off = vec2(cos(a), sin(a)) * rUv * (0.15 + 0.85 * fi * fi);',
    '    vec3 q = viewPos(vUv + off) - p;',
    '    float dist = length(q);',
    '    occ += max(0.0, dot(n, q / max(dist, 1e-4)) - 0.08) * (1.0 - smoothstep(radius * 0.4, radius * 1.5, dist));',
    '  }',
    '  float ao = clamp(1.0 - occ / float(AO_SAMPLES) * intensity, 0.0, 1.0);',
    '  gl_FragColor = vec4(ao, ao, ao, 1.0);',
    '}'].join('\n'),
  blur: [
    'uniform sampler2D tAO; uniform sampler2D tDepth; uniform vec2 texel; uniform float cameraNear, cameraFar;',
    'varying vec2 vUv;',
    'float lz(vec2 uv){ float d = texture2D(tDepth, uv).x; return (cameraNear * cameraFar) / ((cameraFar - cameraNear) * d - cameraFar); }',
    'void main(){',
    '  float z0 = lz(vUv), sum = 0.0, wsum = 0.0;',
    '  for (int y = -2; y <= 2; y++) for (int x = -2; x <= 2; x++){',
    '    vec2 uv = vUv + vec2(float(x), float(y)) * texel;',
    '    float w = 1.0 / (1e-3 + abs(lz(uv) - z0) * 4.0) * (1.0 - 0.12 * float(abs(x) + abs(y)));',
    '    sum += texture2D(tAO, uv).r * w; wsum += w;',
    '  }',
    '  float ao = sum / wsum; gl_FragColor = vec4(ao, ao, ao, 1.0);',
    '}'].join('\n'),
  composite: [
    'uniform sampler2D tDiffuse; uniform sampler2D tAO; uniform float strength;',
    'varying vec2 vUv;',
    'void main(){',
    '  vec4 c = texture2D(tDiffuse, vUv);',
    '  float ao = mix(1.0, texture2D(tAO, vUv).r, strength);',
    '  gl_FragColor = vec4(c.rgb * ao, c.a);',
    '}'].join('\n'),
};
const RAYS_FRAG = [
  'uniform sampler2D tDiffuse; uniform sampler2D tDepth; uniform float useDepth; uniform vec2 sunPos; uniform float strength; uniform vec3 tintR; varying vec2 vUv;',
  'void main(){',
  '  vec3 base = texture2D(tDiffuse, vUv).rgb;',
  '  if (strength < 0.001){ gl_FragColor = vec4(base, 1.0); return; }',
  '  float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));',
  '  vec2 delta = (vUv - sunPos) / 64.0 * 0.95; vec2 uv = vUv - delta * jit; float decay = 1.0; vec3 acc = vec3(0.0);',
  '  for (int i = 0; i < 64; i++){',
  '    uv -= delta;',
  '    vec2 cuv = clamp(uv, 0.0, 1.0);',
  '    vec3 c = texture2D(tDiffuse, cuv).rgb;',
  '    float sky = useDepth > 0.5 ? step(0.99999, texture2D(tDepth, cuv).x) : max(dot(c, vec3(0.3, 0.59, 0.11)) - 0.55, 0.0);',
  '    acc += c * sky * decay; decay *= 0.962;',
  '  }',
  '  gl_FragColor = vec4(base + acc * strength * tintR * 0.3, 1.0);',
  '}'].join('\n');

// ================= Ambient occlusion pass (depth-only SSAO, half resolution) =================
// Transparent effects, sprites, lines, alpha-tested foliage and the sky live on layer 1 so they
// are excluded from the depth pre-pass but still drawn normally by the main camera.
function syncFxLayers(){
  scene.traverse(o => {
    if (o.userData._lc) return; o.userData._lc = 1;
    const m = o.material;
    if (o.isSprite || o.isPoints || o.isLine || (m && !Array.isArray(m) && (m.transparent || m.alphaTest > 0 || m.side === THREE.BackSide))) o.layers.set(1);
  });
}
function makeAOPass(samples){
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  const depthRT = new THREE.WebGLRenderTarget(2, 2, {minFilter:THREE.NearestFilter, magFilter:THREE.NearestFilter});
  depthRT.depthTexture = new THREE.DepthTexture(2, 2); depthRT.depthTexture.type = THREE.UnsignedIntType;
  depthRT.depthTexture.minFilter = depthRT.depthTexture.magFilter = THREE.NearestFilter;
  const aoRT = new THREE.WebGLRenderTarget(2, 2, {minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, depthBuffer:false});
  const blurRT = new THREE.WebGLRenderTarget(2, 2, {minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, depthBuffer:false});
  const base = {depthTest:false, depthWrite:false, vertexShader:AO_SHADER.vertex};
  const aoMat = new THREE.ShaderMaterial(Object.assign({defines:{AO_SAMPLES:samples}, fragmentShader:AO_SHADER.ao,
    uniforms:{tDepth:{value:depthRT.depthTexture}, texel:{value:new THREE.Vector2()}, projScale:{value:new THREE.Vector2(1,1)}, cameraNear:{value:camera.near}, cameraFar:{value:camera.far}, radius:{value:.6}, intensity:{value:1.8}}}, base));
  const blurMat = new THREE.ShaderMaterial(Object.assign({fragmentShader:AO_SHADER.blur,
    uniforms:{tAO:{value:aoRT.texture}, tDepth:{value:depthRT.depthTexture}, texel:{value:new THREE.Vector2()}, cameraNear:{value:camera.near}, cameraFar:{value:camera.far}}}, base));
  const compMat = new THREE.ShaderMaterial(Object.assign({fragmentShader:AO_SHADER.composite,
    uniforms:{tDiffuse:{value:null}, tAO:{value:blurRT.texture}, strength:{value:1}}}, base));
  const depthMat = new THREE.MeshBasicMaterial({colorWrite:false});
  return {
    enabled:true, needsSwap:true, clear:false, renderToScreen:false, depthTex:depthRT.depthTexture,
    setSize(w, h){
      const hw = Math.max(1, Math.floor(w / 2)), hh = Math.max(1, Math.floor(h / 2));
      depthRT.setSize(hw, hh); aoRT.setSize(hw, hh); blurRT.setSize(hw, hh);
      aoMat.uniforms.texel.value.set(1/hw, 1/hh); blurMat.uniforms.texel.value.set(1/hw, 1/hh);
    },
    render(renderer, writeBuffer, readBuffer){
      syncFxLayers();
      const oldOverride = scene.overrideMaterial, oldBg = scene.background, oldAuto = renderer.shadowMap.autoUpdate, oldClear = renderer.autoClear;
      camera.layers.set(0); scene.overrideMaterial = depthMat; scene.background = null; renderer.shadowMap.autoUpdate = false; renderer.autoClear = true;
      renderer.setRenderTarget(depthRT); renderer.clear(); renderer.render(scene, camera);
      scene.overrideMaterial = oldOverride; scene.background = oldBg; renderer.shadowMap.autoUpdate = oldAuto; camera.layers.enable(0); camera.layers.enable(1);
      const pe = camera.projectionMatrix.elements;
      aoMat.uniforms.projScale.value.set(pe[0], pe[5]);
      for (const m of [aoMat, blurMat]){ m.uniforms.cameraNear.value = camera.near; m.uniforms.cameraFar.value = camera.far; }
      quad.material = aoMat; renderer.setRenderTarget(aoRT); renderer.render(quad, quadCam);
      quad.material = blurMat; renderer.setRenderTarget(blurRT); renderer.render(quad, quadCam);
      compMat.uniforms.tDiffuse.value = readBuffer.texture; quad.material = compMat;
      renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); renderer.render(quad, quadCam);
      renderer.autoClear = oldClear;
    },
    dispose(){ depthRT.dispose(); aoRT.dispose(); blurRT.dispose(); aoMat.dispose(); blurMat.dispose(); compMat.dispose(); },
  };
}

// ================= Post-processing & quality presets =================
const GradeShader = {
  uniforms:{tDiffuse:{value:null}, vig:{value:.42}, sat:{value:1.1}, contrast:{value:1.07}, tint:{value:new THREE.Vector3(1.03, 1.0, .95)}, grain:{value:.025}, time:{value:0}, ca:{value:.0055}},
  vertexShader:'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader:[
    'uniform sampler2D tDiffuse; uniform float vig, sat, contrast, grain, time, ca; uniform vec3 tint; varying vec2 vUv;',
    'vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(vec3(0.0031308), c)); }',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }',
    'void main(){',
    '  vec2 cao = (vUv - 0.5) * ca;',
    '  vec3 raw = vec3(texture2D(tDiffuse, vUv + cao).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - cao).b);',
    '  vec3 c = toSRGB(clamp(raw, 0.0, 1.0));',
    '  float l = dot(c, vec3(0.299, 0.587, 0.114));',
    '  c = mix(vec3(l), c, sat);',
    '  c = (c - 0.5) * contrast + 0.5;',
    '  c *= mix(vec3(0.94, 0.98, 1.06), tint, smoothstep(0.15, 0.7, l));',
    '  vec2 d = vUv - 0.5; c *= 1.0 - dot(d, d) * vig * 2.2;',
    '  c += (hash(vUv * 1000.0) - 0.5) * grain;',
    '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
    '}'].join('\n'),
};
const QUALITY = [
  {name:'Düşük',  pr:.8,  shadow:1024, post:false, bloom:false, msaa:false, rays:false, ao:0},
  {name:'Orta',   pr:1,   shadow:2048, post:true,  bloom:false, msaa:false, rays:false, ao:0},
  {name:'Yüksek', pr:1.5, shadow:2048, post:true,  bloom:true,  msaa:true,  rays:true, ao:10},
  {name:'Ultra',  pr:2,   shadow:4096, post:true,  bloom:true,  msaa:true,  rays:true, ao:16},
];
let quality = 2, composer = null, bloomPass = null, gradePass = null, fxaaPass = null, rayPass = null, aoPass = null;
try { const q = +localStorage.getItem('cephe-quality'); if (q >= 0 && q <= 3 && localStorage.getItem('cephe-quality') !== null) quality = q; } catch(e){}
function disposeComposer(){
  if (!composer) return;
  try { composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); if (bloomPass && bloomPass.dispose) bloomPass.dispose(); } catch(e){}
  try { if (aoPass) aoPass.dispose(); } catch(e){}
  composer = bloomPass = gradePass = fxaaPass = aoPass = null;
}
function buildComposer(q){
  disposeComposer();
  if (!q.post || !THREE.EffectComposer || !THREE.RenderPass || !THREE.ShaderPass) return;
  try {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    let rt;
    if (q.msaa && renderer.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget){
      rt = new THREE.WebGLMultisampleRenderTarget(size.x, size.y, {format:THREE.RGBAFormat}); rt.samples = 4;
    }
    composer = new THREE.EffectComposer(renderer, rt);
    composer.addPass(new THREE.RenderPass(scene, camera));
    aoPass = null;
    if (q.ao && (renderer.capabilities.isWebGL2 || renderer.extensions.get('WEBGL_depth_texture'))){ try { aoPass = makeAOPass(q.ao); composer.addPass(aoPass); } catch(e){ aoPass = null; } }
    rayPass = null; if (q.rays){ rayPass = new THREE.ShaderPass(GodRayShader); composer.addPass(rayPass); if (aoPass){ rayPass.uniforms.tDepth.value = aoPass.depthTex; rayPass.uniforms.useDepth.value = 1; } }
    if (q.bloom && THREE.UnrealBloomPass){ bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(size.x, size.y), .5, .45, .86); composer.addPass(bloomPass); }
    gradePass = new THREE.ShaderPass(GradeShader); composer.addPass(gradePass); gradePass.uniforms.tint.value.copy(gradeTint);
    if (!rt && THREE.FXAAShader){ fxaaPass = new THREE.ShaderPass(THREE.FXAAShader); composer.addPass(fxaaPass); }
  } catch(e){ composer = null; }
}
function applyQuality(i){
  quality = i; const q = QUALITY[i];
  try { localStorage.setItem('cephe-quality', String(i)); } catch(e){}
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, q.pr));
  if (sun.shadow.mapSize.x !== q.shadow){ sun.shadow.mapSize.set(q.shadow, q.shadow); if (sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map = null; } }
  buildComposer(q);
  document.querySelectorAll('[data-q]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.q === i));
  const vig = document.getElementById('vig'); if (vig) vig.style.display = composer ? 'none' : 'block';
  resize();
}
function renderFrame(dt){
  if (composer){ gradePass.uniforms.time.value = (now % 10000) / 1000; updateGodRays(); composer.render(dt); }
  else renderer.render(scene, camera);
}

const ADS_Y = [-.11, -.105, -.1, -.15, -.1, -.05, -.165, -.1, -.13];
const lerp = (a, b, t) => a + (b - a) * t;


// ================= Atmosphere presets, god rays, terrain, puddles =================
const GodRayShader = {
  uniforms:{tDiffuse:{value:null}, tDepth:{value:null}, useDepth:{value:0}, sunPos:{value:new THREE.Vector2(.5,.5)}, strength:{value:0}, tintR:{value:new THREE.Vector3(1,.9,.75)}},
  vertexShader:AO_SHADER.vertex,
  fragmentShader:RAYS_FRAG,
};
const ATMOS = [
  {name:'Öğle', sunDir:[.55,.62,.35], sunCol:0xffe2b8, sunI:2.6, hemiSky:0xc7dcff, hemiGround:0x6b5838, hemiI:.5,
   sky:['#2f6db8','#6aa0d8','#c9d6dc','#e2dac4','#d9d3c0'], haze:0xd9d3c0, fogNear:45, fogFar:330, exposure:1.05, sunColor:0xfff2c8, cloud:0xffffff, tint:[1.03,1,.95], rays:.05, rayTint:[1,.92,.78]},
  {name:'Gün batımı', sunDir:[.84,.17,-.5], sunCol:0xff9450, sunI:2.4, hemiSky:0x98a2d4, hemiGround:0x5a3a28, hemiI:.42,
   sky:['#24345f','#6b5384','#df8458','#f6b878','#c8977a'], haze:0xd29a78, fogNear:30, fogFar:270, exposure:1.0, sunColor:0xffa860, cloud:0xffb08a, tint:[1.09,.98,.86], rays:.1, rayTint:[1,.7,.42]},
  {name:'Sisli sabah', sunDir:[-.45,.33,.62], sunCol:0xfff0d8, sunI:1.35, hemiSky:0xd0dce8, hemiGround:0x6b6658, hemiI:.78,
   sky:['#8ea2b4','#aebdc8','#cfd6d8','#d8dbd6','#cfd2cc'], haze:0xcfd3cf, fogNear:6, fogFar:115, exposure:1.1, sunColor:0xfff4e0, cloud:0xdde3e8, tint:[.97,1,1.04], rays:.08, rayTint:[1,.97,.9], flare:.3},
  {name:'Yağmurlu', sunDir:[.3,.75,.25], sunCol:0xcfd6e0, sunI:.85, hemiSky:0x9aa6b4, hemiGround:0x3c3a34, hemiI:.75,
   sky:['#46515c','#5c6772','#7a848d','#868e95','#7b8389'], haze:0x7b8389, fogNear:12, fogFar:140, exposure:1.05, sunColor:0x9aa2aa, cloud:0x56606a, tint:[.95,1,1.05], rays:0, rayTint:[1,1,1], rain:true, flare:0},
  {name:'Gece', sunDir:[-.35,.6,-.45], sunCol:0x8fa8ff, sunI:.5, hemiSky:0x2a3552, hemiGround:0x15130f, hemiI:.3,
   sky:['#03050b','#08101f','#152033','#1f2a3a','#151a22'], haze:0x151a22, fogNear:18, fogFar:150, exposure:1.25, sunColor:0xdfe8ff, cloud:0x2c3446, tint:[.94,1,1.12], rays:.03, rayTint:[.8,.9,1], night:true, flare:.25},
];
let atmos = 0, gradeTint = new THREE.Vector3(1.03, 1, .95);
try { const a = localStorage.getItem('cephe-atmos'); if (a !== null && +a >= 0 && +a < ATMOS.length) atmos = +a; } catch(e){}
function applyAtmos(i){
  atmos = i; const P = ATMOS[i];
  try { localStorage.setItem('cephe-atmos', String(i)); } catch(e){}
  SUN_DIR.set(...P.sunDir).normalize();
  sun.position.copy(SUN_DIR).multiplyScalar(45); sun.color.copy(C(P.sunCol)); sun.intensity = P.sunI;
  fillLight.position.set(-SUN_DIR.x*40, 18, -SUN_DIR.z*40);
  hemiLight.color.copy(C(P.hemiSky)); hemiLight.groundColor.copy(C(P.hemiGround)); hemiLight.intensity = P.hemiI;
  const cnv = SKY_TEX.image, g = cnv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, cnv.height);
  [0, .32, .47, .5, 1].forEach((st, k) => gr.addColorStop(st, P.sky[k])); g.fillStyle = gr; g.fillRect(0, 0, cnv.width, cnv.height); SKY_TEX.needsUpdate = true;
  const hz = C(P.haze); scene.fog.color.copy(hz); scene.background.copy(hz); scene.fog.near = P.fogNear; scene.fog.far = P.fogFar;
  if (SUN_SPR){ SUN_SPR.position.copy(SUN_DIR).multiplyScalar(450); SUN_SPR.material.color.copy(C(P.sunColor)); }
  if (SUN_CORE) SUN_CORE.position.copy(SUN_DIR).multiplyScalar(450);
  clouds.forEach(c => c.material.color.copy(C(P.cloud)));
  renderer.toneMappingExposure = P.exposure;
  gradeTint.set(...P.tint); if (gradePass) gradePass.uniforms.tint.value.copy(gradeTint);
  GodRayShader.uniforms.tintR.value.set(...P.rayTint);
  if (rayPass) rayPass.uniforms.tintR.value.set(...P.rayTint);
  buildEnv(); applyWeather(P);
  document.querySelectorAll('[data-atm]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.atm === i));
}
const _sp = new V(), _cd = new V();
function updateGodRays(){
  if (!rayPass) return;
  camera.getWorldDirection(_cd);
  const facing = _cd.dot(SUN_DIR), u = rayPass.uniforms;
  _sp.copy(camera.position).addScaledVector(SUN_DIR, 400).project(camera);
  u.sunPos.value.set((_sp.x + 1) / 2, (_sp.y + 1) / 2);
  const off = Math.max(Math.abs(_sp.x), Math.abs(_sp.y));
  u.strength.value = facing > 0 ? ATMOS[atmos].rays * Math.pow(facing, 1.5) * Math.max(0, 1 - Math.max(0, off - 1) * .7) : 0;
}
// rolling hills beyond the tree line
(() => {
  const geo = new THREE.PlaneGeometry(600, 600, 160, 160), pos = geo.attributes.position;
  for (let i=0;i<pos.count;i++){
    const x = pos.getX(i), y = pos.getY(i), r = Math.hypot(x, y);
    const k = Math.min(1, Math.max(0, (r - 112) / 70)), ks = k*k*(3 - 2*k);
    pos.setZ(i, ks * (5 + 4*Math.sin(x*.031)*Math.cos(y*.027) + 2.5*Math.sin(x*.07 + y*.05) + 1.2*Math.sin(y*.11)));
  }
  geo.computeVertexNormals(); ground.geometry.dispose(); ground.geometry = geo;
})();
// rain puddles that reflect the sky
(() => {
  const c = makeCanvas(128), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0,0,128,128);
  for (let i=0;i<7;i++){
    const x = 64 + rnd(-22,22), y = 64 + rnd(-22,22), r = rnd(20,38), gr = g.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.6,'rgba(255,255,255,.9)'); gr.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0,0,128,128);
  }
  const alpha = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshStandardMaterial({color:C(0x2a2822), roughness:.03, metalness:.25, envMapIntensity:1.5, transparent:true, opacity:.92, alphaMap:alpha, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2});
  let placed = 0;
  for (let k=0;k<80 && placed<10;k++){
    const x = rnd(-22,22), z = rnd(-22,22), w = rnd(1.4,3.4), d = rnd(1,2.4);
    if (BOXES.some(b => Math.abs(x-b.x) < b.w/2 + w/2 + .3 && Math.abs(z-b.z) < b.d/2 + d/2 + .3)) continue;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.set(-Math.PI/2, 0, rnd(0,3)); m.position.set(x, .017, z); m.receiveShadow = true; scene.add(m); placed++;
  }
})();

// ================= Weather, night lighting, lens flare, props =================
// stars for the night sky
const stars = (() => {
  const n = 1800, arr = new Float32Array(n*3);
  for (let i=0;i<n;i++){ const th = Math.random()*Math.PI*2, ph = Math.acos(.05 + Math.random()*.93); arr[i*3] = Math.sin(ph)*Math.cos(th)*450; arr[i*3+1] = Math.cos(ph)*450; arr[i*3+2] = Math.sin(ph)*Math.sin(th)*450; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({color:0xffffff, size:1.6, sizeAttenuation:false, fog:false, transparent:true, opacity:.85, depthWrite:false}));
  p.visible = false; scene.add(p); return p;
})();
// lamp posts that light the arena at night
const lamps = [];
(() => {
  const poleMat = stdMat({color:C(0x3a3c3a), roughness:.45, metalness:.7});
  const coneMat = new THREE.MeshBasicMaterial({color:C(0xffc27a), transparent:true, opacity:.05, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide});
  for (const [x, z] of [[-24.7,-12],[24.7,12],[-24.7,12],[24.7,-12],[-12,24.7],[12,-24.7]]){
    const g = new THREE.Group(), inX = -Math.sign(Math.abs(x) > 20 ? x : 0), inZ = -Math.sign(Math.abs(z) > 20 ? z : 0);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,4.8,8), poleMat); pole.position.y = 2.4; pole.castShadow = true; g.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(inX) ? .9 : .08, .06, Math.abs(inZ) ? .9 : .08), poleMat); arm.position.set(inX*.45, 4.75, inZ*.45); g.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(.38,.12,.24), poleMat); head.position.set(inX*.85, 4.68, inZ*.85); head.castShadow = true; g.add(head);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(.3,.03,.18), new THREE.MeshBasicMaterial({color:C(0x555048)})); bulb.position.set(inX*.85, 4.61, inZ*.85); g.add(bulb);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 4.5, 20, 1, true), coneMat); cone.position.set(inX*.85, 2.35, inZ*.85); cone.visible = false; g.add(cone);
    const light = new THREE.PointLight(0xffc27a, 7, 22, 2); light.position.set(inX*.85, 4.45, inZ*.85);
    g.position.set(x, 0, z); scene.add(g);
    lamps.push({g, bulb, cone, light});
  }
})();
// weapon flashlight (night only, F toggles)
const torch = new THREE.SpotLight(0xfff1dc, 0, 38, .42, .55, 1.6);
torch.position.set(.25, -.15, 0); const torchTarget = new THREE.Object3D(); torchTarget.position.set(.1, -.1, -5);
let torchOn = true;
// rain
const RAIN_N = 2600;
const rain = (() => {
  const arr = new Float32Array(RAIN_N*6);
  for (let i=0;i<RAIN_N;i++){ const x = rnd(-22,22), y = rnd(0,22), z = rnd(-22,22); arr.set([x,y,z, x+.06,y-.55,z+.03], i*6); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const l = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({color:C(0xb4c0cc), transparent:true, opacity:.38, depthWrite:false}));
  l.frustumCulled = false; l.visible = false; scene.add(l); return l;
})();
let nextLightning = Infinity, lightningT = 0;
function applyWeather(P){
  stars.visible = !!P.night;
  for (const L of lamps){
    L.bulb.material.color.copy(P.night ? new THREE.Color(6, 4.2, 2.2) : C(0x555048));
    L.cone.visible = !!P.night;
    if (P.night && !L.light.parent) L.g.add(L.light);
    if (!P.night && L.light.parent) L.g.remove(L.light);
  }
  if (P.night && !torch.parent){ camera.add(torch); camera.add(torchTarget); torch.target = torchTarget; }
  if (!P.night && torch.parent){ camera.remove(torch); camera.remove(torchTarget); }
  rain.visible = !!P.rain; dust.visible = !P.rain && !P.night;
  for (const m of [floor.material, ...Object.values(MATS)]){
    if (m.userData.baseRough === undefined) m.userData.baseRough = m.roughness;
    m.roughness = P.rain ? m.userData.baseRough * .5 : m.userData.baseRough;
  }
  floor.material.color.copy(P.rain ? C(0x8a8a8a) : C(0xffffff));
  nextLightning = P.rain ? now + rnd(4000, 9000) : Infinity;
  if (typeof setRainAudio === 'function') setRainAudio(!!P.rain);
}
function updateWeather(dt){
  const P = ATMOS[atmos];
  if (P.rain){
    rain.position.set(camera.position.x, 0, camera.position.z);
    const a = rain.geometry.attributes.position.array, fall = 24*dt;
    for (let i=0;i<RAIN_N;i++){
      const k = i*6; a[k+1] -= fall; a[k+4] -= fall;
      if (a[k+4] < 0){ const x = rnd(-22,22), z = rnd(-22,22), y = 18 + Math.random()*4; a[k] = x; a[k+1] = y; a[k+2] = z; a[k+3] = x+.06; a[k+4] = y-.55; a[k+5] = z+.03; }
    }
    rain.geometry.attributes.position.needsUpdate = true;
    for (let i=0;i<2;i++) spawnSprite(new V(camera.position.x + rnd(-9,9), .03, camera.position.z + rnd(-9,9)), {color:C(0xd0d8e0), size:.07, life:.14, grow:4, op:.45});
    if (now > nextLightning){ lightningT = .4; nextLightning = now + rnd(9000, 22000); const d = rnd(600, 2600); setTimeout(() => { if (typeof playThunder === 'function') playThunder(d < 1200); }, d); }
  }
  if (lightningT > 0){
    lightningT -= dt;
    const f = lightningT > 0 ? (Math.random() < .55 ? 1 : .25) * Math.min(1, lightningT / .4) : 0;
    renderer.toneMappingExposure = P.exposure * (1 + 2.2*f); hemiLight.intensity = P.hemiI * (1 + 5*f);
  }
  torch.intensity = (P.night && torchOn && isAlive()) ? 4 : 0;
}
// painted base markings on the perimeter walls
(() => {
  const paint = (text, color, w, h) => {
    const c = makeCanvas(512, 256), g = c.getContext('2d');
    g.font = 'bold 120px "Black Ops One", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = color; g.fillText(text, 256, 130);
    g.globalCompositeOperation = 'destination-out';
    for (let i=0;i<900;i++){ g.fillStyle = `rgba(0,0,0,${Math.random()*.7})`; g.fillRect(Math.random()*512, Math.random()*256, rnd(1,5), rnd(1,5)); }
    for (let i=0;i<6;i++){ g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(rnd(0,512), rnd(0,256), rnd(20,80), rnd(2,6)); }
    const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map:t, transparent:true, roughness:.9, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2}));
  };
  const a = paint('MAVİ ÜS', '#3f7fc8', 8, 4); a.position.set(0, 2.1, A - .5 - .02); a.rotation.y = Math.PI; scene.add(a);
  const b = paint('KIZIL ÜS', '#c8503c', 8, 4); b.position.set(0, 2.1, -A + .5 + .02); scene.add(b);
  const c1 = paint('A', '#d9c98f', 3, 1.5); c1.position.set(A - .5 - .02, 2.2, 0); c1.rotation.y = -Math.PI/2; scene.add(c1);
  const c2 = paint('B', '#d9c98f', 3, 1.5); c2.position.set(-A + .5 + .02, 2.2, 0); c2.rotation.y = Math.PI/2; scene.add(c2);
})();
// decorative props: tyre stacks, pallets, ammo cans, rubble, oil stains
(() => {
  const rubber = stdMat({color:C(0x1c1c1c), roughness:.85});
  const tyre = new THREE.TorusGeometry(.33, .13, 10, 20);
  for (const [x, z, n] of [[-24.4, 4, 3], [24.4, -4, 2], [-4, -24.4, 4], [4, 24.4, 3], [-24.4, -18, 2], [24.4, 18, 3]]){
    for (let i=0;i<n;i++){ const m = new THREE.Mesh(tyre, rubber); m.rotation.x = Math.PI/2; m.position.set(x + rnd(-.04,.04), .13 + i*.25, z + rnd(-.04,.04)); m.castShadow = m.receiveShadow = true; scene.add(m); }
  }
  const palletMat = stdMat({map:TEX.crate, color:C(0xb09070), roughness:.85});
  for (const [x, z, ry] of [[-24.9, 8, Math.PI/2], [24.9, -8, -Math.PI/2], [9, 24.9, 0], [-9, -24.9, Math.PI]]){
    const g = new THREE.Group();
    for (let i=0;i<5;i++){ const s = new THREE.Mesh(new THREE.BoxGeometry(1.2, .1, .02), palletMat); s.position.set(0, .12 + i*.24, 0); g.add(s); }
    for (const sx of [-.5, 0, .5]){ const s = new THREE.Mesh(new THREE.BoxGeometry(.1, 1.1, .1), palletMat); s.position.set(sx, .58, .05); g.add(s); }
    g.rotation.set(-.18, ry, 0); g.position.set(x, 0, z); g.traverse(o => { if (o.isMesh){ o.castShadow = true; } }); scene.add(g);
  }
  const canMat = stdMat({color:C(0x4b5236), roughness:.6, metalness:.3});
  for (const b of BOXES.filter(b => b.c === 'crate').slice(0, 10)){
    if (Math.random() < .5) continue;
    const c = new THREE.Mesh(new THREE.BoxGeometry(.3, .2, .14), canMat); c.position.set(b.x + rnd(-.3,.3), b.h + .1, b.z + rnd(-.3,.3)); c.rotation.y = rnd(0,3); c.castShadow = true; scene.add(c);
  }
  const rubbleMat = new THREE.MeshStandardMaterial({color:C(0x8c877e), roughness:.95, flatShading:true});
  for (const b of BOXES.filter(b => b.c === 'concrete' || b.c === 'pillar')){
    for (let i=0;i<6;i++){
      const side = Math.floor(Math.random()*4), r = rnd(.06, .2);
      const x = b.x + (side < 2 ? (side ? 1 : -1) * (b.w/2 + rnd(.05,.35)) : rnd(-b.w/2, b.w/2));
      const z = b.z + (side >= 2 ? (side === 3 ? 1 : -1) * (b.d/2 + rnd(.05,.35)) : rnd(-b.d/2, b.d/2));
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rubbleMat); m.position.set(x, r*.6, z); m.rotation.set(rnd(0,3), rnd(0,3), 0); m.castShadow = true; scene.add(m);
    }
  }
  const stain = new THREE.MeshBasicMaterial({map:TEX.soft, color:0x000000, transparent:true, opacity:.4, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2});
  for (let i=0;i<12;i++){ const m = new THREE.Mesh(new THREE.PlaneGeometry(rnd(1,2.6), rnd(.8,2)), stain); m.rotation.set(-Math.PI/2, 0, rnd(0,3)); m.position.set(rnd(-22,22), .015, rnd(-22,22)); scene.add(m); }
})();
// screen-space lens flare
const FLARE = [
  {t:0,    s:260, bg:'radial-gradient(circle, rgba(255,244,220,.55) 0%, rgba(255,205,150,.14) 32%, rgba(255,190,120,0) 68%)'},
  {t:.32,  s:46,  bg:'radial-gradient(circle, rgba(150,205,255,.28), rgba(150,205,255,0) 70%)'},
  {t:.58,  s:110, bg:'radial-gradient(circle, rgba(255,170,90,0) 54%, rgba(255,170,90,.22) 62%, rgba(255,170,90,0) 72%)'},
  {t:.82,  s:24,  bg:'radial-gradient(circle, rgba(190,255,210,.3), rgba(190,255,210,0) 70%)'},
  {t:1.18, s:70,  bg:'radial-gradient(circle, rgba(210,160,255,.2), rgba(210,160,255,0) 70%)'},
  {t:1.6,  s:160, bg:'radial-gradient(circle, rgba(120,190,255,0) 58%, rgba(120,190,255,.16) 65%, rgba(120,190,255,0) 74%)'},
];
const flareEl = document.getElementById('flare');
FLARE.forEach(f => { const i = document.createElement('i'); i.style.width = i.style.height = f.s + 'px'; i.style.background = f.bg; flareEl.appendChild(i); });
let flareVis = 0, flareCheckT = 0, flareOcc = false;
const _fr = new THREE.Raycaster();
function updateFlare(dt){
  const P = ATMOS[atmos];
  camera.getWorldDirection(_cd);
  const facing = _cd.dot(SUN_DIR);
  _sp.copy(camera.position).addScaledVector(SUN_DIR, 400).project(camera);
  flareCheckT -= dt;
  if (flareCheckT <= 0){ flareCheckT = .1; _fr.set(camera.position, SUN_DIR); _fr.far = 300; flareOcc = _fr.intersectObjects(solidMeshes, false).length > 0; }
  const scoped = me.zoom && WEAPONS[me.weapon] && WEAPONS[me.weapon].scope;
  const on = facing > .2 && Math.abs(_sp.x) < 1.15 && Math.abs(_sp.y) < 1.15 && !flareOcc && !scoped;
  flareVis += ((on ? 1 : 0) - flareVis) * Math.min(1, dt*8);
  const k = flareVis * (P.flare ?? 1) * Math.pow(Math.max(0, facing), 2);
  flareEl.style.opacity = k.toFixed(3);
  if (k < .01) return;
  const W = stage.clientWidth, H = stage.clientHeight, sx = (_sp.x + 1) / 2 * W, sy = (1 - _sp.y) / 2 * H, cx = W/2, cy = H/2;
  FLARE.forEach((f, i) => { const el = flareEl.children[i]; el.style.left = (sx + (cx - sx) * f.t) + 'px'; el.style.top = (sy + (cy - sy) * f.t) + 'px'; });
}

// ================= Rockets & explosions =================
const rockets = [];
const boomLight = new THREE.PointLight(0xff9a40, 0, 22, 2); scene.add(boomLight);
const RK_BODY = new THREE.CylinderGeometry(.04,.04,.36,10); RK_BODY.rotateX(Math.PI/2);
const RK_NOSE = new THREE.ConeGeometry(.04,.14,10); RK_NOSE.rotateX(Math.PI/2); RK_NOSE.translate(0,0,.25);
const RK_MAT = stdMat({color:C(0x58603e), roughness:.6});
function launchRocket(o, e, own){
  const g = new THREE.Group();
  g.add(new THREE.Mesh(RK_BODY, RK_MAT)); g.add(new THREE.Mesh(RK_NOSE, RK_MAT));
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({map:TEX.flash, color:0xffc070, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false}));
  fl.scale.setScalar(.45); fl.position.z = -.25; g.add(fl);
  g.position.copy(o); g.lookAt(e); scene.add(g);
  const T = Math.max(.05, o.distanceTo(e) / WEAPONS[8].rocketSpeed);
  rockets.push({g, o:o.clone(), e:e.clone(), t:0, T, own, puffT:0});
}
function explode(p, own){
  boomLight.position.copy(p).add(new V(0,.6,0)); boomLight.intensity = 55;
  spawnSprite(p.clone().add(new V(0,.4,0)), {tex:TEX.flash, color:new THREE.Color(4, 3.2, 2.1), size:3.4, life:.13, add:true, grow:2});
  for (let i=0;i<14;i++) spawnSprite(p.clone().add(new V(rnd(-.6,.6), rnd(0,.8), rnd(-.6,.6))), {tex:TEX.fire, color:new THREE.Color(rnd(2.2,3), rnd(1.1,1.6), .35), size:rnd(1,2), life:rnd(.35,.7), v:new V(rnd(-3,3), rnd(1,3.5), rnd(-3,3)), grow:1.3, add:true, spin:rnd(-2,2)});
  for (let i=0;i<16;i++) spawnSprite(p.clone().add(new V(rnd(-.9,.9), rnd(0,1), rnd(-.9,.9))), {tex:TEX.smoke, color:C(0x3f3b36), size:rnd(1.2,2.2), life:rnd(2.2,4), v:new V(rnd(-1.4,1.4), rnd(.8,2.2), rnd(-1.4,1.4)), grow:.7, op:.82, fadeIn:.12, spin:rnd(-.6,.6)});
  for (let i=0;i<22;i++) spawnSprite(p, {color:new THREE.Color(3, 2, .8), size:rnd(.04,.09), life:rnd(.4,.9), v:new V(rnd(-1,1), rnd(.2,1.2), rnd(-1,1)).normalize().multiplyScalar(rnd(6,13)), grav:9.8, add:true});
  { const ring = new THREE.Mesh(new THREE.RingGeometry(.15, .3, 48), new THREE.MeshBasicMaterial({color:new THREE.Color(1.6, 1.2, .8), transparent:true, opacity:.55, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide}));
    ring.rotation.x = -Math.PI/2; ring.position.set(p.x, Math.max(.06, p.y - .3), p.z); ring.layers.set(1); scene.add(ring); waves.push({m:ring, t:0}); }
  spawnDebris(p, new V(0,1,0), 10, 2.2);
  if (p.y < .6){
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6), new THREE.MeshBasicMaterial({map:TEX.soft, color:0x000000, transparent:true, opacity:.75, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-3}));
    sc.rotation.x = -Math.PI/2; sc.position.set(p.x, .02, p.z); scene.add(sc); decals.push(sc);
    if (decals.length > 90){ const o = decals.shift(); scene.remove(o); }
  }
  const d = p.distanceTo(me.pos);
  me.shake = Math.max(me.shake || 0, Math.max(0, 1 - d/28) * .4);
  playBoom(p);
  if (!own) return;
  const R = WEAPONS[8].explosive, myTeam = me.team, dealt = {};
  for (const [id, e] of ents){
    if (id === myId || !e.alive || e.team === myTeam || e.inv) continue;
    const dd = new V(e.pos.x, e.pos.y + .9, e.pos.z).distanceTo(p);
    if (dd < R) dealt[id] = WEAPONS[8].dmg * Math.max(.15, 1 - dd / R);
  }
  let any = false;
  for (const id in dealt){ any = true; if (isHost) applyHit(myId, id, dealt[id]); else if (hostConn) hostConn.send({t:'hit', v:id, d:Math.round(dealt[id])}); }
  if (any) hitMarker(false);
}
function updateRockets(dt){
  boomLight.intensity *= Math.pow(.0005, dt);
  for (let i=rockets.length-1;i>=0;i--){
    const r = rockets[i]; r.t += dt;
    const k = Math.min(1, r.t / r.T);
    r.g.position.lerpVectors(r.o, r.e, k);
    r.puffT -= dt;
    if (r.puffT <= 0){ r.puffT = .016; spawnSprite(r.g.position.clone(), {color:C(0xd8d2c6), size:rnd(.2,.32), life:rnd(1.2,1.8), v:new V(rnd(-.15,.15), rnd(.1,.35), rnd(-.15,.15)), grow:1.3, op:.5}); }
    if (k >= 1){ scene.remove(r.g); rockets.splice(i,1); explode(r.e, r.own); }
  }
}

// ================= Audio =================
// Procedural, layered sound engine: 3D positional audio (HRTF), speed-of-sound delay,
// air absorption, outdoor reverb, compressor, per-weapon gunshot synthesis,
// mechanical reload sequences, footsteps, bullet whiz, explosions, ambience.
let actx = null, noiseBuf = null, master = null, muffle = null, dryBus = null, verbSend = null, comp = null;
let volume = .8, ambStarted = false;
try { const v = localStorage.getItem('cephe-volume'); if (v !== null) volume = Math.max(0, Math.min(1, +v)); } catch(e){}
const SPEED_OF_SOUND = 343;

function makeImpulse(ctx, secs, decay){
  const rate = ctx.sampleRate, len = Math.floor(rate*secs), buf = ctx.createBuffer(2, len, rate);
  for (let ch=0; ch<2; ch++){
    const d = buf.getChannelData(ch);
    for (let i=0;i<len;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, decay) * .55;
    // discrete early reflections from the arena walls and nearby trees
    for (const [ms, a] of [[23,.5],[41,.38],[67,.3],[96,.24],[140,.18],[210,.12]]){
      const k = Math.floor((ms + ch*3 + Math.random()*4) / 1000 * rate);
      for (let j=0;j<60 && k+j<len;j++) d[k+j] += (Math.random()*2-1) * a * (1 - j/60);
    }
  }
  return buf;
}
function initAudio(){
  if (actx){ if (actx.state === 'suspended') actx.resume(); return; }
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    const len = actx.sampleRate * 2; noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
    comp = actx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 5; comp.attack.value = .002; comp.release.value = .18;
    muffle = actx.createBiquadFilter(); muffle.type = 'lowpass'; muffle.frequency.value = 20000; muffle.Q.value = .4;
    master = actx.createGain(); master.gain.value = volume;
    dryBus = actx.createGain();
    const verb = actx.createConvolver(); verb.buffer = makeImpulse(actx, 2.2, 3.2);
    const verbLP = actx.createBiquadFilter(); verbLP.type = 'lowpass'; verbLP.frequency.value = 3200;
    verbSend = actx.createGain(); verbSend.gain.value = 1;
    const verbOut = actx.createGain(); verbOut.gain.value = .55;
    dryBus.connect(muffle); verbSend.connect(verb); verb.connect(verbLP); verbLP.connect(verbOut); verbOut.connect(muffle);
    muffle.connect(comp); comp.connect(master); master.connect(actx.destination); master.gain.value = muted ? 0 : volume;
    const L = actx.listener;
    if (L.positionX){ L.positionX.value = 0; }
    startAmbience(); setRainAudio(rainWanted);
  } catch(e){ actx = null; }
}
function setVolume(v){
  volume = v; try { localStorage.setItem('cephe-volume', String(v)); } catch(e){}
  if (master) master.gain.setTargetAtTime(muted ? 0 : v, actx.currentTime, .05);
  document.querySelectorAll('.volIn').forEach(i => { if (+i.value !== Math.round(v*100)) i.value = Math.round(v*100); });
}

// ---- output chain for one sound event: optional 3D position, air absorption, reverb send
const _lp = new V(), _lf = new V();
function voice(pos, opts){
  opts = opts || {};
  const t0 = actx.currentTime + .005;
  const g = actx.createGain(); g.gain.value = opts.gain ?? 1;
  let dist = 0, delay = 0;
  if (pos){
    camera.getWorldPosition(_lp); dist = _lp.distanceTo(pos);
    delay = opts.noDelay ? 0 : dist / SPEED_OF_SOUND;
    const air = actx.createBiquadFilter(); air.type = 'lowpass';
    air.frequency.value = Math.max(700, 18000 / (1 + dist * .045)); air.Q.value = .3;
    const pan = actx.createPanner();
    pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = opts.ref || 3; pan.rolloffFactor = opts.roll ?? 1.1; pan.maxDistance = 400;
    if (pan.positionX){ pan.positionX.value = pos.x; pan.positionY.value = pos.y; pan.positionZ.value = pos.z; } else pan.setPosition(pos.x, pos.y, pos.z);
    g.connect(air); air.connect(pan); pan.connect(dryBus);
    const send = actx.createGain(); send.gain.value = Math.min(.9, (opts.verb ?? .3) + dist * .012); air.connect(send); send.connect(verbSend);
  } else {
    g.connect(dryBus);
    const send = actx.createGain(); send.gain.value = opts.verb ?? .22; g.connect(send); send.connect(verbSend);
  }
  return {out:g, t:t0 + delay, dist};
}
function updateListener(){
  if (!actx) return;
  const L = actx.listener, t = actx.currentTime;
  camera.getWorldPosition(_lp); camera.getWorldDirection(_lf);
  if (L.positionX){
    L.positionX.setTargetAtTime(_lp.x, t, .01); L.positionY.setTargetAtTime(_lp.y, t, .01); L.positionZ.setTargetAtTime(_lp.z, t, .01);
    L.forwardX.setTargetAtTime(_lf.x, t, .01); L.forwardY.setTargetAtTime(_lf.y, t, .01); L.forwardZ.setTargetAtTime(_lf.z, t, .01);
    L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
  } else { L.setPosition(_lp.x, _lp.y, _lp.z); L.setOrientation(_lf.x, _lf.y, _lf.z, 0, 1, 0); }
}

// ---- synthesis primitives
function noise(dest, t, o){
  const src = actx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = actx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); f.Q.value = o.q ?? .8;
  if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.sweep || o.decay));
  const g = actx.createGain(), a = o.attack ?? .001, dcy = o.decay ?? .1;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.gain ?? 1, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + dcy);
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t, Math.random() * 1.4); src.stop(t + a + dcy + .05);
}
function tone(dest, t, o){
  const osc = actx.createOscillator(); osc.type = o.wave || 'sine';
  osc.frequency.setValueAtTime(o.f0, t); if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + (o.sweep || o.decay));
  const g = actx.createGain(), a = o.attack ?? .002, dcy = o.decay ?? .1;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.gain ?? 1, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + dcy);
  osc.connect(g); g.connect(dest); osc.start(t); osc.stop(t + a + dcy + .05);
}
let satCurve = null;
function saturator(dest, amount){
  if (!satCurve){ satCurve = new Float32Array(1024); for (let i=0;i<1024;i++){ const x = i/511.5 - 1; satCurve[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); } }
  const ws = actx.createWaveShaper(); ws.curve = satCurve; ws.oversample = '2x';
  const pre = actx.createGain(); pre.gain.value = amount || 1; pre.connect(ws); ws.connect(dest); return pre;
}
const click = (d, t, g, f) => { noise(d, t, {type:'highpass', f:f || 2500, q:.7, gain:g, decay:.012}); tone(d, t, {f0:(f || 2500)*1.3, gain:g*.35, decay:.02}); };
const slide = (d, t, g, f0, f1) => noise(d, t, {type:'bandpass', f:f0 || 1800, f2:f1 || 3400, q:2.2, gain:g, attack:.01, decay:.07});
const thunk = (d, t, g) => { tone(d, t, {f0:220, f1:110, gain:g, decay:.06}); noise(d, t, {type:'lowpass', f:900, gain:g*.6, decay:.04}); };

// ---- weapons: per-weapon layer recipes
const SHOT = [
  {click:.5, clickF:4200, body:.9, bodyF:1900, bodyQ:.8, bodyDcy:.07, th:.75, th0:150, th1:52, thDcy:.09, tail:.35, tailF:1300, tailDcy:.5, sat:1.4, mech:'slide'},
  {click:.6, clickF:3600, body:1.15, bodyF:1150, bodyQ:.7, bodyDcy:.13, th:1.1, th0:115, th1:38, thDcy:.17, tail:.6, tailF:950, tailDcy:.95, sat:1.8, mech:'slide'},
  {click:.4, clickF:5200, body:.7, bodyF:2300, bodyQ:.9, bodyDcy:.05, th:.45, th0:170, th1:65, thDcy:.06, tail:.25, tailF:1600, tailDcy:.35, sat:1.3},
  {click:.55, clickF:4400, body:.95, bodyF:1650, bodyQ:.8, bodyDcy:.08, th:.75, th0:125, th1:45, thDcy:.1, tail:.45, tailF:1150, tailDcy:.7, sat:1.6},
  {click:.6, clickF:4000, body:1.05, bodyF:1300, bodyQ:.75, bodyDcy:.12, th:.95, th0:105, th1:40, thDcy:.14, tail:.6, tailF:950, tailDcy:1.0, sat:1.8},
  {click:.5, clickF:3500, body:1.15, bodyF:900, bodyQ:.6, bodyDcy:.16, th:1.25, th0:95, th1:34, thDcy:.21, tail:.75, tailF:800, tailDcy:1.15, sat:2, mech:'pump'},
  {click:.5, clickF:4200, body:1.0, bodyF:1450, bodyQ:.8, bodyDcy:.09, th:.85, th0:115, th1:42, thDcy:.11, tail:.5, tailF:1050, tailDcy:.8, sat:1.7},
  {click:.75, clickF:3000, body:1.25, bodyF:1000, bodyQ:.7, bodyDcy:.19, th:1.35, th0:85, th1:30, thDcy:.26, tail:.95, tailF:700, tailDcy:1.7, sat:2.1, mech:'bolt'},
  {click:.3, clickF:2500, body:.5, bodyF:700, bodyQ:.6, bodyDcy:.25, th:1.2, th0:75, th1:28, thDcy:.3, tail:.8, tailF:600, tailDcy:1.2, sat:1.5, mech:'rocket'},
];
function playShot(w, pos){
  if (!actx) return;
  const P = SHOT[w] || SHOT[3];
  const v = voice(pos, {gain:pos ? 1.25 : .95, verb:pos ? .3 : .2, ref:4});
  const t = v.t, d = saturator(v.out, P.sat);
  const far = Math.min(1, v.dist / 60);
  noise(d, t, {type:'highpass', f:P.clickF, q:.7, gain:P.click * (1 - far*.7), decay:.012, attack:.0005});
  noise(d, t, {type:'bandpass', f:P.bodyF * (1 + Math.random()*.08), q:P.bodyQ, gain:P.body, decay:P.bodyDcy});
  tone(d, t, {f0:P.th0 * (1 + (Math.random()-.5)*.06), f1:P.th1, gain:P.th, decay:P.thDcy});
  noise(v.out, t + .008, {type:'lowpass', f:P.tailF, q:.5, gain:P.tail * (1 + far*.6), attack:.006, decay:P.tailDcy});
  if (pos && v.dist > 40) noise(v.out, t + .05, {type:'lowpass', f:300, gain:.5, attack:.03, decay:1.4});
  if (pos && v.dist > 25) return;
  const m = v.out;
  if (P.mech === 'slide') click(m, t + .045, .18, 3200);
  if (P.mech === 'pump'){ slide(m, t + .38, .45, 900, 1800); click(m, t + .46, .3, 2000); slide(m, t + .52, .4, 1800, 900); click(m, t + .6, .32, 2200); }
  if (P.mech === 'bolt'){ click(m, t + .55, .3, 2600); slide(m, t + .63, .4, 1500, 2800); slide(m, t + .8, .4, 2800, 1500); click(m, t + .9, .32, 2400); }
  if (P.mech === 'rocket'){ noise(m, t, {type:'bandpass', f:500, f2:2400, sweep:.5, q:1.2, gain:.9, attack:.02, decay:.7}); }
}
function playSlide(pos){
  if (!actx) return;
  const v = voice(pos || null, {verb:.08, gain:pos ? .8 : 1, ref:2}), d = v.out, t = v.t;
  noise(d, t, {type:'bandpass', f:750, f2:320, sweep:.75, q:.8, gain:.55, attack:.03, decay:.75});
  noise(d, t, {type:'lowpass', f:300, gain:.3, attack:.02, decay:.5});
  for (let i=0;i<12;i++) noise(d, t + Math.random()*.7, {type:'highpass', f:3200 + Math.random()*2000, gain:.1, decay:.02});
}
function playDry(){ if (!actx) return; const v = voice(null, {verb:.05}); click(v.out, v.t, .35, 3800); }
function playSwitch(){ if (!actx) return; const v = voice(null, {verb:.05}); noise(v.out, v.t, {type:'lowpass', f:900, gain:.18, attack:.03, decay:.16}); click(v.out, v.t + .12, .22, 2800); }
function playReload(w, dur){
  if (!actx) return;
  const v = voice(null, {verb:.08}), d = v.out, t = v.t, s = dur / 1000;
  if (w === 5){
    const n = 4, gap = (s - .5) / n;
    for (let i=0;i<n;i++){ noise(d, t + .1 + i*gap, {type:'bandpass', f:1400, q:1.5, gain:.25, attack:.01, decay:.06}); click(d, t + .18 + i*gap, .3, 2100); }
    slide(d, t + s - .32, .45, 900, 1800); click(d, t + s - .24, .32, 2000); slide(d, t + s - .16, .4, 1800, 900);
    return;
  }
  if (w === 8){
    noise(d, t + .05, {type:'lowpass', f:600, gain:.3, attack:.05, decay:.4}); thunk(d, t + s*.5, .55); slide(d, t + s*.62, .35, 700, 1400); click(d, t + s*.8, .4, 1700);
    return;
  }
  click(d, t + .02, .25, 2600);
  slide(d, t + .1, .3, 2400, 1200);
  noise(d, t + .2, {type:'lowpass', f:700, gain:.15, attack:.04, decay:.25});
  thunk(d, t + s*.55, .5); click(d, t + s*.57, .32, 2200);
  if (w <= 1){ slide(d, t + s*.82, .4, 2000, 3600); click(d, t + s*.88, .35, 3000); }
  else { slide(d, t + s*.78, .4, 1600, 3000); slide(d, t + s*.86, .35, 3000, 1600); click(d, t + s*.9, .38, 2600); }
}
function playHit(head, kill){
  if (!actx) return;
  const v = voice(null, {verb:.05}), d = v.out, t = v.t;
  tone(d, t, {f0:1900, f1:1500, gain:.28, decay:.05}); noise(d, t, {type:'highpass', f:6000, gain:.15, decay:.02});
  if (head){ tone(d, t, {f0:2800, gain:.22, decay:.3}); tone(d, t, {f0:4130, gain:.14, decay:.25}); }
  if (kill){ tone(d, t + .06, {f0:880, gain:.22, decay:.18, wave:'triangle'}); tone(d, t + .14, {f0:1320, gain:.22, decay:.3, wave:'triangle'}); }
}
function playHurt(){
  if (!actx) return;
  const v = voice(null, {verb:.05}), d = v.out, t = v.t;
  tone(d, t, {f0:95, f1:45, gain:.9, decay:.18}); noise(d, t, {type:'lowpass', f:400, gain:.5, decay:.12});
  muffleFor(.35, 1400);
}
let muffleUntil = 0, muffleFreq = 20000;
function muffleFor(sec, freq){ if (!actx) return; muffleUntil = Math.max(muffleUntil, actx.currentTime + sec); muffleFreq = Math.min(muffleFreq, freq); }
function playStep(pos, gain, run){
  if (!actx) return;
  const v = voice(pos, {gain:gain || .5, verb:.06, ref:1.5, roll:1.6, noDelay:true}), d = v.out, t = v.t;
  noise(d, t, {type:'bandpass', f:500 + Math.random()*250, q:1.1, gain:.6, attack:.004, decay:.07 + (run ? .02 : 0)});
  noise(d, t + .01, {type:'highpass', f:2800 + Math.random()*1500, q:.6, gain:.22, attack:.002, decay:.05});
  for (let i=0;i<3;i++) noise(d, t + .015 + Math.random()*.05, {type:'highpass', f:4000, gain:.08, decay:.01});
}
function playLand(h){
  if (!actx) return;
  const v = voice(null, {verb:.1}), d = v.out, t = v.t;
  tone(d, t, {f0:120, f1:50, gain:.6*h, decay:.12}); noise(d, t, {type:'bandpass', f:600, gain:.7*h, decay:.1});
  noise(d, t + .02, {type:'highpass', f:3500, gain:.25*h, decay:.08});
}
function playWhiz(pos){
  if (!actx) return;
  const v = voice(pos, {gain:1, verb:.1, ref:1, noDelay:true}), d = v.out, t = v.t;
  noise(d, t, {type:'highpass', f:3500, gain:.5, decay:.015, attack:.0005});
  noise(d, t, {type:'bandpass', f:3200, f2:800, sweep:.16, q:4, gain:.55, attack:.01, decay:.18});
}
function playImpact(pos){
  if (!actx || Math.random() > .5) return;
  const v = voice(pos, {gain:.45, verb:.25, ref:2}), d = v.out, t = v.t;
  noise(d, t, {type:'bandpass', f:900, gain:.5, decay:.05});
  if (Math.random() < .3) tone(d, t + .01, {f0:2600 + Math.random()*1800, f1:900, sweep:.25, gain:.12, decay:.28});
}
function playBoom(p){
  if (!actx) return;
  const v = voice(p, {gain:1.6, verb:.55, ref:6, roll:.8}), t = v.t, d = saturator(v.out, 2.4);
  tone(d, t, {f0:68, f1:22, gain:1.6, decay:1.3, sweep:1.1});
  noise(d, t, {type:'lowpass', f:1800, f2:260, sweep:.8, q:.5, gain:1.3, attack:.003, decay:1.6});
  noise(d, t, {type:'highpass', f:2500, gain:.6, decay:.06, attack:.0008});
  for (let i=0;i<10;i++) noise(v.out, t + .05 + Math.random()*.5, {type:'highpass', f:2000 + Math.random()*3000, gain:.12 + Math.random()*.12, decay:.02});
  for (let i=0;i<14;i++) noise(v.out, t + .4 + Math.random()*1.6, {type:'bandpass', f:1500 + Math.random()*2500, q:2, gain:.05 + Math.random()*.05, decay:.03});
  noise(v.out, t + .2, {type:'lowpass', f:200, gain:.9, attack:.2, decay:2.5});
  if (v.dist < 9){
    muffleFor(2.2, 600);
    const r = voice(null, {verb:0}); tone(r.out, r.t + .05, {f0:3900, gain:.06 * (1 - v.dist/9), attack:.2, decay:2.6});
  }
}
function playThunder(close){
  if (!actx) return;
  const v = voice(null, {verb:.7, gain:1.2}), d = saturator(v.out, 1.6), t = v.t;
  if (close) noise(d, t, {type:'highpass', f:1800, gain:.7, attack:.002, decay:.25});
  noise(d, t + (close ? .05 : .3), {type:'lowpass', f:220, f2:90, sweep:3, q:.4, gain:1.1, attack:.35, decay:3.8});
  tone(d, t + .2, {f0:48, f1:28, sweep:3, gain:.7, attack:.3, decay:3.2});
  for (let i=0;i<6;i++) noise(d, t + .4 + Math.random()*2.2, {type:'lowpass', f:300, gain:.35, attack:.1, decay:.6});
}
let rainGain = null, rainWanted = false;
function setRainAudio(on){
  rainWanted = on;
  if (!actx) return;
  if (!rainGain){
    const src = actx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const hp = actx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7500;
    rainGain = actx.createGain(); rainGain.gain.value = 0;
    src.connect(hp); hp.connect(lp); lp.connect(rainGain); rainGain.connect(dryBus); src.start();
  }
  rainGain.gain.setTargetAtTime(on ? .13 : 0, actx.currentTime, .6);
}
function playRoundEnd(win){
  if (!actx) return;
  const v = voice(null, {verb:.5}), d = v.out, t = v.t;
  const notes = win ? [523, 659, 784, 1047] : [440, 415, 392, 330];
  notes.forEach((f,i) => { tone(d, t + i*.16, {f0:f, gain:.18, decay:.5, wave:'triangle'}); tone(d, t + i*.16, {f0:f*2, gain:.05, decay:.4}); });
}
function playHeartbeat(){
  if (!actx) return;
  const v = voice(null, {verb:0}), d = v.out, t = v.t;
  tone(d, t, {f0:62, f1:45, gain:.7, decay:.12}); tone(d, t + .17, {f0:55, f1:40, gain:.5, decay:.14});
}

// ---- ambience: wind, distant battle, birds
function startAmbience(){
  if (ambStarted || !actx) return; ambStarted = true;
  const src = actx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = .6;
  const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 340; bp.Q.value = .5;
  const g = actx.createGain(); g.gain.value = .07;
  const lfo = actx.createOscillator(); lfo.frequency.value = .07; const lfoG = actx.createGain(); lfoG.gain.value = .045;
  lfo.connect(lfoG); lfoG.connect(g.gain);
  const lfo2 = actx.createOscillator(); lfo2.frequency.value = .11; const lfo2G = actx.createGain(); lfo2G.gain.value = 180;
  lfo2.connect(lfo2G); lfo2G.connect(lp.frequency);
  src.connect(lp); lp.connect(bp); bp.connect(g); g.connect(dryBus);
  src.start(); lfo.start(); lfo2.start();
  const scheduleBattle = () => {
    setTimeout(() => {
      if (actx && started){
        const a = Math.random()*Math.PI*2, pos = new V(Math.cos(a)*220, 2, Math.sin(a)*220);
        const n = 1 + Math.floor(Math.random()*5), w = [3,3,6,2,7][Math.floor(Math.random()*5)];
        for (let i=0;i<n;i++) setTimeout(() => playShot(w, pos), i * (w === 7 ? 900 : 110) + Math.random()*40);
      }
      scheduleBattle();
    }, 7000 + Math.random()*14000);
  };
  const scheduleBird = () => {
    setTimeout(() => {
      const AT = typeof ATMOS !== 'undefined' ? ATMOS[atmos] : {};
      if (actx && AT.night && !AT.rain){
        const a = Math.random()*Math.PI*2, pos = new V(Math.cos(a)*25, .3, Math.sin(a)*25), v = voice(pos, {gain:.18, verb:.2, ref:8});
        for (let i=0;i<8;i++) tone(v.out, v.t + i*.055, {f0:4300 + Math.random()*200, gain:.3, decay:.03});
      } else if (actx && !AT.rain){
        const a = Math.random()*Math.PI*2, pos = new V(Math.cos(a)*40, 8, Math.sin(a)*40);
        const v = voice(pos, {gain:.25, verb:.35, ref:10}), base = 2600 + Math.random()*1800;
        const n = 2 + Math.floor(Math.random()*4);
        for (let i=0;i<n;i++) tone(v.out, v.t + i*.13, {f0:base*(1 + Math.random()*.15), f1:base*(1.25 + Math.random()*.3), sweep:.07, gain:.25, decay:.09});
      }
      scheduleBird();
    }, 4000 + Math.random()*9000);
  };
  scheduleBattle(); scheduleBird();
}

// ---- per-frame audio state: listener, muffle (low health / near explosions), heartbeat
let nextBeat = 0;
function updateAudio(hp, alive){
  if (!actx) return;
  updateListener();
  const t = actx.currentTime;
  let target = 20000;
  if (started && !alive) target = 900;
  else if (started && hp < 30) target = 2400;
  if (t < muffleUntil) target = Math.min(target, muffleFreq); else muffleFreq = 20000;
  muffle.frequency.setTargetAtTime(target, t, target < 5000 ? .05 : .4);
  if (started && alive && hp < 30 && t > nextBeat){ playHeartbeat(); nextBeat = t + .85; }
}
// compatibility shim for any remaining generic calls
function sfx(kind, vol){ if (kind === 'hit') playHit(vol >= 1, false); else if (kind === 'hurt') playHurt(); }

// ================= Game state =================
let isHost = false, myId = null, started = false, now = 0;
let score = [0,0], goal = 30, diff = 1, over = null, overView = null;
let humanSeq = 0, botSeq = [0,0];
const ents = new Map();        // id -> entity (host: authoritative, client: mirror)
const avatars = new Map();     // id -> {av, team, wasAlive}
let fxQ = [], evQ = [];
const me = {
  name:'Asker'+Math.floor(Math.random()*90+10), team:0,
  pos:new V(0,0,20), vel:new V(), yaw:0, pitch:0, grounded:true, rs:0,
  weapon:3, ammo:WEAPONS.map(w => w.mag), reloading:false, reloadEnd:0, nextFire:0, latched:false,
  zoom:false, recoil:0, prevHp:100, deadAt:0,
};
function newEnt(id, kind, team, name){
  return {id, kind, team, name, pos:new V(0,0,0), yaw:0, pitch:0, hp:100, alive:false, weapon:3, rs:0, k:0, d:0,
          inv:false, invUntil:0, respawnAt:0, lastHurt:-1e9,
          ai: kind === 'b' ? {target:null, scanT:0, react:0, nextShot:0, burst:0, strafe:1, strafeT:0, wp:null, lastSeen:null, stuckT:0, stuckPos:new V()} : null};
}
const myEnt = () => ents.get(myId);
const cleanName = s => (typeof s === 'string' ? s : '').replace(/[\u0000-\u001f]/g,'').trim().slice(0,14) || 'Asker';
function nameOf(id){ const e = ents.get(id); if (!e) return 'Bilinmeyen'; return id === myId ? e.name + ' (sen)' : e.name; }

// ================= Menu =================
$('nameIn').value = me.name;
document.querySelectorAll('.team').forEach(b => b.onclick = () => {
  me.team = +b.dataset.team;
  document.querySelectorAll('.team').forEach(x => x.setAttribute('aria-pressed', x === b));
});
function readName(){ me.name = cleanName($('nameIn').value) || me.name; }
$('hostBtn').onclick = () => {
  readName(); initAudio();
  isHost = true; myId = 'h0';
  ents.set(myId, newEnt(myId, 'h', me.team, me.name));
  $('menu').hidden = true; showLobby(); openPeerHost();
};
$('joinBtn').onclick = () => { readName(); initAudio(); $('menu').hidden = true; $('joinO').hidden = false; $('joinCode').focus(); };
$('joinBack').onclick = () => { $('joinO').hidden = true; $('menu').hidden = false; showPanel('play'); };
$('joinCode').addEventListener('keydown', e => { if (e.key === 'Enter' && $('joinCode').value.trim().length <= 8){ e.preventDefault(); $('joinGo').click(); } });

// ================= Networking =================
const ICE = {iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:stun.cloudflare.com:3478'}]};
const conns = new Map();   // host: id -> conn
let hostConn = null, roomCode = null, pendingInvite = null;
const keepPCs = [];
function makeConn(raw){ const c = {raw, onmsg:null, onclose:null, closed:false}; c.send = o => { try { raw(JSON.stringify(o)); } catch(e){} }; return c; }
function deliver(c, data){ if (typeof data !== 'string') return; let m; try { m = JSON.parse(data); } catch(e){ return; } if (m && typeof m === 'object' && c.onmsg) c.onmsg(m); }
function closeConn(c){ if (c.closed) return; c.closed = true; if (c.onclose) c.onclose(); }
function wrapPeer(pc){
  const c = makeConn(s => { if (pc.open) pc.send(s); });
  pc.on('data', d => deliver(c, d)); pc.on('close', () => closeConn(c)); pc.on('error', () => closeConn(c));
  return c;
}
function wrapDc(dc, pc){
  const c = makeConn(s => { if (dc.readyState === 'open') dc.send(s); });
  dc.onmessage = e => deliver(c, e.data); dc.onclose = () => closeConn(c);
  pc.addEventListener('connectionstatechange', () => { if (['failed','closed'].includes(pc.connectionState)) closeConn(c); });
  return c;
}
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randCode = () => Array.from({length:5}, () => CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]).join('');

function peerHost(){
  return new Promise((res, rej) => {
    if (!window.Peer) return rej({type:'nolib'});
    let p; const code = randCode();
    try { p = new Peer(PEER_PREFIX + code, {debug:0, config:ICE}); } catch(e){ return rej(e); }
    let done = false;
    const to = setTimeout(() => { if (!done){ done = true; try{p.destroy();}catch(e){} rej({type:'zaman aşımı'}); } }, 5000);
    p.on('open', () => { if (done) return; done = true; clearTimeout(to); res({p, code}); });
    p.on('error', e => { if (done) return; done = true; clearTimeout(to); try{p.destroy();}catch(_){} rej(e); });
    p.on('connection', pc => { pc.on('open', () => hostAddConn(wrapPeer(pc))); });
  });
}
async function openPeerHost(){
  $('codeStatus').textContent = 'Oda kodu alınıyor…';
  if (!window.Peer) return peerFail('kod kütüphanesi yüklenemedi');
  let last = null;
  for (let i=0;i<3;i++){
    try {
      const {code} = await peerHost();
      roomCode = code; $('roomCode').textContent = code; $('codeBox').hidden = false;
      $('codeStatus').textContent = 'Bu kodu arkadaşına gönder. O "Odaya katıl" deyip kodu yazacak.';
      updateNet(); return;
    } catch(e){ last = e; if (!e || e.type !== 'unavailable-id') break; }
  }
  peerFail(last && (last.type || last.message));
}
function peerFail(reason){
  roomCode = null; $('codeBox').hidden = true; $('showManual').hidden = true;
  $('codeStatus').textContent = 'Bu sayfa kısa oda kodu sunucusuna ulaşamıyor' + (reason ? ` (${reason})` : '') +
    '. Aşağıdaki davet koduyla bağlanabilirsiniz. Dosyayı indirip açarsanız kısa kod da çalışır.';
  showManual(); updateNet();
}
function showManual(){
  $('manualBox').hidden = false; $('showManual').hidden = true;
  if (!pendingInvite && !inviteBusy) newInvite();
}
function peerJoin(code){
  return new Promise((res, rej) => {
    if (!window.Peer) return rej({type:'nolib'});
    let p; try { p = new Peer({debug:0, config:ICE}); } catch(e){ return rej(e); }
    let done = false;
    const to = setTimeout(() => { if (!done){ done = true; try{p.destroy();}catch(e){} rej({type:'timeout'}); } }, 12000);
    p.on('open', () => {
      const pc = p.connect(PEER_PREFIX + code, {reliable:true});
      pc.on('open', () => { if (done) return; done = true; clearTimeout(to); res(wrapPeer(pc)); });
    });
    p.on('error', e => { if (done) return; done = true; clearTimeout(to); try{p.destroy();}catch(_){} rej(e); });
  });
}
// --- manual WebRTC codes ---
function waitIce(pc){
  return new Promise(r => {
    if (pc.iceGatheringState === 'complete') return r();
    const t = setTimeout(r, 4000);
    pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete'){ clearTimeout(t); r(); } });
  });
}
const toB64 = u8 => { let s = ''; for (let i=0;i<u8.length;i++) s += String.fromCharCode(u8[i]); return btoa(s); };
const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function encodeDesc(desc){
  const json = JSON.stringify({t:desc.type, s:desc.sdp});
  if (window.CompressionStream){
    try {
      const st = new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      return 'Z' + toB64(new Uint8Array(await new Response(st).arrayBuffer()));
    } catch(e){}
  }
  return 'J' + btoa(unescape(encodeURIComponent(json)));
}
async function decodeDesc(code){
  code = code.replace(/\s+/g, '');
  let json;
  if (code[0] === 'Z'){
    const st = new Blob([fromB64(code.slice(1))]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    json = await new Response(st).text();
  } else if (code[0] === 'J') json = decodeURIComponent(escape(atob(code.slice(1))));
  else throw new Error('bad');
  const o = JSON.parse(json); return {type:o.t, sdp:o.s};
}
async function makeInvite(){
  const pc = new RTCPeerConnection(ICE); keepPCs.push(pc);
  const dc = pc.createDataChannel('g');
  const conn = wrapDc(dc, pc);
  dc.onopen = () => {
    hostAddConn(conn);
    if (pendingInvite && pendingInvite.pc === pc) pendingInvite = null;
    newInvite(true);
    $('manualStatus').textContent = 'Arkadaşın bağlandı! Başka biri gelecekse yeni davet kodunu gönder.';
  };
  pc.addEventListener('connectionstatechange', () => {
    if (pc.connectionState === 'failed') $('manualStatus').textContent = 'Bağlantı kurulamadı. Ağlarınızdan biri doğrudan bağlantıya izin vermiyor olabilir; farklı bir ağ ya da "Yeni kod oluştur" ile tekrar deneyin.';
  });
  await pc.setLocalDescription(await pc.createOffer());
  await waitIce(pc);
  return {pc, code: await encodeDesc(pc.localDescription), accept: async ans => pc.setRemoteDescription(await decodeDesc(ans))};
}
async function answerInvite(code){
  const pc = new RTCPeerConnection(ICE); keepPCs.push(pc);
  const connP = new Promise(res => {
    pc.ondatachannel = e => { const dc = e.channel, c = wrapDc(dc, pc); if (dc.readyState === 'open') res(c); else dc.onopen = () => res(c); };
  });
  await pc.setRemoteDescription(await decodeDesc(code));
  await pc.setLocalDescription(await pc.createAnswer());
  await waitIce(pc);
  return {code: await encodeDesc(pc.localDescription), conn: connP};
}
async function copyText(ta){
  try { await navigator.clipboard.writeText(ta.value || ta.textContent); return true; }
  catch(e){ try { const r = document.createRange(); if (ta.select) ta.select(); else { r.selectNodeContents(ta); getSelection().removeAllRanges(); getSelection().addRange(r); } return document.execCommand('copy'); } catch(_){ return false; } }
}
function flashBtn(btn, ok){ const t = btn.textContent; btn.textContent = ok ? 'Kopyalandı' : 'Seçili, Ctrl+C ile kopyala'; setTimeout(() => btn.textContent = t, 1600); }
$('copyCode').onclick = async e => flashBtn(e.currentTarget, roomCode && await copyText($('roomCode')));
$('copyInvite').onclick = async e => flashBtn(e.currentTarget, await copyText($('inviteCode')));
$('copyAnswer').onclick = async e => flashBtn(e.currentTarget, await copyText($('answerCode')));
let inviteBusy = false;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('zaman aşımı')), ms))]);
async function newInvite(keepStatus){
  if (inviteBusy) return;
  inviteBusy = true; $('inviteCode').value = ''; $('answerIn').value = '';
  if (!keepStatus) $('manualStatus').textContent = 'Davet kodu hazırlanıyor…';
  try {
    if (!window.RTCPeerConnection) throw new Error('tarayıcı doğrudan bağlantıyı desteklemiyor');
    pendingInvite = await withTimeout(makeInvite(), 12000);
    $('inviteCode').value = pendingInvite.code;
    if (!keepStatus) $('manualStatus').textContent = 'Davet kodu hazır. Kopyalayıp arkadaşına gönder.';
  } catch(e){
    pendingInvite = null;
    $('manualStatus').textContent = `Davet kodu oluşturulamadı (${e && e.message || e}). "Yeni kod oluştur" ile tekrar dene.`;
  }
  inviteBusy = false;
}
$('showManual').onclick = showManual;
$('mkInvite').onclick = () => newInvite();
async function tryAccept(){
  const v = $('answerIn').value.replace(/\s+/g, '');
  if (!v) return;
  if (!pendingInvite){ $('manualStatus').textContent = 'Önce davet kodunun hazırlanmasını bekle.'; return; }
  if (pendingInvite.pc.signalingState !== 'have-local-offer') return;
  try { await pendingInvite.accept(v); $('manualStatus').textContent = 'Bağlanılıyor…'; }
  catch(e){ $('manualStatus').textContent = 'Bu cevap kodu okunamadı. Tamamını kopyaladığından ve en son gönderdiğin davet koduna verilen cevap olduğundan emin ol.'; }
}
$('acceptBtn').onclick = tryAccept;
$('answerIn').addEventListener('paste', () => setTimeout(tryAccept, 50));
$('joinGo').onclick = async () => {
  const code = $('joinCode').value.trim(), st = $('joinStatus');
  if (!code) return;
  $('joinGo').disabled = true;
  if (code.replace(/\s/g,'').length <= 8){
    st.textContent = 'Odaya bağlanılıyor…';
    try { clientAttach(await peerJoin(code.toUpperCase().replace(/\s/g,''))); st.textContent = 'Bağlandı!'; }
    catch(e){
      st.textContent = e && e.type === 'peer-unavailable' ? 'Bu kodla açık bir oda bulunamadı. Kodu kontrol et.'
        : 'Bu sayfa kısa kod sunucusuna ulaşamıyor. Arkadaşından oda menüsündeki davet kodunu iste ve buraya yapıştır.';
      $('joinGo').disabled = false;
    }
  } else {
    st.textContent = 'Cevap kodu hazırlanıyor…';
    try {
      if (!window.RTCPeerConnection) throw new Error('nortc');
      const r = await withTimeout(answerInvite(code), 12000);
      $('answerCode').value = r.code; $('answerBox').hidden = false;
      st.textContent = 'Cevap kodunu arkadaşına gönder ve bekle.';
      const conn = await r.conn; clientAttach(conn);
    } catch(e){ st.textContent = 'Davet kodu okunamadı. Tamamını kopyaladığından emin ol.'; $('joinGo').disabled = false; }
  }
};

// --- host side ---
function hostAddConn(conn){
  conn.onmsg = m => hostMsg(conn, m);
  conn.onclose = () => {
    if (!conn.id) return;
    const e = ents.get(conn.id); if (e) addFeed(`${e.name} ayrıldı`);
    ents.delete(conn.id); conns.delete(conn.id); updateLobby(); updateNet();
  };
}
function hostMsg(conn, m){
  if (m.t === 'hi' && !conn.id){
    conn.id = 'h' + (++humanSeq);
    const e = newEnt(conn.id, 'h', m.team === 1 ? 1 : 0, cleanName(m.name));
    ents.set(conn.id, e); conns.set(conn.id, conn);
    if (started) spawnEnt(e);
    conn.send({t:'id', id:conn.id});
    addFeed(`${e.name} odaya katıldı`); updateLobby(); updateNet(); hostBroadcast(true);
    return;
  }
  if (!conn.id) return;
  const e = ents.get(conn.id); if (!e) return;
  if (m.t === 'st'){
    if (Array.isArray(m.p) && m.rs === e.rs && e.alive){
      const x = +m.p[0], y = +m.p[1], z = +m.p[2];
      if (isFinite(x) && isFinite(y) && isFinite(z)) e.pos.set(Math.max(-A,Math.min(A,x)), Math.max(0,Math.min(6,y)), Math.max(-A,Math.min(A,z)));
    }
    e.yaw = +m.y || 0; e.pitch = +m.x || 0; e.weapon = (m.w|0) % NW; e.slide = !!m.s;
  } else if (m.t === 'sh'){
    if (Array.isArray(m.o) && Array.isArray(m.e)){ const f = {o:m.o.slice(0,3), e:m.e.slice(0,12), w:(m.w|0)%NW, by:conn.id}; fxQ.push(f); renderFx(f); }
  } else if (m.t === 'hit'){
    applyHit(conn.id, String(m.v), Math.min(200, Math.max(0, +m.d || 0)));
  } else if (m.t === 'bot'){
    changeBots(m.team === 1 ? 1 : 0, m.n > 0 ? 1 : -1);
  }
}
const encEnt = e => [e.id, e.kind==='b'?1:0, e.team, e.name, r2(e.pos.x), r2(e.pos.y), r2(e.pos.z), r2(e.yaw), r2(e.pitch),
  Math.max(0,Math.ceil(e.hp)), e.alive?1:0, e.weapon, e.rs, e.k, e.d, e.inv?1:0, e.slide?1:0];
let lastBroadcast = 0;
function hostBroadcast(force){
  if (!force && now - lastBroadcast < 50) return;
  lastBroadcast = now;
  if (!conns.size){ fxQ = []; evQ = []; return; }
  const msg = JSON.stringify({t:'w', st:started?1:0, g:goal, sc:score,
    ov: over ? [over.win, Math.max(0, Math.ceil((over.until-now)/1000))] : 0,
    e:[...ents.values()].map(encEnt), fx:fxQ, ev:evQ});
  fxQ = []; evQ = [];
  for (const c of conns.values()) try { c.raw(msg); } catch(e){}
}
function changeBots(team, delta){
  const mine = [...ents.values()].filter(e => e.kind === 'b' && e.team === team);
  if (delta > 0 && mine.length < MAX_BOTS){
    const n = ++botSeq[team], id = `b${team}_${n}`;
    const e = newEnt(id, 'b', team, `${team ? 'Kızıl' : 'Mavi'} Er ${n}`);
    ents.set(id, e); if (started) spawnEnt(e);
  } else if (delta < 0 && mine.length){
    ents.delete(mine[mine.length-1].id);
  }
  updateLobby(); hostBroadcast(true);
}
function spawnEnt(e){
  let best = SPAWNS[e.team][0], bd = -1;
  for (const s of SPAWNS[e.team]){
    let md = 1e9;
    for (const o of ents.values()) if (o.alive && o !== e) md = Math.min(md, Math.hypot(o.pos.x-s[0], o.pos.z-s[1]) * (o.team === e.team ? 3 : 1));
    if (md === 1e9) md = Math.random()*100;
    md += Math.random()*3;
    if (md > bd){ bd = md; best = s; }
  }
  e.pos.set(best[0], 0, best[1]); e.yaw = Math.atan2(best[0], best[1]);
  e.hp = 100; e.alive = true; e.invUntil = now + 2000; e.inv = true; e.rs++;
  if (e.ai){ Object.assign(e.ai, {target:null, lastSeen:null, wp:null, burst:0, nextShot:now+800}); e.weapon = BOT_WEAPONS[Math.floor(Math.random()*BOT_WEAPONS.length)]; }
}
function applyHit(fromId, toId, dmg){
  const s = ents.get(fromId), v = ents.get(toId);
  if (!started || over || !s || !v || !v.alive || v.team === s.team || now < v.invUntil || dmg <= 0) return;
  v.hp -= dmg; v.lastHurt = now;
  if (v.hp <= 0){
    v.hp = 0; v.alive = false; v.respawnAt = now + (v.kind === 'b' ? 4000 : 3000);
    v.d++; s.k++; score[s.team]++;
    evQ.push({k:fromId, v:toId}); onKill(fromId, toId);
    if (score[s.team] >= goal){ over = {win:s.team, until:now + 7000}; }
  }
}
function hostResetRound(){
  over = null; score = [0,0];
  for (const e of ents.values()){ e.k = 0; e.d = 0; spawnEnt(e); }
}
function hostStart(){
  goal = +$('goalSel').value; diff = +$('diffSel').value;
  started = true; score = [0,0];
  for (const e of ents.values()){ e.k = 0; e.d = 0; spawnEnt(e); }
  hostBroadcast(true); enterGame();
}
$('reloadBtn').onclick = () => location.reload();
$('goalSel').onchange = () => { goal = +$('goalSel').value; };
$('diffSel').onchange = () => { diff = +$('diffSel').value; };

// --- client side ---
function clientAttach(conn){
  hostConn = conn;
  conn.onmsg = m => {
    if (m.t === 'id'){ myId = String(m.id); $('joinO').hidden = true; showLobby(); }
    else if (m.t === 'w') clientWorld(m);
  };
  conn.onclose = () => { started = false; $('lostO').hidden = false; if (document.pointerLockElement) document.exitPointerLock(); };
  conn.send({t:'hi', name:me.name, team:me.team});
}
function clientWorld(m){
  if (!myId) return;
  goal = +m.g || 30; score = Array.isArray(m.sc) ? m.sc.map(Number) : [0,0];
  overView = Array.isArray(m.ov) ? m.ov : null;
  const seen = new Set();
  if (Array.isArray(m.e)) for (const a of m.e){
    if (!Array.isArray(a) || a.length < 16) continue;
    const id = String(a[0]); seen.add(id);
    let e = ents.get(id);
    if (!e){ e = newEnt(id, a[1] ? 'b' : 'h', a[2] ? 1 : 0, cleanName(a[3])); ents.set(id, e); }
    e.team = a[2] ? 1 : 0; e.name = cleanName(a[3]);
    e.pos.set(+a[4]||0, +a[5]||0, +a[6]||0); e.yaw = +a[7]||0; e.pitch = +a[8]||0;
    e.hp = +a[9]||0; e.alive = !!a[10]; e.weapon = (a[11]|0)%NW; e.rs = +a[12]||0; e.k = +a[13]||0; e.d = +a[14]||0; e.inv = !!a[15]; e.slide = !!a[16];
  }
  for (const id of [...ents.keys()]) if (!seen.has(id)) ents.delete(id);
  if (Array.isArray(m.fx)) for (const f of m.fx) if (f && f.by !== myId) renderFx(f);
  if (Array.isArray(m.ev)) for (const x of m.ev) if (x && x.k) onKill(String(x.k), String(x.v));
  if (m.st && !started) enterGame();
  if (!$('lobbyO').hidden) updateLobby();
}

// ================= Shared events =================
function renderFx(f){
  if (!Array.isArray(f.o) || !Array.isArray(f.e)) return;
  const o = new V(+f.o[0]||0, +f.o[1]||0, +f.o[2]||0);
  const w = (f.w|0) % NW;
  addMuzzleFlash(o);
  { const sa = avatars.get(f.by); if (sa) sa.av.kick = 1; }
  if (WEAPONS[w].explosive){
    const e = f.e[0]; if (Array.isArray(e)) launchRocket(o, new V(+e[0]||0, +e[1]||0, +e[2]||0), false);
  } else for (const e of f.e) if (Array.isArray(e)){ const ev = new V(+e[0]||0, +e[1]||0, +e[2]||0); addTracer(o, ev); if (Math.random() < .5) addPuff(ev); }
  playShot(w, o);
  if (f.by !== myId && !WEAPONS[w].explosive){
    const head = new V(me.pos.x, me.pos.y + EYE, me.pos.z);
    if (o.distanceTo(head) > 4) for (const e of f.e){
      if (!Array.isArray(e)) continue;
      const ev = new V(+e[0]||0, +e[1]||0, +e[2]||0), seg = ev.clone().sub(o), L2 = seg.lengthSq();
      if (L2 < 1) continue;
      const t = Math.max(0, Math.min(1, head.clone().sub(o).dot(seg) / L2)), cp = o.clone().addScaledVector(seg, t);
      if (t > .05 && t < .97 && cp.distanceTo(head) < 2.2){ playWhiz(cp); break; }
    }
    const e0 = f.e[0]; if (Array.isArray(e0)){ const ev = new V(+e0[0]||0, +e0[1]||0, +e0[2]||0); if (ev.distanceTo(me.pos) < 25) playImpact(ev); }
  }
}
function addFeed(html, raw){
  const f = $('feed'), d = document.createElement('div');
  if (raw) d.append(...raw); else d.textContent = html;
  f.prepend(d); setTimeout(() => d.remove(), 5000);
  while (f.children.length > 6) f.lastChild.remove();
}
function teamSpan(id){
  const e = ents.get(id), s = document.createElement('span');
  s.className = e ? TEAM_CLS[e.team] : ''; s.textContent = nameOf(id); return s;
}
function onKill(k, v){
  addFeed(null, [teamSpan(k), document.createTextNode('  ➜  '), teamSpan(v)]);
  if (k === myId){ killNote(`${nameOf(v)} etkisiz hâle getirildi`); playHit(false, true); }
  if (v === myId){ $('deathBy').textContent = `${nameOf(k)} seni vurdu.`; me.deadAt = now; }
}
function killNote(text){ const k = $('killNote'); k.textContent = text; k.classList.add('on'); clearTimeout(killNote.t); killNote.t = setTimeout(() => k.classList.remove('on'), 1300); }

// ================= Lobby UI =================
function showLobby(){
  renderLoadout();
  $('lobbyO').hidden = false;
  $('hostOnly').hidden = !isHost; $('hostOpts').hidden = !isHost;
  $('lobbyTitle').textContent = started ? 'Oda menüsü' : (isHost ? 'Odan hazır' : 'Odaya bağlandın');
  $('lobbyGo').hidden = !(isHost || started);
  $('lobbyGo').textContent = started ? 'Savaşa dön' : 'Savaşı başlat';
  $('clientWait').textContent = !isHost && !started ? 'Odayı kuran oyuncu savaşı başlatınca oyun açılacak. Bu arada iki takıma da bot ekleyebilirsin.' : '';
  updateLobby();
}
function updateLobby(){
  for (const t of [0,1]){
    const ul = $('list'+t); ul.textContent = '';
    let bots = 0;
    for (const e of ents.values()){
      if (e.team !== t) continue;
      if (e.kind === 'b'){ bots++; continue; }
      const li = document.createElement('li'); li.textContent = e.name + (e.id === myId ? ' (sen)' : '') + (e.id === 'h0' ? ' · kurucu' : '');
      ul.appendChild(li);
    }
    $('botN'+t).textContent = bots;
  }
}
document.querySelectorAll('[data-bot]').forEach(b => b.onclick = () => {
  const team = +b.dataset.bot, n = +b.dataset.n;
  if (isHost) changeBots(team, n); else if (hostConn) hostConn.send({t:'bot', team, n});
});
$('lobbyGo').onclick = () => {
  if (!started && isHost){ hostStart(); return; }
  if (started){ $('lobbyO').hidden = true; requestLock(); }
};
function enterGame(){
  started = true; initAudio(); applyLoadout(); stage.classList.add('playing');
  $('lobbyO').hidden = true; $('joinO').hidden = true; $('menu').hidden = true;
  requestLock(); updateNet();
}
function updateNet(){
  const n = $('net');
  if (isHost) n.textContent = (roomCode ? `Oda kodu: ${roomCode}` : 'Oda') + ` · ${conns.size + 1} oyuncu`;
  else if (hostConn) n.textContent = 'Odaya bağlı';
  else n.textContent = '';
}

// ================= Input =================
let keys = {}, mouseDown = false, rightDown = false, locked = false, fallback = false;
function requestLock(){
  if (fallback) return;
  try { const r = cv.requestPointerLock(); if (r && r.catch) r.catch(enableFallback); } catch(e){ enableFallback(); }
}
function enableFallback(){
  if (fallback) return;
  fallback = true; $('pauseO').hidden = true;
  const h = $('hint'); h.innerHTML = 'Fare kilitlenemedi: bakmak için <b>sağ tuşu basılı tutup sürükle</b> ya da ok tuşlarını kullan. Dürbün: <b>Z</b>'; h.style.display = 'block';
}
const overlayOpen = () => !$('lobbyO').hidden || !$('lostO').hidden;
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === cv;
  $('pauseO').hidden = locked || fallback || !started || overlayOpen();
});
document.addEventListener('pointerlockerror', enableFallback);
$('resumeBtn').addEventListener('click', requestLock);
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('mousedown', e => {
  if (!started) return;
  if (!locked && !fallback){ requestLock(); return; }
  if (e.button === 0) mouseDown = true;
  if (e.button === 2){ rightDown = true; if (!fallback) me.zoom = true; }
});
addEventListener('mouseup', e => {
  if (e.button === 0){ mouseDown = false; me.latched = false; }
  if (e.button === 2){ rightDown = false; if (!fallback) me.zoom = false; }
});
addEventListener('mousemove', e => {
  if (!started) return;
  if (locked || (fallback && rightDown)){
    const s = (me.zoom ? (WEAPONS[me.weapon].scope ? .0006 : .0022 * WEAPONS[me.weapon].adsFov / 75) : .0022) * sens;
    me.yaw -= e.movementX * s; me.pitch -= e.movementY * s;
    me.swayX = Math.max(-200, Math.min(200, me.swayX + e.movementX)); me.swayY = Math.max(-200, Math.min(200, me.swayY + e.movementY));
    me.pitch = Math.max(-1.45, Math.min(1.45, me.pitch));
  }
});
cv.addEventListener('wheel', e => { if (started){ e.preventDefault(); const n = me.loadout.length, k = Math.max(0, me.loadout.indexOf(me.weapon)); selectSlot((k + (e.deltaY > 0 ? 1 : n - 1)) % n); } }, {passive:false});
const BLOCK = new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab']);
addEventListener('keydown', e => {
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (!started){ if (e.key === 'Escape' && !$('menu').hidden) showPanel('home'); return; }
  if (e.code === 'KeyM'){ setMuted(!muted); return; }
  if (e.code === 'KeyB'){
    if ($('lobbyO').hidden){ if (document.pointerLockElement) document.exitPointerLock(); showLobby(); keys = {}; mouseDown = false; }
    else { $('lobbyO').hidden = true; requestLock(); }
    return;
  }
  if (overlayOpen()) return;
  if (BLOCK.has(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.code === 'KeyR') startReload();
  if (/^Digit[1-3]$/.test(e.code)) selectSlot(+e.code.slice(5) - 1);
  if (e.code === 'KeyC') tryStartSlide();
  if (e.code === 'KeyF'){ torchOn = !torchOn; if (actx) click(voice(null,{verb:0}).out, actx.currentTime + .01, .25, 3000); }
  if (e.code === 'KeyZ') me.zoom = !me.zoom;
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { keys = {}; mouseDown = false; rightDown = false; });

function setView(i){
  views.forEach((v,j) => v.visible = j === i); muzzle.position.set(0,0,muzzles[i]);
  flash.position.copy(muzzle.position); flashSprite.position.copy(muzzle.position); flashPetals.position.copy(muzzle.position);
}
function selectWeapon(i){
  if (i === me.weapon) return;
  me.weapon = i; me.reloading = false; me.zoom = false; me.latched = false; playSwitch(); me.switchT = 1;
  me.nextFire = Math.max(me.nextFire, now + 250); setView(i);
}
setView(3);
function startReload(){
  const W = WEAPONS[me.weapon];
  if (me.reloading || !isAlive() || me.ammo[me.weapon] === W.mag) return;
  me.reloading = true; me.reloadEnd = now + W.reload; me.zoom = false; playReload(me.weapon, W.reload);
}
const isAlive = () => { const e = myEnt(); return started && !!e && e.alive; };

// ================= Physics =================
function resolveXZ(p){
  for (const b of BOXES){
    if (p.y >= b.h - .01) continue;
    const hx = b.w/2, hz = b.d/2;
    const cx = Math.max(b.x-hx, Math.min(p.x, b.x+hx)), cz = Math.max(b.z-hz, Math.min(p.z, b.z+hz));
    let dx = p.x-cx, dz = p.z-cz; const d2 = dx*dx + dz*dz;
    if (d2 < RADIUS*RADIUS){
      if (d2 < 1e-9){ dx = p.x-b.x; dz = p.z-b.z; const L = Math.hypot(dx,dz) || 1; p.x += dx/L*RADIUS; p.z += dz/L*RADIUS; continue; }
      const d = Math.sqrt(d2); p.x += dx/d*(RADIUS-d); p.z += dz/d*(RADIUS-d);
    }
  }
  p.x = Math.max(-A+1, Math.min(A-1, p.x)); p.z = Math.max(-A+1, Math.min(A-1, p.z));
}
function tryStartSlide(){
  if (!isAlive() || me.slideT > 0 || now < me.slideCd || !me.grounded) return;
  const hs = Math.hypot(me.vel.x, me.vel.z);
  if (hs < 4.5) return;
  me.slideDir.set(me.vel.x / hs, 0, me.vel.z / hs); me.slideT = .8; me.slideSpeed = Math.max(hs, 7) + 4.5; me.zoom = false; me.dustT = 0;
  playSlide(null);
}
function updateMovement(dt){
  if (keys.ArrowLeft) me.yaw += 2.2*dt;
  if (keys.ArrowRight) me.yaw -= 2.2*dt;
  if (keys.ArrowUp) me.pitch = Math.min(1.45, me.pitch + 1.6*dt);
  if (keys.ArrowDown) me.pitch = Math.max(-1.45, me.pitch - 1.6*dt);
  const f = (keys.KeyW?1:0) - (keys.KeyS?1:0), s = (keys.KeyD?1:0) - (keys.KeyA?1:0);
  let mx = -Math.sin(me.yaw)*f + Math.cos(me.yaw)*s, mz = -Math.cos(me.yaw)*f - Math.sin(me.yaw)*s;
  const L = Math.hypot(mx, mz); if (L > 0){ mx /= L; mz /= L; }
  const speed = ((keys.ShiftLeft || keys.ShiftRight) && f > 0 && !me.zoom ? 8.5 : (me.zoom ? 3.2 : 5.6)) * (WEAPONS[me.weapon].move || 1);
  if (me.slideT > 0){
    me.slideT -= dt;
    const sk = Math.max(0, me.slideT / .8), sp = 4 + (me.slideSpeed - 4) * sk;
    me.slideDir.x += Math.cos(me.yaw) * s * dt * 1.2; me.slideDir.z += -Math.sin(me.yaw) * s * dt * 1.2; me.slideDir.normalize();
    me.vel.x = me.slideDir.x * sp; me.vel.z = me.slideDir.z * sp;
    me.dustT -= dt;
    if (me.dustT <= 0 && me.grounded){ me.dustT = .035; spawnSprite(new V(me.pos.x - me.slideDir.x*.3 + rnd(-.2,.2), .08, me.pos.z - me.slideDir.z*.3 + rnd(-.2,.2)), {color:C(0xb5a585), size:rnd(.25,.45), life:rnd(.6,1), v:new V(rnd(-.4,.4), rnd(.2,.6), rnd(-.4,.4)), grow:1.5, op:.5}); }
    if (me.slideT <= 0) me.slideCd = now + 900;
  } else {
    const k = Math.min(1, (me.grounded ? 12 : 3) * dt);
    me.vel.x += (mx*speed - me.vel.x) * k; me.vel.z += (mz*speed - me.vel.z) * k;
  }
  const p = me.pos;
  p.x += me.vel.x*dt; resolveXZ(p); p.z += me.vel.z*dt; resolveXZ(p);
  if (keys.Space && me.grounded){ me.vel.y = JUMP; me.grounded = false; if (me.slideT > 0){ me.slideT = 0; me.slideCd = now + 900; } }
  const prevY = p.y; me.vel.y -= GRAV*dt; p.y += me.vel.y*dt; me.grounded = false;
  if (p.y <= 0){ p.y = 0; me.vel.y = 0; me.grounded = true; }
  for (const b of BOXES)
    if (Math.abs(p.x-b.x) < b.w/2 + RADIUS*.6 && Math.abs(p.z-b.z) < b.d/2 + RADIUS*.6 && prevY >= b.h - .03 && p.y <= b.h){ p.y = b.h; me.vel.y = 0; me.grounded = true; }
  return L > 0;
}

// ================= Player shooting =================
const ray = new THREE.Raycaster();
const tmpO = new V(), tmpD = new V(), tmpM = new V();
function hitTargets(){
  const list = worldMeshes.slice();
  for (const [id, a] of avatars){ const e = ents.get(id); if (e && e.alive) list.push(...a.av.hit); }
  return list;
}
function hitMarker(head){
  const h = $('hitm'); h.classList.toggle('head', head); h.classList.add('on');
  clearTimeout(hitMarker.t); hitMarker.t = setTimeout(() => h.classList.remove('on'), 120); playHit(head, false);
}
function tryFire(moving){
  const W = WEAPONS[me.weapon];
  if (me.reloading || now < me.nextFire) return;
  if (!W.auto && me.latched) return;
  if (me.ammo[me.weapon] <= 0){ if (!me.latched){ playDry(); me.latched = true; } startReload(); return; }
  me.latched = true; me.nextFire = now + W.rate; me.ammo[me.weapon]--;
  const scoped = W.scope && me.zoom;
  const spread = W.spread*(moving?1.8:1)*(me.zoom && !W.scope ? .55 : 1) + (W.scope && !scoped ? .05 : 0) + (me.grounded ? 0 : .03) + (me.slideT > 0 ? .02 : 0);
  camera.getWorldPosition(tmpO); camera.getWorldDirection(tmpD); muzzle.getWorldPosition(tmpM);
  const targets = hitTargets(), dealt = {}, ends = [];
  let anyHit = false, anyHead = false;
  for (let i=0;i<W.pellets;i++){
    const d = tmpD.clone().add(new V((Math.random()-.5)*2*spread, (Math.random()-.5)*2*spread, (Math.random()-.5)*2*spread)).normalize();
    ray.set(tmpO, d); ray.far = 200;
    const hit = ray.intersectObjects(targets, false)[0];
    const end = hit ? hit.point.clone() : tmpO.clone().addScaledVector(d, 200);
    ends.push(end);
    if (!hit) continue;
    if (W.explosive) continue;
    const u = hit.object.userData;
    if (u.id){
      const e = ents.get(u.id);
      addPuff(end, 0x9a1d12);
      if (e && e.team !== me.team && !e.inv){
        let dmg = W.dmg * (u.head ? W.hs : 1);
        if (W.falloff) dmg *= Math.max(.3, Math.min(1, 1 - (hit.distance-8)/20));
        dealt[u.id] = (dealt[u.id] || 0) + dmg; anyHit = true; anyHead = anyHead || u.head;
      }
    } else { addImpact(hit); playImpact(hit.point); }
  }
  for (const id in dealt){
    if (isHost) applyHit(myId, id, dealt[id]);
    else if (hostConn) hostConn.send({t:'hit', v:id, d:Math.round(dealt[id])});
  }
  if (anyHit) hitMarker(anyHead);
  if (W.explosive) launchRocket(tmpM.clone(), ends[0], true);
  else ends.forEach(e => addTracer(tmpM.clone(), e));
  const fx = {o:v3(tmpM,1), e:ends.map(e => v3(e,1)), w:me.weapon};
  if (isHost){ fx.by = myId; fxQ.push(fx); } else if (hostConn) hostConn.send({t:'sh', ...fx});
  me.pitch = Math.min(1.45, me.pitch + W.kick); me.yaw += (Math.random()-.5)*W.kick*.4;
  me.recoil = 1; flash.intensity = 5; flashSprite.material.opacity = 1; flashPetals.rotation.set(Math.random()*6.28, Math.PI/2, 0); flashPetals.scale.setScalar(rnd(.75,1.25));
  me.kz.v += .25 + W.kick*6; me.kp.v += .4 + W.kick*14; me.kr.v += (Math.random()-.5)*(.6 + W.kick*16); me.ky.v += (Math.random()-.5)*(.3 + W.kick*8); me.cr.v += (Math.random()-.5)*W.kick*3; me.fovK.v += W.kick*120; flashSprite.material.rotation = Math.random()*6; flashSprite.scale.setScalar(rnd(.26,.4));
  spawnSprite(tmpM.clone(), {tex:TEX.smoke, color:C(0xa8a39a), size:.12, life:1, v:new V(rnd(-.1,.1), .45, rnd(-.1,.1)), grow:2.2, op:.32, fadeIn:.1, spin:rnd(-1,1)});
  ejectCasing();
  playShot(me.weapon, null);
  if (me.ammo[me.weapon] === 0) setTimeout(startReload, 150);
}
const r2 = v => Math.round(v*100)/100;
const v3 = (v, dp=2) => { const m = 10**dp; return [Math.round(v.x*m)/m, Math.round(v.y*m)/m, Math.round(v.z*m)/m]; };

// ================= Bots (host only) =================
const wray = new THREE.Raycaster(), tA = new V(), tB = new V(), tC = new V();
function losClear(a, b){
  tC.subVectors(b, a); const L = tC.length(); if (L < .01) return true;
  tC.divideScalar(L); wray.set(a, tC); wray.far = L;
  return wray.intersectObjects(solidMeshes, false).length === 0;
}
function raySphere(o, d, cx, cy, cz, r){
  const ox = o.x-cx, oy = o.y-cy, oz = o.z-cz;
  const b = ox*d.x + oy*d.y + oz*d.z, c = ox*ox + oy*oy + oz*oz - r*r, disc = b*b - c;
  if (disc < 0) return -1; return -b - Math.sqrt(disc);
}
const BODY_SPHERES = [[.4,.36,false],[.85,.38,false],[1.28,.36,false],[1.74,.26,true]];
function traceShot(o, d, selfId){
  wray.set(o, d); wray.far = 150;
  const wh = wray.intersectObjects(solidMeshes, false)[0];
  let tMax = wh ? wh.distance : 150, hit = null;
  if (d.y < 0){ const tf = -o.y / d.y; if (tf < tMax) tMax = tf; }
  for (const e of ents.values()){
    if (e.id === selfId || !e.alive) continue;
    for (const [h, r, head] of BODY_SPHERES){
      const t = raySphere(o, d, e.pos.x, e.pos.y + h * (e.slide ? .55 : 1), e.pos.z, r);
      if (t > 0 && t < tMax){ tMax = t; hit = {id:e.id, head}; }
    }
  }
  return {end: o.clone().addScaledVector(d, tMax), hit};
}
function randomWp(team){
  const enemySide = Math.random() < .55;
  const pool = WAYPTS.filter(([,z]) => enemySide ? (team === 0 ? z < 4 : z > -4) : true);
  const p = pool[Math.floor(Math.random()*pool.length)] || [0,0];
  return new V(p[0], 0, p[1]);
}
function botShoot(b, T, dist){
  const D = BOT_DIFF[diff], ai = b.ai, W = WEAPONS[b.weapon] && WEAPONS[b.weapon].bot ? WEAPONS[b.weapon] : WEAPONS[3], bp = W.bot;
  const o = new V(b.pos.x, 1.45, b.pos.z);
  const base = new V(T.pos.x, T.pos.y + (Math.random() < .15 ? 1.72 : 1.1), T.pos.z).sub(o).normalize();
  const sp = D.spread * (W.scope ? .6 : 1) + W.spread + dist * .001;
  const ends = [], dealt = {};
  for (let i=0;i<W.pellets;i++){
    const d = base.clone().add(new V((Math.random()-.5)*2*sp, (Math.random()-.5)*2*sp, (Math.random()-.5)*2*sp)).normalize();
    const {end, hit} = traceShot(o, d, b.id); ends.push(end);
    if (hit){
      let dmg = W.dmg * D.dmgMul * (hit.head ? Math.min(W.hs, 1.8) : 1);
      if (W.falloff) dmg *= Math.max(.3, Math.min(1, 1 - (o.distanceTo(end) - 8) / 20));
      dealt[hit.id] = (dealt[hit.id] || 0) + dmg;
    }
  }
  for (const id in dealt) applyHit(b.id, id, dealt[id]);
  const fx = {o:v3(o.clone().addScaledVector(base, .6), 1), e:ends.map(e => v3(e, 1)), w:WEAPONS.indexOf(W), by:b.id};
  fxQ.push(fx); renderFx(fx);
  ai.burst--;
  if (ai.burst > 0) ai.nextShot = now + Math.max(W.rate, 90);
  else { ai.nextShot = now + D.gap * bp.gap * (.7 + Math.random()*.6); ai.burst = bp.burst[0] + Math.floor(Math.random() * (bp.burst[1] - bp.burst[0] + 1)); }
}
function botThink(b, dt){
  const ai = b.ai, D = BOT_DIFF[diff];
  ai.scanT -= dt;
  if (ai.scanT <= 0){
    ai.scanT = .2 + Math.random()*.1;
    let best = null, bd = 1e9;
    tA.set(b.pos.x, 1.5, b.pos.z);
    for (const e of ents.values()){
      if (e.team === b.team || !e.alive) continue;
      const d = Math.hypot(e.pos.x-b.pos.x, e.pos.z-b.pos.z);
      if (d > 45 || d > bd) continue;
      tB.set(e.pos.x, e.pos.y + 1.3, e.pos.z);
      if (losClear(tA, tB)){ best = e; bd = d; }
    }
    if (best && best !== ai.target) ai.react = now + D.react * (.7 + Math.random()*.6);
    ai.target = best;
    if (best) ai.lastSeen = best.pos.clone();
  }
  let mx = 0, mz = 0, faceYaw = null;
  const T = ai.target;
  if (T && T.alive){
    const dx = T.pos.x-b.pos.x, dz = T.pos.z-b.pos.z, d = Math.hypot(dx,dz) || 1;
    faceYaw = Math.atan2(-dx, -dz);
    const bpr = (WEAPONS[b.weapon] && WEAPONS[b.weapon].bot) || WEAPONS[3].bot;
    const fwd = d > bpr.max ? 1 : d < bpr.min ? -1 : 0;
    ai.strafeT -= dt;
    if (ai.strafeT <= 0){ ai.strafeT = .7 + Math.random()*1.4; ai.strafe = Math.random() < .2 ? 0 : (Math.random() < .5 ? -1 : 1); }
    const nx = dx/d, nz = dz/d;
    mx = nx*fwd - nz*ai.strafe; mz = nz*fwd + nx*ai.strafe;
    let dy = faceYaw - b.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    if (Math.abs(dy) < .25 && now > ai.react && now > ai.nextShot && !over) botShoot(b, T, d);
  } else {
    if (!ai.lastSeen && !ai.wp) ai.wp = randomWp(b.team);
    const goal = ai.lastSeen || ai.wp;
    const dx = goal.x-b.pos.x, dz = goal.z-b.pos.z, d = Math.hypot(dx,dz);
    if (d < 1.2){ if (ai.lastSeen) ai.lastSeen = null; else ai.wp = null; }
    else { faceYaw = Math.atan2(-dx, -dz); mx = dx/d; mz = dz/d; }
  }
  if (faceYaw !== null){ let dy = faceYaw - b.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); b.yaw += Math.max(-7*dt, Math.min(7*dt, dy)); }
  const L = Math.hypot(mx, mz);
  if (L > 0){ const sp = 4.3*dt*((WEAPONS[b.weapon] && WEAPONS[b.weapon].move) || 1); b.pos.x += mx/L*sp; resolveXZ(b.pos); b.pos.z += mz/L*sp; resolveXZ(b.pos); }
  // separation from others
  for (const o of ents.values()){
    if (o === b || !o.alive) continue;
    const dx = b.pos.x-o.pos.x, dz = b.pos.z-o.pos.z, d = Math.hypot(dx,dz);
    if (d > 0 && d < .8){ b.pos.x += dx/d*(.8-d)*.5; b.pos.z += dz/d*(.8-d)*.5; }
  }
  ai.stuckT += dt;
  if (ai.stuckT > 1.2){
    if (L > 0 && b.pos.distanceTo(ai.stuckPos) < .4){ ai.wp = randomWp(b.team); ai.lastSeen = null; ai.strafe = -ai.strafe || 1; }
    ai.stuckPos.copy(b.pos); ai.stuckT = 0;
  }
}

// ================= Host simulation =================
function hostStep(dt){
  const self = myEnt();
  if (self && self.alive && me.rs === self.rs){ self.pos.copy(me.pos); self.yaw = me.yaw; self.pitch = me.pitch; self.weapon = me.weapon; self.slide = me.slideT > 0; }
  if (started){
    if (over && now >= over.until) hostResetRound();
    for (const e of ents.values()){
      e.inv = now < e.invUntil;
      if (!e.alive){ if (!over && now >= e.respawnAt) spawnEnt(e); continue; }
      if (now - e.lastHurt > 5000 && e.hp < 100) e.hp = Math.min(100, e.hp + 12*dt);
      if (e.ai && !over) botThink(e, dt);
    }
  }
  overView = over ? [over.win, Math.max(0, Math.ceil((over.until-now)/1000))] : null;
  hostBroadcast(false);
}

// ================= Avatars sync =================
function syncAvatars(dt){
  for (const [id, e] of ents){
    if (id === myId) continue;
    let a = avatars.get(id);
    const bot = e.kind === 'b';
    if (!a || a.team !== e.team || a.bot !== bot){
      if (a) disposeAvatar(a.av);
      a = {av:makeAvatar(e.team, e.name, id, bot), team:e.team, bot, wasAlive:false, dieT:-1, last:new V(), speed:0, fwd:0, side:0, lastHp:e.hp, pitch:0};
      a.av.g.position.copy(e.pos); a.last.copy(e.pos); avatars.set(id, a);
    }
    const av = a.av;
    if (av.name !== e.name) relabel(av, e.name);
    setAvatarWeapon(av, (e.weapon|0) % NW);
    if (e.alive && !a.wasAlive){ av.g.position.copy(e.pos); a.last.copy(e.pos); av.body.rotation.set(0,0,0); a.dieT = -1; a.lastHp = e.hp; a.speed = 0; }
    if (!e.alive && a.wasAlive) a.dieT = 0;
    a.wasAlive = e.alive;
    if (e.alive){
      if (e.hp < a.lastHp - 1) av.flinch = 1;
      a.lastHp = e.hp;
      av.g.visible = !e.inv || Math.floor(now/120) % 2 === 0;
      if (av.label) av.label.visible = true;
      av.g.position.lerp(e.pos, Math.min(1, dt * (isHost && bot ? 40 : 14)));
      let dy = e.yaw - av.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      av.g.rotation.y += dy * Math.min(1, dt*14);
      if (dt > 0){
        const vx = (av.g.position.x - a.last.x) / dt, vz = (av.g.position.z - a.last.z) / dt, yaw = av.g.rotation.y;
        const f = -(vx*Math.sin(yaw) + vz*Math.cos(yaw)), sd = vx*Math.cos(yaw) - vz*Math.sin(yaw);
        const kk = Math.min(1, dt*8);
        a.speed += (Math.min(Math.hypot(vx, vz), 12) - a.speed) * kk; a.fwd += (f - a.fwd) * kk; a.side += (sd - a.side) * kk;
      }
      a.pitch += ((e.pitch || 0) - a.pitch) * Math.min(1, dt*12);
      a.slideK = (a.slideK || 0) + ((e.slide ? 1 : 0) - (a.slideK || 0)) * Math.min(1, dt*10);
      if (e.slide && !a.wasSlide && av.g.position.distanceTo(me.pos) < 25) playSlide(av.g.position.clone().setY(.1));
      a.wasSlide = !!e.slide;
      animateAvatar(av, {speed:a.speed, fwd:a.fwd, side:a.side, pitch:a.pitch, dt, slideK:a.slideK});
      { const si = Math.floor(av.phase / Math.PI); if (si !== a.stepIdx){ a.stepIdx = si; if (a.speed > 1.2 && av.g.position.distanceTo(me.pos) < 22) playStep(av.g.position.clone().setY(.05), Math.min(.9, .3 + a.speed/8), a.speed > 6); } }
      a.last.copy(av.g.position);
    } else if (a.dieT >= 0){
      a.dieT += dt; animateDeath(av, a.dieT, dt);
      if (av.label) av.label.visible = false;
      av.g.visible = a.dieT < 3;
    } else av.g.visible = false;
  }
  for (const [id, a] of avatars) if (!ents.has(id) || id === myId){ disposeAvatar(a.av); avatars.delete(id); }
}

// ================= HUD =================
let lastBoard = 0;
function updateBoard(){
  if (now - lastBoard < 300) return; lastBoard = now;
  const b = $('board'); b.textContent = '';
  for (const t of [0,1]){
    const h = document.createElement('div'); h.className = 'th ' + TEAM_CLS[t]; h.textContent = `${TEAM_NAME[t]} · ${score[t]}`; b.appendChild(h);
    const tbl = document.createElement('table');
    const list = [...ents.values()].filter(e => e.team === t).sort((x,y) => y.k - x.k || x.d - y.d).slice(0, 9);
    for (const e of list){
      const tr = document.createElement('tr'); if (e.id === myId) tr.className = 'me'; else if (e.kind === 'b') tr.className = 'bot';
      const n = document.createElement('td'); n.textContent = (e.alive ? '' : '✕ ') + e.name + (e.id === myId ? ' (sen)' : '');
      const k = document.createElement('td'); k.className = 'n'; k.textContent = e.k;
      const d = document.createElement('td'); d.className = 'n'; d.textContent = e.d;
      tr.append(n, k, d); tbl.appendChild(tr);
    }
    b.appendChild(tbl);
  }
}
// HUD writes are cached so the DOM (and its paint layers) only change when a value actually changes
const _hud = {};
const hudText = (id, v) => { const k = 't' + id; if (_hud[k] !== v){ _hud[k] = v; $(id).textContent = v; } };
const hudHTML = (id, v) => { const k = 'h' + id; if (_hud[k] !== v){ _hud[k] = v; $(id).innerHTML = v; } };
const hudStyle = (id, prop, v) => { const k = 's' + id + prop; if (_hud[k] !== v){ _hud[k] = v; $(id).style[prop] = v; } };
const hudClass = (id, cls, on) => { const k = 'c' + id + cls; if (_hud[k] !== on){ _hud[k] = on; $(id).classList.toggle(cls, on); } };
let stageH = 600;
function updateHud(){
  const W = WEAPONS[me.weapon], e = myEnt();
  const hp = e ? e.hp : 100, alive = isAlive();
  hudText('hpNum', String(Math.max(0, Math.ceil(hp))));
  hudStyle('hpFill', 'width', Math.max(0, Math.round(hp)) + '%');
  hudStyle('hpFill', 'background', hp > 50 ? '' : hp > 25 ? 'linear-gradient(90deg,#d9a531,#ffd166)' : 'linear-gradient(90deg,#c9372a,#ff6b55)');
  hudClass('hpBox', 'low', hp < 30 && alive);
  hudHTML('ammoNum', `${me.ammo[me.weapon]} <small>/ ${W.mag}</small>`);
  hudClass('ammoNum', 'low', me.ammo[me.weapon] <= Math.ceil(W.mag * .25));
  hudText('fireMode', W.explosive ? 'PATLAYICI' : W.pellets > 1 ? 'SAÇMA' : W.auto ? 'OTO' : 'TEK');
  const reloadingNow = me.reloading && alive;
  hudStyle('reloadBar', 'visibility', reloadingNow ? 'visible' : 'hidden');
  if (reloadingNow) hudStyle('reloadFill', 'width', Math.round(Math.min(100, Math.max(0, (1 - (me.reloadEnd - now) / W.reload) * 100))) + '%');
  { const hv = Math.hypot(me.vel.x, me.vel.z);
    const spr = W.spread * (hv > .5 ? 1.8 : 1) * (me.zoom && !W.scope ? .55 : 1) + (W.scope && !me.zoom ? .05 : 0) + (me.grounded ? 0 : .03) + (me.slideT > 0 ? .02 : 0);
    const gap = 4 + spr / Math.tan(camera.fov * Math.PI / 360) * (stageH / 2) + me.recoil * 6;
    const g = Math.min(80, gap).toFixed(0) + 'px';
    if (_hud.gap !== g){ _hud.gap = g; $('cross').style.setProperty('--g', g); } }
  hudText('wepName', W.name);
  if (_hud.slotW !== me.weapon + '|' + $('slots').childElementCount){ _hud.slotW = me.weapon + '|' + $('slots').childElementCount; document.querySelectorAll('#slots span').forEach(s => s.classList.toggle('on', +s.dataset.i === me.weapon)); }
  hudStyle('reloadTxt', 'display', reloadingNow ? 'block' : 'none');
  const scoped = W.scope && me.zoom && alive;
  hudStyle('scope', 'display', scoped ? 'block' : 'none');
  hudStyle('cross', 'display', scoped || me.adsT > .5 ? 'none' : 'block');
  viewRoot.visible = !scoped && alive;
  hudText('sc0', String(score[0])); hudText('sc1', String(score[1]));
  hudStyle('tsb0', 'width', Math.min(100, score[0] / Math.max(1, goal) * 100) + '%'); hudStyle('tsb1', 'width', Math.min(100, score[1] / Math.max(1, goal) * 100) + '%');
  hudText('goalTxt', `${goal} leşte biter`);
  const showDeath = started && e && !e.alive && !overView;
  $('death').hidden = !showDeath;
  if (showDeath){
    const left = Math.max(1, Math.ceil(((me.deadAt || now) + 3000 - now) / 1000));
    $('deathT').textContent = `${left} saniye içinde yeniden doğacaksın`;
  }
  if (!!overView !== !!updateHud.wasOver){ updateHud.wasOver = !!overView; if (overView) playRoundEnd(overView[0] === (myEnt() ? myEnt().team : me.team)); }
  const ob = $('overB');
  if (overView){
    ob.style.display = 'block'; $('overT').textContent = `${TEAM_NAME[overView[0]]} kazandı!`;
    $('overT').style.color = overView[0] ? '#ff7a62' : '#6fb0ff';
    $('overS').textContent = `Yeni tur ${overView[1]} saniye içinde başlıyor`;
  } else ob.style.display = 'none';
  // hurt flash
  if (e){
    if (e.hp < me.prevHp - .5 && e.alive){ const h = $('hurt'); h.classList.add('on'); clearTimeout(updateHud.t); updateHud.t = setTimeout(() => h.classList.remove('on'), 90); sfx('hurt'); }
    me.prevHp = e.hp;
  }
}

// ================= Settings & loadout =================
let sens = 1, muted = false;
try { const v = localStorage.getItem('cephe-sens'); if (v !== null && isFinite(+v)) sens = Math.max(.1, Math.min(3, +v)); } catch(e){}
function setSens(v){
  sens = v; try { localStorage.setItem('cephe-sens', String(v)); } catch(e){}
  document.querySelectorAll('.sensIn').forEach(i => { if (+i.value !== Math.round(v*100)) i.value = Math.round(v*100); });
  document.querySelectorAll('.sensVal').forEach(el => el.textContent = v.toFixed(2));
}
function setMuted(m){
  muted = m;
  if (master && actx) master.gain.setTargetAtTime(m ? 0 : volume, actx.currentTime, .03);
  document.querySelectorAll('.muteBtn').forEach(b => { b.setAttribute('aria-pressed', m); b.textContent = m ? 'Sesi aç' : 'Sesi kapat'; });
}
let loadout = [3, 0, 5];
try {
  const l = JSON.parse(localStorage.getItem('cephe-loadout') || 'null');
  if (Array.isArray(l) && l.length >= 1 && l.length <= 3 && l.every(x => Number.isInteger(x) && x >= 0 && x < NW)) loadout = [...new Set(l)];
} catch(e){}
function statBars(i){
  const W = WEAPONS[i];
  const dmg = Math.min(1, W.dmg * W.pellets / 130), rpm = Math.min(1, (60000 / W.rate) / 860), mob = Math.max(.05, Math.min(1, (W.move - .75) / .38));
  const range = W.scope ? 1 : W.explosive ? .8 : W.pellets > 1 ? .22 : Math.min(1, .3 + Math.max(0, 1 - W.spread * 25) * .65);
  return [['Hasar', dmg], ['Atış hızı', rpm], ['Menzil', range], ['Hareket', mob]];
}
// ---- weapon pictures for the loadout cards: each first-person model is rendered once (without arms)
const WEAPON_THUMBS = [];
function buildWeaponThumbs(){
  try {
    const W2 = 640, H2 = 260, rt = new THREE.WebGLRenderTarget(W2, H2);
    rt.texture.encoding = THREE.sRGBEncoding;
    const ts = new THREE.Scene(); ts.environment = scene.environment;
    ts.add(new THREE.HemisphereLight(0xdfe6f0, 0x2a2620, .9));
    const key = new THREE.DirectionalLight(0xfff2e0, 2.4); key.position.set(3, 4, 2); ts.add(key);
    const rim = new THREE.DirectionalLight(0xbcd4ff, 1.6); rim.position.set(-3, 2, -4); ts.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, .6); fill.position.set(2, -2, 1); ts.add(fill);
    const cam = new THREE.PerspectiveCamera(22, W2 / H2, .01, 20);
    const buf = new Uint8Array(W2 * H2 * 4);
    const prevRT = renderer.getRenderTarget(), prevColor = renderer.getClearColor(new THREE.Color()), prevAlpha = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);
    views.forEach((v, i) => {
      const c = v.clone(true); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0);
      const drop = [];
      c.traverse(o => { o.visible = true; if (o.isMesh && (o.material === sleeveMat || o.material === gloveMat)) drop.push(o); });
      drop.forEach(o => o.parent && o.parent.remove(o));
      ts.add(c); c.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(c), size = box.getSize(new V()), ctr = box.getCenter(new V());
      c.position.sub(ctr); c.updateMatrixWorld(true);
      const half = Math.max(size.y, size.z / cam.aspect) * .5;
      const dist = half / Math.tan(cam.fov * Math.PI / 360) * 1.2 + size.x * .5;
      cam.position.set(dist * .95, dist * .2, dist * .24); cam.lookAt(0, 0, 0);
      renderer.setRenderTarget(rt); renderer.clear(); renderer.render(ts, cam);
      renderer.readRenderTargetPixels(rt, 0, 0, W2, H2, buf);
      ts.remove(c);
      const big = document.createElement('canvas'); big.width = W2; big.height = H2;
      const g = big.getContext('2d'), img = g.createImageData(W2, H2);
      for (let y=0;y<H2;y++) img.data.set(buf.subarray((H2 - 1 - y) * W2 * 4, (H2 - y) * W2 * 4), y * W2 * 4);
      g.putImageData(img, 0, 0);
      const out = document.createElement('canvas'); out.width = 320; out.height = 130;
      const og = out.getContext('2d'); og.imageSmoothingQuality = 'high'; og.drawImage(big, 0, 0, 320, 130);
      WEAPON_THUMBS[i] = out.toDataURL('image/png');
    });
    renderer.setRenderTarget(prevRT); renderer.setClearColor(prevColor, prevAlpha); rt.dispose();
  } catch(e){ WEAPON_THUMBS.length = 0; }
}
function renderLoadout(){
  document.querySelectorAll('.wgrid').forEach(g => { g.textContent = '';
  WEAPONS.forEach((W, i) => {
    const b = document.createElement('button'); b.className = 'wcard'; b.type = 'button';
    const idx = loadout.indexOf(i); b.setAttribute('aria-pressed', idx >= 0);
    const tags = [`${W.mag} mermi`]; if (W.auto) tags.push('otomatik'); if (W.scope) tags.push('dürbünlü'); if (W.explosive) tags.push('patlayıcı'); if (W.pellets > 1) tags.push('saçma');
    b.innerHTML = `<span class="wslot">${idx >= 0 ? idx + 1 : ''}</span>${WEAPON_THUMBS[i] ? `<span class="wthumb"><img src="${WEAPON_THUMBS[i]}" alt=""></span>` : ''}<b>${W.name}</b><span class="wmeta">${tags.join(' · ')}</span>` +
      statBars(i).map(([n, v]) => `<span class="wbar"><span>${n}</span><i><em style="width:${Math.round(v*100)}%"></em></i></span>`).join('');
    b.onclick = () => toggleWeapon(i); g.appendChild(b);
  }); });
  document.querySelectorAll('.loadCount').forEach(el => el.textContent = `${loadout.length}/3`);
  const names = loadout.map(i => WEAPONS[i].name).join(', ');
  $('navLoad').textContent = `${loadout.length} silah seçili`;
  $('homeLoadout').textContent = `Silahların: ${names}`;
}
function toggleWeapon(i){
  const k = loadout.indexOf(i), note = {set textContent(t){ document.querySelectorAll('.loadNote').forEach(el => el.textContent = t); }};
  if (k >= 0){
    if (loadout.length === 1){ note.textContent = 'En az bir silah seçili kalmalı.'; return; }
    loadout.splice(k, 1);
  } else {
    if (loadout.length >= 3){ note.textContent = 'En fazla 3 silah seçebilirsin. Önce seçili birini çıkar.'; return; }
    loadout.push(i);
  }
  try { localStorage.setItem('cephe-loadout', JSON.stringify(loadout)); } catch(e){}
  if (!started || !isAlive()){ applyLoadout(); note.textContent = 'Seçimin kaydedildi. Oyunda 1, 2 ve 3 tuşlarıyla geçiş yaparsın.'; }
  else note.textContent = 'Yeni silahların bir sonraki doğuşunda geçerli olacak.';
  renderLoadout();
}
function renderSlots(){
  _hud.slotW = null;
  $('slots').innerHTML = me.loadout.map((w, k) => `<span data-i="${w}" title="${WEAPONS[w].name}">${k+1}<small>${WEAPONS[w].short}</small></span>`).join('');
}
function applyLoadout(){
  me.loadout = loadout.slice(); renderSlots();
  if (!me.loadout.includes(me.weapon)){ const w = me.loadout[0]; me.weapon = -1; selectWeapon(w); }
}
function selectSlot(k){ if (me.loadout && k < me.loadout.length) selectWeapon(me.loadout[k]); }

function showPanel(name){
  document.querySelectorAll('#menu [data-panel]').forEach(p => p.hidden = p.dataset.panel !== name);
  if (name === 'arsenal') renderLoadout();
  const first = document.querySelector(`#menu [data-panel="${name}"] button, #menu [data-panel="${name}"] input`);
  if (first) first.focus({preventScroll:true});
}
document.querySelectorAll('#menu [data-go]').forEach(b => b.addEventListener('click', () => { initAudio(); showPanel(b.dataset.go); }));
$('quitBtn').addEventListener('click', () => location.reload());

// ================= Main loop =================
function resize(){
  const w = stage.clientWidth, h = stage.clientHeight; stageH = h;
  renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
  if (composer){
    const pr = renderer.getPixelRatio(); composer.setPixelRatio(pr); composer.setSize(w, h);
    if (fxaaPass) fxaaPass.material.uniforms.resolution.value.set(1/(w*pr), 1/(h*pr));
  }
}
new ResizeObserver(resize).observe(stage); resize();

let lastSt = 0, bob = 0, lastFrame = performance.now(), lastLogic = performance.now();
function logic(dt){
  now += dt*1000;
  const e = myEnt();
  if (e && e.rs > me.rs){
    me.rs = e.rs; me.pos.copy(e.pos); me.vel.set(0,0,0); me.yaw = e.yaw; me.pitch = 0;
    me.ammo = WEAPONS.map(w => w.mag); me.reloading = false; me.prevHp = 100; me.slideT = 0; applyLoadout();
  }
  let moving = false;
  if (isAlive()){
    const wasG = me.grounded, vyPrev = me.vel.y;
    moving = updateMovement(dt);
    if (!wasG && me.grounded && vyPrev < -3){ me.land = Math.min(.15, -vyPrev * .02); playLand(Math.min(1, -vyPrev / 10)); }
    if (me.reloading && now >= me.reloadEnd){ me.reloading = false; me.ammo[me.weapon] = WEAPONS[me.weapon].mag; }
    if (mouseDown && !overlayOpen()) tryFire(moving);
  } else { me.zoom = false; if (e && !e.alive && !me.deadAt) me.deadAt = now; }
  if (e && e.alive) me.deadAt = 0;
  if (isHost) hostStep(dt);
  else if (hostConn && started && now - lastSt > 50){
    lastSt = now;
    hostConn.send({t:'st', p:v3(me.pos), y:r2(me.yaw), x:r2(me.pitch), w:me.weapon, rs:me.rs, s:me.slideT > 0 ? 1 : 0});
  }
  return moving;
}
function frame(t){
  const dt = Math.min(.05, (t - lastFrame) / 1000); lastFrame = t; lastLogic = performance.now();
  const moving = logic(dt);
  syncAvatars(dt);
  const W = WEAPONS[me.weapon], aliveNow = isAlive();
  const ads = me.zoom && !W.scope && aliveNow;
  const sprinting = aliveNow && moving && (keys.ShiftLeft || keys.ShiftRight) && keys.KeyW && !me.zoom && me.grounded && !me.reloading;
  me.adsT += ((ads ? 1 : 0) - me.adsT) * Math.min(1, dt*14);
  me.sprintT += ((sprinting ? 1 : 0) - me.sprintT) * Math.min(1, dt*8);
  me.swayX *= Math.pow(.002, dt); me.swayY *= Math.pow(.002, dt); me.land *= Math.pow(.003, dt);
  bob += dt * (moving && me.grounded ? (sprinting ? 14 : 10) : 0);
  me.bobS += ((moving && me.grounded ? 1 : 0) - me.bobS) * Math.min(1, dt*8);
  const bobAmt = me.bobS * (1 - me.adsT*.85);
  { const si = Math.floor(bob / Math.PI); if (si !== me.lastStep){ me.lastStep = si; if (moving && me.grounded && aliveNow && me.slideT <= 0) playStep(null, sprinting ? .5 : .32, sprinting); } }
  { const se = myEnt(); updateAudio(se ? se.hp : 100, se ? se.alive : true); }
  me.eye += ((me.slideT > 0 ? .95 : EYE) - me.eye) * Math.min(1, dt*12); me.slideK += ((me.slideT > 0 ? 1 : 0) - me.slideK) * Math.min(1, dt*10);
  camera.position.set(me.pos.x, me.pos.y + me.eye - me.land + Math.sin(bob*2)*.022*bobAmt, me.pos.z);
  camera.rotation.set(me.pitch, me.yaw, Math.sin(bob)*.004*bobAmt + me.slideK*.07);
  { const rv = me.vel.x*Math.cos(me.yaw) - me.vel.z*Math.sin(me.yaw); me.roll += (-rv*.0045 - me.roll) * Math.min(1, dt*8); camera.rotation.z += me.roll + me.cr.x; }
  updatePreview(dt);
  if (!started){ camera.position.set(.15 + Math.sin(now/5000)*.12, 1.42, 23.1); camera.rotation.set(-.06, Math.sin(now/7000)*.02, 0); viewRoot.visible = false; }
  const targetFov = me.zoom && aliveNow ? W.adsFov : (me.slideT > 0 ? 85 : me.sprintT > .5 ? 80 : 75);
  me.baseFov += (targetFov - me.baseFov) * Math.min(1, 12*dt);
  { const fv = me.baseFov + me.fovK.x; if (Math.abs(camera.fov - fv) > .01){ camera.fov = fv; camera.updateProjectionMatrix(); } }
  me.recoil *= Math.pow(.0005, dt);
  // ---- viewmodel animation: springs for recoil, reload choreography, switch, jump lag, breathing
  const SPR_K = 220, SPR_C = 16;
  for (const s of [me.kz, me.kp, me.kr, me.ky, me.cr, me.fovK]){ s.v += (-SPR_K*s.x - SPR_C*s.v) * dt; s.x += s.v * dt; }
  me.switchT = Math.max(0, me.switchT - dt / .32);
  me.vyLag += (Math.max(-.05, Math.min(.05, -me.vel.y * .008)) - me.vyLag) * Math.min(1, dt*10);
  const at = me.adsT, sp = me.sprintT, rk = 1 - at*.55;
  let px = lerp(.28, 0, at) + Math.cos(bob)*.012*bobAmt - me.swayX*.00025 - sp*.06;
  let py = lerp(-.26, ADS_Y[me.weapon], at) + Math.abs(Math.sin(bob))*.012*bobAmt + me.swayY*.0002 - sp*.05 - me.land*.4 + me.vyLag + Math.sin(now/1100)*.003*(1 - at);
  let pz = lerp(-.5, -.36, at) + me.kz.x * rk;
  let rx = me.kp.x * rk + me.swayY*.0005 - sp*.3 + Math.sin(now/1300)*.004*(1 - at);
  let ry = -me.swayX*.0008 + sp*.55 + me.ky.x * rk;
  let rz = sp*.25 - me.swayX*.0004 + me.kr.x * rk;
  const view = views[me.weapon], mag = view && view.userData.mag;
  if (me.reloading && aliveNow){
    const rp = Math.max(0, Math.min(1, 1 - (me.reloadEnd - now) / W.reload));
    const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t*t*(3 - 2*t); };
    const tilt = ss(0, .15, rp) * (1 - ss(.82, 1, rp));
    if (me.weapon === 8){ rx -= tilt*.55; py -= tilt*.12; rz += tilt*.15; }
    else if (me.weapon === 5){
      rz += tilt*.35; rx += tilt*.12; py -= tilt*.04;
      if (rp > .12 && rp < .75) py += Math.sin(rp * Math.PI * 9) * .012;
      const pump = rp > .78 && rp < .92 ? Math.sin((rp - .78) / .14 * Math.PI) : 0; pz += pump*.05;
    } else {
      rz += tilt*.55; rx += tilt*.18; py -= tilt*.05; px -= tilt*.02;
      const jerk = rp > .68 && rp < .82 ? Math.sin((rp - .68) / .14 * Math.PI) : 0; pz += jerk*.035; rx -= jerk*.06;
      if (mag){
        let dy = 0, vis = true;
        if (rp > .1 && rp < .32) dy = -(rp - .1) / .22 * .35;
        else if (rp >= .32 && rp < .5){ vis = false; }
        else if (rp >= .5 && rp < .62) dy = -(1 - (rp - .5) / .12) * .25;
        mag.position.y = mag.userData.base.y + dy; mag.visible = vis && dy > -.3;
      }
    }
  } else if (mag){ mag.position.y = mag.userData.base.y; mag.visible = true; }
  py -= me.switchT * me.switchT * .3; rx -= me.switchT * .5;
  viewRoot.position.set(px, py, pz);
  viewRoot.rotation.set(rx, ry, rz);
  viewRoot.rotation.z += me.slideK * .28; viewRoot.position.y -= me.slideK * .03;
  if (flashPetals){ flashPetals.visible = flashSprite.material.opacity > .05; flashPetals.children.forEach(m => m.material.opacity = flashSprite.material.opacity); }
  flash.intensity *= Math.pow(.0001, dt); flashSprite.material.opacity *= Math.pow(.00001, dt);
  updateFx(dt); updateDebris(dt); updateCasings(dt); updateClouds(dt); updateRockets(dt); updateWeather(dt); if (started) updateFlare(dt);
  if (rocketHead) rocketHead.visible = me.ammo[8] > 0 || me.weapon !== 8;
  if (me.shake > .002){ camera.position.x += (Math.random()-.5)*me.shake*.4; camera.position.y += (Math.random()-.5)*me.shake*.4; camera.rotation.z += (Math.random()-.5)*me.shake*.06; me.shake *= Math.pow(.02, dt); }
  { const se = myEnt(); updateSleeves(se ? se.team : me.team); }
  if (started){ updateHud(); updateBoard(); }
  renderFrame(dt);
  requestAnimationFrame(frame);
}
// keep the host simulating when its tab is in the background
setInterval(() => {
  const t = performance.now();
  if (isHost && t - lastLogic > 150){ const dt = Math.min(.1, (t - lastLogic)/1000); lastLogic = t; logic(dt); }
}, 50);
me.pos.set(0, 4, 24); me.pitch = -.12;
Object.assign(me, {kz:{x:0,v:0}, kp:{x:0,v:0}, kr:{x:0,v:0}, ky:{x:0,v:0}, cr:{x:0,v:0}, fovK:{x:0,v:0}, switchT:0, vyLag:0, roll:0, bobS:0, baseFov:75, adsT:0, sprintT:0, swayX:0, swayY:0, land:0, shake:0, lastStep:0, slideT:0, slideCd:0, slideSpeed:0, slideDir:new V(), dustT:0, eye:EYE, slideK:0});
document.querySelectorAll('.sensIn').forEach(i => i.addEventListener('input', () => setSens(+i.value / 100)));
document.querySelectorAll('.muteBtn').forEach(b => b.addEventListener('click', () => { initAudio(); setMuted(!muted); }));
setSens(sens); setMuted(muted);
me.loadout = loadout.slice(); renderSlots(); renderLoadout();
if (!me.loadout.includes(me.weapon)){ me.weapon = me.loadout[0]; setView(me.weapon); }
document.querySelectorAll('.volIn').forEach(i => { i.value = Math.round(volume*100); i.addEventListener('input', () => { initAudio(); setVolume(+i.value / 100); }); });
buildPreview();
document.querySelectorAll('[data-q]').forEach(b => b.onclick = () => applyQuality(+b.dataset.q));
document.querySelectorAll('[data-atm]').forEach(b => b.onclick = () => applyAtmos(+b.dataset.atm));
applyAtmos(atmos);
applyQuality(quality);
buildWeaponThumbs(); renderLoadout();
requestAnimationFrame(frame);
})();
