
import { kv } from '@vercel/kv';
import { encryptJson, decryptJson } from './crypto';
import type { 
  KVMetaAppConfig, 
  KVMetaToken, 
  KVMetaSelected, 
  MetaAppSecretPlain, 
  WorkspaceTokenPlain 
} from './types';

/**
 * Armazena configuração global do App (Admin)
 * App Secret é criptografado.
 */
export async function setMetaAppConfig(appId: string, appSecret: string): Promise<void> {
  const secretData: MetaAppSecretPlain = { appSecret };
  const encrypted = encryptJson(secretData);

  const payload: KVMetaAppConfig = {
    appId,
    secretEnc: encrypted,
    updatedAt: Date.now()
  };

  await kv.set('meta_app_config', payload);
}

/**
 * Recupera configuração global descriptografada
 */
export async function getMetaAppConfigDecrypted(): Promise<{ appId: string, appSecret: string } | null> {
  const data = await kv.get<KVMetaAppConfig>('meta_app_config');
  if (!data) return null;

  try {
    const decrypted = decryptJson<MetaAppSecretPlain>(data.secretEnc);
    return {
      appId: data.appId,
      appSecret: decrypted.appSecret
    };
  } catch (error) {
    console.error('Failed to decrypt meta app config:', error);
    return null;
  }
}

/**
 * Armazena Token do Workspace com Criptografia e TTL
 */
export async function setWorkspaceToken(
  workspaceId: string, 
  tokenData: WorkspaceTokenPlain & { expiresAt: number }
): Promise<void> {
  const { expiresAt, ...sensitive } = tokenData;
  const encrypted = encryptJson(sensitive);

  const payload: KVMetaToken = {
    tokenEnc: encrypted,
    expiresAt,
    updatedAt: Date.now()
  };

  const key = `meta_token:${workspaceId}`;
  
  // Calcular TTL em segundos. 
  // Se o token expira no passado ou agora, define 1s para limpar logo.
  const now = Date.now();
  const ttlSeconds = Math.max(1, Math.floor((expiresAt - now) / 1000));

  // Salva com expiração automática (EX)
  await kv.set(key, payload, { ex: ttlSeconds });
}

/**
 * Recupera Token do Workspace descriptografado
 */
export async function getWorkspaceToken(workspaceId: string): Promise<WorkspaceTokenPlain | null> {
  const key = `meta_token:${workspaceId}`;
  const data = await kv.get<KVMetaToken>(key);

  if (!data) return null;

  // Double check de expiração (caso clock skew)
  if (Date.now() > data.expiresAt) {
    return null; 
  }

  try {
    return decryptJson<WorkspaceTokenPlain>(data.tokenEnc);
  } catch (error) {
    console.error(`Failed to decrypt token for workspace ${workspaceId}:`, error);
    return null;
  }
}

/**
 * Armazena Seleção de Conta (Plaintext)
 */
export async function setWorkspaceSelected(
  workspaceId: string, 
  selected: Omit<KVMetaSelected, 'updatedAt'>
): Promise<void> {
  const key = `meta_selected:${workspaceId}`;
  
  const payload: KVMetaSelected = {
    ...selected,
    updatedAt: Date.now()
  };

  await kv.set(key, payload);
}

/**
 * Recupera Seleção de Conta
 */
export async function getWorkspaceSelected(workspaceId: string): Promise<KVMetaSelected | null> {
  const key = `meta_selected:${workspaceId}`;
  return await kv.get<KVMetaSelected>(key);
}
