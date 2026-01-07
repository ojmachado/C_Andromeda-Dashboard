
import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from './components/Navigation';
import { Button, Card, Badge, Skeleton, Modal } from './components/UI';
import { KpiCard, KpiGrid, ChartContainer, DataTable } from './components/DashboardItems';
import { SecureKV } from './utils/kv';
import { IntegrationsPage, WorkspacesPage, SetupWizard } from './components/SaaSPages';
import type { Workspace, InsightData, DateRangePreset, APIGeneralInsights } from './types';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

const ALL_OBJECTIVES = [
  'OUTCOME_SALES', 
  'OUTCOME_LEADS', 
  'OUTCOME_ENGAGEMENT', 
  'OUTCOME_TRAFFIC', 
  'OUTCOME_AWARENESS', 
  'OUTCOME_APP_PROMOTION'
];

type ViewLevel = 'campaign' | 'adset' | 'ad';

const DashboardPage = ({ workspaces, sdkReady }: { workspaces: Workspace[], sdkReady: boolean }) => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const currentWorkspace = workspaces.find(w => w.id === workspaceId);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<InsightData[]>([]);
  const [trendData, setTrendData] = useState<{date: string, value: number}[]>([]);
  
  // Filter States
  const [dateRange, setDateRange] = useState<DateRangePreset>('last_30d');
  const [viewLevel, setViewLevel] = useState<ViewLevel>('campaign');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [tempCustomDates, setTempCustomDates] = useState({ start: '', end: '' });

  // Objective Filter
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [isObjDropdownOpen, setIsObjDropdownOpen] = useState(false);
  const objDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (objDropdownRef.current && !objDropdownRef.current.contains(event.target as Node)) {
            setIsObjDropdownOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
      // Allow demo workspace to load even if SDK not ready
      if (!sdkReady && workspaceId !== 'wk_demo') return; 

      const loadingState = isRefreshing ? setIsRefreshing : setIsLoading;
      loadingState(true);

      const token = await SecureKV.getWorkspaceToken(workspaceId!);
      const context = SecureKV.getWorkspaceContext(workspaceId!);
      
      const hasContext = context?.adAccountId;
      const isDemo = workspaceId === 'wk_demo';

      if ((!token || !hasContext || !window.FB) && !isDemo) {
          loadingState(false);
          return;
      }

      // --- DATE LOGIC ---
      let apiTimeParams: any = {};
      
      if (dateRange === 'custom') {
          if (!customDates.start || !customDates.end) { loadingState(false); return; }
          apiTimeParams.time_range = JSON.stringify({ since: customDates.start, until: customDates.end });
      } else {
          apiTimeParams.date_preset = dateRange;
      }

      // --- DEMO DATA ---
      if (isDemo) {
             await new Promise(r => setTimeout(r, 800)); // Simulate network
             
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
             const demoItems = [
                 { id: 'c1', name: '[LRM][TRAFEGO][PERFIL][CBO][NATAL]', status: 'ACTIVE', objective: 'OUTCOME_TRAFFIC', spend: 749.73, impressions: 52569, clicks: 800, ctr: 2.90, cpm: 14.0, cpc: 0.49, roas: 4.2, cpa: 12.50, messages: 32, costPerConversation: 23.42, adPreviewLink: 'https://facebook.com', campaignName: 'Campanha de Natal' },
                 { id: 'c2', name: '[INSTITUCIONAL][BRANDING][2024]', status: 'PAUSED', objective: 'OUTCOME_AWARENESS', spend: 299.23, impressions: 20569, clicks: 440, ctr: 2.1, cpm: 14.5, cpc: 0.68, roas: 1.5, cpa: 45.00, messages: 13, costPerConversation: 23.01, campaignName: 'Branding 2024' },
                 { id: 'c3', name: '[CONVERSAO][LAL 1%][COMPRADORES]', status: 'ACTIVE', objective: 'OUTCOME_SALES', adPreviewLink: 'https://facebook.com', spend: 500.00, impressions: 9500, clicks: 200, ctr: 2.1, cpm: 52.6, cpc: 2.50, roas: 5.5, cpa: 25.00, messages: 5, costPerConversation: 100, campaignName: 'Sales Conversion' },
                 { id: 'c4', name: '[TESTE][SEM ENTREGA]', status: 'PAUSED', objective: 'OUTCOME_TRAFFIC', spend: 0, impressions: 0, clicks: 0, ctr: 0, cpm: 0, cpc: 0, roas: 0, cpa: 0, messages: 0, costPerConversation: 0, campaignName: 'Tests' }
             ].map(c => ({
                 ...c, 
                 detailsLink: `#/w/${workspaceId}/ads/${viewLevel}/${c.id}`,
                 campaignDetailsLink: `#/w/${workspaceId}/ads/campaign/demo_cp_id`
             }));
             
             // Filter Demo Data (Impressions > 0)
             setCampaigns(demoItems.filter(i => i.impressions > 0));
             
             // Mock Trend Data
             const trend = Array.from({length: 15}, (_, i) => ({
                 date: new Date(Date.now() - (14-i) * 86400000).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}),
                 value: Math.random() * 200 + 50
             }));
             setTrendData(trend);
             loadingState(false);
             return;
      }

      // --- REAL API CALLS ---
      const accountId = context.adAccountId;

      // 1. Overview Stats
      const p1 = new Promise<any>((resolve) => {
          window.FB.api(`/${accountId}/insights`, { 
              access_token: token, 
              fields: 'spend,impressions,clicks,ctr,cpm,cpc,actions,purchase_roas',
              ...apiTimeParams
          }, (res: any) => resolve(res));
      });
      
      // 2. Data List (Campaigns/AdSets/Ads)
      const levelPath = viewLevel === 'adset' ? 'adsets' : viewLevel === 'ad' ? 'ads' : 'campaigns';
      
      // Dynamic fields based on view level
      let listFields = 'id,name,status';
      if (viewLevel === 'campaign') listFields += ',objective';
      if (viewLevel === 'adset') listFields += ',campaign{id,objective,name}'; // Added campaign ID for linking
      if (viewLevel === 'ad') listFields += ',campaign{id,objective,name},preview_shareable_link'; // Added campaign ID for linking

      const p2 = new Promise<any>((resolve) => {
          window.FB.api(`/${accountId}/${levelPath}`, { 
              access_token: token, 
              fields: listFields,
              limit: 50
          }, async (res: any) => {
               if(!res.data) { resolve(res); return; }
               const items = res.data;
               const insightsPromises = items.map((c: any) => new Promise(r => {
                   window.FB.api(`/${c.id}/insights`, {
                       access_token: token,
                       fields: 'spend,impressions,clicks,ctr,cpm,cpc,actions,purchase_roas',
                       ...apiTimeParams
                   }, (iRes: any) => r({ ...c, insights: iRes }));
               }));
               const results = await Promise.all(insightsPromises);
               resolve({ data: results });
          });
      });

      // 3. Daily Trend (Spend)
      const p3 = new Promise<any>((resolve) => {
          window.FB.api(`/${accountId}/insights`, { 
              access_token: token, 
              fields: 'spend,date_start',
              time_increment: 1,
              ...apiTimeParams
          }, (res: any) => resolve(res));
      });

      const [insightsRes, listRes, trendRes] = await Promise.all([p1, p2, p3]);
      
      // Process Overview
      if (insightsRes && !insightsRes.error && insightsRes.data?.[0]) {
          setStats(insightsRes.data[0]);
      } else {
          setStats(null);
      }
      
      // Helper function for metrics
      const getActionVal = (actions: any[], type: string) => {
          if (!actions) return 0;
          // Check for exact match or general messaging event
          const action = actions.find((a: any) => a.action_type === type);
          return action ? parseFloat(action.value) : 0;
      };

      // Process List
      if (listRes && listRes.data) {
          const formatted = listRes.data.map((c: any) => {
              const i: APIGeneralInsights = c.insights?.data?.[0] || {};
              const spend = parseFloat(i.spend || '0');
              const impressions = parseInt(i.impressions || '0');
              
              const purchaseAction = i.actions?.find(a => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase');
              const purchases = purchaseAction ? parseFloat(purchaseAction.value) : 0;
              const roasVal = i.purchase_roas?.[0]?.value ? parseFloat(i.purchase_roas[0].value) : 0;
              const cpa = purchases > 0 ? spend / purchases : 0;
              
              // Conversions
              const messages = getActionVal(i.actions, 'onsite_conversion.messaging_conversation_started_7d');
              const costPerConversation = messages > 0 ? spend / messages : 0;

              // Resolve Objective and Campaign Name/Link
              let objective = c.objective;
              let campaignName = undefined;
              let campaignDetailsLink = undefined;
              
              if (c.campaign) {
                  if (c.campaign.objective) objective = c.campaign.objective;
                  if (c.campaign.name) campaignName = c.campaign.name;
                  if (c.campaign.id) campaignDetailsLink = `#/w/${workspaceId}/ads/campaign/${c.campaign.id}`;
              }

              return {
                  id: c.id,
                  name: c.name,
                  campaignName,
                  campaignDetailsLink,
                  status: c.status,
                  objective: objective,
                  adPreviewLink: c.preview_shareable_link || undefined,
                  detailsLink: `#/w/${workspaceId}/ads/${viewLevel}/${c.id}`, // Build Hash Link
                  spend,
                  impressions,
                  clicks: parseInt(i.clicks || '0'),
                  ctr: parseFloat(i.ctr || '0'),
                  cpm: parseFloat(i.cpm || '0'),
                  cpc: parseFloat(i.cpc || '0'),
                  roas: roasVal,
                  cpa: cpa,
                  messages,
                  costPerConversation
              };
          });
          
          // Filter out items with 0 impressions (No Delivery)
          const filteredByDelivery = formatted.filter((item: InsightData) => item.impressions > 0);
          setCampaigns(filteredByDelivery);
      }

      // Process Trend
      if (trendRes && !trendRes.error && trendRes.data) {
          const trend = trendRes.data.map((d: any) => ({
              date: new Date(d.date_start).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}),
              value: parseFloat(d.spend || '0')
          })).reverse();
          setTrendData(trend);
      } else {
          setTrendData([]);
      }

      loadingState(false);
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId, sdkReady, workspaces, dateRange, customDates, viewLevel]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // Extract total metrics helper
  const getActionValue = (actions: any[], type: string) => {
      if (!actions) return 0;
      const action = actions.find((a: any) => a.action_type === type);
      return action ? parseFloat(action.value) : 0;
  };
  
  const totalSales = getActionValue(stats?.actions, 'purchase') || getActionValue(stats?.actions, 'offsite_conversion.fb_pixel_purchase');
  const totalMessages = getActionValue(stats?.actions, 'onsite_conversion.messaging_conversation_started_7d');
  
  const totalSpend = parseFloat(stats?.spend || 0);
  const globalRoas = totalSpend > 0 && stats?.purchase_roas ? parseFloat(stats.purchase_roas[0]?.value || 0) : 0;
  const globalCpa = totalSales > 0 ? totalSpend / totalSales : 0;
  const globalCostPerConversation = totalMessages > 0 ? totalSpend / totalMessages : 0;

  // Handle Date Filter Click
  const handleDatePreset = (preset: DateRangePreset) => {
      if (preset === 'custom') {
          setIsDateModalOpen(true);
      } else {
          setDateRange(preset);
      }
  };

  const applyCustomDate = () => {
      if (tempCustomDates.start && tempCustomDates.end) {
          setCustomDates(tempCustomDates);
          setDateRange('custom');
          setIsDateModalOpen(false);
      }
  };

  // Filter Logic
  const filteredCampaigns = campaigns.filter(c => {
      if (selectedObjectives.length === 0) return true;
      return c.objective && selectedObjectives.includes(c.objective);
  });

  const toggleObjective = (obj: string) => {
      setSelectedObjectives(prev => 
          prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]
      );
  };

  if (!currentWorkspace?.metaConnected && workspaceId !== 'wk_demo') {
      return (
          <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId}>
              <div className="max-w-4xl mx-auto py-20 px-6 text-center">
                  <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-5xl text-red-500">link_off</span>
                  </div>
                  <h1 className="text-3xl font-black text-white mb-4">Workspace Desconectado</h1>
                  <p className="text-text-secondary mb-8 max-w-lg mx-auto">
                      Este workspace ainda não está conectado a uma conta de anúncios do Meta Ads. Configure a conexão para visualizar os dados.
                  </p>
                  <Button onClick={() => navigate(`/w/${workspaceId}/setup`)}>
                      Conectar Meta Ads
                  </Button>
              </div>
          </AppShell>
      );
  }

  return (
    <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId}>
        <div className="max-w-[1400px] mx-auto py-8 px-6 space-y-8 print-full-width">
            
            {/* Header & Controls */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 no-print">
                {/* Title & Status */}
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Dashboard</h1>
                        <p className="text-text-secondary text-sm">Visão geral de performance.</p>
                    </div>
                    {/* Enhanced Status Indicator */}
                    <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer hover:opacity-80 ${
                        currentWorkspace?.metaConnected 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.1)]' 
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                        onClick={() => navigate(`/w/${workspaceId}/setup`)}
                        title={currentWorkspace?.metaConnected ? "Conectado - Clique para reconfigurar" : "Desconectado - Clique para reconectar"}
                    >
                        <div className={`w-2 h-2 rounded-full ${currentWorkspace?.metaConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
                        {currentWorkspace?.metaConnected ? 'Conectado' : 'Desconectado'}
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto items-center flex-wrap xl:flex-nowrap">
                    
                    {/* Objectives Filter */}
                    <div className="relative" ref={objDropdownRef}>
                        <button 
                            onClick={() => setIsObjDropdownOpen(!isObjDropdownOpen)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                                selectedObjectives.length > 0 
                                ? 'bg-primary text-white border-primary' 
                                : 'bg-card-dark border-border-dark text-text-secondary hover:text-white hover:bg-white/5'
                            }`}
                        >
                             <span className="material-symbols-outlined text-sm">filter_alt</span>
                             {selectedObjectives.length === 0 ? 'Objetivos' : `${selectedObjectives.length} Selecionados`}
                             <span className="material-symbols-outlined text-xs">expand_more</span>
                        </button>
                        
                        {isObjDropdownOpen && (
                            <div className="absolute top-full mt-2 left-0 w-64 bg-card-dark border border-border-dark rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="text-[10px] font-bold text-text-secondary uppercase mb-2 px-2 pt-2">Filtrar por Objetivo</div>
                                <div className="max-h-60 overflow-y-auto space-y-1">
                                    {ALL_OBJECTIVES.map(obj => (
                                        <button 
                                            key={obj}
                                            onClick={() => toggleObjective(obj)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                                                selectedObjectives.includes(obj) 
                                                ? 'bg-primary/20 text-white' 
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <div className={`w-3 h-3 rounded-full border ${selectedObjectives.includes(obj) ? 'bg-primary border-primary' : 'border-slate-500'}`}></div>
                                            {obj.replace('OUTCOME_', '')}
                                        </button>
                                    ))}
                                </div>
                                <div className="border-t border-border-dark mt-2 pt-2">
                                    <button 
                                        onClick={() => setSelectedObjectives([])}
                                        className="w-full text-center text-xs text-text-secondary hover:text-white py-1"
                                    >
                                        Limpar Filtros
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Date Filters */}
                    <div className="bg-card-dark p-1 rounded-lg border border-border-dark flex items-center overflow-x-auto max-w-full">
                        {[
                            { id: 'last_7d', label: '7d' },
                            { id: 'last_30d', label: '30d' },
                            { id: 'this_month', label: 'Mês Atual' },
                            { id: 'last_month', label: 'Mês Anterior' }
                        ].map((d) => (
                            <button 
                                key={d.id}
                                onClick={() => handleDatePreset(d.id as DateRangePreset)} 
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                                    dateRange === d.id 
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'text-text-secondary hover:text-white'
                                }`}
                            >
                                {d.label}
                            </button>
                        ))}
                        <button 
                             onClick={() => handleDatePreset('custom')}
                             className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                                 dateRange === 'custom' 
                                 ? 'bg-primary text-white shadow-sm' 
                                 : 'text-text-secondary hover:text-white'
                             }`}
                        >
                            {dateRange === 'custom' && <span className="material-symbols-outlined text-[14px]">calendar_month</span>}
                            Custom
                        </button>
                    </div>

                    {/* Level Filter */}
                    <div className="bg-card-dark p-1 rounded-lg border border-border-dark flex items-center overflow-x-auto max-w-full">
                         {[
                            { id: 'campaign', label: 'Campanha' },
                            { id: 'adset', label: 'Conjunto' },
                            { id: 'ad', label: 'Anúncio' }
                        ].map((l) => (
                            <button 
                                key={l.id}
                                onClick={() => setViewLevel(l.id as ViewLevel)} 
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                                    viewLevel === l.id 
                                    ? 'bg-primary text-white shadow-sm' 
                                    : 'text-text-secondary hover:text-white'
                                }`}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="secondary" 
                            className="h-[38px] text-xs shrink-0 bg-card-dark border-border-dark hover:bg-white/5" 
                            onClick={() => window.print()}
                        >
                            <span className="material-symbols-outlined text-sm">print</span> Exportar (PDF)
                        </Button>
                        <button 
                            onClick={handleRefresh}
                            disabled={isLoading || isRefreshing}
                            className="w-[38px] h-[38px] bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 active:scale-95"
                            title="Atualizar Dados"
                        >
                             <span className={`material-symbols-outlined text-xl ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* KPIs */}
            <KpiGrid>
                <KpiCard 
                    label="Investimento" 
                    value={parseFloat(stats?.spend || 0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})} 
                    trend="up"
                    subValue="+12.5%"
                    icon="payments"
                    isLoading={isLoading && !isRefreshing} 
                />
                 {/* Mensagens KPI */}
                <KpiCard 
                    label="Conversas Iniciadas" 
                    value={totalMessages.toLocaleString()} 
                    trend="up"
                    icon="chat"
                    isLoading={isLoading && !isRefreshing} 
                />
                 {/* Custo por Conversa KPI */}
                <KpiCard 
                    label="Custo por Conversa" 
                    value={globalCostPerConversation.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})} 
                    trend={globalCostPerConversation > 10 ? 'down' : 'up'}
                    icon="savings"
                    isLoading={isLoading && !isRefreshing} 
                />
                <KpiCard 
                    label="Vendas (Purchases)" 
                    value={totalSales.toString()} 
                    trend="up"
                    subValue="+8.2%"
                    icon="shopping_cart"
                    isLoading={isLoading && !isRefreshing} 
                />
                <KpiCard 
                    label="ROAS" 
                    value={`${globalRoas.toFixed(2)}x`} 
                    subValue={globalRoas > 2 ? 'Saudável' : 'Atenção'}
                    trend={globalRoas > 2 ? 'up' : 'down'}
                    icon="monitoring"
                    isLoading={isLoading && !isRefreshing} 
                />
                 <KpiCard 
                    label="CTR" 
                    value={`${parseFloat(stats?.ctr || 0).toFixed(2)}%`} 
                    icon="touch_app"
                    isLoading={isLoading && !isRefreshing} 
                />
            </KpiGrid>

            {/* Trend Chart */}
            <ChartContainer 
                title={`Tendência de Investimento (${dateRange === 'custom' ? 'Customizado' : dateRange.replace('_', ' ').toUpperCase()})`} 
                data={trendData} 
                isLoading={isLoading && !isRefreshing} 
                yAxisLabel="Investimento (BRL)"
            />
            
            {/* Table */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        Performance por {viewLevel === 'campaign' ? 'Campanha' : viewLevel === 'adset' ? 'Conjunto de Anúncios' : 'Anúncio'}
                    </h3>
                </div>
                <DataTable data={filteredCampaigns} isLoading={isLoading && !isRefreshing} />
            </div>

            {/* Date Modal */}
            <Modal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)} title="Data Customizada">
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
                    <Button variant="ghost" onClick={() => setIsDateModalOpen(false)}>Cancelar</Button>
                    <Button onClick={applyCustomDate} disabled={!tempCustomDates.start || !tempCustomDates.end}>Aplicar</Button>
                </div>
            </Modal>
        </div>
    </AppShell>
  );
};

