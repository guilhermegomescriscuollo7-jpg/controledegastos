import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES } from "@/lib/categories";
import type { FinanceSummary } from "@/lib/finance";

export const runtime = "nodejs";

interface Body {
  summary: FinanceSummary;
  savingsTarget: number;
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Dicas por regras (sem custo). Usadas se nao houver ANTHROPIC_API_KEY. */
function ruleBasedAdvice(summary: FinanceSummary, savingsTarget: number) {
  const tips: string[] = [];
  let opportunity = 0;

  for (const b of summary.budgetStatus) {
    if (b.over) {
      const excess = b.spent - b.limit;
      opportunity += excess;
      tips.push(
        `Você passou ${BRL.format(excess)} do limite em ${CATEGORIES[b.category].label}. Reduza aqui no próximo mês.`
      );
    }
  }

  const top = summary.byCategory[0];
  if (top && top.category !== "financiamento_carro") {
    tips.push(
      `Sua maior despesa variável é ${CATEGORIES[top.category].label} (${BRL.format(top.total)}). Tente cortar 10% ali = ${BRL.format(top.total * 0.1)}/mês guardados.`
    );
    opportunity += top.total * 0.1;
  }

  const assinaturas = summary.byCategory.find((c) => c.category === "assinaturas");
  if (assinaturas && assinaturas.total > 50) {
    tips.push(
      `Revise assinaturas (${BRL.format(assinaturas.total)}/mês): cancele o que não usa. Cada streaming cortado é dinheiro no bolso.`
    );
  }

  if (summary.balance <= 0) {
    tips.push(
      "Seu saldo do mês está no zero ou negativo. Antes de gastar, separe primeiro a meta de economia (pague-se primeiro)."
    );
  } else if (savingsTarget > 0 && summary.balance < savingsTarget) {
    tips.push(
      `Faltam ${BRL.format(savingsTarget - summary.balance)} para bater sua meta de guardar ${BRL.format(savingsTarget)} este mês.`
    );
  }

  if (tips.length === 0) {
    tips.push("Você está dentro dos limites! Continue assim e aumente a meta de economia.");
  }

  return {
    headline:
      summary.overBudget.length > 0
        ? "Atenção: alguns limites estouraram este mês."
        : "Bom controle! Dá pra apertar um pouco mais e guardar.",
    tips: tips.slice(0, 5),
    savings_opportunity: Math.round(opportunity),
    source: "regras" as const,
  };
}

export async function POST(req: Request) {
  const { summary, savingsTarget } = (await req.json()) as Body;

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json(ruleBasedAdvice(summary, savingsTarget));
  }

  try {
    const anthropic = new Anthropic({ apiKey: key });

    const contexto = {
      receitas: summary.income,
      gastos: summary.expenses,
      saldo: summary.balance,
      meta_guardar: savingsTarget,
      por_categoria: summary.byCategory.map((c) => ({
        categoria: CATEGORIES[c.category].label,
        valor: c.total,
      })),
      limites: summary.budgetStatus.map((b) => ({
        categoria: CATEGORIES[b.category].label,
        gasto: b.spent,
        limite: b.limit,
        estourou: b.over,
      })),
    };

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      system:
        "Você é um consultor financeiro pessoal brasileiro, direto e prático. " +
        "O usuário tem dificuldade de guardar dinheiro (gasta tudo). " +
        "Analise os dados do mês e responda APENAS com um JSON válido, sem markdown, no formato: " +
        '{"headline": string, "tips": string[3-5], "savings_opportunity": number}. ' +
        "As dicas devem ser específicas aos números dele, em reais (R$), acionáveis e motivadoras. " +
        "savings_opportunity = estimativa realista de quanto ele pode economizar por mês, em reais.",
      messages: [
        {
          role: "user",
          content: `Estes são meus dados financeiros do mês (em R$):\n${JSON.stringify(contexto, null, 2)}\n\nMe dê o plano de economia em JSON.`,
        },
      ],
    });

    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");

    const jsonStr = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({
      headline: parsed.headline ?? "Análise do mês",
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 5) : [],
      savings_opportunity: Number(parsed.savings_opportunity) || 0,
      source: "claude" as const,
    });
  } catch (e) {
    console.error("Erro Claude, usando regras:", e);
    return NextResponse.json(ruleBasedAdvice(summary, savingsTarget));
  }
}
