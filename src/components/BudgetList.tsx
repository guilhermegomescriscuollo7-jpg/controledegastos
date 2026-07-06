import { categoryMeta, BRL } from "@/lib/categories";
import { CategoryIcon } from "@/components/icons";
import { PanelHeader } from "@/components/PanelHeader";
import type { FinanceSummary } from "@/lib/finance";

export function BudgetList({ status }: { status: FinanceSummary["budgetStatus"] }) {
  const sorted = [...status].sort((a, b) => b.pct - a.pct);
  return (
    <div className="glass p-5">
      <PanelHeader
        icon="target"
        color="#ff9f0a"
        title="Limites por categoria"
        subtitle="Barras vermelhas = você passou do limite do mês"
      />
      <ul className="space-y-4">
        {sorted.map((b) => {
          const meta = categoryMeta(b.category);
          const pct = Math.min(b.pct, 1.15);
          const barColor = b.over
            ? "#ff375f"
            : b.pct > 0.8
            ? "#ff9f0a"
            : meta.color;
          return (
            <li key={b.category}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <CategoryIcon
                    category={b.category}
                    size={17}
                    className="shrink-0"
                  />
                  {meta.label}
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
