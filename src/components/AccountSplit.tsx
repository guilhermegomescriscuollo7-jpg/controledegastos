import { BRL } from "@/lib/categories";
import { PanelHeader } from "@/components/PanelHeader";

const COLORS = ["#7c5cff", "#38bdf8", "#34d399", "#fbbf24", "#fb7185"];

interface Props {
  data: { account: string; total: number; pct: number }[];
}

export function AccountSplit({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <div className="glass p-5">
      <PanelHeader
        icon="card"
        color="#7c5cff"
        title="Gastos por conta"
        subtitle="De onde saiu o dinheiro neste mês"
      />
      <ul className="space-y-3">
        {data.map((d, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <li key={d.account}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-medium">{d.account}</span>
                <span>
                  {BRL.format(d.total)}{" "}
                  <span className="text-dim text-xs">
                    ({Math.round(d.pct * 100)}%)
                  </span>
                </span>
              </div>
              <div className="fill-1 h-2 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(d.pct * 100, 2)}%`,
                    background: color,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
