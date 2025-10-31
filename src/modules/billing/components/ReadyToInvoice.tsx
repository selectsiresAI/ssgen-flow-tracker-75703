import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useInvoiceOrder } from '../hooks/useBillingData';
import type { ReadyToInvoice as ReadyToInvoiceType } from '@/lib/billingApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ReadyToInvoiceProps {
  orders: ReadyToInvoiceType[];
}

export function ReadyToInvoice({ orders }: ReadyToInvoiceProps) {
  const [selectedOrder, setSelectedOrder] = useState<ReadyToInvoiceType | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const invoiceMutation = useInvoiceOrder();

  const handleInvoice = async () => {
    if (!selectedOrder) return;
    
    try {
      await invoiceMutation.mutateAsync({
        orderId: selectedOrder.id,
        dt_faturamento: invoiceDate,
      });
      toast.success(`OS ${selectedOrder.ordem_servico_ssgen} faturada com sucesso!`);
      setSelectedOrder(null);
    } catch (error) {
      toast.error('Erro ao faturar ordem');
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-zenith-card rounded-2xl p-6 border border-zenith-navy/30">
        <div className="text-zenith-gold mb-4 font-semibold">Pronto para Faturar</div>
        <div className="text-center py-8 text-zenith-gray">
          Nenhuma ordem pronta para faturamento
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-zenith-card rounded-2xl border border-zenith-navy/30 overflow-hidden">
        <div className="p-4 border-b border-zenith-navy/30">
          <div className="text-zenith-gold font-semibold">
            Pronto para Faturar ({orders.length})
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zenith-navy/50 text-zenith-gold text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">OS SSGEN</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Representante</th>
                <th className="px-4 py-3 text-right">Amostras</th>
                <th className="px-4 py-3 text-right">Valor Est.</th>
                <th className="px-4 py-3 text-center">Dias</th>
                <th className="px-4 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zenith-navy/20">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zenith-navy/10 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm text-white">
                    {order.ordem_servico_ssgen}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{order.cliente}</td>
                  <td className="px-4 py-3 text-sm text-zenith-gray">{order.representante}</td>
                  <td className="px-4 py-3 text-sm text-right text-white">
                    {order.numero_amostras}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-success">
                    R$ {order.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded ${
                      order.dias_desde_liberacao > 7
                        ? 'bg-red-500/20 text-red-400'
                        : order.dias_desde_liberacao > 3
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {order.dias_desde_liberacao}d
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="bg-success hover:bg-success/90 text-white"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Faturar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="bg-zenith-card border-zenith-navy">
          <DialogHeader>
            <DialogTitle className="text-white">Confirmar Faturamento</DialogTitle>
            <DialogDescription className="text-zenith-gray">
              OS {selectedOrder?.ordem_servico_ssgen} - {selectedOrder?.cliente}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-date" className="text-white">
                Data de Faturamento
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zenith-gray" />
                <Input
                  id="invoice-date"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="pl-10 bg-zenith-bg text-white border-zenith-navy"
                />
              </div>
            </div>
            <div className="rounded-lg bg-zenith-navy/30 p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-zenith-gray">Amostras:</span>
                <span className="text-white">{selectedOrder?.numero_amostras}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zenith-gray">Valor Estimado:</span>
                <span className="text-success font-semibold">
                  R$ {selectedOrder?.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              Cancelar
            </Button>
            <Button onClick={handleInvoice} className="bg-success hover:bg-success/90">
              Confirmar Faturamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
