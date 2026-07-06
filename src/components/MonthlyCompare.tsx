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
import { PanelHeader } from "@/components/PanelHeader";

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
      <PanelHeader
        icon="calendar"
        color="#0a84ff"
        title="Comparativo mensal"
        subtitle={`Total de gastos nos últimos ${data.length} meses`}
      />
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: -18, right: 8, top: 4 }}>
          <defs>
            <linearGradient id="mcOn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="mcOff" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a84ff" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#0a84ff" stopOpacity={0.15} />
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
          <Bar dataKey="total" radius={[8, 8, 0, 0]}>
            {data.map((d) => (
              <Cell
                key={d.month}
                fill={d.month === selectedMonth ? "url(#mcOn)" : "url(#mcOff)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
