"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";

export function AuthBox({ email }: { email: string | null }) {
  const router = useRouter();
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="glass p-5">
        <h3 className="mb-1 font-semibold">Conexão</h3>
        <p className="text-dim text-sm">
          Supabase ainda não configurado. Rodando em <strong>modo demo</strong>.
        </p>
      </div>
    );
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (email) {
    return (
      <div className="glass flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div
            className="grid h-11 w-11 place-items-center rounded-full text-white"
            style={{ background: "var(--accent)" }}
          >
            <span className="text-lg font-semibold">
              {email[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold leading-tight">Sua conta</h3>
            <p className="text-dim text-sm">{email}</p>
          </div>
        </div>
        <button className="btn-glass flex items-center gap-1.5" onClick={logout}>
          <Icon name="arrow-right" size={15} /> Sair
        </button>
      </div>
    );
  }

  return (
    <div className="glass p-5">
      <h3 className="mb-1 font-semibold">Entrar</h3>
      <p className="text-dim mb-3 text-sm">Você não está conectado.</p>
      <Link href="/login" className="btn-primary inline-block">
        Fazer login
      </Link>
    </div>
  );
}
