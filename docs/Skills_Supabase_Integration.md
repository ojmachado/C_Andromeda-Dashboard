# Skills — Supabase Integration
## Andromeda Dashboard
**Versão:** 1.0 | **Data:** Abril 2026

---

## Skill 1: Configuração do Ambiente Supabase

### Setup inicial obrigatório
1. Criar projeto em [supabase.com](https://supabase.com)
2. Copiar `Project URL` e `anon public key` das **Project Settings → API**
3. Criar `.env.local` na raiz:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
4. Garantir que `.env.local` está no `.gitignore`
5. `npm install @supabase/supabase-js`

### Erro antecipado: variáveis undefined em build
**Causa:** Vite só injeta variáveis prefixadas com `VITE_`.
**Correção:**
```typescript
// ❌ process.env.SUPABASE_URL — não funciona no Vite
// ✅ import.meta.env.VITE_SUPABASE_URL
const url = import.meta.env.VITE_SUPABASE_URL;
if (!url) throw new Error('VITE_SUPABASE_URL não configurada');
```

---

## Skill 2: Row Level Security (RLS)

### Regra fundamental
**Sempre habilitar RLS antes de qualquer dado em produção:**
```sql
ALTER TABLE sua_tabela ENABLE ROW LEVEL SECURITY;
```
Sem isso, qualquer usuário com `anon key` lê tudo.

### Padrão correto de policy para tabelas do owner
```sql
-- Usar auth.uid() — não user_id no body da request
CREATE POLICY "owner_only" ON workspaces
  FOR ALL USING (owner_id = auth.uid());
```

### Erro antecipado: policy em tabela filha (join implícito)
**Cenário:** `meta_tokens` referencia `workspaces`.  
**Erro comum:** Tentar usar `owner_id` que não existe em `meta_tokens`.  
**Solução correta:**
```sql
-- ✅ Subquery para checar a tabela pai
CREATE POLICY "owner_tokens" ON meta_tokens
  FOR ALL USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
    )
  );
```

### Erro antecipado: usuário vê 0 resultados após login
**Causa:** RLS habilitado mas sem policy criada → bloqueia tudo por padrão.  
**Diagnóstico:** Verificar no Supabase Dashboard → Authentication → Policies.  
**Checklist:**
- [ ] RLS habilitado na tabela
- [ ] Pelo menos uma policy `FOR SELECT` ou `FOR ALL` criada
- [ ] Policy usa `auth.uid()` corretamente

---

## Skill 3: Autenticação Supabase Auth

### Padrão correto em React (App.tsx)
```typescript
// ✅ Único useState para sessão — SDK cuida do refresh
const [session, setSession] = useState<Session | null>(null);

useEffect(() => {
  // 1. Carregar sessão existente
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setIsLoadingAuth(false);
  });

  // 2. Listener para mudanças (login, logout, refresh)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => setSession(session)
  );

  return () => subscription.unsubscribe(); // Limpar ao desmontar
}, []);
```

### Login
```typescript
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) setErrorMsg(error.message);
// onAuthStateChange cuida de atualizar o estado — não precisa setar manualmente
```

### Logout
```typescript
await supabase.auth.signOut();
// onAuthStateChange seta session = null automaticamente
```

### Erro antecipado: "Email not confirmed"
**Causa:** Supabase exige verificação de email por padrão.  
**Para desenvolvimento:** Dashboard → Authentication → Settings → Desabilitar "Confirm email".  
**Para produção:** Deixar habilitado e adicionar tela "Verifique seu email".

---

## Skill 4: UPSERT de Tokens Meta

### Por que UPSERT e não INSERT
O token Meta é atualizado a cada reconexão OAuth. Usar `INSERT` causaria erro de UNIQUE constraint.

```typescript
// ✅ UPSERT com conflito na coluna workspace_id (UNIQUE)
const { error } = await supabase
  .from('meta_tokens')
  .upsert(
    { workspace_id: workspaceId, access_token: newToken, updated_at: new Date().toISOString() },
    { onConflict: 'workspace_id' } // Campo com UNIQUE constraint
  );
```

### Erro antecipado: campo updated_at não atualizado
**Causa:** Supabase `upsert` só atualiza campos explicitamente enviados.  
**Solução:** Sempre incluir `updated_at: new Date().toISOString()` no payload.

---

## Skill 5: Nunca Expor o App Secret

### O problema
O `app_secret` do Meta é salvo em `meta_app_config`. Se o frontend consultar esta tabela e retornar o secret, ele fica exposto no network tab do browser.

### Solução: campo `is_secret_set`
```typescript
// ❌ NUNCA fazer no frontend
const { data } = await supabase.from('meta_app_config').select('app_id, app_secret');

// ✅ Retornar apenas o que é necessário
const { data } = await supabase
  .from('meta_app_config')
  .select('app_id'); // Só app_id — nunca app_secret

// Para indicar se o secret foi configurado, usar campo auxiliar:
const isConfigured = !!data;
```

### Alternativa futura: View SQL
```sql
CREATE VIEW meta_app_public AS
  SELECT id, owner_id, app_id, TRUE AS is_secret_set, created_at
  FROM meta_app_config;
-- Expor apenas esta view no frontend, nunca a tabela direta
```

---

## Skill 6: Migração do localStorage para Supabase

### Estratégia de compatibilidade (sem quebrar o app)
Manter a API do `SecureKV` igual, apenas mudando a implementação interna:

```typescript
// utils/kv.ts — mantém interface, troca implementação
export const SecureKV = {
  // Antes: localStorage.setItem(...)
  // Depois: delega para o service
  saveWorkspaceToken: async (workspaceId: string, token: string) => {
    try {
      await metaTokenService.save(workspaceId, token);
    } catch {
      // Fallback silencioso para localStorage durante transição
      localStorage.setItem(`wk:meta_token:${workspaceId}`, JSON.stringify({ accessToken: token }));
    }
  },
};
```

### Ordem de migração recomendada
1. **Auth** → maior impacto, migrar primeiro
2. **Workspaces** → dado mais crítico
3. **Tokens Meta** → necessário para dashboard funcionar
4. **Config Meta** → admin apenas
5. **Relatórios e Logs** → menor urgência

---

## Skill 7: Tratamento de Erros do Supabase

### Padrão de erro consistente
```typescript
const fetchWorkspaces = async () => {
  setIsLoading(true);
  setError(null);
  
  const { data, error } = await supabase.from('workspaces').select('*');
  
  if (error) {
    // error.code, error.message, error.details
    if (error.code === 'PGRST301') {
      setError('Sessão expirada. Faça login novamente.');
    } else {
      setError('Erro ao carregar workspaces. Tente novamente.');
    }
    console.error('[Supabase]', error);
  } else {
    setWorkspaces(data);
  }
  
  setIsLoading(false);
};
```

### Códigos de erro comuns

| Código | Causa | Solução |
|---|---|---|
| `PGRST116` | Nenhum resultado com `.single()` | Usar `.maybeSingle()` |
| `PGRST301` | JWT expirado | `supabase.auth.refreshSession()` ou redirect login |
| `23505` | UNIQUE constraint violation | Usar `upsert` em vez de `insert` |
| `42501` | RLS bloqueou | Verificar policies na tabela |

---

## Skill 8: Tipagem com Supabase CLI

### Gerar tipos do banco automaticamente
```bash
# 1. Login
supabase login

# 2. Gerar tipos
supabase gen types typescript --project-id SEU_PROJECT_ID \
  --schema public > src/lib/database.types.ts

# 3. Usar no client
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const supabase = createClient<Database>(url, key);
```

**Benefício:** Queries com autocomplete e checagem de tipo em tempo de build.

---

## Checklist de Deploy com Supabase

- [ ] Tabelas criadas no Supabase Dashboard com SQL correto
- [ ] RLS habilitado em todas as tabelas
- [ ] Policies criadas e testadas
- [ ] Trigger `handle_new_user` criado para `profiles`
- [ ] Extensão `moddatetime` habilitada para `updated_at` automático
- [ ] `.env.local` configurado com URL e anon key reais
- [ ] `.env.local` no `.gitignore`
- [ ] `npm install @supabase/supabase-js` executado
- [ ] Variáveis de ambiente configuradas no Vercel (Settings → Environment Variables)
- [ ] Testar RLS: logar como user A e tentar acessar dados do user B → deverá retornar vazio

---

## Erros Mais Frequentes — Supabase

| Erro | Causa | Solução |
|---|---|---|
| Dados retornam vazios após login | RLS sem policy | Criar policy `FOR ALL USING (auth.uid() = owner_id)` |
| `undefined` nas variáveis de ambiente | Prefixo `VITE_` faltando | Renomear para `VITE_SUPABASE_*` |
| UNIQUE constraint no insert de token | INSERT quando já existe | Usar `upsert` com `onConflict` |
| `app_secret` exposto no network | SELECT retorna o campo | Remover campo do SELECT; usar view |
| Sessão perdida após reload | `onAuthStateChange` não configurado | Adicionar listener no `useEffect` de montagem |
| `email not confirmed` no login | Email verification ativa | Desabilitar em dev; tratar em prod |
| `PGRST116` com .single() | Query retornou 0 rows | Trocar `.single()` por `.maybeSingle()` |
