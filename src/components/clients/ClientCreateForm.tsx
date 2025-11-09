import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ClientCreateForm({
  onCreated,
}: {
  onCreated?: (client: { id: string; nome: string }) => void;
}) {
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const canSave = nome.trim().length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setLoading(true);

    // Inserção direta na tabela "clients".
    const { data, error } = await supabase
      .from('clients')
      .insert({ nome: nome.trim() })
      .select('id, nome')
      .single();

    setLoading(false);
    if (error) {
      console.error(error);
      alert(`Erro ao criar cliente: ${error.message}`);
      return;
    }
    setNome('');
    onCreated?.(data!);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-sm font-medium">Nome do Cliente</label>
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Fazenda Alfa"
        />
      </div>

      {/* Campo de OS REMOVIDO propositalmente */}

      <Button type="submit" disabled={!canSave || loading}>
        {loading ? 'Salvando...' : 'Criar cliente'}
      </Button>
    </form>
  );
}
