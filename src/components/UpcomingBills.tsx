import { categoryMeta, BRL } from "@/lib/categories";
import { CategoryIcon, Icon } from "@/components/icons";
import type { UpcomingBill } from "@/lib/recurring";

function fmtDate(iso: string) {
  const [, mm, dd] = iso.split("-");
  return `${dd}/${mm}`;
}

function whenLabel(days: number) {
  if (days <= 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

export function UpcomingBills({ bills }: { bills: UpcomingBill[] }) {
  if (bills.length === 0) return null;
  const total = bills.reduce((s, b) => s + Math.abs(b.rule.amount), 0);

  return (
    <div className="glass p-5">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-full"
          style={{ background: "color-mix(in srgb, #ff9f0a 15%, transparent)", color: "#ff9f0a" }}
        >
          <Icon name="calendar" size={17} />
        </span>
        <h3 className="font-semibold">Contas a pagar</h3>
      </div>
      <p className="text-dim mb-4 text-xs">
        Próximos vencimentos · {BRL.format(total)} no total
      </p>

      <ul className="space-y-2.5">
        {bills.map((b) => {
          const meta = categoryMeta(b.rule.category);
          const soon = b.daysUntil <= 3;
          return (
            <li key={b.rule.id} className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                style={{ background: `${meta.color}1f`, color: meta.color }}
              >
                <CategoryIcon category={b.rule.category} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{b.rule.description}</p>
                <p className={`text-xs ${soon ? "text-accent-amber" : "text-dim"}`}>
                  Vence dia {fmtDate(b.dueDate)} · {whenLabel(b.daysUntil)}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold">
                {BRL.format(Math.abs(b.rule.amount))}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
