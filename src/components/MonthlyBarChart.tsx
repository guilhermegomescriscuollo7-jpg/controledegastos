"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { BRL } from "@/lib/categories";

interface Props {
  data: { key: string; label: string; total: number }[];
  currentKey: string;
}

export function MonthlyBarChart({ data, currentKey }: Props) {
  return (
    <div className="glass p-5">
      <h3 className="mb-1 font-semibold">Evolução dos gastos</h3>
      <p className="text-dim mb-4 text-xs">Total gasto nos últimos meses</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: -12, right: 8, top: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={54}
            tickFormatter={(v) => `R$${Math.round(v / 100) / 10}k`}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            contentStyle={{
              background: "var(--tooltip-bg)",
              border: "1px solid var(--hairline)",
              borderRadius: 16,
              color: "var(--text)",
            }}
            itemStyle={{ color: "var(--text)" }}
            formatter={(v: number) => [BRL.format(v), "Gastos"]}
          />
          <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={44}>
            {data.map((d) => (
              <Cell
                key={d.key}
                fill={d.key === currentKey ? "#0a84ff" : "#48484a"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
