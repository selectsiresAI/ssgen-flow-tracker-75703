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
  // 1) Fonte preferencial: vw_orders_unified com client_name
  {
    const { data, error } = await supabase
      .from("vw_orders_unified")
      .select("id, ordem_servico_ssgen, client_name, created_at, deleted_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return (data ?? []) as ManagementOrderRow[];
    }
    if (error && isMissingColumnError(error)) {
      // 1a) A view existe, mas o alias é 'cliente' → mapeia para client_name
      const alt = await supabase
        .from("vw_orders_unified")
        .select(
          "id, ordem_servico_ssgen, client_name:cliente, created_at, deleted_at",
        )
        .order("created_at", { ascending: false });
      if (!alt.error && alt.data) {
        return (alt.data ?? []) as ManagementOrderRow[];
      }
      // se falhar, continua o fluxo
    }
    if (
      error &&
      !isMissingColumnError(error) &&
      !isMissingRelationError(error)
    ) {
      // Erro diferente (ex.: RLS). Propaga para aparecer na UI.
      throw new Error(error.message);
    }
  }

  // 2) Fallback: v_map_orders com client_name
  {
    const { data, error } = await supabase
      .from("v_map_orders")
      .select("id, ordem_servico_ssgen, client_name, created_at, deleted_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return (data ?? []) as ManagementOrderRow[];
    }
    if (error && isMissingColumnError(error)) {
      // 2a) v_map_orders existe, mas o alias é 'cliente' → mapeia para client_name
      const alt = await supabase
        .from("v_map_orders")
        .select(
          "id, ordem_servico_ssgen, client_name:cliente, created_at, deleted_at",
        )
        .order("created_at", { ascending: false });
      if (!alt.error && alt.data) {
        return (alt.data ?? []) as ManagementOrderRow[];
      }
      // se falhar, continua
    }
    if (
      error &&
      !isMissingColumnError(error) &&
      !isMissingRelationError(error)
    ) {
      throw new Error(error.message);
    }
  }

  // 3) Contingência final: direto na tabela + nested select em clients
  {
    const { data, error } = await supabase
      .from("service_orders")
      .select(
        `
        id,
        ordem_servico_ssgen,
        created_at,
        deleted_at,
        clients:client_id ( id, nome )
      `,
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []).map((r: any) => ({
      id: r.id,
      ordem_servico_ssgen: r.ordem_servico_ssgen,
      client_name: r?.clients?.nome ?? r?.clients?.[0]?.nome ?? null,
      created_at: r.created_at,
      deleted_at: r.deleted_at,
      client_id: r?.clients?.id ?? r?.clients?.[0]?.id ?? null,
    })) as ManagementOrderRow[];

    return rows;
  }
}
