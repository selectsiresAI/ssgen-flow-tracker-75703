import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ClientSelect from '@/components/orders/ClientSelect';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeaderBar } from '../shared/HeaderBar';

interface CreatedOrder {
  id: string;
  ordem_servico_ssgen: number;
  client_id: string | null;
}

const NewOrderPage = () => {
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreatedOrder | null>(null);

  const createOrder = async () => {
    setLoading(true);
    const payload = clientId ? { client_id: clientId } : {};
    const { data, error } = await supabase
      .from('service_orders')
      .insert(payload)
      .select('id, ordem_servico_ssgen, client_id')
      .single();
    setLoading(false);

    if (error) {
      console.error('Erro ao criar ordem', error);
      alert(`Erro ao criar ordem: ${error.message}`);
      return;
    }

    if (!data) return;
    setResult({
      id: data.id,
      ordem_servico_ssgen: Number(data.ordem_servico_ssgen),
      client_id: data.client_id ?? null,
    });
  };

  return (
    <div className="space-y-6">
      <HeaderBar title="Nova Ordem de Serviço" query="" setQuery={() => {}} />

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClientSelect value={clientId ?? undefined} onChange={(id) => setClientId(id)} />
          <p className="text-xs text-muted-foreground">
            Você pode criar uma OS sem cliente vinculado e associá-la depois.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={createOrder} disabled={loading}>
          {loading ? 'Criando…' : clientId ? 'Criar OS para este cliente' : 'Criar OS sem cliente'}
        </Button>
        {result && (
          <div className="text-sm">
            Criada OS <span className="font-semibold">{result.ordem_servico_ssgen}</span>
            {result.client_id ? ' (vinculada)' : ' (sem vínculo)'}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewOrderPage;
