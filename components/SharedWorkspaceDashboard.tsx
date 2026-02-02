
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { SecureKV, DASHBOARD_TEMPLATES } from '../utils/kv';
import { KpiGrid, KpiCard, ChartContainer, DataTable } from './DashboardItems';
import type { InsightData, DashboardTemplate, KpiConfig } from '../types';

export const SharedWorkspaceDashboard: React.FC = () => {
    const { shareId } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [workspaceName, setWorkspaceName] = useState('Workspace');
    const [stats, setStats] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<InsightData[]>([]);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [currentTemplate, setCurrentTemplate] = useState<DashboardTemplate>(DASHBOARD_TEMPLATES[0]);

    useEffect(() => {
        // Add meta tags
        const meta = document.createElement('meta');
        meta.name = "robots";
        meta.content = "noindex, nofollow";
        document.head.appendChild(meta);

        const load = async () => {
            setIsLoading(true);
            setError(null);

            // 1. Resolve Workspace ID
            let wsId = shareId === 'demo_public_view' ? 'wk_demo' : null;
            if (!wsId && shareId) {
                wsId = SecureKV.getWorkspaceIdByShareToken(shareId);
            }

            if (!wsId) {
                setError("Link inválido ou expirado.");
                setIsLoading(false);
                return;
            }

            // 2. Get Workspace Info (Simulated since we don't have a full WS list here easily without passing props, 
            // but we can try to find it in localStorage 'sys:workspaces' if we want the name)
            const storedWorkspaces = localStorage.getItem('sys:workspaces');
            const workspaces = storedWorkspaces ? JSON.parse(storedWorkspaces) : [];
            const ws = workspaces.find((w: any) => w.id === wsId);
            setWorkspaceName(ws ? ws.name : "Workspace Compartilhado");

            // 3. Load Template Preference
            const tpl = SecureKV.getWorkspaceTemplate(wsId);
            setCurrentTemplate(tpl);

            // 4. Data Fetching Strategy
            if (wsId === 'wk_demo') {
                await loadDemoData();
            } else {
                await loadRealData(wsId);
            }
            
            setIsLoading(false);
        };

        load();

        return () => {
            if (document.head.contains(meta)) document.head.removeChild(meta);
        };
    }, [shareId]);

    const loadDemoData = async () => {
        await new Promise(r => setTimeout(r, 800));
        
        setStats({
            spend: 1249.73,
            impressions: 82569,
            clicks: 1240,
            ctr: 2.35,
            cpm: 14.26,
            cpc: 0.60,
            purchase_roas: [{ value: 3.8 }],
            actions: [
                { action_type: 'purchase', value: 24 },
                { action_type: 'onsite_conversion.messaging_conversation_started_7d', value: 45 }
            ]
        });

        const demoCampaigns: InsightData[] = [
            { id: 'c1', name: '[LRM][TRAFEGO][PERFIL][CBO][NATAL]', status: 'ACTIVE', objective: 'OUTCOME_TRAFFIC', spend: 749.73, impressions: 52569, clicks: 800, ctr: 2.90, cpm: 14.0, cpc: 0.49, roas: 4.2, cpa: 12.50, messages: 32, costPerConversation: 23.42 },
            { id: 'c2', name: '[INSTITUCIONAL][BRANDING][2024]', status: 'PAUSED', objective: 'OUTCOME_AWARENESS', spend: 299.23, impressions: 20569, clicks: 440, ctr: 2.1, cpm: 14.5, cpc: 0.68, roas: 1.5, cpa: 45.00, messages: 13, costPerConversation: 23.01 },
            { id: 'c3', name: '[CONVERSAO][LAL 1%][COMPRADORES]', status: 'ACTIVE', objective: 'OUTCOME_SALES', spend: 500.00, impressions: 9500, clicks: 200, ctr: 2.1, cpm: 52.6, cpc: 2.50, roas: 5.5, cpa: 25.00, messages: 5, costPerConversation: 100 }
        ];
        setCampaigns(demoCampaigns);

        const trend = Array.from({length: 15}, (_, i) => ({
            date: new Date(Date.now() - (14-i) * 86400000).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}),
            spend: Math.random() * 200 + 50,
            conversations: Math.floor(Math.random() * 20)
        }));
        setTrendData(trend);
    };

    const loadRealData = async (wsId: string) => {
        // Check for Token & Context
        const token = await SecureKV.getWorkspaceToken(wsId);
        const context = SecureKV.getWorkspaceContext(wsId);

        if (!token || !context?.adAccountId) {
            setError("Não foi possível acessar os dados. O token de acesso pode ter expirado ou você não tem permissão para visualizar este workspace neste navegador.");
            return;
        }

        if (!window.FB) {
            // Simple wait for SDK
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (!window.FB) {
                setError("Erro de conexão com o Facebook SDK.");
                return;
            }
        }

        const accountId = context.adAccountId;
        const apiTimeParams = { date_preset: 'last_30d' };

        try {
            // 1. Overview
            const statsReq = new Promise<any>(resolve => {
                window.FB.api(`/${accountId}/insights`, { 
                    access_token: token, 
                    fields: 'spend,impressions,clicks,ctr,cpm,cpc,actions,purchase_roas',
                    ...apiTimeParams
                }, resolve);
            });

            // 2. Campaigns
            const campaignsReq = new Promise<any>(resolve => {
                window.FB.api(`/${accountId}/campaigns`, { 
                    access_token: token, 
                    fields: 'id,name,status,objective',
                    limit: 50
                }, (res: any) => {
                    if (res.data) {
                        // Fetch insights for campaigns
                        window.FB.api(`/${accountId}/insights`, {
                            access_token: token,
                            level: 'campaign',
                            fields: 'campaign_id,spend,impressions,clicks,ctr,cpm,cpc,actions,purchase_roas',
                            ...apiTimeParams
                        }, (insightsRes: any) => {
                            const insightsMap = new Map();
                            if (insightsRes.data) insightsRes.data.forEach((i: any) => insightsMap.set(i.campaign_id, i));
                            
                            const merged = res.data.map((c: any) => {
                                const i: any = insightsMap.get(c.id) || {};
                                const spend = parseFloat(i.spend || '0');
                                const messages = i.actions?.find((a: any) => a.action_type.includes('messaging'))?.value || 0;
                                const purchases = i.actions?.find((a: any) => a.action_type === 'purchase' || a.action_type.includes('purchase'))?.value || 0;
                                
                                return {
                                    id: c.id,
                                    name: c.name,
                                    status: c.status,
                                    objective: c.objective,
                                    spend,
                                    impressions: parseInt(i.impressions || '0'),
                                    clicks: parseInt(i.clicks || '0'),
                                    ctr: parseFloat(i.ctr || '0'),
                                    cpm: parseFloat(i.cpm || '0'),
                                    cpc: parseFloat(i.cpc || '0'),
                                    roas: i.purchase_roas?.[0]?.value ? parseFloat(i.purchase_roas[0].value) : 0,
                                    cpa: purchases > 0 ? spend / parseFloat(purchases) : 0,
                                    messages: messages ? parseInt(messages) : 0,
                                    costPerConversation: messages > 0 ? spend / parseFloat(messages) : 0
                                };
                            });
                            resolve(merged);
                        });
                    } else {
                        resolve([]);
                    }
                });
            });

            // 3. Trend
            const trendReq = new Promise<any>(resolve => {
                window.FB.api(`/${accountId}/insights`, { 
                    access_token: token, 
                    fields: 'spend,actions,date_start',
                    time_increment: 1,
                    ...apiTimeParams
                }, (res: any) => {
                    if (res.data) {
                        const trend = res.data.map((d: any) => {
                            const msgs = d.actions?.find((a: any) => a.action_type.includes('messaging'));
                            return {
                                date: new Date(d.date_start).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}),
                                spend: parseFloat(d.spend || '0'),
                                conversations: msgs ? parseFloat(msgs.value) : 0
                            };
                        }).reverse();
                        resolve(trend);
                    } else {
                        resolve([]);
                    }
                });
            });

            const [statsData, campaignsData, trendDataResult] = await Promise.all([statsReq, campaignsReq, trendReq]);

            if (statsData && !statsData.error && statsData.data?.[0]) {
                setStats(statsData.data[0]);
            }
            if (Array.isArray(campaignsData)) setCampaigns(campaignsData);
            if (Array.isArray(trendDataResult)) setTrendData(trendDataResult);

        } catch (e) {
            console.error(e);
            setError("Erro ao carregar dados do Facebook.");
        }
    };

    const getKpiValue = (config: KpiConfig) => {
        if (!stats) return { value: '-', trend: undefined, sentiment: undefined };
        
        const val = (v: any) => typeof v === 'string' ? parseFloat(v) : (typeof v === 'number' ? v : 0);
        let rawValue = 0;
        let formattedValue = '-';

        // Simplified extraction
        switch (config.key) {
            case 'spend': rawValue = val(stats.spend); formattedValue = rawValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); break;
            case 'impressions': rawValue = val(stats.impressions); formattedValue = rawValue.toLocaleString('pt-BR'); break;
            case 'clicks': rawValue = val(stats.clicks); formattedValue = rawValue.toLocaleString('pt-BR'); break;
            case 'ctr': rawValue = val(stats.ctr); formattedValue = rawValue.toFixed(2) + '%'; break;
            case 'cpc': rawValue = val(stats.cpc); formattedValue = rawValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); break;
            case 'cpm': rawValue = val(stats.cpm); formattedValue = rawValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); break;
            case 'roas': 
                rawValue = stats.purchase_roas ? val(stats.purchase_roas[0]?.value) : 0; 
                formattedValue = rawValue.toFixed(2) + 'x'; 
                break;
            case 'purchases':
                const p = stats.actions?.find((a: any) => a.action_type.includes('purchase'));
                rawValue = p ? val(p.value) : 0;
                formattedValue = rawValue.toLocaleString('pt-BR');
                break;
            case 'cpa':
                const pc = stats.actions?.find((a: any) => a.action_type.includes('purchase'))?.value;
                rawValue = pc > 0 ? val(stats.spend) / val(pc) : 0;
                formattedValue = rawValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                break;
            default:
                formattedValue = '-';
        }

        return { value: formattedValue, trend: undefined, sentiment: undefined };
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#141122] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-text-secondary animate-pulse font-medium">Carregando dashboard seguro...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#141122] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#1e1b2e] border border-border-dark rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-red-500 text-[32px]">link_off</span>
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">Dashboard indisponível</h3>
                    <p className="text-text-secondary mb-8 leading-relaxed text-sm">{error}</p>
                    <a className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors" href="/#/login">
                        Ir para Andromeda Lab
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#141122] text-white font-display overflow-x-hidden flex flex-col">
            <nav className="w-full border-b border-border-dark bg-[#141122]/95 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-white text-base font-bold leading-none tracking-tight">Andromeda Lab</h1>
                                <span className="text-text-secondary text-[10px] font-medium uppercase tracking-wider mt-0.5">Visualização Pública</span>
                            </div>
                        </div>
                        <a href="/#/login" className="group flex items-center gap-2 px-4 py-2 bg-[#292348] hover:bg-[#3b3267] text-white text-sm font-semibold rounded-lg transition-all border border-transparent hover:border-primary/50">
                            <span className="truncate">Acessar Plataforma</span>
                            <span className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform text-[16px]">arrow_forward</span>
                        </a>
                    </div>
                </div>
            </nav>

            <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-text-secondary text-sm font-medium mb-1">
                            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs">Meta Ads</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">public</span>
                                Dashboard Público
                            </span>
                            <span>•</span>
                            <span className="text-[#0bda6c] flex items-center gap-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0bda6c] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0bda6c]"></span>
                                </span>
                                Live
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{workspaceName}</h2>
                        <p className="text-text-secondary text-base">Visualização de performance (Últimos 30 dias)</p>
                    </div>
                </header>

                <KpiGrid>
                    {currentTemplate.kpis.map((kpi: KpiConfig) => {
                        const data = getKpiValue(kpi);
                        return (
                            <KpiCard 
                                key={kpi.key}
                                label={kpi.label} 
                                value={data.value} 
                                trend={data.trend}
                                sentiment={data.sentiment}
                                icon={kpi.icon}
                            />
                        );
                    })}
                </KpiGrid>

                <div className="mt-8">
                    <ChartContainer 
                        title="Tendência de Investimento & Conversas" 
                        data={trendData} 
                        yAxisLabel="Investimento (BRL)"
                    />
                </div>

                <div className="mt-8">
                    <h3 className="text-xl font-bold text-white mb-4">Campanhas</h3>
                    <DataTable data={campaigns} viewLevel="campaign" />
                </div>

                <footer className="mt-12 py-6 border-t border-border-dark flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 opacity-50">
                        <span className="material-symbols-outlined text-text-secondary text-[20px]">rocket_launch</span>
                        <span className="text-text-secondary font-semibold text-sm">Andromeda Lab</span>
                    </div>
                    <p className="text-xs text-text-secondary/60">
                        Este é um dashboard compartilhado de acesso público. Os dados são de responsabilidade do proprietário do workspace.
                    </p>
                </footer>
            </main>
        </div>
    );
};
