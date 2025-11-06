import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, AlertCircle, TrendingUp, Users, Package, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { useKpiOrders, useOrdersAging, useMonthlyBillingView } from '@/hooks/useNewKpis';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewDashboard() {
  const [search, setSearch] = useState('');
  const { data: kpis, isLoading: loadingKpis } = useKpiOrders();
  const { data: aging = [], isLoading: loadingAging } = useOrdersAging();
  const { data: monthly = [], isLoading: loadingMonthly } = useMonthlyBillingView();

  const criticalOrders = useMemo(() => aging.filter(o => o.overdue), [aging]);

  const filteredOrders = useMemo(() => {
    if (!search) return aging.slice(0, 10);
    const q = search.toLowerCase();
    return aging.filter(o => 
      o.ordem_servico_ssgen?.toString().includes(q) ||
      o.cliente_nome?.toLowerCase().includes(q) ||
      o.etapa_atual?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [aging, search]);

  const getAgingBadge = (order: any) => {
    if (!order.sla_days) return <Badge variant="secondary">Sem SLA</Badge>;
    const threshold = order.sla_days * 0.8;
    if (order.aging_days <= threshold) {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
        {order.aging_days.toFixed(0)}d
      </Badge>;
    }
    if (order.aging_days <= order.sla_days) {
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
        {order.aging_days.toFixed(0)}d
      </Badge>;
    }
    return <Badge variant="destructive" className="gap-1">
      <AlertCircle className="w-3 h-3" />
      {order.aging_days.toFixed(0)}d
    </Badge>;
  };

  if (loadingKpis) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Operacional</h1>
        {criticalOrders.length > 0 && (
          <Badge variant="destructive" className="gap-2">
            <AlertCircle className="w-4 h-4" />
            {criticalOrders.length} Alertas Críticos
          </Badge>
        )}
      </div>

      {/* KPI Cards - Compactos em Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Ordens</span>
          </div>
          <div className="text-2xl font-bold">{kpis?.total_orders ?? 0}</div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Amostras</span>
          </div>
          <div className="text-2xl font-bold">{kpis?.total_samples ?? 0}</div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">Clientes Ativos</span>
          </div>
          <div className="text-2xl font-bold">{kpis?.active_clients ?? 0}</div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">Em Processamento</span>
          </div>
          <div className="text-2xl font-bold">{kpis?.em_processamento ?? 0}</div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">A Faturar</span>
          </div>
          <div className="text-2xl font-bold">{kpis?.a_faturar ?? 0}</div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Concluídas Hoje</span>
          </div>
          <div className="text-2xl font-bold">{kpis?.concluidas_hoje ?? 0}</div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-muted-foreground">TAT Médio (dias)</span>
          </div>
          <div className="text-2xl font-bold">{kpis?.avg_tat_days?.toFixed(1) ?? '0.0'}</div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">SLA Geral</span>
          </div>
          <div className="text-2xl font-bold">{((kpis?.sla_on_time_ratio ?? 0) * 100).toFixed(0)}%</div>
        </Card>
      </div>

      {/* Resumo Executivo */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <p className="text-sm">
          <strong>Resumo:</strong> Operação com <strong>{kpis?.open_orders ?? 0}</strong> OS ativas.
          {criticalOrders.length > 0 && (
            <span className="text-destructive ml-1">
              Priorize {criticalOrders.length} ordem(ns) atrasada(s)!
            </span>
          )}
        </p>
      </Card>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Evolução de Faturamento</h3>
          {loadingMonthly ? (
            <Skeleton className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`} />
                <Area type="monotone" dataKey="total_revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Abertas vs Concluídas</h3>
          {loadingKpis ? (
            <Skeleton className="h-64" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Status', Abertas: kpis?.open_orders ?? 0, Concluídas: kpis?.closed_orders ?? 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Abertas" fill="hsl(var(--primary))" />
                <Bar dataKey="Concluídas" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Tabela de Ordens */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Ordens Ativas</h3>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar OS ou Cliente..." 
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loadingAging ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">OS</th>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Etapa</th>
                  <th className="text-left p-2">Prioridade</th>
                  <th className="text-left p-2">Aging</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono">{order.ordem_servico_ssgen}</td>
                    <td className="p-2">{order.cliente_nome || '-'}</td>
                    <td className="p-2">
                      <Badge variant="outline">{order.etapa_atual}</Badge>
                    </td>
                    <td className="p-2">
                      <Badge 
                        variant={order.prioridade === 'Alta' ? 'destructive' : 'secondary'}
                      >
                        {order.prioridade || 'Normal'}
                      </Badge>
                    </td>
                    <td className="p-2">{getAgingBadge(order)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
