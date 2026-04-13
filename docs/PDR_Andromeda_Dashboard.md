# PDR — Product Design Requirements
## Andromeda Dashboard (Andromeda Lab)
**Versão:** 1.0  
**Data:** Abril 2026  
**Status:** MVP — Owner Only (Fase 1)

---

## 1. Visão do Produto

**Andromeda Lab** é um SaaS B2B multi-tenant para análise de anúncios do Meta Ads (Facebook + Instagram). Permite que agências e gestores de tráfego criem **workspaces** por cliente, conectem contas de anúncio via OAuth, e visualizem métricas de performance em dashboards interativos.

### 1.1 Posicionamento
| Dimensão | Definição |
|---|---|
| **Categoria** | Analytics / Performance Marketing Dashboard |
| **Público-alvo** | Gestores de tráfego, agências digitais (B2B) |
| **Proposta de valor** | Visão centralizada de múltiplas contas Meta Ads em um workspace visual |
| **Diferencial** | Setup visual via wizard + leitura segura (sem alterar campanhas) |
| **Modelo** | SaaS com workspaces por cliente/conta |

---

## 2. Personas

### Persona 1: Owner / Gestor Principal
- Único usuário no MVP
- Gerencia múltiplos clientes (workspaces)
- Precisa de configuração rápida e sem fricção
- Quer ver métricas consolidadas sem sair do dashboard

### Persona 2: Admin Técnico (mesmo usuário no MVP)
- Configura as credenciais do Meta App (App ID + Secret)
- Gere a URI de redirecionamento OAuth
- Testa a integração antes de conectar workspaces

---

## 3. Mapa de Rotas e Funcionalidades

```
/ (raiz)
├── /workspaces                          ← Lista + criar workspaces
├── /w/:workspaceId/setup                ← Wizard 5 passos
│   ├── Passo 1: Conectar Meta (OAuth)
│   ├── Passo 2: Selecionar Business (BM) — opcional
│   ├── Passo 3: Selecionar Conta de Anúncios
│   ├── Passo 4: Testar Insights
│   └── Passo 5: Concluído
├── /w/:workspaceId/dashboard            ← Dashboard principal
├── /w/:workspaceId/ads/ad/:adId         ← Detalhes do anúncio
├── /admin/setup-meta                    ← Configuração admin do App Meta
├── /integrations                        ← Área de integrações
├── /reports                             ← Relatórios personalizados
├── /logs                                ← Activity logs
├── /team                                ← Gestão de membros (futura)
├── /connect/success                     ← Pós-OAuth sucesso
└── /connect/error                       ← Pós-OAuth erro
```

---

## 4. Requisitos Funcionais

### 4.1 Workspaces (`/workspaces`)

| ID | Requisito |
|---|---|
| W-01 | Listar todos os workspaces do owner em grid de 3 colunas |
| W-02 | Cada card exibe: Nome, workspaceId, badge de conexão Meta, botões Setup/Dashboard |
| W-03 | Badge verde "Meta Conectado" ou cinza "Não Conectado" |
| W-04 | Botão "+ Criar" abre modal com campo Nome |
| W-05 | Criar workspace redireciona para `/w/:id/setup` |
| W-06 | Empty state com CTA "Criar workspace" |
| W-07 | Botão "Atualizar" recarrega a lista |
| W-08 | Modal tem estados: salvando, erro, sucesso |
| W-09 | Indicador visual (ponto colorido) no nome do workspace |

**Conectores:**
- `GET /api/workspaces` — carrega lista
- `POST /api/workspaces` `{ name }` — cria workspace

---

### 4.2 Setup Wizard (`/w/:workspaceId/setup`)

#### Passo 1 — Conectar Meta
| ID | Requisito |
|---|---|
| S1-01 | Status pill: Conectado / Desconectado |
| S1-02 | Callout com garantias: leitura apenas, sem tokens no browser, pode revogar |
| S1-03 | Botão "Conectar com Meta" redireciona para `GET /api/auth/meta/start?workspaceId=:id` |
| S1-04 | SDK do Facebook inicializado com App ID salvo no Admin |
| S1-05 | Verificação `FB.getLoginStatus()` ao montar componente |
| S1-06 | Se App ID não configurado, exibir alerta com CTA para `/admin/setup-meta` |
| S1-07 | Permissões solicitadas: `ads_read`, `read_insights` |
| S1-08 | Token de acesso salvo no `localStorage` vinculado ao workspaceId |

#### Passo 2 — Business Manager (opcional)
| ID | Requisito |
|---|---|
| S2-01 | Busca real via `FB.api('/me/businesses')` |
| S2-02 | Dropdown com lista de BMs disponíveis |
| S2-03 | Opção "Usar Conta Pessoal" sempre disponível |
| S2-04 | Botões: Pular / Continuar |
| S2-05 | Empty state: "Nenhum Business encontrado" + CTA pular |
| S2-06 | Erro com Accordion de detalhes técnicos |

