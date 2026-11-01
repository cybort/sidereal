import { catalogByName } from "./catalog";
import {
  clamp,
  lookDirFromYawPitch,
  raDecDistToThree,
  threeToGalacticXyz,
  yawPitchFromDir,
  type Vec3,
} from "./coords";
import { betaFromPhi, gammaFromPhi } from "./relativity";
import { applyAttitude, attitudeCalibrated, attitudeReady, calibrateAttitude } from "./attitude";
import { dominantLens, parkDistanceLy, type SkyLens } from "./masses";

export type Sim = {
  yaw: number;
  pitch: number;
  roll: number;
  rapidity: number;
  cruisePhi: number;
  boost: boolean;
  pos: Vec3;
  velDir: Vec3;
  inertial: boolean;
  velYaw: number;
  velPitch: number;
  epochYear: number;
  coordYears: number;
  properYears: number;
  timeRate: number;
  density: number;
  sensitivity: number;
  relativity: boolean;
  showConstellations: boolean;
  showLabels: boolean;
  showGrid: boolean;
  started: boolean;
  hudVisible: boolean;
  travel: number;
  fov: number;
  observerMass: number;
  massAnchor: Vec3 | null;
  /** Phone or tablet pose drives the view. Not persisted. */
  attitude: boolean;
};

const STORAGE_KEY = "sidereal-v1";
const NOW_YEAR = 2026.7;

export function defaultSim(): Sim {
  return {
    yaw: 1.48,
    pitch: 0.12,
    roll: 0,
    rapidity: 0.22,
    cruisePhi: 0.22,
    boost: false,
    pos: [0, 0, 0],
    velDir: lookDirFromYawPitch(1.48, 0.12),
    inertial: false,
    velYaw: 1.48,
    velPitch: 0.12,
    epochYear: NOW_YEAR,
    coordYears: 0,
    properYears: 0,
    timeRate: 0.008,
    density: 0.55,
    sensitivity: 1,
    relativity: true,
    showConstellations: true,
    showLabels: true,
    showGrid: false,
    started: false,
    hudVisible: true,
    travel: 0,
    fov: 72,
    observerMass: 0,
    massAnchor: null,
    attitude: false,
  };
}

export function loadSim(): Sim {
  const s = defaultSim();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return s;
    const d = JSON.parse(raw) as Partial<Sim>;
    if (typeof d.density === "number") s.density = clamp(d.density, 0.12, 1);
    if (typeof d.sensitivity === "number") s.sensitivity = clamp(d.sensitivity, 0.3, 2.4);
    if (typeof d.relativity === "boolean") s.relativity = d.relativity;
    if (typeof d.showConstellations === "boolean") s.showConstellations = d.showConstellations;
    if (typeof d.showLabels === "boolean") s.showLabels = d.showLabels;
    if (typeof d.showGrid === "boolean") s.showGrid = d.showGrid;
    if (typeof d.inertial === "boolean") s.inertial = d.inertial;
    if (typeof d.cruisePhi === "number") {
      s.cruisePhi = clamp(d.cruisePhi, 0, 5);
      s.rapidity = s.cruisePhi;
    }
    if (typeof d.yaw === "number") s.yaw = d.yaw;
    if (typeof d.pitch === "number") s.pitch = clamp(d.pitch, -1.45, 1.45);
    if (typeof d.epochYear === "number") s.epochYear = clamp(d.epochYear, -12000, 12000);
    if (Array.isArray(d.pos) && d.pos.length === 3) {
      s.pos = [d.pos[0] ?? 0, d.pos[1] ?? 0, d.pos[2] ?? 0];
    }
    if (typeof d.timeRate === "number") s.timeRate = clamp(d.timeRate, 0, 2);
    if (typeof d.observerMass === "number") s.observerMass = clamp(d.observerMass, 0, 1e9);
    if (Array.isArray(d.massAnchor) && d.massAnchor.length === 3 && s.observerMass > 0) {
      s.massAnchor = [d.massAnchor[0] ?? 0, d.massAnchor[1] ?? 0, d.massAnchor[2] ?? 0];
    }
    if (s.massAnchor && s.observerMass > 0 && typeof d.yaw !== "number") {
      const a = s.massAnchor;
      const dx = a[0] - s.pos[0];
      const dy = a[1] - s.pos[1];
      const dz = a[2] - s.pos[2];
      const n = Math.hypot(dx, dy, dz) || 1;
      const yp = yawPitchFromDir(dx / n, dy / n, dz / n);
      s.yaw = yp.yaw;
      s.pitch = yp.pitch;
    }
    s.velYaw = s.yaw;
    s.velPitch = s.pitch;
    s.velDir = lookDirFromYawPitch(s.yaw, s.pitch);
  } catch {
    /* ignore */
  }
  return s;
}

