import * as THREE from 'three';

// Shared scan uniforms. main.js drives uScanPoint/uScanTime each frame;
// hud.js sets uScanColor per region.
export const uScanPoint = { value: new THREE.Vector3(99, 99, 99) };
export const uScanColor = { value: new THREE.Color('#46e0c6') };
export const uScanTime  = { value: 0 };
export const uScanR     = { value: 0.55 };

// Cajal plate mode: main.js sets uInk to 1 to remap the lit brain to sepia-on-cream ink.
export const uInk  = { value: 0 };
export const uInkA = { value: new THREE.Color(0.10, 0.075, 0.045) };   // deep sepia (sulci)
export const uInkB = { value: new THREE.Color(0.93, 0.87, 0.72) };     // warm cream (crowns)

// Inject a travelling halo + ring emanating from uScanPoint into a standard material.
// NOTE: the injected `#include <dithering_fragment>` MUST sit at the start of a line —
// three only resolves #include directives that are line-anchored.
export function patch(mat){
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uScanPoint = uScanPoint; sh.uniforms.uScanColor = uScanColor; sh.uniforms.uScanTime = uScanTime; sh.uniforms.uScanR = uScanR;
    sh.uniforms.uInk = uInk; sh.uniforms.uInkA = uInkA; sh.uniforms.uInkB = uInkB;
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = 'uniform vec3 uScanPoint;\nuniform vec3 uScanColor;\nuniform float uScanTime;\nuniform float uScanR;\nuniform float uInk;\nuniform vec3 uInkA;\nuniform vec3 uInkB;\nvarying vec3 vWP;\n'
      + sh.fragmentShader.replace('#include <dithering_fragment>',
          'float d=distance(vWP,uScanPoint);\n'
        + 'float halo=smoothstep(uScanR,0.0,d)*0.85;\n'
        + 'float rr=mod(uScanTime*0.55,uScanR);\n'
        + 'float ring=smoothstep(0.05,0.0,abs(d-rr))*(1.0-rr/uScanR)*0.9;\n'
        + 'gl_FragColor.rgb+=uScanColor*(halo*0.16+ring*0.8)*(1.0-uInk);\n'
        // plate mode: collapse the lit brain to a sepia ink ramp keyed on luminance
        + 'if(uInk>0.5){float l=dot(gl_FragColor.rgb,vec3(0.299,0.587,0.114));'
        + 'gl_FragColor.rgb=mix(uInkA,uInkB,smoothstep(0.06,0.62,l));}\n'
        + '#include <dithering_fragment>');
  };
  return mat;
}
