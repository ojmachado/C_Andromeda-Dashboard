# SDD — Software Design Document
## Andromeda Dashboard (Andromeda Lab)
**Versão:** 1.0  
**Data:** Abril 2026  
**Stack:** React 19 + TypeScript + Tailwind CSS 3 + Vite 6 + Facebook Graph API

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   BROWSER                         │
│                                                   │
│  ┌──────────────────────────────────────────┐    │
│  │         React SPA (Vite/React Router)    │    │
│  │                                          │    │
│  │  App.tsx ──► Router ──► Page Components  │    │
│  │                │                         │    │
│  │         components/                      │    │
│  │           ├─ Navigation.tsx              │    │
│  │           ├─ SaaSPages.tsx               │    │
│  │           ├─ DashboardItems.tsx          │    │
│  │           ├─ AdDetailsPage.tsx           │    │
│  │           ├─ CustomReportsPage.tsx       │    │
│  │           ├─ TeamManagement.tsx          │    │
│  │           ├─ ActivityLogsPage.tsx        │    │
│  │           ├─ AccountSettingsPage.tsx     │    │
│  │           └─ UI.tsx                     │    │
│  │                                          │    │
│  │  utils/                                  │    │
│  │    ├─ kv.ts  (localStorage abstraction) │    │
│  │    └─ security.ts (legacy — vazio)       │    │
│  │                                          │    │
│  │  types.ts (todas as interfaces TS)       │    │
│  └──────────────────────────────────────────┘    │
│                    │                              │
│           Facebook JS SDK (CDN)                   │
│                    │                              │
└────────────────────┼──────────────────────────────┘
                     │  HTTPS only
                     ▼
         ┌───────────────────────┐
         │   Meta Graph API      │
         │   v21.0               │
         │   /me/businesses      │
         │   /me/adaccounts      │
         │   /{act}/campaigns    │
         │   /{act}/adsets       │
         │   /{act}/ads          │
         │   /{act}/insights     │
         └───────────────────────┘
```

---

## 2. Estrutura de Arquivos

```
andromeda-dashboard/
├── index.html                   # Entry point HTML + Tailwind CDN config
├── index.tsx                    # React DOM render + HashRouter
├── App.tsx                      # Router + global state + page orchestration
├── types.ts                     # TypeScript interfaces e enums globais
├── package.json                 # Dependências (React 19, React Router 7, Vite 6)
├── vite.config.ts               # Vite config + HTTPS via basicSsl
├── tsconfig.json
├── utils/
│   ├── kv.ts                    # localStorage CRUD abstraction
│   └── security.ts              # (Legacy vazio — criptografia removida)
└── components/
    ├── UI.tsx                   # Componentes base: Modal, Card, Button, Badge
    ├── Navigation.tsx           # AppShell, Sidebar, WorkspaceSwitcher
    ├── SaaSPages.tsx            # Workspaces, SetupWizard, IntegrationsPage
    ├── DashboardItems.tsx       # KpiCard, KpiGrid, DataTable, TrendLineChart
    ├── AdDetailsPage.tsx        # Página de detalhes do anúncio
    ├── CustomReportsPage.tsx    # Relatórios personalizados
    ├── ActivityLogsPage.tsx     # Activity logs
    ├── TeamManagement.tsx       # Gestão de membros
    ├── AccountSettingsPage.tsx  # Configurações da conta
    ├── LoginPage.tsx            # Login / autenticação do owner
    ├── DashboardTemplates.tsx   # Templates KPI pré-definidos
    ├── DashboardShareModal.tsx  # Modal de compartilhamento de dashboard
    └── SharedWorkspaceDashboard.tsx # Dashboard público via shareId
```

---

## 3. Tipos e Interfaces (`types.ts`)

### 3.1 Enums

```typescript
enum SetupStep {
  Connect = 0,
  Business = 1,
  AdAccount = 2,
  InsightsTest = 3,
  Finished = 4
}

