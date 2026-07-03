"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase não configurado neste ambiente.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(
        error.message.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : error.message
      );
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center">
      <div className="animate-fadeup glass p-7">
        <div
          className="mb-5 grid h-12 w-12 place-items-center rounded-2xl text-white"
          style={{ background: "var(--accent)" }}
        >
          <Icon name="wallet" size={24} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
        <p className="text-dim mt-1 text-sm">Entre na sua conta para continuar</p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            className="input-glass"
            type="email"
            placeholder="E-mail"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <input
              className="input-glass pr-11"
              type={show ? "text" : "password"}
              placeholder="Senha"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="link-dim absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            >
              {show ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {error && <p className="text-sm text-accent-red">{error}</p>}

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="text-dim mt-5 text-center text-sm">
          Não tem conta?{" "}
          <Link href="/signup" className="font-medium" style={{ color: "var(--accent)" }}>
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
