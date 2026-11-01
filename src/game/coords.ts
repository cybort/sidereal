/** Equatorial / galactic conversions. Distances in light-years. Angles in degrees. */

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;
export const LY_PER_PC = 3.26156;
export const C_LY_PER_YEAR = 1;
export const R_SUN_LY = 26600;

const RA_NGP = 192.85948;
const DEC_NGP = 27.12825;
const RA_GC = 266.4051;
const DEC_GC = -28.936175;

export type Vec3 = [number, number, number];

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function wrapDeg(d: number): number {
  return ((d % 360) + 360) % 360;
}

export function raDecToAstro(raDeg: number, decDeg: number): Vec3 {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  const c = Math.cos(dec);
  return [c * Math.cos(ra), c * Math.sin(ra), Math.sin(dec)];
}

export function astroToThree(x: number, y: number, z: number): Vec3 {
  return [y, z, -x];
}

export function threeToAstro(x: number, y: number, z: number): Vec3 {
  return [-z, x, y];
}

export function astroToRaDec(x: number, y: number, z: number): { ra: number; dec: number } {
  const ra = Math.atan2(y, x) * RAD;
  const dec = Math.atan2(z, Math.hypot(x, y)) * RAD;
  return { ra: wrapDeg(ra), dec };
}

export function raHoursToDeg(h: number): number {
  return wrapDeg(h * 15);
}

function normalize(v: Vec3): Vec3 {
  const n = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** Galactic +X (GC), +Y (l=90°), +Z (NGP) expressed in equatorial astro coords. */
const GAL_AXES = (() => {
  const z = normalize(raDecToAstro(RA_NGP, DEC_NGP));
  let x = raDecToAstro(RA_GC, DEC_GC);
  x = normalize(sub(x, scale(z, dot(x, z))));
  const y = cross(z, x);
  return { x, y, z };
})();

/** Heliocentric galactic cartesian (ly): +X GC, +Y l=90°, +Z NGP → three.js equatorial. */
export function galacticXyzToThree(x: number, y: number, z: number): Vec3 {
  const { x: gx, y: gy, z: gz } = GAL_AXES;
  const ax = x * gx[0] + y * gy[0] + z * gz[0];
  const ay = x * gx[1] + y * gy[1] + z * gz[1];
  const az = x * gx[2] + y * gy[2] + z * gz[2];
  return astroToThree(ax, ay, az);
}

export function threeToGalacticXyz(tx: number, ty: number, tz: number): Vec3 {
  const [ax, ay, az] = threeToAstro(tx, ty, tz);
  const { x: gx, y: gy, z: gz } = GAL_AXES;
  return [
    ax * gx[0] + ay * gx[1] + az * gx[2],
    ax * gy[0] + ay * gy[1] + az * gy[2],
    ax * gz[0] + ay * gz[1] + az * gz[2],
  ];
}

export function galacticLbdToXyz(lDeg: number, bDeg: number, dist: number): Vec3 {
  const l = lDeg * DEG;
  const b = bDeg * DEG;
  const cb = Math.cos(b);
  return [dist * cb * Math.cos(l), dist * cb * Math.sin(l), dist * Math.sin(b)];
}

export function xyzToGalacticLb(x: number, y: number, z: number): {
  l: number;
  b: number;
  dist: number;
} {
  const dist = Math.hypot(x, y, z);
  if (dist < 1e-9) return { l: 0, b: 0, dist: 0 };
  return {
    l: wrapDeg(Math.atan2(y, x) * RAD),
    b: Math.atan2(z, Math.hypot(x, y)) * RAD,
    dist,
  };
}

export function raDecDistToThree(raDeg: number, decDeg: number, dist: number): Vec3 {
  const [x, y, z] = raDecToAstro(raDeg, decDeg);
  const t = astroToThree(x, y, z);
  return [t[0] * dist, t[1] * dist, t[2] * dist];
}

export function threeDirToRaDec(dx: number, dy: number, dz: number): { ra: number; dec: number } {
  const [ax, ay, az] = threeToAstro(dx, dy, dz);
  return astroToRaDec(ax, ay, az);
}

/** Camera basis: yaw=0 pitch=0 looks −Z = RA 0h Dec 0°. +yaw is left (CCW about +Y). */
export function lookDirFromYawPitch(yaw: number, pitch: number): Vec3 {
  const cp = Math.cos(pitch);
  return [-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp];
}

export function yawPitchFromDir(dx: number, dy: number, dz: number): { yaw: number; pitch: number } {
  const pitch = Math.asin(clamp(dy, -1, 1));
  const cp = Math.cos(pitch);
  if (Math.abs(cp) < 1e-6) return { yaw: 0, pitch };
  const yaw = Math.atan2(-dx / cp, -dz / cp);
  return { yaw, pitch };
}

export function formatRA(raDeg: number): string {
  const h = wrapDeg(raDeg) / 15;
  const hh = Math.floor(h);
  const m = (h - hh) * 60;
  const mm = Math.floor(m);
  const ss = (m - mm) * 60;
  return `${String(hh).padStart(2, "0")}h ${String(mm).padStart(2, "0")}m ${ss.toFixed(0).padStart(2, "0")}s`;
}

export function formatDec(dec: number): string {
  const sign = dec >= 0 ? "+" : "−";
  const a = Math.abs(dec);
  const dd = Math.floor(a);
  const m = (a - dd) * 60;
  const mm = Math.floor(m);
  return `${sign}${String(dd).padStart(2, "0")}° ${String(mm).padStart(2, "0")}′`;
}

export function formatLy(d: number): string {
  if (!Number.isFinite(d)) return "—";
  const a = Math.abs(d);
  if (a < 0.01) return `${d.toFixed(4)} ly`;
  if (a < 1) return `${d.toFixed(3)} ly`;
  if (a < 100) return `${d.toFixed(2)} ly`;
  if (a < 10000) return `${d.toFixed(1)} ly`;
  if (a < 1e6) return `${(d / 1000).toFixed(2)} kly`;
  return `${(d / 1e6).toFixed(2)} Mly`;
}