type DateRangePreset = 'last_7d' | 'last_30d' | 'this_month' | 'last_month' | 'lifetime' | 'maximum' | 'custom';
type KpiFormat = 'currency' | 'number' | 'percent' | 'multiplier' | 'string';
```

### 3.2 Entidades de Domínio

```typescript
interface Workspace {
  id: string;
  name: string;
  metaConnected: boolean;
  adAccountId?: string;
  businessId?: string;
  preferredTemplateId?: string;
  sharedConfig?: { isEnabled: boolean; shareId: string; };
}

interface InsightData {
  id?: string;
  name: string;
  campaignName?: string;
  campaignDetailsLink?: string;
  status?: string;
  objective?: string;
  adPreviewLink?: string;
  fbLink?: string;
  igLink?: string;
  detailsLink?: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  roas: number;
  cpa: number;
  messages: number;
  costPerConversation: number;
}

interface MetaBusiness { id, name, currency, timezone_name, status }
interface MetaAdAccount { id, name, currency, timezone_name, status }
interface AdCreativeData { id, name, title, body, image_url, thumbnail_url, ... }
interface AdminConfig { appId, isSecretSet, redirectUri, appDomain }
interface CustomReport { id, name, author, lastEdited, type, isPublic, shareId, config }
interface ActivityLog { id, timestamp, user, action, resource, details, status }
interface DashboardTemplate { id, name, description, category, icon, kpis: KpiConfig[] }
interface KpiConfig { key, label, icon, format, trendCheck? }
```

---

## 4. Componentes React

### 4.1 `App.tsx` — Orchestrator

**Responsabilidades:**
- Gerencia estado global de workspaces (`useState<Workspace[]>`)
- Inicializa Facebook SDK com App ID do `localStorage`
- Redireciona HTTP → HTTPS em produção
- Define todas as rotas via `HashRouter`

**Estado Global:**
```typescript
const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
const [sdkReady, setSdkReady] = useState(false);
const [currentUser, setCurrentUser] = useState<User | null>(null);
```

**Efeitos:**
1. `useEffect` — Carrega workspaces do `localStorage` na montagem
2. `useEffect` — Inicializa FB SDK (`window.FB.init`) quando App ID disponível
3. `useEffect` — Escuta evento `sys_config_change` para reinicializar SDK sem reload

**Rotas (HashRouter):**
```
/ → LoginPage (se não autenticado)
/workspaces → WorkspacesPage (SaaSPages)
/w/:id/setup → WorkspaceSetupRoute → SetupWizard
/w/:id/dashboard → DashboardPage
/w/:id/ads/ad/:adId → AdDetailsPage
/admin/setup-meta → AdminSetupPage
/integrations → IntegrationsPage
/reports → CustomReportsPage
/logs → ActivityLogsPage
/team → TeamManagement
/settings → AccountSettingsPage
/connect/success → ConnectSuccessPage
/connect/error → ConnectErrorPage
```

---

### 4.2 `components/SaaSPages.tsx`

#### `WorkspacesPage`
- Carrega workspaces do estado global
- Renderiza grid responsivo de `WorkspaceCard`
- Controla modal de criação
- Callbacks: `onCreateWorkspace`, `onNavigate`

#### `SetupWizard`
Props: `workspace`, `sdkReady`, `onComplete`, `onUpdateWorkspace`

**Fluxo de estado interno:**
```typescript
const [step, setStep] = useState<SetupStep>(SetupStep.Connect);
const [fbToken, setFbToken] = useState<string>('');
const [businesses, setBusinesses] = useState<MetaBusiness[]>([]);
const [selectedBiz, setSelectedBiz] = useState<string>('');
const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
const [selectedAccount, setSelectedAccount] = useState<MetaAdAccount|null>(null);
```

**Integração Facebook SDK:**
```typescript
// Passo 1: Login
window.FB.login((resp) => {
  if (resp.status === 'connected') {
    setFbToken(resp.authResponse.accessToken);
    setStep(SetupStep.Business);
  }
}, { scope: 'ads_read,read_insights' });

