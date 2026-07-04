import { createClient } from "./supabase/server";
import { currentMonthKey } from "./finance";
import {
  DEMO_TRANSACTIONS,
  DEMO_BUDGETS,
  DEMO_SAVINGS_TARGET,
  DEMO_SALARY,
} from "./demo";
import type { Transaction, Budget } from "./types";

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
 */
export async function loadData(monthKey?: string): Promise<LoadedData> {
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

  const [{ data: tx }, { data: bud }, { data: goal }, { data: profile }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false }),
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
