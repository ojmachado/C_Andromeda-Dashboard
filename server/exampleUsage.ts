
import { 
  setMetaAppConfig, 
  getMetaAppConfigDecrypted, 
  setWorkspaceToken, 
  getWorkspaceToken,
  setWorkspaceSelected,
  getWorkspaceSelected
} from './secretsStore.kv';

// Mock de variáveis de ambiente para execução local deste arquivo
if (!process.env.MASTER_KEY_CURRENT) {
  process.env.MASTER_KEY_CURRENT = 'my_super_secure_development_secret_key_123';
  process.env.MASTER_KEY_ID = 'v1';
}

async function main() {
  const WORKSPACE_ID = 'ws_demo_123';

  console.log('🔒 Iniciando teste de Secrets Store...\n');

  // 1. Configuração Admin (App Secret)
  console.log('--- 1. Admin: Configuração Global ---');
  await setMetaAppConfig('1234567890', 'sk_live_very_secret_facebook_key');
  console.log('✅ Configuração salva (criptografada).');

  const appConfig = await getMetaAppConfigDecrypted();
  if (appConfig) {
    console.log('🔓 Configuração lida:');
    console.log(`   App ID: ${appConfig.appId}`);
    console.log(`   App Secret: ${appConfig.appSecret.substring(0, 4)}...******`); // Never log full secret
  }

  // 2. Token do Workspace
  console.log('\n--- 2. Workspace: Token OAuth ---');
  const expiresAt = Date.now() + (3600 * 1000); // 1 hora
  
  await setWorkspaceToken(WORKSPACE_ID, {
    accessToken: 'EAAB...sensitive_access_token_value...',
    tokenType: 'bearer',
    expiresAt
  });
  console.log(`✅ Token salvo para ${WORKSPACE_ID} com TTL.`);

  const token = await getWorkspaceToken(WORKSPACE_ID);
  if (token) {
    console.log('🔓 Token recuperado:');
    console.log(`   Access Token: ${token.accessToken.substring(0, 10)}...`);
  } else {
    console.log('❌ Token não encontrado ou expirado.');
  }

  // 3. Seleção do Workspace (Plaintext)
  console.log('\n--- 3. Workspace: Contexto Selecionado ---');
  await setWorkspaceSelected(WORKSPACE_ID, {
    businessId: 'bm_999888',
    adAccountId: 'act_555444',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo'
  });
  console.log('✅ Seleção salva (plaintext).');
  
  const selection = await getWorkspaceSelected(WORKSPACE_ID);
  console.log('📄 Seleção recuperada:', selection);
}

// Executar se chamado diretamente
main().catch(console.error);
