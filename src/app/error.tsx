"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[60vh] place-items-center">
      <div className="glass max-w-sm p-8 text-center">
        <h1 className="text-lg font-semibold">Algo deu errado</h1>
        <p className="text-dim mt-2 text-sm">
          Ocorreu um erro inesperado ao carregar esta tela. Tente novamente —
          seus dados estão seguros.
        </p>
        <button className="btn-primary mt-5 w-full" onClick={reset}>
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
