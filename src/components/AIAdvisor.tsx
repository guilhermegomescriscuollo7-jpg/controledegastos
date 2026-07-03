"use client";

import { useState } from "react";
import type { FinanceSummary } from "@/lib/finance";
import { categoryMeta, BRL } from "@/lib/categories";

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
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#7c5cff] to-[#38bdf8] text-lg">
            ✦
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
        <div className="mb-3 rounded-2xl border border-accent-red/40 bg-accent-red/10 p-3 text-sm">
          ⚠️ <strong>Você estourou o limite</strong> em:{" "}
          {over.map((c) => categoryMeta(c).label).join(", ")}.
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
                className="fill-2 flex gap-2 rounded-2xl p-3 text-sm"
              >
                <span className="text-accent-green">✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          {data.savings_opportunity > 0 && (
            <div className="rounded-2xl bg-accent-green/10 p-3 text-sm">
              💰 Economia possível estimada:{" "}
              <strong className="text-accent-green">
                {BRL.format(data.savings_opportunity)}
              </strong>{" "}
              por mês.
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
