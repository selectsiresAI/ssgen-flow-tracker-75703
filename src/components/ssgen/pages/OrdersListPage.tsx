import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrderRow {
  id: string;
  ordem_servico_ssgen: number;
  client_id: string | null;
  client_name: string | null;
  created_at: string;
}

const OrdersListPage = () => {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('v_map_orders')
        .select('id, ordem_servico_ssgen, client_id, client_name, created_at')
        .order('created_at', { ascending: false });
      setLoading(false);
      if (error) {
        console.error('Erro ao carregar ordens', error);
        alert(`Erro ao carregar ordens: ${error.message}`);
        return;
      }
      if (!mounted) return;
      setRows(data ?? []);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div>Carregando…</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ordens</CardTitle>
      </CardHeader>
      <CardContent>
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
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-2 font-medium">{row.ordem_servico_ssgen}</td>
                  <td className="p-2">{row.client_name ?? '—'}</td>
                  <td className="p-2">{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersListPage;
