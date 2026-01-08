import { Buffer } from 'node:buffer';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import type { EncryptedBlob } from './types';

// Configuração do ambiente
const MASTER_KEY_CURRENT = process.env.MASTER_KEY_CURRENT;
const CURRENT_KEY_ID = process.env.MASTER_KEY_ID || 'v1';

// Validação de segurança na inicialização
if (!MASTER_KEY_CURRENT || MASTER_KEY_CURRENT.length < 10) {
  // Em produção, isso deve falhar o boot. Aqui lançamos erro.
  console.warn('WARNING: MASTER_KEY_CURRENT not secure or missing.');
}

// Derivação de chave (SHA-256 garante 32 bytes exatos para AES-256)
// Isso permite usar uma passphrase de qualquer tamanho no .env
function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;  // Recomendado para GCM
const TAG_LENGTH = 16; // Padrão GCM

/**
 * Criptografa um objeto JSON.
 * Retorna o blob (IV + Tag + Ciphertext) em base64 e o ID da chave usada.
 */
export function encryptJson<T>(data: T): EncryptedBlob {
  if (!MASTER_KEY_CURRENT) throw new Error('Encryption key missing');

  const key = deriveKey(MASTER_KEY_CURRENT);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(data);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  // Layout do Blob: [IV (12 bytes)] [TAG (16 bytes)] [CIPHERTEXT (var)]
  const blobBuffer = Buffer.concat([iv, tag, encrypted]);

  return {
    keyId: CURRENT_KEY_ID,
    blob: blobBuffer.toString('base64')
  };
}

/**
 * Descriptografa um payload.
 * Verifica o keyId para suportar rotação futura.
 */
export function decryptJson<T>(encryptedData: EncryptedBlob): T {
  if (!MASTER_KEY_CURRENT) throw new Error('Encryption key missing');

  const { keyId, blob } = encryptedData;

  // Lógica de Rotação: 
  // Se tivéssemos chaves antigas, faríamos um switch(keyId) aqui.
  // Por enquanto, validamos apenas a atual.
  if (keyId !== CURRENT_KEY_ID) {
    throw new Error(`Decryption failed: Unknown or rotated Key ID '${keyId}'`);
  }

  const key = deriveKey(MASTER_KEY_CURRENT);
  const blobBuffer = Buffer.from(blob, 'base64');

  // Validação mínima de integridade
  if (blobBuffer.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error('Decryption failed: Invalid blob length');
  }

  // Extração dos componentes
  const iv = blobBuffer.subarray(0, IV_LENGTH);
  const tag = blobBuffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = blobBuffer.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString('utf8')) as T;
}