
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
  currency: string;
  timezone_name: string;
  status: number;
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
  campaignName?: string; // Context for Ad/AdSet levels
  campaignDetailsLink?: string; // New: Link to parent campaign
  status?: string;
  objective?: string;
  adPreviewLink?: string;
  detailsLink?: string;
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

export interface AdCreativeData {
  id: string;
  name: string;
  title: string;
  body: string;
  image_url?: string;
  thumbnail_url?: string;
  object_story_spec?: any;
  call_to_action_type?: string;
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
  action_values?: { action_type: string, value: string }[];
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
  date_stop: string;
}

export type DateRangePreset = 'last_7d' | 'last_30d' | 'this_month' | 'last_month' | 'custom';

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'SYNC';
  resource: string;
  details: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
}
