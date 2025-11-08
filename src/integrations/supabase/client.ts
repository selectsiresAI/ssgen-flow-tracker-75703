import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js';
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
  if (typeof process !== 'undefined' && typeof process.env !== 'undefined') {
    const value = process.env[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  const metaValue = readFromImportMeta(key);
  if (typeof metaValue === 'string' && metaValue.length > 0) {
    return metaValue;
  }

  const globalValue = readFromGlobalThis(key);
  if (typeof globalValue === 'string' && globalValue.length > 0) {
    return globalValue;
  }

  return undefined;
};

const getFirstAvailableEnvVar = (keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = getEnvVar(key);
    if (value) {
      return value;
    }
  }

  return undefined;
};

export const SUPABASE_URL =
  getFirstAvailableEnvVar([
    'NEXT_PUBLIC_SUPABASE_URL',
    'VITE_SUPABASE_URL',
    'SUPABASE_URL',
  ]) ?? '';

export const SUPABASE_ANON_KEY =
  getFirstAvailableEnvVar([
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY',
  ]) ?? '';

const hasCustomSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const isUsingDefaultSupabaseConfig = !hasCustomSupabaseConfig;

const createMissingConfigProxy = (): SupabaseClient<Database> => {
  const message =
    'Supabase não está configurado. Defina NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY ou VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY no ambiente do projeto.';

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

  const hasBrowserStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

  const authOptions: SupabaseClientOptions<Database>['auth'] = {
    persistSession: hasBrowserStorage,
    autoRefreshToken: hasBrowserStorage,
  };

  if (hasBrowserStorage) {
    authOptions.storage = window.localStorage;
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: authOptions,
  });
};

export const supabase = createSupabaseClient();
