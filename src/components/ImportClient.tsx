"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { guessCategory, categoryMeta, BRL, EXPENSE_CATEGORIES, CATEGORIES } from "@/lib/categories";
import { parseAmount, parseDate } from "@/lib/parse";
import { parsePdfTransactions } from "@/lib/pdf";
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
  const [parsing, setParsing] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);
  const [diag, setDiag] = useState<string[] | null>(null);

  /**
   * Mostra os rascunhos com as categorias por regras e, em paralelo,
   * pede ao Claude uma categorização mais precisa. Sem chave da IA (ou
   * com erro), as sugestões por regras permanecem.
   */
  async function finishParsing(parsed: Draft[]) {
    setAiApplied(false);
    setDrafts(parsed);
    if (!configured) return;

    const idx = parsed
      .map((d, i) => (d.amount < 0 ? i : -1))
      .filter((i) => i >= 0)
      .slice(0, 150);
    if (idx.length === 0) return;

    setAiBusy(true);
    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descriptions: idx.map((i) => parsed[i].description),
        }),
      });
      if (!res.ok) return;
      const { categories } = (await res.json()) as {
        categories: CategoryKey[] | null;
      };
      if (!categories) return;
      setDrafts((cur) =>
        cur.map((d, i) => {
          const pos = idx.indexOf(i);
          return pos >= 0 && d.amount < 0
            ? { ...d, category: categories[pos] }
            : d;
        })
      );
      setAiApplied(true);
    } catch {
      // mantém as categorias por regras
    } finally {
      setAiBusy(false);
    }
  }

  function onFile(file: File) {
    setError(null);
    setDone(null);
    setDiag(null);
    setDrafts([]);
    const isPdf =
      file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (isPdf) handlePdf(file);
    else handleCsv(file);
  }

  async function handlePdf(file: File) {
    setParsing(true);
    try {
      const { drafts: raw, linesRead, sample } = await parsePdfTransactions(file);
      if (!raw.length) {
        if (linesRead === 0) {
          setError(
            "Não consegui extrair texto do PDF. Ele pode ser uma imagem " +
              "escaneada (sem texto). Tente exportar de novo pelo app do banco."
          );
        } else {
          setError(
            `Li ${linesRead} linhas do PDF, mas não reconheci as transações. ` +
              "Veja abaixo as primeiras linhas lidas e me mande um print — assim " +
              "eu ajusto a leitura para o formato do seu banco."
          );
          setDiag(sample);
        }
        return;
      }
      await finishParsing(
        raw.map((d) => ({
          date: d.date,
          description: d.description,
          amount: d.amount,
          category: d.amount > 0 ? "receita" : guessCategory(d.description),
          source: "pdf" as const,
          account,
        }))
      );
    } catch (e) {
      setError(
        "Erro ao ler o PDF: " + (e instanceof Error ? e.message : "desconhecido")
      );
    } finally {
      setParsing(false);
    }
  }

  function handleCsv(file: File) {
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
        void finishParsing(parsed);
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

    // Evita duplicar ao reimportar o mesmo extrato: compara com o que ja
    // existe no banco no mesmo periodo (data + descricao + valor).
    const dates = payload.map((d) => d.date).sort();
    const { data: existing } = await supabase
      .from("transactions")
      .select("date, description, amount")
      .gte("date", dates[0])
      .lte("date", dates[dates.length - 1]);
    const dupKey = (t: { date: string; description: string; amount: number }) =>
      `${t.date}|${t.description.trim().toLowerCase()}|${Number(t.amount).toFixed(2)}`;
    const seen = new Set((existing ?? []).map(dupKey));
    const fresh = payload.filter((d) => !seen.has(dupKey(d)));
    const skipped = payload.length - fresh.length;

    if (fresh.length === 0) {
      setSaving(false);
      setDrafts([]);
      setDone(
        `Nenhuma transação nova: as ${skipped} do arquivo já estavam importadas.`
      );
      return;
    }

    const { error } = await supabase.from("transactions").insert(fresh);
    setSaving(false);
    if (error) {
      setError("Erro ao salvar: " + error.message);
    } else {
      setDone(
        skipped > 0
          ? `${fresh.length} transações importadas (${skipped} duplicadas ignoradas).`
          : `${fresh.length} transações importadas com sucesso!`
      );
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

        <label
          className={`btn-primary inline-flex cursor-pointer items-center gap-2 ${
            parsing ? "pointer-events-none opacity-70" : ""
          }`}
        >
          <Icon name="file" size={16} />
          {parsing ? "Lendo arquivo…" : "Selecionar arquivo (CSV ou PDF)"}
          <input
            type="file"
            accept=".csv,text/csv,.pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </label>
        <p className="text-dim mt-3 text-xs">
          Aceita <strong>CSV</strong> (Nubank) e <strong>PDF</strong> (Sicoob e
          outros). O sistema lê data, descrição e valor e sugere a categoria de
          cada lançamento — você revisa antes de salvar.
        </p>
      </div>

      {error && (
        <div className="glass border-accent-red/40 p-4 text-sm text-accent-red">
          {error}
        </div>
      )}
      {diag && diag.length > 0 && (
        <div className="glass p-4">
          <p className="text-dim mb-2 text-xs font-medium uppercase tracking-wide">
            Primeiras linhas lidas do PDF
          </p>
          <pre className="text-dim max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed">
            {diag.map((l, i) => `${String(i + 1).padStart(2, "0")}  ${l}`).join("\n")}
          </pre>
        </div>
      )}
      {done && (
        <div className="glass flex items-center gap-2 p-4 text-sm text-accent-green">
          <Icon name="check" size={17} strokeWidth={2} />
          {done}
        </div>
      )}

      {drafts.length > 0 && (
        <div className="glass animate-fadeup p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{drafts.length} transações</h3>
              <p className="text-dim text-xs">
                Total de gastos: {BRL.format(total)} ·{" "}
                {aiBusy ? (
                  <span className="text-[color:var(--accent)]">
                    IA revisando as categorias…
                  </span>
                ) : aiApplied ? (
                  <span className="text-accent-green">
                    categorias sugeridas pela IA — revise e salve
                  </span>
                ) : (
                  "revise as categorias"
                )}
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
