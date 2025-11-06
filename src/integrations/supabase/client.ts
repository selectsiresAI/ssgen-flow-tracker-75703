import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const readFromImportMeta = (key: string): string | undefined => {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
    return metaEnv?.[key];
  } catch {
    return undefined;
  }
};

const readFromGlobalThis = (key: string): string | undefined => {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }

  const value = (globalThis as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
};

const getEnvVar = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && typeof process.env !== 'undefined' && process.env[key]) {
    return process.env[key];
  }

  const metaValue = readFromImportMeta(key);
  if (metaValue) {
    return metaValue;
  }

  const globalValue = readFromGlobalThis(key);
  if (globalValue) {
    return globalValue;
  }

  return undefined;
};

export const SUPABASE_URL = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const createMissingConfigProxy = (): SupabaseClient<Database> => {
  const message = 'Supabase não está configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente do projeto.';

  const handler: ProxyHandler<any> = {
    get: () => proxy,
    apply: () => {
      throw new Error(message);
    },
  };

  const proxy = new Proxy(() => {
    throw new Error(message);
  }, handler);

  return proxy as unknown as SupabaseClient<Database>;
};

const createSupabaseClient = (): SupabaseClient<Database> => {
  if (!isSupabaseConfigured) {
    if (typeof console !== 'undefined') {
      console.warn('Supabase configuration missing. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    return createMissingConfigProxy();
  }

  return createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
};

export const supabase = createSupabaseClient();
