/* ============================================================
   SAKET KUMAR — 3D MOTION PORTFOLIO
   Scroll-driven cinematic journey through a sunset low-poly
   world. Inspired by Sébastien Lempens' 3D portfolio style.
   ============================================================ */
import * as THREE from 'three';

/* ---------------- DOM ---------------- */
const canvas      = document.getElementById('scene');
const loader      = document.getElementById('loader');
const startBtn    = document.getElementById('start-btn');
const loaderFill  = document.querySelector('.loader-bar-fill');
const nav         = document.getElementById('nav');
const scrollHint  = document.getElementById('scroll-hint');
const progressBar = document.getElementById('progress-bar');
const panels      = [...document.querySelectorAll('.panel')];
const fallback    = document.getElementById('fallback');

/* ---------------- scroll track (creates real scroll height) ---------------- */
const track = document.createElement('div');
track.id = 'scroll-track';
track.style.cssText = 'position:relative;width:1px;pointer-events:none;';
const SCROLL_VH = 10;                       // journey length in viewport-heights
track.style.height = `${SCROLL_VH * 100}vh`;
document.body.appendChild(track);

/* ---------------- renderer / scene ---------------- */
let renderer;
let webglOK = true;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
} catch (e) {
  webglOK = false;
}
if (webglOK && !renderer.getContext()) webglOK = false;

if (!webglOK) {
  // No WebGL — still show all panels as a normal scrolling page
  canvas.style.display = 'none';
  fallback.hidden = false;
  document.body.style.overflow = '';
  document.body.classList.add('no-webgl');
  panels.forEach(p => {
    p.classList.add('active');
    p.style.position = 'static';
    p.style.minHeight = '100vh';
    p.style.paddingTop = '80px';
    p.style.paddingBottom = '80px';
    p.style.opacity = '1';
    p.style.visibility = 'visible';
  });
} else {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xd94f5c, 30, 190);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 600);

/* ---------------- lights ---------------- */
scene.add(new THREE.HemisphereLight(0xffd9a0, 0x2b1b3d, 0.95));
const sunLight = new THREE.DirectionalLight(0xffb36b, 1.6);
sunLight.position.set(0, 30, -120);
scene.add(sunLight);
const fillLight = new THREE.DirectionalLight(0xff6b4a, 0.35);
fillLight.position.set(-40, 12, 20);
scene.add(fillLight);

/* ---------------- camera path ---------------- */
const waypoints = [
  new THREE.Vector3(  0, 6.5,    8),
  new THREE.Vector3(  0, 5.0,  -28),
  new THREE.Vector3( -7, 4.2,  -60),   // about
  new THREE.Vector3(  6, 5.0,  -95),   // skills
  new THREE.Vector3( -6, 4.2, -130),   // projects 1-2
  new THREE.Vector3(  6, 4.6, -165),   // projects 3-4
  new THREE.Vector3( -6, 5.0, -200),   // projects 5-6
  new THREE.Vector3(  4, 5.6, -232),   // project 7 + education
  new THREE.Vector3(  0, 7.5, -268),   // contact — rise toward sun
];
const curve = new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.5);

/* ---------------- materials ---------------- */
const matGround  = new THREE.MeshStandardMaterial({ color: 0x3a1f4d, flatShading: true, roughness: 1 });
const matRoad    = new THREE.MeshStandardMaterial({ color: 0x241430, flatShading: true, roughness: 1 });
const matMountain= new THREE.MeshStandardMaterial({ color: 0x4b2560, flatShading: true, roughness: 1 });
const matCloud   = new THREE.MeshStandardMaterial({ color: 0xffc9a3, flatShading: true, roughness: 1, transparent: true, opacity: 0.85 });
const ACCENTS = [0xff6b4a, 0xffb36b, 0xffd9a0, 0xff8fa3, 0xc98bff, 0x7bd7ff, 0x9dffb0];
const accentMat = c => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.6, metalness: 0.1 });
const glowMat   = c => new THREE.MeshBasicMaterial({ color: c });

const animated = [];   // { obj, fn(t) }

