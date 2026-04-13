import { supabase } from '../lib/supabase';

export const metaConfigService = {
  save: async (appId: string, appSecret: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('meta_app_config')
      .upsert(
        { owner_id: user.id, app_id: appId, app_secret: appSecret, updated_at: new Date().toISOString() },
        { onConflict: 'owner_id' }
      );
    if (error) throw error;
  },

  getAppId: async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('meta_app_config')
      .select('app_id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[Supabase] Error getting app ID:', error);
      return null;
    }
    return data?.app_id ?? null;
  },

  isConfigured: async (): Promise<boolean> => {
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) return false;

    const { data, error } = await supabase
      .from('meta_app_config')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();
      
    if (error) return false;
    return !!data;
  },
};
