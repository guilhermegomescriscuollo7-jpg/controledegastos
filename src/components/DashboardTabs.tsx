"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";

export interface DashTab {
  id: string;
  label: string;
  icon: IconName;
  content: React.ReactNode;
}

export function DashboardTabs({ tabs }: { tabs: DashTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === active)
  );
  const current = tabs[activeIndex] ?? tabs[0];

  return (
    <>
      <div
        role="tablist"
        aria-label="Seções do painel"
        className="glass no-lift relative flex p-1"
        style={{ borderRadius: 9999 }}
      >
        {/* indicador que desliza para a aba ativa */}
        <div
          aria-hidden
          className="absolute bottom-1 top-1 rounded-full transition-transform duration-300 ease-out"
          style={{
            left: 4,
            width: `calc((100% - 8px) / ${tabs.length})`,
            transform: `translateX(calc(${activeIndex} * 100%))`,
            background: "var(--accent)",
            boxShadow: "0 4px 14px -4px color-mix(in srgb, var(--accent) 70%, transparent)",
          }}
        />
        {tabs.map((t) => {
          const on = t.id === current.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.id)}
              className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-colors ${
                on ? "text-white" : "link-dim"
              }`}
            >
              <Icon name={t.icon} size={15} strokeWidth={2} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* key força a re-montagem (reinicia a animação de entrada ao trocar de aba) */}
      <div key={current.id} className="animate-fadeup space-y-5">
        {current.content}
      </div>
    </>
  );
}
