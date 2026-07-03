import { parseDate, findAmountInLine } from "./parse";

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

/**
 * Lê um extrato/fatura em PDF e devolve possíveis transações.
 * Best-effort: procura, em cada linha, uma data + um valor monetário.
 */
export async function parsePdfTransactions(file: File): Promise<{
  drafts: PdfDraft[];
  linesRead: number;
}> {
  const lines = await extractLines(file);
  const drafts: PdfDraft[] = [];

  for (const line of lines) {
    const date = parseDate(line);
    const amount = findAmountInLine(line);
    if (!date || amount === null || amount === 0) continue;

    // Descrição = linha sem a data e sem os valores monetários.
    const description = line
      .replace(/\d{2}\/\d{2}\/\d{2,4}/g, "")
      .replace(/-?\(?\s*R?\$?\s*\d{1,3}(?:\.\d{3})*,\d{2}\)?-?/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/^[\s·|—-]+|[\s·|—-]+$/g, "")
      .trim();

    if (!description || description.length < 2) continue;
    drafts.push({ date, description, amount });
  }

  return { drafts, linesRead: lines.length };
}
