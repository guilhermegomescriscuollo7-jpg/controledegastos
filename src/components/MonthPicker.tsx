"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

const MESES_CURTO = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];
const MESES_LONGO = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function MonthPicker({ monthKey }: { monthKey: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const selYear = Number(monthKey.slice(0, 4));
  const selMonth = Number(monthKey.slice(5, 7)) - 1; // 0-index
  const [viewYear, setViewYear] = useState(selYear);

  const now = new Date();
  const thisKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      const insideButton = ref.current?.contains(target);
      const insidePanel = panelRef.current?.contains(target);
      if (!insideButton && !insidePanel) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (open) setViewYear(selYear);
  }, [open, selYear]);

  useLayoutEffect(() => {
    if (!open || !ref.current) return;

    function updatePosition() {
      const rect = ref.current!.getBoundingClientRect();
      setCoords({ top: rect.bottom + 8, left: rect.left });
    }

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  function select(monthIdx: number) {
    const key = `${viewYear}-${String(monthIdx + 1).padStart(2, "0")}`;
    setOpen(false);
    router.push(key === thisKey ? "/" : `/?month=${key}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-glass flex items-center gap-2"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Icon name="calendar" size={16} />
        <span className="capitalize">
          {MESES_LONGO[selMonth]} {selYear}
        </span>
        <Icon name="chevron-down" size={15} className="text-dim" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            ref={panelRef}
            className="glass animate-fadeup fixed z-50 w-72 p-4"
            style={{ top: coords.top, left: coords.left, background: "var(--popover-bg)" }}
            role="dialog"
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setViewYear((y) => y - 1)}
                className="fill-1 grid h-8 w-8 place-items-center rounded-full"
                aria-label="Ano anterior"
              >
                <Icon name="chevron-left" size={16} />
              </button>
              <span className="text-base font-semibold">{viewYear}</span>
              <button
                onClick={() => setViewYear((y) => y + 1)}
                className="fill-1 grid h-8 w-8 place-items-center rounded-full"
                aria-label="Próximo ano"
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {MESES_CURTO.map((m, i) => {
                const key = `${viewYear}-${String(i + 1).padStart(2, "0")}`;
                const isSelected = i === selMonth && viewYear === selYear;
                const isCurrent = key === thisKey;
                return (
                  <button
                    key={m}
                    onClick={() => select(i)}
                    className={`rounded-xl py-2 text-sm font-medium transition ${
                      isSelected ? "text-white" : "link-dim hover:fill-1"
                    }`}
                    style={
                      isSelected
                        ? { background: "var(--accent)" }
                        : isCurrent
                        ? { boxShadow: "inset 0 0 0 1px var(--accent)" }
                        : undefined
                    }
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setOpen(false);
                router.push("/");
              }}
              className="mt-3 w-full rounded-xl py-2 text-center text-sm font-medium"
              style={{ color: "var(--accent)" }}
            >
              Ir para o mês atual
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
