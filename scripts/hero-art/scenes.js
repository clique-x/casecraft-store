// Browser-side scenes for render.mjs: each builds one transparent layer of the home hero art.
// Glass and metal use small hand-written shaders (fresnel, soft-box reflections, rims), so every
// pixel carries real alpha and the layers composite over the page's CSS backdrop without blend modes.
import * as THREE from 'three';

const AQUA = new THREE.Color('#5fe0cf');
const DEEP = new THREE.Color('#0b4f52');
const MINT = new THREE.Color('#c8fbeb');

const COMMON = /* glsl */ `
  varying vec3 vW;
  varying vec3 vN;
  varying vec3 vLocal;
  varying vec3 vLocalN;
  varying vec2 vUv;
  // Studio reflections: an overhead soft box, a long key strip from the upper left, a right rim light.
  float softboxes(vec3 R) {
    float top = smoothstep(0.55, 0.9, R.y);
    float key = smoothstep(0.93, 0.992, dot(R, normalize(vec3(-0.65, 0.45, 0.62))));
    float rim = smoothstep(0.90, 0.985, dot(R, normalize(vec3(0.85, 0.05, 0.45))));
    float low = smoothstep(0.95, 0.995, dot(R, normalize(vec3(0.2, -0.75, 0.6))));
    return top * 0.32 + key * 1.0 + rim * 0.65 + low * 0.25;
  }
`;

const VERT = /* glsl */ `
  ${COMMON}
  void main() {
    vUv = uv;
    vLocal = position;
    vLocalN = normal;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

/**
 * Translucent aqua glass: almost clear face-on; its light comes from grazing-angle fresnel, studio
 * reflections, the band edges and cut walls. `depthFade` dims the far side of a loop.
 */
function glassMaterial({ body = 0.035, rimBoost = 1.0, depthFade = 0, fresA = 0.5, fresC = 1.1 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uAqua: { value: AQUA },
      uDeep: { value: DEEP },
      uMint: { value: MINT },
      uBody: { value: body },
      uRim: { value: rimBoost },
      uDepthFade: { value: depthFade },
      uFresA: { value: fresA },
      uFresC: { value: fresC },
    },
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      ${COMMON}
      uniform vec3 uAqua, uDeep, uMint;
      uniform float uBody, uRim, uDepthFade, uFresA, uFresC;
      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        if (!gl_FrontFacing) N = -N;
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float fres = pow(1.0 - ndv, 3.0);
        float spec = softboxes(reflect(-V, N));
        // Ribbon faces: a thin bright line along each long edge of the band (uv.y runs across it).
        float across = abs(vUv.y * 2.0 - 1.0);
        float edgeLine = smoothstep(0.9, 1.0, across) * step(0.5, uRim);
        // Side walls of a slab or ribbon (normal off the face axis) catch light like cut glass.
        float wall = 1.0 - abs(normalize(vLocalN).z);
        float near = mix(1.0, smoothstep(-3.0, 2.5, vW.z) * 0.6 + 0.4, uDepthFade);
        vec3 col = uDeep * 0.5 + uAqua * (0.25 + fres * uFresC) + vec3(1.0) * spec + uMint * (edgeLine * 0.8 + wall * 0.7) * uRim;
        float a = uBody + fres * uFresA + spec * 0.7 + (edgeLine * 0.55 + wall * 0.5) * uRim;
        gl_FragColor = vec4(col, clamp(a * near, 0.0, 0.92));
      }
    `,
  });
}

