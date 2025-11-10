import { useEffect, useMemo, useState } from "react";
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
import { useClients } from "@/hooks/useClientData";

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
  const [currentClient, setCurrentClient] = useState<{ id: string | null; nome: string | null }>({
    id: initialId ?? null,
    nome: initialName ?? null,
  });
  const {
    data: clientsData,
    isLoading: initialClientsLoading,
    isFetching: isFetchingClients,
    refetch: refetchClients,
  } = useClients();

  const clients = useMemo<ClientOption[]>(
    () =>
      (clientsData ?? [])
        .filter((client) => !client.deleted_at)
        .map((client) => ({ id: client.id, nome: client.nome }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [clientsData],
  );

  const loadingClients = initialClientsLoading || isFetchingClients;

  useEffect(() => {
    if (open) {
      void refetchClients();
    }
  }, [open, refetchClients]);

  useEffect(() => {
    setCurrentClient({ id: initialId ?? null, nome: initialName ?? null });
  }, [initialId, initialName]);

  useEffect(() => {
    if (currentClient.id && !currentClient.nome) {
      const match = clients.find((client) => client.id === currentClient.id);
      if (match) {
        setCurrentClient({ id: match.id, nome: match.nome });
      }
    }
  }, [clients, currentClient.id, currentClient.nome]);

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
            <CommandInput placeholder="Buscar cliente..." disabled={loadingClients} />
            <CommandList>
              {!loadingClients && <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>}
              {loadingClients ? (
                <div className="p-4 text-sm text-muted-foreground">Carregando clientes…</div>
              ) : clients.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Nenhum cliente ativo disponível.
                </div>
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
