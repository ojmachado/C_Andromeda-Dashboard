# SDD — Supabase Integration
## Andromeda Dashboard
**Versão:** 1.0 | **Data:** Abril 2026

---

## 1. Arquitetura com Supabase

```
┌──────────────────────────────────────────────────────┐
│                      BROWSER                          │
│                                                        │
│  React SPA                                             │
│    ├── supabase.ts (singleton client)                  │
│    │                                                   │
│    ├── services/                                       │
│    │     ├── workspaceService.ts   ← CRUD workspaces  │
│    │     ├── metaTokenService.ts   ← tokens FB        │
│    │     ├── metaConfigService.ts  ← app_id/secret    │
│    │     ├── reportsService.ts     ← relatórios       │
│    │     └── activityService.ts    ← logs             │
│    │                                                   │
│    ├── utils/kv.ts (mantido como compatibility shim)   │
│    └── components + App.tsx (consume services)         │
│                                                        │
│  Facebook JS SDK (Graph API — não muda)                │
└──────────────────────────┬───────────────────────────┘
                           │ HTTPS + JWT (anon key)
                           ▼
          ┌──────────────────────────────┐
          │         SUPABASE             │
          │                              │
          │  auth.users (Auth built-in)  │
          │  profiles                    │
          │  workspaces       + RLS      │
          │  meta_tokens      + RLS      │
          │  meta_app_config  + RLS      │
          │  custom_reports   + RLS      │
          │  activity_logs    + RLS      │
          └──────────────────────────────┘
```

---

## 2. Schema SQL Completo

### 2.1 `profiles`
```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'owner',
  avatar_url  TEXT,
  timezone    TEXT DEFAULT 'America/Sao_Paulo',
  language    TEXT DEFAULT 'pt-BR',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own profile"
  ON profiles FOR ALL USING (id = auth.uid());

-- Trigger: cria profile automaticamente ao criar user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

### 2.2 `workspaces`
```sql
CREATE TABLE workspaces (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  meta_connected       BOOLEAN DEFAULT FALSE,
  ad_account_id        TEXT,
  business_id          TEXT,
  preferred_template_id TEXT DEFAULT 'tpl_general',
  share_enabled        BOOLEAN DEFAULT FALSE,
  share_id             TEXT UNIQUE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX idx_workspaces_share ON workspaces(share_id) WHERE share_id IS NOT NULL;

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages own workspaces"
  ON workspaces FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Public share lookup"
  ON workspaces FOR SELECT USING (share_enabled = TRUE);

-- Auto updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
```

### 2.3 `meta_tokens`
```sql
CREATE TABLE meta_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  access_token  TEXT NOT NULL,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meta_tokens_ws ON meta_tokens(workspace_id);

ALTER TABLE meta_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages own tokens"
  ON meta_tokens FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );
```

### 2.4 `meta_app_config`
```sql
CREATE TABLE meta_app_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id      TEXT NOT NULL,
  app_secret  TEXT NOT NULL,   -- Armazenar criptografado futuramente (pgcrypto)
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meta_app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages own config"
  ON meta_app_config FOR ALL USING (owner_id = auth.uid());
```

### 2.5 `custom_reports`
```sql
CREATE TABLE custom_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  author        TEXT DEFAULT 'Owner',
  type          TEXT NOT NULL CHECK (type IN ('line','bar','pie','table')),
  is_public     BOOLEAN DEFAULT FALSE,
  share_id      TEXT UNIQUE,
  config        JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_ws ON custom_reports(workspace_id);
CREATE INDEX idx_reports_share ON custom_reports(share_id) WHERE share_id IS NOT NULL;

ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages reports"
  ON custom_reports FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );
CREATE POLICY "Public reports readable"
  ON custom_reports FOR SELECT USING (is_public = TRUE);
```

### 2.6 `activity_logs`
```sql
CREATE TABLE activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource      TEXT NOT NULL,
  details       TEXT,
  status        TEXT DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILURE','WARNING')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_ws ON activity_logs(workspace_id);
CREATE INDEX idx_logs_user ON activity_logs(user_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own logs"
  ON activity_logs FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );
-- INSERT via service_role ou RLS separado para o próprio user
CREATE POLICY "User inserts own logs"
  ON activity_logs FOR INSERT WITH CHECK (user_id = auth.uid());
```

---

## 3. Configuração do Client (`src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types'; // Gerado pelo Supabase CLI

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.error('[Supabase] Variáveis de ambiente não configuradas!');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
```

---

## 4. Serviços (`src/services/`)

### 4.1 `workspaceService.ts`
```typescript
import { supabase } from '../lib/supabase';
import type { Workspace } from '../types';

