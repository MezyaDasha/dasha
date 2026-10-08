import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
document.body.classList.add('is-loading');
document.getElementById('year').textContent = new Date().getFullYear();

/* ============================================================
   Smooth scroll
   ============================================================ */
let lenis = null;
if (!reduceMotion && Lenis) {
  lenis = new Lenis({ lerp: 0.085 });
  lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    });
  });
}

/* ============================================================
   3D scene: cup, saucer, latte art, steam, flying beans
   ============================================================ */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 1.5, 7);
camera.lookAt(0, 0.55, 0);

const key = new THREE.DirectionalLight(0xffd9a8, 2.4);
key.position.set(3, 5, 4);
scene.add(key);
const rim = new THREE.DirectionalLight(0xe09a4f, 3);
rim.position.set(-4, 2, -3);
scene.add(rim);
scene.add(new THREE.AmbientLight(0x3a2416, 0.6));

const rig = new THREE.Group(); // positioned by scroll
const cup = new THREE.Group(); // rotated by pointer / scroll
rig.add(cup);
scene.add(rig);

const ceramic = new THREE.MeshPhysicalMaterial({
  color: 0xf4ede3, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, side: THREE.DoubleSide,
});

// Cup body (lathe of a wall with thickness)
const cupProfile = [
  [0.0, 0.08], [0.42, 0.08], [0.48, 0.12], [0.6, 0.36], [0.72, 0.78], [0.8, 1.12], [0.83, 1.22],
  [0.8, 1.25], [0.77, 1.22], [0.71, 0.92], [0.6, 0.48], [0.46, 0.24], [0.0, 0.2],
].map(([x, y]) => new THREE.Vector2(x, y));
cup.add(new THREE.Mesh(new THREE.LatheGeometry(cupProfile, 96), ceramic));

// Handle
const handle = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.065, 24, 64, Math.PI * 1.25), ceramic);
handle.rotation.z = -Math.PI * 0.625;
handle.position.set(0.86, 0.74, 0);
cup.add(handle);

// Saucer
const saucerProfile = [
  [0.0, 0.0], [0.85, 0.0], [1.2, 0.05], [1.38, 0.14], [1.42, 0.17], [1.37, 0.17],
  [1.18, 0.1], [0.9, 0.06], [0.5, 0.05], [0.0, 0.05],
].map(([x, y]) => new THREE.Vector2(x, y));
cup.add(new THREE.Mesh(new THREE.LatheGeometry(saucerProfile, 96), ceramic));

