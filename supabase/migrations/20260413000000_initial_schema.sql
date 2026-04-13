-- Extensão para o log de update das rows
create extension if not exists moddatetime schema extensions;

-- ============================================================
-- 1. PROFILES (Usuários da plataforma)
-- ============================================================
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

-- Trigger: cria profile automaticamente ao criar user no auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- 2. WORKSPACES
-- ============================================================
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

-- ============================================================
-- 3. META TOKENS
-- ============================================================
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

-- Owner gerencia próprios tokens por subquery em RLS
CREATE POLICY "Owner manages own tokens"
  ON meta_tokens FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

-- ============================================================
-- 4. META APP CONFIG
-- ============================================================
CREATE TABLE meta_app_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id      TEXT NOT NULL,
  app_secret  TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meta_app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages own config"
  ON meta_app_config FOR ALL USING (owner_id = auth.uid());

-- ============================================================
-- 5. CUSTOM REPORTS
-- ============================================================
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
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );
CREATE POLICY "Public reports readable"
  ON custom_reports FOR SELECT USING (is_public = TRUE);

-- ============================================================
-- 6. ACTIVITY LOGS
-- ============================================================
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
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
    OR (workspace_id IS NULL AND user_id = auth.uid())
  );

CREATE POLICY "User inserts own logs"
  ON activity_logs FOR INSERT WITH CHECK (user_id = auth.uid());
