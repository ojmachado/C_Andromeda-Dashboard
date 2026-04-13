# Skills — Andromeda Dashboard
## Conhecimento Acumulado, Erros & Correções
**Versão:** 1.0 | **Data:** Abril 2026

---

## Skill 1: Configuração de Projeto Vite + React + TypeScript

### O que funciona
```json
// package.json obrigatório para Vercel (dependências em "dependencies", NÃO "devDependencies")
{
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.0",
    "tailwindcss": "^3.4.15"
  }
}
```

### Erro conhecido: `vite: command not found`
**Causa:** Vercel/ambientes CI ignoram `devDependencies` na instalação de prod.  
**Correção:** Mover `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss` para `dependencies`.

### Erro conhecido: Módulos com `@/` em browser puro
**Causa:** ImportMap não resolve alias `@/` sem bundler.  
**Correção:** Usar paths relativos (`./`, `../`) ou configurar alias no `vite.config.ts`.

### Erro conhecido: Página em branco no Vercel
**Causa:** `index.html` usava importmap de CDN mas Vite tentava fazer bundle.  
**Correção:** Remover importmap do `index.html`; deixar o Vite resolver os módulos normalmente.

---

## Skill 2: Integração com Facebook JavaScript SDK

### Padrão correto de inicialização
```typescript
const loadFbSdk = (appId: string) => {
  if (window.FB) {
    // SDK já carregado — só re-inicializar
    window.FB.init({ appId, version: 'v21.0', xfbml: false, cookie: true });
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://connect.facebook.net/en_US/sdk.js';
  script.async = true;
  script.onload = () => {
    window.FB.init({ appId, version: 'v21.0', xfbml: false, cookie: true });
  };
  document.head.appendChild(script);
};
```

### Erro crítico: "FB.login can no longer be called from http pages"
**Causa:** Facebook bloqueou SDK em HTTP desde 2018.  
**Correção 1:** Usar `@vitejs/plugin-basic-ssl` no dev server.  
**Correção 2:** Redirecionar HTTP → HTTPS automaticamente em produção:
```typescript
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.href = location.href.replace('http:', 'https:');
}
```

### Erro: "JSSDK não está ativada"
**Causa:** Opção "Login com o SDK do JavaScript" no Facebook Developers estava desativada.  
**Correção:** No Facebook Developers: Login do Facebook > Configurações > Ativar "Login com SDK do JavaScript" = Sim.  
**Domínios permitidos:** Adicionar `https://<seu-domínio>` no campo de domínios.

### Erro: `id is not valid for fields param`
**Causa:** O endpoint `/insights` não tem campo `id` genérico.  
**Correção:** Usar `campaign_id`, `adset_id` ou `ad_id` conforme o nível de visualização:
```typescript
const idField = viewLevel === 'campaign' ? 'campaign_id'
  : viewLevel === 'adset' ? 'adset_id'
  : 'ad_id';
const fields = `${idField},name,spend,...`;
```

### Erro: App ID padrão inválido causando "página não encontrada"
**Causa:** SDK inicializado com App ID hardcoded ou vazio.  
**Correção:** Bloquear inicialização se App ID não configurado:
```typescript
const config = kv.get<AdminConfig>('andromeda_meta_config');
if (!config?.appId) return; // Não inicializar sem App ID válido
loadFbSdk(config.appId);
```

---

## Skill 3: Fetch de Dados da Meta Graph API

### Anti-pattern: N+1 chamadas (evitar)
```typescript
// ❌ RUIM: 1 chamada por entidade (500+ ads = 500+ requests → timeout)
for (const ad of adsList) {
  const insights = await fbGet(`/${ad.id}/insights`);
}
```

### Padrão correto: Batch em 2 chamadas
```typescript
// ✅ BOM: 2 chamadas totais, independente da quantidade de entidades
const [entities, insights] = await Promise.all([
  fbGet(`/${adAccountId}/${viewLevel}s`, { fields: 'id,name,status', limit: 500 }),
  fbGet(`/${adAccountId}/insights`, { level: viewLevel, fields: '...', limit: 500 })
]);
const merged = mergeById(entities.data, insights.data);
```

