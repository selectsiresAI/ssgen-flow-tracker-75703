import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ClientOption = {
  id: string;
  nome: string;
};

export default function InlineClientEditor({
  orderId,
  initialName,
  initialId,
  onCommitted,
}: {
  orderId: string;
  initialName: string | null;
  initialId?: string | null;
  onCommitted: (payload: { client_name: string | null; client_id: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [currentClient, setCurrentClient] = useState<{ id: string | null; nome: string | null }>({
    id: initialId ?? null,
    nome: initialName ?? null,
  });

  useEffect(() => {
    setCurrentClient({ id: initialId ?? null, nome: initialName ?? null });
  }, [initialId, initialName]);

  useEffect(() => {
    if (!open || clients.length > 0 || loadingClients) {
      return;
    }

    let active = true;
    const loadClients = async () => {
      setLoadingClients(true);
      setClientsError(null);

      const { data, error } = await supabase
        .from("clients")
        .select("id, nome")
        .is("deleted_at", null)
        .order("nome", { ascending: true });

      if (!active) {
        return;
      }

      if (error) {
        console.error(error);
        setClientsError("Erro ao carregar clientes.");
        setClients([]);
      } else {
        setClients(data ?? []);
      }

      setLoadingClients(false);
    };

    void loadClients();

    return () => {
      active = false;
    };
  }, [open, clients.length, loadingClients]);

  const save = async (client: ClientOption | null) => {
    if (saving) return;

    const nextId = client?.id ?? null;
    const nextName = client?.nome ?? null;

    if (nextId === currentClient.id) {
      setOpen(false);
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase
      .from("service_orders")
      .update({ client_id: nextId })
      .eq("id", orderId);

    setSaving(false);

    if (updateError) {
      console.error(updateError);
      const msg = /permission/i.test(updateError.message)
        ? "Permissão negada ao alterar cliente da OS. Verifique login/policies."
        : `Erro ao alterar cliente da OS: ${updateError.message}`;
      alert(msg);
      return;
    }

    setCurrentClient({ id: nextId, nome: nextName });
    onCommitted({ client_name: nextName, client_id: nextId });
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <span>{currentClient.nome ?? "—"}</span>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          if (!saving) {
            setOpen(nextOpen);
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            disabled={saving}
            onClick={() => setOpen(true)}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Editar
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar cliente..." disabled={loadingClients || !!clientsError} />
            <CommandList>
              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              {loadingClients ? (
                <div className="p-4 text-sm text-muted-foreground">Carregando clientes…</div>
              ) : clientsError ? (
                <div className="p-4 text-sm text-destructive">{clientsError}</div>
              ) : (
                <>
                  <CommandGroup heading="Clientes ativos">
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={client.nome}
                        disabled={saving}
                        onSelect={() => {
                          void save(client);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            client.id === currentClient.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {client.nome}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      value="desvincular"
                      disabled={saving}
                      onSelect={() => {
                        void save(null);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          currentClient.id === null ? "opacity-100" : "opacity-0",
                        )}
                      />
                      Desvincular cliente
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
