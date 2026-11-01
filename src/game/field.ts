import { CATALOG } from "./catalog";
import { galacticXyzToThree, raDecDistToThree } from "./coords";

export const MAX_STARS = 56000;
export const MAX_DUST = 9000;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randn(rng: () => number): number {
  const u = Math.max(rng(), 1e-6);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

function spectral(rng: () => number): { bv: number; absMag: number } {
  const u = rng();
  if (u < 0.005) return { bv: -0.28 + rng() * 0.12, absMag: -4.2 + rng() * 2.5 };
  if (u < 0.02) return { bv: -0.12 + rng() * 0.12, absMag: -1.2 + rng() * 2 };
  if (u < 0.08) return { bv: 0.02 + rng() * 0.18, absMag: 0.6 + rng() * 1.4 };
  if (u < 0.2) return { bv: 0.3 + rng() * 0.22, absMag: 2.6 + rng() * 1.2 };
  if (u < 0.4) return { bv: 0.58 + rng() * 0.18, absMag: 4.4 + rng() * 1.1 };
  if (u < 0.7) return { bv: 0.82 + rng() * 0.28, absMag: 6.0 + rng() * 1.4 };
  return { bv: 1.2 + rng() * 0.55, absMag: 8.2 + rng() * 2.4 };
}

function apparentMag(absMag: number, distLy: number): number {
  const dpc = Math.max(distLy / 3.26156, 0.05);
  return absMag + 5 * Math.log10(dpc) - 5;
}

export type StarBuffers = {
  pos: Float32Array;
  mag: Float32Array;
  bv: Float32Array;
  pm: Float32Array;
  ext: Float32Array;
  count: number;
};

export function buildStarField(): StarBuffers {
  const pos = new Float32Array(MAX_STARS * 3);
  const mag = new Float32Array(MAX_STARS);
  const bv = new Float32Array(MAX_STARS);
  const pm = new Float32Array(MAX_STARS * 2);
  const ext = new Float32Array(MAX_STARS);
  const rng = mulberry32(0x51de2a11);

  let i = 0;
  const push = (
    x: number,
    y: number,
    z: number,
    m: number,
    b: number,
    pmx = 0,
    pmy = 0,
    dust = 0,
  ) => {
    if (i >= MAX_STARS) return;
    const o = i * 3;
    pos[o] = x;
    pos[o + 1] = y;
    pos[o + 2] = z;
    mag[i] = m;
    bv[i] = b;
    pm[i * 2] = pmx;
    pm[i * 2 + 1] = pmy;
    ext[i] = dust;
    i++;
  };

  for (const s of CATALOG) {
    if (s.name === "Sol") {
      push(0.00001, 0, 0, s.mag, s.bv, 0, 0);
      continue;
    }
    const p = raDecDistToThree(s.ra, s.dec, Math.max(s.dist, 0.01));
    push(p[0], p[1], p[2], s.mag, s.bv, s.pmRa, s.pmDec);
  }

  let innerGot = 0;
  const innerTarget = Math.floor(MAX_STARS * 0.14);
  while (i < MAX_STARS) {
    const wantInner = innerGot < innerTarget;
    const pop = rng();
    let gx: number;
    let gy: number;
    let gz: number;
    if (wantInner) {
      const ru = 12 + Math.pow(rng(), 0.62) * 900;
      const u = (rng() * 2 - 1) * 0.55;
      const th = rng() * Math.PI * 2;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      gx = 26600 + ru * s * Math.cos(th);
      gy = ru * s * Math.sin(th);
      gz = ru * u * 0.35;
    } else if (pop < 0.5) {
      const r = Math.pow(rng(), 0.38) * 2600;
      const th = rng() * Math.PI * 2;
      gx = r * Math.cos(th);
      gy = r * Math.sin(th);
      gz = randn(rng) * 85;
    } else if (pop < 0.78) {
      const R = 1800 + Math.pow(rng(), 0.62) * 50000;
      const phi = rng() * Math.PI * 2;
      const xGc = R * Math.cos(phi);
      const yGc = R * Math.sin(phi);
      gx = 26600 - xGc;
      gy = yGc;
      gz = randn(rng) * (160 + 0.01 * R);
    } else if (pop < 0.86) {
      const ru = Math.pow(rng(), 1 / 3) * 3800;
      const u = rng() * 2 - 1;
      const th = rng() * Math.PI * 2;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      gx = 26600 + ru * s * Math.cos(th);
      gy = ru * s * Math.sin(th);
      gz = ru * u * 0.55;
    } else {
      const ru = Math.pow(rng(), 1 / 3) * 42000;
      const u = rng() * 2 - 1;
      const th = rng() * Math.PI * 2;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      gx = ru * s * Math.cos(th);
      gy = ru * s * Math.sin(th);
      gz = ru * u;
    }

    const t = galacticXyzToThree(gx, gy, gz);
    const dist = Math.hypot(t[0], t[1], t[2]);
    if (dist < 3.5) continue;
    const distGc = Math.hypot(gx - 26600, gy, gz);
    if (distGc < 2) continue;
    const sp = wantInner
      ? (rng() < 0.35
        ? { bv: 1.05 + rng() * 0.55, absMag: -3.4 + rng() * 2.2 }
        : { bv: spectral(rng).bv, absMag: -1.2 + rng() * 3.2 })
      : spectral(rng);
    const plane = Math.abs(gz);
    const ext = 0.0007 * Math.hypot(gx, gy) * (plane < 400 ? 1 : 0.25);
    const m = apparentMag(sp.absMag, dist);
    const mGc = apparentMag(sp.absMag, Math.max(distGc, 0.4));
    if (wantInner) {
      if (mGc > 7.4) continue;
      innerGot++;
    } else if (m + ext > 12.8 && rng() > 0.18) continue;
    push(t[0], t[1], t[2], m, sp.bv, (rng() - 0.5) * 40, (rng() - 0.5) * 40, ext);
  }

  return { pos, mag, bv, pm, ext, count: i };
}

export type DustBuffers = {
  pos: Float32Array;
  seed: Float32Array;
  count: number;
};

export function buildDust(count: number, box: number): DustBuffers {
  const rng = mulberry32(0x11a3c0de);
  const n = Math.min(count, MAX_DUST);
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (rng() - 0.5) * box;
    pos[i * 3 + 1] = (rng() - 0.5) * box;
    pos[i * 3 + 2] = (rng() - 0.5) * box;
    seed[i] = rng() * 1000;
  }
  return { pos, seed, count: n };
}

export function densityToCount(density: number): number {
  const t = Math.max(0.12, Math.min(1, density));
  return Math.floor(2800 + t * (MAX_STARS - 2800));
}
