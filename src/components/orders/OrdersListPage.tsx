import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import InlineClientEditor from "@/components/orders/InlineClientEditor";
import { toast } from "sonner";

type Row = {
  id: string;
  ordem_servico_ssgen: number;
  client_name: string | null;
  created_at: string;
  deleted_at: string | null;
  client_id?: string | null;
};

export default function OrdersListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      if (!active) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("service_orders")
        .select(`
          id,
          ordem_servico_ssgen,
          created_at,
          deleted_at,
          client_id,
          clients:client_id (nome)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error(error);
        const msg = /permission/i.test(error.message)
          ? "Permissão negada. Verifique login/políticas."
          : `Erro ao carregar ordens: ${error.message}`;
        toast.error(msg);
        setLoading(false);
        return;
      }

      const mapped = (data ?? []).map((r: any) => ({
        id: r.id,
        ordem_servico_ssgen: r.ordem_servico_ssgen,
        client_name: r.clients?.nome ?? null,
        created_at: r.created_at,
        deleted_at: r.deleted_at,
        client_id: r.client_id,
      }));
      setRows(mapped);
      setLoading(false);
    };

    loadOrders();
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_orders" }, () => {
        void loadOrders();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <div className="p-6">Carregando…</div>;

  const handleCommitted = (
    orderId: string,
    payload: { client_name: string | null; client_id: string | null },
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === orderId
          ? { ...r, client_name: payload.client_name, client_id: payload.client_id }
          : r,
      ),
    );
  };

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Ordens</h1>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">OS</th>
              <th className="p-2 text-left">Nome do cliente</th>
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
                  <td className="p-2">
                    <InlineClientEditor
                      orderId={r.id}
                      initialName={r.client_name}
                      initialId={r.client_id ?? null}
                      onCommitted={(payload) => handleCommitted(r.id, payload)}
                    />
                  </td>
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
