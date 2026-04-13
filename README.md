# 🚀 Andromeda Dashboard

**SaaS multi-tenant para análise de anúncios do Meta Ads**  
Stack: React 19 · TypeScript · Tailwind CSS 3 · Vite 6 · Facebook Graph API

---

## Sobre o Projeto

O **Andromeda Dashboard** (Andromeda Lab) permite que agências e gestores de tráfego criem **workspaces por cliente**, conectem contas Meta Ads via OAuth e visualizem métricas de performance em dashboards interativos, sem expor tokens no frontend.

---

## Documentação do Projeto (`/docs`)

| Documento | Descrição |
|---|---|
| [📋 PDR](./docs/PDR_Andromeda_Dashboard.md) | Product Design Requirements — requisitos funcionais, fluxos, estados de UI e critérios de aceitação |
| [🏗️ SDD](./docs/SDD_Andromeda_Dashboard.md) | Software Design Document — arquitetura, componentes, tipos TS, integração Graph API, padrões de fetch e deploy |
| [🧠 Skills](./docs/Skills_Andromeda_Dashboard.md) | Erros encontrados, correções aplicadas e padrões estabelecidos ao longo do desenvolvimento |

> **Para IAs e revisores:** Leia os docs acima antes de qualquer alteração no código. Eles contêm os padrões exatos adotados e os erros já resolvidos.

---

## Rotas Principais

| Rota | Funcionalidade |
|---|---|
| `/workspaces` | Lista e cria workspaces |
| `/w/:workspaceId/setup` | Wizard de setup (5 passos) |
| `/w/:workspaceId/dashboard` | Dashboard de performance |
| `/w/:workspaceId/ads/ad/:adId` | Detalhes do anúncio |
| `/admin/setup-meta` | Configuração do App Meta (admin) |
| `/integrations` | Área de integrações |
| `/reports` | Relatórios personalizados |
| `/logs` | Activity logs |

---

## Setup Local

**Pré-requisitos:** Node.js 18+

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em HTTPS (obrigatório para Facebook SDK)
npm run dev
# → Acesse https://localhost:3000
```

> ⚠️ **HTTPS é obrigatório.** O Facebook JavaScript SDK bloqueia chamadas via HTTP.

---

## Configuração do Meta App

Antes de usar o wizard, acesse `/admin/setup-meta` e configure:

1. **App ID** — obtido no [Facebook Developers](https://developers.facebook.com)
2. **App Secret** — mínimo 16 caracteres (nunca exposto no frontend)
3. No painel Meta: ativar **"Login com SDK do JavaScript"** e adicionar `https://localhost:3000` nos domínios permitidos

---

## Estrutura de Arquivos

```
/
├── docs/                        ← PDR, SDD e Skills (documentação)
├── components/
│   ├── SaaSPages.tsx            ← Workspaces, Wizard, Integrações
│   ├── DashboardItems.tsx       ← KpiCard, DataTable, TrendLineChart
│   ├── AdDetailsPage.tsx        ← Detalhes do anúncio
│   ├── Navigation.tsx           ← AppShell, Sidebar
│   └── UI.tsx                   ← Modal, Button, Badge, Toast...
├── utils/
│   └── kv.ts                    ← Abstração do localStorage
├── types.ts                     ← Todas as interfaces TypeScript
├── App.tsx                      ← Router + estado global + páginas
└── index.tsx                    ← Entry point React
```

---

## Deploy (Vercel)

```bash
npm run build
```

> ✅ HashRouter (`/#/`) não requer configuração de rewrite no Vercel.  
> ✅ Vite, @vitejs/plugin-react e tailwindcss estão em `dependencies` (não devDependencies).
