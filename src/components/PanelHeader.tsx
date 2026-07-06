import { Icon, type IconName } from "@/components/icons";

/** Cabeçalho padrão dos painéis: chip de ícone colorido + título + subtítulo. */
export function PanelHeader({
  icon,
  color,
  title,
  subtitle,
}: {
  icon: IconName;
  color: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
        style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
      >
        <Icon name={icon} size={16} />
      </span>
      <div>
        <h3 className="font-semibold leading-tight">{title}</h3>
        {subtitle && <p className="text-dim text-xs">{subtitle}</p>}
      </div>
    </div>
  );
}
