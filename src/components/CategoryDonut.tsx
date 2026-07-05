"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { categoryMeta, BRL } from "@/lib/categories";
import { CategoryIcon } from "@/components/icons";
import type { CategoryKey } from "@/lib/types";

interface Props {
  data: { category: CategoryKey; total: number }[];
}

export function CategoryDonut({ data }: Props) {
  const chartData = data.map((d) => ({
    category: d.category,
    name: categoryMeta(d.category).label,
    value: d.total,
    color: categoryMeta(d.category).color,
  }));
  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="glass p-5">
      <h3 className="mb-1 font-semibold">Para onde vai o dinheiro</h3>
      <p className="text-dim mb-4 text-xs">Gastos do mês por categoria</p>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-[190px] w-[190px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={62}
                outerRadius={90}
                paddingAngle={3}
                cornerRadius={5}
                stroke="none"
              >
                {chartData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.color}
                    style={{ filter: `drop-shadow(0 0 5px ${d.color}55)` }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--tooltip-bg)",
                  border: "1px solid var(--hairline)",
                  borderRadius: 16,
                  color: "var(--text)",
                }}
                itemStyle={{ color: "var(--text)" }}
                formatter={(v: number) => BRL.format(v)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-dim text-[10px] uppercase tracking-wide">Total</span>
            <span className="text-xl font-bold tracking-[-0.02em]">{BRL.format(total)}</span>
            <span className="text-dim mt-0.5 text-[10px]">
              {chartData.length} categoria{chartData.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <ul className="flex-1 space-y-1.5 self-stretch">
          {chartData.slice(0, 6).map((d) => (
            <li key={d.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2.5">
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full"
                  style={{ background: `${d.color}1f`, color: d.color }}
                >
                  <CategoryIcon category={d.category} size={14} />
                </span>
                {d.name}
              </span>
              <span className="text-dim">{BRL.format(d.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
