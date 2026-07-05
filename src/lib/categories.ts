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
  restaurante: { key: "restaurante", label: "Restaurante e delivery", color: "#ff8c42" },
  saude: { key: "saude", label: "Saúde", color: "#30d5c8" },
  transporte: { key: "transporte", label: "Transporte", color: "#ffd426" },
  compras: { key: "compras", label: "Compras", color: "#ff6482" },
  casa: { key: "casa", label: "Casa e contas", color: "#8e9aaf" },
  lazer: { key: "lazer", label: "Lazer", color: "#cf6fff" },
  educacao: { key: "educacao", label: "Educação", color: "#7d7aff" },
  pet: { key: "pet", label: "Pet", color: "#a2845e" },
  parcelados: { key: "parcelados", label: "Parcelados", color: "#6d8cff" },
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
    /netflix|spotify|deezer|prime video|amazon prime|amazon music|\bhbo\b|\bmax\b|disney|star\+|paramount|globoplay|telecine|youtube|apple\.?(com|bill)|itunes|icloud|google ?(one|storage|play|gsuite)|playstation|\bxbox\b|nintendo|\bcanva\b|chatgpt|openai|dropbox|\bnotion\b|linkedin|\bpluralsight|audible/,
    "assinaturas",
  ],
  // Saúde / farmácia (antes de mercado — ex.: "Farmácia Pague Menos")
  [
    /farmacia|drogaria|drogasil|droga ?raia|\bpacheco\b|pague menos|ultrafarma|\bnissei\b|\bpanvel\b|hospital|clinica|laborator|\bexame|dentista|odonto|psicolog|fisioterap|\bunimed\b|hapvida|\bamil\b|medicament|\botica\b|oftalmo|vacina|\bsaude\b/,
    "saude",
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
  // Parcelados / crediário (compra parcelada, ex.: "Parcela 3/10").
  // Depois do carro (parcela do carro tem prioridade), mas antes das
  // categorias de loja — o usuário quer ver o parcelado agrupado.
  [
    /parcelad|\bparcela\b|em \d+ ?x\b|\d+ ?x de\b|crediario|carne de loja/,
    "parcelados",
  ],
  // Academia
  [
    /\bacademia\b|smart ?fit|bio ?ritmo|crossfit|panobianco|bodytech|selfit|bluefit|pratique fit|\bgym\b/,
    "academia",
  ],
  // Educação
  [
    /\bescola\b|colegio|faculdade|universidade|\bcurso\b|\budemy\b|\balura\b|coursera|apostila|livraria|saraiva|\bcreche\b|\bkumon\b|mensalidade escolar/,
    "educacao",
  ],
  // Pet (antes de mercado)
  [
    /pet ?shop|\bpetz\b|cobasi|petlove|\bpet\b|veterinari|\bracao\b/,
    "pet",
  ],
  // Restaurante e delivery (antes de mercado e de combustível)
  [
    /restaurante|restaur|lanchonete|\blanches?\b|pizzaria|\bpizza\b|churrascaria|espetinho|\bespeto\b|hamburgueria|burger|\bbar\b|boteco|cafeteria|\bcafe\b|padoca|sorveteria|\bacai\b|ifood|rappi|uber ?eats|mcdonald|\bbk\b|burger king|habibs?|subway|giraffas|outback|spoleto|china in box|\bdelivery\b/,
    "restaurante",
  ],
  // Compras / e-commerce (antes de mercado — "Mercado Livre" é loja)
  [
    /\bamazon\b|mercado ?livre|mercadolivre|shopee|aliexpress|\bshein\b|magalu|magazine luiza|americanas|casas bahia|ponto frio|riachuelo|\brenner\b|\bc&a\b|\bmarisa\b|\bnike\b|adidas|centauro|netshoes|\bzara\b|\blojas?\b|havan/,
    "compras",
  ],
  // Internet / telecom
  [
    /\bnet\b|vivo fibra|claro fibra|oi fibra|\btim\b|internet|banda larga|\bfibra\b|telefonica|net virtua|desktop internet|\balgar\b/,
    "internet",
  ],
  // Transporte (apps e público — antes de combustível)
  [
    /\buber\b|99 ?(app|pop|taxi|tecnologia)|99app|cabify|\btaxi\b|\bmetro\b|\bbrt\b|bilhete unico|\bonibus\b|\bpassagem\b|estacionamento|\bpedagio\b|sem parar|conectcar|\bveloe\b|riocard|rodoviaria/,
    "transporte",
  ],
  // Combustível — postos de verdade (NÃO restaurantes/espetinhos)
  [
    /\bposto\b|auto posto|ipiranga|\bshell\b|petrobras|br mania|br distribui|gasolina|\betanol\b|combustivel|\btexaco\b|rede sol|ale combust|petrol/,
    "combustivel",
  ],
  // Casa e contas (moradia + utilidades)
  [
    /aluguel|condominio|imobiliaria|\bcemig\b|\bcopasa\b|\benel\b|light energia|energia eletrica|conta de luz|celesc|coelba|\bcpfl\b|\bsabesp\b|comgas|conta de agua|\biptu\b|leroy merlin|\bleroy\b|telhanorte|obramax|casa show|construcao|equatorial energia/,
    "casa",
  ],
  // Mercado / alimentação de casa
  [
    /supermerc|super merc|mercadinho|\bmercado\b|atacad|carrefour|assai|pao de acucar|hortifruti|acougue|mercearia|sacolao|verdurao|quitanda|padaria|panificadora|gbarbosa|sams club|\bmakro\b|tenda atac|big bom|bompreco|nordestao|super nosso|epa super|apoio mineiro|\bsupermercados?\b/,
    "mercado",
  ],
  // Lazer / viagem / entretenimento
  [
    /cinema|cinemark|\buci\b|kinoplex|ingresso|\bshow\b|teatro|\bhotel\b|pousada|airbnb|booking|hoteis|\bresort\b|viagem|viacao|decolar|\blatam\b|gol linhas|azul viagens|\bcvc\b|123 ?milhas|\bparque\b|zoologico|\bsteam\b|\bgames?\b/,
    "lazer",
  ],
  // Cartão — pagamentos de fatura / crédito explícito
  [
    /\bfatura\b|pagamento de fatura|anuidade|pix no credito/,
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
