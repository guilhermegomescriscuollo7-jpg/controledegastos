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

/** Mês anterior a uma chave 'yyyy-mm'. */
export function prevMonthKey(monthKey: string): string {
  const y = Number(monthKey.slice(0, 4));
  const m = Number(monthKey.slice(5, 7)) - 1; // 0-index
  return currentMonthKey(new Date(y, m - 1, 1));
}

export interface CategoryDelta {
  category: CategoryKey;
  current: number;
  previous: number;
  diff: number; // current - previous
  pct: number | null; // variação % (null se não havia gasto antes)
}

/** Compara os gastos por categoria do mês com o mês anterior. */
export function categoryDeltas(
  transactions: Transaction[],
  monthKey: string
): CategoryDelta[] {
  const sumBy = (mk: string) => {
    const map = new Map<CategoryKey, number>();
    for (const t of transactions) {
      if (t.amount >= 0 || !inMonth(t, mk)) continue;
      map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount));
    }
    return map;
  };
  const cur = sumBy(monthKey);
  const old = sumBy(prevMonthKey(monthKey));
  const keys = new Set<CategoryKey>([...cur.keys(), ...old.keys()]);

  const out: CategoryDelta[] = [];
  for (const k of keys) {
    const c = cur.get(k) ?? 0;
    const p = old.get(k) ?? 0;
    out.push({
      category: k,
      current: c,
      previous: p,
      diff: c - p,
      pct: p > 0 ? (c - p) / p : null,
    });
  }
  return out.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

export interface HealthScore {
  score: number; // 0-100
  label: string;
  savingsRate: number; // saldo / receita
  parts: { label: string; got: number; max: number }[];
}

/**
 * Nota de saúde financeira do mês (0-100), combinando taxa de poupança,
 * aderência aos limites e progresso da meta. Usada no medidor animado.
 */
export function financialHealthScore(
  summary: FinanceSummary,
  savingsTarget: number
): HealthScore {
  const income = summary.income;
  const savingsRate = income > 0 ? summary.balance / income : 0;

  // 1) Poupança: guardar 20%+ da renda = pontuação cheia (45 pts).
  const savePts = Math.max(0, Math.min(45, (savingsRate / 0.2) * 45));

  // 2) Orçamento: proporção de categorias dentro do limite (30 pts).
  //    Sem limites definidos, dá nota neutra.
  const b = summary.budgetStatus;
  const budgetPts = b.length
    ? (b.filter((x) => !x.over).length / b.length) * 30
    : 18;

  // 3) Meta: progresso rumo à meta de guardar (25 pts).
  const goalPts =
    savingsTarget > 0
      ? Math.max(
          0,
          Math.min(25, (Math.max(summary.balance, 0) / savingsTarget) * 25)
        )
      : summary.balance > 0
      ? 16
      : 0;

  const score = Math.round(savePts + budgetPts + goalPts);
  const label =
    score >= 80
      ? "Excelente"
      : score >= 60
      ? "Boa"
      : score >= 40
      ? "Atenção"
      : "Crítica";

  return {
    score,
    label,
    savingsRate,
    parts: [
      { label: "Poupança", got: Math.round(savePts), max: 45 },
      { label: "Limites", got: Math.round(budgetPts), max: 30 },
      { label: "Meta", got: Math.round(goalPts), max: 25 },
    ],
  };
}

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

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Total gasto por dia da semana no mes (onde o dinheiro escapa). */
export function weekdayTotals(transactions: Transaction[], monthKey: string) {
  const totals = new Array(7).fill(0) as number[];
  for (const t of transactions) {
    if (!inMonth(t, monthKey) || t.amount >= 0) continue;
    const [y, m, d] = t.date.split("-").map(Number);
    totals[new Date(y, m - 1, d).getDay()] += Math.abs(t.amount);
  }
  return DIAS_SEMANA.map((label, i) => ({ label, total: totals[i] }));
}

/** Maiores gastos individuais do mes. */
export function topExpenses(
  transactions: Transaction[],
  monthKey: string,
  n = 5
) {
  return transactions
    .filter((t) => inMonth(t, monthKey) && t.amount < 0)
    .sort((a, b) => a.amount - b.amount)
    .slice(0, n);
}

/** Gastos do mes agrupados por conta de origem. */
export function accountTotals(transactions: Transaction[], monthKey: string) {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (!inMonth(t, monthKey) || t.amount >= 0) continue;
    const key = t.account?.trim() || "Sem conta";
    map.set(key, (map.get(key) ?? 0) + Math.abs(t.amount));
  }
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  return [...map.entries()]
    .map(([account, spent]) => ({
      account,
      total: spent,
      pct: total > 0 ? spent / total : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Ritmo de gasto: media diaria e projecao ate o fim do mes. */
export function spendForecast(
  transactions: Transaction[],
  monthKey: string,
  today = new Date()
) {
  const spent = transactions
    .filter((t) => inMonth(t, monthKey) && t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const daysInMonth = new Date(
    Number(monthKey.slice(0, 4)),
    Number(monthKey.slice(5, 7)),
    0
  ).getDate();

  const isCurrent = monthKey === currentMonthKey(today);
  const daysElapsed = isCurrent ? Math.min(today.getDate(), daysInMonth) : daysInMonth;
  const avgDaily = daysElapsed > 0 ? spent / daysElapsed : 0;

  return {
    spent,
    avgDaily,
    projected: avgDaily * daysInMonth,
    isCurrent,
    daysElapsed,
    daysInMonth,
  };
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
