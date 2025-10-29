import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CircleDollarSign, Clock3, CalendarDays } from 'lucide-react';
import type { PowerRow } from '@/types/ssgen';
import { isSet } from '@/types/ssgen';
import { HeaderBar } from '../shared/HeaderBar';
import { FilterRow } from '../shared/FilterRow';
import { Kpi } from '../shared/KpiCard';
import { ChartsBlock } from '../shared/ChartsBlock';
import { TableOrdens } from '../shared/OrdersTable';

interface ManagerDashboardProps {
  rows: PowerRow[];
  filters: any;
  setFilters: (f: any) => void;
  onOpen: (r: PowerRow) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ rows, filters, setFilters, onOpen }) => {
  const reps = Array.from(new Set(rows.map((r) => r.REP))).sort() as string[];
  const clientes = Array.from(new Set(rows.map((r) => r.CLIENTE))).sort() as string[];
  const produtos = Array.from(new Set(rows.map((r) => r.PROD_SSG || r.PROD_NEOGEN))).filter(Boolean) as string[];

  const active = rows.filter((r) => !isSet(r.DT_FATUR_SSG)).length;
  const cra = rows.filter((r) => isSet(r.DT_CRA)).length;
  const vriPend = rows.filter((r) => (r.N_VRI ?? 0) > 0 && !isSet(r.DT_VRI)).length;
  const lprPend = rows.filter((r) => (r.N_LPR ?? 0) > 0 && !isSet(r.DT_LPR)).length;
  const lrPend = rows.filter((r) => (r.N_LR ?? 0) > 0 && !isSet(r.DT_LR)).length;
  const aFaturar = rows.filter((r) => isSet(r.DT_RESULT_SSG) && !isSet(r.DT_FATUR_SSG)).length;

  return (
    <div className="space-y-4">
      <HeaderBar title="Dashboard • Gerente" query={filters.q} setQuery={(v: string) => setFilters((f: any) => ({ ...f, q: v }))} />

      <FilterRow
        showCoord={false}
        showRep
        showCliente
        showProduto
        showPeriodo
        showStatus
        coords={[]}
        reps={reps}
        clientes={clientes}
        produtos={produtos}
        coord={undefined}
        setCoord={() => {}}
        rep={filters.rep}
        setRep={(v) => setFilters((f: any) => ({ ...f, rep: v }))}
        cliente={filters.cliente}
        setCliente={(v) => setFilters((f: any) => ({ ...f, cliente: v }))}
        produto={filters.produto}
        setProduto={(v) => setFilters((f: any) => ({ ...f, produto: v }))}
        onClear={() => setFilters({ q: '' })}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi title="OS SSGEN Ativas" value={active} subtitle="Meu time" icon={<Clock3 className="w-4 h-4" />} />
        <Kpi title="CRA (DT_CRA)" value={cra} subtitle="Meu time" icon={<CalendarDays className="w-4 h-4" />} />
        <Kpi title="VRI Pendentes" value={vriPend} icon={<AlertTriangle className="w-4 h-4" />} />
        <Kpi title="LPR Pendentes" value={lprPend} icon={<AlertTriangle className="w-4 h-4" />} />
        <Kpi title="LR Pendentes" value={lrPend} icon={<AlertTriangle className="w-4 h-4" />} />
        <Kpi title="A Faturar" value={aFaturar} icon={<CircleDollarSign className="w-4 h-4" />} />
      </div>

      <ChartsBlock rows={rows} scopeLabel="Meu time" />

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Ordens do Meu Time</CardTitle>
        </CardHeader>
        <CardContent>
          <TableOrdens rows={rows} allowEdit={false} allowAttach={false} allowFinance={false} onOpen={onOpen} />
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDashboard;
