import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { Profile, PowerRow, Role, UnifiedOrder } from '@/types/ssgen';
import { fmt, isSet, slaBadge } from '@/types/ssgen';
import { getProfile, fetchOrders } from '@/lib/ssgenClient';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar } from '@/components/ssgen/Sidebar';
import ssgenLogo from '@/assets/ssgen-logo.png';

const AdminDashboard = React.lazy(() => import('@/components/ssgen/dashboards/AdminDashboard'));
const ManagerDashboard = React.lazy(() => import('@/components/ssgen/dashboards/ManagerDashboard'));
const RepDashboard = React.lazy(() => import('@/components/ssgen/dashboards/RepDashboard'));
const OrdersPage = React.lazy(() => import('@/components/ssgen/pages/OrdersPage'));
const CatalogPage = React.lazy(() => import('@/components/ssgen/pages/CatalogPage'));
const ConfigPage = React.lazy(() => import('@/components/ssgen/pages/ConfigPage'));
const ClientsPage = React.lazy(() => import('@/components/ssgen/pages/ClientsPage'));
const NewOrderPage = React.lazy(() => import('@/components/ssgen/pages/NewOrderPage'));
const CoordenadoresPage = React.lazy(() => import('@/components/ssgen/pages/CoordenadoresPage'));
const RepresentantesPage = React.lazy(() => import('@/components/ssgen/pages/RepresentantesPage'));
const CoordenadoresListPage = React.lazy(() => import('@/components/ssgen/pages/CoordenadoresListPage'));
const RepresentantesListPage = React.lazy(() => import('@/components/ssgen/pages/RepresentantesListPage'));
const UserManagementPage = React.lazy(() => import('@/components/ssgen/pages/UserManagementPage'));
const SLAConfigPage = React.lazy(() => import('@/components/ssgen/pages/SLAConfigPage'));

