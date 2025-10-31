import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { TrackerTimeline } from '@/types/ssgen';

interface AlarmConfig {
  enabled: boolean;
  soundEnabled: boolean;
  criticalThreshold: number; // dias
  warningThreshold: number; // dias
}

const defaultConfig: AlarmConfig = {
  enabled: true,
  soundEnabled: true,
  criticalThreshold: 5,
  warningThreshold: 3,
};

export function useOrderAlarms(orders: TrackerTimeline[], config: AlarmConfig = defaultConfig) {
  const previousAlarmsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!config.enabled) return;

    // Inicializar áudio de alarme
    if (config.soundEnabled && !audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA8PVqzn77BdGAg+ltryxncsB');
    }

    const currentAlarms = new Set<string>();
    
    orders.forEach((order) => {
      const aging = order.aging_dias_total ?? 0;
      const alarmKey = `${order.id}-${aging}`;
      
      // Verifica se é um alarme crítico (>= threshold crítico)
      if (aging >= config.criticalThreshold) {
        currentAlarms.add(alarmKey);
        
        // Só dispara se não foi disparado antes
        if (!previousAlarmsRef.current.has(alarmKey)) {
          if (config.soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          
          toast.error(`Ordem ${order.ordem_servico_ssgen} em atraso crítico!`, {
            description: `${order.cliente} - ${aging} dias de atraso`,
            duration: 10000,
          });
        }
      }
      // Verifica se é um alarme de aviso
      else if (aging >= config.warningThreshold) {
        currentAlarms.add(alarmKey);
        
        if (!previousAlarmsRef.current.has(alarmKey)) {
          toast.warning(`Ordem ${order.ordem_servico_ssgen} próxima do prazo`, {
            description: `${order.cliente} - ${order.etapa_atual}`,
            duration: 7000,
          });
        }
      }
    });

    previousAlarmsRef.current = currentAlarms;
  }, [orders, config]);

  return {
    criticalCount: orders.filter(o => (o.aging_dias_total ?? 0) >= config.criticalThreshold).length,
    warningCount: orders.filter(o => {
      const aging = o.aging_dias_total ?? 0;
      return aging >= config.warningThreshold && aging < config.criticalThreshold;
    }).length,
  };
}
