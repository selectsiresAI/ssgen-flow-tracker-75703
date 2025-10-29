import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import { CalendarDays, Download, Filter, Search, Upload, AlertTriangle, CircleDollarSign, Clock3, FileSpreadsheet, LayoutDashboard, ListTodo, Receipt, Settings, Users2, UserSquare2, Building2, LogOut, FolderOpenDot, ChevronRight } from "lucide-react";

// =========================
// 0) ENV seguro + Supabase Client
// =========================
const safeEnv = (k: string): string | undefined => {
  const pe = (typeof process !== 'undefined' && (process as any).env) ? (process as any).env[k] : undefined;
  if (pe) return pe as string;
  const ime = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env[k] : undefined;
  if (ime) return ime as string;
  const glb = (globalThis as any)?.[k];
  if (glb) return glb as string;
  return undefined;
};

const SUPABASE_URL = safeEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = safeEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
}

// =========================
// 1) Tipos & helpers (colunas EXATAS do Excel)
// =========================
export type Role = 'ADM'|'GERENTE'|'REPRESENTANTE';
export type Profile = { id: string; email: string; role: Role; coord?: string|null; rep?: string|null };

export type PowerRow = {
  id?: string;
  Ord?: string|number;
  OS_SSGEN: string;
  DT_SSGEN_OS?: string|null;
  COD_SSB?: string|null;
  CLIENTE: string;
  LIB_CAD_CLIENTE?: string|null;
  PLAN_SSG?: string|null; DT_PLAN_SSG?: string|null;
  PROD_SSG?: string|null; N_AMOSTRAS_SSG?: number|null;
  DT_PREV_RESULT_SSG?: string|null; RESULT_SSG?: string|null; DT_RESULT_SSG?: string|null;
  FATUR_TIPO?: string|null; FATUR_SSG?: number|null; DT_FATUR_SSG?: string|null;
  REP: string; COORD: string;
  OS_NEOGEN?: string|null;
  PROD_NEOGEN?: string|null; N_AMOSTRAS_NEOGEN?: number|null;
  DT_CRA?: string|null;
  PLAN_NEOGEN?: string|null; DT_PLAN_NEOGEN?: string|null;
  N_VRI?: number|null; DT_VRI?: string|null;
  N_LPR?: number|null; DT_LPR?: string|null;
  N_LR?: number|null;  DT_LR?: string|null; LR_RASTREIO?: string|null;
  NF_NEOGEM?: string|null; NF_NA_NEOGEN?: string|null;
  created_at?: string; updated_at?: string;
};

const isSet = (v: any) => v !== null && v !== undefined && v !== '';
const fmt = (s?: string|null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '—');
const dBetween = (a?: string|null, b?: string|null) => {
  if (!a || !b) return null; const da = new Date(a).getTime(); const db = new Date(b).getTime();
  return Math.round((db - da) / (1000*60*60*24));
};
const slaBadge = (row: PowerRow) => {
  const tgt = row.DT_PREV_RESULT_SSG; if (!tgt) return {label:'—', tone:'secondary'} as const;
  const d = dBetween(tgt, new Date().toISOString().slice(0,10)); if (d===null) return {label:'—', tone:'secondary'} as const;
  if (d < 0) return {label:`${d}d`, tone:'success'} as const; if (d===0) return {label:'D0', tone:'warning'} as const;
  return {label:`+${d}d`, tone:'destructive'} as const;
};

// =========================
// 2) Data access (Supabase RPC/View)
// =========================
async function getProfile(): Promise<Profile|null> {
  if (!supabase) return { id: 'local', email: 'mock@local', role: 'ADM' };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.rpc('my_profile');
  if (error) { console.error(error); return null; }
  return data as Profile;
}

async function fetchOrders(): Promise<PowerRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('vw_orders_powerbi').select('*');
  if (error) { console.error(error); return []; }
  return (data as any[]).map(r=>({ ...r }));
}