/* ---------------- ground ---------------- */
{
  const g = new THREE.PlaneGeometry(700, 560, 72, 56);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const distFromCorridor = Math.abs(x - Math.sin(z * 0.02) * 6);
    const h = distFromCorridor < 16
      ? Math.random() * 0.25
      : (Math.sin(x * 0.08) + Math.cos(z * 0.07)) * 1.4 + Math.random() * 1.6 + (distFromCorridor - 16) * 0.12;
    pos.setY(i, Math.max(h, -0.5) - 1.2);
  }
  g.computeVertexNormals();
  const ground = new THREE.Mesh(g, matGround);
  ground.position.z = -140;
  scene.add(ground);
}

/* ---------------- road ribbon under the path ---------------- */
{
  const samples = 220;
  const pts = curve.getPoints(samples).map(p => new THREE.Vector3(p.x, 0.05, p.z));
  const roadShape = [];
  const W = 3.2;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const next = pts[Math.min(i + 1, pts.length - 1)];
    const prev = pts[Math.max(i - 1, 0)];
    const dir = new THREE.Vector3().subVectors(next, prev).normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    roadShape.push(
      new THREE.Vector3().addVectors(p, side.clone().multiplyScalar(W)),
      new THREE.Vector3().addVectors(p, side.clone().multiplyScalar(-W))
    );
  }
  const geo = new THREE.BufferGeometry();
  const verts = [];
  for (let i = 0; i < roadShape.length - 2; i += 2) {
    const a = roadShape[i], b = roadShape[i + 1], c = roadShape[i + 2], d = roadShape[i + 3];
    verts.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    verts.push(b.x, b.y, b.z, d.x, d.y, d.z, c.x, c.y, c.z);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, matRoad));

  // glowing path dots
  const dotGeo = new THREE.SphereGeometry(0.14, 6, 6);
  for (let i = 0; i < samples; i += 6) {
    const p = curve.getPointAt(i / samples);
    const dot = new THREE.Mesh(dotGeo, glowMat(0xffd9a0));
    dot.position.set(p.x, 0.25, p.z);
    scene.add(dot);
  }
}

/* ---------------- sun ---------------- */
{
  const sun = new THREE.Mesh(new THREE.SphereGeometry(16, 24, 24), glowMat(0xffd9a0));
  sun.position.set(0, 14, -360);
  scene.add(sun);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(22, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xff8c5a, transparent: true, opacity: 0.28 }));
  halo.position.copy(sun.position);
  scene.add(halo);
  animated.push({ obj: halo, fn: t => { const s = 1 + Math.sin(t * 0.8) * 0.04; halo.scale.set(s, s, s); } });
}

/* ---------------- mountains ---------------- */
{
  const rng = mulberry32(7);
  for (let i = 0; i < 46; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = -rng() * 320 + 20;
    const x = side * (34 + rng() * 90);
    const h = 8 + rng() * 26;
    const m = new THREE.Mesh(new THREE.ConeGeometry(6 + rng() * 12, h, 4 + Math.floor(rng() * 3)), matMountain);
    m.position.set(x, h / 2 - 1.5, z);
    m.rotation.y = rng() * Math.PI;
    scene.add(m);
  }
}

/* ---------------- clouds ---------------- */
{
  const rng = mulberry32(21);
  for (let i = 0; i < 14; i++) {
    const cloud = new THREE.Group();
    const n = 3 + Math.floor(rng() * 3);
    for (let j = 0; j < n; j++) {
      const s = 2 + rng() * 3.4;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(s, 7, 6), matCloud);
      puff.position.set(j * 3.2 - n, rng() * 1.2, rng() * 2);
      puff.scale.y = 0.55;
      cloud.add(puff);
    }
    cloud.position.set((rng() - 0.5) * 160, 22 + rng() * 26, -rng() * 330 + 10);
    scene.add(cloud);
    const speed = 0.6 + rng() * 1.2;
    animated.push({ obj: cloud, fn: t => { cloud.position.x += Math.sin(t * 0.1 + i) * 0.004 * speed; } });
  }
}

