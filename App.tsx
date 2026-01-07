
import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from './components/Navigation';
import { Button, Card, Badge, Skeleton, Modal } from './components/UI';
import { KpiCard, KpiGrid, ChartContainer, DataTable } from './components/DashboardItems';
import { SecureKV } from './utils/kv';
import { IntegrationsPage, WorkspacesPage, SetupWizard } from './components/SaaSPages';
import { AdDetailsPage } from './components/AdDetailsPage';
import { ActivityLogsPage } from './components/ActivityLogsPage';
import { CustomReportsPage } from './components/CustomReportsPage';
import { TeamManagementPage } from './components/TeamManagement';
import { AccountSettingsPage } from './components/AccountSettingsPage';
import { LoginPage } from './components/LoginPage';
import { SharedReportPage } from './components/SharedReportPage';
import { DashboardTemplateSelector } from './components/DashboardTemplates';
import { DashboardShareModal } from './components/DashboardShareModal';
import { SharedWorkspaceDashboard } from './components/SharedWorkspaceDashboard';
import type { Workspace, InsightData, DateRangePreset, APIGeneralInsights, DashboardTemplate, KpiConfig } from './types';

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

// --- Dedicated Template Selection Page ---
const TemplatesPage = ({ workspaces }: { workspaces: Workspace[] }) => {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const [currentTemplate, setCurrentTemplate] = useState<DashboardTemplate>(SecureKV.getWorkspaceTemplate(workspaceId || ''));

    const handleTemplateChange = (template: DashboardTemplate) => {
        if (workspaceId) {
            SecureKV.saveWorkspaceTemplate(workspaceId, template.id);
            setCurrentTemplate(template);
            // Navigate back to dashboard after selection
            navigate(`/w/${workspaceId}/dashboard`);
        }
    };

    return (
        <AppShell workspaces={workspaces} activeWorkspaceId={workspaceId}>
            <div className="max-w-[1400px] mx-auto py-8 px-6 space-y-8 h-full flex flex-col">
                <div className="flex flex-col gap-2 border-b border-border-dark pb-6">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Galeria de Templates</h1>
                    <p className="text-text-secondary text-sm">Escolha o layout de métricas ideal para o objetivo do seu negócio.</p>
                </div>
                <div className="flex-1 min-h-0">
                    <DashboardTemplateSelector 
                        currentTemplateId={currentTemplate.id}
                        onSelect={handleTemplateChange}
                    />
                </div>
            </div>
        </AppShell>
    );
};

