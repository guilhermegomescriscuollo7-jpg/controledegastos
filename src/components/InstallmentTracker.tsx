import { categoryMeta, BRL } from "@/lib/categories";
import { CategoryIcon, Icon } from "@/components/icons";
import type { InstallmentPlan } from "@/lib/finance";

export function InstallmentTracker({ plans }: { plans: InstallmentPlan[] }) {
  if (plans.length === 0) return null;
  const totalRemaining = plans.reduce((s, p) => s + p.remainingValue, 0);

  return (
    <div className="glass p-5">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-full"
          style={{ background: "color-mix(in srgb, #6d8cff 16%, transparent)", color: "#6d8cff" }}
        >
          <Icon name="layers" size={17} />
        </span>
        <h3 className="font-semibold">Parcelados em aberto</h3>
      </div>
      <p className="text-dim mb-4 text-xs">
        Ainda falta pagar {BRL.format(totalRemaining)}
      </p>

      <ul className="space-y-3.5">
        {plans.map((p) => {
          const meta = categoryMeta(p.category);
          const pct = Math.round((p.current / p.total) * 100);
          return (
            <li key={p.key}>
              <div className="mb-1.5 flex items-center gap-2.5">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                  style={{ background: `${meta.color}1f`, color: meta.color }}
                >
                  <CategoryIcon category={p.category} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.description}</p>
                  <p className="text-dim text-xs">
                    Parcela {p.current}/{p.total} · faltam {p.remaining} ·{" "}
                    {BRL.format(p.amount)}/mês
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {BRL.format(p.remainingValue)}
                </span>
              </div>
              <div className="fill-1 h-2 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.max(pct, 3)}%`, background: meta.color }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