/* ---------------- floating particles ---------------- */
{
  const N = 900;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const palette = [new THREE.Color(0xffd9a0), new THREE.Color(0xff9a76), new THREE.Color(0xff6b4a), new THREE.Color(0xfff4e6)];
  for (let i = 0; i < N; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 120;
    pos[i * 3 + 1] = Math.random() * 34;
    pos[i * 3 + 2] = -Math.random() * 330 + 15;
    const c = palette[Math.floor(Math.random() * palette.length)];
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({
    size: 0.32, vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  }));
  scene.add(pts);
  animated.push({ obj: pts, fn: t => {
    const p = g.attributes.position;
    for (let i = 0; i < N; i++) {
      let y = p.getY(i) + 0.008 + (i % 5) * 0.002;
      if (y > 36) y = 0;
      p.setY(i, y);
    }
    p.needsUpdate = true;
    pts.rotation.y = Math.sin(t * 0.02) * 0.01;
  } });
}

/* ---------------- helper: low-poly tree ---------------- */
function makeTree(x, z, s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.24 * s, 1.1 * s, 5),
    new THREE.MeshStandardMaterial({ color: 0x5c3a21, flatShading: true }));
  trunk.position.y = 0.55 * s;
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x8a4b6b, flatShading: true, roughness: 1 });
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.9 * s, 1.7 * s, 6), leafMat);
  c1.position.y = 1.8 * s;
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.62 * s, 1.2 * s, 6), leafMat);
  c2.position.y = 2.7 * s;
  g.add(trunk, c1, c2);
  g.position.set(x, 0, z);
  g.rotation.y = Math.random() * Math.PI;
  scene.add(g);
  return g;
}

/* scatter trees along corridor edges */
{
  const rng = mulberry32(99);
  for (let i = 0; i < 90; i++) {
    const t = rng();
    const p = curve.getPointAt(t);
    const side = rng() > 0.5 ? 1 : -1;
    const off = 7 + rng() * 16;
    makeTree(p.x + side * off, p.z + (rng() - 0.5) * 8, 0.7 + rng() * 1.1);
  }
}

/* ---------------- ABOUT cluster: monolith + orbiting ring ---------------- */
{
  const g = new THREE.Group();
  const mono = new THREE.Mesh(new THREE.BoxGeometry(2.2, 6.5, 1.2), accentMat(0xff6b4a));
  mono.position.y = 3.25;
  const cap = new THREE.Mesh(new THREE.OctahedronGeometry(1.1), glowMat(0xffd9a0));
  cap.position.y = 7.6;
  g.add(mono, cap);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.09, 8, 40), glowMat(0xffd9a0));
  ring.position.y = 4.2;
  ring.rotation.x = Math.PI / 2.4;
  g.add(ring);
  g.position.set(-13.5, 0, -24);
  scene.add(g);
  animated.push({ obj: cap, fn: t => { cap.rotation.y = t * 0.9; cap.position.y = 7.6 + Math.sin(t * 1.4) * 0.3; } });
  animated.push({ obj: ring, fn: t => { ring.rotation.z = t * 0.5; } });
}

/* ---------------- SKILLS cluster: orbiting platonic solids ---------------- */
{
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 0), accentMat(0xffb36b));
  core.position.y = 4.6;
  g.add(core);
  const orbiters = [
    new THREE.Mesh(new THREE.OctahedronGeometry(0.7), accentMat(0xff6b4a)),
    new THREE.Mesh(new THREE.TetrahedronGeometry(0.7), accentMat(0xffd9a0)),
    new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), accentMat(0xc98bff)),
    new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), accentMat(0x7bd7ff)),
  ];
  orbiters.forEach(o => g.add(o));
  g.position.set(13, 0, -44);
  scene.add(g);
  animated.push({ obj: g, fn: t => {
    core.rotation.x = t * 0.4; core.rotation.y = t * 0.6;
    orbiters.forEach((o, i) => {
      const a = t * (0.5 + i * 0.13) + i * Math.PI / 2;
      const r = 3.4 + i * 0.5;
      o.position.set(Math.cos(a) * r, 4.6 + Math.sin(t * 0.9 + i) * 1.1, Math.sin(a) * r);
      o.rotation.x = t * (0.8 + i * 0.2); o.rotation.y = t;
    });
  } });
}

