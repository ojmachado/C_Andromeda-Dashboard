
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SecureKV } from '../utils/kv';
import { Button } from './UI';

export const SharedWorkspaceDashboard: React.FC = () => {
    const { shareId } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [workspaceName, setWorkspaceName] = useState('Workspace');

    useEffect(() => {
        // Add meta tags
        const meta = document.createElement('meta');
        meta.name = "robots";
        meta.content = "noindex, nofollow";
        document.head.appendChild(meta);

        // Fetch Data Simulation
        const load = async () => {
            setIsLoading(true);
            await new Promise(r => setTimeout(r, 1200)); // Simulate Loading

            // Check if it's the static demo ID (universal access)
            if (shareId === 'demo_public_view') {
                setIsValid(true);
                setWorkspaceName("Demo Store (Moda)");
            } else {
                // Otherwise check local storage
                const wsId = shareId ? SecureKV.getWorkspaceIdByShareToken(shareId) : null;
                if (wsId) {
                    setIsValid(true);
                    setWorkspaceName("Alpha Team"); 
                } else {
                    setIsValid(false);
                }
            }
            setIsLoading(false);
        };
        load();

        return () => {
            document.head.removeChild(meta);
        };
    }, [shareId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#141122] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-text-secondary animate-pulse font-medium">Carregando dashboard seguro...</p>
            </div>
        );
    }

    if (!isValid) {
        return (
            <div className="min-h-screen bg-[#141122] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#1e1b2e] border border-border-dark rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-red-500 text-[32px]">link_off</span>
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">Dashboard indisponível</h3>
                    <p className="text-text-secondary mb-8 leading-relaxed">
                        O link que você tentou acessar expirou, não existe ou foi desativado pelo proprietário do workspace.
                    </p>
                    <a className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors" href="/#/login">
                        Ir para Andromeda Lab
                    </a>
                </div>
            </div>
        );
    }

    // Render High-Fidelity Mock for Shared Dashboard
    return (
        <div className="min-h-screen bg-[#141122] text-white font-display overflow-x-hidden flex flex-col">
            {/* Navbar */}
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

            {/* Main Content */}
            <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
                {/* Header */}
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
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{workspaceName} - Black Friday</h2>
                        <p className="text-text-secondary text-base">Visão geral de desempenho de campanhas de conversão.</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 bg-[#1e1b2e] border border-border-dark rounded-lg px-3 py-2">
                            <span className="material-symbols-outlined text-text-secondary text-[18px]">calendar_today</span>
                            <span className="text-white text-sm font-medium">01 Nov - 30 Nov 2023</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1 text-right">Atualizado há 15 min</p>
                    </div>
                </header>

                {/* KPI Grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Investimento Total', value: 'R$ 45.230,00', icon: 'payments', trend: '+15%', isGood: true },
                        { label: 'ROAS (Retorno)', value: '4.2x', icon: 'ads_click', trend: '+0.5', isGood: true },
                        { label: 'CPA Médio', value: 'R$ 18,50', icon: 'shopping_cart', trend: '-12%', isGood: true },
                        { label: 'Conversões', value: '2.450', icon: 'group_add', trend: '+8%', isGood: true },
                    ].map((kpi, i) => (
                        <div key={i} className="bg-[#1e1b2e] border border-border-dark rounded-xl p-5 hover:border-primary/30 transition-colors group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-white text-[48px]">{kpi.icon}</span>
                            </div>
                            <div className="flex flex-col gap-1 relative z-10">
                                <p className="text-text-secondary text-sm font-medium">{kpi.label}</p>
                                <p className="text-white text-2xl font-bold tracking-tight">{kpi.value}</p>
                                <div className="flex items-center gap-1 mt-2">
                                    <span className={`bg-${kpi.isGood ? 'emerald-500' : 'red-500'}/10 text-${kpi.isGood ? 'emerald-500' : 'red-500'} text-xs font-bold px-1.5 py-0.5 rounded flex items-center`}>
                                        <span className="material-symbols-outlined text-[12px]">{kpi.isGood ? 'trending_up' : 'trending_down'}</span>
                                        {kpi.trend}
                                    </span>
                                    <span className="text-text-secondary text-xs">vs mês anterior</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Charts Section */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-[#1e1b2e] border border-border-dark rounded-xl p-6 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-white text-lg font-bold">Evolução de Custos vs. Resultados</h3>
                                <p className="text-text-secondary text-sm mt-1">Comparativo diário de investimento e vendas.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                                    Resultados
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#9b92c9]"></span>
                                    Custo
                                </span>
                            </div>
                        </div>
                        {/* Chart SVG */}
                        <div className="relative w-full h-[240px] mt-auto">
                            <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-xs text-text-secondary font-medium">
                                <span>4k</span><span>3k</span><span>2k</span><span>1k</span><span>0</span>
                            </div>
                            <div className="ml-10 h-full relative">
                                <div className="absolute top-0 w-full border-t border-border-dark/50"></div>
                                <div className="absolute top-1/4 w-full border-t border-border-dark/50"></div>
                                <div className="absolute top-2/4 w-full border-t border-border-dark/50"></div>
                                <div className="absolute top-3/4 w-full border-t border-border-dark/50"></div>
                                <div className="absolute bottom-6 w-full border-t border-border-dark/50"></div>
                                <svg className="absolute inset-0 h-[calc(100%-24px)] w-full overflow-visible" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="gradientPrimary" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#3713ec" stopOpacity="0.5"></stop>
                                            <stop offset="100%" stopColor="#3713ec" stopOpacity="0"></stop>
                                        </linearGradient>
                                    </defs>
                                    <path className="opacity-30" d="M0,180 C40,160 80,100 120,110 C160,120 200,60 240,50 C280,40 320,80 360,70 C400,60 440,20 480,30 C520,40 560,30 600,20 C640,10 680,40 720,30 C760,20 800,10 840,40 C880,70 920,50 960,60 L960,216 L0,216 Z" fill="url(#gradientPrimary)" stroke="none"></path>
                                    <path d="M0,180 C40,160 80,100 120,110 C160,120 200,60 240,50 C280,40 320,80 360,70 C400,60 440,20 480,30 C520,40 560,30 600,20 C640,10 680,40 720,30 C760,20 800,10 840,40 C880,70 920,50 960,60" fill="none" stroke="#3713ec" strokeLinecap="round" strokeWidth="3"></path>
                                    <path d="M0,150 C50,155 100,140 150,145 C200,150 250,130 300,120 C350,110 400,125 450,115 C500,105 550,90 600,85 C650,80 700,95 750,90 C800,85 850,70 900,75 C950,80 1000,70 1000,65" fill="none" stroke="#9b92c9" strokeDasharray="5,5" strokeLinecap="round" strokeWidth="2"></path>
                                </svg>
                                <div className="absolute bottom-0 w-full flex justify-between text-xs text-text-secondary font-medium pt-2">
                                    <span>01 Nov</span><span>05 Nov</span><span>10 Nov</span><span>15 Nov</span><span>20 Nov</span><span>25 Nov</span><span>30 Nov</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Stats / Funnel */}
                    <div className="bg-[#1e1b2e] border border-border-dark rounded-xl p-6 flex flex-col gap-4">
                        <h3 className="text-white text-lg font-bold mb-2">Funil de Conversão</h3>
                        <div className="flex flex-col gap-4">
                            {[
                                { l: 'Impressões', v: '1.2M', w: '100%', c: 'bg-[#3713ec]' },
                                { l: 'Cliques (CTR 1.8%)', v: '21.6K', w: '60%', c: 'bg-[#3713ec]/80' },
                                { l: 'Checkout', v: '5.4K', w: '30%', c: 'bg-[#3713ec]/60' },
                                { l: 'Compras', v: '2.4K', w: '15%', c: 'bg-[#0bda6c]' }
                            ].map((step, i) => (
                                <div key={i} className="relative">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-text-secondary text-sm">{step.l}</span>
                                        <span className="text-white font-bold">{step.v}</span>
                                    </div>
                                    <div className="h-2 w-full bg-[#141122] rounded-full overflow-hidden">
                                        <div className={`h-full ${step.c} rounded-full`} style={{ width: step.w }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-auto pt-4 border-t border-border-dark">
                            <div className="flex justify-between items-center">
                                <span className="text-text-secondary text-sm">Taxa de Conversão Global</span>
                                <span className="text-[#0bda6c] text-xl font-bold">0.2%</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Detailed Table */}
                <section className="flex flex-col gap-4">
                    <h3 className="text-white text-xl font-bold">Detalhamento por Criativo</h3>
                    <div className="overflow-hidden rounded-xl border border-border-dark bg-[#1e1b2e]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-[#292348] text-text-secondary uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Criativo</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Investimento</th>
                                        <th className="px-6 py-4 text-right">ROAS</th>
                                        <th className="px-6 py-4 text-right">Compras</th>
                                        <th className="px-6 py-4 text-right">CPA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-dark">
                                    {[
                                        { n: 'Video_BlackFriday_Promo_01', t: 'Feed Instagram', s: 'Ativo', i: 'R$ 12.450,00', r: '5.2x', c: '840', cpa: 'R$ 14,80', sc: 'bg-[#0bda6c]' },
                                        { n: 'Img_Carrossel_Ofertas', t: 'Feed Facebook', s: 'Ativo', i: 'R$ 8.230,00', r: '3.8x', c: '410', cpa: 'R$ 20,05', sc: 'bg-[#0bda6c]' },
                                        { n: 'Reels_Depoimento_Cliente', t: 'Reels', s: 'Aprendizado', i: 'R$ 2.100,00', r: '2.1x', c: '85', cpa: 'R$ 24,70', sc: 'bg-yellow-500' }
                                    ].map((row, i) => (
                                        <tr key={i} className="hover:bg-[#292348]/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded bg-gradient-to-br ${i === 0 ? 'from-purple-500 to-indigo-600' : i === 1 ? 'from-pink-500 to-orange-400' : 'from-blue-400 to-cyan-300'} flex-shrink-0`}></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-medium">{row.n}</span>
                                                        <span className="text-xs text-text-secondary">{row.t}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${row.sc}/10 ${row.sc === 'bg-[#0bda6c]' ? 'text-[#0bda6c]' : 'text-yellow-500'} border ${row.sc}/20`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${row.sc === 'bg-[#0bda6c]' ? 'bg-[#0bda6c]' : 'bg-yellow-500'}`}></span>
                                                    {row.s}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-white">{row.i}</td>
                                            <td className="px-6 py-4 text-right font-bold text-[#0bda6c]">{row.r}</td>
                                            <td className="px-6 py-4 text-right text-white">{row.c}</td>
                                            <td className="px-6 py-4 text-right text-white">{row.cpa}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 border-t border-border-dark flex justify-between items-center bg-[#1e1b2e]">
                            <span className="text-xs text-text-secondary">Mostrando 3 de 12 criativos</span>
                            <button className="text-xs font-medium text-primary hover:text-white transition-colors">Ver todos</button>
                        </div>
                    </div>
                </section>

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
