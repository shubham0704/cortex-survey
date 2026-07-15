import * as THREE from 'three';
import { cerebrumGeometry, cerebellumGeometry, stemGeometry } from '../vendor/anatomy-core.js';
import { patch } from '../scan-shader.js';

// Level 0 of the scale-stack: the whole-brain specimen. The procedural geometry (gyri +
// fissure + foliation + baked AO) now comes from the shared anatomy-core — the same source
// vivo builds from. cortex-survey wraps it in its scan-shader-patched materials (which carry
// the travelling scan glow and the PLATE ink remap); vivo wraps the same geometry in plain PBR.

function buildCerebrum(){
  const mat = patch(new THREE.MeshPhysicalMaterial({ vertexColors:true, roughness:0.72, metalness:0.0, clearcoat:0.12, clearcoatRoughness:0.62, sheen:0.22, sheenColor:new THREE.Color(0xffd0c6), envMapIntensity:0.5 }));
  return new THREE.Mesh(cerebrumGeometry(), mat);
}

function buildCerebellum(){
  const mat = patch(new THREE.MeshPhysicalMaterial({ vertexColors:true, roughness:0.74, clearcoat:0.1, clearcoatRoughness:0.62, envMapIntensity:0.45 }));
  const m = new THREE.Mesh(cerebellumGeometry(), mat); m.position.set(0, -0.58, -0.9); m.scale.setScalar(0.8); return m;
}

function buildStem(){
  const mat = patch(new THREE.MeshPhysicalMaterial({ color:0xc7a498, roughness:0.66, clearcoat:0.1, clearcoatRoughness:0.55, envMapIntensity:0.45 }));
  const m = new THREE.Mesh(stemGeometry(), mat); m.position.set(0, -0.72, -0.48); m.rotation.x = 0.5; return m;
}

export function buildBrain(){
  const cerebrum = buildCerebrum(), cerebellum = buildCerebellum(), stem = buildStem();
  const group = new THREE.Group();
  group.add(cerebrum, cerebellum, stem);
  group.rotation.y = -0.4;
  group.position.y = 0.04;
  group.scale.setScalar(0.82);

  // Survey waypoints. `dir` is raycast onto the mesh to find a surface anchor;
  // `m` = [ACT, OXY, SNR] meters; `col` picks the scan tint.
  const REGIONS = [
    { name:'Gyrus frontalis',    desc:'prefrontal · executive',    dir:[0.18,0.30,0.98],   mesh:cerebrum,   m:[0.72,0.63,0.55], pos:'X −22 Y +54 Z +30', mag:'12.0×', col:'a' },
    { name:'Gyrus præcentralis', desc:'cortex motorius primarius', dir:[0.42,0.86,0.30],   mesh:cerebrum,   m:[0.88,0.70,0.80], pos:'X −38 Y −18 Z +52', mag:'14.0×', col:'b' },
    { name:'Lobus parietalis',   desc:'somatosensory · superior',  dir:[0.30,0.80,-0.52],  mesh:cerebrum,   m:[0.66,0.61,0.68], pos:'X −30 Y −46 Z +58', mag:'12.0×', col:'a' },
    { name:'Lobus temporalis',   desc:'auditivus · gyrus sup.',    dir:[0.98,-0.12,0.18],  mesh:cerebrum,   m:[0.58,0.66,0.60], pos:'X −54 Y −12 Z −04', mag:'16.0×', col:'b' },
    { name:'Area striata',       desc:'cortex visualis · V1',      dir:[0.06,0.24,-1.0],   mesh:cerebrum,   m:[0.62,0.55,0.71], pos:'X −08 Y −92 Z +02', mag:'12.0×', col:'a' },
    { name:'Arbor vitæ',         desc:'cerebellum · vermis',       dir:[0.10,-0.60,-0.86], mesh:cerebellum, m:[0.53,0.60,0.42], pos:'X −02 Y −64 Z −28', mag:'18.0×', col:'b' },
    { name:'Pons',               desc:'truncus encephali',         dir:[0.10,-0.86,-0.16], mesh:stem,       m:[0.45,0.50,0.34], pos:'X +00 Y −24 Z −38', mag:'20.0×', col:'a' }
  ];

  const ray = new THREE.Raycaster();
  function computeAnchors(){
    for(const R of REGIONS){
      const d = new THREE.Vector3(...R.dir).normalize();
      ray.set(d.clone().multiplyScalar(4.5), d.clone().multiplyScalar(-1));
      const hit = ray.intersectObject(R.mesh, true)[0];
      if(hit){ R.local = R.mesh.worldToLocal(hit.point.clone()); R.lnormal = hit.face.normal.clone(); R.host = R.mesh; }
      else { R.local = d.clone().multiplyScalar(1.2); R.lnormal = d.clone(); R.host = R.mesh; }
    }
  }

  return { group, cerebrum, cerebellum, stem, REGIONS, computeAnchors };
}
