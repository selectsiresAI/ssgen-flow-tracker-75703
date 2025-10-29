import { supabase } from '@/integrations/supabase/client';

export interface SLAConfig {
  id: string;
  etapa: string;
  dias_alvo: number;
  cor_dentro_prazo: string;
  cor_dia_zero: string;
  cor_fora_prazo: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchSLAConfigs(): Promise<SLAConfig[]> {
  const { data, error } = await supabase
    .from('sla_config')
    .select('*')
    .eq('ativo', true)
    .order('etapa');

  if (error) throw error;
  return data || [];
}

export async function updateSLAConfig(id: string, updates: Partial<SLAConfig>): Promise<void> {
  const { error } = await supabase
    .from('sla_config')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function createSLAConfig(config: Omit<SLAConfig, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  const { error } = await supabase
    .from('sla_config')
    .insert([config]);

  if (error) throw error;
}

export async function deleteSLAConfig(id: string): Promise<void> {
  const { error } = await supabase
    .from('sla_config')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