// =========================
// 3) Sidebar / Navegação principal
// =========================
const Sidebar: React.FC<{ current: string; setCurrent: (k: string)=>void; role: Role }>=({current,setCurrent,role})=>{
  const items = [
    { key: 'dashboard', label: 'Dashboard', icon:<LayoutDashboard className="w-4 h-4"/> },
    { key: 'ordens', label: 'Ordens', icon:<ListTodo className="w-4 h-4"/> },
    { key: 'clientes', label: 'Clientes', icon:<Building2 className="w-4 h-4"/> },
    { key: 'representantes', label: 'Representantes', icon:<Users2 className="w-4 h-4"/> },
    { key: 'gerentes', label: 'Gerentes', icon:<UserSquare2 className="w-4 h-4"/> },
    { key: 'faturamento', label: 'Faturamento', icon:<Receipt className="w-4 h-4"/> },
    { key: 'config', label: 'Configurações', icon:<Settings className="w-4 h-4"/> },
  ];

  const allow = (k:string)=>{
    if (role==='REPRESENTANTE' && (k==='gerentes'||k==='config')) return false;
    if (role==='GERENTE' && (k==='config')) return false;
    return true;
  };

  return (
    <aside className="w-full md:w-72 border-r bg-background">
      <div className="p-4 text-lg font-semibold">SSGEN Track</div>
      <nav className="p-2 space-y-1">
        {items.filter(i=>allow(i.key)).map(i=> (
          <button key={i.key} onClick={()=>setCurrent(i.key)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-muted transition-colors ${current===i.key?'bg-muted':''}`}>
            {i.icon}<span>{i.label}</span>
          </button>
        ))}
      </nav>
      <Separator className="my-3"/>
      <div className="p-2">
        <Button variant="ghost" className="w-full gap-2" onClick={async()=>{ if(supabase) await supabase.auth.signOut(); location.reload(); }}>
          <LogOut className="w-4 h-4"/>Sair
        </Button>
      </div>
    </aside>
  );
};

// =========================
// 4) Base UI (Header, Filtros, KPI, Tabela, Charts)
// =========================
const HeaderBar: React.FC<{ title: string; query: string; setQuery:(v:string)=>void; children?: React.ReactNode }>=({title,query,setQuery,children})=> (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <h1 className="text-2xl font-semibold">{title}</h1>
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9 w-[260px]" placeholder="Buscar por OS_SSGEN, CLIENTE, REP, COORD" value={query} onChange={e=>setQuery(e.target.value)} />
      </div>
      <Button variant="outline" className="gap-2"><Filter className="w-4 h-4"/>Filtros</Button>
      {children}
    </div>
  </div>
);

const FilterRow: React.FC<{
  showCoord:boolean; showRep:boolean; showCliente:boolean; showProduto:boolean; showPeriodo:boolean; showStatus:boolean;
  coords:string[]; reps:string[]; clientes:string[]; produtos:string[];
  coord?:string; setCoord:(v:string|undefined)=>void;
  rep?:string; setRep:(v:string|undefined)=>void;
  cliente?:string; setCliente:(v:string|undefined)=>void;
  produto?:string; setProduto:(v:string|undefined)=>void;
  onClear:()=>void;
}>= (p)=> (
  <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
    {p.showCoord && (
      <Select value={p.coord} onValueChange={(v)=>p.setCoord(v)}>
        <SelectTrigger><SelectValue placeholder="COORD (Gerente)"/></SelectTrigger>
        <SelectContent>{p.coords.map(c=>(<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
      </Select>
    )}
    {p.showRep && (
      <Select value={p.rep} onValueChange={(v)=>p.setRep(v)}>
        <SelectTrigger><SelectValue placeholder="REP (Representante)"/></SelectTrigger>
        <SelectContent>{p.reps.map(c=>(<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
      </Select>
    )}
    {p.showCliente && (
      <Select value={p.cliente} onValueChange={(v)=>p.setCliente(v)}>
        <SelectTrigger><SelectValue placeholder="CLIENTE"/></SelectTrigger>
        <SelectContent>{p.clientes.map(c=>(<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
      </Select>
    )}
    {p.showProduto && (
      <Select value={p.produto} onValueChange={(v)=>p.setProduto(v)}>
        <SelectTrigger><SelectValue placeholder="Produto (PROD_SSG/PROD_NEOGEN)"/></SelectTrigger>
        <SelectContent>{p.produtos.map(c=>(<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
      </Select>
    )}
    {p.showPeriodo && (
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-2 border rounded-lg">Período: use DT_SSGEN_OS (implementar datepicker)</div>
    )}
    {p.showStatus && (
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-2 border rounded-lg">Status: derivado por datas (ver regras)</div>
    )}
    <div className="flex items-center gap-2">
      <Button variant="ghost" className="ml-auto" onClick={p.onClear}>Limpar</Button>
      <Button variant="outline" className="gap-2"><FileSpreadsheet className="w-4 h-4"/>Exportar</Button>
    </div>
  </div>
);

const Kpi: React.FC<{title:string; value:React.ReactNode; subtitle?:string; icon?:React.ReactNode}>=({title,value,subtitle,icon})=> (
  <Card className="rounded-xl shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon && <div className="text-muted-foreground">{icon}</div>}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </CardContent>
  </Card>
);

const TableOrdens: React.FC<{ rows: PowerRow[]; allowEdit:boolean; allowAttach:boolean; allowFinance:boolean; onOpen:(r:PowerRow)=>void }>=({rows,allowEdit,allowAttach,allowFinance,onOpen})=> (
  <div className="overflow-x-auto rounded-xl border">
    <table className="min-w-[1200px] text-sm">
      <thead className="bg-muted/40 sticky top-0">
        <tr className="text-left">
          {['OS_SSGEN','CLIENTE','COORD','REP','PROD_SSG','N_AMOSTRAS_SSG','DT_SSGEN_OS','DT_PREV_RESULT_SSG','RESULT_SSG','DT_RESULT_SSG','FATUR_TIPO','FATUR_SSG','DT_FATUR_SSG','OS_NEOGEN','DT_CRA','PLAN_NEOGEN','DT_PLAN_NEOGEN','N_VRI','DT_VRI','N_LPR','DT_LPR','N_LR','DT_LR','LR_RASTREIO','NF_NEOGEM','SLA'].map(h=> (
            <th key={h} className="p-3 whitespace-nowrap">{h}</th>
          ))}
          <th className="p-3">Ações</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r,i)=>{
          const sla = slaBadge(r);
          return (
            <tr key={r.OS_SSGEN + '-' + i} className="border-t hover:bg-muted/30 transition-colors">
              <td className="p-3 font-medium text-primary cursor-pointer" onClick={()=>onOpen(r)}>{r.OS_SSGEN}</td>
              <td className="p-3">{r.CLIENTE}</td>
              <td className="p-3">{r.COORD}</td>
              <td className="p-3">{r.REP}</td>
              <td className="p-3">{r.PROD_SSG || '—'}</td>
              <td className="p-3">{isSet(r.N_AMOSTRAS_SSG)? r.N_AMOSTRAS_SSG : '—'}</td>
              <td className="p-3">{fmt(r.DT_SSGEN_OS)}</td>
              <td className="p-3">{fmt(r.DT_PREV_RESULT_SSG)}</td>
              <td className="p-3">{r.RESULT_SSG || '—'}</td>
              <td className="p-3">{fmt(r.DT_RESULT_SSG)}</td>
              <td className="p-3">{r.FATUR_TIPO || '—'}</td>
              <td className="p-3">{isSet(r.FATUR_SSG)? String(r.FATUR_SSG): '—'}</td>
              <td className="p-3">{fmt(r.DT_FATUR_SSG)}</td>
              <td className="p-3">{r.OS_NEOGEN || '—'}</td>
              <td className="p-3">{fmt(r.DT_CRA)}</td>
              <td className="p-3">{r.PLAN_NEOGEN || '—'}</td>
              <td className="p-3">{fmt(r.DT_PLAN_NEOGEN)}</td>
              <td className="p-3">{isSet(r.N_VRI)? r.N_VRI: '—'}</td>
              <td className="p-3">{fmt(r.DT_VRI)}</td>
              <td className="p-3">{isSet(r.N_LPR)? r.N_LPR: '—'}</td>
              <td className="p-3">{fmt(r.DT_LPR)}</td>
              <td className="p-3">{isSet(r.N_LR)? r.N_LR: '—'}</td>
              <td className="p-3">{fmt(r.DT_LR)}</td>
              <td className="p-3">{r.LR_RASTREIO || '—'}</td>
              <td className="p-3">{r.NF_NEOGEM || '—'}</td>
              <td className="p-3"><Badge variant={sla.tone as any}>{sla.label}</Badge></td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={()=>onOpen(r)}>Detalhes</Button>
                  {allowEdit && <Button size="sm" variant="outline">Editar</Button>}
                  {allowAttach && <Button size="sm" variant="outline">Anexar</Button>}
                  {allowFinance && <Button size="sm" variant="outline">Faturar</Button>}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// Gráficos: wrapper lazy para `recharts`
const ChartsBlock: React.FC<{ rows:PowerRow[]; scopeLabel:string }>=({rows,scopeLabel})=>{
  const [RC,setRC] = useState<any|null>(null);
  useEffect(()=>{ let on=true; import('recharts').then(m=>{ if(on) setRC(m); }).catch(console.error); return ()=>{on=false}; },[]);
  if(!RC) return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <Card><CardHeader><CardTitle>Carregando gráficos…</CardTitle></CardHeader><CardContent className="h-64"/></Card>
      <Card><CardHeader><CardTitle>Carregando gráficos…</CardTitle></CardHeader><CardContent className="h-64"/></Card>
      <Card><CardHeader><CardTitle>Carregando gráficos…</CardTitle></CardHeader><CardContent className="h-64"/></Card>
    </div>
  );
  const { ResponsiveContainer, CartesianGrid, Tooltip, Legend, XAxis, YAxis, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } = RC as any;

  const reps = Array.from(new Set(rows.map(r=>r.REP))).sort();
  const barData = reps.map(rep=>{
    const subset = rows.filter(r=>r.REP===rep);
    const ssgen = subset.filter(r=> isSet(r.DT_PLAN_SSG) || isSet(r.DT_RESULT_SSG) || isSet(r.DT_FATUR_SSG)).length;
    const neogen= subset.filter(r=> isSet(r.DT_CRA) || isSet(r.DT_VRI) || isSet(r.DT_LPR) || isSet(r.DT_LR)).length;
    return { REP: rep, SSGEN: ssgen, NEOGEN: neogen };
  });

  const avg = (arr:(number|null)[])=>{ const n=arr.filter((x):x is number=>typeof x==='number'); return n.length? Math.round(n.reduce((a,b)=>a+b,0)/n.length):0; };
  const lineData = [
    { etapa: 'SSGEN: OS → Plan', dias: avg(rows.map(r=> dBetween(r.DT_SSGEN_OS!, r.DT_PLAN_SSG!))) },
    { etapa: 'SSGEN: Plan → Resultado', dias: avg(rows.map(r=> dBetween(r.DT_PLAN_SSG!, r.DT_RESULT_SSG!))) },
    { etapa: 'NEOGEN: CRA → VRI', dias: avg(rows.map(r=> dBetween(r.DT_CRA!, r.DT_VRI!))) },
    { etapa: 'NEOGEN: VRI → LPR', dias: avg(rows.map(r=> dBetween(r.DT_VRI!, r.DT_LPR!))) },
    { etapa: 'NEOGEN: LPR → LR', dias: avg(rows.map(r=> dBetween(r.DT_LPR!, r.DT_LR!))) },
  ];

  const donutMap: Record<string, number> = {};
  rows.forEach(r=>{ const k = r.PROD_SSG || r.PROD_NEOGEN || '—'; donutMap[k] = (donutMap[k]||0)+1; });
  const donutData = Object.entries(donutMap).map(([name,value])=>({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <Card className="rounded-xl">
        <CardHeader><CardTitle>Quantidade por REP × Etapa ({scopeLabel})</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
              <XAxis dataKey="REP" stroke="hsl(var(--foreground))"/><YAxis stroke="hsl(var(--foreground))"/><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}/><Legend/>
              <Bar dataKey="SSGEN" fill="hsl(var(--primary))"/><Bar dataKey="NEOGEN" fill="hsl(var(--success))"/>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader><CardTitle>Tempo médio por etapa (dias)</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
              <XAxis dataKey="etapa" interval={0} angle={-15} textAnchor="end" height={60} stroke="hsl(var(--foreground))"/>
              <YAxis stroke="hsl(var(--foreground))"/><Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}/>
              <Line dataKey="dias" stroke="hsl(var(--primary))" strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader><CardTitle>Distribuição por PROD_SSG/PROD_NEOGEN</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name" label>
                {donutData.map((_,i)=>(<Cell key={i} fill={`hsl(var(--chart-${(i%5)+1}))`}/>))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}/>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

// =========================
// 5) Painéis ADM (Imagens 1,2,3) + módulos de apoio
// =========================
const AdmPainelGeral: React.FC<{ rows:PowerRow[]; filters:any; setFilters:any; onOpen:(r:PowerRow)=>void }>=({rows,filters,setFilters,onOpen})=>{
  const active = rows.filter(r=> !isSet(r.DT_FATUR_SSG)).length;
  const cra = rows.filter(r=> isSet(r.DT_CRA)).length;
  const vriPend = rows.filter(r=> (r.N_VRI??0)>0 && !isSet(r.DT_VRI)).length;
  const lprPend = rows.filter(r=> (r.N_LPR??0)>0 && !isSet(r.DT_LPR)).length;
  const lrPend  = rows.filter(r=> (r.N_LR??0)>0 && !isSet(r.DT_LR)).length;
  const aFaturar= rows.filter(r=> isSet(r.DT_RESULT_SSG) && !isSet(r.DT_FATUR_SSG)).length;

  const coords = Array.from(new Set(rows.map(r=>r.COORD))).filter(Boolean) as string[];
  const reps   = Array.from(new Set(rows.map(r=>r.REP))).filter(Boolean).sort() as string[];
  const clientes = Array.from(new Set(rows.map(r=>r.CLIENTE))).filter(Boolean).sort() as string[];
  const produtos = Array.from(new Set(rows.map(r=>r.PROD_SSG||r.PROD_NEOGEN))).filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      <HeaderBar title="Dashboard • ADM" query={filters.q} setQuery={(v:string)=>setFilters((f:any)=>({...f,q:v}))}>
        <Button variant="outline" className="gap-2"><FolderOpenDot className="w-4 h-4"/>Uploads</Button>
      </HeaderBar>

      <FilterRow showCoord showRep showCliente showProduto showPeriodo showStatus
        coords={coords} reps={reps} clientes={clientes} produtos={produtos}
        coord={filters.coord} setCoord={(v)=>setFilters((f:any)=>({...f,coord:v}))}
        rep={filters.rep} setRep={(v)=>setFilters((f:any)=>({...f,rep:v}))}
        cliente={filters.cliente} setCliente={(v)=>setFilters((f:any)=>({...f,cliente:v}))}
        produto={filters.produto} setProduto={(v)=>setFilters((f:any)=>({...f,produto:v}))}
        onClear={()=>setFilters({q:''})}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi title="OS SSGEN Ativas" value={active} subtitle="Em processamento" icon={<Clock3 className="w-4 h-4"/>}/>
        <Kpi title="CRA (DT_CRA)" value={cra} subtitle="Recebidas" icon={<CalendarDays className="w-4 h-4"/>}/>
        <Kpi title="VRI Pendentes (N_VRI)" value={vriPend} icon={<AlertTriangle className="w-4 h-4"/>}/>
        <Kpi title="LPR Pendentes (N_LPR)" value={lprPend} icon={<AlertTriangle className="w-4 h-4"/>}/>
        <Kpi title="LR Pendentes (N_LR)" value={lrPend} icon={<AlertTriangle className="w-4 h-4"/>}/>
        <Kpi title="A Faturar (FATUR_SSG)" value={aFaturar} icon={<CircleDollarSign className="w-4 h-4"/>}/>
      </div>

      <ChartsBlock rows={rows} scopeLabel="SSGEN × NEOGEN"/>

      <Card className="rounded-xl">
        <CardHeader className="flex items-center justify-between"><CardTitle>Tabela Mestre</CardTitle>
          <div className="flex gap-2"><Button variant="outline" className="gap-2"><Download className="w-4 h-4"/>Exportar</Button></div>
        </CardHeader>
        <CardContent>
          <TableOrdens rows={rows} allowEdit allowAttach allowFinance onOpen={onOpen}/>
        </CardContent>
      </Card>
    </div>
  );
};

const AdmPainelProcessos: React.FC<{ rows:PowerRow[] }>=({rows})=>{
  const colSSGEN = [
    {key:'os', title:'DT_SSGEN_OS'},
    {key:'plan', title:'PLAN_SSG / DT_PLAN_SSG'},
    {key:'prev', title:'DT_PREV_RESULT_SSG'},
    {key:'res', title:'RESULT_SSG / DT_RESULT_SSG'},
    {key:'fat', title:'FATURAMENTO'},
  ];
  const colNEO = [
    {key:'cra', title:'DT_CRA'},
    {key:'plan', title:'PLAN_NEOGEN / DT_PLAN_NEOGEN'},
    {key:'vri', title:'VRI (N_VRI / DT_VRI)'},
    {key:'lpr', title:'LPR (N_LPR / DT_LPR)'},
    {key:'lr',  title:'LR (N_LR / DT_LR / LR_RASTREIO)'},
  ];

  const CardOS = (r:PowerRow)=>{
    const sla = slaBadge(r);
    return (
      <div className="border rounded-lg p-2 bg-background shadow-sm">
        <div className="text-sm font-medium text-primary">{r.OS_SSGEN}</div>
        <div className="text-xs text-muted-foreground">{r.CLIENTE}</div>
        <div className="text-xs">{r.REP} • {r.COORD}</div>
        <div className="mt-1"><Badge variant={sla.tone as any}>{sla.label}</Badge></div>
      </div>
    );
  };

  const Column = ({title, list}:{title:string; list:PowerRow[]})=> (
    <div className="bg-muted/20 rounded-xl p-3 space-y-2 min-h-[240px]">
      <div className="text-sm font-semibold" title={title}>{title}</div>
      {list.slice(0,8).map((r,i)=> <CardOS key={r.OS_SSGEN+'-'+i} {...r}/>) }
      {list.length>8 && <div className="text-xs text-muted-foreground">+{list.length-8} mais…</div>}
    </div>
  );

  const part = {
    ssgen: {
      os: rows.filter(r=>isSet(r.DT_SSGEN_OS)),
      plan: rows.filter(r=>isSet(r.DT_PLAN_SSG)),
      prev: rows.filter(r=>isSet(r.DT_PREV_RESULT_SSG)),
      res: rows.filter(r=>isSet(r.DT_RESULT_SSG)),
      fat: rows.filter(r=>isSet(r.DT_FATUR_SSG)),
    },
    neo: {
      cra: rows.filter(r=>isSet(r.DT_CRA)),
      plan: rows.filter(r=>isSet(r.DT_PLAN_NEOGEN)),
      vri: rows.filter(r=>isSet(r.DT_VRI)),
      lpr: rows.filter(r=>isSet(r.DT_LPR)),
      lr: rows.filter(r=>isSet(r.DT_LR)),
    }
  };

  return (
    <div className="space-y-6">
      <HeaderBar title="Painel Processos • ADM" query={''} setQuery={()=>{}}/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-xl">
          <CardHeader><CardTitle>SSGEN</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {colSSGEN.map(c=> (
              <Column key={c.key} title={c.title} list={(part as any).ssgen[c.key]}/>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader><CardTitle>NEOGEN</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {colNEO.map(c=> (
              <Column key={c.key} title={c.title} list={(part as any).neo[c.key]}/>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardHeader><CardTitle>Heatmap semanal (CRA/VRI/LPR/LR)</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">(placeholder para heatmap; integra com filtros globais)</CardContent>
      </Card>
    </div>
  );
};

const AdmPainelFinanceiro: React.FC<{ rows:PowerRow[]; onOpen:(r:PowerRow)=>void }>=({rows,onOpen})=>{
  const aFaturar = rows.filter(r=> isSet(r.DT_RESULT_SSG) && !isSet(r.DT_FATUR_SSG));
  const faturadas = rows.filter(r=> isSet(r.DT_FATUR_SSG));
  const totalValor = (aFaturar.reduce((acc, r)=> acc + (Number(r.FATUR_SSG)||0), 0)).toLocaleString('pt-BR');

  return (
    <div className="space-y-4">
      <HeaderBar title="Painel Financeiro • ADM" query={''} setQuery={()=>{}}/>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi title="A Faturar (quantidade)" value={aFaturar.length} icon={<CircleDollarSign className="w-4 h-4"/>}/>
        <Kpi title="Faturadas (quantidade)" value={faturadas.length} icon={<Receipt className="w-4 h-4"/>}/>
        <Kpi title="A Faturar (valor)" value={`R$ ${totalValor}`} icon={<CircleDollarSign className="w-4 h-4"/>}/>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Lista Financeira</CardTitle>
          <div className="flex gap-2"><Button variant="outline" className="gap-2"><Download className="w-4 h-4"/>Exportar</Button></div>
        </CardHeader>
        <CardContent>
          <TableOrdens rows={rows} allowEdit={false} allowAttach={false} allowFinance onOpen={onOpen}/>
        </CardContent>
      </Card>
    </div>
  );
};

// =========================
// 6) Painéis GERENTE e REPRESENTANTE
// =========================
const GerenteDashboard: React.FC<{ rows:PowerRow[]; filters:any; setFilters:any; onOpen:(r:PowerRow)=>void }>=({rows,filters,setFilters,onOpen})=>{
  const reps = Array.from(new Set(rows.map(r=>r.REP))).sort() as string[];
  const clientes = Array.from(new Set(rows.map(r=>r.CLIENTE))).sort() as string[];
  const produtos = Array.from(new Set(rows.map(r=>r.PROD_SSG||r.PROD_NEOGEN))).filter(Boolean) as string[];

  const active = rows.filter(r=> !isSet(r.DT_FATUR_SSG)).length;
  const cra = rows.filter(r=> isSet(r.DT_CRA)).length;
  const vriPend = rows.filter(r=> (r.N_VRI??0)>0 && !isSet(r.DT_VRI)).length;
  const lprPend = rows.filter(r=> (r.N_LPR??0)>0 && !isSet(r.DT_LPR)).length;
  const lrPend  = rows.filter(r=> (r.N_LR??0)>0 && !isSet(r.DT_LR)).length;
  const aFaturar= rows.filter(r=> isSet(r.DT_RESULT_SSG) && !isSet(r.DT_FATUR_SSG)).length;

  return (
    <div className="space-y-4">
      <HeaderBar title="Dashboard • Gerente" query={filters.q} setQuery={(v:string)=>setFilters((f:any)=>({...f,q:v}))}/>

      <FilterRow showCoord={false} showRep showCliente showProduto showPeriodo showStatus
        coords={[]} reps={reps} clientes={clientes} produtos={produtos}
        coord={undefined} setCoord={()=>{}}
        rep={filters.rep} setRep={(v)=>setFilters((f:any)=>({...f,rep:v}))}
        cliente={filters.cliente} setCliente={(v)=>setFilters((f:any)=>({...f,cliente:v}))}
        produto={filters.produto} setProduto={(v)=>setFilters((f:any)=>({...f,produto:v}))}
        onClear={()=>setFilters({q:''})}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi title="OS SSGEN Ativas" value={active} subtitle="Meu time" icon={<Clock3 className="w-4 h-4"/>}/>
        <Kpi title="CRA (DT_CRA)" value={cra} subtitle="Meu time" icon={<CalendarDays className="w-4 h-4"/>}/>
        <Kpi title="VRI Pendentes" value={vriPend} icon={<AlertTriangle className="w-4 h-4"/>}/>
        <Kpi title="LPR Pendentes" value={lprPend} icon={<AlertTriangle className="w-4 h-4"/>}/>
        <Kpi title="LR Pendentes" value={lrPend} icon={<AlertTriangle className="w-4 h-4"/>}/>
        <Kpi title="A Faturar" value={aFaturar} icon={<CircleDollarSign className="w-4 h-4"/>}/>
      </div>

      <ChartsBlock rows={rows} scopeLabel="Meu time"/>

      <Card className="rounded-xl">
        <CardHeader><CardTitle>Ordens do Meu Time</CardTitle></CardHeader>
        <CardContent>
          <TableOrdens rows={rows} allowEdit={false} allowAttach={false} allowFinance={false} onOpen={onOpen}/>
        </CardContent>
      </Card>
    </div>
  );
};

const RepDashboard: React.FC<{ rows:PowerRow[]; filters:any; setFilters:any; onOpen:(r:PowerRow)=>void }>=({rows,filters,setFilters,onOpen})=>{
  const clientes = Array.from(new Set(rows.map(r=>r.CLIENTE))).sort() as string[];

  const active = rows.filter(r=> !isSet(r.DT_FATUR_SSG)).length;
  const cra = rows.filter(r=> isSet(r.DT_CRA)).length;
  const vriPend = rows.filter(r=> (r.N_VRI??0)>0 && !isSet(r.DT_VRI)).length;
  const lprPend = rows.filter(r=> (r.N_LPR??0)>0 && !isSet(r.DT_LPR)).length;
  const lrPend  = rows.filter(r=> (r.N_LR??0)>0 && !isSet(r.DT_LR)).length;

  const groups: Record<string, PowerRow[]> = {};
  rows.forEach(r=>{ const k=r.CLIENTE||'—'; groups[k]=groups[k]||[]; groups[k].push(r); });

  return (
    <div className="space-y-4">
      <HeaderBar title="Dashboard • Representante" query={filters.q} setQuery={(v:string)=>setFilters((f:any)=>({...f,q:v}))}/>

      <FilterRow showCoord={false} showRep={false} showCliente showProduto={false} showPeriodo showStatus
        coords={[]} reps={[]} clientes={clientes} produtos={[]}
        coord={undefined} setCoord={()=>{}}
        rep={undefined} setRep={()=>{}}
        cliente={filters.cliente} setCliente={(v)=>setFilters((f:any)=>({...f,cliente:v}))}
        produto={undefined} setProduto={()=>{}}
        onClear={()=>setFilters({q:''})}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Kpi title="OS SSGEN Ativas" value={active} icon={<Clock3 className="w-4 h-4"/>}/>
        <Kpi title="CRA (DT_CRA)" value={cra} icon={<CalendarDays className="w-4 h-4"/>}/>
        <Kpi title="VRI Pendentes" value={vriPend} icon={<AlertTriangle className="w-4 h-4"/>}/>
        <Kpi title="LPR Pendentes" value={lprPend} icon={<AlertTriangle className="w-4 h-4"/>}/>
        <Kpi title="LR Pendentes" value={lrPend} icon={<AlertTriangle className="w-4 h-4"/>}/>
      </div>

      <Card className="rounded-xl">
        <CardHeader><CardTitle>Minhas Fazendas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Object.entries(groups).map(([cli,list])=> (
              <div key={cli} className="border rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{cli}</div>
                  <Button size="sm" variant="ghost" className="gap-1">Ver OS <ChevronRight className="w-4 h-4"/></Button>
                </div>
                <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                  <span>Ativas: {list.filter(r=>!isSet(r.DT_FATUR_SSG)).length}</span>
                  <span>VRI pend.: {list.filter(r=>(r.N_VRI??0)>0 && !isSet(r.DT_VRI)).length}</span>
                  <span>LR pend.: {list.filter(r=>(r.N_LR??0)>0 && !isSet(r.DT_LR)).length}</span>
                  <span>A Faturar: {list.filter(r=> isSet(r.DT_RESULT_SSG) && !isSet(r.DT_FATUR_SSG)).length}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader><CardTitle>Minhas Ordens</CardTitle></CardHeader>
        <CardContent>
          <TableOrdens rows={rows} allowEdit={false} allowAttach={false} allowFinance={false} onOpen={onOpen}/>
        </CardContent>
      </Card>
    </div>
  );
};

// =========================
// 7) Páginas de Apoio: Ordens / Faturamento / Cadastros / Config
// =========================
const PageOrdens: React.FC<{ rows:PowerRow[]; onOpen:(r:PowerRow)=>void; canEdit:boolean; canAttach:boolean; canFinance:boolean }>=({rows,onOpen,canEdit,canAttach,canFinance})=> (
  <div className="space-y-4">
    <HeaderBar title="Ordens" query={''} setQuery={()=>{}}>
      <Button variant="outline" className="gap-2"><Upload className="w-4 h-4"/>Importar Excel</Button>
    </HeaderBar>
    <TableOrdens rows={rows} allowEdit={canEdit} allowAttach={canAttach} allowFinance={canFinance} onOpen={onOpen}/>
  </div>
);

const PageFaturamento: React.FC<{ rows:PowerRow[]; onOpen:(r:PowerRow)=>void; canFinance:boolean }>=({rows,onOpen,canFinance})=> (
  <div className="space-y-4">
    <HeaderBar title="Faturamento" query={''} setQuery={()=>{}}/>
    <TableOrdens rows={rows} allowEdit={false} allowAttach={false} allowFinance={canFinance} onOpen={onOpen}/>
  </div>
);

const PageCatalogo: React.FC<{ title:string; items:string[] }>=({title,items})=> (
  <div className="space-y-4">
    <HeaderBar title={title} query={''} setQuery={()=>{}}/>
    <Card className="rounded-xl">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map(k=> (
            <div key={k} className="border rounded-xl p-3">
              <div className="text-sm font-semibold">{k}</div>
              <div className="text-xs text-muted-foreground">(detalhes, e-mail, telefone…)</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const PageConfig: React.FC=()=> (
  <div className="space-y-4">
    <HeaderBar title="Configurações (ADM)" query={''} setQuery={()=>{}}/>
    <Card className="rounded-xl">
      <CardHeader><CardTitle>Regras de SLA</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground">Parametrizar dias alvo entre etapas e cores/badges.</CardContent>
    </Card>
    <Card className="rounded-xl">
      <CardHeader><CardTitle>Usuários e Permissões</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground">Mapeamento COORD ↔ REP, papéis, resets.</CardContent>
    </Card>
    <Card className="rounded-xl">
      <CardHeader><CardTitle>Importação e Sincronização</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground">Upload do Excel (SAIDA_PWRBI) e ETL para Supabase.</CardContent>
    </Card>
  </div>
);

// =========================
// 8) App principal com navegação e controle por papel
// =========================
export default function SSGENTrackApp(){
  const [profile,setProfile] = useState<Profile|null>(null);
  const [role,setRole] = useState<Role>('ADM');
  const [rows,setRows] = useState<PowerRow[]>([]);
  const [current,setCurrent] = useState<string>('dashboard');
  const [filters,setFilters] = useState<any>({ q:'', coord:undefined, rep:undefined, cliente:undefined, produto:undefined });

  useEffect(()=>{(async()=>{
    const p = await getProfile();
    if (p) { setProfile(p); setRole(p.role); }
    const d = await fetchOrders();
    setRows(d);
  })();},[]);

  const rowsFiltered = useMemo(()=>{
    const q = (filters.q||'').toLowerCase();
    return rows.filter(r=>{
      if (role==='GERENTE' && profile?.coord && r.COORD!==profile.coord) return false;
      if (role==='REPRESENTANTE' && profile?.rep && r.REP!==profile.rep) return false;
      if (filters.coord && r.COORD!==filters.coord) return false;
      if (filters.rep && r.REP!==filters.rep) return false;
      if (filters.cliente && r.CLIENTE!==filters.cliente) return false;
      if (filters.produto && !(r.PROD_SSG===filters.produto || r.PROD_NEOGEN===filters.produto)) return false;
      if (q){ const s = `${r.OS_SSGEN} ${r.CLIENTE} ${r.REP} ${r.COORD}`.toLowerCase(); if (!s.includes(q)) return false; }
      return true;
    });
  },[rows,filters,role,profile]);

  const [open,setOpen] = useState(false);
  const [detail,setDetail] = useState<PowerRow|null>(null);
  const openDetail = (r:PowerRow)=>{ setDetail(r); setOpen(true); };

  const listClientes = useMemo(()=> Array.from(new Set(rowsFiltered.map(r=>r.CLIENTE))).sort() as string[], [rowsFiltered]);
  const listReps = useMemo(()=> Array.from(new Set(rowsFiltered.map(r=>r.REP))).sort() as string[], [rowsFiltered]);
  const listCoords = useMemo(()=> Array.from(new Set(rowsFiltered.map(r=>r.COORD))).sort() as string[], [rowsFiltered]);

  const renderContent = () => {
    if (current==='dashboard') {
      if (role==='ADM') return <AdmPainelGeral rows={rowsFiltered} filters={filters} setFilters={setFilters} onOpen={openDetail}/>;
      if (role==='GERENTE') return <GerenteDashboard rows={rowsFiltered} filters={filters} setFilters={setFilters} onOpen={openDetail}/>;
      return <RepDashboard rows={rowsFiltered} filters={filters} setFilters={setFilters} onOpen={openDetail}/>;
    }
    if (current==='ordens') {
      return <PageOrdens rows={rowsFiltered} onOpen={openDetail} canEdit={role==='ADM'} canAttach={role==='ADM'} canFinance={role==='ADM'}/>
    }
    if (current==='faturamento') {
      return <PageFaturamento rows={rowsFiltered} onOpen={openDetail} canFinance={role==='ADM'}/>
    }
    if (current==='representantes') {
      return <PageCatalogo title="Representantes" items={listReps}/>;
    }
    if (current==='gerentes') {
      return <PageCatalogo title="Gerentes (COORD)" items={listCoords}/>;
    }
    if (current==='clientes') {
      return <PageCatalogo title="Clientes" items={listClientes}/>;
    }
    if (current==='config') {
      return role==='ADM' ? <PageConfig/> : <Card className="border-dashed"><CardHeader><CardTitle>Acesso negado</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Somente ADM</CardContent></Card>;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar current={current} setCurrent={setCurrent} role={role}/>
      <main className="flex-1 p-6 space-y-6">
        {renderContent()}
        {!SUPABASE_URL || !SUPABASE_ANON_KEY ? (
          <Card className="border-dashed">
            <CardHeader><CardTitle>Configuração necessária</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div>Defina <code>NEXT_PUBLIC_SUPABASE_URL</code> e <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no ambiente do projeto.</div>
              <div>Suportados: <strong>process.env</strong>, <strong>import.meta.env</strong> ou <strong>globalThis</strong> (ex.: <code>window.NEXT_PUBLIC_SUPABASE_URL = "https://..."</code>).</div>
            </CardContent>
          </Card>
        ) : null}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader><DialogTitle>OS • {detail?.OS_SSGEN}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div><span className="text-muted-foreground">CLIENTE:</span> {detail.CLIENTE}</div>
                    <div><span className="text-muted-foreground">COORD:</span> {detail.COORD}</div>
                    <div><span className="text-muted-foreground">REP:</span> {detail.REP}</div>
                    <div><span className="text-muted-foreground">PROD_SSG:</span> {detail.PROD_SSG || '—'}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>SLA</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div><span className="text-muted-foreground">Prev. Resultado (DT_PREV_RESULT_SSG):</span> {fmt(detail.DT_PREV_RESULT_SSG)}</div>
                    <div><span className="text-muted-foreground">Resultado (DT_RESULT_SSG):</span> {fmt(detail.DT_RESULT_SSG)}</div>
                    <div><span className="text-muted-foreground">Faturamento (DT_FATUR_SSG):</span> {fmt(detail.DT_FATUR_SSG)}</div>
                    <div><span className="text-muted-foreground">Badge:</span> <Badge>{slaBadge(detail).label}</Badge></div>
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
                    <Card><CardHeader><CardTitle>DT_SSGEN_OS</CardTitle></CardHeader><CardContent>{fmt(detail.DT_SSGEN_OS)}</CardContent></Card>
                    <Card><CardHeader><CardTitle>PLAN_SSG</CardTitle></CardHeader><CardContent>{detail.PLAN_SSG||'—'}<div className="text-xs text-muted-foreground">{fmt(detail.DT_PLAN_SSG)}</div></CardContent></Card>
                    <Card><CardHeader><CardTitle>DT_PREV_RESULT_SSG</CardTitle></CardHeader><CardContent>{fmt(detail.DT_PREV_RESULT_SSG)}</CardContent></Card>
                    <Card><CardHeader><CardTitle>RESULT_SSG</CardTitle></CardHeader><CardContent>{detail.RESULT_SSG||'—'}<div className="text-xs text-muted-foreground">{fmt(detail.DT_RESULT_SSG)}</div></CardContent></Card>
                    <Card><CardHeader><CardTitle>FATURAMENTO</CardTitle></CardHeader><CardContent>{detail.FATUR_TIPO||'—'}<div className="text-xs text-muted-foreground">{fmt(detail.DT_FATUR_SSG)}</div></CardContent></Card>
                  </div>
                </TabsContent>
                <TabsContent value="neogen">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                    <Card><CardHeader><CardTitle>DT_CRA</CardTitle></CardHeader><CardContent>{fmt(detail.DT_CRA)}</CardContent></Card>
                    <Card><CardHeader><CardTitle>PLAN_NEOGEN</CardTitle></CardHeader><CardContent>{detail.PLAN_NEOGEN||'—'}<div className="text-xs text-muted-foreground">{fmt(detail.DT_PLAN_NEOGEN)}</div></CardContent></Card>
                    <Card><CardHeader><CardTitle>VRI</CardTitle></CardHeader><CardContent>{isSet(detail.N_VRI)? detail.N_VRI : '—'}<div className="text-xs text-muted-foreground">{fmt(detail.DT_VRI)}</div></CardContent></Card>
                    <Card><CardHeader><CardTitle>LPR</CardTitle></CardHeader><CardContent>{isSet(detail.N_LPR)? detail.N_LPR : '—'}<div className="text-xs text-muted-foreground">{fmt(detail.DT_LPR)}</div></CardContent></Card>
                    <Card><CardHeader><CardTitle>LR</CardTitle></CardHeader><CardContent>{isSet(detail.N_LR)? detail.N_LR : '—'}<div className="text-xs text-muted-foreground">{fmt(detail.DT_LR)}</div></CardContent></Card>
                  </div>
                  <div className="text-sm mt-3"><span className="text-muted-foreground">LR_RASTREIO:</span> {detail.LR_RASTREIO||'—'}</div>
                </TabsContent>
                <TabsContent value="arquivos">
                  <div className="text-sm text-muted-foreground">Uploads e histórico de versões (Storage do Supabase com links assinados).</div>
                </TabsContent>
                <TabsContent value="notas">
                  <div className="text-sm text-muted-foreground">Notas internas (ADM/Gerente) com @menções (tabela separada).</div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