export const workspaceService = {
  list: async () => {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as Workspace[];
  },

  create: async (name: string) => {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name })
      .select()
      .single();
    if (error) throw error;
    return data as Workspace;
  },

  update: async (id: string, patch: Partial<Workspace>) => {
    const { data, error } = await supabase
      .from('workspaces')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Workspace;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (error) throw error;
  },

  getByShareId: async (shareId: string) => {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id, name, ad_account_id')
      .eq('share_id', shareId)
      .eq('share_enabled', true)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
```

### 4.2 `metaTokenService.ts`
```typescript
import { supabase } from '../lib/supabase';

export const metaTokenService = {
  save: async (workspaceId: string, accessToken: string) => {
    const { error } = await supabase
      .from('meta_tokens')
      .upsert({ workspace_id: workspaceId, access_token: accessToken, updated_at: new Date().toISOString() });
    if (error) throw error;
  },

  get: async (workspaceId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('meta_tokens')
      .select('access_token')
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    if (error) throw error;
    return data?.access_token ?? null;
  },

  delete: async (workspaceId: string) => {
    const { error } = await supabase
      .from('meta_tokens')
      .delete()
      .eq('workspace_id', workspaceId);
    if (error) throw error;
  },
};
```

### 4.3 `metaConfigService.ts`
```typescript
import { supabase } from '../lib/supabase';

export const metaConfigService = {
  save: async (appId: string, appSecret: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('meta_app_config')
      .upsert({ owner_id: user.id, app_id: appId, app_secret: appSecret });
    if (error) throw error;
  },

  // Retorna apenas app_id (nunca app_secret)
  getAppId: async (): Promise<string | null> => {
    const { data, error } = await supabase
      .from('meta_app_config')
      .select('app_id')
      .maybeSingle();
    if (error) throw error;
    return data?.app_id ?? null;
  },

  isConfigured: async (): Promise<boolean> => {
    const { data } = await supabase
      .from('meta_app_config')
      .select('id')
      .maybeSingle();
    return !!data;
  },
};
```

### 4.4 `activityService.ts`
```typescript
import { supabase } from '../lib/supabase';

type ActionType = 'CREATE_WORKSPACE' | 'UPDATE_WORKSPACE' | 'DELETE_WORKSPACE'
  | 'CONNECT_META' | 'DISCONNECT_META' | 'EXPORT_REPORT' | 'LOGIN' | 'LOGOUT';

export const activityService = {
  log: async (action: ActionType, resource: string, workspaceId?: string, details?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('activity_logs').insert({
      user_id: user?.id,
      workspace_id: workspaceId ?? null,
      action,
      resource,
      details,
      status: 'SUCCESS',
    });
    // Fire-and-forget — não bloqueia UX em caso de falha
  },
};
```

---

## 5. Autenticação em `App.tsx`

### Antes (localStorage)
```typescript
const session = SecureKV.getSession();
const [isAuthenticated, setIsAuthenticated] = useState(!!session);
```

### Depois (Supabase Auth)
```typescript
const [session, setSession] = useState<Session | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setIsLoading(false);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  return () => subscription.unsubscribe();
}, []);
```

---

## 6. Migração do `SecureKV`

O `utils/kv.ts` será mantido com o mesmo contrato de API mas delegando para Supabase:

```typescript
// utils/kv.ts — wrapper de compatibilidade
export const SecureKV = {
  // Workspaces: agora via Supabase
  saveWorkspaceContext: (workspaceId: string, data: any) =>
    workspaceService.update(workspaceId, {
      ad_account_id: data.adAccountId,
      business_id: data.businessId,
    }),

  getWorkspaceContext: (workspaceId: string) =>
    // Retorna do estado React (workspaces já carregados)
    // Não chama Supabase  diretamente para evitar chamadas redundantes

  // Auth: delega para Supabase Auth
  login: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  logout: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),
  // ... demais métodos
};
```

---

## 7. Variáveis de Ambiente

**`.env.local`** (criar na raiz do projeto, não versionar):
```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**`.gitignore`** — verificar que contém:
```
.env
.env.local
.env.*.local
```

---

## 8. Dependências

```bash
npm install @supabase/supabase-js
```

**Versão recomendada:** `^2.49.0`

---

## 9. Geração de Tipos (optional but recommended)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Gerar tipos TypeScript
supabase gen types typescript --project-id SEU_PROJECT_ID > src/lib/database.types.ts
```

Isso gera tipagem forte para todas as tabelas, eliminando tipos `any` nas queries.
