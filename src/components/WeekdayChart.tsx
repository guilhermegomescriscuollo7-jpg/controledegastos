"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BRL } from "@/lib/categories";

interface Props {
  data: { label: string; total: number }[];
}

export function WeekdayChart({ data }: Props) {
  if (!data.some((d) => d.total > 0)) return null;

  return (
    <div className="glass p-5">
      <h3 className="mb-1 font-semibold">Gasto por dia da semana</h3>
      <p className="text-dim mb-4 text-xs">
        Em quais dias o dinheiro mais escapa neste mês
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: -18, right: 8, top: 4 }}>
          <defs>
            <linearGradient id="wkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5e5ce6" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#5e5ce6" stopOpacity={0.4} />
            </linearGradient>
          </defs>
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
          <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="url(#wkGrad)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
