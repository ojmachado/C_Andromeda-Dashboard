
import type { UserProfile, CustomReport, DashboardTemplate, Workspace } from '../types';

const KEYS = {
  META_CONFIG: 'sys:meta_config',
  TOKEN_PREFIX: 'wk:meta_token:',
  CONTEXT_PREFIX: 'wk:meta_context:',
  TEMPLATE_PREF_PREFIX: 'wk:template:',
  SHARED_DASH_PREFIX: 'wk:share_config:',
  MASTER_PWD: 'sys:master_hash', // Simulated hash storage
  AUTH_SESSION: 'sys:auth_session',
  USER_PROFILE: 'sys:user_profile',
  REPORTS_PREFIX: 'wk:reports:'
};

// --- TEMPLATE DEFINITIONS ---
export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
    {
        id: 'tpl_general',
        name: 'Visão Geral (Padrão)',
        description: 'Um mix equilibrado de investimento, tráfego e conversões principais.',
        category: 'general',
        icon: 'dashboard',
        kpis: [
            { key: 'spend', label: 'Investimento', icon: 'payments', format: 'currency', trendCheck: 'low_is_good' },
            { key: 'roas', label: 'ROAS', icon: 'monitoring', format: 'multiplier', trendCheck: 'high_is_good' },
            { key: 'purchases', label: 'Vendas', icon: 'shopping_cart', format: 'number', trendCheck: 'high_is_good' },
            { key: 'cpa', label: 'CPA', icon: 'savings', format: 'currency', trendCheck: 'low_is_good' },
            { key: 'ctr', label: 'CTR', icon: 'touch_app', format: 'percent', trendCheck: 'high_is_good' },
            { key: 'cpc', label: 'CPC', icon: 'ads_click', format: 'currency', trendCheck: 'low_is_good' }
        ]
    },
    {
        id: 'tpl_ecom',
        name: 'E-commerce & Vendas',
        description: 'Focado em retorno financeiro, ROAS e custo por compra.',
        category: 'ecom',
        icon: 'storefront',
        kpis: [
            { key: 'roas', label: 'ROAS', icon: 'monetization_on', format: 'multiplier', trendCheck: 'high_is_good' },
            { key: 'purchases', label: 'Compras', icon: 'shopping_bag', format: 'number', trendCheck: 'high_is_good' },
            { key: 'cpa', label: 'Custo por Compra', icon: 'sell', format: 'currency', trendCheck: 'low_is_good' },
            { key: 'spend', label: 'Valor Gasto', icon: 'wallet', format: 'currency', trendCheck: 'low_is_good' },
            { key: 'aov', label: 'Ticket Médio', icon: 'receipt_long', format: 'currency', trendCheck: 'high_is_good' }, // Requires custom calculation support
            { key: 'add_to_cart', label: 'Add. Carrinho', icon: 'add_shopping_cart', format: 'number', trendCheck: 'high_is_good' }
        ]
    },
    {
        id: 'tpl_leads',
        name: 'Geração de Leads',
        description: 'Monitoramento de cadastros, custo por lead e volume de contatos.',
        category: 'leads',
        icon: 'contact_mail',
        kpis: [
            { key: 'leads', label: 'Leads Totais', icon: 'group_add', format: 'number', trendCheck: 'high_is_good' },
            { key: 'cpl', label: 'Custo por Lead', icon: 'money_off', format: 'currency', trendCheck: 'low_is_good' },
            { key: 'messages', label: 'Mensagens Iniciadas', icon: 'chat', format: 'number', trendCheck: 'high_is_good' },
            { key: 'cost_per_message', label: 'Custo por Msg', icon: 'forum', format: 'currency', trendCheck: 'low_is_good' },
            { key: 'ctr', label: 'CTR', icon: 'percent', format: 'percent', trendCheck: 'high_is_good' },
            { key: 'spend', label: 'Investimento', icon: 'payments', format: 'currency', trendCheck: 'low_is_good' }
        ]
    },
    {
        id: 'tpl_awareness',
        name: 'Branding & Alcance',
        description: 'Foco em visibilidade, frequência e impressões.',
        category: 'awareness',
        icon: 'campaign',
        kpis: [
            { key: 'impressions', label: 'Impressões', icon: 'visibility', format: 'number', trendCheck: 'high_is_good' },
            { key: 'cpm', label: 'CPM', icon: 'price_change', format: 'currency', trendCheck: 'low_is_good' },
            { key: 'frequency', label: 'Frequência', icon: 'repeat', format: 'multiplier', trendCheck: 'low_is_good' }, // Need logic for ideal frequency
            { key: 'spend', label: 'Investimento', icon: 'payments', format: 'currency', trendCheck: 'low_is_good' },
            { key: 'clicks', label: 'Cliques', icon: 'mouse', format: 'number', trendCheck: 'high_is_good' },
            { key: 'cpc', label: 'CPC', icon: 'ads_click', format: 'currency', trendCheck: 'low_is_good' }
        ]
    },
    {
        id: 'tpl_traffic',
        name: 'Tráfego do Site',
        description: 'Acompanhe CTR, CPC e volume de visitantes únicos.',
        category: 'traffic',
        icon: 'ads_click',
        kpis: [
            { key: 'clicks', label: 'Cliques no Link', icon: 'mouse', format: 'number', trendCheck: 'high_is_good' },
            { key: 'ctr', label: 'CTR (Taxa de Clique)', icon: 'touch_app', format: 'percent', trendCheck: 'high_is_good' },
            { key: 'cpc', label: 'CPC Médio', icon: 'price_check', format: 'currency', trendCheck: 'low_is_good' },
            { key: 'spend', label: 'Investimento', icon: 'payments', format: 'currency', trendCheck: 'low_is_good' },
            { key: 'cpm', label: 'CPM', icon: 'analytics', format: 'currency', trendCheck: 'low_is_good' },
            { key: 'impressions', label: 'Impressões', icon: 'visibility', format: 'number', trendCheck: 'high_is_good' }
        ]
    }
];

