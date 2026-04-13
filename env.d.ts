/// <reference types="vite/client" />

/**
 * Tipagem das variáveis de ambiente do Andromeda Dashboard.
 * Prefixo VITE_ obrigatório para o Vite injetar no bundle.
 *
 * Adicione novas variáveis aqui ao criar no .env.local e .env.example
 */
interface ImportMetaEnv {
  // Supabase
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;

  // Meta / Facebook (apenas App ID público)
  readonly VITE_META_APP_ID: string;

  // Aplicação
  readonly VITE_APP_URL: string;
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';

  // Feature Flags
  readonly VITE_USE_SUPABASE: string;  // "true" | "false"
  readonly VITE_DEMO_MODE: string;     // "true" | "false"
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
