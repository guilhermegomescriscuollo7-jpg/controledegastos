"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES, CATEGORIES, guessCategory } from "@/lib/categories";
import type { CategoryKey } from "@/lib/types";

export function AddTransactionForm() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"gasto" | "receita">("gasto");
  const [category, setCategory] = useState<CategoryKey>("mercado");
  const [account, setAccount] = useState("Nubank");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!configured) {
      setMsg("Conecte o Supabase (aba Ajustes) para salvar gastos de verdade.");
      return;
    }
    const value = parseFloat(amount.replace(",", "."));
    if (!description || isNaN(value)) {
      setMsg("Preencha descrição e valor.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMsg("Você precisa entrar na sua conta primeiro.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      description,
      amount: type === "gasto" ? -Math.abs(value) : Math.abs(value),
      category: type === "receita" ? "receita" : category,
      date,
      account,
      source: "manual",
    });

    setSaving(false);
    if (error) {
      setMsg("Erro ao salvar: " + error.message);
    } else {
      setDescription("");
      setAmount("");
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <div>
      {!open ? (
        <button className="btn-primary w-full" onClick={() => setOpen(true)}>
          + Adicionar transação
        </button>
      ) : (
        <form onSubmit={submit} className="glass animate-fadeup space-y-3 p-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("gasto")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold ${
                type === "gasto" ? "btn-primary" : "btn-glass"
              }`}
            >
              💸 Gasto
            </button>
            <button
              type="button"
              onClick={() => setType("receita")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold ${
                type === "receita" ? "btn-primary" : "btn-glass"
              }`}
            >
              💰 Receita
            </button>
          </div>

          <input
            className="input-glass"
            placeholder="Descrição (ex: Posto Shell)"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (type === "gasto") setCategory(guessCategory(e.target.value));
            }}
          />
          <div className="flex gap-3">
            <input
              className="input-glass"
              placeholder="Valor (R$)"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              className="input-glass"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {type === "gasto" && (
            <select
              className="input-glass"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryKey)}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key} className="bg-[var(--select-bg)] text-[color:var(--text)]">
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          )}

          <select
            className="input-glass"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          >
            <option className="bg-[var(--select-bg)] text-[color:var(--text)]">Nubank</option>
            <option className="bg-[var(--select-bg)] text-[color:var(--text)]">Sicoob</option>
            <option className="bg-[var(--select-bg)] text-[color:var(--text)]">Dinheiro</option>
            <option className="bg-[var(--select-bg)] text-[color:var(--text)]">Outro</option>
          </select>

          {msg && <p className="text-sm text-accent-amber">{msg}</p>}

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              className="btn-glass"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
