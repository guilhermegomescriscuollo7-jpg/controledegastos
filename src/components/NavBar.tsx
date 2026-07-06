"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Início", icon: "home" },
  { href: "/transactions", label: "Gastos", icon: "receipt" },
  { href: "/import", label: "Importar", icon: "upload" },
  { href: "/settings", label: "Ajustes", icon: "gear" },
];

export function NavBar() {
  const path = usePathname();
  if (path === "/login" || path === "/signup") return null;
  return (
    <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div
        className="flex items-center gap-1 rounded-full border p-1.5"
        style={{
          background: "var(--nav-bg)",
          borderColor: "var(--card-border)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        {items.map((it) => {
          const active = path === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex min-w-[64px] flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
                active ? "text-white" : "link-dim hover:text-[color:var(--text)]"
              }`}
              style={
                active
                  ? {
                      background: "var(--accent)",
                      boxShadow:
                        "0 4px 16px -4px color-mix(in srgb, var(--accent) 75%, transparent)",
                    }
                  : undefined
              }
            >
              <Icon name={it.icon} size={19} strokeWidth={active ? 2 : 1.7} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
