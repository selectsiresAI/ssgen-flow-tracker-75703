import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateOrderValue } from '../hooks/useBillingData';

interface EditableCurrencyProps {
  orderId: string;
  value: number;
  isOverride?: boolean;
  canEdit: boolean;
  className?: string;
}

const formatBRL = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function EditableCurrency({ orderId, value, isOverride, canEdit, className }: EditableCurrencyProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useUpdateOrderValue();

  useEffect(() => {
    if (editing) {
      setDraft(value ? String(value.toFixed(2)) : '');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing, value]);

  const save = async () => {
    const normalized = draft.replace(',', '.').trim();
    const parsed = normalized === '' ? null : Number(normalized);
    if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) {
      toast.error('Valor inválido');
      return;
    }
    if (parsed === value) {
      setEditing(false);
      return;
    }
    try {
      await mutation.mutateAsync({ orderId, valor: parsed });
      toast.success('Valor atualizado');
      setEditing(false);
    } catch (e) {
      toast.error('Erro ao salvar valor');
    }
  };

  if (!canEdit) {
    return <span className={className}>{formatBRL(value || 0)}</span>;
  }

  if (editing) {
    return (
      <div className="inline-flex items-center gap-1">
        <span className="text-xs text-muted-foreground">R$</span>
        <Input
          ref={inputRef}
          type="number"
          step="0.01"
          min="0"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="h-7 w-28 text-sm"
          disabled={mutation.isPending}
        />
        {mutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={isOverride ? 'Valor editado manualmente (clique para alterar)' : 'Clique para editar'}
      className={`inline-flex items-center gap-1 rounded px-1 -mx-1 hover:bg-muted/50 group ${className ?? ''}`}
    >
      <span>{formatBRL(value || 0)}</span>
      {isOverride && <span className="text-[10px] text-primary">•</span>}
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60" />
    </button>
  );
}