### Contas de anúncio: busca correta
```typescript
// Contas de um BM: buscar owned + client em paralelo
const [owned, client] = await Promise.all([
  fbGet(`/${bizId}/owned_ad_accounts`, params),
  fbGet(`/${bizId}/client_ad_accounts`, params)
]);
const allAccounts = [...(owned.data || []), ...(client.data || [])];

// Contas pessoais: fallback para /me/adaccounts
const personal = await fbGet('/me/adaccounts', params);
```

### Extração de métricas de `actions`
```typescript
const extractAction = (actions: any[], type: string): number =>
  parseFloat(actions?.find(a => a.action_type === type)?.value ?? '0');

// Tipos mais comuns:
const purchases = extractAction(actions, 'purchase');
const leads = extractAction(actions, 'lead');
const messages = extractAction(actions, 'onsite_conversion.messaging_conversation_started_7d');
const viewContent = extractAction(actions, 'view_content');
```

### Date Range na API
```typescript
// Preset
{ date_preset: 'last_7d' | 'last_30d' | 'this_month' | 'last_month' }

// Custom: usar time_range como JSON string (não objeto JS diretamente!)
{ time_range: JSON.stringify({ since: '2024-01-01', until: '2024-01-31' }) }
```

---

## Skill 4: Anti Race Condition em Fetch Assíncrono

**Problema:** Usuário muda filtro rapidamente; resultado antigo sobrescreve o novo.  
**Solução comprovada:**
```typescript
const requestRef = useRef(0);

const fetchData = async () => {
  const requestId = ++requestRef.current;
  setIsLoading(true);
  setData([]);
  
  try {
    const result = await apiCall();
    if (requestRef.current !== requestId) return; // Resultado stale — descartar
    setData(result);
  } catch (err) {
    if (requestRef.current !== requestId) return;
    setError(err.message);
  } finally {
    if (requestRef.current === requestId) setIsLoading(false);
  }
};
```

---

## Skill 5: Re-inicialização de SDK sem Page Reload

**Problema:** `window.location.reload()` em iframes (IIS Studio, webcontainers) causa erro "página movida/excluída".  
**Solução:**
```typescript
// SaaSPages.tsx: após salvar config
window.dispatchEvent(new Event('sys_config_change'));

// App.tsx: listener
useEffect(() => {
  const handler = () => {
    const config = kv.get('andromeda_meta_config');
    if (config?.appId) reinitializeSdk(config.appId);
  };
  window.addEventListener('sys_config_change', handler);
  return () => window.removeEventListener('sys_config_change', handler);
}, []);
```

---

## Skill 6: Persistência de Estado no Wizard

**Problema:** Componente sendo remontado ao atualizar estado do pai (App.tsx) → usuário perde passo do wizard.  
**Solução:** Extrair o componente de rota para fora do componente `App`:
```typescript
// ❌ RUIM: WorkspaceSetupRoute definido dentro de App() → recriado a cada render
function App() {
  const WorkspaceSetupRoute = ({ workspace }) => <SetupWizard ... />;
  return <Route ... element={<WorkspaceSetupRoute />} />;
}

// ✅ BOM: Definido fora de App → React mantém instância
const WorkspaceSetupRoute = ({ workspace, onUpdate }) => (
  <SetupWizard workspace={workspace} onUpdateWorkspace={onUpdate} />
);

function App() {
  return <Route ... element={<WorkspaceSetupRoute workspace={...} />} />;
}
```

**Segundo mecanismo de proteção:** Ao abrir o wizard, verificar se workspace já está conectado → pular para Passo 5 automaticamente.

---

## Skill 7: Exportação de Dashboard (PDF/Print)

### CSS para impressão
```css
@media print {
  nav, aside, header, .no-print { display: none !important; }
  body { background: white; color: black; }
  .print-area { width: 100%; }
}
```

### Trigger via JavaScript
```typescript
const handleExport = () => {
  window.print();
};
```
> Alternativa: `html2canvas` + `jsPDF` para download direto (já nas dependências).

---

## Skill 8: Validação de Formulário em Tempo Real

### App ID (apenas numérico)
```typescript
const handleAppIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const cleaned = e.target.value.replace(/\D/g, ''); // Remove não-numéricos
  setAppId(cleaned);
  setAppIdError(cleaned.length > 0 ? '' : 'App ID inválido');
};
```

