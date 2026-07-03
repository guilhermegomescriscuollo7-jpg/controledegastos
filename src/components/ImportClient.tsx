"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { guessCategory, categoryMeta, BRL, EXPENSE_CATEGORIES, CATEGORIES } from "@/lib/categories";
import { CategoryIcon, Icon } from "@/components/icons";
import type { CategoryKey, Transaction } from "@/lib/types";

type Draft = Omit<Transaction, "id">;

// Normaliza cabecalhos: minusculo, sem acento
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

// Converte "1.234,56" ou "-1234.56" ou "R$ 100,00" em number
function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let s = raw.replace(/[R$\s]/g, "").trim();
  if (!s) return null;
  const neg = /^-/.test(s) || /\(.*\)/.test(s);
  s = s.replace(/[()]/g, "").replace(/^-/, "");
  // formato BR: 1.234,56  -> tira pontos, troca virgula por ponto
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return neg ? -n : n;
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  // dd/mm/yyyy
  let m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // yyyy-mm-dd
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // dd/mm/yy
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (m) return `20${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

const DATE_KEYS = ["data", "date", "data da compra", "data lancamento", "data do lancamento"];
const DESC_KEYS = ["descricao", "description", "titulo", "title", "estabelecimento", "historico", "lancamento"];
const AMOUNT_KEYS = ["valor", "amount", "value", "montante", "valor (r$)"];

export function ImportClient() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [account, setAccount] = useState("Nubank");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function handleFile(file: File) {
    setError(null);
    setDone(false);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        if (!rows.length) {
          setError("Arquivo vazio ou não reconhecido.");
          return;
        }
        const headers = Object.keys(rows[0]).map(norm);
        const find = (cands: string[]) => {
          const original = Object.keys(rows[0]);
          const idx = headers.findIndex((h) => cands.some((c) => h.includes(c)));
          return idx >= 0 ? original[idx] : null;
        };
        const dateCol = find(DATE_KEYS);
        const descCol = find(DESC_KEYS);
        const amountCol = find(AMOUNT_KEYS);

        if (!dateCol || !descCol || !amountCol) {
          setError(
            `Não achei as colunas certas. Encontrei: ${Object.keys(rows[0]).join(", ")}. ` +
              "Preciso de data, descrição e valor."
          );
          return;
        }

        const parsed: Draft[] = [];
        for (const row of rows) {
          const date = parseDate(row[dateCol]);
          const amount = parseAmount(row[amountCol]);
          const description = (row[descCol] ?? "").trim();
          if (!date || amount === null || !description) continue;
          const isIncome = amount > 0;
          parsed.push({
            date,
            description,
            amount,
            category: isIncome ? "receita" : guessCategory(description),
            source: "csv",
            account,
          });
        }
        if (!parsed.length) {
          setError("Não consegui ler nenhuma linha válida.");
          return;
        }
        setDrafts(parsed);
      },
      error: (err) => setError("Erro ao ler CSV: " + err.message),
    });
  }

  function updateCategory(i: number, cat: CategoryKey) {
    setDrafts((d) => d.map((t, idx) => (idx === i ? { ...t, category: cat } : t)));
  }

  async function save() {
    if (!configured) {
      setError("Conecte o Supabase (aba Ajustes) para salvar as transações importadas.");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Entre na sua conta antes de importar.");
      setSaving(false);
      return;
    }
    const payload = drafts.map((d) => ({ ...d, user_id: user.id }));
    const { error } = await supabase.from("transactions").insert(payload);
    setSaving(false);
    if (error) {
      setError("Erro ao salvar: " + error.message);
    } else {
      setDone(true);
      setDrafts([]);
      router.refresh();
    }
  }

  const total = drafts.reduce((s, d) => s + (d.amount < 0 ? Math.abs(d.amount) : 0), 0);

  return (
    <div className="space-y-5">
      <div className="glass p-5">
        <label className="text-dim mb-2 block text-sm font-medium">
          Conta de origem
        </label>
        <select
          className="input-glass mb-4"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
        >
          <option className="bg-[var(--select-bg)] text-[color:var(--text)]">Nubank</option>
          <option className="bg-[var(--select-bg)] text-[color:var(--text)]">Sicoob</option>
          <option className="bg-[var(--select-bg)] text-[color:var(--text)]">Outro</option>
        </select>

        <label className="btn-primary inline-block cursor-pointer">
          Selecionar arquivo CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
        <p className="text-dim mt-3 text-xs">
          Baixe o extrato/fatura em <strong>CSV</strong> no app do{" "}
          {account}. O sistema detecta as colunas de data, descrição e valor
          automaticamente e sugere a categoria.
        </p>
      </div>

      {error && (
        <div className="glass border-accent-red/40 p-4 text-sm text-accent-red">
          {error}
        </div>
      )}
      {done && (
        <div className="glass flex items-center gap-2 p-4 text-sm text-accent-green">
          <Icon name="check" size={17} strokeWidth={2} />
          Transações importadas com sucesso!
        </div>
      )}

      {drafts.length > 0 && (
        <div className="glass animate-fadeup p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{drafts.length} transações</h3>
              <p className="text-dim text-xs">
                Total de gastos: {BRL.format(total)} · revise as categorias
              </p>
            </div>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? "Salvando…" : "Importar tudo"}
            </button>
          </div>
          <ul className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {drafts.map((d, i) => (
              <li
                key={i}
                className="fill-2 flex items-center gap-3 rounded-2xl p-3"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                  style={{
                    background: `${categoryMeta(d.category).color}1f`,
                    color: categoryMeta(d.category).color,
                  }}
                >
                  <CategoryIcon category={d.category} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{d.description}</p>
                  <p className="text-dim text-xs">
                    {d.date.split("-").reverse().join("/")}
                  </p>
                </div>
                {d.category !== "receita" ? (
                  <select
                    className="fill-1 rounded-xl px-2 py-1 text-xs outline-none"
                    value={d.category}
                    onChange={(e) => updateCategory(i, e.target.value as CategoryKey)}
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key} className="bg-[var(--select-bg)] text-[color:var(--text)]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-accent-green">
                    {CATEGORIES.receita.label}
                  </span>
                )}
                <span
                  className={`w-24 text-right text-sm font-semibold ${
                    d.amount >= 0 ? "text-accent-green" : ""
                  }`}
                >
                  {d.amount >= 0 ? "+" : "-"}
                  {BRL.format(Math.abs(d.amount))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