// Passo 2: Buscar BMs
window.FB.api('/me/businesses', { access_token: fbToken }, (r) => {
  setBusinesses(r.data || []);
});

// Passo 3A: Contas do BM (owned + client)
Promise.all([
  fbApiGet(`/${bizId}/owned_ad_accounts`, { fields: 'id,name,currency,timezone_name,account_status' }),
  fbApiGet(`/${bizId}/client_ad_accounts`, { fields: '...' })
]).then(([owned, client]) => setAdAccounts([...owned, ...client]));

// Passo 3B: Contas pessoais
window.FB.api('/me/adaccounts', { fields: '...', access_token: fbToken }, (r) => {
  setAdAccounts(r.data || []);
});
```

#### `IntegrationsPage`
- Lê/salva `andromeda_meta_config` no localStorage
- Modal com campos App ID (numérico) e App Secret (≥16 chars)
- Teste de integração via `FB.getLoginStatus()`
- Dispara evento `sys_config_change` após salvar (sem page reload)

#### `AdminSetupPage`
- Wizard admin 4 passos
- Detecta URL do ambiente: `window.location.origin`
- Validações em tempo real (App ID numérico, Secret ≥16 chars)
- Botão copiar com feedback "Copiado!" via Toast

---

### 4.3 `components/DashboardItems.tsx`

#### `KpiCard`
```typescript
interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: string;
  trend?: { direction: 'up' | 'down' | 'neutral'; value: string };
}
```

#### `DataTable`
```typescript
interface DataTableProps {
  data: InsightData[];
  viewLevel: 'campaign' | 'adset' | 'ad';
  isLoading?: boolean;
  onSort?: (key: keyof InsightData, direction: 'asc' | 'desc') => void;
}
```
- Cabeçalho dinâmico: "Campanha" / "Conjunto" / "Anúncio" conforme `viewLevel`
- Coluna "Link do Anúncio" visível apenas em nível `ad`
- Nome clicável: abre `AdDetailsPage` em nova aba
- Nome-campanha como sub-texto clicável para detalhes da campanha
- Ícones FB (azul) + IG (gradiente) com links separados

#### `TrendLineChart` (SVG)
```typescript
interface TrendLineChartProps {
  data: { date: string; value: number }[];
  label?: string; // ex: "Spend em BRL"
}
```
- SVG puro sem biblioteca externa
- Área de gradiente sob a linha (fill com opacity)
- Tooltip on-hover com data + valor exato
- Eixo Y com labels automáticos
- Pontos circulares em cada data point

---

### 4.4 `components/AdDetailsPage.tsx`

**Props:** `workspaceId`, `adId`

**Fetch de dados:**
```typescript
useEffect(() => {
  // 1. Busca metadados do anúncio
  FB.api(`/${adId}`, { fields: 'name,status,creative{...}' }, ...);
  
  // 2. Busca insights do anúncio
  FB.api(`/${adId}/insights`, {
    fields: 'spend,impressions,clicks,ctr,actions,action_values,purchase_roas',
    date_preset: datePreset,
    time_increment: 1
  }, ...);
}, [adId, datePreset]);
```

**Subtela de creative preview:**
- Tenta: `creative.object_story_spec.link_data.picture`
- Fallback: `creative.thumbnail_url`
- Se `video_id` presente: renderiza `<video>` tag

**Filtros:**
- Período: mesmos presets do Dashboard
- Objetivo: multi-select com checkboxes + "Todos"

---

### 4.5 `App.tsx — DashboardPage`

**Estado:**
```typescript
const [campaigns, setCampaigns] = useState<InsightData[]>([]);
const [trendData, setTrendData] = useState<{ date: string; value: number }[]>([]);
const [kpis, setKpis] = useState<Record<string, number>>({});
const [timeRange, setTimeRange] = useState<DateRangePreset>('last_30d');
const [customDates, setCustomDates] = useState({ start: '', end: '' });
const [viewLevel, setViewLevel] = useState<'campaign' | 'adset' | 'ad'>('campaign');
const [objectives, setObjectives] = useState<string[]>([]);
const [isLoading, setIsLoading] = useState(false);
const requestRef = useRef(0); // Anti race condition
```

**Estratégia de fetch (batch):**
```typescript
const fetchData = async () => {
  const requestId = ++requestRef.current;
  
  // 1. Busca lista de entidades (campaings / adsets / ads)
  const entities = await fbGet(`/${adAccountId}/${viewLevel}s`, {
    fields: `id,name,status,objective`,
    limit: 500,
  });
  
  // 2. Busca insights em batch pelo nível
  const insights = await fbGet(`/${adAccountId}/insights`, {
    level: viewLevel,
    fields: 'campaign_id,adset_id,ad_id,spend,impressions,clicks,ctr,cpm,cpc,actions,action_values,purchase_roas',
    date_preset: timeRange === 'custom' ? undefined : timeRange,
    time_range: timeRange === 'custom' ? JSON.stringify({since, until}) : undefined,
    time_increment: 1,
    limit: 500,
  });
  
  // 3. Merge e guarda somente se requestId ainda é atual
  if (requestRef.current !== requestId) return; // Descarta resultado stale
  
  const merged = mergeEntitiesAndInsights(entities, insights);
  setCampaigns(merged);
};
```

---

## 5. Utilitários (`utils/kv.ts`)

**Schema de chaves do localStorage:**

| Chave | Conteúdo |
|---|---|
| `andromeda_meta_config` | `{ appId: string, appSecret: string }` |
| `andromeda_workspaces` | `Workspace[]` (array completo) |
| `andromeda_token_${workspaceId}` | `{ token: string, expiresAt: number }` |
| `andromeda_user` | `{ email, name, isMaster }` |

**API:**
```typescript
export const kv = {
  get: <T>(key: string): T | null => { ... },
  set: (key: string, value: unknown): void => { ... },
  delete: (key: string): void => { ... },
  clear: (): void => { ... },
};
```

---

## 6. Integração Facebook Graph API

### 6.1 Inicialização do SDK

```typescript
const loadFbSdk = (appId: string) => {
  if (window.FB) {
    window.FB.init({ appId, version: 'v21.0', xfbml: false, cookie: true });
    setSdkReady(true);
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://connect.facebook.net/en_US/sdk.js';
  script.async = true;
  script.onload = () => {
    window.FB.init({ appId, version: 'v21.0', xfbml: false, cookie: true });
    setSdkReady(true);
  };
  document.head.appendChild(script);
};
```

### 6.2 Helper `fbApiGet`

```typescript
const fbApiGet = (path: string, params: object): Promise<any> =>
  new Promise((resolve, reject) => {
    window.FB.api(path, params, (res: any) => {
      if (!res || res.error) reject(res?.error || 'Unknown error');
      else resolve(res);
    });
  });
```

### 6.3 Permissões OAuth Solicitadas
- `ads_read` — leitura de campanhas, conjuntos e anúncios
- `read_insights` — acesso às métricas de performance
- `business_management` — listagem de Business Managers

### 6.4 Campos Fetched por Nível

| Nível | Endpoint | Campos |
|---|---|---|
| Campanha | `/{act}/campaigns` | `id,name,status,objective,insights{spend,impressions,clicks,...}` |
| Conjunto | `/{act}/adsets` | `id,name,status,campaign{id,name},insights{...}` |
| Anúncio | `/{act}/ads` | `id,name,status,preview_shareable_link,creative{instagram_permalink_url},insights{...}` |
| Insights geral | `/{act}/insights` | `spend,impressions,clicks,ctr,cpm,cpc,actions,action_values,purchase_roas` |

### 6.5 Extração de Métricas de Actions

```typescript
const extractAction = (actions: any[], type: string): number => {
  const found = actions?.find(a => a.action_type === type);
  return found ? parseFloat(found.value) : 0;
};

const messages = extractAction(actions, 'onsite_conversion.messaging_conversation_started_7d');
const purchases = extractAction(actions, 'purchase');
const leads = extractAction(actions, 'lead');
```

---

## 7. Configuração do Ambiente

### 7.1 `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [react(), basicSsl()],
  resolve: {
    alias: { '@': '/src' },
  },
  server: { port: 3000, https: true },
});
```

### 7.2 Facebook Para Developers — Configuração

```
Produto: Facebook Login
  → Login com SDK JavaScript: SIM
  → URIs de redirecionamento OAuth válidos: https://<seu-domínio>/
  → Domínios permitidos para o SDK: https://<seu-domínio>

