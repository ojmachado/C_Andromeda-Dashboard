
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
      {/* New Route for Details */}
      <Route path="/w/:workspaceId/details/:level/:objectId" element={<AdDetailsPage workspaces={workspaces} />} />
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
  const [appIdError, setAppIdError] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const currentSiteUrl = window.location.origin + '/';
  
  useEffect(() => {
      // Load existing config from browser environment
      SecureKV.getMetaConfig().then(config => {
          if (config) {
              setAppId(config.appId || '');
              setAppSecret(config.appSecret || '');
          }
      });
  }, []);

  const handleAppIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Sanitização: Remove tudo que não for número
    const numericVal = val.replace(/[^0-9]/g, '');
    
    setAppId(numericVal);
    // Reset test status on change
    if (testStatus !== 'idle') setTestStatus('idle');

    // Validação de formato (feedback visual)
    // IDs do Facebook geralmente são longos (15-16 dígitos)
    if (numericVal.length > 0 && numericVal.length < 13) {
        setAppIdError('O App ID parece muito curto (geralmente possui 15 ou 16 dígitos).');
    } else {
        setAppIdError('');
    }
  };

  const handleTestConnection = async () => {
    if (!appId || !appSecret) {
        alert("Preencha os campos para testar.");
        return;
    }
    setIsTesting(true);
    setTestStatus('idle');
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));
    
    setIsTesting(false);
    setTestStatus('success');
  };

  const handleSave = async () => {
      const cleanAppId = appId.trim();
      const cleanAppSecret = appSecret.trim();

      if (!cleanAppId || !cleanAppSecret) return alert("Por favor, preencha todos os campos.");
      if (appIdError) return alert("Corrija o App ID antes de salvar.");
      
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

        {/* Info Block for URL Configuration */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 mb-8 flex flex-col gap-3">
            <h3 className="text-blue-400 font-bold text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">info</span>
                Configuração Obrigatória no Meta for Developers
            </h3>
            <p className="text-text-secondary text-sm">
                Para que o login funcione, adicione a URL abaixo nas configurações do seu App (Campos <strong>URL do Site</strong> e <strong>Valid OAuth Redirect URIs</strong>).
            </p>
            <div className="relative group">
                <input 
                    readOnly
                    className="w-full bg-[#141122] border border-blue-500/30 rounded-lg px-4 py-3 text-sm text-white font-mono select-all focus:outline-none focus:border-blue-500"
                    value={currentSiteUrl}
                />
                <div className="absolute right-3 top-3 text-xs text-blue-500 font-bold pointer-events-none opacity-50 uppercase">URL Atual</div>
            </div>
        </div>
        
        <Card className="p-8 space-y-8 shadow-2xl shadow-black/20 border-border-setup">
            <div className="space-y-6">
                <div className="group">
                    <label className="block text-sm font-bold text-white mb-2 group-focus-within:text-primary transition-colors">App ID do Facebook</label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-3.5 text-text-secondary">grid_view</span>
                        <input 
                            type="text" 
                            placeholder="Ex: 123456789012345" 
                            className={`w-full pl-12 pr-4 py-3.5 bg-[#141122] border rounded-xl text-white focus:outline-none focus:ring-1 transition-all font-mono text-sm placeholder:text-white/20 ${appIdError ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-[#3b3267] focus:border-primary focus:ring-primary'}`}
                            value={appId} 
                            onChange={handleAppIdChange} 
                        />
                    </div>
                    {appIdError && (
                        <p className="text-red-400 text-xs mt-2 ml-1 flex items-center gap-1 animate-in fade-in">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            {appIdError}
                        </p>
                    )}
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
                            onChange={e => {
                                setAppSecret(e.target.value);
                                if (testStatus !== 'idle') setTestStatus('idle');
                            }} 
                        />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-border-dark flex flex-col gap-4">
                {testStatus === 'success' && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2 animate-in fade-in">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        Conexão com Meta Graph API simulada com sucesso!
                    </div>
                )}
                
                <div className="flex justify-between items-center">
                    <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-xs text-text-secondary hover:text-white underline decoration-text-secondary/50 hover:decoration-white">
                        Obter credenciais no Meta for Developers ↗
                    </a>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={handleTestConnection} isLoading={isTesting} disabled={!!appIdError || !appId || !appSecret}>
                            Testar Integração
                        </Button>
                        <Button onClick={handleSave} isLoading={isLoading} className="px-6" disabled={!!appIdError}>
                            Salvar Conexão
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
       </div>
    </AppShell>
  );
};

