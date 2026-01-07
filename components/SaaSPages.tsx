import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Badge, Modal, Skeleton, Accordion } from './UI';
import { AppShell, Stepper } from './Navigation';
import { SecureKV } from '../utils/kv';
import { SetupStep } from '../types';
import type { Workspace, AdminConfig, MetaBusiness, MetaAdAccount } from '../types';

// --- Integrations Page ---
export const IntegrationsPage: React.FC = () => {
    const [config, setConfig] = useState<AdminConfig>({ appId: '', isSecretSet: false, redirectUri: '', appDomain: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tempAppId, setTempAppId] = useState('');
    const [tempAppSecret, setTempAppSecret] = useState('');
    const [origin, setOrigin] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    
    // New state for feedback
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState<string>('');

    useEffect(() => {
        setOrigin(window.location.origin + '/');
        const load = async () => {
            const c = await SecureKV.getMetaConfig();
            if (c) {
                setConfig(c);
                setTempAppId(c.appId);
                // We do not load the secret for security display, user enters new one if needed
            }
        };
        load();
    }, []);

    // Reset test state when modal opens/closes
    useEffect(() => {
        if (!isModalOpen) {
            setTestStatus('idle');
            setTestMessage('');
        }
    }, [isModalOpen]);

    const handleSave = async () => {
        const newConfig = { appId: tempAppId, appSecret: tempAppSecret };
        await SecureKV.saveMetaConfig(newConfig as any);
        setConfig({ ...config, appId: tempAppId, isSecretSet: !!tempAppSecret });
        setIsModalOpen(false);
        // Trigger soft reload of SDK configuration instead of page reload
        window.dispatchEvent(new Event('sys_config_change'));
    };

    const handleTest = () => {
        setTestStatus('idle');
        setTestMessage('');

        if (!window.FB) {
             setTestStatus('error');
             setTestMessage("O SDK do Facebook não foi carregado. Verifique sua conexão ou bloqueadores de anúncio.");
             return;
        }
        
        if (!tempAppId) {
            setTestStatus('error');
            setTestMessage("Por favor, insira um App ID para testar.");
            return;
        }

        setIsTesting(true);

        try {
            // Try to re-init with the provided ID to test validity
            window.FB.init({
                appId: tempAppId,
                cookie: true,
                xfbml: true,
                version: 'v19.0'
            });

            window.FB.getLoginStatus((response: any) => {
                setIsTesting(false);
                if (response.status) {
                    setTestStatus('success');
                    setTestMessage(`✅ SUCESSO! O SDK conectou corretamente com o App ID: ${tempAppId}. Status: ${response.status}`);
                } else {
                    setTestStatus('error');
                    setTestMessage("⚠️ O SDK carregou, mas não foi possível verificar o status. Verifique se o App ID está correto.");
                }
            });
        } catch (e: any) {
            setIsTesting(false);
            setTestStatus('error');
            setTestMessage(`❌ ERRO: Falha ao inicializar com este App ID. ${e.message || ''}`);
        }
    };

    const openMetaDevelopers = () => {
        window.open('https://developers.facebook.com/apps/', '_blank', 'noopener,noreferrer');
    };

    return (
        <AppShell>
            <div className="max-w-5xl mx-auto py-12 px-6">
                <div className="mb-12">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Integrações Globais</h1>
                    <p className="text-text-secondary">Configure os conectores de API que alimentarão seus workspaces.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 relative overflow-hidden group border-primary/20 bg-primary/5">
                        <div className="absolute top-4 right-4"><Badge variant={config.appId ? 'success' : 'gray'}>{config.appId ? 'ATIVO' : 'INATIVO'}</Badge></div>
                        <div className="w-12 h-12 bg-[#1877F2] rounded-lg flex items-center justify-center text-white text-2xl mb-4 shadow-lg">
                            <span className="material-symbols-outlined">ads_click</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Meta Ads</h3>
                        <p className="text-sm text-text-secondary mb-6">Conecte-se à Graph API para extrair campanhas, conjuntos e anúncios.</p>
                        <Button onClick={() => { setTempAppId(config.appId); setIsModalOpen(true); }}>
                            Gerenciar Conexão
                        </Button>
                    </Card>

                    <Card className="p-6 relative overflow-hidden opacity-60">
                        <div className="absolute top-4 right-4"><Badge variant="gray">EM BREVE</Badge></div>
                        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-white text-2xl mb-4">
                            <span className="material-symbols-outlined">analytics</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Google Ads</h3>
                        <p className="text-sm text-text-secondary mb-6">Integração futura para análise de Search e Youtube Ads.</p>
                        <Button disabled variant="secondary">Indisponível</Button>
                    </Card>
                </div>

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} hideHeader className="max-w-2xl bg-[#0B0E14]">
                    <div>
                         {/* Header */}
                         <div className="flex items-center gap-4 mb-2">
                             <div className="w-12 h-12 rounded-xl bg-[#1877F2] flex items-center justify-center shadow-lg shadow-blue-900/20">
                                <span className="material-symbols-outlined text-white text-2xl">ads_click</span>
                             </div>
                             <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-white">Configuração Meta API</h2>
                                    {config.appId ? (
                                        <span className="material-symbols-outlined text-emerald-400 text-xl" title="Conectado">check_circle</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-amber-400 text-xl" title="Não Configurado">warning</span>
                                    )}
                                </div>
                             </div>
                         </div>
                         <p className="text-text-secondary text-sm mb-8 pl-16 -mt-4">
                            Insira as credenciais do seu aplicativo Meta (Facebook Developers).<br/>
                            Os dados são salvos apenas no LocalStorage do seu navegador.
                         </p>

                         {/* Info Box */}
                         <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 mb-8">
                             <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-blue-400 text-sm">info</span>
                                <span className="text-sm font-bold text-blue-400">Configuração Obrigatória no Meta for Developers</span>
                             </div>
                             <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                                Para que o login funcione, adicione a URL abaixo nas configurações do seu App (Campos URL do Site e Valid OAuth Redirect URIs).
                             </p>
                             <div className="relative group">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={origin}
                                    className="w-full bg-[#0F172A] border border-blue-500/30 rounded-lg py-3 px-4 text-xs text-blue-300 font-mono focus:outline-none"
                                />
                                <span className="absolute right-4 top-3 text-[10px] font-bold text-blue-500/70 tracking-wider">URL ATUAL</span>
                             </div>
                         </div>

                         {/* Form Fields */}
                         <div className="space-y-5 mb-8">
                            <div>
                                <label className="text-xs font-bold text-white uppercase ml-1 mb-2 block">App ID do Facebook</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-3.5 text-text-secondary">grid_view</span>
                                    <input 
                                        value={tempAppId}
                                        onChange={(e) => setTempAppId(e.target.value)}
                                        className="w-full bg-background-dark border border-border-dark rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary outline-none transition-all placeholder:text-slate-600"
                                        placeholder="Ex: 880124054712134"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-white uppercase ml-1 mb-2 block">App Secret</label>
                                 <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-3.5 text-text-secondary">vpn_key</span>
                                    <input 
                                        type="password"
                                        value={tempAppSecret}
                                        onChange={(e) => setTempAppSecret(e.target.value)}
                                        className="w-full bg-background-dark border border-border-dark rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary outline-none transition-all placeholder:text-slate-600"
                                        placeholder="••••••••••••••••••••••••••"
                                    />
                                </div>
                            </div>
                         </div>

                         {/* Feedback Section */}
                         {testMessage && (
                             <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 animate-in fade-in ${
                                 testStatus === 'success' 
                                     ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                     : 'bg-red-500/10 border-red-500/20 text-red-400'
                             }`}>
                                 <span className="material-symbols-outlined mt-0.5">
                                     {testStatus === 'success' ? 'check_circle' : 'error'}
                                 </span>
                                 <div className="text-sm font-medium leading-relaxed">{testMessage}</div>
                             </div>
                         )}

                         {/* Footer */}
                         <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                            <button 
                                onClick={openMetaDevelopers}
                                className="mt-4 text-xs text-text-secondary hover:text-white underline decoration-dashed underline-offset-4 flex items-center gap-1 transition-colors bg-transparent border-0 cursor-pointer p-0"
                            >
                                Obter credenciais no Meta for Developers
                                <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                            </button>
                            <div className="flex gap-3 mt-4">
                                <Button variant="secondary" onClick={handleTest} isLoading={isTesting} className="px-4">Testar Integração</Button>
                                <Button onClick={handleSave} className="px-6 bg-[#3713ec] hover:bg-[#2a0eb5]">Salvar Conexão</Button>
                            </div>
                         </div>
                    </div>
                </Modal>
            </div>
        </AppShell>
    );
};

// --- Workspaces Page ---
interface WorkspacesPageProps {
    workspaces: Workspace[];
    onCreateWorkspace: (name: string) => void;
}

export const WorkspacesPage: React.FC<WorkspacesPageProps> = ({ workspaces, onCreateWorkspace }) => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newName, setNewName] = useState('');

    const handleCreate = () => {
        if (!newName) return;
        onCreateWorkspace(newName);
        setNewName('');
        setIsModalOpen(false);
    };

    return (
        <AppShell workspaces={workspaces}>
            <div className="max-w-6xl mx-auto py-12 px-6">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-4">Seus Workspaces</h1>
                        <p className="text-text-secondary max-w-xl">Gerencie ambientes isolados de análise. Cada workspace conecta-se a uma conta única do Meta Ads.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => navigate('/integrations')}>
                            <span className="material-symbols-outlined text-lg">tune</span> Configurar APIs
                        </Button>
                        <Button onClick={() => setIsModalOpen(true)}>
                            <span className="material-symbols-outlined text-lg">add</span> Novo Workspace
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspaces.map(w => (
                        <Card key={w.id} className="p-6 hover:border-primary/50 transition-all group relative">
                            <div className="absolute top-4 right-4">
                                <Badge variant={w.metaConnected ? 'success' : 'gray'}>
                                    {w.metaConnected ? 'CONECTADO' : 'PENDENTE'}
                                </Badge>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center mb-4 border border-white/10 group-hover:border-primary/50 transition-colors">
                                <span className="material-symbols-outlined text-white">bar_chart_4_bars</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${w.metaConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-600'}`}></div>
                                {w.name}
                            </h3>
                            <p className="text-xs text-text-secondary font-mono mb-6">ID: {w.id}</p>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="secondary" onClick={() => navigate(`/w/${w.id}/setup`)}>Wizard</Button>
                                {w.metaConnected ? (
                                    <Button onClick={() => navigate(`/w/${w.id}/dashboard`)}>Dashboard</Button>
                                ) : (
                                    <Button disabled className="opacity-50 cursor-not-allowed">Dashboard</Button>
                                )}
                            </div>
                        </Card>
                    ))}
                    
                    {workspaces.length === 0 && (
                        <div className="col-span-full py-12 text-center border border-dashed border-border-dark rounded-xl bg-white/5">
                            <p className="text-text-secondary">Nenhum workspace criado ainda.</p>
                            <Button variant="ghost" onClick={() => setIsModalOpen(true)} className="mt-4">Criar o primeiro</Button>
                        </div>
                    )}
                </div>

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Criar Novo Workspace">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Nome do Workspace</label>
                            <input 
                                type="text" 
                                value={newName} 
                                onChange={e => setNewName(e.target.value)}
                                className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-white focus:border-primary outline-none"
                                placeholder="Ex: Cliente Alpha - Performance"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreate}>Criar Agora</Button>
                    </div>
                </Modal>
            </div>
        </AppShell>
    );
};

