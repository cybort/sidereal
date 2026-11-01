import { useEffect, useRef } from "react";
import { layoutStarLabels } from "@/game/labels";
import type { Sim } from "@/game/sim";

export function StarLabels({ sim }: { sim: Sim }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const pool: HTMLDivElement[] = [];
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

  return <div ref={ref} className="pointer-events-none absolute inset-0 z-[4]" aria-hidden />;
}
