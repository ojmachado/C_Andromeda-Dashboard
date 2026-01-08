
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppShell } from './Navigation';
import { Card, Button, Badge, Skeleton, Modal } from './UI';
import { SecureKV } from '../utils/kv';
import type { Workspace, AdCreativeData, APIGeneralInsights, DateRangePreset } from '../types';

export const AdDetailsPage = ({ workspaces, sdkReady, isLoading }: { workspaces: Workspace[], sdkReady: boolean, isLoading?: boolean }) => {
    const { workspaceId, adId } = useParams();
    const navigate = useNavigate();
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter State
    const [dateRange, setDateRange] = useState<DateRangePreset>('last_30d');
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const dateDropdownRef = useRef<HTMLDivElement>(null);
    
    // Custom Date State
    const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    const [tempCustomDates, setTempCustomDates] = useState({ start: '', end: '' });

    // Chart State
    const [chartMetric, setChartMetric] = useState<'spend' | 'leads' | 'purchases'>('spend');

    // Data States
    const [adMeta, setAdMeta] = useState<any>(null);
    const [creative, setCreative] = useState<AdCreativeData | null>(null);
    const [insights, setInsights] = useState<APIGeneralInsights | null>(null);
    const [trendData, setTrendData] = useState<{ date: string, spend: number, leads: number, purchases: number, rawDate: string }[]>([]);

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
            
            // Wait for SDK
            if (!sdkReady || !window.FB) {
                return;
            }

            setIsDataLoading(true);
            const token = await SecureKV.getWorkspaceToken(workspaceId);

            if (!token) {
                setError("Token de acesso não encontrado. Reconecte o workspace.");
                setIsDataLoading(false);
                return;
            }

            const apiParams = { access_token: token };
            let timeParams: any = {};
            
            if (dateRange === 'custom') {
                if (customDates.start && customDates.end) {
                    timeParams.time_range = JSON.stringify({ since: customDates.start, until: customDates.end });
                } else {
                    timeParams.date_preset = 'last_30d'; 
                }
            } else if (dateRange !== 'maximum') {
                timeParams.date_preset = dateRange;
            }

            try {
                // 1. Fetch Ad Metadata
                const adPromise = new Promise<any>((resolve) => {
                    window.FB.api(`/${adId}`, {
                        fields: 'name,status,objective,preview_shareable_link,effective_object_story_id,creative{id,thumbnail_url,image_url,title,body,call_to_action_type,instagram_permalink_url}',
                        ...apiParams
                    }, resolve);
                });

                // 2. Fetch Insights
                const insightsPromise = new Promise<any>((resolve) => {
                    window.FB.api(`/${adId}/insights`, {
                        fields: 'spend,impressions,clicks,ctr,cpc,cpm,actions,action_values,purchase_roas,cost_per_action_type,date_start,date_stop',
                        ...apiParams,
                        ...timeParams
                    }, (res: any) => resolve(res));
                });
                
                // 3. Trend Data
                const trendPromise = new Promise<any>((resolve) => {
                     window.FB.api(`/${adId}/insights`, {
                        fields: 'spend,actions,date_start',
                        time_increment: 1,
                        ...apiParams,
                        ...timeParams
                    }, resolve);
                });

                const [adRes, insightsRes, trendRes] = await Promise.all([
                    adPromise,
                    insightsPromise,
                    trendPromise
                ]);

                if (adRes && !adRes.error) {
                    setAdMeta(adRes);
                    if (adRes.creative?.id) {
                        window.FB.api(`/${adRes.creative.id}`, {
                            fields: 'name,title,body,image_url,thumbnail_url,object_story_spec,asset_feed_spec,call_to_action_type,video_id,instagram_permalink_url',
                            ...apiParams
                        }, (creRes: any) => {
                            if (!creRes.error) {
                                setCreative(creRes);
                            }
                        });
                    }
                }

                if (insightsRes && insightsRes.data && insightsRes.data.length > 0) {
                    setInsights(insightsRes.data[0]);
                } else {
                    setInsights(null);
                }

                if (trendRes && trendRes.data) {
                    const rawData = [...trendRes.data];
                    rawData.sort((a: any, b: any) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime());

                    const trend = rawData.map((d: any) => {
                        const leadsVal = d.actions?.find((a: any) => a.action_type === 'lead' || a.action_type === 'on_facebook_lead')?.value;
                        const purchasesVal = d.actions?.find((a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value;
                        
                        return {
                            date: new Date(d.date_start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                            spend: parseFloat(d.spend || '0'),
                            leads: leadsVal ? parseInt(leadsVal) : 0,
                            purchases: purchasesVal ? parseInt(purchasesVal) : 0,
                            rawDate: d.date_start
                        };
                    });
                    setTrendData(trend);
                } else {
                    setTrendData([]);
                }

            } catch (err) {
                console.error(err);
                setError("Erro ao carregar dados do anúncio.");
            } finally {
                setIsDataLoading(false);
            }
        };

        loadData();
    }, [workspaceId, adId, dateRange, customDates, sdkReady]);

    // --- Data Parsing Helpers ---
    const get = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

    const creativeInfo = useMemo(() => {
        let title = '';
        let body = '';
        let image = '';
        let domain = 'LINK';
        let type = 'IMAGE';
        let cta = 'SAIBA MAIS';

        if (adMeta?.creative) {
            if (adMeta.creative.thumbnail_url) image = adMeta.creative.thumbnail_url;
            else if (adMeta.creative.image_url) image = adMeta.creative.image_url;
            if (adMeta.creative.title) title = adMeta.creative.title;
            if (adMeta.creative.body) body = adMeta.creative.body;
            if (adMeta.creative.call_to_action_type) cta = adMeta.creative.call_to_action_type.replace(/_/g, ' ');
        }

        if (creative) {
            const spec = creative.object_story_spec;
            const assetFeed = creative.asset_feed_spec;
            const extract = (root: any, path: string) => get(root, path);

            if (extract(spec, 'video_data') || (assetFeed && extract(assetFeed, 'videos.0'))) type = 'VIDEO';
            else if (extract(spec, 'link_data.child_attachments')) type = 'CAROUSEL';

            if (!title) {
                title = extract(spec, 'link_data.name') || extract(spec, 'video_data.title');
                if (assetFeed && !title) title = extract(assetFeed, 'titles.0.text');
                if (!title) title = creative.title || '';
            }

            if (!body) {
                body = extract(spec, 'link_data.message') || extract(spec, 'video_data.message');
                if (assetFeed && !body) body = extract(assetFeed, 'bodies.0.text');
                if (!body) body = creative.body || '';
            }

            if (!image) {
                if (type === 'VIDEO') image = extract(spec, 'video_data.image_url') || extract(spec, 'video_data.picture') || extract(assetFeed, 'videos.0.thumbnail_url');
                else if (type === 'CAROUSEL') image = extract(spec, 'link_data.child_attachments.0.picture');
                else image = extract(spec, 'link_data.picture') || extract(spec, 'photo_data.picture') || extract(assetFeed, 'images.0.url');
                if (!image) image = creative.thumbnail_url || creative.image_url;
            }

            const link = extract(spec, 'link_data.link') || extract(assetFeed, 'link_urls.0.website_url') || extract(spec, 'video_data.call_to_action.value.link');
            if (link) {
                try { domain = new URL(link).hostname.replace('www.', '').toUpperCase(); } catch {}
            }
        }

        if (!title && adMeta) title = adMeta.name;
        return { title, body, image, domain, type, cta };
    }, [creative, adMeta]);

    // Metrics & Actions
    const spend = parseFloat(insights?.spend || '0');
    const impressions = parseInt(insights?.impressions || '0');
    const clicks = parseInt(insights?.clicks || '0');
    const ctr = parseFloat(insights?.ctr || '0');
    const roas = parseFloat(insights?.purchase_roas?.[0]?.value || '0');

    const getActionCount = (type: string) => {
        const action = insights?.actions?.find((a: any) => a.action_type === type);
        return action ? parseInt(action.value) : 0;
    };
    
    const purchases = getActionCount('purchase') || getActionCount('offsite_conversion.fb_pixel_purchase');
    const leads = getActionCount('lead') || getActionCount('on_facebook_lead');
    const messages = getActionCount('onsite_conversion.messaging_conversation_started_7d') || getActionCount('messaging_conversation_started_7d');
    
    const cpa = purchases > 0 ? (spend / purchases) : 0;
    const cpl = leads > 0 ? (spend / leads) : 0;

    // --- Chart Helpers ---
    const getChartPath = (metric: 'spend' | 'leads' | 'purchases', width: number, height: number, type: 'area' | 'line') => {
        if (trendData.length < 2) return "";
        const values = trendData.map(d => d[metric]);
        const maxVal = Math.max(...values, 1);
        
        const points = values.map((val, i) => {
            const x = (i / (values.length - 1)) * width;
            const y = height - (val / maxVal) * (height - 10) - 5;
            return [x, y];
        });

        let d = `M ${points[0][0]},${points[0][1]}`;
        for (let i = 0; i < points.length - 1; i++) {
            const [x0, y0] = points[i];
            const [x1, y1] = points[i + 1];
            const cp1x = x0 + (x1 - x0) * 0.5;
            const cp1y = y0;
            const cp2x = x1 - (x1 - x0) * 0.5;
            const cp2y = y1;
            d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`;
        }

        if (type === 'area') {
            d += ` L ${width},${height} L 0,${height} Z`;
        }

        return d;
    };

    const handleCustomDateApply = () => {
        if (tempCustomDates.start && tempCustomDates.end) {
            setCustomDates(tempCustomDates);
            setDateRange('custom');
            setIsCustomDateOpen(false);
        }
    };

    const dateLabels: Record<string, string> = {
        'last_7d': 'Últimos 7 dias',
        'last_30d': 'Últimos 30 dias',
        'this_month': 'Este Mês',
        'last_month': 'Mês Passado',
        'lifetime': 'Vitalício',
        'maximum': 'Máximo',
        'custom': 'Personalizado'
    };

    if (isDataLoading && !adMeta) {
        return (
            <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId} isLoading={isLoading}>
                <div className="p-6 max-w-[1400px] mx-auto space-y-6">
                    <div className="flex justify-between"><Skeleton className="h-10 w-64" /><Skeleton className="h-10 w-32" /></div>
                    <div className="grid grid-cols-3 gap-6"><Skeleton className="h-96 col-span-1" /><Skeleton className="h-96 col-span-2" /></div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId} isLoading={isLoading}>
            <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 font-display">
                <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
                    
                    {/* Page Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detalhes do Anúncio</h2>
                            {adMeta?.status && (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase ${adMeta.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                                    {adMeta.status}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative" ref={dateDropdownRef}>
                                <button 
                                    onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                                    className="flex items-center gap-2 bg-white dark:bg-[#292348] hover:bg-gray-100 dark:hover:bg-[#342c5a] text-gray-700 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-transparent shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                    <span>{dateRange === 'custom' && customDates.start ? `${new Date(customDates.start).toLocaleDateString('pt-BR')} - ${new Date(customDates.end).toLocaleDateString('pt-BR')}` : dateLabels[dateRange]}</span>
                                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                </button>
                                {isDateDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
                                        {Object.entries(dateLabels).map(([key, label]) => (
                                            <button 
                                                key={key}
                                                onClick={() => { if(key === 'custom') setIsCustomDateOpen(true); else setDateRange(key as DateRangePreset); setIsDateDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${dateRange === key ? 'text-primary font-bold bg-primary/5 dark:bg-white/5' : 'text-gray-700 dark:text-text-secondary'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => navigate(`/w/${workspaceId}/dashboard`)} className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-[#9b92c9] hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#292348]">
                                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                Voltar
                            </button>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        
                        {/* Col 1: Creative */}
                        <div className="xl:col-span-1 flex flex-col gap-4">
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-[#9b92c9] uppercase tracking-wider">Criativo</h3>
                            <div className="bg-white dark:bg-[#1e1b2e] rounded-xl border border-gray-200 dark:border-[#292348] overflow-hidden shadow-sm flex flex-col">
                                <div className="p-3 flex items-center gap-3 border-b border-gray-100 dark:border-[#292348]/50">
                                    <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                        {creative?.name?.substring(0,2).toUpperCase() || 'AD'}
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{creative?.name || adMeta?.name || 'Ad Name'}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-[#9b92c9]">Patrocinado • <span className="material-symbols-outlined text-[10px] align-middle">public</span></p>
                                    </div>
                                </div>
                                <div className="p-3 pb-1">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 whitespace-pre-wrap">{creativeInfo.body || <span className="italic opacity-50">Texto não disponível</span>}</p>
                                </div>
                                <div className="w-full relative mt-2 bg-gray-100 dark:bg-black/20 min-h-[200px] flex items-center justify-center overflow-hidden">
                                    {creativeInfo.image ? (
                                        <img 
                                            src={creativeInfo.image} 
                                            alt="Creative" 
                                            className="w-full h-auto object-cover" 
                                            referrerPolicy="no-referrer"
                                            onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} 
                                        />
                                    ) : null}
                                    <div className={`${creativeInfo.image ? 'hidden' : 'flex'} flex-col items-center justify-center text-gray-400 p-8`}>
                                        <span className="material-symbols-outlined text-4xl mb-2">image_not_supported</span>
                                        <span className="text-xs">Preview indisponível</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-[#25213a] p-3 flex justify-between items-center border-t border-gray-100 dark:border-[#292348]/50">
                                    <div className="overflow-hidden flex-1 mr-2">
                                        <p className="text-[10px] font-semibold text-gray-500 dark:text-[#9b92c9] uppercase">{creativeInfo.domain}</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{creativeInfo.title || 'Headline'}</p>
                                    </div>
                                    <button className="bg-gray-200 dark:bg-[#383355] hover:bg-gray-300 dark:hover:bg-[#454066] text-gray-900 dark:text-white text-xs font-semibold py-1.5 px-3 rounded border border-gray-300 dark:border-transparent transition-colors uppercase whitespace-nowrap">
                                        {creativeInfo.cta}
                                    </button>
                                </div>
                                <div className="p-3 flex items-center justify-between text-gray-500 dark:text-[#9b92c9] border-t border-gray-100 dark:border-[#292348]/50 bg-white dark:bg-[#1e1b2e]">
                                    <div className="flex items-center gap-1 text-xs">
                                        <span className="material-symbols-outlined text-[14px]">thumb_up</span> 
                                        <span>--</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span>-- Comments</span>
                                        <span>-- Shares</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Col 2 & 3: KPI & Charts */}
                        <div className="xl:col-span-2 flex flex-col gap-6">
                            {/* General Stats */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-[#9b92c9] uppercase tracking-wider">Performance Geral</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <DetailCard label="Valor Gasto" value={spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon="payments" />
                                    <DetailCard label="Impressões" value={impressions.toLocaleString()} icon="visibility" />
                                    <DetailCard label="Cliques" value={clicks.toLocaleString()} icon="ads_click" />
                                    <DetailCard label="CTR" value={`${ctr.toFixed(2)}%`} icon="percent" />
                                </div>
                            </div>

                            {/* Conversion Stats */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-[#9b92c9] uppercase tracking-wider">Conversão</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Leads Card */}
                                    <div className="bg-white dark:bg-[#1e1b2e] p-4 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 group-hover:bg-primary/20 transition-colors"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="text-xs font-medium text-primary dark:text-primary/80">Leads</p>
                                                <span className="material-symbols-outlined text-primary/60 text-[18px]">group_add</span>
                                            </div>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">{leads}</p>
                                            <p className="text-[10px] mt-2 text-gray-500 dark:text-[#9b92c9]">Custo: {cpl > 0 ? cpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</p>
                                        </div>
                                    </div>
                                    {/* Purchases Card */}
                                    <div className="bg-white dark:bg-[#1e1b2e] p-4 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-emerald-500/5 dark:bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Compras</p>
                                                <span className="material-symbols-outlined text-emerald-500/60 text-[18px]">shopping_cart</span>
                                            </div>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">{purchases}</p>
                                            <p className="text-[10px] mt-2 text-gray-500 dark:text-[#9b92c9]">Custo: {cpa > 0 ? cpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</p>
                                        </div>
                                    </div>
                                    <DetailCard label="Msgs Iniciadas" value={messages.toLocaleString()} icon="chat" />
                                    <DetailCard label="ROAS" value={`${roas.toFixed(2)}x`} icon="monetization_on" trend={roas > 2 ? 'up' : 'down'} />
                                </div>
                            </div>

                            {/* Main Chart */}
                            <div className="bg-white dark:bg-[#1e1b2e] p-6 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm flex flex-col flex-1 min-h-[300px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Evolução de {chartMetric === 'spend' ? 'Custo' : chartMetric === 'leads' ? 'Leads' : 'Compras'}</h3>
                                    <div className="flex bg-gray-100 dark:bg-[#292348] rounded-lg p-1 gap-1">
                                        <button onClick={() => setChartMetric('leads')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${chartMetric === 'leads' ? 'bg-white dark:bg-[#383355] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-[#9b92c9] hover:bg-gray-200 dark:hover:bg-[#383355]'}`}>Leads</button>
                                        <button onClick={() => setChartMetric('purchases')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${chartMetric === 'purchases' ? 'bg-white dark:bg-[#383355] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-[#9b92c9] hover:bg-gray-200 dark:hover:bg-[#383355]'}`}>Compras</button>
                                        <button onClick={() => setChartMetric('spend')} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${chartMetric === 'spend' ? 'bg-white dark:bg-[#383355] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-[#9b92c9] hover:bg-gray-200 dark:hover:bg-[#383355]'}`}>Custo</button>
                                    </div>
                                </div>
                                <div className="relative w-full h-full flex items-end justify-between px-2 gap-2 mt-4 min-h-[220px]">
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                                        {[...Array(5)].map((_, i) => <div key={i} className="w-full border-t border-gray-500"></div>)}
                                    </div>
                                    {trendData.length > 0 ? (
                                        <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 300">
                                            <defs>
                                                <linearGradient id="gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#3713ec" stopOpacity="0.5"></stop>
                                                    <stop offset="100%" stopColor="#3713ec" stopOpacity="0"></stop>
                                                </linearGradient>
                                            </defs>
                                            <path d={getChartPath(chartMetric, 1000, 300, 'area')} fill="url(#gradient)" stroke="none" className="opacity-50" />
                                            <path d={getChartPath(chartMetric, 1000, 300, 'line')} fill="none" stroke="#3713ec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                                            {/* Data Points */}
                                            {trendData.map((d, i) => {
                                                if (i % Math.ceil(trendData.length / 5) !== 0 && i !== trendData.length - 1) return null;
                                                // Simplified point calc for demo - in real app reuse calculation
                                                return null; 
                                            })}
                                        </svg>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-text-secondary text-sm border border-dashed border-gray-700 rounded-lg">
                                            Sem dados suficientes para este período.
                                        </div>
                                    )}
                                </div>
                                {trendData.length > 0 && (
                                    <div className="flex justify-between w-full mt-4 text-[10px] font-mono text-gray-500 dark:text-[#9b92c9] uppercase tracking-widest">
                                        <span>{trendData[0]?.date}</span>
                                        <span>{trendData[Math.floor(trendData.length / 2)]?.date}</span>
                                        <span>{trendData[trendData.length - 1]?.date}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h3 className="text-sm font-semibold text-gray-500 dark:text-[#9b92c9] uppercase tracking-wider">Detalhamento de Conversões</h3>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 text-[18px]">search</span>
                                    <input className="pl-9 pr-3 py-1.5 bg-white dark:bg-[#1e1b2e] border border-gray-200 dark:border-[#292348] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary" placeholder="Filtrar..." type="text"/>
                                </div>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1e1b2e] border border-gray-200 dark:border-[#292348] rounded-lg text-sm font-medium text-gray-700 dark:text-[#9b92c9] hover:text-white hover:bg-[#292348] transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">download</span> Exportar
                                </button>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1e1b2e] rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-[#292348] bg-gray-50 dark:bg-[#25213a]">
                                            <th className="p-4 text-xs font-semibold text-gray-500 dark:text-[#9b92c9] uppercase tracking-wider">Tipo de Evento</th>
                                            <th className="p-4 text-xs font-semibold text-gray-500 dark:text-[#9b92c9] uppercase tracking-wider">Qtd. Total</th>
                                            <th className="p-4 text-xs font-semibold text-gray-500 dark:text-[#9b92c9] uppercase tracking-wider">Valor Estimado</th>
                                            <th className="p-4 text-xs font-semibold text-gray-500 dark:text-[#9b92c9] uppercase tracking-wider text-right">Custo Médio (CPA)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-[#292348]">
                                        {insights?.actions?.map((action, idx) => {
                                            const count = parseInt(action.value);
                                            const valueObj = insights.action_values?.find(v => v.action_type === action.action_type);
                                            const totalValue = valueObj ? parseFloat(valueObj.value) : 0;
                                            
                                            let costPer = 0;
                                            const costObj = insights.cost_per_action_type?.find(c => c.action_type === action.action_type);
                                            if (costObj) costPer = parseFloat(costObj.value);
                                            else if (count > 0) costPer = spend / count;
                                            
                                            let colorClass = 'bg-slate-500';
                                            if (action.action_type.includes('purchase')) colorClass = 'bg-emerald-500';
                                            else if (action.action_type.includes('lead')) colorClass = 'bg-primary';
                                            else if (action.action_type.includes('click')) colorClass = 'bg-blue-400';
                                            else if (action.action_type.includes('view')) colorClass = 'bg-purple-500';
                                            else if (action.action_type.includes('messaging') || action.action_type.includes('conversation')) colorClass = 'bg-sky-500';

                                            return (
                                                <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-[#25213a] transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`size-2 rounded-full ${colorClass} shadow-[0_0_8px_currentColor] opacity-80`}></span>
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 capitalize">
                                                                {action.action_type.replace(/_/g, ' ').replace('offsite conversion', '').replace('fb pixel', '')}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-gray-900 dark:text-white">{count.toLocaleString()}</td>
                                                    <td className="p-4 text-sm text-gray-500 dark:text-[#9b92c9] font-mono">
                                                        {totalValue > 0 ? totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
                                                    </td>
                                                    <td className="p-4 text-right text-sm font-mono text-gray-500 dark:text-[#9b92c9]">
                                                        {costPer > 0 ? costPer.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {(!insights?.actions || insights.actions.length === 0) && (
                                            <tr><td colSpan={4} className="p-8 text-center text-gray-500 dark:text-[#9b92c9] text-sm">Nenhum evento de conversão registrado.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t border-gray-100 dark:border-[#292348] flex items-center justify-between bg-white dark:bg-[#1e1b2e]">
                                <p className="text-xs text-gray-500 dark:text-[#9b92c9]">Mostrando {insights?.actions?.length || 0} eventos</p>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 rounded text-xs font-medium border border-gray-200 dark:border-[#292348] text-gray-500 dark:text-[#9b92c9] opacity-50 cursor-not-allowed">Anterior</button>
                                    <button className="px-3 py-1 rounded text-xs font-medium border border-gray-200 dark:border-[#292348] text-gray-500 dark:text-[#9b92c9] opacity-50 cursor-not-allowed">Próximo</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Date Modal */}
            <Modal isOpen={isCustomDateOpen} onClose={() => setIsCustomDateOpen(false)} title="Periodo Personalizado">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Início</label>
                            <input type="date" className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-white focus:border-primary outline-none" value={tempCustomDates.start} onChange={(e) => setTempCustomDates(p => ({...p, start: e.target.value}))} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Fim</label>
                            <input type="date" className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-white focus:border-primary outline-none" value={tempCustomDates.end} onChange={(e) => setTempCustomDates(p => ({...p, end: e.target.value}))} />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="ghost" onClick={() => setIsCustomDateOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCustomDateApply} disabled={!tempCustomDates.start || !tempCustomDates.end}>Aplicar</Button>
                </div>
            </Modal>
        </AppShell>
    );
};

const DetailCard = ({ label, value, icon, trend }: any) => (
    <div className="bg-white dark:bg-[#1e1b2e] p-4 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm">
        <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 dark:text-[#9b92c9]">{label}</p>
            <span className="material-symbols-outlined text-gray-400 text-[18px]">{icon}</span>
        </div>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                <span className="material-symbols-outlined text-[14px]">{trend === 'up' ? 'trending_up' : 'trending_down'}</span>
                <span>{trend === 'up' ? '+2.5%' : '-1.2%'}</span>
            </div>
        )}
    </div>
);
