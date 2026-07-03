import type { CategoryKey } from "./types";

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  color: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryMeta> = {
  financiamento_carro: { key: "financiamento_carro", label: "Financiamento do carro", color: "#0a84ff" },
  seguro_carro: { key: "seguro_carro", label: "Seguro do carro", color: "#5e5ce6" },
  cartao: { key: "cartao", label: "Cartão de crédito", color: "#64d2ff" },
  assinaturas: { key: "assinaturas", label: "Assinaturas", color: "#bf5af2" },
  mercado: { key: "mercado", label: "Mercado", color: "#30d158" },
  combustivel: { key: "combustivel", label: "Combustível", color: "#ff9f0a" },
  academia: { key: "academia", label: "Academia", color: "#ff375f" },
  internet: { key: "internet", label: "Internet", color: "#ff2d92" },
  pix: { key: "pix", label: "Pix / Transferências", color: "#00c7be" },
  outros: { key: "outros", label: "Outros", color: "#98989d" },
  receita: { key: "receita", label: "Receita", color: "#34c759" },
};

export const EXPENSE_CATEGORIES = Object.values(CATEGORIES).filter(
  (c) => c.key !== "receita"
);

/**
 * Categorizacao automatica por palavras-chave da descricao.
 * Usada na importacao (CSV/PDF) e no palpite da entrada manual.
 * NUNCA retorna "receita" — receita é apenas o salário cadastrado em Ajustes.
 */
export function guessCategory(description: string): CategoryKey {
  const d = description.toLowerCase();
  const rules: [RegExp, CategoryKey][] = [
    [/posto|ipiranga|shell|petrobr|combust[íi]|gasolina|etanol|\balcool|\bgnv\b/, "combustivel"],
    [/mercado|superm|hiperm|atacad|carrefour|assa[ií]|hortifrut|hortfrut|acoug|mercear|padaria|p[ãa]o de a[çc]|sacol|quitanda|\bfeira|verdur|hortigranj/, "mercado"],
    [/academia|smart ?fit|bio ?ritmo|crossfit|panobianco|\bgym\b|gympass|wellhub|totalpass/, "academia"],
    [/netflix|spotify|prime video|amazon prime|hbo|\bmax\b|disney|youtube|globoplay|deezer|paramount|apple\.com|apple ?tv|icloud|playstation|xbox|game ?pass|assinatura|google.*(one|storage)/, "assinaturas"],
    [/internet|banda larga|\bfibra\b|vivo fibra|claro net|oi fibra|net virtua|\bwifi\b/, "internet"],
    [/seguro|porto seguro|azul seguros|allianz|bradesco seguro|sulamerica|mapfre/, "seguro_carro"],
    [/financ|presta[çc]|parcela.*(carro|ve[ií]culo)|financiamento|consorcio/, "financiamento_carro"],
    [/\bpix\b|\bted\b|\bdoc\b|transfer[eê]nc|dep[óo]sito|envio de|enviada|recebida/, "pix"],
  ];
  for (const [re, cat] of rules) {
    if (re.test(d)) return cat;
  }
  return "outros";
}

export function categoryMeta(key: CategoryKey): CategoryMeta {
  return CATEGORIES[key] ?? CATEGORIES.outros;
}

export const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
