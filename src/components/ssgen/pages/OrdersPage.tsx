import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import type { UnifiedOrder } from '@/types/ssgen';
import { HeaderBar } from '../shared/HeaderBar';
import { UnifiedOrdersTable } from '../shared/UnifiedOrdersTable';
import { fetchUnifiedOrders } from '@/lib/serviceOrdersApi';

interface OrdersPageProps {
  onOpen: (r: UnifiedOrder) => void;
  canEdit: boolean;
  canAttach: boolean;
  canFinance: boolean;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ onOpen, canEdit, canAttach, canFinance }) => {
  const [rows, setRows] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const data = await fetchUnifiedOrders();
    setRows(data);
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando ordens...</div>;
  }

  return (
    <div className="space-y-4">
      <HeaderBar title="Ordens Completas" query={''} setQuery={() => {}}>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Importar Excel
        </Button>
      </HeaderBar>
      <UnifiedOrdersTable rows={rows} onOpen={onOpen} />
    </div>
  );
};

export default OrdersPage;
