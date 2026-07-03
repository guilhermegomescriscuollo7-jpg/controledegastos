import { loadData } from "@/lib/data";
import { TransactionList } from "@/components/TransactionList";
import { AddTransactionForm } from "@/components/AddTransactionForm";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const { transactions, demo } = await loadData();

  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Transações</h1>
        <p className="text-dim text-sm">
          {transactions.length} lançamentos {demo ? "(exemplo)" : ""}
        </p>
      </header>

      <AddTransactionForm />

      <TransactionList transactions={transactions} />
    </main>
  );
}