// Latte art texture drawn on a canvas
function latteTexture() {
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(s / 2, s / 2, 10, s / 2, s / 2, s / 2);
  grad.addColorStop(0, '#b8743a');
  grad.addColorStop(0.75, '#8a4a1e');
  grad.addColorStop(1, '#3e1d0a');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  // crema speckles
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '60,25,8' : '230,170,110'},${Math.random() * 0.25})`;
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * s * 0.48;
    g.beginPath();
    g.arc(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r, Math.random() * 3, 0, Math.PI * 2);
    g.fill();
  }
  // rosetta: stacked hearts + pull-through line
  g.fillStyle = '#f7ead6';
  g.shadowColor = 'rgba(247,234,214,.6)';
  g.shadowBlur = 12;
  const heart = (cx, cy, w) => {
    g.beginPath();
    g.moveTo(cx, cy + w * 0.75);
    g.bezierCurveTo(cx - w * 1.2, cy + w * 0.1, cx - w * 0.75, cy - w * 0.85, cx, cy - w * 0.35);
    g.bezierCurveTo(cx + w * 0.75, cy - w * 0.85, cx + w * 1.2, cy + w * 0.1, cx, cy + w * 0.75);
    g.fill();
  };
  heart(s / 2, s / 2 + 70, 130);
  g.fillStyle = '#9a5626';
  g.shadowBlur = 0;
  heart(s / 2, s / 2 + 60, 92);
  g.fillStyle = '#f7ead6';
  heart(s / 2, s / 2 + 52, 66);
  g.fillStyle = '#9a5626';
  heart(s / 2, s / 2 + 46, 38);
  g.fillStyle = '#f7ead6';
  heart(s / 2, s / 2 + 40, 20);
  g.strokeStyle = '#f7ead6';
  g.lineWidth = 7;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(s / 2, s / 2 - 140);
  g.lineTo(s / 2, s / 2 + 150);
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
const coffee = new THREE.Mesh(
  new THREE.CircleGeometry(0.745, 64),
  new THREE.MeshPhysicalMaterial({ map: latteTexture(), roughness: 0.25, clearcoat: 0.6 }),
);
coffee.rotation.x = -Math.PI / 2;
coffee.rotation.z = Math.PI / 2; // heart points away from the handle
coffee.position.y = 1.08;
cup.add(coffee);

// Soft contact shadow
function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0,0,0,.75)');
  grad.addColorStop(0.55, 'rgba(0,0,0,.3)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
const shadow = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4),
  new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }),
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = -0.02;
rig.add(shadow);

// Steam ribbons (shader planes that always face the camera)
const steamMat = (seed) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uSeed: { value: seed }, uOpacity: { value: 0.55 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `
    uniform float uTime; uniform float uSeed; uniform float uOpacity; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
    void main(){
      vec2 uv = vUv; float t = uTime + uSeed * 10.;
      float sway = (noise(vec2(uv.y * 2.2 - t * .35, uSeed * 5.)) - .5) * .7 * uv.y;
      float d = abs(uv.x - .5 - sway);
      float width = .05 + .2 * uv.y;
      float shape = smoothstep(width, 0., d);
      float wisps = noise(vec2(uv.x * 5. + sway * 6., uv.y * 4. - t * .9));
      float a = shape * (.35 + .65 * wisps) * smoothstep(0., .18, uv.y) * smoothstep(1., .4, uv.y) * uOpacity;
      gl_FragColor = vec4(vec3(1., .96, .9), a);
    }`,
});
const steams = [0, 1, 2].map((i) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.4), steamMat(i * 1.37));
  m.position.set((i - 1) * 0.28, 2.35, (i - 1) * 0.1);
  cup.add(m);
  return m;
});

// Coffee beans (instanced)
function beanGeometry() {
  const g = new THREE.SphereGeometry(1, 40, 28);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const cx = 0.09 * Math.sin(v.z * 2.4); // S-shaped crease
    const crease = Math.exp(-((v.x - cx) ** 2) / 0.01) * Math.max(0, v.y) * 0.32;
    v.y -= crease;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.scale(0.16, 0.12, 0.22);
  g.computeVertexNormals();
  return g;
}
const BEANS = window.innerWidth < 760 ? 26 : 46;
const beans = new THREE.InstancedMesh(
  beanGeometry(),
  new THREE.MeshPhysicalMaterial({ color: 0x4a2412, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.3 }),
  BEANS,
);
const beanData = Array.from({ length: BEANS }, () => {
  const a = Math.random() * Math.PI * 2;
  const r = 1.6 + Math.random() * 1.9;
  return {
    a, r,
    y: -0.6 + Math.random() * 3.2,
    speed: (0.04 + Math.random() * 0.08) * (Math.random() < 0.5 ? -1 : 1),
    bob: Math.random() * Math.PI * 2,
    spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
    spinSpeed: 0.3 + Math.random() * 0.9,
    scale: 0.7 + Math.random() * 0.7,
  };
});
rig.add(beans);

/* Scene state driven by GSAP (intro + scroll) */
const S = {
  intro: 0,     // 0 → 1 drop-in
  x: 0.62,      // fraction of half the visible width
  y: 0,
  turn: 0,      // extra Y rotation from scroll
  tilt: 0.38,   // X tilt toward camera
  scale: 1,
  spread: 1,    // bean orbit radius multiplier
  opacity: 1,
};

let halfW = 1;
let mobile = false;
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  mobile = w < 760;
  const dist = camera.position.length();
  halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist * camera.aspect;
}
resize();
window.addEventListener('resize', resize);

const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('pointermove', (e) => {
  pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
});

const clock = new THREE.Clock();
const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const pos = new THREE.Vector3();
const scl = new THREE.Vector3();

const easeIO = (k) => k * k * (3 - 2 * k);
function sampleScroll() {
  if (!anchors.length) return;
  const y = lenis ? lenis.scroll : window.scrollY;
  let i = 0;
  while (i < anchors.length - 2 && y > anchors[i + 1].y) i++;
  const a = anchors[i];
  const b = anchors[i + 1] || a;
  const k = b.y > a.y ? easeIO(Math.min(1, Math.max(0, (y - a.y) / (b.y - a.y)))) : 0;
  for (const p in a.s) {
    const target = a.s[p] + (b.s[p] - a.s[p]) * k;
    S[p] += (target - S[p]) * 0.08;
  }
}

function render() {
  const t = clock.getElapsedTime();
  sampleScroll();
  pointer.x += (pointer.tx - pointer.x) * 0.05;
  pointer.y += (pointer.ty - pointer.y) * 0.05;

  const baseScale = mobile ? 0.6 : 1;
  const xFrac = mobile ? S.x * 0.15 : S.x;
  rig.position.set(xFrac * halfW, -0.35 + S.y + (mobile ? 1.55 : 0) + (1 - S.intro) * 3, 0);
  rig.scale.setScalar(baseScale * S.scale * (0.4 + 0.6 * S.intro));

  cup.rotation.y = -0.6 + t * 0.12 + S.turn + pointer.x * 0.5 + (1 - S.intro) * 3;
  cup.rotation.x = S.tilt + pointer.y * 0.15;
  cup.position.y = Math.sin(t * 1.2) * 0.06;

  steams.forEach((m) => {
    m.material.uniforms.uTime.value = t;
    m.material.uniforms.uOpacity.value = 0.38 * S.intro * S.opacity;
    m.quaternion.copy(cup.quaternion).invert().multiply(camera.quaternion); // billboard inside rotated parent
  });

  for (let i = 0; i < BEANS; i++) {
    const b = beanData[i];
    const a = b.a + t * b.speed + pointer.x * 0.2;
    const r = b.r * S.spread * (0.3 + 0.7 * S.intro);
    pos.set(Math.cos(a) * r, b.y + Math.sin(t * 0.8 + b.bob) * 0.18 - pointer.y * 0.3, Math.sin(a) * r * 0.75 - 0.6);
    q.setFromAxisAngle(b.spin, t * b.spinSpeed + b.bob);
    scl.setScalar(b.scale * S.intro);
    m4.compose(pos, q, scl);
    beans.setMatrixAt(i, m4);
  }
  beans.instanceMatrix.needsUpdate = true;

  // On phones the cup sits behind the text after the hero, so dim it there
  const sy = lenis ? lenis.scroll : window.scrollY;
  const dim = mobile ? Math.min(1, Math.max(0.3, 1 - (sy - window.innerHeight * 0.3) / (window.innerHeight * 0.5))) : 1;
  canvas.style.opacity = S.opacity * dim;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(render);

/* ============================================================
   DOM motion
   ============================================================ */

// Split headings into masked words
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span');
          w.className = 'w';
          const wi = document.createElement('span');
          wi.className = 'wi';
          wi.textContent = part;
          w.appendChild(wi);
          frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(el);
}
document.querySelectorAll('.split').forEach(splitWords);

// Pinned sections must be created first so later triggers account for pin spacing
// Horizontal scroll season section
const track = document.querySelector('.h-track');
const hDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);
gsap.to(track, {
  x: () => -hDistance(),
  ease: 'none',
  scrollTrigger: {
    trigger: '.season',
    start: 'top top',
    end: () => '+=' + hDistance(),
    pin: true,
    scrub: 1,
    invalidateOnRefresh: true,
  },
});

// Initial hidden states
gsap.set('.hero__title .line > span', { yPercent: 110 });
gsap.set('.hero__meta, .hero__lead, .hero__cta, .hero__scroll, .hero__addr', { autoAlpha: 0, y: 24 });
gsap.set('.nav', { yPercent: -100 });

// Preloader
const loaderCount = document.querySelector('.loader__count span');
const counter = { v: 0 };
gsap.timeline({ onComplete: intro })
  .to(counter, {
    v: 100, duration: reduceMotion ? 0.2 : 1.8, ease: 'power2.inOut',
    onUpdate: () => { loaderCount.textContent = Math.round(counter.v); },
  })
  .to('.loader__bar i', { scaleX: 1, duration: reduceMotion ? 0.2 : 1.8, ease: 'power2.inOut' }, 0);

function intro() {
  const tl = gsap.timeline({
    onComplete: () => {
      document.body.classList.remove('is-loading');
      lenis && lenis.start();
      ScrollTrigger.refresh();
    },
  });
  tl.to('.loader', { yPercent: -100, duration: 1, ease: 'expo.inOut' })
    .set('.loader', { display: 'none' })
    .to(S, { intro: 1, duration: 2.2, ease: 'elastic.out(1, 0.6)' }, 0.35)
    .to('.hero__title .line > span', { yPercent: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, 0.55)
    .to('.nav', { yPercent: 0, duration: 1, ease: 'expo.out' }, 0.8)
    .to('.hero__meta, .hero__lead, .hero__cta, .hero__scroll, .hero__addr', {
      autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out',
    }, 0.9);
}

// Nav background on scroll
const nav = document.querySelector('.nav');
const updateNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 80);
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

// 3D choreography: one keyframe per section, interpolated by scroll position in render()
const PI = Math.PI;
const sceneKeys = [
  { el: '.hero', at: 'start', s: { x: 0.58, y: 0, turn: 0, tilt: 0.38, scale: 0.92, spread: 1, opacity: 1 } },
  { el: '.about', s: { x: -0.66, y: -0.1, turn: PI * 1.4, tilt: 0.72, scale: 0.82, spread: 1.3, opacity: 1 } },
  { el: '.season', at: 'pin', s: { x: 0, y: 0.9, turn: PI * 2.2, tilt: 0.5, scale: 0.6, spread: 2.1, opacity: 0.1 } },
  { el: '.menu', s: { x: 0.72, y: 0.2, turn: PI * 3, tilt: 0.3, scale: 0.75, spread: 1.4, opacity: 0.16 } },
  { el: '.events', s: { x: 0.6, y: 0.95, turn: PI * 3.8, tilt: 0.55, scale: 0.62, spread: 1.1, opacity: 1 } },
  { el: '.visit', s: { x: 0.62, y: 0.95, turn: PI * 4.6, tilt: 0.45, scale: 0.6, spread: 1.2, opacity: 0.5 } },
  { el: '.footer', at: 'end', s: { x: 0, y: 0.4, turn: PI * 5.5, tilt: 0.45, scale: 0.85, spread: 1.6, opacity: 0.3 } },
];
let anchors = [];
function computeAnchors() {
  const max = ScrollTrigger.maxScroll(window);
  anchors = [];
  sceneKeys.forEach((k) => {
    let el = document.querySelector(k.el);
    if (el.parentElement.classList.contains('pin-spacer')) el = el.parentElement;
    const top = el.getBoundingClientRect().top + window.scrollY;
    if (k.at === 'start') anchors.push({ y: 0, s: k.s });
    else if (k.at === 'end') anchors.push({ y: max, s: k.s });
    else if (k.at === 'pin') {
      anchors.push({ y: top, s: k.s });
      anchors.push({ y: top + hDistance(), s: k.s }); // hold while the cards scroll sideways
    } else anchors.push({ y: Math.min(max, Math.max(0, top - window.innerHeight * 0.35)), s: k.s });
  });
  anchors.sort((a, b) => a.y - b.y);
}
ScrollTrigger.addEventListener('refresh', computeAnchors);
computeAnchors();

// Hero parallax out
gsap.to('.hero__title', {
  yPercent: -30, opacity: 0.2, ease: 'none',
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
});

// Word reveals
document.querySelectorAll('.split').forEach((el) => {
  gsap.from(el.querySelectorAll('.wi'), {
    yPercent: 110, rotate: 4, duration: 1.1, stagger: 0.035, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
});

// Generic reveals
gsap.utils.toArray('.reveal').forEach((el) => {
  gsap.from(el, {
    y: 50, autoAlpha: 0, duration: 1.1, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 90%' },
  });
});

// Counters
document.querySelectorAll('[data-count]').forEach((el) => {
  const end = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.decimals || '0', 10);
  const suf = el.dataset.suffix || '';
  const o = { v: 0 };
  const fmt = (v) => v.toFixed(dec).replace('.', ',') + suf;
  el.textContent = fmt(0);
  gsap.to(o, {
    v: end, duration: 2, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 90%' },
    onUpdate: () => { el.textContent = fmt(o.v); },
  });
});

gsap.from('.season__head h2', {
  xPercent: -20, autoAlpha: 0, duration: 1.2, ease: 'expo.out',
  scrollTrigger: { trigger: '.season', start: 'top 70%' },
});

// Marquee skews with scroll velocity
const marquee = document.querySelector('.marquee__track');
const skewTo = gsap.quickTo(marquee, 'skewX', { duration: 0.4, ease: 'power3' });
ScrollTrigger.create({
  onUpdate: (self) => skewTo(gsap.utils.clamp(-14, 14, self.getVelocity() / -250)),
});

// Footer letters
gsap.from('.footer__big span', {
  yPercent: 100, rotate: 8, duration: 1.2, stagger: 0.06, ease: 'expo.out',
  scrollTrigger: { trigger: '.footer', start: 'top 85%' },
});

/* ============================================================
   Pointer interactions (desktop)
   ============================================================ */
if (!isTouch && !reduceMotion) {
  // Cursor
  const cursor = document.querySelector('.cursor');
  const cx = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3' });
  const cy = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); });
  document.querySelectorAll('a, .card, .menu__list li').forEach((el) => {
    el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
  });

  // Magnetic buttons
  document.querySelectorAll('.magnetic').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.35);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });

  // 3D tilt cards
  document.querySelectorAll('.tilt').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      rx((0.5 - py) * 14);
      ry((px - 0.5) * 18);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}
