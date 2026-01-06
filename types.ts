
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
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  cpc: number;
  roas?: number;
  cpa?: number;
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
}

export interface APICampaignResponse {
  id: string;
  name: string;
  insights?: {
    data: APIGeneralInsights[];
  }
}

export interface APIDailyTrend {
  spend: string;
  date_start: string;
}
