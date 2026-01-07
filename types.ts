
export enum SetupStep {
  Connect = 0,
  Business = 1,
  AdAccount = 2,
  InsightsTest = 3,
  Finished = 4
}

export interface Workspace {
  id: string;
  name: string;
  metaConnected: boolean;
  adAccountId?: string;
  businessId?: string;
}

export interface MetaBusiness {
  id: string;
  name: string;
}

export interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone_name: string;
  status: number;
}

export interface InsightData {
  id?: string;
  name: string;
  status?: string;
  objective?: string; // New: Campaign Objective
  adPreviewLink?: string; // New: Link to Ad
  detailsLink?: string; // New: Internal Link to Details
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  roas: number;
  cpa: number;
  messages: number;
  costPerConversation: number;
}

export interface AdminConfig {
  appId: string;
  isSecretSet: boolean;
  redirectUri: string;
  appDomain: string;
}

// Interfaces de Resposta da API
export interface APIGeneralInsights {
  spend: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpm: string;
  cpc: string;
  date_start: string;
  date_stop: string;
  purchase_roas?: { value: string }[];
  cost_per_action_type?: { action_type: string, value: string }[];
  actions?: { action_type: string, value: string }[];
}

export interface APICampaignResponse {
  id: string;
  name: string;
  status: string;
  objective?: string;
  insights?: {
    data: APIGeneralInsights[];
  }
}

export interface APIDailyTrend {
  spend: string;
  date_start: string;
}

export type DateRangePreset = 'last_7d' | 'last_30d' | 'this_month' | 'last_month' | 'custom';
