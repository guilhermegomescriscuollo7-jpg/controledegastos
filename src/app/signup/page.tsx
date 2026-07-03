"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase não configurado neste ambiente.");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Este e-mail já tem conta. Faça login."
          : error.message
      );
      return;
    }
    // Se veio sessão, confirmação de e-mail está desligada -> já entra.
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      setSentEmail(email);
    }
  }

  if (sentEmail) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center">
        <div className="animate-fadeup glass p-7 text-center">
          <div
            className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl text-white"
            style={{ background: "var(--accent)" }}
          >
            <Icon name="check" size={24} strokeWidth={2.2} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Confirme seu e-mail</h1>
          <p className="text-dim mt-2 text-sm">
            Enviamos um link de confirmação para <strong>{sentEmail}</strong>.
            Abra o e-mail e clique no link para ativar sua conta.
          </p>
          <Link href="/login" className="btn-glass mt-5 inline-block">
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center">
      <div className="animate-fadeup glass p-7">
        <div
          className="mb-5 grid h-12 w-12 place-items-center rounded-2xl text-white"
          style={{ background: "var(--accent)" }}
        >
          <Icon name="sparkles" size={24} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
        <p className="text-dim mt-1 text-sm">
          Comece a organizar seus gastos hoje
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            className="input-glass"
            type="text"
            placeholder="Seu nome"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
              placeholder="Senha (mín. 6 caracteres)"
              autoComplete="new-password"
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
            {loading ? "Criando…" : "Criar conta"}
          </button>
        </form>

        <p className="text-dim mt-5 text-center text-sm">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium" style={{ color: "var(--accent)" }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
