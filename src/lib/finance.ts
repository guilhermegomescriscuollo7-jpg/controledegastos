import type { Transaction, Budget, CategoryKey } from "./types";

export function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function inMonth(t: Transaction, monthKey: string) {
  return t.date.startsWith(monthKey);
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

// ======================= Parcelados =======================

export interface InstallmentPlan {
  key: string;
  description: string; // nome base da compra
  category: CategoryKey;
  current: number; // parcela atual (maior X visto)
  total: number; // total de parcelas (Y)
  amount: number; // valor de cada parcela
  remaining: number; // parcelas que faltam
  remainingValue: number; // quanto ainda vai pesar
  lastDate: string;
}

// "Parcela 4/12", "PARC. 03/10", "Parc 4/12"
const PARCELA_RE = /parc\w*\.?\s*(\d{1,2})\s*\/\s*(\d{1,2})/i;

/**
 * Detecta compras parceladas a partir das descrições (X de Y) e mostra
 * o progresso e quanto ainda falta pagar. Best-effort.
 */
export function detectInstallments(
  transactions: Transaction[]
): InstallmentPlan[] {
  const groups = new Map<
    string,
    { current: number; total: number; amount: number; date: string; category: CategoryKey; label: string }[]
  >();

  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const m = t.description.match(PARCELA_RE);
    if (!m) continue;
    const current = Number(m[1]);
    const total = Number(m[2]);
    if (!total || total < 2 || total > 60 || current < 1 || current > total) continue;

    // Nome base: descrição sem o trecho da parcela e sem sufixos de detalhe.
    const label = t.description
      .replace(PARCELA_RE, "")
      .replace(/[·|].*/, "")
      .replace(/\s{2,}/g, " ")
      .replace(/^[\s·|—-]+|[\s·|—-]+$/g, "")
      .trim();
    const key = `${norm(label)}#${total}`;

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({
      current,
      total,
      amount: Math.abs(t.amount),
      date: t.date,
      category: t.category,
      label: label || t.description,
    });
  }

  const plans: InstallmentPlan[] = [];
  for (const [key, items] of groups) {
    items.sort((a, b) => a.date.localeCompare(b.date));
    const last = items[items.length - 1];
    const total = last.total;
    const current = Math.max(...items.map((i) => i.current));
    const remaining = total - current;
    if (remaining <= 0) continue;
    plans.push({
      key,
      description: last.label,
      category: last.category,
      current,
      total,
      amount: last.amount,
      remaining,
      remainingValue: remaining * last.amount,
      lastDate: last.date,
    });
  }

  return plans.sort((a, b) => b.remainingValue - a.remainingValue);
}

// ======================= Assinaturas =======================

export interface Subscription {
  key: string;
  name: string;
  category: CategoryKey;
  amount: number; // valor mensal típico
  months: number; // meses distintos em que apareceu
  lastDate: string;
}

/** Chave de comerciante: primeiras palavras significativas, sem números. */
function merchantKey(desc: string): string {
  return norm(desc)
    .replace(/[0-9./*#-]+/g, " ")
    .split(" ")
    .filter((w) => w.length >= 3)
    .slice(0, 3)
    .join(" ")
    .trim();
}

/**
 * Encontra cobranças recorrentes (assinaturas): mesma origem em 2+ meses
 * distintos com valor parecido. Retorna ordenado pelo valor.
 */
export function detectSubscriptions(
  transactions: Transaction[]
): Subscription[] {
  const groups = new Map<
    string,
    { amount: number; month: string; date: string; category: CategoryKey }[]
  >();

  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const key = merchantKey(t.description);
    if (key.length < 3) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({
      amount: Math.abs(t.amount),
      month: t.date.slice(0, 7),
      date: t.date,
      category: t.category,
    });
  }

  const subs: Subscription[] = [];
  for (const [key, items] of groups) {
    const months = new Set(items.map((i) => i.month));
    if (months.size < 2) continue; // precisa se repetir em meses diferentes

    const amounts = items.map((i) => i.amount);
    const avg = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const spread = Math.max(...amounts) - Math.min(...amounts);
    // valores consistentes (variação até 20% da média) = assinatura
    if (avg <= 0 || spread > avg * 0.2) continue;

    items.sort((a, b) => a.date.localeCompare(b.date));
    const last = items[items.length - 1];
    subs.push({
      key,
      name: key.replace(/\b\w/g, (c) => c.toUpperCase()),
      category: last.category,
      amount: Math.round(avg * 100) / 100,
      months: months.size,
      lastDate: last.date,
    });
  }

  return subs.sort((a, b) => b.amount - a.amount);
}
