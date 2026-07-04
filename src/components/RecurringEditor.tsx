"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { EXPENSE_CATEGORIES, categoryMeta, BRL } from "@/lib/categories";
import { CategoryIcon, Icon } from "@/components/icons";
import type { RecurringRule, CategoryKey } from "@/lib/types";

interface Props {
  rules: RecurringRule[];
  canEdit: boolean;
}

export function RecurringEditor({ rules, canEdit }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"gasto" | "receita">("gasto");
  const [category, setCategory] = useState<CategoryKey>("assinaturas");
  const [account, setAccount] = useState("Nubank");
  const [day, setDay] = useState("5");

  function guard(): boolean {
    if (!isSupabaseConfigured() || !canEdit) {
      setMsg("Entre na sua conta para gerenciar recorrentes.");
      return false;
    }
    return true;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!guard()) return;

    const value = parseFloat(amount.replace(",", "."));
    const dayNum = parseInt(day, 10);
    if (!description.trim() || isNaN(value) || value <= 0) {
      setMsg("Preencha a descrição e um valor maior que zero.");
      return;
    }
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 28) {
      setMsg("O dia deve estar entre 1 e 28 (evita problemas com fevereiro).");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMsg("Sessão expirada, entre novamente.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.from("recurring_rules").insert({
      user_id: user.id,
      description: description.trim(),
      amount: type === "gasto" ? -Math.abs(value) : Math.abs(value),
      category: type === "receita" ? "receita" : category,
      account,
      day_of_month: dayNum,
      active: true,
    });

    setBusy(false);
    if (error) {
      setMsg("Erro ao salvar: " + error.message);
    } else {
      setDescription("");
      setAmount("");
      setOpen(false);
      setMsg("Recorrente criada! Será lançada automaticamente todo mês.");
      router.refresh();
    }
  }

  async function toggle(rule: RecurringRule) {
    if (!guard()) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("recurring_rules")
      .update({ active: !rule.active })
      .eq("id", rule.id);
    setBusy(false);
    if (error) setMsg("Erro: " + error.message);
    else router.refresh();
  }

  async function remove(rule: RecurringRule) {
    if (!guard()) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("recurring_rules")
      .delete()
      .eq("id", rule.id);
    setBusy(false);
    if (error) setMsg("Erro: " + error.message);
    else router.refresh();
  }

  return (
    <div className="glass p-5">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-full"
          style={{
            background: "color-mix(in srgb, #bf5af2 15%, transparent)",
            color: "#bf5af2",
          }}
        >
          <Icon name="calendar" size={17} />
        </span>
        <h3 className="font-semibold">Transações recorrentes</h3>
      </div>
      <p className="text-dim mb-4 text-xs">
        Financiamento, seguro, assinaturas… cadastre uma vez e o lançamento
        entra sozinho todo mês no dia escolhido.
      </p>

      {rules.length > 0 && (
        <ul className="mb-4 space-y-2">
          {rules.map((r) => {
            const meta = categoryMeta(r.category);
            return (
              <li
                key={r.id}
                className={`fill-2 flex items-center gap-3 rounded-2xl p-3 ${
                  r.active ? "" : "opacity-50"
                }`}
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                  style={{ background: `${meta.color}1f`, color: meta.color }}
                >
                  <CategoryIcon category={r.category} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.description}</p>
                  <p className="text-dim text-xs">
                    Todo dia {r.day_of_month} · {meta.label}
                    {r.account ? ` · ${r.account}` : ""}
                    {r.active ? "" : " · pausada"}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    r.amount >= 0 ? "text-accent-green" : ""
                  }`}
                >
                  {r.amount >= 0 ? "+" : "-"}
                  {BRL.format(Math.abs(r.amount))}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => toggle(r)}
                    disabled={busy}
                    className="link-dim grid h-8 w-8 place-items-center rounded-full transition hover:fill-1"
                    aria-label={r.active ? "Pausar" : "Reativar"}
                    title={r.active ? "Pausar" : "Reativar"}
                  >
                    <Icon name={r.active ? "x" : "check"} size={15} />
                  </button>
                  <button
                    onClick={() => remove(r)}
                    disabled={busy}
                    className="grid h-8 w-8 place-items-center rounded-full text-accent-red transition hover:bg-accent-red/10"
                    aria-label="Excluir"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {msg && <p className="mb-3 text-sm text-accent-amber">{msg}</p>}

      {!open ? (
        <button className="btn-glass w-full" onClick={() => setOpen(true)}>
          + Nova recorrente
        </button>
      ) : (
        <form onSubmit={add} className="animate-fadeup space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("gasto")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium ${
                type === "gasto" ? "btn-primary" : "btn-glass"
              }`}
            >
              <Icon name="arrow-down" size={16} /> Gasto
            </button>
            <button
              type="button"
              onClick={() => setType("receita")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium ${
                type === "receita" ? "btn-primary" : "btn-glass"
              }`}
            >
              <Icon name="arrow-up" size={16} /> Receita
            </button>
          </div>

          <input
            className="input-glass"
            placeholder="Descrição (ex: Parcela do carro)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-3">
            <input
              className="input-glass"
              placeholder="Valor (R$)"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="relative w-32 shrink-0">
              <span className="text-dim pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs">
                Dia
              </span>
              <input
                className="input-glass pl-10"
                inputMode="numeric"
                min={1}
                max={28}
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </div>
          </div>

          {type === "gasto" && (
            <select
              className="input-glass"
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryKey)}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key} className="bg-[var(--select-bg)] text-[color:var(--text)]">
                  {c.label}
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

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={busy}>
              {busy ? "Salvando…" : "Salvar recorrente"}
            </button>
            <button type="button" className="btn-glass" onClick={() => setOpen(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {!canEdit && (
        <p className="text-dim mt-2 text-center text-xs">
          Entre na sua conta para cadastrar recorrentes.
        </p>
      )}
    </div>
  );
}
