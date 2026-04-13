import { supabase } from '../lib/supabase';
import type { CustomReport } from '../types';

export const reportsService = {
  list: async (workspaceId: string): Promise<CustomReport[]> => {
    const { data, error } = await supabase
      .from('custom_reports')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      author: r.author,
      type: r.type,
      config: r.config,
      isPublic: r.is_public,
      shareId: r.share_id,
      lastEdited: r.updated_at,
    }));
  },

  create: async (workspaceId: string, report: Omit<CustomReport, 'id' | 'lastEdited'>): Promise<CustomReport> => {
    const { data, error } = await supabase
      .from('custom_reports')
      .insert({
        workspace_id: workspaceId,
        name: report.name,
        author: report.author,
        type: report.type,
        config: report.config,
        is_public: report.isPublic || false,
        share_id: report.shareId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      author: data.author,
      type: data.type,
      config: data.config,
      isPublic: data.is_public,
      shareId: data.share_id,
      lastEdited: data.updated_at,
    };
  },

  update: async (id: string, patch: Partial<CustomReport>): Promise<CustomReport> => {
    const payload: any = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.config !== undefined) payload.config = patch.config;
    if (patch.isPublic !== undefined) payload.is_public = patch.isPublic;
    if (patch.shareId !== undefined) payload.share_id = patch.shareId;

    const { data, error } = await supabase
      .from('custom_reports')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      author: data.author,
      type: data.type,
      config: data.config,
      isPublic: data.is_public,
      shareId: data.share_id,
      lastEdited: data.updated_at,
    };
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('custom_reports').delete().eq('id', id);
    if (error) throw error;
  },

  getByShareId: async (shareId: string): Promise<any> => {
    const { data, error } = await supabase
      .from('custom_reports')
      .select('*, workspaces(ad_account_id)')
      .eq('share_id', shareId)
      .eq('is_public', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      report: {
        id: data.id,
        name: data.name,
        author: data.author,
        type: data.type,
        config: data.config,
        isPublic: data.is_public,
        shareId: data.share_id,
        lastEdited: data.updated_at,
      },
      adAccountId: data.workspaces?.ad_account_id,
      workspaceId: data.workspace_id,
    };
  },
};
