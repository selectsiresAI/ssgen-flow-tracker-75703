import { supabase } from "@/lib/supabaseClient";

export type ManagementOrderRow = {
  id: string;
  ordem_servico_ssgen: number;
  client_name: string | null;
  created_at: string;
  deleted_at: string | null;
  client_id?: string | null; // opcional
};

function isMissingColumnError(e: any) {
  const msg = (e?.message ?? "").toLowerCase();
  // 42703 = undefined_column
  return (
    msg.includes("42703") ||
    msg.includes("does not exist") ||
    msg.includes("column ")
  );
}
function isMissingRelationError(e: any) {
  const msg = (e?.message ?? "").toLowerCase();
  // 42P01 = undefined_table / relation does not exist
  return (
    msg.includes("42p01") ||
    (msg.includes("relation") && msg.includes("does not exist"))
  );
}

export async function fetchManagementOrders(): Promise<ManagementOrderRow[]> {
  // Consulta direta na tabela service_orders com join em clients
  const { data, error } = await supabase
    .from("service_orders")
    .select(`
      id,
      ordem_servico_ssgen,
      created_at,
      deleted_at,
      clients:client_id (id, nome)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []).map((r: any) => ({
    id: r.id,
    ordem_servico_ssgen: r.ordem_servico_ssgen,
    client_name: r?.clients?.nome ?? null,
    created_at: r.created_at,
    deleted_at: r.deleted_at,
    client_id: r?.clients?.id ?? null,
  })) as ManagementOrderRow[];

  return rows;
}
