import * as THREE from 'three';

// Shared scan uniforms. main.js drives uScanPoint/uScanTime each frame;
// hud.js sets uScanColor per region.
export const uScanPoint = { value: new THREE.Vector3(99, 99, 99) };
export const uScanColor = { value: new THREE.Color('#46e0c6') };
export const uScanTime  = { value: 0 };
export const uScanR     = { value: 0.55 };

// Inject a travelling halo + ring emanating from uScanPoint into a standard material.
// NOTE: the injected `#include <dithering_fragment>` MUST sit at the start of a line —
// three only resolves #include directives that are line-anchored.
export function patch(mat){
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uScanPoint = uScanPoint; sh.uniforms.uScanColor = uScanColor; sh.uniforms.uScanTime = uScanTime; sh.uniforms.uScanR = uScanR;
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = 'uniform vec3 uScanPoint;\nuniform vec3 uScanColor;\nuniform float uScanTime;\nuniform float uScanR;\nvarying vec3 vWP;\n'
      + sh.fragmentShader.replace('#include <dithering_fragment>',
          'float d=distance(vWP,uScanPoint);\n'
        + 'float halo=smoothstep(uScanR,0.0,d)*0.85;\n'
        + 'float rr=mod(uScanTime*0.55,uScanR);\n'
        + 'float ring=smoothstep(0.05,0.0,abs(d-rr))*(1.0-rr/uScanR)*0.9;\n'
        + 'gl_FragColor.rgb+=uScanColor*(halo*0.16+ring*0.8);\n'
        + '#include <dithering_fragment>');
  };
  return mat;
}
