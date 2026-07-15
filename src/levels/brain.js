import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, gyri, folia } from '../gen/noise.js';
import { patch } from '../scan-shader.js';

// Level 0 of the scale-stack: the whole-brain specimen.
// Procedural cerebrum (gyri + longitudinal fissure), cerebellum (foliation),
// brainstem. Vertices are welded (mergeVertices) so normals are smooth.
const PINK = new THREE.Color(0.90, 0.63, 0.58);

function buildCerebrum(){
  const geo = mergeVertices(new THREE.IcosahedronGeometry(1, 52));
  const pos = geo.attributes.position, N = pos.count, col = new Float32Array(N * 3);
  for(let i=0;i<N;i++){
    const ux=pos.getX(i), uy=pos.getY(i), uz=pos.getZ(i);
    const g = gyri(ux, uy, uz);
    const disp = (g - 0.5) * 2 * 0.072;                                  // gyri/sulci relief
    const fiss = Math.exp(-(ux*ux) / (2*0.05*0.05)) * clamp((uy+0.05)/0.36, 0, 1); // longitudinal fissure
    const total = disp - fiss * 0.14;
    let sx=ux*1.05, sy=uy*0.98, sz=uz*1.22;                              // ellipsoid proportions
    if(sy < 0) sy *= 0.9;                                                // flatter base
    sx += ux*total; sy += uy*total; sz += uz*total;
    pos.setXYZ(i, sx, sy, sz);
    const ao = clamp(0.40 + g*0.72, 0.32, 1.0) * (1.0 - fiss*0.6);       // sulci darker
    col[i*3] = PINK.r*ao; col[i*3+1] = PINK.g*ao; col[i*3+2] = PINK.b*ao;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const mat = patch(new THREE.MeshPhysicalMaterial({ vertexColors:true, roughness:0.72, metalness:0.0, clearcoat:0.12, clearcoatRoughness:0.62, sheen:0.22, sheenColor:new THREE.Color(0xffd0c6), envMapIntensity:0.5 }));
  return new THREE.Mesh(geo, mat);
}

function buildCerebellum(){
  const geo = mergeVertices(new THREE.IcosahedronGeometry(0.5, 34));
  const pos = geo.attributes.position, N = pos.count, col = new Float32Array(N * 3);
  const tint = new THREE.Color(0.77, 0.59, 0.52);
  for(let i=0;i<N;i++){
    const ux=pos.getX(i), uy=pos.getY(i), uz=pos.getZ(i);
    const fol = folia(ux, uy, uz);                                       // fine horizontal foliation
    const disp = (fol - 0.5) * 2 * 0.03;
    let sx=ux*1.2, sy=uy*0.78, sz=uz*0.94;
    sx += ux*disp; sy += uy*disp; sz += uz*disp;
    pos.setXYZ(i, sx, sy, sz);
    const ao = clamp(0.44 + fol*0.6, 0.4, 1.0);
    col[i*3] = tint.r*ao; col[i*3+1] = tint.g*ao; col[i*3+2] = tint.b*ao;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const mat = patch(new THREE.MeshPhysicalMaterial({ vertexColors:true, roughness:0.74, clearcoat:0.1, clearcoatRoughness:0.62, envMapIntensity:0.45 }));
  const m = new THREE.Mesh(geo, mat); m.position.set(0, -0.58, -0.9); m.scale.setScalar(0.8); return m;
}

function buildStem(){
  const geo = new THREE.CylinderGeometry(0.11, 0.16, 0.6, 28, 8, true);
  const mat = patch(new THREE.MeshPhysicalMaterial({ color:0xc7a498, roughness:0.66, clearcoat:0.1, clearcoatRoughness:0.55, envMapIntensity:0.45 }));
  const m = new THREE.Mesh(geo, mat); m.position.set(0, -0.72, -0.48); m.rotation.x = 0.5; return m;
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