/* ---------------- PROJECT monuments: 10 towers along the road ---------------- */
const PROJECTS = [
  { t: 0.277, side:  1 },  // RepoLens
  { t: 0.326, side: -1 },  // FaithGuard
  { t: 0.375, side:  1 },  // DocVQA
  { t: 0.424, side: -1 },  // Multi-Agent Research Copilot
  { t: 0.473, side:  1 },  // Medical Report Summarizer
  { t: 0.557, side: -1 },  // Deepfake Detection
  { t: 0.606, side:  1 },  // Yamuna Flood Mapper
  { t: 0.690, side: -1 },  // Svara
  { t: 0.739, side:  1 },  // Meeting Intelligence
  { t: 0.788, side: -1 },  // Hinglish ASR
];
PROJECTS.forEach((proj, i) => {
  const p = curve.getPointAt(proj.t);
  const tangent = curve.getTangentAt(proj.t);
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  const pos = p.clone().add(side.multiplyScalar(proj.side * 9));
  pos.y = 0;

  const g = new THREE.Group();
  const color = ACCENTS[i % ACCENTS.length];

  // stacked low-poly tower
  let y = 0;
  const levels = 3 + (i % 3);
  let w = 2.6;
  for (let l = 0; l < levels; l++) {
    const h = 1.2 + Math.random() * 1.4;
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, w),
      new THREE.MeshStandardMaterial({ color: 0x33204a, flatShading: true, roughness: 0.9 }));
    box.position.y = y + h / 2;
    g.add(box);
    // glowing window band
    const band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.22, w + 0.06), glowMat(color));
    band.position.y = y + h * 0.72;
    g.add(band);
    y += h;
    w *= 0.78;
  }
  // beacon
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5, 6), glowMat(color));
  beacon.position.y = y + 2.5;
  g.add(beacon);
  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), glowMat(color));
  orb.position.y = y + 1.2;
  g.add(orb);

  g.position.copy(pos);
  g.rotation.y = Math.random() * Math.PI;
  scene.add(g);
  animated.push({ obj: orb, fn: t => { orb.rotation.y = t * 1.2 + i; orb.position.y = y + 1.2 + Math.sin(t * 1.6 + i) * 0.35; } });
});

/* ---------------- EDUCATION gate: arch over the road ---------------- */
{
  const p = curve.getPointAt(0.92);
  const tangent = curve.getTangentAt(0.92);
  const g = new THREE.Group();
  const pillarGeo = new THREE.BoxGeometry(1.2, 9, 1.2);
  const pillarMat = accentMat(0xffd9a0);
  const left = new THREE.Mesh(pillarGeo, pillarMat);
  const right = new THREE.Mesh(pillarGeo, pillarMat);
  const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  left.position.copy(side.clone().multiplyScalar(5));  left.position.y = 4.5;
  right.position.copy(side.clone().multiplyScalar(-5)); right.position.y = 4.5;
  const top = new THREE.Mesh(new THREE.BoxGeometry(11.6, 1.1, 1.4), accentMat(0xff6b4a));
  top.position.y = 9.4;
  top.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), side);
  const capstone = new THREE.Mesh(new THREE.OctahedronGeometry(0.9), glowMat(0xfff4e6));
  capstone.position.y = 11;
  g.add(left, right, top, capstone);
  g.position.set(p.x, 0, p.z);
  scene.add(g);
  animated.push({ obj: capstone, fn: t => { capstone.rotation.y = t; capstone.position.y = 11 + Math.sin(t * 1.2) * 0.3; } });
}

/* ---------------- CONTACT finale: ring of floating lanterns ---------------- */
{
  const g = new THREE.Group();
  const lanterns = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const l = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), glowMat(i % 2 ? 0xffd9a0 : 0xff9a76));
    l.position.set(Math.cos(a) * 8, 5 + Math.sin(a * 3) * 1.6, Math.sin(a) * 8);
    g.add(l);
    lanterns.push({ mesh: l, a, r: 8, baseY: l.position.y });
  }
  g.position.set(0, 0, -282);
  scene.add(g);
  animated.push({ obj: g, fn: t => {
    lanterns.forEach((l, i) => {
      const a = l.a + t * 0.18;
      l.mesh.position.set(Math.cos(a) * l.r, l.baseY + Math.sin(t * 1.1 + i) * 0.7, Math.sin(a) * l.r);
      l.mesh.rotation.y = t + i;
    });
  } });
}

/* ---------------- HERO companion: low-poly boy waving & talking ----------------
   Reference: a talking-avatar intro video — the boy stands facing the camera,
   waves while introducing himself, and keeps gesturing as he speaks. */
