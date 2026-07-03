"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { categoryMeta, BRL } from "@/lib/categories";
import type { CategoryKey } from "@/lib/types";

interface Props {
  data: { category: CategoryKey; total: number }[];
}

export function CategoryDonut({ data }: Props) {
  const chartData = data.map((d) => ({
    name: categoryMeta(d.category).label,
    value: d.total,
    color: categoryMeta(d.category).color,
    emoji: categoryMeta(d.category).emoji,
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
                stroke="none"
              >
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
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
            <span className="text-dim text-[10px] uppercase">Total</span>
            <span className="text-lg font-bold">{BRL.format(total)}</span>
          </div>
        </div>
        <ul className="flex-1 space-y-1.5 self-stretch">
          {chartData.slice(0, 6).map((d) => (
            <li key={d.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: d.color }}
                />
                {d.emoji} {d.name}
              </span>
              <span className="text-dim">{BRL.format(d.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
