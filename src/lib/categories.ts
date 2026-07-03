import type { CategoryKey } from "./types";

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  color: string;
  emoji: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryMeta> = {
  financiamento_carro: { key: "financiamento_carro", label: "Financiamento do carro", color: "#7c5cff", emoji: "🚗" },
  seguro_carro: { key: "seguro_carro", label: "Seguro do carro", color: "#a78bfa", emoji: "🛡️" },
  cartao: { key: "cartao", label: "Cartão de crédito", color: "#38bdf8", emoji: "💳" },
  assinaturas: { key: "assinaturas", label: "Assinaturas", color: "#22d3ee", emoji: "📺" },
  mercado: { key: "mercado", label: "Mercado", color: "#34d399", emoji: "🛒" },
  combustivel: { key: "combustivel", label: "Combustível", color: "#fbbf24", emoji: "⛽" },
  academia: { key: "academia", label: "Academia", color: "#fb7185", emoji: "🏋️" },
  internet: { key: "internet", label: "Internet", color: "#f472b6", emoji: "🌐" },
  outros: { key: "outros", label: "Outros", color: "#94a3b8", emoji: "•" },
  receita: { key: "receita", label: "Receita", color: "#4ade80", emoji: "💰" },
};

export const EXPENSE_CATEGORIES = Object.values(CATEGORIES).filter(
  (c) => c.key !== "receita"
);

/**
 * Categorizacao automatica simples por palavras-chave da descricao.
 * Usada na importacao de CSV e entrada manual.
 */
export function guessCategory(description: string): CategoryKey {
  const d = description.toLowerCase();
  const rules: [RegExp, CategoryKey][] = [
    [/financ|presta|parcela.*(carro|ve[ií]culo)|banco.*carro/, "financiamento_carro"],
    [/seguro|porto seguro|azul seguros|allianz|bradesco seguro/, "seguro_carro"],
    [/posto|ipiranga|shell|petrobras|combust|gasolina|etanol|alcool/, "combustivel"],
    [/mercado|supermerc|atacad|carrefour|assa[ií]|big|pao de acucar|hortifruti|acougue/, "mercado"],
    [/academia|smart fit|smartfit|bio ?ritmo|gym|crossfit|panobianco/, "academia"],
    [/net|vivo|claro|tim|oi fibra|internet|banda larga|fibra/, "internet"],
    [/netflix|spotify|prime|hbo|max|disney|youtube|assinatura|apple\.com|google.*(one|storage)/, "assinaturas"],
    [/sal[aá]rio|pagamento recebido|pix recebido|transfer[eê]ncia recebida|rendimento/, "receita"],
  ];
  for (const [re, cat] of rules) {
    if (re.test(d)) return cat;
  }
  return "cartao";
}

export function categoryMeta(key: CategoryKey): CategoryMeta {
  return CATEGORIES[key] ?? CATEGORIES.outros;
}

export const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
