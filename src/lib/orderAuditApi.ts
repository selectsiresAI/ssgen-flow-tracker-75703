import { supabase } from '@/integrations/supabase/client';

interface AuditLogEntry {
  order_id?: string;
  ordem_servico_ssgen?: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
}

export async function logOrderChange(entry: AuditLogEntry) {
  try {
    // Get current user info
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user role
    const { data: roleData } = await supabase.rpc('my_profile');
    const profile = Array.isArray(roleData) ? roleData[0] : roleData;

    await supabase.from('order_audit_log').insert({
      order_id: entry.order_id,
      ordem_servico_ssgen: entry.ordem_servico_ssgen,
      field_name: entry.field_name,
      old_value: entry.old_value,
      new_value: entry.new_value,
      changed_by: user.id,
      user_email: user.email,
      user_role: profile?.role || null,
    });
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}

export async function fetchOrderAuditLog(orderId: string) {
  const { data, error } = await supabase
    .from('order_audit_log')
    .select('*')
    .eq('order_id', orderId)
    .order('changed_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
