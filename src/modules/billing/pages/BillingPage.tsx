import { BillingKPIs } from '../components/BillingKPIs';
import { BillingChart } from '../components/BillingChart';
import { ReadyToInvoice } from '../components/ReadyToInvoice';
import { BillingFilters } from '../components/BillingFilters';
import { 
  useBillingSummary, 
  useBillingMonthly,
  useReadyToInvoice,
  useBillingByRep,
  useBillingByCoord
} from '../hooks/useBillingData';
import { useState, useMemo } from 'react';

export default function BillingPage() {
  const { data: summary, isLoading: loadingSummary } = useBillingSummary();
  const { data: monthly = [], isLoading: loadingMonthly } = useBillingMonthly();
  const { data: readyToInvoice = [], isLoading: loadingReady } = useReadyToInvoice();
  const { data: byRep = [] } = useBillingByRep();
  const { data: byCoord = [] } = useBillingByCoord();
  
  const [selectedRep, setSelectedRep] = useState('all');
  const [selectedCoord, setSelectedCoord] = useState('all');

  const representantes = useMemo(() => 
    byRep.map(r => r.representante).filter(Boolean) as string[], 
    [byRep]
  );
  
  const coordenadores = useMemo(() => 
    byCoord.map(c => c.coordenador).filter(Boolean) as string[], 
    [byCoord]
  );

  return (
    <div className="p-6 space-y-6 bg-zenith-black min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Faturamento</h1>
      </div>

      <BillingFilters 
        representantes={representantes}
        coordenadores={coordenadores}
        selectedRep={selectedRep}
        selectedCoord={selectedCoord}
        onRepChange={setSelectedRep}
        onCoordChange={setSelectedCoord}
      />

      {loadingSummary ? (
        <div className="text-center text-zenith-gray py-8">Carregando resumo...</div>
      ) : (
        <BillingKPIs summary={summary} />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          {loadingMonthly ? (
            <div className="bg-zenith-card rounded-2xl p-6 border border-zenith-navy/30">
              <div className="text-center text-zenith-gray py-8">Carregando gráfico...</div>
            </div>
          ) : (
            <BillingChart data={monthly} />
          )}
        </div>
        <div>
          {loadingReady ? (
            <div className="bg-zenith-card rounded-2xl p-6 border border-zenith-navy/30">
              <div className="text-center text-zenith-gray py-8">Carregando ordens...</div>
            </div>
          ) : (
            <ReadyToInvoice orders={readyToInvoice} />
          )}
        </div>
      </div>
    </div>
  );
}
