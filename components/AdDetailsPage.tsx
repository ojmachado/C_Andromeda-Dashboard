
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppShell } from './Navigation';
import { Card, Button, Badge, Skeleton } from './UI';
import { SecureKV } from '../utils/kv';
import type { Workspace, AdCreativeData, APIGeneralInsights, DateRangePreset } from '../types';

export const AdDetailsPage = ({ workspaces }: { workspaces: Workspace[] }) => {
    const { workspaceId, adId } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter State
    const [dateRange, setDateRange] = useState<DateRangePreset>('last_30d');
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const dateDropdownRef = useRef<HTMLDivElement>(null);

    // Data States
    const [adMeta, setAdMeta] = useState<any>(null);
    const [creative, setCreative] = useState<AdCreativeData | null>(null);
    const [insights, setInsights] = useState<APIGeneralInsights | null>(null);
    const [trendData, setTrendData] = useState<{ date: string, value: number, rawDate: string }[]>([]);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
                setIsDateDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            if (!adId || !workspaceId) return;

            setIsLoading(true);
            const token = await SecureKV.getWorkspaceToken(workspaceId);

            if (!token || !window.FB) {
                setError("SDK not ready or Token missing");
                setIsLoading(false);
                return;
            }

            const apiParams = { access_token: token };
            const timeParams: any = { date_preset: dateRange };
            if (dateRange === 'maximum') delete timeParams.date_preset; // Fallback to default if max
            if (dateRange === 'custom') { /* Handle custom date logic if needed */ }

            try {
                // 1. Fetch Ad Metadata & Creative ID
                const adPromise = new Promise<any>((resolve) => {
                    window.FB.api(`/${adId}`, {
                        fields: 'name,status,creative',
                        ...apiParams
                    }, resolve);
                });

                // 2. Fetch Insights (Overall)
                const insightsPromise = new Promise<any>((resolve) => {
                    window.FB.api(`/${adId}/insights`, {
                        fields: 'spend,impressions,clicks,ctr,cpc,cpm,actions,action_values,purchase_roas,date_start,date_stop',
                        ...apiParams
                        // Note: date_preset passed via spread timeParams
                    }, (res: any) => {
                         // FB API quirk: sometimes passing date_preset in main object works better for insights
                         if(!res || res.error) {
                             // Retry logic or error handling could go here
                             resolve(res);
                         } else {
                             resolve(res);
                         }
                    });
                });
                
                // Note: For trend, we need a separate call if we want breakdown by day
                // However, the standard `insights` endpoint supports `time_increment=1`
                const trendPromise = new Promise<any>((resolve) => {
                     window.FB.api(`/${adId}/insights`, {
                        fields: 'spend,date_start',
                        time_increment: 1,
                        ...apiParams,
                        ...timeParams
                    }, resolve);
                });

                // Trigger calls
                // Actual execution:
                const [adRes, insightsRes, trendRes] = await Promise.all([
                    adPromise,
                    new Promise<any>((resolve) => window.FB.api(`/${adId}/insights`, {
                        fields: 'spend,impressions,clicks,ctr,cpc,cpm,actions,action_values,purchase_roas,date_start,date_stop',
                        ...apiParams,
                        ...timeParams
                    }, resolve)),
                    trendPromise
                ]);

                // Process Ad & Creative
                if (adRes && !adRes.error) {
                    setAdMeta(adRes);
                    if (adRes.creative?.id) {
                        // Fetch Creative Details with extended fields for robustness
                        window.FB.api(`/${adRes.creative.id}`, {
                            fields: 'name,title,body,image_url,thumbnail_url,object_story_spec,asset_feed_spec,call_to_action_type',
                            ...apiParams
                        }, (creRes: any) => {
                            if (!creRes.error) setCreative(creRes);
                        });
                    }
                }

                // Process Insights
                if (insightsRes && insightsRes.data && insightsRes.data.length > 0) {
                    setInsights(insightsRes.data[0]);
                } else {
                    setInsights(null); // Reset if no data for period
                }

                // Process Trend
                if (trendRes && trendRes.data) {
                    const rawData = [...trendRes.data];
                    
                    // Sort properly by ISO date string first to ensure chronological order
                    rawData.sort((a: any, b: any) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

                    const trend = rawData.map((d: any) => ({
                        date: new Date(d.date_start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                        value: parseFloat(d.spend || '0'),
                        rawDate: d.date_start
                    }));
                    
                    setTrendData(trend);
                } else {
                    setTrendData([]);
                }

            } catch (err) {
                console.error(err);
                setError("Erro ao carregar dados do anúncio.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [workspaceId, adId, dateRange]);

    // --- Data Parsing Helpers ---

    // Safely extract nested properties
    const get = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

    // Robust Creative Data Extraction
    const creativeInfo = useMemo(() => {
        if (!creative) return { title: '', body: '', image: '', domain: '' };

        const spec = creative.object_story_spec;
        const assetFeed = creative.asset_feed_spec; // Dynamic Ads

        // Helper to extract deeply nested properties safely
        const extract = (root: any, path: string) => get(root, path);

        // 1. Try Object Story Spec (Standard Ads) first as it contains the actual post content
        let title = extract(spec, 'link_data.name') || extract(spec, 'video_data.title');
        let body = extract(spec, 'link_data.message') || extract(spec, 'video_data.message');
        let image = 
            extract(spec, 'link_data.picture') || 
            extract(spec, 'video_data.image_url') || 
            extract(spec, 'photo_data.picture');

        // 2. Try Asset Feed (Dynamic Ads)
        if (assetFeed) {
             const firstTitle = extract(assetFeed, 'titles.0.text');
             const firstBody = extract(assetFeed, 'bodies.0.text'); // Primary Text
             const firstImage = extract(assetFeed, 'images.0.url') || extract(assetFeed, 'videos.0.thumbnail_url');
             
             if (!title) title = firstTitle;
             if (!body) body = firstBody;
             if (!image) image = firstImage;
        }

        // 3. Fallback to top-level fields (often metadata or legacy)
        if (!title) title = creative.title || '';
        if (!body) body = creative.body || '';
        if (!image) image = creative.image_url || creative.thumbnail_url || '';

        // Domain extraction
        let domain = 'LINK';
        const link = extract(spec, 'link_data.link') || extract(assetFeed, 'link_urls.0.website_url');
        if (link) {
            try { domain = new URL(link).hostname.replace('www.', '').toUpperCase(); } catch {}
        }

        return { title, body, image, domain };
    }, [creative]);

    // Metrics Calculation
    const spend = parseFloat(insights?.spend || '0');
    const impressions = parseInt(insights?.impressions || '0');
    const clicks = parseInt(insights?.clicks || '0');
    const ctr = parseFloat(insights?.ctr || '0');
    const roas = parseFloat(insights?.purchase_roas?.[0]?.value || '0');

    // Action Parsing (Leads, Purchases)
    const getActionCount = (type: string) => {
        const action = insights?.actions?.find((a: any) => a.action_type === type);
        return action ? parseInt(action.value) : 0;
    };
    
    // Fallback for Purchases (can be pixel purchase or offsite_conversion)
    const purchases = getActionCount('purchase') || getActionCount('offsite_conversion.fb_pixel_purchase');
    const leads = getActionCount('lead') || getActionCount('on_facebook_lead');
    // Enhanced Messaging check for various attributions
    const messages = 
        getActionCount('onsite_conversion.messaging_conversation_started_7d') || 
        getActionCount('messaging_conversation_started_7d');
    
    // Cost per Action
    const cpa = purchases > 0 ? spend / purchases : 0;
    const cpl = leads > 0 ? spend / leads : 0;
    const costPerMessage = messages > 0 ? spend / messages : 0;

    // Generate Smooth Chart Path (Bezier)
    const getSmoothPath = (width: number, height: number) => {
        if (trendData.length < 2) return "";
        
        const maxVal = Math.max(...trendData.map(d => d.value), 1);
        // Map points to SVG coordinates
        const points = trendData.map((d, i) => {
            const x = (i / (trendData.length - 1)) * width;
            const y = height - (d.value / maxVal) * height; // SVG Y is top-down
            return [x, y];
        });

        // Generate Path Command
        let d = `M ${points[0][0]},${points[0][1]}`;

        for (let i = 0; i < points.length - 1; i++) {
            const [x0, y0] = points[i];
            const [x1, y1] = points[i + 1];
            
            // Control points for smooth bezier (x-midpoint logic)
            const cp1x = x0 + (x1 - x0) * 0.5;
            const cp1y = y0;
            const cp2x = x1 - (x1 - x0) * 0.5;
            const cp2y = y1;

            d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`;
        }
        return d;
    };

    const dateLabels: Record<string, string> = {
        'last_7d': 'Últimos 7 dias',
        'last_30d': 'Últimos 30 dias',
        'this_month': 'Este Mês',
        'last_month': 'Mês Passado',
        'lifetime': 'Vitalício',
        'maximum': 'Máximo'
    };

    if (isLoading && !creative) { // Only show skeleton on initial load if no data
        return (
            <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId}>
                <div className="p-6 max-w-[1400px] mx-auto space-y-6">
                    <div className="flex justify-between">
                         <Skeleton className="h-10 w-64" />
                         <Skeleton className="h-10 w-32" />
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                         <Skeleton className="h-96 col-span-1" />
                         <Skeleton className="h-96 col-span-2" />
                    </div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId}>
            <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6">
                <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
                    
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border-dark pb-6">
                        <div className="flex items-center gap-2 text-sm w-full md:w-auto overflow-x-auto whitespace-nowrap">
                            <Link to={`/w/${workspaceId}/dashboard`} className="text-text-secondary hover:text-white transition-colors">Dashboard</Link>
                            <span className="text-text-secondary material-symbols-outlined text-[12px]">chevron_right</span>
                            <span className="text-slate-900 dark:text-white font-medium">{adMeta?.name || 'Anúncio'}</span>
                        </div>
                        
                        {/* Date Filter */}
                        <div className="relative" ref={dateDropdownRef}>
                            <button 
                                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                                className="flex items-center gap-2 bg-white dark:bg-[#292348] hover:bg-gray-100 dark:hover:bg-[#342c5a] text-slate-700 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-transparent w-full md:w-auto justify-center shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                <span>{dateLabels[dateRange] || dateRange}</span>
                                <span className="material-symbols-outlined text-[18px]">expand_more</span>
                            </button>
                            
                            {isDateDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-card-dark border border-border-dark rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                    {Object.entries(dateLabels).map(([key, label]) => (
                                        <button 
                                            key={key}
                                            onClick={() => { setDateRange(key as DateRangePreset); setIsDateDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors ${dateRange === key ? 'text-primary font-bold bg-white/5' : 'text-text-secondary'}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Page Heading Action */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Performance do Anúncio</h2>
                            {adMeta?.status && (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${adMeta.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                    {adMeta.status}
                                </span>
                            )}
                        </div>
                        <button 
                            onClick={() => navigate(`/w/${workspaceId}/dashboard`)}
                            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-[#292348]"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            Voltar
                        </button>
                    </div>

                    {/* Top Grid: Creative & KPIs */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        
                        {/* Col 1: Creative Preview */}
                        <div className="xl:col-span-1 flex flex-col gap-4">
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Criativo</h3>
                            <div className="bg-white dark:bg-[#1e1b2e] rounded-xl border border-gray-200 dark:border-[#292348] overflow-hidden shadow-sm flex flex-col">
                                <div className="p-3 flex items-center gap-3 border-b border-gray-100 dark:border-[#292348]/50 bg-gray-50 dark:bg-[#25213a]">
                                    <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                                        {creative?.name?.substring(0,2).toUpperCase() || 'AD'}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{creative?.name || 'Ad Name'}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-text-secondary">Patrocinado • <span className="material-symbols-outlined text-[10px] align-middle">public</span></p>
                                    </div>
                                </div>
                                <div className="p-4 pb-2">
                                    <p className="text-sm text-slate-700 dark:text-gray-300 line-clamp-6 whitespace-pre-wrap leading-relaxed break-words">
                                        {creativeInfo.body || <span className="text-text-secondary italic">Texto não disponível</span>}
                                    </p>
                                </div>
                                
                                {/* Image Container - Aspect Ratio Fix */}
                                <div className="w-full relative mt-2 bg-gray-100 dark:bg-black/20 border-y border-gray-100 dark:border-[#292348]/50 min-h-[200px] flex items-center justify-center">
                                    {creativeInfo.image ? (
                                        <img 
                                            src={creativeInfo.image} 
                                            alt="Ad Creative" 
                                            className="w-full h-auto max-h-[600px] object-contain"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-text-secondary py-12">
                                            <span className="material-symbols-outlined text-4xl mb-2">image_not_supported</span>
                                            <span className="text-xs">Preview indisponível</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-100 dark:bg-[#25213a] p-3 flex justify-between items-center">
                                    <div className="overflow-hidden mr-2 flex-1">
                                        <p className="text-[10px] font-semibold text-slate-500 dark:text-text-secondary truncate uppercase tracking-wider mb-0.5">{creativeInfo.domain}</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">{creativeInfo.title || 'Headline'}</p>
                                    </div>
                                    <button className="shrink-0 bg-gray-300 dark:bg-[#383355] hover:bg-gray-400 dark:hover:bg-[#454066] text-slate-900 dark:text-white text-[10px] font-bold py-2 px-3 rounded border border-gray-300 dark:border-transparent transition-colors uppercase whitespace-nowrap">
                                        {creative?.call_to_action_type?.replace(/_/g, ' ') || 'Saiba Mais'}
                                    </button>
                                </div>
                                <div className="p-3 flex items-center justify-between text-slate-500 dark:text-text-secondary border-t border-gray-200 dark:border-[#292348]/50 text-[10px] font-mono">
                                     <span>ID: {adId}</span>
                                </div>
                            </div>
                        </div>

                        {/* Col 2 & 3: KPI Grid & Charts */}
                        <div className="xl:col-span-2 flex flex-col gap-6">
                            
                            {/* KPI Cards */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Métricas Principais</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <KpiDetailCard label="Valor Gasto" value={spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon="payments" trend="up" />
                                    <KpiDetailCard label="Impressões" value={impressions.toLocaleString()} icon="visibility" trend="neutral" />
                                    <KpiDetailCard label="Cliques" value={clicks.toLocaleString()} icon="ads_click" trend="neutral" />
                                    <KpiDetailCard label="CTR" value={`${ctr.toFixed(2)}%`} icon="percent" trend="neutral" />
                                </div>
                            </div>

                            {/* Conversion KPIs */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Conversão e Retorno</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    
                                    {/* Lead Card */}
                                    <div className="bg-white dark:bg-[#1e1b2e] p-4 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 group-hover:bg-primary/20 transition-colors"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="text-xs font-medium text-primary dark:text-primary/80">Leads</p>
                                                <span className="material-symbols-outlined text-primary/60 text-[18px]">group_add</span>
                                            </div>
                                            <p className="text-xl font-bold text-slate-900 dark:text-white">{leads}</p>
                                            <p className="text-[10px] mt-2 text-slate-500 dark:text-text-secondary font-mono">
                                                CPL: {cpl > 0 ? cpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Purchase Card */}
                                    <div className="bg-white dark:bg-[#1e1b2e] p-4 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Compras</p>
                                                <span className="material-symbols-outlined text-emerald-500/60 text-[18px]">shopping_cart</span>
                                            </div>
                                            <p className="text-xl font-bold text-slate-900 dark:text-white">{purchases}</p>
                                            <p className="text-[10px] mt-2 text-slate-500 dark:text-text-secondary font-mono">
                                                CPA: {cpa > 0 ? cpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Messages Card */}
                                    <div className="bg-white dark:bg-[#1e1b2e] p-4 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-sky-500/5 dark:bg-sky-500/10 group-hover:bg-sky-500/20 transition-colors"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="text-xs font-medium text-sky-600 dark:text-sky-400">Msgs Iniciadas</p>
                                                <span className="material-symbols-outlined text-sky-500/60 text-[18px]">chat</span>
                                            </div>
                                            <p className="text-xl font-bold text-slate-900 dark:text-white">{messages}</p>
                                            <p className="text-[10px] mt-2 text-slate-500 dark:text-text-secondary font-mono">
                                                Custo: {costPerMessage > 0 ? costPerMessage.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <KpiDetailCard label="CPC" value={parseFloat(insights?.cpc || '0').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon="show_chart" />
                                    <KpiDetailCard label="ROAS" value={`${roas.toFixed(2)}x`} icon="monetization_on" trend={roas > 2 ? 'up' : 'down'} trendColor={roas > 2 ? 'text-emerald-500' : 'text-red-500'} />
                                </div>
                            </div>

                            {/* Main Chart */}
                            <div className="bg-white dark:bg-[#1e1b2e] p-6 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm flex flex-col flex-1 min-h-[300px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Evolução de Investimento Diário</h3>
                                    {isLoading && <span className="text-xs text-text-secondary animate-pulse">Atualizando...</span>}
                                </div>
                                {/* Pure CSS/SVG Chart */}
                                <div className="relative w-full h-full flex items-end justify-between px-2 gap-2 mt-4 min-h-[200px]">
                                    {/* Grid lines background */}
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                                        <div className="w-full border-t border-slate-500"></div>
                                        <div className="w-full border-t border-slate-500"></div>
                                        <div className="w-full border-t border-slate-500"></div>
                                        <div className="w-full border-t border-slate-500"></div>
                                        <div className="w-full border-t border-slate-500"></div>
                                    </div>
                                    {/* SVG Path for Smooth Line */}
                                    {trendData.length > 0 ? (
                                        <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 300">
                                            <defs>
                                                <linearGradient id="gradientDetails" x1="0%" x2="0%" y1="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#3713ec" stopOpacity="0.4"></stop>
                                                    <stop offset="100%" stopColor="#3713ec" stopOpacity="0"></stop>
                                                </linearGradient>
                                            </defs>
                                            {/* Fill Area */}
                                            <path 
                                                d={`${getSmoothPath(1000, 300)} L 1000,300 L 0,300 Z`} 
                                                fill="url(#gradientDetails)" 
                                                stroke="none"
                                            />
                                            {/* Stroke Line */}
                                            <path 
                                                d={getSmoothPath(1000, 300)} 
                                                fill="none" 
                                                stroke="#3713ec" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth="3" 
                                                vectorEffect="non-scaling-stroke"
                                            />
                                            {/* Data Points on Hover (optional, kept simple for now) */}
                                        </svg>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-text-secondary text-sm border border-dashed border-slate-700 rounded-lg">
                                            {isLoading ? "Carregando..." : "Sem dados de tendência suficientes para este período."}
                                        </div>
                                    )}
                                </div>
                                {/* X Axis Labels (Simplified) */}
                                {trendData.length > 0 && (
                                    <div className="flex justify-between w-full mt-4 text-[10px] font-mono text-slate-500 dark:text-text-secondary uppercase tracking-widest">
                                        <span>{trendData[0]?.date}</span>
                                        <span>{trendData[Math.floor(trendData.length / 2)]?.date}</span>
                                        <span>{trendData[trendData.length - 1]?.date}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Actions Table */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Detalhamento de Conversões</h3>
                        </div>
                        <div className="bg-white dark:bg-[#1e1b2e] rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-[#292348] bg-gray-50 dark:bg-[#25213a]">
                                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Tipo de Evento</th>
                                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Qtd. Total</th>
                                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Valor Estimado</th>
                                            <th className="p-4 text-xs font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider text-right">Custo Médio (CPA)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-[#292348]">
                                        {insights?.actions?.map((action, idx) => {
                                            const count = parseInt(action.value);
                                            const valueObj = insights.action_values?.find(v => v.action_type === action.action_type);
                                            const totalValue = valueObj ? parseFloat(valueObj.value) : 0;
                                            const costPer = count > 0 ? spend / count : 0;
                                            
                                            // Icon mapping
                                            let colorClass = 'bg-slate-500';
                                            
                                            if (action.action_type.includes('purchase')) { colorClass = 'bg-emerald-500'; }
                                            else if (action.action_type.includes('lead')) { colorClass = 'bg-primary'; }
                                            else if (action.action_type.includes('click')) { colorClass = 'bg-blue-400'; }
                                            else if (action.action_type.includes('view')) { colorClass = 'bg-purple-500'; }
                                            else if (action.action_type.includes('messaging') || action.action_type.includes('conversation')) { colorClass = 'bg-sky-500'; }

                                            return (
                                                <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-[#25213a] transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`size-2 rounded-full ${colorClass} shadow-[0_0_8px_currentColor] opacity-80`}></span>
                                                            <span className="text-sm font-medium text-slate-700 dark:text-gray-200 capitalize">
                                                                {action.action_type.replace(/_/g, ' ').replace('offsite conversion', '').replace('fb pixel', '')}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{count.toLocaleString()}</td>
                                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300 font-mono">
                                                        {totalValue > 0 ? totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
                                                    </td>
                                                    <td className="p-4 text-right text-sm font-mono text-slate-600 dark:text-slate-300">
                                                        {costPer > 0 ? costPer.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {(!insights?.actions || insights.actions.length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-text-secondary text-sm">
                                                    Nenhum evento de conversão registrado neste período.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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
        <div className="bg-white dark:bg-[#1e1b2e] p-5 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm hover:border-primary/30 transition-colors group">
            <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-bold text-slate-400 dark:text-text-secondary uppercase tracking-widest">{label}</p>
                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[20px] group-hover:text-primary transition-colors">{icon}</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
            {trend && (
                <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trendColor || 'text-slate-500 dark:text-gray-400'}`}>
                    <span className="material-symbols-outlined text-[16px]">{trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'remove'}</span>
                    <span>{trendValue || ''}</span>
                </div>
            )}
        </div>
    );
};
