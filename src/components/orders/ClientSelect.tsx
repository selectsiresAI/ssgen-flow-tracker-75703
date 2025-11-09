import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type ClientSelectProps = {
  value?: string | null;
  onChange: (clientId: string) => void;
};

type ClientRow = {
  client_id: string;
  client_name: string;
  os_count: number | null;
  last_os_ssgen: number | null;
};

export default function ClientSelect({ value, onChange }: ClientSelectProps) {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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
      setRows(data ?? []);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.client_name.toLowerCase().includes(q));
  }, [rows, query]);

  const createInline = async () => {
    const name = query.trim();
    if (name.length < 3) {
      alert('Informe ao menos 3 caracteres para criar um cliente.');
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from('clients')
      .insert({ nome: name })
      .select('id, nome')
      .single();
    setCreating(false);

    if (error) {
      console.error('Erro ao criar cliente', error);
      alert(`Erro ao criar cliente: ${error.message}`);
      return;
    }

    if (!data) return;
    const newRow: ClientRow = {
      client_id: data.id,
      client_name: data.nome,
      os_count: 0,
      last_os_ssgen: null,
    };
    setRows((prev) => [newRow, ...prev]);
    onChange(data.id);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Cliente</label>
      <Input
        placeholder="Buscar cliente pelo nome…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="max-h-64 overflow-auto border rounded-md">
        {loading ? (
          <div className="p-3 text-sm text-muted-foreground">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-3 text-sm">
            Nenhum cliente encontrado.
            <div className="mt-2">
              <Button size="sm" onClick={createInline} disabled={creating}>
                {creating ? 'Criando…' : `Criar "${query.trim()}"`}
              </Button>
            </div>
          </div>
        ) : (
          filtered.map((row) => (
            <button
              key={row.client_id}
              type="button"
              onClick={() => onChange(row.client_id)}
              className={`w-full text-left px-3 py-2 hover:bg-muted ${value === row.client_id ? 'bg-muted' : ''}`}
            >
              <div className="font-medium">{row.client_name}</div>
              <div className="text-xs text-muted-foreground">
                {(row.os_count ?? 0)} ordens
                {typeof row.last_os_ssgen === 'number' ? ` · última OS ${row.last_os_ssgen}` : ''}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
