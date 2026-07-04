import { describe, expect, it } from "vitest";
import { parseAmount, parseDate, findAmountInLine } from "./parse";

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
