import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [open, setOpen] = useState(false);
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

  const selectedClient = rows.find((r) => r.client_id === value);

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
        ordem_servico_ssgen: 0,
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
    const newClient = { client_id: data.id, client_name: data.nome, os_count: 0, last_os_ssgen: null };
    setRows((prev) => [newClient, ...prev]);
    onChange(data.id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Cliente</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {loading ? (
              "Carregando..."
            ) : selectedClient ? (
              <span className="truncate">{selectedClient.client_name}</span>
            ) : (
              "Selecione um cliente..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar cliente..." 
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-4 text-sm text-center">
                  <p className="mb-3">Nenhum cliente encontrado.</p>
                  {query.trim().length >= 3 && (
                    <Button 
                      size="sm" 
                      onClick={createInline} 
                      disabled={creating}
                      className="w-full"
                    >
                      {creating ? "Criando…" : `Criar "${query.trim()}"`}
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((client) => (
                  <CommandItem
                    key={client.client_id}
                    value={client.client_name}
                    onSelect={() => {
                      onChange(client.client_id);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === client.client_id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{client.client_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(client.os_count ?? 0)} ordens
                        {typeof client.last_os_ssgen === "number" 
                          ? ` · última OS ${client.last_os_ssgen}` 
                          : ""}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
