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

const MESES: Record<string, number> = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};

const pad2 = (n: number) => String(n).padStart(2, "0");

// "05 JUN", "5 de junho", "05/JUN/2026", "05 jun 2026"
const MONTH_NAME_RE =
  /\b(\d{1,2})\s*(?:de\s*)?[\/ ]?(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\w*\.?(?:[\/ ]?(\d{4}))?/i;

/**
 * Converte várias formas de data em ISO yyyy-mm-dd:
 * dd/mm/yyyy, dd.mm.yyyy, yyyy-mm-dd, dd/mm/yy, "05 JUN [2026]".
 * Com `fallbackYear`, também entende dd/mm e "05 JUN" sem ano (extrato
 * Sicoob e fatura Nubank).
 */
export function parseDate(raw: string, fallbackYear?: number): string | null {
  if (!raw) return null;
  const s = raw.trim();
  let m = s.match(/(\d{2})[/.](\d{2})[/.](\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/(\d{2})\/(\d{2})\/(\d{2})(?!\d)/);
  if (m) return `20${m[3]}-${m[2]}-${m[1]}`;

  // Data com nome do mês (fatura Nubank e afins)
  m = s.match(MONTH_NAME_RE);
  if (m) {
    const dd = Number(m[1]);
    const mo = MESES[m[2].toLowerCase()];
    const yr = m[3] ? Number(m[3]) : fallbackYear;
    if (yr && mo && dd >= 1 && dd <= 31) {
      return `${yr}-${pad2(mo)}-${pad2(dd)}`;
    }
  }

  if (fallbackYear) {
    // dd/mm isolado (sem barra/ dígito antes ou depois)
    m = s.match(/(?:^|\s)(\d{2})\/(\d{2})(?![\/\d])/);
    if (m) {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
        return `${fallbackYear}-${m[2]}-${m[1]}`;
      }
    }
  }
  return null;
}

/**
 * Acha um valor monetário numa linha de EXTRATO, considerando o sufixo
 * D (débito → negativo) / C (crédito → positivo) do Sicoob e valores com
 * ou sem separador de milhar. Usa o último valor da linha (o do lançamento).
 */
export function findStatementAmount(line: string): number | null {
  // (?!\s*%) evita ler percentuais (ex.: "TAXA ... 7,99%") como dinheiro.
  const re =
    /-?\(?\s*R?\$?\s*(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}(?!\s*%)\)?\s*[DC]?-?/gi;
  const matches = line.match(re);
  if (!matches) return null;
  for (let i = matches.length - 1; i >= 0; i--) {
    const v = parseAmount(matches[i]);
    if (v !== null && v !== 0) return v;
  }
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
