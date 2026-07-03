import { BRL } from "@/lib/categories";
import { BankBadge } from "@/components/BankBadge";

interface Props {
  data: { account: string; total: number }[];
}

export function AccountBreakdown({ data }: Props) {
  const max = data[0]?.total ?? 1;
  const totalGeral = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="glass p-5">
      <h3 className="mb-1 font-semibold">Gastos por cartão</h3>
      <p className="text-dim mb-4 text-xs">Onde você está gastando mais</p>

      <ul className="space-y-4">
        {data.map((d) => {
          const pct = totalGeral > 0 ? Math.round((d.total / totalGeral) * 100) : 0;
          return (
            <li key={d.account} className="flex items-center gap-3">
              <BankBadge account={d.account} size={38} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{d.account}</span>
                  <span className="text-dim">
                    {BRL.format(d.total)} · {pct}%
                  </span>
                </div>
                <div className="fill-1 h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max((d.total / max) * 100, 3)}%`,
                      background: "var(--accent)",
                    }}
                  />
                </div>
              </div>
            </li>
          );
        })}
        {data.length === 0 && (
          <li className="text-dim text-sm">Nenhum gasto neste mês.</li>
        )}
      </ul>
    </div>
  );
}
