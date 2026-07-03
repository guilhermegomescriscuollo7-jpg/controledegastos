"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AuthBox({ email }: { email: string | null }) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!configured) {
    return (
      <div className="glass p-5">
        <h3 className="mb-1 font-semibold">🔌 Conexão</h3>
        <p className="text-dim text-sm">
          Supabase ainda não configurado. Rodando em <strong>modo demo</strong>.
          Siga o README para colar suas chaves em <code>.env.local</code>.
        </p>
      </div>
    );
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setMsg("Erro: " + error.message);
    else setSent(true);
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  if (email) {
    return (
      <div className="glass flex items-center justify-between p-5">
        <div>
          <h3 className="font-semibold">Conectado</h3>
          <p className="text-dim text-sm">{email}</p>
        </div>
        <button className="btn-glass" onClick={logout}>
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="glass p-5">
      <h3 className="mb-1 font-semibold">Entrar</h3>
      {sent ? (
        <p className="text-sm text-accent-green">
          ✓ Link mágico enviado para <strong>{value}</strong>. Abra seu e-mail e
          clique para entrar.
        </p>
      ) : (
        <form onSubmit={sendLink} className="space-y-3">
          <p className="text-dim text-sm">
            Digite seu e-mail — enviamos um link mágico, sem senha.
          </p>
          <input
            className="input-glass"
            type="email"
            placeholder="voce@email.com"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
          {msg && <p className="text-sm text-accent-red">{msg}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Enviando…" : "Enviar link de acesso"}
          </button>
        </form>
      )}
    </div>
  );
}
