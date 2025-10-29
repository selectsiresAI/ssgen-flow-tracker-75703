import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeaderBar } from '../shared/HeaderBar';
import { Users2, UserSquare2, Settings2, Upload } from 'lucide-react';

interface ConfigPageProps {
  setCurrent: (page: string) => void;
}

const ConfigPage: React.FC<ConfigPageProps> = ({ setCurrent }) => {
  const [query, setQuery] = useState('');

  const configSections = [
    {
      title: 'Coordenadores',
      description: 'Gerenciar lista de coordenadores do sistema',
      icon: <UserSquare2 className="w-5 h-5" />,
      action: () => setCurrent('coordenadores'),
      buttonText: 'Gerenciar Coordenadores',
    },
    {
      title: 'Representantes',
      description: 'Gerenciar lista de representantes comerciais',
      icon: <Users2 className="w-5 h-5" />,
      action: () => setCurrent('representantes'),
      buttonText: 'Gerenciar Representantes',
    },
    {
      title: 'Regras de SLA',
      description: 'Parametrizar dias alvo entre etapas e cores/badges',
      icon: <Settings2 className="w-5 h-5" />,
      action: () => alert('Funcionalidade em desenvolvimento'),
      buttonText: 'Configurar SLA',
    },
    {
      title: 'Importação e Sincronização',
      description: 'Upload do Excel (SAIDA_PWRBI) e ETL para Supabase',
      icon: <Upload className="w-5 h-5" />,
      action: () => alert('Funcionalidade em desenvolvimento'),
      buttonText: 'Importar Dados',
    },
  ];

  return (
    <div className="space-y-4">
      <HeaderBar title="Configurações (ADM)" query={query} setQuery={setQuery} />
      
      <div className="grid gap-4 md:grid-cols-2">
        {configSections.map((section, index) => (
          <Card key={index} className="rounded-xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                {section.icon}
                <CardTitle>{section.title}</CardTitle>
              </div>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={section.action}
                className="w-full"
              >
                {section.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ConfigPage;
