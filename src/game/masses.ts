import { galacticXyzToThree, raDecDistToThree, type Vec3 } from "./coords";

/** Schwarzschild radius of the Sun, in light-years (2.95 km). */
export const RS_SUN_LY = 2.95325008 / 9.4607304725808e12;

export function rsLy(massSolar: number): number {
  return RS_SUN_LY * Math.max(massSolar, 0);
}

export type BodyKind = 0 | 1 | 2 | 3;

export type CompactBody = {
  id: string;
  name: string;
  zh: string;
  kind: BodyKind;
  mass: number;
  radius: number;
  pos: Vec3;
};

export type SkyLens = {
  pos: Vec3;
  /** Schwarzschild radius passed to the lens shader. 0 when the bend is negligible. */
  rs: number;
  /** True Schwarzschild radius, even when the shader bend is off. */
  massRs: number;
  radius: number;
  kind: BodyKind;
  zh: string;
  name: string;
  dist: number;
  inside: boolean;
  embedded: boolean;
  /** Proper time per coordinate time from gravity alone. 0 inside a horizon. */
  timeFactor: number;
  /** Frequency boost for light falling in from infinity. */
  gravShift: number;
  /** Angular radius of the shadow or the surface, radians. */
  edgeAngle: number;
  thetaE: number;
};

const KM_PER_LY = 9.4607304725808e12;
const RSUN_LY = 6.957e5 / KM_PER_LY;

function hours(h: number, m: number, s: number): number {
  return (h + m / 60 + s / 3600) * 15;
}
function deg(d: number, m: number, s: number): number {
  const sign = d < 0 ? -1 : 1;
  return sign * (Math.abs(d) + m / 60 + s / 3600);
}

function at(ra: number, dec: number, dist: number): Vec3 {
  return raDecDistToThree(ra, dec, dist);
}

/** Real compact objects and two extended spectacles. Positions are heliocentric, J2000-ish. */
export const COMPACTS: CompactBody[] = [
  {
    id: "sgr-a",
    name: "Sgr A*",
    zh: "人马座A*",
    kind: 0,
    mass: 4.15e6,
    radius: 0,
    pos: galacticXyzToThree(26600, 0, 0),
  },
  {
    id: "cyg-x1",
    name: "Cygnus X-1",
    zh: "天鹅座X-1",
    kind: 0,
    mass: 21.2,
    radius: 0,
    pos: at(hours(19, 58, 21.676), deg(35, 12, 5.78), 7240),
  },
  {
    id: "gaia-bh1",
    name: "Gaia BH1",
    zh: "盖亚BH1",
    kind: 0,
    mass: 9.6,
    radius: 0,
    pos: at(hours(17, 28, 41.097), deg(-0, 34, 51.52), 1560),
  },
  {
    id: "m87",
    name: "M87*",
    zh: "M87*",
    kind: 0,
    mass: 6.5e9,
    radius: 0,
    pos: at(hours(12, 30, 49.42), deg(12, 23, 28.0), 5.37e7),
  },
  {
    id: "crab",
    name: "Crab Pulsar",
    zh: "蟹状脉冲星",
    kind: 1,
    mass: 1.4,
    radius: 12 / KM_PER_LY,
    pos: at(hours(5, 34, 31.94), deg(22, 0, 52.2), 6500),
  },
  {
    id: "vela",
    name: "Vela Pulsar",
    zh: "船帆脉冲星",
    kind: 1,
    mass: 1.4,
    radius: 12 / KM_PER_LY,
    pos: at(hours(8, 35, 20.66), deg(-45, 10, 35.2), 960),
  },
  {
    id: "betelgeuse",
    name: "Betelgeuse",
    zh: "参宿四",
    kind: 2,
    mass: 18,
    radius: 640 * RSUN_LY,
    pos: at(88.793, 7.407, 548),
  },
  {
    id: "sirius-b",
    name: "Sirius B",
    zh: "天狼B",
    kind: 3,
    mass: 1.02,
    radius: 0.0084 * RSUN_LY,
    pos: siriusB(),
  },
];