// ... Rest of the file unchanged
const AdDetailsPage = ({ workspaces, sdkReady }: { workspaces: Workspace[], sdkReady: boolean }) => {
    // ... AdDetailsPage implementation
    const { workspaceId, level, objectId } = useParams();
    const [adData, setAdData] = useState<any>(null);
    const [creativeData, setCreativeData] = useState<any>(null);
    const [insights, setInsights] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateMode, setDateMode] = useState<'preset' | 'custom'>('preset');
    const [timeRange, setTimeRange] = useState<'last_7d' | 'last_30d' | 'this_month' | 'last_month'>('last_30d');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
    const [tempCustomDates, setTempCustomDates] = useState({ start: '', end: '' });
    const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

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
             if (dateMode === 'custom' && (!customDates.start || !customDates.end)) return;
             if (!sdkReady) return; 
             
            const token = await SecureKV.getWorkspaceToken(workspaceId!);
            if (!token || !window.FB) {
                // Demo fallback
                if (workspaceId === 'wk_demo') {
                    setAdData({ 
                        name: '[ADS4][O VESTIDO QUE TRANSFORMA][VIDEO] - 08-12-25',
                        campaign: { name: 'Campaign 1', objective: 'OUTCOME_SALES' },
                        preview_shareable_link: 'https://facebook.com' 
                    });
                    setCreativeData({
                        type: 'VIDEO',
                        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
                        imageUrl: 'https://picsum.photos/seed/picsum/500/500'
                    });
                    setInsights({
                        spend: 150.50,
                        impressions: 4300,
                        clicks: 120,
                        ctr: 2.79,
                        cpm: 35.00,
                        cpc: 1.25,
                        purchase_roas: [{ value: 4.5 }],
                        actions: [{ action_type: 'purchase', value: 5 }]
                    });
                    setLoading(false);
                    return;
                }
                if (sdkReady) setLoading(false);
                return;
            }

            setLoading(true);

            if (level === 'ad') {
                window.FB.api(
                    `/${objectId}`,
                    'GET',
                    { 
                        fields: 'name,preview_shareable_link,campaign{objective,name},creative{thumbnail_url,image_url,video_url,object_story_spec,object_type}',
                        access_token: token 
                    },
                    (response: any) => {
                        if (response && !response.error) {
                            setAdData(response);
                            if (response.campaign?.objective) setSelectedObjectives([response.campaign.objective]);
                            const creative = response.creative;
                            if (creative) {
                                let videoUrl = creative.video_url;
                                let imageUrl = creative.image_url || creative.thumbnail_url;
                                if (!videoUrl && creative.object_story_spec?.video_data?.file_url) videoUrl = creative.object_story_spec.video_data.file_url;
                                if (!imageUrl && creative.object_story_spec?.video_data?.image_url) imageUrl = creative.object_story_spec.video_data.image_url;
                                setCreativeData({ videoUrl, imageUrl, type: videoUrl ? 'VIDEO' : 'IMAGE' });
                            }
                        }
                    }
                );
            } else {
                setAdData({ name: 'Detalhes indisponíveis para este nível' });
            }

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
                    if (response && !response.error && response.data.length > 0) setInsights(response.data[0]);
                    else setInsights(null);
                    setLoading(false);
                }
            );
        };
        fetchDetails();
    }, [workspaceId, objectId, level, dateMode, timeRange, customDates, sdkReady]);

    const formatCurrency = (val: string) => parseFloat(val || '0').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatNumber = (val: string) => parseInt(val || '0').toLocaleString('pt-BR');
    const toggleObjective = (obj: string) => setSelectedObjectives(prev => prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]);
    const toggleAllObjectives = () => setSelectedObjectives(selectedObjectives.length === ALL_OBJECTIVES.length ? [] : ALL_OBJECTIVES);
    const handleApplyCustomDates = () => { if (tempCustomDates.start && tempCustomDates.end) { setCustomDates(tempCustomDates); setDateMode('custom'); setIsCustomDateModalOpen(false); }};
    const handlePresetClick = (preset: any) => { setDateMode('preset'); setTimeRange(preset); };

    return (
        <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId}>
            <div className="max-w-7xl mx-auto py-8 px-6 print-full-width">
                {/* Header & Filter */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 no-print">
                    <div>
                        <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                            <Link to={`/w/${workspaceId}/dashboard`} className="hover:text-white">Dashboard</Link>
                            <span>/</span>
                            <span>Detalhes do Anúncio</span>
                        </div>
                        <h1 className="text-3xl font-black text-white">{loading ? 'Carregando...' : (adData?.name || 'Anúncio')}</h1>
                        {adData?.campaign && <span className="text-sm text-text-secondary">Campanha: {adData.campaign.name}</span>}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                         {/* Date Filters */}
                        <div className="flex bg-card-dark rounded-lg p-1 border border-border-dark">
                            <button onClick={() => handlePresetClick('last_7d')} className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${dateMode === 'preset' && timeRange === 'last_7d' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}>7d</button>
                            <button onClick={() => handlePresetClick('last_30d')} className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${dateMode === 'preset' && timeRange === 'last_30d' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}>30d</button>
                            <button onClick={() => handlePresetClick('this_month')} className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${dateMode === 'preset' && timeRange === 'this_month' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}>Mês Atual</button>
                            <button onClick={() => setIsCustomDateModalOpen(true)} className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-colors ${dateMode === 'custom' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white'}`}>Custom</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="overflow-hidden bg-black border-border-dark shadow-2xl">
                            <div className="p-4 border-b border-white/10 flex justify-between items-center"><h3 className="font-bold text-white text-sm">Criativo do Anúncio</h3><Badge variant={creativeData?.type === 'VIDEO' ? 'info' : 'gray'}>{creativeData?.type === 'VIDEO' ? 'Vídeo' : 'Imagem'}</Badge></div>
                            <div className="aspect-square bg-black flex items-center justify-center relative">
                                {loading ? <Skeleton className="w-full h-full" /> : creativeData ? (creativeData.type === 'VIDEO' ? <video src={creativeData.videoUrl} controls className="w-full h-full object-contain" poster={creativeData.imageUrl}/> : <img src={creativeData.imageUrl} alt="Ad Creative" className="w-full h-full object-contain" />) : <div className="text-text-secondary text-sm flex flex-col items-center gap-2"><span className="material-symbols-outlined text-3xl">image_not_supported</span>Preview indisponível</div>}
                            </div>
                            {/* Ad Link Button */}
                             <div className="p-4 border-t border-white/10 bg-white/5">
                                 {adData?.preview_shareable_link ? (
                                     <a 
                                         href={adData.preview_shareable_link} 
                                         target="_blank" 
                                         rel="noopener noreferrer" 
                                         className="flex items-center justify-center gap-2 w-full py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-bold text-sm"
                                     >
                                         <span className="material-symbols-outlined text-lg">public</span>
                                         Ver Anúncio no Facebook
                                     </a>
                                 ) : (
                                     <div className="text-center text-xs text-text-secondary">Link direto indisponível</div>
                                 )}
                             </div>
                        </Card>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[{ label: 'Valor Gasto', value: formatCurrency(insights?.spend), color: 'emerald' }, { label: 'Impressões', value: formatNumber(insights?.impressions), color: 'primary' }, { label: 'Cliques', value: formatNumber(insights?.clicks), color: 'blue' }, { label: 'CTR', value: `${parseFloat(insights?.ctr || 0).toFixed(2)}%`, color: 'indigo' }, { label: 'CPM', value: `R$ ${parseFloat(insights?.cpm || 0).toFixed(2)}`, color: 'purple' }, { label: 'CPC', value: `R$ ${parseFloat(insights?.cpc || 0).toFixed(2)}`, color: 'pink' }, { label: 'Purchase ROAS', value: insights?.purchase_roas?.[0]?.value ? parseFloat(insights.purchase_roas[0].value).toFixed(2) : 'N/A', color: 'amber' }, { label: 'Sales', value: insights?.actions?.find((a:any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 'N/A', color: 'rose' }].map((k, i) => (
                                <Card key={i} className="p-4 hover:border-primary/50 transition-colors">
                                    <p className="text-xs text-text-secondary uppercase font-bold mb-1">{k.label}</p>
                                    {loading ? <Skeleton className="h-6 w-20" /> : <p className={`text-xl font-bold text-${k.color === 'emerald' ? 'emerald-400' : 'white'}`}>{k.value}</p>}
                                </Card>
                            ))}
                         </div>
                         <Card className="p-6 min-h-[300px]">
                            <h3 className="text-white font-bold mb-4">Análise de Performance</h3>
                            <div className="w-full h-64 bg-background-dark/50 rounded-lg flex items-center justify-center border border-dashed border-border-dark text-text-secondary"><span className="text-sm">Gráficos detalhados seriam renderizados aqui para o ID: {objectId}</span></div>
                         </Card>
                    </div>
                </div>
                <Modal isOpen={isCustomDateModalOpen} onClose={() => setIsCustomDateModalOpen(false)} title="Selecionar Período Customizado">
                    <div className="space-y-4">
                        <p className="text-text-secondary text-sm">Selecione o intervalo de datas para análise:</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2"><label className="text-xs font-bold text-white uppercase tracking-wider">Data Início</label><input type="date" className="bg-background-dark border border-border-dark rounded-lg p-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm" value={tempCustomDates.start} onChange={(e) => setTempCustomDates(prev => ({...prev, start: e.target.value}))}/></div>
                            <div className="flex flex-col gap-2"><label className="text-xs font-bold text-white uppercase tracking-wider">Data Fim</label><input type="date" className="bg-background-dark border border-border-dark rounded-lg p-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm" value={tempCustomDates.end} onChange={(e) => setTempCustomDates(prev => ({...prev, end: e.target.value}))}/></div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsCustomDateModalOpen(false)}>Cancelar</Button><Button onClick={handleApplyCustomDates} disabled={!tempCustomDates.start || !tempCustomDates.end}>Aplicar Filtro</Button></div>
                </Modal>
            </div>
        </AppShell>
    );
};

