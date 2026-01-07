
import type { UserProfile } from '../types';

const KEYS = {
  META_CONFIG: 'sys:meta_config',
  TOKEN_PREFIX: 'wk:meta_token:',
  CONTEXT_PREFIX: 'wk:meta_context:',
  MASTER_PWD: 'sys:master_hash', // Simulated hash storage
  AUTH_SESSION: 'sys:auth_session',
  USER_PROFILE: 'sys:user_profile'
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

  clearAll: () => {
      localStorage.clear();
      window.dispatchEvent(new Event('sys_logout'));
  },

  // Deprecated stub
  rotateMasterKey: async () => {
    return true;
  }
};
