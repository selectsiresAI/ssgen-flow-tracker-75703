import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Row = {
  id: string;
  ordem_servico_ssgen: number;
  client_id: string | null;
  client_name: string | null;
  created_at: string;
  deleted_at: string | null;
};

export default function OrdersListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("service_orders")
        .select("id, ordem_servico_ssgen, client_id, created_at, clients!service_orders_client_id_fkey(nome)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      setLoading(false);
      if (error) {
        console.error(error);
        const msg = /permission/i.test(error.message)
          ? "Permissão negada. Verifique login/políticas."
          : `Erro ao carregar ordens: ${error.message}`;
        toast.error(msg);
        return;
      }
      if (!mounted) return;
      const mapped = (data ?? []).map(row => ({
        id: row.id,
        ordem_servico_ssgen: row.ordem_servico_ssgen,
        client_id: row.client_id,
        client_name: Array.isArray(row.clients) ? row.clients[0]?.nome : row.clients?.nome,
        created_at: row.created_at,
        deleted_at: null,
      }));
      setRows(mapped);
    };

    load();
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_orders" }, () => load())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <div className="p-6">Carregando…</div>;

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Ordens</h1>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">OS</th>
              <th className="p-2 text-left">Cliente</th>
              <th className="p-2 text-left">Criada em</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-muted-foreground">
                  Nenhuma ordem encontrada
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-medium">{r.ordem_servico_ssgen}</td>
                  <td className="p-2">{r.client_name ?? "—"}</td>
                  <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
