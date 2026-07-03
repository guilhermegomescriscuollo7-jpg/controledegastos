import { categoryMeta, BRL } from "@/lib/categories";
import type { Transaction } from "@/lib/types";

function fmtDate(iso: string) {
  const [, mm, dd] = iso.split("-");
  return `${dd}/${mm}`;
}

export function TransactionList({
  transactions,
  limit,
}: {
  transactions: Transaction[];
  limit?: number;
}) {
  const list = limit ? transactions.slice(0, limit) : transactions;
  return (
    <div className="glass p-2 sm:p-3">
      <ul className="divide-y divide-[var(--hairline)]">
        {list.map((t) => {
          const meta = categoryMeta(t.category);
          const income = t.amount >= 0;
          return (
            <li key={t.id} className="flex items-center gap-3 px-2 py-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg"
                style={{ background: `${meta.color}22` }}
              >
                {meta.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.description}</p>
                <p className="text-dim text-xs">
                  {fmtDate(t.date)} · {meta.label}
                  {t.account ? ` · ${t.account}` : ""}
                </p>
              </div>
              <span
                className={`shrink-0 text-sm font-semibold ${
                  income ? "text-accent-green" : ""
                }`}
              >
                {income ? "+" : "-"}
                {BRL.format(Math.abs(t.amount)).replace("R$", "R$ ")}
              </span>
            </li>
          );
        })}
        {list.length === 0 && (
          <li className="text-dim px-3 py-8 text-center text-sm">
            Nenhuma transação ainda.
          </li>
        )}
      </ul>
    </div>
  );
}
