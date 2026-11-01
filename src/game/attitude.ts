import * as THREE from "three";

export type AttitudePose = {
  yaw: number;
  pitch: number;
  roll: number;
};

type Sample = {
  alpha: number;
  beta: number;
  gamma: number;
  orient: number;
};

const _m = new THREE.Matrix4();
const _qDevice = new THREE.Quaternion();
const _qBaseDevice = new THREE.Quaternion();
const _qBaseView = new THREE.Euler(0, 0, 0, "YXZ");
const _qView = new THREE.Quaternion();
const _qLocal = new THREE.Quaternion();
const _euler = new THREE.Euler(0, 0, 0, "YXZ");

let listening = false;
let calibrated = false;
let seen = false;
let hint = "";
let hintTimer = 0;
let latest: Sample | null = null;
let useAbsolute = false;
let baseOrient = 0;

function screenAngle(): number {
  const angle = screen.orientation?.angle;
  if (typeof angle === "number") return angle;
  const legacy = (window as Window & { orientation?: number }).orientation;
  return typeof legacy === "number" ? legacy : 0;
}

/** Device-to-Earth quaternion from the W3C orientation matrix. */
export function deviceQuaternion(alpha: number, beta: number, gamma: number, out = _qDevice): THREE.Quaternion {
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
  _m.set(
    cZ * cY - sZ * sX * sY, -cX * sZ, cY * sZ * sX + cZ * sY, 0,
    cY * sZ + cZ * sX * sY, cZ * cX, sZ * sY - cZ * cY * sX, 0,
    -cX * sY, sX, cX * cY, 0,
    0, 0, 0, 1,
  );
  return out.setFromRotationMatrix(_m);
}

function onOrient(e: DeviceOrientationEvent) {
  if (e.alpha == null || e.beta == null || e.gamma == null) return;
  if (e.absolute && !useAbsolute) {
    useAbsolute = true;
    calibrated = false;
  } else if (!e.absolute && useAbsolute) {
    return;
  }
  latest = { alpha: e.alpha, beta: e.beta, gamma: e.gamma, orient: screenAngle() };
  seen = true;
  hint = "";
}

export function attitudeHint(): string {
  return hint;
}

export function attitudeReady(): boolean {
  return listening && latest != null;
}

export function attitudeCalibrated(): boolean {
  return calibrated;
}

export function calibrateAttitude(pose: AttitudePose): void {
  if (!latest) return;
  deviceQuaternion(latest.alpha, latest.beta, latest.gamma, _qBaseDevice);
  _qBaseView.set(pose.pitch, pose.yaw, pose.roll, "YXZ");
  baseOrient = latest.orient;
  calibrated = true;
}

/** Write the phone's motion since calibration into the view. Returns false if the screen just rotated and the caller should recalibrate. */
export function applyAttitude(pose: AttitudePose): boolean {
  if (!latest || !calibrated) return false;
  if (latest.orient !== baseOrient) return false;
  deviceQuaternion(latest.alpha, latest.beta, latest.gamma, _qDevice);
  _qLocal.copy(_qBaseDevice).invert().multiply(_qDevice);
  _qView.setFromEuler(_qBaseView).multiply(_qLocal);
  _euler.setFromQuaternion(_qView, "YXZ");
  pose.pitch = Math.max(-1.45, Math.min(1.45, _euler.x));
  pose.yaw = _euler.y;
  pose.roll = _euler.z;
  return true;
}

function bind() {
  window.addEventListener("deviceorientation", onOrient);
  window.addEventListener("deviceorientationabsolute", onOrient as EventListener);
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

export function disableAttitude(): void {
  window.removeEventListener("deviceorientation", onOrient);
  window.removeEventListener("deviceorientationabsolute", onOrient as EventListener);
  listening = false;
  calibrated = false;
  latest = null;
  seen = false;
  useAbsolute = false;
  hint = "";
  window.clearTimeout(hintTimer);
}

export async function enableAttitude(): Promise<boolean> {
  const Doe = DeviceOrientationEvent as unknown as {
    requestPermission?: () => Promise<string>;
  };
  if (typeof Doe.requestPermission === "function") {
    try {
      const result = await Doe.requestPermission();
      if (result === "denied") {
        hint = "需要允许方向传感器";
        return false;
      }
    } catch {
      hint = "需要允许方向传感器";
      return false;
    }
  }
  if (listening) disableAttitude();
  hint = "";
  bind();
  return true;
}
