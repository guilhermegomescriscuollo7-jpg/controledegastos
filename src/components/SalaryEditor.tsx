"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Icon } from "@/components/icons";

export function SalaryEditor({
  salary,
  canEdit,
}: {
  salary: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(salary || ""));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    if (!isSupabaseConfigured() || !canEdit) {
      setMsg("Entre na sua conta para salvar o salário.");
      return;
    }
    const parsed = parseFloat(value.replace(",", "."));
    if (value.trim() !== "" && (isNaN(parsed) || parsed < 0)) {
      setMsg("Informe um valor válido (ou deixe vazio para zerar).");
      return;
    }
    setSaving(true);
    setMsg(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMsg("Sessão expirada, entre novamente.");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        monthly_salary: isNaN(parsed) ? 0 : parsed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) setMsg("Erro ao salvar: " + error.message);
    else {
      setMsg("Salário salvo!");
      router.refresh();
    }
  }

  return (
    <div className="glass p-5">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="grid h-8 w-8 place-items-center rounded-full"
          style={{ background: "color-mix(in srgb, #34c759 15%, transparent)", color: "#34c759" }}
        >
          <Icon name="wallet" size={17} />
        </span>
        <h3 className="font-semibold">Salário / renda mensal</h3>
      </div>
      <p className="text-dim mb-4 text-xs">
        Cadastre aqui sua renda fixa do mês. Ela entra automaticamente como
        receita em todos os meses — não precisa lançar toda vez.
      </p>

      <div className="relative">
        <span className="text-dim pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">
          R$
        </span>
        <input
          className="input-glass pl-9"
          inputMode="decimal"
          placeholder="Ex: 3500"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>

      {msg && <p className="mt-3 text-sm text-accent-amber">{msg}</p>}

      <button className="btn-primary mt-4 w-full" onClick={save} disabled={saving}>
        {saving ? "Salvando…" : "Salvar salário"}
      </button>
      {!canEdit && (
        <p className="text-dim mt-2 text-center text-xs">
          Valor de exemplo. Entre para editar o seu.
        </p>
      )}
    </div>
  );
}
