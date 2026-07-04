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
  data: { month: string; label: string; total: number }[];
  /** mes selecionado no dashboard (yyyy-mm), destacado no grafico */
  selectedMonth: string;
}

export function MonthlyCompare({ data, selectedMonth }: Props) {
  const hasData = data.some((d) => d.total > 0);
  if (!hasData) return null;

  return (
    <div className="glass p-5">
      <h3 className="mb-1 font-semibold">Comparativo mensal</h3>
      <p className="text-dim mb-4 text-xs">
        Total de gastos nos últimos {data.length} meses
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: -18, right: 8, top: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={54}
            tickFormatter={(v) => `R$${Math.round(v / 100) / 10}k`}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-1)" }}
            contentStyle={{
              background: "var(--tooltip-bg)",
              border: "1px solid var(--hairline)",
              borderRadius: 16,
              backdropFilter: "blur(12px)",
              color: "var(--text)",
            }}
            labelStyle={{ color: "var(--text)" }}
            itemStyle={{ color: "var(--text)" }}
            formatter={(v: number) => [BRL.format(v), "Gastos"]}
          />
          <Bar dataKey="total" radius={[8, 8, 0, 0]}>
            {data.map((d) => (
              <Cell
                key={d.month}
                fill={d.month === selectedMonth ? "var(--accent)" : "#0a84ff55"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
