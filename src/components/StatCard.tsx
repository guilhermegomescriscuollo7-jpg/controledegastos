import { Icon, type IconName } from "@/components/icons";
import { AnimatedNumber } from "@/components/AnimatedNumber";

interface Props {
  label: string;
  value: number;
  accent?: string;
  sub?: string;
  icon?: IconName;
}

export function StatCard({ label, value, accent = "var(--accent)", sub, icon }: Props) {
  return (
    <div className="glass relative overflow-hidden p-5">
      {/* halo suave na cor do card */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full opacity-70 blur-2xl"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
      />
      <div className="relative flex items-center justify-between">
        <span className="text-dim text-[11px] font-medium uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <span
            className="grid h-7 w-7 place-items-center rounded-full"
            style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
          >
            <Icon name={icon} size={15} strokeWidth={2} />
          </span>
        )}
      </div>
      <AnimatedNumber
        value={value}
        className="relative mt-2.5 block text-[26px] font-semibold tracking-[-0.02em] sm:text-[30px]"
        style={{ color: accent }}
      />
      {sub && <div className="text-dim relative mt-1 text-xs">{sub}</div>}
    </div>
  );
}
