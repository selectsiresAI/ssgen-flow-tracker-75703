import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Download, Filter, Search, Upload, AlertTriangle, CircleDollarSign, Clock3, FileSpreadsheet, LayoutDashboard, ListTodo, Receipt, LogOut } from "lucide-react";
import { OrderRow, Role } from "@/types/order";
import { FEATURES } from "@/config/features";
import { getDemoData } from "@/lib/demoData";
import { ChartComponents } from "@/components/ChartComponents";
import { isSet, daysBetween, fmt, slaBadge } from "@/lib/orderUtils";

// Sidebar Component
const Sidebar: React.FC<{ current: string; setCurrent: (k: string) => void; role: Role }> = ({ current, setCurrent, role }) => {
  const admItems = [
    { key: 'adm-geral', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Painel Geral' },
    { key: 'adm-processos', icon: <ListTodo className="w-4 h-4" />, label: 'Painel Processos' },
    { key: 'adm-financeiro', icon: <Receipt className="w-4 h-4" />, label: 'Painel Financeiro' },
  ];
  const gerenteItems = [{ key: 'gerente', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' }];
  const repItems = [{ key: 'rep', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' }];

  const items = role === 'ADM' ? admItems : role === 'GERENTE' ? gerenteItems : repItems;
  
  return (
    <aside className="w-full md:w-64 border-r bg-card">
      <div className="p-4 text-lg font-semibold text-primary">SSGEN Track</div>
      <nav className="p-2 space-y-1">
        {items.map(i => (
          <button
            key={i.key}
            onClick={() => setCurrent(i.key)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:bg-muted ${
              current === i.key ? 'bg-muted text-foreground' : 'text-muted-foreground'
            }`}
          >
            {i.icon}
            <span>{i.label}</span>
          </button>
        ))}
      </nav>
      <Separator className="my-3" />
      <div className="p-2">
        <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={() => alert('Logout')}>
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
};

// KPI Card Component
const KpiCard: React.FC<{ title: string; value: React.ReactNode; subtitle?: string; icon?: React.ReactNode }> = ({ title, value, subtitle, icon }) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </CardContent>
  </Card>
);

// Table Component
const TableOrders: React.FC<{
  rows: OrderRow[];
  allowEdit: boolean;
  allowAttach: boolean;
  allowFinance: boolean;
  onOpen: (r: OrderRow) => void;
}> = ({ rows, allowEdit, allowAttach, allowFinance, onOpen }) => (
  <div className="overflow-x-auto rounded-lg border border-border">
    <table className="min-w-full text-sm">
      <thead className="bg-muted/50">
        <tr className="text-left">
          <th className="p-3 font-medium">OS_SSGEN</th>
          <th className="p-3 font-medium">CLIENTE</th>
          <th className="p-3 font-medium">COORD</th>
          <th className="p-3 font-medium">REP</th>
          <th className="p-3 font-medium">PROD_SSG</th>
          <th className="p-3 font-medium">DT_RESULT_SSG</th>
          <th className="p-3 font-medium">FATUR_SSG</th>
          <th className="p-3 font-medium">SLA</th>
          <th className="p-3 font-medium">Ações</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => {
          const sla = slaBadge(r);
          return (
            <tr key={idx} className="border-t border-border hover:bg-muted/30 transition-colors">
              <td className="p-3 font-medium text-primary cursor-pointer hover:underline" onClick={() => onOpen(r)}>
                {r.os_ssgen}
              </td>
              <td className="p-3">{r.cliente}</td>
              <td className="p-3">{r.coord}</td>
              <td className="p-3">{r.rep}</td>
              <td className="p-3">{r.prod_ssg || "—"}</td>
              <td className="p-3">{fmt(r.dt_result_ssg)}</td>
              <td className="p-3">{isSet(r.fatur_ssg) ? `R$ ${r.fatur_ssg?.toLocaleString()}` : "—"}</td>
              <td className="p-3">
                <Badge variant={sla.tone as any}>{sla.label}</Badge>
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => onOpen(r)}>
                    Detalhes
                  </Button>
                  {allowEdit && <Button variant="outline" size="sm">Editar</Button>}
                  {allowAttach && <Button variant="outline" size="sm">Anexar</Button>}
                  {allowFinance && <Button variant="outline" size="sm">Faturar</Button>}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// Header Component
const Header: React.FC<{ title: string; query: string; setQuery: (s: string) => void }> = ({ title, query, setQuery }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9 w-[260px]"
          placeholder="Buscar OS, Cliente ou Representante"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <Button variant="outline" className="gap-2">
        <Filter className="w-4 h-4" />
        Filtros
      </Button>
    </div>
  </div>
);

// Filters Row Component
const FiltersRow: React.FC<{
  showCoord: boolean;
  showRep: boolean;
  showCliente: boolean;
  coords: string[];
  reps: string[];
  clientes: string[];
  coord?: string;
  setCoord: (v: any) => void;
  rep?: string;
  setRep: (v: any) => void;
  cliente?: string;
  setCliente: (v: any) => void;
  onClear: () => void;
}> = props => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
    {props.showCoord && (
      <Select value={props.coord} onValueChange={props.setCoord}>
        <SelectTrigger>
          <SelectValue placeholder="COORD (Gerente)" />
        </SelectTrigger>
        <SelectContent>
          {props.coords.map(c => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
    {props.showRep && (
      <Select value={props.rep} onValueChange={props.setRep}>
        <SelectTrigger>
          <SelectValue placeholder="REP (Representante)" />
        </SelectTrigger>
        <SelectContent>
          {props.reps.map(c => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
    {props.showCliente && (
      <Select value={props.cliente} onValueChange={props.setCliente}>
        <SelectTrigger>
          <SelectValue placeholder="CLIENTE" />
        </SelectTrigger>
        <SelectContent>
          {props.clientes.map(c => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
    <div className="flex gap-2">
      <Button variant="ghost" className="ml-auto" onClick={props.onClear}>
        Limpar
      </Button>
      <Button variant="outline" className="gap-2">
        <FileSpreadsheet className="w-4 h-4" />
        Exportar
      </Button>
    </div>
  </div>
);

export default function SSGENApp() {
  const [role] = useState<Role>('ADM');
  const [orders] = useState<OrderRow[]>(getDemoData());
  const [current, setCurrent] = useState<string>('adm-geral');
  const [query, setQuery] = useState("");
  const [coord, setCoord] = useState<string | undefined>();
  const [rep, setRep] = useState<string | undefined>();
  const [cliente, setCliente] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<OrderRow | null>(null);

  const flags = FEATURES[role];

  const coords = useMemo(() => Array.from(new Set(orders.map(d => d.coord).filter(Boolean))), [orders]);
  const reps = useMemo(() => Array.from(new Set(orders.map(d => d.rep).filter(Boolean))).sort(), [orders]);
  const clientes = useMemo(() => Array.from(new Set(orders.map(d => d.cliente).filter(Boolean))).sort(), [orders]);

  const filtered = useMemo(() => {
    return orders.filter(d => {
      if (coord && d.coord !== coord) return false;
      if (rep && d.rep !== rep) return false;
      if (cliente && d.cliente !== cliente) return false;
      if (query) {
        const q = query.toLowerCase();
        const s = `${d.os_ssgen} ${d.cliente} ${d.rep} ${d.coord}`.toLowerCase();
        if (!s.includes(q)) return false;
      }
      return true;
    });
  }, [orders, coord, rep, cliente, query]);

  const kpis = useMemo(
    () => ({
      active: filtered.filter(r => !isSet(r.dt_fatur_ssg)).length,
      cra: filtered.filter(r => isSet(r.dt_cra)).length,
      vriPend: filtered.filter(r => (r.n_vri ?? 0) > 0 && !isSet(r.dt_vri)).length,
      lprPend: filtered.filter(r => (r.n_lpr ?? 0) > 0 && !isSet(r.dt_lpr)).length,
      lrPend: filtered.filter(r => (r.n_lr ?? 0) > 0 && !isSet(r.dt_lr)).length,
      aFaturar: filtered.filter(r => isSet(r.dt_result_ssg) && !isSet(r.dt_fatur_ssg)).length,
    }),
    [filtered]
  );

  const byRepEtapa = useMemo(() => {
    const repset = Array.from(new Set(filtered.map(r => r.rep)));
    return repset.map(repName => {
      const subset = filtered.filter(r => r.rep === repName);
      return {
        rep: repName,
        SSGEN: subset.filter(r => isSet(r.dt_plan_ssg) || isSet(r.dt_result_ssg) || isSet(r.dt_fatur_ssg)).length,
        NEOGEN: subset.filter(r => isSet(r.dt_cra) || isSet(r.dt_vri) || isSet(r.dt_lpr) || isSet(r.dt_lr)).length,
      };
    });
  }, [filtered]);

  const tempoMedioEtapas = useMemo(() => {
    const calc = (arr: (number | null)[]) => {
      const nums = arr.filter((v): v is number => typeof v === 'number');
      return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
    };
    return [
      { etapa: "OS → Plan", dias: calc(filtered.map(r => daysBetween(r.dt_ssgen_os, r.dt_plan_ssg))) },
      { etapa: "Plan → Result", dias: calc(filtered.map(r => daysBetween(r.dt_plan_ssg, r.dt_result_ssg))) },
      { etapa: "CRA → VRI", dias: calc(filtered.map(r => daysBetween(r.dt_cra, r.dt_vri))) },
      { etapa: "VRI → LPR", dias: calc(filtered.map(r => daysBetween(r.dt_vri, r.dt_lpr))) },
      { etapa: "LPR → LR", dias: calc(filtered.map(r => daysBetween(r.dt_lpr, r.dt_lr))) },
    ];
  }, [filtered]);

  const prodDistrib = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => {
      const key = r.prod_ssg || "—";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const openDetail = (row: OrderRow) => {
    setDetail(row);
    setOpen(true);
  };

  const renderADM_Geral = () => (
    <div className="space-y-6">
      <Header title="Painel Geral — ADM" query={query} setQuery={setQuery} />
      <FiltersRow
        showCoord={flags.filters.coord}
        showRep={flags.filters.rep}
        showCliente={flags.filters.cliente}
        coords={coords as string[]}
        reps={reps as string[]}
        clientes={clientes as string[]}
        coord={coord}
        setCoord={setCoord}
        rep={rep}
        setRep={setRep}
        cliente={cliente}
        setCliente={setCliente}
        onClear={() => {
          setCoord(undefined);
          setRep(undefined);
          setCliente(undefined);
          setQuery("");
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="OS SSGEN Ativas" value={kpis.active} subtitle="Em processamento" icon={<Clock3 className="w-4 h-4" />} />
        <KpiCard title="CRA (DT_CRA)" value={kpis.cra} subtitle="Recebidas" icon={<CalendarDays className="w-4 h-4" />} />
        <KpiCard title="VRI Pendentes" value={kpis.vriPend} icon={<AlertTriangle className="w-4 h-4" />} />
        <KpiCard title="LPR Pendentes" value={kpis.lprPend} icon={<AlertTriangle className="w-4 h-4" />} />
        <KpiCard title="LR Pendentes" value={kpis.lrPend} icon={<AlertTriangle className="w-4 h-4" />} />
        <KpiCard title="A Faturar" value={kpis.aFaturar} icon={<CircleDollarSign className="w-4 h-4" />} />
      </div>

      <ChartComponents byRepEtapa={byRepEtapa} tempoMedioEtapas={tempoMedioEtapas} prodDistrib={prodDistrib} />

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Todas as Ordens</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TableOrders
            rows={filtered}
            allowEdit={flags.table.edit}
            allowAttach={flags.table.attach}
            allowFinance={flags.table.financeMark}
            onOpen={openDetail}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderADM_Processos = () => (
    <div className="space-y-6">
      <Header title="Painel de Processos — ADM" query={query} setQuery={setQuery} />
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Fluxos — SSGEN & NEOGEN</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Kanban por etapas (OS → Plan SSG → Prev Resultado → Resultado → Faturamento) e (CRA → Plan Neogen → VRI → LPR → LR). Drag&drop habilitado para ADM.
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Eventos por Semana (Heatmap)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Heatmap de CRA/VRI/LPR/LR.</CardContent>
      </Card>
    </div>
  );

  const renderADM_Financeiro = () => (
    <div className="space-y-6">
      <Header title="Painel Financeiro — ADM" query={query} setQuery={setQuery} />
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>A Faturar / Faturadas</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Cards e gráficos. Ações de faturamento habilitadas apenas para ADM.
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Lista Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          <TableOrders
            rows={filtered}
            allowEdit={false}
            allowAttach={false}
            allowFinance={flags.panels.financeiro === 'full'}
            onOpen={openDetail}
          />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar current={current} setCurrent={setCurrent} role={role} />
      <main className="flex-1 p-6">
        {role === 'ADM' && current === 'adm-geral' && renderADM_Geral()}
        {role === 'ADM' && current === 'adm-processos' && renderADM_Processos()}
        {role === 'ADM' && current === 'adm-financeiro' && renderADM_Financeiro()}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes — {detail?.os_ssgen}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Identificação</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div>
                      <span className="text-muted-foreground">CLIENTE:</span> {detail.cliente}
                    </div>
                    <div>
                      <span className="text-muted-foreground">COORD:</span> {detail.coord}
                    </div>
                    <div>
                      <span className="text-muted-foreground">REP:</span> {detail.rep}
                    </div>
                    <div>
                      <span className="text-muted-foreground">PROD_SSG:</span> {detail.prod_ssg || "—"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>SLA</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div>
                      <span className="text-muted-foreground">Prev. Resultado:</span> {fmt(detail.dt_prev_result_ssg)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Resultado:</span> {fmt(detail.dt_result_ssg)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Faturamento:</span> {fmt(detail.dt_fatur_ssg)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Badge:</span> <Badge>{slaBadge(detail).label}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Tabs defaultValue="ssgen">
                <TabsList>
                  <TabsTrigger value="ssgen">Fluxo SSGEN</TabsTrigger>
                  <TabsTrigger value="neogen">Fluxo Neogen</TabsTrigger>
                  <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
                  <TabsTrigger value="notas">Notas</TabsTrigger>
                </TabsList>
                <TabsContent value="ssgen">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">OS Criada</CardTitle>
                      </CardHeader>
                      <CardContent>{fmt(detail.dt_ssgen_os)}</CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Plan. SSG</CardTitle>
                      </CardHeader>
                      <CardContent>{fmt(detail.dt_plan_ssg)}</CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Prev. Resultado</CardTitle>
                      </CardHeader>
                      <CardContent>{fmt(detail.dt_prev_result_ssg)}</CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Resultado</CardTitle>
                      </CardHeader>
                      <CardContent>{fmt(detail.dt_result_ssg)}</CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Faturamento</CardTitle>
                      </CardHeader>
                      <CardContent>{fmt(detail.dt_fatur_ssg)}</CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="neogen">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">CRA</CardTitle>
                      </CardHeader>
                      <CardContent>{fmt(detail.dt_cra)}</CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Plan. Neogen</CardTitle>
                      </CardHeader>
                      <CardContent>{fmt(detail.dt_plan_neogen)}</CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">VRI</CardTitle>
                      </CardHeader>
                      <CardContent>{fmt(detail.dt_vri)}</CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">LPR</CardTitle>
                      </CardHeader>
                      <CardContent>{fmt(detail.dt_lpr)}</CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">LR</CardTitle>
                      </CardHeader>
                      <CardContent>{fmt(detail.dt_lr)}</CardContent>
                    </Card>
                  </div>
                  <div className="text-sm mt-3">
                    <span className="text-muted-foreground">Rastreio LR:</span> {detail.lr_rastreio || "—"}
                  </div>
                </TabsContent>
                <TabsContent value="arquivos">
                  <div className="text-sm text-muted-foreground">Uploads/links para arquivos.</div>
                </TabsContent>
                <TabsContent value="notas">
                  <div className="text-sm text-muted-foreground">Notas internas (ADM/Gerente).</div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
