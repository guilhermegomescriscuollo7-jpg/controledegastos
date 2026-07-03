import { loadData } from "@/lib/data";
import { summarize, dailySpendSeries, currentMonthKey } from "@/lib/finance";
import { StatCard } from "@/components/StatCard";
import { SpendingChart } from "@/components/SpendingChart";
import { CategoryDonut } from "@/components/CategoryDonut";
import { BudgetList } from "@/components/BudgetList";
import { AIAdvisor } from "@/components/AIAdvisor";
import { TransactionList } from "@/components/TransactionList";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export const dynamic = "force-dynamic";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export default async function DashboardPage() {
  const { transactions, budgets, savingsTarget, demo, userEmail } =
    await loadData();
  const summary = summarize(transactions, budgets);
  const series = dailySpendSeries(transactions);
  const now = new Date();
  const saved = summary.balance > 0 ? summary.balance : 0;
  const savingsPct = savingsTarget > 0 ? Math.round((saved / savingsTarget) * 100) : 0;

  return (
    <main className="space-y-5">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-dim text-sm capitalize">
            {MESES[now.getMonth()]} de {now.getFullYear()}
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Olá{userEmail ? `, ${userEmail.split("@")[0]}` : ""} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/transactions" className="btn-glass hidden sm:block">
            + Novo gasto
          </Link>
        </div>
      </header>

      {demo && (
        <div className="glass flex flex-wrap items-center justify-between gap-2 border-accent-blue/30 p-4 text-sm">
          <span>
            🎬 <strong>Modo demonstração</strong> — dados de exemplo. Conecte o
            Supabase para usar seus dados reais.
          </span>
          <Link href="/settings" className="btn-glass shrink-0">
            Como conectar
          </Link>
        </div>
      )}

      {/* Cards de resumo */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Receitas" value={summary.income} accent="#34d399" icon="↑" />
        <StatCard label="Gastos" value={summary.expenses} accent="#fb7185" icon="↓" />
        <StatCard
          label="Sobrou"
          value={summary.balance}
          accent={summary.balance >= 0 ? "#a78bfa" : "#fb7185"}
          icon="＝"
        />
        <StatCard
          label="Meta guardar"
          value={savingsTarget}
          accent="#38bdf8"
          icon="🎯"
          sub={savingsTarget > 0 ? `${savingsPct}% atingido este mês` : "Defina em Ajustes"}
        />
      </section>

      {/* IA */}
      <AIAdvisor summary={summary} savingsTarget={savingsTarget} />

      {/* Graficos */}
      <section className="grid gap-5 lg:grid-cols-2">
        <SpendingChart data={series} />
        <CategoryDonut data={summary.byCategory} />
      </section>

      <BudgetList status={summary.budgetStatus} />

      {/* Ultimas transacoes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimas transações</h2>
          <Link href="/transactions" className="link-dim text-sm">
            Ver todas →
          </Link>
        </div>
        <TransactionList transactions={transactions} limit={6} />
      </section>
    </main>
  );
}
