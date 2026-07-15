import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Renderer + PBR studio pipeline: ACES Filmic, PMREM room environment,
// three-point lighting. Shared across every level of the descent.
const canvas = document.getElementById('gl');

export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
camera.position.set(0.15, 0.35, 5.4);
export const macroCam = new THREE.PerspectiveCamera(21, 1, 0.02, 60);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

scene.add(new THREE.HemisphereLight(0xfff4e8, 0xb7b0a6, 0.5));
const key  = new THREE.DirectionalLight(0xfff1df, 1.85); key.position.set(3.4, 5, 2.6); scene.add(key);
const fill = new THREE.DirectionalLight(0xdce6f4, 0.45); fill.position.set(-4, 1.4, 3); scene.add(fill);
const rim  = new THREE.DirectionalLight(0xffffff, 0.55); rim.position.set(-1.2, 3, -4.2); scene.add(rim);