let boyTalking = false;
const boy = (() => {
  const g = new THREE.Group();
  const skin  = new THREE.MeshStandardMaterial({ color: 0xf2b28c, flatShading: true, roughness: 0.9 });
  const shirt = accentMat(0xff6b4a);
  const pants = new THREE.MeshStandardMaterial({ color: 0x2b1b3d, flatShading: true, roughness: 1 });
  const hairM = new THREE.MeshStandardMaterial({ color: 0x241430, flatShading: true, roughness: 1 });

  // legs
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.3, 0.42), pants);
  legL.position.set(-0.28, 0.65, 0);
  const legR = legL.clone(); legR.position.x = 0.28;
  g.add(legL, legR);

  // torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.5, 0.62), shirt);
  torso.position.y = 2.05;
  g.add(torso);

  // arms — pivot groups at the shoulders so they can wave/gesture
  function makeArm(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.72, 2.62, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.25, 0.3), shirt);
    arm.position.y = -0.62;
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), skin);
    hand.position.y = -1.32;
    pivot.add(arm, hand);
    g.add(pivot);
    return pivot;
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // head group (nods & tilts while speaking)
  const headG = new THREE.Group();
  headG.position.y = 3.25;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.8), skin);
  head.position.y = 0.42;
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.34, 0.88), hairM);
  hair.position.y = 0.86;
  const eyeGeo = new THREE.BoxGeometry(0.1, 0.12, 0.05);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x241430 });
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.2, 0.5, 0.41);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.2, 0.5, 0.41);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.05),
    new THREE.MeshBasicMaterial({ color: 0x7a2f2f }));
  mouth.position.set(0, 0.22, 0.41);
  headG.add(head, hair, eyeL, eyeR, mouth);
  g.add(headG);

  g.scale.setScalar(1.15);
  g.position.set(4.2, -1.05, -3);   // beside the road in the hero zone, feet on ground
  g.rotation.y = -0.3;              // turned toward the camera path
  scene.add(g);

  return { g, armL, armR, headG, mouth, torso };
})();

animated.push({ obj: boy.g, fn: t => {
  // breathing & body sway
  boy.torso.scale.y = 1 + Math.sin(t * 2.2) * 0.015;
  boy.g.rotation.z = Math.sin(t * 1.1) * 0.015;

  // right arm: raised, waving hello (the intro wave from the video)
  boy.armR.rotation.z = 2.4 + Math.sin(t * 5.5) * 0.35;
  boy.armR.rotation.x = Math.sin(t * 2.7) * 0.1;

  // left arm: small gestures while talking, relaxed otherwise
  boy.armL.rotation.z = -(0.16 + (boyTalking ? (0.5 + Math.sin(t * 3.1)) * 0.22 : Math.sin(t * 1.3) * 0.05));

  // head: nods and tilts while speaking
  boy.headG.rotation.x = boyTalking ? Math.sin(t * 6.3) * 0.05 : Math.sin(t * 1.7) * 0.03;
  boy.headG.rotation.y = Math.sin(t * 0.9) * 0.12;
  boy.headG.rotation.z = boyTalking ? Math.sin(t * 3.4) * 0.04 : 0;

  // mouth: opens & closes while talking
  boy.mouth.scale.y = boyTalking ? 0.4 + Math.abs(Math.sin(t * 9.7)) * 1.7 : 0.35;
} });

/* ---------------- hero speech bubble: typed intro lines ---------------- */
const bubbleText = document.getElementById('bubble-text');
const SPEECH_LINES = [
  "Hi, I'm Saket — welcome to my world. 👋",
  "I'm a Data Scientist & AI Engineer from IIT Guwahati.",
  "I build AI that ships — trained, tested and live.",
  "Scroll to travel through my journey. 🚀",
];
let lineIdx = 0, charIdx = 0, speechPhase = 'idle', speechTimer = 0;
setInterval(() => {
  if (!started || speechPhase === 'idle' || !bubbleText) return;
  const line = SPEECH_LINES[lineIdx];
  if (speechPhase === 'typing') {
    boyTalking = true;
    charIdx++;
    bubbleText.textContent = line.slice(0, charIdx);
    if (charIdx >= line.length) { speechPhase = 'hold'; speechTimer = 2600; }
  } else if (speechPhase === 'hold') {
    speechTimer -= 55;
    if (speechTimer <= 0) speechPhase = 'clearing';
  } else if (speechPhase === 'clearing') {
    boyTalking = false;
    charIdx -= 3;
    if (charIdx <= 0) {
      charIdx = 0; bubbleText.textContent = '';
      lineIdx = (lineIdx + 1) % SPEECH_LINES.length;
      speechPhase = 'pause'; speechTimer = 450;
    } else {
      bubbleText.textContent = line.slice(0, charIdx);
    }
  } else if (speechPhase === 'pause') {
    speechTimer -= 55;
    if (speechTimer <= 0) speechPhase = 'typing';
  }
}, 55);

