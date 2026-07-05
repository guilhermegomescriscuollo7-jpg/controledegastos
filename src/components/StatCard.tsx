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
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <span className="text-dim text-[11px] font-medium uppercase tracking-wide">
          {label}
        </span>
        {icon && (
          <span
            className="grid h-7 w-7 place-items-center rounded-full"
            style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
          >
            <Icon name={icon} size={15} strokeWidth={2} />
          </span>
        )}
      </div>
      <AnimatedNumber
        value={value}
        className="mt-2.5 block text-2xl font-semibold tracking-tight sm:text-[28px]"
        style={{ color: accent }}
      />
      {sub && <div className="text-dim mt-1 text-xs">{sub}</div>}
    </div>
  );
}
