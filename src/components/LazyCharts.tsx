"use client";

import dynamic from "next/dynamic";

// Placeholder enquanto o recharts (pesado) carrega sob demanda no cliente.
function ChartSkeleton() {
  return <div className="glass h-64 animate-pulse" />;
}

// Carrega o recharts só no cliente e sob demanda — reduz o bundle inicial
// e acelera a abertura, principalmente no celular.
export const SpendingChart = dynamic(
  () => import("./SpendingChart").then((m) => m.SpendingChart),
  { ssr: false, loading: ChartSkeleton }
);

export const CategoryDonut = dynamic(
  () => import("./CategoryDonut").then((m) => m.CategoryDonut),
  { ssr: false, loading: ChartSkeleton }
);

export const MonthlyCompare = dynamic(
  () => import("./MonthlyCompare").then((m) => m.MonthlyCompare),
  { ssr: false, loading: ChartSkeleton }
);

export const WeekdayChart = dynamic(
  () => import("./WeekdayChart").then((m) => m.WeekdayChart),
  { ssr: false, loading: ChartSkeleton }
);
