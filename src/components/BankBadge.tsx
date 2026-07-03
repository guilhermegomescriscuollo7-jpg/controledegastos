// Marcas estilizadas dos bancos/cartões (cores oficiais aproximadas).
// Evita usar os logos originais (direitos autorais) mantendo o reconhecimento
// visual pela cor + inicial de cada banco.

interface BankStyle {
  bg: string;
  fg: string;
  short: string;
  name: string;
}

const BANKS: Record<string, BankStyle> = {
  Nubank: { bg: "#820AD1", fg: "#ffffff", short: "nu", name: "Nubank" },
  Sicoob: { bg: "#003641", fg: "#7DB61C", short: "SI", name: "Sicoob" },
  Dinheiro: { bg: "#34c759", fg: "#ffffff", short: "R$", name: "Dinheiro" },
  Outro: { bg: "#48484a", fg: "#ffffff", short: "•", name: "Outro" },
};

export function bankStyle(account?: string | null): BankStyle {
  return BANKS[account ?? "Outro"] ?? BANKS.Outro;
}

export function BankBadge({
  account,
  size = 32,
}: {
  account?: string | null;
  size?: number;
}) {
  const b = bankStyle(account);
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[28%] font-bold"
      style={{
        width: size,
        height: size,
        background: b.bg,
        color: b.fg,
        fontSize: size * 0.42,
        letterSpacing: "-0.03em",
      }}
      title={b.name}
      aria-label={b.name}
    >
      {b.short}
    </span>
  );
}
