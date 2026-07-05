"use client";

import { categoryMeta, BRL } from "@/lib/categories";
import { Icon, type IconName } from "@/components/icons";
import type { CategoryDelta } from "@/lib/finance";
import type { CategoryKey } from "@/lib/types";

type Tone = "good" | "bad" | "warn" | "info";

const TONE: Record<Tone, string> = {
  good: "#34c759",
  bad: "#ff375f",
  warn: "#ff9f0a",
  info: "var(--accent)",
};

interface Insight {
  icon: IconName;
  tone: Tone;
  text: React.ReactNode;
}

interface Props {
  deltas: CategoryDelta[];
  balance: number;
  savingsTarget: number;
  forecast: { projected: number; avgDaily: number; isCurrent: boolean };
  topExpense?: { description: string; amount: number; category: CategoryKey };
}

function pctTxt(p: number | null) {
  if (p === null) return "";
  return ` (${p > 0 ? "+" : ""}${Math.round(p * 100)}%)`;
}

function buildInsights({
  deltas,
  balance,
  savingsTarget,
  forecast,
  topExpense,
}: Props): Insight[] {
  const out: Insight[] = [];

  // Maior alta vs. mês anterior
  const up = deltas.find((d) => d.diff > 0 && d.previous > 0);
  if (up) {
    out.push({
      icon: "arrow-up",
      tone: "bad",
      text: (
        <>
          Gastos com <strong>{categoryMeta(up.category).label}</strong> subiram{" "}
          {BRL.format(up.diff)}
          {pctTxt(up.pct)} vs. o mês passado.
        </>
      ),
    });
  }

  // Maior corte (bom)
  const down = [...deltas].sort((a, b) => a.diff - b.diff)[0];
  if (down && down.diff < 0 && down.previous > 0) {
    out.push({
      icon: "arrow-down",
      tone: "good",
      text: (
        <>
          Você cortou {BRL.format(Math.abs(down.diff))}
          {pctTxt(down.pct)} em <strong>{categoryMeta(down.category).label}</strong>. Mandou bem!
        </>
      ),
    });
  }

  // Meta / saldo
  if (savingsTarget > 0) {
    if (balance >= savingsTarget) {
      out.push({
        icon: "check",
        tone: "good",
        text: (
          <>
            Meta batida: já guardou <strong>{BRL.format(balance)}</strong> (meta{" "}
            {BRL.format(savingsTarget)}).
          </>
        ),
      });
    } else {
      out.push({
        icon: "target",
        tone: balance > 0 ? "warn" : "bad",
        text: (
          <>
            Faltam <strong>{BRL.format(savingsTarget - balance)}</strong> para a
            meta de {BRL.format(savingsTarget)}.
          </>
        ),
      });
    }
  } else {
    out.push({
      icon: balance >= 0 ? "check" : "alert",
      tone: balance >= 0 ? "good" : "bad",
      text:
        balance >= 0 ? (
          <>
            Você fechou positivo em <strong>{BRL.format(balance)}</strong> este mês.
          </>
        ) : (
          <>
            Saldo negativo em <strong>{BRL.format(Math.abs(balance))}</strong> —
            segure os gastos.
          </>
        ),
    });
  }

  // Projeção do ritmo (só no mês corrente)
  if (forecast.isCurrent && forecast.avgDaily > 0) {
    out.push({
      icon: "scale",
      tone: "info",
      text: (
        <>
          No ritmo de {BRL.format(forecast.avgDaily)}/dia, o mês deve fechar em{" "}
          <strong>{BRL.format(forecast.projected)}</strong> de gastos.
        </>
      ),
    });
  }

  // Maior gasto individual
  if (topExpense) {
    out.push({
      icon: "sparkles",
      tone: "info",
      text: (
        <>
          Maior gasto: <strong>{topExpense.description}</strong> (
          {BRL.format(Math.abs(topExpense.amount))}).
        </>
      ),
    });
  }

  return out;
}

export function SmartInsights(props: Props) {
  const insights = buildInsights(props).slice(0, 4);
  if (insights.length === 0) return null;

  return (
    <div className="glass p-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-full text-white"
          style={{ background: "var(--accent)" }}
        >
          <Icon name="sparkles" size={17} />
        </span>
        <div>
          <h3 className="font-semibold leading-tight">Análise do mês</h3>
          <p className="text-dim text-xs">Destaques automáticos dos seus números</p>
        </div>
      </div>

      <ul className="space-y-2">
        {insights.map((it, i) => (
          <li
            key={i}
            className="fill-2 animate-fadeup flex items-start gap-2.5 rounded-2xl p-3 text-sm"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span
              className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full"
              style={{
                background: `color-mix(in srgb, ${TONE[it.tone]} 16%, transparent)`,
                color: TONE[it.tone],
              }}
            >
              <Icon name={it.icon} size={14} strokeWidth={2} />
            </span>
            <span>{it.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
