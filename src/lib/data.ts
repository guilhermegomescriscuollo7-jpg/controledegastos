import { createClient } from "./supabase/server";
import { currentMonthKey } from "./finance";
import { applyRecurringRules, addMonths } from "./recurring";
import {
  DEMO_TRANSACTIONS,
  DEMO_BUDGETS,
  DEMO_SAVINGS_TARGET,
  DEMO_SALARY,
} from "./demo";
import type { Transaction, Budget, RecurringRule } from "./types";

/** Regras recorrentes do usuário logado (vazio em demo/sem login). */
export async function loadRecurringRules(): Promise<RecurringRule[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("recurring_rules")
    .select("*")
    .order("day_of_month", { ascending: true });
  return (data as RecurringRule[]) ?? [];
}

export interface LoadedData {
  transactions: Transaction[];
  budgets: Budget[];
  savingsTarget: number;
  monthlySalary: number;
  demo: boolean;
  userEmail: string | null;
}

/**
 * Carrega dados do usuario logado. Sem Supabase ou sem login -> dados demo.
 * A meta de economia e a do mes pedido; se nao houver, vale a mais recente
 * anterior a ele (a meta "atual" continua valendo nos meses seguintes).
 *
 * `historyMonths` limita as transacoes a uma janela terminando no mes
 * pedido (o dashboard usa 12; sem o parametro carrega tudo, como na
 * tela de transacoes, que precisa do historico completo).
 */
export async function loadData(
  monthKey?: string,
  historyMonths?: number
): Promise<LoadedData> {
  const month = monthKey ?? currentMonthKey();
  const supabase = await createClient();

  if (!supabase) {
    return {
      transactions: DEMO_TRANSACTIONS,
      budgets: DEMO_BUDGETS,
      savingsTarget: DEMO_SAVINGS_TARGET,
      monthlySalary: DEMO_SALARY,
      demo: true,
      userEmail: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      transactions: DEMO_TRANSACTIONS,
      budgets: DEMO_BUDGETS,
      savingsTarget: DEMO_SAVINGS_TARGET,
      monthlySalary: DEMO_SALARY,
      demo: true,
      userEmail: null,
    };
  }

  // Lanca as recorrentes pendentes antes de ler (idempotente).
  await applyRecurringRules(supabase, user.id);

  let txQuery = supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });
  if (historyMonths && historyMonths > 0) {
    txQuery = txQuery.gte(
      "date",
      `${addMonths(month, -(historyMonths - 1))}-01`
    );
  }

  const [{ data: tx }, { data: bud }, { data: goal }, { data: profile }] =
    await Promise.all([
      txQuery,
      supabase.from("budgets").select("*"),
      supabase
        .from("monthly_goals")
        .select("*")
        .lte("month", month)
        .order("month", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("profiles").select("monthly_salary").maybeSingle(),
    ]);

  return {
    transactions: (tx as Transaction[]) ?? [],
    budgets: (bud as Budget[]) ?? [],
    savingsTarget: goal?.savings_target ?? 0,
    monthlySalary: profile?.monthly_salary ?? 0,
    demo: false,
    userEmail: user.email ?? null,
  };
}
