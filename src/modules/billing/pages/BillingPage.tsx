import { BillingKPIs } from '../components/BillingKPIs';
import { BillingChart } from '../components/BillingChart';
import { BillingOrdersTable } from '../components/BillingOrdersTable';
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

  const filteredOrders = useMemo(() => {
    return readyToInvoice.filter(order => {
      if (selectedRep !== 'all' && order.representante !== selectedRep) return false;
      if (selectedCoord !== 'all' && order.coordenador !== selectedCoord) return false;
      return true;
    });
  }, [readyToInvoice, selectedRep, selectedCoord]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Faturamento</h1>
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
        <div className="text-center text-muted-foreground py-8">Carregando resumo...</div>
      ) : (
        <BillingKPIs summary={summary} />
      )}

      {loadingMonthly ? (
        <div className="bg-card rounded-lg p-6 border">
          <div className="text-center text-muted-foreground py-8">Carregando gráfico...</div>
        </div>
      ) : (
        <BillingChart data={monthly} />
      )}

      {loadingReady ? (
        <div className="bg-card rounded-lg p-6 border">
          <div className="text-center text-muted-foreground py-8">Carregando ordens...</div>
        </div>
      ) : (
        <BillingOrdersTable orders={filteredOrders} />
      )}
    </div>
  );
}