#### Passo 3 — Conta de Anúncios
| ID | Requisito |
|---|---|
| S3-01 | Busca real via `FB.api('/{businessId}/owned_ad_accounts')` + `client_ad_accounts` |
| S3-02 | Fallback: `FB.api('/me/adaccounts')` para contas pessoais |
| S3-03 | Lista renderizada como cards com: nome, ID (act_...), moeda, timezone, status |
| S3-04 | Card de preview da conta selecionada |
| S3-05 | Botão "Salvar e Continuar" só habilitado após seleção |
| S3-06 | Salva `adAccountId`, `businessId`, `currency`, `timezone` no workspace |

#### Passo 4 — Teste de Insights
| ID | Requisito |
|---|---|
| S4-01 | Chips de período: 7d (default), 30d, Personalizado |
| S4-02 | Dropdown de Nível: Campanha / Conjunto / Anúncio |
| S4-03 | Botão "Carregar Insights" chama API real |
| S4-04 | Exibe KPIs: Spend, Impressions, Clicks, CTR, CPM, CPC |
| S4-05 | Gráfico de barras: Spend por dia |
| S4-06 | DataTable: Top 25 (Nome, Spend, Impr, Clicks, CTR, CPM, CPC) |
| S4-07 | Mensagem de sucesso: "✅ Insights carregados. Sua integração está pronta." |
| S4-08 | Mensagem de erro: "❌ Não foi possível..." + Accordion + CTA retry |
| S4-09 | Token expirado: banner + CTA para voltar ao Passo 1 |
| S4-10 | Botão "Pular Validação" disponível como fallback |

#### Passo 5 — Concluído
| ID | Requisito |
|---|---|
| S5-01 | Card de sucesso com texto "Setup concluído" |
| S5-02 | Botão "Ir para Dashboard" → `/w/:id/dashboard` |
| S5-03 | Botão "Revisar configurações" volta para o Passo 1 |
| S5-04 | Se workspace já conectado ao abrir o wizard, ir direto para Passo 5 |

---

### 4.3 Dashboard (`/w/:workspaceId/dashboard`)

| ID | Requisito |
|---|---|
| D-01 | Status pill Meta (conectado/desconectado) no header |
| D-02 | ID da conta selecionada (`act_...`) visível no header |
| D-03 | Botão "Configurar" → `/w/:id/setup` |
| D-04 | Filtro de Período: 7d, 30d, Mês atual, Mês anterior, Personalizado |
| D-05 | Filtro de Nível: Campanha, Conjunto, Anúncio |
| D-06 | Filtro de Objetivo (multi-select) |
| D-07 | Botão "Atualizar" com ícone refresh animado |
| D-08 | KPI Grid: Spend, Impressions, Clicks, CTR, CPM, CPC, ROAS, CPA |
| D-09 | KPIs adicionais: Mensagens, Custo por Mensagem |
| D-10 | Gráfico de linha: Spend diário com tooltip |
| D-11 | DataTable com colunas dinâmicas por nível |
| D-12 | Colunas: Nome (clicável), Status, Links (FB/IG), Investimento, Msgs, Custo/Msg, ROAS, CPA |
| D-13 | Nome-campanha clicável abre nova aba com `AdDetailsPage` |
| D-14 | Filtro por veiculação: mostrar apenas itens com Impressões > 0 (configurável) |
| D-15 | Estado desconectado: card grande com CTA "Iniciar setup" |
| D-16 | Botão "Exportar" aciona `window.print()` com CSS otimizado para PDF |
| D-17 | Exibição dinâmica de colunas: "Link do Anúncio" apenas em nível "Anúncio" |

---

### 4.4 Detalhes do Anúncio (`/w/:workspaceId/ads/ad/:adId`)

| ID | Requisito |
|---|---|
| AD-01 | Breadcrumb: Campanha > Conjunto > Anúncio |
| AD-02 | Preview criativo (imagem/vídeo) com estrutura de card simulado do Facebook |
| AD-03 | KPIs: Spend, Impressões, Clicks, CTR, Leads, Compras, ROAS, CPA |
| AD-04 | Filtro de data (7d, 30d, mês, custom) |
| AD-05 | Filtro de objetivo (multi-select com checkboxes) |
| AD-06 | Gráfico de linha SVG: Spend, Leads ou Compras diário |
| AD-07 | Tabela de eventos de conversão |
| AD-08 | Link direto para o anúncio (Facebook preview) |
| AD-09 | Link para Instagram se disponível |
| AD-10 | Dados fetched via `FB.api('/:adId', { fields: ... })` + `/:adId/insights` |

---

### 4.5 Admin Setup Meta (`/admin/setup-meta`)

