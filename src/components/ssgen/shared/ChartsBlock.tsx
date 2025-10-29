import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PowerRow } from '@/types/ssgen';
import { isSet, dBetween } from '@/types/ssgen';

interface ChartsBlockProps {
  rows: PowerRow[];
  scopeLabel: string;
}

export const ChartsBlock: React.FC<ChartsBlockProps> = ({ rows, scopeLabel }) => {
  const [RC, setRC] = useState<any | null>(null);

  useEffect(() => {
    let on = true;
    import('recharts')
      .then((m) => {
        if (on) setRC(m);
      })
      .catch(console.error);
    return () => {
      on = false;
    };
  }, []);

  if (!RC)
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Carregando gráficos…</CardTitle>
          </CardHeader>
          <CardContent className="h-64" />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Carregando gráficos…</CardTitle>
          </CardHeader>
          <CardContent className="h-64" />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Carregando gráficos…</CardTitle>
          </CardHeader>
          <CardContent className="h-64" />
        </Card>
      </div>
    );

  const {
    ResponsiveContainer,
    CartesianGrid,
    Tooltip,
    Legend,
    XAxis,
    YAxis,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
  } = RC as any;

  const reps = Array.from(new Set(rows.map((r) => r.REP))).sort();
  const barData = reps.map((rep) => {
    const subset = rows.filter((r) => r.REP === rep);
    const ssgen = subset.filter(
      (r) => isSet(r.DT_PLAN_SSG) || isSet(r.DT_RESULT_SSG) || isSet(r.DT_FATUR_SSG)
    ).length;
    const neogen = subset.filter(
      (r) => isSet(r.DT_CRA) || isSet(r.DT_VRI) || isSet(r.DT_LPR) || isSet(r.DT_LR)
    ).length;
    return { REP: rep, SSGEN: ssgen, NEOGEN: neogen };
  });

  const avg = (arr: (number | null)[]) => {
    const n = arr.filter((x): x is number => typeof x === 'number');
    return n.length ? Math.round(n.reduce((a, b) => a + b, 0) / n.length) : 0;
  };

  const lineData = [
    {
      etapa: 'SSGEN: OS → Plan',
      dias: avg(rows.map((r) => dBetween(r.DT_SSGEN_OS!, r.DT_PLAN_SSG!))),
    },
    {
      etapa: 'SSGEN: Plan → Resultado',
      dias: avg(rows.map((r) => dBetween(r.DT_PLAN_SSG!, r.DT_RESULT_SSG!))),
    },
    { etapa: 'NEOGEN: CRA → VRI', dias: avg(rows.map((r) => dBetween(r.DT_CRA!, r.DT_VRI!))) },
    { etapa: 'NEOGEN: VRI → LPR', dias: avg(rows.map((r) => dBetween(r.DT_VRI!, r.DT_LPR!))) },
    { etapa: 'NEOGEN: LPR → LR', dias: avg(rows.map((r) => dBetween(r.DT_LPR!, r.DT_LR!))) },
  ];

  const donutMap: Record<string, number> = {};
  rows.forEach((r) => {
    const k = r.PROD_SSG || r.PROD_NEOGEN || '—';
    donutMap[k] = (donutMap[k] || 0) + 1;
  });
  const donutData = Object.entries(donutMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Quantidade por REP × Etapa ({scopeLabel})</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="REP" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="SSGEN" />
              <Bar dataKey="NEOGEN" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Tempo médio por etapa (dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="etapa" interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Line dataKey="dias" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Distribuição por PROD_SSG/PROD_NEOGEN</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name" label>
                {donutData.map((_, i) => (
                  <Cell key={i} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
