import type { FrameActions } from "./sim";

const GAME_CODES = new Set([
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
  "ArrowRight",
]);

function radialDeadzone(x: number, y: number, dz = 0.16): { x: number; y: number } {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export type Input = {
  actions: FrameActions;
  inject: string[] | null;
  steerOverride: number | null;
  boostHold: boolean;
  dragging: boolean;
  pointerId: number | null;
  lastX: number;
  lastY: number;
  attach: (el: HTMLElement) => () => void;
  sample: () => FrameActions;
};

export function createInput(): Input {
  const keys = new Set<string>();
  const lookAccum = { x: 0, y: 0 };
  let wheelThrottle = 0;

  const state: Input = {
    actions: {
      yaw: 0,
      pitch: 0,
      roll: 0,
      throttle: 0,
      boost: false,
      lookDx: 0,
      lookDy: 0,
    },
    inject: null,
    steerOverride: null,
    boostHold: false,
    dragging: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
    attach: (el) => attach(el),
    sample: () => sample(),
  };

  function activeKeys(): Set<string> {
    if (state.inject) return new Set(state.inject);
    return keys;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey) return;
    if (GAME_CODES.has(e.code)) e.preventDefault();
    keys.add(e.code);
  }
  function onKeyUp(e: KeyboardEvent) {
    keys.delete(e.code);
  }
  function clearKeys() {
    keys.clear();
  }

  function onPointerDown(e: PointerEvent) {
    const t = e.target as HTMLElement | null;
    if (t && t.closest("[data-ui]")) return;
    state.dragging = true;
    state.pointerId = e.pointerId;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
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
  function onPointerUp(e: PointerEvent) {
    if (e.pointerId !== state.pointerId) return;
    state.dragging = false;
    state.pointerId = null;
  }
  function onPointerCancel(e: PointerEvent) {
    if (e.pointerId !== state.pointerId) return;
    state.dragging = false;
    state.pointerId = null;
  }
  function onWheel(e: WheelEvent) {
    const t = e.target as HTMLElement | null;
    if (t && t.closest("[data-ui]")) return;
    e.preventDefault();
    const dir = e.deltaY > 0 ? -1 : 1;
    wheelThrottle += dir * 0.35;
  }

  function attach(el: HTMLElement): () => void {
    const keyDown = (e: KeyboardEvent) => onKeyDown(e);
    const keyUp = (e: KeyboardEvent) => onKeyUp(e);
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

  function samplePad(): {
    yaw: number;
    pitch: number;
    lookX: number;
    lookY: number;
    throttle: number;
    boost: boolean;
  } {
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
      if (pad.buttons[7]?.value && pad.buttons[7].value > 0.15) throttle += pad.buttons[7].value;
      if (pad.buttons[6]?.value && pad.buttons[6].value > 0.15) throttle -= pad.buttons[6].value;
      if (pad.buttons[0]?.pressed || pad.buttons[5]?.pressed) boost = true;
    }
    return { yaw, pitch, lookX, lookY, throttle, boost };
  }

  function sample(): FrameActions {
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
    wheelThrottle *= 0.72;
    let boost =
      k.has("ShiftLeft") || k.has("ShiftRight") || k.has("Space") || state.boostHold;

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

    const actions: FrameActions = {
      yaw: clamp(yaw, -1, 1),
      pitch: clamp(pitch, -1, 1),
      roll: clamp(roll, -1, 1),
      throttle: clamp(throttle, -1.5, 1.5),
      boost,
      lookDx,
      lookDy,
    };
    state.actions = actions;
    return actions;
  }

  return state;
}