// ... Rest of the file unchanged (WorkspaceSetupRoute, App component)
const WorkspaceSetupRoute = ({ workspaces, onUpdateWorkspace, sdkReady }: { workspaces: Workspace[], onUpdateWorkspace: (w: Workspace) => void, sdkReady: boolean }) => {
    const { workspaceId } = useParams();
    const wk = workspaces.find(w => w.id === workspaceId);
    if (!wk) return <Navigate to="/workspaces" replace />;
    return <SetupWizard workspace={wk} onUpdateWorkspace={onUpdateWorkspace} sdkReady={sdkReady} />;
};

const App: React.FC = () => {
    const [sdkReady, setSdkReady] = useState(false);
    // Initial workspace state loaded from localStorage or default
    const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
        const saved = localStorage.getItem('sys:workspaces');
        return saved ? JSON.parse(saved) : [{ id: 'wk_demo', name: 'Alpha Team (Demo)', metaConnected: true }];
    });

    useEffect(() => {
        localStorage.setItem('sys:workspaces', JSON.stringify(workspaces));
    }, [workspaces]);

    useEffect(() => {
        // Force HTTPS for Facebook SDK compatibility (except localhost dev environment)
        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            window.location.replace(`https://${window.location.host}${window.location.pathname}${window.location.search}`);
            return;
        }

        const initSDK = async () => {
            const config = await SecureKV.getMetaConfig();
            const appId = config?.appId; 

            if (!appId) {
                setSdkReady(false);
                return;
            }

            // Function to initialize
            const launch = () => {
                window.FB.init({
                  appId      : appId,
                  cookie     : true,
                  xfbml      : true,
                  version    : 'v19.0'
                });
                setSdkReady(true);
            };

            if (window.FB) {
                launch();
            } else {
                 // Define callback
                // @ts-ignore
                window.fbAsyncInit = launch;
                
                // Only inject if not already there
                if (!document.getElementById('facebook-jssdk')) {
                     (function(d, s, id){
                        var js, fjs = d.getElementsByTagName(s)[0];
                        if (d.getElementById(id)) { return; }
                        js = d.createElement(s) as HTMLScriptElement;
                        js.id = id;
                        js.src = "https://connect.facebook.net/en_US/sdk.js";
                        if (fjs && fjs.parentNode) fjs.parentNode.insertBefore(js, fjs);
                    }(document, 'script', 'facebook-jssdk'));
                }
            }
        };

        initSDK();

        const handleConfigChange = () => {
            initSDK();
        };

        window.addEventListener('sys_config_change', handleConfigChange);
        return () => window.removeEventListener('sys_config_change', handleConfigChange);
    }, []);

    const createWorkspace = (name: string) => {
        const newWk: Workspace = {
            id: `wk_${Math.floor(Math.random() * 10000)}`,
            name,
            metaConnected: false
        };
        setWorkspaces([...workspaces, newWk]);
    };

    const updateWorkspace = (updated: Workspace) => {
        setWorkspaces(prev => prev.map(w => w.id === updated.id ? updated : w));
    };

    return (
        <Routes>
            <Route path="/workspaces" element={<WorkspacesPage workspaces={workspaces} onCreateWorkspace={createWorkspace} />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/w/:workspaceId/setup" element={<WorkspaceSetupRoute workspaces={workspaces} onUpdateWorkspace={updateWorkspace} sdkReady={sdkReady} />} />
            <Route path="/w/:workspaceId/dashboard" element={<DashboardPage workspaces={workspaces} sdkReady={sdkReady} />} />
            <Route path="/w/:workspaceId/ads/:level/:objectId" element={<AdDetailsPage workspaces={workspaces} sdkReady={sdkReady} />} />
            <Route path="/" element={<Navigate to="/workspaces" replace />} />
            <Route path="*" element={<Navigate to="/workspaces" replace />} />
        </Routes>
    );
};

export default App;