/* ---------------- scroll & panels ---------------- */
let targetProgress = 0;
let progress = 0;
let started = false;

function maxScroll() {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}
window.addEventListener('scroll', () => {
  targetProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll()));
}, { passive: true });

/* nav links jump to progress */
document.querySelectorAll('[data-goto]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    const p = parseFloat(el.dataset.goto);
    window.scrollTo({ top: p * maxScroll(), behavior: 'smooth' });
  });
});

const panelRanges = panels.map(p => ({
  el: p,
  start: parseFloat(p.dataset.start),
  end: parseFloat(p.dataset.end),
}));

function updatePanels(p) {
  panelRanges.forEach(({ el, start, end }) => {
    const on = p >= start - 0.004 && p <= end + 0.004;
    el.classList.toggle('active', on);
  });
  progressBar.style.width = `${p * 100}%`;
  scrollHint.classList.toggle('visible', started && p < 0.03);
}

/* ---------------- mouse parallax ---------------- */
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('mousemove', e => {
  mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
  mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
});

/* ---------------- resize ---------------- */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------------- loader ---------------- */
let loadPct = 0;
const loadTimer = setInterval(() => {
  loadPct = Math.min(100, loadPct + 6 + Math.random() * 10);
  loaderFill.style.width = `${loadPct}%`;
  if (loadPct >= 100) {
    clearInterval(loadTimer);
    startBtn.disabled = false;
    startBtn.textContent = 'START THE JOURNEY';
  }
}, 110);
startBtn.disabled = true;
startBtn.textContent = 'LOADING…';

startBtn.addEventListener('click', () => {
  started = true;
  loader.classList.add('done');
  nav.classList.add('visible');
  scrollHint.classList.add('visible');
  document.body.style.overflow = '';
  speechPhase = 'typing';   // the boy starts his intro
});
document.body.style.overflow = 'hidden';

/* ---------------- render loop ---------------- */
const clock = new THREE.Clock();
const lookTarget = new THREE.Vector3();
const camPos = new THREE.Vector3();

function tick() {
  requestAnimationFrame(tick);
  const t = clock.getElapsedTime();

  // smooth scroll easing
  progress += (targetProgress - progress) * 0.09;
  const p = Math.min(0.999, Math.max(0.0001, progress));

  // camera along curve
  curve.getPointAt(p, camPos);
  const lookAhead = Math.min(0.999, p + 0.025);
  curve.getPointAt(lookAhead, lookTarget);

  // mouse parallax (gentle)
  mouse.x += (mouse.tx - mouse.x) * 0.05;
  mouse.y += (mouse.ty - mouse.y) * 0.05;

  camera.position.set(
    camPos.x + mouse.x * 0.9,
    camPos.y + Math.sin(t * 0.5) * 0.15 - mouse.y * 0.5,
    camPos.z
  );
  lookTarget.y += Math.sin(t * 0.4) * 0.1;
  camera.lookAt(lookTarget);
  camera.rotation.z += mouse.x * -0.012;

  // animate world
  for (const a of animated) a.fn(t);

  // fog & sky warm up as we approach the finale
  const warm = THREE.MathUtils.smoothstep(p, 0.75, 1);
  scene.fog.color.setHex(0xd94f5c).lerp(new THREE.Color(0xff8c5a), warm);

  updatePanels(progress);
  renderer.render(scene, camera);
}
tick();

/* debug hook for automated testing */
window.__portfolio = { getProgress: () => progress, panels: panelRanges.map(r => ({ id: r.el.id || r.el.className, start: r.start, end: r.end })) };

/* ---------------- utils ---------------- */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
