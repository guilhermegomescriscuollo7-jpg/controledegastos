"use client";

import { useEffect, useState } from "react";
import type { HealthScore } from "@/lib/finance";
import { Icon } from "@/components/icons";

const COLORS: Record<string, string> = {
  Excelente: "#34c759",
  Boa: "#0a84ff",
  Atenção: "#ff9f0a",
  Crítica: "#ff375f",
};

// Semicírculo: raio 80, centro (100,100), de 180° a 0°.
const R = 80;
const CIRC = Math.PI * R; // comprimento do arco (meia volta)

function describeArc(fraction: number) {
  const angle = Math.PI * (1 - fraction); // 180° -> 0°
  const x = 100 + R * Math.cos(angle);
  const y = 100 - R * Math.sin(angle);
  return { x, y };
}

export function HealthGauge({ health }: { health: HealthScore }) {
  const [shown, setShown] = useState(0);
  const color = COLORS[health.label] ?? "#0a84ff";

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(health.score);
      return;
    }
    const from = 0;
    const to = health.score;
    const dur = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [health.score]);

  const frac = Math.max(0, Math.min(1, shown / 100));
  const dash = CIRC * frac;
  const knob = describeArc(frac);

  return (
    <div className="glass p-5">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-full"
          style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
        >
          <Icon name="sparkles" size={17} />
        </span>
        <h3 className="font-semibold">Saúde financeira</h3>
      </div>
      <p className="text-dim mb-2 text-xs">Nota do mês, de 0 a 100</p>

      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 118" className="w-full max-w-[280px]">
          {/* trilho */}
          <path
            d="M20 100 A80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--surface-1)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* progresso */}
          <path
            d="M20 100 A80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
            style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
          <circle cx={knob.x} cy={knob.y} r="7" fill={color} />
          <circle cx={knob.x} cy={knob.y} r="3" fill="var(--bg-base)" />
          <text
            x="100"
            y="92"
            textAnchor="middle"
            className="fill-[var(--text)]"
            style={{ fontSize: 34, fontWeight: 700 }}
          >
            {shown}
          </text>
        </svg>
        <span
          className="-mt-2 rounded-full px-3 py-1 text-sm font-semibold"
          style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
        >
          {health.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {health.parts.map((p) => (
          <div key={p.label} className="fill-1 rounded-xl p-2">
            <div className="text-sm font-semibold">
              {p.got}
              <span className="text-dim text-xs">/{p.max}</span>
            </div>
            <div className="text-dim text-[11px]">{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
