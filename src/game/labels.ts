import * as THREE from "three";
import { CATALOG } from "./catalog";
import { raDecDistToThree, type Vec3 } from "./coords";
import { aberrateDir, betaFromPhi, dopplerFactor } from "./relativity";
import { dominantLens, lensDirection, sourceBehindLens } from "./masses";
import type { Sim } from "./sim";

export type StarLabel = {
  name: string;
  text: string;
  x: number;
  y: number;
  sx: number;
  sy: number;
  w: number;
  h: number;
};

type Body = {
  name: string;
  text: string;
  mag: number;
  dist0: number;
  pos: Vec3;
  pmRa: number;
  pmDec: number;
};

const BODIES: Body[] = (() => {
  const seen = new Set<string>();
  const out: Body[] = [];
  for (const s of CATALOG) {
    if (s.name === "Sol" || seen.has(s.name)) continue;
    seen.add(s.name);
    const dist0 = Math.max(s.dist, 0.01);
    out.push({
      name: s.name,
      text: s.zh && s.zh !== "—" ? s.zh : s.name,
      mag: s.mag,
      dist0,
      pos: raDecDistToThree(s.ra, s.dec, dist0),
      pmRa: s.pmRa,
      pmDec: s.pmDec,
    });
  }
  return out;
})();

const euler = new THREE.Euler(0, 0, 0, "YXZ");
const quat = new THREE.Quaternion();
const inv = new THREE.Quaternion();
const cam = new THREE.Vector3();

let sticky = new Set<string>();

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function pmDisplace(pos: Vec3, pmRa: number, pmDec: number, year: number): Vec3 {
  const dist = Math.hypot(pos[0], pos[1], pos[2]);
  if (dist < 1e-4 || (pmRa === 0 && pmDec === 0)) return pos;
  const dir: Vec3 = [pos[0] / dist, pos[1] / dist, pos[2] / dist];
  const rad = 4.848136811e-9 * (year - 2000);
  let east = cross([0, 1, 0], dir);
  const el = Math.hypot(east[0], east[1], east[2]);
  if (el < 1e-6) return pos;
  east = [east[0] / el, east[1] / el, east[2] / el];
  const north = cross(dir, east);
  const dx = dir[0] + (east[0] * pmRa + north[0] * pmDec) * rad;
  const dy = dir[1] + (east[1] * pmRa + north[1] * pmDec) * rad;
  const dz = dir[2] + (east[2] * pmRa + north[2] * pmDec) * rad;
  const n = Math.hypot(dx, dy, dz) || 1;
  return [(dx / n) * dist, (dy / n) * dist, (dz / n) * dist];
}

function textWidth(text: string): number {
  let w = 0;
  for (const ch of text) w += ch.charCodeAt(0) > 255 ? 12 : 6.5;
  return w + 2;
}

type Rect = { x: number; y: number; w: number; h: number };

function overlaps(a: Rect, b: Rect, pad: number): boolean {
  return !(
    a.x + a.w + pad < b.x ||
    b.x + b.w + pad < a.x ||
    a.y + a.h + pad < b.y ||
    b.y + b.h + pad < a.y
  );
}

function project(
  dir: Vec3,
  sim: Sim,
  width: number,
  height: number,
): { x: number; y: number } | null {
  euler.set(sim.pitch, sim.yaw, sim.roll, "YXZ");
  quat.setFromEuler(euler);
  inv.copy(quat).invert();
  cam.set(dir[0], dir[1], dir[2]).applyQuaternion(inv);
  if (cam.z > -1e-4) return null;
  const aspect = width / Math.max(height, 1);
  const f = 1 / Math.tan((sim.fov * Math.PI) / 360);
  const ndcX = (f / aspect) * (cam.x / -cam.z);
  const ndcY = f * (cam.y / -cam.z);
  if (ndcX < -1.02 || ndcX > 1.02 || ndcY < -1.02 || ndcY > 1.02) return null;
  return {
    x: (ndcX * 0.5 + 0.5) * width,
    y: (1 - (ndcY * 0.5 + 0.5)) * height,
  };
}