function siriusB(): Vec3 {
  const a = at(101.287, -16.716, 8.6);
  const n = Math.hypot(a[0], a[1], a[2]) || 1;
  const radial: Vec3 = [a[0] / n, a[1] / n, a[2] / n];
  const up: Vec3 = Math.abs(radial[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const east: Vec3 = [
    radial[1] * up[2] - radial[2] * up[1],
    radial[2] * up[0] - radial[0] * up[2],
    radial[0] * up[1] - radial[1] * up[0],
  ];
  const el = Math.hypot(east[0], east[1], east[2]) || 1;
  const au = 11 / 63241.077;
  return [a[0] + (east[0] / el) * au, a[1] + (east[1] / el) * au, a[2] + (east[2] / el) * au];
}

export type Approach = {
  id: string;
  zh: string;
  label: string;
  pos: Vec3;
  look: Vec3;
};

function farSide(body: Vec3, dist: number): Vec3 {
  const n = Math.hypot(body[0], body[1], body[2]) || 1;
  return [body[0] + (body[0] / n) * dist, body[1] + (body[1] / n) * dist, body[2] + (body[2] / n) * dist];
}

function approach(body: CompactBody, id: string, zh: string, dist: number): Approach {
  return {
    id,
    zh,
    label: body.name,
    pos: farSide(body.pos, dist),
    look: body.pos,
  };
}

export function wonderApproaches(): Approach[] {
  const byId = new Map(COMPACTS.map((b) => [b.id, b]));
  const sgr = byId.get("sgr-a")!;
  const cyg = byId.get("cyg-x1")!;
  const gaia = byId.get("gaia-bh1")!;
  const m87 = byId.get("m87")!;
  const crab = byId.get("crab")!;
  const vela = byId.get("vela")!;
  const bet = byId.get("betelgeuse")!;
  const sb = byId.get("sirius-b")!;
  return [
    approach(sgr, "sgr-a", "人马A*", 16 * rsLy(sgr.mass)),
    approach(sgr, "sgr-a-close", "人马A*近", 6 * rsLy(sgr.mass)),
    approach(cyg, "cyg-x1", "天鹅X-1", 18 * rsLy(cyg.mass)),
    approach(gaia, "gaia-bh1", "盖亚BH1", 18 * rsLy(gaia.mass)),
    approach(m87, "m87", "M87*", 18 * rsLy(m87.mass)),
    approach(crab, "crab", "蟹状星", 4.2 * crab.radius),
    approach(vela, "vela", "船帆星", 4.2 * vela.radius),
    approach(bet, "betel-near", "参宿四旁", 3.4 * bet.radius),
    approach(sb, "sirius-b", "天狼B", 4.2 * sb.radius),
  ];
}

/** Galactic-centre overlook, just above the plane so it is not inside Sgr A*. */
export function galacticOverlook(): Vec3 {
  return galacticXyzToThree(26600, 0, 40);
}

type MassState = {
  observerMass: number;
  massAnchor: Vec3 | null;
  relativity: boolean;
};

function consider(
  best: SkyLens | null,
  pos: Vec3,
  mass: number,
  radius: number,
  kind: BodyKind,
  zh: string,
  name: string,
  obs: Vec3,
): SkyLens | null {
  const dx = pos[0] - obs[0];
  const dy = pos[1] - obs[1];
  const dz = pos[2] - obs[2];
  const dist = Math.hypot(dx, dy, dz);
  const massRs = rsLy(mass);
  if (dist < 1e-18 && massRs <= 0 && radius <= 0) return best;
  const horizon = kind === 0 && massRs > 0 && dist < massRs;
  const embedded = !horizon && radius > 0 && dist < radius;
  const r = Math.max(dist, 1e-18);
  const timeFactor = horizon ? 0 : Math.sqrt(Math.max(0, 1 - massRs / Math.max(r, massRs * 1.0001)));
  const gravShift = !horizon && timeFactor > 0.2 ? Math.min(1 / timeFactor, 2.4) : 1;
  const shadowB = kind === 0 ? 2.5978 * massRs : Math.max(radius, massRs * 1.1);
  const edgeAngle = Math.atan2(shadowB, Math.max(dist, shadowB * 0.02));
  const thetaE = dist > massRs * 1.01 ? Math.sqrt((2 * massRs) / dist) : 0;
  const score = Math.max(edgeAngle, thetaE);
  if (!horizon && !embedded && score < 0.004 && edgeAngle < 0.008) return best;
  const next: SkyLens = {
    pos,
    rs: !horizon && thetaE > 0.004 ? massRs : 0,
    massRs,
    radius,
    kind,
    zh,
    name,
    dist,
    inside: horizon,
    embedded,
    timeFactor,
    gravShift,
    edgeAngle,
    thetaE,
  };
  if (!best) return next;
  const rank = (lens: SkyLens) =>
    lens.inside ? 1e9 : lens.embedded ? 1e8 : Math.max(lens.edgeAngle, lens.thetaE);
  return rank(next) > rank(best) ? next : best;
}

export function dominantLens(obs: Vec3, sim: MassState): SkyLens | null {
  let best: SkyLens | null = null;
  for (const b of COMPACTS) best = consider(best, b.pos, b.mass, b.radius, b.kind, b.zh, b.name, obs);
  if (sim.observerMass > 0.05 && sim.massAnchor) {
    best = consider(best, sim.massAnchor, sim.observerMass, 0, 0, "观测黑洞", "Observer", obs);
  }
  if (!best) return null;
  if (!sim.relativity) {
    return {
      ...best,
      rs: 0,
      inside: false,
      timeFactor: 1,
      gravShift: 1,
      thetaE: 0,
    };
  }
  return best;
}

/** Starlight only bends when the star sits behind the lens. */
export function sourceBehindLens(star: Vec3, obs: Vec3, lens: SkyLens | null): boolean {
  if (!lens || lens.rs <= 0 || lens.inside) return false;
  const lx = lens.pos[0] - obs[0];
  const ly = lens.pos[1] - obs[1];
  const lz = lens.pos[2] - obs[2];
  const along = (star[0] - obs[0]) * lx + (star[1] - obs[1]) * ly + (star[2] - obs[2]) * lz;
  return along > (lx * lx + ly * ly + lz * lz) * 0.98;
}

/**
 * Viewing distance for the observer-mass slider.
 * Larger masses are parked at fewer Schwarzschild radii, so the shadow grows
 * instead of staying a fixed angle.
 */
export function parkDistanceLy(mass: number): number {
  const rs = rsLy(Math.max(mass, 0));
  const rho = Math.max(3.4, 170 * Math.pow(Math.max(mass, 0.05), -0.17));
  return rho * rs;
}

/** Schwarzschild primary image. Bends a rest-frame direction around `lens`. */
export function lensDirection(dir: Vec3, obs: Vec3, lens: SkyLens | null): Vec3 {
  if (!lens || lens.inside || lens.rs <= 0 || lens.thetaE < 0.004) return dir;
  const dx = lens.pos[0] - obs[0];
  const dy = lens.pos[1] - obs[1];
  const dz = lens.pos[2] - obs[2];
  const Dl = Math.hypot(dx, dy, dz);
  if (Dl < 1e-12) return dir;
  const lhat: Vec3 = [dx / Dl, dy / Dl, dz / Dl];
  const c = Math.max(-1, Math.min(1, dir[0] * lhat[0] + dir[1] * lhat[1] + dir[2] * lhat[2]));
  const beta = Math.acos(c);
  const thetaE2 = lens.thetaE * lens.thetaE;
  const theta = 0.5 * (beta + Math.sqrt(beta * beta + 4 * thetaE2));
  let px = dir[0] - lhat[0] * c;
  let py = dir[1] - lhat[1] * c;
  let pz = dir[2] - lhat[2] * c;
  const pl = Math.hypot(px, py, pz);
  if (pl < 1e-6) {
    const tmp: Vec3 = Math.abs(lhat[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    px = lhat[1] * tmp[2] - lhat[2] * tmp[1];
    py = lhat[2] * tmp[0] - lhat[0] * tmp[2];
    pz = lhat[0] * tmp[1] - lhat[1] * tmp[0];
    const n = Math.hypot(px, py, pz) || 1;
    px /= n;
    py /= n;
    pz /= n;
  } else {
    px /= pl;
    py /= pl;
    pz /= pl;
  }
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  return [ct * lhat[0] + st * px, ct * lhat[1] + st * py, ct * lhat[2] + st * pz];
}

export function massFromSlider(t: number): number {
  if (t <= 0.001) return 0;
  return 10 ** (t * 9.3 - 1.3);
}

export function sliderFromMass(mass: number): number {
  if (mass <= 0.05) return 0;
  return Math.max(0, Math.min(1, (Math.log10(mass) + 1.3) / 9.3));
}

export function formatMass(mass: number): string {
  if (mass < 0.05) return "0";
  if (mass < 10) return `${mass.toFixed(1)} M☉`;
  if (mass < 1e4) return `${mass.toFixed(0)} M☉`;
  if (mass < 1e6) return `${(mass / 1e3).toFixed(1)}k M☉`;
  if (mass < 1e9) return `${(mass / 1e6).toFixed(2)}M M☉`;
  return `${(mass / 1e9).toFixed(2)}B M☉`;
}
