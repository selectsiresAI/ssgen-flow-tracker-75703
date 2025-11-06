import React from 'react';
import { EditableCell } from './EditableCell';
import type { PowerRow, Profile } from '@/types/ssgen';
import { persistStage } from '@/lib/ssgenClient';
import { toast } from 'sonner';

const STAGE_FIELDS: Array<{ key: keyof PowerRow; label: string }> = [
  { key: 'DT_SSGEN_OS', label: 'Abertura OS SSGEN' },
  { key: 'DT_PLAN_SSG', label: 'Planejamento SSGEN' },
  { key: 'DT_PREV_RESULT_SSG', label: 'Prev. Resultado' },
  { key: 'DT_RESULT_SSG', label: 'Resultado SSGEN' },
  { key: 'DT_FATUR_SSG', label: 'Faturamento SSGEN' },
  { key: 'DT_CRA', label: 'CRA' },
  { key: 'DT_PLAN_NEOGEN', label: 'Planejamento Neogen' },
  { key: 'DT_VRI', label: 'VRI' },
  { key: 'DT_LPR', label: 'LPR' },
  { key: 'DT_LR', label: 'LR' },
];

const normalizeDateValue = (value?: string | null) =>
  value ? value.slice(0, 10) : '';

interface EtapasRowProps {
  row: PowerRow;
  profile?: Profile | null;
  onStageUpdate?: (field: keyof PowerRow, value: string | null) => void;
}

export const EtapasRow: React.FC<EtapasRowProps> = ({ row, profile, onStageUpdate }) => {
  const canEdit = Boolean(row.id);

  const handlePersist = async (field: keyof PowerRow, value: string | null) => {
    if (!row.id) {
      throw new Error('ID da ordem não encontrado');
    }

    await persistStage(row.id, field, value, profile?.id);
    onStageUpdate?.(field, value);
  };

  return (
    <div className="space-y-3">
      {STAGE_FIELDS.map(({ key, label }) => (
        <div
          key={key as string}
          className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-3 items-center border-b pb-3 last:border-b-0 last:pb-0"
        >
          <div className="text-sm font-medium text-muted-foreground">{label}</div>
          <EditableCell
            value={normalizeDateValue(row[key] as string | null)}
            onSave={async (raw) => {
              const nextValue = raw ? String(raw) : null;
              try {
                await handlePersist(key, nextValue);
                toast.success('Etapa atualizada com sucesso');
              } catch (error) {
                toast.error('Erro ao atualizar etapa');
                throw error;
              }
            }}
            isEditable={canEdit}
            type="date"
          />
        </div>
      ))}

      {!canEdit && (
        <div className="text-xs text-muted-foreground">
          Não é possível editar as datas porque o identificador da ordem não está disponível.
        </div>
      )}
    </div>
  );
};
