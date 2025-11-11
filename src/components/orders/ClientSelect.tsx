import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ClientRow = {
  client_id: string;
  client_name: string;
  os_count: number | null;
  last_os_ssgen: number | null;
};

export default function ClientSelect({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (clientId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("id, nome")
        .is("deleted_at", null)
        .order("nome", { ascending: true });

      setLoading(false);
      if (error) {
        console.error(error);
        const msg = /permission/i.test(error.message)
          ? "Permissão negada. Faça login com usuário authenticated."
          : `Erro ao carregar clientes: ${error.message}`;
        toast.error(msg);
        return;
      }
      if (!mounted) return;
      const mapped = (data ?? []).map(c => ({
        client_id: c.id,
        client_name: c.nome,
        os_count: null,
        last_os_ssgen: null,
      }));
      setRows(mapped);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.client_name.toLowerCase().includes(q));
  }, [rows, query]);

  const createInline = async () => {
    const name = query.trim();
    if (name.length < 3) {
      toast.error("Informe ao menos 3 caracteres para criar um cliente.");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase
      .from("clients")
      .insert({
        nome: name,
        cpf_cnpj: 0,
        coordenador: '',
        representante: '',
        data: new Date().toISOString().split('T')[0],
      })
      .select("id, nome")
      .single();
    
    setCreating(false);
    if (error) {
      console.error(error);
      toast.error(`Erro ao criar cliente: ${error.message}`);
      return;
    }
    
    toast.success("Cliente criado com sucesso!");
    setRows((prev) => [
      { client_id: data.id, client_name: data.nome, os_count: 0, last_os_ssgen: null }, 
      ...prev
    ]);
    onChange(data.id);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Cliente</label>
      <Input
        placeholder="Buscar cliente pelo nome…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="max-h-64 overflow-auto border rounded-md">
        {loading ? (
          <div className="p-3 text-sm text-muted-foreground">Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-3 text-sm">
            Nenhum cliente encontrado.
            <div className="mt-2">
              <Button size="sm" onClick={createInline} disabled={creating}>
                {creating ? "Criando…" : `Criar "${query.trim()}"`}
              </Button>
            </div>
          </div>
        ) : (
          filtered.map((r) => (
            <button
              key={r.client_id}
              type="button"
              onClick={() => onChange(r.client_id)}
              className={`w-full text-left px-3 py-2 hover:bg-muted ${
                value === r.client_id ? "bg-muted" : ""
              }`}
            >
              <div className="font-medium">{r.client_name}</div>
              <div className="text-xs text-muted-foreground">
                {(r.os_count ?? 0)} ordens
                {typeof r.last_os_ssgen === "number" ? ` · última OS ${r.last_os_ssgen}` : ""}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
