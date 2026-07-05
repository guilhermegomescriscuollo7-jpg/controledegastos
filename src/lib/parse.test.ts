import { describe, expect, it } from "vitest";
import {
  parseAmount,
  parseDate,
  findAmountInLine,
  findStatementAmount,
} from "./parse";

describe("parseAmount", () => {
  it("entende formato brasileiro com milhar e centavos", () => {
    expect(parseAmount("1.234,56")).toBe(1234.56);
  });

  it("entende prefixo R$ e espaços", () => {
    expect(parseAmount("R$ 100,00")).toBe(100);
    expect(parseAmount("R$ 1.234,56")).toBe(1234.56);
  });

  it("entende formato americano com ponto decimal", () => {
    expect(parseAmount("-1234.56")).toBe(-1234.56);
  });

  it("trata parênteses como valor negativo", () => {
    expect(parseAmount("(50,00)")).toBe(-50);
  });

  it("trata sufixo D (débito) como negativo e C (crédito) como positivo", () => {
    expect(parseAmount("100,00D")).toBe(-100);
    expect(parseAmount("100,00C")).toBe(100);
  });

  it("retorna null para entrada vazia ou inválida", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });
});

describe("parseDate", () => {
  it("converte dd/mm/yyyy", () => {
    expect(parseDate("31/12/2024")).toBe("2024-12-31");
  });

  it("mantém yyyy-mm-dd", () => {
    expect(parseDate("2024-01-05")).toBe("2024-01-05");
  });

  it("converte dd/mm/yy assumindo século 21", () => {
    expect(parseDate("05/06/24")).toBe("2024-06-05");
  });

  it("retorna null quando não reconhece", () => {
    expect(parseDate("ontem")).toBeNull();
    expect(parseDate("")).toBeNull();
  });

  it("entende dd/mm sem ano usando o ano de fallback (extrato Sicoob)", () => {
    expect(parseDate("01/06 COMPRA CARTAO", 2026)).toBe("2026-06-01");
  });

  it("ignora dd/mm quando não há ano de fallback", () => {
    expect(parseDate("01/06 COMPRA CARTAO")).toBeNull();
  });

  it("prioriza data completa mesmo com fallback", () => {
    expect(parseDate("05/06/2025 PIX", 2026)).toBe("2025-06-05");
  });

  it("entende data com nome de mês (fatura Nubank)", () => {
    expect(parseDate("05 JUN", 2026)).toBe("2026-06-05");
    expect(parseDate("12 dez 2025", 2026)).toBe("2025-12-12");
    expect(parseDate("5 de janeiro", 2026)).toBe("2026-01-05");
  });

  it("entende dd.mm.aaaa com pontos", () => {
    expect(parseDate("31.12.2024")).toBe("2024-12-31");
  });

  it("não confunde CNPJ (05.245.166) com data", () => {
    expect(parseDate("05.245.166 0001-91")).toBeNull();
  });
});

describe("findStatementAmount (extrato com D/C)", () => {
  it("débito (D) vira negativo", () => {
    expect(findStatementAmount("COMPRA CARTAO 50,00 D")).toBe(-50);
  });

  it("crédito (C) vira positivo", () => {
    expect(findStatementAmount("PIX RECEBIDO 1.234,56 C")).toBe(1234.56);
  });

  it("valor sem separador de milhar", () => {
    expect(findStatementAmount("PAGAMENTO 1234,56 D")).toBe(-1234.56);
  });

  it("retorna null sem valor monetário", () => {
    expect(findStatementAmount("SALDO ANTERIOR")).toBeNull();
  });

  it("ignora percentual (taxa, não é dinheiro)", () => {
    expect(findStatementAmount("TAXA CHEQUE ESPECIAL (a.m.): 7,99%")).toBeNull();
  });
});

describe("findAmountInLine", () => {
  it("acha o valor no fim de uma linha de extrato", () => {
    expect(findAmountInLine("05/06/2024 PIX RECEBIDO 1.234,56")).toBe(1234.56);
  });

  it("usa o último valor quando a linha tem mais de um", () => {
    expect(findAmountInLine("saldo 10,00 compra mercado 25,90")).toBe(25.9);
  });

  it("retorna null sem valor monetário", () => {
    expect(findAmountInLine("EXTRATO DE CONTA CORRENTE")).toBeNull();
  });
});
