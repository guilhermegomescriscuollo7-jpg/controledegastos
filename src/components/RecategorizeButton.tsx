"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { guessCategory } from "@/lib/categories";
import { Icon } from "@/components/icons";
import type { Transaction, CategoryKey } from "@/lib/types";

const BATCH = 100;

export function RecategorizeButton({
  transactions,
  demo,
}: {
  transactions: Transaction[];
  demo: boolean;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Só recategoriza despesas; receitas ficam como estão.
  const expenses = transactions.filter(
    (t) => t.amount < 0 && t.category !== "receita"
  );

  async function run() {
    setConfirm(false);
    if (demo || !isSupabaseConfigured()) {
      setMsg("Disponível só com sua conta conectada.");
      return;
    }
    setBusy(true);
    setMsg("Analisando categorias…");

    try {
      // 1) Descobre a categoria sugerida para cada despesa (IA em lote,
      //    com as regras locais como fallback).
      const suggested = new Map<string, CategoryKey>();
      for (let i = 0; i < expenses.length; i += BATCH) {
        const chunk = expenses.slice(i, i + BATCH);
        let cats: CategoryKey[] | null = null;
        try {
          const res = await fetch("/api/categorize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              descriptions: chunk.map((t) => t.description),
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as { categories: CategoryKey[] | null };
            cats = data.categories;
          }
        } catch {
          cats = null;
        }
        chunk.forEach((t, j) => {
          suggested.set(t.id, cats ? cats[j] : guessCategory(t.description));
        });
      }

      // 2) Agrupa por categoria nova só o que mudou e atualiza em lote.
      const changedByCat = new Map<CategoryKey, string[]>();
      for (const t of expenses) {
        const next = suggested.get(t.id);
        if (next && next !== t.category) {
          const arr = changedByCat.get(next) ?? [];
          arr.push(t.id);
          changedByCat.set(next, arr);
        }
      }

      const totalChanged = [...changedByCat.values()].reduce(
        (s, ids) => s + ids.length,
        0
      );
      if (totalChanged === 0) {
        setBusy(false);
        setMsg("Tudo certo! Nenhuma categoria precisou mudar.");
        return;
      }

      const supabase = createClient();
      for (const [cat, ids] of changedByCat) {
        const { error } = await supabase
          .from("transactions")
          .update({ category: cat })
          .in("id", ids);
        if (error) {
          setBusy(false);
          setMsg("Erro ao salvar: " + error.message);
          return;
        }
      }

      setBusy(false);
      setMsg(`Pronto! ${totalChanged} de ${expenses.length} transações recategorizadas.`);
      router.refresh();
    } catch (e) {
      setBusy(false);
      setMsg("Erro: " + (e instanceof Error ? e.message : "desconhecido"));
    }
  }

  return (
    <>
      <button
        className="btn-glass flex items-center gap-1.5 py-2 text-sm"
        onClick={() => {
          setMsg(null);
          setConfirm(true);
        }}
        disabled={busy || expenses.length === 0}
      >
        <Icon name="sparkles" size={15} />
        {busy ? "Recategorizando…" : "Recategorizar"}
      </button>

      {msg && (
        <p className="text-dim mt-2 w-full text-sm">{msg}</p>
      )}

      {confirm &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4"
            onClick={() => setConfirm(false)}
          >
            <div
              className="glass no-lift animate-fadeup w-full max-w-xs p-5 text-center"
              style={{ background: "var(--popover-bg)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
                <Icon name="sparkles" size={20} />
              </div>
              <h3 className="font-semibold">Recategorizar transações?</h3>
              <p className="text-dim mt-1 text-sm">
                A IA vai reavaliar a categoria das suas {expenses.length}{" "}
                despesas. Ajustes manuais que você fez podem ser sobrescritos —
                dá para editar depois.
              </p>
              <div className="mt-4 flex gap-2">
                <button className="btn-glass flex-1" onClick={() => setConfirm(false)}>
                  Cancelar
                </button>
                <button className="btn-primary flex-1" onClick={run}>
                  Recategorizar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
