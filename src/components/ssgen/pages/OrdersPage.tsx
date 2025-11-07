import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import type { UnifiedOrder } from '@/types/ssgen';
import { HeaderBar } from '../shared/HeaderBar';
import { UnifiedOrdersTable } from '../shared/UnifiedOrdersTable';
import { StageFlowTable } from '../shared/StageFlowTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchUnifiedOrders } from '@/lib/serviceOrdersApi';

interface OrdersPageProps {
  onOpen: (r: UnifiedOrder) => void;
  canEdit: boolean;
  canAttach: boolean;
  canFinance: boolean;
  userRole?: string;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ onOpen, canEdit, canAttach, canFinance, userRole }) => {
  const [rows, setRows] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<UnifiedOrder | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const data = await fetchUnifiedOrders();
    setRows(data);
    setLoading(false);
  };

  const handleOpenDetail = (order: UnifiedOrder) => {
    setSelectedOrder(order);
    setDetailOpen(true);
    onOpen(order);
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
      <UnifiedOrdersTable 
        rows={rows} 
        onOpen={handleOpenDetail} 
        userRole={userRole}
        onUpdate={loadOrders}
      />

      {/* Dialog com análise de fluxo de etapas */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Fluxo de Etapas - OS {selectedOrder?.ordem_servico_ssgen}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações da Ordem</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cliente:</span> {selectedOrder.cliente_nome || '—'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Coordenador:</span> {selectedOrder.coordenador || '—'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Representante:</span> {selectedOrder.representante || '—'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Produto:</span> {selectedOrder.nome_produto || '—'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Análise de Tempo entre Etapas</CardTitle>
                </CardHeader>
                <CardContent>
                  <StageFlowTable order={selectedOrder} />
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
