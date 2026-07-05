export type CategoryKey =
  | "financiamento_carro"
  | "seguro_carro"
  | "cartao"
  | "assinaturas"
  | "mercado"
  | "combustivel"
  | "academia"
  | "internet"
  | "restaurante"
  | "saude"
  | "transporte"
  | "compras"
  | "casa"
  | "lazer"
  | "educacao"
  | "pet"
  | "parcelados"
  | "outros"
  | "receita";

export interface Transaction {
  id: string;
  user_id?: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number; // negativo = gasto, positivo = receita
  category: CategoryKey;
  source: "manual" | "csv" | "pdf" | "pluggy" | "recorrente";
  account?: string | null; // "Nubank" | "Sicoob" | ...
  rule_id?: string | null; // regra recorrente que gerou o lançamento
  created_at?: string;
}

export interface RecurringRule {
  id: string;
  user_id?: string;
  description: string;
  amount: number; // negativo = gasto, positivo = receita
  category: CategoryKey;
  account?: string | null;
  day_of_month: number; // 1-28
  active: boolean;
  applied_until?: string | null; // yyyy-mm do último mês lançado
  created_at?: string;
}

export interface Budget {
  category: CategoryKey;
  monthly_limit: number;
}

export interface MonthlyGoal {
  month: string; // yyyy-mm
  savings_target: number;
}
