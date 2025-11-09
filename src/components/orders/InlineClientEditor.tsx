import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type InlineClientEditorProps = {
  orderId: string;
  initialName: string | null;
  onCommitted: (payload: { client_name: string | null; client_id: string | null }) => void;
};

export default function InlineClientEditor({ orderId, initialName, onCommitted }: InlineClientEditorProps) {
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
    const { data, error } = await supabase.rpc("link_order_to_client", {
      p_order_id: orderId,
      p_client_name: name,
    });
    setSaving(false);

    if (error) {
      console.error(error);
      const msg = /permission/i.test(error.message)
        ? "Permissão negada ao alterar cliente da OS."
        : `Erro ao alterar cliente da OS: ${error.message}`;
      toast.error(msg);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    onCommitted({ client_name: row?.client_name ?? null, client_id: row?.client_id ?? null });
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
