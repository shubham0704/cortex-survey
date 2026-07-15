// Generated from vivo/src/anatomy-core — do not edit by hand. Regenerate: npm run build:core

// src/anatomy-core/noise.ts
var clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function hash3(x, y, z) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
}
function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = fade(xf), v = fade(yf), w = fade(zf);
  const L = (a, b, t) => a + (b - a) * t;
  const c000 = hash3(xi, yi, zi), c100 = hash3(xi + 1, yi, zi), c010 = hash3(xi, yi + 1, zi), c110 = hash3(xi + 1, yi + 1, zi), c001 = hash3(xi, yi, zi + 1), c101 = hash3(xi + 1, yi, zi + 1), c011 = hash3(xi, yi + 1, zi + 1), c111 = hash3(xi + 1, yi + 1, zi + 1);
  return L(L(L(c000, c100, u), L(c010, c110, u), v), L(L(c001, c101, u), L(c011, c111, u), v), w);
}
function fbm3(x, y, z, oct, freq) {
  let a = 0, amp = 0.5, f = freq, nn = 0;
  for (let i = 0; i < oct; i++) {
    a += amp * vnoise(x * f, y * f, z * f);
    nn += amp;
    amp *= 0.5;
    f *= 2;
  }
  return a / nn;
}
function gyri(x, y, z) {
  const wx = fbm3(x + 3.1, y - 2.7, z, 2, 1.7) - 0.5, wy = fbm3(x - 5.3, y + 4.1, z, 2, 1.7) - 0.5, wz = fbm3(x, y, z + 7.9, 2, 1.7) - 0.5;
  const s = 0.66, qx = x + s * wx, qy = y + s * wy, qz = z + s * wz;
  const v = fbm3(qx, qy, qz, 3, 6.1);
  const r = 1 - Math.abs(2 * v - 1);
  return Math.pow(clamp(r, 0, 1), 0.7);
}
function folia(x, y, z) {
  const f = fbm3(x * 1, y * 4.6, z * 1, 3, 4.2);
  return 1 - Math.abs(2 * f - 1);
}

// src/anatomy-core/brain-geometry.ts
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
var PINK = new THREE.Color(0.9, 0.63, 0.58);
function cerebrumGeometry() {
  const geo = mergeVertices(new THREE.IcosahedronGeometry(1, 52));
  const pos = geo.getAttribute("position");
  const n = pos.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const ux = pos.getX(i), uy = pos.getY(i), uz = pos.getZ(i);
    const g = gyri(ux, uy, uz);
    const disp = (g - 0.5) * 2 * 0.072;
    const fiss = Math.exp(-(ux * ux) / (2 * 0.05 * 0.05)) * clamp((uy + 0.05) / 0.36, 0, 1);
    const total = disp - fiss * 0.14;
    let sx = ux * 1.05, sy = uy * 0.98, sz = uz * 1.22;
    if (sy < 0) sy *= 0.9;
    sx += ux * total;
    sy += uy * total;
    sz += uz * total;
    pos.setXYZ(i, sx, sy, sz);
    const ao = clamp(0.4 + g * 0.72, 0.32, 1) * (1 - fiss * 0.6);
    col[i * 3] = PINK.r * ao;
    col[i * 3 + 1] = PINK.g * ao;
    col[i * 3 + 2] = PINK.b * ao;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}
function cerebellumGeometry() {
  const geo = mergeVertices(new THREE.IcosahedronGeometry(0.5, 34));
  const pos = geo.getAttribute("position");
  const n = pos.count;
  const col = new Float32Array(n * 3);
  const tint = new THREE.Color(0.77, 0.59, 0.52);
  for (let i = 0; i < n; i++) {
    const ux = pos.getX(i), uy = pos.getY(i), uz = pos.getZ(i);
    const fol = folia(ux, uy, uz);
    const disp = (fol - 0.5) * 2 * 0.03;
    let sx = ux * 1.2, sy = uy * 0.78, sz = uz * 0.94;
    sx += ux * disp;
    sy += uy * disp;
    sz += uz * disp;
    pos.setXYZ(i, sx, sy, sz);
    const ao = clamp(0.44 + fol * 0.6, 0.4, 1);
    col[i * 3] = tint.r * ao;
    col[i * 3 + 1] = tint.g * ao;
    col[i * 3 + 2] = tint.b * ao;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}
function stemGeometry() {
  return new THREE.CylinderGeometry(0.11, 0.16, 0.6, 28, 8, true);
}
export {
  cerebellumGeometry,
  cerebrumGeometry,
  clamp,
  fbm3,
  folia,
  gyri,
  stemGeometry,
  vnoise
};
