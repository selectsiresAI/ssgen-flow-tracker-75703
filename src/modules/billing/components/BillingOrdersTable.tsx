import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Package, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInvoiceOrder } from '../hooks/useBillingData';
import { toast } from 'sonner';
import type { ReadyToInvoice } from '@/lib/billingApi';

interface BillingOrdersTableProps {
  orders: ReadyToInvoice[];
}

export function BillingOrdersTable({ orders }: BillingOrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<ReadyToInvoice | null>(null);
  const [invoiceDate, setInvoiceDate] = useState('');
  const invoiceMutation = useInvoiceOrder();

  const handleInvoice = async () => {
    if (!selectedOrder || !invoiceDate) return;
    
    try {
      await invoiceMutation.mutateAsync({
        orderId: selectedOrder.id,
        dt_faturamento: invoiceDate,
      });
      toast.success('Ordem faturada com sucesso!');
      setSelectedOrder(null);
      setInvoiceDate('');
    } catch (error) {
      toast.error('Erro ao faturar ordem');
      console.error(error);
    }
  };

  const totalValue = orders.reduce((sum, o) => sum + (o.valor_estimado || 0), 0);
  const totalSamples = orders.reduce((sum, o) => sum + (o.numero_amostras || 0), 0);

  if (orders.length === 0) {
    return (
      <div className="bg-zenith-card rounded-2xl p-6 border border-zenith-navy/30">
        <div className="text-zenith-gold mb-4 font-semibold">Ordens Prontas para Faturar</div>
        <div className="text-center text-zenith-gray py-8">
          Nenhuma ordem pronta para faturamento
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zenith-card rounded-2xl p-6 border border-zenith-navy/30 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-zenith-gold font-semibold">Ordens Prontas para Faturar</div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 text-zenith-gray">
            <FileText className="w-4 h-4" />
            <span className="text-white font-semibold">{orders.length}</span> ordens
          </div>
          <div className="flex items-center gap-2 text-zenith-gray">
            <Package className="w-4 h-4" />
            <span className="text-white font-semibold">{totalSamples}</span> amostras
          </div>
          <div className="flex items-center gap-2 text-zenith-gray">
            <DollarSign className="w-4 h-4" />
            <span className="text-white font-semibold">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zenith-navy hover:bg-zenith-navy/20">
              <TableHead className="text-zenith-gold">OS SSGEN</TableHead>
              <TableHead className="text-zenith-gold">Cliente</TableHead>
              <TableHead className="text-zenith-gold">Representante</TableHead>
              <TableHead className="text-zenith-gold">Coordenador</TableHead>
              <TableHead className="text-zenith-gold">Produto</TableHead>
              <TableHead className="text-zenith-gold text-center">Amostras</TableHead>
              <TableHead className="text-zenith-gold text-right">Valor Est.</TableHead>
              <TableHead className="text-zenith-gold text-center">Dias</TableHead>
              <TableHead className="text-zenith-gold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="border-zenith-navy hover:bg-zenith-navy/10">
                <TableCell className="text-white font-mono">{order.ordem_servico_ssgen}</TableCell>
                <TableCell className="text-white">{order.cliente}</TableCell>
                <TableCell className="text-zenith-gray text-sm">{order.representante}</TableCell>
                <TableCell className="text-zenith-gray text-sm">{order.coordenador}</TableCell>
                <TableCell className="text-zenith-gray text-sm">{order.nome_produto || '-'}</TableCell>
                <TableCell className="text-white text-center">{order.numero_amostras || 0}</TableCell>
                <TableCell className="text-success text-right font-semibold">
                  R$ {(order.valor_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={order.dias_desde_liberacao > 7 ? 'destructive' : order.dias_desde_liberacao > 3 ? 'warning' : 'default'}>
                    {order.dias_desde_liberacao}d
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order);
                      setInvoiceDate(new Date().toISOString().split('T')[0]);
                    }}
                    className="bg-success hover:bg-success/80 text-white"
                  >
                    Faturar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="bg-zenith-card border-zenith-navy text-white">
          <DialogHeader>
            <DialogTitle className="text-zenith-gold">Confirmar Faturamento</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zenith-gray">OS SSGEN:</span>
                  <div className="text-white font-semibold">{selectedOrder.ordem_servico_ssgen}</div>
                </div>
                <div>
                  <span className="text-zenith-gray">Cliente:</span>
                  <div className="text-white font-semibold">{selectedOrder.cliente}</div>
                </div>
                <div>
                  <span className="text-zenith-gray">Amostras:</span>
                  <div className="text-white font-semibold">{selectedOrder.numero_amostras}</div>
                </div>
                <div>
                  <span className="text-zenith-gray">Valor:</span>
                  <div className="text-success font-semibold">
                    R$ {(selectedOrder.valor_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invoiceDate" className="text-white">Data de Faturamento</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="bg-zenith-bg border-zenith-navy text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="border-zenith-navy text-white">
              Cancelar
            </Button>
            <Button onClick={handleInvoice} disabled={!invoiceDate} className="bg-success hover:bg-success/80">
              <Calendar className="w-4 h-4 mr-2" />
              Confirmar Faturamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
