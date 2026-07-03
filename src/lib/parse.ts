// Utilitários de parsing usados na importação de CSV e PDF.

/** Converte "1.234,56", "-1234.56", "R$ 100,00", "(50,00)" em number. */
export function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let s = raw.replace(/[R$\s]/g, "").trim();
  if (!s) return null;
  const neg = /^-/.test(s) || /^\(.*\)$/.test(s) || /-$/.test(s) || /D$/i.test(s);
  s = s.replace(/[()DC]/gi, "").replace(/^-/, "").replace(/-$/, "");
  // formato BR: 1.234,56 -> tira pontos de milhar, troca vírgula por ponto
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return neg ? -n : n;
}

/** Converte dd/mm/yyyy, yyyy-mm-dd, dd/mm/yy em ISO yyyy-mm-dd. */
export function parseDate(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  let m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/(\d{2})\/(\d{2})\/(\d{2})(?!\d)/);
  if (m) return `20${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

/** Encontra um valor monetário dentro de uma linha de texto. */
export function findAmountInLine(line: string): number | null {
  // procura padrões tipo 1.234,56 ou 1234.56, opcionalmente com sinal/R$
  const matches = line.match(/-?\(?\s*R?\$?\s*\d{1,3}(?:\.\d{3})*,\d{2}\)?-?/g);
  if (!matches || matches.length === 0) return null;
  // usa o último número da linha (normalmente é o valor da transação)
  return parseAmount(matches[matches.length - 1]);
}
