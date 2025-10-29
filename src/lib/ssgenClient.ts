import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Profile, PowerRow } from '@/types/ssgen';

const safeEnv = (k: string): string | undefined => {
  const pe = typeof process !== 'undefined' && (process as any).env ? (process as any).env[k] : undefined;
  if (pe) return pe as string;
  const ime = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env[k] : undefined;
  if (ime) return ime as string;
  const glb = (globalThis as any)?.[k];
  if (glb) return glb as string;
  return undefined;
};

const SUPABASE_URL = safeEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = safeEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export async function getProfile(): Promise<Profile | null> {
  if (!supabase) return { id: 'local', email: 'mock@local', role: 'ADM' };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.rpc('my_profile');
  if (error) {
    console.error(error);
    return null;
  }
  return data as Profile;
}

export async function fetchOrders(): Promise<PowerRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('vw_orders_powerbi').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return (data as any[]).map((r) => ({ ...r }));
}

export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