Configurações > Básico:
  → URL do Site: https://<seu-domínio>/
  → Domínios do App: <seu-domínio>
```

### 7.3 Deploy Vercel — `vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

> **Nota:** HashRouter (`#/`) evita a necessidade de rewrites em produção estática.

---

## 8. Padrões de Estado e Tratamento de Erros

### 8.1 Padrão de Loading com Anti Race Condition

```typescript
const requestRef = useRef(0);

const fetchData = async () => {
  const id = ++requestRef.current;
  setIsLoading(true);
  try {
    const result = await apiCall();
    if (requestRef.current !== id) return; // Descarta resultado stale
    setData(result);
  } catch (err) {
    if (requestRef.current !== id) return;
    setError(err.message);
    setData([]);
  } finally {
    if (requestRef.current === id) setIsLoading(false);
  }
};
```

### 8.2 Tratamento de Erro HTTPS

```typescript
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
  window.location.href = window.location.href.replace('http:', 'https:');
}
```

### 8.3 Re-inicialização Suave do SDK

```typescript
// SaaSPages: ao salvar config
window.dispatchEvent(new Event('sys_config_change'));

// App.tsx: listener
window.addEventListener('sys_config_change', () => {
  const config = kv.get<AdminConfig>('andromeda_meta_config');
  if (config?.appId) loadFbSdk(config.appId);
});
```