export function layoutStarLabels(sim: Sim, width: number, height: number): StarLabel[] {
  if (width < 8 || height < 8) return [];

  const beta = betaFromPhi(sim.rapidity);
  const useRel = sim.relativity && beta > 1e-5;
  const lens = dominantLens(sim.pos, sim);
  if (lens?.inside || lens?.embedded) return [];
  const obs = sim.pos;
  const vel = sim.velDir;
  const candidates: { name: string; text: string; mag: number; sx: number; sy: number }[] = [];

  for (const body of BODIES) {
    const p = pmDisplace(body.pos, body.pmRa, body.pmDec, sim.epochYear);
    const rx = p[0] - obs[0];
    const ry = p[1] - obs[1];
    const rz = p[2] - obs[2];
    const dist = Math.hypot(rx, ry, rz);
    if (dist < 0.05) continue;
    let dir: Vec3 = [rx / dist, ry / dist, rz / dist];
    if (sourceBehindLens(p, obs, lens)) dir = lensDirection(dir, obs, lens);
    let mag = body.mag + 5 * Math.log10(dist / body.dist0);
    if (useRel) {
      const D = dopplerFactor(dir, vel, beta);
      mag -= 2.5 * Math.log10(Math.max(D, 0.05) ** 3);
      dir = aberrateDir(dir, vel, beta);
    }
    if (lens && lens.edgeAngle > 0.008) {
      const lx = lens.pos[0] - obs[0];
      const ly = lens.pos[1] - obs[1];
      const lz = lens.pos[2] - obs[2];
      const ln = Math.hypot(lx, ly, lz) || 1;
      const ca = (dir[0] * lx + dir[1] * ly + dir[2] * lz) / ln;
      if (ca > Math.cos(lens.edgeAngle * 0.98)) continue;
    }
    if (mag > 5.6) continue;
    const screen = project(dir, sim, width, height);
    if (!screen) continue;
    if (screen.x < 6 || screen.y < 6 || screen.x > width - 6 || screen.y > height - 6) continue;
    const nx = (screen.x / width - 0.5) * 2;
    const ny = (screen.y / height - 0.5) * 2;
    const centerBias = Math.hypot(nx, ny) * 0.35;
    const stick = sticky.has(body.name) ? -0.45 : 0;
    candidates.push({
      name: body.name,
      text: body.text,
      mag: mag + centerBias + stick,
      sx: screen.x,
      sy: screen.y,
    });
  }

  if (lens && lens.edgeAngle > 0.01) {
    const dx = lens.pos[0] - obs[0];
    const dy = lens.pos[1] - obs[1];
    const dz = lens.pos[2] - obs[2];
    const n = Math.hypot(dx, dy, dz) || 1;
    const screen = project([dx / n, dy / n, dz / n], sim, width, height);
    if (screen) {
      const radiusPx =
        (Math.tan(lens.edgeAngle) / Math.tan((sim.fov * Math.PI) / 360)) * (height * 0.5);
      candidates.push({
        name: lens.name,
        text: lens.zh,
        mag: -1.2,
        sx: screen.x,
        sy: screen.y - radiusPx * 1.14 - 16,
      });
    }
  }

  candidates.sort((a, b) => a.mag - b.mag || (a.name < b.name ? -1 : 1));

  const placed: StarLabel[] = [];
  const blocked: Rect[] = [
    { x: 0, y: 0, w: 168, h: 72 },
    { x: width - (width >= 640 ? 168 : 108), y: 0, w: width >= 640 ? 168 : 108, h: width >= 640 ? 132 : 78 },
    { x: 0, y: height - 118, w: width, h: 118 },
    { x: width * 0.5 - 22, y: height * 0.5 - 22, w: 44, h: 44 },
  ];
  const limit = width < 720 ? 12 : 20;
  const lh = 14;

  for (const c of candidates) {
    if (placed.length >= limit) break;
    const w = textWidth(c.text);
    const spots: [number, number][] = [
      [8, -16],
      [8, 5],
      [-w - 8, -16],
      [-w - 8, 5],
      [8, -30],
      [-w - 8, -30],
    ];
    let chosen: [number, number] | null = null;
    for (const [ox, oy] of spots) {
      const rect = { x: c.sx + ox, y: c.sy + oy, w, h: lh };
      if (rect.x < 4 || rect.y < 4 || rect.x + rect.w > width - 4 || rect.y + rect.h > height - 4) {
        continue;
      }
      let hit = false;
      for (const b of blocked) {
        if (overlaps(rect, b, 5)) {
          hit = true;
          break;
        }
      }
      if (!hit) {
        for (const p of placed) {
          if (overlaps(rect, p, 5)) {
            hit = true;
            break;
          }
        }
      }
      if (!hit) {
        chosen = [rect.x, rect.y];
        break;
      }
    }
    if (!chosen) continue;
    placed.push({
      name: c.name,
      text: c.text,
      x: chosen[0],
      y: chosen[1],
      sx: c.sx,
      sy: c.sy,
      w,
      h: lh,
    });
  }

  sticky = new Set(placed.map((p) => p.name));
  return placed;
}