export function saveSim(s: Sim): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        density: s.density,
        sensitivity: s.sensitivity,
        relativity: s.relativity,
        showConstellations: s.showConstellations,
        showLabels: s.showLabels,
        showGrid: s.showGrid,
        inertial: s.inertial,
        cruisePhi: s.cruisePhi,
        yaw: s.yaw,
        pitch: s.pitch,
        epochYear: s.epochYear,
        pos: s.pos,
        timeRate: s.timeRate,
        observerMass: s.observerMass,
        massAnchor: s.massAnchor,
      }),
    );
  } catch {
    /* ignore */
  }
}

export type FrameActions = {
  yaw: number;
  pitch: number;
  roll: number;
  throttle: number;
  boost: boolean;
  lookDx: number;
  lookDy: number;
};

export function stepSim(s: Sim, a: FrameActions, dt: number): void {
  const sens = 0.0022 * s.sensitivity;
  const turn = 1.35 * dt;
  const userLook =
    Math.abs(a.lookDx) > 0.2 ||
    Math.abs(a.lookDy) > 0.2 ||
    Math.abs(a.yaw) > 0.01 ||
    Math.abs(a.pitch) > 0.01 ||
    Math.abs(a.roll) > 0.01;

  const integrateLook = (decayRoll: boolean) => {
    s.yaw -= a.lookDx * sens;
    s.pitch = clamp(s.pitch - a.lookDy * sens, -1.45, 1.45);
    s.yaw += a.yaw * turn;
    s.pitch = clamp(s.pitch + a.pitch * turn, -1.45, 1.45);
    s.roll += a.roll * 0.9 * dt;
    if (decayRoll) s.roll *= Math.pow(0.12, dt);
  };

  if (s.attitude && attitudeReady()) {
    if (userLook || !attitudeCalibrated()) {
      integrateLook(false);
      calibrateAttitude(s);
    } else if (!applyAttitude(s)) {
      calibrateAttitude(s);
    }
  } else {
    integrateLook(true);
  }

  const targetCruise = clamp(s.cruisePhi + a.throttle * 1.6 * dt, 0, 4.8);
  s.cruisePhi = targetCruise;

  const boostTarget = a.boost ? s.cruisePhi + 2.35 : s.cruisePhi;
  const k = a.boost ? 3.4 : 2.2;
  s.rapidity += (boostTarget - s.rapidity) * (1 - Math.exp(-k * dt));
  s.boost = a.boost;

  const look = lookDirFromYawPitch(s.yaw, s.pitch);
  if (s.inertial) {
    s.velDir = lookDirFromYawPitch(s.velYaw, s.velPitch);
  } else {
    s.velYaw = s.yaw;
    s.velPitch = s.pitch;
    s.velDir = look;
  }

  const beta = betaFromPhi(s.rapidity);
  const gamma = gammaFromPhi(s.rapidity);
  const years = dt * s.timeRate;
  const lens = dominantLens(s.pos, s);
  if (lens?.inside) {
    s.properYears += years / Math.max(gamma, 1);
    sinkToward(s, lens, dt);
  } else if (lens?.embedded) {
    s.coordYears += years;
    s.properYears += years / Math.max(gamma, 1);
    s.epochYear += years;
    sinkToward(s, lens, dt);
  } else {
    const grav = lens && lens.timeFactor > 0 ? lens.timeFactor : 1;
    s.coordYears += years;
    s.properYears += (years * grav) / Math.max(gamma, 1);
    s.epochYear += years;
    const step = coastStep(lens, beta, years, dt);
    s.pos[0] += s.velDir[0] * step;
    s.pos[1] += s.velDir[1] * step;
    s.pos[2] += s.velDir[2] * step;
  }

  const visual = 8 + 140 * beta + (a.boost ? 90 : 0);
  s.travel += visual * dt;

  const fovTarget = 70 + 26 * beta * beta + (a.boost ? 8 : 0);
  s.fov += (fovTarget - s.fov) * (1 - Math.exp(-5 * dt));
}

