"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES, BRL } from "@/lib/categories";
import type { Budget, CategoryKey } from "@/lib/types";

interface Props {
  budgets: Budget[];
  savingsTarget: number;
  canEdit: boolean;
}

export function BudgetEditor({ budgets, savingsTarget, canEdit }: Props) {
  const router = useRouter();
  const [limits, setLimits] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const c of EXPENSE_CATEGORIES) {
      const b = budgets.find((x) => x.category === c.key);
      map[c.key] = b ? String(b.monthly_limit) : "";
    }
    return map;
  });
  const [target, setTarget] = useState(String(savingsTarget || ""));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (!isSupabaseConfigured() || !canEdit) {
      setMsg("Entre na sua conta para salvar os limites.");
      return;
    }
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMsg("Sessão expirada, entre novamente.");
      setSaving(false);
      return;
    }

    const rows = EXPENSE_CATEGORIES.map((c) => ({
      user_id: user.id,
      category: c.key as CategoryKey,
      monthly_limit: parseFloat((limits[c.key] || "0").replace(",", ".")) || 0,
    })).filter((r) => r.monthly_limit > 0);

    const { error: e1 } = await supabase
      .from("budgets")
      .upsert(rows, { onConflict: "user_id,category" });

    const month = new Date().toISOString().slice(0, 7);
    const { error: e2 } = await supabase
      .from("monthly_goals")
      .upsert(
        {
          user_id: user.id,
          month,
          savings_target: parseFloat(target.replace(",", ".")) || 0,
        },
        { onConflict: "user_id,month" }
      );

    setSaving(false);
    if (e1 || e2) setMsg("Erro ao salvar: " + (e1 || e2)?.message);
    else {
      setMsg("✓ Salvo!");
      router.refresh();
    }
  }

  return (
    <div className="glass p-5">
      <h3 className="mb-1 font-semibold">🎯 Meta e limites mensais</h3>
      <p className="text-dim mb-4 text-xs">
        Defina quanto quer guardar e o teto de cada categoria. Estourou o teto =
        alerta no início.
      </p>

      <label className="text-dim mb-1 block text-xs font-medium">
        Quanto quero guardar por mês
      </label>
      <input
        className="input-glass mb-5"
        inputMode="decimal"
        placeholder="Ex: 1000"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      />

      <div className="space-y-3">
        {EXPENSE_CATEGORIES.map((c) => (
          <div key={c.key} className="flex items-center gap-3">
            <span className="w-40 shrink-0 text-sm">
              {c.emoji} {c.label}
            </span>
            <div className="relative flex-1">
              <span className="text-dim pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                R$
              </span>
              <input
                className="input-glass pl-9"
                inputMode="decimal"
                placeholder="0"
                value={limits[c.key]}
                onChange={(e) =>
                  setLimits((l) => ({ ...l, [c.key]: e.target.value }))
                }
              />
            </div>
          </div>
        ))}
      </div>

      {msg && <p className="mt-3 text-sm text-accent-amber">{msg}</p>}

      <button className="btn-primary mt-4 w-full" onClick={save} disabled={saving}>
        {saving ? "Salvando…" : "Salvar limites"}
      </button>
      {!canEdit && (
        <p className="text-dim mt-2 text-center text-xs">
          Mostrando valores de exemplo. Entre para editar os seus.
        </p>
      )}
    </div>
  );
}
