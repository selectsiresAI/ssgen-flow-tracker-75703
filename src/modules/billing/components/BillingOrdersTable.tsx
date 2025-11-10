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
      <div className="bg-card rounded-lg p-6 border">
        <div className="text-foreground mb-4 font-semibold">Ordens Prontas para Faturar</div>
        <div className="text-center text-muted-foreground py-8">
          Nenhuma ordem pronta para faturamento
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-foreground font-semibold">Ordens Prontas para Faturar</div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span className="text-foreground font-semibold">{orders.length}</span> ordens
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="w-4 h-4" />
            <span className="text-foreground font-semibold">{totalSamples}</span> amostras
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span className="text-foreground font-semibold">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>OS SSGEN</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Representante</TableHead>
              <TableHead>Coordenador</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-center">Amostras</TableHead>
              <TableHead className="text-right">Valor Est.</TableHead>
              <TableHead className="text-center">Dias</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono">{order.ordem_servico_ssgen}</TableCell>
                <TableCell>{order.cliente}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{order.representante}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{order.coordenador}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{order.nome_produto || '-'}</TableCell>
                <TableCell className="text-center">{order.numero_amostras || 0}</TableCell>
                <TableCell className="text-green-600 text-right font-semibold">
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
                    className="bg-green-600 hover:bg-green-700 text-white"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Faturamento</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">OS SSGEN:</span>
                  <div className="font-semibold">{selectedOrder.ordem_servico_ssgen}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <div className="font-semibold">{selectedOrder.cliente}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Amostras:</span>
                  <div className="font-semibold">{selectedOrder.numero_amostras}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Valor:</span>
                  <div className="text-green-600 font-semibold">
                    R$ {(selectedOrder.valor_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Data de Faturamento</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              Cancelar
            </Button>
            <Button onClick={handleInvoice} disabled={!invoiceDate} className="bg-green-600 hover:bg-green-700">
              <Calendar className="w-4 h-4 mr-2" />
              Confirmar Faturamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
