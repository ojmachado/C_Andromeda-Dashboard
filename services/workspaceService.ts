import { supabase } from '../lib/supabase';
import type { Workspace } from '../types';

export const workspaceService = {
  list: async () => {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    
    // Map camelCase for frontend compatibility
    return (data || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      metaConnected: w.meta_connected,
      adAccountId: w.ad_account_id,
      businessId: w.business_id,
      preferredTemplateId: w.preferred_template_id,
      sharedConfig: {
        isEnabled: w.share_enabled,
        shareId: w.share_id || '',
      }
    })) as Workspace[];
  },

  create: async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, owner_id: user.id })
      .select()
      .single();
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      metaConnected: data.meta_connected,
      adAccountId: data.ad_account_id,
      businessId: data.business_id,
      preferredTemplateId: data.preferred_template_id,
      sharedConfig: {
        isEnabled: data.share_enabled,
        shareId: data.share_id || '',
      }
    } as Workspace;
  },

  update: async (id: string, patch: any) => {
    // Map from camelCase patch to snake_case payload
    const payload: any = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.metaConnected !== undefined) payload.meta_connected = patch.metaConnected;
    if (patch.adAccountId !== undefined) payload.ad_account_id = patch.adAccountId;
    if (patch.businessId !== undefined) payload.business_id = patch.businessId;
    if (patch.preferredTemplateId !== undefined) payload.preferred_template_id = patch.preferredTemplateId;
    
    if (patch.sharedConfig !== undefined) {
      payload.share_enabled = patch.sharedConfig.isEnabled;
      payload.share_id = patch.sharedConfig.shareId;
    }

    const { data, error } = await supabase
      .from('workspaces')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      metaConnected: data.meta_connected,
      adAccountId: data.ad_account_id,
      businessId: data.business_id,
      preferredTemplateId: data.preferred_template_id,
      sharedConfig: {
        isEnabled: data.share_enabled,
        shareId: data.share_id || '',
      }
    } as Workspace;
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (error) throw error;
  },

  getByShareId: async (shareId: string) => {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id, name, ad_account_id')
      .eq('share_id', shareId)
      .eq('share_enabled', true)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
