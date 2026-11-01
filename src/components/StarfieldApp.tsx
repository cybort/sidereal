import { useEffect, useRef, useState } from "react";
import { createAudio } from "@/game/audio";
import { createEngine, type Engine } from "@/game/engine";
import { betaFromPhi } from "@/game/relativity";
import { defaultSim, loadSim, saveSim } from "@/game/sim";
import { Hud } from "./Hud";
import { StarLabels } from "./StarLabels";

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getPitch: () => number;
      getRoll: () => number;
      getSpeed: () => number;
      setSteer?: (v: number) => void;
      setKeys?: (codes: string[]) => void;
    };
  }
}

export function StarfieldApp() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sim] = useState(() => defaultSim());
  const [engine, setEngine] = useState<Engine | null>(null);
  const [boostHeld, setBoostHeld] = useState(false);

  useEffect(() => {
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
      },
    };

    let saveAt = 0;
    let raf = 0;
    const loop = () => {
      audio.setWarp(
        Math.min(1, betaFromPhi(sim.rapidity) * 1.1 + (eng.input.boostHold ? 0.25 : 0)),
      );
      const now = performance.now();
      if (now - saveAt > 2500) {
        saveSim(sim);
        saveAt = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "KeyC") {
        sim.showConstellations = !sim.showConstellations;
      } else if (e.code === "KeyL") {
        sim.showLabels = !sim.showLabels;
      } else if (e.code === "KeyG") {
        sim.showGrid = !sim.showGrid;
      } else if (e.code === "KeyR") {
        sim.relativity = !sim.relativity;
      } else if (e.code === "KeyH") {
        sim.hudVisible = !sim.hudVisible;
      } else if (e.code === "KeyI") {
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

  function onBoostChange(v: boolean) {
    setBoostHeld(v);
    if (engine) engine.input.boostHold = v;
  }

  return (
    <div
      ref={wrapRef}
      className="relative h-[100dvh] w-full overflow-hidden bg-void select-none"
      style={{ touchAction: "none" }}
      suppressHydrationWarning
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <StarLabels sim={sim} />
      <Hud sim={sim} engine={engine} onBoostChange={onBoostChange} boostHeld={boostHeld} />
    </div>
  );
}
