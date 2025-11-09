import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type ClientCreateFormProps = {
  onCreated?: (client: { id: string; nome: string }) => void;
};

export default function ClientCreateForm({ onCreated }: ClientCreateFormProps) {
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);

  const trimmed = nome.trim();
  const canSave = trimmed.length >= 3;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || loading) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .insert({ nome: trimmed })
      .select('id, nome')
      .single();
    setLoading(false);

    if (error) {
      console.error('Erro ao criar cliente', error);
      alert(`Erro ao criar cliente: ${error.message}`);
      return;
    }

    setNome('');
    if (data) {
      onCreated?.({ id: data.id, nome: data.nome });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Nome do Cliente</label>
        <Input
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          placeholder="Ex.: Fazenda Alfa"
        />
      </div>

      <Button type="submit" disabled={!canSave || loading}>
        {loading ? 'Salvando...' : 'Criar cliente'}
      </Button>
    </form>
  );
}