export function lookAtPoint(s: Sim, x: number, y: number, z: number): void {
  const dx = x - s.pos[0];
  const dy = y - s.pos[1];
  const dz = z - s.pos[2];
  const n = Math.hypot(dx, dy, dz) || 1;
  const dir: Vec3 = [dx / n, dy / n, dz / n];
  const yp = yawPitchFromDir(dir[0], dir[1], dir[2]);
  s.yaw = yp.yaw;
  s.pitch = yp.pitch;
  if (!s.inertial) {
    s.velYaw = s.yaw;
    s.velPitch = s.pitch;
    s.velDir = dir;
  }
}

/** Near a compact body, don't cross it in a single frame. */
function coastStep(lens: SkyLens | null, beta: number, years: number, dt: number): number {
  let step = beta * years;
  if (!lens) return step;
  const scale = Math.max(lens.massRs, lens.radius);
  if (scale <= 0) return step;
  return Math.min(step, scale * 0.65 * dt);
}

function sinkToward(s: Sim, lens: SkyLens, dt: number): void {
  const dx = lens.pos[0] - s.pos[0];
  const dy = lens.pos[1] - s.pos[1];
  const dz = lens.pos[2] - s.pos[2];
  const r = Math.hypot(dx, dy, dz);
  const scale = Math.max(lens.massRs, lens.radius, 1e-18);
  const pull = Math.min(r * 0.45, scale * 0.2) * dt;
  if (r < 1e-12 || pull <= 0) return;
  s.pos[0] += (dx / r) * pull;
  s.pos[1] += (dy / r) * pull;
  s.pos[2] += (dz / r) * pull;
}

/** Park a Schwarzschild mass ahead of the camera. Bigger masses subtend a larger shadow. */
export function setObserverMass(s: Sim, mass: number): void {
  const m = clamp(mass, 0, 1e9);
  s.observerMass = m;
  if (m <= 0.05) {
    s.observerMass = 0;
    s.massAnchor = null;
    return;
  }
  if (!s.massAnchor) s.massAnchor = [s.pos[0], s.pos[1], s.pos[2]];
  const dist = parkDistanceLy(m);
  const look = lookDirFromYawPitch(s.yaw, s.pitch);
  const a = s.massAnchor;
  s.pos[0] = a[0] - look[0] * dist;
  s.pos[1] = a[1] - look[1] * dist;
  s.pos[2] = a[2] - look[2] * dist;
  s.rapidity = 0;
  s.cruisePhi = 0;
  s.boost = false;
}

export function lookAtStar(s: Sim, name: string): void {
  const star = catalogByName.get(name);
  if (!star) return;
  const d = Math.max(star.dist, 0.01);
  const p = raDecDistToThree(star.ra, star.dec, d);
  const dx = p[0] - s.pos[0];
  const dy = p[1] - s.pos[1];
  const dz = p[2] - s.pos[2];
  const n = Math.hypot(dx, dy, dz) || 1;
  const yp = yawPitchFromDir(dx / n, dy / n, dz / n);
  s.yaw = yp.yaw;
  s.pitch = yp.pitch;
}

export function setPosGalactic(s: Sim, x: number, y: number, z: number): void {
  s.pos = [x, y, z];
}

export function galacticOf(s: Sim) {
  return threeToGalacticXyz(s.pos[0], s.pos[1], s.pos[2]);
}