const DashboardPage = ({ workspaces, onUpdateWorkspace, sdkReady }: { workspaces: Workspace[], onUpdateWorkspace: (w: Workspace) => void, sdkReady: boolean }) => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const currentWorkspace = workspaces.find(w => w.id === workspaceId);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<InsightData[]>([]);
  const [trendData, setTrendData] = useState<{date: string, value: number}[]>([]);
  
  // Template State
  const [currentTemplate, setCurrentTemplate] = useState<DashboardTemplate>(SecureKV.getWorkspaceTemplate(workspaceId || ''));
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Sharing State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Filter States
  const [dateRange, setDateRange] = useState<DateRangePreset>('last_30d');
  const [viewLevel, setViewLevel] = useState<ViewLevel>('campaign'); // Level Filter State
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [tempCustomDates, setTempCustomDates] = useState({ start: '', end: '' });

  // Objective Filter
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [isObjDropdownOpen, setIsObjDropdownOpen] = useState(false);
  const objDropdownRef = useRef<HTMLDivElement>(null);
  
  // Request tracking to prevent race conditions
  const requestRef = useRef<number>(0);

  // Load Template Preference on Mount
  useEffect(() => {
      if (workspaceId) {
          const tpl = SecureKV.getWorkspaceTemplate(workspaceId);
          setCurrentTemplate(tpl);
      }
  }, [workspaceId]);

  const handleTemplateChange = (template: DashboardTemplate) => {
      if (workspaceId) {
          SecureKV.saveWorkspaceTemplate(workspaceId, template.id);
          setCurrentTemplate(template);
          setIsTemplateModalOpen(false);
      }
  };

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

      const requestId = Date.now();
      requestRef.current = requestId;

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
             if (requestRef.current !== requestId) return;

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
                     { action_type: 'onsite_conversion.messaging_conversation_started_7d', value: 45 },
                     { action_type: 'lead', value: 89 },
                     { action_type: 'add_to_cart', value: 156 }
                 ]
             });

             // Construct Demo Data based on View Level
             let demoItems: InsightData[] = [];
             
             if (viewLevel === 'ad') {
                 demoItems = [
                     { id: 'ad1', name: 'Instagram Post: Promoção Natal', status: 'ACTIVE', objective: 'OUTCOME_TRAFFIC', spend: 749.73, impressions: 52569, clicks: 800, ctr: 2.90, cpm: 14.0, cpc: 0.49, roas: 4.2, cpa: 12.50, messages: 32, costPerConversation: 23.42, adPreviewLink: 'https://facebook.com', fbLink: 'https://facebook.com', igLink: 'https://instagram.com', campaignName: '[LRM][TRAFEGO][PERFIL][CBO][NATAL]', campaignDetailsLink: `#/w/${workspaceId}/ads/campaign/c1` },
                     { id: 'ad2', name: 'Reels: Branding Video V2', status: 'PAUSED', objective: 'OUTCOME_AWARENESS', spend: 299.23, impressions: 20569, clicks: 440, ctr: 2.1, cpm: 14.5, cpc: 0.68, roas: 1.5, cpa: 45.00, messages: 13, costPerConversation: 23.01, campaignName: '[INSTITUCIONAL][BRANDING][2024]', fbLink: 'https://facebook.com', igLink: 'https://instagram.com', campaignDetailsLink: `#/w/${workspaceId}/ads/campaign/c2` },
                     { id: 'ad3', name: 'Carrossel: LAL 1%', status: 'ACTIVE', objective: 'OUTCOME_SALES', adPreviewLink: 'https://facebook.com', fbLink: 'https://facebook.com', spend: 500.00, impressions: 9500, clicks: 200, ctr: 2.1, cpm: 52.6, cpc: 2.50, roas: 5.5, cpa: 25.00, messages: 5, costPerConversation: 100, campaignName: '[CONVERSAO][LAL 1%][COMPRADORES]', campaignDetailsLink: `#/w/${workspaceId}/ads/campaign/c3` },
                     { id: 'ad4', name: 'Story: Teste Copy A', status: 'PAUSED', objective: 'OUTCOME_TRAFFIC', spend: 0, impressions: 0, clicks: 0, ctr: 0, cpm: 0, cpc: 0, roas: 0, cpa: 0, messages: 0, costPerConversation: 0, campaignName: '[TESTE][SEM ENTREGA]', campaignDetailsLink: `#/w/${workspaceId}/ads/campaign/c4` }
                 ];
             } else if (viewLevel === 'adset') {
                 demoItems = [
                     { id: 'as1', name: 'Conjunto: Aberto - Brasil', status: 'ACTIVE', objective: 'OUTCOME_TRAFFIC', spend: 349.73, impressions: 25000, clicks: 400, ctr: 1.6, cpm: 14.0, cpc: 0.87, roas: 2.2, cpa: 12.50, messages: 15, costPerConversation: 23.42, campaignName: '[LRM][TRAFEGO][PERFIL][CBO][NATAL]', campaignDetailsLink: `#/w/${workspaceId}/ads/campaign/c1` },
                     { id: 'as2', name: 'Conjunto: Lookalike 1%', status: 'ACTIVE', objective: 'OUTCOME_SALES', spend: 400.00, impressions: 27569, clicks: 400, ctr: 1.45, cpm: 14.0, cpc: 1.0, roas: 3.5, cpa: 12.50, messages: 17, costPerConversation: 23.42, campaignName: '[LRM][TRAFEGO][PERFIL][CBO][NATAL]', campaignDetailsLink: `#/w/${workspaceId}/ads/campaign/c1` },
                     { id: 'as3', name: 'Conjunto: Interesses (Marketing)', status: 'PAUSED', objective: 'OUTCOME_AWARENESS', spend: 299.23, impressions: 20569, clicks: 440, ctr: 2.1, cpm: 14.5, cpc: 0.68, roas: 1.5, cpa: 45.00, messages: 13, costPerConversation: 23.01, campaignName: '[INSTITUCIONAL][BRANDING][2024]', campaignDetailsLink: `#/w/${workspaceId}/ads/campaign/c2` },
                     { id: 'as4', name: 'Conjunto: Remarketing 30D', status: 'ACTIVE', objective: 'OUTCOME_SALES', spend: 100.00, impressions: 4500, clicks: 100, ctr: 2.2, cpm: 22.0, cpc: 1.0, roas: 8.0, cpa: 10.00, messages: 2, costPerConversation: 50.00, campaignName: '[CONVERSAO][LAL 1%][COMPRADORES]', campaignDetailsLink: `#/w/${workspaceId}/ads/campaign/c3` }
                 ];
             } else {
                 // Campaign View
                 demoItems = [
                     { id: 'c1', name: '[LRM][TRAFEGO][PERFIL][CBO][NATAL]', status: 'ACTIVE', objective: 'OUTCOME_TRAFFIC', spend: 749.73, impressions: 52569, clicks: 800, ctr: 2.90, cpm: 14.0, cpc: 0.49, roas: 4.2, cpa: 12.50, messages: 32, costPerConversation: 23.42, adPreviewLink: 'https://facebook.com' },
                     { id: 'c2', name: '[INSTITUCIONAL][BRANDING][2024]', status: 'PAUSED', objective: 'OUTCOME_AWARENESS', spend: 299.23, impressions: 20569, clicks: 440, ctr: 2.1, cpm: 14.5, cpc: 0.68, roas: 1.5, cpa: 45.00, messages: 13, costPerConversation: 23.01, },
                     { id: 'c3', name: '[CONVERSAO][LAL 1%][COMPRADORES]', status: 'ACTIVE', objective: 'OUTCOME_SALES', adPreviewLink: 'https://facebook.com', spend: 500.00, impressions: 9500, clicks: 200, ctr: 2.1, cpm: 52.6, cpc: 2.50, roas: 5.5, cpa: 25.00, messages: 5, costPerConversation: 100 },
                     { id: 'c4', name: '[TESTE][SEM ENTREGA]', status: 'PAUSED', objective: 'OUTCOME_TRAFFIC', spend: 0, impressions: 0, clicks: 0, ctr: 0, cpm: 0, cpc: 0, roas: 0, cpa: 0, messages: 0, costPerConversation: 0 }
                 ];
             }

             const processedDemoItems = demoItems.map(c => ({
                 ...c, 
                 detailsLink: `#/w/${workspaceId}/ads/${viewLevel}/${c.id}`
             }));
             
             // Show all demo data regardless of impressions
             setCampaigns(processedDemoItems);
             
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
      
      // 2. Metadata List (Campaigns/AdSets/Ads) - NO Insights here to avoid N+1
      // Dynamic Path based on View Level Filter
      const levelPath = viewLevel === 'adset' ? 'adsets' : viewLevel === 'ad' ? 'ads' : 'campaigns';
      
      // Dynamic fields based on view level
      let listFields = 'id,name,status';
      if (viewLevel === 'campaign') listFields += ',objective';
      if (viewLevel === 'adset') listFields += ',campaign{id,objective,name}'; // Added campaign ID for linking
      // Updated: fetch effective_object_story_id and creative permalinks for FB/IG splitting
      if (viewLevel === 'ad') listFields += ',campaign{id,objective,name},preview_shareable_link,effective_object_story_id,creative{instagram_permalink_url}'; 

      const p2 = new Promise<any>((resolve) => {
          window.FB.api(`/${accountId}/${levelPath}`, { 
              access_token: token, 
              fields: listFields,
              limit: 1000 // Large limit to capture all active items
          }, (res: any) => resolve(res));
      });

      // 3. Batched Insights (Single call using 'level' param)
      const p3_insights = new Promise<any>((resolve) => {
          window.FB.api(`/${accountId}/insights`, {
             access_token: token,
             level: viewLevel, // Uses the current level filter
             fields: 'campaign_id,adset_id,ad_id,spend,impressions,clicks,ctr,cpm,cpc,actions,purchase_roas',
             limit: 1000,
             ...apiTimeParams
          }, (res: any) => resolve(res));
      });

      // 4. Daily Trend (Spend)
      const p4 = new Promise<any>((resolve) => {
          window.FB.api(`/${accountId}/insights`, { 
              access_token: token, 
              fields: 'spend,date_start',
              time_increment: 1,
              ...apiTimeParams
          }, (res: any) => resolve(res));
      });

      try {
          const [insightsRes, metadataRes, levelInsightsRes, trendRes] = await Promise.all([p1, p2, p3_insights, p4]);
      
          // Prevent race conditions: if a new request started, ignore this one
          if (requestRef.current !== requestId) return;

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

          // Process Metadata & Merge with Insights
          if (metadataRes && metadataRes.data) {
              const metadataItems = metadataRes.data;
              
              // Create a Map of Insights for O(1) lookup
              const insightsMap = new Map();
              if (levelInsightsRes && levelInsightsRes.data) {
                  levelInsightsRes.data.forEach((item: any) => {
                      // Determine key based on level
                      let key;
                      if (viewLevel === 'campaign') key = item.campaign_id;
                      else if (viewLevel === 'adset') key = item.adset_id;
                      else if (viewLevel === 'ad') key = item.ad_id;
                      
                      if(key) insightsMap.set(key, item);
                  });
              }

              const formatted = metadataItems.map((c: any) => {
                  // Get insight from map or default to empty
                  const i: any = insightsMap.get(c.id) || {};
                  
                  const spend = parseFloat(i.spend || '0');
                  const impressions = parseInt(i.impressions || '0');
                  
                  const purchaseAction = i.actions?.find((a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase');
                  const purchases = purchaseAction ? parseFloat(purchaseAction.value) : 0;
                  const roasVal = i.purchase_roas?.[0]?.value ? parseFloat(i.purchase_roas[0].value) : 0;
                  const cpa = purchases > 0 ? spend / purchases : 0;
                  
                  // Conversions: Check both onsite_conversion.messaging_conversation_started_7d AND messaging_conversation_started_7d
                  const messages = 
                      getActionVal(i.actions, 'onsite_conversion.messaging_conversation_started_7d') || 
                      getActionVal(i.actions, 'messaging_conversation_started_7d');
                      
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

                  // Determine Social Links
                  // FB: Use effective_object_story_id to construct permalink or fallback to generic shareable link
                  const fbLink = c.effective_object_story_id 
                      ? `https://www.facebook.com/${c.effective_object_story_id}` 
                      : c.preview_shareable_link;
                  
                  // IG: Use specific creative permalink
                  const igLink = c.creative?.instagram_permalink_url;

                  return {
                      id: c.id,
                      name: c.name,
                      campaignName,
                      campaignDetailsLink,
                      status: c.status,
                      objective: objective,
                      adPreviewLink: c.preview_shareable_link || undefined,
                      fbLink,
                      igLink,
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
              
              setCampaigns(formatted);
          } else {
              setCampaigns([]);
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
      } catch (e) {
          console.error("Fetch failed", e);
          if (requestRef.current === requestId) {
             setCampaigns([]);
             setStats(null);
          }
      } finally {
          if (requestRef.current === requestId) {
              loadingState(false);
          }
      }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId, sdkReady, workspaces, dateRange, customDates, viewLevel]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // Helper: Get value for dynamic KPI
  const getKpiValue = (key: string): { value: string, subValue?: string, trend: 'up' | 'down' | 'neutral' } => {
      const getAction = (type: string) => {
          if (!stats?.actions) return 0;
          const a = stats.actions.find((x: any) => x.action_type === type);
          return a ? parseFloat(a.value) : 0;
      };

      let val = 0;
      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      let subValue = undefined;

      switch(key) {
          case 'spend':
              val = parseFloat(stats?.spend || '0');
              trend = 'up';
              subValue = '+12.5%';
              break;
          case 'roas':
              val = parseFloat(stats?.purchase_roas?.[0]?.value || '0');
              trend = val > 2 ? 'up' : 'down';
              subValue = val > 2 ? 'Saudável' : 'Atenção';
              break;
          case 'purchases':
              val = getAction('purchase') || getAction('offsite_conversion.fb_pixel_purchase');
              trend = 'up';
              break;
          case 'leads':
              val = getAction('lead') || getAction('on_facebook_lead');
              trend = 'up';
              break;
          case 'add_to_cart':
              val = getAction('add_to_cart') || getAction('offsite_conversion.fb_pixel_add_to_cart');
              trend = 'up';
              break;
          case 'messages':
              val = getAction('onsite_conversion.messaging_conversation_started_7d') || getAction('messaging_conversation_started_7d');
              trend = 'up';
              break;
          case 'cpa': 
              {
                  const sales = getAction('purchase') || getAction('offsite_conversion.fb_pixel_purchase');
                  const spend = parseFloat(stats?.spend || '0');
                  val = sales > 0 ? spend / sales : 0;
                  trend = val > 50 ? 'down' : 'up';
              }
              break;
          case 'cpl':
              {
                  const leads = getAction('lead') || getAction('on_facebook_lead');
                  const spend = parseFloat(stats?.spend || '0');
                  val = leads > 0 ? spend / leads : 0;
                  trend = 'neutral';
              }
              break;
          case 'cost_per_message':
              {
                  const msgs = getAction('onsite_conversion.messaging_conversation_started_7d') || getAction('messaging_conversation_started_7d');
                  const spend = parseFloat(stats?.spend || '0');
                  val = msgs > 0 ? spend / msgs : 0;
                  trend = 'neutral';
              }
              break;
          case 'impressions':
              val = parseInt(stats?.impressions || '0');
              trend = 'up';
              break;
          case 'clicks':
              val = parseInt(stats?.clicks || '0');
              trend = 'neutral';
              break;
          case 'ctr':
              val = parseFloat(stats?.ctr || '0');
              trend = val > 1 ? 'up' : 'down';
              break;
          case 'cpc':
              val = parseFloat(stats?.cpc || '0');
              trend = 'neutral';
              break;
          case 'cpm':
              val = parseFloat(stats?.cpm || '0');
              trend = 'down';
              break;
          case 'frequency':
              // Frequency isn't usually in overview without special query, using mock fallback or approximation
              const impr = parseInt(stats?.impressions || '0');
              const reach = parseInt(stats?.reach || impr * 0.8); // approximation if reach missing
              val = reach > 0 ? impr / reach : 1;
              break;
          case 'aov':
              {
                  // Mock AOV or try to calculate if value exists
                  val = 0; // Not easily available without action values breakdown in this context
              }
              break;
          default:
              val = 0;
      }

      // Formatting
      const kpiConfig = currentTemplate.kpis.find(k => k.key === key);
      let formatted = val.toString();
      
      if (kpiConfig?.format === 'currency') formatted = val.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
      else if (kpiConfig?.format === 'percent') formatted = `${val.toFixed(2)}%`;
      else if (kpiConfig?.format === 'multiplier') formatted = `${val.toFixed(2)}x`;
      else if (kpiConfig?.format === 'number') formatted = val.toLocaleString('pt-BR');

      // Adjust trend color logic based on config
      if (kpiConfig?.trendCheck) {
          if (kpiConfig.trendCheck === 'low_is_good') {
              // Inverse logic (e.g., CPA, CPM)
              // This is a simple visual toggle, in a real app would compare to prev period
              if (trend === 'up') trend = 'down'; 
              else if (trend === 'down') trend = 'up';
          }
      }

      return { value: formatted, subValue, trend };
  };

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
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Dashboard</h1>
                            <button 
                                onClick={() => navigate(`/w/${workspaceId}/templates`)}
                                className="px-2 py-1 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 group"
                                title="Alterar Layout do Dashboard"
                            >
                                <span className="material-symbols-outlined text-[16px] text-primary group-hover:scale-110 transition-transform">dashboard_customize</span>
                                <span className="text-[10px] font-bold text-slate-600 dark:text-text-secondary uppercase tracking-wider">{currentTemplate.name}</span>
                            </button>
                        </div>
                        <p className="text-text-secondary text-sm">Visão unificada de performance do Meta Ads.</p>
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
                        <button 
                            onClick={() => setIsShareModalOpen(true)}
                            className="flex items-center gap-2 h-[38px] px-3 bg-transparent border border-border-dark hover:bg-border-dark/50 hover:border-primary/50 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">share</span> Compartilhar
                        </button>
                        <Button 
                            variant="secondary" 
                            className="h-[38px] text-xs shrink-0 bg-card-dark border-border-dark hover:bg-white/5" 
                            onClick={() => window.print()}
                        >
                            <span className="material-symbols-outlined text-sm">print</span> Exportar
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
            
            {/* Dynamic KPIs based on Template */}
            <KpiGrid>
                {currentTemplate.kpis.map((kpi: KpiConfig) => {
                    const data = getKpiValue(kpi.key);
                    return (
                        <KpiCard 
                            key={kpi.key}
                            label={kpi.label} 
                            value={data.value} 
                            trend={data.trend}
                            subValue={data.subValue}
                            icon={kpi.icon}
                            isLoading={isLoading && !isRefreshing} 
                        />
                    );
                })}
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
                {/* viewLevel passed here ensures correct headers */}
                <DataTable data={filteredCampaigns} isLoading={isLoading && !isRefreshing} viewLevel={viewLevel} />
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

            {/* Template Selector Modal - REMOVED from here, now a separate page */}
            {/* Share Modal */}
            <DashboardShareModal 
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                workspace={currentWorkspace}
                onUpdateWorkspace={onUpdateWorkspace}
            />
        </div>
    </AppShell>
  );
};

const WorkspaceSetupWrapper = ({ workspaces, onUpdate, sdkReady }: { workspaces: Workspace[], onUpdate: (w: Workspace) => void, sdkReady: boolean }) => {
    const { workspaceId } = useParams();
    const workspace = workspaces.find(w => w.id === workspaceId);
    
    if (!workspace) return <Navigate to="/workspaces" />;
    
    return <SetupWizard workspace={workspace} onUpdateWorkspace={onUpdate} sdkReady={sdkReady} />;
};

const ProtectedRoute = ({ children, isAuthenticated }: { children?: React.ReactNode, isAuthenticated: boolean }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

const App = () => {
    const [sdkReady, setSdkReady] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Initialize with a demo workspace for better UX upon first load
    const [workspaces, setWorkspaces] = useState<Workspace[]>([
        { id: 'wk_demo', name: 'Demo Store', metaConnected: false }
    ]);

    useEffect(() => {
        const checkAuth = () => {
            const session = SecureKV.getSession();
            if (session && session.email) {
                setIsAuthenticated(true);
            }
            setIsCheckingAuth(false);
        };
        checkAuth();
    }, []);

    useEffect(() => {
        const initSDK = async () => {
            const config = await SecureKV.getMetaConfig();
            
            // Setup Global Callback
            window.fbAsyncInit = function() {
                window.FB.init({
                    appId: config?.appId || '',
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
                setSdkReady(true);
            };

            // Load Script
            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) { return; }
                js = d.createElement(s) as HTMLScriptElement; js.id = id;
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                if (fjs && fjs.parentNode) {
                    fjs.parentNode.insertBefore(js, fjs);
                } else {
                    d.head.appendChild(js);
                }
            }(document, 'script', 'facebook-jssdk'));
        };

        initSDK();
    }, []);

    const handleCreateWorkspace = (name: string) => {
        const newWk: Workspace = {
            id: `wk_${Date.now()}`,
            name,
            metaConnected: false
        };
        setWorkspaces([...workspaces, newWk]);
    };

    const handleUpdateWorkspace = (updated: Workspace) => {
        setWorkspaces(prev => prev.map(w => w.id === updated.id ? updated : w));
    };

    if (isCheckingAuth) return <div className="h-screen bg-background-dark"></div>;

    return (
        <Routes>
            {/* Public Shared Routes */}
            <Route path="/s/:shareId" element={<SharedReportPage />} />
            <Route path="/shared/dashboard/:shareId" element={<SharedWorkspaceDashboard />} />

            {/* Public Login Route */}
            <Route path="/login" element={
                isAuthenticated ? <Navigate to="/workspaces" replace /> : <LoginPage onLogin={() => setIsAuthenticated(true)} />
            } />

            {/* Protected Routes */}
            <Route path="/" element={<Navigate to="/workspaces" replace />} />
            
            <Route path="/workspaces" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <WorkspacesPage workspaces={workspaces} onCreateWorkspace={handleCreateWorkspace} />
                </ProtectedRoute>
            } />
            
            <Route path="/integrations" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <IntegrationsPage />
                </ProtectedRoute>
            } />
            
            <Route path="/account" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <AccountSettingsPage workspaces={workspaces} />
                </ProtectedRoute>
            } />
            
            <Route path="/w/:workspaceId/dashboard" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <DashboardPage workspaces={workspaces} onUpdateWorkspace={handleUpdateWorkspace} sdkReady={sdkReady} />
                </ProtectedRoute>
            } />

            <Route path="/w/:workspaceId/templates" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <TemplatesPage workspaces={workspaces} />
                </ProtectedRoute>
            } />
            
            <Route path="/w/:workspaceId/setup" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <WorkspaceSetupWrapper workspaces={workspaces} onUpdate={handleUpdateWorkspace} sdkReady={sdkReady} />
                </ProtectedRoute>
            } />
            
            <Route path="/w/:workspaceId/ads/:level/:adId" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <AdDetailsPage workspaces={workspaces} />
                </ProtectedRoute>
            } />
            
            <Route path="/w/:workspaceId/logs" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <ActivityLogsPage workspaces={workspaces} />
                </ProtectedRoute>
            } />
            
            <Route path="/w/:workspaceId/reports" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <CustomReportsPage workspaces={workspaces} />
                </ProtectedRoute>
            } />

            <Route path="/w/:workspaceId/team" element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <TeamManagementPage workspaces={workspaces} />
                </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default App;