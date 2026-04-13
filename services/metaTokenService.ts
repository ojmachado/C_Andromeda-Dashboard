import { supabase } from '../lib/supabase';

export const metaTokenService = {
  save: async (workspaceId: string, accessToken: string) => {
    const { error } = await supabase
      .from('meta_tokens')
      .upsert(
        { workspace_id: workspaceId, access_token: accessToken, updated_at: new Date().toISOString() },
        { onConflict: 'workspace_id' }
      );
    if (error) throw error;
  },

  get: async (workspaceId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('meta_tokens')
      .select('access_token')
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    // Se não encontrou tokens, apenas retorne null
    if (error && error.code !== 'PGRST116') {
      console.error('[Supabase] Error getting token:', error);
      return null;
    }
    return data?.access_token ?? null;
  },

  delete: async (workspaceId: string) => {
    const { error } = await supabase
      .from('meta_tokens')
      .delete()
      .eq('workspace_id', workspaceId);
    if (error) throw error;
  },
};
