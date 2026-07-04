import { loadData } from "@/lib/data";
import {
  summarize,
  dailySpendSeries,
  currentMonthKey,
  monthlyExpenseTotals,
} from "@/lib/finance";
import { MonthlyCompare } from "@/components/MonthlyCompare";
import { StatCard } from "@/components/StatCard";
import { SpendingChart } from "@/components/SpendingChart";
import { CategoryDonut } from "@/components/CategoryDonut";
import { BudgetList } from "@/components/BudgetList";
import { AIAdvisor } from "@/components/AIAdvisor";
import { TransactionList } from "@/components/TransactionList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MonthPicker } from "@/components/MonthPicker";
import { Icon } from "@/components/icons";
import Link from "next/link";

export const dynamic = "force-dynamic";

function isValidMonthKey(m?: string): m is string {
  return !!m && /^\d{4}-\d{2}$/.test(m);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const monthKey = isValidMonthKey(month) ? month : currentMonthKey();

  const { transactions, budgets, savingsTarget, monthlySalary, demo, userEmail } =
    await loadData(monthKey);
  const summary = summarize(transactions, budgets, monthKey, monthlySalary);
  const series = dailySpendSeries(transactions, monthKey);
  const compare = monthlyExpenseTotals(transactions, monthKey);
  const saved = summary.balance > 0 ? summary.balance : 0;
  const savingsPct =
    savingsTarget > 0 ? Math.round((saved / savingsTarget) * 100) : 0;

  return (
    <main className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[32px]">
            Olá{userEmail ? `, ${userEmail.split("@")[0]}` : ""}
          </h1>
          <p className="text-dim mt-0.5 text-sm">Seu resumo financeiro</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/transactions"
            className="btn-primary hidden items-center gap-1.5 sm:flex"
          >
            <Icon name="plus" size={16} strokeWidth={2} /> Novo gasto
          </Link>
        </div>
      </header>

      {/* Filtro de mês/ano */}
      <div className="relative z-20 flex items-center justify-between">
        <MonthPicker monthKey={monthKey} />
      </div>

      {demo && (
        <div className="glass flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
          <span className="flex items-center gap-2">
            <Icon name="sparkles" size={16} className="text-[color:var(--accent)]" />
            <span>
              <strong>Modo demonstração</strong> — dados de exemplo. Conecte o
              Supabase para usar seus dados reais.
            </span>
          </span>
          <Link href="/settings" className="btn-glass shrink-0">
            Como conectar
          </Link>
        </div>
      )}

      {/* Cards de resumo */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Receitas" value={summary.income} accent="#34c759" icon="arrow-up" />
        <StatCard label="Gastos" value={summary.expenses} accent="#ff375f" icon="arrow-down" />
        <StatCard
          label="Sobrou"
          value={summary.balance}
          accent={summary.balance >= 0 ? "var(--accent)" : "#ff375f"}
          icon="scale"
        />
        <StatCard
          label="Meta guardar"
          value={savingsTarget}
          accent="#5e5ce6"
          icon="target"
          sub={savingsTarget > 0 ? `${savingsPct}% atingido no mês` : "Defina em Ajustes"}
        />
      </section>

      {/* IA */}
      <AIAdvisor summary={summary} savingsTarget={savingsTarget} />

      {/* Graficos */}
      <section className="grid gap-5 lg:grid-cols-2">
        <SpendingChart data={series} />
        <CategoryDonut data={summary.byCategory} />
      </section>

      <MonthlyCompare data={compare} selectedMonth={monthKey} />

      <BudgetList status={summary.budgetStatus} />

      {/* Ultimas transacoes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimas transações</h2>
          <Link
            href="/transactions"
            className="link-dim flex items-center gap-1 text-sm"
          >
            Ver todas <Icon name="arrow-right" size={15} />
          </Link>
        </div>
        <TransactionList transactions={transactions} limit={6} />
      </section>
    </main>
  );
}
