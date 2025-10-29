import React from 'react';
import { Badge } from '@/components/ui/badge';

interface SLABadgeProps {
  status: string | null | undefined;
}

export const SLABadge: React.FC<SLABadgeProps> = ({ status }) => {
  if (!status) return <span>—</span>;

  const variants: Record<string, 'success' | 'warning' | 'destructive'> = {
    'no_prazo': 'success',
    'dia_zero': 'warning',
    'atrasado': 'destructive'
  };

  const labels: Record<string, string> = {
    'no_prazo': 'No Prazo',
    'dia_zero': 'Dia Zero',
    'atrasado': 'Atrasado'
  };

  return (
    <Badge variant={variants[status] || 'secondary'}>
      {labels[status] || status}
    </Badge>
  );
};