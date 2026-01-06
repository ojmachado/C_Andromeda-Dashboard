
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const ALL_OBJECTIVES = [
    'OUTCOME_SALES',
    'OUTCOME_LEADS',
    'OUTCOME_TRAFFIC',
    'OUTCOME_AWARENESS',
    'OUTCOME_ENGAGEMENT',
    'OUTCOME_APP_PROMOTION'
];

// --- NEW COMPONENT: AD DETAILS PAGE ---
const AdDetailsPage = ({ workspaces }: { workspaces: Workspace[] }) => {
    const { workspaceId, level, objectId } = useParams();
    const [adData, setAdData] = useState<any>(null);
    const [creativeData, setCreativeData] = useState<any>(null);
    const [insights, setInsights] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [dateMode, setDateMode] = useState<'preset' | 'custom'>('preset');
    const [timeRange, setTimeRange] = useState<'last_7d' | 'last_30d' | 'this_month' | 'last_month'>('last_30d');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
    const [tempCustomDates, setTempCustomDates] = useState({ start: '', end: '' });

    // Multi-select objective filter state
    const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close filter
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchDetails = async () => {
             // Prevent fetching if custom mode is active but dates are missing
             if (dateMode === 'custom' && (!customDates.start || !customDates.end)) return;
             
            const token = await SecureKV.getWorkspaceToken(workspaceId!);
            if (!token || !window.FB) return;

            setLoading(true);

            // Fetch Basic Object Data & Campaign Objective
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
                            // Set default filter to the campaign's objective if available
                            if (response.campaign?.objective) {
                                setSelectedObjectives([response.campaign.objective]);
                            }
                            
                            // Handle Creative Data normalization
                            const creative = response.creative;
                            if (creative) {
                                let videoUrl = creative.video_url;
                                let imageUrl = creative.image_url || creative.thumbnail_url;
                                
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
                setAdData({ name: 'Detalhes indisponíveis para este nível' });
            }

            // Fetch Insights
            const insightsParams: any = {
                fields: 'spend,impressions,clicks,ctr,cpm,cpc,actions,purchase_roas',
                access_token: token
            };

            if (dateMode === 'custom') {
                insightsParams.time_range = JSON.stringify({ since: customDates.start, until: customDates.end });
            } else {
                insightsParams.date_preset = timeRange;
            }

            window.FB.api(
                `/${objectId}/insights`,
                'GET',
                insightsParams,
                (response: any) => {
                    if (response && !response.error && response.data.length > 0) {
                        setInsights(response.data[0]);
                    } else {
                        // Clear insights if no data returned for the selected period
                        setInsights(null);
                    }
                    setLoading(false);
                }
            );
        };

        fetchDetails();
    }, [workspaceId, objectId, level, dateMode, timeRange, customDates]);

    const formatCurrency = (val: string) => parseFloat(val || '0').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatNumber = (val: string) => parseInt(val || '0').toLocaleString('pt-BR');

    const toggleObjective = (obj: string) => {
        setSelectedObjectives(prev => 
            prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]
        );
    };

    const toggleAllObjectives = () => {
        if (selectedObjectives.length === ALL_OBJECTIVES.length) {
            setSelectedObjectives([]);
        } else {
            setSelectedObjectives(ALL_OBJECTIVES);
        }
    };

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
        <AppShell workspaces={workspaces}>
            <div className="max-w-7xl mx-auto py-8 px-6 print-full-width">
                {/* Header & Filter */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
                    <div>
                        <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                            <Link to={`/w/${workspaceId}/dashboard`} className="hover:text-white">Dashboard</Link>
                            <span>/</span>
                            <span>Detalhes do Anúncio</span>
                        </div>
                        <h1 className="text-3xl font-black text-white">{loading ? 'Carregando...' : adData?.name}</h1>
                        {adData?.campaign && <span className="text-sm text-text-secondary">Campanha: {adData.campaign.name}</span>}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                         {/* Date Filters */}
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
                                onClick={() => setIsCustomDateModalOpen(true)}
                                className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${dateMode === 'custom' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}
                            >
                                {dateMode === 'custom' ? 'Custom' : 'Custom'}
                            </button>
                        </div>

                        {/* Objective Filter */}
                        <div className="relative" ref={filterRef}>
                            <div 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="bg-card-dark p-2 rounded-lg border border-border-dark flex items-center gap-3 px-4 cursor-pointer hover:border-primary/50 transition-colors h-full"
                            >
                                <span className="text-xs font-bold text-text-secondary uppercase">Objetivos</span>
                                <div className="h-4 w-px bg-border-dark"></div>
                                <span className="text-sm font-bold text-white flex items-center gap-1">
                                    {selectedObjectives.length === ALL_OBJECTIVES.length ? 'Todos' : 
                                    selectedObjectives.length === 0 ? 'Nenhum' : 
                                    `${selectedObjectives.length}`}
                                    <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
                                </span>
                            </div>

                            {/* Dropdown Menu */}
                            {isFilterOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-card-dark border border-border-dark rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                    <div 
                                        onClick={toggleAllObjectives}
                                        className="px-4 py-3 flex items-center gap-3 hover:bg-white/5 cursor-pointer border-b border-border-dark"
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedObjectives.length === ALL_OBJECTIVES.length ? 'bg-primary border-primary' : 'border-text-secondary'}`}>
                                            {selectedObjectives.length === ALL_OBJECTIVES.length && <span className="material-symbols-outlined text-[10px] text-white">check</span>}
                                        </div>
                                        <span className="text-sm font-medium text-white">Selecionar Todos</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                        {ALL_OBJECTIVES.map(obj => (
                                            <div 
                                                key={obj}
                                                onClick={() => toggleObjective(obj)}
                                                className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 cursor-pointer"
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedObjectives.includes(obj) ? 'bg-primary border-primary' : 'border-text-secondary'}`}>
                                                    {selectedObjectives.includes(obj) && <span className="material-symbols-outlined text-[10px] text-white">check</span>}
                                                </div>
                                                <span className="text-xs font-medium text-text-secondary truncate">{obj}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
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

        // 1. Retrieve Ad Account ID from Workspace Config (Memory)
        if (workspace?.adAccountId) {
            setAdAccountId(workspace.adAccountId);
            setIsConnected(true);
            return;
        }

        // 2. Retrieve from Local Storage Context (Persistence)
        if (workspaceId) {
            const ctx = SecureKV.getWorkspaceContext(workspaceId);
            if (ctx?.adAccountId) {
                setAdAccountId(ctx.adAccountId);
                setIsConnected(true);
                return;
            }
        }

        // 3. Fallback: Missing ID -> Prompt User
        setIsConnected(false);
        setAdAccountId('');
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

            let endpoint = `/${adAccountId}/insights`;
            let fields = '';
            let params: any = {
                access_token: token,
                limit: 50
            };

            // Strategy: For Ads level, we query '/ads' endpoint to get creative links
            // For Campaign/Adset, we query '/insights' standard endpoint
            if (level === 'ad') {
                endpoint = `/${adAccountId}/ads`;
                // Construct insights field expansion with date filtering
                let insightsParams = '';
                if (dateMode === 'custom') {
                    insightsParams = `.time_range(${JSON.stringify({ since: customDates.start, until: customDates.end })})`;
                } else {
                    insightsParams = `.date_preset(${timeRange})`;
                }
                
                // Request Ad fields + expanded insights
                // Note: creative{instagram_permalink_url} might be null if not available
                fields = `id,name,preview_shareable_link,creative{instagram_permalink_url},insights${insightsParams}{spend,impressions,clicks,ctr,cpm,cpc,purchase_roas,actions}`;
                params.fields = fields;
            } else {
                // Standard Insights Query for Campaign/Adset
                let nameField = 'campaign_name';
                let idField = 'campaign_id';
                
                if (level === 'adset') {
                    nameField = 'adset_name';
                    idField = 'adset_id';
                }

                fields = `${idField},${nameField},spend,impressions,clicks,ctr,cpm,cpc,purchase_roas,actions`;
                params.level = level;
                params.fields = fields;

                // Apply Date Logic for Standard Insights
                if (dateMode === 'custom') {
                    params.time_range = JSON.stringify({ since: customDates.start, until: customDates.end });
                } else {
                    params.date_preset = timeRange;
                }
            }

            window.FB.api(
                endpoint,
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
                        
                        const rows = rawData.map((row: any) => {
                            // Extract metrics based on endpoint structure
                            // If level is 'ad', metrics are nested in row.insights.data[0]
                            let metrics = row;
                            if (level === 'ad') {
                                metrics = (row.insights && row.insights.data && row.insights.data.length > 0) ? row.insights.data[0] : null;
                            }

                            // If ad has no insights for the period, metrics might be null
                            const spend = parseFloat(metrics?.spend || '0');
                            const impr = parseInt(metrics?.impressions || '0');
                            const clicks = parseInt(metrics?.clicks || '0');
                            const ctr = parseFloat(metrics?.ctr || '0');
                            const cpm = parseFloat(metrics?.cpm || '0');
                            const cpc = parseFloat(metrics?.cpc || '0');
                            
                            // Find sales
                            let sales = 0;
                            if (metrics?.actions) {
                                const purchaseAction = metrics.actions.find((a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase');
                                if (purchaseAction) sales = parseInt(purchaseAction.value);
                            }

                            // Calculate ROAS
                            let roas = 0;
                            if (metrics?.purchase_roas) {
                                const roasObj = metrics.purchase_roas.find((r: any) => r.action_type === 'purchase_roas' || r.action_type === 'omni_purchase');
                                if (roasObj) roas = parseFloat(roasObj.value);
                            }

                            totalSpend += spend;
                            totalImpr += impr;
                            totalClicks += clicks;
                            totalSales += sales;

                            // Identify ID and Name
                            let id = row.id;
                            let name = row.name;

                            if (level !== 'ad') {
                                if (level === 'campaign') { id = row.campaign_id; name = row.campaign_name; }
                                if (level === 'adset') { id = row.adset_id; name = row.adset_name; }
                            }

                            return {
                                id: id || 'unknown',
                                name: name || 'Sem Nome',
                                status: 'active', 
                                spend,
                                sales,
                                roas,
                                ctr,
                                cpm, 
                                cpc,
                                impressions: impr,
                                clicks,
                                // Ad specific fields
                                previewLink: row.preview_shareable_link,
                                instagramLink: row.creative?.instagram_permalink_url
                            };
                        });

                        // Filter out ads with no data if desired, or keep them with 0s. 
                        // For now, keeping them matches standard dashboard behavior often.
                        // But usually dashboards hide inactive ads if no metrics. 
                        // Let's filter only if spend is 0 to avoid clutter if querying /ads directly returns all ads ever created.
                        const activeRows = level === 'ad' ? rows.filter((r: any) => r.impressions > 0 || r.spend > 0) : rows;

                        // Calculate Aggregate KPIs from filtered rows? 
                        // Better to calculate from ALL returned rows that have data to match summary.
                        // But wait, the KPI summary usually sums up everything returned.
                        
                        // Recalculate totals based on activeRows if we filter
                        if (level === 'ad') {
                             totalSpend = activeRows.reduce((acc: number, r: any) => acc + r.spend, 0);
                             totalImpr = activeRows.reduce((acc: number, r: any) => acc + r.impressions, 0);
                             totalClicks = activeRows.reduce((acc: number, r: any) => acc + r.clicks, 0);
                             totalSales = activeRows.reduce((acc: number, r: any) => acc + r.sales, 0);
                        }

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

                        setTableData(activeRows);
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
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white overflow-x-hidden min-h-screen flex flex-col font-display print-full-width">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-dark bg-background-dark/95 backdrop-blur-md px-4 sm:px-10 py-3 no-print">
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
        <div className="flex-1 flex justify-center py-6 px-4 sm:px-8 print-full-width">
            <div className="w-full max-w-[1280px] flex flex-col gap-6 print-full-width">
                
                {/* HTTPS Warning */}
                {httpsWarning && (
                     <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-4 rounded-xl flex items-center gap-3 no-print">
                        <span className="material-symbols-outlined">warning</span>
                        <span className="text-sm font-bold">Atenção: A API do Facebook pode bloquear requisições HTTP. Utilize HTTPS para garantir o funcionamento.</span>
                     </div>
                )}

                {/* Controls & Heading */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 p-2">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">Dashboard</h1>
                        <p className="text-text-secondary text-base font-normal no-print">Visão geral de performance e métricas principais.</p>
                    </div>
                    
                    {/* FILTERS SECTION */}
                    <div className="flex flex-wrap items-center gap-3 no-print">
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
                        <div className="flex gap-2">
                             <Button variant="secondary" onClick={() => window.print()} className="h-10 px-3 text-xs">
                                <span className="material-symbols-outlined text-[18px]">print</span>
                                Exportar (PDF)
                             </Button>
                             <button onClick={() => window.location.reload()} className="flex items-center justify-center size-10 rounded-lg bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 transition-all">
                                <span className="material-symbols-outlined text-[20px]">refresh</span>
                            </button>
                        </div>
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
                                    {/* Link Columns for Ads Level */}
                                    {level === 'ad' && (
                                        <>
                                            <th className="px-2 py-4 text-center w-12">
                                                <span className="sr-only">Facebook</span>
                                                <div className="flex justify-center">
                                                    <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24">
                                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                                    </svg>
                                                </div>
                                            </th>
                                            <th className="px-2 py-4 text-center w-12">
                                                <span className="sr-only">Instagram</span>
                                                <div className="flex justify-center">
                                                    <svg className="w-4 h-4 text-pink-500 fill-current" viewBox="0 0 24 24">
                                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                                    </svg>
                                                </div>
                                            </th>
                                        </>
                                    )}
                                    <th className="px-6 py-4 text-right">Gasto</th>
                                    <th className="px-6 py-4 text-right">Vendas</th>
                                    <th className="px-6 py-4 text-right">Impr.</th>
                                    <th className="px-6 py-4 text-right">CTR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-dark">
                                {loading ? (
                                    <tr><td colSpan={level === 'ad' ? 7 : 5} className="px-6 py-8 text-center"><Skeleton className="h-6 w-full mb-2"/><Skeleton className="h-6 w-3/4 mx-auto"/></td></tr>
                                ) : tableData.length === 0 ? (
                                    <tr><td colSpan={level === 'ad' ? 7 : 5} className="px-6 py-8 text-center text-text-secondary">Nenhum dado encontrado para o período.</td></tr>
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
                                            
                                            {/* Link Buttons for Ads Level */}
                                            {level === 'ad' && (
                                                <>
                                                    <td className="px-2 py-4 text-center">
                                                        {c.previewLink ? (
                                                            <a 
                                                                href={c.previewLink}
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center size-8 rounded-full bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-500 transition-all mx-auto"
                                                                title="Ver prévia no Facebook"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                                            </a>
                                                        ) : (
                                                            <span className="flex items-center justify-center size-8 rounded-full bg-white/5 text-text-secondary opacity-30 mx-auto cursor-not-allowed" title="Link indisponível">
                                                                <span className="material-symbols-outlined text-[16px]">block</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-4 text-center">
                                                        {c.instagramLink ? (
                                                            <a 
                                                                href={c.instagramLink}
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center size-8 rounded-full bg-pink-500/10 hover:bg-pink-500 hover:text-white text-pink-500 transition-all mx-auto"
                                                                title="Ver no Instagram"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                                            </a>
                                                        ) : (
                                                            <span className="flex items-center justify-center size-8 rounded-full bg-white/5 text-text-secondary opacity-30 mx-auto cursor-not-allowed" title="Link indisponível">
                                                                <span className="material-symbols-outlined text-[16px]">block</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                </>
                                            )}

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
