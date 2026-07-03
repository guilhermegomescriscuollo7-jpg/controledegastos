import type { Transaction, Budget } from "./types";

/**
 * Dados de exemplo para o app abrir bonito antes de conectar o Supabase.
 * Assim voce ja ve o dashboard funcionando com "npm run dev".
 */
const now = new Date();
const y = now.getFullYear();
const m = now.getMonth(); // 0-index
const iso = (day: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "d1", date: iso(5), description: "Salário", amount: 6800, category: "receita", source: "manual", account: "Sicoob" },
  { id: "d2", date: iso(6), description: "Financiamento Santander - Parcela carro", amount: -1290, category: "financiamento_carro", source: "csv", account: "Sicoob" },
  { id: "d3", date: iso(8), description: "Porto Seguro - Seguro auto", amount: -320, category: "seguro_carro", source: "csv", account: "Nubank" },
  { id: "d4", date: iso(3), description: "Netflix", amount: -55.9, category: "assinaturas", source: "csv", account: "Nubank" },
  { id: "d5", date: iso(3), description: "Spotify", amount: -21.9, category: "assinaturas", source: "csv", account: "Nubank" },
  { id: "d6", date: iso(10), description: "Assaí Atacadista", amount: -412.37, category: "mercado", source: "csv", account: "Nubank" },
  { id: "d7", date: iso(17), description: "Carrefour", amount: -286.5, category: "mercado", source: "csv", account: "Nubank" },
  { id: "d8", date: iso(2), description: "Posto Ipiranga", amount: -250, category: "combustivel", source: "csv", account: "Nubank" },
  { id: "d9", date: iso(15), description: "Shell Combustíveis", amount: -230, category: "combustivel", source: "csv", account: "Sicoob" },
  { id: "d10", date: iso(1), description: "Smart Fit", amount: -119.9, category: "academia", source: "csv", account: "Nubank" },
  { id: "d11", date: iso(1), description: "Vivo Fibra Internet", amount: -99.9, category: "internet", source: "csv", account: "Sicoob" },
  { id: "d12", date: iso(12), description: "iFood", amount: -73.4, category: "cartao", source: "csv", account: "Nubank" },
  { id: "d13", date: iso(14), description: "Amazon.com.br", amount: -158.9, category: "cartao", source: "csv", account: "Nubank" },
  { id: "d14", date: iso(20), description: "Farmácia Pague Menos", amount: -64.2, category: "cartao", source: "csv", account: "Nubank" },
  { id: "d15", date: iso(21), description: "Uber", amount: -42.7, category: "cartao", source: "csv", account: "Nubank" },
];

export const DEMO_BUDGETS: Budget[] = [
  { category: "financiamento_carro", monthly_limit: 1300 },
  { category: "seguro_carro", monthly_limit: 350 },
  { category: "cartao", monthly_limit: 800 },
  { category: "assinaturas", monthly_limit: 120 },
  { category: "mercado", monthly_limit: 900 },
  { category: "combustivel", monthly_limit: 600 },
  { category: "academia", monthly_limit: 130 },
  { category: "internet", monthly_limit: 110 },
];

export const DEMO_SAVINGS_TARGET = 1000;