/** A closed band with a thin rectangular section, swept round a loop that wobbles and twists. */
function ribbonGeometry({ radius = 2.2, width = 0.62, thickness = 0.045, segments = 720, wobble = 0.22, twist = 0.5 }) {
  const pos = [];
  const nor = [];
  const uvs = [];
  const idx = [];
  const frame = (t) => {
    const p = new THREE.Vector3(radius * Math.cos(t), wobble * Math.sin(2 * t), radius * Math.sin(t));
    const radial = new THREE.Vector3(Math.cos(t), 0, Math.sin(t));
    const up = new THREE.Vector3(0, 1, 0);
    // The band leans between a flat halo (radial) and a wall (up), rocking gently round the loop.
    const phi = 0.55 + twist * Math.sin(t + 0.6);
    const across = radial.clone().multiplyScalar(Math.cos(phi)).add(up.clone().multiplyScalar(Math.sin(phi))).normalize();
    const dt = 1e-3;
    const p2 = new THREE.Vector3(radius * Math.cos(t + dt), wobble * Math.sin(2 * (t + dt)), radius * Math.sin(t + dt));
    const tangent = p2.sub(p).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, across).normalize();
    return { p, across, normal };
  };
  // Four faces per section: front, back, and the two thin walls.
  const corners = [
    [-0.5, 0.5],
    [0.5, 0.5],
    [0.5, -0.5],
    [-0.5, -0.5],
  ];
  for (let face = 0; face < 4; face++) {
    const base = pos.length / 3;
    const [a0, n0] = corners[face];
    const [a1, n1] = corners[(face + 1) % 4];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const { p, across, normal } = frame(t);
      for (const [a, n, v] of [
        [a0, n0, 0],
        [a1, n1, 1],
      ]) {
        const q = p.clone().add(across.clone().multiplyScalar(a * width)).add(normal.clone().multiplyScalar(n * thickness));
        pos.push(q.x, q.y, q.z);
        // Face normal: front/back faces point along `normal`, walls along `across`.
        const fn = face % 2 === 0 ? normal.clone().multiplyScalar(face === 0 ? 1 : -1) : across.clone().multiplyScalar(face === 1 ? 1 : -1);
        nor.push(fn.x, fn.y, fn.z);
        // uv.y runs across the band width on the big faces; walls sit at an edge.
        uvs.push(i / segments, face % 2 === 0 ? (a + 0.5) : v);
      }
    }
    for (let i = 0; i < segments; i++) {
      const k = base + i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  // Local normals double as the "wall" signal: on the faces, z of the local normal is unused (set it to 1).
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  return g;
}

/** Ribbon walls are the faces whose normal is `across`; mark them through a second material instead of the z trick. */
function ribbonMesh(opts) {
  const geo = ribbonGeometry(opts);
  // Split into faces (groups) so the thin walls can glow harder than the broad faces.
  const per = (opts.segments ?? 720) * 6;
  geo.addGroup(0, per, 0);
  geo.addGroup(per, per, 1);
  geo.addGroup(per * 2, per, 0);
  geo.addGroup(per * 3, per, 1);
  const faceMat = glassMaterial({ body: 0.03, rimBoost: 1, depthFade: 1, fresA: 0.36, fresC: 0.75 });
  faceMat.fragmentShader = faceMat.fragmentShader.replace('float wall = 1.0 - abs(normalize(vLocalN).z);', 'float wall = 0.0;');
  const wallMat = glassMaterial({ body: 0.25, rimBoost: 1, depthFade: 1 });
  wallMat.fragmentShader = wallMat.fragmentShader.replace('float wall = 1.0 - abs(normalize(vLocalN).z);', 'float wall = 0.8;');
  return new THREE.Mesh(geo, [faceMat, wallMat]);
}

/** Rounded rectangle path, centred, for the screen guard. */
function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Edge-to-edge tempered glass: a thin slab with 2.5D rounded edges and a black printed border. */
function guardMesh() {
  const W = 1.62;
  const H = 3.42;
  const R = 0.27;
  const geo = new THREE.ExtrudeGeometry(roundedRect(W, H, R), {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 6,
    curveSegments: 48,
  });
  geo.center();
  const mat = glassMaterial({ body: 0.015, rimBoost: 1.3, fresA: 0.22, fresC: 0.55 });
  mat.uniforms.uSize = { value: new THREE.Vector3(W, H, R) };
  mat.fragmentShader = mat.fragmentShader
    .replace('uniform float uBody, uRim, uDepthFade, uFresA, uFresC;', 'uniform float uBody, uRim, uDepthFade, uFresA, uFresC;\nuniform vec3 uSize;')
    .replace('float edgeLine = smoothstep(0.9, 1.0, across) * step(0.5, uRim);', 'float edgeLine = 0.0;')
    .replace(
      'gl_FragColor = vec4(col, clamp(a * near, 0.0, 0.92));',
      /* glsl */ `
        // Signed distance to the rounded outline in the glass plane; the print is a thin band inside it.
        vec2 q = abs(vLocal.xy) - (uSize.xy * 0.5 - vec2(uSize.z));
        float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uSize.z;
        float face = 1.0 - smoothstep(0.2, 0.6, wall);
        float print = smoothstep(-0.072, -0.064, sd) * face;
        // Two diagonal sheens across the clear face, the classic look of a glass sheet under a soft box.
        float d = vLocal.x * 0.62 + vLocal.y * 0.78;
        float sheen = (exp(-pow((d - 0.55) / 0.16, 2.0)) * 0.55 + exp(-pow((d + 0.35) / 0.05, 2.0)) * 0.35) * face * (1.0 - print);
        col += vec3(0.85, 1.0, 0.97) * sheen;
        a += sheen * 0.42;
        vec3 ink = vec3(0.01, 0.018, 0.02) + vec3(1.0) * spec * 0.6 + uAqua * fres * 0.2;
        col = mix(col, ink, print);
        a = mix(a, 0.96, print);
        gl_FragColor = vec4(col, clamp(a, 0.0, 0.96));
      `,
    );
  return new THREE.Mesh(geo, mat);
}

