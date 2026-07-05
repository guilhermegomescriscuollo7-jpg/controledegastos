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

// Linhas que são saldo/total/cabeçalho — não viram transação.
const SKIP_LINE =
  /\bsaldo\b|s\s*a\s*l\s*d\s*o|\btotal\b|limite\s*dispon|saldo\s*anterior|saldo\s*do\s*dia|resumo|lan[çc]amentos\s*futuros/i;

/** Descobre o ano do extrato (para datas dd/mm sem ano). */
function detectYear(lines: string[]): number {
  for (const l of lines) {
    const m = l.match(/\/(\d{4})\b/) || l.match(/\b(20\d{2})\b/);
    if (m) return Number(m[1]);
  }
  return new Date().getFullYear();
}

/**
 * Lê um extrato/fatura em PDF e devolve possíveis transações.
 *
 * Robusto para dois layouts comuns:
 *  - data + valor na mesma linha (faturas Nubank e afins);
 *  - data num cabeçalho do dia e os lançamentos abaixo só com
 *    descrição + valor (extrato Sicoob) — a data é "carregada" para
 *    as linhas seguintes até aparecer outra.
 * Considera o sufixo D/C (débito/crédito) do Sicoob.
 */
export async function parsePdfTransactions(file: File): Promise<{
  drafts: PdfDraft[];
  linesRead: number;
  sample: string[];
}> {
  const lines = await extractLines(file);
  const drafts: PdfDraft[] = [];
  const year = detectYear(lines);
  let currentDate: string | null = null;

  for (const line of lines) {
    const lineDate = parseDate(line, year);
    if (lineDate) currentDate = lineDate;

    if (SKIP_LINE.test(line)) continue;

    const amount = findStatementAmount(line);
    if (amount === null || amount === 0) continue;

    const date = lineDate ?? currentDate;
    if (!date) continue;

    // Descrição = linha sem a data e sem os valores monetários (com D/C).
    const description = line
      .replace(/\d{2}\/\d{2}\/\d{2,4}/g, "")
      .replace(/(?:^|\s)\d{2}\/\d{2}(?![\/\d])/g, " ")
      .replace(/-?\(?\s*R?\$?\s*(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}\)?\s*[DC]?-?/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/^[\s·|—-]+|[\s·|—-]+$/g, "")
      .trim();

    if (!description || description.length < 2) continue;
    drafts.push({ date, description, amount });
  }

  // Amostra das primeiras linhas para diagnóstico quando nada é reconhecido.
  const sample = lines.filter((l) => l.trim().length > 0).slice(0, 12);
  return { drafts, linesRead: lines.length, sample };
}
