import { describe, expect, it } from "vitest";
import {
  currentMonthKey,
  summarize,
  dailySpendSeries,
  monthlyExpenseTotals,
} from "./finance";
import type { Transaction, Budget } from "./types";

function tx(partial: Partial<Transaction> & { date: string; amount: number }): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    description: "teste",
    category: "mercado",
    source: "manual",
    ...partial,
  };
}

describe("currentMonthKey", () => {
  it("formata ano-mês com zero à esquerda", () => {
    expect(currentMonthKey(new Date(2026, 6, 4))).toBe("2026-07");
    expect(currentMonthKey(new Date(2026, 0, 15))).toBe("2026-01");
  });
});

describe("summarize", () => {
  const transactions = [
    tx({ date: "2026-07-01", amount: -100, category: "mercado" }),
    tx({ date: "2026-07-10", amount: -50, category: "combustivel" }),
    tx({ date: "2026-07-15", amount: 200, category: "receita" }),
    tx({ date: "2026-06-20", amount: -999, category: "mercado" }), // outro mês
  ];
  const budgets: Budget[] = [{ category: "mercado", monthly_limit: 80 }];

  it("considera só o mês pedido e soma salário como receita", () => {
    const s = summarize(transactions, budgets, "2026-07", 3000);
    expect(s.income).toBe(3200);
    expect(s.expenses).toBe(150);
    expect(s.balance).toBe(3050);
  });

  it("agrupa gastos por categoria em ordem decrescente", () => {
    const s = summarize(transactions, budgets, "2026-07");
    expect(s.byCategory).toEqual([
      { category: "mercado", total: 100 },
      { category: "combustivel", total: 50 },
    ]);
  });

  it("marca categoria estourada quando passa do limite", () => {
    const s = summarize(transactions, budgets, "2026-07");
    expect(s.overBudget).toEqual(["mercado"]);
    expect(s.budgetStatus[0]).toMatchObject({ spent: 100, limit: 80, over: true });
  });
});

describe("dailySpendSeries", () => {
  it("acumula os gastos dia a dia até o fim do mês", () => {
    const series = dailySpendSeries(
      [
        tx({ date: "2026-07-01", amount: -10 }),
        tx({ date: "2026-07-03", amount: -5 }),
        tx({ date: "2026-07-03", amount: 100 }), // receita não conta
      ],
      "2026-07"
    );
    expect(series).toHaveLength(31);
    expect(series[0]).toEqual({ day: "1", gasto: 10, acumulado: 10 });
    expect(series[2]).toEqual({ day: "3", gasto: 5, acumulado: 15 });
    expect(series[30].acumulado).toBe(15);
  });
});

describe("monthlyExpenseTotals", () => {
  it("retorna os últimos 6 meses terminando no mês pedido", () => {
    const out = monthlyExpenseTotals([], "2026-07");
    expect(out).toHaveLength(6);
    expect(out[0].month).toBe("2026-02");
    expect(out[5].month).toBe("2026-07");
  });

  it("cruza a virada de ano corretamente", () => {
    const out = monthlyExpenseTotals([], "2026-01");
    expect(out[0].month).toBe("2025-08");
    expect(out[5].month).toBe("2026-01");
  });

  it("soma só os gastos de cada mês", () => {
    const out = monthlyExpenseTotals(
      [
        tx({ date: "2026-07-05", amount: -30 }),
        tx({ date: "2026-07-20", amount: -20 }),
        tx({ date: "2026-07-25", amount: 500 }), // receita fora
        tx({ date: "2026-06-01", amount: -7 }),
      ],
      "2026-07"
    );
    expect(out[5].total).toBe(50);
    expect(out[4].total).toBe(7);
  });
});
