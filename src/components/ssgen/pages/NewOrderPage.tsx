import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { HeaderBar } from '../shared/HeaderBar';
import { fetchClients } from '@/lib/clientsApi';
import { createServiceOrder } from '@/lib/serviceOrdersApi';
import { getProfile } from '@/lib/ssgenClient';
import type { Client } from '@/types/ssgen';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const NewOrderPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  const [formData, setFormData] = useState({
    // Dados básicos
    numero_nf_neogen: '',
    nome_produto: '',
    numero_amostras: '',
    
    // CRA
    cra_data: '',
    cra_status: '',
    
    // Envio Planilha
    envio_planilha_data: '',
    envio_planilha_status: '',
    
    // VRI
    vri_data: '',
    vri_n_amostras: '',
    
    // LPR
    lpr_data: '',
    lpr_n_amostras: '',
    
    // Liberação
    liberacao_data: '',
    liberacao_n_amostras: '',
    
    // Envio Resultados
    envio_resultados_data: '',
    envio_resultados_ordem_id: '',
    envio_resultados_previsao: '',
    envio_resultados_status: '',
    envio_resultados_data_prova: '',
  });

  useEffect(() => {
    const loadInitialData = async () => {
      const profile = await getProfile();
      const admin = profile?.role === 'ADM';
      setIsAdmin(admin);
      if (admin) {
        const data = await fetchClients();
        setClients(data);
      }
      setProfileChecked(true);
    };
    loadInitialData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Apenas administradores podem cadastrar ordens.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedClient) {
      toast({
        title: 'Erro',
        description: 'Selecione um cliente',
        variant: 'destructive' 
      });
      return;
    }

    try {
      const orderData = {
        ordem_servico_ssgen: selectedClient.ordem_servico_ssgen,
        ordem_servico_neogen: selectedClient.ordem_servico_neogen || null,
        numero_nf_neogen: formData.numero_nf_neogen ? Number(formData.numero_nf_neogen) : null,
        nome_produto: formData.nome_produto || null,
        numero_amostras: formData.numero_amostras ? Number(formData.numero_amostras) : null,
        
        cra_data: formData.cra_data || null,
        cra_status: formData.cra_status || null,
        
        envio_planilha_data: formData.envio_planilha_data || null,
        envio_planilha_status: formData.envio_planilha_status || null,
        
        vri_data: formData.vri_data || null,
        vri_n_amostras: formData.vri_n_amostras ? Number(formData.vri_n_amostras) : null,
        
        lpr_data: formData.lpr_data || null,
        lpr_n_amostras: formData.lpr_n_amostras ? Number(formData.lpr_n_amostras) : null,
        
        liberacao_data: formData.liberacao_data || null,
        liberacao_n_amostras: formData.liberacao_n_amostras ? Number(formData.liberacao_n_amostras) : null,
        
        envio_resultados_data: formData.envio_resultados_data || null,
        envio_resultados_ordem_id: formData.envio_resultados_ordem_id ? Number(formData.envio_resultados_ordem_id) : null,
        envio_resultados_previsao: formData.envio_resultados_previsao || null,
        envio_resultados_status: formData.envio_resultados_status || null,
        envio_resultados_data_prova: formData.envio_resultados_data_prova || null,
      };

      await createServiceOrder(orderData);
      toast({ title: 'Ordem cadastrada com sucesso!' });
      
      // Reset form
      setSelectedClient(null);
      setFormData({
        numero_nf_neogen: '',
        nome_produto: '',
        numero_amostras: '',
        cra_data: '',
        cra_status: '',
        envio_planilha_data: '',
        envio_planilha_status: '',
        vri_data: '',
        vri_n_amostras: '',
        lpr_data: '',
        lpr_n_amostras: '',
        liberacao_data: '',
        liberacao_n_amostras: '',
        envio_resultados_data: '',
        envio_resultados_ordem_id: '',
        envio_resultados_previsao: '',
        envio_resultados_status: '',
        envio_resultados_data_prova: '',
      });
    } catch (error: any) {
      toast({ 
        title: 'Erro ao cadastrar ordem', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };

  if (!profileChecked) {
    return <div className="flex items-center justify-center p-8 text-muted-foreground">Carregando...</div>;
  }

  if (!isAdmin) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Apenas administradores podem cadastrar novas ordens de serviço.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <HeaderBar title="Nova Ordem de Serviço" query="" setQuery={() => {}} />

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select
              value={selectedClient ? String(selectedClient.ordem_servico_ssgen) : ''}
              onValueChange={(value) => {
                const client = clients.find(c => String(c.ordem_servico_ssgen) === value);
                setSelectedClient(client || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.ordem_servico_ssgen} value={String(client.ordem_servico_ssgen)}>
                    {client.ordem_servico_ssgen} - {client.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClient && (
              <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                <p><strong>Nome:</strong> {selectedClient.nome}</p>
                <p><strong>Representante:</strong> {selectedClient.representante}</p>
                <p><strong>Coordenador:</strong> {selectedClient.coordenador}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedClient && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados Básicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="numero_nf_neogen">Número da Nota Fiscal Neogen</Label>
                  <Input
                    id="numero_nf_neogen"
                    type="number"
                    value={formData.numero_nf_neogen}
                    onChange={(e) => setFormData({ ...formData, numero_nf_neogen: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="nome_produto">Nome do produto</Label>
                  <Input
                    id="nome_produto"
                    value={formData.nome_produto}
                    onChange={(e) => setFormData({ ...formData, nome_produto: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="numero_amostras">Número de Amostras</Label>
                  <Input
                    id="numero_amostras"
                    type="number"
                    value={formData.numero_amostras}
                    onChange={(e) => setFormData({ ...formData, numero_amostras: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Processos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CRA */}
              <div>
                <h3 className="font-semibold mb-3">CRA</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cra_data">Data</Label>
                    <Input
                      id="cra_data"
                      type="date"
                      value={formData.cra_data}
                      onChange={(e) => setFormData({ ...formData, cra_data: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cra_status">Status</Label>
                    <Input
                      id="cra_status"
                      value={formData.cra_status}
                      onChange={(e) => setFormData({ ...formData, cra_status: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Envio de Planilha */}
              <div>
                <h3 className="font-semibold mb-3">Envio de Planilha</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="envio_planilha_data">Data</Label>
                    <Input
                      id="envio_planilha_data"
                      type="date"
                      value={formData.envio_planilha_data}
                      onChange={(e) => setFormData({ ...formData, envio_planilha_data: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="envio_planilha_status">Status</Label>
                    <Input
                      id="envio_planilha_status"
                      value={formData.envio_planilha_status}
                      onChange={(e) => setFormData({ ...formData, envio_planilha_status: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* VRI */}
              <div>
                <h3 className="font-semibold mb-3">VRI</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vri_data">Data</Label>
                    <Input
                      id="vri_data"
                      type="date"
                      value={formData.vri_data}
                      onChange={(e) => setFormData({ ...formData, vri_data: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vri_n_amostras">Nº Amostras</Label>
                    <Input
                      id="vri_n_amostras"
                      type="number"
                      value={formData.vri_n_amostras}
                      onChange={(e) => setFormData({ ...formData, vri_n_amostras: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* LPR */}
              <div>
                <h3 className="font-semibold mb-3">LPR</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lpr_data">Data</Label>
                    <Input
                      id="lpr_data"
                      type="date"
                      value={formData.lpr_data}
                      onChange={(e) => setFormData({ ...formData, lpr_data: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lpr_n_amostras">Nº Amostras</Label>
                    <Input
                      id="lpr_n_amostras"
                      type="number"
                      value={formData.lpr_n_amostras}
                      onChange={(e) => setFormData({ ...formData, lpr_n_amostras: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Liberação Resultados */}
              <div>
                <h3 className="font-semibold mb-3">Liberação Resultados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="liberacao_data">Data</Label>
                    <Input
                      id="liberacao_data"
                      type="date"
                      value={formData.liberacao_data}
                      onChange={(e) => setFormData({ ...formData, liberacao_data: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="liberacao_n_amostras">Nº Amostras</Label>
                    <Input
                      id="liberacao_n_amostras"
                      type="number"
                      value={formData.liberacao_n_amostras}
                      onChange={(e) => setFormData({ ...formData, liberacao_n_amostras: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Envio de Resultados */}
              <div>
                <h3 className="font-semibold mb-3">Envio de Resultados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="envio_resultados_data">Data</Label>
                    <Input
                      id="envio_resultados_data"
                      type="date"
                      value={formData.envio_resultados_data}
                      onChange={(e) => setFormData({ ...formData, envio_resultados_data: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="envio_resultados_ordem_id">Ordem ID</Label>
                    <Input
                      id="envio_resultados_ordem_id"
                      type="number"
                      value={formData.envio_resultados_ordem_id}
                      onChange={(e) => setFormData({ ...formData, envio_resultados_ordem_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="envio_resultados_previsao">Previsão</Label>
                    <Input
                      id="envio_resultados_previsao"
                      type="date"
                      value={formData.envio_resultados_previsao}
                      onChange={(e) => setFormData({ ...formData, envio_resultados_previsao: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="envio_resultados_status">Status</Label>
                    <Input
                      id="envio_resultados_status"
                      value={formData.envio_resultados_status}
                      onChange={(e) => setFormData({ ...formData, envio_resultados_status: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="envio_resultados_data_prova">Data Prova</Label>
                    <Input
                      id="envio_resultados_data_prova"
                      value={formData.envio_resultados_data_prova}
                      onChange={(e) => setFormData({ ...formData, envio_resultados_data_prova: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="gap-2">
            <Save className="w-4 h-4" />
            Salvar Ordem
          </Button>
        </form>
      )}
    </div>
  );
};

export default NewOrderPage;
