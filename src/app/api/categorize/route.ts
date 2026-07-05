import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import type { CategoryKey } from "@/lib/types";

export const runtime = "nodejs";

interface Body {
  descriptions: string[];
}

const VALID_KEYS = new Set<string>(EXPENSE_CATEGORIES.map((c) => c.key));
const MAX_ITEMS = 150;

/**
 * Categoriza descricoes de gastos em lote com o Claude Haiku.
 * Sem ANTHROPIC_API_KEY retorna { categories: null } e o cliente
 * mantem a sugestao por regras locais (gratis).
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }
  if (
    !Array.isArray(body.descriptions) ||
    body.descriptions.length === 0 ||
    body.descriptions.length > MAX_ITEMS ||
    body.descriptions.some((d) => typeof d !== "string")
  ) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ categories: null });
  }

  try {
    const anthropic = new Anthropic({ apiKey: key });
    const keys = EXPENSE_CATEGORIES.map((c) => `${c.key} (${c.label})`).join(", ");

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system:
        "Você categoriza gastos de extratos bancários brasileiros. " +
        `As categorias possíveis (use a CHAVE, não o rótulo) são: ${keys}. ` +
        "Regras importantes:\n" +
        "- combustivel: SOMENTE postos de gasolina reais (Posto, Ipiranga, Shell, BR, Texaco). " +
        "NÃO use para restaurantes, espetinhos, lanchonetes ou bares, mesmo que o nome tenha 'pit stop', 'parada' ou 'posto do espeto'.\n" +
        "- mercado: supermercados, açougue, padaria, hortifruti, mercearia (compras de casa).\n" +
        "- assinaturas: serviços digitais recorrentes (Netflix, Spotify, Amazon Prime, YouTube, iCloud, ChatGPT...).\n" +
        "- financiamento_carro: SOMENTE parcelas claramente do carro/veículo. Financiamento de outra coisa NÃO conta.\n" +
        "- seguro_carro: seguradoras de automóvel.\n" +
        "- academia: academias e apps de treino.\n" +
        "- internet: provedores de internet/telefonia (Vivo, Claro, TIM, Oi).\n" +
        "- cartao: compras genéricas no cartão (lojas, farmácia, apps de transporte, delivery, restaurantes) quando não houver categoria melhor.\n" +
        "- outros: só quando realmente não der para inferir nada.\n" +
        "Responda APENAS com um array JSON de strings, sem markdown, com exatamente " +
        "uma chave de categoria para cada descrição recebida, na mesma ordem.",
      messages: [
        {
          role: "user",
          content: JSON.stringify(body.descriptions),
        },
      ],
    });

    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const jsonStr = text.slice(text.indexOf("["), text.lastIndexOf("]") + 1);
    const parsed = JSON.parse(jsonStr) as unknown[];

    if (!Array.isArray(parsed) || parsed.length !== body.descriptions.length) {
      return NextResponse.json({ categories: null });
    }

    const categories = parsed.map((c) =>
      typeof c === "string" && VALID_KEYS.has(c) ? (c as CategoryKey) : "outros"
    );
    return NextResponse.json({ categories });
  } catch (e) {
    console.error("Erro ao categorizar com IA:", e);
    return NextResponse.json({ categories: null });
  }
}
