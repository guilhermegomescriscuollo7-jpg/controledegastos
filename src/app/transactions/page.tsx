import { loadData } from "@/lib/data";
import { TransactionManager } from "@/components/TransactionManager";
import { AddTransactionForm } from "@/components/AddTransactionForm";
import { RecategorizeButton } from "@/components/RecategorizeButton";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const { transactions, demo } = await loadData();

  return (
    <main className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[32px]">
            Transações
          </h1>
          <p className="text-dim text-sm">
            {transactions.length} lançamentos {demo ? "(exemplo)" : ""} · toque
            em uma transação para editar ou excluir
          </p>
        </div>
        {!demo && (
          <div className="shrink-0 text-right">
            <RecategorizeButton transactions={transactions} demo={demo} />
          </div>
        )}
      </header>

      <AddTransactionForm />

      <TransactionManager transactions={transactions} demo={demo} />
    </main>
  );
}
