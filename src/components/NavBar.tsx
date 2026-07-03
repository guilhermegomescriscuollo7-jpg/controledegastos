"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Início", icon: "◎" },
  { href: "/transactions", label: "Gastos", icon: "≣" },
  { href: "/import", label: "Importar", icon: "↥" },
  { href: "/settings", label: "Ajustes", icon: "⚙" },
];

export function NavBar() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="glass flex items-center gap-1 rounded-full px-2 py-2">
        {items.map((it) => {
          const active = path === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center rounded-full px-4 py-1.5 text-[11px] font-medium transition ${
                active ? "text-white" : "link-dim"
              }`}
              style={
                active
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(124,92,255,0.55), rgba(167,139,250,0.35))",
                    }
                  : undefined
              }
            >
              <span className="text-base leading-none">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
