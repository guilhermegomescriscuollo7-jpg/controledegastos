import { categoryMeta, BRL } from "@/lib/categories";
import { CategoryIcon } from "@/components/icons";
import { PanelHeader } from "@/components/PanelHeader";
import type { Transaction } from "@/lib/types";

function fmtDate(iso: string) {
  const [, mm, dd] = iso.split("-");
  return `${dd}/${mm}`;
}

export function TopExpenses({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) return null;

  return (
    <div className="glass p-5">
      <PanelHeader
        icon="arrow-down"
        color="#ff375f"
        title="Maiores gastos do mês"
        subtitle={`Os ${transactions.length} lançamentos que mais pesaram`}
      />
      <ul className="space-y-2.5">
        {transactions.map((t, i) => {
          const meta = categoryMeta(t.category);
          return (
            <li key={t.id} className="flex items-center gap-3">
              <span className="text-dim w-5 shrink-0 text-center text-sm font-semibold">
                {i + 1}
              </span>
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                style={{ background: `${meta.color}1f`, color: meta.color }}
              >
                <CategoryIcon category={t.category} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.description}</p>
                <p className="text-dim text-xs">
                  {fmtDate(t.date)} · {meta.label}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold">
                {BRL.format(Math.abs(t.amount))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
