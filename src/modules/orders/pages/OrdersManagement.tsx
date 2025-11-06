import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Search, Upload, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllServiceOrders, createServiceOrderNew, deleteServiceOrderNew, upsertServiceOrderFromExcel } from '@/lib/newOrdersApi';
import { useUpdateOrderStage } from '@/hooks/useNewKpis';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { parseISO, format, isValid } from 'date-fns';

const ETAPAS = [
  'Recebida',
  'Em processamento',
  'Em análise',
  'Aguardando Liberação',
  'Liberada',
  'Concluída',
  'Cancelada',
];

function parseExcelDate(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') {
    // Tentar dd/mm/yyyy
    const parts = val.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (isValid(d)) return d.toISOString();
    }
    // Tentar ISO
    const iso = parseISO(val);
    if (isValid(iso)) return iso.toISOString();
  }
  if (typeof val === 'number') {
    // Excel serial date
    const d = new Date((val - 25569) * 86400 * 1000);
    if (isValid(d)) return d.toISOString();
  }
  return null;
}

export default function OrdersManagement() {
  const [search, setSearch] = useState('');
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['service_orders'],
    queryFn: fetchAllServiceOrders,
    refetchInterval: 30000,
  });

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => supabase.auth.getUser(),
  });
  
  const user = userData?.data?.user;

  const updateStageMutation = useUpdateOrderStage();
  const deleteMutation = useMutation({
    mutationFn: deleteServiceOrderNew,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_orders'] });
      queryClient.invalidateQueries({ queryKey: ['v_kpi_orders'] });
      queryClient.invalidateQueries({ queryKey: ['v_orders_aging'] });
      toast.success('Ordem excluída com sucesso');
    },
    onError: () => toast.error('Erro ao excluir ordem'),
  });

  const filtered = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(o =>
      o.ordem_servico_ssgen?.toString().includes(q) ||
      o.etapa_atual?.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const handleStageChange = async (orderId: string, newEtapa: string) => {
    try {
      await updateStageMutation.mutateAsync({
        orderId,
        etapa: newEtapa,
        userId: user?.id || null,
      });
      toast.success('Etapa atualizada');
    } catch {
      toast.error('Erro ao atualizar etapa');
    }
  };

  const handleDelete = async () => {
    if (!deleteOrderId) return;
    await deleteMutation.mutateAsync(deleteOrderId);
    setDeleteOrderId(null);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(firstSheet);
        
        let inserted = 0;
        let updated = 0;
        let errors = 0;
        
        for (const row of rows) {
          try {
            const orderData: any = {};
            
            // Mapear campos conhecidos
            if (row.ordem_servico_ssgen) orderData.ordem_servico_ssgen = Number(row.ordem_servico_ssgen);
            if (row.ordem_servico_neogen) orderData.ordem_servico_neogen = Number(row.ordem_servico_neogen);
            if (row.numero_nf_neogen) orderData.numero_nf_neogen = Number(row.numero_nf_neogen);
            if (row.numero_amostras) orderData.numero_amostras = Number(row.numero_amostras);
            if (row.etapa_atual) orderData.etapa_atual = row.etapa_atual;
            if (row.prioridade) orderData.prioridade = row.prioridade;
            if (row.sla_days) orderData.sla_days = Number(row.sla_days);
            if (row.nome_produto) orderData.nome_produto = row.nome_produto;
            
            // Datas
            if (row.cra_data) orderData.cra_data = parseExcelDate(row.cra_data);
            if (row.envio_planilha_data) orderData.envio_planilha_data = parseExcelDate(row.envio_planilha_data);
            if (row.vri_data) orderData.vri_data = parseExcelDate(row.vri_data);
            if (row.lpr_data) orderData.lpr_data = parseExcelDate(row.lpr_data);
            if (row.received_at) orderData.received_at = parseExcelDate(row.received_at);
            if (row.liberacao_data) orderData.liberacao_data = parseExcelDate(row.liberacao_data);
            
            const result = await upsertServiceOrderFromExcel(orderData);
            if (orderData.ordem_servico_ssgen) updated++;
            else inserted++;
          } catch {
            errors++;
          }
        }
        
        queryClient.invalidateQueries({ queryKey: ['service_orders'] });
        queryClient.invalidateQueries({ queryKey: ['v_kpi_orders'] });
        toast.success(`Import: ${inserted} inseridas, ${updated} atualizadas${errors > 0 ? `, ${errors} erros` : ''}`);
        setUploadFile(null);
      };
      reader.readAsArrayBuffer(uploadFile);
    } catch {
      toast.error('Erro ao importar arquivo');
    }
  };

  const getAgingBadge = (order: any) => {
    const start = order.received_at || order.created_at;
    if (!start) return null;
    const now = new Date();
    const startDate = new Date(start);
    const days = Math.floor((now.getTime() - startDate.getTime()) / 86400000);
    
    if (!order.sla_days) return <Badge variant="secondary">{days}d</Badge>;
    const threshold = order.sla_days * 0.8;
    
    if (days <= threshold) {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{days}d</Badge>;
    }
    if (days <= order.sla_days) {
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">{days}d</Badge>;
    }
    return <Badge variant="destructive" className="gap-1">
      <AlertCircle className="w-3 h-3" />
      {days}d
    </Badge>;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Ordens</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setUploadFile(e.target.files[0]);
              }
            }}
          />
          <Button size="sm" onClick={() => setNewOrderOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova OS
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por OS ou Etapa..." 
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Upload Dialog */}
      {uploadFile && (
        <Dialog open={!!uploadFile} onOpenChange={() => setUploadFile(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Import</DialogTitle>
              <DialogDescription>
                Arquivo: <strong>{uploadFile.name}</strong>
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Campos vazios serão ignorados. Se houver ordem_servico_ssgen, será atualizado; caso contrário, será criado novo registro.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadFile(null)}>Cancelar</Button>
              <Button onClick={handleUpload}>Confirmar Import</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* New Order Dialog */}
      <Dialog open={newOrderOpen} onOpenChange={setNewOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data: any = {
              received_at: new Date().toISOString(),
              etapa_atual: 'Recebida',
            };
            if (formData.get('prioridade')) data.prioridade = formData.get('prioridade');
            if (formData.get('sla_days')) data.sla_days = Number(formData.get('sla_days'));
            if (formData.get('nome_produto')) data.nome_produto = formData.get('nome_produto');
            
            try {
              await createServiceOrderNew(data);
              queryClient.invalidateQueries({ queryKey: ['service_orders'] });
              queryClient.invalidateQueries({ queryKey: ['v_kpi_orders'] });
              toast.success('Ordem criada com sucesso');
              setNewOrderOpen(false);
            } catch {
              toast.error('Erro ao criar ordem');
            }
          }}>
            <div className="space-y-4">
              <div>
                <Label>Produto</Label>
                <Input name="nome_produto" placeholder="Nome do Produto" />
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select name="prioridade">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>SLA (dias)</Label>
                <Input name="sla_days" type="number" placeholder="Ex: 5" />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setNewOrderOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={() => setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ordem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3">OS SSGEN</th>
                <th className="text-left p-3">Produto</th>
                <th className="text-left p-3">Etapa</th>
                <th className="text-left p-3">Prioridade</th>
                <th className="text-left p-3">Aging</th>
                <th className="text-left p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono">{order.ordem_servico_ssgen || '-'}</td>
                  <td className="p-3">{order.nome_produto || '-'}</td>
                  <td className="p-3">
                    <Select
                      value={order.etapa_atual}
                      onValueChange={(val) => handleStageChange(order.id, val)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ETAPAS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3">
                    <Badge variant={order.prioridade === 'Alta' ? 'destructive' : 'secondary'}>
                      {order.prioridade || 'Normal'}
                    </Badge>
                  </td>
                  <td className="p-3">{getAgingBadge(order)}</td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteOrderId(order.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
