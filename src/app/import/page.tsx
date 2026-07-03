import { ImportClient } from "@/components/ImportClient";

export default function ImportPage() {
  return (
    <main className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Importar extrato</h1>
        <p className="text-dim text-sm">
          Traga suas transações do Nubank e Sicoob via arquivo CSV
        </p>
      </header>

      <div className="glass border-accent-blue/30 p-4 text-sm">
        <p className="mb-2 font-semibold">📲 Como pegar o CSV:</p>
        <ul className="text-dim list-inside list-disc space-y-1">
          <li>
            <strong>Nubank:</strong> app → conta ou cartão → extrato/fatura →
            exportar → CSV.
          </li>
          <li>
            <strong>Sicoob:</strong> app/internet banking → extrato → período →
            exportar CSV.
          </li>
        </ul>
        <p className="mt-3 text-xs">
          Quer conexão automática (sem baixar arquivo)? É possível via{" "}
          <strong>Open Finance / Pluggy</strong> — já deixei o app preparado
          para isso (veja Ajustes).
        </p>
      </div>

      <ImportClient />
    </main>
  );
}
