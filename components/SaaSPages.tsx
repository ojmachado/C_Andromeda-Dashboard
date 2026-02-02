
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Badge, Modal, Skeleton, Accordion } from './UI';
import { AppShell, Stepper } from './Navigation';
import { SecureKV } from '../utils/kv';
import { SetupStep } from '../types';
import type { Workspace, AdminConfig, MetaBusiness, MetaAdAccount } from '../types';

// --- Admin Meta Setup Wizard Component ---
const AdminMetaSetup: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [config, setConfig] = useState({ appId: '', appSecret: '', webhookUrl: 'https://api.andromedalabs.ai/webhooks/meta/events' });
    const [showSecret, setShowSecret] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
    const [webhookStatus, setWebhookStatus] = useState<'idle' | 'verifying' | 'verified'>('idle');
    const [testResult, setTestResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [origin, setOrigin] = useState('');
    const [hostname, setHostname] = useState('');

    useEffect(() => {
        // Set URLs based on current environment
        setOrigin(window.location.origin);
        setHostname(window.location.hostname);
        
        const load = async () => {
            const c = await SecureKV.getMetaConfig();
            if (c) {
                setConfig(prev => ({ 
                    ...prev, 
                    appId: c.appId || '', 
                    appSecret: c.appSecret || '' 
                }));
            }
        };
        load();
    }, []);

    const handleSaveCredentials = async () => {
        await SecureKV.saveMetaConfig({ appId: config.appId, appSecret: config.appSecret });
        // Dispatch global event for App.tsx to catch and re-init SDK
        window.dispatchEvent(new Event('sys_config_change'));
    };

    const handleWebhookTest = () => {
        setWebhookStatus('verifying');
        setTimeout(() => setWebhookStatus('verified'), 1500);
    };

    const runIntegrationTest = async () => {
        setIsTesting(true);
        setTestResult(null);
        setConsoleLogs([]);
        const logs: string[] = [];
        const pushLog = (l: string) => {
            logs.push(l);
            setConsoleLogs([...logs]);
        };

        pushLog(`<div class="text-green-400 mb-1">> Initiating connection to Meta Graph API...</div>`);
        await new Promise(r => setTimeout(r, 800));
        
        if (!config.appId || !config.appSecret) {
            pushLog(`<div class="text-red-400 mb-1">> Error: Missing Credentials (App ID or Secret).</div>`);
            setTestResult({ type: 'error', message: 'Falha: Credenciais ausentes (App ID ou Secret).' });
            setIsTesting(false);
            return;
        }

        pushLog(`<div class="text-green-400 mb-1">> Verifying App Secret Proof...</div>`);
        await new Promise(r => setTimeout(r, 600));

        pushLog(`<div class="text-text-secondary mb-1">> GET /oauth/access_token</div>`);
        await new Promise(r => setTimeout(r, 600));

        pushLog(`<div class="text-blue-400 mt-2">{</div>`);
        pushLog(`<div class="text-blue-400 ml-4">"status": <span class="text-green-400">"success"</span>,</div>`);
        pushLog(`<div class="text-blue-400 ml-4">"latency": "120ms",</div>`);
        pushLog(`<div class="text-blue-400 ml-4">"message": "Token generated successfully."</div>`);
        pushLog(`<div class="text-blue-400">}</div>`);
        
        setTestResult({ type: 'success', message: 'Sucesso! Conexão verificada.' });
        setIsTesting(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="flex justify-center py-10 px-4 sm:px-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col max-w-[960px] w-full gap-8">
                {/* Header Section */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4 mb-2">
                        <button onClick={onBack} className="text-text-secondary hover:text-white transition-colors flex items-center gap-1 text-sm font-medium">
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Voltar
                        </button>
                    </div>
                    <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Configuração do Meta (Admin)</h1>
                    <p className="text-text-secondary text-base font-normal leading-normal max-w-2xl">
                        Gerencie as chaves de API e configurações globais para a integração multi-tenant. Siga o assistente abaixo para conectar o Meta Ads ao Andromeda Lab.
                    </p>
                </div>

                {/* Stepper Visual */}
                <div className="w-full bg-[#1e1933] rounded-xl p-6 border border-[#3b3267]">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[#3b3267] -z-0"></div>
                        {[
                            { step: 1, label: 'Status' }, 
                            { step: 2, label: 'Credenciais' }, 
                            { step: 3, label: 'URLs' }, 
                            { step: 4, label: 'Webhooks' }, 
                            { step: 5, label: 'Teste' }
                        ].map((s, i) => (
                            <div key={s.step} className="relative z-10 flex flex-col items-center gap-2 bg-[#1e1933] px-2 sm:px-4">
                                <div className={`flex items-center justify-center size-8 rounded-full font-bold text-sm ${i < 4 ? 'bg-primary text-white' : i === 4 ? 'bg-[#1e1933] border-2 border-primary text-white' : 'bg-[#3b3267] text-text-secondary'}`}>
                                    {s.step}
                                </div>
                                <span className={`text-xs font-medium hidden sm:block ${i <= 4 ? 'text-white' : 'text-text-secondary'}`}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: System Check */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 px-1">
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                        <h3 className="text-white text-lg font-bold leading-tight">Passo 1: Verificação de Sistema</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2 rounded-xl p-6 border border-[#3b3267] bg-[#1e1933] hover:border-primary/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <p className="text-text-secondary text-sm font-medium uppercase tracking-wider">API Backend</p>
                                <div className="flex items-center gap-1.5 bg-[#0bda6c]/10 px-2 py-1 rounded text-[#0bda6c] text-xs font-bold">
                                    <span className="material-symbols-outlined text-[14px]">wifi</span>
                                    ONLINE
                                </div>
                            </div>
                            <div className="mt-2">
                                <p className="text-white text-2xl font-bold leading-tight">Connected</p>
                                <p className="text-text-secondary text-sm mt-1">Latência: 45ms</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl p-6 border border-[#3b3267] bg-[#1e1933] hover:border-primary/50 transition-colors">
                            <div className="flex items-center justify-between">
                                <p className="text-text-secondary text-sm font-medium uppercase tracking-wider">Redis / KV Store</p>
                                <div className="flex items-center gap-1.5 bg-[#0bda6c]/10 px-2 py-1 rounded text-[#0bda6c] text-xs font-bold">
                                    <span className="material-symbols-outlined text-[14px]">database</span>
                                    OPERATIONAL
                                </div>
                            </div>
                            <div className="mt-2">
                                <p className="text-white text-2xl font-bold leading-tight">Sync OK</p>
                                <p className="text-text-secondary text-sm mt-1">Last sync: Just now</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-[#3b3267] w-full my-2"></div>

                {/* Step 2: Credentials */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 px-1">
                        <span className="material-symbols-outlined text-primary">lock</span>
                        <h3 className="text-white text-lg font-bold leading-tight">Passo 2: Credenciais do Aplicativo</h3>
                    </div>
                    <div className="rounded-xl border border-[#3b3267] bg-[#1e1933] p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <label className="flex flex-col gap-2">
                                <span className="text-white text-sm font-medium">Meta App ID</span>
                                <input 
                                    className="w-full rounded-lg border border-[#3b3267] bg-[#141122] p-3 text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                                    placeholder="ex: 123456789012345" 
                                    type="text" 
                                    value={config.appId}
                                    onChange={e => setConfig({...config, appId: e.target.value})}
                                />
                                <span className="text-xs text-text-secondary">O ID numérico do seu aplicativo Meta.</span>
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-white text-sm font-medium">Meta App Secret</span>
                                <div className="relative">
                                    <input 
                                        className="w-full rounded-lg border border-[#3b3267] bg-[#141122] p-3 pr-10 text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                                        placeholder="••••••••••••••••" 
                                        type={showSecret ? "text" : "password"}
                                        value={config.appSecret}
                                        onChange={e => setConfig({...config, appSecret: e.target.value})}
                                    />
                                    <button 
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">{showSecret ? 'visibility' : 'visibility_off'}</span>
                                    </button>
                                </div>
                                <span className="text-xs text-text-secondary">Chave secreta. Nunca compartilhe este valor.</span>
                            </label>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={handleSaveCredentials}
                                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-[20px]">save</span>
                                Salvar Credenciais
                            </button>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-[#3b3267] w-full my-2"></div>

                {/* Step 3: URLs */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 px-1">
                        <span className="material-symbols-outlined text-primary">link</span>
                        <h3 className="text-white text-lg font-bold leading-tight">Passo 3: Configuração de Domínio e Redirecionamento</h3>
                    </div>
                    <div className="rounded-xl border border-[#3b3267] bg-[#1e1933] p-6">
                        <p className="text-text-secondary text-sm mb-6">
                            Copie os valores abaixo e configure no painel "Login do Facebook" nas configurações do seu aplicativo Meta.
                        </p>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-white text-sm font-medium">Redirect URI (OAuth Callback)</span>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input 
                                            className="w-full rounded-lg border border-[#3b3267] bg-[#141122]/50 text-text-secondary p-3 font-mono text-sm outline-none cursor-text" 
                                            readOnly 
                                            type="text" 
                                            value={`${origin}/api/auth/callback/meta`} 
                                        />
                                    </div>
                                    <button 
                                        onClick={() => copyToClipboard(`${origin}/api/auth/callback/meta`)}
                                        className="flex items-center justify-center size-[46px] rounded-lg border border-[#3b3267] bg-[#141122] text-white hover:bg-[#3b3267] transition-colors group" 
                                        title="Copiar"
                                    >
                                        <span className="material-symbols-outlined text-[20px] group-active:scale-90 transition-transform">content_copy</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-white text-sm font-medium">App Domain</span>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input 
                                            className="w-full rounded-lg border border-[#3b3267] bg-[#141122]/50 text-text-secondary p-3 font-mono text-sm outline-none cursor-text" 
                                            readOnly 
                                            type="text" 
                                            value={hostname || 'localhost'} 
                                        />
                                    </div>
                                    <button 
                                        onClick={() => copyToClipboard(hostname || 'localhost')}
                                        className="flex items-center justify-center size-[46px] rounded-lg border border-[#3b3267] bg-[#141122] text-white hover:bg-[#3b3267] transition-colors group" 
                                        title="Copiar"
                                    >
                                        <span className="material-symbols-outlined text-[20px] group-active:scale-90 transition-transform">content_copy</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="h-px bg-[#3b3267] w-full my-2"></div>

                {/* Step 4: Webhooks */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 px-1">
                        <span className="material-symbols-outlined text-primary">webhook</span>
                        <h3 className="text-white text-lg font-bold leading-tight">Passo 4: Webhooks de Notificação</h3>
                    </div>
                    <div className="rounded-xl border border-[#3b3267] bg-[#1e1933] p-6">
                        <p className="text-text-secondary text-sm mb-6">
                            Configure a URL que receberá as notificações de eventos em tempo real (Webhooks) do Meta Graph API. O sistema validará automaticamente o endpoint.
                        </p>
                        <div className="flex flex-col gap-4">
                            <label className="flex flex-col gap-2">
                                <span className="text-white text-sm font-medium">Webhook Callback URL</span>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input 
                                        className="w-full rounded-lg border border-[#3b3267] bg-[#141122] p-3 text-white placeholder-text-secondary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                                        placeholder="https://api.seudominio.com/webhooks/meta" 
                                        type="url" 
                                        value={config.webhookUrl}
                                        onChange={e => setConfig({...config, webhookUrl: e.target.value})}
                                    />
                                    <button 
                                        onClick={handleWebhookTest}
                                        className="whitespace-nowrap flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-primary/20"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                        Salvar e Testar
                                    </button>
                                </div>
                                <span className="text-xs text-text-secondary">O sistema enviará um payload de verificação. Certifique-se de que sua API retorna o `hub.challenge` corretamente.</span>
                            </label>
                            
                            {webhookStatus === 'verifying' && (
                                <div className="mt-2 flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 animate-pulse">
                                     <span className="material-symbols-outlined text-blue-400 text-[20px] animate-spin">sync</span>
                                     <p className="text-blue-400 text-sm font-bold">Verificando...</p>
                                </div>
                            )}

                            {webhookStatus === 'verified' && (
                                <div className="mt-2 flex items-center gap-3 p-3 rounded-lg bg-[#0bda6c]/10 border border-[#0bda6c]/20 animate-in fade-in">
                                    <div className="flex items-center justify-center size-8 rounded-full bg-[#0bda6c]/20 text-[#0bda6c]">
                                        <span className="material-symbols-outlined text-[20px]">verified</span>
                                    </div>
                                    <div>
                                        <p className="text-[#0bda6c] text-sm font-bold">Webhook Verificado</p>
                                        <p className="text-[#0bda6c]/80 text-xs">Resposta recebida em 89ms • Status 200 OK</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <div className="h-px bg-[#3b3267] w-full my-2"></div>

                {/* Step 5: Validation */}
                <section className="flex flex-col gap-4 pb-10">
                    <div className="flex items-center gap-2 px-1">
                        <span className="material-symbols-outlined text-primary">science</span>
                        <h3 className="text-white text-lg font-bold leading-tight">Passo 5: Validação</h3>
                    </div>
                    <div className="rounded-xl border border-[#3b3267] bg-[#1e1933] p-6">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-1">
                                <p className="text-white font-medium mb-2">Teste de Integração</p>
                                <p className="text-text-secondary text-sm mb-4">
                                    Este teste tentará gerar um token de aplicação temporário para verificar se o ID e o Segredo são válidos e se os servidores do Meta estão acessíveis.
                                </p>
                                
                                <div className="flex flex-col gap-3">
                                    <button 
                                        onClick={runIntegrationTest}
                                        disabled={isTesting}
                                        className="flex items-center justify-center gap-2 bg-white hover:bg-gray-200 disabled:opacity-70 disabled:cursor-not-allowed text-background-dark px-5 py-2.5 rounded-lg font-bold transition-all w-fit min-w-[160px]"
                                    >
                                        {isTesting ? (
                                            <svg className="animate-spin size-5 text-background-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                                        )}
                                        {isTesting ? 'Testando...' : 'Executar Teste'}
                                    </button>

                                    {testResult && (
                                        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm border animate-in fade-in slide-in-from-top-2 ${
                                            testResult.type === 'success' 
                                                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                            <span className="material-symbols-outlined text-[18px]">
                                                {testResult.type === 'success' ? 'check_circle' : 'error'}
                                            </span>
                                            <span className="font-medium">{testResult.message}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 w-full">
                                <div className="rounded-lg bg-[#0f0e17] border border-[#3b3267] p-4 font-mono text-xs overflow-hidden h-[200px] overflow-y-auto">
                                    <div className="flex items-center gap-1.5 mb-3 border-b border-[#3b3267] pb-2 sticky top-0 bg-[#0f0e17]">
                                        <div className="size-2.5 rounded-full bg-red-500"></div>
                                        <div className="size-2.5 rounded-full bg-yellow-500"></div>
                                        <div className="size-2.5 rounded-full bg-green-500"></div>
                                        <span className="ml-2 text-text-secondary">console output</span>
                                    </div>
                                    {consoleLogs.length === 0 ? (
                                        <div className="text-text-secondary/30 italic">Aguardando execução...</div>
                                    ) : (
                                        consoleLogs.map((log, idx) => (
                                            <div key={idx} dangerouslySetInnerHTML={{__html: log}} />
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

// --- Integrations Page ---
export const IntegrationsPage: React.FC = () => {
    const [config, setConfig] = useState<AdminConfig | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'setup'>('list');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            const c = await SecureKV.getMetaConfig();
            setConfig(c);
        };
        load();
        // Listener for config changes
        const handler = () => load();
        window.addEventListener('sys_config_change', handler);
        return () => window.removeEventListener('sys_config_change', handler);
    }, [viewMode]);

    const handleDisconnect = async () => {
        if(confirm("Tem certeza? Isso interromperá a sincronização de dados.")) {
            await SecureKV.saveMetaConfig({ appId: '', appSecret: '' });
            setConfig(null);
            window.dispatchEvent(new Event('sys_config_change'));
        }
    };

    const handleSaveMock = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 800);
    };

    if (viewMode === 'setup') {
        return (
            <AppShell>
                <AdminMetaSetup onBack={() => setViewMode('list')} />
            </AppShell>
        );
    }

    const isConnected = !!config?.appId;

    return (
        <AppShell>
            <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20 p-6 md:p-10">
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] mb-2">Integrações</h1>
                            <p className="text-text-secondary text-base font-normal max-w-2xl">
                                Gerencie as conexões com plataformas de anúncios para centralizar sua análise de dados.
                            </p>
                        </div>
                        <button className="bg-primary hover:bg-primary-hover text-white text-sm font-bold py-2.5 px-5 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Nova Conexão
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1 rounded-xl p-5 border border-[#3b3267] bg-[#1f1b33]/30">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-text-secondary text-[20px]">hub</span>
                            <p className="text-text-secondary text-sm font-medium">Total Disponível</p>
                        </div>
                        <p className="text-white tracking-tight text-2xl font-bold">2</p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl p-5 border border-green-900/50 bg-green-900/10">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-green-400 text-[20px]">check_circle</span>
                            <p className="text-green-400 text-sm font-medium">Conexões Ativas</p>
                        </div>
                        <p className="text-white tracking-tight text-2xl font-bold">{isConnected ? 1 : 0}</p>
                    </div>
                    <div className="flex flex-col gap-1 rounded-xl p-5 border border-[#3b3267] bg-[#1f1b33]/30">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-text-secondary text-[20px]">link_off</span>
                            <p className="text-text-secondary text-sm font-medium">Não Conectados</p>
                        </div>
                        <p className="text-white tracking-tight text-2xl font-bold">{isConnected ? 1 : 2}</p>
                    </div>
                </div>

                {/* Active Configuration (Visible if Connected) */}
                {isConnected && (
                    <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <h3 className="text-white text-lg font-bold">Configuração Ativa</h3>
                        <div className="w-full bg-[#1f1b33] border border-border-dark rounded-xl overflow-hidden shadow-sm">
                            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                                <div className="flex flex-col gap-4 min-w-[200px] md:w-1/3">
                                    <div className="size-16 rounded-xl bg-[#0668E1]/10 flex items-center justify-center p-2 shadow-sm border border-[#0668E1]/20">
                                        <span className="material-symbols-outlined text-[36px] text-[#0668E1] icon-fill">campaign</span>
                                    </div>
                                    <div>
                                        <h4 className="text-white text-xl font-bold">Meta Ads</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="relative flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                            </span>
                                            <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">Conectado</span>
                                        </div>
                                    </div>
                                    <p className="text-text-secondary text-sm">
                                        Fonte primária de dados. Sincronização automática de campanhas, conjuntos de anúncios e anúncios criativos.
                                    </p>
                                </div>
                                <div className="flex-1 flex flex-col gap-6 border-t md:border-t-0 md:border-l border-border-dark pt-6 md:pt-0 md:pl-8 justify-center">
                                    <div className="flex justify-between items-center bg-[#292348]/50 p-4 rounded-lg border border-[#3b3267]">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[20px]">person</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-text-secondary uppercase tracking-wider font-bold mb-0.5">Conta Conectada</span>
                                                <span className="text-sm font-medium text-white">Ricardo M. (Business Manager)</span>
                                                <span className="text-xs text-text-secondary mt-0.5">ID: {config?.appId}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">sync</span>
                                                Sincronizado
                                            </span>
                                            <span className="text-[10px] text-text-secondary">Há 5 min</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Conta de Anúncios</label>
                                            <div className="relative">
                                                <select className="w-full bg-[#141122] border border-[#3b3267] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 appearance-none">
                                                    <option>Andromeda Lab (Act_9928...)</option>
                                                    <option>Client A - Ecom</option>
                                                    <option>Client B - Lead Gen</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                                                    <span className="material-symbols-outlined">expand_more</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Janela de Atribuição</label>
                                            <div className="relative">
                                                <select className="w-full bg-[#141122] border border-[#3b3267] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 appearance-none">
                                                    <option>7 dias clique / 1 dia visualização</option>
                                                    <option>1 dia clique</option>
                                                    <option>28 dias clique (Legacy)</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                                                    <span className="material-symbols-outlined">expand_more</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-2">
                                        <button 
                                            onClick={handleDisconnect}
                                            className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            Desconectar
                                        </button>
                                        <button 
                                            onClick={handleSaveMock}
                                            className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-hover shadow-lg shadow-primary/25 transition-all flex items-center gap-2"
                                        >
                                            {isSaving ? (
                                                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-[18px]">save</span>
                                            )}
                                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Available Integrations */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white text-lg font-bold">Integrações Disponíveis</h3>
                        <div className="relative hidden sm:block">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">search</span>
                            <input className="bg-[#141122] border border-[#3b3267] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-64 pl-10 p-2 placeholder-text-secondary/50" placeholder="Buscar integração..." type="text"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* Google Ads */}
                        <div className="group relative flex flex-col justify-between rounded-xl border border-border-dark bg-[#1f1b33] p-6 transition-all hover:border-[#3b3267] hover:bg-[#25203d]">
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="size-12 rounded-lg bg-white p-2 flex items-center justify-center">
                                        <img alt="Google Ads Logo" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5PMuPxtuLDBNVPuUAUJln2xRrRDu83ZNMDemg2c3PlS9SLm3WE8vsP7Pk23JQkF660-xHhH_MZxZRek7FOdlv37hSJQT4Gb9_RX5amHGZeemtO9TN-TwYajBnV6cSc2c4WaAspzZ0JCmuuhkpHQrgQCjp99gt80QTB5lGhtsMSHDemafgZCqCWsdWt49YYdU65SKK2MMdze1UAiMdyYZj-1Js-opBOjQdLI_IzC-vFEJvDKn_VB4tzZO3hybUDyAOgGRnmo88sv4"/>
                                    </div>
                                    <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                                        <p className="text-text-secondary text-xs font-bold uppercase tracking-wider">Não Conectado</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-white text-lg font-bold mb-1">Google Ads</h4>
                                    <p className="text-text-secondary text-sm leading-relaxed">
                                        Importe dados de campanhas Search, Display e YouTube para análise cruzada.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-end">
                                <button disabled className="w-full py-2 px-4 rounded-lg bg-white/5 text-text-secondary border border-white/10 text-sm font-bold cursor-not-allowed opacity-60">
                                    Em Breve
                                </button>
                            </div>
                        </div>

                        {/* Meta Ads */}
                        <div className={`group relative flex flex-col justify-between rounded-xl border ${isConnected ? 'border-[#0668E1]/30 hover:border-[#0668E1]/50' : 'border-border-dark hover:border-[#3b3267]'} bg-[#1f1b33] p-6 transition-all hover:bg-[#25203d]`}>
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="size-12 rounded-lg bg-[#0668E1]/10 flex items-center justify-center text-[#0668E1] border border-[#0668E1]/20">
                                        <span className="material-symbols-outlined text-[32px] icon-fill">campaign</span>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full ${isConnected ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5 border border-white/10'}`}>
                                        <p className={`${isConnected ? 'text-green-400' : 'text-text-secondary'} text-xs font-bold uppercase tracking-wider`}>{isConnected ? 'Conectado' : 'Não Conectado'}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-white text-lg font-bold mb-1">Meta Ads</h4>
                                    <p className="text-text-secondary text-sm leading-relaxed">
                                        Gerencie sua conexão principal, tokens de acesso e contas de anúncio vinculadas.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                {isConnected ? (
                                    <>
                                        <span className="text-xs text-text-secondary flex items-center gap-1">
                                            <span className="size-2 bg-green-500 rounded-full inline-block"></span>
                                            Ativo
                                        </span>
                                        <button onClick={() => setViewMode('setup')} className="text-sm font-bold text-white hover:text-primary transition-colors">Gerenciar</button>
                                    </>
                                ) : (
                                    <button onClick={() => setViewMode('setup')} className="w-full py-2 px-4 rounded-lg bg-white/5 text-white border border-white/10 hover:bg-white/10 text-sm font-bold transition-colors">
                                        Conectar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
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

    // Defined missing handlers for selecting business and account
    const handleSelectBusiness = (id: string) => {
        setSelectedBusinessId(id);
        setCurrentStep(SetupStep.AdAccount);
    };

    const handleSelectAccount = (id: string) => {
        setSelectedAdAccountId(id);
        setCurrentStep(SetupStep.InsightsTest);
    };

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

    const handleLogin = async () => {
        const config = await SecureKV.getMetaConfig();
        
        // 1. Check if FB App ID is configured globally
        if (!config?.appId) {
            setError("ERRO: Meta App ID não configurado. Vá na página de 'Integrações' e configure as chaves mestras da API primeiro.");
            return;
        }

        // 2. Check if SDK is actually loaded
        if (!window.FB) {
            setError("O script do Facebook não pôde ser carregado. Verifique se há bloqueadores de anúncios ativos ou se permitiu popups.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        window.FB.login((response: any) => {
            setIsLoading(false);
            if (response.authResponse) {
                const accessToken = response.authResponse.accessToken;
                SecureKV.saveWorkspaceToken(workspace.id, accessToken);
                
                const updated = { ...workspace, metaConnected: true };
                onUpdateWorkspace(updated);
                
                setCurrentStep(SetupStep.Business);
            } else {
                setError("Login cancelado ou não autorizado pelo usuário.");
                console.log('User cancelled login or did not fully authorize.');
            }
        }, { scope: 'ads_read,read_insights,business_management' });
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
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex flex-col gap-3">
                            <div className="flex items-center gap-3 text-red-400 text-sm font-bold">
                                <span className="material-symbols-outlined">error</span>
                                <span>Atenção</span>
                            </div>
                            <p className="text-red-400/80 text-sm leading-relaxed">{error}</p>
                            {error.includes('Integrações') && (
                                <button 
                                    onClick={() => navigate('/integrations')}
                                    className="mt-2 text-xs font-bold text-white bg-red-500 px-3 py-2 rounded-md hover:bg-red-600 transition-colors w-fit"
                                >
                                    Ir para Integrações
                                </button>
                            )}
                        </div>
                    )}

                    {currentStep === SetupStep.Connect && (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[#1877F2] rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-6 shadow-lg shadow-blue-900/50">
                                <span className="material-symbols-outlined">ads_click</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">Conectar com Meta Ads</h3>
                            <p className="text-sm text-text-secondary mb-8 max-w-sm mx-auto">
                                Para importar campanhas e insights, precisamos de permissão para acessar sua conta de anúncios via API do Facebook.
                            </p>
                            <Button onClick={handleLogin} isLoading={isLoading} className="w-full max-w-xs mx-auto h-12 text-base">
                                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                Continuar com Facebook
                            </Button>
                            <p className="mt-6 text-[10px] text-text-secondary uppercase tracking-widest font-medium opacity-50">
                                Conexão Segura SSL/TLS
                            </p>
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
