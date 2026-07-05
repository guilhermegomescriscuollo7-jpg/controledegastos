import { loadData, loadRecurringRules } from "@/lib/data";
import {
  summarize,
  dailySpendSeries,
  currentMonthKey,
  monthlyExpenseTotals,
  weekdayTotals,
  topExpenses,
  accountTotals,
  spendForecast,
  categoryDeltas,
  financialHealthScore,
  detectInstallments,
  detectSubscriptions,
} from "@/lib/finance";
import { upcomingBills } from "@/lib/recurring";
import { UpcomingBills } from "@/components/UpcomingBills";
import { InstallmentTracker } from "@/components/InstallmentTracker";
import { SubscriptionsPanel } from "@/components/SubscriptionsPanel";
import { TopExpenses } from "@/components/TopExpenses";
import { AccountSplit } from "@/components/AccountSplit";
import { ForecastCard } from "@/components/ForecastCard";
import { SmartInsights } from "@/components/SmartInsights";
import { HealthGauge } from "@/components/HealthGauge";
import { StatCard } from "@/components/StatCard";
import { BudgetList } from "@/components/BudgetList";
import { AIAdvisor } from "@/components/AIAdvisor";
import { TransactionList } from "@/components/TransactionList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MonthPicker } from "@/components/MonthPicker";
import { SetupChecklist } from "@/components/SetupChecklist";
import { DashboardTabs, type DashTab } from "@/components/DashboardTabs";
import {
  SpendingChart,
  CategoryDonut,
  MonthlyCompare,
  WeekdayChart,
} from "@/components/LazyCharts";
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

  const [
    { transactions, budgets, savingsTarget, monthlySalary, demo, userEmail },
    rules,
  ] = await Promise.all([loadData(monthKey, 12), loadRecurringRules()]);
  const summary = summarize(transactions, budgets, monthKey, monthlySalary);
  const series = dailySpendSeries(transactions, monthKey);
  const compare = monthlyExpenseTotals(transactions, monthKey);
  const weekdays = weekdayTotals(transactions, monthKey);
  const biggest = topExpenses(transactions, monthKey);
  const accounts = accountTotals(transactions, monthKey);
  const forecast = spendForecast(transactions, monthKey);
  const deltas = categoryDeltas(transactions, monthKey);
  const health = financialHealthScore(summary, savingsTarget);
  const topExpense = biggest[0];
  const bills = upcomingBills(rules);
  const installments = detectInstallments(transactions);
  const subscriptions = detectSubscriptions(transactions);
  const saved = summary.balance > 0 ? summary.balance : 0;
  const savingsPct =
    savingsTarget > 0 ? Math.round((saved / savingsTarget) * 100) : 0;

  // Saudação pelo horário de Brasília (o app é dinâmico, recalcula por request).
  const hourBR = Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }).format(new Date())
  );
  const greeting =
    hourBR < 6
      ? "Boa madrugada"
      : hourBR < 12
      ? "Bom dia"
      : hourBR < 18
      ? "Boa tarde"
      : "Boa noite";

  const hasBills = bills.length > 0 || installments.length > 0 || subscriptions.length > 0;

  const tabs: DashTab[] = [
    {
      id: "resumo",
      label: "Resumo",
      icon: "home",
      content: (
        <>
          <AIAdvisor summary={summary} savingsTarget={savingsTarget} />
          <section className="grid gap-5 lg:grid-cols-2">
            <SmartInsights
              deltas={deltas}
              balance={summary.balance}
              savingsTarget={savingsTarget}
              forecast={forecast}
              topExpense={
                topExpense
                  ? {
                      description: topExpense.description,
                      amount: topExpense.amount,
                      category: topExpense.category,
                    }
                  : undefined
              }
            />
            <HealthGauge health={health} />
          </section>
          <section className="grid gap-5 lg:grid-cols-2">
            <SpendingChart data={series} />
            <CategoryDonut data={summary.byCategory} />
          </section>
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
        </>
      ),
    },
    {
      id: "analises",
      label: "Análises",
      icon: "scale",
      content: (
        <>
          <MonthlyCompare data={compare} selectedMonth={monthKey} />
          <section className="grid gap-5 lg:grid-cols-2">
            <ForecastCard forecast={forecast} income={summary.income} />
            <AccountSplit data={accounts} />
          </section>
          <section className="grid gap-5 lg:grid-cols-2">
            <WeekdayChart data={weekdays} />
            <TopExpenses transactions={biggest} />
          </section>
          <BudgetList status={summary.budgetStatus} />
        </>
      ),
    },
    {
      id: "contas",
      label: "Contas",
      icon: "calendar",
      content: hasBills ? (
        <>
          {(bills.length > 0 || installments.length > 0) && (
            <section className="grid gap-5 lg:grid-cols-2">
              <UpcomingBills bills={bills} />
              <InstallmentTracker plans={installments} />
            </section>
          )}
          {subscriptions.length > 0 && <SubscriptionsPanel subs={subscriptions} />}
        </>
      ) : (
        <div className="glass p-8 text-center">
          <div className="text-dim mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full fill-1">
            <Icon name="calendar" size={20} />
          </div>
          <h3 className="font-semibold">Nada por aqui ainda</h3>
          <p className="text-dim mx-auto mt-1 max-w-sm text-sm">
            Cadastre contas fixas em <strong>Ajustes</strong> para ver os
            vencimentos, ou importe extratos para detectar parcelados e
            assinaturas automaticamente.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/settings" className="btn-glass">
              Recorrentes
            </Link>
            <Link href="/import" className="btn-primary">
              Importar
            </Link>
          </div>
        </div>
      ),
    },
  ];

  return (
    <main className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[32px]">
            {greeting}
            {userEmail ? `, ${userEmail.split("@")[0]}` : ""}
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

      {/* Onboarding (some quando tudo está configurado) */}
      {!demo && (
        <SetupChecklist
          hasSalary={monthlySalary > 0}
          hasBudgets={budgets.length > 0}
          hasTransactions={transactions.length > 0}
        />
      )}

      {/* Cards de resumo (sempre visíveis) */}
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

      <DashboardTabs tabs={tabs} />
    </main>
  );
}
