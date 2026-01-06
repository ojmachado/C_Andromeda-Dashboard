
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { AppShell, Stepper } from './components/Navigation.js';
import { Button, Card, Badge, Modal, Skeleton } from './components/UI.js';
import { SetupStep } from './types.js';
import type { Workspace, MetaBusiness, MetaAdAccount, InsightData, APIGeneralInsights } from './types.js';
import { SecureKV } from './utils/kv.js';

// Adicionando tipagem para o SDK do Facebook no objeto Window
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

const INITIAL_WORKSPACES: Workspace[] = [
  { id: 'wk_9921', name: 'Alpha Team', metaConnected: true, adAccountId: 'act_123456789', businessId: 'bm_123' },
  { id: 'wk_4452', name: 'Black Friday Campaign', metaConnected: false },
];

export default function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const newWs: Workspace = {
      id: `wk_${Math.random().toString(36).substr(2, 4)}`,
      name: newWorkspaceName,
      metaConnected: false
    };
    setWorkspaces(prev => [...prev, newWs]);
    setIsCreatingWorkspace(false);
    setNewWorkspaceName('');
    setIsLoading(false);
    navigate(`/w/${newWs.id}/setup`);
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/workspaces" replace />} />
      
      <Route path="/workspaces" element={
        <AppShell workspaces={workspaces}>
          <div className="max-w-7xl mx-auto py-12 px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight mb-3">Seus Workspaces</h1>
                <p className="text-text-secondary max-w-xl text-lg">Gerencie ambientes isolados de análise. Cada workspace conecta-se a uma conta única do Meta Ads.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => navigate('/integrations')}>
                    <span className="material-symbols-outlined text-lg">settings_input_component</span>
                    Configurar APIs
                </Button>
                <Button onClick={() => setIsCreatingWorkspace(true)} className="px-6">
                    <span className="material-symbols-outlined text-lg">add</span>
                    Novo Workspace
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map(w => (
                <Card key={w.id} className="group hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
                  <div className="h-28 bg-gradient-to-br from-card-dark to-background-dark p-6 flex justify-between items-start relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-primary/20"></div>
                    
                    <div className="size-12 bg-white/5 rounded-xl flex items-center justify-center text-white backdrop-blur-md border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
                      <span className="material-symbols-outlined text-2xl">analytics</span>
                    </div>
                    <Badge variant={w.metaConnected ? 'success' : 'gray'}>
                      {w.metaConnected ? 'Conectado' : 'Pendente'}
                    </Badge>
                  </div>
                  <div className="p-6 pt-2">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors">{w.name}</h3>
                    <code className="text-[10px] text-text-secondary font-mono block mb-6 bg-black/20 w-fit px-2 py-0.5 rounded">ID: {w.id}</code>
                    <div className="flex gap-3">
                      <Button variant="secondary" className="flex-1 text-xs" onClick={() => navigate(`/w/${w.id}/setup`)}>Wizard</Button>
                      <Button className="flex-1 text-xs" onClick={() => navigate(`/w/${w.id}/dashboard`)} disabled={!w.metaConnected}>
                        Dashboard
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Modal 
              isOpen={isCreatingWorkspace} 
              onClose={() => setIsCreatingWorkspace(false)} 
              title="Criar Novo Workspace"
              footer={
                <>
                  <Button variant="ghost" onClick={() => setIsCreatingWorkspace(false)}>Cancelar</Button>
                  <Button onClick={handleCreateWorkspace} isLoading={isLoading} disabled={!newWorkspaceName.trim()}>Criar Agora</Button>
                </>
              }
            >
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-bold text-text-secondary mb-2 block">Nome do Workspace</span>
                  <input 
                    type="text" 
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Ex: Cliente Alpha - Performance"
                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-border-dark text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-white/20"
                  />
                </label>
              </div>
            </Modal>
          </div>
        </AppShell>
      } />

      <Route path="/integrations" element={<IntegrationsPage />} />
      <Route path="/w/:workspaceId/setup" element={<WizardPage workspaces={workspaces} setWorkspaces={setWorkspaces} />} />
      <Route path="/w/:workspaceId/dashboard" element={<DashboardPage workspaces={workspaces} />} />
      <Route path="/admin/setup-meta" element={<AdminSetupPage />} />
    </Routes>
  );
}