// --- Setup Wizard ---
interface SetupWizardProps {
    workspace: Workspace;
    onUpdateWorkspace: (w: Workspace) => void;
    sdkReady: boolean;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ workspace, onUpdateWorkspace, sdkReady }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState<SetupStep>(SetupStep.Connect);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [businesses, setBusinesses] = useState<MetaBusiness[]>([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
    const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
    const [selectedAdAccountId, setSelectedAdAccountId] = useState<string>('');
    
    // Steps labels matching the enum
    const steps = ['Conectar', 'Negócio', 'Conta de Anúncios', 'Teste de Dados', 'Concluído'];

    const getToken = async () => SecureKV.getWorkspaceToken(workspace.id);

    // Effect for Steps 1 & 2 Loading
    useEffect(() => {
        const loadStepData = async () => {
            if (!sdkReady || !window.FB) return;
            const token = await getToken();
            if (!token) return;

            setError(null);
            setIsLoading(true);

            if (currentStep === SetupStep.Business) {
                // Fetch Businesses
                window.FB.api('/me/businesses', { access_token: token, fields: 'id,name' }, (response: any) => {
                    setIsLoading(false);
                    if (response.error) {
                        // Fallback: Try fetching personal ad accounts directly if no business found
                         window.FB.api('/me/adaccounts', { access_token: token, fields: 'id,name,account_status,currency' }, (accResponse: any) => {
                             if (!accResponse.error && accResponse.data.length > 0) {
                                 // Skip business step if we have direct access to accounts
                                 setAdAccounts(accResponse.data);
                                 setCurrentStep(SetupStep.AdAccount);
                             } else {
                                 setError("Não foi possível encontrar Business Managers ou Contas de Anúncios.");
                             }
                         });
                    } else {
                        setBusinesses(response.data || []);
                    }
                });
            } else if (currentStep === SetupStep.AdAccount && selectedBusinessId) {
                // Fetch Ad Accounts (Both Client and Owned) to ensure we find all relevant accounts
                const fields = 'id,name,account_status,currency';
                
                const fetchEdge = (edge: string) => new Promise<any[]>((resolve) => {
                    window.FB.api(`/${selectedBusinessId}/${edge}`, { access_token: token, fields }, (res: any) => {
                        // If error (e.g. permission issue on one edge), just resolve empty
                        resolve(res.data || []);
                    });
                });

                try {
                    const [clientAccounts, ownedAccounts] = await Promise.all([
                        fetchEdge('client_ad_accounts'),
                        fetchEdge('owned_ad_accounts')
                    ]);

                    // Merge and deduplicate accounts by ID
                    const accountMap = new Map();
                    [...clientAccounts, ...ownedAccounts].forEach(acc => accountMap.set(acc.id, acc));
                    const combinedAccounts = Array.from(accountMap.values());
                    
                    setIsLoading(false);
                    setAdAccounts(combinedAccounts);

                    if (combinedAccounts.length === 0) {
                         // Keep error null initially to avoid flashing if user is just navigating, 
                         // but if strictly empty, we can show a message in the UI (handled by jsx check)
                    }
                } catch (e) {
                    setIsLoading(false);
                    setError("Erro ao recuperar contas de anúncio.");
                }

            } else if (currentStep === SetupStep.InsightsTest) {
                // Test Connection
                 window.FB.api(`/${selectedAdAccountId}`, { access_token: token, fields: 'name' }, (response: any) => {
                    setIsLoading(false);
                    if (response.error) {
                         setError("Falha ao acessar a conta. Verifique as permissões.");
                    } else {
                        // Success - Save Config
                        SecureKV.saveWorkspaceContext(workspace.id, { 
                            adAccountId: selectedAdAccountId, 
                            businessId: selectedBusinessId 
                        });
                        // Allow small delay for UX
                        setTimeout(() => setCurrentStep(SetupStep.Finished), 500);
                    }
                });
            } else {
                setIsLoading(false);
            }
        };

        loadStepData();
    }, [currentStep, sdkReady, selectedBusinessId, selectedAdAccountId, workspace.id]);

    const handleLogin = () => {
        if (!sdkReady || !window.FB) {
            alert("Facebook SDK não inicializado. Verifique a página de Integrações ou desbloqueie popups.");
            return;
        }

        setIsLoading(true);
        window.FB.login((response: any) => {
            setIsLoading(false);
            if (response.authResponse) {
                const accessToken = response.authResponse.accessToken;
                SecureKV.saveWorkspaceToken(workspace.id, accessToken);
                
                const updated = { ...workspace, metaConnected: true };
                onUpdateWorkspace(updated);
                
                setCurrentStep(SetupStep.Business);
            } else {
                console.log('User cancelled login or did not fully authorize.');
            }
        }, { scope: 'ads_read,read_insights,business_management' });
    };

    const handleSelectBusiness = (id: string) => {
        setSelectedBusinessId(id);
        setCurrentStep(SetupStep.AdAccount);
    };

    const handleSelectAccount = (id: string) => {
        setSelectedAdAccountId(id);
        setCurrentStep(SetupStep.InsightsTest);
    };

    return (
        <AppShell>
            <div className="max-w-4xl mx-auto py-12 px-6">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-black text-white mb-2">Configuração do Workspace</h1>
                    <p className="text-text-secondary">Siga os passos para conectar seus dados.</p>
                </div>
                
                <Stepper currentStep={currentStep} steps={steps} />

                <Card className="p-8 max-w-2xl mx-auto min-h-[400px] flex flex-col justify-center">
                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                            <span className="material-symbols-outlined">error</span>
                            {error}
                        </div>
                    )}

                    {currentStep === SetupStep.Connect && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[#1877F2] rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-6 shadow-lg shadow-blue-900/50">
                                <span className="material-symbols-outlined">ads_click</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">Conectar com Meta Ads</h3>
                            <p className="text-sm text-text-secondary mb-8 max-w-sm mx-auto">
                                Para importar campanhas e insights, precisamos de permissão para acessar sua conta de anúncios.
                            </p>
                            <Button onClick={handleLogin} isLoading={isLoading} className="w-full max-w-xs mx-auto">Continuar com Facebook</Button>
                        </div>
                    )}

                    {currentStep === SetupStep.Business && (
                         <div className="w-full">
                            <h3 className="text-xl font-bold text-white mb-2 text-center">Selecione o Business Manager</h3>
                            <p className="text-sm text-text-secondary mb-6 text-center">Escolha a organização que contém a conta de anúncios.</p>
                            
                            {isLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-16 w-full" />
                                </div>
                            ) : businesses.length === 0 ? (
                                <div className="text-center text-text-secondary py-8 border border-dashed border-border-dark rounded-lg">
                                    Nenhum Business Manager encontrado.
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {businesses.map(b => (
                                        <button 
                                            key={b.id}
                                            onClick={() => handleSelectBusiness(b.id)}
                                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border-dark bg-background-dark hover:bg-white/5 hover:border-primary/50 transition-all group text-left"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:bg-primary group-hover:text-white transition-colors font-bold">
                                                {b.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{b.name}</div>
                                                <div className="text-xs text-text-secondary">ID: {b.id}</div>
                                            </div>
                                            <span className="material-symbols-outlined ml-auto text-text-secondary group-hover:text-primary">chevron_right</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                         </div>
                    )}

                    {currentStep === SetupStep.AdAccount && (
                        <div className="w-full">
                            <h3 className="text-xl font-bold text-white mb-2 text-center">Selecione a Conta de Anúncios</h3>
                            <p className="text-sm text-text-secondary mb-6 text-center">Escolha a conta que deseja analisar neste workspace.</p>
                             
                            {isLoading ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-16 w-full" />
                                </div>
                            ) : adAccounts.length === 0 ? (
                                <div className="text-center text-text-secondary py-8 border border-dashed border-border-dark rounded-lg">
                                    Nenhuma conta de anúncios ativa encontrada neste Business.<br/>
                                    <span className="text-xs text-text-secondary mt-2 block">Verifique se o usuário tem permissão de administrador ou anunciante.</span>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {adAccounts.map(acc => (
                                        <button 
                                            key={acc.id}
                                            onClick={() => handleSelectAccount(acc.id)}
                                            className="w-full flex items-center gap-4 p-4 rounded-xl border border-border-dark bg-background-dark hover:bg-white/5 hover:border-primary/50 transition-all group text-left"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                <span className="material-symbols-outlined text-xl">payments</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-white">{acc.name}</div>
                                                <div className="flex gap-2 text-xs text-text-secondary mt-0.5">
                                                    <span>ID: {acc.id}</span>
                                                    <span>•</span>
                                                    <span className="text-white font-mono">{acc.currency}</span>
                                                </div>
                                            </div>
                                            <span className="material-symbols-outlined ml-auto text-text-secondary group-hover:text-primary">chevron_right</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {currentStep === SetupStep.InsightsTest && (
                         <div className="text-center py-12">
                             <div className="relative w-20 h-20 mx-auto mb-6">
                                 <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                                 <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                 <div className="absolute inset-0 flex items-center justify-center">
                                     <span className="material-symbols-outlined text-primary text-2xl">sync</span>
                                 </div>
                             </div>
                             <h3 className="text-xl font-bold text-white mb-2">Validando Acesso aos Dados</h3>
                             <p className="text-text-secondary">Estamos verificando as permissões de leitura...</p>
                         </div>
                    )}

                    {currentStep === SetupStep.Finished && (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-6 shadow-lg shadow-emerald-900/50 animate-bounce">
                                <span className="material-symbols-outlined text-5xl">check</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">Tudo Pronto!</h3>
                            <p className="text-text-secondary mb-8 max-w-sm mx-auto">
                                O workspace <strong>{workspace.name}</strong> está conectado e pronto para analisar seus dados.
                            </p>
                            <Button onClick={() => navigate(`/w/${workspace.id}/dashboard`)} className="w-full max-w-xs mx-auto py-3 text-lg">
                                Ir para Dashboard
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </AppShell>
    );
};
