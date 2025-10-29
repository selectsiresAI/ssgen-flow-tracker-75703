import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ChartComponents: React.FC<{
  byRepEtapa: any[];
  tempoMedioEtapas: any[];
  prodDistrib: any[];
}> = ({ byRepEtapa, tempoMedioEtapas, prodDistrib }) => {
  const [RC, setRC] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    import("recharts")
      .then(mod => {
        if (mounted) setRC(mod);
      })
      .catch(err => console.error("Falha ao carregar recharts:", err));
    return () => {
      mounted = false;
    };
  }, []);

  if (!RC) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Carregando gráficos…</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Inicializando módulos
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Carregando gráficos…</CardTitle>
          </CardHeader>
          <CardContent className="h-64" />
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Carregando gráficos…</CardTitle>
          </CardHeader>
          <CardContent className="h-64" />
        </Card>
      </div>
    );
  }

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

  const COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Volume por REP × Fluxo</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byRepEtapa}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="rep" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Bar dataKey="SSGEN" fill="hsl(var(--primary))" />
              <Bar dataKey="NEOGEN" fill="hsl(var(--success))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Tempo médio por etapa (dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tempoMedioEtapas}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="etapa" interval={0} angle={-15} textAnchor="end" height={60} stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line dataKey="dias" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Distribuição por PROD_SSG</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={prodDistrib} dataKey="value" nameKey="name" label>
                {prodDistrib.map((_: any, index: number) => (
                  <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
