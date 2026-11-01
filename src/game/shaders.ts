export const STAR_VERT = /* glsl */ `
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

export const STAR_FRAG = /* glsl */ `
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

export const DUST_VERT = /* glsl */ `
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

export const DUST_FRAG = /* glsl */ `
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

export const LINE_VERT = /* glsl */ `
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

export const LINE_FRAG = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
void main() {
  gl_FragColor = vec4(uColor, vAlpha);
}
`;

export const WARP_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const WARP_FRAG = /* glsl */ `
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

export const BODY_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const BODY_FRAG = /* glsl */ `
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

export const INTERIOR_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const INTERIOR_FRAG = /* glsl */ `
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
