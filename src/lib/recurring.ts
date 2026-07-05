import type { SupabaseClient } from "@supabase/supabase-js";
import { currentMonthKey } from "./finance";
import type { RecurringRule } from "./types";

/** Soma n meses a uma chave 'yyyy-mm'. */
export function addMonths(monthKey: string, n: number): string {
  const year = Number(monthKey.slice(0, 4));
  const monthIdx = Number(monthKey.slice(5, 7)) - 1;
  return currentMonthKey(new Date(year, monthIdx + n, 1));
}

export interface UpcomingBill {
  rule: RecurringRule;
  dueDate: string; // ISO yyyy-mm-dd do próximo vencimento
  daysUntil: number; // dias a partir de hoje (0 = hoje)
}

/**
 * Próximos vencimentos das recorrentes de despesa (contas a pagar),
 * a partir de hoje, ordenados por data. `withinDays` limita a janela.
 */
export function upcomingBills(
  rules: RecurringRule[],
  today = new Date(),
  withinDays = 45
): UpcomingBill[] {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const out: UpcomingBill[] = [];

  for (const rule of rules) {
    if (!rule.active || rule.amount >= 0) continue; // só contas (despesas)
    const day = Math.min(Math.max(rule.day_of_month, 1), 28);

    // próximo vencimento: este mês se ainda não passou, senão mês que vem
    let due = new Date(base.getFullYear(), base.getMonth(), day);
    if (due < base) due = new Date(base.getFullYear(), base.getMonth() + 1, day);

    const daysUntil = Math.round((due.getTime() - base.getTime()) / 86400000);
    if (daysUntil > withinDays) continue;

    const iso = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
    out.push({ rule, dueDate: iso, daysUntil });
  }

  return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/**
 * Meses em que uma regra ainda precisa ser lançada, do mês seguinte ao
 * último aplicado (ou do mês de criação da regra) até o mês atual.
 * Limitado a 12 para não explodir se o app ficar muito tempo sem abrir.
 */
export function monthsToApply(
  rule: Pick<RecurringRule, "applied_until" | "created_at">,
  current = currentMonthKey()
): string[] {
  const createdMonth = rule.created_at
    ? rule.created_at.slice(0, 7)
    : current;
  const start = rule.applied_until
    ? addMonths(rule.applied_until, 1)
    : createdMonth;

  const months: string[] = [];
  let m = start;
  while (m <= current && months.length < 12) {
    months.push(m);
    m = addMonths(m, 1);
  }
  return months;
}

/** Data ISO do lançamento de uma regra em um mês. */
export function ruleDateInMonth(monthKey: string, dayOfMonth: number): string {
  return `${monthKey}-${String(Math.min(Math.max(dayOfMonth, 1), 28)).padStart(2, "0")}`;
}

/**
 * Lança as transações pendentes de todas as regras ativas do usuário.
 * Idempotente: o índice único (rule_id, date) impede duplicatas mesmo
 * com carregamentos simultâneos. Falhas são silenciosas de propósito —
 * o dashboard nunca deve quebrar por causa disso.
 */
export async function applyRecurringRules(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    const current = currentMonthKey();
    const { data: rules } = await supabase
      .from("recurring_rules")
      .select("*")
      .eq("active", true)
      .or(`applied_until.is.null,applied_until.lt.${current}`);

    if (!rules || rules.length === 0) return;

    const rows: Record<string, unknown>[] = [];
    for (const rule of rules as RecurringRule[]) {
      for (const month of monthsToApply(rule, current)) {
        rows.push({
          user_id: userId,
          rule_id: rule.id,
          date: ruleDateInMonth(month, rule.day_of_month),
          description: rule.description,
          amount: rule.amount,
          category: rule.category,
          account: rule.account ?? null,
          source: "recorrente",
        });
      }
    }
    if (rows.length === 0) return;

    const { error } = await supabase
      .from("transactions")
      .upsert(rows, { onConflict: "rule_id,date", ignoreDuplicates: true });

    if (!error) {
      await supabase
        .from("recurring_rules")
        .update({ applied_until: current })
        .in(
          "id",
          (rules as RecurringRule[]).map((r) => r.id)
        );
    }
  } catch {
    // melhor um mês sem lançamento automático do que um dashboard quebrado
  }
}