const IntegrationsPage = () => {
  const navigate = useNavigate();
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
      SecureKV.getMetaConfig().then(config => {
          if (config && config.appId) setHasConfig(true);
      });
  }, []);

  return (
    <AppShell>
       <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="mb-10">
            <h1 className="text-4xl font-black text-white mb-4">Integrações Globais</h1>
            <p className="text-text-secondary text-lg max-w-2xl">
                Configure os conectores de API que alimentarão seus workspaces. As chaves são armazenadas localmente no seu navegador.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Meta Ads Card */}
            <Card className="relative group overflow-hidden border-2 border-transparent hover:border-blue-500/30 transition-all bg-[#1877F2]/5">
                <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-4xl text-[#1877F2]/20">hub</span>
                </div>
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-[#1877F2] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#1877F2]/30">
                             <span className="material-symbols-outlined text-3xl">ads_click</span>
                        </div>
                        <Badge variant={hasConfig ? "success" : "warning"}>
                            {hasConfig ? "Ativo" : "Pendente"}
                        </Badge>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-white">Meta Ads</h3>
                    <p className="text-sm text-text-secondary mb-8 leading-relaxed h-10">
                        Conecte-se à Graph API para extrair campanhas, conjuntos e anúncios.
                    </p>
                    <Button className="w-full justify-center bg-[#1877F2] hover:bg-[#1877F2]/90 border-0 shadow-lg shadow-[#1877F2]/20 text-white" onClick={() => navigate('/admin/setup-meta')}>
                        {hasConfig ? 'Gerenciar Conexão' : 'Configurar Conexão'}
                    </Button>
                </div>
            </Card>

            {/* Placeholder for Google Ads */}
            <Card className="relative group overflow-hidden opacity-60 hover:opacity-100 transition-opacity border border-dashed border-border-dark bg-transparent">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10">
                             <img src="https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Ads_logo.svg" className="w-8 opacity-50 grayscale group-hover:grayscale-0 transition-all" alt="Google Ads" />
                        </div>
                        <Badge variant="gray">Em Breve</Badge>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-white">Google Ads</h3>
                    <p className="text-sm text-text-secondary mb-8 leading-relaxed h-10">
                        Integração futura para análise de Search e Youtube Ads.
                    </p>
                    <Button variant="secondary" disabled className="w-full justify-center">
                        Indisponível
                    </Button>
                </div>
            </Card>
        </div>
       </div>
    </AppShell>
  );
};

const AdminSetupPage = () => {
  const navigate = useNavigate();
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
      // Load existing config from browser environment
      SecureKV.getMetaConfig().then(config => {
          if (config) {
              setAppId(config.appId || '');
              setAppSecret(config.appSecret || '');
          }
      });
  }, []);

  const handleSave = async () => {
      const cleanAppId = appId.trim();
      const cleanAppSecret = appSecret.trim();

      if (!cleanAppId || !cleanAppSecret) return alert("Por favor, preencha todos os campos.");
      
      setIsLoading(true);
      await SecureKV.saveMetaConfig({ appId: cleanAppId, appSecret: cleanAppSecret });
      await new Promise(r => setTimeout(r, 800)); // Simulate saving
      setIsLoading(false);
      navigate('/integrations');
  };

  return (
    <AppShell>
       <div className="max-w-2xl mx-auto py-12 px-6">
        <Button variant="ghost" className="mb-8 pl-0 hover:bg-transparent hover:text-primary gap-2" onClick={() => navigate('/integrations')}>
             <span className="material-symbols-outlined text-lg">arrow_back</span> Voltar para Integrações
        </Button>
        
        <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-[#1877F2]/10 rounded-xl text-[#1877F2]">
                <span className="material-symbols-outlined text-3xl">ads_click</span>
            </div>
            <h1 className="text-3xl font-black text-white">Configuração Meta API</h1>
        </div>
        <p className="text-text-secondary mb-10 text-lg ml-[72px]">
            Insira as credenciais do seu aplicativo Meta (Facebook Developers). <br/>
            <span className="text-xs opacity-60">Os dados são salvos apenas no LocalStorage do seu navegador.</span>
        </p>
        
        <Card className="p-8 space-y-8 shadow-2xl shadow-black/20 border-border-setup">
            <div className="space-y-6">
                <div className="group">
                    <label className="block text-sm font-bold text-white mb-2 group-focus-within:text-primary transition-colors">App ID do Facebook</label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-3.5 text-text-secondary">grid_view</span>
                        <input 
                            type="text" 
                            placeholder="Ex: 123456789012345" 
                            className="w-full pl-12 pr-4 py-3.5 bg-[#141122] border border-[#3b3267] rounded-xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm placeholder:text-white/20" 
                            value={appId} 
                            onChange={e => setAppId(e.target.value)} 
                        />
                    </div>
                </div>
                
                <div className="group">
                    <label className="block text-sm font-bold text-white mb-2 group-focus-within:text-primary transition-colors">App Secret</label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-3.5 text-text-secondary">key</span>
                        <input 
                            type="password" 
                            placeholder="••••••••••••••••••••••••" 
                            className="w-full pl-12 pr-4 py-3.5 bg-[#141122] border border-[#3b3267] rounded-xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm placeholder:text-white/20" 
                            value={appSecret} 
                            onChange={e => setAppSecret(e.target.value)} 
                        />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-border-dark flex justify-between items-center">
                <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-xs text-text-secondary hover:text-white underline decoration-text-secondary/50 hover:decoration-white">
                    Obter credenciais no Meta for Developers ↗
                </a>
                <Button onClick={handleSave} isLoading={isLoading} className="px-8 py-3 text-base">
                    Salvar Conexão
                </Button>
            </div>
        </Card>
       </div>
    </AppShell>
  );
};

