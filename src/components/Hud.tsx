import {
  Compass,
  Eye,
  Gauge,
  Map,
  Orbit,
  SlidersHorizontal,
  Smartphone,
  Type,
  Zap,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CATALOG, nearestCatalog, PRESETS } from "@/game/catalog";
import {
  formatDec,
  formatLy,
  formatRA,
  galacticXyzToThree,
  lookDirFromYawPitch,
  threeToGalacticXyz,
  xyzToGalacticLb,
} from "@/game/coords";
import { betaFromPhi, formatBeta, formatGamma, gammaFromPhi } from "@/game/relativity";
import { dominantLens, formatMass, massFromSlider, sliderFromMass } from "@/game/masses";
import { lookAtPoint, lookAtStar, saveSim, setObserverMass, type Sim } from "@/game/sim";
import { attitudeHint, disableAttitude, enableAttitude } from "@/game/attitude";
import type { Engine } from "@/game/engine";

type Props = {
  sim: Sim;
  engine: Engine | null;
  onBoostChange: (v: boolean) => void;
  boostHeld: boolean;
};

export function Hud({ sim, engine, onBoostChange, boostHeld }: Props) {
  const [, tick] = useState(0);
  const [chart, setChart] = useState(false);
  const [help, setHelp] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 90);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setHelp(false), 7000);
    return () => window.clearTimeout(t);
  }, []);

  const beta = betaFromPhi(sim.rapidity);
  const gamma = gammaFromPhi(sim.rapidity);
  const dir = lookDirFromYawPitch(sim.yaw, sim.pitch);
  const poseHint = attitudeHint();

  function toggleAttitude() {
    void (async () => {
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
  const ra = ((Math.atan2(ay, ax) * 180) / Math.PI + 360) % 360;
  const dec = (Math.atan2(az, Math.hypot(ax, ay)) * 180) / Math.PI;

  const near = nearestCatalog(dir[0], dir[1], dir[2], sim.pos[0], sim.pos[1], sim.pos[2]);
  const lens = dominantLens(sim.pos, sim);

  return (
    <div className="pointer-events-none absolute inset-0 text-ink">
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(2,3,8,0.55)]" />

      <div className="absolute left-1/2 top-1/2 crosshair -translate-x-1/2 -translate-y-1/2 opacity-70" />

      <header className="absolute top-0 left-0 right-0 flex items-start justify-between gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-5">
        <div>
          <p className="font-display text-2xl italic leading-none tracking-tight text-ink sm:text-3xl">
            Sidereal
          </p>
          <p className="mt-1 text-[11px] tracking-[0.28em] text-mute uppercase">天穹</p>
        </div>
        <div className="text-right font-mono text-[11px] leading-5 text-mute tabular-nums">
          <p>
            β <span className="text-ink">{formatBeta(beta)}</span>
          </p>
          <p>
            γ <span className="text-ink">{formatGamma(gamma)}</span>
          </p>
          {lens && !lens.inside && lens.timeFactor < 0.995 ? (
            <p>
              g <span className="text-ink">{lens.timeFactor.toFixed(3)}</span>
            </p>
          ) : null}
          {lens && !lens.inside && !lens.embedded && lens.edgeAngle > 0.02 && lens.kind === 0 && lens.massRs > 0 ? (
            <p>
              r <span className="text-ink">{(lens.dist / lens.massRs).toFixed(1)} Rs</span>
            </p>
          ) : null}
          {lens && !lens.inside && !lens.embedded && lens.edgeAngle > 0.02 && lens.kind !== 0 && lens.radius > 0 ? (
            <p>
              r <span className="text-ink">{(lens.dist / lens.radius).toFixed(1)} R</span>
            </p>
          ) : null}
          <p>
            τ <span className="text-ink">{sim.properYears.toFixed(4)} y</span>
          </p>
        </div>
      </header>

      <div className="absolute top-16 right-4 hidden text-right font-mono text-[11px] leading-5 text-mute tabular-nums sm:block sm:top-20">
        <p className="text-accent">{formatRA(ra)}</p>
        <p>{formatDec(dec)}</p>
        {lens && lens.edgeAngle > 0.04 && !lens.inside ? (
          <p className="mt-1 text-ink">{lens.zh}</p>
        ) : near ? (
          <p className="mt-1 text-ink">
            {near.zh}
            <span className="ml-1 text-faint">{near.name}</span>
          </p>
        ) : null}
        {lens && lens.edgeAngle > 0.04 ? null : near ? <p className="text-faint">{near.conZh}</p> : null}
      </div>

      {lens?.inside ? (
        <p className="pointer-events-none absolute top-1/2 left-1/2 w-[min(92vw,22rem)] -translate-x-1/2 translate-y-8 text-center text-[12px] tracking-[0.22em] text-ember uppercase">
          视界之内
        </p>
      ) : null}

      {help && !sim.started && sim.hudVisible && !poseHint ? (
        <p className="pointer-events-none absolute bottom-28 left-1/2 w-[min(92vw,24rem)] -translate-x-1/2 text-center text-[11px] leading-5 text-mute sm:bottom-32">
          拖动转向 · 姿态跟手机 · 滚轮或 W S 调速 · L 星名 · 空格跃迁
        </p>
      ) : null}
      {poseHint && sim.hudVisible ? (
        <p className="pointer-events-none absolute bottom-28 left-1/2 w-[min(92vw,24rem)] -translate-x-1/2 text-center text-[11px] leading-5 text-mute sm:bottom-32">
          {poseHint}
        </p>
      ) : null}

      {sim.hudVisible ? (
        <>
          {chart ? (
            <div
              className="pointer-events-auto absolute z-20 bottom-[5.5rem] left-3 right-3 max-h-[min(62vh,32rem)] overflow-y-auto rounded-xl p-3 hud-panel sm:bottom-auto sm:left-4 sm:right-auto sm:top-24 sm:w-[20.5rem] sm:rounded-2xl sm:p-4"
              data-ui
            >
              <Chart sim={sim} poseHint={poseHint} onAttitude={toggleAttitude} onClose={() => setChart(false)} />
            </div>
          ) : null}

          <footer className="pointer-events-auto absolute right-0 bottom-0 left-0 flex items-end justify-between gap-3 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
            <div className="flex min-w-0 flex-1 items-end gap-2">
              <IconBtn
                label="航图"
                active={chart}
                onClick={() => setChart((v) => !v)}
                icon={<Map className="size-4" strokeWidth={1.75} />}
              />
              <IconBtn
                label="星名"
                active={sim.showLabels}
                onClick={() => {
                  sim.showLabels = !sim.showLabels;
                  saveSim(sim);
                }}
                icon={<Type className="size-4" strokeWidth={1.75} />}
              />
              <IconBtn
                label="姿态"
                active={sim.attitude}
                onClick={toggleAttitude}
                icon={<Smartphone className="size-4" strokeWidth={1.75} />}
              />
              <div className="hud-panel min-w-0 flex-1 rounded-xl px-3 py-2 sm:max-w-md sm:rounded-2xl sm:px-4">
                <Row label="速度" value={formatBeta(beta)}>
                  <input
                    className="hud-slider mt-2 w-full"
                    type="range"
                    suppressHydrationWarning
                    min={0}
                    max={4.6}
                    step={0.01}
                    value={sim.cruisePhi}
                    aria-label="速度"
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      sim.cruisePhi = v;
                      if (!sim.boost) sim.rapidity = v;
                    }}
                  />
                </Row>
                <Row label="密度" value={`${Math.round(sim.density * 100)}%`}>
                  <input
                    className="hud-slider mt-2 w-full"
                    type="range"
                    suppressHydrationWarning
                    min={0.12}
                    max={1}
                    step={0.01}
                    value={sim.density}
                    aria-label="星体密度"
                    onChange={(e) => engine?.setDensity(Number(e.target.value))}
                  />
                </Row>
              </div>
            </div>

            <button
              type="button"
              data-ui
              aria-pressed={boostHeld}
              aria-label="加速"
              onPointerDown={() => onBoostChange(true)}
              onPointerUp={() => onBoostChange(false)}
              onPointerCancel={() => onBoostChange(false)}
              onPointerLeave={() => onBoostChange(false)}
              className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-full border text-[10px] tracking-widest transition-transform duration-150 ease-out active:scale-[0.98] sm:size-16 ${
                boostHeld
                  ? "border-accent bg-ink text-void"
                  : "border-line bg-surface text-ink"
              }`}
            >
              <Zap className="size-4" strokeWidth={1.75} />
              <span className="mt-0.5">加速</span>
            </button>
          </footer>
        </>
      ) : null}
    </div>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <label className="block py-1 first:pt-0 last:pb-0">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] tracking-[0.18em] text-mute uppercase">{label}</span>
        <span className="font-mono text-[11px] text-ink tabular-nums">{value}</span>
      </span>
      {children}
    </label>
  );
}

function IconBtn({
  label,
  icon,
  onClick,
  active,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      data-ui
      onClick={onClick}
      aria-label={label}
      className={`flex size-11 shrink-0 flex-col items-center justify-center rounded-xl border text-[9px] tracking-wider transition-colors duration-150 sm:size-12 sm:rounded-2xl ${
        active ? "border-accent bg-raised text-ink" : "border-line bg-surface text-mute"
      }`}
    >
      {icon}
    </button>
  );
}

function Chart({
  sim,
  onClose,
  onAttitude,
  poseHint,
}: {
  sim: Sim;
  onClose: () => void;
  onAttitude: () => void;
  poseHint: string;
}) {
  const gal = threeToGalacticXyz(sim.pos[0], sim.pos[1], sim.pos[2]);
  const lb = xyzToGalacticLb(gal[0], gal[1], gal[2]);

  function setGal(i: 0 | 1 | 2, v: number) {
    const next: [number, number, number] = [gal[0], gal[1], gal[2]];
    next[i] = v;
    const t = galacticXyzToThree(next[0], next[1], next[2]);
    sim.pos[0] = t[0];
    sim.pos[1] = t[1];
    sim.pos[2] = t[2];
    saveSim(sim);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs tracking-[0.22em] text-mute uppercase">航图</p>
        <button type="button" className="text-xs text-faint hover:text-ink" onClick={onClose}>
          收起
        </button>
      </div>

      <p className="mb-2 flex items-center gap-1.5 text-[11px] text-mute">
        <Orbit className="size-3.5" strokeWidth={1.75} />
        银心直角坐标系 / 光年
      </p>
      <div className="grid grid-cols-3 gap-2">
        <Num label="X" value={gal[0]} onChange={(v) => setGal(0, v)} />
        <Num label="Y" value={gal[1]} onChange={(v) => setGal(1, v)} />
        <Num label="Z" value={gal[2]} onChange={(v) => setGal(2, v)} />
      </div>
      <p className="mt-2 font-mono text-[11px] text-faint tabular-nums">
        l {lb.l.toFixed(2)}° · b {lb.b.toFixed(2)}° · {formatLy(lb.dist)}
      </p>

      <div className="mt-3">
        <span className="text-[10px] tracking-[0.18em] text-mute uppercase">年代</span>
        <div className="mt-1 flex items-center gap-2">
          <input
            className="hud-slider min-w-0 flex-1"
            type="range"
            suppressHydrationWarning
            min={-8000}
            max={8000}
            step={1}
            value={sim.epochYear}
            aria-label="年代"
            onChange={(e) => {
              sim.epochYear = Number(e.target.value);
            }}
          />
          <span className="w-16 text-right font-mono text-[11px] tabular-nums">
            {sim.epochYear.toFixed(0)}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <span className="text-[10px] tracking-[0.18em] text-mute uppercase">时间流速</span>
        <div className="mt-1 flex items-center gap-2">
          <input
            className="hud-slider min-w-0 flex-1"
            type="range"
            suppressHydrationWarning
            min={0}
            max={1.2}
            step={0.002}
            value={sim.timeRate}
            aria-label="时间流速"
            onChange={(e) => {
              sim.timeRate = Number(e.target.value);
            }}
          />
          <span className="w-16 text-right font-mono text-[11px] tabular-nums">
            {sim.timeRate.toFixed(3)} y/s
          </span>
        </div>
      </div>

      <div className="mt-3">
        <span className="text-[10px] tracking-[0.18em] text-mute uppercase">灵敏度</span>
        <input
          className="hud-slider mt-2 w-full"
          type="range"
          suppressHydrationWarning
          min={0.35}
          max={2.2}
          step={0.01}
          value={sim.sensitivity}
          aria-label="灵敏度"
          onChange={(e) => {
            sim.sensitivity = Number(e.target.value);
          }}
        />
      </div>

      <p className="mt-4 mb-2 text-[10px] tracking-[0.18em] text-mute uppercase">观察点</p>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.filter((p) => p.group !== "wonder").map((p) => (
          <button
            key={p.id}
            type="button"
            className="rounded-md border border-line bg-raised px-2 py-1 text-[11px] text-mute hover:text-ink"
            onClick={() => {
              sim.observerMass = 0;
              sim.massAnchor = null;
              sim.pos[0] = p.x;
              sim.pos[1] = p.y;
              sim.pos[2] = p.z;
              if (p.lookAt) lookAtPoint(sim, p.lookAt[0], p.lookAt[1], p.lookAt[2]);
              else if (p.look) lookAtStar(sim, p.look);
              saveSim(sim);
            }}
          >
            {p.zh}
          </button>
        ))}
      </div>

      <p className="mt-4 mb-2 text-[10px] tracking-[0.18em] text-mute uppercase">奇观</p>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.filter((p) => p.group === "wonder").map((p) => (
          <button
            key={p.id}
            type="button"
            className="rounded-md border border-line bg-raised px-2 py-1 text-[11px] text-mute hover:text-ink"
            onClick={() => {
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
            }}
          >
            {p.zh}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <span className="text-[10px] tracking-[0.18em] text-mute uppercase">观察点质量</span>
        <div className="mt-1 flex items-center gap-2">
          <input
            className="hud-slider min-w-0 flex-1"
            type="range"
            suppressHydrationWarning
            min={0}
            max={1}
            step={0.002}
            value={sliderFromMass(sim.observerMass)}
            aria-label="观察点质量"
            onChange={(e) => {
              setObserverMass(sim, massFromSlider(Number(e.target.value)));
              saveSim(sim);
            }}
          />
          <span className="w-16 text-right font-mono text-[11px] tabular-nums">
            {formatMass(sim.observerMass)}
          </span>
        </div>
      </div>

      <p className="mt-4 mb-2 text-[10px] tracking-[0.18em] text-mute uppercase">对准</p>
      <div className="flex flex-wrap gap-1.5">
        {["Sirius", "Vega", "Betelgeuse", "Polaris", "Antares", "Deneb", "Rigil Kentaurus"].map(
          (name) => {
            const s = CATALOG.find((c) => c.name === name);
            if (!s) return null;
            return (
              <button
                key={name}
                type="button"
                className="rounded-md border border-line px-2 py-1 text-[11px] text-mute hover:text-ink"
                onClick={() => lookAtStar(sim, name)}
              >
                {s.zh}
              </button>
            );
          },
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1.5">
        <Toggle
          icon={<Gauge className="size-3.5" strokeWidth={1.75} />}
          label="相对论"
          on={sim.relativity}
          onClick={() => {
            sim.relativity = !sim.relativity;
            saveSim(sim);
          }}
        />
        <Toggle
          icon={<Compass className="size-3.5" strokeWidth={1.75} />}
          label="星座"
          on={sim.showConstellations}
          onClick={() => {
            sim.showConstellations = !sim.showConstellations;
            saveSim(sim);
          }}
        />
        <Toggle
          icon={<Type className="size-3.5" strokeWidth={1.75} />}
          label="星名"
          on={sim.showLabels}
          onClick={() => {
            sim.showLabels = !sim.showLabels;
            saveSim(sim);
          }}
        />
        <Toggle
          icon={<SlidersHorizontal className="size-3.5" strokeWidth={1.75} />}
          label="赤经网"
          on={sim.showGrid}
          onClick={() => {
            sim.showGrid = !sim.showGrid;
            saveSim(sim);
          }}
        />
        <Toggle
          icon={<Eye className="size-3.5" strokeWidth={1.75} />}
          label="惯性指向"
          on={sim.inertial}
          onClick={() => {
            sim.inertial = !sim.inertial;
            sim.velYaw = sim.yaw;
            sim.velPitch = sim.pitch;
            saveSim(sim);
          }}
        />
        <Toggle
          icon={<Smartphone className="size-3.5" strokeWidth={1.75} />}
          label="姿态"
          on={sim.attitude}
          onClick={onAttitude}
        />
      </div>
      {poseHint ? <p className="mt-2 text-[10px] leading-4 text-faint">{poseHint}</p> : null}
      <p className="mt-3 text-[10px] leading-4 text-faint">
        相对论开启后，高速会把星光集中到航向前方。奇观把你停在黑洞、中子星或巨星跟前：背景星弯向爱因斯坦环，黑洞中心是视界和吸积盘。把速度推高会缓慢落进去。观察点质量越大，前方黑洞的张角越大。姿态开启后，手机屏幕是窗口：左转看左，后仰看天。
      </p>
    </div>
  );
}

function Toggle({
  label,
  on,
  onClick,
  icon,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[11px] ${
        on ? "border-accent/40 bg-raised text-ink" : "border-line text-mute"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] text-faint">{label}</span>
      <input
        type="number"
        step={0.1}
        suppressHydrationWarning
        value={Number(value.toFixed(3))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-9 w-full rounded-md border border-line bg-void px-2 font-mono text-[12px] text-ink tabular-nums outline-none focus:border-accent"
      />
    </label>
  );
}
