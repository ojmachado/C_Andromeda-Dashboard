import { supabase } from '../lib/supabase';

type ActionType = 'CREATE_WORKSPACE' | 'UPDATE_WORKSPACE' | 'DELETE_WORKSPACE'
  | 'CONNECT_META' | 'DISCONNECT_META' | 'EXPORT_REPORT' | 'LOGIN' | 'LOGOUT';

export const activityService = {
  log: async (action: ActionType, resource: string, workspaceId?: string, details?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('activity_logs').insert({
        user_id: user?.id || null,
        workspace_id: workspaceId || null,
        action,
        resource,
        details: details || null,
        status: 'SUCCESS',
      });
    } catch (e) {
      console.warn('[ActivityService] Failed to log activity:', e);
      // Fire-and-forget — não bloqueia UX
    }
  },
};
