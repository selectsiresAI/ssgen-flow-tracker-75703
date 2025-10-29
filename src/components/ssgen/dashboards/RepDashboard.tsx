import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock3, CalendarDays, ChevronRight } from 'lucide-react';
import type { PowerRow } from '@/types/ssgen';
import { isSet } from '@/types/ssgen';
import { HeaderBar } from '../shared/HeaderBar';
import { FilterRow } from '../shared/FilterRow';
import { Kpi } from '../shared/KpiCard';
import { TableOrdens } from '../shared/OrdersTable';

interface RepDashboardProps {
  rows: PowerRow[];
  filters: any;
  setFilters: (f: any) => void;
  onOpen: (r: PowerRow) => void;
}

const RepDashboard: React.FC<RepDashboardProps> = ({ rows, filters, setFilters, onOpen }) => {
  const clientes = Array.from(new Set(rows.map((r) => r.CLIENTE))).sort() as string[];

  const active = rows.filter((r) => !isSet(r.DT_FATUR_SSG)).length;
  const cra = rows.filter((r) => isSet(r.DT_CRA)).length;
  const vriPend = rows.filter((r) => (r.N_VRI ?? 0) > 0 && !isSet(r.DT_VRI)).length;
  const lprPend = rows.filter((r) => (r.N_LPR ?? 0) > 0 && !isSet(r.DT_LPR)).length;
  const lrPend = rows.filter((r) => (r.N_LR ?? 0) > 0 && !isSet(r.DT_LR)).length;

  const groups: Record<string, PowerRow[]> = {};
  rows.forEach((r) => {
    const k = r.CLIENTE || '—';
    groups[k] = groups[k] || [];
    groups[k].push(r);
  });

  return (
    <div className="space-y-4">
      <HeaderBar title="Dashboard • Representante" query={filters.q} setQuery={(v: string) => setFilters((f: any) => ({ ...f, q: v }))} />

      <FilterRow
        showCoord={false}
        showRep={false}
        showCliente
        showProduto={false}
        showPeriodo
        showStatus
        coords={[]}
        reps={[]}
        clientes={clientes}
        produtos={[]}
        coord={undefined}
        setCoord={() => {}}
        rep={undefined}
        setRep={() => {}}
        cliente={filters.cliente}
        setCliente={(v) => setFilters((f: any) => ({ ...f, cliente: v }))}
        produto={undefined}
        setProduto={() => {}}
        onClear={() => setFilters({ q: '' })}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi title="OS SSGEN Ativas" value={active} icon={<Clock3 className="w-4 h-4" />} />
        <Kpi title="CRA (DT_CRA)" value={cra} icon={<CalendarDays className="w-4 h-4" />} />
        <Kpi title="VRI Pendentes" value={vriPend} icon={<AlertTriangle className="w-4 h-4" />} />
        <Kpi title="LPR Pendentes" value={lprPend} icon={<AlertTriangle className="w-4 h-4" />} />
        <Kpi title="LR Pendentes" value={lrPend} icon={<AlertTriangle className="w-4 h-4" />} />
        <div />
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Minhas Fazendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Object.entries(groups).map(([cli, list]) => (
              <div key={cli} className="border rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{cli}</div>
                  <Button size="sm" variant="ghost" className="gap-1">
                    Ver OS <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                  <span>Ativas: {list.filter((r) => !isSet(r.DT_FATUR_SSG)).length}</span>
                  <span>VRI pend.: {list.filter((r) => (r.N_VRI ?? 0) > 0 && !isSet(r.DT_VRI)).length}</span>
                  <span>LR pend.: {list.filter((r) => (r.N_LR ?? 0) > 0 && !isSet(r.DT_LR)).length}</span>
                  <span>A Faturar: {list.filter((r) => isSet(r.DT_RESULT_SSG) && !isSet(r.DT_FATUR_SSG)).length}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Minhas Ordens</CardTitle>
        </CardHeader>
        <CardContent>
          <TableOrdens rows={rows} allowEdit={false} allowAttach={false} allowFinance={false} onOpen={onOpen} />
        </CardContent>
      </Card>
    </div>
  );
};

export default RepDashboard;
