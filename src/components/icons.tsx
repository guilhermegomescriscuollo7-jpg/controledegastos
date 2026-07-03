import type { CategoryKey } from "@/lib/types";

export type IconName =
  // navegação / UI
  | "home"
  | "receipt"
  | "upload"
  | "gear"
  | "sun"
  | "moon"
  | "arrow-up"
  | "arrow-down"
  | "scale"
  | "target"
  | "sparkles"
  | "check"
  | "alert"
  | "plus"
  | "calendar"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "x"
  | "wave"
  | "wifi-signal"
  | "arrow-right"
  | "edit"
  | "trash"
  | "file"
  // categorias
  | "car"
  | "shield"
  | "card"
  | "play"
  | "cart"
  | "fuel"
  | "dumbbell"
  | "wifi"
  | "dots"
  | "wallet"
  | "transfer";

// Paths desenhados no viewBox 24x24, traço fino (estilo SF Symbols).
const PATHS: Record<IconName, React.ReactNode> = {
  home: <path d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />,
  receipt: (
    <>
      <path d="M6 3.5h12a1 1 0 0 1 1 1V20l-2.2-1.3L14.5 20l-2.5-1.4L9.5 20l-2.3-1.3L5 20V4.5a1 1 0 0 1 1-1Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5" />
      <path d="M5 14v4a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18v-4" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M4.2 7.5l1.9 1.1M17.9 15.4l1.9 1.1M4.2 16.5l1.9-1.1M17.9 8.6l1.9-1.1" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z" />,
  "arrow-up": <path d="M12 19V6m0 0-6 6m6-6 6 6" />,
  "arrow-down": <path d="M12 5v13m0 0 6-6m-6 6-6-6" />,
  "arrow-right": <path d="M5 12h14m0 0-6-6m6 6-6 6" />,
  scale: (
    <>
      <path d="M12 4v16M7 8h10" />
      <path d="M7 8 4 14a3 3 0 0 0 6 0L7 8ZM17 8l-3 6a3 3 0 0 0 6 0l-3-6ZM8 20h8" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  sparkles: (
    <path d="M12 3.5c.4 3.4 1.6 4.6 5 5-3.4.4-4.6 1.6-5 5-.4-3.4-1.6-4.6-5-5 3.4-.4 4.6-1.6 5-5ZM18.5 13c.2 1.6.8 2.2 2.5 2.5-1.7.3-2.3.9-2.5 2.5-.2-1.6-.8-2.2-2.5-2.5 1.7-.3 2.3-.9 2.5-2.5Z" />
  ),
  check: <path d="M5 12.5 10 17 19 7" />,
  alert: (
    <>
      <path d="M12 4.5 21 20H3l9-15.5Z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17.3" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
      <path d="M4 9.5h16M8 3.5v4M16 3.5v4" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z" />
      <path d="M13.5 6.5 17.5 10.5" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
      <path d="M6.5 7l.8 12a1 1 0 0 0 1 .95h7.4a1 1 0 0 0 1-.95L17.5 7" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  file: (
    <>
      <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4M9 13h6M9 16h4" />
    </>
  ),
  "chevron-left": <path d="M14.5 6 8.5 12l6 6" />,
  "chevron-right": <path d="M9.5 6l6 6-6 6" />,
  "chevron-down": <path d="M6 9.5l6 6 6-6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  wave: (
    <path d="M8 12.5c1.2-3 2-6.5 3.4-6.9 1-.3 1.4.7 1.1 2M6 15c1.5-3.6 2.8-9.6 5-10.2 1.4-.4 1.7 1.2 1.4 2.6M13.5 7.4c.4-1.3 1.2-2 2.2-1.7 1.4.4 1.6 2.4.8 5-1 3.3-3.4 6.3-6.7 6.3-2.4 0-3.9-1.3-4.6-2.8" />
  ),
  "wifi-signal": (
    <>
      <path d="M5 9.5a10 10 0 0 1 14 0M7.5 12.5a6 6 0 0 1 9 0M10 15.5a2.5 2.5 0 0 1 4 0" />
      <circle cx="12" cy="18.5" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  car: (
    <>
      <path d="M4 16v-3.2l1.8-4.2A2 2 0 0 1 7.6 7.4h8.8a2 2 0 0 1 1.8 1.2L20 12.8V16" />
      <path d="M4 12.8h16M4 16v1.6M20 16v1.6" />
      <circle cx="7.5" cy="16" r="1.4" />
      <circle cx="16.5" cy="16" r="1.4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.5-7 8.8-4.1-1.3-7-4.5-7-8.8V6l7-2.5Z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M3 10h18M6.5 14.5h4" />
    </>
  ),
  play: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M10.5 9.2v5.6l4.5-2.8-4.5-2.8Z" fill="currentColor" stroke="none" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2 12h10l2-8H6.5" />
      <circle cx="9" cy="19" r="1.3" />
      <circle cx="16" cy="19" r="1.3" />
    </>
  ),
  fuel: (
    <>
      <path d="M6 20V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14M4.5 20h11" />
      <path d="M6 12h8" />
      <path d="M14 8h2.5a1.5 1.5 0 0 1 1.5 1.5V15a1.5 1.5 0 0 0 3 0V9l-2.2-2.2" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M6.5 8.5v7M4 10v3M17.5 8.5v7M20 10v3M8.5 12h7" />
    </>
  ),
  wifi: (
    <>
      <path d="M4 9a12 12 0 0 1 16 0M6.8 12a8 8 0 0 1 10.4 0M9.5 15a4 4 0 0 1 5 0" />
      <circle cx="12" cy="18" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  dots: (
    <>
      <circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h11a1.5 1.5 0 0 1 1.5 1.5V9" />
      <path d="M4 8v9a2 2 0 0 0 2 2h12a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 18 8H4Z" />
      <circle cx="16.5" cy="13" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  transfer: (
    <>
      <path d="M5 9h11M16 9l-3-3M16 9l-3 3" />
      <path d="M19 15H8M8 15l3-3M8 15l3 3" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.7,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

export const CATEGORY_ICON: Record<CategoryKey, IconName> = {
  financiamento_carro: "car",
  seguro_carro: "shield",
  cartao: "card",
  assinaturas: "play",
  mercado: "cart",
  combustivel: "fuel",
  academia: "dumbbell",
  internet: "wifi",
  pix: "transfer",
  outros: "dots",
  receita: "wallet",
};

export function CategoryIcon({
  category,
  size = 20,
  className,
}: {
  category: CategoryKey;
  size?: number;
  className?: string;
}) {
  return <Icon name={CATEGORY_ICON[category]} size={size} className={className} />;
}
