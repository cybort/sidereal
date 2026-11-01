import { clamp, type Vec3 } from "./coords";

/** Rapidity φ: β = tanh φ, γ = cosh φ. Unbounded, never exceeds c. */
export function betaFromPhi(phi: number): number {
  return Math.tanh(phi);
}

export function gammaFromPhi(phi: number): number {
  return Math.cosh(Math.min(Math.abs(phi), 12));
}

export function phiFromBeta(beta: number): number {
  const b = clamp(beta, -0.999999, 0.999999);
  return 0.5 * Math.log((1 + b) / (1 - b));
}

export function formatBeta(beta: number): string {
  const a = Math.abs(beta);
  if (a < 0.001) return `${(beta * 100).toFixed(2)}% c`;
  if (a < 0.1) return `${beta.toFixed(4)} c`;
  if (a < 0.99) return `${beta.toFixed(4)} c`;
  if (a < 0.9999) return `${beta.toFixed(6)} c`;
  return `${beta.toFixed(8)} c`;
}

export function formatGamma(g: number): string {
  if (g < 1.01) return g.toFixed(5);
  if (g < 10) return g.toFixed(3);
  if (g < 100) return g.toFixed(2);
  return g.toFixed(1);
}

/** km/s for HUD. */
export function betaToKmS(beta: number): number {
  return beta * 299792.458;
}

/** Frequency ratio for a star at rest-frame direction `dir` (θ = 0 is ahead). */
export function dopplerFactor(dir: Vec3, vhat: Vec3, beta: number): number {
  const b2 = Math.min(beta * beta, 0.999999);
  const gamma = 1 / Math.sqrt(1 - b2);
  const cost = dir[0] * vhat[0] + dir[1] * vhat[1] + dir[2] * vhat[2];
  return 1 / Math.max(gamma * (1 - beta * cost), 0.015);
}

/** Rest-frame star direction → moving observer's sky. Matches the star shader. */
export function aberrateDir(dir: Vec3, vhat: Vec3, beta: number): Vec3 {
  const b2 = Math.min(beta * beta, 0.999999);
  const gamma = 1 / Math.sqrt(1 - b2);
  const cost = dir[0] * vhat[0] + dir[1] * vhat[1] + dir[2] * vhat[2];
  const denom = Math.max(1 + beta * cost, 1e-5);
  const px = dir[0] - vhat[0] * cost;
  const py = dir[1] - vhat[1] * cost;
  const pz = dir[2] - vhat[2] * cost;
  const s = cost + beta;
  const rx = (px / gamma + vhat[0] * s) / denom;
  const ry = (py / gamma + vhat[1] * s) / denom;
  const rz = (pz / gamma + vhat[2] * s) / denom;
  const n = Math.hypot(rx, ry, rz) || 1;
  return [rx / n, ry / n, rz / n];
}
