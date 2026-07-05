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
  outros: { key: "outros", label: "Outros", color: "#98989d" },
  receita: { key: "receita", label: "Receita", color: "#34c759" },
};

export const EXPENSE_CATEGORIES = Object.values(CATEGORIES).filter(
  (c) => c.key !== "receita"
);

/** Minúsculas e sem acento, para as regras não precisarem de variações. */
function normalizeDesc(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Regras de categorização por palavras-chave. A ORDEM importa: a primeira
 * que casar vence, então as categorias mais específicas vêm antes das
 * genéricas (ex.: assinaturas antes de internet, para "Netflix" não cair
 * em internet por causa do "net"; seguro antes de financiamento).
 * Casam contra a descrição já normalizada (sem acento).
 */
const CATEGORY_RULES: [RegExp, CategoryKey][] = [
  // Receitas
  [
    /\b(salario|provento|honorario)|pagamento recebido|pix recebido|transferencia recebida|ted recebida|deposito recebido|rendimento|restituicao|reembolso|estorno|cashback|resgate/,
    "receita",
  ],
  // Serviços digitais recorrentes (antes de internet e de combustível)
  [
    /netflix|spotify|deezer|prime video|amazon prime|amazon music|\bhbo\b|\bmax\b|disney|star\+|paramount|globoplay|telecine|youtube|apple\.?(com|bill)|itunes|icloud|google ?(one|storage|play|gsuite)|playstation|\bxbox\b|nintendo|\bcanva\b|chatgpt|openai|dropbox|\bnotion\b|linkedin|\bpluralsight|udemy|kindle|audible/,
    "assinaturas",
  ],
  // Seguro do carro (antes de financiamento; ambos falam de "auto")
  [
    /\bseguro\b|porto seguro|azul seguros|allianz|sulamerica|\bmapfre\b|\bhdi\b|tokio marine|liberty seguros|bradesco seguro|itau seguro|seguro auto/,
    "seguro_carro",
  ],
  // Financiamento do carro — exige contexto de veículo p/ evitar
  // falso-positivo (ex.: "prestador de serviço", "financiamento imóvel")
  [
    /financiamento.*(carro|veic|auto)|consorcio.*(carro|veic|auto)|(parcela|prestacao|leasing).*(carro|veic|auto)|financiamento (do )?(carro|veiculo)|banco.*(carro|veiculo)/,
    "financiamento_carro",
  ],
  // Academia
  [
    /\bacademia\b|smart ?fit|bio ?ritmo|crossfit|panobianco|bodytech|selfit|bluefit|pratique fit|\bgym\b/,
    "academia",
  ],
  // Internet / telecom
  [
    /\bnet\b|vivo fibra|claro fibra|oi fibra|\btim\b|internet|banda larga|\bfibra\b|telefonica|net virtua|desktop internet|\balgar\b/,
    "internet",
  ],
  // Combustível — postos de verdade (NÃO restaurantes/espetinhos)
  [
    /\bposto\b|auto posto|ipiranga|\bshell\b|petrobras|br mania|br distribui|gasolina|\betanol\b|combustivel|\btexaco\b|rede sol|ale combust|petrol/,
    "combustivel",
  ],
  // Mercado / alimentação de casa
  [
    /supermerc|super merc|mercadinho|\bmercado\b|atacad|carrefour|assai|pao de acucar|hortifruti|acougue|mercearia|sacolao|verdurao|quitanda|padaria|panificadora|gbarbosa|sams club|\bmakro\b|tenda atac|big bom|bompreco|nordestao|super nosso|epa super|apoio mineiro|\bsupermercados?\b/,
    "mercado",
  ],
  // Cartão — pagamentos de fatura / crédito explícito
  [
    /\bfatura\b|pagamento de fatura|anuidade|pix no credito|pix parcelado/,
    "cartao",
  ],
];

/**
 * Categorizacao automatica por palavras-chave da descricao.
 * Usada na entrada manual, na importacao (como base/fallback) e na
 * recategorizacao. Quando nada casa, cai em "cartao" (compra genérica).
 */
export function guessCategory(description: string): CategoryKey {
  const d = normalizeDesc(description);
  for (const [re, cat] of CATEGORY_RULES) {
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
