"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try {
    localStorage.setItem("theme", t);
  } catch {
    /* ignore */
  }
}

/**
 * variant="icon"      -> botãozinho sol/lua (para o cabeçalho)
 * variant="segmented" -> seletor Claro | Escuro (para Ajustes)
 */
export function ThemeToggle({
  variant = "icon",
}: {
  variant?: "icon" | "segmented";
}) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current =
      (document.documentElement.dataset.theme as Theme) ?? "dark";
    setTheme(current);
    setMounted(true);
  }, []);

  function change(t: Theme) {
    setTheme(t);
    applyTheme(t);
  }

  if (variant === "segmented") {
    return (
      <div className="glass flex items-center justify-between p-5">
        <div>
          <h3 className="font-semibold">🎨 Tema</h3>
          <p className="text-dim text-sm">Aparência do app</p>
        </div>
        <div className="glass flex gap-1 rounded-full p-1">
          {(["light", "dark"] as Theme[]).map((t) => {
            const active = mounted && theme === t;
            return (
              <button
                key={t}
                onClick={() => change(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  active ? "text-white" : "link-dim"
                }`}
                style={
                  active
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(124,92,255,0.65), rgba(167,139,250,0.4))",
                      }
                    : undefined
                }
              >
                {t === "light" ? "☀️ Claro" : "🌙 Escuro"}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <button
      aria-label="Alternar tema claro/escuro"
      onClick={() => change(theme === "dark" ? "light" : "dark")}
      className="btn-glass grid h-11 w-11 place-items-center !px-0 text-lg"
    >
      {mounted ? (theme === "dark" ? "☀️" : "🌙") : "🌓"}
    </button>
  );
}
