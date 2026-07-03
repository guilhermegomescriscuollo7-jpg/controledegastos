import { createClient } from "./supabase/server";
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
  userName: string | null;
}

/**
 * Carrega dados do usuario logado. Sem Supabase ou sem login -> dados demo.
 */
export async function loadData(): Promise<LoadedData> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      transactions: DEMO_TRANSACTIONS,
      budgets: DEMO_BUDGETS,
      savingsTarget: DEMO_SAVINGS_TARGET,
      monthlySalary: DEMO_SALARY,
      demo: true,
      userEmail: null,
      userName: null,
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
      userName: null,
    };
  }

  const [{ data: tx }, { data: bud }, { data: goal }, { data: profile }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false }),
      supabase.from("budgets").select("*"),
      supabase.from("monthly_goals").select("*").limit(1).maybeSingle(),
      supabase.from("profiles").select("monthly_salary").maybeSingle(),
    ]);

  return {
    transactions: (tx as Transaction[]) ?? [],
    budgets: (bud as Budget[]) ?? [],
    savingsTarget: goal?.savings_target ?? 0,
    monthlySalary: profile?.monthly_salary ?? 0,
    demo: false,
    userEmail: user.email ?? null,
    userName:
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split("@")[0] ||
      null,
  };
}
