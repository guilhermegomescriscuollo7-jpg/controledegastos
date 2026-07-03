import { loadData } from "@/lib/data";
import { AuthBox } from "@/components/AuthBox";
import { BudgetEditor } from "@/components/BudgetEditor";
import { SalaryEditor } from "@/components/SalaryEditor";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { budgets, savingsTarget, monthlySalary, demo, userEmail } =
    await loadData();

  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[32px]">
          Ajustes
        </h1>
        <p className="text-dim text-sm">Conta, renda, metas e limites</p>
      </header>

      <AuthBox email={userEmail} />

      <SalaryEditor salary={monthlySalary} canEdit={!demo} />

      <ThemeToggle variant="segmented" />

      <BudgetEditor
        budgets={budgets}
        savingsTarget={savingsTarget}
        canEdit={!demo}
      />

      <div className="glass p-5 text-sm">
        <h3 className="mb-2 font-semibold">Conexão bancária automática</h3>
        <p className="text-dim">
          Nubank e Sicoob não têm API pública direta. A forma segura e legal de
          puxar transações automaticamente é via <strong>Open Finance</strong>,
          usando um agregador homologado como a <strong>Pluggy</strong> (serviço
          pago). O app já tem o campo <code>source: &quot;pluggy&quot;</code> e as
          variáveis de ambiente preparadas — quando você contratar, dá pra
          plugar sem reescrever nada. Por enquanto, use a{" "}
          <strong>importação de CSV ou PDF</strong>.
        </p>
      </div>
    </main>
  );
}
