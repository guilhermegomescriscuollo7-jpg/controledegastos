import { categoryMeta, BRL } from "@/lib/categories";
import { CategoryIcon, Icon } from "@/components/icons";
import type { Subscription } from "@/lib/finance";

export function SubscriptionsPanel({ subs }: { subs: Subscription[] }) {
  if (subs.length === 0) return null;
  const monthly = subs.reduce((s, x) => s + x.amount, 0);

  return (
    <div className="glass p-5">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-full"
          style={{ background: "color-mix(in srgb, #bf5af2 16%, transparent)", color: "#bf5af2" }}
        >
          <Icon name="sparkles" size={17} />
        </span>
        <h3 className="font-semibold">Assinaturas detectadas</h3>
      </div>
      <p className="text-dim mb-4 text-xs">
        {subs.length} cobrança{subs.length > 1 ? "s" : ""} recorrente
        {subs.length > 1 ? "s" : ""} · {BRL.format(monthly)}/mês. Revise o que não usa.
      </p>

      <ul className="space-y-2.5">
        {subs.map((s) => {
          const meta = categoryMeta(s.category);
          return (
            <li key={s.key} className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                style={{ background: `${meta.color}1f`, color: meta.color }}
              >
                <CategoryIcon category={s.category} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium capitalize">{s.name}</p>
                <p className="text-dim text-xs">
                  {s.months} meses · {meta.label}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold">
                {BRL.format(s.amount)}
                <span className="text-dim text-xs">/mês</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
