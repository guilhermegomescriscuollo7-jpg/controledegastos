"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";

export function AuthBox({
  email,
  name,
}: {
  email: string | null;
  name: string | null;
}) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [value, setValue] = useState(name ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

  async function saveName() {
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: value.trim() },
    });
    setSaving(false);
    if (error) setMsg("Erro: " + error.message);
    else {
      setEditing(false);
      router.refresh();
    }
  }

  if (!email) {
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

  const initial = (name || email)[0]?.toUpperCase();

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white"
            style={{ background: "var(--accent)" }}
          >
            <span className="text-lg font-semibold">{initial}</span>
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight">
              {name || "Sua conta"}
            </h3>
            <p className="text-dim truncate text-sm">{email}</p>
          </div>
        </div>
        <button className="btn-glass flex items-center gap-1.5" onClick={logout}>
          <Icon name="arrow-right" size={15} /> Sair
        </button>
      </div>

      {editing ? (
        <div className="mt-4 space-y-2">
          <input
            className="input-glass"
            placeholder="Seu nome"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          {msg && <p className="text-sm text-accent-red">{msg}</p>}
          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={saveName} disabled={saving}>
              {saving ? "Salvando…" : "Salvar nome"}
            </button>
            <button className="btn-glass" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setValue(name ?? "");
            setEditing(true);
          }}
          className="link-dim mt-3 flex items-center gap-1.5 text-sm"
        >
          <Icon name="edit" size={14} /> {name ? "Editar nome" : "Adicionar seu nome"}
        </button>
      )}
    </div>
  );
}
