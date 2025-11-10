import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function InlineClientEditor({
  orderId,
  initialName,
  onCommitted,
}: {
  orderId: string;
  initialName: string | null;
  onCommitted: (payload: { client_name: string | null; client_id: string | null }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName ?? "");
  const [saving, setSaving] = useState(false);

  const start = () => {
    setName(initialName ?? "");
    setEditing(true);
  };
  const cancel = () => {
    setName(initialName ?? "");
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    
    // Buscar ou criar cliente e vincular à ordem
    let clientId: string | null = null;
    let clientName: string | null = null;

    if (name.trim()) {
      // Buscar cliente existente
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id, nome")
        .ilike("nome", name.trim())
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();

      if (existingClient) {
        clientId = existingClient.id;
        clientName = existingClient.nome;
      } else {
        // Criar novo cliente
        const { data: newClient, error: createError } = await supabase
          .from("clients")
          .insert({
            nome: name.trim(),
            coordenador: "Não definido",
            representante: "Não definido",
            cpf_cnpj: 0,
            data: new Date().toISOString().split('T')[0],
            ordem_servico_ssgen: 0
          })
          .select("id, nome")
          .single();

        if (createError) {
          console.error(createError);
          alert(`Erro ao criar cliente: ${createError.message}`);
          setSaving(false);
          return;
        }

        clientId = newClient.id;
        clientName = newClient.nome;
      }
    }

    // Atualizar ordem
    const { error: updateError } = await supabase
      .from("service_orders")
      .update({ client_id: clientId })
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

    onCommitted({ client_name: clientName, client_id: clientId });
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span>{initialName ?? "—"}</span>
        <Button size="sm" variant="outline" onClick={start}>
          Editar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do cliente (vazio = desvincular)"
        className="h-8"
      />
      <Button size="sm" onClick={save} disabled={saving}>
        {saving ? "Salvando…" : "Salvar"}
      </Button>
      <Button size="sm" variant="ghost" onClick={cancel} disabled={saving}>
        Cancelar
      </Button>
    </div>
  );
}
