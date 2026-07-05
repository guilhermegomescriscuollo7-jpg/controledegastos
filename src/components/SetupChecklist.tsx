import Link from "next/link";
import { Icon } from "@/components/icons";

interface Step {
  done: boolean;
  label: string;
  href: string;
  cta: string;
}

/**
 * Guia de primeiros passos para quem acabou de conectar a conta.
 * Some sozinho quando tudo está configurado.
 */
export function SetupChecklist({
  hasSalary,
  hasBudgets,
  hasTransactions,
}: {
  hasSalary: boolean;
  hasBudgets: boolean;
  hasTransactions: boolean;
}) {
  const steps: Step[] = [
    {
      done: hasSalary,
      label: "Cadastre seu salário / renda mensal",
      href: "/settings",
      cta: "Definir renda",
    },
    {
      done: hasBudgets,
      label: "Defina os limites de gasto por categoria",
      href: "/settings",
      cta: "Definir limites",
    },
    {
      done: hasTransactions,
      label: "Importe um extrato ou adicione um gasto",
      href: "/import",
      cta: "Importar",
    },
  ];

  if (steps.every((s) => s.done)) return null;
  const nextStep = steps.find((s) => !s.done)!;
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="glass p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="grid h-9 w-9 place-items-center rounded-full text-white"
          style={{ background: "var(--accent)" }}
        >
          <Icon name="sparkles" size={18} />
        </span>
        <div>
          <h3 className="font-semibold leading-tight">Vamos configurar seu controle</h3>
          <p className="text-dim text-xs">
            {doneCount} de {steps.length} passos concluídos
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                s.done ? "text-white" : "fill-1 text-dim"
              }`}
              style={s.done ? { background: "#34c759" } : undefined}
            >
              {s.done ? <Icon name="check" size={13} strokeWidth={2.5} /> : null}
            </span>
            <span className={s.done ? "text-dim line-through" : ""}>{s.label}</span>
          </li>
        ))}
      </ul>

      <Link
        href={nextStep.href}
        className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-1.5"
      >
        {nextStep.cta}
        <Icon name="arrow-right" size={15} />
      </Link>
    </div>
  );
}