/** Dark reflective plinth: an opaque disc with a polished top and a lit rim. */
function plinthMesh({ finish = 'teal' } = {}) {
  const geo = new THREE.CylinderGeometry(2.4, 2.4, 0.42, 256, 1, false);
  const top = finish === 'stone' ? new THREE.Color('#c9cdc6') : new THREE.Color('#06393c');
  const side = finish === 'stone' ? new THREE.Color('#9da49c') : new THREE.Color('#032326');
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTop: { value: top }, uSide: { value: side }, uAqua: { value: AQUA }, uStone: { value: finish === 'stone' ? 1 : 0 } },
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      ${COMMON}
      uniform vec3 uTop, uSide, uAqua;
      uniform float uStone;
      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vW);
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        float fres = pow(1.0 - ndv, 3.0);
        float spec = softboxes(reflect(-V, N));
        float isTop = step(0.5, vLocalN.y);
        // Brushed look: fine concentric streaks on the polished top.
        float r = length(vLocal.xz);
        float brush = 0.5 + 0.5 * sin(r * 260.0) * 0.06 + 0.5 * sin(r * 37.0) * 0.05;
        vec3 topCol = uTop * (0.75 + brush * 0.4) + vec3(1.0) * spec * (0.55 - uStone * 0.3) + mix(uAqua, vec3(1.0), uStone) * fres * 0.5;
        // The top edge catches a thin highlight.
        float lip = smoothstep(2.32, 2.4, r) * isTop;
        topCol += mix(uAqua, vec3(1.0), 0.4 + uStone * 0.4) * lip * 0.9;
        // Sides: darker, with a vertical falloff and a reflection band.
        float h = clamp(vLocal.y / 0.42 + 0.5, 0.0, 1.0);
        vec3 sideCol = uSide * (0.55 + h * 0.6) + vec3(1.0) * spec * 0.4 + uAqua * fres * (0.35 - uStone * 0.2);
        gl_FragColor = vec4(mix(sideCol, topCol, isTop), 1.0);
      }
    `,
  });
  return new THREE.Mesh(geo, mat);
}

function camera(aspect, fov = 28, z = 9) {
  const cam = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);
  cam.position.set(0, 0, z);
  cam.lookAt(0, 0, 0);
  return cam;
}

/** Each scene returns { scene, camera } sized for the canvas aspect. */
export const SCENES = {
  // Hero orbit: a wide glass loop seen at an angle, passing behind the products.
  orbit(aspect) {
    const scene = new THREE.Scene();
    // The loop lies in XZ; tip it ~22° toward the camera for a wide ellipse, then roll it for movement.
    const ribbon = ribbonMesh({ radius: 2.35, width: 0.56, thickness: 0.05, wobble: 0.22, twist: 0.3 });
    ribbon.rotation.set(THREE.MathUtils.degToRad(24), THREE.MathUtils.degToRad(-5), THREE.MathUtils.degToRad(-16));
    scene.add(ribbon);
    return { scene, camera: camera(aspect, 30, 9.2) };
  },
  // Protection: a tempered glass guard floating at an angle.
  guard(aspect) {
    const scene = new THREE.Scene();
    const g = guardMesh();
    g.rotation.set(THREE.MathUtils.degToRad(-18), THREE.MathUtils.degToRad(32), THREE.MathUtils.degToRad(-9));
    scene.add(g);
    return { scene, camera: camera(aspect, 26, 9) };
  },
  // Sculptural base under the hero products, and a lighter stone version for the audio tile.
  plinth(aspect) {
    const scene = new THREE.Scene();
    const p = plinthMesh({ finish: 'teal' });
    p.rotation.x = THREE.MathUtils.degToRad(16);
    scene.add(p);
    return { scene, camera: camera(aspect, 24, 12) };
  },
  plinthStone(aspect) {
    const scene = new THREE.Scene();
    const p = plinthMesh({ finish: 'stone' });
    p.rotation.x = THREE.MathUtils.degToRad(16);
    scene.add(p);
    return { scene, camera: camera(aspect, 24, 12) };
  },
};

export function renderScene(name, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  const { scene, camera: cam } = SCENES[name](width / height);
  renderer.render(scene, cam);
  return canvas.toDataURL('image/png');
}
