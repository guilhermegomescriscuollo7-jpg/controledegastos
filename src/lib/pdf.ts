import { parseDate, findStatementAmount } from "./parse";

/**
 * Extrai as linhas de texto de um PDF, preservando a ordem de leitura
 * (agrupando itens por linha aproximada).
 */
async function extractLines(file: File): Promise<string[]> {
  // Importa o pdfjs só no cliente, sob demanda.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // O worker precisa casar com a versão da API.
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;

  const lines: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();

    // Agrupa itens por coordenada Y (mesma linha visual).
    const rows = new Map<number, { x: number; s: string }[]>();
    for (const item of content.items as {
      str: string;
      transform: number[];
    }[]) {
      if (!item.str) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      let bucket: number | undefined;
      for (const key of rows.keys()) {
        if (Math.abs(key - y) <= 3) {
          bucket = key;
          break;
        }
      }
      const k = bucket ?? y;
      if (!rows.has(k)) rows.set(k, []);
      rows.get(k)!.push({ x, s: item.str });
    }

    // Ordena linhas de cima para baixo, e itens da esquerda para a direita.
    const sorted = [...rows.entries()].sort((a, b) => b[0] - a[0]);
    for (const [, items] of sorted) {
      const text = items
        .sort((a, b) => a.x - b.x)
        .map((i) => i.s)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) lines.push(text);
    }
  }
  return lines;
}

export interface PdfDraft {
  date: string;
  description: string;
  amount: number;
}

// Linhas de saldo/resumo — nunca viram transação (mesmo coladas na data).
const SALDO_LINE =
  /saldo|s\s*a\s*l\s*d\s*o|pagamento\s*m[íi]nimo|total\s*a\s*pagar|limite\s*(de\s*)?cr[ée]dito|cr[ée]dito\s*rotativo|fatura\s*anterior/i;

// Rodapé / resumo do extrato — encerram o bloco de transação atual.
const FOOTER_LINE =
  /^(resumo|encargos|outras informa|vencimento cheque|taxa cheque|custo efetivo|\(\+\)|\(-\)|\(=\)|\d{3} extratos|em caso de|sac:|ouvidoria|estamos prontos|plataforma de|sistema de coop|coop\.?:|conta:|per[íi]odo:|hist[óo]rico de|data\s*hist|subtotal|total\b|juros|\biof\b|multa)/i;

// Início de linha com data: dd/mm[/aa], dd.mm.aaaa (só o formato completo,
// para não confundir com CNPJ tipo "05.245.166") ou "05 JUN" (fatura Nubank).
// A descrição pode vir colada, ex.: "01/06PIX...".
const LEADING_DATE =
  /^\s*(?:\d{1,2}\/\d{2}(?:\/\d{2,4})?|\d{1,2}\.\d{2}\.\d{4}|\d{1,2}\s*(?:de\s*)?[\/ ]?(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez))/i;

/** Descobre o ano do extrato (para datas dd/mm sem ano). */
function detectYear(lines: string[]): number {
  for (const l of lines) {
    const m = l.match(/\/(\d{4})\b/) || l.match(/\b(20\d{2})\b/);
    if (m) return Number(m[1]);
  }
  return new Date().getFullYear();
}

/** Tira a data inicial e os valores (com D/C) de uma linha. */
function stripDateAndAmount(line: string): string {
  return line
    .replace(LEADING_DATE, "")
    .replace(
      /-?\(?\s*R?\$?\s*(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}\)?\s*[DC*]?-?/gi,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s·|—-]+|[\s·|—-]+$/g, "")
    .trim();
}

/** Junta o cabeçalho + detalhes numa descrição única e enxuta. */
function buildDescription(parts: string[]): string {
  const seen = new Set<string>();
  const clean = parts
    .map((p) => p.replace(/\s{2,}/g, " ").trim())
    .filter((p) => p.length > 0 && !seen.has(p) && seen.add(p));
  let desc = clean.join(" · ");
  if (desc.length > 110) desc = desc.slice(0, 109).trimEnd() + "…";
  return desc;
}

interface Block {
  date: string;
  parts: string[];
  amount: number;
}

/**
 * Lê um extrato/fatura em PDF e devolve as transações.
 *
 * Leitura por blocos: uma transação começa na linha com data + valor e
 * incorpora as linhas de detalhe seguintes (favorecido, tipo do Pix,
 * CNPJ, documento...) até aparecer a próxima data. Isso captura a
 * descrição completa do extrato Sicoob e ignora saldos, percentuais
 * (ex.: taxa 7,99%) e o resumo do rodapé.
 */
export async function parsePdfTransactions(file: File): Promise<{
  drafts: PdfDraft[];
  linesRead: number;
  sample: string[];
}> {
  const lines = await extractLines(file);
  const year = detectYear(lines);
  const blocks: Block[] = [];
  let cur: Block | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (LEADING_DATE.test(line)) {
      // Linha com data: inicia (ou não) uma transação.
      const date = parseDate(line, year);
      if (!date || SALDO_LINE.test(line)) {
        cur = null;
        continue;
      }
      const amount = findStatementAmount(line);
      if (amount === null || amount === 0) {
        cur = null;
        continue;
      }
      const head = stripDateAndAmount(line);
      cur = { date, parts: head ? [head] : [], amount };
      blocks.push(cur);
      continue;
    }

    // Linha sem data: detalhe do lançamento atual (ou rodapé → encerra).
    if (FOOTER_LINE.test(line) || SALDO_LINE.test(line)) {
      cur = null;
      continue;
    }
    if (cur) cur.parts.push(line);
  }

  const drafts: PdfDraft[] = blocks
    .map((b) => ({
      date: b.date,
      description: buildDescription(b.parts),
      amount: b.amount,
    }))
    .filter((d) => d.description.length >= 2);

  // Amostra das primeiras linhas para diagnóstico quando nada é reconhecido.
  const sample = lines.filter((l) => l.trim().length > 0).slice(0, 12);
  return { drafts, linesRead: lines.length, sample };
}
