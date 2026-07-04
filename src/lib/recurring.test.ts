import { describe, expect, it } from "vitest";
import { addMonths, monthsToApply, ruleDateInMonth } from "./recurring";

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