### App Secret (mínimo 16 caracteres)
```typescript
const secretError = appSecret.length > 0 && appSecret.length < 16
  ? 'O Secret deve ter pelo menos 16 caracteres'
  : '';
```

---

## Skill 9: Links Externos em Ambientes Restritos

**Problema:** `<a href="..." target="_blank">` pode falhar em iframes/webcontainers.  
**Solução:**
```typescript
const openExternalLink = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};
// Usar em <button onClick={() => openExternalLink(url)}>
```

---

## Skill 10: DataTable com Colunas Dinâmicas por Nível

```typescript
// cabeçalho dinâmico
const levelLabel = { campaign: 'Campanha', adset: 'Conjunto', ad: 'Anúncio' }[viewLevel];

// coluna de link só em anúncios
{viewLevel === 'ad' && (
  <th>Link do Anúncio</th>
)}

// célula do nome com sub-texto de campanha
<td>
  <a href={row.detailsLink} target="_blank">{row.name}</a>
  {row.campaignName && (
    <a href={row.campaignDetailsLink} className="text-xs text-gray-400">
      {row.campaignName}
    </a>
  )}
</td>
```

---

## Skill 11: Gráfico SVG sem Biblioteca

```typescript
const buildSvgPath = (data: { value: number }[], width: number, height: number): string => {
  const max = Math.max(...data.map(d => d.value));
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.value / max) * height;
    return `${x},${y}`;
  });
  return `M ${points.join(' L ')}`;
};
```

**Tooltip:** Usar `onMouseEnter` em `<circle>` + `<foreignObject>` ou div absoluta.

---

## Skill 12: Estrutura de Workspace e localStorage

### Schema completo
```typescript
// Chave única por recurso
const KV_KEYS = {
  meta_config: 'andromeda_meta_config',
  workspaces: 'andromeda_workspaces',
  token: (wsId: string) => `andromeda_token_${wsId}`,
  user: 'andromeda_user',
};
```

### Atualizar um workspace na lista
```typescript
const updateWorkspace = (updatedWs: Workspace) => {
  setWorkspaces(prev => {
    const next = prev.map(w => w.id === updatedWs.id ? updatedWs : w);
    kv.set(KV_KEYS.workspaces, next);
    return next;
  });
};
```

---

## Checklist de Deploy (Vercel)

- [ ] `vite`, `@vitejs/plugin-react` em `dependencies` (não devDependencies)
- [ ] `vite build` sem erros de JSX (sem `>` ou `<` não escapados em JSX text)
- [ ] HTTPS configurado (Facebook SDK obrigatório)
- [ ] App ID configurado na tela Admin antes de usar wizard
- [ ] "Login com SDK JavaScript" ativado no Facebook Developers
- [ ] Domínio de produção adicionado no painel do Meta App
- [ ] HashRouter (`/#/`) → não precisa de `vercel.json` para rewrites
- [ ] `localStorage` persiste por domínio → configs do Admin permitem entre sessões

---

## Erros Mais Frequentes e Soluções Rápidas

| Erro | Causa | Solução |
|---|---|---|
| `vite: command not found` | vite em devDependencies | Mover para dependencies |
| Página em branco | importmap conflitando com bundle | Remover importmap do index.html |
| `FB.login can no longer be called from http` | HTTP não suportado | Ativar HTTPS ou redirecionar |
| JSSDK não ativada | Config do Facebook Developers | Ativar nas config de Login SDK |
| `id is not valid for fields param` | Campo genérico `id` em /insights | Usar `campaign_id`, `adset_id`, `ad_id` |
| Tabela não atualiza com filtro | Race condition nos fetches | Usar `requestRef` pattern |
| Wizard volta para início ao salvar | Componente remontado | Extrair rota para fora do App() |
| `window.location.reload()` erros em iframe | Reload em webcontainer | Usar evento customizado + listener |
| Link externo quebrado em iframe | Iframe bloqueia `<a>` | Usar `window.open()` em button |
| Contas de anúncio não aparecem | Buscando só `client_ad_accounts` | Buscar owned + client + /me/adaccounts |
| `>` inválido em JSX | Caractere especial no texto | Escapar como `&gt;` |
