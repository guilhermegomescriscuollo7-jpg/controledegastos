"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { categoryMeta, BRL, EXPENSE_CATEGORIES } from "@/lib/categories";
import { CategoryIcon, Icon } from "@/components/icons";
import { BankBadge } from "@/components/BankBadge";
import type { Transaction, CategoryKey } from "@/lib/types";

function fmtDate(iso: string) {
  const [, mm, dd] = iso.split("-");
  return `${dd}/${mm}`;
}

export function TransactionManager({
  transactions,
  demo,
}: {
  transactions: Transaction[];
  demo: boolean;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function remove(id: string) {
    if (demo || !isSupabaseConfigured()) {
      setErr("Disponível só com sua conta conectada.");
      setConfirmId(null);
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    setBusy(false);
    setConfirmId(null);
    if (error) setErr("Erro ao excluir: " + error.message);
    else router.refresh();
  }

  return (
    <div className="glass p-2 sm:p-3">
      {err && (
        <p className="px-3 py-2 text-sm text-accent-red">{err}</p>
      )}
      <ul className="divide-y divide-[var(--hairline)]">
        {transactions.map((t) => {
          const meta = categoryMeta(t.category);
          const income = t.amount >= 0;

          if (editingId === t.id) {
            return (
              <li key={t.id} className="px-1 py-2">
                <EditRow
                  tx={t}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                  disabled={demo}
                  onDemo={() => setErr("Disponível só com sua conta conectada.")}
                />
              </li>
            );
          }

          return (
            <li
              key={t.id}
              className="group flex items-center gap-3 px-2 py-3"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                style={{ background: `${meta.color}1f`, color: meta.color }}
              >
                <CategoryIcon category={t.category} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.description}</p>
                <p className="text-dim text-xs">
                  {fmtDate(t.date)} · {meta.label}
                </p>
              </div>

              <BankBadge account={t.account} size={22} />

              <span
                className={`shrink-0 text-sm font-semibold ${
                  income ? "text-accent-green" : ""
                }`}
              >
                {income ? "+" : "-"}
                {BRL.format(Math.abs(t.amount)).replace("R$", "R$ ")}
              </span>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => {
                    setErr(null);
                    setEditingId(t.id);
                  }}
                  className="link-dim grid h-8 w-8 place-items-center rounded-full transition hover:fill-1"
                  aria-label="Editar"
                >
                  <Icon name="edit" size={16} />
                </button>
                <button
                  onClick={() => {
                    setErr(null);
                    setConfirmId(t.id);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-full text-accent-red transition hover:bg-accent-red/10"
                  aria-label="Excluir"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </li>
          );
        })}
        {transactions.length === 0 && (
          <li className="text-dim px-3 py-8 text-center text-sm">
            Nenhuma transação ainda.
          </li>
        )}
      </ul>

      {/* Confirmação de exclusão */}
      {confirmId && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"
          onClick={() => setConfirmId(null)}
        >
          <div
            className="glass animate-fadeup w-full max-w-xs p-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-accent-red/15 text-accent-red">
              <Icon name="trash" size={20} />
            </div>
            <h3 className="font-semibold">Excluir transação?</h3>
            <p className="text-dim mt-1 text-sm">
              Essa ação não pode ser desfeita.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="btn-glass flex-1"
                onClick={() => setConfirmId(null)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 rounded-full bg-accent-red px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
                onClick={() => remove(confirmId)}
                disabled={busy}
              >
                {busy ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditRow({
  tx,
  onCancel,
  onSaved,
  disabled,
  onDemo,
}: {
  tx: Transaction;
  onCancel: () => void;
  onSaved: () => void;
  disabled: boolean;
  onDemo: () => void;
}) {
  const [description, setDescription] = useState(tx.description);
  const [amount, setAmount] = useState(String(Math.abs(tx.amount)));
  const [type, setType] = useState<"gasto" | "receita">(
    tx.amount >= 0 ? "receita" : "gasto"
  );
  const [category, setCategory] = useState<CategoryKey>(
    tx.category === "receita" ? "mercado" : tx.category
  );
  const [account, setAccount] = useState(tx.account ?? "Nubank");
  const [date, setDate] = useState(tx.date);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (disabled || !isSupabaseConfigured()) {
      onDemo();
      onCancel();
      return;
    }
    const value = parseFloat(amount.replace(",", "."));
    if (!description || isNaN(value)) {
      setMsg("Preencha descrição e valor.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .update({
        description,
        amount: type === "gasto" ? -Math.abs(value) : Math.abs(value),
        category: type === "receita" ? "receita" : category,
        date,
        account,
      })
      .eq("id", tx.id);
    setSaving(false);
    if (error) setMsg("Erro: " + error.message);
    else onSaved();
  }

  return (
    <div className="fill-2 space-y-2.5 rounded-2xl p-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("gasto")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-medium ${
            type === "gasto" ? "btn-primary" : "btn-glass"
          }`}
        >
          <Icon name="arrow-down" size={15} /> Gasto
        </button>
        <button
          type="button"
          onClick={() => setType("receita")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-medium ${
            type === "receita" ? "btn-primary" : "btn-glass"
          }`}
        >
          <Icon name="arrow-up" size={15} /> Receita
        </button>
      </div>
      <input
        className="input-glass"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descrição"
      />
      <div className="flex gap-2">
        <input
          className="input-glass"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Valor"
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
      {msg && <p className="text-sm text-accent-amber">{msg}</p>}
      <div className="flex gap-2">
        <button className="btn-primary flex-1" onClick={save} disabled={saving}>
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button className="btn-glass" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