---

## 9. Componentes Reutilizáveis (`components/UI.tsx`)

| Componente | Props chave | Uso |
|---|---|---|
| `Modal` | `isOpen`, `onClose`, `title`, `width?` | Criar workspace, Configuração |
| `Card` | `className?`, `children` | Wrapper padrão de seções |
| `Button` | `variant`, `isLoading`, `disabled` | Ações primárias/secundárias |
| `Badge` / `StatusPill` | `status`, `color` | Conexão Meta, status de campanha |
| `Toast` | `message`, `type` | Feedback "copiado", "salvo" |
| `Accordion` | `title`, `children` | Detalhes técnicos de erro |
| `Stepper` | `steps`, `currentStep` | Wizard horizontal de 5 passos |
| `Skeleton` | `lines?`, `height?` | Loading placeholder |

---

## 10. Decisões de Design Técnico

| Decisão | Escolha | Justificativa |
|---|---|---|
| Roteamento | `HashRouter` | Suporte a deploy em CDN/S3 sem config de server |
| Armazenamento | `localStorage` | MVP sem backend; simples e síncrono |
| Fetch de API | Facebook JS SDK direto | Sem CORS; SDK gerencia token e sessão |
| Estratégia de fetch | Batch (2 chamadas) em vez de N+1 | Elimina timeout em contas com 500+ ads |
| CSS | Tailwind CDN + config inline | Portabilidade máxima sem build step extra |
| Gráficos | SVG puro | Sem dependência externa; total controle visual |
| Export PDF | `window.print()` + `@media print` | Nativo, sem biblioteca pesada |
| Segurança | App Secret nunca no frontend | Processado pelo backend (futuro); UI não expõe |
| SDK reinit | Evento customizado | Evita `window.location.reload()` que quebra em iframes |
