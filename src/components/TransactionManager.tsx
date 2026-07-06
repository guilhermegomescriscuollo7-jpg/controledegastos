"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { categoryMeta, BRL, EXPENSE_CATEGORIES, CATEGORIES } from "@/lib/categories";
import { CategoryIcon, Icon } from "@/components/icons";
import type { Transaction, CategoryKey } from "@/lib/types";

function fmtDate(iso: string) {
  const [, mm, dd] = iso.split("-");
  return `${dd}/${mm}`;
}

const MESES_LONGO = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
function fmtMonth(key: string) {
  const [y, m] = key.split("-");
  return `${MESES_LONGO[Number(m) - 1]} ${y}`;
}

function exportCsv(transactions: Transaction[]) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [
    "data,descricao,valor,categoria,conta",
    ...transactions.map((t) =>
      [
        t.date,
        esc(t.description),
        String(t.amount).replace(".", ","),
        categoryMeta(t.category).label,
        t.account ?? "",
      ].join(",")
    ),
  ];
  // BOM para o Excel abrir acentos corretamente
  const blob = new Blob(["﻿" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transacoes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<CategoryKey | "todas">("todas");
  const [monthFilter, setMonthFilter] = useState<string>("todos");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Meses presentes nas transações (yyyy-mm), do mais recente ao mais antigo.
  const months = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) set.add(t.date.slice(0, 7));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (monthFilter !== "todos" && !t.date.startsWith(monthFilter)) return false;
      if (catFilter !== "todas" && t.category !== catFilter) return false;
      if (!q) return true;
      return (
        t.description.toLowerCase().includes(q) ||
        (t.account ?? "").toLowerCase().includes(q)
      );
    });
  }, [transactions, search, catFilter, monthFilter]);

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
      {/* Busca, filtro e exportação */}
      <div className="flex flex-wrap items-center gap-2 px-2 pb-2 pt-1">
        <div className="relative min-w-[160px] flex-1">
          <Icon
            name="search"
            size={15}
            className="text-dim pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            className="input-glass py-2 pl-9 text-sm"
            placeholder="Buscar por descrição ou conta"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {months.length > 1 && (
          <select
            className="input-glass w-auto py-2 text-sm"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            aria-label="Filtrar por mês"
          >
            <option value="todos" className="bg-[var(--select-bg)] text-[color:var(--text)]">
              Todos os meses
            </option>
            {months.map((mk) => (
              <option key={mk} value={mk} className="bg-[var(--select-bg)] text-[color:var(--text)]">
                {fmtMonth(mk)}
              </option>
            ))}
          </select>
        )}
        <select
          className="input-glass w-auto py-2 text-sm"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value as CategoryKey | "todas")}
          aria-label="Filtrar por categoria"
        >
          <option value="todas" className="bg-[var(--select-bg)] text-[color:var(--text)]">
            Todas as categorias
          </option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key} className="bg-[var(--select-bg)] text-[color:var(--text)]">
              {c.label}
            </option>
          ))}
          <option value="receita" className="bg-[var(--select-bg)] text-[color:var(--text)]">
            {CATEGORIES.receita.label}
          </option>
        </select>
        <button
          className="btn-glass flex items-center gap-1.5 py-2 text-sm"
          onClick={() => exportCsv(filtered)}
          disabled={filtered.length === 0}
        >
          <Icon name="file" size={15} /> Exportar CSV
        </button>
      </div>

      {(monthFilter !== "todos" || catFilter !== "todas" || search.trim()) && (
        <p className="text-dim px-3 pb-1 pt-0.5 text-xs">
          {filtered.length} lançamento{filtered.length !== 1 ? "s" : ""}
          {" · "}
          <span className="text-accent-red">
            gastos {BRL.format(filtered.reduce((s, t) => (t.amount < 0 ? s + Math.abs(t.amount) : s), 0))}
          </span>
          {" · "}
          <span className="text-accent-green">
            receitas {BRL.format(filtered.reduce((s, t) => (t.amount > 0 ? s + t.amount : s), 0))}
          </span>
        </p>
      )}

      {err && (
        <p className="px-3 py-2 text-sm text-accent-red">{err}</p>
      )}
      <ul className="divide-y divide-[var(--hairline)]">
        {filtered.map((t) => {
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
                  {t.account ? ` · ${t.account}` : ""}
                </p>
              </div>

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
        {filtered.length === 0 && (
          <li className="text-dim px-3 py-8 text-center text-sm">
            {transactions.length === 0
              ? "Nenhuma transação ainda."
              : "Nenhuma transação encontrada com esses filtros."}
          </li>
        )}
      </ul>

      {/* Confirmação de exclusão (portal para não ficar preso no .page-enter) */}
      {confirmId &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4"
            onClick={() => setConfirmId(null)}
          >
            <div
              className="glass animate-fadeup w-full max-w-xs p-5 text-center"
              style={{ background: "var(--popover-bg)" }}
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
          </div>,
          document.body
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
    if (!description.trim() || isNaN(value) || value <= 0) {
      setMsg("Preencha a descrição e um valor maior que zero.");
      return;
    }
    const year = Number(date.slice(0, 4));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || year < 2000 || year > new Date().getFullYear() + 1) {
      setMsg("Data inválida.");
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
