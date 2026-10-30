/* Logo alvenix 3D (seperti di flyer): cincin + simpul, biru mengilap, berputar pelan & ikut mouse. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const host = document.getElementById("logo3d");
if (host) {
  try { start(host); } catch (e) { host.classList.add("is-fallback"); console.warn("[logo3d]", e); }
}

function start(host) {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 9.8);

  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc0ff, 1.2); rim.position.set(-5, -2, -3); scene.add(rim);

  // bahan biru mengilap seperti flyer
  const blue = new THREE.MeshPhysicalMaterial({ color: 0x2f6bff, metalness: 0.15, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.4, sheenColor: new THREE.Color(0x9fc0ff) });
  const blueLight = blue.clone(); blueLight.color = new THREE.Color(0x4d82ff);

  const logo = new THREE.Group(); scene.add(logo);

  // cincin tebal
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.36, 64, 180), blue);
  logo.add(ring);

  // simpul logo: titik tengah + 3 titik luar + batang penghubung (posisi dari logo.svg)
  const node = new THREE.Group(); logo.add(node);
  const P = (x, y) => new THREE.Vector3((x - 50) / 26, -(y - 52) / 26, 0);
  const center = P(52, 54), outs = [P(15, 58), P(82, 18), P(78, 86)];
  const ball = (r, pos, m = blue) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 48), m); s.position.copy(pos); node.add(s); return s; };
  ball(0.42, center, blueLight);
  outs.forEach(o => {
    ball(0.38, o);
    const dir = new THREE.Vector3().subVectors(o, center), len = dir.length();
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, len, 32), blue);
    rod.position.copy(center).addScaledVector(dir, 0.5);
    rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    node.add(rod);
  });
  node.scale.setScalar(0.92);
  node.position.z = 0.15;

  // bola-bola kecil melayang di sekitar (seperti flyer)
  const floaters = [[2.3, 2.15, 0.3, 0.24], [-2.3, -1.25, 0.6, 0.3], [2.35, -2.15, -0.2, 0.17]].map(([x, y, z, r], i) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 40), blue); s.position.set(x, y, z); s.userData = { y, ph: i * 1.7 }; scene.add(s); return s;
  });

  logo.rotation.set(0.18, -0.42, 0.06);

  // ukuran mengikuti wadah
  function resize() {
    const w = host.clientWidth, h = host.clientHeight || w;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host); resize();

  // ikut gerak mouse (halus)
  let mx = 0, my = 0, cx = 0, cy = 0;
  addEventListener("pointermove", e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });

  // hemat baterai: berhenti saat tidak terlihat
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) loop(); }).observe(host);

  const clock = new THREE.Clock();
  let raf = 0;
  function loop() {
    cancelAnimationFrame(raf);
    if (!visible) return;
    const t = clock.getElapsedTime();
    cx += (mx - cx) * 0.04; cy += (my - cy) * 0.04;
    if (!calm) {
      logo.rotation.y = -0.42 + Math.sin(t * 0.45) * 0.28 + cx * 0.7;
      logo.rotation.x = 0.18 + Math.sin(t * 0.32) * 0.08 + cy * 0.45;
      logo.position.y = Math.sin(t * 0.8) * 0.08;
      floaters.forEach(f => { f.position.y = f.userData.y + Math.sin(t * 0.9 + f.userData.ph) * 0.14; });
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  host.classList.add("is-ready");
  loop();
}
