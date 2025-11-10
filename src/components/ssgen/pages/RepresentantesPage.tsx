import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeaderBar } from '../shared/HeaderBar';
import { fetchRepresentantes, createRepresentante, updateRepresentante, deleteRepresentante, Representante } from '@/lib/representantesApi';
import { fetchCoordenadores } from '@/lib/coordenadoresApi';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const RepresentantesPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Representante | null>(null);
  const [formData, setFormData] = useState({ nome: '', email: '', coordenador_nome: '' });

  const queryClient = useQueryClient();

  const { data: representantes = [], isLoading } = useQuery({
    queryKey: ['representantes'],
    queryFn: fetchRepresentantes,
  });

  const { data: coordenadores = [] } = useQuery({
    queryKey: ['coordenadores'],
    queryFn: fetchCoordenadores,
  });

  const createMutation = useMutation({
    mutationFn: createRepresentante,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representantes'] });
      toast.success('Representante criado com sucesso!');
      setIsDialogOpen(false);
      setFormData({ nome: '', email: '', coordenador_nome: '' });
    },
    onError: () => toast.error('Erro ao criar representante'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Representante> }) =>
      updateRepresentante(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representantes'] });
      toast.success('Representante atualizado com sucesso!');
      setIsDialogOpen(false);
      setEditingRep(null);
      setFormData({ nome: '', email: '', coordenador_nome: '' });
    },
    onError: () => toast.error('Erro ao atualizar representante'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRepresentante,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representantes'] });
      toast.success('Representante removido com sucesso!');
    },
    onError: () => toast.error('Erro ao remover representante'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.coordenador_nome) {
      toast.error('Selecione um coordenador');
      return;
    }
    if (editingRep) {
      updateMutation.mutate({ id: editingRep.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, ativo: true });
    }
  };

  const handleEdit = (rep: Representante) => {
    setEditingRep(rep);
    setFormData({ nome: rep.nome, email: rep.email || '', coordenador_nome: rep.coordenador_nome || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este representante?')) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = representantes.filter((r) =>
    r.nome.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <HeaderBar title="Representantes" query={query} setQuery={setQuery} />
      
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingRep(null);
          setFormData({ nome: '', email: '', coordenador_nome: '' });
        }
      }}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Representante
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRep ? 'Editar' : 'Novo'} Representante</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="coordenador_nome">Coordenador *</Label>
              <select
                id="coordenador_nome"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={formData.coordenador_nome}
                onChange={(e) => setFormData({ ...formData, coordenador_nome: e.target.value })}
                required
              >
                <option value="">Selecione um coordenador</option>
                {coordenadores
                  .filter((coord) => coord.nome && coord.nome.trim() !== '')
                  .map((coord) => (
                    <option key={coord.id ?? coord.nome} value={String(coord.nome)}>
                      {coord.nome}
                    </option>
                  ))}
              </select>
            </div>
            <Button type="submit" className="w-full">
              {editingRep ? 'Atualizar' : 'Criar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Representantes ({filtered.length})
            {isLoading && <span className="text-sm font-normal ml-2">Carregando...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando representantes...
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((rep) => (
                <div
                  key={rep.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-base">{rep.nome}</div>
                    {rep.coordenador_nome && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Coordenador: {rep.coordenador_nome}
                      </div>
                    )}
                    {rep.email && (
                      <div className="text-sm text-muted-foreground mt-1">{rep.email}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(rep)}
                      title="Editar representante"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(rep.id)}
                      title="Remover representante"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                  <p className="text-lg mb-2">Nenhum representante encontrado</p>
                  {query && (
                    <p className="text-sm">Tente ajustar sua busca ou adicionar um novo representante</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RepresentantesPage;
