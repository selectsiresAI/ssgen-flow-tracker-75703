import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HeaderBar } from '../shared/HeaderBar';
import { Settings2, Save } from 'lucide-react';
import { fetchSLAConfigs, updateSLAConfig, type SLAConfig } from '@/lib/slaConfigApi';
import { useToast } from '@/hooks/use-toast';

const SLAConfigPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['sla-configs'],
    queryFn: fetchSLAConfigs,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SLAConfig> }) =>
      updateSLAConfig(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-configs'] });
      toast({
        title: 'Configuração atualizada',
        description: 'As configurações de SLA foram salvas com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = (id: string, updates: Partial<SLAConfig>) => {
    updateMutation.mutate({ id, updates });
  };

  const getEtapaLabel = (etapa: string) => {
    const labels: Record<string, string> = {
      planejamento: 'Planejamento',
      resultado: 'Resultado',
      faturamento: 'Faturamento',
    };
    return labels[etapa] || etapa;
  };

  const getCorLabel = (cor: string) => {
    const labels: Record<string, string> = {
      success: 'Verde (Dentro do prazo)',
      warning: 'Amarelo (Dia zero)',
      destructive: 'Vermelho (Fora do prazo)',
    };
    return labels[cor] || cor;
  };

  return (
    <div className="space-y-4">
      <HeaderBar title="Configurações de SLA" query={query} setQuery={setQuery} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            <CardTitle>Regras de SLA</CardTitle>
          </div>
          <CardDescription>
            Configure os dias-alvo e cores de badge para cada etapa do processo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando configurações...
            </div>
          ) : (
            <div className="space-y-6">
              {configs.map((config) => (
                <SLAConfigCard
                  key={config.id}
                  config={config}
                  onSave={handleSave}
                  getEtapaLabel={getEtapaLabel}
                  getCorLabel={getCorLabel}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Como funciona?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Dias Alvo:</strong> Número de dias esperado para completar cada etapa</p>
          <p>• <strong>Dentro do Prazo (Verde):</strong> Quando faltam dias para o prazo</p>
          <p>• <strong>Dia Zero (Amarelo):</strong> Quando o prazo vence hoje</p>
          <p>• <strong>Fora do Prazo (Vermelho):</strong> Quando o prazo já passou</p>
        </CardContent>
      </Card>
    </div>
  );
};

interface SLAConfigCardProps {
  config: SLAConfig;
  onSave: (id: string, updates: Partial<SLAConfig>) => void;
  getEtapaLabel: (etapa: string) => string;
  getCorLabel: (cor: string) => string;
}

const SLAConfigCard: React.FC<SLAConfigCardProps> = ({
  config,
  onSave,
  getEtapaLabel,
  getCorLabel,
}) => {
  const [diasAlvo, setDiasAlvo] = useState(config.dias_alvo);
  const [corDentroPrazo, setCorDentroPrazo] = useState(config.cor_dentro_prazo);
  const [corDiaZero, setCorDiaZero] = useState(config.cor_dia_zero);
  const [corForaPrazo, setCorForaPrazo] = useState(config.cor_fora_prazo);

  const hasChanges =
    diasAlvo !== config.dias_alvo ||
    corDentroPrazo !== config.cor_dentro_prazo ||
    corDiaZero !== config.cor_dia_zero ||
    corForaPrazo !== config.cor_fora_prazo;

  const handleSave = () => {
    onSave(config.id, {
      dias_alvo: diasAlvo,
      cor_dentro_prazo: corDentroPrazo,
      cor_dia_zero: corDiaZero,
      cor_fora_prazo: corForaPrazo,
    });
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-lg">{getEtapaLabel(config.etapa)}</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`dias-${config.id}`}>Dias Alvo</Label>
          <Input
            id={`dias-${config.id}`}
            type="number"
            min="1"
            value={diasAlvo}
            onChange={(e) => setDiasAlvo(parseInt(e.target.value, 10))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`cor-dentro-${config.id}`}>Cor: Dentro do Prazo</Label>
          <Select value={corDentroPrazo} onValueChange={setCorDentroPrazo}>
            <SelectTrigger id={`cor-dentro-${config.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="success">{getCorLabel('success')}</SelectItem>
              <SelectItem value="warning">{getCorLabel('warning')}</SelectItem>
              <SelectItem value="destructive">{getCorLabel('destructive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`cor-zero-${config.id}`}>Cor: Dia Zero</Label>
          <Select value={corDiaZero} onValueChange={setCorDiaZero}>
            <SelectTrigger id={`cor-zero-${config.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="success">{getCorLabel('success')}</SelectItem>
              <SelectItem value="warning">{getCorLabel('warning')}</SelectItem>
              <SelectItem value="destructive">{getCorLabel('destructive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`cor-fora-${config.id}`}>Cor: Fora do Prazo</Label>
          <Select value={corForaPrazo} onValueChange={setCorForaPrazo}>
            <SelectTrigger id={`cor-fora-${config.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="success">{getCorLabel('success')}</SelectItem>
              <SelectItem value="warning">{getCorLabel('warning')}</SelectItem>
              <SelectItem value="destructive">{getCorLabel('destructive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasChanges && (
        <Button onClick={handleSave} className="w-full gap-2">
          <Save className="w-4 h-4" />
          Salvar Alterações
        </Button>
      )}
    </div>
  );
};

export default SLAConfigPage;
