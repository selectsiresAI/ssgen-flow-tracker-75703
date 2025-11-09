import { useEffect, useMemo, useState } from 'react';
import ClientCreateForm from '@/components/clients/ClientCreateForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { HeaderBar } from '../shared/HeaderBar';

interface ClientSummaryRow {
  client_id: string;
  client_name: string;
  os_count: number | null;
  last_os_ssgen: number | null;
}

interface ClientsPageProps {
  profile: { rep?: string | null; coord?: string | null };
}

const ClientsPage: React.FC<ClientsPageProps> = (_props) => {
  const [clients, setClients] = useState<ClientSummaryRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('v_clients_with_last_os')
        .select('client_id, client_name, os_count, last_os_ssgen')
        .order('client_name', { ascending: true });
      setLoading(false);
      if (error) {
        console.error('Erro ao carregar clientes', error);
        alert(`Erro ao carregar clientes: ${error.message}`);
        return;
      }
      if (!mounted) return;
      setClients(data ?? []);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) => client.client_name.toLowerCase().includes(q));
  }, [clients, query]);

  const handleCreated = (client: { id: string; nome: string }) => {
    setClients((prev) => [
      { client_id: client.id, client_name: client.nome, os_count: 0, last_os_ssgen: null },
      ...prev,
    ]);
  };

  return (
    <div className="space-y-6">
      <HeaderBar title="Clientes" query={query} setQuery={setQuery} />

      <Card>
        <CardHeader>
          <CardTitle>Novo Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientCreateForm onCreated={handleCreated} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum cliente encontrado.</div>
          ) : (
            <div className="divide-y border rounded-md">
              {filtered.map((client) => (
                <div key={client.client_id} className="px-4 py-3 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-medium">{client.client_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(client.os_count ?? 0)} ordens
                      {typeof client.last_os_ssgen === 'number'
                        ? ` · última OS ${client.last_os_ssgen}`
                        : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsPage;
