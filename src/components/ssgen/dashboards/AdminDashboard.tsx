import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FolderOpenDot, AlertTriangle, CircleDollarSign, Clock3, CalendarDays } from 'lucide-react';
import type { PowerRow } from '@/types/ssgen';
import { isSet } from '@/types/ssgen';
import { HeaderBar } from '../shared/HeaderBar';
import { FilterRow } from '../shared/FilterRow';
import { Kpi } from '../shared/KpiCard';
import { ChartsBlock } from '../shared/ChartsBlock';
import { TableOrdens } from '../shared/OrdersTable';

interface AdminDashboardProps {
  rows: PowerRow[];
  filters: any;
  setFilters: (f: any) => void;
  onOpen: (r: PowerRow) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ rows, filters, setFilters, onOpen }) => {
  const active = rows.filter((r) => !isSet(r.DT_FATUR_SSG)).length;
  const cra = rows.filter((r) => isSet(r.DT_CRA)).length;
  const vriPend = rows.filter((r) => (r.N_VRI ?? 0) > 0 && !isSet(r.DT_VRI)).length;
  const lprPend = rows.filter((r) => (r.N_LPR ?? 0) > 0 && !isSet(r.DT_LPR)).length;
  const lrPend = rows.filter((r) => (r.N_LR ?? 0) > 0 && !isSet(r.DT_LR)).length;
  const aFaturar = rows.filter((r) => isSet(r.DT_RESULT_SSG) && !isSet(r.DT_FATUR_SSG)).length;

  const coords = Array.from(new Set(rows.map((r) => r.COORD))).filter(Boolean) as string[];
  const reps = Array.from(new Set(rows.map((r) => r.REP)))
    .filter(Boolean)
    .sort() as string[];
  const clientes = Array.from(new Set(rows.map((r) => r.CLIENTE)))
    .filter(Boolean)
    .sort() as string[];
  const produtos = Array.from(new Set(rows.map((r) => r.PROD_SSG || r.PROD_NEOGEN))).filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      <HeaderBar
        title="Dashboard • ADM"
        query={filters.q}
        setQuery={(v: string) => setFilters((f: any) => ({ ...f, q: v }))}
      >
        <Button variant="outline" className="gap-2">
          <FolderOpenDot className="w-4 h-4" />
          Uploads
        </Button>
      </HeaderBar>

      <FilterRow
        showCoord
        showRep
        showCliente
        showProduto
        showPeriodo
        showStatus
        coords={coords}
        reps={reps}
        clientes={clientes}
        produtos={produtos}
        coord={filters.coord}
        setCoord={(v) => setFilters((f: any) => ({ ...f, coord: v }))}
        rep={filters.rep}
        setRep={(v) => setFilters((f: any) => ({ ...f, rep: v }))}
        cliente={filters.cliente}
        setCliente={(v) => setFilters((f: any) => ({ ...f, cliente: v }))}
        produto={filters.produto}
        setProduto={(v) => setFilters((f: any) => ({ ...f, produto: v }))}
        onClear={() => setFilters({ q: '' })}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi
          title="OS SSGEN Ativas"
          value={active}
          subtitle="Em processamento"
          icon={<Clock3 className="w-4 h-4" />}
        />
        <Kpi title="CRA (DT_CRA)" value={cra} subtitle="Recebidas" icon={<CalendarDays className="w-4 h-4" />} />
        <Kpi title="VRI Pendentes (N_VRI)" value={vriPend} icon={<AlertTriangle className="w-4 h-4" />} />
        <Kpi title="LPR Pendentes (N_LPR)" value={lprPend} icon={<AlertTriangle className="w-4 h-4" />} />
        <Kpi title="LR Pendentes (N_LR)" value={lrPend} icon={<AlertTriangle className="w-4 h-4" />} />
        <Kpi title="A Faturar (FATUR_SSG)" value={aFaturar} icon={<CircleDollarSign className="w-4 h-4" />} />
      </div>

      <ChartsBlock rows={rows} scopeLabel="SSGEN × NEOGEN" />

      <Card className="rounded-xl">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Tabela Mestre</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TableOrdens rows={rows} allowEdit allowAttach allowFinance onOpen={onOpen} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
