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
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <>
      <div
        role="tablist"
        aria-label="Seções do painel"
        className="glass flex gap-1 p-1"
        style={{ borderRadius: 9999 }}
      >
        {tabs.map((t) => {
          const on = t.id === current.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition ${
                on ? "text-white" : "link-dim hover:fill-1"
              }`}
              style={on ? { background: "var(--accent)" } : undefined}
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
