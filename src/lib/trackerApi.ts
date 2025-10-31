import { supabase } from '@/integrations/supabase/client';
import type { TeamLocation, MapOrder, TrackerTimeline, TrackerKPI } from '@/types/ssgen';

export async function fetchMapOrders(): Promise<MapOrder[]> {
  const { data, error } = await supabase
    .from('v_map_orders' as any)
    .select('*');
  
  if (error) {
    console.error('Error fetching map orders:', error);
    return [];
  }
  return (data || []) as unknown as MapOrder[];
}

export async function fetchOrderTimeline(orderId: string): Promise<TrackerTimeline | null> {
  const { data, error } = await supabase
    .from('v_tracker_timeline' as any)
    .select('*')
    .eq('id', orderId)
    .single();
  
  if (error) {
    console.error('Error fetching order timeline:', error);
    return null;
  }
  return data as unknown as TrackerTimeline;
}

export async function fetchAllTimelines(): Promise<TrackerTimeline[]> {
  const { data, error } = await supabase
    .from('v_tracker_timeline' as any)
    .select('*')
    .order('aging_dias_total', { ascending: false, nullsFirst: false });
  
  if (error) {
    console.error('Error fetching timelines:', error);
    return [];
  }
  return (data || []) as unknown as TrackerTimeline[];
}

export async function fetchTrackerKPIs(): Promise<TrackerKPI | null> {
  const { data, error } = await supabase
    .from('v_tracker_kpi_topline' as any)
    .select('*')
    .single();
  
  if (error) {
    console.error('Error fetching KPIs:', error);
    return null;
  }
  return data as unknown as TrackerKPI;
}

export async function fetchTeamLocations(): Promise<TeamLocation[]> {
  const { data, error } = await supabase
    .from('team_locations' as any)
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching team locations:', error);
    return [];
  }
  return (data || []) as unknown as TeamLocation[];
}

export async function upsertTeamLocation(
  userId: string, 
  nome: string,
  lat: number, 
  lon: number,
  status: 'online' | 'ocupado' | 'offline' = 'online'
): Promise<TeamLocation | null> {
  const { data, error } = await supabase
    .from('team_locations' as any)
    .upsert({
      user_id: userId,
      nome,
      lat,
      lon,
      status,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error upserting team location:', error);
    return null;
  }
  return data as unknown as TeamLocation;
}

export async function updateOrderPriority(
  orderId: string, 
  prioridade: 'alta' | 'media' | 'baixa'
) {
  const { error } = await supabase
    .from('service_orders')
    .update({ prioridade } as any)
    .eq('id', orderId);
  
  if (error) throw error;
}

export async function toggleReagendamento(orderId: string, flag: boolean) {
  const { error } = await supabase
    .from('service_orders')
    .update({ flag_reagendamento: flag } as any)
    .eq('id', orderId);
  
  if (error) throw error;
}

export async function updateIssueText(orderId: string, issueText: string) {
  const { error } = await supabase
    .from('service_orders')
    .update({ issue_text: issueText } as any)
    .eq('id', orderId);
  
  if (error) throw error;
}
