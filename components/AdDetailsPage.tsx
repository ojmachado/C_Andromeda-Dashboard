
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppShell } from './Navigation';
import { Card, Button, Badge } from './UI';
import type { Workspace } from '../types';

export const AdDetailsPage = ({ workspaces }: { workspaces: Workspace[] }) => {
    const { workspaceId, adId } = useParams();
    const navigate = useNavigate();
    
    // Mock Data based on wireframe
    const adData = {
        name: "Anúncio #8492",
        status: "ACTIVE",
        creative: {
            accountName: "Andromeda Lab",
            text: "🚀 Otimize seus anúncios com IA. Pare de perder dinheiro em campanhas que não convertem.",
            headline: "Aumente seu ROAS hoje",
            domain: "ANDROMEDALAB.COM",
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwfWDPAF-iiiT-uGPdRIv8dL9GfvYFzFqpKv75Smbu4X3qd6iai5eE2rKW3UNSyGY0Oj5gxC6uoaQ8POD1ABlQTrCQvaKHBRPoM3TbqR8oJvbrZRSrbRw9V8SLMtQmb_xCn72IfXjjVsKYSlALj1Mdsmn6uT9YdEjFLhkHPP4EbmQ_itGKCMBuYKjyDgiyueluc3gDWXX1FsxraQECVlQYz7m1JjOFjqs5v859R7VQRD_OHbgE2SXVBg7_WLzZQqwLMN5Jhlzkr0A",
            likes: 42,
            comments: 5,
            shares: 2
        }
    };

    return (
        <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId}>
            <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6">
                <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
                    
                    {/* Header with Breadcrumbs and Date Picker */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border-dark pb-6">
                        <div className="flex items-center gap-2 text-sm w-full md:w-auto overflow-x-auto whitespace-nowrap">
                            <Link to={`/w/${workspaceId}/dashboard`} className="text-text-secondary hover:text-white transition-colors">Campanhas</Link>
                            <span className="text-text-secondary material-symbols-outlined text-[12px]">chevron_right</span>
                            <span className="text-text-secondary hover:text-white transition-colors cursor-pointer">Black Friday 2023</span>
                            <span className="text-text-secondary material-symbols-outlined text-[12px]">chevron_right</span>
                            <span className="text-slate-900 dark:text-white font-medium">{adData.name}</span>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button className="flex items-center gap-2 bg-white dark:bg-[#292348] hover:bg-gray-100 dark:hover:bg-[#342c5a] text-slate-700 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-transparent w-full md:w-auto justify-center">
                                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                <span>Oct 1, 2023 - Oct 31, 2023</span>
                                <span className="material-symbols-outlined text-[16px]">expand_more</span>
                            </button>
                        </div>
                    </div>

                    {/* Page Heading Action */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Detalhes do Anúncio</h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Ativo</span>
                        </div>
                        <button 
                            onClick={() => navigate(`/w/${workspaceId}/dashboard`)}
                            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-[#292348]"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            Voltar ao Dashboard
                        </button>
                    </div>

                    {/* Top Grid: Creative & KPIs */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        
                        {/* Col 1: Creative Preview */}
                        <div className="xl:col-span-1 flex flex-col gap-4">
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Criativo</h3>
                            <div className="bg-white dark:bg-[#1e1b2e] rounded-xl border border-gray-200 dark:border-[#292348] overflow-hidden shadow-sm">
                                <div className="p-3 flex items-center gap-3 border-b border-gray-100 dark:border-[#292348]/50">
                                    <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">AL</div>
                                    <div className="flex flex-col">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{adData.creative.accountName}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-text-secondary">Sponsored <span className="material-symbols-outlined text-[10px] align-middle">public</span></p>
                                    </div>
                                </div>
                                <div className="p-3 pb-1">
                                    <p className="text-sm text-slate-700 dark:text-gray-300 line-clamp-2">{adData.creative.text}</p>
                                </div>
                                <div className="w-full aspect-video bg-gray-800 relative mt-2">
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${adData.creative.image}")` }}></div>
                                </div>
                                <div className="bg-gray-50 dark:bg-[#25213a] p-3 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-text-secondary">{adData.creative.domain}</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{adData.creative.headline}</p>
                                    </div>
                                    <button className="bg-gray-200 dark:bg-[#383355] hover:bg-gray-300 dark:hover:bg-[#454066] text-slate-900 dark:text-white text-xs font-semibold py-1.5 px-3 rounded border border-gray-300 dark:border-transparent transition-colors">Saiba Mais</button>
                                </div>
                                <div className="p-3 flex items-center justify-between text-slate-500 dark:text-text-secondary border-t border-gray-100 dark:border-[#292348]/50">
                                    <div className="flex items-center gap-1 text-xs">
                                        <span className="material-symbols-outlined text-[14px]">thumb_up</span> {adData.creative.likes}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span>{adData.creative.comments} Comments</span>
                                        <span>{adData.creative.shares} Shares</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Col 2 & 3: KPI Grid & Charts */}
                        <div className="xl:col-span-2 flex flex-col gap-6">
                            
                            {/* KPI Cards */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Performance Geral</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <KpiDetailCard label="Valor Gasto" value="R$ 1.240" icon="payments" trend="up" trendValue="+12%" />
                                    <KpiDetailCard label="Impressões" value="15.4k" icon="visibility" trend="up" trendValue="+5%" trendColor="text-emerald-500" />
                                    <KpiDetailCard label="Cliques" value="842" icon="ads_click" trend="up" trendValue="+8%" trendColor="text-emerald-500" />
                                    <KpiDetailCard label="CTR" value="2.45%" icon="percent" trend="neutral" trendValue="0%" />
                                </div>
                            </div>

                            {/* Conversion KPIs */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Conversão</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white dark:bg-[#1e1b2e] p-4 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 group-hover:bg-primary/20 transition-colors"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="text-xs font-medium text-primary dark:text-primary/80">Leads</p>
                                                <span className="material-symbols-outlined text-primary/60 text-[18px]">group_add</span>
                                            </div>
                                            <p className="text-xl font-bold text-slate-900 dark:text-white">45</p>
                                            <p className="text-[10px] mt-2 text-slate-500 dark:text-text-secondary">Custo: R$ 27,55</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white dark:bg-[#1e1b2e] p-4 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Compras</p>
                                                <span className="material-symbols-outlined text-emerald-500/60 text-[18px]">shopping_cart</span>
                                            </div>
                                            <p className="text-xl font-bold text-slate-900 dark:text-white">12</p>
                                            <p className="text-[10px] mt-2 text-slate-500 dark:text-text-secondary">Custo: R$ 103,33</p>
                                        </div>
                                    </div>

                                    <KpiDetailCard label="Taxa Conv." value="5.34%" icon="show_chart" trend="up" trendValue="+1.2%" trendColor="text-emerald-500" />
                                    <KpiDetailCard label="ROAS" value="3.8x" icon="monetization_on" trend="down" trendValue="-0.2" trendColor="text-red-500" />
                                </div>
                            </div>

                            {/* Main Chart */}
                            <div className="bg-white dark:bg-[#1e1b2e] p-6 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm flex flex-col flex-1 min-h-[300px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Evolução de Conversões</h3>
                                    <div className="flex bg-gray-100 dark:bg-[#292348] rounded-lg p-1 gap-1">
                                        <button className="px-3 py-1 text-xs font-medium rounded bg-white dark:bg-[#383355] text-slate-900 dark:text-white shadow-sm">Leads</button>
                                        <button className="px-3 py-1 text-xs font-medium rounded hover:bg-gray-200 dark:hover:bg-[#383355] text-slate-500 dark:text-text-secondary transition-colors">Compras</button>
                                        <button className="px-3 py-1 text-xs font-medium rounded hover:bg-gray-200 dark:hover:bg-[#383355] text-slate-500 dark:text-text-secondary transition-colors">Custo</button>
                                    </div>
                                </div>
                                {/* Pure CSS/SVG Chart */}
                                <div className="relative w-full h-full flex items-end justify-between px-2 gap-2 mt-4">
                                    {/* Grid lines background */}
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                                        <div className="w-full border-t border-slate-500"></div>
                                        <div className="w-full border-t border-slate-500"></div>
                                        <div className="w-full border-t border-slate-500"></div>
                                        <div className="w-full border-t border-slate-500"></div>
                                        <div className="w-full border-t border-slate-500"></div>
                                    </div>
                                    {/* SVG Path for Smooth Line */}
                                    <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
                                        <defs>
                                            <linearGradient id="gradientDetails" x1="0%" x2="0%" y1="0%" y2="100%">
                                                <stop offset="0%" stopColor="#3713ec" stopOpacity="0.5"></stop>
                                                <stop offset="100%" stopColor="#3713ec" stopOpacity="0"></stop>
                                            </linearGradient>
                                        </defs>
                                        <path className="opacity-50" d="M0,200 C40,180 80,210 120,150 C160,90 200,120 240,100 C280,80 320,130 360,110 C400,90 440,60 480,80 C520,100 560,120 600,90 C640,60 680,30 720,50 C760,70 800,40 840,60 C880,80 920,50 960,30 C1000,10 1040,40 1080,20 L1080,300 L0,300 Z" fill="url(#gradientDetails)" stroke="none"></path>
                                        <path d="M0,200 C40,180 80,210 120,150 C160,90 200,120 240,100 C280,80 320,130 360,110 C400,90 440,60 480,80 C520,100 560,120 600,90 C640,60 680,30 720,50 C760,70 800,40 840,60 C880,80 920,50 960,30 C1000,10 1040,40 1080,20" fill="none" stroke="#3713ec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" vectorEffect="non-scaling-stroke"></path>
                                        {/* Data Points */}
                                        <circle cx="12%" cy="50%" fill="#3713ec" r="4" stroke="#131022" strokeWidth="2"></circle>
                                        <circle cx="28%" cy="30%" fill="#3713ec" r="4" stroke="#131022" strokeWidth="2"></circle>
                                        <circle cx="45%" cy="25%" fill="#3713ec" r="4" stroke="#131022" strokeWidth="2"></circle>
                                        <circle cx="62%" cy="35%" fill="#3713ec" r="4" stroke="#131022" strokeWidth="2"></circle>
                                        <circle cx="80%" cy="15%" fill="#3713ec" r="4" stroke="#131022" strokeWidth="2"></circle>
                                    </svg>
                                    </div>
                                    <div className="flex justify-between w-full mt-2 text-[10px] text-slate-500 dark:text-text-secondary">
                                        <span>01 Oct</span>
                                        <span>05 Oct</span>
                                        <span>10 Oct</span>
                                        <span>15 Oct</span>
                                        <span>20 Oct</span>
                                        <span>25 Oct</span>
                                        <span>30 Oct</span>
                                    </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Detailed Table */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Últimos Eventos de Conversão</h3>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[18px]">search</span>
                                    <input className="pl-9 pr-3 py-1.5 bg-white dark:bg-[#1e1b2e] border border-gray-200 dark:border-[#292348] rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-primary" placeholder="Filtrar por origem..." type="text"/>
                                </div>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1e1b2e] border border-gray-200 dark:border-[#292348] rounded-lg text-sm font-medium text-slate-700 dark:text-text-secondary hover:text-white hover:bg-[#292348] transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                                    Filtros
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1e1b2e] border border-gray-200 dark:border-[#292348] rounded-lg text-sm font-medium text-slate-700 dark:text-text-secondary hover:text-white hover:bg-[#292348] transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                    Exportar
                                </button>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1e1b2e] rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-[#292348] bg-gray-50 dark:bg-[#25213a]">
                                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Timestamp</th>
                                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Tipo de Evento</th>
                                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Valor</th>
                                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Origem</th>
                                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Status</th>
                                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-[#292348]">
                                        <tr className="group hover:bg-gray-50 dark:hover:bg-[#25213a] transition-colors">
                                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">Oct 24, 14:32</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="size-2 rounded-full bg-emerald-500"></span>
                                                    <span className="text-sm text-slate-700 dark:text-gray-200">Compra (Purchase)</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">R$ 199,90</td>
                                            <td className="p-4 text-sm text-slate-500 dark:text-text-secondary">Website</td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500">Processado</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="text-slate-400 hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="group hover:bg-gray-50 dark:hover:bg-[#25213a] transition-colors">
                                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">Oct 24, 14:15</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="size-2 rounded-full bg-primary"></span>
                                                    <span className="text-sm text-slate-700 dark:text-gray-200">Lead</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">--</td>
                                            <td className="p-4 text-sm text-slate-500 dark:text-text-secondary">Landing Page B</td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500">Novo</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="text-slate-400 hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="group hover:bg-gray-50 dark:hover:bg-[#25213a] transition-colors">
                                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">Oct 24, 13:45</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="size-2 rounded-full bg-yellow-500"></span>
                                                    <span className="text-sm text-slate-700 dark:text-gray-200">Initiate Checkout</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">R$ 199,90</td>
                                            <td className="p-4 text-sm text-slate-500 dark:text-text-secondary">Website</td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-500">Pendente</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="text-slate-400 hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="group hover:bg-gray-50 dark:hover:bg-[#25213a] transition-colors">
                                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">Oct 24, 12:10</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="size-2 rounded-full bg-primary"></span>
                                                    <span className="text-sm text-slate-700 dark:text-gray-200">Lead</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">--</td>
                                            <td className="p-4 text-sm text-slate-500 dark:text-text-secondary">Formulário Nativo</td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500">Novo</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="text-slate-400 hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="group hover:bg-gray-50 dark:hover:bg-[#25213a] transition-colors">
                                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">Oct 24, 11:30</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="size-2 rounded-full bg-purple-500"></span>
                                                    <span className="text-sm text-slate-700 dark:text-gray-200">View Content</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">--</td>
                                            <td className="p-4 text-sm text-slate-500 dark:text-text-secondary">Blog Post</td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-slate-700 dark:bg-gray-700/30 dark:text-gray-400">Rastreado</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="text-slate-400 hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t border-gray-100 dark:border-[#292348] flex items-center justify-between">
                                <p className="text-xs text-slate-500 dark:text-text-secondary">Mostrando 1-5 de 45 eventos</p>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 rounded text-xs font-medium border border-gray-200 dark:border-[#292348] text-slate-500 dark:text-text-secondary opacity-50 cursor-not-allowed">Anterior</button>
                                    <button className="px-3 py-1 rounded text-xs font-medium border border-gray-200 dark:border-[#292348] text-slate-500 dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-[#292348] transition-colors">Próximo</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};

const KpiDetailCard = ({ label, value, icon, trend, trendValue, trendColor }: any) => {
    return (
        <div className="bg-white dark:bg-[#1e1b2e] p-4 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm">
            <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-slate-500 dark:text-text-secondary">{label}</p>
                <span className="material-symbols-outlined text-gray-400 text-[18px]">{icon}</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
            <div className={`flex items-center gap-1 mt-2 text-xs ${trendColor || 'text-slate-500 dark:text-gray-400'}`}>
                <span className="material-symbols-outlined text-[14px]">{trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'remove'}</span>
                <span>{trendValue}</span>
            </div>
        </div>
    );
};
