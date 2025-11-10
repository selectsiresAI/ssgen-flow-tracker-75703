import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTimerProps {
  startDate: string | null;
  targetDays: number;
  status?: 'no_prazo' | 'dia_zero' | 'atrasado';
  className?: string;
}

export function OrderTimer({ startDate, targetDays, status, className }: OrderTimerProps) {
  const [timeInfo, setTimeInfo] = useState<{
    days: number;
    hours: number;
    minutes: number;
    isOverdue: boolean;
  }>({ days: 0, hours: 0, minutes: 0, isOverdue: false });

  useEffect(() => {
    if (!startDate) return;

    const updateTimer = () => {
      const start = new Date(startDate);
      const target = new Date(start);
      target.setDate(target.getDate() + targetDays);
      
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();
      const isOverdue = diffMs < 0;
      
      const absDiffMs = Math.abs(diffMs);
      const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60));

      setTimeInfo({ days, hours, minutes, isOverdue });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, [startDate, targetDays]);

  if (!startDate) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const statusAccent = timeInfo.isOverdue
    ? 'ring-destructive/60'
    : timeInfo.days === 0
    ? 'ring-warning/60'
    : 'ring-success/60';

  const iconColor = timeInfo.isOverdue
    ? 'text-destructive'
    : timeInfo.days === 0
    ? 'text-warning'
    : 'text-success';

  return (
    <div className={cn('flex items-center gap-1.5 text-xs font-medium', className)}>
      {timeInfo.isOverdue ? (
        <AlertCircle className={cn('w-3.5 h-3.5', iconColor)} />
      ) : (
        <Clock className={cn('w-3.5 h-3.5', iconColor)} />
      )}
      <span
        className={cn(
          'inline-flex items-center rounded-md px-2 py-0.5 bg-white/90 text-black',
          statusAccent,
          'ring-1'
        )}
      >
        {timeInfo.isOverdue ? '+' : '-'}
        {timeInfo.days}d {timeInfo.hours}h {timeInfo.minutes}m
      </span>
    </div>
  );
}