// ... WizardPage is kept as is (just ensure the imports and exports are valid if we were splitting files, but here we are in single file context) ...
// For brevity, assuming WizardPage code from previous step is here.
// I'll re-include WizardPage to ensure the context is complete if needed, but the prompt asks specifically to fix Dashboard data linking.
// RE-INCLUDING WIZARD PAGE FOR COMPLETENESS OF THE FILE
const WizardPage = ({ workspaces, setWorkspaces }: { workspaces: Workspace[], setWorkspaces: any }) => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  
  const workspace = workspaces.find(w => w.id === workspaceId);
  
  const [currentStep, setCurrentStep] = useState<SetupStep>(SetupStep.Connect);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testCampaigns, setTestCampaigns] = useState<InsightData[]>([]);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const [businesses, setBusinesses] = useState<MetaBusiness[]>([]);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
  const [selectedBm, setSelectedBm] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    SecureKV.getMetaConfig().then(config => {
      if (!mounted) return;
      if (config && config.appId) {
        window.fbAsyncInit = function() {
          window.FB.init({
            appId      : config.appId,
            cookie     : true,
            xfbml      : true,
            version    : 'v19.0'
          });
          if(mounted) setSdkLoaded(true);
        };
        if (window.FB) { if(mounted) setSdkLoaded(true); }
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

  useEffect(() => {
    if (currentStep === SetupStep.Business && workspaceId) {
      setIsLoading(true);
      SecureKV.getWorkspaceToken(workspaceId).then(token => {
        if (!token) { setIsLoading(false); return; }
        window.FB.api('/me/businesses', { access_token: token, fields: 'id,name,picture' }, (response: any) => {
          setIsLoading(false);
          if (response && !response.error) {
            setBusinesses(response.data || []);
          } else {
            console.error(response.error);
            alert("Erro ao buscar Businesses: " + (response.error?.message || "Erro desconhecido"));
          }
        });
      });
    }
  }, [currentStep, workspaceId]);

  useEffect(() => {
    if (currentStep === SetupStep.AdAccount && workspaceId) {
        setIsLoading(true);
        SecureKV.getWorkspaceToken(workspaceId).then(token => {
            if(!token) { setIsLoading(false); return; }
            window.FB.api('/me/adaccounts', { 
                access_token: token, 
                fields: 'id,name,account_id,business,currency,account_status,timezone_name' 
            }, (response: any) => {
                setIsLoading(false);
                if (response && !response.error) {
                    let accounts = response.data || [];
                    if (selectedBm) {
                        if (selectedBm === 'personal') {
                            accounts = accounts.filter((a: any) => !a.business);
                        } else {
                            accounts = accounts.filter((a: any) => a.business && a.business.id === selectedBm);
                        }
                    }
                    setAdAccounts(accounts);
                } else {
                    console.error(response.error);
                }
            });
        });
    }
  }, [currentStep, workspaceId, selectedBm]);

  const loginWithFacebook = async () => {
    setIsLoading(true);
    const config = await SecureKV.getMetaConfig();
    if (!config || !config.appId) {
        setIsLoading(false);
        alert("Erro: App ID não configurado. Vá em Integrações.");
        return;
    }
    if (!window.FB) {
        setIsLoading(false);
        alert("Erro: SDK não carregado. Verifique sua conexão.");
        return;
    }

    window.FB.login((response: any) => {
        if (response.authResponse) {
            const token = response.authResponse.accessToken;
            if (workspaceId) SecureKV.saveWorkspaceToken(workspaceId, token);
            setIsLoading(false);
            setCurrentStep(SetupStep.Business);
        } else {
            alert("Login cancelado.");
            setIsLoading(false);
        }
    }, {scope: 'ads_read,read_insights,business_management'});
  };

  const handleSelectBm = (id: string) => {
      setSelectedBm(id);
      SecureKV.saveWorkspaceContext(workspaceId!, { businessId: id });
      setCurrentStep(SetupStep.AdAccount);
  };

  const handleSelectAccount = (id: string) => {
      setSelectedAccount(id);
      SecureKV.saveWorkspaceContext(workspaceId!, { businessId: selectedBm, adAccountId: id });
      setCurrentStep(SetupStep.InsightsTest);
  };

  const runTest = async () => {
    setIsLoading(true);
    const token = await SecureKV.getWorkspaceToken(workspaceId!);
    window.FB.api(`/${selectedAccount}`, { access_token: token, fields: 'id,name,account_status' }, (response: any) => {
        if(response && !response.error) {
             // Mock data for the test step, real data comes in Dashboard
             setTimeout(() => {
                setTestResult({ 
                    impressions: 450200, spend: 12450.00, clicks: 8420, ctr: 1.87, cpm: 27.65, cpc: 1.48
                });
                setIsLoading(false);
             }, 1000);
        } else {
            setIsLoading(false);
            alert("Falha ao validar conta na API: " + response.error?.message);
        }
    });
  };

  const renderStep1 = () => (
    <div className="flex flex-col items-center p-10">
        <div className="w-16 h-16 bg-[#1877F2] rounded-full flex items-center justify-center text-white text-3xl mb-6 shadow-xl shadow-blue-900/50">
            <span className="material-symbols-outlined text-3xl">public</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Autenticação Necessária</h3>
        <p className="text-sm text-text-secondary mb-8 text-center max-w-sm">
            Para acessar seus anúncios, precisamos da sua permissão via Facebook Login.
        </p>
        <Button onClick={loginWithFacebook} isLoading={isLoading} className="w-full max-w-xs bg-[#1877F2] hover:bg-[#1877F2]/90 text-white justify-center py-3">
            Continuar com Facebook
        </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="p-8">
        <h3 className="text-xl font-bold text-white mb-6">Selecione o Business Manager</h3>
        {isLoading ? (
            <div className="grid gap-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
        ) : (
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {businesses.length === 0 && <p className="text-text-secondary text-sm">Nenhum BM encontrado. Você pode pular para contas pessoais.</p>}
                {businesses.map(bm => (
                    <div key={bm.id} onClick={() => handleSelectBm(bm.id)} className="flex items-center gap-4 p-4 rounded-xl bg-background-dark border border-border-setup hover:border-primary cursor-pointer transition-all hover:bg-[#1a162e]">
                        <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
                            <span className="material-symbols-outlined">business_center</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white font-bold text-sm">{bm.name}</h4>
                            <span className="text-xs text-text-secondary">ID: {bm.id}</span>
                        </div>
                        <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
                    </div>
                ))}
                <div onClick={() => handleSelectBm('personal')} className="flex items-center gap-4 p-4 rounded-xl bg-transparent border border-dashed border-border-setup hover:border-white/50 cursor-pointer transition-all">
                    <div className="size-10 rounded-lg flex items-center justify-center text-text-secondary">
                        <span className="material-symbols-outlined">person</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-text-secondary font-bold text-sm">Usar Conta Pessoal / Pular</h4>
                        <span className="text-xs text-text-secondary opacity-50">Não vincular a um BM específico</span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const renderStep3 = () => {
    const selectedBmName = businesses.find(b => b.id === selectedBm)?.name || 'Conta Pessoal';
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white">Selecione a Conta de Anúncios</h3>
                    <p className="text-xs text-text-secondary mt-1">
                        {selectedBm === 'personal' ? 'Exibindo contas pessoais' : `Exibindo contas do BM: ${selectedBmName}`}
                    </p>
                </div>
                <button onClick={() => setCurrentStep(SetupStep.Business)} className="text-xs text-text-secondary hover:text-white underline">Trocar BM</button>
            </div>
            {isLoading ? (
                <div className="grid gap-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
            ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {adAccounts.length === 0 ? (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-4xl text-text-secondary mb-2">search_off</span>
                            <p className="text-text-secondary">
                                Nenhuma conta encontrada {selectedBm !== 'personal' && 'neste Business Manager'}.
                            </p>
                        </div>
                    ) : (
                        adAccounts.map(ad => (
                            <div key={ad.id} onClick={() => handleSelectAccount(ad.id)} className="flex items-center gap-4 p-4 rounded-xl bg-background-dark border border-border-setup hover:border-primary cursor-pointer transition-all hover:bg-[#1a162e]">
                                <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <span className="material-symbols-outlined">account_balance</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-white font-bold text-sm">{ad.name}</h4>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${ad.status === 1 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                            {ad.status === 1 ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </div>
                                    <div className="flex gap-3 text-xs text-text-secondary mt-0.5">
                                        <span>ID: {ad.account_id}</span>
                                        <span>•</span>
                                        <span>{ad.currency}</span>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-text-secondary">chevron_right</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
  };

  if (currentStep === SetupStep.InsightsTest) {
      return (
        <AppShell workspaces={workspaces}>
           <div className="min-h-screen bg-background-dark p-8 flex justify-center">
            <div className="w-full max-w-[1100px] flex flex-col gap-8">
                <Stepper currentStep={3} steps={["Auth", "Business", "Conta Ads", "Testar", "Fim"]} />
                
                <div className="rounded-xl border border-border-setup bg-card-setup p-8">
                    <div className="flex justify-between items-start mb-8 border-b border-border-setup pb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Validar Conexão</h2>
                            <p className="text-text-secondary">Conta selecionada: <span className="text-white font-mono">{selectedAccount}</span></p>
                        </div>
                        <Button onClick={runTest} isLoading={isLoading}>
                            <span className="material-symbols-outlined">play_circle</span> Testar Conexão
                        </Button>
                    </div>

                    {testResult && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8">
                             <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex gap-3 items-center">
                                <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                                <span className="text-emerald-400 font-bold">Conexão validada com sucesso!</span>
                             </div>
                             <div className="flex justify-end pt-4">
                                <Button onClick={() => { 
                                    setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { 
                                        ...w, 
                                        metaConnected: true,
                                        adAccountId: selectedAccount,
                                        businessId: selectedBm
                                    } : w)); 
                                    navigate(`/w/${workspaceId}/dashboard`); 
                                }} className="px-8">
                                    Concluir e Ir para Dashboard
                                </Button>
                             </div>
                        </div>
                    )}
                </div>
            </div>
           </div>
        </AppShell>
      );
  }

  return (
    <AppShell workspaces={workspaces}>
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-black text-white mb-2">Setup do Workspace</h1>
                <Stepper currentStep={currentStep} steps={["Auth", "Business", "Conta Ads", "Testar", "Fim"]} />
                <Card className="border-border-setup bg-card-setup min-h-[400px]">
                    {currentStep === SetupStep.Connect && renderStep1()}
                    {currentStep === SetupStep.Business && renderStep2()}
                    {currentStep === SetupStep.AdAccount && renderStep3()}
                </Card>
            </div>
        </div>
    </AppShell>
  );
};

// --- NEW COMPONENT: AD DETAILS PAGE ---
const AdDetailsPage = ({ workspaces }: { workspaces: Workspace[] }) => {
    const { workspaceId, level, objectId } = useParams();
    const [adData, setAdData] = useState<any>(null);
    const [creativeData, setCreativeData] = useState<any>(null);
    const [insights, setInsights] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [objectiveFilter, setObjectiveFilter] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            const token = await SecureKV.getWorkspaceToken(workspaceId!);
            if (!token || !window.FB) return;

            setLoading(true);

            // Fetch Basic Object Data & Campaign Objective
            // If level is 'ad', we fetch ad details + campaign objective + creative
            if (level === 'ad') {
                window.FB.api(
                    `/${objectId}`,
                    'GET',
                    { 
                        fields: 'name,campaign{objective,name},creative{thumbnail_url,image_url,video_url,object_story_spec,object_type}',
                        access_token: token 
                    },
                    (response: any) => {
                        if (response && !response.error) {
                            setAdData(response);
                            setObjectiveFilter(response.campaign?.objective || '');
                            
                            // Handle Creative Data normalization
                            const creative = response.creative;
                            if (creative) {
                                let videoUrl = creative.video_url;
                                let imageUrl = creative.image_url || creative.thumbnail_url;
                                
                                // Deep dive for video data if not at top level
                                if (!videoUrl && creative.object_story_spec?.video_data?.file_url) {
                                    videoUrl = creative.object_story_spec.video_data.file_url;
                                }
                                if (!imageUrl && creative.object_story_spec?.video_data?.image_url) {
                                    imageUrl = creative.object_story_spec.video_data.image_url;
                                }

                                setCreativeData({
                                    videoUrl,
                                    imageUrl,
                                    type: videoUrl ? 'VIDEO' : 'IMAGE'
                                });
                            }
                        }
                    }
                );
            } else {
                // Placeholder for other levels if needed in future
                setAdData({ name: 'Detalhes indisponíveis para este nível' });
            }

            // Fetch Insights
            window.FB.api(
                `/${objectId}/insights`,
                'GET',
                {
                    fields: 'spend,impressions,clicks,ctr,cpm,cpc,actions,purchase_roas',
                    date_preset: 'maximum',
                    access_token: token
                },
                (response: any) => {
                    if (response && !response.error && response.data.length > 0) {
                        setInsights(response.data[0]);
                    }
                    setLoading(false);
                }
            );
        };

        fetchDetails();
    }, [workspaceId, objectId, level]);

    const formatCurrency = (val: string) => parseFloat(val || '0').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatNumber = (val: string) => parseInt(val || '0').toLocaleString('pt-BR');

    return (
        <AppShell workspaces={workspaces}>
            <div className="max-w-7xl mx-auto py-8 px-6">
                {/* Header & Filter */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                            <Link to={`/w/${workspaceId}/dashboard`} className="hover:text-white">Dashboard</Link>
                            <span>/</span>
                            <span>Detalhes do Anúncio</span>
                        </div>
                        <h1 className="text-3xl font-black text-white">{loading ? 'Carregando...' : adData?.name}</h1>
                        {adData?.campaign && <span className="text-sm text-text-secondary">Campanha: {adData.campaign.name}</span>}
                    </div>

                    <div className="bg-card-dark p-1 rounded-lg border border-border-dark flex items-center gap-2 px-3">
                        <span className="text-xs font-bold text-text-secondary uppercase">Objetivo da Campanha</span>
                        <div className="h-6 w-px bg-border-dark mx-1"></div>
                        <select 
                            value={objectiveFilter} 
                            onChange={(e) => setObjectiveFilter(e.target.value)}
                            className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer"
                        >
                            <option value={objectiveFilter}>{objectiveFilter || 'Carregando...'}</option>
                            <option value="OUTCOME_SALES">OUTCOME_SALES</option>
                            <option value="OUTCOME_LEADS">OUTCOME_LEADS</option>
                            <option value="OUTCOME_TRAFFIC">OUTCOME_TRAFFIC</option>
                            <option value="OUTCOME_AWARENESS">OUTCOME_AWARENESS</option>
                            <option value="OUTCOME_ENGAGEMENT">OUTCOME_ENGAGEMENT</option>
                            <option value="OUTCOME_APP_PROMOTION">OUTCOME_APP_PROMOTION</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Creative Preview */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="overflow-hidden bg-black border-border-dark shadow-2xl">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                <h3 className="font-bold text-white text-sm">Criativo do Anúncio</h3>
                                <Badge variant={creativeData?.type === 'VIDEO' ? 'info' : 'gray'}>
                                    {creativeData?.type === 'VIDEO' ? 'Vídeo' : 'Imagem'}
                                </Badge>
                            </div>
                            <div className="aspect-square bg-black flex items-center justify-center relative">
                                {loading ? (
                                    <Skeleton className="w-full h-full" />
                                ) : creativeData ? (
                                    creativeData.type === 'VIDEO' ? (
                                        <video 
                                            src={creativeData.videoUrl} 
                                            controls 
                                            className="w-full h-full object-contain" 
                                            poster={creativeData.imageUrl}
                                        />
                                    ) : (
                                        <img 
                                            src={creativeData.imageUrl} 
                                            alt="Ad Creative" 
                                            className="w-full h-full object-contain" 
                                        />
                                    )
                                ) : (
                                    <div className="text-text-secondary text-sm flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined text-3xl">image_not_supported</span>
                                        Preview indisponível
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Detailed Metrics */}
                    <div className="lg:col-span-2 space-y-6">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Valor Gasto', value: formatCurrency(insights?.spend), color: 'emerald' },
                                { label: 'Impressões', value: formatNumber(insights?.impressions), color: 'primary' },
                                { label: 'Cliques', value: formatNumber(insights?.clicks), color: 'blue' },
                                { label: 'CTR', value: `${parseFloat(insights?.ctr || 0).toFixed(2)}%`, color: 'indigo' },
                                { label: 'CPM', value: `R$ ${parseFloat(insights?.cpm || 0).toFixed(2)}`, color: 'purple' },
                                { label: 'CPC', value: `R$ ${parseFloat(insights?.cpc || 0).toFixed(2)}`, color: 'pink' },
                                { label: 'ROAS', value: insights?.purchase_roas ? parseFloat(insights.purchase_roas[0].value).toFixed(2) : '0.00', color: 'amber' },
                                { label: 'Vendas', value: insights?.actions ? (insights.actions.find((a:any) => a.action_type === 'purchase')?.value || 0) : 0, color: 'rose' },
                            ].map((k, i) => (
                                <Card key={i} className="p-4 hover:border-primary/50 transition-colors">
                                    <p className="text-xs text-text-secondary uppercase font-bold mb-1">{k.label}</p>
                                    {loading ? <Skeleton className="h-6 w-20" /> : <p className={`text-xl font-bold text-${k.color === 'emerald' ? 'emerald-400' : 'white'}`}>{k.value}</p>}
                                </Card>
                            ))}
                         </div>
                         
                         <Card className="p-6 min-h-[300px]">
                            <h3 className="text-white font-bold mb-4">Análise de Performance (Simulado)</h3>
                            <div className="w-full h-64 bg-background-dark/50 rounded-lg flex items-center justify-center border border-dashed border-border-dark text-text-secondary">
                                <span className="text-sm">Gráficos detalhados seriam renderizados aqui para o ID: {objectId}</span>
                            </div>
                         </Card>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};

const DashboardPage = ({ workspaces }: { workspaces: Workspace[] }) => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const workspace = workspaces.find(w => w.id === workspaceId);
    
    // Core State
    const [adAccountId, setAdAccountId] = useState<string>('');
    const [isConnected, setIsConnected] = useState(false);
    
    // Filters State
    const [dateMode, setDateMode] = useState<'preset' | 'custom'>('preset');
    const [timeRange, setTimeRange] = useState<'last_7d' | 'last_30d' | 'this_month' | 'last_month'>('last_30d');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    const [level, setLevel] = useState<'campaign' | 'adset' | 'ad'>('campaign');
    
    // UI State for Custom Date Modal
    const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
    const [tempCustomDates, setTempCustomDates] = useState({ start: '', end: '' });

    // Data State
    const [tableData, setTableData] = useState<any[]>([]);
    const [kpi, setKpi] = useState({ spend: 0, impressions: 0, clicks: 0, ctr: 0, cpm: 0, cpc: 0, roas: 0, sales: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [httpsWarning, setHttpsWarning] = useState(false);

    // Initial Setup
    useEffect(() => {
        // Check HTTPS
        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
            setHttpsWarning(true);
        }

        // Resolve Connection Info
        let accId = workspace?.adAccountId;
        if (!accId && workspaceId) {
            const ctx = SecureKV.getWorkspaceContext(workspaceId);
            if (ctx?.adAccountId) accId = ctx.adAccountId;
        }

        if (workspace?.metaConnected && accId) {
            setAdAccountId(accId);
            setIsConnected(true);
        } else {
            setIsConnected(false);
        }
    }, [workspace, workspaceId]);

    // Data Fetching
    useEffect(() => {
        if (!isConnected || !adAccountId) return;
        
        // Prevent fetching if custom mode is active but dates are missing
        if (dateMode === 'custom' && (!customDates.start || !customDates.end)) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            const token = await SecureKV.getWorkspaceToken(workspaceId!);
            if (!token) {
                setError("Token de acesso não encontrado. Refaça a conexão.");
                setLoading(false);
                return;
            }

            if (!window.FB) {
                 setError("Facebook SDK não carregado.");
                 setLoading(false);
                 return;
            }

            // Mapeamento de campos baseado no nível
            let nameField = 'campaign_name';
            if (level === 'adset') nameField = 'adset_name';
            if (level === 'ad') nameField = 'ad_name';

            // IMPORTANT: Added 'id' to fields to allow linking
            const fields = `id,${nameField},spend,impressions,clicks,ctr,cpm,cpc,purchase_roas,actions`;

            const params: any = {
                level: level,
                fields: fields,
                access_token: token,
                limit: 50
            };

            // Apply Date Logic
            if (dateMode === 'custom') {
                params.time_range = JSON.stringify({ since: customDates.start, until: customDates.end });
            } else {
                params.date_preset = timeRange;
            }

            window.FB.api(
                `/${adAccountId}/insights`,
                'GET',
                params,
                (response: any) => {
                    setLoading(false);
                    if (response && !response.error) {
                        const rawData = response.data || [];
                        
                        // Process KPIs
                        let totalSpend = 0;
                        let totalImpr = 0;
                        let totalClicks = 0;
                        let totalSales = 0;
                        
                        // Process Table Rows
                        const rows = rawData.map((row: any) => {
                            const spend = parseFloat(row.spend || '0');
                            const impr = parseInt(row.impressions || '0');
                            const clicks = parseInt(row.clicks || '0');
                            const ctr = parseFloat(row.ctr || '0');
                            const cpm = parseFloat(row.cpm || '0');
                            const cpc = parseFloat(row.cpc || '0');
                            
                            // Find sales (purchases)
                            let sales = 0;
                            if (row.actions) {
                                const purchaseAction = row.actions.find((a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase');
                                if (purchaseAction) sales = parseInt(purchaseAction.value);
                            }

                            // Calculate ROAS (simplified if field missing)
                            let roas = 0;
                            if (row.purchase_roas) {
                                const roasObj = row.purchase_roas.find((r: any) => r.action_type === 'purchase_roas' || r.action_type === 'omni_purchase');
                                if (roasObj) roas = parseFloat(roasObj.value);
                            }

                            totalSpend += spend;
                            totalImpr += impr;
                            totalClicks += clicks;
                            totalSales += sales;

                            return {
                                id: row.id || row.campaign_id || row.adset_id || row.ad_id, // ID fallback
                                name: row[nameField] || 'Sem Nome',
                                status: 'active', 
                                spend,
                                sales,
                                roas,
                                ctr,
                                cpm, 
                                cpc,
                                impressions: impr,
                                clicks
                            };
                        });

                        // Calculate Aggregate KPIs
                        const aggCtr = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0;
                        const aggCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
                        const aggCpm = totalImpr > 0 ? (totalSpend / totalImpr) * 1000 : 0;
                        
                        setKpi({
                            spend: totalSpend,
                            impressions: totalImpr,
                            clicks: totalClicks,
                            sales: totalSales,
                            ctr: aggCtr,
                            cpm: aggCpm,
                            cpc: aggCpc,
                            roas: 0 
                        });

                        setTableData(rows);
                    } else {
                        console.error(response.error);
                        setError(response.error?.message || "Erro ao buscar dados do Facebook API.");
                    }
                }
            );
        };

        fetchData();
    }, [adAccountId, isConnected, timeRange, dateMode, customDates, level, workspaceId]);

    const handleApplyCustomDates = () => {
        if (tempCustomDates.start && tempCustomDates.end) {
            setCustomDates(tempCustomDates);
            setDateMode('custom');
            setIsCustomDateModalOpen(false);
        }
    };

    const handlePresetClick = (preset: 'last_7d' | 'last_30d' | 'this_month' | 'last_month') => {
        setDateMode('preset');
        setTimeRange(preset);
    };


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
                        <span className="text-sm font-medium text-white">
                             {isConnected ? (adAccountId || 'Conta Conectada') : 'Ambiente de Demonstração'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 pr-3 pl-1">
                        <div className={`size-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'}`}></div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${isConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {isConnected ? 'Conectado' : 'Simulação'}
                        </span>
                    </div>
                </div>
            </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex justify-center py-6 px-4 sm:px-8">
            <div className="w-full max-w-[1280px] flex flex-col gap-6">
                
                {/* HTTPS Warning */}
                {httpsWarning && (
                     <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl flex items-center gap-3">
                        <span className="material-symbols-outlined">warning</span>
                        <span className="text-sm font-bold">Atenção: A API do Facebook pode bloquear requisições HTTP. Utilize HTTPS para garantir o funcionamento.</span>
                     </div>
                )}

                {/* Controls & Heading */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 p-2">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">Dashboard</h1>
                        <p className="text-text-secondary text-base font-normal">Visão geral de performance e métricas principais.</p>
                    </div>
                    
                    {/* FILTERS SECTION */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-card-dark rounded-lg p-1 border border-border-dark">
                            <button 
                                onClick={() => handlePresetClick('last_7d')}
                                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${dateMode === 'preset' && timeRange === 'last_7d' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
                            >
                                7d
                            </button>
                            <button 
                                onClick={() => handlePresetClick('last_30d')}
                                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${dateMode === 'preset' && timeRange === 'last_30d' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
                            >
                                30d
                            </button>
                            <button 
                                onClick={() => handlePresetClick('this_month')}
                                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${dateMode === 'preset' && timeRange === 'this_month' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
                            >
                                Mês Atual
                            </button>
                            <button 
                                onClick={() => handlePresetClick('last_month')}
                                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${dateMode === 'preset' && timeRange === 'last_month' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
                            >
                                Mês Anterior
                            </button>
                            <button 
                                onClick={() => setIsCustomDateModalOpen(true)}
                                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${dateMode === 'custom' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
                            >
                                {dateMode === 'custom' ? 'Customizado' : 'Custom'}
                            </button>
                        </div>
                        <div className="flex bg-card-dark rounded-lg p-1 border border-border-dark">
                            <label className="cursor-pointer px-3 py-1.5 rounded hover:bg-background-dark transition-colors flex items-center gap-2">
                                <input 
                                    className="hidden peer" 
                                    name="level" 
                                    type="radio" 
                                    value="campaign" 
                                    checked={level === 'campaign'} 
                                    onChange={() => setLevel('campaign')}
                                />
                                <span className={`text-xs sm:text-sm font-medium transition-colors ${level === 'campaign' ? 'text-white font-bold' : 'text-text-secondary'}`}>Campanha</span>
                            </label>
                            <div className="w-px h-4 bg-border-dark my-auto"></div>
                            <label className="cursor-pointer px-3 py-1.5 rounded hover:bg-background-dark transition-colors flex items-center gap-2">
                                <input 
                                    className="hidden peer" 
                                    name="level" 
                                    type="radio" 
                                    value="adset" 
                                    checked={level === 'adset'} 
                                    onChange={() => setLevel('adset')}
                                />
                                <span className={`text-xs sm:text-sm font-medium transition-colors ${level === 'adset' ? 'text-white font-bold' : 'text-text-secondary'}`}>Conjunto</span>
                            </label>
                            <div className="w-px h-4 bg-border-dark my-auto"></div>
                            <label className="cursor-pointer px-3 py-1.5 rounded hover:bg-background-dark transition-colors flex items-center gap-2">
                                <input 
                                    className="hidden peer" 
                                    name="level" 
                                    type="radio" 
                                    value="ad" 
                                    checked={level === 'ad'} 
                                    onChange={() => setLevel('ad')}
                                />
                                <span className={`text-xs sm:text-sm font-medium transition-colors ${level === 'ad' ? 'text-white font-bold' : 'text-text-secondary'}`}>Anúncio</span>
                            </label>
                        </div>
                        <button onClick={() => window.location.reload()} className="flex items-center justify-center size-10 rounded-lg bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 transition-all">
                            <span className="material-symbols-outlined text-[20px]">refresh</span>
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm flex gap-3 items-center">
                        <span className="material-symbols-outlined">error</span>
                        {error}
                    </div>
                )}

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { title: 'Gasto Total', val: `R$ ${kpi.spend.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, badge: 'Total', color: 'emerald', w: '100%' },
                        { title: 'Impressões', val: kpi.impressions.toLocaleString(), badge: 'Visualizações', color: 'primary', w: '100%' },
                        { title: 'Vendas', val: kpi.sales.toString(), badge: 'Conversões', color: 'rose', w: '100%' },
                        { title: 'CPC Médio', val: `R$ ${kpi.cpc.toFixed(2)}`, badge: 'Custo/Clique', color: 'indigo', w: '100%' },
                    ].map((k, i) => (
                         <div key={i} className="flex flex-col gap-3 rounded-xl p-5 bg-card-dark border border-border-dark hover:border-primary/50 transition-colors group">
                            <div className="flex justify-between items-start">
                                <p className="text-text-secondary text-sm font-medium">{k.title}</p>
                                <span className={`bg-${k.color}-500/10 text-${k.color}-500 text-xs px-2 py-0.5 rounded-full font-bold`}>{k.badge}</span>
                            </div>
                            <div>
                                {loading ? <Skeleton className="h-8 w-32" /> : <p className="text-white text-2xl font-bold tracking-tight">{k.val}</p>}
                            </div>
                            <div className="w-full bg-border-dark h-1 rounded-full mt-2 overflow-hidden">
                                <div className={`bg-${k.color === 'primary' ? 'primary' : k.color + '-500'} h-full rounded-full`} style={{ width: k.w }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart Placeholder (Can be linked to data later) */}
                <div className="w-full rounded-xl bg-card-dark border border-border-dark p-6">
                    <h3 className="text-white text-lg font-bold mb-6">Tendência de Vendas (Simulado para Demo)</h3>
                    <div className="relative w-full h-64 flex items-end justify-between gap-2 sm:gap-4 pt-8">
                         {/* Using loading state to show visual feedback */}
                         {loading ? <div className="w-full h-full flex items-center justify-center text-text-secondary">Carregando dados...</div> : (
                            [40, 65, 45, 80, 60, 75, 55].map((h, i) => (
                                 <div key={i} className={`flex-1 transition-all rounded-t-sm relative group bg-primary/20 hover:bg-primary/40`} style={{ height: `${h}%` }}></div>
                            ))
                         )}
                    </div>
                </div>

                {/* Table */}
                <div className="w-full overflow-hidden rounded-xl bg-card-dark border border-border-dark">
                    <div className="p-4 border-b border-border-dark flex items-center justify-between">
                        <h3 className="text-white font-bold">Detalhamento por {level === 'campaign' ? 'Campanha' : level === 'adset' ? 'Conjunto' : 'Anúncio'}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-text-secondary">
                            <thead className="bg-background-dark/50 text-xs uppercase text-text-secondary font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Nome</th>
                                    <th className="px-6 py-4 text-right">Gasto</th>
                                    <th className="px-6 py-4 text-right">Vendas</th>
                                    <th className="px-6 py-4 text-right">Impr.</th>
                                    <th className="px-6 py-4 text-right">CTR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-dark">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center"><Skeleton className="h-6 w-full mb-2"/><Skeleton className="h-6 w-3/4 mx-auto"/></td></tr>
                                ) : tableData.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-text-secondary">Nenhum dado encontrado para o período.</td></tr>
                                ) : (
                                    tableData.map((c, i) => (
                                        <tr key={i} className="hover:bg-border-dark/20 transition-colors cursor-pointer group">
                                            <td className="px-6 py-4 font-medium text-white group-hover:text-primary transition-colors">
                                                {/* Updated Link to New Tab Details */}
                                                <Link 
                                                    to={`/w/${workspaceId}/details/${level}/${c.id}`} 
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline flex items-center gap-1"
                                                >
                                                    {c.name}
                                                    <span className="material-symbols-outlined text-xs opacity-50">open_in_new</span>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-right text-white tabular-nums">R$ {c.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2})}</td>
                                            <td className="px-6 py-4 text-right text-white tabular-nums">{c.sales}</td>
                                            <td className="px-6 py-4 text-right text-white tabular-nums">{c.impressions.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right tabular-nums">{c.ctr.toFixed(2)}%</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Disconnected State Visual */}
                {!isConnected && (
                    <div className="mt-12 mb-8 relative">
                        <div className="absolute -top-6 left-0 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded">Estado: Desconectado</div>
                        <div className="w-full min-h-[400px] rounded-xl bg-card-dark border border-border-dark flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                             <div className="relative z-10 flex flex-col items-center max-w-md">
                                <h3 className="text-white text-2xl font-bold mb-3">Conecte sua conta</h3>
                                <button onClick={() => navigate(`/w/${workspaceId}/setup`)} className="bg-primary text-white px-6 py-3 rounded-lg font-bold">Configurar Agora</button>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Date Modal */}
            <Modal 
                isOpen={isCustomDateModalOpen} 
                onClose={() => setIsCustomDateModalOpen(false)}
                title="Selecionar Período Customizado"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsCustomDateModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleApplyCustomDates} disabled={!tempCustomDates.start || !tempCustomDates.end}>Aplicar Filtro</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-text-secondary text-sm">Selecione o intervalo de datas para análise:</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-white uppercase tracking-wider">Data Início</label>
                            <input 
                                type="date" 
                                className="bg-background-dark border border-border-dark rounded-lg p-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm"
                                value={tempCustomDates.start}
                                onChange={(e) => setTempCustomDates(prev => ({...prev, start: e.target.value}))}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-white uppercase tracking-wider">Data Fim</label>
                            <input 
                                type="date" 
                                className="bg-background-dark border border-border-dark rounded-lg p-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm"
                                value={tempCustomDates.end}
                                onChange={(e) => setTempCustomDates(prev => ({...prev, end: e.target.value}))}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    </div>
  );
};
