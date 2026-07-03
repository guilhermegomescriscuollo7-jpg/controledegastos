import { BRL } from "@/lib/categories";

interface Props {
  label: string;
  value: number;
  accent?: string;
  sub?: string;
  icon?: string;
}

export function StatCard({ label, value, accent = "#a78bfa", sub, icon }: Props) {
  return (
    <div className="glass animate-fadeup p-5">
      <div className="flex items-center justify-between">
        <span className="text-dim text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
        {icon && <span className="text-lg opacity-80">{icon}</span>}
      </div>
      <div
        className="mt-2 text-2xl font-bold sm:text-3xl"
        style={{ color: accent }}
      >
        {BRL.format(value)}
      </div>
      {sub && <div className="text-dim mt-1 text-xs">{sub}</div>}
    </div>
  );
}
