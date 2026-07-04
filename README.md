# 💰 Controle de Gastos

Gestor financeiro pessoal com **dashboard**, **gráficos**, **IA (Claude)** que dá dicas de economia e **alertas** quando você passa do limite. Visual estilo **Apple Liquid Glass**. Funciona no navegador e no iPhone (PWA — dá pra "instalar" na tela inicial).

- **Framework:** Next.js 15 (App Router) + TypeScript + Tailwind
- **Banco/Login:** Supabase (Postgres + Auth por link mágico)
- **IA:** Claude (Anthropic) — com fallback por regras, sem custo, se não configurar
- **Deploy:** Vercel
- **Bancos:** importação de **CSV** (Nubank/Sicoob) já pronta; conexão automática via Open Finance/Pluggy preparada para o futuro

---

## 🚀 Rodar no seu computador

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — ele já abre em **modo demonstração** com dados de exemplo, então você vê tudo funcionando na hora. Para usar seus dados de verdade, faça os 3 passos abaixo.

---

## 1) Supabase (banco de dados + login)

1. Crie uma conta grátis em https://supabase.com e clique em **New project**.
2. Menu **SQL Editor → New query**, cole TODO o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**. Isso cria as tabelas e a segurança (cada usuário só vê os próprios dados).
3. Menu **Project Settings → API** e copie:
   - **Project URL**
   - **anon public** key
4. Crie o arquivo `.env.local` (copie de `.env.local.example`) e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

5. **Login por e-mail:** em **Authentication → Providers → Email**, deixe habilitado. Em **Authentication → URL Configuration**, adicione `http://localhost:3000` e depois a URL da Vercel em "Redirect URLs".

Reinicie o `npm run dev`, vá em **Ajustes** e entre com seu e-mail (link mágico).

---

## 2) IA da Claude (dicas de economia)

1. Crie uma chave em https://console.anthropic.com → **Settings → API Keys**.
2. No `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Sem essa chave o app continua funcionando: as dicas e alertas vêm de **regras locais** (grátis). Com a chave, o consultor usa o modelo **Claude Haiku** (barato) para conselhos personalizados.

---

## 3) Deploy na Vercel (usar no iPhone)

1. Suba o código para o **GitHub** (veja abaixo).
2. Em https://vercel.com → **Add New → Project** → importe o repositório.
3. Em **Settings → Environment Variables**, adicione as MESMAS variáveis do `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`).
4. **Deploy**. Você recebe uma URL tipo `https://controle-de-gastos.vercel.app`.
5. Volte ao Supabase → **Authentication → URL Configuration** e adicione essa URL.

### 📱 Instalar no iPhone

Abra a URL da Vercel no **Safari** → botão **Compartilhar** → **Adicionar à Tela de Início**. Ele vira um app em tela cheia.

---

## 📤 Subir no GitHub

```bash
git init
git add .
git commit -m "Primeira versao do Controle de Gastos"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/controle-de-gastos.git
git push -u origin main
```

> O `.gitignore` já protege o `.env.local` — suas chaves **não** vão para o GitHub.

---

## 🧾 Importar extratos (Nubank / Sicoob)

Aba **Importar** → escolha a conta → selecione o **CSV** que você baixou do app do banco.
O sistema detecta as colunas de data, descrição e valor, e **sugere a categoria** de cada gasto (você pode ajustar antes de salvar).

> Reimportar o mesmo arquivo é seguro: transações repetidas (mesma data,
> descrição e valor já salvos) são **ignoradas automaticamente**.

- **Nubank:** conta ou cartão → extrato/fatura → exportar CSV.
- **Sicoob:** extrato → período → exportar CSV.

## 🏦 Conexão automática com o banco (futuro)

Nubank e Sicoob **não têm API pública** para pegar login/senha — isso seria inseguro e proibido. O caminho correto é o **Open Finance** através de um agregador homologado (ex.: **Pluggy**, pago). O código já está preparado: existe o tipo de origem `pluggy` e as variáveis `PLUGGY_CLIENT_ID` / `PLUGGY_CLIENT_SECRET`. Quando você contratar, dá pra adicionar a sincronização automática sem refazer o app.

---

## 🗂️ Estrutura

```
src/
  app/
    page.tsx            Dashboard (resumo, gráficos, IA)
    transactions/       Lista + adicionar gasto manual
    import/             Importar CSV
    settings/           Login, metas e limites
    api/ai/route.ts     IA (Claude) com fallback por regras
    auth/callback/      Retorno do login mágico
  components/           UI (glass cards, gráficos, formulários)
  lib/                  Supabase, cálculos, categorias, dados demo
supabase/schema.sql     Tabelas + segurança (RLS)
```

## 🧪 Testes

```bash
npm test
```

Roda os testes unitários (parsing de extratos e cálculos financeiros) com
Vitest. O GitHub Actions executa testes + build a cada push na `main`.

## 💡 Como funciona o controle

- Categorias fixas do seu perfil: financiamento e seguro do carro, cartão, assinaturas, mercado, combustível, academia, internet.
- Em **Ajustes** você define a **meta de quanto guardar** e o **limite de cada categoria**.
- Passou do limite → aparece **alerta vermelho** no topo e a IA foca a dica ali.
- O consultor IA olha seu mês e diz, em reais, **onde e quanto** dá pra cortar.
