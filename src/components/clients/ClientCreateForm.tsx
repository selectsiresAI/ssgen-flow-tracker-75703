import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ClientCreateForm({ 
  onCreated 
}: { 
  onCreated?: (client: { id: string; nome: string }) => void 
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const canSave = nome.trim().length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("clients")
      .insert({
        nome: nome.trim(),
        email: email.trim() || null,
        cpf_cnpj: 0,
        coordenador: '',
        representante: '',
        data: new Date().toISOString().split('T')[0],
        ordem_servico_ssgen: 0,
      })
      .select("id, nome")
      .single();

    setLoading(false);
    if (error) {
      console.error(error);
      toast.error(`Erro ao criar cliente: ${error.message}`);
      return;
    }
    
    toast.success("Cliente criado com sucesso!");
    setNome("");
    setEmail("");
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
      <div className="space-y-1">
        <label className="text-sm font-medium">E-mail</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@dominio.com"
        />
      </div>
      <Button type="submit" disabled={!canSave || loading}>
        {loading ? "Salvando..." : "Criar cliente"}
      </Button>
    </form>
  );
}
