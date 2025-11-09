import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ClientSelect from "@/components/orders/ClientSelect";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function NewOrderPage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; os: number; client_id: string | null } | null>(null);

  const createOrder = async () => {
    setLoading(true);
    const payload: any = clientId ? { client_id: clientId } : {};
    const { data, error } = await supabase
      .from("service_orders")
      .insert(payload)
      .select("id, ordem_servico_ssgen")
      .single();

    setLoading(false);
    if (error) {
      console.error(error);
      const msg = /permission/i.test(error.message)
        ? "Permissão negada ao criar OS. Faça login (authenticated)."
        : `Erro ao criar ordem: ${error.message}`;
      toast.error(msg);
      return;
    }
    if (!data || data.ordem_servico_ssgen == null) {
      toast.error("OS criada, mas não retornou número. Verifique trigger/default da coluna ordem_servico_ssgen.");
      return;
    }
    
    toast.success(`OS ${data.ordem_servico_ssgen} criada com sucesso!`);
    setResult({ 
      id: data.id, 
      os: Number(data.ordem_servico_ssgen), 
      client_id: clientId 
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 p-6">
      <h1 className="text-xl font-semibold">Nova Ordem de Serviço</h1>
      <ClientSelect value={clientId ?? undefined} onChange={setClientId} />
      <div className="flex items-center gap-3">
        <Button onClick={createOrder} disabled={loading}>
          {loading ? "Criando…" : clientId ? "Criar OS para este cliente" : "Criar OS sem cliente"}
        </Button>
        {result && (
          <div className="text-sm">
            Criada OS <span className="font-semibold">{result.os}</span>
            {result.client_id ? " (vinculada)" : " (sem vínculo)"}
          </div>
        )}
      </div>
    </div>
  );
}
