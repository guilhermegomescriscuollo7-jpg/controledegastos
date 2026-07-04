import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center">
      <div className="glass max-w-sm p-8 text-center">
        <h1 className="text-lg font-semibold">Página não encontrada</h1>
        <p className="text-dim mt-2 text-sm">
          O endereço que você tentou abrir não existe.
        </p>
        <Link href="/" className="btn-primary mt-5 inline-block w-full">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
