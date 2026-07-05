import { describe, expect, it } from "vitest";
import {
  addMonths,
  monthsToApply,
  ruleDateInMonth,
  upcomingBills,
} from "./recurring";
import type { RecurringRule } from "./types";

function rule(o: Partial<RecurringRule> & { day_of_month: number }): RecurringRule {
  return {
    id: Math.random().toString(36).slice(2),
    description: "Conta",
    amount: -100,
    category: "outros",
    account: null,
    active: true,
    applied_until: null,
    ...o,
  };
}

describe("addMonths", () => {
  it("soma e subtrai meses cruzando a virada de ano", () => {
    expect(addMonths("2026-07", 1)).toBe("2026-08");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});

describe("monthsToApply", () => {
  it("retorna os meses pendentes desde o último aplicado", () => {
    expect(
      monthsToApply({ applied_until: "2026-05" }, "2026-07")
    ).toEqual(["2026-06", "2026-07"]);
  });

  it("regra nova (sem applied_until) começa no mês de criação", () => {
    expect(
      monthsToApply(
        { applied_until: null, created_at: "2026-07-15T10:00:00Z" },
        "2026-07"
      )
    ).toEqual(["2026-07"]);
  });

  it("nada a fazer quando já está em dia", () => {
    expect(monthsToApply({ applied_until: "2026-07" }, "2026-07")).toEqual([]);
  });

  it("limita o atraso a 12 meses", () => {
    const out = monthsToApply({ applied_until: "2024-01" }, "2026-07");
    expect(out).toHaveLength(12);
    expect(out[0]).toBe("2024-02");
  });
});

describe("ruleDateInMonth", () => {
  it("monta a data ISO com zero à esquerda", () => {
    expect(ruleDateInMonth("2026-07", 5)).toBe("2026-07-05");
  });

  it("limita o dia entre 1 e 28", () => {
    expect(ruleDateInMonth("2026-02", 31)).toBe("2026-02-28");
    expect(ruleDateInMonth("2026-02", 0)).toBe("2026-02-01");
  });
});

describe("upcomingBills", () => {
  it("calcula o próximo vencimento e ordena por data", () => {
    const today = new Date(2026, 6, 10); // 10/jul
    const bills = upcomingBills(
      [
        rule({ id: "a", day_of_month: 5, amount: -200 }), // dia 5 já passou -> 05/ago
        rule({ id: "b", day_of_month: 15, amount: -100 }), // dia 15 -> 15/jul
      ],
      today
    );
    expect(bills.map((b) => b.rule.id)).toEqual(["b", "a"]);
    expect(bills[0].dueDate).toBe("2026-07-15");
    expect(bills[0].daysUntil).toBe(5);
    expect(bills[1].dueDate).toBe("2026-08-05");
  });

  it("ignora recorrentes de receita e inativas", () => {
    const today = new Date(2026, 6, 10);
    const bills = upcomingBills(
      [
        rule({ day_of_month: 20, amount: 500 }), // receita
        rule({ day_of_month: 20, amount: -50, active: false }), // inativa
      ],
      today
    );
    expect(bills).toHaveLength(0);
  });
});
