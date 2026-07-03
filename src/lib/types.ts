export type CategoryKey =
  | "financiamento_carro"
  | "seguro_carro"
  | "cartao"
  | "assinaturas"
  | "mercado"
  | "combustivel"
  | "academia"
  | "internet"
  | "outros"
  | "receita";

export interface Transaction {
  id: string;
  user_id?: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number; // negativo = gasto, positivo = receita
  category: CategoryKey;
  source: "manual" | "csv" | "pluggy";
  account?: string | null; // "Nubank" | "Sicoob" | ...
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
