import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useParams } from 'react-router-dom';
import { useTrackerTimelines } from '../hooks/useTrackerData';
import { useTrackerKpis } from '../hooks/useTrackerKpis';
import { OrdersTable } from '../components/OrdersTable';
import { OrderCard } from '../components/OrderCard';
import { AlertCenter } from '../components/AlertCenter';
import { KpiCards } from '../components/KpiCards';
import { KpiSlaBlock } from '../components/KpiSlaBlock';
import { useOrderAlarms } from '../hooks/useOrderAlarms';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff } from 'lucide-react';
import { getProfile } from '@/lib/ssgenClient';

export default function TrackerDashboard() {
  const [searchParams] = useSearchParams();
  const routeParams = useParams();

  const accountId = useMemo(() => {
    const candidates: Array<string | number | undefined | null> = [
      routeParams?.accountId,
      routeParams?.conta,
      routeParams?.contaId,
      routeParams?.id_conta,
      routeParams?.id_conta_ssgen,
      searchParams.get('accountId'),
      searchParams.get('account'),
      searchParams.get('conta'),
      searchParams.get('contaId'),
      searchParams.get('id_conta'),
      searchParams.get('id_conta_ssgen'),
    ];

    if (typeof window !== 'undefined') {
      const globalAny = window as unknown as Record<string, unknown>;
      candidates.push(globalAny?.SSGEN_ACCOUNT_ID);
      candidates.push(globalAny?.ACCOUNT_ID);
      candidates.push(globalAny?.CURRENT_ACCOUNT_ID);
    }

    for (const value of candidates) {
      if (value == null) continue;
      const raw = String(value).trim();
      if (!raw) continue;
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }, [routeParams, searchParams]);

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['my_profile'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });

  const trackerOptions = useMemo(() => ({
    accountId: accountId ?? undefined,
    role: profile?.role,
    coord: profile?.coord ?? null,
    rep: profile?.rep ?? null,
  }), [accountId, profile?.role, profile?.coord, profile?.rep]);

  const roleRequirementsMet = useMemo(() => {
    if (!profile?.role) return false;
    if (profile.role === 'GERENTE') {
      return Boolean(profile.coord && profile.coord.trim());
    }
    if (profile.role === 'REPRESENTANTE') {
      return Boolean(profile.rep && profile.rep.trim());
    }
    return true;
  }, [profile?.role, profile?.coord, profile?.rep]);

  const trackerEnabled = roleRequirementsMet;
  const missingRoleMetadata = Boolean(profile?.role) && !roleRequirementsMet;

  const {
    data: rows = [],
  } = useTrackerTimelines(trackerOptions, { enabled: trackerEnabled });

  const {
    data: kpis,
    isLoading: loadingKpis,
  } = useTrackerKpis(trackerOptions, { enabled: trackerEnabled });
  const kpisLoading = loadingProfile || (trackerEnabled && loadingKpis);
  const effectiveKpis = trackerEnabled ? kpis : null;
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'table' | 'cards'>('table');
  const [alarmsEnabled, setAlarmsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { criticalCount, warningCount } = useOrderAlarms(rows, {
    enabled: alarmsEnabled,
    soundEnabled,
    criticalThreshold: 5,
    warningThreshold: 3,
  });

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.toLowerCase();
      return !q ||
        String(r.ordem_servico_ssgen ?? '').toLowerCase().includes(q) ||
        String(r.cliente ?? '').toLowerCase().includes(q);
    });
  }, [rows, query]);

  return (
    <div className="p-6 space-y-6 bg-white min-h-screen">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-black">SSGEN Tracker</div>
          {(criticalCount > 0 || warningCount > 0) && (
            <div className="flex gap-2">
              {criticalCount > 0 && (
                <div className="px-3 py-1 rounded-full bg-gray-100 text-black text-xs font-semibold ring-1 ring-destructive/60">
                  {criticalCount} Crítico{criticalCount !== 1 ? 's' : ''}
                </div>
              )}
              {warningCount > 0 && (
                <div className="px-3 py-1 rounded-full bg-gray-100 text-black text-xs font-semibold ring-1 ring-warning/60">
                  {warningCount} Aviso{warningCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
            {alarmsEnabled ? <Bell className="w-4 h-4 text-black" /> : <BellOff className="w-4 h-4 text-black" />}
            <Switch checked={alarmsEnabled} onCheckedChange={setAlarmsEnabled} />
            <Label className="text-xs text-black cursor-pointer" onClick={() => setAlarmsEnabled(!alarmsEnabled)}>
              Alarmes
            </Label>
          </div>
          {alarmsEnabled && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200">
              <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
              <Label className="text-xs text-black cursor-pointer" onClick={() => setSoundEnabled(!soundEnabled)}>
                Som
              </Label>
            </div>
          )}
          <Input
            placeholder="Buscar por OS ou cliente..."
            className="w-80 bg-white text-black border-gray-300"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            onClick={() => setMode(m => m === 'table' ? 'cards' : 'table')}
            variant="outline"
            className="bg-white text-black border-gray-300 hover:bg-gray-100"
          >
            {mode === 'table' ? 'Cards' : 'Tabela'}
          </Button>
        </div>
      </div>

      {missingRoleMetadata ? (
        <div className="text-center text-black py-8">
          Não foi possível determinar o coordenador/representante associado ao seu usuário. Solicite ao administrador a
          configuração do seu perfil para visualizar os dados.
        </div>
      ) : kpisLoading ? (
        <div className="text-center text-black py-8">Carregando KPIs...</div>
      ) : (
        <>
          <KpiCards k={effectiveKpis} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <KpiSlaBlock k={effectiveKpis} />
            <div className="grid grid-cols-1 gap-4">
              <AlertCenter rows={rows} />
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="text-black font-semibold mb-2">Resumo Executivo</div>
                <div className="text-sm text-black space-y-2">
                  <p>
                    Operação com{' '}
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-black">
                      {effectiveKpis?.em_processamento ?? 0}
                    </span>{' '}
                    OS ativas.
                  </p>
                  <p>Priorize etapas críticas para manter SLA.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!missingRoleMetadata && (
        mode === 'table' ? (
          <OrdersTable rows={filtered} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <OrderCard
                key={r.id}
                row={r}
                onOpen={() => {}}
                onMap={() => {}}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