| ID | Requisito |
|---|---|
| A-01 | Wizard admin com 4 passos: Status, Credenciais, URIs, Teste |
| A-02 | Campo App ID: apenas números, validação em tempo real |
| A-03 | Campo App Secret: mínimo 16 caracteres, mascarado após salvar |
| A-04 | Redirect URI e App Domain: read-only com botão copiar |
| A-05 | Detecção automática da URL do ambiente atual |
| A-06 | Botão "Testar Integração": chama `FB.getLoginStatus()` e exibe resultado inline |
| A-07 | Feedback inline (sem alert()): Success (verde) / Error (vermelho) com ícones |
| A-08 | Salvar persiste no `localStorage` com chave `andromeda_meta_config` |
| A-09 | Guia de configuração passo-a-passo embutido no accordion |
| A-10 | Instrução para habilitar "Login com SDK JavaScript" no Facebook Developers |

---

### 4.6 Integrações (`/integrations`)

| ID | Requisito |
|---|---|
| I-01 | Grid de cards de integração (Meta Ads ativo, Google Ads / TikTok Ads placeholders) |
| I-02 | Indicador de status: Ativo (verde) / Pendente (amarelo) |
| I-03 | Modal "Configurar Conexão" com campos App ID e App Secret |
| I-04 | Botão "Testar Integração" com spinner e feedback inline |
| I-05 | Link externo abre via `window.open(url, '_blank', 'noopener,noreferrer')` |
| I-06 | Ícone de check verde (configurado) ou alerta amarelo (não configurado) |

---

### 4.7 Relatórios Personalizados (`/reports`)

| ID | Requisito |
|---|---|
| R-01 | Lista de relatórios salvos |
| R-02 | Construtor de relatórios: seleção de métricas, dimensões, filtros |
| R-03 | Tipos de visualização: linha, barra, pizza, tabela |
| R-04 | Exportar relatório (PDF/imagem) |
| R-05 | Relatórios públicos com link de compartilhamento (`shareId`) |

---

### 4.8 Activity Logs (`/logs`)

| ID | Requisito |
|---|---|
| L-01 | Tabela paginada de eventos: timestamp, usuário, ação, recurso, detalhes, status |
| L-02 | Filtros: período, usuário, tipo de ação, recurso |
| L-03 | Exportar logs |
| L-04 | Ações rastreadas: CREATE, UPDATE, DELETE, LOGIN, EXPORT, SYNC |

---

## 5. Requisitos Não-Funcionais

| ID | Requisito |
|---|---|
| NF-01 | **HTTPS obrigatório** em produção (Facebook SDK exige) |
| NF-02 | **Sem tokens/secrets no frontend** — App Secret processado apenas no backend |
| NF-03 | **Responsivo** — desktop first, mobile funcional |
| NF-04 | **Todos os componentes têm estados**: loading (skeleton), empty, error, success |
| NF-05 | **Botões desabilitados** quando pré-requisitos ausentes |
| NF-06 | **Persistência local**: workspaces + config Meta no `localStorage` |
| NF-07 | **Sem dependência de backend** no MVP (Graph API direto via SDK) |
| NF-08 | **Print/PDF**: CSS `@media print` oculta nav e ajusta layout |
| NF-09 | **SDK Facebook**: detecta se já carregado antes de reinjetar o script |
| NF-10 | **Redirecionamento automático** para HTTPS se acessado via HTTP |

---

## 6. Estados de UI por Tela

| Tela | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Workspaces | Skeleton cards | "Você ainda não tem workspaces" | Toast + retry | Grid de cards |
| Setup Wizard | Spinner por passo | BM vazio: "Nenhum encontrado" | Accordion de erro | Badge conectado |
| Dashboard | Skeleton KPI + tabela | "Conecte o Meta" + CTA | Alerta + retry | KPIs + tabela + gráfico |
| Admin Setup | — | Campos vazios | Feedback inline vermelho | Feedback inline verde |
| Integrações | Spinner "Testando..." | Card "Pendente" | Inline erro vermelho | "Conexão Ativa" verde |

---

## 7. Critérios de Aceitação do MVP

- [ ] Owner consegue criar workspace e conectar Meta Ads sem suporte técnico
- [ ] OAuth redireciona corretamente e token é salvo no workspace
- [ ] Dashboard exibe dados reais da conta de anúncios selecionada
- [ ] Todos os filtros (período, nível, objetivo) atualizam a tabela em tempo real
- [ ] Admin configura App ID/Secret e vê teste bem-sucedido
- [ ] Aplicação funciona em HTTPS (Vercel / produção)
- [ ] Exportação PDF/print funciona no Chrome e Safari
- [ ] Nenhum secret exposto no bundle de frontend

---

## 8. Fora de Escopo (MVP)

- Múltiplos membros por workspace (somente owner)
- Google Ads / TikTok Ads (placeholders apenas)
- Backend dedicado / banco de dados (localStorage no MVP)
- Alertas e automações
- Billing / planos pagos
