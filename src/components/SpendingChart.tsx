"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BRL } from "@/lib/categories";
import { PanelHeader } from "@/components/PanelHeader";

interface Props {
  data: { day: string; acumulado: number }[];
}

export function SpendingChart({ data }: Props) {
  return (
    <div className="glass p-5">
      <PanelHeader
        icon="scale"
        color="#0a84ff"
        title="Gasto acumulado no mês"
        subtitle="Quanto você já gastou dia a dia"
      />
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ left: -18, right: 8, top: 4 }}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a84ff" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#0a84ff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={54}
            tickFormatter={(v) => `R$${Math.round(v / 100) / 10}k`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--tooltip-bg)",
              border: "1px solid var(--hairline)",
              borderRadius: 16,
              backdropFilter: "blur(12px)",
              color: "var(--text)",
            }}
            labelStyle={{ color: "var(--text)" }}
            itemStyle={{ color: "var(--text)" }}
            formatter={(v: number) => [BRL.format(v), "Acumulado"]}
            labelFormatter={(l) => `Dia ${l}`}
          />
          <Area
            type="monotone"
            dataKey="acumulado"
            stroke="#0a84ff"
            strokeWidth={2.5}
            fill="url(#grad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
