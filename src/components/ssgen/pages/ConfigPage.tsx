import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeaderBar } from '../shared/HeaderBar';
import { Users2, UserSquare2, Settings2, Upload, Trash2 } from 'lucide-react';
import ImportDialog from '../import/ImportDialog';
import { DeleteDataDialog } from '../shared/DeleteDataDialog';

interface ConfigPageProps {
  setCurrent: (page: string) => void;
}

const ConfigPage: React.FC<ConfigPageProps> = ({ setCurrent }) => {
  const [query, setQuery] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const configSections = [
    {
      title: 'Gerenciamento de Usuários',
      description: 'Atribuir papéis e vincular usuários a coordenadores/representantes',
      icon: <Users2 className="w-5 h-5" />,
      action: () => setCurrent('user-management'),
      buttonText: 'Gerenciar Usuários',
    },
    {
      title: 'Coordenadores',
      description: 'Gerenciar lista de coordenadores do sistema',
      icon: <UserSquare2 className="w-5 h-5" />,
      action: () => setCurrent('config-coordenadores'),
      buttonText: 'Gerenciar Coordenadores',
    },
    {
      title: 'Representantes',
      description: 'Gerenciar lista de representantes comerciais',
      icon: <Users2 className="w-5 h-5" />,
      action: () => setCurrent('config-representantes'),
      buttonText: 'Gerenciar Representantes',
    },
    {
      title: 'Regras de SLA',
      description: 'Parametrizar dias alvo entre etapas e cores/badges',
      icon: <Settings2 className="w-5 h-5" />,
      action: () => setCurrent('sla-config'),
      buttonText: 'Configurar SLA',
    },
    {
      title: 'Importação e Sincronização',
      description: 'Upload do Excel com Coordenadores, Representantes, Clientes e Ordens',
      icon: <Upload className="w-5 h-5" />,
      action: () => setImportDialogOpen(true),
      buttonText: 'Importar Dados',
    },
    {
      title: 'Gerenciamento de Dados',
      description: 'Apagar clientes e ordens de serviço do sistema',
      icon: <Trash2 className="w-5 h-5" />,
      action: () => setDeleteDialogOpen(true),
      buttonText: 'Gerenciar Dados',
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

      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <DeleteDataDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} />
    </div>
  );
};

export default ConfigPage;
