import { describe, expect, it } from "vitest";
import { guessCategory } from "./categories";

describe("guessCategory", () => {
  it("reconhece postos de combustível reais", () => {
    expect(guessCategory("Posto Ipiranga")).toBe("combustivel");
    expect(guessCategory("Shell Combustíveis")).toBe("combustivel");
    expect(guessCategory("AUTO POSTO CENTRAL")).toBe("combustivel");
  });

  it("NÃO confunde restaurante/espetinho com posto", () => {
    expect(guessCategory("Pit Stop do Espeto Gle")).not.toBe("combustivel");
    expect(guessCategory("Espetinho do Zé")).not.toBe("combustivel");
  });

  it("streaming vai para assinaturas, não para internet (bug do 'net')", () => {
    expect(guessCategory("Netflix.com")).toBe("assinaturas");
    expect(guessCategory("YouTube Premium")).toBe("assinaturas");
    expect(guessCategory("Spotify")).toBe("assinaturas");
  });

  it("provedores de internet/telefonia vão para internet", () => {
    expect(guessCategory("Vivo Fibra Internet")).toBe("internet");
    expect(guessCategory("Claro Fibra")).toBe("internet");
    expect(guessCategory("TIM")).toBe("internet");
  });

  it("mercados e alimentação de casa", () => {
    expect(guessCategory("Assaí Atacadista")).toBe("mercado");
    expect(guessCategory("Carrefour")).toBe("mercado");
    expect(guessCategory("Acougue e Mercearia Mineira")).toBe("mercado");
    expect(guessCategory("Supermercados BH")).toBe("mercado");
  });

  it("academia", () => {
    expect(guessCategory("Smart Fit")).toBe("academia");
    expect(guessCategory("Academia Bodytech")).toBe("academia");
  });

  it("seguro do carro antes de financiamento", () => {
    expect(guessCategory("Porto Seguro - Seguro Auto")).toBe("seguro_carro");
  });

  it("financiamento exige contexto de veículo", () => {
    expect(guessCategory("Financiamento Santander - Parcela carro")).toBe(
      "financiamento_carro"
    );
  });

  it("NÃO cai em financiamento por 'prestação/prestador' genérico", () => {
    expect(guessCategory("Prestador de servico limpeza")).toBe("cartao");
    expect(guessCategory("Prestacao mensal do apartamento")).not.toBe(
      "financiamento_carro"
    );
  });

  it("receitas", () => {
    expect(guessCategory("Salário empresa X")).toBe("receita");
    expect(guessCategory("Pix recebido de Fulano")).toBe("receita");
    expect(guessCategory("Estorno de compra")).toBe("receita");
  });

  it("nome de pessoa/desconhecido cai em cartão", () => {
    expect(guessCategory("Amanda de Fatima Silva")).toBe("cartao");
    expect(guessCategory("Pagamento diverso XYZ")).toBe("cartao");
  });

  it("restaurantes e delivery", () => {
    expect(guessCategory("iFood *Restaurante")).toBe("restaurante");
    expect(guessCategory("Pit Stop do Espeto Gle")).toBe("restaurante");
    expect(guessCategory("Espetinho do Zé")).toBe("restaurante");
    expect(guessCategory("Rappi Brasil")).toBe("restaurante");
  });

  it("saúde e farmácia (antes de mercado)", () => {
    expect(guessCategory("Farmácia Pague Menos")).toBe("saude");
    expect(guessCategory("Drogaria São Paulo")).toBe("saude");
    expect(guessCategory("Clínica Odonto Sorriso")).toBe("saude");
  });

  it("transporte não vira combustível", () => {
    expect(guessCategory("Uber *Trip")).toBe("transporte");
    expect(guessCategory("99app *viagem")).toBe("transporte");
    expect(guessCategory("Estacionamento Central")).toBe("transporte");
  });

  it("compras e e-commerce; 'mercado livre' não vira mercado", () => {
    expect(guessCategory("Mercado Livre")).toBe("compras");
    expect(guessCategory("Amazon.com.br")).toBe("compras");
    expect(guessCategory("Loja Qualquer Coisa 123")).toBe("compras");
    expect(guessCategory("Renner")).toBe("compras");
  });

  it("casa e contas", () => {
    expect(guessCategory("CEMIG Distribuicao")).toBe("casa");
    expect(guessCategory("Aluguel apartamento")).toBe("casa");
    expect(guessCategory("Condominio Edificio")).toBe("casa");
  });

  it("lazer, educação e pet", () => {
    expect(guessCategory("Cinemark Shopping")).toBe("lazer");
    expect(guessCategory("Faculdade Mensalidade")).toBe("educacao");
    expect(guessCategory("Petz Racao")).toBe("pet");
  });
});
