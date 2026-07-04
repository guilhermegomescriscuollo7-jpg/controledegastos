import { BRL } from "@/lib/categories";
import { Icon } from "@/components/icons";

interface Props {
  forecast: {
    spent: number;
    avgDaily: number;
    projected: number;
    isCurrent: boolean;
    daysElapsed: number;
    daysInMonth: number;
  };
  /** limite de referencia: soma das receitas do mes */
  income: number;
}

export function ForecastCard({ forecast, income }: Props) {
  const { spent, avgDaily, projected, isCurrent, daysElapsed, daysInMonth } =
    forecast;
  if (spent === 0) return null;

  const willExceed = isCurrent && income > 0 && projected > income;

  return (
    <div className="glass p-5">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-full"
          style={{
            background: "color-mix(in srgb, #5e5ce6 15%, transparent)",
            color: "#5e5ce6",
          }}
        >
          <Icon name="target" size={17} />
        </span>
        <h3 className="font-semibold">
          {isCurrent ? "Projeção do mês" : "Ritmo de gasto"}
        </h3>
      </div>

      {isCurrent ? (
        <>
          <p className="text-dim mb-3 text-xs">
            No ritmo atual ({BRL.format(avgDaily)}/dia em {daysElapsed} dias),
            você fecha o mês gastando:
          </p>
          <p
            className="text-2xl font-semibold tracking-tight sm:text-[28px]"
            style={{ color: willExceed ? "#ff375f" : "var(--accent)" }}
          >
            {BRL.format(projected)}
          </p>
          {willExceed && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-accent-red">
              <Icon name="alert" size={15} className="shrink-0" />
              Acima da sua renda do mês ({BRL.format(income)}) — pise no freio.
            </p>
          )}
        </>
      ) : (
        <p className="text-dim mt-2 text-sm">
          Média de <strong className="text-[color:var(--text)]">{BRL.format(avgDaily)}</strong>{" "}
          por dia ao longo dos {daysInMonth} dias do mês.
        </p>
      )}
    </div>
  );
}
