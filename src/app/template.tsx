"use client";

// Re-monta a cada navegação → dá a transição suave entre telas (estilo Apple).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
