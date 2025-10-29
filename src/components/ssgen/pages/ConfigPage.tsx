import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeaderBar } from '../shared/HeaderBar';

const ConfigPage: React.FC = () => (
  <div className="space-y-4">
    <HeaderBar title="Configurações (ADM)" query={''} setQuery={() => {}} />
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Regras de SLA</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Parametrizar dias alvo entre etapas e cores/badges.
      </CardContent>
    </Card>
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Usuários e Permissões</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">Mapeamento COORD ↔ REP, papéis, resets.</CardContent>
    </Card>
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Importação e Sincronização</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Upload do Excel (SAIDA_PWRBI) e ETL para Supabase.
      </CardContent>
    </Card>
  </div>
);

export default ConfigPage;
