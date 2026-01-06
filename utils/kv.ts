
const KEYS = {
  META_CONFIG: 'sys:meta_config',
  TOKEN_PREFIX: 'wk:meta_token:',
  CONTEXT_PREFIX: 'wk:meta_context:',
};

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

  // Deprecated stub
  rotateMasterKey: async () => {
    return true;
  }
};
