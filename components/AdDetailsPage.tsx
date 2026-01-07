
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

    // Data States
    const [adMeta, setAdMeta] = useState<any>(null);
    const [creative, setCreative] = useState<AdCreativeData | null>(null);
    const [insights, setInsights] = useState<APIGeneralInsights | null>(null);
    const [trendData, setTrendData] = useState<{ date: string, spend: number, conversations: number, rawDate: string }[]>([]);

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
                // Don't set error yet, keep loading state until timeout or ready
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
                    // Fallback if custom dates not set yet
                    timeParams.date_preset = 'last_30d'; 
                }
            } else if (dateRange !== 'maximum') {
                timeParams.date_preset = dateRange;
            }

            try {
                // 1. Fetch Ad Metadata & Creative ID & Link Fields
                const adPromise = new Promise<any>((resolve) => {
                    window.FB.api(`/${adId}`, {
                        fields: 'name,status,preview_shareable_link,effective_object_story_id,creative{id,instagram_permalink_url}',
                        ...apiParams
                    }, resolve);
                });

                // 2. Fetch Insights (Overall)
                const insightsPromise = new Promise<any>((resolve) => {
                    window.FB.api(`/${adId}/insights`, {
                        fields: 'spend,impressions,clicks,ctr,cpc,cpm,actions,action_values,purchase_roas,cost_per_action_type,date_start,date_stop',
                        ...apiParams,
                        ...timeParams
                    }, (res: any) => {
                         if(!res || res.error) {
                             resolve(res);
                         } else {
                             resolve(res);
                         }
                    });
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

                // Trigger calls
                const [adRes, insightsRes, trendRes] = await Promise.all([
                    adPromise,
                    insightsPromise,
                    trendPromise
                ]);

                // Process Ad & Creative
                if (adRes && !adRes.error) {
                    setAdMeta(adRes);
                    if (adRes.creative?.id) {
                        // Fetch Creative Details with extended fields for robustness
                        window.FB.api(`/${adRes.creative.id}`, {
                            fields: 'name,title,body,image_url,thumbnail_url,object_story_spec,asset_feed_spec,call_to_action_type,video_id',
                            ...apiParams
                        }, (creRes: any) => {
                            if (!creRes.error) {
                                setCreative(creRes);
                            }
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

                    const trend = rawData.map((d: any) => {
                        const msgs = d.actions?.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d' || a.action_type === 'messaging_conversation_started_7d');
                        return {
                            date: new Date(d.date_start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                            spend: parseFloat(d.spend || '0'),
                            conversations: msgs ? parseInt(msgs.value) : 0,
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

    // Safely extract nested properties
    const get = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

    // Robust Creative Data Extraction
    const creativeInfo = useMemo(() => {
        if (!creative) return { title: '', body: '', image: '', domain: '', type: 'IMAGE', cta: 'Saiba Mais' };

        const spec = creative.object_story_spec;
        const assetFeed = creative.asset_feed_spec; // Dynamic Ads

        // Helper to extract deeply nested properties safely
        const extract = (root: any, path: string) => get(root, path);

        let type = 'IMAGE';
        
        // 1. Determine Type & Initial Content
        if (extract(spec, 'video_data') || (assetFeed && extract(assetFeed, 'videos.0'))) {
            type = 'VIDEO';
        } else if (extract(spec, 'link_data.child_attachments')) {
            type = 'CAROUSEL';
        }

        // 2. Extract Text
        // Try Object Story Spec (Standard Ads) first as it contains the actual post content
        let title = extract(spec, 'link_data.name') || extract(spec, 'video_data.title');
        let body = extract(spec, 'link_data.message') || extract(spec, 'video_data.message');
        
        // Try Asset Feed (Dynamic Ads)
        if (assetFeed) {
             const firstTitle = extract(assetFeed, 'titles.0.text');
             const firstBody = extract(assetFeed, 'bodies.0.text'); // Primary Text
             if (!title) title = firstTitle;
             if (!body) body = firstBody;
        }

        // Fallback to top-level fields
        if (!title) title = creative.title || '';
        if (!body) body = creative.body || '';

        // 3. Extract Image based on Type
        let image = '';
        
        if (type === 'VIDEO') {
            image = extract(spec, 'video_data.image_url') || 
                    extract(spec, 'video_data.picture') || 
                    extract(assetFeed, 'videos.0.thumbnail_url');
        } else if (type === 'CAROUSEL') {
            image = extract(spec, 'link_data.child_attachments.0.picture');
        } else {
            // Standard Image
            image = extract(spec, 'link_data.picture') || 
                    extract(spec, 'photo_data.picture') ||
                    extract(assetFeed, 'images.0.url');
        }

        // General Fallback
        if (!image) image = creative.image_url || creative.thumbnail_url || '';

        // Domain extraction
        let domain = 'LINK';
        const link = extract(spec, 'link_data.link') || extract(assetFeed, 'link_urls.0.website_url') || extract(spec, 'video_data.call_to_action.value.link');
        if (link) {
            try { domain = new URL(link).hostname.replace('www.', '').toUpperCase(); } catch {}
        }

        // CTA
        const cta = creative.call_to_action_type 
            ? creative.call_to_action_type.replace(/_/g, ' ') 
            : extract(spec, 'link_data.call_to_action.type') || 'SAIBA MAIS';

        return { title, body, image, domain, type, cta };
    }, [creative]);

    // Derived Links
    const fbLink = adMeta?.effective_object_story_id 
        ? `https://www.facebook.com/${adMeta.effective_object_story_id}` 
        : adMeta?.preview_shareable_link;
    
    const igLink = adMeta?.creative?.instagram_permalink_url;

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

    const getCostPerAction = (type: string) => {
        const item = insights?.cost_per_action_type?.find((a: any) => a.action_type === type);
        return item ? parseFloat(item.value) : 0;
    };
    
    // Fallback for Purchases (can be pixel purchase or offsite_conversion)
    const purchases = getActionCount('purchase') || getActionCount('offsite_conversion.fb_pixel_purchase');
    const leads = getActionCount('lead') || getActionCount('on_facebook_lead');
    
    // Enhanced Messaging check for various attributions
    // Meta sometimes changes keys, checking both onsite 7d and generic
    const messages = 
        getActionCount('onsite_conversion.messaging_conversation_started_7d') || 
        getActionCount('messaging_conversation_started_7d');
    
    // Cost per Action Calculations
    const cpa = purchases > 0 ? (spend / purchases) : 0;
    const cpl = leads > 0 ? (spend / leads) : 0;
    
    // Cost Per Message Strategy: Try API field first, fallback to manual calculation
    let costPerMessage = getCostPerAction('onsite_conversion.messaging_conversation_started_7d') || 
                         getCostPerAction('messaging_conversation_started_7d');
    
    if (costPerMessage === 0 && messages > 0) {
        costPerMessage = spend / messages;
    }

    // Generate Smooth Chart Path (Bezier)
    const getSmoothPath = (key: 'spend' | 'conversations', width: number, height: number) => {
        if (trendData.length < 2) return "";
        
        const values = trendData.map(d => d[key]);
        const maxVal = Math.max(...values, 1); 
        
        // Map points to SVG coordinates
        const points = values.map((val, i) => {
            const x = (i / (values.length - 1)) * width;
            // Pad 5px top and bottom
            const y = height - (val / maxVal) * (height - 10) - 5; 
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
        'maximum': 'Máximo',
        'custom': 'Personalizado'
    };

    const handleCustomDateApply = () => {
        if (tempCustomDates.start && tempCustomDates.end) {
            setCustomDates(tempCustomDates);
            setDateRange('custom');
            setIsCustomDateOpen(false);
        }
    };

    if (isDataLoading && !creative) { // Only show skeleton on initial load if no data
        return (
            <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId} isLoading={isLoading}>
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
        <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId} isLoading={isLoading}>
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
                                <span>{dateRange === 'custom' && customDates.start ? `${new Date(customDates.start).toLocaleDateString('pt-BR')} - ${new Date(customDates.end).toLocaleDateString('pt-BR')}` : dateLabels[dateRange]}</span>
                                <span className="material-symbols-outlined text-[18px]">expand_more</span>
                            </button>
                            
                            {isDateDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-card-dark border border-border-dark rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                    {Object.entries(dateLabels).map(([key, label]) => (
                                        <button 
                                            key={key}
                                            onClick={() => { 
                                                if(key === 'custom') {
                                                    setIsCustomDateOpen(true);
                                                } else {
                                                    setDateRange(key as DateRangePreset); 
                                                }
                                                setIsDateDropdownOpen(false); 
                                            }}
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
                            <div className="bg-white dark:bg-[#1e1b2e] rounded-xl border border-gray-200 dark:border-[#292348] overflow-hidden shadow-sm flex flex-col relative group">
                                <div className="p-3 flex items-center gap-3 border-b border-gray-100 dark:border-[#292348]/50 bg-gray-50 dark:bg-[#25213a]">
                                    <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                                        {creative?.name?.substring(0,2).toUpperCase() || 'AD'}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{creative?.name || 'Ad Name'}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-text-secondary">Patrocinado • <span className="material-symbols-outlined text-[10px] align-middle">public</span></p>
                                    </div>
                                    
                                    {/* Action Links */}
                                    <div className="ml-auto flex items-center gap-1">
                                        {fbLink && (
                                            <a 
                                                href={fbLink} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-[#1877F2] hover:bg-[#1877F2]/10 p-1 rounded transition-colors"
                                                title="Ver no Facebook"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                            </a>
                                        )}
                                        {igLink && (
                                            <a 
                                                href={igLink} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="hover:bg-pink-500/10 p-1 rounded transition-colors group/ig"
                                                title="Ver no Instagram"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="24" height="24" rx="6" fill="url(#ig_gradient_preview)" />
                                                    <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2" />
                                                    <circle cx="18" cy="6" r="1.5" fill="white" />
                                                    <defs>
                                                        <linearGradient id="ig_gradient_preview" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
                                                            <stop stopColor="#f09433" />
                                                            <stop offset="0.25" stopColor="#e6683c" />
                                                            <stop offset="0.5" stopColor="#dc2743" />
                                                            <stop offset="0.75" stopColor="#cc2366" />
                                                            <stop offset="1" stopColor="#bc1888" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                            </a>
                                        )}
                                        
                                        {/* Type Indicators */}
                                        <div className="border-l border-gray-200 dark:border-[#292348] pl-2 ml-1">
                                            {creativeInfo.type === 'VIDEO' && <span className="material-symbols-outlined text-text-secondary text-sm" title="Vídeo">videocam</span>}
                                            {creativeInfo.type === 'CAROUSEL' && <span className="material-symbols-outlined text-text-secondary text-sm" title="Carrossel">view_carousel</span>}
                                            {creativeInfo.type === 'IMAGE' && <span className="material-symbols-outlined text-text-secondary text-sm" title="Imagem">image</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 pb-2">
                                    <p className="text-sm text-slate-700 dark:text-gray-300 line-clamp-6 whitespace-pre-wrap leading-relaxed break-words">
                                        {creativeInfo.body || <span className="text-text-secondary italic">Texto não disponível</span>}
                                    </p>
                                </div>
                                
                                {/* Image Container - Aspect Ratio Fix */}
                                <div className="w-full relative mt-2 bg-gray-100 dark:bg-black/20 border-y border-gray-100 dark:border-[#292348]/50 min-h-[300px] flex items-center justify-center overflow-hidden">
                                    {creativeInfo.image ? (
                                        <>
                                            <img 
                                                src={creativeInfo.image} 
                                                alt="Ad Creative" 
                                                className="w-full h-auto max-h-[600px] object-contain relative z-10"
                                                loading="lazy"
                                                referrerPolicy="no-referrer"
                                            />
                                            
                                            {/* Video Play Button Overlay */}
                                            {creativeInfo.type === 'VIDEO' && (
                                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors pointer-events-none">
                                                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                                                        <span className="material-symbols-outlined text-4xl text-black ml-1">play_arrow</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Carousel Indicators Overlay */}
                                            {creativeInfo.type === 'CAROUSEL' && (
                                                <>
                                                    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white backdrop-blur-sm cursor-pointer pointer-events-auto">
                                                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white backdrop-blur-sm cursor-pointer pointer-events-auto">
                                                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                                                        </div>
                                                    </div>
                                                    <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5 pointer-events-none">
                                                        <div className="w-2 h-2 rounded-full bg-primary shadow-sm border border-white/20"></div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-sm backdrop-blur-md"></div>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-sm backdrop-blur-md"></div>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-text-secondary py-12">
                                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">image_not_supported</span>
                                            <span className="text-xs">Preview indisponível</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-100 dark:bg-[#25213a] p-3 flex justify-between items-center min-h-[60px]">
                                    <div className="overflow-hidden mr-2 flex-1">
                                        <p className="text-[10px] font-semibold text-slate-500 dark:text-text-secondary truncate uppercase tracking-wider mb-0.5">{creativeInfo.domain}</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">{creativeInfo.title || 'Headline'}</p>
                                    </div>
                                    <button className="shrink-0 bg-gray-200 dark:bg-[#383355] hover:bg-gray-300 dark:hover:bg-[#454066] text-slate-800 dark:text-white text-[10px] font-bold py-2 px-4 rounded border border-gray-300 dark:border-transparent transition-colors uppercase whitespace-nowrap">
                                        {creativeInfo.cta}
                                    </button>
                                </div>
                                <div className="p-2 flex items-center justify-between text-slate-500 dark:text-text-secondary/50 border-t border-gray-200 dark:border-[#292348]/50 text-[9px] font-mono bg-gray-50 dark:bg-[#1c192b]">
                                     <span>ID: {adId}</span>
                                </div>
                            </div>
                        </div>

                        {/* Col 2 & 3: KPI Grid & Charts */}
                        <div className="xl:col-span-2 flex flex-col gap-6">
                            
                            {/* KPI Cards */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-text-secondary uppercase tracking-wider">Métricas Principais</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <KpiDetailCard label="Valor Gasto" value={spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon="payments" trend="up" />
                                    <KpiDetailCard label="Impressões" value={impressions.toLocaleString()} icon="visibility" trend="neutral" />
                                    <KpiDetailCard label="Cliques" value={clicks.toLocaleString()} icon="ads_click" trend="neutral" />
                                    <KpiDetailCard label="CTR" value={`${ctr.toFixed(2)}%`} icon="percent" trend="neutral" />
                                    
                                    {/* Requested Messaging KPIs */}
                                    <KpiDetailCard 
                                        label="Msgs Iniciadas" 
                                        value={messages.toLocaleString()} 
                                        icon="chat" 
                                        trend="neutral" 
                                    />
                                    <KpiDetailCard 
                                        label="Custo por Msg" 
                                        value={costPerMessage > 0 ? costPerMessage.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'} 
                                        icon="forum" 
                                        trend="neutral" 
                                    />
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

                                    {/* CPC/ROAS Row */}
                                    <KpiDetailCard label="CPC" value={parseFloat(insights?.cpc || '0').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon="show_chart" />
                                    <KpiDetailCard label="ROAS" value={`${roas.toFixed(2)}x`} icon="monetization_on" trend={roas > 2 ? 'up' : 'down'} trendColor={roas > 2 ? 'text-emerald-500' : 'text-red-500'} />
                                </div>
                            </div>

                            {/* Main Chart */}
                            <div className="bg-white dark:bg-[#1e1b2e] p-6 rounded-xl border border-gray-200 dark:border-[#292348] shadow-sm flex flex-col flex-1 min-h-[300px]">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white">Investimento vs Conversas (Diário)</h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-text-secondary">
                                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                                Investimento
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-text-secondary">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                                Conversas
                                            </div>
                                        </div>
                                    </div>
                                    {isDataLoading && <span className="text-xs text-text-secondary animate-pulse">Atualizando...</span>}
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
                                            {/* Spend Line (Primary) */}
                                            <path 
                                                d={getSmoothPath('spend', 1000, 300)} 
                                                fill="none" 
                                                stroke="#3713ec" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth="3" 
                                                vectorEffect="non-scaling-stroke"
                                            />
                                            {/* Conversations Line (Secondary) */}
                                            <path 
                                                d={getSmoothPath('conversations', 1000, 300)} 
                                                fill="none" 
                                                stroke="#34d399" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth="3" 
                                                vectorEffect="non-scaling-stroke"
                                                opacity="0.8"
                                            />
                                        </svg>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-text-secondary text-sm border border-dashed border-slate-700 rounded-lg">
                                            {isDataLoading ? "Carregando..." : "Sem dados de tendência suficientes para este período."}
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
                                            
                                            // Cost calculation strategy
                                            let costPer = 0;
                                            const costObj = insights.cost_per_action_type?.find(c => c.action_type === action.action_type);
                                            if (costObj) {
                                                costPer = parseFloat(costObj.value);
                                            } else if (count > 0) {
                                                costPer = spend / count;
                                            }
                                            
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

            {/* Custom Date Modal */}
            <Modal isOpen={isCustomDateOpen} onClose={() => setIsCustomDateOpen(false)} title="Periodo Personalizado">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Início</label>
                            <input 
                                type="date" 
                                className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-white focus:border-primary outline-none"
                                value={tempCustomDates.start}
                                onChange={(e) => setTempCustomDates(p => ({...p, start: e.target.value}))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-text-secondary uppercase">Fim</label>
                            <input 
                                type="date" 
                                className="w-full bg-background-dark border border-border-dark rounded-lg p-3 text-white focus:border-primary outline-none"
                                value={tempCustomDates.end}
                                onChange={(e) => setTempCustomDates(p => ({...p, end: e.target.value}))}
                            />
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
