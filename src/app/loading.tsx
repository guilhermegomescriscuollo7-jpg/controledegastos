export default function Loading() {
  return (
    <main className="space-y-5" aria-busy="true" aria-label="Carregando">
      <div className="glass h-16 animate-pulse" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="glass h-28 animate-pulse" />
        <div className="glass h-28 animate-pulse" />
        <div className="glass h-28 animate-pulse" />
        <div className="glass h-28 animate-pulse" />
      </div>
      <div className="glass h-40 animate-pulse" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass h-64 animate-pulse" />
        <div className="glass h-64 animate-pulse" />
      </div>
    </main>
  );
}