const DEFAULT_REPORTS: CustomReport[] = [
    {
        id: 'def_1',
        name: 'Performance Q3 - Black Friday',
        author: 'System',
        lastEdited: 'Automático',
        type: 'line',
        config: { metrics: ['Spend Amount', 'Impressions'], dimension: 'Nome da Campanha', filters: [] }
    },
    {
        id: 'def_2',
        name: 'Análise de Criativos - Vídeo vs Imagem',
        author: 'System',
        lastEdited: 'Automático',
        type: 'pie',
        config: { metrics: ['CTR (All)'], dimension: 'Ad Format', filters: [] }
    },
    {
        id: 'def_3',
        name: 'ROAS por Campanha (Mês Atual)',
        author: 'System',
        lastEdited: 'Automático',
        type: 'table',
        config: { metrics: ['ROAS', 'Spend Amount'], dimension: 'Nome da Campanha', filters: [] }
    }
];

export const SecureKV = {
  // Removed masterKey parameter
  saveMetaConfig: async (config: { appId: string; appSecret: string }) => {
    localStorage.setItem(KEYS.META_CONFIG, JSON.stringify(config));
  },

  getMetaConfig: async () => {
    const raw = localStorage.getItem(KEYS.META_CONFIG);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  saveWorkspaceToken: async (workspaceId: string, token: string) => {
    localStorage.setItem(`${KEYS.TOKEN_PREFIX}${workspaceId}`, JSON.stringify({ accessToken: token }));
  },

  getWorkspaceToken: async (workspaceId: string) => {
    const raw = localStorage.getItem(`${KEYS.TOKEN_PREFIX}${workspaceId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw).accessToken;
    } catch (e) {
      return null;
    }
  },

  saveWorkspaceContext: (workspaceId: string, data: { adAccountId?: string; businessId?: string }) => {
    localStorage.setItem(`${KEYS.CONTEXT_PREFIX}${workspaceId}`, JSON.stringify(data));
  },

  getWorkspaceContext: (workspaceId: string) => {
    const raw = localStorage.getItem(`${KEYS.CONTEXT_PREFIX}${workspaceId}`);
    return raw ? JSON.parse(raw) : null;
  },

  // --- Template Management ---
  saveWorkspaceTemplate: (workspaceId: string, templateId: string) => {
      localStorage.setItem(`${KEYS.TEMPLATE_PREF_PREFIX}${workspaceId}`, templateId);
  },

  getWorkspaceTemplate: (workspaceId: string): DashboardTemplate => {
      const templateId = localStorage.getItem(`${KEYS.TEMPLATE_PREF_PREFIX}${workspaceId}`);
      const template = DASHBOARD_TEMPLATES.find(t => t.id === templateId);
      return template || DASHBOARD_TEMPLATES[0]; // Default to General
  },

  // --- Workspace Sharing Management ---
  // Stores { isEnabled: boolean, shareId: string } per workspace
  getWorkspaceShareConfig: (workspaceId: string) => {
      const raw = localStorage.getItem(`${KEYS.SHARED_DASH_PREFIX}${workspaceId}`);
      return raw ? JSON.parse(raw) : null;
  },

  saveWorkspaceShareConfig: (workspaceId: string, config: { isEnabled: boolean, shareId: string }) => {
      localStorage.setItem(`${KEYS.SHARED_DASH_PREFIX}${workspaceId}`, JSON.stringify(config));
      
      // Also maintain a reverse lookup map: ShareID -> WorkspaceID
      // This is crucial for the public route to find the data
      const lookupKey = `sys:share_lookup:${config.shareId}`;
      if (config.isEnabled) {
          localStorage.setItem(lookupKey, workspaceId);
      } else {
          // If disabled, we might want to keep the key or remove it. 
          // Removing ensures it's not accessible.
          localStorage.removeItem(lookupKey);
      }
  },

  // Global Lookup for public dashboard
  getWorkspaceIdByShareToken: (shareId: string): string | null => {
      return localStorage.getItem(`sys:share_lookup:${shareId}`);
  },

  // --- Auth Utilities ---
  
  // Check if master password has been set up (first run)
  hasMasterPassword: () => {
    return !!localStorage.getItem(KEYS.MASTER_PWD);
  },

  // Set the master password (simulated hash)
  setMasterPassword: (password: string) => {
    // In a real app, use bcrypt. Here we simple store it for the demo.
    localStorage.setItem(KEYS.MASTER_PWD, btoa(password)); 
  },

  // Verify master password
  verifyMasterPassword: (password: string) => {
    const stored = localStorage.getItem(KEYS.MASTER_PWD);
    return stored === btoa(password);
  },

  // Session Management
  login: (email: string) => {
    localStorage.setItem(KEYS.AUTH_SESSION, JSON.stringify({ 
      email, 
      isMaster: email === 'ojmachadomkt@gmail.com',
      timestamp: Date.now() 
    }));
  },

  logout: () => {
    localStorage.removeItem(KEYS.AUTH_SESSION);
  },

  getSession: () => {
    const raw = localStorage.getItem(KEYS.AUTH_SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // --- User Profile Management ---
  getUserProfile: (): UserProfile => {
    const raw = localStorage.getItem(KEYS.USER_PROFILE);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch {
            // fallback
        }
    }
    
    // Default / Initial State
    const session = SecureKV.getSession();
    return {
      name: "Carlos Eduardo Silva",
      email: session?.email || "carlos.silva@andromedalabs.com",
      role: "Gestor de Tráfego",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCSHc6pLcz1rpkAACQT94UcuSwjOWZcJfiTIwZhsBtUVtdf9Aa5TtVP8tChY2XHBT53wwxDfpib3EOg53Ugsh9M8DU-qfzj8LpQrNtjs1nhJRLwjZ4qCV3cJnPqYRunEsbSjHWpdNtRkvzQZy4jMMPIvk6RlZP1asirxTVcF1goK28d5_JZbKFcC3xI6Pzo-NlBYi7noCE4mGJELT-PyD49qgDEpOJPOIhJCymprMvRyRkr9lSsnboOnbBDZRHahhxiiaHFxpZ1pO8",
      twoFactorEnabled: true,
      language: "pt-BR",
      timezone: "utc-3"
    };
  },

  saveUserProfile: (profile: UserProfile) => {
    localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    window.dispatchEvent(new Event('user_profile_updated'));
  },

  // --- Custom Reports Management ---
  getCustomReports: (workspaceId: string): CustomReport[] => {
      const key = `${KEYS.REPORTS_PREFIX}${workspaceId}`;
      const raw = localStorage.getItem(key);
      if (!raw) {
          // Seed defaults if empty
          localStorage.setItem(key, JSON.stringify(DEFAULT_REPORTS));
          return DEFAULT_REPORTS;
      }
      try {
          return JSON.parse(raw);
      } catch {
          return [];
      }
  },

  saveCustomReport: (workspaceId: string, report: CustomReport) => {
      const reports = SecureKV.getCustomReports(workspaceId);
      const index = reports.findIndex(r => r.id === report.id);
      
      if (index >= 0) {
          reports[index] = report;
      } else {
          reports.unshift(report);
      }
      
      localStorage.setItem(`${KEYS.REPORTS_PREFIX}${workspaceId}`, JSON.stringify(reports));
  },

  deleteCustomReport: (workspaceId: string, reportId: string) => {
      const reports = SecureKV.getCustomReports(workspaceId);
      const filtered = reports.filter(r => r.id !== reportId);
      localStorage.setItem(`${KEYS.REPORTS_PREFIX}${workspaceId}`, JSON.stringify(filtered));
  },

  // Simulate Global Lookup for Shared Reports
  // In a real database, this would just query by shareId.
  // Here we have to iterate all keys to find it.
  getSharedReport: (shareId: string): CustomReport | null => {
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(KEYS.REPORTS_PREFIX)) {
              const raw = localStorage.getItem(key);
              if (raw) {
                  try {
                      const reports: CustomReport[] = JSON.parse(raw);
                      const found = reports.find(r => r.shareId === shareId && r.isPublic);
                      if (found) return found;
                  } catch {}
              }
          }
      }
      return null;
  },

  clearAll: () => {
      localStorage.clear();
      window.dispatchEvent(new Event('sys_logout'));
  },

  // Deprecated stub
  rotateMasterKey: async () => {
    return true;
  }
};