export default function SSGENTrackApp() {
  const navigate = useNavigate();
  const [profile,setProfile] = useState<Profile|null>(null);
  const [role,setRole] = useState<Role>('ADM');
  const [rows,setRows] = useState<PowerRow[]>([]);
  const [current,setCurrent] = useState<string>('dashboard');
  const [filters,setFilters] = useState<any>({ q:'', coord:undefined, rep:undefined, cliente:undefined, produto:undefined });
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    // Verificar autenticação
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
        return;
      }
      
      // Carregar dados
      (async()=>{
        const p = await getProfile();
        if (p && p.role) { 
          setProfile(p); 
          setRole(p.role);
          const d = await fetchOrders();
          setRows(d);
        } else if (p && !p.role) {
          // Usuário existe mas não tem papel
          setProfile(p);
        }
        setLoading(false);
      })();
    });

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  },[navigate]);

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
  const [detail,setDetail] = useState<PowerRow | UnifiedOrder | null>(null);
  const openDetail = (r: PowerRow | UnifiedOrder)=>{ setDetail(r); setOpen(true); };

  const listClientes = useMemo(()=> Array.from(new Set(rowsFiltered.map(r=>r.CLIENTE))).sort() as string[], [rowsFiltered]);
  const listReps = useMemo(()=> Array.from(new Set(rowsFiltered.map(r=>r.REP))).sort() as string[], [rowsFiltered]);
  const listCoords = useMemo(()=> Array.from(new Set(rowsFiltered.map(r=>r.COORD))).sort() as string[], [rowsFiltered]);

  const renderContent = () => {
    if (current === 'dashboard') {
      if (role === 'ADM')
        return (
          <React.Suspense fallback={<div>Carregando...</div>}>
            <AdminDashboard rows={rowsFiltered} filters={filters} setFilters={setFilters} onOpen={openDetail} />
          </React.Suspense>
        );
      if (role === 'GERENTE')
        return (
          <React.Suspense fallback={<div>Carregando...</div>}>
            <ManagerDashboard rows={rowsFiltered} filters={filters} setFilters={setFilters} onOpen={openDetail} />
          </React.Suspense>
        );
      return (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <RepDashboard rows={rowsFiltered} filters={filters} setFilters={setFilters} onOpen={openDetail} />
        </React.Suspense>
      );
    }
    if (current === 'ordens') {
      return (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <OrdersPage
            onOpen={openDetail}
            canEdit={role === 'ADM'}
            canAttach={role === 'ADM'}
            canFinance={role === 'ADM'}
          />
        </React.Suspense>
      );
    }
    if (current === 'faturamento') {
      return (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <OrdersPage onOpen={openDetail} canEdit={false} canAttach={false} canFinance={role === 'ADM'} />
        </React.Suspense>
      );
    }
    if (current === 'representantes') {
      return (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <CatalogPage title="Representantes" items={listReps} />
        </React.Suspense>
      );
    }
    if (current === 'gerentes') {
      return (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <CatalogPage title="Gerentes (COORD)" items={listCoords} />
        </React.Suspense>
      );
    }
    if (current === 'clientes') {
      return (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <ClientsPage profile={profile} />
        </React.Suspense>
      );
    }
    if (current === 'nova-ordem') {
      return (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <NewOrderPage />
        </React.Suspense>
      );
    }
    if (current === 'coordenadores') {
      return (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <CoordenadoresListPage />
        </React.Suspense>
      );
    }
    if (current === 'representantes-gestao') {
      return (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <RepresentantesListPage />
        </React.Suspense>
      );
    }
    if (current === 'config-coordenadores') {
      return (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <CoordenadoresPage />
        </React.Suspense>
      );
    }
    if (current === 'config-representantes') {
      return (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <RepresentantesPage />
        </React.Suspense>
      );
    }
    if (current === 'user-management') {
      return role === 'ADM' ? (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <UserManagementPage />
        </React.Suspense>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Acesso negado</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Somente ADM</CardContent>
        </Card>
      );
    }
    if (current === 'sla-config') {
      return role === 'ADM' ? (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <SLAConfigPage />
        </React.Suspense>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Acesso negado</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Somente ADM</CardContent>
        </Card>
      );
    }
    if (current === 'config') {
      return role === 'ADM' ? (
        <React.Suspense fallback={<div>Carregando...</div>}>
          <ConfigPage setCurrent={setCurrent} />
        </React.Suspense>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Acesso negado</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Somente ADM</CardContent>
        </Card>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!profile || !profile.role) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Aguardando Atribuição de Papel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sua conta foi criada com sucesso, mas ainda não possui um papel atribuído.
            </p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com um administrador para receber acesso como <strong>ADM</strong>, <strong>GERENTE</strong> ou <strong>REPRESENTANTE</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      'dashboard': `Dashboard • ${role}`,
      'clientes': 'Clientes',
      'nova-ordem': 'Nova Ordem',
      'ordens': 'Ordens',
      'coordenadores': 'Coordenadores',
      'representantes': 'Representantes',
      'representantes-gestao': 'Gerenciar Representantes',
      'faturamento': 'Faturamento',
      'config': 'Configurações',
      'sla-config': 'Configurações de SLA',
      'config-coordenadores': 'Gerenciar Coordenadores',
      'config-representantes': 'Gerenciar Representantes',
      'user-management': 'Gerenciamento de Usuários',
    };
    return titles[current] || 'Dashboard';
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar current={current} setCurrent={setCurrent} role={role}/>
      <main className="flex-1">
        <header className="border-b bg-background px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={ssgenLogo} alt="SSGEN Logo" className="h-8" />
            <h1 className="text-2xl font-bold text-foreground">{getPageTitle()}</h1>
          </div>
        </header>
        <div className="p-6 space-y-6">
          {renderContent()}
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              OS • {(detail as any)?.OS_SSGEN || (detail as any)?.ordem_servico_ssgen}
            </DialogTitle>
          </DialogHeader>
          {detail && 'OS_SSGEN' in detail && (
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
          {detail && 'ordem_servico_ssgen' in detail && !('OS_SSGEN' in detail) && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div><span className="text-muted-foreground">Nome:</span> {detail.cliente_nome || detail.nome}</div>
                    <div><span className="text-muted-foreground">CPF/CNPJ:</span> {detail.cpf_cnpj}</div>
                    <div><span className="text-muted-foreground">Representante:</span> {detail.representante}</div>
                    <div><span className="text-muted-foreground">Coordenador:</span> {detail.coordenador}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Ordem</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div><span className="text-muted-foreground">NF Neogen:</span> {detail.numero_nf_neogen || '—'}</div>
                    <div><span className="text-muted-foreground">Produto:</span> {detail.nome_produto || '—'}</div>
                    <div><span className="text-muted-foreground">Status:</span> {detail.cliente_status || '—'}</div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader><CardTitle>Fluxo de Processos</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div><span className="text-muted-foreground">Número de Amostras:</span> {detail.numero_amostras || '—'}</div>
                  <div><span className="text-muted-foreground">CRA:</span> {fmt(detail.cra_data)} - {detail.cra_status || '—'}</div>
                  <div><span className="text-muted-foreground">Envio Planilha:</span> {fmt(detail.envio_planilha_data)} - {detail.envio_planilha_status || '—'}</div>
                  <div><span className="text-muted-foreground">VRI:</span> {fmt(detail.vri_data)} - {detail.vri_n_amostras || '—'} amostras</div>
                  <div><span className="text-muted-foreground">LPR:</span> {fmt(detail.lpr_data)} - {detail.lpr_n_amostras || '—'} amostras</div>
                  <div><span className="text-muted-foreground">Liberação:</span> {fmt(detail.liberacao_data)} - {detail.liberacao_n_amostras || '—'} amostras</div>
                  <div><span className="text-muted-foreground">Envio Resultados:</span> {fmt(detail.envio_resultados_data)} - {detail.envio_resultados_status || '—'}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
