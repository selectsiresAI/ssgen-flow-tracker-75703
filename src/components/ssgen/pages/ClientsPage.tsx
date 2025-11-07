import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, X } from 'lucide-react';
import { HeaderBar } from '../shared/HeaderBar';
import { fetchClients, createClient, updateClient, deleteClient } from '@/lib/clientsApi';
import type { Client } from '@/types/ssgen';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface ClientsPageProps {
  profile: { rep?: string | null; coord?: string | null };
}

const ClientsPage: React.FC<ClientsPageProps> = ({ profile }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    ordem_servico_ssgen: '',
    data: '',
    ordem_servico_neogen: '',
    nome: '',
    cpf_cnpj: '',
    ie_rg: '',
    codigo: '',
    status: '',
    representante: profile.rep || '',
    coordenador: profile.coord || '',
    id_conta_ssgen: '',
  });

  const { data: coordenadores = [] } = useQuery({
    queryKey: ['coordenadores'],
    queryFn: async () => {
      const { data } = await supabase
        .from('coordenadores')
        .select('nome')
        .eq('ativo', true)
        .order('nome');
      return data || [];
    },
  });

  const { data: representantes = [] } = useQuery({
    queryKey: ['representantes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('representantes')
        .select('nome')
        .eq('ativo', true)
        .order('nome');
      return data || [];
    },
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const data = await fetchClients();
    setClients(data);
  };

  const resetForm = () => {
    setFormData({
      ordem_servico_ssgen: '',
      data: '',
      ordem_servico_neogen: '',
      nome: '',
      cpf_cnpj: '',
      ie_rg: '',
      codigo: '',
      status: '',
      representante: profile.rep || '',
      coordenador: profile.coord || '',
      id_conta_ssgen: '',
    });
    setEditingClient(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const clientData = {
        ordem_servico_ssgen: Number(formData.ordem_servico_ssgen),
        data: formData.data,
        ordem_servico_neogen: formData.ordem_servico_neogen ? Number(formData.ordem_servico_neogen) : null,
        nome: formData.nome,
        cpf_cnpj: Number(formData.cpf_cnpj),
        ie_rg: formData.ie_rg ? Number(formData.ie_rg) : null,
        codigo: formData.codigo ? Number(formData.codigo) : null,
        status: formData.status || null,
        representante: formData.representante,
        coordenador: formData.coordenador,
        id_conta_ssgen: formData.id_conta_ssgen ? Number(formData.id_conta_ssgen) : null,
      };

      if (editingClient) {
        await updateClient(editingClient.ordem_servico_ssgen, clientData);
        toast({ title: 'Cliente atualizado com sucesso!' });
      } else {
        await createClient(clientData);
        toast({ title: 'Cliente cadastrado com sucesso!' });
      }

      loadClients();
      resetForm();
    } catch (error: any) {
      toast({ 
        title: 'Erro ao salvar cliente', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      ordem_servico_ssgen: String(client.ordem_servico_ssgen),
      data: client.data,
      ordem_servico_neogen: client.ordem_servico_neogen ? String(client.ordem_servico_neogen) : '',
      nome: client.nome,
      cpf_cnpj: String(client.cpf_cnpj),
      ie_rg: client.ie_rg ? String(client.ie_rg) : '',
      codigo: client.codigo ? String(client.codigo) : '',
      status: client.status || '',
      representante: client.representante,
      coordenador: client.coordenador,
      id_conta_ssgen: client.id_conta_ssgen ? String(client.id_conta_ssgen) : '',
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <HeaderBar title="Clientes" query="" setQuery={() => {}}>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        )}
      </HeaderBar>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ordem_servico_ssgen">Ordem de Serviço SSGen *</Label>
                  <Input
                    id="ordem_servico_ssgen"
                    type="number"
                    required
                    disabled={!!editingClient}
                    value={formData.ordem_servico_ssgen}
                    onChange={(e) => setFormData({ ...formData, ordem_servico_ssgen: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    required
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ordem_servico_neogen">Ordem de Serviço Neogen</Label>
                  <Input
                    id="ordem_servico_neogen"
                    type="number"
                    value={formData.ordem_servico_neogen}
                    onChange={(e) => setFormData({ ...formData, ordem_servico_neogen: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
                  <Input
                    id="cpf_cnpj"
                    type="number"
                    required
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ie_rg">IE/RG</Label>
                  <Input
                    id="ie_rg"
                    type="number"
                    value={formData.ie_rg}
                    onChange={(e) => setFormData({ ...formData, ie_rg: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    type="number"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="representante">Representante *</Label>
                  <Select
                    value={formData.representante}
                    onValueChange={(value) => setFormData({ ...formData, representante: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um representante" />
                    </SelectTrigger>
                    <SelectContent>
                      {representantes.map((rep) => (
                        <SelectItem key={rep.nome} value={rep.nome}>
                          {rep.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="coordenador">Coordenador *</Label>
                  <Select
                    value={formData.coordenador}
                    onValueChange={(value) => setFormData({ ...formData, coordenador: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um coordenador" />
                    </SelectTrigger>
                    <SelectContent>
                      {coordenadores.map((coord) => (
                        <SelectItem key={coord.nome} value={coord.nome}>
                          {coord.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="id_conta_ssgen">ID Conta SSGen</Label>
                  <Input
                    id="id_conta_ssgen"
                    type="number"
                    value={formData.id_conta_ssgen}
                    onChange={(e) => setFormData({ ...formData, id_conta_ssgen: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="gap-2">
                  <Save className="w-4 h-4" />
                  Salvar
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setFormData({
                      ordem_servico_ssgen: '',
                      data: '',
                      ordem_servico_neogen: '',
                      nome: '',
                      cpf_cnpj: '',
                      ie_rg: '',
                      codigo: '',
                      status: '',
                      representante: profile.rep || '',
                      coordenador: profile.coord || '',
                      id_conta_ssgen: '',
                    });
                  }}
                >
                  Limpar
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OS SSGen</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Representante</TableHead>
                  <TableHead>Coordenador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Nenhum cliente cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.ordem_servico_ssgen}>
                      <TableCell>{client.ordem_servico_ssgen}</TableCell>
                      <TableCell>{new Date(client.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{client.nome}</TableCell>
                      <TableCell>{client.cpf_cnpj}</TableCell>
                      <TableCell>{client.representante}</TableCell>
                      <TableCell>{client.coordenador}</TableCell>
                      <TableCell>{client.status || '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(client)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (confirm('Tem certeza que deseja excluir este cliente?')) {
                                try {
                                  await deleteClient(client.ordem_servico_ssgen);
                                  toast({ title: 'Cliente excluído com sucesso!' });
                                  loadClients();
                                } catch (error: any) {
                                  toast({ 
                                    title: 'Erro ao excluir cliente', 
                                    description: error.message,
                                    variant: 'destructive' 
                                  });
                                }
                              }
                            }}
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsPage;
