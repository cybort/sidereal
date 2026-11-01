import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as SlidersHorizontal, c as Gauge, i as Smartphone, l as Eye, n as Type, o as Orbit, s as Map$1, t as Zap, u as Compass } from "../_libs/lucide-react.mjs";
import { a as Euler, c as Mesh, d as Points, f as Quaternion, g as Vector3, h as ShaderMaterial, i as Color, l as PerspectiveCamera, m as Scene, n as BufferAttribute, o as LineSegments, p as SRGBColorSpace, r as BufferGeometry, s as Matrix4, t as WebGLRenderer, u as PlaneGeometry } from "../_libs/three.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BevMdzZZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function createAudio() {
	let ctx = null;
	let filter = null;
	let gain = null;
	let boostGain = null;
	let oscA = null;
	let oscB = null;
	let noise = null;
	let unlocked = false;
	function unlock() {
		if (unlocked && ctx && ctx.state !== "closed") {
			ctx.resume();
			return;
		}
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return;
		ctx = new AC();
		const n = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
		const data = n.getChannelData(0);
		let last = 0;
		for (let i = 0; i < data.length; i++) {
			const white = Math.random() * 2 - 1;
			last = (last + .02 * white) / 1.02;
			data[i] = last * 3.5;
		}
		noise = ctx.createBufferSource();
		noise.buffer = n;
		noise.loop = true;
		filter = ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = 180;
		filter.Q.value = .7;
		gain = ctx.createGain();
		gain.gain.value = .028;
		boostGain = ctx.createGain();
		boostGain.gain.value = 0;
		oscA = ctx.createOscillator();
		oscA.type = "sine";
		oscA.frequency.value = 46;
		oscB = ctx.createOscillator();
		oscB.type = "sine";
		oscB.frequency.value = 92.5;
		const oscGain = ctx.createGain();
		oscGain.gain.value = .012;
		noise.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		oscA.connect(oscGain);
		oscB.connect(oscGain);
		oscGain.connect(ctx.destination);
		boostGain.connect(ctx.destination);
		const boostFilter = ctx.createBiquadFilter();
		boostFilter.type = "bandpass";
		boostFilter.frequency.value = 420;
		boostFilter.Q.value = .6;
		noise.connect(boostFilter);
		boostFilter.connect(boostGain);
		noise.start();
		oscA.start();
		oscB.start();
		unlocked = true;
	}
	function setWarp(amount) {
		if (!ctx || !filter || !gain || !boostGain || !oscA || !oscB) return;
		if (ctx.state === "suspended") return;
		const t = ctx.currentTime;
		const a = Math.max(0, Math.min(1, amount));
		filter.frequency.setTargetAtTime(160 + a * 1400, t, .08);
		gain.gain.setTargetAtTime(.022 + a * .04, t, .1);
		boostGain.gain.setTargetAtTime(a * .045, t, .06);
		oscA.frequency.setTargetAtTime(42 + a * 28, t, .12);
		oscB.frequency.setTargetAtTime(88 + a * 70, t, .12);
	}
	function dispose() {
		try {
			noise?.stop();
			oscA?.stop();
			oscB?.stop();
			ctx?.close();
		} catch {}
		ctx = null;
	}
	return {
		unlock,
		setWarp,
		dispose
	};
}
/** Equatorial / galactic conversions. Distances in light-years. Angles in degrees. */
var DEG = Math.PI / 180;
var RAD = 180 / Math.PI;
var RA_NGP = 192.85948;
var DEC_NGP = 27.12825;
var RA_GC = 266.4051;
var DEC_GC = -28.936175;
function clamp$1(v, a, b) {
	return Math.max(a, Math.min(b, v));
}
function wrapDeg(d) {
	return (d % 360 + 360) % 360;
}
function raDecToAstro(raDeg, decDeg) {
	const ra = raDeg * DEG;
	const dec = decDeg * DEG;
	const c = Math.cos(dec);
	return [
		c * Math.cos(ra),
		c * Math.sin(ra),
		Math.sin(dec)
	];
}
function astroToThree(x, y, z) {
	return [
		y,
		z,
		-x
	];
}
function threeToAstro(x, y, z) {
	return [
		-z,
		x,
		y
	];
}
function normalize(v) {
	const n = Math.hypot(v[0], v[1], v[2]) || 1;
	return [
		v[0] / n,
		v[1] / n,
		v[2] / n
	];
}
function sub(a, b) {
	return [
		a[0] - b[0],
		a[1] - b[1],
		a[2] - b[2]
	];
}
function scale(a, s) {
	return [
		a[0] * s,
		a[1] * s,
		a[2] * s
	];
}
function dot(a, b) {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross$1(a, b) {
	return [
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0]
	];
}
/** Galactic +X (GC), +Y (l=90°), +Z (NGP) expressed in equatorial astro coords. */
var GAL_AXES = (() => {
	const z = normalize(raDecToAstro(RA_NGP, DEC_NGP));
	let x = raDecToAstro(RA_GC, DEC_GC);
	x = normalize(sub(x, scale(z, dot(x, z))));
	const y = cross$1(z, x);
	return {
		x,
		y,
		z
	};
})();
/** Heliocentric galactic cartesian (ly): +X GC, +Y l=90°, +Z NGP → three.js equatorial. */
function galacticXyzToThree(x, y, z) {
	const { x: gx, y: gy, z: gz } = GAL_AXES;
	return astroToThree(x * gx[0] + y * gy[0] + z * gz[0], x * gx[1] + y * gy[1] + z * gz[1], x * gx[2] + y * gy[2] + z * gz[2]);
}
function threeToGalacticXyz(tx, ty, tz) {
	const [ax, ay, az] = threeToAstro(tx, ty, tz);
	const { x: gx, y: gy, z: gz } = GAL_AXES;
	return [
		ax * gx[0] + ay * gx[1] + az * gx[2],
		ax * gy[0] + ay * gy[1] + az * gy[2],
		ax * gz[0] + ay * gz[1] + az * gz[2]
	];
}
function xyzToGalacticLb(x, y, z) {
	const dist = Math.hypot(x, y, z);
	if (dist < 1e-9) return {
		l: 0,
		b: 0,
		dist: 0
	};
	return {
		l: wrapDeg(Math.atan2(y, x) * RAD),
		b: Math.atan2(z, Math.hypot(x, y)) * RAD,
		dist
	};
}
function raDecDistToThree(raDeg, decDeg, dist) {
	const [x, y, z] = raDecToAstro(raDeg, decDeg);
	const t = astroToThree(x, y, z);
	return [
		t[0] * dist,
		t[1] * dist,
		t[2] * dist
	];
}
/** Camera basis: yaw=0 pitch=0 looks −Z = RA 0h Dec 0°. +yaw is left (CCW about +Y). */
function lookDirFromYawPitch(yaw, pitch) {
	const cp = Math.cos(pitch);
	return [
		-Math.sin(yaw) * cp,
		Math.sin(pitch),
		-Math.cos(yaw) * cp
	];
}
function yawPitchFromDir(dx, dy, dz) {
	const pitch = Math.asin(clamp$1(dy, -1, 1));
	const cp = Math.cos(pitch);
	if (Math.abs(cp) < 1e-6) return {
		yaw: 0,
		pitch
	};
	return {
		yaw: Math.atan2(-dx / cp, -dz / cp),
		pitch
	};
}
function formatRA(raDeg) {
	const h = wrapDeg(raDeg) / 15;
	const hh = Math.floor(h);
	const m = (h - hh) * 60;
	const mm = Math.floor(m);
	const ss = (m - mm) * 60;
	return `${String(hh).padStart(2, "0")}h ${String(mm).padStart(2, "0")}m ${ss.toFixed(0).padStart(2, "0")}s`;
}
function formatDec(dec) {
	const sign = dec >= 0 ? "+" : "−";
	const a = Math.abs(dec);
	const dd = Math.floor(a);
	const m = (a - dd) * 60;
	const mm = Math.floor(m);
	return `${sign}${String(dd).padStart(2, "0")}° ${String(mm).padStart(2, "0")}′`;
}
function formatLy(d) {
	if (!Number.isFinite(d)) return "—";
	const a = Math.abs(d);
	if (a < .01) return `${d.toFixed(4)} ly`;
	if (a < 1) return `${d.toFixed(3)} ly`;
	if (a < 100) return `${d.toFixed(2)} ly`;
	if (a < 1e4) return `${d.toFixed(1)} ly`;
	if (a < 1e6) return `${(d / 1e3).toFixed(2)} kly`;
	return `${(d / 1e6).toFixed(2)} Mly`;
}
/** Schwarzschild radius of the Sun, in light-years (2.95 km). */
var RS_SUN_LY = 2.95325008 / 9460730472580.8;
function rsLy(massSolar) {
	return RS_SUN_LY * Math.max(massSolar, 0);
}
var KM_PER_LY = 9460730472580.8;
var RSUN_LY = 695700 / KM_PER_LY;
function hours(h, m, s) {
	return (h + m / 60 + s / 3600) * 15;
}
function deg(d, m, s) {
	return (d < 0 ? -1 : 1) * (Math.abs(d) + m / 60 + s / 3600);
}
function at(ra, dec, dist) {
	return raDecDistToThree(ra, dec, dist);
}
/** Real compact objects and two extended spectacles. Positions are heliocentric, J2000-ish. */
var COMPACTS = [
	{
		id: "sgr-a",
		name: "Sgr A*",
		zh: "人马座A*",
		kind: 0,
		mass: 415e4,
		radius: 0,
		pos: galacticXyzToThree(26600, 0, 0)
	},
	{
		id: "cyg-x1",
		name: "Cygnus X-1",
		zh: "天鹅座X-1",
		kind: 0,
		mass: 21.2,
		radius: 0,
		pos: at(hours(19, 58, 21.676), deg(35, 12, 5.78), 7240)
	},
	{
		id: "gaia-bh1",
		name: "Gaia BH1",
		zh: "盖亚BH1",
		kind: 0,
		mass: 9.6,
		radius: 0,
		pos: at(hours(17, 28, 41.097), deg(-0, 34, 51.52), 1560)
	},
	{
		id: "m87",
		name: "M87*",
		zh: "M87*",
		kind: 0,
		mass: 65e8,
		radius: 0,
		pos: at(hours(12, 30, 49.42), deg(12, 23, 28), 537e5)
	},
	{
		id: "crab",
		name: "Crab Pulsar",
		zh: "蟹状脉冲星",
		kind: 1,
		mass: 1.4,
		radius: 12 / KM_PER_LY,
		pos: at(hours(5, 34, 31.94), deg(22, 0, 52.2), 6500)
	},
	{
		id: "vela",
		name: "Vela Pulsar",
		zh: "船帆脉冲星",
		kind: 1,
		mass: 1.4,
		radius: 12 / KM_PER_LY,
		pos: at(hours(8, 35, 20.66), deg(-45, 10, 35.2), 960)
	},
	{
		id: "betelgeuse",
		name: "Betelgeuse",
		zh: "参宿四",
		kind: 2,
		mass: 18,
		radius: 640 * RSUN_LY,
		pos: at(88.793, 7.407, 548)
	},
	{
		id: "sirius-b",
		name: "Sirius B",
		zh: "天狼B",
		kind: 3,
		mass: 1.02,
		radius: .0084 * RSUN_LY,
		pos: siriusB()
	}
];
function siriusB() {
	const a = at(101.287, -16.716, 8.6);
	const n = Math.hypot(a[0], a[1], a[2]) || 1;
	const radial = [
		a[0] / n,
		a[1] / n,
		a[2] / n
	];
	const up = Math.abs(radial[1]) < .9 ? [
		0,
		1,
		0
	] : [
		1,
		0,
		0
	];
	const east = [
		radial[1] * up[2] - radial[2] * up[1],
		radial[2] * up[0] - radial[0] * up[2],
		radial[0] * up[1] - radial[1] * up[0]
	];
	const el = Math.hypot(east[0], east[1], east[2]) || 1;
	const au = 11 / 63241.077;
	return [
		a[0] + east[0] / el * au,
		a[1] + east[1] / el * au,
		a[2] + east[2] / el * au
	];
}
function farSide(body, dist) {
	const n = Math.hypot(body[0], body[1], body[2]) || 1;
	return [
		body[0] + body[0] / n * dist,
		body[1] + body[1] / n * dist,
		body[2] + body[2] / n * dist
	];
}
function approach(body, id, zh, dist) {
	return {
		id,
		zh,
		label: body.name,
		pos: farSide(body.pos, dist),
		look: body.pos
	};
}
function wonderApproaches() {
	const byId = new Map(COMPACTS.map((b) => [b.id, b]));
	const sgr = byId.get("sgr-a");
	const cyg = byId.get("cyg-x1");
	const gaia = byId.get("gaia-bh1");
	const m87 = byId.get("m87");
	const crab = byId.get("crab");
	const vela = byId.get("vela");
	const bet = byId.get("betelgeuse");
	const sb = byId.get("sirius-b");
	return [
		approach(sgr, "sgr-a", "人马A*", 16 * rsLy(sgr.mass)),
		approach(sgr, "sgr-a-close", "人马A*近", 6 * rsLy(sgr.mass)),
		approach(cyg, "cyg-x1", "天鹅X-1", 18 * rsLy(cyg.mass)),
		approach(gaia, "gaia-bh1", "盖亚BH1", 18 * rsLy(gaia.mass)),
		approach(m87, "m87", "M87*", 18 * rsLy(m87.mass)),
		approach(crab, "crab", "蟹状星", 4.2 * crab.radius),
		approach(vela, "vela", "船帆星", 4.2 * vela.radius),
		approach(bet, "betel-near", "参宿四旁", 3.4 * bet.radius),
		approach(sb, "sirius-b", "天狼B", 4.2 * sb.radius)
	];
}
/** Galactic-centre overlook, just above the plane so it is not inside Sgr A*. */
function galacticOverlook() {
	return galacticXyzToThree(26600, 0, 40);
}
function consider(best, pos, mass, radius, kind, zh, name, obs) {
	const dx = pos[0] - obs[0];
	const dy = pos[1] - obs[1];
	const dz = pos[2] - obs[2];
	const dist = Math.hypot(dx, dy, dz);
	const massRs = rsLy(mass);
	if (dist < 1e-18 && massRs <= 0 && radius <= 0) return best;
	const horizon = kind === 0 && massRs > 0 && dist < massRs;
	const embedded = !horizon && radius > 0 && dist < radius;
	const timeFactor = horizon ? 0 : Math.sqrt(Math.max(0, 1 - massRs / Math.max(Math.max(dist, 1e-18), massRs * 1.0001)));
	const gravShift = !horizon && timeFactor > .2 ? Math.min(1 / timeFactor, 2.4) : 1;
	const shadowB = kind === 0 ? 2.5978 * massRs : Math.max(radius, massRs * 1.1);
	const edgeAngle = Math.atan2(shadowB, Math.max(dist, shadowB * .02));
	const thetaE = dist > massRs * 1.01 ? Math.sqrt(2 * massRs / dist) : 0;
	if (!horizon && !embedded && Math.max(edgeAngle, thetaE) < .004 && edgeAngle < .008) return best;
	const next = {
		pos,
		rs: !horizon && thetaE > .004 ? massRs : 0,
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
		thetaE
	};
	if (!best) return next;
	const rank = (lens) => lens.inside ? 1e9 : lens.embedded ? 1e8 : Math.max(lens.edgeAngle, lens.thetaE);
	return rank(next) > rank(best) ? next : best;
}
function dominantLens(obs, sim) {
	let best = null;
	for (const b of COMPACTS) best = consider(best, b.pos, b.mass, b.radius, b.kind, b.zh, b.name, obs);
	if (sim.observerMass > .05 && sim.massAnchor) best = consider(best, sim.massAnchor, sim.observerMass, 0, 0, "观测黑洞", "Observer", obs);
	if (!best) return null;
	if (!sim.relativity) return {
		...best,
		rs: 0,
		inside: false,
		timeFactor: 1,
		gravShift: 1,
		thetaE: 0
	};
	return best;
}
/** Starlight only bends when the star sits behind the lens. */
function sourceBehindLens(star, obs, lens) {
	if (!lens || lens.rs <= 0 || lens.inside) return false;
	const lx = lens.pos[0] - obs[0];
	const ly = lens.pos[1] - obs[1];
	const lz = lens.pos[2] - obs[2];
	return (star[0] - obs[0]) * lx + (star[1] - obs[1]) * ly + (star[2] - obs[2]) * lz > (lx * lx + ly * ly + lz * lz) * .98;
}
/**
* Viewing distance for the observer-mass slider.
* Larger masses are parked at fewer Schwarzschild radii, so the shadow grows
* instead of staying a fixed angle.
*/
function parkDistanceLy(mass) {
	const rs = rsLy(Math.max(mass, 0));
	return Math.max(3.4, 170 * Math.pow(Math.max(mass, .05), -.17)) * rs;
}
/** Schwarzschild primary image. Bends a rest-frame direction around `lens`. */
function lensDirection(dir, obs, lens) {
	if (!lens || lens.inside || lens.rs <= 0 || lens.thetaE < .004) return dir;
	const dx = lens.pos[0] - obs[0];
	const dy = lens.pos[1] - obs[1];
	const dz = lens.pos[2] - obs[2];
	const Dl = Math.hypot(dx, dy, dz);
	if (Dl < 1e-12) return dir;
	const lhat = [
		dx / Dl,
		dy / Dl,
		dz / Dl
	];
	const c = Math.max(-1, Math.min(1, dir[0] * lhat[0] + dir[1] * lhat[1] + dir[2] * lhat[2]));
	const beta = Math.acos(c);
	const thetaE2 = lens.thetaE * lens.thetaE;
	const theta = .5 * (beta + Math.sqrt(beta * beta + 4 * thetaE2));
	let px = dir[0] - lhat[0] * c;
	let py = dir[1] - lhat[1] * c;
	let pz = dir[2] - lhat[2] * c;
	const pl = Math.hypot(px, py, pz);
	if (pl < 1e-6) {
		const tmp = Math.abs(lhat[1]) < .9 ? [
			0,
			1,
			0
		] : [
			1,
			0,
			0
		];
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
	return [
		ct * lhat[0] + st * px,
		ct * lhat[1] + st * py,
		ct * lhat[2] + st * pz
	];
}
function massFromSlider(t) {
	if (t <= .001) return 0;
	return 10 ** (t * 9.3 - 1.3);
}
function sliderFromMass(mass) {
	if (mass <= .05) return 0;
	return Math.max(0, Math.min(1, (Math.log10(mass) + 1.3) / 9.3));
}
function formatMass(mass) {
	if (mass < .05) return "0";
	if (mass < 10) return `${mass.toFixed(1)} M☉`;
	if (mass < 1e4) return `${mass.toFixed(0)} M☉`;
	if (mass < 1e6) return `${(mass / 1e3).toFixed(1)}k M☉`;
	if (mass < 1e9) return `${(mass / 1e6).toFixed(2)}M M☉`;
	return `${(mass / 1e9).toFixed(2)}B M☉`;
}
/** Hipparcos-ish bright-star snapshot (J2000). RA/Dec degrees, dist ly, pm mas/yr. */
var CATALOG = [
	{
		name: "Sol",
		zh: "太阳",
		ra: 0,
		dec: 0,
		mag: 4.83,
		bv: .65,
		dist: 16e-6,
		pmRa: 0,
		pmDec: 0,
		con: "—",
		conZh: "—"
	},
	{
		name: "Sirius",
		zh: "天狼",
		ra: 101.287,
		dec: -16.716,
		mag: -1.46,
		bv: 0,
		dist: 8.6,
		pmRa: -546,
		pmDec: -1223,
		con: "CMa",
		conZh: "大犬"
	},
	{
		name: "Canopus",
		zh: "老人",
		ra: 95.988,
		dec: -52.696,
		mag: -.74,
		bv: .15,
		dist: 310,
		pmRa: 20,
		pmDec: 23,
		con: "Car",
		conZh: "船底"
	},
	{
		name: "Rigil Kentaurus",
		zh: "南门二",
		ra: 219.902,
		dec: -60.834,
		mag: -.27,
		bv: .71,
		dist: 4.37,
		pmRa: -3679,
		pmDec: 473,
		con: "Cen",
		conZh: "半人马"
	},
	{
		name: "Arcturus",
		zh: "大角",
		ra: 213.915,
		dec: 19.182,
		mag: -.05,
		bv: 1.23,
		dist: 36.7,
		pmRa: -1093,
		pmDec: -2e3,
		con: "Boo",
		conZh: "牧夫"
	},
	{
		name: "Vega",
		zh: "织女",
		ra: 279.235,
		dec: 38.784,
		mag: .03,
		bv: 0,
		dist: 25.04,
		pmRa: 201,
		pmDec: 287,
		con: "Lyr",
		conZh: "天琴"
	},
	{
		name: "Capella",
		zh: "五车二",
		ra: 79.172,
		dec: 45.998,
		mag: .08,
		bv: .8,
		dist: 42.9,
		pmRa: 75,
		pmDec: -427,
		con: "Aur",
		conZh: "御夫"
	},
	{
		name: "Rigel",
		zh: "参宿七",
		ra: 78.634,
		dec: -8.202,
		mag: .13,
		bv: -.03,
		dist: 860,
		pmRa: 1,
		pmDec: 0,
		con: "Ori",
		conZh: "猎户"
	},
	{
		name: "Procyon",
		zh: "南河三",
		ra: 114.825,
		dec: 5.225,
		mag: .34,
		bv: .42,
		dist: 11.46,
		pmRa: -715,
		pmDec: -1035,
		con: "CMi",
		conZh: "小犬"
	},
	{
		name: "Achernar",
		zh: "水委一",
		ra: 24.429,
		dec: -57.237,
		mag: .46,
		bv: -.16,
		dist: 139,
		pmRa: 87,
		pmDec: -38,
		con: "Eri",
		conZh: "波江"
	},
	{
		name: "Betelgeuse",
		zh: "参宿四",
		ra: 88.793,
		dec: 7.407,
		mag: .5,
		bv: 1.85,
		dist: 548,
		pmRa: 27,
		pmDec: 11,
		con: "Ori",
		conZh: "猎户"
	},
	{
		name: "Hadar",
		zh: "马腹一",
		ra: 210.956,
		dec: -60.373,
		mag: .61,
		bv: -.23,
		dist: 390,
		pmRa: -33,
		pmDec: -23,
		con: "Cen",
		conZh: "半人马"
	},
	{
		name: "Altair",
		zh: "牛郎",
		ra: 297.696,
		dec: 8.868,
		mag: .76,
		bv: .22,
		dist: 16.7,
		pmRa: 537,
		pmDec: 386,
		con: "Aql",
		conZh: "天鹰"
	},
	{
		name: "Acrux",
		zh: "十字架二",
		ra: 186.65,
		dec: -63.099,
		mag: .77,
		bv: -.24,
		dist: 320,
		pmRa: -36,
		pmDec: -15,
		con: "Cru",
		conZh: "南十字"
	},
	{
		name: "Aldebaran",
		zh: "毕宿五",
		ra: 68.98,
		dec: 16.509,
		mag: .85,
		bv: 1.54,
		dist: 65.3,
		pmRa: 63,
		pmDec: -189,
		con: "Tau",
		conZh: "金牛"
	},
	{
		name: "Antares",
		zh: "心宿二",
		ra: 247.352,
		dec: -26.432,
		mag: .96,
		bv: 1.83,
		dist: 550,
		pmRa: -12,
		pmDec: -23,
		con: "Sco",
		conZh: "天蝎"
	},
	{
		name: "Spica",
		zh: "角宿一",
		ra: 201.298,
		dec: -11.161,
		mag: .97,
		bv: -.23,
		dist: 250,
		pmRa: -42,
		pmDec: -31,
		con: "Vir",
		conZh: "室女"
	},
	{
		name: "Pollux",
		zh: "北河三",
		ra: 116.329,
		dec: 28.026,
		mag: 1.14,
		bv: 1,
		dist: 33.8,
		pmRa: -627,
		pmDec: -46,
		con: "Gem",
		conZh: "双子"
	},
	{
		name: "Fomalhaut",
		zh: "北落师门",
		ra: 344.413,
		dec: -29.622,
		mag: 1.16,
		bv: .09,
		dist: 25.1,
		pmRa: 329,
		pmDec: -164,
		con: "PsA",
		conZh: "南鱼"
	},
	{
		name: "Deneb",
		zh: "天津四",
		ra: 310.358,
		dec: 45.28,
		mag: 1.25,
		bv: .09,
		dist: 2615,
		pmRa: 2,
		pmDec: 2,
		con: "Cyg",
		conZh: "天鹅"
	},
	{
		name: "Mimosa",
		zh: "十字架三",
		ra: 191.93,
		dec: -59.689,
		mag: 1.25,
		bv: -.23,
		dist: 280,
		pmRa: -48,
		pmDec: -13,
		con: "Cru",
		conZh: "南十字"
	},
	{
		name: "Regulus",
		zh: "轩辕十四",
		ra: 152.093,
		dec: 11.967,
		mag: 1.35,
		bv: -.11,
		dist: 79,
		pmRa: -248,
		pmDec: 6,
		con: "Leo",
		conZh: "狮子"
	},
	{
		name: "Adhara",
		zh: "弧矢七",
		ra: 104.656,
		dec: -28.972,
		mag: 1.5,
		bv: -.21,
		dist: 430,
		pmRa: 3,
		pmDec: 2,
		con: "CMa",
		conZh: "大犬"
	},
	{
		name: "Castor",
		zh: "北河二",
		ra: 113.65,
		dec: 31.888,
		mag: 1.58,
		bv: .03,
		dist: 51,
		pmRa: -191,
		pmDec: -146,
		con: "Gem",
		conZh: "双子"
	},
	{
		name: "Shaula",
		zh: "尾宿八",
		ra: 263.402,
		dec: -37.104,
		mag: 1.62,
		bv: -.22,
		dist: 570,
		pmRa: -8,
		pmDec: -30,
		con: "Sco",
		conZh: "天蝎"
	},
	{
		name: "Bellatrix",
		zh: "参宿五",
		ra: 81.283,
		dec: 6.35,
		mag: 1.64,
		bv: -.22,
		dist: 250,
		pmRa: -8,
		pmDec: -13,
		con: "Ori",
		conZh: "猎户"
	},
	{
		name: "Elnath",
		zh: "五车五",
		ra: 81.573,
		dec: 28.608,
		mag: 1.65,
		bv: -.13,
		dist: 134,
		pmRa: 23,
		pmDec: -174,
		con: "Tau",
		conZh: "金牛"
	},
	{
		name: "Miaplacidus",
		zh: "南船五",
		ra: 138.3,
		dec: -69.717,
		mag: 1.67,
		bv: .07,
		dist: 113,
		pmRa: -156,
		pmDec: 59,
		con: "Car",
		conZh: "船底"
	},
	{
		name: "Alnilam",
		zh: "参宿二",
		ra: 84.053,
		dec: -1.202,
		mag: 1.69,
		bv: -.18,
		dist: 2e3,
		pmRa: 1,
		pmDec: -1,
		con: "Ori",
		conZh: "猎户"
	},
	{
		name: "Alnair",
		zh: "鹤一",
		ra: 332.058,
		dec: -46.961,
		mag: 1.74,
		bv: -.13,
		dist: 101,
		pmRa: 127,
		pmDec: -148,
		con: "Gru",
		conZh: "天鹤"
	},
	{
		name: "Alioth",
		zh: "玉衡",
		ra: 193.507,
		dec: 55.96,
		mag: 1.77,
		bv: -.02,
		dist: 83,
		pmRa: 112,
		pmDec: -9,
		con: "UMa",
		conZh: "大熊"
	},
	{
		name: "Alnitak",
		zh: "参宿一",
		ra: 85.19,
		dec: -1.943,
		mag: 1.77,
		bv: -.21,
		dist: 1260,
		pmRa: 4,
		pmDec: 2,
		con: "Ori",
		conZh: "猎户"
	},
	{
		name: "Dubhe",
		zh: "天枢",
		ra: 165.46,
		dec: 61.751,
		mag: 1.79,
		bv: 1.07,
		dist: 123,
		pmRa: -134,
		pmDec: -35,
		con: "UMa",
		conZh: "大熊"
	},
	{
		name: "Mirfak",
		zh: "天船三",
		ra: 51.081,
		dec: 49.861,
		mag: 1.79,
		bv: .48,
		dist: 592,
		pmRa: 24,
		pmDec: -26,
		con: "Per",
		conZh: "英仙"
	},
	{
		name: "Wezen",
		zh: "弧矢一",
		ra: 107.098,
		dec: -26.393,
		mag: 1.83,
		bv: .67,
		dist: 1600,
		pmRa: -3,
		pmDec: 4,
		con: "CMa",
		conZh: "大犬"
	},
	{
		name: "Alkaid",
		zh: "摇光",
		ra: 206.885,
		dec: 49.313,
		mag: 1.86,
		bv: -.02,
		dist: 104,
		pmRa: -121,
		pmDec: -15,
		con: "UMa",
		conZh: "大熊"
	},
	{
		name: "Sargas",
		zh: "尾宿五",
		ra: 264.33,
		dec: -42.998,
		mag: 1.86,
		bv: .4,
		dist: 270,
		pmRa: 6,
		pmDec: -7,
		con: "Sco",
		conZh: "天蝎"
	},
	{
		name: "Avior",
		zh: "海石一",
		ra: 125.628,
		dec: -59.51,
		mag: 1.86,
		bv: 1.2,
		dist: 630,
		pmRa: -26,
		pmDec: 23,
		con: "Car",
		conZh: "船底"
	},
	{
		name: "Menkalinan",
		zh: "五车三",
		ra: 89.882,
		dec: 44.947,
		mag: 1.9,
		bv: .08,
		dist: 81,
		pmRa: -57,
		pmDec: -1,
		con: "Aur",
		conZh: "御夫"
	},
	{
		name: "Atria",
		zh: "三角三",
		ra: 252.166,
		dec: -69.028,
		mag: 1.91,
		bv: 1.44,
		dist: 415,
		pmRa: 18,
		pmDec: -32,
		con: "TrA",
		conZh: "南三角"
	},
	{
		name: "Kaus Australis",
		zh: "箕宿三",
		ra: 276.043,
		dec: -34.385,
		mag: 1.85,
		bv: -.03,
		dist: 143,
		pmRa: -40,
		pmDec: -124,
		con: "Sgr",
		conZh: "人马"
	},
	{
		name: "Alhena",
		zh: "井宿三",
		ra: 99.428,
		dec: 16.399,
		mag: 1.92,
		bv: 0,
		dist: 109,
		pmRa: 56,
		pmDec: -12,
		con: "Gem",
		conZh: "双子"
	},
	{
		name: "Peacock",
		zh: "孔雀十一",
		ra: 306.412,
		dec: -56.735,
		mag: 1.94,
		bv: -.2,
		dist: 179,
		pmRa: 7,
		pmDec: -86,
		con: "Pav",
		conZh: "孔雀"
	},
	{
		name: "Polaris",
		zh: "北极星",
		ra: 37.955,
		dec: 89.264,
		mag: 1.98,
		bv: .6,
		dist: 433,
		pmRa: 44,
		pmDec: -12,
		con: "UMi",
		conZh: "小熊"
	},
	{
		name: "Mirzam",
		zh: "军市一",
		ra: 95.675,
		dec: -17.956,
		mag: 1.98,
		bv: -.24,
		dist: 500,
		pmRa: -3,
		pmDec: -2,
		con: "CMa",
		conZh: "大犬"
	},
	{
		name: "Alphard",
		zh: "星宿一",
		ra: 141.897,
		dec: -8.659,
		mag: 1.98,
		bv: 1.44,
		dist: 177,
		pmRa: -15,
		pmDec: 33,
		con: "Hya",
		conZh: "长蛇"
	},
	{
		name: "Algieba",
		zh: "轩辕十二",
		ra: 154.993,
		dec: 19.842,
		mag: 2.08,
		bv: 1.13,
		dist: 130,
		pmRa: 305,
		pmDec: -154,
		con: "Leo",
		conZh: "狮子"
	},
	{
		name: "Hamal",
		zh: "娄宿三",
		ra: 31.793,
		dec: 23.462,
		mag: 2,
		bv: 1.15,
		dist: 66,
		pmRa: 189,
		pmDec: -145,
		con: "Ari",
		conZh: "白羊"
	},
	{
		name: "Diphda",
		zh: "土司空",
		ra: 10.897,
		dec: -17.987,
		mag: 2.04,
		bv: 1.02,
		dist: 96,
		pmRa: 233,
		pmDec: 33,
		con: "Cet",
		conZh: "鲸鱼"
	},
	{
		name: "Nunki",
		zh: "斗宿四",
		ra: 283.816,
		dec: -26.297,
		mag: 2.05,
		bv: -.13,
		dist: 228,
		pmRa: 15,
		pmDec: -53,
		con: "Sgr",
		conZh: "人马"
	},
	{
		name: "Menkent",
		zh: "库楼三",
		ra: 211.671,
		dec: -36.37,
		mag: 2.06,
		bv: 1.01,
		dist: 61,
		pmRa: -521,
		pmDec: -518,
		con: "Cen",
		conZh: "半人马"
	},
	{
		name: "Alpheratz",
		zh: "壁宿二",
		ra: 2.097,
		dec: 29.09,
		mag: 2.06,
		bv: -.04,
		dist: 97,
		pmRa: 135,
		pmDec: -163,
		con: "And",
		conZh: "仙女"
	},
	{
		name: "Mirach",
		zh: "奎宿九",
		ra: 17.433,
		dec: 35.62,
		mag: 2.05,
		bv: 1.58,
		dist: 197,
		pmRa: 176,
		pmDec: -112,
		con: "And",
		conZh: "仙女"
	},
	{
		name: "Saiph",
		zh: "参宿六",
		ra: 86.939,
		dec: -9.67,
		mag: 2.06,
		bv: -.18,
		dist: 650,
		pmRa: 1,
		pmDec: -1,
		con: "Ori",
		conZh: "猎户"
	},
	{
		name: "Mintaka",
		zh: "参宿三",
		ra: 83.002,
		dec: -.299,
		mag: 2.23,
		bv: -.22,
		dist: 1200,
		pmRa: 1,
		pmDec: 1,
		con: "Ori",
		conZh: "猎户"
	},
	{
		name: "Meissa",
		zh: "猎户座λ",
		ra: 83.784,
		dec: 9.934,
		mag: 3.39,
		bv: -.16,
		dist: 1100,
		pmRa: -4,
		pmDec: -2,
		con: "Ori",
		conZh: "猎户"
	},
	{
		name: "Merak",
		zh: "天璇",
		ra: 165.46,
		dec: 56.382,
		mag: 2.37,
		bv: .06,
		dist: 80,
		pmRa: 81,
		pmDec: 34,
		con: "UMa",
		conZh: "大熊"
	},
	{
		name: "Phecda",
		zh: "天玑",
		ra: 178.457,
		dec: 53.695,
		mag: 2.44,
		bv: .04,
		dist: 83,
		pmRa: 108,
		pmDec: 11,
		con: "UMa",
		conZh: "大熊"
	},
	{
		name: "Megrez",
		zh: "天权",
		ra: 183.856,
		dec: 57.033,
		mag: 3.31,
		bv: .08,
		dist: 81,
		pmRa: 104,
		pmDec: 9,
		con: "UMa",
		conZh: "大熊"
	},
	{
		name: "Mizar",
		zh: "开阳",
		ra: 200.981,
		dec: 54.925,
		mag: 2.23,
		bv: .13,
		dist: 83,
		pmRa: 121,
		pmDec: -23,
		con: "UMa",
		conZh: "大熊"
	},
	{
		name: "Gacrux",
		zh: "十字架一",
		ra: 187.791,
		dec: -57.113,
		mag: 1.63,
		bv: 1.59,
		dist: 88,
		pmRa: 28,
		pmDec: -265,
		con: "Cru",
		conZh: "南十字"
	},
	{
		name: "Delta Cru",
		zh: "十字架四",
		ra: 183.786,
		dec: -58.749,
		mag: 2.79,
		bv: -.24,
		dist: 345,
		pmRa: -37,
		pmDec: -11,
		con: "Cru",
		conZh: "南十字"
	},
	{
		name: "Sadr",
		zh: "天津一",
		ra: 305.557,
		dec: 40.257,
		mag: 2.23,
		bv: .67,
		dist: 1800,
		pmRa: 2,
		pmDec: -1,
		con: "Cyg",
		conZh: "天鹅"
	},
	{
		name: "Albireo",
		zh: "辇道增七",
		ra: 292.68,
		dec: 27.96,
		mag: 3.05,
		bv: 1.13,
		dist: 430,
		pmRa: -7,
		pmDec: -6,
		con: "Cyg",
		conZh: "天鹅"
	},
	{
		name: "Gienah",
		zh: "天津九",
		ra: 311.665,
		dec: 33.97,
		mag: 2.48,
		bv: -.09,
		dist: 72,
		pmRa: -9,
		pmDec: -197,
		con: "Cyg",
		conZh: "天鹅"
	},
	{
		name: "Denebola",
		zh: "五帝座一",
		ra: 177.265,
		dec: 14.572,
		mag: 2.14,
		bv: .09,
		dist: 36,
		pmRa: -499,
		pmDec: -114,
		con: "Leo",
		conZh: "狮子"
	},
	{
		name: "Algieba",
		zh: "轩辕十二",
		ra: 154.993,
		dec: 19.842,
		mag: 2.08,
		bv: 1.13,
		dist: 130,
		pmRa: 305,
		pmDec: -154,
		con: "Leo",
		conZh: "狮子"
	},
	{
		name: "Zosma",
		zh: "太微右垣四",
		ra: 168.527,
		dec: 20.524,
		mag: 2.56,
		bv: .13,
		dist: 58,
		pmRa: 144,
		pmDec: -130,
		con: "Leo",
		conZh: "狮子"
	},
	{
		name: "Alcyone",
		zh: "昴宿六",
		ra: 56.871,
		dec: 24.105,
		mag: 2.87,
		bv: -.09,
		dist: 440,
		pmRa: 19,
		pmDec: -46,
		con: "Tau",
		conZh: "金牛"
	},
	{
		name: "Electra",
		zh: "昴宿一",
		ra: 56.219,
		dec: 24.113,
		mag: 3.7,
		bv: -.12,
		dist: 440,
		pmRa: 21,
		pmDec: -46,
		con: "Tau",
		conZh: "金牛"
	},
	{
		name: "Maia",
		zh: "昴宿四",
		ra: 56.457,
		dec: 24.368,
		mag: 3.87,
		bv: -.07,
		dist: 440,
		pmRa: 21,
		pmDec: -46,
		con: "Tau",
		conZh: "金牛"
	},
	{
		name: "Merope",
		zh: "昴宿五",
		ra: 56.219,
		dec: 23.948,
		mag: 4.18,
		bv: -.06,
		dist: 440,
		pmRa: 21,
		pmDec: -44,
		con: "Tau",
		conZh: "金牛"
	},
	{
		name: "Taygeta",
		zh: "昴宿二",
		ra: 56.302,
		dec: 24.467,
		mag: 4.3,
		bv: -.11,
		dist: 440,
		pmRa: 21,
		pmDec: -41,
		con: "Tau",
		conZh: "金牛"
	},
	{
		name: "Barnard's Star",
		zh: "巴纳德星",
		ra: 269.452,
		dec: 4.693,
		mag: 9.54,
		bv: 1.74,
		dist: 5.96,
		pmRa: -803,
		pmDec: 10363,
		con: "Oph",
		conZh: "蛇夫"
	},
	{
		name: "Proxima Cen",
		zh: "比邻星",
		ra: 217.429,
		dec: -62.679,
		mag: 11.13,
		bv: 1.8,
		dist: 4.24,
		pmRa: -3776,
		pmDec: 770,
		con: "Cen",
		conZh: "半人马"
	},
	{
		name: "Kochab",
		zh: "帝星",
		ra: 222.676,
		dec: 74.155,
		mag: 2.08,
		bv: 1.4,
		dist: 131,
		pmRa: -32,
		pmDec: 12,
		con: "UMi",
		conZh: "小熊"
	},
	{
		name: "Pherkad",
		zh: "太子",
		ra: 230.182,
		dec: 71.834,
		mag: 3.05,
		bv: .05,
		dist: 487,
		pmRa: -18,
		pmDec: 18,
		con: "UMi",
		conZh: "小熊"
	},
	{
		name: "Schedar",
		zh: "王良四",
		ra: 10.127,
		dec: 56.537,
		mag: 2.23,
		bv: 1.17,
		dist: 228,
		pmRa: 50,
		pmDec: -32,
		con: "Cas",
		conZh: "仙后"
	},
	{
		name: "Caph",
		zh: "王良一",
		ra: 2.295,
		dec: 59.15,
		mag: 2.27,
		bv: .34,
		dist: 54,
		pmRa: 524,
		pmDec: -180,
		con: "Cas",
		conZh: "仙后"
	},
	{
		name: "Gamma Cas",
		zh: "策",
		ra: 14.177,
		dec: 60.717,
		mag: 2.47,
		bv: -.15,
		dist: 550,
		pmRa: 25,
		pmDec: -4,
		con: "Cas",
		conZh: "仙后"
	},
	{
		name: "Ruchbah",
		zh: "阁道三",
		ra: 21.454,
		dec: 60.235,
		mag: 2.68,
		bv: .16,
		dist: 99,
		pmRa: 297,
		pmDec: -47,
		con: "Cas",
		conZh: "仙后"
	},
	{
		name: "Segin",
		zh: "阁道二",
		ra: 28.599,
		dec: 63.67,
		mag: 3.38,
		bv: -.2,
		dist: 410,
		pmRa: 37,
		pmDec: -8,
		con: "Cas",
		conZh: "仙后"
	},
	{
		name: "Kaus Media",
		zh: "箕宿二",
		ra: 273.441,
		dec: -29.828,
		mag: 2.7,
		bv: .98,
		dist: 348,
		pmRa: 15,
		pmDec: 17,
		con: "Sgr",
		conZh: "人马"
	},
	{
		name: "Kaus Borealis",
		zh: "箕宿一",
		ra: 276.043,
		dec: -26.048,
		mag: 2.81,
		bv: .62,
		dist: 78,
		pmRa: -45,
		pmDec: -186,
		con: "Sgr",
		conZh: "人马"
	},
	{
		name: "Ascella",
		zh: "斗宿六",
		ra: 285.653,
		dec: -29.88,
		mag: 2.6,
		bv: .07,
		dist: 88,
		pmRa: 27,
		pmDec: -121,
		con: "Sgr",
		conZh: "人马"
	},
	{
		name: "Alnasl",
		zh: "箕宿四",
		ra: 271.452,
		dec: -30.424,
		mag: 2.98,
		bv: 0,
		dist: 96,
		pmRa: -50,
		pmDec: -181,
		con: "Sgr",
		conZh: "人马"
	},
	{
		name: "Dschubba",
		zh: "房宿三",
		ra: 240.083,
		dec: -22.622,
		mag: 2.32,
		bv: -.12,
		dist: 400,
		pmRa: -8,
		pmDec: -33,
		con: "Sco",
		conZh: "天蝎"
	},
	{
		name: "Pi Sco",
		zh: "房宿一",
		ra: 237,
		dec: -26,
		mag: 2.89,
		bv: -.18,
		dist: 590,
		pmRa: -12,
		pmDec: -28,
		con: "Sco",
		conZh: "天蝎"
	},
	{
		name: "Graffias",
		zh: "房宿四",
		ra: 241.359,
		dec: -19.805,
		mag: 2.5,
		bv: -.06,
		dist: 404,
		pmRa: -6,
		pmDec: -24,
		con: "Sco",
		conZh: "天蝎"
	},
	{
		name: "Scorpion τ",
		zh: "心宿一",
		ra: 248.971,
		dec: -28.216,
		mag: 2.82,
		bv: .51,
		dist: 400,
		pmRa: -6,
		pmDec: -22,
		con: "Sco",
		conZh: "天蝎"
	},
	{
		name: "Wei",
		zh: "尾宿一",
		ra: 252.968,
		dec: -34.293,
		mag: 2.39,
		bv: .4,
		dist: 65,
		pmRa: -19,
		pmDec: -265,
		con: "Sco",
		conZh: "天蝎"
	},
	{
		name: "Lesath",
		zh: "尾宿九",
		ra: 262.69,
		dec: -37.296,
		mag: 2.7,
		bv: -.18,
		dist: 580,
		pmRa: -4,
		pmDec: -30,
		con: "Sco",
		conZh: "天蝎"
	},
	{
		name: "Thuban",
		zh: "右枢",
		ra: 211.098,
		dec: 64.376,
		mag: 3.67,
		bv: -.05,
		dist: 303,
		pmRa: -48,
		pmDec: 14,
		con: "Dra",
		conZh: "天龙"
	},
	{
		name: "Eltanin",
		zh: "天棓四",
		ra: 269.151,
		dec: 51.489,
		mag: 2.23,
		bv: 1.52,
		dist: 154,
		pmRa: -8,
		pmDec: -23,
		con: "Dra",
		conZh: "天龙"
	},
	{
		name: "Enif",
		zh: "危宿三",
		ra: 326.046,
		dec: 9.875,
		mag: 2.38,
		bv: 1.52,
		dist: 690,
		pmRa: 7,
		pmDec: 1,
		con: "Peg",
		conZh: "飞马"
	},
	{
		name: "Markab",
		zh: "室宿一",
		ra: 346.19,
		dec: 15.205,
		mag: 2.49,
		bv: -.01,
		dist: 133,
		pmRa: 61,
		pmDec: -41,
		con: "Peg",
		conZh: "飞马"
	},
	{
		name: "Scheat",
		zh: "室宿二",
		ra: 345.944,
		dec: 28.083,
		mag: 2.42,
		bv: 1.67,
		dist: 196,
		pmRa: 188,
		pmDec: 137,
		con: "Peg",
		conZh: "飞马"
	},
	{
		name: "Algenib",
		zh: "壁宿一",
		ra: 3.308,
		dec: 15.183,
		mag: 2.83,
		bv: -.19,
		dist: 390,
		pmRa: 5,
		pmDec: -8,
		con: "Peg",
		conZh: "飞马"
	},
	{
		name: "Ankaa",
		zh: "火鸟六",
		ra: 6.571,
		dec: -42.306,
		mag: 2.37,
		bv: 1.09,
		dist: 85,
		pmRa: 224,
		pmDec: -342,
		con: "Phe",
		conZh: "凤凰"
	},
	{
		name: "Algol",
		zh: "大陵五",
		ra: 47.042,
		dec: 40.956,
		mag: 2.12,
		bv: -.05,
		dist: 90,
		pmRa: 3,
		pmDec: -1,
		con: "Per",
		conZh: "英仙"
	}
];
var byName = new Map(CATALOG.map((s) => [s.name, s]));
function starPos(name) {
	const s = byName.get(name);
	if (!s) return [
		0,
		0,
		0
	];
	const d = Math.max(s.dist, .01);
	return raDecDistToThree(s.ra, s.dec, d);
}
var LINE_DEFS = [
	{
		name: "Ori",
		pairs: [
			["Meissa", "Betelgeuse"],
			["Meissa", "Bellatrix"],
			["Betelgeuse", "Alnitak"],
			["Bellatrix", "Mintaka"],
			["Mintaka", "Alnilam"],
			["Alnilam", "Alnitak"],
			["Alnitak", "Saiph"],
			["Mintaka", "Rigel"],
			["Saiph", "Rigel"]
		]
	},
	{
		name: "UMa",
		pairs: [
			["Dubhe", "Merak"],
			["Merak", "Phecda"],
			["Phecda", "Megrez"],
			["Megrez", "Alioth"],
			["Alioth", "Mizar"],
			["Mizar", "Alkaid"],
			["Megrez", "Dubhe"]
		]
	},
	{
		name: "Cru",
		pairs: [["Acrux", "Gacrux"], ["Mimosa", "Delta Cru"]]
	},
	{
		name: "Cyg",
		pairs: [
			["Deneb", "Sadr"],
			["Sadr", "Albireo"],
			["Gienah", "Sadr"]
		]
	},
	{
		name: "Cas",
		pairs: [
			["Caph", "Schedar"],
			["Schedar", "Gamma Cas"],
			["Gamma Cas", "Ruchbah"],
			["Ruchbah", "Segin"]
		]
	},
	{
		name: "Sco",
		pairs: [
			["Dschubba", "Graffias"],
			["Dschubba", "Pi Sco"],
			["Dschubba", "Antares"],
			["Antares", "Scorpion τ"],
			["Scorpion τ", "Wei"],
			["Wei", "Lesath"],
			["Lesath", "Shaula"]
		]
	},
	{
		name: "Leo",
		pairs: [
			["Regulus", "Algieba"],
			["Algieba", "Zosma"],
			["Zosma", "Denebola"],
			["Algieba", "Denebola"]
		]
	},
	{
		name: "Gem",
		pairs: [
			["Castor", "Pollux"],
			["Castor", "Alhena"],
			["Pollux", "Alhena"]
		]
	},
	{
		name: "Tau",
		pairs: [["Aldebaran", "Elnath"], ["Aldebaran", "Alcyone"]]
	},
	{
		name: "Sgr",
		pairs: [
			["Kaus Borealis", "Kaus Media"],
			["Kaus Media", "Kaus Australis"],
			["Kaus Australis", "Alnasl"],
			["Alnasl", "Kaus Borealis"],
			["Nunki", "Ascella"]
		]
	},
	{
		name: "UMi",
		pairs: [["Polaris", "Kochab"], ["Kochab", "Pherkad"]]
	},
	{
		name: "Lyr",
		pairs: [["Vega", "Vega"]]
	},
	{
		name: "Aql",
		pairs: [["Altair", "Altair"]]
	}
];
function buildConstellationPositions() {
	const pts = [];
	for (const c of LINE_DEFS) for (const [a, b] of c.pairs) {
		if (a === b) continue;
		const pa = starPos(a);
		const pb = starPos(b);
		if (pa[0] === 0 && pa[1] === 0 && pa[2] === 0) continue;
		if (pb[0] === 0 && pb[1] === 0 && pb[2] === 0) continue;
		pts.push(pa[0], pa[1], pa[2], pb[0], pb[1], pb[2]);
	}
	return {
		positions: new Float32Array(pts),
		count: pts.length / 3
	};
}
function buildGridPositions() {
	const pts = [];
	const R = 1e3;
	const meridians = 12;
	const parallels = 5;
	const segs = 48;
	for (let m = 0; m < meridians; m++) {
		const ra = m * 360 / meridians;
		for (let i = 0; i < segs; i++) {
			const t0 = -80 + 160 * i / segs;
			const t1 = -80 + 160 * (i + 1) / segs;
			const a = raDecDistToThree(ra, t0, R);
			const b = raDecDistToThree(ra, t1, R);
			pts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
		}
	}
	for (let p = 0; p < parallels; p++) {
		const dec = -60 + p * 30;
		for (let i = 0; i < segs; i++) {
			const r0 = 360 * i / segs;
			const r1 = 360 * (i + 1) / segs;
			const a = raDecDistToThree(r0, dec, R);
			const b = raDecDistToThree(r1, dec, R);
			pts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
		}
	}
	return new Float32Array(pts);
}
var PRESETS = [
	{
		id: "sol",
		label: "Sol",
		zh: "太阳",
		x: 0,
		y: 0,
		z: 0,
		look: "Sirius"
	},
	{
		id: "acen",
		label: "α Centauri",
		zh: "半人马座α",
		x: 0,
		y: 0,
		z: 0,
		look: "Sol"
	},
	{
		id: "sirius",
		label: "Sirius",
		zh: "天狼星旁",
		x: 0,
		y: 0,
		z: 0,
		look: "Sol"
	},
	{
		id: "vega",
		label: "Vega",
		zh: "织女星旁",
		x: 0,
		y: 0,
		z: 0,
		look: "Altair"
	},
	{
		id: "barnard",
		label: "Barnard's Star",
		zh: "巴纳德星旁",
		x: 0,
		y: 0,
		z: 0,
		look: "Sol"
	},
	{
		id: "gc",
		label: "Galactic Centre",
		zh: "银心",
		x: 26600,
		y: 0,
		z: 0,
		look: "Sol"
	},
	{
		id: "pleiades",
		label: "Pleiades",
		zh: "昴星团",
		x: 0,
		y: 0,
		z: 0,
		look: "Aldebaran"
	},
	{
		id: "orion",
		label: "Orion Nebula",
		zh: "猎户座大星云",
		x: 0,
		y: 0,
		z: 0,
		look: "Rigel"
	}
];
function fillPresetFromStar(id, starName, offsetLy = .12) {
	const s = byName.get(starName);
	if (!s) return;
	const p = raDecDistToThree(s.ra, s.dec, s.dist);
	const n = Math.hypot(p[0], p[1], p[2]) || 1;
	const preset = PRESETS.find((x) => x.id === id);
	if (!preset) return;
	preset.x = p[0] - p[0] / n * offsetLy;
	preset.y = p[1] - p[1] / n * offsetLy;
	preset.z = p[2] - p[2] / n * offsetLy;
}
fillPresetFromStar("acen", "Rigil Kentaurus", .08);
fillPresetFromStar("sirius", "Sirius", .15);
fillPresetFromStar("vega", "Vega", .2);
fillPresetFromStar("barnard", "Barnard's Star", .08);
fillPresetFromStar("pleiades", "Alcyone", 8);
fillPresetFromStar("orion", "Alnitak", 12);
var gcThree = galacticOverlook();
{
	const g = PRESETS.find((p) => p.id === "gc");
	if (g) {
		g.x = gcThree[0];
		g.y = gcThree[1];
		g.z = gcThree[2];
	}
}
for (const w of wonderApproaches()) PRESETS.push({
	id: w.id,
	label: w.label,
	zh: w.zh,
	x: w.pos[0],
	y: w.pos[1],
	z: w.pos[2],
	lookAt: w.look,
	group: "wonder"
});
function nearestCatalog(dirX, dirY, dirZ, ox, oy, oz) {
	let best = null;
	let bestDot = .992;
	for (const s of CATALOG) {
		if (s.name === "Sol" && Math.hypot(ox, oy, oz) < .02) continue;
		const d = Math.max(s.dist, 1e-5);
		const p = raDecDistToThree(s.ra, s.dec, d);
		const rx = p[0] - ox;
		const ry = p[1] - oy;
		const rz = p[2] - oz;
		const n = Math.hypot(rx, ry, rz) || 1;
		const dot = (rx * dirX + ry * dirY + rz * dirZ) / n;
		if (dot > bestDot) {
			bestDot = dot;
			best = s;
		}
	}
	return best;
}
var MAX_STARS = 56e3;
var MAX_DUST = 9e3;
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a += 1831565813;
		let t = a;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function randn(rng) {
	const u = Math.max(rng(), 1e-6);
	const v = rng();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}
function spectral(rng) {
	const u = rng();
	if (u < .005) return {
		bv: -.28 + rng() * .12,
		absMag: -4.2 + rng() * 2.5
	};
	if (u < .02) return {
		bv: -.12 + rng() * .12,
		absMag: -1.2 + rng() * 2
	};
	if (u < .08) return {
		bv: .02 + rng() * .18,
		absMag: .6 + rng() * 1.4
	};
	if (u < .2) return {
		bv: .3 + rng() * .22,
		absMag: 2.6 + rng() * 1.2
	};
	if (u < .4) return {
		bv: .58 + rng() * .18,
		absMag: 4.4 + rng() * 1.1
	};
	if (u < .7) return {
		bv: .82 + rng() * .28,
		absMag: 6 + rng() * 1.4
	};
	return {
		bv: 1.2 + rng() * .55,
		absMag: 8.2 + rng() * 2.4
	};
}
function apparentMag(absMag, distLy) {
	const dpc = Math.max(distLy / 3.26156, .05);
	return absMag + 5 * Math.log10(dpc) - 5;
}
function buildStarField() {
	const pos = new Float32Array(MAX_STARS * 3);
	const mag = new Float32Array(MAX_STARS);
	const bv = new Float32Array(MAX_STARS);
	const pm = new Float32Array(MAX_STARS * 2);
	const ext = new Float32Array(MAX_STARS);
	const rng = mulberry32(1373514257);
	let i = 0;
	const push = (x, y, z, m, b, pmx = 0, pmy = 0, dust = 0) => {
		if (i >= 56e3) return;
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
			push(1e-5, 0, 0, s.mag, s.bv, 0, 0);
			continue;
		}
		const p = raDecDistToThree(s.ra, s.dec, Math.max(s.dist, .01));
		push(p[0], p[1], p[2], s.mag, s.bv, s.pmRa, s.pmDec);
	}
	let innerGot = 0;
	const innerTarget = Math.floor(MAX_STARS * .14);
	while (i < MAX_STARS) {
		const wantInner = innerGot < innerTarget;
		const pop = rng();
		let gx;
		let gy;
		let gz;
		if (wantInner) {
			const ru = 12 + Math.pow(rng(), .62) * 900;
			const u = (rng() * 2 - 1) * .55;
			const th = rng() * Math.PI * 2;
			const s = Math.sqrt(Math.max(0, 1 - u * u));
			gx = 26600 + ru * s * Math.cos(th);
			gy = ru * s * Math.sin(th);
			gz = ru * u * .35;
		} else if (pop < .5) {
			const r = Math.pow(rng(), .38) * 2600;
			const th = rng() * Math.PI * 2;
			gx = r * Math.cos(th);
			gy = r * Math.sin(th);
			gz = randn(rng) * 85;
		} else if (pop < .78) {
			const R = 1800 + Math.pow(rng(), .62) * 5e4;
			const phi = rng() * Math.PI * 2;
			const xGc = R * Math.cos(phi);
			const yGc = R * Math.sin(phi);
			gx = 26600 - xGc;
			gy = yGc;
			gz = randn(rng) * (160 + .01 * R);
		} else if (pop < .86) {
			const ru = Math.pow(rng(), 1 / 3) * 3800;
			const u = rng() * 2 - 1;
			const th = rng() * Math.PI * 2;
			const s = Math.sqrt(Math.max(0, 1 - u * u));
			gx = 26600 + ru * s * Math.cos(th);
			gy = ru * s * Math.sin(th);
			gz = ru * u * .55;
		} else {
			const ru = Math.pow(rng(), 1 / 3) * 42e3;
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
		const sp = wantInner ? rng() < .35 ? {
			bv: 1.05 + rng() * .55,
			absMag: -3.4 + rng() * 2.2
		} : {
			bv: spectral(rng).bv,
			absMag: -1.2 + rng() * 3.2
		} : spectral(rng);
		const plane = Math.abs(gz);
		const ext = 7e-4 * Math.hypot(gx, gy) * (plane < 400 ? 1 : .25);
		const m = apparentMag(sp.absMag, dist);
		const mGc = apparentMag(sp.absMag, Math.max(distGc, .4));
		if (wantInner) {
			if (mGc > 7.4) continue;
			innerGot++;
		} else if (m + ext > 12.8 && rng() > .18) continue;
		push(t[0], t[1], t[2], m, sp.bv, (rng() - .5) * 40, (rng() - .5) * 40, ext);
	}
	return {
		pos,
		mag,
		bv,
		pm,
		ext,
		count: i
	};
}
function buildDust(count, box) {
	const rng = mulberry32(295944414);
	const n = Math.min(count, MAX_DUST);
	const pos = new Float32Array(n * 3);
	const seed = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		pos[i * 3] = (rng() - .5) * box;
		pos[i * 3 + 1] = (rng() - .5) * box;
		pos[i * 3 + 2] = (rng() - .5) * box;
		seed[i] = rng() * 1e3;
	}
	return {
		pos,
		seed,
		count: n
	};
}
function densityToCount(density) {
	return Math.floor(2800 + Math.max(.12, Math.min(1, density)) * 53200);
}
var GAME_CODES = /* @__PURE__ */ new Set([
	"KeyW",
	"KeyA",
	"KeyS",
	"KeyD",
	"KeyQ",
	"KeyE",
	"KeyR",
	"KeyC",
	"KeyF",
	"KeyH",
	"KeyI",
	"Space",
	"ShiftLeft",
	"ShiftRight",
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight"
]);
function radialDeadzone(x, y, dz = .16) {
	const m = Math.hypot(x, y);
	if (m < dz) return {
		x: 0,
		y: 0
	};
	const scale = (m - dz) / (1 - dz) / m;
	return {
		x: x * scale,
		y: y * scale
	};
}
function clamp(v, a, b) {
	return Math.max(a, Math.min(b, v));
}
function createInput() {
	const keys = /* @__PURE__ */ new Set();
	const lookAccum = {
		x: 0,
		y: 0
	};
	let wheelThrottle = 0;
	const state = {
		actions: {
			yaw: 0,
			pitch: 0,
			roll: 0,
			throttle: 0,
			boost: false,
			lookDx: 0,
			lookDy: 0
		},
		inject: null,
		steerOverride: null,
		boostHold: false,
		dragging: false,
		pointerId: null,
		lastX: 0,
		lastY: 0,
		attach: (el) => attach(el),
		sample: () => sample()
	};
	function activeKeys() {
		if (state.inject) return new Set(state.inject);
		return keys;
	}
	function onKeyDown(e) {
		if (e.metaKey || e.ctrlKey) return;
		if (GAME_CODES.has(e.code)) e.preventDefault();
		keys.add(e.code);
	}
	function onKeyUp(e) {
		keys.delete(e.code);
	}
	function clearKeys() {
		keys.clear();
	}
	function onPointerDown(e) {
		const t = e.target;
		if (t && t.closest("[data-ui]")) return;
		state.dragging = true;
		state.pointerId = e.pointerId;
		state.lastX = e.clientX;
		state.lastY = e.clientY;
		e.currentTarget.setPointerCapture(e.pointerId);
	}
	function onPointerMove(e) {
		if (document.pointerLockElement) {
			lookAccum.x += e.movementX;
			lookAccum.y += e.movementY;
			return;
		}
		if (!state.dragging || e.pointerId !== state.pointerId) return;
		lookAccum.x += e.clientX - state.lastX;
		lookAccum.y += e.clientY - state.lastY;
		state.lastX = e.clientX;
		state.lastY = e.clientY;
	}
	function onPointerUp(e) {
		if (e.pointerId !== state.pointerId) return;
		state.dragging = false;
		state.pointerId = null;
	}
	function onPointerCancel(e) {
		if (e.pointerId !== state.pointerId) return;
		state.dragging = false;
		state.pointerId = null;
	}
	function onWheel(e) {
		const t = e.target;
		if (t && t.closest("[data-ui]")) return;
		e.preventDefault();
		const dir = e.deltaY > 0 ? -1 : 1;
		wheelThrottle += dir * .35;
	}
	function attach(el) {
		const keyDown = (e) => onKeyDown(e);
		const keyUp = (e) => onKeyUp(e);
		window.addEventListener("keydown", keyDown);
		window.addEventListener("keyup", keyUp);
		window.addEventListener("blur", clearKeys);
		const vis = () => {
			if (document.hidden) clearKeys();
		};
		document.addEventListener("visibilitychange", vis);
		el.addEventListener("pointerdown", onPointerDown);
		window.addEventListener("pointermove", onPointerMove);
		el.addEventListener("pointerup", onPointerUp);
		el.addEventListener("pointercancel", onPointerCancel);
		el.addEventListener("wheel", onWheel, { passive: false });
		return () => {
			window.removeEventListener("keydown", keyDown);
			window.removeEventListener("keyup", keyUp);
			window.removeEventListener("blur", clearKeys);
			document.removeEventListener("visibilitychange", vis);
			el.removeEventListener("pointerdown", onPointerDown);
			window.removeEventListener("pointermove", onPointerMove);
			el.removeEventListener("pointerup", onPointerUp);
			el.removeEventListener("pointercancel", onPointerCancel);
			el.removeEventListener("wheel", onWheel);
		};
	}
	function samplePad() {
		const pads = navigator.getGamepads?.() ?? [];
		let yaw = 0;
		let pitch = 0;
		let lookX = 0;
		let lookY = 0;
		let throttle = 0;
		let boost = false;
		for (const pad of pads) {
			if (!pad) continue;
			const left = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
			const right = radialDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0);
			yaw += -left.x;
			throttle += -left.y;
			lookX += right.x * 18;
			lookY += right.y * 18;
			if (pad.buttons[12]?.pressed) pitch += 1;
			if (pad.buttons[13]?.pressed) pitch -= 1;
			if (pad.buttons[14]?.pressed) yaw += 1;
			if (pad.buttons[15]?.pressed) yaw -= 1;
			if (pad.buttons[7]?.value && pad.buttons[7].value > .15) throttle += pad.buttons[7].value;
			if (pad.buttons[6]?.value && pad.buttons[6].value > .15) throttle -= pad.buttons[6].value;
			if (pad.buttons[0]?.pressed || pad.buttons[5]?.pressed) boost = true;
		}
		return {
			yaw,
			pitch,
			lookX,
			lookY,
			throttle,
			boost
		};
	}
	function sample() {
		const k = activeKeys();
		let yaw = 0;
		let pitch = 0;
		let roll = 0;
		let throttle = 0;
		if (k.has("KeyA") || k.has("ArrowLeft")) yaw += 1;
		if (k.has("KeyD") || k.has("ArrowRight")) yaw -= 1;
		if (k.has("ArrowUp")) pitch += 1;
		if (k.has("ArrowDown")) pitch -= 1;
		if (k.has("KeyQ")) roll += 1;
		if (k.has("KeyE")) roll -= 1;
		if (k.has("KeyW")) throttle += 1;
		if (k.has("KeyS")) throttle -= 1;
		throttle += clamp(wheelThrottle, -1.5, 1.5);
		wheelThrottle *= .72;
		let boost = k.has("ShiftLeft") || k.has("ShiftRight") || k.has("Space") || state.boostHold;
		const pad = samplePad();
		yaw += pad.yaw;
		pitch += pad.pitch;
		throttle += pad.throttle;
		boost = boost || pad.boost;
		if (state.steerOverride !== null) yaw = state.steerOverride;
		const lookDx = lookAccum.x + pad.lookX;
		const lookDy = lookAccum.y + pad.lookY;
		lookAccum.x = 0;
		lookAccum.y = 0;
		const actions = {
			yaw: clamp(yaw, -1, 1),
			pitch: clamp(pitch, -1, 1),
			roll: clamp(roll, -1, 1),
			throttle: clamp(throttle, -1.5, 1.5),
			boost,
			lookDx,
			lookDy
		};
		state.actions = actions;
		return actions;
	}
	return state;
}
/** Rapidity φ: β = tanh φ, γ = cosh φ. Unbounded, never exceeds c. */
function betaFromPhi(phi) {
	return Math.tanh(phi);
}
function gammaFromPhi(phi) {
	return Math.cosh(Math.min(Math.abs(phi), 12));
}
function formatBeta(beta) {
	const a = Math.abs(beta);
	if (a < .001) return `${(beta * 100).toFixed(2)}% c`;
	if (a < .1) return `${beta.toFixed(4)} c`;
	if (a < .99) return `${beta.toFixed(4)} c`;
	if (a < .9999) return `${beta.toFixed(6)} c`;
	return `${beta.toFixed(8)} c`;
}
function formatGamma(g) {
	if (g < 1.01) return g.toFixed(5);
	if (g < 10) return g.toFixed(3);
	if (g < 100) return g.toFixed(2);
	return g.toFixed(1);
}
/** Frequency ratio for a star at rest-frame direction `dir` (θ = 0 is ahead). */
function dopplerFactor(dir, vhat, beta) {
	const b2 = Math.min(beta * beta, .999999);
	const gamma = 1 / Math.sqrt(1 - b2);
	const cost = dir[0] * vhat[0] + dir[1] * vhat[1] + dir[2] * vhat[2];
	return 1 / Math.max(gamma * (1 - beta * cost), .015);
}
/** Rest-frame star direction → moving observer's sky. Matches the star shader. */
function aberrateDir(dir, vhat, beta) {
	const b2 = Math.min(beta * beta, .999999);
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
	return [
		rx / n,
		ry / n,
		rz / n
	];
}
var STAR_VERT = `
attribute float aMag;
attribute float aBv;
attribute vec2 aPm;
attribute float aExt;

uniform vec3 uObserver;
uniform float uYear;
uniform float uBeta;
uniform vec3 uVelDir;
uniform float uPixelRatio;
uniform float uTrail;
uniform float uRelativity;
uniform float uFovBoost;
uniform vec3 uLensPos;
uniform float uLensRs;
uniform float uLensRadius;
uniform float uLensGrav;
uniform float uInside;
uniform float uLensEdge;
uniform float uSecondary;

varying vec3 vColor;
varying float vAlpha;
varying vec2 vVel;
varying float vTrail;

vec3 pmDisplace(vec3 pos, vec2 pm, float year) {
  float dist = length(pos);
  if (dist < 1e-4) return pos;
  vec3 dir = pos / dist;
  float dt = year - 2000.0;
  float rad = 4.848136811e-9 * dt;
  vec3 north = vec3(0.0, 1.0, 0.0);
  vec3 east = normalize(cross(north, dir));
  vec3 ndir = cross(dir, east);
  vec3 d = normalize(dir + (east * pm.x + ndir * pm.y) * rad);
  return d * dist;
}

vec3 aberrate(vec3 dir, vec3 vhat, float beta) {
  float b2 = min(beta * beta, 0.999999);
  float gamma = inversesqrt(1.0 - b2);
  float cost = dot(dir, vhat);
  float denom = 1.0 + beta * cost;
  vec3 para = vhat * cost;
  vec3 perp = dir - para;
  return normalize((perp / gamma + vhat * (cost + beta)) / max(denom, 1e-5));
}

float dopplerD(vec3 dir, vec3 vhat, float beta) {
  float b2 = min(beta * beta, 0.999999);
  float gamma = inversesqrt(1.0 - b2);
  float cost = dot(dir, vhat);
  return 1.0 / max(gamma * (1.0 - beta * cost), 0.015);
}

vec3 bvToRgb(float bv) {
  float t = clamp(bv, -0.4, 2.0);
  vec3 c;
  if (t < 0.0) {
    c = mix(vec3(0.62, 0.74, 1.0), vec3(0.78, 0.84, 1.0), t + 0.4);
  } else if (t < 0.45) {
    c = mix(vec3(0.78, 0.84, 1.0), vec3(1.0, 0.97, 0.92), t / 0.45);
  } else if (t < 1.1) {
    c = mix(vec3(1.0, 0.97, 0.92), vec3(1.0, 0.72, 0.42), (t - 0.45) / 0.65);
  } else {
    c = mix(vec3(1.0, 0.72, 0.42), vec3(1.0, 0.48, 0.28), clamp((t - 1.1) / 0.9, 0.0, 1.0));
  }
  return c;
}

vec3 lensDir(vec3 dir, vec3 starPos) {
  if (uLensRs <= 0.0 || uInside > 0.5) return dir;
  vec3 toL = uLensPos - uObserver;
  float Dl = length(toL);
  if (Dl < 1e-8) return uSecondary > 0.5 ? vec3(0.0) : dir;
  if (dot(starPos - uObserver, toL) < Dl * Dl * 0.98) return uSecondary > 0.5 ? vec3(0.0) : dir;
  vec3 lhat = toL / Dl;
  float c = clamp(dot(dir, lhat), -1.0, 1.0);
  float betaAng = acos(c);
  float thetaE2 = 2.0 * uLensRs / Dl;
  if (thetaE2 < 1.6e-5) return uSecondary > 0.5 ? vec3(0.0) : dir;
  float disc = sqrt(betaAng * betaAng + 4.0 * thetaE2);
  float theta = uSecondary > 0.5 ? 0.5 * (-betaAng + disc) : 0.5 * (betaAng + disc);
  if (uSecondary > 0.5 && theta < uLensEdge) return vec3(0.0);
  vec3 perp = dir - lhat * c;
  float pl = length(perp);
  if (pl < 1e-5) {
    vec3 tmp = abs(lhat.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    perp = normalize(cross(lhat, tmp));
  } else {
    perp /= pl;
  }
  float side = uSecondary > 0.5 ? -1.0 : 1.0;
  return cos(theta) * lhat + side * sin(theta) * perp;
}

float lensMu(vec3 dir, vec3 starPos) {
  if (uLensRs <= 0.0 || uSecondary > 0.5) return 1.0;
  vec3 toL = uLensPos - uObserver;
  float Dl = length(toL);
  if (Dl < 1e-8) return 1.0;
  if (dot(starPos - uObserver, toL) < Dl * Dl * 0.98) return 1.0;
  float thetaE = sqrt(max(2.0 * uLensRs / Dl, 0.0));
  if (thetaE < 0.004) return 1.0;
  float u = acos(clamp(dot(dir, toL / Dl), -1.0, 1.0)) / thetaE;
  float mu = (u * u + 2.0) / max(u * sqrt(u * u + 4.0), 1e-3);
  return clamp(mu, 1.0, 3.2);
}

vec3 spectralShift(vec3 color, float D) {
  if (D > 1.0) {
    float t = clamp((D - 1.0) * 0.55, 0.0, 1.0);
    return mix(color, min(color * vec3(0.7, 0.86, 1.28), vec3(1.0)), t);
  }
  float t = clamp((1.0 - D) * 1.25, 0.0, 1.0);
  return mix(color, min(color * vec3(1.28, 0.45, 0.28), vec3(1.0)), t);
}

void main() {
  if (uSecondary > 0.5 && uLensRs <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    vColor = vec3(0.0);
    vVel = vec2(0.0, 1.0);
    vTrail = 0.0;
    return;
  }

  vec3 pos = pmDisplace(position, aPm, uYear);
  vec3 rel = pos - uObserver;
  float dist = max(length(rel), 0.0008);
  vec3 dir = rel / dist;

  if (length(position) < 0.001 && dist < 0.003) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    vColor = vec3(0.0);
    vVel = vec2(0.0, 1.0);
    vTrail = 0.0;
    return;
  }

  if (uInside > 0.5) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    vColor = vec3(0.0);
    vVel = vec2(0.0, 1.0);
    vTrail = 0.0;
    return;
  }

  if (uLensRadius > 0.0 && length(pos - uLensPos) < uLensRadius) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    vColor = vec3(0.0);
    vVel = vec2(0.0, 1.0);
    vTrail = 0.0;
    return;
  }

  float mu = lensMu(dir, pos);
  dir = lensDir(dir, pos);
  if (uSecondary > 0.5 && dot(dir, dir) < 1e-6) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    vColor = vec3(0.0);
    vVel = vec2(0.0, 1.0);
    vTrail = 0.0;
    return;
  }

  float beta = uRelativity > 0.5 ? uBeta : 0.0;
  float D = 1.0;
  if (beta > 1.0e-5) {
    D = dopplerD(dir, uVelDir, beta);
    dir = aberrate(dir, uVelDir, beta);
  }
  D *= uRelativity > 0.5 ? uLensGrav : 1.0;

  vec3 world = dir * 1200.0;
  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mv;

  float beam = pow(clamp(D, 0.04, 8.0), 3.0);
  float mag;
  if (length(position) < 0.001) {
    mag = 4.83 + 5.0 * log(max(dist, 0.002) / 3.26156) / log(10.0) - 5.0;
  } else {
    float d0 = max(length(pos), 0.05);
    float mod = 5.0 * log(max(dist, 0.02) / d0) / log(10.0);
    float dust = aExt * exp(-length(uObserver) * 0.004);
    mag = clamp(aMag + mod + dust, -3.2, 13.5);
  }
  float flux0 = pow(10.0, -0.4 * mag);
  float flux = flux0 * beam * mix(1.0, mu, 0.4);
  if (uSecondary > 0.5) flux *= 0.42;
  float aLin = flux * 22.0;
  vec3 base = bvToRgb(aBv);
  float gain = clamp(1.0 + 0.06 * (D - 1.0), 0.42, 1.05);
  vColor = min(spectralShift(base, D) * gain, vec3(1.0));
  vAlpha = clamp(aLin, 0.0, 0.82);

  // Sprite size stays tied to geometric brightness. Full D^3 only lifts alpha;
  // otherwise the forward field at ~0.6c becomes a solid additive sheet.
  float sizeDriver = flux0 * (1.0 + 0.4 * clamp(beam - 1.0, 0.0, 2.5));
  float size = mix(1.35, 10.5, pow(clamp(sizeDriver * 10.0, 0.0, 1.0), 0.32));
  vTrail = uTrail;
  float grow = 1.0 + uTrail * 1.45;
  gl_PointSize = clamp(size * uPixelRatio * grow * (1.0 + uFovBoost * 0.08), 1.0, 28.0);

  vec3 prevDir = dir;
  if (beta > 1.0e-5) {
    prevDir = normalize(dir - uVelDir * (0.08 + uTrail * 0.35));
  }
  vec4 clip0 = gl_Position;
  vec4 clip1 = projectionMatrix * modelViewMatrix * vec4(prevDir * 1200.0, 1.0);
  vec2 s0 = clip0.xy / max(clip0.w, 1e-4);
  vec2 s1 = clip1.xy / max(clip1.w, 1e-4);
  vec2 vel = s0 - s1;
  float vl = length(vel);
  vVel = vl > 1e-6 ? vel / vl : vec2(0.0, 1.0);
}
`;
var STAR_FRAG = `
varying vec3 vColor;
varying float vAlpha;
varying vec2 vVel;
varying float vTrail;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r2 = dot(uv, uv);
  if (r2 > 0.25) discard;

  float t = clamp(vTrail, 0.0, 1.0);
  float core = exp(-r2 * mix(40.0, 72.0, t));
  float halo = exp(-r2 * mix(8.0, 20.0, t)) * mix(0.2, 0.05, t);

  vec2 v = vVel;
  float along = uv.x * v.x + uv.y * v.y;
  float perp = uv.x * v.y - uv.y * v.x;
  float streak = exp(-perp * perp * mix(32.0, 260.0, t)) * smoothstep(0.5, -0.44, along);
  float a = mix(core + halo, max(core * 0.7, streak * 0.62) + halo, t);

  gl_FragColor = vec4(vColor, vAlpha * a);
}
`;
var DUST_VERT = `
attribute float aSeed;
uniform vec3 uVelDir;
uniform float uTravel;
uniform float uBox;
uniform float uPixelRatio;
uniform float uTrail;
uniform float uBeta;
uniform float uRelativity;
uniform float uLensDim;

varying vec3 vColor;
varying float vAlpha;
varying vec2 vVel;
varying float vTrail;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

vec3 aberrate(vec3 dir, vec3 vhat, float beta) {
  float b2 = min(beta * beta, 0.999999);
  float gamma = inversesqrt(1.0 - b2);
  float cost = dot(dir, vhat);
  float denom = 1.0 + beta * cost;
  vec3 para = vhat * cost;
  vec3 perp = dir - para;
  return normalize((perp / gamma + vhat * (cost + beta)) / max(denom, 1e-5));
}

void main() {
  vec3 p0 = position;
  float box = uBox;
  vec3 p = p0 - uVelDir * uTravel;
  p = mod(p + box * 0.5, box) - box * 0.5;

  float beta = uRelativity > 0.5 ? uBeta : 0.0;
  vec3 world = p;
  if (beta > 0.05) {
    float d = length(p);
    vec3 dir = p / max(d, 1e-4);
    dir = aberrate(dir, uVelDir, beta * 0.85);
    world = dir * d;
  }

  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mv;

  float depth = max(-mv.z, 0.2);
  float fadeEdge = 1.0 - smoothstep(box * 0.38, box * 0.5, length(p));
  float fadeNear = smoothstep(0.15, 2.4, depth);
  float speed = smoothstep(0.08, 0.8, uBeta);
  vAlpha = fadeEdge * fadeNear * mix(0.42, 0.22, speed) * (1.0 - 0.9 * clamp(uLensDim, 0.0, 1.0));

  float hue = hash(aSeed);
  vColor = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.78, 0.55), hue);
  if (beta > 0.35) {
    vColor = mix(vColor, vec3(0.62, 0.8, 1.0), clamp((beta - 0.35) * 0.9, 0.0, 0.8));
  }

  vTrail = uTrail;
  float angular = clamp(12.0 / depth, 0.55, 4.2);
  float grow = 1.0 + uTrail * 3.2;
  gl_PointSize = clamp(angular * grow * uPixelRatio, 1.0, 36.0);

  vec4 clip0 = gl_Position;
  vec4 clip1 = projectionMatrix * modelViewMatrix * vec4(world - uVelDir * (2.0 + uTrail * 18.0), 1.0);
  vec2 s0 = clip0.xy / max(clip0.w, 1e-4);
  vec2 s1 = clip1.xy / max(clip1.w, 1e-4);
  vec2 vel = s0 - s1;
  float vl = length(vel);
  vVel = vl > 1e-6 ? vel / vl : vec2(0.0, 1.0);
}
`;
var DUST_FRAG = `
varying vec3 vColor;
varying float vAlpha;
varying vec2 vVel;
varying float vTrail;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float r2 = dot(uv, uv);
  if (r2 > 0.25) discard;
  vec2 v = vVel;
  float along = uv.x * v.x + uv.y * v.y;
  float perp = uv.x * v.y - uv.y * v.x;
  float t = clamp(vTrail, 0.0, 1.0);
  float core = exp(-r2 * mix(32.0, 64.0, t));
  float streak = exp(-perp * perp * mix(40.0, 320.0, t)) * smoothstep(0.48, -0.46, along);
  float a = mix(core, max(core * 0.35, streak * 0.8), t);
  gl_FragColor = vec4(vColor, vAlpha * a);
}
`;
var LINE_VERT = `
uniform vec3 uObserver;
uniform float uBeta;
uniform vec3 uVelDir;
uniform float uRelativity;
uniform float uYear;
uniform vec3 uLensPos;
uniform float uLensRs;
uniform float uInside;

varying float vAlpha;

vec3 aberrate(vec3 dir, vec3 vhat, float beta) {
  float b2 = min(beta * beta, 0.999999);
  float gamma = inversesqrt(1.0 - b2);
  float cost = dot(dir, vhat);
  float denom = 1.0 + beta * cost;
  vec3 para = vhat * cost;
  vec3 perp = dir - para;
  return normalize((perp / gamma + vhat * (cost + beta)) / max(denom, 1e-5));
}

vec3 lensDir(vec3 dir) {
  if (uLensRs <= 0.0 || uInside > 0.5) return dir;
  vec3 toL = uLensPos - uObserver;
  float Dl = length(toL);
  if (Dl < 1e-8) return dir;
  vec3 lhat = toL / Dl;
  float c = clamp(dot(dir, lhat), -1.0, 1.0);
  float betaAng = acos(c);
  float thetaE2 = 2.0 * uLensRs / Dl;
  if (thetaE2 < 1.6e-5) return dir;
  float theta = 0.5 * (betaAng + sqrt(betaAng * betaAng + 4.0 * thetaE2));
  vec3 perp = dir - lhat * c;
  float pl = length(perp);
  if (pl < 1e-5) {
    vec3 tmp = abs(lhat.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    perp = normalize(cross(lhat, tmp));
  } else {
    perp /= pl;
  }
  return cos(theta) * lhat + sin(theta) * perp;
}

void main() {
  if (uInside > 0.5) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0;
    return;
  }
  vec3 rel = position - uObserver;
  float dist = max(length(rel), 0.0008);
  vec3 dir0 = rel / dist;
  vec3 toL = uLensPos - uObserver;
  float behind = dot(rel, toL) - dot(toL, toL) * 0.98;
  vec3 dir = behind > 0.0 ? lensDir(dir0) : dir0;
  float beta = uRelativity > 0.5 ? uBeta : 0.0;
  if (beta > 1.0e-5) dir = aberrate(dir, uVelDir, beta);
  vec3 world = dir * 1180.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  float cost = dot(dir, uVelDir);
  float beam = 1.0;
  if (beta > 1.0e-5) {
    float b2 = min(beta * beta, 0.999999);
    float gamma = inversesqrt(1.0 - b2);
    float D = 1.0 / max(gamma * (1.0 - beta * cost), 0.02);
    beam = clamp(D * 0.55, 0.15, 1.6);
  }
  vAlpha = 0.55 * beam;
}
`;
var LINE_FRAG = `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  gl_FragColor = vec4(uColor, vAlpha);
}
`;
var WARP_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;
var WARP_FRAG = `
varying vec2 vUv;
uniform float uBoost;
uniform float uTime;
uniform float uAspect;

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  uv.x *= uAspect;
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  float spokes = pow(abs(sin(a * 42.0 + uTime * 0.55)), 16.0);
  spokes += pow(abs(sin(a * 18.0 - uTime * 0.22)), 24.0) * 0.45;
  float radial = smoothstep(0.018, 0.12, r) * smoothstep(1.35, 0.22, r);
  float tunnel = spokes * radial * uBoost;
  vec3 col = mix(vec3(0.55, 0.76, 1.15), vec3(1.0, 0.88, 0.72), clamp(r * 0.9, 0.0, 1.0));
  float glow = exp(-r * 3.2) * uBoost * 0.18;
  gl_FragColor = vec4(col * (tunnel * 0.22 + glow), 1.0);
}
`;
var BODY_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
var BODY_FRAG = `
varying vec2 vUv;
uniform float uKind;
uniform float uHalf;
uniform float uEdge;
uniform float uTime;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float ang = length(p) * uHalf;
  if (uKind < 0.5) {
    float shadow = smoothstep(uEdge * 1.025, uEdge * 0.94, ang);
    float phot = exp(-pow((ang - uEdge * 1.05) / max(uEdge * 0.03, 1e-4), 2.0));
    float glow = exp(-abs(ang - uEdge) / max(uEdge * 0.7, 1e-4));

    vec2 e = vec2(p.x, p.y / 0.42);
    float eAng = length(e) * uHalf;
    float phi = atan(e.y, e.x);
    float bandIn = smoothstep(uEdge * 1.06, uEdge * 1.2, eAng);
    float bandOut = smoothstep(uEdge * 1.78, uEdge * 1.42, eAng);
    float dop = 0.22 + 0.78 * smoothstep(-1.2, 1.05, e.x);
    float spin = 0.84 + 0.16 * sin(phi * 6.0 - uTime * 1.3);
    vec3 diskCol = mix(vec3(0.42, 0.1, 0.04), vec3(1.0, 0.74, 0.38), dop) * dop * spin;
    float diskA = bandIn * bandOut;

    vec3 col = diskCol * diskA;
    col += vec3(1.0, 0.88, 0.68) * phot * 0.7;
    col += vec3(0.32, 0.5, 0.85) * glow * 0.16 * (1.0 - shadow);
    col *= 1.0 - shadow;
    float alpha = max(shadow, clamp(diskA * 0.92 + phot * 0.75 + glow * 0.12, 0.0, 0.94));
    if (alpha < 0.025) discard;
    gl_FragColor = vec4(min(col, vec3(1.0)), alpha);
    return;
  }
  float limb = clamp(1.0 - ang / max(uEdge, 1e-4), 0.0, 1.0);
  float disk = smoothstep(uEdge * 1.02, uEdge * 0.96, ang);
  if (disk < 0.02) discard;
  vec3 col;
  if (uKind < 1.5) {
    float pulse = 0.85 + 0.15 * sin(uTime * 18.0);
    col = mix(vec3(0.35, 0.55, 0.95), vec3(0.92, 0.96, 1.0), pow(limb, 0.45)) * pulse;
  } else if (uKind < 2.5) {
    float n = sin(p.x * 7.5 + p.y * 3.2 + uTime * 0.25);
    n += sin(p.y * 11.0 - p.x * 6.4 - uTime * 0.18) * 0.65;
    n += sin(dot(p, vec2(14.0, -9.0)) + uTime * 0.4) * 0.35;
    float grain = 0.8 + 0.2 * clamp(n * 0.55, -1.0, 1.0);
    col = mix(vec3(0.45, 0.12, 0.05), vec3(1.0, 0.42, 0.16), pow(limb, 0.55)) * grain;
  } else {
    col = mix(vec3(0.65, 0.78, 1.0), vec3(1.0, 0.98, 0.96), pow(limb, 0.35));
  }
  gl_FragColor = vec4(col, disk);
}
`;
var INTERIOR_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;
var INTERIOR_FRAG = `
varying vec2 vUv;
uniform float uTime;
uniform float uKind;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float wave = 0.5 + 0.5 * sin(uTime * 0.65 + r * 7.0);
  vec3 col;
  if (uKind < 0.5) {
    col = vec3(0.09, 0.02, 0.014) * (0.4 + 0.7 * wave);
    col += vec3(0.26, 0.05, 0.025) * exp(-r * 1.5) * 0.45;
  } else if (uKind < 1.5) {
    col = vec3(0.35, 0.5, 0.85) * (0.28 + 0.22 * wave);
    col += vec3(0.75, 0.86, 1.0) * exp(-r * 1.8) * 0.28;
  } else if (uKind < 2.5) {
    col = vec3(0.32, 0.07, 0.025) * (0.5 + 0.45 * wave);
    col += vec3(0.72, 0.24, 0.07) * exp(-r * 1.3) * 0.35;
  } else {
    col = vec3(0.62, 0.74, 0.95) * (0.32 + 0.16 * wave);
    col += vec3(0.9, 0.95, 1.0) * exp(-r * 1.6) * 0.22;
  }
  gl_FragColor = vec4(col, 1.0);
}
`;
var _m = new Matrix4();
var _qDevice = new Quaternion();
var _qBaseDevice = new Quaternion();
var _qBaseView = new Euler(0, 0, 0, "YXZ");
var _qView = new Quaternion();
var _qLocal = new Quaternion();
var _euler$1 = new Euler(0, 0, 0, "YXZ");
var listening = false;
var calibrated = false;
var seen = false;
var hint = "";
var hintTimer = 0;
var latest = null;
var useAbsolute = false;
var baseOrient = 0;
function screenAngle() {
	const angle = screen.orientation?.angle;
	if (typeof angle === "number") return angle;
	const legacy = window.orientation;
	return typeof legacy === "number" ? legacy : 0;
}
/** Device-to-Earth quaternion from the W3C orientation matrix. */
function deviceQuaternion(alpha, beta, gamma, out = _qDevice) {
	const d = Math.PI / 180;
	const x = beta * d;
	const y = gamma * d;
	const z = alpha * d;
	const cX = Math.cos(x);
	const cY = Math.cos(y);
	const cZ = Math.cos(z);
	const sX = Math.sin(x);
	const sY = Math.sin(y);
	const sZ = Math.sin(z);
	_m.set(cZ * cY - sZ * sX * sY, -cX * sZ, cY * sZ * sX + cZ * sY, 0, cY * sZ + cZ * sX * sY, cZ * cX, sZ * sY - cZ * cY * sX, 0, -cX * sY, sX, cX * cY, 0, 0, 0, 0, 1);
	return out.setFromRotationMatrix(_m);
}
function onOrient(e) {
	if (e.alpha == null || e.beta == null || e.gamma == null) return;
	if (e.absolute && !useAbsolute) {
		useAbsolute = true;
		calibrated = false;
	} else if (!e.absolute && useAbsolute) return;
	latest = {
		alpha: e.alpha,
		beta: e.beta,
		gamma: e.gamma,
		orient: screenAngle()
	};
	seen = true;
	hint = "";
}
function attitudeHint() {
	return hint;
}
function attitudeReady() {
	return listening && latest != null;
}
function attitudeCalibrated() {
	return calibrated;
}
function calibrateAttitude(pose) {
	if (!latest) return;
	deviceQuaternion(latest.alpha, latest.beta, latest.gamma, _qBaseDevice);
	_qBaseView.set(pose.pitch, pose.yaw, pose.roll, "YXZ");
	baseOrient = latest.orient;
	calibrated = true;
}
/** Write the phone's motion since calibration into the view. Returns false if the screen just rotated and the caller should recalibrate. */
function applyAttitude(pose) {
	if (!latest || !calibrated) return false;
	if (latest.orient !== baseOrient) return false;
	deviceQuaternion(latest.alpha, latest.beta, latest.gamma, _qDevice);
	_qLocal.copy(_qBaseDevice).invert().multiply(_qDevice);
	_qView.setFromEuler(_qBaseView).multiply(_qLocal);
	_euler$1.setFromQuaternion(_qView, "YXZ");
	pose.pitch = Math.max(-1.45, Math.min(1.45, _euler$1.x));
	pose.yaw = _euler$1.y;
	pose.roll = _euler$1.z;
	return true;
}
function bind() {
	window.addEventListener("deviceorientation", onOrient);
	window.addEventListener("deviceorientationabsolute", onOrient);
	listening = true;
	seen = false;
	calibrated = false;
	latest = null;
	useAbsolute = false;
	window.clearTimeout(hintTimer);
	hintTimer = window.setTimeout(() => {
		if (listening && !seen) hint = "未检测到姿态传感器";
	}, 1600);
}
function disableAttitude() {
	window.removeEventListener("deviceorientation", onOrient);
	window.removeEventListener("deviceorientationabsolute", onOrient);
	listening = false;
	calibrated = false;
	latest = null;
	seen = false;
	useAbsolute = false;
	hint = "";
	window.clearTimeout(hintTimer);
}
async function enableAttitude() {
	const Doe = DeviceOrientationEvent;
	if (typeof Doe.requestPermission === "function") try {
		if (await Doe.requestPermission() === "denied") {
			hint = "需要允许方向传感器";
			return false;
		}
	} catch {
		hint = "需要允许方向传感器";
		return false;
	}
	if (listening) disableAttitude();
	hint = "";
	bind();
	return true;
}
var STORAGE_KEY = "sidereal-v1";
var NOW_YEAR = 2026.7;
function defaultSim() {
	return {
		yaw: 1.48,
		pitch: .12,
		roll: 0,
		rapidity: .22,
		cruisePhi: .22,
		boost: false,
		pos: [
			0,
			0,
			0
		],
		velDir: lookDirFromYawPitch(1.48, .12),
		inertial: false,
		velYaw: 1.48,
		velPitch: .12,
		epochYear: NOW_YEAR,
		coordYears: 0,
		properYears: 0,
		timeRate: .008,
		density: .55,
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
		attitude: false
	};
}
function loadSim() {
	const s = defaultSim();
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return s;
		const d = JSON.parse(raw);
		if (typeof d.density === "number") s.density = clamp$1(d.density, .12, 1);
		if (typeof d.sensitivity === "number") s.sensitivity = clamp$1(d.sensitivity, .3, 2.4);
		if (typeof d.relativity === "boolean") s.relativity = d.relativity;
		if (typeof d.showConstellations === "boolean") s.showConstellations = d.showConstellations;
		if (typeof d.showLabels === "boolean") s.showLabels = d.showLabels;
		if (typeof d.showGrid === "boolean") s.showGrid = d.showGrid;
		if (typeof d.inertial === "boolean") s.inertial = d.inertial;
		if (typeof d.cruisePhi === "number") {
			s.cruisePhi = clamp$1(d.cruisePhi, 0, 5);
			s.rapidity = s.cruisePhi;
		}
		if (typeof d.yaw === "number") s.yaw = d.yaw;
		if (typeof d.pitch === "number") s.pitch = clamp$1(d.pitch, -1.45, 1.45);
		if (typeof d.epochYear === "number") s.epochYear = clamp$1(d.epochYear, -12e3, 12e3);
		if (Array.isArray(d.pos) && d.pos.length === 3) s.pos = [
			d.pos[0] ?? 0,
			d.pos[1] ?? 0,
			d.pos[2] ?? 0
		];
		if (typeof d.timeRate === "number") s.timeRate = clamp$1(d.timeRate, 0, 2);
		if (typeof d.observerMass === "number") s.observerMass = clamp$1(d.observerMass, 0, 1e9);
		if (Array.isArray(d.massAnchor) && d.massAnchor.length === 3 && s.observerMass > 0) s.massAnchor = [
			d.massAnchor[0] ?? 0,
			d.massAnchor[1] ?? 0,
			d.massAnchor[2] ?? 0
		];
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
	} catch {}
	return s;
}
function saveSim(s) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({
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
			massAnchor: s.massAnchor
		}));
	} catch {}
}
function stepSim(s, a, dt) {
	const sens = .0022 * s.sensitivity;
	const turn = 1.35 * dt;
	const userLook = Math.abs(a.lookDx) > .2 || Math.abs(a.lookDy) > .2 || Math.abs(a.yaw) > .01 || Math.abs(a.pitch) > .01 || Math.abs(a.roll) > .01;
	const integrateLook = (decayRoll) => {
		s.yaw -= a.lookDx * sens;
		s.pitch = clamp$1(s.pitch - a.lookDy * sens, -1.45, 1.45);
		s.yaw += a.yaw * turn;
		s.pitch = clamp$1(s.pitch + a.pitch * turn, -1.45, 1.45);
		s.roll += a.roll * .9 * dt;
		if (decayRoll) s.roll *= Math.pow(.12, dt);
	};
	if (s.attitude && attitudeReady()) {
		if (userLook || !attitudeCalibrated()) {
			integrateLook(false);
			calibrateAttitude(s);
		} else if (!applyAttitude(s)) calibrateAttitude(s);
	} else integrateLook(true);
	s.cruisePhi = clamp$1(s.cruisePhi + a.throttle * 1.6 * dt, 0, 4.8);
	const boostTarget = a.boost ? s.cruisePhi + 2.35 : s.cruisePhi;
	const k = a.boost ? 3.4 : 2.2;
	s.rapidity += (boostTarget - s.rapidity) * (1 - Math.exp(-k * dt));
	s.boost = a.boost;
	const look = lookDirFromYawPitch(s.yaw, s.pitch);
	if (s.inertial) s.velDir = lookDirFromYawPitch(s.velYaw, s.velPitch);
	else {
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
		s.properYears += years * grav / Math.max(gamma, 1);
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
function lookAtPoint(s, x, y, z) {
	const dx = x - s.pos[0];
	const dy = y - s.pos[1];
	const dz = z - s.pos[2];
	const n = Math.hypot(dx, dy, dz) || 1;
	const dir = [
		dx / n,
		dy / n,
		dz / n
	];
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
function coastStep(lens, beta, years, dt) {
	let step = beta * years;
	if (!lens) return step;
	const scale = Math.max(lens.massRs, lens.radius);
	if (scale <= 0) return step;
	return Math.min(step, scale * .65 * dt);
}
function sinkToward(s, lens, dt) {
	const dx = lens.pos[0] - s.pos[0];
	const dy = lens.pos[1] - s.pos[1];
	const dz = lens.pos[2] - s.pos[2];
	const r = Math.hypot(dx, dy, dz);
	const scale = Math.max(lens.massRs, lens.radius, 1e-18);
	const pull = Math.min(r * .45, scale * .2) * dt;
	if (r < 1e-12 || pull <= 0) return;
	s.pos[0] += dx / r * pull;
	s.pos[1] += dy / r * pull;
	s.pos[2] += dz / r * pull;
}
/** Park a Schwarzschild mass ahead of the camera. Bigger masses subtend a larger shadow. */
function setObserverMass(s, mass) {
	const m = clamp$1(mass, 0, 1e9);
	s.observerMass = m;
	if (m <= .05) {
		s.observerMass = 0;
		s.massAnchor = null;
		return;
	}
	if (!s.massAnchor) s.massAnchor = [
		s.pos[0],
		s.pos[1],
		s.pos[2]
	];
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
function lookAtStar(s, name) {
	const star = byName.get(name);
	if (!star) return;
	const d = Math.max(star.dist, .01);
	const p = raDecDistToThree(star.ra, star.dec, d);
	const dx = p[0] - s.pos[0];
	const dy = p[1] - s.pos[1];
	const dz = p[2] - s.pos[2];
	const n = Math.hypot(dx, dy, dz) || 1;
	const yp = yawPitchFromDir(dx / n, dy / n, dz / n);
	s.yaw = yp.yaw;
	s.pitch = yp.pitch;
}
var _vel = new Vector3();
var _obs = new Vector3();
var _euler = new Euler(0, 0, 0, "YXZ");
function createEngine(canvas, sim) {
	const input = createInput();
	const renderer = new WebGLRenderer({
		canvas,
		antialias: false,
		alpha: false,
		powerPreference: "high-performance",
		stencil: false,
		depth: true
	});
	renderer.setClearColor(131848, 1);
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.setPixelRatio(pixelRatio());
	renderer.sortObjects = false;
	const scene = new Scene();
	const camera = new PerspectiveCamera(72, 1, .05, 8e3);
	camera.rotation.order = "YXZ";
	const stars = buildStarField();
	const starGeo = new BufferGeometry();
	starGeo.setAttribute("position", new BufferAttribute(stars.pos, 3));
	starGeo.setAttribute("aMag", new BufferAttribute(stars.mag, 1));
	starGeo.setAttribute("aBv", new BufferAttribute(stars.bv, 1));
	starGeo.setAttribute("aPm", new BufferAttribute(stars.pm, 2));
	starGeo.setAttribute("aExt", new BufferAttribute(stars.ext, 1));
	starGeo.setDrawRange(0, densityToCount(sim.density));
	starGeo.computeBoundingSphere();
	const starUniforms = {
		uObserver: { value: new Vector3() },
		uYear: { value: sim.epochYear },
		uBeta: { value: 0 },
		uVelDir: { value: new Vector3(0, 0, -1) },
		uPixelRatio: { value: pixelRatio() },
		uTrail: { value: 0 },
		uRelativity: { value: 1 },
		uFovBoost: { value: 0 },
		uLensPos: { value: new Vector3() },
		uLensRs: { value: 0 },
		uLensRadius: { value: 0 },
		uLensGrav: { value: 1 },
		uInside: { value: 0 },
		uLensEdge: { value: 0 },
		uSecondary: { value: 0 }
	};
	const starMat = new ShaderMaterial({
		vertexShader: STAR_VERT,
		fragmentShader: STAR_FRAG,
		uniforms: starUniforms,
		transparent: true,
		depthWrite: false,
		depthTest: false,
		blending: 2,
		toneMapped: false
	});
	const starPoints = new Points(starGeo, starMat);
	starPoints.frustumCulled = false;
	scene.add(starPoints);
	const starUniformsB = {
		uObserver: { value: new Vector3() },
		uYear: { value: sim.epochYear },
		uBeta: { value: 0 },
		uVelDir: { value: new Vector3(0, 0, -1) },
		uPixelRatio: { value: pixelRatio() },
		uTrail: { value: 0 },
		uRelativity: { value: 1 },
		uFovBoost: { value: 0 },
		uLensPos: { value: new Vector3() },
		uLensRs: { value: 0 },
		uLensRadius: { value: 0 },
		uLensGrav: { value: 1 },
		uInside: { value: 0 },
		uLensEdge: { value: 0 },
		uSecondary: { value: 1 }
	};
	const starMatB = new ShaderMaterial({
		vertexShader: STAR_VERT,
		fragmentShader: STAR_FRAG,
		uniforms: starUniformsB,
		transparent: true,
		depthWrite: false,
		depthTest: false,
		blending: 2,
		toneMapped: false
	});
	const starPointsB = new Points(starGeo, starMatB);
	starPointsB.frustumCulled = false;
	starPointsB.visible = false;
	scene.add(starPointsB);
	const isCoarse = matchMedia("(pointer: coarse)").matches || innerWidth < 700;
	const dustBox = 48;
	const dust = buildDust(isCoarse ? 4200 : 7800, dustBox);
	const dustGeo = new BufferGeometry();
	dustGeo.setAttribute("position", new BufferAttribute(dust.pos, 3));
	dustGeo.setAttribute("aSeed", new BufferAttribute(dust.seed, 1));
	const dustUniforms = {
		uVelDir: { value: new Vector3(0, 0, -1) },
		uTravel: { value: 0 },
		uBox: { value: dustBox },
		uPixelRatio: { value: pixelRatio() },
		uTrail: { value: 0 },
		uBeta: { value: 0 },
		uRelativity: { value: 1 },
		uLensDim: { value: 0 }
	};
	const dustMat = new ShaderMaterial({
		vertexShader: DUST_VERT,
		fragmentShader: DUST_FRAG,
		uniforms: dustUniforms,
		transparent: true,
		depthWrite: false,
		depthTest: false,
		blending: 2,
		toneMapped: false
	});
	const dustPoints = new Points(dustGeo, dustMat);
	dustPoints.frustumCulled = false;
	scene.add(dustPoints);
	const lines = buildConstellationPositions();
	const lineGeo = new BufferGeometry();
	lineGeo.setAttribute("position", new BufferAttribute(lines.positions, 3));
	const lineUniforms = {
		uObserver: { value: new Vector3() },
		uBeta: { value: 0 },
		uVelDir: { value: new Vector3(0, 0, -1) },
		uRelativity: { value: 1 },
		uYear: { value: sim.epochYear },
		uColor: { value: new Color(10399940) },
		uLensPos: { value: new Vector3() },
		uLensRs: { value: 0 },
		uInside: { value: 0 }
	};
	const lineMat = new ShaderMaterial({
		vertexShader: LINE_VERT,
		fragmentShader: LINE_FRAG,
		uniforms: lineUniforms,
		transparent: true,
		depthWrite: false,
		depthTest: false,
		blending: 2,
		toneMapped: false
	});
	const lineMesh = new LineSegments(lineGeo, lineMat);
	lineMesh.frustumCulled = false;
	scene.add(lineMesh);
	const gridPos = buildGridPositions();
	const gridGeo = new BufferGeometry();
	gridGeo.setAttribute("position", new BufferAttribute(gridPos, 3));
	const gridUniforms = {
		uObserver: { value: new Vector3() },
		uBeta: { value: 0 },
		uVelDir: { value: new Vector3(0, 0, -1) },
		uRelativity: { value: 1 },
		uYear: { value: sim.epochYear },
		uColor: { value: new Color(2765636) },
		uLensPos: { value: new Vector3() },
		uLensRs: { value: 0 },
		uInside: { value: 0 }
	};
	const gridMat = new ShaderMaterial({
		vertexShader: LINE_VERT,
		fragmentShader: LINE_FRAG,
		uniforms: gridUniforms,
		transparent: true,
		depthWrite: false,
		depthTest: false,
		blending: 2,
		toneMapped: false
	});
	const gridMesh = new LineSegments(gridGeo, gridMat);
	gridMesh.frustumCulled = false;
	gridMesh.visible = sim.showGrid;
	scene.add(gridMesh);
	const warpGeo = new BufferGeometry();
	warpGeo.setAttribute("position", new BufferAttribute(new Float32Array([
		-1,
		-1,
		0,
		3,
		-1,
		0,
		-1,
		3,
		0
	]), 3));
	warpGeo.setAttribute("uv", new BufferAttribute(new Float32Array([
		0,
		0,
		2,
		0,
		0,
		2
	]), 2));
	const warpUniforms = {
		uBoost: { value: 0 },
		uTime: { value: 0 },
		uAspect: { value: 1 }
	};
	const warpMat = new ShaderMaterial({
		vertexShader: WARP_VERT,
		fragmentShader: WARP_FRAG,
		uniforms: warpUniforms,
		transparent: true,
		depthWrite: false,
		depthTest: false,
		blending: 2,
		toneMapped: false
	});
	const warpMesh = new Mesh(warpGeo, warpMat);
	warpMesh.frustumCulled = false;
	scene.add(warpMesh);
	const bodyGeo = new PlaneGeometry(1, 1);
	const bodyUniforms = {
		uKind: { value: 0 },
		uHalf: { value: .2 },
		uEdge: { value: .1 },
		uTime: { value: 0 }
	};
	const bodyMat = new ShaderMaterial({
		vertexShader: BODY_VERT,
		fragmentShader: BODY_FRAG,
		uniforms: bodyUniforms,
		transparent: true,
		depthWrite: false,
		depthTest: false,
		blending: 1,
		side: 2,
		toneMapped: false
	});
	const bodyMesh = new Mesh(bodyGeo, bodyMat);
	bodyMesh.frustumCulled = false;
	bodyMesh.visible = false;
	scene.add(bodyMesh);
	const veilGeo = new BufferGeometry();
	veilGeo.setAttribute("position", new BufferAttribute(new Float32Array([
		-1,
		-1,
		0,
		3,
		-1,
		0,
		-1,
		3,
		0
	]), 3));
	veilGeo.setAttribute("uv", new BufferAttribute(new Float32Array([
		0,
		0,
		2,
		0,
		0,
		2
	]), 2));
	const veilUniforms = {
		uTime: { value: 0 },
		uKind: { value: 0 }
	};
	const veilMat = new ShaderMaterial({
		vertexShader: INTERIOR_VERT,
		fragmentShader: INTERIOR_FRAG,
		uniforms: veilUniforms,
		depthWrite: false,
		depthTest: false,
		toneMapped: false
	});
	const veilMesh = new Mesh(veilGeo, veilMat);
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
	function tick(now) {
		if (!running) return;
		const dt = Math.min((now - last) / 1e3, .1);
		last = now;
		fpsEma = fpsEma * .92 + (dt > 0 ? 1 / dt : 60) * .08;
		if (fpsEma < 48 && dprCap > 1.1) {
			dprCap = Math.max(1, dprCap - .15);
			renderer.setPixelRatio(dprCap);
			starUniforms.uPixelRatio.value = dprCap;
			dustUniforms.uPixelRatio.value = dprCap;
			starUniformsB.uPixelRatio.value = dprCap;
		}
		stepSim(sim, input.sample(), dt);
		const beta = betaFromPhi(sim.rapidity);
		const trail = Math.min(1, Math.pow(beta, 1.35) * 1.15 + (sim.boost ? .2 : 0));
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
		const lens = dominantLens(_obs.toArray(), sim);
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
		dustUniforms.uLensDim.value = trapped ? 1 : lens ? Math.min(1, Math.max(0, (lens.edgeAngle - .02) / .1)) : 0;
		lineUniforms.uLensPos.value.copy(starUniforms.uLensPos.value);
		lineUniforms.uLensRs.value = rs;
		lineUniforms.uInside.value = inside;
		gridUniforms.uLensRs.value = 0;
		gridUniforms.uInside.value = inside;
		const look = lookDirFromYawPitch(sim.yaw, sim.pitch);
		const impostor = 40;
		if (lens && !trapped && lens.edgeAngle > .006 && look[0] * (lens.pos[0] - sim.pos[0]) + look[1] * (lens.pos[1] - sim.pos[1]) + look[2] * (lens.pos[2] - sim.pos[2]) > 0) {
			const dx = lens.pos[0] - sim.pos[0];
			const dy = lens.pos[1] - sim.pos[1];
			const dz = lens.pos[2] - sim.pos[2];
			const dl = Math.hypot(dx, dy, dz) || 1;
			bodyMesh.position.set(dx / dl * impostor, dy / dl * impostor, dz / dl * impostor);
			bodyMesh.quaternion.copy(camera.quaternion);
			const half = Math.min(1.05, lens.edgeAngle * (lens.kind === 0 ? 1.95 : 1.22));
			const span = 80 * Math.tan(half);
			bodyMesh.scale.set(span, span, 1);
			bodyUniforms.uKind.value = lens.kind;
			bodyUniforms.uHalf.value = half;
			bodyUniforms.uEdge.value = lens.edgeAngle;
			bodyUniforms.uTime.value = now * .001;
			bodyMesh.visible = true;
		} else bodyMesh.visible = false;
		veilMesh.visible = trapped;
		veilUniforms.uTime.value = now * .001;
		veilUniforms.uKind.value = lens?.inside ? 0 : lens?.kind ?? 0;
		lineUniforms.uObserver.value.copy(_obs);
		lineUniforms.uBeta.value = beta;
		lineUniforms.uVelDir.value.copy(_vel);
		lineUniforms.uRelativity.value = sim.relativity ? 1 : 0;
		lineUniforms.uYear.value = sim.epochYear;
		lineMesh.visible = sim.showConstellations && !(lens && !trapped && lens.edgeAngle > .1);
		gridUniforms.uObserver.value.set(0, 0, 0);
		gridUniforms.uBeta.value = beta;
		gridUniforms.uVelDir.value.copy(_vel);
		gridUniforms.uRelativity.value = sim.relativity ? 1 : 0;
		gridMesh.visible = sim.showGrid;
		const warpTarget = sim.boost ? Math.min(1, beta * 1.4) : Math.max(0, beta - .85) * 2;
		warpUniforms.uBoost.value += (warpTarget - warpUniforms.uBoost.value) * (1 - Math.exp(-6 * dt));
		warpUniforms.uTime.value = now * .001;
		renderer.render(scene, camera);
	}
	renderer.setAnimationLoop(tick);
	function setDensity(d) {
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
	return {
		canvas,
		sim,
		input,
		dispose,
		setDensity
	};
}
function pixelRatio() {
	const coarse = matchMedia("(pointer: coarse)").matches || innerWidth < 700;
	return Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.75);
}
function Hud({ sim, engine, onBoostChange, boostHeld }) {
	const [, tick] = (0, import_react.useState)(0);
	const [chart, setChart] = (0, import_react.useState)(false);
	const [help, setHelp] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => tick((n) => n + 1), 90);
		return () => window.clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		const t = window.setTimeout(() => setHelp(false), 7e3);
		return () => window.clearTimeout(t);
	}, []);
	const beta = betaFromPhi(sim.rapidity);
	const gamma = gammaFromPhi(sim.rapidity);
	const dir = lookDirFromYawPitch(sim.yaw, sim.pitch);
	const poseHint = attitudeHint();
	function toggleAttitude() {
		(async () => {
			if (sim.attitude) {
				sim.attitude = false;
				disableAttitude();
				return;
			}
			sim.attitude = await enableAttitude();
		})();
	}
	const ax = -dir[2];
	const ay = dir[0];
	const az = dir[1];
	const ra = (Math.atan2(ay, ax) * 180 / Math.PI + 360) % 360;
	const dec = Math.atan2(az, Math.hypot(ax, ay)) * 180 / Math.PI;
	const near = nearestCatalog(dir[0], dir[1], dir[2], sim.pos[0], sim.pos[1], sim.pos[2]);
	const lens = dominantLens(sim.pos, sim);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(2,3,8,0.55)]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-1/2 top-1/2 crosshair -translate-x-1/2 -translate-y-1/2 opacity-70" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "absolute top-0 left-0 right-0 flex items-start justify-between gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl italic leading-none tracking-tight text-ink sm:text-3xl",
					children: "Sidereal"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-[11px] tracking-[0.28em] text-mute uppercase",
					children: "天穹"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right font-mono text-[11px] leading-5 text-mute tabular-nums",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["β ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-ink",
							children: formatBeta(beta)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["γ ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-ink",
							children: formatGamma(gamma)
						})] }),
						lens && !lens.inside && lens.timeFactor < .995 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["g ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-ink",
							children: lens.timeFactor.toFixed(3)
						})] }) : null,
						lens && !lens.inside && !lens.embedded && lens.edgeAngle > .02 && lens.kind === 0 && lens.massRs > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["r ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-ink",
							children: [(lens.dist / lens.massRs).toFixed(1), " Rs"]
						})] }) : null,
						lens && !lens.inside && !lens.embedded && lens.edgeAngle > .02 && lens.kind !== 0 && lens.radius > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["r ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-ink",
							children: [(lens.dist / lens.radius).toFixed(1), " R"]
						})] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["τ ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-ink",
							children: [sim.properYears.toFixed(4), " y"]
						})] })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute top-16 right-4 hidden text-right font-mono text-[11px] leading-5 text-mute tabular-nums sm:block sm:top-20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-accent",
						children: formatRA(ra)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: formatDec(dec) }),
					lens && lens.edgeAngle > .04 && !lens.inside ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-ink",
						children: lens.zh
					}) : near ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-ink",
						children: [near.zh, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-1 text-faint",
							children: near.name
						})]
					}) : null,
					lens && lens.edgeAngle > .04 ? null : near ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-faint",
						children: near.conZh
					}) : null
				]
			}),
			lens?.inside ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-none absolute top-1/2 left-1/2 w-[min(92vw,22rem)] -translate-x-1/2 translate-y-8 text-center text-[12px] tracking-[0.22em] text-ember uppercase",
				children: "视界之内"
			}) : null,
			help && !sim.started && sim.hudVisible && !poseHint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-none absolute bottom-28 left-1/2 w-[min(92vw,24rem)] -translate-x-1/2 text-center text-[11px] leading-5 text-mute sm:bottom-32",
				children: "拖动转向 · 姿态跟手机 · 滚轮或 W S 调速 · L 星名 · 空格跃迁"
			}) : null,
			poseHint && sim.hudVisible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-none absolute bottom-28 left-1/2 w-[min(92vw,24rem)] -translate-x-1/2 text-center text-[11px] leading-5 text-mute sm:bottom-32",
				children: poseHint
			}) : null,
			sim.hudVisible ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [chart ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-auto absolute z-20 bottom-[5.5rem] left-3 right-3 max-h-[min(62vh,32rem)] overflow-y-auto rounded-xl p-3 hud-panel sm:bottom-auto sm:left-4 sm:right-auto sm:top-24 sm:w-[20.5rem] sm:rounded-2xl sm:p-4",
				"data-ui": true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chart, {
					sim,
					poseHint,
					onAttitude: toggleAttitude,
					onClose: () => setChart(false)
				})
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "pointer-events-auto absolute right-0 bottom-0 left-0 flex items-end justify-between gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 flex-1 items-end gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "航图",
							active: chart,
							onClick: () => setChart((v) => !v),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map$1, {
								className: "size-4",
								strokeWidth: 1.75
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "星名",
							active: sim.showLabels,
							onClick: () => {
								sim.showLabels = !sim.showLabels;
								saveSim(sim);
							},
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, {
								className: "size-4",
								strokeWidth: 1.75
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "姿态",
							active: sim.attitude,
							onClick: toggleAttitude,
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, {
								className: "size-4",
								strokeWidth: 1.75
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hud-panel min-w-0 flex-1 rounded-xl px-3 py-2 sm:max-w-md sm:rounded-2xl sm:px-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "速度",
								value: formatBeta(beta),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "hud-slider mt-2 w-full",
									type: "range",
									suppressHydrationWarning: true,
									min: 0,
									max: 4.6,
									step: .01,
									value: sim.cruisePhi,
									"aria-label": "速度",
									onChange: (e) => {
										const v = Number(e.target.value);
										sim.cruisePhi = v;
										if (!sim.boost) sim.rapidity = v;
									}
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
								label: "密度",
								value: `${Math.round(sim.density * 100)}%`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "hud-slider mt-2 w-full",
									type: "range",
									suppressHydrationWarning: true,
									min: .12,
									max: 1,
									step: .01,
									value: sim.density,
									"aria-label": "星体密度",
									onChange: (e) => engine?.setDensity(Number(e.target.value))
								})
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					"data-ui": true,
					"aria-pressed": boostHeld,
					"aria-label": "加速",
					onPointerDown: () => onBoostChange(true),
					onPointerUp: () => onBoostChange(false),
					onPointerCancel: () => onBoostChange(false),
					onPointerLeave: () => onBoostChange(false),
					className: `flex size-14 shrink-0 flex-col items-center justify-center rounded-full border text-[10px] tracking-widest transition-transform duration-150 ease-out active:scale-[0.98] sm:size-16 ${boostHeld ? "border-accent bg-ink text-void" : "border-line bg-surface text-ink"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, {
						className: "size-4",
						strokeWidth: 1.75
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-0.5",
						children: "加速"
					})]
				})]
			})] }) : null
		]
	});
}
function Row({ label, value, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block py-1 first:pt-0 last:pb-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-baseline justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] tracking-[0.18em] text-mute uppercase",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-[11px] text-ink tabular-nums",
				children: value
			})]
		}), children]
	});
}
function IconBtn({ label, icon, onClick, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"data-ui": true,
		onClick,
		"aria-label": label,
		className: `flex size-11 shrink-0 flex-col items-center justify-center rounded-xl border text-[9px] tracking-wider transition-colors duration-150 sm:size-12 sm:rounded-2xl ${active ? "border-accent bg-raised text-ink" : "border-line bg-surface text-mute"}`,
		children: icon
	});
}
function Chart({ sim, onClose, onAttitude, poseHint }) {
	const gal = threeToGalacticXyz(sim.pos[0], sim.pos[1], sim.pos[2]);
	const lb = xyzToGalacticLb(gal[0], gal[1], gal[2]);
	function setGal(i, v) {
		const next = [
			gal[0],
			gal[1],
			gal[2]
		];
		next[i] = v;
		const t = galacticXyzToThree(next[0], next[1], next[2]);
		sim.pos[0] = t[0];
		sim.pos[1] = t[1];
		sim.pos[2] = t[2];
		saveSim(sim);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-[0.22em] text-mute uppercase",
				children: "航图"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-xs text-faint hover:text-ink",
				onClick: onClose,
				children: "收起"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mb-2 flex items-center gap-1.5 text-[11px] text-mute",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Orbit, {
				className: "size-3.5",
				strokeWidth: 1.75
			}), "银心直角坐标系 / 光年"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-3 gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
					label: "X",
					value: gal[0],
					onChange: (v) => setGal(0, v)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
					label: "Y",
					value: gal[1],
					onChange: (v) => setGal(1, v)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
					label: "Z",
					value: gal[2],
					onChange: (v) => setGal(2, v)
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-2 font-mono text-[11px] text-faint tabular-nums",
			children: [
				"l ",
				lb.l.toFixed(2),
				"° · b ",
				lb.b.toFixed(2),
				"° · ",
				formatLy(lb.dist)
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] tracking-[0.18em] text-mute uppercase",
				children: "年代"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "hud-slider min-w-0 flex-1",
					type: "range",
					suppressHydrationWarning: true,
					min: -8e3,
					max: 8e3,
					step: 1,
					value: sim.epochYear,
					"aria-label": "年代",
					onChange: (e) => {
						sim.epochYear = Number(e.target.value);
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-16 text-right font-mono text-[11px] tabular-nums",
					children: sim.epochYear.toFixed(0)
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] tracking-[0.18em] text-mute uppercase",
				children: "时间流速"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "hud-slider min-w-0 flex-1",
					type: "range",
					suppressHydrationWarning: true,
					min: 0,
					max: 1.2,
					step: .002,
					value: sim.timeRate,
					"aria-label": "时间流速",
					onChange: (e) => {
						sim.timeRate = Number(e.target.value);
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "w-16 text-right font-mono text-[11px] tabular-nums",
					children: [sim.timeRate.toFixed(3), " y/s"]
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] tracking-[0.18em] text-mute uppercase",
				children: "灵敏度"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "hud-slider mt-2 w-full",
				type: "range",
				suppressHydrationWarning: true,
				min: .35,
				max: 2.2,
				step: .01,
				value: sim.sensitivity,
				"aria-label": "灵敏度",
				onChange: (e) => {
					sim.sensitivity = Number(e.target.value);
				}
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 mb-2 text-[10px] tracking-[0.18em] text-mute uppercase",
			children: "观察点"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap gap-1.5",
			children: PRESETS.filter((p) => p.group !== "wonder").map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "rounded-md border border-line bg-raised px-2 py-1 text-[11px] text-mute hover:text-ink",
				onClick: () => {
					sim.observerMass = 0;
					sim.massAnchor = null;
					sim.pos[0] = p.x;
					sim.pos[1] = p.y;
					sim.pos[2] = p.z;
					if (p.lookAt) lookAtPoint(sim, p.lookAt[0], p.lookAt[1], p.lookAt[2]);
					else if (p.look) lookAtStar(sim, p.look);
					saveSim(sim);
				},
				children: p.zh
			}, p.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 mb-2 text-[10px] tracking-[0.18em] text-mute uppercase",
			children: "奇观"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap gap-1.5",
			children: PRESETS.filter((p) => p.group === "wonder").map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "rounded-md border border-line bg-raised px-2 py-1 text-[11px] text-mute hover:text-ink",
				onClick: () => {
					sim.observerMass = 0;
					sim.massAnchor = null;
					sim.pos[0] = p.x;
					sim.pos[1] = p.y;
					sim.pos[2] = p.z;
					sim.rapidity = 0;
					sim.cruisePhi = 0;
					sim.boost = false;
					if (p.lookAt) lookAtPoint(sim, p.lookAt[0], p.lookAt[1], p.lookAt[2]);
					else if (p.look) lookAtStar(sim, p.look);
					saveSim(sim);
				},
				children: p.zh
			}, p.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] tracking-[0.18em] text-mute uppercase",
				children: "观察点质量"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "hud-slider min-w-0 flex-1",
					type: "range",
					suppressHydrationWarning: true,
					min: 0,
					max: 1,
					step: .002,
					value: sliderFromMass(sim.observerMass),
					"aria-label": "观察点质量",
					onChange: (e) => {
						setObserverMass(sim, massFromSlider(Number(e.target.value)));
						saveSim(sim);
					}
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-16 text-right font-mono text-[11px] tabular-nums",
					children: formatMass(sim.observerMass)
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 mb-2 text-[10px] tracking-[0.18em] text-mute uppercase",
			children: "对准"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-wrap gap-1.5",
			children: [
				"Sirius",
				"Vega",
				"Betelgeuse",
				"Polaris",
				"Antares",
				"Deneb",
				"Rigil Kentaurus"
			].map((name) => {
				const s = CATALOG.find((c) => c.name === name);
				if (!s) return null;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "rounded-md border border-line px-2 py-1 text-[11px] text-mute hover:text-ink",
					onClick: () => lookAtStar(sim, name),
					children: s.zh
				}, name);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid grid-cols-2 gap-1.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, {
						className: "size-3.5",
						strokeWidth: 1.75
					}),
					label: "相对论",
					on: sim.relativity,
					onClick: () => {
						sim.relativity = !sim.relativity;
						saveSim(sim);
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, {
						className: "size-3.5",
						strokeWidth: 1.75
					}),
					label: "星座",
					on: sim.showConstellations,
					onClick: () => {
						sim.showConstellations = !sim.showConstellations;
						saveSim(sim);
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Type, {
						className: "size-3.5",
						strokeWidth: 1.75
					}),
					label: "星名",
					on: sim.showLabels,
					onClick: () => {
						sim.showLabels = !sim.showLabels;
						saveSim(sim);
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, {
						className: "size-3.5",
						strokeWidth: 1.75
					}),
					label: "赤经网",
					on: sim.showGrid,
					onClick: () => {
						sim.showGrid = !sim.showGrid;
						saveSim(sim);
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
						className: "size-3.5",
						strokeWidth: 1.75
					}),
					label: "惯性指向",
					on: sim.inertial,
					onClick: () => {
						sim.inertial = !sim.inertial;
						sim.velYaw = sim.yaw;
						sim.velPitch = sim.pitch;
						saveSim(sim);
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, {
						className: "size-3.5",
						strokeWidth: 1.75
					}),
					label: "姿态",
					on: sim.attitude,
					onClick: onAttitude
				})
			]
		}),
		poseHint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-[10px] leading-4 text-faint",
			children: poseHint
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-[10px] leading-4 text-faint",
			children: "相对论开启后，高速会把星光集中到航向前方。奇观把你停在黑洞、中子星或巨星跟前：背景星弯向爱因斯坦环，黑洞中心是视界和吸积盘。把速度推高会缓慢落进去。观察点质量越大，前方黑洞的张角越大。姿态开启后，手机屏幕是窗口：左转看左，后仰看天。"
		})
	] });
}
function Toggle({ label, on, onClick, icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: `flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[11px] ${on ? "border-accent/40 bg-raised text-ink" : "border-line text-mute"}`,
		children: [icon, label]
	});
}
function Num({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[10px] text-faint",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "number",
			step: .1,
			suppressHydrationWarning: true,
			value: Number(value.toFixed(3)),
			onChange: (e) => onChange(Number(e.target.value)),
			className: "mt-1 h-9 w-full rounded-md border border-line bg-void px-2 font-mono text-[12px] text-ink tabular-nums outline-none focus:border-accent"
		})]
	});
}
var BODIES = (() => {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const s of CATALOG) {
		if (s.name === "Sol" || seen.has(s.name)) continue;
		seen.add(s.name);
		const dist0 = Math.max(s.dist, .01);
		out.push({
			name: s.name,
			text: s.zh && s.zh !== "—" ? s.zh : s.name,
			mag: s.mag,
			dist0,
			pos: raDecDistToThree(s.ra, s.dec, dist0),
			pmRa: s.pmRa,
			pmDec: s.pmDec
		});
	}
	return out;
})();
var euler = new Euler(0, 0, 0, "YXZ");
var quat = new Quaternion();
var inv = new Quaternion();
var cam = new Vector3();
var sticky = /* @__PURE__ */ new Set();
function cross(a, b) {
	return [
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0]
	];
}
function pmDisplace(pos, pmRa, pmDec, year) {
	const dist = Math.hypot(pos[0], pos[1], pos[2]);
	if (dist < 1e-4 || pmRa === 0 && pmDec === 0) return pos;
	const dir = [
		pos[0] / dist,
		pos[1] / dist,
		pos[2] / dist
	];
	const rad = 4.848136811e-9 * (year - 2e3);
	let east = cross([
		0,
		1,
		0
	], dir);
	const el = Math.hypot(east[0], east[1], east[2]);
	if (el < 1e-6) return pos;
	east = [
		east[0] / el,
		east[1] / el,
		east[2] / el
	];
	const north = cross(dir, east);
	const dx = dir[0] + (east[0] * pmRa + north[0] * pmDec) * rad;
	const dy = dir[1] + (east[1] * pmRa + north[1] * pmDec) * rad;
	const dz = dir[2] + (east[2] * pmRa + north[2] * pmDec) * rad;
	const n = Math.hypot(dx, dy, dz) || 1;
	return [
		dx / n * dist,
		dy / n * dist,
		dz / n * dist
	];
}
function textWidth(text) {
	let w = 0;
	for (const ch of text) w += ch.charCodeAt(0) > 255 ? 12 : 6.5;
	return w + 2;
}
function overlaps(a, b, pad) {
	return !(a.x + a.w + pad < b.x || b.x + b.w + pad < a.x || a.y + a.h + pad < b.y || b.y + b.h + pad < a.y);
}
function project(dir, sim, width, height) {
	euler.set(sim.pitch, sim.yaw, sim.roll, "YXZ");
	quat.setFromEuler(euler);
	inv.copy(quat).invert();
	cam.set(dir[0], dir[1], dir[2]).applyQuaternion(inv);
	if (cam.z > -1e-4) return null;
	const aspect = width / Math.max(height, 1);
	const f = 1 / Math.tan(sim.fov * Math.PI / 360);
	const ndcX = f / aspect * (cam.x / -cam.z);
	const ndcY = f * (cam.y / -cam.z);
	if (ndcX < -1.02 || ndcX > 1.02 || ndcY < -1.02 || ndcY > 1.02) return null;
	return {
		x: (ndcX * .5 + .5) * width,
		y: (1 - (ndcY * .5 + .5)) * height
	};
}
function layoutStarLabels(sim, width, height) {
	if (width < 8 || height < 8) return [];
	const beta = betaFromPhi(sim.rapidity);
	const useRel = sim.relativity && beta > 1e-5;
	const lens = dominantLens(sim.pos, sim);
	if (lens?.inside || lens?.embedded) return [];
	const obs = sim.pos;
	const vel = sim.velDir;
	const candidates = [];
	for (const body of BODIES) {
		const p = pmDisplace(body.pos, body.pmRa, body.pmDec, sim.epochYear);
		const rx = p[0] - obs[0];
		const ry = p[1] - obs[1];
		const rz = p[2] - obs[2];
		const dist = Math.hypot(rx, ry, rz);
		if (dist < .05) continue;
		let dir = [
			rx / dist,
			ry / dist,
			rz / dist
		];
		if (sourceBehindLens(p, obs, lens)) dir = lensDirection(dir, obs, lens);
		let mag = body.mag + 5 * Math.log10(dist / body.dist0);
		if (useRel) {
			const D = dopplerFactor(dir, vel, beta);
			mag -= 2.5 * Math.log10(Math.max(D, .05) ** 3);
			dir = aberrateDir(dir, vel, beta);
		}
		if (lens && lens.edgeAngle > .008) {
			const lx = lens.pos[0] - obs[0];
			const ly = lens.pos[1] - obs[1];
			const lz = lens.pos[2] - obs[2];
			const ln = Math.hypot(lx, ly, lz) || 1;
			if ((dir[0] * lx + dir[1] * ly + dir[2] * lz) / ln > Math.cos(lens.edgeAngle * .98)) continue;
		}
		if (mag > 5.6) continue;
		const screen = project(dir, sim, width, height);
		if (!screen) continue;
		if (screen.x < 6 || screen.y < 6 || screen.x > width - 6 || screen.y > height - 6) continue;
		const nx = (screen.x / width - .5) * 2;
		const ny = (screen.y / height - .5) * 2;
		const centerBias = Math.hypot(nx, ny) * .35;
		const stick = sticky.has(body.name) ? -.45 : 0;
		candidates.push({
			name: body.name,
			text: body.text,
			mag: mag + centerBias + stick,
			sx: screen.x,
			sy: screen.y
		});
	}
	if (lens && lens.edgeAngle > .01) {
		const dx = lens.pos[0] - obs[0];
		const dy = lens.pos[1] - obs[1];
		const dz = lens.pos[2] - obs[2];
		const n = Math.hypot(dx, dy, dz) || 1;
		const screen = project([
			dx / n,
			dy / n,
			dz / n
		], sim, width, height);
		if (screen) {
			const radiusPx = Math.tan(lens.edgeAngle) / Math.tan(sim.fov * Math.PI / 360) * (height * .5);
			candidates.push({
				name: lens.name,
				text: lens.zh,
				mag: -1.2,
				sx: screen.x,
				sy: screen.y - radiusPx * 1.14 - 16
			});
		}
	}
	candidates.sort((a, b) => a.mag - b.mag || (a.name < b.name ? -1 : 1));
	const placed = [];
	const blocked = [
		{
			x: 0,
			y: 0,
			w: 168,
			h: 72
		},
		{
			x: width - (width >= 640 ? 168 : 108),
			y: 0,
			w: width >= 640 ? 168 : 108,
			h: width >= 640 ? 132 : 78
		},
		{
			x: 0,
			y: height - 118,
			w: width,
			h: 118
		},
		{
			x: width * .5 - 22,
			y: height * .5 - 22,
			w: 44,
			h: 44
		}
	];
	const limit = width < 720 ? 12 : 20;
	const lh = 14;
	for (const c of candidates) {
		if (placed.length >= limit) break;
		const w = textWidth(c.text);
		const spots = [
			[8, -16],
			[8, 5],
			[-w - 8, -16],
			[-w - 8, 5],
			[8, -30],
			[-w - 8, -30]
		];
		let chosen = null;
		for (const [ox, oy] of spots) {
			const rect = {
				x: c.sx + ox,
				y: c.sy + oy,
				w,
				h: lh
			};
			if (rect.x < 4 || rect.y < 4 || rect.x + rect.w > width - 4 || rect.y + rect.h > height - 4) continue;
			let hit = false;
			for (const b of blocked) if (overlaps(rect, b, 5)) {
				hit = true;
				break;
			}
			if (!hit) {
				for (const p of placed) if (overlaps(rect, p, 5)) {
					hit = true;
					break;
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
			h: lh
		});
	}
	sticky = new Set(placed.map((p) => p.name));
	return placed;
}
function StarLabels({ sim }) {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const root = ref.current;
		if (!root) return;
		const pool = [];
		let raf = 0;
		const loop = () => {
			raf = requestAnimationFrame(loop);
			const w = root.clientWidth;
			const h = root.clientHeight;
			const labels = sim.showLabels ? layoutStarLabels(sim, w, h) : [];
			while (pool.length < labels.length) {
				const el = document.createElement("div");
				el.className = "star-tag";
				root.appendChild(el);
				pool.push(el);
			}
			for (let i = 0; i < pool.length; i++) {
				const el = pool[i];
				if (i >= labels.length) {
					el.style.display = "none";
					continue;
				}
				const label = labels[i];
				el.style.display = "block";
				el.style.transform = `translate3d(${label.x}px,${label.y}px,0)`;
				el.dataset.sx = String(Math.round(label.sx));
				el.dataset.sy = String(Math.round(label.sy));
				if (el.dataset.n !== label.name) {
					el.dataset.n = label.name;
					el.textContent = label.text;
				}
			}
		};
		raf = requestAnimationFrame(loop);
		return () => {
			cancelAnimationFrame(raf);
			root.replaceChildren();
		};
	}, [sim]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "pointer-events-none absolute inset-0 z-[4]",
		"aria-hidden": true
	});
}
function StarfieldApp() {
	const wrapRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const [sim] = (0, import_react.useState)(() => defaultSim());
	const [engine, setEngine] = (0, import_react.useState)(null);
	const [boostHeld, setBoostHeld] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const stored = loadSim();
		Object.assign(sim, stored);
		const eng = createEngine(canvas, sim);
		setEngine(eng);
		const audio = createAudio();
		const detach = eng.input.attach(wrap);
		const unlock = () => {
			audio.unlock();
			sim.started = true;
		};
		wrap.addEventListener("pointerdown", unlock, { once: true });
		window.addEventListener("keydown", unlock, { once: true });
		window.__controlsTest = {
			getYaw: () => sim.yaw,
			getPitch: () => sim.pitch,
			getRoll: () => sim.roll,
			getSpeed: () => betaFromPhi(sim.rapidity),
			setSteer: (v) => {
				eng.input.steerOverride = v;
			},
			setKeys: (codes) => {
				eng.input.inject = codes;
				eng.input.steerOverride = null;
			}
		};
		let saveAt = 0;
		let raf = 0;
		const loop = () => {
			audio.setWarp(Math.min(1, betaFromPhi(sim.rapidity) * 1.1 + (eng.input.boostHold ? .25 : 0)));
			const now = performance.now();
			if (now - saveAt > 2500) {
				saveSim(sim);
				saveAt = now;
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		const onKey = (e) => {
			if (e.repeat || e.metaKey || e.ctrlKey) return;
			const tag = e.target?.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA") return;
			if (e.code === "KeyC") sim.showConstellations = !sim.showConstellations;
			else if (e.code === "KeyL") sim.showLabels = !sim.showLabels;
			else if (e.code === "KeyG") sim.showGrid = !sim.showGrid;
			else if (e.code === "KeyR") sim.relativity = !sim.relativity;
			else if (e.code === "KeyH") sim.hudVisible = !sim.hudVisible;
			else if (e.code === "KeyI") {
				sim.inertial = !sim.inertial;
				sim.velYaw = sim.yaw;
				sim.velPitch = sim.pitch;
			}
		};
		window.addEventListener("keydown", onKey);
		return () => {
			cancelAnimationFrame(raf);
			detach();
			window.removeEventListener("keydown", onKey);
			eng.dispose();
			audio.dispose();
			saveSim(sim);
			if (window.__controlsTest) delete window.__controlsTest;
		};
	}, [sim]);
	function onBoostChange(v) {
		setBoostHeld(v);
		if (engine) engine.input.boostHold = v;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: wrapRef,
		className: "relative h-[100dvh] w-full overflow-hidden bg-void select-none",
		style: { touchAction: "none" },
		suppressHydrationWarning: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "block h-full w-full"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarLabels, { sim }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, {
				sim,
				engine,
				onBoostChange,
				boostHeld
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StarfieldApp, {});
}
//#endregion
export { Home as component };