// --- UPDATED WIZARD PAGE ---
const WizardPage = ({ workspaces, setWorkspaces }: { workspaces: Workspace[], setWorkspaces: any }) => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  
  const workspace = workspaces.find(w => w.id === workspaceId);
  
  const [currentStep, setCurrentStep] = useState<SetupStep>(SetupStep.Connect);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('idle');
  const [testResult, setTestResult] = useState<any>(null);
  const [testCampaigns, setTestCampaigns] = useState<InsightData[]>([]);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Initializing Facebook SDK
  useEffect(() => {
    let mounted = true;
    SecureKV.getMetaConfig().then(config => {
      if (!mounted) return;
      if (config && config.appId) {
        
        // Define callback for when SDK loads
        window.fbAsyncInit = function() {
          window.FB.init({
            appId      : config.appId,
            cookie     : true,
            xfbml      : true,
            version    : 'v19.0'
          });
          if(mounted) setSdkLoaded(true);
        };

        // If SDK is ALREADY loaded (e.g. navigation back and forth), we need to ensure we mark it as loaded
        // and potentially check init state (though re-init is usually fine or ignored)
        if (window.FB) {
             if(mounted) setSdkLoaded(true);
        }

        // Inject script if missing
        if (!document.getElementById('facebook-jssdk')) {
            (function(d, s, id){
               var js, fjs = d.getElementsByTagName(s)[0];
               if (d.getElementById(id)) { return; }
               js = d.createElement(s) as HTMLScriptElement; 
               js.id = id;
               js.src = "https://connect.facebook.net/en_US/sdk.js";
               if(fjs && fjs.parentNode) fjs.parentNode.insertBefore(js, fjs);
             }(document, 'script', 'facebook-jssdk'));
        }
      }
    });
    return () => { mounted = false; };
  }, []);

  const loginWithFacebook = async () => {
    setIsLoading(true);
    
    // Check config
    const config = await SecureKV.getMetaConfig();
    if (!config || !config.appId) {
        setIsLoading(false);
        alert("Erro: App ID não configurado. Vá em Integrações.");
        return;
    }

    if (!window.FB) {
        // Fallback for adblockers or network issues
        setIsLoading(false);
        alert("Erro: SDK do Facebook não carregou. Verifique se seu AdBlocker está bloqueando 'connect.facebook.net'.");
        return;
    }

    window.FB.login((response: any) => {
        if (response.authResponse) {
            console.log('Login success', response);
            const token = response.authResponse.accessToken;
            
            if (workspaceId) {
                SecureKV.saveWorkspaceToken(workspaceId, token);
                setWorkspaces((prev: Workspace[]) => prev.map(w => w.id === workspaceId ? { ...w, metaConnected: true } : w));
            }
            
            setConnectionStatus('connected');
            setIsLoading(false);
            setCurrentStep(SetupStep.Business);
        } else {
            console.log('User cancelled login or did not fully authorize.');
            alert("Login cancelado pelo usuário.");
            setIsLoading(false);
        }
    }, {scope: 'ads_read,read_insights'});
  };

  const runTest = async () => {
    setIsLoading(true);
    setTimeout(() => {
        setTestResult({ 
            impressions: 450200, 
            spend: 12450.00,
            clicks: 8420,
            ctr: 1.87,
            cpm: 27.65,
            cpc: 1.48
        });
        setTestCampaigns([
            { id: '238491029384', name: 'PROMO_BLACK_FRIDAY_V2', status: 'active', spend: 5430.20, roas: 3.45, cpa: 15.20, impressions: 200000, clicks: 3500, ctr: 1.75, cpm: 25, cpc: 1.55 },
            { id: '238491029112', name: 'REMARKETING_DPA_7D', status: 'active', spend: 2120.50, roas: 5.80, cpa: 8.40, impressions: 80000, clicks: 1200, ctr: 1.5, cpm: 26, cpc: 1.76 },
            { id: '238491021234', name: 'INSTITUCIONAL_AWARENESS', status: 'paused', spend: 850.00, roas: 0, cpa: 4.12, impressions: 40000, clicks: 200, ctr: 0.5, cpm: 21, cpc: 4.25 },
            { id: '238491025555', name: 'TOPO_FUNIL_VIDEO', status: 'active', spend: 4050.00, roas: 1.20, cpa: 32.50, impressions: 130000, clicks: 3500, ctr: 2.69, cpm: 31, cpc: 1.15 },
        ]);
        setIsLoading(false);
    }, 1200);
  };

  // Render Step 4 (Insights Test) with the specific dark UI
  if (currentStep === SetupStep.InsightsTest) {
      return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-dark text-white font-display overflow-x-hidden selection:bg-primary selection:text-white">
            <div className="layout-container flex h-full grow flex-col items-center pb-20">
                
                {/* Header & Stepper */}
                <div className="w-full max-w-[1100px] px-6 pt-10 pb-6 flex flex-col gap-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Configuração do Workspace</h1>
                        <p className="text-text-secondary text-base font-normal">Passo 4: Validação de Dados - Teste de Insights</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-6 justify-between items-end">
                            <p className="text-white text-sm font-medium leading-normal">Progresso do Setup</p>
                            <p className="text-text-secondary text-xs font-normal leading-normal">Passo 4 de 5</p>
                        </div>
                        <div className="rounded-full bg-border-setup h-2 overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: '80%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="w-full max-w-[1100px] px-6 flex flex-col gap-8">
                    {/* Config Card */}
                    <div className="rounded-xl border border-border-setup bg-card-setup shadow-sm overflow-hidden">
                        <div className="p-6 md:p-8 flex flex-col gap-6">
                            <div className="flex flex-col gap-2 border-b border-border-setup pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center size-10 rounded-lg bg-primary/20 text-primary">
                                        <span className="material-symbols-outlined">network_check</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Testar leitura de métricas</h2>
                                </div>
                                <p className="text-text-secondary text-sm md:text-base leading-relaxed max-w-2xl pl-[52px]">
                                    Configure os parâmetros abaixo para verificar se o sistema consegue ler seus dados do Meta Ads corretamente. Isso garante que a conexão via API está estável.
                                </p>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end justify-between">
                                <div className="flex flex-col md:flex-row gap-6 w-full">
                                    <div className="flex flex-col gap-3">
                                        <label className="text-white text-sm font-medium">Período de Análise</label>
                                        <div className="flex gap-2 flex-wrap">
                                            <button className="flex h-10 items-center justify-center gap-x-2 rounded-lg bg-primary px-4 transition-colors hover:bg-primary/90">
                                                <span className="text-white text-sm font-medium">Últimos 7 dias</span>
                                            </button>
                                            <button className="flex h-10 items-center justify-center gap-x-2 rounded-lg bg-[#292348] px-4 border border-transparent hover:border-border-setup transition-all group">
                                                <span className="text-text-secondary group-hover:text-white text-sm font-medium">Últimos 30 dias</span>
                                            </button>
                                            <button className="flex h-10 items-center justify-center gap-x-2 rounded-lg bg-[#292348] px-4 border border-transparent hover:border-border-setup transition-all group">
                                                <span className="text-text-secondary group-hover:text-white text-sm font-medium">Personalizado</span>
                                            </button>
                                        </div>
                                    </div>

                                    <label className="flex flex-col min-w-[240px]">
                                        <span className="text-white text-sm font-medium pb-3">Nível de Agrupamento</span>
                                        <div className="relative">
                                            <select className="appearance-none flex w-full min-w-0 resize-none overflow-hidden rounded-lg text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-border-setup bg-[#141122] h-10 px-4 pr-10 text-sm font-normal leading-normal transition-colors cursor-pointer hover:border-primary/50">
                                                <option value="campaign">Campanha</option>
                                                <option value="adset">Conjunto de Anúncios</option>
                                                <option value="ad">Anúncio</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-secondary">
                                                <span className="material-symbols-outlined text-xl">expand_more</span>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <button 
                                    onClick={runTest}
                                    className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-white hover:bg-gray-100 text-black px-6 font-semibold text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                >
                                    {isLoading ? (
                                        <span className="size-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                                    )}
                                    Carregar Insights
                                </button>
                            </div>
                        </div>
                    </div>

                    {testResult && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                             {/* Success */}
                             <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 flex items-start gap-3">
                                <span className="material-symbols-outlined text-green-400 mt-0.5">check_circle</span>
                                <div className="flex flex-col gap-1">
                                    <p className="text-green-400 text-sm font-bold">Conexão Estabelecida com Sucesso</p>
                                    <p className="text-green-400/80 text-sm">Os dados foram recuperados da API do Meta Ads em 1.2s. Verifique a consistência abaixo.</p>
                                </div>
                             </div>

                             {/* KPIs */}
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {[
                                    { label: 'Spend', value: `R$ ${testResult.spend.toLocaleString('pt-BR')}`, trend: '+12%', color: 'text-green-400', icon: 'trending_up' },
                                    { label: 'Impressions', value: `${(testResult.impressions / 1000).toFixed(1)}K`, trend: '+5%', color: 'text-green-400', icon: 'trending_up' },
                                    { label: 'Clicks', value: testResult.clicks.toLocaleString(), trend: '-2%', color: 'text-red-400', icon: 'trending_down' },
                                    { label: 'CTR', value: `${testResult.ctr}%`, trend: '0%', color: 'text-gray-400', icon: 'remove' },
                                    { label: 'CPM', value: `R$ ${testResult.cpm.toFixed(2)}` },
                                    { label: 'CPC', value: `R$ ${testResult.cpc.toFixed(2)}` },
                                ].map((k, i) => (
                                    <div key={i} className="bg-card-setup border border-border-setup rounded-xl p-4 flex flex-col gap-1">
                                        <p className="text-text-secondary text-xs font-medium uppercase tracking-wider">{k.label}</p>
                                        <p className="text-white text-xl font-bold">{k.value}</p>
                                        {k.trend && (
                                            <div className={`flex items-center gap-1 ${k.color} text-xs`}>
                                                <span className="material-symbols-outlined text-[14px]">{k.icon}</span>
                                                <span>{k.trend}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                             </div>

                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                 {/* Chart */}
                                 <div className="lg:col-span-3 rounded-xl border border-border-setup bg-card-setup p-6 shadow-sm">
                                     <div className="flex justify-between items-center mb-6">
                                         <h3 className="text-white font-semibold text-lg">Evolução de Investimento (Spend)</h3>
                                         <div className="flex gap-2">
                                             <span className="size-3 rounded-full bg-primary"></span>
                                             <span className="text-xs text-text-secondary">Diário</span>
                                         </div>
                                     </div>
                                     {/* CSS Chart */}
                                     <div className="h-48 w-full flex items-end justify-between gap-2 px-2 pb-2 border-b border-border-setup relative">
                                        <div className="absolute -left-0 bottom-2 top-0 flex flex-col justify-between text-[10px] text-text-secondary pointer-events-none">
                                            <span>2k</span>
                                            <span>1k</span>
                                            <span>0</span>
                                        </div>
                                        <div className="w-full h-full ml-6 flex items-end justify-between gap-1 md:gap-3">
                                            {[40, 55, 45, 70, 60, 85, 50].map((h, i) => (
                                                <div key={i} className={`w-full rounded-t-sm transition-all group relative ${i === 5 ? 'bg-primary shadow-[0_0_15px_rgba(55,19,236,0.5)]' : 'bg-primary/20 hover:bg-primary/40'}`} style={{ height: `${h}%` }}>
                                                    {i === 5 && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 font-bold">R$ 1700</div>}
                                                </div>
                                            ))}
                                        </div>
                                     </div>
                                     <div className="ml-6 flex justify-between pt-2 text-xs text-text-secondary px-2">
                                         {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((d, i) => (
                                             <span key={i} className={i === 5 ? 'text-white font-bold' : ''}>{d}</span>
                                         ))}
                                     </div>
                                 </div>

                                 {/* Table */}
                                 <div className="lg:col-span-3 rounded-xl border border-border-setup bg-card-setup overflow-hidden shadow-sm">
                                     <div className="p-6 border-b border-border-setup flex justify-between items-center">
                                         <h3 className="text-white font-semibold text-lg">Top 25 Campanhas</h3>
                                         <button className="text-primary text-sm font-medium hover:text-white transition-colors">Ver todas</button>
                                     </div>
                                     <div className="overflow-x-auto">
                                         <table className="w-full text-left text-sm text-text-secondary">
                                             <thead className="bg-[#141122] text-xs uppercase font-semibold text-white">
                                                 <tr>
                                                     <th className="px-6 py-4">Nome da Campanha</th>
                                                     <th className="px-6 py-4">Status</th>
                                                     <th className="px-6 py-4 text-right">Spend</th>
                                                     <th className="px-6 py-4 text-right">ROAS</th>
                                                     <th className="px-6 py-4 text-right">CPA</th>
                                                 </tr>
                                             </thead>
                                             <tbody className="divide-y divide-border-setup">
                                                 {testCampaigns.map((camp, idx) => (
                                                     <tr key={idx} className="hover:bg-[#231e3d] transition-colors">
                                                         <td className="px-6 py-4 font-medium text-white">
                                                             <div className="flex flex-col">
                                                                 <span>{camp.name}</span>
                                                                 <span className="text-xs text-text-secondary font-normal">ID: {camp.id}</span>
                                                             </div>
                                                         </td>
                                                         <td className="px-6 py-4">
                                                            {camp.status === 'active' ? (
                                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                                                                    <span className="size-1.5 rounded-full bg-green-400"></span> Ativo
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                                                                    <span className="size-1.5 rounded-full bg-yellow-400"></span> Pausado
                                                                </span>
                                                            )}
                                                         </td>
                                                         <td className="px-6 py-4 text-right text-white">R$ {camp.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                         <td className="px-6 py-4 text-right text-white">{camp.roas?.toFixed(2) || '-'}</td>
                                                         <td className="px-6 py-4 text-right text-white">R$ {camp.cpa?.toFixed(2).replace('.', ',')}</td>
                                                     </tr>
                                                 ))}
                                             </tbody>
                                         </table>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}
                    
                    {/* Footer Nav */}
                    <div className="flex justify-between items-center pt-8 pb-12">
                        <button onClick={() => setCurrentStep(SetupStep.AdAccount)} className="text-text-secondary hover:text-white text-sm font-medium transition-colors">
                            <span className="mr-2">←</span>Voltar para Conexão
                        </button>
                        <button onClick={() => { setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, metaConnected: true } : w)); navigate(`/w/${workspaceId}/dashboard`); }} className="bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-lg font-semibold shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5">
                            Continuar para Finalização
                        </button>
                    </div>

                </div>
            </div>
        </div>
      );
  }

  // Placeholder for other steps with better dark UI
  return (
    <AppShell>
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-black text-white mb-2">Setup do Workspace</h1>
                <p className="text-text-secondary">Conecte suas fontes de dados para começar a analisar.</p>
            </div>
            
            <Stepper currentStep={currentStep} steps={["Auth", "Business", "Conta Ads", "Testar", "Fim"]} />
            
            <div className="mt-16 text-center max-w-md mx-auto">
                <Card className="p-10 border-border-setup bg-card-setup">
                    <div className="mb-8">
                        {currentStep === SetupStep.Connect && (
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-[#1877F2] rounded-full flex items-center justify-center text-white text-3xl mb-6 shadow-xl shadow-blue-900/50">
                                    <span className="material-symbols-outlined text-3xl">public</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Autenticação Necessária</h3>
                                <p className="text-sm text-text-secondary mb-8">
                                    Para acessar seus anúncios, precisamos da sua permissão via Facebook Login.
                                </p>
                                <Button onClick={loginWithFacebook} isLoading={isLoading} className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white justify-center py-3">
                                    Continuar com Facebook
                                </Button>
                            </div>
                        )}
                        {currentStep !== SetupStep.Connect && (
                            <div className="flex flex-col items-center">
                                <h3 className="text-xl font-bold text-white mb-6">Etapa {currentStep + 1} de 5</h3>
                                <Button onClick={() => setCurrentStep(s => s+1)} isLoading={isLoading} className="w-full justify-center">
                                    Avançar Próxima Etapa
                                </Button>
                                <button onClick={() => setCurrentStep(SetupStep.InsightsTest)} className="mt-4 text-sm text-text-secondary hover:text-white underline decoration-dashed underline-offset-4">
                                    Pular para Demonstração (Step 4)
                                </button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    </AppShell>
  );
};

// ... DashboardPage remains the same ...
const DashboardPage = ({ workspaces }: { workspaces: Workspace[] }) => {
    // ... code identical to previous artifact ...
    const { workspaceId } = useParams();
  const navigate = useNavigate();
  const workspace = workspaces.find(w => w.id === workspaceId);

  // Mock Data
  const campaigns = [
      { name: '[Topo] Conversão - Inverno 2024', status: 'active', spend: 5230.00, sales: 142, roas: 5.1, ctr: 2.4 },
      { name: '[Meio] Remarketing - Visitantes 30d', status: 'active', spend: 3120.50, sales: 98, roas: 6.2, ctr: 3.1 },
      { name: '[Teste] Criativos UGC - V2', status: 'learning', spend: 1840.00, sales: 32, roas: 2.8, ctr: 1.2 },
      { name: '[Fundo] Promoção Relâmpago', status: 'paused', spend: 890.20, sales: 15, roas: 3.5, ctr: 1.8 },
  ];

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white overflow-x-hidden min-h-screen flex flex-col font-display">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-dark bg-background-dark/95 backdrop-blur-md px-4 sm:px-10 py-3">
            <div className="flex items-center gap-4 text-white">
                <div className="size-8 flex items-center justify-center rounded bg-primary/20 text-primary">
                    <span className="material-symbols-outlined">analytics</span>
                </div>
                <div className="flex flex-col">
                    <h2 className="text-white text-lg font-bold leading-tight tracking-tight">Andromeda Lab</h2>
                    <span className="text-xs text-text-secondary font-medium">Workspace: {workspace?.name || 'Alpha Team'}</span>
                </div>
            </div>
            <div className="flex flex-1 justify-end gap-4 sm:gap-8 items-center">
                {/* Account Selector */}
                <div className="hidden md:flex items-center gap-3 bg-card-dark rounded-full px-1 py-1 border border-border-dark">
                    <div className="flex items-center gap-2 px-3 py-1 border-r border-border-dark">
                        <span className="material-symbols-outlined text-text-secondary text-sm">account_balance_wallet</span>
                        <span className="text-sm font-medium text-white">Andromeda Official</span>
                        <span className="material-symbols-outlined text-text-secondary text-sm cursor-pointer hover:text-white">expand_more</span>
                    </div>
                    <div className="flex items-center gap-2 pr-3 pl-1">
                        <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Conectado</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center justify-center gap-2 rounded-lg h-9 px-4 bg-transparent border border-border-dark hover:bg-border-dark/50 hover:border-text-secondary transition-colors text-white text-sm font-medium">
                        <span className="material-symbols-outlined text-[18px]">settings</span>
                        <span className="hidden sm:inline">Configurar</span>
                    </button>
                    <div className="bg-center bg-no-repeat bg-cover rounded-full size-9 border-2 border-border-dark cursor-pointer bg-slate-700"></div>
                </div>
            </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex justify-center py-6 px-4 sm:px-8">
            <div className="w-full max-w-[1280px] flex flex-col gap-6">
                
                {/* Controls & Heading */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 p-2">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">Dashboard</h1>
                        <p className="text-text-secondary text-base font-normal">Visão geral de performance e métricas principais.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-card-dark rounded-lg p-1 border border-border-dark">
                            <button className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium text-text-secondary hover:text-white transition-colors">7d</button>
                            <button className="px-3 py-1.5 rounded bg-primary text-white text-xs sm:text-sm font-medium shadow-sm">30d</button>
                            <button className="px-3 py-1.5 rounded text-xs sm:text-sm font-medium text-text-secondary hover:text-white transition-colors">Custom</button>
                        </div>
                        <div className="flex bg-card-dark rounded-lg p-1 border border-border-dark">
                            <label className="cursor-pointer px-3 py-1.5 rounded hover:bg-background-dark transition-colors flex items-center gap-2">
                                <input defaultChecked className="hidden peer" name="level" type="radio" value="campaign"/>
                                <span className="text-xs sm:text-sm font-medium text-text-secondary peer-checked:text-white peer-checked:font-bold">Campanha</span>
                            </label>
                            <div className="w-px h-4 bg-border-dark my-auto"></div>
                            <label className="cursor-pointer px-3 py-1.5 rounded hover:bg-background-dark transition-colors flex items-center gap-2">
                                <input className="hidden peer" name="level" type="radio" value="adset"/>
                                <span className="text-xs sm:text-sm font-medium text-text-secondary peer-checked:text-white peer-checked:font-bold">Conjunto</span>
                            </label>
                            <div className="w-px h-4 bg-border-dark my-auto"></div>
                            <label className="cursor-pointer px-3 py-1.5 rounded hover:bg-background-dark transition-colors flex items-center gap-2">
                                <input className="hidden peer" name="level" type="radio" value="ad"/>
                                <span className="text-xs sm:text-sm font-medium text-text-secondary peer-checked:text-white peer-checked:font-bold">Anúncio</span>
                            </label>
                        </div>
                        <button className="flex items-center justify-center size-10 rounded-lg bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 transition-all">
                            <span className="material-symbols-outlined text-[20px]">refresh</span>
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { title: 'Gasto Total', val: 'R$ 12.400', sub: 'vs. R$ 11.050 anterior', badge: '+12%', color: 'emerald', w: '75%' },
                        { title: 'ROAS', val: '4.50', sub: 'Retorno sobre investimento', badge: '+0.5', color: 'primary', w: '60%' },
                        { title: 'Vendas', val: '342', sub: 'Conversões totais', badge: '-2%', color: 'rose', w: '45%' },
                        { title: 'CPC Médio', val: 'R$ 1.20', sub: 'Custo por clique', badge: '-10%', color: 'indigo', w: '30%' },
                    ].map((k, i) => (
                         <div key={i} className="flex flex-col gap-3 rounded-xl p-5 bg-card-dark border border-border-dark hover:border-primary/50 transition-colors group">
                            <div className="flex justify-between items-start">
                                <p className="text-text-secondary text-sm font-medium">{k.title}</p>
                                <span className={`bg-${k.color}-500/10 text-${k.color}-500 text-xs px-2 py-0.5 rounded-full font-bold`}>{k.badge}</span>
                            </div>
                            <div>
                                <p className="text-white text-2xl font-bold tracking-tight">{k.val}</p>
                                <p className="text-text-secondary text-xs mt-1">{k.sub}</p>
                            </div>
                            <div className="w-full bg-border-dark h-1 rounded-full mt-2 overflow-hidden">
                                <div className={`bg-${k.color === 'primary' ? 'primary' : k.color + '-500'} h-full rounded-full`} style={{ width: k.w }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart Section */}
                <div className="w-full rounded-xl bg-card-dark border border-border-dark p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white text-lg font-bold">Desempenho de Campanha</h3>
                        <button className="text-text-secondary hover:text-white text-sm flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">download</span>
                            Exportar
                        </button>
                    </div>
                    {/* CSS Chart */}
                    <div className="relative w-full h-64 flex items-end justify-between gap-2 sm:gap-4 pt-8">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                            {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-border-dark/30"></div>)}
                        </div>
                        {[40, 65, 45, 80, 60, 75, 55].map((h, i) => (
                             <div key={i} className={`flex-1 transition-all rounded-t-sm relative group ${i === 3 ? 'bg-primary hover:bg-primary-dark shadow-[0_0_15px_rgba(55,19,236,0.4)]' : 'bg-primary/20 hover:bg-primary/40'}`} style={{ height: `${h}%` }}>
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold py-1 px-2 rounded whitespace-nowrap z-10 transition-opacity">
                                    {Math.round(h * 5.2)} Vendas
                                </div>
                             </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-text-secondary px-1">
                        {['01 Mai', '05 Mai', '10 Mai', '15 Mai', '20 Mai', '25 Mai', '30 Mai'].map(d => <span key={d}>{d}</span>)}
                    </div>
                </div>

                {/* Table */}
                <div className="w-full overflow-hidden rounded-xl bg-card-dark border border-border-dark">
                    <div className="p-4 border-b border-border-dark flex items-center justify-between">
                        <h3 className="text-white font-bold">Detalhamento</h3>
                        <input className="bg-background-dark border-border-dark text-white text-sm rounded px-3 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary outline-none placeholder:text-text-secondary/50" placeholder="Buscar..." type="text"/>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-text-secondary">
                            <thead className="bg-background-dark/50 text-xs uppercase text-text-secondary font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Nome da Campanha</th>
                                    <th className="px-6 py-4 text-right">Gasto</th>
                                    <th className="px-6 py-4 text-right">Vendas</th>
                                    <th className="px-6 py-4 text-right">ROAS</th>
                                    <th className="px-6 py-4 text-right">CTR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-dark">
                                {campaigns.map((c, i) => {
                                    let badgeColor = c.status === 'active' ? 'emerald' : c.status === 'learning' ? 'yellow' : 'slate';
                                    let badgeText = c.status === 'active' ? 'Ativo' : c.status === 'learning' ? 'Aprendizado' : 'Pausado';
                                    let colorClass = `text-${badgeColor}-500`;
                                    let bgClass = `bg-${badgeColor}-500/10`;
                                    
                                    // Handle custom colors for Tailwind safelist implicitly or use specific hex
                                    if(c.status === 'learning') { colorClass = 'text-yellow-500'; bgClass = 'bg-yellow-500/10'; }
                                    if(c.status === 'paused') { colorClass = 'text-slate-400'; bgClass = 'bg-slate-500/10'; }
                                    if(c.status === 'active') { colorClass = 'text-emerald-500'; bgClass = 'bg-emerald-500/10'; }

                                    return (
                                        <tr key={i} className="hover:bg-border-dark/20 transition-colors cursor-pointer group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium border ${bgClass} ${colorClass} border-${badgeColor}-500/20`}>
                                                    <div className={`size-1.5 rounded-full bg-${c.status === 'active' ? 'emerald-500' : c.status === 'learning' ? 'yellow-500' : 'slate-400'}`}></div> {badgeText}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-white group-hover:text-primary transition-colors">{c.name}</td>
                                            <td className="px-6 py-4 text-right text-white tabular-nums">R$ {c.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2})}</td>
                                            <td className="px-6 py-4 text-right text-white tabular-nums">{c.sales}</td>
                                            <td className="px-6 py-4 text-right text-white font-bold tabular-nums">{c.roas.toFixed(1)}</td>
                                            <td className="px-6 py-4 text-right tabular-nums">{c.ctr}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Disconnected State Visual */}
                <div className="mt-12 mb-8 relative">
                    <div className="absolute -top-6 left-0 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded">Estado: Desconectado (Demo)</div>
                    <div className="w-full min-h-[400px] rounded-xl bg-card-dark border border-border-dark flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col items-center max-w-md">
                            <div className="size-20 rounded-full bg-background-dark border-2 border-border-dark flex items-center justify-center mb-6 shadow-xl">
                                <span className="material-symbols-outlined text-4xl text-text-secondary">link_off</span>
                            </div>
                            <h3 className="text-white text-2xl font-bold mb-3">Conecte sua conta do Meta Ads</h3>
                            <p className="text-text-secondary text-base mb-8 leading-relaxed">
                                Para visualizar as métricas do seu workspace, precisamos de acesso à sua conta de anúncios. Conecte-se agora para importar seus dados.
                            </p>
                            <button onClick={() => navigate(`/w/${workspaceId}/setup`)} className="flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold transition-all shadow-[0_0_20px_rgba(55,19,236,0.3)] hover:shadow-[0_0_30px_rgba(55,19,236,0.5)] transform hover:-translate-y-0.5">
                                <span className="material-symbols-outlined">add_link</span>
                                Iniciar setup
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};
