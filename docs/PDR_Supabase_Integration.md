# PDR — Supabase Integration
## Andromeda Dashboard
**Versão:** 1.0 | **Data:** Abril 2026 | **Complementa:** PDR_Andromeda_Dashboard.md

---

## 1. Visão da Integração

Substituir o `localStorage` por **Supabase** como camada de persistência do Andromeda Dashboard, mantendo a Graph API do Facebook exclusivamente para leitura de dados de anúncios.

**Arquitetura resultante:**
```
Browser (React SPA)
  ├── Supabase JS SDK  ← auth + dados da plataforma
  └── Facebook JS SDK ← leitura de anúncios (não muda)
```

---

## 2. Requisitos Funcionais — Autenticação

| ID | Requisito |
|---|---|
| SB-A01 | Login com e-mail + senha via `supabase.auth.signInWithPassword()` |
| SB-A02 | Cadastro de novo owner via `supabase.auth.signUp()` |
| SB-A03 | Recuperação de senha via `supabase.auth.resetPasswordForEmail()` |
| SB-A04 | Sessão persistida automaticamente pelo SDK (sem localStorage manual) |
| SB-A05 | `onAuthStateChange` listener gerencia estado global de autenticação |
| SB-A06 | Logout via `supabase.auth.signOut()` |
| SB-A07 | Token de sessão renovado automaticamente pelo SDK |
| SB-A08 | Perfil de usuário criado automaticamente após signUp via trigger |

---

## 3. Requisitos Funcionais — Workspaces

| ID | Requisito |
|---|---|
| SB-W01 | Lista filtrada por owner_id via RLS automaticamente |
| SB-W02 | Criação com owner_id preenchido via RLS |
| SB-W03 | Atualização: meta_connected, ad_account_id, business_id, preferred_template_id |
| SB-W04 | Exclusão com CASCADE em tokens e relatórios |
| SB-W05 | share_id gerado na aplicação e salvo no workspace |
| SB-W06 | Workspace público acessível sem autenticação se share_enabled = true |

---

## 4. Requisitos Funcionais — Tokens Meta

| ID | Requisito |
|---|---|
| SB-T01 | Token salvo via UPSERT em meta_tokens por workspace_id |
| SB-T02 | Token recuperado do Supabase antes de cada chamada à Graph API |
| SB-T03 | Reconexão Meta atualiza token existente via UPSERT |
| SB-T04 | Token nunca exibido em texto no frontend |
| SB-T05 | Expiração detectada → UX de re-autenticação |

---

## 5. Requisitos Funcionais — Configuração Meta App

| ID | Requisito |
|---|---|
| SB-C01 | app_id e app_secret salvos em meta_app_config com owner_id |
| SB-C02 | RLS impede leitura/escrita por outros usuários |
| SB-C03 | app_secret nunca retornado ao frontend (is_secret_set: boolean apenas) |
| SB-C04 | app_id retornado normalmente para inicializar o FB SDK |

---

## 6. Requisitos Funcionais — Relatórios e Logs

| ID | Requisito |
|---|---|
| SB-R01 | Relatórios em custom_reports vinculados ao workspace_id |
| SB-R02 | Relatório público acessível sem auth pelo share_id |
| SB-R03 | CRUD completo: create, read, update, delete |
| SB-L01 | Logs inseridos a cada ação relevante do owner |
| SB-L02 | Owner lê apenas seus logs (RLS via workspace_id) |
| SB-L03 | Ações rastreadas: CREATE_WORKSPACE, CONNECT_META, EXPORT, LOGIN, LOGOUT |

---

## 7. Requisitos Não-Funcionais

| ID | Requisito |
|---|---|
| SB-NF01 | VITE_SUPABASE_ANON_KEY no .env.local (nunca no código) |
| SB-NF02 | service_role key nunca no frontend |
| SB-NF03 | RLS habilitado em 100% das tabelas |
| SB-NF04 | .env.local no .gitignore |
| SB-NF05 | Fallback gracioso se Supabase offline |
| SB-NF06 | Índices em: workspace_id, owner_id, share_id |

---

## 8. Critérios de Aceitação

- [ ] Owner cria conta e faz login sem localStorage manual
- [ ] Workspaces persistem após fechar e reabrir o browser
- [ ] Token Meta do Supabase funciona na Graph API
- [ ] Relatório público acessível via link sem login
- [ ] Dados de outro owner inacessíveis com anon key (RLS testado)
- [ ] app_secret nunca exposto em resposta de API
- [ ] Activity logs registram todas as ações mapeadas
