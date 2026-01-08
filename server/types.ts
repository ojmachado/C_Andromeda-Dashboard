
// --- Estruturas Criptográficas ---

export interface EncryptedBlob {
  keyId: string; // Identificador da chave (ex: 'v1') para rotação
  blob: string;  // Base64: [IV (12)] + [TAG (16)] + [Ciphertext]
}

// --- Estruturas de Plaintext (O que será criptografado) ---

export interface MetaAppSecretPlain {
  appSecret: string;
}

export interface WorkspaceTokenPlain {
  accessToken: string;
  tokenType?: string; // ex: 'bearer'
}

// --- Estruturas KV (O que é salvo no Redis) ---

// Key: meta_app_config
export interface KVMetaAppConfig {
  appId: string;
  secretEnc: EncryptedBlob;
  updatedAt: number;
}

// Key: meta_token:{workspaceId}
export interface KVMetaToken {
  tokenEnc: EncryptedBlob;
  expiresAt: number; // Timestamp absoluto em ms
  updatedAt: number;
}

// Key: meta_selected:{workspaceId}
export interface KVMetaSelected {
  businessId: string | null;
  adAccountId: string;
  currency?: string | null;
  timezone?: string | null;
  updatedAt: number;
}
