"use client";

import { useState } from "react";
import type { FinanceSummary } from "@/lib/finance";
import { categoryMeta, BRL } from "@/lib/categories";
import { Icon } from "@/components/icons";

interface Props {
  summary: FinanceSummary;
  savingsTarget: number;
}

interface AIResponse {
  headline: string;
  tips: string[];
  savings_opportunity: number;
  source: "claude" | "regras";
}

export function AIAdvisor({ summary, savingsTarget }: Props) {
  const [data, setData] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, savingsTarget }),
      });
      if (!res.ok) throw new Error("Falha ao consultar a IA");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  const over = summary.overBudget;

  return (
    <div className="glass glass-strong p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-full text-white"
            style={{ background: "var(--accent)" }}
          >
            <Icon name="sparkles" size={18} strokeWidth={1.6} />
          </span>
          <div>
            <h3 className="font-semibold leading-tight">Consultor IA</h3>
            <p className="text-dim text-xs">Dicas para você guardar mais</p>
          </div>
        </div>
        <button className="btn-primary" onClick={ask} disabled={loading}>
          {loading ? "Analisando…" : data ? "Atualizar" : "Analisar meus gastos"}
        </button>
      </div>

      {over.length > 0 && (
        <div className="mb-3 flex items-start gap-2 rounded-2xl border border-accent-red/40 bg-accent-red/10 p-3 text-sm">
          <Icon name="alert" size={17} className="mt-0.5 shrink-0 text-accent-red" />
          <span>
            <strong>Você estourou o limite</strong> em:{" "}
            {over.map((c) => categoryMeta(c).label).join(", ")}.
          </span>
        </div>
      )}

      {error && <p className="text-sm text-accent-red">{error}</p>}

      {!data && !loading && (
        <p className="text-dim text-sm">
          Clique em <em>Analisar meus gastos</em> para receber um plano
          personalizado de economia baseado no seu mês atual.
        </p>
      )}

      {data && (
        <div className="animate-fadeup space-y-3">
          <p className="text-[15px] font-medium">{data.headline}</p>
          <ul className="space-y-2">
            {data.tips.map((t, i) => (
              <li
                key={i}
                className="fill-2 flex gap-2.5 rounded-2xl p-3 text-sm"
              >
                <Icon
                  name="check"
                  size={17}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-accent-green"
                />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          {data.savings_opportunity > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-accent-green/10 p-3 text-sm">
              <Icon name="wallet" size={17} className="shrink-0 text-accent-green" />
              <span>
                Economia possível estimada:{" "}
                <strong className="text-accent-green">
                  {BRL.format(data.savings_opportunity)}
                </strong>{" "}
                por mês.
              </span>
            </div>
          )}
          <p className="text-dim text-right text-[10px]">
            fonte: {data.source === "claude" ? "Claude (IA)" : "regras locais"}
          </p>
        </div>
      )}
    </div>
  );
}
