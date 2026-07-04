import type { Transaction, Budget, CategoryKey } from "./types";

export function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function inMonth(t: Transaction, monthKey: string) {
  return t.date.startsWith(monthKey);
}

export interface FinanceSummary {
  income: number;
  expenses: number; // valor positivo
  balance: number;
  byCategory: { category: CategoryKey; total: number }[];
  budgetStatus: {
    category: CategoryKey;
    spent: number;
    limit: number;
    pct: number;
    over: boolean;
  }[];
  overBudget: CategoryKey[];
}

export function summarize(
  transactions: Transaction[],
  budgets: Budget[],
  monthKey = currentMonthKey(),
  monthlySalary = 0
): FinanceSummary {
  const month = transactions.filter((t) => inMonth(t, monthKey));

  let income = monthlySalary; // salário fixo cadastrado em Ajustes
  let expenses = 0;
  const catMap = new Map<CategoryKey, number>();

  for (const t of month) {
    if (t.amount >= 0) {
      income += t.amount;
    } else {
      const val = Math.abs(t.amount);
      expenses += val;
      catMap.set(t.category, (catMap.get(t.category) ?? 0) + val);
    }
  }

  const byCategory = [...catMap.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const budgetStatus = budgets.map((b) => {
    const spent = catMap.get(b.category) ?? 0;
    const pct = b.monthly_limit > 0 ? spent / b.monthly_limit : 0;
    return {
      category: b.category,
      spent,
      limit: b.monthly_limit,
      pct,
      over: spent > b.monthly_limit,
    };
  });

  return {
    income,
    expenses,
    balance: income - expenses,
    byCategory,
    budgetStatus,
    overBudget: budgetStatus.filter((b) => b.over).map((b) => b.category),
  };
}

const MESES_CURTO = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

/** Gastos totais dos ultimos N meses terminando no mes pedido (comparativo). */
export function monthlyExpenseTotals(
  transactions: Transaction[],
  endMonthKey = currentMonthKey(),
  months = 6
) {
  const year = Number(endMonthKey.slice(0, 4));
  const monthIdx = Number(endMonthKey.slice(5, 7)) - 1;

  const out: { month: string; label: string; total: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(year, monthIdx - i, 1);
    const key = currentMonthKey(d);
    const total = transactions
      .filter((t) => inMonth(t, key) && t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    out.push({ month: key, label: MESES_CURTO[d.getMonth()], total });
  }
  return out;
}

/** Serie diaria acumulada de gastos no mes (para o grafico de area). */
export function dailySpendSeries(
  transactions: Transaction[],
  monthKey = currentMonthKey()
) {
  const month = transactions
    .filter((t) => inMonth(t, monthKey) && t.amount < 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const daysInMonth = new Date(
    Number(monthKey.slice(0, 4)),
    Number(monthKey.slice(5, 7)),
    0
  ).getDate();

  const perDay = new Map<number, number>();
  for (const t of month) {
    const day = Number(t.date.slice(8, 10));
    perDay.set(day, (perDay.get(day) ?? 0) + Math.abs(t.amount));
  }

  const series: { day: string; gasto: number; acumulado: number }[] = [];
  let acc = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const gasto = perDay.get(d) ?? 0;
    acc += gasto;
    series.push({ day: String(d), gasto, acumulado: acc });
  }
  return series;
}
