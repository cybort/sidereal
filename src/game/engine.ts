import * as THREE from "three";
import { buildConstellationPositions, buildGridPositions } from "./catalog";
import { buildDust, buildStarField, densityToCount } from "./field";
import { createInput, type Input } from "./input";
import { betaFromPhi } from "./relativity";
import { dominantLens } from "./masses";
import { lookDirFromYawPitch } from "./coords";
import {
  BODY_FRAG,
  BODY_VERT,
  DUST_FRAG,
  DUST_VERT,
  INTERIOR_FRAG,
  INTERIOR_VERT,
  LINE_FRAG,
  LINE_VERT,
  STAR_FRAG,
  STAR_VERT,
  WARP_FRAG,
  WARP_VERT,
} from "./shaders";
import { stepSim, type Sim } from "./sim";

export type Engine = {
  canvas: HTMLCanvasElement;
  sim: Sim;
  input: Input;
  dispose: () => void;
  setDensity: (d: number) => void;
};

const _vel = new THREE.Vector3();
const _obs = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, "YXZ");

export function createEngine(canvas: HTMLCanvasElement, sim: Sim): Engine {
  const input = createInput();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
    stencil: false,
    depth: true,
  });
  renderer.setClearColor(0x020308, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(pixelRatio());
  renderer.sortObjects = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 8000);
  camera.rotation.order = "YXZ";

  const stars = buildStarField();
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(stars.pos, 3));
  starGeo.setAttribute("aMag", new THREE.BufferAttribute(stars.mag, 1));
  starGeo.setAttribute("aBv", new THREE.BufferAttribute(stars.bv, 1));
  starGeo.setAttribute("aPm", new THREE.BufferAttribute(stars.pm, 2));
  starGeo.setAttribute("aExt", new THREE.BufferAttribute(stars.ext, 1));
  starGeo.setDrawRange(0, densityToCount(sim.density));
  starGeo.computeBoundingSphere();

  const starUniforms = {
    uObserver: { value: new THREE.Vector3() },
    uYear: { value: sim.epochYear },
    uBeta: { value: 0 },
    uVelDir: { value: new THREE.Vector3(0, 0, -1) },
    uPixelRatio: { value: pixelRatio() },
    uTrail: { value: 0 },
    uRelativity: { value: 1 },
    uFovBoost: { value: 0 },
    uLensPos: { value: new THREE.Vector3() },
    uLensRs: { value: 0 },
    uLensRadius: { value: 0 },
    uLensGrav: { value: 1 },
    uInside: { value: 0 },
    uLensEdge: { value: 0 },
    uSecondary: { value: 0 },
  };

  const starMat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    uniforms: starUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const starPoints = new THREE.Points(starGeo, starMat);
  starPoints.frustumCulled = false;
  scene.add(starPoints);

  const starUniformsB = {
    uObserver: { value: new THREE.Vector3() },
    uYear: { value: sim.epochYear },
    uBeta: { value: 0 },
    uVelDir: { value: new THREE.Vector3(0, 0, -1) },
    uPixelRatio: { value: pixelRatio() },
    uTrail: { value: 0 },
    uRelativity: { value: 1 },
    uFovBoost: { value: 0 },
    uLensPos: { value: new THREE.Vector3() },
    uLensRs: { value: 0 },
    uLensRadius: { value: 0 },
    uLensGrav: { value: 1 },
    uInside: { value: 0 },
    uLensEdge: { value: 0 },
    uSecondary: { value: 1 },
  };
  const starMatB = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    uniforms: starUniformsB,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const starPointsB = new THREE.Points(starGeo, starMatB);
  starPointsB.frustumCulled = false;
  starPointsB.visible = false;
  scene.add(starPointsB);

  const isCoarse = matchMedia("(pointer: coarse)").matches || innerWidth < 700;
  const dustBox = 48;
  const dust = buildDust(isCoarse ? 4200 : 7800, dustBox);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dust.pos, 3));
  dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(dust.seed, 1));
  const dustUniforms = {
    uVelDir: { value: new THREE.Vector3(0, 0, -1) },
    uTravel: { value: 0 },
    uBox: { value: dustBox },
    uPixelRatio: { value: pixelRatio() },
    uTrail: { value: 0 },
    uBeta: { value: 0 },
    uRelativity: { value: 1 },
    uLensDim: { value: 0 },
  };
  const dustMat = new THREE.ShaderMaterial({
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    uniforms: dustUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  dustPoints.frustumCulled = false;
  scene.add(dustPoints);

  const lines = buildConstellationPositions();
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(lines.positions, 3));
  const lineUniforms = {
    uObserver: { value: new THREE.Vector3() },
    uBeta: { value: 0 },
    uVelDir: { value: new THREE.Vector3(0, 0, -1) },
    uRelativity: { value: 1 },
    uYear: { value: sim.epochYear },
    uColor: { value: new THREE.Color(0x9eb0c4) },
    uLensPos: { value: new THREE.Vector3() },
    uLensRs: { value: 0 },
    uInside: { value: 0 },
  };
  const lineMat = new THREE.ShaderMaterial({
    vertexShader: LINE_VERT,
    fragmentShader: LINE_FRAG,
    uniforms: lineUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
  lineMesh.frustumCulled = false;
  scene.add(lineMesh);

  const gridPos = buildGridPositions();
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute("position", new THREE.BufferAttribute(gridPos, 3));
  const gridUniforms = {
    uObserver: { value: new THREE.Vector3() },
    uBeta: { value: 0 },
    uVelDir: { value: new THREE.Vector3(0, 0, -1) },
    uRelativity: { value: 1 },
    uYear: { value: sim.epochYear },
    uColor: { value: new THREE.Color(0x2a3344) },
    uLensPos: { value: new THREE.Vector3() },
    uLensRs: { value: 0 },
    uInside: { value: 0 },
  };
  const gridMat = new THREE.ShaderMaterial({
    vertexShader: LINE_VERT,
    fragmentShader: LINE_FRAG,
    uniforms: gridUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const gridMesh = new THREE.LineSegments(gridGeo, gridMat);
  gridMesh.frustumCulled = false;
  gridMesh.visible = sim.showGrid;
  scene.add(gridMesh);

  const warpGeo = new THREE.BufferGeometry();
  warpGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
  );
  warpGeo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  const warpUniforms = {
    uBoost: { value: 0 },
    uTime: { value: 0 },
    uAspect: { value: 1 },
  };
  const warpMat = new THREE.ShaderMaterial({
    vertexShader: WARP_VERT,
    fragmentShader: WARP_FRAG,
    uniforms: warpUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const warpMesh = new THREE.Mesh(warpGeo, warpMat);
  warpMesh.frustumCulled = false;
  scene.add(warpMesh);

  const bodyGeo = new THREE.PlaneGeometry(1, 1);
  const bodyUniforms = {
    uKind: { value: 0 },
    uHalf: { value: 0.2 },
    uEdge: { value: 0.1 },
    uTime: { value: 0 },
  };
  const bodyMat = new THREE.ShaderMaterial({
    vertexShader: BODY_VERT,
    fragmentShader: BODY_FRAG,
    uniforms: bodyUniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.frustumCulled = false;
  bodyMesh.visible = false;
  scene.add(bodyMesh);

  const veilGeo = new THREE.BufferGeometry();
  veilGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
  );
  veilGeo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
  const veilUniforms = { uTime: { value: 0 }, uKind: { value: 0 } };
  const veilMat = new THREE.ShaderMaterial({
    vertexShader: INTERIOR_VERT,
    fragmentShader: INTERIOR_FRAG,
    uniforms: veilUniforms,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const veilMesh = new THREE.Mesh(veilGeo, veilMat);
  veilMesh.frustumCulled = false;
  veilMesh.visible = false;
  scene.add(veilMesh);

  let running = true;
  let last = performance.now();
  let fpsEma = 60;
  let dprCap = pixelRatio();

  function resize() {
    const parent = canvas.parentElement ?? canvas;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    warpUniforms.uAspect.value = w / h;
    starUniforms.uPixelRatio.value = renderer.getPixelRatio();
    dustUniforms.uPixelRatio.value = renderer.getPixelRatio();
    starUniformsB.uPixelRatio.value = renderer.getPixelRatio();
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement ?? canvas);
  resize();

  function tick(now: number) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    fpsEma = fpsEma * 0.92 + (dt > 0 ? 1 / dt : 60) * 0.08;
    if (fpsEma < 48 && dprCap > 1.1) {
      dprCap = Math.max(1, dprCap - 0.15);
      renderer.setPixelRatio(dprCap);
      starUniforms.uPixelRatio.value = dprCap;
      dustUniforms.uPixelRatio.value = dprCap;
      starUniformsB.uPixelRatio.value = dprCap;
    }

    const actions = input.sample();
    stepSim(sim, actions, dt);

    const beta = betaFromPhi(sim.rapidity);
    const trail = Math.min(1, Math.pow(beta, 1.35) * 1.15 + (sim.boost ? 0.2 : 0));

    _euler.set(sim.pitch, sim.yaw, sim.roll, "YXZ");
    camera.quaternion.setFromEuler(_euler);
    camera.fov = sim.fov;
    camera.updateProjectionMatrix();

    _obs.set(sim.pos[0], sim.pos[1], sim.pos[2]);
    _vel.set(sim.velDir[0], sim.velDir[1], sim.velDir[2]);

    dustUniforms.uVelDir.value.copy(_vel);
    dustUniforms.uTravel.value = sim.travel;
    dustUniforms.uTrail.value = trail;
    dustUniforms.uBeta.value = beta;
    dustUniforms.uRelativity.value = sim.relativity ? 1 : 0;

    const lens = dominantLens(_obs.toArray() as [number, number, number], sim);
    const trapped = Boolean(lens && (lens.inside || lens.embedded));
    const rs = lens && !trapped ? lens.rs : 0;
    const grav = lens && !trapped ? lens.gravShift : 1;
    const inside = trapped ? 1 : 0;
    const edge = lens?.edgeAngle ?? 0;
    for (const u of [starUniforms, starUniformsB]) {
      u.uObserver.value.copy(_obs);
      u.uYear.value = sim.epochYear;
      u.uBeta.value = beta;
      u.uVelDir.value.copy(_vel);
      u.uTrail.value = trail;
      u.uRelativity.value = sim.relativity ? 1 : 0;
      u.uFovBoost.value = sim.boost ? 1 : 0;
      u.uLensPos.value.set(lens?.pos[0] ?? 0, lens?.pos[1] ?? 0, lens?.pos[2] ?? 0);
      u.uLensRs.value = rs;
      u.uLensRadius.value = lens?.radius ?? 0;
      u.uLensGrav.value = grav;
      u.uInside.value = inside;
      u.uLensEdge.value = edge;
    }
    starPointsB.visible = rs > 0 && !trapped;

    dustUniforms.uLensDim.value = trapped
      ? 1
      : lens
        ? Math.min(1, Math.max(0, (lens.edgeAngle - 0.02) / 0.1))
        : 0;

    lineUniforms.uLensPos.value.copy(starUniforms.uLensPos.value);
    lineUniforms.uLensRs.value = rs;
    lineUniforms.uInside.value = inside;
    gridUniforms.uLensRs.value = 0;
    gridUniforms.uInside.value = inside;

    const look = lookDirFromYawPitch(sim.yaw, sim.pitch);
    const impostor = 40;
    if (
      lens &&
      !trapped &&
      lens.edgeAngle > 0.006 &&
      look[0] * (lens.pos[0] - sim.pos[0]) +
        look[1] * (lens.pos[1] - sim.pos[1]) +
        look[2] * (lens.pos[2] - sim.pos[2]) >
        0
    ) {
      const dx = lens.pos[0] - sim.pos[0];
      const dy = lens.pos[1] - sim.pos[1];
      const dz = lens.pos[2] - sim.pos[2];
      const dl = Math.hypot(dx, dy, dz) || 1;
      bodyMesh.position.set((dx / dl) * impostor, (dy / dl) * impostor, (dz / dl) * impostor);
      bodyMesh.quaternion.copy(camera.quaternion);
      const half = Math.min(1.05, lens.edgeAngle * (lens.kind === 0 ? 1.95 : 1.22));
      const span = 2 * impostor * Math.tan(half);
      bodyMesh.scale.set(span, span, 1);
      bodyUniforms.uKind.value = lens.kind;
      bodyUniforms.uHalf.value = half;
      bodyUniforms.uEdge.value = lens.edgeAngle;
      bodyUniforms.uTime.value = now * 0.001;
      bodyMesh.visible = true;
    } else {
      bodyMesh.visible = false;
    }
    veilMesh.visible = trapped;
    veilUniforms.uTime.value = now * 0.001;
    veilUniforms.uKind.value = lens?.inside ? 0 : (lens?.kind ?? 0);

    lineUniforms.uObserver.value.copy(_obs);
    lineUniforms.uBeta.value = beta;
    lineUniforms.uVelDir.value.copy(_vel);
    lineUniforms.uRelativity.value = sim.relativity ? 1 : 0;
    lineUniforms.uYear.value = sim.epochYear;
    lineMesh.visible = sim.showConstellations && !(lens && !trapped && lens.edgeAngle > 0.1);

    gridUniforms.uObserver.value.set(0, 0, 0);
    gridUniforms.uBeta.value = beta;
    gridUniforms.uVelDir.value.copy(_vel);
    gridUniforms.uRelativity.value = sim.relativity ? 1 : 0;
    gridMesh.visible = sim.showGrid;

    const warpTarget = sim.boost
      ? Math.min(1, beta * 1.4)
      : Math.max(0, beta - 0.85) * 2;
    warpUniforms.uBoost.value +=
      (warpTarget - warpUniforms.uBoost.value) * (1 - Math.exp(-6 * dt));
    warpUniforms.uTime.value = now * 0.001;

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(tick);

  function setDensity(d: number) {
    sim.density = d;
    starGeo.setDrawRange(0, densityToCount(d));
  }

  function dispose() {
    running = false;
    renderer.setAnimationLoop(null);
    ro.disconnect();
    starGeo.dispose();
    starMat.dispose();
    starMatB.dispose();
    dustGeo.dispose();
    dustMat.dispose();
    lineGeo.dispose();
    lineMat.dispose();
    gridGeo.dispose();
    gridMat.dispose();
    bodyGeo.dispose();
    bodyMat.dispose();
    veilGeo.dispose();
    veilMat.dispose();
    warpGeo.dispose();
    warpMat.dispose();
    renderer.dispose();
  }

  return { canvas, sim, input, dispose, setDensity };
}

function pixelRatio(): number {
  const coarse = matchMedia("(pointer: coarse)").matches || innerWidth < 700;
  return Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.75);
}
