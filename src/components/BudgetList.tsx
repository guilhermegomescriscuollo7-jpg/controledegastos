import { categoryMeta, BRL } from "@/lib/categories";
import type { FinanceSummary } from "@/lib/finance";

export function BudgetList({ status }: { status: FinanceSummary["budgetStatus"] }) {
  const sorted = [...status].sort((a, b) => b.pct - a.pct);
  return (
    <div className="glass p-5">
      <h3 className="mb-1 font-semibold">Limites por categoria</h3>
      <p className="text-dim mb-4 text-xs">
        Barras vermelhas = você passou do limite do mês
      </p>
      <ul className="space-y-4">
        {sorted.map((b) => {
          const meta = categoryMeta(b.category);
          const pct = Math.min(b.pct, 1.15);
          const barColor = b.over
            ? "#fb7185"
            : b.pct > 0.8
            ? "#fbbf24"
            : meta.color;
          return (
            <li key={b.category}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>
                  {meta.emoji} {meta.label}
                </span>
                <span className={b.over ? "font-semibold text-accent-red" : "text-dim"}>
                  {BRL.format(b.spent)} / {BRL.format(b.limit)}
                </span>
              </div>
              <div className="fill-1 h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(pct * 100, 2)}%`,
                    background: barColor,
                    boxShadow: `0 0 12px ${barColor}88`,
                  }}
                />
              </div>
            </li>
          );
        })}
        {sorted.length === 0 && (
          <li className="text-dim text-sm">
            Nenhum limite definido ainda. Configure em Ajustes.
          </li>
        )}
      </ul>
    </div>
  );
}
